import { normalizeCadPoint } from "./safeNexusCadModel.js";

export class CadPoint {
  constructor(x = 0, y = 0) {
    const point = typeof x === "object" ? normalizeCadPoint(x) : normalizeCadPoint({ x, y });
    this.x = point.x;
    this.y = point.y;
  }

  translate(dx = 0, dy = 0) {
    return new CadPoint(this.x + dx, this.y + dy);
  }

  toJSON() {
    return { x: this.x, y: this.y };
  }
}
