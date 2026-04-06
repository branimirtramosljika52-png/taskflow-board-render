import assert from "node:assert/strict";
import test from "node:test";

import { InMemorySafetyRepository } from "../src/safetyRepository.js";

test("in-memory safety repository stores document records without RN number and lists newest first", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const actor = {
    id: "user-1",
    fullName: "Ana Admin",
  };

  await repository.createDocumentRecord(
    {
      organizationId: "org-1",
      templateId: "template-1",
      templateTitle: "SPR",
      documentType: "Zapisnik",
      companyId: "company-1",
      locationId: "location-1",
      inspectionDate: "2025-04-10",
      issuedDate: "2025-04-11",
      workOrderNumber: "26-111",
      fieldValues: {
        company_name: "Acme d.o.o.",
        uvod: "Stariji zapisnik",
      },
    },
    actor,
  );

  const newest = await repository.createDocumentRecord(
    {
      organizationId: "org-1",
      templateId: "template-1",
      templateTitle: "SPR",
      documentType: "Zapisnik",
      companyId: "company-1",
      locationId: "location-1",
      inspectionDate: "2026-04-10",
      issuedDate: "2026-04-11",
      workOrderNumber: "26-222",
      fieldValues: {
        company_name: "Acme d.o.o.",
        uvod: "Najnoviji zapisnik",
      },
      fieldSheets: {
        mjerenja: {
          columns: [
            { id: "c1", label: "Pozicija" },
            { id: "c2", label: "Vrijednost" },
          ],
          rows: [
            {
              id: "r1",
              cells: {
                c1: "P1",
                c2: "OK",
              },
            },
          ],
        },
      },
    },
    actor,
  );

  await repository.createDocumentRecord(
    {
      organizationId: "org-1",
      templateId: "template-1",
      templateTitle: "SPR",
      documentType: "Zapisnik",
      companyId: "company-1",
      locationId: "location-2",
      inspectionDate: "2026-04-12",
      issuedDate: "2026-04-13",
      fieldValues: {
        uvod: "Druga lokacija",
      },
    },
    actor,
  );

  const items = await repository.listDocumentRecords({
    organizationId: "org-1",
    templateId: "template-1",
    companyId: "company-1",
    locationId: "location-1",
  });

  assert.equal(items.length, 2);
  assert.equal(items[0].id, newest.id);
  assert.equal(items[0].fieldValues.uvod, "Najnoviji zapisnik");
  assert.equal(items[1].fieldValues.uvod, "Stariji zapisnik");
  assert.equal(items[0].createdByLabel, "Ana Admin");
  assert.equal(items[0].fieldSheets.mjerenja.rows[0].cells.c2, "OK");
  assert.equal("workOrderNumber" in items[0], false);
});

test("in-memory safety repository normalizes document record values and respects limit", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  await repository.createDocumentRecord({
    organizationId: "org-1",
    templateId: "template-2",
    templateTitle: "TZIN",
    companyId: "company-1",
    locationId: "location-1",
    inspectionDate: "2024-04-10",
    fieldValues: {
      tekst: "Prvi",
      prazno: "",
      potvrdjeno: true,
      broj: 12,
      lista: ["A", "B"],
    },
  });

  await repository.createDocumentRecord({
    organizationId: "org-1",
    templateId: "template-2",
    templateTitle: "TZIN",
    companyId: "company-1",
    locationId: "location-1",
    inspectionDate: "2025-04-10",
    fieldValues: {
      tekst: "Drugi",
    },
  });

  const items = await repository.listDocumentRecords({
    organizationId: "org-1",
    templateId: "template-2",
    companyId: "company-1",
    locationId: "location-1",
    limit: 1,
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].fieldValues.tekst, "Drugi");

  const allItems = await repository.listDocumentRecords({
    organizationId: "org-1",
    templateId: "template-2",
    companyId: "company-1",
    locationId: "location-1",
    limit: 10,
  });

  const older = allItems.find((item) => item.fieldValues.tekst === "Prvi");
  assert.ok(older);
  assert.equal(older.fieldValues.prazno, undefined);
  assert.equal(older.fieldValues.potvrdjeno, true);
  assert.equal(older.fieldValues.broj, 12);
  assert.deepEqual(older.fieldValues.lista, ["A", "B"]);
});

test("in-memory safety repository stores measurement sheet presets per template, company and location", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const actor = {
    id: "user-7",
    fullName: "Marko Admin",
  };

  const saved = await repository.saveMeasurementSheetPreset({
    organizationId: "org-1",
    templateId: "template-1",
    companyId: "company-1",
    locationId: "location-1",
    fieldKey: "field-measurements",
    title: "Excel tablica · Acme · Pogon",
    sheet: {
      columns: [
        {
          id: "c1",
          label: "Pozicija",
          validation: {
            type: "list",
            sourceMode: "custom",
            options: ["SPR", "TZIN"],
            allowCustom: false,
          },
        },
        { id: "c2", label: "Vrijednost" },
      ],
      rows: [
        {
          id: "r1",
          cells: {
            c1: "SPR",
            c2: "=VLOOKUP(\"SPR\";A1:B2;2;FALSE)",
          },
          formats: {
            c2: {
              fontFamily: "calibri",
              align: "center",
              bold: true,
            },
          },
        },
      ],
      merges: [
        {
          rowId: "r1",
          columnId: "c1",
          rowSpan: 1,
          colSpan: 2,
        },
      ],
    },
  }, actor);

  const updated = await repository.saveMeasurementSheetPreset({
    organizationId: "org-1",
    templateId: "template-1",
    companyId: "company-1",
    locationId: "location-1",
    fieldKey: "field-measurements",
    title: "Excel tablica · Acme · Pogon",
    sheet: {
      columns: [
        { id: "c1", label: "Pozicija" },
        { id: "c2", label: "Vrijednost" },
      ],
      rows: [
        {
          id: "r1",
          cells: {
            c1: "TZIN",
            c2: "24",
          },
        },
      ],
    },
  }, actor);

  const items = await repository.listMeasurementSheetPresets({
    organizationId: "org-1",
    templateId: "template-1",
    companyId: "company-1",
    locationId: "location-1",
    fieldKey: "field-measurements",
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].id, saved.id);
  assert.equal(updated.id, saved.id);
  assert.equal(items[0].createdByLabel, "Marko Admin");
  assert.equal(items[0].sheet.rows[0].cells.c1, "TZIN");
  assert.equal(items[0].sheet.columns[0].validation?.type, "none");
});
