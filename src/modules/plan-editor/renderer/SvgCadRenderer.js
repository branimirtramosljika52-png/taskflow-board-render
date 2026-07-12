import { CadRenderer } from "./CadRenderer.js";
import { getCadEntityGripPoints, getCadLayerById, isCadEntityVisible } from "../core/safeNexusCadModel.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(key, String(value));
    }
  });
  return element;
}

export class SvgCadRenderer extends CadRenderer {
  constructor(svg) {
    super();
    this.svg = svg;
  }

  render(project, options = {}) {
    const { viewBox, selectedIds = new Set(), activeGripEntity = null, grid = {}, preview = null, snap = null } = options;
    this.svg.replaceChildren();
    this.svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    this.renderGrid(viewBox, grid);
    (project.entities || []).filter((entity) => isCadEntityVisible(project, entity)).forEach((entity) => {
      const element = this.renderEntity(project, entity, selectedIds.has(entity.id));
      if (element) {
        this.svg.append(element);
      }
    });
    if (preview) {
      this.svg.append(preview);
    }
    if (activeGripEntity) {
      this.renderGrips(activeGripEntity, viewBox);
    }
    if (snap) {
      this.renderSnapMarker(snap, viewBox);
    }
  }

  renderGrid(viewBox, grid = {}) {
    const background = svgElement("rect", {
      class: "cad-editor-bg",
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.width,
      height: viewBox.height,
    });
    this.svg.append(background);
    if (!grid.enabled) {
      return;
    }
    const spacing = Math.max(1, Number(grid.spacing || 25));
    const minorTargetPx = 18;
    const scale = viewBox.width / Math.max(1, this.svg.clientWidth || 1);
    let visibleSpacing = spacing;
    while (visibleSpacing / scale < minorTargetPx) {
      visibleSpacing *= 2;
    }
    const startX = Math.floor(viewBox.x / visibleSpacing) * visibleSpacing;
    const endX = viewBox.x + viewBox.width;
    const startY = Math.floor(viewBox.y / visibleSpacing) * visibleSpacing;
    const endY = viewBox.y + viewBox.height;
    const pathParts = [];
    for (let x = startX; x <= endX; x += visibleSpacing) {
      pathParts.push(`M ${x} ${viewBox.y} L ${x} ${viewBox.y + viewBox.height}`);
    }
    for (let y = startY; y <= endY; y += visibleSpacing) {
      pathParts.push(`M ${viewBox.x} ${y} L ${viewBox.x + viewBox.width} ${y}`);
    }
    this.svg.append(svgElement("path", {
      class: "cad-editor-grid-minor",
      d: pathParts.join(" "),
      "vector-effect": "non-scaling-stroke",
    }));
  }

  renderEntity(project, entity, selected) {
    const layer = getCadLayerById(project, entity.layerId);
    const attrs = {
      class: selected ? "cad-editor-entity is-selected" : "cad-editor-entity",
      "data-entity-id": entity.id,
      "data-entity-type": entity.type,
      stroke: entity.style?.stroke || layer?.color || "#172033",
      "stroke-width": Math.max(0.5, Number(entity.style?.lineWidth || layer?.lineWidth || 0.25) * 2),
      "vector-effect": "non-scaling-stroke",
      fill: "none",
    };
    if (entity.type === "line") {
      return svgElement("line", {
        ...attrs,
        x1: entity.geometry.start.x,
        y1: entity.geometry.start.y,
        x2: entity.geometry.end.x,
        y2: entity.geometry.end.y,
      });
    }
    if (entity.type === "polyline") {
      return svgElement(entity.geometry.closed ? "polygon" : "polyline", {
        ...attrs,
        points: (entity.geometry.points || []).map((point) => `${point.x},${point.y}`).join(" "),
      });
    }
    if (entity.type === "circle") {
      return svgElement("circle", {
        ...attrs,
        cx: entity.geometry.center.x,
        cy: entity.geometry.center.y,
        r: entity.geometry.radius,
      });
    }
    if (entity.type === "arc") {
      return svgElement("path", {
        ...attrs,
        d: this.arcPath(entity),
      });
    }
    if (entity.type === "text") {
      const text = svgElement("text", {
        ...attrs,
        x: entity.geometry.insertionPoint.x,
        y: entity.geometry.insertionPoint.y,
        fill: attrs.stroke,
        stroke: "none",
        "font-size": entity.geometry.height,
        transform: `rotate(${entity.geometry.rotation * 180 / Math.PI} ${entity.geometry.insertionPoint.x} ${entity.geometry.insertionPoint.y})`,
      });
      text.textContent = entity.geometry.content || "";
      return text;
    }
    return null;
  }

  arcPath(entity) {
    const { center, radius, startAngle, endAngle } = entity.geometry;
    const start = { x: center.x + Math.cos(startAngle) * radius, y: center.y + Math.sin(startAngle) * radius };
    const end = { x: center.x + Math.cos(endAngle) * radius, y: center.y + Math.sin(endAngle) * radius };
    const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    const sweep = endAngle >= startAngle ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
  }

  renderGrips(entity, viewBox) {
    const radius = Math.max(viewBox.width, viewBox.height) / 160;
    getCadEntityGripPoints(entity).forEach((grip) => {
      this.svg.append(svgElement("circle", {
        class: "cad-editor-grip",
        "data-grip-id": grip.id,
        "data-entity-id": entity.id,
        cx: grip.point.x,
        cy: grip.point.y,
        r: radius,
      }));
    });
  }

  renderSnapMarker(snap, viewBox) {
    const size = Math.max(viewBox.width, viewBox.height) / 120;
    this.svg.append(svgElement("rect", {
      class: `cad-editor-snap cad-editor-snap-${snap.type}`,
      x: snap.point.x - size / 2,
      y: snap.point.y - size / 2,
      width: size,
      height: size,
      "vector-effect": "non-scaling-stroke",
    }));
  }
}

export { svgElement };
