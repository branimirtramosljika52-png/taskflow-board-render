import { getCadEntityBounds, getCadEntityGripPoints, normalizeCadEntity } from "../core/safeNexusCadModel.js";

export class CadEntity {
  constructor(data = {}) {
    this.data = normalizeCadEntity(data);
  }

  get id() {
    return this.data.id;
  }

  get type() {
    return this.data.type;
  }

  getBounds() {
    return getCadEntityBounds(this.data);
  }

  getGripPoints() {
    return getCadEntityGripPoints(this.data);
  }

  getSnapPoints() {
    return this.getGripPoints().map((grip) => ({
      type: grip.role,
      point: grip.point,
      entityId: this.id,
    }));
  }

  translate(dx = 0, dy = 0) {
    return new CadEntity(translateEntityData(this.data, dx, dy));
  }

  rotate(_center = {}, _angleRadians = 0) {
    return this.clone();
  }

  clone(overrides = {}) {
    return new CadEntity({ ...structuredCloneEntity(this.data), ...overrides });
  }

  toJSON() {
    return structuredCloneEntity(this.data);
  }

  static deserialize(data = {}) {
    return new CadEntity(data);
  }
}

export function structuredCloneEntity(entity = {}) {
  return JSON.parse(JSON.stringify(entity));
}

export function translatePoint(point = {}, dx = 0, dy = 0) {
  return { x: Number(point.x || 0) + dx, y: Number(point.y || 0) + dy };
}

export function rotatePoint(point = {}, center = {}, angleRadians = 0) {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const x = Number(point.x || 0) - Number(center.x || 0);
  const y = Number(point.y || 0) - Number(center.y || 0);
  return {
    x: Number(center.x || 0) + x * cos - y * sin,
    y: Number(center.y || 0) + x * sin + y * cos,
  };
}

export function translateEntityData(entity = {}, dx = 0, dy = 0) {
  const next = structuredCloneEntity(entity);
  if (next.type === "line") {
    next.geometry.start = translatePoint(next.geometry.start, dx, dy);
    next.geometry.end = translatePoint(next.geometry.end, dx, dy);
  } else if (next.type === "polyline") {
    next.geometry.points = (next.geometry.points || []).map((point) => translatePoint(point, dx, dy));
  } else if (next.type === "circle" || next.type === "arc") {
    next.geometry.center = translatePoint(next.geometry.center, dx, dy);
  } else if (next.type === "text") {
    next.geometry.insertionPoint = translatePoint(next.geometry.insertionPoint, dx, dy);
  }
  next.updatedAt = new Date().toISOString();
  return next;
}
