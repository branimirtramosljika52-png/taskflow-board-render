import { CadCommand } from "../../core/CadCommand.js";

export class MoveEntitiesCommand extends CadCommand {
  constructor(entityIds = [], dx = 0, dy = 0, copy = false) {
    super(copy ? "Copy entities" : "Move entities");
    this.entityIds = [...entityIds];
    this.dx = Number(dx || 0);
    this.dy = Number(dy || 0);
    this.copy = copy;
    this.createdIds = [];
  }

  execute(document) {
    const next = document.translateEntities(this.entityIds, this.dx, this.dy, this.copy);
    if (this.copy) {
      const previousIds = new Set(document.project.entities.map((entity) => entity.id));
      this.createdIds = next.project.entities.filter((entity) => !previousIds.has(entity.id)).map((entity) => entity.id);
    }
    return next;
  }

  undo(document) {
    if (this.copy) {
      return document.deleteEntities(this.createdIds);
    }
    return document.translateEntities(this.entityIds, -this.dx, -this.dy, false);
  }
}
