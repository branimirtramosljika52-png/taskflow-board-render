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

export const VEHICLE_STATUS_OPTIONS = [
  { value: "available", label: "Dostupno" },
  { value: "reserved", label: "Rezervirano" },
  { value: "service", label: "Servis" },
  { value: "inactive", label: "Van uporabe" },
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

export const MEASUREMENT_EQUIPMENT_KIND_OPTIONS = [
  { value: "measurement", label: "Mjerna oprema" },
  { value: "testing", label: "Ispitna oprema" },
  { value: "combined", label: "Mjerna + ispitna" },
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
  { value: "text", label: "Tekst" },
  { value: "longtext", label: "Dugi tekst" },
  { value: "date", label: "Datum" },
  { value: "number", label: "Broj" },
  { value: "checkbox", label: "Checkbox" },
  { value: "toggle", label: "Toggle" },
  { value: "qualified_inspectors", label: "Ispitivači" },
  { value: "legal_list", label: "Popis propisa" },
  { value: "equipment_list", label: "Popis opreme" },
  { value: "measurement_table", label: "Excel tablica" },
  { value: "inspector_signature", label: "Potpis ispitivaca" },
  { value: "authorization_holder_signature", label: "Potpis nositelja" },
  { value: "page_break", label: "Nova stranica" },
];

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
  { value: "7d", label: "Sljedecih 7 dana" },
  { value: "14d", label: "Sljedecih 14 dana" },
  { value: "30d", label: "Sljedecih 30 dana" },
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
      { value: "executor", label: "Izvrsitelj" },
      { value: "tag", label: "Tag" },
    ],
    lists: [
      { value: "upcoming_due", label: "Sljedeci rokovi" },
      { value: "overdue", label: "RN kojima je istekao rok" },
      { value: "urgent_open", label: "Urgent otvoreni RN" },
      { value: "recent", label: "Nedavno azurirani RN" },
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
      { value: "assignee", label: "Izvrsitelj" },
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
      { value: "recent", label: "Nedavno azurirane lokacije" },
    ],
  },
};

const WORK_ORDER_STATUS_SET = new Set(WORK_ORDER_STATUS_OPTIONS.map((option) => option.value));
const PRIORITY_SET = new Set(PRIORITY_OPTIONS.map((option) => option.value));
const REMINDER_STATUS_SET = new Set(REMINDER_STATUS_OPTIONS.map((option) => option.value));
const TODO_TASK_STATUS_SET = new Set(TODO_TASK_STATUS_OPTIONS.map((option) => option.value));
const OFFER_STATUS_SET = new Set(OFFER_STATUS_OPTIONS.map((option) => option.value));
const VEHICLE_STATUS_SET = new Set(VEHICLE_STATUS_OPTIONS.map((option) => option.value));
const VEHICLE_RESERVATION_STATUS_SET = new Set(VEHICLE_RESERVATION_STATUS_OPTIONS.map((option) => option.value));
const LEGAL_FRAMEWORK_STATUS_SET = new Set(LEGAL_FRAMEWORK_STATUS_OPTIONS.map((option) => option.value));
const SERVICE_CATALOG_STATUS_SET = new Set(SERVICE_CATALOG_STATUS_OPTIONS.map((option) => option.value));
const MEASUREMENT_EQUIPMENT_KIND_SET = new Set(MEASUREMENT_EQUIPMENT_KIND_OPTIONS.map((option) => option.value));
const DOCUMENT_TEMPLATE_STATUS_SET = new Set(DOCUMENT_TEMPLATE_STATUS_OPTIONS.map((option) => option.value));
const DOCUMENT_TEMPLATE_TYPE_SET = new Set(DOCUMENT_TEMPLATE_TYPE_OPTIONS.map((option) => option.value));
const DOCUMENT_TEMPLATE_SECTION_TYPE_SET = new Set(DOCUMENT_TEMPLATE_SECTION_TYPE_OPTIONS.map((option) => option.value));
const DOCUMENT_TEMPLATE_FIELD_TYPE_SET = new Set(DOCUMENT_TEMPLATE_FIELD_TYPE_OPTIONS.map((option) => option.value));
const ACTIVE_VEHICLE_RESERVATION_STATUSES = new Set(["reserved", "checked_out"]);
const OFFER_LOCATION_SCOPE_SET = new Set(["single", "all", "none"]);
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
  inactive: 3,
};
const VEHICLE_RESERVATION_STATUS_RANK = {
  checked_out: 0,
  reserved: 1,
  completed: 2,
  cancelled: 3,
};

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

function normalizeTodoTaskStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return TODO_TASK_STATUS_SET.has(status) ? status : "open";
}

function normalizeOfferStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return OFFER_STATUS_SET.has(status) ? status : "draft";
}

function normalizeVehicleStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return VEHICLE_STATUS_SET.has(status) ? status : "available";
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

function normalizeOfferLocationScope(value, fallback = "none") {
  const scope = normalizeText(value).toLowerCase();
  return OFFER_LOCATION_SCOPE_SET.has(scope) ? scope : fallback;
}

function normalizeOib(value) {
  const oib = normalizeText(value).replace(/\s+/g, "");

  if (!/^\d{11}$/.test(oib)) {
    throw new Error("OIB mora imati tocno 11 znamenki.");
  }

  return oib;
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
  const type = normalizeText(format?.type).toLowerCase();
  const decimals = Number.parseInt(format?.decimals, 10);

  return {
    type: ["general", "number", "integer", "percent", "text"].includes(type) ? type : "general",
    decimals: Number.isInteger(decimals) ? Math.min(6, Math.max(0, decimals)) : 2,
    border: normalizeMeasurementSheetBorderSnapshot(format?.border),
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

  if (columns.length === 0 || columns.every((column) => column.computed)) {
    return null;
  }

  const rows = (Array.isArray(input.rows) ? input.rows : [])
    .slice(0, 600)
    .map((row, index) => normalizeMeasurementSheetRowSnapshot(row, columns, index));
  const rowIds = new Set(rows.map((row) => row.id));
  const columnIds = new Set(columns.filter((column) => !column.computed).map((column) => column.id));
  const merges = (Array.isArray(input.merges) ? input.merges : [])
    .slice(0, 200)
    .map((merge) => normalizeMeasurementSheetMergeSnapshot(merge, rowIds, columnIds))
    .filter(Boolean);

  return {
    columns,
    rows,
    merges,
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

  return {
    serviceId: normalizeId(item.serviceId || item.id),
    name,
    serviceCode,
    linkedTemplateIds,
    linkedTemplateTitles: Array.from(new Set(linkedTemplateTitles)),
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

    const normalizedItem = {
      serviceId: serviceId || current?.serviceId || "",
      name: name || current?.name || "",
      serviceCode: serviceCode || current?.serviceCode || "",
      ...templateSnapshot,
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
      body: "Na temelju {{LEGAL_REFERENCES_INLINE}} izvrsen je pregled sustava za {{COMPANY_NAME}} na lokaciji {{LOCATION_NAME}}.",
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
      source: normalizeDocumentTemplateFieldSource(field?.source ?? field?.bindingSource),
      signatureArea: normalizeText(field?.signatureArea).toLowerCase() || "elektro",
      defaultValue: normalizeText(field?.defaultValue),
      helpText: normalizeText(field?.helpText),
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

  return (compact || "SD").slice(0, 4);
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
      const grossTotal = roundCurrencyAmount(quantity * unitPrice);
      const discountRate = normalizeOfferDiscountRate(item?.discountRate);
      const discountTotal = roundCurrencyAmount(grossTotal * (discountRate / 100));

      return {
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

function normalizeVehicleInteger(value, fallback = null) {
  const raw = normalizeText(value);

  if (!raw) {
    return fallback;
  }

  const numeric = Math.round(normalizeFiniteNumber(raw, Number.NaN));
  return Number.isFinite(numeric) ? Math.max(0, numeric) : fallback;
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

  const fallbackLocationScope = normalizeId(
    hasOwn(input, "locationId") ? input.locationId : current?.locationId,
  ) ? "single" : "none";
  const nextLocationScope = hasOwn(input, "locationScope")
    ? normalizeOfferLocationScope(input.locationScope, fallbackLocationScope)
    : normalizeOfferLocationScope(current?.locationScope, fallbackLocationScope);
  const locationWasExplicitlyChanged = hasOwn(input, "locationId") || hasOwn(input, "locationScope");
  let locationId = nextLocationScope === "single"
    ? (hasOwn(input, "locationId") ? normalizeId(input.locationId) : normalizeId(current?.locationId))
    : "";

  if (nextLocationScope === "single" && !locationId) {
    throw new Error("Odaberi lokaciju ili odaberi Sve lokacije / Bez lokacije.");
  }

  if (locationId) {
    const belongsToCompany = (state.locations ?? []).some((item) => item.id === locationId && item.companyId === companyId);

    if (!belongsToCompany) {
      if (locationWasExplicitlyChanged) {
        throw new Error("Odabrana lokacija ne pripada tvrtki.");
      }

      locationId = "";
    }
  }

  const locationScope = nextLocationScope === "single" && !locationId ? "none" : nextLocationScope;
  const location = locationScope === "single" ? findOfferLocation(state, locationId, companyId) : null;
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
  const selectedContact = locationScope === "single" && location
    ? selectLocationContact(location, hasOwn(input, "contactSlot") ? input.contactSlot : current?.contactSlot)
    : null;
  const fallbackOfferDate = current?.offerDate ?? timestamp.slice(0, 10);
  const offerDate = hasOwn(input, "offerDate")
    ? (normalizeOptionalDate(input.offerDate) ?? timestamp.slice(0, 10))
    : (normalizeOptionalDate(fallbackOfferDate) ?? timestamp.slice(0, 10));
  const contactSlot = locationScope === "single"
    ? normalizeText(hasOwn(input, "contactSlot") ? input.contactSlot : current?.contactSlot ?? selectedContact?.slot)
    : "";
  const contactName = locationScope === "single"
    ? (hasOwn(input, "contactName")
      ? normalizeText(input.contactName)
      : (normalizeText(current?.contactName) || selectedContact?.name || ""))
    : "";
  const contactPhone = locationScope === "single"
    ? (hasOwn(input, "contactPhone")
      ? normalizeText(input.contactPhone)
      : (normalizeText(current?.contactPhone) || selectedContact?.phone || ""))
    : "";
  const contactEmail = locationScope === "single"
    ? (hasOwn(input, "contactEmail")
      ? normalizeText(input.contactEmail)
      : (normalizeText(current?.contactEmail) || selectedContact?.email || ""))
    : "";
  const locationName = locationScope === "all"
    ? "Sve lokacije"
    : locationScope === "none"
      ? "Bez lokacije"
      : (location?.name ?? "");

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: company.name,
    companyOib: company.oib ?? "",
    headquarters: company.headquarters ?? "",
    locationId,
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
    authorLabel: normalizeText(input.authorLabel) || "Safety360",
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
  const serviceCode = requireText(input.serviceCode, "Sifra usluge");
  const normalizedTemplateIds = deriveServiceTemplateSnapshot(
    state,
    hasOwn(input, "linkedTemplateIds") ? input.linkedTemplateIds : [],
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
    linkedTemplateIds: normalizedTemplateIds.linkedTemplateIds,
    linkedTemplateTitles: normalizedTemplateIds.linkedTemplateTitles,
    note: normalizeText(input.note),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateServiceCatalogItem(current, patch, state, now = isoNow) {
  const organizationId = hasOwn(patch, "organizationId")
    ? requireText(patch.organizationId, "Organizacija")
    : current.organizationId;
  const serviceCode = hasOwn(patch, "serviceCode")
    ? requireText(patch.serviceCode, "Sifra usluge")
    : current.serviceCode;
  const templateSnapshot = hasOwn(patch, "linkedTemplateIds")
    ? deriveServiceTemplateSnapshot(state, patch.linkedTemplateIds, current.linkedTemplateTitles)
    : deriveServiceTemplateSnapshot(state, current.linkedTemplateIds, current.linkedTemplateTitles);

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
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
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
  const inventoryNumber = normalizeText(input.inventoryNumber);
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
    inventoryNumber,
    requiresCalibration: normalizeBoolean(input.requiresCalibration, false),
    calibrationDate: normalizeOptionalDate(input.calibrationDate),
    calibrationPeriod: normalizeText(input.calibrationPeriod),
    validUntil: normalizeOptionalDate(input.validUntil),
    note: normalizeText(input.note),
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
    documents: normalizeAttachmentDocuments(input.documents),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateMeasurementEquipmentItem(current, patch, state, now = isoNow) {
  const inventoryNumber = hasOwn(patch, "inventoryNumber")
    ? normalizeText(patch.inventoryNumber)
    : current.inventoryNumber;
  const organizationId = hasOwn(patch, "organizationId")
    ? requireText(patch.organizationId, "Organizacija")
    : current.organizationId;
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
    inventoryNumber,
    requiresCalibration: hasOwn(patch, "requiresCalibration")
      ? normalizeBoolean(patch.requiresCalibration, false)
      : current.requiresCalibration,
    calibrationDate: hasOwn(patch, "calibrationDate")
      ? normalizeOptionalDate(patch.calibrationDate)
      : current.calibrationDate,
    calibrationPeriod: hasOwn(patch, "calibrationPeriod")
      ? normalizeText(patch.calibrationPeriod)
      : current.calibrationPeriod,
    validUntil: hasOwn(patch, "validUntil")
      ? normalizeOptionalDate(patch.validUntil)
      : current.validUntil,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    linkedTemplateIds: templateSnapshot.linkedTemplateIds,
    linkedTemplateTitles: templateSnapshot.linkedTemplateTitles,
    documents: hasOwn(patch, "documents")
      ? normalizeAttachmentDocuments(patch.documents)
      : normalizeAttachmentDocuments(current.documents),
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
      item.inventoryNumber,
      item.note,
      item.calibrationPeriod,
      ...(item.linkedTemplateTitles ?? []),
      ...(item.documents ?? []).flatMap((document) => [
        document.fileName,
        document.description,
        document.documentCategory,
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

    return `${left.name} ${left.inventoryNumber}`.localeCompare(`${right.name} ${right.inventoryNumber}`, "hr");
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

  return {
    id: createId(),
    organizationId: requireText(input.organizationId, "Organizacija"),
    title: requireText(input.title, "Ime ovlaštenja"),
    scope: normalizeText(input.scope ?? input.authorizationScope),
    issuedOn: normalizeOptionalDate(input.issuedOn ?? input.issuedAt),
    validUntil: normalizeOptionalDate(input.validUntil),
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
    validUntil: hasOwn(patch, "validUntil")
      ? normalizeOptionalDate(patch.validUntil)
      : current.validUntil,
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
    if (left.validUntil && right.validUntil && left.validUntil !== right.validUntil) {
      return left.validUntil.localeCompare(right.validUntil);
    }

    if (left.validUntil && !right.validUntil) {
      return -1;
    }

    if (!left.validUntil && right.validUntil) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
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

  return {
    ...base,
    executor1: executors[0] ?? "",
    executor2: executors[1] ?? "",
    executors,
    measurementSheet,
    serviceItems,
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
      item.contactName,
      item.serviceLine,
      item.createdByLabel,
      item.note,
      ...(item.items ?? []).map((entry) => entry.description),
      ...(item.items ?? []).flatMap((entry) => (entry.breakdowns ?? []).map((detail) => detail.label)),
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
    throw new Error("Rezervacija vozila nije pronadena.");
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
      vehicle.make,
      vehicle.model,
      vehicle.category,
      vehicle.color,
      vehicle.notes,
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
    label: executors.length ? executors.join(" + ") : "Bez izvrsitelja",
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
        fallback: "Safety360",
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
        fallback: "Safety360",
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
        fallback: "Bez izvrsitelja",
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
      subtitle: [entry.assignedToLabel, entry.workOrderNumber].filter(Boolean).join(" · ") || "Bez izvrsitelja",
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
      fallback: "Bez izvrsitelja",
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
