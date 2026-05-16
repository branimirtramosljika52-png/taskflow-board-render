package hr.sign;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Properties;

public final class NativeMessagingMain {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String VERSION = "1.4.2-minimal-logo-appearance";
    private static final int MAX_MESSAGE_BYTES = 8 * 1024 * 1024;

    private NativeMessagingMain() {
    }

    public static void main(String[] args) {
        if (hasArg(args, "--settings")) {
            SignerSettingsDialog.open();
            return;
        }
        try {
            run(System.in, System.out);
        } catch (Exception error) {
            System.err.println("NativeMessagingMain error: " + safeMessage(error));
        }
    }

    static void run(InputStream input, OutputStream output) throws IOException {
        while (true) {
            JsonNode request;
            try {
                request = readNativeMessage(input);
            } catch (EOFException done) {
                return;
            }

            JsonNode response;
            try {
                response = handleMessage(request);
            } catch (Exception error) {
                response = errorResponse("", "NATIVE_HOST_ERROR", safeMessage(error));
            }
            writeNativeMessage(output, response);
        }
    }

    private static JsonNode handleMessage(JsonNode request) {
        SignerConfig config = loadConfigWithRequestOverrides(request);
        String type = text(request, "type", "").trim();
        return switch (type) {
            case "PING_SIGNER" -> pingResponse(config);
            case "GET_SIGNATURE_FIELDS" -> getSignatureFields(request, config);
            case "GET_SIGNER_SETTINGS" -> getSignerSettings(config);
            case "SAVE_SIGNER_SETTINGS" -> saveSignerSettings(request);
            case "TEST_TOKEN_DETECTION" -> testTokenDetection(config);
            case "OPEN_SIGNER_SETTINGS" -> openSignerSettings(config);
            case "SIGN_DOCUMENTS" -> config.isMock()
                    ? signDocumentsMock(request, config)
                    : signDocumentsReal(request, config);
            default -> errorResponse(text(request, "jobId", ""), "UNSUPPORTED_MESSAGE", "Nepodrzana naredba za PDF Signer.");
        };
    }

    private static SignerConfig loadConfigWithRequestOverrides(JsonNode request) {
        Properties overrides = settingsOverrides(request.path("settings"));
        putAppearanceSettings(overrides, request.path("appearance"));
        return SignerConfig.loadWithOverrides(overrides);
    }

    private static Properties settingsOverrides(JsonNode settings) {
        Properties properties = new Properties();
        if (settings == null || !settings.isObject()) {
            return properties;
        }
        putOverride(properties, settings, "apiAllowlist", "api.allowlist");
        putOverride(properties, settings, "providerOrder", "providers.order");
        putOverride(properties, settings, "eoiPkcs11", "eoi.pkcs11");
        putOverride(properties, settings, "eoiSlotIndex", "eoi.slotIndex");
        putOverride(properties, settings, "finaPkcs11", "fina.pkcs11");
        putOverride(properties, settings, "finaSlotIndex", "fina.slotIndex");
        putOverride(properties, settings, "rectWidthCm", "rect.width.cm");
        putOverride(properties, settings, "rectHeightCm", "rect.height.cm");
        putOverride(properties, settings, "offsetDownCm", "offset.down.cm");
        putOverride(properties, settings, "offsetLeftCm", "offset.left.cm");
        putOverride(properties, settings, "fontSize", "font.size");
        putOverride(properties, settings, "reason", "reason");
        putOverride(properties, settings, "location", "location");
        putAppearanceSettings(properties, settings.path("appearance"));
        properties.setProperty("signer.mode", "real");
        properties.setProperty("real.dryRun", "false");
        return properties;
    }

    private static void putOverride(Properties properties, JsonNode settings, String sourceKey, String targetKey) {
        if (!settings.has(sourceKey)) {
            return;
        }
        String value = settings.path(sourceKey).asText("").trim();
        if (!value.isBlank()) {
            properties.setProperty(targetKey, value);
        }
    }

    private static JsonNode pingResponse(SignerConfig config) {
        ObjectNode response = JSON.createObjectNode();
        response.put("success", true);
        response.put("ok", true);
        response.put("version", VERSION);
        response.put("mode", config.isMock()
                ? "native-messaging-mock"
                : (config.realDryRun() ? "native-messaging-real-dry-run" : "native-messaging-real"));
        response.put("signerMode", config.modeName());
        response.put("realDryRun", config.realDryRun());
        response.put("apiAllowlist", String.join(", ", config.allowedApiBases()));
        response.put("providerOrder", String.join(", ", config.providerOrder()));
        response.set("appearanceDebug", appearanceDebugNode(config));
        return response;
    }

    private static JsonNode getSignerSettings(SignerConfig config) {
        ObjectNode response = JSON.createObjectNode();
        response.put("success", true);
        response.put("ok", true);
        response.set("settings", safeSettingsNode(config));
        response.set("appearanceDebug", appearanceDebugNode(config));
        return response;
    }

    private static JsonNode saveSignerSettings(JsonNode request) {
        try {
            JsonNode settings = request.path("settings");
            Properties properties = SignerConfig.loadRawProperties();
            putSetting(properties, settings, "signerMode", "signer.mode");
            putSetting(properties, settings, "mode", "signer.mode");
            putSetting(properties, settings, "realDryRun", "real.dryRun");
            putSetting(properties, settings, "dryRun", "real.dryRun");
            putSetting(properties, settings, "apiAllowlist", "api.allowlist");
            putSetting(properties, settings, "pdfFolder", "pdf.folder");
            putSetting(properties, settings, "keyword", "keyword");
            putSetting(properties, settings, "caseInsensitive", "case.insensitive");
            putSetting(properties, settings, "providerOrder", "providers.order");
            putSetting(properties, settings, "eoiPkcs11", "eoi.pkcs11");
            putSetting(properties, settings, "eoiSlotIndex", "eoi.slotIndex");
            putSetting(properties, settings, "finaPkcs11", "fina.pkcs11");
            putSetting(properties, settings, "finaSlotIndex", "fina.slotIndex");
            putSetting(properties, settings, "rectWidthCm", "rect.width.cm");
            putSetting(properties, settings, "rectHeightCm", "rect.height.cm");
            putSetting(properties, settings, "offsetDownCm", "offset.down.cm");
            putSetting(properties, settings, "offsetLeftCm", "offset.left.cm");
            putSetting(properties, settings, "fontSize", "font.size");
            putSetting(properties, settings, "reason", "reason");
            putSetting(properties, settings, "location", "location");
            putSetting(properties, settings, "fallbackKeywordEnabled", "fallback.keyword.enabled");
            putSetting(properties, settings, "fallbackKeyword", "fallback.keyword");
            putSetting(properties, settings, "fallbackCaseInsensitive", "fallback.case.insensitive");
            putSetting(properties, settings, "skipAlreadySigned", "skip.already.signed");
            putSetting(properties, settings, "skipTolerancePt", "skip.tolerance.pt");
            putSetting(properties, settings, "previewHideAlreadySigned", "preview.hide.already.signed");
            putAppearanceSettings(properties, settings.path("appearance"));
            putJsonObjectSetting(properties, settings, "rolePositioning", "signature.positioning.json");

            properties.setProperty("signer.mode", "real");
            properties.setProperty("real.dryRun", "false");
            properties.remove("pin");
            properties.remove("eoi.pin");
            properties.remove("fina.pin");
            SignerConfig.saveRawProperties(properties);

            SignerConfig saved = SignerConfig.load();
            ObjectNode response = JSON.createObjectNode();
            response.put("success", true);
            response.put("ok", true);
            response.put("message", "PDF Signer postavke su spremljene lokalno. PIN nije spremljen.");
            response.set("settings", safeSettingsNode(saved));
            response.set("appearanceDebug", appearanceDebugNode(saved));
            return response;
        } catch (Exception error) {
            return errorResponse(text(request, "jobId", ""), "SETTINGS_SAVE_FAILED", "Postavke nisu spremljene: " + safeMessage(error));
        }
    }

    private static JsonNode testTokenDetection(SignerConfig config) {
        ObjectNode response = JSON.createObjectNode();
        ArrayNode providers = JSON.createArrayNode();
        for (TokenService.TokenProbe probe : new TokenService().detectTokenDetails(config)) {
            ObjectNode provider = JSON.createObjectNode();
            provider.put("provider", probe.provider());
            provider.put("present", probe.present());
            provider.put("message", probe.message());
            provider.put("subject", probe.subject());
            provider.put("subjectDn", probe.subject());
            provider.put("parsedSerialNumber", probe.serialNumber());
            provider.put("serialNumber", probe.serialNumber());
            provider.put("parsedOib", probe.oib());
            provider.put("oib", probe.oib());
            provider.put("alias", probe.alias());
            provider.put("keyAlgorithm", probe.keyAlgorithm());
            providers.add(provider);
        }
        response.put("success", true);
        response.put("ok", true);
        response.set("providers", providers);
        return response;
    }

    private static JsonNode openSignerSettings(SignerConfig config) {
        SignerSettingsDialog.open();
        return getSignerSettings(SignerConfig.load());
    }

    private static ObjectNode safeSettingsNode(SignerConfig config) {
        Properties raw = SignerConfig.loadRawProperties();
        ObjectNode settings = JSON.createObjectNode();
        settings.put("signerMode", config.modeName());
        settings.put("realDryRun", config.realDryRun());
        settings.put("apiAllowlist", String.join("\n", config.allowedApiBases()));
        settings.put("providerOrder", String.join(",", config.providerOrder()));
        settings.put("eoiPkcs11", config.eoiPkcs11Lib());
        settings.put("eoiSlotIndex", config.eoiSlotIndex() == null ? "" : String.valueOf(config.eoiSlotIndex()));
        settings.put("finaPkcs11", config.finaPkcs11Lib());
        settings.put("finaSlotIndex", config.finaSlotIndex() == null ? "" : String.valueOf(config.finaSlotIndex()));
        settings.put("rectWidthCm", raw.getProperty("rect.width.cm", "6"));
        settings.put("rectHeightCm", raw.getProperty("rect.height.cm", "1.5"));
        settings.put("offsetDownCm", raw.getProperty("offset.down.cm", "2.2"));
        settings.put("offsetLeftCm", raw.getProperty("offset.left.cm", "2.6"));
        settings.put("fontSize", raw.getProperty("font.size", "7.5"));
        settings.put("reason", config.reason());
        settings.put("location", config.location());
        ObjectNode appearance = JSON.createObjectNode();
        appearance.put("showQualifiedLabel", config.appearanceShowQualifiedLabel());
        appearance.put("showName", config.appearanceShowName());
        appearance.put("showTitle", config.appearanceShowTitle());
        appearance.put("showRole", config.appearanceShowRole());
        appearance.put("showOib", config.appearanceShowOib());
        appearance.put("showOrganization", config.appearanceShowOrganization());
        appearance.put("showDateTime", config.appearanceShowDateTime());
        appearance.put("showLogo", config.appearanceShowLogo());
        appearance.put("showCertificateSubject", config.appearanceShowCertificateSubject());
        appearance.put("showProvider", config.appearanceShowProvider());
        appearance.put("showReason", config.appearanceShowReason());
        appearance.put("showLocation", config.appearanceShowLocation());
        putLogoDebugFields(appearance, config.appearanceShowLogo(), config.appearanceLogoDataUrl(), "settings.appearance.logoDataUrl");
        appearance.put("logoDataUrl", "");
        appearance.put("logoDataUrlOmitted", !String.valueOf(config.appearanceLogoDataUrl() == null ? "" : config.appearanceLogoDataUrl()).trim().isBlank());
        appearance.put("logoOpacity", raw.getProperty("appearance.logo.opacity", "0.14"));
        appearance.put("border", config.appearanceBorder());
        appearance.put("transparentBackground", config.appearanceTransparentBackground());
        appearance.put("alignment", config.appearanceAlignment());
        appearance.put("compactMode", config.appearanceCompactMode());
        settings.set("appearance", appearance);
        settings.set("rolePositioning", parseJsonObjectSetting(raw.getProperty("signature.positioning.json", "{}")));
        return settings;
    }

    private static void putAppearanceSettings(Properties properties, JsonNode appearance) {
        if (appearance == null || !appearance.isObject()) {
            return;
        }
        putSetting(properties, appearance, "showQualifiedLabel", "appearance.show.qualifiedLabel");
        putSetting(properties, appearance, "showName", "appearance.show.name");
        putSetting(properties, appearance, "showTitle", "appearance.show.title");
        putSetting(properties, appearance, "showRole", "appearance.show.role");
        putSetting(properties, appearance, "showOib", "appearance.show.oib");
        putSetting(properties, appearance, "showOrganization", "appearance.show.organization");
        putSetting(properties, appearance, "showDateTime", "appearance.show.dateTime");
        putSetting(properties, appearance, "showLogo", "appearance.show.logo");
        putSetting(properties, appearance, "logoEnabled", "appearance.show.logo");
        putSetting(properties, appearance, "showCertificateSubject", "appearance.show.certificateSubject");
        putSetting(properties, appearance, "showProvider", "appearance.show.provider");
        putSetting(properties, appearance, "showReason", "appearance.show.reason");
        putSetting(properties, appearance, "showLocation", "appearance.show.location");
        putSetting(properties, appearance, "logoDataUrl", "appearance.logo.dataUrl");
        putSetting(properties, appearance, "logoOpacity", "appearance.logo.opacity");
        putSetting(properties, appearance, "border", "appearance.border");
        putSetting(properties, appearance, "borderEnabled", "appearance.border");
        putSetting(properties, appearance, "transparentBackground", "appearance.transparentBackground");
        putSetting(properties, appearance, "alignment", "appearance.alignment");
        putSetting(properties, appearance, "compactMode", "appearance.compactMode");
    }

    private static void putSetting(Properties properties, JsonNode settings, String sourceName, String targetName) {
        if (settings == null || !settings.has(sourceName)) {
            return;
        }
        JsonNode value = settings.get(sourceName);
        if (value == null || value.isNull()) {
            properties.setProperty(targetName, "");
        } else {
            properties.setProperty(targetName, value.isBoolean() ? Boolean.toString(value.asBoolean()) : value.asText(""));
        }
    }

    private static void putJsonObjectSetting(Properties properties, JsonNode settings, String sourceName, String targetName) throws IOException {
        if (settings == null || !settings.has(sourceName)) {
            return;
        }
        JsonNode value = settings.get(sourceName);
        if (value == null || value.isNull()) {
            properties.setProperty(targetName, "{}");
            return;
        }
        if (value.isTextual()) {
            properties.setProperty(targetName, JSON.writeValueAsString(parseJsonObjectSetting(value.asText("{}"))));
            return;
        }
        if (!value.isObject()) {
            throw new IOException(sourceName + " mora biti JSON objekt.");
        }
        properties.setProperty(targetName, JSON.writeValueAsString(value));
    }

    private static ObjectNode parseJsonObjectSetting(String rawJson) {
        try {
            JsonNode parsed = JSON.readTree(rawJson == null || rawJson.isBlank() ? "{}" : rawJson);
            if (parsed != null && parsed.isObject()) {
                return (ObjectNode) parsed;
            }
        } catch (Exception ignored) {
            // Invalid persisted settings should not break the signer settings panel.
        }
        return JSON.createObjectNode();
    }

    private static JsonNode signDocumentsMock(JsonNode request, SignerConfig config) {
        String jobId = text(request, "jobId", "");
        ObjectNode response = JSON.createObjectNode();
        response.put("jobId", jobId);
        response.set("appearanceDebug", appearanceDebugNode(config));
        response.set("appearanceUsed", appearanceDebugNode(config));
        putRequestAppearanceDebug(response, request);

        String apiBaseUrl = text(request, "apiBaseUrl", text(request, "apiBase", ""));
        if (!isAllowedApiBaseUrl(apiBaseUrl)) {
            return errorResponse(jobId, "API_BASE_NOT_ALLOWED", "Java signer smije komunicirati samo sa safe-nexus.org ili lokalnim development hostom.");
        }

        if (text(request, "token", "").isBlank()) {
            return errorResponse(jobId, "MISSING_TOKEN", "Nedostaje kratkotrajni token za potpisivanje.");
        }

        JsonNode documents = request.path("documents");
        if (!documents.isArray() || documents.size() == 0) {
            return errorResponse(jobId, "NO_DOCUMENTS", "Nema dokumenata za potpisivanje.");
        }

        ArrayNode signedDocuments = JSON.createArrayNode();
        for (JsonNode document : documents) {
            ObjectNode item = JSON.createObjectNode();
            item.put("documentId", text(document, "documentId", text(document, "id", "")));
            item.put("fileName", text(document, "fileName", "zapisnik.pdf"));
            item.put("preferredField", text(document, "preferredField", ""));
            item.put("status", "mock_signed");
            signedDocuments.add(item);
        }

        response.put("success", true);
        response.put("ok", true);
        response.put("signed", documents.size());
        response.put("skipped", 0);
        response.put("message", "MVP mock: dokumenti su prihvaceni za potpis. Stvarni eOI/FINA potpis jos nije ukljucen.");
        response.set("documents", signedDocuments);
        response.set("errors", JSON.createArrayNode());
        return response;
    }

    private static JsonNode getSignatureFields(JsonNode request, SignerConfig config) {
        String jobId = text(request, "jobId", text(request, "token", ""));
        ObjectNode response = baseRealResponse(jobId, config, true);
        putRequestAppearanceDebug(response, request);
        ArrayNode documents = JSON.createArrayNode();
        ArrayNode fields = JSON.createArrayNode();
        ArrayNode errors = JSON.createArrayNode();

        try {
            config.requireSafeNexusApiBase(text(request, "apiBaseUrl", text(request, "apiBase", "")));
            JsonNode job = new SignatureBridgeClient(config).getJob(
                    text(request, "apiBaseUrl", text(request, "apiBase", "")),
                    text(request, "token", "")
            );
            SignatureBridgeClient client = new SignatureBridgeClient(config);
            PdfSignatureFieldService fieldService = new PdfSignatureFieldService();

            for (JsonNode item : job.path("items")) {
                ObjectNode documentResult = documentBase(item);
                documentResult.set("appearanceUsed", appearanceDebugNode(config));
                try {
                    byte[] pdf = client.downloadPdf(text(item, "downloadUrl", ""), text(item, "documentId", ""));
                    List<PdfSignatureFieldService.SignatureFieldInfo> itemFields = fieldService.listSignatureFields(pdf);
                    ArrayNode fieldNodes = JSON.createArrayNode();
                    for (PdfSignatureFieldService.SignatureFieldInfo field : itemFields) {
                        ObjectNode node = fieldNode(field);
                        node.put("itemId", text(item, "id", ""));
                        node.put("documentId", text(item, "documentId", ""));
                        node.put("fileName", text(item, "fileName", "zapisnik.pdf"));
                        fieldNodes.add(node);
                        fields.add(node.deepCopy());
                    }
                    documentResult.set("fields", fieldNodes);
                    if (itemFields.isEmpty()) {
                        ObjectNode error = errorItem(
                                item,
                                "NO_SIGNATURE_FIELDS",
                                "PDF nema AcroForm signature fieldove.",
                                "",
                                ""
                        );
                        errors.add(error);
                        documentResult.set("error", error.deepCopy());
                    }
                } catch (SignatureBridgeException error) {
                    ObjectNode errorNode = errorItem(
                            item,
                            error.code(),
                            error.getMessage(),
                            error.technicalMessage(),
                            stackTrace(error.getCause())
                    );
                    errors.add(errorNode);
                    documentResult.set("fields", JSON.createArrayNode());
                    documentResult.set("error", errorNode.deepCopy());
                } catch (Exception error) {
                    ObjectNode errorNode = errorItem(
                            item,
                            "DOWNLOAD_FAILED",
                            "Ne mogu procitati PDF signature fieldove.",
                            error.getClass().getName() + ": " + safeMessage(error),
                            stackTrace(error)
                    );
                    errors.add(errorNode);
                    documentResult.set("fields", JSON.createArrayNode());
                    documentResult.set("error", errorNode.deepCopy());
                }
                documents.add(documentResult);
            }
        } catch (SignatureBridgeException error) {
            return errorResponse(jobId, error.code(), error.getMessage(), error.technicalMessage(), stackTrace(error.getCause()));
        } catch (Exception error) {
            return errorResponse(jobId, "DOWNLOAD_FAILED", "Ne mogu dohvatiti signature fieldove.", error.getClass().getName() + ": " + safeMessage(error), stackTrace(error));
        }

        boolean ok = errors.isEmpty();
        response.put("success", ok);
        response.put("ok", ok);
        response.put("fieldCount", fields.size());
        response.set("documents", documents);
        response.set("fields", fields);
        response.set("errors", errors);
        if (!ok && fields.isEmpty()) {
            response.put("code", "NO_SIGNATURE_FIELDS");
            response.put("message", "Nije pronadjen nijedan PDF signature field.");
        }
        return response;
    }

    private static JsonNode signDocumentsReal(JsonNode request, SignerConfig config) {
        String jobId = text(request, "jobId", text(request, "token", ""));
        boolean dryRun = request.path("dryRun").asBoolean(config.realDryRun());
        if (dryRun) {
            return signDocumentsRealDryRun(request, config);
        }

        ObjectNode response = baseRealResponse(jobId, config, false);
        putRequestAppearanceDebug(response, request);
        response.put("pinRequested", true);
        ArrayNode documents = JSON.createArrayNode();
        ArrayNode errors = JSON.createArrayNode();
        int signed = 0;
        int skipped = 0;
        boolean anyLogoApplied = false;
        boolean anyBorderApplied = false;
        String lastAppearanceMode = "";

        String apiBaseUrl = text(request, "apiBaseUrl", text(request, "apiBase", ""));
        String token = text(request, "token", "");
        TokenService tokenService = new TokenService();

        try {
            config.requireSafeNexusApiBase(apiBaseUrl);
            SignatureBridgeClient client = new SignatureBridgeClient(config);
            JsonNode job = client.getJob(apiBaseUrl, token);
            PdfSignatureFieldService fieldService = new PdfSignatureFieldService();
            SigningService signingService = new SigningService(config, tokenService, fieldService);

            try (TokenService.Credential credential = tokenService.resolveCredentialWithGuiPin(config)) {
                String signerOib = credential.oib();
                response.put("signerOib", signerOib);
                response.put("certificateOibFound", !signerOib.isBlank());
                if (signerOib.isBlank()) {
                    response.put("certificateWarningCode", "CERTIFICATE_OIB_NOT_FOUND");
                    response.put("certificateWarning", "Iz certifikata nije moguce procitati OIB/SERIALNUMBER potpisnika. Ako job ima preferredField, potpisivanje se nastavlja po tom fieldu.");
                }
                response.put("signerName", credential.commonName());
                response.put("certificateSerialNumber", credential.serialNumber());
                response.put("certificateSubject", credential.subject());
                response.put("alias", credential.alias());
                response.put("provider", credential.providerName());

                for (JsonNode item : job.path("items")) {
                    ObjectNode documentResult = documentBase(item);
                    documentResult.set("appearanceUsed", appearanceDebugNode(config));
                    putSignatureMetadata(documentResult, item);
                    documentResult.put("signerOib", signerOib);
                    SigningService.SignatureAppearanceMetadata appearanceMetadata = new SigningService.SignatureAppearanceMetadata(
                            text(item, "signerName", text(item, "signatureSigner", "")),
                            text(item, "signerTitle", ""),
                            firstNonBlank(text(item, "signatureLabel", ""), text(item, "signatureFieldRole", "")),
                            text(item, "signatureFieldOib", ""),
                            text(item, "companyName", "")
                    );

                    try {
                        byte[] pdf = client.downloadPdf(text(item, "downloadUrl", ""), text(item, "documentId", ""));
                        List<PdfSignatureFieldService.SignatureFieldInfo> itemFields = fieldService.listSignatureFields(pdf);
                        SigningService.SignedPdf signedPdf;

                        if (!itemFields.isEmpty()) {
                            documentResult.put("fieldCount", itemFields.size());
                            PdfSignatureFieldService.FieldMatch match = fieldService.resolveMatchingField(
                                    itemFields,
                                    text(item, "preferredField", ""),
                                    text(item, "signatureFieldRole", "ZNR"),
                                    text(item, "signatureFieldOib", ""),
                                    signerOib
                            );
                            if (!match.ok()) {
                                throw new SignatureBridgeException(match.code(), match.message(), text(item, "documentId", ""));
                            }
                            PdfSignatureFieldService.SignatureFieldInfo matchedField = match.field();
                            documentResult.set("matchedField", fieldNode(matchedField));
                            if ("already_signed".equals(matchedField.status())) {
                                throw new SignatureBridgeException("ALREADY_SIGNED", "Odabrano signature polje je vec potpisano.", text(item, "documentId", ""));
                            }
                            if (!"available".equals(matchedField.status())) {
                                throw new SignatureBridgeException("NO_MATCHING_SIGNATURE_FIELD", "Signature polje nema sigurnu poziciju/status za potpis.", text(item, "documentId", ""));
                            }
                            signedPdf = signingService.signPdfByField(pdf, matchedField.fieldName(), credential, appearanceMetadata);
                        } else {
                            documentResult.put("fieldCount", 0);
                            String keyword = resolveFallbackKeyword(config, item, signerOib);
                            documentResult.put("fallbackKeywordUsed", !keyword.isBlank());
                            signedPdf = signingService.signPdfByKeywordFallback(
                                    pdf,
                                    keyword,
                                    credential,
                                    text(item, "fileName", "zapisnik.pdf"),
                                    appearanceMetadata
                            );
                        }

                        documentResult.set("appearanceUsed", appliedAppearanceDebugNode(config, signedPdf));
                        documentResult.put("logoApplied", signedPdf.logoApplied());
                        documentResult.put("borderApplied", signedPdf.borderApplied());
                        documentResult.put("appearanceMode", signedPdf.appearanceMode());
                        documentResult.put("logoByteSize", signedPdf.logoByteSize());
                        documentResult.put("appearanceError", signedPdf.appearanceError());
                        documentResult.put("fieldName", signedPdf.fieldName());
                        documentResult.put("signedFileName", text(item, "fileName", "zapisnik.pdf"));
                        anyLogoApplied = anyLogoApplied || signedPdf.logoApplied();
                        anyBorderApplied = anyBorderApplied || signedPdf.borderApplied();
                        lastAppearanceMode = signedPdf.appearanceMode();

                        JsonNode upload = client.uploadSignedPdf(
                                apiBaseUrl,
                                token,
                                text(item, "id", ""),
                                text(item, "documentId", ""),
                                text(item, "fileName", "zapisnik.pdf"),
                                text(item, "lockToken", text(item, "signingLockToken", "")),
                                signedPdf.bytes()
                        );

                        signed += 1;
                        documentResult.put("status", "signed");
                        documentResult.put("signedField", signedPdf.fieldName());
                        documentResult.put("signingMode", signedPdf.signingMode());
                        documentResult.put("algorithm", signedPdf.algorithm());
                        documentResult.put("keyAlgorithm", signedPdf.keyAlgorithm());
                        documentResult.set("upload", upload);
                    } catch (SignatureBridgeException error) {
                        if ("ALREADY_SIGNED".equals(error.code())) {
                            skipped += 1;
                        }
                        ObjectNode errorNode = errorItem(item, error.code(), error.getMessage(), error.technicalMessage(), stackTrace(error.getCause()));
                        errors.add(errorNode);
                        documentResult.put("status", "error");
                        documentResult.set("error", errorNode.deepCopy());
                    } catch (Exception error) {
                        ObjectNode errorNode = errorItem(
                                item,
                                "SIGN_FAILED",
                                "Potpisivanje dokumenta nije uspjelo.",
                                error.getClass().getName() + ": " + safeMessage(error),
                                stackTrace(error)
                        );
                        errors.add(errorNode);
                        documentResult.put("status", "error");
                        documentResult.set("error", errorNode.deepCopy());
                    }
                    documents.add(documentResult);
                }
            }
        } catch (SignatureBridgeException error) {
            return errorResponse(jobId, error.code(), error.getMessage(), error.technicalMessage(), stackTrace(error.getCause()));
        } catch (Exception error) {
            return errorResponse(jobId, "SIGN_FAILED", "Stvarno potpisivanje nije uspjelo.", error.getClass().getName() + ": " + safeMessage(error), stackTrace(error));
        }

        boolean ok = errors.isEmpty();
        response.put("success", ok);
        response.put("ok", ok);
        response.put("signed", signed);
        response.put("skipped", skipped);
        response.put("logoApplied", anyLogoApplied);
        response.put("borderApplied", anyBorderApplied);
        response.put("appearanceMode", lastAppearanceMode);
        response.put("message", ok
                ? (signed == 1 ? "Dokument je digitalno potpisan i vracen u Documents." : signed + " dokumenata je digitalno potpisano i vraceno u Documents.")
                : "Potpisivanje je zavrsilo s greskama.");
        response.set("documents", documents);
        response.set("errors", errors);
        if (!ok && errors.size() > 0) {
            JsonNode firstError = errors.get(0);
            response.put("code", text(firstError, "code", "SIGN_FAILED"));
        }
        return response;
    }

    private static JsonNode signDocumentsRealDryRun(JsonNode request, SignerConfig config) {
        String jobId = text(request, "jobId", text(request, "token", ""));
        ObjectNode response = baseRealResponse(jobId, config, true);
        putRequestAppearanceDebug(response, request);
        ArrayNode documents = JSON.createArrayNode();
        ArrayNode errors = JSON.createArrayNode();
        int wouldSign = 0;
        int skipped = 0;

        try {
            String apiBaseUrl = text(request, "apiBaseUrl", text(request, "apiBase", ""));
            config.requireSafeNexusApiBase(apiBaseUrl);
            SignatureBridgeClient client = new SignatureBridgeClient(config);
            JsonNode job = client.getJob(apiBaseUrl, text(request, "token", ""));
            PdfSignatureFieldService fieldService = new PdfSignatureFieldService();

            for (JsonNode item : job.path("items")) {
                ObjectNode documentResult = documentBase(item);
                documentResult.set("appearanceUsed", appearanceDebugNode(config));
                putSignatureMetadata(documentResult, item);

                try {
                    byte[] pdf = client.downloadPdf(text(item, "downloadUrl", ""), text(item, "documentId", ""));
                    List<PdfSignatureFieldService.SignatureFieldInfo> itemFields = fieldService.listSignatureFields(pdf);
                    documentResult.put("fieldCount", itemFields.size());
                    if (itemFields.isEmpty()) {
                        ObjectNode error = errorItem(
                                text(item, "documentId", ""),
                                "NO_SIGNATURE_FIELDS",
                                "PDF nema AcroForm signature fieldove."
                        );
                        errors.add(error);
                        documentResult.put("status", "error");
                        documentResult.set("error", error.deepCopy());
                        documents.add(documentResult);
                        continue;
                    }

                    PdfSignatureFieldService.FieldMatch match = fieldService.resolveMatchingField(
                            itemFields,
                            text(item, "preferredField", ""),
                            text(item, "signatureFieldRole", "ZNR"),
                            text(item, "signatureFieldOib", ""),
                            text(item, "signatureFieldOib", "")
                    );
                    if (!match.ok()) {
                        ObjectNode error = errorItem(
                                item,
                                match.code(),
                                match.message(),
                                "",
                                ""
                        );
                        errors.add(error);
                        documentResult.put("status", "error");
                        documentResult.set("error", error.deepCopy());
                        documents.add(documentResult);
                        continue;
                    }

                    PdfSignatureFieldService.SignatureFieldInfo matchedField = match.field();
                    documentResult.set("matchedField", fieldNode(matchedField));
                    if ("already_signed".equals(matchedField.status())) {
                        ObjectNode error = errorItem(
                                item,
                                "ALREADY_SIGNED",
                                "Odabrano signature polje je vec potpisano.",
                                "",
                                ""
                        );
                        errors.add(error);
                        skipped += 1;
                        documentResult.put("status", "already_signed");
                        documentResult.set("error", error.deepCopy());
                    } else if ("available".equals(matchedField.status())) {
                        wouldSign += 1;
                        documentResult.put("status", "would_sign");
                        documentResult.put("message", "Dry-run: ovaj dokument bi bio potpisan po fieldu " + matchedField.fieldName() + ".");
                        documentResult.put("logoApplied", false);
                        documentResult.put("borderApplied", false);
                        documentResult.put("appearanceMode", config.appearanceBorder() ? "configured" : "minimal-transparent");
                        documentResult.put("fieldName", matchedField.fieldName());
                        documentResult.put("signedFileName", text(item, "fileName", "zapisnik.pdf"));
                    } else {
                        ObjectNode error = errorItem(
                                item,
                                "NO_MATCHING_SIGNATURE_FIELD",
                                "Signature polje postoji, ali nema jasnu poziciju/status za siguran potpis.",
                                "",
                                ""
                        );
                        errors.add(error);
                        documentResult.put("status", "error");
                        documentResult.set("error", error.deepCopy());
                    }
                } catch (SignatureBridgeException error) {
                    ObjectNode errorNode = errorItem(item, error.code(), error.getMessage(), error.technicalMessage(), stackTrace(error.getCause()));
                    errors.add(errorNode);
                    documentResult.put("status", "error");
                    documentResult.set("error", errorNode.deepCopy());
                } catch (Exception error) {
                    ObjectNode errorNode = errorItem(
                            item,
                            "DOWNLOAD_FAILED",
                            "Dry-run nije uspio procitati PDF.",
                            error.getClass().getName() + ": " + safeMessage(error),
                            stackTrace(error)
                    );
                    errors.add(errorNode);
                    documentResult.put("status", "error");
                    documentResult.set("error", errorNode.deepCopy());
                }
                documents.add(documentResult);
            }
        } catch (SignatureBridgeException error) {
            return errorResponse(jobId, error.code(), error.getMessage(), error.technicalMessage(), stackTrace(error.getCause()));
        } catch (Exception error) {
            return errorResponse(jobId, "DOWNLOAD_FAILED", "Real dry-run nije uspio.", error.getClass().getName() + ": " + safeMessage(error), stackTrace(error));
        }

        boolean ok = errors.isEmpty();
        response.put("success", ok);
        response.put("ok", ok);
        response.put("signed", 0);
        response.put("wouldSign", wouldSign);
        response.put("skipped", skipped);
        response.put("logoApplied", false);
        response.put("borderApplied", false);
        response.put("appearanceMode", config.appearanceBorder() ? "configured" : "minimal-transparent");
        response.put("message", ok
                ? "Dry-run uspjesan: dokumenti imaju odgovarajuca signature polja."
                : "Dry-run je zavrsio s provjerljivim greskama.");
        response.set("documents", documents);
        response.set("errors", errors);
        if (!ok && errors.size() > 0) {
            JsonNode firstError = errors.get(0);
            response.put("code", text(firstError, "code", "SIGNATURE_DRY_RUN_FAILED"));
        }
        return response;
    }

    private static ObjectNode baseRealResponse(String jobId, SignerConfig config, boolean dryRun) {
        ObjectNode response = JSON.createObjectNode();
        response.put("jobId", jobId == null ? "" : jobId);
        response.put("mode", config.isMock() ? "mock" : "real");
        response.put("dryRun", dryRun);
        response.put("pinRequested", false);
        ObjectNode appearanceDebug = appearanceDebugNode(config);
        response.set("appearanceDebug", appearanceDebug);
        response.set("appearanceUsed", appearanceDebug.deepCopy());
        response.put("receivedLogo", appearanceDebug.path("receivedLogo").asBoolean(false));
        response.put("logoByteSize", appearanceDebug.path("logoByteSize").asInt(0));
        return response;
    }

    private static void putRequestAppearanceDebug(ObjectNode response, JsonNode request) {
        JsonNode debugAppearance = request == null ? null : request.path("debugAppearance");
        if (debugAppearance != null && debugAppearance.isObject()) {
            response.set("requestAppearanceDebug", debugAppearance.deepCopy());
        }
        JsonNode appearance = request == null ? null : request.path("appearance");
        if (appearance != null && appearance.isObject()) {
            response.set("requestAppearance", requestAppearanceDebugNode(appearance));
        }
    }

    private static ObjectNode appearanceDebugNode(SignerConfig config) {
        String logoDataUrl = String.valueOf(config.appearanceLogoDataUrl() == null ? "" : config.appearanceLogoDataUrl()).trim();
        boolean logoBase64Present = isBase64ImageDataUrl(logoDataUrl);
        int logoByteSize = logoBase64Present ? estimateLogoByteSize(logoDataUrl) : 0;
        ObjectNode debug = JSON.createObjectNode();
        debug.put("logoEnabled", config.appearanceShowLogo());
        debug.put("logoSource", logoDataUrl.isBlank() ? "none" : "settings.appearance.logoDataUrl");
        debug.put("logoBytesPresent", !logoDataUrl.isBlank());
        debug.put("logoBase64Present", logoBase64Present);
        debug.put("logoBytesBase64Present", !logoDataUrl.isBlank() && logoBase64Present);
        debug.put("logoByteSize", logoByteSize);
        debug.put("receivedLogo", config.appearanceShowLogo() && logoByteSize > 0);
        debug.put("logoOpacity", config.appearanceLogoOpacity());
        debug.put("borderEnabled", config.appearanceBorder());
        debug.put("transparentBackground", config.appearanceTransparentBackground());
        debug.putNull("backgroundColor");
        debug.putNull("borderColor");
        ObjectNode appearance = JSON.createObjectNode();
        appearance.put("logoEnabled", config.appearanceShowLogo());
        appearance.put("logoSource", logoDataUrl.isBlank() ? "none" : "settings.appearance.logoDataUrl");
        appearance.put("logoOpacity", config.appearanceLogoOpacity());
        appearance.put("logoBytesPresent", !logoDataUrl.isBlank());
        appearance.put("logoBase64Present", logoBase64Present);
        appearance.put("logoBytesBase64Present", !logoDataUrl.isBlank() && logoBase64Present);
        appearance.put("borderEnabled", config.appearanceBorder());
        appearance.put("transparentBackground", config.appearanceTransparentBackground());
        appearance.putNull("backgroundColor");
        appearance.putNull("borderColor");
        debug.set("appearance", appearance);
        debug.put("appearanceMode", config.appearanceBorder()
                ? "configured"
                : "minimal-transparent");
        return debug;
    }

    private static ObjectNode requestAppearanceDebugNode(JsonNode appearance) {
        String logoDataUrl = firstNonBlank(
                text(appearance, "logoDataUrl", ""),
                firstNonBlank(text(appearance, "logo", ""), text(appearance, "logoUrl", ""))
        );
        boolean logoEnabled = booleanSetting(appearance, "showLogo", booleanSetting(appearance, "logoEnabled", false));
        boolean borderEnabled = booleanSetting(appearance, "border", booleanSetting(appearance, "borderEnabled", false));
        boolean transparentBackground = booleanSetting(appearance, "transparentBackground", true);
        ObjectNode debug = JSON.createObjectNode();
        putLogoDebugFields(debug, logoEnabled, logoDataUrl, logoDataUrl.isBlank() ? "none" : "request.appearance.logoDataUrl");
        debug.put("logoOpacity", firstNonBlank(text(appearance, "logoOpacity", ""), "0.08"));
        debug.put("borderEnabled", borderEnabled);
        debug.put("transparentBackground", transparentBackground);
        debug.putNull("backgroundColor");
        debug.putNull("borderColor");
        debug.put("appearanceMode", transparentBackground && !borderEnabled ? "minimal-transparent" : "configured");

        ObjectNode nested = JSON.createObjectNode();
        nested.put("logoEnabled", logoEnabled);
        nested.put("logoOpacity", firstNonBlank(text(appearance, "logoOpacity", ""), "0.08"));
        nested.put("logoBytesPresent", !logoDataUrl.isBlank());
        nested.put("logoBase64Present", isBase64ImageDataUrl(logoDataUrl));
        nested.put("logoBytesBase64Present", !logoDataUrl.isBlank() && isBase64ImageDataUrl(logoDataUrl));
        nested.put("borderEnabled", borderEnabled);
        nested.put("transparentBackground", transparentBackground);
        debug.set("appearance", nested);
        debug.put("logoDataUrlOmitted", !logoDataUrl.isBlank());
        return debug;
    }

    private static void putLogoDebugFields(ObjectNode node, boolean logoEnabled, String logoDataUrl, String logoSource) {
        String value = String.valueOf(logoDataUrl == null ? "" : logoDataUrl).trim();
        boolean logoBase64Present = isBase64ImageDataUrl(value);
        node.put("logoEnabled", logoEnabled);
        node.put("logoSource", value.isBlank() ? "none" : logoSource);
        node.put("logoBytesPresent", !value.isBlank());
        node.put("logoBase64Present", logoBase64Present);
        node.put("logoBytesBase64Present", !value.isBlank() && logoBase64Present);
        node.put("logoByteSize", logoBase64Present ? estimateLogoByteSize(value) : 0);
    }

    private static boolean isBase64ImageDataUrl(String dataUrl) {
        String value = String.valueOf(dataUrl == null ? "" : dataUrl).trim().toLowerCase(Locale.ROOT);
        return (value.startsWith("data:image/png;base64,")
                || value.startsWith("data:image/jpeg;base64,")
                || value.startsWith("data:image/jpg;base64,"));
    }

    private static boolean booleanSetting(JsonNode node, String field, boolean fallback) {
        if (node == null || !node.has(field) || node.get(field) == null || node.get(field).isNull()) {
            return fallback;
        }
        JsonNode value = node.get(field);
        if (value.isBoolean()) {
            return value.asBoolean();
        }
        String text = value.asText("").trim().toLowerCase(Locale.ROOT);
        if (List.of("true", "1", "yes", "da", "on").contains(text)) {
            return true;
        }
        if (List.of("false", "0", "no", "ne", "off").contains(text)) {
            return false;
        }
        return fallback;
    }

    private static ObjectNode appliedAppearanceDebugNode(SignerConfig config, SigningService.SignedPdf signedPdf) {
        ObjectNode debug = appearanceDebugNode(config);
        if (signedPdf == null) {
            return debug;
        }
        debug.put("logoApplied", signedPdf.logoApplied());
        debug.put("borderApplied", signedPdf.borderApplied());
        debug.put("appearanceMode", signedPdf.appearanceMode());
        debug.put("fieldName", signedPdf.fieldName());
        debug.put("logoByteSize", signedPdf.logoByteSize());
        debug.put("appearanceError", signedPdf.appearanceError());
        JsonNode appearanceNode = debug.path("appearance");
        if (appearanceNode.isObject()) {
            ((ObjectNode) appearanceNode).put("logoApplied", signedPdf.logoApplied());
            ((ObjectNode) appearanceNode).put("borderApplied", signedPdf.borderApplied());
            ((ObjectNode) appearanceNode).put("appearanceMode", signedPdf.appearanceMode());
        }
        return debug;
    }

    private static int estimateLogoByteSize(String dataUrl) {
        try {
            int comma = dataUrl.indexOf(',');
            if (comma < 0) {
                return 0;
            }
            return Base64.getDecoder().decode(dataUrl.substring(comma + 1).replaceAll("\\s+", "")).length;
        } catch (Exception ignored) {
            return 0;
        }
    }

    private static void putSignatureMetadata(ObjectNode node, JsonNode item) {
        node.put("preferredField", text(item, "preferredField", ""));
        node.put("signatureFieldRole", text(item, "signatureFieldRole", "ZNR"));
        node.put("signatureFieldOib", text(item, "signatureFieldOib", ""));
        node.put("signatureFieldStandard", "SIGN_{ROLE}_{OIB}");
    }

    private static String resolveFallbackKeyword(SignerConfig config, JsonNode item, String signerOib) {
        String configured = String.valueOf(config.fallbackKeyword() == null ? "" : config.fallbackKeyword()).trim();
        if (!configured.isBlank()) {
            return configured;
        }
        String itemOib = text(item, "signatureFieldOib", "");
        if (!itemOib.isBlank()) {
            return itemOib;
        }
        String preferredOib = new PdfSignatureFieldService().extractOibFromFieldName(text(item, "preferredField", ""));
        if (!preferredOib.isBlank()) {
            return preferredOib;
        }
        return signerOib == null ? "" : signerOib;
    }

    private static ObjectNode documentBase(JsonNode item) {
        ObjectNode node = JSON.createObjectNode();
        node.put("itemId", text(item, "id", ""));
        node.put("documentId", text(item, "documentId", ""));
        node.put("workOrderId", text(item, "workOrderId", ""));
        node.put("workOrderNumber", text(item, "workOrderNumber", ""));
        node.put("fileName", text(item, "fileName", "zapisnik.pdf"));
        return node;
    }

    private static ObjectNode fieldNode(PdfSignatureFieldService.SignatureFieldInfo field) {
        ObjectNode node = JSON.createObjectNode();
        node.put("fieldName", field.fieldName());
        node.put("page", field.page());
        node.put("x", field.x());
        node.put("y", field.y());
        node.put("width", field.width());
        node.put("height", field.height());
        node.put("status", field.status());
        return node;
    }

    private static ObjectNode errorItem(String documentId, String code, String message) {
        ObjectNode error = JSON.createObjectNode();
        error.put("documentId", documentId == null ? "" : documentId);
        error.put("code", code == null || code.isBlank() ? "SIGNATURE_BRIDGE_ERROR" : code);
        error.put("message", message == null || message.isBlank() ? "Neocekivana greska." : message);
        error.put("nativeSignerMessage", message == null || message.isBlank() ? "Neocekivana greska." : message);
        return error;
    }

    private static ObjectNode errorItem(JsonNode item, String code, String message, String technicalMessage, String stack) {
        ObjectNode error = errorItem(text(item, "documentId", ""), code, message);
        error.put("itemId", text(item, "id", ""));
        error.put("fileName", text(item, "fileName", "zapisnik.pdf"));
        error.put("workOrderId", text(item, "workOrderId", ""));
        error.put("workOrderNumber", text(item, "workOrderNumber", ""));
        if (technicalMessage != null && !technicalMessage.isBlank()) {
            error.put("technicalMessage", technicalMessage);
        }
        if (stack != null && !stack.isBlank()) {
            error.put("stack", stack);
        }
        return error;
    }

    private static ObjectNode errorResponse(String jobId, String code, String message) {
        return errorResponse(jobId, code, message, "", "");
    }

    private static ObjectNode errorResponse(String jobId, String code, String message, String technicalMessage, String stack) {
        ObjectNode response = JSON.createObjectNode();
        response.put("success", false);
        response.put("ok", false);
        response.put("jobId", jobId == null ? "" : jobId);
        response.put("signed", 0);
        response.put("skipped", 0);
        response.put("code", code);
        response.put("message", message);
        ArrayNode errors = JSON.createArrayNode();
        ObjectNode error = JSON.createObjectNode();
        error.put("code", code);
        error.put("message", message);
        error.put("nativeSignerMessage", message);
        if (technicalMessage != null && !technicalMessage.isBlank()) {
            error.put("technicalMessage", technicalMessage);
        }
        if (stack != null && !stack.isBlank()) {
            error.put("stack", stack);
        }
        errors.add(error);
        response.set("errors", errors);
        return response;
    }

    private static String stackTrace(Throwable error) {
        if (error == null) {
            return "";
        }
        StringWriter writer = new StringWriter();
        error.printStackTrace(new PrintWriter(writer));
        String value = writer.toString();
        return value.length() > 6000 ? value.substring(0, 6000) : value;
    }

    private static JsonNode readNativeMessage(InputStream input) throws IOException {
        byte[] lengthBytes = input.readNBytes(4);
        if (lengthBytes.length == 0) {
            throw new EOFException("No more native messages.");
        }
        if (lengthBytes.length < 4) {
            throw new EOFException("Incomplete native message length.");
        }

        int length = ByteBuffer.wrap(lengthBytes).order(ByteOrder.LITTLE_ENDIAN).getInt();
        if (length <= 0 || length > MAX_MESSAGE_BYTES) {
            throw new IOException("Invalid native message length: " + length);
        }

        byte[] payload = input.readNBytes(length);
        if (payload.length < length) {
            throw new EOFException("Incomplete native message payload.");
        }
        return JSON.readTree(new String(payload, StandardCharsets.UTF_8));
    }

    private static void writeNativeMessage(OutputStream output, JsonNode payload) throws IOException {
        byte[] bytes = JSON.writeValueAsBytes(payload);
        byte[] length = ByteBuffer.allocate(4)
                .order(ByteOrder.LITTLE_ENDIAN)
                .putInt(bytes.length)
                .array();
        output.write(length);
        output.write(bytes);
        output.flush();
    }

    private static boolean isAllowedApiBaseUrl(String apiBaseUrl) {
        try {
            URI uri = URI.create(apiBaseUrl == null ? "" : apiBaseUrl.trim());
            String scheme = String.valueOf(uri.getScheme()).toLowerCase(Locale.ROOT);
            String host = String.valueOf(uri.getHost()).toLowerCase(Locale.ROOT);
            if ("https".equals(scheme) && "safe-nexus.org".equals(host)) {
                return true;
            }
            return ("http".equals(scheme) || "https".equals(scheme))
                    && ("localhost".equals(host) || "127.0.0.1".equals(host));
        } catch (Exception ignored) {
            return false;
        }
    }

    private static boolean hasArg(String[] args, String expected) {
        if (args == null || expected == null) {
            return false;
        }
        for (String arg : args) {
            if (expected.equalsIgnoreCase(String.valueOf(arg == null ? "" : arg).trim())) {
                return true;
            }
        }
        return false;
    }

    private static String text(JsonNode node, String field, String fallback) {
        JsonNode value = node == null ? null : node.get(field);
        if (value == null || value.isNull()) {
            return fallback;
        }
        return value.asText(fallback);
    }

    private static String firstNonBlank(String first, String second) {
        String cleanFirst = String.valueOf(first == null ? "" : first).trim();
        return cleanFirst.isBlank() ? String.valueOf(second == null ? "" : second).trim() : cleanFirst;
    }

    private static String safeMessage(Throwable error) {
        String message = error == null ? "" : error.getMessage();
        return message == null || message.isBlank() ? "Neocekivana greska u PDF Signer native hostu." : message;
    }
}
