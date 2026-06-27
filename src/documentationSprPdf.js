import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFNumber, PDFString, rgb } from "pdf-lib";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 42;
const TOP_Y = 805;
const BOTTOM_Y = 46;
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

function splitTextLines(value = "") {
  return cleanMultiline(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function safeFileName(value = "", fallback = "spr-zapisnik.pdf") {
  const base = clean(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return /\.pdf$/i.test(base || "") ? base : `${base || "spr-zapisnik"}.pdf`;
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
      y: 32,
      font: fonts.regular,
      size: 8.4,
    });
  });
}

function isFailingResult(model = {}) {
  return clean(model.resultStatus).toUpperCase() === "NE ZADOVOLJAVA";
}

function drawDefaultHeader(page, model, fonts, y = TOP_Y) {
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
    const response = await fetch(text);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const mime = match[1].toLowerCase();
    return mime.includes("png")
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);
  } catch {
    return null;
  }
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

function drawSimpleHeader(page, model, fonts, { showCode = true } = {}) {
  const x = MARGIN_X;
  const y = TOP_Y;
  const width = PAGE_WIDTH - (MARGIN_X * 2);
  const height = 64;
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
  drawTextLine(page, "ISPITIVANJE SIGURNOSNE PROTUPANIČNE RASVJETE", {
    x,
    y: y - 36,
    width,
    align: "center",
    font: fonts.bold,
    size: 10.2,
  });
  if (showCode) {
    drawTextLine(page, "IL - SPR", {
      x,
      y: y - 51,
      width,
      align: "center",
      font: fonts.regular,
      size: 8.2,
    });
  }
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
  drawTextLine(page, "O ISPITIVANJU PROTUPANIČNE (SIGURNOSNE) RASVJETE", {
    x: MARGIN_X,
    y: y - 40,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.bold,
    size: 10.4,
  });
  y -= 70;
  y = drawSectionTitle(page, 1, "OPĆI PODACI", y, fonts);
  y = drawKeyValueTable(page, [
    ["Naručitelj:", `${clean(model.companyName)}; ${clean(model.companyAddress)}; OIB: ${clean(model.companyOib)}`, true],
    ["Korisnik prostora:", clean(model.spaceUser)],
    ["Mjesto ispitivanja:", clean(model.inspectionPlace), true],
    ["Objekt ispitivanja:", clean(model.inspectionObject)],
    ["Vrsta ispitivanja:", clean(model.inspectionType)],
    ["Datum ispitivanja:", clean(model.inspectionDate), true],
    ["Broj zapisnika:", clean(model.recordNumber)],
    ["Ispitivanje obavili:", clean(model.inspectors)],
  ], y, fonts, { fontSize: 9, lineHeight: 11.4 });
  y -= 4;
  y = drawSectionTitle(page, 2, "MJERNA I ISPITNA OPREMA", y, fonts);
  y = drawPlainList(page, model.equipment, y, fonts, { maxLines: 7, fontSize: 8.2, lineHeight: 10.4 });
  y -= 4;
  y = drawSectionTitle(page, 3, "PRIMJENJENI PROPISI", y, fonts);
  drawPlainList(page, model.regulations, y, fonts, { maxLines: 14, fontSize: 7.7, lineHeight: 9.4 });
  drawFooter(page, "SPR-1/4", fonts);
  return page;
}

function drawPageTwo(pdfDoc, model, fonts) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawDefaultHeader(page, model, fonts);
  y = drawSectionTitle(page, 4, "KORIŠTENA TEHNIČKO-PROJEKTNA DOKUMENTACIJA", y, fonts);
  y = drawPlainList(page, model.projectDocumentation, y, fonts, { maxLines: 3, fontSize: 9, lineHeight: 12 });
  y -= 8;
  y = drawSectionTitle(page, 5, "REZULTATI ISPITIVANJA", y, fonts);
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

function drawMeasurementTable(page, rows, y, fonts) {
  const x = MARGIN_X;
  const widths = [42, 212, 62, 58, 58, 80];
  const rowHeight = rows.length > 24 ? 15.4 : 17.8;
  const fontSize = rows.length > 24 ? 6.8 : 7.5;
  let cursorY = y;
  drawCell(page, { x, y: cursorY, width: widths[0], height: 38, text: "R. br.", fonts, bold: true, fill: TABLE_GRAY });
  drawCell(page, { x: x + widths[0], y: cursorY, width: widths[1], height: 38, text: "Mjesto ispitivanja", fonts, bold: true, fill: TABLE_GRAY });
  drawCell(page, { x: x + widths[0] + widths[1], y: cursorY, width: widths[2], height: 38, text: "Broj lampi", fonts, bold: true, fill: TABLE_GRAY });
  let headerX = x + widths[0] + widths[1] + widths[2];
  ["Ei\nlux", "Eimin\nlux", "ZADOVOLJAVA\nDA/NE"].forEach((header, index) => {
    drawCell(page, {
      x: headerX,
      y: cursorY,
      width: widths[index + 3],
      height: 38,
      text: header,
      fonts,
      bold: true,
      fill: TABLE_GRAY,
    });
    headerX += widths[index + 3];
  });
  cursorY -= 38;
  rows.slice(0, 32).forEach((row, index) => {
    let cellX = x;
    [
      row.number || String(index + 1),
      row.place,
      row.lampCount,
      row.ei,
      row.eimin,
      row.pass,
    ].forEach((value, cellIndex) => {
      drawCell(page, {
        x: cellX,
        y: cursorY,
        width: widths[cellIndex],
        height: rowHeight,
        text: value,
        fonts,
        fontSize,
        align: cellIndex === 1 ? "left" : "center",
      });
      cellX += widths[cellIndex];
    });
    cursorY -= rowHeight;
  });
  if (rows.length > 32) {
    drawTextLine(page, `Prikazano 32 od ${rows.length} mjernih mjesta.`, {
      x,
      y: cursorY - 8,
      font: fonts.regular,
      size: 7.4,
      color: MUTED,
    });
  }
  return cursorY;
}

function drawPageThree(pdfDoc, model, rows, fonts) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawSimpleHeader(page, model, fonts, { showCode: true });
  drawTextLine(page, "Tablica 1. - mjerna mjesta sigurnosne protupanične rasvjete", {
    x: MARGIN_X,
    y: y + 6,
    font: fonts.regular,
    size: 8.2,
    color: DARK,
  });
  drawMeasurementTable(page, rows, y - 6, fonts);
  drawFooter(page, "SPR-3/4", fonts);
  return page;
}

function extractOib(value = "") {
  const match = String(value || "").match(/\b\d{11}\b/);
  return match?.[0] || "";
}

function signatureFieldName(model) {
  const oib = extractOib(model.responsiblePerson);
  const suffix = clean(model.signatureFieldSuffix || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return oib ? `SIGN_SPR_${oib}${suffix ? `_${suffix}` : ""}` : "";
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
} = {}) {
  drawTextLine(page, "Ispitivac", {
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
  page.drawLine({
    start: { x: x + 30, y: y - 76 },
    end: { x: x + width - 30, y: y - 68 },
    thickness: 1.3,
    color: rgb(0.25, 0.36, 0.72),
    opacity: 0.45,
  });
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

function drawPageFour(pdfDoc, model, fonts) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawSimpleHeader(page, model, fonts, { showCode: false });
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
  y = drawPlainList(page, model.recommendations || "Redovito održavati i provjeravati sigurnosnu rasvjetu.", y, fonts, { maxLines: 4, fontSize: 8.5, lineHeight: 11.2 });
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
  y = drawKeyValueTable(page, [
    ["Funkcionalnost sigurnosne protupanične rasvjete", clean(model.resultStatus), true],
  ], y, fonts, { keyWidth: 310, fontSize: 8.5, lineHeight: 11 });
  y -= 8;
  y = drawSectionTitle(page, 9, "ZAKLJUČAK", y, fonts);
  y = drawTextBlock(page, "Temeljem rezultata mjerenja i ispitivanja te ocjene rezultata mjerenja može se zaključiti da ispitivana panik (sigurnosna) rasvjeta na dan predmetnog ispitivanja", {
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
  drawTextLine(page, `Zapisnik o ispitivanju vrijedi jednu (1) godinu, odnosno najkasnije do ${clean(model.validUntil)}`, {
    x: MARGIN_X,
    y: y - 28,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "center",
    font: fonts.regular,
    size: 8.4,
  });
  drawTextLine(page, `U Zagrebu, ${clean(model.issueDate)}`, {
    x: MARGIN_X,
    y: y - 52,
    width: PAGE_WIDTH - (MARGIN_X * 2),
    align: "right",
    font: fonts.bold,
    size: 8.6,
  });
  drawTextLine(page, "M.P.", {
    x: MARGIN_X + 90,
    y: 134,
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
  drawSignatureText(page, model, fonts, PAGE_WIDTH - MARGIN_X - 230, 140, 230);
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
      if (!fileName || !dataUrl || (!isPdf && !isPng && !isJpg)) {
        return null;
      }
      return {
        fileName,
        dataUrl,
        fileType: isPdf ? "application/pdf" : isPng ? "image/png" : "image/jpeg",
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
  drawTextLine(page, attachment.fileType === "application/pdf" ? "PDF prilog" : "Prilog", {
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
      } else {
        await appendImageAttachmentPage(pdfDoc, attachment, fonts, index);
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
  const safeRows = normalizeSprRows(rows, model);

  drawPageOne(pdfDoc, model, safeRows, fonts, headerImage);
  drawPageTwo(pdfDoc, model, fonts);
  drawPageThree(pdfDoc, model, safeRows, fonts);
  drawPageFour(pdfDoc, model, fonts);
  await appendAttachments(pdfDoc, model, fonts);
  const pageCount = pdfDoc.getPageCount() - startPageIndex;
  stampFooters(pdfDoc, model, fonts, { startPageIndex, pageCount });
  return {
    startPageIndex,
    pageCount,
    signatureFieldCount: signatureFieldName(model) ? 1 : 0,
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

function createSprPdfDocument(title = "SPR zapisnik") {
  return PDFDocument.create().then((pdfDoc) => {
    pdfDoc.registerFontkit(fontkit);
    pdfDoc.setTitle(clean(title || "SPR zapisnik"));
    pdfDoc.setSubject("SafeNexus Izrada dokumentacije SPR");
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
  const pdfDoc = await createSprPdfDocument(model.recordNumber || "SPR zapisnik");
  const fonts = await createDocumentationSprFonts(pdfDoc);
  const record = await appendDocumentationSprRecord(pdfDoc, model, rows, fonts);

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  const blob = new Blob([bytes], { type: "application/pdf" });
  return {
    blob,
    bytes,
    fileName: safeFileName(fileName || model.recordNumber || "spr-zapisnik.pdf"),
    pageCount: pdfDoc.getPageCount(),
    signatureFieldCount: record.signatureFieldCount,
  };
}

export async function generateDocumentationSprBatchPdfBlob({
  entries = [],
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
  drawBatchHandoverPage(pdfDoc, normalizedEntries, fonts);
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
