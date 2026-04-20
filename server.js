import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import JSZip from "jszip";
import * as XLSX from "xlsx";

import {
  canDeleteWorkOrders,
  canManageMasterData,
  canManageWorkOrders,
} from "./src/accessControl.js";
import {
  buildOfferPdfBuffer,
  buildPurchaseOrderPdfBuffer,
  buildPdfFromTemplateBuffer,
  buildDocxFromTemplateBuffer,
  isWordTemplateFile,
  mergePdfBuffers,
  readStoredDocumentBuffer,
  sanitizeGeneratedDocumentFileName,
} from "./src/documentExport.js";
import { createLiveChatStore } from "./src/liveChatStore.js";
import { sendMail } from "./src/mailer.js";
import { createSafetyRepository } from "./src/safetyRepository.js";
import { createTenantRepository } from "./src/tenantRepository.js";
import {
  clearAuthCookies,
  createAccessToken,
  createAuthCookies,
  createRefreshToken,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  parseCookies,
  resolveJwtSecret,
  verifyToken,
} from "./src/webAuth.js";
import { doesAbsenceTypeRequireApproval } from "./src/safetyModel.js";

const port = Number(process.env.PORT || 3000);
const rootDir = resolve(process.cwd());
const distDir = resolve(rootDir, "dist");
const staticRoot = existsSync(resolve(distDir, "index.html")) ? distDir : rootDir;
const requestUserSymbol = Symbol("requestUser");
const jwtSecret = resolveJwtSecret();
const publicAppUrl = String(process.env.PUBLIC_APP_URL || process.env.APP_URL || "").trim().replace(/\/+$/, "");
const canonicalAppOrigin = (() => {
  if (!publicAppUrl) {
    return "";
  }

  try {
    return new URL(publicAppUrl).origin;
  } catch {
    console.warn(`Invalid PUBLIC_APP_URL/APP_URL value "${publicAppUrl}", canonical redirect disabled.`);
    return "";
  }
})();
const canonicalAppHost = canonicalAppOrigin ? new URL(canonicalAppOrigin).host.toLowerCase() : "";
const securityContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://unpkg.com",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob: data: https:",
  "upgrade-insecure-requests",
].join("; ");

function sleep(durationMs) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, durationMs);
  });
}

async function createRepositoryWithRetry() {
  const attempts = process.env.DATABASE_URL ? 6 : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const [domainRepository, tenantRepository] = await Promise.all([
        createSafetyRepository(),
        createTenantRepository(),
      ]);

      return {
        domainRepository,
        tenantRepository,
      };
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      console.warn(`Repository init failed (attempt ${attempt}/${attempts}). Retrying in 2s...`);
      await sleep(2_000);
    }
  }

  throw lastError;
}

const { domainRepository, tenantRepository } = await createRepositoryWithRetry();
const liveChatStore = createLiveChatStore();

const contentTypes = {
  ".ico": "image/x-icon",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

function sendBinary(response, statusCode, body, {
  contentType = "application/octet-stream",
  fileName = "",
} = {}) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", contentType);
  if (fileName) {
    response.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/"/g, "")}"`);
  }
  response.end(body);
}

const MEASUREMENT_EQUIPMENT_CARD_TEMPLATE_CATEGORY = "karton_template";
const MEASUREMENT_EQUIPMENT_DOCUMENT_CATEGORY_LABELS = Object.freeze({
  racun: "Racun",
  umjernica: "Umjernica",
  karton_uredaja: "Karton uredaja",
  slika_uredaja: "Slika uredaja",
  servisni_zapis: "Servisni zapis",
  upute: "Upute / dokumentacija",
  ostalo: "Ostalo",
});

function normalizeMeasurementEquipmentDocumentCategoryValue(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function getMeasurementEquipmentDocumentCategoryLabel(value = "") {
  const normalized = normalizeMeasurementEquipmentDocumentCategoryValue(value);
  return MEASUREMENT_EQUIPMENT_DOCUMENT_CATEGORY_LABELS[normalized] || normalized || "Dokument";
}

function normalizeDateOnlyValue(value = "") {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match?.[1]) {
    return match[1];
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) {
    return "";
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function isMeasurementEquipmentCalibrationValid(item = {}, todayIso = new Date().toISOString().slice(0, 10)) {
  if (!item?.requiresCalibration) {
    return false;
  }
  const validUntil = normalizeDateOnlyValue(item.validUntil);
  if (!validUntil) {
    return false;
  }
  return validUntil >= todayIso;
}

function getMeasurementEquipmentCalibrationStatusLabel(item = {}, todayIso = new Date().toISOString().slice(0, 10)) {
  if (!item?.requiresCalibration) {
    return "Ne treba";
  }
  const validUntil = normalizeDateOnlyValue(item.validUntil);
  if (!validUntil) {
    return "Bez roka";
  }
  return validUntil >= todayIso ? "Vazeca" : "Istekla";
}

function parseDateSortValue(value = "") {
  const normalized = normalizeDateOnlyValue(value);
  if (!normalized) {
    return 0;
  }
  const parsed = Date.parse(`${normalized}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortMeasurementEquipmentActivityEntries(entries = []) {
  return [...(Array.isArray(entries) ? entries : [])].sort((left, right) => {
    const rightScore = parseDateSortValue(right?.performedOn || right?.updatedAt || right?.createdAt);
    const leftScore = parseDateSortValue(left?.performedOn || left?.updatedAt || left?.createdAt);
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }
    return String(right?.id || "").localeCompare(String(left?.id || ""));
  });
}

function buildMeasurementEquipmentLatestActivitySummary(item = {}, activityType = "") {
  const normalizedType = normalizeInputValue(activityType).toLowerCase();
  const latest = sortMeasurementEquipmentActivityEntries(item.activityItems ?? [])
    .find((entry) => normalizeInputValue(entry?.activityType).toLowerCase() === normalizedType);
  if (!latest) {
    return "";
  }

  const parts = [];
  if (latest.performedOn) {
    parts.push(normalizeDateOnlyValue(latest.performedOn));
  }
  if (normalizedType === "umjeravanje") {
    if (latest.validUntil) {
      parts.push(`vrijedi do ${normalizeDateOnlyValue(latest.validUntil)}`);
    }
    if (latest.satisfies) {
      parts.push(`zadovoljava ${normalizeInputValue(latest.satisfies).toUpperCase()}`);
    }
  } else {
    if (latest.performedBy) {
      parts.push(normalizeInputValue(latest.performedBy));
    }
    if (latest.note) {
      parts.push(normalizeInputValue(latest.note));
    }
  }
  return parts.filter(Boolean).join(" · ");
}

function escapeCsvCell(value = "") {
  const normalized = value === null || value === undefined
    ? ""
    : String(value).replace(/\r?\n/g, " ").trim();
  return `"${normalized.replace(/"/g, "\"\"")}"`;
}

function buildCsvBuffer(rows = []) {
  const lines = (Array.isArray(rows) ? rows : []).map((row) => (
    (Array.isArray(row) ? row : [row]).map((entry) => escapeCsvCell(entry)).join(";")
  ));
  return Buffer.from(`\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

function sanitizeExcelSheetName(value = "", fallback = "Popis") {
  const cleaned = String(value ?? "")
    .replace(/[\\/*?:[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const safe = cleaned || fallback;
  return safe.slice(0, 31);
}

function buildMeasurementEquipmentListXlsxBuffer(rows = [], sheetName = "Mjerna oprema") {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  const worksheet = XLSX.utils.aoa_to_sheet(normalizedRows);
  const maxColumns = normalizedRows.reduce((max, row) => (
    Math.max(max, Array.isArray(row) ? row.length : 1)
  ), 0);

  if (maxColumns > 0) {
    worksheet["!cols"] = Array.from({ length: maxColumns }, (_, columnIndex) => {
      const longest = normalizedRows.reduce((width, row) => {
        const value = Array.isArray(row) ? row[columnIndex] : row;
        return Math.max(width, String(value ?? "").length);
      }, 10);
      return { wch: Math.min(Math.max(longest + 2, 12), 56) };
    });

    if (normalizedRows.length > 1) {
      worksheet["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: normalizedRows.length - 1, c: maxColumns - 1 },
        }),
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeExcelSheetName(sheetName, "Popis"));
  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });
}

function sanitizeZipPathSegment(value = "", fallback = "stavka") {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized.slice(0, 120) : fallback;
}

function buildUniqueZipPath(filePath = "", usedPaths = new Set()) {
  if (!usedPaths.has(filePath)) {
    usedPaths.add(filePath);
    return filePath;
  }
  const extension = extname(filePath);
  const base = extension ? filePath.slice(0, -extension.length) : filePath;
  let counter = 2;
  let candidate = `${base} (${counter})${extension}`;
  while (usedPaths.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${extension}`;
  }
  usedPaths.add(candidate);
  return candidate;
}

function sortMeasurementEquipmentDocumentsByUpdatedAt(documents = []) {
  return [...(Array.isArray(documents) ? documents : [])].sort((left, right) => {
    const rightScore = parseDateSortValue(right?.updatedAt || right?.createdAt);
    const leftScore = parseDateSortValue(left?.updatedAt || left?.createdAt);
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }
    return String(right?.id || "").localeCompare(String(left?.id || ""));
  });
}

function collectMeasurementEquipmentDocumentsForZip(
  item = {},
  selectedCategories = new Set(),
  {
    onlyValidCalibrationCertificates = false,
    todayIso = new Date().toISOString().slice(0, 10),
  } = {},
) {
  const docs = (Array.isArray(item.documents) ? item.documents : [])
    .map((document) => ({
      ...document,
      normalizedCategory: normalizeMeasurementEquipmentDocumentCategoryValue(document?.documentCategory),
    }))
    .filter((document) => {
      if (!document?.fileName) {
        return false;
      }
      if (!document.normalizedCategory || document.normalizedCategory === MEASUREMENT_EQUIPMENT_CARD_TEMPLATE_CATEGORY) {
        return false;
      }
      return selectedCategories.size === 0 || selectedCategories.has(document.normalizedCategory);
    });

  if (docs.length === 0) {
    return [];
  }

  const byCategory = new Map();
  docs.forEach((document) => {
    if (!byCategory.has(document.normalizedCategory)) {
      byCategory.set(document.normalizedCategory, []);
    }
    byCategory.get(document.normalizedCategory).push(document);
  });

  const orderedCategories = selectedCategories.size > 0
    ? [...selectedCategories]
    : [...byCategory.keys()];
  const results = [];

  orderedCategories.forEach((category) => {
    const categoryDocuments = sortMeasurementEquipmentDocumentsByUpdatedAt(byCategory.get(category) ?? []);
    if (categoryDocuments.length === 0) {
      return;
    }
    if (category === "umjernica" && onlyValidCalibrationCertificates) {
      if (!isMeasurementEquipmentCalibrationValid(item, todayIso)) {
        return;
      }
      results.push(categoryDocuments[0]);
      return;
    }
    results.push(...categoryDocuments);
  });

  return results;
}

async function generatePdfBufferForTemplate(template = {}, {
  placeholders = {},
  fileName = "",
} = {}) {
  if (!template.referenceDocument) {
    throw new Error("Template još nema učitan Word predložak. PDF i Word moraju koristiti isti .docx predložak.");
  }

  if (!isWordTemplateFile(template.referenceDocument)) {
    throw new Error("Za PDF export učitaj .docx ili .dotx Word predložak. PDF i Word moraju koristiti isti predložak.");
  }

  const referenceDocument = await readStoredDocumentBuffer(template.referenceDocument);
  return await buildPdfFromTemplateBuffer(referenceDocument.buffer, placeholders, {
    fileName: fileName || template.outputFileName || template.title || "zapisnik.docx",
  });
}

function formatOfferDocumentDate(value = "") {
  const normalized = String(value ?? "").trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return normalized;
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}

function formatOfferTemplateMoney(value = 0, currency = "EUR") {
  const numeric = Number(value ?? 0) || 0;

  try {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: String(currency || "EUR").trim() || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${numeric.toFixed(2)} ${String(currency || "EUR").trim().toUpperCase() || "EUR"}`;
  }
}

function getOfferStatusLabel(value = "") {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "sent") {
    return "Poslano";
  }
  if (normalized === "accepted") {
    return "Prihvaceno";
  }
  if (normalized === "rejected") {
    return "Odbijeno";
  }
  return "Skica";
}

function getPurchaseOrderStatusLabel(value = "") {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "received") {
    return "Zaprimljena";
  }
  if (normalized === "issued") {
    return "Poslana";
  }
  if (normalized === "confirmed") {
    return "Potvrdena";
  }
  if (normalized === "closed") {
    return "Zatvorena";
  }
  return "Skica";
}

function buildOfferTemplatePlaceholderPayload(offer = {}) {
  const normalizedOffer = offer && typeof offer === "object" ? offer : {};
  const currency = String(normalizedOffer.currency || "EUR").trim() || "EUR";
  const items = Array.isArray(normalizedOffer.items) ? normalizedOffer.items : [];
  const itemsSummary = items
    .map((item, index) => `${index + 1}. ${item.description || "Stavka"}${item.unit ? ` · ${item.quantity || 0} ${item.unit}` : ""}${Number(item.totalPrice || 0) > 0 ? ` · ${formatOfferTemplateMoney(item.totalPrice || 0, currency)}` : ""}`)
    .join("\n");
  const itemsTable = items
    .map((item, index) => {
      const breakdownText = Array.isArray(item.breakdowns) && item.breakdowns.length > 0
        ? `\n${item.breakdowns.map((entry) => `   - ${entry.label || "Razrada"}: ${formatOfferTemplateMoney(entry.amount || 0, currency)}`).join("\n")}`
        : "";
      return `${index + 1}. ${item.description || "Stavka"} | ${item.quantity || 0} ${item.unit || ""} | ${formatOfferTemplateMoney(item.totalPrice || 0, currency)}${breakdownText}`;
    })
    .join("\n");

  return {
    OFFER_NUMBER: normalizedOffer.offerNumber || "Dodijeljen nakon spremanja",
    OFFER_TITLE: normalizedOffer.title || "",
    OFFER_STATUS: getOfferStatusLabel(normalizedOffer.status || "draft"),
    OFFER_DATE: normalizedOffer.offerDate ? formatOfferDocumentDate(normalizedOffer.offerDate) : "",
    VALID_UNTIL: normalizedOffer.validUntil ? formatOfferDocumentDate(normalizedOffer.validUntil) : "",
    COMPANY_NAME: normalizedOffer.companyName || "",
    COMPANY_OIB: normalizedOffer.companyOib || "",
    COMPANY_HEADQUARTERS: normalizedOffer.headquarters || "",
    LOCATION_SUMMARY: normalizedOffer.locationName || "Bez lokacije",
    LOCATION_LIST: Array.isArray(normalizedOffer.selectedLocationNames) && normalizedOffer.selectedLocationNames.length > 0
      ? normalizedOffer.selectedLocationNames.join("\n")
      : "Bez lokacije",
    CONTACT_NAME: normalizedOffer.contactName || "",
    CONTACT_PHONE: normalizedOffer.contactPhone || "",
    CONTACT_EMAIL: normalizedOffer.contactEmail || "",
    SERVICE_LINE: normalizedOffer.serviceLine || "",
    ITEMS_TABLE: itemsTable,
    ITEMS_SUMMARY: itemsSummary,
    NOTE: normalizedOffer.note || "",
    SUBTOTAL: formatOfferTemplateMoney(normalizedOffer.subtotal || 0, currency),
    DISCOUNT_RATE: Number(normalizedOffer.discountRate || 0) > 0 ? `${normalizedOffer.discountRate}%` : "",
    DISCOUNT_TOTAL: formatOfferTemplateMoney(normalizedOffer.discountTotal || 0, currency),
    TAX_RATE: `${normalizedOffer.taxRate || 0}%`,
    TAX_TOTAL: formatOfferTemplateMoney(normalizedOffer.taxTotal || 0, currency),
    TOTAL: formatOfferTemplateMoney(normalizedOffer.total || 0, currency),
  };
}

function buildPurchaseOrderTemplatePlaceholderPayload(purchaseOrder = {}) {
  const normalizedPurchaseOrder = purchaseOrder && typeof purchaseOrder === "object" ? purchaseOrder : {};
  const currency = String(normalizedPurchaseOrder.currency || "EUR").trim() || "EUR";
  const items = Array.isArray(normalizedPurchaseOrder.items) ? normalizedPurchaseOrder.items : [];
  const itemsSummary = items
    .map((item, index) => `${index + 1}. ${item.description || "Stavka"}${item.unit ? ` · ${item.quantity || 0} ${item.unit}` : ""}${Number(item.totalPrice || 0) > 0 ? ` · ${formatOfferTemplateMoney(item.totalPrice || 0, currency)}` : ""}`)
    .join("\n");
  const itemsTable = items
    .map((item, index) => {
      const breakdownText = Array.isArray(item.breakdowns) && item.breakdowns.length > 0
        ? `\n${item.breakdowns.map((entry) => `   - ${entry.label || "Razrada"}: ${formatOfferTemplateMoney(entry.amount || 0, currency)}`).join("\n")}`
        : "";
      return `${index + 1}. ${item.description || "Stavka"} | ${item.quantity || 0} ${item.unit || ""} | ${formatOfferTemplateMoney(item.totalPrice || 0, currency)}${breakdownText}`;
    })
    .join("\n");

  return {
    PURCHASE_ORDER_NUMBER: normalizedPurchaseOrder.purchaseOrderNumber || "Dodijeljen nakon spremanja",
    PURCHASE_ORDER_TITLE: normalizedPurchaseOrder.title || "",
    PURCHASE_ORDER_STATUS: getPurchaseOrderStatusLabel(normalizedPurchaseOrder.status || "draft"),
    PURCHASE_ORDER_DATE: normalizedPurchaseOrder.purchaseOrderDate ? formatOfferDocumentDate(normalizedPurchaseOrder.purchaseOrderDate) : "",
    VALID_UNTIL: normalizedPurchaseOrder.validUntil ? formatOfferDocumentDate(normalizedPurchaseOrder.validUntil) : "",
    ORDER_DIRECTION: normalizedPurchaseOrder.orderDirection === "outgoing" ? "Izlazna" : "Ulazna",
    EXTERNAL_DOCUMENT_NUMBER: normalizedPurchaseOrder.externalDocumentNumber || "",
    COMPANY_NAME: normalizedPurchaseOrder.companyName || "",
    COMPANY_OIB: normalizedPurchaseOrder.companyOib || "",
    COMPANY_HEADQUARTERS: normalizedPurchaseOrder.headquarters || "",
    LOCATION_SUMMARY: normalizedPurchaseOrder.locationName || "Bez lokacije",
    LOCATION_LIST: Array.isArray(normalizedPurchaseOrder.selectedLocationNames) && normalizedPurchaseOrder.selectedLocationNames.length > 0
      ? normalizedPurchaseOrder.selectedLocationNames.join("\n")
      : "Bez lokacije",
    CONTACT_NAME: normalizedPurchaseOrder.contactName || "",
    CONTACT_PHONE: normalizedPurchaseOrder.contactPhone || "",
    CONTACT_EMAIL: normalizedPurchaseOrder.contactEmail || "",
    SERVICE_LINE: normalizedPurchaseOrder.serviceLine || "",
    ITEMS_TABLE: itemsTable,
    ITEMS_SUMMARY: itemsSummary,
    NOTE: normalizedPurchaseOrder.note || "",
    SUBTOTAL: formatOfferTemplateMoney(normalizedPurchaseOrder.subtotal || 0, currency),
    DISCOUNT_RATE: Number(normalizedPurchaseOrder.discountRate || 0) > 0 ? `${normalizedPurchaseOrder.discountRate}%` : "",
    DISCOUNT_TOTAL: formatOfferTemplateMoney(normalizedPurchaseOrder.discountTotal || 0, currency),
    TAX_RATE: `${normalizedPurchaseOrder.taxRate || 0}%`,
    TAX_TOTAL: formatOfferTemplateMoney(normalizedPurchaseOrder.taxTotal || 0, currency),
    TOTAL: formatOfferTemplateMoney(normalizedPurchaseOrder.total || 0, currency),
  };
}

function getContractStatusLabel(value = "") {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "pending_signature") {
    return "Na potpisu";
  }
  if (normalized === "active") {
    return "Aktivan";
  }
  if (normalized === "expired") {
    return "Istekao";
  }
  if (normalized === "terminated") {
    return "Raskinut";
  }
  return "Skica";
}

function buildContractTemplatePlaceholderPayload(contract = {}) {
  const normalizedContract = contract && typeof contract === "object" ? contract : {};
  const linkedOffers = Array.isArray(normalizedContract.linkedOffers) ? normalizedContract.linkedOffers : [];
  const annexes = Array.isArray(normalizedContract.annexes) ? normalizedContract.annexes : [];

  const offerList = linkedOffers.length > 0
    ? linkedOffers.map((offer, index) => [
      `${index + 1}. ${offer.offerNumber || "Ponuda"}`,
      offer.title || "",
      offer.offerDate ? formatOfferDocumentDate(offer.offerDate) : "",
    ].filter(Boolean).join(" | ")).join("\n")
    : "Nema povezanih ponuda";
  const annexList = annexes.length > 0
    ? annexes.map((annex, index) => [
      `${index + 1}. ${annex.annexNumber || `Aneks ${index + 1}`}`,
      annex.title || "",
      annex.effectiveDate ? formatOfferDocumentDate(annex.effectiveDate) : "",
      annex.note || "",
    ].filter(Boolean).join(" | ")).join("\n")
    : "Bez anexa";

  return {
    CONTRACT_NUMBER: normalizedContract.contractNumber || "Dodijeljen nakon spremanja",
    CONTRACT_TITLE: normalizedContract.title || "",
    CONTRACT_STATUS: getContractStatusLabel(normalizedContract.status || "draft"),
    TEMPLATE_NAME: normalizedContract.templateTitle || "",
    SIGNED_ON: normalizedContract.signedOn ? formatOfferDocumentDate(normalizedContract.signedOn) : "",
    VALID_FROM: normalizedContract.validFrom ? formatOfferDocumentDate(normalizedContract.validFrom) : "",
    VALID_TO: normalizedContract.validTo ? formatOfferDocumentDate(normalizedContract.validTo) : "",
    COMPANY_NAME: normalizedContract.companyName || "",
    COMPANY_OIB: normalizedContract.companyOib || "",
    COMPANY_HEADQUARTERS: normalizedContract.headquarters || "",
    COMPANY_REPRESENTATIVE: normalizedContract.representative || "",
    COMPANY_PHONE: normalizedContract.contactPhone || "",
    COMPANY_EMAIL: normalizedContract.contactEmail || "",
    SUBJECT: normalizedContract.subject || "",
    SCOPE_SUMMARY: normalizedContract.scopeSummary || "",
    NOTE: normalizedContract.note || "",
    OFFER_LIST: offerList,
    ANNEX_LIST: annexList,
  };
}

function escapeEmailHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildOfferExportBaseName(offer = {}) {
  return offer.offerNumber || offer.title || offer.companyName || "ponuda";
}

async function buildOfferPdfExportPayload(offer = {}, organizationId = "") {
  const offerTemplateSettings = await domainRepository.getOfferTemplateSettings(organizationId).catch(() => null);
  const baseName = buildOfferExportBaseName(offer);
  const fileName = sanitizeGeneratedDocumentFileName(baseName, {
    fallback: "ponuda",
    extension: "pdf",
  });

  if (offerTemplateSettings?.referenceDocument && isWordTemplateFile(offerTemplateSettings.referenceDocument)) {
    const referenceDocument = await readStoredDocumentBuffer(offerTemplateSettings.referenceDocument);
    const pdfBuffer = await buildPdfFromTemplateBuffer(
      referenceDocument.buffer,
      buildOfferTemplatePlaceholderPayload(offer),
      {
        fileName: sanitizeGeneratedDocumentFileName(baseName, {
          fallback: "ponuda",
          extension: "docx",
        }),
      },
    );
    return { pdfBuffer, fileName };
  }

  const pdfBuffer = await buildOfferPdfBuffer(offer, { currency: offer.currency || "EUR" });
  return { pdfBuffer, fileName };
}

function buildPurchaseOrderExportBaseName(purchaseOrder = {}) {
  return purchaseOrder.purchaseOrderNumber || purchaseOrder.title || purchaseOrder.companyName || "narudzbenica";
}

async function buildPurchaseOrderPdfExportPayload(purchaseOrder = {}, organizationId = "") {
  const purchaseOrderTemplateSettings = await domainRepository.getPurchaseOrderTemplateSettings(organizationId).catch(() => null);
  const baseName = buildPurchaseOrderExportBaseName(purchaseOrder);
  const fileName = sanitizeGeneratedDocumentFileName(baseName, {
    fallback: "narudzbenica",
    extension: "pdf",
  });

  if (purchaseOrderTemplateSettings?.referenceDocument && isWordTemplateFile(purchaseOrderTemplateSettings.referenceDocument)) {
    const referenceDocument = await readStoredDocumentBuffer(purchaseOrderTemplateSettings.referenceDocument);
    const pdfBuffer = await buildPdfFromTemplateBuffer(
      referenceDocument.buffer,
      buildPurchaseOrderTemplatePlaceholderPayload(purchaseOrder),
      {
        fileName: sanitizeGeneratedDocumentFileName(baseName, {
          fallback: "narudzbenica",
          extension: "docx",
        }),
      },
    );
    return { pdfBuffer, fileName };
  }

  const pdfBuffer = await buildPurchaseOrderPdfBuffer(purchaseOrder, { currency: purchaseOrder.currency || "EUR" });
  return { pdfBuffer, fileName };
}

function buildContractExportBaseName(contract = {}) {
  return contract.contractNumber || contract.title || contract.companyName || "ugovor";
}

async function getContractTemplateDocument(contract = {}, organizationId = "") {
  const templateId = String(contract.templateId || "").trim();
  if (!templateId) {
    throw new Error("Odaberi template ugovora prije izvoza.");
  }

  const snapshot = await domainRepository.getSnapshot();
  const template = (snapshot.contractTemplates ?? []).find((item) => (
    String(item.organizationId) === String(organizationId)
    && String(item.id) === templateId
  ));

  if (!template?.referenceDocument || !isWordTemplateFile(template.referenceDocument)) {
    throw new Error("Template ugovora nema valjani Word dokument.");
  }

  return {
    template,
    referenceDocument: await readStoredDocumentBuffer(template.referenceDocument),
  };
}

async function buildContractWordExportPayload(contract = {}, organizationId = "") {
  const baseName = buildContractExportBaseName(contract);
  const { referenceDocument } = await getContractTemplateDocument(contract, organizationId);
  const fileName = sanitizeGeneratedDocumentFileName(baseName, {
    fallback: "ugovor",
    extension: "docx",
  });
  const docxBuffer = await buildDocxFromTemplateBuffer(
    referenceDocument.buffer,
    buildContractTemplatePlaceholderPayload(contract),
    { fileName },
  );
  return { docxBuffer, fileName };
}

async function buildContractPdfExportPayload(contract = {}, organizationId = "") {
  const baseName = buildContractExportBaseName(contract);
  const { referenceDocument } = await getContractTemplateDocument(contract, organizationId);
  const fileName = sanitizeGeneratedDocumentFileName(baseName, {
    fallback: "ugovor",
    extension: "pdf",
  });
  const pdfBuffer = await buildPdfFromTemplateBuffer(
    referenceDocument.buffer,
    buildContractTemplatePlaceholderPayload(contract),
    {
      fileName: sanitizeGeneratedDocumentFileName(baseName, {
        fallback: "ugovor",
        extension: "docx",
      }),
    },
  );
  return { pdfBuffer, fileName };
}

function shouldUseSecureCookies(request) {
  const forwardedProto = String(request.headers["x-forwarded-proto"] ?? "").toLowerCase();
  const host = String(request.headers.host ?? "");
  return forwardedProto === "https" || (!host.startsWith("localhost") && !host.startsWith("127.0.0.1"));
}

function getClientIp(request) {
  const forwardedFor = String(request.headers["x-forwarded-for"] ?? "");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return String(request.socket.remoteAddress ?? "");
}

function appendResponseCookies(response, cookies) {
  const nextCookies = Array.isArray(cookies) ? cookies.filter(Boolean) : [cookies].filter(Boolean);

  if (nextCookies.length === 0) {
    return;
  }

  const currentHeader = response.getHeader("Set-Cookie");
  const currentCookies = Array.isArray(currentHeader)
    ? currentHeader
    : currentHeader
      ? [currentHeader]
      : [];

  response.setHeader("Set-Cookie", [...currentCookies, ...nextCookies]);
}

function buildUserFromTokenPayload(payload) {
  if (!payload?.sub) {
    return null;
  }

  return {
    id: String(payload.sub),
    username: String(payload.username ?? ""),
    email: String(payload.email ?? ""),
    fullName: String(payload.fullName ?? payload.username ?? ""),
    role: String(payload.role ?? "user"),
    organizationId: payload.organizationId ? String(payload.organizationId) : "",
    organizationName: String(payload.organizationName ?? ""),
  };
}

async function hydrateRequestUser(userLike) {
  if (!userLike?.id || typeof tenantRepository.getUserById !== "function") {
    return userLike ?? null;
  }

  return await tenantRepository.getUserById(userLike.id);
}

async function clearRequestAuth(request, response) {
  const cookies = parseCookies(request.headers.cookie ?? "");
  const refreshToken = getRefreshTokenFromCookies(cookies);

  if (refreshToken) {
    await tenantRepository.deleteRefreshToken(refreshToken);
  }

  appendResponseCookies(response, clearAuthCookies({
    secure: shouldUseSecureCookies(request),
  }));
  request[requestUserSymbol] = null;
}

async function tryRefreshAuth(request, response, cookies) {
  const refreshToken = getRefreshTokenFromCookies(cookies);

  if (!refreshToken) {
    return null;
  }

  const refreshVerification = verifyToken(refreshToken, jwtSecret, { expectedType: "refresh" });

  if (!refreshVerification.ok) {
    await clearRequestAuth(request, response);
    return null;
  }

  const provisionalUser = buildUserFromTokenPayload(refreshVerification.payload);

  if (!provisionalUser) {
    await clearRequestAuth(request, response);
    return null;
  }

  const nextAccessToken = createAccessToken(provisionalUser, jwtSecret);
  const nextRefreshToken = createRefreshToken(provisionalUser, jwtSecret);
  const rotated = await tenantRepository.rotateRefreshToken(refreshToken, nextRefreshToken, {
    expectedUserId: provisionalUser.id,
    ipAddress: getClientIp(request),
    userAgent: request.headers["user-agent"] ?? "",
  });

  if (!rotated?.user) {
    await clearRequestAuth(request, response);
    return null;
  }

  appendResponseCookies(response, createAuthCookies({
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    secure: shouldUseSecureCookies(request),
  }));

  return hydrateRequestUser(rotated.user);
}

async function getRequestUser(request, response) {
  if (Object.prototype.hasOwnProperty.call(request, requestUserSymbol)) {
    return request[requestUserSymbol];
  }

  const cookies = parseCookies(request.headers.cookie ?? "");
  const accessToken = getAccessTokenFromCookies(cookies);
  const accessVerification = verifyToken(accessToken, jwtSecret, { expectedType: "access" });

  if (accessVerification.ok) {
    const user = await hydrateRequestUser(buildUserFromTokenPayload(accessVerification.payload));
    request[requestUserSymbol] = user;
    return user;
  }

  const refreshedUser = await tryRefreshAuth(request, response, cookies);
  request[requestUserSymbol] = refreshedUser;
  return refreshedUser;
}

async function readRequestBodyText(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return "";
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody(request) {
  const body = await readRequestBodyText(request);

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

async function readFormBody(request) {
  const body = await readRequestBodyText(request);

  if (!body) {
    return {};
  }

  const parsed = new URLSearchParams(body);
  const values = {};

  for (const [key, value] of parsed.entries()) {
    values[key] = value;
  }

  return values;
}

function redirect(response, location, statusCode = 303) {
  response.statusCode = statusCode;
  response.setHeader("Location", location);
  response.end();
}

function getForwardedProto(request) {
  return String(request.headers["x-forwarded-proto"] ?? "").split(",")[0].trim().toLowerCase();
}

function getRequestProtocol(request) {
  const forwardedProto = getForwardedProto(request);

  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  return shouldUseSecureCookies(request) ? "https" : "http";
}

function getRequestHost(request) {
  return String(request.headers.host ?? "").split(",")[0].trim().toLowerCase();
}

function isLocalDevelopmentHost(host = "") {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
}

function setSecurityHeaders(response, request) {
  response.setHeader("Content-Security-Policy", securityContentSecurityPolicy);
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Permissions-Policy", [
    "accelerometer=()",
    "autoplay=()",
    "camera=()",
    "display-capture=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
    "screen-wake-lock=()",
  ].join(", "));
  response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  response.setHeader("Origin-Agent-Cluster", "?1");

  if (getRequestProtocol(request) === "https") {
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function getCanonicalRedirectTarget(request, url) {
  if (!canonicalAppOrigin) {
    return "";
  }

  if (url.pathname === "/api/health") {
    return "";
  }

  const host = getRequestHost(request);
  if (!host || isLocalDevelopmentHost(host)) {
    return "";
  }

  const requestOrigin = `${getRequestProtocol(request)}://${host}`;
  if (requestOrigin === canonicalAppOrigin && host === canonicalAppHost) {
    return "";
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return "";
  }

  return new URL(`${url.pathname}${url.search}`, canonicalAppOrigin).toString();
}

function getRequestedOrganizationId(request) {
  return String(request.headers["x-organization-id"] ?? "").trim();
}

async function getScopedState(user, request) {
  const requestedOrganizationId = getRequestedOrganizationId(request);
  const rawSnapshot = await domainRepository.getSnapshot();
  const scopedSnapshot = await tenantRepository.getSnapshot(user, requestedOrganizationId, rawSnapshot);

  return {
    requestedOrganizationId,
    rawSnapshot,
    scopedSnapshot,
  };
}

function assertInScope(collection, id, message) {
  const item = collection.find((entry) => String(entry.id) === String(id));

  if (!item) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }

  return item;
}

function assertCompanyPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.companyId) {
    return;
  }

  assertInScope(scopedSnapshot.companies, body.companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
}

function assertLocationPayloadInScope(scopedSnapshot, body = {}) {
  const locationIds = [
    body.locationId,
    ...(Array.isArray(body.selectedLocationIds) ? body.selectedLocationIds : []),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  locationIds.forEach((locationId) => {
    assertInScope(scopedSnapshot.locations, locationId, "Lokacija nije dostupna za odabranu organizaciju.");
  });
}

function assertSampleCompanyPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.sampleCompanyId) {
    return;
  }

  assertInScope(scopedSnapshot.companies, body.sampleCompanyId, "Tvrtka nije dostupna za odabrani template.");
}

function assertSampleLocationPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.sampleLocationId) {
    return;
  }

  assertInScope(scopedSnapshot.locations, body.sampleLocationId, "Lokacija nije dostupna za odabrani template.");
}

function assertLegalFrameworkIdsPayloadInScope(scopedSnapshot, body = {}) {
  if (!Array.isArray(body.selectedLegalFrameworkIds)) {
    return;
  }

  body.selectedLegalFrameworkIds.forEach((id) => {
    if (!String(id ?? "").trim()) {
      return;
    }

    assertInScope(scopedSnapshot.legalFrameworks ?? [], id, "Propis nije dostupan za odabranu organizaciju.");
  });
}

function assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body = {}, fieldName = "linkedTemplateIds") {
  if (!Array.isArray(body[fieldName])) {
    return;
  }

  body[fieldName].forEach((id) => {
    if (!String(id ?? "").trim()) {
      return;
    }

    assertInScope(scopedSnapshot.documentTemplates ?? [], id, "Template nije dostupan za odabranu organizaciju.");
  });
}

function assertContractTemplatePayloadInScope(scopedSnapshot, body = {}) {
  if (!body.templateId) {
    return;
  }

  assertInScope(scopedSnapshot.contractTemplates ?? [], body.templateId, "Template ugovora nije dostupan za odabranu organizaciju.");
}

function assertOfferIdsPayloadInScope(scopedSnapshot, body = {}, fieldName = "linkedOfferIds") {
  if (!Array.isArray(body[fieldName])) {
    return;
  }

  body[fieldName].forEach((id) => {
    if (!String(id ?? "").trim()) {
      return;
    }

    assertInScope(scopedSnapshot.offers ?? [], id, "Ponuda nije dostupna za odabranu organizaciju.");
  });
}

function assertServiceCatalogIdsPayloadInScope(scopedSnapshot, body = {}) {
  if (!Array.isArray(body.serviceItems)) {
    return;
  }

  body.serviceItems.forEach((item) => {
    const serviceId = String(item?.serviceId ?? item?.id ?? "").trim();
    if (!serviceId) {
      return;
    }

    assertInScope(scopedSnapshot.serviceCatalog ?? [], serviceId, "Usluga nije dostupna za odabranu organizaciju.");
  });
}

function assertWorkOrderPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.workOrderId) {
    return;
  }

  assertInScope(scopedSnapshot.workOrders, body.workOrderId, "Radni nalog nije dostupan za odabranu organizaciju.");
}

function normalizeInputValue(value) {
  return String(value ?? "").trim();
}

function getScopedUserDisplayLabel(userLike = {}) {
  return String(
    userLike.fullName
    || [userLike.firstName, userLike.lastName].filter(Boolean).join(" ")
    || userLike.email
    || userLike.username
    || "User",
  ).trim() || "User";
}

function canManageAbsenceEntry(user, entry = {}) {
  if (canManageMasterData(user)) {
    return true;
  }

  const actorId = String(user?.id ?? "");
  return Boolean(actorId) && (
    String(entry.userId ?? "") === actorId
    || String(entry.requestedByUserId ?? "") === actorId
  );
}

function resolveAssignedUserPayload(scopedSnapshot, body = {}) {
  if (!Object.prototype.hasOwnProperty.call(body, "assignedToUserId")) {
    return {};
  }

  const assignedToUserId = String(body.assignedToUserId ?? "").trim();

  if (!assignedToUserId) {
    return {
      assignedToUserId: "",
      assignedToLabel: "",
    };
  }

  const assignedUser = assertInScope(
    scopedSnapshot.users,
    assignedToUserId,
    "Odabrani kolega nije dostupan za aktivnu organizaciju.",
  );

  return {
    assignedToUserId: String(assignedUser.id),
    assignedToLabel: assignedUser.fullName || assignedUser.email || assignedUser.username || "User",
  };
}

function resolveTodoInvitedUsersPayload(scopedSnapshot, body = {}) {
  const hasInvitedUserIds = Object.prototype.hasOwnProperty.call(body, "invitedUserIds");

  if (!hasInvitedUserIds) {
    return {};
  }

  const requestedIds = Array.isArray(body.invitedUserIds)
    ? body.invitedUserIds
    : [body.invitedUserIds];
  const invitedUserIds = Array.from(new Set(
    requestedIds.map((value) => normalizeInputValue(value)).filter(Boolean),
  ));

  if (invitedUserIds.length === 0) {
    return {
      invitedUserIds: [],
      invitedUserLabels: [],
    };
  }

  const invitedUsers = invitedUserIds.map((userId) => assertInScope(
    scopedSnapshot.users,
    userId,
    "Pozvani kolega nije dostupan za aktivnu organizaciju.",
  ));

  return {
    invitedUserIds: invitedUsers.map((user) => String(user.id)),
    invitedUserLabels: invitedUsers.map((user) => user.fullName || user.email || user.username || "User"),
  };
}

function resolveVehicleReservationUserPayload(scopedSnapshot, body = {}) {
  const hasUserIds = Object.prototype.hasOwnProperty.call(body, "reservedForUserIds");
  const hasLabels = Object.prototype.hasOwnProperty.call(body, "reservedForLabels");
  const hasUserId = Object.prototype.hasOwnProperty.call(body, "reservedForUserId");
  const hasLabel = Object.prototype.hasOwnProperty.call(body, "reservedForLabel");

  if (!hasUserIds && !hasLabels && !hasUserId && !hasLabel) {
    return {};
  }

  if (hasUserIds || hasLabels) {
    const requestedUserIds = Array.isArray(body.reservedForUserIds)
      ? body.reservedForUserIds.map((value) => normalizeInputValue(value)).filter(Boolean)
      : [normalizeInputValue(body.reservedForUserId)].filter(Boolean);
    const uniqueUserIds = Array.from(new Set(requestedUserIds));

    if (uniqueUserIds.length === 0) {
      return {
        reservedForUserIds: [],
        reservedForLabels: hasLabels && Array.isArray(body.reservedForLabels)
          ? body.reservedForLabels.map((value) => normalizeInputValue(value)).filter(Boolean)
          : [],
        reservedForUserId: "",
        reservedForLabel: "",
      };
    }

    const resolvedUsers = uniqueUserIds.map((userId) => assertInScope(
      scopedSnapshot.users,
      userId,
      "Odabrani kolega nije dostupan za aktivnu organizaciju.",
    ));
    const reservedForLabels = resolvedUsers.map((user) => user.fullName || user.email || user.username || "User");

    return {
      reservedForUserIds: resolvedUsers.map((user) => String(user.id)),
      reservedForLabels,
      reservedForUserId: String(resolvedUsers[0]?.id ?? ""),
      reservedForLabel: reservedForLabels.join(", "),
    };
  }

  const reservedForUserId = normalizeInputValue(body.reservedForUserId);

  if (!reservedForUserId) {
    return {
      reservedForUserIds: [],
      reservedForLabels: [],
      reservedForUserId: "",
      reservedForLabel: hasLabel ? normalizeInputValue(body.reservedForLabel) : "",
    };
  }

  const reservedUser = assertInScope(
    scopedSnapshot.users,
    reservedForUserId,
    "Odabrani kolega nije dostupan za aktivnu organizaciju.",
  );

  return {
    reservedForUserIds: [String(reservedUser.id)],
    reservedForLabels: [reservedUser.fullName || reservedUser.email || reservedUser.username || "User"],
    reservedForUserId: String(reservedUser.id),
    reservedForLabel: reservedUser.fullName || reservedUser.email || reservedUser.username || "User",
  };
}

async function writeSnapshot(response, user, request, statusCode = 200) {
  const { scopedSnapshot } = await getScopedState(user, request);
  sendJson(response, statusCode, {
    storage: domainRepository.kind,
    user,
    ...scopedSnapshot,
  });
}

function buildChatUsers(users = []) {
  return (users ?? []).map((entry) => ({
    id: String(entry.id ?? ""),
    fullName: String(entry.fullName ?? [entry.firstName, entry.lastName].filter(Boolean).join(" ")),
    email: String(entry.email ?? ""),
    avatarDataUrl: String(entry.avatarDataUrl ?? ""),
    role: String(entry.role ?? "user"),
    isActive: entry.isActive !== false,
  })).filter((entry) => entry.id);
}

async function getScopedChatContext(user, request) {
  const { scopedSnapshot } = await getScopedState(user, request);
  return {
    organizationId: String(scopedSnapshot.activeOrganizationId ?? ""),
    users: buildChatUsers(scopedSnapshot.users),
  };
}

async function writeChatSnapshot(response, user, request, statusCode = 200) {
  const { organizationId, users } = await getScopedChatContext(user, request);
  sendJson(response, statusCode, liveChatStore.getSnapshot({
    organizationId,
    currentUser: user,
    users,
  }));
}

async function handleEntityMutation(response, user, request, handler, statusCode = 200) {
  await handler();
  await writeSnapshot(response, user, request, statusCode);
}

async function handleApiRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        storage: domainRepository.kind,
        objectStorage: {
          enabled: Boolean(domainRepository.objectStorage?.enabled),
          provider: domainRepository.objectStorage?.provider ?? "",
          bucket: domainRepository.objectStorage?.bucket ?? "",
          region: domainRepository.objectStorage?.region ?? "",
        },
      });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/login-content") {
      const content = await tenantRepository.getPublicLoginScreen();
      sendJson(response, 200, content);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/session") {
      const user = await getRequestUser(request, response);
      sendJson(response, 200, {
        authenticated: Boolean(user),
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readJsonBody(request);
      const user = await tenantRepository.authenticateUser(body.email ?? body.username, body.password);

      if (!user) {
        sendError(response, 401, "Neispravan email ili lozinka.");
        return true;
      }

      const accessToken = createAccessToken(user, jwtSecret);
      const refreshToken = createRefreshToken(user, jwtSecret);

      await tenantRepository.storeRefreshToken(user, refreshToken, {
        ipAddress: getClientIp(request),
        userAgent: request.headers["user-agent"] ?? "",
      });

      appendResponseCookies(response, createAuthCookies({
        accessToken,
        refreshToken,
        secure: shouldUseSecureCookies(request),
      }));

      sendJson(response, 200, {
        authenticated: true,
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/signup") {
      const body = await readJsonBody(request);
      const result = await tenantRepository.submitSignupRequest(body);
      sendJson(response, 201, result);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/refresh") {
      const user = await getRequestUser(request, response);

      if (!user) {
        sendError(response, 401, "Prijava je istekla.");
        return true;
      }

      sendJson(response, 200, {
        authenticated: true,
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      const cookies = parseCookies(request.headers.cookie ?? "");
      const token = getRefreshTokenFromCookies(cookies);

      if (token) {
        await tenantRepository.deleteRefreshToken(token);
      }

      appendResponseCookies(response, clearAuthCookies({
        secure: shouldUseSecureCookies(request),
      }));
      request[requestUserSymbol] = null;
      sendJson(response, 200, { ok: true });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/public/learning-tests/access") {
      const token = String(url.searchParams.get("token") ?? "").trim();
      if (!token) {
        sendError(response, 400, "Token je obavezan.");
        return true;
      }
      const item = await domainRepository.getLearningAccessByToken(token);
      if (!item) {
        sendError(response, 404, "Pristup testu nije pronađen.");
        return true;
      }
      sendJson(response, 200, { item });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/public/learning-tests/access/start") {
      const body = await readJsonBody(request);
      const token = String(body?.token ?? "").trim();
      if (!token) {
        sendError(response, 400, "Token je obavezan.");
        return true;
      }
      const item = await domainRepository.startLearningTestAccess(token);
      if (!item) {
        sendError(response, 404, "Pristup testu nije pronađen.");
        return true;
      }
      sendJson(response, 200, { item });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/public/learning-tests/access/submit") {
      const body = await readJsonBody(request);
      const token = String(body?.token ?? "").trim();
      if (!token) {
        sendError(response, 400, "Token je obavezan.");
        return true;
      }
      const item = await domainRepository.submitLearningTestAccess(token, body?.answers ?? []);
      if (!item) {
        sendError(response, 404, "Pristup testu nije pronađen.");
        return true;
      }
      sendJson(response, 200, { item });
      return true;
    }

    const user = await getRequestUser(request, response);

    if (!user) {
      sendError(response, 401, "Prijava je potrebna.");
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "PATCH" && url.pathname === "/api/auth/profile/avatar") {
      const body = await readJsonBody(request);
      const updatedUser = await tenantRepository.updateOwnAvatar(user, body.avatarDataUrl);

      if (!updatedUser) {
        sendError(response, 404, "Korisnik nije pronađen.");
        return true;
      }

      request[requestUserSymbol] = updatedUser;
      await writeSnapshot(response, updatedUser, request);
      return true;
    }

    const organizationMatch = url.pathname.match(/^\/api\/organizations\/([^/]+)$/);
    const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
    const loginContentMatch = url.pathname.match(/^\/api\/login-content\/([^/]+)$/);
    const signupRequestActionMatch = url.pathname.match(/^\/api\/signup-requests\/([^/]+)\/(approve|reject)$/);
    const companyMatch = url.pathname.match(/^\/api\/companies\/([^/]+)$/);
    const locationMatch = url.pathname.match(/^\/api\/locations\/([^/]+)$/);
    const dashboardWidgetMatch = url.pathname.match(/^\/api\/dashboard-widgets\/([^/]+)$/);
    const reminderMatch = url.pathname.match(/^\/api\/reminders\/([^/]+)$/);
    const offerMatch = url.pathname.match(/^\/api\/offers\/([^/]+)$/);
    const offerPdfExportMatch = url.pathname.match(/^\/api\/offers\/([^/]+)\/export-pdf$/);
    const offerEmailMatch = url.pathname.match(/^\/api\/offers\/([^/]+)\/email$/);
    const purchaseOrderMatch = url.pathname.match(/^\/api\/purchase-orders\/([^/]+)$/);
    const purchaseOrderPdfExportMatch = url.pathname.match(/^\/api\/purchase-orders\/([^/]+)\/export-pdf$/);
    const purchaseOrderEmailMatch = url.pathname.match(/^\/api\/purchase-orders\/([^/]+)\/email$/);
    const contractTemplateMatch = url.pathname.match(/^\/api\/contract-templates\/([^/]+)$/);
    const contractMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)$/);
    const contractWordExportMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)\/export-word$/);
    const contractPdfExportMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)\/export-pdf$/);
    const legalFrameworkMatch = url.pathname.match(/^\/api\/legal-frameworks\/([^/]+)$/);
    const learningTestMatch = url.pathname.match(/^\/api\/learning-tests\/([^/]+)$/);
    const serviceCatalogMatch = url.pathname.match(/^\/api\/service-catalog\/([^/]+)$/);
    const measurementEquipmentMatch = url.pathname.match(/^\/api\/measurement-equipment\/([^/]+)$/);
    const safetyAuthorizationMatch = url.pathname.match(/^\/api\/safety-authorizations\/([^/]+)$/);
    const absenceEntryMatch = url.pathname.match(/^\/api\/absence-entries\/([^/]+)$/);
    const measurementEquipmentExcelExportMatch = url.pathname === "/api/measurement-equipment/export-list-excel";
    const measurementEquipmentZipExportMatch = url.pathname === "/api/measurement-equipment/export-files-zip";
    const measurementEquipmentWordExportMatch = url.pathname === "/api/measurement-equipment/export-word";
    const measurementEquipmentPdfExportMatch = url.pathname === "/api/measurement-equipment/export-pdf";
    const documentTemplateMatch = url.pathname.match(/^\/api\/document-templates\/([^/]+)$/);
    const documentTemplateWordExportMatch = url.pathname.match(/^\/api\/document-templates\/([^/]+)\/export-word$/);
    const documentTemplatePdfExportMatch = url.pathname.match(/^\/api\/document-templates\/([^/]+)\/export-pdf$/);
    const documentTemplateBatchPdfExportMatch = url.pathname === "/api/document-templates/export-pdf-batch";
    const vehicleReservationsCollectionMatch = url.pathname.match(/^\/api\/vehicles\/([^/]+)\/reservations$/);
    const vehicleReservationMatch = url.pathname.match(/^\/api\/vehicles\/([^/]+)\/reservations\/([^/]+)$/);
    const vehicleMatch = url.pathname.match(/^\/api\/vehicles\/([^/]+)$/);
    const todoTaskCommentMatch = url.pathname.match(/^\/api\/todo-tasks\/([^/]+)\/comments$/);
    const todoTaskMatch = url.pathname.match(/^\/api\/todo-tasks\/([^/]+)$/);
    const chatConversationMessageMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)\/messages$/);
    const chatConversationReadMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)\/read$/);
    const workOrderActivityMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/activity$/);
    const workOrderDocumentsMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/documents$/);
    const workOrderDocumentMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/documents\/([^/]+)$/);
    const workOrderMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)$/);

    if (request.method === "GET" && url.pathname === "/api/chat/bootstrap") {
      await writeChatSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/chat/presence") {
      const body = await readJsonBody(request);
      const { organizationId } = await getScopedChatContext(user, request);
      liveChatStore.setPresence({
        organizationId,
        userId: user.id,
        status: body.status,
      });
      await writeChatSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/chat/conversations") {
      const body = await readJsonBody(request);
      const { organizationId, users } = await getScopedChatContext(user, request);
      liveChatStore.createConversation({
        organizationId,
        currentUser: user,
        users,
        title: body.title,
        participantIds: body.participantIds,
      });
      await writeChatSnapshot(response, user, request, 201);
      return true;
    }

    if (chatConversationMessageMatch && request.method === "POST") {
      const body = await readJsonBody(request);
      const { organizationId } = await getScopedChatContext(user, request);
      liveChatStore.addMessage({
        organizationId,
        conversationId: chatConversationMessageMatch[1],
        currentUser: user,
        body: body.body,
      });
      await writeChatSnapshot(response, user, request, 201);
      return true;
    }

    if (chatConversationReadMatch && request.method === "POST") {
      const { organizationId } = await getScopedChatContext(user, request);
      liveChatStore.markConversationRead({
        organizationId,
        conversationId: chatConversationReadMatch[1],
        currentUserId: user.id,
      });
      await writeChatSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/organizations") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, user, request, () => tenantRepository.createOrganization(user, body), 201);
      return true;
    }

    if (organizationMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await tenantRepository.updateOrganization(user, organizationMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Organizacija nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/users") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, user, request, () => tenantRepository.createUser(user, body), 201);
      return true;
    }

    if (userMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await tenantRepository.updateUser(user, userMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Korisnik nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/login-content") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, user, request, () => tenantRepository.createLoginContent(user, body), 201);
      return true;
    }

    if (loginContentMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await tenantRepository.updateLoginContent(user, loginContentMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Login sadržaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (loginContentMatch && request.method === "DELETE") {
      const deleted = await tenantRepository.deleteLoginContent(user, loginContentMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Login sadržaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (signupRequestActionMatch && request.method === "POST") {
      const body = await readJsonBody(request);
      const [, signupRequestId, action] = signupRequestActionMatch;

      if (action === "approve") {
        await handleEntityMutation(
          response,
          user,
          request,
          () => tenantRepository.approveSignupRequest(user, signupRequestId, body),
        );
        return true;
      }

      if (action === "reject") {
        await handleEntityMutation(
          response,
          user,
          request,
          () => tenantRepository.rejectSignupRequest(user, signupRequestId, body),
        );
        return true;
      }
    }

    if (request.method === "POST" && url.pathname === "/api/companies") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati tvrtkama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const company = await domainRepository.createCompany(body);
      await tenantRepository.assignCompanyToOrganization(scopedSnapshot.activeOrganizationId, company.id);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/locations") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati lokacijama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      await domainRepository.createLocation(body);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/work-orders") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati radnim nalozima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertServiceCatalogIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createWorkOrder({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/reminders") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati reminderima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      await domainRepository.createReminder({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/todo-tasks") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ToDo zadacima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      const assignedPayload = resolveAssignedUserPayload(scopedSnapshot, body);
      const invitedPayload = resolveTodoInvitedUsersPayload(scopedSnapshot, body);
      await domainRepository.createTodoTask({
        ...body,
        ...assignedPayload,
        ...invitedPayload,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/offers/template-settings") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ponudama.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const entry = await domainRepository.getOfferTemplateSettings(scopedSnapshot.activeOrganizationId).catch(() => null);
      sendJson(response, 200, {
        item: entry?.referenceDocument ?? null,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/offers/template-settings") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ponudama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const entry = await domainRepository.upsertOfferTemplateSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        referenceDocument: body?.referenceDocument ?? null,
      });
      sendJson(response, 200, {
        item: entry?.referenceDocument ?? null,
      });
      return true;
    }

    if (request.method === "DELETE" && url.pathname === "/api/offers/template-settings") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ponudama.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.deleteOfferTemplateSettings(scopedSnapshot.activeOrganizationId);
      sendJson(response, 200, { ok: true });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/purchase-orders/template-settings") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati narudzbenicama.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const entry = await domainRepository.getPurchaseOrderTemplateSettings(scopedSnapshot.activeOrganizationId).catch(() => null);
      sendJson(response, 200, {
        item: entry?.referenceDocument ?? null,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/purchase-orders/template-settings") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati narudzbenicama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const entry = await domainRepository.upsertPurchaseOrderTemplateSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        referenceDocument: body?.referenceDocument ?? null,
      });
      sendJson(response, 200, {
        item: entry?.referenceDocument ?? null,
      });
      return true;
    }

    if (request.method === "DELETE" && url.pathname === "/api/purchase-orders/template-settings") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati narudzbenicama.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.deletePurchaseOrderTemplateSettings(scopedSnapshot.activeOrganizationId);
      sendJson(response, 200, { ok: true });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/offers") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ponudama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      await domainRepository.createOffer({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/vehicles") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati vozilima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.createVehicle({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/legal-frameworks") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati propisima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body, "linkedTemplateIds");
      await domainRepository.createLegalFramework({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/purchase-orders") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati narudzbenicama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      await domainRepository.createPurchaseOrder({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/contract-templates") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati templateima ugovora.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.createContractTemplate({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/contracts") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ugovorima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertContractTemplatePayloadInScope(scopedSnapshot, body);
      assertOfferIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createContract({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/learning-tests") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati eLearning testovima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.createLearningTestItem({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/measurement-equipment") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati mjernom opremom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createMeasurementEquipmentItem({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/service-catalog") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati uslugama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createServiceCatalogItem({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/safety-authorizations") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati ovlaštenjima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createSafetyAuthorization({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/absence-entries") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo evidentirati odsutnosti.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const isAdmin = canManageMasterData(user);
      const requestedUserId = normalizeInputValue(body.userId) || String(user.id);

      if (!isAdmin && requestedUserId !== String(user.id)) {
        sendError(response, 403, "Možete unositi odsutnost samo za sebe.");
        return true;
      }

      const targetUser = assertInScope(
        scopedSnapshot.users ?? [],
        requestedUserId,
        "Odabrani korisnik nije dostupan za aktivnu organizaciju.",
      );
      const normalizedType = normalizeInputValue(body.type).toLowerCase();
      const finalStatus = isAdmin
        ? normalizeInputValue(body.status).toLowerCase()
        : (doesAbsenceTypeRequireApproval(normalizedType) ? "pending" : "approved");
      const actorLabel = getScopedUserDisplayLabel(user);

      await domainRepository.createAbsenceEntry({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: String(targetUser.id),
        userLabel: getScopedUserDisplayLabel(targetUser),
        status: finalStatus,
        requestedByUserId: String(user.id),
        requestedByLabel: actorLabel,
        approvedByUserId: finalStatus === "approved" ? String(user.id) : "",
        approvedByLabel: finalStatus === "approved" ? actorLabel : "",
        approvedAt: finalStatus === "approved" ? new Date().toISOString() : null,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/absence-balances") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo uređivati saldo odsutnosti.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const targetUser = assertInScope(
        scopedSnapshot.users ?? [],
        body.userId,
        "Odabrani korisnik nije dostupan za aktivnu organizaciju.",
      );

      await domainRepository.upsertAbsenceBalance({
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: String(targetUser.id),
        userLabel: getScopedUserDisplayLabel(targetUser),
        annualLeaveInitialDays: body?.annualLeaveInitialDays,
        sickLeaveInitialDays: body?.sickLeaveInitialDays,
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/measurement-equipment/card-template") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati karton template.");
        return true;
      }

      const body = await readJsonBody(request);
      const templateDocument = body?.templateDocument && typeof body.templateDocument === "object"
        ? body.templateDocument
        : null;

      if (!templateDocument) {
        sendError(response, 400, "Priloži .docx/.dotx karton template.");
        return true;
      }

      if (!isWordTemplateFile(templateDocument)) {
        sendError(response, 400, "Karton template mora biti .docx ili .dotx datoteka.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertMeasurementEquipmentCardTemplate({
        organizationId: scopedSnapshot.activeOrganizationId,
        templateDocument,
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/measurement-equipment/notification-settings") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati postavke notifikacija.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertMeasurementEquipmentNotificationSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        notificationSettings: {
          leadDaysBeforeExpiry: body?.leadDaysBeforeExpiry,
          repeatEveryDays: body?.repeatEveryDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/vehicles/notification-settings") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati postavke notifikacija vozila.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertVehicleNotificationSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        notificationSettings: {
          registrationLeadDaysBeforeExpiry: body?.registrationLeadDaysBeforeExpiry,
          registrationRepeatEveryDays: body?.registrationRepeatEveryDays,
          tireLeadDaysBeforeDue: body?.tireLeadDaysBeforeDue,
          tireRepeatEveryDays: body?.tireRepeatEveryDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/safety-authorizations/notification-settings") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati postavke notifikacija ovlastenja.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertSafetyAuthorizationNotificationSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        notificationSettings: {
          leadDaysBeforeExpiry: body?.leadDaysBeforeExpiry,
          repeatEveryDays: body?.repeatEveryDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/absence/notification-settings") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati postavke notifikacija odsutnosti.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertAbsenceNotificationSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        notificationSettings: {
          leadDaysBeforeStart: body?.leadDaysBeforeStart,
          repeatEveryDays: body?.repeatEveryDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/periodics/visual-settings") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati postavke periodike.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertPeriodicsVisualSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        visualSettings: {
          criticalDays: body?.criticalDays,
          warningDays: body?.warningDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/document-records") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo pregledavati zapisnike.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const templateId = String(url.searchParams.get("templateId") ?? "").trim();
      const companyId = String(url.searchParams.get("companyId") ?? "").trim();
      const locationId = String(url.searchParams.get("locationId") ?? "").trim();
      const limit = String(url.searchParams.get("limit") ?? "200").trim();

      if (templateId) {
        assertInScope(scopedSnapshot.documentTemplates ?? [], templateId, "Template nije dostupan za odabranu organizaciju.");
      }
      if (companyId) {
        assertInScope(scopedSnapshot.companies ?? [], companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      }
      if (locationId) {
        assertInScope(scopedSnapshot.locations ?? [], locationId, "Lokacija nije dostupna za odabranu organizaciju.");
      }

      const items = await domainRepository.listDocumentRecords({
        organizationId: scopedSnapshot.activeOrganizationId,
        templateId,
        companyId,
        locationId,
        limit,
      });

      sendJson(response, 200, { items });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/document-records") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo spremati zapisnike.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], body.templateId, "Template nije dostupan za odabranu organizaciju.");
      assertInScope(scopedSnapshot.companies ?? [], body.companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      assertInScope(scopedSnapshot.locations ?? [], body.locationId, "Lokacija nije dostupna za odabranu organizaciju.");

      const item = await domainRepository.createDocumentRecord({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      sendJson(response, 201, { item });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/measurement-sheet-presets") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo pregledavati Excel presete.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const templateId = String(url.searchParams.get("templateId") ?? "").trim();
      const companyId = String(url.searchParams.get("companyId") ?? "").trim();
      const locationId = String(url.searchParams.get("locationId") ?? "").trim();
      const fieldKey = String(url.searchParams.get("fieldKey") ?? "").trim();
      const limit = String(url.searchParams.get("limit") ?? "12").trim();

      if (templateId) {
        assertInScope(scopedSnapshot.documentTemplates ?? [], templateId, "Template nije dostupan za odabranu organizaciju.");
      }
      if (companyId) {
        assertInScope(scopedSnapshot.companies ?? [], companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      }
      if (locationId) {
        assertInScope(scopedSnapshot.locations ?? [], locationId, "Lokacija nije dostupna za odabranu organizaciju.");
      }

      const items = await domainRepository.listMeasurementSheetPresets({
        organizationId: scopedSnapshot.activeOrganizationId,
        templateId,
        companyId,
        locationId,
        fieldKey,
        limit,
      });

      sendJson(response, 200, { items });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/measurement-sheet-presets") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati Excel presete.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], body.templateId, "Template nije dostupan za odabranu organizaciju.");
      assertInScope(scopedSnapshot.companies ?? [], body.companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      assertInScope(scopedSnapshot.locations ?? [], body.locationId, "Lokacija nije dostupna za odabranu organizaciju.");

      const item = await domainRepository.saveMeasurementSheetPreset({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      sendJson(response, 201, { item });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/document-templates") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati templateima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertSampleCompanyPayloadInScope(scopedSnapshot, body);
      assertSampleLocationPayloadInScope(scopedSnapshot, body);
      assertLegalFrameworkIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createDocumentTemplate({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (measurementEquipmentExcelExportMatch && request.method === "POST") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo izvoziti popis mjerne opreme.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const items = [...(scopedSnapshot.measurementEquipment ?? [])].sort((left, right) => {
        const byName = String(left?.name || "").localeCompare(String(right?.name || ""), "hr", { sensitivity: "base" });
        if (byName !== 0) {
          return byName;
        }
        const byInventory = String(left?.inventoryNumber || "").localeCompare(String(right?.inventoryNumber || ""), "hr", { sensitivity: "base" });
        if (byInventory !== 0) {
          return byInventory;
        }
        return String(left?.id || "").localeCompare(String(right?.id || ""));
      });
      const todayIso = new Date().toISOString().slice(0, 10);
      const rows = [[
        "Naziv opreme",
        "Proizvodac",
        "Tip/model",
        "Oznaka uredaja",
        "Serijski broj",
        "Inv broj",
        "Umjerava se",
        "Datum umjeravanja",
        "Vrijedi do",
        "Status umjernice",
        "Koristi se u zapisnicima",
        "Mjernu opremu unio",
        "Odobrio",
        "Datum unosa",
        "Zadnje umjeravanje",
        "Zadnji pregled",
        "Zadnji servis",
        "Broj datoteka",
      ]];

      items.forEach((item) => {
        rows.push([
          normalizeInputValue(item?.name),
          normalizeInputValue(item?.manufacturer),
          normalizeInputValue(item?.deviceType),
          normalizeInputValue(item?.deviceCode),
          normalizeInputValue(item?.serialNumber),
          normalizeInputValue(item?.inventoryNumber),
          item?.requiresCalibration ? "DA" : "NE",
          normalizeDateOnlyValue(item?.calibrationDate),
          normalizeDateOnlyValue(item?.validUntil),
          getMeasurementEquipmentCalibrationStatusLabel(item, todayIso),
          (Array.isArray(item?.linkedTemplateTitles) ? item.linkedTemplateTitles : []).join(", "),
          normalizeInputValue(item?.enteredBy),
          normalizeInputValue(item?.approvedBy),
          normalizeDateOnlyValue(item?.entryDate),
          buildMeasurementEquipmentLatestActivitySummary(item, "umjeravanje"),
          buildMeasurementEquipmentLatestActivitySummary(item, "pregled"),
          buildMeasurementEquipmentLatestActivitySummary(item, "servis"),
          String((Array.isArray(item?.documents) ? item.documents : []).length),
        ]);
      });

      const fileName = sanitizeGeneratedDocumentFileName(
        `mjerna-oprema-popis-${todayIso}`,
        { fallback: "mjerna-oprema-popis", extension: "xlsx" },
      );
      sendBinary(response, 200, buildMeasurementEquipmentListXlsxBuffer(rows), {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName,
      });
      return true;
    }

    if (measurementEquipmentZipExportMatch && request.method === "POST") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo izvoziti datoteke mjerne opreme.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const allItems = Array.isArray(scopedSnapshot.measurementEquipment)
        ? scopedSnapshot.measurementEquipment
        : [];
      const requestedIdsRaw = Array.isArray(body?.equipmentIds)
        ? body.equipmentIds
        : Array.isArray(body?.deviceIds)
          ? body.deviceIds
          : [];
      const requestedIdSet = new Set(requestedIdsRaw.map((value) => normalizeInputValue(value)).filter(Boolean));
      const selectedItems = requestedIdSet.size > 0
        ? allItems.filter((item) => requestedIdSet.has(String(item?.id ?? "")))
        : [...allItems];
      if (selectedItems.length === 0) {
        sendError(response, 400, "Nema odabranih uređaja za ZIP izvoz.");
        return true;
      }

      const requestedCategoriesRaw = Array.isArray(body?.documentCategories)
        ? body.documentCategories
        : Array.isArray(body?.categories)
          ? body.categories
          : [];
      const selectedCategories = new Set(
        requestedCategoriesRaw
          .map((value) => normalizeMeasurementEquipmentDocumentCategoryValue(value))
          .filter((value) => value && value !== MEASUREMENT_EQUIPMENT_CARD_TEMPLATE_CATEGORY),
      );
      if (selectedCategories.size === 0) {
        selectedItems.forEach((item) => {
          (Array.isArray(item?.documents) ? item.documents : []).forEach((document) => {
            const normalized = normalizeMeasurementEquipmentDocumentCategoryValue(document?.documentCategory);
            if (normalized && normalized !== MEASUREMENT_EQUIPMENT_CARD_TEMPLATE_CATEGORY) {
              selectedCategories.add(normalized);
            }
          });
        });
      }
      if (selectedCategories.size === 0) {
        sendError(response, 400, "Za odabrane uređaje nema datoteka za ZIP izvoz.");
        return true;
      }

      const onlyValidCalibrationCertificates = Boolean(body?.onlyValidCalibrationCertificates);
      const todayIso = new Date().toISOString().slice(0, 10);
      const zip = new JSZip();
      const usedPaths = new Set();
      const manifestRows = [[
        "Uredaj ID",
        "Naziv uredaja",
        "Inv broj",
        "Kategorija",
        "Datoteka",
        "Status umjernice",
      ]];
      const skippedDocuments = [];
      let addedCount = 0;

      for (const item of selectedItems) {
        const selectedDocuments = collectMeasurementEquipmentDocumentsForZip(
          item,
          selectedCategories,
          {
            onlyValidCalibrationCertificates,
            todayIso,
          },
        );
        if (selectedDocuments.length === 0) {
          continue;
        }

        const deviceFolder = sanitizeZipPathSegment(
          [
            item?.inventoryNumber ? `INV-${item.inventoryNumber}` : "",
            item?.name || "",
            item?.id ? `ID-${item.id}` : "",
          ].filter(Boolean).join(" - "),
          `uredaj-${item?.id || "bez-id"}`,
        );

        for (const document of selectedDocuments) {
          const normalizedCategory = normalizeMeasurementEquipmentDocumentCategoryValue(document?.documentCategory);
          const categoryFolder = sanitizeZipPathSegment(
            getMeasurementEquipmentDocumentCategoryLabel(normalizedCategory),
            "Dokumenti",
          );
          const fileName = sanitizeZipPathSegment(
            normalizeInputValue(document?.fileName),
            `dokument-${addedCount + skippedDocuments.length + 1}`,
          );
          const candidatePath = `${deviceFolder}/${categoryFolder}/${fileName}`;

          try {
            const storedDocument = await readStoredDocumentBuffer(document);
            const zipPath = buildUniqueZipPath(candidatePath, usedPaths);
            zip.file(zipPath, storedDocument.buffer);
            addedCount += 1;
            manifestRows.push([
              String(item?.id ?? ""),
              normalizeInputValue(item?.name),
              normalizeInputValue(item?.inventoryNumber),
              getMeasurementEquipmentDocumentCategoryLabel(normalizedCategory),
              normalizeInputValue(document?.fileName),
              getMeasurementEquipmentCalibrationStatusLabel(item, todayIso),
            ]);
          } catch (error) {
            skippedDocuments.push(
              [
                `Uredaj #${item?.id || "?"}`,
                normalizeInputValue(item?.name) || "Bez naziva",
                normalizeInputValue(document?.fileName) || "Datoteka",
                normalizeInputValue(error?.message) || "Neuspjelo citanje dokumenta",
              ].filter(Boolean).join(" | "),
            );
          }
        }
      }

      if (addedCount === 0) {
        sendError(response, 400, "Nijedna datoteka nije dostupna za ZIP izvoz (provjeri odabir i vazecu umjernicu).");
        return true;
      }

      if (skippedDocuments.length > 0) {
        zip.file("_neuspjeli_dokumenti.txt", skippedDocuments.join("\n"));
      }
      zip.file("_manifest.csv", buildCsvBuffer(manifestRows));

      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      const fileName = sanitizeGeneratedDocumentFileName(
        `mjerna-oprema-dokumenti-${todayIso}`,
        { fallback: "mjerna-oprema-dokumenti", extension: "zip" },
      );

      sendBinary(response, 200, zipBuffer, {
        contentType: "application/zip",
        fileName,
      });
      return true;
    }

    if (measurementEquipmentWordExportMatch && request.method === "POST") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo generirati karton uređaja.");
        return true;
      }

      const body = await readJsonBody(request);
      const templateDocument = body?.templateDocument && typeof body.templateDocument === "object"
        ? body.templateDocument
        : null;

      if (!templateDocument) {
        sendError(response, 400, "Prvo učitaj karton template (.docx/.dotx).");
        return true;
      }

      if (!isWordTemplateFile(templateDocument)) {
        sendError(response, 400, "Karton template mora biti .docx ili .dotx datoteka.");
        return true;
      }

      const placeholders = body?.placeholders && typeof body.placeholders === "object" && !Array.isArray(body.placeholders)
        ? body.placeholders
        : {};
      const referenceDocument = await readStoredDocumentBuffer(templateDocument);
      const generatedWord = await buildDocxFromTemplateBuffer(referenceDocument.buffer, placeholders);
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || templateDocument.fileName || "karton-uredaja",
        { fallback: "karton-uredaja", extension: "docx" },
      );

      sendBinary(response, 200, generatedWord, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName,
      });
      return true;
    }

    if (measurementEquipmentPdfExportMatch && request.method === "POST") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo generirati karton uređaja.");
        return true;
      }

      const body = await readJsonBody(request);
      const templateDocument = body?.templateDocument && typeof body.templateDocument === "object"
        ? body.templateDocument
        : null;

      if (!templateDocument) {
        sendError(response, 400, "Prvo učitaj karton template (.docx/.dotx).");
        return true;
      }

      if (!isWordTemplateFile(templateDocument)) {
        sendError(response, 400, "Karton template mora biti .docx ili .dotx datoteka.");
        return true;
      }

      const placeholders = body?.placeholders && typeof body.placeholders === "object" && !Array.isArray(body.placeholders)
        ? body.placeholders
        : {};
      const referenceDocument = await readStoredDocumentBuffer(templateDocument);
      const pdfWordName = sanitizeGeneratedDocumentFileName(
        body.fileName || templateDocument.fileName || "karton-uredaja",
        { fallback: "karton-uredaja", extension: "docx" },
      );
      const pdfBuffer = await buildPdfFromTemplateBuffer(referenceDocument.buffer, placeholders, {
        fileName: pdfWordName,
      });
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || templateDocument.fileName || "karton-uredaja",
        { fallback: "karton-uredaja", extension: "pdf" },
      );

      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (documentTemplateWordExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati Word zapisnik.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const template = assertInScope(
        scopedSnapshot.documentTemplates ?? [],
        documentTemplateWordExportMatch[1],
        "Template nije pronađen.",
      );

      if (!template.referenceDocument) {
        sendError(response, 400, "Template još nema učitan Word predložak.");
        return true;
      }

      if (!isWordTemplateFile(template.referenceDocument)) {
        sendError(response, 400, "Za Word export učitaj .docx ili .dotx predložak.");
        return true;
      }

      const referenceDocument = await readStoredDocumentBuffer(template.referenceDocument);
      const generatedWord = await buildDocxFromTemplateBuffer(referenceDocument.buffer, body.placeholders ?? {});
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || template.outputFileName || template.title || "zapisnik",
        { fallback: "zapisnik", extension: "docx" },
      );

      sendBinary(response, 200, generatedWord, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName,
      });
      return true;
    }

    if (documentTemplatePdfExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF zapisnik.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const template = assertInScope(
        scopedSnapshot.documentTemplates ?? [],
        documentTemplatePdfExportMatch[1],
        "Template nije pronađen.",
      );

      const pdfBuffer = await generatePdfBufferForTemplate(template, {
        placeholders: body.placeholders ?? {},
        fileName: body.fileName || template.outputFileName || template.title || "zapisnik.docx",
      });
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || template.outputFileName || template.title || "zapisnik",
        { fallback: "zapisnik", extension: "pdf" },
      );

      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (documentTemplateBatchPdfExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati batch PDF zapisnike.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const entries = Array.isArray(body.entries) ? body.entries : [];

      if (entries.length === 0) {
        sendError(response, 400, "Batch PDF nema nijedan zapisnik za obradu.");
        return true;
      }

      const pdfBuffers = [];

      for (const entry of entries) {
        const template = assertInScope(
          scopedSnapshot.documentTemplates ?? [],
          entry?.templateId,
          "Template nije pronaÄ‘en.",
        );

        pdfBuffers.push(await generatePdfBufferForTemplate(template, {
          placeholders: entry?.placeholders ?? {},
          fileName: entry?.fileName || template.outputFileName || template.title || "zapisnik.docx",
        }));
      }

      const mergedPdf = await mergePdfBuffers(pdfBuffers);
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || "zapisnici-batch",
        { fallback: "zapisnici-batch", extension: "pdf" },
      );

      sendBinary(response, 200, mergedPdf, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (vehicleReservationsCollectionMatch && request.method === "POST") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo rezervirati vozila.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const vehicle = assertInScope(scopedSnapshot.vehicles, vehicleReservationsCollectionMatch[1], "Vozilo nije pronađeno.");
      const reservationUserPayload = resolveVehicleReservationUserPayload(scopedSnapshot, body);
      await domainRepository.createVehicleReservation(vehicle.id, {
        ...body,
        ...reservationUserPayload,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/dashboard-widgets") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.createDashboardWidget({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: user.id,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (companyMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati tvrtkama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.companies, companyMatch[1], "Tvrtka nije pronađena.");
      const updated = await domainRepository.updateCompany(companyMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Tvrtka nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (companyMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati tvrtkama.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.companies, companyMatch[1], "Tvrtka nije pronađena.");
      const deleted = await domainRepository.deleteCompany(companyMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Tvrtka nije pronađena.");
        return true;
      }

      await tenantRepository.removeCompanyAssignment(companyMatch[1]);
      await writeSnapshot(response, user, request);
      return true;
    }

    if (locationMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati lokacijama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.locations, locationMatch[1], "Lokacija nije pronađena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateLocation(locationMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Lokacija nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (locationMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati lokacijama.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.locations, locationMatch[1], "Lokacija nije pronađena.");
      const deleted = await domainRepository.deleteLocation(locationMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Lokacija nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (workOrderActivityMatch && request.method === "GET") {
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderActivityMatch[1], "Radni nalog nije pronađen.");
      const items = await domainRepository.getWorkOrderActivity(workOrderActivityMatch[1]);
      sendJson(response, 200, { items });
      return true;
    }

    if (workOrderDocumentsMatch && request.method === "GET") {
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentsMatch[1], "Radni nalog nije pronađen.");
      const items = await domainRepository.getWorkOrderDocuments(workOrderDocumentsMatch[1]);
      sendJson(response, 200, { items });
      return true;
    }

    if (workOrderDocumentsMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo dodavati dokumente na radne naloge.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentsMatch[1], "Radni nalog nije pronađen.");
      const items = await domainRepository.addWorkOrderDocuments(
        workOrderDocumentsMatch[1],
        body.files ?? [],
        user,
        { sourceType: body.sourceType ?? body.source },
      );
      sendJson(response, 201, { items });
      return true;
    }

    if (workOrderDocumentMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo uredjivati dokumente na radnim nalozima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentMatch[1], "Radni nalog nije pronađen.");
      const item = await domainRepository.updateWorkOrderDocument(
        workOrderDocumentMatch[1],
        workOrderDocumentMatch[2],
        body,
        user,
      );

      if (!item) {
        sendError(response, 404, "Dokument nije pronađen.");
        return true;
      }

      sendJson(response, 200, { item });
      return true;
    }

    if (workOrderDocumentMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati dokumente na radnim nalozima.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentMatch[1], "Radni nalog nije pronađen.");
      const deleted = await domainRepository.deleteWorkOrderDocument(
        workOrderDocumentMatch[1],
        workOrderDocumentMatch[2],
        user,
      );

      if (!deleted) {
        sendError(response, 404, "Dokument nije pronađen.");
        return true;
      }

      sendJson(response, 200, { ok: true });
      return true;
    }

    if (workOrderMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati radnim nalozima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderMatch[1], "Radni nalog nije pronađen.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertServiceCatalogIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateWorkOrder(workOrderMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Radni nalog nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (reminderMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati reminderima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.reminders, reminderMatch[1], "Reminder nije pronađen.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateReminder(reminderMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Reminder nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (todoTaskMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ToDo zadacima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.todoTasks, todoTaskMatch[1], "ToDo zadatak nije pronađen.");
      const currentTodoTask = scopedSnapshot.todoTasks.find((item) => String(item.id) === String(todoTaskMatch[1])) ?? null;
      const hasRequestedStatus = Object.prototype.hasOwnProperty.call(body, "status");
      const requestedStatus = String(body.status ?? "").trim().toLowerCase();
      const currentStatus = String(currentTodoTask?.status ?? "").trim().toLowerCase();
      const createdByUserId = String(currentTodoTask?.createdByUserId ?? "").trim();
      const currentUserId = String(user?.id ?? "").trim();
      if (
        hasRequestedStatus
        && requestedStatus
        && requestedStatus !== currentStatus
        && createdByUserId
        && createdByUserId !== currentUserId
      ) {
        sendError(response, 403, "Status teme može mijenjati samo osoba koja je otvorila temu.");
        return true;
      }
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      const assignedPayload = resolveAssignedUserPayload(scopedSnapshot, body);
      const invitedPayload = resolveTodoInvitedUsersPayload(scopedSnapshot, body);
      const updated = await domainRepository.updateTodoTask(todoTaskMatch[1], {
        ...body,
        ...assignedPayload,
        ...invitedPayload,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "ToDo zadatak nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (offerMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ponudama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.offers, offerMatch[1], "Ponuda nije pronađena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateOffer(offerMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Ponuda nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (purchaseOrderMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati narudzbenicama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.purchaseOrders, purchaseOrderMatch[1], "Narudzbenica nije pronađena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updatePurchaseOrder(purchaseOrderMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Narudzbenica nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (contractTemplateMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati templateima ugovora.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.contractTemplates ?? [], contractTemplateMatch[1], "Template ugovora nije pronađen.");
      const updated = await domainRepository.updateContractTemplate(contractTemplateMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Template ugovora nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (contractTemplateMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati templateima ugovora.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.contractTemplates ?? [], contractTemplateMatch[1], "Template ugovora nije pronađen.");
      await domainRepository.deleteContractTemplate(contractTemplateMatch[1]);
      await writeSnapshot(response, user, request);
      return true;
    }

    if (contractMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ugovorima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.contracts ?? [], contractMatch[1], "Ugovor nije pronađen.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertContractTemplatePayloadInScope(scopedSnapshot, body);
      assertOfferIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateContract(contractMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Ugovor nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (contractMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ugovorima.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.contracts ?? [], contractMatch[1], "Ugovor nije pronađen.");
      await domainRepository.deleteContract(contractMatch[1]);
      await writeSnapshot(response, user, request);
      return true;
    }

    if (offerPdfExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF ponude.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const offer = assertInScope(scopedSnapshot.offers, offerPdfExportMatch[1], "Ponuda nije pronađena.");
      const { pdfBuffer, fileName } = await buildOfferPdfExportPayload(offer, scopedSnapshot.activeOrganizationId);
      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (purchaseOrderPdfExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF narudzbenice.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const purchaseOrder = assertInScope(scopedSnapshot.purchaseOrders, purchaseOrderPdfExportMatch[1], "Narudzbenica nije pronađena.");
      const { pdfBuffer, fileName } = await buildPurchaseOrderPdfExportPayload(purchaseOrder, scopedSnapshot.activeOrganizationId);
      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (contractWordExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati Word ugovora.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const contract = assertInScope(scopedSnapshot.contracts ?? [], contractWordExportMatch[1], "Ugovor nije pronađen.");
      const { docxBuffer, fileName } = await buildContractWordExportPayload(contract, scopedSnapshot.activeOrganizationId);
      sendBinary(response, 200, docxBuffer, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName,
      });
      return true;
    }

    if (contractPdfExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF ugovora.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const contract = assertInScope(scopedSnapshot.contracts ?? [], contractPdfExportMatch[1], "Ugovor nije pronađen.");
      const { pdfBuffer, fileName } = await buildContractPdfExportPayload(contract, scopedSnapshot.activeOrganizationId);
      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (offerEmailMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo slati ponude emailom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const offer = assertInScope(scopedSnapshot.offers, offerEmailMatch[1], "Ponuda nije pronađena.");
      const to = String(body?.to ?? "").trim();

      if (!to) {
        sendError(response, 400, "Email primatelja je obavezan.");
        return true;
      }

      const { pdfBuffer, fileName } = await buildOfferPdfExportPayload(offer, scopedSnapshot.activeOrganizationId);
      const subject = String(body?.subject ?? "").trim() || `${offer.offerNumber || "Ponuda"} · ${offer.title || offer.companyName || "SafeNexus"}`;
      const message = String(body?.message ?? "").trim();
      const htmlMessage = message
        ? message.split(/\r?\n/).map((line) => `<div>${escapeEmailHtml(line)}</div>`).join("")
        : "<div>U privitku saljemo trazenu ponudu.</div>";
      const result = await sendMail({
        to,
        subject,
        text: message || `U privitku saljemo ponudu ${offer.offerNumber || ""}.`,
        html: `
          <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;">
            ${htmlMessage}
            <div style="margin-top:16px;color:#64748b;">SafeNexus · ${escapeEmailHtml(offer.companyName || "")}</div>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      if (!result.ok) {
        sendError(response, 400, result.error || "Slanje emaila nije uspjelo.");
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        message: `Ponuda je poslana na ${to}.`,
      });
      return true;
    }

    if (purchaseOrderEmailMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo slati narudzbenice emailom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const purchaseOrder = assertInScope(scopedSnapshot.purchaseOrders, purchaseOrderEmailMatch[1], "Narudzbenica nije pronađena.");
      const to = String(body?.to ?? "").trim();

      if (!to) {
        sendError(response, 400, "Email primatelja je obavezan.");
        return true;
      }

      const { pdfBuffer, fileName } = await buildPurchaseOrderPdfExportPayload(purchaseOrder, scopedSnapshot.activeOrganizationId);
      const subject = String(body?.subject ?? "").trim() || `${purchaseOrder.purchaseOrderNumber || "Narudzbenica"} · ${purchaseOrder.title || purchaseOrder.companyName || "SafeNexus"}`;
      const message = String(body?.message ?? "").trim();
      const htmlMessage = message
        ? message.split(/\r?\n/).map((line) => `<div>${escapeEmailHtml(line)}</div>`).join("")
        : "<div>U privitku saljemo trazenu narudzbenicu.</div>";
      const result = await sendMail({
        to,
        subject,
        text: message || `U privitku saljemo narudzbenicu ${purchaseOrder.purchaseOrderNumber || ""}.`,
        html: `
          <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;">
            ${htmlMessage}
            <div style="margin-top:16px;color:#64748b;">SafeNexus · ${escapeEmailHtml(purchaseOrder.companyName || "")}</div>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      if (!result.ok) {
        sendError(response, 400, result.error || "Slanje emaila nije uspjelo.");
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        message: `Narudzbenica je poslana na ${to}.`,
      });
      return true;
    }

    if (vehicleMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati vozilima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.vehicles, vehicleMatch[1], "Vozilo nije pronađeno.");
      const updated = await domainRepository.updateVehicle(vehicleMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Vozilo nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (legalFrameworkMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati propisima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.legalFrameworks ?? [], legalFrameworkMatch[1], "Propis nije pronađen.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body, "linkedTemplateIds");
      const updated = await domainRepository.updateLegalFramework(legalFrameworkMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Propis nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (learningTestMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati eLearning testovima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.learningTests ?? [], learningTestMatch[1], "Test nije pronađen.");
      const updated = await domainRepository.updateLearningTestItem(learningTestMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Test nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (measurementEquipmentMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati mjernom opremom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.measurementEquipment ?? [], measurementEquipmentMatch[1], "Uređaj nije pronađen.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateMeasurementEquipmentItem(measurementEquipmentMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Uređaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (serviceCatalogMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati uslugama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.serviceCatalog ?? [], serviceCatalogMatch[1], "Usluga nije pronađena.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateServiceCatalogItem(serviceCatalogMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Usluga nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (safetyAuthorizationMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati ovlaštenjima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.safetyAuthorizations ?? [], safetyAuthorizationMatch[1], "Ovlaštenje nije pronađeno.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateSafetyAuthorization(safetyAuthorizationMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Ovlaštenje nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (absenceEntryMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo uređivati odsutnosti.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const current = assertInScope(scopedSnapshot.absenceEntries ?? [], absenceEntryMatch[1], "Odsutnost nije pronađena.");

      if (!canManageAbsenceEntry(user, current)) {
        sendError(response, 403, "Nemate pravo uređivati ovu odsutnost.");
        return true;
      }

      const isAdmin = canManageMasterData(user);
      const requestedUserId = isAdmin
        ? (normalizeInputValue(body.userId) || String(current.userId))
        : String(current.userId);
      const targetUser = assertInScope(
        scopedSnapshot.users ?? [],
        requestedUserId,
        "Odabrani korisnik nije dostupan za aktivnu organizaciju.",
      );
      const normalizedType = normalizeInputValue(body.type || current.type).toLowerCase();
      const requestedStatus = isAdmin
        ? (normalizeInputValue(body.status).toLowerCase() || String(current.status || "").toLowerCase())
        : (doesAbsenceTypeRequireApproval(normalizedType) ? String(current.status || "pending").toLowerCase() : "approved");
      const actorLabel = getScopedUserDisplayLabel(user);
      const approvedMeta = requestedStatus === "approved"
        ? {
          approvedByUserId: String(user.id),
          approvedByLabel: actorLabel,
          approvedAt: new Date().toISOString(),
        }
        : (requestedStatus === "pending"
          ? {
            approvedByUserId: "",
            approvedByLabel: "",
            approvedAt: null,
          }
          : {
            approvedByUserId: isAdmin ? String(user.id) : String(current.approvedByUserId ?? ""),
            approvedByLabel: isAdmin ? actorLabel : String(current.approvedByLabel ?? ""),
            approvedAt: isAdmin ? new Date().toISOString() : current.approvedAt,
          });

      const updated = await domainRepository.updateAbsenceEntry(absenceEntryMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: String(targetUser.id),
        userLabel: getScopedUserDisplayLabel(targetUser),
        status: requestedStatus,
        requestedByUserId: String(current.requestedByUserId || user.id),
        requestedByLabel: current.requestedByLabel || actorLabel,
        ...approvedMeta,
      });

      if (!updated) {
        sendError(response, 404, "Odsutnost nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (documentTemplateMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati templateima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], documentTemplateMatch[1], "Template nije pronađen.");
      assertSampleCompanyPayloadInScope(scopedSnapshot, body);
      assertSampleLocationPayloadInScope(scopedSnapshot, body);
      assertLegalFrameworkIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateDocumentTemplate(documentTemplateMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Template nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleReservationMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati rezervacijama vozila.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const vehicle = assertInScope(scopedSnapshot.vehicles, vehicleReservationMatch[1], "Vozilo nije pronađeno.");
      assertInScope(vehicle.reservations ?? [], vehicleReservationMatch[2], "Rezervacija vozila nije pronađena.");
      const reservationUserPayload = resolveVehicleReservationUserPayload(scopedSnapshot, body);
      const updated = await domainRepository.updateVehicleReservation(vehicle.id, vehicleReservationMatch[2], {
        ...body,
        ...reservationUserPayload,
      }, user);

      if (!updated) {
        sendError(response, 404, "Rezervacija vozila nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (dashboardWidgetMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.dashboardWidgets, dashboardWidgetMatch[1], "Dashboard kartica nije pronađena.");
      const updated = await domainRepository.updateDashboardWidget(dashboardWidgetMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: user.id,
      });

      if (!updated) {
        sendError(response, 404, "Dashboard kartica nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (workOrderMatch && request.method === "DELETE") {
      if (!canDeleteWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati radne naloge.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderMatch[1], "Radni nalog nije pronađen.");
      const deleted = await domainRepository.deleteWorkOrder(workOrderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Radni nalog nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (reminderMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati remindere.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.reminders, reminderMatch[1], "Reminder nije pronađen.");
      const deleted = await domainRepository.deleteReminder(reminderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Reminder nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (todoTaskCommentMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo komunicirati kroz ToDo.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.todoTasks, todoTaskCommentMatch[1], "ToDo zadatak nije pronađen.");
      const updated = await domainRepository.addTodoTaskComment(todoTaskCommentMatch[1], body, user);

      if (!updated) {
        sendError(response, 404, "ToDo zadatak nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (todoTaskMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati ToDo zadatke.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.todoTasks, todoTaskMatch[1], "ToDo zadatak nije pronađen.");
      const deleted = await domainRepository.deleteTodoTask(todoTaskMatch[1]);

      if (!deleted) {
        sendError(response, 404, "ToDo zadatak nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (offerMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati ponude.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.offers, offerMatch[1], "Ponuda nije pronađena.");
      const deleted = await domainRepository.deleteOffer(offerMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Ponuda nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (purchaseOrderMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati narudzbenice.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.purchaseOrders, purchaseOrderMatch[1], "Narudzbenica nije pronađena.");
      const deleted = await domainRepository.deletePurchaseOrder(purchaseOrderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Narudzbenica nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati vozila.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.vehicles, vehicleMatch[1], "Vozilo nije pronađeno.");
      const deleted = await domainRepository.deleteVehicle(vehicleMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Vozilo nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (legalFrameworkMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati propise.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.legalFrameworks ?? [], legalFrameworkMatch[1], "Propis nije pronađen.");
      const deleted = await domainRepository.deleteLegalFramework(legalFrameworkMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Propis nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (learningTestMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati eLearning testove.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.learningTests ?? [], learningTestMatch[1], "Test nije pronađen.");
      const deleted = await domainRepository.deleteLearningTestItem(learningTestMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Test nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (measurementEquipmentMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati mjernu opremu.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.measurementEquipment ?? [], measurementEquipmentMatch[1], "Uređaj nije pronađen.");
      const deleted = await domainRepository.deleteMeasurementEquipmentItem(measurementEquipmentMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Uređaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (serviceCatalogMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati usluge.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.serviceCatalog ?? [], serviceCatalogMatch[1], "Usluga nije pronađena.");
      const deleted = await domainRepository.deleteServiceCatalogItem(serviceCatalogMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Usluga nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (safetyAuthorizationMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati ovlaštenja.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.safetyAuthorizations ?? [], safetyAuthorizationMatch[1], "Ovlaštenje nije pronađeno.");
      const deleted = await domainRepository.deleteSafetyAuthorization(safetyAuthorizationMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Ovlaštenje nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (absenceEntryMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati odsutnosti.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const current = assertInScope(scopedSnapshot.absenceEntries ?? [], absenceEntryMatch[1], "Odsutnost nije pronađena.");
      const canDeleteOwnPending = String(current.userId ?? "") === String(user.id ?? "")
        && String(current.status ?? "").toLowerCase() === "pending";

      if (!canManageMasterData(user) && !canDeleteOwnPending) {
        sendError(response, 403, "Nemate pravo brisati ovu odsutnost.");
        return true;
      }

      const deleted = await domainRepository.deleteAbsenceEntry(absenceEntryMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Odsutnost nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (documentTemplateMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati templatee.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], documentTemplateMatch[1], "Template nije pronađen.");
      const deleted = await domainRepository.deleteDocumentTemplate(documentTemplateMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Template nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleReservationMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati rezervacije vozila.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const vehicle = assertInScope(scopedSnapshot.vehicles, vehicleReservationMatch[1], "Vozilo nije pronađeno.");
      assertInScope(vehicle.reservations ?? [], vehicleReservationMatch[2], "Rezervacija vozila nije pronađena.");
      const deleted = await domainRepository.deleteVehicleReservation(vehicle.id, vehicleReservationMatch[2]);

      if (!deleted) {
        sendError(response, 404, "Rezervacija vozila nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (dashboardWidgetMatch && request.method === "DELETE") {
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.dashboardWidgets, dashboardWidgetMatch[1], "Dashboard kartica nije pronađena.");
      const deleted = await domainRepository.deleteDashboardWidget(dashboardWidgetMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Dashboard kartica nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }
  } catch (error) {
    sendError(response, error.statusCode ?? 400, error.message || "Request failed.");
    return true;
  }

  return false;
}

async function handleStaticRequest(response, url) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = resolve(staticRoot, `.${pathname}`);
  const isSafePath = filePath === staticRoot || filePath.startsWith(`${staticRoot}${sep}`);
  const noStoreHeaders = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  if (!isSafePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    const extension = extname(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
      ...noStoreHeaders,
    });
    response.end(file);
  } catch (error) {
    if (pathname !== "/index.html" && !extname(pathname)) {
      const indexFile = await readFile(resolve(staticRoot, "index.html"));
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        ...noStoreHeaders,
      });
      response.end(indexFile);
      return;
    }

    response.writeHead(error.code === "ENOENT" ? 404 : 500, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(error.code === "ENOENT" ? "Not found" : "Server error");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  setSecurityHeaders(response, request);

  const canonicalRedirectTarget = getCanonicalRedirectTarget(request, url);
  if (canonicalRedirectTarget) {
    redirect(response, canonicalRedirectTarget, 308);
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/login-form") {
    try {
      const body = await readFormBody(request);
      const user = await tenantRepository.authenticateUser(body.email ?? body.username, body.password);

      if (!user) {
        redirect(response, "/?loginError=invalid");
        return;
      }

      const accessToken = createAccessToken(user, jwtSecret);
      const refreshToken = createRefreshToken(user, jwtSecret);

      await tenantRepository.storeRefreshToken(user, refreshToken, {
        ipAddress: getClientIp(request),
        userAgent: request.headers["user-agent"] ?? "",
      });

      appendResponseCookies(response, createAuthCookies({
        accessToken,
        refreshToken,
        secure: shouldUseSecureCookies(request),
      }));

      redirect(response, "/");
      return;
    } catch (error) {
      console.error("Form login failed.", error);
      redirect(response, "/?loginError=server");
      return;
    }
  }

  if (url.pathname.startsWith("/api/")) {
    const handled = await handleApiRequest(request, response, url);

    if (!handled) {
      sendError(response, 404, "Endpoint not found.");
    }

    return;
  }

  await handleStaticRequest(response, url);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}, shutting down...`);

  server.close(async () => {
    try {
      await Promise.all([
        domainRepository.close?.(),
        tenantRepository.close?.(),
      ]);
      process.exit(0);
    } catch (error) {
      console.error("Failed to close repository cleanly.", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

server.listen(port, () => {
  console.log(`SelfDash workspace live at http://localhost:${port} (${domainRepository.kind})`);
});
