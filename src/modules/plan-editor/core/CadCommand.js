export class CadCommand {
  constructor(label = "Command") {
    this.label = label;
  }

  execute(document) {
    return document;
  }

  undo(document) {
    return document;
  }
}
