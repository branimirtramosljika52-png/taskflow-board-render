import assert from "node:assert/strict";
import test from "node:test";

import {
  detectStlFileKind,
  extractStlChemicalDataFromText,
} from "../src/stlChemicalExtractor.js";

test("STL chemical extractor reads core SDS fields from text", () => {
  const payload = extractStlChemicalDataFromText(`
    SIGURNOSNO-TEHNICKI LIST
    Naziv proizvoda: Alcolan XL
    CAS: 64-17-5
    EC broj: 200-578-6
    REACH: 01-2119457610-43-0000

    ODJELJAK 2: Identifikacija opasnosti
    Opasnost
    GHS02
    H225: Lako zapaljiva tekucina i para.
    H319: Uzrokuje jako nadrazivanje oka.
    P210: Cuvati odvojeno od topline.

    ODJELJAK 8: Nadzor nad izlozenoscu/osobna zastita
    GVI 1000 ppm.
    Koristiti zastitne naocale i zastitne rukavice.

    ODJELJAK 7: Rukovanje i skladistenje
    Skladistiti u dobro prozracenom prostoru.
  `, { fileName: "alcolan.pdf" });

  assert.equal(payload.ok, true);
  assert.equal(payload.chemicals.length, 1);
  assert.equal(payload.chemicals[0].name, "Alcolan XL");
  assert.equal(payload.chemicals[0].casNumber, "64-17-5");
  assert.equal(payload.chemicals[0].ecNumber, "200-578-6");
  assert.equal(payload.chemicals[0].reachNumber, "01-2119457610-43-0000");
  assert.deepEqual(payload.chemicals[0].signalWords, ["Opasnost"]);
  assert.ok(payload.chemicals[0].hazardStatements.some((line) => line.includes("H225")));
  assert.ok(payload.chemicals[0].precautionaryStatements.some((line) => line.includes("P210")));
  assert.match(payload.chemicals[0].ppe, /rukavice/i);
  assert.match(payload.chemicals[0].storage, /prozracenom/i);
});

test("STL file kind detection accepts PDF and DOCX", () => {
  assert.equal(detectStlFileKind({ fileName: "stl.pdf" }), "pdf");
  assert.equal(detectStlFileKind({ fileName: "stl.docx" }), "docx");
  assert.equal(detectStlFileKind({ fileName: "stl.doc" }), "doc");
});
