import assert from "node:assert/strict";
import test from "node:test";
import {
  compareDocumentTemplateRuntimeServiceCodes,
  getDocumentTemplateRuntimeTimelineLabel,
  isWorkOrderDocumentPhysicalFactorsText,
  isWorkOrderDocumentWorkEquipmentService,
  isWorkOrderDocumentWorkEquipmentText,
  normalizeDocumentTemplateRuntimeServiceCode,
  shouldShowWorkOrderDocumentIsznrWorkEquipmentSection,
} from "../src/features/workOrderDocuments/nativeServices.js";
import {
  createDocumentationMeasurementTablesForService,
} from "../src/documentationNativePresets.js";

test("native work equipment detection accepts compact names and RO codes", () => {
  assert.equal(isWorkOrderDocumentWorkEquipmentText("RadnaOprema"), true);
  assert.equal(isWorkOrderDocumentWorkEquipmentText("RO1.1"), true);
  assert.equal(isWorkOrderDocumentWorkEquipmentText("RO - pregled radne opreme"), true);
  assert.equal(isWorkOrderDocumentWorkEquipmentText("RO-F"), false);
  assert.equal(isWorkOrderDocumentWorkEquipmentText("ROK"), false);
  assert.equal(isWorkOrderDocumentPhysicalFactorsText("RO-F"), true);
});

test("native work equipment detection reads work order and nested service fields", () => {
  assert.equal(isWorkOrderDocumentWorkEquipmentService({
    label: "Pregled i ispitivanje opreme za rad",
    templateName: "RO v1.0.0",
  }), true);

  assert.equal(shouldShowWorkOrderDocumentIsznrWorkEquipmentSection({
    serviceName: "RadnaOprema",
    services: [{ shortLabel: "RO1" }],
  }, []), true);
});

test("documentation service codes normalize to the requested zapisnici tab labels", () => {
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("RADNAOPREMA"), "RO");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("STROJEVI"), "NO");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("ROF"), "FC");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("ROK"), "KC");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("NNZDPETROL"), "NNZD");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("HMUV"), "HM");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("VES"), "VS");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("SRR"), "SRR");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("SPR"), "SRR");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("PANIK"), "SRR");
  assert.equal(normalizeDocumentTemplateRuntimeServiceCode("PR"), "PR");
  assert.notEqual(normalizeDocumentTemplateRuntimeServiceCode("Pregled hidrantske mreze"), "SRR");
});

test("documentation service code comparator follows the requested zapisnici tab order", () => {
  const codes = ["EXSE", "SRR", "ROK", "STROJEVI", "ROF", "RADNAOPREMA", "EXEI", "NNZDPETROL"];
  assert.deepEqual(codes.sort(compareDocumentTemplateRuntimeServiceCodes), [
    "RADNAOPREMA",
    "STROJEVI",
    "SRR",
    "ROF",
    "ROK",
    "EXEI",
    "EXSE",
    "NNZDPETROL",
  ]);
});

test("documentation timeline labels keep ROF and ROK out of the RO tab", () => {
  assert.equal(getDocumentTemplateRuntimeTimelineLabel({ serviceCode: "ROF" }), "FC");
  assert.equal(getDocumentTemplateRuntimeTimelineLabel({ serviceCode: "ROK" }), "KC");
  assert.equal(getDocumentTemplateRuntimeTimelineLabel({ templateTitle: "Predlozak ROF mjerenja" }), "FC");
  assert.equal(getDocumentTemplateRuntimeTimelineLabel({ templateTitle: "Predlozak ROK kemijski cimbenici" }), "KC");
});

test("SRR gridline template uses lighting columns with formula defaults and SPR legacy alias", () => {
  const [table] = createDocumentationMeasurementTablesForService("SRR");
  const [legacyTable] = createDocumentationMeasurementTablesForService("SPR");

  assert.deepEqual(table.sheet.columns.map((column) => column.label), [
    "Redni broj",
    "Mjesto ispitivanja",
    "Broj panel lampi",
    "Izmjerena razina osvjetljenja [lux]",
    "Potrebna razina osvjetljenja [lux]",
    "Zadovoljava",
  ]);

  assert.equal(table.id, "srr-results");
  assert.equal(legacyTable.id, "srr-results");
  assert.equal(table.sheet.rows.length, 12);
  assert.deepEqual(table.sheet.rows[0].cells, {
    c1: '=IF(B1="","",ROW())',
    c2: "Prodajni prostor",
    c3: '=IF(B1="","","1")',
    c4: '=IF(B1="","",">2")',
    c5: '=IF(B1="","","1")',
    c6: '=IF(B1="","","DA")',
  });
  assert.equal(table.sheet.rows[6].cells.c2, "");
  assert.equal(table.sheet.rows[6].cells.c1, '=IF(B7="","",ROW())');
  assert.equal(table.sheet.rows[6].cells.c4, '=IF(B7="","",">2")');
});
