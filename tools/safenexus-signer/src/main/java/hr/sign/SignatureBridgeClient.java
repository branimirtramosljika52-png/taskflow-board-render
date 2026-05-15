package hr.sign;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

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
}
