import { createBlock } from "./registry.js";
import { snapLayout } from "./snapping.js";
import { getBlockById } from "./state.js";
import { el } from "../utils/dom.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX, getPointInPage } from "../utils/math.js";

function resolveToolType(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  const legacy = {
    paragraph: "text",
    placeholder: "text",
    columns: "container",
    page_break: "pagebreak",
  };
  return legacy[normalized] || normalized || "text";
}

function findPageAtPoint(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY);
  return element instanceof HTMLElement ? element.closest(".sn-builder-page") : null;
}

function createToolPreview(label = "Element") {
  const preview = el("div", { className: "sn-builder-drag-preview" }, label);
  document.body.append(preview);
  return preview;
}

export function attachDragDrop(root, store, options = {}) {
  let session = null;

  function endSession() {
    if (!session) return;
    session.preview?.remove();
    store.setGuides([]);
    store.commitHistory();
    session = null;
  }

  root.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof HTMLElement) || event.button !== 0) return;

    const tool = event.target.closest("[data-builder-tool]");
    if (tool instanceof HTMLElement) {
      event.preventDefault();
      const type = resolveToolType(tool.dataset.builderTool || "text");
      const label = tool.textContent?.trim() || type;
      session = {
        mode: "tool",
        type,
        token: tool.dataset.builderToken || "",
        preview: createToolPreview(label),
      };
      tool.setPointerCapture?.(event.pointerId);
      session.preview.style.transform = `translate(${event.clientX + 12}px, ${event.clientY + 12}px)`;
      return;
    }

    const blockNode = event.target.closest("[data-builder-block-id]");
    if (!(blockNode instanceof HTMLElement)) return;
    if (event.target.closest("[contenteditable='true'], .sn-builder-resize-handle, .sn-builder-rotate-handle")) return;
    const state = store.getState();
    const blockId = blockNode.dataset.builderBlockId || "";
    const block = getBlockById(state.document, blockId);
    if (!block || block.props?.locked) return;
    if (!state.selectedIds.includes(blockId)) {
      store.selectBlock(blockId);
    }
    const nextState = store.getState();
    const selectedIds = nextState.selectedIds.length > 0 ? nextState.selectedIds : [blockId];
    session = {
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      selectedIds,
      pageIndex: nextState.activePage,
      initialLayouts: new Map(selectedIds.map((id) => {
        const selectedBlock = getBlockById(nextState.document, id);
        return [id, { ...(selectedBlock?.layout || {}) }];
      })),
    };
    blockNode.setPointerCapture?.(event.pointerId);
  });

  root.addEventListener("pointermove", (event) => {
    if (!session) return;
    if (session.mode === "tool") {
      session.preview.style.transform = `translate(${event.clientX + 12}px, ${event.clientY + 12}px)`;
      session.preview.classList.toggle("is-valid", Boolean(findPageAtPoint(event.clientX, event.clientY)));
      return;
    }

    const state = store.getState();
    const page = state.document[Math.max(0, (session.pageIndex || state.activePage) - 1)] || state.document[0];
    const selected = new Set(session.selectedIds.map(String));
    const otherBlocks = (page?.children || []).filter((block) => !selected.has(String(block.id)));
    const dx = (event.clientX - session.startX) / (state.zoom || 1);
    const dy = (event.clientY - session.startY) / (state.zoom || 1);
    let firstGuides = [];
    session.selectedIds.forEach((id, index) => {
      const initial = session.initialLayouts.get(id) || {};
      const candidate = {
        ...initial,
        x: (Number(initial.x) || 0) + dx,
        y: (Number(initial.y) || 0) + dy,
      };
      const snapped = index === 0 ? snapLayout(candidate, page, otherBlocks) : { layout: candidate, guides: [] };
      firstGuides = snapped.guides;
      store.updateBlock(id, { layout: snapped.layout }, { history: false });
    });
    store.setGuides(firstGuides);
  });

  root.addEventListener("pointerup", (event) => {
    if (!session) return;
    if (session.mode === "tool") {
      const page = findPageAtPoint(event.clientX, event.clientY);
      if (page instanceof HTMLElement) {
        const state = store.getState();
        const point = getPointInPage(event, page, state.zoom);
        const token = session.token || options.getTokenOptions?.()[0]?.value || "";
        const defaultProps = options.getDefaultPropsForType?.(session.type) || {};
        const explicitProps = session.type === "text" && token ? { content: token } : {};
        const layout = session.type === "grid"
          ? {}
          : {
            x: Math.max(0, Math.min(A4_WIDTH_PX - 80, point.x - 60)),
            y: Math.max(0, Math.min(A4_HEIGHT_PX - 32, point.y - 20)),
          };
        const block = createBlock(session.type, {
          props: { ...defaultProps, ...explicitProps },
          layout,
        });
        store.addBlock(block.type, block, { pageId: page.dataset.builderPageId });
      }
    }
    endSession();
  });

  root.addEventListener("pointercancel", endSession);
}
