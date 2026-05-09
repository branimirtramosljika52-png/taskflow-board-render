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

const HTML_TEXT_ENCODING_REPLACEMENTS = Object.freeze([
  ["\u00c4\u0152", "\u010c"],
  ["\u00c4\u008c", "\u010c"],
  ["\u00c4\u0160", "\u010c"],
  ["\u00c4\u2020", "\u0106"],
  ["\u00c4\u0086", "\u0106"],
  ["\u00c4\u2021", "\u0107"],
  ["\u00c4\u0087", "\u0107"],
  ["\u00c4\u0164", "\u010d"],
  ["\u00c4\u008d", "\u010d"],
  ["\u00c4\u02c7", "\u010d"],
  ["\u00c4\u2018", "\u0111"],
  ["\u00c4\u0091", "\u0111"],
  ["\u00c4\u0090", "\u0110"],
  ["\u00c5\u00a0", "\u0160"],
  ["\u00c5\u00a1", "\u0161"],
  ["\u00c5\u00bd", "\u017d"],
  ["\u00c5\u00be", "\u017e"],
  ["\u0139\u02c7", "\u0161"],
  ["\u0139\u013e", "\u017e"],
  ["\u0139\u02dd", "\u017d"],
  ["\u00c2\u00a0", " "],
]);

function repairHtmlTextEncoding(value = "") {
  let text = String(value ?? "");
  HTML_TEXT_ENCODING_REPLACEMENTS.forEach(([broken, fixed]) => {
    text = text.split(broken).join(fixed);
  });
  return text;
}

function normalizeBuilderTextEncoding(value) {
  if (typeof value === "string") {
    return repairHtmlTextEncoding(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeBuilderTextEncoding(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeBuilderTextEncoding(entry)]),
    );
  }
  return value;
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

function getSharedPageProps(page = {}, firstPage = {}, group = "header") {
  const firstProps = firstPage.props || {};
  const pageProps = page.props || {};
  const sameKey = group === "footer" ? "footerSameEveryPage" : "headerSameEveryPage";
  return firstProps[sameKey] === false ? pageProps : { ...pageProps, ...firstProps };
}

function getPageHeaderHeight(props = {}) {
  const hasWideLogo = props.headerLogoEnabled !== false && String(props.headerLogoDataUrl || "").trim();
  const minimum = hasWideLogo ? 150 : 34;
  const fallback = hasWideLogo ? 150 : 64;
  return Math.max(minimum, Math.min(220, Number(props.headerHeight) || fallback));
}

function renderPageHeader(page = {}, firstPage = {}) {
  const props = getSharedPageProps(page, firstPage, "header");
  if (props.headerEnabled === false) return "";
  const logoDataUrl = String(props.headerLogoDataUrl || "").trim();
  const hasLogo = props.headerLogoEnabled !== false && Boolean(logoDataUrl);
  const headerHeight = getPageHeaderHeight(props);
  const logo = props.headerLogoEnabled === false
    ? ""
    : logoDataUrl
      ? `<img src="${escapeHtml(logoDataUrl)}" alt="Logo tvrtke">`
      : `<span class="sn-report-page-header-logo-empty">Logo</span>`;
  const title = escapeHtml(String(props.headerTitle || "").trim());
  return `<div class="sn-report-page-header${hasLogo ? " has-logo" : ""}${title ? " has-title" : ""}" style="height:${headerHeight}px"><div class="sn-report-page-header-logo">${logo}</div><div class="sn-report-page-header-title">${title}</div></div>`;
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
  return content
    ? `<div class="sn-report-page-footer is-${escapeHtml(props.footerType || "page-number")}">${escapeHtml(content)}</div>`
    : "";
}

export function buildBuilderHtmlFromDocument(document = [], options = {}) {
  const pages = normalizeBuilderTextEncoding(Array.isArray(document) ? document : []);
  if (pages.length === 0) return "";
  const metadata = encodeMetadata(pages);
  const firstPage = pages[0] || {};
  const body = pages.map((page, index) => {
    const width = Number(page.layout?.width) || A4_WIDTH_PX;
    const height = Math.max(A4_HEIGHT_PX, Number(page.layout?.height) || A4_HEIGHT_PX);
    const chrome = `${renderPageHeader(page, firstPage)}${renderPageFooter(page, firstPage, index, pages.length)}`;
    return `<section class="sn-report-page" data-page="${index + 1}" style="width:${width}px;min-height:${height}px">${chrome}${(page.children || []).map(renderExportBlock).join("\n")}</section>`;
  }).join("\n");
  return `<!doctype html>
<html lang="hr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(options.title || "SafeNexus dokument")}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #172033; font-family: Arial, sans-serif; }
  .sn-report-document { display: grid; gap: 0; background: #fff; }
  .sn-report-page { position: relative; overflow: hidden; page-break-after: always; break-after: page; background: #fff; }
  .sn-report-page:last-child { page-break-after: auto; break-after: auto; }
  .sn-report-page-header { position: absolute; z-index: 30; top: 24px; left: 48px; right: 48px; display: flex; align-items: center; gap: 18px; border: 1px solid rgba(0, 111, 192, .18); border-bottom: 3px solid #006fc0; border-radius: 7px; background: #fff; padding: 0 12px; pointer-events: none; }
  .sn-report-page-header.has-logo { gap: 0; border: 0; border-radius: 0; background: transparent; padding: 0; }
  .sn-report-page-header-logo { flex: 0 0 160px; display: flex; align-items: center; height: 100%; }
  .sn-report-page-header.has-logo .sn-report-page-header-logo { flex: 1 1 100%; width: 100%; justify-content: center; }
  .sn-report-page-header-logo img { max-width: 150px; max-height: calc(100% - 10px); object-fit: contain; }
  .sn-report-page-header.has-logo .sn-report-page-header-logo img { width: 100%; height: 100%; max-width: none; max-height: none; object-fit: contain; object-position: center; }
  .sn-report-page-header-logo-empty { display: inline-grid; place-items: center; width: 92px; height: 34px; border: 1px dashed #94a3b8; color: #64748b; font-size: 10px; text-transform: uppercase; }
  .sn-report-page-header-title { flex: 1; color: #172033; font-size: 13px; font-weight: 700; text-align: right; }
  .sn-report-page-header.has-logo .sn-report-page-header-title:empty { display: none; }
  .sn-report-page-header.has-logo .sn-report-page-header-title:not(:empty) { position: absolute; right: 0; bottom: 0; background: rgba(255,255,255,.82); padding: 3px 6px; }
  .sn-report-page-footer { position: absolute; z-index: 30; left: 48px; right: 48px; bottom: 24px; min-height: 34px; border: 1px solid rgba(0, 111, 192, .16); border-top: 2px solid #006fc0; border-radius: 7px; background: #fff; padding: 10px 12px 6px; color: #475569; font-size: 10px; text-align: center; pointer-events: none; }
  .sn-report-positioned { overflow: visible; }
  .sn-report-block { width: 100%; height: 100%; overflow: hidden; }
  .sn-report-block h1, .sn-report-block h2, .sn-report-block p { margin: 0; }
  .sn-report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .sn-report-table th, .sn-report-table td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
  .sn-report-table th { background: #f1f5f9; font-weight: 700; }
  .sn-report-layout-grid { min-width: 0; min-height: 0; }
  .sn-report-grid-cell { min-width: 0; min-height: 0; }
  .sn-report-choice { display: inline-flex; align-items: center; gap: 7px; min-height: 18px; }
  .sn-report-choice-box { position: relative; display: inline-block; width: 14px; height: 14px; border: 1px solid #334155; border-radius: 3px; }
  .sn-report-choice.is-radio .sn-report-choice-box { border-radius: 999px; }
  .sn-report-choice-box.is-checked::after { content: ""; position: absolute; top: 2px; left: 5px; width: 4px; height: 8px; border: solid #172033; border-width: 0 2px 2px 0; transform: rotate(42deg); }
  .sn-report-choice.is-radio .sn-report-choice-box.is-checked::after { top: 3px; left: 3px; width: 6px; height: 6px; border: 0; border-radius: 999px; background: #172033; transform: none; }
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
</head>
<body>
<!-- ${DOCUMENT_BUILDER_METADATA_PREFIX}${metadata} -->
<main class="sn-report-document" data-title="${escapeHtml(options.title || "SafeNexus dokument")}">
${body}
</main>
</body>
</html>`;
}

export function parseBuilderDocumentFromHtml(html = "") {
  const match = String(html || "").match(/<!--\s*SAFE_NEXUS_HTML_BUILDER:([A-Za-z0-9+/=]+)\s*-->/);
  if (!match) return null;
  return decodeMetadata(match[1]);
}
