import { boundsIntersect, padBounds } from "../geometry/boundingBox.js";
import { getCadEntityBounds } from "../core/safeNexusCadModel.js";

export class SpatialIndex {
  constructor(cellSize = 512) {
    this.cellSize = Math.max(1, Number(cellSize || 512));
    this.records = new Map();
    this.cells = new Map();
  }

  clear() {
    this.records.clear();
    this.cells.clear();
  }

  rebuild(entities = []) {
    this.clear();
    entities.forEach((entity) => this.insert(entity.id, getCadEntityBounds(entity), entity));
  }

  insert(entityId = "", bounds = null, entity = null) {
    if (!entityId || !bounds) {
      return;
    }
    this.remove(entityId);
    const keys = this.keysForBounds(bounds);
    this.records.set(entityId, { id: entityId, bounds: { ...bounds }, keys, entity });
    keys.forEach((key) => {
      if (!this.cells.has(key)) {
        this.cells.set(key, new Set());
      }
      this.cells.get(key).add(entityId);
    });
  }

  update(entityId = "", bounds = null, entity = null) {
    this.insert(entityId, bounds, entity);
  }

  remove(entityId = "") {
    const record = this.records.get(entityId);
    if (!record) {
      return;
    }
    record.keys.forEach((key) => {
      const cell = this.cells.get(key);
      cell?.delete(entityId);
      if (cell?.size === 0) {
        this.cells.delete(key);
      }
    });
    this.records.delete(entityId);
  }

  queryViewport(bounds = {}) {
    return this.queryBounds(bounds);
  }

  queryRadius(point = {}, radius = 0) {
    const r = Math.max(0, Number(radius || 0));
    return this.queryBounds({
      minX: Number(point.x || 0) - r,
      minY: Number(point.y || 0) - r,
      maxX: Number(point.x || 0) + r,
      maxY: Number(point.y || 0) + r,
    });
  }

  queryBounds(bounds = {}) {
    const padded = padBounds(bounds, 0);
    const ids = new Set();
    this.keysForBounds(padded).forEach((key) => {
      this.cells.get(key)?.forEach((id) => ids.add(id));
    });
    return [...ids]
      .map((id) => this.records.get(id))
      .filter((record) => record && boundsIntersect(record.bounds, padded))
      .map((record) => record.entity ? { ...record.entity, __bounds: record.bounds } : record.id);
  }

  keysForBounds(bounds = {}) {
    if (!bounds) {
      return [];
    }
    const minX = Math.floor(Number(bounds.minX || 0) / this.cellSize);
    const minY = Math.floor(Number(bounds.minY || 0) / this.cellSize);
    const maxX = Math.floor(Number(bounds.maxX || 0) / this.cellSize);
    const maxY = Math.floor(Number(bounds.maxY || 0) / this.cellSize);
    const keys = [];
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        keys.push(`${x}:${y}`);
      }
    }
    return keys;
  }
}
