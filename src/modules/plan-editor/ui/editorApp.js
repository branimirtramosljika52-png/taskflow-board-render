import { CadDocument } from "../core/CadDocument.js";
import { createSafeNexusCadProject, getCadEntityBounds, getSafeNexusCadProjectBounds } from "../core/safeNexusCadModel.js";
import { createCadEntity } from "../entities/entityFactory.js";
import { LineEntity } from "../entities/LineEntity.js";
import { PolylineEntity } from "../entities/PolylineEntity.js";
import { CircleEntity } from "../entities/CircleEntity.js";
import { ArcEntity } from "../entities/ArcEntity.js";
import { TextEntity } from "../entities/TextEntity.js";
import { distance } from "../geometry/distance.js";
import { angleBetweenPoints, constrainToOrtho } from "../geometry/angle.js";
import { boundsFromPoints } from "../geometry/boundingBox.js";
import { SpatialIndex } from "../spatial/SpatialIndex.js";
import { SnapEngine } from "../snapping/SnapEngine.js";
import { normalizeSnapSettings } from "../snapping/SnapSettings.js";
import { SelectionManager } from "../selection/SelectionManager.js";
import { HistoryManager } from "../history/HistoryManager.js";
import { AddEntityCommand } from "../history/commands/AddEntityCommand.js";
import { DeleteEntitiesCommand } from "../history/commands/DeleteEntitiesCommand.js";
import { MoveEntitiesCommand } from "../history/commands/MoveEntitiesCommand.js";
import { EditLineGripCommand } from "../history/commands/EditLineGripCommand.js";
import { EditPolylineVertexCommand } from "../history/commands/EditPolylineVertexCommand.js";
import { ChangeEntityPropertyCommand } from "../history/commands/ChangeEntityPropertyCommand.js";
import { CadImportService } from "../import/CadImportService.js";
import { SvgCadRenderer, svgElement } from "../renderer/SvgCadRenderer.js";
import { serializeCadProject, parseCadProjectJson } from "../storage/CadProjectSerializer.js";
import { createSafeNexusCadPdfBytes } from "../export/cadPdfExport.js";

const STORAGE_KEY = "safeNexus.planEditor.project.v2";
const DEFAULT_GRID_SPACING = 25;

const defaultLayers = [
  "TLOCRT",
  "ZIDOVI",
  "VRATA",
  "PROZORI",
  "TEKST",
  "EVAKUACIJA",
  "ZOP_OPREMA",
  "PANIK_RASVJETA",
  "VATRODOJAVA",
  "GROMOBRAN",
  "ELEKTRO",
  "RADNI_OKOLIS",
  "PLIN",
  "DIMENZIJE",
  "LEGENDA",
].map((name, index) => ({
  id: `layer_${name}`,
  name,
  color: index === 0 ? "#1f3b63" : "#263447",
  sortOrder: index,
}));

const dom = {
  svg: document.getElementById("cad-canvas"),
  layers: document.getElementById("cad-layers"),
  properties: document.getElementById("cad-properties"),
  statusCommand: document.getElementById("cad-status-command"),
  statusCoords: document.getElementById("cad-status-coords"),
  statusZoom: document.getElementById("cad-status-zoom"),
  statusSnap: document.getElementById("cad-status-snap"),
  saveStatus: document.getElementById("cad-save-status"),
  snapEnabled: document.getElementById("cad-snap-enabled"),
  snapEndpoint: document.getElementById("cad-snap-endpoint"),
  snapMidpoint: document.getElementById("cad-snap-midpoint"),
  snapCenter: document.getElementById("cad-snap-center"),
  snapIntersection: document.getElementById("cad-snap-intersection"),
  snapNearest: document.getElementById("cad-snap-nearest"),
  gridEnabled: document.getElementById("cad-grid-enabled"),
  gridSnap: document.getElementById("cad-grid-snap"),
  ortho: document.getElementById("cad-ortho"),
};

const renderer = new SvgCadRenderer(dom.svg);
const importService = new CadImportService();
const selection = new SelectionManager();
const history = new HistoryManager(100);
const spatialIndex = new SpatialIndex(512);
const snapEngine = new SnapEngine();

let cadDoc = loadInitialDocument();
let activeTool = "select";
let draft = null;
let drag = null;
let currentSnap = null;
let autosaveTimer = null;
let viewBox = { x: -100, y: -100, width: 600, height: 380 };

function createBlankDocument() {
  return new CadDocument(createSafeNexusCadProject({
    name: "SafeNexus Plan Editor",
    layers: defaultLayers,
    metadata: { milestone: "2" },
    pageSetup: {
      size: "A4",
      orientation: "landscape",
      marginsMm: 10,
      fitToPage: true,
    },
  }));
}

function loadInitialDocument() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new CadDocument(parseCadProjectJson(raw)) : createBlankDocument();
  } catch {
    return createBlankDocument();
  }
}

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function activeLayerId() {
  return cadDoc.project.layers.find((layer) => layer.visible !== false && !layer.locked)?.id
    || cadDoc.project.layers[0]?.id
    || "layer_TLOCRT";
}

function refreshSpatialIndex() {
  spatialIndex.clear();
  cadDoc.project.entities.forEach((entity) => {
    const bounds = getCadEntityBounds(entity);
    if (bounds) {
      spatialIndex.insert(entity.id, bounds, entity);
    }
  });
}

function viewportScale() {
  return viewBox.width / Math.max(1, dom.svg.clientWidth || dom.svg.getBoundingClientRect().width || 1);
}

function pointerToWorld(event) {
  const rect = dom.svg.getBoundingClientRect();
  return {
    x: viewBox.x + ((event.clientX - rect.left) / Math.max(1, rect.width)) * viewBox.width,
    y: viewBox.y + ((event.clientY - rect.top) / Math.max(1, rect.height)) * viewBox.height,
  };
}

function resolvePoint(event, basePoint = null) {
  const raw = pointerToWorld(event);
  refreshSnapSettings();
  currentSnap = snapEngine.snap(cadDoc.project, spatialIndex, raw, viewportScale());
  let point = currentSnap?.point || raw;
  if (basePoint && dom.ortho.checked) {
    point = constrainToOrtho(basePoint, point);
  }
  updateCursorStatus(point);
  return point;
}

function updateCursorStatus(point) {
  dom.statusCoords.textContent = `X ${point.x.toFixed(2)} / Y ${point.y.toFixed(2)}`;
  dom.statusSnap.textContent = `Snap: ${currentSnap?.type || "-"}`;
}

function refreshSnapSettings() {
  snapEngine.setSettings(normalizeSnapSettings({
    enabled: dom.snapEnabled.checked,
    endpoint: dom.snapEndpoint.checked,
    midpoint: dom.snapMidpoint.checked,
    center: dom.snapCenter.checked,
    intersection: dom.snapIntersection.checked,
    nearest: dom.snapNearest.checked,
    grid: dom.gridSnap.checked,
    gridSpacing: DEFAULT_GRID_SPACING,
    tolerancePx: 12,
  }));
}

function setSaveStatus(status) {
  dom.saveStatus.textContent = status;
}

function saveNow() {
  setSaveStatus("Saving");
  try {
    localStorage.setItem(STORAGE_KEY, serializeCadProject(cadDoc.project));
    setSaveStatus("Saved");
  } catch {
    setSaveStatus("Error");
  }
}

function scheduleAutosave() {
  setSaveStatus("Unsaved");
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(saveNow, 3000);
}

function commit(command) {
  cadDoc = history.execute(command, cadDoc);
  scheduleAutosave();
  render();
}

function selectedEntity() {
  const ids = [...selection.selectedIds];
  return ids.length === 1 ? cadDoc.getEntity(ids[0])?.toJSON() || null : null;
}

function fitToProject() {
  const bounds = getSafeNexusCadProjectBounds(cadDoc.project);
  const width = Math.max(100, bounds.maxX - bounds.minX);
  const height = Math.max(100, bounds.maxY - bounds.minY);
  const pad = Math.max(width, height) * 0.12;
  viewBox = {
    x: bounds.minX - pad,
    y: bounds.minY - pad,
    width: width + pad * 2,
    height: height + pad * 2,
  };
}

function render() {
  refreshSpatialIndex();
  const activeEntity = selectedEntity();
  renderer.render(cadDoc.project, {
    viewBox,
    selectedIds: selection.selectedIds,
    activeGripEntity: activeEntity,
    grid: {
      enabled: dom.gridEnabled.checked,
      spacing: DEFAULT_GRID_SPACING,
    },
    preview: buildPreviewElement(),
    snap: currentSnap,
  });
  dom.statusCommand.textContent = activeTool;
  dom.statusZoom.textContent = `Zoom ${Math.round(100 / Math.max(0.01, viewportScale()))}%`;
  renderLayers();
  renderProperties();
  updateToolbarState();
}

function buildPreviewElement() {
  if (!draft) {
    return null;
  }
  const group = svgElement("g", { class: "cad-editor-preview" });
  if (draft.tool === "line" && draft.start && draft.current) {
    group.append(svgElement("line", {
      x1: draft.start.x,
      y1: draft.start.y,
      x2: draft.current.x,
      y2: draft.current.y,
      "vector-effect": "non-scaling-stroke",
    }));
  }
  if (draft.tool === "polyline" && draft.points.length) {
    const points = [...draft.points, draft.current || draft.points.at(-1)];
    group.append(svgElement("polyline", {
      points: points.map((point) => `${point.x},${point.y}`).join(" "),
      "vector-effect": "non-scaling-stroke",
    }));
  }
  if (draft.tool === "circle" && draft.center && draft.current) {
    group.append(svgElement("circle", {
      cx: draft.center.x,
      cy: draft.center.y,
      r: distance(draft.center, draft.current),
      "vector-effect": "non-scaling-stroke",
    }));
  }
  if (draft.tool === "arc" && draft.center && draft.start && draft.current) {
    const radius = distance(draft.center, draft.start);
    const startAngle = angleBetweenPoints(draft.center, draft.start);
    const endAngle = angleBetweenPoints(draft.center, draft.current);
    const start = { x: draft.center.x + Math.cos(startAngle) * radius, y: draft.center.y + Math.sin(startAngle) * radius };
    const end = { x: draft.center.x + Math.cos(endAngle) * radius, y: draft.center.y + Math.sin(endAngle) * radius };
    group.append(svgElement("path", {
      d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`,
      "vector-effect": "non-scaling-stroke",
    }));
  }
  if (drag?.mode === "box") {
    const bounds = boundsFromPoints([drag.start, drag.current || drag.start]);
    group.append(svgElement("rect", {
      class: drag.crossing ? "cad-editor-crossing" : "cad-editor-window",
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      "vector-effect": "non-scaling-stroke",
    }));
  }
  return group.childNodes.length ? group : null;
}

function renderLayers() {
  dom.layers.replaceChildren();
  cadDoc.project.layers.forEach((layer) => {
    const row = document.createElement("label");
    row.className = "cad-layer-row";
    row.innerHTML = `
      <input type="checkbox" data-layer-visible="${layer.id}" ${layer.visible !== false ? "checked" : ""}>
      <span class="cad-layer-swatch" style="background:${layer.color}"></span>
      <span>${layer.name}</span>
      <button type="button" data-layer-lock="${layer.id}">${layer.locked ? "Unlock" : "Lock"}</button>
    `;
    dom.layers.append(row);
  });
}

function renderProperties() {
  const entity = selectedEntity();
  if (!entity) {
    dom.properties.textContent = selection.selectedIds.size
      ? `${selection.selectedIds.size} selected`
      : "No selection";
    return;
  }
  dom.properties.replaceChildren();
  const type = document.createElement("div");
  type.className = "cad-property-row";
  type.textContent = `${entity.type.toUpperCase()} | ${entity.id}`;
  dom.properties.append(type);

  if (entity.type === "text") {
    const contentLabel = document.createElement("label");
    contentLabel.className = "cad-property-row";
    contentLabel.textContent = "Text";
    const input = document.createElement("input");
    input.value = entity.geometry.content || "";
    input.addEventListener("change", () => {
      const next = new TextEntity({
        ...entity,
        geometry: { ...entity.geometry, content: input.value },
      }).toJSON();
      commit(new ChangeEntityPropertyCommand(entity, next));
    });
    contentLabel.append(input);
    dom.properties.append(contentLabel);

    const heightLabel = document.createElement("label");
    heightLabel.className = "cad-property-row";
    heightLabel.textContent = "Height";
    const heightInput = document.createElement("input");
    heightInput.type = "number";
    heightInput.min = "0.1";
    heightInput.step = "1";
    heightInput.value = String(entity.geometry.height || 10);
    heightInput.addEventListener("change", () => {
      const next = new TextEntity(entity).setHeight(Number(heightInput.value)).toJSON();
      commit(new ChangeEntityPropertyCommand(entity, next));
    });
    heightLabel.append(heightInput);
    dom.properties.append(heightLabel);
  }
}

function updateToolbarState() {
  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === activeTool);
  });
}

function setActiveTool(tool) {
  activeTool = tool;
  draft = null;
  drag = null;
  render();
}

function createLineEntity(start, end) {
  return new LineEntity({
    id: makeId("line"),
    type: "line",
    layerId: activeLayerId(),
    geometry: { start, end },
    createdBy: "user",
  }).toJSON();
}

function createPolylineEntity(points) {
  return new PolylineEntity({
    id: makeId("polyline"),
    type: "polyline",
    layerId: activeLayerId(),
    geometry: { points, closed: false },
    createdBy: "user",
  }).toJSON();
}

function createCircleEntity(center, pointOnCircle) {
  return new CircleEntity({
    id: makeId("circle"),
    type: "circle",
    layerId: activeLayerId(),
    geometry: { center, radius: Math.max(0.1, distance(center, pointOnCircle)) },
    createdBy: "user",
  }).toJSON();
}

function createArcEntity(center, start, end) {
  return new ArcEntity({
    id: makeId("arc"),
    type: "arc",
    layerId: activeLayerId(),
    geometry: {
      center,
      radius: Math.max(0.1, distance(center, start)),
      startAngle: angleBetweenPoints(center, start),
      endAngle: angleBetweenPoints(center, end),
    },
    createdBy: "user",
  }).toJSON();
}

function createTextEntity(point) {
  return new TextEntity({
    id: makeId("text"),
    type: "text",
    layerId: cadDoc.project.layers.find((layer) => layer.name === "TEKST")?.id || activeLayerId(),
    geometry: { insertionPoint: point, content: "TEXT", height: 12, rotation: 0 },
    createdBy: "user",
  }).toJSON();
}

function applyGrip(entity, gripId, point, sourceEntity = entity) {
  if (entity.type === "line") {
    let target = point;
    if (dom.ortho.checked && (gripId === "start" || gripId === "end")) {
      const anchor = gripId === "start" ? sourceEntity.geometry.end : sourceEntity.geometry.start;
      target = constrainToOrtho(anchor, point);
    }
    if (dom.ortho.checked && gripId === "middle") {
      const source = new LineEntity(sourceEntity);
      target = constrainToOrtho(source.midpoint(), point);
    }
    return new LineEntity(sourceEntity).moveGrip(gripId, target).toJSON();
  }
  if (entity.type === "polyline") {
    const polyline = new PolylineEntity(entity);
    if (gripId.startsWith("vertex:")) {
      return polyline.moveVertex(Number(gripId.split(":")[1]), point).toJSON();
    }
    if (gripId.startsWith("segment:")) {
      const segmentIndex = Number(gripId.split(":")[1]);
      return polyline.addVertexAfter(segmentIndex, point).toJSON();
    }
    if (gripId.startsWith("inserted:")) {
      return polyline.moveVertex(Number(gripId.split(":")[1]), point).toJSON();
    }
  }
  if (entity.type === "circle") {
    return new CircleEntity(entity).moveGrip(gripId, point).toJSON();
  }
  if (entity.type === "arc") {
    return new ArcEntity(entity).moveGrip(gripId, point).toJSON();
  }
  if (entity.type === "text") {
    const next = createCadEntity(entity).toJSON();
    if (gripId === "insertion") {
      next.geometry.insertionPoint = point;
    } else if (gripId === "height") {
      next.geometry.height = Math.max(0.1, Math.abs(point.y - next.geometry.insertionPoint.y));
    } else if (gripId === "rotation") {
      next.geometry.rotation = angleBetweenPoints(next.geometry.insertionPoint, point);
    }
    return next;
  }
  return entity;
}

function startGripDrag(event, target) {
  const entityId = target.getAttribute("data-entity-id");
  const gripId = target.getAttribute("data-grip-id");
  const entity = cadDoc.getEntity(entityId)?.toJSON();
  if (!entity || cadDoc.isLayerLocked(entity.layerId)) {
    return false;
  }
  const point = resolvePoint(event);
  let workingEntity = entity;
  let workingGripId = gripId;
  if (entity.type === "polyline" && gripId.startsWith("segment:")) {
    const segmentIndex = Number(gripId.split(":")[1]);
    workingEntity = new PolylineEntity(entity).addVertexAfter(segmentIndex, point).toJSON();
    workingGripId = `inserted:${segmentIndex + 1}`;
    cadDoc = cadDoc.replaceEntity(workingEntity);
  }
  drag = {
    mode: "grip",
    entityId,
    gripId: workingGripId,
    beforeEntity: entity,
    sourceEntity: workingEntity,
  };
  dom.svg.setPointerCapture(event.pointerId);
  return true;
}

function startSelection(event) {
  const point = pointerToWorld(event);
  drag = {
    mode: "box",
    start: point,
    current: point,
    crossing: false,
    moved: false,
    modifiers: {
      shift: event.shiftKey,
      ctrl: event.ctrlKey || event.metaKey,
    },
  };
  dom.svg.setPointerCapture(event.pointerId);
}

function completeSelection(event) {
  const point = pointerToWorld(event);
  const modelTolerance = 8 * viewportScale();
  if (!drag.moved || distance(drag.start, point) <= modelTolerance) {
    const hit = selection.hitTest(cadDoc.project, spatialIndex, point, modelTolerance);
    if (hit) {
      if (drag.modifiers.ctrl) {
        selection.remove(hit.id);
      } else if (drag.modifiers.shift) {
        selection.add(hit.id);
      } else {
        selection.set([hit.id]);
      }
    } else if (!drag.modifiers.shift && !drag.modifiers.ctrl) {
      selection.clear();
    }
  } else {
    const bounds = boundsFromPoints([drag.start, point]);
    selection.selectBox(cadDoc.project, spatialIndex, bounds, drag.crossing, {
      shiftKey: drag.modifiers.shift,
      ctrlKey: drag.modifiers.ctrl,
    });
  }
  drag = null;
  render();
}

function handlePointerDown(event) {
  dom.svg.focus();
  refreshSpatialIndex();
  if (event.button === 1 || activeTool === "pan") {
    drag = { mode: "pan", start: { x: event.clientX, y: event.clientY }, viewBox: { ...viewBox } };
    dom.svg.setPointerCapture(event.pointerId);
    return;
  }

  const target = event.target instanceof Element ? event.target.closest("[data-grip-id], [data-entity-id]") : null;
  if (target?.hasAttribute("data-grip-id") && startGripDrag(event, target)) {
    event.stopPropagation();
    render();
    return;
  }

  if (activeTool === "select" && target?.hasAttribute("data-entity-id")) {
    const entityId = target.getAttribute("data-entity-id");
    const entity = cadDoc.getEntity(entityId)?.toJSON();
    if (entity && !cadDoc.isLayerLocked(entity.layerId)) {
      if (event.ctrlKey || event.metaKey) {
        selection.remove(entityId);
      } else if (event.shiftKey) {
        selection.add(entityId);
      } else {
        selection.set([entityId]);
      }
      render();
      return;
    }
  }

  const base = draft?.tool === "line" ? draft.start : draft?.points?.at(-1) || null;
  const point = resolvePoint(event, base);

  if (activeTool === "select") {
    startSelection(event);
    return;
  }

  if (activeTool === "line") {
    if (!draft) {
      draft = { tool: "line", start: point, current: point };
    } else {
      commit(new AddEntityCommand(createLineEntity(draft.start, point)));
      draft = null;
    }
    render();
    return;
  }

  if (activeTool === "polyline") {
    if (!draft) {
      draft = { tool: "polyline", points: [point], current: point };
    } else {
      draft.points.push(point);
      draft.current = point;
    }
    render();
    return;
  }

  if (activeTool === "circle") {
    if (!draft) {
      draft = { tool: "circle", center: point, current: point };
    } else {
      commit(new AddEntityCommand(createCircleEntity(draft.center, point)));
      draft = null;
    }
    render();
    return;
  }

  if (activeTool === "arc") {
    if (!draft) {
      draft = { tool: "arc", center: point, current: point };
    } else if (!draft.start) {
      draft.start = point;
      draft.current = point;
    } else {
      commit(new AddEntityCommand(createArcEntity(draft.center, draft.start, point)));
      draft = null;
    }
    render();
    return;
  }

  if (activeTool === "text") {
    const entity = createTextEntity(point);
    commit(new AddEntityCommand(entity));
    selection.set([entity.id]);
    setActiveTool("select");
    return;
  }

  if ((activeTool === "move" || activeTool === "copy") && selection.selectedIds.size) {
    drag = {
      mode: activeTool,
      start: point,
      beforeDoc: cadDoc,
      ids: [...selection.selectedIds],
      copy: activeTool === "copy",
    };
    dom.svg.setPointerCapture(event.pointerId);
    return;
  }

  if (activeTool === "delete" && selection.selectedIds.size) {
    commit(new DeleteEntitiesCommand([...selection.selectedIds]));
    selection.clear();
  }
}

function handlePointerMove(event) {
  if (drag?.mode === "pan") {
    const dx = (event.clientX - drag.start.x) / Math.max(1, dom.svg.clientWidth) * drag.viewBox.width;
    const dy = (event.clientY - drag.start.y) / Math.max(1, dom.svg.clientHeight) * drag.viewBox.height;
    viewBox = { ...drag.viewBox, x: drag.viewBox.x - dx, y: drag.viewBox.y - dy };
    render();
    return;
  }

  if (drag?.mode === "box") {
    drag.current = pointerToWorld(event);
    drag.crossing = drag.current.x < drag.start.x;
    drag.moved = true;
    render();
    return;
  }

  if (drag?.mode === "grip") {
    const current = cadDoc.getEntity(drag.entityId)?.toJSON() || drag.sourceEntity;
    const point = resolvePoint(event, null);
    const after = applyGrip(current, drag.gripId, point, drag.sourceEntity);
    cadDoc = cadDoc.replaceEntity(after);
    render();
    return;
  }

  if (drag?.mode === "move" || drag?.mode === "copy") {
    const point = resolvePoint(event, drag.start);
    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    cadDoc = drag.beforeDoc.translateEntities(drag.ids, dx, dy, drag.copy);
    if (drag.copy) {
      selection.set(cadDoc.project.entities.slice(-drag.ids.length).map((entity) => entity.id));
    }
    render();
    return;
  }

  if (draft) {
    const base = draft.tool === "line" ? draft.start : draft.points?.at(-1) || draft.center || null;
    draft.current = resolvePoint(event, base);
    render();
    return;
  }

  const point = resolvePoint(event);
  render();
  updateCursorStatus(point);
}

function handlePointerUp(event) {
  if (drag?.mode === "box") {
    completeSelection(event);
    return;
  }
  if (drag?.mode === "pan") {
    drag = null;
    return;
  }
  if (drag?.mode === "grip") {
    const after = cadDoc.getEntity(drag.entityId)?.toJSON();
    const command = drag.beforeEntity.type === "line"
      ? new EditLineGripCommand(drag.beforeEntity, after)
      : drag.beforeEntity.type === "polyline"
        ? new EditPolylineVertexCommand(drag.beforeEntity, after)
        : new ChangeEntityPropertyCommand(drag.beforeEntity, after);
    cadDoc = cadDoc.replaceEntity(drag.beforeEntity);
    commit(command);
    drag = null;
    return;
  }
  if (drag?.mode === "move" || drag?.mode === "copy") {
    const current = resolvePoint(event, drag.start);
    const dx = current.x - drag.start.x;
    const dy = current.y - drag.start.y;
    const command = new MoveEntitiesCommand(drag.ids, dx, dy, drag.copy);
    cadDoc = drag.beforeDoc;
    commit(command);
    drag = null;
  }
}

function handleWheel(event) {
  event.preventDefault();
  const before = pointerToWorld(event);
  const factor = Math.exp(event.deltaY * 0.001);
  const nextWidth = Math.max(10, Math.min(100000, viewBox.width * factor));
  const nextHeight = Math.max(10, Math.min(100000, viewBox.height * factor));
  const rect = dom.svg.getBoundingClientRect();
  const ratioX = (event.clientX - rect.left) / Math.max(1, rect.width);
  const ratioY = (event.clientY - rect.top) / Math.max(1, rect.height);
  viewBox = {
    x: before.x - ratioX * nextWidth,
    y: before.y - ratioY * nextHeight,
    width: nextWidth,
    height: nextHeight,
  };
  render();
}

function completePolyline() {
  if (draft?.tool === "polyline" && draft.points.length >= 2) {
    commit(new AddEntityCommand(createPolylineEntity(draft.points)));
    draft = null;
  }
}

function cancelActiveOperation() {
  if (drag?.mode === "grip") {
    cadDoc = cadDoc.replaceEntity(drag.beforeEntity);
  }
  if (drag?.mode === "move" || drag?.mode === "copy") {
    cadDoc = drag.beforeDoc;
  }
  draft = null;
  drag = null;
  currentSnap = null;
  render();
}

function handleKeyDown(event) {
  if (event.key === "Escape") {
    if (draft || drag) {
      cancelActiveOperation();
    } else {
      selection.clear();
      render();
    }
    return;
  }
  if (event.key === "Delete" && selection.selectedIds.size) {
    commit(new DeleteEntitiesCommand([...selection.selectedIds]));
    selection.clear();
    return;
  }
  if (event.key === "Enter") {
    completePolyline();
    return;
  }
  if (event.key === "F8") {
    event.preventDefault();
    dom.ortho.checked = !dom.ortho.checked;
    render();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    cadDoc = history.undo(cadDoc);
    scheduleAutosave();
    render();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
    cadDoc = history.redo(cadDoc);
    scheduleAutosave();
    render();
  }
}

async function openDxfFile(file) {
  if (!file) {
    return;
  }
  const text = await file.text();
  const project = await importService.import({ name: file.name, type: "dxf", text });
  cadDoc = new CadDocument(project);
  selection.clear();
  history.clear();
  fitToProject();
  saveNow();
  render();
}

async function openJsonFile(file) {
  if (!file) {
    return;
  }
  cadDoc = new CadDocument(parseCadProjectJson(await file.text()));
  selection.clear();
  history.clear();
  fitToProject();
  saveNow();
  render();
}

function downloadBlob(bytes, fileName, type) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportPdf() {
  const bytes = await createSafeNexusCadPdfBytes(cadDoc.project);
  downloadBlob(bytes, "safenexus-plan-editor.pdf", "application/pdf");
}

function wireEvents() {
  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.addEventListener("click", () => setActiveTool(button.dataset.tool));
  });
  document.getElementById("cad-new").addEventListener("click", () => {
    cadDoc = createBlankDocument();
    selection.clear();
    history.clear();
    fitToProject();
    saveNow();
    render();
  });
  document.getElementById("cad-open-dxf").addEventListener("change", (event) => openDxfFile(event.target.files?.[0]));
  document.getElementById("cad-open-json").addEventListener("change", (event) => openJsonFile(event.target.files?.[0]));
  document.getElementById("cad-save").addEventListener("click", saveNow);
  document.getElementById("cad-pdf").addEventListener("click", exportPdf);
  document.getElementById("cad-undo").addEventListener("click", () => {
    cadDoc = history.undo(cadDoc);
    scheduleAutosave();
    render();
  });
  document.getElementById("cad-redo").addEventListener("click", () => {
    cadDoc = history.redo(cadDoc);
    scheduleAutosave();
    render();
  });
  dom.svg.addEventListener("pointerdown", handlePointerDown);
  dom.svg.addEventListener("pointermove", handlePointerMove);
  dom.svg.addEventListener("pointerup", handlePointerUp);
  dom.svg.addEventListener("wheel", handleWheel, { passive: false });
  dom.svg.addEventListener("contextmenu", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-grip-id]") : null;
    const gripId = target?.getAttribute("data-grip-id") || "";
    const entityId = target?.getAttribute("data-entity-id") || "";
    const entity = cadDoc.getEntity(entityId)?.toJSON();
    if (!entity || entity.type !== "polyline" || !gripId.startsWith("vertex:")) {
      return;
    }
    event.preventDefault();
    const next = new PolylineEntity(entity).deleteVertex(Number(gripId.split(":")[1])).toJSON();
    commit(new EditPolylineVertexCommand(entity, next));
  });
  document.addEventListener("keydown", handleKeyDown);
  [dom.snapEnabled, dom.snapEndpoint, dom.snapMidpoint, dom.snapCenter, dom.snapIntersection, dom.snapNearest, dom.gridEnabled, dom.gridSnap, dom.ortho].forEach((input) => {
    input.addEventListener("change", render);
  });
  dom.layers.addEventListener("change", (event) => {
    const layerId = event.target?.dataset?.layerVisible;
    if (!layerId) {
      return;
    }
    cadDoc = cadDoc.withProject({
      ...cadDoc.project,
      layers: cadDoc.project.layers.map((layer) => layer.id === layerId ? { ...layer, visible: event.target.checked } : layer),
    });
    scheduleAutosave();
    render();
  });
  dom.layers.addEventListener("click", (event) => {
    const layerId = event.target?.dataset?.layerLock;
    if (!layerId) {
      return;
    }
    cadDoc = cadDoc.withProject({
      ...cadDoc.project,
      layers: cadDoc.project.layers.map((layer) => layer.id === layerId ? { ...layer, locked: !layer.locked } : layer),
    });
    scheduleAutosave();
    render();
  });
}

wireEvents();
fitToProject();
render();

globalThis.SafeNexusPlanEditor = {
  getProject: () => cadDoc.toJSON(),
  loadProject: (project) => {
    cadDoc = new CadDocument(project);
    selection.clear();
    history.clear();
    fitToProject();
    saveNow();
    render();
  },
  exportJson: () => serializeCadProject(cadDoc.project),
};
