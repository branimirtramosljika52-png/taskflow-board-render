import page from "../blocks/page.js";
import section from "../blocks/section.js";
import container from "../blocks/container.js";
import heading from "../blocks/heading.js";
import text from "../blocks/text.js";
import image from "../blocks/image.js";
import logo from "../blocks/logo.js";
import line from "../blocks/line.js";
import spacer from "../blocks/spacer.js";
import divider from "../blocks/divider.js";
import table from "../blocks/table.js";
import badge from "../blocks/badge.js";
import status from "../blocks/status.js";
import input from "../blocks/input.js";
import textarea from "../blocks/textarea.js";
import checkbox from "../blocks/checkbox.js";
import radio from "../blocks/radio.js";
import select from "../blocks/select.js";
import date from "../blocks/date.js";
import signature from "../blocks/signature.js";
import stamp from "../blocks/stamp.js";
import chart from "../blocks/chart.js";
import list from "../blocks/list.js";
import icon from "../blocks/icon.js";
import qr from "../blocks/qr.js";
import barcode from "../blocks/barcode.js";
import pagebreak from "../blocks/pagebreak.js";

const definitions = [
  page,
  section,
  container,
  heading,
  text,
  image,
  logo,
  line,
  spacer,
  divider,
  table,
  badge,
  status,
  input,
  textarea,
  checkbox,
  radio,
  select,
  date,
  signature,
  stamp,
  chart,
  list,
  icon,
  qr,
  barcode,
  pagebreak,
];

const registry = new Map(definitions.map((definition) => [definition.type, definition]));

export function getBlockDefinition(type = "") {
  return registry.get(String(type || "").trim().toLowerCase()) || registry.get("text");
}

export function getBlockDefinitions() {
  return [...registry.values()];
}

export function getBlockCategories() {
  const categories = new Map();
  getBlockDefinitions()
    .filter((definition) => definition.type !== "page")
    .forEach((definition) => {
      const category = definition.category || "Utilities";
      categories.set(category, [...(categories.get(category) || []), definition]);
    });
  return categories;
}

export function createBlock(type = "text", initial = {}) {
  return getBlockDefinition(type).create(initial);
}

export function renderBlock(block, context) {
  return getBlockDefinition(block?.type).render(block, context);
}

export function blockToHtml(block) {
  return getBlockDefinition(block?.type).toHtml(block);
}
