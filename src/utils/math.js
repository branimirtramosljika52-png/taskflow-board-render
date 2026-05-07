export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
export const BUILDER_GRID_SIZE = 8;

export function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.max(min, Math.min(max, number));
}

export function snap(value, grid = BUILDER_GRID_SIZE) {
  const safeGrid = Math.max(1, Number(grid) || BUILDER_GRID_SIZE);
  return Math.round((Number(value) || 0) / safeGrid) * safeGrid;
}

export function rectFromLayout(layout = {}) {
  const x = Number(layout.x) || 0;
  const y = Number(layout.y) || 0;
  const width = Math.max(1, Number(layout.width) || 1);
  const height = Math.max(1, Number(layout.height) || 1);
  return {
    x,
    y,
    width,
    height,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  };
}

export function boundsFromRects(rects = []) {
  const safeRects = rects.filter(Boolean);
  if (safeRects.length === 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  const left = Math.min(...safeRects.map((rect) => rect.left));
  const top = Math.min(...safeRects.map((rect) => rect.top));
  const right = Math.max(...safeRects.map((rect) => rect.right));
  const bottom = Math.max(...safeRects.map((rect) => rect.bottom));
  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

export function getPointInPage(event, pageElement, zoom = 1) {
  const rect = pageElement.getBoundingClientRect();
  const safeZoom = Number(zoom) || 1;
  return {
    x: (event.clientX - rect.left) / safeZoom,
    y: (event.clientY - rect.top) / safeZoom,
  };
}

export function isInsideRect(point, rect) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

