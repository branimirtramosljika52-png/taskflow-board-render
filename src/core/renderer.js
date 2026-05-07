import { renderBlock } from "./registry.js";
import { el, clear } from "../utils/dom.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../utils/math.js";

function applyLayout(node, layout = {}) {
  node.style.left = `${Number(layout.x) || 0}px`;
  node.style.top = `${Number(layout.y) || 0}px`;
  node.style.width = `${Math.max(1, Number(layout.width) || 1)}px`;
  node.style.height = `${Math.max(1, Number(layout.height) || 1)}px`;
  node.style.transform = `rotate(${Number(layout.rotation) || 0}deg)`;
}

function applyBlockStyles(node, styles = {}) {
  Object.entries(styles || {}).forEach(([key, value]) => {
    if (value == null || value === "") return;
    node.style[key] = String(value);
  });
}

function createResizeHandles() {
  return ["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((handle) => (
    el("span", {
      className: `sn-builder-resize-handle is-${handle}`,
      dataset: { resizeHandle: handle },
      title: `Resize ${handle}`,
    })
  ));
}

function renderChildren(children = [], context) {
  return children.map((child) => renderBlockNode(child, context));
}

function renderBlockNode(block = {}, context) {
  const selected = context.state.selectedIds.includes(block.id);
  const node = el("article", {
    className: `sn-builder-block sn-builder-block-${block.type}${selected ? " is-selected" : ""}${block.props?.locked ? " is-locked" : ""}`,
    dataset: {
      builderBlockId: block.id,
      builderBlockType: block.type,
    },
    tabindex: "0",
  });
  applyLayout(node, block.layout || {});
  applyBlockStyles(node, block.styles || {});
  if (block.props?.hidden) {
    node.classList.add("is-hidden-layer");
  }

  const content = el("div", { className: "sn-builder-block-content" });
  content.append(renderBlock(block, context));
  node.append(content);

  if (Array.isArray(block.children) && block.children.length > 0) {
    node.append(el("div", { className: "sn-builder-child-layer" }, renderChildren(block.children, context)));
  }

  if (selected) {
    node.append(
      el("span", { className: "sn-builder-selected-label" }, block.type),
      el("span", { className: "sn-builder-rotate-handle", dataset: { rotateHandle: "true" } }),
      ...createResizeHandles(),
    );
  }
  return node;
}

function renderGuides(guides = []) {
  return guides.map((guide) => el("span", {
    className: `sn-builder-guide is-${guide.axis}`,
    style: guide.axis === "x" ? { left: `${guide.value}px` } : { top: `${guide.value}px` },
  }));
}

export function renderCanvas(container, store, options = {}) {
  if (!(container instanceof HTMLElement)) return;
  const state = store.getState();
  clear(container);

  const viewport = el("div", { className: "sn-builder-canvas-viewport" });
  const rail = el("div", { className: "sn-builder-page-rail" });
  const context = {
    state,
    updateBlock: store.updateBlock,
    commitHistory: store.commitHistory,
    selectBlock: store.selectBlock,
    tokenOptions: options.getTokenOptions?.() || [],
  };

  state.document.forEach((page, pageIndex) => {
    const pageWidth = Number(page.layout?.width) || A4_WIDTH_PX;
    const pageHeight = Number(page.layout?.height) || A4_HEIGHT_PX;
    const shell = el("section", {
      className: `sn-builder-page-shell${state.activePage === pageIndex + 1 ? " is-active" : ""}`,
      style: {
        width: `${pageWidth * state.zoom}px`,
        minHeight: `${pageHeight * state.zoom}px`,
      },
    });
    const pageNode = el("div", {
      className: "sn-builder-page",
      dataset: {
        builderPageId: page.id,
        builderPageIndex: pageIndex + 1,
      },
      style: {
        width: `${pageWidth}px`,
        minHeight: `${pageHeight}px`,
        transform: `scale(${state.zoom})`,
      },
    });
    pageNode.append(
      el("div", { className: "sn-builder-print-safe-area" }),
      el("div", { className: "sn-builder-grid" }),
    );
    (page.children || []).forEach((block) => {
      pageNode.append(renderBlockNode(block, context));
    });
    pageNode.append(...renderGuides(state.guides));
    shell.append(
      el("div", { className: "sn-builder-page-label" }, `A4 ${pageIndex + 1}`),
      pageNode,
      el("div", { className: "sn-builder-page-number" }, `${pageIndex + 1}`),
    );
    rail.append(shell);
  });

  viewport.append(
    el("div", { className: "sn-builder-ruler is-horizontal" }),
    el("div", { className: "sn-builder-ruler is-vertical" }),
    rail,
  );
  container.append(viewport);
}
