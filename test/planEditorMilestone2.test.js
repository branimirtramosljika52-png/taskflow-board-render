import assert from "node:assert/strict";
import test from "node:test";

import { CadDocument } from "../src/modules/plan-editor/core/CadDocument.js";
import { createSafeNexusCadProject, getCadEntityGripPoints } from "../src/modules/plan-editor/core/safeNexusCadModel.js";
import { LineEntity } from "../src/modules/plan-editor/entities/LineEntity.js";
import { PolylineEntity } from "../src/modules/plan-editor/entities/PolylineEntity.js";
import { CircleEntity } from "../src/modules/plan-editor/entities/CircleEntity.js";
import { distance } from "../src/modules/plan-editor/geometry/distance.js";
import { lineLineIntersection } from "../src/modules/plan-editor/geometry/intersection.js";
import { projectPointToSegment } from "../src/modules/plan-editor/geometry/projection.js";
import { constrainToOrtho, constrainToPolar } from "../src/modules/plan-editor/geometry/angle.js";
import { SpatialIndex } from "../src/modules/plan-editor/spatial/SpatialIndex.js";
import { SnapEngine, snapPointToGrid } from "../src/modules/plan-editor/snapping/SnapEngine.js";
import { HistoryManager } from "../src/modules/plan-editor/history/HistoryManager.js";
import { AddEntityCommand } from "../src/modules/plan-editor/history/commands/AddEntityCommand.js";
import { MoveEntitiesCommand } from "../src/modules/plan-editor/history/commands/MoveEntitiesCommand.js";
import { EditLineGripCommand } from "../src/modules/plan-editor/history/commands/EditLineGripCommand.js";
import { parseCadProjectJson, serializeCadProject } from "../src/modules/plan-editor/storage/CadProjectSerializer.js";
import { parseSafeNexusCadDxf } from "../src/modules/plan-editor/adapters/dxfAdapter.js";
import { createSafeNexusCadPdfBytes } from "../src/modules/plan-editor/export/cadPdfExport.js";

function approx(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} is not within ${epsilon} of ${expected}`);
}

function createProject(entities = []) {
  return createSafeNexusCadProject({
    name: "Milestone 2 test",
    layers: [{ id: "layer_0", name: "0", visible: true, locked: false }],
    entities,
  });
}

function buildSpatial(project) {
  const index = new SpatialIndex(32);
  index.rebuild(project.entities);
  return index;
}

const sampleLine = new LineEntity({
  id: "line_1",
  type: "line",
  layerId: "layer_0",
  geometry: { start: { x: 0, y: 0 }, end: { x: 100, y: 0 } },
}).toJSON();

const crossingLine = new LineEntity({
  id: "line_2",
  type: "line",
  layerId: "layer_0",
  geometry: { start: { x: 50, y: -50 }, end: { x: 50, y: 50 } },
}).toJSON();

test("CAD geometry projects a point onto a segment", () => {
  const result = projectPointToSegment({ x: 30, y: 40 }, { x: 0, y: 0 }, { x: 100, y: 0 });
  assert.deepEqual(result.point, { x: 30, y: 0 });
  approx(result.t, 0.3);
});

test("LINE exposes midpoint, bounds and endpoint grip movement", () => {
  const line = new LineEntity(sampleLine);
  assert.deepEqual(line.midpoint(), { x: 50, y: 0 });
  assert.deepEqual(line.getBounds(), { minX: 0, minY: 0, maxX: 100, maxY: 0 });

  const moved = line.moveGrip("end", { x: 120, y: 30 }).toJSON();
  assert.deepEqual(moved.geometry.start, { x: 0, y: 0 });
  assert.deepEqual(moved.geometry.end, { x: 120, y: 30 });
});

test("POLYLINE exposes bounds and segment midpoint grips", () => {
  const polyline = new PolylineEntity({
    id: "poly_1",
    type: "polyline",
    layerId: "layer_0",
    geometry: { points: [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 20 }], closed: false },
  }).toJSON();

  assert.deepEqual(new PolylineEntity(polyline).getBounds(), { minX: 0, minY: 0, maxX: 40, maxY: 20 });
  const midpoint = getCadEntityGripPoints(polyline).find((grip) => grip.id === "segment:0");
  assert.deepEqual(midpoint.point, { x: 20, y: 0 });
});

test("CIRCLE exposes center and quadrant snap points", () => {
  const circle = new CircleEntity({
    id: "circle_1",
    type: "circle",
    layerId: "layer_0",
    geometry: { center: { x: 10, y: 10 }, radius: 5 },
  }).toJSON();
  const grips = getCadEntityGripPoints(circle);

  assert.deepEqual(grips.map((grip) => grip.id), ["center", "quadrant:0", "quadrant:90", "quadrant:180", "quadrant:270"]);
  assert.deepEqual(grips[1].point, { x: 15, y: 10 });
});

test("line intersection, ortho, polar and grid constraints work", () => {
  assert.deepEqual(
    lineLineIntersection({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 }),
    { x: 5, y: 5 },
  );
  assert.deepEqual(constrainToOrtho({ x: 0, y: 0 }, { x: 10, y: 4 }), { x: 10, y: 0 });
  const polar = constrainToPolar({ x: 0, y: 0 }, { x: 10, y: 4 }, [45]);
  approx(polar.y, 0);
  assert.deepEqual(snapPointToGrid({ x: 37, y: 61 }, 25), { x: 25, y: 50 });
});

test("SpatialIndex queries viewport and cursor radius without scanning caller-side arrays", () => {
  const project = createProject([sampleLine, crossingLine]);
  const index = buildSpatial(project);

  assert.deepEqual(index.queryViewport({ minX: -1, minY: -1, maxX: 10, maxY: 1 }).map((entity) => entity.id), ["line_1"]);
  assert.deepEqual(new Set(index.queryRadius({ x: 50, y: 0 }, 2).map((entity) => entity.id)), new Set(["line_1", "line_2"]));
});

test("SnapEngine resolves endpoint, midpoint, intersection and priority", () => {
  const project = createProject([sampleLine, crossingLine]);
  const index = buildSpatial(project);
  const endpointEngine = new SnapEngine({ enabled: true, endpoint: true, midpoint: false, center: false, nearest: true, intersection: false, grid: false, tolerancePx: 12 });
  const midpointEngine = new SnapEngine({ enabled: true, endpoint: false, midpoint: true, center: false, nearest: false, intersection: false, grid: false, tolerancePx: 12 });
  const intersectionEngine = new SnapEngine({ enabled: true, endpoint: false, midpoint: false, center: false, nearest: false, intersection: true, grid: false, tolerancePx: 12 });

  assert.equal(endpointEngine.snap(project, index, { x: 1, y: 0 }, 1).type, "endpoint");
  assert.deepEqual(midpointEngine.snap(project, index, { x: 50, y: 1 }, 1).point, { x: 50, y: 0 });
  assert.deepEqual(intersectionEngine.snap(project, index, { x: 50, y: 1 }, 1).point, { x: 50, y: 0 });
});

test("SafeNexus CAD JSON round-trips with schema version and metadata", () => {
  const project = createProject([sampleLine]);
  const parsed = parseCadProjectJson(serializeCadProject(project));

  assert.equal(parsed.schema, "safe-nexus-cad");
  assert.equal(parsed.version, 2);
  assert.equal(parsed.entities[0].type, "line");
  assert.ok(parsed.createdAt);
  assert.ok(parsed.updatedAt);
});

test("History undo/redo tracks add, move and one grip drag as one command", () => {
  const history = new HistoryManager(100);
  let document = CadDocument.empty({ layers: [{ id: "layer_0", name: "0" }] });

  document = history.execute(new AddEntityCommand(sampleLine), document);
  assert.equal(document.project.entities.length, 1);
  document = history.execute(new MoveEntitiesCommand(["line_1"], 10, 5), document);
  assert.deepEqual(document.getEntity("line_1").toJSON().geometry.start, { x: 10, y: 5 });

  const before = document.getEntity("line_1").toJSON();
  const after = new LineEntity(before).moveGrip("end", { x: 130, y: 5 }).toJSON();
  document = history.execute(new EditLineGripCommand(before, after), document);
  assert.equal(history.undoStack.length, 3);
  document = history.undo(document);
  assert.deepEqual(document.getEntity("line_1").toJSON().geometry.end, before.geometry.end);
  document = history.redo(document);
  assert.deepEqual(document.getEntity("line_1").toJSON().geometry.end, after.geometry.end);
});

test("DXF import supports LINE, POLYLINE, CIRCLE, ARC and TEXT", () => {
  const dxf = `0
SECTION
2
ENTITIES
0
LINE
8
0
10
0
20
0
11
10
21
0
0
LWPOLYLINE
8
0
10
0
20
0
10
5
20
5
0
CIRCLE
8
0
10
20
20
20
40
4
0
ARC
8
0
10
30
20
30
40
6
50
0
51
90
0
TEXT
8
0
10
40
20
40
40
3
1
ABC
0
ENDSEC
0
EOF`;
  const project = parseSafeNexusCadDxf(dxf, { fileName: "m2.dxf" });
  assert.deepEqual(project.entities.map((entity) => entity.type), ["line", "polyline", "circle", "arc", "text"]);
});

test("PDF export is vector-based and does not embed raster image XObjects", async () => {
  const project = createProject([sampleLine, crossingLine]);
  const bytes = await createSafeNexusCadPdfBytes(project);
  const raw = Buffer.from(bytes).toString("latin1");

  assert.equal(raw.slice(0, 4), "%PDF");
  assert.equal(raw.includes("/Subtype /Image"), false);
  assert.ok(bytes.length > 500);
});
