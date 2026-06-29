import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFNumber, PDFString, rgb } from "pdf-lib";
import {
  createDocumentationMeasurementTablesForService,
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
  const match = text.match(/^data:(image\/(?:png|jpe?g));base64,/i);
  if (!match) {
    return null;
  }
  try {
    const bytes = dataUrlToBytes(text);
    const mime = match[1].toLowerCase();
    if (!bytes) {
      return null;
    }
    return mime.includes("png")
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);
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
    const dataMatch = text.match(/^data:(image\/(?:png|jpe?g));base64,/i);
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
    const isPng = mime.includes("png") || /\.png(?:\?|$)/i.test(text);
    return isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
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

function drawUploadedHeader(page, model, image, fonts, y = TOP_Y) {
  if (!image) {
    return drawDefaultHeader(page, model, fonts, y);
  }
  const maxWidth = PAGE_WIDTH - (MARGIN_X * 2);
  const maxHeight = 88;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = MARGIN_X + ((maxWidth - width) / 2);
  const imageY = y - height;
  page.drawImage(image, { x, y: imageY, width, height });
  drawTextLine(page, clean(model.workOrderNumber), {
    x: MARGIN_X + maxWidth - 90,
    y: y - 5,
    width: 90,
    align: "right",
    font: fonts.regular,
    size: 8.6,
    color: MUTED,
  });
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
    const rowHeight = Math.max(20, (Math.max(1, valueLines.length) * lineHeight) + 7);
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

function drawPageOne(pdfDoc, model, rows, fonts, headerImage) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const hasTechnicalData = splitTextLines(model.technicalData).length > 0;
  page.drawRectangle({
    x: 18,
    y: BOTTOM_Y,
    width: 3,
    height: PAGE_HEIGHT - BOTTOM_Y - 42,
    color: BLUE,
  });
  let y = drawUploadedHeader(page, model, headerImage, fonts);
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
    ["Ispitivanje obavili:", clean(model.inspectors)],
  ], y, fonts, { fontSize: 9, lineHeight: 11.4 });
  y -= 4;
  if (hasTechnicalData) {
    y = drawSectionTitle(page, 2, "TEHNIČKI PODACI SUSTAVA", y, fonts);
    y = drawPlainList(page, model.technicalData, y, fonts, { maxLines: 5, fontSize: 8.2, lineHeight: 10.4 });
    y -= 4;
  }
  y = drawSectionTitle(page, hasTechnicalData ? 3 : 2, "MJERNA I ISPITNA OPREMA", y, fonts);
  y = drawPlainList(page, model.equipment, y, fonts, { maxLines: 7, fontSize: 8.2, lineHeight: 10.4 });
  y -= 4;
  y = drawSectionTitle(page, hasTechnicalData ? 4 : 3, "PRIMJENJENI PROPISI", y, fonts);
  drawPlainList(page, model.regulations, y, fonts, { maxLines: 14, fontSize: 7.7, lineHeight: 9.4 });
  drawFooter(page, "SPR-1/4", fonts);
  return page;
}

function drawPageTwo(pdfDoc, model, fonts) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const sectionOffset = splitTextLines(model.technicalData).length > 0 ? 1 : 0;
  let y = drawSimpleHeader(page, model, fonts);
  y = drawSectionTitle(page, 4 + sectionOffset, "KORIŠTENA TEHNIČKO-PROJEKTNA DOKUMENTACIJA", y, fonts);
  y = drawPlainList(page, model.projectDocumentation, y, fonts, { maxLines: 3, fontSize: 9, lineHeight: 12 });
  y -= 8;
  y = drawSectionTitle(page, 5 + sectionOffset, "REZULTATI ISPITIVANJA", y, fonts);
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
    height: 28,
    text: "Predmet pregleda",
    fonts,
    bold: true,
    fill: TABLE_GRAY,
  });
  drawCell(page, {
    x: MARGIN_X + firstColumnWidth,
    y,
    width: 104,
    height: 28,
    text: "ZADOVOLJAVA\nDA/NE/NP",
    fonts,
    bold: true,
    fill: TABLE_GRAY,
  });
  y -= 28;
  const rowHeight = 24;
  checklist.items.forEach((item) => {
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

function getPdfMeasurementCellRawValue(sheet, rowIndex, columnIndex, stack = new Set()) {
  const row = sheet?.rows?.[rowIndex];
  const column = sheet?.columns?.[columnIndex];
  if (!row || !column) {
    return "";
  }
  const rawValue = cleanMultiline(row.cells?.[column.id] ?? "");
  if (!isMeasurementFormula(rawValue)) {
    return rawValue;
  }
  const cellKey = `${rowIndex}:${columnIndex}`;
  if (stack.has(cellKey)) {
    return "";
  }
  stack.add(cellKey);
  try {
    const value = evaluateMeasurementFormula(rawValue, {
      resolveCellReference(reference) {
        const parsed = parseMeasurementCellReference(reference);
        if (!parsed) {
          return "";
        }
        const { rowIndex: referenceRowIndex, columnIndex: referenceColumnIndex } = parsed;
        return getPdfMeasurementCellRawValue(sheet, referenceRowIndex, referenceColumnIndex, stack);
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
  const sourceTables = Array.isArray(model.measurementTables) && model.measurementTables.length > 0
    ? model.measurementTables
    : createDocumentationMeasurementTablesForService(getServiceCode(model));
  return sourceTables.filter((table) => table?.enabled !== false).map((table, index) => {
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
      pageOrientation: getPdfMeasurementOrientation(withLegacyRows),
      sheet: normalizePdfMeasurementSheet(withLegacyRows.sheet),
    };
  });
}

function getPdfMeasurementTableRows(table = {}) {
  const sheet = normalizePdfMeasurementSheet(table.sheet);
  return sheet.rows
    .map((row, rowIndex) => ({
      ...row,
      rowIndex,
      cells: Object.fromEntries(sheet.columns.map((column, columnIndex) => {
        const value = clean(getPdfMeasurementCellRawValue(sheet, rowIndex, columnIndex));
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
  return dense ? 15.2 : 17.4;
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
  return Math.max(minHeight, Math.ceil((maxLines * lineHeight) + 5));
}

function drawMeasurementColumnHeader(page, columns, widths, y, fonts, dense, metrics = getPdfPageMetrics()) {
  let cellX = metrics.marginX || MARGIN_X;
  const headerHeight = dense ? 30 : 36;
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

function drawMeasurementTablePage(pdfDoc, model, table, fonts, rows, pageIndex = 0) {
  const metrics = getPdfPageMetrics(getPdfMeasurementOrientation(table));
  const page = pdfDoc.addPage([metrics.width, metrics.height]);
  let y = drawMeasurementSimpleHeader(page, model, fonts, metrics);
  drawTextLine(page, table.summary || table.label || getMeasurementTableTitle(model), {
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
  drawMeasurementTable(page, table, y - 6, fonts, rows, { metrics });
  return page;
}

function drawMeasurementTablePages(pdfDoc, model, rows, fonts) {
  const tables = normalizePdfMeasurementTables(model, rows);
  let pageCount = 0;
  tables.forEach((table) => {
    const sheet = normalizePdfMeasurementSheet(table.sheet);
    const allRows = getPdfMeasurementTableRows({ ...table, sheet });
    const columns = sheet.columns.length ? sheet.columns : [];
    const dense = columns.length > 8;
    const metrics = getPdfPageMetrics(getPdfMeasurementOrientation(table));
    const widths = getPdfMeasurementColumnWidths(columns, metrics);
    const headerHeight = dense ? 30 : 36;
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
      drawMeasurementTablePage(pdfDoc, model, table, fonts, headerRows, tablePageIndex);
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
      drawMeasurementTablePage(pdfDoc, model, table, fonts, pageRows, tablePageIndex);
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

function drawPageFour(pdfDoc, model, fonts, signatureImage = null) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawSimpleHeader(page, model, fonts);
  drawTextLine(page, "Pregled i ispitivanje sukladno Tablici 1 obavili:", {
    x: MARGIN_X,
    y,
    font: fonts.bold,
    size: 9,
  });
  const topSignatureX = PAGE_WIDTH - MARGIN_X - 205;
  const fieldName = model.signatureMode === "digital" ? signatureFieldName(model) : "";
  drawSignatureText(page, model, fonts, topSignatureX, y - 22, 205, {
    includeFieldLabel: true,
    fieldName,
    signatureImage,
  });
  if (fieldName) {
    addSignatureWidget(pdfDoc, page, {
      x: topSignatureX + 18,
      y: y - 106,
      width: 170,
      height: 38,
    }, fieldName);
  }
  y -= 128;
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
  y = drawTextBlock(page, "zahtjeve spomenutih propisa u pogledu navedenih ispitivanja, te se za navedeno izdaje ZAPISNIK broj:", {
    x: MARGIN_X + 2,
    y,
    width: PAGE_WIDTH - (MARGIN_X * 2) - 4,
    font: fonts.regular,
    size: 8.8,
    lineHeight: 11.5,
    maxLines: 3,
  });
  drawTextLine(page, clean(model.recordNumber), {
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
  drawTextLine(page, "Dokaze iz Zapisnika ocijenio:", {
    x: PAGE_WIDTH - MARGIN_X - 230,
    y: 154,
    width: 230,
    align: "center",
    font: fonts.regular,
    size: 8,
  });
  drawSignatureText(page, model, fonts, PAGE_WIDTH - MARGIN_X - 230, 140, 230, {
    signatureImage,
  });
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

  drawPageOne(pdfDoc, model, safeRows, fonts, headerImage);
  drawPageTwo(pdfDoc, model, fonts);
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
