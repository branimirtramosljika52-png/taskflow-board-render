import test from "node:test";
import assert from "node:assert/strict";

import {
  formatMeasurementComputedDisplayValue,
  formatMeasurementLiteralDisplayValue,
  normalizeMeasurementCellFormat,
} from "../src/measurementFormatting.js";

test("measurement formatting normalizes cell format settings", () => {
  assert.deepEqual(normalizeMeasurementCellFormat(), {
    type: "general",
    decimals: 2,
  });

  assert.deepEqual(normalizeMeasurementCellFormat({
    type: "number",
    decimals: 9,
  }), {
    type: "number",
    decimals: 6,
  });

  assert.deepEqual(normalizeMeasurementCellFormat({
    type: "unknown",
    decimals: -2,
  }), {
    type: "general",
    decimals: 0,
  });
});

test("measurement literal formatting supports number, integer and percent", () => {
  assert.equal(
    formatMeasurementLiteralDisplayValue("12,345", { type: "number", decimals: 2 }),
    "12,35",
  );

  assert.equal(
    formatMeasurementLiteralDisplayValue("12,9", { type: "integer", decimals: 2 }),
    "13",
  );

  assert.equal(
    formatMeasurementLiteralDisplayValue("0,125", { type: "percent", decimals: 1 }),
    "12,5%",
  );
});

test("measurement computed formatting supports general, text and percent", () => {
  assert.equal(
    formatMeasurementComputedDisplayValue(12.5, { type: "general", decimals: 2 }),
    "12,5",
  );

  assert.equal(
    formatMeasurementComputedDisplayValue(true, { type: "general", decimals: 2 }),
    "TRUE",
  );

  assert.equal(
    formatMeasurementComputedDisplayValue(0.075, { type: "percent", decimals: 2 }),
    "7,50%",
  );

  assert.equal(
    formatMeasurementComputedDisplayValue(42, { type: "text", decimals: 2 }),
    "42",
  );
});
