export class UploadedCadFile {
  constructor({ name = "", type = "", buffer = null, text = "" } = {}) {
    this.name = name;
    this.type = type;
    this.buffer = buffer;
    this.text = text;
  }
}

export class CadImportAdapter {
  supports(_file) {
    return false;
  }

  async import(_file) {
    throw new Error("CAD import adapter is not implemented.");
  }
}
