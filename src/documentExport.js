import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
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
  "/layers/digitalocean_apt/apt/usr/bin/soffice",
  "/layers/digitalocean_apt/apt/usr/bin/libreoffice",
  "/layers/digitalocean_apt/apt/bin/soffice",
  "/layers/digitalocean_apt/apt/bin/libreoffice",
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
].filter(Boolean);
const SOFFICE_DISCOVERY_ROOTS = [
  "/layers/digitalocean_apt/apt",
  "/layers",
  "/app/.apt",
  "/usr/lib/libreoffice",
  "C:\\Program Files\\LibreOffice",
  "C:\\Program Files (x86)\\LibreOffice",
];
const SOFFICE_BINARY_NAMES = new Set(["soffice", "libreoffice", "soffice.exe", "libreoffice.exe"]);

function clean(value = "") {
  return String(value ?? "").trim();
}

function stripInvalidXmlChars(value = "") {
  const source = String(value ?? "");
  let normalized = "";

  for (const character of source) {
    const codePoint = character.codePointAt(0) ?? 0;
    const isAllowed = codePoint === 0x09
      || codePoint === 0x0A
      || codePoint === 0x0D
      || (codePoint >= 0x20 && codePoint <= 0xD7FF)
      || (codePoint >= 0xE000 && codePoint <= 0xFFFD)
      || (codePoint >= 0x10000 && codePoint <= 0x10FFFF);

    if (isAllowed) {
      normalized += character;
    }
  }

  return normalized;
}

function sanitizeFileBaseName(value = "", fallback = "zapisnik") {
  const normalized = clean(value)
    .replace(/\.(docx|dotx|doc|dot|pdf)$/i, "")
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

async function resolveSofficeCommandViaShell() {
  if (process.platform === "win32") {
    return "";
  }

  const shellLookups = [
    "command -v soffice || true",
    "command -v libreoffice || true",
    "find /layers /app /workspace /usr -type f \\( -name soffice -o -name libreoffice -o -name soffice.bin -o -name libreoffice.bin \\) 2>/dev/null | head -n 1",
  ];

  for (const lookup of shellLookups) {
    try {
      const { stdout } = await runCommand("sh", ["-lc", lookup], {
        env: {
          ...process.env,
          PATH: [
            process.env.PATH,
            "/layers/digitalocean_apt/apt/usr/bin",
            "/layers/digitalocean_apt/apt/bin",
            "/app/.apt/usr/bin",
            "/app/.apt/bin",
          ].filter(Boolean).join(":"),
        },
      });
      const discovered = clean(String(stdout || "").split(/\r?\n/).find(Boolean) || "");
      if (!discovered) {
        continue;
      }

      await runCommand(discovered, ["--version"], {
        env: {
          ...process.env,
          PATH: [
            process.env.PATH,
            "/layers/digitalocean_apt/apt/usr/bin",
            "/layers/digitalocean_apt/apt/bin",
            "/app/.apt/usr/bin",
            "/app/.apt/bin",
          ].filter(Boolean).join(":"),
        },
      });
      return discovered;
    } catch {
      continue;
    }
  }

  return "";
}

function buildSofficeRuntimeEnv(tempRoot = "") {
  const additionalPathEntries = process.platform === "win32"
    ? []
    : [
      "/usr/bin",
      "/usr/local/bin",
      "/app/.apt/usr/bin",
      "/app/.apt/bin",
      "/layers/digitalocean_apt/apt/usr/bin",
      "/layers/digitalocean_apt/apt/bin",
    ];
  const pathDelimiter = process.platform === "win32" ? ";" : ":";

  return {
    ...process.env,
    PATH: [process.env.PATH, ...additionalPathEntries].filter(Boolean).join(pathDelimiter),
    HOME: process.env.HOME || tempRoot || process.cwd(),
    TMPDIR: tempRoot || process.env.TMPDIR || process.cwd(),
    TMP: tempRoot || process.env.TMP || process.cwd(),
    TEMP: tempRoot || process.env.TEMP || process.cwd(),
    SAL_USE_VCLPLUGIN: process.env.SAL_USE_VCLPLUGIN || "svp",
    LANG: process.env.LANG || "C.UTF-8",
    LC_ALL: process.env.LC_ALL || "C.UTF-8",
  };
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

  const shellDiscovered = await resolveSofficeCommandViaShell();
  if (shellDiscovered) {
    return shellDiscovered;
  }

  for (const root of SOFFICE_DISCOVERY_ROOTS) {
    const discovered = await findSofficeCommandInDirectory(root);
    if (!discovered) {
      continue;
    }

    try {
      await runCommand(discovered, ["--version"]);
      return discovered;
    } catch {
      continue;
    }
  }

  return "";
}

async function findSofficeCommandInDirectory(rootDirectory = "", depth = 0, maxDepth = 5) {
  const safeRootDirectory = clean(rootDirectory);
  if (!safeRootDirectory || depth > maxDepth || !await fileExists(safeRootDirectory)) {
    return "";
  }

  try {
    const entries = await readdir(safeRootDirectory, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(safeRootDirectory, entry.name);

      if (entry.isFile() && SOFFICE_BINARY_NAMES.has(entry.name.toLowerCase())) {
        return entryPath;
      }
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const nested = await findSofficeCommandInDirectory(join(safeRootDirectory, entry.name), depth + 1, maxDepth);
      if (nested) {
        return nested;
      }
    }
  } catch {
    return "";
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
      return stripInvalidXmlChars(JSON.stringify(value, null, 2));
    } catch {
      return "";
    }
  }

  return stripInvalidXmlChars(String(value));
}

function escapeWordXmlText(value = "") {
  return stripInvalidXmlChars(String(value ?? ""))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeRegex(value = "") {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDocxSpecialPlaceholderValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const blockType = clean(value.__docxBlockType || value.type).toLowerCase();
  if (blockType === "system_description") {
    const legacyRows = Array.isArray(value.rows) ? value.rows : [];
    const rawBlocks = Array.isArray(value.blocks)
      ? value.blocks
      : [{
        id: clean(value.id) || "system-description-block-1",
        title: clean(value.title) || "Opis sustava",
        subtitle: clean(value.subtitle),
        rows: legacyRows,
      }];
    const blocks = rawBlocks
      .slice(0, 24)
      .map((block, blockIndex) => ({
        id: clean(block?.id) || `system-description-block-${blockIndex + 1}`,
        title: clean(block?.title) || "Opis sustava",
        subtitle: clean(block?.subtitle ?? block?.sectionSubtitle),
        rows: (Array.isArray(block?.rows) ? block.rows : [])
          .slice(0, 16)
          .map((row, rowIndex) => ({
            id: clean(row?.id) || `system-description-row-${blockIndex + 1}-${rowIndex + 1}`,
            subtitle: clean(row?.subtitle),
            description: String(row?.description ?? "").replace(/\r\n/g, "\n"),
            lineCount: Math.max(1, Math.min(8, Math.round(Number(row?.lineCount) || 1))),
          })),
      }));

    return {
      type: "system_description",
      blocks,
    };
  }

  if (blockType === "signature_group") {
    const items = (Array.isArray(value.items) ? value.items : [])
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        return {
          role: clean(item.role) || "Osoba",
          name: clean(item.name) || "Potpisnik",
          metaLines: (Array.isArray(item.metaLines) ? item.metaLines : [])
            .map((entry) => clean(entry))
            .filter(Boolean),
          signatureMode: clean(item.signatureMode).toLowerCase() || "scan",
        };
      })
      .filter(Boolean);

    return {
      type: "signature_group",
      items,
    };
  }

  if (blockType !== "table") {
    return null;
  }

  const columns = (Array.isArray(value.columns) ? value.columns : [])
    .map((column, index) => {
      if (column && typeof column === "object" && !Array.isArray(column)) {
        const width = Number(column.width);
        return {
          id: clean(column.id) || `column-${index + 1}`,
          label: clean(column.label) || clean(column.id) || `Kolona ${index + 1}`,
          width: Number.isFinite(width) ? Math.max(90, width) : 140,
        };
      }

      return {
        id: `column-${index + 1}`,
        label: clean(column) || `Kolona ${index + 1}`,
        width: 140,
      };
    })
    .filter((column) => clean(column.label));

  const rows = (Array.isArray(value.rows) ? value.rows : [])
    .map((row, rowIndex) => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const cells = Array.isArray(row.cells)
        ? row.cells
        : (Array.isArray(row.values) ? row.values : []);

      return {
        id: clean(row.id) || `row-${rowIndex + 1}`,
        header: Boolean(row.header),
        cells: Array.from({ length: columns.length }, (_, columnIndex) => {
          const cell = cells[columnIndex];
          if (cell && typeof cell === "object" && !Array.isArray(cell)) {
            const format = cell.format && typeof cell.format === "object"
              ? cell.format
              : {};
            return {
              text: String(cell.text ?? cell.value ?? "").replace(/\r\n/g, "\n"),
              format: {
                align: ["left", "center", "right", "auto"].includes(clean(format.align).toLowerCase())
                  ? clean(format.align).toLowerCase()
                  : "auto",
                type: ["general", "number", "integer", "percent", "text"].includes(clean(format.type).toLowerCase())
                  ? clean(format.type).toLowerCase()
                  : "general",
                fontFamily: clean(format.fontFamily).toLowerCase(),
                fontSize: Number.isFinite(Number(format.fontSize)) ? Math.max(10, Math.min(40, Number(format.fontSize))) : 14,
                bold: Boolean(format.bold),
                italic: Boolean(format.italic),
                underline: Boolean(format.underline),
                fillColor: /^#[0-9a-f]{6}$/i.test(clean(format.fillColor)) ? clean(format.fillColor).toUpperCase() : "",
                border: {
                  top: Boolean(format.border?.top),
                  right: Boolean(format.border?.right),
                  bottom: Boolean(format.border?.bottom),
                  left: Boolean(format.border?.left),
                },
              },
            };
          }

          return {
            text: String(cell ?? "").replace(/\r\n/g, "\n"),
            format: {
              align: "auto",
              type: "general",
              fontFamily: "default",
              fontSize: 14,
              bold: false,
              italic: false,
              underline: false,
              fillColor: "",
              border: {
                top: false,
                right: false,
                bottom: false,
                left: false,
              },
            },
          };
        }),
      };
    })
    .filter(Boolean);

  const headerRows = (Array.isArray(value.headerRows) ? value.headerRows : [])
    .map((entry) => clean(entry))
    .filter(Boolean);
  const merges = (Array.isArray(value.merges) ? value.merges : [])
    .map((merge) => {
      if (!merge || typeof merge !== "object") {
        return null;
      }
      return {
        rowId: clean(merge.rowId),
        columnId: clean(merge.columnId),
        rowSpan: Math.max(1, Number.parseInt(merge.rowSpan, 10) || 1),
        colSpan: Math.max(1, Number.parseInt(merge.colSpan, 10) || 1),
      };
    })
    .filter((merge) => merge?.rowId && merge?.columnId);

  if (columns.length === 0) {
    return null;
  }

  return {
    type: "table",
    columns,
    rows,
    headerRows,
    merges,
  };
}

function buildDocxSignatureGroupFallbackText(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => [
      clean(item?.role),
      clean(item?.name),
      ...((Array.isArray(item?.metaLines) ? item.metaLines : []).map((entry) => clean(entry)).filter(Boolean)),
    ].filter(Boolean).join("\n"))
    .filter(Boolean)
    .join("\n\n");
}

function buildDocxTableFallbackText(table = {}) {
  const rows = Array.isArray(table.rows) ? table.rows : [];
  return rows
    .map((row) => {
      const cells = Array.isArray(row?.cells) ? row.cells : [];
      return cells
        .map((cell) => clean(cell?.text ?? cell?.value ?? ""))
        .filter((value) => value.length > 0)
        .join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

function buildWordParagraphXml(text = "", {
  align = "left",
  bold = false,
  italic = false,
  color = "",
  size = 20,
  spacingBefore = 0,
  spacingAfter = 60,
} = {}) {
  const safeText = clean(text);
  const runProperties = [
    bold ? "<w:b/>" : "",
    italic ? "<w:i/>" : "",
    color ? `<w:color w:val="${escapeWordXmlText(color)}"/>` : "",
    size ? `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>` : "",
  ].filter(Boolean).join("");
  const paragraphProperties = [
    `<w:jc w:val="${escapeWordXmlText(align)}"/>`,
    `<w:spacing w:before="${Math.max(0, spacingBefore)}" w:after="${Math.max(0, spacingAfter)}"/>`,
  ].join("");

  if (!safeText) {
    return `<w:p><w:pPr>${paragraphProperties}</w:pPr></w:p>`;
  }

  return `
    <w:p>
      <w:pPr>${paragraphProperties}</w:pPr>
      <w:r>
        <w:rPr>${runProperties}</w:rPr>
        <w:t xml:space="preserve">${escapeWordXmlText(safeText)}</w:t>
      </w:r>
    </w:p>
  `.replace(/\n\s+/g, "");
}

function normalizeWordHexColor(value = "", fallback = "") {
  const normalized = clean(value).replace(/^#/, "").toUpperCase();
  if (/^[0-9A-F]{6}$/.test(normalized)) {
    return normalized;
  }
  return fallback;
}

function getWordFontFamilyValue(fontFamily = "default") {
  const safeFontFamily = clean(fontFamily).toLowerCase();
  const fontMap = {
    default: "Calibri",
    calibri: "Calibri",
    arial: "Arial",
    georgia: "Georgia",
    times: "Times New Roman",
    verdana: "Verdana",
    courier: "Courier New",
  };
  return fontMap[safeFontFamily] || fontMap.default;
}

function getWordTableCellAlign(format = {}) {
  const safeAlign = clean(format.align).toLowerCase();
  if (safeAlign === "left" || safeAlign === "center" || safeAlign === "right") {
    return safeAlign;
  }
  return ["number", "integer", "percent"].includes(clean(format.type).toLowerCase()) ? "right" : "left";
}

function getWordTableCellFontSize(format = {}, columnCount = 1) {
  const explicitSize = Number(format.fontSize);
  if (Number.isFinite(explicitSize)) {
    return Math.max(16, Math.min(44, Math.round(explicitSize * 1.6)));
  }
  if (columnCount >= 8) {
    return 16;
  }
  if (columnCount >= 6) {
    return 18;
  }
  return 20;
}

function buildWordTableCellBordersXml(format = {}, { header = false } = {}) {
  const border = format?.border && typeof format.border === "object"
    ? format.border
    : {};
  const hasCustomBorder = Boolean(border.top || border.right || border.bottom || border.left);
  const buildBorderTag = (side, enabled) => (
    enabled
      ? `<w:${side} w:val="single" w:sz="8" w:space="0" w:color="111111"/>`
      : `<w:${side} w:val="nil"/>`
  );

  if (!hasCustomBorder) {
    return `
      <w:top w:val="single" w:sz="8" w:space="0" w:color="111111"/>
      <w:left w:val="single" w:sz="8" w:space="0" w:color="111111"/>
      <w:bottom w:val="single" w:sz="8" w:space="0" w:color="111111"/>
      <w:right w:val="single" w:sz="8" w:space="0" w:color="111111"/>
    `.replace(/\n\s+/g, "");
  }

  return `
    ${buildBorderTag("top", border.top)}
    ${buildBorderTag("left", border.left)}
    ${buildBorderTag("bottom", border.bottom)}
    ${buildBorderTag("right", border.right)}
  `.replace(/\n\s+/g, "");
}

function buildWordTableCellParagraphsXml(text = "", format = {}, { header = false, columnCount = 1 } = {}) {
  const safeText = String(text ?? "").replace(/\r\n/g, "\n");
  const lines = safeText.length > 0 ? safeText.split("\n") : [""];
  const fontSize = getWordTableCellFontSize(format, columnCount);
  const align = getWordTableCellAlign(format);
  const fontFamily = getWordFontFamilyValue(format.fontFamily);
  const runProperties = [
    `<w:rFonts w:ascii="${escapeWordXmlText(fontFamily)}" w:hAnsi="${escapeWordXmlText(fontFamily)}" w:cs="${escapeWordXmlText(fontFamily)}"/>`,
    format.bold || header ? "<w:b/>" : "",
    format.italic ? "<w:i/>" : "",
    format.underline ? '<w:u w:val="single"/>' : "",
    `<w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/>`,
    '<w:color w:val="1F2333"/>',
  ].filter(Boolean).join("");

  return lines.map((line, lineIndex) => {
    const paragraphProperties = [
      `<w:jc w:val="${escapeWordXmlText(align)}"/>`,
      `<w:spacing w:before="0" w:after="${lineIndex === lines.length - 1 ? 0 : 20}"/>`,
    ].join("");

    return line
      ? `
        <w:p>
          <w:pPr>${paragraphProperties}</w:pPr>
          <w:r>
            <w:rPr>${runProperties}</w:rPr>
            <w:t xml:space="preserve">${escapeWordXmlText(line)}</w:t>
          </w:r>
        </w:p>
      `.replace(/\n\s+/g, "")
      : `<w:p><w:pPr>${paragraphProperties}</w:pPr></w:p>`;
  }).join("");
}

function buildWordTableXml(table = {}) {
  const columns = Array.isArray(table.columns) ? table.columns : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  if (columns.length === 0) {
    return buildWordParagraphXml("", { spacingAfter: 0 });
  }

  const totalGridWidth = 9360;
  const rawWidths = columns.map((column) => Math.max(90, Number(column.width) || 140));
  const rawTotalWidth = rawWidths.reduce((sum, value) => sum + value, 0) || (columns.length * 140);
  const columnWidths = rawWidths.map((value) => Math.max(480, Math.round((value / rawTotalWidth) * totalGridWidth)));
  const widthAdjustment = totalGridWidth - columnWidths.reduce((sum, value) => sum + value, 0);
  if (widthAdjustment !== 0 && columnWidths.length > 0) {
    columnWidths[columnWidths.length - 1] = Math.max(480, columnWidths[columnWidths.length - 1] + widthAdjustment);
  }

  const rowIndexById = new Map(rows.map((row, rowIndex) => [clean(row.id), rowIndex]));
  const columnIndexById = new Map(columns.map((column, columnIndex) => [clean(column.id), columnIndex]));
  const headerRowSet = new Set(
    (Array.isArray(table.headerRows) ? table.headerRows : [])
      .map((entry) => clean(entry))
      .filter(Boolean),
  );
  rows.forEach((row) => {
    if (row.header) {
      headerRowSet.add(clean(row.id));
    }
  });

  const mergeAnchors = new Map();
  const mergeContinuations = new Map();
  const skipCells = new Set();

  (Array.isArray(table.merges) ? table.merges : []).forEach((merge) => {
    const rowIndex = rowIndexById.get(clean(merge.rowId));
    const columnIndex = columnIndexById.get(clean(merge.columnId));
    if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) {
      return;
    }

    const rowSpan = Math.max(1, Math.min(Number.parseInt(merge.rowSpan, 10) || 1, rows.length - rowIndex));
    const colSpan = Math.max(1, Math.min(Number.parseInt(merge.colSpan, 10) || 1, columns.length - columnIndex));
    if (rowSpan <= 1 && colSpan <= 1) {
      return;
    }

    mergeAnchors.set(`${rowIndex}:${columnIndex}`, { rowSpan, colSpan });
    for (let currentRow = rowIndex; currentRow < rowIndex + rowSpan; currentRow += 1) {
      for (let currentColumn = columnIndex; currentColumn < columnIndex + colSpan; currentColumn += 1) {
        if (currentRow === rowIndex && currentColumn === columnIndex) {
          continue;
        }
        if (currentColumn === columnIndex) {
          mergeContinuations.set(`${currentRow}:${currentColumn}`, { colSpan });
        } else {
          skipCells.add(`${currentRow}:${currentColumn}`);
        }
      }
    }
  });

  const sumColumnWidth = (startIndex, span = 1) => (
    columnWidths.slice(startIndex, startIndex + Math.max(1, span)).reduce((sum, value) => sum + value, 0)
  );

  const rowsXml = rows.map((row, rowIndex) => {
    const cells = Array.isArray(row.cells) ? row.cells : [];
    const cellsXml = [];

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const cellKey = `${rowIndex}:${columnIndex}`;
      if (skipCells.has(cellKey)) {
        continue;
      }

      const mergeAnchor = mergeAnchors.get(cellKey);
      const mergeContinuation = mergeContinuations.get(cellKey);
      const rawCell = cells[columnIndex] && typeof cells[columnIndex] === "object"
        ? cells[columnIndex]
        : { text: String(cells[columnIndex] ?? ""), format: {} };
      const format = rawCell.format && typeof rawCell.format === "object"
        ? rawCell.format
        : {};
      const isHeader = headerRowSet.has(clean(row.id));
      const gridSpan = mergeAnchor?.colSpan || mergeContinuation?.colSpan || 1;
      const width = sumColumnWidth(columnIndex, gridSpan);
      const fillColor = normalizeWordHexColor(format.fillColor, isHeader ? "F1F7F4" : "");
      const bordersXml = buildWordTableCellBordersXml(format, { header: isHeader });
      const cellParagraphs = mergeContinuation
        ? buildWordParagraphXml("", { spacingAfter: 0 })
        : buildWordTableCellParagraphsXml(rawCell.text || "", format, { header: isHeader, columnCount: columns.length });

      cellsXml.push(`
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="${Math.max(480, width)}" w:type="dxa"/>
            ${gridSpan > 1 ? `<w:gridSpan w:val="${gridSpan}"/>` : ""}
            ${mergeAnchor?.rowSpan > 1 ? '<w:vMerge w:val="restart"/>' : mergeContinuation ? '<w:vMerge/>' : ""}
            <w:vAlign w:val="top"/>
            <w:tcMar>
              <w:top w:w="72" w:type="dxa"/><w:left w:w="72" w:type="dxa"/><w:bottom w:w="72" w:type="dxa"/><w:right w:w="72" w:type="dxa"/>
            </w:tcMar>
            ${fillColor ? `<w:shd w:val="clear" w:color="auto" w:fill="${fillColor}"/>` : ""}
            <w:tcBorders>${bordersXml}</w:tcBorders>
          </w:tcPr>
          ${cellParagraphs}
        </w:tc>
      `.replace(/\n\s+/g, ""));
    }

    return `<w:tr>${cellsXml.join("")}</w:tr>`;
  }).join("");

  const gridXml = columnWidths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblCellMar>
          <w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tblGrid>${gridXml}</w:tblGrid>
      ${rowsXml}
    </w:tbl>
    ${buildWordParagraphXml("", { spacingAfter: 0 })}
  `.replace(/\n\s+/g, "");
}

function buildWordSignatureCellXml(item = null) {
  const emptyParagraph = buildWordParagraphXml("", { spacingAfter: 0 });
  if (!item) {
    return `
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="4680" w:type="dxa"/>
          <w:vAlign w:val="top"/>
          <w:tcBorders>
            <w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/>
          </w:tcBorders>
        </w:tcPr>
        ${emptyParagraph}
      </w:tc>
    `.replace(/\n\s+/g, "");
  }

  const signatureLabel = item.signatureMode === "digital" ? "Digitalni potpis" : "Scan potpisa";
  const paragraphs = [
    buildWordParagraphXml(item.role, { align: "right", size: 18, spacingAfter: 40 }),
    buildWordParagraphXml(item.name, { align: "right", bold: true, size: 22, spacingAfter: 40 }),
    ...((Array.isArray(item.metaLines) ? item.metaLines : []).map((line) => (
      buildWordParagraphXml(line, { align: "right", size: 18, spacingAfter: 20 })
    ))),
    buildWordParagraphXml("______________________________", { align: "right", color: "7B61FF", size: 20, spacingBefore: 120, spacingAfter: 20 }),
    buildWordParagraphXml(signatureLabel, { align: "right", italic: true, color: "6B7280", size: 18, spacingAfter: 0 }),
  ].join("");

  return `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="4680" w:type="dxa"/>
        <w:vAlign w:val="top"/>
        <w:tcMar>
          <w:top w:w="90" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/>
        </w:tcMar>
        <w:tcBorders>
          <w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/>
        </w:tcBorders>
      </w:tcPr>
      ${paragraphs}
    </w:tc>
  `.replace(/\n\s+/g, "");
}

function buildWordSignatureGroupXml(items = []) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) {
    return buildWordParagraphXml("Nema odabranih osoba.", {
      align: "right",
      italic: true,
      color: "6B7280",
      size: 18,
      spacingAfter: 80,
    });
  }

  const rows = [];
  for (let index = 0; index < safeItems.length; index += 2) {
    const rowItems = safeItems.slice(index, index + 2);
    const leftItem = rowItems.length === 1 ? null : rowItems[0];
    const rightItem = rowItems.length === 1 ? rowItems[0] : rowItems[1];
    rows.push(`
      <w:tr>
        ${buildWordSignatureCellXml(leftItem)}
        ${buildWordSignatureCellXml(rightItem)}
      </w:tr>
    `.replace(/\n\s+/g, ""));
  }

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblCellMar>
          <w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/>
        </w:tblCellMar>
        <w:tblBorders>
          <w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="4680"/>
        <w:gridCol w:w="4680"/>
      </w:tblGrid>
      ${rows.join("")}
    </w:tbl>
    ${buildWordParagraphXml("", { spacingAfter: 0 })}
  `.replace(/\n\s+/g, "");
}

function buildDocxSystemDescriptionFallbackText(value = {}) {
  const blocks = Array.isArray(value.blocks)
    ? value.blocks
    : [{
      title: value.title,
      subtitle: value.subtitle,
      rows: value.rows,
    }];

  return blocks.flatMap((block) => ([
    clean(block?.title),
    clean(block?.subtitle),
    ...((Array.isArray(block?.rows) ? block.rows : []).map((row) => {
      const subtitle = clean(row?.subtitle);
      const description = clean(row?.description);
      return subtitle ? `${subtitle}: ${description}`.trim() : description;
    })),
  ].filter(Boolean))).join("\n");
}

function buildWordSystemDescriptionRowXml(row = {}) {
  const subtitle = clean(row.subtitle);
  const description = String(row.description ?? "").replace(/\r\n/g, "\n");
  const lineCount = Math.max(1, Math.min(8, Math.round(Number(row.lineCount) || 1)));
  const lines = description ? description.split("\n") : [""];

  if (!subtitle) {
    return lines.map((line, lineIndex) => buildWordParagraphXml(line, {
      align: "left",
      size: 20,
      spacingBefore: lineIndex === 0 ? 20 : 0,
      spacingAfter: lineIndex === lines.length - 1 ? Math.max(40, lineCount * 28) : 20,
    })).join("");
  }

  const valueText = lines.join(" ").trim();
  const safeSpacingAfter = Math.max(30, lineCount * 24);

  return `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="${safeSpacingAfter}"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
        <w:t xml:space="preserve">${escapeWordXmlText(`${subtitle}: `)}</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
        <w:t xml:space="preserve">${escapeWordXmlText(valueText)}</w:t>
      </w:r>
    </w:p>
  `.replace(/\n\s+/g, "");
}

function buildWordSystemDescriptionXml(value = {}) {
  const blocks = Array.isArray(value.blocks)
    ? value.blocks
    : [{
      title: value.title,
      subtitle: value.subtitle,
      rows: value.rows,
    }];

  const blocksXml = blocks.map((block, blockIndex) => {
    const title = clean(block?.title) || "Opis sustava";
    const subtitle = clean(block?.subtitle);
    const rows = Array.isArray(block?.rows) ? block.rows : [];

    const headingXml = `
      <w:p>
        <w:pPr>
          <w:spacing w:before="${blockIndex === 0 ? 100 : 180}" w:after="60"/>
          <w:shd w:val="clear" w:color="auto" w:fill="D1D5DB"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
          <w:t xml:space="preserve">${escapeWordXmlText(title.toUpperCase())}</w:t>
        </w:r>
      </w:p>
    `.replace(/\n\s+/g, "");

    const subtitleXml = subtitle
      ? buildWordParagraphXml(subtitle, {
        align: "left",
        italic: true,
        color: "6B7280",
        size: 18,
        spacingAfter: 60,
      })
      : "";

    const rowsXml = rows.length > 0
      ? rows.map((row) => buildWordSystemDescriptionRowXml(row)).join("")
      : buildWordParagraphXml("", { spacingAfter: 40 });

    return `${headingXml}${subtitleXml}${rowsXml}`;
  }).join("");

  return `${blocksXml}${buildWordParagraphXml("", { spacingAfter: 0 })}`;
}

function buildDocxSpecialPlaceholderXml(value) {
  if (!value || typeof value !== "object") {
    return "";
  }

  if (value.type === "system_description") {
    return buildWordSystemDescriptionXml(value);
  }

  if (value.type === "signature_group") {
    return buildWordSignatureGroupXml(value.items);
  }

  if (value.type === "table") {
    return buildWordTableXml(value);
  }

  return "";
}

function applyDocxSpecialPlaceholders(zip, specialPlaceholders = new Map()) {
  if (!zip || !(specialPlaceholders instanceof Map) || specialPlaceholders.size === 0) {
    return;
  }

  const xmlFileNames = Object.keys(zip.files ?? {}).filter((fileName) => (
    /^word\/(document|header\d+|footer\d+)\.xml$/i.test(fileName)
  ));

  xmlFileNames.forEach((fileName) => {
    const file = zip.file(fileName);
    if (!file) {
      return;
    }

    let xml = file.asText();
    let changed = false;

    specialPlaceholders.forEach((value, sentinel) => {
      if (!xml.includes(sentinel)) {
        return;
      }

      const replacementXml = buildDocxSpecialPlaceholderXml(value);
      if (!replacementXml) {
        return;
      }

      const paragraphPattern = new RegExp(
        `<w:p\\b(?:(?!<w:p\\b|<\\/w:p>).|[\\r\\n])*?${escapeRegex(sentinel)}(?:(?!<w:p\\b|<\\/w:p>).|[\\r\\n])*?<\\/w:p>`,
        "g",
      );
      if (paragraphPattern.test(xml)) {
        xml = xml.replace(paragraphPattern, replacementXml);
        changed = true;
        return;
      }

      const fallbackText = escapeWordXmlText(
        value.type === "table"
          ? buildDocxTableFallbackText(value)
          : value.type === "system_description"
            ? buildDocxSystemDescriptionFallbackText(value)
            : buildDocxSignatureGroupFallbackText(value.items),
      );
      xml = xml.replace(new RegExp(escapeRegex(sentinel), "g"), fallbackText);
      changed = true;
    });

    if (changed) {
      zip.file(fileName, xml);
    }
  });
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

  const specialPlaceholders = new Map();
  const normalizedPlaceholders = Object.fromEntries(
    Object.entries(placeholders && typeof placeholders === "object" ? placeholders : {})
      .map(([key, value], index) => {
        const safeKey = clean(key);
        if (!safeKey) {
          return null;
        }

        const specialValue = normalizeDocxSpecialPlaceholderValue(value);
        if (specialValue) {
          if (specialValue.type === "table" || specialValue.type === "system_description") {
            const sentinel = `__TASKFLOW_DOCX_BLOCK_${index}_${Date.now()}__`;
            specialPlaceholders.set(sentinel, specialValue);
            return [safeKey, sentinel];
          }
          return [safeKey, buildDocxSignatureGroupFallbackText(specialValue.items)];
        }

        return [safeKey, normalizeTemplatePlaceholderValue(value)];
      })
      .filter(Boolean),
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
    applyDocxSpecialPlaceholders(doc.getZip(), specialPlaceholders);
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
    await mkdir(officeProfileDir, { recursive: true });
    await writeFile(inputPath, Buffer.isBuffer(docxBuffer) ? docxBuffer : Buffer.from(docxBuffer ?? []));
    const commandResult = await runCommand(sofficeCommand, [
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
      env: buildSofficeRuntimeEnv(tempRoot),
    });

    let resolvedOutputPath = outputPath;
    if (!await fileExists(resolvedOutputPath)) {
      const generatedPdfEntries = (await readdir(tempRoot, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".pdf")
        .map((entry) => join(tempRoot, entry.name));
      const baseName = sanitizeFileBaseName(inputBaseName.replace(/\.docx$/i, ""), "")
        .toLowerCase();
      const matchedOutputPath = generatedPdfEntries.find((candidatePath) => (
        sanitizeFileBaseName(candidatePath, "").toLowerCase().includes(baseName)
      ));
      resolvedOutputPath = matchedOutputPath || generatedPdfEntries[0] || "";
    }

    if (!resolvedOutputPath || !await fileExists(resolvedOutputPath)) {
      const directoryEntries = await readdir(tempRoot).catch(() => []);
      const details = [
        "LibreOffice nije vratio PDF datoteku.",
        clean(commandResult.stdout) ? `STDOUT: ${clean(commandResult.stdout)}` : "",
        clean(commandResult.stderr) ? `STDERR: ${clean(commandResult.stderr)}` : "",
        directoryEntries.length > 0 ? `Sadržaj temp direktorija: ${directoryEntries.join(", ")}` : "",
      ].filter(Boolean).join(" ");
      throw new Error(details || "LibreOffice nije vratio PDF datoteku.");
    }

    return await readFile(resolvedOutputPath);
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

function renderPdfSystemDescriptionBlock(doc, helpers, block = {}) {
  const blocks = Array.isArray(block.blocks)
    ? block.blocks
    : [{
      title: block.title,
      subtitle: block.subtitle,
      rows: block.rows,
    }];

  blocks.forEach((entry, blockIndex) => {
    const title = clean(entry?.title) || "Opis sustava";
    const subtitle = clean(entry?.subtitle);
    const rows = Array.isArray(entry?.rows) ? entry.rows : [];

    helpers.ensureSpace(80);
    const startX = doc.page.margins.left;
    const titleY = doc.y;
    doc.save();
    doc.roundedRect(startX, titleY, helpers.availableWidth, 22, 2);
    doc.fillColor("#D1D5DB");
    doc.fill();
    doc.restore();

    doc.font("dejavu-bold").fontSize(12).fillColor("#111827").text(title.toUpperCase(), startX + 10, titleY + 4, {
      width: helpers.availableWidth - 20,
    });
    doc.y = titleY + 30;

    if (subtitle) {
      doc.font("dejavu-italic").fontSize(9.5).fillColor("#64748b").text(subtitle, {
        width: helpers.availableWidth,
      });
      doc.moveDown(0.35);
    }

    rows.forEach((row) => {
      const rowSubtitle = clean(row?.subtitle);
      const rowDescription = String(row?.description ?? "").replace(/\r\n/g, "\n");
      const lineCount = Math.max(1, Math.min(8, Math.round(Number(row?.lineCount) || 1)));
      const safeDescription = rowDescription || "";
      const approxHeight = Math.max(18, lineCount * 16);
      helpers.ensureSpace(approxHeight + 10);

      if (!rowSubtitle) {
        doc.font("dejavu").fontSize(11).fillColor("#111827").text(safeDescription, {
          width: helpers.availableWidth,
          lineGap: 2,
        });
        doc.moveDown(Math.max(0.2, lineCount * 0.12));
        return;
      }

      if (safeDescription.includes("\n") || lineCount > 1) {
        doc.font("dejavu-bold").fontSize(11).fillColor("#111827").text(`${rowSubtitle}:`, {
          width: helpers.availableWidth,
          align: "center",
        });
        doc.font("dejavu").fontSize(11).fillColor("#111827").text(safeDescription, {
          width: helpers.availableWidth,
          align: "center",
          lineGap: 2,
        });
        doc.moveDown(Math.max(0.15, lineCount * 0.1));
        return;
      }

      const labelText = `${rowSubtitle}: `;
      const valueText = safeDescription;
      const fontSize = 11;
      doc.font("dejavu-bold").fontSize(fontSize);
      const labelWidth = doc.widthOfString(labelText);
      doc.font("dejavu").fontSize(fontSize);
      const valueWidth = doc.widthOfString(valueText);
      const rowWidth = Math.min(helpers.availableWidth, labelWidth + valueWidth);
      const textX = startX + Math.max(0, (helpers.availableWidth - rowWidth) / 2);
      const textY = doc.y;

      doc.font("dejavu-bold").fontSize(fontSize).fillColor("#111827").text(labelText, textX, textY, {
        lineBreak: false,
        continued: true,
      });
      doc.font("dejavu").fontSize(fontSize).fillColor("#111827").text(valueText, {
        lineBreak: true,
      });
      doc.moveDown(0.15);
    });

    doc.moveDown(blockIndex === blocks.length - 1 ? 0.45 : 0.7);
  });
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
  const rawColumnWidths = Array.isArray(table.columnWidths) && table.columnWidths.length === columns.length
    ? table.columnWidths.map((width) => Math.max(1, Number(width) || 1))
    : Array.from({ length: columns.length }, () => 1);
  const totalColumnWidth = rawColumnWidths.reduce((sum, width) => sum + width, 0) || columns.length;
  const columnWidths = rawColumnWidths.map((width) => (helpers.availableWidth * width) / totalColumnWidth);
  const headerRows = Array.isArray(table.headerRows) && table.headerRows.length > 0
    ? table.headerRows
    : [columns];

  const drawRow = (cells, { header = false } = {}) => {
    const safeCells = Array.from({ length: columns.length }, (_, columnIndex) => normalizePdfText(cells[columnIndex] ?? ""));
    doc.font(header ? "dejavu-bold" : "dejavu").fontSize(fontSize);
    const heights = safeCells.map((cell, columnIndex) => doc.heightOfString(cell, {
      width: Math.max(28, columnWidths[columnIndex] - paddingX * 2),
      lineGap: 1,
    }));
    const rowHeight = Math.max(...heights, 14) + paddingY * 2;
    helpers.ensureSpace(rowHeight + 4, { layout: preferredLayout });
    const startY = doc.y;
    const startX = doc.page.margins.left;
    let currentX = startX;

    safeCells.forEach((cell, columnIndex) => {
      const columnWidth = columnWidths[columnIndex];
      const x = currentX;
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
      currentX += columnWidth;
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

      if (itemType === "system_description") {
        renderPdfSystemDescriptionBlock(doc, helpers, item);
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

function formatOfferPdfDate(value = "") {
  const normalized = clean(value);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return normalized || "—";
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}

function formatOfferPdfCurrency(value = 0, currency = "EUR") {
  const amount = Number(value ?? 0) || 0;

  try {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: clean(currency) || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${(clean(currency) || "EUR").toUpperCase()}`;
  }
}

function writeOfferPdfMetaRow(doc, label, value, {
  labelWidth = 118,
  valueWidth = 390,
} = {}) {
  doc.font("dejavu-bold").fontSize(9.5).fillColor("#5f6f95").text(label, {
    continued: true,
    width: labelWidth,
  });
  doc.font("dejavu").fillColor("#1f2333").text(` ${normalizePdfText(value)}`, {
    width: valueWidth,
  });
}

function drawOfferPdfSectionTitle(doc, text) {
  doc.moveDown(0.25);
  const startY = doc.y;
  doc.save();
  doc.roundedRect(doc.page.margins.left, startY, doc.page.width - doc.page.margins.left - doc.page.margins.right, 18, 10);
  doc.fillColor("#eef4ff").fill();
  doc.restore();
  doc.font("dejavu-bold").fontSize(11).fillColor("#1e3a8a").text(text, doc.page.margins.left + 12, startY + 4, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 24,
  });
  doc.y = startY + 24;
}

export async function buildOfferPdfBuffer(offer = {}, options = {}) {
  const doc = new PDFDocument({
    autoFirstPage: true,
    size: "A4",
    layout: "portrait",
    margins: {
      top: 38,
      bottom: 38,
      left: 38,
      right: 38,
    },
    info: {
      Title: clean(offer.title) || clean(offer.offerNumber) || "Ponuda",
      Author: "SafeNexus",
      Subject: "Ponuda",
    },
  });

  doc.registerFont("dejavu", PDF_FONTS.regular);
  doc.registerFont("dejavu-bold", PDF_FONTS.bold);
  doc.registerFont("dejavu-italic", PDF_FONTS.italic);
  doc.font("dejavu");

  const helpers = createPdfLayoutHelpers(doc);
  const currency = clean(options.currency || offer.currency || "EUR") || "EUR";
  const title = clean(offer.title) || "Ponuda";
  const offerNumber = clean(offer.offerNumber) || "Nacrt ponude";
  const locationNames = normalizePdfLines(offer.selectedLocationNames || offer.locationName || "");
  const items = Array.isArray(offer.items) ? offer.items : [];
  const hasDiscount = Number(offer.discountRate ?? 0) > 0 || Number(offer.discountTotal ?? 0) > 0;

  helpers.ensureSpace(120);
  doc.font("dejavu-bold").fontSize(10).fillColor("#2563eb").text("SAFE NEXUS · PONUDA");
  doc.moveDown(0.25);
  doc.font("dejavu-bold").fontSize(22).fillColor("#111827").text(title, {
    width: helpers.availableWidth - 140,
  });
  doc.font("dejavu").fontSize(10.5).fillColor("#64748b").text(
    normalizePdfLines([
      offerNumber,
      offer.companyName || "",
      formatOfferPdfDate(offer.offerDate),
    ]).join(" · "),
  );

  const badgeWidth = 128;
  const badgeX = doc.page.width - doc.page.margins.right - badgeWidth;
  const badgeY = doc.page.margins.top;
  doc.save();
  doc.roundedRect(badgeX, badgeY, badgeWidth, 54, 16);
  doc.fillColor("#eff6ff").fill();
  doc.restore();
  doc.font("dejavu-bold").fontSize(9).fillColor("#2563eb").text("STATUS", badgeX + 14, badgeY + 12, {
    width: badgeWidth - 28,
  });
  doc.font("dejavu-bold").fontSize(13).fillColor("#0f172a").text(clean(offer.status || "draft").toUpperCase(), badgeX + 14, badgeY + 26, {
    width: badgeWidth - 28,
  });

  doc.moveDown(1);
  drawOfferPdfSectionTitle(doc, "Podaci o ponudi");
  writeOfferPdfMetaRow(doc, "Broj ponude", offerNumber);
  writeOfferPdfMetaRow(doc, "Datum ponude", formatOfferPdfDate(offer.offerDate));
  writeOfferPdfMetaRow(doc, "Vrijedi do", formatOfferPdfDate(offer.validUntil));
  writeOfferPdfMetaRow(doc, "Vrsta usluge", offer.serviceLine || "—");

  doc.moveDown(0.45);
  drawOfferPdfSectionTitle(doc, "Narucitelj");
  writeOfferPdfMetaRow(doc, "Tvrtka", offer.companyName || "—");
  writeOfferPdfMetaRow(doc, "OIB", offer.companyOib || "—");
  writeOfferPdfMetaRow(doc, "Sjediste", offer.headquarters || "—");
  writeOfferPdfMetaRow(doc, "Lokacije", locationNames.join(", ") || offer.locationName || "Bez lokacije");

  doc.moveDown(0.45);
  drawOfferPdfSectionTitle(doc, "Kontakt");
  writeOfferPdfMetaRow(doc, "Kontakt osoba", offer.contactName || "—");
  writeOfferPdfMetaRow(doc, "Telefon", offer.contactPhone || "—");
  writeOfferPdfMetaRow(doc, "Email", offer.contactEmail || "—");

  if (clean(offer.note)) {
    doc.moveDown(0.45);
    drawOfferPdfSectionTitle(doc, "Napomena");
    doc.font("dejavu").fontSize(10.5).fillColor("#1f2937").text(normalizePdfText(offer.note), {
      width: helpers.availableWidth,
    });
  }

  doc.moveDown(0.45);
  drawOfferPdfSectionTitle(doc, "Stavke ponude");

  if (items.length === 0) {
    doc.font("dejavu-italic").fontSize(10).fillColor("#64748b").text("Ponuda jos nema dodanih stavki.", {
      width: helpers.availableWidth,
    });
  } else {
    items.forEach((item, index) => {
      helpers.ensureSpace(74 + ((item.breakdowns?.length ?? 0) * 20));
      const startY = doc.y;
      const cardWidth = helpers.availableWidth;
      const breakdowns = Array.isArray(item.breakdowns) ? item.breakdowns : [];
      const rowHeight = 64 + (breakdowns.length * 20) + (Number(item.discountRate ?? 0) > 0 ? 18 : 0);

      drawRoundedOutline(doc, doc.page.margins.left, startY, cardWidth, rowHeight, 16, "#cfd8ea");

      doc.font("dejavu-bold").fontSize(11).fillColor("#111827").text(
        `${index + 1}. ${normalizePdfText(item.description || item.serviceCode || "Stavka")}`,
        doc.page.margins.left + 14,
        startY + 12,
        { width: cardWidth - 150 },
      );

      const metricParts = normalizePdfLines([
        item.serviceCode ? `Sifra: ${item.serviceCode}` : "",
        item.unit ? `Jedinica: ${item.unit}` : "",
        item.quantity != null ? `Kolicina: ${item.quantity}` : "",
        breakdowns.length === 0 ? `Cijena: ${formatOfferPdfCurrency(item.unitPrice ?? 0, currency)}` : "Razrada aktivna",
      ]);
      doc.font("dejavu").fontSize(9.5).fillColor("#64748b").text(metricParts.join(" · "), doc.page.margins.left + 14, startY + 30, {
        width: cardWidth - 160,
      });

      let contentY = startY + 48;
      breakdowns.forEach((entry) => {
        doc.font("dejavu").fontSize(9.5).fillColor("#334155").text(
          `• ${normalizePdfText(entry.label)}`,
          doc.page.margins.left + 18,
          contentY,
          { width: cardWidth - 170 },
        );
        doc.font("dejavu-bold").fontSize(9.5).fillColor("#0f172a").text(
          formatOfferPdfCurrency(entry.amount ?? 0, currency),
          doc.page.margins.left + cardWidth - 126,
          contentY,
          { width: 108, align: "right" },
        );
        contentY += 18;
      });

      if (Number(item.discountRate ?? 0) > 0) {
        doc.font("dejavu").fontSize(9).fillColor("#b45309").text(
          `Rabat stavke: ${Number(item.discountRate ?? 0)}%`,
          doc.page.margins.left + 18,
          contentY,
          { width: cardWidth - 170 },
        );
      }

      doc.font("dejavu-bold").fontSize(10.5).fillColor("#1d4ed8").text(
        formatOfferPdfCurrency(item.totalPrice ?? 0, currency),
        doc.page.margins.left + cardWidth - 132,
        startY + 18,
        { width: 118, align: "right" },
      );

      doc.y = startY + rowHeight + 8;
    });
  }

  helpers.ensureSpace(150);
  doc.moveDown(0.25);
  drawOfferPdfSectionTitle(doc, "Ukupni iznosi");
  writeOfferPdfMetaRow(doc, "Meduzbroj", formatOfferPdfCurrency(offer.subtotal ?? 0, currency), {
    labelWidth: 130,
    valueWidth: 240,
  });
  if (hasDiscount) {
    writeOfferPdfMetaRow(doc, "Rabat", formatOfferPdfCurrency(offer.discountTotal ?? 0, currency), {
      labelWidth: 130,
      valueWidth: 240,
    });
    writeOfferPdfMetaRow(doc, "Osnovica", formatOfferPdfCurrency(offer.taxableSubtotal ?? 0, currency), {
      labelWidth: 130,
      valueWidth: 240,
    });
  }
  writeOfferPdfMetaRow(doc, "PDV", formatOfferPdfCurrency(offer.taxTotal ?? 0, currency), {
    labelWidth: 130,
    valueWidth: 240,
  });
  writeOfferPdfMetaRow(doc, "Ukupno", formatOfferPdfCurrency(offer.total ?? 0, currency), {
    labelWidth: 130,
    valueWidth: 240,
  });

  if (offer.showTotalAmount === false) {
    doc.moveDown(0.35);
    doc.font("dejavu-italic").fontSize(9).fillColor("#64748b").text(
      "Ukupni iznos je skriven u ponudi; prikazana je interna kalkulacija radi pregleda.",
      { width: helpers.availableWidth },
    );
  }

  return pdfBufferFromDocument(doc);
}

export async function buildPurchaseOrderPdfBuffer(purchaseOrder = {}, options = {}) {
  const doc = new PDFDocument({
    autoFirstPage: true,
    size: "A4",
    layout: "portrait",
    margins: {
      top: 38,
      bottom: 38,
      left: 38,
      right: 38,
    },
    info: {
      Title: clean(purchaseOrder.title) || clean(purchaseOrder.purchaseOrderNumber) || "Narudzbenica",
      Author: "SafeNexus",
      Subject: "Narudzbenica",
    },
  });

  doc.registerFont("dejavu", PDF_FONTS.regular);
  doc.registerFont("dejavu-bold", PDF_FONTS.bold);
  doc.registerFont("dejavu-italic", PDF_FONTS.italic);
  doc.font("dejavu");

  const helpers = createPdfLayoutHelpers(doc);
  const currency = clean(options.currency || purchaseOrder.currency || "EUR") || "EUR";
  const title = clean(purchaseOrder.title) || "Narudzbenica";
  const purchaseOrderNumber = clean(purchaseOrder.purchaseOrderNumber) || "Nacrt narudzbenice";
  const locationNames = normalizePdfLines(purchaseOrder.selectedLocationNames || purchaseOrder.locationName || "");
  const items = Array.isArray(purchaseOrder.items) ? purchaseOrder.items : [];
  const hasDiscount = Number(purchaseOrder.discountRate ?? 0) > 0 || Number(purchaseOrder.discountTotal ?? 0) > 0;
  const statusLabel = purchaseOrder.status === "received"
    ? "ZAPRIMLJENA"
    : purchaseOrder.status === "issued"
      ? "POSLANA"
      : purchaseOrder.status === "confirmed"
        ? "POTVRDENA"
        : purchaseOrder.status === "closed"
          ? "ZATVORENA"
          : "SKICA";

  helpers.ensureSpace(120);
  doc.font("dejavu-bold").fontSize(10).fillColor("#2563eb").text("SAFE NEXUS · PURCHASE ORDER");
  doc.moveDown(0.25);
  doc.font("dejavu-bold").fontSize(22).fillColor("#111827").text(title, {
    width: helpers.availableWidth - 140,
  });
  doc.font("dejavu").fontSize(10.5).fillColor("#64748b").text(
    normalizePdfLines([
      purchaseOrderNumber,
      purchaseOrder.companyName || "",
      formatOfferPdfDate(purchaseOrder.purchaseOrderDate),
    ]).join(" · "),
  );

  const badgeWidth = 148;
  const badgeX = doc.page.width - doc.page.margins.right - badgeWidth;
  const badgeY = doc.page.margins.top;
  doc.save();
  doc.roundedRect(badgeX, badgeY, badgeWidth, 54, 16);
  doc.fillColor("#eff6ff").fill();
  doc.restore();
  doc.font("dejavu-bold").fontSize(9).fillColor("#2563eb").text("STATUS", badgeX + 14, badgeY + 12, {
    width: badgeWidth - 28,
  });
  doc.font("dejavu-bold").fontSize(13).fillColor("#0f172a").text(statusLabel, badgeX + 14, badgeY + 26, {
    width: badgeWidth - 28,
  });

  doc.moveDown(1);
  drawOfferPdfSectionTitle(doc, "Podaci o narudzbenici");
  writeOfferPdfMetaRow(doc, "Broj", purchaseOrderNumber);
  writeOfferPdfMetaRow(doc, "Datum", formatOfferPdfDate(purchaseOrder.purchaseOrderDate));
  writeOfferPdfMetaRow(doc, "Vrijedi do", formatOfferPdfDate(purchaseOrder.validUntil));
  writeOfferPdfMetaRow(doc, "Smjer", purchaseOrder.orderDirection === "outgoing" ? "Izlazna" : "Ulazna");
  writeOfferPdfMetaRow(doc, "Broj klijenta", purchaseOrder.externalDocumentNumber || "—");
  writeOfferPdfMetaRow(doc, "Vrsta usluge", purchaseOrder.serviceLine || "—");

  doc.moveDown(0.45);
  drawOfferPdfSectionTitle(doc, "Narucitelj");
  writeOfferPdfMetaRow(doc, "Tvrtka", purchaseOrder.companyName || "—");
  writeOfferPdfMetaRow(doc, "OIB", purchaseOrder.companyOib || "—");
  writeOfferPdfMetaRow(doc, "Sjediste", purchaseOrder.headquarters || "—");
  writeOfferPdfMetaRow(doc, "Lokacije", locationNames.join(", ") || purchaseOrder.locationName || "Bez lokacije");

  doc.moveDown(0.45);
  drawOfferPdfSectionTitle(doc, "Kontakt");
  writeOfferPdfMetaRow(doc, "Kontakt osoba", purchaseOrder.contactName || "—");
  writeOfferPdfMetaRow(doc, "Telefon", purchaseOrder.contactPhone || "—");
  writeOfferPdfMetaRow(doc, "Email", purchaseOrder.contactEmail || "—");

  if (clean(purchaseOrder.note)) {
    doc.moveDown(0.45);
    drawOfferPdfSectionTitle(doc, "Napomena");
    doc.font("dejavu").fontSize(10.5).fillColor("#1f2937").text(normalizePdfText(purchaseOrder.note), {
      width: helpers.availableWidth,
    });
  }

  doc.moveDown(0.45);
  drawOfferPdfSectionTitle(doc, "Stavke narudzbenice");

  if (items.length === 0) {
    doc.font("dejavu-italic").fontSize(10).fillColor("#64748b").text("Narudzbenica jos nema dodanih stavki.", {
      width: helpers.availableWidth,
    });
  } else {
    items.forEach((item, index) => {
      helpers.ensureSpace(74 + ((item.breakdowns?.length ?? 0) * 20));
      const startY = doc.y;
      const cardWidth = helpers.availableWidth;
      const breakdowns = Array.isArray(item.breakdowns) ? item.breakdowns : [];
      const rowHeight = 64 + (breakdowns.length * 20) + (Number(item.discountRate ?? 0) > 0 ? 18 : 0);

      drawRoundedOutline(doc, doc.page.margins.left, startY, cardWidth, rowHeight, 16, "#cfd8ea");

      doc.font("dejavu-bold").fontSize(11).fillColor("#111827").text(
        `${index + 1}. ${normalizePdfText(item.description || item.serviceCode || "Stavka")}`,
        doc.page.margins.left + 14,
        startY + 12,
        { width: cardWidth - 150 },
      );

      const metricParts = normalizePdfLines([
        item.serviceCode ? `Sifra: ${item.serviceCode}` : "",
        item.unit ? `Jedinica: ${item.unit}` : "",
        item.quantity != null ? `Kolicina: ${item.quantity}` : "",
        breakdowns.length === 0 ? `Cijena: ${formatOfferPdfCurrency(item.unitPrice ?? 0, currency)}` : "Razrada aktivna",
      ]);
      doc.font("dejavu").fontSize(9.5).fillColor("#64748b").text(metricParts.join(" · "), doc.page.margins.left + 14, startY + 30, {
        width: cardWidth - 160,
      });

      let contentY = startY + 48;
      breakdowns.forEach((entry) => {
        doc.font("dejavu").fontSize(9.5).fillColor("#334155").text(
          `• ${normalizePdfText(entry.label)}`,
          doc.page.margins.left + 18,
          contentY,
          { width: cardWidth - 170 },
        );
        doc.font("dejavu-bold").fontSize(9.5).fillColor("#0f172a").text(
          formatOfferPdfCurrency(entry.amount ?? 0, currency),
          doc.page.margins.left + cardWidth - 126,
          contentY,
          { width: 108, align: "right" },
        );
        contentY += 18;
      });

      if (Number(item.discountRate ?? 0) > 0) {
        doc.font("dejavu").fontSize(9).fillColor("#b45309").text(
          `Rabat stavke: ${Number(item.discountRate ?? 0)}%`,
          doc.page.margins.left + 18,
          contentY,
          { width: cardWidth - 170 },
        );
      }

      doc.font("dejavu-bold").fontSize(10.5).fillColor("#1d4ed8").text(
        formatOfferPdfCurrency(item.totalPrice ?? 0, currency),
        doc.page.margins.left + cardWidth - 132,
        startY + 18,
        { width: 118, align: "right" },
      );

      doc.y = startY + rowHeight + 8;
    });
  }

  helpers.ensureSpace(150);
  doc.moveDown(0.25);
  drawOfferPdfSectionTitle(doc, "Ukupni iznosi");
  writeOfferPdfMetaRow(doc, "Meduzbroj", formatOfferPdfCurrency(purchaseOrder.subtotal ?? 0, currency), {
    labelWidth: 130,
    valueWidth: 240,
  });
  if (hasDiscount) {
    writeOfferPdfMetaRow(doc, "Rabat", formatOfferPdfCurrency(purchaseOrder.discountTotal ?? 0, currency), {
      labelWidth: 130,
      valueWidth: 240,
    });
    writeOfferPdfMetaRow(doc, "Osnovica", formatOfferPdfCurrency(purchaseOrder.taxableSubtotal ?? 0, currency), {
      labelWidth: 130,
      valueWidth: 240,
    });
  }
  writeOfferPdfMetaRow(doc, "PDV", formatOfferPdfCurrency(purchaseOrder.taxTotal ?? 0, currency), {
    labelWidth: 130,
    valueWidth: 240,
  });
  writeOfferPdfMetaRow(doc, "Ukupno", formatOfferPdfCurrency(purchaseOrder.total ?? 0, currency), {
    labelWidth: 130,
    valueWidth: 240,
  });

  if (purchaseOrder.showTotalAmount === false) {
    doc.moveDown(0.35);
    doc.font("dejavu-italic").fontSize(9).fillColor("#64748b").text(
      "Ukupni iznos je skriven na dokumentu; prikazana je interna kalkulacija radi pregleda.",
      { width: helpers.availableWidth },
    );
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
