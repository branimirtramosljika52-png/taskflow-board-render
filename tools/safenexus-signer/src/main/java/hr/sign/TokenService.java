package hr.sign;

import com.itextpdf.signatures.IExternalSignature;

import javax.naming.ldap.LdapName;
import javax.naming.ldap.Rdn;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.PasswordCallback;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.x500.X500Principal;
import javax.swing.JDialog;
import javax.swing.JOptionPane;
import javax.swing.JPasswordField;
import javax.swing.SwingUtilities;
import java.io.FileWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.Provider;
import java.security.Security;
import java.security.Signature;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.PSSParameterSpec;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class TokenService {
    private static final Pattern ELEVEN_DIGITS = Pattern.compile("(?<!\\d)(\\d{11})(?!\\d)");
    private static final Pattern WORD_ELEVEN_DIGITS = Pattern.compile("\\b(\\d{11})\\b");
    private static final Pattern PNOHR_OIB = Pattern.compile("(?i)\\bPNOHR[-\\s:/]*([0-9]{11})\\b");
    private static final Pattern HR_OIB = Pattern.compile("(?i)\\bHR[-\\s:/]*([0-9]{11})\\b");
    private static final Pattern OIB_ATTRIBUTE = Pattern.compile("(?i)\\bOIB\\s*[:=\\-]?\\s*([0-9]{11})\\b");
    private static final Pattern HEX_DER_VALUE = Pattern.compile("#([0-9A-Fa-f]{4,})");

    public Credential resolveCredentialWithGuiPin(SignerConfig config) throws SignatureBridgeException {
        List<String> providers = config.providerOrder().isEmpty()
                ? List.of("EOI", "FINA")
                : config.providerOrder();
        boolean anyTokenPresent = false;
        List<String> probeErrors = new ArrayList<>();

        for (String providerName : providers) {
            String tag = normalizeProviderTag(providerName);
            ProviderSpec spec = providerSpec(config, tag);
            if (spec == null || spec.libraryPath().isBlank()) {
                continue;
            }

            TokenProbe probe = probeToken(tag, spec.libraryPath(), spec.slotIndex());
            if (!probe.present()) {
                if (!probe.message().isBlank()) {
                    probeErrors.add(tag + ": " + probe.message());
                }
                continue;
            }
            anyTokenPresent = true;

            char[] pin = askPinDialog("Unesite PIN za " + spec.displayName() + ":");
            if (pin == null || pin.length == 0) {
                throw new SignatureBridgeException("PIN_CANCELLED", "PIN nije unesen. Potpisivanje je otkazano lokalno.");
            }

            try {
                return tryPkcs11(tag, spec.libraryPath(), spec.slotIndex(), pin);
            } catch (SignatureBridgeException error) {
                zero(pin);
                if ("INVALID_PIN".equals(error.code())) {
                    throw error;
                }
                probeErrors.add(tag + ": " + error.getMessage());
            }
        }

        if (!anyTokenPresent) {
            String suffix = probeErrors.isEmpty() ? "" : " Detalji: " + String.join("; ", probeErrors);
            throw new SignatureBridgeException("TOKEN_NOT_AVAILABLE", "Nije pronadjen eOI/FINA PKCS#11 token." + suffix);
        }
        throw new SignatureBridgeException("TOKEN_NOT_AVAILABLE", "Nije pronadjen potpisni certifikat na dostupnom tokenu.");
    }

    public List<TokenProbe> detectTokens(SignerConfig config) {
        List<TokenProbe> probes = new ArrayList<>();
        for (String providerName : config.providerOrder()) {
            String tag = normalizeProviderTag(providerName);
            ProviderSpec spec = providerSpec(config, tag);
            if (spec != null) {
                probes.add(probeToken(tag, spec.libraryPath(), spec.slotIndex()));
            }
        }
        if (probes.isEmpty()) {
            probes.add(new TokenProbe("EOI", false, "Provider order je prazan.", "", ""));
        }
        return probes;
    }

    public List<TokenProbe> detectTokenDetails(SignerConfig config) {
        List<TokenProbe> probes = new ArrayList<>();
        for (String providerName : config.providerOrder()) {
            String tag = normalizeProviderTag(providerName);
            ProviderSpec spec = providerSpec(config, tag);
            if (spec == null) {
                continue;
            }
            probes.add(probeTokenWithCertificate(tag, spec.libraryPath(), spec.slotIndex()));
        }
        if (probes.isEmpty()) {
            probes.add(new TokenProbe("EOI", false, "Provider order je prazan.", "", ""));
        }
        return probes;
    }

    public PrivateKey loadPrivateKey(Credential credential) throws SignatureBridgeException {
        try {
            installCallbackHandler(credential.provider(), credential.pin());
            forceContextLogin(credential.provider(), credential.pin());
            KeyStore keyStore = KeyStore.getInstance("PKCS11", credential.provider());
            keyStore.load(null, credential.pin());
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(credential.alias(), credential.pin());
            if (privateKey == null) {
                throw new SignatureBridgeException("TOKEN_NOT_AVAILABLE", "Privatni kljuc nije dostupan na tokenu.");
            }
            return privateKey;
        } catch (SignatureBridgeException error) {
            throw error;
        } catch (Exception error) {
            if (isInvalidPin(error)) {
                throw new SignatureBridgeException("INVALID_PIN", "PIN nije ispravan ili je token odbio prijavu.", "", error.getClass().getName() + ": " + safeMessage(error));
            }
            throw new SignatureBridgeException("SIGN_FAILED", "Ne mogu ucitati privatni kljuc s tokena.", "", error.getClass().getName() + ": " + safeMessage(error));
        }
    }

    public SignatureChoice chooseSignature(PrivateKey privateKey, Provider provider) throws SignatureBridgeException {
        String keyAlgorithm = privateKey.getAlgorithm();
        List<String> candidates = new ArrayList<>();
        if ("RSA".equalsIgnoreCase(keyAlgorithm)) {
            candidates.add("SHA256withRSA");
            candidates.add("SHA-256withRSA");
            candidates.add("SHA256withRSAandMGF1");
            candidates.add("SHA-256withRSAandMGF1");
            candidates.add("RSASSA-PSS");
        } else if ("EC".equalsIgnoreCase(keyAlgorithm)) {
            candidates.add("SHA256withECDSA");
            candidates.add("SHA-256withECDSA");
        } else {
            throw new SignatureBridgeException("SIGN_FAILED", "Nepodrzan tip kljuca: " + keyAlgorithm);
        }

        String chosen = null;
        for (String candidate : candidates) {
            try {
                Signature.getInstance(candidate, provider);
                chosen = candidate;
                break;
            } catch (NoSuchAlgorithmException ignored) {
                // Try the next provider algorithm spelling.
            }
        }

        if (chosen == null) {
            throw new SignatureBridgeException("SIGN_FAILED", "PKCS#11 provider ne nudi potpisni algoritam za " + keyAlgorithm + ".");
        }

        String encryption = ("RSA".equalsIgnoreCase(keyAlgorithm)
                && ("RSASSA-PSS".equals(chosen) || chosen.endsWith("RSAandMGF1")))
                ? "RSAandMGF1"
                : ("RSA".equalsIgnoreCase(keyAlgorithm) ? "RSA" : "ECDSA");

        return new SignatureChoice(
                chosen,
                keyAlgorithm,
                new ChosenPkcs11Signature(privateKey, provider, chosen, "SHA256", encryption)
        );
    }

    private Credential tryPkcs11(String tag, String libraryPath, Integer slotIndex, char[] pin) throws SignatureBridgeException {
        Provider provider = null;
        try {
            String providerName = tag + "_" + Long.toHexString(System.nanoTime());
            String cfg = writePkcs11Cfg(providerName, libraryPath, slotIndex);
            provider = Security.getProvider("SunPKCS11").configure(cfg);
            Security.addProvider(provider);

            installCallbackHandler(provider, pin);
            forceContextLogin(provider, pin);

            KeyStore keyStore = KeyStore.getInstance("PKCS11", provider);
            keyStore.load(null, pin);

            String alias = selectSigningAlias(keyStore);
            if (alias == null) {
                throw new SignatureBridgeException("TOKEN_NOT_AVAILABLE", "Na tokenu nije pronadjen certifikat za digitalni potpis.");
            }

            Certificate[] chain = keyStore.getCertificateChain(alias);
            if (chain == null || chain.length == 0 || !(chain[0] instanceof X509Certificate certificate)) {
                throw new SignatureBridgeException("TOKEN_NOT_AVAILABLE", "Certifikat za potpis nije dostupan na tokenu.");
            }

            return new Credential(
                    tag,
                    provider.getName(),
                    provider,
                    alias,
                    chain,
                    certificate.getSubjectX500Principal().getName(),
                    pin
            );
        } catch (SignatureBridgeException error) {
            if (provider != null) {
                removeProvider(provider);
            }
            throw error;
        } catch (Exception error) {
            if (provider != null) {
                removeProvider(provider);
            }
            if (isInvalidPin(error)) {
                throw new SignatureBridgeException("INVALID_PIN", "PIN nije ispravan ili je token odbio prijavu.", "", error.getClass().getName() + ": " + safeMessage(error));
            }
            if (isTokenAbsent(error)) {
                throw new SignatureBridgeException("TOKEN_NOT_AVAILABLE", tag + " token nije prisutan.", "", error.getClass().getName() + ": " + safeMessage(error));
            }
            throw new SignatureBridgeException("TOKEN_NOT_AVAILABLE", tag + " PKCS#11 inicijalizacija nije uspjela.", "", error.getClass().getName() + ": " + safeMessage(error));
        }
    }

    private TokenProbe probeToken(String tag, String libraryPath, Integer slotIndex) {
        if (libraryPath == null || libraryPath.isBlank()) {
            return new TokenProbe(tag, false, "PKCS#11 putanja nije podesena.", "", "");
        }
        if (!Files.exists(Path.of(libraryPath))) {
            return new TokenProbe(tag, false, "PKCS#11 biblioteka nije pronadjena: " + libraryPath, "", "");
        }
        try {
            String providerName = tag + "_PROBE_" + Long.toHexString(System.nanoTime());
            String cfg = writePkcs11Cfg(providerName, libraryPath, slotIndex);
            Provider probe = Security.getProvider("SunPKCS11").configure(cfg);
            KeyStore keyStore = KeyStore.getInstance("PKCS11", probe);
            try {
                keyStore.load(null, null);
            } catch (Exception error) {
                if (isTokenAbsent(error)) {
                    return new TokenProbe(tag, false, "Token nije prisutan.", "", "");
                }
            }
            return new TokenProbe(tag, true, "Token je detektiran.", "", "");
        } catch (Exception error) {
            if (isTokenAbsent(error)) {
                return new TokenProbe(tag, false, "Token nije prisutan.", "", "");
            }
            return new TokenProbe(tag, false, safeMessage(error), "", "");
        }
    }

    private TokenProbe probeTokenWithCertificate(String tag, String libraryPath, Integer slotIndex) {
        TokenProbe base = probeToken(tag, libraryPath, slotIndex);
        if (!base.present()) {
            return base;
        }
        try {
            String providerName = tag + "_CERT_" + Long.toHexString(System.nanoTime());
            String cfg = writePkcs11Cfg(providerName, libraryPath, slotIndex);
            Provider probe = Security.getProvider("SunPKCS11").configure(cfg);
            KeyStore keyStore = KeyStore.getInstance("PKCS11", probe);
            keyStore.load(null, null);
            for (Enumeration<String> aliases = keyStore.aliases(); aliases.hasMoreElements();) {
                String alias = aliases.nextElement();
                Certificate certificate = keyStore.getCertificate(alias);
                if (certificate instanceof X509Certificate x509) {
                    CertificateIdentity identity = inspectCertificate(x509);
                    String keyAlgorithm = x509.getPublicKey() == null ? "" : x509.getPublicKey().getAlgorithm();
                    return new TokenProbe(
                            tag,
                            true,
                            "Token je detektiran.",
                            identity.subjectDn(),
                            identity.oib(),
                            identity.serialNumber(),
                            alias,
                            keyAlgorithm
                    );
                }
            }
            return new TokenProbe(tag, true, "Token je detektiran, ali certifikat nije citljiv bez PIN-a.", "", "");
        } catch (Exception error) {
            return new TokenProbe(tag, true, "Token je detektiran, certifikat nije citljiv bez PIN-a: " + safeMessage(error), "", "");
        }
    }

    private static ProviderSpec providerSpec(SignerConfig config, String tag) {
        return switch (tag) {
            case "EOI" -> new ProviderSpec("EOI", "eOI", config.eoiPkcs11Lib(), config.eoiSlotIndex());
            case "FINA" -> new ProviderSpec("FINA", "FINA", config.finaPkcs11Lib(), config.finaSlotIndex());
            default -> null;
        };
    }

    private static String normalizeProviderTag(String value) {
        String tag = String.valueOf(value == null ? "" : value).trim().toUpperCase(Locale.ROOT);
        if (tag.contains("FINA")) {
            return "FINA";
        }
        if (tag.contains("EOI") || tag.contains("EID") || tag.contains("AKD")) {
            return "EOI";
        }
        return tag;
    }

    private static String writePkcs11Cfg(String providerName, String libraryPath, Integer slotIndex) throws Exception {
        Path cfg = Files.createTempFile("safenexus-" + providerName.toLowerCase(Locale.ROOT), ".cfg");
        cfg.toFile().deleteOnExit();
        try (FileWriter writer = new FileWriter(cfg.toFile())) {
            writer.write("name = " + providerName + "\n");
            writer.write("library = " + libraryPath.replace('\\', '/') + "\n");
            if (slotIndex != null) {
                writer.write("slotListIndex = " + slotIndex + "\n");
            }
        }
        return cfg.toAbsolutePath().toString();
    }

    private static String selectSigningAlias(KeyStore keyStore) throws Exception {
        String fallback = null;
        for (Enumeration<String> aliases = keyStore.aliases(); aliases.hasMoreElements();) {
            String alias = aliases.nextElement();
            Certificate certificate = keyStore.getCertificate(alias);
            if (!(certificate instanceof X509Certificate x509)) {
                continue;
            }

            String subject = x509.getSubjectX500Principal().getName();
            if (subject.contains("OU=Signature")) {
                return alias;
            }

            boolean[] keyUsage = x509.getKeyUsage();
            boolean hasDigitalSignature = keyUsage != null && keyUsage.length > 0 && keyUsage[0];
            if (hasDigitalSignature) {
                return alias;
            }

            boolean usable = keyUsage != null && ((keyUsage.length > 0 && keyUsage[0]) || (keyUsage.length > 1 && keyUsage[1]));
            if (usable && fallback == null) {
                fallback = alias;
            }
            if (usable && subject.toLowerCase(Locale.ROOT).contains("sign")) {
                return alias;
            }
        }
        return fallback;
    }

    private static void installCallbackHandler(Provider provider, char[] pin) {
        if (provider instanceof java.security.AuthProvider authProvider) {
            try {
                authProvider.setCallbackHandler(callbacks -> {
                    for (Callback callback : callbacks) {
                        if (callback instanceof PasswordCallback passwordCallback) {
                            passwordCallback.setPassword(pin);
                        } else {
                            throw new UnsupportedCallbackException(callback);
                        }
                    }
                });
            } catch (Exception ignored) {
                // Provider may not need a callback handler.
            }
        }
    }

    private static void forceContextLogin(Provider provider, char[] pin) {
        if (!(provider instanceof java.security.AuthProvider authProvider)) {
            return;
        }
        try {
            authProvider.logout();
        } catch (Exception ignored) {
            // Continue with login attempt.
        }
        try {
            authProvider.login(null, callbacks -> {
                for (Callback callback : callbacks) {
                    if (callback instanceof PasswordCallback passwordCallback) {
                        passwordCallback.setPassword(pin);
                    }
                }
            });
        } catch (Exception ignored) {
            // Some providers log in lazily during key access.
        }
    }

    private static char[] askPinDialog(String prompt) throws SignatureBridgeException {
        try {
            final char[][] result = new char[1][];
            Runnable dialog = () -> {
                JPasswordField passwordField = new JPasswordField();
                Object[] message = { prompt, passwordField };
                JOptionPane pane = new JOptionPane(message, JOptionPane.PLAIN_MESSAGE, JOptionPane.OK_CANCEL_OPTION);
                JDialog window = pane.createDialog(null, "SafeNexus PDF Signer - PIN");
                window.setAlwaysOnTop(true);
                window.setVisible(true);
                Object value = pane.getValue();
                if (value instanceof Integer && ((Integer) value) == JOptionPane.OK_OPTION) {
                    result[0] = passwordField.getPassword();
                } else {
                    result[0] = null;
                }
            };
            if (SwingUtilities.isEventDispatchThread()) {
                dialog.run();
            } else {
                SwingUtilities.invokeAndWait(dialog);
            }
            return result[0];
        } catch (Exception error) {
            throw new SignatureBridgeException("PIN_CANCELLED", "PIN prozor nije mogao biti otvoren: " + safeMessage(error));
        }
    }

    public static String extractField(String dn, String keyNoEq) {
        if (dn == null || keyNoEq == null) {
            return "";
        }
        try {
            LdapName ldapName = new LdapName(dn);
            for (Rdn rdn : ldapName.getRdns()) {
                if (rdn.getType().equalsIgnoreCase(keyNoEq)) {
                    return rdnValueToString(rdn.getValue());
                }
            }
        } catch (Exception ignored) {
            // Fall back to simple parsing.
        }
        String key = keyNoEq.endsWith("=") ? keyNoEq : keyNoEq + "=";
        int index = dn.toUpperCase(Locale.ROOT).indexOf(key.toUpperCase(Locale.ROOT));
        if (index < 0) {
            return "";
        }
        int start = index + key.length();
        boolean quoted = start < dn.length() && dn.charAt(start) == '"';
        if (quoted) {
            start++;
        }
        StringBuilder out = new StringBuilder();
        for (int i = start; i < dn.length(); i++) {
            char c = dn.charAt(i);
            if (quoted) {
                if (c == '"') {
                    break;
                }
            } else if (c == ',') {
                break;
            }
            out.append(c);
        }
        return out.toString().trim();
    }

    public static String extractOibFromCertificate(X509Certificate certificate) {
        return inspectCertificate(certificate).oib();
    }

    public static String extractSerialNumberFromCertificate(X509Certificate certificate) {
        return inspectCertificate(certificate).serialNumber();
    }

    public static CertificateIdentity inspectCertificate(X509Certificate certificate) {
        if (certificate == null) {
            return new CertificateIdentity("", "", "", List.of());
        }
        List<String> subjects = new ArrayList<>();
        X500Principal principal = certificate.getSubjectX500Principal();
        subjects.add(principal.getName(X500Principal.RFC2253));
        subjects.add(principal.getName(X500Principal.RFC1779));
        subjects.add(principal.getName(X500Principal.CANONICAL));
        subjects.add(certificate.getSubjectDN().getName());

        List<String> candidates = new ArrayList<>(subjects);
        List<String> serialCandidates = new ArrayList<>();
        for (String subject : subjects) {
            for (String key : List.of("SERIALNUMBER", "serialNumber", "2.5.4.5", "OID.2.5.4.5", "OIB")) {
                String serialValue = extractField(subject, key);
                if (!serialValue.isBlank()) {
                    serialCandidates.add(serialValue);
                    candidates.add(serialValue);
                }
            }
        }

        for (String san : subjectAlternativeNameValues(certificate)) {
            candidates.add(san);
            String serialLike = extractSerialLikeValue(san);
            if (!serialLike.isBlank()) {
                serialCandidates.add(serialLike);
                candidates.add(serialLike);
            }
        }

        String serialNumber = "";
        for (String serialCandidate : serialCandidates) {
            String decoded = normalizeCandidateText(serialCandidate);
            if (!decoded.isBlank()) {
                serialNumber = decoded;
                break;
            }
        }

        String parsedOib = "";
        for (String candidate : candidates) {
            parsedOib = extractOib(candidate);
            if (!parsedOib.isBlank()) {
                break;
            }
        }

        return new CertificateIdentity(
                subjects.isEmpty() ? "" : subjects.get(0),
                serialNumber,
                parsedOib,
                List.copyOf(candidates)
        );
    }

    public static String extractOib(String value) {
        String combined = normalizeCandidateText(value);

        for (Pattern pattern : List.of(OIB_ATTRIBUTE, PNOHR_OIB, HR_OIB, ELEVEN_DIGITS, WORD_ELEVEN_DIGITS)) {
            Matcher matcher = pattern.matcher(combined);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return "";
    }

    private static String normalizeCandidateText(String value) {
        String raw = String.valueOf(value == null ? "" : value);
        String decoded = decodeEmbeddedDerHex(raw);
        return (raw + " " + decoded).trim();
    }

    private static List<String> subjectAlternativeNameValues(X509Certificate certificate) {
        List<String> values = new ArrayList<>();
        try {
            Collection<List<?>> names = certificate.getSubjectAlternativeNames();
            if (names == null) {
                return values;
            }
            for (List<?> name : names) {
                if (name == null || name.size() < 2) {
                    continue;
                }
                Object value = name.get(1);
                if (value instanceof byte[] bytes) {
                    values.add(decodeDerString(bytes));
                    values.add(bytesToHexString(bytes));
                } else {
                    values.add(String.valueOf(value));
                }
                values.add(String.valueOf(name));
            }
        } catch (Exception ignored) {
            // Some tokens do not expose SAN without additional middleware support.
        }
        return values;
    }

    private static String extractSerialLikeValue(String value) {
        String normalized = normalizeCandidateText(value);
        Matcher matcher = Pattern.compile("(?i)\\b(?:SERIALNUMBER|2\\.5\\.4\\.5|OIB)\\s*[:=]\\s*([^,;\\]]+)").matcher(normalized);
        return matcher.find() ? matcher.group(1).trim() : "";
    }

    private static String rdnValueToString(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof byte[] bytes) {
            return decodeDerString(bytes);
        }
        return String.valueOf(value);
    }

    private static String decodeEmbeddedDerHex(String value) {
        Matcher matcher = HEX_DER_VALUE.matcher(String.valueOf(value == null ? "" : value));
        StringBuilder out = new StringBuilder();
        while (matcher.find()) {
            byte[] bytes = hexToBytes(matcher.group(1));
            String decoded = decodeDerString(bytes);
            if (!decoded.isBlank()) {
                out.append(' ').append(decoded);
            }
        }
        return out.toString();
    }

    private static String decodeDerString(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return "";
        }
        try {
            int offset = 0;
            int tag = bytes[offset] & 0xff;
            if (isDerStringTag(tag) && bytes.length > 2) {
                offset++;
                int length = bytes[offset++] & 0xff;
                if ((length & 0x80) != 0) {
                    int count = length & 0x7f;
                    length = 0;
                    for (int i = 0; i < count && offset < bytes.length; i++) {
                        length = (length << 8) | (bytes[offset++] & 0xff);
                    }
                }
                if (length >= 0 && offset + length <= bytes.length) {
                    byte[] content = java.util.Arrays.copyOfRange(bytes, offset, offset + length);
                    return new String(content, tag == 0x1e ? StandardCharsets.UTF_16BE : StandardCharsets.UTF_8).trim();
                }
            }
            return new String(bytes, StandardCharsets.UTF_8).trim();
        } catch (Exception ignored) {
            return "";
        }
    }

    private static boolean isDerStringTag(int tag) {
        return tag == 0x0c || tag == 0x13 || tag == 0x14 || tag == 0x16 || tag == 0x1e;
    }

    private static byte[] hexToBytes(String hex) {
        String clean = String.valueOf(hex == null ? "" : hex).replaceAll("[^0-9A-Fa-f]", "");
        int length = clean.length();
        byte[] bytes = new byte[length / 2];
        for (int i = 0; i + 1 < length; i += 2) {
            bytes[i / 2] = (byte) Integer.parseInt(clean.substring(i, i + 2), 16);
        }
        return bytes;
    }

    private static String bytesToHexString(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return "";
        }
        StringBuilder out = new StringBuilder("#");
        for (byte value : bytes) {
            out.append(String.format("%02X", value));
        }
        return out.toString();
    }

    private static boolean isTokenAbsent(Throwable error) {
        String flattened = flattenThrowable(error).toLowerCase(Locale.ROOT);
        return flattened.contains("ckr_token_not_present")
                || flattened.contains("token not present")
                || flattened.contains("no token")
                || flattened.contains("no smart card")
                || flattened.contains("card not present")
                || flattened.contains("device not found")
                || (flattened.contains("slot") && flattened.contains("empty"));
    }

    private static boolean isInvalidPin(Throwable error) {
        String flattened = flattenThrowable(error).toLowerCase(Locale.ROOT);
        return flattened.contains("ckr_pin_incorrect")
                || flattened.contains("pin incorrect")
                || flattened.contains("invalid pin")
                || flattened.contains("login failed")
                || flattened.contains("password")
                || flattened.contains("ckr_pin_locked");
    }

    private static String flattenThrowable(Throwable error) {
        StringBuilder out = new StringBuilder();
        Throwable current = error;
        while (current != null) {
            out.append(current).append(" | ");
            current = current.getCause();
        }
        return out.toString();
    }

    private static String safeMessage(Throwable error) {
        String message = error == null ? "" : error.getMessage();
        return message == null || message.isBlank() ? "nepoznata greska" : message;
    }

    private static void removeProvider(Provider provider) {
        try {
            if (provider != null && provider.getName() != null) {
                Security.removeProvider(provider.getName());
            }
        } catch (Exception ignored) {
            // Best effort cleanup.
        }
    }

    private static void zero(char[] value) {
        if (value != null) {
            java.util.Arrays.fill(value, '\0');
        }
    }

    public record CertificateIdentity(String subjectDn, String serialNumber, String oib, List<String> sources) {
    }

    public record TokenProbe(
            String provider,
            boolean present,
            String message,
            String subject,
            String oib,
            String serialNumber,
            String alias,
            String keyAlgorithm
    ) {
        public TokenProbe(String provider, boolean present, String message, String subject, String oib) {
            this(provider, present, message, subject, oib, "", "", "");
        }
    }

    private record ProviderSpec(String tag, String displayName, String libraryPath, Integer slotIndex) {
    }

    public record SignatureChoice(String algorithm, String keyAlgorithm, IExternalSignature externalSignature) {
    }

    public static final class Credential implements AutoCloseable {
        private final String mode;
        private final String providerName;
        private final Provider provider;
        private final String alias;
        private final Certificate[] chain;
        private final String subject;
        private final char[] pin;

        private Credential(
                String mode,
                String providerName,
                Provider provider,
                String alias,
                Certificate[] chain,
                String subject,
                char[] pin
        ) {
            this.mode = mode;
            this.providerName = providerName;
            this.provider = provider;
            this.alias = alias;
            this.chain = chain;
            this.subject = subject;
            this.pin = pin;
        }

        public String mode() {
            return mode;
        }

        public String providerName() {
            return providerName;
        }

        public Provider provider() {
            return provider;
        }

        public String alias() {
            return alias;
        }

        public Certificate[] chain() {
            return chain;
        }

        public X509Certificate certificate() {
            return chain != null && chain.length > 0 && chain[0] instanceof X509Certificate certificate
                    ? certificate
                    : null;
        }

        public String subject() {
            return subject;
        }

        public String commonName() {
            return extractField(subject, "CN");
        }

        public String organization() {
            return extractField(subject, "O");
        }

        public String serialNumber() {
            return extractSerialNumberFromCertificate(certificate());
        }

        public String oib() {
            return extractOibFromCertificate(certificate());
        }

        private char[] pin() {
            return pin;
        }

        @Override
        public void close() {
            zero(pin);
            removeProvider(provider);
        }
    }

    public static final class ChosenPkcs11Signature implements IExternalSignature {
        private final PrivateKey privateKey;
        private final Provider provider;
        private final String chosenName;
        private final String hashOut;
        private final String encryptionOut;

        ChosenPkcs11Signature(PrivateKey privateKey, Provider provider, String chosenName, String hashOut, String encryptionOut) {
            this.privateKey = privateKey;
            this.provider = provider;
            this.chosenName = chosenName;
            this.hashOut = hashOut;
            this.encryptionOut = encryptionOut;
        }

        @Override
        public String getHashAlgorithm() {
            return hashOut;
        }

        @Override
        public String getEncryptionAlgorithm() {
            return encryptionOut;
        }

        @Override
        public byte[] sign(byte[] message) throws GeneralSecurityException {
            Signature signature = Signature.getInstance(chosenName, provider);
            if ("RSASSA-PSS".equals(chosenName) || chosenName.endsWith("RSAandMGF1")) {
                PSSParameterSpec pss = new PSSParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, 32, 1);
                signature.setParameter(pss);
            }
            signature.initSign(privateKey);
            signature.update(message);
            return signature.sign();
        }
    }
}
