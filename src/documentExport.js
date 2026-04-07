import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import Docxtemplater from "docxtemplater";
import { PDFDocument as PdfLibDocument } from "pdf-lib";
import PDFDocument from "pdfkit";
import PizZip from "pizzip";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const DEJAVU_FONT_DIR = resolve(moduleDir, "..", "node_modules", "dejavu-fonts-ttf", "ttf");
const PDF_FONTS = {
  regular: resolve(DEJAVU_FONT_DIR, "DejaVuSans.ttf"),
  bold: resolve(DEJAVU_FONT_DIR, "DejaVuSans-Bold.ttf"),
  italic: resolve(DEJAVU_FONT_DIR, "DejaVuSans-Oblique.ttf"),
};
const SOFFICE_CANDIDATES = [
  process.env.SOFFICE_PATH,
  process.env.LIBREOFFICE_PATH,
  "soffice",
  "libreoffice",
  "/usr/bin/soffice",
  "/usr/bin/libreoffice",
  "/app/.apt/usr/bin/soffice",
  "/app/.apt/usr/bin/libreoffice",
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
].filter(Boolean);

function clean(value = "") {
  return String(value ?? "").trim();
}

function sanitizeFileBaseName(value = "", fallback = "zapisnik") {
  const normalized = clean(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");

  return normalized || fallback;
}

export function sanitizeGeneratedDocumentFileName(value = "", {
  fallback = "zapisnik",
  extension = "",
} = {}) {
  const safeBaseName = sanitizeFileBaseName(value, fallback);
  const safeExtension = clean(extension).replace(/^\.+/, "");
  return safeExtension ? `${safeBaseName}.${safeExtension}` : safeBaseName;
}

function parseDataUrl(dataUrl = "") {
  const raw = clean(dataUrl);
  const match = raw.match(/^data:([^;,]+)?(;base64)?,([\s\S]+)$/i);

  if (!match) {
    throw new Error("Datoteka nije u ispravnom data URL formatu.");
  }

  const mimeType = clean(match[1]) || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? "";

  return {
    mimeType,
    buffer: isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8"),
  };
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      ...options,
    });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk ?? "");
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk ?? "");
    });
    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      const error = new Error(clean(stderr || stdout) || `Command failed: ${command}`);
      error.code = code;
      rejectPromise(error);
    });
  });
}

async function resolveSofficeCommand() {
  for (const candidate of SOFFICE_CANDIDATES) {
    const safeCandidate = clean(candidate);
    if (!safeCandidate) {
      continue;
    }

    if (/^[A-Za-z]:\\/i.test(safeCandidate) || safeCandidate.startsWith("/")) {
      if (!await fileExists(safeCandidate)) {
        continue;
      }
    }

    try {
      await runCommand(safeCandidate, ["--version"]);
      return safeCandidate;
    } catch {
      continue;
    }
  }

  return "";
}

async function fetchBinaryFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ne mogu dohvatiti dokument (${response.status}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    mimeType: clean(response.headers.get("content-type")) || "application/octet-stream",
    buffer: Buffer.from(arrayBuffer),
  };
}

export async function readStoredDocumentBuffer(referenceDocument = {}) {
  const inlineSource = clean(referenceDocument.inlineDataUrl || "");
  const directSource = clean(referenceDocument.dataUrl || referenceDocument.storageUrl || referenceDocument.url || "");
  const source = inlineSource || directSource;

  if (!source) {
    throw new Error("Template nema spremljeni dokument.");
  }

  if (source.startsWith("data:")) {
    return parseDataUrl(source);
  }

  if (/^https?:\/\//i.test(source)) {
    return fetchBinaryFromUrl(source);
  }

  throw new Error("Spremljeni dokument nije dostupan za čitanje.");
}

function normalizeTemplatePlaceholderValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeTemplatePlaceholderValue(entry))
      .filter(Boolean)
      .join("\n");
  }

  if (value === true) {
    return "Da";
  }

  if (value === false) {
    return "Ne";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  }

  return String(value);
}

function formatDocxRenderError(error) {
  if (Array.isArray(error?.properties?.errors) && error.properties.errors.length > 0) {
    return error.properties.errors
      .map((entry) => clean(entry?.properties?.explanation || entry?.message || "Greška u Word placeholderu."))
      .filter(Boolean)
      .join(" ");
  }

  return clean(error?.message) || "Ne mogu generirati Word iz predloška.";
}

export async function buildDocxFromTemplateBuffer(templateBuffer, placeholders = {}) {
  const safeBuffer = Buffer.isBuffer(templateBuffer)
    ? templateBuffer
    : Buffer.from(templateBuffer ?? []);

  if (safeBuffer.length === 0) {
    throw new Error("Word predložak je prazan.");
  }

  const normalizedPlaceholders = Object.fromEntries(
    Object.entries(placeholders && typeof placeholders === "object" ? placeholders : {})
      .map(([key, value]) => [clean(key), normalizeTemplatePlaceholderValue(value)])
      .filter(([key]) => key),
  );

  try {
    const zip = new PizZip(safeBuffer);
    const doc = new Docxtemplater(zip, {
      delimiters: {
        start: "{{",
        end: "}}",
      },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter() {
        return "";
      },
    });

    doc.render(normalizedPlaceholders);
    return doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
  } catch (error) {
    throw new Error(formatDocxRenderError(error));
  }
}

export async function convertDocxBufferToPdfBuffer(docxBuffer, {
  fileName = "zapisnik.docx",
} = {}) {
  const sofficeCommand = await resolveSofficeCommand();
  if (!sofficeCommand) {
    throw new Error("LibreOffice nije dostupan na serveru za Word -> PDF konverziju.");
  }

  const tempRoot = await mkdtemp(join(tmpdir(), "taskflow-docx-"));
  const officeProfileDir = join(tempRoot, "lo-profile");
  const inputBaseName = sanitizeGeneratedDocumentFileName(fileName, {
    fallback: "zapisnik",
    extension: "docx",
  });
  const inputPath = join(tempRoot, inputBaseName);
  const outputPath = join(
    tempRoot,
    sanitizeGeneratedDocumentFileName(inputBaseName.replace(/\.docx$/i, ""), {
      fallback: "zapisnik",
      extension: "pdf",
    }),
  );

  try {
    await writeFile(inputPath, Buffer.isBuffer(docxBuffer) ? docxBuffer : Buffer.from(docxBuffer ?? []));
    await runCommand(sofficeCommand, [
      "--headless",
      "--nologo",
      "--nodefault",
      "--nofirststartwizard",
      `-env:UserInstallation=${pathToFileURL(officeProfileDir).href}`,
      "--convert-to",
      "pdf:writer_pdf_Export",
      "--outdir",
      tempRoot,
      inputPath,
    ], {
      cwd: tempRoot,
      env: {
        ...process.env,
        HOME: process.env.HOME || tempRoot,
      },
    });

    if (!await fileExists(outputPath)) {
      throw new Error("LibreOffice nije vratio PDF datoteku.");
    }

    return await readFile(outputPath);
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }
}

export async function buildPdfFromTemplateBuffer(templateBuffer, placeholders = {}, options = {}) {
  const generatedWord = await buildDocxFromTemplateBuffer(templateBuffer, placeholders);
  return convertDocxBufferToPdfBuffer(generatedWord, options);
}

function pdfBufferFromDocument(doc) {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolvePromise(Buffer.concat(chunks)));
    doc.on("error", rejectPromise);
    doc.end();
  });
}

function normalizePdfText(value = "") {
  const text = clean(value);
  return text || "—";
}

function normalizePdfLines(values = []) {
  return (Array.isArray(values) ? values : [values])
    .map((entry) => clean(entry))
    .filter(Boolean);
}

async function resolvePdfImageBuffer(source = "") {
  const safeSource = clean(source);
  if (!safeSource) {
    return null;
  }

  if (safeSource.startsWith("data:image/svg")) {
    return null;
  }

  try {
    if (safeSource.startsWith("data:")) {
      const parsed = parseDataUrl(safeSource);
      return /image\/(png|jpe?g|webp)/i.test(parsed.mimeType) ? parsed.buffer : null;
    }

    if (/^https?:\/\//i.test(safeSource)) {
      const parsed = await fetchBinaryFromUrl(safeSource);
      return /image\/(png|jpe?g|webp)/i.test(parsed.mimeType) ? parsed.buffer : null;
    }
  } catch {
    return null;
  }

  return null;
}

function createPdfLayoutHelpers(doc) {
  let currentLayout = doc.page.layout === "landscape" ? "landscape" : "portrait";
  const margins = {
    top: 40,
    bottom: 40,
    left: 42,
    right: 42,
  };

  const helpers = {
    get availableWidth() {
      return doc.page.width - doc.page.margins.left - doc.page.margins.right;
    },
    get maxY() {
      return doc.page.height - doc.page.margins.bottom;
    },
    setLayout(layout = "portrait", { forceNewPage = false } = {}) {
      const normalizedLayout = layout === "landscape" ? "landscape" : "portrait";

      if (!forceNewPage && currentLayout === normalizedLayout) {
        return;
      }

      doc.addPage({
        size: "A4",
        layout: normalizedLayout,
        margins,
      });
      currentLayout = normalizedLayout;
    },
    ensureSpace(height = 48, { layout = currentLayout } = {}) {
      if (currentLayout !== layout) {
        helpers.setLayout(layout, { forceNewPage: true });
      } else if (doc.y + height > helpers.maxY) {
        helpers.setLayout(currentLayout, { forceNewPage: true });
      }
    },
  };

  return helpers;
}

function drawRoundedOutline(doc, x, y, width, height, radius = 14, color = "#111111") {
  doc.save();
  doc.roundedRect(x, y, width, height, radius);
  doc.lineWidth(1);
  doc.strokeColor(color);
  doc.stroke();
  doc.restore();
}

function drawAccentLine(doc, x, y, height, color = "#c94cc8") {
  doc.save();
  doc.roundedRect(x, y, 4, height, 4);
  doc.fillColor(color);
  doc.fill();
  doc.restore();
}

function renderPdfFieldCard(doc, helpers, title, value, { multiline = false } = {}) {
  const cardPadding = 12;
  const cardWidth = helpers.availableWidth;
  const labelHeight = 14;
  doc.font("dejavu").fontSize(11).fillColor("#1f2333");
  const textHeight = doc.heightOfString(normalizePdfText(value), {
    width: cardWidth - cardPadding * 2,
    lineGap: multiline ? 2 : 1,
  });
  const totalHeight = Math.max(48, labelHeight + 10 + textHeight + cardPadding * 2);
  helpers.ensureSpace(totalHeight + 12);

  const startX = doc.page.margins.left;
  const startY = doc.y;
  drawRoundedOutline(doc, startX, startY, cardWidth, totalHeight, 16, "#111111");
  doc.font("dejavu-bold").fontSize(9).fillColor("#7b61ff").text(title, startX + cardPadding, startY + 10, {
    width: cardWidth - cardPadding * 2,
  });
  doc.font("dejavu").fontSize(11).fillColor("#1f2333").text(normalizePdfText(value), startX + cardPadding, startY + 28, {
    width: cardWidth - cardPadding * 2,
    lineGap: multiline ? 2 : 1,
  });
  doc.y = startY + totalHeight + 12;
}

function renderPdfBullets(doc, helpers, title, items = []) {
  const safeItems = normalizePdfLines(items);
  if (safeItems.length === 0) {
    renderPdfFieldCard(doc, helpers, title, "Nema podataka.");
    return;
  }

  helpers.ensureSpace(42 + safeItems.length * 18);
  doc.font("dejavu-bold").fontSize(12).fillColor("#1f2333").text(title, {
    width: helpers.availableWidth,
  });
  doc.moveDown(0.35);
  safeItems.forEach((item) => {
    doc.font("dejavu").fontSize(10.5).fillColor("#1f2333").text(`• ${item}`, {
      width: helpers.availableWidth - 12,
      indent: 12,
      lineGap: 2,
    });
  });
  doc.moveDown(0.5);
}

function renderPdfTextBlock(doc, helpers, title, body = "") {
  helpers.ensureSpace(58);
  doc.font("dejavu-bold").fontSize(12).fillColor("#1f2333").text(title, {
    width: helpers.availableWidth,
  });
  doc.moveDown(0.2);
  doc.font("dejavu").fontSize(10.5).fillColor("#334155").text(normalizePdfText(body), {
    width: helpers.availableWidth,
    lineGap: 2,
  });
  doc.moveDown(0.5);
}

function renderPdfTable(doc, helpers, table = {}) {
  const columns = normalizePdfLines(table.columns ?? []);
  const rows = Array.isArray(table.rows) ? table.rows : [];
  if (columns.length === 0) {
    return;
  }

  const preferredLayout = table.landscape || columns.length > 5 ? "landscape" : "portrait";
  helpers.setLayout(preferredLayout, { forceNewPage: false });
  helpers.ensureSpace(72, { layout: preferredLayout });

  if (clean(table.title)) {
    doc.font("dejavu-bold").fontSize(12).fillColor("#1f2333").text(table.title, {
      width: helpers.availableWidth,
    });
    doc.moveDown(0.3);
  }

  const fontSize = columns.length > 7 ? 7.5 : columns.length > 5 ? 8.25 : 9;
  const paddingX = 6;
  const paddingY = 5;
  const columnWidth = helpers.availableWidth / columns.length;
  const headerRows = Array.isArray(table.headerRows) && table.headerRows.length > 0
    ? table.headerRows
    : [columns];

  const drawRow = (cells, { header = false } = {}) => {
    const safeCells = Array.from({ length: columns.length }, (_, columnIndex) => normalizePdfText(cells[columnIndex] ?? ""));
    doc.font(header ? "dejavu-bold" : "dejavu").fontSize(fontSize);
    const heights = safeCells.map((cell) => doc.heightOfString(cell, {
      width: columnWidth - paddingX * 2,
      lineGap: 1,
    }));
    const rowHeight = Math.max(...heights, 14) + paddingY * 2;
    helpers.ensureSpace(rowHeight + 4, { layout: preferredLayout });
    const startY = doc.y;
    const startX = doc.page.margins.left;

    safeCells.forEach((cell, columnIndex) => {
      const x = startX + columnIndex * columnWidth;
      const y = startY;
      doc.save();
      doc.rect(x, y, columnWidth, rowHeight);
      doc.lineWidth(0.9);
      doc.strokeColor("#111111");
      if (header) {
        doc.fillOpacity(0.06);
        doc.fillAndStroke("#d946ef", "#111111");
      } else {
        doc.stroke();
      }
      doc.restore();
      doc.font(header ? "dejavu-bold" : "dejavu").fontSize(fontSize).fillColor("#1f2333").text(cell, x + paddingX, y + paddingY, {
        width: columnWidth - paddingX * 2,
        lineGap: 1,
      });
    });

    doc.y = startY + rowHeight;
  };

  headerRows.forEach((headerRow) => {
    drawRow(headerRow, { header: true });
  });

  rows.forEach((row) => {
    drawRow(row, { header: false });
  });

  doc.moveDown(0.6);
}

async function renderPdfSignatureGroup(doc, helpers, title, items = []) {
  const safeItems = Array.isArray(items) ? items : [];
  if (safeItems.length === 0) {
    renderPdfFieldCard(doc, helpers, title, "Nema odabranih osoba.");
    return;
  }

  helpers.ensureSpace(80);
  doc.font("dejavu-bold").fontSize(12).fillColor("#1f2333").text(title, {
    width: helpers.availableWidth,
  });
  doc.moveDown(0.25);

  const columnGap = 18;
  const columnWidth = Math.max(220, (helpers.availableWidth - columnGap) / 2);
  const drawSignatureCard = async (item, x, y, cardWidth) => {
    const metaLines = normalizePdfLines(item.metaLines ?? []);
    const role = clean(item.role) || "Osoba";
    const name = clean(item.name) || "Nepoznato";
    const isDigital = clean(item.signatureMode).toLowerCase() === "digital";
    const signatureBuffer = await resolvePdfImageBuffer(item.signatureImageUrl || "");
    const estimatedHeight = signatureBuffer ? 142 : (isDigital ? 132 : 110);

    drawRoundedOutline(doc, x, y, cardWidth, estimatedHeight, 18, "#111111");
    drawAccentLine(doc, x, y, estimatedHeight, "#c94cc8");
    doc.font("dejavu-bold").fontSize(9).fillColor("#7b61ff").text(role, x + 16, y + 12, {
      width: cardWidth - 32,
    });
    doc.font("dejavu-bold").fontSize(12).fillColor("#1f2333").text(name, x + 16, y + 28, {
      width: cardWidth - 32,
    });
    if (metaLines.length > 0) {
      doc.font("dejavu").fontSize(9).fillColor("#475569").text(metaLines.join("\n"), x + 16, y + 48, {
        width: cardWidth - 32,
        lineGap: 1,
      });
    }

    if (signatureBuffer) {
      try {
        doc.image(signatureBuffer, x + 16, y + estimatedHeight - 56, {
          fit: [160, 38],
          align: "left",
        });
      } catch {
        doc.font("dejavu").fontSize(9).fillColor("#94a3b8").text("Potpis nije moguće prikazati u PDF-u.", x + 16, y + estimatedHeight - 40, {
          width: cardWidth - 32,
        });
      }
    } else if (isDigital) {
      doc.save();
      doc.roundedRect(x + 16, y + estimatedHeight - 56, Math.max(220, cardWidth - 32), 34, 10);
      doc.lineWidth(0.8);
      doc.dash(5, { space: 3 });
      doc.strokeColor("#111111").stroke();
      doc.undash();
      doc.restore();
      doc.font("dejavu-bold").fontSize(9).fillColor("#7b61ff").text("Kvalificirani digitalni potpis", x + 28, y + estimatedHeight - 45, {
        width: Math.max(200, cardWidth - 56),
      });
    }

    doc.save();
    doc.moveTo(x + 16, y + estimatedHeight - 12).lineTo(x + cardWidth - 16, y + estimatedHeight - 12);
    doc.lineWidth(0.8).strokeColor("#111111").stroke();
    doc.restore();
    return estimatedHeight;
  };

  for (let index = 0; index < safeItems.length; index += 2) {
    const rowItems = safeItems.slice(index, index + 2);
    const rowStartY = doc.y;
    const heights = [];
    helpers.ensureSpace(152);

    for (let rowIndex = 0; rowIndex < rowItems.length; rowIndex += 1) {
      const item = rowItems[rowIndex];
      const isSingleLast = rowItems.length === 1;
      const x = isSingleLast
        ? doc.page.margins.left + columnWidth + columnGap
        : doc.page.margins.left + (rowIndex * (columnWidth + columnGap));
      heights.push(await drawSignatureCard(item, x, rowStartY, columnWidth));
    }

    doc.y = rowStartY + Math.max(...heights, 110) + 10;
  }
}

async function renderPdfImageBlock(doc, helpers, title, item = {}) {
  const imageBuffer = await resolvePdfImageBuffer(item.imageUrl || "");
  if (!imageBuffer) {
    renderPdfFieldCard(
      doc,
      helpers,
      title,
      normalizePdfText(item.fileName || item.caption || `Nema dodane datoteke za ${item.imageKind || "sliku"}.`),
    );
    return;
  }

  helpers.ensureSpace(240);
  doc.font("dejavu-bold").fontSize(12).fillColor("#1f2333").text(title, {
    width: helpers.availableWidth,
  });
  doc.moveDown(0.35);

  const maxHeight = 300;
  const startX = doc.page.margins.left;
  const startY = doc.y;
  const frameWidth = helpers.availableWidth;
  const frameHeight = maxHeight;

  drawRoundedOutline(doc, startX, startY, frameWidth, frameHeight, 18, "#111111");

  try {
    doc.image(imageBuffer, startX + 12, startY + 12, {
      fit: [frameWidth - 24, frameHeight - 24],
      align: "center",
      valign: "center",
    });
  } catch {
    doc.font("dejavu").fontSize(10).fillColor("#64748b").text(
      "Sliku nije moguće prikazati u PDF-u.",
      startX + 16,
      startY + 18,
      { width: frameWidth - 32 },
    );
  }

  doc.y = startY + frameHeight + 10;
  if (clean(item.caption) && clean(item.caption) !== clean(item.fileName)) {
    doc.font("dejavu").fontSize(9.5).fillColor("#64748b").text(item.caption, {
      width: helpers.availableWidth,
    });
    doc.moveDown(0.3);
  }
}

export async function buildPdfFromRenderModel(renderModel = {}) {
  const doc = new PDFDocument({
    autoFirstPage: true,
    size: "A4",
    layout: "portrait",
    margins: {
      top: 40,
      bottom: 40,
      left: 42,
      right: 42,
    },
    info: {
      Title: clean(renderModel.title) || "Zapisnik",
      Author: "Safety360",
      Subject: clean(renderModel.documentType) || "Zapisnik",
    },
  });

  doc.registerFont("dejavu", PDF_FONTS.regular);
  doc.registerFont("dejavu-bold", PDF_FONTS.bold);
  doc.registerFont("dejavu-italic", PDF_FONTS.italic);
  doc.font("dejavu");

  const helpers = createPdfLayoutHelpers(doc);
  const title = clean(renderModel.title) || "Zapisnik";
  const documentType = clean(renderModel.documentType) || "Zapisnik";
  const subtitleParts = normalizePdfLines([
    renderModel.workOrderNumber ? `RN ${renderModel.workOrderNumber}` : "",
    renderModel.company?.name || "",
    renderModel.location?.name || "",
  ]);
  const logoBuffer = await resolvePdfImageBuffer(renderModel.company?.logoUrl || "");

  helpers.ensureSpace(120);
  const headerStartY = doc.y;
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, doc.page.width - doc.page.margins.right - 92, headerStartY, {
        fit: [92, 64],
        align: "right",
      });
    } catch {
      // Ignore image rendering issues and continue with text-only PDF.
    }
  }
  doc.font("dejavu-bold").fontSize(10).fillColor("#d946ef").text(documentType.toUpperCase(), doc.page.margins.left, headerStartY, {
    width: helpers.availableWidth - (logoBuffer ? 110 : 0),
  });
  doc.moveDown(0.35);
  doc.font("dejavu-bold").fontSize(22).fillColor("#1f2333").text(title, {
    width: helpers.availableWidth - (logoBuffer ? 110 : 0),
  });
  if (subtitleParts.length > 0) {
    doc.moveDown(0.25);
    doc.font("dejavu").fontSize(10.5).fillColor("#475569").text(subtitleParts.join(" · "), {
      width: helpers.availableWidth - (logoBuffer ? 110 : 0),
    });
  }

  const metaItems = [
    ["Tvrtka", renderModel.company?.name],
    ["Sjedište", renderModel.company?.headquarters],
    ["OIB", renderModel.company?.oib],
    ["Lokacija", renderModel.location?.name],
    ["Regija", renderModel.location?.region],
    ["Status", renderModel.status],
  ].filter(([, value]) => clean(value));

  if (metaItems.length > 0) {
    doc.moveDown(0.8);
    metaItems.forEach(([label, value]) => {
      doc.font("dejavu-bold").fontSize(9).fillColor("#7b61ff").text(label, {
        continued: true,
      });
      doc.font("dejavu").fillColor("#1f2333").text(` ${normalizePdfText(value)}`);
    });
  }

  doc.moveDown(0.8);

  for (const block of Array.isArray(renderModel.blocks) ? renderModel.blocks : []) {
    const blockTitle = clean(block.title) || "Blok";
    const blockDescription = clean(block.description);
    helpers.setLayout("portrait", { forceNewPage: false });
    helpers.ensureSpace(64, { layout: "portrait" });
    const blockStartY = doc.y;
    drawAccentLine(doc, doc.page.margins.left, blockStartY, 34, "#7c5cff");
    doc.font("dejavu-bold").fontSize(14).fillColor("#1f2333").text(blockTitle, doc.page.margins.left + 14, blockStartY, {
      width: helpers.availableWidth - 14,
    });
    if (blockDescription) {
      doc.font("dejavu").fontSize(9.5).fillColor("#64748b").text(blockDescription, doc.page.margins.left + 14, blockStartY + 18, {
        width: helpers.availableWidth - 14,
      });
    }
    doc.y = blockStartY + (blockDescription ? 42 : 30);

    for (const item of Array.isArray(block.items) ? block.items : []) {
      const itemType = clean(item.type).toLowerCase();

      if (itemType === "field") {
        renderPdfFieldCard(doc, helpers, item.title || "Polje", item.value, {
          multiline: Boolean(item.multiline),
        });
        continue;
      }

      if (itemType === "text_block") {
        renderPdfTextBlock(doc, helpers, item.title || "Tekst", item.body || "");
        continue;
      }

      if (itemType === "list") {
        renderPdfBullets(doc, helpers, item.title || "Popis", item.items || []);
        continue;
      }

      if (itemType === "table") {
        renderPdfTable(doc, helpers, item);
        continue;
      }

      if (itemType === "signature_group") {
        await renderPdfSignatureGroup(doc, helpers, item.title || "Potpisi", item.items || []);
        continue;
      }

      if (itemType === "image") {
        await renderPdfImageBlock(doc, helpers, item.title || "Slika", item);
        continue;
      }

      renderPdfFieldCard(doc, helpers, item.title || "Vrijednost", item.value || "");
    }
  }

  return pdfBufferFromDocument(doc);
}

export async function mergePdfBuffers(buffers = []) {
  const sourceBuffers = (Array.isArray(buffers) ? buffers : [])
    .filter((entry) => Buffer.isBuffer(entry) && entry.length > 0);

  if (sourceBuffers.length === 0) {
    throw new Error("Nema PDF datoteka za spajanje.");
  }

  if (sourceBuffers.length === 1) {
    return sourceBuffers[0];
  }

  const merged = await PdfLibDocument.create();
  for (const buffer of sourceBuffers) {
    const document = await PdfLibDocument.load(buffer);
    const pages = await merged.copyPages(document, document.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  return Buffer.from(await merged.save());
}

export function isWordTemplateFile(referenceDocument = {}) {
  const fileName = clean(referenceDocument.fileName || referenceDocument.name || "");
  const fileType = clean(referenceDocument.fileType || referenceDocument.mimeType || "");
  const extension = extname(fileName).toLowerCase();

  return [".docx", ".dotx"].includes(extension)
    || /officedocument\.wordprocessingml\.(document|template)/i.test(fileType);
}
