import { CadImportAdapter } from "./CadImportAdapter.js";
import { parseSafeNexusCadDxf } from "../adapters/dxfAdapter.js";

export class SafeNexusDxfImportAdapter extends CadImportAdapter {
  supports(file = {}) {
    return String(file.name || "").toLowerCase().endsWith(".dxf") || String(file.type || "").includes("dxf");
  }

  async import(file = {}) {
    if (!this.supports(file)) {
      throw new Error("SafeNexusDxfImportAdapter supports only DXF files.");
    }
    const text = file.text || new TextDecoder().decode(file.buffer || new ArrayBuffer(0));
    return parseSafeNexusCadDxf(text, {
      fileName: file.name || "import.dxf",
      sourceFile: {
        fileId: file.fileId || "",
        type: "dxf",
        originalName: file.name || "import.dxf",
      },
    });
  }
}
