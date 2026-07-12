import { CadCommand } from "../../core/CadCommand.js";

export class AddEntityCommand extends CadCommand {
  constructor(entity) {
    super("Add entity");
    this.entity = entity;
  }

  execute(document) {
    return document.addEntity(this.entity);
  }

  undo(document) {
    return document.deleteEntities([this.entity.id]);
  }
}
