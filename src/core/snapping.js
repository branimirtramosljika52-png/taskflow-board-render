import { A4_HEIGHT_PX, A4_WIDTH_PX, BUILDER_GRID_SIZE, snap } from "../utils/math.js";

const GUIDE_THRESHOLD = 5;

export function snapLayout(layout = {}, page = null, blocks = []) {
  const next = {
    ...layout,
    x: snap(layout.x, BUILDER_GRID_SIZE),
    y: snap(layout.y, BUILDER_GRID_SIZE),
  };
  const guides = [];
  const width = Number(next.width) || 1;
  const height = Number(next.height) || 1;
  const pageWidth = Number(page?.layout?.width) || A4_WIDTH_PX;
  const pageHeight = Number(page?.layout?.height) || A4_HEIGHT_PX;

  [
    { value: 0, axis: "x" },
    { value: pageWidth / 2, axis: "x", center: true },
    { value: pageWidth, axis: "x", right: true },
    { value: 0, axis: "y" },
    { value: pageHeight / 2, axis: "y", center: true },
    { value: pageHeight, axis: "y", bottom: true },
  ].forEach((guide) => {
    if (guide.axis === "x") {
      const candidate = guide.right ? next.x + width : guide.center ? next.x + width / 2 : next.x;
      if (Math.abs(candidate - guide.value) <= GUIDE_THRESHOLD) {
        next.x += guide.value - candidate;
        guides.push({ axis: "x", value: guide.value });
      }
    } else {
      const candidate = guide.bottom ? next.y + height : guide.center ? next.y + height / 2 : next.y;
      if (Math.abs(candidate - guide.value) <= GUIDE_THRESHOLD) {
        next.y += guide.value - candidate;
        guides.push({ axis: "y", value: guide.value });
      }
    }
  });

  blocks.forEach((block) => {
    const item = block.layout || {};
    const xValues = [Number(item.x) || 0, (Number(item.x) || 0) + (Number(item.width) || 0) / 2, (Number(item.x) || 0) + (Number(item.width) || 0)];
    const yValues = [Number(item.y) || 0, (Number(item.y) || 0) + (Number(item.height) || 0) / 2, (Number(item.y) || 0) + (Number(item.height) || 0)];
    [next.x, next.x + width / 2, next.x + width].forEach((candidate) => {
      const match = xValues.find((value) => Math.abs(candidate - value) <= GUIDE_THRESHOLD);
      if (Number.isFinite(match)) {
        next.x += match - candidate;
        guides.push({ axis: "x", value: match });
      }
    });
    [next.y, next.y + height / 2, next.y + height].forEach((candidate) => {
      const match = yValues.find((value) => Math.abs(candidate - value) <= GUIDE_THRESHOLD);
      if (Number.isFinite(match)) {
        next.y += match - candidate;
        guides.push({ axis: "y", value: match });
      }
    });
  });

  return { layout: next, guides };
}
