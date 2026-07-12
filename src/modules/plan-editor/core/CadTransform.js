import { constrainToOrtho, constrainToPolar } from "../geometry/angle.js";

export function translateTransform(dx = 0, dy = 0) {
  return { type: "translate", dx: Number(dx || 0), dy: Number(dy || 0) };
}

export function rotateTransform(center = {}, angleRadians = 0) {
  return { type: "rotate", center, angleRadians: Number(angleRadians || 0) };
}

export { constrainToOrtho, constrainToPolar };
