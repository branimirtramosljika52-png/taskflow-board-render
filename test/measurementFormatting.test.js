import test from "node:test";
import assert from "node:assert/strict";

import {
  formatMeasurementComputedDisplayValue,
  formatMeasurementLiteralDisplayValue,
  getMeasurementBorderPreset,
  normalizeMeasurementBorder,
  normalizeMeasurementCellFormat,
} from "../src/measurementFormatting.js";

test("measurement formatting normalizes cell format settings", () => {
  assert.deepEqual(normalizeMeasurementCellFormat(), {
    type: "general",
    decimals: 2,
    align: "auto",
    fontFamily: "default",
    fontSize: 14,
    bold: false,
    italic: false,
    underline: false,
    fillColor: "",
    border: {
      top: false,
      right: false,
      bottom: false,
      left: false,
    },
  });

  assert.deepEqual(normalizeMeasurementCellFormat({
    type: "number",
    decimals: 9,
    fontFamily: "Calibri",
    fontSize: 24,
    bold: true,
    italic: true,
    underline: true,
    fillColor: "#ABC",
    border: "all",
  }), {
    type: "number",
    decimals: 6,
    align: "auto",
    fontFamily: "calibri",
    fontSize: 24,
    bold: true,
    italic: true,
    underline: true,
    fillColor: "#aabbcc",
    border: {
      top: true,
      right: true,
      bottom: true,
      left: true,
    },
  });

  assert.deepEqual(normalizeMeasurementCellFormat({
    type: "unknown",
    decimals: -2,
    fontFamily: "unknown",
    fontSize: 99,
    fillColor: "red",
  }), {
    type: "general",
    decimals: 0,
    align: "auto",
    fontFamily: "default",
    fontSize: 40,
    bold: false,
    italic: false,
    underline: false,
    fillColor: "",
    border: {
      top: false,
      right: false,
      bottom: false,
      left: false,
    },
  });
});

test("measurement border helpers normalize presets and detect active preset", () => {
  assert.deepEqual(normalizeMeasurementBorder("bottom"), {
    top: false,
    right: false,
    bottom: true,
    left: false,
  });

  assert.equal(getMeasurementBorderPreset({
    top: true,
    right: true,
    bottom: true,
    left: true,
  }), "all");

  assert.equal(getMeasurementBorderPreset({
    top: true,
    right: false,
    bottom: false,
    left: false,
  }), "top");

  assert.equal(getMeasurementBorderPreset({
    top: true,
    right: false,
    bottom: true,
    left: false,
  }), "custom");
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
