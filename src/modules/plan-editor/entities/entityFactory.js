import { CadEntity } from "./CadEntity.js";
import { LineEntity } from "./LineEntity.js";
import { PolylineEntity } from "./PolylineEntity.js";
import { CircleEntity } from "./CircleEntity.js";
import { ArcEntity } from "./ArcEntity.js";
import { TextEntity } from "./TextEntity.js";

export function createCadEntity(data = {}) {
  switch (String(data.type || "").toLowerCase()) {
    case "line":
      return new LineEntity(data);
    case "polyline":
      return new PolylineEntity(data);
    case "circle":
      return new CircleEntity(data);
    case "arc":
      return new ArcEntity(data);
    case "text":
      return new TextEntity(data);
    default:
      return new CadEntity(data);
  }
}
