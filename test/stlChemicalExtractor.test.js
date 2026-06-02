import assert from "node:assert/strict";
import test from "node:test";

import {
  detectStlFileKind,
  extractTextFromStlDocBuffer,
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

test("STL file kind detection accepts PDF, DOC and DOCX", () => {
  assert.equal(detectStlFileKind({ fileName: "stl.pdf" }), "pdf");
  assert.equal(detectStlFileKind({ fileName: "stl.docx" }), "docx");
  assert.equal(detectStlFileKind({ fileName: "stl.doc" }), "doc");
});

test("STL chemical extractor keeps one chemical per STL while preserving CAS candidates", () => {
  const payload = extractStlChemicalDataFromText(`
    SIGURNOSNO-TEHNICKI LIST
    Naziv proizvoda: Smjesa za odmascivanje

    ODJELJAK 3: Sastav/informacije o sastojcima
    1-butanol CAS br. 71-
    36-3 30 %
    Etanol CAS: 64-17-5 40 %

    ODJELJAK 2: Identifikacija opasnosti
    Opasnost
    GHS02
    H226: Zapaljiva tekucina i para.
  `, { fileName: "smjesa.pdf" });

  assert.equal(payload.ok, true);
  assert.equal(payload.chemicals.length, 1);
  assert.equal(payload.chemicals[0].name, "Smjesa za odmascivanje");
  assert.equal(payload.chemicals[0].casNumber, "71-36-3");
  assert.deepEqual(payload.chemicals[0].casNumbers, ["71-36-3", "64-17-5"]);
});

test("STL chemical extractor trims product name from single-line PDF text", () => {
  const payload = extractStlChemicalDataFromText(
    "SIGURNOSNO - TEHNICKI LIST sukladan Uredbi Stranica 2 od 22 Naziv proizvoda BENZEN KONCENTRAT Datum: 12.01.2022. Izdanje: 9 CAS br. 71-43-2 ODJELJAK 2 Elementi oznacavanja GHS02 H225 P210",
    { fileName: "benzen-koncentrat.pdf" },
  );

  assert.equal(payload.ok, true);
  assert.equal(payload.chemicals[0].name, "BENZEN KONCENTRAT");
  assert.equal(payload.chemicals[0].casNumber, "71-43-2");
});

test("STL chemical extractor rejects SDS title as chemical name", () => {
  const payload = extractStlChemicalDataFromText(
    "Sigurnosno-tehnički list sukladno Uredbi (EZ) br. 1907/2006 Stranica 1 od 12 CAS broj: 8006-61-9 ODJELJAK 2 Identifikacija opasnosti GHS02 H224 P210",
    { fileName: "SDB-27P5-HR-HR.pdf" },
  );

  assert.equal(payload.ok, true);
  assert.equal(payload.chemicals[0].name, "Benzin");
  assert.equal(payload.chemicals[0].casNumber, "8006-61-9");
});

test("legacy DOC extraction keeps readable STL identifiers", () => {
  const buffer = Buffer.from("SIGURNOSNO-TEHNICKI LIST\0Naziv proizvoda: Test\0CAS: 64-17-5", "utf16le");
  const text = extractTextFromStlDocBuffer(buffer);

  assert.match(text, /CAS/i);
  assert.match(text, /64-17-5/);
});
