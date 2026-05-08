import { getBlockCategories } from "../core/registry.js";
import { DOCUMENT_BUILDER_TEMPLATES } from "./templates.js";
import { el, clear } from "../utils/dom.js";

const CATEGORY_LABELS = {
  Layout: "Layout",
  Text: "Tekst",
  Forms: "Forme",
  Tables: "Tablice",
  Media: "Media",
  Utilities: "Alati",
  Signatures: "Potpisi",
  Reports: "Izvještaji",
};

function categoryLabel(category = "") {
  return CATEGORY_LABELS[category] || category || "Ostalo";
}

export function renderSidebar(container, options = {}) {
  clear(container);
  const search = el("input", {
    type: "search",
    className: "sn-builder-search",
    placeholder: "Trazi blok, token ili template",
    autocomplete: "off",
  });
  const blockList = el("div", { className: "sn-builder-sidebar-list" });
  const templateList = el("div", { className: "sn-builder-template-list" });

  function renderLists() {
    const query = search.value.trim().toLowerCase();
    clear(blockList);
    getBlockCategories().forEach((definitions, category) => {
      const filtered = definitions.filter((definition) => (
        !query
        || definition.label.toLowerCase().includes(query)
        || definition.type.toLowerCase().includes(query)
        || category.toLowerCase().includes(query)
      ));
      if (filtered.length === 0) return;
      blockList.append(
        el("section", { className: "sn-builder-sidebar-category" }, [
          el("h4", {}, categoryLabel(category)),
          el("div", { className: "sn-builder-tool-grid" }, filtered.map((definition) => (
            el("button", {
              type: "button",
              className: "sn-builder-tool",
              dataset: { builderTool: definition.type },
              title: definition.label,
            }, [
              el("span", { className: "sn-builder-tool-icon", "aria-hidden": "true" }, definition.icon || definition.label.slice(0, 1)),
              el("span", { className: "sn-builder-tool-label" }, definition.label),
            ])
          ))),
        ]),
      );
    });

    const tokens = options.getTokenOptions?.() || [];
    if (tokens.length > 0) {
      blockList.prepend(el("section", { className: "sn-builder-sidebar-category is-token-category" }, [
        el("div", { className: "sn-builder-token-head" }, [
          el("h4", {}, "Tokeni predloška"),
          el("small", {}, "Klik dodaje tekst blok"),
        ]),
        el("div", { className: "sn-builder-token-grid" }, tokens
          .filter((token) => !query || `${token.label} ${token.value}`.toLowerCase().includes(query))
          .slice(0, 28)
          .map((token) => el("button", {
            type: "button",
            className: "sn-builder-token-tool",
            dataset: { builderTool: "text", builderToken: token.value },
            title: token.label,
          }, [
            el("span", { className: "sn-builder-token-value" }, token.value),
            el("small", { className: "sn-builder-token-label" }, token.label),
          ]))),
      ]));
    }

    clear(templateList);
    DOCUMENT_BUILDER_TEMPLATES
      .filter((template) => !query || `${template.label} ${template.description}`.toLowerCase().includes(query))
      .forEach((template) => {
        templateList.append(el("button", {
          type: "button",
          className: "sn-builder-template-card",
          dataset: { builderTemplate: template.id },
        }, [
          el("strong", {}, template.label),
          el("span", {}, template.description),
        ]));
      });
  }

  search.addEventListener("input", renderLists);
  container.addEventListener("click", (event) => {
    const templateButton = event.target instanceof HTMLElement
      ? event.target.closest("[data-builder-template]")
      : null;
    if (templateButton instanceof HTMLElement) {
      options.onLoadTemplate?.(templateButton.dataset.builderTemplate || "");
    }
    const toolButton = event.target instanceof HTMLElement
      ? event.target.closest("[data-builder-tool]")
      : null;
    if (toolButton instanceof HTMLElement && !event.pointerType) {
      options.onAddBlock?.(toolButton.dataset.builderTool || "text", toolButton.dataset.builderToken || "");
    }
  });

  container.append(
    el("div", { className: "sn-builder-panel-head" }, [
      el("span", {}, "Elementi"),
      el("strong", {}, "No-code"),
    ]),
    search,
    blockList,
    el("div", { className: "sn-builder-panel-head" }, [
      el("span", {}, "Predlošci"),
      el("strong", {}, "Start"),
    ]),
    templateList,
  );
  renderLists();
}
