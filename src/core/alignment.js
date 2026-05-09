import { boundsFromRects, rectFromLayout } from "../utils/math.js";

const PAGE_MARGIN = 48;

function selectedBlocks(store) {
  const state = store.getState();
  const ids = new Set(state.selectedIds.map(String));
  const page = state.document[Math.max(0, state.activePage - 1)] || state.document[0];
  return (page?.children || []).filter((block) => ids.has(String(block.id)));
}

function selectedPage(store) {
  const state = store.getState();
  return state.document[Math.max(0, state.activePage - 1)] || state.document[0] || null;
}

function updateSelected(store, updater) {
  selectedBlocks(store).forEach((block, index, blocks) => {
    store.updateBlock(block.id, { layout: updater(block, index, blocks) }, { history: index !== 0 ? false : true });
  });
  store.commitHistory();
}

function clampGridCount(value, fallback = 4) {
  return Math.max(1, Math.min(48, Math.round(Number(value) || fallback)));
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
    verticalAlign: String(cell?.verticalAlign ?? ""),
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

function getGridCells(block = {}, rows = 1, columns = 1) {
  const rawCells = Array.isArray(block.props?.cells) ? block.props.cells.map(normalizeGridCell) : [];
  return Array.from({ length: rows * columns }, (_, index) => rawCells[index] || normalizeGridCell());
}

function getGridSelectedAnchorIds(block = {}, rows = 1, columns = 1, cells = []) {
  return [...new Set((Array.isArray(block.props?.selectedCellIds) ? block.props.selectedCellIds : [])
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value >= 0 && value < rows * columns)
    .map((index) => {
      const cell = cells[index];
      return cell?.hidden && Number.isInteger(cell.masterIndex) ? cell.masterIndex : index;
    })
    .filter((index) => Number.isInteger(index) && index >= 0 && index < rows * columns && !cells[index]?.hidden))];
}

function alignGridCellSelection(store, block = {}, mode = "left") {
  if (block.type !== "grid") {
    return false;
  }

  const patchByMode = {
    left: { textAlign: "left" },
    center: { textAlign: "center" },
    right: { textAlign: "right" },
    top: { verticalAlign: "top" },
    middle: { verticalAlign: "middle" },
    bottom: { verticalAlign: "bottom" },
  };
  const patch = patchByMode[mode];
  if (!patch) {
    return false;
  }

  const rows = clampGridCount(block.props?.rows, 4);
  const columns = clampGridCount(block.props?.columns, 4);
  const cells = getGridCells(block, rows, columns);
  const selectedAnchorIds = getGridSelectedAnchorIds(block, rows, columns, cells);
  if (selectedAnchorIds.length === 0) {
    return false;
  }

  const selectedSet = new Set(selectedAnchorIds);
  const nextCells = cells.map((cell, index) => (
    selectedSet.has(index) ? { ...cell, ...patch } : cell
  ));

  store.updateBlock(block.id, {
    props: {
      rows,
      columns,
      cells: nextCells,
      selectedCellIds: [...selectedAnchorIds],
    },
  });
  return true;
}

function getAlignmentTarget(store, blocks = []) {
  if (blocks.length !== 1) {
    return boundsFromRects(blocks.map((block) => rectFromLayout(block.layout)));
  }

  const page = selectedPage(store);
  const pageWidth = Number(page?.layout?.width) || 1;
  const pageHeight = Number(page?.layout?.height) || 1;
  return {
    x: PAGE_MARGIN,
    y: PAGE_MARGIN,
    width: Math.max(1, pageWidth - PAGE_MARGIN * 2),
    height: Math.max(1, pageHeight - PAGE_MARGIN * 2),
  };
}

export function alignSelection(store, mode = "left") {
  const blocks = selectedBlocks(store);
  if (blocks.length === 0) return;

  if (blocks.length === 1 && alignGridCellSelection(store, blocks[0], mode)) {
    return;
  }

  const bounds = getAlignmentTarget(store, blocks);
  updateSelected(store, (block) => {
    const rect = rectFromLayout(block.layout);
    if (mode === "left") return { x: bounds.x };
    if (mode === "center") return { x: bounds.x + bounds.width / 2 - rect.width / 2 };
    if (mode === "right") return { x: bounds.x + bounds.width - rect.width };
    if (mode === "top") return { y: bounds.y };
    if (mode === "middle") return { y: bounds.y + bounds.height / 2 - rect.height / 2 };
    if (mode === "bottom") return { y: bounds.y + bounds.height - rect.height };
    return {};
  });
}

export function distributeSelection(store, axis = "horizontal") {
  const blocks = selectedBlocks(store)
    .map((block) => ({ block, rect: rectFromLayout(block.layout) }))
    .sort((left, right) => axis === "horizontal" ? left.rect.x - right.rect.x : left.rect.y - right.rect.y);
  if (blocks.length < 3) return;
  const first = blocks[0].rect;
  const last = blocks.at(-1).rect;
  const totalSize = blocks.reduce((sum, item) => sum + (axis === "horizontal" ? item.rect.width : item.rect.height), 0);
  const available = axis === "horizontal"
    ? (last.x + last.width) - first.x - totalSize
    : (last.y + last.height) - first.y - totalSize;
  const gap = available / (blocks.length - 1);
  let cursor = axis === "horizontal" ? first.x : first.y;
  blocks.forEach(({ block, rect }, index) => {
    const patch = axis === "horizontal" ? { x: cursor } : { y: cursor };
    store.updateBlock(block.id, { layout: patch }, { history: index !== 0 ? false : true });
    cursor += (axis === "horizontal" ? rect.width : rect.height) + gap;
  });
  store.commitHistory();
}

export function sameSizeSelection(store, dimension = "width") {
  const blocks = selectedBlocks(store);
  if (blocks.length < 2) return;
  const source = rectFromLayout(blocks[0].layout);
  updateSelected(store, () => (
    dimension === "height" ? { height: source.height } : { width: source.width }
  ));
}
