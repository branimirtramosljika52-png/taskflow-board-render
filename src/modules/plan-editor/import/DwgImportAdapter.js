import { CadImportAdapter } from "./CadImportAdapter.js";

export class DwgImportAdapter extends CadImportAdapter {
  constructor({ enabled = String(globalThis.process?.env?.CAD_DWG_IMPORT_ENABLED || "false") === "true" } = {}) {
    super();
    this.enabled = enabled;
  }

  supports(file = {}) {
    return String(file.name || "").toLowerCase().endsWith(".dwg");
  }

  async import() {
    if (!this.enabled) {
      throw new Error("DWG import is disabled. Set CAD_DWG_IMPORT_ENABLED=true after a licensed backend parser is configured.");
    }
    throw new Error("DWG import adapter is intentionally isolated and has no production parser in Milestone 2.");
  }
}
