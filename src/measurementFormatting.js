const DEFAULT_MEASUREMENT_FORMAT = Object.freeze({
  type: "general",
  decimals: 2,
  border: Object.freeze({
    top: false,
    right: false,
    bottom: false,
    left: false,
  }),
});

const BORDER_PRESETS = new Set(["none", "all", "top", "right", "bottom", "left"]);

function clampMeasurementDecimals(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_MEASUREMENT_FORMAT.decimals;
  }

  return Math.min(6, Math.max(0, parsed));
}

function parseMeasurementNumericValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value ?? "").trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMeasurementNumberValue(value, decimals) {
  return new Intl.NumberFormat("hr-HR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatMeasurementPercentValue(value, decimals) {
  return new Intl.NumberFormat("hr-HR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value).replace(/[\s\u00A0]+%$/, "%");
}

export function normalizeMeasurementBorder(border = {}) {
  if (typeof border === "string") {
    if (!BORDER_PRESETS.has(border)) {
      return { ...DEFAULT_MEASUREMENT_FORMAT.border };
    }

    if (border === "none") {
      return { ...DEFAULT_MEASUREMENT_FORMAT.border };
    }

    if (border === "all") {
      return {
        top: true,
        right: true,
        bottom: true,
        left: true,
      };
    }

    return {
      top: border === "top",
      right: border === "right",
      bottom: border === "bottom",
      left: border === "left",
    };
  }

  return {
    top: Boolean(border?.top),
    right: Boolean(border?.right),
    bottom: Boolean(border?.bottom),
    left: Boolean(border?.left),
  };
}

export function getMeasurementBorderPreset(border = {}) {
  const normalized = normalizeMeasurementBorder(border);
  const sides = Object.entries(normalized)
    .filter(([, enabled]) => enabled)
    .map(([side]) => side);

  if (sides.length === 0) {
    return "none";
  }

  if (sides.length === 4) {
    return "all";
  }

  if (sides.length === 1) {
    return sides[0];
  }

  return "custom";
}

export function normalizeMeasurementCellFormat(format = {}) {
  const type = ["general", "number", "integer", "percent", "text"].includes(format?.type)
    ? format.type
    : DEFAULT_MEASUREMENT_FORMAT.type;

  return {
    type,
    decimals: clampMeasurementDecimals(format?.decimals),
    border: normalizeMeasurementBorder(format?.border),
  };
}

export function formatMeasurementLiteralDisplayValue(rawValue, format = DEFAULT_MEASUREMENT_FORMAT) {
  const normalizedFormat = normalizeMeasurementCellFormat(format);
  const textValue = String(rawValue ?? "");

  if (!textValue) {
    return "";
  }

  if (normalizedFormat.type === "general" || normalizedFormat.type === "text") {
    return textValue;
  }

  const numericValue = parseMeasurementNumericValue(textValue);

  if (numericValue === null) {
    return textValue;
  }

  if (normalizedFormat.type === "integer") {
    return formatMeasurementNumberValue(Math.round(numericValue), 0);
  }

  if (normalizedFormat.type === "percent") {
    return formatMeasurementPercentValue(numericValue, normalizedFormat.decimals);
  }

  return formatMeasurementNumberValue(numericValue, normalizedFormat.decimals);
}

export function formatMeasurementComputedDisplayValue(value, format = DEFAULT_MEASUREMENT_FORMAT) {
  const normalizedFormat = normalizeMeasurementCellFormat(format);

  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (normalizedFormat.type === "general") {
    if (typeof value === "number") {
      return new Intl.NumberFormat("hr-HR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
      }).format(value);
    }

    if (typeof value === "boolean") {
      return value ? "TRUE" : "FALSE";
    }

    return String(value);
  }

  if (normalizedFormat.type === "text") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  const numericValue = parseMeasurementNumericValue(value);

  if (numericValue === null) {
    return String(value);
  }

  if (normalizedFormat.type === "integer") {
    return formatMeasurementNumberValue(Math.round(numericValue), 0);
  }

  if (normalizedFormat.type === "percent") {
    return formatMeasurementPercentValue(numericValue, normalizedFormat.decimals);
  }

  return formatMeasurementNumberValue(numericValue, normalizedFormat.decimals);
}
