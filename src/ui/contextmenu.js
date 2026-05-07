import { el } from "../utils/dom.js";
import { groupSelected, ungroupSelected } from "../core/grouping.js";

export function attachContextMenu(root, store) {
  const menu = el("div", { className: "sn-builder-context-menu", hidden: true });
  root.append(menu);

  function close() {
    menu.hidden = true;
  }

  function item(label, action) {
    return el("button", {
      type: "button",
      onclick: () => {
        action();
        close();
      },
    }, label);
  }

  root.addEventListener("contextmenu", (event) => {
    const block = event.target instanceof HTMLElement
      ? event.target.closest("[data-builder-block-id]")
      : null;
    if (!(block instanceof HTMLElement)) return;
    event.preventDefault();
    store.selectBlock(block.dataset.builderBlockId || "");
    menu.replaceChildren(
      item("Duplicate", () => store.duplicateBlock()),
      item("Delete", () => store.removeBlock()),
      item("Bring forward", () => store.bringForward()),
      item("Send backward", () => store.sendBackward()),
      item("Group", () => groupSelected(store)),
      item("Ungroup", () => ungroupSelected(store)),
      item("Copy", () => {
        const state = store.getState();
        const ids = new Set(state.selectedIds.map(String));
        const page = state.document[Math.max(0, state.activePage - 1)] || state.document[0];
        store.setClipboard((page?.children || []).filter((entry) => ids.has(String(entry.id))));
      }),
      item("Paste", () => {
        const clipboard = store.getState().clipboard || [];
        clipboard.forEach((entry) => store.addBlock(entry.type, entry, { history: false }));
        store.commitHistory();
      }),
    );
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.hidden = false;
  });
  document.addEventListener("pointerdown", (event) => {
    if (!menu.contains(event.target)) close();
  });
}
