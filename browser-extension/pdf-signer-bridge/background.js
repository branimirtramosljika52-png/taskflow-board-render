importScripts("pdf-signer.config.js");

const NATIVE_HOST_NAME = self.SAFE_NEXUS_PDF_SIGNER_CONFIG?.nativeHostName || "hr.abeceda.pdfsigner";
const SUPPORTED_TYPES = new Set(["PING_SIGNER", "SIGN_DOCUMENTS", "GET_SIGNATURE_FIELDS"]);

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
  };
}

function normalizeMessage(message) {
  const type = String(message?.type || "").trim();
  if (!SUPPORTED_TYPES.has(type)) {
    throw createErrorResponse("UNSUPPORTED_MESSAGE", "PDF Signer ne podrzava ovu naredbu.");
  }

  if (type === "PING_SIGNER") {
    return { type };
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

  return {
    type,
    jobId,
    token,
    apiBaseUrl,
    documents,
    dryRun: Boolean(message?.dryRun),
  };
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
