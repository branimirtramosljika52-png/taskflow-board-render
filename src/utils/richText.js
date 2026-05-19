const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "blockquote", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "hr"]);
const INLINE_TAGS = new Set(["br", "strong", "b", "em", "i", "u", "span"]);
const ALLOWED_TAGS = new Set([...BLOCK_TAGS, ...INLINE_TAGS]);
const TABLE_ATTRIBUTES = new Set(["colspan", "rowspan"]);
const SAFE_STYLE_PROPERTIES = new Set(["text-align", "font-weight", "font-style", "text-decoration"]);

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
      const value = entry.slice(separatorIndex + 1).trim();
      if (!SAFE_STYLE_PROPERTIES.has(property) || /url\s*\(|expression\s*\(/i.test(value)) {
        return;
      }
      if (property === "text-align" && !/^(left|right|center|justify)$/i.test(value)) {
        return;
      }
      if (property === "font-weight" && !/^(normal|bold|[1-9]00)$/i.test(value)) {
        return;
      }
      if (property === "font-style" && !/^(normal|italic)$/i.test(value)) {
        return;
      }
      if (property === "text-decoration" && !/^(none|underline|line-through)$/i.test(value)) {
        return;
      }
      safe.push(`${property}:${value}`);
    });
  return safe.join(";");
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

    if (tag === "br" || tag === "hr") {
      return document.createElement(tag);
    }

    const cleanElement = document.createElement(tag);
    const style = sanitizeStyle(sourceElement.getAttribute("style") || "");
    if (style) {
      cleanElement.setAttribute("style", style);
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

function sanitizeWithoutDom(html = "") {
  return extractWordClipboardFragment(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:class|id|lang|width|height|valign|align|data-[\w-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_match, a = "", b = "", c = "") => {
      const style = sanitizeStyle(a || b || c);
      return style ? ` style="${escapeRichTextHtml(style)}"` : "";
    })
    .replace(/<\/?([a-z0-9:-]+)([^>]*)>/gi, (match, tagName = "", attrs = "") => {
      const tag = normalizeTagName(tagName);
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (tag === "br" || tag === "hr") return `<${tag}>`;
      const style = String(attrs || "").match(/\sstyle="([^"]*)"/i)?.[1] || "";
      const safeStyle = sanitizeStyle(style);
      const styleAttr = safeStyle ? ` style="${escapeRichTextHtml(safeStyle)}"` : "";
      const safeAttrs = (tag === "td" || tag === "th")
        ? String(attrs || "").match(/\s(?:colspan|rowspan)=["']?\d+["']?/gi)?.join("") || ""
        : "";
      return match.startsWith("</") ? `</${tag}>` : `<${tag}${safeAttrs}${styleAttr}>`;
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
  return /<(?:h[1-4]|p|ul|ol|li|table|tr|td|th|strong|em|u|br|blockquote|hr)\b/i.test(String(value ?? ""));
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
