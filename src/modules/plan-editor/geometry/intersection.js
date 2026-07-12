export function lineLineIntersection(aStart = {}, aEnd = {}, bStart = {}, bEnd = {}, tolerance = 1e-9) {
  const x1 = Number(aStart.x || 0);
  const y1 = Number(aStart.y || 0);
  const x2 = Number(aEnd.x || 0);
  const y2 = Number(aEnd.y || 0);
  const x3 = Number(bStart.x || 0);
  const y3 = Number(bStart.y || 0);
  const x4 = Number(bEnd.x || 0);
  const y4 = Number(bEnd.y || 0);
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denominator) <= tolerance) {
    return null;
  }
  const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denominator;
  const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denominator;
  const within = (value, start, end) => value >= Math.min(start, end) - tolerance && value <= Math.max(start, end) + tolerance;
  if (!within(px, x1, x2) || !within(py, y1, y2) || !within(px, x3, x4) || !within(py, y3, y4)) {
    return null;
  }
  return { x: Object.is(px, -0) ? 0 : px, y: Object.is(py, -0) ? 0 : py };
}

export function entityLineSegments(entity = {}) {
  if (entity.type === "line") {
    return [{ start: entity.geometry.start, end: entity.geometry.end, entityId: entity.id }];
  }
  if (entity.type === "polyline") {
    const points = entity.geometry.points || entity.geometry.vertices || [];
    const segmentCount = entity.geometry.closed ? points.length : Math.max(0, points.length - 1);
    const segments = [];
    for (let index = 0; index < segmentCount; index += 1) {
      segments.push({ start: points[index], end: points[(index + 1) % points.length], entityId: entity.id });
    }
    return segments;
  }
  return [];
}
