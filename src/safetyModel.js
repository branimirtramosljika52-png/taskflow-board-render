import { normalizeMeasurementCellFormat } from "./measurementFormatting.js";
import { normalizeRichTextHtml, richTextHtmlToPlainText } from "./utils/richText.js";

const MEASUREMENT_COLUMN_MIN_WIDTH = 32;

export const WORK_ORDER_STATUS_OPTIONS = [
  { value: "Otvoreni RN", label: "Otvoreni RN" },
  { value: "Gotov RN", label: "Gotov RN" },
  { value: "Ovjeren RN", label: "Ovjeren RN" },
  { value: "Fakturiran RN", label: "Fakturiran RN" },
  { value: "Storno RN", label: "Storno RN" },
];

export const PRIORITY_OPTIONS = [
  { value: "Urgent", label: "Urgent" },
  { value: "High", label: "High" },
  { value: "Normal", label: "Normal" },
  { value: "Niski prioritet", label: "Niski prioritet" },
  { value: "Bez prioriteta", label: "Bez prioriteta" },
];

export const REMINDER_STATUS_OPTIONS = [
  { value: "active", label: "Aktivan" },
  { value: "snoozed", label: "Odgoden" },
  { value: "done", label: "Gotov" },
];

export const FIELD_INQUIRY_STATUS_OPTIONS = [
  { value: "inquiry", label: "Upit" },
  { value: "next_week", label: "Iduci tjedan" },
  { value: "tentative", label: "Tentativno" },
  { value: "confirmed", label: "Potvrdeno" },
  { value: "rejected", label: "Odbijeno" },
  { value: "converted", label: "Pretvoreno u RN" },
];

export const TODO_TASK_STATUS_OPTIONS = [
  { value: "open", label: "Novo" },
  { value: "in_progress", label: "U radu" },
  { value: "waiting", label: "Ceka odgovor" },
  { value: "done", label: "Zavrseno" },
];

export const OFFER_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "sent", label: "Poslano" },
  { value: "accepted", label: "Prihvaceno" },
  { value: "rejected", label: "Odbijeno" },
];

export const PURCHASE_ORDER_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "received", label: "Zaprimljena" },
  { value: "issued", label: "Poslana" },
  { value: "confirmed", label: "Potvrdena" },
  { value: "closed", label: "Zatvorena" },
];

export const PUBLIC_PROCUREMENT_STATUS_OPTIONS = [
  { value: "open", label: "Otvoreno" },
  { value: "sent", label: "Poslano" },
  { value: "accepted", label: "Prihvaćeno" },
  { value: "rejected", label: "Odbijeno" },
];

export const RISK_ASSESSMENT_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "in_review", label: "U pregledu" },
  { value: "active", label: "Aktivna" },
  { value: "archived", label: "Arhivirana" },
];

export const JOB_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "active", label: "Aktivan" },
  { value: "archived", label: "Arhiviran" },
];

export const CONTRACT_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "pending_signature", label: "Na potpisu" },
  { value: "active", label: "Aktivan" },
  { value: "expired", label: "Istekao" },
  { value: "terminated", label: "Raskinut" },
];

export const CONTRACT_TEMPLATE_STATUS_OPTIONS = [
  { value: "active", label: "Aktivan" },
  { value: "draft", label: "Skica" },
  { value: "archived", label: "Arhiviran" },
];

export const DRAWING_PROJECT_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "active", label: "Aktivan" },
  { value: "archived", label: "Arhiviran" },
];

export const DRAWING_PROJECT_TYPE_OPTIONS = [
  { value: "evacuation", label: "Plan evakuacije" },
  { value: "floor_plan", label: "Tlocrt" },
  { value: "fire_safety", label: "Protupozarni plan" },
  { value: "technical", label: "Tehnicki crtez" },
  { value: "custom", label: "Custom" },
];

export const VEHICLE_STATUS_OPTIONS = [
  { value: "available", label: "Dostupno" },
  { value: "service", label: "Servis" },
];

export const VEHICLE_RESERVATION_STATUS_OPTIONS = [
  { value: "reserved", label: "Rezervacija" },
  { value: "checked_out", label: "Na terenu" },
  { value: "completed", label: "Zavrseno" },
  { value: "cancelled", label: "Otkazano" },
];

export const CLIENT_PORTAL_RECORD_TYPE_OPTIONS = [
  { value: "worker", label: "Radnici" },
  { value: "ppe_assignment", label: "OZO zaduzenja" },
  { value: "fire_extinguisher", label: "Vatrogasni aparati" },
  { value: "defect_report", label: "Nedostaci / prijave" },
  { value: "internal_inspection", label: "Unutarnji nadzori" },
  { value: "alcohol_test", label: "Alkotest" },
  { value: "document", label: "Dokumenti" },
  { value: "training_import", label: "Import osposobljavanja" },
  { value: "vehicle", label: "Vozni park" },
  { value: "deadline", label: "Ostali rokovi" },
];

export const CLIENT_PORTAL_RECORD_STATUS_OPTIONS = [
  { value: "active", label: "Aktivno" },
  { value: "attention", label: "Paznja" },
  { value: "done", label: "Gotovo" },
  { value: "inactive", label: "Neaktivno" },
];

export const LEGAL_FRAMEWORK_STATUS_OPTIONS = [
  { value: "active", label: "Aktivan" },
  { value: "inactive", label: "Neaktivan" },
];

export const RULEBOOK_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "active", label: "Aktivan" },
  { value: "review", label: "U reviziji" },
  { value: "archived", label: "Arhiviran" },
];

export const RULEBOOK_TYPE_OPTIONS = [
  { value: "znr", label: "Pravilnik o zaštiti na radu" },
  { value: "fire", label: "Pravilnik o zaštiti od požara" },
  { value: "alcohol_drugs", label: "Pravilnik o korištenju alkohola i opojnih sredstava" },
  { value: "chemicals", label: "Pravilnik o korištenju kemikalija" },
  { value: "training_program", label: "Program osposobljavanja" },
  { value: "custom", label: "Drugi pravilnik" },
];

export const SERVICE_CATALOG_STATUS_OPTIONS = [
  { value: "active", label: "Aktivna" },
  { value: "inactive", label: "Neaktivna" },
];

export const SERVICE_CATALOG_TYPE_OPTIONS = [
  { value: "inspection", label: "Ispitivanje" },
  { value: "znr", label: "ZNR" },
  { value: "other", label: "Ostalo" },
];

export const MEASUREMENT_EQUIPMENT_KIND_OPTIONS = [
  { value: "measurement", label: "Mjerna oprema" },
  { value: "testing", label: "Ispitna oprema" },
  { value: "combined", label: "Mjerna + ispitna" },
];

export const MEASUREMENT_EQUIPMENT_ACTIVITY_TYPE_OPTIONS = [
  { value: "pregled", label: "Pregled" },
  { value: "umjeravanje", label: "Umjeravanje" },
  { value: "servis", label: "Servis" },
];

export const ABSENCE_TYPE_OPTIONS = [
  { value: "annual_leave", label: "Godišnji odmor", group: "request" },
  { value: "personal_leave", label: "Plaćeni dopust", group: "request" },
  { value: "unpaid_leave", label: "Neplaćeni dopust", group: "request" },
  { value: "exam_leave", label: "Polaganje ispita", group: "request" },
  { value: "other_leave", label: "Drugi dopust", group: "request" },
  { value: "sick_leave", label: "Bolovanje", group: "medical" },
  { value: "pregnancy_care", label: "Čuvanje trudnoće", group: "medical" },
  { value: "maternity_leave", label: "Porodiljni dopust", group: "medical" },
  { value: "childbirth_leave", label: "Rodiljni dopust", group: "medical" },
  { value: "parental_leave", label: "Roditeljski dopust", group: "medical" },
  { value: "other_medical_leave", label: "Drugi opravdani izostanak", group: "medical" },
];

export const ABSENCE_STATUS_OPTIONS = [
  { value: "pending", label: "Na čekanju" },
  { value: "approved", label: "Odobreno" },
  { value: "rejected", label: "Odbijeno" },
  { value: "cancelled", label: "Otkazano" },
];

export const PERSON_TRAINING_TYPE_OPTIONS = [
  { value: "safe_work", label: "Rad na siguran način", shortLabel: "ZNR" },
  { value: "fire_initial", label: "Početno gašenje požara", shortLabel: "Požar" },
  { value: "flammable_storage", label: "Skladištenje zapaljivih tekućina i plinova", shortLabel: "Zapaljivo" },
  { value: "adr", label: "ADR", shortLabel: "ADR" },
  { value: "medical_exam", label: "Liječnički pregled", shortLabel: "Liječnički" },
  { value: "medical_fitness_certificate", label: "Uvjerenje o zdravstvenoj sposobnosti za rad", shortLabel: "Zdravstvena" },
  { value: "vision_exam", label: "Pregled vida", shortLabel: "Vid" },
  { value: "professional_training", label: "Stručno osposobljavanje", shortLabel: "Stručno" },
];

export const PERSON_TRAINING_STATUS_OPTIONS = [
  { value: "missing", label: "Nema podatka" },
  { value: "valid", label: "Važeće" },
  { value: "expiring", label: "Uskoro ističe" },
  { value: "expired", label: "Isteklo" },
  { value: "not_required", label: "Nije potrebno" },
];

export const DOCUMENT_TEMPLATE_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "active", label: "Aktivan" },
  { value: "archived", label: "Arhiviran" },
];

export const DOCUMENT_TEMPLATE_TYPE_OPTIONS = [
  { value: "Ponuda", label: "Ponuda" },
  { value: "Radni nalog", label: "Radni nalog" },
  { value: "Zapisnik", label: "Zapisnik" },
  { value: "IS ZNR", label: "IS ZNR" },
];

export const DOCUMENT_TEMPLATE_SECTION_TYPE_OPTIONS = [
  { value: "cover", label: "Naslovnica" },
  { value: "rich_text", label: "Tekstualni blok" },
  { value: "legal_list", label: "Popis propisa" },
  { value: "equipment_list", label: "Popis opreme" },
  { value: "measurement_table", label: "Excel tablica" },
  { value: "signatures", label: "Potpisi" },
];

export const DOCUMENT_TEMPLATE_FIELD_TYPE_OPTIONS = [
  { value: "chapter", label: "Poglavlje" },
  { value: "system_description", label: "Opis sustava" },
  { value: "page_break", label: "Nova A4 stranica" },
  { value: "text", label: "Tekst" },
  { value: "longtext", label: "Dugi tekst" },
  { value: "dropdown", label: "Padajući izbor" },
  { value: "date", label: "Datum" },
  { value: "number", label: "Broj" },
  { value: "checkbox", label: "Checkbox" },
  { value: "toggle", label: "Toggle" },
  { value: "qualified_inspectors", label: "Ispitivači" },
  { value: "sketch_upload", label: "Dodaj dokumente" },
  { value: "image_upload", label: "Slika" },
  { value: "legal_list", label: "Popis propisa" },
  { value: "equipment_list", label: "Popis opreme" },
  { value: "measurement_table", label: "Excel tablica" },
  { value: "inspector_signature", label: "Potpis ispitivača" },
  { value: "authorization_holder_signature", label: "Potpis nositelja" },
  { value: "digital_signature", label: "Digitalni potpis" },
];

export const DOCUMENT_TEMPLATE_FIELD_WIDTH_OPTIONS = [
  { value: "1", label: "1 polje" },
  { value: "2", label: "2 polja" },
  { value: "3", label: "3 polja" },
  { value: "4", label: "4 polja" },
  { value: "5", label: "5 polja" },
  { value: "6", label: "6 polja" },
  { value: "7", label: "7 polja" },
  { value: "8", label: "8 polja" },
  { value: "9", label: "9 polja" },
];

const DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_VALUES = ["title", "oib", "type", "data1", "data2", "data3", "passedOn"];
const DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_SET = new Set(DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_VALUES);
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
const DOCUMENT_TEMPLATE_TEXT_LIST_STYLE_VALUES = new Set(["none", "bullet", "dash"]);
const DOCUMENT_TEMPLATE_HTML_STYLE_ALIGN_VALUES = new Set(["left", "center", "right"]);
const DOCUMENT_TEMPLATE_HTML_STYLE_TONE_VALUES = new Set(["default", "soft", "outline", "plain"]);
const DOCUMENT_TEMPLATE_HTML_STYLE_TEXT_SIZE_VALUES = new Set(["small", "normal", "large"]);

function normalizeDocumentTemplateHtmlStyle(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const align = normalizeText(source.align).toLowerCase();
  const tone = normalizeText(source.tone).toLowerCase();
  const textSize = normalizeText(source.textSize).toLowerCase();

  return {
    align: DOCUMENT_TEMPLATE_HTML_STYLE_ALIGN_VALUES.has(align) ? align : "left",
    tone: DOCUMENT_TEMPLATE_HTML_STYLE_TONE_VALUES.has(tone) ? tone : "default",
    textSize: DOCUMENT_TEMPLATE_HTML_STYLE_TEXT_SIZE_VALUES.has(textSize) ? textSize : "normal",
  };
}

function normalizeDocumentTemplateSignatureMetaFields(values = undefined) {
  if (!Array.isArray(values)) {
    return [...DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_VALUES];
  }

  return Array.from(
    new Set(
      values
        .map((value) => {
          const raw = normalizeText(value);
          if (DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_SET.has(raw)) {
            return raw;
          }
          return DOCUMENT_TEMPLATE_SIGNATURE_META_FIELD_ALIASES.get(raw.toLowerCase()) || "";
        })
        .filter(Boolean),
    ),
  );
}

function normalizeDocumentTemplateTextListStyle(value = "") {
  const normalizedValue = normalizeText(value).toLowerCase();
  return DOCUMENT_TEMPLATE_TEXT_LIST_STYLE_VALUES.has(normalizedValue) ? normalizedValue : "none";
}

export const LEARNING_TEST_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "active", label: "Aktivan" },
  { value: "archived", label: "Arhiviran" },
];

const DOCUMENT_TEMPLATE_FULL_WIDTH_FIELD_TYPES = new Set([
  "chapter",
  "system_description",
  "longtext",
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

export function getDocumentTemplateDefaultFieldLayoutWidth(type = "text") {
  const normalizedType = String(type || "text").trim().toLowerCase();
  if (DOCUMENT_TEMPLATE_FULL_WIDTH_FIELD_TYPES.has(normalizedType)) {
    return "9";
  }
  if (normalizedType === "checkbox" || normalizedType === "toggle") {
    return "2";
  }
  return "3";
}

export function normalizeDocumentTemplateFieldLayoutWidth(value = "", type = "text") {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (DOCUMENT_TEMPLATE_FIELD_WIDTH_OPTIONS.some((option) => option.value === normalizedValue)) {
    return normalizedValue;
  }
  const legacyMap = {
    quarter: "2",
    third: "3",
    half: "3",
    "two-thirds": "6",
  };
  if (legacyMap[normalizedValue]) {
    return legacyMap[normalizedValue];
  }
  if (normalizedValue === "full") {
    return getDocumentTemplateDefaultFieldLayoutWidth(type);
  }
  return getDocumentTemplateDefaultFieldLayoutWidth(type);
}

export function normalizeDocumentTemplateFieldHeight(value = 0, type = "text") {
  const normalizedType = String(type || "text").trim().toLowerCase();
  if (normalizedType === "measurement_table" || normalizedType === "page_break") {
    return 0;
  }
  if (normalizedType === "longtext") {
    return Math.max(3, Math.min(18, Math.round(normalizeFiniteNumber(value, 4))));
  }
  return Math.max(0, Math.min(16, Math.round(normalizeFiniteNumber(value, 0))));
}

export const OFFER_SERVICE_LINE_SUGGESTIONS = [
  "Fixed Plan",
  "Hybrid Plan",
  "One-Time Service",
  "Per Employee Plan",
];

export const DASHBOARD_WIDGET_SOURCE_OPTIONS = [
  { value: "work_orders", label: "Radni nalozi" },
  { value: "reminders", label: "Reminders" },
  { value: "todo_tasks", label: "ToDo" },
  { value: "locations", label: "Lokacije" },
];

export const DASHBOARD_WIDGET_VISUALIZATION_OPTIONS = [
  { value: "metric", label: "KPI kartica" },
  { value: "donut", label: "Donut graf" },
  { value: "bar", label: "Bar chart" },
  { value: "list", label: "Lista" },
];

export const DASHBOARD_WIDGET_SIZE_OPTIONS = [
  { value: "small", label: "Mala" },
  { value: "medium", label: "Srednja" },
  { value: "large", label: "Velika" },
  { value: "full", label: "Puna sirina" },
];

export const DASHBOARD_GRID_COLUMN_COUNT = 12;

export const DASHBOARD_WIDGET_HEIGHT_OPTIONS = [
  { value: "2", label: "Niska" },
  { value: "3", label: "Standard" },
  { value: "4", label: "Visa" },
  { value: "5", label: "Velika" },
  { value: "6", label: "XL" },
];

export const DASHBOARD_WIDGET_DATE_WINDOW_OPTIONS = [
  { value: "all", label: "Bez ogranicenja" },
  { value: "overdue", label: "Kasni" },
  { value: "7d", label: "Sljedećih 7 dana" },
  { value: "14d", label: "Sljedećih 14 dana" },
  { value: "30d", label: "Sljedećih 30 dana" },
];

export const DASHBOARD_WIDGET_DEFINITIONS = {
  work_orders: {
    label: "Radni nalozi",
    metrics: [
      { value: "total", label: "Svi radni nalozi" },
      { value: "active", label: "Otvoreni RN" },
      { value: "urgent", label: "Urgent RN" },
      { value: "due_7d", label: "Rok 7 dana" },
      { value: "overdue", label: "Istek / kasnjenje" },
      { value: "completed", label: "Zatvoreni RN" },
      { value: "factured", label: "Fakturirani RN" },
      { value: "invoice_total", label: "Iznos faktura" },
    ],
    groupings: [
      { value: "status", label: "Status RN" },
      { value: "executor_status", label: "Ucinkovitost ispitivaca" },
      { value: "invoice_status", label: "Iznos po statusu" },
      { value: "invoice_executor", label: "Iznos po izvrsitelju" },
      { value: "invoice_company", label: "Iznos po tvrtki" },
      { value: "priority", label: "Prioritet" },
      { value: "region", label: "Regija" },
      { value: "company", label: "Tvrtka" },
      { value: "executor", label: "Izvršitelj" },
      { value: "tag", label: "Tag" },
    ],
    lists: [
      { value: "status_groups", label: "Broj RN po statusu" },
      { value: "upcoming_due", label: "Sljedeći rokovi" },
      { value: "overdue", label: "RN kojima je istekao rok" },
      { value: "urgent_open", label: "Urgent otvoreni RN" },
      { value: "recent", label: "Nedavno ažurirani RN" },
    ],
  },
  reminders: {
    label: "Reminders",
    metrics: [
      { value: "total", label: "Svi reminders" },
      { value: "active", label: "Aktivni reminders" },
      { value: "today", label: "Danasnji reminders" },
      { value: "overdue", label: "Kasneci reminders" },
      { value: "done", label: "Gotovi reminders" },
    ],
    groupings: [
      { value: "status", label: "Status remindera" },
      { value: "company", label: "Tvrtka" },
      { value: "creator", label: "Kreirao" },
    ],
    lists: [
      { value: "due_soon", label: "Reminderi s rokom" },
      { value: "overdue", label: "Reminderi koji kasne" },
      { value: "latest", label: "Zadnje promjene" },
    ],
  },
  todo_tasks: {
    label: "ToDo",
    metrics: [
      { value: "total", label: "Svi zadaci" },
      { value: "assigned_to_me", label: "Dodijeljeno meni" },
      { value: "created_by_me", label: "Ja sam poslao" },
      { value: "overdue", label: "Kasneci zadaci" },
      { value: "done", label: "Zavrseni zadaci" },
    ],
    groupings: [
      { value: "status", label: "Status zadatka" },
      { value: "priority", label: "Prioritet" },
      { value: "assignee", label: "Izvršitelj" },
      { value: "creator", label: "Posiljatelj" },
    ],
    lists: [
      { value: "assigned_to_me", label: "Moj inbox" },
      { value: "overdue", label: "Kasneci zadaci" },
      { value: "open_items", label: "Otvoreni zadaci" },
      { value: "latest", label: "Nove aktivnosti" },
    ],
  },
  locations: {
    label: "Lokacije",
    metrics: [
      { value: "total", label: "Sve lokacije" },
      { value: "missing_coordinates", label: "Bez koordinata" },
    ],
    groupings: [
      { value: "region", label: "Regija" },
      { value: "company", label: "Tvrtka" },
      { value: "coordinate_state", label: "Stanje koordinata" },
    ],
    lists: [
      { value: "missing_coordinates", label: "Lokacije bez koordinata" },
      { value: "recent", label: "Nedavno ažurirane lokacije" },
    ],
  },
};

const WORK_ORDER_STATUS_SET = new Set(WORK_ORDER_STATUS_OPTIONS.map((option) => option.value));
const PRIORITY_SET = new Set(PRIORITY_OPTIONS.map((option) => option.value));
const REMINDER_STATUS_SET = new Set(REMINDER_STATUS_OPTIONS.map((option) => option.value));
const TODO_TASK_STATUS_SET = new Set(TODO_TASK_STATUS_OPTIONS.map((option) => option.value));
const OFFER_STATUS_SET = new Set(OFFER_STATUS_OPTIONS.map((option) => option.value));
const PURCHASE_ORDER_STATUS_SET = new Set(PURCHASE_ORDER_STATUS_OPTIONS.map((option) => option.value));
const PUBLIC_PROCUREMENT_STATUS_SET = new Set(PUBLIC_PROCUREMENT_STATUS_OPTIONS.map((option) => option.value));
const RISK_ASSESSMENT_STATUS_SET = new Set(RISK_ASSESSMENT_STATUS_OPTIONS.map((option) => option.value));
const CONTRACT_STATUS_SET = new Set(CONTRACT_STATUS_OPTIONS.map((option) => option.value));
const CONTRACT_TEMPLATE_STATUS_SET = new Set(CONTRACT_TEMPLATE_STATUS_OPTIONS.map((option) => option.value));
const VEHICLE_STATUS_SET = new Set(VEHICLE_STATUS_OPTIONS.map((option) => option.value));
const VEHICLE_RESERVATION_STATUS_SET = new Set(VEHICLE_RESERVATION_STATUS_OPTIONS.map((option) => option.value));
const CLIENT_PORTAL_RECORD_STATUS_SET = new Set(CLIENT_PORTAL_RECORD_STATUS_OPTIONS.map((option) => option.value));
const LEGAL_FRAMEWORK_STATUS_SET = new Set(LEGAL_FRAMEWORK_STATUS_OPTIONS.map((option) => option.value));
const RULEBOOK_STATUS_SET = new Set(RULEBOOK_STATUS_OPTIONS.map((option) => option.value));
const RULEBOOK_TYPE_SET = new Set(RULEBOOK_TYPE_OPTIONS.map((option) => option.value));
const SERVICE_CATALOG_STATUS_SET = new Set(SERVICE_CATALOG_STATUS_OPTIONS.map((option) => option.value));
const SERVICE_CATALOG_TYPE_SET = new Set(SERVICE_CATALOG_TYPE_OPTIONS.map((option) => option.value));
const MEASUREMENT_EQUIPMENT_KIND_SET = new Set(MEASUREMENT_EQUIPMENT_KIND_OPTIONS.map((option) => option.value));
const MEASUREMENT_EQUIPMENT_ACTIVITY_TYPE_SET = new Set(MEASUREMENT_EQUIPMENT_ACTIVITY_TYPE_OPTIONS.map((option) => option.value));
const ABSENCE_TYPE_SET = new Set(ABSENCE_TYPE_OPTIONS.map((option) => option.value));
const ABSENCE_STATUS_SET = new Set(ABSENCE_STATUS_OPTIONS.map((option) => option.value));
const DOCUMENT_TEMPLATE_STATUS_SET = new Set(DOCUMENT_TEMPLATE_STATUS_OPTIONS.map((option) => option.value));
const DOCUMENT_TEMPLATE_TYPE_SET = new Set(DOCUMENT_TEMPLATE_TYPE_OPTIONS.map((option) => option.value));
const DOCUMENT_TEMPLATE_SECTION_TYPE_SET = new Set(DOCUMENT_TEMPLATE_SECTION_TYPE_OPTIONS.map((option) => option.value));
const DOCUMENT_TEMPLATE_FIELD_TYPE_SET = new Set(DOCUMENT_TEMPLATE_FIELD_TYPE_OPTIONS.map((option) => option.value));
const ACTIVE_VEHICLE_RESERVATION_STATUSES = new Set(["reserved", "checked_out"]);
const OFFER_LOCATION_SCOPE_SET = new Set(["single", "selection", "all", "none"]);
const PURCHASE_ORDER_DIRECTION_SET = new Set(["incoming", "outgoing"]);
const DASHBOARD_WIDGET_SOURCE_SET = new Set(DASHBOARD_WIDGET_SOURCE_OPTIONS.map((option) => option.value));
const DASHBOARD_WIDGET_VISUALIZATION_SET = new Set(DASHBOARD_WIDGET_VISUALIZATION_OPTIONS.map((option) => option.value));
const DASHBOARD_WIDGET_SIZE_SET = new Set(DASHBOARD_WIDGET_SIZE_OPTIONS.map((option) => option.value));
const DASHBOARD_WIDGET_DATE_WINDOW_SET = new Set(DASHBOARD_WIDGET_DATE_WINDOW_OPTIONS.map((option) => option.value));
const DASHBOARD_WIDGET_LAYOUT_PRESETS = {
  small: { width: 3, height: 2 },
  medium: { width: 4, height: 3 },
  large: { width: 6, height: 4 },
  full: { width: DASHBOARD_GRID_COLUMN_COUNT, height: 4 },
};
const DASHBOARD_WIDGET_MIN_WIDTH = 3;
const DASHBOARD_WIDGET_MIN_HEIGHT = 2;
const DASHBOARD_WIDGET_MAX_HEIGHT = 6;
const PRIORITY_RANK = {
  Urgent: 0,
  High: 1,
  Normal: 2,
  "Niski prioritet": 3,
  "Bez prioriteta": 4,
};
const CLOSED_WORK_ORDER_STATUSES = new Set(["Gotov RN", "Ovjeren RN", "Fakturiran RN", "Storno RN"]);
const REMINDER_STATUS_RANK = {
  active: 0,
  snoozed: 1,
  done: 2,
};
const TODO_TASK_STATUS_RANK = {
  open: 0,
  in_progress: 1,
  waiting: 2,
  done: 3,
};
const OFFER_STATUS_RANK = {
  draft: 0,
  sent: 1,
  accepted: 2,
  rejected: 3,
};
const PURCHASE_ORDER_STATUS_RANK = {
  draft: 0,
  received: 1,
  issued: 2,
  confirmed: 3,
  closed: 4,
};
const PUBLIC_PROCUREMENT_STATUS_RANK = {
  open: 0,
  sent: 1,
  accepted: 2,
  rejected: 3,
  in_progress: 0,
  submitted: 1,
  awarded: 2,
  cancelled: 3,
};
const RISK_ASSESSMENT_STATUS_RANK = {
  draft: 0,
  in_review: 1,
  active: 2,
  archived: 3,
};
const JOB_STATUS_RANK = {
  active: 0,
  draft: 1,
  archived: 2,
};
const CONTRACT_STATUS_RANK = {
  draft: 0,
  pending_signature: 1,
  active: 2,
  expired: 3,
  terminated: 4,
};
const CONTRACT_TEMPLATE_STATUS_RANK = {
  active: 0,
  draft: 1,
  archived: 2,
};
const DRAWING_PROJECT_STATUS_RANK = {
  draft: 0,
  active: 1,
  archived: 2,
};
const LEGAL_FRAMEWORK_STATUS_RANK = {
  active: 0,
  inactive: 1,
};
const RULEBOOK_STATUS_RANK = {
  active: 0,
  review: 1,
  draft: 2,
  archived: 3,
};
const DOCUMENT_TEMPLATE_STATUS_RANK = {
  active: 0,
  draft: 1,
  archived: 2,
};
const VEHICLE_STATUS_RANK = {
  reserved: 0,
  available: 1,
  service: 2,
};
const VEHICLE_RESERVATION_STATUS_RANK = {
  checked_out: 0,
  reserved: 1,
  completed: 2,
  cancelled: 3,
};
const CLIENT_PORTAL_RECORD_TYPE_SET = new Set(CLIENT_PORTAL_RECORD_TYPE_OPTIONS.map((option) => option.value));
const CLIENT_PORTAL_RECORD_STATUS_RANK = {
  attention: 0,
  active: 1,
  done: 2,
  inactive: 3,
};
const ABSENCE_STATUS_RANK = {
  pending: 0,
  approved: 1,
  rejected: 2,
  cancelled: 3,
};
const APPROVAL_ABSENCE_TYPES = new Set(
  ABSENCE_TYPE_OPTIONS.map((option) => option.value),
);

function isoNow() {
  return new Date().toISOString();
}

function todayString() {
  return isoNow().slice(0, 10);
}

function hasOwn(input, key) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeRiskAssessmentRichText(value) {
  return normalizeRichTextHtml(normalizeText(value));
}

function normalizeRiskAssessmentRichTextSearch(value) {
  return richTextHtmlToPlainText(value) || normalizeText(value);
}

function requireText(value, label) {
  const text = normalizeText(value);

  if (!text) {
    throw new Error(`${label} je obavezan.`);
  }

  return text;
}

function normalizeOptionalDate(value) {
  if (!value) {
    return null;
  }

  const raw = normalizeText(value);

  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const croatianDateMatch = raw.match(/^(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{4})\.?$/);
  if (croatianDateMatch) {
    const day = Number.parseInt(croatianDateMatch[1], 10);
    const month = Number.parseInt(croatianDateMatch[2], 10);
    const year = Number.parseInt(croatianDateMatch[3], 10);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);

    if (
      Number.isFinite(day)
      && Number.isFinite(month)
      && Number.isFinite(year)
      && !Number.isNaN(date.getTime())
      && date.getFullYear() === year
      && date.getMonth() === month - 1
      && date.getDate() === day
    ) {
      return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");
    }
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeOptionalDateTime(value) {
  if (!value) {
    return null;
  }

  const raw = normalizeText(value);

  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const raw = normalizeText(value).toLowerCase();

  if (!raw) {
    return fallback;
  }

  if (["1", "true", "da", "yes", "aktivno"].includes(raw)) {
    return true;
  }

  if (["0", "false", "ne", "no", "neaktivno"].includes(raw)) {
    return false;
  }

  return fallback;
}

function normalizeCompanyEmployeeSize(value) {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) {
    return "";
  }

  const folded = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/do\s*49|manje\s*od\s*50|<\s*50/.test(folded)) {
    return "do-49";
  }
  if (/preko\s*50|iznad\s*50|vise\s*od\s*50|50\s*\+|>=\s*50|50plus/.test(folded)) {
    return "preko-50";
  }

  const compact = folded.replace(/[^a-z0-9]/g, "");
  if (["do49", "do49zaposlenih", "manjeod50", "49"].includes(compact)) {
    return "do-49";
  }
  if (["preko50", "iznad50", "viseod50", "50plus", "50zaposlenih", "50"].includes(compact)) {
    return "preko-50";
  }

  return "";
}

function normalizeCompanyManagerLabels(values = []) {
  const source = Array.isArray(values) ? values : [values];
  return Array.from(new Set(
    source
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .map((entry) => normalizeText(entry))
      .filter(Boolean),
  )).slice(0, 24);
}

function normalizeCompanyTemplateAssignments(values = []) {
  const source = Array.isArray(values) ? values : [values];
  const seen = new Set();

  return source
    .map((entry) => (entry && typeof entry === "object" && !Array.isArray(entry) ? entry : {}))
    .map((entry) => {
      const kind = normalizeText(entry.kind || entry.assignmentKind || "");
      const serviceId = normalizeText(entry.serviceId || entry.serviceCatalogId || "");
      const serviceCode = normalizeText(entry.serviceCode || entry.shortLabel || "");
      const serviceName = normalizeText(entry.serviceName || entry.name || "");
      const templateId = normalizeText(entry.templateId || entry.documentTemplateId || "");
      const templateTitle = normalizeText(entry.templateTitle || entry.documentTemplateTitle || "");
      const key = kind === "is_znr"
        ? "kind:is_znr"
        : `service:${serviceId || serviceCode || serviceName}`.toLowerCase();

      if (!templateId || !key || key === "service:") {
        return null;
      }
      if (seen.has(key)) {
        return null;
      }
      seen.add(key);

      return {
        kind: kind === "is_znr" ? "is_znr" : "service",
        serviceId,
        serviceCode,
        serviceName,
        templateId,
        templateTitle,
      };
    })
    .filter(Boolean)
    .slice(0, 240);
}

function normalizeCompanyContractPriceList(values = []) {
  const source = Array.isArray(values) ? values : [values];

  return source
    .map((entry) => (entry && typeof entry === "object" && !Array.isArray(entry) ? entry : {}))
    .map((entry) => {
      const name = normalizeText(entry.name ?? entry.title ?? entry.service);
      const unit = normalizeText(entry.unit ?? entry.measureUnit);
      const price = normalizeText(entry.price ?? entry.unitPrice ?? entry.amount);
      const note = normalizeText(entry.note ?? entry.description);
      if (!name && !unit && !price && !note) {
        return null;
      }
      return {
        id: normalizeText(entry.id) || crypto.randomUUID(),
        name,
        unit,
        price,
        note,
      };
    })
    .filter(Boolean)
    .slice(0, 120);
}

function normalizePriority(value) {
  const priority = normalizeText(value);
  return PRIORITY_SET.has(priority) ? priority : "Normal";
}

function normalizeWorkOrderStatus(value) {
  const status = normalizeText(value);
  return WORK_ORDER_STATUS_SET.has(status) ? status : "Otvoreni RN";
}

function normalizeReminderStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return REMINDER_STATUS_SET.has(status) ? status : "active";
}

function normalizeReminderRepeatEveryDays(value, fallback = null) {
  const raw = normalizeText(value);

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(365, parsed);
}

function normalizeTodoTaskStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return TODO_TASK_STATUS_SET.has(status) ? status : "open";
}

function normalizeOfferStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return OFFER_STATUS_SET.has(status) ? status : "draft";
}

function normalizePurchaseOrderStatus(value, fallback = "draft") {
  const status = normalizeText(value).toLowerCase();
  return PURCHASE_ORDER_STATUS_SET.has(status) ? status : fallback;
}

function normalizePublicProcurementStatus(value, fallback = "open") {
  const status = normalizeText(value).toLowerCase();
  const legacyMap = {
    in_progress: "open",
    submitted: "sent",
    awarded: "accepted",
    cancelled: "rejected",
  };
  if (legacyMap[status]) {
    return legacyMap[status];
  }
  return PUBLIC_PROCUREMENT_STATUS_SET.has(status) ? status : fallback;
}

function normalizeRiskAssessmentStatus(value, fallback = "draft") {
  const status = normalizeText(value).toLowerCase();
  return RISK_ASSESSMENT_STATUS_SET.has(status) ? status : fallback;
}

function normalizeVehicleStatus(value) {
  const status = normalizeText(value).toLowerCase();
  if (status === "service" || status === "inactive") {
    return "service";
  }

  return "available";
}

function normalizeVehicleReservationStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return VEHICLE_RESERVATION_STATUS_SET.has(status) ? status : "reserved";
}

function normalizeClientPortalRecordType(value) {
  const type = normalizeText(value).toLowerCase();
  return CLIENT_PORTAL_RECORD_TYPE_SET.has(type) ? type : "deadline";
}

function normalizeClientPortalRecordStatus(value, fallback = "active") {
  const status = normalizeText(value).toLowerCase();
  if (CLIENT_PORTAL_RECORD_STATUS_SET.has(status)) {
    return status;
  }
  return CLIENT_PORTAL_RECORD_STATUS_SET.has(fallback) ? fallback : "active";
}

function addMonthsToOptionalDate(value, monthsValue) {
  const normalizedDate = normalizeOptionalDate(value);
  const months = Number.parseInt(String(monthsValue ?? "").trim(), 10);
  if (!normalizedDate || !Number.isFinite(months) || months <= 0) {
    return null;
  }

  const [year, month, day] = normalizedDate.split("-").map((part) => Number.parseInt(part, 10));
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== originalDay) {
    date.setDate(0);
  }
  return date.toISOString().slice(0, 10);
}

function getEarliestOptionalDate(...values) {
  return values
    .map((value) => normalizeOptionalDate(value))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))[0] ?? null;
}

function normalizeClientPortalRecordAttachments(value = []) {
  const source = Array.isArray(value) ? value : [value];
  const seen = new Set();
  return source
    .map((entry) => (entry && typeof entry === "object" && !Array.isArray(entry) ? entry : { fileName: entry }))
    .map((entry) => {
      const fileName = normalizeText(entry.fileName ?? entry.name ?? entry.title).slice(0, 220);
      const fileUrl = normalizeText(entry.fileUrl ?? entry.url).slice(0, 1400);
      const dataUrl = normalizeText(entry.dataUrl);
      const description = normalizeText(entry.description ?? entry.note).slice(0, 600);
      const mimeType = normalizeText(entry.mimeType ?? entry.type).slice(0, 120);
      const fileSize = Number.parseInt(String(entry.fileSize ?? entry.size ?? ""), 10);
      if (!fileName && !fileUrl && !dataUrl) {
        return null;
      }
      const key = [fileName, fileUrl, dataUrl.slice(0, 160)].join("::");
      if (seen.has(key)) {
        return null;
      }
      seen.add(key);
      return {
        id: normalizeText(entry.id) || crypto.randomUUID(),
        fileName,
        fileUrl,
        dataUrl,
        fileSize: Number.isFinite(fileSize) && fileSize > 0 ? Math.min(fileSize, 50_000_000) : null,
        mimeType,
        description,
        uploadedAt: normalizeOptionalDateTime(entry.uploadedAt) || normalizeOptionalDateTime(entry.createdAt) || "",
      };
    })
    .filter(Boolean)
    .slice(0, 20);
}

function withClientPortalRecordAttachments(inputDetails = {}, normalizedDetails = {}) {
  const attachmentInput = inputDetails.attachments ?? inputDetails.documents ?? inputDetails.files ?? [];
  return {
    ...normalizedDetails,
    attachments: normalizeClientPortalRecordAttachments(attachmentInput),
  };
}

function normalizeLegalFrameworkStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return LEGAL_FRAMEWORK_STATUS_SET.has(status) ? status : "active";
}

function normalizeRulebookStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return RULEBOOK_STATUS_SET.has(status) ? status : "draft";
}

function normalizeRulebookType(value) {
  const type = normalizeText(value).toLowerCase();
  return RULEBOOK_TYPE_SET.has(type) ? type : "custom";
}

function normalizeDocumentTemplateStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return DOCUMENT_TEMPLATE_STATUS_SET.has(status) ? status : "draft";
}

function normalizeDocumentTemplateType(value) {
  const type = normalizeText(value);
  return DOCUMENT_TEMPLATE_TYPE_SET.has(type) ? type : "Zapisnik";
}

function normalizeDocumentTemplateSectionType(value) {
  const type = normalizeText(value).toLowerCase();
  return DOCUMENT_TEMPLATE_SECTION_TYPE_SET.has(type) ? type : "rich_text";
}

function normalizeDocumentTemplateFieldType(value) {
  const type = normalizeText(value).toLowerCase();
  return DOCUMENT_TEMPLATE_FIELD_TYPE_SET.has(type) ? type : "text";
}

function normalizeDocumentTemplateFieldSource(value) {
  return normalizeText(value).trim().toUpperCase().slice(0, 80);
}

const DOCUMENT_TEMPLATE_PERIODICS_TRACKABLE_SOURCE_VALUES = new Set([
  "WORK_ORDER_VALID_UNTIL",
  "WORK_ORDER_SERVICE_VALID_UNTIL",
  "WORK_ORDER_PANIC_VALID_UNTIL",
  "WORK_ORDER_TIPKALO_VALID_UNTIL",
]);

function isDocumentTemplatePeriodicsTrackableField(field = {}) {
  const type = normalizeDocumentTemplateFieldType(field?.type);
  if (type === "date") {
    return true;
  }

  const source = normalizeDocumentTemplateFieldSource(field?.source ?? field?.bindingSource);
  if (
    DOCUMENT_TEMPLATE_PERIODICS_TRACKABLE_SOURCE_VALUES.has(source)
    || source.startsWith("SERVICE_VALID_UNTIL::")
  ) {
    return true;
  }

  const identity = [
    field?.key,
    field?.wordLabel,
    field?.label,
  ].map((value) => normalizeText(value).toUpperCase()).filter(Boolean).join(" ");

  return /\b(VRIJEDI_DO|DATUM_VRIJEDI_DO|VALID_UNTIL|VALID_TO)\b/.test(identity);
}

function normalizeDocumentTemplateFieldAiConfig(input = {}, field = {}) {
  const source = input && typeof input === "object" ? input : {};
  const fieldType = normalizeDocumentTemplateFieldType(field?.type);
  const fallbackType = fieldType === "dropdown"
    ? "enum"
    : fieldType === "measurement_table"
      ? "list"
      : fieldType === "date"
        ? "date"
        : "text";
  const label = normalizeText(source?.label ?? field?.label ?? field?.wordLabel).slice(0, 160);
  const key = normalizeText(source?.key ?? field?.key).slice(0, 120);
  const aiDescription = normalizeText(source?.aiDescription ?? source?.ai_description ?? source?.description).slice(0, 4000);
  const aiLookFor = normalizeAiConfigList(source?.aiLookFor ?? source?.ai_look_for, 160);
  const aiAvoid = normalizeText(source?.aiAvoid ?? source?.ai_avoid).slice(0, 1000);

  return {
    key,
    label,
    description: normalizeText(source?.description ?? field?.helpText).slice(0, 2000),
    type: normalizeAiFieldType(source?.type || fallbackType, fallbackType),
    required: normalizeBoolean(source?.required, false),
    placeholder: normalizeText(source?.placeholder).slice(0, 400),
    helpText: normalizeText(source?.helpText ?? source?.help_text ?? field?.helpText).slice(0, 1000),
    enabled: normalizeBoolean(source?.enabled ?? source?.aiEnabled ?? source?.ai_enabled, false),
    aiDescription,
    aiLookFor,
    aiAvoid,
    allowedValues: normalizeAiConfigList(source?.allowedValues ?? source?.allowed_values, 160),
    commonValues: normalizeAiConfigList(source?.commonValues ?? source?.common_values, 80),
    examples: normalizeAiConfigList(source?.examples, 80),
    format: normalizeText(source?.format).slice(0, 1200),
    unit: normalizeText(source?.unit).slice(0, 40),
    defaultValue: normalizeText(source?.defaultValue ?? source?.default_value ?? field?.defaultValue).slice(0, 500),
    fallbackValue: normalizeText(source?.fallbackValue ?? source?.fallback_value).slice(0, 500),
    confidenceRequired: normalizeAiConfidenceLevel(
      source?.confidenceRequired ?? source?.confidence_required,
      "medium",
    ),
    sourceTracking: normalizeBoolean(source?.sourceTracking ?? source?.source_tracking, true),
    validationRules: normalizeText(source?.validationRules ?? source?.validation_rules).slice(0, 1600),
    displayOrder: normalizeAiDisplayOrder(source?.displayOrder ?? source?.display_order),
    group: normalizeText(source?.group).slice(0, 120),
  };
}

function normalizeDocumentTemplateDropdownOptions(value = []) {
  const source = Array.isArray(value)
    ? value
    : String(value ?? "").split(/[\n,;]/);
  const seen = new Set();

  return source
    .map((entry) => {
      if (entry && typeof entry === "object") {
        return normalizeText(entry.label ?? entry.value);
      }
      return normalizeText(entry);
    })
    .filter(Boolean)
    .filter((entry) => {
      const key = entry.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 80);
}

function normalizeMeasurementEquipmentKind(value) {
  const type = normalizeText(value).toLowerCase();
  return MEASUREMENT_EQUIPMENT_KIND_SET.has(type) ? type : "measurement";
}

function normalizeMeasurementEquipmentActivityType(value) {
  const type = normalizeText(value).toLowerCase();
  return MEASUREMENT_EQUIPMENT_ACTIVITY_TYPE_SET.has(type) ? type : "pregled";
}

function normalizeAbsenceType(value) {
  const type = normalizeText(value).toLowerCase();
  return ABSENCE_TYPE_SET.has(type) ? type : "annual_leave";
}

function normalizeAbsenceStatus(value, fallback = "pending") {
  const status = normalizeText(value).toLowerCase();
  if (ABSENCE_STATUS_SET.has(status)) {
    return status;
  }
  return ABSENCE_STATUS_SET.has(fallback) ? fallback : "pending";
}

function normalizeAbsenceDayAllowance(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return Math.max(0, Math.round(Number(fallback) || 0));
  }
  return Math.max(0, Math.min(365, Math.round(numeric)));
}

function normalizeAbsenceBalanceAnnualParts(input = {}, fallbackTotal = 0) {
  const hasSplitValues = hasOwn(input, "annualLeaveCarriedDays")
    || hasOwn(input, "annualLeaveCarryoverDays")
    || hasOwn(input, "annualLeaveCurrentDays");

  if (!hasSplitValues) {
    const totalDays = normalizeAbsenceDayAllowance(input.annualLeaveInitialDays, fallbackTotal);
    return {
      carriedDays: 0,
      currentDays: totalDays,
      totalDays,
    };
  }

  const carriedDays = normalizeAbsenceDayAllowance(
    hasOwn(input, "annualLeaveCarriedDays") ? input.annualLeaveCarriedDays : input.annualLeaveCarryoverDays,
    0,
  );
  const currentDays = normalizeAbsenceDayAllowance(
    hasOwn(input, "annualLeaveCurrentDays") ? input.annualLeaveCurrentDays : input.annualLeaveInitialDays,
    fallbackTotal,
  );

  return {
    carriedDays,
    currentDays,
    totalDays: carriedDays + currentDays,
  };
}

function getAnnualLeaveCarryoverDeadline(asOfDate = todayString()) {
  const normalizedDate = normalizeOptionalDate(asOfDate) ?? todayString();
  return `${normalizedDate.slice(0, 4)}-06-30`;
}

function getAbsenceSummaryYear(asOfDate = todayString()) {
  const normalizedDate = normalizeOptionalDate(asOfDate) ?? todayString();
  return normalizedDate.slice(0, 4);
}

function getMonthLastDateKey(monthKey = "") {
  const normalizedMonth = String(monthKey || "").trim();
  if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) {
    return todayString();
  }

  const [year, month] = normalizedMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month, 0, 12, 0, 0, 0));
  return Number.isNaN(date.getTime()) ? todayString() : toIsoDateKey(date);
}

function normalizeOfferLocationScope(value, fallback = "none") {
  const scope = normalizeText(value).toLowerCase();
  return OFFER_LOCATION_SCOPE_SET.has(scope) ? scope : fallback;
}

function normalizePurchaseOrderDirection(value, fallback = "incoming") {
  const direction = normalizeText(value).toLowerCase();
  return PURCHASE_ORDER_DIRECTION_SET.has(direction) ? direction : fallback;
}

function normalizeOib(value) {
  const oib = normalizeText(value).replace(/\s+/g, "");

  if (!/^\d{11}$/.test(oib)) {
    throw new Error("OIB mora imati tocno 11 znamenki.");
  }

  return oib;
}

function normalizeOptionalOib(value) {
  const oib = normalizeText(value).replace(/\s+/g, "");
  return oib ? normalizeOib(oib) : "";
}

function normalizeId(value) {
  return normalizeText(value);
}

function normalizeFiniteNumber(value, fallback = 0) {
  const raw = normalizeText(value).replace(/\s+/g, "").replace(/[^\d,.-]/g, "");

  if (!raw) {
    return fallback;
  }

  const lastCommaIndex = raw.lastIndexOf(",");
  const lastDotIndex = raw.lastIndexOf(".");
  let normalized = raw;

  if (lastCommaIndex !== -1 && lastDotIndex !== -1) {
    const decimalIndex = Math.max(lastCommaIndex, lastDotIndex);
    normalized = raw.replace(/[,.]/g, (match, offset) => (offset === decimalIndex ? "." : ""));
  } else if (lastCommaIndex !== -1) {
    normalized = raw.replace(/,/g, (match, offset) => (offset === lastCommaIndex ? "." : ""));
  } else if (lastDotIndex !== -1) {
    const dotParts = raw.split(".");
    const isLikelyThousandsFormat = dotParts.length === 2
      && dotParts[1].length === 3
      && dotParts.every((part) => /^-?\d+$/.test(part));
    normalized = isLikelyThousandsFormat
      ? raw.replace(/\./g, "")
      : raw.replace(/\./g, (match, offset) => (offset === lastDotIndex ? "." : ""));
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundCurrencyAmount(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function normalizeOfferTaxRate(value) {
  return roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(value, 25)));
}

function normalizeOfferDiscountRate(value) {
  return roundCurrencyAmount(Math.min(100, Math.max(0, normalizeFiniteNumber(value, 0))));
}

function normalizeIdList(values = []) {
  const source = Array.isArray(values)
    ? values
    : [values];

  return Array.from(new Set(
    source
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .map((entry) => normalizeId(entry))
      .filter(Boolean),
  ));
}

function normalizeQualificationKey(value = "") {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function normalizeQualificationKeyList(values = []) {
  let source = [];
  if (Array.isArray(values)) {
    source = values;
  } else if (values && typeof values === "object") {
    const entries = Object.entries(values);
    source = entries.every(([, flag]) => typeof flag === "boolean")
      ? entries.filter(([, flag]) => flag).map(([key]) => key)
      : Object.values(values);
  } else {
    const rawValue = normalizeText(values);
    if (!rawValue) {
      return [];
    }
    try {
      const parsed = JSON.parse(rawValue);
      source = Array.isArray(parsed) ? parsed : rawValue.split(",");
    } catch {
      source = rawValue.split(",");
    }
  }

  return Array.from(new Set(
    source
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .map((entry) => normalizeQualificationKey(entry))
      .filter(Boolean),
  ));
}

function cloneJsonArray(items = []) {
  return JSON.parse(JSON.stringify(Array.isArray(items) ? items : []));
}

function normalizeLinkedTemplateSnapshot(state, templateIds = [], fallbackTitles = []) {
  return deriveServiceTemplateSnapshot(state, templateIds, fallbackTitles);
}

function normalizeAttachmentDocuments(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  const seen = new Set();

  return items.map((item) => {
    const fileName = normalizeText(item?.fileName ?? item?.name);
    const dataUrl = normalizeText(item?.dataUrl ?? item?.url ?? item?.storageUrl);

    if (!fileName || !dataUrl) {
      return null;
    }

    const id = normalizeId(item?.id) || crypto.randomUUID();
    const dedupeKey = `${normalizeText(item?.storageKey)}::${fileName}::${dataUrl}`;

    if (seen.has(dedupeKey)) {
      return null;
    }

    seen.add(dedupeKey);

    const numericSize = Number(item?.fileSize ?? item?.size);
    return {
      id,
      fileName: fileName.slice(0, 255),
      fileType: normalizeText(item?.fileType ?? item?.mimeType).slice(0, 160),
      fileSize: Number.isFinite(numericSize) && numericSize >= 0 ? Math.round(numericSize) : 0,
      documentCategory: normalizeText(item?.documentCategory ?? item?.category).slice(0, 64),
      sourceDocumentId: normalizeId(item?.sourceDocumentId ?? item?.parentDocumentId),
      previewStatus: normalizeText(item?.previewStatus).slice(0, 48),
      previewError: normalizeText(item?.previewError).slice(0, 400),
      description: normalizeText(item?.description),
      dataUrl,
      storageProvider: normalizeText(item?.storageProvider).slice(0, 32),
      storageBucket: normalizeText(item?.storageBucket).slice(0, 128),
      storageKey: normalizeText(item?.storageKey).slice(0, 512),
      storageUrl: normalizeText(item?.storageUrl ?? item?.url),
      createdAt: normalizeOptionalDateTime(item?.createdAt) ?? isoNow(),
      updatedAt: normalizeOptionalDateTime(item?.updatedAt ?? item?.createdAt) ?? isoNow(),
    };
  }).filter(Boolean);
}

function buildDateFromKey(value) {
  const normalized = normalizeOptionalDate(value);
  if (!normalized) {
    return null;
  }
  const date = new Date(`${normalized}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function isBusinessDay(date) {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function listBusinessDayKeysBetween(startDate, endDate) {
  const start = buildDateFromKey(startDate);
  const end = buildDateFromKey(endDate);
  if (!start || !end || end < start) {
    return [];
  }

  const keys = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isBusinessDay(cursor)) {
      keys.push(toIsoDateKey(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function getMonthBusinessDayKeys(monthKey = "") {
  const normalizedMonth = String(monthKey || "").trim();
  if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) {
    return [];
  }

  const start = buildDateFromKey(`${normalizedMonth}-01`);
  if (!start) {
    return [];
  }

  const keys = [];
  const cursor = new Date(start);
  while (toIsoDateKey(cursor).startsWith(normalizedMonth)) {
    if (isBusinessDay(cursor)) {
      keys.push(toIsoDateKey(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function getAbsenceTypeLabel(value = "") {
  const normalized = normalizeAbsenceType(value);
  return ABSENCE_TYPE_OPTIONS.find((option) => option.value === normalized)?.label || "Drugi izostanak";
}

function normalizeAbsenceDateRange(startDate, endDate) {
  const normalizedStart = normalizeOptionalDate(startDate);
  const normalizedEnd = normalizeOptionalDate(endDate ?? startDate);

  if (!normalizedStart) {
    throw new Error("Početni datum izostanka je obavezan.");
  }
  if (!normalizedEnd) {
    throw new Error("Završni datum izostanka je obavezan.");
  }
  if (normalizedEnd < normalizedStart) {
    throw new Error("Završni datum ne može biti prije početnog datuma.");
  }

  return {
    startDate: normalizedStart,
    endDate: normalizedEnd,
  };
}

function compareMeasurementEquipmentActivityRecency(left = {}, right = {}) {
  const leftDate = normalizeText(left.performedOn);
  const rightDate = normalizeText(right.performedOn);

  if (leftDate && rightDate && leftDate !== rightDate) {
    return rightDate.localeCompare(leftDate);
  }

  if (leftDate && !rightDate) {
    return -1;
  }

  if (!leftDate && rightDate) {
    return 1;
  }

  const leftUpdated = normalizeText(left.updatedAt ?? left.createdAt);
  const rightUpdated = normalizeText(right.updatedAt ?? right.createdAt);

  if (leftUpdated && rightUpdated && leftUpdated !== rightUpdated) {
    return rightUpdated.localeCompare(leftUpdated);
  }

  return normalizeText(right.id).localeCompare(normalizeText(left.id));
}

function normalizeMeasurementEquipmentActivityItems(items = [], now = isoNow) {
  if (!Array.isArray(items)) {
    return [];
  }

  const timestamp = now();

  return items.map((item) => {
    const activityTypeInput = normalizeText(item?.activityType ?? item?.type);
    const performedOn = normalizeOptionalDate(item?.performedOn ?? item?.date);
    const performedBy = normalizeText(item?.performedBy ?? item?.actor).slice(0, 180);
    const calibrationPeriod = normalizeText(item?.calibrationPeriod ?? item?.period).slice(0, 80);
    const validUntil = normalizeOptionalDate(item?.validUntil);
    const satisfiesInput = normalizeText(item?.satisfies ?? item?.zadovoljava).toLowerCase();
    const satisfies = satisfiesInput === "da" ? "da" : (satisfiesInput === "ne" ? "ne" : "");
    const note = normalizeText(item?.note);
    const hasAnyData = Boolean(
      activityTypeInput
      || normalizeText(item?.performedOn ?? item?.date)
      || performedBy
      || calibrationPeriod
      || normalizeText(item?.validUntil)
      || satisfies
      || note,
    );

    if (!hasAnyData) {
      return null;
    }

    return {
      id: normalizeId(item?.id) || crypto.randomUUID(),
      activityType: normalizeMeasurementEquipmentActivityType(activityTypeInput),
      completed: normalizeBoolean(item?.completed, true),
      performedOn,
      performedBy,
      calibrationPeriod,
      validUntil,
      satisfies,
      note,
      createdAt: normalizeOptionalDateTime(item?.createdAt) ?? timestamp,
      updatedAt: normalizeOptionalDateTime(item?.updatedAt ?? item?.createdAt) ?? timestamp,
    };
  }).filter(Boolean).sort(compareMeasurementEquipmentActivityRecency);
}

function normalizeMeasurementEquipmentSpecItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    const quantity = normalizeText(item?.quantity ?? item?.measurementQuantity ?? item?.mjernaVelicina).slice(0, 140);
    const range = normalizeText(item?.range ?? item?.raspon).slice(0, 140);
    const remark = normalizeText(item?.remark ?? item?.opaska).slice(0, 220);

    if (!quantity && !range && !remark) {
      return null;
    }

    return {
      id: normalizeId(item?.id) || crypto.randomUUID(),
      quantity,
      range,
      remark,
    };
  }).filter(Boolean).slice(0, 6);
}

function applyMeasurementEquipmentCalibrationFromActivities(activityItems = [], {
  requiresCalibration = false,
  calibrationDate = null,
  calibrationPeriod = "",
  validUntil = null,
} = {}) {
  const latestCalibrationActivity = [...(Array.isArray(activityItems) ? activityItems : [])]
    .filter((entry) => entry.activityType === "umjeravanje")
    .sort(compareMeasurementEquipmentActivityRecency)[0];

  if (!latestCalibrationActivity) {
    return {
      requiresCalibration: normalizeBoolean(requiresCalibration, false),
      calibrationDate: normalizeOptionalDate(calibrationDate),
      calibrationPeriod: normalizeText(calibrationPeriod),
      validUntil: normalizeOptionalDate(validUntil),
    };
  }

  return {
    requiresCalibration: true,
    calibrationDate: normalizeOptionalDate(latestCalibrationActivity.performedOn) || normalizeOptionalDate(calibrationDate),
    calibrationPeriod: normalizeText(latestCalibrationActivity.calibrationPeriod) || normalizeText(calibrationPeriod),
    validUntil: normalizeOptionalDate(latestCalibrationActivity.validUntil) || normalizeOptionalDate(validUntil),
  };
}

function normalizeWorkOrderExecutors(values = [], fallbackValues = []) {
  const source = [
    ...(Array.isArray(values) ? values : [values]),
    ...(Array.isArray(fallbackValues) ? fallbackValues : [fallbackValues]),
  ];

  return Array.from(new Set(
    source
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .map((entry) => normalizeText(entry))
      .filter(Boolean),
  ));
}

function normalizeMeasurementSheetBorderSnapshot(border = {}) {
  if (typeof border === "string") {
    if (border === "all") {
      return {
        top: true,
        right: true,
        bottom: true,
        left: true,
      };
    }

    if (["top", "right", "bottom", "left"].includes(border)) {
      return {
        top: border === "top",
        right: border === "right",
        bottom: border === "bottom",
        left: border === "left",
      };
    }

    return {
      top: false,
      right: false,
      bottom: false,
      left: false,
    };
  }

  return {
    top: normalizeBoolean(border?.top, false),
    right: normalizeBoolean(border?.right, false),
    bottom: normalizeBoolean(border?.bottom, false),
    left: normalizeBoolean(border?.left, false),
  };
}

function normalizeMeasurementSheetCellFormatSnapshot(format = {}) {
  return normalizeMeasurementCellFormat({
    ...format,
    border: normalizeMeasurementSheetBorderSnapshot(format?.border),
  });
}

function normalizeLearningTestStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  return LEARNING_TEST_STATUS_OPTIONS.some((option) => option.value === normalized)
    ? normalized
    : "draft";
}

function normalizeLearningTestMatchKeywords(value) {
  return Array.from(new Set(
    String(value ?? "")
      .split(/[\n,;|]+/)
      .map((entry) => normalizeText(entry).slice(0, 80))
      .filter(Boolean),
  ))
    .slice(0, 40)
    .join(", ");
}

function normalizeLearningQuestionType(value) {
  const normalized = normalizeText(value).toLowerCase();
  return ["single_choice", "multiple_choice", "ordered_text"].includes(normalized)
    ? normalized
    : "single_choice";
}

function normalizeLearningTestOptionItems(items = []) {
  const source = Array.isArray(items) ? items : [];
  return source.map((item, index) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    text: normalizeText(item?.text || item?.label || `Opcija ${index + 1}`),
    isCorrect: normalizeBoolean(item?.isCorrect, false),
    orderIndex: Number.isFinite(Number(item?.orderIndex))
      ? Math.max(1, Math.round(Number(item.orderIndex)))
      : null,
  })).filter((item) => item.text);
}

function normalizeLearningQuestionItems(items = []) {
  const source = Array.isArray(items) ? items : [];
  return source.map((item, index) => {
    const options = normalizeLearningTestOptionItems(item?.options ?? []);
    const questionType = normalizeLearningQuestionType(item?.questionType);
    const correctOptionKeys = Array.from(new Set([
      ...(Array.isArray(item?.correctOptionKeys) ? item.correctOptionKeys : []),
      ...options
        .filter((option) => option.isCorrect)
        .map((option, optionIndex) => ["A", "B", "C", "D"][optionIndex] || ""),
    ].map((value) => normalizeText(value).toUpperCase()).filter(Boolean)));
    return {
      id: normalizeId(item?.id) || crypto.randomUUID(),
      code: normalizeText(item?.code || `P${index + 1}`),
      groupLabel: normalizeText(item?.groupLabel || item?.group || item?.category || "Opća grupa"),
      prompt: normalizeText(item?.prompt || item?.question || item?.title),
      explanation: normalizeText(item?.explanation),
      questionType,
      correctOptionKeys,
      imageDocument: normalizeAttachmentDocuments(item?.imageDocument ? [item.imageDocument] : [])[0] ?? null,
      options,
    };
  }).filter((item) => item.prompt && item.options.length > 0);
}

function normalizeLearningVideoItems(items = []) {
  const source = Array.isArray(items) ? items : [];
  return source.map((item, index) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    title: normalizeText(item?.title || `Video ${index + 1}`),
    url: normalizeText(item?.url),
    description: normalizeText(item?.description),
  })).filter((item) => item.title || item.url);
}

function normalizeLearningSecondsPerQuestion(value, fallback = 60) {
  const normalized = Math.round(normalizeFiniteNumber(value, fallback));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return Math.max(5, Math.min(3600, Math.round(normalizeFiniteNumber(fallback, 60))));
  }
  return Math.max(5, Math.min(3600, normalized));
}

function normalizeLearningPassPercent(value, fallback = 80) {
  const normalized = Math.round(normalizeFiniteNumber(value, fallback));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return Math.max(1, Math.min(100, Math.round(normalizeFiniteNumber(fallback, 80))));
  }
  return Math.max(1, Math.min(100, normalized));
}

function normalizeLearningQuestionLimit(value) {
  const normalized = Math.round(normalizeFiniteNumber(value, 0));
  return Math.max(0, Math.min(500, Number.isFinite(normalized) ? normalized : 0));
}

function normalizeLearningOptionalSeconds(value) {
  const normalized = Math.round(normalizeFiniteNumber(value, 0));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return 0;
  }
  return Math.max(5, Math.min(86400, normalized));
}

function normalizeLearningQuestionIdList(value = []) {
  const source = Array.isArray(value)
    ? value
    : String(value ?? "").split(/[\n,;|]/);
  const seen = new Set();
  return source
    .map((entry) => normalizeId(entry) || normalizeText(entry))
    .filter(Boolean)
    .filter((entry) => {
      const key = String(entry);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 500);
}

function normalizeLearningAssignmentItems(items = [], users = []) {
  const source = Array.isArray(items) ? items : [];
  const userIndex = new Map((users ?? []).map((user) => [String(user.id), user]));
  return source.map((item) => {
    const userId = normalizeId(item?.userId);
    const user = userIndex.get(String(userId));
    const assigneeType = normalizeText(item?.assigneeType).toLowerCase() === "external" ? "external" : "user";
    const externalFullName = normalizeText(item?.externalFullName);
    const externalEmail = normalizeText(item?.externalEmail);
    const externalPhone = normalizeText(item?.externalPhone);
    const externalCompany = normalizeText(item?.externalCompany);
    const externalOib = normalizeText(item?.externalOib);
    return {
      id: normalizeId(item?.id) || crypto.randomUUID(),
      assigneeType,
      userId,
      userLabel: normalizeText(item?.userLabel || user?.fullName || user?.email || user?.username),
      email: normalizeText(item?.email || user?.email),
      externalFullName,
      externalEmail,
      externalPhone,
      externalCompany,
      externalOib,
      workOrderId: normalizeId(item?.workOrderId),
      workOrderNumber: normalizeText(item?.workOrderNumber),
      serviceId: normalizeId(item?.serviceId),
      serviceName: normalizeText(item?.serviceName),
      assignedByUserId: normalizeId(item?.assignedByUserId),
      assignedByLabel: normalizeText(item?.assignedByLabel),
      safetySpecialistUserId: normalizeId(item?.safetySpecialistUserId),
      safetySpecialistLabel: normalizeText(item?.safetySpecialistLabel),
      accessToken: normalizeText(item?.accessToken) || crypto.randomUUID(),
      status: ["pending", "in_progress", "completed"].includes(normalizeText(item?.status).toLowerCase())
        ? normalizeText(item?.status).toLowerCase()
        : "pending",
      assignedAt: normalizeOptionalDateTime(item?.assignedAt) ?? isoNow(),
      startedAt: normalizeOptionalDateTime(item?.startedAt),
      completedAt: normalizeOptionalDateTime(item?.completedAt),
      scorePercent: Math.max(0, Math.min(100, Math.round(normalizeFiniteNumber(item?.scorePercent, 0)))),
      passPercent: normalizeLearningPassPercent(item?.passPercent ?? item?.passingPercent ?? item?.minimumPassPercent),
      passed: item?.passed === undefined && item?.isPassed === undefined
        ? undefined
        : normalizeBoolean(item?.passed ?? item?.isPassed, false),
      questionLimit: normalizeLearningQuestionLimit(item?.questionLimit ?? item?.questionCount),
      selectedQuestionIds: normalizeLearningQuestionIdList(item?.selectedQuestionIds ?? item?.questionIds),
      timePerQuestionSeconds: normalizeLearningOptionalSeconds(item?.timePerQuestionSeconds ?? item?.secondsPerQuestion),
      timeLimitSeconds: normalizeLearningOptionalSeconds(item?.timeLimitSeconds ?? item?.durationSeconds),
    };
  }).filter((item) => item.userId || item.email || item.userLabel || item.externalFullName);
}

function normalizeLearningAttemptItems(items = []) {
  const source = Array.isArray(items) ? items : [];
  return source.map((item) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    assignmentId: normalizeId(item?.assignmentId),
    userId: normalizeId(item?.userId),
    userLabel: normalizeText(item?.userLabel),
    answers: cloneJsonArray(item?.answers ?? []),
    scorePercent: Math.max(0, Math.min(100, Math.round(normalizeFiniteNumber(item?.scorePercent, 0)))),
    passPercent: normalizeLearningPassPercent(item?.passPercent ?? item?.passingPercent ?? item?.minimumPassPercent),
    passed: item?.passed === undefined && item?.isPassed === undefined
      ? undefined
      : normalizeBoolean(item?.passed ?? item?.isPassed, false),
    submittedAt: normalizeOptionalDateTime(item?.submittedAt) ?? isoNow(),
  })).filter((item) => item.assignmentId);
}

function normalizeMeasurementSheetValidationOptions(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : String(values ?? "")
    .split(/[\n,;|]/))
    .map((value) => normalizeText(value))
    .filter(Boolean)))
    .slice(0, 160);
}

function normalizeMeasurementSheetColumnValidationSnapshot(input = {}, availableColumnIds = new Set(), columnId = "") {
  const source = input && typeof input === "object" ? input : {};
  const type = normalizeText(source?.type).toLowerCase() === "list" ? "list" : "none";
  const sourceMode = normalizeText(source?.sourceMode).toLowerCase() === "custom" ? "custom" : "column";
  const sourceColumnId = normalizeText(source?.sourceColumnId);
  const normalizedSourceColumnId = sourceMode === "column"
    && sourceColumnId
    && (!availableColumnIds.size || availableColumnIds.has(sourceColumnId))
    ? sourceColumnId
    : (sourceMode === "column" && columnId && (!availableColumnIds.size || availableColumnIds.has(columnId))
      ? columnId
      : "");

  if (type !== "list") {
    return {
      type: "none",
      sourceMode: "column",
      sourceColumnId: "",
      options: [],
      allowCustom: true,
    };
  }

  return {
    type: "list",
    sourceMode,
    sourceColumnId: sourceMode === "column" ? normalizedSourceColumnId : "",
    options: sourceMode === "custom" ? normalizeMeasurementSheetValidationOptions(source?.options) : [],
    allowCustom: normalizeBoolean(source?.allowCustom, true),
  };
}

const MEASUREMENT_AI_COLUMN_FORMATS = new Set([
  "text",
  "number",
  "date",
  "boolean",
  "enum",
  "measurement",
  "list",
]);

const AI_CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);

function normalizeAiConfigList(value, maxItems = 120) {
  return normalizeMeasurementSheetValidationOptions(value).slice(0, maxItems);
}

function normalizeAiConfidenceLevel(value = "", fallback = "medium") {
  const normalized = normalizeText(value).toLowerCase();
  return AI_CONFIDENCE_LEVELS.has(normalized) ? normalized : fallback;
}

function normalizeAiDisplayOrder(value = "") {
  const parsed = Number.parseInt(normalizeText(value), 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(9999, parsed)) : 0;
}

function normalizeAiFieldType(value = "", fallback = "text") {
  const normalized = normalizeText(value).toLowerCase();
  return MEASUREMENT_AI_COLUMN_FORMATS.has(normalized) ? normalized : fallback;
}

function normalizeMeasurementSheetColumnAiMappingSnapshot(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const format = normalizeAiFieldType(source?.format || source?.type || "", "text");
  const description = normalizeText(source?.description ?? source?.aiDescription ?? source?.ai_description).slice(0, 2000);
  const aiDescription = normalizeText(source?.aiDescription ?? source?.ai_description ?? source?.description).slice(0, 2000);
  const aiLookFor = normalizeAiConfigList(
    source?.aiLookFor ?? source?.ai_look_for ?? source?.synonyms,
    160,
  );
  const aiAvoid = normalizeText(source?.aiAvoid ?? source?.ai_avoid ?? source?.avoid).slice(0, 1000);

  return {
    key: normalizeText(source?.key).slice(0, 120),
    label: normalizeText(source?.label).slice(0, 160),
    description,
    type: normalizeAiFieldType(source?.type || format, format),
    required: normalizeBoolean(source?.required, false),
    placeholder: normalizeText(source?.placeholder).slice(0, 400),
    helpText: normalizeText(source?.helpText ?? source?.help_text).slice(0, 1000),
    enabled: normalizeBoolean(source?.enabled ?? source?.aiEnabled ?? source?.ai_enabled, false),
    aiDescription,
    aiLookFor,
    aiAvoid,
    synonyms: normalizeAiConfigList(source?.synonyms ?? aiLookFor, 80),
    allowedValues: normalizeAiConfigList(source?.allowedValues ?? source?.allowed_values, 160),
    commonValues: normalizeAiConfigList(source?.commonValues ?? source?.common_values, 80),
    examples: normalizeAiConfigList(source?.examples, 80),
    avoid: aiAvoid,
    format,
    unit: normalizeText(source?.unit).slice(0, 40),
    defaultValue: normalizeText(source?.defaultValue ?? source?.default_value).slice(0, 500),
    fallbackValue: normalizeText(source?.fallbackValue ?? source?.fallback_value).slice(0, 500),
    confidenceRequired: normalizeAiConfidenceLevel(
      source?.confidenceRequired ?? source?.confidence_required,
      "medium",
    ),
    sourceTracking: normalizeBoolean(source?.sourceTracking ?? source?.source_tracking, true),
    validationRules: normalizeText(source?.validationRules ?? source?.validation_rules).slice(0, 1600),
    displayOrder: normalizeAiDisplayOrder(source?.displayOrder ?? source?.display_order),
    group: normalizeText(source?.group).slice(0, 120),
  };
}

function normalizeMeasurementColumnCellPlaceholder(value = "", label = "") {
  const placeholder = normalizeText(value);
  const normalizedLabel = normalizeText(label);
  const defaultCellHints = new Set([
    "pozicija",
    "opis",
    "vrijednost",
    "granica",
    "napomena",
    "unos",
    "mjerno mjesto",
    "oznaka",
    "jedinica",
    "min",
    "max",
    "0,00",
  ]);

  if (!placeholder) {
    return "";
  }
  if (placeholder.toLowerCase() === normalizedLabel.toLowerCase() || defaultCellHints.has(placeholder.toLowerCase())) {
    return "";
  }
  return placeholder;
}

function normalizeMeasurementSheetColumnSnapshot(input = {}, index = 0) {
  const width = Number(input?.width);
  const computed = normalizeText(input?.computed);
  const label = normalizeText(input?.label) || `Kolona ${index + 1}`;

  return {
    id: normalizeText(input?.id) || `measurement-column-${index + 1}`,
    label,
    placeholder: normalizeMeasurementColumnCellPlaceholder(input?.placeholder, label),
    width: Number.isFinite(width) ? Math.min(640, Math.max(MEASUREMENT_COLUMN_MIN_WIDTH, Math.round(width))) : 160,
    computed: computed || null,
    readonly: normalizeBoolean(input?.readonly, false),
    validation: normalizeMeasurementSheetColumnValidationSnapshot(input?.validation, new Set(), normalizeText(input?.id) || `measurement-column-${index + 1}`),
    aiMapping: normalizeMeasurementSheetColumnAiMappingSnapshot(input?.aiMapping ?? input?.ai),
  };
}

function normalizeMeasurementSheetRowSnapshot(input = {}, columns = [], index = 0) {
  const editableColumns = columns.filter((column) => !column.computed);
  const cells = {};
  const formats = {};

  editableColumns.forEach((column) => {
    cells[column.id] = String(input?.cells?.[column.id] ?? "").slice(0, 4000);
    formats[column.id] = normalizeMeasurementSheetCellFormatSnapshot(input?.formats?.[column.id]);
  });

  return {
    id: normalizeText(input?.id) || `measurement-row-${index + 1}`,
    cells,
    formats,
  };
}

function normalizeMeasurementSheetHeaderRowsSnapshot(values = [], rowIds = new Set()) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => normalizeText(value))
    .filter((value) => value && rowIds.has(value))));
}

function normalizeMeasurementSheetMergeSnapshot(input = {}, rowIds = new Set(), columnIds = new Set()) {
  const rowId = normalizeText(input?.rowId);
  const columnId = normalizeText(input?.columnId);
  const rowSpan = Number.parseInt(input?.rowSpan, 10);
  const colSpan = Number.parseInt(input?.colSpan, 10);

  if (!rowId || !columnId || !rowIds.has(rowId) || !columnIds.has(columnId)) {
    return null;
  }

  const normalizedRowSpan = Number.isInteger(rowSpan) ? Math.max(1, Math.min(200, rowSpan)) : 1;
  const normalizedColSpan = Number.isInteger(colSpan) ? Math.max(1, Math.min(32, colSpan)) : 1;

  if (normalizedRowSpan <= 1 && normalizedColSpan <= 1) {
    return null;
  }

  return {
    rowId,
    columnId,
    rowSpan: normalizedRowSpan,
    colSpan: normalizedColSpan,
  };
}

function buildLegacyTemplateMeasurementSheet(columnsInput = [], rowCountInput = 12) {
  const defaultColumns = ["Pozicija", "Opis", "Vrijednost", "Granica", "Napomena"];
  const labels = (Array.isArray(columnsInput) ? columnsInput : [])
    .map((entry) => normalizeText(entry))
    .filter(Boolean)
    .slice(0, 16);
  const columnLabels = labels.length > 0 ? labels : defaultColumns;
  const columns = columnLabels.map((label, index) => normalizeMeasurementSheetColumnSnapshot({
    id: `measurement-column-${index + 1}`,
    label,
    placeholder: "",
    width: index === 0 ? 220 : 160,
  }, index));
  const rowCount = Math.max(4, Math.min(120, Math.round(normalizeFiniteNumber(rowCountInput, 12))));
  const rows = Array.from({ length: rowCount }, (_, index) => normalizeMeasurementSheetRowSnapshot({
    id: `measurement-row-${index + 1}`,
  }, columns, index));

  return {
    columns,
    rows,
    merges: [],
    headerRows: [],
  };
}

export function normalizeWorkOrderMeasurementSheet(input = null) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const columns = (Array.isArray(input.columns) ? input.columns : [])
    .slice(0, 96)
    .map((column, index) => normalizeMeasurementSheetColumnSnapshot(column, index))
    .filter((column, index, items) => (
      column.id
      && items.findIndex((item) => item.id === column.id) === index
    ));

  const columnIds = new Set(columns.filter((column) => !column.computed).map((column) => column.id));
  const normalizedColumns = columns.map((column) => ({
    ...column,
    validation: normalizeMeasurementSheetColumnValidationSnapshot(
      column.validation,
      columnIds,
      column.id,
    ),
  }));

  if (normalizedColumns.length === 0 || normalizedColumns.every((column) => column.computed)) {
    return null;
  }

  const rows = (Array.isArray(input.rows) ? input.rows : [])
    .slice(0, 600)
    .map((row, index) => normalizeMeasurementSheetRowSnapshot(row, normalizedColumns, index));
  const rowIds = new Set(rows.map((row) => row.id));
  const merges = (Array.isArray(input.merges) ? input.merges : [])
    .slice(0, 200)
    .map((merge) => normalizeMeasurementSheetMergeSnapshot(merge, rowIds, columnIds))
    .filter(Boolean);
  const headerRows = normalizeMeasurementSheetHeaderRowsSnapshot(input.headerRows, rowIds);

  return {
    columns: normalizedColumns,
    rows,
    merges,
    headerRows,
  };
}

function resolveWorkOrderExecutorsInput(input = {}, current = null) {
  if (hasOwn(input, "executors")) {
    return normalizeWorkOrderExecutors(input.executors);
  }

  if (hasOwn(input, "executor1") || hasOwn(input, "executor2")) {
    return normalizeWorkOrderExecutors([], [input.executor1, input.executor2]);
  }

  if (current) {
    return getWorkOrderExecutors(current);
  }

  return [];
}

function normalizeServiceCatalogStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return SERVICE_CATALOG_STATUS_SET.has(status) ? status : "active";
}

function normalizeServiceCatalogType(value, fallback = "inspection") {
  const type = normalizeText(value).toLowerCase();
  if (SERVICE_CATALOG_TYPE_SET.has(type)) {
    return type;
  }

  const fallbackType = normalizeText(fallback).toLowerCase();
  return SERVICE_CATALOG_TYPE_SET.has(fallbackType) ? fallbackType : "inspection";
}

function normalizeServiceValidityMonths(value) {
  const raw = normalizeText(value);
  if (!raw) {
    return "";
  }

  const numeric = Math.round(normalizeFiniteNumber(raw, Number.NaN));
  if (!Number.isFinite(numeric) || numeric < 0) {
    return "";
  }

  return String(Math.min(600, numeric));
}

function findServiceCatalogItem(state, serviceId = "", organizationId = "") {
  if (!serviceId) {
    return null;
  }

  return (state.serviceCatalog ?? []).find((item) => (
    String(item.id) === String(serviceId)
    && (!organizationId || String(item.organizationId) === String(organizationId))
  )) ?? null;
}

function deriveServiceTemplateSnapshot(state, templateIds = [], fallbackTitles = []) {
  const templateIdList = normalizeIdList(templateIds);
  const templatesById = new Map(
    (state.documentTemplates ?? []).map((item) => [String(item.id), item]),
  );
  const linkedTemplateTitles = [];

  templateIdList.forEach((templateId) => {
    const template = templatesById.get(String(templateId));
    if (template?.title) {
      linkedTemplateTitles.push(template.title);
    }
  });

  if (linkedTemplateTitles.length === 0 && Array.isArray(fallbackTitles)) {
    fallbackTitles
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .forEach((value) => linkedTemplateTitles.push(value));
  }

  return {
    linkedTemplateIds: templateIdList,
    linkedTemplateTitles: Array.from(new Set(linkedTemplateTitles)),
  };
}

function deriveServiceLearningTestSnapshot(state, learningTestIds = [], fallbackTitles = []) {
  const learningTestIdList = normalizeIdList(learningTestIds);
  const learningTestsById = new Map(
    (state.learningTests ?? []).map((item) => [String(item.id), item]),
  );
  const linkedLearningTestTitles = [];

  learningTestIdList.forEach((testId) => {
    const test = learningTestsById.get(String(testId));
    if (test?.title) {
      linkedLearningTestTitles.push(normalizeText(test.title));
    }
  });

  if (linkedLearningTestTitles.length === 0 && Array.isArray(fallbackTitles)) {
    fallbackTitles
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .forEach((value) => linkedLearningTestTitles.push(value));
  }

  return {
    linkedLearningTestIds: learningTestIdList,
    linkedLearningTestTitles: Array.from(new Set(linkedLearningTestTitles)),
  };
}

function deriveLinkedServiceCatalogSnapshot(state, serviceIds = [], fallbackTitles = []) {
  const servicesById = new Map(
    (state.serviceCatalog ?? []).map((item) => [String(item.id), item]),
  );
  const linkedServiceCatalogIds = normalizeIdList(serviceIds)
    .filter((serviceId) => servicesById.has(String(serviceId)));
  const linkedServiceCatalogTitles = [];

  linkedServiceCatalogIds.forEach((serviceId) => {
    const service = servicesById.get(String(serviceId));
    const label = normalizeText(service?.name || service?.serviceCode);
    if (label) {
      linkedServiceCatalogTitles.push(label);
    }
  });

  if (linkedServiceCatalogTitles.length === 0 && Array.isArray(fallbackTitles)) {
    fallbackTitles
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .forEach((value) => linkedServiceCatalogTitles.push(value));
  }

  return {
    linkedServiceCatalogIds,
    linkedServiceCatalogTitles: Array.from(new Set(linkedServiceCatalogTitles)),
  };
}

function deriveTemplateSnapshotFromLinkedServices(state, serviceIds = [], fallbackTemplateIds = [], fallbackTitles = []) {
  const serviceIdList = normalizeIdList(serviceIds);
  const servicesById = new Map(
    (state.serviceCatalog ?? []).map((item) => [String(item.id), item]),
  );
  const linkedTemplateIds = [];
  const linkedTemplateTitles = [];

  serviceIdList.forEach((serviceId) => {
    const service = servicesById.get(String(serviceId));
    if (!service) {
      return;
    }

    (service.linkedTemplateIds ?? [])
      .map((value) => normalizeId(value))
      .filter(Boolean)
      .forEach((value) => linkedTemplateIds.push(value));
    (service.linkedTemplateTitles ?? [])
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .forEach((value) => linkedTemplateTitles.push(value));
  });

  if (linkedTemplateIds.length === 0 && linkedTemplateTitles.length === 0) {
    return normalizeLinkedTemplateSnapshot(state, fallbackTemplateIds, fallbackTitles);
  }

  return {
    linkedTemplateIds: Array.from(new Set(linkedTemplateIds)),
    linkedTemplateTitles: Array.from(new Set(linkedTemplateTitles)),
  };
}

const WORK_ORDER_SERVICE_PROGRESS_VALUES = new Set(["pending", "in_progress", "completed"]);

function normalizeWorkOrderServiceProgressStatus(value = "", fallback = "pending") {
  const normalized = normalizeText(value).toLowerCase();
  if (WORK_ORDER_SERVICE_PROGRESS_VALUES.has(normalized)) {
    return normalized;
  }
  const normalizedFallback = normalizeText(fallback).toLowerCase();
  return WORK_ORDER_SERVICE_PROGRESS_VALUES.has(normalizedFallback) ? normalizedFallback : "pending";
}

function normalizeWorkOrderServiceQuantity(value = 1) {
  const numeric = Number(String(value ?? "").trim().replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "1";
  }
  return String(Math.round(numeric * 100) / 100);
}

function normalizeWorkOrderServiceItemSnapshot(item = {}) {
  const name = normalizeText(item.name);
  const serviceCode = normalizeText(item.serviceCode);

  if (!name && !serviceCode) {
    return null;
  }

  const linkedTemplateIds = normalizeIdList(item.linkedTemplateIds);
  const linkedTemplateTitles = Array.isArray(item.linkedTemplateTitles)
    ? item.linkedTemplateTitles.map((value) => normalizeText(value)).filter(Boolean)
    : [];
  const linkedLearningTestIds = normalizeIdList(item.linkedLearningTestIds);
  const linkedLearningTestTitles = Array.isArray(item.linkedLearningTestTitles)
    ? item.linkedLearningTestTitles.map((value) => normalizeText(value)).filter(Boolean)
    : [];
  const linkedQualificationKeys = normalizeQualificationKeyList(item.linkedQualificationKeys ?? item.linkedQualificationExamKeys ?? []);
  const serviceStatus = normalizeWorkOrderServiceProgressStatus(
    item.serviceStatus ?? item.progressStatus ?? item.workStatus,
    normalizeBoolean(item.isCompleted, false) ? "completed" : "pending",
  );

  return {
    serviceId: normalizeId(item.serviceId || item.id),
    name,
    serviceCode,
    serviceType: normalizeServiceCatalogType(
      item.serviceType,
      normalizeBoolean(item.isTraining, false) ? "znr" : "inspection",
    ),
    validityMonths: normalizeServiceValidityMonths(item.validityMonths),
    linkedTemplateIds,
    linkedTemplateTitles: Array.from(new Set(linkedTemplateTitles)),
    linkedLearningTestIds,
    linkedLearningTestTitles: Array.from(new Set(linkedLearningTestTitles)),
    linkedQualificationKeys,
    quantity: normalizeWorkOrderServiceQuantity(item.quantity ?? item.measurementQuantity ?? item.count ?? 1),
    isTraining: normalizeServiceCatalogType(
      item.serviceType,
      normalizeBoolean(item.isTraining, false) ? "znr" : "inspection",
    ) === "znr",
    serviceStatus,
    isCompleted: serviceStatus === "completed",
  };
}

function normalizeWorkOrderServiceItemsInput(items = [], state, currentItems = [], organizationId = "") {
  if (!Array.isArray(items)) {
    return [];
  }

  const currentMap = new Map();
  currentItems
    .map((item) => normalizeWorkOrderServiceItemSnapshot(item))
    .filter(Boolean)
    .forEach((item) => {
      const key = item.serviceId || `${item.serviceCode.toLowerCase()}::${item.name.toLowerCase()}`;
      currentMap.set(key, item);
    });

  const seen = new Set();
  const normalizedItems = [];

  items.forEach((entry) => {
    const serviceId = normalizeId(entry?.serviceId || entry?.id);
    const service = serviceId ? findServiceCatalogItem(state, serviceId, organizationId) : null;
    const name = service?.name || normalizeText(entry?.name);
    const serviceCode = service?.serviceCode || normalizeText(entry?.serviceCode);
    const currentKey = serviceId || `${serviceCode.toLowerCase()}::${name.toLowerCase()}`;
    const current = currentMap.get(currentKey) ?? currentMap.get(serviceId);

    if (serviceId && !service && !current) {
      throw new Error("Odabrana usluga ne postoji.");
    }

    if (!name && !serviceCode) {
      return;
    }

    const templateSnapshot = deriveServiceTemplateSnapshot(
      state,
      service?.linkedTemplateIds ?? entry?.linkedTemplateIds ?? current?.linkedTemplateIds ?? [],
      service?.linkedTemplateTitles ?? entry?.linkedTemplateTitles ?? current?.linkedTemplateTitles ?? [],
    );
    const learningTestSnapshot = deriveServiceLearningTestSnapshot(
      state,
      service?.linkedLearningTestIds ?? entry?.linkedLearningTestIds ?? current?.linkedLearningTestIds ?? [],
      service?.linkedLearningTestTitles ?? entry?.linkedLearningTestTitles ?? current?.linkedLearningTestTitles ?? [],
    );
    const serviceType = normalizeServiceCatalogType(
      service?.serviceType,
      normalizeText(entry?.serviceType)
        || normalizeText(current?.serviceType)
        || (normalizeBoolean(
          service?.isTraining,
          normalizeBoolean(entry?.isTraining, normalizeBoolean(current?.isTraining, false)),
        ) ? "znr" : "inspection"),
    );

    const serviceStatus = normalizeWorkOrderServiceProgressStatus(
      entry?.serviceStatus ?? entry?.progressStatus ?? entry?.workStatus,
      hasOwn(entry ?? {}, "isCompleted")
        ? (normalizeBoolean(entry.isCompleted, false) ? "completed" : "pending")
        : normalizeWorkOrderServiceProgressStatus(current?.serviceStatus, normalizeBoolean(current?.isCompleted, false) ? "completed" : "pending"),
    );

    const normalizedItem = {
      serviceId: serviceId || current?.serviceId || "",
      name: name || current?.name || "",
      serviceCode: serviceCode || current?.serviceCode || "",
      serviceType,
      validityMonths: normalizeServiceValidityMonths(
        service?.validityMonths ?? entry?.validityMonths ?? current?.validityMonths,
      ),
      ...templateSnapshot,
      ...learningTestSnapshot,
      quantity: normalizeWorkOrderServiceQuantity(entry?.quantity ?? entry?.measurementQuantity ?? current?.quantity ?? 1),
      isTraining: serviceType === "znr",
      serviceStatus,
      isCompleted: serviceStatus === "completed",
    };

    const dedupeKey = normalizedItem.serviceId || `${normalizedItem.serviceCode.toLowerCase()}::${normalizedItem.name.toLowerCase()}`;
    if (!dedupeKey || seen.has(dedupeKey)) {
      return;
    }

    seen.add(dedupeKey);
    normalizedItems.push(normalizedItem);
  });

  const serviceTypes = Array.from(new Set(
    normalizedItems
      .map((item) => normalizeServiceCatalogType(item.serviceType, item.isTraining ? "znr" : "inspection"))
      .filter(Boolean),
  ));

  if (serviceTypes.length > 1) {
    throw new Error("Na istom radnom nalogu ne mogu biti usluge različitih vrsta.");
  }

  return normalizedItems;
}

export function getWorkOrderServiceItems(workOrder = {}) {
  return (Array.isArray(workOrder?.serviceItems) ? workOrder.serviceItems : [])
    .map((item) => normalizeWorkOrderServiceItemSnapshot(item))
    .filter(Boolean);
}

export function getWorkOrderServiceSummary(workOrder = {}) {
  const safeWorkOrder = workOrder && typeof workOrder === "object" ? workOrder : {};
  const serviceItems = getWorkOrderServiceItems(safeWorkOrder);

  if (serviceItems.length === 0) {
    return normalizeText(safeWorkOrder.serviceLine);
  }

  return serviceItems.map((item) => item.name || item.serviceCode).filter(Boolean).join(" · ");
}

export function getWorkOrderCompletedServiceCount(workOrder = {}) {
  return getWorkOrderServiceItems(workOrder).filter((item) => item.isCompleted).length;
}

function slugifyTemplateKey(value, fallback = "FIELD") {
  const normalized = normalizeText(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

  return (normalized || fallback).slice(0, 48);
}

function createDefaultDocumentTemplateSections() {
  return [
    {
      type: "cover",
      title: "Naslovnica",
      body: "{{DOCUMENT_TYPE}}\n{{COMPANY_NAME}}\n{{LOCATION_NAME}}\nDatum: {{TODAY}}",
      columns: [],
      rowCount: 0,
    },
    {
      type: "rich_text",
      title: "Uvod",
      body: "Na temelju {{LEGAL_REFERENCES_INLINE}} izvršen je pregled sustava za {{COMPANY_NAME}} na lokaciji {{LOCATION_NAME}}.",
      columns: [],
      rowCount: 0,
    },
    {
      type: "legal_list",
      title: "Primjenjivi propisi",
      body: "U nastavku je popis propisa i normi na koje se zapisnik poziva.",
      columns: [],
      rowCount: 0,
    },
    {
      type: "equipment_list",
      title: "Obuhvacena oprema",
      body: "Popis opreme predvidene za pregled i evidenciju.",
      columns: [],
      rowCount: 0,
    },
    {
      type: "measurement_table",
      title: "Mjerenja i evidencija",
      body: "Tablica za unos rezultata mjerenja ili excel dio zapisnika.",
      columns: ["Pozicija", "Opis", "Vrijednost", "Granica", "Napomena"],
      rowCount: 12,
    },
    {
      type: "signatures",
      title: "Potpisi",
      body: "Mjesto za potpis odgovorne osobe i izvodaca radova.",
      columns: [],
      rowCount: 0,
    },
  ];
}

function normalizeDocumentTemplateBuilderDocument(value = []) {
  if (!Array.isArray(value)) {
    return [];
  }

  try {
    return JSON.parse(JSON.stringify(value)).filter((page) => (
      page && typeof page === "object" && String(page.type || "") === "page"
    ));
  } catch {
    return [];
  }
}

function normalizeDocumentTemplateReferenceDocument(value, fallback = null) {
  if (value === null) {
    return null;
  }

  if (!value || typeof value !== "object") {
    return fallback ? normalizeDocumentTemplateReferenceDocument(fallback, null) : null;
  }

  const fileName = normalizeText(value.fileName ?? value.name);
  const fileType = normalizeText(value.fileType ?? value.mimeType);
  const dataUrl = normalizeText(value.dataUrl);
  const builderDocument = normalizeDocumentTemplateBuilderDocument(value.builderDocument ?? value.builder_document);
  const lowerFileName = fileName.toLowerCase();
  const lowerFileType = fileType.toLowerCase();
  const isHtmlReference = lowerFileName.endsWith(".html")
    || lowerFileName.endsWith(".htm")
    || lowerFileType.startsWith("text/html");
  const isWordReference = lowerFileName.endsWith(".docx")
    || lowerFileName.endsWith(".dotx")
    || lowerFileType.includes("wordprocessingml.document")
    || lowerFileType.includes("wordprocessingml.template");

  if (!fileName || (!dataUrl && (!isHtmlReference || builderDocument.length === 0)) || (!isHtmlReference && !isWordReference)) {
    return fallback ? normalizeDocumentTemplateReferenceDocument(fallback, null) : null;
  }

  return {
    fileName: fileName.slice(0, 255),
    fileType: fileType.slice(0, 160),
    dataUrl,
    builderDocument: isHtmlReference ? builderDocument : [],
    updatedAt: normalizeOptionalDateTime(value.updatedAt) ?? isoNow(),
  };
}

function normalizeDocumentTemplateFields(fields = []) {
  const source = Array.isArray(fields) ? fields : [];
  const seenKeys = new Set();

  return source.map((field, index) => {
    const label = normalizeText(field?.label) || `Polje ${index + 1}`;
    const wordLabel = normalizeText(field?.wordLabel) || label;
    let key = slugifyTemplateKey(field?.key || field?.wordLabel || field?.label || `FIELD_${index + 1}`);
    const type = normalizeDocumentTemplateFieldType(field?.type);
    const columns = Array.isArray(field?.columns)
      ? field.columns.map((entry) => normalizeText(entry)).filter(Boolean)
      : String(field?.columns ?? "")
        .split(/[\n,]/)
        .map((entry) => normalizeText(entry))
        .filter(Boolean);
    const legacyRowCount = Math.max(4, Math.min(120, Math.round(normalizeFiniteNumber(field?.rowCount, 12))));
    const normalizedSheet = type === "measurement_table"
      ? (normalizeWorkOrderMeasurementSheet(field?.sheet ?? field?.measurementSheet)
        ?? buildLegacyTemplateMeasurementSheet(columns, legacyRowCount))
      : null;
    const normalizedSystemRows = type === "system_description"
      ? normalizeDocumentTemplateSystemDescriptionRows(field?.systemRows ?? field?.rows ?? [])
      : [];
    const source = normalizeDocumentTemplateFieldSource(field?.source ?? field?.bindingSource);

    while (seenKeys.has(key)) {
      key = slugifyTemplateKey(`${key}_${index + 1}`, `FIELD_${index + 1}`);
    }

    seenKeys.add(key);

    return {
      id: normalizeText(field?.id) || crypto.randomUUID(),
      key,
      label,
      wordLabel,
      type,
      required: normalizeBoolean(field?.required, false),
      trackPeriodics: isDocumentTemplatePeriodicsTrackableField({
        ...field,
        key,
        label,
        wordLabel,
        type,
        source,
      })
        ? normalizeBoolean(field?.trackPeriodics ?? field?.periodicsTracked, false)
        : false,
      layoutWidth: normalizeDocumentTemplateFieldLayoutWidth(field?.layoutWidth, type),
      fieldHeight: normalizeDocumentTemplateFieldHeight(field?.fieldHeight, type),
      htmlStyle: normalizeDocumentTemplateHtmlStyle(field?.htmlStyle),
      source,
      sourceTable: normalizeText(field?.sourceTable).toLowerCase().slice(0, 80),
      lookupColumn: normalizeText(field?.lookupColumn).toLowerCase().slice(0, 80),
      lookupValueSource: normalizeText(field?.lookupValueSource).toUpperCase().slice(0, 80) || "WORK_ORDER_NUMBER",
      lookupValue: normalizeText(field?.lookupValue),
      valueColumn: normalizeText(field?.valueColumn).toLowerCase().slice(0, 80),
      previousDocumentMode: normalizeText(field?.previousDocumentMode).toUpperCase().slice(0, 80) || "NONE",
      signatureArea: normalizeText(field?.signatureArea).toLowerCase() || "elektro",
      signatureRole: normalizeText(field?.signatureRole).toLowerCase() || (type === "authorization_holder_signature" ? "authorize" : "inspect"),
      signatureMultiple: type === "authorization_holder_signature" || type === "inspector_signature"
        ? false
        : normalizeBoolean(field?.signatureMultiple, true),
      signatureIncludeScan: normalizeBoolean(field?.signatureIncludeScan, false),
      signatureMetaFields: normalizeDocumentTemplateSignatureMetaFields(field?.signatureMetaFields),
      sectionSubtitle: type === "system_description"
        ? normalizeText(field?.sectionSubtitle).slice(0, 280)
        : "",
      systemRows: normalizedSystemRows,
      legalFrameworkIds: normalizeIdList(field?.legalFrameworkIds ?? field?.availableLegalFrameworkIds ?? []),
      defaultLegalFrameworkIds: normalizeIdList(field?.defaultLegalFrameworkIds ?? field?.preselectedLegalFrameworkIds ?? []),
      defaultValue: normalizeText(field?.defaultValue),
      helpText: normalizeText(field?.helpText),
      textListStyle: type === "text" || type === "longtext"
        ? normalizeDocumentTemplateTextListStyle(field?.textListStyle ?? field?.listStyle)
        : "none",
      ai: normalizeDocumentTemplateFieldAiConfig(field?.ai ?? field?.aiConfig, {
        key,
        label,
        wordLabel,
        type,
        helpText: field?.helpText,
        defaultValue: field?.defaultValue,
      }),
      toggleTrueLabel: normalizeText(field?.toggleTrueLabel).slice(0, 120),
      toggleFalseLabel: normalizeText(field?.toggleFalseLabel).slice(0, 120),
      toggleTrueText: normalizeText(field?.toggleTrueText ?? field?.toggleTrueDetailText).slice(0, 500),
      toggleFalseText: normalizeText(field?.toggleFalseText ?? field?.toggleFalseDetailText).slice(0, 500),
      dropdownOptions: type === "dropdown"
        ? normalizeDocumentTemplateDropdownOptions(field?.dropdownOptions ?? field?.options ?? field?.choices)
        : [],
      columns: type === "measurement_table"
        ? (normalizedSheet?.columns?.map((column) => column.label).filter(Boolean).slice(0, 16)
          ?? (columns.length > 0 ? columns.slice(0, 16) : ["Pozicija", "Opis", "Vrijednost", "Granica", "Napomena"]))
        : [],
      rowCount: type === "measurement_table"
        ? legacyRowCount
        : 0,
      sheet: normalizedSheet,
    };
  });
}

function normalizeDocumentTemplateSystemDescriptionLineCount(value = 1) {
  return Math.max(1, Math.min(8, Math.round(normalizeFiniteNumber(value, 1))));
}

function normalizeDocumentTemplateSystemDescriptionRows(rows = []) {
  const source = Array.isArray(rows) ? rows : [];
  const normalizedRows = source
    .slice(0, 16)
    .map((row, index) => ({
      id: normalizeText(row?.id) || `system-description-row-${index + 1}`,
      subtitle: normalizeText(row?.subtitle ?? row?.label).slice(0, 160),
      description: String(row?.description ?? row?.value ?? "").replace(/\r\n/g, "\n").slice(0, 4000),
      lineCount: normalizeDocumentTemplateSystemDescriptionLineCount(row?.lineCount ?? row?.rows),
      placeholder: normalizeText(row?.placeholder).slice(0, 220),
    }));

  if (normalizedRows.length > 0) {
    return normalizedRows;
  }

  return [{
    id: "system-description-row-1",
    subtitle: "",
    description: "",
    lineCount: 1,
    placeholder: "",
  }];
}

function normalizeDocumentTemplateEquipmentItems(items = []) {
  const source = Array.isArray(items) ? items : [];

  return source.map((item, index) => ({
    id: normalizeText(item?.id) || crypto.randomUUID(),
    name: normalizeText(item?.name) || `Oprema ${index + 1}`,
    code: normalizeText(item?.code),
    quantity: roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(item?.quantity, 1))),
    note: normalizeText(item?.note),
  }));
}

function normalizeDocumentTemplateSections(sections = []) {
  const source = Array.isArray(sections) ? sections : [];

  return source.map((section, index) => {
    const type = normalizeDocumentTemplateSectionType(section?.type);
    const defaultColumns = type === "measurement_table"
      ? ["Pozicija", "Opis", "Vrijednost", "Granica", "Napomena"]
      : [];
    const columns = Array.isArray(section?.columns)
      ? section.columns.map((entry) => normalizeText(entry)).filter(Boolean)
      : defaultColumns;
    const legacyRowCount = Math.max(4, Math.min(120, Math.round(normalizeFiniteNumber(section?.rowCount, 12))));
    const normalizedSheet = type === "measurement_table"
      ? (normalizeWorkOrderMeasurementSheet(section?.sheet ?? section?.measurementSheet)
        ?? buildLegacyTemplateMeasurementSheet(columns, legacyRowCount))
      : null;

    return {
      id: normalizeText(section?.id) || crypto.randomUUID(),
      type,
      title: normalizeText(section?.title)
        || DOCUMENT_TEMPLATE_SECTION_TYPE_OPTIONS.find((option) => option.value === type)?.label
        || `Sekcija ${index + 1}`,
      body: normalizeText(section?.body),
      columns: type === "measurement_table"
        ? (normalizedSheet?.columns?.map((column) => column.label).filter(Boolean).slice(0, 16)
          ?? (columns.length > 0 ? columns.slice(0, 16) : defaultColumns))
        : (columns.length > 0 ? columns.slice(0, 16) : defaultColumns),
      rowCount: type === "measurement_table"
        ? legacyRowCount
        : 0,
      sheet: normalizedSheet,
    };
  });
}

export function deriveOfferInitials(value) {
  const normalizedValue = normalizeText(value).trim();
  const raw = normalizedValue
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const tokens = raw
    .split(/[\s._-]+/u)
    .map((token) => token.replace(/[^A-Za-z0-9]/gu, ""))
    .filter(Boolean);
  const compact = raw.replace(/[^A-Za-z0-9]/gu, "").toUpperCase();
  const looksLikeInitials = /^[A-Z0-9]{1,4}$/u.test(normalizedValue.replace(/[\s._-]+/gu, ""));

  if (looksLikeInitials && compact) {
    return compact.slice(0, 4);
  }

  const initials = tokens.map((token) => token[0]).join("").toUpperCase();

  if (initials) {
    return initials.slice(0, 4);
  }

  return (compact || "SN").slice(0, 4);
}

function normalizeOfferBreakdowns(breakdowns = []) {
  if (!Array.isArray(breakdowns)) {
    return [];
  }

  return breakdowns
    .map((entry) => {
      const amount = roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(entry?.amount, 0)));
      const recordLabel = normalizeText(entry?.recordLabel ?? entry?.reportLabel ?? entry?.label);
      const priceKind = normalizeText(entry?.priceKind ?? entry?.type ?? entry?.kind);
      const unitLabel = normalizeText(entry?.unitLabel ?? entry?.description ?? entry?.priceLabel);
      const measurementFrom = normalizeText(entry?.measurementFrom ?? entry?.measurementFromNumber ?? entry?.from);
      const measurementTo = normalizeText(entry?.measurementTo ?? entry?.measurementToNumber ?? entry?.to);
      const label = normalizeText(entry?.label) || unitLabel || recordLabel;

      return {
        label,
        priceKind,
        unitLabel,
        recordLabel,
        measurementFrom,
        measurementTo,
        amount,
      };
    })
    .filter((entry) => entry.recordLabel || entry.unitLabel || entry.measurementFrom || entry.measurementTo || entry.amount);
}

function normalizeCommercialDocumentMode(value = "", fallback = "app") {
  const normalized = normalizeText(value).toLowerCase();
  return normalized === "upload" || normalized === "standalone" || normalized === "manual"
    ? "upload"
    : fallback === "upload"
      ? "upload"
      : "app";
}

function normalizeOfferItems(items = [], { allowEmpty = false } = {}) {
  if (!Array.isArray(items)) {
    throw new Error("Stavke ponude moraju biti lista.");
  }

  const normalizedItems = items
    .map((item) => {
      const isIncludedService = Boolean(item?.isIncludedService || item?.includedService || item?.includedInPlan || item?.included);
      const quantity = isIncludedService ? 0 : roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(item?.quantity, 0)));
      const unitPrice = isIncludedService ? 0 : roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(item?.unitPrice, 0)));
      const breakdowns = normalizeOfferBreakdowns(item?.breakdowns);
      const breakdownTotal = roundCurrencyAmount(
        breakdowns.reduce((sum, entry) => sum + roundCurrencyAmount(entry.amount), 0),
      );
      const grossTotal = isIncludedService
        ? 0
        : breakdowns.length > 0
        ? breakdownTotal
        : roundCurrencyAmount(quantity * unitPrice);
      const discountRate = isIncludedService ? 0 : normalizeOfferDiscountRate(item?.discountRate);
      const discountTotal = roundCurrencyAmount(grossTotal * (discountRate / 100));

      return {
        serviceCatalogId: normalizeText(item?.serviceCatalogId),
        serviceCode: normalizeText(item?.serviceCode),
        description: normalizeText(item?.description),
        unit: isIncludedService ? "" : normalizeText(item?.unit),
        quantity,
        unitPrice,
        isIncludedService,
        breakdowns: isIncludedService ? [] : breakdowns,
        breakdownTotal,
        discountRate,
        discountTotal,
        totalPrice: roundCurrencyAmount(grossTotal - discountTotal),
      };
    })
    .filter((item) => (
      item.description
      || item.quantity
      || item.unitPrice
      || item.breakdowns.length > 0
      || item.isIncludedService
      || item.discountRate > 0
    ));

  if (normalizedItems.length === 0) {
    if (allowEmpty) {
      return [];
    }

    throw new Error("Dodaj barem jednu stavku ponude.");
  }

  return normalizedItems;
}

function normalizeVehiclePlateNumber(value) {
  return normalizeText(value).replace(/\s+/g, " ").toUpperCase();
}

function normalizeVehicleVinNumber(value) {
  return normalizeText(value).replace(/\s+/g, "").toUpperCase().slice(0, 64);
}

function normalizeVehicleInteger(value, fallback = null) {
  const raw = normalizeText(value);

  if (!raw) {
    return fallback;
  }

  const numeric = Math.round(normalizeFiniteNumber(raw, Number.NaN));
  return Number.isFinite(numeric) ? Math.max(0, numeric) : fallback;
}

function compareVehicleActivityRecency(left = {}, right = {}) {
  const leftDate = normalizeText(left.returnAt ?? left.departureAt ?? left.performedOn);
  const rightDate = normalizeText(right.returnAt ?? right.departureAt ?? right.performedOn);

  if (leftDate && rightDate && leftDate !== rightDate) {
    return rightDate.localeCompare(leftDate);
  }

  if (leftDate && !rightDate) {
    return -1;
  }

  if (!leftDate && rightDate) {
    return 1;
  }

  const leftUpdated = normalizeText(left.updatedAt ?? left.createdAt);
  const rightUpdated = normalizeText(right.updatedAt ?? right.createdAt);

  if (leftUpdated && rightUpdated && leftUpdated !== rightUpdated) {
    return rightUpdated.localeCompare(leftUpdated);
  }

  return normalizeText(right.id).localeCompare(normalizeText(left.id));
}

function normalizeVehicleActivityItems(items = [], now = isoNow) {
  if (!Array.isArray(items)) {
    return [];
  }

  const timestamp = now();

  return items.map((item) => {
    const activityType = normalizeText(item?.activityType ?? item?.type).toLowerCase().slice(0, 64);
    const performedOn = normalizeOptionalDate(item?.performedOn ?? item?.date);
    const performedBy = normalizeText(item?.performedBy ?? item?.actor).slice(0, 180);
    const validUntil = normalizeOptionalDate(item?.validUntil);
    const workSummary = normalizeText(item?.workSummary ?? item?.workPerformed ?? item?.works).slice(0, 240);
    const note = normalizeText(item?.note);
    const odometerKm = normalizeVehicleInteger(item?.odometerKm, null);
    const tripStatus = normalizeText(item?.tripStatus).toLowerCase().slice(0, 32);
    const reservationId = normalizeId(item?.reservationId);
    const departureAt = normalizeOptionalDateTime(item?.departureAt ?? item?.startedAt ?? item?.startAt);
    const returnAt = normalizeOptionalDateTime(item?.returnAt ?? item?.endedAt ?? item?.endAt);
    const destination = normalizeText(item?.destination ?? item?.route ?? item?.location).slice(0, 180);
    const driverLabels = Array.isArray(item?.driverLabels)
      ? item.driverLabels.map((value) => normalizeText(value).slice(0, 180)).filter(Boolean)
      : [normalizeText(item?.driverLabel ?? item?.driver ?? item?.performedBy).slice(0, 180)].filter(Boolean);
    const startKm = normalizeVehicleInteger(item?.startKm ?? item?.startOdometerKm, null);
    const endKm = normalizeVehicleInteger(item?.endKm ?? item?.endOdometerKm, null);
    const vehicleCondition = normalizeText(item?.vehicleCondition ?? item?.condition).slice(0, 240);
    const departureCondition = normalizeText(item?.departureCondition).slice(0, 240);
    const returnCondition = normalizeText(item?.returnCondition).slice(0, 240);
    const linkedWorkOrderId = normalizeId(item?.linkedWorkOrderId ?? item?.workOrderId);
    const linkedWorkOrderNumber = normalizeText(item?.linkedWorkOrderNumber ?? item?.workOrderNumber).slice(0, 80);
    const documents = normalizeAttachmentDocuments(item?.documents ?? item?.attachments ?? []);
    const hasAnyData = Boolean(
      activityType
      || performedOn
      || performedBy
      || validUntil
      || workSummary
      || note
      || normalizeText(item?.odometerKm)
      || tripStatus
      || reservationId
      || departureAt
      || returnAt
      || destination
      || driverLabels.length
      || normalizeText(item?.startKm ?? item?.startOdometerKm)
      || normalizeText(item?.endKm ?? item?.endOdometerKm)
      || vehicleCondition
      || departureCondition
      || returnCondition
      || linkedWorkOrderId
      || linkedWorkOrderNumber
      || documents.length
    );

    if (!hasAnyData) {
      return null;
    }

    return {
      id: normalizeId(item?.id) || crypto.randomUUID(),
      activityType,
      performedOn,
      performedBy,
      validUntil,
      odometerKm,
      workSummary,
      note,
      tripStatus,
      reservationId,
      departureAt,
      returnAt,
      destination,
      driverLabels,
      startKm,
      endKm,
      vehicleCondition,
      departureCondition,
      returnCondition,
      linkedWorkOrderId,
      linkedWorkOrderNumber,
      documents,
      createdAt: normalizeOptionalDateTime(item?.createdAt) ?? timestamp,
      updatedAt: normalizeOptionalDateTime(item?.updatedAt ?? item?.createdAt) ?? timestamp,
    };
  }).filter(Boolean).sort(compareVehicleActivityRecency);
}

function normalizeVehicleReservations(reservations = []) {
  if (!Array.isArray(reservations)) {
    return [];
  }

  return reservations
    .map((reservation) => {
      const startAt = normalizeOptionalDateTime(reservation?.startAt);
      const endAt = normalizeOptionalDateTime(reservation?.endAt);

      if (!startAt || !endAt) {
        return null;
      }

      const reservedForUserIds = Array.isArray(reservation?.reservedForUserIds)
        ? reservation.reservedForUserIds.map((value) => normalizeText(value)).filter(Boolean)
        : [normalizeText(reservation?.reservedForUserId)].filter(Boolean);
      const reservedForLabels = Array.isArray(reservation?.reservedForLabels)
        ? reservation.reservedForLabels.map((value) => normalizeText(value)).filter(Boolean)
        : [normalizeText(reservation?.reservedForLabel)].filter(Boolean);

      return {
        id: normalizeId(reservation?.id),
        vehicleId: normalizeId(reservation?.vehicleId),
        status: normalizeVehicleReservationStatus(reservation?.status),
        purpose: normalizeText(reservation?.purpose),
        reservedForUserIds,
        reservedForLabels,
        reservedForUserId: reservedForUserIds[0] ?? normalizeText(reservation?.reservedForUserId),
        reservedForLabel: reservedForLabels.join(", ") || normalizeText(reservation?.reservedForLabel),
        destination: normalizeText(reservation?.destination),
        startAt,
        endAt,
        note: normalizeText(reservation?.note),
        createdByUserId: normalizeText(reservation?.createdByUserId),
        createdByLabel: normalizeText(reservation?.createdByLabel),
        createdAt: normalizeOptionalDateTime(reservation?.createdAt) ?? isoNow(),
        updatedAt: normalizeOptionalDateTime(reservation?.updatedAt) ?? isoNow(),
      };
    })
    .filter(Boolean);
}

function findVehicleById(state, vehicleId = "") {
  if (!vehicleId) {
    return null;
  }

  return (state.vehicles ?? []).find((item) => item.id === vehicleId) ?? null;
}

function findVehicleReservationById(vehicle, reservationId = "") {
  if (!vehicle || !reservationId) {
    return null;
  }

  return (vehicle.reservations ?? []).find((item) => item.id === reservationId) ?? null;
}

function isVehicleReservationActive(reservation, nowValue = isoNow()) {
  if (!reservation || !ACTIVE_VEHICLE_RESERVATION_STATUSES.has(normalizeVehicleReservationStatus(reservation.status))) {
    return false;
  }

  const endAt = Date.parse(reservation.endAt ?? "");
  const nowTimestamp = Date.parse(nowValue);

  return Number.isFinite(endAt) && Number.isFinite(nowTimestamp) ? endAt > nowTimestamp : false;
}

function reservationsOverlap(left, right) {
  const leftStart = Date.parse(left?.startAt ?? "");
  const leftEnd = Date.parse(left?.endAt ?? "");
  const rightStart = Date.parse(right?.startAt ?? "");
  const rightEnd = Date.parse(right?.endAt ?? "");

  if (![leftStart, leftEnd, rightStart, rightEnd].every(Number.isFinite)) {
    return false;
  }

  return leftStart < rightEnd && leftEnd > rightStart;
}

function assertVehiclePlateUnique(state, organizationId, plateNumber, currentVehicleId = "") {
  if (!plateNumber) {
    return;
  }

  const duplicate = (state.vehicles ?? []).find((item) => (
    String(item.organizationId) === String(organizationId)
    && normalizeVehiclePlateNumber(item.plateNumber) === plateNumber
    && String(item.id) !== String(currentVehicleId)
  ));

  if (duplicate) {
    throw new Error("Vozilo s ovom registracijom vec postoji.");
  }
}

function assertVehicleReservationWindow(startAt, endAt) {
  if (!startAt || !endAt) {
    throw new Error("Odaberi pocetak i kraj rezervacije.");
  }

  const startTimestamp = Date.parse(startAt);
  const endTimestamp = Date.parse(endAt);

  if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
    throw new Error("Termin rezervacije nije ispravan.");
  }

  if (endTimestamp <= startTimestamp) {
    throw new Error("Kraj rezervacije mora biti nakon pocetka.");
  }
}

function assertVehicleReservationConflict(vehicle, candidate, excludeReservationId = "") {
  const hasConflict = (vehicle?.reservations ?? []).some((reservation) => {
    if (String(reservation.id) === String(excludeReservationId)) {
      return false;
    }

    if (!ACTIVE_VEHICLE_RESERVATION_STATUSES.has(normalizeVehicleReservationStatus(reservation.status))) {
      return false;
    }

    if (!ACTIVE_VEHICLE_RESERVATION_STATUSES.has(normalizeVehicleReservationStatus(candidate.status))) {
      return false;
    }

    return reservationsOverlap(reservation, candidate);
  });

  if (hasConflict) {
    throw new Error("Vozilo je vec rezervirano u odabranom terminu.");
  }
}

function normalizeClientPortalRecordDetails(inputDetails = {}, type = "deadline") {
  const details = inputDetails && typeof inputDetails === "object" ? inputDetails : {};
  const text = (value, maxLength = 600) => normalizeText(value).slice(0, maxLength);
  const date = (value) => normalizeOptionalDate(value);

  if (type === "worker") {
    return withClientPortalRecordAttachments(details, {
      fullName: text(details.fullName ?? details.name, 180),
      riskWorkplaceKey: text(details.riskWorkplaceKey, 180),
      jobTitle: text(details.jobTitle ?? details.role, 180),
      jobDescription: text(details.jobDescription ?? details.workDescription, 4000),
      email: text(details.email, 180),
      phone: text(details.phone, 80),
      oib: text(details.oib, 32),
      medicalReferralNumber: text(details.medicalReferralNumber ?? details.ra1Number, 120),
      medicalReferralValidUntil: date(details.medicalReferralValidUntil ?? details.ra1ValidUntil),
      medicalCertificateNumber: text(details.medicalCertificateNumber ?? details.healthCertificateNumber, 120),
      medicalCertificateValidUntil: date(details.medicalCertificateValidUntil ?? details.healthCertificateValidUntil),
      visionReferralNumber: text(details.visionReferralNumber, 120),
      visionReferralValidUntil: date(details.visionReferralValidUntil),
      visionCertificateNumber: text(details.visionCertificateNumber, 120),
      visionCertificateValidUntil: date(details.visionCertificateValidUntil),
      psychologicalCheckUntil: date(details.psychologicalCheckUntil ?? details.psychologicalValidUntil),
      medicalWorkplace: text(details.medicalWorkplace ?? details.ra1Workplace, 1000),
      medicalLoadWeights: text(details.medicalLoadWeights ?? details.ra1LoadWeights, 1000),
      medicalWorkOrganization: text(details.medicalWorkOrganization ?? details.ra1WorkOrganization, 1000),
      medicalBodyPositions: text(details.medicalBodyPositions ?? details.ra1BodyPositions, 1000),
      medicalWorkConditions: text(details.medicalWorkConditions ?? details.ra1WorkConditions, 2000),
      medicalEquipment: text(details.medicalEquipment ?? details.ra1Equipment, 2000),
      medicalSubstances: text(details.medicalSubstances ?? details.ra1Substances, 2000),
      note: text(details.note, 1200),
    });
  }

  if (type === "vehicle") {
    return withClientPortalRecordAttachments(details, {
      vehicleName: text(details.vehicleName ?? details.name, 180),
      plateNumber: text(details.plateNumber ?? details.registration, 60).toUpperCase(),
      vehicleType: text(details.vehicleType ?? details.category, 120),
      responsibleWorkerRecordId: text(details.responsibleWorkerRecordId ?? details.workerRecordId, 80),
      responsibleWorkerName: text(details.responsibleWorkerName ?? details.workerName, 180),
      registrationDate: date(details.registrationDate ?? details.registrationExpiresOn),
      insuranceDate: date(details.insuranceDate),
      serviceDate: date(details.serviceDate ?? details.nextServiceDate),
      note: text(details.note, 1200),
    });
  }

  if (type === "fire_extinguisher") {
    const lastInspectionDate = date(details.lastInspectionDate ?? details.lastCheckDate ?? details.lastControlDate);
    const nextInspectionDate = date(details.nextInspectionDate ?? details.nextCheckDate ?? details.nextControlDate)
      || addMonthsToOptionalDate(lastInspectionDate, 3);
    const lastInternalInspectionDate = date(details.lastInternalInspectionDate ?? details.lastInternalReviewDate ?? details.lastInternalControlDate);
    const nextInternalInspectionDate = date(details.nextInternalInspectionDate ?? details.nextInternalReviewDate ?? details.nextInternalControlDate)
      || addMonthsToOptionalDate(lastInternalInspectionDate, 60);
    const lastServiceDate = date(details.lastServiceDate);
    const nextServiceDate = date(details.nextServiceDate ?? details.dueDate)
      || addMonthsToOptionalDate(lastServiceDate, 12);
    return withClientPortalRecordAttachments(details, {
      code: text(details.code ?? details.inventoryCode, 120),
      locationText: text(details.locationText ?? details.location, 180),
      extinguisherType: text(details.extinguisherType ?? details.type, 120),
      lastInspectionDate,
      nextInspectionDate,
      lastInternalInspectionDate,
      nextInternalInspectionDate,
      lastServiceDate,
      nextServiceDate,
      note: text(details.note, 1200),
    });
  }

  if (type === "ppe_assignment") {
    return withClientPortalRecordAttachments(details, {
      workerRecordId: text(details.workerRecordId, 80),
      workerName: text(details.workerName, 180),
      ppeName: text(details.ppeName ?? details.name, 180),
      quantity: text(details.quantity, 80),
      assignedDate: date(details.assignedDate),
      dueDate: date(details.dueDate),
      returnedDate: date(details.returnedDate),
      note: text(details.note, 1200),
    });
  }

  if (type === "defect_report") {
    return withClientPortalRecordAttachments(details, {
      defectTitle: text(details.defectTitle ?? details.title ?? details.name, 220),
      priority: text(details.priority ?? details.severity, 80),
      category: text(details.category, 140),
      reportedDate: date(details.reportedDate ?? details.date),
      dueDate: date(details.dueDate),
      reportedBy: text(details.reportedBy ?? details.ownerName, 180),
      locationText: text(details.locationText ?? details.location, 180),
      description: text(details.description ?? details.note, 2000),
      action: text(details.action ?? details.correctiveAction, 2000),
    });
  }

  if (type === "internal_inspection") {
    return withClientPortalRecordAttachments(details, {
      inspectionTitle: text(details.inspectionTitle ?? details.title ?? details.name, 220),
      area: text(details.area ?? details.scope ?? details.category, 180),
      inspectionDate: date(details.inspectionDate ?? details.date),
      dueDate: date(details.dueDate ?? details.nextInspectionDate),
      inspectorName: text(details.inspectorName ?? details.ownerName ?? details.responsiblePerson, 180),
      result: text(details.result ?? details.statusText, 120),
      finding: text(details.finding ?? details.description ?? details.note, 2000),
      correctiveAction: text(details.correctiveAction ?? details.action, 2000),
      documentName: text(details.documentName ?? details.fileName, 220),
    });
  }

  if (type === "alcohol_test") {
    return withClientPortalRecordAttachments(details, {
      workerRecordId: text(details.workerRecordId, 80),
      workerName: text(details.workerName, 180),
      testDate: date(details.testDate ?? details.date ?? details.testedDate),
      result: text(details.result, 120),
      measuredValue: text(details.measuredValue ?? details.value, 80),
      testerName: text(details.testerName ?? details.ownerName, 180),
      nextTestDate: date(details.nextTestDate ?? details.dueDate),
      documentName: text(details.documentName ?? details.fileName, 220),
      note: text(details.note, 1200),
    });
  }

  if (type === "document") {
    return withClientPortalRecordAttachments(details, {
      documentName: text(details.documentName ?? details.title ?? details.name, 220),
      documentType: text(details.documentType ?? details.type, 120),
      fileName: text(details.fileName, 220),
      fileUrl: text(details.fileUrl ?? details.url, 1200),
      documentDate: date(details.documentDate ?? details.issuedDate ?? details.date),
      validUntil: date(details.validUntil ?? details.dueDate),
      ownerName: text(details.ownerName ?? details.owner, 180),
      note: text(details.note ?? details.description, 1200),
    });
  }

  return withClientPortalRecordAttachments(details, {
    deadlineName: text(details.deadlineName ?? details.name, 220),
    deadlineType: text(details.deadlineType ?? details.type ?? details.category, 160),
    dueDate: date(details.dueDate),
    ownerName: text(details.ownerName ?? details.owner, 180),
    description: text(details.description ?? details.note, 2000),
  });
}

function resolveClientPortalRecordDueDate(type, details = {}, input = {}, current = null) {
  const explicit = hasOwn(input, "dueDate") ? normalizeOptionalDate(input.dueDate) : null;
  if (explicit) {
    return explicit;
  }

  if (type === "worker") {
    return getEarliestOptionalDate(
      details.medicalCertificateValidUntil,
      details.visionCertificateValidUntil,
      details.psychologicalCheckUntil,
      details.medicalReferralValidUntil,
      details.visionReferralValidUntil,
    );
  }
  if (type === "vehicle") {
    return details.serviceDate || details.registrationDate || details.insuranceDate || null;
  }
  if (type === "fire_extinguisher") {
    return getEarliestOptionalDate(details.nextInspectionDate, details.nextServiceDate, details.nextInternalInspectionDate);
  }
  if (type === "ppe_assignment") {
    return details.dueDate || details.returnedDate || null;
  }
  if (type === "defect_report") {
    return details.dueDate || null;
  }
  if (type === "internal_inspection") {
    return details.dueDate || details.inspectionDate || null;
  }
  if (type === "alcohol_test") {
    return details.nextTestDate || null;
  }
  if (type === "document") {
    return details.validUntil || null;
  }
  if (type === "deadline") {
    return details.dueDate || null;
  }
  return normalizeOptionalDate(current?.dueDate);
}

function buildClientPortalRecordTitle(type, details = {}, input = {}, current = null) {
  const explicitTitle = hasOwn(input, "title") ? normalizeText(input.title) : normalizeText(current?.title);
  if (explicitTitle) {
    return explicitTitle.slice(0, 220);
  }

  if (type === "worker") {
    return (details.fullName || "Radnik").slice(0, 220);
  }
  if (type === "vehicle") {
    return [details.plateNumber, details.vehicleName].filter(Boolean).join(" - ").slice(0, 220) || "Vozilo";
  }
  if (type === "fire_extinguisher") {
    return [details.code, details.extinguisherType].filter(Boolean).join(" - ").slice(0, 220) || "Vatrogasni aparat";
  }
  if (type === "ppe_assignment") {
    return [details.ppeName, details.workerName].filter(Boolean).join(" - ").slice(0, 220) || "OZO zaduzenje";
  }
  if (type === "defect_report") {
    return (details.defectTitle || details.description || "Nedostatak").slice(0, 220);
  }
  if (type === "internal_inspection") {
    return (details.inspectionTitle || details.area || "Unutarnji nadzor").slice(0, 220);
  }
  if (type === "alcohol_test") {
    return [details.workerName, details.result || "Alkotest"].filter(Boolean).join(" - ").slice(0, 220) || "Alkotest";
  }
  if (type === "document") {
    return (details.documentName || details.fileName || "Dokument").slice(0, 220);
  }
  return (details.deadlineName || "Rok").slice(0, 220);
}

function normalizeClientPortalDuplicateKeyPart(value = "") {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function getClientPortalRecordDuplicateIdentity(record = {}) {
  const type = normalizeClientPortalRecordType(record.type);
  const details = normalizeClientPortalRecordDetails(record.details ?? {}, type);
  const companyKey = normalizeClientPortalDuplicateKeyPart(record.companyId);
  const locationKey = normalizeClientPortalDuplicateKeyPart(record.locationId);
  const titleKey = normalizeClientPortalDuplicateKeyPart(record.title);
  const detailKey = (...values) => values
    .map((value) => normalizeClientPortalDuplicateKeyPart(value))
    .find(Boolean) || "";
  const compositeKey = (...values) => values
    .map((value) => normalizeClientPortalDuplicateKeyPart(value))
    .filter(Boolean)
    .join(":");

  let identity = "";
  if (type === "worker") {
    identity = detailKey(details.oib, details.email, details.fullName);
  } else if (type === "vehicle") {
    identity = detailKey(details.plateNumber, details.vehicleName);
  } else if (type === "fire_extinguisher") {
    identity = detailKey(details.code, compositeKey(details.locationText, details.extinguisherType));
  } else if (type === "ppe_assignment") {
    identity = compositeKey(details.workerRecordId || details.workerName, details.ppeName, details.assignedDate || details.dueDate);
  } else if (type === "defect_report") {
    identity = compositeKey(details.defectTitle || titleKey, details.locationText || locationKey, details.reportedDate);
  } else if (type === "internal_inspection") {
    identity = compositeKey(details.inspectionTitle || titleKey, details.area, details.inspectionDate || details.dueDate);
  } else if (type === "alcohol_test") {
    identity = compositeKey(details.workerRecordId || details.workerName, details.testDate, details.result);
  } else if (type === "document") {
    identity = compositeKey(details.documentName || titleKey, details.fileName, details.documentDate || details.validUntil);
  } else {
    identity = compositeKey(details.deadlineName || titleKey, details.deadlineType, details.dueDate, details.ownerName);
  }

  if (!companyKey || !identity) {
    return "";
  }

  return [companyKey, type, locationKey, identity].join("|");
}

function assertClientPortalRecordUnique(state, candidate, excludeId = "") {
  const candidateKey = getClientPortalRecordDuplicateIdentity(candidate);
  if (!candidateKey) {
    return;
  }

  const hasDuplicate = (state.clientPortalRecords ?? []).some((item) => (
    String(item?.id || "") !== String(excludeId || "")
    && getClientPortalRecordDuplicateIdentity(item) === candidateKey
  ));

  if (hasDuplicate) {
    throw new Error("Takav zapis vec postoji u klijentskoj evidenciji.");
  }
}

function hydrateClientPortalRecordCore({
  current = null,
  state,
  input,
  timestamp,
}) {
  const type = hasOwn(input, "type")
    ? normalizeClientPortalRecordType(input.type)
    : normalizeClientPortalRecordType(current?.type);
  const mergedDetails = {
    ...(current?.details ?? {}),
    ...(hasOwn(input, "details") && input.details && typeof input.details === "object" ? input.details : {}),
  };
  let details = normalizeClientPortalRecordDetails(mergedDetails, type);
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const companyId = hasOwn(input, "companyId")
    ? requireText(input.companyId, "Tvrtka")
    : requireText(current?.companyId, "Tvrtka");
  const locationId = hasOwn(input, "locationId")
    ? normalizeText(input.locationId)
    : normalizeText(current?.locationId);
  const company = (state.companies ?? []).find((item) => String(item.id) === String(companyId)) ?? null;
  const location = locationId
    ? (state.locations ?? []).find((item) => String(item.id) === String(locationId)) ?? null
    : null;
  if (type === "ppe_assignment" && details.workerRecordId && !details.workerName) {
    const worker = (state.clientPortalRecords ?? []).find((item) => (
      String(item.id) === String(details.workerRecordId)
      && String(item.companyId) === String(companyId)
      && String(item.type) === "worker"
    ));
    details = {
      ...details,
      workerName: worker?.title || worker?.details?.fullName || "",
    };
  }
  if (type === "alcohol_test" && details.workerRecordId && !details.workerName) {
    const worker = (state.clientPortalRecords ?? []).find((item) => (
      String(item.id) === String(details.workerRecordId)
      && String(item.companyId) === String(companyId)
      && String(item.type) === "worker"
    ));
    details = {
      ...details,
      workerName: worker?.title || worker?.details?.fullName || "",
    };
  }
  if (type === "vehicle" && details.responsibleWorkerRecordId && !details.responsibleWorkerName) {
    const worker = (state.clientPortalRecords ?? []).find((item) => (
      String(item.id) === String(details.responsibleWorkerRecordId)
      && String(item.companyId) === String(companyId)
      && String(item.type) === "worker"
    ));
    details = {
      ...details,
      responsibleWorkerName: worker?.title || worker?.details?.fullName || "",
    };
  }
  const title = buildClientPortalRecordTitle(type, details, input, current);

  if (!title) {
    throw new Error("Naziv zapisa je obavezan.");
  }

  const record = {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: company?.name || current?.companyName || "",
    locationId,
    locationName: location?.name || current?.locationName || "",
    type,
    title,
    status: hasOwn(input, "status")
      ? normalizeClientPortalRecordStatus(input.status)
      : normalizeClientPortalRecordStatus(current?.status),
    dueDate: resolveClientPortalRecordDueDate(type, details, input, current),
    details,
    note: hasOwn(input, "note") ? normalizeText(input.note).slice(0, 2000) : normalizeText(current?.note).slice(0, 2000),
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  assertClientPortalRecordUnique(state, record, current?.id ?? "");
  return record;
}

function hydrateVehicleCore({
  current = null,
  state,
  input,
  timestamp,
}) {
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const name = hasOwn(input, "name")
    ? requireText(input.name, "Naziv vozila")
    : requireText(current?.name, "Naziv vozila");
  const plateNumber = hasOwn(input, "plateNumber")
    ? normalizeVehiclePlateNumber(requireText(input.plateNumber, "Registracija"))
    : normalizeVehiclePlateNumber(requireText(current?.plateNumber, "Registracija"));
  const status = hasOwn(input, "status")
    ? normalizeVehicleStatus(input.status)
    : normalizeVehicleStatus(current?.status);
  const reservations = hasOwn(input, "reservations")
    ? normalizeVehicleReservations(input.reservations)
    : (current?.reservations ?? []).map((reservation) => ({ ...reservation }));

  assertVehiclePlateUnique(state, organizationId, plateNumber, current?.id ?? "");

  return {
    id: current?.id ?? "",
    organizationId,
    name,
    plateNumber,
    vinNumber: hasOwn(input, "vinNumber")
      ? normalizeVehicleVinNumber(input.vinNumber)
      : normalizeVehicleVinNumber(current?.vinNumber),
    make: hasOwn(input, "make") ? normalizeText(input.make) : (current?.make ?? ""),
    model: hasOwn(input, "model") ? normalizeText(input.model) : (current?.model ?? ""),
    category: hasOwn(input, "category") ? normalizeText(input.category) : (current?.category ?? ""),
    year: hasOwn(input, "year")
      ? normalizeVehicleInteger(input.year, null)
      : normalizeVehicleInteger(current?.year, null),
    color: hasOwn(input, "color") ? normalizeText(input.color) : (current?.color ?? ""),
    fuelType: hasOwn(input, "fuelType") ? normalizeText(input.fuelType) : (current?.fuelType ?? ""),
    transmission: hasOwn(input, "transmission") ? normalizeText(input.transmission) : (current?.transmission ?? ""),
    seatCount: hasOwn(input, "seatCount")
      ? normalizeVehicleInteger(input.seatCount, null)
      : normalizeVehicleInteger(current?.seatCount, null),
    odometerKm: hasOwn(input, "odometerKm")
      ? normalizeVehicleInteger(input.odometerKm, 0)
      : normalizeVehicleInteger(current?.odometerKm, 0),
    serviceDueDate: hasOwn(input, "serviceDueDate")
      ? normalizeOptionalDate(input.serviceDueDate)
      : normalizeOptionalDate(current?.serviceDueDate),
    registrationExpiresOn: hasOwn(input, "registrationExpiresOn")
      ? normalizeOptionalDate(input.registrationExpiresOn)
      : normalizeOptionalDate(current?.registrationExpiresOn),
    documents: hasOwn(input, "documents")
      ? normalizeAttachmentDocuments(input.documents)
      : normalizeAttachmentDocuments(current?.documents),
    activityItems: hasOwn(input, "activityItems")
      ? normalizeVehicleActivityItems(input.activityItems, () => timestamp)
      : normalizeVehicleActivityItems(current?.activityItems, () => timestamp),
    notes: hasOwn(input, "notes") ? normalizeText(input.notes) : (current?.notes ?? ""),
    status,
    reservations,
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function normalizeVehicleReservationAssigneeIds(value) {
  const rawItems = Array.isArray(value) ? value : [value];
  return Array.from(new Set(rawItems.map((item) => normalizeText(item)).filter(Boolean)));
}

function normalizeVehicleReservationAssigneeLabels(value) {
  const rawItems = Array.isArray(value) ? value : [value];
  return Array.from(new Set(rawItems.map((item) => normalizeText(item)).filter(Boolean)));
}

function hydrateVehicleReservationCore({
  current = null,
  vehicle,
  input,
  timestamp,
}) {
  const status = hasOwn(input, "status")
    ? normalizeVehicleReservationStatus(input.status)
    : normalizeVehicleReservationStatus(current?.status);
  const startAt = hasOwn(input, "startAt")
    ? normalizeOptionalDateTime(input.startAt)
    : normalizeOptionalDateTime(current?.startAt);
  const endAt = hasOwn(input, "endAt")
    ? normalizeOptionalDateTime(input.endAt)
    : normalizeOptionalDateTime(current?.endAt);
  const reservedForUserIds = hasOwn(input, "reservedForUserIds")
    ? normalizeVehicleReservationAssigneeIds(input.reservedForUserIds)
    : (hasOwn(input, "reservedForUserId")
      ? normalizeVehicleReservationAssigneeIds(input.reservedForUserId)
      : normalizeVehicleReservationAssigneeIds(current?.reservedForUserIds ?? current?.reservedForUserId));
  const reservedForLabels = hasOwn(input, "reservedForLabels")
    ? normalizeVehicleReservationAssigneeLabels(input.reservedForLabels)
    : (hasOwn(input, "reservedForLabel")
      ? normalizeVehicleReservationAssigneeLabels(input.reservedForLabel)
      : normalizeVehicleReservationAssigneeLabels(current?.reservedForLabels ?? current?.reservedForLabel));

  if (!current && normalizeVehicleStatus(vehicle?.status) === "service") {
    throw new Error("Vozilo je na servisu i nije dostupno za rezervaciju.");
  }

  assertVehicleReservationWindow(startAt, endAt);

  const reservation = {
    id: current?.id ?? "",
    vehicleId: vehicle.id,
    status,
    purpose: hasOwn(input, "purpose") ? requireText(input.purpose, "Svrha rezervacije") : requireText(current?.purpose, "Svrha rezervacije"),
    reservedForUserIds,
    reservedForLabels,
    reservedForUserId: reservedForUserIds[0] ?? "",
    reservedForLabel: reservedForLabels.join(", "),
    destination: hasOwn(input, "destination") ? normalizeText(input.destination) : (current?.destination ?? ""),
    startAt,
    endAt,
    note: hasOwn(input, "note") ? normalizeText(input.note) : (current?.note ?? ""),
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  assertVehicleReservationConflict(vehicle, reservation, current?.id ?? "");
  return reservation;
}

function calculateOfferTotals(items = [], taxRate = 25, discountRate = 0) {
  const subtotal = roundCurrencyAmount(items.reduce((sum, item) => sum + roundCurrencyAmount(item.totalPrice), 0));
  const normalizedDiscountRate = normalizeOfferDiscountRate(discountRate);
  const discountTotal = roundCurrencyAmount(subtotal * (normalizedDiscountRate / 100));
  const taxableSubtotal = roundCurrencyAmount(Math.max(0, subtotal - discountTotal));
  const taxTotal = roundCurrencyAmount(taxableSubtotal * (normalizeOfferTaxRate(taxRate) / 100));

  return {
    subtotal,
    discountRate: normalizedDiscountRate,
    discountTotal,
    taxableSubtotal,
    taxTotal,
    total: roundCurrencyAmount(taxableSubtotal + taxTotal),
  };
}

export function nextOfferNumber(offers = [], { year = Number(todayString().slice(0, 4)), initials = "" } = {}) {
  const normalizedYear = Number(year) || Number(todayString().slice(0, 4));
  const normalizedInitials = deriveOfferInitials(initials);
  const nextSequence = offers.reduce((maxValue, offer) => {
    if (Number(offer.offerYear) !== normalizedYear) {
      return maxValue;
    }

    if (deriveOfferInitials(offer.offerInitials) !== normalizedInitials) {
      return maxValue;
    }

    return Math.max(maxValue, Number(offer.offerSequence) || 0);
  }, 0) + 1;

  return {
    offerNumber: `${normalizedYear}-${normalizedInitials}-${String(nextSequence).padStart(3, "0")}`,
    offerYear: normalizedYear,
    offerSequence: nextSequence,
    offerInitials: normalizedInitials,
  };
}

export function nextPurchaseOrderNumber(
  purchaseOrders = [],
  { year = Number(todayString().slice(0, 4)), prefix = "PO" } = {},
) {
  const normalizedYear = Number(year) || Number(todayString().slice(0, 4));
  const normalizedPrefix = normalizeText(prefix).toUpperCase() || "PO";
  const nextSequence = purchaseOrders.reduce((maxValue, purchaseOrder) => {
    if (Number(purchaseOrder.purchaseOrderYear) !== normalizedYear) {
      return maxValue;
    }

    return Math.max(maxValue, Number(purchaseOrder.purchaseOrderSequence) || 0);
  }, 0) + 1;

  return {
    purchaseOrderNumber: `${normalizedYear}-${normalizedPrefix}-${String(nextSequence).padStart(3, "0")}`,
    purchaseOrderYear: normalizedYear,
    purchaseOrderSequence: nextSequence,
  };
}

export function nextContractNumber(
  contracts = [],
  { year = Number(todayString().slice(0, 4)), prefix = "UG" } = {},
) {
  const normalizedYear = Number(year) || Number(todayString().slice(0, 4));
  const normalizedPrefix = normalizeText(prefix).toUpperCase() || "UG";
  const nextSequence = contracts.reduce((maxValue, contract) => {
    const currentNumber = normalizeText(contract.contractNumber);
    const match = currentNumber.match(new RegExp(`^${normalizedPrefix}-${normalizedYear}-(\\d+)$`, "i"));
    if (!match) {
      return maxValue;
    }
    return Math.max(maxValue, Number(match[1]) || 0);
  }, 0) + 1;

  return {
    contractNumber: `${normalizedPrefix}-${normalizedYear}-${String(nextSequence).padStart(3, "0")}`,
    contractYear: normalizedYear,
    contractSequence: nextSequence,
  };
}

function findReminderCompany(state, companyId = "") {
  if (!companyId) {
    return null;
  }

  return (state.companies ?? []).find((item) => item.id === companyId) ?? null;
}

function findReminderLocation(state, locationId = "", companyId = "") {
  if (!locationId) {
    return null;
  }

  return (state.locations ?? []).find((item) => (
    item.id === locationId
    && (!companyId || item.companyId === companyId)
  )) ?? null;
}

function findReminderWorkOrder(state, workOrderId = "") {
  if (!workOrderId) {
    return null;
  }

  return (state.workOrders ?? []).find((item) => item.id === workOrderId) ?? null;
}

function findTodoCompany(state, companyId = "") {
  if (!companyId) {
    return null;
  }

  return (state.companies ?? []).find((item) => item.id === companyId) ?? null;
}

function findTodoLocation(state, locationId = "", companyId = "") {
  if (!locationId) {
    return null;
  }

  return (state.locations ?? []).find((item) => (
    item.id === locationId
    && (!companyId || item.companyId === companyId)
  )) ?? null;
}

function findTodoWorkOrder(state, workOrderId = "") {
  if (!workOrderId) {
    return null;
  }

  return (state.workOrders ?? []).find((item) => item.id === workOrderId) ?? null;
}

function findOfferCompany(state, companyId = "") {
  if (!companyId) {
    return null;
  }

  return (state.companies ?? []).find((item) => item.id === companyId) ?? null;
}

function findOfferLocation(state, locationId = "", companyId = "") {
  if (!locationId) {
    return null;
  }

  return (state.locations ?? []).find((item) => (
    item.id === locationId
    && (!companyId || item.companyId === companyId)
  )) ?? null;
}

function hydrateOfferCore({
  current = null,
  state,
  input,
  timestamp,
  offerNumber = current?.offerNumber ?? "",
  offerYear = current?.offerYear ?? Number(timestamp.slice(0, 4)),
  offerSequence = current?.offerSequence ?? 0,
  offerInitials = current?.offerInitials ?? deriveOfferInitials(input?.createdByLabel ?? ""),
}) {
  const companyId = hasOwn(input, "companyId")
    ? requireText(input.companyId, "Tvrtka")
    : requireText(current?.companyId, "Tvrtka");
  const company = findOfferCompany(state, companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const requestedLocationIds = hasOwn(input, "selectedLocationIds")
    ? normalizeIdList(input.selectedLocationIds)
    : normalizeIdList(current?.selectedLocationIds ?? []);
  const fallbackLocationScope = requestedLocationIds.length > 1
    ? "selection"
    : normalizeId(hasOwn(input, "locationId") ? input.locationId : current?.locationId)
      ? "single"
      : "none";
  const nextLocationScope = hasOwn(input, "locationScope")
    ? normalizeOfferLocationScope(input.locationScope, fallbackLocationScope)
    : normalizeOfferLocationScope(current?.locationScope, fallbackLocationScope);
  const locationWasExplicitlyChanged = hasOwn(input, "locationId")
    || hasOwn(input, "selectedLocationIds")
    || hasOwn(input, "locationScope");
  const companyLocations = (state.locations ?? []).filter((item) => item.companyId === companyId);
  const companyLocationIds = new Set(companyLocations.map((item) => item.id));
  let selectedLocationIds = requestedLocationIds.filter((locationId) => companyLocationIds.has(locationId));

  if (hasOwn(input, "locationId")) {
    const directLocationId = normalizeId(input.locationId);
    if (directLocationId && !selectedLocationIds.includes(directLocationId)) {
      selectedLocationIds = [directLocationId, ...selectedLocationIds].filter((locationId, index, list) => (
        companyLocationIds.has(locationId) && list.indexOf(locationId) === index
      ));
    }
  } else if (!selectedLocationIds.length) {
    const currentLocationId = normalizeId(current?.locationId);
    if (currentLocationId) {
      selectedLocationIds = [currentLocationId].filter((locationId) => companyLocationIds.has(locationId));
    }
  }

  if (locationWasExplicitlyChanged && requestedLocationIds.some((locationId) => !companyLocationIds.has(locationId))) {
    throw new Error("Odabrana lokacija ne pripada tvrtki.");
  }

  if (nextLocationScope === "all") {
    selectedLocationIds = companyLocations.map((location) => location.id);
  }

  if (nextLocationScope === "single" && selectedLocationIds.length > 1) {
    selectedLocationIds = selectedLocationIds.slice(0, 1);
  }

  const locationScope = nextLocationScope === "all"
    ? (selectedLocationIds.length > 0 ? "all" : "none")
    : nextLocationScope === "single"
      ? (selectedLocationIds.length > 0 ? "single" : "none")
      : nextLocationScope === "selection"
        ? (selectedLocationIds.length > 1 ? "selection" : selectedLocationIds.length === 1 ? "single" : "none")
        : "none";
  const locationId = selectedLocationIds[0] || "";
  const location = locationId ? findOfferLocation(state, locationId, companyId) : null;
  const selectedLocations = selectedLocationIds
    .map((selectedId) => findOfferLocation(state, selectedId, companyId))
    .filter(Boolean);
  const selectedLocationNames = selectedLocations.map((entry) => entry.name || "").filter(Boolean);
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const taxRate = hasOwn(input, "taxRate")
    ? normalizeOfferTaxRate(input.taxRate)
    : normalizeOfferTaxRate(current?.taxRate ?? 25);
  const discountRate = hasOwn(input, "discountRate")
    ? normalizeOfferDiscountRate(input.discountRate)
    : normalizeOfferDiscountRate(current?.discountRate ?? 0);
  const showTotalAmount = hasOwn(input, "showTotalAmount")
    ? normalizeBoolean(input.showTotalAmount, true)
    : normalizeBoolean(current?.showTotalAmount, true);
  const documentMode = hasOwn(input, "documentMode")
    ? normalizeCommercialDocumentMode(input.documentMode, current?.documentMode ?? "app")
    : normalizeCommercialDocumentMode(current?.documentMode, "app");
  const items = hasOwn(input, "items")
    ? normalizeOfferItems(input.items, { allowEmpty: documentMode === "upload" })
    : (current?.items ?? []);
  const totals = calculateOfferTotals(items, taxRate, discountRate);
  const offerDirection = hasOwn(input, "offerDirection")
    ? normalizePurchaseOrderDirection(input.offerDirection, "outgoing")
    : normalizePurchaseOrderDirection(current?.offerDirection, "outgoing");
  const fallbackOfferDate = current?.offerDate ?? timestamp.slice(0, 10);
  const offerDate = hasOwn(input, "offerDate")
    ? (normalizeOptionalDate(input.offerDate) ?? timestamp.slice(0, 10))
    : (normalizeOptionalDate(fallbackOfferDate) ?? timestamp.slice(0, 10));
  const contactSlot = normalizeText(hasOwn(input, "contactSlot") ? input.contactSlot : current?.contactSlot);
  const shouldRefreshContactFromLocation = !hasOwn(input, "contactName")
    && !hasOwn(input, "contactPhone")
    && !hasOwn(input, "contactEmail")
    && locationScope === "single"
    && Boolean(location)
    && (
      !current
      || hasOwn(input, "companyId")
      || hasOwn(input, "locationId")
      || hasOwn(input, "selectedLocationIds")
      || hasOwn(input, "locationScope")
      || hasOwn(input, "contactSlot")
    );
  const selectedContact = shouldRefreshContactFromLocation
    ? selectLocationContact(location, contactSlot)
    : null;
  const contactName = hasOwn(input, "contactName")
    ? normalizeText(input.contactName)
    : selectedContact
      ? selectedContact.name
      : normalizeText(current?.contactName);
  const contactPhone = hasOwn(input, "contactPhone")
    ? normalizeText(input.contactPhone)
    : selectedContact
      ? selectedContact.phone
      : normalizeText(current?.contactPhone);
  const contactEmail = hasOwn(input, "contactEmail")
    ? normalizeText(input.contactEmail)
    : selectedContact
      ? selectedContact.email
      : normalizeText(current?.contactEmail);
  const companyLocationCount = companyLocations.length;
  const locationName = locationScope === "all"
    ? "Sve lokacije"
    : locationScope === "none"
      ? "Bez lokacije"
      : locationScope === "selection"
        ? `${selectedLocationNames.length} od ${companyLocationCount} lokacija`
        : (location?.name ?? "");
  const documents = hasOwn(input, "documents")
    ? normalizeAttachmentDocuments(input.documents)
    : normalizeAttachmentDocuments(current?.documents ?? []);

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: company.name,
    companyOib: company.oib ?? "",
    headquarters: company.headquarters ?? "",
    locationId,
    selectedLocationIds,
    selectedLocationNames,
    locationScope,
    locationName,
    region: location?.region ?? "",
    coordinates: location?.coordinates ?? "",
    contactSlot,
    contactName,
    contactPhone,
    contactEmail,
    offerNumber: requireText(offerNumber || current?.offerNumber, "Broj ponude"),
    offerYear: Number(offerYear) || Number(timestamp.slice(0, 4)),
    offerSequence: Number(offerSequence) || 0,
    offerInitials: deriveOfferInitials(offerInitials),
    offerDirection,
    documentMode,
    internalDocumentNumber: hasOwn(input, "internalDocumentNumber")
      ? normalizeText(input.internalDocumentNumber)
      : normalizeText(current?.internalDocumentNumber),
    externalDocumentNumber: hasOwn(input, "externalDocumentNumber")
      ? normalizeText(input.externalDocumentNumber)
      : normalizeText(current?.externalDocumentNumber),
    title: hasOwn(input, "title") ? requireText(input.title, "Naziv ponude") : current?.title ?? "",
    serviceLine: hasOwn(input, "serviceLine")
      ? (documentMode === "upload" ? normalizeText(input.serviceLine || input.title) : requireText(input.serviceLine, "Vrsta usluge"))
      : current?.serviceLine ?? "",
    status: hasOwn(input, "status") ? normalizeOfferStatus(input.status) : normalizeOfferStatus(current?.status),
    offerDate,
    validUntil: hasOwn(input, "validUntil")
      ? normalizeOptionalDate(input.validUntil)
      : normalizeOptionalDate(current?.validUntil),
    note: hasOwn(input, "note") ? normalizeText(input.note) : current?.note ?? "",
    textBlock1: hasOwn(input, "textBlock1") ? normalizeText(input.textBlock1) : current?.textBlock1 ?? "",
    textBlock2: hasOwn(input, "textBlock2") ? normalizeText(input.textBlock2) : current?.textBlock2 ?? "",
    currency: hasOwn(input, "currency")
      ? (normalizeText(input.currency).toUpperCase() || "EUR")
      : (normalizeText(current?.currency).toUpperCase() || "EUR"),
    showTotalAmount,
    taxRate,
    discountRate,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxableSubtotal: totals.taxableSubtotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    items: items.map((item) => ({ ...item })),
    documents: documents.map((document) => ({ ...document })),
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function hydratePublicProcurementCore({
  current = null,
  state,
  input,
  timestamp,
}) {
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const companyId = hasOwn(input, "companyId")
    ? normalizeId(input.companyId)
    : normalizeId(current?.companyId);
  const company = companyId ? findOfferCompany(state, companyId) : null;

  if (companyId && !company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const documents = hasOwn(input, "documents")
    ? normalizeAttachmentDocuments(input.documents)
    : normalizeAttachmentDocuments(current?.documents ?? []);

  return {
    id: current?.id ?? "",
    organizationId,
    title: hasOwn(input, "title")
      ? requireText(input.title, "Naziv javne nabave")
      : requireText(current?.title, "Naziv javne nabave"),
    referenceNumber: hasOwn(input, "referenceNumber")
      ? normalizeText(input.referenceNumber)
      : normalizeText(current?.referenceNumber),
    status: hasOwn(input, "status")
      ? normalizePublicProcurementStatus(input.status)
      : normalizePublicProcurementStatus(current?.status),
    deadline: hasOwn(input, "deadline")
      ? normalizeOptionalDate(input.deadline)
      : normalizeOptionalDate(current?.deadline),
    amount: hasOwn(input, "amount")
      ? roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(input.amount, 0)))
      : roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(current?.amount, 0))),
    companyId,
    companyName: company?.name
      ?? (hasOwn(input, "companyName") ? normalizeText(input.companyName) : normalizeText(current?.companyName)),
    companyOib: company?.oib ?? normalizeText(current?.companyOib),
    headquarters: company?.headquarters ?? normalizeText(current?.headquarters),
    documentationUrl: hasOwn(input, "documentationUrl")
      ? normalizeText(input.documentationUrl)
      : normalizeText(current?.documentationUrl),
    note: hasOwn(input, "note") ? normalizeText(input.note) : normalizeText(current?.note),
    documents: documents.map((document) => ({ ...document })),
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function hydrateReminderCore({
  current = null,
  state,
  input,
  timestamp,
}) {
  const requestedWorkOrderId = hasOwn(input, "workOrderId")
    ? normalizeId(input.workOrderId)
    : normalizeId(current?.workOrderId);
  const linkedWorkOrder = findReminderWorkOrder(state, requestedWorkOrderId);

  if (requestedWorkOrderId && !linkedWorkOrder) {
    throw new Error("Povezani radni nalog ne postoji.");
  }

  let companyId = linkedWorkOrder?.companyId ?? (
    hasOwn(input, "companyId") ? normalizeId(input.companyId) : normalizeId(current?.companyId)
  );
  let locationId = linkedWorkOrder?.locationId ?? (
    hasOwn(input, "locationId") ? normalizeId(input.locationId) : normalizeId(current?.locationId)
  );
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");

  const company = findReminderCompany(state, companyId);

  if (companyId && !company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  let location = findReminderLocation(state, locationId, companyId);

  if (locationId && !location) {
    throw new Error("Odabrana lokacija ne pripada tvrtki.");
  }

  if (linkedWorkOrder) {
    companyId = linkedWorkOrder.companyId;
    locationId = linkedWorkOrder.locationId;
    location = findReminderLocation(state, linkedWorkOrder.locationId, linkedWorkOrder.companyId);
  }

  const normalizedStatus = hasOwn(input, "status")
    ? normalizeReminderStatus(input.status)
    : normalizeReminderStatus(current?.status);
  const completedAt = normalizedStatus === "done"
    ? (current?.completedAt ?? timestamp)
    : null;

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: linkedWorkOrder?.companyName ?? company?.name ?? "",
    locationId,
    locationName: linkedWorkOrder?.locationName ?? location?.name ?? "",
    workOrderId: linkedWorkOrder?.id ?? requestedWorkOrderId,
    workOrderNumber: linkedWorkOrder?.workOrderNumber ?? current?.workOrderNumber ?? "",
    title: hasOwn(input, "title") ? requireText(input.title, "Naslov remindera") : current?.title ?? "",
    note: hasOwn(input, "note") ? normalizeText(input.note) : current?.note ?? "",
    dueDate: hasOwn(input, "dueDate")
      ? normalizeOptionalDate(input.dueDate)
      : normalizeOptionalDate(current?.dueDate),
    repeatEveryDays: hasOwn(input, "repeatEveryDays")
      ? normalizeReminderRepeatEveryDays(input.repeatEveryDays, null)
      : normalizeReminderRepeatEveryDays(current?.repeatEveryDays, null),
    status: normalizedStatus,
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    completedAt,
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function hydrateTodoTaskCore({
  current = null,
  state,
  input,
  timestamp,
}) {
  const requestedWorkOrderId = hasOwn(input, "workOrderId")
    ? normalizeId(input.workOrderId)
    : normalizeId(current?.workOrderId);
  const linkedWorkOrder = findTodoWorkOrder(state, requestedWorkOrderId);

  if (requestedWorkOrderId && !linkedWorkOrder) {
    throw new Error("Povezani radni nalog ne postoji.");
  }

  let companyId = linkedWorkOrder?.companyId ?? (
    hasOwn(input, "companyId") ? normalizeId(input.companyId) : normalizeId(current?.companyId)
  );
  let locationId = linkedWorkOrder?.locationId ?? (
    hasOwn(input, "locationId") ? normalizeId(input.locationId) : normalizeId(current?.locationId)
  );
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const company = findTodoCompany(state, companyId);

  if (companyId && !company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  let location = findTodoLocation(state, locationId, companyId);

  if (locationId && !location) {
    throw new Error("Odabrana lokacija ne pripada tvrtki.");
  }

  if (linkedWorkOrder) {
    companyId = linkedWorkOrder.companyId;
    locationId = linkedWorkOrder.locationId;
    location = findTodoLocation(state, linkedWorkOrder.locationId, linkedWorkOrder.companyId);
  }

  const normalizedStatus = hasOwn(input, "status")
    ? normalizeTodoTaskStatus(input.status)
    : normalizeTodoTaskStatus(current?.status);
  const dueDate = hasOwn(input, "dueDate")
    ? normalizeOptionalDate(input.dueDate)
    : normalizeOptionalDate(current?.dueDate);
  const invitedUserIds = hasOwn(input, "invitedUserIds")
    ? normalizeIdList(input.invitedUserIds)
    : normalizeIdList(current?.invitedUserIds);
  const fallbackInvitedLabels = (
    hasOwn(input, "invitedUserLabels")
      ? (Array.isArray(input.invitedUserLabels) ? input.invitedUserLabels : [input.invitedUserLabels])
      : (Array.isArray(current?.invitedUserLabels) ? current.invitedUserLabels : [current?.invitedUserLabels])
  )
    .map((value) => normalizeText(value))
    .filter(Boolean);
  const usersById = new Map(
    (state?.users ?? []).map((user) => [String(user?.id ?? ""), user]),
  );
  const invitedUserLabels = invitedUserIds.map((userId, index) => {
    const user = usersById.get(String(userId));
    if (user) {
      return normalizeText(user.fullName || user.email || user.username || "User");
    }
    return fallbackInvitedLabels[index] || "";
  }).filter(Boolean);

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: linkedWorkOrder?.companyName ?? company?.name ?? "",
    locationId,
    locationName: linkedWorkOrder?.locationName ?? location?.name ?? "",
    workOrderId: linkedWorkOrder?.id ?? requestedWorkOrderId,
    workOrderNumber: linkedWorkOrder?.workOrderNumber ?? current?.workOrderNumber ?? "",
    title: hasOwn(input, "title") ? requireText(input.title, "Naslov zadatka") : current?.title ?? "",
    message: hasOwn(input, "message") ? normalizeText(input.message) : current?.message ?? "",
    status: normalizedStatus,
    priority: hasOwn(input, "priority") ? normalizePriority(input.priority) : normalizePriority(current?.priority),
    dueDate,
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    assignedToUserId: hasOwn(input, "assignedToUserId")
      ? normalizeText(input.assignedToUserId)
      : (current?.assignedToUserId ?? ""),
    assignedToLabel: hasOwn(input, "assignedToLabel")
      ? normalizeText(input.assignedToLabel)
      : (current?.assignedToLabel ?? ""),
    invitedUserIds,
    invitedUserLabels,
    completedAt: normalizedStatus === "done"
      ? (current?.completedAt ?? timestamp)
      : null,
    commentCount: current?.commentCount ?? 0,
    comments: Array.isArray(current?.comments) ? current.comments.map((comment) => ({ ...comment })) : [],
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function createTodoTaskCommentCore(input, createId = () => crypto.randomUUID(), now = isoNow) {
  return {
    id: createId(),
    taskId: requireText(input.taskId, "Zadatak"),
    organizationId: requireText(input.organizationId, "Organizacija"),
    userId: normalizeText(input.userId),
    authorLabel: normalizeText(input.authorLabel) || "SafeNexus",
    message: requireText(input.message, "Poruka"),
    createdAt: now(),
  };
}

function parseContactSlot(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const slot = Number(value);

  if (!Number.isInteger(slot) || slot < 1) {
    return null;
  }

  return slot;
}

function uniqueByCaseInsensitive(items, value, getValue, currentId = "") {
  const needle = normalizeText(value).toLowerCase();

  if (!needle) {
    return false;
  }

  return items.some((item) => {
    if (item.id === currentId) {
      return false;
    }

    return normalizeText(getValue(item)).toLowerCase() === needle;
  });
}

function mergeContactFields(base, patch = {}) {
  const next = { ...base };

  for (const slot of [1, 2, 3]) {
    const nameKey = `contactName${slot}`;
    const phoneKey = `contactPhone${slot}`;
    const emailKey = `contactEmail${slot}`;

    if (hasOwn(patch, nameKey)) {
      next[nameKey] = normalizeText(patch[nameKey]);
    }

    if (hasOwn(patch, phoneKey)) {
      next[phoneKey] = normalizeText(patch[phoneKey]);
    }

    if (hasOwn(patch, emailKey)) {
      next[emailKey] = normalizeText(patch[emailKey]);
    }
  }

  return next;
}

function normalizeLocationContacts(contacts = []) {
  if (!Array.isArray(contacts)) {
    return [];
  }

  return contacts
    .map((contact, index) => ({
      slot: parseContactSlot(contact?.slot) ?? (index + 1),
      name: normalizeText(contact?.name),
      phone: normalizeText(contact?.phone),
      email: normalizeText(contact?.email),
    }))
    .filter((contact) => contact.name || contact.phone || contact.email)
    .map((contact, index) => ({
      ...contact,
      slot: index + 1,
    }));
}

function extractLegacyLocationContacts(location) {
  const contacts = [];

  for (const slot of [1, 2, 3]) {
    const contact = {
      slot,
      name: normalizeText(location[`contactName${slot}`]),
      phone: normalizeText(location[`contactPhone${slot}`]),
      email: normalizeText(location[`contactEmail${slot}`]),
    };

    if (contact.name || contact.phone || contact.email) {
      contacts.push(contact);
    }
  }

  return contacts;
}

function applyLocationContacts(target, contacts = []) {
  const normalizedContacts = normalizeLocationContacts(contacts);
  target.contacts = normalizedContacts;

  for (const slot of [1, 2, 3]) {
    const contact = normalizedContacts[slot - 1];
    target[`contactName${slot}`] = contact?.name ?? "";
    target[`contactPhone${slot}`] = contact?.phone ?? "";
    target[`contactEmail${slot}`] = contact?.email ?? "";
  }

  return target;
}

function hasLegacyContactFields(input = {}) {
  return [1, 2, 3].some((slot) => (
    hasOwn(input, `contactName${slot}`)
    || hasOwn(input, `contactPhone${slot}`)
    || hasOwn(input, `contactEmail${slot}`)
  ));
}

function resolvePatchedLocationContacts(current, patch = {}) {
  if (hasOwn(patch, "contacts")) {
    return patch.contacts;
  }

  if (!hasLegacyContactFields(patch)) {
    return buildLocationContacts(current);
  }

  const mergedLegacyContacts = extractLegacyLocationContacts(mergeContactFields(current, patch));
  const extraContacts = buildLocationContacts(current)
    .slice(3)
    .map((contact) => ({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    }));

  return [...mergedLegacyContacts, ...extraContacts];
}

export function buildLocationContacts(location) {
  if (!location) {
    return [];
  }

  if (Array.isArray(location.contacts)) {
    return normalizeLocationContacts(location.contacts);
  }

  return extractLegacyLocationContacts(location);
}

function selectLocationContact(location, preferredSlot) {
  const contacts = buildLocationContacts(location);

  if (contacts.length === 0) {
    return {
      slot: null,
      name: "",
      phone: "",
      email: "",
    };
  }

  const parsedPreferredSlot = parseContactSlot(preferredSlot);
  return contacts.find((contact) => contact.slot === parsedPreferredSlot) ?? contacts[0];
}

function normalizeCompanyIriList(values = []) {
  const source = Array.isArray(values) ? values : [values];
  return Array.from(new Set(
    source
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .map((entry) => normalizeText(entry).slice(0, 180))
      .filter(Boolean),
  )).slice(0, 80);
}

const COMPANY_TRAINING_IMPORT_FIELD_KEYS = new Set([
  "recordId",
  "company",
  "location",
  "firstName",
  "lastName",
  "fatherName",
  "fullName",
  "oib",
  "language",
  "birthDate",
  "birthCountry",
  "birthPlace",
  "arrivalDate",
  "workPlace",
  "activity",
  "email",
  "phone",
  "workOrderNumber",
  "serviceCode",
  "certificateNumber",
  "jobTitle",
  "jobDescription",
  "theoryPlace",
  "theoryDate",
  "theoryMethod",
  "employerRepresentativeName",
  "employerRepresentativeOib",
  "additionalPersonName",
  "additionalPersonOib",
  "practicalPlace",
  "safeWorkPeriodFrom",
  "safeWorkPeriodTo",
  "safeWorkDate",
  "safeWorkValidUntil",
  "safeWorkValidForever",
  "safeWorkCertificateNumber",
  "safeWorkProvider",
  "fireDate",
  "flammableDate",
  "flammableValidUntil",
  "adrDate",
  "adrValidUntil",
  "note",
]);

const DEFAULT_COMPANY_TRAINING_IMPORT_COLUMNS = Object.freeze([
  { key: "fullName", label: "Ime i prezime", required: true, aliases: ["Radnik", "Osoba"] },
  { key: "oib", label: "OIB osobe", required: true, aliases: ["OIB"] },
  { key: "jobTitle", label: "Naziv radnog mjesta", required: true, aliases: ["Radno mjesto"] },
  { key: "location", label: "Lokacija", required: false, aliases: ["Mjesto rada"] },
  { key: "workOrderNumber", label: "Broj RN", required: false, aliases: ["Radni nalog"] },
  { key: "safeWorkDate", label: "ZOS datum", required: false, aliases: ["Rad na siguran nacin datum"] },
  { key: "safeWorkValidUntil", label: "ZOS vrijedi do", required: false, aliases: ["Rok ZOS"] },
  { key: "safeWorkValidForever", label: "ZOS trajno", required: false, aliases: ["Bez isteka"] },
  { key: "safeWorkCertificateNumber", label: "ZOS broj uvjerenja", required: false, aliases: ["Broj uvjerenja"] },
  { key: "fireDate", label: "PGP datum polaganja", required: false, aliases: ["Pocetno gasenje pozara"] },
  { key: "flammableDate", label: "SPZTP datum polaganja", required: false, aliases: ["Zapaljive tekucine datum"] },
  { key: "flammableValidUntil", label: "SPZTP vrijedi do", required: false, aliases: ["Zapaljive tekucine rok"] },
  { key: "adrDate", label: "ADR datum polaganja", required: false, aliases: ["ADR datum"] },
  { key: "adrValidUntil", label: "ADR vrijedi do", required: false, aliases: ["ADR rok"] },
  { key: "note", label: "Napomena", required: false, aliases: [] },
]);

function normalizeCompanyTrainingImportColumn(input = {}, index = 0) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const key = normalizeText(source.key ?? source.field ?? source.value).trim();
  if (!COMPANY_TRAINING_IMPORT_FIELD_KEYS.has(key)) {
    return null;
  }
  const defaults = DEFAULT_COMPANY_TRAINING_IMPORT_COLUMNS.find((column) => column.key === key) ?? {};
  const aliases = Array.isArray(source.aliases)
    ? source.aliases
    : String(source.aliases ?? source.alias ?? "")
      .split(/[,;\n]/)
      .map((alias) => alias.trim())
      .filter(Boolean);
  return {
    key,
    label: normalizeText(source.label ?? source.column ?? defaults.label ?? key).slice(0, 120) || String(defaults.label || key),
    required: normalizeBoolean(source.required, Boolean(defaults.required)),
    aliases: normalizeCompanyIriList([...(defaults.aliases ?? []), ...aliases]).slice(0, 12),
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : index,
  };
}

function normalizeCompanyTrainingImportProfile(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const rawColumns = Array.isArray(source.columns) ? source.columns : DEFAULT_COMPANY_TRAINING_IMPORT_COLUMNS;
  const columns = rawColumns
    .map((column, index) => normalizeCompanyTrainingImportColumn(column, index))
    .filter(Boolean)
    .sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
    .slice(0, 80);
  const headerRow = Math.max(1, Math.min(50, Number.parseInt(source.headerRow ?? source.header ?? 1, 10) || 1));
  const firstDataRow = Math.max(headerRow + 1, Math.min(200, Number.parseInt(source.firstDataRow ?? source.dataRow ?? 2, 10) || 2));
  const mode = normalizeText(source.defaultImportMode ?? source.importMode ?? source.mode).toLowerCase();
  return {
    enabled: normalizeBoolean(source.enabled, true),
    profileName: normalizeText(source.profileName ?? source.name ?? "Import osposobljavanja").slice(0, 120),
    sheetName: normalizeText(source.sheetName ?? source.sheet ?? "Osposobljavanja").slice(0, 80) || "Osposobljavanja",
    headerRow,
    firstDataRow,
    defaultImportMode: ["new", "changes", "departures"].includes(mode) ? mode : "new",
    createMissingPeople: normalizeBoolean(source.createMissingPeople, true),
    columns: columns.length ? columns : DEFAULT_COMPANY_TRAINING_IMPORT_COLUMNS.map((column, index) => normalizeCompanyTrainingImportColumn(column, index)).filter(Boolean),
    note: normalizeText(source.note).slice(0, 1000),
  };
}

function normalizeCompanyIsznrTraining(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const sourceMode = normalizeText(source.source ?? source.mode ?? source.trainingSource).toLowerCase();
  const isznrSource = ["isznr", "is_znr", "is znr"].includes(sourceMode);
  return {
    source: isznrSource ? "isznr" : "internal",
    internalTemplateId: normalizeText(source.internalTemplateId ?? source.templateId ?? source.trainingTemplateId).slice(0, 80),
    internalTemplateTitle: normalizeText(source.internalTemplateTitle ?? source.templateTitle ?? source.trainingTemplateTitle).slice(0, 180),
    internalTemplateDocumentName: normalizeText(source.internalTemplateDocumentName ?? source.templateDocumentName).slice(0, 180),
    companyIri: normalizeText(source.companyIri ?? source.companyIRI ?? source.company).slice(0, 180),
    companyId: normalizeText(source.companyId ?? source.isznrCompanyId).slice(0, 80),
    companyName: normalizeText(source.companyName ?? source.isznrCompanyName).slice(0, 180),
    companyOib: normalizeText(source.companyOib ?? source.isznrCompanyOib).replace(/\s+/g, "").slice(0, 11),
    authorizedCompanyIri: normalizeText(source.authorizedCompanyIri ?? source.authorizedCompanyIRI ?? source.authorizedCompany).slice(0, 180),
    authorizedCompanyId: normalizeText(source.authorizedCompanyId ?? source.isznrAuthorizedCompanyId).slice(0, 80),
    authorizedCompanyName: normalizeText(source.authorizedCompanyName ?? source.isznrAuthorizedCompanyName).slice(0, 180),
    authorizedCompanyOib: normalizeText(source.authorizedCompanyOib ?? source.isznrAuthorizedCompanyOib).replace(/\s+/g, "").slice(0, 11),
    zosRegisterIris: normalizeCompanyIriList(source.zosRegisterIris ?? source.zosRegisters ?? source.zosRegister),
    zosRegisterLabels: normalizeCompanyIriList(source.zosRegisterLabels ?? source.zosRegisterNames),
    importProfile: normalizeCompanyTrainingImportProfile(source.importProfile ?? source.trainingImportProfile),
    syncedAt: normalizeOptionalDateTime(source.syncedAt ?? source.checkedAt),
    note: normalizeText(source.note).slice(0, 1000),
  };
}

export function createCompany(input, existingCompanies = [], createId = () => crypto.randomUUID(), now = isoNow) {
  const timestamp = now();
  const contractValidForever = normalizeBoolean(input.contractValidForever, false);
  const company = {
    id: createId(),
    name: requireText(input.name, "Naziv tvrtke"),
    logoDataUrl: normalizeText(input.logoDataUrl),
    headquarters: normalizeText(input.headquarters),
    oib: normalizeOib(input.oib),
    mbs: normalizeText(input.mbs).slice(0, 60),
    nkdActivity: normalizeText(input.nkdActivity ?? input.nkd ?? input.industry ?? input.activity).slice(0, 500),
    contractName: normalizeText(input.contractName),
    contractType: normalizeText(input.contractType),
    contractNumber: normalizeText(input.contractNumber),
    contractValidFrom: normalizeOptionalDate(input.contractValidFrom),
    contractValidForever,
    contractValidTo: contractValidForever ? "" : normalizeOptionalDate(input.contractValidTo),
    contractMonthlyPrice: normalizeText(input.contractMonthlyPrice),
    contractPriceList: normalizeCompanyContractPriceList(input.contractPriceList),
    employeeSize: normalizeCompanyEmployeeSize(input.employeeSize),
    riskAssessmentClientJobInputEnabled: normalizeBoolean(input.riskAssessmentClientJobInputEnabled ?? input.clientJobInputEnabled, false),
    managerUserIds: normalizeIdList(input.managerUserIds).slice(0, 24),
    managerUserLabels: normalizeCompanyManagerLabels(input.managerUserLabels),
    templateAssignments: normalizeCompanyTemplateAssignments(input.templateAssignments ?? input.serviceTemplateAssignments),
    isznrTraining: normalizeCompanyIsznrTraining(input.isznrTraining ?? input.isznrTrainingSettings),
    period: normalizeText(input.period),
    isActive: normalizeBoolean(input.isActive, true),
    representative: normalizeText(input.representative),
    representativeRole: normalizeText(input.representativeRole),
    representativeOib: normalizeOptionalOib(input.representativeOib),
    contactPhone: normalizeText(input.contactPhone),
    contactEmail: normalizeText(input.contactEmail),
    note: normalizeText(input.note),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (uniqueByCaseInsensitive(existingCompanies, company.oib, (item) => item.oib)) {
    throw new Error("Tvrtka s tim OIB-om vec postoji.");
  }

  return company;
}

export function updateCompany(current, patch, existingCompanies = [], now = isoNow) {
  const contractValidForever = hasOwn(patch, "contractValidForever")
    ? normalizeBoolean(patch.contractValidForever, current.contractValidForever)
    : normalizeBoolean(current.contractValidForever, false);
  const next = {
    ...current,
    name: hasOwn(patch, "name") ? requireText(patch.name, "Naziv tvrtke") : current.name,
    logoDataUrl: hasOwn(patch, "logoDataUrl") ? normalizeText(patch.logoDataUrl) : current.logoDataUrl,
    headquarters: hasOwn(patch, "headquarters") ? normalizeText(patch.headquarters) : current.headquarters,
    oib: hasOwn(patch, "oib") ? normalizeOib(patch.oib) : current.oib,
    mbs: hasOwn(patch, "mbs") ? normalizeText(patch.mbs).slice(0, 60) : normalizeText(current.mbs).slice(0, 60),
    nkdActivity: hasOwn(patch, "nkdActivity") || hasOwn(patch, "nkd") || hasOwn(patch, "industry") || hasOwn(patch, "activity")
      ? normalizeText(patch.nkdActivity ?? patch.nkd ?? patch.industry ?? patch.activity).slice(0, 500)
      : normalizeText(current.nkdActivity ?? current.nkd ?? current.industry ?? current.activity).slice(0, 500),
    contractName: hasOwn(patch, "contractName") ? normalizeText(patch.contractName) : normalizeText(current.contractName),
    contractType: hasOwn(patch, "contractType") ? normalizeText(patch.contractType) : current.contractType,
    contractNumber: hasOwn(patch, "contractNumber") ? normalizeText(patch.contractNumber) : current.contractNumber,
    contractValidFrom: hasOwn(patch, "contractValidFrom")
      ? normalizeOptionalDate(patch.contractValidFrom)
      : normalizeOptionalDate(current.contractValidFrom),
    contractValidForever,
    contractValidTo: contractValidForever
      ? ""
      : hasOwn(patch, "contractValidTo")
      ? normalizeOptionalDate(patch.contractValidTo)
      : normalizeOptionalDate(current.contractValidTo),
    contractMonthlyPrice: hasOwn(patch, "contractMonthlyPrice")
      ? normalizeText(patch.contractMonthlyPrice)
      : normalizeText(current.contractMonthlyPrice),
    contractPriceList: hasOwn(patch, "contractPriceList")
      ? normalizeCompanyContractPriceList(patch.contractPriceList)
      : normalizeCompanyContractPriceList(current.contractPriceList),
    employeeSize: hasOwn(patch, "employeeSize")
      ? normalizeCompanyEmployeeSize(patch.employeeSize)
      : normalizeCompanyEmployeeSize(current.employeeSize),
    riskAssessmentClientJobInputEnabled: hasOwn(patch, "riskAssessmentClientJobInputEnabled") || hasOwn(patch, "clientJobInputEnabled")
      ? normalizeBoolean(patch.riskAssessmentClientJobInputEnabled ?? patch.clientJobInputEnabled, current.riskAssessmentClientJobInputEnabled)
      : normalizeBoolean(current.riskAssessmentClientJobInputEnabled, false),
    managerUserIds: hasOwn(patch, "managerUserIds")
      ? normalizeIdList(patch.managerUserIds).slice(0, 24)
      : normalizeIdList(current.managerUserIds).slice(0, 24),
    managerUserLabels: hasOwn(patch, "managerUserLabels")
      ? normalizeCompanyManagerLabels(patch.managerUserLabels)
      : normalizeCompanyManagerLabels(current.managerUserLabels),
    templateAssignments: hasOwn(patch, "templateAssignments")
      ? normalizeCompanyTemplateAssignments(patch.templateAssignments)
      : normalizeCompanyTemplateAssignments(current.templateAssignments),
    isznrTraining: hasOwn(patch, "isznrTraining") || hasOwn(patch, "isznrTrainingSettings")
      ? normalizeCompanyIsznrTraining(patch.isznrTraining ?? patch.isznrTrainingSettings)
      : normalizeCompanyIsznrTraining(current.isznrTraining),
    period: hasOwn(patch, "period") ? normalizeText(patch.period) : current.period,
    isActive: hasOwn(patch, "isActive") ? normalizeBoolean(patch.isActive, current.isActive) : current.isActive,
    representative: hasOwn(patch, "representative") ? normalizeText(patch.representative) : current.representative,
    representativeRole: hasOwn(patch, "representativeRole")
      ? normalizeText(patch.representativeRole)
      : current.representativeRole,
    representativeOib: hasOwn(patch, "representativeOib")
      ? normalizeOptionalOib(patch.representativeOib)
      : current.representativeOib,
    contactPhone: hasOwn(patch, "contactPhone") ? normalizeText(patch.contactPhone) : current.contactPhone,
    contactEmail: hasOwn(patch, "contactEmail") ? normalizeText(patch.contactEmail) : current.contactEmail,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    updatedAt: now(),
  };

  if (uniqueByCaseInsensitive(existingCompanies, next.oib, (item) => item.oib, current.id)) {
    throw new Error("Tvrtka s tim OIB-om vec postoji.");
  }

  return next;
}

export function createLocation(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const companyId = requireText(input.companyId, "Tvrtka");
  const company = state.companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const timestamp = now();
  const location = {
    id: createId(),
    companyId,
    name: requireText(input.name, "Naziv lokacije"),
    isActive: normalizeBoolean(input.isActive, true),
    period: normalizeText(input.period),
    representative: normalizeText(input.representative),
    coordinates: normalizeText(input.coordinates),
    region: normalizeText(input.region),
    note: normalizeText(input.note),
    ...mergeContactFields({
      contactName1: "",
      contactPhone1: "",
      contactEmail1: "",
      contactName2: "",
      contactPhone2: "",
      contactEmail2: "",
      contactName3: "",
      contactPhone3: "",
      contactEmail3: "",
    }, input),
    contacts: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  applyLocationContacts(
    location,
    hasOwn(input, "contacts") ? input.contacts : extractLegacyLocationContacts(input),
  );

  const duplicate = state.locations.some((item) => {
    if (item.companyId !== location.companyId) {
      return false;
    }

    return normalizeText(item.name).toLowerCase() === normalizeText(location.name).toLowerCase();
  });

  if (duplicate) {
    throw new Error("Ta lokacija za odabranu tvrtku vec postoji.");
  }

  return location;
}

export function updateLocation(current, patch, state, now = isoNow) {
  const companyId = hasOwn(patch, "companyId") ? requireText(patch.companyId, "Tvrtka") : current.companyId;
  const company = state.companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const next = {
    ...current,
    companyId,
    name: hasOwn(patch, "name") ? requireText(patch.name, "Naziv lokacije") : current.name,
    isActive: hasOwn(patch, "isActive") ? normalizeBoolean(patch.isActive, current.isActive) : current.isActive,
    period: hasOwn(patch, "period") ? normalizeText(patch.period) : current.period,
    representative: hasOwn(patch, "representative") ? normalizeText(patch.representative) : current.representative,
    coordinates: hasOwn(patch, "coordinates") ? normalizeText(patch.coordinates) : current.coordinates,
    region: hasOwn(patch, "region") ? normalizeText(patch.region) : current.region,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    updatedAt: now(),
  };

  applyLocationContacts(next, resolvePatchedLocationContacts(current, patch));

  const duplicate = state.locations.some((item) => {
    if (item.id === current.id || item.companyId !== next.companyId) {
      return false;
    }

    return normalizeText(item.name).toLowerCase() === normalizeText(next.name).toLowerCase();
  });

  if (duplicate) {
    throw new Error("Ta lokacija za odabranu tvrtku vec postoji.");
  }

  return next;
}

export function createLocationObject(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const organizationId = requireText(input.organizationId, "Organizacija");
  const companyId = requireText(input.companyId, "Tvrtka");
  const locationId = requireText(input.locationId, "Lokacija");
  const company = (state.companies ?? []).find((item) => String(item.id) === String(companyId));
  const location = (state.locations ?? []).find((item) => (
    String(item.id) === String(locationId)
    && String(item.companyId) === String(companyId)
  ));

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  if (!location) {
    throw new Error("Odabrana lokacija ne pripada tvrtki.");
  }

  const name = requireText(input.name, "Naziv objekta");
  const duplicate = (state.locationObjects ?? []).some((item) => (
    String(item.locationId) === String(locationId)
    && normalizeText(item.name).toLowerCase() === normalizeText(name).toLowerCase()
  ));

  if (duplicate) {
    throw new Error("Taj objekt vec postoji na odabranoj lokaciji.");
  }

  const timestamp = now();
  return {
    id: createId(),
    organizationId,
    companyId,
    locationId,
    name,
    code: normalizeText(input.code),
    description: normalizeText(input.description),
    isActive: normalizeBoolean(input.isActive, true),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createServiceCatalogItem(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const organizationId = requireText(input.organizationId, "Organizacija");
  const serviceCode = requireText(input.serviceCode, "Šifra usluge");
  const serviceType = normalizeServiceCatalogType(
    input.serviceType,
    normalizeBoolean(input.isTraining, false) ? "znr" : "inspection",
  );
  const normalizedTemplateIds = deriveServiceTemplateSnapshot(
    state,
    hasOwn(input, "linkedTemplateIds") ? input.linkedTemplateIds : [],
  );
  const normalizedLearningTestIds = deriveServiceLearningTestSnapshot(
    state,
    hasOwn(input, "linkedLearningTestIds") ? input.linkedLearningTestIds : [],
  );
  const trainingCertificateTemplate = normalizeAttachmentDocuments(
    input.trainingCertificateTemplate ? [input.trainingCertificateTemplate] : [],
  )[0] ?? null;

  if ((state.serviceCatalog ?? []).some((item) => (
    String(item.organizationId) === String(organizationId)
    && normalizeText(item.serviceCode).toLowerCase() === serviceCode.toLowerCase()
  ))) {
    throw new Error("Usluga s tom sifrom vec postoji.");
  }

  return {
    id: createId(),
    organizationId,
    name: requireText(input.name, "Ime usluge"),
    serviceCode,
    status: normalizeServiceCatalogStatus(input.status),
    serviceType,
    isTraining: serviceType === "znr",
    validityMonths: normalizeServiceValidityMonths(input.validityMonths),
    linkedTemplateIds: serviceType === "inspection" ? normalizedTemplateIds.linkedTemplateIds : [],
    linkedTemplateTitles: serviceType === "inspection" ? normalizedTemplateIds.linkedTemplateTitles : [],
    linkedQualificationKeys: normalizeQualificationKeyList(input.linkedQualificationKeys ?? input.linkedQualificationExamKeys ?? []),
    linkedLearningTestIds: serviceType === "znr" ? normalizedLearningTestIds.linkedLearningTestIds : [],
    linkedLearningTestTitles: serviceType === "znr" ? normalizedLearningTestIds.linkedLearningTestTitles : [],
    trainingCertificateTemplate: serviceType === "znr" ? trainingCertificateTemplate : null,
    note: normalizeText(input.note),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function findContractCompany(state, companyId = "") {
  if (!companyId) {
    return null;
  }

  return (state.companies ?? []).find((item) => item.id === companyId) ?? null;
}

function findContractTemplate(state, templateId = "") {
  if (!templateId) {
    return null;
  }

  return (state.contractTemplates ?? []).find((item) => item.id === templateId) ?? null;
}

function normalizeContractStatus(value = "", fallback = "draft") {
  const normalized = normalizeText(value).toLowerCase();
  if (CONTRACT_STATUS_SET.has(normalized)) {
    return normalized;
  }
  return CONTRACT_STATUS_SET.has(fallback) ? fallback : "draft";
}

function normalizeContractTemplateStatus(value = "", fallback = "active") {
  const normalized = normalizeText(value).toLowerCase();
  if (CONTRACT_TEMPLATE_STATUS_SET.has(normalized)) {
    return normalized;
  }
  return CONTRACT_TEMPLATE_STATUS_SET.has(fallback) ? fallback : "active";
}

function normalizeContractAnnexes(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const annexNumber = normalizeText(item?.annexNumber).slice(0, 80);
      const title = normalizeText(item?.title).slice(0, 180);
      const effectiveDate = normalizeOptionalDate(item?.effectiveDate);
      const note = normalizeText(item?.note).slice(0, 1000);

      if (!annexNumber && !title && !effectiveDate && !note) {
        return null;
      }

      return {
        id: normalizeText(item?.id) || crypto.randomUUID(),
        annexNumber,
        title,
        effectiveDate,
        note,
      };
    })
    .filter(Boolean)
    .slice(0, 40);
}

function normalizeContractLinkedOffers(input = {}, state, companyId = "", current = null) {
  const sourceIds = hasOwn(input, "linkedOfferIds")
    ? input.linkedOfferIds
    : current?.linkedOfferIds ?? [];
  const requestedOfferIds = Array.from(new Set(
    (Array.isArray(sourceIds) ? sourceIds : [sourceIds])
      .map((value) => normalizeId(value))
      .filter(Boolean),
  ));

  if (requestedOfferIds.length === 0) {
    return {
      linkedOfferIds: [],
      linkedOfferNumbers: [],
      linkedOffers: [],
    };
  }

  const linkedOffers = requestedOfferIds.map((offerId) => {
    const offer = (state.offers ?? []).find((item) => String(item.id) === String(offerId));
    if (!offer) {
      throw new Error("Odabrana ponuda ne postoji.");
    }
    if (companyId && String(offer.companyId) !== String(companyId)) {
      throw new Error("Ponuda mora pripadati odabranoj tvrtki.");
    }
    return {
      id: String(offer.id),
      offerNumber: normalizeText(offer.offerNumber),
      title: normalizeText(offer.title),
      status: normalizeText(offer.status),
      total: Number(offer.total ?? 0) || 0,
      currency: normalizeText(offer.currency).toUpperCase() || "EUR",
      offerDate: normalizeOptionalDate(offer.offerDate),
    };
  });

  return {
    linkedOfferIds: linkedOffers.map((offer) => offer.id),
    linkedOfferNumbers: linkedOffers.map((offer) => offer.offerNumber).filter(Boolean),
    linkedOffers,
  };
}

function hydrateContractTemplateCore({
  current = null,
  state,
  input,
  timestamp,
}) {
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const referenceDocument = hasOwn(input, "referenceDocument")
    ? (input.referenceDocument && typeof input.referenceDocument === "object"
      ? {
        ...input.referenceDocument,
        fileName: normalizeText(input.referenceDocument.fileName),
        fileType: normalizeText(input.referenceDocument.fileType),
        dataUrl: normalizeText(input.referenceDocument.dataUrl || input.referenceDocument.storageUrl),
        storageProvider: normalizeText(input.referenceDocument.storageProvider),
        storageBucket: normalizeText(input.referenceDocument.storageBucket),
        storageKey: normalizeText(input.referenceDocument.storageKey),
        storageUrl: normalizeText(input.referenceDocument.storageUrl || input.referenceDocument.dataUrl),
        fileSize: Number(input.referenceDocument.fileSize ?? 0) || 0,
        updatedAt: input.referenceDocument.updatedAt || timestamp,
      }
      : null)
    : (current?.referenceDocument ? { ...current.referenceDocument } : null);

  return {
    id: current?.id ?? "",
    organizationId,
    title: hasOwn(input, "title") ? requireText(input.title, "Naziv templatea") : current?.title ?? "",
    description: hasOwn(input, "description") ? normalizeText(input.description) : current?.description ?? "",
    status: hasOwn(input, "status")
      ? normalizeContractTemplateStatus(input.status)
      : normalizeContractTemplateStatus(current?.status, "active"),
    referenceDocument,
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function hydrateContractCore({
  current = null,
  state,
  input,
  timestamp,
  contractNumber = current?.contractNumber ?? "",
}) {
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const companyId = hasOwn(input, "companyId")
    ? requireText(input.companyId, "Tvrtka")
    : requireText(current?.companyId, "Tvrtka");
  const company = findContractCompany(state, companyId);
  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const templateId = hasOwn(input, "templateId")
    ? normalizeId(input.templateId)
    : normalizeId(current?.templateId);
  const template = templateId ? findContractTemplate(state, templateId) : null;
  if (templateId && !template) {
    throw new Error("Odabrani template ugovora ne postoji.");
  }

  const linkedOffersPayload = normalizeContractLinkedOffers(input, state, companyId, current);

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: company.name,
    companyOib: company.oib ?? "",
    headquarters: company.headquarters ?? "",
    representative: company.representative ?? "",
    contactPhone: company.contactPhone ?? "",
    contactEmail: company.contactEmail ?? "",
    title: hasOwn(input, "title") ? requireText(input.title, "Naziv ugovora") : current?.title ?? "",
    contractNumber: hasOwn(input, "contractNumber")
      ? (normalizeText(input.contractNumber) || requireText(contractNumber, "Broj ugovora"))
      : requireText(contractNumber || current?.contractNumber, "Broj ugovora"),
    status: hasOwn(input, "status") ? normalizeContractStatus(input.status) : normalizeContractStatus(current?.status),
    templateId,
    templateTitle: template?.title ?? "",
    signedOn: hasOwn(input, "signedOn") ? normalizeOptionalDate(input.signedOn) : normalizeOptionalDate(current?.signedOn),
    validFrom: hasOwn(input, "validFrom") ? normalizeOptionalDate(input.validFrom) : normalizeOptionalDate(current?.validFrom),
    validTo: hasOwn(input, "validTo") ? normalizeOptionalDate(input.validTo) : normalizeOptionalDate(current?.validTo),
    subject: hasOwn(input, "subject") ? normalizeText(input.subject) : current?.subject ?? "",
    scopeSummary: hasOwn(input, "scopeSummary") ? normalizeText(input.scopeSummary) : current?.scopeSummary ?? "",
    note: hasOwn(input, "note") ? normalizeText(input.note) : current?.note ?? "",
    annexes: hasOwn(input, "annexes")
      ? normalizeContractAnnexes(input.annexes)
      : normalizeContractAnnexes(current?.annexes ?? []),
    ...linkedOffersPayload,
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function normalizeDrawingProjectStatus(value, fallback = "draft") {
  const normalized = normalizeText(value).toLowerCase();
  const allowed = new Set(DRAWING_PROJECT_STATUS_OPTIONS.map((option) => option.value));
  return allowed.has(normalized) ? normalized : fallback;
}

function normalizeDrawingProjectType(value, fallback = "custom") {
  const normalized = normalizeText(value).toLowerCase();
  const allowed = new Set(DRAWING_PROJECT_TYPE_OPTIONS.map((option) => option.value));
  return allowed.has(normalized) ? normalized : fallback;
}

function normalizeDrawingLineStyle(value, fallback = "solid") {
  const normalized = normalizeText(value).toLowerCase();
  return ["solid", "dashed", "dotted"].includes(normalized) ? normalized : fallback;
}

function normalizeDrawingColor(value, fallback = "#4564d1") {
  const normalized = normalizeText(value);
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized) ? normalized : fallback;
}

function normalizeDrawingCoordinate(value, fallback = 0) {
  return Math.round(normalizeFiniteNumber(value, fallback) * 10) / 10;
}

function buildDefaultDrawingLayers() {
  return [
    {
      id: crypto.randomUUID(),
      name: "Podloga",
      color: "#8a9ab8",
      visible: true,
      locked: false,
      lineWidth: 1,
      lineStyle: "solid",
    },
    {
      id: crypto.randomUUID(),
      name: "Zidovi",
      color: "#21385f",
      visible: true,
      locked: false,
      lineWidth: 6,
      lineStyle: "solid",
    },
    {
      id: crypto.randomUUID(),
      name: "Vrata i prolazi",
      color: "#25a37d",
      visible: true,
      locked: false,
      lineWidth: 2,
      lineStyle: "solid",
    },
    {
      id: crypto.randomUUID(),
      name: "Kote",
      color: "#da8a1f",
      visible: true,
      locked: false,
      lineWidth: 2,
      lineStyle: "dashed",
    },
    {
      id: crypto.randomUUID(),
      name: "Sigurnosni simboli",
      color: "#d64d50",
      visible: true,
      locked: false,
      lineWidth: 2,
      lineStyle: "solid",
    },
    {
      id: crypto.randomUUID(),
      name: "Napomene",
      color: "#7b5fd1",
      visible: true,
      locked: false,
      lineWidth: 1,
      lineStyle: "dashed",
    },
  ];
}

function normalizeDrawingLayers(layers = [], fallbackLayers = []) {
  const source = Array.isArray(layers) && layers.length > 0
    ? layers
    : (Array.isArray(fallbackLayers) && fallbackLayers.length > 0 ? fallbackLayers : buildDefaultDrawingLayers());
  const seenIds = new Set();
  const normalized = source.map((entry, index) => {
    const id = normalizeId(entry?.id) || crypto.randomUUID();
    if (seenIds.has(id)) {
      return null;
    }
    seenIds.add(id);
    return {
      id,
      name: normalizeText(entry?.name) || `Layer ${index + 1}`,
      color: normalizeDrawingColor(entry?.color, buildDefaultDrawingLayers()[index]?.color || "#4564d1"),
      visible: normalizeBoolean(entry?.visible, true),
      locked: normalizeBoolean(entry?.locked, false),
      lineWidth: Math.max(1, Math.min(18, Math.round(normalizeFiniteNumber(entry?.lineWidth, 2)))),
      lineStyle: normalizeDrawingLineStyle(entry?.lineStyle),
    };
  }).filter(Boolean);

  return normalized.length > 0 ? normalized : buildDefaultDrawingLayers();
}

function getDrawingElementDefaults(type = "rectangle") {
  switch (type) {
    case "line":
      return { width: 220, height: 0, stroke: "#4564d1", fill: "transparent", lineWidth: 2 };
    case "curve":
      return { width: 220, height: 120, stroke: "#4564d1", fill: "transparent", lineWidth: 2 };
    case "wall":
      return { width: 280, height: 0, stroke: "#21385f", fill: "transparent", lineWidth: 12 };
    case "dimension":
      return { width: 220, height: 0, stroke: "#da8a1f", fill: "transparent", lineWidth: 2 };
    case "ellipse":
      return { width: 220, height: 140, stroke: "#4564d1", fill: "rgba(232,238,255,0.72)", lineWidth: 2 };
    case "frame":
      return { width: 1380, height: 860, stroke: "#20416f", fill: "rgba(255,255,255,0.9)", lineWidth: 2 };
    case "door":
      return { width: 120, height: 90, stroke: "#22a06b", fill: "transparent", lineWidth: 2 };
    case "exit":
      return { width: 140, height: 56, stroke: "#1e9e68", fill: "#e8fbf2", lineWidth: 2 };
    case "extinguisher":
      return { width: 52, height: 70, stroke: "#cc4f57", fill: "#fff1f2", lineWidth: 2 };
    case "hydrant":
      return { width: 52, height: 52, stroke: "#c83d48", fill: "#fff1f2", lineWidth: 2 };
    case "stairs":
      return { width: 180, height: 120, stroke: "#3561cf", fill: "#edf3ff", lineWidth: 2 };
    case "assembly_point":
      return { width: 170, height: 72, stroke: "#1e9e68", fill: "#e8fbf2", lineWidth: 2 };
    case "first_aid":
      return { width: 84, height: 84, stroke: "#239c6d", fill: "#e7faf1", lineWidth: 2 };
    case "detector":
      return { width: 58, height: 58, stroke: "#4564d1", fill: "#eef3ff", lineWidth: 2 };
    case "panel":
      return { width: 96, height: 72, stroke: "#cc4f57", fill: "#fff1f2", lineWidth: 2 };
    case "arrow":
      return { width: 150, height: 44, stroke: "#1e9e68", fill: "#e8fbf2", lineWidth: 2 };
    case "text":
      return { width: 220, height: 40, stroke: "#4a5b78", fill: "transparent", lineWidth: 0 };
    default:
      return { width: 260, height: 140, stroke: "#4564d1", fill: "rgba(232,238,255,0.72)", lineWidth: 2 };
  }
}

function normalizeDrawingElementMetadata(metadata = {}, type = "rectangle") {
  const normalized = {
    subtitle: normalizeText(metadata?.subtitle).slice(0, 180),
    footer: normalizeText(metadata?.footer).slice(0, 180),
    note: normalizeText(metadata?.note).slice(0, 240),
    unit: normalizeText(metadata?.unit).slice(0, 16),
    autoLabel: normalizeBoolean(metadata?.autoLabel, type === "dimension"),
    curveDirection: normalizeFiniteNumber(metadata?.curveDirection, 1) >= 0 ? 1 : -1,
    curveOffset: Math.max(24, Math.min(280, normalizeFiniteNumber(metadata?.curveOffset, 72))),
    openDirection: ["left", "right"].includes(normalizeText(metadata?.openDirection).toLowerCase())
      ? normalizeText(metadata?.openDirection).toLowerCase()
      : "left",
  };

  if (type === "frame") {
    normalized.footer = normalized.footer || "Plan evakuacije i spasavanja";
  }
  if (type === "dimension") {
    normalized.unit = normalized.unit || "mm";
  }

  return normalized;
}

function normalizeDrawingElements(elements = [], fallbackLayerId = "", layers = []) {
  const allowedLayerIds = new Set((layers ?? []).map((layer) => String(layer.id)));
  const defaultLayerId = allowedLayerIds.has(String(fallbackLayerId))
    ? String(fallbackLayerId)
    : (layers?.[0]?.id ? String(layers[0].id) : "");
  const allowedTypes = new Set(["line", "curve", "wall", "dimension", "rectangle", "ellipse", "frame", "door", "exit", "extinguisher", "hydrant", "text", "stairs", "assembly_point", "first_aid", "detector", "panel", "arrow"]);

  return (Array.isArray(elements) ? elements : []).map((entry) => {
    const type = allowedTypes.has(normalizeText(entry?.type).toLowerCase())
      ? normalizeText(entry?.type).toLowerCase()
      : "rectangle";
    const defaults = getDrawingElementDefaults(type);
    const x = normalizeDrawingCoordinate(entry?.x, 160);
    const y = normalizeDrawingCoordinate(entry?.y, 160);
    const width = Math.max(0, normalizeDrawingCoordinate(entry?.width, defaults.width));
    const height = Math.max(0, normalizeDrawingCoordinate(entry?.height, defaults.height));
    const x2 = normalizeDrawingCoordinate(entry?.x2, x + defaults.width);
    const y2 = normalizeDrawingCoordinate(entry?.y2, y + defaults.height);

    const metadata = normalizeDrawingElementMetadata(entry?.metadata, type);
    const normalizedEntry = {
      id: normalizeId(entry?.id) || crypto.randomUUID(),
      type,
      layerId: allowedLayerIds.has(String(entry?.layerId)) ? String(entry.layerId) : defaultLayerId,
      x,
      y,
      x2,
      y2,
      width,
      height,
      rotation: Math.max(-360, Math.min(360, normalizeDrawingCoordinate(entry?.rotation, 0))),
      stroke: normalizeDrawingColor(entry?.stroke, defaults.stroke),
      fill: entry?.fill === "transparent"
        ? "transparent"
        : normalizeDrawingColor(entry?.fill, defaults.fill === "transparent" ? "#ffffff" : defaults.fill),
      lineWidth: Math.max(0, Math.min(24, normalizeDrawingCoordinate(entry?.lineWidth, defaults.lineWidth))),
      label: normalizeText(entry?.label || entry?.text).slice(0, 220),
      metadata,
    };

    if (["line", "curve", "wall", "dimension"].includes(type)) {
      normalizedEntry.width = Math.abs(normalizedEntry.x2 - normalizedEntry.x);
      normalizedEntry.height = Math.abs(normalizedEntry.y2 - normalizedEntry.y);
    }

    if (type === "dimension" && metadata.autoLabel !== false) {
      const deltaX = normalizedEntry.x2 - normalizedEntry.x;
      const deltaY = normalizedEntry.y2 - normalizedEntry.y;
      const length = Math.max(0, Math.round(Math.sqrt((deltaX ** 2) + (deltaY ** 2))));
      normalizedEntry.label = `${length} ${metadata.unit || "mm"}`;
    }

    return normalizedEntry;
  }).filter((entry) => entry.layerId);
}

function normalizeDrawingViewport(viewport = {}, fallback = {}) {
  return {
    zoom: Math.max(0.5, Math.min(2.5, normalizeFiniteNumber(viewport?.zoom, fallback?.zoom ?? 1))),
    gridSize: Math.max(8, Math.min(80, Math.round(normalizeFiniteNumber(viewport?.gridSize, fallback?.gridSize ?? 20)))),
    canvasWidth: Math.max(1200, Math.min(5000, Math.round(normalizeFiniteNumber(viewport?.canvasWidth, fallback?.canvasWidth ?? 2400)))),
    canvasHeight: Math.max(800, Math.min(3200, Math.round(normalizeFiniteNumber(viewport?.canvasHeight, fallback?.canvasHeight ?? 1500)))),
    snapToGrid: normalizeBoolean(viewport?.snapToGrid, fallback?.snapToGrid ?? true),
    showGrid: normalizeBoolean(viewport?.showGrid, fallback?.showGrid ?? true),
    orthoMode: normalizeBoolean(viewport?.orthoMode, fallback?.orthoMode ?? false),
  };
}

function hydrateDrawingProjectCore({
  current = null,
  state,
  input,
  timestamp,
}) {
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const requestedCompanyId = hasOwn(input, "companyId")
    ? normalizeId(input.companyId)
    : normalizeId(current?.companyId);
  const requestedLocationId = hasOwn(input, "locationId")
    ? normalizeId(input.locationId)
    : normalizeId(current?.locationId);

  let company = requestedCompanyId ? findOfferCompany(state, requestedCompanyId) : null;
  if (requestedCompanyId && !company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  let location = requestedLocationId
    ? findOfferLocation(state, requestedLocationId, requestedCompanyId || current?.companyId || "")
    : null;

  if (!location && requestedLocationId) {
    location = (state.locations ?? []).find((item) => item.id === requestedLocationId) ?? null;
  }

  if (requestedLocationId && !location) {
    throw new Error("Odabrana lokacija ne postoji.");
  }

  if (!company && location?.companyId) {
    company = findOfferCompany(state, location.companyId);
  }

  const companyId = company?.id ?? "";
  const locationId = location?.id ?? "";
  const normalizedLayers = hasOwn(input, "layers")
    ? normalizeDrawingLayers(input.layers, current?.layers ?? [])
    : normalizeDrawingLayers(current?.layers ?? []);
  const normalizedElements = hasOwn(input, "elements")
    ? normalizeDrawingElements(input.elements, normalizedLayers[0]?.id, normalizedLayers)
    : normalizeDrawingElements(current?.elements ?? [], normalizedLayers[0]?.id, normalizedLayers);
  const referenceDocuments = hasOwn(input, "referenceDocuments")
    ? normalizeAttachmentDocuments(input.referenceDocuments)
    : normalizeAttachmentDocuments(current?.referenceDocuments ?? []);
  const requestedActiveReferenceId = hasOwn(input, "activeReferenceDocumentId")
    ? normalizeId(input.activeReferenceDocumentId)
    : normalizeId(current?.activeReferenceDocumentId);
  const activeReferenceDocumentId = referenceDocuments.some((document) => String(document.id) === requestedActiveReferenceId)
    ? requestedActiveReferenceId
    : (referenceDocuments[0]?.id ?? "");

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: company?.name ?? "",
    companyOib: company?.oib ?? "",
    headquarters: company?.headquarters ?? "",
    locationId,
    locationName: location?.name ?? "",
    region: location?.region ?? "",
    coordinates: location?.coordinates ?? "",
    title: hasOwn(input, "title") ? requireText(input.title, "Naziv crteza") : requireText(current?.title, "Naziv crteza"),
    drawingType: hasOwn(input, "drawingType")
      ? normalizeDrawingProjectType(input.drawingType)
      : normalizeDrawingProjectType(current?.drawingType, "custom"),
    status: hasOwn(input, "status")
      ? normalizeDrawingProjectStatus(input.status)
      : normalizeDrawingProjectStatus(current?.status, "draft"),
    scaleLabel: hasOwn(input, "scaleLabel") ? normalizeText(input.scaleLabel).slice(0, 48) : normalizeText(current?.scaleLabel).slice(0, 48),
    note: hasOwn(input, "note") ? normalizeText(input.note) : normalizeText(current?.note),
    referenceDocuments,
    activeReferenceDocumentId,
    layers: normalizedLayers,
    elements: normalizedElements,
    viewport: hasOwn(input, "viewport")
      ? normalizeDrawingViewport(input.viewport, current?.viewport)
      : normalizeDrawingViewport(current?.viewport),
    createdByUserId: hasOwn(input, "createdByUserId") ? normalizeText(input.createdByUserId) : normalizeText(current?.createdByUserId),
    createdByLabel: hasOwn(input, "createdByLabel") ? normalizeText(input.createdByLabel) : normalizeText(current?.createdByLabel),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function hydratePurchaseOrderCore({
  current = null,
  state,
  input,
  timestamp,
  purchaseOrderNumber = current?.purchaseOrderNumber ?? "",
  purchaseOrderYear = current?.purchaseOrderYear ?? Number(timestamp.slice(0, 4)),
  purchaseOrderSequence = current?.purchaseOrderSequence ?? 0,
}) {
  const companyId = hasOwn(input, "companyId")
    ? requireText(input.companyId, "Tvrtka")
    : requireText(current?.companyId, "Tvrtka");
  const company = findOfferCompany(state, companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const requestedLocationIds = hasOwn(input, "selectedLocationIds")
    ? normalizeIdList(input.selectedLocationIds)
    : normalizeIdList(current?.selectedLocationIds ?? []);
  const fallbackLocationScope = requestedLocationIds.length > 1
    ? "selection"
    : normalizeId(hasOwn(input, "locationId") ? input.locationId : current?.locationId)
      ? "single"
      : "none";
  const nextLocationScope = hasOwn(input, "locationScope")
    ? normalizeOfferLocationScope(input.locationScope, fallbackLocationScope)
    : normalizeOfferLocationScope(current?.locationScope, fallbackLocationScope);
  const locationWasExplicitlyChanged = hasOwn(input, "locationId")
    || hasOwn(input, "selectedLocationIds")
    || hasOwn(input, "locationScope");
  const companyLocations = (state.locations ?? []).filter((item) => item.companyId === companyId);
  const companyLocationIds = new Set(companyLocations.map((item) => item.id));
  let selectedLocationIds = requestedLocationIds.filter((locationId) => companyLocationIds.has(locationId));

  if (hasOwn(input, "locationId")) {
    const directLocationId = normalizeId(input.locationId);
    if (directLocationId && !selectedLocationIds.includes(directLocationId)) {
      selectedLocationIds = [directLocationId, ...selectedLocationIds].filter((locationId, index, list) => (
        companyLocationIds.has(locationId) && list.indexOf(locationId) === index
      ));
    }
  } else if (!selectedLocationIds.length) {
    const currentLocationId = normalizeId(current?.locationId);
    if (currentLocationId) {
      selectedLocationIds = [currentLocationId].filter((locationId) => companyLocationIds.has(locationId));
    }
  }

  if (locationWasExplicitlyChanged && requestedLocationIds.some((locationId) => !companyLocationIds.has(locationId))) {
    throw new Error("Odabrana lokacija ne pripada tvrtki.");
  }

  if (nextLocationScope === "all") {
    selectedLocationIds = companyLocations.map((location) => location.id);
  }

  if (nextLocationScope === "single" && selectedLocationIds.length > 1) {
    selectedLocationIds = selectedLocationIds.slice(0, 1);
  }

  const locationScope = nextLocationScope === "all"
    ? (selectedLocationIds.length > 0 ? "all" : "none")
    : nextLocationScope === "single"
      ? (selectedLocationIds.length > 0 ? "single" : "none")
      : nextLocationScope === "selection"
        ? (selectedLocationIds.length > 1 ? "selection" : selectedLocationIds.length === 1 ? "single" : "none")
        : "none";
  const locationId = selectedLocationIds[0] || "";
  const location = locationId ? findOfferLocation(state, locationId, companyId) : null;
  const selectedLocations = selectedLocationIds
    .map((selectedId) => findOfferLocation(state, selectedId, companyId))
    .filter(Boolean);
  const selectedLocationNames = selectedLocations.map((entry) => entry.name || "").filter(Boolean);
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const taxRate = hasOwn(input, "taxRate")
    ? normalizeOfferTaxRate(input.taxRate)
    : normalizeOfferTaxRate(current?.taxRate ?? 25);
  const discountRate = hasOwn(input, "discountRate")
    ? normalizeOfferDiscountRate(input.discountRate)
    : normalizeOfferDiscountRate(current?.discountRate ?? 0);
  const showTotalAmount = hasOwn(input, "showTotalAmount")
    ? normalizeBoolean(input.showTotalAmount, true)
    : normalizeBoolean(current?.showTotalAmount, true);
  const documentMode = hasOwn(input, "documentMode")
    ? normalizeCommercialDocumentMode(input.documentMode, current?.documentMode ?? "app")
    : normalizeCommercialDocumentMode(current?.documentMode, "app");
  const items = hasOwn(input, "items")
    ? normalizeOfferItems(input.items, { allowEmpty: documentMode === "upload" })
    : (current?.items ?? []);
  const totals = calculateOfferTotals(items, taxRate, discountRate);
  const fallbackPurchaseOrderDate = current?.purchaseOrderDate ?? timestamp.slice(0, 10);
  const purchaseOrderDate = hasOwn(input, "purchaseOrderDate")
    ? (normalizeOptionalDate(input.purchaseOrderDate) ?? timestamp.slice(0, 10))
    : (normalizeOptionalDate(fallbackPurchaseOrderDate) ?? timestamp.slice(0, 10));
  const contactSlot = normalizeText(hasOwn(input, "contactSlot") ? input.contactSlot : current?.contactSlot);
  const shouldRefreshContactFromLocation = !hasOwn(input, "contactName")
    && !hasOwn(input, "contactPhone")
    && !hasOwn(input, "contactEmail")
    && locationScope === "single"
    && Boolean(location)
    && (
      !current
      || hasOwn(input, "companyId")
      || hasOwn(input, "locationId")
      || hasOwn(input, "selectedLocationIds")
      || hasOwn(input, "locationScope")
      || hasOwn(input, "contactSlot")
    );
  const selectedContact = shouldRefreshContactFromLocation
    ? selectLocationContact(location, contactSlot)
    : null;
  const contactName = hasOwn(input, "contactName")
    ? normalizeText(input.contactName)
    : selectedContact
      ? selectedContact.name
      : normalizeText(current?.contactName);
  const contactPhone = hasOwn(input, "contactPhone")
    ? normalizeText(input.contactPhone)
    : selectedContact
      ? selectedContact.phone
      : normalizeText(current?.contactPhone);
  const contactEmail = hasOwn(input, "contactEmail")
    ? normalizeText(input.contactEmail)
    : selectedContact
      ? selectedContact.email
      : normalizeText(current?.contactEmail);
  const companyLocationCount = companyLocations.length;
  const locationName = locationScope === "all"
    ? "Sve lokacije"
    : locationScope === "none"
      ? "Bez lokacije"
      : locationScope === "selection"
        ? `${selectedLocationNames.length} od ${companyLocationCount} lokacija`
        : (location?.name ?? "");
  const orderDirection = hasOwn(input, "orderDirection")
    ? normalizePurchaseOrderDirection(input.orderDirection)
    : normalizePurchaseOrderDirection(current?.orderDirection, "incoming");
  const statusFallback = orderDirection === "incoming" ? "received" : "issued";
  const status = hasOwn(input, "status")
    ? normalizePurchaseOrderStatus(input.status)
    : normalizePurchaseOrderStatus(current?.status, statusFallback);
  const documents = hasOwn(input, "documents")
    ? normalizeAttachmentDocuments(input.documents)
    : normalizeAttachmentDocuments(current?.documents ?? []);

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: company.name,
    companyOib: company.oib ?? "",
    headquarters: company.headquarters ?? "",
    locationId,
    selectedLocationIds,
    selectedLocationNames,
    locationScope,
    locationName,
    region: location?.region ?? "",
    coordinates: location?.coordinates ?? "",
    contactSlot,
    contactName,
    contactPhone,
    contactEmail,
    purchaseOrderNumber: requireText(purchaseOrderNumber || current?.purchaseOrderNumber, "Broj narudzbenice"),
    purchaseOrderYear: Number(purchaseOrderYear) || Number(timestamp.slice(0, 4)),
    purchaseOrderSequence: Number(purchaseOrderSequence) || 0,
    documentMode,
    internalDocumentNumber: hasOwn(input, "internalDocumentNumber")
      ? normalizeText(input.internalDocumentNumber)
      : normalizeText(current?.internalDocumentNumber),
    title: hasOwn(input, "title") ? requireText(input.title, "Naziv narudzbenice") : current?.title ?? "",
    serviceLine: hasOwn(input, "serviceLine")
      ? (documentMode === "upload" ? normalizeText(input.serviceLine || input.title) : requireText(input.serviceLine, "Vrsta usluge"))
      : current?.serviceLine ?? "",
    status,
    orderDirection,
    purchaseOrderDate,
    validUntil: hasOwn(input, "validUntil")
      ? normalizeOptionalDate(input.validUntil)
      : normalizeOptionalDate(current?.validUntil),
    externalDocumentNumber: hasOwn(input, "externalDocumentNumber")
      ? normalizeText(input.externalDocumentNumber)
      : normalizeText(current?.externalDocumentNumber),
    note: hasOwn(input, "note") ? normalizeText(input.note) : current?.note ?? "",
    currency: hasOwn(input, "currency")
      ? (normalizeText(input.currency).toUpperCase() || "EUR")
      : (normalizeText(current?.currency).toUpperCase() || "EUR"),
    showTotalAmount,
    taxRate,
    discountRate,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxableSubtotal: totals.taxableSubtotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    items: items.map((item) => ({ ...item })),
    documents: documents.map((document) => ({ ...document })),
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function normalizeRiskAssessmentMeasureItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
    measure: normalizeText(item?.measure),
    deadline: normalizeText(item?.deadline),
    responsiblePerson: normalizeText(item?.responsiblePerson),
    controlMethod: normalizeText(item?.controlMethod),
    status: normalizeText(item?.status || "open"),
  })).filter((item) => item.measure || item.deadline || item.responsiblePerson || item.controlMethod);
}

function normalizeRiskAssessmentOrganizationUnits(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const id = normalizeId(item?.id) || crypto.randomUUID();
    return {
      id,
      parentId: normalizeId(item?.parentId),
      type: normalizeText(item?.type || item?.unitType || item?.kind || "unit"),
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
      name: normalizeText(item?.name),
      shortDescription: normalizeText(item?.shortDescription),
      description: normalizeText(item?.description),
      detailedDescription: normalizeText(item?.detailedDescription),
      responsiblePerson: normalizeText(item?.responsiblePerson),
      workerCount: normalizeText(item?.workerCount),
      maleWorkerCount: normalizeText(item?.maleWorkerCount),
      femaleWorkerCount: normalizeText(item?.femaleWorkerCount),
      linkedJobIds: Array.from(new Set(
        (Array.isArray(item?.linkedJobIds) ? item.linkedJobIds : [])
          .map((value) => normalizeId(value))
          .filter(Boolean),
      )),
      note: normalizeText(item?.note),
      collapsed: normalizeBoolean(item?.collapsed, false),
    };
  }).filter((item) => (
    item.name
    || item.shortDescription
    || item.description
    || item.detailedDescription
    || item.responsiblePerson
    || item.workerCount
    || item.maleWorkerCount
    || item.femaleWorkerCount
    || item.linkedJobIds.length > 0
    || item.note
  ));
}

const JOB_PUR_POINT_SELECTION_LIMIT = 40;

function normalizeRiskAssessmentRiskRows(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    code: normalizeText(item?.code),
    topCategory: normalizeText(item?.topCategory),
    category: normalizeText(item?.category),
    group: normalizeText(item?.group),
    hazard: normalizeText(item?.hazard),
    description: normalizeText(item?.description),
    source: normalizeText(item?.source),
    possibleConsequences: normalizeText(item?.possibleConsequences ?? item?.possibleEvent),
    probability: normalizeText(item?.probability),
    consequence: normalizeText(item?.consequence),
    riskCode: normalizeText(item?.riskCode),
    riskLevel: normalizeText(item?.riskLevel),
    likelihoodConsequence: normalizeText(item?.likelihoodConsequence),
    purPoints: normalizeJobOptionValues(item?.purPoints).slice(0, JOB_PUR_POINT_SELECTION_LIMIT),
    workNote: normalizeText(item?.workNote ?? item?.jobsNote ?? item?.posloviNote),
    note: normalizeText(item?.note),
    existingMeasures: normalizeText(item?.existingMeasures),
    additionalMeasures: normalizeText(item?.additionalMeasures),
    measures: normalizeText(item?.measures),
    deadline: normalizeText(item?.deadline),
    responsiblePerson: normalizeText(item?.responsiblePerson),
    controlMethod: normalizeText(item?.controlMethod),
  })).filter((item) => (
    item.code
    || item.topCategory
    || item.category
    || item.group
    || item.hazard
    || item.description
    || item.source
    || item.possibleConsequences
    || item.riskLevel
    || item.purPoints.length > 0
    || item.workNote
    || item.note
    || item.existingMeasures
    || item.additionalMeasures
    || item.measures
    || item.deadline
    || item.responsiblePerson
    || item.controlMethod
  ));
}

function normalizeRiskAssessmentYesNo(value, fallback = "np") {
  const normalized = normalizeText(value).toLowerCase();
  if (["da", "yes", "true", "1"].includes(normalized)) {
    return "da";
  }
  if (["ne", "no", "false", "0"].includes(normalized)) {
    return "ne";
  }
  if (["np", "n/p", "nije primjenjivo"].includes(normalized)) {
    return "np";
  }
  return fallback;
}

function normalizeRiskAssessmentEligibilityItem(item = {}) {
  return {
    allowed: normalizeRiskAssessmentYesNo(item?.allowed, "np"),
    note: normalizeText(item?.note),
  };
}

function normalizeRiskAssessmentEligibility(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    minorWorkers: normalizeRiskAssessmentEligibilityItem(source.minorWorkers),
    pregnantWorkers: normalizeRiskAssessmentEligibilityItem(source.pregnantWorkers),
    recentBirthWorkers: normalizeRiskAssessmentEligibilityItem(source.recentBirthWorkers),
    breastfeedingWorkers: normalizeRiskAssessmentEligibilityItem(source.breastfeedingWorkers),
    occupationalDiseaseWorkers: normalizeRiskAssessmentEligibilityItem(source.occupationalDiseaseWorkers),
    reducedAbilityWorkers: normalizeRiskAssessmentEligibilityItem(source.reducedAbilityWorkers),
  };
}

function normalizeRiskAssessmentPpeItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    catalogId: normalizeText(item?.catalogId),
    name: normalizeText(item?.name),
    category: normalizeText(item?.category),
    bodyPart: normalizeText(item?.bodyPart),
    norm: normalizeText(item?.norm),
    description: normalizeText(item?.description),
    hazardLinks: normalizeText(item?.hazardLinks),
    required: normalizeBoolean(item?.required ?? item?.mandatory, true),
    mandatory: normalizeBoolean(item?.mandatory ?? item?.required, true),
    note: normalizeText(item?.note),
    jobId: normalizeId(item?.jobId),
    riskRowIds: Array.from(new Set(
      (Array.isArray(item?.riskRowIds) ? item.riskRowIds : [])
        .map((value) => normalizeId(value))
        .filter(Boolean),
    )),
  })).filter((item) => (
    item.name
    || item.category
    || item.bodyPart
    || item.norm
    || item.description
    || item.hazardLinks
    || item.note
    || item.riskRowIds.length > 0
  ));
}

function normalizeRiskAssessmentClientJobInput(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  return {
    workerCount: normalizeText(source.workerCount),
    workplace: normalizeText(source.workplace),
    workSchedule: normalizeText(source.workSchedule),
    workOrganization: normalizeText(source.workOrganization),
    description: normalizeText(source.description),
    tasks: normalizeText(source.tasks),
    workplaceOptions: normalizeJobOptionValues(source.workplaceOptions),
    organizationOptions: normalizeJobOptionValues(source.organizationOptions),
    bodyPositions: normalizeJobOptionValues(source.bodyPositions),
    importantFunctions: normalizeJobOptionValues(source.importantFunctions),
    workConditions: normalizeJobOptionValues(source.workConditions),
    purPoints: normalizeJobOptionValues(source.purPoints).slice(0, JOB_PUR_POINT_SELECTION_LIMIT),
    safeWorkTrainingRequired: normalizeBoolean(source.safeWorkTrainingRequired, false),
    medicalFitnessRequired: normalizeBoolean(source.medicalFitnessRequired, false),
    visionCheckRequired: normalizeBoolean(source.visionCheckRequired, false),
    specialWorkReason: normalizeText(source.specialWorkReason),
    trainings: normalizeText(source.trainings),
    medicalExams: normalizeText(source.medicalExams),
    toolsAndMachines: normalizeText(source.toolsAndMachines),
    workEquipment: normalizeText(source.workEquipment),
    workSubstances: normalizeText(source.workSubstances),
    workplaces: normalizeText(source.workplaces),
    workplaceArrangement: normalizeText(source.workplaceArrangement),
    harmfulSources: normalizeText(source.harmfulSources),
    ppeText: normalizeText(source.ppeText),
    psychosocialRelevant: normalizeBoolean(source.psychosocialRelevant, false),
    psychosocialLevel: normalizeText(source.psychosocialLevel),
    psychosocialText: normalizeText(source.psychosocialText),
    armorNotes: normalizeText(source.armorNotes),
    note: normalizeText(source.note),
    submittedByUserId: normalizeId(source.submittedByUserId),
    submittedByLabel: normalizeText(source.submittedByLabel),
    submittedAt: normalizeText(source.submittedAt),
  };
}

function hasRiskAssessmentClientJobInput(input = {}) {
  return Boolean(
    input.workerCount
    || input.workplace
    || input.workSchedule
    || input.workOrganization
    || input.description
    || input.tasks
    || input.workplaceOptions.length > 0
    || input.organizationOptions.length > 0
    || input.bodyPositions.length > 0
    || input.importantFunctions.length > 0
    || input.workConditions.length > 0
    || input.purPoints.length > 0
    || input.safeWorkTrainingRequired
    || input.medicalFitnessRequired
    || input.visionCheckRequired
    || input.specialWorkReason
    || input.trainings
    || input.medicalExams
    || input.toolsAndMachines
    || input.workEquipment
    || input.workSubstances
    || input.workplaces
    || input.workplaceArrangement
    || input.harmfulSources
    || input.ppeText
    || input.psychosocialRelevant
    || input.psychosocialLevel
    || input.psychosocialText
    || input.armorNotes
    || input.note
  );
}

function normalizeRiskAssessmentJobs(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const specialConditions = normalizeText(item?.specialConditions ?? item?.specialWorkReason);
    const qualifications = normalizeText(item?.qualifications ?? item?.requiredQualification);
    const organization = normalizeText(item?.organization ?? item?.workOrganization);
    const clientInput = normalizeRiskAssessmentClientJobInput(item?.clientInput);

    return {
      id: normalizeId(item?.id) || crypto.randomUUID(),
      sourceJobIds: Array.from(new Set(
        (Array.isArray(item?.sourceJobIds) ? item.sourceJobIds : [])
          .map((value) => normalizeId(value))
          .filter(Boolean),
      )),
      organizationUnitId: normalizeId(item?.organizationUnitId),
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
      status: normalizeText(item?.status || "draft"),
      jobTitle: normalizeText(item?.jobTitle),
      shortDescription: normalizeText(item?.shortDescription),
      detailedDescription: normalizeText(item?.detailedDescription),
      workplaceDescription: normalizeText(item?.workplaceDescription),
      workEnvironment: normalizeText(item?.workEnvironment),
      workplace: normalizeText(item?.workplace),
      workerCount: normalizeText(item?.workerCount),
      alcoholLimit: normalizeText(item?.alcoholLimit),
      specialWorkConditions: normalizeRiskAssessmentYesNo(item?.specialWorkConditions, ""),
      specialWorkReason: normalizeText(item?.specialWorkReason ?? specialConditions),
      specialConditions,
      note: normalizeText(item?.note),
      increasedInsurance: normalizeRiskAssessmentYesNo(item?.increasedInsurance, ""),
      requiredQualification: normalizeText(item?.requiredQualification ?? qualifications),
      qualifications,
      workOrganization: normalizeText(item?.workOrganization ?? organization),
      organization,
      workSchedule: normalizeText(item?.workSchedule),
      description: normalizeText(item?.description),
      tasks: normalizeText(item?.tasks),
      workSubstances: normalizeText(item?.workSubstances),
      chemicalSubstances: normalizeText(item?.chemicalSubstances ?? item?.workSubstances),
      biologicalHazards: normalizeText(item?.biologicalHazards),
      workEquipment: normalizeText(item?.workEquipment),
      toolsAndMachines: normalizeText(item?.toolsAndMachines),
      workplaces: normalizeText(item?.workplaces),
      workplaceOptions: normalizeJobOptionValues(item?.workplaceOptions),
      organizationOptions: normalizeJobOptionValues(item?.organizationOptions),
      bodyPositions: normalizeJobOptionValues(item?.bodyPositions),
      importantFunctions: normalizeJobOptionValues(item?.importantFunctions),
      workConditions: normalizeJobOptionValues(item?.workConditions),
      toolsAndMachinesOptions: normalizeJobOptionValues(item?.toolsAndMachinesOptions),
      chemicalSubstanceOptions: normalizeJobOptionValues(item?.chemicalSubstanceOptions),
      biologicalHazardOptions: normalizeJobOptionValues(item?.biologicalHazardOptions),
      purPoints: normalizeJobOptionValues(item?.purPoints).slice(0, JOB_PUR_POINT_SELECTION_LIMIT),
      workplaceArrangement: normalizeText(item?.workplaceArrangement),
      harmfulSources: normalizeText(item?.harmfulSources),
      shiftWork: normalizeBoolean(item?.shiftWork, false),
      nightWork: normalizeBoolean(item?.nightWork, false),
      fieldWork: normalizeBoolean(item?.fieldWork, false),
      remoteWork: normalizeBoolean(item?.remoteWork, false),
      workAtHeight: normalizeBoolean(item?.workAtHeight, false),
      confinedSpace: normalizeBoolean(item?.confinedSpace, false),
      outdoorWork: normalizeBoolean(item?.outdoorWork, false),
      computerWork: normalizeBoolean(item?.computerWork, false),
      chemicalWork: normalizeBoolean(item?.chemicalWork, false),
      biologicalWork: normalizeBoolean(item?.biologicalWork, false),
      physicalHazardsWork: normalizeBoolean(item?.physicalHazardsWork, false),
      safeWorkTrainingRequired: normalizeBoolean(item?.safeWorkTrainingRequired, false),
      medicalFitnessRequired: normalizeBoolean(item?.medicalFitnessRequired, false),
      visionCheckRequired: normalizeBoolean(item?.visionCheckRequired, false),
      psychosocialRelevant: normalizeBoolean(item?.psychosocialRelevant, false),
      psychosocialLevel: normalizeText(item?.psychosocialLevel),
      psychosocialText: normalizeText(item?.psychosocialText),
      trainings: normalizeText(item?.trainings),
      medicalExams: normalizeText(item?.medicalExams),
      ppeText: normalizeText(item?.ppeText),
      ppeItems: normalizeRiskAssessmentPpeItems(item?.ppeItems ?? []),
      hiddenBlocks: normalizeJobOptionValues(item?.hiddenBlocks),
      clientInput,
      eligibility: normalizeRiskAssessmentEligibility(item?.eligibility),
      riskRows: normalizeRiskAssessmentRiskRows(item?.riskRows ?? []),
    };
  }).filter((item) => (
    item.organizationUnitId
    || item.sourceJobIds.length > 0
    || item.jobTitle
    || item.shortDescription
    || item.detailedDescription
    || item.workplaceDescription
    || item.workEnvironment
    || item.workplace
    || item.description
    || item.tasks
    || item.workSubstances
    || item.chemicalSubstances
    || item.biologicalHazards
    || item.workEquipment
    || item.toolsAndMachines
    || item.workplaces
    || item.workplaceOptions.length > 0
    || item.organizationOptions.length > 0
    || item.bodyPositions.length > 0
    || item.importantFunctions.length > 0
    || item.workConditions.length > 0
    || item.toolsAndMachinesOptions.length > 0
    || item.chemicalSubstanceOptions.length > 0
    || item.biologicalHazardOptions.length > 0
    || item.purPoints.length > 0
    || item.harmfulSources
    || item.psychosocialRelevant
    || item.psychosocialLevel
    || item.psychosocialText
    || item.trainings
    || item.medicalExams
    || item.ppeText
    || item.ppeItems.length > 0
    || item.hiddenBlocks.length > 0
    || hasRiskAssessmentClientJobInput(item.clientInput)
    || item.riskRows.length > 0
  ));
}

function normalizeRiskAssessmentRiskTemplates(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    name: normalizeText(item?.name),
    jobHint: normalizeText(item?.jobHint),
    riskRows: normalizeRiskAssessmentRiskRows(item?.riskRows ?? []),
    ppeItems: normalizeRiskAssessmentPpeItems(item?.ppeItems ?? []),
  })).filter((item) => item.name && (item.riskRows.length > 0 || item.ppeItems.length > 0));
}

function normalizeRiskAssessmentChemicalTextList(value = []) {
  const source = Array.isArray(value)
    ? value
    : String(value ?? "").split(/\n+|;+/);
  return Array.from(new Set(source
    .map((entry) => normalizeText(entry))
    .filter(Boolean)))
    .slice(0, 80);
}

const RISK_ASSESSMENT_CAS_NAME_ALIASES = new Map([
  ["8006-61-9", "Benzin"],
]);

function normalizeRiskAssessmentChemicalCasNumber(value = "") {
  return normalizeText(value).replace(/\s+/g, "");
}

function isRiskAssessmentChemicalNameBoilerplate(value = "") {
  const normalized = normalizeText(value)
    .toLocaleLowerCase("hr-HR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /\b(?:sigurnosno\s*-?\s*tehnicki\s+list|safety\s+data\s+sheet|sukladno\s+uredbi|sukladan\s+uredbi|according\s+to\s+regulation)\b/i.test(normalized);
}

function trimRiskAssessmentChemicalInlineName(value = "") {
  let text = normalizeText(value).replace(/\s+/g, " ").trim();
  const boundaryIndex = text.search(/\s+(?=(?:datum|date|izdanje|edition|rep\.?|revizija|revision|verzija|version|stranica|page|ufi|cas(?:\s*(?:br\.?|broj|no\.?|number))?|ec\s*(?:broj|number|no\.?)?|reach|klasa|ur\.?\s*broj|urbroj|odjeljak|section)\b\s*:?)/i);
  if (boundaryIndex > 0) {
    text = text.slice(0, boundaryIndex);
  }
  return text.replace(/^[:;.,\-\s]+|[:;.,\-\s]+$/g, "").trim();
}

function normalizeRiskAssessmentChemicalName(value = "", casNumber = "") {
  const name = normalizeText(value);
  if (!isRiskAssessmentChemicalNameBoilerplate(name)) {
    return name;
  }
  const productNameMatch = name.match(/\b(?:naziv\s+proizvoda|product\s+name|trade\s+name|substance\s+name)\s*:?\s*(.+)$/i);
  const productName = trimRiskAssessmentChemicalInlineName(productNameMatch?.[1] || "");
  if (productName && !isRiskAssessmentChemicalNameBoilerplate(productName)) {
    return productName;
  }
  return RISK_ASSESSMENT_CAS_NAME_ALIASES.get(normalizeRiskAssessmentChemicalCasNumber(casNumber)) || "";
}

function normalizeRiskAssessmentChemicals(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
    name: normalizeRiskAssessmentChemicalName(item?.name, item?.casNumber ?? item?.cas),
    casNumber: normalizeText(item?.casNumber ?? item?.cas),
    ecNumber: normalizeText(item?.ecNumber ?? item?.ec),
    reachNumber: normalizeText(item?.reachNumber ?? item?.reach),
    formula: normalizeText(item?.formula ?? item?.molecularFormula),
    molecularWeight: normalizeText(item?.molecularWeight),
    iupacName: normalizeText(item?.iupacName),
    supplier: normalizeText(item?.supplier),
    recommendedUse: normalizeText(item?.recommendedUse),
    classification: normalizeText(item?.classification),
    signalWords: normalizeRiskAssessmentChemicalTextList(item?.signalWords),
    pictograms: normalizeRiskAssessmentChemicalTextList(item?.pictograms),
    hazardStatements: normalizeRiskAssessmentChemicalTextList(item?.hazardStatements),
    precautionaryStatements: normalizeRiskAssessmentChemicalTextList(item?.precautionaryStatements),
    exposureLimits: normalizeText(item?.exposureLimits),
    ppe: normalizeText(item?.ppe),
    storage: normalizeText(item?.storage),
    firstAid: normalizeText(item?.firstAid),
    fireMeasures: normalizeText(item?.fireMeasures),
    spillMeasures: normalizeText(item?.spillMeasures),
    source: normalizeText(item?.source),
    sourceFileName: normalizeText(item?.sourceFileName),
    stlFileName: normalizeText(item?.stlFileName ?? item?.sourceFileName),
    stlFileType: normalizeText(item?.stlFileType),
    stlFileSize: Number.isFinite(Number(item?.stlFileSize)) ? Number(item.stlFileSize) : 0,
    stlUploadedAt: normalizeOptionalDateTime(item?.stlUploadedAt ?? item?.extractedAt) ?? "",
    stlTextPreview: normalizeText(item?.stlTextPreview).slice(0, 12000),
    pubChemCid: normalizeText(item?.pubChemCid ?? item?.cid),
    pubChemUrl: normalizeText(item?.pubChemUrl),
    pubChemName: normalizeText(item?.pubChemName),
    probability: normalizeText(item?.probability),
    consequence: normalizeText(item?.consequence),
    riskLevel: normalizeText(item?.riskLevel),
    officialGviPpm: normalizeText(item?.officialGviPpm),
    officialGviMgM3: normalizeText(item?.officialGviMgM3),
    officialKgviPpm: normalizeText(item?.officialKgviPpm),
    officialKgviMgM3: normalizeText(item?.officialKgviMgM3),
    officialLimitNote: normalizeText(item?.officialLimitNote),
    officialDirective: normalizeText(item?.officialDirective),
    prilogIiDivision: normalizeText(item?.prilogIiDivision),
    prilogIiVaporGvi: normalizeText(item?.prilogIiVaporGvi),
    prilogIiDustGvi: normalizeText(item?.prilogIiDustGvi),
    prilogIiHazardCodes: normalizeRiskAssessmentChemicalTextList(item?.prilogIiHazardCodes),
    estimatedConsequenceSize: normalizeText(item?.estimatedConsequenceSize),
    note: normalizeText(item?.note),
    usedInJobIds: Array.from(new Set(
      (Array.isArray(item?.usedInJobIds) ? item.usedInJobIds : [])
        .map((value) => normalizeId(value))
        .filter(Boolean),
    )),
  })).filter((item) => (
    item.name
    || item.casNumber
    || item.ecNumber
    || item.reachNumber
    || item.formula
    || item.classification
    || item.hazardStatements.length > 0
    || item.precautionaryStatements.length > 0
    || item.exposureLimits
    || item.ppe
    || item.storage
    || item.stlFileName
    || item.stlTextPreview
    || item.note
  ));
}

function normalizeRiskAssessmentBiologicalRisks(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const probability = normalizeText(item?.probability || "mv");
    const consequence = normalizeText(item?.consequence || "mš");
    return {
      id: normalizeId(item?.id) || crypto.randomUUID(),
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
      catalogId: normalizeId(item?.catalogId),
      agentName: normalizeText(item?.agentName ?? item?.name ?? item?.hazard).slice(0, 260),
      category: normalizeText(item?.category).slice(0, 160),
      group: normalizeText(item?.group).slice(0, 40),
      classification: normalizeText(item?.classification).slice(0, 40),
      limitedAirborneRisk: normalizeBoolean(item?.limitedAirborneRisk, false),
      noteCodes: normalizeRiskAssessmentChemicalTextList(item?.noteCodes).slice(0, 8),
      source: normalizeText(item?.source ?? item?.exposureSource).slice(0, 1200),
      possibleConsequences: normalizeText(item?.possibleConsequences ?? item?.consequences).slice(0, 1200),
      probability,
      consequence,
      riskLevel: normalizeText(item?.riskLevel).slice(0, 80),
      note: normalizeText(item?.note).slice(0, 1600),
      existingMeasures: normalizeText(item?.existingMeasures ?? item?.measures).slice(0, 1800),
      usedInJobIds: Array.from(new Set(
        (Array.isArray(item?.usedInJobIds) ? item.usedInJobIds : [])
          .map((value) => normalizeId(value))
          .filter(Boolean),
      )),
    };
  }).filter((item) => (
    item.agentName
    || item.category
    || item.classification
    || item.source
    || item.possibleConsequences
    || item.note
    || item.existingMeasures
    || item.usedInJobIds.length > 0
  ));
}

function normalizeRiskAssessmentManualPosture(value = "") {
  const normalized = normalizeText(value);
  if (normalized === "bent" || normalized === "twist") {
    return "slight";
  }
  if (normalized === "overhead") {
    return "unfavorable";
  }
  if (normalized === "neutral") {
    return "upright";
  }
  return normalized || "upright";
}

function normalizeRiskAssessmentManualHandlingItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
    activity: normalizeText(item?.activity ?? item?.title).slice(0, 220),
    jobId: normalizeId(item?.jobId),
    operationType: normalizeText(item?.operationType || "lift").slice(0, 40),
    workerGender: normalizeText(item?.workerGender || "male").slice(0, 40),
    loadWeightKg: normalizeText(item?.loadWeightKg ?? item?.massKg).slice(0, 40),
    transfersPerHour: normalizeText(item?.transfersPerHour ?? item?.frequencyPerHour).slice(0, 40),
    durationMinutes: normalizeText(item?.durationMinutes).slice(0, 40),
    carryingDistanceMeters: normalizeText(item?.carryingDistanceMeters ?? item?.distanceMeters).slice(0, 40),
    verticalLiftCm: normalizeText(item?.verticalLiftCm).slice(0, 40),
    horizontalReachCm: normalizeText(item?.horizontalReachCm).slice(0, 40),
    posture: normalizeRiskAssessmentManualPosture(item?.posture).slice(0, 40),
    workConditions: normalizeText(item?.workConditions || "good").slice(0, 40),
    gripQuality: normalizeText(item?.gripQuality || "good").slice(0, 40),
    existingMeasures: normalizeText(item?.existingMeasures ?? item?.measures).slice(0, 2000),
    note: normalizeText(item?.note).slice(0, 2000),
  })).filter((item) => (
    item.activity
    || item.loadWeightKg
    || item.transfersPerHour
    || item.durationMinutes
    || item.carryingDistanceMeters
    || item.existingMeasures
    || item.note
  )).map((item, index) => ({ ...item, order: index + 1 }));
}

const RISK_ASSESSMENT_REPORT_TEMPLATE_SECTION_KEYS = new Set([
  "cover",
  "contents",
  "employer",
  "intro",
  "process",
  "general",
  "computer",
  "rules",
  "structure",
  "findings",
  "work_equipment",
  "work_environment",
  "inspections",
  "measures",
  "jobs",
  "chemicals",
  "biological",
  "ppe",
  "manual_handling",
  "overview",
  "signatures",
]);

const DEFAULT_RISK_ASSESSMENT_REPORT_TEMPLATE_SECTIONS = Object.freeze([
  "cover",
  "contents",
  "employer",
  "intro",
  "process",
  "general",
  "computer",
  "rules",
  "structure",
  "findings",
  "work_equipment",
  "work_environment",
  "inspections",
  "measures",
  "jobs",
  "chemicals",
  "biological",
  "ppe",
  "manual_handling",
  "overview",
  "signatures",
]);

function normalizeRiskAssessmentReportTemplateSectionKey(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return RISK_ASSESSMENT_REPORT_TEMPLATE_SECTION_KEYS.has(normalized) ? normalized : "intro";
}

function normalizeRiskAssessmentReportTemplateSections(items = []) {
  const source = Array.isArray(items) && items.length
    ? items
    : DEFAULT_RISK_ASSESSMENT_REPORT_TEMPLATE_SECTIONS.map((key) => ({ key }));
  const seen = new Set();

  return source.map((item, index) => {
    const key = normalizeRiskAssessmentReportTemplateSectionKey(item?.key ?? item?.placeholderKey);
    let id = normalizeId(item?.id);
    if (!id || seen.has(id)) {
      id = crypto.randomUUID();
    }
    seen.add(id);

    return {
      id,
      key,
      placeholder: normalizeText(item?.placeholder) || `{{RISK_${key.toUpperCase()}}}`,
      title: normalizeText(item?.title),
      enabled: normalizeBoolean(item?.enabled, true),
      pageBreakBefore: normalizeBoolean(item?.pageBreakBefore, false),
      includeInToc: normalizeBoolean(item?.includeInToc, !["cover", "contents"].includes(key)),
      note: normalizeText(item?.note),
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
    };
  }).filter((item) => item.key)
    .sort((left, right) => left.order - right.order)
    .map((item, index) => ({ ...item, order: index + 1 }));
}

export function normalizeRiskAssessmentReportWordTemplate(value = null) {
  const source = value && typeof value === "object" ? value : {};
  const fileName = normalizeText(source.fileName);
  const dataUrl = normalizeText(source.dataUrl || source.storageUrl || source.url || source.inlineDataUrl);
  if (!fileName && !dataUrl) {
    return null;
  }
  return {
    id: normalizeId(source.id),
    fileName,
    fileType: normalizeText(source.fileType) || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: Number.isFinite(Number(source.fileSize)) ? Number(source.fileSize) : 0,
    dataUrl,
    inlineDataUrl: normalizeText(source.inlineDataUrl),
    storageProvider: normalizeText(source.storageProvider),
    storageBucket: normalizeText(source.storageBucket),
    storageKey: normalizeText(source.storageKey),
    storageUrl: normalizeText(source.storageUrl || source.url),
    uploadedAt: normalizeOptionalDateTime(source.uploadedAt ?? source.updatedAt) ?? isoNow(),
  };
}

export function normalizeRiskAssessmentReportTemplate(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const sections = normalizeRiskAssessmentReportTemplateSections(source.sections ?? source.placeholders ?? []);
  return {
    id: normalizeId(source.id) || "risk-assessment-template-default",
    title: normalizeText(source.title) || "Standardni predložak procjene rizika",
    description: normalizeText(source.description) || "Dokument se slaže iz odjeljaka procjene kao velikih placeholder blokova.",
    version: normalizeText(source.version) || "1.0",
    wordTemplate: normalizeRiskAssessmentReportWordTemplate(source.wordTemplate ?? source.referenceDocument ?? null),
    sections,
    updatedAt: normalizeOptionalDateTime(source.updatedAt) ?? isoNow(),
  };
}

function normalizeJobStatus(value, fallback = "draft") {
  const normalized = normalizeText(value).toLowerCase();
  return JOB_STATUS_OPTIONS.some((option) => option.value === normalized) ? normalized : fallback;
}

function normalizeJobOptionValues(values = []) {
  const source = Array.isArray(values) ? values : [values];
  return Array.from(new Set(
    source
      .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      .map((entry) => normalizeText(entry))
      .filter(Boolean),
  )).slice(0, 80);
}

function normalizeJobEnvironment(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    machinesEnabled: normalizeBoolean(source.machinesEnabled, false),
    machinesText: normalizeText(source.machinesText),
    machinesOptions: normalizeJobOptionValues(source.machinesOptions),
    substancesEnabled: normalizeBoolean(source.substancesEnabled, false),
    substancesText: normalizeText(source.substancesText),
    substancesOptions: normalizeJobOptionValues(source.substancesOptions),
    workplaceEnabled: normalizeBoolean(source.workplaceEnabled, false),
    workplaceText: normalizeText(source.workplaceText),
    workplaceOptions: normalizeJobOptionValues(source.workplaceOptions),
    organizationEnabled: normalizeBoolean(source.organizationEnabled, false),
    organizationText: normalizeText(source.organizationText),
    organizationOptions: normalizeJobOptionValues(source.organizationOptions),
    workTimeMode: normalizeText(source.workTimeMode),
    dailyDuration: normalizeText(source.dailyDuration),
    overtime: normalizeText(source.overtime),
    nightWork: normalizeText(source.nightWork),
    breakRest: normalizeText(source.breakRest),
    weeklyRest: normalizeText(source.weeklyRest),
    fieldWork: normalizeText(source.fieldWork),
    remoteWork: normalizeText(source.remoteWork),
    workRhythm: normalizeText(source.workRhythm),
    monotony: normalizeText(source.monotony),
    psychosocialRelevant: normalizeBoolean(source.psychosocialRelevant, false),
  };
}

function normalizeJobConditionNotes(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    Object.entries(source)
      .map(([key, text]) => [normalizeText(key), normalizeText(text)])
      .filter(([key, text]) => key && text),
  );
}

export function normalizeJobAiInstructions(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    Object.entries(source)
      .map(([key, config]) => {
        const normalizedKey = normalizeText(key);
        const data = config && typeof config === "object" ? config : {};
        return [normalizedKey, {
          instruction: normalizeText(data.instruction),
          mustInclude: normalizeText(data.mustInclude),
          avoid: normalizeText(data.avoid),
          style: normalizeText(data.style) || "professional",
          textLength: normalizeText(data.textLength),
          probability: normalizeText(data.probability),
          consequence: normalizeText(data.consequence),
          possibleConsequences: normalizeText(data.possibleConsequences),
          workNote: normalizeText(data.workNote),
          note: normalizeText(data.note),
          existingMeasures: normalizeText(data.existingMeasures),
          additionalMeasures: normalizeText(data.additionalMeasures),
          measures: normalizeText(data.measures),
        }];
      })
      .filter(([, data]) => (
        data.instruction
        || data.mustInclude
        || data.avoid
        || data.style !== "professional"
        || data.textLength
        || data.probability
        || data.consequence
        || data.possibleConsequences
        || data.workNote
        || data.note
        || data.existingMeasures
        || data.additionalMeasures
        || data.measures
      )),
  );
}

const WORK_EQUIPMENT_AI_STYLE_VALUES = new Set(["professional", "short", "detailed", "legal"]);
const WORK_EQUIPMENT_AI_CONFIDENCE_VALUES = new Set(["high", "medium", "low"]);

function normalizeWorkEquipmentAiInstructionConfig(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const style = normalizeText(source.style) || "professional";
  const confidence = normalizeText(source.confidenceRequired || source.confidence).toLowerCase();
  return {
    instruction: normalizeText(source.instruction),
    mustInclude: normalizeText(source.mustInclude),
    avoid: normalizeText(source.avoid),
    style: WORK_EQUIPMENT_AI_STYLE_VALUES.has(style) ? style : "professional",
    textLength: normalizeText(source.textLength),
    defaultValue: normalizeText(source.defaultValue),
    fallbackValue: normalizeText(source.fallbackValue),
    examples: normalizeText(source.examples),
    confidenceRequired: WORK_EQUIPMENT_AI_CONFIDENCE_VALUES.has(confidence) ? confidence : "medium",
  };
}

function hasWorkEquipmentAiInstructionConfig(value = {}) {
  const config = normalizeWorkEquipmentAiInstructionConfig(value);
  return Boolean(
    config.instruction
    || config.mustInclude
    || config.avoid
    || config.style !== "professional"
    || config.textLength
    || config.defaultValue
    || config.fallbackValue
    || config.examples
    || config.confidenceRequired !== "medium"
  );
}

function normalizeWorkEquipmentAiInstructionMap(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    Object.entries(source)
      .map(([key, config]) => [normalizeText(key), normalizeWorkEquipmentAiInstructionConfig(config)])
      .filter(([key, config]) => key && hasWorkEquipmentAiInstructionConfig(config)),
  );
}

function normalizeWorkEquipmentAiRegisterItemCache(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const normalized = {
    id: normalizeText(source.id),
    isznrId: normalizeText(source.isznrId || source.isznr_id),
    iri: normalizeText(source.iri),
    "@id": normalizeText(source["@id"]),
    value: normalizeText(source.value),
    code: normalizeText(source.code || source.shortCode),
    name: normalizeText(source.name),
    label: normalizeText(source.label),
    title: normalizeText(source.title),
    naziv: normalizeText(source.naziv),
    description: normalizeText(source.description || source.opis),
    note: normalizeText(source.note || source.napomena),
    activeFrom: normalizeText(source.activeFrom || source.active_from),
    activeTo: normalizeText(source.activeTo || source.active_to),
  };
  return Object.fromEntries(Object.entries(normalized).filter(([, itemValue]) => itemValue));
}

function getWorkEquipmentAiRegisterItemCacheId(value = {}) {
  return normalizeText(value.iri || value["@id"] || value.id || value.isznrId || value.value || value.code);
}

function normalizeWorkEquipmentAiRegisterGroupsCache(value = []) {
  const groups = Array.isArray(value) ? value : [];
  return groups
    .slice(0, 30)
    .map((group) => {
      const source = group && typeof group === "object" ? group : {};
      const items = (Array.isArray(source.items) ? source.items : [])
        .slice(0, 1500)
        .map((item) => normalizeWorkEquipmentAiRegisterItemCache(item))
        .filter((item) => getWorkEquipmentAiRegisterItemCacheId(item));
      return {
        path: normalizeText(source.path),
        label: normalizeText(source.label),
        group: normalizeText(source.group),
        count: Number(source.count ?? items.length) || items.length,
        fetchedAt: normalizeText(source.fetchedAt),
        items,
      };
    })
    .filter((group) => (group.path || group.label || group.group) && group.items.length > 0);
}

function normalizeWorkEquipmentAiProfile(value = {}, index = 0) {
  const source = value && typeof value === "object" ? value : {};
  const id = normalizeText(source.id) || `ro-ai-profile-${index + 1}`;
  const name = normalizeText(source.name || source.label).slice(0, 160);
  const aliases = normalizeAiConfigList(source.aliases || source.synonyms || source.alias)
    .slice(0, 40);
  const registerDefaults = source.registerDefaults && typeof source.registerDefaults === "object"
    ? source.registerDefaults
    : {};
  const fieldDefaults = source.fieldDefaults && typeof source.fieldDefaults === "object"
    ? source.fieldDefaults
    : {};
  return {
    id,
    name,
    aliases,
    generalInstruction: normalizeText(source.generalInstruction || source.instruction).slice(0, 4000),
    breakdownInstruction: normalizeText(source.breakdownInstruction || source.breakdown || source.details).slice(0, 6000),
    appliesWhen: normalizeText(source.appliesWhen).slice(0, 2000),
    avoid: normalizeText(source.avoid).slice(0, 2000),
    fieldDefaults: {
      technicalData: normalizeText(fieldDefaults.technicalData || source.technicalData).slice(0, 2000),
      purposeDescription: normalizeText(fieldDefaults.purposeDescription || source.purposeDescription).slice(0, 2000),
      workspacePosition: normalizeText(fieldDefaults.workspacePosition || source.workspacePosition).slice(0, 2000),
      useAndMaintenance: normalizeText(fieldDefaults.useAndMaintenance || source.useAndMaintenance).slice(0, 2000),
      methodsProceduresAndNorms: normalizeText(fieldDefaults.methodsProceduresAndNorms || source.methodsProceduresAndNorms).slice(0, 2000),
    },
    registerDefaults: {
      mechanical: normalizeAiConfigList(registerDefaults.mechanical || source.mechanicalRegisterIris).slice(0, 80),
      electrical: normalizeAiConfigList(registerDefaults.electrical || source.electricalRegisterIris).slice(0, 80),
      hazards: normalizeAiConfigList(registerDefaults.hazards || source.hazardRegisterIris).slice(0, 80),
      harmfulnesses: normalizeAiConfigList(registerDefaults.harmfulnesses || source.harmfulnessRegisterIris).slice(0, 80),
      strains: normalizeAiConfigList(registerDefaults.strains || source.strainRegisterIris).slice(0, 80),
    },
  };
}

function hasWorkEquipmentAiProfile(value = {}) {
  const profile = normalizeWorkEquipmentAiProfile(value);
  return Boolean(
    profile.name
    || profile.aliases.length
    || profile.generalInstruction
    || profile.breakdownInstruction
    || profile.appliesWhen
    || profile.avoid
    || Object.values(profile.fieldDefaults).some(Boolean)
    || Object.values(profile.registerDefaults).some((list) => list.length > 0)
  );
}

export function normalizeWorkEquipmentAiSettings(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    organizationId: normalizeText(source.organizationId),
    generalInstruction: normalizeText(source.generalInstruction).slice(0, 8000),
    extractionInstruction: normalizeText(source.extractionInstruction).slice(0, 8000),
    matchingInstruction: normalizeText(source.matchingInstruction).slice(0, 4000),
    reviewInstruction: normalizeText(source.reviewInstruction).slice(0, 4000),
    autoFillMode: ["suggest", "fill_empty", "fill_all"].includes(normalizeText(source.autoFillMode))
      ? normalizeText(source.autoFillMode)
      : "fill_empty",
    fieldInstructions: normalizeWorkEquipmentAiInstructionMap(source.fieldInstructions),
    registryInstructions: normalizeWorkEquipmentAiInstructionMap(source.registryInstructions),
    registers: normalizeWorkEquipmentAiRegisterGroupsCache(source.registers || source.registryGroups || source.registerGroups),
    profiles: (Array.isArray(source.profiles) ? source.profiles : [])
      .slice(0, 60)
      .map((profile, index) => normalizeWorkEquipmentAiProfile(profile, index))
      .filter(hasWorkEquipmentAiProfile),
  };
}

function normalizeJobConditions(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    educationRequired: normalizeBoolean(source.educationRequired, false),
    trainingRequired: normalizeBoolean(source.trainingRequired, false),
    safeWorkTrainingCertificate: normalizeBoolean(source.safeWorkTrainingCertificate, false),
    medicalFitnessCertificate: normalizeBoolean(source.medicalFitnessCertificate, false),
    visionCheck: normalizeBoolean(source.visionCheck, false),
    computerOver4h: normalizeBoolean(source.computerOver4h, false),
    increasedInsurance: normalizeBoolean(source.increasedInsurance, false),
    manualHandling: normalizeBoolean(source.manualHandling, false),
    normedWork: normalizeBoolean(source.normedWork, false),
    repetitiveTasks: normalizeBoolean(source.repetitiveTasks, false),
    notes: normalizeJobConditionNotes(source.notes),
    bodyPositions: normalizeJobOptionValues(source.bodyPositions),
    importantFunctions: normalizeJobOptionValues(source.importantFunctions),
    workConditions: normalizeJobOptionValues(source.workConditions),
    purPoints: normalizeJobOptionValues(source.purPoints).slice(0, JOB_PUR_POINT_SELECTION_LIMIT),
    bodyText: normalizeText(source.bodyText),
    functionsText: normalizeText(source.functionsText),
    conditionsText: normalizeText(source.conditionsText),
  };
}

function normalizeJobHazards(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    catalogCode: normalizeText(item?.catalogCode ?? item?.code),
    catalogLabel: normalizeText(item?.catalogLabel ?? item?.hazard),
    category: normalizeText(item?.category),
    group: normalizeText(item?.group),
    unwantedEvent: normalizeText(item?.unwantedEvent ?? item?.possibleEvent),
    probability: normalizeText(item?.probability),
    consequence: normalizeText(item?.consequence),
    riskLevel: normalizeText(item?.riskLevel),
    measures: normalizeText(item?.measures ?? item?.existingMeasures),
    purPoint: normalizeText(item?.purPoint),
    ppeText: normalizeText(item?.ppeText),
    note: normalizeText(item?.note),
  })).filter((item) => (
    item.catalogCode
    || item.catalogLabel
    || item.unwantedEvent
    || item.probability
    || item.consequence
    || item.riskLevel
    || item.measures
    || item.purPoint
    || item.ppeText
    || item.note
  ));
}

function hydrateJobCore({
  current = null,
  input,
  timestamp,
}) {
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");

  return {
    id: current?.id ?? "",
    organizationId,
    title: hasOwn(input, "title") || hasOwn(input, "name") || hasOwn(input, "jobTitle")
      ? requireText(input.title ?? input.name ?? input.jobTitle, "Naziv posla")
      : requireText(current?.title, "Naziv posla"),
    status: hasOwn(input, "status") ? normalizeJobStatus(input.status) : normalizeJobStatus(current?.status),
    description: hasOwn(input, "description") ? normalizeText(input.description) : current?.description ?? "",
    environment: hasOwn(input, "environment")
      ? normalizeJobEnvironment(input.environment)
      : normalizeJobEnvironment(current?.environment),
    conditions: hasOwn(input, "conditions")
      ? normalizeJobConditions(input.conditions)
      : normalizeJobConditions(current?.conditions),
    aiInstructions: hasOwn(input, "aiInstructions")
      ? normalizeJobAiInstructions(input.aiInstructions)
      : normalizeJobAiInstructions(current?.aiInstructions),
    hazards: hasOwn(input, "hazards")
      ? normalizeJobHazards(input.hazards)
      : normalizeJobHazards(current?.hazards ?? []),
    ppeItems: hasOwn(input, "ppeItems")
      ? normalizeRiskAssessmentPpeItems(input.ppeItems)
      : normalizeRiskAssessmentPpeItems(current?.ppeItems ?? []),
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeId(input.createdByUserId)
      : normalizeId(current?.createdByUserId),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : normalizeText(current?.createdByLabel),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function normalizeRiskAssessmentComments(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: normalizeId(item?.id) || crypto.randomUUID(),
    authorLabel: normalizeText(item?.authorLabel),
    message: normalizeText(item?.message),
    visibility: normalizeText(item?.visibility || "shared"),
    createdAt: normalizeOptionalDateTime(item?.createdAt) ?? isoNow(),
  })).filter((item) => item.message);
}

function normalizeRiskAssessmentEmployerData(input = {}, current = {}) {
  const source = input && typeof input === "object" ? input : {};
  const fallback = current && typeof current === "object" ? current : {};
  const normalizePersonItems = (items = []) => {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((item) => ({
      id: normalizeId(item?.id) || crypto.randomUUID(),
      fullName: normalizeText(item?.fullName ?? item?.name).slice(0, 180),
      title: normalizeText(item?.title ?? item?.role).slice(0, 120),
      oib: normalizeText(item?.oib).slice(0, 11),
      jobTitle: normalizeText(item?.jobTitle ?? item?.workplace).slice(0, 180),
    })).filter((item) => item.fullName || item.title || item.oib || item.jobTitle);
  };
  const normalizePdfDocument = (document = null) => {
    const candidate = document && typeof document === "object" ? document : {};
    const fileName = normalizeText(candidate.fileName ?? candidate.name).slice(0, 240);
    const dataUrl = normalizeText(candidate.dataUrl);
    if (!fileName && !dataUrl) {
      return null;
    }
    return {
      fileName,
      fileType: normalizeText(candidate.fileType ?? candidate.mimeType).slice(0, 160) || "application/pdf",
      fileSize: Number.isFinite(Number(candidate.fileSize)) ? Math.max(0, Math.round(Number(candidate.fileSize))) : 0,
      dataUrl,
      uploadedAt: normalizeOptionalDateTime(candidate.uploadedAt ?? candidate.updatedAt) ?? isoNow(),
    };
  };
  const normalizeWorkplaceJobs = (items = []) => {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((item) => ({
      id: normalizeId(item?.id) || crypto.randomUUID(),
      jobTitle: normalizeText(item?.jobTitle ?? item?.title).slice(0, 180),
      maleCount: normalizeText(item?.maleCount ?? item?.male).slice(0, 40),
      femaleCount: normalizeText(item?.femaleCount ?? item?.female).slice(0, 40),
      note: normalizeText(item?.note).slice(0, 500),
    })).filter((item) => item.jobTitle || item.maleCount || item.femaleCount || item.note);
  };
  return {
    fullName: normalizeText(source.fullName ?? source.companyName ?? fallback.fullName).slice(0, 220),
    address: normalizeText(source.address ?? fallback.address).slice(0, 220),
    mbs: normalizeText(source.mbs ?? fallback.mbs).slice(0, 60),
    oib: normalizeText(source.oib ?? fallback.oib).slice(0, 32),
    nkdActivity: normalizeText(source.nkdActivity ?? source.nkd ?? fallback.nkdActivity).slice(0, 500),
    employeeCount: normalizeText(source.employeeCount ?? source.employees ?? fallback.employeeCount).slice(0, 500),
    headquarters: normalizeText(source.headquarters ?? fallback.headquarters).slice(0, 500),
    detachedLocations: normalizeText(source.detachedLocations ?? source.locations ?? fallback.detachedLocations).slice(0, 2000),
    locationScope: normalizeText(source.locationScope ?? fallback.locationScope) === "selected" ? "selected" : "all",
    selectedLocationIds: normalizeIdList(source.selectedLocationIds ?? fallback.selectedLocationIds ?? []).slice(0, 200),
    authorizedPersons: normalizePersonItems(source.authorizedPersons ?? fallback.authorizedPersons ?? []),
    znrServiceMode: normalizeText(source.znrServiceMode ?? fallback.znrServiceMode).slice(0, 4000),
    znrExperts: normalizeText(source.znrExperts ?? fallback.znrExperts).slice(0, 2000),
    znrRepresentatives: normalizeText(source.znrRepresentatives ?? fallback.znrRepresentatives).slice(0, 2000),
    znrCommitteeParticipation: normalizeText(source.znrCommitteeParticipation ?? fallback.znrCommitteeParticipation).slice(0, 3000),
    hasZnrAuthorization: normalizeBoolean(source.hasZnrAuthorization ?? fallback.hasZnrAuthorization, false),
    znrAuthorizationCompanyDetails: normalizeText(source.znrAuthorizationCompanyDetails ?? fallback.znrAuthorizationCompanyDetails).slice(0, 2000),
    znrAuthorizationDocument: normalizePdfDocument(source.znrAuthorizationDocument ?? fallback.znrAuthorizationDocument ?? null),
    assessmentMembers: normalizeText(source.assessmentMembers ?? fallback.assessmentMembers).slice(0, 2000),
    assessmentMemberUserIds: normalizeIdList(source.assessmentMemberUserIds ?? fallback.assessmentMemberUserIds ?? []).slice(0, 48),
    companyCollaborators: normalizePersonItems(source.companyCollaborators ?? fallback.companyCollaborators ?? []),
    workplaceJobs: normalizeWorkplaceJobs(source.workplaceJobs ?? fallback.workplaceJobs ?? []),
    appendixChemicalRisk: normalizeText(source.appendixChemicalRisk ?? fallback.appendixChemicalRisk).slice(0, 4000),
    appendixWorkerParticipation: normalizeText(source.appendixWorkerParticipation ?? fallback.appendixWorkerParticipation).slice(0, 4000),
  };
}

function normalizeRiskAssessmentServiceMatchText(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function isRiskAssessmentServiceText(value = "") {
  const normalized = normalizeRiskAssessmentServiceMatchText(value);
  return normalized.includes("procjena rizika")
    || normalized.includes("procjene rizika")
    || normalized.includes("risk assessment")
    || normalized.includes("risk-assessment");
}

function getRiskAssessmentServiceCatalogItem(state, serviceItem = {}) {
  const serviceId = normalizeId(serviceItem?.serviceId ?? serviceItem?.serviceCatalogId);
  if (!serviceId) {
    return null;
  }
  return (state.serviceCatalog ?? []).find((item) => String(item.id) === String(serviceId)) ?? null;
}

function isRiskAssessmentWorkOrderServiceItem(state, serviceItem = {}) {
  const catalogItem = getRiskAssessmentServiceCatalogItem(state, serviceItem);
  return isRiskAssessmentServiceText([
    serviceItem?.name,
    serviceItem?.serviceCode,
    serviceItem?.description,
    catalogItem?.name,
    catalogItem?.serviceCode,
    catalogItem?.description,
    catalogItem?.note,
  ].filter(Boolean).join(" "));
}

function workOrderHasRiskAssessmentService(state, workOrder = {}) {
  return getWorkOrderServiceItems(workOrder).some((item) => isRiskAssessmentWorkOrderServiceItem(state, item))
    || isRiskAssessmentServiceText([
      workOrder?.serviceLine,
      workOrder?.description,
      workOrder?.tagText,
    ].filter(Boolean).join(" "));
}

function findRiskAssessmentWorkOrder(state, workOrderId = "", companyId = "") {
  const normalizedWorkOrderId = normalizeId(workOrderId);
  if (!normalizedWorkOrderId) {
    return null;
  }
  const workOrder = (state.workOrders ?? []).find((item) => String(item.id) === normalizedWorkOrderId) ?? null;
  if (!workOrder || (companyId && String(workOrder.companyId) !== String(companyId))) {
    return null;
  }
  return workOrderHasRiskAssessmentService(state, workOrder) ? workOrder : null;
}

function nextRiskAssessmentNumber(items = [], timestamp = isoNow()) {
  const year = Number(String(timestamp).slice(0, 4)) || new Date().getFullYear();
  const prefix = `PR-${String(year)}`;
  const sequence = (items ?? [])
    .filter((item) => String(item.assessmentNumber || "").includes(String(year)))
    .reduce((max, item) => {
      const match = String(item.assessmentNumber || "").match(/(\d+)(?!.*\d)/);
      return Math.max(max, match ? Number(match[1]) || 0 : 0);
    }, 0) + 1;

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

function buildRiskAssessmentNumberFromWorkOrderNumber(value = "") {
  const number = normalizeText(value);
  if (!number) {
    return "";
  }
  return /-PR$/i.test(number) ? number : `${number}-PR`;
}

function hydrateRiskAssessmentCore({
  current = null,
  state,
  input,
  timestamp,
  assessmentNumber = current?.assessmentNumber ?? "",
}) {
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const companyId = hasOwn(input, "companyId")
    ? requireText(input.companyId, "Tvrtka")
    : requireText(current?.companyId, "Tvrtka");
  const company = findOfferCompany(state, companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const locationId = hasOwn(input, "locationId")
    ? normalizeId(input.locationId)
    : normalizeId(current?.locationId);
  const location = locationId ? findOfferLocation(state, locationId, companyId) : null;

  if (locationId && !location) {
    throw new Error("Odabrana lokacija ne pripada tvrtki.");
  }

  const requestedWorkOrderId = hasOwn(input, "workOrderId")
    ? normalizeId(input.workOrderId)
    : normalizeId(current?.workOrderId);
  const linkedWorkOrder = requestedWorkOrderId
    ? findRiskAssessmentWorkOrder(state, requestedWorkOrderId, companyId)
    : null;

  if (requestedWorkOrderId && !linkedWorkOrder) {
    throw new Error("Povezani RN mora pripadati tvrtki i imati uslugu procjene rizika.");
  }
  const workOrderAssessmentNumber = buildRiskAssessmentNumberFromWorkOrderNumber(
    linkedWorkOrder?.workOrderNumber ?? (requestedWorkOrderId ? current?.workOrderNumber ?? "" : ""),
  );
  const resolvedNumber = workOrderAssessmentNumber || normalizeText(
    hasOwn(input, "assessmentNumber")
      ? input.assessmentNumber
      : assessmentNumber || current?.assessmentNumber,
  ) || nextRiskAssessmentNumber(state.riskAssessments ?? [], timestamp);

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: company.name ?? "",
    companyOib: company.oib ?? "",
    headquarters: company.headquarters ?? "",
    locationId,
    locationName: location?.name ?? "",
    region: location?.region ?? "",
    coordinates: location?.coordinates ?? "",
    workOrderId: linkedWorkOrder?.id ?? requestedWorkOrderId,
    workOrderNumber: linkedWorkOrder?.workOrderNumber ?? (requestedWorkOrderId ? current?.workOrderNumber ?? "" : ""),
    assessmentNumber: resolvedNumber,
    title: hasOwn(input, "title")
      ? (normalizeText(input.title) || `Procjena rizika - ${company.name}`)
      : (current?.title || `Procjena rizika - ${company.name}`),
    status: hasOwn(input, "status")
      ? normalizeRiskAssessmentStatus(input.status)
      : normalizeRiskAssessmentStatus(current?.status),
    assessmentDate: hasOwn(input, "assessmentDate")
      ? (normalizeOptionalDate(input.assessmentDate) ?? timestamp.slice(0, 10))
      : (normalizeOptionalDate(current?.assessmentDate) ?? timestamp.slice(0, 10)),
    completionDate: hasOwn(input, "completionDate")
      ? normalizeOptionalDate(input.completionDate)
      : normalizeOptionalDate(current?.completionDate),
    revisionDate: hasOwn(input, "revisionDate")
      ? normalizeOptionalDate(input.revisionDate)
      : normalizeOptionalDate(current?.revisionDate),
    assessmentType: hasOwn(input, "assessmentType") ? normalizeText(input.assessmentType) : current?.assessmentType ?? "Procjena rizika",
    teamLead: hasOwn(input, "teamLead") ? normalizeText(input.teamLead) : current?.teamLead ?? "",
    teamLeadUserIds: hasOwn(input, "teamLeadUserIds")
      ? normalizeIdList(input.teamLeadUserIds).slice(0, 24)
      : normalizeIdList(current?.teamLeadUserIds ?? []).slice(0, 24),
    collaborators: hasOwn(input, "collaborators") ? normalizeText(input.collaborators) : current?.collaborators ?? "",
    collaboratorUserIds: hasOwn(input, "collaboratorUserIds")
      ? normalizeIdList(input.collaboratorUserIds).slice(0, 48)
      : normalizeIdList(current?.collaboratorUserIds ?? []).slice(0, 48),
    employerData: hasOwn(input, "employerData")
      ? normalizeRiskAssessmentEmployerData(input.employerData, current?.employerData)
      : normalizeRiskAssessmentEmployerData(current?.employerData ?? {
        fullName: company.name ?? "",
        address: company.headquarters ?? "",
        mbs: company.mbs ?? "",
        oib: company.oib ?? "",
        nkdActivity: company.nkdActivity ?? "",
        headquarters: company.headquarters ?? "",
      }),
    intro: hasOwn(input, "intro") ? normalizeRiskAssessmentRichText(input.intro) : current?.intro ?? "",
    workProcessDescription: hasOwn(input, "workProcessDescription")
      ? normalizeRiskAssessmentRichText(input.workProcessDescription)
      : current?.workProcessDescription ?? "",
    generalData: hasOwn(input, "generalData") ? normalizeRiskAssessmentRichText(input.generalData) : current?.generalData ?? "",
    computerWorkplaces: hasOwn(input, "computerWorkplaces") ? normalizeRiskAssessmentRichText(input.computerWorkplaces) : current?.computerWorkplaces ?? "",
    basicRules: hasOwn(input, "basicRules") ? normalizeRiskAssessmentRichText(input.basicRules) : current?.basicRules ?? "",
    specialRules: hasOwn(input, "specialRules") ? normalizeRiskAssessmentRichText(input.specialRules) : current?.specialRules ?? "",
    omissionsBasic: hasOwn(input, "omissionsBasic") ? normalizeRiskAssessmentRichText(input.omissionsBasic) : current?.omissionsBasic ?? "",
    omissionsSpecial: hasOwn(input, "omissionsSpecial") ? normalizeRiskAssessmentRichText(input.omissionsSpecial) : current?.omissionsSpecial ?? "",
    conclusion: hasOwn(input, "conclusion") ? normalizeRiskAssessmentRichText(input.conclusion) : current?.conclusion ?? "",
    biologicalHazards: hasOwn(input, "biologicalHazards") ? normalizeRiskAssessmentRichText(input.biologicalHazards) : current?.biologicalHazards ?? "",
    clientNote: hasOwn(input, "clientNote") ? normalizeText(input.clientNote) : current?.clientNote ?? "",
    clientJobInputEnabled: hasOwn(input, "clientJobInputEnabled")
      ? normalizeBoolean(input.clientJobInputEnabled, false)
      : normalizeBoolean(current?.clientJobInputEnabled, false),
    measures: hasOwn(input, "measures")
      ? normalizeRiskAssessmentMeasureItems(input.measures)
      : normalizeRiskAssessmentMeasureItems(current?.measures ?? []),
    organizationUnits: hasOwn(input, "organizationUnits")
      ? normalizeRiskAssessmentOrganizationUnits(input.organizationUnits)
      : normalizeRiskAssessmentOrganizationUnits(current?.organizationUnits ?? []),
    jobs: hasOwn(input, "jobs")
      ? normalizeRiskAssessmentJobs(input.jobs)
      : normalizeRiskAssessmentJobs(current?.jobs ?? []),
    riskTemplates: hasOwn(input, "riskTemplates")
      ? normalizeRiskAssessmentRiskTemplates(input.riskTemplates)
      : normalizeRiskAssessmentRiskTemplates(current?.riskTemplates ?? []),
    manualHandling: hasOwn(input, "manualHandling") || hasOwn(input, "manualHandlingItems")
      ? normalizeRiskAssessmentManualHandlingItems(input.manualHandling ?? input.manualHandlingItems)
      : normalizeRiskAssessmentManualHandlingItems(current?.manualHandling ?? current?.manualHandlingItems ?? []),
    chemicals: hasOwn(input, "chemicals")
      ? normalizeRiskAssessmentChemicals(input.chemicals)
      : normalizeRiskAssessmentChemicals(current?.chemicals ?? []),
    biologicalRisks: hasOwn(input, "biologicalRisks")
      ? normalizeRiskAssessmentBiologicalRisks(input.biologicalRisks)
      : normalizeRiskAssessmentBiologicalRisks(current?.biologicalRisks ?? []),
    reportTemplate: hasOwn(input, "reportTemplate")
      ? normalizeRiskAssessmentReportTemplate(input.reportTemplate)
      : normalizeRiskAssessmentReportTemplate(current?.reportTemplate ?? {}),
    attachments: hasOwn(input, "attachments")
      ? normalizeAttachmentDocuments(input.attachments)
      : normalizeAttachmentDocuments(current?.attachments ?? []),
    comments: hasOwn(input, "comments")
      ? normalizeRiskAssessmentComments(input.comments)
      : normalizeRiskAssessmentComments(current?.comments ?? []),
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export function updateServiceCatalogItem(current, patch, state, now = isoNow) {
  const organizationId = hasOwn(patch, "organizationId")
    ? requireText(patch.organizationId, "Organizacija")
    : current.organizationId;
  const serviceCode = hasOwn(patch, "serviceCode")
    ? requireText(patch.serviceCode, "Šifra usluge")
    : current.serviceCode;
  const serviceType = hasOwn(patch, "serviceType")
    ? normalizeServiceCatalogType(
      patch.serviceType,
      normalizeBoolean(
        hasOwn(patch, "isTraining") ? patch.isTraining : current.isTraining,
        normalizeText(current.serviceType) === "znr",
      ) ? "znr" : (current.serviceType || "inspection"),
    )
    : normalizeServiceCatalogType(
      current.serviceType,
      normalizeBoolean(
        hasOwn(patch, "isTraining") ? patch.isTraining : current.isTraining,
        false,
      ) ? "znr" : "inspection",
    );
  const templateSnapshot = hasOwn(patch, "linkedTemplateIds")
    ? deriveServiceTemplateSnapshot(state, patch.linkedTemplateIds, current.linkedTemplateTitles)
    : deriveServiceTemplateSnapshot(state, current.linkedTemplateIds, current.linkedTemplateTitles);
  const learningTestSnapshot = hasOwn(patch, "linkedLearningTestIds")
    ? deriveServiceLearningTestSnapshot(state, patch.linkedLearningTestIds, current.linkedLearningTestTitles)
    : deriveServiceLearningTestSnapshot(state, current.linkedLearningTestIds, current.linkedLearningTestTitles);
  const rawTrainingCertificateTemplate = hasOwn(patch, "trainingCertificateTemplate")
    ? patch.trainingCertificateTemplate
    : current.trainingCertificateTemplate;
  const trainingCertificateTemplate = normalizeAttachmentDocuments(
    rawTrainingCertificateTemplate ? [rawTrainingCertificateTemplate] : [],
  )[0] ?? null;

  if ((state.serviceCatalog ?? []).some((item) => (
    String(item.id) !== String(current.id)
    && String(item.organizationId) === String(organizationId)
    && normalizeText(item.serviceCode).toLowerCase() === serviceCode.toLowerCase()
  ))) {
    throw new Error("Usluga s tom sifrom vec postoji.");
  }

  return {
    ...current,
    organizationId,
    name: hasOwn(patch, "name") ? requireText(patch.name, "Ime usluge") : current.name,
    serviceCode,
    status: hasOwn(patch, "status") ? normalizeServiceCatalogStatus(patch.status) : current.status,
    serviceType,
    isTraining: serviceType === "znr",
    validityMonths: hasOwn(patch, "validityMonths")
      ? normalizeServiceValidityMonths(patch.validityMonths)
      : normalizeServiceValidityMonths(current.validityMonths),
    linkedTemplateIds: serviceType === "inspection" ? templateSnapshot.linkedTemplateIds : [],
    linkedTemplateTitles: serviceType === "inspection" ? templateSnapshot.linkedTemplateTitles : [],
    linkedQualificationKeys: hasOwn(patch, "linkedQualificationKeys") || hasOwn(patch, "linkedQualificationExamKeys")
      ? normalizeQualificationKeyList(patch.linkedQualificationKeys ?? patch.linkedQualificationExamKeys)
      : normalizeQualificationKeyList(current.linkedQualificationKeys ?? current.linkedQualificationExamKeys ?? []),
    linkedLearningTestIds: serviceType === "znr" ? learningTestSnapshot.linkedLearningTestIds : [],
    linkedLearningTestTitles: serviceType === "znr" ? learningTestSnapshot.linkedLearningTestTitles : [],
    trainingCertificateTemplate: serviceType === "znr" ? trainingCertificateTemplate : null,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    updatedAt: now(),
  };
}

export function filterServiceCatalogItems(
  items,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return (items ?? []).filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.name,
      item.serviceCode,
      item.validityMonths ? `${item.validityMonths} mjeseci` : "",
      item.note,
      ...(item.linkedTemplateTitles ?? []),
      ...(item.linkedQualificationKeys ?? []),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortServiceCatalogItems(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftRank = left.status === "active" ? 0 : 1;
    const rightRank = right.status === "active" ? 0 : 1;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return `${left.serviceCode} ${left.name}`.localeCompare(`${right.serviceCode} ${right.name}`, "hr");
  });
}

export function createLegalFramework(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const organizationId = requireText(input.organizationId, "Organizacija");
  const serviceSnapshot = deriveLinkedServiceCatalogSnapshot(
    state,
    hasOwn(input, "linkedServiceCatalogIds") ? input.linkedServiceCatalogIds : (input.linkedServiceIds ?? []),
    hasOwn(input, "linkedServiceCatalogTitles") ? input.linkedServiceCatalogTitles : [],
  );
  const templateSnapshot = deriveTemplateSnapshotFromLinkedServices(
    state,
    serviceSnapshot.linkedServiceCatalogIds,
    hasOwn(input, "linkedTemplateIds") ? input.linkedTemplateIds : [],
    hasOwn(input, "linkedTemplateTitles") ? input.linkedTemplateTitles : [],
  );

  return {
    id: createId(),
    organizationId,
    title: requireText(input.title, "Naziv propisa"),
    category: normalizeText(input.category),
    authority: normalizeText(input.authority),
    referenceCode: normalizeText(input.referenceCode),
    versionLabel: normalizeText(input.versionLabel),
    publishedOn: normalizeOptionalDate(input.publishedOn),
    effectiveFrom: normalizeOptionalDate(input.effectiveFrom),
    reviewDate: normalizeOptionalDate(input.reviewDate),
    status: normalizeLegalFrameworkStatus(input.status),
    tagsText: normalizeText(input.tagsText),
    sourceUrl: normalizeText(input.sourceUrl),
    note: normalizeText(input.note),
    linkedServiceCatalogIds: serviceSnapshot.linkedServiceCatalogIds,
    linkedServiceCatalogTitles: serviceSnapshot.linkedServiceCatalogTitles,
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
    documents: normalizeAttachmentDocuments(input.documents),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateLegalFramework(current, patch, state, now = isoNow) {
  const serviceSnapshot = hasOwn(patch, "linkedServiceCatalogIds") || hasOwn(patch, "linkedServiceIds")
    ? deriveLinkedServiceCatalogSnapshot(
      state,
      hasOwn(patch, "linkedServiceCatalogIds") ? patch.linkedServiceCatalogIds : patch.linkedServiceIds,
      current.linkedServiceCatalogTitles,
    )
    : deriveLinkedServiceCatalogSnapshot(
      state,
      current.linkedServiceCatalogIds,
      current.linkedServiceCatalogTitles,
    );
  const templateSnapshot = serviceSnapshot.linkedServiceCatalogIds.length > 0
    ? deriveTemplateSnapshotFromLinkedServices(
      state,
      serviceSnapshot.linkedServiceCatalogIds,
      current.linkedTemplateIds,
      current.linkedTemplateTitles,
    )
    : (hasOwn(patch, "linkedTemplateIds")
      ? normalizeLinkedTemplateSnapshot(state, patch.linkedTemplateIds, current.linkedTemplateTitles)
      : normalizeLinkedTemplateSnapshot(state, current.linkedTemplateIds, current.linkedTemplateTitles));
  return {
    ...current,
    title: hasOwn(patch, "title") ? requireText(patch.title, "Naziv propisa") : current.title,
    category: hasOwn(patch, "category") ? normalizeText(patch.category) : current.category,
    authority: hasOwn(patch, "authority") ? normalizeText(patch.authority) : current.authority,
    referenceCode: hasOwn(patch, "referenceCode") ? normalizeText(patch.referenceCode) : current.referenceCode,
    versionLabel: hasOwn(patch, "versionLabel") ? normalizeText(patch.versionLabel) : current.versionLabel,
    publishedOn: hasOwn(patch, "publishedOn") ? normalizeOptionalDate(patch.publishedOn) : current.publishedOn,
    effectiveFrom: hasOwn(patch, "effectiveFrom") ? normalizeOptionalDate(patch.effectiveFrom) : current.effectiveFrom,
    reviewDate: hasOwn(patch, "reviewDate") ? normalizeOptionalDate(patch.reviewDate) : current.reviewDate,
    status: hasOwn(patch, "status") ? normalizeLegalFrameworkStatus(patch.status) : current.status,
    tagsText: hasOwn(patch, "tagsText") ? normalizeText(patch.tagsText) : current.tagsText,
    sourceUrl: hasOwn(patch, "sourceUrl") ? normalizeText(patch.sourceUrl) : current.sourceUrl,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    linkedServiceCatalogIds: serviceSnapshot.linkedServiceCatalogIds,
    linkedServiceCatalogTitles: serviceSnapshot.linkedServiceCatalogTitles,
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
    documents: hasOwn(patch, "documents")
      ? normalizeAttachmentDocuments(patch.documents)
      : normalizeAttachmentDocuments(current.documents),
    updatedAt: now(),
  };
}

export function filterLegalFrameworks(
  items,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return (items ?? []).filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.category,
      item.authority,
      item.referenceCode,
      item.versionLabel,
      item.tagsText,
      item.note,
      ...(item.linkedServiceCatalogTitles ?? []),
      ...(item.linkedTemplateTitles ?? []),
      ...(item.documents ?? []).flatMap((document) => [document.fileName, document.description]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortLegalFrameworks(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftRank = LEGAL_FRAMEWORK_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = LEGAL_FRAMEWORK_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (left.reviewDate && right.reviewDate && left.reviewDate !== right.reviewDate) {
      return left.reviewDate.localeCompare(right.reviewDate);
    }

    if (left.reviewDate && !right.reviewDate) {
      return -1;
    }

    if (!left.reviewDate && right.reviewDate) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function createRulebook(
  input,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const organizationId = requireText(input.organizationId, "Organizacija");

  return {
    id: createId(),
    organizationId,
    title: requireText(input.title, "Naziv pravilnika"),
    rulebookType: normalizeRulebookType(input.rulebookType ?? input.type),
    status: normalizeRulebookStatus(input.status),
    effectiveFrom: normalizeOptionalDate(input.effectiveFrom),
    reviewDate: normalizeOptionalDate(input.reviewDate),
    owner: normalizeText(input.owner).slice(0, 180),
    scope: normalizeText(input.scope),
    summary: normalizeText(input.summary ?? input.note),
    documents: normalizeAttachmentDocuments(input.documents),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateRulebook(current, patch, now = isoNow) {
  return {
    ...current,
    organizationId: hasOwn(patch, "organizationId")
      ? requireText(patch.organizationId, "Organizacija")
      : current.organizationId,
    title: hasOwn(patch, "title") ? requireText(patch.title, "Naziv pravilnika") : current.title,
    rulebookType: hasOwn(patch, "rulebookType") || hasOwn(patch, "type")
      ? normalizeRulebookType(patch.rulebookType ?? patch.type)
      : current.rulebookType,
    status: hasOwn(patch, "status") ? normalizeRulebookStatus(patch.status) : current.status,
    effectiveFrom: hasOwn(patch, "effectiveFrom") ? normalizeOptionalDate(patch.effectiveFrom) : current.effectiveFrom,
    reviewDate: hasOwn(patch, "reviewDate") ? normalizeOptionalDate(patch.reviewDate) : current.reviewDate,
    owner: hasOwn(patch, "owner") ? normalizeText(patch.owner).slice(0, 180) : current.owner,
    scope: hasOwn(patch, "scope") ? normalizeText(patch.scope) : current.scope,
    summary: hasOwn(patch, "summary") || hasOwn(patch, "note")
      ? normalizeText(patch.summary ?? patch.note)
      : current.summary,
    documents: hasOwn(patch, "documents")
      ? normalizeAttachmentDocuments(patch.documents)
      : normalizeAttachmentDocuments(current.documents),
    updatedAt: now(),
  };
}

export function filterRulebooks(
  items,
  { query = "", status = "all", rulebookType = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedStatus = normalizeText(status).toLowerCase() || "all";
  const normalizedType = normalizeText(rulebookType).toLowerCase() || "all";

  return (items ?? []).filter((item) => {
    if (normalizedStatus !== "all" && item.status !== normalizedStatus) {
      return false;
    }

    if (normalizedType !== "all" && item.rulebookType !== normalizedType) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.rulebookType,
      item.owner,
      item.scope,
      item.summary,
      ...(item.documents ?? []).flatMap((document) => [document.fileName, document.description]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortRulebooks(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftRank = RULEBOOK_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = RULEBOOK_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (left.reviewDate && right.reviewDate && left.reviewDate !== right.reviewDate) {
      return left.reviewDate.localeCompare(right.reviewDate);
    }

    if (left.reviewDate && !right.reviewDate) {
      return -1;
    }

    if (!left.reviewDate && right.reviewDate) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function createMeasurementEquipmentItem(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const organizationId = requireText(input.organizationId, "Organizacija");
  const deviceCode = normalizeText(input.deviceCode);
  const inventoryNumber = normalizeText(input.inventoryNumber);
  const serialNumber = normalizeText(input.serialNumber);
  const isznrInstrumentId = normalizeText(input.isznrInstrumentId ?? input.isznrId ?? input.externalIsznrId).slice(0, 80);
  const isznrSyncedAt = normalizeText(input.isznrSyncedAt).slice(0, 50);
  const enteredBy = normalizeText(input.enteredBy).slice(0, 180);
  const approvedBy = normalizeText(input.approvedBy).slice(0, 180);
  const entryDate = normalizeOptionalDate(input.entryDate);
  const hasCalibrationData = Boolean(input.calibrationDate || input.calibrationPeriod || input.validUntil);
  let requiresCalibration = hasOwn(input, "requiresCalibration")
    ? normalizeBoolean(input.requiresCalibration, hasCalibrationData)
    : hasCalibrationData;
  let calibrationDate = requiresCalibration ? normalizeOptionalDate(input.calibrationDate) : null;
  let calibrationPeriod = requiresCalibration ? normalizeText(input.calibrationPeriod) : "";
  let validUntil = requiresCalibration ? normalizeOptionalDate(input.validUntil) : null;
  const activityItems = normalizeMeasurementEquipmentActivityItems(
    hasOwn(input, "activityItems") ? input.activityItems : [],
    now,
  );
  const measurementSpecs = normalizeMeasurementEquipmentSpecItems(
    hasOwn(input, "measurementSpecs") ? input.measurementSpecs : [],
  );
  if (hasOwn(input, "activityItems")) {
    const syncFromActivities = applyMeasurementEquipmentCalibrationFromActivities(activityItems, {
      requiresCalibration,
      calibrationDate,
      calibrationPeriod,
      validUntil,
    });
    requiresCalibration = syncFromActivities.requiresCalibration;
    calibrationDate = syncFromActivities.calibrationDate;
    calibrationPeriod = syncFromActivities.calibrationPeriod;
    validUntil = syncFromActivities.validUntil;
  }
  const serviceSnapshot = deriveLinkedServiceCatalogSnapshot(
    state,
    hasOwn(input, "linkedServiceCatalogIds") ? input.linkedServiceCatalogIds : (input.linkedServiceIds ?? []),
    hasOwn(input, "linkedServiceCatalogTitles") ? input.linkedServiceCatalogTitles : [],
  );
  const templateSnapshot = serviceSnapshot.linkedServiceCatalogIds.length > 0
    ? deriveTemplateSnapshotFromLinkedServices(
      state,
      serviceSnapshot.linkedServiceCatalogIds,
      hasOwn(input, "linkedTemplateIds") ? input.linkedTemplateIds : [],
      hasOwn(input, "linkedTemplateTitles") ? input.linkedTemplateTitles : [],
    )
    : normalizeLinkedTemplateSnapshot(
      state,
      hasOwn(input, "linkedTemplateIds") ? input.linkedTemplateIds : [],
      hasOwn(input, "linkedTemplateTitles") ? input.linkedTemplateTitles : [],
    );

  if (
    inventoryNumber
    && (state.measurementEquipment ?? []).some((item) => (
      String(item.organizationId) === String(organizationId)
      && normalizeText(item.inventoryNumber).toLowerCase() === inventoryNumber.toLowerCase()
    ))
  ) {
    throw new Error("Uređaj s tim inventarnim brojem već postoji.");
  }

  return {
    id: createId(),
    organizationId,
    name: requireText(input.name, "Ime opreme"),
    equipmentKind: normalizeMeasurementEquipmentKind(input.equipmentKind),
    manufacturer: normalizeText(input.manufacturer),
    deviceType: normalizeText(input.deviceType ?? input.type),
    deviceCode,
    serialNumber,
    inventoryNumber,
    isznrInstrumentId,
    isznrSyncedAt,
    enteredBy,
    approvedBy,
    entryDate,
    requiresCalibration,
    calibrationDate: requiresCalibration ? calibrationDate : null,
    calibrationPeriod: requiresCalibration ? calibrationPeriod : "",
    validUntil: requiresCalibration ? validUntil : null,
    note: normalizeText(input.note),
    linkedServiceCatalogIds: serviceSnapshot.linkedServiceCatalogIds,
    linkedServiceCatalogTitles: serviceSnapshot.linkedServiceCatalogTitles,
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
    documents: normalizeAttachmentDocuments(input.documents),
    activityItems,
    measurementSpecs,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateMeasurementEquipmentItem(current, patch, state, now = isoNow) {
  const deviceCode = hasOwn(patch, "deviceCode")
    ? normalizeText(patch.deviceCode)
    : current.deviceCode;
  const inventoryNumber = hasOwn(patch, "inventoryNumber")
    ? normalizeText(patch.inventoryNumber)
    : current.inventoryNumber;
  const serialNumber = hasOwn(patch, "serialNumber")
    ? normalizeText(patch.serialNumber)
    : current.serialNumber;
  const isznrInstrumentId = hasOwn(patch, "isznrInstrumentId") || hasOwn(patch, "isznrId") || hasOwn(patch, "externalIsznrId")
    ? normalizeText(patch.isznrInstrumentId ?? patch.isznrId ?? patch.externalIsznrId).slice(0, 80)
    : normalizeText(current.isznrInstrumentId ?? current.isznrId ?? current.externalIsznrId).slice(0, 80);
  const isznrSyncedAt = hasOwn(patch, "isznrSyncedAt")
    ? normalizeText(patch.isznrSyncedAt).slice(0, 50)
    : normalizeText(current.isznrSyncedAt).slice(0, 50);
  const enteredBy = hasOwn(patch, "enteredBy")
    ? normalizeText(patch.enteredBy).slice(0, 180)
    : normalizeText(current.enteredBy).slice(0, 180);
  const approvedBy = hasOwn(patch, "approvedBy")
    ? normalizeText(patch.approvedBy).slice(0, 180)
    : normalizeText(current.approvedBy).slice(0, 180);
  const entryDate = hasOwn(patch, "entryDate")
    ? normalizeOptionalDate(patch.entryDate)
    : normalizeOptionalDate(current.entryDate);
  const organizationId = hasOwn(patch, "organizationId")
    ? requireText(patch.organizationId, "Organizacija")
    : current.organizationId;
  const hasCalibrationData = hasOwn(patch, "calibrationDate") || hasOwn(patch, "calibrationPeriod") || hasOwn(patch, "validUntil");
  let requiresCalibration = hasOwn(patch, "requiresCalibration")
    ? normalizeBoolean(patch.requiresCalibration, current.requiresCalibration || hasCalibrationData)
    : current.requiresCalibration;
  let calibrationDate = requiresCalibration
    ? (hasOwn(patch, "calibrationDate")
      ? normalizeOptionalDate(patch.calibrationDate)
      : current.calibrationDate)
    : null;
  let calibrationPeriod = requiresCalibration
    ? (hasOwn(patch, "calibrationPeriod")
      ? normalizeText(patch.calibrationPeriod)
      : current.calibrationPeriod)
    : "";
  let validUntil = requiresCalibration
    ? (hasOwn(patch, "validUntil")
      ? normalizeOptionalDate(patch.validUntil)
      : current.validUntil)
    : null;
  const activityItems = hasOwn(patch, "activityItems")
    ? normalizeMeasurementEquipmentActivityItems(patch.activityItems, now)
    : normalizeMeasurementEquipmentActivityItems(current.activityItems ?? [], now);
  const measurementSpecs = hasOwn(patch, "measurementSpecs")
    ? normalizeMeasurementEquipmentSpecItems(patch.measurementSpecs)
    : normalizeMeasurementEquipmentSpecItems(current.measurementSpecs ?? []);
  if (hasOwn(patch, "activityItems")) {
    const syncFromActivities = applyMeasurementEquipmentCalibrationFromActivities(activityItems, {
      requiresCalibration,
      calibrationDate,
      calibrationPeriod,
      validUntil,
    });
    requiresCalibration = syncFromActivities.requiresCalibration;
    calibrationDate = syncFromActivities.calibrationDate;
    calibrationPeriod = syncFromActivities.calibrationPeriod;
    validUntil = syncFromActivities.validUntil;
  }
  const serviceSnapshot = hasOwn(patch, "linkedServiceCatalogIds") || hasOwn(patch, "linkedServiceIds")
    ? deriveLinkedServiceCatalogSnapshot(
      state,
      hasOwn(patch, "linkedServiceCatalogIds") ? patch.linkedServiceCatalogIds : patch.linkedServiceIds,
      current.linkedServiceCatalogTitles,
    )
    : deriveLinkedServiceCatalogSnapshot(
      state,
      current.linkedServiceCatalogIds,
      current.linkedServiceCatalogTitles,
    );
  const templateSnapshot = serviceSnapshot.linkedServiceCatalogIds.length > 0
    ? deriveTemplateSnapshotFromLinkedServices(
      state,
      serviceSnapshot.linkedServiceCatalogIds,
      current.linkedTemplateIds,
      current.linkedTemplateTitles,
    )
    : (hasOwn(patch, "linkedTemplateIds")
      ? normalizeLinkedTemplateSnapshot(state, patch.linkedTemplateIds, current.linkedTemplateTitles)
      : normalizeLinkedTemplateSnapshot(state, current.linkedTemplateIds, current.linkedTemplateTitles));

  if (
    inventoryNumber
    && (state.measurementEquipment ?? []).some((item) => (
      String(item.id) !== String(current.id)
      && String(item.organizationId) === String(organizationId)
      && normalizeText(item.inventoryNumber).toLowerCase() === inventoryNumber.toLowerCase()
    ))
  ) {
    throw new Error("Uređaj s tim inventarnim brojem već postoji.");
  }

  return {
    ...current,
    organizationId,
    name: hasOwn(patch, "name") ? requireText(patch.name, "Ime opreme") : current.name,
    equipmentKind: hasOwn(patch, "equipmentKind")
      ? normalizeMeasurementEquipmentKind(patch.equipmentKind)
      : current.equipmentKind,
    manufacturer: hasOwn(patch, "manufacturer") ? normalizeText(patch.manufacturer) : current.manufacturer,
    deviceType: hasOwn(patch, "deviceType") || hasOwn(patch, "type")
      ? normalizeText(patch.deviceType ?? patch.type)
      : current.deviceType,
    deviceCode,
    serialNumber,
    inventoryNumber,
    isznrInstrumentId,
    isznrSyncedAt,
    enteredBy,
    approvedBy,
    entryDate,
    requiresCalibration,
    calibrationDate: requiresCalibration ? calibrationDate : null,
    calibrationPeriod: requiresCalibration ? calibrationPeriod : "",
    validUntil: requiresCalibration ? validUntil : null,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    linkedServiceCatalogIds: serviceSnapshot.linkedServiceCatalogIds,
    linkedServiceCatalogTitles: serviceSnapshot.linkedServiceCatalogTitles,
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
    documents: hasOwn(patch, "documents")
      ? normalizeAttachmentDocuments(patch.documents)
      : normalizeAttachmentDocuments(current.documents),
    activityItems,
    measurementSpecs,
    updatedAt: now(),
  };
}

export function filterMeasurementEquipmentItems(
  items,
  { query = "" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return (items ?? []).filter((item) => {
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.name,
      item.manufacturer,
      item.deviceType,
      item.deviceCode,
      item.serialNumber,
      item.inventoryNumber,
      item.isznrInstrumentId,
      item.isznrId,
      item.externalIsznrId,
      item.isznrSyncedAt,
      item.enteredBy,
      item.approvedBy,
      item.entryDate,
      item.note,
      item.calibrationPeriod,
      ...(item.linkedServiceCatalogTitles ?? []),
      ...(item.linkedTemplateTitles ?? []),
      ...(item.documents ?? []).flatMap((document) => [
        document.fileName,
        document.description,
        document.documentCategory,
      ]),
      ...(item.activityItems ?? []).flatMap((entry) => [
        entry.activityType,
        entry.performedOn,
        entry.performedBy,
        entry.calibrationPeriod,
        entry.validUntil,
        entry.satisfies,
        entry.note,
      ]),
      ...(item.measurementSpecs ?? []).flatMap((entry) => [
        entry.quantity,
        entry.range,
        entry.remark,
      ]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortMeasurementEquipmentItems(items) {
  return [...(items ?? [])].sort((left, right) => {
    if (left.validUntil && right.validUntil && left.validUntil !== right.validUntil) {
      return left.validUntil.localeCompare(right.validUntil);
    }

    if (left.validUntil && !right.validUntil) {
      return -1;
    }

    if (!left.validUntil && right.validUntil) {
      return 1;
    }

    return `${left.name} ${left.deviceCode ?? ""} ${left.serialNumber ?? ""} ${left.inventoryNumber}`.localeCompare(
      `${right.name} ${right.deviceCode ?? ""} ${right.serialNumber ?? ""} ${right.inventoryNumber}`,
      "hr",
    );
  });
}

export function createLearningTest(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const organizationId = requireText(input.organizationId, "Organizacija");
  return {
    id: createId(),
    organizationId,
    title: requireText(input.title, "Naziv testa"),
    status: normalizeLearningTestStatus(input.status),
    description: normalizeText(input.description),
    intendedFor: normalizeText(input.intendedFor ?? input.intended_for),
    recommendationRules: normalizeText(input.recommendationRules ?? input.recommendation_rules),
    matchKeywords: normalizeLearningTestMatchKeywords(input.matchKeywords ?? input.match_keywords),
    secondsPerQuestion: normalizeLearningSecondsPerQuestion(input.secondsPerQuestion ?? input.timePerQuestionSeconds),
    passPercent: normalizeLearningPassPercent(input.passPercent ?? input.passingPercent ?? input.minimumPassPercent),
    handbookDocuments: normalizeAttachmentDocuments(input.handbookDocuments),
    videoItems: normalizeLearningVideoItems(input.videoItems),
    questionItems: normalizeLearningQuestionItems(input.questionItems),
    assignmentItems: normalizeLearningAssignmentItems(input.assignmentItems, state.users ?? []),
    attemptItems: normalizeLearningAttemptItems(input.attemptItems),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateLearningTest(current, patch, state, now = isoNow) {
  return {
    ...current,
    organizationId: hasOwn(patch, "organizationId")
      ? requireText(patch.organizationId, "Organizacija")
      : current.organizationId,
    title: hasOwn(patch, "title") ? requireText(patch.title, "Naziv testa") : current.title,
    status: hasOwn(patch, "status") ? normalizeLearningTestStatus(patch.status) : current.status,
    description: hasOwn(patch, "description") ? normalizeText(patch.description) : current.description,
    intendedFor: hasOwn(patch, "intendedFor") ? normalizeText(patch.intendedFor) : normalizeText(current.intendedFor),
    recommendationRules: hasOwn(patch, "recommendationRules") ? normalizeText(patch.recommendationRules) : normalizeText(current.recommendationRules),
    matchKeywords: hasOwn(patch, "matchKeywords") ? normalizeLearningTestMatchKeywords(patch.matchKeywords) : normalizeLearningTestMatchKeywords(current.matchKeywords),
    secondsPerQuestion: hasOwn(patch, "secondsPerQuestion") || hasOwn(patch, "timePerQuestionSeconds")
      ? normalizeLearningSecondsPerQuestion(patch.secondsPerQuestion ?? patch.timePerQuestionSeconds)
      : normalizeLearningSecondsPerQuestion(current.secondsPerQuestion ?? current.timePerQuestionSeconds),
    passPercent: hasOwn(patch, "passPercent") || hasOwn(patch, "passingPercent") || hasOwn(patch, "minimumPassPercent")
      ? normalizeLearningPassPercent(patch.passPercent ?? patch.passingPercent ?? patch.minimumPassPercent)
      : normalizeLearningPassPercent(current.passPercent ?? current.passingPercent ?? current.minimumPassPercent),
    handbookDocuments: hasOwn(patch, "handbookDocuments")
      ? normalizeAttachmentDocuments(patch.handbookDocuments)
      : normalizeAttachmentDocuments(current.handbookDocuments),
    videoItems: hasOwn(patch, "videoItems")
      ? normalizeLearningVideoItems(patch.videoItems)
      : normalizeLearningVideoItems(current.videoItems),
    questionItems: hasOwn(patch, "questionItems")
      ? normalizeLearningQuestionItems(patch.questionItems)
      : normalizeLearningQuestionItems(current.questionItems),
    assignmentItems: hasOwn(patch, "assignmentItems")
      ? normalizeLearningAssignmentItems(patch.assignmentItems, state.users ?? [])
      : normalizeLearningAssignmentItems(current.assignmentItems, state.users ?? []),
    attemptItems: hasOwn(patch, "attemptItems")
      ? normalizeLearningAttemptItems(patch.attemptItems)
      : normalizeLearningAttemptItems(current.attemptItems),
    updatedAt: now(),
  };
}

export function filterLearningTests(items, { query = "", status = "all" } = {}) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  return (items ?? []).filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const haystack = [
      item.title,
      item.description,
      item.intendedFor,
      item.recommendationRules,
      item.matchKeywords,
      ...(item.videoItems ?? []).flatMap((video) => [video.title, video.url]),
      ...(item.questionItems ?? []).flatMap((question) => [
        question.groupLabel,
        question.code,
        question.prompt,
        question.explanation,
        ...(question.options ?? []).map((option) => option.text),
      ]),
      ...(item.assignmentItems ?? []).flatMap((assignment) => [assignment.userLabel, assignment.email]),
    ].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function sortLearningTests(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftRank = LEARNING_TEST_STATUS_OPTIONS.findIndex((option) => option.value === left.status);
    const rightRank = LEARNING_TEST_STATUS_OPTIONS.findIndex((option) => option.value === right.status);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function createSafetyAuthorization(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const serviceSnapshot = deriveLinkedServiceCatalogSnapshot(
    state,
    hasOwn(input, "linkedServiceCatalogIds") ? input.linkedServiceCatalogIds : (input.linkedServiceIds ?? []),
    hasOwn(input, "linkedServiceCatalogTitles") ? input.linkedServiceCatalogTitles : [],
  );
  const templateSnapshot = serviceSnapshot.linkedServiceCatalogIds.length > 0
    ? deriveTemplateSnapshotFromLinkedServices(
      state,
      serviceSnapshot.linkedServiceCatalogIds,
      hasOwn(input, "linkedTemplateIds") ? input.linkedTemplateIds : [],
      hasOwn(input, "linkedTemplateTitles") ? input.linkedTemplateTitles : [],
    )
    : normalizeLinkedTemplateSnapshot(
      state,
      hasOwn(input, "linkedTemplateIds") ? input.linkedTemplateIds : [],
      hasOwn(input, "linkedTemplateTitles") ? input.linkedTemplateTitles : [],
    );
  const validForever = normalizeBoolean(input.validForever, false);
  const validUntil = validForever
    ? null
    : normalizeOptionalDate(input.validUntil);

  return {
    id: createId(),
    organizationId: requireText(input.organizationId, "Organizacija"),
    title: requireText(input.title, "Ime ovlaštenja"),
    scope: normalizeText(input.scope ?? input.authorizationScope),
    issuedOn: normalizeOptionalDate(input.issuedOn ?? input.issuedAt),
    validUntil,
    validForever,
    note: normalizeText(input.note),
    linkedServiceCatalogIds: serviceSnapshot.linkedServiceCatalogIds,
    linkedServiceCatalogTitles: serviceSnapshot.linkedServiceCatalogTitles,
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
    documents: normalizeAttachmentDocuments(input.documents),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateSafetyAuthorization(current, patch, state, now = isoNow) {
  const serviceSnapshot = hasOwn(patch, "linkedServiceCatalogIds") || hasOwn(patch, "linkedServiceIds")
    ? deriveLinkedServiceCatalogSnapshot(
      state,
      hasOwn(patch, "linkedServiceCatalogIds") ? patch.linkedServiceCatalogIds : patch.linkedServiceIds,
      current.linkedServiceCatalogTitles,
    )
    : deriveLinkedServiceCatalogSnapshot(
      state,
      current.linkedServiceCatalogIds,
      current.linkedServiceCatalogTitles,
    );
  const templateSnapshot = serviceSnapshot.linkedServiceCatalogIds.length > 0
    ? deriveTemplateSnapshotFromLinkedServices(
      state,
      serviceSnapshot.linkedServiceCatalogIds,
      current.linkedTemplateIds,
      current.linkedTemplateTitles,
    )
    : (hasOwn(patch, "linkedTemplateIds")
      ? normalizeLinkedTemplateSnapshot(state, patch.linkedTemplateIds, current.linkedTemplateTitles)
      : normalizeLinkedTemplateSnapshot(state, current.linkedTemplateIds, current.linkedTemplateTitles));
  const nextValidForever = hasOwn(patch, "validForever")
    ? normalizeBoolean(patch.validForever, false)
    : normalizeBoolean(current.validForever, false);

  return {
    ...current,
    organizationId: hasOwn(patch, "organizationId")
      ? requireText(patch.organizationId, "Organizacija")
      : current.organizationId,
    title: hasOwn(patch, "title") ? requireText(patch.title, "Ime ovlaštenja") : current.title,
    scope: hasOwn(patch, "scope") || hasOwn(patch, "authorizationScope")
      ? normalizeText(patch.scope ?? patch.authorizationScope)
      : current.scope,
    issuedOn: hasOwn(patch, "issuedOn") || hasOwn(patch, "issuedAt")
      ? normalizeOptionalDate(patch.issuedOn ?? patch.issuedAt)
      : current.issuedOn,
    validUntil: nextValidForever
      ? null
      : hasOwn(patch, "validUntil")
        ? normalizeOptionalDate(patch.validUntil)
        : current.validUntil,
    validForever: nextValidForever,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    linkedServiceCatalogIds: serviceSnapshot.linkedServiceCatalogIds,
    linkedServiceCatalogTitles: serviceSnapshot.linkedServiceCatalogTitles,
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
    documents: hasOwn(patch, "documents")
      ? normalizeAttachmentDocuments(patch.documents)
      : normalizeAttachmentDocuments(current.documents),
    updatedAt: now(),
  };
}

export function filterSafetyAuthorizations(
  items,
  { query = "" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return (items ?? []).filter((item) => {
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.scope,
      item.note,
      ...(item.linkedServiceCatalogTitles ?? []),
      ...(item.linkedTemplateTitles ?? []),
      ...(item.documents ?? []).flatMap((document) => [document.fileName, document.description]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortSafetyAuthorizations(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftValidUntil = normalizeBoolean(left.validForever, false) ? "" : String(left.validUntil || "");
    const rightValidUntil = normalizeBoolean(right.validForever, false) ? "" : String(right.validUntil || "");

    if (leftValidUntil && rightValidUntil && leftValidUntil !== rightValidUntil) {
      return leftValidUntil.localeCompare(rightValidUntil);
    }

    if (leftValidUntil && !rightValidUntil) {
      return -1;
    }

    if (!leftValidUntil && rightValidUntil) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function doesAbsenceTypeRequireApproval(value = "") {
  return APPROVAL_ABSENCE_TYPES.has(normalizeAbsenceType(value));
}

export function getAbsenceBusinessDayCount(startDate, endDate) {
  return listBusinessDayKeysBetween(startDate, endDate).length;
}

export function createAbsenceEntry(
  input,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const normalizedType = normalizeAbsenceType(input.type);
  const normalizedStatus = normalizeAbsenceStatus(
    input.status,
    doesAbsenceTypeRequireApproval(normalizedType) ? "pending" : "approved",
  );
  const { startDate, endDate } = normalizeAbsenceDateRange(input.startDate, input.endDate);

  return {
    id: createId(),
    organizationId: requireText(input.organizationId, "Organizacija"),
    userId: requireText(input.userId, "Korisnik"),
    userLabel: requireText(input.userLabel, "Ime korisnika"),
    type: normalizedType,
    typeLabel: getAbsenceTypeLabel(normalizedType),
    status: normalizedStatus,
    statusLabel: ABSENCE_STATUS_OPTIONS.find((option) => option.value === normalizedStatus)?.label || "Na čekanju",
    startDate,
    endDate,
    dayCount: getAbsenceBusinessDayCount(startDate, endDate),
    note: normalizeText(input.note),
    documents: normalizeAttachmentDocuments(input.documents),
    requestedByUserId: normalizeText(input.requestedByUserId),
    requestedByLabel: normalizeText(input.requestedByLabel),
    approvedByUserId: normalizeText(input.approvedByUserId),
    approvedByLabel: normalizeText(input.approvedByLabel),
    approvedAt: normalizeOptionalDateTime(input.approvedAt),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateAbsenceEntry(current, patch, now = isoNow) {
  const nextType = hasOwn(patch, "type")
    ? normalizeAbsenceType(patch.type)
    : normalizeAbsenceType(current.type);
  const nextStatus = hasOwn(patch, "status")
    ? normalizeAbsenceStatus(
      patch.status,
      doesAbsenceTypeRequireApproval(nextType)
        ? (current.status || "pending")
        : "approved",
    )
    : normalizeAbsenceStatus(
      current.status,
      doesAbsenceTypeRequireApproval(nextType) ? "pending" : "approved",
    );
  const dateRange = hasOwn(patch, "startDate") || hasOwn(patch, "endDate")
    ? normalizeAbsenceDateRange(
      hasOwn(patch, "startDate") ? patch.startDate : current.startDate,
      hasOwn(patch, "endDate") ? patch.endDate : current.endDate,
    )
    : {
      startDate: normalizeOptionalDate(current.startDate),
      endDate: normalizeOptionalDate(current.endDate),
    };

  return {
    ...current,
    organizationId: hasOwn(patch, "organizationId")
      ? requireText(patch.organizationId, "Organizacija")
      : current.organizationId,
    userId: hasOwn(patch, "userId")
      ? requireText(patch.userId, "Korisnik")
      : current.userId,
    userLabel: hasOwn(patch, "userLabel")
      ? requireText(patch.userLabel, "Ime korisnika")
      : current.userLabel,
    type: nextType,
    typeLabel: getAbsenceTypeLabel(nextType),
    status: nextStatus,
    statusLabel: ABSENCE_STATUS_OPTIONS.find((option) => option.value === nextStatus)?.label || current.statusLabel,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    dayCount: getAbsenceBusinessDayCount(dateRange.startDate, dateRange.endDate),
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    documents: hasOwn(patch, "documents")
      ? normalizeAttachmentDocuments(patch.documents)
      : normalizeAttachmentDocuments(current.documents),
    requestedByUserId: hasOwn(patch, "requestedByUserId")
      ? normalizeText(patch.requestedByUserId)
      : current.requestedByUserId,
    requestedByLabel: hasOwn(patch, "requestedByLabel")
      ? normalizeText(patch.requestedByLabel)
      : current.requestedByLabel,
    approvedByUserId: hasOwn(patch, "approvedByUserId")
      ? normalizeText(patch.approvedByUserId)
      : current.approvedByUserId,
    approvedByLabel: hasOwn(patch, "approvedByLabel")
      ? normalizeText(patch.approvedByLabel)
      : current.approvedByLabel,
    approvedAt: hasOwn(patch, "approvedAt")
      ? normalizeOptionalDateTime(patch.approvedAt)
      : current.approvedAt,
    updatedAt: now(),
  };
}

export function normalizeAbsenceBalanceEntry(
  input,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const annualLeave = normalizeAbsenceBalanceAnnualParts(input, 0);

  return {
    id: normalizeId(input.id) || createId(),
    organizationId: requireText(input.organizationId, "Organizacija"),
    userId: requireText(input.userId, "Korisnik"),
    userLabel: requireText(input.userLabel, "Ime korisnika"),
    annualLeaveInitialDays: annualLeave.totalDays,
    annualLeaveCarriedDays: annualLeave.carriedDays,
    annualLeaveCurrentDays: annualLeave.currentDays,
    sickLeaveInitialDays: normalizeAbsenceDayAllowance(input.sickLeaveInitialDays, 0),
    createdAt: normalizeOptionalDateTime(input.createdAt) ?? timestamp,
    updatedAt: normalizeOptionalDateTime(input.updatedAt) ?? timestamp,
  };
}

export function updateAbsenceBalanceEntry(current, patch, now = isoNow) {
  const hasAnnualPatch = hasOwn(patch, "annualLeaveInitialDays")
    || hasOwn(patch, "annualLeaveCarriedDays")
    || hasOwn(patch, "annualLeaveCarryoverDays")
    || hasOwn(patch, "annualLeaveCurrentDays");
  const annualLeave = hasAnnualPatch
    ? normalizeAbsenceBalanceAnnualParts({
      annualLeaveInitialDays: hasOwn(patch, "annualLeaveInitialDays") ? patch.annualLeaveInitialDays : current.annualLeaveInitialDays,
      annualLeaveCarriedDays: hasOwn(patch, "annualLeaveCarriedDays") ? patch.annualLeaveCarriedDays : current.annualLeaveCarriedDays,
      annualLeaveCarryoverDays: hasOwn(patch, "annualLeaveCarryoverDays") ? patch.annualLeaveCarryoverDays : current.annualLeaveCarriedDays,
      annualLeaveCurrentDays: hasOwn(patch, "annualLeaveCurrentDays") ? patch.annualLeaveCurrentDays : current.annualLeaveCurrentDays,
    }, current.annualLeaveInitialDays)
    : null;

  return {
    ...current,
    organizationId: hasOwn(patch, "organizationId")
      ? requireText(patch.organizationId, "Organizacija")
      : current.organizationId,
    userId: hasOwn(patch, "userId")
      ? requireText(patch.userId, "Korisnik")
      : current.userId,
    userLabel: hasOwn(patch, "userLabel")
      ? requireText(patch.userLabel, "Ime korisnika")
      : current.userLabel,
    annualLeaveInitialDays: annualLeave ? annualLeave.totalDays : current.annualLeaveInitialDays,
    annualLeaveCarriedDays: annualLeave ? annualLeave.carriedDays : (current.annualLeaveCarriedDays ?? 0),
    annualLeaveCurrentDays: annualLeave ? annualLeave.currentDays : (current.annualLeaveCurrentDays ?? current.annualLeaveInitialDays ?? 0),
    sickLeaveInitialDays: hasOwn(patch, "sickLeaveInitialDays")
      ? normalizeAbsenceDayAllowance(patch.sickLeaveInitialDays, current.sickLeaveInitialDays)
      : current.sickLeaveInitialDays,
    updatedAt: now(),
  };
}

export function filterAbsenceEntries(
  items,
  {
    query = "",
    userId = "",
    type = "all",
    status = "all",
  } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedUserId = normalizeText(userId);
  const normalizedType = normalizeText(type).toLowerCase();
  const normalizedStatus = normalizeText(status).toLowerCase();

  return (items ?? []).filter((item) => {
    if (normalizedUserId && String(item.userId) !== normalizedUserId) {
      return false;
    }
    if (normalizedType && normalizedType !== "all" && normalizeAbsenceType(item.type) !== normalizedType) {
      return false;
    }
    if (normalizedStatus && normalizedStatus !== "all" && normalizeAbsenceStatus(item.status) !== normalizedStatus) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.userLabel,
      item.note,
      item.typeLabel,
      getAbsenceTypeLabel(item.type),
      item.statusLabel,
      item.startDate,
      item.endDate,
      ...(item.documents ?? []).flatMap((document) => [document.fileName, document.description]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortAbsenceEntries(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftStatus = ABSENCE_STATUS_RANK[normalizeAbsenceStatus(left.status)] ?? 99;
    const rightStatus = ABSENCE_STATUS_RANK[normalizeAbsenceStatus(right.status)] ?? 99;
    if (leftStatus !== rightStatus) {
      return leftStatus - rightStatus;
    }

    const leftStart = String(left.startDate || "");
    const rightStart = String(right.startDate || "");
    if (leftStart !== rightStart) {
      return rightStart.localeCompare(leftStart);
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

function buildPersonTrainingShortLabel(label = "", fallback = "OS") {
  const words = normalizeText(label)
    .split(/\s+/)
    .map((entry) => entry.replace(/[^A-Za-z0-9ČĆĐŠŽčćđšž]/g, ""))
    .filter(Boolean);

  if (words.length === 0) {
    return fallback;
  }

  return words
    .slice(0, 3)
    .map((entry) => entry.charAt(0).toUpperCase())
    .join("")
    .slice(0, 10)
    || fallback;
}

function normalizePersonTrainingTextList(value = [], limit = 180) {
  const source = Array.isArray(value)
    ? value
    : String(value ?? "").split(/[\n,;]/);

  return Array.from(new Set(
    source
      .map((entry) => normalizeText(entry).slice(0, limit))
      .filter(Boolean),
  ));
}

function normalizePersonTrainingActivityStatus(value, fallback = "DA") {
  const isActive = normalizeBoolean(value, fallback !== "NE");
  return isActive ? "DA" : "NE";
}

function normalizePersonTrainingIsznrMeta(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  return {
    source: normalizeText(source.source || "company").slice(0, 40),
    recordKind: normalizeText(source.recordKind ?? source.kind ?? source.type).slice(0, 40),
    recordId: normalizeText(source.recordId ?? source.isznrId ?? source.id).slice(0, 80),
    recordIri: normalizeText(source.recordIri ?? source.iri ?? source["@id"]).slice(0, 180),
    recordNumber: normalizeText(source.recordNumber ?? source.number).slice(0, 120),
    submittedAt: normalizeOptionalDateTime(source.submittedAt ?? source.syncedAt),
    status: normalizeText(source.status).slice(0, 80),
    message: normalizeText(source.message).slice(0, 1000),
  };
}

function normalizePersonTrainingItemDetails(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  return {
    jobTitle: normalizeText(source.jobTitle ?? source.workplaceTitle ?? source.positionTitle).slice(0, 180),
    jobDescription: normalizeText(source.jobDescription ?? source.workDescription ?? source.taskDescription ?? source.activityDescription).slice(0, 4000),
    theoryPlace: normalizeText(source.theoryPlace ?? source.theoryTrainingPlace).slice(0, 180),
    theoryDate: normalizeOptionalDate(source.theoryDate ?? source.theoryTrainingDate),
    theoryMethod: normalizeText(source.theoryMethod ?? source.theoryTrainingMethod).slice(0, 180),
    employerRepresentativeName: normalizeText(source.employerRepresentativeName ?? source.employerName ?? source.authorizedPersonName).slice(0, 180),
    employerRepresentativeOib: normalizeText(source.employerRepresentativeOib ?? source.employerOib ?? source.authorizedPersonOib).slice(0, 32),
    additionalPersonName: normalizeText(source.additionalPersonName ?? source.otherPersonName).slice(0, 180),
    additionalPersonOib: normalizeText(source.additionalPersonOib ?? source.otherPersonOib).slice(0, 32),
    practicalPlace: normalizeText(source.practicalPlace ?? source.practicalTrainingPlace).slice(0, 180),
    safeWorkPeriodFrom: normalizeOptionalDate(source.safeWorkPeriodFrom ?? source.monitoringPeriodFrom),
    safeWorkPeriodTo: normalizeOptionalDate(source.safeWorkPeriodTo ?? source.monitoringPeriodTo),
    referralNumber: normalizeText(source.referralNumber ?? source.ra1Number ?? source.medicalReferralNumber).slice(0, 120),
    referralValidUntil: normalizeOptionalDate(source.referralValidUntil ?? source.ra1ValidUntil ?? source.medicalReferralValidUntil ?? source.referralExpiresOn),
    examType: normalizeText(source.examType ?? source.medicalExamType).slice(0, 180),
    examReason: normalizeText(source.examReason ?? source.medicalExamReason).slice(0, 1000),
    medicalJobTitle: normalizeText(source.medicalJobTitle ?? source.ra1JobTitle ?? source.jobTitle).slice(0, 180),
    medicalJobDescription: normalizeText(source.medicalJobDescription ?? source.ra1JobDescription ?? source.jobDescription ?? source.workDescription).slice(0, 4000),
    medicalHazards: normalizeText(source.medicalHazards ?? source.medicalExams ?? source.specialWorkReason ?? source.specialConditions).slice(0, 4000),
    medicalWorkplace: normalizeText(source.medicalWorkplace ?? source.ra1Workplace ?? source.workplace).slice(0, 1000),
    medicalWorkOrganization: normalizeText(source.medicalWorkOrganization ?? source.ra1WorkOrganization ?? source.workOrganization).slice(0, 1000),
    medicalBodyPositions: normalizeText(source.medicalBodyPositions ?? source.ra1BodyPositions ?? source.bodyPositions).slice(0, 1000),
    medicalLoadWeights: normalizeText(source.medicalLoadWeights ?? source.ra1LoadWeights ?? source.loadWeights).slice(0, 1000),
    medicalWorkConditions: normalizeText(source.medicalWorkConditions ?? source.ra1WorkConditions ?? source.workConditions).slice(0, 2000),
    medicalImportantFunctions: normalizeText(source.medicalImportantFunctions ?? source.ra1ImportantFunctions ?? source.importantFunctions).slice(0, 1000),
    medicalEquipment: normalizeText(source.medicalEquipment ?? source.ra1Equipment ?? source.workEquipment ?? source.toolsAndMachines).slice(0, 2000),
    medicalSubstances: normalizeText(source.medicalSubstances ?? source.ra1Substances ?? source.workSubstances ?? source.chemicalSubstances).slice(0, 2000),
    medicalPpe: normalizeText(source.medicalPpe ?? source.ra1Ppe ?? source.ppeText).slice(0, 2000),
    fitnessResult: normalizeText(source.fitnessResult ?? source.healthFitnessResult ?? source.medicalFitnessResult).slice(0, 180),
    fitnessRestrictions: normalizeText(source.fitnessRestrictions ?? source.healthFitnessRestrictions ?? source.medicalRestrictions).slice(0, 2000),
    psychologicalCheckUntil: normalizeOptionalDate(source.psychologicalCheckUntil ?? source.psychologicalCheckDueDate ?? source.psychologicalValidUntil ?? source.psychologyValidUntil),
    visionJobTitle: normalizeText(source.visionJobTitle ?? source.medicalJobTitle ?? source.jobTitle).slice(0, 180),
    visionJobDescription: normalizeText(source.visionJobDescription ?? source.medicalJobDescription ?? source.jobDescription ?? source.workDescription).slice(0, 4000),
    visionReferralValidUntil: normalizeOptionalDate(source.visionReferralValidUntil ?? source.visionReferralExpiresOn),
    visionReason: normalizeText(source.visionReason ?? source.visionExamReason).slice(0, 1000),
    visionResult: normalizeText(source.visionResult ?? source.visionExamResult).slice(0, 180),
    visionCorrection: normalizeText(source.visionCorrection ?? source.eyeCorrection).slice(0, 180),
    computerWork: normalizeText(source.computerWork ?? source.screenWork ?? source.displayScreenWork).slice(0, 1000),
  };
}

export function buildPeopleTrainingRecordNumber({
  workOrderNumber = "",
  serviceCode = "",
  personOib = "",
} = {}) {
  return [
    normalizeText(workOrderNumber),
    normalizeText(serviceCode),
    normalizeText(personOib).replace(/\s+/g, ""),
  ].filter(Boolean).join("-");
}

function getPersonTrainingTypeOption(type = "", source = {}, fallback = PERSON_TRAINING_TYPE_OPTIONS[0]) {
  const normalized = normalizeText(type).toLowerCase();
  const staticOption = PERSON_TRAINING_TYPE_OPTIONS.find((option) => option.value === normalized);

  if (staticOption) {
    return staticOption;
  }

  const label = normalizeText(source?.label ?? source?.serviceName ?? source?.name ?? normalized).slice(0, 180)
    || fallback.label
    || "Osposobljavanje";
  const shortLabel = normalizeText(source?.shortLabel ?? source?.serviceCode ?? source?.code).slice(0, 40)
    || buildPersonTrainingShortLabel(label, fallback.shortLabel || "OS");

  return {
    value: normalized || fallback.value,
    label,
    shortLabel,
  };
}

function normalizePersonTrainingItem(input = {}, typeOption = PERSON_TRAINING_TYPE_OPTIONS[0]) {
  const source = input && typeof input === "object" ? input : {};
  const normalizedType = getPersonTrainingTypeOption(source.type ?? typeOption.value, source, typeOption);
  const validForever = normalizeBoolean(source.validForever, false);
  const passedOn = normalizeOptionalDate(source.passedOn ?? source.passedDate);
  const issuedOn = normalizeOptionalDate(source.issuedOn ?? source.issuedDate) || passedOn;
  const serviceCode = normalizeText(source.serviceCode).slice(0, 80);
  const shortLabel = normalizeText(source.shortLabel).slice(0, 40) || normalizedType.shortLabel;
  const history = Array.isArray(source.history)
    ? source.history
      .map((entry) => {
        const normalized = normalizePersonTrainingItem({ ...(entry ?? {}), history: [] }, normalizedType);
        return {
          ...normalized,
          isActive: false,
          archivedAt: normalizeOptionalDateTime(entry?.archivedAt ?? entry?.updatedAt ?? entry?.createdAt),
          activeUntil: normalizeOptionalDate(entry?.activeUntil),
          history: [],
        };
      })
      .filter((entry) => entry.type)
    : [];

  return {
    type: normalizedType.value,
    label: normalizeText(source.label).slice(0, 180) || normalizedType.label,
    shortLabel,
    serviceId: normalizeText(source.serviceId ?? source.serviceCatalogId).slice(0, 120),
    serviceName: normalizeText(source.serviceName).slice(0, 180),
    serviceCode,
    linkedTemplateIds: normalizeIdList(source.linkedTemplateIds),
    linkedTemplateTitles: normalizePersonTrainingTextList(source.linkedTemplateTitles, 180),
    linkedLearningTestIds: normalizeIdList(source.linkedLearningTestIds),
    linkedLearningTestTitles: normalizePersonTrainingTextList(source.linkedLearningTestTitles, 180),
    issuedOn,
    passedOn,
    validUntil: validForever ? null : normalizeOptionalDate(source.validUntil ?? source.validTo ?? source.expiresOn),
    validForever,
    certificateNumber: normalizeText(source.certificateNumber ?? source.documentNumber ?? source.number).slice(0, 120),
    recordNumber: normalizeText(source.recordNumber ?? source.zapisnikNumber).slice(0, 120),
    provider: normalizeText(source.provider ?? source.institution ?? source.organizer).slice(0, 180),
    examMode: normalizeText(source.examMode ?? source.sourceMode).slice(0, 40),
    workOrderId: normalizeText(source.workOrderId).slice(0, 120),
    workOrderNumber: normalizeText(source.workOrderNumber).slice(0, 80),
    learningTestId: normalizeText(source.learningTestId).slice(0, 120),
    learningTestTitle: normalizeText(source.learningTestTitle).slice(0, 180),
    certificateStatus: normalizeText(source.certificateStatus).slice(0, 40),
    certificateDocumentId: normalizeText(source.certificateDocumentId).slice(0, 120),
    isznr: normalizePersonTrainingIsznrMeta(source.isznr ?? source.isznrMeta),
    details: normalizePersonTrainingItemDetails(source.details ?? source.safeWorkDetails ?? source.trainingDetails),
    isActive: hasOwn(source, "isActive") ? normalizeBoolean(source.isActive, true) : true,
    activeFrom: normalizeOptionalDate(source.activeFrom ?? issuedOn ?? passedOn),
    activeUntil: normalizeOptionalDate(source.activeUntil),
    archivedAt: normalizeOptionalDateTime(source.archivedAt),
    history,
    note: normalizeText(source.note).slice(0, 1000),
    status: normalizeText(source.status).toLowerCase(),
  };
}

function hasPersonTrainingItemEvidence(item = {}) {
  return Boolean(
    normalizeText(item.recordNumber)
    || normalizeText(item.certificateNumber)
    || normalizeText(item.workOrderNumber)
    || normalizeOptionalDate(item.issuedOn)
    || normalizeOptionalDate(item.passedOn)
    || normalizeOptionalDate(item.validUntil)
    || Object.values(item.details ?? {}).some((value) => normalizeText(value)),
  );
}

function getPersonTrainingItemVersionFingerprint(item = {}) {
  return [
    normalizeText(item.type),
    normalizeText(item.serviceId),
    normalizeText(item.serviceCode),
    normalizeText(item.recordNumber),
    normalizeText(item.certificateNumber),
    normalizeText(item.workOrderNumber),
    normalizeOptionalDate(item.issuedOn) || "",
    normalizeOptionalDate(item.passedOn) || "",
    normalizeOptionalDate(item.validUntil) || "",
    normalizeBoolean(item.validForever, false) ? "forever" : "",
  ].join("|");
}

function shouldArchivePersonTrainingItemVersion(previous = {}, next = {}) {
  if (!previous?.type || !next?.type || previous.type !== next.type) {
    return false;
  }
  if (!hasPersonTrainingItemEvidence(previous) || !hasPersonTrainingItemEvidence(next)) {
    return false;
  }
  if (getPersonTrainingItemVersionFingerprint(previous) === getPersonTrainingItemVersionFingerprint(next)) {
    return false;
  }

  return [
    "recordNumber",
    "certificateNumber",
    "workOrderNumber",
    "issuedOn",
    "passedOn",
  ].some((key) => normalizeText(previous[key]) && normalizeText(next[key]) && normalizeText(previous[key]) !== normalizeText(next[key]));
}

function archivePersonTrainingItemVersion(item = {}, timestamp = isoNow()) {
  return {
    ...item,
    isActive: false,
    activeUntil: timestamp.slice(0, 10),
    archivedAt: timestamp,
    status: "archived",
    history: [],
  };
}

function mergePersonTrainingPeriodicHistory(currentItems = [], nextItems = [], timestamp = isoNow()) {
  const currentByType = new Map(
    normalizePersonTrainingItems(currentItems)
      .filter((item) => item.type)
      .map((item) => [item.type, item]),
  );
  const source = Array.isArray(nextItems)
    ? nextItems
    : Object.entries(nextItems && typeof nextItems === "object" ? nextItems : {})
      .map(([type, value]) => ({ ...(value && typeof value === "object" ? value : {}), type }));

  return source.map((entry) => {
    const normalizedNext = normalizePersonTrainingItem(entry, getPersonTrainingTypeOption(entry?.type, entry));
    const previous = currentByType.get(normalizedNext.type);
    if (!previous || !shouldArchivePersonTrainingItemVersion(previous, normalizedNext)) {
      return entry;
    }

    const previousArchive = archivePersonTrainingItemVersion(previous, timestamp);
    const mergedHistory = [
      previousArchive,
      ...(Array.isArray(entry?.history) ? entry.history : []),
      ...(Array.isArray(previous.history) ? previous.history : []),
    ];
    const seen = new Set();
    const history = mergedHistory.filter((historyItem) => {
      const normalizedHistoryItem = normalizePersonTrainingItem(historyItem, getPersonTrainingTypeOption(historyItem?.type, historyItem));
      const key = getPersonTrainingItemVersionFingerprint(normalizedHistoryItem);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    }).slice(0, 24);

    return {
      ...entry,
      isActive: true,
      activeFrom: normalizedNext.issuedOn || normalizedNext.passedOn || timestamp.slice(0, 10),
      history,
    };
  });
}

function normalizePersonTrainingItems(input = []) {
  const source = Array.isArray(input)
    ? input
    : Object.entries(input && typeof input === "object" ? input : {})
      .map(([type, value]) => ({ ...(value && typeof value === "object" ? value : {}), type }));
  const byType = new Map(
    source
      .map((item) => normalizePersonTrainingItem(item, getPersonTrainingTypeOption(item?.type, item)))
      .filter((item) => item.type)
      .map((item) => [item.type, item]),
  );
  const staticTypes = new Set(PERSON_TRAINING_TYPE_OPTIONS.map((option) => option.value));

  const normalizedItems = PERSON_TRAINING_TYPE_OPTIONS.map((typeOption) => normalizePersonTrainingItem(
    byType.get(typeOption.value) ?? {},
    typeOption,
  ));

  source
    .map((item) => normalizePersonTrainingItem(item, getPersonTrainingTypeOption(item?.type, item)))
    .filter((item) => item.type && !staticTypes.has(item.type))
    .forEach((item) => {
      if (!normalizedItems.some((entry) => entry.type === item.type)) {
        normalizedItems.push(item);
      }
    });

  return normalizedItems;
}

function getPersonTrainingItemStatus(item = {}, today = todayString()) {
  if (normalizeText(item.status) === "not_required") {
    return "not_required";
  }

  const validUntil = normalizeOptionalDate(item.validUntil);
  const issuedOn = normalizeOptionalDate(item.issuedOn);
  const passedOn = normalizeOptionalDate(item.passedOn ?? item.passedDate);
  const certificateNumber = normalizeText(item.certificateNumber);
  const recordNumber = normalizeText(item.recordNumber ?? item.zapisnikNumber);

  if (!issuedOn && !passedOn && !certificateNumber && !recordNumber) {
    return "missing";
  }
  if (normalizeBoolean(item.validForever, false)) {
    return "valid";
  }
  if (!validUntil) {
    return "valid";
  }
  if (validUntil < today) {
    return "expired";
  }

  const due = new Date(`${validUntil}T00:00:00Z`);
  const now = new Date(`${today}T00:00:00Z`);
  const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilDue <= 60 ? "expiring" : "valid";
}

function enrichPersonTrainingItems(items = []) {
  return normalizePersonTrainingItems(items).map((item) => ({
    ...item,
    status: getPersonTrainingItemStatus(item),
  }));
}

function applyPeopleTrainingRecordNumbers(items = [], record = {}) {
  return items.map((item) => {
    const serviceCode = item.serviceCode || item.shortLabel || item.type || "";
    const generatedRecordNumber = buildPeopleTrainingRecordNumber({
      workOrderNumber: item.workOrderNumber,
      serviceCode,
      personOib: record.oib,
    });
    const hasDetailData = Object.values(item.details ?? {}).some((value) => normalizeText(value));
    const shouldHaveRecordNumber = Boolean(
      item.recordNumber
      || item.certificateNumber
      || item.workOrderNumber
      || item.issuedOn
      || item.passedOn
      || item.validUntil
      || hasDetailData,
    );
    return {
      ...item,
      recordNumber: shouldHaveRecordNumber ? (item.recordNumber || generatedRecordNumber) : "",
    };
  });
}

export function createPersonTrainingRecord(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const organizationId = requireText(input.organizationId, "Organizacija");
  const companyId = requireText(input.companyId, "Tvrtka");
  const company = (state.companies ?? []).find((item) => String(item.id) === String(companyId));

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const locationId = normalizeText(input.locationId);
  const location = locationId
    ? (state.locations ?? []).find((item) => String(item.id) === String(locationId) && String(item.companyId) === String(companyId))
    : null;

  if (locationId && !location) {
    throw new Error("Odabrana lokacija ne pripada toj tvrtki.");
  }

  const firstName = normalizeText(input.firstName).slice(0, 120);
  const lastName = normalizeText(input.lastName).slice(0, 160);
  const fullName = normalizeText(input.fullName || [firstName, lastName].filter(Boolean).join(" ")).slice(0, 240);
  const oib = normalizeText(input.oib).replace(/\s+/g, "").slice(0, 32);
  const activityStatus = normalizePersonTrainingActivityStatus(
    input.activityStatus ?? input.activity ?? input.aktivnost ?? input.isActive ?? input.active,
    "DA",
  );
  const normalizedTrainingItems = applyPeopleTrainingRecordNumbers(enrichPersonTrainingItems(input.trainingItems), { oib });
  const firstSafeWorkDetails = normalizedTrainingItems.find((item) => item.type === "safe_work" || /znr|zos/i.test(`${item.shortLabel} ${item.serviceCode}`))?.details ?? {};
  const jobTitle = normalizeText(input.jobTitle || firstSafeWorkDetails.jobTitle).slice(0, 180);

  return {
    id: createId(),
    organizationId,
    companyId,
    companyName: company.name ?? "",
    companyOib: company.oib ?? "",
    locationId,
    locationName: location?.name ?? "",
    firstName,
    lastName,
    fullName: requireText(fullName, "Ime i prezime"),
    oib,
    fatherName: normalizeText(input.fatherName).slice(0, 120),
    language: normalizeText(input.language).slice(0, 80),
    birthDate: normalizeOptionalDate(input.birthDate),
    birthCountry: normalizeText(input.birthCountry).slice(0, 120),
    birthPlace: normalizeText(input.birthPlace).slice(0, 120),
    arrivalDate: normalizeOptionalDate(input.arrivalDate),
    workPlace: normalizeText(input.workPlace).slice(0, 180),
    activityStatus,
    email: normalizeText(input.email).toLowerCase().slice(0, 180),
    phone: normalizeText(input.phone).slice(0, 80),
    jobTitle,
    employmentStatus: activityStatus === "NE" ? "inactive" : "active",
    trainingItems: normalizedTrainingItems,
    attachments: normalizeAttachmentDocuments(input.attachments),
    note: normalizeText(input.note).slice(0, 1000),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updatePersonTrainingRecord(current, patch, state, now = isoNow) {
  const timestamp = now();
  const nextTrainingItems = hasOwn(patch, "trainingItems")
    ? mergePersonTrainingPeriodicHistory(current.trainingItems, patch.trainingItems, timestamp)
    : current.trainingItems;
  const merged = {
    ...current,
    ...patch,
    organizationId: hasOwn(patch, "organizationId") ? patch.organizationId : current.organizationId,
    companyId: hasOwn(patch, "companyId") ? patch.companyId : current.companyId,
    locationId: hasOwn(patch, "locationId") ? patch.locationId : current.locationId,
    firstName: hasOwn(patch, "firstName") ? patch.firstName : current.firstName,
    lastName: hasOwn(patch, "lastName") ? patch.lastName : current.lastName,
    fullName: hasOwn(patch, "fullName") ? patch.fullName : current.fullName,
    oib: hasOwn(patch, "oib") ? patch.oib : current.oib,
    fatherName: hasOwn(patch, "fatherName") ? patch.fatherName : current.fatherName,
    language: hasOwn(patch, "language") ? patch.language : current.language,
    birthDate: hasOwn(patch, "birthDate") ? patch.birthDate : current.birthDate,
    birthCountry: hasOwn(patch, "birthCountry") ? patch.birthCountry : current.birthCountry,
    birthPlace: hasOwn(patch, "birthPlace") ? patch.birthPlace : current.birthPlace,
    arrivalDate: hasOwn(patch, "arrivalDate") ? patch.arrivalDate : current.arrivalDate,
    workPlace: hasOwn(patch, "workPlace") ? patch.workPlace : current.workPlace,
    activityStatus: hasOwn(patch, "activityStatus") ? patch.activityStatus : current.activityStatus,
    email: hasOwn(patch, "email") ? patch.email : current.email,
    phone: hasOwn(patch, "phone") ? patch.phone : current.phone,
    jobTitle: hasOwn(patch, "jobTitle") ? patch.jobTitle : current.jobTitle,
    isActive: hasOwn(patch, "isActive") ? patch.isActive : current.activityStatus !== "NE" && current.employmentStatus !== "inactive",
    trainingItems: nextTrainingItems,
    attachments: hasOwn(patch, "attachments") ? patch.attachments : current.attachments,
    note: hasOwn(patch, "note") ? patch.note : current.note,
  };

  return {
    ...createPersonTrainingRecord(merged, state, () => current.id, () => current.createdAt || timestamp),
    createdAt: current.createdAt,
    updatedAt: timestamp,
  };
}

export function filterPersonTrainingRecords(
  items,
  {
    query = "",
    companyId = "all",
    locationId = "all",
    trainingType = "all",
    status = "all",
  } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedCompanyId = normalizeText(companyId);
  const normalizedLocationId = normalizeText(locationId);
  const normalizedTrainingType = normalizeText(trainingType).toLowerCase();
  const normalizedStatus = normalizeText(status).toLowerCase();

  return (items ?? []).filter((item) => {
    if (normalizedCompanyId && normalizedCompanyId !== "all" && String(item.companyId) !== normalizedCompanyId) {
      return false;
    }
    if (normalizedLocationId && normalizedLocationId !== "all" && String(item.locationId || "") !== normalizedLocationId) {
      return false;
    }
    const trainingItems = enrichPersonTrainingItems(item.trainingItems);
    if (normalizedTrainingType && normalizedTrainingType !== "all") {
      const selected = trainingItems.find((entry) => entry.type === normalizedTrainingType);
      if (!selected) {
        return false;
      }
      if (normalizedStatus && normalizedStatus !== "all" && selected.status !== normalizedStatus) {
        return false;
      }
    } else if (normalizedStatus && normalizedStatus !== "all" && !trainingItems.some((entry) => entry.status === normalizedStatus)) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.fullName,
      item.firstName,
      item.lastName,
      item.oib,
      item.fatherName,
      item.language,
      item.birthCountry,
      item.birthPlace,
      item.workPlace,
      item.activityStatus,
      item.email,
      item.phone,
      item.jobTitle,
      item.companyName,
      item.companyOib,
      item.locationName,
      item.note,
      ...(item.attachments ?? []).map((entry) => entry.fileName),
      ...(item.attachments ?? []).map((entry) => entry.documentCategory),
      ...(item.attachments ?? []).map((entry) => entry.description),
      ...trainingItems.flatMap((entry) => [
        entry.label,
        entry.shortLabel,
        entry.certificateNumber,
        entry.recordNumber,
        entry.provider,
        entry.note,
        entry.issuedOn,
        entry.validUntil,
        ...Object.values(entry.details ?? {}),
      ]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortPersonTrainingRecords(items) {
  return [...(items ?? [])].sort((left, right) => {
    const companyCompare = String(left.companyName || "").localeCompare(String(right.companyName || ""), "hr");
    if (companyCompare !== 0) {
      return companyCompare;
    }

    const locationCompare = String(left.locationName || "").localeCompare(String(right.locationName || ""), "hr");
    if (locationCompare !== 0) {
      return locationCompare;
    }

    return String(left.fullName || "").localeCompare(String(right.fullName || ""), "hr");
  });
}

export function buildAbsenceBalanceSummaries(
  balances = [],
  entries = [],
  { userIds = [], asOfDate = todayString() } = {},
) {
  const requestedUserIds = new Set((Array.isArray(userIds) ? userIds : [userIds]).map((value) => normalizeId(value)).filter(Boolean));
  const summaryYear = getAbsenceSummaryYear(asOfDate);
  const yearPrefix = `${summaryYear}-`;
  const carryoverDeadline = getAnnualLeaveCarryoverDeadline(asOfDate);
  const approvedEntries = (entries ?? []).filter((entry) => normalizeAbsenceStatus(entry.status) === "approved");
  const summaryMap = new Map();

  (balances ?? []).forEach((entry) => {
    const userId = normalizeId(entry.userId);
    if (!userId) {
      return;
    }
    if (requestedUserIds.size > 0 && !requestedUserIds.has(userId)) {
      return;
    }
    const annualLeave = normalizeAbsenceBalanceAnnualParts(entry, entry.annualLeaveInitialDays ?? 0);
    summaryMap.set(userId, {
      userId,
      userLabel: normalizeText(entry.userLabel) || "Korisnik",
      annualLeaveInitialDays: annualLeave.totalDays,
      annualLeaveCarriedDays: annualLeave.carriedDays,
      annualLeaveCurrentDays: annualLeave.currentDays,
      annualLeaveUsedDays: 0,
      annualLeaveCarriedUsedDays: 0,
      annualLeaveCurrentUsedDays: 0,
      annualLeaveCarriedRemainingDays: annualLeave.carriedDays,
      annualLeaveCurrentRemainingDays: annualLeave.currentDays,
      annualLeaveExpiredDays: 0,
      annualLeaveRemainingDays: annualLeave.totalDays,
      annualLeaveCarryoverDeadline: carryoverDeadline,
      sickLeaveInitialDays: normalizeAbsenceDayAllowance(entry.sickLeaveInitialDays, 0),
      sickLeaveUsedDays: 0,
      sickLeaveRemainingDays: normalizeAbsenceDayAllowance(entry.sickLeaveInitialDays, 0),
    });
  });

  approvedEntries.forEach((entry) => {
    const userId = normalizeId(entry.userId);
    if (!userId) {
      return;
    }
    if (requestedUserIds.size > 0 && !requestedUserIds.has(userId)) {
      return;
    }

    const current = summaryMap.get(userId) ?? {
      userId,
      userLabel: normalizeText(entry.userLabel) || "Korisnik",
      annualLeaveInitialDays: 0,
      annualLeaveCarriedDays: 0,
      annualLeaveCurrentDays: 0,
      annualLeaveUsedDays: 0,
      annualLeaveCarriedUsedDays: 0,
      annualLeaveCurrentUsedDays: 0,
      annualLeaveCarriedRemainingDays: 0,
      annualLeaveCurrentRemainingDays: 0,
      annualLeaveExpiredDays: 0,
      annualLeaveRemainingDays: 0,
      annualLeaveCarryoverDeadline: carryoverDeadline,
      sickLeaveInitialDays: 0,
      sickLeaveUsedDays: 0,
      sickLeaveRemainingDays: 0,
    };

    const entryBusinessDays = listBusinessDayKeysBetween(entry.startDate, entry.endDate)
      .filter((dateKey) => dateKey.startsWith(yearPrefix));

    if (normalizeAbsenceType(entry.type) === "annual_leave") {
      current.annualLeaveUsedDays += entryBusinessDays.length;
      current.annualLeaveCarriedUsedDays += entryBusinessDays.filter((dateKey) => dateKey <= carryoverDeadline).length;
    }

    if (normalizeAbsenceType(entry.type) === "sick_leave") {
      current.sickLeaveUsedDays += entryBusinessDays.length;
      current.sickLeaveRemainingDays = Math.max(0, current.sickLeaveInitialDays - current.sickLeaveUsedDays);
    }

    summaryMap.set(userId, current);
  });

  return Array.from(summaryMap.values()).map((entry) => {
    const carriedDays = normalizeAbsenceDayAllowance(entry.annualLeaveCarriedDays, 0);
    const currentDays = normalizeAbsenceDayAllowance(entry.annualLeaveCurrentDays, entry.annualLeaveInitialDays);
    const carriedUsedDays = Math.min(carriedDays, Number(entry.annualLeaveCarriedUsedDays || 0));
    const currentUsedDays = Math.max(0, Number(entry.annualLeaveUsedDays || 0) - carriedUsedDays);
    const carryoverStillValid = (normalizeOptionalDate(asOfDate) ?? todayString()) <= carryoverDeadline;
    const carriedRemainingDays = carryoverStillValid
      ? Math.max(0, carriedDays - carriedUsedDays)
      : 0;
    const currentRemainingDays = Math.max(0, currentDays - currentUsedDays);
    const expiredDays = carryoverStillValid
      ? 0
      : Math.max(0, carriedDays - carriedUsedDays);

    return {
      ...entry,
      annualLeaveInitialDays: carriedDays + currentDays,
      annualLeaveCarriedDays: carriedDays,
      annualLeaveCurrentDays: currentDays,
      annualLeaveCarriedUsedDays: carriedUsedDays,
      annualLeaveCurrentUsedDays: currentUsedDays,
      annualLeaveCarriedRemainingDays: carriedRemainingDays,
      annualLeaveCurrentRemainingDays: currentRemainingDays,
      annualLeaveExpiredDays: expiredDays,
      annualLeaveRemainingDays: carriedRemainingDays + currentRemainingDays,
      annualLeaveCarryoverDeadline: carryoverDeadline,
    };
  }).sort((left, right) => (
    String(left.userLabel || "").localeCompare(String(right.userLabel || ""), "hr", { sensitivity: "base" })
  ));
}

export function buildMonthlyWorkStatusReport(
  {
    users = [],
    absenceEntries = [],
    absenceBalances = [],
    workOrders = [],
  } = {},
  monthKey = todayString().slice(0, 7),
) {
  const businessDayKeys = getMonthBusinessDayKeys(monthKey);
  const businessDaySet = new Set(businessDayKeys);
  const reportUsers = (users ?? []).filter((user) => user?.isActive !== false);
  const userIdByExecutorKey = new Map();
  reportUsers.forEach((user) => {
    const fullName = normalizeText(user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" "));
    [
      user.id,
      user.email,
      user.username,
      user.legacyUsername,
      user.displayName,
      fullName,
      [user.firstName, user.lastName].filter(Boolean).join(" "),
    ].forEach((value) => {
      const key = normalizeText(value).toLowerCase();
      if (key) {
        userIdByExecutorKey.set(key, normalizeId(user.id));
      }
    });
  });
  const approvedEntries = sortAbsenceEntries((absenceEntries ?? []).filter((entry) => (
    normalizeAbsenceStatus(entry.status) === "approved"
  )));
  const timelineByUserId = new Map();

  approvedEntries.forEach((entry) => {
    const userId = normalizeId(entry.userId);
    if (!userId) {
      return;
    }
    const timeline = timelineByUserId.get(userId) ?? new Map();
    listBusinessDayKeysBetween(entry.startDate, entry.endDate).forEach((dateKey) => {
      if (!businessDaySet.has(dateKey) || timeline.has(dateKey)) {
        return;
      }
      timeline.set(dateKey, entry);
    });
    timelineByUserId.set(userId, timeline);
  });

  const balanceByUserId = new Map(
    buildAbsenceBalanceSummaries(absenceBalances, approvedEntries, {
      asOfDate: getMonthLastDateKey(monthKey),
    }).map((entry) => [entry.userId, entry]),
  );

  const workOrderCountsByUserId = new Map();
  (workOrders ?? []).forEach((workOrder) => {
    const dueDate = normalizeOptionalDate(workOrder?.dueDate);
    if (!dueDate || !dueDate.startsWith(monthKey)) {
      return;
    }
    const executors = getWorkOrderExecutors(workOrder);
    executors.forEach((executorLabel) => {
      const executorKey = normalizeText(executorLabel).toLowerCase();
      if (!executorKey) {
        return;
      }
      const userId = userIdByExecutorKey.get(executorKey) || executorKey;
      workOrderCountsByUserId.set(userId, (workOrderCountsByUserId.get(userId) ?? 0) + 1);
    });
  });

  return reportUsers
    .map((user) => {
      const userId = normalizeId(user.id);
      const timeline = timelineByUserId.get(userId) ?? new Map();
      const dayBreakdown = {};

      businessDayKeys.forEach((dateKey) => {
        const entry = timeline.get(dateKey);
        const key = entry ? normalizeAbsenceType(entry.type) : "regular_work";
        dayBreakdown[key] = (dayBreakdown[key] ?? 0) + 1;
      });

      const absenceDays = Object.entries(dayBreakdown)
        .filter(([key]) => key !== "regular_work")
        .reduce((sum, [, count]) => sum + Number(count || 0), 0);
      const regularWorkDays = dayBreakdown.regular_work ?? Math.max(0, businessDayKeys.length - absenceDays);
      const balance = balanceByUserId.get(userId) ?? {
        annualLeaveInitialDays: 0,
        annualLeaveUsedDays: 0,
        annualLeaveRemainingDays: 0,
        sickLeaveInitialDays: 0,
        sickLeaveUsedDays: 0,
        sickLeaveRemainingDays: 0,
      };
      const fullName = normalizeText(user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" "));

      return {
        userId,
        userLabel: fullName || normalizeText(user.email) || "Korisnik",
        businessDayCount: businessDayKeys.length,
        regularWorkDays,
        absenceDays,
        dayBreakdown,
        annualLeaveInitialDays: balance.annualLeaveInitialDays,
        annualLeaveUsedDays: balance.annualLeaveUsedDays,
        annualLeaveRemainingDays: balance.annualLeaveRemainingDays,
        sickLeaveInitialDays: balance.sickLeaveInitialDays,
        sickLeaveUsedDays: balance.sickLeaveUsedDays,
        sickLeaveRemainingDays: balance.sickLeaveRemainingDays,
        assignedWorkOrderCount: workOrderCountsByUserId.get(userId) ?? 0,
      };
    })
    .sort((left, right) => String(left.userLabel || "").localeCompare(String(right.userLabel || ""), "hr", { sensitivity: "base" }));
}

export function createDocumentTemplate(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const organizationId = requireText(input.organizationId, "Organizacija");
  const sampleCompanyId = normalizeId(input.sampleCompanyId);
  const sampleLocationId = normalizeId(input.sampleLocationId);

  if (sampleCompanyId && !(state.companies ?? []).some((item) => item.id === sampleCompanyId)) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  if (sampleLocationId) {
    const belongsToCompany = (state.locations ?? []).some((item) => (
      item.id === sampleLocationId
      && (!sampleCompanyId || item.companyId === sampleCompanyId)
    ));

    if (!belongsToCompany) {
      throw new Error("Odabrana lokacija ne pripada tvrtki.");
    }
  }

  const legalFrameworkIds = normalizeIdList(input.selectedLegalFrameworkIds)
    .filter((entryId) => (state.legalFrameworks ?? []).some((item) => (
      String(item.id) === String(entryId)
      && String(item.organizationId) === String(organizationId)
    )));

  return {
    id: createId(),
    organizationId,
    title: requireText(input.title, "Naziv templatea"),
    useAi: normalizeBoolean(
      input.useAi ?? input.useAI ?? input.useNexAi ?? input.nexAiEnabled ?? input.aiEnabled ?? input.ai_enabled,
      false,
    ),
    documentType: normalizeDocumentTemplateType(input.documentType),
    status: normalizeDocumentTemplateStatus(input.status),
    description: normalizeText(input.description),
    outputFileName: normalizeText(input.outputFileName) || "zapisnik-template",
    sampleCompanyId,
    sampleLocationId,
    selectedLegalFrameworkIds: legalFrameworkIds,
    customFields: normalizeDocumentTemplateFields(input.customFields),
    equipmentItems: normalizeDocumentTemplateEquipmentItems(input.equipmentItems),
    sections: normalizeDocumentTemplateSections(input.sections),
    referenceDocument: normalizeDocumentTemplateReferenceDocument(input.referenceDocument),
    createdByUserId: normalizeText(input.createdByUserId),
    createdByLabel: normalizeText(input.createdByLabel),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateDocumentTemplate(current, patch, state, now = isoNow) {
  const sampleCompanyId = hasOwn(patch, "sampleCompanyId")
    ? normalizeId(patch.sampleCompanyId)
    : normalizeId(current.sampleCompanyId);
  const sampleLocationId = hasOwn(patch, "sampleLocationId")
    ? normalizeId(patch.sampleLocationId)
    : normalizeId(current.sampleLocationId);

  if (sampleCompanyId && !(state.companies ?? []).some((item) => item.id === sampleCompanyId)) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  if (sampleLocationId) {
    const belongsToCompany = (state.locations ?? []).some((item) => (
      item.id === sampleLocationId
      && (!sampleCompanyId || item.companyId === sampleCompanyId)
    ));

    if (!belongsToCompany) {
      throw new Error("Odabrana lokacija ne pripada tvrtki.");
    }
  }

  const selectedLegalFrameworkIds = hasOwn(patch, "selectedLegalFrameworkIds")
    ? normalizeIdList(patch.selectedLegalFrameworkIds).filter((entryId) => (state.legalFrameworks ?? []).some((item) => (
      String(item.id) === String(entryId)
      && String(item.organizationId) === String(current.organizationId)
    )))
    : normalizeIdList(current.selectedLegalFrameworkIds);
  const hasUseAiPatch = ["useAi", "useAI", "useNexAi", "nexAiEnabled", "aiEnabled", "ai_enabled"]
    .some((key) => hasOwn(patch, key));
  const nextUseAi = hasUseAiPatch
    ? normalizeBoolean(
      patch.useAi ?? patch.useAI ?? patch.useNexAi ?? patch.nexAiEnabled ?? patch.aiEnabled ?? patch.ai_enabled,
      false,
    )
    : normalizeBoolean(
      current.useAi ?? current.useAI ?? current.useNexAi ?? current.nexAiEnabled ?? current.aiEnabled ?? current.ai_enabled,
      false,
    );

  return {
    ...current,
    title: hasOwn(patch, "title") ? requireText(patch.title, "Naziv templatea") : current.title,
    useAi: nextUseAi,
    documentType: hasOwn(patch, "documentType") ? normalizeDocumentTemplateType(patch.documentType) : current.documentType,
    status: hasOwn(patch, "status") ? normalizeDocumentTemplateStatus(patch.status) : current.status,
    description: hasOwn(patch, "description") ? normalizeText(patch.description) : current.description,
    outputFileName: hasOwn(patch, "outputFileName")
      ? (normalizeText(patch.outputFileName) || current.outputFileName)
      : current.outputFileName,
    sampleCompanyId,
    sampleLocationId,
    selectedLegalFrameworkIds,
    customFields: hasOwn(patch, "customFields")
      ? normalizeDocumentTemplateFields(patch.customFields)
      : cloneJsonArray(current.customFields),
    equipmentItems: hasOwn(patch, "equipmentItems")
      ? normalizeDocumentTemplateEquipmentItems(patch.equipmentItems)
      : cloneJsonArray(current.equipmentItems),
    sections: hasOwn(patch, "sections")
      ? normalizeDocumentTemplateSections(patch.sections)
      : cloneJsonArray(current.sections),
    referenceDocument: hasOwn(patch, "referenceDocument")
      ? normalizeDocumentTemplateReferenceDocument(patch.referenceDocument, current.referenceDocument)
      : normalizeDocumentTemplateReferenceDocument(current.referenceDocument),
    createdByUserId: hasOwn(patch, "createdByUserId") ? normalizeText(patch.createdByUserId) : current.createdByUserId,
    createdByLabel: hasOwn(patch, "createdByLabel") ? normalizeText(patch.createdByLabel) : current.createdByLabel,
    updatedAt: now(),
  };
}

export function filterDocumentTemplates(
  items,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return (items ?? []).filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.documentType,
      item.description,
      item.outputFileName,
      item.createdByLabel,
      ...(item.customFields ?? []).flatMap((field) => [
        field.label,
        field.wordLabel,
        field.key,
        field.defaultValue,
        field.helpText,
        field.source,
        field.toggleTrueLabel,
        field.toggleFalseLabel,
        field.toggleTrueText,
        field.toggleFalseText,
        ...(field.columns ?? []),
      ]),
      ...(item.equipmentItems ?? []).flatMap((equipment) => [equipment.name, equipment.code, equipment.note]),
      ...(item.sections ?? []).flatMap((section) => [section.title, section.body, ...(section.columns ?? [])]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortDocumentTemplates(items) {
  return [...(items ?? [])].sort((left, right) => {
    const leftRank = DOCUMENT_TEMPLATE_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = DOCUMENT_TEMPLATE_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

function resolveCompanySnapshot(company) {
  return company
    ? {
      companyId: company.id,
      companyName: company.name,
      companyOib: company.oib,
      headquarters: company.headquarters,
      contractType: company.contractType,
    }
    : {
      companyId: "",
      companyName: "",
      companyOib: "",
      headquarters: "",
      contractType: "",
    };
}

function resolveLocationSnapshot(location) {
  return location
    ? {
      locationId: location.id,
      locationName: location.name,
      coordinates: location.coordinates,
      region: location.region,
    }
    : {
      locationId: "",
      locationName: "",
      coordinates: "",
      region: "",
    };
}

function hydrateWorkOrderCore(base, company, location) {
  const executors = hasOwn(base ?? {}, "executors")
    ? normalizeWorkOrderExecutors(base?.executors)
    : normalizeWorkOrderExecutors(base?.executors, [base?.executor1, base?.executor2]);
  const serviceItems = hasOwn(base ?? {}, "serviceItems")
    ? getWorkOrderServiceItems(base)
    : getWorkOrderServiceItems(base);
  const measurementSheet = normalizeWorkOrderMeasurementSheet(base?.measurementSheet);
  const locationSnapshot = resolveLocationSnapshot(location);
  const companySnapshot = resolveCompanySnapshot(company);
  const contractType = hasOwn(base ?? {}, "contractType")
    ? normalizeText(base?.contractType)
    : companySnapshot.contractType;
  const trainingContext = {
    name: normalizeText(base?.trainingContext?.name),
    role: normalizeText(base?.trainingContext?.role),
    phone: normalizeText(base?.trainingContext?.phone),
    email: normalizeText(base?.trainingContext?.email),
  };

  return {
    ...base,
    executor1: executors[0] ?? "",
    executor2: executors[1] ?? "",
    executors,
    measurementSheet,
    serviceItems,
    trainingContext,
    serviceLine: serviceItems.length > 0
      ? serviceItems.map((item) => item.name || item.serviceCode).filter(Boolean).join(" · ")
      : normalizeText(base?.serviceLine),
    ...companySnapshot,
    contractType,
    ...locationSnapshot,
    locationName: locationSnapshot.locationName || normalizeText(base?.locationName),
    coordinates: locationSnapshot.coordinates || normalizeText(base?.coordinates),
    region: locationSnapshot.region || normalizeText(base?.region),
  };
}

export function getWorkOrderExecutors(workOrder = {}) {
  return normalizeWorkOrderExecutors(workOrder?.executors, [workOrder?.executor1, workOrder?.executor2]);
}

export function createWorkOrder(
  input,
  state,
  createId = () => crypto.randomUUID(),
  workOrderNumber = null,
  now = isoNow,
) {
  const companyId = requireText(input.companyId, "Tvrtka");
  const company = state.companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const requestedLocationId = normalizeId(input.locationId);
  const location = requestedLocationId
    ? state.locations.find((item) => item.id === requestedLocationId && item.companyId === companyId)
    : null;

  if (requestedLocationId && !location) {
    throw new Error("Lokacija ne pripada odabranoj tvrtki.");
  }

  const selectedContact = selectLocationContact(location, input.contactSlot);
  const timestamp = now();
  const serviceItems = hasOwn(input, "serviceItems")
    ? normalizeWorkOrderServiceItemsInput(input.serviceItems, state, [], state.activeOrganizationId || input.organizationId || "")
    : [];

  return hydrateWorkOrderCore({
    id: createId(),
    workOrderNumber,
    status: normalizeWorkOrderStatus(input.status),
    openedDate: normalizeOptionalDate(input.openedDate) ?? timestamp.slice(0, 10),
    dueDate: normalizeOptionalDate(input.dueDate),
    executionDate: normalizeOptionalDate(input.executionDate),
    invoiceNote: normalizeText(input.invoiceNote),
    invoiceDate: normalizeOptionalDate(input.invoiceDate),
    weight: normalizeText(input.weight),
    completedBy: normalizeText(input.completedBy),
    description: normalizeText(input.description),
    linkReference: normalizeText(input.linkReference),
    teamLabel: normalizeText(input.teamLabel),
    contractType: normalizeText(input.contractType) || company.contractType,
    executors: resolveWorkOrderExecutorsInput(input),
    measurementSheet: normalizeWorkOrderMeasurementSheet(input.measurementSheet),
    priority: normalizePriority(input.priority),
    tagText: normalizeText(input.tagText),
    contactSlot: selectedContact.slot,
    contactName: normalizeText(input.contactName) || selectedContact.name,
    contactPhone: normalizeText(input.contactPhone) || selectedContact.phone,
    contactEmail: normalizeText(input.contactEmail) || selectedContact.email,
    serviceItems,
    trainingContext: {
      name: normalizeText(input.trainingContext?.name),
      role: normalizeText(input.trainingContext?.role),
      phone: normalizeText(input.trainingContext?.phone),
      email: normalizeText(input.trainingContext?.email),
    },
    serviceLine: serviceItems.length > 0
      ? serviceItems.map((item) => item.name || item.serviceCode).filter(Boolean).join(" · ")
      : normalizeText(input.serviceLine),
    department: normalizeText(input.department),
    createdAt: timestamp,
    updatedAt: timestamp,
  }, company, location);
}

export function updateWorkOrder(current, patch, state, now = isoNow) {
  const companyId = hasOwn(patch, "companyId") ? requireText(patch.companyId, "Tvrtka") : current.companyId;
  const company = state.companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const locationWasExplicitlyChanged = hasOwn(patch, "locationId");
  let locationId = locationWasExplicitlyChanged ? normalizeId(patch.locationId) : current.locationId;

  if (locationId) {
    const belongsToCompany = state.locations.some((item) => item.id === locationId && item.companyId === companyId);

    if (!belongsToCompany) {
      if (locationWasExplicitlyChanged) {
        throw new Error("Lokacija ne pripada odabranoj tvrtki.");
      }

      locationId = "";
    }
  }

  const location = locationId
    ? state.locations.find((item) => item.id === locationId && item.companyId === companyId)
    : null;

  const companyChanged = companyId !== current.companyId;
  const locationChanged = locationId !== current.locationId || companyChanged;
  const selectedContact = (locationChanged || hasOwn(patch, "contactSlot"))
    ? selectLocationContact(location, hasOwn(patch, "contactSlot") ? patch.contactSlot : current.contactSlot)
    : null;
  const nextServiceItems = hasOwn(patch, "serviceItems")
    ? normalizeWorkOrderServiceItemsInput(
      patch.serviceItems,
      state,
      getWorkOrderServiceItems(current),
      state.activeOrganizationId || patch.organizationId || current.organizationId || "",
    )
    : getWorkOrderServiceItems(current);

  const next = hydrateWorkOrderCore({
    ...current,
    status: hasOwn(patch, "status") ? normalizeWorkOrderStatus(patch.status) : current.status,
    openedDate: hasOwn(patch, "openedDate") ? (normalizeOptionalDate(patch.openedDate) ?? current.openedDate) : current.openedDate,
    dueDate: hasOwn(patch, "dueDate") ? normalizeOptionalDate(patch.dueDate) : current.dueDate,
    executionDate: hasOwn(patch, "executionDate") ? normalizeOptionalDate(patch.executionDate) : current.executionDate,
    invoiceNote: hasOwn(patch, "invoiceNote") ? normalizeText(patch.invoiceNote) : current.invoiceNote,
    invoiceDate: hasOwn(patch, "invoiceDate") ? normalizeOptionalDate(patch.invoiceDate) : current.invoiceDate,
    weight: hasOwn(patch, "weight") ? normalizeText(patch.weight) : current.weight,
    completedBy: hasOwn(patch, "completedBy") ? normalizeText(patch.completedBy) : current.completedBy,
    description: hasOwn(patch, "description") ? normalizeText(patch.description) : current.description,
    linkReference: hasOwn(patch, "linkReference") ? normalizeText(patch.linkReference) : current.linkReference,
    teamLabel: hasOwn(patch, "teamLabel") ? normalizeText(patch.teamLabel) : current.teamLabel,
    contractType: hasOwn(patch, "contractType")
      ? normalizeText(patch.contractType)
      : companyChanged
        ? company.contractType
        : current.contractType,
    executors: resolveWorkOrderExecutorsInput(patch, current),
    measurementSheet: hasOwn(patch, "measurementSheet")
      ? normalizeWorkOrderMeasurementSheet(patch.measurementSheet)
      : current.measurementSheet,
    priority: hasOwn(patch, "priority") ? normalizePriority(patch.priority) : current.priority,
    tagText: hasOwn(patch, "tagText") ? normalizeText(patch.tagText) : current.tagText,
    coordinates: hasOwn(patch, "coordinates")
      ? normalizeText(patch.coordinates)
      : locationChanged
        ? (location?.coordinates ?? "")
        : current.coordinates,
    region: hasOwn(patch, "region")
      ? normalizeText(patch.region)
      : locationChanged
        ? (location?.region ?? "")
        : current.region,
    contactSlot: selectedContact ? selectedContact.slot : current.contactSlot,
    contactName: hasOwn(patch, "contactName")
      ? normalizeText(patch.contactName)
      : selectedContact
        ? selectedContact.name
        : current.contactName,
    contactPhone: hasOwn(patch, "contactPhone")
      ? normalizeText(patch.contactPhone)
      : selectedContact
        ? selectedContact.phone
        : current.contactPhone,
    contactEmail: hasOwn(patch, "contactEmail")
      ? normalizeText(patch.contactEmail)
      : selectedContact
        ? selectedContact.email
        : current.contactEmail,
    serviceItems: nextServiceItems,
    trainingContext: hasOwn(patch, "trainingContext")
      ? {
        name: normalizeText(patch.trainingContext?.name),
        role: normalizeText(patch.trainingContext?.role),
        phone: normalizeText(patch.trainingContext?.phone),
        email: normalizeText(patch.trainingContext?.email),
      }
      : {
        name: normalizeText(current.trainingContext?.name),
        role: normalizeText(current.trainingContext?.role),
        phone: normalizeText(current.trainingContext?.phone),
        email: normalizeText(current.trainingContext?.email),
      },
    serviceLine: hasOwn(patch, "serviceItems")
      ? nextServiceItems.map((item) => item.name || item.serviceCode).filter(Boolean).join(" · ")
      : hasOwn(patch, "serviceLine")
        ? normalizeText(patch.serviceLine)
        : current.serviceLine,
    department: hasOwn(patch, "department") ? normalizeText(patch.department) : current.department,
    updatedAt: now(),
  }, company, location);

  return next;
}

function normalizeFieldInquiryStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "next_week_job") {
    return "next_week";
  }
  const match = FIELD_INQUIRY_STATUS_OPTIONS.find((option) => option.value === normalized);
  return match?.value ?? "inquiry";
}

function normalizeFieldInquiryTime(value = "") {
  const raw = normalizeText(value);
  const match = raw.match(/^([01]?\d|2[0-3])[:.]?([0-5]\d)$/);
  if (!match) {
    return raw.slice(0, 16);
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function resolveFieldInquiryUsers(values = [], state = {}) {
  const ids = normalizeIdList(values);
  const usersById = new Map((state.users ?? []).map((user) => [String(user.id), user]));
  const labels = ids.map((id) => {
    const user = usersById.get(String(id));
    return normalizeText(user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || user?.username || id);
  }).filter(Boolean);

  return {
    assignedUserIds: ids,
    assignedUserLabels: labels,
  };
}

function hydrateFieldInquiryCore({
  current = {},
  input = {},
  state = {},
  timestamp = isoNow(),
} = {}) {
  const requestedWorkOrderId = hasOwn(input, "workOrderId")
    ? normalizeId(input.workOrderId)
    : normalizeId(current.workOrderId);
  const linkedWorkOrder = requestedWorkOrderId
    ? (state.workOrders ?? []).find((item) => String(item.id) === String(requestedWorkOrderId))
    : null;

  if (requestedWorkOrderId && !linkedWorkOrder) {
    throw new Error("Povezani RN nije pronaden.");
  }

  const requestedLocationId = hasOwn(input, "locationId")
    ? normalizeId(input.locationId)
    : normalizeId(current.locationId);
  const linkedLocation = requestedLocationId
    ? (state.locations ?? []).find((item) => String(item.id) === String(requestedLocationId))
    : null;

  if (requestedLocationId && !linkedLocation) {
    throw new Error("Lokacija nije pronadena.");
  }

  const requestedCompanyId = hasOwn(input, "companyId")
    ? normalizeId(input.companyId)
    : normalizeId(current.companyId);
  const inferredCompanyId = linkedWorkOrder?.companyId || linkedLocation?.companyId || requestedCompanyId;
  const linkedCompany = inferredCompanyId
    ? (state.companies ?? []).find((item) => String(item.id) === String(inferredCompanyId))
    : null;

  if (requestedCompanyId && !linkedCompany) {
    throw new Error("Tvrtka nije pronadena.");
  }

  if (linkedLocation && linkedCompany && String(linkedLocation.companyId) !== String(linkedCompany.id)) {
    throw new Error("Lokacija ne pripada odabranoj tvrtki.");
  }

  const userSnapshot = hasOwn(input, "assignedUserIds")
    ? (() => {
      const resolved = resolveFieldInquiryUsers(input.assignedUserIds, state);
      const fallbackLabels = Array.isArray(input.assignedUserLabels)
        ? input.assignedUserLabels.map((value) => normalizeText(value)).filter(Boolean)
        : [];
      return {
        assignedUserIds: resolved.assignedUserIds,
        assignedUserLabels: resolved.assignedUserLabels.length > 0 ? resolved.assignedUserLabels : fallbackLabels,
      };
    })()
    : {
      assignedUserIds: normalizeIdList(current.assignedUserIds),
      assignedUserLabels: Array.isArray(current.assignedUserLabels)
        ? current.assignedUserLabels.map((value) => normalizeText(value)).filter(Boolean)
        : [],
    };
  const vehicleId = hasOwn(input, "vehicleId") ? normalizeId(input.vehicleId) : normalizeId(current.vehicleId);
  const vehicle = vehicleId
    ? (state.vehicles ?? []).find((item) => String(item.id) === String(vehicleId))
    : null;

  if (vehicleId && !vehicle) {
    throw new Error("Vozilo nije pronadeno.");
  }

  const title = hasOwn(input, "title")
    ? requireText(input.title, "Naziv upita")
    : requireText(current.title, "Naziv upita");

  return {
    ...current,
    organizationId: hasOwn(input, "organizationId")
      ? requireText(input.organizationId, "Organizacija")
      : requireText(current.organizationId, "Organizacija"),
    title,
    status: hasOwn(input, "status") ? normalizeFieldInquiryStatus(input.status) : normalizeFieldInquiryStatus(current.status),
    plannedDate: hasOwn(input, "plannedDate") ? normalizeOptionalDate(input.plannedDate) : normalizeOptionalDate(current.plannedDate),
    timeFrom: hasOwn(input, "timeFrom") ? normalizeFieldInquiryTime(input.timeFrom) : normalizeFieldInquiryTime(current.timeFrom),
    timeTo: hasOwn(input, "timeTo") ? normalizeFieldInquiryTime(input.timeTo) : normalizeFieldInquiryTime(current.timeTo),
    companyId: linkedCompany?.id ?? "",
    companyName: linkedCompany?.name ?? normalizeText(input.companyName ?? current.companyName),
    locationId: linkedLocation?.id ?? "",
    locationName: linkedLocation?.name ?? normalizeText(input.locationName ?? current.locationName),
    workOrderId: linkedWorkOrder?.id ?? "",
    workOrderNumber: linkedWorkOrder?.workOrderNumber ?? normalizeText(input.workOrderNumber ?? current.workOrderNumber),
    contactName: hasOwn(input, "contactName") ? normalizeText(input.contactName) : normalizeText(current.contactName),
    contactPhone: hasOwn(input, "contactPhone") ? normalizeText(input.contactPhone) : normalizeText(current.contactPhone),
    serviceLine: hasOwn(input, "serviceLine") ? normalizeText(input.serviceLine) : normalizeText(current.serviceLine),
    note: hasOwn(input, "note") ? normalizeText(input.note) : normalizeText(current.note),
    documents: hasOwn(input, "documents")
      ? normalizeAttachmentDocuments(input.documents)
      : normalizeAttachmentDocuments(current.documents ?? []),
    assignedUserIds: userSnapshot.assignedUserIds,
    assignedUserLabels: userSnapshot.assignedUserLabels,
    vehicleId: vehicle?.id ?? "",
    vehicleLabel: vehicle ? normalizeText([vehicle.licensePlate, vehicle.name, vehicle.model].filter(Boolean).join(" - ")) : normalizeText(input.vehicleLabel ?? current.vehicleLabel),
    createdByUserId: normalizeText(current.createdByUserId || input.createdByUserId),
    createdByLabel: normalizeText(current.createdByLabel || input.createdByLabel),
    convertedWorkOrderId: normalizeId(current.convertedWorkOrderId || input.convertedWorkOrderId),
    updatedAt: timestamp,
  };
}

export function createFieldInquiry(input, state, createId = () => crypto.randomUUID(), now = isoNow) {
  const timestamp = now();
  return {
    ...hydrateFieldInquiryCore({
      input,
      state,
      timestamp,
    }),
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateFieldInquiry(current, patch, state, now = isoNow) {
  return hydrateFieldInquiryCore({
    current,
    input: patch,
    state,
    timestamp: now(),
  });
}

export function filterFieldInquiries(items, { query = "", status = "all" } = {}) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  return (items ?? []).filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const haystack = [
      item.title,
      item.companyName,
      item.locationName,
      item.workOrderNumber,
      item.contactName,
      item.contactPhone,
      item.serviceLine,
      item.note,
      ...(item.documents ?? []).flatMap((document) => [
        document.fileName,
        document.description,
        document.documentCategory,
      ]),
      ...(item.assignedUserLabels ?? []),
      item.vehicleLabel,
    ].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function sortFieldInquiries(items) {
  const statusRank = new Map(FIELD_INQUIRY_STATUS_OPTIONS.map((option, index) => [option.value, index]));
  return [...(items ?? [])].sort((left, right) => {
    const leftDate = left.plannedDate || "9999-12-31";
    const rightDate = right.plannedDate || "9999-12-31";
    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }
    const leftRank = statusRank.get(left.status) ?? 99;
    const rightRank = statusRank.get(right.status) ?? 99;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function createReminder(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const reminder = hydrateReminderCore({
    state,
    input,
    timestamp,
  });

  return {
    ...reminder,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateReminder(current, patch, state, now = isoNow) {
  return hydrateReminderCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function filterReminders(
  reminders,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return reminders.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.note,
      item.companyName,
      item.locationName,
      item.workOrderNumber,
      item.createdByLabel,
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortReminders(reminders) {
  return [...reminders].sort((left, right) => {
    const leftRank = REMINDER_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = REMINDER_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }

    if (left.dueDate && !right.dueDate) {
      return -1;
    }

    if (!left.dueDate && right.dueDate) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function createTodoTask(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const task = hydrateTodoTaskCore({
    state,
    input,
    timestamp,
  });

  return {
    ...task,
    id: createId(),
    comments: [],
    commentCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateTodoTask(current, patch, state, now = isoNow) {
  return hydrateTodoTaskCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createOffer(
  input,
  state,
  createId = () => crypto.randomUUID(),
  numberParts = null,
  now = isoNow,
) {
  const timestamp = now();
  const resolvedNumberParts = numberParts ?? nextOfferNumber(state.offers ?? [], {
    year: Number(timestamp.slice(0, 4)),
    initials: input.createdByLabel ?? "",
  });
  const offer = hydrateOfferCore({
    state,
    input,
    timestamp,
    offerNumber: resolvedNumberParts.offerNumber,
    offerYear: resolvedNumberParts.offerYear,
    offerSequence: resolvedNumberParts.offerSequence,
    offerInitials: resolvedNumberParts.offerInitials,
  });

  return {
    ...offer,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateOffer(current, patch, state, now = isoNow) {
  return hydrateOfferCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createPurchaseOrder(
  input,
  state,
  createId = () => crypto.randomUUID(),
  numberParts = null,
  now = isoNow,
) {
  const timestamp = now();
  const resolvedNumberParts = numberParts ?? nextPurchaseOrderNumber(state.purchaseOrders ?? [], {
    year: Number(timestamp.slice(0, 4)),
  });
  const purchaseOrder = hydratePurchaseOrderCore({
    state,
    input,
    timestamp,
    purchaseOrderNumber: resolvedNumberParts.purchaseOrderNumber,
    purchaseOrderYear: resolvedNumberParts.purchaseOrderYear,
    purchaseOrderSequence: resolvedNumberParts.purchaseOrderSequence,
  });

  return {
    ...purchaseOrder,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updatePurchaseOrder(current, patch, state, now = isoNow) {
  return hydratePurchaseOrderCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createPublicProcurement(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const item = hydratePublicProcurementCore({
    state,
    input,
    timestamp,
  });

  return {
    ...item,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updatePublicProcurement(current, patch, state, now = isoNow) {
  return hydratePublicProcurementCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createRiskAssessment(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const item = hydrateRiskAssessmentCore({
    state,
    input,
    timestamp,
    assessmentNumber: nextRiskAssessmentNumber(state.riskAssessments ?? [], timestamp),
  });

  return {
    ...item,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateRiskAssessment(current, patch, state, now = isoNow) {
  return hydrateRiskAssessmentCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createJob(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const item = hydrateJobCore({
    state,
    input,
    timestamp,
  });

  return {
    ...item,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateJob(current, patch, state, now = isoNow) {
  return hydrateJobCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createContractTemplate(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const template = hydrateContractTemplateCore({
    state,
    input,
    timestamp,
  });

  return {
    ...template,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateContractTemplate(current, patch, state, now = isoNow) {
  return hydrateContractTemplateCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createContract(
  input,
  state,
  createId = () => crypto.randomUUID(),
  numberParts = null,
  now = isoNow,
) {
  const timestamp = now();
  const resolvedNumberParts = numberParts ?? nextContractNumber(state.contracts ?? [], {
    year: Number(timestamp.slice(0, 4)),
  });
  const contract = hydrateContractCore({
    state,
    input,
    timestamp,
    contractNumber: normalizeText(input.contractNumber) || resolvedNumberParts.contractNumber,
  });

  return {
    ...contract,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateContract(current, patch, state, now = isoNow) {
  return hydrateContractCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createDrawingProject(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const project = hydrateDrawingProjectCore({
    state,
    input,
    timestamp,
  });

  return {
    ...project,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateDrawingProject(current, patch, state, now = isoNow) {
  return hydrateDrawingProjectCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createTodoTaskComment(
  currentTask,
  input,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const comment = createTodoTaskCommentCore({
    ...input,
    taskId: currentTask.id,
    organizationId: currentTask.organizationId,
  }, createId, now);
  const nextComments = [...(currentTask.comments ?? []), comment];

  return {
    ...currentTask,
    comments: nextComments,
    commentCount: nextComments.length,
    updatedAt: comment.createdAt,
  };
}

export function filterTodoTasks(
  tasks,
  { query = "", status = "all", scope = "all", userId = "" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedUserId = normalizeText(userId);

  return tasks.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (scope === "assigned" && normalizedUserId && normalizeText(item.assignedToUserId) !== normalizedUserId) {
      return false;
    }

    if (scope === "created" && normalizedUserId && normalizeText(item.createdByUserId) !== normalizedUserId) {
      return false;
    }

    if (scope === "invited" && normalizedUserId && !normalizeIdList(item.invitedUserIds).includes(normalizedUserId)) {
      return false;
    }

    if (scope === "unassigned" && normalizeText(item.assignedToUserId)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.message,
      item.companyName,
      item.headquarters,
      item.locationName,
      item.workOrderNumber,
      item.status,
      item.createdByLabel,
      item.assignedToLabel,
      ...(item.invitedUserLabels ?? []),
      ...(item.comments ?? []).map((comment) => comment.message),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortTodoTasks(tasks) {
  return [...tasks].sort((left, right) => {
    const leftDone = left.status === "done";
    const rightDone = right.status === "done";

    if (leftDone !== rightDone) {
      return leftDone ? 1 : -1;
    }

    const leftRank = TODO_TASK_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = TODO_TASK_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftPriorityRank = PRIORITY_RANK[left.priority] ?? Number.MAX_SAFE_INTEGER;
    const rightPriorityRank = PRIORITY_RANK[right.priority] ?? Number.MAX_SAFE_INTEGER;

    if (leftPriorityRank !== rightPriorityRank) {
      return leftPriorityRank - rightPriorityRank;
    }

    if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }

    if (left.dueDate && !right.dueDate) {
      return -1;
    }

    if (!left.dueDate && right.dueDate) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function filterOffers(
  offers,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return offers.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.offerNumber,
      item.internalDocumentNumber,
      item.externalDocumentNumber,
      item.title,
      item.companyName,
      item.locationName,
      ...(item.selectedLocationNames ?? []),
      item.contactName,
      item.serviceLine,
      item.createdByLabel,
      item.note,
      item.offerDirection,
      ...(item.documents ?? []).map((entry) => entry.fileName),
      ...(item.documents ?? []).map((entry) => entry.documentCategory),
      ...(item.items ?? []).map((entry) => entry.description),
      ...(item.items ?? []).map((entry) => entry.serviceCode),
      ...(item.items ?? []).flatMap((entry) => (entry.breakdowns ?? []).map((detail) => detail.label)),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function filterPurchaseOrders(
  purchaseOrders,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return purchaseOrders.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.purchaseOrderNumber,
      item.internalDocumentNumber,
      item.externalDocumentNumber,
      item.title,
      item.companyName,
      item.locationName,
      ...(item.selectedLocationNames ?? []),
      item.contactName,
      item.serviceLine,
      item.createdByLabel,
      item.note,
      item.orderDirection,
      ...(item.items ?? []).map((entry) => entry.description),
      ...(item.items ?? []).map((entry) => entry.serviceCode),
      ...(item.items ?? []).flatMap((entry) => (entry.breakdowns ?? []).map((detail) => detail.label)),
      ...(item.documents ?? []).map((document) => document.fileName),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function filterPublicProcurements(
  procurements,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedStatus = normalizePublicProcurementStatus(status, "all");

  return (procurements ?? []).filter((item) => {
    if (status !== "all" && normalizePublicProcurementStatus(item.status) !== normalizedStatus) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.referenceNumber,
      item.title,
      item.companyName,
      item.companyOib,
      item.headquarters,
      item.amount,
      item.documentationUrl,
      item.note,
      item.createdByLabel,
      ...(item.documents ?? []).map((entry) => entry.fileName),
      ...(item.documents ?? []).map((entry) => entry.description),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function filterRiskAssessments(
  riskAssessments,
  { query = "", status = "all", companyId = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedCompanyId = normalizeText(companyId);

  return (riskAssessments ?? []).filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (normalizedCompanyId && normalizedCompanyId !== "all" && String(item.companyId) !== normalizedCompanyId) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.assessmentNumber,
      item.title,
      item.companyName,
      item.companyOib,
      item.headquarters,
      item.locationName,
      item.workOrderNumber,
      item.assessmentDate,
      item.completionDate,
      item.teamLead,
      item.collaborators,
      ...(item.teamLeadUserIds ?? []),
      ...(item.collaboratorUserIds ?? []),
      ...Object.values(item.employerData ?? {}),
      ...(item.employerData?.authorizedPersons ?? []).flatMap((entry) => [entry.fullName, entry.oib, entry.jobTitle]),
      ...(item.employerData?.companyCollaborators ?? []).flatMap((entry) => [entry.fullName, entry.title, entry.oib, entry.jobTitle]),
      item.employerData?.znrAuthorizationDocument?.fileName,
      ...(item.employerData?.workplaceJobs ?? []).flatMap((entry) => [entry.jobTitle, entry.maleCount, entry.femaleCount, entry.note]),
      ...(item.employerData?.assessmentMemberUserIds ?? []),
      ...(item.employerData?.selectedLocationIds ?? []),
      normalizeRiskAssessmentRichTextSearch(item.intro),
      normalizeRiskAssessmentRichTextSearch(item.workProcessDescription),
      normalizeRiskAssessmentRichTextSearch(item.generalData),
      normalizeRiskAssessmentRichTextSearch(item.computerWorkplaces),
      normalizeRiskAssessmentRichTextSearch(item.basicRules),
      normalizeRiskAssessmentRichTextSearch(item.specialRules),
      normalizeRiskAssessmentRichTextSearch(item.omissionsBasic),
      normalizeRiskAssessmentRichTextSearch(item.omissionsSpecial),
      normalizeRiskAssessmentRichTextSearch(item.conclusion),
      normalizeRiskAssessmentRichTextSearch(item.biologicalHazards),
      item.clientNote,
      item.clientJobInputEnabled ? "klijentski unos omogucen portal radna mjesta" : "",
      ...(item.measures ?? []).flatMap((entry) => [entry.measure, entry.responsiblePerson, entry.deadline]),
      ...(item.biologicalRisks ?? []).flatMap((entry) => [
        entry.agentName,
        entry.category,
        entry.group,
        entry.classification,
        ...(entry.noteCodes ?? []),
        entry.source,
        entry.possibleConsequences,
        entry.note,
        entry.existingMeasures,
        ...(entry.usedInJobIds ?? []),
      ]),
      ...(item.organizationUnits ?? []).flatMap((entry) => [
        entry.name,
        entry.shortDescription,
        entry.description,
        entry.detailedDescription,
        entry.responsiblePerson,
        entry.workerCount,
        entry.maleWorkerCount,
        entry.femaleWorkerCount,
        entry.note,
      ]),
      ...(item.jobs ?? []).flatMap((entry) => [
        entry.jobTitle,
        entry.shortDescription,
        entry.detailedDescription,
        entry.workplaceDescription,
        entry.workEnvironment,
        entry.workplace,
        entry.workerCount,
        entry.alcoholLimit,
        entry.description,
        entry.tasks,
        entry.specialWorkReason,
        entry.requiredQualification,
        entry.workOrganization,
        entry.workSchedule,
        entry.workSubstances,
        entry.chemicalSubstances,
        entry.biologicalHazards,
        entry.workEquipment,
        entry.toolsAndMachines,
        entry.workplaces,
        ...(entry.workplaceOptions ?? []),
        ...(entry.organizationOptions ?? []),
        ...(entry.bodyPositions ?? []),
        ...(entry.importantFunctions ?? []),
        ...(entry.workConditions ?? []),
        ...(entry.toolsAndMachinesOptions ?? []),
        ...(entry.chemicalSubstanceOptions ?? []),
        ...(entry.biologicalHazardOptions ?? []),
        ...(entry.purPoints ?? []),
        entry.workplaceArrangement,
        entry.harmfulSources,
        entry.psychosocialLevel,
        entry.psychosocialText,
        entry.trainings,
        entry.medicalExams,
        entry.ppeText,
        entry.clientInput?.workerCount,
        entry.clientInput?.workplace,
        entry.clientInput?.workSchedule,
        entry.clientInput?.workOrganization,
        entry.clientInput?.description,
        entry.clientInput?.tasks,
        ...(entry.clientInput?.workplaceOptions ?? []),
        ...(entry.clientInput?.organizationOptions ?? []),
        ...(entry.clientInput?.bodyPositions ?? []),
        ...(entry.clientInput?.importantFunctions ?? []),
        ...(entry.clientInput?.workConditions ?? []),
        ...(entry.clientInput?.purPoints ?? []),
        entry.clientInput?.specialWorkReason,
        entry.clientInput?.trainings,
        entry.clientInput?.medicalExams,
        entry.clientInput?.toolsAndMachines,
        entry.clientInput?.workEquipment,
        entry.clientInput?.workSubstances,
        entry.clientInput?.workplaces,
        entry.clientInput?.workplaceArrangement,
        entry.clientInput?.harmfulSources,
        entry.clientInput?.ppeText,
        entry.clientInput?.psychosocialLevel,
        entry.clientInput?.psychosocialText,
        entry.clientInput?.armorNotes,
        entry.clientInput?.note,
        entry.clientInput?.submittedByLabel,
        ...(Object.values(entry.eligibility ?? {}).flatMap((eligibility) => [eligibility?.allowed, eligibility?.note])),
        ...(entry.ppeItems ?? []).flatMap((ppe) => [
          ppe.name,
          ppe.category,
          ppe.bodyPart,
          ppe.norm,
          ppe.description,
          ppe.hazardLinks,
          ppe.note,
        ]),
        ...(entry.riskRows ?? []).flatMap((risk) => [
          risk.code,
          risk.topCategory,
          risk.category,
          risk.group,
          risk.hazard,
          risk.description,
          risk.source,
          risk.possibleConsequences,
          risk.probability,
          risk.consequence,
          risk.riskLevel,
          risk.workNote,
          risk.note,
          risk.existingMeasures,
          risk.additionalMeasures,
          risk.measures,
          risk.deadline,
          risk.responsiblePerson,
          risk.controlMethod,
        ]),
      ]),
      ...(item.riskTemplates ?? []).flatMap((entry) => [
        entry.name,
        entry.jobHint,
        ...(entry.riskRows ?? []).map((risk) => risk.hazard),
        ...(entry.ppeItems ?? []).map((ppe) => ppe.name),
      ]),
      ...(item.manualHandling ?? item.manualHandlingItems ?? []).flatMap((entry) => [
        entry.activity,
        entry.loadWeightKg,
        entry.transfersPerHour,
        entry.durationMinutes,
        entry.carryingDistanceMeters,
        entry.verticalLiftCm,
        entry.horizontalReachCm,
        entry.posture,
        entry.gripQuality,
        entry.existingMeasures,
        entry.note,
      ]),
      ...(item.chemicals ?? []).flatMap((entry) => [
        entry.name,
        entry.casNumber,
        entry.ecNumber,
        entry.reachNumber,
        entry.formula,
        entry.iupacName,
        entry.supplier,
        entry.recommendedUse,
        entry.classification,
        ...(entry.signalWords ?? []),
        ...(entry.pictograms ?? []),
        ...(entry.hazardStatements ?? []),
        ...(entry.precautionaryStatements ?? []),
        entry.exposureLimits,
        entry.ppe,
        entry.storage,
        entry.firstAid,
        entry.fireMeasures,
        entry.spillMeasures,
        entry.source,
        entry.sourceFileName,
        entry.stlFileName,
        entry.stlFileType,
        entry.stlTextPreview,
        entry.pubChemCid,
        entry.probability,
        entry.consequence,
        entry.riskLevel,
        entry.officialGviPpm,
        entry.officialGviMgM3,
        entry.officialKgviPpm,
        entry.officialKgviMgM3,
        entry.officialLimitNote,
        entry.officialDirective,
        entry.prilogIiDivision,
        entry.prilogIiVaporGvi,
        entry.prilogIiDustGvi,
        ...(entry.prilogIiHazardCodes ?? []),
        entry.estimatedConsequenceSize,
        entry.note,
      ]),
      item.reportTemplate?.title,
      item.reportTemplate?.description,
      item.reportTemplate?.wordTemplate?.fileName,
      item.reportTemplate?.wordTemplate?.fileType,
      ...(item.reportTemplate?.sections ?? []).flatMap((entry) => [
        entry.title,
        entry.placeholder,
        entry.key,
        entry.note,
      ]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function filterJobs(
  jobs,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedStatus = normalizeText(status);

  return (jobs ?? []).filter((item) => {
    if (normalizedStatus && normalizedStatus !== "all" && item.status !== normalizedStatus) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const environment = item.environment ?? {};
    const conditions = item.conditions ?? {};
    const haystack = [
      item.title,
      item.description,
      item.status,
      environment.machinesText,
      environment.substancesText,
      environment.workplaceText,
      environment.organizationText,
      environment.workTimeMode,
      environment.dailyDuration,
      environment.overtime,
      environment.nightWork,
      environment.breakRest,
      environment.weeklyRest,
      environment.fieldWork,
      environment.remoteWork,
      environment.workRhythm,
      environment.monotony,
      ...(environment.machinesOptions ?? []),
      ...(environment.substancesOptions ?? []),
      ...(environment.workplaceOptions ?? []),
      ...(environment.organizationOptions ?? []),
      ...(conditions.bodyPositions ?? []),
      ...(conditions.importantFunctions ?? []),
      ...(conditions.workConditions ?? []),
      ...(conditions.purPoints ?? []),
      conditions.bodyText,
      conditions.functionsText,
      conditions.conditionsText,
      ...Object.values(conditions.notes ?? {}),
      ...Object.values(item.aiInstructions ?? {}).flatMap((config) => [
        config?.instruction,
        config?.mustInclude,
        config?.avoid,
      ]),
      ...(item.hazards ?? []).flatMap((hazard) => [
        hazard.catalogCode,
        hazard.catalogLabel,
        hazard.category,
        hazard.group,
        hazard.unwantedEvent,
        hazard.probability,
        hazard.consequence,
        hazard.riskLevel,
        hazard.measures,
        hazard.purPoint,
        hazard.ppeText,
        hazard.note,
      ]),
      ...(item.ppeItems ?? []).flatMap((ppe) => [
        ppe.name,
        ppe.category,
        ppe.bodyPart,
        ppe.norm,
        ppe.standardCode,
        ppe.description,
        ppe.hazardLinks,
        ppe.note,
      ]),
      item.createdByLabel,
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function filterContractTemplates(
  templates,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return templates.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.description,
      item.status,
      item.createdByLabel,
      item.referenceDocument?.fileName,
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function filterContracts(
  contracts,
  { query = "", status = "all", companyId = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedCompanyId = normalizeText(companyId);

  return contracts.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (normalizedCompanyId && normalizedCompanyId !== "all" && String(item.companyId) !== normalizedCompanyId) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.contractNumber,
      item.title,
      item.companyName,
      item.companyOib,
      item.headquarters,
      item.representative,
      item.contactEmail,
      item.subject,
      item.scopeSummary,
      item.note,
      item.templateTitle,
      ...(item.linkedOfferNumbers ?? []),
      ...(item.linkedOffers ?? []).flatMap((entry) => [entry.offerNumber, entry.title]),
      ...(item.annexes ?? []).flatMap((entry) => [entry.annexNumber, entry.title, entry.note]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function filterDrawingProjects(
  projects,
  { query = "", status = "all", companyId = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedCompanyId = normalizeText(companyId);

  return (projects ?? []).filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (normalizedCompanyId && normalizedCompanyId !== "all" && String(item.companyId) !== normalizedCompanyId) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.companyName,
      item.companyOib,
      item.locationName,
      item.scaleLabel,
      item.note,
      item.drawingType,
      ...(item.layers ?? []).flatMap((layer) => [layer.name, layer.color]),
      ...(item.referenceDocuments ?? []).map((document) => document.fileName),
      ...(item.elements ?? []).flatMap((element) => [element.type, element.label, element.metadata?.subtitle, element.metadata?.footer]),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortOffers(offers) {
  return [...offers].sort((left, right) => {
    const leftDate = normalizeText(left.offerDate || left.createdAt || left.updatedAt);
    const rightDate = normalizeText(right.offerDate || right.createdAt || right.updatedAt);

    if (leftDate && rightDate && leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }

    if (leftDate && !rightDate) {
      return -1;
    }

    if (!leftDate && rightDate) {
      return 1;
    }

    const leftRank = OFFER_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = OFFER_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return String(left.updatedAt ?? "").localeCompare(String(right.updatedAt ?? ""));
  });
}

export function sortPurchaseOrders(purchaseOrders) {
  return [...purchaseOrders].sort((left, right) => {
    const leftRank = PURCHASE_ORDER_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = PURCHASE_ORDER_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (left.purchaseOrderDate && right.purchaseOrderDate && left.purchaseOrderDate !== right.purchaseOrderDate) {
      return right.purchaseOrderDate.localeCompare(left.purchaseOrderDate);
    }

    if (left.purchaseOrderDate && !right.purchaseOrderDate) {
      return -1;
    }

    if (!left.purchaseOrderDate && right.purchaseOrderDate) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function sortPublicProcurements(procurements) {
  return [...(procurements ?? [])].sort((left, right) => {
    const leftRank = PUBLIC_PROCUREMENT_STATUS_RANK[normalizePublicProcurementStatus(left.status)] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = PUBLIC_PROCUREMENT_STATUS_RANK[normalizePublicProcurementStatus(right.status)] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (left.deadline && right.deadline && left.deadline !== right.deadline) {
      return left.deadline.localeCompare(right.deadline);
    }

    if (left.deadline && !right.deadline) {
      return -1;
    }

    if (!left.deadline && right.deadline) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function sortRiskAssessments(riskAssessments) {
  return [...(riskAssessments ?? [])].sort((left, right) => {
    const leftRank = RISK_ASSESSMENT_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = RISK_ASSESSMENT_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftDate = left.assessmentDate || left.updatedAt || "";
    const rightDate = right.assessmentDate || right.updatedAt || "";

    if (leftDate && rightDate && leftDate !== rightDate) {
      return rightDate.localeCompare(leftDate);
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function sortJobs(jobs) {
  return [...(jobs ?? [])].sort((left, right) => {
    const leftRank = JOB_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = JOB_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function sortContractTemplates(templates) {
  return [...templates].sort((left, right) => {
    const leftRank = CONTRACT_TEMPLATE_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = CONTRACT_TEMPLATE_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function sortContracts(contracts) {
  return [...contracts].sort((left, right) => {
    const leftRank = CONTRACT_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = CONTRACT_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftDate = left.validTo || left.validFrom || left.signedOn || "";
    const rightDate = right.validTo || right.validFrom || right.signedOn || "";

    if (leftDate && rightDate && leftDate !== rightDate) {
      return rightDate.localeCompare(leftDate);
    }

    if (leftDate && !rightDate) {
      return -1;
    }

    if (!leftDate && rightDate) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function sortDrawingProjects(projects) {
  return [...(projects ?? [])].sort((left, right) => {
    const leftRank = DRAWING_PROJECT_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = DRAWING_PROJECT_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function sortVehicleReservations(reservations, nowValue = isoNow()) {
  const nowTimestamp = Date.parse(nowValue);

  return [...(reservations ?? [])].sort((left, right) => {
    const leftActive = isVehicleReservationActive(left, nowValue);
    const rightActive = isVehicleReservationActive(right, nowValue);

    if (leftActive !== rightActive) {
      return leftActive ? -1 : 1;
    }

    const leftUpcoming = Number.isFinite(nowTimestamp) && Date.parse(left?.startAt ?? "") >= nowTimestamp;
    const rightUpcoming = Number.isFinite(nowTimestamp) && Date.parse(right?.startAt ?? "") >= nowTimestamp;

    if (leftUpcoming !== rightUpcoming) {
      return leftUpcoming ? -1 : 1;
    }

    const leftRank = VEHICLE_RESERVATION_STATUS_RANK[normalizeVehicleReservationStatus(left?.status)] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = VEHICLE_RESERVATION_STATUS_RANK[normalizeVehicleReservationStatus(right?.status)] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftStart = Date.parse(left?.startAt ?? "");
    const rightStart = Date.parse(right?.startAt ?? "");

    if (Number.isFinite(leftStart) && Number.isFinite(rightStart) && leftStart !== rightStart) {
      return leftStart - rightStart;
    }

    return String(right?.updatedAt ?? "").localeCompare(String(left?.updatedAt ?? ""));
  });
}

export function getVehicleNextReservation(vehicle, nowValue = isoNow()) {
  const nowTimestamp = Date.parse(nowValue);

  return sortVehicleReservations(vehicle?.reservations ?? [], nowValue).find((reservation) => {
    const endTimestamp = Date.parse(reservation?.endAt ?? "");

    if (!Number.isFinite(endTimestamp)) {
      return false;
    }

    if (Number.isFinite(nowTimestamp) && endTimestamp <= nowTimestamp) {
      return false;
    }

  return ACTIVE_VEHICLE_RESERVATION_STATUSES.has(normalizeVehicleReservationStatus(reservation?.status));
  }) ?? null;
}

export function getVehicleOpenTrip(vehicle) {
  return (Array.isArray(vehicle?.activityItems) ? vehicle.activityItems : []).find((item) => {
    const activityType = String(item?.activityType ?? item?.type ?? "").trim().toLowerCase();
    const hasTripFields = Boolean(
      String(item?.departureAt ?? "").trim()
      || String(item?.returnAt ?? "").trim()
      || String(item?.startKm ?? "").trim()
      || String(item?.endKm ?? "").trim()
      || String(item?.tripStatus ?? "").trim(),
    );
    if (activityType !== "vehicle_trip" && !hasTripFields) {
      return false;
    }
    return String(item?.tripStatus ?? "").trim().toLowerCase() !== "completed"
      && !String(item?.returnAt ?? "").trim();
  }) ?? null;
}

export function getVehicleAvailabilityStatus(vehicle, nowValue = isoNow()) {
  const baseStatus = normalizeVehicleStatus(vehicle?.status);

  if (baseStatus === "service" || baseStatus === "inactive") {
    return baseStatus;
  }

  if (getVehicleOpenTrip(vehicle)) {
    return "reserved";
  }

  return getVehicleNextReservation(vehicle, nowValue) ? "reserved" : "available";
}

export function createClientPortalRecord(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const record = hydrateClientPortalRecordCore({
    state,
    input,
    timestamp,
  });

  return {
    ...record,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateClientPortalRecord(current, patch, state, now = isoNow) {
  return hydrateClientPortalRecordCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function filterClientPortalRecords(
  records,
  { query = "", type = "all", companyId = "", locationId = "" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedType = normalizeText(type);
  const normalizedCompanyId = normalizeText(companyId);
  const normalizedLocationId = normalizeText(locationId);

  return (records ?? []).filter((record) => {
    if (normalizedType && normalizedType !== "all" && normalizeClientPortalRecordType(record.type) !== normalizedType) {
      return false;
    }
    if (normalizedCompanyId && String(record.companyId) !== normalizedCompanyId) {
      return false;
    }
    if (normalizedLocationId && String(record.locationId || "") !== normalizedLocationId) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }

    const details = record.details ?? {};
    const attachmentText = Array.isArray(details.attachments)
      ? details.attachments.map((attachment) => [
        attachment?.fileName,
        attachment?.fileUrl,
        attachment?.description,
      ].filter(Boolean).join(" ")).join(" ")
      : "";
    const haystack = [
      record.title,
      record.companyName,
      record.locationName,
      record.note,
      ...Object.entries(details)
        .filter(([key]) => key !== "attachments")
        .map(([, value]) => value),
      attachmentText,
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortClientPortalRecords(records) {
  return [...(records ?? [])].sort((left, right) => {
    const leftStatusRank = CLIENT_PORTAL_RECORD_STATUS_RANK[normalizeClientPortalRecordStatus(left?.status)] ?? Number.MAX_SAFE_INTEGER;
    const rightStatusRank = CLIENT_PORTAL_RECORD_STATUS_RANK[normalizeClientPortalRecordStatus(right?.status)] ?? Number.MAX_SAFE_INTEGER;
    if (leftStatusRank !== rightStatusRank) {
      return leftStatusRank - rightStatusRank;
    }

    if (left?.dueDate && right?.dueDate && left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }
    if (left?.dueDate && !right?.dueDate) {
      return -1;
    }
    if (!left?.dueDate && right?.dueDate) {
      return 1;
    }

    return String(right?.updatedAt ?? "").localeCompare(String(left?.updatedAt ?? ""));
  });
}

export function createVehicle(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const vehicle = hydrateVehicleCore({
    state,
    input,
    timestamp,
  });

  return {
    ...vehicle,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateVehicle(current, patch, state, now = isoNow) {
  return hydrateVehicleCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createVehicleReservation(
  vehicle,
  input,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const reservation = hydrateVehicleReservationCore({
    vehicle,
    input,
    timestamp,
  });
  const nextReservations = sortVehicleReservations([
    ...(vehicle.reservations ?? []).map((entry) => ({ ...entry })),
    {
      ...reservation,
      id: createId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ], timestamp);

  return {
    ...vehicle,
    reservations: nextReservations,
    updatedAt: timestamp,
  };
}

export function updateVehicleReservation(vehicle, reservationId, patch, now = isoNow) {
  const currentReservation = findVehicleReservationById(vehicle, reservationId);

  if (!currentReservation) {
    throw new Error("Rezervacija vozila nije pronađena.");
  }

  const timestamp = now();
  const nextReservation = hydrateVehicleReservationCore({
    current: currentReservation,
    vehicle,
    input: patch,
    timestamp,
  });

  return {
    ...vehicle,
    reservations: sortVehicleReservations(
      (vehicle.reservations ?? []).map((reservation) => (
        String(reservation.id) === String(reservationId)
          ? nextReservation
          : { ...reservation }
      )),
      timestamp,
    ),
    updatedAt: timestamp,
  };
}

export function deleteVehicleReservation(vehicle, reservationId, now = isoNow) {
  const hasReservation = (vehicle.reservations ?? []).some((reservation) => String(reservation.id) === String(reservationId));

  if (!hasReservation) {
    return null;
  }

  const timestamp = now();

  return {
    ...vehicle,
    reservations: sortVehicleReservations(
      (vehicle.reservations ?? []).filter((reservation) => String(reservation.id) !== String(reservationId)),
      timestamp,
    ),
    updatedAt: timestamp,
  };
}

export function filterVehicles(
  vehicles,
  { query = "", status = "all", nowValue = isoNow() } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return (vehicles ?? []).filter((vehicle) => {
    const availabilityStatus = getVehicleAvailabilityStatus(vehicle, nowValue);

    if (status !== "all" && availabilityStatus !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      vehicle.name,
      vehicle.plateNumber,
      vehicle.vinNumber,
      vehicle.make,
      vehicle.model,
      vehicle.category,
      vehicle.color,
      vehicle.notes,
      ...(vehicle.documents ?? []).map((document) => document.fileName),
      ...(vehicle.documents ?? []).map((document) => document.documentCategory),
      ...(vehicle.activityItems ?? []).map((entry) => entry.activityType),
      ...(vehicle.activityItems ?? []).map((entry) => entry.performedBy),
      ...(vehicle.activityItems ?? []).map((entry) => entry.workSummary),
      ...(vehicle.activityItems ?? []).map((entry) => entry.note),
      ...(vehicle.reservations ?? []).map((reservation) => reservation.purpose),
      ...(vehicle.reservations ?? []).map((reservation) => reservation.reservedForLabel),
      ...(vehicle.reservations ?? []).flatMap((reservation) => reservation.reservedForLabels ?? []),
      ...(vehicle.reservations ?? []).map((reservation) => reservation.destination),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortVehicles(vehicles, nowValue = isoNow()) {
  return [...(vehicles ?? [])].sort((left, right) => {
    const leftStatus = getVehicleAvailabilityStatus(left, nowValue);
    const rightStatus = getVehicleAvailabilityStatus(right, nowValue);
    const leftRank = VEHICLE_STATUS_RANK[leftStatus] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = VEHICLE_STATUS_RANK[rightStatus] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftNextReservation = getVehicleNextReservation(left, nowValue);
    const rightNextReservation = getVehicleNextReservation(right, nowValue);
    const leftStart = Date.parse(leftNextReservation?.startAt ?? "");
    const rightStart = Date.parse(rightNextReservation?.startAt ?? "");

    if (Number.isFinite(leftStart) && Number.isFinite(rightStart) && leftStart !== rightStart) {
      return leftStart - rightStart;
    }

    if (Number.isFinite(leftStart) && !Number.isFinite(rightStart)) {
      return -1;
    }

    if (!Number.isFinite(leftStart) && Number.isFinite(rightStart)) {
      return 1;
    }

    return `${left.plateNumber} ${left.name}`.localeCompare(`${right.plateNumber} ${right.name}`, "hr");
  });
}

export function nextWorkOrderNumber(workOrders) {
  const maxNumber = workOrders.reduce((maxValue, workOrder) => {
    const match = String(workOrder.workOrderNumber ?? "").match(/(\d+)$/);
    const numericPart = match ? Number(match[1]) : 0;
    return Math.max(maxValue, numericPart);
  }, 0);

  return `RN-${String(maxNumber + 1).padStart(5, "0")}`;
}

export function filterWorkOrders(
  workOrders,
  { query = "", status = "all", companyId = "all", advancedFilters = null } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const today = todayString();
  const todayKey = dateValueToKey(today);
  const normalizedAdvancedFilters = normalizeWorkOrderAdvancedFilters(advancedFilters);

  return workOrders.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (companyId !== "all" && item.companyId !== companyId) {
      return false;
    }

    if (!normalizedQuery) {
      return matchesWorkOrderAdvancedFilters(item, normalizedAdvancedFilters, today, todayKey);
    }

    const haystack = [
      item.workOrderNumber,
      item.companyName,
      item.locationName,
      item.companyOib,
      item.region,
      item.status,
      item.department,
      item.description,
      item.serviceLine,
      getWorkOrderServiceSummary(item),
      ...getWorkOrderExecutors(item),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery)
      && matchesWorkOrderAdvancedFilters(item, normalizedAdvancedFilters, today, todayKey);
  });
}

const WORK_ORDER_ADVANCED_FILTER_FIELDS = new Set([
  "status",
  "priority",
  "companyId",
  "locationId",
  "headquarters",
  "region",
  "executor",
  "department",
  "tag",
  "teamLabel",
  "workOrderNumber",
  "description",
  "serviceLine",
  "dueDate",
  "openedDate",
]);

const WORK_ORDER_ADVANCED_LOGIC_SET = new Set(["AND", "OR"]);
const WORK_ORDER_ADVANCED_EMPTY_OPERATORS = new Set(["is_empty", "is_not_empty"]);
const WORK_ORDER_ADVANCED_TEXT_OPERATORS = new Set(["is", "is_not", "contains", "not_contains"]);
const WORK_ORDER_ADVANCED_DATE_OPERATORS = new Set([
  "on",
  "before",
  "after",
  "on_or_before",
  "on_or_after",
  "today",
  "yesterday",
  "tomorrow",
  "this_week",
  "last_week",
  "next_7_days",
  "last_7_days",
  "this_month",
  "last_month",
  "is_empty",
  "is_not_empty",
]);

function normalizeWorkOrderFilterLogic(value, fallback = "AND") {
  const normalized = normalizeText(value).toUpperCase();
  return WORK_ORDER_ADVANCED_LOGIC_SET.has(normalized) ? normalized : fallback;
}

function normalizeWorkOrderAdvancedRule(input = {}) {
  const field = normalizeText(input.field);

  if (!WORK_ORDER_ADVANCED_FILTER_FIELDS.has(field)) {
    return null;
  }

  const operator = normalizeText(input.operator).toLowerCase() || (field === "dueDate" || field === "openedDate" ? "on" : "is");
  const isDateField = field === "dueDate" || field === "openedDate";
  const allowedOperators = isDateField
    ? WORK_ORDER_ADVANCED_DATE_OPERATORS
    : new Set([...WORK_ORDER_ADVANCED_EMPTY_OPERATORS, ...WORK_ORDER_ADVANCED_TEXT_OPERATORS]);

  if (!allowedOperators.has(operator)) {
    return null;
  }

  const values = Array.isArray(input.values)
    ? input.values
    : hasOwn(input, "value")
      ? [input.value]
      : [];
  const normalizedValues = values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => normalizeText(value))
    .filter(Boolean);

  if (!WORK_ORDER_ADVANCED_EMPTY_OPERATORS.has(operator) && !["today", "yesterday", "tomorrow", "this_week", "last_week", "next_7_days", "last_7_days", "this_month", "last_month"].includes(operator) && normalizedValues.length === 0) {
    return null;
  }

  return {
    field,
    operator,
    values: Array.from(new Set(normalizedValues)),
  };
}

function normalizeWorkOrderAdvancedGroup(input = {}, index = 0) {
  const rules = Array.isArray(input.rules)
    ? input.rules.map((rule) => normalizeWorkOrderAdvancedRule(rule)).filter(Boolean)
    : [];

  if (rules.length === 0) {
    return null;
  }

  return {
    join: index === 0 ? "AND" : normalizeWorkOrderFilterLogic(input.join, "AND"),
    match: normalizeWorkOrderFilterLogic(input.match, "AND"),
    rules,
  };
}

function normalizeWorkOrderAdvancedFilters(input) {
  const groups = Array.isArray(input?.groups)
    ? input.groups.map((group, index) => normalizeWorkOrderAdvancedGroup(group, index)).filter(Boolean)
    : [];

  return {
    groups,
  };
}

function getWorkOrderAdvancedFieldValues(item, field) {
  switch (field) {
    case "status":
      return [normalizeText(item.status)];
    case "priority":
      return [normalizeText(item.priority)];
    case "companyId":
      return [normalizeText(item.companyId)];
    case "locationId":
      return [normalizeText(item.locationId)];
    case "headquarters":
      return [normalizeText(item.headquarters)];
    case "region":
      return [normalizeText(item.region)];
    case "executor":
      return getWorkOrderExecutors(item);
    case "department":
      return [normalizeText(item.department)];
    case "tag":
      return splitTags(item.tagText);
    case "teamLabel":
      return [normalizeText(item.teamLabel)];
    case "workOrderNumber":
      return [normalizeText(item.workOrderNumber)];
    case "description":
      return [normalizeText(item.description)];
    case "serviceLine":
      return [normalizeText(item.serviceLine), normalizeText(getWorkOrderServiceSummary(item))];
    case "dueDate":
      return [normalizeOptionalDate(item.dueDate)];
    case "openedDate":
      return [normalizeOptionalDate(item.openedDate)];
    default:
      return [];
  }
}

function matchesWorkOrderAdvancedDateRule(value, operator, values, today, todayKey) {
  const valueKey = dateValueToKey(value);

  if (operator === "is_empty") {
    return valueKey === null;
  }

  if (operator === "is_not_empty") {
    return valueKey !== null;
  }

  if (valueKey === null || todayKey === null) {
    return false;
  }

  const compareKey = dateValueToKey(values[0]);
  const currentDate = new Date(`${today}T12:00:00Z`);
  const currentWeekStart = startOfWeekDate(today);
  const currentWeekStartKey = dateValueToKey(formatLocalDateKey(currentWeekStart));
  const currentWeekEndKey = currentWeekStartKey === null ? null : currentWeekStartKey + (6 * 24 * 60 * 60 * 1000);
  const firstDayOfMonth = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1, 12));
  const lastDayOfMonth = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 0, 12));
  const thisMonthStartKey = dateValueToKey(formatLocalDateKey(firstDayOfMonth));
  const thisMonthEndKey = dateValueToKey(formatLocalDateKey(lastDayOfMonth));
  const lastMonthStart = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 1, 1, 12));
  const lastMonthEnd = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 0, 12));
  const lastMonthStartKey = dateValueToKey(formatLocalDateKey(lastMonthStart));
  const lastMonthEndKey = dateValueToKey(formatLocalDateKey(lastMonthEnd));

  switch (operator) {
    case "on":
      return compareKey !== null && valueKey === compareKey;
    case "before":
      return compareKey !== null && valueKey < compareKey;
    case "after":
      return compareKey !== null && valueKey > compareKey;
    case "on_or_before":
      return compareKey !== null && valueKey <= compareKey;
    case "on_or_after":
      return compareKey !== null && valueKey >= compareKey;
    case "today":
      return valueKey === todayKey;
    case "yesterday":
      return valueKey === todayKey - (24 * 60 * 60 * 1000);
    case "tomorrow":
      return valueKey === todayKey + (24 * 60 * 60 * 1000);
    case "this_week":
      return currentWeekStartKey !== null && currentWeekEndKey !== null && valueKey >= currentWeekStartKey && valueKey <= currentWeekEndKey;
    case "last_week":
      return currentWeekStartKey !== null && valueKey >= currentWeekStartKey - (7 * 24 * 60 * 60 * 1000) && valueKey < currentWeekStartKey;
    case "next_7_days":
      return valueKey >= todayKey && valueKey <= todayKey + (6 * 24 * 60 * 60 * 1000);
    case "last_7_days":
      return valueKey <= todayKey && valueKey >= todayKey - (6 * 24 * 60 * 60 * 1000);
    case "this_month":
      return thisMonthStartKey !== null && thisMonthEndKey !== null && valueKey >= thisMonthStartKey && valueKey <= thisMonthEndKey;
    case "last_month":
      return lastMonthStartKey !== null && lastMonthEndKey !== null && valueKey >= lastMonthStartKey && valueKey <= lastMonthEndKey;
    default:
      return false;
  }
}

function matchesWorkOrderAdvancedRule(item, rule, today, todayKey) {
  const values = getWorkOrderAdvancedFieldValues(item, rule.field);
  const nonEmptyValues = values.map((value) => normalizeText(value)).filter(Boolean);

  if (rule.field === "dueDate" || rule.field === "openedDate") {
    return matchesWorkOrderAdvancedDateRule(values[0], rule.operator, rule.values, today, todayKey);
  }

  if (rule.operator === "is_empty") {
    return nonEmptyValues.length === 0;
  }

  if (rule.operator === "is_not_empty") {
    return nonEmptyValues.length > 0;
  }

  const valuePool = nonEmptyValues.map((value) => value.toLowerCase());
  const expectedPool = rule.values.map((value) => value.toLowerCase());

  if (expectedPool.length === 0) {
    return true;
  }

  if (rule.operator === "is") {
    return valuePool.some((value) => expectedPool.includes(value));
  }

  if (rule.operator === "is_not") {
    return valuePool.length === 0 || valuePool.every((value) => !expectedPool.includes(value));
  }

  if (rule.operator === "contains") {
    return valuePool.some((value) => expectedPool.some((expected) => value.includes(expected)));
  }

  if (rule.operator === "not_contains") {
    return valuePool.length === 0 || valuePool.every((value) => expectedPool.every((expected) => !value.includes(expected)));
  }

  return true;
}

function matchesWorkOrderAdvancedFilters(item, advancedFilters, today = todayString(), todayKey = dateValueToKey(today)) {
  if (!advancedFilters?.groups?.length) {
    return true;
  }

  return advancedFilters.groups.reduce((result, group, index) => {
    const groupResult = group.match === "OR"
      ? group.rules.some((rule) => matchesWorkOrderAdvancedRule(item, rule, today, todayKey))
      : group.rules.every((rule) => matchesWorkOrderAdvancedRule(item, rule, today, todayKey));

    if (index === 0) {
      return groupResult;
    }

    return group.join === "OR"
      ? (result || groupResult)
      : (result && groupResult);
  }, true);
}

export function sortWorkOrders(workOrders) {
  return [...workOrders].sort((left, right) => {
    if (left.openedDate && right.openedDate && left.openedDate !== right.openedDate) {
      return right.openedDate.localeCompare(left.openedDate);
    }

    const leftRank = PRIORITY_RANK[left.priority] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = PRIORITY_RANK[right.priority] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return String(right.workOrderNumber).localeCompare(String(left.workOrderNumber), "hr");
  });
}

function formatLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeekDate(value) {
  const normalized = normalizeOptionalDate(value) ?? todayString();
  const date = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return startOfWeekDate(todayString());
  }

  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}

function addDaysToDateKey(value, days) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setDate(date.getDate() + days);
  return formatLocalDateKey(date);
}

export function parseCoordinates(value) {
  const rawValue = normalizeText(value)
    .replace(/[;]/g, ",")
    .replace(/\s+/g, " ");

  if (!rawValue) {
    return null;
  }

  const parts = rawValue.match(/-?\d+(?:[.,]\d+)?/g);

  if (!parts || parts.length < 2) {
    return null;
  }

  const latitude = Number(parts[0].replace(",", "."));
  const longitude = Number(parts[1].replace(",", "."));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

export function getWorkOrderExecutorGroup(workOrder) {
  const executors = getWorkOrderExecutors(workOrder);

  return {
    key: executors.length ? executors.map((value) => value.toLowerCase()).join("||") : "unassigned",
    label: executors.length ? executors.join(" + ") : "Bez izvršitelja",
    executors,
  };
}

export function groupWorkOrdersByExecutorSet(workOrders = []) {
  const groupMap = new Map();

  workOrders.forEach((workOrder) => {
    const executorGroup = getWorkOrderExecutorGroup(workOrder);
    const current = groupMap.get(executorGroup.key);

    if (current) {
      current.items.push(workOrder);
      return;
    }

    groupMap.set(executorGroup.key, {
      ...executorGroup,
      isUnassigned: executorGroup.key === "unassigned",
      items: [workOrder],
    });
  });

  return Array.from(groupMap.values())
    .sort((left, right) => {
      if (left.isUnassigned && !right.isUnassigned) {
        return 1;
      }

      if (!left.isUnassigned && right.isUnassigned) {
        return -1;
      }

      if (left.executors.length !== right.executors.length) {
        return right.executors.length - left.executors.length;
      }

      return left.label.localeCompare(right.label, "hr");
    })
    .map((group) => ({
      ...group,
      items: sortWorkOrdersByCalendarKey(group.items),
    }));
}

export function getWorkOrderTeamGroup(workOrder) {
  const label = normalizeText(workOrder?.teamLabel);

  if (!label) {
    const executorGroup = getWorkOrderExecutorGroup(workOrder);

    return {
      key: `executors:${executorGroup.key}`,
      label: executorGroup.label,
      isUnassigned: executorGroup.key === "unassigned",
    };
  }

  return {
    key: `team:${label.toLowerCase()}`,
    label,
    isUnassigned: false,
  };
}

function sortWorkOrderCalendarGroupEntries(left, right) {
  if (left.isUnassigned && !right.isUnassigned) {
    return 1;
  }

  if (!left.isUnassigned && right.isUnassigned) {
    return -1;
  }

  return left.label.localeCompare(right.label, "hr");
}

function sortWorkOrdersByCalendarKey(items = []) {
  return items
    .slice()
    .sort((left, right) => String(left.workOrderNumber ?? "").localeCompare(String(right.workOrderNumber ?? ""), "hr"));
}

function getWorkOrderCalendarDate(workOrder = {}) {
  return normalizeOptionalDate(workOrder?.executionDate);
}

export function buildWorkOrderCalendarTeamWeeks(workOrders = [], anchorDateValue = todayString()) {
  const normalizedAnchor = normalizeOptionalDate(anchorDateValue) ?? todayString();
  const monthStart = `${normalizedAnchor.slice(0, 7)}-01`;
  const monthStartDate = new Date(`${monthStart}T00:00:00`);
  const monthEndDate = new Date(monthStartDate);
  monthEndDate.setMonth(monthEndDate.getMonth() + 1, 0);
  const monthEnd = formatLocalDateKey(monthEndDate);
  const displayStart = formatLocalDateKey(startOfWeekDate(monthStart));
  const displayEnd = addDaysToDateKey(formatLocalDateKey(startOfWeekDate(monthEnd)), 6);
  const displayDaySet = new Set();
  const weeks = [];
  const weekMap = new Map();
  const unscheduledGroupMap = new Map();

  for (let cursor = displayStart; cursor <= displayEnd; cursor = addDaysToDateKey(cursor, 7)) {
    const days = Array.from({ length: 7 }, (_, index) => {
      const key = addDaysToDateKey(cursor, index);
      displayDaySet.add(key);
      return {
        key,
        inMonth: key >= monthStart && key <= monthEnd,
        isToday: key === todayString(),
      };
    });

    const week = {
      key: cursor,
      weekStart: cursor,
      days,
      groups: [],
      totalCount: 0,
    };

    weeks.push(week);
    weekMap.set(cursor, week);
  }

  const ensureWeekGroup = (week, group) => {
    const current = week.groups.find((entry) => entry.key === group.key);

    if (current) {
      return current;
    }

    const created = {
      ...group,
      executors: [],
      regions: [],
      itemsByDate: Object.fromEntries(week.days.map((day) => [day.key, []])),
      totalCount: 0,
    };
    week.groups.push(created);
    return created;
  };

  const ensureUnscheduledGroup = (group) => {
    if (unscheduledGroupMap.has(group.key)) {
      return unscheduledGroupMap.get(group.key);
    }

    const created = {
      ...group,
      executors: [],
      regions: [],
      items: [],
    };
    unscheduledGroupMap.set(group.key, created);
    return created;
  };

  workOrders.forEach((workOrder) => {
    const group = getWorkOrderTeamGroup(workOrder);
    const calendarDate = getWorkOrderCalendarDate(workOrder);

    if (!calendarDate) {
      const targetGroup = ensureUnscheduledGroup(group);
      targetGroup.items.push(workOrder);

      getWorkOrderExecutors(workOrder).forEach((executor) => {
        if (!targetGroup.executors.includes(executor)) {
          targetGroup.executors.push(executor);
        }
      });

      if (normalizeText(workOrder?.region) && !targetGroup.regions.includes(normalizeText(workOrder.region))) {
        targetGroup.regions.push(normalizeText(workOrder.region));
      }

      return;
    }

    if (!displayDaySet.has(calendarDate)) {
      return;
    }

    const weekKey = formatLocalDateKey(startOfWeekDate(calendarDate));
    const week = weekMap.get(weekKey);

    if (!week) {
      return;
    }

    const targetGroup = ensureWeekGroup(week, group);
    targetGroup.itemsByDate[calendarDate].push(workOrder);
    targetGroup.totalCount += 1;
    week.totalCount += 1;

    getWorkOrderExecutors(workOrder).forEach((executor) => {
      if (!targetGroup.executors.includes(executor)) {
        targetGroup.executors.push(executor);
      }
    });

    if (normalizeText(workOrder?.region) && !targetGroup.regions.includes(normalizeText(workOrder.region))) {
      targetGroup.regions.push(normalizeText(workOrder.region));
    }
  });

  const normalizedWeeks = weeks.map((week) => ({
    ...week,
    groups: week.groups
      .sort(sortWorkOrderCalendarGroupEntries)
      .map((group) => ({
        ...group,
        itemsByDate: Object.fromEntries(
          week.days.map((day) => [day.key, sortWorkOrdersByCalendarKey(group.itemsByDate[day.key] ?? [])]),
        ),
      })),
  }));

  const unscheduledGroups = Array.from(unscheduledGroupMap.values())
    .sort(sortWorkOrderCalendarGroupEntries)
    .map((group) => ({
      ...group,
      items: sortWorkOrdersByCalendarKey(group.items),
    }));

  return {
    anchorDate: normalizedAnchor,
    monthStart,
    monthEnd,
    displayStart,
    displayEnd,
    weeks: normalizedWeeks,
    unscheduledGroups,
  };
}

export function buildWorkOrderCalendarLanes(workOrders = [], weekStartValue = todayString(), dayCount = 7) {
  const weekStartDate = startOfWeekDate(weekStartValue);
  const weekStart = formatLocalDateKey(weekStartDate);
  const days = Array.from({ length: dayCount }, (_, index) => addDaysToDateKey(weekStart, index));
  const daySet = new Set(days);
  const laneMap = new Map();
  const unscheduled = [];

  workOrders.forEach((workOrder) => {
    const lane = getWorkOrderExecutorGroup(workOrder);
    const calendarDate = getWorkOrderCalendarDate(workOrder);

    if (!calendarDate || !daySet.has(calendarDate)) {
      if (!calendarDate) {
        unscheduled.push(workOrder);
      }
      return;
    }

    if (!laneMap.has(lane.key)) {
      laneMap.set(lane.key, {
        ...lane,
        itemsByDate: Object.fromEntries(days.map((day) => [day, []])),
      });
    }

    laneMap.get(lane.key).itemsByDate[calendarDate].push(workOrder);
  });

  const lanes = Array.from(laneMap.values())
    .sort((left, right) => {
      if (left.key === "unassigned" && right.key !== "unassigned") {
        return 1;
      }

      if (right.key === "unassigned" && left.key !== "unassigned") {
        return -1;
      }

      return left.label.localeCompare(right.label, "hr");
    })
    .map((lane) => ({
      ...lane,
      itemsByDate: Object.fromEntries(days.map((day) => [
        day,
        lane.itemsByDate[day].slice().sort((left, right) => String(left.workOrderNumber ?? "").localeCompare(String(right.workOrderNumber ?? ""), "hr")),
      ])),
    }));

  return {
    weekStart,
    days,
    lanes,
    unscheduled: unscheduled
      .slice()
      .sort((left, right) => String(left.workOrderNumber ?? "").localeCompare(String(right.workOrderNumber ?? ""), "hr")),
  };
}

export function buildWorkOrderCalendarMonthWeeks(workOrders = [], anchorDateValue = todayString()) {
  const normalizedAnchor = normalizeOptionalDate(anchorDateValue) ?? todayString();
  const monthStart = `${normalizedAnchor.slice(0, 7)}-01`;
  const monthStartDate = new Date(`${monthStart}T00:00:00`);
  const monthEndDate = new Date(monthStartDate);
  monthEndDate.setMonth(monthEndDate.getMonth() + 1, 0);
  const monthEnd = formatLocalDateKey(monthEndDate);
  const displayStart = formatLocalDateKey(startOfWeekDate(monthStart));
  const displayEnd = addDaysToDateKey(formatLocalDateKey(startOfWeekDate(monthEnd)), 6);
  const weeks = [];
  const weekMap = new Map();
  const dayMap = new Map();
  const unscheduled = [];

  for (let cursor = displayStart; cursor <= displayEnd; cursor = addDaysToDateKey(cursor, 7)) {
    const days = Array.from({ length: 7 }, (_, index) => {
      const key = addDaysToDateKey(cursor, index);
      const day = {
        key,
        inMonth: key >= monthStart && key <= monthEnd,
        isToday: key === todayString(),
        items: [],
      };
      dayMap.set(key, day);
      return day;
    });

    const week = {
      key: cursor,
      weekStart: cursor,
      days,
      totalCount: 0,
    };

    weeks.push(week);
    weekMap.set(cursor, week);
  }

  workOrders.forEach((workOrder) => {
    const calendarDate = getWorkOrderCalendarDate(workOrder);

    if (!calendarDate) {
      unscheduled.push(workOrder);
      return;
    }

    const day = dayMap.get(calendarDate);
    if (!day) {
      return;
    }

    day.items.push(workOrder);

    const weekKey = formatLocalDateKey(startOfWeekDate(calendarDate));
    const week = weekMap.get(weekKey);
    if (week) {
      week.totalCount += 1;
    }
  });

  return {
    anchorDate: normalizedAnchor,
    monthStart,
    monthEnd,
    weeks: weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        items: sortWorkOrdersByCalendarKey(day.items),
      })),
    })),
    unscheduled: sortWorkOrdersByCalendarKey(unscheduled),
  };
}

export function buildWorkOrderCalendarWeekColumns(workOrders = [], weekStartValue = todayString()) {
  const weekStartDate = startOfWeekDate(weekStartValue);
  const weekStart = formatLocalDateKey(weekStartDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = addDaysToDateKey(weekStart, index);
    return {
      key,
      items: [],
    };
  });
  const dayMap = new Map(days.map((day) => [day.key, day]));
  const unscheduled = [];
  const unassigned = [];

  workOrders.forEach((workOrder) => {
    const calendarDate = getWorkOrderCalendarDate(workOrder);
    const executorGroup = getWorkOrderExecutorGroup(workOrder);

    if (!calendarDate) {
      unscheduled.push(workOrder);
      return;
    }

    const day = dayMap.get(calendarDate);
    if (!day) {
      return;
    }

    if (executorGroup.key === "unassigned") {
      unassigned.push(workOrder);
      return;
    }

    day.items.push(workOrder);
  });

  return {
    weekStart,
    days: days.map((day) => ({
      ...day,
      items: sortWorkOrdersByCalendarKey(day.items),
    })),
    unscheduled: sortWorkOrdersByCalendarKey(unscheduled),
    unassigned: sortWorkOrdersByCalendarKey(unassigned),
  };
}

export function buildWorkOrderMapMarkers(workOrders = [], bounds = null) {
  const rawMarkers = workOrders
    .map((workOrder) => {
      const point = parseCoordinates(workOrder?.coordinates);

      if (!point) {
        return null;
      }

      return {
        id: workOrder.id,
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
        companyName: workOrder.companyName,
        locationName: workOrder.locationName,
        region: workOrder.region,
        status: workOrder.status,
        priority: workOrder.priority,
        dueDate: workOrder.dueDate,
        coordinates: workOrder.coordinates,
        latitude: point.latitude,
        longitude: point.longitude,
      };
    })
    .filter(Boolean);

  const fallbackBounds = {
    minLat: 42.0,
    maxLat: 47.2,
    minLon: 13.0,
    maxLon: 19.8,
  };

  const computedBounds = bounds || (() => {
    if (rawMarkers.length === 0) {
      return fallbackBounds;
    }

    const latitudes = rawMarkers.map((item) => item.latitude);
    const longitudes = rawMarkers.map((item) => item.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);
    const latSpan = Math.max(1.2, maxLat - minLat);
    const lonSpan = Math.max(1.6, maxLon - minLon);
    const latPadding = latSpan * 0.18;
    const lonPadding = lonSpan * 0.18;

    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLon: minLon - lonPadding,
      maxLon: maxLon + lonPadding,
    };
  })();

  const latSpan = Math.max(0.0001, computedBounds.maxLat - computedBounds.minLat);
  const lonSpan = Math.max(0.0001, computedBounds.maxLon - computedBounds.minLon);

  return {
    bounds: computedBounds,
    markers: rawMarkers.map((marker) => ({
      ...marker,
      x: ((marker.longitude - computedBounds.minLon) / lonSpan) * 100,
      y: (1 - ((marker.latitude - computedBounds.minLat) / latSpan)) * 100,
    })),
  };
}

export function getDashboardStats(snapshot, today = todayString()) {
  const companies = snapshot.companies ?? [];
  const locations = snapshot.locations ?? [];
  const workOrders = snapshot.workOrders ?? [];

  const overdueWorkOrders = workOrders.filter((item) => item.dueDate && item.dueDate < today && item.status !== "Fakturiran RN").length;
  const activeWorkOrders = workOrders.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status)).length;
  const completedWorkOrders = workOrders.filter((item) => CLOSED_WORK_ORDER_STATUSES.has(item.status)).length;

  return {
    companies: companies.length,
    locations: locations.length,
    activeWorkOrders,
    completedWorkOrders,
    overdueWorkOrders,
  };
}

function dateValueToKey(value) {
  const normalized = normalizeOptionalDate(value);

  if (!normalized) {
    return null;
  }

  const timestamp = Date.parse(`${normalized}T12:00:00Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function countGroupedValues(items, getValue, { fallback = "Bez podatka", limit = Infinity } = {}) {
  const grouped = new Map();

  items.forEach((item) => {
    const rawLabel = getValue(item);
    const label = normalizeText(rawLabel) || fallback;
    grouped.set(label, (grouped.get(label) ?? 0) + 1);
  });

  return [...grouped.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label, "hr");
    })
    .slice(0, limit);
}

function getWorkOrderInvoiceAmount(workOrder = {}) {
  return roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(workOrder.weight, 0)));
}

function sumGroupedWorkOrderInvoiceAmounts(items, getValue, { fallback = "Bez podatka", limit = Infinity, includeZeroLabels = [] } = {}) {
  const grouped = new Map(includeZeroLabels.map((label) => [label, 0]));

  items.forEach((item) => {
    const rawLabel = getValue(item);
    const label = normalizeText(rawLabel) || fallback;
    grouped.set(label, roundCurrencyAmount((grouped.get(label) ?? 0) + getWorkOrderInvoiceAmount(item)));
  });

  return [...grouped.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label, "hr");
    })
    .slice(0, limit);
}

function buildDashboardWorkOrderExecutorStatusItems(items, limit = Infinity) {
  const grouped = new Map();

  items.forEach((item) => {
    const executors = getWorkOrderExecutors(item);
    const labels = executors.length > 0 ? [...new Set(executors)] : ["Bez izvrsitelja"];
    const status = normalizeWorkOrderStatus(item.status);

    labels.forEach((label) => {
      const key = normalizeText(label) || "Bez izvrsitelja";
      if (!grouped.has(key)) {
        grouped.set(key, new Map());
      }

      const statusMap = grouped.get(key);
      statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
    });
  });

  return [...grouped.entries()]
    .map(([label, statusMap]) => {
      const segments = WORK_ORDER_STATUS_OPTIONS.map((option) => ({
        label: option.label,
        status: option.value,
        count: statusMap.get(option.value) ?? 0,
      }));
      const count = segments.reduce((sum, segment) => sum + segment.count, 0);

      return { label, count, segments };
    })
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label, "hr");
    })
    .slice(0, limit);
}

function normalizeDashboardWidgetSource(value) {
  const normalized = normalizeText(value).toLowerCase();
  return DASHBOARD_WIDGET_SOURCE_SET.has(normalized) ? normalized : "work_orders";
}

function normalizeDashboardWidgetVisualization(value) {
  const normalized = normalizeText(value).toLowerCase();
  return DASHBOARD_WIDGET_VISUALIZATION_SET.has(normalized) ? normalized : "metric";
}

function normalizeDashboardWidgetSize(value) {
  const normalized = normalizeText(value).toLowerCase();
  return DASHBOARD_WIDGET_SIZE_SET.has(normalized) ? normalized : "medium";
}

function normalizeDashboardWidgetDateWindow(value) {
  const normalized = normalizeText(value).toLowerCase();
  return DASHBOARD_WIDGET_DATE_WINDOW_SET.has(normalized) ? normalized : "all";
}

function getDashboardWidgetLayoutPreset(size) {
  return DASHBOARD_WIDGET_LAYOUT_PRESETS[normalizeDashboardWidgetSize(size)] ?? DASHBOARD_WIDGET_LAYOUT_PRESETS.medium;
}

function normalizeDashboardWidgetGridWidth(value, size = "medium") {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return getDashboardWidgetLayoutPreset(size).width;
  }

  return Math.min(DASHBOARD_GRID_COLUMN_COUNT, Math.max(DASHBOARD_WIDGET_MIN_WIDTH, parsed));
}

function normalizeDashboardWidgetGridHeight(value, size = "medium") {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return getDashboardWidgetLayoutPreset(size).height;
  }

  return Math.min(DASHBOARD_WIDGET_MAX_HEIGHT, Math.max(DASHBOARD_WIDGET_MIN_HEIGHT, parsed));
}

function normalizeDashboardWidgetGridColumn(value, width = DASHBOARD_WIDGET_LAYOUT_PRESETS.medium.width) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(DASHBOARD_GRID_COLUMN_COUNT - width + 1, Math.max(1, parsed));
}

function normalizeDashboardWidgetGridRow(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function getDashboardWidgetSizeFromWidth(width) {
  if (width >= DASHBOARD_GRID_COLUMN_COUNT) {
    return "full";
  }

  if (width >= 6) {
    return "large";
  }

  if (width <= 3) {
    return "small";
  }

  return "medium";
}

function normalizeDashboardWidgetLimit(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return 6;
  }

  return Math.min(100, Math.max(3, parsed));
}

function getDashboardWidgetOptionsFor(source, visualization) {
  const normalizedSource = normalizeDashboardWidgetSource(source);
  const normalizedVisualization = normalizeDashboardWidgetVisualization(visualization);
  const definition = DASHBOARD_WIDGET_DEFINITIONS[normalizedSource] ?? DASHBOARD_WIDGET_DEFINITIONS.work_orders;

  if (normalizedVisualization === "metric") {
    return definition.metrics ?? [];
  }

  if (normalizedVisualization === "list") {
    return definition.lists ?? [];
  }

  return definition.groupings ?? [];
}

function normalizeDashboardWidgetMetricKey(source, visualization, value) {
  const normalizedValue = normalizeText(value);
  const options = getDashboardWidgetOptionsFor(source, visualization);
  const match = options.find((option) => option.value === normalizedValue);
  return match?.value ?? options[0]?.value ?? "";
}

function normalizeDashboardStatusColors(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return Object.entries(input).reduce((acc, [key, value]) => {
    const normalizedKey = normalizeText(key);
    const normalizedValue = normalizeText(value);
    if (normalizedKey && /^#[0-9a-f]{6}$/i.test(normalizedValue)) {
      acc[normalizedKey] = normalizedValue.toLowerCase();
    }
    return acc;
  }, {});
}

function normalizeDashboardWidgetFilters(input = {}) {
  return {
    companyId: normalizeText(input.companyId),
    status: normalizeText(input.status),
    priority: normalizeText(input.priority),
    region: normalizeText(input.region),
    executor: normalizeText(input.executor),
    assigneeUserId: normalizeText(input.assigneeUserId),
    dateWindow: normalizeDashboardWidgetDateWindow(input.dateWindow),
    tag: normalizeText(input.tag),
    statusColors: normalizeDashboardStatusColors(input.statusColors),
  };
}

function getNextDashboardWidgetPosition(widgets = []) {
  return widgets.reduce((maxValue, item) => Math.max(maxValue, Number(item.position ?? 0)), 0) + 1;
}

function normalizeDashboardWidgetPosition(value, widgets = []) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : getNextDashboardWidgetPosition(widgets);
}

function getDashboardWidgetDefaultTitle(source, visualization, metricKey) {
  const definition = DASHBOARD_WIDGET_DEFINITIONS[normalizeDashboardWidgetSource(source)] ?? DASHBOARD_WIDGET_DEFINITIONS.work_orders;
  const option = getDashboardWidgetOptionsFor(source, visualization).find((entry) => entry.value === metricKey);
  return option?.label ?? `${definition.label} kartica`;
}

function getDashboardLayoutOccupancyKey(column, row) {
  return `${column}:${row}`;
}

function canPlaceDashboardWidget(occupiedCells, column, row, width, height) {
  for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
      if (occupiedCells.has(getDashboardLayoutOccupancyKey(column + columnOffset, row + rowOffset))) {
        return false;
      }
    }
  }

  return true;
}

function markDashboardWidgetPlacement(occupiedCells, column, row, width, height) {
  for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
      occupiedCells.add(getDashboardLayoutOccupancyKey(column + columnOffset, row + rowOffset));
    }
  }
}

function findDashboardWidgetPlacement(
  occupiedCells,
  width,
  height,
  preferredColumn = 1,
  preferredRow = 1,
) {
  const startRow = Math.max(1, preferredRow);
  const maxColumn = Math.max(1, DASHBOARD_GRID_COLUMN_COUNT - width + 1);

  for (let row = startRow; row < 1000; row += 1) {
    const startColumn = row === startRow
      ? Math.min(maxColumn, Math.max(1, preferredColumn))
      : 1;

    for (let column = startColumn; column <= maxColumn; column += 1) {
      if (canPlaceDashboardWidget(occupiedCells, column, row, width, height)) {
        return { column, row };
      }
    }
  }

  return { column: 1, row: startRow };
}

export function applyDashboardWidgetGridLayout(widgets = []) {
  const occupiedCells = new Set();
  const nextWidgets = [];

  sortDashboardWidgets(widgets).forEach((widget) => {
    const size = normalizeDashboardWidgetSize(widget.size);
    const gridWidth = normalizeDashboardWidgetGridWidth(widget.gridWidth, size);
    const gridHeight = normalizeDashboardWidgetGridHeight(widget.gridHeight, size);
    const preferredColumn = normalizeDashboardWidgetGridColumn(widget.gridColumn, gridWidth);
    const preferredRow = normalizeDashboardWidgetGridRow(widget.gridRow);
    const placement = canPlaceDashboardWidget(occupiedCells, preferredColumn, preferredRow, gridWidth, gridHeight)
      ? { column: preferredColumn, row: preferredRow }
      : findDashboardWidgetPlacement(occupiedCells, gridWidth, gridHeight, preferredColumn, preferredRow);

    markDashboardWidgetPlacement(occupiedCells, placement.column, placement.row, gridWidth, gridHeight);
    nextWidgets.push({
      ...widget,
      size: getDashboardWidgetSizeFromWidth(gridWidth),
      gridColumn: placement.column,
      gridRow: placement.row,
      gridWidth,
      gridHeight,
    });
  });

  return nextWidgets;
}

export function createDashboardWidget(
  input,
  snapshot,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const source = normalizeDashboardWidgetSource(input.source);
  const visualization = normalizeDashboardWidgetVisualization(input.visualization);
  const metricKey = normalizeDashboardWidgetMetricKey(source, visualization, input.metricKey);
  const timestamp = now();
  const title = normalizeText(input.title) || getDashboardWidgetDefaultTitle(source, visualization, metricKey);
  const size = normalizeDashboardWidgetSize(input.size);
  const draft = {
    id: createId(),
    organizationId: requireText(input.organizationId, "Organizacija"),
    userId: requireText(input.userId, "Korisnik"),
    title,
    source,
    visualization,
    metricKey,
    size,
    limit: normalizeDashboardWidgetLimit(input.limit),
    position: normalizeDashboardWidgetPosition(input.position, snapshot?.dashboardWidgets ?? []),
    gridWidth: normalizeDashboardWidgetGridWidth(input.gridWidth, size),
    gridHeight: normalizeDashboardWidgetGridHeight(input.gridHeight, size),
    gridColumn: normalizeDashboardWidgetGridColumn(input.gridColumn, normalizeDashboardWidgetGridWidth(input.gridWidth, size)),
    gridRow: normalizeDashboardWidgetGridRow(input.gridRow),
    filters: normalizeDashboardWidgetFilters(input.filters),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const laidOutDraft = applyDashboardWidgetGridLayout([...(snapshot?.dashboardWidgets ?? []), draft])
    .find((widget) => widget.id === draft.id);

  return laidOutDraft ?? draft;
}

export function updateDashboardWidget(current, patch, snapshot, now = isoNow) {
  const source = hasOwn(patch, "source")
    ? normalizeDashboardWidgetSource(patch.source)
    : normalizeDashboardWidgetSource(current.source);
  const visualization = hasOwn(patch, "visualization")
    ? normalizeDashboardWidgetVisualization(patch.visualization)
    : normalizeDashboardWidgetVisualization(current.visualization);
  const metricKey = normalizeDashboardWidgetMetricKey(
    source,
    visualization,
    hasOwn(patch, "metricKey") ? patch.metricKey : current.metricKey,
  );
  const title = hasOwn(patch, "title")
    ? (normalizeText(patch.title) || getDashboardWidgetDefaultTitle(source, visualization, metricKey))
    : (normalizeText(current.title) || getDashboardWidgetDefaultTitle(source, visualization, metricKey));
  const mergedFilters = hasOwn(patch, "filters")
    ? { ...(current.filters ?? {}), ...(patch.filters ?? {}) }
    : (current.filters ?? {});
  const requestedSize = hasOwn(patch, "size")
    ? normalizeDashboardWidgetSize(patch.size)
    : normalizeDashboardWidgetSize(current.size);
  const gridWidth = hasOwn(patch, "gridWidth")
    ? normalizeDashboardWidgetGridWidth(patch.gridWidth, requestedSize)
    : hasOwn(patch, "size")
      ? normalizeDashboardWidgetGridWidth(undefined, requestedSize)
      : normalizeDashboardWidgetGridWidth(current.gridWidth, requestedSize);
  const gridHeight = hasOwn(patch, "gridHeight")
    ? normalizeDashboardWidgetGridHeight(patch.gridHeight, requestedSize)
    : hasOwn(patch, "size")
      ? normalizeDashboardWidgetGridHeight(undefined, requestedSize)
      : normalizeDashboardWidgetGridHeight(current.gridHeight, requestedSize);

  return {
    ...current,
    organizationId: hasOwn(patch, "organizationId")
      ? requireText(patch.organizationId, "Organizacija")
      : requireText(current.organizationId, "Organizacija"),
    userId: hasOwn(patch, "userId")
      ? requireText(patch.userId, "Korisnik")
      : requireText(current.userId, "Korisnik"),
    title,
    source,
    visualization,
    metricKey,
    size: getDashboardWidgetSizeFromWidth(gridWidth),
    limit: hasOwn(patch, "limit") ? normalizeDashboardWidgetLimit(patch.limit) : normalizeDashboardWidgetLimit(current.limit),
    position: hasOwn(patch, "position")
      ? normalizeDashboardWidgetPosition(patch.position, snapshot?.dashboardWidgets ?? [])
      : normalizeDashboardWidgetPosition(current.position, snapshot?.dashboardWidgets ?? []),
    gridWidth,
    gridHeight,
    gridColumn: hasOwn(patch, "gridColumn")
      ? normalizeDashboardWidgetGridColumn(patch.gridColumn, gridWidth)
      : normalizeDashboardWidgetGridColumn(current.gridColumn, gridWidth),
    gridRow: hasOwn(patch, "gridRow")
      ? normalizeDashboardWidgetGridRow(patch.gridRow)
      : normalizeDashboardWidgetGridRow(current.gridRow),
    filters: normalizeDashboardWidgetFilters(mergedFilters),
    updatedAt: now(),
  };
}

export function sortDashboardWidgets(widgets = []) {
  return [...widgets].sort((left, right) => {
    const leftPosition = Number(left.position ?? Number.MAX_SAFE_INTEGER);
    const rightPosition = Number(right.position ?? Number.MAX_SAFE_INTEGER);

    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

function isPastDue(dateValue, todayKey) {
  const dateKey = dateValueToKey(dateValue);
  return dateKey !== null && todayKey !== null && dateKey < todayKey;
}

function isWithinFutureWindow(dateValue, todayKey, days) {
  const dateKey = dateValueToKey(dateValue);

  if (dateKey === null || todayKey === null) {
    return false;
  }

  return dateKey >= todayKey && dateKey <= (todayKey + (days * 24 * 60 * 60 * 1000));
}

function applyDashboardDateWindow(items, getDate, dateWindow, todayKey, isClosed = () => false) {
  if (dateWindow === "all") {
    return items;
  }

  if (dateWindow === "overdue") {
    return items.filter((item) => !isClosed(item) && isPastDue(getDate(item), todayKey));
  }

  const windowDays = Number.parseInt(dateWindow, 10);

  if (!Number.isFinite(windowDays)) {
    return items;
  }

  return items.filter((item) => !isClosed(item) && isWithinFutureWindow(getDate(item), todayKey, windowDays));
}

function splitTags(value) {
  return normalizeText(value)
    .split(",")
    .map((entry) => normalizeText(entry))
    .filter(Boolean);
}

function getDashboardFilteredSourceItems(snapshot, widget, context = {}, today = todayString()) {
  const todayKey = dateValueToKey(today);
  const filters = normalizeDashboardWidgetFilters(widget.filters);

  if (widget.source === "reminders") {
    let items = [...(snapshot.reminders ?? [])];

    if (filters.companyId) {
      items = items.filter((item) => String(item.companyId) === String(filters.companyId));
    }

    if (filters.status && filters.status !== "all") {
      items = items.filter((item) => item.status === filters.status);
    }

    return applyDashboardDateWindow(items, (item) => item.dueDate, filters.dateWindow, todayKey, (item) => item.status === "done");
  }

  if (widget.source === "todo_tasks") {
    let items = [...(snapshot.todoTasks ?? [])];

    if (filters.companyId) {
      items = items.filter((item) => String(item.companyId) === String(filters.companyId));
    }

    if (filters.status && filters.status !== "all") {
      items = items.filter((item) => item.status === filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      items = items.filter((item) => item.priority === filters.priority);
    }

    if (filters.assigneeUserId) {
      items = items.filter((item) => String(item.assignedToUserId) === String(filters.assigneeUserId));
    }

    return applyDashboardDateWindow(items, (item) => item.dueDate, filters.dateWindow, todayKey, (item) => item.status === "done");
  }

  if (widget.source === "locations") {
    let items = [...(snapshot.locations ?? [])];

    if (filters.companyId) {
      items = items.filter((item) => String(item.companyId) === String(filters.companyId));
    }

    if (filters.region) {
      items = items.filter((item) => normalizeText(item.region) === filters.region);
    }

    return items;
  }

  let items = [...(snapshot.workOrders ?? [])];

  if (filters.companyId) {
    items = items.filter((item) => String(item.companyId) === String(filters.companyId));
  }

  if (filters.status && filters.status !== "all") {
    items = items.filter((item) => item.status === filters.status);
  }

  if (filters.priority && filters.priority !== "all") {
    items = items.filter((item) => item.priority === filters.priority);
  }

  if (filters.region) {
    items = items.filter((item) => normalizeText(item.region) === filters.region);
  }

  if (filters.executor) {
    items = items.filter((item) => getWorkOrderExecutors(item).some((value) => normalizeText(value) === filters.executor));
  }

  if (filters.tag) {
    const tagLower = filters.tag.toLowerCase();
    items = items.filter((item) => splitTags(item.tagText).some((value) => value.toLowerCase() === tagLower));
  }

  return applyDashboardDateWindow(items, (item) => item.dueDate, filters.dateWindow, todayKey, (item) => CLOSED_WORK_ORDER_STATUSES.has(item.status));
}

function buildDashboardDistributionItems(widget, items) {
  if (widget.source === "reminders") {
    if (widget.metricKey === "status") {
      return REMINDER_STATUS_OPTIONS.map((option) => ({
        label: option.label,
        count: items.filter((item) => item.status === option.value).length,
      })).filter((item) => item.count > 0).slice(0, widget.limit);
    }

    if (widget.metricKey === "company") {
      return countGroupedValues(items, (item) => item.companyName, {
        fallback: "Bez tvrtke",
        limit: widget.limit,
      });
    }

    if (widget.metricKey === "creator") {
      return countGroupedValues(items, (item) => item.createdByLabel, {
        fallback: "SafeNexus",
        limit: widget.limit,
      });
    }
  }

  if (widget.source === "todo_tasks") {
    if (widget.metricKey === "status") {
      return TODO_TASK_STATUS_OPTIONS.map((option) => ({
        label: option.label,
        count: items.filter((item) => item.status === option.value).length,
      })).filter((item) => item.count > 0).slice(0, widget.limit);
    }

    if (widget.metricKey === "priority") {
      return PRIORITY_OPTIONS.map((option) => ({
        label: option.label,
        count: items.filter((item) => item.priority === option.value).length,
      })).filter((item) => item.count > 0).slice(0, widget.limit);
    }

    if (widget.metricKey === "assignee") {
      return countGroupedValues(items, (item) => item.assignedToLabel, {
        fallback: "Nedodijeljeno",
        limit: widget.limit,
      });
    }

    if (widget.metricKey === "creator") {
      return countGroupedValues(items, (item) => item.createdByLabel, {
        fallback: "SafeNexus",
        limit: widget.limit,
      });
    }
  }

  if (widget.source === "locations") {
    if (widget.metricKey === "region") {
      return countGroupedValues(items, (item) => item.region, {
        fallback: "Bez regije",
        limit: widget.limit,
      });
    }

    if (widget.metricKey === "company") {
      return countGroupedValues(items, (item) => item.companyName, {
        fallback: "Bez tvrtke",
        limit: widget.limit,
      });
    }

    if (widget.metricKey === "coordinate_state") {
      return countGroupedValues(items, (item) => (normalizeText(item.coordinates) ? "Ima koordinate" : "Bez koordinata"), {
        limit: widget.limit,
      });
    }
  }

  if (widget.metricKey === "executor_status") {
    return buildDashboardWorkOrderExecutorStatusItems(items, widget.limit);
  }

  if (widget.metricKey === "invoice_status") {
    return sumGroupedWorkOrderInvoiceAmounts(items, (item) => item.status, {
      fallback: "Bez statusa",
      limit: widget.limit,
      includeZeroLabels: WORK_ORDER_STATUS_OPTIONS.map((option) => option.label),
    });
  }

  if (widget.metricKey === "invoice_executor") {
    return sumGroupedWorkOrderInvoiceAmounts(
      items.flatMap((item) => {
        const executors = getWorkOrderExecutors(item);
        const labels = executors.length > 0 ? [...new Set(executors)] : ["Bez izvrsitelja"];
        return labels.map((label) => ({ ...item, executorLabel: label }));
      }),
      (item) => item.executorLabel,
      {
        fallback: "Bez izvrsitelja",
        limit: widget.limit,
      },
    );
  }

  if (widget.metricKey === "invoice_company") {
    return sumGroupedWorkOrderInvoiceAmounts(items, (item) => item.companyName, {
      fallback: "Bez tvrtke",
      limit: widget.limit,
    });
  }

  if (widget.metricKey === "status") {
    const statusItems = WORK_ORDER_STATUS_OPTIONS.map((option) => ({
      label: option.label,
      status: option.value,
      count: items.filter((item) => item.status === option.value).length,
    }));

    if (widget.visualization === "bar") {
      return statusItems.slice(0, widget.limit);
    }

    return statusItems.filter((item) => item.count > 0).slice(0, widget.limit);
  }

  if (widget.metricKey === "priority") {
    return PRIORITY_OPTIONS.map((option) => ({
      label: option.label,
      count: items.filter((item) => item.priority === option.value).length,
    })).filter((item) => item.count > 0).slice(0, widget.limit);
  }

  if (widget.metricKey === "region") {
    return countGroupedValues(items, (item) => item.region, {
      fallback: "Bez regije",
      limit: widget.limit,
    });
  }

  if (widget.metricKey === "company") {
    return countGroupedValues(items, (item) => item.companyName, {
      fallback: "Bez tvrtke",
      limit: widget.limit,
    });
  }

  if (widget.metricKey === "executor") {
    return countGroupedValues(
      items.flatMap((item) => getWorkOrderExecutors(item)),
      (value) => value,
      {
        fallback: "Bez izvršitelja",
        limit: widget.limit,
      },
    );
  }

  if (widget.metricKey === "tag") {
    return countGroupedValues(items.flatMap((item) => splitTags(item.tagText)), (value) => value, {
      fallback: "Bez taga",
      limit: widget.limit,
    });
  }

  return [];
}

function buildDashboardMetricValue(widget, items, snapshot, context = {}, today = todayString()) {
  const todayKey = dateValueToKey(today);

  if (widget.source === "reminders") {
    if (widget.metricKey === "active") {
      return items.filter((item) => item.status === "active").length;
    }

    if (widget.metricKey === "today") {
      return items.filter((item) => item.dueDate === today).length;
    }

    if (widget.metricKey === "overdue") {
      return items.filter((item) => item.status !== "done" && isPastDue(item.dueDate, todayKey)).length;
    }

    if (widget.metricKey === "done") {
      return items.filter((item) => item.status === "done").length;
    }

    return items.length;
  }

  if (widget.source === "todo_tasks") {
    if (widget.metricKey === "assigned_to_me") {
      return items.filter((item) => String(item.assignedToUserId) === String(context.userId ?? "")).length;
    }

    if (widget.metricKey === "created_by_me") {
      return items.filter((item) => String(item.createdByUserId) === String(context.userId ?? "")).length;
    }

    if (widget.metricKey === "overdue") {
      return items.filter((item) => item.status !== "done" && isPastDue(item.dueDate, todayKey)).length;
    }

    if (widget.metricKey === "done") {
      return items.filter((item) => item.status === "done").length;
    }

    return items.length;
  }

  if (widget.source === "locations") {
    if (widget.metricKey === "missing_coordinates") {
      return items.filter((item) => !normalizeText(item.coordinates)).length;
    }

    return items.length;
  }

  if (widget.metricKey === "active") {
    return items.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status)).length;
  }

  if (widget.metricKey === "urgent") {
    return items.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && item.priority === "Urgent").length;
  }

  if (widget.metricKey === "due_7d") {
    return items.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && isWithinFutureWindow(item.dueDate, todayKey, 7)).length;
  }

  if (widget.metricKey === "overdue") {
    return items.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && isPastDue(item.dueDate, todayKey)).length;
  }

  if (widget.metricKey === "completed") {
    return items.filter((item) => CLOSED_WORK_ORDER_STATUSES.has(item.status)).length;
  }

  if (widget.metricKey === "factured") {
    return items.filter((item) => item.status === "Fakturiran RN").length;
  }

  if (widget.metricKey === "invoice_total") {
    return roundCurrencyAmount(items.reduce((sum, item) => sum + getWorkOrderInvoiceAmount(item), 0));
  }

  return items.length;
}

function mapDashboardListItem(entry, type) {
  if (type === "reminders") {
    return {
      id: entry.id,
      type,
      title: entry.title || "Reminder",
      subtitle: [entry.companyName, entry.locationName, entry.workOrderNumber].filter(Boolean).join(" · ") || "Bez veze",
      meta: entry.dueDate || entry.updatedAt || "",
      status: entry.status,
      workOrderId: entry.workOrderId,
    };
  }

  if (type === "todo_tasks") {
    return {
      id: entry.id,
      type,
      title: entry.title || "ToDo",
      subtitle: [entry.assignedToLabel, entry.workOrderNumber].filter(Boolean).join(" · ") || "Bez izvršitelja",
      meta: entry.dueDate || entry.updatedAt || "",
      status: entry.status,
      workOrderId: entry.workOrderId,
    };
  }

  if (type === "locations") {
    return {
      id: entry.id,
      type,
      title: entry.name || "Lokacija",
      subtitle: [entry.companyName, entry.region].filter(Boolean).join(" · ") || "Bez detalja",
      meta: normalizeText(entry.coordinates) || "Bez koordinata",
      status: normalizeText(entry.coordinates) ? "Ima koordinate" : "Bez koordinata",
      workOrderId: "",
    };
  }

  return {
    id: entry.id,
    type,
    title: entry.workOrderNumber || "Bez broja RN",
    subtitle: [entry.companyName, entry.locationName].filter(Boolean).join(" · ") || "Bez klijenta",
    meta: entry.dueDate || entry.updatedAt || "",
    status: entry.status,
    workOrderId: entry.id,
  };
}

function buildDashboardWorkOrderStatusGroupItems(items) {
  const totalCount = items.length;

  return WORK_ORDER_STATUS_OPTIONS.map((option) => {
    const count = items.filter((item) => item.status === option.value).length;
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

    return {
      id: `work-order-status-${option.value}`,
      type: "status_count",
      title: option.label,
      count,
      totalCount,
      meta: `${percentage}% od ukupno`,
      status: option.value,
    };
  });
}

function buildDashboardListItems(widget, items, context = {}, today = todayString()) {
  const todayKey = dateValueToKey(today);

  if (widget.source === "reminders") {
    let nextItems = [...items];

    if (widget.metricKey === "due_soon") {
      nextItems = nextItems
        .filter((item) => item.status !== "done" && item.dueDate)
        .sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));
    } else if (widget.metricKey === "overdue") {
      nextItems = nextItems
        .filter((item) => item.status !== "done" && isPastDue(item.dueDate, todayKey))
        .sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));
    } else {
      nextItems = nextItems.sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
    }

    return nextItems.slice(0, widget.limit).map((item) => mapDashboardListItem(item, "reminders"));
  }

  if (widget.source === "todo_tasks") {
    let nextItems = [...items];

    if (widget.metricKey === "assigned_to_me") {
      nextItems = nextItems.filter((item) => String(item.assignedToUserId) === String(context.userId ?? ""));
    } else if (widget.metricKey === "overdue") {
      nextItems = nextItems.filter((item) => item.status !== "done" && isPastDue(item.dueDate, todayKey));
    } else if (widget.metricKey === "open_items") {
      nextItems = nextItems.filter((item) => item.status !== "done");
    }

    nextItems = nextItems.sort((left, right) => {
      if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
        return left.dueDate.localeCompare(right.dueDate);
      }

      return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
    });

    return nextItems.slice(0, widget.limit).map((item) => mapDashboardListItem(item, "todo_tasks"));
  }

  if (widget.source === "locations") {
    let nextItems = [...items];

    if (widget.metricKey === "missing_coordinates") {
      nextItems = nextItems.filter((item) => !normalizeText(item.coordinates));
    }

    nextItems = nextItems.sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
    return nextItems.slice(0, widget.limit).map((item) => mapDashboardListItem(item, "locations"));
  }

  let nextItems = [...items];

  if (widget.metricKey === "status_groups") {
    return buildDashboardWorkOrderStatusGroupItems(nextItems);
  }

  if (widget.metricKey === "upcoming_due") {
    nextItems = nextItems
      .filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && item.dueDate)
      .sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));
  } else if (widget.metricKey === "overdue") {
    nextItems = nextItems
      .filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && isPastDue(item.dueDate, todayKey))
      .sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));
  } else if (widget.metricKey === "urgent_open") {
    nextItems = nextItems
      .filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && item.priority === "Urgent")
      .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
  } else {
    nextItems = nextItems.sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
  }

  return nextItems.slice(0, widget.limit).map((item) => mapDashboardListItem(item, "work_orders"));
}

function getDashboardWidgetValueType(widget = {}) {
  return String(widget.metricKey || "").startsWith("invoice_") ? "currency" : "number";
}

export function getDashboardWidgetData(snapshot, widget, context = {}, today = todayString()) {
  const normalizedSource = normalizeDashboardWidgetSource(widget.source);
  const normalizedVisualization = normalizeDashboardWidgetVisualization(widget.visualization);
  const normalizedMetricKey = normalizeDashboardWidgetMetricKey(normalizedSource, normalizedVisualization, widget.metricKey);
  const normalizedWidget = {
    ...widget,
    source: normalizedSource,
    visualization: normalizedVisualization,
    metricKey: normalizedMetricKey,
    limit: normalizeDashboardWidgetLimit(widget.limit),
    filters: normalizeDashboardWidgetFilters(widget.filters),
  };
  const choice = getDashboardWidgetOptionsFor(normalizedSource, normalizedVisualization)
    .find((entry) => entry.value === normalizedMetricKey);
  const sourceDefinition = DASHBOARD_WIDGET_DEFINITIONS[normalizedSource] ?? DASHBOARD_WIDGET_DEFINITIONS.work_orders;
  const filteredItems = getDashboardFilteredSourceItems(snapshot, normalizedWidget, context, today);

  if (normalizedVisualization === "metric") {
    return {
      kind: "metric",
      title: normalizedWidget.title,
      sourceLabel: sourceDefinition.label,
      optionLabel: choice?.label ?? normalizedWidget.title,
      value: buildDashboardMetricValue(normalizedWidget, filteredItems, snapshot, context, today),
      valueType: getDashboardWidgetValueType(normalizedWidget),
      subtitle: `${filteredItems.length} zapisa nakon filtra`,
    };
  }

  if (normalizedVisualization === "list") {
    return {
      kind: "list",
      title: normalizedWidget.title,
      sourceLabel: sourceDefinition.label,
      optionLabel: choice?.label ?? normalizedWidget.title,
      items: buildDashboardListItems(normalizedWidget, filteredItems, context, today),
      emptyMessage: "Nema stavki za zadane filtre.",
    };
  }

  return {
    kind: normalizedVisualization,
    title: normalizedWidget.title,
    sourceLabel: sourceDefinition.label,
    optionLabel: choice?.label ?? normalizedWidget.title,
    items: buildDashboardDistributionItems(normalizedWidget, filteredItems),
    valueType: getDashboardWidgetValueType(normalizedWidget),
    emptyMessage: "Nema dovoljno podataka za graf.",
  };
}

export function getDashboardInsights(snapshot, today = todayString()) {
  const companies = snapshot.companies ?? [];
  const locations = snapshot.locations ?? [];
  const workOrders = snapshot.workOrders ?? [];
  const todayKey = dateValueToKey(today);
  const nextWeekKey = todayKey === null ? null : todayKey + (7 * 24 * 60 * 60 * 1000);

  const activeWorkOrders = workOrders.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status));
  const urgentWorkOrders = activeWorkOrders.filter((item) => item.priority === "Urgent");
  const dueThisWeek = activeWorkOrders.filter((item) => {
    const dueDateKey = dateValueToKey(item.dueDate);

    if (dueDateKey === null || todayKey === null || nextWeekKey === null) {
      return false;
    }

    return dueDateKey >= todayKey && dueDateKey <= nextWeekKey;
  });
  const missingCoordinates = locations.filter((item) => !normalizeText(item.coordinates));

  const statusBreakdown = WORK_ORDER_STATUS_OPTIONS.map((option) => ({
    label: option.label,
    count: workOrders.filter((item) => item.status === option.value).length,
  })).filter((item) => item.count > 0);

  const priorityBreakdown = PRIORITY_OPTIONS.map((option) => ({
    label: option.label,
    count: activeWorkOrders.filter((item) => item.priority === option.value).length,
  })).filter((item) => item.count > 0);

  const topRegions = countGroupedValues(activeWorkOrders, (item) => item.region, {
    fallback: "Bez regije",
    limit: 5,
  });
  const topCompanies = countGroupedValues(activeWorkOrders, (item) => item.companyName, {
    fallback: "Bez tvrtke",
    limit: 5,
  });

  const executorLoad = countGroupedValues(
    activeWorkOrders.flatMap((item) => getWorkOrderExecutors(item)),
    (value) => value,
    {
      fallback: "Bez izvršitelja",
      limit: 5,
    },
  );

  const upcomingWorkOrders = activeWorkOrders
    .map((item) => ({
      ...item,
      dueDateKey: dateValueToKey(item.dueDate),
    }))
    .filter((item) => item.dueDateKey !== null && todayKey !== null && item.dueDateKey <= (todayKey + (14 * 24 * 60 * 60 * 1000)))
    .sort((left, right) => left.dueDateKey - right.dueDateKey)
    .slice(0, 6)
    .map(({ dueDateKey, ...item }) => item);

  return {
    companies: companies.length,
    locations: locations.length,
    activeWorkOrders: activeWorkOrders.length,
    urgentWorkOrders: urgentWorkOrders.length,
    dueThisWeekWorkOrders: dueThisWeek.length,
    missingCoordinatesLocations: missingCoordinates.length,
    statusBreakdown,
    priorityBreakdown,
    topRegions,
    topCompanies,
    executorLoad,
    upcomingWorkOrders,
  };
}

export function syncLocationFieldsFromWorkOrder(location, workOrder, now = isoNow) {
  if (!location || !workOrder || location.id !== workOrder.locationId) {
    return location;
  }

  return {
    ...location,
    coordinates: normalizeText(workOrder.coordinates),
    region: normalizeText(workOrder.region),
    updatedAt: now(),
  };
}

