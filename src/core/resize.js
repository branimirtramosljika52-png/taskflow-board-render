import { snapLayout } from "./snapping.js";
import { getBlockById } from "./state.js";
import { clamp } from "../utils/math.js";

const MIN_WIDTH = 24;
const MIN_HEIGHT = 18;

export function attachResize(root, store) {
  let session = null;

  root.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof HTMLElement) || event.button !== 0) return;
    const handle = event.target.closest("[data-resize-handle]");
    if (!(handle instanceof HTMLElement)) return;
    const blockNode = handle.closest("[data-builder-block-id]");
    if (!(blockNode instanceof HTMLElement)) return;
    event.preventDefault();
    event.stopPropagation();
    const state = store.getState();
    const blockId = blockNode.dataset.builderBlockId || "";
    const block = getBlockById(state.document, blockId);
    if (!block || block.props?.locked) return;
    session = {
      blockId,
      handle: handle.dataset.resizeHandle || "se",
      startX: event.clientX,
      startY: event.clientY,
      zoom: state.zoom || 1,
      initial: { ...(block.layout || {}) },
    };
    handle.setPointerCapture?.(event.pointerId);
  });

  root.addEventListener("pointermove", (event) => {
    if (!session) return;
    const state = store.getState();
    const page = state.document[Math.max(0, state.activePage - 1)] || state.document[0];
    const dx = (event.clientX - session.startX) / session.zoom;
    const dy = (event.clientY - session.startY) / session.zoom;
    const next = { ...session.initial };
    if (session.handle.includes("e")) next.width = clamp((Number(session.initial.width) || MIN_WIDTH) + dx, MIN_WIDTH, 1600);
    if (session.handle.includes("s")) next.height = clamp((Number(session.initial.height) || MIN_HEIGHT) + dy, MIN_HEIGHT, 1600);
    if (session.handle.includes("w")) {
      next.x = (Number(session.initial.x) || 0) + dx;
      next.width = clamp((Number(session.initial.width) || MIN_WIDTH) - dx, MIN_WIDTH, 1600);
    }
    if (session.handle.includes("n")) {
      next.y = (Number(session.initial.y) || 0) + dy;
      next.height = clamp((Number(session.initial.height) || MIN_HEIGHT) - dy, MIN_HEIGHT, 1600);
    }
    const snapped = snapLayout(next, page, []);
    store.updateBlock(session.blockId, { layout: snapped.layout }, { history: false });
    store.setGuides(snapped.guides);
  });

  function end() {
    if (!session) return;
    store.setGuides([]);
    store.commitHistory();
    session = null;
  }

  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
}
