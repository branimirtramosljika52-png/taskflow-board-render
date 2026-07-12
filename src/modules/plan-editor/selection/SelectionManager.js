import { getCadLayerById, hitTestCadEntity } from "../core/safeNexusCadModel.js";

export class SelectionManager {
  constructor() {
    this.selectedIds = new Set();
  }

  clear() {
    this.selectedIds.clear();
  }

  set(ids = []) {
    this.selectedIds = new Set(ids);
  }

  add(id = "") {
    if (id) {
      this.selectedIds.add(id);
    }
  }

  remove(id = "") {
    this.selectedIds.delete(id);
  }

  toggleHit(project, spatialIndex, point, tolerance, modifiers = {}) {
    const hit = this.hitTest(project, spatialIndex, point, tolerance);
    if (!hit) {
      if (!modifiers.shiftKey && !modifiers.ctrlKey) {
        this.clear();
      }
      return null;
    }
    if (modifiers.ctrlKey) {
      this.remove(hit.id);
    } else if (modifiers.shiftKey) {
      this.add(hit.id);
    } else {
      this.set([hit.id]);
    }
    return hit;
  }

  hitTest(project, spatialIndex, point, tolerance) {
    const candidates = spatialIndex.queryRadius(point, tolerance).reverse();
    return candidates.find((entity) => {
      const layer = getCadLayerById(project, entity.layerId);
      return layer?.visible !== false && layer?.locked !== true && hitTestCadEntity(entity, point, tolerance);
    }) || null;
  }

  selectBox(project, spatialIndex, bounds, crossing = false, modifiers = {}) {
    const candidates = spatialIndex.queryBounds(bounds).filter((entity) => {
      const layer = getCadLayerById(project, entity.layerId);
      if (layer?.visible === false || layer?.locked === true) {
        return false;
      }
      const entityBounds = entity.__bounds;
      if (!entityBounds) {
        return false;
      }
      if (crossing) {
        return true;
      }
      return entityBounds.minX >= bounds.minX
        && entityBounds.maxX <= bounds.maxX
        && entityBounds.minY >= bounds.minY
        && entityBounds.maxY <= bounds.maxY;
    }).map((entity) => entity.id);

    if (modifiers.ctrlKey) {
      candidates.forEach((id) => this.remove(id));
    } else if (modifiers.shiftKey) {
      candidates.forEach((id) => this.add(id));
    } else {
      this.set(candidates);
    }
    return [...this.selectedIds];
  }

  toArray() {
    return [...this.selectedIds];
  }
}
