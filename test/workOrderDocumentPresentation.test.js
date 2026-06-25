import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWorkOrderDocumentRoMatrixRows,
  getWorkOrderDocumentRoEquipmentValue,
  getWorkOrderDocumentWorkEquipmentFilterCounts,
  getWorkOrderDocumentWorkEquipmentFilterKind,
} from "../src/features/workOrderDocuments/workEquipmentPresentation.js";
import {
  getWorkOrderDocumentPhysicalFactorsFilterCounts,
  getWorkOrderDocumentWorkEnvironmentMeasurementRows,
  getWorkOrderDocumentWorkEnvironmentSpaceRows,
  summarizeWorkOrderDocumentWorkEnvironmentMeasurements,
} from "../src/features/workEnvironment/presentation.js";

test("work equipment presentation keeps deadline filters stable", () => {
  const today = new Date("2026-06-25T00:00:00");
  const items = [
    { id: "1", deadlineForNextExamination: "2026-06-20", finalGrade: "Zadovoljava" },
    { id: "2", deadlineForNextExamination: "2026-07-05", finalGrade: "Zadovoljava" },
    { id: "3", deadlineForNextExamination: "", finalGrade: "Ne zadovoljava" },
  ];

  const counts = getWorkOrderDocumentWorkEquipmentFilterCounts(items, today);

  assert.equal(counts.all, 3);
  assert.equal(counts.overdue, 1);
  assert.equal(counts.upcoming, 1);
  assert.equal(counts["no-deadline"], 1);
  assert.equal(counts.unsatisfactory, 1);
});

test("work equipment matrix model summarizes inspection rows", () => {
  const today = new Date("2026-06-25T00:00:00");
  const rows = buildWorkOrderDocumentRoMatrixRows({
    recordNumber: "RO-1",
    location: "Skladiste",
    startDate: "2026-06-20",
    endDate: "2026-06-20",
    deadlineForNextExamination: "2026-07-05",
    finalGrade: "Zadovoljava",
    equipment: {
      name: "Vilicar",
      manufacturer: "Linde",
      model: "H16D",
      serialNumber: "S-1",
      inventoryNumber: "INV-1",
      note: "OK",
    },
    roObligationRegister: ["Zakon"],
    roHealthRequirementRegister: ["Pravilnik"],
    mechanicalItems: [{ label: "Zastita od pokretnih dijelova" }],
  }, {
    today,
    formatDate: (value) => value,
    getFilterKind: getWorkOrderDocumentWorkEquipmentFilterKind,
    summarizeAssessmentItems: (items) => items.map((item) => item.label).join(", "),
  });

  assert.equal(rows.find((row) => row.key === "inspection")?.detail, "Vrijedi do: 2026-07-05");
  assert.equal(rows.find((row) => row.key === "mechanical")?.value, "1 stavki");
  assert.equal(rows.find((row) => row.key === "obligationRegulations")?.ok, true);
});

test("work equipment table values use injected formatters", () => {
  const value = getWorkOrderDocumentRoEquipmentValue({
    equipment: { name: "Kompresor" },
    deadlineForNextExamination: "2026-07-05",
  }, "deadline", {
    formatDate: (input) => `date:${input}`,
  });

  assert.equal(value, "date:2026-07-05");
});

test("work environment presentation builds spaces and summaries", () => {
  const items = [{
    id: "fc-1",
    spaces: [{ code: "P-1", name: "Ured", finalGrades: ["Zadovoljava"] }],
    measurements: [
      { id: "m1", spaceName: "P-1", kind: "Buka", measured: "48,5", allowed: "65", unit: "dB" },
      { id: "m2", spaceName: "P-1", kind: "Buka", measured: "50", allowed: "65", unit: "dB" },
    ],
  }];

  const measurements = getWorkOrderDocumentWorkEnvironmentMeasurementRows(items);
  const spaces = getWorkOrderDocumentWorkEnvironmentSpaceRows(items, measurements, {
    createId: () => "generated-space",
  });

  assert.equal(measurements.length, 2);
  assert.equal(spaces.length, 1);
  assert.equal(spaces[0].measurements.length, 2);
  assert.match(summarizeWorkOrderDocumentWorkEnvironmentMeasurements(measurements), /Buka: izmj\. 48,5 - 50 dB/);
});

test("physical factors presentation mirrors work equipment filters", () => {
  const today = new Date("2026-06-25T00:00:00");
  const counts = getWorkOrderDocumentPhysicalFactorsFilterCounts([
    { deadlineForNextExamination: "2026-06-24", finalGrade: "Zadovoljava" },
    { deadlineForNextExamination: "", finalGrade: "Ne zadovoljava" },
  ], today);

  assert.equal(counts.overdue, 1);
  assert.equal(counts["no-deadline"], 1);
  assert.equal(counts.unsatisfactory, 1);
});
