import { CadEntity, rotatePoint, structuredCloneEntity, translateEntityData } from "./CadEntity.js";

export class TextEntity extends CadEntity {
  setHeight(height = 10) {
    const next = structuredCloneEntity(this.data);
    next.geometry.height = Math.max(0.1, Number(height || 10));
    next.updatedAt = new Date().toISOString();
    return new TextEntity(next);
  }

  translate(dx = 0, dy = 0) {
    return new TextEntity(translateEntityData(this.data, dx, dy));
  }

  rotate(center = {}, angleRadians = 0) {
    const next = structuredCloneEntity(this.data);
    next.geometry.insertionPoint = rotatePoint(next.geometry.insertionPoint, center, angleRadians);
    next.geometry.rotation += angleRadians;
    next.updatedAt = new Date().toISOString();
    return new TextEntity(next);
  }

  clone(overrides = {}) {
    return new TextEntity({ ...structuredCloneEntity(this.data), ...overrides });
  }

  static deserialize(data = {}) {
    return new TextEntity(data);
  }
}
