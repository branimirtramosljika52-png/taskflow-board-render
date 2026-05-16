package hr.sign;

import com.itextpdf.forms.PdfAcroForm;
import com.itextpdf.forms.fields.PdfFormField;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.ReaderProperties;
import com.itextpdf.kernel.pdf.StampingProperties;
import com.itextpdf.kernel.pdf.annot.PdfWidgetAnnotation;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.canvas.parser.EventType;
import com.itextpdf.kernel.pdf.canvas.parser.PdfCanvasProcessor;
import com.itextpdf.kernel.pdf.canvas.parser.data.IEventData;
import com.itextpdf.kernel.pdf.canvas.parser.data.TextRenderInfo;
import com.itextpdf.kernel.pdf.canvas.parser.listener.IEventListener;
import com.itextpdf.kernel.pdf.extgstate.PdfExtGState;
import com.itextpdf.kernel.pdf.xobject.PdfFormXObject;
import com.itextpdf.signatures.BouncyCastleDigest;
import com.itextpdf.signatures.IExternalDigest;
import com.itextpdf.signatures.PdfPKCS7;
import com.itextpdf.signatures.PdfSigner;
import com.itextpdf.signatures.PdfSignatureAppearance;
import com.itextpdf.signatures.SignatureUtil;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class SigningService {
    private final SignerConfig config;
    private final TokenService tokenService;
    private final PdfSignatureFieldService fieldService;

    public SigningService(SignerConfig config, TokenService tokenService, PdfSignatureFieldService fieldService) {
        this.config = config;
        this.tokenService = tokenService;
        this.fieldService = fieldService;
    }

    public SignedPdf signPdfByField(byte[] pdfBytes, String fieldName, TokenService.Credential credential) throws SignatureBridgeException {
        return signPdfByField(pdfBytes, fieldName, credential, SignatureAppearanceMetadata.empty());
    }

    public SignedPdf signPdfByField(byte[] pdfBytes, String fieldName, TokenService.Credential credential, SignatureAppearanceMetadata metadata) throws SignatureBridgeException {
        try {
            List<PdfSignatureFieldService.SignatureFieldInfo> fields = fieldService.listSignatureFields(pdfBytes);
            PdfSignatureFieldService.SignatureFieldInfo field = fields.stream()
                    .filter(candidate -> candidate.fieldName().equals(fieldName))
                    .findFirst()
                    .orElseThrow(() -> new SignatureBridgeException(
                            "NO_MATCHING_SIGNATURE_FIELD",
                            "Nije pronadjeno signature polje " + fieldName + "."
                    ));
            if ("already_signed".equals(field.status())) {
                throw new SignatureBridgeException("ALREADY_SIGNED", "Signature polje " + fieldName + " je vec potpisano.");
            }

            Rectangle rectangle = field.page() > 0 && field.width() > 0 && field.height() > 0
                    ? new Rectangle(field.x(), field.y(), field.width(), field.height())
                    : null;
            return signOnce(pdfBytes, fieldName, rectangle, field.page(), credential, "field", metadata);
        } catch (SignatureBridgeException error) {
            throw error;
        } catch (Exception error) {
            throw new SignatureBridgeException(
                    "SIGN_FAILED",
                    "Potpis po signature fieldu nije uspio.",
                    "",
                    error.getClass().getName() + ": " + safeMessage(error)
            );
        }
    }

    public SignedPdf signPdfByKeywordFallback(
            byte[] pdfBytes,
            String keyword,
            TokenService.Credential credential,
            String originalName
    ) throws SignatureBridgeException {
        return signPdfByKeywordFallback(pdfBytes, keyword, credential, originalName, SignatureAppearanceMetadata.empty());
    }

    public SignedPdf signPdfByKeywordFallback(
            byte[] pdfBytes,
            String keyword,
            TokenService.Credential credential,
            String originalName,
            SignatureAppearanceMetadata metadata
    ) throws SignatureBridgeException {
        if (!config.fallbackKeywordEnabled()) {
            throw new SignatureBridgeException("NO_SIGNATURE_FIELDS", "PDF nema signature field, a keyword fallback je iskljucen.");
        }
        String normalizedKeyword = String.valueOf(keyword == null ? "" : keyword).trim();
        if (normalizedKeyword.isBlank()) {
            throw new SignatureBridgeException("NO_SIGNATURE_FIELDS", "PDF nema signature field, a fallback keyword nije definiran.");
        }

        try {
            List<Match> matches = findAllKeywordMatches(pdfBytes, normalizedKeyword, config.fallbackCaseInsensitive());
            if (matches.isEmpty()) {
                throw new SignatureBridgeException(
                        "NO_SIGNATURE_FIELDS",
                        "PDF nema signature field i nije pronadjen fallback keyword."
                );
            }

            List<SignedSpot> existing = loadSignedSpots(pdfBytes);
            String baseName = sanitizeFieldName(stripPdfSuffix(originalName == null || originalName.isBlank() ? "document" : originalName));
            for (Match match : matches) {
                Rectangle rectangle = plannedRectForMatch(match);
                if (isAlreadySignedAt(existing, match.page(), rectangle)) {
                    continue;
                }
                String fieldName = pickFieldNameAvoidingConflict(
                        existing,
                        "sig_" + baseName + "_p" + match.page() + "_x" + q5(rectangle.getX()) + "_y" + q5(rectangle.getY())
                );
                return signOnce(pdfBytes, fieldName, rectangle, match.page(), credential, "keyword", metadata);
            }

            throw new SignatureBridgeException("ALREADY_SIGNED", "Sve fallback keyword pozicije su vec potpisane.");
        } catch (SignatureBridgeException error) {
            throw error;
        } catch (Exception error) {
            throw new SignatureBridgeException(
                    "SIGN_FAILED",
                    "Fallback potpis po keywordu nije uspio.",
                    "",
                    error.getClass().getName() + ": " + safeMessage(error)
            );
        }
    }

    private SignedPdf signOnce(
            byte[] pdfBytes,
            String fieldName,
            Rectangle rectangle,
            int page,
            TokenService.Credential credential,
            String signingMode,
            SignatureAppearanceMetadata metadata
    ) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream(Math.max(pdfBytes.length + 16384, 65536));
        try (PdfReader reader = new PdfReader(new ByteArrayInputStream(pdfBytes), new ReaderProperties())) {
            PdfSigner signer = new PdfSigner(reader, output, new StampingProperties().useAppendMode());

            PrivateKey privateKey = tokenService.loadPrivateKey(credential);
            TokenService.SignatureChoice signatureChoice = tokenService.chooseSignature(privateKey, credential.provider());

            String appearanceText = buildAppearanceText(credential, metadata);
            PdfSignatureAppearance appearance = signer.getSignatureAppearance()
                    .setReason(config.reason())
                    .setLocation(config.location())
                    .setRenderingMode(PdfSignatureAppearance.RenderingMode.DESCRIPTION)
                    .setLayer2Text(appearanceText)
                    .setLayer2FontSize(config.fontSize())
                    .setLayer2FontColor(ColorConstants.BLACK);

            PdfFont font = tryLoadUnicodeFont();
            if (font != null) {
                appearance.setLayer2Font(font);
            }

            if (rectangle != null && page > 0) {
                appearance
                        .setPageRect(rectangle)
                        .setPageNumber(page);
            }

            drawConfiguredAppearanceBackground(signer, appearance);

            signer.setFieldName(fieldName);
            IExternalDigest digest = new BouncyCastleDigest();
            signer.signDetached(
                    digest,
                    signatureChoice.externalSignature(),
                    credential.chain(),
                    null,
                    null,
                    null,
                    0,
                    PdfSigner.CryptoStandard.CADES
            );

            return new SignedPdf(
                    output.toByteArray(),
                    fieldName,
                    signingMode,
                    page,
                    signatureChoice.algorithm(),
                    signatureChoice.keyAlgorithm(),
                    credential.oib(),
                    credential.commonName()
            );
        }
    }

    private String buildAppearanceText(TokenService.Credential credential, SignatureAppearanceMetadata metadata) {
        List<String> lines = new ArrayList<>();
        SignatureAppearanceMetadata safeMetadata = metadata == null ? SignatureAppearanceMetadata.empty() : metadata;
        String signerName = firstNonBlank(safeMetadata.signerName(), credential.commonName());
        if (config.appearanceShowQualifiedLabel()) {
            lines.add("Kvalificirani digitalni potpis");
        }
        if (config.appearanceShowName() && !signerName.isBlank()) {
            lines.add(signerName);
        }
        if (config.appearanceShowTitle() && !safeMetadata.signerTitle().isBlank()) {
            lines.add(safeMetadata.signerTitle());
        }
        if (config.appearanceShowRole() && !safeMetadata.roleLabel().isBlank()) {
            lines.add(safeMetadata.roleLabel());
        }
        if (config.appearanceShowOib()) {
            String oib = firstNonBlank(safeMetadata.signerOib(), credential.oib());
            if (!oib.isBlank()) {
                lines.add("OIB " + oib);
            }
        }
        if (config.appearanceShowOrganization()) {
            String organization = firstNonBlank(safeMetadata.organization(), credential.organization());
            if (!organization.isBlank()) {
                lines.add(organization);
            }
        }
        if (config.appearanceShowDateTime()) {
            lines.add(new SimpleDateFormat("dd.MM.yyyy HH:mm:ss").format(new Date()));
        }
        if (config.appearanceShowCertificateSubject() && !credential.subject().isBlank()) {
            lines.add(credential.subject());
        }
        if (config.appearanceShowProvider() && !credential.providerName().isBlank()) {
            lines.add(credential.providerName());
        }
        if (config.appearanceShowReason() && !config.reason().isBlank()) {
            lines.add(config.reason());
        }
        if (config.appearanceShowLocation() && !config.location().isBlank()) {
            lines.add(config.location());
        }
        int limit = config.appearanceCompactMode() ? 5 : 10;
        return String.join("\n", lines.stream().filter(line -> !line.isBlank()).limit(limit).toList());
    }

    private void drawConfiguredAppearanceBackground(PdfSigner signer, PdfSignatureAppearance appearance) {
        try {
            PdfFormXObject layer0 = appearance.getLayer0();
            Rectangle box = layer0.getBBox().toRectangle();
            PdfCanvas canvas = new PdfCanvas(layer0, signer.getDocument());
            if (!config.appearanceTransparentBackground()) {
                canvas.saveState();
                canvas.setFillColor(ColorConstants.WHITE);
                canvas.rectangle(0, 0, box.getWidth(), box.getHeight());
                canvas.fill();
                canvas.restoreState();
            }
            if (config.appearanceShowLogo()) {
                ImageData logo = loadAppearanceLogo();
                if (logo != null && logo.getWidth() > 0 && logo.getHeight() > 0) {
                    float scale = Math.min((box.getWidth() * 0.82f) / logo.getWidth(), (box.getHeight() * 0.78f) / logo.getHeight());
                    if (Float.isFinite(scale) && scale > 0f) {
                        float width = logo.getWidth() * scale;
                        float height = logo.getHeight() * scale;
                        PdfExtGState state = new PdfExtGState()
                                .setFillOpacity(config.appearanceLogoOpacity())
                                .setStrokeOpacity(config.appearanceLogoOpacity());
                        canvas.saveState();
                        canvas.setExtGState(state);
                        canvas.addImageFittedIntoRectangle(
                                logo,
                                new Rectangle((box.getWidth() - width) / 2f, (box.getHeight() - height) / 2f, width, height),
                                false
                        );
                        canvas.restoreState();
                    }
                }
            }
            if (config.appearanceBorder()) {
                canvas.saveState();
                canvas.setStrokeColor(ColorConstants.LIGHT_GRAY);
                canvas.setLineWidth(0.35f);
                canvas.rectangle(0.3f, 0.3f, Math.max(0f, box.getWidth() - 0.6f), Math.max(0f, box.getHeight() - 0.6f));
                canvas.stroke();
                canvas.restoreState();
            }
        } catch (Exception ignored) {
            // Appearance background is cosmetic; signing must continue if it cannot be drawn.
        }
    }

    private ImageData loadAppearanceLogo() {
        String dataUrl = String.valueOf(config.appearanceLogoDataUrl() == null ? "" : config.appearanceLogoDataUrl()).trim();
        if (!dataUrl.startsWith("data:image/")) {
            return null;
        }
        int comma = dataUrl.indexOf(',');
        if (comma < 0 || !dataUrl.substring(0, comma).toLowerCase(Locale.ROOT).contains(";base64")) {
            return null;
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(dataUrl.substring(comma + 1).replaceAll("\\s+", ""));
            return ImageDataFactory.create(bytes);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String firstNonBlank(String first, String second) {
        String cleanFirst = String.valueOf(first == null ? "" : first).trim();
        if (!cleanFirst.isBlank()) {
            return cleanFirst;
        }
        return String.valueOf(second == null ? "" : second).trim();
    }

    private PdfFont tryLoadUnicodeFont() {
        String[] candidates = {
                "C:/Windows/Fonts/segoeui.ttf",
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/calibri.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        };
        for (String candidate : candidates) {
            try {
                if (java.nio.file.Files.exists(java.nio.file.Path.of(candidate))) {
                    return PdfFontFactory.createFont(
                            candidate,
                            PdfEncodings.IDENTITY_H,
                            PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED
                    );
                }
            } catch (Exception ignored) {
                // Try next font.
            }
        }
        return null;
    }

    private Rectangle plannedRectForMatch(Match match) {
        float yRect = Math.max(10f, match.y() - config.offsetDownPt());
        float xRect = Math.max(10f, match.x() - config.offsetLeftPt());
        return new Rectangle(xRect, yRect, config.rectWidthPt(), config.rectHeightPt());
    }

    private List<SignedSpot> loadSignedSpots(byte[] pdfBytes) {
        List<SignedSpot> spots = new ArrayList<>();
        try (PdfDocument document = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes), new ReaderProperties()))) {
            SignatureUtil signatureUtil = new SignatureUtil(document);
            PdfAcroForm acroForm = PdfAcroForm.getAcroForm(document, false);
            if (acroForm == null) {
                return spots;
            }

            for (String name : signatureUtil.getSignatureNames()) {
                try {
                    PdfPKCS7 signatureData = signatureUtil.readSignatureData(name);
                    X509Certificate certificate = signatureData.getSigningCertificate();
                    String subjectCn = certificate == null ? "" : TokenService.extractField(certificate.getSubjectX500Principal().getName(), "CN");

                    PdfFormField field = acroForm.getField(name);
                    if (field == null || field.getWidgets() == null || field.getWidgets().isEmpty()) {
                        continue;
                    }
                    PdfWidgetAnnotation widget = field.getWidgets().get(0);
                    Rectangle rectangle = widget.getRectangle() == null ? null : widget.getRectangle().toRectangle();
                    if (rectangle == null) {
                        continue;
                    }
                    int page = 0;
                    try {
                        if (widget.getPage() != null) {
                            page = document.getPageNumber(widget.getPage());
                        }
                    } catch (Exception ignored) {
                        page = 0;
                    }
                    spots.add(new SignedSpot(
                            name,
                            page,
                            rectangle.getX(),
                            rectangle.getY(),
                            rectangle.getWidth(),
                            rectangle.getHeight(),
                            subjectCn
                    ));
                } catch (Exception ignored) {
                    // A malformed old signature must not break fallback scanning.
                }
            }
        } catch (Exception ignored) {
            // No existing signatures detected.
        }
        return spots;
    }

    private boolean isAlreadySignedAt(List<SignedSpot> spots, int page, Rectangle rectangle) {
        for (SignedSpot spot : spots) {
            if (spot.page() > 0 && page != spot.page()) {
                continue;
            }
            if (rectsOverlap(
                    rectangle.getX(),
                    rectangle.getY(),
                    rectangle.getWidth(),
                    rectangle.getHeight(),
                    spot.x(),
                    spot.y(),
                    spot.width(),
                    spot.height(),
                    config.skipTolerancePt()
            )) {
                return true;
            }
        }
        return false;
    }

    private static String pickFieldNameAvoidingConflict(List<SignedSpot> spots, String expected) {
        Set<String> names = new HashSet<>();
        for (SignedSpot spot : spots) {
            names.add(spot.fieldName());
        }
        if (!names.contains(expected)) {
            return expected;
        }
        for (int index = 2; index < 1000; index++) {
            String candidate = expected + "_" + index;
            if (!names.contains(candidate)) {
                return candidate;
            }
        }
        return expected + "_" + Long.toHexString(System.nanoTime());
    }

    private static List<Match> findAllKeywordMatches(byte[] pdfBytes, String keyword, boolean caseInsensitive) throws Exception {
        List<Match> results = new ArrayList<>();
        String target = caseInsensitive ? keyword.toLowerCase(Locale.ROOT) : keyword;

        try (PdfDocument document = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes), new ReaderProperties()))) {
            int pageCount = document.getNumberOfPages();
            for (int page = 1; page <= pageCount; page++) {
                final int currentPage = page;
                Deque<Glyph> window = new ArrayDeque<>();
                int keywordLength = target.length();

                IEventListener listener = new IEventListener() {
                    @Override
                    public void eventOccurred(IEventData data, EventType type) {
                        if (type != EventType.RENDER_TEXT) {
                            return;
                        }
                        TextRenderInfo textInfo = (TextRenderInfo) data;
                        List<TextRenderInfo> chars = textInfo.getCharacterRenderInfos();
                        for (TextRenderInfo charInfo : chars) {
                            String text = charInfo.getText();
                            if (text == null || text.isEmpty()) {
                                continue;
                            }
                            String normalized = caseInsensitive ? text.toLowerCase(Locale.ROOT) : text;
                            float x = charInfo.getBaseline().getStartPoint().get(0);
                            float y = charInfo.getBaseline().getStartPoint().get(1);

                            window.addLast(new Glyph(normalized, x, y));
                            while (window.size() > keywordLength) {
                                window.removeFirst();
                            }
                            if (window.size() == keywordLength) {
                                StringBuilder out = new StringBuilder();
                                for (Glyph glyph : window) {
                                    out.append(glyph.text());
                                }
                                if (out.toString().equals(target)) {
                                    Glyph first = window.peekFirst();
                                    results.add(new Match(currentPage, first.x(), first.y(), keyword));
                                }
                            }
                        }
                    }

                    @Override
                    public Set<EventType> getSupportedEvents() {
                        return Collections.singleton(EventType.RENDER_TEXT);
                    }
                };
                new PdfCanvasProcessor(listener).processPageContent(document.getPage(page));
            }
        }
        return results;
    }

    private static boolean rectsOverlap(
            float ax,
            float ay,
            float aw,
            float ah,
            float bx,
            float by,
            float bw,
            float bh,
            float margin
    ) {
        float aLeft = ax - margin;
        float aRight = ax + aw + margin;
        float aBottom = ay - margin;
        float aTop = ay + ah + margin;
        float bLeft = bx;
        float bRight = bx + bw;
        float bBottom = by;
        float bTop = by + bh;
        return (aLeft < bRight) && (aRight > bLeft) && (aBottom < bTop) && (aTop > bBottom);
    }

    private static int q5(float value) {
        return Math.round(value / 5f) * 5;
    }

    private static String stripPdfSuffix(String value) {
        return String.valueOf(value == null ? "" : value).replaceFirst("(?i)\\.pdf$", "");
    }

    private static String sanitizeFieldName(String value) {
        String sanitized = String.valueOf(value == null ? "" : value)
                .replaceAll("[^A-Za-z0-9_]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_+|_+$", "");
        if (sanitized.length() > 48) {
            sanitized = sanitized.substring(0, 48);
        }
        return sanitized.isBlank() ? "document" : sanitized;
    }

    private static String safeText(String value) {
        String text = String.valueOf(value == null ? "" : value).trim();
        return text.isBlank() ? "-" : text;
    }

    private static String safeMessage(Throwable error) {
        String message = error == null ? "" : error.getMessage();
        return message == null || message.isBlank() ? "nepoznata greska" : message;
    }

    public record SignedPdf(
            byte[] bytes,
            String fieldName,
            String signingMode,
            int page,
            String algorithm,
            String keyAlgorithm,
            String signerOib,
            String signerCommonName
    ) {
    }

    public record SignatureAppearanceMetadata(
            String signerName,
            String signerTitle,
            String roleLabel,
            String signerOib,
            String organization
    ) {
        public static SignatureAppearanceMetadata empty() {
            return new SignatureAppearanceMetadata("", "", "", "", "");
        }
    }

    private record Glyph(String text, float x, float y) {
    }

    private record Match(int page, float x, float y, String keyword) {
    }

    private record SignedSpot(String fieldName, int page, float x, float y, float width, float height, String subjectCn) {
    }
}
