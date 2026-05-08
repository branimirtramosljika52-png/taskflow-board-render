import { getBlockById } from "../core/state.js";
import { el, field, input, select, clear, button } from "../utils/dom.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../utils/math.js";

const GRID_PAGE_MARGIN_PX = 48;
const GRID_CONTENT_TOP_PX = 112;
const GRID_CONTENT_BOTTOM_PX = 96;
const FULL_PAGE_GRID_ROWS = 36;
const FULL_PAGE_GRID_COLUMNS = 24;
const FULL_PAGE_GRID_LAYOUT = {
  x: GRID_PAGE_MARGIN_PX,
  y: GRID_CONTENT_TOP_PX,
  width: A4_WIDTH_PX - GRID_PAGE_MARGIN_PX * 2,
  height: A4_HEIGHT_PX - GRID_CONTENT_TOP_PX - GRID_CONTENT_BOTTOM_PX,
  rotation: 0,
};

const FONT_WEIGHTS = [
  { value: "400", label: "Regular" },
  { value: "600", label: "Semi bold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra bold" },
];

const TEXT_ALIGNS = [
  { value: "left", label: "Lijevo" },
  { value: "center", label: "Centar" },
  { value: "right", label: "Desno" },
  { value: "justify", label: "Justify" },
];

const FOOTER_TYPES = [
  { value: "none", label: "Bez footera" },
  { value: "page-number", label: "Broj stranice" },
  { value: "text", label: "Tekst" },
  { value: "document-info", label: "Info + stranica" },
  { value: "signature", label: "Potpis" },
];

function numberInput(value, onInput) {
  const control = input({ type: "number", value: Math.round(Number(value) || 0) });
  control.addEventListener("change", () => onInput(Number(control.value) || 0));
  return control;
}

function textInput(value, onInput) {
  const control = input({ type: "text", value: value || "" });
  control.addEventListener("change", () => onInput(control.value));
  return control;
}

function colorInput(value, onInput) {
  const control = input({ type: "color", value: /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : "#ffffff" });
  control.addEventListener("change", () => onInput(control.value));
  return control;
}

function checkboxInput(value, onInput) {
  const control = input({ type: "checkbox", checked: Boolean(value) });
  control.addEventListener("change", () => onInput(control.checked));
  return control;
}

function section(title, children = []) {
  return el("section", { className: "sn-builder-property-section" }, [
    el("h4", {}, title),
    ...children,
  ]);
}

function clampGridCount(value, fallback) {
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

function getGridSelectedCellIds(block = {}, rows = clampGridCount(block.props?.rows, 4), columns = clampGridCount(block.props?.columns, 4)) {
  return (Array.isArray(block.props?.selectedCellIds) ? block.props.selectedCellIds : [])
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value >= 0 && value < rows * columns);
}

function resizeGridCells(block, nextRows, nextColumns) {
  const previousRows = clampGridCount(block.props?.rows, 4);
  const previousColumns = clampGridCount(block.props?.columns, 4);
  const sourceCells = Array.isArray(block.props?.cells)
    ? block.props.cells.map(normalizeGridCell)
    : [];
  return Array.from({ length: nextRows * nextColumns }, (_, index) => {
    const row = Math.floor(index / nextColumns);
    const column = index % nextColumns;
    const previousIndex = row * previousColumns + column;
    return row < previousRows && column < previousColumns
      ? (sourceCells[previousIndex] || normalizeGridCell())
      : normalizeGridCell();
  });
}

function resizeGridTracks(block, key, count, fallback = "1fr") {
  return normalizeGridTrackList(block.props?.[key], count, fallback);
}

function repeatedTrack(count, value = "1fr") {
  return Array.from({ length: count }, () => value);
}

function createBlankGridCells(rows = FULL_PAGE_GRID_ROWS, columns = FULL_PAGE_GRID_COLUMNS) {
  return Array.from({ length: rows * columns }, () => ({
    content: "",
    padding: "2px 4px",
  }));
}

function createFullPageGridProps() {
  return {
    rows: FULL_PAGE_GRID_ROWS,
    columns: FULL_PAGE_GRID_COLUMNS,
    columnWidths: repeatedTrack(FULL_PAGE_GRID_COLUMNS),
    rowHeights: repeatedTrack(FULL_PAGE_GRID_ROWS),
    showBorders: true,
    cellBackgroundColor: "#ffffff",
    selectedCellIds: [],
    cells: createBlankGridCells(),
  };
}

function getGridLayoutForPageChrome(pageProps = {}) {
  const headerHeight = pageProps.headerEnabled === false
    ? 0
    : Math.max(34, Math.min(140, Number(pageProps.headerHeight) || 64));
  const top = pageProps.headerEnabled === false
    ? GRID_PAGE_MARGIN_PX
    : Math.max(GRID_CONTENT_TOP_PX, 24 + headerHeight + 24);
  const bottom = pageProps.footerType === "none"
    ? GRID_PAGE_MARGIN_PX
    : GRID_CONTENT_BOTTOM_PX;
  return {
    x: GRID_PAGE_MARGIN_PX,
    y: top,
    width: A4_WIDTH_PX - GRID_PAGE_MARGIN_PX * 2,
    height: Math.max(160, A4_HEIGHT_PX - top - bottom),
    rotation: 0,
  };
}

function getGridSelectionRect(selectedIds = [], columns = 1) {
  if (!selectedIds.length) {
    return null;
  }
  const coordinates = selectedIds.map((index) => ({
    index,
    row: Math.floor(index / columns),
    column: index % columns,
  }));
  return {
    minRow: Math.min(...coordinates.map((item) => item.row)),
    maxRow: Math.max(...coordinates.map((item) => item.row)),
    minColumn: Math.min(...coordinates.map((item) => item.column)),
    maxColumn: Math.max(...coordinates.map((item) => item.column)),
  };
}

function mergeGridCells(block, rows, columns) {
  const cells = Array.isArray(block.props?.cells) ? block.props.cells.map(normalizeGridCell) : resizeGridCells(block, rows, columns);
  const selectedIds = getGridSelectedCellIds(block, rows, columns).filter((index) => !cells[index]?.hidden);
  const rect = getGridSelectionRect(selectedIds, columns);
  if (!rect || selectedIds.length < 2) {
    return null;
  }

  const anchorIndex = rect.minRow * columns + rect.minColumn;
  const nextCells = cells.map((cell) => ({ ...cell, hidden: false, masterIndex: null, rowSpan: cell.rowSpan || 1, colSpan: cell.colSpan || 1 }));
  for (let row = rect.minRow; row <= rect.maxRow; row += 1) {
    for (let column = rect.minColumn; column <= rect.maxColumn; column += 1) {
      const index = row * columns + column;
      if (index === anchorIndex) {
        continue;
      }
      nextCells[index] = {
        ...nextCells[index],
        hidden: true,
        masterIndex: anchorIndex,
        rowSpan: 1,
        colSpan: 1,
      };
    }
  }
  nextCells[anchorIndex] = {
    ...nextCells[anchorIndex],
    hidden: false,
    masterIndex: null,
    rowSpan: rect.maxRow - rect.minRow + 1,
    colSpan: rect.maxColumn - rect.minColumn + 1,
  };
  return {
    cells: nextCells,
    selectedCellIds: [anchorIndex],
  };
}

function unmergeGridCells(block, rows, columns) {
  const cells = Array.isArray(block.props?.cells) ? block.props.cells.map(normalizeGridCell) : resizeGridCells(block, rows, columns);
  const selectedIds = getGridSelectedCellIds(block, rows, columns);
  if (!selectedIds.length) {
    return null;
  }
  const anchorIds = new Set(selectedIds.map((index) => (
    cells[index]?.hidden && Number.isInteger(cells[index]?.masterIndex)
      ? cells[index].masterIndex
      : index
  )));
  const nextCells = cells.map((cell, index) => {
    if (anchorIds.has(index)) {
      return { ...cell, rowSpan: 1, colSpan: 1, hidden: false, masterIndex: null };
    }
    if (anchorIds.has(cell.masterIndex)) {
      return { ...cell, rowSpan: 1, colSpan: 1, hidden: false, masterIndex: null };
    }
    return { ...cell };
  });
  return {
    cells: nextCells,
    selectedCellIds: [...anchorIds],
  };
}

function patchSelectedGridCells(block, rows, columns, patch) {
  const cells = Array.isArray(block.props?.cells) ? block.props.cells.map(normalizeGridCell) : resizeGridCells(block, rows, columns);
  const selectedIds = getGridSelectedCellIds(block, rows, columns);
  if (!selectedIds.length) {
    return null;
  }
  const nextCells = cells.map((cell, index) => {
    if (!selectedIds.includes(index)) {
      return cell;
    }
    return { ...cell, ...patch };
  });
  return { cells: nextCells };
}

function createGridAction(label, title, onClick) {
  return button(label, {
    className: "sn-builder-tool-button sn-builder-grid-action",
    title,
    onclick: onClick,
  });
}

function getActivePage(state = {}) {
  const pages = Array.isArray(state.document) ? state.document : [];
  return pages[Math.max(0, Math.min(pages.length - 1, Number(state.activePage || 1) - 1))] || pages[0] || null;
}

function pickPageChromeTarget(state = {}, group = "header") {
  const pages = Array.isArray(state.document) ? state.document : [];
  const firstPage = pages[0] || null;
  const activePage = getActivePage(state);
  const firstProps = firstPage?.props || {};
  const sameKey = group === "footer" ? "footerSameEveryPage" : "headerSameEveryPage";
  return firstProps[sameKey] === false ? activePage : firstPage;
}

function pageSettingsSection(state, store) {
  const activePage = getActivePage(state);
  const firstPage = Array.isArray(state.document) ? state.document[0] : null;
  if (!activePage || !firstPage) {
    return null;
  }

  const headerPage = pickPageChromeTarget(state, "header") || activePage;
  const footerPage = pickPageChromeTarget(state, "footer") || activePage;
  const headerProps = headerPage.props || {};
  const footerProps = footerPage.props || {};
  const firstProps = firstPage.props || {};
  const updatePageProps = (page, patch) => {
    if (page?.id) store.updateBlock(page.id, { props: patch });
  };
  const updateHeaderProps = (patch) => updatePageProps(headerPage, patch);
  const updateFooterProps = (patch) => updatePageProps(footerPage, patch);

  return section("A4 header / footer", [
    el("div", { className: "sn-builder-property-grid" }, [
      field("Header", checkboxInput(headerProps.headerEnabled !== false, (value) => updateHeaderProps({ headerEnabled: value }))),
      field("Header svugdje", checkboxInput(firstProps.headerSameEveryPage !== false, (value) => {
        const sourceProps = activePage.props || {};
        updatePageProps(firstPage, {
          headerSameEveryPage: value,
          ...(value ? {
            headerEnabled: sourceProps.headerEnabled !== false,
            headerLogoEnabled: sourceProps.headerLogoEnabled !== false,
            headerLogoDataUrl: sourceProps.headerLogoDataUrl || firstProps.headerLogoDataUrl || "",
            headerAutoLogo: sourceProps.headerAutoLogo !== false,
            headerTitle: sourceProps.headerTitle || "",
            headerHeight: Number(sourceProps.headerHeight) || Number(firstProps.headerHeight) || 64,
          } : {}),
        });
      })),
      field("Logo", checkboxInput(headerProps.headerLogoEnabled !== false, (value) => updateHeaderProps({ headerLogoEnabled: value }))),
      field("Header height", numberInput(headerProps.headerHeight || 64, (value) => updateHeaderProps({ headerHeight: Math.max(34, Math.min(140, value)) }))),
    ]),
    field("Header title", textInput(headerProps.headerTitle || "", (value) => updateHeaderProps({ headerTitle: value }))),
    el("div", { className: "sn-builder-property-grid" }, [
      field("Footer", select(FOOTER_TYPES, footerProps.footerType || "page-number", { onchange: (event) => updateFooterProps({ footerType: event.target.value }) })),
      field("Footer svugdje", checkboxInput(firstProps.footerSameEveryPage !== false, (value) => {
        const sourceProps = activePage.props || {};
        updatePageProps(firstPage, {
          footerSameEveryPage: value,
          ...(value ? {
            footerType: sourceProps.footerType || firstProps.footerType || "page-number",
            footerText: sourceProps.footerText || "",
          } : {}),
        });
      })),
    ]),
    field("Footer text", textInput(footerProps.footerText || "", (value) => updateFooterProps({ footerText: value }))),
  ]);
}

function gridPropertySection(block, updateProps, updateStyles, updateLayout, activePage) {
  if (block.type !== "grid") {
    return null;
  }

  const rows = clampGridCount(block.props?.rows, 4);
  const columns = clampGridCount(block.props?.columns, 4);
  const showBorders = block.props?.showBorders !== false;
  const cellBackgroundColor = block.props?.cellBackgroundColor || "#ffffff";
  const selectedIds = getGridSelectedCellIds(block, rows, columns);
  const selectedRect = getGridSelectionRect(selectedIds, columns);
  const selectedText = selectedIds.length && selectedRect
    ? selectedIds.length === 1
      ? `R${selectedRect.minRow + 1}C${selectedRect.minColumn + 1}`
      : `${selectedIds.length} celija: R${selectedRect.minRow + 1}C${selectedRect.minColumn + 1} - R${selectedRect.maxRow + 1}C${selectedRect.maxColumn + 1}`
    : "Klikni celiju u gridu";

  return section("Grid", [
    el("div", { className: "sn-builder-grid-action-row" }, [
      createGridAction("Puna A4 mreza", "Postavi praznu mrezu preko cijele A4 stranice unutar margina", () => {
        updateLayout(getGridLayoutForPageChrome(activePage?.props || {}));
        updateStyles({
          borderColor: "#9ca3af",
          borderStyle: "dashed",
          borderWidth: "0",
          gap: "0px",
          padding: "0",
        });
        updateProps(createFullPageGridProps());
      }),
    ]),
    el("div", { className: "sn-builder-property-grid" }, [
      field("Rows", numberInput(rows, (value) => {
        const nextRows = clampGridCount(value, rows);
        updateProps({
          rows: nextRows,
          columns,
          rowHeights: resizeGridTracks(block, "rowHeights", nextRows, "34px"),
          cells: resizeGridCells(block, nextRows, columns),
          selectedCellIds: [],
        });
      })),
      field("Columns", numberInput(columns, (value) => {
        const nextColumns = clampGridCount(value, columns);
        updateProps({
          rows,
          columns: nextColumns,
          columnWidths: resizeGridTracks(block, "columnWidths", nextColumns, "1fr"),
          cells: resizeGridCells(block, rows, nextColumns),
          selectedCellIds: [],
        });
      })),
      field("Borders", checkboxInput(showBorders, (value) => updateProps({ showBorders: value }))),
      field("Cell bg", colorInput(cellBackgroundColor, (value) => updateProps({ cellBackgroundColor: value }))),
      field("Border", colorInput(block.styles?.borderColor || "#cbd5e1", (value) => updateStyles({ borderColor: value }))),
      field("Gap", textInput(block.styles?.gap || "0px", (value) => updateStyles({ gap: value }))),
    ]),
    field("Column widths", textInput((block.props?.columnWidths || []).join(", "), (value) => {
      updateProps({ columnWidths: normalizeGridTrackList(value, columns, "1fr") });
    })),
    field("Row heights", textInput((block.props?.rowHeights || []).join(", "), (value) => {
      updateProps({ rowHeights: normalizeGridTrackList(value, rows, "34px") });
    })),
    el("div", { className: "sn-builder-grid-selection-label" }, selectedText),
    el("div", { className: "sn-builder-grid-action-row" }, [
      createGridAction("Merge", "Spoji označene ćelije", () => {
        const patch = mergeGridCells(block, rows, columns);
        if (patch) updateProps(patch);
      }),
      createGridAction("Unmerge", "Razdvoji spojenu ćeliju", () => {
        const patch = unmergeGridCells(block, rows, columns);
        if (patch) updateProps(patch);
      }),
      createGridAction("Bold", "Podebljaj označene ćelije", () => {
        const patch = patchSelectedGridCells(block, rows, columns, { fontWeight: "700" });
        if (patch) updateProps(patch);
      }),
      createGridAction("Normal", "Vrati običnu debljinu teksta", () => {
        const patch = patchSelectedGridCells(block, rows, columns, { fontWeight: "400" });
        if (patch) updateProps(patch);
      }),
      createGridAction("L", "Poravnaj tekst lijevo", () => {
        const patch = patchSelectedGridCells(block, rows, columns, { textAlign: "left" });
        if (patch) updateProps(patch);
      }),
      createGridAction("C", "Poravnaj tekst centar", () => {
        const patch = patchSelectedGridCells(block, rows, columns, { textAlign: "center" });
        if (patch) updateProps(patch);
      }),
      createGridAction("R", "Poravnaj tekst desno", () => {
        const patch = patchSelectedGridCells(block, rows, columns, { textAlign: "right" });
        if (patch) updateProps(patch);
      }),
      createGridAction("Gray", "Siva glava kao u Word tablici", () => {
        const patch = patchSelectedGridCells(block, rows, columns, { backgroundColor: "#bfbfbf", fontWeight: "700" });
        if (patch) updateProps(patch);
      }),
      createGridAction("No border", "Makni obrub na oznacenim celijama", () => {
        const patch = patchSelectedGridCells(block, rows, columns, { borderWidth: "0" });
        if (patch) updateProps(patch);
      }),
      createGridAction("Border", "Vrati iscrtani obrub na oznacenim celijama", () => {
        const patch = patchSelectedGridCells(block, rows, columns, { borderWidth: "1px", borderStyle: "dashed", borderColor: "#9ca3af" });
        if (patch) updateProps(patch);
      }),
    ]),
    el("div", { className: "sn-builder-property-grid" }, [
      field("Selected bg", colorInput("#bfbfbf", (value) => {
        const patch = patchSelectedGridCells(block, rows, columns, { backgroundColor: value });
        if (patch) updateProps(patch);
      })),
      field("Selected color", colorInput(block.styles?.color || "#172033", (value) => {
        const patch = patchSelectedGridCells(block, rows, columns, { color: value });
        if (patch) updateProps(patch);
      })),
      field("Selected border", colorInput(block.styles?.borderColor || "#9ca3af", (value) => {
        const patch = patchSelectedGridCells(block, rows, columns, { borderColor: value });
        if (patch) updateProps(patch);
      })),
      field("Selected padding", textInput("8px", (value) => {
        const patch = patchSelectedGridCells(block, rows, columns, { padding: value });
        if (patch) updateProps(patch);
      })),
    ]),
  ]);
}

export function renderPropertiesPanel(container, store) {
  store.subscribe((state) => {
    clear(container);
    const selectedId = state.selectedIds[0];
    const block = selectedId ? getBlockById(state.document, selectedId) : null;
    container.append(el("div", { className: "sn-builder-panel-head" }, [
      el("span", {}, "Properties"),
      el("strong", {}, block ? block.type : "Selection"),
    ]));
    const pageSettings = pageSettingsSection(state, store);
    if (pageSettings) {
      container.append(pageSettings);
    }
    if (!block) {
      container.append(el("div", { className: "sn-builder-empty-state" }, "Oznaci element na stranici za uredjivanje blokova. Header i footer su iznad."));
      return;
    }

    const updateLayout = (patch) => store.updateBlock(block.id, { layout: patch });
    const updateStyles = (patch) => store.updateBlock(block.id, { styles: patch });
    const updateProps = (patch) => store.updateBlock(block.id, { props: patch });

    container.append(
      section("Content", [
        field("Label / text", textInput(block.props?.content || block.props?.label || block.props?.title || "", (value) => {
          if (block.props?.title != null) updateProps({ title: value });
          else if (block.props?.label != null) updateProps({ label: value });
          else updateProps({ content: value });
        })),
      ]),
      gridPropertySection(block, updateProps, updateStyles, updateLayout, getActivePage(state)),
      section("Layout", [
        el("div", { className: "sn-builder-property-grid" }, [
          field("X", numberInput(block.layout?.x, (value) => updateLayout({ x: value }))),
          field("Y", numberInput(block.layout?.y, (value) => updateLayout({ y: value }))),
          field("Width", numberInput(block.layout?.width, (value) => updateLayout({ width: value }))),
          field("Height", numberInput(block.layout?.height, (value) => updateLayout({ height: value }))),
          field("Rotate", numberInput(block.layout?.rotation, (value) => updateLayout({ rotation: value }))),
        ]),
      ]),
      section("Typography", [
        field("Font", textInput(block.styles?.fontFamily || "Arial", (value) => updateStyles({ fontFamily: value }))),
        field("Size", textInput(block.styles?.fontSize || "13px", (value) => updateStyles({ fontSize: value }))),
        field("Weight", select(FONT_WEIGHTS, block.styles?.fontWeight || "400", { onchange: (event) => updateStyles({ fontWeight: event.target.value }) })),
        field("Line height", textInput(block.styles?.lineHeight || "1.4", (value) => updateStyles({ lineHeight: value }))),
        field("Letter spacing", textInput(block.styles?.letterSpacing || "0", (value) => updateStyles({ letterSpacing: value }))),
        field("Transform", textInput(block.styles?.textTransform || "none", (value) => updateStyles({ textTransform: value }))),
        field("Color", colorInput(block.styles?.color || "#172033", (value) => updateStyles({ color: value }))),
        field("Text align", select(TEXT_ALIGNS, block.styles?.textAlign || "left", { onchange: (event) => updateStyles({ textAlign: event.target.value }) })),
      ]),
      section("Spacing", [
        field("Margin", textInput(block.styles?.margin || "0", (value) => updateStyles({ margin: value }))),
        field("Padding", textInput(block.styles?.padding || "", (value) => updateStyles({ padding: value }))),
        field("Gap", textInput(block.styles?.gap || "", (value) => updateStyles({ gap: value }))),
      ]),
      section("Border", [
        field("Width", textInput(block.styles?.borderWidth || "0", (value) => updateStyles({ borderWidth: value }))),
        field("Style", textInput(block.styles?.borderStyle || "solid", (value) => updateStyles({ borderStyle: value }))),
        field("Color", colorInput(block.styles?.borderColor || "#cbd5e1", (value) => updateStyles({ borderColor: value }))),
        field("Radius", textInput(block.styles?.borderRadius || "0", (value) => updateStyles({ borderRadius: value }))),
      ]),
      section("Background", [
        field("Color", colorInput(block.styles?.backgroundColor || "#ffffff", (value) => updateStyles({ backgroundColor: value }))),
        field("Gradient", textInput(block.styles?.backgroundImage || "", (value) => updateStyles({ backgroundImage: value }))),
        field("Opacity", textInput(block.styles?.opacity || "1", (value) => updateStyles({ opacity: value }))),
      ]),
      section("Effects", [
        field("Shadow", textInput(block.styles?.boxShadow || "", (value) => updateStyles({ boxShadow: value }))),
        field("Blur", textInput(block.styles?.filter || "", (value) => updateStyles({ filter: value }))),
      ]),
      section("Layer", [
        field("Locked", input({ type: "checkbox", checked: block.props?.locked, onchange: (event) => updateProps({ locked: event.target.checked }) })),
        field("Hidden", input({ type: "checkbox", checked: block.props?.hidden, onchange: (event) => updateProps({ hidden: event.target.checked }) })),
      ]),
    );
  });
}
