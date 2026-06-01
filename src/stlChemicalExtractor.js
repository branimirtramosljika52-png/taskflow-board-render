import mammoth from "mammoth";
import { getDocument as getPdfJsDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const STL_MAX_TEXT_CHARS = 120000;
const STL_CAS_PATTERN = /\b\d{2,7}\s*-\s*\d{2}\s*-\s*\d\b/g;
const STL_CAS_STRICT_PATTERN = /\b\d{2,7}-\d{2}-\d\b/;
const STL_EC_PATTERN = /\b(?:E[CZ]\s*(?:broj|number|no\.?)?\s*[:\-]?\s*)?(\d{3}-\d{3}-\d)\b/gi;
const STL_REACH_PATTERN = /\b\d{2}-\d{10}-\d{2}-\d{4}\b/g;
const STL_HAZARD_PATTERN = /\b(?:EUH\d{3}|H\d{3}[A-Z]?)\b[^.\n;]*(?:[.;][^\n]*)?/gi;
const STL_PRECAUTION_PATTERN = /\bP\d{3}[A-Z]?\b[^.\n;]*(?:[.;][^\n]*)?/gi;

function normalizeStlText(value = "") {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function uniqueStrings(values = [], limit = Number.POSITIVE_INFINITY) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const text = normalizeStlText(value).replace(/\n+/g, " ");
    const key = text.toLowerCase();
    if (!text || seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(text);
  });
  return result.slice(0, limit);
}

function normalizeCasNumber(value = "") {
  const compact = String(value || "").replace(/\s+/g, "");
  return compact.match(STL_CAS_STRICT_PATTERN)?.[0] || "";
}

function isValidCasNumber(value = "") {
  const casNumber = normalizeCasNumber(value);
  if (!casNumber) {
    return false;
  }
  const digits = casNumber.replace(/-/g, "");
  const checkDigit = Number(digits.slice(-1));
  const bodyDigits = digits.slice(0, -1).split("").reverse();
  const checksum = bodyDigits.reduce((sum, digit, index) => sum + (Number(digit) * (index + 1)), 0) % 10;
  return checksum === checkDigit;
}

function extractCasNumbers(text = "", limit = 40) {
  return uniqueStrings(
    [...String(text || "").matchAll(STL_CAS_PATTERN)]
      .map((match) => normalizeCasNumber(match[0]))
      .filter(isValidCasNumber),
    limit,
  );
}

function getDataUrlMeta(dataUrl = "") {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) {
    return null;
  }
  return {
    mimeType: String(match[1] || "application/octet-stream").trim(),
    isBase64: Boolean(match[2]),
    payload: String(match[3] || ""),
  };
}

export function readStlDataUrlBuffer(dataUrl = "") {
  const meta = getDataUrlMeta(dataUrl);
  if (!meta) {
    return Buffer.alloc(0);
  }
  return meta.isBase64
    ? Buffer.from(meta.payload, "base64")
    : Buffer.from(decodeURIComponent(meta.payload), "utf8");
}

function getLowerFileName(fileName = "") {
  return String(fileName || "").trim().toLowerCase();
}

export function detectStlFileKind({ fileName = "", mimeType = "" } = {}) {
  const lowerName = getLowerFileName(fileName);
  const lowerType = String(mimeType || "").toLowerCase();
  if (lowerName.endsWith(".pdf") || lowerType.includes("pdf")) {
    return "pdf";
  }
  if (
    lowerName.endsWith(".docx")
    || lowerType.includes("wordprocessingml.document")
    || lowerType.includes("application/vnd.openxmlformats")
  ) {
    return "docx";
  }
  if (lowerName.endsWith(".doc")) {
    return "doc";
  }
  return "";
}

export async function extractTextFromStlPdfBuffer(buffer = Buffer.alloc(0)) {
  let loadingTask = null;
  try {
    loadingTask = getPdfJsDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0,
    });
    const document = await loadingTask.promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent({ disableCombineTextItems: false });
      const pageText = (Array.isArray(textContent?.items) ? textContent.items : [])
        .map((item) => String(item?.str || "").trim())
        .filter(Boolean)
        .join(" ");
      pages.push(pageText);
      if (pages.join("\n").length > STL_MAX_TEXT_CHARS) {
        break;
      }
    }
    return normalizeStlText(pages.join("\n\n")).slice(0, STL_MAX_TEXT_CHARS);
  } finally {
    try {
      await loadingTask?.destroy?.();
    } catch {
      // Best effort cleanup only.
    }
  }
}

export async function extractTextFromStlDocxBuffer(buffer = Buffer.alloc(0)) {
  const result = await mammoth.extractRawText({ buffer });
  return normalizeStlText(result.value || "").slice(0, STL_MAX_TEXT_CHARS);
}

function extractReadableStlSegments(value = "") {
  return String(value || "")
    .replace(/\u0000/g, " ")
    .replace(/[^\p{L}\p{N}\s.,:;/%()+\-#]/gu, " ")
    .split(/\s{2,}|\n+/)
    .map((line) => normalizeStlText(line))
    .filter((line) => line.length >= 3 && /[\p{L}\p{N}]/u.test(line));
}

export function extractTextFromStlDocBuffer(buffer = Buffer.alloc(0)) {
  const sources = [
    buffer.toString("utf8"),
    buffer.toString("utf16le"),
    buffer.toString("latin1"),
  ];
  return normalizeStlText(uniqueStrings(sources.flatMap(extractReadableStlSegments), 5000).join("\n"))
    .slice(0, STL_MAX_TEXT_CHARS);
}

export async function extractStlTextFromFile({ fileName = "", mimeType = "", dataUrl = "" } = {}) {
  const buffer = readStlDataUrlBuffer(dataUrl);
  if (!buffer.length) {
    throw new Error("STL datoteka je prazna ili nije ispravno učitana.");
  }
  const kind = detectStlFileKind({ fileName, mimeType });
  if (kind === "pdf") {
    return {
      kind,
      text: await extractTextFromStlPdfBuffer(buffer),
    };
  }
  if (kind === "docx") {
    return {
      kind,
      text: await extractTextFromStlDocxBuffer(buffer),
    };
  }
  if (kind === "doc") {
    return {
      kind,
      text: extractTextFromStlDocBuffer(buffer),
    };
  }
  throw new Error("Podržani su STL dokumenti u PDF, DOC ili DOCX formatu.");
}

function getLines(text = "") {
  return normalizeStlText(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function escapeStlRegex(value = "") {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function trimStlInlineFieldValue(value = "") {
  let text = normalizeStlText(value).replace(/\n+/g, " ");
  const boundaryIndex = text.search(/\s+(?=(?:datum|date|izdanje|edition|rep\.?|revizija|revision|verzija|version|stranica|page|ufi|cas(?:\s*(?:br\.?|broj|no\.?|number))?|e[cz]\s*(?:broj|number|no\.?)?|reach|klasa|ur\.?\s*broj|urbroj|odjeljak|section|dobavlja[c\u010d]|supplier|proizvo[d\u0111]a[c\u010d]|manufacturer|elementi\s+ozna[c\u010d]avanja|classification|razvrstavanje|sastav|composition)\b\s*:?)/iu);
  if (boundaryIndex > 0) {
    text = text.slice(0, boundaryIndex);
  }
  return text
    .replace(/^[:;.,\-\s]+|[:;.,\-\s]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function findInlineValueAfterLabel(line = "", labels = []) {
  const source = normalizeStlText(line).replace(/\n+/g, " ");
  for (const label of labels) {
    const pattern = new RegExp(`(?:^|[\\s.;|])${escapeStlRegex(label)}\\s*(?:[:\\-\\u2013]\\s*)?(.+)$`, "iu");
    const match = source.match(pattern);
    const value = trimStlInlineFieldValue(match?.[1] || "");
    if (value) {
      return value;
    }
  }
  return "";
}

function findValueAfterLabel(lines = [], labels = []) {
  const normalizedLabels = labels.map((label) => String(label).toLowerCase());
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const normalizedLine = line.toLowerCase();
    const label = normalizedLabels.find((candidate) => normalizedLine.includes(candidate));
    if (!label) {
      continue;
    }
    const inlineParts = line.split(/[:\-–]\s+/);
    if (inlineParts.length > 1) {
      const value = inlineParts.slice(1).join(" - ").trim();
      if (value && !normalizedLabels.some((candidate) => value.toLowerCase().includes(candidate))) {
        return value;
      }
    }
    const nextLine = lines.slice(index + 1, index + 4)
      .find((candidate) => candidate && !/^(odjeljak|section)\b/i.test(candidate));
    if (nextLine) {
      return nextLine;
    }
  }
  return "";
}

function collectLinesMatching(lines = [], patterns = [], limit = 18) {
  return uniqueStrings(lines.filter((line) => patterns.some((pattern) => pattern.test(line))), limit);
}

function extractRegexMatches(text = "", pattern, limit = 40) {
  return uniqueStrings(String(text || "").match(pattern) || [], limit);
}

function extractSectionText(text = "", sectionNumbers = []) {
  const normalized = normalizeStlText(text);
  const sections = [];
  sectionNumbers.forEach((sectionNumber) => {
    const escaped = String(sectionNumber).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?:^|\\n)\\s*(?:ODJELJAK|SECTION)?\\s*${escaped}\\.?\\s*[:\\-.]?\\s*[\\s\\S]*?(?=\\n\\s*(?:ODJELJAK|SECTION)?\\s*\\d{1,2}\\.?\\s*[:\\-.]?|$)`,
      "i",
    );
    const match = normalized.match(pattern);
    if (match?.[0]) {
      sections.push(match[0]);
    }
  });
  return normalizeStlText(sections.join("\n\n"));
}

function extractStlPpeText(text = "") {
  const section8 = extractSectionText(text, [8]);
  const source = section8 || text;
  const lines = getLines(source);
  return collectLinesMatching(lines, [
    /osobna zašt/i,
    /zaštit/i,
    /rukavic/i,
    /naočal/i,
    /vizir/i,
    /dišn/i,
    /respir/i,
    /maska/i,
    /filter/i,
    /odjeća|odjeca/i,
    /obuća|obuca/i,
    /glove/i,
    /eye protection/i,
    /respiratory/i,
    /protective clothing/i,
  ], 24).join("\n");
}

function extractStorageText(text = "") {
  const section7 = extractSectionText(text, [7]);
  const lines = getLines(section7 || text);
  return collectLinesMatching(lines, [
    /skladišt/i,
    /skladist/i,
    /čuvati/i,
    /cuvati/i,
    /držati/i,
    /drzati/i,
    /storage/i,
    /store/i,
    /ventil/i,
    /temperatur/i,
  ], 12).join("\n");
}

function extractExposureLimits(text = "") {
  const section8 = extractSectionText(text, [8]);
  const lines = getLines(section8 || text);
  return collectLinesMatching(lines, [
    /\bGVI\b/i,
    /\bKGVI\b/i,
    /graničn/i,
    /granicn/i,
    /izložen/i,
    /izlozen/i,
    /\bOEL\b/i,
    /\bTLV\b/i,
    /\bTWA\b/i,
    /\bSTEL\b/i,
  ], 18).join("\n");
}

function extractFirstAidText(text = "") {
  const section4 = extractSectionText(text, [4]);
  return getLines(section4)
    .filter((line) => /(udis|kož|koza|oči|oci|gutanj|inhal|skin|eye|swallow|first aid)/i.test(line))
    .slice(0, 16)
    .join("\n");
}

function extractFireText(text = "") {
  const section5 = extractSectionText(text, [5]);
  return getLines(section5)
    .filter((line) => /(požar|pozar|gašen|gasen|vatra|fire|extinguish|foam|prah|CO2|ugljični)/i.test(line))
    .slice(0, 14)
    .join("\n");
}

function extractSpillText(text = "") {
  const section6 = extractSectionText(text, [6]);
  return getLines(section6)
    .filter((line) => /(prolije|procur|izlije|spill|leak|apsorb|skuplj|cleanup|zaštit)/i.test(line))
    .slice(0, 14)
    .join("\n");
}

function extractClassification(text = "") {
  const section2 = extractSectionText(text, [2]);
  const lines = getLines(section2 || text);
  return collectLinesMatching(lines, [
    /flamm/i,
    /acute tox/i,
    /skin corr/i,
    /skin irrit/i,
    /eye irrit/i,
    /eye dam/i,
    /stot/i,
    /asp\.? tox/i,
    /aquatic/i,
    /zapalj/i,
    /nadraž/i,
    /nadraz/i,
    /toksi/i,
    /koroz/i,
    /opasnost/i,
    /štetno/i,
    /stetno/i,
  ], 16).join("\n");
}

function extractSignalWords(text = "") {
  return uniqueStrings(String(text || "").match(/\b(Opasnost|Upozorenje|Danger|Warning)\b/gi) || [], 4);
}

function extractPictograms(text = "") {
  return uniqueStrings(String(text || "").match(/\bGHS0?[1-9]\b/gi) || [], 12);
}

function getCasFlexiblePattern(casNumber = "") {
  const normalized = normalizeCasNumber(casNumber);
  if (!normalized) {
    return null;
  }
  return new RegExp(normalized.replace(/-/g, "\\s*-\\s*"), "i");
}

function cleanStlChemicalNameCandidate(value = "") {
  return normalizeStlText(value)
    .replace(STL_CAS_PATTERN, " ")
    .replace(/\bCAS\s*(?:br\.?|broj|no\.?|number)?[\s:.-]*/gi, " ")
    .replace(/\b(?:E[CZ]\s*(?:broj|number|no\.?)?[:\-\s]*)?\d{3}-\d{3}-\d\b/gi, " ")
    .replace(STL_REACH_PATTERN, " ")
    .replace(/\b(?:EUH\d{3}|H\d{3}[A-Z]?|P\d{3}[A-Z]?|GHS0?[1-9]|GVI|KGVI|OEL|TLV|TWA|STEL)\b/gi, " ")
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:%|ppm|mg\/m3|mg\/m³|g\/mol|kg|l)\b/gi, " ")
    .replace(/\b(?:broj|number|koncentracija|concentration|napomena|note|sastojak|ingredient|komponenta|component)\b/gi, " ")
    .replace(/[|_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[:;.,\-\s]+|[:;.,\-\s]+$/g, "")
    .trim();
}

function isLikelyStlChemicalName(value = "") {
  const text = cleanStlChemicalNameCandidate(value);
  if (text.length < 2 || text.length > 90) {
    return false;
  }
  if (STL_CAS_STRICT_PATTERN.test(text) || /^[\d\s.,;:%/+()-]+$/.test(text)) {
    return false;
  }
  if (/\b(?:odjeljak|section|sigurnosno|tehnički|tehnicki|safety data sheet|classification|klasifikacija|opasnost|upozorenje)\b/i.test(text)) {
    return false;
  }
  return /[\p{L}]/u.test(text);
}

function findStlChemicalNameNearCas(lines = [], casNumber = "") {
  const pattern = getCasFlexiblePattern(casNumber);
  if (!pattern) {
    return "";
  }
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] || "";
    const windowText = [line, lines[index + 1]].filter(Boolean).join(" ");
    if (!pattern.test(windowText)) {
      continue;
    }
    const parts = windowText.split(pattern);
    const candidates = [
      parts[0],
      parts.slice(1).join(" "),
      lines[index - 1],
      lines[index + 1],
    ].map(cleanStlChemicalNameCandidate);
    const match = candidates.find(isLikelyStlChemicalName);
    if (match) {
      return match;
    }
  }
  return "";
}

function buildStlChemicalName(lines = []) {
  const nameLabels = [
    "naziv proizvoda",
    "trgovacki naziv",
    "identifikacijska oznaka",
    "identifikacija tvari",
    "product name",
    "trade name",
    "substance name",
  ];
  const inlineValue = lines
    .map((line) => findInlineValueAfterLabel(line, nameLabels))
    .map((value) => cleanStlChemicalNameCandidate(value))
    .find(isLikelyStlChemicalName);
  if (inlineValue) {
    return inlineValue;
  }
  const value = findValueAfterLabel(lines, [
    "naziv proizvoda",
    "trgovački naziv",
    "trgovacki naziv",
    "identifikacijska oznaka",
    "identifikacija tvari",
    "product name",
    "trade name",
    "substance name",
  ]);
  if (value) {
    return cleanStlChemicalNameCandidate(trimStlInlineFieldValue(value)) || value.replace(/^[:\-\s]+/, "").trim();
  }
  const titleLine = lines.find((line) => (
    !/sigurnosno[-\s]?tehnički|sigurnosno[-\s]?tehnicki|safety data sheet|odjeljak|section/i.test(line)
    && line.length >= 3
    && line.length <= 90
  ));
  return titleLine || "";
}

export function extractStlChemicalDataFromText(text = "", metadata = {}) {
  const normalizedText = normalizeStlText(text);
  const lines = getLines(normalizedText);
  const identityText = extractSectionText(normalizedText, [1, 3]) || normalizedText;
  const casNumbers = extractCasNumbers(identityText, 24);
  const allCasNumbers = extractCasNumbers(normalizedText, 40);
  const selectedCasNumbers = casNumbers.length ? casNumbers : allCasNumbers;
  const ecNumbers = uniqueStrings([...normalizedText.matchAll(STL_EC_PATTERN)].map((match) => match[1]), 8);
  const reachNumbers = extractRegexMatches(normalizedText, STL_REACH_PATTERN, 8);
  const hazardStatements = extractRegexMatches(extractSectionText(normalizedText, [2]) || normalizedText, STL_HAZARD_PATTERN, 40);
  const precautionaryStatements = extractRegexMatches(extractSectionText(normalizedText, [2]) || normalizedText, STL_PRECAUTION_PATTERN, 40);

  const chemical = {
    name: buildStlChemicalName(lines),
    casNumber: selectedCasNumbers[0] || "",
    casNumbers: selectedCasNumbers,
    ecNumber: ecNumbers[0] || "",
    ecNumbers,
    reachNumber: reachNumbers[0] || "",
    reachNumbers,
    supplier: findValueAfterLabel(lines, ["dobavljač", "dobavljac", "supplier", "proizvođač", "proizvodac"]),
    recommendedUse: findValueAfterLabel(lines, ["utvrđene uporabe", "utvrdene uporabe", "preporučena uporaba", "recommended use", "identified uses"]),
    classification: extractClassification(normalizedText),
    signalWords: extractSignalWords(normalizedText),
    pictograms: extractPictograms(normalizedText),
    hazardStatements,
    precautionaryStatements,
    exposureLimits: extractExposureLimits(normalizedText),
    ppe: extractStlPpeText(normalizedText),
    storage: extractStorageText(normalizedText),
    firstAid: extractFirstAidText(normalizedText),
    fireMeasures: extractFireText(normalizedText),
    spillMeasures: extractSpillText(normalizedText),
    source: "STL",
    sourceFileName: String(metadata.fileName || ""),
    extractedAt: new Date().toISOString(),
  };
  chemical.name = chemical.name || findStlChemicalNameNearCas(lines, chemical.casNumber);

  return {
    ok: true,
    source: "stl",
    fileName: String(metadata.fileName || ""),
    textPreview: normalizedText.slice(0, 4000),
    chemicals: [chemical].filter((item) => (
      item.name
      || item.casNumber
      || item.classification
      || item.hazardStatements.length > 0
      || item.ppe
    )),
  };
}

export async function extractStlChemicalDataFromFile(file = {}) {
  const { kind, text } = await extractStlTextFromFile(file);
  const payload = extractStlChemicalDataFromText(text, file);
  return {
    ...payload,
    kind,
  };
}
