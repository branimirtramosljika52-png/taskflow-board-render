import { boundsIntersect, padBounds } from "../geometry/boundingBox.js";

export class CadBounds {
  constructor(bounds = {}) {
    this.minX = Number(bounds.minX || 0);
    this.minY = Number(bounds.minY || 0);
    this.maxX = Number(bounds.maxX || 0);
    this.maxY = Number(bounds.maxY || 0);
  }

  intersects(other) {
    return boundsIntersect(this, other);
  }

  pad(amount = 0) {
    return new CadBounds(padBounds(this, amount));
  }

  toJSON() {
    return { minX: this.minX, minY: this.minY, maxX: this.maxX, maxY: this.maxY };
  }
}
