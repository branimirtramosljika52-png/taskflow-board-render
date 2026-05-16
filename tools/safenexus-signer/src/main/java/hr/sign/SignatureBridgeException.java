package hr.sign;

public class SignatureBridgeException extends Exception {
    private final String code;
    private final String documentId;
    private final String technicalMessage;

    public SignatureBridgeException(String code, String message) {
        this(code, message, "", "");
    }

    public SignatureBridgeException(String code, String message, String documentId) {
        this(code, message, documentId, "");
    }

    public SignatureBridgeException(String code, String message, String documentId, String technicalMessage) {
        super(message);
        this.code = code == null || code.isBlank() ? "SIGNATURE_BRIDGE_ERROR" : code;
        this.documentId = documentId == null ? "" : documentId;
        this.technicalMessage = technicalMessage == null ? "" : technicalMessage;
    }

    public SignatureBridgeException(String code, String message, String documentId, Throwable cause) {
        super(message, cause);
        this.code = code == null || code.isBlank() ? "SIGNATURE_BRIDGE_ERROR" : code;
        this.documentId = documentId == null ? "" : documentId;
        this.technicalMessage = cause == null
                ? ""
                : cause.getClass().getName() + ": " + (cause.getMessage() == null ? "" : cause.getMessage());
    }

    public String code() {
        return code;
    }

    public String documentId() {
        return documentId;
    }

    public String technicalMessage() {
        return technicalMessage;
    }
}
