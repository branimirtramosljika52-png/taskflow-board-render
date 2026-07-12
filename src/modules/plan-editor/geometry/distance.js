export function squaredDistance(a = {}, b = {}) {
  const dx = Number(a.x || 0) - Number(b.x || 0);
  const dy = Number(a.y || 0) - Number(b.y || 0);
  return dx * dx + dy * dy;
}

export function distance(a = {}, b = {}) {
  return Math.sqrt(squaredDistance(a, b));
}

export function distancePointToSegment(point = {}, start = {}, end = {}) {
  const px = Number(point.x || 0);
  const py = Number(point.y || 0);
  const x1 = Number(start.x || 0);
  const y1 = Number(start.y || 0);
  const x2 = Number(end.x || 0);
  const y2 = Number(end.y || 0);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= Number.EPSILON) {
    return distance(point, start);
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return distance(point, { x: x1 + t * dx, y: y1 + t * dy });
}
