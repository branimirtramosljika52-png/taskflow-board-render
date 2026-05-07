import { getBlockById } from "../core/state.js";
import { el, clear } from "../utils/dom.js";

export function renderBreadcrumbs(container, store) {
  store.subscribe((state) => {
    clear(container);
    const block = state.selectedIds[0] ? getBlockById(state.document, state.selectedIds[0]) : null;
    container.append(
      el("span", {}, `Page ${state.activePage}`),
      el("span", {}, "/"),
      el("strong", {}, block ? `${block.type} ${block.id}` : "No selection"),
    );
  });
}
