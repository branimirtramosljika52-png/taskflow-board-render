package hr.sign;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import javax.swing.JOptionPane;
import java.awt.Desktop;
import java.io.IOException;
import java.io.OutputStream;
import java.net.BindException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Stream;

public final class SafeNexusSigner {
    private static final int PORT = 9137;
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    private SafeNexusSigner() {
    }

    public static void main(String[] args) throws Exception {
        String launchArg = args != null && args.length > 0 ? args[0] : "";
        boolean bridgeStarted = false;
        try {
            startBridge();
            bridgeStarted = true;
        } catch (BindException portBusy) {
            if (isSignLaunch(launchArg)) {
                JsonNode result = forwardLaunchToRunningBridge(launchArg);
                showReport(result);
                return;
            }
            showInfo("SafeNexus Signer bridge već radi na http://127.0.0.1:" + PORT);
            return;
        }

        if (isSignLaunch(launchArg)) {
            JsonNode result = runSignJob(parseQuery(URI.create(launchArg)));
            showReport(result);
            return;
        }

        if (bridgeStarted && launchArg.startsWith("safenexus-signer://")) {
            showInfo("SafeNexus Signer je spreman.\n\nBridge radi na http://127.0.0.1:" + PORT);
            openSafeNexus();
            return;
        }

        showInfo("SafeNexus Signer bridge radi na http://127.0.0.1:" + PORT + "\n\nWeb aplikacija će ga otvoriti automatski kada pokreneš digitalni potpis.");
    }

    private static void startBridge() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", PORT), 0);
        server.createContext("/health", SafeNexusSigner::handleHealth);
        server.createContext("/sign", SafeNexusSigner::handleSign);
        server.setExecutor(null);
        server.start();
    }

    private static void handleHealth(HttpExchange exchange) throws IOException {
        if (handleCorsPreflight(exchange)) {
            return;
        }
        writeJson(exchange, 200, "{\"ok\":true,\"app\":\"SafeNexusSigner\",\"status\":\"ready\",\"mode\":\"local-exe-bridge\"}");
    }

    private static void handleSign(HttpExchange exchange) throws IOException {
        if (handleCorsPreflight(exchange)) {
            return;
        }
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            writeJson(exchange, 405, "{\"ok\":false,\"error\":\"POST required\"}");
            return;
        }

        try {
            JsonNode body = JSON.readTree(exchange.getRequestBody());
            Map<String, String> params = new HashMap<>();
            putIfText(params, "token", text(body, "token", text(body, "jobToken", "")));
            putIfText(params, "api", text(body, "api", text(body, "apiBase", "")));
            putIfText(params, "origin", text(body, "origin", ""));
            writeJson(exchange, 200, JSON.writeValueAsString(runSignJob(params)));
        } catch (Exception error) {
            writeJson(exchange, 500, JSON.writeValueAsString(Map.of(
                    "ok", false,
                    "error", safeMessage(error)
            )));
        }
    }

    private static boolean handleCorsPreflight(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return true;
        }
        return false;
    }

    private static JsonNode forwardLaunchToRunningBridge(String launchArg) throws Exception {
        Map<String, String> params = parseQuery(URI.create(launchArg));
        String payload = JSON.writeValueAsString(Map.of(
                "token", params.getOrDefault("token", ""),
                "apiBase", params.getOrDefault("api", params.getOrDefault("apiBase", "")),
                "origin", params.getOrDefault("origin", "")
        ));
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + PORT + "/sign"))
                .timeout(Duration.ofMinutes(2))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        return JSON.readTree(response.body());
    }

    private static JsonNode runSignJob(Map<String, String> launchParams) throws Exception {
        String token = launchParams.getOrDefault("token", "").trim();
        String apiBase = launchParams.getOrDefault("api", launchParams.getOrDefault("apiBase", "")).trim();
        if (apiBase.isEmpty()) {
            apiBase = "https://safe-nexus.org";
        }
        apiBase = stripTrailingSlash(apiBase);
        if (token.isEmpty()) {
            throw new IllegalArgumentException("Nedostaje potpisni job token.");
        }

        Properties config = loadConfig();
        JsonNode job = getJson(apiBase + "/api/signature-bridge/jobs/" + urlEncode(token));
        JsonNode items = job.path("items");
        if (!items.isArray() || items.size() == 0) {
            return JSON.valueToTree(Map.of(
                    "ok", true,
                    "signed", 0,
                    "message", "Nema dokumenata za potpis."
            ));
        }

        Path workDir = createWorkDir(token);
        List<LocalItem> localItems = downloadJobItems(items, workDir);
        int engineExitCode = runExternalEngine(config, workDir);
        UploadReport report = uploadSignedItems(localItems);
        if (!Boolean.parseBoolean(config.getProperty("keep.workdir", "false"))) {
            deleteRecursively(workDir);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("ok", report.failed == 0 && engineExitCode == 0);
        payload.put("engineExitCode", engineExitCode);
        payload.put("downloaded", localItems.size());
        payload.put("signed", report.signed);
        payload.put("failed", report.failed);
        payload.put("message", report.message());
        payload.put("workDir", workDir.toString());
        payload.put("errors", report.errors);
        return JSON.valueToTree(payload);
    }

    private static List<LocalItem> downloadJobItems(JsonNode items, Path workDir) throws Exception {
        List<LocalItem> localItems = new ArrayList<>();
        for (JsonNode item : items) {
            String itemId = text(item, "id", UUID.randomUUID().toString());
            String fileName = sanitizeFileName(text(item, "fileName", "zapisnik.pdf"));
            String localName = sanitizeFileName(itemId + "-" + fileName);
            if (!localName.toLowerCase().endsWith(".pdf")) {
                localName += ".pdf";
            }
            Path localPath = workDir.resolve(localName);
            byte[] pdfBytes = getBytes(text(item, "downloadUrl", ""));
            Files.write(localPath, pdfBytes);
            localItems.add(new LocalItem(
                    itemId,
                    text(item, "uploadUrl", ""),
                    fileName,
                    localPath
            ));
        }
        return localItems;
    }

    private static int runExternalEngine(Properties config, Path workDir) throws Exception {
        Path enginePath = Paths.get(config.getProperty(
                "engine.exe",
                "C:/Users/Branimir/IdeaProjects/PdfSignerDSS/dist/PotpisPDF/PotpisPDF.exe"
        ));
        if (!Files.exists(enginePath)) {
            throw new IllegalStateException("PotpisPDF.exe nije pronađen. Uredi engine.exe u " + configPath());
        }

        ProcessBuilder builder = new ProcessBuilder(enginePath.toString(), workDir.toString());
        if (enginePath.getParent() != null) {
            builder.directory(enginePath.getParent().toFile());
        }
        Path logFile = workDir.resolve("PotpisPDF.log");
        builder.redirectErrorStream(true);
        builder.redirectOutput(ProcessBuilder.Redirect.appendTo(logFile.toFile()));
        Process process = builder.start();
        return process.waitFor();
    }

    private static UploadReport uploadSignedItems(List<LocalItem> localItems) throws Exception {
        UploadReport report = new UploadReport();
        for (LocalItem item : localItems) {
            Path signedPath = findLatestSignedPdf(item.localPath);
            if (signedPath == null) {
                report.failed += 1;
                report.errors.add(item.fileName + ": nije pronađen _Signed PDF.");
                continue;
            }

            byte[] bytes = Files.readAllBytes(signedPath);
            String dataUrl = "data:application/pdf;base64," + Base64.getEncoder().encodeToString(bytes);
            Map<String, Object> uploadPayload = new HashMap<>();
            uploadPayload.put("fileName", item.fileName);
            uploadPayload.put("fileType", "application/pdf");
            uploadPayload.put("fileSize", bytes.length);
            uploadPayload.put("dataUrl", dataUrl);

            JsonNode uploadResult = postJson(item.uploadUrl, JSON.writeValueAsString(uploadPayload));
            if (!uploadResult.path("ok").asBoolean(false)) {
                report.failed += 1;
                report.errors.add(item.fileName + ": upload nije uspio.");
                continue;
            }
            report.signed += 1;
        }
        return report;
    }

    private static Path findLatestSignedPdf(Path originalPath) throws IOException {
        Path dir = originalPath.getParent();
        String fileName = originalPath.getFileName().toString();
        String base = fileName.replaceFirst("(?i)\\.pdf$", "");
        Pattern signedPattern = Pattern.compile(Pattern.quote(base) + "_Signed(\\(\\d+\\))?\\.pdf", Pattern.CASE_INSENSITIVE);
        try (Stream<Path> stream = Files.list(dir)) {
            return stream
                    .filter(path -> signedPattern.matcher(path.getFileName().toString()).matches())
                    .max(Comparator.comparingLong(path -> {
                        try {
                            return Files.getLastModifiedTime(path).toMillis();
                        } catch (IOException ignored) {
                            return 0L;
                        }
                    }))
                    .orElse(null);
        }
    }

    private static JsonNode getJson(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofMinutes(2))
                .GET()
                .build();
        HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("SafeNexus odgovor " + response.statusCode() + ": " + response.body());
        }
        return JSON.readTree(response.body());
    }

    private static byte[] getBytes(String url) throws Exception {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("Download URL nije definiran.");
        }
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofMinutes(3))
                .GET()
                .build();
        HttpResponse<byte[]> response = HTTP.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Download nije uspio: HTTP " + response.statusCode());
        }
        return response.body();
    }

    private static JsonNode postJson(String url, String payload) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofMinutes(5))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Upload nije uspio: HTTP " + response.statusCode() + " " + response.body());
        }
        return JSON.readTree(response.body());
    }

    private static Properties loadConfig() throws IOException {
        Path path = configPath();
        Files.createDirectories(path.getParent());
        Properties properties = new Properties();
        if (Files.exists(path)) {
            try (var input = Files.newInputStream(path)) {
                properties.load(input);
            }
            return properties;
        }

        properties.setProperty("engine.exe", "C:/Users/Branimir/IdeaProjects/PdfSignerDSS/dist/PotpisPDF/PotpisPDF.exe");
        properties.setProperty("keep.workdir", "false");
        try (var output = Files.newOutputStream(path)) {
            properties.store(output, "SafeNexus local signing bridge");
        }
        return properties;
    }

    private static Path configPath() {
        String appData = System.getenv("APPDATA");
        Path base = appData == null || appData.isBlank()
                ? Paths.get(System.getProperty("user.home"), ".safenexus-signer")
                : Paths.get(appData, "SafeNexusSigner");
        return base.resolve("config.properties");
    }

    private static Path createWorkDir(String token) throws IOException {
        String suffix = token.length() > 10 ? token.substring(0, 10) : token;
        Path dir = Paths.get(System.getProperty("java.io.tmpdir"), "safenexus-sign-" + suffix + "-" + System.currentTimeMillis());
        Files.createDirectories(dir);
        return dir;
    }

    private static void deleteRecursively(Path root) {
        if (root == null || !Files.exists(root)) {
            return;
        }
        try (Stream<Path> stream = Files.walk(root)) {
            Iterator<Path> iterator = stream.sorted(Comparator.reverseOrder()).iterator();
            while (iterator.hasNext()) {
                try {
                    Files.deleteIfExists(iterator.next());
                } catch (IOException ignored) {
                    // Temp mapa ostaje ako je neki PDF još otvoren.
                }
            }
        } catch (IOException ignored) {
            // Best effort cleanup.
        }
    }

    private static boolean isSignLaunch(String launchArg) {
        if (launchArg == null || !launchArg.startsWith("safenexus-signer://")) {
            return false;
        }
        try {
            URI uri = URI.create(launchArg);
            String command = uri.getHost();
            if (command == null || command.isBlank()) {
                command = uri.getPath();
            }
            return command != null && command.toLowerCase().contains("sign");
        } catch (Exception ignored) {
            return false;
        }
    }

    private static Map<String, String> parseQuery(URI uri) {
        Map<String, String> out = new HashMap<>();
        String query = uri.getRawQuery();
        if (query == null || query.isBlank()) {
            return out;
        }
        for (String pair : query.split("&")) {
            int split = pair.indexOf('=');
            String key = split >= 0 ? pair.substring(0, split) : pair;
            String value = split >= 0 ? pair.substring(split + 1) : "";
            out.put(urlDecode(key), urlDecode(value));
        }
        return out;
    }

    private static void putIfText(Map<String, String> map, String key, String value) {
        if (value != null && !value.isBlank()) {
            map.put(key, value.trim());
        }
    }

    private static String text(JsonNode node, String field, String fallback) {
        JsonNode value = node == null ? null : node.get(field);
        if (value == null || value.isNull()) {
            return fallback;
        }
        return value.asText(fallback);
    }

    private static String sanitizeFileName(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            normalized = "zapisnik.pdf";
        }
        return normalized.replaceAll("[\\\\/:*?\"<>|]+", "-").replaceAll("\\s+", " ").trim();
    }

    private static String stripTrailingSlash(String value) {
        return value == null ? "" : value.replaceAll("/+$", "");
    }

    private static String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String urlDecode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static String safeMessage(Throwable error) {
        String message = error == null ? "" : error.getMessage();
        return message == null || message.isBlank() ? "Neočekivana greška u lokalnom potpisu." : message;
    }

    private static void writeJson(HttpExchange exchange, int status, String payload) throws IOException {
        byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
        addCorsHeaders(exchange);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Private-Network", "true");
    }

    private static void showReport(JsonNode result) {
        boolean ok = result != null && result.path("ok").asBoolean(false);
        String message = result == null ? "Nema odgovora." : result.path("message").asText("");
        int signed = result == null ? 0 : result.path("signed").asInt(0);
        int failed = result == null ? 0 : result.path("failed").asInt(0);
        StringBuilder text = new StringBuilder();
        text.append(ok ? "Potpisivanje je završeno." : "Potpisivanje nije završilo potpuno.").append("\n\n");
        text.append("Potpisano: ").append(signed).append("\n");
        text.append("Greške: ").append(failed).append("\n");
        if (!message.isBlank()) {
            text.append("\n").append(message);
        }
        if (result != null && result.path("errors").isArray() && result.path("errors").size() > 0) {
            text.append("\n\nDetalji:");
            for (JsonNode error : result.path("errors")) {
                text.append("\n- ").append(error.asText());
            }
        }
        JOptionPane.showMessageDialog(null, text.toString(), "SafeNexus Signer", ok ? JOptionPane.INFORMATION_MESSAGE : JOptionPane.WARNING_MESSAGE);
    }

    private static void showInfo(String message) {
        JOptionPane.showMessageDialog(null, message, "SafeNexus Signer", JOptionPane.INFORMATION_MESSAGE);
    }

    private static void openSafeNexus() {
        try {
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(URI.create("https://safe-nexus.org/"));
            }
        } catch (Exception ignored) {
            // Bridge ostaje aktivan.
        }
    }

    private record LocalItem(String id, String uploadUrl, String fileName, Path localPath) {
    }

    private static final class UploadReport {
        int signed = 0;
        int failed = 0;
        final List<String> errors = new ArrayList<>();

        String message() {
            if (failed == 0) {
                return signed == 1 ? "1 dokument je potpisan i vraćen u Documents." : signed + " dokumenata je potpisano i vraćeno u Documents.";
            }
            return signed + " potpisano, " + failed + " nije prošlo.";
        }
    }
}
