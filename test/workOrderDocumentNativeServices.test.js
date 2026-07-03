import assert from "node:assert/strict";
import test from "node:test";
import {
  isWorkOrderDocumentPhysicalFactorsText,
  isWorkOrderDocumentWorkEquipmentService,
  isWorkOrderDocumentWorkEquipmentText,
  shouldShowWorkOrderDocumentIsznrWorkEquipmentSection,
} from "../src/features/workOrderDocuments/nativeServices.js";

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
