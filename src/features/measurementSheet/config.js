export const DEFAULT_MEASUREMENT_ROW_COUNT = 24;
export const MEASUREMENT_ROW_BATCH_SIZE = 24;
export const MIN_VISIBLE_MEASUREMENT_ROWS = 36;
export const MEASUREMENT_COMPUTE_DEBOUNCE_MS = 90;
export const MEASUREMENT_VIRTUALIZATION_MIN_ROWS = 220;
export const MEASUREMENT_VIRTUALIZATION_MIN_CELLS = 2500;
export const MEASUREMENT_VIRTUALIZATION_OVERSCAN_ROWS = 10;
export const MEASUREMENT_COLUMN_VIRTUALIZATION_MIN_COLUMNS = 14;
export const MEASUREMENT_COLUMN_VIRTUALIZATION_MIN_CELLS = 720;
export const MEASUREMENT_COLUMN_VIRTUALIZATION_OVERSCAN_COLUMNS = 4;
export const MEASUREMENT_VIRTUALIZATION_ROW_HEIGHT = 44;
export const MEASUREMENT_PERF_LOG_LIMIT = 12;
export const MEASUREMENT_LOCAL_DRAFT_PREFIX = "safenexus.measurementSheetDraft";
export const MEASUREMENT_LOCAL_DRAFT_DELAY_MS = 3000;
export const MEASUREMENT_LOCAL_DRAFT_MAX_BYTES = 2_500_000;
export const MEASUREMENT_COLUMN_MIN_WIDTH = 32;

export const DEFAULT_MEASUREMENT_COLUMNS = [
  { id: "point", label: "Mjerno mjesto", placeholder: "", width: 220 },
  { id: "label", label: "Oznaka", placeholder: "", width: 120 },
  { id: "unit", label: "Jedinica", placeholder: "", width: 120 },
  { id: "min", label: "Min", placeholder: "", width: 110 },
  { id: "max", label: "Max", placeholder: "", width: 110 },
  { id: "reading1", label: "Mjerenje 1", placeholder: "", width: 120 },
  { id: "reading2", label: "Mjerenje 2", placeholder: "", width: 120 },
  { id: "reading3", label: "Mjerenje 3", placeholder: "", width: 120 },
  { id: "average", label: "Prosjek", placeholder: "", width: 120, computed: "average", readonly: true },
  { id: "note", label: "Napomena", placeholder: "", width: 240 },
];

export const MEASUREMENT_FONT_FAMILY_STYLES = Object.freeze({
  default: "inherit",
  arial: "Arial, Helvetica, sans-serif",
  calibri: "Calibri, Arial, Helvetica, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  times: "'Times New Roman', Times, serif",
  verdana: "Verdana, Geneva, sans-serif",
  courier: "'Courier New', Courier, monospace",
});

export const MEASUREMENT_TYPE_ORDER = Object.freeze(["general", "number", "integer", "percent", "text"]);
export const MEASUREMENT_TYPE_BUTTON_META = Object.freeze({
  general: Object.freeze({ icon: "123", label: "General" }),
  number: Object.freeze({ icon: "1,23", label: "Broj" }),
  integer: Object.freeze({ icon: "42", label: "Cijeli broj" }),
  percent: Object.freeze({ icon: "%", label: "Postotak" }),
  text: Object.freeze({ icon: "TXT", label: "Tekst" }),
});

export const MEASUREMENT_BORDER_ORDER = Object.freeze(["none", "all", "outline", "top", "bottom", "left", "right"]);
export const MEASUREMENT_BORDER_BUTTON_META = Object.freeze({
  none: Object.freeze({ icon: "[]", label: "Bez obruba" }),
  all: Object.freeze({ icon: "[#]", label: "Svi obrubi" }),
  outline: Object.freeze({ icon: "[ ]", label: "Vanjski obrub" }),
  top: Object.freeze({ icon: "^-", label: "Gornji obrub" }),
  bottom: Object.freeze({ icon: "_", label: "Donji obrub" }),
  left: Object.freeze({ icon: "|[", label: "Lijevi obrub" }),
  right: Object.freeze({ icon: "]|", label: "Desni obrub" }),
});

export const MEASUREMENT_STYLE_PRESETS = Object.freeze({
  title: Object.freeze({
    fontFamily: "default",
    fontSize: 15,
    align: "center",
    bold: true,
    italic: false,
    underline: false,
    fillColor: "#f8e4ff",
  }),
});
