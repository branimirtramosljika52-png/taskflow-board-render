export function createHistoryControls(store) {
  return {
    undo: () => store.undo(),
    redo: () => store.redo(),
    commit: () => store.commitHistory(),
  };
}
