import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateMeasurementFormula,
  formatMeasurementFormulaResult,
  isMeasurementFormula,
  parseMeasurementCellReference,
} from "../src/measurementFormula.js";

test("formula helpers detect formulas and parse cell references", () => {
  assert.equal(isMeasurementFormula("=A1+B1"), true);
  assert.equal(isMeasurementFormula("  =IF(A1>0;1;0)"), true);
  assert.equal(isMeasurementFormula("123"), false);
  assert.deepEqual(parseMeasurementCellReference("A1"), { rowIndex: 0, columnIndex: 0 });
  assert.deepEqual(parseMeasurementCellReference("AA12"), { rowIndex: 11, columnIndex: 26 });
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
