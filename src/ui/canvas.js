import { renderCanvas } from "../core/renderer.js";
import { el } from "../utils/dom.js";

function getCanvasScroll(container) {
  const viewport = container.querySelector(".sn-builder-canvas-viewport");
  return viewport instanceof HTMLElement
    ? { left: viewport.scrollLeft, top: viewport.scrollTop }
    : { left: 0, top: 0 };
}

function restoreCanvasScroll(container, scroll) {
  const viewport = container.querySelector(".sn-builder-canvas-viewport");
  if (!(viewport instanceof HTMLElement)) {
    return;
  }
  const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const maxTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  viewport.scrollLeft = Math.min(Math.max(0, scroll.left), maxLeft);
  viewport.scrollTop = Math.min(Math.max(0, scroll.top), maxTop);
}

export function createCanvas(container, store, options = {}) {
  const canvas = el("div", { className: "sn-builder-canvas-host", tabindex: "0" });
  container.append(canvas);
  store.subscribe((state, reason) => {
    const shouldPreserveScroll = reason !== "init";
    const scroll = shouldPreserveScroll ? getCanvasScroll(canvas) : { left: 0, top: 0 };
    renderCanvas(canvas, store, options);
    if (shouldPreserveScroll) {
      restoreCanvasScroll(canvas, scroll);
      requestAnimationFrame(() => restoreCanvasScroll(canvas, scroll));
    }
  });
  return canvas;
}
