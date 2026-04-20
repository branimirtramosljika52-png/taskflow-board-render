import { normalizeMeasurementCellFormat } from "./measurementFormatting.js";

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

export const LEGAL_FRAMEWORK_STATUS_OPTIONS = [
  { value: "active", label: "Aktivan" },
  { value: "inactive", label: "Neaktivan" },
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

export const DOCUMENT_TEMPLATE_STATUS_OPTIONS = [
  { value: "draft", label: "Skica" },
  { value: "active", label: "Aktivan" },
  { value: "archived", label: "Arhiviran" },
];

export const DOCUMENT_TEMPLATE_TYPE_OPTIONS = [
  { value: "Ponuda", label: "Ponuda" },
  { value: "Radni nalog", label: "Radni nalog" },
  { value: "Zapisnik", label: "Zapisnik" },
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
  { value: "text", label: "Tekst" },
  { value: "longtext", label: "Dugi tekst" },
  { value: "date", label: "Datum" },
  { value: "number", label: "Broj" },
  { value: "checkbox", label: "Checkbox" },
  { value: "toggle", label: "Toggle" },
  { value: "qualified_inspectors", label: "Ispitivači" },
  { value: "sketch_upload", label: "Tlocrt / skica" },
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
  "Flat plan",
  "One-Time",
  "Monthly+Per Services",
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
    ],
    groupings: [
      { value: "status", label: "Status RN" },
      { value: "priority", label: "Prioritet" },
      { value: "region", label: "Regija" },
      { value: "company", label: "Tvrtka" },
      { value: "executor", label: "Izvršitelj" },
      { value: "tag", label: "Tag" },
    ],
    lists: [
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
const CONTRACT_STATUS_SET = new Set(CONTRACT_STATUS_OPTIONS.map((option) => option.value));
const CONTRACT_TEMPLATE_STATUS_SET = new Set(CONTRACT_TEMPLATE_STATUS_OPTIONS.map((option) => option.value));
const VEHICLE_STATUS_SET = new Set(VEHICLE_STATUS_OPTIONS.map((option) => option.value));
const VEHICLE_RESERVATION_STATUS_SET = new Set(VEHICLE_RESERVATION_STATUS_OPTIONS.map((option) => option.value));
const LEGAL_FRAMEWORK_STATUS_SET = new Set(LEGAL_FRAMEWORK_STATUS_OPTIONS.map((option) => option.value));
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
const LEGAL_FRAMEWORK_STATUS_RANK = {
  active: 0,
  inactive: 1,
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
const ABSENCE_STATUS_RANK = {
  pending: 0,
  approved: 1,
  rejected: 2,
  cancelled: 3,
};
const REQUEST_ABSENCE_TYPES = new Set(
  ABSENCE_TYPE_OPTIONS
    .filter((option) => option.group === "request")
    .map((option) => option.value),
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

function normalizeLegalFrameworkStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return LEGAL_FRAMEWORK_STATUS_SET.has(status) ? status : "active";
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
  const raw = normalizeText(value).replace(/\s+/g, "").replace(",", ".");

  if (!raw) {
    return fallback;
  }

  const numeric = Number(raw);
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

function normalizeMeasurementSheetColumnSnapshot(input = {}, index = 0) {
  const width = Number(input?.width);
  const computed = normalizeText(input?.computed);

  return {
    id: normalizeText(input?.id) || `measurement-column-${index + 1}`,
    label: normalizeText(input?.label) || `Kolona ${index + 1}`,
    placeholder: normalizeText(input?.placeholder),
    width: Number.isFinite(width) ? Math.min(640, Math.max(72, Math.round(width))) : 160,
    computed: computed || null,
    readonly: normalizeBoolean(input?.readonly, false),
    validation: normalizeMeasurementSheetColumnValidationSnapshot(input?.validation, new Set(), normalizeText(input?.id) || `measurement-column-${index + 1}`),
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
    placeholder: label,
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
    .slice(0, 32)
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

  return {
    serviceId: normalizeId(item.serviceId || item.id),
    name,
    serviceCode,
    serviceType: normalizeServiceCatalogType(
      item.serviceType,
      normalizeBoolean(item.isTraining, false) ? "znr" : "inspection",
    ),
    linkedTemplateIds,
    linkedTemplateTitles: Array.from(new Set(linkedTemplateTitles)),
    linkedLearningTestIds,
    linkedLearningTestTitles: Array.from(new Set(linkedLearningTestTitles)),
    isTraining: normalizeServiceCatalogType(
      item.serviceType,
      normalizeBoolean(item.isTraining, false) ? "znr" : "inspection",
    ) === "znr",
    isCompleted: normalizeBoolean(item.isCompleted, false),
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

    const normalizedItem = {
      serviceId: serviceId || current?.serviceId || "",
      name: name || current?.name || "",
      serviceCode: serviceCode || current?.serviceCode || "",
      serviceType,
      ...templateSnapshot,
      ...learningTestSnapshot,
      isTraining: serviceType === "znr",
      isCompleted: hasOwn(entry ?? {}, "isCompleted")
        ? normalizeBoolean(entry.isCompleted, false)
        : normalizeBoolean(current?.isCompleted, false),
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
  const serviceItems = getWorkOrderServiceItems(workOrder);

  if (serviceItems.length === 0) {
    return normalizeText(workOrder.serviceLine);
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

function normalizeDocumentTemplateReferenceDocument(value, fallback = null) {
  if (value === null) {
    return null;
  }

  if (!value || typeof value !== "object") {
    return fallback ? { ...fallback } : null;
  }

  const fileName = normalizeText(value.fileName ?? value.name);
  const fileType = normalizeText(value.fileType ?? value.mimeType);
  const dataUrl = normalizeText(value.dataUrl);

  if (!fileName || !dataUrl) {
    return fallback ? { ...fallback } : null;
  }

  return {
    fileName: fileName.slice(0, 255),
    fileType: fileType.slice(0, 160),
    dataUrl,
    updatedAt: normalizeOptionalDateTime(value.updatedAt) ?? isoNow(),
  };
}

function normalizeDocumentTemplateFields(fields = []) {
  const source = (Array.isArray(fields) ? fields : [])
    .filter((field) => normalizeText(field?.type).toLowerCase() !== "page_break");
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
      layoutWidth: normalizeDocumentTemplateFieldLayoutWidth(field?.layoutWidth, type),
      fieldHeight: normalizeDocumentTemplateFieldHeight(field?.fieldHeight, type),
      source: normalizeDocumentTemplateFieldSource(field?.source ?? field?.bindingSource),
      sourceTable: normalizeText(field?.sourceTable).toLowerCase().slice(0, 80),
      lookupColumn: normalizeText(field?.lookupColumn).toLowerCase().slice(0, 80),
      lookupValueSource: normalizeText(field?.lookupValueSource).toUpperCase().slice(0, 80) || "WORK_ORDER_NUMBER",
      lookupValue: normalizeText(field?.lookupValue),
      valueColumn: normalizeText(field?.valueColumn).toLowerCase().slice(0, 80),
      previousDocumentMode: normalizeText(field?.previousDocumentMode).toUpperCase().slice(0, 80) || "NONE",
      signatureArea: normalizeText(field?.signatureArea).toLowerCase() || "elektro",
      signatureRole: normalizeText(field?.signatureRole).toLowerCase() || "inspect",
      signatureMultiple: normalizeBoolean(field?.signatureMultiple, true),
      signatureIncludeScan: normalizeBoolean(field?.signatureIncludeScan, false),
      sectionSubtitle: type === "system_description"
        ? normalizeText(field?.sectionSubtitle).slice(0, 280)
        : "",
      systemRows: normalizedSystemRows,
      legalFrameworkIds: normalizeIdList(field?.legalFrameworkIds ?? field?.availableLegalFrameworkIds ?? []),
      defaultLegalFrameworkIds: normalizeIdList(field?.defaultLegalFrameworkIds ?? field?.preselectedLegalFrameworkIds ?? []),
      defaultValue: normalizeText(field?.defaultValue),
      helpText: normalizeText(field?.helpText),
      toggleTrueLabel: normalizeText(field?.toggleTrueLabel).slice(0, 120),
      toggleFalseLabel: normalizeText(field?.toggleFalseLabel).slice(0, 120),
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

      return {
        label: normalizeText(entry?.label),
        amount,
      };
    })
    .filter((entry) => entry.label || entry.amount);
}

function normalizeOfferItems(items = []) {
  if (!Array.isArray(items)) {
    throw new Error("Stavke ponude moraju biti lista.");
  }

  const normalizedItems = items
    .map((item) => {
      const quantity = roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(item?.quantity, 0)));
      const unitPrice = roundCurrencyAmount(Math.max(0, normalizeFiniteNumber(item?.unitPrice, 0)));
      const breakdowns = normalizeOfferBreakdowns(item?.breakdowns);
      const breakdownTotal = roundCurrencyAmount(
        breakdowns.reduce((sum, entry) => sum + roundCurrencyAmount(entry.amount), 0),
      );
      const grossTotal = breakdowns.length > 0
        ? breakdownTotal
        : roundCurrencyAmount(quantity * unitPrice);
      const discountRate = normalizeOfferDiscountRate(item?.discountRate);
      const discountTotal = roundCurrencyAmount(grossTotal * (discountRate / 100));

      return {
        serviceCatalogId: normalizeText(item?.serviceCatalogId),
        serviceCode: normalizeText(item?.serviceCode),
        description: normalizeText(item?.description),
        unit: normalizeText(item?.unit),
        quantity,
        unitPrice,
        breakdowns,
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
      || item.discountRate > 0
    ));

  if (normalizedItems.length === 0) {
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
    const hasAnyData = Boolean(
      activityType
      || performedOn
      || performedBy
      || validUntil
      || workSummary
      || note
      || normalizeText(item?.odometerKm),
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
  const items = hasOwn(input, "items")
    ? normalizeOfferItems(input.items)
    : (current?.items ?? []);
  const totals = calculateOfferTotals(items, taxRate, discountRate);
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
    title: hasOwn(input, "title") ? requireText(input.title, "Naziv ponude") : current?.title ?? "",
    serviceLine: hasOwn(input, "serviceLine") ? requireText(input.serviceLine, "Vrsta usluge") : current?.serviceLine ?? "",
    status: hasOwn(input, "status") ? normalizeOfferStatus(input.status) : normalizeOfferStatus(current?.status),
    offerDate,
    validUntil: hasOwn(input, "validUntil")
      ? normalizeOptionalDate(input.validUntil)
      : normalizeOptionalDate(current?.validUntil),
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

export function createCompany(input, existingCompanies = [], createId = () => crypto.randomUUID(), now = isoNow) {
  const timestamp = now();
  const company = {
    id: createId(),
    name: requireText(input.name, "Naziv tvrtke"),
    logoDataUrl: normalizeText(input.logoDataUrl),
    headquarters: normalizeText(input.headquarters),
    oib: normalizeOib(input.oib),
    contractType: normalizeText(input.contractType),
    contractNumber: normalizeText(input.contractNumber),
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
  const next = {
    ...current,
    name: hasOwn(patch, "name") ? requireText(patch.name, "Naziv tvrtke") : current.name,
    logoDataUrl: hasOwn(patch, "logoDataUrl") ? normalizeText(patch.logoDataUrl) : current.logoDataUrl,
    headquarters: hasOwn(patch, "headquarters") ? normalizeText(patch.headquarters) : current.headquarters,
    oib: hasOwn(patch, "oib") ? normalizeOib(patch.oib) : current.oib,
    contractType: hasOwn(patch, "contractType") ? normalizeText(patch.contractType) : current.contractType,
    contractNumber: hasOwn(patch, "contractNumber") ? normalizeText(patch.contractNumber) : current.contractNumber,
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
    linkedTemplateIds: serviceType === "inspection" ? normalizedTemplateIds.linkedTemplateIds : [],
    linkedTemplateTitles: serviceType === "inspection" ? normalizedTemplateIds.linkedTemplateTitles : [],
    linkedLearningTestIds: serviceType === "znr" ? normalizedLearningTestIds.linkedLearningTestIds : [],
    linkedLearningTestTitles: serviceType === "znr" ? normalizedLearningTestIds.linkedLearningTestTitles : [],
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
  const items = hasOwn(input, "items")
    ? normalizeOfferItems(input.items)
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
    title: hasOwn(input, "title") ? requireText(input.title, "Naziv narudzbenice") : current?.title ?? "",
    serviceLine: hasOwn(input, "serviceLine") ? requireText(input.serviceLine, "Vrsta usluge") : current?.serviceLine ?? "",
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
    linkedTemplateIds: serviceType === "inspection" ? templateSnapshot.linkedTemplateIds : [],
    linkedTemplateTitles: serviceType === "inspection" ? templateSnapshot.linkedTemplateTitles : [],
    linkedLearningTestIds: serviceType === "znr" ? learningTestSnapshot.linkedLearningTestIds : [],
    linkedLearningTestTitles: serviceType === "znr" ? learningTestSnapshot.linkedLearningTestTitles : [],
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
      item.note,
      ...(item.linkedTemplateTitles ?? []),
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
    documents: normalizeAttachmentDocuments(input.documents),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateLegalFramework(current, patch, state, now = isoNow) {
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
  const templateSnapshot = normalizeLinkedTemplateSnapshot(
    state,
    hasOwn(input, "linkedTemplateIds") ? input.linkedTemplateIds : [],
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
    enteredBy,
    approvedBy,
    entryDate,
    requiresCalibration,
    calibrationDate: requiresCalibration ? calibrationDate : null,
    calibrationPeriod: requiresCalibration ? calibrationPeriod : "",
    validUntil: requiresCalibration ? validUntil : null,
    note: normalizeText(input.note),
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
  const templateSnapshot = hasOwn(patch, "linkedTemplateIds")
    ? normalizeLinkedTemplateSnapshot(state, patch.linkedTemplateIds, current.linkedTemplateTitles)
    : normalizeLinkedTemplateSnapshot(state, current.linkedTemplateIds, current.linkedTemplateTitles);

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
    enteredBy,
    approvedBy,
    entryDate,
    requiresCalibration,
    calibrationDate: requiresCalibration ? calibrationDate : null,
    calibrationPeriod: requiresCalibration ? calibrationPeriod : "",
    validUntil: requiresCalibration ? validUntil : null,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
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
      item.enteredBy,
      item.approvedBy,
      item.entryDate,
      item.note,
      item.calibrationPeriod,
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
  const templateSnapshot = normalizeLinkedTemplateSnapshot(
    state,
    hasOwn(input, "linkedTemplateIds") ? input.linkedTemplateIds : [],
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
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
    documents: normalizeAttachmentDocuments(input.documents),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateSafetyAuthorization(current, patch, state, now = isoNow) {
  const templateSnapshot = hasOwn(patch, "linkedTemplateIds")
    ? normalizeLinkedTemplateSnapshot(state, patch.linkedTemplateIds, current.linkedTemplateTitles)
    : normalizeLinkedTemplateSnapshot(state, current.linkedTemplateIds, current.linkedTemplateTitles);
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
  return REQUEST_ABSENCE_TYPES.has(normalizeAbsenceType(value));
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
  return {
    id: normalizeId(input.id) || createId(),
    organizationId: requireText(input.organizationId, "Organizacija"),
    userId: requireText(input.userId, "Korisnik"),
    userLabel: requireText(input.userLabel, "Ime korisnika"),
    annualLeaveInitialDays: normalizeAbsenceDayAllowance(input.annualLeaveInitialDays, 0),
    sickLeaveInitialDays: normalizeAbsenceDayAllowance(input.sickLeaveInitialDays, 0),
    createdAt: normalizeOptionalDateTime(input.createdAt) ?? timestamp,
    updatedAt: normalizeOptionalDateTime(input.updatedAt) ?? timestamp,
  };
}

export function updateAbsenceBalanceEntry(current, patch, now = isoNow) {
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
    annualLeaveInitialDays: hasOwn(patch, "annualLeaveInitialDays")
      ? normalizeAbsenceDayAllowance(patch.annualLeaveInitialDays, current.annualLeaveInitialDays)
      : current.annualLeaveInitialDays,
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

export function buildAbsenceBalanceSummaries(
  balances = [],
  entries = [],
  { userIds = [] } = {},
) {
  const requestedUserIds = new Set((Array.isArray(userIds) ? userIds : [userIds]).map((value) => normalizeId(value)).filter(Boolean));
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
    summaryMap.set(userId, {
      userId,
      userLabel: normalizeText(entry.userLabel) || "Korisnik",
      annualLeaveInitialDays: normalizeAbsenceDayAllowance(entry.annualLeaveInitialDays, 0),
      annualLeaveUsedDays: 0,
      annualLeaveRemainingDays: normalizeAbsenceDayAllowance(entry.annualLeaveInitialDays, 0),
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
      annualLeaveUsedDays: 0,
      annualLeaveRemainingDays: 0,
      sickLeaveInitialDays: 0,
      sickLeaveUsedDays: 0,
      sickLeaveRemainingDays: 0,
    };

    if (normalizeAbsenceType(entry.type) === "annual_leave") {
      current.annualLeaveUsedDays += Number(entry.dayCount ?? getAbsenceBusinessDayCount(entry.startDate, entry.endDate)) || 0;
      current.annualLeaveRemainingDays = Math.max(0, current.annualLeaveInitialDays - current.annualLeaveUsedDays);
    }

    if (normalizeAbsenceType(entry.type) === "sick_leave") {
      current.sickLeaveUsedDays += Number(entry.dayCount ?? getAbsenceBusinessDayCount(entry.startDate, entry.endDate)) || 0;
      current.sickLeaveRemainingDays = Math.max(0, current.sickLeaveInitialDays - current.sickLeaveUsedDays);
    }

    summaryMap.set(userId, current);
  });

  return Array.from(summaryMap.values()).sort((left, right) => (
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
    buildAbsenceBalanceSummaries(absenceBalances, approvedEntries).map((entry) => [entry.userId, entry]),
  );

  const workOrderCountsByUserId = new Map();
  (workOrders ?? []).forEach((workOrder) => {
    const dueDate = normalizeOptionalDate(workOrder?.dueDate);
    if (!dueDate || !dueDate.startsWith(monthKey)) {
      return;
    }
    const executors = getWorkOrderExecutors(workOrder);
    executors.forEach((executorLabel) => {
      const key = normalizeText(executorLabel);
      if (!key) {
        return;
      }
      workOrderCountsByUserId.set(key, (workOrderCountsByUserId.get(key) ?? 0) + 1);
    });
  });

  return (users ?? [])
    .filter((user) => user?.isActive !== false)
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
        assignedWorkOrderCount: workOrderCountsByUserId.get(fullName) ?? 0,
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

  return {
    ...current,
    title: hasOwn(patch, "title") ? requireText(patch.title, "Naziv templatea") : current.title,
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
      : (current.referenceDocument ? { ...current.referenceDocument } : null),
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
    ...resolveCompanySnapshot(company),
    ...resolveLocationSnapshot(location),
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
    invoiceNote: normalizeText(input.invoiceNote),
    invoiceDate: normalizeOptionalDate(input.invoiceDate),
    weight: normalizeText(input.weight),
    completedBy: normalizeText(input.completedBy),
    description: requireText(input.description, "Opis radnog naloga"),
    linkReference: normalizeText(input.linkReference),
    teamLabel: normalizeText(input.teamLabel),
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
    invoiceNote: hasOwn(patch, "invoiceNote") ? normalizeText(patch.invoiceNote) : current.invoiceNote,
    invoiceDate: hasOwn(patch, "invoiceDate") ? normalizeOptionalDate(patch.invoiceDate) : current.invoiceDate,
    weight: hasOwn(patch, "weight") ? normalizeText(patch.weight) : current.weight,
    completedBy: hasOwn(patch, "completedBy") ? normalizeText(patch.completedBy) : current.completedBy,
    description: hasOwn(patch, "description") ? requireText(patch.description, "Opis radnog naloga") : current.description,
    linkReference: hasOwn(patch, "linkReference") ? normalizeText(patch.linkReference) : current.linkReference,
    teamLabel: hasOwn(patch, "teamLabel") ? normalizeText(patch.teamLabel) : current.teamLabel,
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
      item.locationName,
      item.workOrderNumber,
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
      item.title,
      item.companyName,
      item.locationName,
      ...(item.selectedLocationNames ?? []),
      item.contactName,
      item.serviceLine,
      item.createdByLabel,
      item.note,
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

export function sortOffers(offers) {
  return [...offers].sort((left, right) => {
    const leftRank = OFFER_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = OFFER_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (left.offerDate && right.offerDate && left.offerDate !== right.offerDate) {
      return right.offerDate.localeCompare(left.offerDate);
    }

    if (left.offerDate && !right.offerDate) {
      return -1;
    }

    if (!left.offerDate && right.offerDate) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
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

export function getVehicleAvailabilityStatus(vehicle, nowValue = isoNow()) {
  const baseStatus = normalizeVehicleStatus(vehicle?.status);

  if (baseStatus === "service" || baseStatus === "inactive") {
    return baseStatus;
  }

  return getVehicleNextReservation(vehicle, nowValue) ? "reserved" : "available";
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
      return [normalizeText(item.serviceLine)];
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
    const dueDate = normalizeOptionalDate(workOrder?.dueDate);

    if (!dueDate) {
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

    if (!displayDaySet.has(dueDate)) {
      return;
    }

    const weekKey = formatLocalDateKey(startOfWeekDate(dueDate));
    const week = weekMap.get(weekKey);

    if (!week) {
      return;
    }

    const targetGroup = ensureWeekGroup(week, group);
    targetGroup.itemsByDate[dueDate].push(workOrder);
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
    const dueDate = normalizeOptionalDate(workOrder?.dueDate);

    if (!dueDate || !daySet.has(dueDate)) {
      if (!dueDate) {
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

    laneMap.get(lane.key).itemsByDate[dueDate].push(workOrder);
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
    const dueDate = normalizeOptionalDate(workOrder?.dueDate);

    if (!dueDate) {
      unscheduled.push(workOrder);
      return;
    }

    const day = dayMap.get(dueDate);
    if (!day) {
      return;
    }

    day.items.push(workOrder);

    const weekKey = formatLocalDateKey(startOfWeekDate(dueDate));
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
    const dueDate = normalizeOptionalDate(workOrder?.dueDate);
    const executorGroup = getWorkOrderExecutorGroup(workOrder);

    if (!dueDate) {
      unscheduled.push(workOrder);
      return;
    }

    const day = dayMap.get(dueDate);
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

  return Math.min(12, Math.max(3, parsed));
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

  if (widget.metricKey === "status") {
    return WORK_ORDER_STATUS_OPTIONS.map((option) => ({
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

