export function createMeasurementSheetSnapshotController({
  getSheet,
  normalizeSheet,
  normalizeColumn,
  normalizeColumnValidation,
  normalizeRow,
  normalizeMerge,
  normalizeHeaderRows,
  buildDefaultColumns,
  createDefaultRow,
  defaultRowCount,
  virtualRowHeight,
  clearScheduledRefresh,
  cancelAnimationFrame,
  invalidateFormulaCache,
  syncCounters,
  syncHeader,
  renderSheet,
  isRowMeaningful,
  isStructureCustomized,
  ensureStructure,
} = {}) {
  const getCurrentSheet = () => {
    const sheet = typeof getSheet === "function" ? getSheet() : null;
    if (!sheet || typeof sheet !== "object") {
      throw new Error("Measurement sheet state is not available.");
    }
    return sheet;
  };

  const applySnapshot = (snapshot = null) => {
    const sheetState = getCurrentSheet();
    clearScheduledRefresh?.();
    if (sheetState.viewport?.scrollRenderFrame) {
      cancelAnimationFrame?.(sheetState.viewport.scrollRenderFrame);
    }
    const normalized = normalizeSheet?.(snapshot);
    const columns = normalized?.columns?.length
      ? normalized.columns.map((column, index) => normalizeColumn(column, index))
      : buildDefaultColumns();
    const editableColumnIds = new Set(columns.filter((column) => !column.computed).map((column) => column.id));
    const normalizedColumns = columns.map((column) => ({
      ...column,
      validation: typeof normalizeColumnValidation === "function"
        ? normalizeColumnValidation(column.validation, editableColumnIds, column.id)
        : column.validation,
    }));
    const rows = normalized?.rows?.length
      ? normalized.rows.map((row, index) => normalizeRow(row, normalizedColumns, index))
      : Array.from({ length: defaultRowCount }, () => createDefaultRow());
    const merges = (normalized?.merges ?? [])
      .map((merge) => normalizeMerge(merge, rows, normalizedColumns))
      .filter(Boolean);
    const headerRows = normalizeHeaderRows(normalized?.headerRows, rows);

    sheetState.columns = normalizedColumns;
    sheetState.rows = rows;
    sheetState.merges = merges;
    sheetState.headerRows = headerRows;
    sheetState.resizing = null;
    sheetState.activeCell = null;
    sheetState.editingCell = null;
    sheetState.editorSource = null;
    sheetState.formulaReferences = [];
    invalidateFormulaCache?.();
    sheetState.lastPersistFingerprint = "";
    sheetState.viewport = {
      virtual: false,
      startRowIndex: 0,
      endRowIndex: -1,
      virtualColumns: false,
      startColumnIndex: 0,
      endColumnIndex: -1,
      rowHeight: virtualRowHeight,
      scrollRenderFrame: sheetState.viewport?.scrollRenderFrame || 0,
    };
    sheetState.selectionAnchor = null;
    sheetState.selectedRange = null;
    sheetState.selectionDrag = null;
    sheetState.fillDrag = null;
    sheetState.fillMenu = null;
    sheetState.contextMenu = null;
    syncCounters?.();
    syncHeader?.();

    if (sheetState.isOpen) {
      renderSheet?.();
    }
  };

  const buildSnapshot = ({ includeBlankStructure = false } = {}) => {
    ensureStructure?.();
    const sheetState = getCurrentSheet();
    const columns = sheetState.columns.map((column, index) => normalizeColumn(column, index));
    const rows = sheetState.rows.map((row, index) => normalizeRow(row, columns, index));
    const merges = (sheetState.merges ?? [])
      .map((merge) => normalizeMerge(merge, rows, columns))
      .filter(Boolean);
    const headerRows = normalizeHeaderRows(sheetState.headerRows, rows);
    const lastMeaningfulRowIndex = rows.reduce((lastIndex, row, index) => (
      isRowMeaningful(row, columns) ? index : lastIndex
    ), -1);
    const hasMeaningfulRows = lastMeaningfulRowIndex >= 0;
    const hasCustomStructure = isStructureCustomized(columns);

    if (!includeBlankStructure && !hasMeaningfulRows && !hasCustomStructure && merges.length === 0 && headerRows.length === 0) {
      return null;
    }

    const keepRowCount = hasMeaningfulRows
      ? Math.max(defaultRowCount, Math.min(rows.length, lastMeaningfulRowIndex + 4))
      : Math.max(defaultRowCount, Math.min(rows.length || defaultRowCount, 40));

    return {
      columns,
      rows: rows.slice(0, keepRowCount),
      merges,
      headerRows: normalizeHeaderRows(headerRows, rows.slice(0, keepRowCount)),
    };
  };

  return {
    applySnapshot,
    buildSnapshot,
  };
}
