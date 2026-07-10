import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFNumber, PDFString, rgb } from "pdf-lib";
import {
  createDocumentationFormulaSheetsForService,
  createDocumentationMeasurementTablesForService,
  buildDocumentationNativeCertificateNumber,
  getDocumentationNativeReportPreset,
} from "./documentationNativePresets.js";
import {
  evaluateMeasurementFormula,
  isMeasurementFormula,
  parseMeasurementCellReference,
} from "./measurementFormula.js";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 42;
const TOP_Y = 805;
const BOTTOM_Y = 92;
const FONT_REGULAR_URL = "/assets/fonts/DejaVuSans.ttf";
const FONT_BOLD_URL = "/assets/fonts/DejaVuSans-Bold.ttf";
const BLUE = rgb(0.06, 0.45, 0.74);
const DARK = rgb(0.05, 0.06, 0.08);
const MUTED = rgb(0.34, 0.38, 0.44);
const LIGHT_GRAY = rgb(0.79, 0.80, 0.81);
const TABLE_GRAY = rgb(0.75, 0.76, 0.77);

let fontBytesPromise = null;

function clean(value = "") {
  return String(value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

function cleanMultiline(value = "") {
  return String(value ?? "").normalize("NFC").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function normalizePdfFormulaLookupKey(value = "") {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getPdfFormulaReferenceSheetName(reference = "") {
  if (reference && typeof reference === "object" && !Array.isArray(reference)) {
    return clean(reference.sheetName ?? reference.sheet ?? "");
  }
  const text = String(reference || "").trim();
  let inQuote = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "'") {
      inQuote = !inQuote;
    } else if (char === "!" && !inQuote) {
      return text.slice(0, index).replace(/^'|'$/g, "").replace(/''/g, "'").trim();
    }
  }
  return "";
}

function addPdfFormulaSheetAlias(lookup, alias = "", entry = null) {
  if (!lookup || !entry) {
    return;
  }
  const rawAlias = clean(alias);
  const keys = Array.from(new Set([
    rawAlias.toLowerCase(),
    normalizePdfFormulaLookupKey(rawAlias),
  ].filter(Boolean)));
  keys.forEach((key) => {
    if (!lookup.has(key)) {
      lookup.set(key, entry);
    }
  });
}

function formatDocumentDate(value = "") {
  const text = clean(value);
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }
  match = /^(\d{1,2})[./](\d{1,2})[./](\d{4})\.?$/.exec(text);
  if (match) {
    return `${match[1].padStart(2, "0")}.${match[2].padStart(2, "0")}.${match[3]}`;
  }
  match = /^(\d{2})(\d{2})(\d{4})$/.exec(text);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}`;
  }
  return text;
}

function splitTextLines(value = "") {
  return cleanMultiline(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function safeFileName(value = "", fallback = "zapisnik.pdf") {
  const base = clean(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return /\.pdf$/i.test(base || "") ? base : `${base || "zapisnik"}.pdf`;
}

function textWidth(font, text, size) {
  return font.widthOfTextAtSize(String(text ?? ""), size);
}

function wrapSingleLine(line, font, size, maxWidth) {
  const text = String(line ?? "").trim();
  if (!text) {
    return [""];
  }
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(font, candidate, size) <= maxWidth) {
      current = candidate;
      return;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    if (textWidth(font, word, size) <= maxWidth) {
      current = word;
      return;
    }
    let chunk = "";
    Array.from(word).forEach((char) => {
      const next = `${chunk}${char}`;
      if (textWidth(font, next, size) <= maxWidth || !chunk) {
        chunk = next;
      } else {
        lines.push(chunk);
        chunk = char;
      }
    });
    current = chunk;
  });

  if (current) {
    lines.push(current);
  }
  return lines.length ? lines : [""];
}

function wrapText(value, font, size, maxWidth) {
  const paragraphs = cleanMultiline(value).split("\n");
  const lines = [];
  paragraphs.forEach((paragraph, index) => {
    const wrapped = wrapSingleLine(paragraph, font, size, maxWidth);
    lines.push(...wrapped);
    if (index < paragraphs.length - 1) {
      lines.push("");
    }
  });
  return lines;
}

function drawTextLine(page, text, {
  x,
  y,
  font,
  size = 10,
  color = DARK,
  align = "left",
  width = 0,
} = {}) {
  const value = String(text ?? "");
  let drawX = x;
  if (align === "center") {
    drawX = x + Math.max(0, (width - textWidth(font, value, size)) / 2);
  } else if (align === "right") {
    drawX = x + Math.max(0, width - textWidth(font, value, size));
  }
  page.drawText(value, {
    x: drawX,
    y: y - size,
    size,
    font,
    color,
  });
}

function drawTextBlock(page, value, {
  x,
  y,
  width,
  font,
  size = 9.4,
  lineHeight = 13,
  color = DARK,
  maxLines = Infinity,
  bottomY = BOTTOM_Y,
  align = "left",
} = {}) {
  const lines = wrapText(value, font, size, width);
  let cursorY = y;
  let drawn = 0;
  for (const line of lines) {
    if (drawn >= maxLines || cursorY - lineHeight < bottomY) {
      drawTextLine(page, "...", { x, y: cursorY, font, size, color, align, width });
      return cursorY - lineHeight;
    }
    if (line) {
      drawTextLine(page, line, { x, y: cursorY, font, size, color, align, width });
    }
    cursorY -= lineHeight;
    drawn += 1;
  }
  return cursorY;
}

function drawSectionTitle(page, number, title, y, fonts) {
  const height = 18;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - height,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    height,
    color: LIGHT_GRAY,
  });
  drawTextLine(page, `${number}.`, {
    x: MARGIN_X + 8,
    y: y - 4,
    font: fonts.bold,
    size: 9.6,
  });
  drawTextLine(page, title, {
    x: MARGIN_X + 38,
    y: y - 4,
    font: fonts.bold,
    size: 9.6,
  });
  return y - height - 9;
}

function drawFooter(page, text, fonts) {
  void page;
  void text;
  void fonts;
}

function getServiceCode(model = {}) {
  const bindingCode = clean(model?.serviceBinding?.serviceCode || model?.serviceCode || "");
  if (bindingCode) {
    return bindingCode;
  }
  const templateCode = clean(model?.templateCode || "");
  const templateMatch = templateCode.match(/[A-ZČĆŽŠĐ]{2,6}/i);
  if (templateMatch) {
    return templateMatch[0].toUpperCase();
  }
  const recordMatch = clean(model?.recordNumber || "").match(/[A-ZČĆŽŠĐ]{2,6}$/i);
  return recordMatch ? recordMatch[0].toUpperCase() : "SPR";
}

function stampFooters(pdfDoc, model, fonts, {
  startPageIndex = 0,
  pageCount = null,
} = {}) {
  const pages = pdfDoc.getPages();
  const start = Math.max(0, Number(startPageIndex) || 0);
  const end = pageCount === null
    ? pages.length
    : Math.min(pages.length, start + Math.max(0, Number(pageCount) || 0));
  const targetPages = pages.slice(start, end);
  const totalPages = targetPages.length || pages.length;
  const serviceCode = getServiceCode(model);
  targetPages.forEach((page, index) => {
    drawTextLine(page, `${serviceCode}-${index + 1}/${totalPages}`, {
      x: MARGIN_X,
      y: 30,
      font: fonts.regular,
      size: 8.4,
    });
  });
}

function isFailingResult(model = {}) {
  return clean(model.resultStatus).toUpperCase() === "NE ZADOVOLJAVA";
}

function normalizePdfBoolean(value, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }
  const text = clean(value).toLowerCase();
  if (!text) {
    return Boolean(defaultValue);
  }
  if (["true", "1", "da", "yes", "on"].includes(text)) {
    return true;
  }
  if (["false", "0", "ne", "no", "off"].includes(text)) {
    return false;
  }
  return Boolean(defaultValue);
}

function isCertificateCapableReport(model = {}) {
  return model.hasCertificate === true
    || getReportPreset(model).hasCertificate === true
    || Boolean(clean(model.certificateNumber || model.BROJ_UVJERENJA));
}

function shouldIssueCertificate(model = {}) {
  if (!isCertificateCapableReport(model)) {
    return false;
  }
  return normalizePdfBoolean(model.issueCertificate ?? model.IZDAJE_UVJERENJE, true)
    && !isFailingResult(model);
}

function getCertificateNumber(model = {}) {
  return clean(model.certificateNumber || model.BROJ_UVJERENJA)
    || buildDocumentationNativeCertificateNumber(clean(model.recordNumber || model.BROJ_ZAPISNIKA));
}

function getCertificateFactualNote(model = {}) {
  return cleanMultiline(model.certificateFactualNote || model.NAPOMENA_BEZ_UVJERENJA || model.defects || "");
}

function getReportServiceTitle(model = {}) {
  const explicitTitle = clean(model.reportTitle || model.reportHeaderTitle || model.documentTitle);
  if (explicitTitle) {
    return explicitTitle.toUpperCase();
  }
  const serviceName = clean(model.serviceName || model.serviceBinding?.serviceName || model.templateCode);
  if (!serviceName) {
    return "ISPITIVANJE";
  }
  const upper = serviceName.toUpperCase();
  return /^(O|ISPITIVANJE|PREGLED|VIZUALNI|IZVRSENJE|IZVRŠENJE)\b/.test(upper)
    ? upper
    : `ISPITIVANJE ${upper}`;
}

function getReportCoverSubtitle(model = {}) {
  return clean(model.coverSubtitle || model.reportCoverSubtitle || getReportServiceTitle(model));
}

function getMeasurementTableTitle(model = {}) {
  return clean(model.measurementTableTitle || "Tablica 1. - rezultati ispitivanja");
}

function getReportPreset(model = {}) {
  return getDocumentationNativeReportPreset(getServiceCode(model));
}

function getAssessmentLabel(model = {}) {
  return clean(model.assessmentLabel || getReportPreset(model).assessmentLabel || "Rezultat ispitivanja");
}

function normalizePdfMeasurementAssessments(model = {}) {
  const preset = getReportPreset(model);
  const source = Array.isArray(model.measurementAssessments) && model.measurementAssessments.length > 0
    ? model.measurementAssessments
    : (Array.isArray(preset.measurementAssessments) ? preset.measurementAssessments : []);
  return source
    .map((entry, index) => ({
      id: clean(entry.id || entry.key || `assessment-${index + 1}`),
      label: clean(entry.label || `Ocjena ${index + 1}`),
      value: clean(entry.value || entry.defaultValue || "ZADOVOLJAVA"),
    }))
    .filter((entry) => entry.label);
}

function getConclusionLead(model = {}) {
  return clean(model.conclusionLead || getReportPreset(model).conclusionLead || "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da predmetni sustav na dan predmetnog ispitivanja");
}

function getValiditySentence(model = {}) {
  return clean(model.validitySentence || getReportPreset(model).validitySentence || "Zapisnik o ispitivanju vrijedi do");
}

function drawDefaultHeader(page, model, fonts, y = TOP_Y) {
  void y;
  return drawSimpleHeader(page, model, fonts);
  const x = MARGIN_X;
  const width = PAGE_WIDTH - (MARGIN_X * 2);
  page.drawLine({
    start: { x, y: y - 42 },
    end: { x: x + width, y: y - 42 },
    thickness: 2.2,
    color: BLUE,
  });
  page.drawRectangle({
    x,
    y: y - 34,
    width: 38,
    height: 26,
    borderColor: BLUE,
    borderWidth: 1.4,
  });
  drawTextLine(page, "AG", {
    x,
    y: y - 13,
    width: 38,
    align: "center",
    font: fonts.bold,
    size: 11,
    color: BLUE,
  });
  drawTextLine(page, "ADRIA GRUPA", {
    x: x + 46,
    y: y - 8,
    font: fonts.bold,
    size: 10.4,
    color: BLUE,
  });
  drawTextLine(page, "FACILITY MANAGEMENT", {
    x: x + 46,
    y: y - 22,
    font: fonts.regular,
    size: 6.4,
    color: MUTED,
  });
  drawTextLine(page, "Sektor: ZAŠTITNI SUSTAVI", {
    x: x + 150,
    y: y - 8,
    width: 255,
    align: "center",
    font: fonts.bold,
    size: 7.8,
    color: BLUE,
  });
  drawTextLine(page, "Zaštita na radu · Zaštita od požara · Zaštita okoliša", {
    x: x + 126,
    y: y - 21,
    width: 310,
    align: "center",
    font: fonts.bold,
    size: 7,
    color: BLUE,
  });
  drawTextLine(page, "ADRIA GRUPA d.o.o., Heinzelova 53a, 10000 Zagreb", {
    x: x + 112,
    y: y - 33,
    width: 338,
    align: "center",
    font: fonts.regular,
    size: 6.4,
    color: MUTED,
  });
  drawTextLine(page, clean(model.workOrderNumber), {
    x: x + width - 82,
    y: y - 8,
    width: 82,
    align: "right",
    font: fonts.regular,
    size: 8.6,
    color: MUTED,
  });
  return y - 58;
}

async function embedHeaderImage(pdfDoc, dataUrl = "") {
  const text = String(dataUrl || "").trim();
  const match = text.match(/^data:(image\/(?:png|jpe?g|webp));base64,/i);
  if (!match) {
    return null;
  }
  try {
    const bytes = dataUrlToBytes(text);
    let mime = match[1].toLowerCase();
    if (!bytes) {
      return null;
    }
    let imageBytes = bytes;
    if (mime.includes("webp")) {
      const converted = await convertPdfImageBytesToPng(bytes);
      if (!converted) {
        return null;
      }
      imageBytes = converted;
      mime = "image/png";
    }
    return mime.includes("png")
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);
  } catch {
    return null;
  }
}

async function embedPdfImage(pdfDoc, source = "") {
  const text = String(source || "").trim();
  if (!text) {
    return null;
  }
  try {
    let bytes = null;
    let mime = "";
    const dataMatch = text.match(/^data:(image\/(?:png|jpe?g|webp));base64,/i);
    if (dataMatch) {
      bytes = dataUrlToBytes(text);
      mime = dataMatch[1].toLowerCase();
    } else {
      const response = await fetch(text);
      if (!response.ok) {
        return null;
      }
      bytes = new Uint8Array(await response.arrayBuffer());
      mime = String(response.headers.get("content-type") || "").toLowerCase();
    }
    if (!bytes) {
      return null;
    }
    if (mime.includes("webp") || /\.webp(?:\?|$)/i.test(text)) {
      const converted = await convertPdfImageBytesToPng(bytes);
      if (!converted) {
        return null;
      }
      return pdfDoc.embedPng(converted);
    }
    const isPng = mime.includes("png") || /\.png(?:\?|$)/i.test(text);
    return isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
  } catch {
    return null;
  }
}

async function convertPdfImageBytesToPng(bytes) {
  if (typeof window !== "undefined" || !bytes) {
    return null;
  }
  try {
    const dynamicImport = new Function("specifier", "return import(specifier)");
    const sharpModule = await dynamicImport("sharp");
    const sharp = sharpModule.default || sharpModule;
    const buffer = Buffer.from(bytes);
    const png = await sharp(buffer).png().toBuffer();
    return new Uint8Array(png);
  } catch {
    return null;
  }
}

function drawCenteredImage(page, image, {
  x,
  y,
  width,
  maxHeight = 32,
} = {}) {
  if (!image) {
    return false;
  }
  const scale = Math.min(width / Math.max(1, image.width), maxHeight / Math.max(1, image.height), 1);
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;
  page.drawImage(image, {
    x: x + ((width - imageWidth) / 2),
    y,
    width: imageWidth,
    height: imageHeight,
  });
  return true;
}

function drawUploadedHeader(page, model, image, fonts, y = TOP_Y, {
  showWorkOrderNumber = true,
} = {}) {
  if (!image) {
    return drawDefaultHeader(page, {
      ...model,
      workOrderNumber: showWorkOrderNumber ? model.workOrderNumber : "",
    }, fonts, y);
  }
  const maxWidth = PAGE_WIDTH - (MARGIN_X * 2);
  const maxHeight = 88;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = MARGIN_X + ((maxWidth - width) / 2);
  const imageY = y - height;
  page.drawImage(image, { x, y: imageY, width, height });
  if (showWorkOrderNumber) {
    drawTextLine(page, clean(model.workOrderNumber), {
      x: MARGIN_X + maxWidth - 90,
      y: y - 5,
      width: 90,
      align: "right",
      font: fonts.regular,
      size: 8.6,
      color: MUTED,
    });
  }
  return imageY - 18;
}

function drawSimpleHeader(page, model, fonts) {
  const x = MARGIN_X;
  const y = TOP_Y;
  const width = PAGE_WIDTH - (MARGIN_X * 2);
  const height = 66;
  const innerWidth = width - 130;
  const serviceTitle = getReportServiceTitle(model);
  const serviceFontSize = serviceTitle.length > 62 ? 9 : 10.2;
  const serviceLines = wrapText(serviceTitle, fonts.bold, serviceFontSize, innerWidth).slice(0, 2);
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    borderColor: DARK,
    borderWidth: 0.8,
  });
  drawTextLine(page, clean(model.workOrderNumber), {
    x: x + width - 90,
    y: y - 8,
    width: 84,
    align: "right",
    font: fonts.regular,
    size: 8,
    color: MUTED,
  });
  drawTextLine(page, "ISPITNI IZVJEŠTAJ", {
    x,
    y: y - 21,
    width,
    align: "center",
    font: fonts.bold,
    size: 10.2,
  });
  serviceLines.forEach((line, index) => {
    drawTextLine(page, line, {
      x: x + 65,
      y: y - 37 - (index * 12),
      width: innerWidth,
      align: "center",
      font: fonts.bold,
      size: serviceFontSize,
    });
  });
  drawTextLine(page, clean(model.inspectionPlace), {
    x: x + 4,
    y: y - height + 14,
    font: fonts.regular,
    size: 7.8,
    color: MUTED,
  });
  return y - height - 14;
}

function normalizePdfPageOrientation(value = "") {
  return clean(value).toLowerCase() === "landscape" ? "landscape" : "portrait";
}

function getPdfPageMetrics(orientation = "portrait") {
  const isLandscape = normalizePdfPageOrientation(orientation) === "landscape";
  const width = isLandscape ? PAGE_HEIGHT : PAGE_WIDTH;
  const height = isLandscape ? PAGE_WIDTH : PAGE_HEIGHT;
  return {
    orientation: isLandscape ? "landscape" : "portrait",
    width,
    height,
    marginX: MARGIN_X,
    topY: height - 36,
    bottomY: BOTTOM_Y,
    contentWidth: width - (MARGIN_X * 2),
  };
}

function getPdfMeasurementOrientation(table = {}) {
  const signature = [
    table.id,
    table.key,
    table.label,
    table.summary,
    table.chapterTitle,
    table.assessmentLabel,
  ].map((entry) => clean(entry).toLowerCase()).join(" ");
  if (/\bipk\b|impedancija\s+petlje\s+kvara/.test(signature)) {
    return "landscape";
  }
  return normalizePdfPageOrientation(table.pageOrientation || table.orientation);
}

function drawMeasurementSimpleHeader(page, model, fonts, metrics = getPdfPageMetrics()) {
  const x = metrics.marginX;
  const y = metrics.topY;
  const width = metrics.contentWidth;
  const height = metrics.orientation === "landscape" ? 58 : 66;
  const innerWidth = width - 130;
  const serviceTitle = getReportServiceTitle(model);
  const serviceFontSize = serviceTitle.length > 62 ? 9 : 10.2;
  const serviceLines = wrapText(serviceTitle, fonts.bold, serviceFontSize, innerWidth).slice(0, 2);
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    borderColor: DARK,
    borderWidth: 0.8,
  });
  drawTextLine(page, clean(model.workOrderNumber), {
    x: x + width - 90,
    y: y - 8,
    width: 84,
    align: "right",
    font: fonts.regular,
    size: 8,
    color: MUTED,
  });
  drawTextLine(page, "ISPITNI IZVJEŠTAJ", {
    x,
    y: y - 21,
    width,
    align: "center",
    font: fonts.bold,
    size: 10.2,
  });
  serviceLines.forEach((line, index) => {
    drawTextLine(page, line, {
      x: x + 65,
      y: y - 37 - (index * 12),
      width: innerWidth,
      align: "center",
      font: fonts.bold,
      size: serviceFontSize,
    });
  });
  drawTextLine(page, clean(model.inspectionPlace), {
    x: x + 4,
    y: y - height + 14,
    font: fonts.regular,
    size: 7.8,
    color: MUTED,
  });
  return y - height - 14;
}

function drawKeyValueTable(page, entries, y, fonts, {
  keyWidth = 145,
  fontSize = 9.3,
  lineHeight = 12.3,
  minRowHeight = 18,
  bottomY = BOTTOM_Y,
  valueAlign = "left",
} = {}) {
  const x = MARGIN_X;
  const valueX = x + keyWidth + 8;
  const width = PAGE_WIDTH - (MARGIN_X * 2);
  const valueWidth = width - keyWidth - 8;
  let cursorY = y;
  entries.forEach(([key, value, strong = false]) => {
    if (cursorY < bottomY + 24) {
      return;
    }
    const valueLines = wrapText(value, strong ? fonts.bold : fonts.regular, fontSize, valueWidth);
    const rowHeight = Math.max(minRowHeight, (Math.max(1, valueLines.length) * lineHeight) + 5);
    drawTextLine(page, key, {
      x,
      y: cursorY - 4,
      font: fonts.bold,
      size: fontSize,
    });
    let valueY = cursorY - 4;
    valueLines.forEach((line) => {
      drawTextLine(page, line, {
        x: valueX,
        y: valueY,
        width: valueWidth,
        align: valueAlign,
        font: strong ? fonts.bold : fonts.regular,
        size: fontSize,
      });
      valueY -= lineHeight;
    });
    cursorY -= rowHeight;
  });
  return cursorY;
}

function drawPlainList(page, value, y, fonts, {
  fontSize = 8.7,
  lineHeight = 11.4,
  maxLines = 12,
  bottomY = BOTTOM_Y,
} = {}) {
  const x = MARGIN_X + 4;
  const width = PAGE_WIDTH - (MARGIN_X * 2) - 8;
  const sourceLines = splitTextLines(value);
  let cursorY = y;
  let drawn = 0;
  for (const entry of sourceLines.length ? sourceLines : [""]) {
    const lines = wrapText(entry, fonts.regular, fontSize, width);
    for (const line of lines) {
      if (drawn >= maxLines || cursorY - lineHeight < bottomY) {
        drawTextLine(page, "...", { x, y: cursorY, font: fonts.regular, size: fontSize });
        return cursorY - lineHeight;
      }
      drawTextLine(page, line || " ", { x, y: cursorY, font: fonts.regular, size: fontSize });
      cursorY -= lineHeight;
      drawn += 1;
    }
    cursorY -= 2;
  }
  return cursorY;
}

function getPdfTechnicalSectionTitle(model = {}) {
  return getServiceCode(model) === "EIZ" ? "TEHNIČKI PODACI SUSTAVA" : "TEHNIČKI PODACI";
}

function getPdfTechnicalDataEntries(value = "") {
  return splitTextLines(value)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex <= 0) {
        return [line, ""];
      }
      return [
        `${line.slice(0, separatorIndex).trim()}:`,
        line.slice(separatorIndex + 1).trim(),
      ];
    })
    .filter(([key, valueText]) => key || valueText);
}

function createContinuationPage(pdfDoc, model, fonts) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return {
    page,
    y: drawSimpleHeader(page, model, fonts),
  };
}

function parseRichTextBlocks(value = "") {
  const source = String(value || "").trim();
  if (!source) {
    return [];
  }
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    return splitTextLines(source.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "\n"))
      .map((text) => ({ type: "paragraph", text }));
  }
  const container = document.createElement("div");
  container.innerHTML = source;
  const blocks = [];
  const cleanNodeText = (node) => clean(String(node?.textContent || "").replace(/\s+/g, " "));
  const addImage = (element) => {
    const src = String(element.getAttribute("src") || "").trim();
    if (/^data:image\/(?:png|jpe?g);base64,/i.test(src) || /^https?:\/\//i.test(src)) {
      blocks.push({
        type: "image",
        src,
        alt: clean(element.getAttribute("alt") || "Slika rezultata ispitivanja"),
      });
    }
  };
  const visit = (node) => {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const element = node;
    const tag = element.tagName.toLowerCase();
    if (tag === "img") {
      addImage(element);
      return;
    }
    element.querySelectorAll(":scope > img").forEach(addImage);
    if (/^h[1-4]$/.test(tag)) {
      const text = cleanNodeText(element);
      if (text) blocks.push({ type: "heading", text });
      return;
    }
    if (tag === "ul" || tag === "ol") {
      Array.from(element.children).forEach((child, index) => {
        if (child.tagName?.toLowerCase() !== "li") return;
        const text = cleanNodeText(child);
        if (text) blocks.push({ type: "paragraph", text: tag === "ol" ? `${index + 1}. ${text}` : `- ${text}` });
      });
      return;
    }
    if (tag === "table") {
      Array.from(element.querySelectorAll("tr")).forEach((row) => {
        const text = Array.from(row.querySelectorAll("th,td"))
          .map((cell) => cleanNodeText(cell))
          .filter(Boolean)
          .join(" | ");
        if (text) blocks.push({ type: "paragraph", text });
      });
      return;
    }
    if (["p", "div", "blockquote"].includes(tag)) {
      const childImageCount = element.querySelectorAll(":scope > img").length;
      const text = cleanNodeText(element);
      if (text) {
        blocks.push({ type: "paragraph", text });
      } else if (!childImageCount) {
        Array.from(element.children).forEach(visit);
      }
      return;
    }
    Array.from(element.children).forEach(visit);
  };
  Array.from(container.children).forEach(visit);
  if (!blocks.length) {
    return splitTextLines(container.textContent || source)
      .map((text) => ({ type: "paragraph", text }));
  }
  return blocks;
}

function drawPaginatedTextBlock(pdfDoc, page, model, text, y, fonts, {
  font = fonts.regular,
  size = 8.6,
  lineHeight = 11.4,
  x = MARGIN_X + 2,
  width = PAGE_WIDTH - (MARGIN_X * 2) - 4,
  color = DARK,
  bottomY = BOTTOM_Y,
} = {}) {
  let currentPage = page;
  let cursorY = y;
  const lines = wrapText(text, font, size, width);
  lines.forEach((line) => {
    if (cursorY - lineHeight < bottomY) {
      const next = createContinuationPage(pdfDoc, model, fonts);
      currentPage = next.page;
      cursorY = next.y;
    }
    if (line) {
      drawTextLine(currentPage, line, { x, y: cursorY, width, font, size, color });
    }
    cursorY -= lineHeight;
  });
  return { page: currentPage, y: cursorY - 2 };
}

async function drawRichTextBlocks(pdfDoc, page, model, value, y, fonts) {
  const blocks = parseRichTextBlocks(value);
  let currentPage = page;
  let cursorY = y;
  if (!blocks.length) {
    return drawPaginatedTextBlock(pdfDoc, currentPage, model, "", cursorY, fonts);
  }
  for (const block of blocks) {
    if (block.type === "image") {
      const image = await embedPdfImage(pdfDoc, block.src);
      if (!image) {
        continue;
      }
      const maxWidth = PAGE_WIDTH - (MARGIN_X * 2) - 8;
      const maxHeight = 180;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = image.width * scale;
      const height = image.height * scale;
      if (cursorY - height - 16 < BOTTOM_Y) {
        const next = createContinuationPage(pdfDoc, model, fonts);
        currentPage = next.page;
        cursorY = next.y;
      }
      currentPage.drawImage(image, {
        x: MARGIN_X + ((PAGE_WIDTH - (MARGIN_X * 2) - width) / 2),
        y: cursorY - height,
        width,
        height,
      });
      cursorY -= height + 12;
      continue;
    }
    const result = drawPaginatedTextBlock(pdfDoc, currentPage, model, block.text, cursorY, fonts, {
      font: block.type === "heading" ? fonts.bold : fonts.regular,
      size: block.type === "heading" ? 9.2 : 8.6,
      lineHeight: block.type === "heading" ? 12.4 : 11.4,
    });
    currentPage = result.page;
    cursorY = result.y - (block.type === "heading" ? 2 : 0);
  }
  return { page: currentPage, y: cursorY };
}

function drawPageOne(pdfDoc, model, rows, fonts, headerImage) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const hasTechnicalData = splitTextLines(model.technicalData).length > 0;
  const lineTop = PAGE_HEIGHT - 92;
  page.drawRectangle({
    x: 18,
    y: BOTTOM_Y,
    width: 3,
    height: lineTop - BOTTOM_Y,
    color: BLUE,
  });
  let y = drawUploadedHeader(page, model, headerImage, fonts, TOP_Y, { showWorkOrderNumber: false });
  drawTextLine(page, "ZAPISNIK", {
    x: MARGIN_X,
    y: y - 6,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 23,
  });
  drawTextBlock(page, getReportCoverSubtitle(model), {
    x: MARGIN_X,
    y: y - 40,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 10.4,
    lineHeight: 13,
    maxLines: 2,
  });
  y -= 70;
  y = drawSectionTitle(page, 1, "OPĆI PODACI", y, fonts);
  y = drawKeyValueTable(page, [
    ["Naručitelj:", `${clean(model.companyName)}; ${clean(model.companyAddress)}; OIB: ${clean(model.companyOib)}`, true],
    ["Korisnik prostora:", clean(model.spaceUser)],
    ["Mjesto ispitivanja:", clean(model.inspectionPlace), true],
    ["Objekt ispitivanja:", clean(model.inspectionObject)],
    ["Vrsta ispitivanja:", clean(model.inspectionType)],
    ["Datum ispitivanja:", formatDocumentDate(model.inspectionDate), true],
    ["Broj zapisnika:", clean(model.recordNumber)],
  ], y, fonts, { fontSize: 8.7, lineHeight: 10.8, minRowHeight: 16.5 });
  y -= 4;
  if (hasTechnicalData) {
    y = drawSectionTitle(page, 2, getPdfTechnicalSectionTitle(model), y, fonts);
    const technicalEntries = getPdfTechnicalDataEntries(model.technicalData);
    y = technicalEntries.some(([, value]) => value)
      ? drawKeyValueTable(page, technicalEntries, y, fonts, { keyWidth: 150, fontSize: 8.1, lineHeight: 10.1, minRowHeight: 15 })
      : drawPlainList(page, model.technicalData, y, fonts, { maxLines: 5, fontSize: 8.2, lineHeight: 10.4 });
    y -= 4;
  }
  y = drawSectionTitle(page, hasTechnicalData ? 3 : 2, "MJERNA I ISPITNA OPREMA", y, fonts);
  y = drawPlainList(page, model.equipment, y, fonts, { maxLines: 7, fontSize: 8.2, lineHeight: 10.4 });
  y -= 4;
  y = drawSectionTitle(page, hasTechnicalData ? 4 : 3, "PRIMJENJENI PROPISI", y, fonts);
  y = drawPlainList(page, model.regulations, y, fonts, { maxLines: 14, fontSize: 7.7, lineHeight: 9.4 });
  drawFooter(page, "SPR-1/4", fonts);
  return { page, y: y - 5, sectionOffset: hasTechnicalData ? 1 : 0 };
}

function drawPageTwo(pdfDoc, model, fonts) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const sectionOffset = splitTextLines(model.technicalData).length > 0 ? 1 : 0;
  const systemDescription = cleanMultiline(model.systemDescription);
  let y = drawSimpleHeader(page, model, fonts);
  y = drawSectionTitle(page, 4 + sectionOffset, "KORIŠTENA TEHNIČKO-PROJEKTNA DOKUMENTACIJA", y, fonts);
  y = drawPlainList(page, model.projectDocumentation, y, fonts, { maxLines: 3, fontSize: 9, lineHeight: 12 });
  y -= 8;
  if (systemDescription) {
    y = drawSectionTitle(page, 5 + sectionOffset, "OPIS SUSTAVA", y, fonts);
    y = drawTextBlock(page, systemDescription, {
      x: MARGIN_X + 2,
      y,
      width: PAGE_WIDTH - (MARGIN_X * 2) - 4,
      font: fonts.regular,
      size: 8.7,
      lineHeight: 11.6,
      maxLines: 16,
    });
    y -= 8;
  }
  y = drawSectionTitle(page, 5 + sectionOffset + (systemDescription ? 1 : 0), "REZULTATI ISPITIVANJA", y, fonts);
  y = drawTextBlock(page, cleanMultiline(model.resultsText), {
    x: MARGIN_X + 2,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 4,
    font: fonts.regular,
    size: 8.7,
    lineHeight: 11.6,
    maxLines: 34,
  });
  y -= 8;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - 18,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    height: 18,
    color: LIGHT_GRAY,
  });
  drawTextLine(page, "Značenje oznaka:", {
    x: MARGIN_X + 5,
    y: y - 4,
    font: fonts.bold,
    size: 9,
  });
  y -= 28;
  y = drawTextBlock(page, clean(model.eiNote), {
    x: MARGIN_X + 4,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 8,
    font: fonts.regular,
    size: 8.4,
    lineHeight: 11,
    maxLines: 3,
  });
  drawTextBlock(page, clean(model.eiminNote), {
    x: MARGIN_X + 4,
    y: y - 4,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 8,
    font: fonts.regular,
    size: 8.4,
    lineHeight: 11,
    maxLines: 3,
  });
  drawFooter(page, "SPR-2/4", fonts);
  return page;
}

async function drawOpeningPages(pdfDoc, model, rows, fonts, headerImage) {
  let { page, y, sectionOffset } = drawPageOne(pdfDoc, model, rows, fonts, headerImage);
  const systemDescription = String(model.systemDescription || "").trim();
  const ensureSpace = (neededHeight = 72) => {
    if (y - neededHeight >= BOTTOM_Y) {
      return;
    }
    const next = createContinuationPage(pdfDoc, model, fonts);
    page = next.page;
    y = next.y;
  };

  ensureSpace(64);
  y = drawSectionTitle(page, 4 + sectionOffset, "KORIŠTENA TEHNIČKO-PROJEKTNA DOKUMENTACIJA", y, fonts);
  y = drawPlainList(page, model.projectDocumentation, y, fonts, { maxLines: 4, fontSize: 8.6, lineHeight: 11.2 });
  y -= 8;

  if (systemDescription) {
    ensureSpace(96);
    y = drawSectionTitle(page, 5 + sectionOffset, "OPIS SUSTAVA", y, fonts);
    const richSystem = await drawRichTextBlocks(pdfDoc, page, model, systemDescription, y, fonts);
    page = richSystem.page;
    y = richSystem.y - 6;
  }

  ensureSpace(96);
  y = drawSectionTitle(page, 5 + sectionOffset + (systemDescription ? 1 : 0), "REZULTATI ISPITIVANJA", y, fonts);
  const richResult = await drawRichTextBlocks(pdfDoc, page, model, model.resultsText, y, fonts);
  page = richResult.page;
  y = richResult.y - 6;

  const noteLines = [clean(model.eiNote), clean(model.eiminNote)].filter(Boolean);
  if (noteLines.length) {
    ensureSpace(58);
    page.drawRectangle({
      x: MARGIN_X,
      y: y - 18,
      width: PAGE_WIDTH - (MARGIN_X * 2),
      height: 18,
      color: LIGHT_GRAY,
    });
    drawTextLine(page, "Značenje oznaka:", {
      x: MARGIN_X + 5,
      y: y - 4,
      font: fonts.bold,
      size: 9,
    });
    y -= 28;
    for (const note of noteLines) {
      const noteResult = drawPaginatedTextBlock(pdfDoc, page, model, note, y, fonts, {
        x: MARGIN_X + 4,
        width: PAGE_WIDTH - (MARGIN_X * 2) - 8,
        size: 8.2,
        lineHeight: 10.8,
      });
      page = noteResult.page;
      y = noteResult.y - 2;
    }
  }
}

function drawCell(page, {
  x,
  y,
  width,
  height,
  text,
  fonts,
  font = fonts.regular,
  fontSize = 7.6,
  align = "center",
  fill = null,
  bold = false,
}) {
  if (fill) {
    page.drawRectangle({ x, y: y - height, width, height, color: fill });
  }
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    borderColor: DARK,
    borderWidth: 0.55,
  });
  const innerX = x + 3;
  const innerWidth = Math.max(4, width - 6);
  const lines = wrapText(text, bold ? fonts.bold : font, fontSize, innerWidth).slice(0, Math.max(1, Math.floor((height - 4) / (fontSize + 2))));
  const textHeight = lines.length * (fontSize + 2);
  let lineY = y - Math.max(5, (height - textHeight) / 2) + 1;
  lines.forEach((line) => {
    drawTextLine(page, line, {
      x: innerX,
      y: lineY,
      width: innerWidth,
      align,
      font: bold ? fonts.bold : font,
      size: fontSize,
    });
    lineY -= fontSize + 2;
  });
}

function normalizePdfChecklists(model = {}) {
  const preset = getReportPreset(model);
  const source = Array.isArray(model.checklists) && model.checklists.length > 0
    ? model.checklists
    : (Array.isArray(preset.checklists) ? preset.checklists : []);
  return source
    .filter((checklist) => checklist?.enabled !== false)
    .map((checklist, index) => ({
      id: clean(checklist.id || checklist.key || `checklist-${index + 1}`),
      key: clean(checklist.key || checklist.id || `checklist-${index + 1}`),
      label: clean(checklist.label || `Checklist ${index + 1}`),
      summary: clean(checklist.summary || ""),
      items: (Array.isArray(checklist.items) ? checklist.items : []).map((item, itemIndex) => ({
        id: clean(item.id || item.key || `checklist-item-${itemIndex + 1}`),
        label: clean(item.label || `Stavka ${itemIndex + 1}`),
        value: clean(item.value || item.defaultValue || "DA"),
      })),
    }))
    .filter((checklist) => checklist.items.length > 0);
}

function drawChecklistPage(pdfDoc, model, checklist, fonts) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawSimpleHeader(page, model, fonts);
  drawTextLine(page, checklist.label, {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 10.2,
  });
  if (checklist.summary) {
    drawTextLine(page, checklist.summary, {
      x: MARGIN_X,
      y: y - 16,
      width: PAGE_WIDTH - (MARGIN_X * 2),
      align: "center",
      font: fonts.regular,
      size: 7.6,
      color: MUTED,
    });
  }
  y -= 34;
  const firstColumnWidth = PAGE_WIDTH - (MARGIN_X * 2) - 104;
  drawCell(page, {
    x: MARGIN_X,
    y,
    width: firstColumnWidth,
    height: 42,
    text: "Predmet pregleda",
    fonts,
    bold: true,
    fill: TABLE_GRAY,
  });
  drawCell(page, {
    x: MARGIN_X + firstColumnWidth,
    y,
    width: 104,
    height: 42,
    text: "ZADOVOLJAVA\nDA/NE/NP",
    fonts,
    bold: true,
    fill: TABLE_GRAY,
  });
  y -= 42;
  checklist.items.forEach((item) => {
    const rowHeight = Math.max(
      36,
      Math.min(64, 24 + Math.max(String(item.label || "").length / 34, String(item.value || "").length / 18) * 8),
    );
    if (y - rowHeight < BOTTOM_Y + 10) {
      return;
    }
    drawCell(page, {
      x: MARGIN_X,
      y,
      width: firstColumnWidth,
      height: rowHeight,
      text: item.label,
      fonts,
      fontSize: 7.1,
      align: "left",
    });
    drawCell(page, {
      x: MARGIN_X + firstColumnWidth,
      y,
      width: 104,
      height: rowHeight,
      text: item.value,
      fonts,
      fontSize: 7.4,
      bold: true,
    });
    y -= rowHeight;
  });
  return page;
}

function drawChecklistPages(pdfDoc, model, fonts) {
  normalizePdfChecklists(model).forEach((checklist) => {
    drawChecklistPage(pdfDoc, model, checklist, fonts);
  });
}

function normalizePdfCellFormat(format = {}) {
  const source = format && typeof format === "object" && !Array.isArray(format) ? format : {};
  const backgroundColor = clean(source.backgroundColor || source.fill || "");
  const textAlign = clean(source.textAlign || source.align || "").toLowerCase();
  return {
    backgroundColor: /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "",
    textAlign: ["left", "center", "right"].includes(textAlign) ? textAlign : "",
  };
}

function colorFromHex(value = "", fallback = undefined) {
  const match = String(value || "").trim().match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) {
    return fallback;
  }
  return rgb(
    Number.parseInt(match[1], 16) / 255,
    Number.parseInt(match[2], 16) / 255,
    Number.parseInt(match[3], 16) / 255,
  );
}

function normalizePdfMeasurementSheet(sheet = {}) {
  const source = sheet && typeof sheet === "object" && !Array.isArray(sheet) ? sheet : {};
  const columns = Array.isArray(source.columns)
    ? source.columns.map((column, index) => ({
      id: clean(column?.id || `col_${index + 1}`),
      label: clean(column?.label || column?.id || `Kolona ${index + 1}`),
      placeholder: clean(column?.placeholder || ""),
      width: Number(column?.width) || 120,
      ai: column?.ai && typeof column.ai === "object" ? { ...column.ai } : undefined,
    })).filter((column) => column.id)
    : [];
  const rows = Array.isArray(source.rows)
    ? source.rows.map((row, rowIndex) => ({
      id: clean(row?.id || `measurement-row-${rowIndex + 1}`),
      cells: row?.cells && typeof row.cells === "object" && !Array.isArray(row.cells)
        ? Object.fromEntries(columns.map((column) => [column.id, clean(row.cells[column.id])]))
        : {},
      formats: row?.formats && typeof row.formats === "object" && !Array.isArray(row.formats)
        ? Object.fromEntries(columns.map((column) => [column.id, normalizePdfCellFormat(row.formats[column.id])]))
        : {},
    }))
    : [];
  const headerRows = Array.isArray(source.headerRows)
    ? Array.from(new Set(source.headerRows
      .map((row) => Number.parseInt(String(row), 10))
      .filter((row) => Number.isInteger(row) && row >= 0 && row < rows.length)))
    : [];
  const merges = Array.isArray(source.merges)
    ? source.merges.map((merge) => ({
      row: Number.parseInt(String(merge?.row ?? 0), 10),
      column: Number.parseInt(String(merge?.column ?? 0), 10),
      rowSpan: Math.max(1, Number.parseInt(String(merge?.rowSpan ?? 1), 10) || 1),
      columnSpan: Math.max(1, Number.parseInt(String(merge?.columnSpan ?? merge?.colSpan ?? 1), 10) || 1),
    })).filter((merge) => (
      Number.isInteger(merge.row)
      && Number.isInteger(merge.column)
      && merge.row >= 0
      && merge.column >= 0
      && merge.row < rows.length
      && merge.column < columns.length
    ))
    : [];
  return {
    columns,
    rows,
    headerRows,
    merges,
  };
}

function getPdfMeasurementFormulaAliases(table = {}, index = 0) {
  return [
    table.id,
    table.key,
    table.tokenKey,
    table.label,
    table.summary,
    table.sourceSheet,
    table.chapterTitle,
    table.assessmentLabel,
    `Sheet${index + 1}`,
    `Sheet ${index + 1}`,
    `Excel${index + 1}`,
    `Excel ${index + 1}`,
    `Excel tablica ${index + 1}`,
  ].filter(Boolean);
}

function isPdfFormulaSheetEntry(entry = {}) {
  const sourceSheet = clean(entry?.sourceSheet || entry?.sheetName).toLowerCase();
  const identity = [
    entry?.id,
    entry?.key,
    entry?.tokenKey,
    entry?.label,
    entry?.summary,
    sourceSheet,
  ].map((value) => clean(value).toLowerCase()).filter(Boolean).join(" ");
  return entry?.formulaOnly === true || sourceSheet === "expodaci" || identity.includes("expodaci");
}

function normalizePdfFormulaSheets(model = {}) {
  const explicit = Array.isArray(model?.formulaSheets) ? model.formulaSheets : [];
  const legacy = Array.isArray(model?.measurementTables)
    ? model.measurementTables.filter(isPdfFormulaSheetEntry)
    : [];
  const defaults = createDocumentationFormulaSheetsForService(getServiceCode(model));
  const source = explicit.length || legacy.length ? [...explicit, ...legacy] : defaults;
  const seen = new Set();
  return source
    .map((entry, index) => ({
      id: clean(entry?.id || entry?.key || entry?.sourceSheet || `formula-sheet-${index + 1}`),
      key: clean(entry?.key || entry?.id || entry?.sourceSheet || `formula-sheet-${index + 1}`),
      label: clean(entry?.label || entry?.summary || entry?.sourceSheet || `Formula sheet ${index + 1}`),
      summary: clean(entry?.summary || entry?.label || ""),
      sourceSheet: clean(entry?.sourceSheet || entry?.sheetName || entry?.label || ""),
      includeInReport: false,
      formulaOnly: true,
      pageOrientation: getPdfMeasurementOrientation(entry),
      sheet: normalizePdfMeasurementSheet(entry?.sheet),
    }))
    .filter((entry) => entry.sheet.columns.length)
    .filter((entry) => {
      const key = normalizePdfFormulaLookupKey(entry.sourceSheet || entry.key || entry.id || entry.label);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function buildPdfMeasurementFormulaContext(tables = [], currentTable = null, formulaSheets = []) {
  const lookup = new Map();
  const entries = [];
  let current = null;
  const currentKey = normalizePdfFormulaLookupKey([
    currentTable?.id,
    currentTable?.key,
    currentTable?.sourceSheet,
    currentTable?.label,
  ].filter(Boolean).join("|"));

  (Array.isArray(tables) ? tables : []).forEach((table, index) => {
    const sheet = normalizePdfMeasurementSheet(table.sheet);
    if (!sheet.columns.length) {
      return;
    }
    const entry = {
      key: clean(table.key || table.id || `measurement-table-${index + 1}`),
      table,
      sheet,
      index,
    };
    const tableKey = normalizePdfFormulaLookupKey([
      table.id,
      table.key,
      table.sourceSheet,
      table.label,
    ].filter(Boolean).join("|"));
    entries.push(entry);
    if (currentKey && tableKey === currentKey) {
      current = entry;
    }
    getPdfMeasurementFormulaAliases(table, index).forEach((alias) => addPdfFormulaSheetAlias(lookup, alias, entry));
  });

  (Array.isArray(formulaSheets) ? formulaSheets : []).forEach((table, index) => {
    const sheet = normalizePdfMeasurementSheet(table.sheet);
    if (!sheet.columns.length) {
      return;
    }
    const entry = {
      key: clean(table.key || table.id || table.sourceSheet || `formula-sheet-${index + 1}`),
      table: { ...table, formulaOnly: true, includeInReport: false },
      sheet,
      index: entries.length,
      formulaOnly: true,
    };
    entries.push(entry);
    getPdfMeasurementFormulaAliases(table, entry.index).forEach((alias) => addPdfFormulaSheetAlias(lookup, alias, entry));
  });

  return { entries, lookup, current };
}

function attachPdfMeasurementFormulaContexts(tables = [], formulaSheets = []) {
  const baseTables = (Array.isArray(tables) ? tables : []).map((table) => ({ ...table }));
  return baseTables.map((table) => ({
    ...table,
    formulaContext: buildPdfMeasurementFormulaContext(baseTables, table, formulaSheets),
  }));
}

function resolvePdfMeasurementFormulaEntry(reference = "", formulaContext = null, currentEntry = null) {
  const sheetName = getPdfFormulaReferenceSheetName(reference);
  const fallbackEntry = currentEntry || formulaContext?.current || null;
  if (!sheetName) {
    return fallbackEntry;
  }
  const lookupKey = normalizePdfFormulaLookupKey(sheetName);
  return formulaContext?.lookup?.get(lookupKey)
    || formulaContext?.lookup?.get(clean(sheetName).toLowerCase())
    || fallbackEntry;
}

function getPdfMeasurementFormulaRangeDescriptor(startReference, endReference, formulaContext = null, currentEntry = null, currentSheet = null) {
  const startEntry = resolvePdfMeasurementFormulaEntry(startReference, formulaContext, currentEntry);
  const endEntry = resolvePdfMeasurementFormulaEntry(endReference, formulaContext, currentEntry);
  const targetEntry = startEntry || currentEntry || formulaContext?.current || null;
  const targetSheet = targetEntry?.sheet || currentSheet;
  const start = parseMeasurementCellReference(startReference);
  const end = parseMeasurementCellReference(endReference);
  if ((startEntry?.key || currentEntry?.key || "current") !== (endEntry?.key || currentEntry?.key || "current")) {
    return null;
  }
  return {
    targetEntry,
    targetSheet,
    startRowIndex: Math.max(0, Math.min(start.rowIndex, end.rowIndex)),
    endRowIndex: Math.max(start.rowIndex, end.rowIndex),
    startColumnIndex: Math.max(0, Math.min(start.columnIndex, end.columnIndex)),
    endColumnIndex: Math.max(start.columnIndex, end.columnIndex),
  };
}

function getPdfMeasurementCellRawValue(sheet, rowIndex, columnIndex, stack = new Set(), formulaContext = null, sheetEntry = null) {
  const currentSheet = sheet || sheetEntry?.sheet || null;
  const currentEntry = sheetEntry || formulaContext?.current || { key: "current", sheet: currentSheet };
  const row = currentSheet?.rows?.[rowIndex];
  const column = currentSheet?.columns?.[columnIndex];
  if (!row || !column) {
    return "";
  }
  const rawValue = cleanMultiline(row.cells?.[column.id] ?? "");
  if (!isMeasurementFormula(rawValue)) {
    return rawValue;
  }
  const cellKey = `${currentEntry?.key || "current"}:${rowIndex}:${columnIndex}`;
  if (stack.has(cellKey)) {
    return "";
  }
  stack.add(cellKey);
  try {
    const value = evaluateMeasurementFormula(rawValue, {
      resolveCellReference(reference) {
        const targetEntry = resolvePdfMeasurementFormulaEntry(reference, formulaContext, currentEntry);
        const targetSheet = targetEntry?.sheet || currentSheet;
        const parsed = parseMeasurementCellReference(reference);
        if (!parsed) {
          return "";
        }
        const { rowIndex: referenceRowIndex, columnIndex: referenceColumnIndex } = parsed;
        return getPdfMeasurementCellRawValue(targetSheet, referenceRowIndex, referenceColumnIndex, stack, formulaContext, targetEntry || currentEntry);
      },
      resolveRange(startReference, endReference) {
        const descriptor = getPdfMeasurementFormulaRangeDescriptor(startReference, endReference, formulaContext, currentEntry, currentSheet);
        if (!descriptor) {
          return [];
        }
        const matrix = [];
        for (let referenceRowIndex = descriptor.startRowIndex; referenceRowIndex <= descriptor.endRowIndex; referenceRowIndex += 1) {
          const rowValues = [];
          for (let referenceColumnIndex = descriptor.startColumnIndex; referenceColumnIndex <= descriptor.endColumnIndex; referenceColumnIndex += 1) {
            if (
              referenceRowIndex < 0
              || referenceColumnIndex < 0
              || referenceRowIndex >= (descriptor.targetSheet?.rows?.length || 0)
              || referenceColumnIndex >= (descriptor.targetSheet?.columns?.length || 0)
            ) {
              rowValues.push("");
              continue;
            }
            rowValues.push(getPdfMeasurementCellRawValue(
              descriptor.targetSheet,
              referenceRowIndex,
              referenceColumnIndex,
              stack,
              formulaContext,
              descriptor.targetEntry || currentEntry,
            ));
          }
          matrix.push(rowValues);
        }
        return matrix;
      },
    });
    return clean(value);
  } catch {
    return "";
  } finally {
    stack.delete(cellKey);
  }
}

function mapLegacyRowsToSheet(legacyRows = [], table = {}) {
  const sheet = normalizePdfMeasurementSheet(table.sheet);
  if (!Array.isArray(legacyRows) || legacyRows.length === 0 || sheet.columns.length === 0) {
    return table.sheet;
  }
  const readLegacyValue = (row = {}, column = {}, columnIndex = 0) => {
    const id = column.id;
    const candidates = [
      row?.[id],
      id === "number" ? row?.number : "",
      id === "place" ? row?.place : "",
      id === "lampCount" ? row?.lampCount : "",
      id === "buttonCount" ? (row?.buttonCount || row?.lampCount) : "",
      id === "ei" ? row?.ei : "",
      id === "eimin" ? row?.eimin : "",
      id === "riz" ? row?.ei : "",
      id === "rdop" ? row?.eimin : "",
      id === "pass" ? row?.pass : "",
      columnIndex === 0 ? row?.number : "",
      columnIndex === 1 ? row?.place : "",
      columnIndex === sheet.columns.length - 1 ? row?.pass : "",
    ];
    return clean(candidates.find((value) => clean(value)) || "");
  };
  return {
    ...table.sheet,
    rows: legacyRows.map((row, index) => ({
      id: `measurement-row-${index + 1}`,
      cells: Object.fromEntries(sheet.columns.map((column, columnIndex) => [
        column.id,
        readLegacyValue(row, column, columnIndex),
      ])),
      formats: {},
    })),
  };
}

function normalizePdfMeasurementTables(model = {}, legacyRows = []) {
  if (String(getServiceCode(model) || "").trim().toUpperCase() === "EXOV") {
    return [];
  }
  const sourceTables = Array.isArray(model.measurementTables) && model.measurementTables.length > 0
    ? model.measurementTables
    : createDocumentationMeasurementTablesForService(getServiceCode(model));
  const normalizedTables = sourceTables
    .filter((table) => table?.enabled !== false)
    .filter((table) => !isPdfFormulaSheetEntry(table))
    .map((table, index) => {
    const base = table && typeof table === "object" ? table : {};
    const withLegacyRows = index === 0 && Array.isArray(legacyRows) && legacyRows.length > 0
      ? { ...base, sheet: mapLegacyRowsToSheet(legacyRows, base) }
      : base;
    return {
      id: clean(withLegacyRows.id || withLegacyRows.key || `measurement-table-${index + 1}`),
      key: clean(withLegacyRows.key || withLegacyRows.id || `measurement-table-${index + 1}`),
      label: clean(withLegacyRows.label || withLegacyRows.summary || `Tablica ${index + 1}`),
      summary: clean(withLegacyRows.summary || withLegacyRows.label || getMeasurementTableTitle(model)),
      assessmentLabel: clean(withLegacyRows.assessmentLabel || ""),
      chapterTitle: clean(withLegacyRows.chapterTitle || ""),
      sourceSheet: clean(withLegacyRows.sourceSheet || ""),
      includeInReport: withLegacyRows.includeInReport !== false,
      formulaOnly: withLegacyRows.formulaOnly === true,
      pageOrientation: getPdfMeasurementOrientation(withLegacyRows),
      legend: Array.isArray(withLegacyRows.legend)
        ? withLegacyRows.legend.map((entry) => clean(entry)).filter(Boolean)
        : undefined,
      note: clean(withLegacyRows.note || ""),
      conclusion: clean(withLegacyRows.conclusion || ""),
      sheet: normalizePdfMeasurementSheet(withLegacyRows.sheet),
    };
  });
  return attachPdfMeasurementFormulaContexts(normalizedTables, normalizePdfFormulaSheets(model));
}

function escapeNativeHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeNativeHtmlAttributeValue(value = "") {
  return escapeNativeHtml(String(value ?? "").replace(/[^\w\s:;,.%#/-]/g, "").slice(0, 120));
}

function sanitizeNativeRichHtml(value = "") {
  const allowedTags = new Set([
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "h1",
    "h2",
    "h3",
    "h4",
    "div",
    "span",
  ]);
  return String(value ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*\/?\s*([a-z][\w:-]*)\b([^>]*)>/gi, (match, tagName, rawAttributes) => {
      const tag = String(tagName || "").toLowerCase();
      if (!allowedTags.has(tag)) {
        return " ";
      }
      const closing = /^<\s*\//.test(match);
      if (closing) {
        return `</${tag}>`;
      }
      if (tag === "br") {
        return "<br>";
      }
      const attributes = [];
      if (tag === "td" || tag === "th") {
        const colspan = String(rawAttributes || "").match(/\bcolspan\s*=\s*(["']?)(\d{1,2})\1/i)?.[2];
        const rowspan = String(rawAttributes || "").match(/\browspan\s*=\s*(["']?)(\d{1,2})\1/i)?.[2];
        if (colspan) attributes.push(`colspan="${normalizeNativeHtmlAttributeValue(colspan)}"`);
        if (rowspan) attributes.push(`rowspan="${normalizeNativeHtmlAttributeValue(rowspan)}"`);
      }
      return `<${tag}${attributes.length ? ` ${attributes.join(" ")}` : ""}>`;
    });
}

function formatNativeRichTextHtml(value = "") {
  const source = cleanMultiline(value);
  if (!source) {
    return `<p class="muted">Nije upisano.</p>`;
  }
  if (/<[a-z][\s\S]*>/i.test(source)) {
    return sanitizeNativeRichHtml(source);
  }
  const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
  const html = [];
  let listItems = [];
  let tableRows = [];
  const flushList = () => {
    if (!listItems.length) return;
    html.push(`<ul>${listItems.map((item) => `<li>${escapeNativeHtml(item)}</li>`).join("")}</ul>`);
    listItems = [];
  };
  const flushTable = () => {
    if (!tableRows.length) return;
    const rows = tableRows.map((cells, rowIndex) => {
      const tag = rowIndex === 0 ? "th" : "td";
      return `<tr>${cells.map((cell) => `<${tag}>${escapeNativeHtml(cell || "-")}</${tag}>`).join("")}</tr>`;
    }).join("");
    html.push(`<table class="compact-table"><tbody>${rows}</tbody></table>`);
    tableRows = [];
  };
  const flushStructuredBlocks = () => {
    flushList();
    flushTable();
  };
  lines.forEach((line) => {
    const tableCells = line.includes("|")
      ? line.split("|").map((cell) => cell.trim())
      : [];
    if (tableCells.length >= 2 && tableCells.some(Boolean)) {
      flushList();
      tableRows.push(tableCells);
      return;
    }

    const bulletMatch = line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+)$/);
    if (bulletMatch) {
      flushTable();
      listItems.push(bulletMatch[1]);
      return;
    }
    flushStructuredBlocks();
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(3, headingMatch[1].length);
      html.push(`<h${level}>${escapeNativeHtml(headingMatch[2])}</h${level}>`);
      return;
    }
    const quoteMatch = line.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      html.push(`<blockquote>${escapeNativeHtml(quoteMatch[1])}</blockquote>`);
      return;
    }
    html.push(`<p>${escapeNativeHtml(line)}</p>`);
  });
  flushStructuredBlocks();
  return html.join("\n");
}

function renderNativeHtmlKeyValueRows(rows = []) {
  return rows
    .map(([label, value]) => [clean(label), clean(value)])
    .filter(([label, value]) => label || value)
    .map(([label, value]) => `
      <tr>
        <th>${escapeNativeHtml(label)}</th>
        <td>${escapeNativeHtml(value || "-")}</td>
      </tr>
    `)
    .join("");
}

function getNativeHtmlChecklists(model = {}) {
  const preset = getReportPreset(model);
  const source = Array.isArray(model.checklists) && model.checklists.length > 0
    ? model.checklists
    : (Array.isArray(preset.checklists) ? preset.checklists : []);
  return source
    .filter((checklist) => checklist?.enabled !== false)
    .map((checklist, index) => ({
      id: clean(checklist.id || checklist.key || `checklist-${index + 1}`),
      label: clean(checklist.label || checklist.summary || `Pregled ${index + 1}`),
      summary: clean(checklist.summary || ""),
      items: (Array.isArray(checklist.items) ? checklist.items : [])
        .map((item, itemIndex) => ({
          label: clean(item?.label || item?.title || `Stavka ${itemIndex + 1}`),
          value: clean(item?.value || item?.defaultValue || "DA"),
        }))
        .filter((item) => item.label),
    }))
    .filter((checklist) => checklist.items.length > 0);
}

function getNativeHtmlStatusClass(value = "") {
  const text = normalizePdfFormulaLookupKey(value);
  if (text.includes("nezadovoljava") || text === "ne" || text === "0") {
    return " status-fail";
  }
  if (text.includes("zadovoljava") || text === "da" || text === "1") {
    return " status-pass";
  }
  return "";
}

function renderNativeHtmlChecklists(model = {}) {
  const checklists = getNativeHtmlChecklists(model);
  if (!checklists.length) {
    return "";
  }
  return checklists.map((checklist) => `
    <section class="sn-ex-section">
      <h2>${escapeNativeHtml(checklist.label)}</h2>
      ${checklist.summary ? `<p class="section-lead">${escapeNativeHtml(checklist.summary)}</p>` : ""}
      <table class="sn-ex-checklist">
        <thead>
          <tr><th>Stavka</th><th>Ocjena</th></tr>
        </thead>
        <tbody>
          ${checklist.items.map((item) => `
            <tr>
              <td>${escapeNativeHtml(item.label)}</td>
              <td class="status${getNativeHtmlStatusClass(item.value)}">${escapeNativeHtml(item.value || "-")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `).join("");
}

function renderNativeHtmlAssessments(model = {}) {
  const assessments = normalizePdfMeasurementAssessments(model);
  const entries = assessments.length > 0
    ? assessments
    : [{ label: getAssessmentLabel(model), value: clean(model.resultStatus || "ZADOVOLJAVA") }];
  return `
    <table class="sn-ex-assessments">
      <tbody>
        ${entries.map((entry) => `
          <tr>
            <th>${escapeNativeHtml(entry.label)}</th>
            <td class="status${getNativeHtmlStatusClass(entry.value)}">${escapeNativeHtml(entry.value || "-")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function getNativeHtmlColumnPercentages(columns = []) {
  const total = columns.reduce((sum, column) => sum + (Number(column.width) || 120), 0) || columns.length || 1;
  return columns.map((column) => `${Math.max(4, ((Number(column.width) || 120) / total) * 100).toFixed(3)}%`);
}

function renderNativeHtmlMeasurementTable(table = {}, model = {}) {
  const sheet = normalizePdfMeasurementSheet(table.sheet);
  const columns = sheet.columns.length ? sheet.columns : [
    { id: "number", label: "R. br.", width: 70 },
    { id: "place", label: "Mjesto ispitivanja", width: 240 },
    { id: "pass", label: "ZADOVOLJAVA", width: 120 },
  ];
  const rows = getPdfMeasurementTableRows({ ...table, sheet });
  const widths = getNativeHtmlColumnPercentages(columns);
  const orientation = getPdfMeasurementOrientation(table);
  const tableTitle = [
    clean(table.label || getMeasurementTableTitle(model)),
    clean(table.summary || "").toLowerCase() !== clean(table.label || "").toLowerCase() ? clean(table.summary || "") : "",
  ].filter(Boolean).join(" - ");

  const bodyHtml = rows.length
    ? rows.map((row) => {
      const isHeader = sheet.headerRows.includes(row.rowIndex);
      const cellHtml = columns.map((column, columnIndex) => {
        if (isPdfMeasurementCoveredByMerge(sheet, row.rowIndex, columnIndex)) {
          return "";
        }
        const merge = getPdfMeasurementMerge(sheet, row.rowIndex, columnIndex);
        const tag = isHeader ? "th" : "td";
        const attributes = [];
        if (merge && merge.row === row.rowIndex && merge.column === columnIndex) {
          if (merge.columnSpan > 1) attributes.push(`colspan="${merge.columnSpan}"`);
          if (merge.rowSpan > 1) attributes.push(`rowspan="${merge.rowSpan}"`);
        }
        const value = row.cells?.[column.id] ?? "";
        const statusClass = column.id === "pass" ? getNativeHtmlStatusClass(value) : "";
        return `<${tag}${attributes.length ? ` ${attributes.join(" ")}` : ""} class="${column.id === "pass" ? `status${statusClass}` : ""}">${escapeNativeHtml(value || "")}</${tag}>`;
      }).join("");
      return `<tr class="${isHeader ? "grid-subheader" : ""}">${cellHtml}</tr>`;
    }).join("")
    : `<tr><td colspan="${columns.length}" class="muted">Nema upisanih redaka.</td></tr>`;

  return `
    <section class="sn-ex-section sn-ex-table-section ${orientation === "landscape" ? "landscape" : "portrait"}">
      <div class="table-heading">
        <h2>${escapeNativeHtml(tableTitle || getMeasurementTableTitle(model))}</h2>
        <span>${escapeNativeHtml(getServiceCode(model))}</span>
      </div>
      <table class="sn-ex-grid ${columns.length > 8 ? "dense" : ""}">
        <colgroup>
          ${widths.map((width) => `<col style="width:${width}">`).join("")}
        </colgroup>
        <thead>
          <tr>
            ${columns.map((column) => `<th>${escapeNativeHtml(column.label || column.id)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </section>
  `;
}

function renderNativeHtmlMeasurementTables(model = {}, rows = []) {
  const tables = normalizePdfMeasurementTables(model, rows).filter((table) => table.includeInReport !== false);
  if (!tables.length) {
    return "";
  }
  return tables.map((table) => renderNativeHtmlMeasurementTable(table, model)).join("");
}

function getNativeHtmlProvider(model = {}) {
  const name = clean(model.providerName || model.executorName || "SafeNexus");
  const address = clean(model.providerAddress || model.executorAddress || "");
  const oib = clean(model.providerOib || model.executorOib || "");
  const contact = [
    clean(model.providerPhone || ""),
    clean(model.providerEmail || ""),
    clean(model.providerWebsite || ""),
  ].filter(Boolean).join(" | ");
  const initials = (name.match(/\b[\p{L}\p{N}]/gu) || [])
    .slice(0, 3)
    .join("")
    .toUpperCase() || "SN";
  return { name, address, oib, contact, initials };
}

function renderNativeHtmlDocumentHeader(model = {}, serviceCode = "", {
  subtitle = "",
  showWorkOrderNumber = true,
} = {}) {
  const headerImage = clean(model.headerImageDataUrl || "");
  const workOrderNumber = clean(model.workOrderNumber || "");
  if (headerImage) {
    return `
      <header class="doc-header is-uploaded">
        <img src="${escapeNativeHtml(headerImage)}" alt="${escapeNativeHtml(clean(model.headerImageName || "Header dokumenta"))}">
        ${showWorkOrderNumber && workOrderNumber ? `<div class="doc-header-number">RN ${escapeNativeHtml(workOrderNumber)}</div>` : ""}
      </header>
    `;
  }
  const provider = getNativeHtmlProvider(model);
  const details = [
    provider.address,
    provider.oib ? `OIB: ${provider.oib}` : "",
    provider.contact,
  ].filter(Boolean).join(" | ");
  return `
    <header class="doc-header">
      <div class="doc-header-brand">
        <div class="doc-header-mark">${escapeNativeHtml(provider.initials)}</div>
        <div class="doc-header-copy">
          <div class="brand">${escapeNativeHtml(provider.name)}</div>
          ${details ? `<div class="muted">${escapeNativeHtml(details)}</div>` : ""}
          ${subtitle ? `<div class="muted">${escapeNativeHtml(subtitle)}</div>` : ""}
        </div>
      </div>
      <div class="code">
        <strong>${escapeNativeHtml(serviceCode)}</strong><br>
        RN ${escapeNativeHtml(workOrderNumber || "-")}
      </div>
    </header>
  `;
}

function renderNativeHtmlSignature(model = {}) {
  const fieldName = clean(model.signatureMode).toLowerCase() === "digital" ? signatureFieldName(model) : "";
  return `
    <div class="signature-row">
      <div class="stamp-box">M.P.</div>
      <div class="signature-box">
        <p>Dokaze iz Zapisnika ocijenio:</p>
        <strong>${escapeNativeHtml(clean(model.responsiblePerson) || "Ispitivac")}</strong>
        ${clean(model.signatureClass) ? `<span>KLASA: ${escapeNativeHtml(model.signatureClass)}</span>` : ""}
        ${clean(model.signatureNumber) ? `<span>${escapeNativeHtml(model.signatureNumber)}</span>` : ""}
        ${fieldName ? `<small>${escapeNativeHtml(fieldName)}</small>` : ""}
      </div>
    </div>
  `;
}

function renderNativeHtmlCertificatePage(model = {}, serviceCode = "", issuedText = "") {
  const certificateNumber = getCertificateNumber(model);
  const title = clean(model.certificateTitle || getReportPreset(model).certificateTitle || "UVJERENJE O ISPRAVNOSTI I FUNKCIONALNOSTI");
  const lead = cleanMultiline(model.certificateLead || getReportPreset(model).certificateLead || "");
  const resultText = cleanMultiline(model.certificateResultText || getReportPreset(model).certificateResultText || "");
  const rows = [
    ["Broj uvjerenja", certificateNumber],
    ["Izdaje se temeljem zapisnika", clean(model.recordNumber || "-")],
    ["Narucitelj", `${clean(model.companyName)}; ${clean(model.companyAddress)}; OIB: ${clean(model.companyOib)}`],
    ["Korisnik prostora", model.spaceUser],
    ["Mjesto ispitivanja", model.inspectionPlace],
    ["Objekt ispitivanja", model.inspectionObject],
    ["Vrsta ispitivanja", model.inspectionType],
    ["Datum ispitivanja", formatDocumentDate(model.inspectionDate)],
    ["Datum izdavanja", formatDocumentDate(model.issueDate)],
  ];
  return `
    <section class="sn-ex-cover certificate-cover">
      ${renderNativeHtmlDocumentHeader(model, serviceCode, { subtitle: "Uvjerenje" })}
      <div class="cover-title">
        <div class="eyebrow">Uvjerenje</div>
        <h1>${escapeNativeHtml(title)}</h1>
        <div class="subtitle">${escapeNativeHtml(getReportCoverSubtitle(model))}</div>
      </div>
      <section class="sn-ex-section">
        <div class="section-label">Podaci uvjerenja</div>
        <table class="meta-table"><tbody>${renderNativeHtmlKeyValueRows(rows)}</tbody></table>
      </section>
      ${lead ? `<section class="sn-ex-section"><div class="text-box">${formatNativeRichTextHtml(lead)}</div></section>` : ""}
      ${resultText ? `<section class="sn-ex-section"><div class="text-box">${formatNativeRichTextHtml(resultText)}</div></section>` : ""}
      <section class="sn-ex-section certificate-number-box">
        <p>Broj uvjerenja:</p>
        <h2>${escapeNativeHtml(certificateNumber || "-")}</h2>
        <p class="issued">U ${escapeNativeHtml(issuedText || "Zagrebu")}</p>
        ${renderNativeHtmlSignature(model)}
      </section>
    </section>
  `;
}

function renderNativeHtmlConclusionPage(model = {}, serviceCode = "", {
  issuedText = "",
  conclusionStatus = "",
} = {}) {
  const certificateCapable = isCertificateCapableReport(model);
  const certificateIssued = shouldIssueCertificate(model);
  if (certificateCapable && !certificateIssued) {
    const factualNote = getCertificateFactualNote(model) || "Upisati utvrdjeno cinjenicno stanje.";
    return `
      <section class="conclusion-page">
        ${renderNativeHtmlDocumentHeader(model, serviceCode, { subtitle: serviceCode })}
        <section class="sn-ex-section">
          <div class="section-label">Napomena</div>
          <div class="text-box">${formatNativeRichTextHtml(factualNote)}</div>
        </section>
        <p class="issued">U ${escapeNativeHtml(issuedText || "Zagrebu")}</p>
        ${renderNativeHtmlSignature(model)}
      </section>
    `;
  }
  const issuedDocumentLabel = certificateIssued ? "UVJERENJE" : "ZAPISNIK";
  const issuedNumber = certificateIssued ? getCertificateNumber(model) : clean(model.recordNumber || "-");
  return `
    <section class="conclusion-page">
      ${renderNativeHtmlDocumentHeader(model, serviceCode, { subtitle: serviceCode })}
      ${isFailingResult(model) ? `
        <section class="sn-ex-section">
          <div class="section-label">Nedostatci</div>
          <div class="text-box">${formatNativeRichTextHtml(model.defects || "Nema utvrdjenih nedostataka.")}</div>
        </section>
      ` : ""}
      <section class="sn-ex-section">
        <div class="section-label">Preporuke</div>
        <div class="text-box">${formatNativeRichTextHtml(model.recommendations || "Redovito odrzavati i provjeravati predmetni sustav.")}</div>
      </section>
      <section class="sn-ex-section">
        <div class="section-label">Ocjena rezultata ispitivanja</div>
        <p>Na temelju usporedbe rezultata mjerenja i ispitivanja s propisanim odnosno dopustenim parametrima utvrdjeno je slijedece:</p>
        ${renderNativeHtmlAssessments(model)}
      </section>
      <section class="sn-ex-section">
        <div class="section-label">Zakljucak</div>
        <p>${escapeNativeHtml(getConclusionLead(model))}</p>
        <div class="conclusion-status">${escapeNativeHtml(conclusionStatus)}</div>
        <p>zahtjeve spomenutih propisa u pogledu navedenih ispitivanja, te se za navedeno izdaje ${issuedDocumentLabel} broj:</p>
        <h2 style="text-align:center">${escapeNativeHtml(issuedNumber)}</h2>
        <p style="text-align:center">${escapeNativeHtml(getValiditySentence(model))} ${escapeNativeHtml(formatDocumentDate(model.validUntil))}</p>
        <p class="issued">U ${escapeNativeHtml(issuedText || "Zagrebu")}</p>
        ${renderNativeHtmlSignature(model)}
      </section>
    </section>
  `;
}

const EX_EXCEL_SERVICE_TITLES = Object.freeze({
  EXEI: "O ISPITIVANJU INSTALACIJA U PODRUČJIMA S EKSPLOZIVNOM ATMOSFEROM",
  EXSE: "O MJERENJU OTPORA UZEMLJENJA I STATIČKOG ELEKTRICITETA",
  EXOV: "O FUNKCIONALNOM ISPITIVANJU ODZRAČNIH VENTILA",
});

const EX_EXCEL_SERVICE_PREFIXES = Object.freeze({
  EXEI: "ExEi",
  EXSE: "ExSe",
  EXOV: "ExOv",
});

const EX_EXCEL_TABLE_ORIENTATIONS = Object.freeze({
  EXEI: {
    "exei-cista-ipk": "landscape",
    "exei-cista-oi": "portrait",
    "exei-cista-zuds": "portrait",
    "exei-cista-pe-ipk": "portrait",
    "exei-cista-pe-direct": "landscape",
    "exei-cista-motors": "landscape",
    "exei-cista-overload-e": "portrait",
    "exei-cista-overload-d": "portrait",
  },
  EXSE: {
    "exse-cista-earthing": "portrait",
    "exse-cista-static": "portrait",
  },
});

const EX_EXCEL_TABLE_DETAILS = Object.freeze({
  "exei-cista-ipk": {
    legend: [
      "Z(L-PE) - zemljospojna impedancija petlje [ohm]",
      "Z(L-L) - medufazna impedancija petlje [ohm]",
      "Z(L-N) - impedancija petlje prema nultom vodicu [ohm]",
      "Izem - minimalna struja zemljospoja (L-PE) [A]",
      "Ik1min - minimalna struja jednopolnog kratkog spoja (L-N) [A]",
      "Ik2min - minimalna struja dvopolnog kratkog spoja (L-L) [A]",
      "U0 - napon dodira [V]",
      "td - najvece dozvoljeno vrijeme iskljucenja [s]",
      "Ia - struja djelovanja zastitnog uredaja kod td [A]",
      "Tablica vremena iskljucenja vrijedi za krugove nazivne struje do 32 A u zoni opasnosti 2.",
    ],
    conclusion: "Rezultat ispitivanja: izmjerena vrijednost struje prorade i vrijeme prorade zadovoljava uvjete navedenih normi.",
  },
  "exei-cista-oi": {
    legend: [
      "L1, L2, L3 - fazni vodici",
      "N - neutralni vodic",
      "PE - zastitni vodic",
      "Riso - izmjereni otpor izolacije [Mohm]",
      "Rd - dozvoljeni otpor izolacije [Mohm]",
      "Kriterij: SELV/PELV 250 V DC i Rd >= 0,5 Mohm; do 500 V 500 V DC i Rd >= 1,0 Mohm; iznad 500 V 1000 V DC i Rd >= 1,0 Mohm.",
    ],
    conclusion: "Ispitni rezultat: ZADOVOLJAVA. Dobiveni rezultati su u skladu s normom HRN EN 60364-6, tocka 61.3.3.",
  },
  "exei-cista-zuds": {
    legend: [
      "In - nazivna struja ZUDS-a [A]",
      "Idn - nazivna diferencijalna struja ZUDS-a [mA]",
      "Iisk - izmjerena struja prorade/iskljucenja [mA]",
      "tisk - izmjereno vrijeme prorade/iskljucenja [ms]",
      "U0 - napon dodira [V]",
      "tdoz - najvece dozvoljeno vrijeme iskljucenja [ms]",
      "Standardna RCD: 1xIdn 0,3 s; 2xIdn 0,15 s; 5xIdn 0,04 s.",
      "Selektivna RCD: 1xIdn 0,5 s; 2xIdn 0,2 s; 5xIdn 0,2 s.",
      "Podrucje djelovanja: AC (0,5 do 1)xIdn; A (0,35 do 1,4)xIdn; B (0,5 do 2)xIdn.",
    ],
    conclusion: "Rezultat ispitivanja: izmjera struja prorade i vrijeme prorade zadovoljava uvjete navedenih normi.",
  },
  "exei-cista-pe-ipk": {
    legend: [
      "SPE - presjek zastitnog PE vodica [mm2]",
      "SPEd - presjek dodatnog vanjskog PE vodica [mm2]",
      "Z(L-PE) - zemljospojna impedancija petlje",
      "Z(L-PE1) - impedancija petlje uz odspojen zastitni vodic",
      "Z(L-PE2) - impedancija petlje uz odspojen dodatni PE vodic",
    ],
    conclusion: "Rezultat ispitivanja: izmjereni otpor izmedu elektricnog uredaja preko zastitnog vodica i glavnog uzemljenja zadovoljava uvjete navedenih normi.",
  },
  "exei-cista-pe-direct": {
    legend: [
      "Iisp - ispitna struja 0,2 A",
      "S - presjek ispitivanog PE vodica",
      "Rizm - izmjereni otpor ispitivanog PE vodica",
      "Rocek - ocekivani otpor ispitivanog PE vodica",
    ],
    conclusion: "Rezultat ispitivanja: izmjereni otpor izmedu zastitnog vodica i metalnih masa iznosi najvise Rp <= 2 ohm, sto zadovoljava uvjete navedenih normi.",
  },
  "exei-cista-motors": {
    legend: [
      "I L1, L2, L3 - izmjerena struja po linijama L1, L2 i L3",
      "In - nazivna struja elektromotora [A]",
      "R1, R2, R3 - izmjereni otpor po namotaju elektromotora [ohm]",
      "Riso PE-1-2-3 - mjereni otpor izolacije izmedu namota i uzemljenja elektromotora",
      "Riso I-I - mjereni otpor izolacije izmedu namota elektromotora",
    ],
    note: "Napomena:",
    conclusion: "Rezultat ispitivanja: izmjerene vrijednosti zadovoljavaju uvjete navedene u normi.",
  },
  "exei-cista-overload-e": {
    legend: [
      "In - nazivna struja elektromotora [A]",
      "Ip - podesena struja na zastitnom uredaju [A]",
      "Ia/In - omjer potezne i nazivne struje motora",
      "Iis - ispitna struja [A]",
      "tE - najvece dopusteno vrijeme u zakocenom stanju motora [s]",
      "tisk - izmjereno vrijeme prorade [s]",
      "tdoz - vrijeme prorade zastite prema I/t karakteristici [s]",
    ],
    conclusion: "Rezultat ispitivanja: izmjerena vrijednost vremena prorade zadovoljava uvjete navedenih normi.",
  },
  "exei-cista-overload-d": {
    legend: [
      "In - nazivna struja elektromotora [A]",
      "Ip - podesena struja na zastitnom uredaju [A]",
      "Iis - ispitna struja [A]",
      "tisk - vrijeme prorade zastite prema I/t karakteristici [s]",
      "tdoz - vrijeme prorade zastite prema I/t karakteristici [s]",
    ],
    conclusion: "Rezultat ispitivanja: izmjerena vrijednost vremena prorade zadovoljava uvjete navedenih normi.",
  },
});

const EX_EXCEL_TABLE_DETAIL_ALIASES = Object.freeze({
  "exei-ipk": "exei-cista-ipk",
  "exei-oi": "exei-cista-oi",
  "exei-zuds": "exei-cista-zuds",
  "exei-pe": "exei-cista-pe-ipk",
  "exei-equipment": "exei-cista-motors",
  "exei-bimetal": "exei-cista-overload-e",
  "exei1.2": "exei-cista-ipk",
  "exei1.3": "exei-cista-oi",
  "exei1.4": "exei-cista-zuds",
  "exei1.5": "exei-cista-pe-ipk",
  "exei1.6": "exei-cista-pe-direct",
  "exei1.7": "exei-cista-motors",
  "exei1.8": "exei-cista-overload-e",
  "exei1.9": "exei-cista-overload-d",
});

function isExExcelDocumentation(model = {}) {
  return Object.prototype.hasOwnProperty.call(EX_EXCEL_SERVICE_TITLES, clean(getServiceCode(model)).toUpperCase());
}

function getExExcelServicePrefix(serviceCode = "") {
  return EX_EXCEL_SERVICE_PREFIXES[clean(serviceCode).toUpperCase()] || clean(serviceCode).toUpperCase() || "Ex";
}

function getExExcelTitle(serviceCode = "", model = {}) {
  const code = clean(serviceCode).toUpperCase();
  return EX_EXCEL_SERVICE_TITLES[code] || clean(model.reportTitle || getReportServiceTitle(model));
}

function getExExcelProvider(model = {}) {
  const name = clean(model.providerName || model.executorName || "SafeNexus");
  const address = clean(model.providerAddress || model.executorAddress || "");
  const oib = clean(model.providerOib || model.executorOib || "");
  const contact = [
    clean(model.providerPhone || ""),
    clean(model.providerEmail || ""),
    clean(model.providerWebsite || ""),
  ].filter(Boolean).join(" | ");
  const initials = (name.match(/\b[\p{L}\p{N}]/gu) || [])
    .slice(0, 3)
    .join("")
    .toUpperCase() || "SN";
  return { name, address, oib, contact, initials };
}

function renderExExcelText(value = "", fallback = "") {
  const text = cleanMultiline(value || fallback);
  return escapeNativeHtml(text || "-").replace(/\n/g, "<br>");
}

function renderExExcelRichBox(value = "", fallback = "") {
  return `<div class="ex-text-box">${formatNativeRichTextHtml(value || fallback)}</div>`;
}

function renderExExcelSection(number = "", title = "", bodyHtml = "", extraClass = "") {
  return `
    <section class="ex-section ${extraClass}">
      <div class="ex-section-title">${number ? `${escapeNativeHtml(number)} ` : ""}${escapeNativeHtml(title)}</div>
      ${bodyHtml}
    </section>
  `;
}

function renderExExcelKeyValueTable(rows = []) {
  const body = rows
    .map(([label, value]) => [clean(label), cleanMultiline(value)])
    .filter(([label, value]) => label || value)
    .map(([label, value]) => `
      <tr>
        <th>${escapeNativeHtml(label)}</th>
        <td>${renderExExcelText(value)}</td>
      </tr>
    `)
    .join("");
  return `<table class="ex-kv"><tbody>${body || `<tr><td class="ex-muted">Nije upisano.</td></tr>`}</tbody></table>`;
}

function getExExcelCommonRows(model = {}) {
  return [
    ["Naručitelj", [
      clean(model.companyName),
      clean(model.companyAddress),
      clean(model.companyOib) ? `OIB: ${clean(model.companyOib)}` : "",
    ].filter(Boolean).join("\n")],
    ["Korisnik prostora", model.spaceUser],
    ["Mjesto ispitivanja", model.inspectionPlace],
    ["Objekt ispitivanja", model.inspectionObject],
    ["Vrsta ispitivanja", model.inspectionType],
    ["Datum ispitivanja", formatDocumentDate(model.inspectionDate)],
    ["Broj zapisnika", model.recordNumber],
  ];
}

function renderExExcelTechnicalBody(model = {}) {
  const rows = getPdfTechnicalDataEntries(model.technicalData);
  if (rows.some(([, value]) => clean(value))) {
    return renderExExcelKeyValueTable(rows);
  }
  return renderExExcelRichBox(model.technicalData);
}

function renderExExcelHeader(model = {}, serviceCode = "") {
  const provider = getExExcelProvider(model);
  const headerImage = clean(model.headerImageDataUrl || "");
  return `
    <header class="ex-header">
      <div class="ex-brand">
        ${headerImage ? `<img src="${escapeNativeHtml(headerImage)}" alt="">` : `<div class="ex-brand-mark">${escapeNativeHtml(provider.initials)}</div>`}
        <div>
          <strong>${escapeNativeHtml(provider.name)}</strong>
          <span>${escapeNativeHtml(provider.address || "Dokumentacija ispitivanja")}</span>
          ${provider.oib ? `<span>OIB: ${escapeNativeHtml(provider.oib)}</span>` : ""}
        </div>
      </div>
      <div class="ex-header-center">
        <strong>Sektor: ZAŠTITNI SUSTAVI</strong>
        <span>Zaštita na radu | Zaštita od požara | Zaštita okoliša</span>
      </div>
      <div class="ex-header-meta">
        <strong>${escapeNativeHtml(getExExcelServicePrefix(serviceCode))}</strong>
        <span>RN ${escapeNativeHtml(clean(model.workOrderNumber || "-"))}</span>
      </div>
    </header>
  `;
}

function renderExExcelFooter(model = {}, serviceCode = "", pageNumber = 1, totalPages = 1) {
  return `
    <footer class="ex-footer">
      <span>${escapeNativeHtml(getExExcelServicePrefix(serviceCode))}-${pageNumber}/${totalPages}</span>
      <span>Povjerenje se stvara osjećajem sigurnosti</span>
      <span>${escapeNativeHtml(clean(model.recordNumber || ""))}</span>
    </footer>
  `;
}

function renderExExcelCoverTitle(model = {}, serviceCode = "") {
  return `
    <div class="ex-cover-title">
      <h1>Z A P I S N I K</h1>
      <h2>${escapeNativeHtml(getExExcelTitle(serviceCode, model))}</h2>
      <p>${escapeNativeHtml(clean(model.coverSubtitle || getReportCoverSubtitle(model)))}</p>
    </div>
  `;
}

function renderExExcelCoverPageOne(model = {}, serviceCode = "") {
  if (serviceCode === "EXOV") {
    return `
      ${renderExExcelCoverTitle(model, serviceCode)}
      ${renderExExcelSection("1.", "OPĆI PODACI", renderExExcelKeyValueTable(getExExcelCommonRows(model)))}
      ${renderExExcelSection("2.", "MJERNE METODE", renderExExcelRichBox(model.resultsText || model.systemDescription))}
      ${renderExExcelSection("3.", "PRIMIJENJENI PROPISI", renderExExcelRichBox(model.regulations))}
      ${renderExExcelSection("4.", "KORIŠTENA TEHNIČKO-PROJEKTNA DOKUMENTACIJA", renderExExcelRichBox(model.projectDocumentation))}
      ${renderExExcelSection("5.", "NEDOSTATCI", renderExExcelRichBox(model.defects, "Nisu utvrđeni nedostatci."))}
    `;
  }
  return `
    ${renderExExcelCoverTitle(model, serviceCode)}
    ${renderExExcelSection("1.", "OPĆI PODACI", renderExExcelKeyValueTable(getExExcelCommonRows(model)))}
    ${renderExExcelSection("2.", getPdfTechnicalSectionTitle(model).toUpperCase(), renderExExcelTechnicalBody(model))}
    ${renderExExcelSection("3.", "MJERNA I ISPITNA OPREMA", renderExExcelRichBox(model.equipment))}
  `;
}

function renderExExcelCoverPageTwo(model = {}, serviceCode = "") {
  return `
    <div class="ex-page-heading">
      <strong>ZAPISNIK</strong>
      <span>${escapeNativeHtml(getExExcelTitle(serviceCode, model))}</span>
    </div>
    ${renderExExcelSection("4.", "PRIMIJENJENI PROPISI", renderExExcelRichBox(model.regulations))}
    ${renderExExcelSection("5.", "KORIŠTENA TEHNIČKO-PROJEKTNA DOKUMENTACIJA", renderExExcelRichBox(model.projectDocumentation))}
    ${renderExExcelSection("6.", "OPIS SUSTAVA", renderExExcelRichBox(model.systemDescription))}
    ${renderExExcelSection("7.", "REZULTATI ISPITIVANJA", renderExExcelRichBox(model.resultsText))}
  `;
}

function getExExcelTableOrientation(serviceCode = "", table = {}) {
  const code = clean(serviceCode).toUpperCase();
  const key = clean(table.key || table.id || "").toLowerCase();
  const mapped = EX_EXCEL_TABLE_ORIENTATIONS[code]?.[key];
  return mapped || getPdfMeasurementOrientation(table);
}

function getExExcelRowsPerPage(serviceCode = "", orientation = "portrait", columns = []) {
  const code = clean(serviceCode).toUpperCase();
  if (code === "EXEI") {
    return orientation === "landscape" ? 5 : 4;
  }
  if (code === "EXSE") {
    return 16;
  }
  if (columns.length >= 14) {
    return orientation === "landscape" ? 8 : 6;
  }
  return orientation === "landscape" ? 12 : 18;
}

function getExExcelMeasurementRows(table = {}) {
  const sheet = normalizePdfMeasurementSheet(table.sheet);
  const columns = sheet.columns.length ? sheet.columns : [
    { id: "number", label: "R. br.", width: 70 },
    { id: "place", label: "Mjesto ispitivanja", width: 240 },
    { id: "pass", label: "ZADOVOLJAVA", width: 120 },
  ];
  const sourceRows = sheet.rows.length ? sheet.rows : Array.from({ length: 8 }, (_, index) => ({
    id: `blank-${index + 1}`,
    cells: {},
    formats: {},
  }));
  return sourceRows.map((row, rowIndex) => ({
    ...row,
    rowIndex,
    cells: Object.fromEntries(columns.map((column, columnIndex) => [
      column.id,
      clean(getPdfMeasurementCellRawValue(sheet, rowIndex, columnIndex, new Set(), table.formulaContext, table.formulaContext?.current)),
    ])),
    formats: row.formats || {},
  }));
}

function getExExcelColumnLabel(column = {}) {
  const label = clean(column.label || column.placeholder || column.id);
  return /^razmak\b/i.test(label) ? "" : label;
}

function getExExcelColumnPercentages(columns = []) {
  const weighted = columns.map((column) => {
    const label = getExExcelColumnLabel(column);
    const spacer = !label;
    return {
      ...column,
      width: spacer ? 22 : (Number(column.width) || 120),
    };
  });
  return getNativeHtmlColumnPercentages(weighted);
}

function renderExExcelMeasurementGrid(table = {}, rows = [], serviceCode = "") {
  const sheet = normalizePdfMeasurementSheet(table.sheet);
  const columns = sheet.columns.length ? sheet.columns : [
    { id: "number", label: "R. br.", width: 70 },
    { id: "place", label: "Mjesto ispitivanja", width: 240 },
    { id: "pass", label: "ZADOVOLJAVA", width: 120 },
  ];
  const widths = getExExcelColumnPercentages(columns);
  const densityClass = columns.length >= 18 ? "superdense" : columns.length >= 12 ? "dense" : "";
  const body = rows.map((row) => `
    <tr>
      ${columns.map((column, columnIndex) => {
        if (isPdfMeasurementCoveredByMerge(sheet, row.rowIndex, columnIndex)) {
          return "";
        }
        const merge = getPdfMeasurementMerge(sheet, row.rowIndex, columnIndex);
        const attributes = [];
        if (merge && merge.row === row.rowIndex && merge.column === columnIndex) {
          if (merge.columnSpan > 1) attributes.push(`colspan="${merge.columnSpan}"`);
          if (merge.rowSpan > 1) attributes.push(`rowspan="${merge.rowSpan}"`);
        }
        const value = row.cells?.[column.id] ?? "";
        const statusClass = /pass|ocjena|zadovoljava/i.test(column.id) || /zadovoljava|ocjena/i.test(column.label || "")
          ? getNativeHtmlStatusClass(value)
          : "";
        return `<td${attributes.length ? ` ${attributes.join(" ")}` : ""} class="${statusClass}">${escapeNativeHtml(value)}</td>`;
      }).join("")}
    </tr>
  `).join("");
  return `
    <table class="ex-grid ${densityClass}" data-service="${escapeNativeHtml(clean(serviceCode))}">
      <colgroup>${widths.map((width) => `<col style="width:${width}">`).join("")}</colgroup>
      <thead>
        <tr>${columns.map((column) => `<th>${escapeNativeHtml(getExExcelColumnLabel(column))}</th>`).join("")}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function getExExcelTableDetails(table = {}) {
  const candidates = [
    table.key,
    table.id,
    table.tokenKey,
    table.sourceSheet,
    table.templateSheetName,
    table.label,
  ].map((value) => clean(value).toLowerCase()).filter(Boolean);
  for (const candidate of candidates) {
    const direct = EX_EXCEL_TABLE_DETAILS[candidate];
    if (direct) {
      return direct;
    }
    const alias = EX_EXCEL_TABLE_DETAIL_ALIASES[candidate];
    if (alias && EX_EXCEL_TABLE_DETAILS[alias]) {
      return EX_EXCEL_TABLE_DETAILS[alias];
    }
  }
  return null;
}

function renderExExcelTableDetails(table = {}) {
  const details = getExExcelTableDetails(table);
  if (!details) {
    return "";
  }
  return `
    <div class="ex-legend-block">
      <strong>Značenje oznaka:</strong>
      <div class="ex-legend-grid">
        ${(details.legend || []).map((line) => `<span>${escapeNativeHtml(line)}</span>`).join("")}
      </div>
      ${details.note ? `<p class="ex-note">${escapeNativeHtml(details.note)}</p>` : ""}
      ${details.conclusion ? `<p class="ex-sheet-conclusion"><strong>ZAKLJUČAK</strong> ${escapeNativeHtml(details.conclusion)}</p>` : ""}
    </div>
  `;
}

function renderExExcelMeasurementPageContent(model = {}, serviceCode = "", table = {}, rows = [], tablePageIndex = 0, tablePageCount = 1) {
  const primaryTitle = clean(table.label || getMeasurementTableTitle(model));
  const summary = clean(table.summary || table.assessmentLabel || "");
  const showTableDetails = tablePageIndex === Math.max(0, tablePageCount - 1);
  return `
    <div class="ex-report-heading">
      <div>
        <strong>ISPITNI IZVJEŠTAJ</strong>
        <span>${escapeNativeHtml(summary || getExExcelServicePrefix(serviceCode))}</span>
      </div>
      <div>
        <span>Broj zapisnika</span>
        <strong>${escapeNativeHtml(clean(model.recordNumber || "-"))}</strong>
      </div>
    </div>
    <h3 class="ex-measurement-title">${escapeNativeHtml(primaryTitle.toUpperCase())}${tablePageIndex > 0 ? " - nastavak" : ""}</h3>
    <div class="ex-measurement-meta">
      <span>Mjesto ispitivanja: ${escapeNativeHtml(clean(model.inspectionPlace || "-"))}</span>
      <span>Objekt: ${escapeNativeHtml(clean(model.inspectionObject || "-"))}</span>
      <span>Datum: ${escapeNativeHtml(formatDocumentDate(model.inspectionDate) || "-")}</span>
    </div>
    ${renderExExcelMeasurementGrid(table, rows, serviceCode)}
    ${showTableDetails ? renderExExcelTableDetails(table) : ""}
  `;
}

function renderExExcelMeasurementPages(model = {}, rows = [], serviceCode = "") {
  const tables = normalizePdfMeasurementTables(model, rows).filter((table) => table.includeInReport !== false);
  return tables.flatMap((table) => {
    const sheet = normalizePdfMeasurementSheet(table.sheet);
    const columns = sheet.columns.length ? sheet.columns : [];
    const orientation = getExExcelTableOrientation(serviceCode, table);
    const tableRows = getExExcelMeasurementRows(table);
    const rowsPerPage = Math.max(1, getExExcelRowsPerPage(serviceCode, orientation, columns));
    const chunks = [];
    for (let index = 0; index < tableRows.length; index += rowsPerPage) {
      chunks.push(tableRows.slice(index, index + rowsPerPage));
    }
    if (!chunks.length) {
      chunks.push([]);
    }
    return chunks.map((chunk, tablePageIndex) => ({
      orientation,
      className: "measurement",
      bodyHtml: renderExExcelMeasurementPageContent(model, serviceCode, table, chunk, tablePageIndex, chunks.length),
    }));
  });
}

function renderExExcelAssessments(model = {}) {
  const assessments = normalizePdfMeasurementAssessments(model);
  const entries = assessments.length > 0
    ? assessments
    : [{ label: getAssessmentLabel(model), value: clean(model.resultStatus || "ZADOVOLJAVA") }];
  return `
    <table class="ex-assessments">
      <tbody>
        ${entries.map((entry) => `
          <tr>
            <th>${escapeNativeHtml(entry.label)}</th>
            <td class="${getNativeHtmlStatusClass(entry.value)}">${escapeNativeHtml(entry.value || "-")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderExExcelSignature(model = {}) {
  const fieldName = clean(model.signatureMode).toLowerCase() === "digital" ? signatureFieldName(model) : "";
  return `
    <div class="ex-signature-row">
      <div class="ex-stamp">M.P.</div>
      <div class="ex-signature-box">
        <p>Dokaze iz Zapisnika ocijenio:</p>
        <strong>${escapeNativeHtml(clean(model.responsiblePerson) || "Ispitivač")}</strong>
        ${clean(model.signatureClass) ? `<span>KLASA: ${escapeNativeHtml(model.signatureClass)}</span>` : ""}
        ${clean(model.signatureNumber) ? `<span>${escapeNativeHtml(model.signatureNumber)}</span>` : ""}
        ${fieldName ? `<small>${escapeNativeHtml(fieldName)}</small>` : ""}
      </div>
    </div>
  `;
}

function renderExExcelFinalPageContent(model = {}, serviceCode = "", {
  includeDefects = true,
  startNumber = 8,
} = {}) {
  const status = clean(model.resultStatus || "ZADOVOLJAVA");
  const issuedText = [clean(model.issuePlace || "Zagreb"), formatDocumentDate(model.issueDate)].filter(Boolean).join(", ");
  let number = startNumber;
  const nextNumber = () => `${number++}.`;
  return `
    <div class="ex-page-heading">
      <strong>ISPITNI IZVJEŠTAJ</strong>
      <span>${escapeNativeHtml(getExExcelTitle(serviceCode, model))}</span>
    </div>
    ${includeDefects ? renderExExcelSection(nextNumber(), "NEDOSTATCI", renderExExcelRichBox(model.defects, "Nisu utvrđeni nedostatci.")) : ""}
    ${renderExExcelSection(nextNumber(), "PREPORUKE", renderExExcelRichBox(model.recommendations, "Redovito održavati i provjeravati predmetni sustav."))}
    ${renderExExcelSection(nextNumber(), "OCJENA REZULTATA ISPITIVANJA", `
      <p>Na temelju usporedbe rezultata mjerenja i ispitivanja s propisanim odnosno dopuštenim parametrima utvrđeno je slijedeće:</p>
      ${renderExExcelAssessments(model)}
    `)}
    ${renderExExcelSection(nextNumber(), "ZAKLJUČAK", `
      <p>${escapeNativeHtml(getConclusionLead(model))}</p>
      <div class="ex-status ${getNativeHtmlStatusClass(status)}">${escapeNativeHtml(status)}</div>
      <p>zahtjeve spomenutih propisa u pogledu navedenih ispitivanja, te se za navedeno izdaje ZAPISNIK broj:</p>
      <div class="ex-record-number">${escapeNativeHtml(clean(model.recordNumber || "-"))}</div>
      <p class="ex-validity">${escapeNativeHtml(getValiditySentence(model))} ${escapeNativeHtml(formatDocumentDate(model.validUntil))}</p>
      <p class="ex-issued">U ${escapeNativeHtml(issuedText || "Zagrebu")}</p>
      ${renderExExcelSignature(model)}
    `)}
  `;
}

function renderExExcelPage(page = {}, model = {}, serviceCode = "", pageNumber = 1, totalPages = 1) {
  const orientation = page.orientation === "landscape" ? "landscape" : "portrait";
  return `
    <section class="ex-page ${orientation} ${escapeNativeHtml(clean(page.className || ""))}">
      ${renderExExcelHeader(model, serviceCode)}
      <main class="ex-page-body">${page.bodyHtml}</main>
      ${renderExExcelFooter(model, serviceCode, pageNumber, totalPages)}
    </section>
  `;
}

function buildExExcelDocumentationHtml({ model = {}, rows = [] } = {}) {
  const serviceCode = clean(getServiceCode(model)).toUpperCase();
  const pages = [{
    orientation: "portrait",
    className: "cover",
    bodyHtml: renderExExcelCoverPageOne(model, serviceCode),
  }];
  if (serviceCode !== "EXOV") {
    pages.push({
      orientation: "portrait",
      className: "cover secondary",
      bodyHtml: renderExExcelCoverPageTwo(model, serviceCode),
    });
    pages.push(...renderExExcelMeasurementPages(model, rows, serviceCode));
    pages.push({
      orientation: "portrait",
      className: "final",
      bodyHtml: renderExExcelFinalPageContent(model, serviceCode, {
        includeDefects: true,
        startNumber: serviceCode === "EXSE" ? 7 : 8,
      }),
    });
  } else {
    pages.push({
      orientation: "portrait",
      className: "final",
      bodyHtml: renderExExcelFinalPageContent(model, serviceCode, {
        includeDefects: false,
        startNumber: 6,
      }),
    });
  }
  const totalPages = pages.length;
  return `<!doctype html>
<html lang="hr">
<head>
  <meta charset="utf-8">
  <title>${escapeNativeHtml(clean(model.recordNumber || getExExcelTitle(serviceCode, model) || "Zapisnik"))}</title>
  <style>
    @page ex-excel-portrait { size: A4 portrait; margin: 0; }
    @page ex-excel-landscape { size: A4 landscape; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; color: #111; font-family: Arial, "DejaVu Sans", sans-serif; font-size: 7.4px; line-height: 1.22; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { box-sizing: border-box; }
    p { margin: 0 0 3.2mm; }
    table { width: 100%; border-collapse: collapse; }
    .ex-page { position: relative; background: #fff; page-break-after: always; break-after: page; }
    .ex-page:last-child { page-break-after: auto; break-after: auto; }
    .ex-page.portrait { page: ex-excel-portrait; width: 210mm; min-height: 297mm; padding: 8mm 10mm 11mm; }
    .ex-page.landscape { page: ex-excel-landscape; width: 297mm; min-height: 210mm; padding: 6mm 8mm 9mm; }
    .ex-page.cover::before { content: ""; position: absolute; left: 7mm; top: 34mm; bottom: 14mm; width: 1.4mm; background: #0f70b7; }
    .ex-header { display: grid; grid-template-columns: 1.2fr 1.45fr .55fr; gap: 6mm; align-items: start; border-top: 1.3mm solid #0f70b7; border-bottom: .55mm solid #0f70b7; padding: 2.3mm 0 2mm; margin-bottom: 6mm; color: #0f172a; }
    .ex-brand { display: flex; gap: 2.5mm; align-items: center; min-width: 0; }
    .ex-brand img { width: 22mm; max-height: 13mm; object-fit: contain; }
    .ex-brand-mark { width: 15mm; height: 10mm; border: .45mm solid #0f70b7; display: flex; align-items: center; justify-content: center; color: #0f70b7; font-weight: 700; font-size: 8px; }
    .ex-brand strong, .ex-header-center strong, .ex-header-meta strong { display: block; color: #0f70b7; font-size: 8.2px; line-height: 1.1; }
    .ex-brand span, .ex-header-center span, .ex-header-meta span { display: block; color: #4b5563; font-size: 5.7px; line-height: 1.18; }
    .ex-header-center { text-align: center; padding-top: .8mm; }
    .ex-header-meta { text-align: right; }
    .ex-cover-title { text-align: center; margin: 12mm 0 9mm; }
    .ex-cover-title h1 { margin: 0 0 3mm; font-size: 18px; letter-spacing: 0; line-height: 1.1; }
    .ex-cover-title h2 { margin: 0 auto 2mm; max-width: 155mm; font-size: 11px; line-height: 1.28; text-transform: uppercase; }
    .ex-cover-title p { margin: 0; font-size: 7px; color: #374151; text-transform: uppercase; }
    .ex-page-heading { display: flex; justify-content: space-between; align-items: end; gap: 8mm; margin: 0 0 5mm; padding-bottom: 1.6mm; border-bottom: .3mm solid #9ca3af; }
    .ex-page-heading strong { color: #111827; font-size: 9px; }
    .ex-page-heading span { color: #374151; font-size: 7px; text-align: right; text-transform: uppercase; }
    .ex-section { margin: 0 0 4.2mm; page-break-inside: avoid; break-inside: avoid; }
    .ex-section-title { background: #bfbfbf; border: .25mm solid #8f8f8f; color: #111; font-weight: 700; text-transform: uppercase; padding: 1.2mm 2mm; margin: 0 0 1.6mm; font-size: 7px; }
    .ex-kv th, .ex-kv td, .ex-assessments th, .ex-assessments td { border: .25mm solid #6b7280; padding: 1.35mm 1.6mm; vertical-align: top; font-size: 6.8px; }
    .ex-kv th, .ex-assessments th { width: 34%; background: #e5e7eb; text-align: left; font-weight: 700; }
    .ex-text-box { border: .25mm solid #6b7280; min-height: 10mm; padding: 1.7mm 2mm; font-size: 6.8px; }
    .ex-text-box p { margin: 0 0 1.6mm; }
    .ex-text-box p:last-child { margin-bottom: 0; }
    .ex-text-box ul, .ex-text-box ol { margin: 0 0 1.6mm 4mm; padding: 0; }
    .ex-text-box table th, .ex-text-box table td { border: .25mm solid #6b7280; padding: 1mm; }
    .ex-muted, .muted { color: #6b7280; }
    .ex-report-heading { display: flex; justify-content: space-between; align-items: start; gap: 8mm; margin: 0 0 2.6mm; }
    .ex-report-heading strong { display: block; font-size: 8px; color: #111827; }
    .ex-report-heading span { display: block; font-size: 6px; color: #4b5563; }
    .ex-measurement-title { margin: 0 0 2mm; padding: 1.2mm 1.6mm; background: #bfbfbf; border: .25mm solid #777; text-align: center; font-size: 7.2px; line-height: 1.15; text-transform: uppercase; }
    .ex-measurement-meta { display: flex; justify-content: space-between; gap: 3mm; margin: 0 0 2mm; font-size: 5.8px; color: #374151; }
    .ex-grid { table-layout: fixed; font-size: 5.6px; line-height: 1.05; }
    .ex-grid.dense { font-size: 4.9px; }
    .ex-grid.superdense { font-size: 4.35px; }
    .ex-grid th, .ex-grid td { border: .22mm solid #111; padding: .75mm .65mm; vertical-align: middle; text-align: center; word-break: break-word; overflow-wrap: anywhere; min-height: 4mm; }
    .ex-grid th { background: #d9d9d9; font-weight: 700; }
    .landscape .ex-grid { font-size: 5.25px; }
    .landscape .ex-grid.dense { font-size: 4.8px; }
    .landscape .ex-grid.superdense { font-size: 4.3px; }
    .ex-legend-block { margin-top: 2mm; border: .22mm solid #111; padding: 1.2mm 1.5mm; font-size: 5.25px; line-height: 1.18; page-break-inside: avoid; break-inside: avoid; }
    .ex-legend-block > strong { display: block; margin-bottom: .8mm; font-size: 5.7px; }
    .ex-legend-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 4mm; row-gap: .55mm; }
    .ex-legend-grid span { display: block; }
    .ex-note { margin: 1mm 0 0; min-height: 3mm; }
    .ex-sheet-conclusion { margin: 1mm 0 0; border-top: .22mm solid #777; padding-top: .9mm; }
    .portrait .ex-legend-block { font-size: 4.8px; }
    .portrait .ex-legend-grid { grid-template-columns: 1fr; }
    .status-pass { color: #166534; font-weight: 700; }
    .status-fail { color: #991b1b; font-weight: 700; }
    .ex-assessments td { text-align: right; font-weight: 700; }
    .ex-status { margin: 3mm 0; text-align: center; font-size: 13px; font-weight: 700; color: #166534; }
    .ex-status.status-fail { color: #991b1b; }
    .ex-record-number { margin: 2mm 0; text-align: center; font-size: 9px; font-weight: 700; }
    .ex-validity { text-align: center; }
    .ex-issued { text-align: right; font-weight: 700; margin-top: 3mm; }
    .ex-signature-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 14mm; margin-top: 9mm; }
    .ex-stamp { flex: 1 1 auto; text-align: center; font-weight: 700; }
    .ex-signature-box { flex: 0 0 64mm; min-height: 24mm; text-align: center; border-top: .25mm solid #111; padding-top: 1.8mm; }
    .ex-signature-box p { margin: 0 0 1.4mm; }
    .ex-signature-box strong, .ex-signature-box span, .ex-signature-box small { display: block; }
    .ex-signature-box small { margin-top: 2mm; color: #6b7280; font-size: 4.4px; }
    .ex-footer { position: absolute; left: 10mm; right: 10mm; bottom: 4mm; display: flex; justify-content: space-between; gap: 4mm; border-top: .25mm solid #cfd4dc; padding-top: 1mm; color: #4b5563; font-size: 5.4px; }
    .landscape .ex-footer { left: 8mm; right: 8mm; }
  </style>
</head>
<body>
  ${pages.map((page, index) => renderExExcelPage(page, model, serviceCode, index + 1, totalPages)).join("\n")}
</body>
</html>`;
}

export function buildDocumentationNativeHtml({
  model = {},
  rows = [],
} = {}) {
  if (isExExcelDocumentation(model)) {
    return buildExExcelDocumentationHtml({ model, rows });
  }
  const serviceCode = clean(getServiceCode(model)).toUpperCase() || "ZAPISNIK";
  const title = clean(model.reportTitle || getReportServiceTitle(model));
  const hasTechnicalData = splitTextLines(model.technicalData).length > 0;
  const metaRows = [
    ["Narucitelj", `${clean(model.companyName)}; ${clean(model.companyAddress)}; OIB: ${clean(model.companyOib)}`],
    ["Korisnik prostora", model.spaceUser],
    ["Mjesto ispitivanja", model.inspectionPlace],
    ["Objekt ispitivanja", model.inspectionObject],
    ["Vrsta ispitivanja", model.inspectionType],
    ["Datum ispitivanja", formatDocumentDate(model.inspectionDate)],
    ["Broj zapisnika", model.recordNumber],
  ];
  const technicalRows = getPdfTechnicalDataEntries(model.technicalData);
  const issuedText = [clean(model.issuePlace || "Zagreb"), formatDocumentDate(model.issueDate)].filter(Boolean).join(", ");
  const conclusionStatus = clean(model.resultStatus || "ZADOVOLJAVA");
  const certificateCapable = isCertificateCapableReport(model);
  const certificateIssued = shouldIssueCertificate(model);
  if (certificateCapable) {
    metaRows.push(["Broj uvjerenja", certificateIssued ? getCertificateNumber(model) : "Ne izdaje se"]);
  }

  return `<!doctype html>
<html lang="hr">
<head>
  <meta charset="utf-8">
  <title>${escapeNativeHtml(clean(model.recordNumber || title || "Zapisnik"))}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    @page sn-ex-landscape { size: A4 landscape; margin: 9mm; }
    html, body { margin: 0; padding: 0; background: #fff; color: #111827; font-family: "DejaVu Sans", Arial, sans-serif; font-size: 10px; line-height: 1.38; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { box-sizing: border-box; }
    .sn-ex-document { width: 100%; }
    .sn-ex-section { break-inside: avoid; page-break-inside: avoid; margin: 0 0 12px; }
    .sn-ex-cover { min-height: 250mm; position: relative; page-break-after: always; }
    .sn-ex-cover::before { content: ""; position: absolute; left: -5mm; top: 18mm; bottom: 14mm; width: 3px; background: #0f72ba; }
    .certificate-cover { page-break-after: always; }
    .certificate-number-box { margin-top: 18mm; text-align: center; }
    .certificate-number-box h2 { margin: 4px 0 14px; font-size: 18px; }
    .doc-header { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; border-bottom: 2px solid #0f72ba; padding-bottom: 10px; margin-bottom: 24px; }
    .doc-header.is-uploaded { display: block; position: relative; min-height: 58px; }
    .doc-header.is-uploaded img { display: block; width: 100%; max-height: 78px; object-fit: contain; object-position: center top; }
    .doc-header-number { position: absolute; right: 0; top: 0; padding: 2px 4px; background: rgba(255,255,255,.86); color: #475569; font-size: 10px; text-align: right; }
    .doc-header-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .doc-header-mark { flex: 0 0 auto; width: 38px; height: 28px; border: 1.5px solid #0f72ba; display: flex; align-items: center; justify-content: center; color: #0f72ba; font-weight: 700; }
    .doc-header-copy { min-width: 0; }
    .doc-header .brand { font-weight: 700; color: #0f172a; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; }
    .doc-header .code { color: #475569; font-size: 10px; text-align: right; }
    .cover-title { text-align: center; margin: 34px 0 24px; }
    .cover-title .eyebrow { color: #0f72ba; font-weight: 700; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 8px 0 10px; font-size: 25px; line-height: 1.15; text-align: center; text-transform: uppercase; }
    h2 { margin: 0 0 8px; color: #111827; font-size: 13px; line-height: 1.2; text-transform: uppercase; }
    h3 { margin: 10px 0 6px; font-size: 11px; color: #0f172a; }
    .subtitle { max-width: 170mm; margin: 0 auto; font-weight: 700; font-size: 12px; text-align: center; text-transform: uppercase; color: #334155; }
    .section-label { display: inline-flex; align-items: center; gap: 8px; margin: 0 0 8px; padding: 5px 9px; background: #e5e7eb; color: #111827; font-weight: 700; text-transform: uppercase; }
    .section-lead { color: #475569; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    .meta-table th, .meta-table td, .technical-table th, .technical-table td, .sn-ex-assessments th, .sn-ex-assessments td, .sn-ex-checklist th, .sn-ex-checklist td { border: 1px solid #cbd5e1; padding: 6px 7px; vertical-align: top; }
    .meta-table th, .technical-table th, .sn-ex-assessments th, .sn-ex-checklist th { width: 31%; background: #f1f5f9; text-align: left; font-weight: 700; }
    .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .text-box { border: 1px solid #cbd5e1; padding: 9px 10px; min-height: 28px; }
    .text-box h1 { margin: 0 0 7px; font-size: 13px; text-align: left; text-transform: none; color: #0f172a; }
    .text-box h2 { margin: 0 0 7px; font-size: 11px; text-transform: none; color: #0f172a; }
    .text-box h3 { margin: 0 0 6px; font-size: 10px; color: #0f172a; }
    .text-box p { margin: 0 0 7px; }
    .text-box p:last-child { margin-bottom: 0; }
    .text-box blockquote { margin: 6px 0; padding: 6px 8px; border-left: 3px solid #0f72ba; background: #f8fafc; color: #334155; }
    .text-box ul, .text-box ol { margin: 0 0 7px 18px; padding: 0; }
    .text-box table { margin: 6px 0; }
    .text-box th, .text-box td { border: 1px solid #cbd5e1; padding: 4px 5px; }
    .muted { color: #64748b; }
    .sn-ex-table-section { page-break-before: always; break-before: page; break-inside: auto; page-break-inside: auto; }
    .sn-ex-table-section.landscape { page: sn-ex-landscape; }
    .table-heading { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 7px; }
    .table-heading span { color: #475569; font-weight: 700; }
    .sn-ex-grid { table-layout: fixed; font-size: 7.5px; }
    .sn-ex-grid.dense { font-size: 6.2px; }
    .sn-ex-grid thead { display: table-header-group; }
    .sn-ex-grid th, .sn-ex-grid td { border: 1px solid #334155; padding: 3px 4px; vertical-align: middle; word-break: break-word; overflow-wrap: anywhere; }
    .sn-ex-grid th { background: #d9dde3; font-weight: 700; text-align: center; }
    .sn-ex-grid .grid-subheader th, .sn-ex-grid .grid-subheader td { background: #eef2f7; font-weight: 700; }
    .status { text-align: center; font-weight: 700; }
    .status-pass { color: #166534; }
    .status-fail { color: #991b1b; }
    .conclusion-page { page-break-before: always; break-before: page; min-height: 250mm; position: relative; }
    .conclusion-status { margin: 16px 0 14px; text-align: center; font-size: 18px; font-weight: 700; color: ${getNativeHtmlStatusClass(conclusionStatus).includes("fail") ? "#991b1b" : "#166534"}; }
    .signature-row { display: flex; justify-content: space-between; gap: 18px; align-items: flex-end; margin-top: 34px; }
    .stamp-box { flex: 0 0 150px; min-height: 80px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .signature-box { flex: 0 0 245px; text-align: center; border-top: 1px solid #111827; padding-top: 8px; }
    .signature-box p { margin: 0 0 5px; }
    .signature-box strong, .signature-box span, .signature-box small { display: block; }
    .signature-box small { margin-top: 8px; color: #64748b; font-size: 6px; }
    .issued { margin-top: 18px; text-align: right; font-weight: 700; }
    .footer-note { position: fixed; left: 12mm; right: 12mm; bottom: 5mm; display: flex; justify-content: space-between; color: #64748b; font-size: 7px; border-top: 1px solid #e2e8f0; padding-top: 3px; }
  </style>
</head>
<body>
  <article class="sn-ex-document">
    <div class="footer-note"><span>${escapeNativeHtml(serviceCode)}</span><span>${escapeNativeHtml(clean(model.recordNumber || ""))}</span></div>
    ${certificateIssued ? renderNativeHtmlCertificatePage(model, serviceCode, issuedText) : ""}
    <section class="sn-ex-cover">
      ${renderNativeHtmlDocumentHeader(model, serviceCode, {
        subtitle: clean(model.templateCode || `${serviceCode} zapisnik`),
      })}
      <div class="cover-title">
        <div class="eyebrow">Zapisnik</div>
        <h1>${escapeNativeHtml(title)}</h1>
        <div class="subtitle">${escapeNativeHtml(getReportCoverSubtitle(model))}</div>
      </div>
      <section class="sn-ex-section">
        <div class="section-label">1. Opci podaci</div>
        <table class="meta-table"><tbody>${renderNativeHtmlKeyValueRows(metaRows)}</tbody></table>
      </section>
      ${hasTechnicalData ? `
        <section class="sn-ex-section">
          <div class="section-label">2. ${escapeNativeHtml(getPdfTechnicalSectionTitle(model))}</div>
          ${technicalRows.some(([, value]) => value)
            ? `<table class="technical-table"><tbody>${renderNativeHtmlKeyValueRows(technicalRows)}</tbody></table>`
            : `<div class="text-box">${formatNativeRichTextHtml(model.technicalData)}</div>`}
        </section>
      ` : ""}
      <div class="two-column">
        <section class="sn-ex-section">
          <div class="section-label">${hasTechnicalData ? "3" : "2"}. Mjerna i ispitna oprema</div>
          <div class="text-box">${formatNativeRichTextHtml(model.equipment)}</div>
        </section>
        <section class="sn-ex-section">
          <div class="section-label">${hasTechnicalData ? "4" : "3"}. Primijenjeni propisi</div>
          <div class="text-box">${formatNativeRichTextHtml(model.regulations)}</div>
        </section>
      </div>
    </section>

    <section class="sn-ex-section">
      <div class="section-label">${hasTechnicalData ? "5" : "4"}. Koristena dokumentacija</div>
      <div class="text-box">${formatNativeRichTextHtml(model.projectDocumentation)}</div>
    </section>
    ${cleanMultiline(model.systemDescription) ? `
      <section class="sn-ex-section">
        <div class="section-label">${hasTechnicalData ? "6" : "5"}. Opis sustava</div>
        <div class="text-box">${formatNativeRichTextHtml(model.systemDescription)}</div>
      </section>
    ` : ""}
    <section class="sn-ex-section">
      <div class="section-label">${hasTechnicalData ? "7" : "6"}. Rezultati ispitivanja</div>
      <div class="text-box">${formatNativeRichTextHtml(model.resultsText)}</div>
    </section>

    ${renderNativeHtmlChecklists(model)}
    ${renderNativeHtmlMeasurementTables(model, rows)}

    ${renderNativeHtmlConclusionPage(model, serviceCode, { issuedText, conclusionStatus })}
  </article>
</body>
</html>`;
}

function getPdfMeasurementTableRows(table = {}) {
  const sheet = normalizePdfMeasurementSheet(table.sheet);
  return sheet.rows
    .map((row, rowIndex) => ({
      ...row,
      rowIndex,
      cells: Object.fromEntries(sheet.columns.map((column, columnIndex) => {
        const value = clean(getPdfMeasurementCellRawValue(sheet, rowIndex, columnIndex, new Set(), table.formulaContext, table.formulaContext?.current));
        return [column.id, columnIndex === 0 && !value ? String(rowIndex + 1) : value];
      })),
      formats: row.formats || {},
    }))
    .filter((row) => Object.values(row.cells).some(Boolean));
}

function getPdfMeasurementMerge(sheet, rowIndex, columnIndex) {
  return (sheet.merges || []).find((merge) => (
    rowIndex >= merge.row
    && rowIndex < merge.row + merge.rowSpan
    && columnIndex >= merge.column
    && columnIndex < merge.column + merge.columnSpan
  )) || null;
}

function isPdfMeasurementCoveredByMerge(sheet, rowIndex, columnIndex) {
  const merge = getPdfMeasurementMerge(sheet, rowIndex, columnIndex);
  return Boolean(merge && (merge.row !== rowIndex || merge.column !== columnIndex));
}

function getPdfMeasurementColumnWidths(columns = [], metrics = getPdfPageMetrics()) {
  const availableWidth = metrics.contentWidth || (PAGE_WIDTH - (MARGIN_X * 2));
  const declaredWidth = columns.reduce((sum, column) => sum + (Number(column.width) || 120), 0) || availableWidth;
  return columns.map((column) => ((Number(column.width) || 120) / declaredWidth) * availableWidth);
}

function getPdfMeasurementBaseRowHeight(dense = false) {
  return dense ? 23 : 26;
}

function estimatePdfMeasurementDataRowHeight(sheet, row, columns, widths, fonts, dense) {
  const fontSize = dense ? 5.8 : 7.2;
  const lineHeight = fontSize + 2;
  const minHeight = getPdfMeasurementBaseRowHeight(dense);
  const rowIndex = row.rowIndex;
  let maxLines = 1;
  columns.forEach((column, columnIndex) => {
    if (isPdfMeasurementCoveredByMerge(sheet, rowIndex, columnIndex)) {
      return;
    }
    const merge = getPdfMeasurementMerge(sheet, rowIndex, columnIndex);
    const columnSpan = merge && merge.row === rowIndex && merge.column === columnIndex
      ? Math.max(1, Math.min(merge.columnSpan, columns.length - columnIndex))
      : 1;
    const width = widths.slice(columnIndex, columnIndex + columnSpan).reduce((sum, value) => sum + value, 0) || widths[columnIndex] || 32;
    const text = row.cells?.[column.id] || "";
    maxLines = Math.max(maxLines, wrapText(text, sheet.headerRows.includes(rowIndex) ? fonts.bold : fonts.regular, fontSize, Math.max(4, width - 6)).length || 1);
  });
  return Math.max(minHeight, Math.ceil((maxLines * lineHeight) + 10));
}

function drawMeasurementColumnHeader(page, columns, widths, y, fonts, dense, metrics = getPdfPageMetrics()) {
  let cellX = metrics.marginX || MARGIN_X;
  const headerHeight = dense ? 45 : 54;
  const headerFontSize = dense ? 5.7 : 7.2;
  columns.forEach((column, columnIndex) => {
    drawCell(page, {
      x: cellX,
      y,
      width: widths[columnIndex],
      height: headerHeight,
      text: [column.label, column.placeholder].filter(Boolean).join("\n"),
      fonts,
      fontSize: headerFontSize,
      bold: true,
      fill: TABLE_GRAY,
    });
    cellX += widths[columnIndex];
  });
  return y - headerHeight;
}

function drawMeasurementDataRow(page, sheet, row, columns, widths, y, fonts, dense, metrics = getPdfPageMetrics(), rowHeightOverride = null) {
  const rowHeight = rowHeightOverride || getPdfMeasurementBaseRowHeight(dense);
  const fontSize = dense ? 5.8 : 7.2;
  columns.forEach((column, columnIndex) => {
    const merge = getPdfMeasurementMerge(sheet, row.rowIndex, columnIndex);
    const format = normalizePdfCellFormat(row.formats?.[column.id] || {});
    const columnSpan = merge && merge.row === row.rowIndex && merge.column === columnIndex
      ? Math.max(1, Math.min(merge.columnSpan, columns.length - columnIndex))
      : 1;
    const width = widths.slice(columnIndex, columnIndex + columnSpan).reduce((sum, value) => sum + value, 0);
    const cellX = (metrics.marginX || MARGIN_X) + widths.slice(0, columnIndex).reduce((sum, value) => sum + value, 0);
    const align = format.textAlign
      || (columnIndex === 1 || column.id === "item" || column.id.includes("place") || column.id.includes("circuit") ? "left" : "center");
    if (isPdfMeasurementCoveredByMerge(sheet, row.rowIndex, columnIndex)) {
      return;
    }
    drawCell(page, {
      x: cellX,
      y,
      width,
      height: rowHeight,
      text: row.cells?.[column.id] || "",
      fonts,
      fontSize,
      align,
      fill: colorFromHex(format.backgroundColor),
      bold: sheet.headerRows.includes(row.rowIndex),
    });
  });
  return y - rowHeight;
}

function drawMeasurementTable(page, table, y, fonts, rowsOverride = null, options = {}) {
  const metrics = options.metrics || getPdfPageMetrics(getPdfMeasurementOrientation(table));
  const sheet = normalizePdfMeasurementSheet(table.sheet);
  const columns = sheet.columns.length ? sheet.columns : [
    { id: "number", label: "R. br.", width: 70 },
    { id: "place", label: "Mjesto ispitivanja", width: 240 },
    { id: "pass", label: "ZADOVOLJAVA", width: 120 },
  ];
  const rows = Array.isArray(rowsOverride) ? rowsOverride : getPdfMeasurementTableRows({ ...table, sheet });
  const widths = getPdfMeasurementColumnWidths(columns, metrics);
  const dense = columns.length > 8;
  let cursorY = y;
  if (options.drawColumnHeader !== false) {
    cursorY = drawMeasurementColumnHeader(page, columns, widths, cursorY, fonts, dense, metrics);
  }
  rows.forEach((row) => {
    const rowHeight = estimatePdfMeasurementDataRowHeight(sheet, row, columns, widths, fonts, dense);
    cursorY = drawMeasurementDataRow(page, sheet, row, columns, widths, cursorY, fonts, dense, metrics, rowHeight);
  });
  return cursorY;
}

function getPdfMeasurementTableDetails(table = {}) {
  const explicitLegend = Array.isArray(table.legend)
    ? table.legend.map((entry) => clean(entry)).filter(Boolean)
    : [];
  const explicitNote = clean(table.note || "");
  const explicitConclusion = clean(table.conclusion || "");
  if (explicitLegend.length || explicitNote || explicitConclusion) {
    return {
      legend: explicitLegend,
      note: explicitNote,
      conclusion: explicitConclusion,
    };
  }
  const exDetails = getExExcelTableDetails(table);
  if (!exDetails) {
    return null;
  }
  return {
    legend: Array.isArray(exDetails.legend)
      ? exDetails.legend.map((entry) => clean(entry)).filter(Boolean)
      : [],
    note: clean(exDetails.note || ""),
    conclusion: clean(exDetails.conclusion || ""),
  };
}

function splitPdfLegendColumns(lines = [], columnCount = 1) {
  const count = Math.max(1, columnCount);
  const perColumn = Math.ceil(lines.length / count);
  return Array.from({ length: count }, (_, index) => (
    lines.slice(index * perColumn, (index + 1) * perColumn)
  )).filter((column) => column.length);
}

function estimatePdfMeasurementTableDetailsHeight(details = {}, fonts, metrics = getPdfPageMetrics()) {
  if (!details || (!details.legend?.length && !details.note && !details.conclusion)) {
    return 0;
  }
  const padding = 6;
  const gap = 5;
  const titleHeight = 10;
  const lineHeight = 7.4;
  const columnCount = metrics.orientation === "landscape" && (details.legend?.length || 0) > 3 ? 2 : 1;
  const columnGap = columnCount > 1 ? 12 : 0;
  const columnWidth = (metrics.contentWidth - (padding * 2) - columnGap) / columnCount;
  const legendColumns = splitPdfLegendColumns(details.legend || [], columnCount);
  const legendHeight = Math.max(0, ...legendColumns.map((column) => (
    column.reduce((sum, line) => (
      sum + (wrapText(line, fonts.regular, 5.6, columnWidth).length * lineHeight)
    ), 0)
  )));
  const noteHeight = details.note
    ? gap + (wrapText(details.note, fonts.regular, 5.8, metrics.contentWidth - (padding * 2)).length * lineHeight)
    : 0;
  const conclusionText = details.conclusion ? `ZAKLJUCAK ${details.conclusion}` : "";
  const conclusionHeight = conclusionText
    ? gap + (wrapText(conclusionText, fonts.regular, 5.8, metrics.contentWidth - (padding * 2)).length * lineHeight)
    : 0;
  return padding + titleHeight + legendHeight + noteHeight + conclusionHeight + padding;
}

function drawPdfMeasurementTableDetails(page, details = {}, y, fonts, metrics = getPdfPageMetrics()) {
  const height = estimatePdfMeasurementTableDetailsHeight(details, fonts, metrics);
  if (!height) {
    return y;
  }
  const x = metrics.marginX;
  const width = metrics.contentWidth;
  const padding = 6;
  const titleSize = 6.2;
  const fontSize = 5.6;
  const lineHeight = 7.4;
  const gap = 5;
  const columnCount = metrics.orientation === "landscape" && (details.legend?.length || 0) > 3 ? 2 : 1;
  const columnGap = columnCount > 1 ? 12 : 0;
  const columnWidth = (width - (padding * 2) - columnGap) / columnCount;

  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: rgb(0.98, 0.98, 0.97),
    borderColor: DARK,
    borderWidth: 0.45,
  });

  let cursorY = y - padding;
  drawTextLine(page, "Znacenje oznaka:", {
    x: x + padding,
    y: cursorY,
    font: fonts.bold,
    size: titleSize,
  });
  cursorY -= 10;

  const legendColumns = splitPdfLegendColumns(details.legend || [], columnCount);
  const columnStartY = cursorY;
  legendColumns.forEach((column, columnIndex) => {
    let columnY = columnStartY;
    const columnX = x + padding + (columnIndex * (columnWidth + columnGap));
    column.forEach((line) => {
      const wrapped = wrapText(line, fonts.regular, fontSize, columnWidth);
      wrapped.forEach((wrappedLine) => {
        drawTextLine(page, wrappedLine, {
          x: columnX,
          y: columnY,
          font: fonts.regular,
          size: fontSize,
        });
        columnY -= lineHeight;
      });
    });
  });
  const legendHeight = Math.max(0, ...legendColumns.map((column) => (
    column.reduce((sum, line) => (
      sum + (wrapText(line, fonts.regular, fontSize, columnWidth).length * lineHeight)
    ), 0)
  )));
  cursorY = columnStartY - legendHeight;

  if (details.note) {
    cursorY -= gap;
    cursorY = drawTextBlock(page, details.note, {
      x: x + padding,
      y: cursorY,
      width: width - (padding * 2),
      font: fonts.regular,
      size: 5.8,
      lineHeight,
      bottomY: y - height + padding,
    });
  }

  if (details.conclusion) {
    cursorY -= gap;
    cursorY = drawTextBlock(page, `ZAKLJUCAK ${details.conclusion}`, {
      x: x + padding,
      y: cursorY,
      width: width - (padding * 2),
      font: fonts.regular,
      size: 5.8,
      lineHeight,
      bottomY: y - height + padding,
    });
  }

  return y - height - 6;
}

function drawMeasurementTablePage(pdfDoc, model, table, fonts, rows, pageIndex = 0, options = {}) {
  const metrics = getPdfPageMetrics(getPdfMeasurementOrientation(table));
  let page = pdfDoc.addPage([metrics.width, metrics.height]);
  let y = drawMeasurementSimpleHeader(page, model, fonts, metrics);
  const primaryTitle = clean(table.label || getMeasurementTableTitle(model));
  const summaryTitle = clean(table.summary || "");
  const tableTitle = [primaryTitle, summaryTitle.toLowerCase() !== primaryTitle.toLowerCase() ? summaryTitle : ""]
    .filter(Boolean)
    .join(" - ");
  drawTextLine(page, tableTitle, {
    x: metrics.marginX,
    y: y + 6,
    font: fonts.regular,
    size: 8.2,
    color: DARK,
  });
  if (pageIndex > 0) {
    drawTextLine(page, "nastavak", {
      x: metrics.width - metrics.marginX - 54,
      y: y + 6,
      width: 54,
      align: "right",
      font: fonts.regular,
      size: 7,
      color: MUTED,
    });
  }
  const tableBottomY = drawMeasurementTable(page, table, y - 6, fonts, rows, { metrics });
  if (options.drawDetails === true) {
    const details = getPdfMeasurementTableDetails(table);
    const detailsHeight = estimatePdfMeasurementTableDetailsHeight(details, fonts, metrics);
    if (detailsHeight > 0) {
      const detailsTopY = tableBottomY - 7;
      if (detailsTopY - detailsHeight < metrics.bottomY) {
        page = pdfDoc.addPage([metrics.width, metrics.height]);
        y = drawMeasurementSimpleHeader(page, model, fonts, metrics);
        drawTextLine(page, `${tableTitle} - znacenje oznaka`, {
          x: metrics.marginX,
          y: y + 6,
          font: fonts.regular,
          size: 8.2,
          color: DARK,
        });
        drawPdfMeasurementTableDetails(page, details, y - 10, fonts, metrics);
      } else {
        drawPdfMeasurementTableDetails(page, details, detailsTopY, fonts, metrics);
      }
    }
  }
  return page;
}

function drawMeasurementTablePages(pdfDoc, model, rows, fonts) {
  const tables = normalizePdfMeasurementTables(model, rows).filter((table) => table.includeInReport !== false);
  let pageCount = 0;
  tables.forEach((table) => {
    const sheet = normalizePdfMeasurementSheet(table.sheet);
    const allRows = getPdfMeasurementTableRows({ ...table, sheet });
    const columns = sheet.columns.length ? sheet.columns : [];
    const dense = columns.length > 8;
    const metrics = getPdfPageMetrics(getPdfMeasurementOrientation(table));
    const widths = getPdfMeasurementColumnWidths(columns, metrics);
    const headerHeight = dense ? 45 : 54;
    const tableBudget = Math.max(80, metrics.topY - 106 - metrics.bottomY);
    const headerRows = allRows.filter((row) => sheet.headerRows.includes(row.rowIndex));
    const bodyRows = allRows.filter((row) => !sheet.headerRows.includes(row.rowIndex));
    const repeatedHeaderHeight = headerHeight + headerRows.reduce((sum, row) => (
      sum + estimatePdfMeasurementDataRowHeight(sheet, row, columns, widths, fonts, dense)
    ), 0);
    const maxBodyHeight = Math.max(getPdfMeasurementBaseRowHeight(dense) * 2, tableBudget - repeatedHeaderHeight);
    let cursor = 0;
    let tablePageIndex = 0;
    if (!bodyRows.length) {
      drawMeasurementTablePage(pdfDoc, model, table, fonts, headerRows, tablePageIndex, { drawDetails: true });
      pageCount += 1;
      return;
    }
    while (cursor < bodyRows.length) {
      const pageBodyRows = [];
      let usedHeight = 0;
      while (cursor < bodyRows.length) {
        const row = bodyRows[cursor];
        const rowHeight = estimatePdfMeasurementDataRowHeight(sheet, row, columns, widths, fonts, dense);
        if (pageBodyRows.length && usedHeight + rowHeight > maxBodyHeight) {
          break;
        }
        pageBodyRows.push(row);
        usedHeight += rowHeight;
        cursor += 1;
      }
      if (!pageBodyRows.length) {
        pageBodyRows.push(bodyRows[cursor]);
        cursor += 1;
      }
      const pageRows = [...headerRows, ...pageBodyRows];
      drawMeasurementTablePage(pdfDoc, model, table, fonts, pageRows, tablePageIndex, {
        drawDetails: cursor >= bodyRows.length,
      });
      tablePageIndex += 1;
      pageCount += 1;
    }
  });
  return pageCount;
}

function extractOib(value = "") {
  const match = String(value || "").match(/\b\d{11}\b/);
  return match?.[0] || "";
}

function signatureFieldName(model) {
  const oib = clean(model.signatureFieldOib || model.responsiblePersonOib || "") || extractOib(model.responsiblePerson);
  const suffix = clean(model.signatureFieldSuffix || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  const serviceCode = clean(getServiceCode(model)).replace(/[^\w.-]+/g, "_") || "SPR";
  return oib ? `SIGN_${serviceCode}_${oib}${suffix ? `_${suffix}` : ""}` : "";
}

function addSignatureWidget(pdfDoc, page, rect, fieldName) {
  if (!fieldName) {
    return false;
  }
  const acroForm = pdfDoc.catalog.getOrCreateAcroForm();
  acroForm.dict.set(PDFName.of("SigFlags"), PDFNumber.of(3));
  const fieldDict = pdfDoc.context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Widget"),
    FT: PDFName.of("Sig"),
    T: PDFString.of(fieldName),
    Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
    F: PDFNumber.of(4),
    Border: [0, 0, 0],
    BS: {
      Type: PDFName.of("Border"),
      W: PDFNumber.of(0),
    },
    H: PDFName.of("N"),
    MK: {
      BC: [],
      BG: [],
    },
    P: page.ref,
  });
  const fieldRef = pdfDoc.context.register(fieldDict);
  page.node.addAnnot(fieldRef);
  acroForm.addField(fieldRef);
  return true;
}

function drawSignatureText(page, model, fonts, x, y, width, {
  includeFieldLabel = false,
  fieldName = "",
  signatureImage = null,
} = {}) {
  if (!clean(model.responsiblePerson)) {
    return;
  }
  drawTextLine(page, "Ispitivač", {
    x,
    y,
    width,
    align: "center",
    font: fonts.regular,
    size: 8.2,
  });
  drawTextBlock(page, clean(model.responsiblePerson), {
    x,
    y: y - 14,
    width,
    align: "center",
    font: fonts.bold,
    size: 7.8,
    lineHeight: 10,
    maxLines: 2,
  });
  drawTextLine(page, `KLASA: ${clean(model.signatureClass)}`, {
    x,
    y: y - 42,
    width,
    align: "center",
    font: fonts.regular,
    size: 7.4,
  });
  drawTextLine(page, clean(model.signatureNumber), {
    x,
    y: y - 54,
    width,
    align: "center",
    font: fonts.regular,
    size: 7.4,
  });
  if (model.signatureMode === "scan" && signatureImage) {
    drawCenteredImage(page, signatureImage, {
      x: x + 34,
      y: y - 94,
      width: width - 68,
      maxHeight: 30,
    });
  }
  if (includeFieldLabel && fieldName) {
    drawTextLine(page, fieldName, {
      x,
      y: y - 84,
      width,
      align: "center",
      font: fonts.regular,
      size: 5.5,
      color: MUTED,
    });
  }
}

function drawCertificatePage(pdfDoc, model, fonts, signatureImage = null) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawSimpleHeader(page, model, fonts);
  y -= 26;
  drawTextLine(page, "UVJERENJE", {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 12,
    color: BLUE,
  });
  y -= 28;
  drawTextBlock(page, clean(model.certificateTitle || getReportPreset(model).certificateTitle || "UVJERENJE O ISPRAVNOSTI I FUNKCIONALNOSTI"), {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 15,
    lineHeight: 18,
    maxLines: 3,
  });
  y -= 72;
  y = drawKeyValueTable(page, [
    ["Broj uvjerenja", getCertificateNumber(model)],
    ["Izdaje se temeljem zapisnika", clean(model.recordNumber || "-")],
    ["Narucitelj", `${clean(model.companyName)}; ${clean(model.companyAddress)}; OIB: ${clean(model.companyOib)}`],
    ["Mjesto ispitivanja", clean(model.inspectionPlace)],
    ["Objekt ispitivanja", clean(model.inspectionObject)],
    ["Datum ispitivanja", formatDocumentDate(model.inspectionDate)],
    ["Datum izdavanja", formatDocumentDate(model.issueDate)],
  ], y, fonts, { keyWidth: 160, fontSize: 8.4, lineHeight: 11.4 });
  y -= 18;
  const lead = cleanMultiline(model.certificateLead || getReportPreset(model).certificateLead || "");
  const resultText = cleanMultiline(model.certificateResultText || getReportPreset(model).certificateResultText || "");
  if (lead) {
    y = drawTextBlock(page, lead, {
      x: MARGIN_X + 2,
      y,
      width: PAGE_WIDTH - (MARGIN_X * 2) - 4,
      font: fonts.regular,
      size: 8.8,
      lineHeight: 11.5,
      maxLines: 6,
    });
    y -= 10;
  }
  if (resultText) {
    y = drawTextBlock(page, resultText, {
      x: MARGIN_X + 2,
      y,
      width: PAGE_WIDTH - (MARGIN_X * 2) - 4,
      font: fonts.bold,
      size: 9,
      lineHeight: 12,
      maxLines: 5,
    });
  }
  drawTextLine(page, `U Zagrebu, ${formatDocumentDate(model.issueDate)}`, {
    x: MARGIN_X,
    y: 202,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "right",
    font: fonts.bold,
    size: 8.6,
  });
  drawTextLine(page, "M.P.", {
    x: MARGIN_X,
    y: 134,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 9.2,
  });
  if (clean(model.responsiblePerson)) {
    drawTextLine(page, "Uvjerenje izdao:", {
      x: PAGE_WIDTH - MARGIN_X - 230,
      y: 154,
      width: 230,
      align: "center",
      font: fonts.regular,
      size: 8,
    });
    drawSignatureText(page, model, fonts, PAGE_WIDTH - MARGIN_X - 230, 140, 230, {
      includeFieldLabel: false,
      signatureImage,
    });
  }
  return page;
}

function drawPageFour(pdfDoc, model, fonts, signatureImage = null) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawSimpleHeader(page, model, fonts);
  y -= 8;
  if (isCertificateCapableReport(model) && !shouldIssueCertificate(model)) {
    y = drawSectionTitle(page, 6, "NAPOMENA", y, fonts);
    y = drawPlainList(page, getCertificateFactualNote(model) || "Upisati utvrdjeno cinjenicno stanje.", y, fonts, { maxLines: 8, fontSize: 8.5, lineHeight: 11.2 });
    drawTextLine(page, `U Zagrebu, ${formatDocumentDate(model.issueDate)}`, {
      x: MARGIN_X,
      y: y - 34,
      width: PAGE_WIDTH - (MARGIN_X * 2),
      align: "right",
      font: fonts.bold,
      size: 8.6,
    });
    drawTextLine(page, "M.P.", {
      x: MARGIN_X,
      y: 134,
      width: PAGE_WIDTH - (MARGIN_X * 2),
      align: "center",
      font: fonts.bold,
      size: 9.2,
    });
    if (clean(model.responsiblePerson)) {
      drawTextLine(page, "Dokaze iz Zapisnika ocijenio:", {
        x: PAGE_WIDTH - MARGIN_X - 230,
        y: 154,
        width: 230,
        align: "center",
        font: fonts.regular,
        size: 8,
      });
      drawSignatureText(page, model, fonts, PAGE_WIDTH - MARGIN_X - 230, 140, 230, {
        includeFieldLabel: true,
        fieldName: model.signatureMode === "digital" ? signatureFieldName(model) : "",
        signatureImage,
      });
    }
    drawFooter(page, "SPR-4/4", fonts);
    return page;
  }
  if (isFailingResult(model)) {
  y = drawSectionTitle(page, 6, "NEDOSTATCI", y, fonts);
  y = drawPlainList(page, model.defects || "Nema utvrđenih nedostataka.", y, fonts, { maxLines: 4, fontSize: 8.5, lineHeight: 11.2 });
  y -= 6;
  }
  y = drawSectionTitle(page, 7, "PREPORUKE", y, fonts);
  y = drawPlainList(page, model.recommendations || "Redovito održavati i provjeravati predmetni sustav.", y, fonts, { maxLines: 4, fontSize: 8.5, lineHeight: 11.2 });
  y -= 8;
  y = drawSectionTitle(page, 8, "OCJENA REZULTATA ISPITIVANJA", y, fonts);
  y = drawTextBlock(page, "Na temelju usporedbe rezultata mjerenja i ispitivanja s propisanim odnosno dopuštenim parametrima utvrđeno je slijedeće:", {
    x: MARGIN_X + 2,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 4,
    font: fonts.regular,
    size: 8.7,
    lineHeight: 11.4,
    maxLines: 3,
  });
  y -= 5;
  const assessmentEntries = normalizePdfMeasurementAssessments(model);
  y = drawKeyValueTable(page, assessmentEntries.length > 0
    ? assessmentEntries.map((entry) => [entry.label, entry.value, entry.value.toUpperCase().includes("NE ZADOVOLJAVA")])
    : [[getAssessmentLabel(model), clean(model.resultStatus), true]],
  y, fonts, { keyWidth: 310, fontSize: 8.5, lineHeight: 11, valueAlign: "right" });
  y -= 8;
  y = drawSectionTitle(page, 9, "ZAKLJUČAK", y, fonts);
  y = drawTextBlock(page, getConclusionLead(model), {
    x: MARGIN_X + 2,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 4,
    font: fonts.regular,
    size: 8.8,
    lineHeight: 11.5,
    maxLines: 4,
  });
  y -= 10;
  drawTextLine(page, clean(model.resultStatus), {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 14,
  });
  y -= 30;
  const issuedDocumentLabel = shouldIssueCertificate(model) ? "UVJERENJE" : "ZAPISNIK";
  const issuedDocumentNumber = shouldIssueCertificate(model) ? getCertificateNumber(model) : clean(model.recordNumber);
  y = drawTextBlock(page, `zahtjeve spomenutih propisa u pogledu navedenih ispitivanja, te se za navedeno izdaje ${issuedDocumentLabel} broj:`, {
    x: MARGIN_X + 2,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 4,
    font: fonts.regular,
    size: 8.8,
    lineHeight: 11.5,
    maxLines: 3,
  });
  drawTextLine(page, issuedDocumentNumber, {
    x: MARGIN_X,
    y: y - 6,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 9.6,
  });
  drawTextLine(page, `${getValiditySentence(model)} ${formatDocumentDate(model.validUntil)}`, {
    x: MARGIN_X,
    y: y - 28,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.regular,
    size: 8.4,
  });
  drawTextLine(page, `U Zagrebu, ${formatDocumentDate(model.issueDate)}`, {
    x: MARGIN_X,
    y: y - 52,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "right",
    font: fonts.bold,
    size: 8.6,
  });
  drawTextLine(page, "M.P.", {
    x: MARGIN_X,
    y: 134,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 9.2,
  });
  if (clean(model.responsiblePerson)) {
    const fieldName = model.signatureMode === "digital" ? signatureFieldName(model) : "";
    drawTextLine(page, "Dokaze iz Zapisnika ocijenio:", {
      x: PAGE_WIDTH - MARGIN_X - 230,
      y: 154,
      width: 230,
      align: "center",
      font: fonts.regular,
      size: 8,
    });
    drawSignatureText(page, model, fonts, PAGE_WIDTH - MARGIN_X - 230, 140, 230, {
      includeFieldLabel: true,
      fieldName,
      signatureImage,
    });
    if (fieldName) {
      addSignatureWidget(pdfDoc, page, {
        x: PAGE_WIDTH - MARGIN_X - 200,
        y: 34,
        width: 170,
        height: 38,
      }, fieldName);
    }
  }
  drawFooter(page, "SPR-4/4", fonts);
  return page;
}

function normalizeAttachments(value = []) {
  return (Array.isArray(value) ? value : [])
    .map((entry, index) => {
      const item = entry && typeof entry === "object" ? entry : {};
      const fileName = clean(item.fileName || item.name || `Prilog ${index + 1}`);
      const dataUrl = String(item.dataUrl || "").trim();
      const fileType = clean(item.fileType || item.type || "").toLowerCase();
      const isPdf = fileType === "application/pdf" || /^data:application\/pdf;base64,/i.test(dataUrl) || /\.pdf$/i.test(fileName);
      const isPng = fileType === "image/png" || /^data:image\/png;base64,/i.test(dataUrl) || /\.png$/i.test(fileName);
      const isJpg = fileType === "image/jpeg" || fileType === "image/jpg" || /^data:image\/jpe?g;base64,/i.test(dataUrl) || /\.jpe?g$/i.test(fileName);
      if (!fileName || !dataUrl) {
        return null;
      }
      return {
        fileName,
        dataUrl,
        fileType: isPdf ? "application/pdf" : isPng ? "image/png" : isJpg ? "image/jpeg" : (fileType || "application/octet-stream"),
      };
    })
    .filter(Boolean);
}

function dataUrlToBytes(dataUrl = "") {
  const text = String(dataUrl || "").trim();
  const match = text.match(/^data:[^;]+;base64,([a-z0-9+/=]+)$/i);
  if (!match) {
    return null;
  }
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function drawAttachmentPlaceholder(page, attachment, fonts, title = "PRILOG") {
  drawTextLine(page, title, {
    x: MARGIN_X,
    y: TOP_Y,
    font: fonts.bold,
    size: 13,
  });
  page.drawLine({
    start: { x: MARGIN_X, y: TOP_Y - 24 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: TOP_Y - 24 },
    thickness: 1.6,
    color: BLUE,
  });
  page.drawRectangle({
    x: MARGIN_X,
    y: 280,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    height: 190,
    borderColor: TABLE_GRAY,
    borderWidth: 0.9,
  });
  drawTextBlock(page, clean(attachment.fileName), {
    x: MARGIN_X + 24,
    y: 430,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 48,
    font: fonts.bold,
    size: 12,
    lineHeight: 16,
    align: "center",
    maxLines: 3,
  });
  drawTextLine(page, attachment.fileType === "application/pdf" ? "PDF prilog" : clean(attachment.fileType || "Datoteka"), {
    x: MARGIN_X + 24,
    y: 360,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 48,
    align: "center",
    font: fonts.regular,
    size: 9,
    color: MUTED,
  });
}

async function appendImageAttachmentPage(pdfDoc, attachment, fonts, index) {
  const bytes = dataUrlToBytes(attachment.dataUrl);
  if (!bytes) {
    throw new Error("Attachment image is not a data URL.");
  }
  const image = attachment.fileType === "image/png"
    ? await pdfDoc.embedPng(bytes)
    : await pdfDoc.embedJpg(bytes);
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawTextLine(page, `PRILOG ${index + 1}`, {
    x: MARGIN_X,
    y: TOP_Y,
    font: fonts.bold,
    size: 13,
  });
  drawTextLine(page, clean(attachment.fileName), {
    x: MARGIN_X + 112,
    y: TOP_Y,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 112,
    align: "right",
    font: fonts.regular,
    size: 8.4,
    color: MUTED,
  });
  page.drawLine({
    start: { x: MARGIN_X, y: TOP_Y - 24 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: TOP_Y - 24 },
    thickness: 1.6,
    color: BLUE,
  });
  const maxWidth = PAGE_WIDTH - (MARGIN_X * 2);
  const maxHeight = PAGE_HEIGHT - 150;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = MARGIN_X + ((maxWidth - width) / 2);
  const y = 68 + ((maxHeight - height) / 2);
  page.drawImage(image, { x, y, width, height });
}

async function appendPdfAttachmentPages(pdfDoc, attachment) {
  const bytes = dataUrlToBytes(attachment.dataUrl);
  if (!bytes) {
    throw new Error("Attachment PDF is not a data URL.");
  }
  const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const sourcePages = await pdfDoc.copyPages(sourcePdf, sourcePdf.getPageIndices());
  sourcePages.forEach((page) => {
    pdfDoc.addPage(page);
  });
}

async function appendAttachmentPlaceholderPage(pdfDoc, attachment, fonts, index) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawAttachmentPlaceholder(page, attachment, fonts, `PRILOG ${index + 1}`);
}

async function appendAttachments(pdfDoc, model, fonts) {
  const attachments = normalizeAttachments(model.attachments);
  for (let index = 0; index < attachments.length; index += 1) {
    const attachment = attachments[index];
    try {
      if (attachment.fileType === "application/pdf") {
        await appendPdfAttachmentPages(pdfDoc, attachment);
      } else if (attachment.fileType.startsWith("image/")) {
        await appendImageAttachmentPage(pdfDoc, attachment, fonts, index);
      } else {
        await appendAttachmentPlaceholderPage(pdfDoc, attachment, fonts, index);
      }
    } catch {
      await appendAttachmentPlaceholderPage(pdfDoc, attachment, fonts, index);
    }
  }
}

async function loadFontBytes() {
  if (!fontBytesPromise) {
    fontBytesPromise = Promise.all([
      fetch(FONT_REGULAR_URL).then((response) => {
        if (!response.ok) {
          throw new Error("Nije ucitan regular PDF font.");
        }
        return response.arrayBuffer();
      }),
      fetch(FONT_BOLD_URL).then((response) => {
        if (!response.ok) {
          throw new Error("Nije ucitan bold PDF font.");
        }
        return response.arrayBuffer();
      }),
    ]);
  }
  return fontBytesPromise;
}

async function createDocumentationSprFonts(pdfDoc) {
  const [regularBytes, boldBytes] = await loadFontBytes();
  return {
    regular: await pdfDoc.embedFont(regularBytes, { subset: true }),
    bold: await pdfDoc.embedFont(boldBytes, { subset: true }),
  };
}

function getDefaultSprRows(model = {}) {
  return [{
    number: "1",
    place: clean(model.inspectionPlace),
    lampCount: "",
    ei: "",
    eimin: "",
    pass: clean(model.resultStatus || "DA"),
  }];
}

function normalizeSprRows(rows = [], model = {}) {
  return Array.isArray(rows) && rows.length ? rows : getDefaultSprRows(model);
}

async function appendDocumentationSprRecord(pdfDoc, model = {}, rows = [], fonts) {
  const startPageIndex = pdfDoc.getPageCount();
  const headerImage = await embedHeaderImage(pdfDoc, model.headerImageDataUrl);
  const signatureImage = model.signatureMode === "scan"
    ? await embedPdfImage(pdfDoc, model.signatureImageUrl || model.signatureDataUrl)
    : null;
  const safeRows = Array.isArray(model.measurementTables) && model.measurementTables.length > 0
    ? []
    : normalizeSprRows(rows, model);

  if (shouldIssueCertificate(model)) {
    drawCertificatePage(pdfDoc, model, fonts, signatureImage);
  }
  await drawOpeningPages(pdfDoc, model, safeRows, fonts, headerImage);
  drawChecklistPages(pdfDoc, model, fonts);
  drawMeasurementTablePages(pdfDoc, model, safeRows, fonts);
  drawPageFour(pdfDoc, model, fonts, signatureImage);
  await appendAttachments(pdfDoc, model, fonts);
  const pageCount = pdfDoc.getPageCount() - startPageIndex;
  stampFooters(pdfDoc, model, fonts, { startPageIndex, pageCount });
  return {
    startPageIndex,
    pageCount,
    signatureFieldCount: model.signatureMode === "digital" && signatureFieldName(model) ? 1 : 0,
  };
}

function drawBatchMetric(page, label, value, x, y, width, fonts) {
  page.drawRectangle({
    x,
    y: y - 44,
    width,
    height: 44,
    color: rgb(0.94, 0.97, 1),
    borderColor: rgb(0.74, 0.82, 0.94),
    borderWidth: 0.7,
  });
  drawTextLine(page, label, {
    x: x + 10,
    y: y - 10,
    font: fonts.regular,
    size: 7.4,
    color: MUTED,
  });
  drawTextLine(page, value, {
    x: x + 10,
    y: y - 25,
    font: fonts.bold,
    size: 12.4,
    color: DARK,
  });
}

function drawBatchTable(page, columns, rows, y, fonts, {
  widths = [],
  maxRows = 20,
} = {}) {
  const x = MARGIN_X;
  let cursorY = y;
  let cellX = x;
  const safeWidths = widths.length ? widths : columns.map(() => (PAGE_WIDTH - (MARGIN_X * 2)) / columns.length);
  columns.forEach((column, index) => {
    drawCell(page, {
      x: cellX,
      y: cursorY,
      width: safeWidths[index],
      height: 24,
      text: column,
      fonts,
      fontSize: 7.3,
      bold: true,
      fill: TABLE_GRAY,
    });
    cellX += safeWidths[index];
  });
  cursorY -= 24;
  rows.slice(0, maxRows).forEach((row) => {
    const rowHeight = 30;
    cellX = x;
    row.forEach((value, index) => {
      drawCell(page, {
        x: cellX,
        y: cursorY,
        width: safeWidths[index],
        height: rowHeight,
        text: value,
        fonts,
        fontSize: index === 4 ? 6.7 : 7,
        align: index === 0 || index === 3 ? "center" : "left",
      });
      cellX += safeWidths[index];
    });
    cursorY -= rowHeight;
  });
  if (rows.length > maxRows) {
    drawTextLine(page, `Prikazano ${maxRows} od ${rows.length} stavki.`, {
      x,
      y: cursorY - 10,
      font: fonts.regular,
      size: 7.4,
      color: MUTED,
    });
  }
  return cursorY;
}

function normalizeBatchEntries(entries = []) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry, index) => {
      const item = entry && typeof entry === "object" ? entry : {};
      const model = item.model && typeof item.model === "object" ? item.model : {};
      const rows = normalizeSprRows(item.rows, model);
      const workOrderNumber = clean(item.workOrderNumber || model.workOrderNumber || `RN ${index + 1}`);
      const serviceCode = clean(item.serviceCode || model.serviceBinding?.serviceCode || model.serviceCode || getServiceCode(model));
      const serviceName = clean(item.serviceName || model.serviceBinding?.serviceName || serviceCode || "Usluga");
      const recordNumber = clean(item.recordNumber || model.recordNumber || `${workOrderNumber}-${serviceCode}`);
      const signatureSuffix = clean(recordNumber || item.id || `${workOrderNumber}-${index + 1}`);
      return {
        id: clean(item.id || `spr-batch-${index + 1}`),
        workOrderNumber,
        serviceCode,
        serviceName,
        recordNumber,
        companyName: clean(item.companyName || model.companyName),
        inspectionPlace: clean(item.inspectionPlace || model.inspectionPlace),
        objectName: clean(item.objectName || model.inspectionObject),
        quantity: clean(item.quantity || rows.length || "1"),
        rows,
        model: {
          ...model,
          workOrderNumber,
          recordNumber,
          serviceCode,
          signatureMode: clean(item.signatureMode || model.signatureMode || "digital").toLowerCase() === "scan" ? "scan" : "digital",
          signatureFieldOib: clean(item.signatureFieldOib || model.signatureFieldOib || model.responsiblePersonOib || ""),
          signatureImageUrl: clean(item.signatureImageUrl || model.signatureImageUrl || model.signatureDataUrl || ""),
          signatureFieldSuffix: signatureSuffix,
        },
      };
    })
    .filter((entry) => entry.recordNumber || entry.workOrderNumber || entry.serviceName);
}

function drawBatchSummaryPage(pdfDoc, entries, fonts) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const firstModel = entries[0]?.model || {};
  let y = drawDefaultHeader(page, { ...firstModel, workOrderNumber: "Batch" }, fonts);
  drawTextLine(page, "SAZETAK ZAPISNIKA", {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 17,
  });
  y -= 42;
  const workOrderCount = new Set(entries.map((entry) => entry.workOrderNumber).filter(Boolean)).size;
  const metricWidth = ((PAGE_WIDTH - (MARGIN_X * 2)) - 24) / 4;
  [
    ["RN-ovi", String(workOrderCount)],
    ["Zapisnici", String(entries.length)],
    ["Mjerenja", String(entries.reduce((sum, entry) => sum + entry.rows.length, 0))],
    ["Primopredaja", String(entries.length)],
  ].forEach(([label, value], index) => {
    drawBatchMetric(page, label, value, MARGIN_X + (index * (metricWidth + 8)), y, metricWidth, fonts);
  });
  y -= 66;
  drawBatchTable(page, ["#", "RN", "Usluga", "Zapisnik", "Objekt", "Status"], entries.map((entry, index) => [
    String(index + 1),
    entry.workOrderNumber,
    entry.serviceCode || entry.serviceName,
    entry.recordNumber,
    entry.objectName || entry.inspectionPlace,
    entry.rows.length ? "Spremno" : "Provjeri",
  ]), y, fonts, {
    widths: [24, 70, 74, 90, 174, 78],
    maxRows: 18,
  });
  return page;
}

function drawBatchHandoverPage(pdfDoc, entries, fonts) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const firstModel = entries[0]?.model || {};
  let y = drawDefaultHeader(page, { ...firstModel, workOrderNumber: "Primopredaja" }, fonts);
  drawTextLine(page, "PRIMOPREDAJNI ZAPISNIK", {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 17,
  });
  y -= 34;
  drawTextBlock(page, "U nastavku je popis izrađenih zapisnika i usluga koje se predaju korisniku u sklopu odabranih radnih naloga.", {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    font: fonts.regular,
    size: 8.4,
    lineHeight: 11,
    maxLines: 3,
  });
  y -= 48;
  drawBatchTable(page, ["#", "Usluga", "Dokument", "Kol.", "Objekt", "Napomena"], entries.map((entry, index) => [
    String(index + 1),
    entry.serviceName || entry.serviceCode,
    entry.recordNumber,
    entry.quantity,
    entry.objectName || entry.inspectionPlace,
    entry.workOrderNumber,
  ]), y, fonts, {
    widths: [24, 138, 88, 44, 144, 72],
    maxRows: 18,
  });
  drawTextLine(page, "Preuzeo:", {
    x: MARGIN_X,
    y: 128,
    font: fonts.regular,
    size: 8.6,
  });
  page.drawLine({
    start: { x: MARGIN_X, y: 84 },
    end: { x: MARGIN_X + 185, y: 84 },
    thickness: 0.8,
    color: DARK,
  });
  drawTextLine(page, "Predao:", {
    x: PAGE_WIDTH - MARGIN_X - 185,
    y: 128,
    font: fonts.regular,
    size: 8.6,
  });
  page.drawLine({
    start: { x: PAGE_WIDTH - MARGIN_X - 185, y: 84 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: 84 },
    thickness: 0.8,
    color: DARK,
  });
  return page;
}

function resolveBatchHandoverContext(entries = [], handover = {}) {
  const firstEntry = entries[0] || {};
  const firstModel = firstEntry.model || {};
  const workOrderNumbers = Array.from(new Set(entries.map((entry) => entry.workOrderNumber).filter(Boolean)));
  const signatureMode = clean(handover.signatureMode || firstModel.signatureMode || "digital").toLowerCase() === "scan" ? "scan" : "digital";
  const signerOib = clean(handover.signerOib || handover.signatureFieldOib || firstModel.signatureFieldOib || "");
  return {
    workOrderNumbers,
    customerName: clean(handover.customerName || firstEntry.companyName || firstModel.companyName),
    customerAddress: clean(handover.customerAddress || firstModel.companyAddress),
    customerOib: clean(handover.customerOib || firstModel.companyOib),
    executorName: clean(handover.executorName || "Adria Grupa d.o.o."),
    executorAddress: clean(handover.executorAddress || "Heinzelova 53a, 10000 Zagreb"),
    executorOib: clean(handover.executorOib || ""),
    location: clean(handover.location || firstEntry.inspectionPlace || firstModel.inspectionPlace),
    objectName: clean(handover.objectName || firstEntry.objectName || firstModel.inspectionObject),
    contractType: clean(handover.contractType || firstModel.contractType || ""),
    issuedPlace: clean(handover.issuedPlace || "Zagreb"),
    issuedDate: clean(handover.issuedDate || firstModel.issueDate),
    signerName: clean(handover.signerName || firstModel.responsiblePerson || "Ovjerio izvršitelj"),
    signerTitle: clean(handover.signerTitle || ""),
    signerOrganization: clean(handover.signerOrganization || handover.executorName || ""),
    signerOib,
    signatureMode,
    signatureFieldName: signatureMode === "digital"
      ? clean(handover.signatureFieldName || (signerOib ? `SIGN_PRIMOPREDAJA_${signerOib}` : ""))
      : "",
    signatureImageUrl: signatureMode === "scan" ? clean(handover.signatureImageUrl || firstModel.signatureImageUrl || "") : "",
  };
}

function drawBatchHandoverPageV2(pdfDoc, entries, fonts, handover = {}, signatureImage = null) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const firstModel = entries[0]?.model || {};
  const context = resolveBatchHandoverContext(entries, handover);
  let signatureFieldCount = 0;
  let y = drawDefaultHeader(page, { ...firstModel, workOrderNumber: "Primopredaja" }, fonts);
  drawTextLine(page, "PRIMOPREDAJNI ZAPISNIK", {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 17,
  });
  y -= 20;
  drawTextLine(page, "O OBAVLJENIM USLUGAMA IZ PODRUCJA ZASTITE NA RADU I ZASTITE OD POZARA", {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 8.4,
  });
  y -= 28;
  y = drawKeyValueTable(page, [
    ["Broj RN", context.workOrderNumbers.join(", ") || "-"],
    ["Naručitelj", [context.customerName, context.customerAddress, context.customerOib ? `OIB ${context.customerOib}` : ""].filter(Boolean).join(", ") || "-"],
    ["Izvršitelj", [context.executorName, context.executorAddress, context.executorOib ? `OIB ${context.executorOib}` : ""].filter(Boolean).join(", ") || "-"],
    ["Lokacija ispitivanja", [context.location, context.objectName].filter(Boolean).join(" - ") || "-"],
    ["Vrsta ugovora", context.contractType || "-"],
  ], y, fonts, {
    keyWidth: 118,
    fontSize: 8,
    lineHeight: 10.6,
    bottomY: 420,
  });
  y -= 4;
  drawTextBlock(page, "U nastavku je popis izrađenih zapisnika i usluga koje se predaju korisniku u sklopu odabranih radnih naloga.", {
    x: MARGIN_X,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    font: fonts.regular,
    size: 8.1,
    lineHeight: 10.4,
    maxLines: 2,
  });
  y -= 28;
  drawBatchTable(page, ["#", "Usluga", "Dokument", "Kol.", "Objekt", "Napomena"], entries.map((entry, index) => [
    String(index + 1),
    entry.serviceName || entry.serviceCode,
    entry.recordNumber,
    entry.quantity,
    entry.objectName || entry.inspectionPlace,
    entry.workOrderNumber,
  ]), y, fonts, {
    widths: [24, 138, 88, 44, 144, 72],
    maxRows: 14,
  });
  drawTextLine(page, "PRILOG: Popis obavljenih usluga i izrađenih zapisnika", {
    x: MARGIN_X,
    y: 166,
    font: fonts.bold,
    size: 8.2,
  });
  drawTextLine(page, context.issuedDate ? `U ${context.issuedPlace || "Zagrebu"}, ${context.issuedDate}` : "", {
    x: MARGIN_X,
    y: 148,
    font: fonts.regular,
    size: 8,
  });
  drawTextLine(page, "Preuzeo:", {
    x: MARGIN_X,
    y: 128,
    font: fonts.regular,
    size: 8.6,
  });
  page.drawLine({
    start: { x: MARGIN_X, y: 84 },
    end: { x: MARGIN_X + 185, y: 84 },
    thickness: 0.8,
    color: DARK,
  });
  drawTextLine(page, "Predao:", {
    x: PAGE_WIDTH - MARGIN_X - 185,
    y: 128,
    font: fonts.regular,
    size: 8.6,
  });
  page.drawLine({
    start: { x: PAGE_WIDTH - MARGIN_X - 185, y: 84 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: 84 },
    thickness: 0.8,
    color: DARK,
  });
  if (context.signatureMode === "scan" && signatureImage) {
    drawCenteredImage(page, signatureImage, {
      x: PAGE_WIDTH - MARGIN_X - 170,
      y: 86,
      width: 150,
      maxHeight: 30,
    });
  }
  if (context.signatureFieldName) {
    addSignatureWidget(pdfDoc, page, {
      x: PAGE_WIDTH - MARGIN_X - 174,
      y: 72,
      width: 160,
      height: 38,
    }, context.signatureFieldName);
    signatureFieldCount += 1;
    drawTextLine(page, context.signatureFieldName, {
      x: PAGE_WIDTH - MARGIN_X - 185,
      y: 70,
      width: 185,
      align: "center",
      font: fonts.regular,
      size: 5.4,
      color: MUTED,
    });
  }
  drawTextLine(page, context.signerName, {
    x: PAGE_WIDTH - MARGIN_X - 185,
    y: 62,
    width: 185,
    align: "center",
    font: fonts.bold,
    size: 7.2,
  });
  return { page, signatureFieldCount };
}

function createSprPdfDocument(title = "Zapisnik") {
  return PDFDocument.create().then((pdfDoc) => {
    pdfDoc.registerFontkit(fontkit);
    pdfDoc.setTitle(clean(title || "Zapisnik"));
    pdfDoc.setSubject("SafeNexus Izrada dokumentacije");
    pdfDoc.setCreator("SafeNexus browser PDF");
    pdfDoc.setProducer("SafeNexus browser PDF");
    return pdfDoc;
  });
}

export async function generateDocumentationSprPdfBlob({
  model = {},
  rows = [],
  fileName = "",
} = {}) {
  const pdfDoc = await createSprPdfDocument(model.recordNumber || "Zapisnik");
  const fonts = await createDocumentationSprFonts(pdfDoc);
  const record = await appendDocumentationSprRecord(pdfDoc, model, rows, fonts);

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  const blob = new Blob([bytes], { type: "application/pdf" });
  return {
    blob,
    bytes,
    fileName: safeFileName(fileName || model.recordNumber || "zapisnik.pdf"),
    pageCount: pdfDoc.getPageCount(),
    signatureFieldCount: record.signatureFieldCount,
  };
}

export async function generateDocumentationSprBatchPdfBlob({
  entries = [],
  handover = {},
  fileName = "",
} = {}) {
  const normalizedEntries = normalizeBatchEntries(entries);
  if (!normalizedEntries.length) {
    throw new Error("Nema zapisnika za batch PDF.");
  }
  const pdfDoc = await createSprPdfDocument(`SPR batch ${normalizedEntries[0].workOrderNumber || ""}`);
  const fonts = await createDocumentationSprFonts(pdfDoc);
  let signatureFieldCount = 0;

  for (const entry of normalizedEntries) {
    const record = await appendDocumentationSprRecord(pdfDoc, entry.model, entry.rows, fonts);
    signatureFieldCount += record.signatureFieldCount;
  }

  const summaryStart = pdfDoc.getPageCount();
  drawBatchSummaryPage(pdfDoc, normalizedEntries, fonts);
  stampFooters(pdfDoc, { serviceCode: "SAZETAK" }, fonts, {
    startPageIndex: summaryStart,
    pageCount: pdfDoc.getPageCount() - summaryStart,
  });

  const handoverStart = pdfDoc.getPageCount();
  const handoverContext = resolveBatchHandoverContext(normalizedEntries, handover);
  const handoverSignatureImage = handoverContext.signatureMode === "scan"
    ? await embedPdfImage(pdfDoc, handoverContext.signatureImageUrl)
    : null;
  const handoverRecord = drawBatchHandoverPageV2(pdfDoc, normalizedEntries, fonts, handoverContext, handoverSignatureImage);
  signatureFieldCount += handoverRecord.signatureFieldCount;
  stampFooters(pdfDoc, { serviceCode: "PRIMOPREDAJA" }, fonts, {
    startPageIndex: handoverStart,
    pageCount: pdfDoc.getPageCount() - handoverStart,
  });

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  const blob = new Blob([bytes], { type: "application/pdf" });
  return {
    blob,
    bytes,
    fileName: safeFileName(fileName || `spr-batch-${normalizedEntries[0].workOrderNumber || "zapisnici"}.pdf`),
    pageCount: pdfDoc.getPageCount(),
    signatureFieldCount,
    recordCount: normalizedEntries.length,
  };
}
