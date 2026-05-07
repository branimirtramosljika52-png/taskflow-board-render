export function el(tagName, attributes = {}, children = []) {
  const node = document.createElement(tagName);
  Object.entries(attributes || {}).forEach(([key, value]) => {
    if (value == null || value === false) {
      return;
    }
    if (key === "className") {
      node.className = value;
      return;
    }
    if (key === "dataset") {
      Object.entries(value || {}).forEach(([dataKey, dataValue]) => {
        node.dataset[dataKey] = String(dataValue);
      });
      return;
    }
    if (key === "style" && value && typeof value === "object") {
      Object.entries(value).forEach(([styleKey, styleValue]) => {
        if (styleValue != null) {
          node.style[styleKey] = String(styleValue);
        }
      });
      return;
    }
    if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
      return;
    }
    node.setAttribute(key, value === true ? "" : String(value));
  });

  append(node, children);
  return node;
}

export function append(parent, children = []) {
  const list = Array.isArray(children) ? children : [children];
  list.forEach((child) => {
    if (child == null || child === false) {
      return;
    }
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return parent;
}

export function clear(node) {
  if (node) {
    node.replaceChildren();
  }
}

export function button(label, attributes = {}) {
  return el("button", { type: "button", ...attributes }, label);
}

export function input(attributes = {}) {
  return el("input", attributes);
}

export function select(options = [], value = "", attributes = {}) {
  const node = el("select", attributes);
  options.forEach((option) => {
    node.append(el("option", { value: option.value, selected: String(option.value) === String(value) }, option.label));
  });
  return node;
}

export function field(labelText, control, extraClass = "") {
  return el("label", { className: `sn-builder-field ${extraClass}`.trim() }, [
    el("span", {}, labelText),
    control,
  ]);
}

export function stop(event) {
  event.preventDefault();
  event.stopPropagation();
}

