import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPubChemLookupPayload,
  extractPubChemSafetySummary,
  isValidCasNumber,
  normalizePubChemLookupQuery,
} from "../src/pubchemClient.js";

test("PubChem lookup maps CID, properties, synonyms and GHS safety summary", async () => {
  const calls = [];
  const fetchJson = async (url) => {
    const href = String(url);
    calls.push(href);
    if (href.includes("/compound/name/ethanol/cids/JSON")) {
      return { IdentifierList: { CID: [702] } };
    }
    if (href.includes("/compound/cid/702/property/")) {
      return {
        PropertyTable: {
          Properties: [{
            CID: 702,
            Title: "Ethanol",
            MolecularFormula: "C2H6O",
            MolecularWeight: "46.07",
            IUPACName: "ethanol",
            CanonicalSMILES: "CCO",
            InChIKey: "LFQSCWFLJHTTHZ-UHFFFAOYSA-N",
          }],
        },
      };
    }
    if (href.includes("/compound/cid/702/synonyms/JSON")) {
      return {
        InformationList: {
          Information: [{
            CID: 702,
            Synonym: ["ethanol", "64-17-5", "ethyl alcohol"],
          }],
        },
      };
    }
    if (href.includes("/pug_view/data/compound/702/JSON")) {
      return {
        Record: {
          Section: [{
            TOCHeading: "GHS Classification",
            Section: [{
              TOCHeading: "Signal",
              Information: [{ Value: { StringWithMarkup: [{ String: "Danger" }] } }],
            }, {
              TOCHeading: "Hazard Statements",
              Information: [{ Value: { StringWithMarkup: [{ String: "H225: Highly flammable liquid and vapor" }] } }],
            }, {
              TOCHeading: "Precautionary Statements",
              Information: [{ Value: { StringWithMarkup: [{ String: "P210: Keep away from heat, sparks and open flames" }] } }],
            }],
          }],
        },
      };
    }
    throw new Error(`Unexpected PubChem URL ${href}`);
  };

  const payload = await buildPubChemLookupPayload(" ethanol ", {
    includeSafety: true,
    fetchJson,
  });

  assert.equal(payload.ok, true);
  assert.equal(payload.provider, "pubchem");
  assert.equal(payload.compound.cid, 702);
  assert.equal(payload.compound.name, "Ethanol");
  assert.deepEqual(payload.compound.casNumbers, ["64-17-5"]);
  assert.equal(payload.compound.molecularFormula, "C2H6O");
  assert.match(payload.compound.structureImageUrl, /cid\/702\/PNG/);
  assert.deepEqual(payload.compound.safety.signalWords, ["Danger"]);
  assert.deepEqual(payload.compound.safety.hazardStatements, ["H225: Highly flammable liquid and vapor"]);
  assert.deepEqual(payload.compound.safety.precautionaryStatements, ["P210: Keep away from heat, sparks and open flames"]);
  assert.ok(calls.some((href) => href.includes("heading=GHS+Classification")));
});

test("PubChem safety extraction keeps hazard and precautionary sections", () => {
  const summary = extractPubChemSafetySummary({
    Record: {
      Section: [{
        TOCHeading: "Safety and Hazards",
        Section: [{
          TOCHeading: "GHS Hazard Statements",
          Information: [{ Value: { StringWithMarkup: [{ String: "Warning. H319: Causes serious eye irritation" }] } }],
        }, {
          TOCHeading: "Precautionary Statements",
          Information: [{ Value: { StringWithMarkup: [{ String: "P280: Wear protective gloves and eye protection" }] } }],
        }],
      }],
    },
  });

  assert.equal(summary.available, true);
  assert.deepEqual(summary.signalWords, ["Warning"]);
  assert.deepEqual(summary.hazardStatements, ["H319: Causes serious eye irritation"]);
  assert.deepEqual(summary.precautionaryStatements, ["P280: Wear protective gloves and eye protection"]);
  assert.equal(summary.sections.length, 2);
});

test("PubChem input helpers validate search text and CAS checksum", () => {
  assert.equal(normalizePubChemLookupQuery("  acetone  "), "acetone");
  assert.equal(isValidCasNumber("64-17-5"), true);
  assert.equal(isValidCasNumber("64-17-6"), false);
  assert.throws(() => normalizePubChemLookupQuery("a"), /barem dva znaka/);
});
