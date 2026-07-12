import {
  createSafeNexusCadProject,
  getCadEntityGripPoints,
  getCadLayerById,
  getSafeNexusCadProjectBounds,
  hitTestSafeNexusCadProject,
  isCadEntityVisible,
  moveCadLineGrip,
  normalizeSafeNexusCadProject,
  parseSafeNexusCadJson,
  serializeSafeNexusCadProject,
} from "../core/safeNexusCadModel.js";
import { parseSafeNexusCadDxf } from "../adapters/dxfAdapter.js";
import { createMlightCadSpikeAdapter } from "../adapters/mlightcadAdapter.js";
import { createSafeNexusCadPdfBytes } from "../export/cadPdfExport.js";

const STORAGE_KEY = "safeNexus.planEditor.spike.project";
const SVG_NS = "http://www.w3.org/2000/svg";

const state = {
  project: createSafeNexusCadProject({
    name: "Plan Editor Spike",
    layers: [
      { id: "layer_0", name: "0", color: "#253858", source: "safe-nexus" },
    ],
    entities: [],
  }),
  selectedEntityId: "",
  viewBox: { x: -100, y: -100, width: 200, height: 200 },
  drag: null,
  mlightAdapter: null,
};

const dom = {};

function byId(id) {
  return document.getElementById(id);
}

function setStatus(message = "", tone = "neutral") {
  dom.status.textContent = message;
  dom.status.dataset.tone = tone;
}

function formatNumber(value = 0) {
  return Number(value).toLocaleString("hr-HR", {
    maximumFractionDigits: 2,
  });
}

function selectedEntity() {
  return state.project.entities.find((entity) => entity.id === state.selectedEntityId) || null;
}

function visibleEntities() {
  return state.project.entities.filter((entity) => isCadEntityVisible(state.project, entity));
}

function layerColor(entity) {
  return entity.style?.stroke || getCadLayerById(state.project, entity.layerId)?.color || "#18243a";
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(key, String(value));
    }
  });
  return element;
}

function fitSvgToProject() {
  const bounds = getSafeNexusCadProjectBounds(state.project);
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const padding = Math.max(width, height, 100) * 0.12;
  state.viewBox = {
    x: bounds.minX - padding,
    y: bounds.minY - padding,
    width: width + padding * 2,
    height: height + padding * 2,
  };
}

function updateJsonOutput() {
  dom.jsonOutput.value = serializeSafeNexusCadProject(state.project);
}

function renderLayerList() {
  const counts = new Map();
  state.project.entities.forEach((entity) => {
    counts.set(entity.layerId, (counts.get(entity.layerId) || 0) + 1);
  });

  dom.layerList.replaceChildren();
  state.project.layers
    .slice()
    .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
    .forEach((layer) => {
      const item = document.createElement("label");
      item.className = "cad-spike-layer";
      item.dataset.layerId = layer.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = layer.visible !== false;
      checkbox.addEventListener("change", () => {
        state.project = normalizeSafeNexusCadProject({
          ...state.project,
          layers: state.project.layers.map((candidate) => (
            candidate.id === layer.id ? { ...candidate, visible: checkbox.checked } : candidate
          )),
        });
        render();
      });

      const swatch = document.createElement("span");
      swatch.className = "cad-spike-layer-swatch";
      swatch.style.backgroundColor = layer.color;

      const title = document.createElement("span");
      title.className = "cad-spike-layer-title";
      title.textContent = layer.name;

      const meta = document.createElement("span");
      meta.className = "cad-spike-layer-meta";
      meta.textContent = `${counts.get(layer.id) || 0}`;

      item.append(checkbox, swatch, title, meta);
      dom.layerList.append(item);
    });
}

function renderEntity(entity) {
  const selected = entity.id === state.selectedEntityId;
  const strokeWidth = Math.max(0.6, Number(entity.style?.lineWidth || 0.25) * 2);
  const baseAttrs = {
    "data-entity-id": entity.id,
    "data-entity-type": entity.type,
    class: selected ? "cad-spike-entity is-selected" : "cad-spike-entity",
    stroke: layerColor(entity),
    "stroke-width": strokeWidth,
    "vector-effect": "non-scaling-stroke",
    fill: "none",
  };

  if (entity.type === "line") {
    return svgElement("line", {
      ...baseAttrs,
      x1: entity.geometry.start.x,
      y1: entity.geometry.start.y,
      x2: entity.geometry.end.x,
      y2: entity.geometry.end.y,
    });
  }

  if (entity.type === "polyline") {
    const points = (entity.geometry.points || []).map((point) => `${point.x},${point.y}`).join(" ");
    return svgElement(entity.geometry.closed ? "polygon" : "polyline", {
      ...baseAttrs,
      points,
    });
  }

  return null;
}

function renderGrips() {
  const entity = selectedEntity();
  if (!entity) {
    return;
  }
  getCadEntityGripPoints(entity).forEach((grip) => {
    const isMovableEndGrip = entity.type === "line" && grip.id === "end";
    const gripElement = svgElement("circle", {
      class: isMovableEndGrip ? "cad-spike-grip is-movable" : "cad-spike-grip",
      "data-entity-id": entity.id,
      "data-grip-id": grip.id,
      cx: grip.point.x,
      cy: grip.point.y,
      r: Math.max(state.viewBox.width, state.viewBox.height) / 130,
      tabindex: "0",
    });
    gripElement.addEventListener("pointerdown", (event) => {
      if (!isMovableEndGrip) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      gripElement.setPointerCapture(event.pointerId);
      state.drag = {
        pointerId: event.pointerId,
        entityId: entity.id,
        gripId: grip.id,
      };
    });
    dom.svg.append(gripElement);
  });
}

function updateSelectionPanel() {
  const entity = selectedEntity();
  if (!entity) {
    dom.selection.textContent = "Nema odabira. Klikni LINE ili POLYLINE u SafeNexus prikazu.";
    return;
  }
  if (entity.type === "line") {
    const start = entity.geometry.start;
    const end = entity.geometry.end;
    dom.selection.textContent = `LINE ${entity.id} | start ${formatNumber(start.x)}, ${formatNumber(start.y)} | end ${formatNumber(end.x)}, ${formatNumber(end.y)}`;
    return;
  }
  dom.selection.textContent = `POLYLINE ${entity.id} | tocaka: ${(entity.geometry.points || []).length}`;
}

function updateMetaPanel() {
  const unsupported = state.project.metadata?.unsupportedEntities || {};
  const unsupportedText = Object.entries(unsupported)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");
  dom.meta.textContent = [
    `Layeri: ${(state.project.layers || []).length}`,
    `Entiteti: ${(state.project.entities || []).length}`,
    `Vidljivo: ${visibleEntities().length}`,
    unsupportedText ? `Nepodrzano: ${unsupportedText}` : "",
  ].filter(Boolean).join(" | ");
}

function render() {
  dom.svg.setAttribute("viewBox", `${state.viewBox.x} ${state.viewBox.y} ${state.viewBox.width} ${state.viewBox.height}`);
  dom.svg.replaceChildren();

  const background = svgElement("rect", {
    class: "cad-spike-svg-background",
    x: state.viewBox.x,
    y: state.viewBox.y,
    width: state.viewBox.width,
    height: state.viewBox.height,
  });
  dom.svg.append(background);

  visibleEntities().forEach((entity) => {
    const element = renderEntity(entity);
    if (element) {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        state.selectedEntityId = entity.id;
        render();
      });
      dom.svg.append(element);
    }
  });

  renderGrips();
  renderLayerList();
  updateSelectionPanel();
  updateMetaPanel();
  updateJsonOutput();
}

function eventToWorldPoint(event) {
  const rect = dom.svg.getBoundingClientRect();
  const xRatio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
  const yRatio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0;
  return {
    x: state.viewBox.x + xRatio * state.viewBox.width,
    y: state.viewBox.y + yRatio * state.viewBox.height,
  };
}

function selectByPoint(event) {
  const point = eventToWorldPoint(event);
  const tolerance = Math.max(state.viewBox.width, state.viewBox.height) / 80;
  const hit = hitTestSafeNexusCadProject(state.project, point, tolerance);
  state.selectedEntityId = hit?.id || "";
  render();
}

function saveProjectToBrowserStorage() {
  const json = serializeSafeNexusCadProject(state.project);
  localStorage.setItem(STORAGE_KEY, json);
  dom.jsonOutput.value = json;
  setStatus("SafeNexus CAD JSON je spremljen u browser storage.", "ok");
}

function loadProjectFromJson(jsonText = "") {
  state.project = parseSafeNexusCadJson(jsonText);
  state.selectedEntityId = "";
  fitSvgToProject();
  render();
}

function loadProjectFromBrowserStorage() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) {
    setStatus("Nema spremljenog SafeNexus CAD JSON-a u browser storageu.", "warn");
    return;
  }
  loadProjectFromJson(json);
  setStatus("Spremljeni SafeNexus CAD JSON je ponovno ucitan.", "ok");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function ensureMlightAdapter() {
  if (state.mlightAdapter) {
    return state.mlightAdapter;
  }
  state.mlightAdapter = await createMlightCadSpikeAdapter({
    hostElement: dom.mlightHost,
    statusElement: dom.mlightStatus,
  });
  return state.mlightAdapter;
}

async function tryOpenWithMlight(file, shouldReplaceProject) {
  try {
    const adapter = await ensureMlightAdapter();
    const project = await adapter.loadFile(file);
    if (shouldReplaceProject || state.project.entities.length === 0) {
      state.project = project;
      state.selectedEntityId = "";
      fitSvgToProject();
      render();
    }
    setStatus("MLightCAD adapter je otvorio datoteku.", "ok");
  } catch (error) {
    dom.mlightStatus.textContent = `MLightCAD adapter nije otvorio datoteku: ${error.message}`;
    if (shouldReplaceProject) {
      setStatus(error.message, "error");
    }
  }
}

async function openCadFile(file) {
  if (!file) {
    return;
  }
  const lowerName = file.name.toLowerCase();
  const isDxf = lowerName.endsWith(".dxf");
  const isDwg = lowerName.endsWith(".dwg");
  if (!isDxf && !isDwg) {
    setStatus("Podrzani su DXF i DWG za spike.", "error");
    return;
  }

  if (isDxf) {
    try {
      const dxfText = await file.text();
      state.project = parseSafeNexusCadDxf(dxfText, {
        fileName: file.name,
        sourceFile: {
          fileId: "",
          type: "dxf",
          originalName: file.name,
        },
      });
      state.selectedEntityId = "";
      fitSvgToProject();
      render();
      setStatus("DXF je ucitan u SafeNexus CAD JSON preko spike parsera.", "ok");
      void tryOpenWithMlight(file, false);
      return;
    } catch (error) {
      setStatus(`DXF parser nije uspio: ${error.message}`, "warn");
    }
  }

  await tryOpenWithMlight(file, true);
}

function createEmptyProject() {
  state.project = createSafeNexusCadProject({
    name: "Prazan Plan Editor Spike",
    layers: [
      { id: "layer_0", name: "0", color: "#253858", source: "safe-nexus" },
      { id: "layer_TLOCRT", name: "TLOCRT", color: "#2457c5", source: "safe-nexus" },
    ],
    entities: [],
  });
  state.selectedEntityId = "";
  fitSvgToProject();
  render();
  setStatus("Otvoren je prazan SafeNexus CAD projekt.", "ok");
}

async function exportPdf() {
  const bytes = await createSafeNexusCadPdfBytes(state.project);
  downloadBlob(new Blob([bytes], { type: "application/pdf" }), "safe-nexus-cad-spike.pdf");
  setStatus("PDF export je generiran.", "ok");
}

function bindEvents() {
  dom.fileInput.addEventListener("change", () => {
    const file = dom.fileInput.files?.[0];
    void openCadFile(file);
  });

  dom.jsonFileInput.addEventListener("change", async () => {
    const file = dom.jsonFileInput.files?.[0];
    if (!file) {
      return;
    }
    try {
      loadProjectFromJson(await file.text());
      setStatus("SafeNexus CAD JSON datoteka je ucitana.", "ok");
    } catch (error) {
      setStatus(`JSON ucitavanje nije uspjelo: ${error.message}`, "error");
    }
  });

  dom.emptyButton.addEventListener("click", createEmptyProject);
  dom.fitButton.addEventListener("click", () => {
    fitSvgToProject();
    render();
  });
  dom.saveJsonButton.addEventListener("click", saveProjectToBrowserStorage);
  dom.reloadJsonButton.addEventListener("click", loadProjectFromBrowserStorage);
  dom.downloadJsonButton.addEventListener("click", () => {
    const json = serializeSafeNexusCadProject(state.project);
    downloadBlob(new Blob([json], { type: "application/json" }), "safe-nexus-cad-spike.json");
    setStatus("SafeNexus CAD JSON je preuzet.", "ok");
  });
  dom.exportPdfButton.addEventListener("click", () => {
    void exportPdf().catch((error) => setStatus(`PDF export nije uspio: ${error.message}`, "error"));
  });

  dom.svg.addEventListener("click", selectByPoint);
  dom.svg.addEventListener("pointermove", (event) => {
    if (!state.drag) {
      return;
    }
    const target = eventToWorldPoint(event);
    state.project = moveCadLineGrip(state.project, state.drag.entityId, state.drag.gripId, target);
    render();
  });
  dom.svg.addEventListener("pointerup", (event) => {
    if (state.drag?.pointerId === event.pointerId) {
      state.drag = null;
      saveProjectToBrowserStorage();
    }
  });
  dom.svg.addEventListener("pointercancel", () => {
    state.drag = null;
  });
}

function initDom() {
  dom.fileInput = byId("cad-spike-file");
  dom.jsonFileInput = byId("cad-spike-json-file");
  dom.emptyButton = byId("cad-spike-empty");
  dom.fitButton = byId("cad-spike-fit");
  dom.saveJsonButton = byId("cad-spike-save-json");
  dom.reloadJsonButton = byId("cad-spike-reload-json");
  dom.downloadJsonButton = byId("cad-spike-download-json");
  dom.exportPdfButton = byId("cad-spike-export-pdf");
  dom.status = byId("cad-spike-status");
  dom.mlightStatus = byId("cad-spike-mlight-status");
  dom.layerList = byId("cad-spike-layer-list");
  dom.jsonOutput = byId("cad-spike-json-output");
  dom.svg = byId("cad-spike-svg");
  dom.mlightHost = byId("cad-spike-mlight-host");
  dom.selection = byId("cad-spike-selection");
  dom.meta = byId("cad-spike-meta");
}

function init() {
  initDom();
  bindEvents();
  const savedJson = localStorage.getItem(STORAGE_KEY);
  if (savedJson) {
    try {
      state.project = parseSafeNexusCadJson(savedJson);
      setStatus("Ucitan je zadnji lokalno spremljeni spike projekt.", "ok");
    } catch {
      setStatus("Spremnik ima neispravan JSON, otvoren je prazan projekt.", "warn");
    }
  } else {
    setStatus("Spike je spreman. Ucitaj DXF/DWG ili kreni s praznim projektom.");
  }
  fitSvgToProject();
  render();
}

init();
