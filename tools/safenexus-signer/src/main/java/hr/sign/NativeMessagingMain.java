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
import java.util.Locale;

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
        String type = text(request, "type", "").trim();
        return switch (type) {
            case "PING_SIGNER" -> pingResponse();
            case "SIGN_DOCUMENTS" -> signDocumentsMock(request);
            default -> errorResponse(text(request, "jobId", ""), "UNSUPPORTED_MESSAGE", "Nepodrzana naredba za PDF Signer.");
        };
    }

    private static JsonNode pingResponse() {
        ObjectNode response = JSON.createObjectNode();
        response.put("success", true);
        response.put("ok", true);
        response.put("version", VERSION);
        response.put("mode", "native-messaging-mock");
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
