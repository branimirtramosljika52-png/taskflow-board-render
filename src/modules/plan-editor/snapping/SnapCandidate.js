export const SNAP_PRIORITIES = Object.freeze({
  endpoint: 10,
  intersection: 20,
  midpoint: 30,
  center: 40,
  grid: 50,
  nearest: 60,
});

export function createSnapCandidate(type, point, distancePx, entityId = "") {
  return {
    type,
    point,
    entityId,
    distancePx,
    priority: SNAP_PRIORITIES[type] ?? 100,
  };
}
