import test from "node:test";
import assert from "node:assert/strict";

import {
  RISK_CHEMICAL_SUBSTANCES_CATALOG,
  RISK_CHEMICAL_SUBSTANCES_SOURCE_URL,
  RISK_CHEMICAL_SUBSTANCES_STATS,
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
