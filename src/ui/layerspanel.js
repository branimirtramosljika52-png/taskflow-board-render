import { getLayerItems, setLayerLocked, setLayerVisibility } from "../core/layers.js";
import { el, clear, button } from "../utils/dom.js";

export function renderLayersPanel(container, store) {
  store.subscribe((state) => {
    clear(container);
    container.append(el("div", { className: "sn-builder-panel-head" }, [
      el("span", {}, "Layers"),
      el("strong", {}, `${getLayerItems(state).length}`),
    ]));
    const list = el("div", { className: "sn-builder-layer-list" });
    getLayerItems(state).forEach((block) => {
      const selected = state.selectedIds.includes(block.id);
      list.append(el("div", { className: `sn-builder-layer-row${selected ? " is-selected" : ""}` }, [
        button(block.type, { className: "sn-builder-layer-name", onclick: () => store.selectBlock(block.id) }),
        button(block.props?.hidden ? "Show" : "Hide", { className: "sn-builder-mini-button", onclick: () => setLayerVisibility(store, block.id, !block.props?.hidden) }),
        button(block.props?.locked ? "Unlock" : "Lock", { className: "sn-builder-mini-button", onclick: () => setLayerLocked(store, block.id, !block.props?.locked) }),
      ]));
    });
    if (!list.childElementCount) {
      list.append(el("div", { className: "sn-builder-empty-state" }, "Stranica nema elemenata."));
    }
    container.append(list);
  });
}
