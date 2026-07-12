import { SAFE_NEXUS_CAD_SCHEMA, normalizeSafeNexusCadProject } from "../core/safeNexusCadModel.js";

export const SAFE_NEXUS_CAD_JSON_SCHEMA = Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://safe-nexus.org/schemas/safe-nexus-cad-v2.json",
  title: "SafeNexus CAD Project",
  type: "object",
  required: ["schema", "version", "id", "name", "units", "layers", "entities"],
  properties: {
    schema: { const: SAFE_NEXUS_CAD_SCHEMA },
    version: { type: "integer", minimum: 2 },
    id: { type: "string", minLength: 1 },
    name: { type: "string" },
    planType: { type: "string" },
    units: { type: "string" },
    scale: { type: "number" },
    sourceFile: { type: ["object", "null"] },
    layers: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "name", "visible", "locked", "printable"],
        properties: {
          id: { type: "string", minLength: 1 },
          name: { type: "string" },
          visible: { type: "boolean" },
          locked: { type: "boolean" },
          printable: { type: "boolean" },
          color: { type: "string" },
          lineType: { type: "string" },
          lineWidth: { type: "number" },
          opacity: { type: "number" },
          source: { type: "string" },
          sortOrder: { type: "number" },
        },
      },
    },
    entities: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "geometry", "layerId", "style", "properties", "updatedAt"],
        properties: {
          id: { type: "string", minLength: 1 },
          type: { enum: ["line", "polyline", "circle", "arc", "text", "unsupported"] },
          geometry: { type: "object" },
          layerId: { type: "string" },
          style: { type: "object" },
          properties: { type: "object" },
          sourceEntityId: { type: "string" },
          createdBy: { type: "string" },
          updatedAt: { type: "string" },
        },
      },
    },
    pageSetup: { type: "object" },
    titleBlock: { type: "object" },
    metadata: { type: "object" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    revision: { type: "string" },
  },
});

export function validateSafeNexusCadProject(project = {}) {
  const errors = [];
  if (project.schema && project.schema !== SAFE_NEXUS_CAD_SCHEMA) {
    errors.push(`Unsupported schema: ${project.schema}`);
  }
  if (!Array.isArray(project.layers)) {
    errors.push("layers must be an array");
  }
  if (!Array.isArray(project.entities)) {
    errors.push("entities must be an array");
  }
  (project.entities || []).forEach((entity, index) => {
    if (!entity.id) {
      errors.push(`entities[${index}].id is required`);
    }
    if (!["line", "polyline", "circle", "arc", "text", "unsupported"].includes(String(entity.type || "").toLowerCase())) {
      errors.push(`entities[${index}].type is unsupported`);
    }
  });
  return {
    ok: errors.length === 0,
    errors,
    project: normalizeSafeNexusCadProject(project),
  };
}
