import { UploadedCadFile } from "./CadImportAdapter.js";
import { SafeNexusDxfImportAdapter } from "./SafeNexusDxfImportAdapter.js";
import { DwgImportAdapter } from "./DwgImportAdapter.js";
import { ImageAiImportAdapter } from "./ImageAiImportAdapter.js";
import { PdfImportAdapter } from "./PdfImportAdapter.js";

export class CadImportService {
  constructor(adapters = [
    new SafeNexusDxfImportAdapter(),
    new DwgImportAdapter(),
    new ImageAiImportAdapter(),
    new PdfImportAdapter(),
  ]) {
    this.adapters = adapters;
  }

  async import(fileInput = {}) {
    const file = fileInput instanceof UploadedCadFile ? fileInput : new UploadedCadFile(fileInput);
    const adapter = this.adapters.find((candidate) => candidate.supports(file));
    if (!adapter) {
      throw new Error("Unsupported CAD import file.");
    }
    return adapter.import(file);
  }
}
