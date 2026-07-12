import assert from "node:assert/strict";
import test from "node:test";

import {
  getCadEntityGripPoints,
  moveCadLineGrip,
  parseSafeNexusCadJson,
  serializeSafeNexusCadProject,
} from "../src/modules/plan-editor/core/safeNexusCadModel.js";
import { parseSafeNexusCadDxf } from "../src/modules/plan-editor/adapters/dxfAdapter.js";
import { createSafeNexusCadPdfBytes } from "../src/modules/plan-editor/export/cadPdfExport.js";

const SAMPLE_DXF = `0
SECTION
2
TABLES
0
TABLE
2
LAYER
0
LAYER
2
WALLS
70
0
62
5
0
LAYER
2
PATH
70
0
62
3
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
5
10A
8
WALLS
10
0
20
0
11
100
21
0
0
LWPOLYLINE
5
10B
8
PATH
70
0
10
0
20
20
10
50
20
50
10
100
20
20
0
CIRCLE
8
PATH
10
25
20
25
40
8
0
ENDSEC
0
EOF`;

test("plan editor parses DXF layers and LINE/POLYLINE/CIRCLE entities", () => {
  const project = parseSafeNexusCadDxf(SAMPLE_DXF, { fileName: "spike-sample.dxf" });

  assert.equal(project.sourceFile.originalName, "spike-sample.dxf");
  assert.deepEqual(project.layers.map((layer) => layer.name), ["WALLS", "PATH"]);
  assert.equal(project.entities.length, 3);
  assert.equal(project.entities[0].type, "line");
  assert.equal(project.entities[0].geometry.end.x, 100);
  assert.equal(project.entities[1].type, "polyline");
  assert.equal(project.entities[1].geometry.points.length, 3);
  assert.equal(project.entities[2].type, "circle");
  assert.equal(project.entities[2].geometry.radius, 8);
});

test("plan editor spike exposes start, middle and end grips for LINE", () => {
  const project = parseSafeNexusCadDxf(SAMPLE_DXF);
  const line = project.entities.find((entity) => entity.type === "line");
  const grips = getCadEntityGripPoints(line);

  assert.deepEqual(grips.map((grip) => grip.id), ["start", "middle", "end"]);
  assert.deepEqual(grips[1].point, { x: 50, y: 0 });
});

test("plan editor spike moves only the selected LINE end grip", () => {
  const project = parseSafeNexusCadDxf(SAMPLE_DXF);
  const line = project.entities.find((entity) => entity.type === "line");
  const moved = moveCadLineGrip(project, line.id, "end", { x: 125, y: 30 });
  const movedLine = moved.entities.find((entity) => entity.id === line.id);

  assert.deepEqual(movedLine.geometry.start, { x: 0, y: 0 });
  assert.deepEqual(movedLine.geometry.end, { x: 125, y: 30 });
});

test("plan editor spike roundtrips SafeNexus CAD JSON", () => {
  const project = parseSafeNexusCadDxf(SAMPLE_DXF, { fileName: "roundtrip.dxf" });
  const json = serializeSafeNexusCadProject(project);
  const parsed = parseSafeNexusCadJson(json);

  assert.equal(parsed.schema, "safe-nexus-cad");
  assert.equal(parsed.sourceFile.originalName, "roundtrip.dxf");
  assert.equal(parsed.entities.length, project.entities.length);
});

test("plan editor spike creates a basic vector PDF", async () => {
  const project = parseSafeNexusCadDxf(SAMPLE_DXF, { fileName: "pdf.dxf" });
  const bytes = await createSafeNexusCadPdfBytes(project);
  const header = Buffer.from(bytes).subarray(0, 4).toString("utf8");

  assert.equal(header, "%PDF");
  assert.ok(bytes.length > 500);
});
