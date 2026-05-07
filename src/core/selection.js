export function attachSelection(container, store) {
  container.addEventListener("pointerdown", (event) => {
    const block = event.target instanceof HTMLElement
      ? event.target.closest("[data-builder-block-id]")
      : null;
    if (!(block instanceof HTMLElement)) {
      if (event.target instanceof HTMLElement && event.target.closest(".sn-builder-page")) {
        store.clearSelection();
      }
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest("[contenteditable='true'], .sn-builder-resize-handle")) {
      return;
    }
    const id = block.dataset.builderBlockId || "";
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      store.multiSelect(id);
    } else {
      store.selectBlock(id);
    }
  });
}
