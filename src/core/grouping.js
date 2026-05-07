export function groupSelected(store) {
  return store.groupBlocks(store.getState().selectedIds);
}

export function ungroupSelected(store) {
  return store.ungroupBlocks(store.getState().selectedIds);
}
