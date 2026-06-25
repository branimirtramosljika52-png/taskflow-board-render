import {
  isMeasurementFormula,
  listMeasurementFormulaReferences,
  parseMeasurementCellReference,
} from "../../measurementFormula.js";
import { MEASUREMENT_VIRTUALIZATION_MIN_CELLS } from "./config.js";

export function createMeasurementSheetFormulaController({
  getSheet,
  buildCurrentSnapshot,
  buildFormulaContext,
  isLightCellRenderEnabled,
  applyWorkerCellResult,
  updatePerformance,
  scheduleComputedRefresh,
  windowRef = typeof window !== "undefined" ? window : null,
} = {}) {
  const getCurrentSheet = () => getSheet?.() ?? {};

  const getWorkerState = () => {
    const sheet = getCurrentSheet();
    if (!sheet.formulaWorker) {
      sheet.formulaWorker = {
        instance: null,
        supported: true,
        sequence: 0,
        pendingKey: "",
        values: new Map(),
      };
    }
    if (!(sheet.formulaWorker.values instanceof Map)) {
      sheet.formulaWorker.values = new Map();
    }
    return sheet.formulaWorker;
  };

  const getFormulaWorkerCellKey = (rowIndex, columnIndex, revision = getCurrentSheet().formulaRevision) =>
    `${revision}:${rowIndex}:${columnIndex}`;

  const invalidateFormulaCache = () => {
    const sheet = getCurrentSheet();
    const workerState = getWorkerState();
    sheet.formulaCache = null;
    sheet.formulaDependencyIndex = null;
    sheet.formulaRevision = (Number(sheet.formulaRevision) || 0) + 1;
    workerState.pendingKey = "";
    workerState.values.clear();
  };

  const getFormulaCellCacheSuffix = (rowIndex, columnIndex) => `:${rowIndex}:${columnIndex}`;

  const deleteFormulaCacheEntry = (rowIndex, columnIndex) => {
    const sheet = getCurrentSheet();
    const suffix = getFormulaCellCacheSuffix(rowIndex, columnIndex);
    sheet.formulaCache?.values?.forEach((value, key) => {
      if (String(key).endsWith(suffix)) {
        sheet.formulaCache.values.delete(key);
      }
    });
    getWorkerState().values.delete(getFormulaWorkerCellKey(rowIndex, columnIndex));
  };

  const getFormulaDependencyIndex = () => {
    const sheet = getCurrentSheet();
    const cacheKey = [
      sheet.rows?.length || 0,
      sheet.columns?.length || 0,
      sheet.formulaRevision || 0,
    ].join(":");

    if (sheet.formulaDependencyIndex?.key === cacheKey) {
      return sheet.formulaDependencyIndex;
    }

    const directDependents = new Map();
    let hasExternalReferences = false;
    (sheet.rows ?? []).forEach((row, rowIndex) => {
      (sheet.columns ?? []).forEach((column, columnIndex) => {
        const rawValue = row?.cells?.[column.id] ?? "";
        if (!isMeasurementFormula(rawValue)) {
          return;
        }

        const formulaKey = `${rowIndex}:${columnIndex}`;
        listMeasurementFormulaReferences(rawValue).forEach((reference) => {
          if (String(reference || "").includes("!")) {
            hasExternalReferences = true;
            return;
          }

          try {
            const parsed = parseMeasurementCellReference(reference);
            const dependencyKey = `${parsed.rowIndex}:${parsed.columnIndex}`;
            const dependents = directDependents.get(dependencyKey) ?? new Set();
            dependents.add(formulaKey);
            directDependents.set(dependencyKey, dependents);
          } catch {
            // Ignore incomplete references while a formula is being edited.
          }
        });
      });
    });

    sheet.formulaDependencyIndex = {
      key: cacheKey,
      directDependents,
      hasExternalReferences,
    };
    return sheet.formulaDependencyIndex;
  };

  const getFormulaDependentCellKeys = (rowIndex, columnIndex) => {
    const index = getFormulaDependencyIndex();
    const visited = new Set();
    const queue = [`${rowIndex}:${columnIndex}`];

    while (queue.length) {
      const key = queue.shift();
      const dependents = index.directDependents.get(key);
      if (!dependents) {
        continue;
      }

      dependents.forEach((dependentKey) => {
        if (visited.has(dependentKey)) {
          return;
        }
        visited.add(dependentKey);
        queue.push(dependentKey);
      });
    }

    return visited;
  };

  const canUseWorker = () => {
    const sheet = getCurrentSheet();
    const workerState = getWorkerState();
    const cellCount = (sheet.rows?.length || 0) * (sheet.columns?.length || 0);
    const WorkerConstructor = windowRef?.Worker ?? (typeof Worker !== "undefined" ? Worker : null);

    return Boolean(workerState?.supported)
      && Boolean(WorkerConstructor)
      && Boolean(isLightCellRenderEnabled?.())
      && cellCount >= MEASUREMENT_VIRTUALIZATION_MIN_CELLS;
  };

  const invalidateFormulaCacheForCell = (rowIndex, columnIndex, { formulaChanged = false } = {}) => {
    if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex) || formulaChanged || canUseWorker()) {
      invalidateFormulaCache();
      return;
    }

    const index = getFormulaDependencyIndex();
    if (index.hasExternalReferences) {
      invalidateFormulaCache();
      return;
    }

    deleteFormulaCacheEntry(rowIndex, columnIndex);
    getFormulaDependentCellKeys(rowIndex, columnIndex).forEach((cellKey) => {
      const [dependentRowIndex, dependentColumnIndex] = cellKey.split(":").map((value) => Number(value));
      deleteFormulaCacheEntry(dependentRowIndex, dependentColumnIndex);
    });
  };

  const getActiveFormulaCache = () => {
    const sheet = getCurrentSheet();
    const currentSheet = buildCurrentSnapshot?.() ?? null;
    const cacheKey = [
      sheet.ownerKind || "",
      sheet.ownerFieldId || "",
      sheet.ownerRuntimeWorkOrderId || "",
      sheet.formulaRevision || 0,
      sheet.rows?.length || 0,
      sheet.columns?.length || 0,
    ].join("|");

    if (sheet.formulaCache?.key === cacheKey) {
      return sheet.formulaCache;
    }

    const formulaContext = buildFormulaContext?.(currentSheet) ?? {};
    sheet.formulaCache = {
      key: cacheKey,
      currentSheet,
      formulaContext,
      values: new Map(),
      lookups: new Map(),
    };
    return sheet.formulaCache;
  };

  const isWorkerEligibleFormula = (value = "") => isMeasurementFormula(value) && !String(value ?? "").includes("!");

  const getWorkerCachedResult = (rowIndex, columnIndex) =>
    getWorkerState().values.get(getFormulaWorkerCellKey(rowIndex, columnIndex)) || null;

  const handleWorkerMessage = (event) => {
    const payload = event.data || {};

    if (payload.type !== "compute-result") {
      return;
    }

    const sheet = getCurrentSheet();
    const workerState = getWorkerState();
    if (Number(payload.revision) !== Number(sheet.formulaRevision)) {
      return;
    }

    workerState.pendingKey = "";
    (Array.isArray(payload.results) ? payload.results : []).forEach((result) => {
      const rowIndex = Number(result.rowIndex);
      const columnIndex = Number(result.columnIndex);
      workerState.values.set(getFormulaWorkerCellKey(rowIndex, columnIndex, payload.revision), result);
      applyWorkerCellResult?.(result);
    });

    updatePerformance?.({
      computeMs: Number(payload.durationMs) || 0,
      workerCells: Array.isArray(payload.results) ? payload.results.length : 0,
    });
  };

  const getWorker = () => {
    const workerState = getWorkerState();
    const WorkerConstructor = windowRef?.Worker ?? (typeof Worker !== "undefined" ? Worker : null);

    if (!workerState.supported || !WorkerConstructor) {
      return null;
    }

    if (workerState.instance) {
      return workerState.instance;
    }

    try {
      const worker = new WorkerConstructor(new URL("../../measurementFormulaWorker.js", import.meta.url), {
        type: "module",
        name: "SafeNexus Excel formulas",
      });
      worker.addEventListener("message", handleWorkerMessage);
      worker.addEventListener("error", () => {
        workerState.supported = false;
        workerState.pendingKey = "";
        worker.terminate();
        workerState.instance = null;
        scheduleComputedRefresh?.({ immediate: true });
      });
      workerState.instance = worker;
      return worker;
    } catch {
      workerState.supported = false;
      return null;
    }
  };

  const requestWorkerCompute = (cells = []) => {
    if (!cells.length || !canUseWorker()) {
      return false;
    }

    const worker = getWorker();
    if (!worker) {
      return false;
    }

    const uniqueCells = [];
    const seen = new Set();
    cells.forEach((cell) => {
      const rowIndex = Number(cell?.rowIndex);
      const columnIndex = Number(cell?.columnIndex);
      const key = `${rowIndex}:${columnIndex}`;
      if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex) || seen.has(key)) {
        return;
      }
      seen.add(key);
      uniqueCells.push({ rowIndex, columnIndex });
    });

    if (!uniqueCells.length) {
      return false;
    }

    const sheet = getCurrentSheet();
    const workerState = getWorkerState();
    const requestKey = [
      sheet.formulaRevision,
      uniqueCells.map((cell) => `${cell.rowIndex}:${cell.columnIndex}`).join(","),
    ].join("|");

    if (workerState.pendingKey === requestKey) {
      return true;
    }

    const requestId = `${Date.now()}-${workerState.sequence += 1}`;
    workerState.pendingKey = requestKey;
    worker.postMessage({
      type: "compute",
      requestId,
      revision: sheet.formulaRevision,
      sheet: buildCurrentSnapshot?.(),
      cells: uniqueCells,
    });
    return true;
  };

  return {
    invalidateFormulaCache,
    deleteFormulaCacheEntry,
    getFormulaDependencyIndex,
    getFormulaDependentCellKeys,
    invalidateFormulaCacheForCell,
    getActiveFormulaCache,
    isWorkerEligibleFormula,
    canUseWorker,
    getFormulaWorkerCellKey,
    getWorkerCachedResult,
    getWorker,
    requestWorkerCompute,
  };
}
