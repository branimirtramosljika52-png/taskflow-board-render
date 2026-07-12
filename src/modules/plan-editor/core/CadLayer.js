import { normalizeCadLayer } from "./safeNexusCadModel.js";

export class CadLayer {
  constructor(data = {}) {
    this.data = normalizeCadLayer(data);
  }

  toJSON() {
    return { ...this.data };
  }
}
