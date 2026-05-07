import { blockToHtml } from "./registry.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../utils/math.js";

export const DOCUMENT_BUILDER_METADATA_PREFIX = "SAFE_NEXUS_HTML_BUILDER:";

function escapeHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function encodeMetadata(document = []) {
  try {
    return window.btoa(unescape(encodeURIComponent(JSON.stringify({ version: 2, document }))));
  } catch {
    return "";
  }
}

export function decodeMetadata(payload = "") {
  try {
    return JSON.parse(decodeURIComponent(escape(window.atob(String(payload || "")))));
  } catch {
    return null;
  }
}

function blockLayoutStyles(block = {}) {
  const layout = block.layout || {};
  return [
    "position:absolute",
    `left:${Number(layout.x) || 0}px`,
    `top:${Number(layout.y) || 0}px`,
    `width:${Math.max(1, Number(layout.width) || 1)}px`,
    `height:${Math.max(1, Number(layout.height) || 1)}px`,
    `transform:rotate(${Number(layout.rotation) || 0}deg)`,
    "box-sizing:border-box",
  ].join(";");
}

function renderExportBlock(block = {}) {
  if (block.props?.hidden) return "";
  const children = (block.children || []).map(renderExportBlock).join("");
  return `<div class="sn-report-positioned sn-report-type-${escapeHtml(block.type)}" style="${blockLayoutStyles(block)}">${blockToHtml(block)}${children}</div>`;
}

export function buildBuilderHtmlFromDocument(document = [], options = {}) {
  const pages = Array.isArray(document) ? document : [];
  if (pages.length === 0) return "";
  const metadata = encodeMetadata(pages);
  const body = pages.map((page, index) => {
    const width = Number(page.layout?.width) || A4_WIDTH_PX;
    const height = Math.max(A4_HEIGHT_PX, Number(page.layout?.height) || A4_HEIGHT_PX);
    return `<section class="sn-report-page" data-page="${index + 1}" style="width:${width}px;min-height:${height}px">${(page.children || []).map(renderExportBlock).join("\n")}</section>`;
  }).join("\n");
  return `<!-- ${DOCUMENT_BUILDER_METADATA_PREFIX}${metadata} -->
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #172033; font-family: Arial, sans-serif; }
  .sn-report-document { display: grid; gap: 0; background: #fff; }
  .sn-report-page { position: relative; overflow: hidden; page-break-after: always; break-after: page; background: #fff; }
  .sn-report-page:last-child { page-break-after: auto; break-after: auto; }
  .sn-report-positioned { overflow: visible; }
  .sn-report-block { width: 100%; height: 100%; overflow: hidden; }
  .sn-report-block h1, .sn-report-block h2, .sn-report-block p { margin: 0; }
  .sn-report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .sn-report-table th, .sn-report-table td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
  .sn-report-table th { background: #f1f5f9; font-weight: 700; }
  .sn-report-layout-grid { min-width: 0; min-height: 0; }
  .sn-report-grid-cell { min-width: 0; min-height: 0; }
  .sn-report-signature { display: grid; align-content: end; gap: 8px; height: 100%; text-align: center; }
  .sn-report-signature em { display: block; border-top: 1px solid #64748b; min-height: 1px; }
  .sn-report-chart { display: flex; gap: 8px; align-items: end; height: 100%; padding: 12px; }
  .sn-report-chart span { flex: 1; background: linear-gradient(180deg, #60a5fa, #2563eb); border-radius: 6px 6px 0 0; }
  .sn-report-qr, .sn-report-barcode { display: grid; place-items: center; height: 100%; border: 1px solid #172033; font-size: 10px; letter-spacing: 0; }
  @media screen {
    body { background: #e5e7eb; padding: 24px; }
    .sn-report-document { gap: 24px; justify-items: center; background: transparent; }
    .sn-report-page { box-shadow: 0 18px 50px rgba(15, 23, 42, .18); }
  }
  @media print {
    body { background: #fff; }
    .sn-report-document { display: block; }
    .sn-report-page { box-shadow: none; }
  }
</style>
<main class="sn-report-document" data-title="${escapeHtml(options.title || "SafeNexus dokument")}">
${body}
</main>`;
}

export function parseBuilderDocumentFromHtml(html = "") {
  const match = String(html || "").match(/<!--\s*SAFE_NEXUS_HTML_BUILDER:([A-Za-z0-9+/=]+)\s*-->/);
  if (!match) return null;
  return decodeMetadata(match[1]);
}
