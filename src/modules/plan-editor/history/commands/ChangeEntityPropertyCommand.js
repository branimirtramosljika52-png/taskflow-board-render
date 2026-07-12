import { CadCommand } from "../../core/CadCommand.js";

export class ChangeEntityPropertyCommand extends CadCommand {
  constructor(beforeEntity, afterEntity) {
    super("Change entity property");
    this.beforeEntity = beforeEntity;
    this.afterEntity = afterEntity;
  }

  execute(document) {
    return document.replaceEntity(this.afterEntity);
  }

  undo(document) {
    return document.replaceEntity(this.beforeEntity);
  }
}
