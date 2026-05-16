import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import fontkit from "@pdf-lib/fontkit";
import CDP from "chrome-remote-interface";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import mammoth from "mammoth";
import {
  PDFDocument as PdfLibDocument,
  PDFName,
  PDFNumber,
  PDFString,
  StandardFonts,
  rgb,
} from "pdf-lib";
import PDFDocument from "pdfkit";
import PizZip from "pizzip";

import {
  WORK_ORDER_STATUS_OPTIONS,
  getDashboardInsights,
  getDashboardStats,
  getWorkOrderExecutors,
} from "./safetyModel.js";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const DEJAVU_FONT_DIR = resolve(moduleDir, "..", "node_modules", "dejavu-fonts-ttf", "ttf");
const PDF_FONTS = {
  regular: resolve(DEJAVU_FONT_DIR, "DejaVuSans.ttf"),
  bold: resolve(DEJAVU_FONT_DIR, "DejaVuSans-Bold.ttf"),
  italic: resolve(DEJAVU_FONT_DIR, "DejaVuSans-Oblique.ttf"),
};
const DEFAULT_OFFER_HTML_TEMPLATE_PATH = resolve(moduleDir, "templates", "offer-v1.0.0.html");
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
const SOFFICE_PROFILE_DIR = join(tmpdir(), `taskflow-soffice-profile-${process.pid}`);
const SOFFICE_UNO_PROFILE_DIR = join(tmpdir(), `taskflow-soffice-uno-profile-${process.pid}`);
const SOFFICE_UNO_HOST = process.env.SOFFICE_UNO_HOST || "127.0.0.1";
const SOFFICE_UNO_PORT = Math.max(
  1024,
  Number(process.env.SOFFICE_UNO_PORT || (22000 + (process.pid % 10000))) || 22000,
);
const CHROMIUM_CANDIDATES = [
  process.env.CHROMIUM_PATH,
  process.env.CHROME_PATH,
  "chromium",
  "chromium-browser",
  "google-chrome",
  "google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const PYTHON_CANDIDATES = [
  process.env.PYTHON_PATH,
  "python3",
  "python",
  "/usr/bin/python3",
  "/usr/local/bin/python3",
  "C:\\Python312\\python.exe",
  "C:\\Python311\\python.exe",
  "C:\\Python310\\python.exe",
].filter(Boolean);
const UNO_DOCX_PDF_CONVERTER_PATH = resolve(moduleDir, "unoDocxToPdf.py");
const SOFFICE_CONVERSION_TIMEOUT_MS = Math.max(
  30000,
  Number(process.env.SOFFICE_CONVERSION_TIMEOUT_MS || 180000) || 180000,
);
const SOFFICE_UNO_READY_TIMEOUT_MS = Math.max(
  3000,
  Number(process.env.SOFFICE_UNO_READY_TIMEOUT_MS || 12000) || 12000,
);
const SOFFICE_UNO_CONVERSION_TIMEOUT_MS = Math.max(
  15000,
  Number(process.env.SOFFICE_UNO_CONVERSION_TIMEOUT_MS || 120000) || 120000,
);
const HTML_PDF_CONVERSION_TIMEOUT_MS = Math.max(
  20000,
  Number(process.env.HTML_PDF_CONVERSION_TIMEOUT_MS || 90000) || 90000,
);
const HTML_PDF_CDP_CONNECT_TIMEOUT_MS = Math.max(
  3000,
  Number(process.env.HTML_PDF_CDP_CONNECT_TIMEOUT_MS || 8000) || 8000,
);
const HTML_PDF_CDP_PRINT_TIMEOUT_MS = Math.max(
  20000,
  Number(process.env.HTML_PDF_CDP_PRINT_TIMEOUT_MS || HTML_PDF_CONVERSION_TIMEOUT_MS) || HTML_PDF_CONVERSION_TIMEOUT_MS,
);
const SOFFICE_PDF_CACHE_MAX_ENTRIES = Math.max(
  0,
  Number(process.env.SOFFICE_PDF_CACHE_MAX_ENTRIES || 60) || 60,
);
const SOFFICE_PDF_CACHE_MAX_BYTES = Math.max(
  0,
  Number(process.env.SOFFICE_PDF_CACHE_MAX_BYTES || 64 * 1024 * 1024) || 64 * 1024 * 1024,
);
const WORD_HTML_TEMPLATE_CACHE_MAX_ENTRIES = Math.max(
  0,
  Number(process.env.WORD_HTML_TEMPLATE_CACHE_MAX_ENTRIES || 40) || 40,
);
const WORD_HTML_TEMPLATE_CACHE_MAX_BYTES = Math.max(
  0,
  Number(process.env.WORD_HTML_TEMPLATE_CACHE_MAX_BYTES || 48 * 1024 * 1024) || 48 * 1024 * 1024,
);
const WORD_HTML_STYLE_MAP = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Naslov'] => h1:fresh",
  "p[style-name='Subtitle'] => p.sn-word-subtitle:fresh",
  "p[style-name='Podnaslov'] => p.sn-word-subtitle:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Naslov 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Naslov 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Naslov 3'] => h3:fresh",
  "p[style-name='Body Text'] => p:fresh",
  "p[style-name='Table Paragraph'] => p:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Citat'] => blockquote:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "r[style-name='Naglašeno'] => em",
].join("\n");
const MEASUREMENT_COLUMN_MIN_WIDTH = 32;
let sofficeCommandPromise = null;
let sofficeProfileReadyPromise = null;
let sofficeConversionQueue = Promise.resolve();
let pythonCommandPromise = null;
let warmSofficePromise = null;
let warmSofficeInstance = null;
let chromiumCommandPromise = null;
let warmChromiumPromise = null;
let warmChromiumInstance = null;
let sofficePdfCacheSizeBytes = 0;
const sofficePdfCache = new Map();
let wordHtmlTemplateCacheSizeBytes = 0;
const wordHtmlTemplateCache = new Map();

function clean(value = "") {
  return String(value ?? "").trim();
}

const PDF_SIGNATURE_FIELD_STANDARD = "SIGN_{ROLE}_{OIB}";
const DEFAULT_PDF_SIGNATURE_FIELD_ROLE = "ZNR";

export function normalizePdfSignatureFieldRole(value = DEFAULT_PDF_SIGNATURE_FIELD_ROLE) {
  const normalized = clean(value || DEFAULT_PDF_SIGNATURE_FIELD_ROLE)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || DEFAULT_PDF_SIGNATURE_FIELD_ROLE;
}

export function normalizePdfSignatureFieldOib(value = "") {
  const digits = clean(value).replace(/\D/g, "");
  return /^\d{11}$/.test(digits) ? digits : "";
}

export function buildPdfSignatureFieldName(role = DEFAULT_PDF_SIGNATURE_FIELD_ROLE, oib = "") {
  const normalizedOib = normalizePdfSignatureFieldOib(oib);
  if (!normalizedOib) {
    return "";
  }
  return `SIGN_${normalizePdfSignatureFieldRole(role)}_${normalizedOib}`;
}

function normalizePdfSignatureFieldSpec(item = {}, options = {}) {
  const signatureMode = clean(item.signatureMode).toLowerCase() || "scan";
  if (signatureMode !== "digital") {
    return null;
  }

  const signatureFieldRole = normalizePdfSignatureFieldRole(
    item.signatureFieldRole
      || item.signatureRole
      || item.roleCode
      || options.signatureFieldRole
      || DEFAULT_PDF_SIGNATURE_FIELD_ROLE,
  );
  const signatureFieldOib = normalizePdfSignatureFieldOib(
    item.signatureFieldOib
      || item.signerOib
      || item.oib
      || options.signatureFieldOib
      || "",
  );
  const fieldName = clean(item.preferredField || item.fieldName)
    || buildPdfSignatureFieldName(signatureFieldRole, signatureFieldOib);

  if (!fieldName || !signatureFieldOib) {
    return null;
  }

  return {
    fieldName,
    signatureFieldRole,
    signatureFieldOib,
    signatureFieldStandard: PDF_SIGNATURE_FIELD_STANDARD,
    label: clean(item.name) || clean(item.label) || "Potpisnik",
    name: clean(item.name) || clean(item.label) || "Potpisnik",
    roleLabel: clean(item.role) || signatureFieldRole,
    signerTitle: clean(item.signerTitle || item.title),
    signerUserId: clean(item.signerUserId || item.userId),
    signerEmail: clean(item.signerEmail || item.email),
    page: Number.isFinite(Number(item.page))
      ? Number(item.page)
      : (Number.isFinite(Number(options.page)) ? Number(options.page) : Number.NaN),
    x: Number.isFinite(Number(item.x)) ? Number(item.x) : Number.NaN,
    y: Number.isFinite(Number(item.y)) ? Number(item.y) : Number.NaN,
    width: Number.isFinite(Number(item.width)) ? Number(item.width) : Number.NaN,
    height: Number.isFinite(Number(item.height)) ? Number(item.height) : Number.NaN,
    drawPlaceholder: Boolean(item.drawPlaceholder ?? options.drawPlaceholder),
  };
}

function collectPdfSignatureFieldSpecsFromItems(items = [], options = {}) {
  return (Array.isArray(items) ? items : [])
    .map((item) => normalizePdfSignatureFieldSpec(item, options))
    .filter(Boolean);
}

export function collectPdfSignatureFieldSpecsFromValue(value = null, output = []) {
  if (!value || typeof value !== "object") {
    return output;
  }

  const blockType = clean(value.__docxBlockType || value.type).toLowerCase();
  if (blockType === "signature_group") {
    output.push(...collectPdfSignatureFieldSpecsFromItems(value.items ?? [], {
      drawPlaceholder: true,
    }));
    return output;
  }

  Object.values(value).forEach((entry) => {
    if (entry && typeof entry === "object") {
      collectPdfSignatureFieldSpecsFromValue(entry, output);
    }
  });

  return output;
}

export function collectPdfSignatureFieldSpecsFromEntry(entry = {}) {
  const specs = [
    ...collectPdfSignatureFieldSpecsFromValue(entry?.placeholders ?? {}),
    ...collectPdfSignatureFieldSpecsFromValue(entry?.renderModel ?? {}),
  ];
  const seen = new Set();
  return specs.filter((spec) => {
    const key = clean(spec.fieldName);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

const HTML_TEXT_ENCODING_REPLACEMENTS = Object.freeze([
  ["\u00c4\u0152", "\u010c"],
  ["\u00c4\u008c", "\u010c"],
  ["\u00c4\u0160", "\u010c"],
  ["\u00c4\u2020", "\u0106"],
  ["\u00c4\u0086", "\u0106"],
  ["\u00c4\u2021", "\u0107"],
  ["\u00c4\u0087", "\u0107"],
  ["\u00c4\u0164", "\u010d"],
  ["\u00c4\u008d", "\u010d"],
  ["\u00c4\u02c7", "\u010d"],
  ["\u00c4\u2018", "\u0111"],
  ["\u00c4\u0091", "\u0111"],
  ["\u00c4\u0090", "\u0110"],
  ["\u00c5\u00a0", "\u0160"],
  ["\u00c5\u00a1", "\u0161"],
  ["\u00c5\u00bd", "\u017d"],
  ["\u00c5\u00be", "\u017e"],
  ["\u0139\u02c7", "\u0161"],
  ["\u0139\u013e", "\u017e"],
  ["\u0139\u02dd", "\u017d"],
  ["\u00c2\u00a0", " "],
]);

function repairHtmlTextEncoding(value = "") {
  let text = String(value ?? "");
  HTML_TEXT_ENCODING_REPLACEMENTS.forEach(([broken, fixed]) => {
    text = text.split(broken).join(fixed);
  });
  return text;
}

function getHtmlTextEncodingSuspicionScore(value = "") {
  return (String(value ?? "").match(/[\uFFFD\u00c2\u00c3\u00c4\u00c5\u0102\u0139]/g) || []).length;
}

function ensureHtmlUtf8Meta(value = "") {
  let source = repairHtmlTextEncoding(String(value ?? "").replace(/^\uFEFF/, ""));

  if (/<meta\b[^>]*charset\s*=/i.test(source)) {
    return source.replace(/<meta\b[^>]*charset\s*=\s*["']?[^"'>\s;]+[^>]*>/i, '<meta charset="utf-8">');
  }

  if (/<head\b[^>]*>/i.test(source)) {
    return source.replace(/<head\b([^>]*)>/i, '<head$1>\n<meta charset="utf-8">');
  }

  if (/<html\b[^>]*>/i.test(source)) {
    return source.replace(/<html\b([^>]*)>/i, '<html$1>\n<head>\n<meta charset="utf-8">\n</head>');
  }

  return source;
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
  const match = raw.match(/^data:([^,]*),([\s\S]*)$/i);

  if (!match) {
    throw new Error("Datoteka nije u ispravnom data URL formatu.");
  }

  const metadata = clean(match[1]);
  const mimeType = clean(metadata.split(";")[0]) || "application/octet-stream";
  const isBase64 = /(?:^|;)base64(?:;|$)/i.test(metadata);
  const payload = match[2] ?? "";

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
    const { timeoutMs = 0, input, ...spawnOptions } = options;
    const child = spawn(command, args, {
      stdio: input === undefined ? ["ignore", "pipe", "pipe"] : ["pipe", "pipe", "pipe"],
      windowsHide: true,
      ...spawnOptions,
    });
    let stdout = "";
    let stderr = "";
    let didTimeout = false;
    const timeout = Number(timeoutMs) > 0
      ? setTimeout(() => {
        didTimeout = true;
        child.kill("SIGKILL");
      }, Number(timeoutMs))
      : null;

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk ?? "");
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk ?? "");
    });
    if (input !== undefined) {
      child.stdin?.on("error", () => {});
      child.stdin?.end(String(input ?? ""));
    }
    child.on("error", (error) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      rejectPromise(error);
    });
    child.on("close", (code) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (didTimeout) {
        const error = new Error(`Command timed out: ${command}`);
        error.code = "ETIMEDOUT";
        rejectPromise(error);
        return;
      }
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

async function resolveSofficeCommandCached() {
  if (!sofficeCommandPromise) {
    sofficeCommandPromise = resolveSofficeCommand();
  }

  return await sofficeCommandPromise;
}

async function resolvePythonCommand() {
  for (const candidate of PYTHON_CANDIDATES) {
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
      await runCommand(safeCandidate, ["--version"], {
        timeoutMs: 5000,
      });
      await runCommand(safeCandidate, ["-c", "import uno"], {
        timeoutMs: 5000,
      });
      return safeCandidate;
    } catch {
      continue;
    }
  }

  return "";
}

async function resolvePythonCommandCached() {
  if (!pythonCommandPromise) {
    pythonCommandPromise = resolvePythonCommand();
  }

  return await pythonCommandPromise;
}

function isChildProcessAlive(child = null) {
  return Boolean(child && !child.killed && child.exitCode === null && child.signalCode === null);
}

function trimCommandOutput(value = "", limit = 1600) {
  const text = clean(value);
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}...`;
}

async function runUnoDocxPdfConverter(items = [], {
  pythonCommand = "",
  timeoutMs = SOFFICE_UNO_CONVERSION_TIMEOUT_MS,
  tempRoot = "",
} = {}) {
  const payload = {
    host: SOFFICE_UNO_HOST,
    port: SOFFICE_UNO_PORT,
    timeoutSeconds: Math.max(1, Math.ceil(timeoutMs / 1000)),
    items,
  };
  const result = await runCommand(pythonCommand, [UNO_DOCX_PDF_CONVERTER_PATH], {
    input: JSON.stringify(payload),
    env: buildSofficeRuntimeEnv(tempRoot),
    timeoutMs,
  });
  const stdout = clean(result.stdout);

  if (!stdout) {
    throw new Error("UNO PDF konverter nije vratio rezultat.");
  }

  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`UNO PDF konverter je vratio neispravan odgovor: ${trimCommandOutput(stdout)}`);
  }
}

async function launchWarmSofficeInstance() {
  if (process.platform === "win32") {
    return null;
  }

  const [sofficeCommand, pythonCommand] = await Promise.all([
    resolveSofficeCommandCached(),
    resolvePythonCommandCached(),
  ]);

  if (!sofficeCommand || !pythonCommand || !await fileExists(UNO_DOCX_PDF_CONVERTER_PATH)) {
    return null;
  }

  await mkdir(SOFFICE_UNO_PROFILE_DIR, { recursive: true });
  const child = spawn(sofficeCommand, [
    "--headless",
    "--invisible",
    "--nologo",
    "--nodefault",
    "--nofirststartwizard",
    "--norestore",
    `-env:UserInstallation=${pathToFileURL(SOFFICE_UNO_PROFILE_DIR).href}`,
    `--accept=socket,host=${SOFFICE_UNO_HOST},port=${SOFFICE_UNO_PORT};urp;StarOffice.ComponentContext`,
  ], {
    cwd: tmpdir(),
    env: buildSofficeRuntimeEnv(tmpdir()),
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });
  let stderr = "";

  child.stderr?.on("data", (chunk) => {
    stderr = `${stderr}${String(chunk ?? "")}`.slice(-2400);
  });
  child.on("exit", () => {
    if (warmSofficeInstance?.child === child) {
      warmSofficeInstance = null;
      warmSofficePromise = null;
    }
  });

  try {
    await runUnoDocxPdfConverter([], {
      pythonCommand,
      tempRoot: tmpdir(),
      timeoutMs: SOFFICE_UNO_READY_TIMEOUT_MS,
    });
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error([
      "Warm LibreOffice UNO proces nije spreman.",
      clean(error?.message),
      trimCommandOutput(stderr),
    ].filter(Boolean).join(" "));
  }

  warmSofficeInstance = {
    child,
    pythonCommand,
    sofficeCommand,
    startedAt: Date.now(),
  };
  return warmSofficeInstance;
}

async function ensureWarmSofficeInstance() {
  if (isChildProcessAlive(warmSofficeInstance?.child)) {
    return warmSofficeInstance;
  }

  if (!warmSofficePromise) {
    warmSofficePromise = launchWarmSofficeInstance()
      .catch((error) => {
        warmSofficePromise = null;
        warmSofficeInstance = null;
        console.warn("Warm LibreOffice UNO nije dostupan, koristim standardni CLI put.", error);
        return null;
      });
  }

  return await warmSofficePromise;
}

async function tryConvertPreparedDocxItemsWithWarmSoffice(preparedItems = [], tempRoot = "") {
  if (!preparedItems.length) {
    return [];
  }

  const warmInstance = await ensureWarmSofficeInstance();
  if (!warmInstance?.pythonCommand || !isChildProcessAlive(warmInstance.child)) {
    return null;
  }

  const items = preparedItems.map((item) => ({
    inputPath: item.inputPath,
    outputPath: item.outputPath,
  }));
  const result = await runUnoDocxPdfConverter(items, {
    pythonCommand: warmInstance.pythonCommand,
    tempRoot,
    timeoutMs: SOFFICE_UNO_CONVERSION_TIMEOUT_MS,
  });
  const resultItems = Array.isArray(result?.results) ? result.results : [];
  const failed = resultItems.find((item) => item && item.ok === false);
  if (failed) {
    throw new Error(clean(failed.error) || "UNO PDF konverzija nije uspjela.");
  }

  const buffers = [];
  for (const item of preparedItems) {
    if (!item.outputPath || !await fileExists(item.outputPath)) {
      throw new Error(`UNO PDF konverzija nije vratila datoteku za ${item.inputBaseName}.`);
    }
    buffers.push(await readFile(item.outputPath));
  }
  return buffers;
}

export async function warmDocumentExportEngines() {
  await Promise.allSettled([
    ensureWarmSofficeInstance(),
  ]);
}

export async function shutdownDocumentExportEngines() {
  if (warmSofficeInstance?.child && !warmSofficeInstance.child.killed) {
    warmSofficeInstance.child.kill("SIGTERM");
  }
  warmSofficeInstance = null;
  warmSofficePromise = null;

  if (warmChromiumInstance?.child && !warmChromiumInstance.child.killed) {
    warmChromiumInstance.child.kill("SIGTERM");
  }
  warmChromiumInstance = null;
  warmChromiumPromise = null;
}

async function resolveChromiumCommand() {
  for (const candidate of CHROMIUM_CANDIDATES) {
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
      await runCommand(safeCandidate, ["--version"], {
        timeoutMs: 10000,
      });
      return safeCandidate;
    } catch {
      continue;
    }
  }

  return "";
}

async function resolveChromiumCommandCached() {
  if (!chromiumCommandPromise) {
    chromiumCommandPromise = resolveChromiumCommand();
  }

  return await chromiumCommandPromise;
}

async function getSharedSofficeProfileDir() {
  if (!sofficeProfileReadyPromise) {
    sofficeProfileReadyPromise = mkdir(SOFFICE_PROFILE_DIR, { recursive: true })
      .then(() => SOFFICE_PROFILE_DIR);
  }

  return await sofficeProfileReadyPromise;
}

function enqueueSofficeConversion(task) {
  const queued = sofficeConversionQueue
    .catch(() => {})
    .then(task);
  sofficeConversionQueue = queued.catch(() => {});
  return queued;
}

function buildSofficePdfCacheKey(item = {}) {
  const hash = createHash("sha256");
  hash.update("docx-pdf-v2");
  hash.update("\0");
  hash.update(clean(item.fileName || ""));
  hash.update("\0");
  hash.update(Buffer.isBuffer(item.buffer) ? item.buffer : Buffer.from(item.buffer ?? []));
  return hash.digest("hex");
}

function buildWordHtmlTemplateCacheKey(item = {}) {
  const hash = createHash("sha256");
  hash.update("word-html-v2");
  hash.update("\0");
  hash.update(clean(item.fileName || ""));
  hash.update("\0");
  hash.update(item.allowLibreOfficeFallback ? "lo" : "safe");
  hash.update("\0");
  hash.update(Buffer.isBuffer(item.buffer) ? item.buffer : Buffer.from(item.buffer ?? []));
  return hash.digest("hex");
}

function getCachedSofficePdfBuffer(cacheKey = "") {
  if (!SOFFICE_PDF_CACHE_MAX_ENTRIES || !SOFFICE_PDF_CACHE_MAX_BYTES) {
    return null;
  }

  const entry = sofficePdfCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  sofficePdfCache.delete(cacheKey);
  sofficePdfCache.set(cacheKey, entry);
  return Buffer.from(entry.buffer);
}

function cacheSofficePdfBuffer(cacheKey = "", buffer = Buffer.alloc(0)) {
  if (
    !SOFFICE_PDF_CACHE_MAX_ENTRIES
    || !SOFFICE_PDF_CACHE_MAX_BYTES
    || !cacheKey
    || !Buffer.isBuffer(buffer)
    || buffer.length <= 0
    || buffer.length > SOFFICE_PDF_CACHE_MAX_BYTES
  ) {
    return;
  }

  const existing = sofficePdfCache.get(cacheKey);
  if (existing) {
    sofficePdfCacheSizeBytes -= existing.size;
    sofficePdfCache.delete(cacheKey);
  }

  const cachedBuffer = Buffer.from(buffer);
  sofficePdfCache.set(cacheKey, {
    buffer: cachedBuffer,
    size: cachedBuffer.length,
  });
  sofficePdfCacheSizeBytes += cachedBuffer.length;

  while (
    sofficePdfCache.size > SOFFICE_PDF_CACHE_MAX_ENTRIES
    || sofficePdfCacheSizeBytes > SOFFICE_PDF_CACHE_MAX_BYTES
  ) {
    const oldestKey = sofficePdfCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    const oldest = sofficePdfCache.get(oldestKey);
    sofficePdfCacheSizeBytes -= oldest?.size || 0;
    sofficePdfCache.delete(oldestKey);
  }
}

function getCachedWordHtmlTemplate(cacheKey = "") {
  if (!WORD_HTML_TEMPLATE_CACHE_MAX_ENTRIES || !WORD_HTML_TEMPLATE_CACHE_MAX_BYTES || !cacheKey) {
    return null;
  }

  const entry = wordHtmlTemplateCache.get(cacheKey);
  if (!entry?.html) {
    return null;
  }

  wordHtmlTemplateCache.delete(cacheKey);
  wordHtmlTemplateCache.set(cacheKey, entry);
  return {
    html: entry.html,
    engine: entry.engine || "",
    messages: Array.isArray(entry.messages) ? entry.messages.map((message) => ({ ...message })) : [],
  };
}

function cacheWordHtmlTemplate(cacheKey = "", converted = null) {
  if (
    !WORD_HTML_TEMPLATE_CACHE_MAX_ENTRIES
    || !WORD_HTML_TEMPLATE_CACHE_MAX_BYTES
    || !cacheKey
    || !converted?.html
  ) {
    return;
  }

  const html = String(converted.html || "");
  const size = Buffer.byteLength(html, "utf8");
  if (size <= 0 || size > WORD_HTML_TEMPLATE_CACHE_MAX_BYTES) {
    return;
  }

  const existing = wordHtmlTemplateCache.get(cacheKey);
  if (existing) {
    wordHtmlTemplateCacheSizeBytes -= existing.size || 0;
    wordHtmlTemplateCache.delete(cacheKey);
  }

  wordHtmlTemplateCache.set(cacheKey, {
    html,
    engine: converted.engine || "",
    messages: Array.isArray(converted.messages) ? converted.messages.map((message) => ({ ...message })) : [],
    size,
  });
  wordHtmlTemplateCacheSizeBytes += size;

  while (
    wordHtmlTemplateCache.size > WORD_HTML_TEMPLATE_CACHE_MAX_ENTRIES
    || wordHtmlTemplateCacheSizeBytes > WORD_HTML_TEMPLATE_CACHE_MAX_BYTES
  ) {
    const oldestKey = wordHtmlTemplateCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    const oldest = wordHtmlTemplateCache.get(oldestKey);
    wordHtmlTemplateCacheSizeBytes -= oldest?.size || 0;
    wordHtmlTemplateCache.delete(oldestKey);
  }
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

function getDocxParagraphRanges(xml = "") {
  const ranges = [];
  const paragraphPattern = /<w:p\b[\s\S]*?<\/w:p>/g;
  let match = null;

  while ((match = paragraphPattern.exec(xml)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
      xml: match[0],
    });
  }

  return ranges;
}

function getDocxParagraphPlainText(paragraphXml = "") {
  return Array.from(paragraphXml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g))
    .map((match) => match[1] || "")
    .join("")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function isDocxPageBreakOnlyParagraph(paragraphXml = "") {
  const hasPageBreak = /<w:br\b[^>]*w:type=["']page["'][^>]*\/?>/i.test(paragraphXml)
    || /<w:pageBreakBefore\b[^>]*\/?>/i.test(paragraphXml);
  if (!hasPageBreak) {
    return false;
  }

  const plainText = getDocxParagraphPlainText(paragraphXml).replace(/\s+/g, "");
  const hasEmbeddedObject = /<(?:w:drawing|w:pict|w:object)\b/i.test(paragraphXml);
  return !plainText && !hasEmbeddedObject;
}

function removeDocxOptionalPlaceholderBlock(xml = "", sentinel = "") {
  if (!xml || !sentinel || !xml.includes(sentinel)) {
    return xml;
  }

  const ranges = getDocxParagraphRanges(xml);
  if (ranges.length === 0) {
    return xml.replace(new RegExp(escapeRegex(sentinel), "g"), "");
  }

  const removeIndexes = new Set();
  ranges.forEach((range, index) => {
    if (!range.xml.includes(sentinel)) {
      return;
    }

    removeIndexes.add(index);
    if (index > 0 && isDocxPageBreakOnlyParagraph(ranges[index - 1].xml)) {
      removeIndexes.add(index - 1);
    }
    if (index < ranges.length - 1 && isDocxPageBreakOnlyParagraph(ranges[index + 1].xml)) {
      removeIndexes.add(index + 1);
    }
  });

  if (removeIndexes.size === 0) {
    return xml.replace(new RegExp(escapeRegex(sentinel), "g"), "");
  }

  let nextXml = xml;
  [...removeIndexes]
    .sort((left, right) => right - left)
    .forEach((index) => {
      const range = ranges[index];
      nextXml = `${nextXml.slice(0, range.start)}${nextXml.slice(range.end)}`;
    });

  return nextXml.replace(new RegExp(escapeRegex(sentinel), "g"), "");
}

function normalizeDocxSpecialPlaceholderValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const blockType = clean(value.__docxBlockType || value.type).toLowerCase();
  if (blockType === "optional_empty" || blockType === "optional_blank") {
    return {
      type: "optional_empty",
    };
  }

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
          signatureImageUrl: clean(item.signatureImageUrl || item.signatureDataUrl || item.imageUrl),
          signerUserId: clean(item.signerUserId || item.userId),
          signerEmail: clean(item.signerEmail || item.email),
          signerOib: clean(item.signerOib || item.oib),
          signerTitle: clean(item.signerTitle || item.title),
          signatureFieldRole: normalizePdfSignatureFieldRole(item.signatureFieldRole || item.signatureRole || item.roleCode || DEFAULT_PDF_SIGNATURE_FIELD_ROLE),
          signatureFieldOib: normalizePdfSignatureFieldOib(item.signatureFieldOib || item.signerOib || item.oib),
          preferredField: clean(item.preferredField || item.fieldName),
          digitalAnchor: clean(item.digitalAnchor || item.signerOib || item.oib || item.signerEmail || item.email),
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
          width: Number.isFinite(width) ? Math.max(MEASUREMENT_COLUMN_MIN_WIDTH, width) : 140,
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
                fontSize: Number.isFinite(Number(format.fontSize)) ? Math.max(9, Math.min(40, Number(format.fontSize))) : 14,
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
    return Math.max(12, Math.min(88, Math.round(explicitSize * 2)));
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
  const rawWidths = columns.map((column) => Math.max(MEASUREMENT_COLUMN_MIN_WIDTH, Number(column.width) || 140));
  const rawTotalWidth = rawWidths.reduce((sum, value) => sum + value, 0) || (columns.length * 140);
  const columnWidths = rawWidths.map((value) => Math.max(240, Math.round((value / rawTotalWidth) * totalGridWidth)));
  const widthAdjustment = totalGridWidth - columnWidths.reduce((sum, value) => sum + value, 0);
  if (widthAdjustment !== 0 && columnWidths.length > 0) {
    columnWidths[columnWidths.length - 1] = Math.max(240, columnWidths[columnWidths.length - 1] + widthAdjustment);
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

function buildWordSignatureCellXml(item = null, zip = null, context = {}, xmlFileName = "word/document.xml", options = {}) {
  const cellWidth = Math.max(2400, Number(options.width) || 4680);
  const emptyParagraph = buildWordParagraphXml("", { spacingAfter: 0 });
  if (!item) {
    return `
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="${cellWidth}" w:type="dxa"/>
          <w:vAlign w:val="top"/>
          <w:tcBorders>
            <w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/>
          </w:tcBorders>
        </w:tcPr>
        ${emptyParagraph}
      </w:tc>
    `.replace(/\n\s+/g, "");
  }

  const signatureImageRef = item.signatureMode === "scan"
    ? addDocxSignatureImage(zip, xmlFileName, item, context)
    : null;
  const signatureImageXml = buildWordSignatureImageXml(signatureImageRef, item);
  const paragraphs = [
    buildWordParagraphXml(item.role, { align: "center", size: 18, spacingAfter: 40 }),
    buildWordParagraphXml(item.name, { align: "center", bold: true, size: 22, spacingAfter: 40 }),
    ...((Array.isArray(item.metaLines) ? item.metaLines : []).map((line) => (
      buildWordParagraphXml(line, { align: "center", size: 18, spacingAfter: 20 })
    ))),
    signatureImageXml,
    buildWordParagraphXml("______________________________", { align: "center", color: "7B61FF", size: 20, spacingBefore: signatureImageXml ? 20 : 120, spacingAfter: 0 }),
  ].join("");

  return `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${cellWidth}" w:type="dxa"/>
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

function buildWordSignatureGroupXml(items = [], zip = null, context = {}, xmlFileName = "word/document.xml") {
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
  const singleColumn = safeItems.length === 1;
  const columnWidth = 4680;
  const columnCount = singleColumn ? 1 : 2;
  const tableWidth = columnWidth * columnCount;

  if (singleColumn) {
    rows.push(`
      <w:tr>
        ${buildWordSignatureCellXml(safeItems[0], zip, context, xmlFileName, { width: columnWidth })}
      </w:tr>
    `.replace(/\n\s+/g, ""));
  } else {
    for (let index = 0; index < safeItems.length; index += 2) {
      const rowItems = safeItems.slice(index, index + 2);
      rows.push(`
        <w:tr>
          ${buildWordSignatureCellXml(rowItems[0], zip, context, xmlFileName, { width: columnWidth })}
          ${buildWordSignatureCellXml(rowItems[1] || null, zip, context, xmlFileName, { width: columnWidth })}
        </w:tr>
      `.replace(/\n\s+/g, ""));
    }
  }
  const gridXml = Array.from({ length: columnCount }, () => `<w:gridCol w:w="${columnWidth}"/>`).join("");

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="${tableWidth}" w:type="dxa"/>
        <w:jc w:val="right"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblCellMar>
          <w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/>
        </w:tblCellMar>
        <w:tblBorders>
          <w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>
        ${gridXml}
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

const DOCX_IMAGE_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
const DOCX_SIGNATURE_IMAGE_WIDTH_EMU = 1905000;
const DOCX_SIGNATURE_IMAGE_HEIGHT_EMU = 571500;

function readUInt24LE(buffer, offset) {
  if (!Buffer.isBuffer(buffer) || offset + 2 >= buffer.length) {
    return null;
  }

  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function readPngDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) {
    return null;
  }

  const isPng = buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a;

  if (!isPng) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const isSofMarker = (marker >= 0xc0 && marker <= 0xc3)
      || (marker >= 0xc5 && marker <= 0xc7)
      || (marker >= 0xc9 && marker <= 0xcb)
      || (marker >= 0xcd && marker <= 0xcf);

    if (isSofMarker && segmentLength >= 7) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    if (!Number.isFinite(segmentLength) || segmentLength < 2) {
      break;
    }
    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 30) {
    return null;
  }

  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }

  const chunkType = buffer.toString("ascii", 12, 16);
  if (chunkType === "VP8X") {
    const widthMinusOne = readUInt24LE(buffer, 24);
    const heightMinusOne = readUInt24LE(buffer, 27);
    if (widthMinusOne !== null && heightMinusOne !== null) {
      return {
        width: widthMinusOne + 1,
        height: heightMinusOne + 1,
      };
    }
  }

  if (chunkType === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunkType === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

function getRasterImageDimensions(buffer, mimeType = "") {
  const normalized = clean(mimeType).toLowerCase();
  const dimensions = normalized.includes("png")
    ? readPngDimensions(buffer)
    : normalized.includes("jpeg") || normalized.includes("jpg")
      ? readJpegDimensions(buffer)
      : normalized.includes("webp")
        ? readWebpDimensions(buffer)
        : (readPngDimensions(buffer) || readJpegDimensions(buffer) || readWebpDimensions(buffer));

  if (!dimensions || !Number.isFinite(dimensions.width) || !Number.isFinite(dimensions.height) || dimensions.width <= 0 || dimensions.height <= 0) {
    return null;
  }

  return dimensions;
}

function fitImageDimensionsToEmuBox(dimensions, maxWidthEmu, maxHeightEmu) {
  if (!dimensions) {
    return {
      widthEmu: maxWidthEmu,
      heightEmu: maxHeightEmu,
    };
  }

  const scale = Math.min(maxWidthEmu / dimensions.width, maxHeightEmu / dimensions.height);
  return {
    widthEmu: Math.max(1, Math.round(dimensions.width * scale)),
    heightEmu: Math.max(1, Math.round(dimensions.height * scale)),
  };
}

function escapeXmlAttribute(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getDocxImageExtension(mimeType = "") {
  const normalized = clean(mimeType).toLowerCase();
  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (normalized.includes("webp")) {
    return { extension: "webp", contentType: "image/webp" };
  }
  return { extension: "png", contentType: "image/png" };
}

function getDocxRelationshipsFileName(xmlFileName = "word/document.xml") {
  const safeName = clean(xmlFileName) || "word/document.xml";
  const slashIndex = safeName.lastIndexOf("/");
  const directory = slashIndex >= 0 ? safeName.slice(0, slashIndex) : "";
  const baseName = slashIndex >= 0 ? safeName.slice(slashIndex + 1) : safeName;
  return `${directory ? `${directory}/` : ""}_rels/${baseName}.rels`;
}

function getNextDocxRelationshipId(relationshipsXml = "") {
  const used = new Set();
  relationshipsXml.replace(/\bId=["']([^"']+)["']/g, (_match, id) => {
    used.add(String(id || ""));
    return _match;
  });

  let index = 1;
  while (used.has(`rId${index}`)) {
    index += 1;
  }
  return `rId${index}`;
}

function addDocxRelationship(zip, xmlFileName, {
  type = DOCX_IMAGE_REL_TYPE,
  target = "",
  targetMode = "",
} = {}) {
  if (!zip || !target) {
    return "";
  }

  const relFileName = getDocxRelationshipsFileName(xmlFileName);
  const relFile = zip.file(relFileName);
  let relationshipsXml = relFile
    ? relFile.asText()
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  const rId = getNextDocxRelationshipId(relationshipsXml);
  const relationshipXml = `<Relationship Id="${rId}" Type="${type}" Target="${escapeXmlAttribute(target)}"${targetMode ? ` TargetMode="${escapeXmlAttribute(targetMode)}"` : ""}/>`;

  if (/<\/Relationships>/i.test(relationshipsXml)) {
    relationshipsXml = relationshipsXml.replace(/<\/Relationships>/i, `${relationshipXml}</Relationships>`);
  } else {
    relationshipsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationshipXml}</Relationships>`;
  }

  zip.file(relFileName, relationshipsXml);
  return rId;
}

function ensureDocxContentTypeDefault(zip, extension = "png", contentType = "image/png") {
  const file = zip?.file("[Content_Types].xml");
  if (!file) {
    return;
  }

  const safeExtension = clean(extension).replace(/^\./, "").toLowerCase() || "png";
  let xml = file.asText();
  const defaultPattern = new RegExp(`<Default\\s+[^>]*Extension=["']${escapeRegex(safeExtension)}["']`, "i");
  if (defaultPattern.test(xml)) {
    return;
  }

  const defaultXml = `<Default Extension="${escapeXmlAttribute(safeExtension)}" ContentType="${escapeXmlAttribute(contentType)}"/>`;
  if (/<\/Types>/i.test(xml)) {
    xml = xml.replace(/<\/Types>/i, `${defaultXml}</Types>`);
    zip.file("[Content_Types].xml", xml);
  }
}

function ensureDocxDrawingNamespaces(xml = "") {
  if (!xml || !/<w:(document|hdr|ftr)\b/i.test(xml)) {
    return xml;
  }

  return xml.replace(/<w:(document|hdr|ftr)\b([^>]*)>/i, (match, tagName = "document", attrs = "") => {
    const additions = [];
    if (!/\sxmlns:r=/i.test(match)) {
      additions.push('xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"');
    }
    if (!/\sxmlns:wp=/i.test(match)) {
      additions.push('xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"');
    }
    if (!/\sxmlns:a=/i.test(match)) {
      additions.push('xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"');
    }
    if (!/\sxmlns:pic=/i.test(match)) {
      additions.push('xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"');
    }
    if (additions.length === 0) {
      return match;
    }
    return `<w:${tagName}${attrs} ${additions.join(" ")}>`;
  });
}

function getDocxSignatureImageData(item = {}) {
  const imageData = item?.signatureImageData;
  if (!imageData || !Buffer.isBuffer(imageData.buffer) || imageData.buffer.length === 0) {
    return null;
  }

  if (!/^image\/(png|jpe?g|webp)$/i.test(clean(imageData.mimeType))) {
    return null;
  }

  return imageData;
}

function addDocxSignatureImage(zip, xmlFileName, item = {}, context = {}) {
  const imageData = getDocxSignatureImageData(item);
  if (!imageData || !zip) {
    return null;
  }

  const { extension, contentType } = getDocxImageExtension(imageData.mimeType);
  context.imageCounter = (Number(context.imageCounter) || 0) + 1;
  context.docPrCounter = (Number(context.docPrCounter) || 1000) + 1;
  const mediaFileName = `safenexus-signature-${context.imageCounter}.${extension}`;
  const mediaPath = `word/media/${mediaFileName}`;

  zip.file(mediaPath, imageData.buffer);
  ensureDocxContentTypeDefault(zip, extension, contentType);

  const rId = addDocxRelationship(zip, xmlFileName, {
    target: `media/${mediaFileName}`,
  });

  if (!rId) {
    return null;
  }

  const fittedSize = fitImageDimensionsToEmuBox(
    getRasterImageDimensions(imageData.buffer, imageData.mimeType),
    DOCX_SIGNATURE_IMAGE_WIDTH_EMU,
    DOCX_SIGNATURE_IMAGE_HEIGHT_EMU,
  );

  return {
    rId,
    docPrId: context.docPrCounter,
    widthEmu: fittedSize.widthEmu,
    heightEmu: fittedSize.heightEmu,
  };
}

function buildWordSignatureImageXml(imageRef = null, item = {}) {
  if (!imageRef?.rId) {
    return "";
  }

  const safeName = escapeXmlAttribute(`Potpis ${clean(item.name) || "potpisnik"}`);
  const widthEmu = Math.max(1, Number(imageRef.widthEmu) || DOCX_SIGNATURE_IMAGE_WIDTH_EMU);
  const heightEmu = Math.max(1, Number(imageRef.heightEmu) || DOCX_SIGNATURE_IMAGE_HEIGHT_EMU);
  return `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="80" w:after="20"/>
      </w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="${Number(imageRef.docPrId) || 1001}" name="${safeName}"/>
            <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="${safeName}"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${escapeXmlAttribute(imageRef.rId)}"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${widthEmu}" cy="${heightEmu}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
  `.replace(/\n\s+/g, "");
}

function buildDocxSpecialPlaceholderXml(value, zip = null, context = {}, xmlFileName = "word/document.xml") {
  if (!value || typeof value !== "object") {
    return "";
  }

  if (value.type === "system_description") {
    return buildWordSystemDescriptionXml(value);
  }

  if (value.type === "signature_group") {
    return buildWordSignatureGroupXml(value.items, zip, context, xmlFileName);
  }

  if (value.type === "table") {
    return buildWordTableXml(value);
  }

  if (value.type === "optional_empty") {
    return "";
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
  const renderContext = {
    imageCounter: 0,
    docPrCounter: 1000,
  };

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

      const replacementXml = buildDocxSpecialPlaceholderXml(value, zip, renderContext, fileName);
      if (!replacementXml) {
        const nextXml = removeDocxOptionalPlaceholderBlock(xml, sentinel);
        if (nextXml !== xml) {
          xml = nextXml;
          changed = true;
        }
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
      xml = ensureDocxDrawingNamespaces(xml);
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

function shouldRetryDocxRenderWithEscapedDelimiters(error) {
  const message = [
    error?.message,
    ...(Array.isArray(error?.properties?.errors)
      ? error.properties.errors.map((entry) => entry?.message || entry?.properties?.explanation || "")
      : []),
  ].join(" ");

  return /unopened/i.test(message) && /\}\}/.test(message);
}

function escapeStrayDocxClosingDelimiters(xml = "") {
  const source = String(xml ?? "");
  let result = "";
  let depth = 0;

  for (let index = 0; index < source.length;) {
    if (source.startsWith("{{", index)) {
      depth += 1;
      result += "{{";
      index += 2;
      continue;
    }

    if (source.startsWith("}}", index)) {
      if (depth > 0) {
        depth -= 1;
        result += "}}";
      } else {
        result += "&#125;&#125;";
      }
      index += 2;
      continue;
    }

    result += source[index];
    index += 1;
  }

  return result;
}

function createDocxZipWithEscapedStrayDelimiters(templateBuffer) {
  const zip = new PizZip(templateBuffer);

  Object.keys(zip.files)
    .filter((name) => /^word\/.+\.xml$/i.test(name))
    .forEach((name) => {
      const file = zip.files[name];
      if (!file || file.dir) {
        return;
      }

      const content = file.asText();
      const nextContent = escapeStrayDocxClosingDelimiters(content);
      if (nextContent !== content) {
        zip.file(name, nextContent);
      }
    });

  return zip;
}

function renderDocxTemplateZip(zip, normalizedPlaceholders = {}, specialPlaceholders = new Map(), options = {}) {
  const delimiters = options.delimiters ?? {
    start: "{{",
    end: "}}",
  };
  const nullGetter = typeof options.nullGetter === "function"
    ? options.nullGetter
    : () => "";
  const doc = new Docxtemplater(zip, {
    delimiters,
    paragraphLoop: true,
    linebreaks: true,
    nullGetter,
  });

  doc.render(normalizedPlaceholders);
  applyDocxSpecialPlaceholders(doc.getZip(), specialPlaceholders);
  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}

async function resolveDocxImageData(source = "") {
  const safeSource = clean(source);
  if (!safeSource || /^data:image\/svg/i.test(safeSource)) {
    return null;
  }

  try {
    if (safeSource.startsWith("data:")) {
      const parsed = parseDataUrl(safeSource);
      return /^image\/(png|jpe?g|webp)$/i.test(parsed.mimeType) ? parsed : null;
    }

    if (/^https?:\/\//i.test(safeSource)) {
      const parsed = await fetchBinaryFromUrl(safeSource);
      return /^image\/(png|jpe?g|webp)$/i.test(parsed.mimeType) ? parsed : null;
    }
  } catch {
    return null;
  }

  return null;
}

async function hydrateDocxSpecialPlaceholderImages(specialPlaceholders = new Map()) {
  if (!(specialPlaceholders instanceof Map) || specialPlaceholders.size === 0) {
    return;
  }

  const imageCache = new Map();
  const pending = [];

  specialPlaceholders.forEach((value) => {
    if (!value || value.type !== "signature_group" || !Array.isArray(value.items)) {
      return;
    }

    value.items.forEach((item) => {
      const source = clean(item?.signatureImageUrl || item?.signatureDataUrl);
      if (!source || item.signatureMode !== "scan") {
        return;
      }

      pending.push((async () => {
        if (!imageCache.has(source)) {
          imageCache.set(source, await resolveDocxImageData(source));
        }
        const resolved = imageCache.get(source);
        if (resolved) {
          item.signatureImageData = resolved;
        }
      })());
    });
  });

  await Promise.all(pending);
}

export async function buildDocxFromTemplateBuffer(templateBuffer, placeholders = {}, options = {}) {
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
          if (
            specialValue.type === "table"
            || specialValue.type === "system_description"
            || specialValue.type === "signature_group"
            || specialValue.type === "optional_empty"
          ) {
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

  await hydrateDocxSpecialPlaceholderImages(specialPlaceholders);

  const renderWithCurlyDelimiters = (sourceBuffer) => renderDocxTemplateZip(
    new PizZip(sourceBuffer),
    normalizedPlaceholders,
    specialPlaceholders,
  );
  const renderWithSquareBracketDelimiters = (sourceBuffer) => renderDocxTemplateZip(
    new PizZip(sourceBuffer),
    normalizedPlaceholders,
    new Map(),
    {
      delimiters: {
        start: "[",
        end: "]",
      },
      nullGetter(part = {}) {
        const value = clean(part.value ?? part.raw);
        return value ? `[${value}]` : "";
      },
    },
  );

  try {
    const renderedBuffer = renderWithCurlyDelimiters(safeBuffer);
    return options.squareBracketPlaceholders
      ? renderWithSquareBracketDelimiters(renderedBuffer)
      : renderedBuffer;
  } catch (error) {
    if (shouldRetryDocxRenderWithEscapedDelimiters(error)) {
      try {
        const renderedBuffer = renderDocxTemplateZip(
          createDocxZipWithEscapedStrayDelimiters(safeBuffer),
          normalizedPlaceholders,
          specialPlaceholders,
        );
        return options.squareBracketPlaceholders
          ? renderWithSquareBracketDelimiters(renderedBuffer)
          : renderedBuffer;
      } catch (retryError) {
        throw new Error(formatDocxRenderError(retryError));
      }
    }

    throw new Error(formatDocxRenderError(error));
  }
}

export async function convertDocxBufferToPdfBuffer(docxBuffer, {
  fileName = "zapisnik.docx",
} = {}) {
  const [pdfBuffer] = await convertDocxBuffersToPdfBuffers([{ buffer: docxBuffer, fileName }]);
  return pdfBuffer;
}

function makeUniqueSofficeInputFileName(fileName = "", index = 0, usedNames = new Set()) {
  const fallback = `zapisnik-${index + 1}`;
  const sanitized = sanitizeGeneratedDocumentFileName(fileName || fallback, {
    fallback,
    extension: "docx",
  });
  const baseName = sanitizeFileBaseName(sanitized.replace(/\.(docx|dotx)$/i, ""), fallback);
  let candidate = `${baseName}.docx`;
  let suffix = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${baseName}-${suffix}.docx`;
    suffix += 1;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
}

async function resolveConvertedPdfPath(tempRoot = "", inputBaseName = "", generatedPdfEntries = []) {
  const expectedPdfPath = join(
    tempRoot,
    sanitizeGeneratedDocumentFileName(inputBaseName.replace(/\.(docx|dotx)$/i, ""), {
      fallback: "zapisnik",
      extension: "pdf",
    }),
  );

  if (await fileExists(expectedPdfPath)) {
    return expectedPdfPath;
  }

  const expectedBaseName = sanitizeFileBaseName(inputBaseName.replace(/\.(docx|dotx)$/i, ""), "")
    .toLowerCase();
  return generatedPdfEntries.find((candidatePath) => (
    sanitizeFileBaseName(basename(candidatePath, extname(candidatePath)), "").toLowerCase() === expectedBaseName
  )) || generatedPdfEntries.find((candidatePath) => (
    sanitizeFileBaseName(basename(candidatePath, extname(candidatePath)), "").toLowerCase().includes(expectedBaseName)
  )) || "";
}

export async function convertDocxBuffersToPdfBuffers(items = []) {
  const sourceItems = (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      buffer: Buffer.isBuffer(item?.buffer) ? item.buffer : Buffer.from(item?.buffer ?? []),
      fileName: item?.fileName || `zapisnik-${index + 1}.docx`,
    }))
    .filter((item) => item.buffer.length > 0);

  if (sourceItems.length === 0) {
    throw new Error("Nema Word dokumenata za PDF konverziju.");
  }

  const orderedItems = sourceItems.map((item) => ({
    ...item,
    cacheKey: buildSofficePdfCacheKey(item),
  }));
  const orderedPdfBuffers = new Array(orderedItems.length).fill(null);
  const uncachedItems = [];

  orderedItems.forEach((item, index) => {
    const cachedPdfBuffer = getCachedSofficePdfBuffer(item.cacheKey);
    if (cachedPdfBuffer) {
      orderedPdfBuffers[index] = cachedPdfBuffer;
      return;
    }

    uncachedItems.push({
      ...item,
      sourceIndex: index,
    });
  });

  if (uncachedItems.length === 0) {
    return orderedPdfBuffers;
  }

  const sofficeCommand = await resolveSofficeCommandCached();
  if (!sofficeCommand) {
    throw new Error("LibreOffice nije dostupan na serveru za Word -> PDF konverziju.");
  }

  return await enqueueSofficeConversion(async () => {
    const stillUncachedItems = [];
    uncachedItems.forEach((item) => {
      const cachedPdfBuffer = getCachedSofficePdfBuffer(item.cacheKey);
      if (cachedPdfBuffer) {
        orderedPdfBuffers[item.sourceIndex] = cachedPdfBuffer;
        return;
      }
      stillUncachedItems.push(item);
    });

    if (stillUncachedItems.length === 0) {
      return orderedPdfBuffers;
    }

    const tempRoot = await mkdtemp(join(tmpdir(), "taskflow-docx-"));
    const officeProfileDir = await getSharedSofficeProfileDir();
    const usedNames = new Set();
    const preparedItems = stillUncachedItems.map((item, index) => {
      const inputBaseName = makeUniqueSofficeInputFileName(item.fileName, index, usedNames);
      const outputBaseName = sanitizeGeneratedDocumentFileName(inputBaseName.replace(/\.(docx|dotx)$/i, ""), {
        fallback: `zapisnik-${index + 1}`,
        extension: "pdf",
      });
      return {
        ...item,
        inputBaseName,
        inputPath: join(tempRoot, inputBaseName),
        outputPath: join(tempRoot, outputBaseName),
      };
    });

    try {
      await Promise.all(preparedItems.map((item) => writeFile(item.inputPath, item.buffer)));
      let pdfBuffers = null;

      try {
        pdfBuffers = await tryConvertPreparedDocxItemsWithWarmSoffice(preparedItems, tempRoot);
      } catch (unoError) {
        console.warn("Warm LibreOffice UNO conversion failed, falling back to CLI convert-to.", unoError);
      }

      if (!pdfBuffers) {
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
          ...preparedItems.map((item) => item.inputPath),
        ], {
          cwd: tempRoot,
          env: buildSofficeRuntimeEnv(tempRoot),
          timeoutMs: SOFFICE_CONVERSION_TIMEOUT_MS,
        });
        const generatedPdfEntries = (await readdir(tempRoot, { withFileTypes: true }))
          .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".pdf")
          .map((entry) => join(tempRoot, entry.name));
        pdfBuffers = [];

        for (const item of preparedItems) {
          const resolvedOutputPath = await resolveConvertedPdfPath(
            tempRoot,
            item.inputBaseName,
            generatedPdfEntries,
          );

          if (!resolvedOutputPath || !await fileExists(resolvedOutputPath)) {
            const directoryEntries = await readdir(tempRoot).catch(() => []);
            const details = [
              "LibreOffice nije vratio PDF datoteku.",
              clean(commandResult.stdout) ? `STDOUT: ${clean(commandResult.stdout)}` : "",
              clean(commandResult.stderr) ? `STDERR: ${clean(commandResult.stderr)}` : "",
              directoryEntries.length > 0 ? `Sadrzaj temp direktorija: ${directoryEntries.join(", ")}` : "",
            ].filter(Boolean).join(" ");
            throw new Error(details || "LibreOffice nije vratio PDF datoteku.");
          }

          pdfBuffers.push(await readFile(resolvedOutputPath));
        }
      }

      pdfBuffers.forEach((pdfBuffer, index) => {
        const item = preparedItems[index];
        if (!item) {
          return;
        }
        cacheSofficePdfBuffer(item.cacheKey, pdfBuffer);
        orderedPdfBuffers[item.sourceIndex] = Buffer.from(pdfBuffer);
      });

      return orderedPdfBuffers;
    } finally {
      await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
    }
  });
}

export async function buildPdfFromTemplateBuffer(templateBuffer, placeholders = {}, options = {}) {
  const generatedWord = await buildDocxFromTemplateBuffer(templateBuffer, placeholders, options);
  try {
    return await convertDocxBufferToPdfBuffer(generatedWord, options);
  } catch (error) {
    console.warn("Word -> PDF conversion failed, using HTML PDF fallback.", error);
    const converted = await convertWordBufferToHtmlTemplate(generatedWord, {
      fileName: options.fileName || "zapisnik.docx",
    });
    const htmlBuffer = Buffer.from(converted.html || "", "utf8");
    return await buildPdfFromHtmlTemplateBuffer(htmlBuffer, {}, {
      ...options,
      fileName: sanitizeGeneratedDocumentFileName(
        options.fileName || options.title || "zapisnik",
        { fallback: "zapisnik", extension: "html" },
      ),
      title: options.title || options.fileName || "Zapisnik",
    });
  }
}

function escapeTemplateHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTemplateHtmlText(value = "", fallback = "") {
  const text = String(value ?? "").replace(/\r\n/g, "\n");
  return clean(text) ? escapeTemplateHtml(text).replace(/\n/g, "<br>") : fallback;
}

function buildHtmlTemplateDefaultStyles() {
  return `
    <style data-safe-nexus-template-style>
      .safe-nexus-template-body{font-family:Arial,sans-serif;color:#1f2937;line-height:1.45}
      .safe-nexus-template-table{width:100%;border-collapse:collapse;margin:12px 0 18px;table-layout:fixed}
      .safe-nexus-template-table th,
      .safe-nexus-template-table td{border:1px solid #cad8d1;padding:7px 9px;text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere}
      .safe-nexus-template-table th{background:#eef5f2;font-weight:700}
      .safe-nexus-template-signatures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px;margin:24px 0 8px}
      .safe-nexus-template-signature{min-height:116px;text-align:center}
      .safe-nexus-template-signature strong{display:block;margin-top:3px}
      .safe-nexus-template-signature small{display:block;color:#667085;margin-top:2px}
      .safe-nexus-template-signature-image{display:block;max-width:190px;max-height:52px;margin:14px auto 4px;object-fit:contain}
      .safe-nexus-template-signature-line{border-top:1px solid #95aea3;margin:10px auto 0;max-width:220px;height:1px;color:#667085;font-size:0}
      .safe-nexus-template-system-block{margin:14px 0 20px}
      .safe-nexus-template-system-block h3{margin:0 0 8px;padding:7px 9px;background:#e5e7eb;color:#111827;font-size:15px;text-transform:uppercase}
      .safe-nexus-template-system-block p{margin:6px 0}
      .safe-nexus-template-system-row{margin:8px 0;text-align:center}
      .safe-nexus-template-system-row strong{font-weight:700}
      @media print{.safe-nexus-template-signatures{break-inside:avoid}.safe-nexus-template-system-block,.safe-nexus-template-table{break-inside:auto}}
    </style>
  `.trim();
}

function injectHtmlTemplateDefaultStyles(html = "") {
  const source = String(html ?? "");
  const styles = buildHtmlTemplateDefaultStyles();
  if (/<style\b[^>]*data-safe-nexus-template-style/i.test(source)) {
    return source;
  }

  if (/<\/head>/i.test(source)) {
    return source.replace(/<\/head>/i, `${styles}\n</head>`);
  }

  return `${styles}\n${source}`;
}

function getHtmlTemplateCellAlign(format = {}) {
  const explicitAlign = clean(format.align).toLowerCase();
  if (["left", "center", "right"].includes(explicitAlign)) {
    return explicitAlign;
  }
  return ["number", "integer", "percent"].includes(clean(format.type).toLowerCase()) ? "right" : "left";
}

function buildHtmlTemplateCellStyle(format = {}, { header = false } = {}) {
  const styles = [`text-align:${getHtmlTemplateCellAlign(format)}`];
  const fontSize = Number(format.fontSize);
  if (Number.isFinite(fontSize)) {
    styles.push(`font-size:${Math.max(9, Math.min(40, fontSize))}px`);
  }
  if (format.bold || header) {
    styles.push("font-weight:700");
  }
  if (format.italic) {
    styles.push("font-style:italic");
  }
  if (format.underline) {
    styles.push("text-decoration:underline");
  }
  if (/^#[0-9a-f]{6}$/i.test(clean(format.fillColor))) {
    styles.push(`background:${clean(format.fillColor)}`);
  }
  const fontFamily = clean(format.fontFamily);
  if (fontFamily && fontFamily !== "default") {
    styles.push(`font-family:${escapeTemplateHtml(fontFamily)}, Arial, sans-serif`);
  }
  return styles.join(";");
}

function buildHtmlTemplateTablePlaceholder(table = {}) {
  const columns = Array.isArray(table.columns) ? table.columns : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  if (columns.length === 0 || rows.length === 0) {
    return "";
  }

  const rowIndexById = new Map(rows.map((row, rowIndex) => [clean(row.id), rowIndex]));
  const columnIndexById = new Map(columns.map((column, columnIndex) => [clean(column.id), columnIndex]));
  const headerRowSet = new Set(
    (Array.isArray(table.headerRows) ? table.headerRows : [])
      .map((entry) => clean(entry))
      .filter(Boolean),
  );
  rows.forEach((row) => {
    if (row?.header) {
      headerRowSet.add(clean(row.id));
    }
  });

  const mergeAnchors = new Map();
  const skipCells = new Set();
  (Array.isArray(table.merges) ? table.merges : []).forEach((merge) => {
    const rowIndex = rowIndexById.get(clean(merge?.rowId));
    const columnIndex = columnIndexById.get(clean(merge?.columnId));
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
        skipCells.add(`${currentRow}:${currentColumn}`);
      }
    }
  });

  const colgroup = columns.map((column) => (
    `<col style="width:${Math.max(MEASUREMENT_COLUMN_MIN_WIDTH, Number(column.width) || 140)}px">`
  )).join("");
  const rowHtml = rows.map((row, rowIndex) => {
    const isHeader = headerRowSet.has(clean(row.id));
    const tagName = isHeader ? "th" : "td";
    const cells = Array.isArray(row.cells) ? row.cells : [];
    const cellHtml = [];

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const cellKey = `${rowIndex}:${columnIndex}`;
      if (skipCells.has(cellKey)) {
        continue;
      }

      const rawCell = cells[columnIndex] && typeof cells[columnIndex] === "object"
        ? cells[columnIndex]
        : { text: String(cells[columnIndex] ?? ""), format: {} };
      const mergeAnchor = mergeAnchors.get(cellKey);
      const style = buildHtmlTemplateCellStyle(rawCell.format ?? {}, { header: isHeader });
      const attributes = [
        mergeAnchor?.rowSpan > 1 ? `rowspan="${mergeAnchor.rowSpan}"` : "",
        mergeAnchor?.colSpan > 1 ? `colspan="${mergeAnchor.colSpan}"` : "",
        style ? `style="${style}"` : "",
      ].filter(Boolean).join(" ");
      cellHtml.push(`<${tagName}${attributes ? ` ${attributes}` : ""}>${formatTemplateHtmlText(rawCell.text || "")}</${tagName}>`);
    }

    return `<tr>${cellHtml.join("")}</tr>`;
  }).join("");

  return `<table class="safe-nexus-template-table">${colgroup ? `<colgroup>${colgroup}</colgroup>` : ""}<tbody>${rowHtml}</tbody></table>`;
}

function buildHtmlTemplateSignatureGroupPlaceholder(items = []) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) {
    return `<p style="text-align:right;color:#667085"><em>Nema odabranih osoba.</em></p>`;
  }

  const itemHtml = safeItems.map((item) => {
    const isScanSignature = clean(item.signatureMode).toLowerCase() !== "digital";
    const metaLines = (Array.isArray(item.metaLines) ? item.metaLines : [])
      .map((line) => clean(line))
      .filter(Boolean)
      .map((line) => `<small>${escapeTemplateHtml(line)}</small>`)
      .join("");
    const signatureImageUrl = clean(item.signatureImageUrl || item.signatureDataUrl);
    const signatureImage = signatureImageUrl && isScanSignature
      ? `<img class="safe-nexus-template-signature-image" src="${escapeTemplateHtml(signatureImageUrl)}" alt="Potpis ${escapeTemplateHtml(clean(item.name) || "potpisnik")}">`
      : "";
    return `
      <section class="safe-nexus-template-signature">
        <span>${escapeTemplateHtml(clean(item.role) || "Osoba")}</span>
        <strong>${escapeTemplateHtml(clean(item.name) || "Potpisnik")}</strong>
        ${metaLines}
        ${signatureImage}
        <div class="safe-nexus-template-signature-line"></div>
      </section>
    `.trim();
  }).join("");

  return `<div class="safe-nexus-template-signatures">${itemHtml}</div>`;
}

function buildHtmlTemplateSystemDescriptionPlaceholder(value = {}) {
  const blocks = Array.isArray(value.blocks) ? value.blocks : [];
  if (blocks.length === 0) {
    return "";
  }

  return blocks.map((block) => {
    const rows = Array.isArray(block?.rows) ? block.rows : [];
    const rowsHtml = rows.length > 0
      ? rows.map((row) => {
        const subtitle = clean(row?.subtitle);
        const description = formatTemplateHtmlText(row?.description || "");
        return `
          <p class="safe-nexus-template-system-row">
            ${subtitle ? `<strong>${escapeTemplateHtml(`${subtitle}: `)}</strong>` : ""}
            <span>${description}</span>
          </p>
        `.trim();
      }).join("")
      : "<p>&nbsp;</p>";

    return `
      <section class="safe-nexus-template-system-block">
        <h3>${escapeTemplateHtml(clean(block?.title) || "Opis sustava")}</h3>
        ${clean(block?.subtitle) ? `<p><em>${escapeTemplateHtml(block.subtitle)}</em></p>` : ""}
        ${rowsHtml}
      </section>
    `.trim();
  }).join("");
}

function buildHtmlTemplateSpecialPlaceholder(value) {
  const specialValue = normalizeDocxSpecialPlaceholderValue(value);
  if (!specialValue) {
    return null;
  }

  if (specialValue.type === "optional_empty") {
    return "";
  }
  if (specialValue.type === "table") {
    return buildHtmlTemplateTablePlaceholder(specialValue);
  }
  if (specialValue.type === "signature_group") {
    return buildHtmlTemplateSignatureGroupPlaceholder(specialValue.items);
  }
  if (specialValue.type === "system_description") {
    return buildHtmlTemplateSystemDescriptionPlaceholder(specialValue);
  }

  return "";
}

function buildHtmlTemplateDocument(html = "", { title = "Zapisnik" } = {}) {
  const safeHtml = ensureHtmlUtf8Meta(injectHtmlTemplateDefaultStyles(repairHtmlTextEncoding(String(html ?? "").trim())));
  if (/<!doctype\s+html|<html[\s>]/i.test(safeHtml)) {
    return safeHtml;
  }

  return `<!doctype html>
<html lang="hr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeTemplateHtml(title || "Zapisnik")}</title>
</head>
<body class="safe-nexus-template-body">
${safeHtml}
</body>
</html>`;
}

function detectHtmlBufferCharset(buffer = Buffer.alloc(0)) {
  const head = Buffer.isBuffer(buffer)
    ? buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1")
    : "";
  const charset = clean(
    head.match(/<meta\b[^>]*charset\s*=\s*["']?\s*([A-Za-z0-9._-]+)/i)?.[1]
    || head.match(/charset\s*=\s*([A-Za-z0-9._-]+)/i)?.[1]
    || "utf-8",
  ).toLowerCase();
  return charset.replace(/^utf8$/, "utf-8");
}

function decodeHtmlBuffer(buffer = Buffer.alloc(0)) {
  const safeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer ?? []);
  const charset = detectHtmlBufferCharset(safeBuffer);
  try {
    let decoded = new TextDecoder(charset).decode(safeBuffer);
    if (charset !== "utf-8") {
      const utf8Decoded = new TextDecoder("utf-8").decode(safeBuffer);
      if (getHtmlTextEncodingSuspicionScore(utf8Decoded) < getHtmlTextEncodingSuspicionScore(decoded)) {
        decoded = utf8Decoded;
      }
    }
    return ensureHtmlUtf8Meta(decoded);
  } catch {
    return ensureHtmlUtf8Meta(safeBuffer.toString("utf8"));
  }
}

function getMimeTypeForPath(filePath = "") {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".gif") return "image/gif";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".webp") return "image/webp";
  if (extension === ".bmp") return "image/bmp";
  return "application/octet-stream";
}

async function replaceAsync(source = "", pattern, replacer) {
  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  for (const match of String(source ?? "").matchAll(regex)) {
    parts.push(String(source ?? "").slice(lastIndex, match.index));
    parts.push(await replacer(...match));
    lastIndex = Number(match.index) + match[0].length;
  }
  parts.push(String(source ?? "").slice(lastIndex));
  return parts.join("");
}

function resolveLibreOfficeHtmlAssetPath(rawSource = "", htmlPath = "", tempRoot = "") {
  const source = clean(rawSource).replace(/&amp;/g, "&");
  if (!source || /^(data:|https?:|mailto:|#)/i.test(source)) {
    return "";
  }

  let normalizedSource = source.split(/[?#]/)[0];
  if (/^file:/i.test(normalizedSource)) {
    try {
      normalizedSource = fileURLToPath(normalizedSource);
    } catch {
      normalizedSource = normalizedSource.replace(/^file:\/+/i, "");
    }
  }

  try {
    normalizedSource = decodeURIComponent(normalizedSource);
  } catch {
    // Keep the original value when LibreOffice writes a non URI-encoded file name.
  }

  const resolvedPath = resolve(dirname(htmlPath), normalizedSource);
  const safeRoot = resolve(tempRoot);
  if (resolvedPath !== safeRoot && !resolvedPath.startsWith(`${safeRoot}${sep}`)) {
    return "";
  }
  return resolvedPath;
}

async function inlineLibreOfficeHtmlAssets(html = "", htmlPath = "", tempRoot = "") {
  let inlinedHtml = await replaceAsync(
    html,
    /(<(?:img|image)\b[^>]*\bsrc\s*=\s*)(["'])([^"']+)\2/gi,
    async (match, prefix, quote, source) => {
      const assetPath = resolveLibreOfficeHtmlAssetPath(source, htmlPath, tempRoot);
      if (!assetPath || !await fileExists(assetPath)) {
        return match;
      }
      const assetBuffer = await readFile(assetPath);
      return `${prefix}${quote}data:${getMimeTypeForPath(assetPath)};base64,${assetBuffer.toString("base64")}${quote}`;
    },
  );

  inlinedHtml = await replaceAsync(
    inlinedHtml,
    /url\((["']?)(?!data:|https?:|#)([^"')]+)\1\)/gi,
    async (match, quote, source) => {
      const assetPath = resolveLibreOfficeHtmlAssetPath(source, htmlPath, tempRoot);
      if (!assetPath || !await fileExists(assetPath)) {
        return match;
      }
      const assetBuffer = await readFile(assetPath);
      return `url(${quote}data:${getMimeTypeForPath(assetPath)};base64,${assetBuffer.toString("base64")}${quote})`;
    },
  );

  return inlinedHtml;
}

function normalizeLegacyHtmlCssColor(value = "") {
  const raw = clean(value).replace(/^["']|["']$/g, "");
  if (!raw) {
    return "";
  }
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) {
    return raw;
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) {
    return `#${raw}`;
  }
  if (/^[a-z]+$/i.test(raw)) {
    return raw;
  }
  return "";
}

function normalizeLegacyHtmlCssLength(value = "") {
  const raw = clean(value).replace(/^["']|["']$/g, "");
  if (!raw) {
    return "";
  }
  if (/^-?\d+(?:\.\d+)?%$/.test(raw)) {
    return raw;
  }
  if (/^-?\d+(?:\.\d+)?(?:px|pt|cm|mm|in|em|rem|vw|vh)$/i.test(raw)) {
    return raw;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
    return `${raw}px`;
  }
  return "";
}

function getHtmlAttribute(tag = "", name = "") {
  const safeName = String(name || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag || "").match(new RegExp(`\\b${safeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return clean(match?.[1] || match?.[2] || match?.[3] || "");
}

function mergeStyleIntoHtmlTag(tag = "", styles = []) {
  const cleanStyles = mergeCssLists(styles);
  if (cleanStyles.length === 0 || /^<\//.test(tag) || /\/>$/.test(tag)) {
    return tag;
  }
  const styleAttribute = getHtmlAttribute(tag, "style");
  const merged = mergeCssLists(styleAttribute.split(";"), cleanStyles).join(";");
  if (!merged) {
    return tag;
  }
  if (/\bstyle\s*=/i.test(tag)) {
    return tag.replace(/\bstyle\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, `style="${escapeTemplateHtml(merged)}"`);
  }
  return tag.replace(/>$/, ` style="${escapeTemplateHtml(merged)}">`);
}

function polishLibreOfficeConvertedHtml(html = "") {
  return String(html || "")
    .replace(/<\s*font\b([^>]*)>/gi, (match, attributes = "") => {
      const styles = [];
      const color = normalizeLegacyHtmlCssColor(getHtmlAttribute(attributes, "color"));
      const face = clean(getHtmlAttribute(attributes, "face"));
      const size = Number.parseInt(getHtmlAttribute(attributes, "size"), 10);
      if (color) styles.push(`color:${color}`);
      if (face) styles.push(`font-family:${face}, Arial, sans-serif`);
      if (Number.isFinite(size)) styles.push(`font-size:${Math.max(8, Math.min(30, 6 + size * 2))}pt`);
      return `<span${cssListToStyleAttribute(styles)}>`;
    })
    .replace(/<\/\s*font\s*>/gi, "</span>")
    .replace(/<(table|thead|tbody|tr|td|th|p|div|span|body)\b[^>]*>/gi, (tag, tagName) => {
      const styles = [];
      const align = clean(getHtmlAttribute(tag, "align")).toLowerCase();
      const vAlign = clean(getHtmlAttribute(tag, "valign")).toLowerCase();
      const bgcolor = normalizeLegacyHtmlCssColor(getHtmlAttribute(tag, "bgcolor"));
      const color = normalizeLegacyHtmlCssColor(getHtmlAttribute(tag, "color") || getHtmlAttribute(tag, "text"));
      const width = normalizeLegacyHtmlCssLength(getHtmlAttribute(tag, "width"));
      const height = normalizeLegacyHtmlCssLength(getHtmlAttribute(tag, "height"));
      const border = Number.parseFloat(getHtmlAttribute(tag, "border"));
      const cellSpacing = normalizeLegacyHtmlCssLength(getHtmlAttribute(tag, "cellspacing"));
      const cellPadding = normalizeLegacyHtmlCssLength(getHtmlAttribute(tag, "cellpadding"));
      if (["left", "center", "right", "justify"].includes(align)) {
        if (tagName.toLowerCase() === "table" && align === "center") styles.push("margin-left:auto;margin-right:auto");
        else if (tagName.toLowerCase() === "table" && align === "right") styles.push("margin-left:auto;margin-right:0");
        else styles.push(`text-align:${align}`);
      }
      if (["top", "middle", "bottom", "baseline"].includes(vAlign)) styles.push(`vertical-align:${vAlign}`);
      if (bgcolor) styles.push(`background-color:${bgcolor}`);
      if (color) styles.push(`color:${color}`);
      if (width) styles.push(`width:${width}`);
      if (height) styles.push(`height:${height}`);
      if (Number.isFinite(border) && border > 0 && ["table", "td", "th"].includes(tagName.toLowerCase())) styles.push(`border:${Math.max(1, border)}px solid #111827`);
      if (cellSpacing && tagName.toLowerCase() === "table") styles.push(`border-spacing:${cellSpacing}`);
      if (cellPadding && ["td", "th"].includes(tagName.toLowerCase())) styles.push(`padding:${cellPadding}`);
      return mergeStyleIntoHtmlTag(tag, styles);
    });
}

function decodeBasicHtmlEntities(value = "") {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (match, code) => {
      const valueCode = Number.parseInt(code, 10);
      return Number.isFinite(valueCode) ? String.fromCodePoint(valueCode) : match;
    });
}

function normalizeConvertedWordPlaceholders(html = "") {
  return String(html ?? "").replace(/\{\{[\s\S]{0,240}?\}\}/g, (match) => {
    const token = decodeBasicHtmlEntities(match.replace(/<[^>]*>/g, ""))
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, "");
    return /^\{\{[A-Za-z0-9_]+\}\}$/.test(token) ? token : match;
  });
}

function getXmlAttribute(tag = "", name = "") {
  const safeName = String(name || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag || "").match(new RegExp(`\\b${safeName}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? decodeBasicHtmlEntities(match[2]) : "";
}

function getFirstXmlElement(xml = "", tagName = "") {
  const safeTagName = String(tagName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(xml || "").match(new RegExp(`<${safeTagName}\\b[\\s\\S]*?<\\/${safeTagName}>`, "i"));
  return match?.[0] || "";
}

function getFirstXmlEmptyOrElement(xml = "", tagName = "") {
  const safeTagName = String(tagName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(xml || "").match(new RegExp(`<${safeTagName}\\b[^>]*(?:\\/>|>[\\s\\S]*?<\\/${safeTagName}>)`, "i"));
  return match?.[0] || "";
}

function getXmlElements(xml = "", tagName = "") {
  const safeTagName = String(tagName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Array.from(String(xml || "").matchAll(new RegExp(`<${safeTagName}\\b[\\s\\S]*?<\\/${safeTagName}>`, "gi")))
    .map((match) => match[0]);
}

function getXmlEmptyOrElements(xml = "", tagName = "") {
  const safeTagName = String(tagName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Array.from(String(xml || "").matchAll(new RegExp(`<${safeTagName}\\b[^>]*(?:\\/>|>[\\s\\S]*?<\\/${safeTagName}>)`, "gi")))
    .map((match) => match[0]);
}

function getXmlVal(element = "", fallback = "") {
  return clean(getXmlAttribute(element, "w:val") || getXmlAttribute(element, "val") || fallback);
}

function hasXmlElement(xml = "", tagName = "") {
  const safeTagName = String(tagName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`<${safeTagName}\\b`, "i").test(String(xml || ""));
}

function isDocxOnOff(element = "") {
  if (!element) {
    return false;
  }
  const value = getXmlVal(element, "true").toLowerCase();
  return !["false", "0", "off", "none"].includes(value);
}

function twipsToPt(value, fallback = null) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric / 20 : fallback;
}

function halfPointsToPt(value, fallback = null) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric / 2 : fallback;
}

function eighthPointsToPt(value, fallback = null) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric / 8 : fallback;
}

function cssLengthPt(value, fallback = "") {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.max(0, Math.round(numeric * 100) / 100)}pt` : fallback;
}

function cssSignedLengthPt(value, fallback = "") {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric * 100) / 100}pt` : fallback;
}

function emuToPt(value, fallback = null) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric / 12700 : fallback;
}

function normalizeDocxHexColor(value = "") {
  const raw = clean(value).replace(/^#/, "");
  if (!raw || raw.toLowerCase() === "auto") {
    return "";
  }
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split("").map((entry) => `${entry}${entry}`).join("").toUpperCase()}`;
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }
  return "";
}

function resolveDocxThemeColor(element = "", themeColors = {}) {
  const direct = normalizeDocxHexColor(getXmlAttribute(element, "w:color") || getXmlAttribute(element, "w:fill") || getXmlAttribute(element, "w:val"));
  if (direct) {
    return direct;
  }
  const themeName = clean(
    getXmlAttribute(element, "w:themeColor")
    || getXmlAttribute(element, "w:themeFill")
    || getXmlAttribute(element, "themeColor")
    || getXmlAttribute(element, "themeFill"),
  );
  if (themeName && themeColors[themeName]) {
    return themeColors[themeName];
  }
  return "";
}

function parseDocxThemeColors(themeXml = "") {
  const colors = {};
  const aliases = {
    dk1: "dark1",
    lt1: "light1",
    dk2: "dark2",
    lt2: "light2",
    accent1: "accent1",
    accent2: "accent2",
    accent3: "accent3",
    accent4: "accent4",
    accent5: "accent5",
    accent6: "accent6",
    hlink: "hyperlink",
    folHlink: "followedHyperlink",
  };
  Object.entries(aliases).forEach(([xmlName, key]) => {
    const element = getFirstXmlElement(themeXml, `a:${xmlName}`);
    const raw = getXmlAttribute(element, "val") || getXmlAttribute(element, "lastClr");
    const color = normalizeDocxHexColor(raw);
    if (color) {
      colors[key] = color;
      colors[xmlName] = color;
    }
  });
  return colors;
}

async function readDocxZipText(zip, path = "") {
  const file = zip?.file(path);
  return file ? await file.async("string") : "";
}

async function extractWordDocumentMetadataFromZip(zip) {
  const [documentXml, themeXml, stylesXml] = await Promise.all([
    readDocxZipText(zip, "word/document.xml"),
    readDocxZipText(zip, "word/theme/theme1.xml"),
    readDocxZipText(zip, "word/styles.xml"),
  ]);
  const themeColors = parseDocxThemeColors(themeXml);
  const sectPr = getFirstXmlElement(documentXml, "w:sectPr");
  const pgSz = getFirstXmlEmptyOrElement(sectPr, "w:pgSz");
  const pgMar = getFirstXmlEmptyOrElement(sectPr, "w:pgMar");
  const docDefaults = getFirstXmlElement(stylesXml, "w:docDefaults");
  const defaultRPr = getFirstXmlElement(docDefaults, "w:rPrDefault");
  const defaultPPr = getFirstXmlElement(docDefaults, "w:pPrDefault");
  const rFonts = getFirstXmlEmptyOrElement(defaultRPr, "w:rFonts");
  const sizeElement = getFirstXmlEmptyOrElement(defaultRPr, "w:sz");
  const defaultFont = clean(
    getXmlAttribute(rFonts, "w:ascii")
    || getXmlAttribute(rFonts, "w:hAnsi")
    || getXmlAttribute(rFonts, "w:cs")
    || "Arial",
  );
  const defaultFontSize = halfPointsToPt(getXmlVal(sizeElement), 11);
  const pageWidthPt = twipsToPt(getXmlAttribute(pgSz, "w:w"), 595.28);
  const pageHeightPt = twipsToPt(getXmlAttribute(pgSz, "w:h"), 841.89);
  const orient = clean(getXmlAttribute(pgSz, "w:orient")).toLowerCase();
  const page = {
    widthPt: orient === "landscape" ? Math.max(pageWidthPt, pageHeightPt) : pageWidthPt,
    heightPt: orient === "landscape" ? Math.min(pageWidthPt, pageHeightPt) : pageHeightPt,
    marginTopPt: twipsToPt(getXmlAttribute(pgMar, "w:top"), 72),
    marginRightPt: twipsToPt(getXmlAttribute(pgMar, "w:right"), 72),
    marginBottomPt: twipsToPt(getXmlAttribute(pgMar, "w:bottom"), 72),
    marginLeftPt: twipsToPt(getXmlAttribute(pgMar, "w:left"), 72),
    headerTopPt: twipsToPt(getXmlAttribute(pgMar, "w:header"), 36),
    footerBottomPt: twipsToPt(getXmlAttribute(pgMar, "w:footer"), 36),
    orientation: orient || "portrait",
  };
  return {
    themeColors,
    defaultFont,
    defaultFontSize,
    defaultParagraphCss: docxParagraphPropertiesToCss(getFirstXmlElement(defaultPPr, "w:pPr"), themeColors),
    defaultRunCss: docxRunPropertiesToCss(getFirstXmlElement(defaultRPr, "w:rPr"), themeColors),
    page,
  };
}

async function extractWordDocumentMetadata(buffer = Buffer.alloc(0)) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    return await extractWordDocumentMetadataFromZip(zip);
  } catch {
    return {};
  }
}

function docxHighlightToColor(value = "") {
  const lookup = {
    black: "#000000",
    blue: "#0000FF",
    cyan: "#00FFFF",
    green: "#00FF00",
    magenta: "#FF00FF",
    red: "#FF0000",
    yellow: "#FFFF00",
    white: "#FFFFFF",
    darkBlue: "#000080",
    darkCyan: "#008080",
    darkGreen: "#008000",
    darkMagenta: "#800080",
    darkRed: "#800000",
    darkYellow: "#808000",
    darkGray: "#808080",
    lightGray: "#C0C0C0",
  };
  return lookup[clean(value)] || "";
}

function dedupeCssDeclarations(styles = []) {
  const byName = new Map();
  (Array.isArray(styles) ? styles : []).forEach((style) => {
    const text = clean(style).replace(/;$/, "");
    const separatorIndex = text.indexOf(":");
    if (separatorIndex <= 0) {
      return;
    }
    byName.set(text.slice(0, separatorIndex).trim(), text.slice(separatorIndex + 1).trim());
  });
  return Array.from(byName.entries()).map(([key, value]) => `${key}:${value}`);
}

function mergeCssLists(...lists) {
  return dedupeCssDeclarations(lists.flat().filter(Boolean));
}

function cssListToStyleAttribute(styles = []) {
  const css = mergeCssLists(styles).join(";");
  return css ? ` style="${escapeTemplateHtml(css)}"` : "";
}

function docxRunPropertiesToCss(rPr = "", themeColors = {}) {
  const styles = [];
  if (!rPr) {
    return styles;
  }
  if (isDocxOnOff(getFirstXmlEmptyOrElement(rPr, "w:b"))) styles.push("font-weight:700");
  if (isDocxOnOff(getFirstXmlEmptyOrElement(rPr, "w:i"))) styles.push("font-style:italic");
  if (isDocxOnOff(getFirstXmlEmptyOrElement(rPr, "w:caps"))) styles.push("text-transform:uppercase");
  if (isDocxOnOff(getFirstXmlEmptyOrElement(rPr, "w:smallCaps"))) styles.push("font-variant:small-caps");
  const textDecorations = [];
  const underline = getFirstXmlEmptyOrElement(rPr, "w:u");
  if (underline && !["none", "false", "0"].includes(getXmlVal(underline, "single").toLowerCase())) textDecorations.push("underline");
  if (isDocxOnOff(getFirstXmlEmptyOrElement(rPr, "w:strike")) || isDocxOnOff(getFirstXmlEmptyOrElement(rPr, "w:dstrike"))) textDecorations.push("line-through");
  if (textDecorations.length > 0) styles.push(`text-decoration:${textDecorations.join(" ")}`);
  const color = resolveDocxThemeColor(getFirstXmlEmptyOrElement(rPr, "w:color"), themeColors);
  if (color) styles.push(`color:${color}`);
  const highlightColor = docxHighlightToColor(getXmlVal(getFirstXmlEmptyOrElement(rPr, "w:highlight")));
  const shading = getFirstXmlEmptyOrElement(rPr, "w:shd");
  const fillColor = highlightColor || normalizeDocxHexColor(getXmlAttribute(shading, "w:fill")) || resolveDocxThemeColor(shading, themeColors);
  if (fillColor) styles.push(`background-color:${fillColor}`);
  const size = halfPointsToPt(getXmlVal(getFirstXmlEmptyOrElement(rPr, "w:sz")));
  if (size) styles.push(`font-size:${cssLengthPt(size)}`);
  const spacing = twipsToPt(getXmlAttribute(getFirstXmlEmptyOrElement(rPr, "w:spacing"), "w:val"));
  if (spacing) styles.push(`letter-spacing:${cssLengthPt(spacing)}`);
  const position = halfPointsToPt(getXmlVal(getFirstXmlEmptyOrElement(rPr, "w:position")));
  if (position) styles.push(`position:relative;top:${cssLengthPt(-position)}`);
  const vertAlign = getXmlVal(getFirstXmlEmptyOrElement(rPr, "w:vertAlign")).toLowerCase();
  if (vertAlign === "superscript") styles.push("vertical-align:super;font-size:80%");
  if (vertAlign === "subscript") styles.push("vertical-align:sub;font-size:80%");
  const fonts = getFirstXmlEmptyOrElement(rPr, "w:rFonts");
  const fontFamily = clean(getXmlAttribute(fonts, "w:ascii") || getXmlAttribute(fonts, "w:hAnsi") || getXmlAttribute(fonts, "w:cs"));
  if (fontFamily) styles.push(`font-family:${fontFamily}, Arial, sans-serif`);
  return dedupeCssDeclarations(styles);
}

function docxBorderToCss(borderElement = "", themeColors = {}, {
  preserveNone = true,
} = {}) {
  if (!borderElement) {
    return "";
  }
  const value = getXmlVal(borderElement, "single").toLowerCase();
  if (["nil", "none", "false", "0"].includes(value)) {
    return preserveNone ? "none" : "";
  }
  const styleMap = {
    single: "solid",
    thick: "solid",
    double: "double",
    dotted: "dotted",
    dashed: "dashed",
    dotDash: "dashed",
    dotDotDash: "dashed",
    dashSmallGap: "dashed",
  };
  const width = Math.max(0.5, eighthPointsToPt(getXmlAttribute(borderElement, "w:sz"), 4 / 8) || 0.5);
  const color = resolveDocxThemeColor(borderElement, themeColors) || "#111827";
  return `${cssLengthPt(width)} ${styleMap[value] || "solid"} ${color}`;
}

function parseDocxBorders(parentXml = "", containerTagName = "", themeColors = {}, {
  preserveNone = true,
} = {}) {
  const borderContainer = getFirstXmlElement(parentXml, containerTagName);
  if (!borderContainer) {
    return {};
  }
  return ["top", "right", "bottom", "left", "insideH", "insideV"].reduce((borders, side) => {
    const borderElement = getFirstXmlEmptyOrElement(borderContainer, `w:${side}`);
    const borderCss = docxBorderToCss(borderElement, themeColors, { preserveNone });
    return borderCss ? { ...borders, [side]: borderCss } : borders;
  }, {});
}

function docxBordersToCss(parentXml = "", containerTagName = "", themeColors = {}, options = {}) {
  const borderMap = parseDocxBorders(parentXml, containerTagName, themeColors, options);
  const sideMap = {
    top: "border-top",
    right: "border-right",
    bottom: "border-bottom",
    left: "border-left",
    insideH: "border-bottom",
    insideV: "border-right",
  };
  return Object.entries(sideMap)
    .map(([side, cssName]) => (borderMap[side] ? `${cssName}:${borderMap[side]}` : ""))
    .filter(Boolean);
}

function docxParagraphPropertiesToCss(pPr = "", themeColors = {}) {
  const styles = [];
  if (!pPr) {
    return styles;
  }
  const alignment = getXmlVal(getFirstXmlEmptyOrElement(pPr, "w:jc")).toLowerCase();
  const alignmentMap = {
    start: "left",
    left: "left",
    center: "center",
    right: "right",
    end: "right",
    both: "justify",
    distribute: "justify",
  };
  if (alignmentMap[alignment]) styles.push(`text-align:${alignmentMap[alignment]}`);
  const spacing = getFirstXmlEmptyOrElement(pPr, "w:spacing");
  const before = twipsToPt(getXmlAttribute(spacing, "w:before"));
  const after = twipsToPt(getXmlAttribute(spacing, "w:after"));
  const line = Number.parseFloat(getXmlAttribute(spacing, "w:line"));
  const lineRule = clean(getXmlAttribute(spacing, "w:lineRule"));
  if (before !== null) styles.push(`margin-top:${cssLengthPt(before)}`);
  if (after !== null) styles.push(`margin-bottom:${cssLengthPt(after)}`);
  if (Number.isFinite(line)) {
    styles.push(lineRule === "exact" || lineRule === "atLeast" ? `line-height:${cssLengthPt(twipsToPt(line, 0))}` : `line-height:${Math.max(1, Math.round((line / 240) * 100) / 100)}`);
  }
  const indent = getFirstXmlEmptyOrElement(pPr, "w:ind");
  const left = twipsToPt(getXmlAttribute(indent, "w:left"));
  const right = twipsToPt(getXmlAttribute(indent, "w:right"));
  const firstLine = twipsToPt(getXmlAttribute(indent, "w:firstLine"));
  const hanging = twipsToPt(getXmlAttribute(indent, "w:hanging"));
  if (left !== null) styles.push(`margin-left:${cssLengthPt(left)}`);
  if (right !== null) styles.push(`margin-right:${cssLengthPt(right)}`);
  if (firstLine !== null) styles.push(`text-indent:${cssLengthPt(firstLine)}`);
  if (hanging !== null) styles.push(`text-indent:-${cssLengthPt(hanging)}`);
  const shading = getFirstXmlEmptyOrElement(pPr, "w:shd");
  const fillColor = normalizeDocxHexColor(getXmlAttribute(shading, "w:fill")) || resolveDocxThemeColor(shading, themeColors);
  if (fillColor) styles.push(`background-color:${fillColor}`);
  if (hasXmlElement(pPr, "w:pageBreakBefore")) styles.push("break-before:page;page-break-before:always");
  styles.push(...docxBordersToCss(pPr, "w:pBdr", themeColors));
  return dedupeCssDeclarations(styles);
}

function docxWidthElementToCss(widthElement = "", {
  pctMax = 100,
} = {}) {
  const widthType = clean(getXmlAttribute(widthElement, "w:type")).toLowerCase();
  const widthValue = Number.parseFloat(getXmlAttribute(widthElement, "w:w"));
  if (!Number.isFinite(widthValue) || widthValue <= 0) {
    return "";
  }
  if (widthType === "pct") {
    return `${Math.max(1, Math.min(pctMax, widthValue / 50))}%`;
  }
  if (widthType === "dxa" || !widthType) {
    return cssLengthPt(twipsToPt(widthValue, 0));
  }
  return "";
}

function docxTableCellMarginsToCss(parentXml = "") {
  const margins = getFirstXmlElement(parentXml, "w:tcMar") || getFirstXmlElement(parentXml, "w:tblCellMar");
  const styles = [];
  const marginMap = { top: "padding-top", right: "padding-right", bottom: "padding-bottom", left: "padding-left" };
  Object.entries(marginMap).forEach(([side, cssName]) => {
    const element = getFirstXmlEmptyOrElement(margins, `w:${side}`);
    const value = twipsToPt(getXmlAttribute(element, "w:w"));
    if (value !== null) styles.push(`${cssName}:${cssLengthPt(value)}`);
  });
  return styles;
}

function parseDocxTableGridWidths(tblXml = "") {
  return getXmlEmptyOrElements(getFirstXmlElement(tblXml, "w:tblGrid"), "w:gridCol")
    .map((gridCol) => twipsToPt(getXmlAttribute(gridCol, "w:w")))
    .filter((width) => Number.isFinite(width) && width > 0);
}

function parseDocxTableCellWidthPt(tcPr = "") {
  const tcW = getFirstXmlEmptyOrElement(tcPr, "w:tcW");
  const widthType = clean(getXmlAttribute(tcW, "w:type")).toLowerCase();
  if (widthType && widthType !== "dxa") {
    return null;
  }
  const width = twipsToPt(getXmlAttribute(tcW, "w:w"));
  return Number.isFinite(width) && width > 0 ? width : null;
}

function parseDocxTableCellGridWidths(tblXml = "") {
  const widths = [];
  parseDocxTableRows(tblXml).forEach((row) => {
    row.cells.forEach((cell) => {
      const width = parseDocxTableCellWidthPt(cell.tcPr);
      if (!Number.isFinite(width) || width <= 0) {
        return;
      }
      const span = Math.max(1, Number.parseInt(cell.gridSpan, 10) || 1);
      const columnWidth = width / span;
      for (let index = 0; index < span; index += 1) {
        const columnIndex = cell.columnIndex + index;
        widths[columnIndex] = Math.max(widths[columnIndex] || 0, columnWidth);
      }
    });
  });
  return widths.filter((width) => Number.isFinite(width) && width > 0);
}

function getDocxTableGridWidth(gridWidthsPt = []) {
  const total = (Array.isArray(gridWidthsPt) ? gridWidthsPt : [])
    .filter((width) => Number.isFinite(width) && width > 0)
    .reduce((sum, width) => sum + width, 0);
  return total > 0 ? total : null;
}

function docxTablePropertiesToCss(tblPr = "", themeColors = {}, {
  gridWidthsPt = [],
} = {}) {
  const styles = [];
  if (!tblPr) {
    return styles;
  }
  const tblW = getFirstXmlEmptyOrElement(tblPr, "w:tblW");
  const tableWidth = docxWidthElementToCss(tblW);
  const gridWidth = getDocxTableGridWidth(gridWidthsPt);
  if (tableWidth) styles.push(`width:${tableWidth}`);
  else if (gridWidth) styles.push(`width:${cssLengthPt(gridWidth)}`);
  const tblInd = getFirstXmlEmptyOrElement(tblPr, "w:tblInd");
  const indent = docxWidthElementToCss(tblInd, { pctMax: 100 });
  if (indent) styles.push(`margin-left:${indent}`);
  const tblLayout = clean(getXmlVal(getFirstXmlEmptyOrElement(tblPr, "w:tblLayout"))).toLowerCase();
  if (tblLayout === "fixed" || gridWidth) styles.push("table-layout:fixed");
  const tblCellSpacing = docxWidthElementToCss(getFirstXmlEmptyOrElement(tblPr, "w:tblCellSpacing"));
  if (tblCellSpacing) {
    styles.push(`border-spacing:${tblCellSpacing}`);
    styles.push("border-collapse:separate");
  }
  const jc = getXmlVal(getFirstXmlEmptyOrElement(tblPr, "w:jc")).toLowerCase();
  if (jc === "center") styles.push("margin-left:auto;margin-right:auto");
  if (jc === "right") styles.push("margin-left:auto;margin-right:0");
  const shading = getFirstXmlEmptyOrElement(tblPr, "w:shd");
  const fillColor = normalizeDocxHexColor(getXmlAttribute(shading, "w:fill")) || resolveDocxThemeColor(shading, themeColors);
  if (fillColor) styles.push(`background-color:${fillColor}`);
  styles.push(...docxBordersToCss(tblPr, "w:tblBorders", themeColors));
  return dedupeCssDeclarations(styles);
}

function docxCellPropertiesToCss(tcPr = "", themeColors = {}) {
  const styles = [];
  if (!tcPr) {
    return styles;
  }
  const tcW = getFirstXmlEmptyOrElement(tcPr, "w:tcW");
  const widthType = clean(getXmlAttribute(tcW, "w:type")).toLowerCase();
  const widthValue = Number.parseFloat(getXmlAttribute(tcW, "w:w"));
  if (Number.isFinite(widthValue) && widthValue > 0) {
    if (widthType === "pct") styles.push(`width:${Math.max(1, Math.min(100, widthValue / 50))}%`);
    if (widthType === "dxa" || !widthType) styles.push(`width:${cssLengthPt(twipsToPt(widthValue, 0))}`);
  }
  const shading = getFirstXmlEmptyOrElement(tcPr, "w:shd");
  const fillColor = normalizeDocxHexColor(getXmlAttribute(shading, "w:fill")) || resolveDocxThemeColor(shading, themeColors);
  if (fillColor) styles.push(`background-color:${fillColor}`);
  const vAlign = getXmlVal(getFirstXmlEmptyOrElement(tcPr, "w:vAlign")).toLowerCase();
  if (vAlign) styles.push(`vertical-align:${vAlign === "center" ? "middle" : vAlign}`);
  styles.push(...docxBordersToCss(tcPr, "w:tcBorders", themeColors));
  styles.push(...docxTableCellMarginsToCss(tcPr));
  return dedupeCssDeclarations(styles);
}

function parseDocxRelationships(relsXml = "") {
  const relationships = {};
  Array.from(String(relsXml || "").matchAll(/<Relationship\b[^>]*\/?>/gi)).forEach((match) => {
    const tag = match[0];
    const id = clean(getXmlAttribute(tag, "Id"));
    const target = clean(getXmlAttribute(tag, "Target"));
    if (id && target) {
      relationships[id] = target;
    }
  });
  return relationships;
}

function resolveDocxMediaPath(target = "") {
  const cleanTarget = clean(target).replace(/\\/g, "/").replace(/^\.\//, "");
  if (!cleanTarget || /^(https?:|data:|mailto:)/i.test(cleanTarget)) {
    return "";
  }
  return cleanTarget.startsWith("word/") ? cleanTarget : `word/${cleanTarget.replace(/^\.\.\//, "")}`;
}

function parseDocxStyles(stylesXml = "", themeColors = {}) {
  const rawStyles = {};
  getXmlElements(stylesXml, "w:style").forEach((styleXml) => {
    const startTag = styleXml.match(/<w:style\b[^>]*>/i)?.[0] || "";
    const styleId = clean(getXmlAttribute(startTag, "w:styleId"));
    if (!styleId) {
      return;
    }
    rawStyles[styleId] = {
      id: styleId,
      type: clean(getXmlAttribute(startTag, "w:type")).toLowerCase(),
      name: getXmlVal(getFirstXmlEmptyOrElement(styleXml, "w:name"), styleId),
      basedOn: getXmlVal(getFirstXmlEmptyOrElement(styleXml, "w:basedOn")),
      pCss: docxParagraphPropertiesToCss(getFirstXmlElement(styleXml, "w:pPr"), themeColors),
      rCss: docxRunPropertiesToCss(getFirstXmlElement(styleXml, "w:rPr"), themeColors),
      tblCss: docxTablePropertiesToCss(getFirstXmlElement(styleXml, "w:tblPr"), themeColors),
    };
  });

  const resolving = new Set();
  const resolved = {};
  const resolveStyle = (styleId = "") => {
    if (!styleId || !rawStyles[styleId]) {
      return null;
    }
    if (resolved[styleId]) {
      return resolved[styleId];
    }
    if (resolving.has(styleId)) {
      return rawStyles[styleId];
    }
    resolving.add(styleId);
    const style = rawStyles[styleId];
    const parent = resolveStyle(style.basedOn);
    resolved[styleId] = {
      ...style,
      pCss: mergeCssLists(parent?.pCss || [], style.pCss),
      rCss: mergeCssLists(parent?.rCss || [], style.rCss),
      tblCss: mergeCssLists(parent?.tblCss || [], style.tblCss),
    };
    resolving.delete(styleId);
    return resolved[styleId];
  };

  Object.keys(rawStyles).forEach(resolveStyle);
  return resolved;
}

function getDocxStyle(styles = {}, styleId = "", type = "") {
  const style = styles[styleId];
  if (!style) {
    return null;
  }
  return type && style.type && style.type !== type ? null : style;
}

function findMatchingXmlElement(xml = "", startIndex = 0, tagName = "") {
  const source = String(xml || "");
  const safeTagName = String(tagName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tokenRegex = new RegExp(`<\\/?${safeTagName}\\b[^>]*>`, "gi");
  tokenRegex.lastIndex = startIndex;
  let depth = 0;
  let match;
  while ((match = tokenRegex.exec(source))) {
    const token = match[0];
    if (token.startsWith(`</`)) {
      depth -= 1;
      if (depth <= 0) {
        return tokenRegex.lastIndex;
      }
    } else if (!token.endsWith("/>")) {
      depth += 1;
    }
  }
  return -1;
}

function extractDocxBodyBlocks(bodyXml = "") {
  const source = String(bodyXml || "");
  const blocks = [];
  let index = 0;
  while (index < source.length) {
    const paragraphIndex = source.indexOf("<w:p", index);
    const tableIndex = source.indexOf("<w:tbl", index);
    const candidates = [
      paragraphIndex >= 0 ? { type: "p", index: paragraphIndex, tag: "w:p" } : null,
      tableIndex >= 0 ? { type: "tbl", index: tableIndex, tag: "w:tbl" } : null,
    ].filter(Boolean).sort((a, b) => a.index - b.index);
    const next = candidates[0];
    if (!next) {
      break;
    }
    const end = findMatchingXmlElement(source, next.index, next.tag);
    if (end <= next.index) {
      break;
    }
    blocks.push({
      type: next.type,
      xml: source.slice(next.index, end),
    });
    index = end;
  }
  return blocks;
}

function getDocxParagraphListInfo(pPr = "") {
  const numPr = getFirstXmlElement(pPr, "w:numPr");
  if (!numPr) {
    return null;
  }
  return {
    level: Number.parseInt(getXmlVal(getFirstXmlEmptyOrElement(numPr, "w:ilvl"), "0"), 10) || 0,
    id: getXmlVal(getFirstXmlEmptyOrElement(numPr, "w:numId"), "0"),
  };
}

function parseDocxNumbering(numberingXml = "") {
  const abstractNums = {};
  getXmlElements(numberingXml, "w:abstractNum").forEach((abstractXml) => {
    const startTag = abstractXml.match(/<w:abstractNum\b[^>]*>/i)?.[0] || "";
    const abstractNumId = clean(getXmlAttribute(startTag, "w:abstractNumId") || getXmlAttribute(startTag, "abstractNumId"));
    if (!abstractNumId) {
      return;
    }
    const levels = {};
    getXmlElements(abstractXml, "w:lvl").forEach((levelXml) => {
      const levelStartTag = levelXml.match(/<w:lvl\b[^>]*>/i)?.[0] || "";
      const level = Number.parseInt(getXmlAttribute(levelStartTag, "w:ilvl") || getXmlAttribute(levelStartTag, "ilvl") || "0", 10) || 0;
      const numFmt = getXmlVal(getFirstXmlEmptyOrElement(levelXml, "w:numFmt"), "decimal");
      levels[level] = {
        level,
        start: Math.max(1, Number.parseInt(getXmlVal(getFirstXmlEmptyOrElement(levelXml, "w:start"), "1"), 10) || 1),
        numFmt,
        lvlText: getXmlVal(getFirstXmlEmptyOrElement(levelXml, "w:lvlText"), numFmt.toLowerCase() === "bullet" ? "\u2022" : `%${level + 1}.`),
      };
    });
    abstractNums[abstractNumId] = { id: abstractNumId, levels };
  });

  const nums = {};
  getXmlElements(numberingXml, "w:num").forEach((numXml) => {
    const startTag = numXml.match(/<w:num\b[^>]*>/i)?.[0] || "";
    const numId = clean(getXmlAttribute(startTag, "w:numId") || getXmlAttribute(startTag, "numId"));
    const abstractNumId = getXmlVal(getFirstXmlEmptyOrElement(numXml, "w:abstractNumId"));
    if (numId && abstractNumId) {
      nums[numId] = { id: numId, abstractNumId };
    }
  });

  return { abstractNums, nums };
}

function getDocxNumberingLevel(numbering = {}, numId = "", level = 0) {
  const num = numbering?.nums?.[numId];
  const abstractNum = numbering?.abstractNums?.[num?.abstractNumId];
  return abstractNum?.levels?.[level] || null;
}

function formatDocxLetterCounter(value = 1) {
  let current = Math.max(1, Number.parseInt(value, 10) || 1);
  let output = "";
  while (current > 0) {
    current -= 1;
    output = `${String.fromCharCode(97 + (current % 26))}${output}`;
    current = Math.floor(current / 26);
  }
  return output || "a";
}

function formatDocxRomanCounter(value = 1) {
  let current = Math.max(1, Number.parseInt(value, 10) || 1);
  const parts = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let output = "";
  parts.forEach(([number, symbol]) => {
    while (current >= number) {
      output += symbol;
      current -= number;
    }
  });
  return output || "i";
}

function formatDocxCounterValue(value = 1, format = "decimal") {
  const safeFormat = clean(format).toLowerCase();
  if (safeFormat === "lowerletter") return formatDocxLetterCounter(value);
  if (safeFormat === "upperletter") return formatDocxLetterCounter(value).toUpperCase();
  if (safeFormat === "lowerroman") return formatDocxRomanCounter(value);
  if (safeFormat === "upperroman") return formatDocxRomanCounter(value).toUpperCase();
  if (safeFormat === "decimalzero") return String(Math.max(0, Number.parseInt(value, 10) || 0)).padStart(2, "0");
  return String(Math.max(0, Number.parseInt(value, 10) || 0));
}

function getDocxListMarker(listInfo = null, context = {}) {
  if (!listInfo) {
    return "";
  }
  const level = Math.max(0, Number.parseInt(listInfo.level, 10) || 0);
  const numId = clean(listInfo.id) || "default";
  const levelDefinition = getDocxNumberingLevel(context.numbering, numId, level);
  const numFmt = clean(levelDefinition?.numFmt || "decimal").toLowerCase();
  const lvlText = clean(levelDefinition?.lvlText || (numFmt === "bullet" ? "\u2022" : `%${level + 1}.`));
  if (numFmt === "bullet") {
    return lvlText && !/%\d+/g.test(lvlText) ? lvlText : "\u2022";
  }

  if (!context.numberingState) {
    context.numberingState = new Map();
  }
  const counters = context.numberingState.get(numId) || [];
  counters[level] = (Number.isFinite(counters[level]) ? counters[level] : (levelDefinition?.start || 1) - 1) + 1;
  counters.length = level + 1;
  context.numberingState.set(numId, counters);

  return lvlText.replace(/%(\d+)/g, (match, rawIndex) => {
    const index = Math.max(0, Number.parseInt(rawIndex, 10) - 1);
    const value = counters[index];
    if (!Number.isFinite(value)) {
      return "0";
    }
    const definition = getDocxNumberingLevel(context.numbering, numId, index) || levelDefinition;
    return formatDocxCounterValue(value, definition?.numFmt || "decimal");
  });
}

function getDocxShapeFillColor(xml = "", themeColors = {}) {
  const solidFill = getFirstXmlElement(xml, "a:solidFill");
  const srgb = getFirstXmlEmptyOrElement(solidFill, "a:srgbClr") || getFirstXmlEmptyOrElement(xml, "a:srgbClr");
  return normalizeDocxHexColor(getXmlAttribute(srgb, "val"))
    || normalizeLegacyHtmlCssColor(getXmlAttribute(xml, "fillcolor"))
    || resolveDocxThemeColor(srgb, themeColors);
}

function getDocxDrawingShapeMetrics(xml = "") {
  const anchor = getFirstXmlElement(xml, "wp:anchor");
  const extent = getFirstXmlEmptyOrElement(anchor || xml, "wp:extent") || getFirstXmlEmptyOrElement(xml, "a:ext");
  const positionH = getFirstXmlElement(anchor, "wp:positionH");
  const positionV = getFirstXmlElement(anchor, "wp:positionV");
  const positionHTag = positionH.match(/<wp:positionH\b[^>]*>/i)?.[0] || "";
  const positionVTag = positionV.match(/<wp:positionV\b[^>]*>/i)?.[0] || "";
  return {
    anchored: Boolean(anchor),
    relativeH: clean(getXmlAttribute(positionHTag, "relativeFrom") || getXmlAttribute(positionHTag, "wp:relativeFrom")).toLowerCase(),
    relativeV: clean(getXmlAttribute(positionVTag, "relativeFrom") || getXmlAttribute(positionVTag, "wp:relativeFrom")).toLowerCase(),
    widthPt: emuToPt(getXmlAttribute(extent, "cx")),
    heightPt: emuToPt(getXmlAttribute(extent, "cy")),
    leftPt: emuToPt(clean(positionH.match(/<wp:posOffset\b[^>]*>([\s\S]*?)<\/wp:posOffset>/i)?.[1])),
    topPt: emuToPt(clean(positionV.match(/<wp:posOffset\b[^>]*>([\s\S]*?)<\/wp:posOffset>/i)?.[1])),
  };
}

function getVmlShapeMetrics(xml = "") {
  const shape = getFirstXmlEmptyOrElement(xml, "v:shape") || getFirstXmlElement(xml, "v:shape");
  const style = getHtmlAttribute(shape, "style");
  const styleValue = (property = "") => {
    const safeProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return clean(style.match(new RegExp(`(?:^|;)\\s*${safeProperty}\\s*:\\s*([^;]+)`, "i"))?.[1]);
  };
  const lengthToPt = (value = "") => {
    const raw = clean(value).toLowerCase();
    const numeric = Number.parseFloat(raw);
    if (!Number.isFinite(numeric)) return null;
    if (raw.endsWith("px")) return numeric * 0.75;
    if (raw.endsWith("in")) return numeric * 72;
    if (raw.endsWith("cm")) return numeric * 28.3465;
    if (raw.endsWith("mm")) return numeric * 2.83465;
    return numeric;
  };
  return {
    anchored: /position\s*:\s*absolute/i.test(style),
    relativeH: styleValue("mso-position-horizontal-relative").toLowerCase(),
    relativeV: styleValue("mso-position-vertical-relative").toLowerCase(),
    widthPt: lengthToPt(styleValue("width")),
    heightPt: lengthToPt(styleValue("height")),
    leftPt: lengthToPt(styleValue("margin-left")),
    topPt: lengthToPt(styleValue("margin-top")),
  };
}

function renderDocxFloatingShapeHtml(xml = "", context = {}) {
  const fillColor = getDocxShapeFillColor(xml, context.themeColors);
  if (!fillColor) {
    return "";
  }
  const drawingMetrics = getDocxDrawingShapeMetrics(xml);
  const vmlMetrics = getVmlShapeMetrics(xml);
  const metrics = {
    anchored: drawingMetrics.anchored || vmlMetrics.anchored,
    relativeH: drawingMetrics.relativeH || vmlMetrics.relativeH || "",
    relativeV: drawingMetrics.relativeV || vmlMetrics.relativeV || "",
    widthPt: drawingMetrics.widthPt || vmlMetrics.widthPt,
    heightPt: drawingMetrics.heightPt || vmlMetrics.heightPt,
    leftPt: drawingMetrics.leftPt ?? vmlMetrics.leftPt,
    topPt: drawingMetrics.topPt ?? vmlMetrics.topPt,
  };
  const page = context.metadata?.page && typeof context.metadata.page === "object" ? context.metadata.page : {};
  const leftPt = metrics.relativeH === "page" && Number.isFinite(page.marginLeftPt)
    ? metrics.leftPt - page.marginLeftPt
    : metrics.leftPt;
  const topPt = metrics.relativeV === "page" && Number.isFinite(page.marginTopPt)
    ? metrics.topPt - page.marginTopPt
    : metrics.topPt;
  if (!Number.isFinite(metrics.widthPt) || !Number.isFinite(metrics.heightPt) || metrics.widthPt <= 0 || metrics.heightPt <= 0) {
    return "";
  }
  const styles = [
    metrics.anchored ? "position:absolute" : "display:inline-block",
    metrics.anchored && Number.isFinite(leftPt) ? `left:${cssSignedLengthPt(leftPt)}` : "",
    metrics.anchored && Number.isFinite(topPt) ? `top:${cssSignedLengthPt(topPt)}` : "",
    `width:${cssLengthPt(metrics.widthPt)}`,
    `height:${cssLengthPt(metrics.heightPt)}`,
    `background-color:${fillColor}`,
    "pointer-events:none",
    "z-index:0",
  ].filter(Boolean);
  return `<span class="sn-word-shape${metrics.anchored ? " sn-word-floating-shape" : ""}"${cssListToStyleAttribute(styles)}></span>`;
}

function isHtmlVisuallyEmpty(html = "") {
  if (/<(img|svg|canvas|table)\b/i.test(String(html || "")) || /\bsn-word-shape\b/i.test(String(html || ""))) {
    return false;
  }
  const text = decodeBasicHtmlEntities(String(html || "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]*>/g, " "))
    .replace(/\u00a0/g, " ")
    .trim();
  return !text;
}

function withoutCssDeclarations(styles = [], names = []) {
  const blocked = new Set((Array.isArray(names) ? names : [names]).map((entry) => clean(entry).toLowerCase()).filter(Boolean));
  return (Array.isArray(styles) ? styles : []).filter((style) => {
    const property = clean(style).split(":")[0].toLowerCase();
    return property && !blocked.has(property);
  });
}

async function renderDocxImageHtml(xml = "", context = {}) {
  const relId = clean(
    getXmlAttribute(xml, "r:embed")
    || getXmlAttribute(xml, "r:link")
    || getXmlAttribute(xml, "embed"),
  );
  const target = context.relationships?.[relId];
  const mediaPath = resolveDocxMediaPath(target);
  if (!mediaPath) {
    return renderDocxFloatingShapeHtml(xml, context);
  }
  if (!context.imageCache) {
    context.imageCache = new Map();
  }
  if (!context.imageCache.has(mediaPath)) {
    const file = context.zip?.file(mediaPath);
    context.imageCache.set(mediaPath, file ? await file.async("base64") : "");
  }
  const base64 = context.imageCache.get(mediaPath);
  if (!base64) {
    return "";
  }
  const extent = getFirstXmlEmptyOrElement(xml, "wp:extent") || getFirstXmlEmptyOrElement(xml, "a:ext");
  const cx = Number.parseFloat(getXmlAttribute(extent, "cx"));
  const cy = Number.parseFloat(getXmlAttribute(extent, "cy"));
  const styles = [];
  if (Number.isFinite(cx) && cx > 0) styles.push(`width:${Math.round((cx / 914400) * 96 * 100) / 100}px`);
  if (Number.isFinite(cy) && cy > 0) styles.push(`height:${Math.round((cy / 914400) * 96 * 100) / 100}px`);
  return `<img src="data:${getMimeTypeForPath(mediaPath)};base64,${base64}"${cssListToStyleAttribute(styles)}>`;
}

async function renderDocxRunHtml(runXml = "", context = {}) {
  const rPr = getFirstXmlElement(runXml, "w:rPr");
  const rStyleId = getXmlVal(getFirstXmlEmptyOrElement(rPr, "w:rStyle"));
  const characterStyle = getDocxStyle(context.styles, rStyleId, "character");
  const runCss = mergeCssLists(context.metadata?.defaultRunCss || [], context.paragraphRunCss || [], characterStyle?.rCss || [], docxRunPropertiesToCss(rPr, context.themeColors));
  const chunks = [];
  const tokenRegex = /<w:t\b[^>]*>[\s\S]*?<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>|<w:drawing\b[\s\S]*?<\/w:drawing>|<w:pict\b[\s\S]*?<\/w:pict>|<w:sym\b[^>]*\/>/gi;
  let renderedDrawingVisual = false;
  let match;
  while ((match = tokenRegex.exec(runXml))) {
    const token = match[0];
    if (/^<w:t\b/i.test(token)) {
      chunks.push(escapeTemplateHtml(decodeBasicHtmlEntities(token.replace(/^<w:t\b[^>]*>/i, "").replace(/<\/w:t>$/i, ""))));
    } else if (/^<w:tab\b/i.test(token)) {
      chunks.push('<span class="sn-word-tab"></span>');
    } else if (/^<w:br\b/i.test(token)) {
      const breakType = clean(getXmlAttribute(token, "w:type")).toLowerCase();
      chunks.push(breakType === "page" ? '<span class="sn-word-page-break"></span>' : "<br>");
    } else if (/^<w:sym\b/i.test(token)) {
      const charCode = Number.parseInt(getXmlAttribute(token, "w:char"), 16);
      chunks.push(Number.isFinite(charCode) ? escapeTemplateHtml(String.fromCodePoint(charCode)) : "");
    } else {
      if (/^<w:pict\b/i.test(token) && renderedDrawingVisual) {
        continue;
      }
      const visualHtml = await renderDocxImageHtml(token, context);
      if (visualHtml) {
        chunks.push(visualHtml);
        if (/^<w:drawing\b/i.test(token)) {
          renderedDrawingVisual = true;
        }
      }
    }
  }
  const html = chunks.join("");
  if (!html) {
    return "";
  }
  return runCss.length ? `<span${cssListToStyleAttribute(runCss)}>${html}</span>` : html;
}

function getDocxRunFieldCharType(runXml = "") {
  const fldChar = getFirstXmlEmptyOrElement(runXml, "w:fldChar");
  return clean(getXmlAttribute(fldChar, "w:fldCharType")).toLowerCase();
}

function getDocxRunInstructionText(runXml = "") {
  const instruction = getFirstXmlElement(runXml, "w:instrText");
  if (!instruction) {
    return "";
  }
  return decodeBasicHtmlEntities(
    instruction.replace(/^<w:instrText\b[^>]*>/i, "").replace(/<\/w:instrText>$/i, ""),
  );
}

function buildDocxFieldReplacementHtml(instruction = "") {
  const normalizedInstruction = clean(instruction).toUpperCase();
  if (/\bNUMPAGES\b/.test(normalizedInstruction)) {
    return '<span class="sn-word-page-count" data-sn-word-field="NUMPAGES">{{NUMPAGES}}</span>';
  }
  if (/\bPAGE\b/.test(normalizedInstruction)) {
    return '<span class="sn-word-page-number" data-sn-word-field="PAGE">{{PAGE}}</span>';
  }
  return null;
}

async function renderDocxParagraphInnerHtml(pXml = "", context = {}) {
  const pieces = [];
  const inlineRegex = /<w:hyperlink\b[\s\S]*?<\/w:hyperlink>|<w:r\b[\s\S]*?<\/w:r>/gi;
  let activeField = null;
  const flushFieldResult = async () => {
    if (!activeField) {
      return;
    }
    const replacementHtml = buildDocxFieldReplacementHtml(activeField.instruction);
    if (replacementHtml !== null) {
      pieces.push(replacementHtml);
    } else {
      pieces.push(...await Promise.all(activeField.resultRuns.map((runXml) => renderDocxRunHtml(runXml, context))));
    }
    activeField = null;
  };
  let match;
  while ((match = inlineRegex.exec(pXml))) {
    const token = match[0];
    if (/^<w:hyperlink\b/i.test(token)) {
      const runs = getXmlElements(token, "w:r");
      const text = (await Promise.all(runs.map((runXml) => renderDocxRunHtml(runXml, context)))).join("");
      pieces.push(`<span class="sn-word-hyperlink">${text}</span>`);
    } else {
      const fieldCharType = getDocxRunFieldCharType(token);
      if (fieldCharType === "begin") {
        await flushFieldResult();
        activeField = {
          instruction: getDocxRunInstructionText(token),
          resultRuns: [],
          hasSeparate: false,
        };
        continue;
      }

      if (activeField) {
        activeField.instruction += getDocxRunInstructionText(token);
        if (fieldCharType === "separate") {
          activeField.hasSeparate = true;
          continue;
        }
        if (fieldCharType === "end") {
          await flushFieldResult();
          continue;
        }
        if (activeField.hasSeparate) {
          activeField.resultRuns.push(token);
        }
        continue;
      }

      pieces.push(await renderDocxRunHtml(token, context));
    }
  }
  await flushFieldResult();
  return pieces.join("") || "&nbsp;";
}

async function renderDocxParagraphHtml(pXml = "", context = {}) {
  const pPr = getFirstXmlElement(pXml, "w:pPr");
  const styleId = getXmlVal(getFirstXmlEmptyOrElement(pPr, "w:pStyle"));
  const paragraphStyle = getDocxStyle(context.styles, styleId, "paragraph");
  const pCss = mergeCssLists(context.metadata?.defaultParagraphCss || [], paragraphStyle?.pCss || [], docxParagraphPropertiesToCss(pPr, context.themeColors));
  const rCss = mergeCssLists(paragraphStyle?.rCss || []);
  const listInfo = getDocxParagraphListInfo(pPr);
  const innerHtml = await renderDocxParagraphInnerHtml(pXml, {
    ...context,
    paragraphRunCss: rCss,
  });
  const isBlankParagraph = isHtmlVisuallyEmpty(innerHtml);
  const activeListInfo = isBlankParagraph ? null : listInfo;
  const classNames = ["sn-word-paragraph"];
  if (styleId) classNames.push(`sn-word-style-${styleId.replace(/[^A-Za-z0-9_-]/g, "-")}`);
  if (activeListInfo) classNames.push("sn-word-list-line");
  const paragraphCss = isBlankParagraph ? withoutCssDeclarations(pCss, ["background-color"]) : pCss;
  const listPrefix = activeListInfo ? `<span class="sn-word-list-marker">${escapeTemplateHtml(getDocxListMarker(activeListInfo, context))}</span>` : "";
  return `<p class="${classNames.join(" ")}"${cssListToStyleAttribute(paragraphCss)}>${listPrefix}${innerHtml}</p>`;
}

function parseDocxTableRows(tblXml = "") {
  return getXmlElements(tblXml, "w:tr").map((rowXml) => ({
    xml: rowXml,
    trPr: getFirstXmlElement(rowXml, "w:trPr"),
    cells: (() => {
      let columnIndex = 0;
      return getXmlElements(rowXml, "w:tc").map((cellXml) => {
        const tcPr = getFirstXmlElement(cellXml, "w:tcPr");
        const gridSpan = Math.max(1, Number.parseInt(getXmlVal(getFirstXmlEmptyOrElement(tcPr, "w:gridSpan"), "1"), 10) || 1);
        const vMergeElement = getFirstXmlEmptyOrElement(tcPr, "w:vMerge");
        const vMergeValue = vMergeElement ? (getXmlVal(vMergeElement, "continue") || "continue") : "";
        const cell = {
          xml: cellXml,
          tcPr,
          columnIndex,
          gridSpan,
          vMerge: vMergeValue,
          rowSpan: 1,
          skip: false,
        };
        columnIndex += gridSpan;
        return cell;
      });
    })(),
  }));
}

function applyDocxVerticalMerges(rows = []) {
  const active = new Map();
  rows.forEach((row) => {
    let columnIndex = 0;
    row.cells.forEach((cell) => {
      while (active.has(columnIndex) && active.get(columnIndex)?.closed) {
        active.delete(columnIndex);
      }
      const mergeValue = clean(cell.vMerge).toLowerCase();
      if (mergeValue && mergeValue !== "restart") {
        const origin = active.get(columnIndex);
        if (origin) {
          origin.rowSpan += 1;
          cell.skip = true;
        }
      } else if (mergeValue === "restart") {
        active.set(columnIndex, cell);
      } else {
        active.delete(columnIndex);
      }
      columnIndex += cell.gridSpan;
    });
  });
  return rows;
}

function docxTableRowPropertiesToCss(trPr = "") {
  const styles = [];
  const trHeight = getFirstXmlEmptyOrElement(trPr, "w:trHeight");
  const height = twipsToPt(getXmlAttribute(trHeight, "w:val"));
  const heightRule = clean(getXmlAttribute(trHeight, "w:hRule")).toLowerCase();
  if (height !== null && height > 0 && heightRule !== "auto") {
    styles.push(`height:${cssLengthPt(height)}`);
  }
  if (hasXmlElement(trPr, "w:cantSplit")) {
    styles.push("break-inside:avoid");
    styles.push("page-break-inside:avoid");
  }
  return dedupeCssDeclarations(styles);
}

function getDocxTableMetrics(tblXml = "", tblPr = "", themeColors = {}) {
  const explicitGridWidthsPt = parseDocxTableGridWidths(tblXml);
  const gridWidthsPt = explicitGridWidthsPt.length > 0 ? explicitGridWidthsPt : parseDocxTableCellGridWidths(tblXml);
  const gridWidthPt = getDocxTableGridWidth(gridWidthsPt);
  const tableBorders = parseDocxBorders(tblPr, "w:tblBorders", themeColors);
  return {
    gridWidthsPt,
    gridWidthPt,
    gridSource: explicitGridWidthsPt.length > 0 ? "tblGrid" : gridWidthsPt.length > 0 ? "tcW" : "",
    columnCount: gridWidthsPt.length,
    tableBorders,
    defaultCellCss: docxTableCellMarginsToCss(tblPr),
  };
}

function getDocxTableBorderCssForCell(cell = {}, rowIndex = 0, rowCount = 0, tableMetrics = {}) {
  const borders = tableMetrics.tableBorders || {};
  const columnCount = tableMetrics.columnCount || 0;
  const cellStart = Math.max(0, Number.parseInt(cell.columnIndex, 10) || 0);
  const cellEnd = cellStart + Math.max(1, Number.parseInt(cell.gridSpan, 10) || 1);
  const styles = [];
  if (borders.top && rowIndex === 0) styles.push(`border-top:${borders.top}`);
  if (borders.bottom && rowIndex === rowCount - 1) styles.push(`border-bottom:${borders.bottom}`);
  if (borders.left && cellStart === 0) styles.push(`border-left:${borders.left}`);
  if (borders.right && (!columnCount || cellEnd >= columnCount)) styles.push(`border-right:${borders.right}`);
  if (borders.insideH && rowIndex > 0) styles.push(`border-top:${borders.insideH}`);
  if (borders.insideV && cellStart > 0) styles.push(`border-left:${borders.insideV}`);
  return styles;
}

function buildDocxTableColGroupHtml(gridWidthsPt = []) {
  const widths = (Array.isArray(gridWidthsPt) ? gridWidthsPt : [])
    .filter((width) => Number.isFinite(width) && width > 0);
  if (widths.length === 0) {
    return "";
  }
  return `<colgroup>${widths.map((width) => `<col${cssListToStyleAttribute([`width:${cssLengthPt(width)}`])}>`).join("")}</colgroup>`;
}

function buildDocxTableDataAttributes(tableMetrics = {}) {
  const attrs = [];
  const gridWidths = (tableMetrics.gridWidthsPt || []).filter((width) => Number.isFinite(width) && width > 0);
  if (gridWidths.length > 0) {
    attrs.push(` data-word-grid="${escapeTemplateHtml(gridWidths.map((width) => cssLengthPt(width)).join(" "))}"`);
  }
  if (tableMetrics.gridSource) {
    attrs.push(` data-word-grid-source="${escapeTemplateHtml(tableMetrics.gridSource)}"`);
  }
  if (Number.isFinite(tableMetrics.gridWidthPt) && tableMetrics.gridWidthPt > 0) {
    attrs.push(` data-word-grid-width="${escapeTemplateHtml(cssLengthPt(tableMetrics.gridWidthPt))}"`);
  }
  return attrs.join("");
}

async function renderDocxTableCellHtml(cell = {}, context = {}, tableMetrics = {}, rowIndex = 0, rowCount = 0) {
  const blocks = extractDocxBodyBlocks(cell.xml.replace(getFirstXmlElement(cell.xml, "w:tcPr"), ""));
  const contentBlocks = [];
  for (const block of blocks) {
    contentBlocks.push(block.type === "tbl"
      ? await renderDocxTableHtml(block.xml, context)
      : await renderDocxParagraphHtml(block.xml, context));
  }
  const content = contentBlocks.join("");
  const attrs = [
    cell.gridSpan > 1 ? ` colspan="${cell.gridSpan}"` : "",
    cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : "",
    cssListToStyleAttribute(mergeCssLists(
      tableMetrics.defaultCellCss || [],
      getDocxTableBorderCssForCell(cell, rowIndex, rowCount, tableMetrics),
      docxCellPropertiesToCss(cell.tcPr, context.themeColors),
    )),
  ].filter(Boolean).join("");
  return `<td${attrs}>${content || "&nbsp;"}</td>`;
}

async function renderDocxTableHtml(tblXml = "", context = {}) {
  const tblPr = getFirstXmlElement(tblXml, "w:tblPr");
  const styleId = getXmlVal(getFirstXmlEmptyOrElement(tblPr, "w:tblStyle"));
  const tableStyle = getDocxStyle(context.styles, styleId, "table");
  const tableMetrics = getDocxTableMetrics(tblXml, tblPr, context.themeColors);
  const rows = applyDocxVerticalMerges(parseDocxTableRows(tblXml));
  const rowHtml = [];
  for (const [rowIndex, row] of rows.entries()) {
    const cellHtml = [];
    for (const cell of row.cells.filter((entry) => !entry.skip)) {
      cellHtml.push(await renderDocxTableCellHtml(cell, context, tableMetrics, rowIndex, rows.length));
    }
    rowHtml.push(`<tr${cssListToStyleAttribute(docxTableRowPropertiesToCss(row.trPr))}>${cellHtml.join("")}</tr>`);
  }
  const css = mergeCssLists(tableStyle?.tblCss || [], docxTablePropertiesToCss(tblPr, context.themeColors, tableMetrics));
  const colGroup = buildDocxTableColGroupHtml(tableMetrics.gridWidthsPt);
  return `<table class="sn-word-table sn-word-ooxml-table"${buildDocxTableDataAttributes(tableMetrics)}${cssListToStyleAttribute(css)}>${colGroup}<tbody>${rowHtml.join("")}</tbody></table>`;
}

async function renderDocxBlocksHtml(xml = "", context = {}) {
  const blocks = extractDocxBodyBlocks(xml);
  const htmlBlocks = [];
  for (const block of blocks) {
    htmlBlocks.push(block.type === "tbl"
      ? await renderDocxTableHtml(block.xml, context)
      : await renderDocxParagraphHtml(block.xml, context));
  }
  return htmlBlocks.join("\n");
}

function getDocxPartReferences(sectPr = "", tagName = "") {
  const safeTagName = String(tagName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Array.from(String(sectPr || "").matchAll(new RegExp(`<${safeTagName}\\b[^>]*(?:\\/>|>\\s*<\\/${safeTagName}>)`, "gi")))
    .map((match) => ({
      type: clean(getXmlAttribute(match[0], "w:type") || getXmlAttribute(match[0], "type") || "default").toLowerCase(),
      relId: clean(getXmlAttribute(match[0], "r:id") || getXmlAttribute(match[0], "id")),
    }))
    .filter((reference) => reference.relId);
}

function chooseDocxSectionPartReference(references = [], preferFirst = false) {
  const safeReferences = Array.isArray(references) ? references : [];
  return (preferFirst ? safeReferences.find((reference) => reference.type === "first") : null)
    || safeReferences.find((reference) => reference.type === "default")
    || safeReferences.find((reference) => reference.type === "even")
    || safeReferences[0]
    || null;
}

function getPrimaryDocxSectionProperties(documentXml = "") {
  const sections = getXmlElements(documentXml, "w:sectPr");
  return sections.find((section) => hasXmlElement(section, "w:headerReference") || hasXmlElement(section, "w:footerReference"))
    || sections[0]
    || "";
}

async function renderDocxRelatedPartHtml(zip, target = "", context = {}, className = "") {
  const partPath = resolveDocxMediaPath(target);
  if (!partPath) {
    return "";
  }
  const partXml = await readDocxZipText(zip, partPath);
  if (!partXml) {
    return "";
  }
  const partRelsXml = await readDocxZipText(zip, `word/_rels/${basename(partPath)}.rels`);
  const partContext = {
    ...context,
    relationships: {
      ...(context.relationships || {}),
      ...parseDocxRelationships(partRelsXml),
    },
    numberingState: new Map(),
  };
  const content = await renderDocxBlocksHtml(partXml, partContext);
  if (isHtmlVisuallyEmpty(content)) {
    return "";
  }
  const classNames = [className]
    .filter(Boolean);
  if (/\bdata-sn-word-field\s*=/i.test(content)) {
    classNames.push("has-generated-page-fields");
  }
  return `<section class="${classNames.join(" ")}">${content}</section>`;
}

async function buildDocxPageChromeHtml(zip, documentXml = "", context = {}) {
  const sectPr = getPrimaryDocxSectionProperties(documentXml);
  const preferFirst = hasXmlElement(sectPr, "w:titlePg");
  const headerReference = chooseDocxSectionPartReference(getDocxPartReferences(sectPr, "w:headerReference"), preferFirst);
  const footerReference = chooseDocxSectionPartReference(getDocxPartReferences(sectPr, "w:footerReference"), preferFirst);
  const headerHtml = headerReference
    ? await renderDocxRelatedPartHtml(zip, context.relationships?.[headerReference.relId], context, "sn-word-page-header")
    : "";
  const footerHtml = footerReference
    ? await renderDocxRelatedPartHtml(zip, context.relationships?.[footerReference.relId], context, "sn-word-page-footer")
    : "";
  return { headerHtml, footerHtml };
}

async function extractDocxBodyFloatingShapesHtml(documentXml = "", context = {}) {
  const bodyXml = getFirstXmlElement(documentXml, "w:body") || documentXml;
  const shapes = [];
  const shapeRegex = /<w:drawing\b[\s\S]*?<\/w:drawing>|<w:pict\b[\s\S]*?<\/w:pict>/gi;
  let match;
  while ((match = shapeRegex.exec(bodyXml))) {
    const html = renderDocxFloatingShapeHtml(match[0], context);
    if (html) {
      shapes.push(html);
    }
  }
  return shapes.join("\n");
}

async function extractWordDocumentChromeMetadata(buffer = Buffer.alloc(0), {
  includeBodyFloatingShapes = false,
} = {}) {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await readDocxZipText(zip, "word/document.xml");
  if (!documentXml) {
    return {};
  }
  const [stylesXml, relsXml, numberingXml] = await Promise.all([
    readDocxZipText(zip, "word/styles.xml"),
    readDocxZipText(zip, "word/_rels/document.xml.rels"),
    readDocxZipText(zip, "word/numbering.xml"),
  ]);
  const metadata = await extractWordDocumentMetadataFromZip(zip);
  const context = {
    zip,
    metadata,
    themeColors: metadata.themeColors || {},
    styles: parseDocxStyles(stylesXml, metadata.themeColors || {}),
    relationships: parseDocxRelationships(relsXml),
    numbering: parseDocxNumbering(numberingXml),
    numberingState: new Map(),
    imageCache: new Map(),
  };
  const chrome = await buildDocxPageChromeHtml(zip, documentXml, context);
  return {
    ...chrome,
    bodyFloatingShapesHtml: includeBodyFloatingShapes ? await extractDocxBodyFloatingShapesHtml(documentXml, context) : "",
  };
}

async function convertWordBufferToHtmlWithDocxXml(buffer = Buffer.alloc(0), {
  fileName = "word-template.docx",
  extraMessages = [],
} = {}) {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await readDocxZipText(zip, "word/document.xml");
  if (!documentXml) {
    throw new Error("Word dokument nema document.xml sadržaj.");
  }
  const [stylesXml, relsXml, numberingXml] = await Promise.all([
    readDocxZipText(zip, "word/styles.xml"),
    readDocxZipText(zip, "word/_rels/document.xml.rels"),
    readDocxZipText(zip, "word/numbering.xml"),
  ]);
  const metadata = await extractWordDocumentMetadataFromZip(zip);
  const context = {
    zip,
    metadata,
    themeColors: metadata.themeColors || {},
    styles: parseDocxStyles(stylesXml, metadata.themeColors || {}),
    relationships: parseDocxRelationships(relsXml),
    numbering: parseDocxNumbering(numberingXml),
    numberingState: new Map(),
    imageCache: new Map(),
  };
  const chrome = await buildDocxPageChromeHtml(zip, documentXml, context);
  const bodyXml = getFirstXmlElement(documentXml, "w:body") || documentXml;
  const bodyHtml = await renderDocxBlocksHtml(bodyXml, context);
  const messages = [
    ...(Array.isArray(extraMessages) ? extraMessages : []),
    {
      type: "info",
      message: "Korišten je SafeNexus OOXML konverter za očuvanje Word boja, tablica i stilova.",
    },
  ];
  return {
    html: ensureConvertedWordHtmlDocument(
      `<section class="sn-word-document sn-word-ooxml" data-source="${escapeTemplateHtml(fileName)}">
${bodyHtml || "<p>&nbsp;</p>"}
</section>`,
      {
        fileName,
        engine: "ooxml",
        messages,
        metadata: {
          ...metadata,
          ...chrome,
        },
      },
    ),
    engine: "ooxml",
    messages,
  };
}

function buildConvertedWordLayoutStyles(engine = "", metadata = {}) {
  const page = metadata?.page && typeof metadata.page === "object" ? metadata.page : {};
  const pageSize = Number.isFinite(page.widthPt) && Number.isFinite(page.heightPt)
    ? `${cssLengthPt(page.widthPt)} ${cssLengthPt(page.heightPt)}`
    : "A4";
  const pageMargins = [page.marginTopPt, page.marginRightPt, page.marginBottomPt, page.marginLeftPt]
    .map((entry, index) => cssLengthPt(entry, index % 2 === 0 ? "16mm" : "16mm"))
    .join(" ");
  const pageWidth = Number.isFinite(page.widthPt) ? cssLengthPt(page.widthPt) : "210mm";
  const pageHeight = Number.isFinite(page.heightPt) ? cssLengthPt(page.heightPt) : "297mm";
  const marginTop = cssLengthPt(page.marginTopPt, "16mm");
  const marginRight = cssLengthPt(page.marginRightPt, "16mm");
  const marginBottom = cssLengthPt(page.marginBottomPt, "16mm");
  const marginLeft = cssLengthPt(page.marginLeftPt, "16mm");
  const headerTop = cssLengthPt(page.headerTopPt, "12mm");
  const footerBottom = cssLengthPt(page.footerBottomPt, "12mm");
  const defaultFont = clean(metadata?.defaultFont) || "Arial";
  const defaultFontSize = Number.isFinite(metadata?.defaultFontSize) ? cssLengthPt(metadata.defaultFontSize) : "11pt";
  return `
  <style data-safe-nexus-word-conversion>
    @page { size: ${pageSize}; margin: ${pageMargins}; }
    html { background: #f3f4f6; }
    body {
      background: #f3f4f6;
      color: #111827;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    :root {
      --sn-word-page-width: ${pageWidth};
      --sn-word-page-height: ${pageHeight};
      --sn-word-page-margin-top: ${marginTop};
      --sn-word-page-margin-right: ${marginRight};
      --sn-word-page-margin-bottom: ${marginBottom};
      --sn-word-page-margin-left: ${marginLeft};
      --sn-word-page-header-top: ${headerTop};
      --sn-word-page-footer-bottom: ${footerBottom};
    }
    table { border-collapse: collapse; border-spacing: 0; }
    img { max-width: 100%; height: auto; }
    .sn-word-pages {
      background: #f3f4f6;
      box-sizing: border-box;
      min-height: 100vh;
      padding: 24px;
    }
    .sn-word-page {
      background: #fff;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      margin: 0 auto 24px;
      min-height: var(--sn-word-page-height);
      overflow: visible;
      padding: var(--sn-word-page-margin-top) var(--sn-word-page-margin-right) var(--sn-word-page-margin-bottom) var(--sn-word-page-margin-left);
      position: relative;
      width: var(--sn-word-page-width);
    }
    .sn-word-page:last-child { margin-bottom: 0; }
    .sn-word-page-header,
    .sn-word-page-footer {
      align-self: stretch;
      flex: 0 0 auto;
      margin: 0;
      max-width: 100%;
      position: relative;
      z-index: 2;
    }
    .sn-word-page-header {
      margin-top: calc(var(--sn-word-page-header-top) - var(--sn-word-page-margin-top));
      text-align: center;
    }
    .sn-word-page-footer {
      margin-bottom: calc(var(--sn-word-page-footer-bottom) - var(--sn-word-page-margin-bottom));
      margin-top: auto;
    }
    .sn-word-page-header .sn-word-table,
    .sn-word-page-footer .sn-word-table {
      margin-bottom: 0;
      margin-top: 0;
    }
    .sn-word-page-header .sn-word-paragraph,
    .sn-word-page-footer .sn-word-paragraph,
    .sn-word-page-header .sn-word-document p,
    .sn-word-page-footer .sn-word-document p {
      margin-bottom: 0;
      margin-top: 0;
      min-height: 0;
    }
    .sn-word-page-header img,
    .sn-word-page-footer img {
      display: block;
      max-width: 100%;
    }
    .sn-word-page-header img {
      margin-left: auto;
      margin-right: auto;
    }
    .sn-word-page-number,
    .sn-word-page-count {
      display: inline;
      white-space: nowrap;
    }
    .sn-word-page-number:empty::before {
      content: "{{PAGE}}";
    }
    .sn-word-page-count:empty::before {
      content: "{{NUMPAGES}}";
    }
    .sn-word-page-body {
      flex: 1 1 auto;
      min-height: 0;
      position: relative;
      z-index: 1;
    }
    .sn-word-page-body > .sn-word-document,
    .sn-word-page-header > .sn-word-document,
    .sn-word-page-footer > .sn-word-document {
      margin: 0;
      max-width: none;
    }
    .sn-word-document {
      color: #172033;
      font-family: ${defaultFont}, Arial, "DejaVu Sans", sans-serif;
      font-size: ${defaultFontSize};
      line-height: 1.48;
      max-width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }
    .sn-word-document h1,
    .sn-word-document h2,
    .sn-word-document h3 {
      margin: 12px 0 6px;
      line-height: 1.22;
      color: #111827;
    }
    .sn-word-document h1 { font-size: 24px; }
    .sn-word-document h2 { font-size: 18px; }
    .sn-word-document h3 { font-size: 15px; }
    .sn-word-document p { margin: 0 0 7px; }
    .sn-word-paragraph { min-height: 1em; overflow-wrap: anywhere; position: relative; }
    .sn-word-tab { display: inline-block; width: 2em; }
    .sn-word-hyperlink { color: #1155cc; text-decoration: underline; }
    .sn-word-list-line { display: flex; gap: 8px; align-items: baseline; }
    .sn-word-list-marker { min-width: 24px; color: inherit; }
    .sn-word-subtitle { color: #475569; font-size: 14px; }
    .sn-word-document ul,
    .sn-word-document ol { margin: 4px 0 9px 22px; padding: 0; }
    .sn-word-document li { margin: 2px 0; }
    .sn-word-document blockquote {
      margin: 8px 0;
      padding: 8px 12px;
      border-left: 3px solid #94a3b8;
      color: #475569;
      background: #f8fafc;
    }
    .sn-word-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px;
      break-inside: auto;
    }
    .sn-word-table th,
    .sn-word-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      vertical-align: top;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .sn-word-table th {
      background: #eef5f2;
      font-weight: 700;
    }
    .sn-word-ooxml-table {
      border-collapse: collapse;
      margin: 0;
      width: auto;
    }
    .sn-word-ooxml-table th,
    .sn-word-ooxml-table td {
      background: transparent;
      border: none;
      padding: 0;
      vertical-align: top;
    }
    .sn-word-ooxml-table .sn-word-paragraph {
      margin: 0;
      min-height: 0;
    }
    .sn-word-page-break {
      break-before: page;
      page-break-before: always;
    }
    .sn-word-floating-shape {
      display: block;
      position: absolute;
    }
    @media print {
      html { background: #fff; }
      body { margin: 0; }
      .sn-word-pages {
        background: #fff;
        min-height: 0;
        padding: 0;
      }
      .sn-word-page {
        box-shadow: none;
        break-after: page;
        margin: 0;
        min-height: auto;
        padding: 0;
        width: auto;
      }
      .sn-word-page-header { margin-top: 0; }
      .sn-word-page-footer { margin-bottom: 0; }
      .sn-word-page:last-child { break-after: auto; }
      .sn-word-document { max-width: none; margin: 0; }
    }
  </style>
  <!-- SafeNexus Word conversion engine: ${escapeTemplateHtml(engine || "unknown")} -->
  `.trim();
}

function stripConvertedWordPageBreakBeforeStyle(openingTag = "") {
  return String(openingTag || "").replace(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i, (match, quote, styleValue) => {
    const nextStyle = String(styleValue || "")
      .split(";")
      .map((declaration) => declaration.trim())
      .filter((declaration) => declaration && !/^(?:break-before|page-break-before)\s*:/i.test(declaration))
      .join(";");
    return nextStyle ? ` style=${quote}${nextStyle}${quote}` : "";
  });
}

function normalizeConvertedWordPageBreaks(source = "") {
  return String(source || "").replace(
    /<(p|div|section|article|table|h[1-6]|ul|ol)\b[^>]*>/gi,
    (openingTag) => {
      const styleMatch = openingTag.match(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/i);
      const styleValue = styleMatch?.[2] || "";
      if (!/(^|;)\s*(?:break-before\s*:\s*page|page-break-before\s*:\s*always)\b/i.test(styleValue)) {
        return openingTag;
      }
      return `<span class="sn-word-page-break"></span>${stripConvertedWordPageBreakBeforeStyle(openingTag)}`;
    },
  );
}

function splitConvertedWordSourceIntoPages(source = "") {
  const parts = normalizeConvertedWordPageBreaks(source)
    .split(/<span\b[^>]*class\s*=\s*["'][^"']*\bsn-word-page-break\b[^"']*["'][^>]*>\s*<\/span>/gi)
    .map((part) => clean(part))
    .filter(Boolean);
  return parts.length > 0 ? parts : [source || "<p>&nbsp;</p>"];
}

function wrapConvertedWordFragmentInPages(source = "", metadata = {}, engine = "") {
  if (/\bsn-word-pages\b/i.test(source)) {
    return source;
  }
  const headerHtml = clean(metadata?.headerHtml);
  const footerHtml = clean(metadata?.footerHtml);
  const floatingShapesHtml = clean(metadata?.bodyFloatingShapesHtml);
  const pages = splitConvertedWordSourceIntoPages(source);
  return `<main class="sn-word-pages" data-engine="${escapeTemplateHtml(engine || "unknown")}">
${pages.map((pageContent, index) => `<section class="sn-word-page" data-page-index="${index + 1}">
${index === 0 && floatingShapesHtml ? `${floatingShapesHtml}\n` : ""}${headerHtml}
<div class="sn-word-page-body">
${pageContent}
</div>
${footerHtml}
</section>`).join("\n")}
</main>`;
}

function wrapConvertedWordFullHtmlBodyInPages(source = "", metadata = {}, engine = "") {
  if (/\bsn-word-pages\b/i.test(source)) {
    return source;
  }
  return String(source || "").replace(/(<body\b[^>]*>)([\s\S]*?)(<\/body>)/i, (match, openBody, bodyContent, closeBody) => {
    const wrappedBody = wrapConvertedWordFragmentInPages(clean(bodyContent) || "<p>&nbsp;</p>", metadata, engine);
    return `${openBody}\n${wrappedBody}\n${closeBody}`;
  });
}

function ensureConvertedWordHtmlDocument(html = "", {
  fileName = "word-template.html",
  engine = "",
  messages = [],
  metadata = {},
} = {}) {
  const title = sanitizeGeneratedDocumentFileName(fileName || "word-template", {
    fallback: "word-template",
    extension: "html",
  }).replace(/\.html?$/i, "");
  const conversionNotes = (Array.isArray(messages) ? messages : [])
    .map((message) => clean(message?.message || message))
    .filter(Boolean)
    .slice(0, 12);
  const notesHtml = conversionNotes.length > 0
    ? `<!-- Word conversion notes: ${conversionNotes.map(escapeTemplateHtml).join(" | ")} -->`
    : "";
  const layoutStyles = buildConvertedWordLayoutStyles(engine, metadata);
  let source = normalizeConvertedWordPlaceholders(String(html ?? "").replace(/^\uFEFF/, "").trim());

  if (!source) {
    source = "<p>&nbsp;</p>";
  }

  if (!/<!doctype\s+html|<html[\s>]/i.test(source)) {
    const pagedSource = wrapConvertedWordFragmentInPages(source, metadata, engine);
    return `<!doctype html>
<html lang="hr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeTemplateHtml(title || "Zapisnik")}</title>
  ${buildHtmlTemplateDefaultStyles()}
  ${notesHtml}
  ${layoutStyles}
</head>
<body class="safe-nexus-template-body">
${pagedSource}
</body>
</html>`;
  }

  source = source
    .replace(/<meta\b[^>]*charset\s*=\s*["']?\s*[^"'>\s;]+[^>]*>/gi, "")
    .replace(/charset\s*=\s*[^"'>\s;]+/gi, "charset=utf-8");

  if (!/<head[\s>]/i.test(source)) {
    source = source.replace(/<html\b([^>]*)>/i, `<html$1>\n<head></head>`);
  }
  if (/<head[\s>]/i.test(source)) {
    source = source.replace(/<head\b([^>]*)>/i, `<head$1>\n<meta charset="utf-8">`);
    if (!/<title[\s>]/i.test(source)) {
      source = source.replace(/<\/head>/i, `<title>${escapeTemplateHtml(title)}</title>\n</head>`);
    }
    if (!/<style\b[^>]*data-safe-nexus-word-conversion/i.test(source)) {
      source = source.replace(/<\/head>/i, `${notesHtml ? `${notesHtml}\n` : ""}${layoutStyles}\n</head>`);
    } else if (notesHtml) {
      source = source.replace(/<\/head>/i, `${notesHtml}\n</head>`);
    }
  }
  if (/<html\b(?![^>]*\blang=)([^>]*)>/i.test(source)) {
    source = source.replace(/<html\b([^>]*)>/i, `<html lang="hr"$1>`);
  }
  if (/<body\b([^>]*)class=(["'])(.*?)\2([^>]*)>/i.test(source)) {
    source = source.replace(/<body\b([^>]*)class=(["'])(.*?)\2([^>]*)>/i, (match, before, quote, className, after) => {
      const classes = String(className || "").split(/\s+/).filter(Boolean);
      if (!classes.includes("safe-nexus-template-body")) {
        classes.push("safe-nexus-template-body");
      }
      return `<body${before}class=${quote}${classes.join(" ")}${quote}${after}>`;
    });
  } else if (/<body\b/i.test(source)) {
    source = source.replace(/<body\b([^>]*)>/i, `<body class="safe-nexus-template-body"$1>`);
  }

  return wrapConvertedWordFullHtmlBodyInPages(source, metadata, engine);
}

function normalizeMammothConvertedWordHtmlFragment(html = "") {
  return String(html || "")
    .replace(/<a\b[^>]*\bid=(["'])(?:_?MON_[^"']+|_?GoBack)\1[^>]*>\s*<\/a>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "<p>&nbsp;</p>")
    .replace(/<table\b([^>]*)>/gi, (match, attributes = "") => {
      if (/\bclass\s*=/.test(attributes)) {
        return `<table${attributes.replace(/\bclass\s*=\s*(["'])(.*?)\1/i, (classMatch, quote, className) => {
          const nextClassName = String(className || "").split(/\s+/).includes("sn-word-table")
            ? className
            : `${className} sn-word-table`.trim();
          return ` class=${quote}${nextClassName}${quote}`;
        })}>`;
      }
      return `<table class="sn-word-table"${attributes}>`;
    })
    .trim();
}

function buildMammothConvertedWordHtmlDocument({
  bodyHtml = "",
  sourceFileName = "",
  messages = [],
  metadata = {},
} = {}) {
  const safeBody = normalizeMammothConvertedWordHtmlFragment(bodyHtml);
  const safeTitle = sanitizeGeneratedDocumentFileName(sourceFileName || "word-template", {
    fallback: "word-template",
    extension: "html",
  }).replace(/\.html?$/i, "");
  return ensureConvertedWordHtmlDocument(
    `<section class="sn-word-document" data-source="${escapeTemplateHtml(safeTitle)}">
${safeBody || "<p>&nbsp;</p>"}
</section>`,
    {
      fileName: sourceFileName || "word-template.html",
      engine: "mammoth",
      messages,
      metadata,
    },
  );
}

async function resolveConvertedHtmlPath(tempRoot = "", inputBaseName = "", generatedHtmlEntries = []) {
  const sourceBaseName = inputBaseName.replace(/\.(docx|dotx)$/i, "");
  const expectedBaseName = sanitizeFileBaseName(sourceBaseName, "").toLowerCase();
  const expectedNames = [".html", ".htm", ".xhtml"].map((extension) => join(
    tempRoot,
    sanitizeGeneratedDocumentFileName(sourceBaseName, {
      fallback: "word-template",
      extension: extension.slice(1),
    }),
  ));

  for (const expectedPath of expectedNames) {
    if (await fileExists(expectedPath)) {
      return expectedPath;
    }
  }

  return generatedHtmlEntries.find((candidatePath) => (
    sanitizeFileBaseName(basename(candidatePath, extname(candidatePath)), "").toLowerCase() === expectedBaseName
  )) || generatedHtmlEntries.find((candidatePath) => (
    sanitizeFileBaseName(basename(candidatePath, extname(candidatePath)), "").toLowerCase().includes(expectedBaseName)
  )) || generatedHtmlEntries[0] || "";
}

async function convertWordBufferToHtmlWithLibreOffice(buffer = Buffer.alloc(0), {
  fileName = "word-template.docx",
} = {}) {
  const sofficeCommand = await resolveSofficeCommandCached();
  if (!sofficeCommand) {
    throw new Error("LibreOffice nije dostupan za Word -> HTML konverziju.");
  }

  return await enqueueSofficeConversion(async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "taskflow-word-html-"));
    const officeProfileDir = await getSharedSofficeProfileDir();
    const inputBaseName = makeUniqueSofficeInputFileName(fileName, 0, new Set());
    const inputPath = join(tempRoot, inputBaseName);

    try {
      await writeFile(inputPath, buffer);
      const commandResult = await runCommand(sofficeCommand, [
        "--headless",
        "--nologo",
        "--nodefault",
        "--nofirststartwizard",
        `-env:UserInstallation=${pathToFileURL(officeProfileDir).href}`,
        "--convert-to",
        "html",
        "--outdir",
        tempRoot,
        inputPath,
      ], {
        cwd: tempRoot,
        env: buildSofficeRuntimeEnv(tempRoot),
        timeoutMs: SOFFICE_CONVERSION_TIMEOUT_MS,
      });
      const generatedHtmlEntries = (await readdir(tempRoot, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && [".html", ".htm", ".xhtml"].includes(extname(entry.name).toLowerCase()))
        .map((entry) => join(tempRoot, entry.name));
      const outputPath = await resolveConvertedHtmlPath(tempRoot, inputBaseName, generatedHtmlEntries);

      if (!outputPath || !await fileExists(outputPath)) {
        const directoryEntries = await readdir(tempRoot).catch(() => []);
        const details = [
          "LibreOffice nije vratio HTML datoteku.",
          clean(commandResult.stdout) ? `STDOUT: ${clean(commandResult.stdout)}` : "",
          clean(commandResult.stderr) ? `STDERR: ${clean(commandResult.stderr)}` : "",
          directoryEntries.length > 0 ? `Sadrzaj temp direktorija: ${directoryEntries.join(", ")}` : "",
        ].filter(Boolean).join(" ");
        throw new Error(details || "LibreOffice nije vratio HTML datoteku.");
      }

      const rawHtmlBuffer = await readFile(outputPath);
      const inlinedHtml = await inlineLibreOfficeHtmlAssets(
        decodeHtmlBuffer(rawHtmlBuffer),
        outputPath,
        tempRoot,
      );
      const polishedHtml = polishLibreOfficeConvertedHtml(inlinedHtml);
      const metadata = await extractWordDocumentMetadata(buffer);
      const chromeMetadata = await extractWordDocumentChromeMetadata(buffer, {
        includeBodyFloatingShapes: true,
      }).catch(() => ({}));
      return {
        html: ensureConvertedWordHtmlDocument(polishedHtml, {
          fileName,
          engine: "libreoffice",
          messages: [],
          metadata: {
            ...metadata,
            ...chromeMetadata,
          },
        }),
        engine: "libreoffice",
        messages: [],
      };
    } finally {
      await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
    }
  });
}

async function convertWordBufferToHtmlWithMammoth(buffer = Buffer.alloc(0), {
  fileName = "word-template.docx",
  extraMessages = [],
} = {}) {
  const metadata = await extractWordDocumentMetadata(buffer);
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: WORD_HTML_STYLE_MAP,
      includeDefaultStyleMap: true,
      includeEmbeddedStyleMap: true,
      ignoreEmptyParagraphs: false,
      convertImage: mammoth.images.inline(async (image) => {
        const base64 = await image.read("base64");
        return {
          src: `data:${image.contentType};base64,${base64}`,
        };
      }),
    },
  );
  const mammothMessages = (Array.isArray(result.messages) ? result.messages : [])
    .map((message) => ({
      type: clean(message?.type || "info"),
      message: clean(message?.message || message),
    }))
    .filter((message) => message.message);
  const messages = [...(Array.isArray(extraMessages) ? extraMessages : []), ...mammothMessages];
  return {
    html: buildMammothConvertedWordHtmlDocument({
      bodyHtml: result.value,
      sourceFileName: fileName,
      messages,
      metadata,
    }),
    engine: "mammoth",
    messages,
  };
}

export async function convertWordBufferToHtmlTemplate(buffer = Buffer.alloc(0), {
  fileName = "word-template.docx",
  allowLibreOfficeFallback = true,
} = {}) {
  const safeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer ?? []);
  if (safeBuffer.length === 0) {
    throw new Error("Word dokument je prazan ili nije dostupan.");
  }

  const safeFileName = fileName || "word-template.docx";
  const cacheKey = buildWordHtmlTemplateCacheKey({
    buffer: safeBuffer,
    fileName: safeFileName,
    allowLibreOfficeFallback,
  });
  const cached = getCachedWordHtmlTemplate(cacheKey);
  if (cached) {
    return cached;
  }

  let converted = null;
  try {
    converted = await convertWordBufferToHtmlWithDocxXml(safeBuffer, {
      fileName: safeFileName,
    });
  } catch (ooxmlError) {
    const layoutFallbackMessage = {
      type: "warning",
      message: `SafeNexus OOXML konverter nije uspio: ${clean(ooxmlError?.message) || "nepoznata greska"}`,
    };
    console.warn("SafeNexus OOXML Word -> HTML conversion failed.", ooxmlError);
    if (!allowLibreOfficeFallback) {
      converted = await convertWordBufferToHtmlWithMammoth(safeBuffer, {
        fileName: safeFileName,
        extraMessages: [layoutFallbackMessage],
      });
      cacheWordHtmlTemplate(cacheKey, converted);
      return converted;
    }

    layoutFallbackMessage.message = `${layoutFallbackMessage.message} Koristen je LibreOffice layout fallback.`;
    try {
      converted = await convertWordBufferToHtmlWithLibreOffice(safeBuffer, {
        fileName: safeFileName,
      });
    } catch (libreOfficeFallbackError) {
      const mammothFallbackMessage = {
        type: "warning",
        message: `LibreOffice layout fallback nije uspio, koristen je Mammoth tekstualni fallback: ${clean(libreOfficeFallbackError?.message) || "nepoznata greska"}`,
      };
      console.warn("LibreOffice Word -> HTML conversion failed, falling back to mammoth.", libreOfficeFallbackError);
      converted = await convertWordBufferToHtmlWithMammoth(safeBuffer, {
        fileName: safeFileName,
        extraMessages: [layoutFallbackMessage, mammothFallbackMessage],
      });
    }
  }
  cacheWordHtmlTemplate(cacheKey, converted);
  return converted;
}

export function buildHtmlFromTemplateBuffer(templateBuffer, placeholders = {}, options = {}) {
  const safeBuffer = Buffer.isBuffer(templateBuffer)
    ? templateBuffer
    : Buffer.from(templateBuffer ?? []);

  if (safeBuffer.length === 0) {
    throw new Error("HTML predložak je prazan.");
  }

  const safePlaceholders = placeholders && typeof placeholders === "object" && !Array.isArray(placeholders)
    ? placeholders
    : {};
  const lookup = new Map(
    Object.entries(safePlaceholders)
      .map(([key, value]) => [clean(key), value])
      .filter(([key]) => Boolean(key)),
  );
  const templateHtml = decodeHtmlBuffer(safeBuffer);
  const renderedHtml = templateHtml.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (match, token) => {
    const key = clean(token);
    if (!lookup.has(key)) {
      return "";
    }

    const value = lookup.get(key);
    const specialHtml = buildHtmlTemplateSpecialPlaceholder(value);
    return specialHtml === null ? formatTemplateHtmlText(value) : specialHtml;
  });

  return buildHtmlTemplateDocument(repairHtmlTextEncoding(renderedHtml), {
    title: options.title || options.fileName || "Zapisnik",
  });
}

export async function buildPdfFromHtmlTemplateBuffer(templateBuffer, placeholders = {}, options = {}) {
  const html = buildHtmlFromTemplateBuffer(templateBuffer, placeholders, options);
  return convertHtmlToPdfBuffer(html, {
    fileName: sanitizeGeneratedDocumentFileName(
      options.fileName || options.title || "zapisnik",
      { fallback: "zapisnik", extension: "html" },
    ),
    title: options.title || options.fileName || "Zapisnik",
  });
}

function extractHtmlDocumentHead(html = "") {
  return String(html || "").match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "";
}

function extractHtmlDocumentBody(html = "") {
  return String(html || "").match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || String(html || "");
}

function buildCombinedHtmlTemplateDocument(documents = [], { title = "Zapisnici" } = {}) {
  const renderedDocuments = (Array.isArray(documents) ? documents : [])
    .map((entry) => String(entry?.html || "").trim())
    .filter(Boolean);

  const headHtml = renderedDocuments
    .map((html, index) => {
      const head = extractHtmlDocumentHead(html).trim();
      return head ? `<!-- SafeNexus template ${index + 1} head -->\n${head}` : "";
    })
    .filter(Boolean)
    .join("\n");
  const bodyHtml = renderedDocuments
    .map((html, index) => `<section class="safe-nexus-html-batch-entry" data-batch-entry="${index + 1}">${extractHtmlDocumentBody(html)}</section>`)
    .join("\n");

  return `<!doctype html>
<html lang="hr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeTemplateHtml(title || "Zapisnici")}</title>
  <style>
    html,body{margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    *{box-sizing:border-box}
    .safe-nexus-html-batch-entry{break-after:page;page-break-after:always}
    .safe-nexus-html-batch-entry:last-child{break-after:auto;page-break-after:auto}
  </style>
  ${headHtml}
</head>
<body class="safe-nexus-template-body safe-nexus-template-batch-body">
${bodyHtml}
</body>
</html>`;
}

export async function buildPdfFromHtmlTemplateBatchEntries(entries = [], options = {}) {
  const renderedDocuments = (Array.isArray(entries) ? entries : [])
    .map((entry, index) => ({
      html: buildHtmlFromTemplateBuffer(entry.templateBuffer, entry.placeholders ?? {}, {
        fileName: entry.fileName || options.fileName || `zapisnik-${index + 1}.html`,
        title: entry.title || options.title || "Zapisnik",
      }),
    }));

  if (renderedDocuments.length === 0) {
    throw new Error("Batch HTML PDF nema nijedan HTML predlozak.");
  }

  const html = renderedDocuments.length === 1
    ? renderedDocuments[0].html
    : buildCombinedHtmlTemplateDocument(renderedDocuments, {
      title: options.title || "Zapisnici",
    });

  return convertHtmlToPdfBuffer(html, {
    fileName: sanitizeGeneratedDocumentFileName(
      options.fileName || "zapisnici-batch",
      { fallback: "zapisnici-batch", extension: "html" },
    ),
    title: options.title || "Zapisnici",
  });
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

function resolvePdfSignatureFieldRect(spec = {}, page, index = 0, totalFields = 1) {
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const fallbackHeight = 38;
  const sideMargin = 42;
  const columnGap = 18;
  const columnCount = Math.max(1, Math.min(2, Number(totalFields || 1) > 1 ? 2 : 1));
  const columnWidth = columnCount > 1
    ? Math.max(180, (pageWidth - (sideMargin * 2) - columnGap) / 2)
    : Math.max(220, pageWidth - (sideMargin * 2));
  const fallbackWidth = Math.max(190, Math.min(240, columnWidth - 18));
  const fallbackColumn = columnCount === 1 ? 1 : index % 2;
  const fallbackRow = columnCount === 1 ? 0 : Math.floor(index / 2);
  const fallbackX = columnCount === 1
    ? Math.max(36, pageWidth - fallbackWidth - 54)
    : sideMargin + (fallbackColumn * (columnWidth + columnGap)) + Math.max(0, (columnWidth - fallbackWidth) / 2);
  const fallbackY = Math.max(96, 126 + (fallbackRow * (fallbackHeight + 18)));
  const width = Number.isFinite(Number(spec.width)) && Number(spec.width) > 20
    ? Math.min(Number(spec.width), pageWidth - 24)
    : fallbackWidth;
  const height = Number.isFinite(Number(spec.height)) && Number(spec.height) > 12
    ? Math.min(Number(spec.height), pageHeight - 24)
    : fallbackHeight;
  const x = Number.isFinite(Number(spec.x))
    ? Math.min(Math.max(12, Number(spec.x)), Math.max(12, pageWidth - width - 12))
    : Math.min(fallbackX, Math.max(12, pageWidth - width - 12));
  const y = Number.isFinite(Number(spec.y))
    ? Math.min(Math.max(12, Number(spec.y)), Math.max(12, pageHeight - height - 12))
    : Math.min(fallbackY, Math.max(12, pageHeight - height - 12));

  return { x, y, width, height };
}

function resolvePdfSignatureFieldPageIndex(spec = {}, pageCount = 1) {
  const rawPageIndex = Number.isFinite(Number(spec.pageIndex))
    ? Number(spec.pageIndex)
    : Number(spec.page || 0) - 1;
  if (!Number.isFinite(rawPageIndex) || rawPageIndex < 0) {
    return Math.max(0, pageCount - 1);
  }
  return Math.min(Math.max(0, Math.round(rawPageIndex)), Math.max(0, pageCount - 1));
}

function drawPdfSignatureFieldPlaceholder(page, rect, spec = {}, fonts = {}) {
  page.drawRectangle({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    borderColor: rgb(0.48, 0.38, 1),
    borderWidth: 0.8,
    color: rgb(0.985, 0.99, 1),
    opacity: 0.96,
  });
  page.drawText("Kvalificirani digitalni potpis", {
    x: rect.x + 10,
    y: rect.y + rect.height - 17,
    size: 8.5,
    font: fonts.bold,
    color: rgb(0.35, 0.28, 0.88),
    maxWidth: Math.max(40, rect.width - 20),
  });
  const signerLabel = clean(spec.label || spec.roleLabel);
  if (signerLabel) {
    page.drawText(signerLabel, {
      x: rect.x + 10,
      y: rect.y + 9,
      size: 7.5,
      font: fonts.regular,
      color: rgb(0.24, 0.29, 0.38),
      maxWidth: Math.max(40, rect.width - 20),
    });
  }
}

function addPdfSignatureField(pdfDoc, page, rect, fieldName = "") {
  const context = pdfDoc.context;
  const acroForm = pdfDoc.catalog.getOrCreateAcroForm();
  acroForm.dict.set(PDFName.of("SigFlags"), PDFNumber.of(3));

  const fieldDict = context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Widget"),
    FT: PDFName.of("Sig"),
    T: PDFString.of(fieldName),
    Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
    F: PDFNumber.of(4),
    P: page.ref,
  });
  const fieldRef = context.register(fieldDict);
  page.node.addAnnot(fieldRef);
  acroForm.addField(fieldRef);
}

async function embedPdfSignaturePlaceholderFonts(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(PDF_FONTS.regular),
    readFile(PDF_FONTS.bold),
  ]);
  return {
    regular: await pdfDoc.embedFont(regularBytes, { subset: true }),
    bold: await pdfDoc.embedFont(boldBytes, { subset: true }),
  };
}

export async function addPdfSignatureFieldsToBuffer(pdfBuffer = Buffer.alloc(0), signatureFields = []) {
  const safeBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer ?? []);
  const normalizedFields = (Array.isArray(signatureFields) ? signatureFields : [])
    .map((field) => normalizePdfSignatureFieldSpec({
      ...field,
      signatureMode: "digital",
    }))
    .filter(Boolean);

  if (safeBuffer.length === 0 || normalizedFields.length === 0) {
    return safeBuffer;
  }

  const pdfDoc = await PdfLibDocument.load(safeBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  if (pages.length === 0) {
    return safeBuffer;
  }

  const form = pdfDoc.getForm();
  const existingFieldNames = new Set(form.getFields().map((field) => field.getName()));
  const fonts = await embedPdfSignaturePlaceholderFonts(pdfDoc);
  const addedFieldNames = new Set();

  normalizedFields.forEach((field, index) => {
    if (existingFieldNames.has(field.fieldName) || addedFieldNames.has(field.fieldName)) {
      return;
    }

    const pageIndex = resolvePdfSignatureFieldPageIndex(field, pages.length);
    const page = pages[pageIndex];
    const rect = resolvePdfSignatureFieldRect(field, page, index, normalizedFields.length);
    if (field.drawPlaceholder) {
      drawPdfSignatureFieldPlaceholder(page, rect, field, fonts);
    }
    addPdfSignatureField(pdfDoc, page, rect, field.fieldName);
    addedFieldNames.add(field.fieldName);
  });

  if (addedFieldNames.size === 0) {
    return safeBuffer;
  }

  return Buffer.from(await pdfDoc.save({ useObjectStreams: false }));
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
  let currentPageIndex = 0;
  const margins = {
    top: 40,
    bottom: 40,
    left: 42,
    right: 42,
  };
  doc.on("pageAdded", () => {
    currentPageIndex += 1;
  });

  const helpers = {
    get pageNumber() {
      return currentPageIndex + 1;
    },
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

async function renderPdfSignatureGroup(doc, helpers, title, items = [], signatureFields = []) {
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
      align: "center",
    });
    doc.font("dejavu-bold").fontSize(12).fillColor("#1f2333").text(name, x + 16, y + 28, {
      width: cardWidth - 32,
      align: "center",
    });
    if (metaLines.length > 0) {
      doc.font("dejavu").fontSize(9).fillColor("#475569").text(metaLines.join("\n"), x + 16, y + 48, {
        width: cardWidth - 32,
        align: "center",
        lineGap: 1,
      });
    }

    if (signatureBuffer) {
      try {
        doc.image(signatureBuffer, x + (cardWidth - 160) / 2, y + estimatedHeight - 56, {
          fit: [160, 38],
          align: "center",
        });
      } catch {
        doc.font("dejavu").fontSize(9).fillColor("#94a3b8").text("Potpis nije moguće prikazati u PDF-u.", x + 16, y + estimatedHeight - 40, {
          width: cardWidth - 32,
          align: "center",
        });
      }
    } else if (isDigital) {
      const fieldRect = {
        x: x + 16,
        y: y + estimatedHeight - 56,
        width: Math.max(220, cardWidth - 32),
        height: 34,
      };
      doc.save();
      doc.roundedRect(fieldRect.x, fieldRect.y, fieldRect.width, fieldRect.height, 10);
      doc.lineWidth(0.8);
      doc.dash(5, { space: 3 });
      doc.strokeColor("#111111").stroke();
      doc.undash();
      doc.restore();
      doc.font("dejavu-bold").fontSize(9).fillColor("#7b61ff").text("Kvalificirani digitalni potpis", x + 28, y + estimatedHeight - 45, {
        width: Math.max(200, cardWidth - 56),
      });
      const signatureField = normalizePdfSignatureFieldSpec({
        ...item,
        x: fieldRect.x,
        y: doc.page.height - fieldRect.y - fieldRect.height,
        width: fieldRect.width,
        height: fieldRect.height,
        page: helpers.pageNumber,
        drawPlaceholder: false,
      });
      if (signatureField) {
        signatureFields.push(signatureField);
      }
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

  if (item.onePage) {
    helpers.setLayout("portrait", { forceNewPage: doc.y > doc.page.margins.top + 8 });
    const startX = doc.page.margins.left;
    const titleY = doc.y;
    const frameWidth = helpers.availableWidth;
    doc.font("dejavu-bold").fontSize(12).fillColor("#1f2333").text(title, startX, titleY, {
      width: frameWidth,
    });
    const startY = doc.y + 10;
    const frameHeight = Math.max(120, helpers.maxY - startY - 8);

    try {
      doc.image(imageBuffer, startX, startY, {
        fit: [frameWidth, frameHeight],
        align: "center",
        valign: "center",
      });
    } catch {
      doc.font("dejavu").fontSize(10).fillColor("#64748b").text(
        "Sliku nije moguće prikazati u PDF-u.",
        startX,
        startY,
        { width: frameWidth },
      );
    }

    doc.y = helpers.maxY;
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

function addRenderModelPageNumbers(doc, renderModel = {}) {
  if (typeof doc.bufferedPageRange !== "function" || typeof doc.switchToPage !== "function") {
    return;
  }

  let range;
  try {
    range = doc.bufferedPageRange();
  } catch {
    return;
  }

  const total = Number(range?.count) || 0;
  if (total <= 0) {
    return;
  }

  const prefixValue = clean(renderModel.serviceCode || renderModel.workOrderNumber || "");
  const prefix = prefixValue ? `${prefixValue} - ` : "";
  for (let pageOffset = 0; pageOffset < total; pageOffset += 1) {
    doc.switchToPage(range.start + pageOffset);
    const label = `${prefix}${pageOffset + 1}/${total}`;
    const y = doc.page.height - doc.page.margins.bottom + 14;
    doc.font("dejavu").fontSize(8.5).fillColor("#64748b").text(label, doc.page.margins.left, y, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: "right",
    });
  }
}

export async function buildPdfFromRenderModel(renderModel = {}) {
  const doc = new PDFDocument({
    autoFirstPage: true,
    bufferPages: true,
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
  const signatureFields = [];
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
        await renderPdfSignatureGroup(doc, helpers, item.title || "Potpisi", item.items || [], signatureFields);
        continue;
      }

      if (itemType === "image") {
        await renderPdfImageBlock(doc, helpers, item.title || "Slika", item);
        continue;
      }

      renderPdfFieldCard(doc, helpers, item.title || "Vrijednost", item.value || "");
    }
  }

  addRenderModelPageNumbers(doc, renderModel);
  const pdfBuffer = await pdfBufferFromDocument(doc);
  return addPdfSignatureFieldsToBuffer(pdfBuffer, signatureFields);
}

function formatOfferPdfDate(value = "") {
  const normalized = clean(value);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }

  const localizedMatch = normalized.match(/^(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{4})\.?$/);
  if (!localizedMatch) {
    return normalized || "—";
  }

  return [
    localizedMatch[1].padStart(2, "0"),
    localizedMatch[2].padStart(2, "0"),
    localizedMatch[3],
  ].join(".");
}

function formatOfferPdfCurrency(value = 0, currency = "EUR") {
  const amount = Number(value ?? 0) || 0;
  const currencyCode = (clean(currency) || "EUR").toUpperCase();

  try {
    const formattedAmount = new Intl.NumberFormat("hr-HR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formattedAmount} ${currencyCode}`;
  } catch {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

const REPORT_STATUS_BAR_COLORS = ["#2563eb", "#16a34a", "#d97706", "#0f766e", "#64748b", "#7c3aed"];

function addDaysToReportDateKey(dateKey = "", days = 0) {
  const normalized = clean(dateKey);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return "";
  }

  const date = new Date(`${normalized}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getReportDateKey(value = "") {
  const normalized = clean(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function formatReportDateTime(value = "") {
  const parsed = value ? new Date(value) : new Date();

  try {
    return new Intl.DateTimeFormat("hr-HR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Zagreb",
    }).format(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
  } catch {
    return formatOfferPdfDate(getReportDateKey(value));
  }
}

function getReportArray(value) {
  return Array.isArray(value) ? value : [];
}

function countReportItems(items = [], predicate = () => true) {
  return getReportArray(items).filter(predicate).length;
}

function renderReportSectionTitle(doc, helpers, title, subtitle = "") {
  helpers.ensureSpace(subtitle ? 48 : 32);
  doc.font("dejavu-bold").fontSize(13).fillColor("#111827").text(title, {
    width: helpers.availableWidth,
  });

  if (subtitle) {
    doc.moveDown(0.12);
    doc.font("dejavu").fontSize(9.5).fillColor("#64748b").text(subtitle, {
      width: helpers.availableWidth,
    });
  }

  doc.moveDown(0.5);
}

function renderReportMetricGrid(doc, helpers, metrics = []) {
  const safeMetrics = getReportArray(metrics).filter((item) => clean(item?.label));
  const gap = 10;
  const columns = 4;
  const cardWidth = (helpers.availableWidth - gap * (columns - 1)) / columns;
  const cardHeight = 62;

  for (let index = 0; index < safeMetrics.length; index += columns) {
    const rowItems = safeMetrics.slice(index, index + columns);
    helpers.ensureSpace(cardHeight + 12);
    const y = doc.y;

    rowItems.forEach((metric, columnIndex) => {
      const x = doc.page.margins.left + columnIndex * (cardWidth + gap);
      doc.roundedRect(x, y, cardWidth, cardHeight, 10).fillAndStroke("#f8fbff", "#d8e4f5");
      doc.font("dejavu").fontSize(8.5).fillColor("#64748b").text(clean(metric.label).toUpperCase(), x + 10, y + 10, {
        width: cardWidth - 20,
      });
      doc.font("dejavu-bold").fontSize(18).fillColor("#0f172a").text(String(metric.value ?? 0), x + 10, y + 28, {
        width: cardWidth - 20,
      });
    });

    doc.y = y + cardHeight + 12;
  }
}

function renderReportStatusBars(doc, helpers, statusRows = []) {
  const safeRows = getReportArray(statusRows);
  const total = safeRows.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const labelWidth = 132;
  const countWidth = 70;
  const barWidth = helpers.availableWidth - labelWidth - countWidth - 18;

  renderReportSectionTitle(doc, helpers, "Status radnih naloga", "Bar prikaz broja RN po statusu.");

  safeRows.forEach((row, index) => {
    const count = Number(row.count) || 0;
    const percent = total > 0 ? count / total : 0;
    helpers.ensureSpace(28);
    const y = doc.y;
    doc.font("dejavu").fontSize(9.5).fillColor("#334155").text(clean(row.label), doc.page.margins.left, y + 3, {
      width: labelWidth,
    });
    doc.roundedRect(doc.page.margins.left + labelWidth, y + 4, barWidth, 9, 5).fill("#e8eef7");
    if (count > 0) {
      doc.roundedRect(doc.page.margins.left + labelWidth, y + 4, Math.max(8, barWidth * percent), 9, 5)
        .fill(REPORT_STATUS_BAR_COLORS[index % REPORT_STATUS_BAR_COLORS.length]);
    }
    doc.font("dejavu-bold").fontSize(9.5).fillColor("#0f172a").text(`${count} (${Math.round(percent * 100)}%)`, doc.page.margins.left + labelWidth + barWidth + 12, y + 1, {
      width: countWidth,
      align: "right",
    });
    doc.y = y + 24;
  });

  doc.moveDown(0.45);
}

function renderReportTable(doc, helpers, title, columns = [], rows = [], { emptyMessage = "Nema podataka." } = {}) {
  const safeColumns = getReportArray(columns).filter((column) => clean(column?.label));
  const safeRows = getReportArray(rows);

  renderReportSectionTitle(doc, helpers, title);

  if (safeRows.length === 0 || safeColumns.length === 0) {
    renderPdfFieldCard(doc, helpers, title, emptyMessage);
    return;
  }

  const totalExplicitWidth = safeColumns.reduce((sum, column) => sum + (Number(column.width) || 0), 0);
  const columnWidths = safeColumns.map((column) => (
    Number(column.width) > 0
      ? Number(column.width)
      : Math.max(70, (helpers.availableWidth - totalExplicitWidth) / safeColumns.length)
  ));
  const scale = helpers.availableWidth / columnWidths.reduce((sum, value) => sum + value, 0);
  const widths = columnWidths.map((value) => value * scale);
  const rowPaddingY = 7;

  helpers.ensureSpace(30);
  let x = doc.page.margins.left;
  const headerY = doc.y;
  doc.roundedRect(doc.page.margins.left, headerY, helpers.availableWidth, 25, 8).fill("#eef5ff");
  safeColumns.forEach((column, index) => {
    doc.font("dejavu-bold").fontSize(8.5).fillColor("#315174").text(clean(column.label).toUpperCase(), x + 7, headerY + 8, {
      width: widths[index] - 14,
    });
    x += widths[index];
  });
  doc.y = headerY + 27;

  safeRows.forEach((row, rowIndex) => {
    const values = safeColumns.map((column, index) => normalizePdfText(row?.[column.key] ?? row?.[index] ?? ""));
    const textHeights = values.map((value, index) => doc.heightOfString(value, {
      width: widths[index] - 14,
      lineGap: 1,
    }));
    const rowHeight = Math.max(30, Math.max(...textHeights) + rowPaddingY * 2);
    helpers.ensureSpace(rowHeight + 4);
    const y = doc.y;
    doc.roundedRect(doc.page.margins.left, y, helpers.availableWidth, rowHeight, 7)
      .fill(rowIndex % 2 === 0 ? "#fbfdff" : "#f6f9fd");

    x = doc.page.margins.left;
    values.forEach((value, index) => {
      doc.font(index === 0 ? "dejavu-bold" : "dejavu").fontSize(8.8).fillColor(index === 0 ? "#0f172a" : "#334155").text(value, x + 7, y + rowPaddingY, {
        width: widths[index] - 14,
        lineGap: 1,
      });
      x += widths[index];
    });
    doc.y = y + rowHeight + 4;
  });

  doc.moveDown(0.4);
}

export async function buildDashboardCalendarReportPdfBuffer({
  user = {},
  organizationName = "",
  scopedSnapshot = {},
  generatedAt = new Date().toISOString(),
  todayKey = "",
} = {}) {
  const doc = new PDFDocument({
    autoFirstPage: true,
    size: "A4",
    layout: "portrait",
    margins: {
      top: 38,
      bottom: 38,
      left: 42,
      right: 42,
    },
    bufferPages: true,
    info: {
      Title: "SafeNexus dnevni izvjestaj",
      Author: "SafeNexus",
    },
  });

  doc.registerFont("dejavu", PDF_FONTS.regular);
  doc.registerFont("dejavu-bold", PDF_FONTS.bold);
  doc.registerFont("dejavu-italic", PDF_FONTS.italic);
  doc.font("dejavu");

  const helpers = createPdfLayoutHelpers(doc);
  const reportTodayKey = getReportDateKey(todayKey) || getReportDateKey(generatedAt) || new Date().toISOString().slice(0, 10);
  const reportEndKey = addDaysToReportDateKey(reportTodayKey, 14);
  const workOrders = getReportArray(scopedSnapshot.workOrders);
  const reminders = getReportArray(scopedSnapshot.reminders);
  const todoTasks = getReportArray(scopedSnapshot.todoTasks);
  const dashboardStats = getDashboardStats(scopedSnapshot, reportTodayKey);
  const dashboardInsights = getDashboardInsights(scopedSnapshot, reportTodayKey);
  const personName = clean(user.fullName) || [user.firstName, user.lastName].map(clean).filter(Boolean).join(" ") || clean(user.email) || "Korisnik";
  const safeOrganizationName = clean(organizationName) || clean(scopedSnapshot.currentOrganization?.name) || clean(user.organizationName) || "SafeNexus";
  const activeReminders = countReportItems(reminders, (item) => !["done", "completed", "closed"].includes(clean(item?.status).toLowerCase()));
  const openTodo = countReportItems(todoTasks, (item) => !["done", "completed", "closed"].includes(clean(item?.status).toLowerCase()));
  const statusRows = WORK_ORDER_STATUS_OPTIONS.map((option) => ({
    label: option.label,
    count: workOrders.filter((item) => item.status === option.value).length,
  }));
  const metrics = [
    { label: "Tvrtke", value: dashboardStats.companies },
    { label: "Lokacije", value: dashboardStats.locations },
    { label: "Aktivni RN", value: dashboardStats.activeWorkOrders },
    { label: "Zavrseni RN", value: dashboardStats.completedWorkOrders },
    { label: "RN u kasnjenju", value: dashboardStats.overdueWorkOrders },
    { label: "Hitni RN", value: dashboardInsights.urgentWorkOrders },
    { label: "Aktivni reminders", value: activeReminders },
    { label: "Otvoreni ToDo", value: openTodo },
    { label: "Ponude", value: getReportArray(scopedSnapshot.offers).length },
    { label: "Narudzbenice", value: getReportArray(scopedSnapshot.purchaseOrders).length },
    { label: "Vozila", value: getReportArray(scopedSnapshot.vehicles).length },
    { label: "Mjerna oprema", value: getReportArray(scopedSnapshot.measurementEquipment).length },
  ];

  helpers.ensureSpace(102);
  doc.font("dejavu-bold").fontSize(10).fillColor("#2563eb").text("SAFE NEXUS - DNEVNI IZVJESTAJ");
  doc.moveDown(0.25);
  doc.font("dejavu-bold").fontSize(22).fillColor("#111827").text("Dashboard i kalendar", {
    width: helpers.availableWidth,
  });
  doc.moveDown(0.25);
  doc.font("dejavu").fontSize(10).fillColor("#475569").text([
    safeOrganizationName,
    personName,
    `Generirano ${formatReportDateTime(generatedAt)}`,
  ].filter(Boolean).join(" · "), {
    width: helpers.availableWidth,
  });
  doc.moveDown(1);

  renderReportSectionTitle(doc, helpers, "Dashboard sazetak", `Pregled za ${formatOfferPdfDate(reportTodayKey)}.`);
  renderReportMetricGrid(doc, helpers, metrics);
  renderReportStatusBars(doc, helpers, statusRows);

  renderReportTable(
    doc,
    helpers,
    "Opterecenje izvrsitelja",
    [
      { key: "label", label: "Izvrsitelj", width: 260 },
      { key: "count", label: "RN", width: 80 },
    ],
    getReportArray(dashboardInsights.executorLoad).map((item) => ({
      label: item.label,
      count: item.count,
    })),
    { emptyMessage: "Nema dodijeljenih izvrsitelja." },
  );

  helpers.setLayout("landscape", { forceNewPage: true });
  const calendarWorkOrders = workOrders
    .filter((item) => {
      const dueDate = getReportDateKey(item.dueDate);
      return dueDate && dueDate >= reportTodayKey && dueDate <= reportEndKey;
    })
    .sort((left, right) => (
      String(left.dueDate || "").localeCompare(String(right.dueDate || ""), "hr")
      || String(left.workOrderNumber || "").localeCompare(String(right.workOrderNumber || ""), "hr", { numeric: true })
    ))
    .map((item) => ({
      date: formatOfferPdfDate(item.dueDate),
      number: item.workOrderNumber || "Bez broja",
      status: item.status || "Bez statusa",
      client: [item.companyName, item.locationName].filter(Boolean).join(" · ") || "Bez klijenta",
      executors: getWorkOrderExecutors(item).join(", ") || "Bez izvrsitelja",
    }));

  renderReportTable(
    doc,
    helpers,
    `Kalendar RN (${formatOfferPdfDate(reportTodayKey)} - ${formatOfferPdfDate(reportEndKey)})`,
    [
      { key: "date", label: "Datum", width: 80 },
      { key: "number", label: "RN", width: 82 },
      { key: "status", label: "Status", width: 110 },
      { key: "client", label: "Klijent / lokacija", width: 260 },
      { key: "executors", label: "Izvrsitelji", width: 185 },
    ],
    calendarWorkOrders,
    { emptyMessage: "Nema RN rokova u narednih 14 dana." },
  );

  const reminderTodoRows = [
    ...reminders.map((item) => ({ ...item, reportType: "Reminder" })),
    ...todoTasks.map((item) => ({ ...item, reportType: "ToDo" })),
  ]
    .filter((item) => {
      const dueDate = getReportDateKey(item.dueDate);
      const status = clean(item.status).toLowerCase();
      return dueDate
        && dueDate >= reportTodayKey
        && dueDate <= reportEndKey
        && !["done", "completed", "closed"].includes(status);
    })
    .sort((left, right) => String(left.dueDate || "").localeCompare(String(right.dueDate || ""), "hr"))
    .map((item) => ({
      date: formatOfferPdfDate(item.dueDate),
      type: item.reportType,
      title: item.title || item.name || "Bez naslova",
      status: item.status || "",
      context: [item.companyName, item.locationName, item.workOrderNumber].filter(Boolean).join(" · "),
    }));

  renderReportTable(
    doc,
    helpers,
    "Reminder i ToDo rokovi",
    [
      { key: "date", label: "Datum", width: 82 },
      { key: "type", label: "Tip", width: 82 },
      { key: "title", label: "Naslov", width: 250 },
      { key: "status", label: "Status", width: 90 },
      { key: "context", label: "Veza", width: 220 },
    ],
    reminderTodoRows,
    { emptyMessage: "Nema otvorenih reminders/ToDo rokova u narednih 14 dana." },
  );

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.font("dejavu").fontSize(8).fillColor("#94a3b8").text(
      `SafeNexus · ${index + 1 - range.start}/${range.count}`,
      doc.page.margins.left,
      doc.page.height - 26,
      {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: "right",
      },
    );
  }

  return pdfBufferFromDocument(doc);
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

export async function buildWorkOrderPdfBuffer(workOrder = {}) {
  const title = clean(workOrder.workOrderNumber)
    ? `Radni nalog ${clean(workOrder.workOrderNumber)}`
    : "Radni nalog";
  const serviceItems = Array.isArray(workOrder.serviceItems) ? workOrder.serviceItems : [];
  const executors = Array.isArray(workOrder.executors)
    ? workOrder.executors.map((entry) => clean(entry?.label || entry?.value || entry)).filter(Boolean)
    : normalizePdfLines([workOrder.executor1, workOrder.executor2]);
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
      Title: title,
      Author: "SafeNexus",
      Subject: "Radni nalog",
    },
  });

  doc.registerFont("dejavu", PDF_FONTS.regular);
  doc.registerFont("dejavu-bold", PDF_FONTS.bold);
  doc.registerFont("dejavu-italic", PDF_FONTS.italic);
  doc.font("dejavu");

  const helpers = createPdfLayoutHelpers(doc);
  helpers.ensureSpace(116);
  doc.font("dejavu-bold").fontSize(10).fillColor("#2563eb").text("SAFE NEXUS - RADNI NALOG");
  doc.moveDown(0.25);
  doc.font("dejavu-bold").fontSize(22).fillColor("#111827").text(title, {
    width: helpers.availableWidth - 148,
  });
  doc.font("dejavu").fontSize(10.5).fillColor("#64748b").text(
    normalizePdfLines([
      workOrder.companyName || "",
      workOrder.locationName || "",
      formatOfferPdfDate(workOrder.openedDate),
    ]).join(" · "),
  );

  const badgeWidth = 138;
  const badgeX = doc.page.width - doc.page.margins.right - badgeWidth;
  const badgeY = doc.page.margins.top;
  doc.save();
  doc.roundedRect(badgeX, badgeY, badgeWidth, 54, 16);
  doc.fillColor("#eff6ff").fill();
  doc.restore();
  doc.font("dejavu-bold").fontSize(9).fillColor("#2563eb").text("STATUS", badgeX + 14, badgeY + 12, {
    width: badgeWidth - 28,
  });
  doc.font("dejavu-bold").fontSize(12).fillColor("#0f172a").text(clean(workOrder.status || "Otvoreni RN"), badgeX + 14, badgeY + 27, {
    width: badgeWidth - 28,
  });

  doc.moveDown(1);
  drawOfferPdfSectionTitle(doc, "Osnovni podaci");
  writeOfferPdfMetaRow(doc, "Broj RN", workOrder.workOrderNumber || "");
  writeOfferPdfMetaRow(doc, "Datum otvaranja", formatOfferPdfDate(workOrder.openedDate));
  writeOfferPdfMetaRow(doc, "Rok zavrsetka", formatOfferPdfDate(workOrder.dueDate));
  writeOfferPdfMetaRow(doc, "Prioritet", workOrder.priority || "");
  writeOfferPdfMetaRow(doc, "Izvrsitelji", executors.join(", "));

  doc.moveDown(0.45);
  drawOfferPdfSectionTitle(doc, "Klijent i lokacija");
  writeOfferPdfMetaRow(doc, "Tvrtka", workOrder.companyName || "");
  writeOfferPdfMetaRow(doc, "Sjediste", workOrder.headquarters || "");
  writeOfferPdfMetaRow(doc, "OIB", workOrder.companyOib || "");
  writeOfferPdfMetaRow(doc, "Lokacija", workOrder.locationName || "");
  writeOfferPdfMetaRow(doc, "Regija", workOrder.region || "");
  writeOfferPdfMetaRow(doc, "Kontakt", normalizePdfLines([
    workOrder.contactName,
    workOrder.contactPhone,
    workOrder.contactEmail,
  ]).join(" · "));

  doc.moveDown(0.45);
  drawOfferPdfSectionTitle(doc, "Usluge");
  if (serviceItems.length > 0) {
    serviceItems.forEach((item, index) => {
      const serviceStatus = String(item?.serviceStatus || "").trim().toLowerCase();
      const status = item?.isCompleted || serviceStatus === "completed"
        ? "Zavrseno"
        : (serviceStatus === "in_progress" ? "U tijeku" : "Nije zavrseno");
      doc.font("dejavu").fontSize(10).fillColor("#1f2937").text(
        `${index + 1}. ${normalizePdfText(item?.name || item?.serviceCode || "Usluga")} - ${status}`,
        { width: helpers.availableWidth },
      );
    });
  } else {
    doc.font("dejavu").fontSize(10).fillColor("#1f2937").text(normalizePdfText(workOrder.serviceLine || workOrder.department || "Bez usluge"));
  }

  if (clean(workOrder.description)) {
    doc.moveDown(0.45);
    drawOfferPdfSectionTitle(doc, "Napomena");
    doc.font("dejavu").fontSize(10).fillColor("#1f2937").text(normalizePdfText(workOrder.description), {
      width: helpers.availableWidth,
      lineGap: 2,
    });
  }

  doc.moveDown(1);
  doc.font("dejavu").fontSize(8.5).fillColor("#94a3b8").text(
    `Generirano iz SafeNexus aplikacije ${formatOfferPdfDate(new Date().toISOString().slice(0, 10))}.`,
    { align: "right" },
  );

  return pdfBufferFromDocument(doc);
}

export async function buildAppCapabilitiesPdfBuffer({
  organizationName = "",
  modules = [],
  generatedAt = "",
} = {}) {
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
      Title: clean(organizationName) || "SafeNexus Product Board",
      Author: "SafeNexus",
      Subject: "Mogućnosti aplikacije",
    },
  });

  doc.registerFont("dejavu", PDF_FONTS.regular);
  doc.registerFont("dejavu-bold", PDF_FONTS.bold);
  doc.registerFont("dejavu-italic", PDF_FONTS.italic);
  doc.font("dejavu");

  const helpers = createPdfLayoutHelpers(doc);
  const safeOrganizationName = clean(organizationName) || "SafeNexus";
  const safeGeneratedAt = clean(generatedAt) || new Date().toISOString();
  const safeModules = (Array.isArray(modules) ? modules : [])
    .map((module) => ({
      title: clean(module?.title) || "Bez naziva",
      description: clean(module?.description),
      items: (Array.isArray(module?.items) ? module.items : [])
        .map((item) => ({
          title: clean(item?.title) || "Bez opisa",
          status: clean(item?.status).toLowerCase() || "planned_later",
        })),
    }));

  const statusMeta = {
    implemented: {
      label: "Implementirano",
      fill: "#e3f7eb",
      border: "#9fd4b1",
      text: "#1f7a4c",
      symbol: "✓",
    },
    in_progress: {
      label: "U tijeku",
      fill: "#e4f0ff",
      border: "#9ec0f5",
      text: "#245f9d",
      symbol: "↻",
    },
    planned_later: {
      label: "U planu kasnije",
      fill: "#fff1cf",
      border: "#e6c27a",
      text: "#8a6316",
      symbol: "◷",
    },
    not_planned: {
      label: "Nije u planu",
      fill: "#fde5ea",
      border: "#e3a7b2",
      text: "#8a4d55",
      symbol: "⊘",
    },
  };
  const getStatusMeta = (status = "") => statusMeta[clean(status).toLowerCase()] || statusMeta.planned_later;

  helpers.ensureSpace(126);
  const heroX = doc.page.margins.left;
  const heroY = doc.y;
  const heroWidth = helpers.availableWidth;
  const heroHeight = 104;

  doc.save();
  doc.roundedRect(heroX, heroY, heroWidth, heroHeight, 24);
  doc.fillColor("#f4f8ff").fill();
  doc.restore();
  drawRoundedOutline(doc, heroX, heroY, heroWidth, heroHeight, 24, "#cad8f1");

  doc.save();
  doc.roundedRect(heroX, heroY, heroWidth, 6, 6);
  doc.fillColor("#3b74ff").fill();
  doc.restore();

  doc.font("dejavu-bold").fontSize(9.5).fillColor("#2563eb").text("PRODUCT BOARD", heroX + 20, heroY + 18);
  doc.font("dejavu-bold").fontSize(22).fillColor("#111827").text("Mogućnosti aplikacije", heroX + 20, heroY + 34, {
    width: heroWidth - 170,
  });
  doc.font("dejavu").fontSize(9.5).fillColor("#64748b").text(
    `${safeOrganizationName} · ${safeGeneratedAt}`,
    heroX + 20,
    heroY + 66,
    { width: heroWidth - 170 },
  );

  const summaryText = `${safeModules.length} ${safeModules.length === 1 ? "modul" : "modula"}`;
  const badgeWidth = Math.max(100, doc.widthOfString(summaryText, { font: "dejavu-bold", size: 9.5 }) + 26);
  const badgeX = heroX + heroWidth - badgeWidth - 18;
  const badgeY = heroY + 24;
  doc.save();
  doc.roundedRect(badgeX, badgeY, badgeWidth, 34, 16);
  doc.fillColor("#ffffff").fill();
  doc.restore();
  drawRoundedOutline(doc, badgeX, badgeY, badgeWidth, 34, 16, "#cad8f1");
  doc.font("dejavu-bold").fontSize(9.5).fillColor("#305baf").text(summaryText, badgeX, badgeY + 11, {
    width: badgeWidth,
    align: "center",
  });
  doc.y = heroY + heroHeight + 16;

  const legendItems = [
    statusMeta.implemented,
    statusMeta.in_progress,
    statusMeta.planned_later,
    statusMeta.not_planned,
  ];
  let legendX = doc.page.margins.left;
  const legendY = doc.y;
  legendItems.forEach((entry) => {
    const legendLabel = `${entry.symbol} ${entry.label}`;
    doc.font("dejavu-bold").fontSize(8.8);
    const pillWidth = Math.max(118, doc.widthOfString(legendLabel) + 34);
    doc.save();
    doc.roundedRect(legendX, legendY, pillWidth, 28, 14);
    doc.fillColor(entry.fill).fill();
    doc.restore();
    drawRoundedOutline(doc, legendX, legendY, pillWidth, 28, 14, entry.border);
    doc.fillColor(entry.text).text(legendLabel, legendX + 12, legendY + 9, {
      width: pillWidth - 24,
      align: "center",
    });
    legendX += pillWidth + 8;
  });
  doc.y = legendY + 40;

  if (safeModules.length === 0) {
    renderPdfFieldCard(doc, helpers, "Mogućnosti aplikacije", "Trenutno nema pobrojanih modula ni stavki.");
    return pdfBufferFromDocument(doc);
  }

  safeModules.forEach((module) => {
    const headerX = doc.page.margins.left;
    let headerY = doc.y;
    const headerWidth = helpers.availableWidth;
    const descriptionWidth = headerWidth - 64;
    doc.font("dejavu").fontSize(8.8);
    const descriptionHeight = module.description
      ? doc.heightOfString(module.description, { width: descriptionWidth, lineGap: 1.1 })
      : 0;
    const headerHeight = module.description ? Math.max(58, 45 + descriptionHeight) : 42;
    helpers.ensureSpace(headerHeight + 18);
    headerY = doc.y;

    doc.save();
    doc.roundedRect(headerX, headerY, headerWidth, headerHeight, 16);
    doc.fillColor("#ffffff").fill();
    doc.restore();
    drawRoundedOutline(doc, headerX, headerY, headerWidth, headerHeight, 16, "#cad8f1");
    drawAccentLine(doc, headerX + 12, headerY + 9, 24, "#3b74ff");

    doc.font("dejavu-bold").fontSize(12).fillColor("#111827").text(module.title, headerX + 28, headerY + 9, {
      width: headerWidth - 160,
    });
    if (module.description) {
      doc.font("dejavu").fontSize(8.8).fillColor("#64748b").text(module.description, headerX + 28, headerY + 28, {
        width: descriptionWidth,
        lineGap: 1.1,
      });
    }
    const countLabel = `${module.items.length} ${module.items.length === 1 ? "stavka" : "stavki"}`;
    doc.font("dejavu-bold").fontSize(8.8).fillColor("#5f6f95").text(countLabel, headerX + headerWidth - 120, headerY + 14, {
      width: 92,
      align: "right",
    });
    doc.y = headerY + headerHeight + 8;

    if (module.items.length === 0) {
      renderPdfFieldCard(doc, helpers, module.title, "Modul još nema pobrojane stavke.");
      return;
    }

    module.items.forEach((item) => {
      const meta = getStatusMeta(item.status);
      const rowX = doc.page.margins.left;
      const rowWidth = helpers.availableWidth;
      const statusWidth = 44;
      const contentWidth = rowWidth - statusWidth - 34;
      doc.font("dejavu").fontSize(9.2);
      const textHeight = doc.heightOfString(item.title, {
        width: contentWidth,
        lineGap: 1.2,
      });
      const rowHeight = Math.max(34, textHeight + 14);
      helpers.ensureSpace(rowHeight + 8);
      const rowY = doc.y;

      doc.save();
      doc.roundedRect(rowX, rowY, rowWidth, rowHeight, 14);
      doc.fillColor("#ffffff").fill();
      doc.restore();
      drawRoundedOutline(doc, rowX, rowY, rowWidth, rowHeight, 14, "#d8e3f5");

      const pillY = rowY + ((rowHeight - 24) / 2);
      doc.save();
      doc.roundedRect(rowX + 12, pillY, statusWidth, 24, 12);
      doc.fillColor(meta.fill).fill();
      doc.restore();
      drawRoundedOutline(doc, rowX + 12, pillY, statusWidth, 24, 12, meta.border);
      doc.font("dejavu-bold").fontSize(10.5).fillColor(meta.text).text(meta.symbol, rowX + 12, pillY + 5.5, {
        width: statusWidth,
        align: "center",
      });

      doc.font("dejavu").fontSize(9.2).fillColor("#22314f").text(item.title, rowX + statusWidth + 24, rowY + ((rowHeight - textHeight) / 2), {
        width: contentWidth,
        lineGap: 1.2,
      });

      doc.y = rowY + rowHeight + 8;
    });

    doc.moveDown(0.25);
  });

  return pdfBufferFromDocument(doc);
}

function escapeOfferHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatOfferHtmlText(value = "", fallback = "—") {
  const text = clean(value);
  return text ? escapeOfferHtml(text).replace(/\r?\n/g, "<br>") : fallback;
}

function getOfferHtmlStatusLabel(value = "") {
  const status = clean(value).toLowerCase();
  if (["sent", "poslana"].includes(status)) {
    return "Poslana";
  }
  if (["accepted", "prihvacena", "prihvaćena"].includes(status)) {
    return "Prihvaćena";
  }
  if (["rejected", "odbijena"].includes(status)) {
    return "Odbijena";
  }
  if (["expired", "istekla"].includes(status)) {
    return "Istekla";
  }
  return "Skica";
}

function getDefaultOfferHtmlTemplate() {
  try {
    return readFileSync(DEFAULT_OFFER_HTML_TEMPLATE_PATH, "utf8");
  } catch {
    return "";
  }
}

function normalizeOfferPlanType(value = "") {
  const rawValue = clean(value);
  const normalizedValue = rawValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  const legacyMap = new Map([
    ["fixed fee", "Fixed Plan"],
    ["flat plan", "Fixed Plan"],
    ["fixed plan", "Fixed Plan"],
    ["fiksni plan", "Fixed Plan"],
    ["base fee variable fee", "Hybrid Plan"],
    ["base fee plus variable fee", "Hybrid Plan"],
    ["monthly per services", "Hybrid Plan"],
    ["hybrid plan", "Hybrid Plan"],
    ["hibridni plan", "Hybrid Plan"],
    ["one time", "One-Time Service"],
    ["one time service", "One-Time Service"],
    ["one-time", "One-Time Service"],
    ["one-time service", "One-Time Service"],
    ["per employee", "Per Employee Plan"],
    ["per employee plan", "Per Employee Plan"],
  ]);

  if (legacyMap.has(normalizedValue)) {
    return legacyMap.get(normalizedValue);
  }
  if (normalizedValue.includes("hybrid") || normalizedValue.includes("hibrid")) {
    return "Hybrid Plan";
  }
  if (normalizedValue.includes("fixed") || normalizedValue.includes("fiks")) {
    return "Fixed Plan";
  }
  if (normalizedValue.includes("employee") || normalizedValue.includes("zaposlen")) {
    return "Per Employee Plan";
  }
  if (normalizedValue.includes("one time") || normalizedValue.includes("jednokrat")) {
    return "One-Time Service";
  }
  return rawValue;
}

function parseOfferPdfNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const rawValue = clean(value);
  if (!rawValue) {
    return fallback;
  }

  const numericText = rawValue.replace(/[^\d,.-]/g, "");
  if (!numericText) {
    return fallback;
  }

  const normalizedText = numericText.includes(",") && numericText.includes(".")
    ? numericText.replace(/\./g, "").replace(",", ".")
    : numericText.replace(",", ".");
  const parsedValue = Number(normalizedText);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function hasOfferPdfBreakdownRows(item = {}) {
  return Array.isArray(item?.breakdowns) && item.breakdowns.some((entry) => (
    clean(entry?.recordLabel || entry?.label || entry?.unitLabel)
      || clean(entry?.measurementFrom)
      || clean(entry?.measurementTo)
      || parseOfferPdfNumber(entry?.amount, 0) > 0
  ));
}

function getOfferPdfBreakdownRows(item = {}) {
  return Array.isArray(item?.breakdowns)
    ? item.breakdowns.filter((entry) => (
      clean(entry?.recordLabel || entry?.label || entry?.unitLabel)
        || clean(entry?.measurementFrom)
        || clean(entry?.measurementTo)
        || parseOfferPdfNumber(entry?.amount, 0) > 0
    ))
    : [];
}

function getOfferPdfMonthlyItems(items = [], offerType = "") {
  const planType = normalizeOfferPlanType(offerType);
  const safeItems = Array.isArray(items) ? items : [];
  if (planType === "Hybrid Plan") {
    return safeItems.filter((item) => !hasOfferPdfBreakdownRows(item));
  }
  if (planType === "Fixed Plan") {
    return safeItems;
  }
  return [];
}

function getOfferPdfServicePricingItems(items = [], offerType = "") {
  const planType = normalizeOfferPlanType(offerType);
  const safeItems = Array.isArray(items) ? items : [];
  if (planType === "Fixed Plan") {
    return [];
  }
  if (planType === "Hybrid Plan") {
    return safeItems.filter((item) => hasOfferPdfBreakdownRows(item));
  }
  return safeItems;
}

function getOfferPdfBreakdownDocumentLabel(entry = {}) {
  const priceKind = clean(entry?.priceKind);
  const label = clean(entry?.unitLabel || entry?.recordLabel || entry?.label) || "Zapisnik";
  const measurementFrom = clean(entry?.measurementFrom);
  const measurementTo = clean(entry?.measurementTo);

  if (priceKind === "measurement") {
    return measurementTo ? `Do ${measurementTo} mjernih mjesta` : label;
  }
  if (priceKind === "measurement_range") {
    if (measurementFrom && measurementTo) {
      return `Od ${measurementFrom} do ${measurementTo} mjernog mjesta`;
    }
    const range = [measurementFrom, measurementTo].filter(Boolean).join(" - ");
    return range ? `Od-Do ${range} mjernog mjesta` : label;
  }
  if (priceKind === "next_measurement") {
    return "Svako iduće mjerno mjesto";
  }
  return label;
}

function getOfferPdfQuantityText(item = {}) {
  const quantity = clean(item?.quantity);
  const unit = clean(item?.unit);
  if (!quantity && !unit) {
    return "";
  }
  return [quantity || "1", unit].filter(Boolean).join(" ");
}

function formatOfferPdfItemAmount(item = {}, currency = "EUR") {
  if (item?.isIncludedService) {
    return "Uključeno";
  }

  const total = parseOfferPdfNumber(item?.totalPrice, 0);
  if (total > 0) {
    return formatOfferPdfCurrency(total, currency);
  }

  const quantity = Math.max(0, parseOfferPdfNumber(item?.quantity, 0));
  const unitPrice = Math.max(0, parseOfferPdfNumber(item?.unitPrice, 0));
  if (quantity > 0 && unitPrice > 0) {
    return formatOfferPdfCurrency(quantity * unitPrice, currency);
  }
  if (unitPrice > 0) {
    return formatOfferPdfCurrency(unitPrice, currency);
  }
  return "";
}

function buildOfferHtmlItemsTable(offer = {}, currency = "EUR") {
  const items = Array.isArray(offer.items) ? offer.items : [];
  if (items.length === 0) {
    return `<p class="offer-html-empty">Ponuda nema dodanih stavki.</p>`;
  }

  const planType = normalizeOfferPlanType(offer.serviceLine);
  if (planType === "Hybrid Plan") {
    const monthlyItems = getOfferPdfMonthlyItems(items, offer.serviceLine);
    const serviceItems = getOfferPdfServicePricingItems(items, offer.serviceLine);
    const monthlyRows = monthlyItems.map((item) => `
      <tr>
        <td>${formatOfferHtmlText(item.description || "Mjesečna naknada")}</td>
        <td>${escapeOfferHtml(formatOfferPdfItemAmount(item, currency))}</td>
      </tr>
    `).join("");
    const serviceRows = serviceItems.flatMap((item) => {
      const headerRow = `
        <tr class="offer-html-group-row">
          <td colspan="2">${formatOfferHtmlText(item.description || "Usluga")}</td>
        </tr>
      `;
      const breakdownRows = getOfferPdfBreakdownRows(item).map((entry) => `
        <tr class="offer-html-breakdown-table-row">
          <td>${formatOfferHtmlText(`- ${getOfferPdfBreakdownDocumentLabel(entry)}`)}</td>
          <td>${escapeOfferHtml(formatOfferPdfCurrency(parseOfferPdfNumber(entry.amount, 0), currency))}</td>
        </tr>
      `).join("");
      return `${headerRow}${breakdownRows}`;
    }).join("");

    return `
      <section class="offer-html-plan-section">
        <h4>Mjesečne naknade</h4>
        <table class="offer-html-items-table offer-html-simple-items-table">
          <thead>
            <tr>
              <th>Opis</th>
              <th>Iznos</th>
            </tr>
          </thead>
          <tbody>${monthlyRows || `<tr><td colspan="2">Nema mjesečnih naknada.</td></tr>`}</tbody>
        </table>
      </section>
      <section class="offer-html-plan-section">
        <h4>Cjenik usluga</h4>
        <table class="offer-html-items-table offer-html-simple-items-table">
          <thead>
            <tr>
              <th>Opis</th>
              <th>Iznos</th>
            </tr>
          </thead>
          <tbody>${serviceRows || `<tr><td colspan="2">Nema usluga u cjeniku.</td></tr>`}</tbody>
        </table>
      </section>
    `;
  }

  if (planType === "Fixed Plan") {
    const fixedRows = items.map((item) => `
      <tr>
        <td>${formatOfferHtmlText(item.description || item.serviceCode || "Stavka")}</td>
        <td>${escapeOfferHtml(formatOfferPdfItemAmount(item, currency))}</td>
      </tr>
    `).join("");
    const fixedTotal = items.reduce((sum, item) => sum + parseOfferPdfNumber(item.totalPrice, 0), 0);

    return `
      <table class="offer-html-items-table offer-html-simple-items-table">
        <thead>
          <tr>
            <th>Opis</th>
            <th>Iznos</th>
          </tr>
        </thead>
        <tbody>
          ${fixedRows}
          ${offer.showTotalAmount !== false ? `
            <tr class="offer-html-total-row">
              <td>Ukupno</td>
              <td>${escapeOfferHtml(formatOfferPdfCurrency(fixedTotal, currency))}</td>
            </tr>
          ` : ""}
        </tbody>
      </table>
    `;
  }

  const showTotalAmount = offer.showTotalAmount !== false;
  const hasDiscount = Number(offer.discountRate ?? 0) > 0 || Number(offer.discountTotal ?? 0) > 0;
  const itemRows = items.map((item, index) => {
    const breakdowns = getOfferPdfBreakdownRows(item);
    const breakdownText = breakdowns.map((entry) => {
      const label = getOfferPdfBreakdownDocumentLabel(entry);
      return `${label}: ${formatOfferPdfCurrency(parseOfferPdfNumber(entry.amount, 0), currency)}`;
    }).join("\n");

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${formatOfferHtmlText(item.description || item.serviceCode || "Stavka")}${breakdownText ? `<br><small>${formatOfferHtmlText(breakdownText)}</small>` : ""}</td>
        <td>${formatOfferHtmlText(item.unit || "")}</td>
        <td>${formatOfferHtmlText(item.quantity ?? "")}</td>
        <td>${escapeOfferHtml(formatOfferPdfCurrency(item.unitPrice ?? 0, currency))}</td>
        <td>${escapeOfferHtml(formatOfferPdfCurrency(item.totalPrice ?? 0, currency))}</td>
      </tr>
    `;
  }).join("");

  return `
    <table class="offer-html-items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Opis</th>
          <th>Jed.</th>
          <th>Kol.</th>
          <th>Cijena</th>
          <th>Ukupno</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      ${showTotalAmount ? `
        <tfoot>
          <tr>
            <td colspan="5">Međuzbroj</td>
            <td>${escapeOfferHtml(formatOfferPdfCurrency(offer.subtotal ?? 0, currency))}</td>
          </tr>
          ${hasDiscount ? `
            <tr>
              <td colspan="5">Rabat</td>
              <td>${escapeOfferHtml(formatOfferPdfCurrency(offer.discountTotal ?? 0, currency))}</td>
            </tr>
            <tr>
              <td colspan="5">Osnovica</td>
              <td>${escapeOfferHtml(formatOfferPdfCurrency(offer.taxableSubtotal ?? 0, currency))}</td>
            </tr>
          ` : ""}
          <tr>
            <td colspan="5">PDV</td>
            <td>${escapeOfferHtml(formatOfferPdfCurrency(offer.taxTotal ?? 0, currency))}</td>
          </tr>
          <tr class="offer-html-total-row">
            <td colspan="5">Ukupno</td>
            <td>${escapeOfferHtml(formatOfferPdfCurrency(offer.total ?? 0, currency))}</td>
          </tr>
        </tfoot>
      ` : ""}
    </table>
  `;
}

function buildOfferHtmlPlaceholderMap(offer = {}, currency = "EUR") {
  const locationNames = normalizePdfLines(offer.selectedLocationNames || offer.locationName || "");
  const locationHtml = locationNames.length > 0
    ? locationNames.map((entry) => formatOfferHtmlText(entry, "")).join("<br>")
    : formatOfferHtmlText(clean(offer.locationName) || "Bez lokacije", "");
  const offerNumber = clean(offer.offerNumber) || "Nacrt ponude";
  const preparedBy = clean(offer.preparedByLabel || offer.preparedBy || offer.ownerName || "");
  const itemsTable = buildOfferHtmlItemsTable(offer, currency);
  const note = clean(offer.note) || "";

  return new Map(Object.entries({
    OFFER_NUMBER: offerNumber,
    OFFER_TITLE: clean(offer.title) || "Ponuda",
    OFFER_STATUS: getOfferHtmlStatusLabel(offer.status || "draft"),
    OFFER_DATE: formatOfferPdfDate(offer.offerDate),
    VALID_UNTIL: formatOfferPdfDate(offer.validUntil),
    COMPANY_NAME: clean(offer.companyName),
    COMPANY_OIB: clean(offer.companyOib),
    COMPANY_HEADQUARTERS: clean(offer.headquarters),
    LOCATION_SUMMARY: locationNames[0] || clean(offer.locationName) || "Bez lokacije",
    LOCATION_LIST: locationHtml,
    CONTACT_NAME: clean(offer.contactName),
    CONTACT_PHONE: clean(offer.contactPhone),
    CONTACT_EMAIL: clean(offer.contactEmail),
    OFFER_PREPARED_BY: preparedBy,
    SERVICE_LINE: clean(offer.serviceLine),
    OFFER_TYPE: clean(offer.serviceLine),
    OFFER_TEXT_1: clean(offer.textBlock1),
    OFFER_TEXT_2: clean(offer.textBlock2),
    ITEMS_TABLE: itemsTable,
    ITEMS_SUMMARY: buildOfferHtmlItemsTable(offer, currency),
    NOTE: note,
    SUBTOTAL: formatOfferPdfCurrency(offer.subtotal ?? 0, currency),
    DISCOUNT_RATE: Number(offer.discountRate || 0) > 0 ? `${offer.discountRate}%` : "",
    DISCOUNT_TOTAL: formatOfferPdfCurrency(offer.discountTotal ?? 0, currency),
    TAX_RATE: `${offer.taxRate || 0}%`,
    TAX_TOTAL: formatOfferPdfCurrency(offer.taxTotal ?? 0, currency),
    TOTAL: formatOfferPdfCurrency(offer.total ?? 0, currency),
  }));
}

function renderOfferHtmlTemplatePlaceholders(templateHtml = "", offer = {}, currency = "EUR") {
  const placeholderMap = buildOfferHtmlPlaceholderMap(offer, currency);
  return String(templateHtml || "").replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key) => {
    const value = placeholderMap.get(String(key || "").trim());
    if (value == null) {
      return "";
    }
    if (["ITEMS_TABLE", "ITEMS_SUMMARY", "LOCATION_LIST"].includes(key)) {
      return String(value);
    }
    return formatOfferHtmlText(value, "");
  });
}

export function buildOfferHtmlTemplate(offer = {}, options = {}) {
  const currency = clean(options.currency || offer.currency || "EUR") || "EUR";
  const templateHtml = clean(options.templateHtml) || getDefaultOfferHtmlTemplate();
  if (templateHtml) {
    const renderedTemplate = renderOfferHtmlTemplatePlaceholders(templateHtml, offer, currency);
    if (/<!doctype\s+html|<html[\s>]/i.test(renderedTemplate)) {
      return renderedTemplate;
    }

    return `
      <style>
        .safe-offer-html-template{font-family:Arial,sans-serif;color:#172033;background:#fff;max-width:900px;margin:0 auto;padding:38px;border:1px solid #d9e3f3;border-radius:12px;box-shadow:0 16px 38px rgba(15,23,42,.07);font-size:13.5px;line-height:1.5}
        .safe-offer-html-template p{margin:0 0 10px}
        .safe-offer-html-template table{width:100%;border-collapse:collapse;margin:10px 0 16px}
        .safe-offer-html-template td,.safe-offer-html-template th{border:1px solid #d9e3f3;padding:8px 9px;vertical-align:top}
        .safe-offer-html-template th{background:#f1f6ff;color:#1e3a8a;text-align:left;font-weight:700}
        .safe-offer-html-template h4{margin:12px 0 6px;color:#0f172a;font-size:13px}
        .safe-offer-html-template tfoot td{background:#f8fafc;font-weight:700;text-align:right}
        .safe-offer-html-template tfoot .offer-html-total-row td{background:#eff6ff;color:#0f3f91;font-size:14px}
        .safe-offer-html-template strong{color:#0f172a}
        .safe-offer-html-template small{display:block;color:#64748b;white-space:pre-line;margin-top:4px}
        .offer-html-plan-section{margin:0 0 14px}
        .offer-html-simple-items-table th:nth-child(2),.offer-html-simple-items-table td:nth-child(2){width:145px;text-align:right}
        .offer-html-group-row td{background:#f8fafc;font-weight:700;color:#0f172a}
        .offer-html-breakdown-table-row td:first-child{padding-left:18px;color:#334155}
        .offer-html-items-table th:nth-child(1),.offer-html-items-table td:nth-child(1){width:34px;text-align:center}
        .offer-html-items-table th:nth-child(3),.offer-html-items-table td:nth-child(3),.offer-html-items-table th:nth-child(4),.offer-html-items-table td:nth-child(4){width:58px;text-align:center}
        .offer-html-items-table th:nth-child(5),.offer-html-items-table td:nth-child(5),.offer-html-items-table th:nth-child(6),.offer-html-items-table td:nth-child(6){width:110px;text-align:right}
        .offer-html-simple-items-table th:nth-child(1),.offer-html-simple-items-table td:nth-child(1){width:auto;text-align:left}
        .offer-html-simple-items-table th:nth-child(2),.offer-html-simple-items-table td:nth-child(2){width:145px;text-align:right}
        .offer-html-empty{border:1px dashed #cbd5e1;border-radius:10px;padding:12px;color:#64748b;background:#f8fafc}
        @page{size:A4;margin:14mm}
        @media print{body{margin:0}.safe-offer-html-template{max-width:none;margin:0;padding:0;border:0;border-radius:0;box-shadow:none}.safe-offer-html-template table{break-inside:auto}.safe-offer-html-template tr{break-inside:avoid;break-after:auto}}
      </style>
      <article class="safe-offer-html-template">
        ${renderedTemplate}
      </article>
    `;
  }

  const title = clean(offer.title) || "Ponuda";
  const offerNumber = clean(offer.offerNumber) || "Nacrt ponude";
  const locationNames = normalizePdfLines(offer.selectedLocationNames || offer.locationName || "");
  const items = Array.isArray(offer.items) ? offer.items : [];
  const hasDiscount = Number(offer.discountRate ?? 0) > 0 || Number(offer.discountTotal ?? 0) > 0;
  const showTotalAmount = offer.showTotalAmount !== false;
  const extraTextBlocks = [
    ["Dodatni tekst 1", offer.textBlock1],
    ["Dodatni tekst 2", offer.textBlock2],
  ].filter(([, value]) => clean(value));
  const metaRows = [
    ["Broj ponude", offerNumber],
    ["Datum ponude", formatOfferPdfDate(offer.offerDate)],
    ["Vrijedi do", formatOfferPdfDate(offer.validUntil)],
    ["Vrsta ponude", offer.serviceLine || "—"],
  ];
  const customerRows = [
    ["Tvrtka", offer.companyName || "—"],
    ["OIB", offer.companyOib || "—"],
    ["Sjedište", offer.headquarters || "—"],
    ["Lokacije", locationNames.join(", ") || offer.locationName || "Bez lokacije"],
    ["Kontakt", offer.contactName || "—"],
    ["Telefon", offer.contactPhone || "—"],
    ["Email", offer.contactEmail || "—"],
  ];

  const itemRows = items.length
    ? buildOfferHtmlItemsTable(offer, currency)
    : `<div class="offer-html-empty">Ponuda još nema dodanih stavki.</div>`;

  const totalsHtml = showTotalAmount ? `
    <section class="offer-html-section offer-html-totals">
      <h3>Ukupni iznosi</h3>
      <div><span>Međuzbroj</span><strong>${escapeOfferHtml(formatOfferPdfCurrency(offer.subtotal ?? 0, currency))}</strong></div>
      ${hasDiscount ? `
        <div><span>Rabat</span><strong>${escapeOfferHtml(formatOfferPdfCurrency(offer.discountTotal ?? 0, currency))}</strong></div>
        <div><span>Osnovica</span><strong>${escapeOfferHtml(formatOfferPdfCurrency(offer.taxableSubtotal ?? 0, currency))}</strong></div>
      ` : ""}
      <div><span>PDV</span><strong>${escapeOfferHtml(formatOfferPdfCurrency(offer.taxTotal ?? 0, currency))}</strong></div>
      <div class="is-grand"><span>Ukupno</span><strong>${escapeOfferHtml(formatOfferPdfCurrency(offer.total ?? 0, currency))}</strong></div>
    </section>
  ` : "";

  return `
    <style>
      .safe-offer-html-template{font-family:Inter,Arial,sans-serif;color:#172033;background:#fff;max-width:920px;margin:0 auto;padding:34px;border:1px solid #d9e3f3;border-radius:18px;box-shadow:0 18px 45px rgba(15,23,42,.08)}
      .offer-html-hero{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:20px;align-items:start;border-bottom:1px solid #dbe6f6;padding-bottom:22px;margin-bottom:22px}
      .offer-html-kicker{margin:0 0 8px;color:#2563eb;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .offer-html-hero h2{margin:0;color:#0f172a;font-size:30px;line-height:1.12;letter-spacing:0}
      .offer-html-hero p{margin:8px 0 0;color:#64748b;font-size:14px;line-height:1.5}
      .offer-html-status{border:1px solid #bfdbfe;background:#eff6ff;border-radius:16px;padding:12px;text-align:center;color:#1d4ed8}
      .offer-html-status span{display:block;font-size:11px;font-weight:800;text-transform:uppercase;color:#2563eb}
      .offer-html-status strong{display:block;margin-top:5px;color:#0f172a;font-size:16px}
      .offer-html-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-bottom:20px}
      .offer-html-section{border:1px solid #dbe6f6;border-radius:16px;padding:16px;background:#fbfdff;margin-bottom:18px}
      .offer-html-section h3{margin:0 0 12px;color:#2563eb;font-size:13px;text-transform:uppercase;letter-spacing:.08em}
      .offer-html-row,.offer-html-totals div{display:grid;grid-template-columns:145px minmax(0,1fr);gap:14px;padding:8px 0;border-top:1px solid #e7eef8}
      .offer-html-row:first-of-type,.offer-html-totals div:first-of-type{border-top:0}
      .offer-html-row span,.offer-html-totals span{color:#64748b;font-size:13px}
      .offer-html-row strong,.offer-html-totals strong{color:#0f172a;font-size:13px;word-break:break-word}
      .offer-html-note{line-height:1.58;color:#1f2937;font-size:14px}
      .offer-html-items{display:grid;gap:10px}
      .offer-html-items table{width:100%;border-collapse:collapse;background:#fff}
      .offer-html-items th,.offer-html-items td{border:1px solid #d9e3f3;padding:8px 9px;vertical-align:top}
      .offer-html-items th{background:#f1f6ff;color:#1e3a8a;text-align:left;font-weight:700}
      .offer-html-plan-section h4{margin:10px 0 7px;color:#0f172a;font-size:13px}
      .offer-html-simple-items-table th:nth-child(2),.offer-html-simple-items-table td:nth-child(2){width:145px;text-align:right}
      .offer-html-group-row td{background:#f8fafc;font-weight:700;color:#0f172a}
      .offer-html-breakdown-table-row td:first-child{padding-left:18px;color:#334155}
      .offer-html-total-row td{background:#eff6ff;color:#0f3f91;font-weight:800}
      .offer-html-item{border:1px solid #cfd8ea;border-radius:16px;padding:14px;background:#fff}
      .offer-html-item-main{display:grid;grid-template-columns:minmax(0,1fr) 140px;gap:14px;align-items:start}
      .offer-html-item-index{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:999px;background:#eaf2ff;color:#2563eb;font-weight:800;font-size:12px;margin-right:8px;vertical-align:middle}
      .offer-html-item h4{display:inline;margin:0;color:#0f172a;font-size:15px;line-height:1.35}
      .offer-html-item p{margin:8px 0 0;color:#64748b;font-size:12.5px;line-height:1.45}
      .offer-html-item-main>strong{color:#1d4ed8;font-size:15px;text-align:right;white-space:nowrap}
      .offer-html-breakdowns{margin-top:12px;border-top:1px solid #e7eef8;padding-top:8px;display:grid;gap:7px}
      .offer-html-breakdown-row{display:grid;grid-template-columns:minmax(0,1fr) 128px;gap:10px;color:#334155;font-size:13px}
      .offer-html-breakdown-row strong{text-align:right;color:#0f172a}
      .offer-html-item-discount{margin-top:8px;color:#b45309;font-size:12.5px}
      .offer-html-totals{max-width:430px;margin-left:auto;background:#f8fbf8;border-color:#bfe2cb}
      .offer-html-totals div{grid-template-columns:minmax(0,1fr) 145px}
      .offer-html-totals strong{text-align:right}
      .offer-html-totals .is-grand strong,.offer-html-totals .is-grand span{color:#08783f;font-size:16px}
      .offer-html-empty{border:1px dashed #cbd5e1;border-radius:14px;padding:18px;color:#64748b;background:#f8fafc}
      @media(max-width:760px){.safe-offer-html-template{padding:22px}.offer-html-hero,.offer-html-grid,.offer-html-item-main,.offer-html-breakdown-row{grid-template-columns:1fr}.offer-html-status{text-align:left}.offer-html-item-main>strong,.offer-html-breakdown-row strong,.offer-html-totals strong{text-align:left}.offer-html-totals{max-width:none}.offer-html-row,.offer-html-totals div{grid-template-columns:1fr;gap:4px}}
    </style>
    <article class="safe-offer-html-template">
      <header class="offer-html-hero">
        <div>
          <p class="offer-html-kicker">SafeNexus · Ponuda</p>
          <h2>${formatOfferHtmlText(title)}</h2>
          <p>${[offerNumber, offer.companyName || "", formatOfferPdfDate(offer.offerDate)].filter(Boolean).map((entry) => escapeOfferHtml(entry)).join(" · ")}</p>
        </div>
        <div class="offer-html-status"><span>Status</span><strong>${escapeOfferHtml(getOfferHtmlStatusLabel(offer.status || "draft"))}</strong></div>
      </header>

      <div class="offer-html-grid">
        <section class="offer-html-section">
          <h3>Podaci o ponudi</h3>
          ${metaRows.map(([label, value]) => `<div class="offer-html-row"><span>${escapeOfferHtml(label)}</span><strong>${formatOfferHtmlText(value)}</strong></div>`).join("")}
        </section>
        <section class="offer-html-section">
          <h3>Naručitelj</h3>
          ${customerRows.map(([label, value]) => `<div class="offer-html-row"><span>${escapeOfferHtml(label)}</span><strong>${formatOfferHtmlText(value)}</strong></div>`).join("")}
        </section>
      </div>

      ${clean(offer.note) ? `<section class="offer-html-section offer-html-note"><h3>Napomena</h3>${formatOfferHtmlText(offer.note)}</section>` : ""}
      ${extraTextBlocks.map(([blockTitle, body]) => `<section class="offer-html-section offer-html-note"><h3>${escapeOfferHtml(blockTitle)}</h3>${formatOfferHtmlText(body)}</section>`).join("")}

      <section class="offer-html-section">
        <h3>Stavke ponude</h3>
        <div class="offer-html-items">${itemRows}</div>
      </section>

      ${totalsHtml}
    </article>
  `;
}

function buildHtmlPdfDocument(html = "", { title = "Ponuda" } = {}) {
  const safeHtml = String(html ?? "").trim();
  if (/<!doctype\s+html|<html[\s>]/i.test(safeHtml)) {
    return safeHtml;
  }

  return `<!doctype html>
<html lang="hr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeOfferHtml(title || "Ponuda")}</title>
  <style>
    html{background:#fff}
    body{margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    *{box-sizing:border-box}
  </style>
</head>
<body>
${safeHtml}
</body>
</html>`;
}

function htmlRequestsGeneratedPageNumbers(html = "") {
  return /\bdata-sn-word-field\s*=\s*(["'])PAGE\1/i.test(String(html || ""))
    && /\bdata-sn-word-field\s*=\s*(["'])NUMPAGES\1/i.test(String(html || ""));
}

function prepareHtmlForGeneratedPageNumberPdf(html = "") {
  const source = String(html || "");
  if (!htmlRequestsGeneratedPageNumbers(source) || /data-safe-nexus-generated-page-number-pdf/i.test(source)) {
    return source;
  }
  const style = `<style data-safe-nexus-generated-page-number-pdf>
    @media print {
      .sn-word-page-footer.has-generated-page-fields { visibility: hidden !important; }
    }
  </style>`;
  if (/<\/head>/i.test(source)) {
    return source.replace(/<\/head>/i, `${style}\n</head>`);
  }
  return `${style}\n${source}`;
}

function stripHtmlToText(value = "") {
  return decodeBasicHtmlEntities(
    String(value || "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function getGeneratedPageNumberPrefixFromHtml(html = "") {
  const source = String(html || "");
  const footerMatch = source.match(/<section\b[^>]*\bsn-word-page-footer\b[^>]*\bhas-generated-page-fields\b[^>]*>[\s\S]*?<\/section>/i);
  const footerHtml = footerMatch?.[0] || source;
  const pageFieldIndex = footerHtml.search(/<span\b[^>]*\bdata-sn-word-field\s*=\s*(["'])PAGE\1/i);
  if (pageFieldIndex < 0) {
    return "";
  }
  return stripHtmlToText(footerHtml.slice(0, pageFieldIndex)).slice(-32);
}

async function applyGeneratedPageNumbersToPdfBuffer(pdfBuffer = Buffer.alloc(0), {
  prefix = "",
} = {}) {
  const document = await PdfLibDocument.load(pdfBuffer);
  const pages = document.getPages();
  if (pages.length === 0) {
    return pdfBuffer;
  }
  const font = await document.embedFont(StandardFonts.Helvetica);
  const safePrefix = clean(prefix);
  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const label = `${safePrefix}${index + 1}/${pages.length}`;
    page.drawText(label, {
      x: 18,
      y: 18,
      size: 8,
      font,
      color: rgb(0.05, 0.09, 0.16),
      maxWidth: Math.max(80, width - 36),
    });
  });
  return Buffer.from(await document.save());
}

function buildChromiumRuntimeEnv(tempRoot = "") {
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
    LANG: process.env.LANG || "C.UTF-8",
    LC_ALL: process.env.LC_ALL || "C.UTF-8",
  };
}

function withTimeout(promise, timeoutMs = 0, message = "Operacija je istekla.") {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  let timeout = null;
  const timeoutPromise = new Promise((_, rejectPromise) => {
    timeout = setTimeout(() => rejectPromise(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise])
    .finally(() => {
      if (timeout) {
        clearTimeout(timeout);
      }
    });
}

function waitForChromiumDebugEndpoint(child, timeoutMs = HTML_PDF_CDP_CONNECT_TIMEOUT_MS) {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    let output = "";
    const cleanup = () => {
      child.stdout?.off("data", onData);
      child.stderr?.off("data", onData);
      child.off("exit", onExit);
      child.off("error", onError);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
    const settle = (callback, value) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback(value);
    };
    const onData = (chunk) => {
      output += String(chunk ?? "");
      const match = output.match(/DevTools listening on\s+(ws:\/\/[^\s]+)/i);
      if (match?.[1]) {
        settle(resolvePromise, match[1]);
      }
    };
    const onExit = (code, signal) => {
      settle(rejectPromise, new Error(`Chromium se zatvorio prije DevTools veze (${signal || code || "exit"}).`));
    };
    const onError = (error) => {
      settle(rejectPromise, error);
    };
    const timeout = setTimeout(() => {
      settle(rejectPromise, new Error("Chromium DevTools veza nije spremna na vrijeme."));
    }, timeoutMs);

    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.once("exit", onExit);
    child.once("error", onError);
  });
}

function parseChromiumDebugEndpoint(endpoint = "") {
  const url = new URL(endpoint);
  return {
    endpoint,
    host: url.hostname || "127.0.0.1",
    port: Number(url.port) || 9222,
  };
}

async function launchWarmChromium() {
  const chromiumCommand = await resolveChromiumCommandCached();
  if (!chromiumCommand) {
    throw new Error("Chromium nije dostupan na serveru za HTML -> PDF konverziju.");
  }

  const tempRoot = await mkdtemp(join(tmpdir(), "taskflow-chromium-cdp-"));
  const userDataDir = join(tempRoot, "profile");
  await mkdir(userDataDir, { recursive: true });

  const child = spawn(chromiumCommand, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--metrics-recording-only",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--mute-audio",
    "--remote-debugging-address=127.0.0.1",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], {
    cwd: tempRoot,
    env: buildChromiumRuntimeEnv(tempRoot),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  const clearWarmInstance = () => {
    if (warmChromiumInstance?.child === child) {
      warmChromiumInstance = null;
      warmChromiumPromise = null;
    }
    void rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  };
  child.once("exit", clearWarmInstance);
  child.once("error", clearWarmInstance);

  let endpoint = "";
  try {
    endpoint = await waitForChromiumDebugEndpoint(child);
  } catch (error) {
    child.kill("SIGKILL");
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
  warmChromiumInstance = {
    ...parseChromiumDebugEndpoint(endpoint),
    child,
    tempRoot,
  };
  child.unref?.();
  child.stdout?.unref?.();
  child.stderr?.unref?.();
  return warmChromiumInstance;
}

async function getWarmChromium() {
  if (String(process.env.HTML_PDF_WARM_CHROMIUM || "").trim().toLowerCase() !== "true") {
    throw new Error("Warm Chromium je iskljucen konfiguracijom.");
  }

  if (warmChromiumInstance?.child && !warmChromiumInstance.child.killed) {
    return warmChromiumInstance;
  }

  if (!warmChromiumPromise) {
    warmChromiumPromise = launchWarmChromium()
      .catch((error) => {
        warmChromiumPromise = null;
        warmChromiumInstance = null;
        throw error;
      });
  }
  return await warmChromiumPromise;
}

async function resetWarmChromiumInstance() {
  const instance = warmChromiumInstance;
  warmChromiumInstance = null;
  warmChromiumPromise = null;
  if (instance?.child && !instance.child.killed) {
    instance.child.kill("SIGKILL");
  }
  if (instance?.tempRoot) {
    await rm(instance.tempRoot, { recursive: true, force: true }).catch(() => {});
  }
}

async function convertPreparedHtmlToPdfBufferWithWarmChromium(printableHtml = "", {
  fileName = "ponuda.html",
  title = "Ponuda",
} = {}) {
  const browser = await getWarmChromium();
  const tempRoot = await mkdtemp(join(tmpdir(), "taskflow-html-cdp-"));
  const sourceBaseName = clean(fileName).replace(/\.(html?|pdf)$/i, "");
  const htmlBaseName = sanitizeGeneratedDocumentFileName(sourceBaseName, {
    fallback: "ponuda",
    extension: "html",
  });
  const inputPath = join(tempRoot, htmlBaseName);
  let client = null;
  let target = null;

  try {
    await writeFile(inputPath, printableHtml, "utf8");
    target = await withTimeout(
      CDP.New({ host: browser.host, port: browser.port, url: "about:blank" }),
      HTML_PDF_CDP_CONNECT_TIMEOUT_MS,
      "Chromium nije otvorio novu PDF karticu na vrijeme.",
    );
    client = await withTimeout(
      CDP({ host: browser.host, port: browser.port, target }),
      HTML_PDF_CDP_CONNECT_TIMEOUT_MS,
      "Chromium DevTools veza nije dostupna.",
    );

    const { Page } = client;
    await Page.enable();
    const loadEvent = withTimeout(
      new Promise((resolvePromise) => Page.loadEventFired(resolvePromise)),
      HTML_PDF_CDP_CONNECT_TIMEOUT_MS,
      "HTML predlozak se nije ucitao na vrijeme.",
    );
    await Page.navigate({ url: pathToFileURL(inputPath).href });
    await loadEvent;

    const pdfResult = await withTimeout(
      Page.printToPDF({
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      }),
      HTML_PDF_CDP_PRINT_TIMEOUT_MS,
      "Chromium nije vratio PDF na vrijeme.",
    );
    const pdfBuffer = Buffer.from(pdfResult?.data || "", "base64");
    if (pdfBuffer.subarray(0, 4).toString("utf8") !== "%PDF") {
      throw new Error("Chromium DevTools je vratio neispravnu PDF datoteku.");
    }
    return pdfBuffer;
  } finally {
    if (client) {
      try {
        await client.close();
      } catch {
        // Ignore DevTools close errors, the target is closed below.
      }
    }
    if (target?.id) {
      await CDP.Close({ host: browser.host, port: browser.port, id: target.id }).catch(() => {});
    }
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }
}

async function convertPreparedHtmlToPdfBufferWithCli(printableHtml = "", {
  fileName = "ponuda.html",
  title = "Ponuda",
} = {}) {
  const chromiumCommand = await resolveChromiumCommandCached();
  if (!chromiumCommand) {
    throw new Error("Chromium nije dostupan na serveru za HTML -> PDF konverziju.");
  }

  const tempRoot = await mkdtemp(join(tmpdir(), "taskflow-html-pdf-"));
  const sourceBaseName = clean(fileName).replace(/\.(html?|pdf)$/i, "");
  const htmlBaseName = sanitizeGeneratedDocumentFileName(sourceBaseName, {
    fallback: "ponuda",
    extension: "html",
  });
  const pdfBaseName = sanitizeGeneratedDocumentFileName(htmlBaseName.replace(/\.html?$/i, ""), {
    fallback: "ponuda",
    extension: "pdf",
  });
  const inputPath = join(tempRoot, htmlBaseName);
  const outputPath = join(tempRoot, pdfBaseName);

  try {
    await writeFile(inputPath, printableHtml, "utf8");
    const commandResult = await runCommand(chromiumCommand, [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-sync",
      "--metrics-recording-only",
      "--no-first-run",
      "--no-pdf-header-footer",
      "--print-to-pdf-no-header",
      `--print-to-pdf=${outputPath}`,
      pathToFileURL(inputPath).href,
    ], {
      cwd: tempRoot,
      env: buildChromiumRuntimeEnv(tempRoot),
      timeoutMs: HTML_PDF_CONVERSION_TIMEOUT_MS,
    });

    if (!await fileExists(outputPath)) {
      const directoryEntries = await readdir(tempRoot).catch(() => []);
      const details = [
        "Chromium nije vratio PDF datoteku.",
        clean(commandResult.stdout) ? `STDOUT: ${clean(commandResult.stdout)}` : "",
        clean(commandResult.stderr) ? `STDERR: ${clean(commandResult.stderr)}` : "",
        directoryEntries.length > 0 ? `Sadrzaj temp direktorija: ${directoryEntries.join(", ")}` : "",
      ].filter(Boolean).join(" ");
      throw new Error(details || "Chromium nije vratio PDF datoteku.");
    }

    const pdfBuffer = await readFile(outputPath);
    if (pdfBuffer.subarray(0, 4).toString("utf8") !== "%PDF") {
      throw new Error("Chromium je vratio neispravnu PDF datoteku.");
    }
    return pdfBuffer;
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }
}

export async function convertHtmlToPdfBuffer(html = "", {
  fileName = "ponuda.html",
  title = "Ponuda",
} = {}) {
  const pdfHtml = buildHtmlPdfDocument(html, { title });
  const printableHtml = prepareHtmlForGeneratedPageNumberPdf(pdfHtml);
  let pdfBuffer = null;

  if (String(process.env.HTML_PDF_WARM_CHROMIUM || "").trim().toLowerCase() === "true") {
    try {
      pdfBuffer = await convertPreparedHtmlToPdfBufferWithWarmChromium(printableHtml, {
        fileName,
        title,
      });
    } catch (warmChromiumError) {
      console.warn("Warm Chromium HTML -> PDF nije uspio, koristim CLI fallback.", warmChromiumError);
      await resetWarmChromiumInstance();
      pdfBuffer = await convertPreparedHtmlToPdfBufferWithCli(printableHtml, {
        fileName,
        title,
      });
    }
  } else {
    pdfBuffer = await convertPreparedHtmlToPdfBufferWithCli(printableHtml, {
      fileName,
      title,
    });
  }

  if (htmlRequestsGeneratedPageNumbers(pdfHtml)) {
    pdfBuffer = await applyGeneratedPageNumbersToPdfBuffer(pdfBuffer, {
      prefix: getGeneratedPageNumberPrefixFromHtml(pdfHtml),
    });
  }

  return pdfBuffer;
}

export async function buildOfferHtmlPdfBuffer(offer = {}, options = {}) {
  const currency = clean(options.currency || offer.currency || "EUR") || "EUR";
  const html = buildOfferHtmlTemplate(offer, {
    ...options,
    currency,
  });
  return convertHtmlToPdfBuffer(html, {
    fileName: sanitizeGeneratedDocumentFileName(
      clean(offer.offerNumber || offer.title || offer.companyName) || "ponuda",
      {
        fallback: "ponuda",
        extension: "html",
      },
    ),
    title: clean(offer.title || offer.offerNumber) || "Ponuda",
  });
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
  const planType = normalizeOfferPlanType(offer.serviceLine);

  const drawOfferPdfPlanRow = (label = "", amount = "", {
    indent = 0,
    isHeader = false,
    isTotal = false,
  } = {}) => {
    const cardWidth = helpers.availableWidth;
    const amountWidth = 132;
    const leftPadding = 14 + indent;
    const labelWidth = Math.max(120, cardWidth - leftPadding - amountWidth - 28);
    doc.font(isHeader || isTotal ? "dejavu-bold" : "dejavu").fontSize(isHeader ? 10.5 : 10);
    const labelHeight = doc.heightOfString(normalizePdfText(label), {
      width: labelWidth,
      lineGap: 1,
    });
    const rowHeight = Math.max(34, labelHeight + 17);

    helpers.ensureSpace(rowHeight + 7);
    const startY = doc.y;
    const backgroundColor = isTotal ? "#eff6ff" : isHeader ? "#f8fafc" : "#ffffff";
    const borderColor = isTotal ? "#bfdbfe" : isHeader ? "#d8e3f5" : "#dfe7f3";

    doc.save();
    doc.roundedRect(doc.page.margins.left, startY, cardWidth, rowHeight, 12);
    doc.fillColor(backgroundColor).fill();
    doc.restore();
    drawRoundedOutline(doc, doc.page.margins.left, startY, cardWidth, rowHeight, 12, borderColor);

    doc.font(isHeader || isTotal ? "dejavu-bold" : "dejavu")
      .fontSize(isHeader ? 10.5 : 10)
      .fillColor(isHeader || isTotal ? "#0f172a" : "#334155")
      .text(normalizePdfText(label), doc.page.margins.left + leftPadding, startY + 9, {
        width: labelWidth,
        lineGap: 1,
      });

    if (clean(amount)) {
      doc.font("dejavu-bold").fontSize(10).fillColor(isTotal ? "#0f3f91" : "#0f172a").text(
        normalizePdfText(amount),
        doc.page.margins.left + cardWidth - amountWidth - 12,
        startY + 9,
        { width: amountWidth, align: "right" },
      );
    }

    doc.y = startY + rowHeight + 7;
  };

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
  writeOfferPdfMetaRow(doc, "Vrsta ponude", offer.serviceLine || "—");

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

  [
    ["Dodatni tekst 1", offer.textBlock1],
    ["Dodatni tekst 2", offer.textBlock2],
  ].forEach(([title, body]) => {
    if (!clean(body)) {
      return;
    }
    doc.moveDown(0.45);
    drawOfferPdfSectionTitle(doc, title);
    doc.font("dejavu").fontSize(10.5).fillColor("#1f2937").text(normalizePdfText(body), {
      width: helpers.availableWidth,
      lineGap: 2,
    });
  });

  doc.moveDown(0.45);
  drawOfferPdfSectionTitle(doc, "Stavke ponude");

  if (items.length === 0) {
    doc.font("dejavu-italic").fontSize(10).fillColor("#64748b").text("Ponuda jos nema dodanih stavki.", {
      width: helpers.availableWidth,
    });
  } else if (planType === "Hybrid Plan") {
    const monthlyItems = getOfferPdfMonthlyItems(items, offer.serviceLine);
    const serviceItems = getOfferPdfServicePricingItems(items, offer.serviceLine);

    doc.moveDown(0.15);
    drawOfferPdfSectionTitle(doc, "Mjesečne naknade");
    if (monthlyItems.length === 0) {
      doc.font("dejavu-italic").fontSize(10).fillColor("#64748b").text("Nema mjesečnih naknada.", {
        width: helpers.availableWidth,
      });
    } else {
      monthlyItems.forEach((item) => {
        const quantityText = getOfferPdfQuantityText(item);
        const label = normalizePdfLines([
          item.description || "Mjesečna naknada",
          quantityText ? `Količina: ${quantityText}` : "",
        ]).join(" · ");
        drawOfferPdfPlanRow(label, formatOfferPdfItemAmount(item, currency));
      });
    }

    doc.moveDown(0.2);
    drawOfferPdfSectionTitle(doc, "Cjenik usluga");
    if (serviceItems.length === 0) {
      doc.font("dejavu-italic").fontSize(10).fillColor("#64748b").text("Nema usluga u cjeniku.", {
        width: helpers.availableWidth,
      });
    } else {
      serviceItems.forEach((item) => {
        drawOfferPdfPlanRow(item.description || "Usluga", "", { isHeader: true });
        getOfferPdfBreakdownRows(item).forEach((entry) => {
          drawOfferPdfPlanRow(
            `- ${getOfferPdfBreakdownDocumentLabel(entry)}`,
            formatOfferPdfCurrency(parseOfferPdfNumber(entry.amount, 0), currency),
            { indent: 14 },
          );
        });
      });
    }
  } else if (planType === "Fixed Plan") {
    items.forEach((item) => {
      const label = item.description || item.serviceCode || "Stavka";
      drawOfferPdfPlanRow(label, formatOfferPdfItemAmount(item, currency));
    });
  } else {
    items.forEach((item, index) => {
      helpers.ensureSpace(74 + ((item.breakdowns?.length ?? 0) * 20));
      const startY = doc.y;
      const cardWidth = helpers.availableWidth;
      const breakdowns = getOfferPdfBreakdownRows(item);
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
        const breakdownLabel = getOfferPdfBreakdownDocumentLabel(entry);
        doc.font("dejavu").fontSize(9.5).fillColor("#334155").text(
          `• ${normalizePdfText(breakdownLabel)}`,
          doc.page.margins.left + 18,
          contentY,
          { width: cardWidth - 170 },
        );
        doc.font("dejavu-bold").fontSize(9.5).fillColor("#0f172a").text(
          formatOfferPdfCurrency(parseOfferPdfNumber(entry.amount, 0), currency),
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
        formatOfferPdfItemAmount(item, currency) || formatOfferPdfCurrency(item.totalPrice ?? 0, currency),
        doc.page.margins.left + cardWidth - 132,
        startY + 18,
        { width: 118, align: "right" },
      );

      doc.y = startY + rowHeight + 8;
    });
  }

  if (offer.showTotalAmount !== false) {
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
          formatOfferPdfCurrency(parseOfferPdfNumber(entry.amount, 0), currency),
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

export function isHtmlTemplateFile(referenceDocument = {}) {
  const fileName = clean(referenceDocument.fileName || referenceDocument.name || "");
  const fileType = clean(referenceDocument.fileType || referenceDocument.mimeType || "");
  const extension = extname(fileName).toLowerCase();

  return [".html", ".htm"].includes(extension)
    || /^text\/html\b/i.test(fileType);
}
