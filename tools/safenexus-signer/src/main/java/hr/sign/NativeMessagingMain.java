package hr.sign;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Properties;

public final class NativeMessagingMain {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String VERSION = "1.1.0-real-field";
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
        SignerConfig config = SignerConfig.load();
        String type = text(request, "type", "").trim();
        return switch (type) {
            case "PING_SIGNER" -> pingResponse(config);
            case "GET_SIGNATURE_FIELDS" -> getSignatureFields(request, config);
            case "GET_SIGNER_SETTINGS" -> getSignerSettings(config);
            case "SAVE_SIGNER_SETTINGS" -> saveSignerSettings(request);
            case "TEST_TOKEN_DETECTION" -> testTokenDetection(config);
            case "OPEN_SIGNER_SETTINGS" -> openSignerSettings(config);
            case "SIGN_DOCUMENTS" -> config.isMock()
                    ? signDocumentsMock(request)
                    : signDocumentsReal(request, config);
            default -> errorResponse(text(request, "jobId", ""), "UNSUPPORTED_MESSAGE", "Nepodrzana naredba za PDF Signer.");
        };
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
        response.put("configPath", config.configPath().toString());
        response.put("apiAllowlist", String.join(", ", config.allowedApiBases()));
        response.put("providerOrder", String.join(", ", config.providerOrder()));
        response.put("pinPolicy", "PIN se unosi iskljucivo lokalno u Signer programu.");
        return response;
    }

    private static JsonNode getSignerSettings(SignerConfig config) {
        ObjectNode response = JSON.createObjectNode();
        response.put("success", true);
        response.put("ok", true);
        response.put("configPath", config.configPath().toString());
        response.put("pinPolicy", "PIN se nikad ne salje u web app i nikad se ne sprema.");
        response.set("settings", safeSettingsNode(config));
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
            putSetting(properties, settings, "providerOrder", "providers.order");
            putSetting(properties, settings, "eoiPkcs11", "eoi.pkcs11");
            putSetting(properties, settings, "eoiSlotIndex", "eoi.slotIndex");
            putSetting(properties, settings, "finaPkcs11", "fina.pkcs11");
            putSetting(properties, settings, "finaSlotIndex", "fina.slotIndex");
            putSetting(properties, settings, "fallbackKeyword", "fallback.keyword");

            if (!List.of("mock", "real").contains(properties.getProperty("signer.mode", "mock").toLowerCase(Locale.ROOT))) {
                properties.setProperty("signer.mode", "mock");
            }
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
            provider.put("oib", probe.oib());
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
        ObjectNode settings = JSON.createObjectNode();
        settings.put("signerMode", config.modeName());
        settings.put("realDryRun", config.realDryRun());
        settings.put("apiAllowlist", String.join("\n", config.allowedApiBases()));
        settings.put("providerOrder", String.join(",", config.providerOrder()));
        settings.put("eoiPkcs11", config.eoiPkcs11Lib());
        settings.put("eoiSlotIndex", config.eoiSlotIndex() == null ? "" : String.valueOf(config.eoiSlotIndex()));
        settings.put("finaPkcs11", config.finaPkcs11Lib());
        settings.put("finaSlotIndex", config.finaSlotIndex() == null ? "" : String.valueOf(config.finaSlotIndex()));
        settings.put("fallbackKeyword", config.fallbackKeyword());
        settings.put("configPath", config.configPath().toString());
        return settings;
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

    private static JsonNode signDocumentsMock(JsonNode request) {
        String jobId = text(request, "jobId", "");
        ObjectNode response = JSON.createObjectNode();
        response.put("jobId", jobId);

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
                                text(item, "documentId", ""),
                                "NO_SIGNATURE_FIELDS",
                                "PDF nema AcroForm signature fieldove."
                        );
                        errors.add(error);
                        documentResult.set("error", error.deepCopy());
                    }
                } catch (SignatureBridgeException error) {
                    ObjectNode errorNode = errorItem(
                            text(item, "documentId", ""),
                            error.code(),
                            error.getMessage()
                    );
                    errors.add(errorNode);
                    documentResult.set("fields", JSON.createArrayNode());
                    documentResult.set("error", errorNode.deepCopy());
                } catch (Exception error) {
                    ObjectNode errorNode = errorItem(
                            text(item, "documentId", ""),
                            "DOWNLOAD_FAILED",
                            "Ne mogu procitati PDF signature fieldove: " + safeMessage(error)
                    );
                    errors.add(errorNode);
                    documentResult.set("fields", JSON.createArrayNode());
                    documentResult.set("error", errorNode.deepCopy());
                }
                documents.add(documentResult);
            }
        } catch (SignatureBridgeException error) {
            return errorResponse(jobId, error.code(), error.getMessage());
        } catch (Exception error) {
            return errorResponse(jobId, "DOWNLOAD_FAILED", "Ne mogu dohvatiti signature fieldove: " + safeMessage(error));
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
        response.put("pinRequested", true);
        ArrayNode documents = JSON.createArrayNode();
        ArrayNode errors = JSON.createArrayNode();
        int signed = 0;
        int skipped = 0;

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
                if (signerOib.isBlank()) {
                    return errorResponse(jobId, "TOKEN_NOT_AVAILABLE", "Iz certifikata nije moguce procitati OIB/SERIALNUMBER potpisnika.");
                }
                response.put("signerOib", signerOib);
                response.put("signerName", credential.commonName());
                response.put("provider", credential.providerName());

                for (JsonNode item : job.path("items")) {
                    ObjectNode documentResult = documentBase(item);
                    putSignatureMetadata(documentResult, item);
                    documentResult.put("signerOib", signerOib);

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
                            signedPdf = signingService.signPdfByField(pdf, matchedField.fieldName(), credential);
                        } else {
                            documentResult.put("fieldCount", 0);
                            String keyword = resolveFallbackKeyword(config, item, signerOib);
                            documentResult.put("fallbackKeywordUsed", !keyword.isBlank());
                            signedPdf = signingService.signPdfByKeywordFallback(
                                    pdf,
                                    keyword,
                                    credential,
                                    text(item, "fileName", "zapisnik.pdf")
                            );
                        }

                        JsonNode upload = client.uploadSignedPdf(
                                apiBaseUrl,
                                token,
                                text(item, "id", ""),
                                text(item, "documentId", ""),
                                text(item, "fileName", "zapisnik.pdf"),
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
                        ObjectNode errorNode = errorItem(
                                text(item, "documentId", ""),
                                error.code(),
                                error.getMessage()
                        );
                        errors.add(errorNode);
                        documentResult.put("status", "error");
                        documentResult.set("error", errorNode.deepCopy());
                    } catch (Exception error) {
                        ObjectNode errorNode = errorItem(
                                text(item, "documentId", ""),
                                "SIGN_FAILED",
                                "Potpisivanje dokumenta nije uspjelo: " + safeMessage(error)
                        );
                        errors.add(errorNode);
                        documentResult.put("status", "error");
                        documentResult.set("error", errorNode.deepCopy());
                    }
                    documents.add(documentResult);
                }
            }
        } catch (SignatureBridgeException error) {
            return errorResponse(jobId, error.code(), error.getMessage());
        } catch (Exception error) {
            return errorResponse(jobId, "SIGN_FAILED", "Stvarno potpisivanje nije uspjelo: " + safeMessage(error));
        }

        boolean ok = errors.isEmpty();
        response.put("success", ok);
        response.put("ok", ok);
        response.put("signed", signed);
        response.put("skipped", skipped);
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
        boolean dryRun = request.path("dryRun").asBoolean(config.realDryRun());
        if (!dryRun) {
            return errorResponse(jobId, "REAL_SIGNING_NOT_ENABLED", "Stvarni PKCS#11 potpis jos nije ukljucen. Ukljuci real.dryRun=true.");
        }

        ObjectNode response = baseRealResponse(jobId, config, true);
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
                                text(item, "documentId", ""),
                                match.code(),
                                match.message()
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
                                text(item, "documentId", ""),
                                "ALREADY_SIGNED",
                                "Odabrano signature polje je vec potpisano."
                        );
                        errors.add(error);
                        skipped += 1;
                        documentResult.put("status", "already_signed");
                        documentResult.set("error", error.deepCopy());
                    } else if ("available".equals(matchedField.status())) {
                        wouldSign += 1;
                        documentResult.put("status", "would_sign");
                        documentResult.put("message", "Dry-run: ovaj dokument bi bio potpisan po fieldu " + matchedField.fieldName() + ".");
                    } else {
                        ObjectNode error = errorItem(
                                text(item, "documentId", ""),
                                "NO_MATCHING_SIGNATURE_FIELD",
                                "Signature polje postoji, ali nema jasnu poziciju/status za siguran potpis."
                        );
                        errors.add(error);
                        documentResult.put("status", "error");
                        documentResult.set("error", error.deepCopy());
                    }
                } catch (SignatureBridgeException error) {
                    ObjectNode errorNode = errorItem(text(item, "documentId", ""), error.code(), error.getMessage());
                    errors.add(errorNode);
                    documentResult.put("status", "error");
                    documentResult.set("error", errorNode.deepCopy());
                } catch (Exception error) {
                    ObjectNode errorNode = errorItem(
                            text(item, "documentId", ""),
                            "DOWNLOAD_FAILED",
                            "Dry-run nije uspio procitati PDF: " + safeMessage(error)
                    );
                    errors.add(errorNode);
                    documentResult.put("status", "error");
                    documentResult.set("error", errorNode.deepCopy());
                }
                documents.add(documentResult);
            }
        } catch (SignatureBridgeException error) {
            return errorResponse(jobId, error.code(), error.getMessage());
        } catch (Exception error) {
            return errorResponse(jobId, "DOWNLOAD_FAILED", "Real dry-run nije uspio: " + safeMessage(error));
        }

        boolean ok = errors.isEmpty();
        response.put("success", ok);
        response.put("ok", ok);
        response.put("signed", 0);
        response.put("wouldSign", wouldSign);
        response.put("skipped", skipped);
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
        return response;
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
        return error;
    }

    private static ObjectNode errorResponse(String jobId, String code, String message) {
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
        errors.add(error);
        response.set("errors", errors);
        return response;
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

    private static String safeMessage(Throwable error) {
        String message = error == null ? "" : error.getMessage();
        return message == null || message.isBlank() ? "Neocekivana greska u PDF Signer native hostu." : message;
    }
}
