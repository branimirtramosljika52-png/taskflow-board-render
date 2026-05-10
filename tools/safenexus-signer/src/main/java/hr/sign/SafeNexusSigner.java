package hr.sign;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import javax.swing.JOptionPane;
import java.awt.Desktop;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public final class SafeNexusSigner {
    private static final int PORT = 9137;

    private SafeNexusSigner() {
    }

    public static void main(String[] args) throws Exception {
        startBridge();
        String launchArg = Arrays.stream(args).findFirst().orElse("");
        if (launchArg.startsWith("safenexus-signer://")) {
            showLaunchDialog(launchArg);
        } else {
            showLaunchDialog("SafeNexus Signer bridge radi na http://127.0.0.1:" + PORT);
        }
    }

    private static void startBridge() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", PORT), 0);
        server.createContext("/health", SafeNexusSigner::handleHealth);
        server.createContext("/sign", SafeNexusSigner::handleSign);
        server.setExecutor(null);
        server.start();
    }

    private static void handleHealth(HttpExchange exchange) throws IOException {
        writeJson(exchange, 200, "{\"ok\":true,\"app\":\"SafeNexusSigner\",\"status\":\"ready\"}");
    }

    private static void handleSign(HttpExchange exchange) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            writeJson(exchange, 405, "{\"ok\":false,\"error\":\"POST required\"}");
            return;
        }

        // Hook point: ovdje se spaja postojeći iText/PKCS#11 engine za FINA/eOI.
        writeJson(exchange, 501, "{\"ok\":false,\"error\":\"Digital signing engine is not wired yet\"}");
    }

    private static void writeJson(HttpExchange exchange, int status, String payload) throws IOException {
        byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "https://safe-nexus.org");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private static void showLaunchDialog(String message) {
        JOptionPane.showMessageDialog(
                null,
                "SafeNexus Signer je pokrenut.\n\n" + message + "\n\nSljedeći korak je spajanje iText/PKCS#11 potpisnog enginea.",
                "SafeNexus Signer",
                JOptionPane.INFORMATION_MESSAGE
        );

        try {
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(URI.create("https://safe-nexus.org/"));
            }
        } catch (Exception ignored) {
            // App ostaje aktivan i ako browser nije dostupan.
        }
    }
}
