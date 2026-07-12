import { createSafeNexusCadProject, normalizeSafeNexusCadProject } from "../core/safeNexusCadModel.js";

const MLIGHT_WORKER_URLS = Object.freeze({
  dxfParser: "/assets/mlightcad/workers/dxf-parser-worker.js",
  dwgParser: "/assets/mlightcad/workers/libredwg-parser-worker.js",
  mtextRender: "/assets/mlightcad/workers/mtext-renderer-worker.js",
});

function toPoint2d(point = {}) {
  return {
    x: Number(point.x) || 0,
    y: Number(point.y) || 0,
  };
}

function createLayerId(name = "") {
  const normalized = String(name || "0").replace(/[^a-z0-9_-]+/gi, "_") || "0";
  return `layer_${normalized}`;
}

function colorToCss(color) {
  const rgb = color?.rgb ?? color?.trueColor ?? color?.colorValue;
  if (Number.isFinite(Number(rgb))) {
    return `#${Number(rgb).toString(16).padStart(6, "0").slice(-6)}`;
  }
  return "#21385f";
}

function entityId(entity = {}, fallback = 0) {
  return String(entity.objectId || entity.id || entity.handle || fallback);
}

function layerNameForEntity(entity = {}) {
  return String(entity.layer || entity.layerName || "0").trim() || "0";
}

function layerRecordToSafeLayer(layer = {}, index = 0) {
  const name = String(layer.name || "0").trim() || "0";
  return {
    id: createLayerId(name),
    name,
    visible: layer.isOff !== true && layer.isFrozen !== true,
    locked: layer.isLocked === true,
    printable: layer.isPlottable !== false,
    color: colorToCss(layer.color),
    lineType: String(layer.linetype || layer.lineType || "continuous"),
    lineWidth: Number(layer.lineWeight) > 0 ? Number(layer.lineWeight) / 100 : 0.25,
    opacity: 1,
    source: "mlightcad",
    sortOrder: index,
  };
}

function lineEntityToSafeEntity(entity = {}, index = 0) {
  const layerName = layerNameForEntity(entity);
  return {
    id: `mlight_line_${entityId(entity, index)}`,
    type: "line",
    layerId: createLayerId(layerName),
    geometry: {
      start: toPoint2d(entity.startPoint),
      end: toPoint2d(entity.endPoint),
    },
    sourceEntityId: entityId(entity, index),
    createdBy: "mlightcad-import",
  };
}

function polylineEntityToSafeEntity(entity = {}, index = 0) {
  const layerName = layerNameForEntity(entity);
  const points = [];
  const vertexCount = Number(entity.numberOfVertices) || 0;
  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex += 1) {
    if (typeof entity.getPoint3dAt === "function") {
      points.push(toPoint2d(entity.getPoint3dAt(vertexIndex)));
    } else if (typeof entity.getPoint2dAt === "function") {
      points.push(toPoint2d(entity.getPoint2dAt(vertexIndex)));
    }
  }

  return {
    id: `mlight_polyline_${entityId(entity, index)}`,
    type: "polyline",
    layerId: createLayerId(layerName),
    geometry: {
      points,
      closed: entity.closed === true,
    },
    sourceEntityId: entityId(entity, index),
    createdBy: "mlightcad-import",
  };
}

function readMlightLayers(database) {
  const layerTable = database?.tables?.layerTable;
  const iterator = typeof layerTable?.newIterator === "function" ? layerTable.newIterator() : null;
  const layers = typeof iterator?.toArray === "function" ? iterator.toArray() : [];
  return layers.map(layerRecordToSafeLayer);
}

function readMlightEntities(database) {
  const modelSpace = database?.tables?.blockTable?.modelSpace;
  const iterator = typeof modelSpace?.newIterator === "function" ? modelSpace.newIterator() : null;
  const rawEntities = typeof iterator?.toArray === "function" ? iterator.toArray() : [];
  const supportedEntities = [];
  const unsupportedEntities = new Map();

  rawEntities.forEach((entity, index) => {
    const dxfType = String(entity?.dxfTypeName || entity?.type || entity?.constructor?.name || "").toUpperCase();
    if (dxfType === "LINE" || dxfType === "ACDBLINE") {
      supportedEntities.push(lineEntityToSafeEntity(entity, index));
      return;
    }
    if (dxfType === "LWPOLYLINE" || dxfType === "POLYLINE" || dxfType === "ACDBPOLYLINE") {
      const safeEntity = polylineEntityToSafeEntity(entity, index);
      if (safeEntity.geometry.points.length >= 2) {
        supportedEntities.push(safeEntity);
      }
      return;
    }
    const unsupportedKey = dxfType || "UNKNOWN";
    unsupportedEntities.set(unsupportedKey, (unsupportedEntities.get(unsupportedKey) || 0) + 1);
  });

  return {
    entities: supportedEntities,
    unsupportedEntities: Object.fromEntries(unsupportedEntities.entries()),
    rawEntityCount: rawEntities.length,
  };
}

function extractProjectFromMlightDocument(document, sourceFile = {}) {
  const database = document?.database;
  const layers = readMlightLayers(database);
  const { entities, unsupportedEntities, rawEntityCount } = readMlightEntities(database);
  return createSafeNexusCadProject({
    name: sourceFile.originalName || "MLightCAD import",
    sourceFile,
    layers: layers.length ? layers : [{ id: "layer_0", name: "0", source: "mlightcad" }],
    entities,
    metadata: {
      importAdapter: "mlightcad",
      importedEntityCount: entities.length,
      rawEntityCount,
      unsupportedEntities,
      openedAt: new Date().toISOString(),
    },
  });
}

export async function createMlightCadSpikeAdapter({ hostElement, statusElement } = {}) {
  if (!hostElement) {
    throw new Error("MLightCAD host element is required.");
  }

  const setStatus = (message = "") => {
    if (statusElement) {
      statusElement.textContent = message;
    }
  };

  const module = await import("@mlightcad/cad-simple-viewer");
  const { AcApDocManager, AcEdOpenMode } = module;

  let manager = null;
  try {
    manager = AcApDocManager.createInstance({
      container: hostElement,
      busyIndicatorHost: hostElement,
      autoResize: true,
      notLoadDefaultFonts: true,
      builtinOpenFileDialog: false,
      checkWorkersOnInit: true,
      webworkerFileUrls: MLIGHT_WORKER_URLS,
      openDocumentDefaults: {
        minimumChunkSize: 1000,
        mode: AcEdOpenMode?.Write,
        sysVars: { lwdisplay: false },
      },
    }) || AcApDocManager.instance;
  } catch (error) {
    manager = AcApDocManager.instance;
  }

  const openDocumentOptions = {
    minimumChunkSize: 1000,
    mode: AcEdOpenMode?.Write,
    sysVars: { lwdisplay: false },
  };

  return {
    async loadFile(file) {
      if (!file) {
        throw new Error("CAD file is required.");
      }
      setStatus("MLightCAD otvara datoteku...");
      const fileContent = await file.arrayBuffer();
      const ok = await manager.openDocument(file.name, fileContent, openDocumentOptions);
      if (!ok) {
        throw new Error("MLightCAD nije uspio otvoriti datoteku.");
      }
      const project = normalizeSafeNexusCadProject(extractProjectFromMlightDocument(manager.curDocument, {
        fileId: "",
        type: file.name.toLowerCase().endsWith(".dwg") ? "dwg" : "dxf",
        originalName: file.name,
      }));
      setStatus(`MLightCAD ucitao ${project.entities.length} podrzanih entiteta.`);
      return project;
    },
    async destroy() {
      if (typeof manager?.destroy === "function") {
        await manager.destroy();
      }
    },
    get manager() {
      return manager;
    },
  };
}

export const mlightCadSpikeWorkerUrls = MLIGHT_WORKER_URLS;
