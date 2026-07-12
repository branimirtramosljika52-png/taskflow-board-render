import { CadTool } from "./CadTool.js";

export const TOOL_NAMES = Object.freeze([
  "select",
  "pan",
  "line",
  "polyline",
  "circle",
  "arc",
  "text",
  "move",
  "copy",
  "delete",
]);

export function createToolLifecycle(name = "select", handlers = {}) {
  const tool = new CadTool(name);
  for (const method of ["activate", "pointerDown", "pointerMove", "pointerUp", "keyDown", "cancel", "complete", "deactivate"]) {
    tool[method] = typeof handlers[method] === "function" ? handlers[method] : () => {};
  }
  return tool;
}
