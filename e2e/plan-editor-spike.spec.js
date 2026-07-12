import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

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
20A
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
20B
8
PATH
70
0
10
0
20
30
10
40
20
70
10
100
20
30
0
ENDSEC
0
EOF`;

test.describe("Plan editor spike", () => {
  async function skipWhenSpikeDisabled(page) {
    const disabled = await page.getByText("Spike ruta je development-only").isVisible().catch(() => false);
    test.skip(disabled, "Spike route is intentionally disabled in the production CAD build.");
  }

  test("opens spike route and roundtrips DXF on mobile-sized view", async ({ page }, testInfo) => {
    const dxfPath = testInfo.outputPath("plan-editor-spike-mobile-sample.dxf");
    await writeFile(dxfPath, SAMPLE_DXF, "utf8");

    await page.goto("/plan-editor/spike", { waitUntil: "domcontentloaded" });
    await skipWhenSpikeDisabled(page);
    await expect(page.getByRole("heading", { name: "SafeNexus Plan Editor Spike" })).toBeVisible();
    await page.locator("#cad-spike-file").setInputFiles(dxfPath);

    await expect(page.locator("#cad-spike-layer-list")).toContainText("WALLS");
    await expect(page.locator("#cad-spike-layer-list")).toContainText("PATH");
    await expect(page.locator('[data-entity-type="line"]')).toHaveCount(1);

    await page.getByRole("button", { name: "Spremi JSON" }).click();
    await page.getByRole("button", { name: "Prazno" }).click();
    await page.getByRole("button", { name: "Ponovno ucitaj" }).click();
    await expect(page.locator("#cad-spike-json-output")).toHaveValue(/safe-nexus-cad/);
  });

  test("uploads DXF, selects LINE, drags end grip and reloads SafeNexus JSON", async ({ page, isMobile }, testInfo) => {
    test.skip(isMobile, "CAD grip drag provjera je desktop-only.");

    const dxfPath = testInfo.outputPath("plan-editor-spike-sample.dxf");
    await writeFile(dxfPath, SAMPLE_DXF, "utf8");

    await page.goto("/plan-editor/spike", { waitUntil: "domcontentloaded" });
    await skipWhenSpikeDisabled(page);
    await page.locator("#cad-spike-file").setInputFiles(dxfPath);

    await expect(page.locator("#cad-spike-layer-list")).toContainText("WALLS");
    await expect(page.locator("#cad-spike-layer-list")).toContainText("PATH");
    await expect(page.locator('[data-entity-type="line"]')).toHaveCount(1);
    await expect(page.locator('[data-entity-type="polyline"]')).toHaveCount(1);

    await page.locator('[data-entity-type="line"]').click({ force: true });
    await expect(page.locator(".cad-spike-grip")).toHaveCount(3);

    const before = JSON.parse(await page.locator("#cad-spike-json-output").inputValue());
    const endGrip = page.locator('[data-grip-id="end"]');
    const box = await endGrip.boundingBox();
    expect(box).toBeTruthy();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 35);
    await page.mouse.up();

    const after = JSON.parse(await page.locator("#cad-spike-json-output").inputValue());
    const beforeLine = before.entities.find((entity) => entity.type === "line");
    const afterLine = after.entities.find((entity) => entity.type === "line");
    expect(afterLine.geometry.start).toEqual(beforeLine.geometry.start);
    expect(afterLine.geometry.end).not.toEqual(beforeLine.geometry.end);

    await page.getByRole("button", { name: "Spremi JSON" }).click();
    await page.getByRole("button", { name: "Prazno" }).click();
    await expect(page.locator('[data-entity-type="line"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Ponovno ucitaj" }).click();
    await expect(page.locator('[data-entity-type="line"]')).toHaveCount(1);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "PDF export" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("safe-nexus-cad-spike.pdf");
  });
});
