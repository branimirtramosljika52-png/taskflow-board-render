import { el, button } from "../utils/dom.js";

export function renderTopbar(container, store, options = {}) {
  const zoomLabel = el("strong", { className: "sn-builder-zoom-label" }, "78%");
  const setZoom = (delta) => {
    const state = store.getState();
    store.setZoom((Number(state.zoom) || 1) + delta);
  };

  container.append(
    el("div", { className: "sn-builder-brand" }, [
      el("span", { className: "sn-builder-brand-mark" }, "SN"),
      el("div", {}, [
        el("strong", {}, "HTML Document Builder"),
        el("small", {}, "A4 report engine"),
      ]),
    ]),
    el("div", { className: "sn-builder-topbar-actions" }, [
      button("Undo", { className: "sn-builder-icon-button", onclick: () => store.undo(), title: "Ctrl+Z" }),
      button("Redo", { className: "sn-builder-icon-button", onclick: () => store.redo(), title: "Ctrl+Y" }),
      button("-", { className: "sn-builder-icon-button", onclick: () => setZoom(-0.08), title: "Smanji zoom" }),
      zoomLabel,
      button("+", { className: "sn-builder-icon-button", onclick: () => setZoom(0.08), title: "Povecaj zoom" }),
      button("Spremi", { className: "sn-builder-button", onclick: () => options.onSave?.() }),
      button("HTML", { className: "sn-builder-button", onclick: () => options.onDownloadHtml?.() }),
      button("PDF", { className: "sn-builder-button is-primary", onclick: () => options.onExportPdf?.() }),
    ]),
  );

  store.subscribe((state) => {
    zoomLabel.textContent = `${Math.round((Number(state.zoom) || 1) * 100)}%`;
  });
}
