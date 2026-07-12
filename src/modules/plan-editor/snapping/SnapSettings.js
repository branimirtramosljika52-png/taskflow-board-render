export const DEFAULT_SNAP_SETTINGS = Object.freeze({
  enabled: true,
  tolerancePx: 12,
  endpoint: true,
  midpoint: true,
  center: true,
  intersection: true,
  nearest: true,
  grid: true,
  gridSpacing: 25,
});

export function normalizeSnapSettings(settings = {}) {
  return {
    ...DEFAULT_SNAP_SETTINGS,
    ...(settings || {}),
    tolerancePx: Math.max(1, Number(settings.tolerancePx ?? DEFAULT_SNAP_SETTINGS.tolerancePx)),
    gridSpacing: Math.max(0.1, Number(settings.gridSpacing ?? DEFAULT_SNAP_SETTINGS.gridSpacing)),
  };
}
