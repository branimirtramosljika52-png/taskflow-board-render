import { groupSelected, ungroupSelected } from "./grouping.js";

export function attachKeyboard(root, store) {
  root.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true']")) {
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
