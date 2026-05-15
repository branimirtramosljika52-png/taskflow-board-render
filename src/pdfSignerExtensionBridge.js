import {
  PDF_SIGNER_EXTENSION_ID,
  PDF_SIGNER_EXTENSION_INSTALL_URL,
} from "./pdfSignerExtensionConfig.js";

const PDF_SIGNER_EXTENSION_ID_STORAGE_KEY = "safeNexus.pdfSignerExtensionId";
const PDF_SIGNER_EXTENSION_ID_META = "safe-nexus-pdf-signer-extension-id";
const MESSAGE_TIMEOUT_MS = 15000;

export class PdfSignerExtensionError extends Error {
  constructor(message, code = "PDF_SIGNER_EXTENSION_ERROR", details = {}) {
    super(message);
    this.name = "PdfSignerExtensionError";
    this.code = code;
    this.details = details;
  }
}

function normalizeExtensionId(value = "") {
  return String(value || "").trim();
}

export function getPdfSignerExtensionInstallUrl() {
  return String(window.SAFE_NEXUS_PDF_SIGNER_INSTALL_URL || PDF_SIGNER_EXTENSION_INSTALL_URL || "");
}

export function getPdfSignerExtensionId() {
  const configuredId = normalizeExtensionId(window.SAFE_NEXUS_PDF_SIGNER_EXTENSION_ID);
  if (configuredId) {
    return configuredId;
  }

  const metaId = normalizeExtensionId(
    document.querySelector(`meta[name="${PDF_SIGNER_EXTENSION_ID_META}"]`)?.getAttribute("content"),
  );
  if (metaId) {
    return metaId;
  }

  const centralConfigId = normalizeExtensionId(PDF_SIGNER_EXTENSION_ID);
  if (centralConfigId) {
    return centralConfigId;
  }

  try {
    return normalizeExtensionId(localStorage.getItem(PDF_SIGNER_EXTENSION_ID_STORAGE_KEY));
  } catch {
    return "";
  }
}

function getChromeRuntime() {
  return window.chrome?.runtime ?? null;
}

function createUnavailableError(message = "") {
  return new PdfSignerExtensionError(
    message || "Za digitalno potpisivanje potrebno je instalirati PDF Signer ekstenziju i lokalni Signer program.",
    "PDF_SIGNER_EXTENSION_UNAVAILABLE",
  );
}

export function isPdfSignerExtensionUnavailable(error) {
  return error?.code === "PDF_SIGNER_EXTENSION_UNAVAILABLE"
    || error?.code === "PDF_SIGNER_EXTENSION_ID_MISSING"
    || error?.code === "NATIVE_HOST_UNAVAILABLE";
}

export async function sendMessageToPdfSignerExtension(message = {}, options = {}) {
  const extensionId = normalizeExtensionId(options.extensionId || getPdfSignerExtensionId());
  if (!extensionId) {
    throw new PdfSignerExtensionError(
      "PDF Signer ekstenzija nije povezana s ovom instalacijom.",
      "PDF_SIGNER_EXTENSION_ID_MISSING",
    );
  }

  const runtime = getChromeRuntime();
  if (!runtime?.sendMessage) {
    throw createUnavailableError();
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new PdfSignerExtensionError(
        "PDF Signer nije odgovorio na vrijeme.",
        "PDF_SIGNER_EXTENSION_TIMEOUT",
      ));
    }, Number(options.timeoutMs || MESSAGE_TIMEOUT_MS));

    try {
      runtime.sendMessage(extensionId, message, (response) => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timeout);

        const lastError = runtime.lastError;
        if (lastError) {
          reject(createUnavailableError(lastError.message || ""));
          return;
        }

        if (!response) {
          reject(createUnavailableError("PDF Signer nije vratio odgovor."));
          return;
        }

        if ((response.success === false || response.ok === false) && !options.allowErrorResponse) {
          reject(new PdfSignerExtensionError(
            response.message || "PDF Signer nije uspio obraditi dokumente.",
            response.code || "PDF_SIGNER_EXTENSION_RESPONSE_ERROR",
            response,
          ));
          return;
        }

        resolve(response);
      });
    } catch (error) {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeout);
      reject(createUnavailableError(error?.message || ""));
    }
  });
}

export function pingPdfSignerExtension() {
  return sendMessageToPdfSignerExtension({ type: "PING_SIGNER" }, { timeoutMs: 7000 });
}

export function signDocumentsWithPdfSignerExtension({
  jobId = "",
  token = "",
  apiBaseUrl = "",
  documents = [],
  settings = {},
  dryRun,
} = {}) {
  const payload = {
    type: "SIGN_DOCUMENTS",
    jobId,
    token,
    apiBaseUrl,
    documents,
    settings,
  };
  if (typeof dryRun === "boolean") {
    payload.dryRun = dryRun;
  }
  return sendMessageToPdfSignerExtension(payload, { timeoutMs: 120000 });
}

export function getSignatureFieldsWithPdfSignerExtension({
  jobId = "",
  token = "",
  apiBaseUrl = "",
  documents = [],
  settings = {},
  allowErrorResponse = false,
} = {}) {
  return sendMessageToPdfSignerExtension({
    type: "GET_SIGNATURE_FIELDS",
    jobId,
    token,
    apiBaseUrl,
    documents,
    settings,
  }, { timeoutMs: 120000, allowErrorResponse });
}

export function getSignerSettingsWithPdfSignerExtension() {
  return sendMessageToPdfSignerExtension({ type: "GET_SIGNER_SETTINGS" }, { timeoutMs: 10000 });
}

export function saveSignerSettingsWithPdfSignerExtension(settings = {}) {
  return sendMessageToPdfSignerExtension({
    type: "SAVE_SIGNER_SETTINGS",
    settings,
  }, { timeoutMs: 15000 });
}

export function testSignerTokenDetectionWithPdfSignerExtension() {
  return sendMessageToPdfSignerExtension({ type: "TEST_TOKEN_DETECTION" }, { timeoutMs: 20000 });
}

export function openSignerSettingsWithPdfSignerExtension() {
  return sendMessageToPdfSignerExtension({ type: "OPEN_SIGNER_SETTINGS" }, { timeoutMs: 300000 });
}
