import { el } from "../utils/dom.js";
import { createId } from "../utils/ids.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../utils/math.js";

const GRID_PAGE_MARGIN_PX = 48;
const FULL_PAGE_GRID_ROWS = 36;
const FULL_PAGE_GRID_COLUMNS = 24;
const FULL_PAGE_GRID_LAYOUT = {
  x: GRID_PAGE_MARGIN_PX,
  y: GRID_PAGE_MARGIN_PX,
  width: A4_WIDTH_PX - GRID_PAGE_MARGIN_PX * 2,
  height: A4_HEIGHT_PX - GRID_PAGE_MARGIN_PX * 2,
  rotation: 0,
};

function repeatedTrack(count, value = "1fr") {
  return Array.from({ length: count }, () => value);
}

function blankGridCells(rows = FULL_PAGE_GRID_ROWS, columns = FULL_PAGE_GRID_COLUMNS) {
  return Array.from({ length: rows * columns }, () => ({
    content: "",
    padding: "2px 4px",
  }));
}

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
  grid: FULL_PAGE_GRID_LAYOUT,
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
  grid: {
    fontFamily: "Arial",
    fontSize: "11px",
    color: "#172033",
    backgroundColor: "#ffffff",
    borderColor: "#9ca3af",
    borderWidth: "0",
    borderStyle: "dashed",
    gap: "0px",
    padding: "0",
  },
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
  page: {
    name: "A4 stranica",
    headerEnabled: true,
    headerSameEveryPage: true,
    headerLogoEnabled: true,
    headerAutoLogo: true,
    headerLogoDataUrl: "",
    headerTitle: "",
    headerHeight: 64,
    footerType: "page-number",
    footerSameEveryPage: true,
    footerText: "",
  },
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
  grid: {
    rows: FULL_PAGE_GRID_ROWS,
    columns: FULL_PAGE_GRID_COLUMNS,
    columnWidths: repeatedTrack(FULL_PAGE_GRID_COLUMNS),
    rowHeights: repeatedTrack(FULL_PAGE_GRID_ROWS),
    showBorders: true,
    cellBackgroundColor: "#ffffff",
    selectedCellIds: [],
    cells: blankGridCells(),
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

function normalizeGridDimension(value, fallback) {
  return Math.max(1, Math.min(48, Math.round(Number(value) || fallback)));
}

function normalizeGridCell(cell = {}) {
  if (typeof cell === "string") {
    return { content: cell };
  }
  return {
    content: String(cell?.content ?? ""),
    backgroundColor: String(cell?.backgroundColor ?? ""),
    color: String(cell?.color ?? ""),
    textAlign: String(cell?.textAlign ?? ""),
    fontWeight: String(cell?.fontWeight ?? ""),
    padding: String(cell?.padding ?? ""),
    borderColor: String(cell?.borderColor ?? ""),
    borderWidth: String(cell?.borderWidth ?? ""),
    borderStyle: String(cell?.borderStyle ?? ""),
    rowSpan: Math.max(1, Math.min(48, Math.round(Number(cell?.rowSpan) || 1))),
    colSpan: Math.max(1, Math.min(48, Math.round(Number(cell?.colSpan) || 1))),
    hidden: Boolean(cell?.hidden),
    masterIndex: Number.isInteger(Number(cell?.masterIndex)) ? Number(cell.masterIndex) : null,
  };
}

function normalizeGridTrackList(value, count, fallback = "1fr") {
  const source = Array.isArray(value)
    ? value
    : String(value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  return Array.from({ length: count }, (_, index) => String(source[index] || fallback).trim() || fallback);
}

function focusEditableCellAtEnd(blockId, cellIndex) {
  requestAnimationFrame(() => {
    const node = document.querySelector(`[data-builder-block-id="${blockId}"] [data-grid-cell-index="${cellIndex}"]`);
    if (!(node instanceof HTMLElement)) {
      return;
    }
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
}

function getGridRangeCellIds(startIndex, endIndex, columns) {
  const startRow = Math.floor(startIndex / columns);
  const endRow = Math.floor(endIndex / columns);
  const startColumn = startIndex % columns;
  const endColumn = endIndex % columns;
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minColumn = Math.min(startColumn, endColumn);
  const maxColumn = Math.max(startColumn, endColumn);
  const ids = [];
  for (let row = minRow; row <= maxRow; row += 1) {
    for (let column = minColumn; column <= maxColumn; column += 1) {
      ids.push(row * columns + column);
    }
  }
  return ids;
}

function getGridCellIndexFromEvent(event, columns, rows) {
  const target = event.target instanceof HTMLElement
    ? event.target
    : document.elementFromPoint(event.clientX, event.clientY);
  const node = target instanceof HTMLElement
    ? target.closest("[data-grid-cell-index]")
    : null;
  const index = Number.parseInt(node?.dataset?.gridCellIndex ?? "", 10);
  return Number.isInteger(index) && index >= 0 && index < rows * columns ? index : null;
}

function getGridCellIndexFromPoint(event, columns, rows) {
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const node = target instanceof HTMLElement
    ? target.closest("[data-grid-cell-index]")
    : null;
  const index = Number.parseInt(node?.dataset?.gridCellIndex ?? "", 10);
  return Number.isInteger(index) && index >= 0 && index < rows * columns ? index : null;
}

function applyGridLiveSelection(grid, selectedIds = []) {
  const selected = new Set(selectedIds.map(String));
  grid.querySelectorAll("[data-grid-cell-index]").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.classList.toggle("is-selected", selected.has(String(node.dataset.gridCellIndex || "")));
  });
}

function normalizeGridProps(props = {}) {
  const rows = normalizeGridDimension(props.rows, defaultProps.grid.rows);
  const columns = normalizeGridDimension(props.columns, defaultProps.grid.columns);
  const rawCells = Array.isArray(props.cells) ? props.cells.map(normalizeGridCell) : [];
  const cells = Array.from({ length: rows * columns }, (_, index) => rawCells[index] || normalizeGridCell());
  return {
    rows,
    columns,
    columnWidths: normalizeGridTrackList(props.columnWidths, columns, "1fr"),
    rowHeights: normalizeGridTrackList(props.rowHeights, rows, "1fr"),
    showBorders: props.showBorders !== false,
    cellBackgroundColor: String(props.cellBackgroundColor || defaultProps.grid.cellBackgroundColor),
    selectedCellIds: (Array.isArray(props.selectedCellIds) ? props.selectedCellIds : [])
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value >= 0 && value < rows * columns),
    cells,
  };
}

function gridCellStyle(block, props, cell) {
  const preferredBorderWidth = String(block.styles?.borderWidth || "").trim();
  const borderWidth = props.showBorders
    ? (preferredBorderWidth && preferredBorderWidth !== "0" ? preferredBorderWidth : "1px")
    : "0";
  return {
    backgroundColor: cell.backgroundColor || props.cellBackgroundColor || "transparent",
    color: cell.color || block.styles?.color || "#172033",
    textAlign: cell.textAlign || block.styles?.textAlign || "left",
    fontWeight: cell.fontWeight || block.styles?.fontWeight || "",
    padding: cell.padding || block.styles?.padding || "6px",
    borderColor: cell.borderColor || block.styles?.borderColor || "#9ca3af",
    borderWidth: cell.borderWidth || borderWidth,
    borderStyle: cell.borderStyle || block.styles?.borderStyle || "dashed",
  };
}

function renderGrid(block, context) {
  const props = normalizeGridProps(block.props);
  const selectedSet = new Set(props.selectedCellIds);
  const grid = el("div", {
    className: "sn-builder-layout-grid",
    style: {
      gridTemplateColumns: props.columnWidths.join(" "),
      gridTemplateRows: props.rowHeights.join(" "),
      gap: block.styles?.gap || "0px",
    },
  });

  props.cells.forEach((cell, index) => {
    if (cell.hidden) {
      return;
    }
    const row = Math.floor(index / props.columns);
    const column = index % props.columns;
    const rowSpan = Math.max(1, Math.min(props.rows - row, cell.rowSpan || 1));
    const colSpan = Math.max(1, Math.min(props.columns - column, cell.colSpan || 1));
    const node = el("div", {
      className: `sn-builder-grid-cell${selectedSet.has(index) ? " is-selected" : ""}`,
      contenteditable: "true",
      spellcheck: "false",
      dataset: {
        gridCellIndex: index,
        gridCellRow: row + 1,
        gridCellColumn: column + 1,
      },
      style: {
        ...gridCellStyle(block, props, cell),
        gridColumn: `${column + 1} / span ${colSpan}`,
        gridRow: `${row + 1} / span ${rowSpan}`,
      },
    }, cell.content || "");
    node.addEventListener("blur", () => {
      const nextCells = props.cells.map((entry) => ({ ...entry }));
      nextCells[index] = {
        ...nextCells[index],
        content: node.innerText,
      };
      context.updateBlock(block.id, {
        props: {
          ...block.props,
          rows: props.rows,
          columns: props.columns,
          cells: nextCells,
        },
      }, { history: false });
      context.commitHistory();
    });
    grid.append(node);
  });

  let dragSession = null;

  function resolveDragSelection(currentIndex, final = false) {
    if (!dragSession) {
      return [];
    }
    const startIndex = dragSession.anchorIndex;
    const range = getGridRangeCellIds(startIndex, currentIndex, props.columns)
      .filter((cellIndex) => !props.cells[cellIndex]?.hidden);
    if (dragSession.additive && final && !dragSession.dragged && currentIndex === dragSession.startIndex) {
      const selected = new Set(props.selectedCellIds);
      if (selected.has(currentIndex)) {
        selected.delete(currentIndex);
      } else {
        selected.add(currentIndex);
      }
      return [...selected];
    }
    if (dragSession.additive) {
      const selected = new Set(props.selectedCellIds);
      range.forEach((cellIndex) => selected.add(cellIndex));
      return [...selected];
    }
    return range;
  }

  grid.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof HTMLElement) || event.button !== 0) return;
    const startIndex = getGridCellIndexFromEvent(event, props.columns, props.rows);
    if (startIndex == null || props.cells[startIndex]?.hidden) return;

    event.preventDefault();
    event.stopPropagation();
    const anchorIndex = event.shiftKey && props.selectedCellIds.length > 0
      ? props.selectedCellIds.at(-1)
      : startIndex;
    dragSession = {
      pointerId: event.pointerId,
      startIndex,
      anchorIndex,
      currentIndex: startIndex,
      additive: event.ctrlKey || event.metaKey,
      dragged: false,
    };
    grid.setPointerCapture?.(event.pointerId);
    applyGridLiveSelection(grid, resolveDragSelection(startIndex));
  });

  grid.addEventListener("pointermove", (event) => {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    const currentIndex = getGridCellIndexFromPoint(event, props.columns, props.rows);
    if (currentIndex == null || props.cells[currentIndex]?.hidden) return;
    if (currentIndex !== dragSession.currentIndex) {
      dragSession.currentIndex = currentIndex;
      dragSession.dragged = dragSession.dragged || currentIndex !== dragSession.startIndex;
      applyGridLiveSelection(grid, resolveDragSelection(currentIndex));
    }
  });

  grid.addEventListener("pointerup", (event) => {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    grid.releasePointerCapture?.(event.pointerId);
    const session = dragSession;
    const selectedCellIds = resolveDragSelection(session.currentIndex, true);
    dragSession = null;
    if (!context.state?.selectedIds?.includes(block.id)) {
      context.selectBlock?.(block.id);
    }
    context.updateBlock(block.id, {
      props: {
        ...block.props,
        rows: props.rows,
        columns: props.columns,
        selectedCellIds,
      },
    }, { history: false });
    if (!session.dragged && !session.additive) {
      focusEditableCellAtEnd(block.id, session.startIndex);
    }
  });

  grid.addEventListener("pointercancel", (event) => {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    grid.releasePointerCapture?.(event.pointerId);
    dragSession = null;
    applyGridLiveSelection(grid, props.selectedCellIds);
  });

  return grid;
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
  if (type === "grid") return renderGrid(block, context);
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

function gridToHtml(block) {
  const props = normalizeGridProps(block.props);
  const gridStyle = inlineStyles({
    display: "grid",
    gridTemplateColumns: props.columnWidths.join(" "),
    gridTemplateRows: props.rowHeights.join(" "),
    gap: block.styles?.gap || "0px",
    width: "100%",
    height: "100%",
  });
  const cells = props.cells.map((cell, index) => {
    if (cell.hidden) {
      return "";
    }
    const row = Math.floor(index / props.columns);
    const column = index % props.columns;
    const style = inlineStyles({
      ...gridCellStyle(block, props, cell),
      gridColumn: `${column + 1} / span ${Math.max(1, Math.min(props.columns - column, cell.colSpan || 1))}`,
      gridRow: `${row + 1} / span ${Math.max(1, Math.min(props.rows - row, cell.rowSpan || 1))}`,
      minWidth: "0",
      minHeight: "0",
      overflow: "hidden",
      whiteSpace: "pre-wrap",
    });
    return `<div class="sn-report-grid-cell" style="${style}">${escapeHtml(cell.content || "").replace(/\n/g, "<br>")}</div>`;
  }).join("");
  return `<div class="sn-report-layout-grid" style="${gridStyle}">${cells}</div>`;
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
  if (type === "grid") return gridToHtml(block);
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
