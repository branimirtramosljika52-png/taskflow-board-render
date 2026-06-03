import test from "node:test";
import assert from "node:assert/strict";

import {
  findRiskChemicalOfficialGvi,
  RISK_CHEMICAL_PRILOG_II_GUIDELINES,
  RISK_CHEMICAL_SUBSTANCES_CATALOG,
  RISK_CHEMICAL_SUBSTANCES_SOURCE_URL,
  RISK_CHEMICAL_SUBSTANCES_STATS,
  resolveRiskChemicalPrilogIiGuideline,
} from "../src/riskChemicalSubstancesCatalog.js";

test("official Narodne novine chemical catalog includes GVI and BGV tables", () => {
  assert.equal(
    RISK_CHEMICAL_SUBSTANCES_SOURCE_URL,
    "https://narodne-novine.nn.hr/clanci/sluzbeni/2018_10_91_1774.html",
  );
  assert.equal(RISK_CHEMICAL_SUBSTANCES_STATS.totalCount, RISK_CHEMICAL_SUBSTANCES_CATALOG.length);
  assert.ok(RISK_CHEMICAL_SUBSTANCES_STATS.gviCount >= 540);
  assert.ok(RISK_CHEMICAL_SUBSTANCES_STATS.bgvCount >= 90);

  const acetoneGvi = RISK_CHEMICAL_SUBSTANCES_CATALOG.find((item) => (
    item.type === "gvi" && item.casNumber === "67-64-1"
  ));
  assert.equal(acetoneGvi?.name, "Aceton");
  assert.equal(acetoneGvi?.gviPpm, "500");
  assert.equal(acetoneGvi?.gviMgM3, "1210");

  const dimethylformamideBgv = RISK_CHEMICAL_SUBSTANCES_CATALOG.find((item) => (
    item.type === "bgv"
    && item.casNumber === "68-12-2"
    && item.biomarker === "N-metilformamid"
    && item.sample === "mokraća"
  ));
  assert.equal(dimethylformamideBgv?.name, "N,N-Dimetilformamid");
  assert.match(dimethylformamideBgv?.biologicalLimit || "", /12 mg\/g kreatinina/);
});

test("chemical GVI resolution uses Prilog I before Prilog II/III fallback", () => {
  assert.equal(RISK_CHEMICAL_PRILOG_II_GUIDELINES.length, 5);

  const acetoneGvi = findRiskChemicalOfficialGvi({
    name: "Aceton",
    casNumber: "67-64-1",
    hazardStatements: ["H225", "H319", "H336"],
  });
  assert.equal(acetoneGvi?.source, "Narodne novine 91/2018, Prilog I");
  assert.equal(acetoneGvi?.gviPpm, "500");

  const carcinogenFallback = resolveRiskChemicalPrilogIiGuideline({
    name: "Tvar bez službenog GVI",
    hazardStatements: ["H350 Može uzrokovati rak.", "H319 Nadražuje oči."],
  });
  assert.equal(carcinogenFallback.division, "E");
  assert.deepEqual(carcinogenFallback.matchingHazardCodes, ["H350"]);

  const acuteToxicFallback = resolveRiskChemicalPrilogIiGuideline({
    hazardStatements: ["H302 Štetno ako se proguta."],
  });
  assert.equal(acuteToxicFallback.division, "B");

  const noSpecificHazardFallback = resolveRiskChemicalPrilogIiGuideline({
    name: "Tvar bez prepoznatih H oznaka",
  });
  assert.equal(noSpecificHazardFallback.division, "A");
});
