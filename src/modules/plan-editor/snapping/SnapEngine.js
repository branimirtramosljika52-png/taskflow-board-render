import { distance, distancePointToSegment } from "../geometry/distance.js";
import { entityLineSegments, lineLineIntersection } from "../geometry/intersection.js";
import { projectPointToSegment } from "../geometry/projection.js";
import { getCadEntityGripPoints, getCadLayerById } from "../core/safeNexusCadModel.js";
import { createSnapCandidate } from "./SnapCandidate.js";
import { normalizeSnapSettings } from "./SnapSettings.js";

function modelTolerance(settings, viewportScale = 1) {
  return Number(settings.tolerancePx) * Number(viewportScale || 1);
}

function pointDistancePx(a, b, viewportScale = 1) {
  return distance(a, b) / Number(viewportScale || 1);
}

function nearestOnEntity(entity = {}, point = {}) {
  if (entity.type === "line") {
    return projectPointToSegment(point, entity.geometry.start, entity.geometry.end).point;
  }
  if (entity.type === "polyline") {
    const segments = entityLineSegments(entity);
    let best = null;
    segments.forEach((segment) => {
      const projected = projectPointToSegment(point, segment.start, segment.end).point;
      const candidateDistance = distance(point, projected);
      if (!best || candidateDistance < best.distance) {
        best = { point: projected, distance: candidateDistance };
      }
    });
    return best?.point || null;
  }
  if (entity.type === "circle") {
    const center = entity.geometry.center;
    const angle = Math.atan2(Number(point.y || 0) - center.y, Number(point.x || 0) - center.x);
    return {
      x: center.x + Math.cos(angle) * entity.geometry.radius,
      y: center.y + Math.sin(angle) * entity.geometry.radius,
    };
  }
  return null;
}

export class SnapEngine {
  constructor(settings = {}) {
    this.settings = normalizeSnapSettings(settings);
  }

  setSettings(settings = {}) {
    this.settings = normalizeSnapSettings({ ...this.settings, ...settings });
  }

  snap(project, spatialIndex, point, viewportScale = 1) {
    const settings = normalizeSnapSettings(this.settings);
    if (!settings.enabled) {
      return null;
    }
    const tolerance = modelTolerance(settings, viewportScale);
    const candidates = [];
    const nearby = spatialIndex.queryRadius(point, tolerance).filter((entity) => {
      const layer = getCadLayerById(project, entity.layerId);
      return layer?.visible !== false;
    });

    nearby.forEach((entity) => {
      getCadEntityGripPoints(entity).forEach((grip) => {
        const type = grip.role === "vertex" ? "endpoint" : grip.role;
        if ((type === "endpoint" && !settings.endpoint)
          || (type === "midpoint" && !settings.midpoint)
          || (type === "center" && !settings.center)) {
          return;
        }
        const candidateDistancePx = pointDistancePx(point, grip.point, viewportScale);
        if (candidateDistancePx <= settings.tolerancePx) {
          candidates.push(createSnapCandidate(type, grip.point, candidateDistancePx, entity.id));
        }
      });

      if (settings.nearest) {
        const nearest = nearestOnEntity(entity, point);
        if (nearest) {
          const candidateDistancePx = pointDistancePx(point, nearest, viewportScale);
          if (candidateDistancePx <= settings.tolerancePx) {
            candidates.push(createSnapCandidate("nearest", nearest, candidateDistancePx, entity.id));
          }
        }
      }
    });

    if (settings.intersection) {
      const segments = nearby.flatMap(entityLineSegments);
      for (let a = 0; a < segments.length; a += 1) {
        for (let b = a + 1; b < segments.length; b += 1) {
          if (segments[a].entityId === segments[b].entityId) {
            continue;
          }
          const intersection = lineLineIntersection(segments[a].start, segments[a].end, segments[b].start, segments[b].end);
          if (!intersection) {
            continue;
          }
          const candidateDistancePx = pointDistancePx(point, intersection, viewportScale);
          if (candidateDistancePx <= settings.tolerancePx) {
            candidates.push(createSnapCandidate("intersection", intersection, candidateDistancePx));
          }
        }
      }
    }

    if (settings.grid) {
      const gridPoint = snapPointToGrid(point, settings.gridSpacing);
      const candidateDistancePx = pointDistancePx(point, gridPoint, viewportScale);
      if (candidateDistancePx <= settings.tolerancePx) {
        candidates.push(createSnapCandidate("grid", gridPoint, candidateDistancePx));
      }
    }

    return candidates.sort((a, b) => a.priority - b.priority || a.distancePx - b.distancePx)[0] || null;
  }
}

export function snapPointToGrid(point = {}, spacing = 25) {
  const grid = Math.max(0.1, Number(spacing || 25));
  return {
    x: Math.round(Number(point.x || 0) / grid) * grid,
    y: Math.round(Number(point.y || 0) / grid) * grid,
  };
}
