import { el } from "../utils/dom.js";
import { createId } from "../utils/ids.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../utils/math.js";

const baseLayouts = {
  page: { x: 0, y: 0, width: A4_WIDTH_PX, height: A4_HEIGHT_PX, rotation: 0 },
  section: { x: 56, y: 80, width: 682, height: 220, rotation: 0 },
  container: { x: 64, y: 120, width: 300, height: 160, rotation: 0 },
  heading: { x: 72, y: 82, width: 520, height: 48, rotation: 0 },
  text: { x: 72, y: 144, width: 480, height: 92, rotation: 0 },
  image: { x: 72, y: 160, width: 240, height: 150, rotation: 0 },
  logo: { x: 72, y: 52, width: 170, height: 56, rotation: 0 },
  line: { x: 72, y: 214, width: 360, height: 2, rotation: 0 },
  spacer: { x: 72, y: 240, width: 300, height: 32, rotation: 0 },
  divider: { x: 72, y: 240, width: 520, height: 8, rotation: 0 },
  table: { x: 72, y: 280, width: 620, height: 220, rotation: 0 },
  badge: { x: 72, y: 250, width: 150, height: 34, rotation: 0 },
  status: { x: 246, y: 250, width: 170, height: 38, rotation: 0 },
  input: { x: 72, y: 310, width: 240, height: 42, rotation: 0 },
  textarea: { x: 72, y: 370, width: 380, height: 98, rotation: 0 },
  checkbox: { x: 72, y: 490, width: 240, height: 32, rotation: 0 },
  radio: { x: 72, y: 532, width: 240, height: 32, rotation: 0 },
  select: { x: 72, y: 574, width: 240, height: 42, rotation: 0 },
  date: { x: 72, y: 626, width: 180, height: 42, rotation: 0 },
  signature: { x: 410, y: 900, width: 270, height: 110, rotation: 0 },
  stamp: { x: 96, y: 900, width: 140, height: 140, rotation: -8 },
  chart: { x: 72, y: 540, width: 420, height: 220, rotation: 0 },
  list: { x: 72, y: 260, width: 360, height: 130, rotation: 0 },
  icon: { x: 620, y: 72, width: 48, height: 48, rotation: 0 },
  qr: { x: 592, y: 900, width: 92, height: 92, rotation: 0 },
  barcode: { x: 72, y: 1010, width: 220, height: 56, rotation: 0 },
  pagebreak: { x: 0, y: A4_HEIGHT_PX - 8, width: A4_WIDTH_PX, height: 8, rotation: 0 },
};

const baseStyles = {
  page: { backgroundColor: "#ffffff" },
  section: { backgroundColor: "#ffffff", borderColor: "#d8e2ef", borderWidth: "1px", borderRadius: "8px", padding: "18px" },
  container: { backgroundColor: "#f8fafc", borderColor: "#d8e2ef", borderWidth: "1px", borderRadius: "8px", padding: "16px" },
  heading: { fontFamily: "Arial", fontSize: "28px", fontWeight: "700", lineHeight: "1.15", color: "#111827", textAlign: "left" },
  text: { fontFamily: "Arial", fontSize: "13px", fontWeight: "400", lineHeight: "1.55", color: "#1f2937", textAlign: "left" },
  image: { objectFit: "cover", borderRadius: "6px", backgroundColor: "#eef2f7" },
  logo: { objectFit: "contain", backgroundColor: "transparent" },
  line: { backgroundColor: "#006fc0" },
  spacer: { backgroundColor: "transparent" },
  divider: { backgroundColor: "#cbd5e1" },
  table: { fontFamily: "Arial", fontSize: "11px", color: "#172033", borderColor: "#cbd5e1" },
  badge: { backgroundColor: "#eaf2ff", color: "#1d4ed8", borderRadius: "999px", fontSize: "12px", fontWeight: "700", textAlign: "center" },
  status: { backgroundColor: "#ecfdf5", color: "#047857", borderRadius: "999px", fontSize: "12px", fontWeight: "700", textAlign: "center" },
  input: { backgroundColor: "#ffffff", color: "#172033", borderColor: "#cbd5e1", borderWidth: "1px", borderRadius: "6px", fontSize: "12px" },
  textarea: { backgroundColor: "#ffffff", color: "#172033", borderColor: "#cbd5e1", borderWidth: "1px", borderRadius: "6px", fontSize: "12px" },
  checkbox: { color: "#172033", fontSize: "12px" },
  radio: { color: "#172033", fontSize: "12px" },
  select: { backgroundColor: "#ffffff", color: "#172033", borderColor: "#cbd5e1", borderWidth: "1px", borderRadius: "6px", fontSize: "12px" },
  date: { backgroundColor: "#ffffff", color: "#172033", borderColor: "#cbd5e1", borderWidth: "1px", borderRadius: "6px", fontSize: "12px" },
  signature: { color: "#172033", fontSize: "12px", textAlign: "center" },
  stamp: { color: "#9f1239", borderColor: "#9f1239", borderWidth: "2px", borderRadius: "999px", fontWeight: "800" },
  chart: { backgroundColor: "#f8fafc", borderColor: "#d8e2ef", borderWidth: "1px", borderRadius: "8px" },
  list: { fontFamily: "Arial", fontSize: "13px", color: "#1f2937", lineHeight: "1.45" },
  icon: { color: "#1d4ed8", fontSize: "32px", textAlign: "center" },
  qr: { backgroundColor: "#ffffff", borderColor: "#172033", borderWidth: "1px" },
  barcode: { backgroundColor: "#ffffff", color: "#172033" },
  pagebreak: { backgroundColor: "#f97316" },
};

const defaultProps = {
  page: { name: "A4 stranica" },
  section: { title: "Poglavlje", content: "" },
  container: { label: "Kontejner" },
  heading: { content: "NASLOV DOKUMENTA" },
  text: { content: "Upisi tekst, opis, napomenu ili povezi token poput {{BROJ_RADNOG_NALOGA}}." },
  image: { src: "", alt: "Slika" },
  logo: { src: "", alt: "Logo" },
  line: {},
  spacer: {},
  divider: {},
  table: {
    rows: [
      ["Stavka", "Opis", "Vrijednost"],
      ["1", "Mjerenje", "{{REZULTAT}}"],
      ["2", "Napomena", ""],
    ],
    header: true,
  },
  badge: { content: "Oznaka" },
  status: { content: "Status" },
  input: { label: "Polje", value: "{{VRIJEDNOST}}" },
  textarea: { label: "Opis", value: "{{OPIS}}" },
  checkbox: { label: "Potvrdjeno", checked: false },
  radio: { label: "Odabir", checked: false },
  select: { label: "Izbor", value: "{{ODABIR}}" },
  date: { label: "Datum", value: "{{DATUM}}" },
  signature: { label: "Potpis", name: "{{ISPITIVAC}}" },
  stamp: { content: "ODOBRENO" },
  chart: { title: "Graf", values: [42, 68, 37, 84] },
  list: { items: ["Prva stavka", "Druga stavka", "Treca stavka"] },
  icon: { icon: "check" },
  qr: { value: "{{QR_KOD}}" },
  barcode: { value: "{{BARCODE}}" },
  pagebreak: { label: "Nova stranica" },
};

function escapeHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineStyles(styles = {}) {
  return Object.entries(styles || {})
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}:${value}`)
    .join(";");
}

function editableText(block, propName, fallback, context, tagName = "div") {
  const node = el(tagName, {
    contenteditable: "true",
    spellcheck: "false",
    className: "sn-builder-editable",
  }, block.props?.[propName] || fallback);
  node.addEventListener("blur", () => {
    context.updateBlock(block.id, { props: { ...block.props, [propName]: node.innerText } }, { history: false });
    context.commitHistory();
  });
  node.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      node.textContent = block.props?.[propName] || fallback;
      node.blur();
    }
  });
  return node;
}

function renderTable(block, context) {
  const rows = Array.isArray(block.props?.rows) ? block.props.rows : defaultProps.table.rows;
  const table = el("table", { className: "sn-builder-table" });
  rows.forEach((row, rowIndex) => {
      const tr = el("tr");
    (Array.isArray(row) ? row : []).forEach((cell, columnIndex) => {
      const tag = block.props?.header && rowIndex === 0 ? "th" : "td";
      const td = el(tag, { contenteditable: "true", spellcheck: "false" }, cell || "");
      td.addEventListener("blur", () => {
        const nextRows = rows.map((entry) => [...entry]);
        nextRows[rowIndex][columnIndex] = td.innerText;
        context.updateBlock(block.id, { props: { ...block.props, rows: nextRows } }, { history: false });
        context.commitHistory();
      });
      tr.append(td);
    });
    table.append(tr);
  });
  return table;
}

function renderByType(block, context) {
  const type = block.type;
  if (type === "heading") return editableText(block, "content", "NASLOV", context, "h1");
  if (type === "text") return editableText(block, "content", "Tekst", context, "p");
  if (type === "section") return el("div", { className: "sn-builder-section-shell" }, [
    editableText(block, "title", "Poglavlje", context, "h2"),
    editableText(block, "content", "", context, "p"),
  ]);
  if (type === "container") return el("div", { className: "sn-builder-container-shell" }, block.props?.label || "Kontejner");
  if (type === "image" || type === "logo") {
    return block.props?.src
      ? el("img", { src: block.props.src, alt: block.props.alt || "" })
      : el("div", { className: "sn-builder-media-placeholder" }, type === "logo" ? "Logo" : "Slika");
  }
  if (type === "line" || type === "divider" || type === "spacer" || type === "pagebreak") return el("div", { className: `sn-builder-${type}` });
  if (type === "table") return renderTable(block, context);
  if (type === "badge" || type === "status" || type === "stamp" || type === "icon") return editableText(block, "content", block.props?.icon || block.props?.content || type, context);
  if (["input", "textarea", "select", "date"].includes(type)) {
    return el("div", { className: "sn-builder-form-line" }, [
      editableText(block, "label", block.props?.label || "Polje", context, "span"),
      editableText(block, "value", block.props?.value || "", context, "strong"),
    ]);
  }
  if (type === "checkbox" || type === "radio") {
    return el("div", { className: "sn-builder-choice-line" }, [
      el("span", { className: `sn-builder-choice-dot is-${type}` }, block.props?.checked ? "x" : ""),
      editableText(block, "label", block.props?.label || "Odabir", context, "span"),
    ]);
  }
  if (type === "signature") {
    return el("div", { className: "sn-builder-signature" }, [
      editableText(block, "label", "Potpis", context, "span"),
      el("em"),
      editableText(block, "name", "{{ISPITIVAC}}", context, "strong"),
    ]);
  }
  if (type === "chart") {
    const values = Array.isArray(block.props?.values) ? block.props.values : defaultProps.chart.values;
    return el("div", { className: "sn-builder-chart" }, values.map((value) => el("span", {
      style: { height: `${Math.max(8, Math.min(100, Number(value) || 10))}%` },
    })));
  }
  if (type === "list") {
    const items = Array.isArray(block.props?.items) ? block.props.items : defaultProps.list.items;
    return el("ul", { className: "sn-builder-list" }, items.map((item) => el("li", {}, item)));
  }
  if (type === "qr") return el("div", { className: "sn-builder-qr" }, block.props?.value || "{{QR_KOD}}");
  if (type === "barcode") return el("div", { className: "sn-builder-barcode" }, block.props?.value || "{{BARCODE}}");
  return editableText(block, "content", type, context);
}

function tableToHtml(block) {
  const rows = Array.isArray(block.props?.rows) ? block.props.rows : defaultProps.table.rows;
  return `<table class="sn-report-table">${rows.map((row, rowIndex) => `<tr>${(row || []).map((cell) => {
    const tag = block.props?.header && rowIndex === 0 ? "th" : "td";
    return `<${tag}>${escapeHtml(cell)}</${tag}>`;
  }).join("")}</tr>`).join("")}</table>`;
}

function contentToHtml(block) {
  const type = block.type;
  if (type === "heading") return `<h1>${escapeHtml(block.props?.content || "NASLOV")}</h1>`;
  if (type === "text") return `<p>${escapeHtml(block.props?.content || "").replace(/\n/g, "<br>")}</p>`;
  if (type === "section") return `<section><h2>${escapeHtml(block.props?.title || "Poglavlje")}</h2><p>${escapeHtml(block.props?.content || "").replace(/\n/g, "<br>")}</p></section>`;
  if (type === "image" || type === "logo") return block.props?.src ? `<img src="${escapeHtml(block.props.src)}" alt="${escapeHtml(block.props.alt || "")}">` : "";
  if (type === "line" || type === "divider") return "<hr>";
  if (type === "spacer") return "";
  if (type === "table") return tableToHtml(block);
  if (type === "badge" || type === "status" || type === "stamp" || type === "icon") return `<span>${escapeHtml(block.props?.content || block.props?.icon || type)}</span>`;
  if (["input", "textarea", "select", "date"].includes(type)) return `<div><span>${escapeHtml(block.props?.label || "")}</span><strong>${escapeHtml(block.props?.value || "")}</strong></div>`;
  if (type === "checkbox" || type === "radio") return `<div>${block.props?.checked ? "[x]" : "[ ]"} ${escapeHtml(block.props?.label || "")}</div>`;
  if (type === "signature") return `<div class="sn-report-signature"><span>${escapeHtml(block.props?.label || "Potpis")}</span><em></em><strong>${escapeHtml(block.props?.name || "")}</strong></div>`;
  if (type === "chart") return `<div class="sn-report-chart">${(block.props?.values || []).map((value) => `<span style="height:${Math.max(8, Math.min(100, Number(value) || 10))}%"></span>`).join("")}</div>`;
  if (type === "list") return `<ul>${(block.props?.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  if (type === "qr") return `<div class="sn-report-qr">${escapeHtml(block.props?.value || "")}</div>`;
  if (type === "barcode") return `<div class="sn-report-barcode">${escapeHtml(block.props?.value || "")}</div>`;
  if (type === "pagebreak") return "";
  return `<div>${escapeHtml(block.props?.content || "")}</div>`;
}

export function createBlockDefinition({ type, label, category, icon }) {
  return {
    type,
    label,
    category,
    icon,
    create(initial = {}) {
      return {
        id: initial.id || createId(type),
        type,
        props: { ...(defaultProps[type] || {}), ...(initial.props || {}) },
        styles: { ...(baseStyles[type] || {}), ...(initial.styles || {}) },
        layout: { ...(baseLayouts[type] || baseLayouts.text), ...(initial.layout || {}) },
        children: Array.isArray(initial.children) ? initial.children : [],
      };
    },
    render(block, context) {
      return renderByType(block, context);
    },
    toHtml(block) {
      const styles = inlineStyles(block.styles || {});
      return `<div class="sn-report-block sn-report-${type}" style="${styles}">${contentToHtml(block)}</div>`;
    },
  };
}
