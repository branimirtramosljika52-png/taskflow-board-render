import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateMeasurementFormula,
  formatMeasurementCellReference,
  formatMeasurementFormulaResult,
  isMeasurementFormula,
  listMeasurementFormulaReferences,
  parseMeasurementCellReference,
  shiftMeasurementFormulaReferences,
} from "../src/measurementFormula.js";

test("formula helpers detect formulas and parse cell references", () => {
  assert.equal(isMeasurementFormula("=A1+B1"), true);
  assert.equal(isMeasurementFormula("  =IF(A1>0;1;0)"), true);
  assert.equal(isMeasurementFormula("123"), false);
  assert.deepEqual(parseMeasurementCellReference("A1"), { rowIndex: 0, columnIndex: 0 });
  assert.deepEqual(parseMeasurementCellReference("AA12"), { rowIndex: 11, columnIndex: 26 });
  assert.equal(formatMeasurementCellReference(0, 0), "A1");
  assert.equal(formatMeasurementCellReference(11, 26), "AA12");
});

test("measurement formulas support arithmetic and cell references", () => {
  const values = new Map([
    ["A1", 10],
    ["B1", 5],
    ["C1", 2],
  ]);

  const result = evaluateMeasurementFormula("=A1+B1*C1-3", {
    resolveCellReference(reference) {
      return values.get(reference) ?? 0;
    },
  });

  assert.equal(result, 17);
});

test("measurement formulas support IF and IFERROR", () => {
  const values = new Map([
    ["A1", 12],
    ["B1", 0],
  ]);

  const ifResult = evaluateMeasurementFormula('=IF(A1>10;"OK";"NO")', {
    resolveCellReference(reference) {
      return values.get(reference) ?? 0;
    },
  });
  const ifErrorResult = evaluateMeasurementFormula("=IFERROR(A1/B1;99)", {
    resolveCellReference(reference) {
      return values.get(reference) ?? 0;
    },
  });

  assert.equal(ifResult, "OK");
  assert.equal(ifErrorResult, 99);
});

test("measurement formulas support RANDBETWEEN and localized formatting", () => {
  const randomValue = evaluateMeasurementFormula("=RANDBETWEEN(3;7)", {
    resolveCellReference() {
      return 0;
    },
    randomBetween(start, end) {
      assert.equal(start, 3);
      assert.equal(end, 7);
      return 5;
    },
  });

  assert.equal(randomValue, 5);
  assert.equal(formatMeasurementFormulaResult(12.5), "12,5");
  assert.equal(formatMeasurementFormulaResult(true), "TRUE");
});

test("formula helpers list and shift references for fill-down behavior", () => {
  assert.deepEqual(
    listMeasurementFormulaReferences('=IF(A1>10;"A1 je velik";B2+C3)'),
    ["A1", "B2", "C3"],
  );

  assert.equal(
    shiftMeasurementFormulaReferences("=A1+B2", 1, 0),
    "=A2+B3",
  );
  assert.equal(
    shiftMeasurementFormulaReferences("=IF(C3>0;D4;E5)", 2, 1),
    "=IF(D5>0;E6;F7)",
  );
});
