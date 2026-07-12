import {
  cloneSafeNexusCadProject,
  createSafeNexusCadProject,
  getCadLayerById,
  normalizeSafeNexusCadProject,
} from "./safeNexusCadModel.js";
import { createCadEntity } from "../entities/entityFactory.js";
import { translateEntityData } from "../entities/CadEntity.js";

export class CadDocument {
  constructor(project = createSafeNexusCadProject()) {
    this.project = normalizeSafeNexusCadProject(project);
  }

  static empty(overrides = {}) {
    return new CadDocument(createSafeNexusCadProject(overrides));
  }

  clone() {
    return new CadDocument(cloneSafeNexusCadProject(this.project));
  }

  entities() {
    return this.project.entities.map(createCadEntity);
  }

  getEntity(entityId = "") {
    const entity = this.project.entities.find((candidate) => candidate.id === entityId);
    return entity ? createCadEntity(entity) : null;
  }

  isLayerLocked(layerId = "") {
    return getCadLayerById(this.project, layerId)?.locked === true;
  }

  addEntity(entity = {}) {
    return this.withProject({
      ...this.project,
      entities: [...this.project.entities, createCadEntity(entity).toJSON()],
    });
  }

  updateEntity(entityId = "", updater = (entity) => entity) {
    return this.withProject({
      ...this.project,
      entities: this.project.entities.map((entity) => {
        if (entity.id !== entityId) {
          return entity;
        }
        const updated = updater(createCadEntity(entity));
        return createCadEntity(updated?.toJSON ? updated.toJSON() : updated).toJSON();
      }),
    });
  }

  replaceEntity(entity = {}) {
    const normalized = createCadEntity(entity).toJSON();
    return this.withProject({
      ...this.project,
      entities: this.project.entities.map((candidate) => (candidate.id === normalized.id ? normalized : candidate)),
    });
  }

  deleteEntities(entityIds = []) {
    const ids = new Set(entityIds);
    return this.withProject({
      ...this.project,
      entities: this.project.entities.filter((entity) => !ids.has(entity.id)),
    });
  }

  translateEntities(entityIds = [], dx = 0, dy = 0, copy = false) {
    const ids = new Set(entityIds);
    const translated = this.project.entities
      .filter((entity) => ids.has(entity.id))
      .map((entity) => {
        const next = translateEntityData(entity, dx, dy);
        if (copy) {
          next.id = `${next.id}_copy_${Date.now().toString(36)}`;
          next.sourceEntityId = entity.sourceEntityId || entity.id;
        }
        return next;
      });
    const entities = copy
      ? [...this.project.entities, ...translated]
      : this.project.entities.map((entity) => ids.has(entity.id) ? translated.shift() : entity);
    return this.withProject({ ...this.project, entities });
  }

  withProject(project = {}) {
    const now = new Date().toISOString();
    return new CadDocument(normalizeSafeNexusCadProject({
      ...project,
      updatedAt: now,
      metadata: {
        ...(project.metadata || {}),
        updatedAt: now,
      },
    }));
  }

  toJSON() {
    return cloneSafeNexusCadProject(this.project);
  }
}
