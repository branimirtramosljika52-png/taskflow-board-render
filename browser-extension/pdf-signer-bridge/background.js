importScripts("pdf-signer.config.js");

const NATIVE_HOST_NAME = self.SAFE_NEXUS_PDF_SIGNER_CONFIG?.nativeHostName || "hr.abeceda.pdfsigner";
const SUPPORTED_TYPES = new Set([
  "PING_SIGNER",
  "SIGN_DOCUMENTS",
  "GET_SIGNATURE_FIELDS",
  "GET_SIGNER_SETTINGS",
  "SAVE_SIGNER_SETTINGS",
  "TEST_TOKEN_DETECTION",
  "OPEN_SIGNER_SETTINGS",
]);

function createErrorResponse(code, message, details = {}) {
  return {
    success: false,
    ok: false,
    code,
    message,
    ...details,
  };
}

function sanitizeDocument(document) {
  return {
    id: document?.id ?? document?.documentId ?? "",
    documentId: document?.documentId ?? document?.id ?? "",
    fileName: String(document?.fileName || "zapisnik.pdf"),
    preferredField: String(document?.preferredField || ""),
    signatureFieldRole: String(document?.signatureFieldRole || ""),
    signatureFieldOib: String(document?.signatureFieldOib || ""),
    signatureFieldsJson: String(document?.signatureFieldsJson || ""),
    downloadUrl: String(document?.downloadUrl || ""),
    uploadUrl: String(document?.uploadUrl || ""),
    lockToken: String(document?.lockToken || document?.signingLockToken || ""),
    signingLockToken: String(document?.signingLockToken || document?.lockToken || ""),
  };
}

function sanitizeSignerSettings(settings) {
  return settings && typeof settings === "object" ? { ...settings } : {};
}

function sanitizeDebugAppearance(debugAppearance) {
  return debugAppearance && typeof debugAppearance === "object" ? { ...debugAppearance } : null;
}

function normalizeMessage(message) {
  const type = String(message?.type || "").trim();
  if (!SUPPORTED_TYPES.has(type)) {
    throw createErrorResponse("UNSUPPORTED_MESSAGE", "PDF Signer ne podrzava ovu naredbu.");
  }

  if (type === "PING_SIGNER" || type === "GET_SIGNER_SETTINGS" || type === "TEST_TOKEN_DETECTION" || type === "OPEN_SIGNER_SETTINGS") {
    return { type };
  }

  if (type === "SAVE_SIGNER_SETTINGS") {
    return {
      type,
      settings: sanitizeSignerSettings(message?.settings),
    };
  }

  const apiBaseUrl = String(message?.apiBaseUrl || message?.apiBase || "").trim();
  const token = String(message?.token || "").trim();
  const jobId = String(message?.jobId || message?.token || "").trim();
  const documents = Array.isArray(message?.documents) ? message.documents.map(sanitizeDocument) : [];

  if (!apiBaseUrl || !token || documents.length === 0) {
    throw createErrorResponse(
      "INVALID_SIGN_REQUEST",
      "Nedostaje potpisni paket ili dokumenti za potpis.",
    );
  }

  const payload = {
    type,
    jobId,
    token,
    apiBaseUrl,
    documents,
  };
  const settings = sanitizeSignerSettings(message?.settings);
  if (Object.keys(settings).length > 0) {
    payload.settings = settings;
  }
  const debugAppearance = sanitizeDebugAppearance(message?.debugAppearance);
  if (debugAppearance) {
    payload.debugAppearance = debugAppearance;
  }

  if (Object.prototype.hasOwnProperty.call(message || {}, "dryRun")) {
    payload.dryRun = Boolean(message.dryRun);
  }

  return payload;
}

function sendToNativeHost(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, payload, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        resolve(createErrorResponse(
          "NATIVE_HOST_UNAVAILABLE",
          "Za digitalno potpisivanje potrebno je instalirati PDF Signer ekstenziju i lokalni Signer program.",
          { nativeError: error.message || "" },
        ));
        return;
      }

      resolve(response || createErrorResponse(
        "EMPTY_NATIVE_RESPONSE",
        "Lokalni signer nije vratio odgovor.",
      ));
    });
  });
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const payload = normalizeMessage(message);
      const response = await sendToNativeHost(payload);
      sendResponse(response);
    } catch (error) {
      sendResponse(error?.code
        ? error
        : createErrorResponse("BRIDGE_ERROR", error?.message || "PDF Signer bridge nije dostupan."));
    }
  })();

  return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const payload = normalizeMessage(message);
      sendResponse(await sendToNativeHost(payload));
    } catch (error) {
      sendResponse(error?.code
        ? error
        : createErrorResponse("BRIDGE_ERROR", error?.message || "PDF Signer bridge nije dostupan."));
    }
  })();

  return true;
});
