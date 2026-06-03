import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  RISK_BIOLOGICAL_AGENT_CATALOG,
  RISK_BIOLOGICAL_AGENT_CATEGORIES,
  RISK_BIOLOGICAL_AGENT_STATS,
  RISK_BIOLOGICAL_AGENTS_SOURCE_URL,
  RISK_BIOLOGICAL_INDUSTRIAL_ISOLATION_MEASURES,
  RISK_BIOLOGICAL_LAB_ISOLATION_MEASURES,
  RISK_BIOLOGICAL_NOTE_CODES,
} from "../src/riskBiologicalAgentCatalog.js";

test("biological agent catalog contains full NN 129/2020 Prilog III data", () => {
  assert.equal(RISK_BIOLOGICAL_AGENTS_SOURCE_URL, "https://narodne-novine.nn.hr/clanci/sluzbeni/2020_11_129_2459.html");
  assert.equal(RISK_BIOLOGICAL_AGENT_STATS.total, 509);
  assert.equal(RISK_BIOLOGICAL_AGENT_STATS.byGroup["2"], 358);
  assert.equal(RISK_BIOLOGICAL_AGENT_STATS.byGroup["3"], 138);
  assert.equal(RISK_BIOLOGICAL_AGENT_STATS.byGroup["4"], 13);
  assert.equal(RISK_BIOLOGICAL_AGENT_STATS.byCategory["Bakterije i slični organizmi"], 197);
  assert.equal(RISK_BIOLOGICAL_AGENT_STATS.byCategory.Virusi, 174);
  assert.deepEqual(RISK_BIOLOGICAL_AGENT_CATEGORIES, [
    "Bakterije i slični organizmi",
    "Virusi",
    "Agensi koji uzrokuju prionske bolesti",
    "Nametnici",
    "Gljivice",
  ]);
});

test("biological agent catalog keeps key classifications and notes", () => {
  assert.ok(RISK_BIOLOGICAL_AGENT_CATALOG.find((agent) => agent.name === "Bacillus anthracis" && agent.group === "3" && agent.noteCodes.includes("T")));
  assert.ok(RISK_BIOLOGICAL_AGENT_CATALOG.find((agent) => agent.name.includes("SARS-CoV-2") && agent.group === "3"));
  assert.ok(RISK_BIOLOGICAL_AGENT_CATALOG.find((agent) => agent.name === "Poliovirus, tip 2 (1)" && agent.group === "3" && agent.noteCodes.includes("V")));
  assert.ok(RISK_BIOLOGICAL_AGENT_CATALOG.find((agent) => agent.name.includes("Virus hepatitisa B") && agent.classification === "3 (**)" && agent.noteCodes.includes("V") && agent.noteCodes.includes("D")));
  assert.ok(RISK_BIOLOGICAL_AGENT_CATALOG.find((agent) => agent.name.includes("Hepacivirus C") && agent.classification === "3 (**)" && agent.noteCodes.includes("D")));
  assert.equal(RISK_BIOLOGICAL_NOTE_CODES.length, 4);
  assert.equal(RISK_BIOLOGICAL_LAB_ISOLATION_MEASURES.length, 15);
  assert.equal(RISK_BIOLOGICAL_INDUSTRIAL_ISOLATION_MEASURES.length, 5);
});

test("biological catalog source file is utf-8 clean", async () => {
  const source = await readFile(new URL("../src/riskBiologicalAgentCatalog.js", import.meta.url), "utf8");
  assert.equal(source.includes(String.fromCodePoint(0xfffd)), false);
  assert.equal(source.includes("opÄ"), false);
  assert.equal(source.includes("MoĹ"), false);
  assert.equal(source.includes("Teku?"), false);
});
