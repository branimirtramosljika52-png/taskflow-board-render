import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemorySafetyRepository,
  mapStoredDocumentTemplateCustomField,
} from "../src/safetyRepository.js";

test("in-memory safety repository stores global risk assessment template settings", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const saved = await repository.upsertRiskAssessmentTemplateSettings({
    organizationId: "org-1",
    reportTemplate: {
      title: "Globalni template procjene",
      wordTemplate: {
        fileName: "procjena-rizika.docx",
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 1234,
        dataUrl: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBA==",
      },
      sections: [
        { key: "cover", title: "Naslovnica" },
        { key: "jobs", title: "Analiza radnih mjesta", pageBreakBefore: true },
      ],
    },
  });

  assert.equal(saved.organizationId, "org-1");
  assert.equal(saved.reportTemplate.title, "Globalni template procjene");
  assert.equal(saved.reportTemplate.wordTemplate.fileName, "procjena-rizika.docx");
  assert.equal(saved.reportTemplate.sections[1].key, "jobs");
  assert.equal(saved.reportTemplate.sections[1].pageBreakBefore, true);

  const snapshot = await repository.getSnapshot();
  assert.equal(snapshot.riskAssessmentTemplateSettings.length, 1);
  assert.equal(snapshot.riskAssessmentTemplateSettings[0].reportTemplate.wordTemplate.fileName, "procjena-rizika.docx");
});

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

test("in-memory safety repository stores expiration date only from tracked periodics dates", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const partial = await repository.createDocumentRecord({
    organizationId: "org-1",
    templateId: "template-periodics",
    templateTitle: "SPR",
    companyId: "company-1",
    locationId: "location-1",
    inspectionDate: "2026-05-14",
    fieldValues: {
      VRIJEDI_DO: "14",
      __PERIODICS_TRACKED_DATES: [
        {
          fieldKey: "VRIJEDI_DO",
          label: "Vrijedi do",
          value: "14",
        },
      ],
    },
  });

  const complete = await repository.createDocumentRecord({
    organizationId: "org-1",
    templateId: "template-periodics",
    templateTitle: "SPR",
    companyId: "company-1",
    locationId: "location-1",
    inspectionDate: "2026-05-14",
    fieldValues: {
      VRIJEDI_DO: "14.05.2027",
      __PERIODICS_TRACKED_DATES: [
        {
          fieldKey: "VRIJEDI_DO",
          label: "Vrijedi do",
          value: "14.05.2027",
        },
      ],
    },
  });

  assert.equal(partial.expirationDate, null);
  assert.equal(complete.expirationDate, "2027-05-14");
});

test("in-memory safety repository returns expanded document record feed for periodics", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const periodicRecord = await repository.createDocumentRecord({
    organizationId: "org-1",
    templateId: "template-periodics",
    templateTitle: "SPR",
    companyId: "company-1",
    locationId: "location-1",
    inspectionDate: "2020-01-05",
    fieldValues: {
      "Vrijedi do": "2027-05-13",
    },
  });

  for (let index = 0; index < 1205; index += 1) {
    await repository.createDocumentRecord({
      organizationId: "org-1",
      templateId: "template-regular",
      templateTitle: "SPR",
      companyId: "company-1",
      locationId: "location-1",
      inspectionDate: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
      fieldValues: {
        napomena: `Redovni zapisnik ${index + 1}`,
      },
    });
  }

  const regularItems = await repository.listDocumentRecords({
    organizationId: "org-1",
    limit: 1205,
  });
  const periodicsItems = await repository.listDocumentRecords({
    organizationId: "org-1",
    limit: 2000,
    periodics: true,
  });

  assert.equal(regularItems.length, 1000);
  assert.equal(regularItems.some((item) => item.id === periodicRecord.id), false);
  assert.equal(periodicsItems.length, 1206);
  const persistedPeriodicRecord = periodicsItems.find((item) => item.id === periodicRecord.id);
  assert.ok(persistedPeriodicRecord);
  assert.equal(persistedPeriodicRecord.fieldValues["Vrijedi do"], "2027-05-13");
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
    signatureMetaFields: ["oib", "type", "passedOn"],
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
  assert.deepEqual(mapped.signatureMetaFields, ["oib", "type", "passedOn"]);
  assert.deepEqual(mapped.legalFrameworkIds, ["legal-1"]);
  assert.deepEqual(mapped.defaultLegalFrameworkIds, ["legal-1"]);
  assert.deepEqual(mapped.columns, ["Pozicija", "Opis"]);
});

test("periodics visual settings store work order point split as complementary percentages", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const saved = await repository.upsertPeriodicsVisualSettings({
    organizationId: "org-1",
    visualSettings: {
      workOrderFieldSharePercent: 65,
      workOrderServicePointFactors: {
        "id:service-1": "2.5",
      },
    },
  });

  assert.equal(saved.workOrderFieldSharePercent, 65);
  assert.equal(saved.workOrderCompletionSharePercent, 35);
  assert.equal(saved.workOrderServicePointFactors["id:service-1"], 2.5);

  const updated = await repository.upsertPeriodicsVisualSettings({
    organizationId: "org-1",
    visualSettings: {
      workOrderCompletionSharePercent: 45,
      workOrderServicePointFactors: {
        "id:service-1": "4",
      },
    },
  });

  assert.equal(updated.workOrderFieldSharePercent, 55);
  assert.equal(updated.workOrderCompletionSharePercent, 45);
  assert.equal(updated.workOrderServicePointFactors["id:service-1"], 4);
});

test("in-memory safety repository stores ISZNR API settings and preserves password when omitted", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const saved = await repository.upsertIsznrApiSettings({
    organizationId: "org-1",
    apiSettings: {
      baseUrl: "isznr.example.test/api/",
      username: "api-user",
      password: "secret-pass",
    },
  });

  assert.equal(saved.baseUrl, "https://isznr.example.test/api");
  assert.equal(saved.username, "api-user");
  assert.equal(saved.passwordSecret, "secret-pass");
  assert.equal(saved.hasPassword, true);

  const updated = await repository.upsertIsznrApiSettings({
    organizationId: "org-1",
    apiSettings: {
      baseUrl: "https://isznr.example.test/v2",
      username: "api-user-2",
    },
  });

  assert.equal(updated.baseUrl, "https://isznr.example.test/v2");
  assert.equal(updated.username, "api-user-2");
  assert.equal(updated.passwordSecret, "secret-pass");
  assert.equal(updated.hasPassword, true);
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

test("in-memory safety repository stores Jobs NexAI settings per organization", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const saved = await repository.upsertJobAiSettings({
    organizationId: "org-1",
    aiInstructions: {
      description: {
        instruction: "Pisi za procjenu rizika.",
        mustInclude: "rad kod klijenta",
        avoid: "ne izmisljati opremu",
        style: "short",
        textLength: "do 400 znakova",
      },
      "purPoint:19.1": {
        instruction: "Koristi za prometne poslove prema posebnom propisu.",
        workNote: "Poseban propis trazi provjeru zdravstvene sposobnosti.",
      },
      "riskRow:i opasnosti::2 opasnosti od padova::2.1.3::s visine": {
        probability: "v",
        consequence: "iš",
        workNote: "Popunjava se samo za stvarni rad na visini.",
        existingMeasures: "Koristiti zaštitu od pada.",
      },
    },
  });

  assert.equal(saved.aiInstructions.description.style, "short");
  assert.equal(saved.aiInstructions.description.textLength, "do 400 znakova");
  assert.equal(saved.aiInstructions["purPoint:19.1"].workNote, "Poseban propis trazi provjeru zdravstvene sposobnosti.");
  assert.equal(saved.aiInstructions["riskRow:i opasnosti::2 opasnosti od padova::2.1.3::s visine"].probability, "v");
  assert.equal(saved.aiInstructions["riskRow:i opasnosti::2 opasnosti od padova::2.1.3::s visine"].existingMeasures, "Koristiti zaštitu od pada.");

  const snapshot = await repository.getSnapshot();
  assert.equal(snapshot.jobAiSettings.length, 1);
  assert.equal(snapshot.jobAiSettings[0].aiInstructions.description.mustInclude, "rad kod klijenta");
  assert.equal(snapshot.jobAiSettings[0].aiInstructions.description.textLength, "do 400 znakova");
  assert.equal(snapshot.jobAiSettings[0].aiInstructions["purPoint:19.1"].instruction, "Koristi za prometne poslove prema posebnom propisu.");
  assert.equal(snapshot.jobAiSettings[0].aiInstructions["riskRow:i opasnosti::2 opasnosti od padova::2.1.3::s visine"].workNote, "Popunjava se samo za stvarni rad na visini.");
});

test("in-memory safety repository stores work equipment NexAI settings per organization", async () => {
  const repository = new InMemorySafetyRepository();
  await repository.init();

  const saved = await repository.upsertWorkEquipmentAiSettings({
    organizationId: "org-1",
    settings: {
      generalInstruction: "Read plates and technical documentation first.",
      extractionInstruction: "Split equipment when images show different serial numbers.",
      autoFillMode: "fill_empty",
      fieldInstructions: {
        serialNumber: {
          instruction: "Use serial number from the equipment plate.",
          mustInclude: "plate source",
        },
      },
      registryInstructions: {
        "mechanical:/api/v3/ro_mechanical/1": {
          instruction: "Use for forklifts with lifting mast.",
          confidenceRequired: "high",
        },
      },
      registers: [
        {
          path: "ro_mechanical_engineering_registers",
          label: "Strojarski dio",
          items: [
            {
              id: "1",
              iri: "/api/v3/ro_mechanical_engineering_registers/1",
              description: "Smještaj i osiguranje slobodnog prostora",
            },
          ],
        },
      ],
      profiles: [
        {
          name: "Forklift",
          aliases: ["vilicar", "forklift"],
          generalInstruction: "Treat this as mobile lifting equipment.",
          breakdownInstruction: "Check mast, forks, brakes and steering.",
          registerDefaults: {
            mechanical: ["/api/v3/ro_mechanical/1"],
          },
          fieldDefaults: {
            purposeDescription: "Transport and lifting of loads.",
          },
        },
      ],
    },
  });

  assert.equal(saved.generalInstruction, "Read plates and technical documentation first.");
  assert.equal(saved.fieldInstructions.serialNumber.mustInclude, "plate source");
  assert.equal(saved.registryInstructions["mechanical:/api/v3/ro_mechanical/1"].confidenceRequired, "high");
  assert.equal(saved.registers[0].items[0].iri, "/api/v3/ro_mechanical_engineering_registers/1");
  assert.equal(saved.profiles[0].aliases.length, 2);
  assert.equal(saved.profiles[0].registerDefaults.mechanical[0], "/api/v3/ro_mechanical/1");

  const snapshot = await repository.getSnapshot();
  assert.equal(snapshot.workEquipmentAiSettings.length, 1);
  assert.equal(snapshot.workEquipmentAiSettings[0].registers[0].items[0].description, "Smještaj i osiguranje slobodnog prostora");
  assert.equal(snapshot.workEquipmentAiSettings[0].profiles[0].fieldDefaults.purposeDescription, "Transport and lifting of loads.");
  assert.equal(snapshot.workEquipmentAiSettings[0].profiles[0].breakdownInstruction, "Check mast, forks, brakes and steering.");
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
