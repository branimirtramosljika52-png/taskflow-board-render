export const SAFE_NEXUS_CAD_SCHEMA = "safe-nexus-cad";
export const SAFE_NEXUS_CAD_FORMAT_VERSION = 2;

const DEFAULT_LAYER_COLOR = "#21385f";
const DEFAULT_ENTITY_STROKE = "#18243a";

function nowIsoString() {
  return new Date().toISOString();
}

function createLocalId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeCadPoint(point = {}) {
  return {
    x: normalizeNumber(point.x),
    y: normalizeNumber(point.y),
  };
}

export function createSafeNexusCadProject(overrides = {}) {
  const timestamp = nowIsoString();
  return normalizeSafeNexusCadProject({
    id: overrides.id || createLocalId("plan"),
    name: overrides.name || "Plan Editor Spike",
    planType: overrides.planType || "floor_plan",
    sourceFile: overrides.sourceFile || null,
    units: overrides.units || "mm",
    scale: overrides.scale ?? 1,
    layers: overrides.layers || [],
    entities: overrides.entities || [],
    symbols: overrides.symbols || [],
    pageSetup: overrides.pageSetup || {
      size: "A4",
      orientation: "landscape",
      marginsMm: 10,
      fitToPage: true,
    },
    titleBlock: overrides.titleBlock || {},
    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(overrides.metadata || {}),
    },
    createdAt: overrides.createdAt || timestamp,
    updatedAt: overrides.updatedAt || timestamp,
    revision: overrides.revision || "0",
    version: overrides.version || SAFE_NEXUS_CAD_FORMAT_VERSION,
    schema: SAFE_NEXUS_CAD_SCHEMA,
  });
}

export function normalizeCadLayer(layer = {}, index = 0) {
  const name = String(layer.name || layer.layer || "0").trim() || "0";
  return {
    id: String(layer.id || `layer_${name.replace(/[^a-z0-9_-]+/gi, "_") || index}`).trim(),
    name,
    visible: layer.visible !== false,
    locked: Boolean(layer.locked),
    printable: layer.printable !== false,
    color: String(layer.color || DEFAULT_LAYER_COLOR).trim() || DEFAULT_LAYER_COLOR,
    lineType: String(layer.lineType || layer.linetype || "continuous").trim() || "continuous",
    lineWidth: Math.max(0.05, normalizeNumber(layer.lineWidth ?? layer.lineweight, 0.25)),
    opacity: Math.max(0, Math.min(1, normalizeNumber(layer.opacity, 1))),
    source: String(layer.source || "safe-nexus").trim() || "safe-nexus",
    sortOrder: Number.isFinite(Number(layer.sortOrder)) ? Number(layer.sortOrder) : index,
  };
}

export function normalizeCadEntity(entity = {}, index = 0, fallbackLayerId = "layer_0") {
  const rawType = String(entity.type || "").trim().toLowerCase();
  const type = rawType === "lwpolyline" ? "polyline" : rawType;
  const updatedAt = entity.updatedAt || nowIsoString();
  const base = {
    id: String(entity.id || createLocalId(`entity_${index}`)),
    type,
    layerId: String(entity.layerId || fallbackLayerId),
    style: {
      stroke: String(entity.style?.stroke || DEFAULT_ENTITY_STROKE),
      fill: String(entity.style?.fill || "none"),
      lineWidth: Math.max(0.05, normalizeNumber(entity.style?.lineWidth, 0.25)),
      lineType: String(entity.style?.lineType || "continuous"),
      ...(entity.style || {}),
    },
    properties: { ...(entity.properties || {}) },
    sourceEntityId: String(entity.sourceEntityId || ""),
    createdBy: String(entity.createdBy || "import"),
    updatedAt,
  };

  if (type === "line") {
    const geometry = entity.geometry || {};
    return {
      ...base,
      type: "line",
      geometry: {
        start: normalizeCadPoint(geometry.start),
        end: normalizeCadPoint(geometry.end),
      },
    };
  }

  if (type === "polyline") {
    const geometry = entity.geometry || {};
    const rawPoints = Array.isArray(geometry.points) ? geometry.points : geometry.vertices;
    const points = Array.isArray(rawPoints)
      ? rawPoints.map(normalizeCadPoint).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      : [];
    return {
      ...base,
      type: "polyline",
      geometry: {
        points,
        closed: Boolean(geometry.closed),
      },
    };
  }

  if (type === "circle") {
    const geometry = entity.geometry || {};
    return {
      ...base,
      type: "circle",
      geometry: {
        center: normalizeCadPoint(geometry.center),
        radius: Math.max(0, normalizeNumber(geometry.radius)),
      },
    };
  }

  if (type === "arc") {
    const geometry = entity.geometry || {};
    return {
      ...base,
      type: "arc",
      geometry: {
        center: normalizeCadPoint(geometry.center),
        radius: Math.max(0, normalizeNumber(geometry.radius)),
        startAngle: normalizeNumber(geometry.startAngle),
        endAngle: normalizeNumber(geometry.endAngle),
      },
    };
  }

  if (type === "text") {
    const geometry = entity.geometry || {};
    return {
      ...base,
      type: "text",
      geometry: {
        insertionPoint: normalizeCadPoint(geometry.insertionPoint || geometry.position),
        content: String(geometry.content ?? entity.properties?.content ?? ""),
        height: Math.max(0.1, normalizeNumber(geometry.height, 10)),
        rotation: normalizeNumber(geometry.rotation),
      },
    };
  }

  return {
    ...base,
    type: type || "unsupported",
    geometry: entity.geometry && typeof entity.geometry === "object" ? { ...entity.geometry } : {},
  };
}

export function normalizeSafeNexusCadProject(project = {}) {
  const layers = (Array.isArray(project.layers) && project.layers.length ? project.layers : [{ id: "layer_0", name: "0" }])
    .map(normalizeCadLayer);
  const layerIds = new Set(layers.map((layer) => layer.id));
  const fallbackLayerId = layers[0]?.id || "layer_0";
  const entities = (Array.isArray(project.entities) ? project.entities : [])
    .map((entity, index) => normalizeCadEntity(entity, index, layerIds.has(entity?.layerId) ? entity.layerId : fallbackLayerId));

  return {
    id: String(project.id || createLocalId("plan")),
    name: String(project.name || "Plan Editor Spike"),
    planType: String(project.planType || "floor_plan"),
    sourceFile: project.sourceFile && typeof project.sourceFile === "object" ? { ...project.sourceFile } : null,
    units: String(project.units || "mm"),
    scale: normalizeNumber(project.scale, 1),
    layers,
    entities,
    symbols: Array.isArray(project.symbols) ? [...project.symbols] : [],
    pageSetup: project.pageSetup && typeof project.pageSetup === "object" ? { ...project.pageSetup } : {},
    titleBlock: project.titleBlock && typeof project.titleBlock === "object" ? { ...project.titleBlock } : {},
    metadata: project.metadata && typeof project.metadata === "object" ? { ...project.metadata } : {},
    createdAt: String(project.createdAt || project.metadata?.createdAt || nowIsoString()),
    updatedAt: String(project.updatedAt || project.metadata?.updatedAt || nowIsoString()),
    revision: String(project.revision || "0"),
    version: Math.max(1, Math.trunc(normalizeNumber(project.version, SAFE_NEXUS_CAD_FORMAT_VERSION))),
    schema: SAFE_NEXUS_CAD_SCHEMA,
  };
}

export function cloneSafeNexusCadProject(project = {}) {
  return normalizeSafeNexusCadProject(JSON.parse(JSON.stringify(project)));
}

export function serializeSafeNexusCadProject(project = {}) {
  return JSON.stringify(normalizeSafeNexusCadProject(project), null, 2);
}

export function parseSafeNexusCadJson(jsonText = "") {
  const parsed = JSON.parse(String(jsonText || "{}"));
  return normalizeSafeNexusCadProject(parsed);
}

export function getCadLayerById(project = {}, layerId = "") {
  return (project.layers || []).find((layer) => String(layer.id) === String(layerId)) || null;
}

export function isCadEntityVisible(project = {}, entity = {}) {
  const layer = getCadLayerById(project, entity.layerId);
  return layer?.visible !== false;
}

export function getCadEntityGripPoints(entity = {}) {
  if (entity.type === "line") {
    const start = normalizeCadPoint(entity.geometry?.start);
    const end = normalizeCadPoint(entity.geometry?.end);
    return [
      { id: "start", label: "Start", role: "endpoint", point: start },
      {
        id: "middle",
        label: "Middle",
        role: "midpoint",
        point: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      },
      { id: "end", label: "End", role: "endpoint", point: end },
    ];
  }

  if (entity.type === "polyline") {
    const points = Array.isArray(entity.geometry?.points) ? entity.geometry.points.map(normalizeCadPoint) : [];
    const grips = points.map((point, index) => ({
      id: `vertex:${index}`,
      label: `Vertex ${index + 1}`,
      role: "vertex",
      point,
    }));
    const segmentCount = entity.geometry?.closed ? points.length : Math.max(0, points.length - 1);
    for (let index = 0; index < segmentCount; index += 1) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      if (start && end) {
        grips.push({
          id: `segment:${index}`,
          label: `Segment ${index + 1}`,
          role: "midpoint",
          point: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        });
      }
    }
    return grips;
  }

  if (entity.type === "circle") {
    const center = normalizeCadPoint(entity.geometry?.center);
    const radius = normalizeNumber(entity.geometry?.radius);
    return [
      { id: "center", label: "Center", role: "center", point: center },
      { id: "quadrant:0", label: "East", role: "quadrant", point: { x: center.x + radius, y: center.y } },
      { id: "quadrant:90", label: "North", role: "quadrant", point: { x: center.x, y: center.y + radius } },
      { id: "quadrant:180", label: "West", role: "quadrant", point: { x: center.x - radius, y: center.y } },
      { id: "quadrant:270", label: "South", role: "quadrant", point: { x: center.x, y: center.y - radius } },
    ];
  }

  if (entity.type === "arc") {
    const center = normalizeCadPoint(entity.geometry?.center);
    const radius = normalizeNumber(entity.geometry?.radius);
    const startAngle = normalizeNumber(entity.geometry?.startAngle);
    const endAngle = normalizeNumber(entity.geometry?.endAngle);
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const pointAt = (angle) => ({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
    return [
      { id: "center", label: "Center", role: "center", point: center },
      { id: "start", label: "Start", role: "endpoint", point: pointAt(startAngle) },
      { id: "end", label: "End", role: "endpoint", point: pointAt(endAngle) },
      { id: "middle", label: "Arc Middle", role: "midpoint", point: pointAt(midAngle) },
    ];
  }

  if (entity.type === "text") {
    const insertionPoint = normalizeCadPoint(entity.geometry?.insertionPoint);
    const height = normalizeNumber(entity.geometry?.height, 10);
    const rotation = normalizeNumber(entity.geometry?.rotation);
    return [
      { id: "insertion", label: "Insertion", role: "insertion", point: insertionPoint },
      {
        id: "rotation",
        label: "Rotation",
        role: "rotation",
        point: {
          x: insertionPoint.x + Math.cos(rotation) * height * 1.8,
          y: insertionPoint.y + Math.sin(rotation) * height * 1.8,
        },
      },
      { id: "height", label: "Height", role: "height", point: { x: insertionPoint.x, y: insertionPoint.y + height } },
    ];
  }

  return [];
}

function movePoint(point = {}, dx = 0, dy = 0) {
  return {
    x: normalizeNumber(point.x) + dx,
    y: normalizeNumber(point.y) + dy,
  };
}

export function moveCadLineGrip(project = {}, entityId = "", gripId = "end", targetPoint = {}) {
  const normalizedTarget = normalizeCadPoint(targetPoint);
  const nextProject = cloneSafeNexusCadProject(project);
  nextProject.entities = nextProject.entities.map((entity) => {
    if (String(entity.id) !== String(entityId) || entity.type !== "line") {
      return entity;
    }
    const start = normalizeCadPoint(entity.geometry.start);
    const end = normalizeCadPoint(entity.geometry.end);
    if (gripId === "start") {
      return {
        ...entity,
        geometry: { start: normalizedTarget, end },
        updatedAt: nowIsoString(),
      };
    }
    if (gripId === "middle") {
      const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      const dx = normalizedTarget.x - midpoint.x;
      const dy = normalizedTarget.y - midpoint.y;
      return {
        ...entity,
        geometry: {
          start: movePoint(start, dx, dy),
          end: movePoint(end, dx, dy),
        },
        updatedAt: nowIsoString(),
      };
    }
    return {
      ...entity,
      geometry: { start, end: normalizedTarget },
      updatedAt: nowIsoString(),
    };
  });
  nextProject.metadata = {
    ...(nextProject.metadata || {}),
    updatedAt: nowIsoString(),
  };
  return normalizeSafeNexusCadProject(nextProject);
}

export function distanceBetweenCadPoints(a = {}, b = {}) {
  const dx = normalizeNumber(a.x) - normalizeNumber(b.x);
  const dy = normalizeNumber(a.y) - normalizeNumber(b.y);
  return Math.sqrt(dx * dx + dy * dy);
}

export function distancePointToCadSegment(point = {}, start = {}, end = {}) {
  const px = normalizeNumber(point.x);
  const py = normalizeNumber(point.y);
  const x1 = normalizeNumber(start.x);
  const y1 = normalizeNumber(start.y);
  const x2 = normalizeNumber(end.x);
  const y2 = normalizeNumber(end.y);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= Number.EPSILON) {
    return distanceBetweenCadPoints(point, start);
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return distanceBetweenCadPoints(point, { x: x1 + t * dx, y: y1 + t * dy });
}

export function getCadEntityBounds(entity = {}) {
  if (entity.type === "line") {
    const start = normalizeCadPoint(entity.geometry?.start);
    const end = normalizeCadPoint(entity.geometry?.end);
    return {
      minX: Math.min(start.x, end.x),
      minY: Math.min(start.y, end.y),
      maxX: Math.max(start.x, end.x),
      maxY: Math.max(start.y, end.y),
    };
  }

  if (entity.type === "polyline") {
    const points = Array.isArray(entity.geometry?.points) ? entity.geometry.points.map(normalizeCadPoint) : [];
    if (!points.length) {
      return null;
    }
    return {
      minX: Math.min(...points.map((point) => point.x)),
      minY: Math.min(...points.map((point) => point.y)),
      maxX: Math.max(...points.map((point) => point.x)),
      maxY: Math.max(...points.map((point) => point.y)),
    };
  }

  if (entity.type === "circle") {
    const center = normalizeCadPoint(entity.geometry?.center);
    const radius = Math.max(0, normalizeNumber(entity.geometry?.radius));
    return {
      minX: center.x - radius,
      minY: center.y - radius,
      maxX: center.x + radius,
      maxY: center.y + radius,
    };
  }

  if (entity.type === "arc") {
    const center = normalizeCadPoint(entity.geometry?.center);
    const radius = Math.max(0, normalizeNumber(entity.geometry?.radius));
    const startAngle = normalizeNumber(entity.geometry?.startAngle);
    const endAngle = normalizeNumber(entity.geometry?.endAngle);
    const angles = [startAngle, endAngle];
    const min = Math.min(startAngle, endAngle);
    const max = Math.max(startAngle, endAngle);
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2].forEach((angle) => {
      if (angle >= min && angle <= max) {
        angles.push(angle);
      }
    });
    const points = angles.map((angle) => ({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    }));
    return {
      minX: Math.min(...points.map((point) => point.x)),
      minY: Math.min(...points.map((point) => point.y)),
      maxX: Math.max(...points.map((point) => point.x)),
      maxY: Math.max(...points.map((point) => point.y)),
    };
  }

  if (entity.type === "text") {
    const insertionPoint = normalizeCadPoint(entity.geometry?.insertionPoint);
    const content = String(entity.geometry?.content || "");
    const height = Math.max(0.1, normalizeNumber(entity.geometry?.height, 10));
    const width = Math.max(height, content.length * height * 0.62);
    return {
      minX: insertionPoint.x,
      minY: insertionPoint.y - height * 0.25,
      maxX: insertionPoint.x + width,
      maxY: insertionPoint.y + height,
    };
  }

  return null;
}

export function getSafeNexusCadProjectBounds(project = {}) {
  const bounds = (project.entities || [])
    .filter((entity) => isCadEntityVisible(project, entity))
    .map(getCadEntityBounds)
    .filter(Boolean);
  if (!bounds.length) {
    return { minX: -100, minY: -100, maxX: 100, maxY: 100 };
  }
  return bounds.reduce((result, item) => ({
    minX: Math.min(result.minX, item.minX),
    minY: Math.min(result.minY, item.minY),
    maxX: Math.max(result.maxX, item.maxX),
    maxY: Math.max(result.maxY, item.maxY),
  }), { ...bounds[0] });
}

export function hitTestCadEntity(entity = {}, point = {}, tolerance = 6) {
  if (entity.type === "line") {
    return distancePointToCadSegment(point, entity.geometry?.start, entity.geometry?.end) <= tolerance;
  }
  if (entity.type === "polyline") {
    const points = Array.isArray(entity.geometry?.points) ? entity.geometry.points : [];
    const segmentCount = entity.geometry?.closed ? points.length : Math.max(0, points.length - 1);
    for (let index = 0; index < segmentCount; index += 1) {
      if (distancePointToCadSegment(point, points[index], points[(index + 1) % points.length]) <= tolerance) {
        return true;
      }
    }
  }
  if (entity.type === "circle") {
    const center = normalizeCadPoint(entity.geometry?.center);
    const radius = Math.max(0, normalizeNumber(entity.geometry?.radius));
    return Math.abs(distanceBetweenCadPoints(point, center) - radius) <= tolerance
      || distanceBetweenCadPoints(point, center) <= tolerance;
  }
  if (entity.type === "arc") {
    const center = normalizeCadPoint(entity.geometry?.center);
    const radius = Math.max(0, normalizeNumber(entity.geometry?.radius));
    return Math.abs(distanceBetweenCadPoints(point, center) - radius) <= tolerance;
  }
  if (entity.type === "text") {
    const bounds = getCadEntityBounds(entity);
    return bounds
      && point.x >= bounds.minX - tolerance
      && point.x <= bounds.maxX + tolerance
      && point.y >= bounds.minY - tolerance
      && point.y <= bounds.maxY + tolerance;
  }
  return false;
}

export function hitTestSafeNexusCadProject(project = {}, point = {}, tolerance = 6) {
  const entities = [...(project.entities || [])].reverse();
  return entities.find((entity) => isCadEntityVisible(project, entity) && hitTestCadEntity(entity, point, tolerance)) || null;
}
