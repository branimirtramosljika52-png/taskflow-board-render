import { renderCanvas } from "../core/renderer.js";
import { el } from "../utils/dom.js";

export function createCanvas(container, store, options = {}) {
  const canvas = el("div", { className: "sn-builder-canvas-host", tabindex: "0" });
  container.append(canvas);
  store.subscribe(() => {
    renderCanvas(canvas, store, options);
  });
  return canvas;
}
