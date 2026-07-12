import { CadEntity, rotatePoint, structuredCloneEntity, translateEntityData } from "./CadEntity.js";
import { angleBetweenPoints } from "../geometry/angle.js";
import { distance } from "../geometry/distance.js";

export class ArcEntity extends CadEntity {
  moveGrip(gripId = "center", target = {}) {
    const next = structuredCloneEntity(this.data);
    if (gripId === "center") {
      next.geometry.center = { x: Number(target.x || 0), y: Number(target.y || 0) };
    } else if (gripId === "start") {
      next.geometry.startAngle = angleBetweenPoints(next.geometry.center, target);
      next.geometry.radius = distance(next.geometry.center, target);
    } else if (gripId === "end") {
      next.geometry.endAngle = angleBetweenPoints(next.geometry.center, target);
      next.geometry.radius = distance(next.geometry.center, target);
    }
    next.updatedAt = new Date().toISOString();
    return new ArcEntity(next);
  }

  translate(dx = 0, dy = 0) {
    return new ArcEntity(translateEntityData(this.data, dx, dy));
  }

  rotate(center = {}, angleRadians = 0) {
    const next = structuredCloneEntity(this.data);
    next.geometry.center = rotatePoint(next.geometry.center, center, angleRadians);
    next.geometry.startAngle += angleRadians;
    next.geometry.endAngle += angleRadians;
    next.updatedAt = new Date().toISOString();
    return new ArcEntity(next);
  }

  clone(overrides = {}) {
    return new ArcEntity({ ...structuredCloneEntity(this.data), ...overrides });
  }

  static deserialize(data = {}) {
    return new ArcEntity(data);
  }
}
