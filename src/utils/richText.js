const BLOCK_TAGS = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "ul", "ol", "li", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col", "hr"]);
const INLINE_TAGS = new Set(["br", "strong", "b", "em", "i", "u", "span", "sup", "sub", "s", "strike", "small", "mark", "a", "img", "font"]);
const ALLOWED_TAGS = new Set([...BLOCK_TAGS, ...INLINE_TAGS]);
const VOID_TAGS = new Set(["br", "hr", "img", "col"]);
const TABLE_ATTRIBUTES = new Set(["colspan", "rowspan"]);
const LEGACY_FONT_SIZE_MAP = Object.freeze({
  1: "8pt",
  2: "10pt",
  3: "12pt",
  4: "14pt",
  5: "18pt",
  6: "24pt",
  7: "36pt",
});
const SAFE_STYLE_PROPERTIES = new Set([
  "background-color",
  "border",
  "border-bottom",
  "border-bottom-color",
  "border-bottom-style",
  "border-bottom-width",
  "border-collapse",
  "border-color",
  "border-left",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-right",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-spacing",
  "border-style",
  "border-top",
  "border-top-color",
  "border-top-style",
  "border-top-width",
  "border-width",
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "height",
  "letter-spacing",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-width",
  "min-width",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "text-indent",
  "vertical-align",
  "white-space",
  "width",
]);
const LENGTH_STYLE_PROPERTIES = new Set([
  "border-bottom-width",
  "border-left-width",
  "border-right-width",
  "border-spacing",
  "border-top-width",
  "border-width",
  "font-size",
  "height",
  "letter-spacing",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-width",
  "min-width",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-indent",
  "width",
]);
const SAFE_BORDER_STYLES = new Set(["none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"]);

function hasDomParser() {
  return typeof document !== "undefined" && typeof document.createElement === "function";
}

export function escapeRichTextHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeTagName(tagName = "") {
  const tag = String(tagName || "").trim().toLowerCase();
  if (tag === "b") return "strong";
  if (tag === "i") return "em";
  if (tag === "strike") return "s";
  if (tag === "font") return "span";
  return tag;
}

function extractWordClipboardFragment(html = "") {
  const source = String(html ?? "");
  const fragmentMatch = source.match(/<!--\s*StartFragment\s*-->([\s\S]*?)<!--\s*EndFragment\s*-->/i);
  if (fragmentMatch) {
    return fragmentMatch[1];
  }
  const bodyMatch = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : source;
}

function isSafeCssColor(value = "") {
  const color = String(value || "").trim();
  return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%+-]+\)|hsla?\([\d\s.,%+-]+\)|[a-z][a-z0-9 -]{1,38})$/i.test(color);
}

function isSafeCssLength(value = "", { allowUnitless = false } = {}) {
  const source = String(value || "").trim();
  if (/^(auto|normal|inherit|initial|unset)$/i.test(source)) return true;
  if (allowUnitless && /^-?\d+(?:\.\d+)?$/i.test(source)) return true;
  return /^-?\d+(?:\.\d+)?(?:px|pt|pc|em|rem|%|cm|mm|in)$/i.test(source);
}

function readLegacyFontSize(value = "") {
  const source = String(value || "").trim();
  if (!source) return "";
  if (LEGACY_FONT_SIZE_MAP[source]) return LEGACY_FONT_SIZE_MAP[source];
  return isSafeCssLength(source) ? source : "";
}

function isSafeCssLengthList(value = "") {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => isSafeCssLength(part));
}

function isSafeBorderValue(value = "") {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => (
      isSafeCssLength(part)
      || SAFE_BORDER_STYLES.has(part.toLowerCase())
      || isSafeCssColor(part)
    ));
}

function isSafeCssValue(property = "", value = "") {
  const source = String(value || "")
    .replace(/!important/gi, "")
    .trim();
  if (!source || /url\s*\(|expression\s*\(|javascript:|vbscript:|data:|behavior\s*:|binding\s*:|@import|[<>]/i.test(source)) {
    return false;
  }
  if (property === "text-align") {
    return /^(left|right|center|justify|start|end)$/i.test(source);
  }
  if (property === "font-weight") {
    return /^(normal|bold|bolder|lighter|[1-9]00)$/i.test(source);
  }
  if (property === "font-style") {
    return /^(normal|italic|oblique)$/i.test(source);
  }
  if (property === "text-decoration") {
    return /^(none|underline|line-through|overline)(\s+(underline|line-through|overline))*$/i.test(source);
  }
  if (property === "white-space") {
    return /^(normal|nowrap|pre|pre-wrap|pre-line|break-spaces)$/i.test(source);
  }
  if (property === "border-collapse") {
    return /^(collapse|separate)$/i.test(source);
  }
  if (property === "border-style" || property.endsWith("-style")) {
    return source.split(/\s+/).every((part) => SAFE_BORDER_STYLES.has(part.toLowerCase()));
  }
  if (property === "color" || property === "background-color" || property.endsWith("-color")) {
    return isSafeCssColor(source);
  }
  if (property === "font-family") {
    return /^[\w\s"',.-]+$/i.test(source);
  }
  if (property === "vertical-align") {
    return /^(baseline|sub|super|top|text-top|middle|bottom|text-bottom)$/i.test(source) || isSafeCssLength(source);
  }
  if (property === "line-height") {
    return isSafeCssLength(source, { allowUnitless: true });
  }
  if (LENGTH_STYLE_PROPERTIES.has(property)) {
    return isSafeCssLengthList(source);
  }
  if (property === "border" || property.startsWith("border-")) {
    return isSafeBorderValue(source);
  }
  return /^[\w\s"',.#()%+-]+$/i.test(source);
}

function sanitizeStyle(style = "") {
  const safe = [];
  String(style || "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const separatorIndex = entry.indexOf(":");
      if (separatorIndex <= 0) return;
      const property = entry.slice(0, separatorIndex).trim().toLowerCase();
      const value = entry.slice(separatorIndex + 1).replace(/!important/gi, "").trim();
      if (property.startsWith("mso-") || !SAFE_STYLE_PROPERTIES.has(property) || !isSafeCssValue(property, value)) {
        return;
      }
      safe.push(`${property}:${value}`);
    });
  return safe.join(";");
}

function sanitizeRichTextImageSrc(value = "") {
  const src = String(value || "").trim();
  if (/^data:image\/(?:png|jpe?g|gif|webp|bmp);base64,[a-z0-9+/=\s]+$/i.test(src)) {
    return src.replace(/\s+/g, "");
  }
  if (/^https?:\/\//i.test(src)) {
    return src;
  }
  return "";
}

function sanitizeRichTextHref(value = "") {
  const href = String(value || "").trim();
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) {
    return href;
  }
  return "";
}

function readSafeDimensionAttribute(value = "") {
  const dimension = String(value || "").trim();
  if (/^\d{1,4}$/.test(dimension)) {
    return `${dimension}px`;
  }
  if (/^\d{1,4}(?:px|pt|%)$/i.test(dimension)) {
    return dimension;
  }
  return "";
}

function getLegacyElementStyle(sourceElement) {
  const styles = [];
  const align = String(sourceElement.getAttribute("align") || "").trim().toLowerCase();
  const verticalAlign = String(sourceElement.getAttribute("valign") || "").trim().toLowerCase();
  const bgcolor = String(sourceElement.getAttribute("bgcolor") || "").trim();
  const color = String(sourceElement.getAttribute("color") || "").trim();
  const face = String(sourceElement.getAttribute("face") || "").trim();
  const size = readLegacyFontSize(sourceElement.getAttribute("size") || "");
  const width = readSafeDimensionAttribute(sourceElement.getAttribute("width") || "");
  const height = readSafeDimensionAttribute(sourceElement.getAttribute("height") || "");

  if (/^(left|right|center|justify)$/.test(align)) styles.push(`text-align:${align}`);
  if (/^(top|middle|bottom|baseline)$/.test(verticalAlign)) styles.push(`vertical-align:${verticalAlign}`);
  if (isSafeCssColor(bgcolor)) styles.push(`background-color:${bgcolor}`);
  if (isSafeCssColor(color)) styles.push(`color:${color}`);
  if (/^[\w\s"',.-]+$/i.test(face)) styles.push(`font-family:${face}`);
  if (size) styles.push(`font-size:${size}`);
  if (width) styles.push(`width:${width}`);
  if (height) styles.push(`height:${height}`);

  return styles.join(";");
}

function sanitizeWithDom(html = "") {
  const template = document.createElement("template");
  template.innerHTML = extractWordClipboardFragment(html)
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<\/?o:p[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createDocumentFragment();
    }

    const sourceElement = node;
    const tag = normalizeTagName(sourceElement.tagName);
    if (tag === "script" || tag === "style") {
      return document.createDocumentFragment();
    }
    if (!ALLOWED_TAGS.has(tag)) {
      const fragment = document.createDocumentFragment();
      Array.from(sourceElement.childNodes).forEach((child) => {
        fragment.append(cleanNode(child));
      });
      return fragment;
    }

    if (tag === "br" || tag === "hr" || tag === "col") {
      return document.createElement(tag);
    }

    if (tag === "img") {
      const src = sanitizeRichTextImageSrc(sourceElement.getAttribute("src") || "");
      if (!src) {
        return document.createDocumentFragment();
      }
      const image = document.createElement("img");
      image.setAttribute("src", src);
      const alt = String(sourceElement.getAttribute("alt") || sourceElement.getAttribute("title") || "Slika").trim().slice(0, 180);
      image.setAttribute("alt", alt || "Slika");
      image.setAttribute("loading", "lazy");
      const legacyStyle = getLegacyElementStyle(sourceElement);
      const style = sanitizeStyle([sourceElement.getAttribute("style") || "", legacyStyle].filter(Boolean).join(";"));
      if (style) image.setAttribute("style", style);
      return image;
    }

    const cleanElement = document.createElement(tag);
    const legacyStyle = getLegacyElementStyle(sourceElement);
    const style = sanitizeStyle([sourceElement.getAttribute("style") || "", legacyStyle].filter(Boolean).join(";"));
    if (style) {
      cleanElement.setAttribute("style", style);
    }

    if (tag === "a") {
      const href = sanitizeRichTextHref(sourceElement.getAttribute("href") || "");
      if (href) {
        cleanElement.setAttribute("href", href);
        cleanElement.setAttribute("target", "_blank");
        cleanElement.setAttribute("rel", "noopener noreferrer");
      }
    }

    if (tag === "th" || tag === "td") {
      TABLE_ATTRIBUTES.forEach((attributeName) => {
        const value = Number.parseInt(sourceElement.getAttribute(attributeName) || "", 10);
        if (Number.isInteger(value) && value > 1 && value <= 24) {
          cleanElement.setAttribute(attributeName, String(value));
        }
      });
    }

    Array.from(sourceElement.childNodes).forEach((child) => {
      cleanElement.append(cleanNode(child));
    });

    if (tag === "span" && !cleanElement.getAttribute("style")) {
      const fragment = document.createDocumentFragment();
      while (cleanElement.firstChild) {
        fragment.append(cleanElement.firstChild);
      }
      return fragment;
    }

    return cleanElement;
  };

  const output = document.createElement("div");
  Array.from(template.content.childNodes).forEach((node) => {
    output.append(cleanNode(node));
  });
  return output.innerHTML
    .replace(/(?:<p>\s*(?:&nbsp;|\s)*<\/p>)+/gi, "")
    .trim();
}

function readAttribute(attrs = "", name = "") {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = String(attrs || "").match(pattern);
  return match ? (match[1] || match[2] || match[3] || "") : "";
}

function buildSafeStyleAttribute(attrs = "") {
  const style = readAttribute(attrs, "style");
  const legacyStyles = [];
  const align = readAttribute(attrs, "align").trim().toLowerCase();
  const valign = readAttribute(attrs, "valign").trim().toLowerCase();
  const bgcolor = readAttribute(attrs, "bgcolor").trim();
  const color = readAttribute(attrs, "color").trim();
  const face = readAttribute(attrs, "face").trim();
  const size = readLegacyFontSize(readAttribute(attrs, "size"));
  const width = readSafeDimensionAttribute(readAttribute(attrs, "width"));
  const height = readSafeDimensionAttribute(readAttribute(attrs, "height"));

  if (/^(left|right|center|justify)$/.test(align)) legacyStyles.push(`text-align:${align}`);
  if (/^(top|middle|bottom|baseline)$/.test(valign)) legacyStyles.push(`vertical-align:${valign}`);
  if (isSafeCssColor(bgcolor)) legacyStyles.push(`background-color:${bgcolor}`);
  if (isSafeCssColor(color)) legacyStyles.push(`color:${color}`);
  if (/^[\w\s"',.-]+$/i.test(face)) legacyStyles.push(`font-family:${face}`);
  if (size) legacyStyles.push(`font-size:${size}`);
  if (width) legacyStyles.push(`width:${width}`);
  if (height) legacyStyles.push(`height:${height}`);

  const safeStyle = sanitizeStyle([style, ...legacyStyles].filter(Boolean).join(";"));
  return safeStyle ? ` style="${escapeRichTextHtml(safeStyle)}"` : "";
}

function sanitizeWithoutDom(html = "") {
  return extractWordClipboardFragment(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:class|id|lang|data-[\w-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<\/?([a-z0-9:-]+)([^>]*)>/gi, (match, tagName = "", attrs = "") => {
      const tag = normalizeTagName(tagName);
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (match.startsWith("</")) {
        return VOID_TAGS.has(tag) ? "" : `</${tag}>`;
      }
      if (tag === "br" || tag === "hr" || tag === "col") return `<${tag}>`;
      if (tag === "img") {
        const src = sanitizeRichTextImageSrc(readAttribute(attrs, "src"));
        if (!src) return "";
        const alt = escapeRichTextHtml(String(readAttribute(attrs, "alt") || readAttribute(attrs, "title") || "Slika").slice(0, 180));
        return `<img src="${escapeRichTextHtml(src)}" alt="${alt}" loading="lazy"${buildSafeStyleAttribute(attrs)}>`;
      }
      const styleAttr = buildSafeStyleAttribute(attrs);
      const linkAttr = tag === "a"
        ? (() => {
          const href = sanitizeRichTextHref(readAttribute(attrs, "href"));
          return href ? ` href="${escapeRichTextHtml(href)}" target="_blank" rel="noopener noreferrer"` : "";
        })()
        : "";
      const safeAttrs = (tag === "td" || tag === "th")
        ? String(attrs || "").match(/\s(?:colspan|rowspan)=["']?\d+["']?/gi)?.join("") || ""
        : "";
      return `<${tag}${safeAttrs}${linkAttr}${styleAttr}>`;
    })
    .trim();
}

export function sanitizeRichTextHtml(html = "") {
  const source = String(html ?? "").trim();
  if (!source) {
    return "";
  }
  return hasDomParser() ? sanitizeWithDom(source) : sanitizeWithoutDom(source);
}

function renderPlainTextGroup(lines = [], ordered = false) {
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${lines.map((line) => `<li>${escapeRichTextHtml(line)}</li>`).join("")}</${tag}>`;
}

export function plainTextToRichTextHtml(text = "") {
  const lines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  const chunks = [];
  let listItems = [];
  let listOrdered = false;

  const flushList = () => {
    if (listItems.length === 0) return;
    chunks.push(renderPlainTextGroup(listItems, listOrdered));
    listItems = [];
    listOrdered = false;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    const unorderedMatch = line.match(/^(?:[-*\u2022])\s+(.+)$/);
    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch);
      if (listItems.length > 0 && ordered !== listOrdered) {
        flushList();
      }
      listOrdered = ordered;
      listItems.push((unorderedMatch?.[1] || orderedMatch?.[1] || "").trim());
      return;
    }

    flushList();
    chunks.push(`<p>${escapeRichTextHtml(rawLine)}</p>`);
  });

  flushList();
  return chunks.join("") || "";
}

export function isRichTextHtml(value = "") {
  return /<(?:h[1-6]|p|div|ul|ol|li|table|tr|td|th|strong|em|u|br|blockquote|hr|span|img|a|sup|sub|pre)\b/i.test(String(value ?? ""));
}

export function normalizeRichTextHtml(value = "") {
  const source = String(value ?? "").trim();
  if (!source) {
    return "";
  }
  return isRichTextHtml(source)
    ? sanitizeRichTextHtml(source)
    : plainTextToRichTextHtml(source);
}

export function richTextHtmlToPlainText(html = "") {
  const source = sanitizeRichTextHtml(html);
  if (!source) {
    return "";
  }

  if (hasDomParser()) {
    const container = document.createElement("div");
    container.innerHTML = source;
    const lines = [];
    const visit = (node, prefix = "") => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = String(node.textContent || "").replace(/\s+/g, " ").trim();
        if (text) lines.push(`${prefix}${text}`);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toLowerCase();
      if (tag === "br") {
        lines.push("");
        return;
      }
      if (tag === "li") {
        const text = String(node.textContent || "").replace(/\s+/g, " ").trim();
        if (text) lines.push(`${prefix || "- "}${text}`);
        return;
      }
      if (tag === "tr") {
        const cells = Array.from(node.querySelectorAll(":scope > th, :scope > td"))
          .map((cell) => String(cell.textContent || "").replace(/\s+/g, " ").trim())
          .filter(Boolean);
        if (cells.length > 0) lines.push(cells.join(" | "));
        return;
      }
      Array.from(node.childNodes).forEach((child) => visit(child, prefix));
      if (BLOCK_TAGS.has(tag) && lines.at(-1) !== "") {
        lines.push("");
      }
    };
    Array.from(container.childNodes).forEach((node) => visit(node));
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  return source
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/(?:td|th)>\s*<(?:td|th)\b[^>]*>/gi, " | ")
    .replace(/<(?:td|th)\b[^>]*>/gi, "")
    .replace(/<\/(?:td|th)>/gi, "")
    .replace(/<\/(?:p|h[1-4]|blockquote|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getRichTextHtmlFromClipboard(clipboardData) {
  const html = clipboardData?.getData?.("text/html") || "";
  if (html.trim()) {
    const sanitized = sanitizeRichTextHtml(html);
    if (sanitized) return sanitized;
  }
  return plainTextToRichTextHtml(clipboardData?.getData?.("text/plain") || "");
}
