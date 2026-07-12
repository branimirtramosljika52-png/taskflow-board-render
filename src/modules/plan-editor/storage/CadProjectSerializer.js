import {
  SAFE_NEXUS_CAD_FORMAT_VERSION,
  parseSafeNexusCadJson,
  serializeSafeNexusCadProject,
  normalizeSafeNexusCadProject,
} from "../core/safeNexusCadModel.js";
import { validateSafeNexusCadProject } from "./CadProjectValidator.js";

export function migrateSafeNexusCadProject(project = {}) {
  const version = Number(project.version || 1);
  let next = { ...project };
  if (version < 2) {
    next = {
      ...next,
      version: 2,
      createdAt: next.createdAt || next.metadata?.createdAt || new Date().toISOString(),
      updatedAt: next.updatedAt || next.metadata?.updatedAt || new Date().toISOString(),
      revision: next.revision || "0",
    };
  }
  return normalizeSafeNexusCadProject({
    ...next,
    version: Math.max(SAFE_NEXUS_CAD_FORMAT_VERSION, Number(next.version || SAFE_NEXUS_CAD_FORMAT_VERSION)),
  });
}

export function serializeCadProject(project = {}) {
  return serializeSafeNexusCadProject(migrateSafeNexusCadProject(project));
}

export function parseCadProjectJson(jsonText = "") {
  const parsed = parseSafeNexusCadJson(jsonText);
  const migrated = migrateSafeNexusCadProject(parsed);
  const validation = validateSafeNexusCadProject(migrated);
  if (!validation.ok) {
    throw new Error(validation.errors.join("; "));
  }
  return validation.project;
}
