import {
  evaluateMeasurementFormula,
  isMeasurementFormula,
  parseMeasurementCellReference,
} from "./measurementFormula.js";
import {
  formatMeasurementComputedDisplayValue,
  normalizeMeasurementCellFormat,
} from "./measurementFormatting.js";

function parseMeasurementNumber(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMeasurementLiteralValue(rawValue) {
  const stringValue = String(rawValue ?? "").trim();

  if (!stringValue) {
    return "";
  }

  if (stringValue.toUpperCase() === "TRUE") {
    return true;
  }

  if (stringValue.toUpperCase() === "FALSE") {
    return false;
  }

  const numericPattern = /^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/;

  if (numericPattern.test(stringValue)) {
    const numericValue = parseMeasurementNumber(stringValue);

    if (numericValue !== null) {
      return numericValue;
    }
  }

  return rawValue ?? "";
}

function getMeasurementAverageValue(row) {
  const values = ["reading1", "reading2", "reading3"]
    .map((key) => parseMeasurementNumber(row?.cells?.[key]))
    .filter((value) => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeMeasurementVLookupComparableValue(value = "") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const numeric = Number(trimmed.replace(",", "."));
    if (trimmed && Number.isFinite(numeric)) {
      return `n:${numeric}`;
    }
    return `s:${trimmed.toUpperCase()}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `n:${value}`;
  }

  if (typeof value === "boolean") {
    return `b:${value ? 1 : 0}`;
  }

  return `s:${String(value ?? "").trim().toUpperCase()}`;
}

function resolveMeasurementFormulaRangeDescriptor(startReference, endReference, sheet) {
  const start = parseMeasurementCellReference(startReference);
  const end = parseMeasurementCellReference(endReference);
  return {
    targetSheet: sheet,
    startRowIndex: Math.max(0, Math.min(start.rowIndex, end.rowIndex)),
    endRowIndex: Math.max(start.rowIndex, end.rowIndex),
    startColumnIndex: Math.max(0, Math.min(start.columnIndex, end.columnIndex)),
    endColumnIndex: Math.max(start.columnIndex, end.columnIndex),
  };
}

function getMeasurementSheetFormulaComputedRawValue(sheet, rowIndex, columnIndex, stack = new Set(), formulaCache = null) {
  const row = sheet?.rows?.[rowIndex];
  const column = sheet?.columns?.[columnIndex];

  if (!row || !column) {
    return "";
  }

  const cellKey = `${rowIndex}:${columnIndex}`;
  if (formulaCache?.values?.has(cellKey)) {
    return formulaCache.values.get(cellKey);
  }

  if (column.computed === "average") {
    const averageValue = getMeasurementAverageValue(row) ?? "";
    formulaCache?.values?.set(cellKey, averageValue);
    return averageValue;
  }

  const rawValue = row.cells?.[column.id] ?? "";

  if (!isMeasurementFormula(rawValue)) {
    const literalValue = normalizeMeasurementLiteralValue(rawValue);
    formulaCache?.values?.set(cellKey, literalValue);
    return literalValue;
  }

  if (stack.has(cellKey)) {
    throw new Error("Kruzna referenca u formuli.");
  }

  stack.add(cellKey);

  try {
    const computedValue = evaluateMeasurementFormula(rawValue, {
      currentRowIndex: rowIndex,
      currentColumnIndex: columnIndex,
      resolveCellReference(reference) {
        const { rowIndex: referenceRowIndex, columnIndex: referenceColumnIndex } =
          parseMeasurementCellReference(reference);

        if (
          referenceRowIndex < 0
          || referenceColumnIndex < 0
          || referenceRowIndex >= (sheet?.rows?.length || 0)
          || referenceColumnIndex >= (sheet?.columns?.length || 0)
        ) {
          throw new Error("Referenca nije valjana.");
        }

        return getMeasurementSheetFormulaComputedRawValue(
          sheet,
          referenceRowIndex,
          referenceColumnIndex,
          stack,
          formulaCache,
        );
      },
      resolveVLookup(startReference, endReference, lookupValue, columnIndexValue) {
        if (!formulaCache?.lookups) {
          return { handled: false };
        }

        const descriptor = resolveMeasurementFormulaRangeDescriptor(startReference, endReference, sheet);
        const normalizedColumnIndex = Math.floor(Number(columnIndexValue)) - 1;
        const rangeWidth = descriptor.endColumnIndex - descriptor.startColumnIndex + 1;

        if (!Number.isFinite(normalizedColumnIndex) || normalizedColumnIndex < 0 || normalizedColumnIndex >= rangeWidth) {
          throw new Error("VLOOKUP indeks kolone izlazi izvan raspona.");
        }

        const lookupCacheKey = [
          descriptor.startRowIndex,
          descriptor.endRowIndex,
          descriptor.startColumnIndex,
        ].join(":");
        let rowIndexByValue = formulaCache.lookups.get(lookupCacheKey);

        if (!rowIndexByValue) {
          rowIndexByValue = new Map();
          for (let referenceRowIndex = descriptor.startRowIndex; referenceRowIndex <= descriptor.endRowIndex; referenceRowIndex += 1) {
            if (referenceRowIndex >= (descriptor.targetSheet?.rows?.length || 0)) {
              break;
            }
            const firstValue = getMeasurementSheetFormulaComputedRawValue(
              descriptor.targetSheet,
              referenceRowIndex,
              descriptor.startColumnIndex,
              stack,
              formulaCache,
            );
            const key = normalizeMeasurementVLookupComparableValue(firstValue);
            if (!rowIndexByValue.has(key)) {
              rowIndexByValue.set(key, referenceRowIndex);
            }
          }
          formulaCache.lookups.set(lookupCacheKey, rowIndexByValue);
        }

        const targetRowIndex = rowIndexByValue.get(normalizeMeasurementVLookupComparableValue(lookupValue));
        if (!Number.isInteger(targetRowIndex)) {
          throw new Error("VLOOKUP nije pronasao trazenu vrijednost.");
        }

        return {
          handled: true,
          value: getMeasurementSheetFormulaComputedRawValue(
            descriptor.targetSheet,
            targetRowIndex,
            descriptor.startColumnIndex + normalizedColumnIndex,
            stack,
            formulaCache,
          ),
        };
      },
      resolveRange(startReference, endReference) {
        const descriptor = resolveMeasurementFormulaRangeDescriptor(startReference, endReference, sheet);
        const matrix = [];

        for (let referenceRowIndex = descriptor.startRowIndex; referenceRowIndex <= descriptor.endRowIndex; referenceRowIndex += 1) {
          const rowValues = [];
          for (let referenceColumnIndex = descriptor.startColumnIndex; referenceColumnIndex <= descriptor.endColumnIndex; referenceColumnIndex += 1) {
            if (
              referenceRowIndex < 0
              || referenceColumnIndex < 0
              || referenceRowIndex >= (descriptor.targetSheet?.rows?.length || 0)
              || referenceColumnIndex >= (descriptor.targetSheet?.columns?.length || 0)
            ) {
              rowValues.push("");
              continue;
            }

            rowValues.push(getMeasurementSheetFormulaComputedRawValue(
              descriptor.targetSheet,
              referenceRowIndex,
              referenceColumnIndex,
              stack,
              formulaCache,
            ));
          }
          matrix.push(rowValues);
        }

        return matrix;
      },
    });
    formulaCache?.values?.set(cellKey, computedValue);
    return computedValue;
  } finally {
    stack.delete(cellKey);
  }
}

function getMeasurementCellFormat(sheet, rowIndex, columnIndex) {
  const row = sheet?.rows?.[rowIndex];
  const column = sheet?.columns?.[columnIndex];
  return normalizeMeasurementCellFormat(row?.formats?.[column?.id]);
}

self.addEventListener("message", (event) => {
  const payload = event.data || {};

  if (payload.type !== "compute") {
    return;
  }

  const startedAt = performance.now();
  const sheet = payload.sheet || {};
  const formulaCache = {
    values: new Map(),
    lookups: new Map(),
  };

  const results = (Array.isArray(payload.cells) ? payload.cells : []).map((cell) => {
    const rowIndex = Number(cell?.rowIndex);
    const columnIndex = Number(cell?.columnIndex);

    try {
      const rawValue = getMeasurementSheetFormulaComputedRawValue(sheet, rowIndex, columnIndex, new Set(), formulaCache);
      return {
        rowIndex,
        columnIndex,
        displayText: formatMeasurementComputedDisplayValue(
          rawValue,
          getMeasurementCellFormat(sheet, rowIndex, columnIndex),
        ),
        error: "",
      };
    } catch (error) {
      return {
        rowIndex,
        columnIndex,
        displayText: "#ERROR",
        error: error?.message || "Formula nije valjana.",
      };
    }
  });

  self.postMessage({
    type: "compute-result",
    requestId: payload.requestId,
    revision: payload.revision,
    results,
    durationMs: performance.now() - startedAt,
  });
});
