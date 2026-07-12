import { CadEntity, rotatePoint, structuredCloneEntity, translateEntityData } from "./CadEntity.js";
import { distance } from "../geometry/distance.js";

export class LineEntity extends CadEntity {
  midpoint() {
    const { start, end } = this.data.geometry;
    return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  }

  length() {
    return distance(this.data.geometry.start, this.data.geometry.end);
  }

  moveGrip(gripId = "end", target = {}) {
    const next = structuredCloneEntity(this.data);
    if (gripId === "start") {
      next.geometry.start = { x: Number(target.x || 0), y: Number(target.y || 0) };
    } else if (gripId === "middle") {
      const mid = this.midpoint();
      const dx = Number(target.x || 0) - mid.x;
      const dy = Number(target.y || 0) - mid.y;
      return new LineEntity(translateEntityData(next, dx, dy));
    } else {
      next.geometry.end = { x: Number(target.x || 0), y: Number(target.y || 0) };
    }
    next.updatedAt = new Date().toISOString();
    return new LineEntity(next);
  }

  translate(dx = 0, dy = 0) {
    return new LineEntity(translateEntityData(this.data, dx, dy));
  }

  rotate(center = {}, angleRadians = 0) {
    const next = structuredCloneEntity(this.data);
    next.geometry.start = rotatePoint(next.geometry.start, center, angleRadians);
    next.geometry.end = rotatePoint(next.geometry.end, center, angleRadians);
    next.updatedAt = new Date().toISOString();
    return new LineEntity(next);
  }

  clone(overrides = {}) {
    return new LineEntity({ ...structuredCloneEntity(this.data), ...overrides });
  }

  static deserialize(data = {}) {
    return new LineEntity(data);
  }
}
