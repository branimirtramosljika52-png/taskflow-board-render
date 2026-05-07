import { boundsFromRects, rectFromLayout } from "../utils/math.js";

function selectedBlocks(store) {
  const state = store.getState();
  const ids = new Set(state.selectedIds.map(String));
  const page = state.document[Math.max(0, state.activePage - 1)] || state.document[0];
  return (page?.children || []).filter((block) => ids.has(String(block.id)));
}

function updateSelected(store, updater) {
  selectedBlocks(store).forEach((block, index, blocks) => {
    store.updateBlock(block.id, { layout: updater(block, index, blocks) }, { history: index !== 0 ? false : true });
  });
  store.commitHistory();
}

export function alignSelection(store, mode = "left") {
  const blocks = selectedBlocks(store);
  if (blocks.length === 0) return;
  const bounds = boundsFromRects(blocks.map((block) => rectFromLayout(block.layout)));
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
