export function createEmptyBounds() {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

export function boundsFromPoints(points = []) {
  const bounds = createEmptyBounds();
  points.forEach((point) => expandBounds(bounds, point));
  return Number.isFinite(bounds.minX) ? bounds : null;
}

export function expandBounds(bounds, point = {}) {
  bounds.minX = Math.min(bounds.minX, Number(point.x || 0));
  bounds.minY = Math.min(bounds.minY, Number(point.y || 0));
  bounds.maxX = Math.max(bounds.maxX, Number(point.x || 0));
  bounds.maxY = Math.max(bounds.maxY, Number(point.y || 0));
  return bounds;
}

export function padBounds(bounds, padding = 0) {
  if (!bounds) {
    return null;
  }
  return {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding,
  };
}

export function boundsIntersect(a, b) {
  if (!a || !b) {
    return false;
  }
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

export function boundsContainPoint(bounds, point = {}) {
  if (!bounds) {
    return false;
  }
  const x = Number(point.x || 0);
  const y = Number(point.y || 0);
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

export function boundsFromCenterRadius(center = {}, radius = 0) {
  const r = Math.abs(Number(radius || 0));
  return {
    minX: Number(center.x || 0) - r,
    minY: Number(center.y || 0) - r,
    maxX: Number(center.x || 0) + r,
    maxY: Number(center.y || 0) + r,
  };
}
