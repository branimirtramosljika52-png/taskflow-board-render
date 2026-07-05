import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createDocumentationReportModelDefaults,
  getDocumentationNativeTemplateSeedPresets,
} from "./documentationNativePresets.js";
import { buildDocumentationNativeHtml } from "./documentationSprPdf.js";

test("native documentation HTML renders every XLSM-backed report preset", () => {
  const presets = getDocumentationNativeTemplateSeedPresets();

  for (const preset of presets) {
    const model = {
      ...createDocumentationReportModelDefaults(preset.serviceCode),
      companyName: "Petrol d.o.o.",
      companyAddress: "Primjer adrese 1, Zagreb",
      companyOib: "00000000000",
      workOrderNumber: "26-672",
      recordNumber: `26-672-${preset.serviceCode}`,
      inspectionPlace: "PM Zagreb Lucko",
      inspectionObject: "Test objekt",
      inspectionDate: "2026-07-05",
      issueDate: "2026-07-05",
      validUntil: "2027-07-05",
      responsiblePerson: "Test Ispitivac",
      signatureMode: "digital",
    };
    const html = buildDocumentationNativeHtml({ model, rows: [] });
    const gridTableCount = (html.match(/class="sn-ex-grid/g) || []).length;

    assert.match(html, /<!doctype html>/i, preset.serviceCode);
    assert.match(html, /signature-box/, preset.serviceCode);
    assert.doesNotMatch(html, /Cannot read properties|undefined \(reading 'columns'\)/, preset.serviceCode);

    if (preset.serviceCode === "EXOV") {
      assert.equal(gridTableCount, 0, "ExOv does not use gridline measurement tables");
    }
  }

  assert.equal(presets.length > 0, true);
});
