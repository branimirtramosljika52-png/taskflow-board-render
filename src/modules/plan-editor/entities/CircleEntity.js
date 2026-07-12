import { CadEntity, rotatePoint, structuredCloneEntity, translateEntityData } from "./CadEntity.js";
import { distance } from "../geometry/distance.js";

export class CircleEntity extends CadEntity {
  moveGrip(gripId = "center", target = {}) {
    const next = structuredCloneEntity(this.data);
    if (gripId === "center") {
      next.geometry.center = { x: Number(target.x || 0), y: Number(target.y || 0) };
    } else {
      next.geometry.radius = distance(next.geometry.center, target);
    }
    next.updatedAt = new Date().toISOString();
    return new CircleEntity(next);
  }

  translate(dx = 0, dy = 0) {
    return new CircleEntity(translateEntityData(this.data, dx, dy));
  }

  rotate(center = {}, angleRadians = 0) {
    const next = structuredCloneEntity(this.data);
    next.geometry.center = rotatePoint(next.geometry.center, center, angleRadians);
    next.updatedAt = new Date().toISOString();
    return new CircleEntity(next);
  }

  clone(overrides = {}) {
    return new CircleEntity({ ...structuredCloneEntity(this.data), ...overrides });
  }

  static deserialize(data = {}) {
    return new CircleEntity(data);
  }
}
