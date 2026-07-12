import { CadImportAdapter } from "./CadImportAdapter.js";

export class PdfImportAdapter extends CadImportAdapter {
  supports(file = {}) {
    return String(file.name || "").toLowerCase().endsWith(".pdf") || String(file.type || "").includes("pdf");
  }

  async import() {
    throw new Error("PDF CAD import is planned for a later milestone.");
  }
}
