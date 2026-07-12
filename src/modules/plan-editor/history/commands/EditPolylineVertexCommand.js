import { CadCommand } from "../../core/CadCommand.js";

export class EditPolylineVertexCommand extends CadCommand {
  constructor(beforeEntity, afterEntity) {
    super("Edit polyline vertex");
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
