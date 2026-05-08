import { getBlockById } from "../core/state.js";
import { el, field, input, select, clear, button } from "../utils/dom.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../utils/math.js";

const GRID_PAGE_MARGIN_PX = 48;
const GRID_CONTENT_TOP_PX = 198;
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
  control.addEventListener("input", () => onInput(control.value));
  control.addEventListener("change", () => onInput(control.value));
  return control;
}

function checkboxInput(value, onInput) {
  const control = input({ type: "checkbox", checked: Boolean(value) });
  const text = el("span", { className: "sn-builder-check-text" }, control.checked ? "Da" : "Ne");
  control.addEventListener("change", () => {
    text.textContent = control.checked ? "Da" : "Ne";
    onInput(control.checked);
  });
  return el("span", { className: "sn-builder-check-control" }, [
    control,
    el("span", { className: "sn-builder-check-box", "aria-hidden": "true" }),
    text,
  ]);
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
    cellBackgroundColor: "transparent",
    selectedCellIds: [],
    cells: createBlankGridCells(),
  };
}

function getPageHeaderHeight(props = {}) {
  const hasWideLogo = props.headerLogoEnabled !== false && String(props.headerLogoDataUrl || "").trim();
  const minimum = hasWideLogo ? 150 : 34;
  const fallback = hasWideLogo ? 150 : 64;
  return Math.max(minimum, Math.min(220, Number(props.headerHeight) || fallback));
}

function getGridLayoutForPageChrome(pageProps = {}) {
  const headerHeight = pageProps.headerEnabled === false
    ? 0
    : getPageHeaderHeight(pageProps);
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

function parseCssLengthPx(value, relativeTo = 0, fallback = null) {
  const text = String(value ?? "").trim().toLowerCase().replace(",", ".");
  if (!text || text.endsWith("fr")) {
    return fallback;
  }
  const number = Number.parseFloat(text);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  if (text.endsWith("cm")) return number * 37.7952755906;
  if (text.endsWith("mm")) return number * 3.7795275591;
  if (text.endsWith("pt")) return number * 1.3333333333;
  if (text.endsWith("in")) return number * 96;
  if (text.endsWith("%")) return (Number(relativeTo) || 0) * (number / 100);
  return number;
}

function getGridGapPixels(gap = "0px") {
  const parts = String(gap || "0px").trim().split(/\s+/).filter(Boolean);
  const rowGap = parseCssLengthPx(parts[0] || "0px", 0, 0) || 0;
  const columnGap = parseCssLengthPx(parts[1] || parts[0] || "0px", 0, 0) || 0;
  return { row: rowGap, column: columnGap };
}

function getGridTrackPixels(trackList = [], count = 1, totalSize = 1, gapSize = 0, fallback = "1fr") {
  const tracks = normalizeGridTrackList(trackList, count, fallback);
  const parsed = tracks.map((track) => {
    const text = String(track || fallback).trim().toLowerCase().replace(",", ".");
    const frMatch = text.match(/^([0-9]*\.?[0-9]+)?fr$/);
    if (frMatch) {
      return { type: "fr", value: Number.parseFloat(frMatch[1] || "1") || 1 };
    }
    const px = parseCssLengthPx(text, totalSize, null);
    if (Number.isFinite(px)) {
      return { type: "fixed", value: Math.max(1, px) };
    }
    return { type: "fr", value: 1 };
  });
  const gapTotal = Math.max(0, count - 1) * Math.max(0, Number(gapSize) || 0);
  const fixedTotal = parsed
    .filter((entry) => entry.type === "fixed")
    .reduce((sum, entry) => sum + entry.value, 0);
  const frTotal = parsed
    .filter((entry) => entry.type === "fr")
    .reduce((sum, entry) => sum + entry.value, 0);
  const remaining = Math.max(1, (Number(totalSize) || 1) - gapTotal - fixedTotal);
  const frUnit = frTotal > 0 ? remaining / frTotal : remaining / Math.max(1, count);
  return parsed.map((entry) => (
    entry.type === "fixed"
      ? entry.value
      : Math.max(1, entry.value * frUnit)
  ));
}

function sumRange(values = [], start = 0, span = 1, gap = 0) {
  const count = Math.max(1, Number(span) || 1);
  let total = Math.max(0, count - 1) * Math.max(0, Number(gap) || 0);
  for (let offset = 0; offset < count; offset += 1) {
    total += Number(values[start + offset]) || 0;
  }
  return total;
}

function setGridTrackRangePixels(trackList = [], count = 1, start = 0, span = 1, totalPx = 1, gap = 0, fallback = "1fr") {
  const next = normalizeGridTrackList(trackList, count, fallback);
  const safeSpan = Math.max(1, Math.min(count - start, Number(span) || 1));
  const innerSize = Math.max(4, (Number(totalPx) || 1) - Math.max(0, safeSpan - 1) * Math.max(0, Number(gap) || 0));
  const perTrack = Math.max(4, Math.round(innerSize / safeSpan));
  for (let offset = 0; offset < safeSpan; offset += 1) {
    next[start + offset] = `${perTrack}px`;
  }
  return next;
}

function resetGridTrackRange(trackList = [], count = 1, start = 0, span = 1, fallback = "1fr") {
  const next = normalizeGridTrackList(trackList, count, fallback);
  const safeSpan = Math.max(1, Math.min(count - start, Number(span) || 1));
  for (let offset = 0; offset < safeSpan; offset += 1) {
    next[start + offset] = fallback;
  }
  return next;
}

function getSingleSelectedGridCell(block = {}, rows = 1, columns = 1, cells = []) {
  const selectedIds = getGridSelectedCellIds(block, rows, columns);
  if (selectedIds.length !== 1) {
    return null;
  }
  let index = selectedIds[0];
  if (cells[index]?.hidden && Number.isInteger(cells[index]?.masterIndex)) {
    index = cells[index].masterIndex;
  }
  const cell = cells[index] || normalizeGridCell();
  const row = Math.floor(index / columns);
  const column = index % columns;
  return {
    index,
    row,
    column,
    rowSpan: Math.max(1, Math.min(rows - row, cell.rowSpan || 1)),
    colSpan: Math.max(1, Math.min(columns - column, cell.colSpan || 1)),
    cell,
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
        const sharedHeaderProps = { ...firstProps, ...sourceProps };
        updatePageProps(firstPage, {
          headerSameEveryPage: value,
          ...(value ? {
            headerEnabled: sourceProps.headerEnabled !== false,
            headerLogoEnabled: sourceProps.headerLogoEnabled !== false,
            headerLogoDataUrl: sourceProps.headerLogoDataUrl || firstProps.headerLogoDataUrl || "",
            headerAutoLogo: sourceProps.headerAutoLogo !== false,
            headerTitle: sourceProps.headerTitle || "",
            headerHeight: getPageHeaderHeight(sharedHeaderProps),
          } : {}),
        });
      })),
      field("Logo", checkboxInput(headerProps.headerLogoEnabled !== false, (value) => updateHeaderProps({ headerLogoEnabled: value }))),
      field("Header height", numberInput(getPageHeaderHeight(headerProps), (value) => {
        const hasWideLogo = headerProps.headerLogoEnabled !== false && String(headerProps.headerLogoDataUrl || "").trim();
        updateHeaderProps({ headerHeight: Math.max(hasWideLogo ? 150 : 34, Math.min(220, value)) });
      })),
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
  const normalizedCells = resizeGridCells(block, rows, columns);
  const selectedIds = getGridSelectedCellIds(block, rows, columns);
  const firstSelectedCell = selectedIds.length ? normalizedCells[selectedIds[0]] : null;
  const selectedBackgroundColor = firstSelectedCell?.backgroundColor || "#ffffff";
  const selectedTextColor = firstSelectedCell?.color || block.styles?.color || "#172033";
  const selectedBorderColor = firstSelectedCell?.borderColor || block.styles?.borderColor || "#9ca3af";
  const selectedPadding = firstSelectedCell?.padding || block.styles?.padding || "6px";
  const selectedRect = getGridSelectionRect(selectedIds, columns);
  const selectedText = selectedIds.length && selectedRect
    ? selectedIds.length === 1
      ? `R${selectedRect.minRow + 1}C${selectedRect.minColumn + 1}`
      : `${selectedIds.length} celija: R${selectedRect.minRow + 1}C${selectedRect.minColumn + 1} - R${selectedRect.maxRow + 1}C${selectedRect.maxColumn + 1}`
    : "Klikni celiju za njezinu sirinu, visinu i stil";
  const selectedCell = getSingleSelectedGridCell(block, rows, columns, normalizedCells);
  const gapPixels = getGridGapPixels(block.styles?.gap || "0px");
  const columnPixels = getGridTrackPixels(block.props?.columnWidths, columns, Number(block.layout?.width) || FULL_PAGE_GRID_LAYOUT.width, gapPixels.column, "1fr");
  const rowPixels = getGridTrackPixels(block.props?.rowHeights, rows, Number(block.layout?.height) || FULL_PAGE_GRID_LAYOUT.height, gapPixels.row, "1fr");
  const selectedCellControls = selectedCell
    ? el("div", { className: "sn-builder-grid-cell-controls" }, [
      el("div", { className: "sn-builder-property-grid" }, [
        field("Sirina celije", numberInput(
          sumRange(columnPixels, selectedCell.column, selectedCell.colSpan, gapPixels.column),
          (value) => {
            updateProps({
              columnWidths: setGridTrackRangePixels(
                block.props?.columnWidths,
                columns,
                selectedCell.column,
                selectedCell.colSpan,
                Math.max(8, value),
                gapPixels.column,
                "1fr",
              ),
            });
          },
        )),
        field("Visina celije", numberInput(
          sumRange(rowPixels, selectedCell.row, selectedCell.rowSpan, gapPixels.row),
          (value) => {
            updateProps({
              rowHeights: setGridTrackRangePixels(
                block.props?.rowHeights,
                rows,
                selectedCell.row,
                selectedCell.rowSpan,
                Math.max(8, value),
                gapPixels.row,
                "1fr",
              ),
            });
          },
        )),
      ]),
      el("div", { className: "sn-builder-grid-action-row" }, [
        createGridAction("Auto sirina", "Vrati sirinu odabrane celije u ravnomjerni grid", () => {
          updateProps({
            columnWidths: resetGridTrackRange(block.props?.columnWidths, columns, selectedCell.column, selectedCell.colSpan, "1fr"),
          });
        }),
        createGridAction("Auto visina", "Vrati visinu odabrane celije u ravnomjerni grid", () => {
          updateProps({
            rowHeights: resetGridTrackRange(block.props?.rowHeights, rows, selectedCell.row, selectedCell.rowSpan, "1fr"),
          });
        }),
      ]),
    ])
    : el("p", { className: "sn-builder-helper-note" }, selectedIds.length > 1
      ? "Za tocnu sirinu i visinu oznaci jednu celiju. Merge i stilovi i dalje rade nad vise oznacenih celija."
      : "Klikni jednu celiju na mrezi i ovdje ces dobiti njezinu sirinu i visinu.");

  return section("Pomocna mreza", [
    el("div", { className: "sn-builder-grid-action-row" }, [
      createGridAction("Puna A4 mreza", "Postavi praznu mrezu preko radnog dijela stranice, bez headera i footera", () => {
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
      field("Linije pomoci", checkboxInput(showBorders, (value) => updateProps({ showBorders: value }))),
      field("Boja linija", colorInput(block.styles?.borderColor || "#cbd5e1", (value) => updateStyles({ borderColor: value }))),
      field("Gap", textInput(block.styles?.gap || "0px", (value) => updateStyles({ gap: value }))),
    ]),
    el("p", { className: "sn-builder-helper-note" }, "Linije mreze su samo vizualna pomoc. Sirina i visina se mijenjaju na odabranoj celiji, a pozadina samo na oznacenim celijama."),
    el("div", { className: "sn-builder-grid-selection-label" }, selectedText),
    selectedCellControls,
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
      field("Pozadina", colorInput(selectedBackgroundColor, (value) => {
        const patch = patchSelectedGridCells(block, rows, columns, { backgroundColor: value });
        if (patch) updateProps(patch);
      })),
      field("Tekst", colorInput(selectedTextColor, (value) => {
        const patch = patchSelectedGridCells(block, rows, columns, { color: value });
        if (patch) updateProps(patch);
      })),
      field("Obrub", colorInput(selectedBorderColor, (value) => {
        const patch = patchSelectedGridCells(block, rows, columns, { borderColor: value });
        if (patch) updateProps(patch);
      })),
      field("Padding", textInput(selectedPadding, (value) => {
        const patch = patchSelectedGridCells(block, rows, columns, { padding: value });
        if (patch) updateProps(patch);
      })),
    ]),
  ]);
}

function choicePropertySection(block, updateProps) {
  if (block.type !== "checkbox" && block.type !== "radio") {
    return null;
  }
  return section(block.type === "checkbox" ? "Checkbox" : "Radio", [
    field("Oznaceno", checkboxInput(Boolean(block.props?.checked), (value) => updateProps({ checked: value }))),
  ]);
}

function getPropertiesScrollElement(container) {
  let node = container;
  while (node instanceof HTMLElement) {
    const style = window.getComputedStyle(node);
    const scrollable = /(auto|scroll)/.test(`${style.overflowY} ${style.overflow}`);
    if (scrollable) {
      return node;
    }
    node = node.parentElement;
  }
  return container;
}

function restoreScrollPosition(element, scrollTop) {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
  element.scrollTop = Math.min(Math.max(0, scrollTop), maxScrollTop);
}

export function renderPropertiesPanel(container, store) {
  let lastSelectedId = "";
  store.subscribe((state, reason) => {
    const selectedId = state.selectedIds[0] || "";
    const scrollElement = getPropertiesScrollElement(container);
    const previousScrollTop = scrollElement.scrollTop;
    const preserveScroll = reason !== "init" && selectedId === lastSelectedId;
    clear(container);
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
      if (preserveScroll) {
        restoreScrollPosition(scrollElement, previousScrollTop);
        requestAnimationFrame(() => restoreScrollPosition(scrollElement, previousScrollTop));
      }
      lastSelectedId = selectedId;
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
      choicePropertySection(block, updateProps),
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
      block.type === "grid" ? el("template") : section("Background", [
        field("Color", colorInput(block.styles?.backgroundColor || "#ffffff", (value) => updateStyles({ backgroundColor: value }))),
        field("Gradient", textInput(block.styles?.backgroundImage || "", (value) => updateStyles({ backgroundImage: value }))),
        field("Opacity", textInput(block.styles?.opacity || "1", (value) => updateStyles({ opacity: value }))),
      ]),
      section("Effects", [
        field("Shadow", textInput(block.styles?.boxShadow || "", (value) => updateStyles({ boxShadow: value }))),
        field("Blur", textInput(block.styles?.filter || "", (value) => updateStyles({ filter: value }))),
      ]),
      section("Layer", [
        field("Locked", checkboxInput(block.props?.locked, (value) => updateProps({ locked: value }))),
        field("Hidden", checkboxInput(block.props?.hidden, (value) => updateProps({ hidden: value }))),
      ]),
    );
    if (preserveScroll) {
      restoreScrollPosition(scrollElement, previousScrollTop);
      requestAnimationFrame(() => restoreScrollPosition(scrollElement, previousScrollTop));
    }
    lastSelectedId = selectedId;
  });
}
