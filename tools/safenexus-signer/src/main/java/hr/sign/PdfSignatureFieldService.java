package hr.sign;

import com.itextpdf.forms.PdfAcroForm;
import com.itextpdf.forms.fields.PdfFormField;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfName;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.annot.PdfWidgetAnnotation;
import com.itextpdf.signatures.SignatureUtil;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

public final class PdfSignatureFieldService {
    private static final Pattern SIGN_FIELD_PATTERN = Pattern.compile("^SIGN_[A-Z0-9_]+_\\d{11}$");

    public List<SignatureFieldInfo> listSignatureFields(byte[] pdfBytes) throws Exception {
        List<SignatureFieldInfo> fields = new ArrayList<>();
        try (PdfDocument document = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            PdfAcroForm acroForm = PdfAcroForm.getAcroForm(document, false);
            if (acroForm == null) {
                return fields;
            }

            SignatureUtil signatureUtil = new SignatureUtil(document);
            Set<String> signedNames = new HashSet<>(signatureUtil.getSignatureNames());
            for (Map.Entry<String, PdfFormField> entry : acroForm.getFormFields().entrySet()) {
                String fieldName = entry.getKey();
                PdfFormField field = entry.getValue();
                boolean signatureField = PdfName.Sig.equals(field.getFormType())
                        || signedNames.contains(fieldName)
                        || fieldName.toUpperCase(Locale.ROOT).startsWith("SIGN_");
                if (!signatureField) {
                    continue;
                }

                List<PdfWidgetAnnotation> widgets = field.getWidgets();
                if (widgets == null || widgets.isEmpty()) {
                    fields.add(new SignatureFieldInfo(fieldName, 0, 0, 0, 0, 0,
                            signedNames.contains(fieldName) ? "already_signed" : "unknown"));
                    continue;
                }

                PdfWidgetAnnotation widget = widgets.get(0);
                Rectangle rectangle = widget.getRectangle() == null ? null : widget.getRectangle().toRectangle();
                int page = 0;
                try {
                    if (widget.getPage() != null) {
                        page = document.getPageNumber(widget.getPage());
                    }
                } catch (Exception ignored) {
                    page = 0;
                }

                String status = signedNames.contains(fieldName)
                        ? "already_signed"
                        : rectangle == null || page <= 0 ? "unknown" : "available";
                fields.add(new SignatureFieldInfo(
                        fieldName,
                        page,
                        rectangle == null ? 0 : rectangle.getX(),
                        rectangle == null ? 0 : rectangle.getY(),
                        rectangle == null ? 0 : rectangle.getWidth(),
                        rectangle == null ? 0 : rectangle.getHeight(),
                        status
                ));
            }
        }
        return fields;
    }

    public Optional<SignatureFieldInfo> findMatchingField(
            List<SignatureFieldInfo> fields,
            String preferredField,
            String role,
            String oib
    ) {
        String preferred = normalizeFieldName(preferredField);
        if (!preferred.isBlank()) {
            Optional<SignatureFieldInfo> explicit = findByName(fields, preferred);
            if (explicit.isPresent()) {
                return explicit;
            }
        }

        String standard = buildStandardFieldName(role, oib);
        if (!standard.isBlank()) {
            Optional<SignatureFieldInfo> byStandard = findByName(fields, standard);
            if (byStandard.isPresent()) {
                return byStandard;
            }
        }

        String normalizedOib = normalizeOib(oib);
        if (!normalizedOib.isBlank()) {
            return fields.stream()
                    .filter(field -> field.fieldName().endsWith("_" + normalizedOib))
                    .findFirst();
        }

        return Optional.empty();
    }

    public String buildStandardFieldName(String role, String oib) {
        String normalizedOib = normalizeOib(oib);
        if (normalizedOib.isBlank()) {
            return "";
        }
        String normalizedRole = String.valueOf(role == null || role.isBlank() ? "ZNR" : role)
                .trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        return "SIGN_" + (normalizedRole.isBlank() ? "ZNR" : normalizedRole) + "_" + normalizedOib;
    }

    public boolean looksLikeStandardField(String fieldName) {
        return SIGN_FIELD_PATTERN.matcher(normalizeFieldName(fieldName)).matches();
    }

    private Optional<SignatureFieldInfo> findByName(List<SignatureFieldInfo> fields, String fieldName) {
        return fields.stream()
                .filter(field -> normalizeFieldName(field.fieldName()).equals(fieldName))
                .findFirst();
    }

    private static String normalizeFieldName(String value) {
        return String.valueOf(value == null ? "" : value).trim().toUpperCase(Locale.ROOT);
    }

    private static String normalizeOib(String value) {
        String digits = String.valueOf(value == null ? "" : value).replaceAll("\\D", "");
        return digits.matches("\\d{11}") ? digits : "";
    }

    public record SignatureFieldInfo(
            String fieldName,
            int page,
            float x,
            float y,
            float width,
            float height,
            String status
    ) {
    }
}
