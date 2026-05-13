import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemorySafetyRepository,
  mapStoredDocumentTemplateCustomField,
} from "../src/safetyRepository.js";

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

test("in-memory safety repository allows larger document record feeds for periodics", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  for (let index = 0; index < 1205; index += 1) {
    await repository.createDocumentRecord({
      organizationId: "org-1",
      templateId: "template-periodics",
      templateTitle: "SPR",
      companyId: "company-1",
      locationId: "location-1",
      inspectionDate: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
      fieldValues: {
        VRIJEDI_DO: "2027-05-13",
      },
    });
  }

  const regularItems = await repository.listDocumentRecords({
    organizationId: "org-1",
    limit: 1205,
  });
  const periodicsItems = await repository.listDocumentRecords({
    organizationId: "org-1",
    limit: 1205,
    periodics: true,
  });

  assert.equal(regularItems.length, 1000);
  assert.equal(periodicsItems.length, 1205);
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

test("stored document template field mapping preserves AI and builder metadata", () => {
  const mapped = mapStoredDocumentTemplateCustomField({
    id: "field-project-docs",
    key: "PROJEKTNA_DOKUMENTACIJA_14",
    label: "Projektna dokumentacija",
    wordLabel: "Projektna dokumentacija",
    type: "text",
    layoutWidth: "6",
    ai: {
      enabled: true,
      aiDescription: "Prepoznaj projektnu dokumentaciju iz starog zapisnika.",
      aiLookFor: ["projekt", "dokumentacija"],
      confidenceRequired: "high",
    },
    dropdownOptions: ["DA", "NE"],
    toggleTrueLabel: "Zadovoljava",
    toggleFalseLabel: "Ne zadovoljava",
    toggleTrueText: "Vrijedi do",
    toggleFalseText: "Obaviti ispitivanje nakon otklona.",
    legalFrameworkIds: ["legal-1"],
    defaultLegalFrameworkIds: ["legal-1"],
    columns: ["Pozicija", "Opis"],
  });

  assert.equal(mapped.ai.enabled, true);
  assert.equal(mapped.ai.confidenceRequired, "high");
  assert.deepEqual(mapped.ai.aiLookFor, ["projekt", "dokumentacija"]);
  assert.deepEqual(mapped.dropdownOptions, ["DA", "NE"]);
  assert.equal(mapped.toggleTrueLabel, "Zadovoljava");
  assert.equal(mapped.toggleFalseLabel, "Ne zadovoljava");
  assert.equal(mapped.toggleTrueText, "Vrijedi do");
  assert.equal(mapped.toggleFalseText, "Obaviti ispitivanje nakon otklona.");
  assert.deepEqual(mapped.legalFrameworkIds, ["legal-1"]);
  assert.deepEqual(mapped.defaultLegalFrameworkIds, ["legal-1"]);
  assert.deepEqual(mapped.columns, ["Pozicija", "Opis"]);
});

test("in-memory safety repository stores app role permissions per organization", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const saved = await repository.upsertAppRolePermissions({
    organizationId: "org-1",
    rolePermissions: [
      {
        profileRole: "manager",
        "people.manage": true,
        "vehicles.reserve": true,
        "settings.manage": false,
      },
    ],
  });

  assert.equal(saved.length, 7);
  assert.equal(saved.find((entry) => entry.profileRole === "manager")?.["people.manage"], true);
  assert.equal(saved.find((entry) => entry.profileRole === "manager")?.["vehicles.reserve"], true);
  assert.equal(saved.find((entry) => entry.profileRole === "manager")?.["settings.manage"], false);

  await repository.upsertAppRolePermissions({
    organizationId: "org-2",
    rolePermissions: [
      {
        profileRole: "junior_user",
        "serviceCatalog.create": true,
      },
    ],
  });
  await repository.upsertAppRolePermissions({
    organizationId: "org-1",
    rolePermissions: [
      {
        profileRole: "manager",
        "settings.manage": true,
      },
    ],
  });

  const snapshot = await repository.getSnapshot();
  const orgOneEntries = snapshot.appRolePermissions.filter((entry) => entry.organizationId === "org-1");
  const orgTwoEntries = snapshot.appRolePermissions.filter((entry) => entry.organizationId === "org-2");

  assert.equal(orgOneEntries.length, 7);
  assert.equal(orgTwoEntries.length, 7);
  assert.equal(orgOneEntries.find((entry) => entry.profileRole === "manager")?.["settings.manage"], true);
  assert.equal(orgOneEntries.find((entry) => entry.profileRole === "manager")?.["vehicles.reserve"], false);
  assert.equal(orgTwoEntries.find((entry) => entry.profileRole === "junior_user")?.["serviceCatalog.create"], true);
});

test("learning test scoring supports single, multiple and ordered answers", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  await repository.createLearningTestItem({
    organizationId: "org-1",
    title: "Sigurnost na radu",
    status: "active",
    questionItems: [
      {
        id: "q1",
        code: "P1",
        prompt: "Jedan odgovor",
        questionType: "single_choice",
        options: [
          { id: "q1-a", text: "A" },
          { id: "q1-b", text: "B", isCorrect: true },
        ],
      },
      {
        id: "q2",
        code: "P2",
        prompt: "Vise odgovora",
        questionType: "multiple_choice",
        options: [
          { id: "q2-a", text: "A", isCorrect: true },
          { id: "q2-b", text: "B" },
          { id: "q2-c", text: "C", isCorrect: true },
        ],
      },
      {
        id: "q3",
        code: "P3",
        prompt: "Redoslijed",
        questionType: "ordered_text",
        options: [
          { id: "q3-a", text: "Drugi", orderIndex: 2 },
          { id: "q3-b", text: "Prvi", orderIndex: 1 },
          { id: "q3-c", text: "Treci", orderIndex: 3 },
        ],
      },
    ],
    assignmentItems: [
      {
        assigneeType: "external",
        externalFullName: "Ivan Radnik",
        email: "ivan@example.hr",
        accessToken: "learning-token-1",
      },
    ],
  });

  const result = await repository.submitLearningTestAccess("learning-token-1", [
    { questionId: "q1", optionId: "q1-b" },
    { questionId: "q2", optionId: "q2-a" },
    { questionId: "q2", optionId: "q2-c" },
    { questionId: "q3", optionId: "q3-a", orderIndex: "2" },
    { questionId: "q3", optionId: "q3-b", orderIndex: "1" },
    { questionId: "q3", optionId: "q3-c", orderIndex: "3" },
  ]);

  assert.equal(result.submission.scorePercent, 100);
  assert.equal(result.assignment.scorePercent, 100);
});
