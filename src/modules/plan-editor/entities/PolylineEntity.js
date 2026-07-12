import { CadEntity, rotatePoint, structuredCloneEntity, translateEntityData } from "./CadEntity.js";

export class PolylineEntity extends CadEntity {
  moveVertex(index = 0, point = {}) {
    const next = structuredCloneEntity(this.data);
    if (!next.geometry.points[index]) {
      return this.clone();
    }
    next.geometry.points[index] = { x: Number(point.x || 0), y: Number(point.y || 0) };
    next.updatedAt = new Date().toISOString();
    return new PolylineEntity(next);
  }

  addVertexAfter(segmentIndex = 0, point = {}) {
    const next = structuredCloneEntity(this.data);
    next.geometry.points.splice(segmentIndex + 1, 0, { x: Number(point.x || 0), y: Number(point.y || 0) });
    next.updatedAt = new Date().toISOString();
    return new PolylineEntity(next);
  }

  deleteVertex(index = 0) {
    const next = structuredCloneEntity(this.data);
    if ((next.geometry.points || []).length <= 2) {
      return this.clone();
    }
    next.geometry.points.splice(index, 1);
    next.updatedAt = new Date().toISOString();
    return new PolylineEntity(next);
  }

  translate(dx = 0, dy = 0) {
    return new PolylineEntity(translateEntityData(this.data, dx, dy));
  }

  rotate(center = {}, angleRadians = 0) {
    const next = structuredCloneEntity(this.data);
    next.geometry.points = (next.geometry.points || []).map((point) => rotatePoint(point, center, angleRadians));
    next.updatedAt = new Date().toISOString();
    return new PolylineEntity(next);
  }

  clone(overrides = {}) {
    return new PolylineEntity({ ...structuredCloneEntity(this.data), ...overrides });
  }

  static deserialize(data = {}) {
    return new PolylineEntity(data);
  }
}
