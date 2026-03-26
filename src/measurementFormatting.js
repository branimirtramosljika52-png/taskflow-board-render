const DEFAULT_MEASUREMENT_FORMAT = Object.freeze({
  type: "general",
  decimals: 2,
});

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

export function normalizeMeasurementCellFormat(format = {}) {
  const type = ["general", "number", "integer", "percent", "text"].includes(format?.type)
    ? format.type
    : DEFAULT_MEASUREMENT_FORMAT.type;

  return {
    type,
    decimals: clampMeasurementDecimals(format?.decimals),
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
