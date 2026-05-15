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
import java.util.Optional;

public final class NativeMessagingMain {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String VERSION = "1.0.0-mvp";
    private static final int MAX_MESSAGE_BYTES = 8 * 1024 * 1024;

    private NativeMessagingMain() {
    }

    public static void main(String[] args) {
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
            case "SIGN_DOCUMENTS" -> config.isMock()
                    ? signDocumentsMock(request)
                    : signDocumentsRealDryRun(request, config);
            default -> errorResponse(text(request, "jobId", ""), "UNSUPPORTED_MESSAGE", "Nepodrzana naredba za PDF Signer.");
        };
    }

    private static JsonNode pingResponse(SignerConfig config) {
        ObjectNode response = JSON.createObjectNode();
        response.put("success", true);
        response.put("ok", true);
        response.put("version", VERSION);
        response.put("mode", config.isMock() ? "native-messaging-mock" : "native-messaging-real-dry-run");
        response.put("signerMode", config.modeName());
        response.put("realDryRun", config.realDryRun());
        response.put("configPath", config.configPath().toString());
        response.put("pinPolicy", "PIN se unosi iskljucivo lokalno u Signer programu.");
        return response;
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
                documentResult.put("preferredField", text(item, "preferredField", ""));
                documentResult.put("signatureFieldRole", text(item, "signatureFieldRole", "ZNR"));
                documentResult.put("signatureFieldOib", text(item, "signatureFieldOib", ""));
                documentResult.put("signatureFieldStandard", "SIGN_{ROLE}_{OIB}");

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

                    Optional<PdfSignatureFieldService.SignatureFieldInfo> match = fieldService.findMatchingField(
                            itemFields,
                            text(item, "preferredField", ""),
                            text(item, "signatureFieldRole", "ZNR"),
                            text(item, "signatureFieldOib", "")
                    );
                    if (match.isEmpty()) {
                        ObjectNode error = errorItem(
                                text(item, "documentId", ""),
                                "NO_MATCHING_SIGNATURE_FIELD",
                                "Nije pronadeno signature polje koje odgovara preferredField/OIB pravilima."
                        );
                        errors.add(error);
                        documentResult.put("status", "error");
                        documentResult.set("error", error.deepCopy());
                        documents.add(documentResult);
                        continue;
                    }

                    PdfSignatureFieldService.SignatureFieldInfo matchedField = match.get();
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
