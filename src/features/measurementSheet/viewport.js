import {
  MEASUREMENT_COLUMN_MIN_WIDTH,
  MEASUREMENT_COLUMN_VIRTUALIZATION_MIN_CELLS,
  MEASUREMENT_COLUMN_VIRTUALIZATION_MIN_COLUMNS,
  MEASUREMENT_COLUMN_VIRTUALIZATION_OVERSCAN_COLUMNS,
  MEASUREMENT_VIRTUALIZATION_MIN_CELLS,
  MEASUREMENT_VIRTUALIZATION_MIN_ROWS,
  MEASUREMENT_VIRTUALIZATION_OVERSCAN_ROWS,
  MEASUREMENT_VIRTUALIZATION_ROW_HEIGHT,
} from "./config.js";

export function createMeasurementSheetViewportController({
  getSheet,
  getGridWrap,
  getBody,
  isLightCellRenderEnabled,
  renderSheet,
  documentRef = document,
  windowRef = window,
} = {}) {
  const getCurrentSheet = () => getSheet?.() ?? {};
  const getRowHeightEstimate = () => Math.max(
    28,
    Number(getCurrentSheet().viewport?.rowHeight) || MEASUREMENT_VIRTUALIZATION_ROW_HEIGHT,
  );

  const canVirtualizeRows = () => {
    const sheet = getCurrentSheet();
    const rowCount = sheet.rows?.length || 0;
    const columnCount = sheet.columns?.length || 0;
    const cellCount = rowCount * columnCount;

    return Boolean(isLightCellRenderEnabled?.())
      && rowCount >= MEASUREMENT_VIRTUALIZATION_MIN_ROWS
      && cellCount >= MEASUREMENT_VIRTUALIZATION_MIN_CELLS
      && !(sheet.merges ?? []).length;
  };

  const canVirtualizeColumns = () => {
    const sheet = getCurrentSheet();
    const rowCount = sheet.rows?.length || 0;
    const columnCount = sheet.columns?.length || 0;
    const cellCount = rowCount * columnCount;

    return Boolean(isLightCellRenderEnabled?.())
      && columnCount >= MEASUREMENT_COLUMN_VIRTUALIZATION_MIN_COLUMNS
      && cellCount >= MEASUREMENT_COLUMN_VIRTUALIZATION_MIN_CELLS
      && !(sheet.merges ?? []).length;
  };

  const getColumnWidth = (column = {}) => Math.max(MEASUREMENT_COLUMN_MIN_WIDTH, Number(column?.width) || 140);

  const getColumnWidthMetrics = () => {
    const sheet = getCurrentSheet();
    const columns = sheet.columns ?? [];
    const key = columns
      .map((column) => `${column?.id || ""}:${Math.max(MEASUREMENT_COLUMN_MIN_WIDTH, Number(column?.width) || 140)}`)
      .join("|");

    if (sheet.viewportColumnMetrics?.key === key) {
      return sheet.viewportColumnMetrics;
    }

    const widths = columns.map(getColumnWidth);
    const offsets = [];
    let totalWidth = 0;
    widths.forEach((width) => {
      offsets.push(totalWidth);
      totalWidth += width;
    });

    sheet.viewportColumnMetrics = {
      key,
      widths,
      offsets,
      totalWidth,
    };
    return sheet.viewportColumnMetrics;
  };

  const getColumnVirtualWindow = () => {
    const sheet = getCurrentSheet();
    const columnCount = sheet.columns?.length || 0;
    const fullWindow = {
      virtualColumns: false,
      startColumnIndex: 0,
      endColumnIndex: columnCount - 1,
      leftSpacerWidth: 0,
      rightSpacerWidth: 0,
    };

    const gridWrap = getGridWrap?.();
    if (!canVirtualizeColumns() || !gridWrap || columnCount <= 0) {
      return fullWindow;
    }

    const scrollLeft = Math.max(0, gridWrap.scrollLeft || 0);
    const viewportWidth = Math.max(gridWrap.clientWidth || 0, 640);
    const { widths, offsets, totalWidth } = getColumnWidthMetrics();
    let runningLeft = 0;
    let startColumnIndex = 0;

    while (
      startColumnIndex < columnCount - 1
      && runningLeft + widths[startColumnIndex] < scrollLeft
    ) {
      runningLeft += widths[startColumnIndex];
      startColumnIndex += 1;
    }

    startColumnIndex = Math.max(0, startColumnIndex - MEASUREMENT_COLUMN_VIRTUALIZATION_OVERSCAN_COLUMNS);
    const visibleRight = scrollLeft + viewportWidth;
    let endColumnIndex = startColumnIndex;

    while (
      endColumnIndex < columnCount - 1
      && offsets[endColumnIndex] + widths[endColumnIndex] < visibleRight
    ) {
      endColumnIndex += 1;
    }

    endColumnIndex = Math.min(
      columnCount - 1,
      endColumnIndex + MEASUREMENT_COLUMN_VIRTUALIZATION_OVERSCAN_COLUMNS,
    );

    const leftSpacerWidth = offsets[startColumnIndex] || 0;
    const rightSpacerWidth = Math.max(0, totalWidth - ((offsets[endColumnIndex] || 0) + (widths[endColumnIndex] || 0)));

    return {
      virtualColumns: true,
      startColumnIndex,
      endColumnIndex,
      leftSpacerWidth,
      rightSpacerWidth,
    };
  };

  const getVirtualWindow = () => {
    const sheet = getCurrentSheet();
    const rowCount = sheet.rows?.length || 0;
    const columnWindow = getColumnVirtualWindow();
    const fullWindow = {
      virtual: false,
      startRowIndex: 0,
      endRowIndex: rowCount - 1,
      topSpacerRows: 0,
      bottomSpacerRows: 0,
      rowHeight: getRowHeightEstimate(),
      ...columnWindow,
    };

    const gridWrap = getGridWrap?.();
    if (!canVirtualizeRows() || !gridWrap || rowCount <= 0) {
      return fullWindow;
    }

    const rowHeight = getRowHeightEstimate();
    const viewportHeight = Math.max(gridWrap.clientHeight || 0, rowHeight * 14);
    const scrollTop = Math.max(0, gridWrap.scrollTop || 0);
    const visibleStart = Math.floor(scrollTop / rowHeight);
    const visibleRows = Math.ceil(viewportHeight / rowHeight);
    const startRowIndex = Math.max(0, visibleStart - MEASUREMENT_VIRTUALIZATION_OVERSCAN_ROWS);
    const endRowIndex = Math.min(
      rowCount - 1,
      visibleStart + visibleRows + MEASUREMENT_VIRTUALIZATION_OVERSCAN_ROWS,
    );

    return {
      virtual: true,
      startRowIndex,
      endRowIndex,
      topSpacerRows: startRowIndex,
      bottomSpacerRows: Math.max(0, rowCount - endRowIndex - 1),
      rowHeight,
      ...columnWindow,
    };
  };

  const syncVirtualViewport = (windowState) => {
    const sheet = getCurrentSheet();
    const current = sheet.viewport ?? {};
    sheet.viewport = {
      virtual: Boolean(windowState?.virtual),
      startRowIndex: Number.isInteger(windowState?.startRowIndex) ? windowState.startRowIndex : 0,
      endRowIndex: Number.isInteger(windowState?.endRowIndex) ? windowState.endRowIndex : -1,
      virtualColumns: Boolean(windowState?.virtualColumns),
      startColumnIndex: Number.isInteger(windowState?.startColumnIndex) ? windowState.startColumnIndex : 0,
      endColumnIndex: Number.isInteger(windowState?.endColumnIndex) ? windowState.endColumnIndex : -1,
      rowHeight: Math.max(
        28,
        Number(windowState?.rowHeight) || Number(current.rowHeight) || MEASUREMENT_VIRTUALIZATION_ROW_HEIGHT,
      ),
      scrollRenderFrame: current.scrollRenderFrame || 0,
    };
  };

  const getRenderedRowIndexBounds = () => {
    const sheet = getCurrentSheet();
    const viewport = sheet.viewport ?? {};
    const rowCount = sheet.rows?.length || 0;

    if (!viewport.virtual) {
      return {
        startRowIndex: 0,
        endRowIndex: rowCount - 1,
      };
    }

    return {
      startRowIndex: Math.max(0, Number(viewport.startRowIndex) || 0),
      endRowIndex: Math.min(rowCount - 1, Number(viewport.endRowIndex) || 0),
    };
  };

  const getRenderedColumnIndexBounds = () => {
    const sheet = getCurrentSheet();
    const viewport = sheet.viewport ?? {};
    const columnCount = sheet.columns?.length || 0;

    if (!viewport.virtualColumns) {
      return {
        startColumnIndex: 0,
        endColumnIndex: columnCount - 1,
      };
    }

    return {
      startColumnIndex: Math.max(0, Number(viewport.startColumnIndex) || 0),
      endColumnIndex: Math.min(columnCount - 1, Number(viewport.endColumnIndex) || 0),
    };
  };

  const appendVirtualSpacer = (fragment, rowCount) => {
    if (!rowCount || rowCount <= 0) {
      return;
    }

    const sheet = getCurrentSheet();
    const spacerRow = documentRef.createElement("tr");
    spacerRow.className = "measurement-sheet-virtual-spacer";
    const spacerCell = documentRef.createElement("td");
    spacerCell.colSpan = (sheet.columns?.length || 0) + 1;
    spacerCell.style.height = `${Math.round(rowCount * getRowHeightEstimate())}px`;
    spacerRow.append(spacerCell);
    fragment.append(spacerRow);
  };

  const appendVirtualColumnSpacer = (parent, width, tagName = "td") => {
    if (!width || width <= 0) {
      return;
    }

    const cell = documentRef.createElement(tagName);
    cell.className = "measurement-sheet-virtual-column-spacer";
    cell.style.width = `${Math.round(width)}px`;
    cell.style.minWidth = `${Math.round(width)}px`;
    cell.style.maxWidth = `${Math.round(width)}px`;
    parent.append(cell);
  };

  const updateVirtualRowHeightFromDom = () => {
    const sheet = getCurrentSheet();
    const body = getBody?.();
    if (!sheet.viewport?.virtual || !body) {
      return;
    }

    const rowElement = body.querySelector("tr[data-row-id]");
    const measuredHeight = rowElement?.getBoundingClientRect?.().height || 0;
    if (measuredHeight >= 28 && Math.abs(measuredHeight - getRowHeightEstimate()) > 3) {
      sheet.viewport.rowHeight = measuredHeight;
    }
  };

  const ensureCellVisible = (rowIndex, columnIndex = null, { render = false } = {}) => {
    const gridWrap = getGridWrap?.();
    const sheet = getCurrentSheet();
    if (!gridWrap) {
      return false;
    }

    let changed = false;

    if (Number.isInteger(rowIndex) && canVirtualizeRows()) {
      const rowHeight = getRowHeightEstimate();
      const visibleTop = gridWrap.scrollTop || 0;
      const visibleBottom = visibleTop + Math.max(gridWrap.clientHeight || 0, rowHeight);
      const rowTop = rowIndex * rowHeight;
      const rowBottom = rowTop + rowHeight;
      const padding = rowHeight * 2;

      if (!(rowTop >= visibleTop + padding && rowBottom <= visibleBottom - padding)) {
        gridWrap.scrollTop = Math.max(0, rowTop - padding);
        changed = true;
      }
    }

    if (Number.isInteger(columnIndex) && canVirtualizeColumns()) {
      const { widths, offsets } = getColumnWidthMetrics();
      const columnLeft = offsets[columnIndex] || 0;
      const columnRight = columnLeft + (widths[columnIndex] || 0);
      const visibleLeft = gridWrap.scrollLeft || 0;
      const visibleRight = visibleLeft + Math.max(gridWrap.clientWidth || 0, 320);
      const padding = 180;

      if (!(columnLeft >= visibleLeft + padding && columnRight <= visibleRight - padding)) {
        gridWrap.scrollLeft = Math.max(0, columnLeft - padding);
        changed = true;
      }
    }

    if (!changed) {
      return false;
    }

    if (render) {
      renderSheet?.({ invalidateFormulaCache: false });
    }
    return true;
  };

  const scheduleVirtualViewportRender = () => {
    const sheet = getCurrentSheet();
    if (!sheet.isOpen || sheet.editingCell || (!canVirtualizeRows() && !canVirtualizeColumns())) {
      return;
    }

    if (sheet.viewport?.scrollRenderFrame) {
      return;
    }

    sheet.viewport.scrollRenderFrame = windowRef.requestAnimationFrame(() => {
      sheet.viewport.scrollRenderFrame = 0;
      const nextWindow = getVirtualWindow();
      const current = sheet.viewport ?? {};

      if (
        nextWindow.virtual !== Boolean(current.virtual)
        || nextWindow.startRowIndex !== current.startRowIndex
        || nextWindow.endRowIndex !== current.endRowIndex
        || nextWindow.virtualColumns !== Boolean(current.virtualColumns)
        || nextWindow.startColumnIndex !== current.startColumnIndex
        || nextWindow.endColumnIndex !== current.endColumnIndex
      ) {
        renderSheet?.({ invalidateFormulaCache: false });
      }
    });
  };

  return {
    canVirtualizeRows,
    canVirtualizeColumns,
    getRowHeightEstimate,
    getColumnWidth,
    getColumnVirtualWindow,
    getVirtualWindow,
    syncVirtualViewport,
    getRenderedRowIndexBounds,
    getRenderedColumnIndexBounds,
    appendVirtualSpacer,
    appendVirtualColumnSpacer,
    updateVirtualRowHeightFromDom,
    ensureCellVisible,
    ensureRowVisible: (rowIndex, options = {}) => ensureCellVisible(rowIndex, null, options),
    scheduleVirtualViewportRender,
  };
}
