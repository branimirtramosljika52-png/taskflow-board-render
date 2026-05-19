import { alignSelection } from "./alignment.js";
import { attachDragDrop } from "./dragdrop.js";
import { buildBuilderHtmlFromDocument, parseBuilderDocumentFromHtml as parseHtmlMetadata } from "./export.js";
import { attachKeyboard } from "./keyboard.js";
import { createBlock } from "./registry.js";
import { attachResize } from "./resize.js";
import { attachSelection } from "./selection.js";
import { createBuilderState, getBlockById } from "./state.js";
import { createCanvas } from "../ui/canvas.js";
import { attachContextMenu } from "../ui/contextmenu.js";
import { renderBreadcrumbs } from "../ui/breadcrumbs.js";
import { renderLayersPanel } from "../ui/layerspanel.js";
import { renderPropertiesPanel } from "../ui/properties.js";
import { renderSidebar } from "../ui/sidebar.js";
import { renderToolbar } from "../ui/toolbar.js";
import { renderTopbar } from "../ui/topbar.js";
import { getTemplateById } from "../ui/templates.js";
import { el, clear } from "../utils/dom.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../utils/math.js";

const DOCUMENT_HEADER_OFFSET_PX = 151;

function triggerTextDownload(text = "", fileName = "template.html") {
  const blob = new Blob([text], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function logoProps(logoDataUrl = "") {
  return {
    src: String(logoDataUrl || "").trim(),
    alt: "Logo tvrtke",
    autoLogo: true,
  };
}

function applyDocumentBranding(document = [], logoDataUrl = "", options = {}) {
  const logo = String(logoDataUrl || "").trim();
  if (!Array.isArray(document)) {
    return [];
  }

  const force = Boolean(options.force);
  const decorate = (block = {}) => {
    const next = {
      ...block,
      props: { ...(block.props || {}) },
      styles: { ...(block.styles || {}) },
      layout: { ...(block.layout || {}) },
      children: Array.isArray(block.children) ? block.children.map(decorate) : [],
    };
    if (next.type === "page" && (force || next.props.headerAutoLogo || !next.props.headerLogoDataUrl)) {
      next.props = {
        ...next.props,
        headerAutoLogo: true,
        headerLogoDataUrl: logo,
      };
    }
    if (next.type === "logo" && (force || next.props.autoLogo || !next.props.src)) {
      next.props = { ...next.props, ...logoProps(logo) };
    }
    return next;
  };

  return document.map(decorate);
}

function defaultDocument(logoDataUrl = "") {
  return [
    createBlock("page", {
      props: {
        headerAutoLogo: true,
        headerLogoDataUrl: String(logoDataUrl || "").trim(),
      },
      layout: { width: A4_WIDTH_PX, height: A4_HEIGHT_PX },
      children: [
        createBlock("grid"),
      ],
    }),
  ];
}

function mapLegacyType(type = "") {
  const normalized = String(type || "").trim().toLowerCase();
  const map = {
    paragraph: "text",
    placeholder: "text",
    columns: "container",
    page_break: "pagebreak",
  };
  return map[normalized] || normalized || "text";
}

function legacyTextFromBlock(block = {}) {
  if (block.type === "heading") return block.text || "Naslov zapisnika";
  if (block.type === "placeholder") return block.token || "{{DOCUMENT_TITLE}}";
  if (block.type === "columns") return `${block.leftLabel || "Podatak 1"}: ${block.leftToken || "{{DOCUMENT_TITLE}}"}\n${block.rightLabel || "Podatak 2"}: ${block.rightToken || "{{BROJ_RADNOG_NALOGA}}"}`;
  if (block.type === "table") return block.token || "{{DOCUMENT_TITLE}}";
  if (block.type === "signature") return `${block.leftText || "Izradio"} / ${block.rightText || "Odobrio"}`;
  return block.text || block.label || "Tekst zapisnika";
}

export function createBuilderDocumentFromLegacyBlocks(blocks = []) {
  const children = [];
  let cursorY = 72;
  (Array.isArray(blocks) ? blocks : []).forEach((block) => {
    const type = mapLegacyType(block?.type);
    if (type === "pagebreak") {
      children.push(createBlock("pagebreak", { layout: { x: 0, y: cursorY, width: A4_WIDTH_PX, height: 8 } }));
      cursorY += 32;
      return;
    }
    const created = createBlock(type, {
      props: type === "heading"
        ? { content: legacyTextFromBlock(block) }
        : type === "signature"
          ? { label: block.leftText || "Izradio", name: block.rightText || "Odobrio" }
          : {
            content: legacyTextFromBlock(block),
            label: block.label || block.title || "",
            richHtml: block.richHtml || "",
          },
      layout: {
        x: 64,
        y: cursorY,
        width: type === "table" ? 660 : 520,
        height: type === "table" ? 210 : type === "signature" ? 96 : 54,
      },
      styles: block?.align ? { textAlign: block.align } : {},
    });
    children.push(created);
    cursorY += (Number(created.layout?.height) || 60) + 18;
  });

  return [
    createBlock("page", {
      layout: { width: A4_WIDTH_PX, height: Math.max(A4_HEIGHT_PX, cursorY + 120) },
      children,
    }),
  ];
}

export function createLegacyBlocksFromBuilderDocument(document = []) {
  const legacy = [];
  (Array.isArray(document) ? document : []).forEach((page) => {
    (page.children || []).forEach((block) => {
      if (block.type === "heading") {
        legacy.push({ id: block.id, type: "heading", text: block.props?.content || "", align: block.styles?.textAlign || "left" });
      } else if (block.type === "pagebreak") {
        legacy.push({ id: block.id, type: "page_break", align: "left" });
      } else if (block.type === "signature") {
        legacy.push({ id: block.id, type: "signature", leftText: block.props?.label || "Potpis", rightText: block.props?.name || "", align: block.styles?.textAlign || "left" });
      } else if (block.type === "table") {
        legacy.push({ id: block.id, type: "table", title: block.props?.title || "Tablica", token: "{{TABLE}}", align: block.styles?.textAlign || "left" });
      } else if (block.type === "grid") {
        legacy.push({ id: block.id, type: "table", title: "Grid", token: "{{GRID}}", align: block.styles?.textAlign || "left" });
      } else {
        legacy.push({ id: block.id, type: "paragraph", text: block.props?.content || block.props?.value || block.props?.label || block.type, richHtml: block.props?.richHtml || "", align: block.styles?.textAlign || "left" });
      }
    });
  });
  return legacy;
}

export function parseBuilderDocumentFromHtml(html = "") {
  const metadata = parseHtmlMetadata(html);
  if (!metadata) return null;
  if (metadata.version === 2 && Array.isArray(metadata.document)) {
    return metadata.document;
  }
  if (Array.isArray(metadata)) {
    return createBuilderDocumentFromLegacyBlocks(metadata);
  }
  if (Array.isArray(metadata.document)) {
    return metadata.document;
  }
  return null;
}

export { buildBuilderHtmlFromDocument };

export function createDocumentReportBuilder({
  mount,
  legacyToolbox = null,
  legacyActions = null,
  getTokenOptions = () => [],
  onChange = null,
  onMessage = null,
  onSave = null,
  onExportPdf = null,
  getLogoDataUrl = () => "",
} = {}) {
  if (!(mount instanceof HTMLElement)) {
    throw new Error("Builder mount nije dostupan.");
  }

  legacyToolbox?.setAttribute("hidden", "");
  legacyActions?.setAttribute("hidden", "");
  const root = el("div", { className: "sn-builder-app" });
  const topbar = el("header", { className: "sn-builder-topbar" });
  const sidebar = el("aside", { className: "sn-builder-sidebar" });
  const toolbar = el("nav", { className: "sn-builder-toolbar", "aria-label": "Builder tools" });
  const breadcrumbs = el("div", { className: "sn-builder-breadcrumbs" });
  const workspace = el("main", { className: "sn-builder-workspace" });
  const canvasWrap = el("section", { className: "sn-builder-canvas-wrap" });
  const inspector = el("aside", { className: "sn-builder-inspector" });
  const properties = el("div", { className: "sn-builder-properties" });
  const layers = el("div", { className: "sn-builder-layers" });

  workspace.append(toolbar, breadcrumbs, canvasWrap);
  inspector.append(properties, layers);
  root.append(topbar, sidebar, workspace, inspector);
  mount.replaceChildren(root);

  const store = createBuilderState({ document: defaultDocument(getLogoDataUrl()) });
  const canvas = createCanvas(canvasWrap, store, { getTokenOptions });

  function getDefaultPropsForType(type = "") {
    return type === "logo" ? logoProps(getLogoDataUrl()) : {};
  }

  function emitChange() {
    const state = store.getState();
    onChange?.({
      document: state.document,
      html: buildBuilderHtmlFromDocument(state.document),
      selectedIds: state.selectedIds,
    });
  }

  function addBlock(type = "text", token = "") {
    const state = store.getState();
    const page = state.document[Math.max(0, state.activePage - 1)] || state.document[0];
    const count = (page?.children || []).length;
    const normalizedType = mapLegacyType(type);
    const explicitProps = normalizedType === "text" && token ? { content: token } : {};
    const layout = normalizedType === "grid"
      ? {}
      : {
        x: 72 + ((count % 4) * 24),
        y: 112 + ((count % 12) * 42),
      };
    store.addBlock(normalizedType, {
      props: { ...getDefaultPropsForType(normalizedType), ...explicitProps },
      layout,
    });
  }

  renderTopbar(topbar, store, {
    onSave: () => {
      const state = store.getState();
      const html = buildBuilderHtmlFromDocument(state.document);
      store.saveDocument();
      if (onSave) {
        onSave({ document: state.document, html });
        return;
      }
      onMessage?.("Builder dokument je spremljen lokalno.", { type: "success" });
    },
    onDownloadHtml: () => triggerTextDownload(buildBuilderHtmlFromDocument(store.getState().document), "safenexus-template.html"),
    onExportPdf: async () => {
      const html = buildBuilderHtmlFromDocument(store.getState().document);
      if (onExportPdf) {
        await onExportPdf(html);
        return;
      }
      triggerTextDownload(html, "safenexus-template.html");
      onMessage?.("PDF endpoint nije spojen, preuzet je HTML za provjeru.", { type: "warning" });
    },
  });
  renderToolbar(toolbar, store);
  renderBreadcrumbs(breadcrumbs, store);
  renderSidebar(sidebar, {
    getTokenOptions,
    onAddBlock: addBlock,
    onLoadTemplate: (templateId) => {
      const template = getTemplateById(templateId);
      store.replaceState({
        ...store.getState(),
        document: applyDocumentBranding(template.createDocument(), getLogoDataUrl()),
        selectedIds: [],
        activePage: 1,
      }, "template");
      onMessage?.(`Ucitan template: ${template.label}`, { type: "success" });
    },
  });
  renderPropertiesPanel(properties, store);
  renderLayersPanel(layers, store);
  attachSelection(canvas, store);
  attachDragDrop(root, store, { getTokenOptions, getDefaultPropsForType });
  attachResize(root, store);
  attachKeyboard(root, store);
  attachContextMenu(root, store);

  const unsubscribe = store.subscribe((state, reason) => {
    if (reason !== "init" && reason !== "guides" && reason !== "select") {
      emitChange();
    }
  });
  emitChange();

  return {
    root,
    store,
    destroy() {
      unsubscribe();
      mount.replaceChildren();
      legacyToolbox?.removeAttribute("hidden");
      legacyActions?.removeAttribute("hidden");
    },
    render() {
      // Canvas rendering is driven by the state subscription above. This method
      // is kept for older callers that only need to ensure the builder exists.
    },
    updateTokenOptions() {
      renderSidebar(sidebar, {
        getTokenOptions,
        onAddBlock: addBlock,
        onLoadTemplate: (templateId) => {
          const template = getTemplateById(templateId);
          store.replaceState({ ...store.getState(), document: applyDocumentBranding(template.createDocument(), getLogoDataUrl()), selectedIds: [], activePage: 1 }, "template");
        },
      });
    },
    loadDocument(document = []) {
      const nextDocument = Array.isArray(document) && document.length ? document : defaultDocument(getLogoDataUrl());
      store.replaceState({ ...store.getState(), document: applyDocumentBranding(nextDocument, getLogoDataUrl()), selectedIds: [] }, "load");
    },
    toHtml() {
      return buildBuilderHtmlFromDocument(store.getState().document);
    },
    addBlock,
    refreshBranding(options = {}) {
      store.replaceState({
        ...store.getState(),
        document: applyDocumentBranding(store.getState().document, getLogoDataUrl(), { force: Boolean(options.force) }),
      }, "branding");
      emitChange();
    },
    deleteSelection() {
      store.removeBlock();
    },
    duplicateSelection() {
      store.duplicateBlock();
    },
    alignSelection(mode = "left") {
      alignSelection(store, mode);
    },
    getSelectedBlocks() {
      const state = store.getState();
      return state.selectedIds.map((id) => getBlockById(state.document, id)).filter(Boolean);
    },
    getDocument() {
      return store.getState().document;
    },
  };
}
