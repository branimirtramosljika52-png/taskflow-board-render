import { CadImportAdapter } from "./CadImportAdapter.js";

export class ImageAiImportAdapter extends CadImportAdapter {
  supports(file = {}) {
    return /^image\//i.test(String(file.type || ""));
  }

  async import() {
    throw new Error("Image AI CAD import is planned for a later milestone.");
  }
}
