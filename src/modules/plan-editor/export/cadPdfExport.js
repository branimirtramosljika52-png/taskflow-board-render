import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import {
  getCadEntityBounds,
  getCadLayerById,
  getSafeNexusCadProjectBounds,
  isCadEntityVisible,
} from "../core/safeNexusCadModel.js";

const POINTS_PER_MM = 72 / 25.4;

function parseHexColor(value = "#18243a") {
  const normalized = String(value || "#18243a").replace("#", "").trim();
  const hex = /^[0-9a-f]{6}$/i.test(normalized) ? normalized : "18243a";
  return rgb(
    Number.parseInt(hex.slice(0, 2), 16) / 255,
    Number.parseInt(hex.slice(2, 4), 16) / 255,
    Number.parseInt(hex.slice(4, 6), 16) / 255,
  );
}

function resolvePageSize(pageSetup = {}) {
  const size = String(pageSetup.size || "A4").toUpperCase();
  const orientation = String(pageSetup.orientation || "landscape").toLowerCase();
  const sizesMm = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
  };
  const selected = sizesMm[size] || sizesMm.A4;
  const widthMm = orientation === "landscape" ? Math.max(selected.width, selected.height) : Math.min(selected.width, selected.height);
  const heightMm = orientation === "landscape" ? Math.min(selected.width, selected.height) : Math.max(selected.width, selected.height);
  return {
    width: widthMm * POINTS_PER_MM,
    height: heightMm * POINTS_PER_MM,
  };
}

function createWorldToPageTransform(bounds, pageSize, marginPt = 36, titleBlockHeight = 44) {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const availableWidth = Math.max(1, pageSize.width - marginPt * 2);
  const availableHeight = Math.max(1, pageSize.height - marginPt * 2 - titleBlockHeight);
  const scale = Math.min(availableWidth / width, availableHeight / height);
  const offsetX = marginPt + (availableWidth - width * scale) / 2;
  const offsetY = marginPt + titleBlockHeight + (availableHeight - height * scale) / 2;
  return (point = {}) => ({
    x: offsetX + (Number(point.x) - bounds.minX) * scale,
    y: offsetY + (bounds.maxY - Number(point.y)) * scale,
  });
}

function drawLine(page, transform, start, end, color, width = 0.75) {
  const a = transform(start);
  const b = transform(end);
  page.drawLine({
    start: a,
    end: b,
    color,
    thickness: Math.max(0.4, width),
  });
}

function drawEntity(page, project, transform, entity) {
  if (!isCadEntityVisible(project, entity) || !getCadEntityBounds(entity)) {
    return;
  }
  const layer = getCadLayerById(project, entity.layerId);
  const color = parseHexColor(entity.style?.stroke || layer?.color);
  const lineWidth = Number(entity.style?.lineWidth || layer?.lineWidth || 0.25) * 2;

  if (entity.type === "line") {
    drawLine(page, transform, entity.geometry.start, entity.geometry.end, color, lineWidth);
    return;
  }

  if (entity.type === "polyline") {
    const points = Array.isArray(entity.geometry?.points) ? entity.geometry.points : [];
    const segmentCount = entity.geometry?.closed ? points.length : Math.max(0, points.length - 1);
    for (let index = 0; index < segmentCount; index += 1) {
      drawLine(page, transform, points[index], points[(index + 1) % points.length], color, lineWidth);
    }
    return;
  }

  if (entity.type === "circle") {
    const center = transform(entity.geometry.center);
    const edge = transform({ x: entity.geometry.center.x + entity.geometry.radius, y: entity.geometry.center.y });
    page.drawCircle({
      x: center.x,
      y: center.y,
      size: Math.max(0.4, Math.abs(edge.x - center.x)),
      borderColor: color,
      borderWidth: Math.max(0.4, lineWidth),
    });
    return;
  }

  if (entity.type === "arc") {
    const center = entity.geometry.center;
    const radius = Number(entity.geometry.radius || 0);
    const start = Number(entity.geometry.startAngle || 0);
    const end = Number(entity.geometry.endAngle || 0);
    const steps = Math.max(8, Math.ceil(Math.abs(end - start) / (Math.PI / 18)));
    let previous = null;
    for (let index = 0; index <= steps; index += 1) {
      const angle = start + (end - start) * (index / steps);
      const point = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
      if (previous) {
        drawLine(page, transform, previous, point, color, lineWidth);
      }
      previous = point;
    }
    return;
  }

  if (entity.type === "text") {
    const insertionPoint = transform(entity.geometry.insertionPoint);
    page.drawText(String(entity.geometry.content || ""), {
      x: insertionPoint.x,
      y: insertionPoint.y,
      size: Math.max(5, Number(entity.geometry.height || 10) * 0.7),
      rotate: undefined,
      color,
    });
  }
}

export async function createSafeNexusCadPdfBytes(project = {}) {
  const pdf = await PDFDocument.create();
  const pageSize = resolvePageSize(project.pageSetup);
  const page = pdf.addPage([pageSize.width, pageSize.height]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const marginPt = Number(project.pageSetup?.marginsMm || 12) * POINTS_PER_MM;
  const titleBlockHeight = 44;
  const bounds = getSafeNexusCadProjectBounds(project);
  const transform = createWorldToPageTransform(bounds, pageSize, marginPt, titleBlockHeight);

  page.drawText(project.name || "SafeNexus CAD", {
    x: marginPt,
    y: pageSize.height - marginPt - 16,
    size: 12,
    font: boldFont,
    color: rgb(0.08, 0.13, 0.22),
  });
  page.drawText(`SafeNexus CAD JSON v${project.version || 1} | Entiteti: ${(project.entities || []).length} | Layeri: ${(project.layers || []).length}`, {
    x: marginPt,
    y: pageSize.height - marginPt - 32,
    size: 8,
    font,
    color: rgb(0.25, 0.3, 0.38),
  });

  page.drawRectangle({
    x: marginPt,
    y: marginPt,
    width: pageSize.width - marginPt * 2,
    height: pageSize.height - marginPt * 2 - titleBlockHeight,
    borderColor: rgb(0.78, 0.82, 0.88),
    borderWidth: 0.5,
  });

  (project.entities || []).forEach((entity) => drawEntity(page, project, transform, entity));

  page.drawLine({
    start: { x: marginPt, y: marginPt + titleBlockHeight - 8 },
    end: { x: pageSize.width - marginPt, y: marginPt + titleBlockHeight - 8 },
    color: rgb(0.6, 0.66, 0.74),
    thickness: 0.5,
  });
  page.drawText(`Export: ${new Date().toISOString()}`, {
    x: marginPt,
    y: marginPt + 10,
    size: 7,
    font,
    color: rgb(0.25, 0.3, 0.38),
  });

  return pdf.save();
}
