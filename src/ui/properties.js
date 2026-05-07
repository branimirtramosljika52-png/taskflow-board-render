import { getBlockById } from "../core/state.js";
import { el, field, input, select, clear } from "../utils/dom.js";

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
  return Math.max(1, Math.min(24, Math.round(Number(value) || fallback)));
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
  };
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

function gridPropertySection(block, updateProps, updateStyles) {
  if (block.type !== "grid") {
    return null;
  }

  const rows = clampGridCount(block.props?.rows, 4);
  const columns = clampGridCount(block.props?.columns, 4);
  const showBorders = block.props?.showBorders !== false;
  const cellBackgroundColor = block.props?.cellBackgroundColor || "#ffffff";

  return section("Grid", [
    el("div", { className: "sn-builder-property-grid" }, [
      field("Rows", numberInput(rows, (value) => {
        const nextRows = clampGridCount(value, rows);
        updateProps({ rows: nextRows, columns, cells: resizeGridCells(block, nextRows, columns) });
      })),
      field("Columns", numberInput(columns, (value) => {
        const nextColumns = clampGridCount(value, columns);
        updateProps({ rows, columns: nextColumns, cells: resizeGridCells(block, rows, nextColumns) });
      })),
      field("Borders", checkboxInput(showBorders, (value) => updateProps({ showBorders: value }))),
      field("Cell bg", colorInput(cellBackgroundColor, (value) => updateProps({ cellBackgroundColor: value }))),
      field("Border", colorInput(block.styles?.borderColor || "#cbd5e1", (value) => updateStyles({ borderColor: value }))),
      field("Gap", textInput(block.styles?.gap || "0px", (value) => updateStyles({ gap: value }))),
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
    if (!block) {
      container.append(el("div", { className: "sn-builder-empty-state" }, "Oznaci element na stranici za uredjivanje."));
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
      gridPropertySection(block, updateProps, updateStyles),
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
