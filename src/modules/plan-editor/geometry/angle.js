export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export function angleBetweenPoints(start = {}, end = {}) {
  return Math.atan2(Number(end.y || 0) - Number(start.y || 0), Number(end.x || 0) - Number(start.x || 0));
}

export function normalizeAngleRadians(angle = 0) {
  const tau = Math.PI * 2;
  return ((Number(angle || 0) % tau) + tau) % tau;
}

export function constrainToOrtho(base = {}, target = {}) {
  const dx = Number(target.x || 0) - Number(base.x || 0);
  const dy = Number(target.y || 0) - Number(base.y || 0);
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: Number(base.x || 0) + dx, y: Number(base.y || 0) };
  }
  return { x: Number(base.x || 0), y: Number(base.y || 0) + dy };
}

export function constrainToPolar(base = {}, target = {}, incrementsDeg = [30, 45, 60, 90]) {
  const dx = Number(target.x || 0) - Number(base.x || 0);
  const dy = Number(target.y || 0) - Number(base.y || 0);
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length <= Number.EPSILON) {
    return { x: Number(base.x || 0), y: Number(base.y || 0) };
  }
  const rawAngle = Math.atan2(dy, dx) * RAD_TO_DEG;
  const smallestIncrement = Math.min(...incrementsDeg.map((value) => Math.abs(Number(value))).filter(Boolean), 90);
  const snappedAngle = Math.round(rawAngle / smallestIncrement) * smallestIncrement * DEG_TO_RAD;
  return {
    x: Number(base.x || 0) + Math.cos(snappedAngle) * length,
    y: Number(base.y || 0) + Math.sin(snappedAngle) * length,
  };
}

export function pointFromAngle(center = {}, radius = 0, angleRadians = 0) {
  return {
    x: Number(center.x || 0) + Math.cos(angleRadians) * Number(radius || 0),
    y: Number(center.y || 0) + Math.sin(angleRadians) * Number(radius || 0),
  };
}
