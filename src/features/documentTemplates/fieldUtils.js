import {
  DOCUMENT_TEMPLATE_FIELD_TYPE_OPTIONS,
  normalizeDocumentTemplateFieldHeight,
  normalizeDocumentTemplateFieldLayoutWidth,
} from "../../safetyModel.js";

export const DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_OPTIONS = [
  { value: "title", label: "Titula" },
  { value: "oib", label: "OIB" },
  { value: "type", label: "Vrsta ispita" },
  { value: "data1", label: "Podatak 1" },
  { value: "data2", label: "Podatak 2" },
  { value: "data3", label: "Podatak 3" },
  { value: "passedOn", label: "Datum polaganja" },
];

const DOCUMENT_TEMPLATE_DEFAULT_SIGNATURE_META_FIELDS = DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_OPTIONS
  .map((option) => option.value);
const DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_ALIASES = new Map([
  ["classcode", "data1"],
  ["class_code", "data1"],
  ["urbroj", "data2"],
  ["e_broj", "data3"],
  ["ebroj", "data3"],
  ["passedon", "passedOn"],
  ["passed_on", "passedOn"],
  ["passed-on", "passedOn"],
]);

export const DOCUMENT_TEMPLATE_SPECIAL_FIELD_TYPES = new Set([
  "chapter",
  "page_break",
  "system_description",
  "qualified_inspectors",
  "sketch_upload",
  "image_upload",
  "legal_list",
  "equipment_list",
  "measurement_table",
  "inspector_signature",
  "authorization_holder_signature",
  "digital_signature",
]);

export const DOCUMENT_TEMPLATE_PERSON_SIGNATURE_FIELD_TYPES = new Set([
  "qualified_inspectors",
  "inspector_signature",
  "authorization_holder_signature",
]);

export const DOCUMENT_TEMPLATE_REQUIRED_TOGGLE_FIELD_TYPES = new Set([
  "system_description",
  "text",
  "longtext",
  "dropdown",
  "date",
  "number",
  "legal_list",
  "equipment_list",
]);

export const DOCUMENT_TEMPLATE_RUNTIME_AI_WRITABLE_FIELD_TYPES = new Set([
  "system_description",
  "text",
  "longtext",
  "dropdown",
  "date",
  "number",
  "checkbox",
  "toggle",
]);

export const DOCUMENT_TEMPLATE_MEDIA_FIELD_TYPES = new Set([
  "sketch_upload",
  "image_upload",
]);

export const DOCUMENT_TEMPLATE_RUNTIME_FORCE_FULL_WIDTH_TYPES = new Set([
  "measurement_table",
]);

export const DOCUMENT_TEMPLATE_FIELD_WIDTH_SPANS = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
};

export const DOCUMENT_TEMPLATE_LONGTEXT_HEIGHT_OPTIONS = Array.from({ length: 10 }, (_, index) => {
  const rows = index + 3;
  return {
    value: String(rows),
    label: `${rows} red${rows === 1 ? "" : rows >= 2 && rows <= 4 ? "a" : "ova"}`,
  };
});

export const DOCUMENT_TEMPLATE_TEXT_LIST_STYLE_OPTIONS = [
  { value: "none", label: "Bez bulleta" },
  { value: "bullet", label: "Točke" },
  { value: "dash", label: "Crtice" },
];

export const DOCUMENT_TEMPLATE_HTML_STYLE_ALIGN_OPTIONS = [
  { value: "left", label: "Lijevo" },
  { value: "center", label: "Sredina" },
  { value: "right", label: "Desno" },
];

export const DOCUMENT_TEMPLATE_HTML_STYLE_TONE_OPTIONS = [
  { value: "default", label: "Standard" },
  { value: "soft", label: "Nježno" },
  { value: "outline", label: "Okvir" },
  { value: "plain", label: "Bez okvira" },
];

export const DOCUMENT_TEMPLATE_HTML_STYLE_TEXT_SIZE_OPTIONS = [
  { value: "small", label: "Malo" },
  { value: "normal", label: "Normalno" },
  { value: "large", label: "Veliko" },
];

export const DOCUMENT_TEMPLATE_SYSTEM_DESCRIPTION_LINE_OPTIONS = Array.from({ length: 8 }, (_, index) => {
  const rows = index + 1;
  return {
    value: String(rows),
    label: `${rows} red${rows === 1 ? "" : rows >= 2 && rows <= 4 ? "a" : "ova"}`,
  };
});

function getFieldOptionLabel(options, value, fallback = "") {
  const normalized = String(value ?? "");
  const match = options.find((option) => String(option.value ?? "") === normalized);
  return match?.label ?? fallback ?? normalized;
}

export function getDocumentTemplateFieldTypeLabel(value) {
  return getFieldOptionLabel(DOCUMENT_TEMPLATE_FIELD_TYPE_OPTIONS, value || "text", "Tekst");
}

export function isDocumentTemplateSpecialFieldType(value) {
  return DOCUMENT_TEMPLATE_SPECIAL_FIELD_TYPES.has(String(value || "").trim().toLowerCase());
}

export function isDocumentTemplatePersonSignatureFieldType(value) {
  return DOCUMENT_TEMPLATE_PERSON_SIGNATURE_FIELD_TYPES.has(String(value || "").trim().toLowerCase());
}

export function isDocumentTemplateRequiredToggleFieldType(value) {
  return DOCUMENT_TEMPLATE_REQUIRED_TOGGLE_FIELD_TYPES.has(String(value || "").trim().toLowerCase());
}

export function getDocumentTemplateRequiredToggleLabel(type = "text") {
  const normalizedType = String(type || "text").trim().toLowerCase();
  if (normalizedType === "legal_list" || normalizedType === "equipment_list") {
    return "Potrebno odabrati barem jedan";
  }
  return "Obavezno polje";
}

export function normalizeDocumentTemplateTextListStyleLocal(value = "") {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return DOCUMENT_TEMPLATE_TEXT_LIST_STYLE_OPTIONS.some((option) => option.value === normalizedValue)
    ? normalizedValue
    : "none";
}

export function normalizeDocumentTemplateHtmlStyleDraft(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const align = String(source.align || "").trim().toLowerCase();
  const tone = String(source.tone || "").trim().toLowerCase();
  const textSize = String(source.textSize || "").trim().toLowerCase();

  return {
    align: DOCUMENT_TEMPLATE_HTML_STYLE_ALIGN_OPTIONS.some((option) => option.value === align) ? align : "left",
    tone: DOCUMENT_TEMPLATE_HTML_STYLE_TONE_OPTIONS.some((option) => option.value === tone) ? tone : "default",
    textSize: DOCUMENT_TEMPLATE_HTML_STYLE_TEXT_SIZE_OPTIONS.some((option) => option.value === textSize) ? textSize : "normal",
  };
}

export function isDocumentTemplateTextListStyleField(type = "text") {
  const normalizedType = String(type || "text").trim().toLowerCase();
  return normalizedType === "text" || normalizedType === "longtext";
}

export function normalizeDocumentTemplateSignatureMetaFieldsLocal(values = undefined) {
  if (!Array.isArray(values)) {
    return [...DOCUMENT_TEMPLATE_DEFAULT_SIGNATURE_META_FIELDS];
  }
  const allowedValues = new Set(DOCUMENT_TEMPLATE_DEFAULT_SIGNATURE_META_FIELDS);
  return Array.from(
    new Set(
      values
        .map((value) => {
          const raw = String(value || "").trim();
          if (allowedValues.has(raw)) {
            return raw;
          }
          return DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_ALIASES.get(raw.toLowerCase()) || "";
        })
        .filter(Boolean),
    ),
  );
}

export function isDocumentTemplateFieldWidthEditable(type = "text") {
  const normalizedType = String(type || "text").trim().toLowerCase();
  return !DOCUMENT_TEMPLATE_RUNTIME_FORCE_FULL_WIDTH_TYPES.has(normalizedType);
}

export function getDocumentTemplateRuntimeFieldLayoutWidth(field = {}) {
  const type = String(field?.type || "text").trim().toLowerCase();
  if (DOCUMENT_TEMPLATE_RUNTIME_FORCE_FULL_WIDTH_TYPES.has(type)) {
    return "full";
  }
  return normalizeDocumentTemplateFieldLayoutWidth(field?.layoutWidth, type);
}

export function getDocumentTemplateRuntimeFieldLayoutSpan(field = {}) {
  const width = getDocumentTemplateRuntimeFieldLayoutWidth(field);
  return DOCUMENT_TEMPLATE_FIELD_WIDTH_SPANS[width] || DOCUMENT_TEMPLATE_FIELD_WIDTH_SPANS[3];
}

export function isDocumentTemplateMediaFieldType(value) {
  return DOCUMENT_TEMPLATE_MEDIA_FIELD_TYPES.has(String(value || "").trim().toLowerCase());
}

export function getDocumentTemplateMediaFieldKindLabel(type = "image_upload") {
  return String(type || "").trim().toLowerCase() === "sketch_upload"
    ? "Dokumenti"
    : "Slika";
}

export function getDocumentTemplateMediaFieldAccept(type = "image_upload") {
  return String(type || "").trim().toLowerCase() === "sketch_upload"
    ? "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
    : "image/*";
}

export function isDocumentTemplateMediaFieldMultiple(type = "image_upload") {
  return String(type || "").trim().toLowerCase() === "sketch_upload";
}

export function getDocumentTemplateMediaFieldUploadLabel(type = "image_upload") {
  return isDocumentTemplateMediaFieldMultiple(type) ? "dokumente" : "sliku";
}

export function getDocumentTemplateMediaFieldAllowedLabel(type = "image_upload") {
  return isDocumentTemplateMediaFieldMultiple(type)
    ? "slike, PDF, Word, Excel, CSV ili tekstualne dokumente"
    : "podržane slike";
}

export function isDocumentTemplateMediaFileAllowed(type = "image_upload", file = null) {
  if (!(file instanceof File)) {
    return false;
  }

  const safeType = String(type || "").trim().toLowerCase();
  if (safeType === "sketch_upload") {
    const fileType = String(file.type || "").trim().toLowerCase();
    const fileName = String(file.name || "").trim();
    return String(file.type || "").startsWith("image/")
      || /^(application\/pdf|text\/plain|text\/csv)$/i.test(fileType)
      || /spreadsheet|wordprocessingml|msword|excel/i.test(fileType)
      || /\.(pdf|docx?|xlsx?|csv|txt)$/i.test(fileName);
  }

  return String(file.type || "").startsWith("image/");
}

export function getDocumentTemplateBuilderWidthPercent(field = {}) {
  const widthValue = String(getDocumentTemplateRuntimeFieldLayoutWidth(field) || "9").trim().toLowerCase();
  if (widthValue === "full") {
    return "100%";
  }
  const numericWidth = Number.parseInt(widthValue, 10);
  if (!Number.isFinite(numericWidth) || numericWidth <= 0) {
    return "100%";
  }
  return `${Math.min(100, Math.max(1, (numericWidth / 9) * 100))}%`;
}

export function getDocumentTemplateBuilderWidthMetaLabel(value = "", type = "text") {
  const normalizedWidth = normalizeDocumentTemplateFieldLayoutWidth(value, type);
  if (!isDocumentTemplateFieldWidthEditable(type) || normalizedWidth === "9") {
    return normalizedWidth === "9" ? "Puna širina" : `Širina ${normalizedWidth} / 9`;
  }
  return `Širina ${normalizedWidth} / 9`;
}

export function isDocumentTemplateFieldHeightEditable(type = "text") {
  const normalizedType = String(type || "text").trim().toLowerCase();
  return normalizedType !== "chapter"
    && normalizedType !== "measurement_table"
    && normalizedType !== "page_break";
}

export function getDocumentTemplateBuilderHeightConfig(type = "text") {
  const normalizedType = String(type || "text").trim().toLowerCase();
  if (normalizedType === "longtext") {
    return {
      min: 3,
      max: 18,
      defaultValue: 4,
      pixelStep: 28,
      baseHeight: 120,
      unitHeight: 28,
      labelSuffix: "reda",
    };
  }
  return {
    min: 0,
    max: 16,
    defaultValue: 4,
    pixelStep: 24,
    baseHeight: 64,
    unitHeight: 22,
    labelSuffix: "",
  };
}

export function getDocumentTemplateBuilderFieldHeightValue(field = {}, { preserveAuto = false } = {}) {
  const type = String(field?.type || "text").trim().toLowerCase();
  if (!isDocumentTemplateFieldHeightEditable(type)) {
    return 0;
  }
  const normalizedValue = normalizeDocumentTemplateFieldHeight(field?.fieldHeight, type);
  if (preserveAuto && normalizedValue <= 0 && type !== "longtext") {
    return 0;
  }
  if (normalizedValue > 0) {
    return normalizedValue;
  }
  return getDocumentTemplateBuilderHeightConfig(type).defaultValue;
}

export function getDocumentTemplateBuilderFieldHeightPx(field = {}, { preserveAuto = true } = {}) {
  const type = String(field?.type || "text").trim().toLowerCase();
  if (!isDocumentTemplateFieldHeightEditable(type)) {
    return 0;
  }
  const config = getDocumentTemplateBuilderHeightConfig(type);
  const units = getDocumentTemplateBuilderFieldHeightValue(field, { preserveAuto });
  if (units <= 0) {
    return 0;
  }
  return Math.max(config.baseHeight, units * config.unitHeight);
}

export function isDocumentTemplatePreviewValueResizeEnabled(type = "text") {
  const normalizedType = String(type || "text").trim().toLowerCase();
  return normalizedType === "text"
    || normalizedType === "longtext"
    || normalizedType === "number"
    || normalizedType === "date";
}

export function getDocumentTemplateBuilderPreviewValueHeightPx(field = {}, { preserveAuto = true } = {}) {
  const type = String(field?.type || "text").trim().toLowerCase();
  if (!isDocumentTemplatePreviewValueResizeEnabled(type)) {
    return 0;
  }
  const fieldHeight = getDocumentTemplateBuilderFieldHeightPx(field, { preserveAuto });
  if (fieldHeight <= 0) {
    return 0;
  }
  return Math.max(type === "longtext" ? 120 : 52, fieldHeight - 54);
}

export function getDocumentTemplateBuilderHeightMetaLabel(field = {}) {
  const type = String(field?.type || "text").trim().toLowerCase();
  if (!isDocumentTemplateFieldHeightEditable(type)) {
    return "";
  }
  const normalizedValue = normalizeDocumentTemplateFieldHeight(field?.fieldHeight, type);
  if (normalizedValue <= 0 && type !== "longtext") {
    return "Auto visina";
  }
  const resolvedValue = normalizedValue > 0
    ? normalizedValue
    : getDocumentTemplateBuilderHeightConfig(type).defaultValue;
  const suffix = getDocumentTemplateBuilderHeightConfig(type).labelSuffix;
  return suffix ? `Visina ${resolvedValue} ${suffix}` : `Visina ${resolvedValue}`;
}
