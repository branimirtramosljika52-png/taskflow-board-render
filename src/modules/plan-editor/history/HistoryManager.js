export class HistoryManager {
  constructor(limit = 100) {
    this.limit = Math.max(1, Number(limit || 100));
    this.undoStack = [];
    this.redoStack = [];
  }

  execute(command, document) {
    const next = command.execute(document);
    this.undoStack.push(command);
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    return next;
  }

  undo(document) {
    const command = this.undoStack.pop();
    if (!command) {
      return document;
    }
    this.redoStack.push(command);
    return command.undo(document);
  }

  redo(document) {
    const command = this.redoStack.pop();
    if (!command) {
      return document;
    }
    this.undoStack.push(command);
    return command.execute(document);
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }
}
