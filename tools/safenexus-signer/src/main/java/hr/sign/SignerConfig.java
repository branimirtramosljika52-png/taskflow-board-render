package hr.sign;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    private SignerConfig(Mode mode, boolean realDryRun, Path configPath) {
        this.mode = mode;
        this.realDryRun = realDryRun;
        this.configPath = configPath;
    }

    public static SignerConfig load() {
        Path path = resolveConfigPath();
        Properties properties = new Properties();
        if (Files.exists(path)) {
            try (InputStream input = Files.newInputStream(path)) {
                properties.load(input);
            } catch (IOException ignored) {
                // Native Messaging must still answer PING even if config cannot be read.
            }
        }

        String envMode = System.getenv("SAFENEXUS_SIGNER_MODE");
        String configuredMode = envMode != null && !envMode.isBlank()
                ? envMode
                : properties.getProperty("signer.mode", "mock");

        Mode mode = "real".equalsIgnoreCase(configuredMode.trim()) ? Mode.REAL : Mode.MOCK;
        boolean dryRun = Boolean.parseBoolean(properties.getProperty("real.dryRun", "true"));
        return new SignerConfig(mode, dryRun, path);
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
        if (!isSafeNexusHttpsUrl(apiBaseUrl)) {
            throw new SignatureBridgeException(
                    "INVALID_API_BASE_URL",
                    "Real signing dry-run smije komunicirati samo s https://safe-nexus.org."
            );
        }
    }

    public void requireSafeNexusUrl(String url, String errorCode, String message) throws SignatureBridgeException {
        if (!isSafeNexusHttpsUrl(url)) {
            throw new SignatureBridgeException(errorCode, message);
        }
    }

    private static boolean isSafeNexusHttpsUrl(String value) {
        try {
            URI uri = URI.create(value == null ? "" : value.trim());
            String scheme = String.valueOf(uri.getScheme()).toLowerCase(Locale.ROOT);
            String host = String.valueOf(uri.getHost()).toLowerCase(Locale.ROOT);
            return "https".equals(scheme) && "safe-nexus.org".equals(host);
        } catch (Exception ignored) {
            return false;
        }
    }

    private static Path resolveConfigPath() {
        String appData = System.getenv("APPDATA");
        Path base = appData == null || appData.isBlank()
                ? Paths.get(System.getProperty("user.home"), ".safenexus-signer")
                : Paths.get(appData, "SafeNexusSigner");
        return base.resolve("config.properties");
    }
}
