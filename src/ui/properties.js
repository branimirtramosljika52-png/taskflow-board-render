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

function section(title, children = []) {
  return el("section", { className: "sn-builder-property-section" }, [
    el("h4", {}, title),
    ...children,
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
