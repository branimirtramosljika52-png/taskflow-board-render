import {
  createSafeNexusCadProject,
  normalizeSafeNexusCadProject,
} from "../core/safeNexusCadModel.js";

const DXF_LAYER_COLOR_BY_ACI = new Map([
  [1, "#ff2f2f"],
  [2, "#ffd43b"],
  [3, "#2fce63"],
  [4, "#25c7d9"],
  [5, "#2f6cff"],
  [6, "#c13bff"],
  [7, "#18243a"],
  [8, "#697586"],
  [9, "#9aa4b2"],
]);

function normalizeDxfName(value = "") {
  return String(value || "").trim() || "0";
}

function createLayerId(name = "") {
  const normalized = normalizeDxfName(name).replace(/[^a-z0-9_-]+/gi, "_") || "0";
  return `layer_${normalized}`;
}

function readDxfNumber(value = "", fallback = 0) {
  const number = Number.parseFloat(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number : fallback;
}

function readDxfFirstValue(pairs = [], code = "") {
  return pairs.find((pair) => pair.code === code)?.value || "";
}

function readDxfFirstNumber(pairs = [], code = "", fallback = 0) {
  return readDxfNumber(readDxfFirstValue(pairs, code), fallback);
}

function parseDxfPairRecords(dxfText = "") {
  const lines = String(dxfText || "").replace(/\r/g, "").split("\n");
  const pairs = [];
  for (let index = 0; index < lines.length - 1; index += 2) {
    pairs.push({
      code: String(lines[index] || "").trim(),
      value: String(lines[index + 1] || "").trim(),
    });
  }
  return pairs;
}

function readDxfLayerName(pairs = []) {
  return normalizeDxfName(readDxfFirstValue(pairs, "8"));
}

function readDxfHandle(pairs = []) {
  return String(readDxfFirstValue(pairs, "5") || readDxfFirstValue(pairs, "330") || "").trim();
}

function readDxfPolylinePoints(pairs = []) {
  const points = [];
  let pending = null;
  pairs.forEach((pair) => {
    if (pair.code === "10") {
      pending = { x: readDxfNumber(pair.value), y: 0 };
      points.push(pending);
    } else if (pair.code === "20" && pending) {
      pending.y = readDxfNumber(pair.value);
      pending = null;
    }
  });
  return points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function dxfLineEntityToSafeEntity(rawEntity = {}, index = 0) {
  const pairs = rawEntity.pairs || [];
  const layerName = readDxfLayerName(pairs);
  return {
    id: `entity_line_${readDxfHandle(pairs) || index}`,
    type: "line",
    layerId: createLayerId(layerName),
    geometry: {
      start: {
        x: readDxfFirstNumber(pairs, "10"),
        y: readDxfFirstNumber(pairs, "20"),
      },
      end: {
        x: readDxfFirstNumber(pairs, "11"),
        y: readDxfFirstNumber(pairs, "21"),
      },
    },
    sourceEntityId: readDxfHandle(pairs),
    createdBy: "dxf-import",
  };
}

function dxfLwPolylineEntityToSafeEntity(rawEntity = {}, index = 0) {
  const pairs = rawEntity.pairs || [];
  const layerName = readDxfLayerName(pairs);
  const points = readDxfPolylinePoints(pairs);
  return {
    id: `entity_polyline_${readDxfHandle(pairs) || index}`,
    type: "polyline",
    layerId: createLayerId(layerName),
    geometry: {
      points,
      closed: (Math.trunc(readDxfFirstNumber(pairs, "70")) & 1) === 1,
    },
    sourceEntityId: readDxfHandle(pairs),
    createdBy: "dxf-import",
  };
}

function dxfClassicPolylineEntityToSafeEntity(rawEntity = {}, index = 0) {
  const pairs = rawEntity.pairs || [];
  const layerName = readDxfLayerName(pairs);
  return {
    id: `entity_polyline_${readDxfHandle(pairs) || index}`,
    type: "polyline",
    layerId: createLayerId(layerName),
    geometry: {
      points: rawEntity.vertices || [],
      closed: (Math.trunc(readDxfFirstNumber(pairs, "70")) & 1) === 1,
    },
    sourceEntityId: readDxfHandle(pairs),
    createdBy: "dxf-import",
  };
}

function dxfCircleEntityToSafeEntity(rawEntity = {}, index = 0) {
  const pairs = rawEntity.pairs || [];
  const layerName = readDxfLayerName(pairs);
  return {
    id: `entity_circle_${readDxfHandle(pairs) || index}`,
    type: "circle",
    layerId: createLayerId(layerName),
    geometry: {
      center: {
        x: readDxfFirstNumber(pairs, "10"),
        y: readDxfFirstNumber(pairs, "20"),
      },
      radius: Math.max(0, readDxfFirstNumber(pairs, "40")),
    },
    sourceEntityId: readDxfHandle(pairs),
    createdBy: "dxf-import",
  };
}

function dxfArcEntityToSafeEntity(rawEntity = {}, index = 0) {
  const pairs = rawEntity.pairs || [];
  const layerName = readDxfLayerName(pairs);
  return {
    id: `entity_arc_${readDxfHandle(pairs) || index}`,
    type: "arc",
    layerId: createLayerId(layerName),
    geometry: {
      center: {
        x: readDxfFirstNumber(pairs, "10"),
        y: readDxfFirstNumber(pairs, "20"),
      },
      radius: Math.max(0, readDxfFirstNumber(pairs, "40")),
      startAngle: readDxfFirstNumber(pairs, "50") * Math.PI / 180,
      endAngle: readDxfFirstNumber(pairs, "51") * Math.PI / 180,
    },
    sourceEntityId: readDxfHandle(pairs),
    createdBy: "dxf-import",
  };
}

function dxfTextEntityToSafeEntity(rawEntity = {}, index = 0) {
  const pairs = rawEntity.pairs || [];
  const layerName = readDxfLayerName(pairs);
  return {
    id: `entity_text_${readDxfHandle(pairs) || index}`,
    type: "text",
    layerId: createLayerId(layerName),
    geometry: {
      insertionPoint: {
        x: readDxfFirstNumber(pairs, "10"),
        y: readDxfFirstNumber(pairs, "20"),
      },
      content: readDxfFirstValue(pairs, "1"),
      height: Math.max(0.1, readDxfFirstNumber(pairs, "40", 10)),
      rotation: readDxfFirstNumber(pairs, "50") * Math.PI / 180,
    },
    sourceEntityId: readDxfHandle(pairs),
    createdBy: "dxf-import",
  };
}

function parseDxfLayers(pairs = []) {
  const layers = [];
  let inTables = false;
  let waitingForSectionName = false;
  let currentLayer = null;

  const finishLayer = () => {
    if (!currentLayer) {
      return;
    }
    const name = normalizeDxfName(readDxfFirstValue(currentLayer.pairs, "2"));
    const rawAci = Math.abs(Math.trunc(readDxfFirstNumber(currentLayer.pairs, "62", 7)));
    const flags = Math.trunc(readDxfFirstNumber(currentLayer.pairs, "70", 0));
    layers.push({
      id: createLayerId(name),
      name,
      color: DXF_LAYER_COLOR_BY_ACI.get(rawAci) || "#21385f",
      visible: readDxfFirstNumber(currentLayer.pairs, "62", 7) >= 0,
      locked: (flags & 4) === 4,
      printable: true,
      source: "dxf",
      sortOrder: layers.length,
    });
    currentLayer = null;
  };

  pairs.forEach((pair) => {
    const upperValue = pair.value.toUpperCase();
    if (waitingForSectionName && pair.code === "2") {
      inTables = upperValue === "TABLES";
      waitingForSectionName = false;
      return;
    }
    if (pair.code === "0" && upperValue === "SECTION") {
      finishLayer();
      waitingForSectionName = true;
      inTables = false;
      return;
    }
    if (pair.code === "0" && upperValue === "ENDSEC") {
      finishLayer();
      inTables = false;
      return;
    }
    if (!inTables) {
      return;
    }
    if (pair.code === "0" && upperValue === "LAYER") {
      finishLayer();
      currentLayer = { pairs: [] };
      return;
    }
    if (pair.code === "0") {
      finishLayer();
      return;
    }
    if (currentLayer) {
      currentLayer.pairs.push(pair);
    }
  });
  finishLayer();
  return layers;
}

function parseDxfEntities(pairs = []) {
  const entities = [];
  const unsupported = new Map();
  let inEntities = false;
  let waitingForSectionName = false;
  let currentEntity = null;
  let currentPolyline = null;
  let currentVertex = null;

  const addUnsupported = (type = "") => {
    const key = String(type || "UNKNOWN").trim().toUpperCase() || "UNKNOWN";
    unsupported.set(key, (unsupported.get(key) || 0) + 1);
  };

  const finishVertex = () => {
    if (!currentPolyline || !currentVertex) {
      currentVertex = null;
      return;
    }
    currentPolyline.vertices.push({
      x: readDxfFirstNumber(currentVertex.pairs, "10"),
      y: readDxfFirstNumber(currentVertex.pairs, "20"),
    });
    currentVertex = null;
  };

  const finishCurrentEntity = () => {
    finishVertex();
    if (!currentEntity) {
      return;
    }
    const type = currentEntity.type;
    if (type === "LINE") {
      entities.push(dxfLineEntityToSafeEntity(currentEntity, entities.length));
    } else if (type === "LWPOLYLINE") {
      const entity = dxfLwPolylineEntityToSafeEntity(currentEntity, entities.length);
      if (entity.geometry.points.length >= 2) {
        entities.push(entity);
      }
    } else if (type === "CIRCLE") {
      entities.push(dxfCircleEntityToSafeEntity(currentEntity, entities.length));
    } else if (type === "ARC") {
      entities.push(dxfArcEntityToSafeEntity(currentEntity, entities.length));
    } else if (type === "TEXT") {
      entities.push(dxfTextEntityToSafeEntity(currentEntity, entities.length));
    } else if (type && type !== "POLYLINE") {
      addUnsupported(type);
    }
    currentEntity = null;
  };

  const finishCurrentPolyline = () => {
    finishVertex();
    if (!currentPolyline) {
      return;
    }
    const entity = dxfClassicPolylineEntityToSafeEntity(currentPolyline, entities.length);
    if (entity.geometry.points.length >= 2) {
      entities.push(entity);
    }
    currentPolyline = null;
  };

  pairs.forEach((pair) => {
    const code = pair.code;
    const value = pair.value;
    const upperValue = value.toUpperCase();

    if (waitingForSectionName && code === "2") {
      inEntities = upperValue === "ENTITIES";
      waitingForSectionName = false;
      return;
    }

    if (code === "0" && upperValue === "SECTION") {
      finishCurrentEntity();
      finishCurrentPolyline();
      waitingForSectionName = true;
      inEntities = false;
      return;
    }

    if (code === "0" && upperValue === "ENDSEC") {
      finishCurrentEntity();
      finishCurrentPolyline();
      inEntities = false;
      return;
    }

    if (!inEntities) {
      return;
    }

    if (code === "0" && upperValue === "POLYLINE") {
      finishCurrentEntity();
      finishCurrentPolyline();
      currentPolyline = { type: "POLYLINE", pairs: [], vertices: [] };
      return;
    }

    if (code === "0" && upperValue === "VERTEX" && currentPolyline) {
      finishVertex();
      currentVertex = { pairs: [] };
      return;
    }

    if (code === "0" && upperValue === "SEQEND") {
      finishCurrentPolyline();
      return;
    }

    if (code === "0") {
      finishCurrentEntity();
      if (currentPolyline) {
        addUnsupported(upperValue);
        return;
      }
      currentEntity = { type: upperValue, pairs: [] };
      return;
    }

    if (currentVertex) {
      currentVertex.pairs.push(pair);
      return;
    }

    if (currentPolyline) {
      currentPolyline.pairs.push(pair);
      return;
    }

    if (currentEntity) {
      currentEntity.pairs.push(pair);
    }
  });

  finishCurrentEntity();
  finishCurrentPolyline();
  return {
    entities,
    unsupportedEntities: Object.fromEntries(unsupported.entries()),
  };
}

export function parseSafeNexusCadDxf(dxfText = "", options = {}) {
  const pairs = parseDxfPairRecords(dxfText);
  const importedLayers = parseDxfLayers(pairs);
  const { entities, unsupportedEntities } = parseDxfEntities(pairs);
  const layerById = new Map(importedLayers.map((layer) => [layer.id, layer]));

  entities.forEach((entity) => {
    if (!layerById.has(entity.layerId)) {
      const name = entity.layerId.replace(/^layer_/, "") || "0";
      layerById.set(entity.layerId, {
        id: entity.layerId,
        name,
        visible: true,
        locked: false,
        printable: true,
        color: "#21385f",
        source: "dxf-entity",
        sortOrder: layerById.size,
      });
    }
  });

  const project = createSafeNexusCadProject({
    id: options.id,
    name: options.name || options.fileName || "Imported DXF",
    sourceFile: options.sourceFile || {
      fileId: "",
      type: "dxf",
      originalName: options.fileName || "",
    },
    layers: [...layerById.values()],
    entities,
    metadata: {
      importAdapter: "dxf",
      importedEntityCount: entities.length,
      unsupportedEntities,
      openedAt: new Date().toISOString(),
    },
  });

  return normalizeSafeNexusCadProject(project);
}
