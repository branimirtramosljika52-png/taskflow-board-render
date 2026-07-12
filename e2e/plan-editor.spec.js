import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const SAMPLE_DXF = `0
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
100
21
0
0
LWPOLYLINE
8
0
10
0
20
20
10
30
20
35
0
CIRCLE
8
0
10
45
20
30
40
8
0
ARC
8
0
10
70
20
30
40
10
50
0
51
90
0
TEXT
8
0
10
0
20
55
40
5
1
SPR
0
ENDSEC
0
EOF`;

async function modelPoint(page, point) {
  const svg = page.locator("#cad-canvas");
  const box = await svg.boundingBox();
  const viewBox = (await svg.getAttribute("viewBox")).split(/\s+/).map(Number);
  return {
    x: box.x + ((point.x - viewBox[0]) / viewBox[2]) * box.width,
    y: box.y + ((point.y - viewBox[1]) / viewBox[3]) * box.height,
  };
}

async function clickModelPoint(page, point) {
  const screen = await modelPoint(page, point);
  await page.mouse.click(screen.x, screen.y);
}

async function dragLocator(page, locator, dx, dy) {
  const box = await locator.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 8 });
  await page.mouse.up();
}

test.describe("Plan editor Milestone 2", () => {
  test("draws, snaps, edits grips, undo/redo, saves, reloads and exports PDF", async ({ page, isMobile }) => {
    test.skip(isMobile, "CAD editing flow is covered on desktop; mobile gets a smoke test.");

    await page.goto("/plan-editor", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Line", exact: true }).click();
    await clickModelPoint(page, { x: 0, y: 0 });
    await clickModelPoint(page, { x: 100, y: 0 });
    await clickModelPoint(page, { x: 100.6, y: 0.3 });
    await clickModelPoint(page, { x: 100, y: 80 });
    await expect(page.locator('[data-entity-type="line"]')).toHaveCount(2);

    const projectAfterSnap = await page.evaluate(() => window.SafeNexusPlanEditor.getProject());
    const secondLine = projectAfterSnap.entities[1];
    expect(secondLine.geometry.start).toEqual({ x: 100, y: 0 });

    await page.getByRole("button", { name: "Select" }).click();
    await page.locator('[data-entity-type="line"]').first().click({ force: true });
    await expect(page.locator(".cad-editor-grip")).toHaveCount(3);

    await dragLocator(page, page.locator('[data-grip-id="end"]').first(), 90, 35);
    const afterFreeDrag = await page.evaluate(() => window.SafeNexusPlanEditor.getProject());
    const editedLine = afterFreeDrag.entities.find((entity) => entity.id === projectAfterSnap.entities[0].id);
    expect(editedLine.geometry.end).not.toEqual(projectAfterSnap.entities[0].geometry.end);

    await page.locator("#cad-snap-enabled").uncheck();
    await page.locator("#cad-ortho").check();
    await dragLocator(page, page.locator('[data-grip-id="end"]').first(), 70, 45);
    const afterOrtho = await page.evaluate(() => window.SafeNexusPlanEditor.getProject());
    const orthoLine = afterOrtho.entities.find((entity) => entity.id === projectAfterSnap.entities[0].id);
    expect(Math.abs(orthoLine.geometry.end.y - orthoLine.geometry.start.y)).toBeLessThan(0.001);

    await page.getByRole("button", { name: "Undo" }).click();
    const afterUndo = await page.evaluate(() => window.SafeNexusPlanEditor.getProject());
    expect(afterUndo.entities.find((entity) => entity.id === orthoLine.id).geometry.end).toEqual(editedLine.geometry.end);
    await page.getByRole("button", { name: "Redo" }).click();
    const afterRedo = await page.evaluate(() => window.SafeNexusPlanEditor.getProject());
    expect(afterRedo.entities.find((entity) => entity.id === orthoLine.id).geometry.end).toEqual(orthoLine.geometry.end);

    await page.getByRole("button", { name: "Spremi" }).click();
    await expect(page.locator("#cad-save-status")).toHaveText("Saved");
    await page.reload({ waitUntil: "domcontentloaded" });
    const reloaded = await page.evaluate(() => window.SafeNexusPlanEditor.getProject());
    expect(reloaded.entities).toHaveLength(2);
    expect(reloaded.entities.find((entity) => entity.id === orthoLine.id).geometry.end).toEqual(orthoLine.geometry.end);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("safenexus-plan-editor.pdf");
  });

  test("imports supported DXF entities", async ({ page, isMobile }, testInfo) => {
    test.skip(isMobile, "File upload import is covered on desktop.");
    const dxfPath = testInfo.outputPath("milestone-2-import.dxf");
    await writeFile(dxfPath, SAMPLE_DXF, "utf8");

    await page.goto("/plan-editor", { waitUntil: "domcontentloaded" });
    await page.locator("#cad-open-dxf").setInputFiles(dxfPath);

    await expect(page.locator('[data-entity-type="line"]')).toHaveCount(1);
    await expect(page.locator('[data-entity-type="polyline"]')).toHaveCount(1);
    await expect(page.locator('[data-entity-type="circle"]')).toHaveCount(1);
    await expect(page.locator('[data-entity-type="arc"]')).toHaveCount(1);
    await expect(page.locator('[data-entity-type="text"]')).toHaveCount(1);
  });

  test("mobile route shows desktop/tablet guidance", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile smoke only.");

    await page.goto("/plan-editor", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".cad-editor-mobile-note")).toBeVisible();
    await expect(page.locator("#cad-canvas")).toBeVisible();
  });
});
