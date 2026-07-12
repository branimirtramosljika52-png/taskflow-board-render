import { CadCommand } from "../../core/CadCommand.js";
import { LineEntity } from "../../entities/LineEntity.js";

export class EditLineGripCommand extends CadCommand {
  constructor(beforeEntity, afterEntity) {
    super("Edit line grip");
    this.beforeEntity = beforeEntity;
    this.afterEntity = afterEntity;
  }

  execute(document) {
    return document.replaceEntity(new LineEntity(this.afterEntity).toJSON());
  }

  undo(document) {
    return document.replaceEntity(new LineEntity(this.beforeEntity).toJSON());
  }
}
