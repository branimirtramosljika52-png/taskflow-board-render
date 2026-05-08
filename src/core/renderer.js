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
  if (block.type === "grid") {
    node.style.backgroundColor = "transparent";
    node.style.backgroundImage = "";
  }
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

function renderPageRuler(orientation = "horizontal", pageWidth = A4_WIDTH_PX, pageHeight = A4_HEIGHT_PX, zoom = 1) {
  const horizontal = orientation === "horizontal";
  const millimeters = horizontal ? 210 : 297;
  const length = (horizontal ? pageWidth : pageHeight) * (Number(zoom) || 1);
  const ticks = [];
  for (let mm = 0; mm <= millimeters; mm += 5) {
    const position = (mm / millimeters) * length;
    const major = mm % 10 === 0;
    ticks.push(el("span", {
      className: `sn-builder-page-ruler-tick${major ? " is-major" : " is-minor"}`,
      style: horizontal ? { left: `${position}px` } : { top: `${position}px` },
    }, major ? String(mm / 10) : ""));
  }
  return el("div", {
    className: `sn-builder-page-ruler is-${orientation}`,
    style: horizontal ? { width: `${length}px` } : { height: `${length}px` },
  }, ticks);
}

function getSharedPageProps(page = {}, firstPage = {}, group = "header") {
  const firstProps = firstPage.props || {};
  const pageProps = page.props || {};
  const sameKey = group === "footer" ? "footerSameEveryPage" : "headerSameEveryPage";
  return firstProps[sameKey] === false ? pageProps : { ...pageProps, ...firstProps };
}

function renderPageHeader(page = {}, firstPage = {}) {
  const props = getSharedPageProps(page, firstPage, "header");
  if (props.headerEnabled === false) {
    return null;
  }
  const headerHeight = Math.max(34, Math.min(140, Number(props.headerHeight) || 64));
  const logoDataUrl = String(props.headerLogoDataUrl || "").trim();
  const logo = props.headerLogoEnabled === false
    ? null
    : logoDataUrl
      ? el("img", { src: logoDataUrl, alt: "Logo tvrtke" })
      : el("span", { className: "sn-builder-page-header-logo-empty" }, "Logo");
  const title = String(props.headerTitle || "").trim();
  return el("div", {
    className: "sn-builder-page-header",
    style: { height: `${headerHeight}px` },
  }, [
    el("div", { className: "sn-builder-page-header-logo" }, logo ? [logo] : []),
    el("div", { className: "sn-builder-page-header-title" }, title),
  ]);
}

function getFooterContent(props = {}, pageIndex = 0, pageCount = 1) {
  const text = String(props.footerText || "").trim();
  switch (props.footerType || "page-number") {
    case "none":
      return "";
    case "text":
      return text || "{{FOOTER_TEXT}}";
    case "document-info":
      return `${text || "{{BROJ_ZAPISNIKA}}"} | Stranica ${pageIndex + 1} / ${pageCount}`;
    case "signature":
      return text || "Izradio: {{ISPITIVAC}}";
    case "page-number":
    default:
      return text || `Stranica ${pageIndex + 1} / ${pageCount}`;
  }
}

function renderPageFooter(page = {}, firstPage = {}, pageIndex = 0, pageCount = 1) {
  const props = getSharedPageProps(page, firstPage, "footer");
  const content = getFooterContent(props, pageIndex, pageCount);
  if (!content) {
    return null;
  }
  return el("div", { className: `sn-builder-page-footer is-${props.footerType || "page-number"}` }, content);
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

  const firstPage = state.document[0] || {};
  const pageCount = state.document.length;
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
    const headerNode = renderPageHeader(page, firstPage);
    const footerNode = renderPageFooter(page, firstPage, pageIndex, pageCount);
    if (headerNode) pageNode.append(headerNode);
    if (footerNode) pageNode.append(footerNode);
    (page.children || []).forEach((block) => {
      pageNode.append(renderBlockNode(block, context));
    });
    pageNode.append(...renderGuides(state.guides));
    shell.append(
      el("div", { className: "sn-builder-page-label" }, `A4 ${pageIndex + 1}`),
      renderPageRuler("horizontal", pageWidth, pageHeight, state.zoom),
      renderPageRuler("vertical", pageWidth, pageHeight, state.zoom),
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
