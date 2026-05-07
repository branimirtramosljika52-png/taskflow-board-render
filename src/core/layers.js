export function getLayerItems(state = {}) {
  const page = state.document?.[Math.max(0, (Number(state.activePage) || 1) - 1)] || state.document?.[0];
  return [...(page?.children || [])].reverse();
}

export function setLayerVisibility(store, blockId = "", hidden = false) {
  store.updateBlock(blockId, { props: { hidden: Boolean(hidden) } });
}

export function setLayerLocked(store, blockId = "", locked = false) {
  store.updateBlock(blockId, { props: { locked: Boolean(locked) } });
}
