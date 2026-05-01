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
  assert.deepEqual(parseMeasurementCellReference("$AA$12"), { rowIndex: 11, columnIndex: 26 });
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

test("measurement formulas support empty string comparisons", () => {
  const formula = '=IF(B3="";"";"<2")';
  assert.equal(evaluateMeasurementFormula(formula, {
    resolveCellReference(reference) {
      return reference === "B3" ? "Mjesto ispitivanja" : "";
    },
  }), "<2");
  assert.equal(evaluateMeasurementFormula(formula, {
    resolveCellReference() {
      return "";
    },
  }), "");
});

test("measurement formulas support non-empty comparisons with text results", () => {
  const formula = '=IF(B3>"";"";">2")';
  assert.equal(evaluateMeasurementFormula(formula, {
    resolveCellReference() {
      return "";
    },
  }), ">2");
  assert.equal(evaluateMeasurementFormula(formula, {
    resolveCellReference() {
      return "Mjesto ispitivanja";
    },
  }), "");
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

test("measurement formulas support aggregate functions over ranges", () => {
  const values = new Map([
    ["A1", 4],
    ["A2", 6],
    ["A3", 10],
  ]);
  const context = {
    resolveCellReference(reference) {
      return values.get(reference) ?? "";
    },
    resolveRange(startReference, endReference) {
      assert.equal(startReference, "A1");
      assert.equal(endReference, "A3");
      return [["4"], ["6"], ["10"]];
    },
  };

  assert.equal(evaluateMeasurementFormula("=SUM(A1:A3)", context), 20);
  assert.equal(evaluateMeasurementFormula("=AVERAGE(A1:A3)", context), 20 / 3);
  assert.equal(evaluateMeasurementFormula("=MIN(A1:A3)", context), 4);
  assert.equal(evaluateMeasurementFormula("=MAX(A1:A3)", context), 10);
  assert.equal(evaluateMeasurementFormula("=COUNT(A1:A3)", context), 3);
});

test("measurement formulas support ROWS over ranges and cells", () => {
  const context = {
    resolveCellReference() {
      return "value";
    },
    resolveRange(startReference, endReference) {
      assert.equal(startReference, "A1");
      assert.equal(endReference, "B3");
      return [
        ["A1", "B1"],
        ["A2", "B2"],
        ["A3", "B3"],
      ];
    },
  };

  assert.equal(evaluateMeasurementFormula("=ROWS(A1:B3)", context), 3);
  assert.equal(evaluateMeasurementFormula("=ROWS(A1)", context), 1);
  assert.equal(evaluateMeasurementFormula("=rows(A3)", {
    resolveCellReference() {
      throw new Error("ROWS over a cell reference must not read the cell value.");
    },
  }), 3);
  assert.equal(evaluateMeasurementFormula("=ROWS(A6)", context), 6);

  const absoluteRangeContext = {
    resolveCellReference() {
      return "value";
    },
    resolveRange(startReference, endReference) {
      assert.equal(startReference, "$A$1");
      assert.equal(endReference, "A3");
      return [
        ["A1"],
        ["A2"],
        ["A3"],
      ];
    },
  };

  assert.equal(evaluateMeasurementFormula("=ROWS($A$1:A3)", absoluteRangeContext), 3);
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
  assert.deepEqual(
    listMeasurementFormulaReferences("=ROWS($A$1:A3)"),
    ["$A$1", "A3"],
  );
  assert.equal(
    shiftMeasurementFormulaReferences("=ROWS($A$1:A1)", 4, 2),
    "=ROWS($A$1:C5)",
  );
  assert.equal(
    shiftMeasurementFormulaReferences("=$A1+A$1+$A$1", 1, 1),
    "=$A2+B$1+$A$1",
  );
});

test("measurement formulas support references to other Excel tables", () => {
  const context = {
    resolveCellReference(reference) {
      if (reference?.sheetName === "Sheet 2" && reference.reference === "A1") {
        return 7;
      }
      if (reference?.sheetName === "{{EXCEL_TABLICA}}" && reference.reference === "C3") {
        return 11;
      }
      return 3;
    },
    resolveRange(startReference, endReference) {
      assert.equal(startReference.sheetName, "Sheet 2");
      assert.equal(endReference.sheetName, "Sheet 2");
      assert.equal(startReference.reference, "A1");
      assert.equal(endReference.reference, "A3");
      return [[1], [2], [3]];
    },
  };

  assert.equal(evaluateMeasurementFormula("='Sheet 2'!A1+ROWS(A3)", context), 10);
  assert.equal(evaluateMeasurementFormula("=SUM('Sheet 2'!A1:A3)", context), 6);
  assert.equal(evaluateMeasurementFormula("={{EXCEL_TABLICA}}!C3", context), 11);
  assert.deepEqual(
    listMeasurementFormulaReferences("='Sheet 2'!A1+Sheet1!B2+{{EXCEL_TABLICA}}!C3"),
    ["Sheet 2!A1", "Sheet1!B2", "{{EXCEL_TABLICA}}!C3"],
  );
  assert.equal(
    shiftMeasurementFormulaReferences("=A1+'Sheet 2'!B2", 1, 1),
    "=B2+'Sheet 2'!B2",
  );
});

test("measurement formulas support VLOOKUP over cell ranges", () => {
  const values = new Map([
    ["A1", "SPR"],
    ["B1", "12"],
    ["A2", "TZIN"],
    ["B2", "24"],
    ["A3", "PANIK"],
    ["B3", "6"],
  ]);

  const result = evaluateMeasurementFormula('=VLOOKUP("TZIN";A1:B3;2;FALSE)', {
    resolveCellReference(reference) {
      return values.get(reference) ?? "";
    },
    resolveRange(startReference, endReference) {
      const rows = ["1", "2", "3"];
      const columns = ["A", "B"];
      assert.equal(startReference, "A1");
      assert.equal(endReference, "B3");
      return rows.map((row) => columns.map((column) => values.get(`${column}${row}`) ?? ""));
    },
  });

  assert.equal(result, "24");
});
