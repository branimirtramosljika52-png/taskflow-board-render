import { groupSelected, ungroupSelected } from "./grouping.js";
import { getBlockById } from "./state.js";

function isEditableTarget(target) {
  return target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']");
}

function isPlainTextKey(event) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function focusEditableNodeAtEnd(node) {
  if (!(node instanceof HTMLElement)) {
    return;
  }
  node.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function focusGridCell(root, blockId, cellIndex) {
  requestAnimationFrame(() => {
    focusEditableNodeAtEnd(root.querySelector(`[data-builder-block-id="${blockId}"] [data-grid-cell-index="${cellIndex}"]`));
  });
}

function focusTableCell(root, blockId, rowIndex, columnIndex) {
  requestAnimationFrame(() => {
    focusEditableNodeAtEnd(root.querySelector(`[data-builder-block-id="${blockId}"] [data-table-cell-row="${rowIndex}"][data-table-cell-column="${columnIndex}"]`));
  });
}

function normalizeGridCell(cell = {}) {
  if (typeof cell === "string") {
    return { content: cell };
  }
  return {
    content: String(cell?.content ?? ""),
    fontFamily: String(cell?.fontFamily ?? ""),
    fontSize: String(cell?.fontSize ?? ""),
    lineHeight: String(cell?.lineHeight ?? ""),
    letterSpacing: String(cell?.letterSpacing ?? ""),
    textTransform: String(cell?.textTransform ?? ""),
    fontStyle: String(cell?.fontStyle ?? ""),
    textDecoration: String(cell?.textDecoration ?? ""),
    backgroundColor: String(cell?.backgroundColor ?? ""),
    color: String(cell?.color ?? ""),
    textAlign: String(cell?.textAlign ?? ""),
    fontWeight: String(cell?.fontWeight ?? ""),
    padding: String(cell?.padding ?? ""),
    borderColor: String(cell?.borderColor ?? ""),
    borderWidth: String(cell?.borderWidth ?? ""),
    borderStyle: String(cell?.borderStyle ?? ""),
    borderRadius: String(cell?.borderRadius ?? ""),
    rowSpan: Math.max(1, Math.min(48, Math.round(Number(cell?.rowSpan) || 1))),
    colSpan: Math.max(1, Math.min(48, Math.round(Number(cell?.colSpan) || 1))),
    hidden: Boolean(cell?.hidden),
    masterIndex: Number.isInteger(Number(cell?.masterIndex)) ? Number(cell.masterIndex) : null,
  };
}

function getGridEditTarget(block = {}) {
  if (block.type !== "grid") {
    return null;
  }
  const rows = Math.max(1, Math.min(48, Math.round(Number(block.props?.rows) || 4)));
  const columns = Math.max(1, Math.min(48, Math.round(Number(block.props?.columns) || 4)));
  const rawCells = Array.isArray(block.props?.cells) ? block.props.cells.map(normalizeGridCell) : [];
  const cells = Array.from({ length: rows * columns }, (_, index) => rawCells[index] || normalizeGridCell());
  const selectedIds = (Array.isArray(block.props?.selectedCellIds) ? block.props.selectedCellIds : [])
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value >= 0 && value < rows * columns);
  const fallbackIndex = cells.findIndex((cell) => !cell.hidden);
  const selectedIndex = selectedIds.length ? selectedIds[0] : fallbackIndex;
  if (selectedIndex == null || selectedIndex < 0) {
    return null;
  }
  const cellIndex = cells[selectedIndex]?.hidden && Number.isInteger(cells[selectedIndex]?.masterIndex)
    ? cells[selectedIndex].masterIndex
    : selectedIndex;
  const visibleCellIndex = cells[cellIndex] && !cells[cellIndex].hidden ? cellIndex : fallbackIndex;
  if (visibleCellIndex == null || visibleCellIndex < 0 || !cells[visibleCellIndex]) {
    return null;
  }
  return {
    cellIndex: visibleCellIndex,
    selectedIds: selectedIds.length ? selectedIds : [visibleCellIndex],
    cells,
    rows,
    columns,
  };
}

function setGridCellContent(root, store, block, target, content, options = {}) {
  const affectedIds = options.affectSelection ? target.selectedIds : [target.cellIndex];
  const cells = target.cells.map((cell, index) => (
    affectedIds.includes(index)
      ? { ...cell, content }
      : cell
  ));
  if (!affectedIds.includes(target.cellIndex)) {
    cells[target.cellIndex] = { ...cells[target.cellIndex], content };
  }
  store.updateBlock(block.id, {
    props: {
      rows: target.rows,
      columns: target.columns,
      cells,
      selectedCellIds: [target.cellIndex],
    },
  });
  focusGridCell(root, block.id, target.cellIndex);
}

function normalizeTableRows(block = {}) {
  const rows = Array.isArray(block.props?.rows) ? block.props.rows : [];
  return rows.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : []));
}

function getTableEditTarget(block = {}) {
  if (block.type !== "table") {
    return null;
  }
  const rows = normalizeTableRows(block);
  const selected = block.props?.selectedCell || {};
  const parsedRowIndex = Number.parseInt(selected.rowIndex, 10);
  const parsedColumnIndex = Number.parseInt(selected.columnIndex, 10);
  const hasSelectedCell = Number.isInteger(parsedRowIndex)
    && Number.isInteger(parsedColumnIndex)
    && parsedRowIndex >= 0
    && parsedColumnIndex >= 0
    && rows[parsedRowIndex]
    && parsedColumnIndex < rows[parsedRowIndex].length;
  const firstRowIndex = rows.findIndex((row) => row.length > 0);
  const rowIndex = hasSelectedCell ? parsedRowIndex : firstRowIndex;
  const columnIndex = hasSelectedCell ? parsedColumnIndex : 0;
  if (rowIndex < 0 || columnIndex < 0) {
    return null;
  }
  if (!rows[rowIndex] || columnIndex >= rows[rowIndex].length) {
    return null;
  }
  return { rows, rowIndex, columnIndex };
}

function setTableCellContent(root, store, block, target, content) {
  const rows = target.rows.map((row) => [...row]);
  rows[target.rowIndex][target.columnIndex] = content;
  store.updateBlock(block.id, {
    props: {
      rows,
      selectedCell: {
        rowIndex: target.rowIndex,
        columnIndex: target.columnIndex,
      },
    },
  });
  focusTableCell(root, block.id, target.rowIndex, target.columnIndex);
}

function handleSpreadsheetTyping(root, store, event) {
  const state = store.getState();
  const blockId = state.selectedIds[0];
  const block = blockId ? getBlockById(state.document, blockId) : null;
  if (!block) {
    return false;
  }
  const gridTarget = getGridEditTarget(block);
  const tableTarget = getTableEditTarget(block);
  const target = gridTarget || tableTarget;
  if (!target) {
    return false;
  }

  if (isPlainTextKey(event)) {
    event.preventDefault();
    if (gridTarget) setGridCellContent(root, store, block, gridTarget, event.key);
    else setTableCellContent(root, store, block, tableTarget, event.key);
    return true;
  }

  if ((event.key === "Enter" || event.key === "F2") && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    if (gridTarget) focusGridCell(root, block.id, gridTarget.cellIndex);
    else focusTableCell(root, block.id, tableTarget.rowIndex, tableTarget.columnIndex);
    return true;
  }

  if ((event.key === "Delete" || event.key === "Backspace") && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    if (gridTarget) setGridCellContent(root, store, block, gridTarget, "", { affectSelection: true });
    else setTableCellContent(root, store, block, tableTarget, "");
    return true;
  }

  return false;
}

export function attachKeyboard(root, store) {
  root.addEventListener("keydown", (event) => {
    if (isEditableTarget(event.target)) {
      return;
    }
    if (handleSpreadsheetTyping(root, store, event)) {
      return;
    }
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "z") {
      event.preventDefault();
      store.undo();
    } else if ((event.ctrlKey || event.metaKey) && key === "y") {
      event.preventDefault();
      store.redo();
    } else if ((event.ctrlKey || event.metaKey) && key === "c") {
      event.preventDefault();
      const state = store.getState();
      const ids = new Set(state.selectedIds.map(String));
      const page = state.document[Math.max(0, state.activePage - 1)] || state.document[0];
      store.setClipboard((page?.children || []).filter((block) => ids.has(String(block.id))));
    } else if ((event.ctrlKey || event.metaKey) && key === "v") {
      event.preventDefault();
      const clipboard = store.getState().clipboard || [];
      const clones = clipboard.map((block) => ({ ...block, id: crypto.randomUUID(), layout: { ...(block.layout || {}), x: (Number(block.layout?.x) || 0) + 32, y: (Number(block.layout?.y) || 0) + 32 } }));
      clones.forEach((block) => store.addBlock(block.type, block, { history: false }));
      store.commitHistory();
    } else if ((event.ctrlKey || event.metaKey) && key === "d") {
      event.preventDefault();
      store.duplicateBlock();
    } else if ((event.ctrlKey || event.metaKey) && key === "g" && event.shiftKey) {
      event.preventDefault();
      ungroupSelected(store);
    } else if ((event.ctrlKey || event.metaKey) && key === "g") {
      event.preventDefault();
      groupSelected(store);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      store.removeBlock();
    }
  });
}
