package hr.sign;

public class SignatureBridgeException extends Exception {
    private final String code;
    private final String documentId;

    public SignatureBridgeException(String code, String message) {
        this(code, message, "");
    }

    public SignatureBridgeException(String code, String message, String documentId) {
        super(message);
        this.code = code == null || code.isBlank() ? "SIGNATURE_BRIDGE_ERROR" : code;
        this.documentId = documentId == null ? "" : documentId;
    }

    public String code() {
        return code;
    }

    public String documentId() {
        return documentId;
    }
}
