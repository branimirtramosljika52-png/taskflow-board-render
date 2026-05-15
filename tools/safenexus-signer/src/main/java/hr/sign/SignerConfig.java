package hr.sign;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Properties;

public final class SignerConfig {
    public enum Mode {
        MOCK,
        REAL
    }

    private final Mode mode;
    private final boolean realDryRun;
    private final Path configPath;
    private final List<String> allowedApiBases;
    private final List<String> providerOrder;
    private final String eoiPkcs11Lib;
    private final Integer eoiSlotIndex;
    private final String finaPkcs11Lib;
    private final Integer finaSlotIndex;
    private final String reason;
    private final String location;
    private final float fontSize;
    private final boolean fallbackKeywordEnabled;
    private final String fallbackKeyword;
    private final boolean fallbackCaseInsensitive;
    private final float rectWidthPt;
    private final float rectHeightPt;
    private final float offsetDownPt;
    private final float offsetLeftPt;
    private final float skipTolerancePt;

    private SignerConfig(
            Mode mode,
            boolean realDryRun,
            Path configPath,
            List<String> allowedApiBases,
            List<String> providerOrder,
            String eoiPkcs11Lib,
            Integer eoiSlotIndex,
            String finaPkcs11Lib,
            Integer finaSlotIndex,
            String reason,
            String location,
            float fontSize,
            boolean fallbackKeywordEnabled,
            String fallbackKeyword,
            boolean fallbackCaseInsensitive,
            float rectWidthPt,
            float rectHeightPt,
            float offsetDownPt,
            float offsetLeftPt,
            float skipTolerancePt
    ) {
        this.mode = mode;
        this.realDryRun = realDryRun;
        this.configPath = configPath;
        this.allowedApiBases = List.copyOf(allowedApiBases);
        this.providerOrder = List.copyOf(providerOrder);
        this.eoiPkcs11Lib = eoiPkcs11Lib;
        this.eoiSlotIndex = eoiSlotIndex;
        this.finaPkcs11Lib = finaPkcs11Lib;
        this.finaSlotIndex = finaSlotIndex;
        this.reason = reason;
        this.location = location;
        this.fontSize = fontSize;
        this.fallbackKeywordEnabled = fallbackKeywordEnabled;
        this.fallbackKeyword = fallbackKeyword;
        this.fallbackCaseInsensitive = fallbackCaseInsensitive;
        this.rectWidthPt = rectWidthPt;
        this.rectHeightPt = rectHeightPt;
        this.offsetDownPt = offsetDownPt;
        this.offsetLeftPt = offsetLeftPt;
        this.skipTolerancePt = skipTolerancePt;
    }

    public static SignerConfig load() {
        Path path = resolveConfigPath();
        Properties properties = loadRawProperties(path);

        String envMode = System.getenv("SAFENEXUS_SIGNER_MODE");
        String configuredMode = envMode != null && !envMode.isBlank()
                ? envMode
                : "real";

        Mode mode = "real".equalsIgnoreCase(configuredMode.trim()) ? Mode.REAL : Mode.MOCK;
        String envDryRun = System.getenv("SAFENEXUS_SIGNER_DRY_RUN");
        boolean dryRun = envDryRun != null && !envDryRun.isBlank() && Boolean.parseBoolean(envDryRun);

        return new SignerConfig(
                mode,
                dryRun,
                path,
                parseAllowedApiBases(properties.getProperty("api.allowlist", "https://safe-nexus.org")),
                parseList(properties.getProperty("providers.order", "EOI,FINA")),
                properties.getProperty("eoi.pkcs11", "C:/Program Files/AKD/Certilia Middleware/pkcs11/AkdEidPkcs11_64.dll"),
                parseIntOrNull(properties.getProperty("eoi.slotIndex", "")),
                properties.getProperty("fina.pkcs11", "C:/Windows/System32/eTPKCS11.dll"),
                parseIntOrNull(properties.getProperty("fina.slotIndex", "")),
                properties.getProperty("reason", "Digitalni potpis"),
                properties.getProperty("location", "Hrvatska"),
                parseFloat(properties.getProperty("font.size"), 8f),
                Boolean.parseBoolean(properties.getProperty("fallback.keyword.enabled", "true")),
                firstNonBlank(properties.getProperty("fallback.keyword", ""), properties.getProperty("keyword", "")),
                Boolean.parseBoolean(properties.getProperty("fallback.case.insensitive", properties.getProperty("case.insensitive", "true"))),
                cmToPt(parseFloat(properties.getProperty("rect.width.cm"), 6f)),
                cmToPt(parseFloat(properties.getProperty("rect.height.cm"), 2f)),
                cmToPt(parseFloat(properties.getProperty("offset.down.cm"), 2.2f)),
                cmToPt(parseFloat(properties.getProperty("offset.left.cm"), 2.6f)),
                parseFloat(properties.getProperty("skip.tolerance.pt"), 12f)
        );
    }

    public static Properties loadRawProperties() {
        return loadRawProperties(resolveConfigPath());
    }

    public static Properties defaultProperties() {
        Properties properties = new Properties();
        properties.setProperty("signer.mode", "real");
        properties.setProperty("real.dryRun", "false");
        properties.setProperty("api.allowlist", "https://safe-nexus.org");
        properties.setProperty("pdf.folder", "C:/Users/Branimir/Desktop/ZaPotpis");
        properties.setProperty("keyword", "");
        properties.setProperty("case.insensitive", "true");
        properties.setProperty("providers.order", "EOI,FINA");
        properties.setProperty("eoi.pkcs11", "C:/Program Files/AKD/Certilia Middleware/pkcs11/AkdEidPkcs11_64.dll");
        properties.setProperty("eoi.slotIndex", "");
        properties.setProperty("eoi.pinMode", "prompt");
        properties.setProperty("fina.pkcs11", "C:/Windows/System32/eTPKCS11.dll");
        properties.setProperty("fina.slotIndex", "");
        properties.setProperty("fina.pinMode", "prompt");
        properties.setProperty("reason", "Digitalni potpis");
        properties.setProperty("location", "Hrvatska");
        properties.setProperty("font.size", "8");
        properties.setProperty("fallback.keyword.enabled", "true");
        properties.setProperty("fallback.keyword", "");
        properties.setProperty("fallback.case.insensitive", "true");
        properties.setProperty("skip.already.signed", "true");
        properties.setProperty("rect.width.cm", "6");
        properties.setProperty("rect.height.cm", "2");
        properties.setProperty("offset.down.cm", "2.2");
        properties.setProperty("offset.left.cm", "2.6");
        properties.setProperty("skip.tolerance.pt", "12");
        properties.setProperty("preview.hide.already.signed", "false");
        return properties;
    }

    public static void saveRawProperties(Properties properties) throws IOException {
        Path path = resolveConfigPath();
        Files.createDirectories(path.getParent());
        Properties merged = defaultProperties();
        if (properties != null) {
            for (String name : properties.stringPropertyNames()) {
                if (isPinSecretProperty(name)) {
                    continue;
                }
                merged.setProperty(name, properties.getProperty(name, ""));
            }
        }
        merged.setProperty("api.allowlist", String.join(",", parseAllowedApiBases(merged.getProperty("api.allowlist", ""))));
        try (OutputStream output = Files.newOutputStream(path)) {
            merged.store(output, "SafeNexus PDF Signer config - PIN is never stored");
        }
    }

    public Mode mode() {
        return mode;
    }

    public String modeName() {
        return mode == Mode.REAL ? "real" : "mock";
    }

    public boolean isMock() {
        return mode == Mode.MOCK;
    }

    public boolean realDryRun() {
        return realDryRun;
    }

    public Path configPath() {
        return configPath;
    }

    public void requireSafeNexusApiBase(String apiBaseUrl) throws SignatureBridgeException {
        if (!isAllowedApiBase(apiBaseUrl)) {
            throw new SignatureBridgeException(
                    "INVALID_API_BASE_URL",
                    "PDF Signer smije komunicirati samo s domenama iz lokalne allowliste."
            );
        }
    }

    public void requireSafeNexusUrl(String url, String errorCode, String message) throws SignatureBridgeException {
        if (!isAllowedApiBase(url)) {
            throw new SignatureBridgeException(errorCode, message);
        }
    }

    public List<String> allowedApiBases() {
        return allowedApiBases;
    }

    public List<String> providerOrder() {
        return providerOrder;
    }

    public String eoiPkcs11Lib() {
        return eoiPkcs11Lib;
    }

    public Integer eoiSlotIndex() {
        return eoiSlotIndex;
    }

    public String finaPkcs11Lib() {
        return finaPkcs11Lib;
    }

    public Integer finaSlotIndex() {
        return finaSlotIndex;
    }

    public String reason() {
        return reason;
    }

    public String location() {
        return location;
    }

    public float fontSize() {
        return fontSize;
    }

    public boolean fallbackKeywordEnabled() {
        return fallbackKeywordEnabled;
    }

    public String fallbackKeyword() {
        return fallbackKeyword;
    }

    public boolean fallbackCaseInsensitive() {
        return fallbackCaseInsensitive;
    }

    public float rectWidthPt() {
        return rectWidthPt;
    }

    public float rectHeightPt() {
        return rectHeightPt;
    }

    public float offsetDownPt() {
        return offsetDownPt;
    }

    public float offsetLeftPt() {
        return offsetLeftPt;
    }

    public float skipTolerancePt() {
        return skipTolerancePt;
    }

    private boolean isAllowedApiBase(String value) {
        String candidate = normalizeOrigin(value);
        if (candidate.isBlank()) {
            return false;
        }
        for (String allowed : allowedApiBases) {
            if (candidate.equals(normalizeOrigin(allowed))) {
                return true;
            }
        }
        return false;
    }

    private static Properties loadRawProperties(Path path) {
        Properties properties = defaultProperties();
        if (Files.exists(path)) {
            try (InputStream input = Files.newInputStream(path)) {
                properties.load(input);
            } catch (IOException ignored) {
                // Native Messaging must still answer PING even if config cannot be read.
            }
        }
        return properties;
    }

    private static String normalizeOrigin(String value) {
        try {
            URI uri = URI.create(value == null ? "" : value.trim());
            String scheme = String.valueOf(uri.getScheme()).toLowerCase(Locale.ROOT);
            String host = String.valueOf(uri.getHost()).toLowerCase(Locale.ROOT);
            if (scheme.isBlank() || host.isBlank()) {
                return "";
            }
            int port = uri.getPort();
            String portSuffix = port > 0 ? ":" + port : "";
            return scheme + "://" + host + portSuffix;
        } catch (Exception ignored) {
            return "";
        }
    }

    public static Path resolveConfigPath() {
        String appData = System.getenv("APPDATA");
        Path base = appData == null || appData.isBlank()
                ? Paths.get(System.getProperty("user.home"), ".safenexus-signer")
                : Paths.get(appData, "SafeNexusSigner");
        return base.resolve("config.properties");
    }

    private static List<String> parseList(String value) {
        List<String> items = new ArrayList<>();
        Arrays.stream(String.valueOf(value == null ? "" : value).split("[,\\r\\n]+"))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .forEach(items::add);
        if (items.isEmpty()) {
            items.add("https://safe-nexus.org");
        }
        return items;
    }

    public static List<String> parseAllowedApiBases(String value) {
        List<String> allowed = new ArrayList<>();
        for (String item : parseList(value)) {
            String origin = normalizeOrigin(item);
            if (isPermittedConfigOrigin(origin) && !allowed.contains(origin)) {
                allowed.add(origin);
            }
        }
        if (allowed.isEmpty()) {
            allowed.add("https://safe-nexus.org");
        }
        return allowed;
    }

    private static boolean isPermittedConfigOrigin(String origin) {
        if ("https://safe-nexus.org".equals(origin)) {
            return true;
        }
        if (origin.startsWith("http://localhost") || origin.startsWith("https://localhost")) {
            return true;
        }
        return origin.startsWith("http://127.0.0.1") || origin.startsWith("https://127.0.0.1");
    }

    private static Integer parseIntOrNull(String value) {
        try {
            String trimmed = String.valueOf(value == null ? "" : value).trim();
            return trimmed.isBlank() ? null : Integer.parseInt(trimmed);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static float parseFloat(String value, float fallback) {
        try {
            return value == null ? fallback : Float.parseFloat(value.trim().replace(',', '.'));
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private static float cmToPt(float cm) {
        return cm * 28.35f;
    }

    private static String firstNonBlank(String first, String second) {
        String cleanFirst = String.valueOf(first == null ? "" : first).trim();
        return cleanFirst.isBlank() ? String.valueOf(second == null ? "" : second).trim() : cleanFirst;
    }

    private static boolean isPinSecretProperty(String name) {
        String normalized = String.valueOf(name == null ? "" : name).trim().toLowerCase(Locale.ROOT);
        return normalized.equals("pin") || normalized.equals("eoi.pin") || normalized.equals("fina.pin");
    }
}
