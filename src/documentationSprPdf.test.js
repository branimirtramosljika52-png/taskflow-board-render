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
    const excelGridTableCount = (html.match(/class="ex-grid/g) || []).length;

    assert.match(html, /<!doctype html>/i, preset.serviceCode);
    assert.match(html, /signature-box/, preset.serviceCode);
    assert.doesNotMatch(html, /Cannot read properties|undefined \(reading 'columns'\)/, preset.serviceCode);

    if (preset.serviceCode === "EXEI") {
      assert.match(html, /Z A P I S N I K/, "ExEi uses Excel-like cover");
      assert.match(html, /ISPITNI IZVJEŠTAJ/, "ExEi renders measurement report pages");
      assert.match(html, /ex-page landscape measurement/, "ExEi keeps landscape measurement sheets");
      assert.match(html, /ex-page portrait measurement/, "ExEi keeps portrait measurement sheets");
      assert.equal(excelGridTableCount > 0, true, "ExEi renders Excel-like gridline tables");
    }

    if (preset.serviceCode === "EXSE") {
      assert.match(html, /STATIČKOG ELEKTRICITETA/, "ExSe uses the Excel-like report title");
      assert.equal(excelGridTableCount > 0, true, "ExSe renders Excel-like gridline tables");
    }

    if (preset.serviceCode === "EXOV") {
      assert.equal(gridTableCount, 0, "ExOv does not use gridline measurement tables");
      assert.equal(excelGridTableCount, 0, "ExOv does not use Excel-like gridline measurement tables");
    }
  }

  assert.equal(presets.length > 0, true);
});
