package hr.sign;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

public final class SignatureBridgeClient {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    private final SignerConfig config;

    public SignatureBridgeClient(SignerConfig config) {
        this.config = config;
    }

    public JsonNode getJob(String apiBaseUrl, String token) throws Exception {
        config.requireSafeNexusApiBase(apiBaseUrl);
        if (token == null || token.isBlank()) {
            throw new SignatureBridgeException("MISSING_TOKEN", "Nedostaje kratkotrajni token za potpisivanje.");
        }
        String url = stripTrailingSlash(apiBaseUrl) + "/api/signature-bridge/jobs/" + urlEncode(token.trim());
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(45))
                    .GET()
                    .build();
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new SignatureBridgeException(
                        "DOWNLOAD_FAILED",
                        "Potpisni job nije dostupan ili je istekao: HTTP " + response.statusCode() + "."
                );
            }
            return JSON.readTree(response.body());
        } catch (SignatureBridgeException error) {
            throw error;
        } catch (Exception error) {
            throw new SignatureBridgeException("DOWNLOAD_FAILED", "Ne mogu dohvatiti potpisni job: " + safeMessage(error));
        }
    }

    public byte[] downloadPdf(String downloadUrl, String documentId) throws SignatureBridgeException {
        config.requireSafeNexusUrl(
                downloadUrl,
                "DOWNLOAD_FAILED",
                "Download URL nije na dopustenoj SafeNexus domeni."
        );
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(downloadUrl))
                    .timeout(Duration.ofMinutes(2))
                    .GET()
                    .build();
            HttpResponse<byte[]> response = HTTP.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new SignatureBridgeException(
                        "DOWNLOAD_FAILED",
                        "PDF download nije uspio: HTTP " + response.statusCode() + ".",
                        documentId
                );
            }
            return response.body();
        } catch (SignatureBridgeException error) {
            throw error;
        } catch (Exception error) {
            throw new SignatureBridgeException("DOWNLOAD_FAILED", "PDF download nije uspio: " + safeMessage(error), documentId);
        }
    }

    public JsonNode uploadSignedPdf(
            String apiBaseUrl,
            String token,
            String itemId,
            String documentId,
            String fileName,
            String lockToken,
            String signedField,
            byte[] pdfBytes
    ) throws SignatureBridgeException {
        config.requireSafeNexusApiBase(apiBaseUrl);
        if (token == null || token.isBlank() || itemId == null || itemId.isBlank()) {
            throw new SignatureBridgeException("UPLOAD_FAILED", "Nedostaje token ili itemId za upload potpisanog PDF-a.", documentId);
        }
        String url = stripTrailingSlash(apiBaseUrl)
                + "/api/signature-bridge/jobs/"
                + urlEncode(token.trim())
                + "/items/"
                + urlEncode(itemId.trim())
                + "/signed";
        if (lockToken != null && !lockToken.isBlank()) {
            url += "?lockToken=" + urlEncode(lockToken.trim());
        }
        config.requireSafeNexusUrl(url, "UPLOAD_FAILED", "Upload URL nije na dopustenoj SafeNexus domeni.");

        try {
            ObjectNode payload = JSON.createObjectNode();
            payload.put("fileName", fileName == null || fileName.isBlank() ? "zapisnik.pdf" : fileName);
            payload.put("fileType", "application/pdf");
            payload.put("fileSize", pdfBytes == null ? 0 : pdfBytes.length);
            payload.put("dataUrl", "data:application/pdf;base64," + Base64.getEncoder().encodeToString(pdfBytes));
            if (signedField != null && !signedField.isBlank()) {
                payload.put("signedField", signedField.trim());
            }
            if (lockToken != null && !lockToken.isBlank()) {
                payload.put("lockToken", lockToken.trim());
            }

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofMinutes(5))
                    .header("Content-Type", "application/json");
            if (lockToken != null && !lockToken.isBlank()) {
                requestBuilder.header("X-SafeNexus-Lock-Token", lockToken.trim());
            }
            HttpRequest request = requestBuilder
                    .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(payload), StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new SignatureBridgeException(
                        "UPLOAD_FAILED",
                        "Upload potpisanog PDF-a nije uspio: HTTP " + response.statusCode() + ".",
                        documentId,
                        trimTechnical(response.body())
                );
            }
            JsonNode json = JSON.readTree(response.body());
            if (!json.path("ok").asBoolean(false)) {
                throw new SignatureBridgeException("UPLOAD_FAILED", "Backend nije prihvatio potpisani PDF.", documentId, trimTechnical(response.body()));
            }
            return json;
        } catch (SignatureBridgeException error) {
            throw error;
        } catch (Exception error) {
            throw new SignatureBridgeException("UPLOAD_FAILED", "Upload potpisanog PDF-a nije uspio.", documentId, error.getClass().getName() + ": " + safeMessage(error));
        }
    }

    private static String stripTrailingSlash(String value) {
        return String.valueOf(value == null ? "" : value).replaceAll("/+$", "");
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private static String safeMessage(Throwable error) {
        String message = error == null ? "" : error.getMessage();
        return message == null || message.isBlank() ? "nepoznata greska" : message;
    }

    private static String trimTechnical(String value) {
        String text = value == null ? "" : value.trim();
        return text.length() > 3000 ? text.substring(0, 3000) : text;
    }
}
