import { alignSelection, distributeSelection, sameSizeSelection } from "../core/alignment.js";
import { groupSelected, ungroupSelected } from "../core/grouping.js";
import { el, button } from "../utils/dom.js";

export function renderToolbar(container, store) {
  const actions = [
    ["L", "Poravnaj lijevo", () => alignSelection(store, "left")],
    ["C", "Centar", () => alignSelection(store, "center")],
    ["R", "Poravnaj desno", () => alignSelection(store, "right")],
    ["T", "Gore", () => alignSelection(store, "top")],
    ["M", "Sredina", () => alignSelection(store, "middle")],
    ["B", "Dolje", () => alignSelection(store, "bottom")],
    ["DH", "Rasporedi vodoravno", () => distributeSelection(store, "horizontal")],
    ["DV", "Rasporedi okomito", () => distributeSelection(store, "vertical")],
    ["W", "Ista sirina", () => sameSizeSelection(store, "width")],
    ["H", "Ista visina", () => sameSizeSelection(store, "height")],
    ["G", "Grupiraj", () => groupSelected(store)],
    ["UG", "Razgrupiraj", () => ungroupSelected(store)],
    ["Front", "Na vrh", () => store.bringToFront()],
    ["Back", "Na dno", () => store.sendToBack()],
  ];
  container.append(el("div", { className: "sn-builder-toolbar-group" }, actions.map(([label, title, action]) => (
    button(label, { className: "sn-builder-tool-button", title, onclick: action })
  ))));
}
