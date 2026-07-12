import { CadCommand } from "../../core/CadCommand.js";

export class DeleteEntitiesCommand extends CadCommand {
  constructor(entities = []) {
    super("Delete entities");
    this.entities = entities.filter((entity) => entity && typeof entity === "object");
    this.entityIds = entities.map((entity) => typeof entity === "string" ? entity : entity?.id).filter(Boolean);
  }

  execute(document) {
    if (!this.entities.length) {
      const ids = new Set(this.entityIds);
      this.entities = document.project.entities.filter((entity) => ids.has(entity.id));
    }
    return document.deleteEntities(this.entityIds);
  }

  undo(document) {
    return this.entities.reduce((nextDocument, entity) => nextDocument.addEntity(entity), document);
  }
}
