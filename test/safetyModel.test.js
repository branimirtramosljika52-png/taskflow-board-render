import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAbsenceBalanceSummaries,
  buildMonthlyWorkStatusReport,
  buildWorkOrderCalendarLanes,
  buildWorkOrderCalendarWeekColumns,
  buildWorkOrderCalendarMonthWeeks,
  buildWorkOrderCalendarTeamWeeks,
  buildWorkOrderMapMarkers,
  buildLocationContacts,
  createAbsenceEntry,
  createCompany,
  createContract,
  createDrawingProject,
  createContractTemplate,
  createDashboardWidget,
  createDocumentTemplate,
  createJob,
  createLegalFramework,
  createLearningTest,
  createLocation,
  createMeasurementEquipmentItem,
  createOffer,
  createPersonTrainingRecord,
  createPublicProcurement,
  createPurchaseOrder,
  createRiskAssessment,
  createReminder,
  createSafetyAuthorization,
  createServiceCatalogItem,
  createTodoTask,
  createTodoTaskComment,
  createVehicle,
  createVehicleReservation,
  createWorkOrder,
  deriveOfferInitials,
  filterAbsenceEntries,
  filterContracts,
  filterDrawingProjects,
  filterContractTemplates,
  filterReminders,
  filterDocumentTemplates,
  filterJobs,
  filterLegalFrameworks,
  filterMeasurementEquipmentItems,
  filterOffers,
  filterPersonTrainingRecords,
  filterPublicProcurements,
  filterPurchaseOrders,
  filterRiskAssessments,
  filterSafetyAuthorizations,
  filterServiceCatalogItems,
  filterTodoTasks,
  filterVehicles,
  filterWorkOrders,
  getDashboardWidgetData,
  getDashboardInsights,
  getDashboardStats,
  getVehicleAvailabilityStatus,
  getVehicleNextReservation,
  getWorkOrderCompletedServiceCount,
  getWorkOrderServiceItems,
  getWorkOrderServiceSummary,
  nextContractNumber,
  sortAbsenceEntries,
  groupWorkOrdersByExecutorSet,
  nextOfferNumber,
  nextPurchaseOrderNumber,
  nextWorkOrderNumber,
  normalizeWorkOrderMeasurementSheet,
  parseCoordinates,
  sortContracts,
  sortDrawingProjects,
  sortContractTemplates,
  sortReminders,
  sortDashboardWidgets,
  sortDocumentTemplates,
  sortJobs,
  sortLegalFrameworks,
  sortMeasurementEquipmentItems,
  sortOffers,
  sortPersonTrainingRecords,
  sortPublicProcurements,
  sortPurchaseOrders,
  sortSafetyAuthorizations,
  sortServiceCatalogItems,
  sortVehicles,
  sortTodoTasks,
  updateVehicle,
  updateVehicleReservation,
  syncLocationFieldsFromWorkOrder,
  updateAbsenceEntry,
  updateDashboardWidget,
  updateDocumentTemplate,
  updateJob,
  updateCompany,
  updateDrawingProject,
  updateLegalFramework,
  updateLocation,
  updateMeasurementEquipmentItem,
  updateOffer,
  updatePersonTrainingRecord,
  updatePublicProcurement,
  updatePurchaseOrder,
  updateReminder,
  updateRiskAssessment,
  updateSafetyAuthorization,
  updateServiceCatalogItem,
  updateTodoTask,
  updateWorkOrder,
} from "../src/safetyModel.js";

function buildState() {
  const company = createCompany(
    {
      name: "Acme d.o.o.",
      headquarters: "Zagreb",
      oib: "12345678901",
      mbs: "081521195",
      nkdActivity: "20.11 Proizvodnja industrijskih plinova",
      contractType: "Pausal",
      representative: "Ana Kovac",
    },
    [],
    () => "company-1",
    () => "2026-03-25T08:00:00.000Z",
  );

  const location = createLocation(
    {
      companyId: company.id,
      name: "Pogon Jankomir",
      region: "Zagreb",
      coordinates: "45.8000, 15.9000",
      contactName1: "Marko Horvat",
      contactPhone1: "+38591111222",
      contactEmail1: "marko@acme.hr",
      contactName2: "Iva Novak",
      contactPhone2: "+38598888777",
      contactEmail2: "iva@acme.hr",
    },
    { companies: [company], locations: [] },
    () => "location-1",
    () => "2026-03-25T08:05:00.000Z",
  );

  return {
    companies: [company],
    locations: [location],
    users: [],
    workOrders: [],
    reminders: [],
    todoTasks: [],
    offers: [],
    publicProcurements: [],
    purchaseOrders: [],
    jobs: [],
    contracts: [],
    drawings: [],
    contractTemplates: [],
    vehicles: [],
    legalFrameworks: [],
    serviceCatalog: [],
    measurementEquipment: [],
    safetyAuthorizations: [],
    documentTemplates: [],
    dashboardWidgets: [],
    activeOrganizationId: "org-1",
  };
}

test("jobs keep environment, conditions and hazard catalog details", () => {
  const state = buildState();
  const job = createJob(
    {
      organizationId: "org-1",
      title: "Serviser sustava dojave požara",
      status: "active",
      description: "Obavlja servis i provjeru sustava kod klijenata.",
      environment: {
        machinesEnabled: true,
        machinesOptions: ["ruÄŤni alat", "mjerna oprema"],
        substancesOptions: ["nema znaÄŤajnih tvari"],
        machinesText: "Ručni alat, mjerna oprema i ljestve.",
        workplaceEnabled: true,
        workplaceOptions: ["u zatvorenom", "na visini"],
        organizationEnabled: true,
        organizationOptions: ["terenski rad"],
        fieldWork: "često",
      },
      conditions: {
        trainingRequired: true,
        computerOver4h: false,
        bodyPositions: ["rad stojeći", "u pokretu"],
        importantFunctions: ["vid na daljinu"],
        workConditions: ["rad na visini"],
        notes: {
          trainingRequired: "Potrebno osposobljavanje za siguran rad.",
        },
      },
      aiInstructions: {
        description: {
          instruction: "Pisi kratko i strucno za procjenu rizika.",
          mustInclude: "rad kod klijenta",
          avoid: "ne izmisljati opremu",
          style: "short",
        },
      },
      hazards: [
        {
          catalogCode: "2.1.3",
          catalogLabel: "S visine",
          probability: "v",
          consequence: "sš",
          riskLevel: "Srednji rizik",
          measures: "Koristiti ispravne ljestve i zaštitu od pada.",
        },
      ],
    },
    state,
    () => "job-1",
    () => "2026-05-26T08:00:00.000Z",
  );

  assert.equal(job.id, "job-1");
  assert.equal(job.environment.machinesEnabled, true);
  assert.deepEqual(job.environment.machinesOptions, ["ruÄŤni alat", "mjerna oprema"]);
  assert.deepEqual(job.environment.substancesOptions, ["nema znaÄŤajnih tvari"]);
  assert.deepEqual(job.environment.workplaceOptions, ["u zatvorenom", "na visini"]);
  assert.deepEqual(job.environment.organizationOptions, ["terenski rad"]);
  assert.equal(job.conditions.trainingRequired, true);
  assert.equal(job.aiInstructions.description.style, "short");
  assert.equal(job.aiInstructions.description.mustInclude, "rad kod klijenta");
  assert.equal(job.hazards[0].catalogLabel, "S visine");

  const updated = updateJob(
    job,
    {
      status: "archived",
      hazards: [...job.hazards, { catalogCode: "3.1", catalogLabel: "Buka" }],
    },
    { ...state, jobs: [job] },
    () => "2026-05-26T09:00:00.000Z",
  );

  assert.equal(updated.status, "archived");
  assert.equal(updated.hazards.length, 2);
  assert.equal(filterJobs([updated], { query: "buka" }).length, 1);
  assert.equal(filterJobs([updated], { status: "active" }).length, 0);
  assert.equal(sortJobs([updated, job])[0].id, "job-1");
});

test("risk assessments keep detailed ARMOR job rows and eligibility data", () => {
  const state = buildState();
  const assessment = createRiskAssessment(
    {
      organizationId: "org-1",
      companyId: "company-1",
      locationId: "location-1",
      title: "Procjena rizika - pogon",
      jobs: [
        {
          jobTitle: "ASU operater",
          workerCount: "3",
          alcoholLimit: "0,00",
          specialWorkConditions: "da",
          specialWorkReason: "Rad s postrojenjem i plinovima.",
          increasedInsurance: "ne",
          requiredQualification: "Osposobljenost za rad na siguran način.",
          workOrganization: "Smjenski rad.",
          workEquipment: "Postrojenje, ručni alat, transportna sredstva.",
          workplaces: "Pogon, skladište i vanjski plato.",
          workplaceArrangement: "Prohodne komunikacije i označene zone.",
          harmfulSources: "Kisik, dušik, buka i mikroklima.",
          eligibility: {
            pregnantWorkers: { allowed: "ne", note: "Nije dopušten rad u zoni plinova." },
            minorWorkers: { allowed: "np", note: "" },
          },
          riskRows: [
            {
              code: "1.4.1",
              category: "II. ŠTETNOSTI",
              group: "1. Kemijske štetnosti",
              hazard: "Inertni zagušljivci",
              probability: "vv",
              consequence: "sš",
              riskLevel: "Veliki rizik",
              workNote: "Rad u blizini spremnika i instalacija.",
              measures: "Osigurati ventilaciju i nadzor atmosfere.",
            },
          ],
        },
      ],
    },
    state,
    () => "risk-1",
    () => "2026-05-02T08:00:00.000Z",
  );

  assert.equal(assessment.jobs[0].specialWorkConditions, "da");
  assert.equal(assessment.jobs[0].eligibility.pregnantWorkers.allowed, "ne");
  assert.equal(assessment.jobs[0].riskRows[0].group, "1. Kemijske štetnosti");
  assert.equal(assessment.jobs[0].riskRows[0].workNote, "Rad u blizini spremnika i instalacija.");

  const filtered = filterRiskAssessments([assessment], { query: "zagušljivci" });
  assert.equal(filtered.length, 1);
});

test("risk assessments keep organization units and PPE details", () => {
  const state = buildState();
  const assessment = createRiskAssessment(
    {
      organizationId: "org-1",
      companyId: "company-1",
      locationId: "location-1",
      title: "Procjena rizika - sistematizacija",
      organizationUnits: [
        {
          id: "unit-production",
          name: "Proizvodnja",
          description: "Organizacijska jedinica pogona.",
          responsiblePerson: "Voditelj pogona",
          workerCount: "12",
        },
      ],
      jobs: [
        {
          organizationUnitId: "unit-production",
          status: "ready",
          jobTitle: "Operater postrojenja",
          workplace: "Pogon",
          shortDescription: "Operater postrojenja.",
          workerCount: "3",
          shiftWork: true,
          trainings: "Osposobljavanje za rad na siguran nacin.",
          medicalExams: "Pregled za posebne uvjete rada.",
          ppeItems: [
            {
              catalogId: "safety-shoes",
              name: "Zastitna obuca",
              category: "Zastita nogu",
              bodyPart: "feet",
              norm: "HRN EN ISO 20345",
              required: true,
            },
          ],
          riskRows: [
            {
              code: "1.4.1",
              category: "II. STETNOSTI",
              group: "1. Kemijske stetnosti",
              hazard: "Inertni zagusljivci",
              source: "Spremnici i instalacije plina.",
              possibleConsequences: "Gusenje i ozljeda.",
              probability: "vv",
              consequence: "ss",
              riskLevel: "Veliki rizik",
              existingMeasures: "Ventilacija i nadzor atmosfere.",
              additionalMeasures: "Dodati alarm kisika.",
              deadline: "30 dana",
              responsiblePerson: "Voditelj pogona",
              controlMethod: "Interna kontrola",
            },
          ],
        },
      ],
    },
    state,
    () => "risk-organization-1",
    () => "2026-05-02T08:00:00.000Z",
  );

  assert.equal(assessment.organizationUnits[0].name, "Proizvodnja");
  assert.equal(assessment.jobs[0].organizationUnitId, "unit-production");
  assert.equal(assessment.jobs[0].shiftWork, true);
  assert.equal(assessment.jobs[0].ppeItems[0].norm, "HRN EN ISO 20345");
  assert.equal(assessment.jobs[0].riskRows[0].source, "Spremnici i instalacije plina.");
  assert.equal(filterRiskAssessments([assessment], { query: "Proizvodnja" }).length, 1);
  assert.equal(filterRiskAssessments([assessment], { query: "20345" }).length, 1);
});

test("risk assessments keep chemical registry data from PubChem and STL", () => {
  const state = buildState();
  const assessment = createRiskAssessment(
    {
      organizationId: "org-1",
      companyId: "company-1",
      locationId: "location-1",
      title: "Procjena rizika - kemikalije",
      biologicalHazards: "<p>Biološki agensi nisu utvrđeni u redovnom procesu rada.</p>",
      chemicals: [
        {
          name: "Ethanol",
          casNumber: "64-17-5",
          formula: "C2H6O",
          molecularWeight: "46.07",
          signalWords: ["Danger"],
          hazardStatements: ["H225: Highly flammable liquid and vapor"],
          precautionaryStatements: ["P210: Keep away from heat"],
          ppe: "Zastitne naocale i rukavice.",
          source: "PubChem",
          pubChemCid: "702",
          pubChemUrl: "https://pubchem.ncbi.nlm.nih.gov/compound/702",
          probability: "mv",
          consequence: "mš",
          riskLevel: "Mali rizik",
          officialGviPpm: "500",
          officialKgviPpm: "1000",
          officialLimitNote: "koža",
        },
        {
          name: "Alcolan XL",
          casNumber: "67-63-0",
          classification: "Flam. Liq. 2",
          hazardStatements: "H225\nH319",
          source: "STL",
          sourceFileName: "alcolan-stl.pdf",
          prilogIiDivision: "A",
          prilogIiVaporGvi: ">50-500 ppm",
          estimatedConsequenceSize: "Mala štetnost",
        },
      ],
    },
    state,
    () => "risk-chemicals-1",
    () => "2026-05-02T08:00:00.000Z",
  );

  assert.equal(assessment.chemicals.length, 2);
  assert.match(assessment.biologicalHazards, /Biološki agensi/);
  assert.equal(assessment.chemicals[0].pubChemCid, "702");
  assert.equal(assessment.chemicals[0].officialGviPpm, "500");
  assert.equal(assessment.chemicals[0].riskLevel, "Mali rizik");
  assert.deepEqual(assessment.chemicals[1].hazardStatements, ["H225", "H319"]);
  assert.equal(assessment.chemicals[1].prilogIiDivision, "A");
  assert.equal(filterRiskAssessments([assessment], { query: "64-17-5" }).length, 1);
  assert.equal(filterRiskAssessments([assessment], { query: "alcolan" }).length, 1);
  assert.equal(filterRiskAssessments([assessment], { query: "biološki agensi" }).length, 1);
});

test("risk assessments keep report templates with section placeholders", () => {
  const state = buildState();
  const assessment = createRiskAssessment(
    {
      organizationId: "org-1",
      companyId: "company-1",
      locationId: "location-1",
      title: "Procjena rizika - template",
      reportTemplate: {
        title: "Industrijski template procjene",
        description: "Veliki placeholderi za cijele odjeljke dokumenta.",
        wordTemplate: {
          fileName: "procjena-rizika.docx",
          fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize: 12345,
          dataUrl: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,AAAA",
          uploadedAt: "2026-05-02T07:30:00.000Z",
        },
        sections: [
          { key: "cover", title: "Naslovnica", placeholder: "{{RISK_COVER}}", includeInToc: false },
          { key: "jobs", title: "Analiza poslova", placeholder: "{{RISK_JOBS}}", pageBreakBefore: true },
          { key: "chemicals", title: "Kemikalije", placeholder: "{{RISK_CHEMICALS}}", enabled: false },
          { key: "biological", title: "Biološke štetnosti", placeholder: "{{RISK_BIOLOGICAL}}" },
        ],
      },
    },
    state,
    () => "risk-template-1",
    () => "2026-05-02T08:00:00.000Z",
  );

  assert.equal(assessment.reportTemplate.title, "Industrijski template procjene");
  assert.equal(assessment.reportTemplate.wordTemplate.fileName, "procjena-rizika.docx");
  assert.equal(assessment.reportTemplate.wordTemplate.fileSize, 12345);
  assert.equal(assessment.reportTemplate.sections.length, 4);
  assert.equal(assessment.reportTemplate.sections[1].key, "jobs");
  assert.equal(assessment.reportTemplate.sections[1].pageBreakBefore, true);
  assert.equal(assessment.reportTemplate.sections[2].placeholder, "{{RISK_CHEMICALS}}");
  assert.equal(assessment.reportTemplate.sections[2].enabled, false);
  assert.equal(assessment.reportTemplate.sections[3].key, "biological");
  assert.equal(filterRiskAssessments([assessment], { query: "RISK_JOBS" }).length, 1);
  assert.equal(filterRiskAssessments([assessment], { query: "procjena-rizika.docx" }).length, 1);

  const updated = updateRiskAssessment(
    assessment,
    {
      reportTemplate: {
        ...assessment.reportTemplate,
        sections: [
          ...assessment.reportTemplate.sections,
          { key: "ppe", title: "OZO", placeholder: "{{RISK_PPE}}" },
        ],
      },
    },
    { ...state, riskAssessments: [assessment] },
    () => "2026-05-02T09:00:00.000Z",
  );

  assert.equal(updated.reportTemplate.sections.at(-1).key, "ppe");
  assert.equal(updated.reportTemplate.sections.at(-1).order, 5);
});

test("risk assessments link only matching risk assessment work orders and keep employer data", () => {
  const state = {
    ...buildState(),
    users: [
      { id: "user-1", fullName: "Ana Horvat", isActive: true, organizationId: "org-1" },
      { id: "user-2", fullName: "Marko Novak", isActive: true, organizationId: "org-1" },
    ],
    workOrders: [
      {
        id: "work-order-1",
        companyId: "company-1",
        locationId: "location-1",
        workOrderNumber: "RN-2026-001",
        serviceItems: [{ name: "Procjena rizika" }],
      },
      {
        id: "work-order-2",
        companyId: "company-1",
        workOrderNumber: "RN-2026-002",
        serviceItems: [{ name: "Ispitivanje elektroinstalacija" }],
      },
    ],
  };

  const assessment = createRiskAssessment(
    {
      organizationId: "org-1",
      companyId: "company-1",
      locationId: "location-1",
      workOrderId: "work-order-1",
      assessmentDate: "28.05.2026",
      completionDate: "29.05.2026",
      teamLead: "Ana Horvat",
      teamLeadUserIds: ["user-1"],
      collaborators: "Marko Novak",
      collaboratorUserIds: ["user-2"],
      intro: `<p style="text-align:center;color:#111827">Uvod <strong>procjene</strong></p><script>alert(1)</script>`,
      generalData: `<table style="border-collapse:collapse"><tr><td style="border:1pt solid #000">Objekt</td></tr></table>`,
      conclusion: "Zaključak u običnom tekstu",
      employerData: {
        fullName: "Acme d.o.o.",
        address: "Zagreb",
        mbs: "081234567",
        oib: "12345678901",
        nkdActivity: "20.11 Proizvodnja industrijskih plinova",
        employeeCount: "9 radnika",
        headquarters: "Zagreb",
        detachedLocations: "Pogon Jankomir",
        locationScope: "selected",
        selectedLocationIds: ["location-1"],
        authorizedPersons: [
          { fullName: "Ivan Ivic", oib: "12345678903", jobTitle: "Direktor proizvodnje" },
        ],
        znrServiceMode: "Poslovi zastite na radu obavljaju se putem ovlastene osobe.",
        znrExperts: "Ana Horvat, strucnjak ZNR",
        znrRepresentatives: "Povjerenik radnika",
        znrCommitteeParticipation: "Odbor sudjeluje pregledom prijedloga mjera.",
        hasZnrAuthorization: true,
        znrAuthorizationDocument: {
          fileName: "ovlastenje.pdf",
          fileType: "application/pdf",
          fileSize: 42,
          dataUrl: "data:application/pdf;base64,JVBERi0x",
          uploadedAt: "2026-05-28T08:00:00.000Z",
        },
        assessmentMembers: "Ivana Peric",
        assessmentMemberUserIds: ["user-3"],
        companyCollaborators: [
          { fullName: "Marko Novak", title: "direktor", jobTitle: "Voditelj proizvodnje", oib: "12345678903" },
        ],
        workplaceJobs: [
          { jobTitle: "Operater postrojenja", maleCount: "7", femaleCount: "2", note: "Smjenski rad" },
        ],
        appendixChemicalRisk: "Kemijske stetnosti obradene su prema STL dokumentima.",
        appendixWorkerParticipation: "Radnici su sudjelovali kroz razgovor na mjestu rada.",
      },
      manualHandling: [
        {
          activity: "Premještanje boca",
          jobId: "job-asu",
          loadWeightKg: "18",
          transfersPerHour: "12",
          durationMinutes: "90",
          carryingDistanceMeters: "4",
          posture: "twist",
          existingMeasures: "Koristiti kolica i rad u paru.",
        },
      ],
    },
    state,
    () => "risk-1",
    () => "2026-05-28T08:00:00.000Z",
  );

  assert.equal(assessment.workOrderId, "work-order-1");
  assert.equal(assessment.workOrderNumber, "RN-2026-001");
  assert.equal(assessment.assessmentNumber, "RN-2026-001-PR");
  assert.equal(assessment.assessmentDate, "2026-05-28");
  assert.equal(assessment.completionDate, "2026-05-29");
  assert.deepEqual(assessment.teamLeadUserIds, ["user-1"]);
  assert.deepEqual(assessment.collaboratorUserIds, ["user-2"]);
  assert.equal(assessment.employerData.nkdActivity, "20.11 Proizvodnja industrijskih plinova");
  assert.deepEqual(assessment.employerData.selectedLocationIds, ["location-1"]);
  assert.equal(assessment.employerData.authorizedPersons[0].jobTitle, "Direktor proizvodnje");
  assert.equal(assessment.employerData.hasZnrAuthorization, true);
  assert.equal(assessment.employerData.znrAuthorizationDocument.fileName, "ovlastenje.pdf");
  assert.deepEqual(assessment.employerData.assessmentMemberUserIds, ["user-3"]);
  assert.equal(assessment.employerData.companyCollaborators[0].title, "direktor");
  assert.equal(assessment.employerData.workplaceJobs[0].femaleCount, "2");
  assert.equal(assessment.manualHandling[0].activity, "Premještanje boca");
  assert.equal(assessment.manualHandling[0].existingMeasures, "Koristiti kolica i rad u paru.");
  assert.match(assessment.intro, /style="text-align:center;color:#111827"/);
  assert.match(assessment.generalData, /<table style="border-collapse:collapse">/);
  assert.match(assessment.conclusion, /<p>Zaključak u običnom tekstu<\/p>/);
  assert.doesNotMatch(assessment.intro, /script|alert/i);
  assert.equal(filterRiskAssessments([assessment], { query: "Objekt" }).length, 1);
  assert.equal(filterRiskAssessments([assessment], { query: "Direktor proizvodnje" }).length, 1);
  assert.equal(filterRiskAssessments([assessment], { query: "Voditelj proizvodnje" }).length, 1);
  assert.equal(filterRiskAssessments([assessment], { query: "ovlastenje.pdf" }).length, 1);
  assert.equal(filterRiskAssessments([assessment], { query: "Operater postrojenja" }).length, 1);
  assert.equal(filterRiskAssessments([assessment], { query: "Premještanje boca" }).length, 1);

  assert.throws(() => createRiskAssessment(
    {
      organizationId: "org-1",
      companyId: "company-1",
      workOrderId: "work-order-2",
    },
    state,
    () => "risk-2",
    () => "2026-05-28T08:00:00.000Z",
  ), /procjene rizika/);
});

test("createCompany blocks duplicate OIB values", () => {
  const existing = [
    createCompany(
      {
        name: "Acme d.o.o.",
        oib: "12345678901",
      },
      [],
      () => "company-1",
      () => "2026-03-25T08:00:00.000Z",
    ),
  ];

  assert.throws(
    () => createCompany(
      {
        name: "Beta d.o.o.",
        oib: "12345678901",
      },
      existing,
      () => "company-2",
      () => "2026-03-25T08:10:00.000Z",
    ),
    /OIB/,
  );
});

test("companies keep uploaded logo data through create and update", () => {
  const company = createCompany(
    {
      name: "Logo Test d.o.o.",
      oib: "22345678901",
      mbs: "081521195",
      nkdActivity: "62.01 Računalno programiranje",
      logoDataUrl: "data:image/png;base64,AAA",
      employeeSize: "Do 49 zaposlenih",
      contractValidFrom: "2026-01-01",
      contractValidTo: "2026-12-31",
      managerUserIds: ["user-1", "user-2", "user-1"],
      managerUserLabels: ["Ana Kovac", "Marko Juric", "Ana Kovac"],
      representative: "Ana Kovac",
      representativeRole: "Direktorica",
      representativeOib: "12345678903",
    },
    [],
    () => "company-logo",
    () => "2026-03-30T09:00:00.000Z",
  );

  assert.equal(company.logoDataUrl, "data:image/png;base64,AAA");
  assert.equal(company.mbs, "081521195");
  assert.equal(company.nkdActivity, "62.01 Računalno programiranje");
  assert.equal(company.employeeSize, "do-49");
  assert.equal(company.contractValidFrom, "2026-01-01");
  assert.equal(company.contractValidTo, "2026-12-31");
  assert.deepEqual(company.managerUserIds, ["user-1", "user-2"]);
  assert.deepEqual(company.managerUserLabels, ["Ana Kovac", "Marko Juric"]);
  assert.equal(company.representative, "Ana Kovac");
  assert.equal(company.representativeRole, "Direktorica");
  assert.equal(company.representativeOib, "12345678903");

  const updated = updateCompany(
    company,
    {
      logoDataUrl: "data:image/png;base64,BBB",
      isActive: false,
      employeeSize: "preko 50",
      contractValidTo: "2027-12-31",
      managerUserIds: ["user-2", "user-3"],
      managerUserLabels: ["Marko Juric", "Ivana Horvat"],
      representativeRole: "Clan uprave",
      nkdActivity: "71.20 Tehničko ispitivanje i analiza",
    },
    [company],
    () => "2026-03-30T09:05:00.000Z",
  );

  assert.equal(updated.logoDataUrl, "data:image/png;base64,BBB");
  assert.equal(updated.isActive, false);
  assert.equal(updated.employeeSize, "preko-50");
  assert.equal(updated.contractValidFrom, "2026-01-01");
  assert.equal(updated.contractValidTo, "2027-12-31");
  assert.deepEqual(updated.managerUserIds, ["user-2", "user-3"]);
  assert.deepEqual(updated.managerUserLabels, ["Marko Juric", "Ivana Horvat"]);
  assert.equal(updated.representativeRole, "Clan uprave");
  assert.equal(updated.mbs, "081521195");
  assert.equal(updated.nkdActivity, "71.20 Tehničko ispitivanje i analiza");
  assert.equal(updated.representativeOib, "12345678903");
});

test("companies store contract billing settings and price list", () => {
  const company = createCompany(
    {
      name: "Billing Test d.o.o.",
      oib: "32345678901",
      contractName: "Godišnji servis",
      contractType: "Hybrid",
      contractNumber: "UG-2026-01",
      contractValidFrom: "2026-01-01",
      contractValidTo: "2026-12-31",
      contractValidForever: true,
      contractMonthlyPrice: "450 EUR",
      contractPriceList: [
        { id: "price-1", name: "Panik rasvjeta", unit: "kom", price: "25 EUR", note: "Po lokaciji" },
      ],
    },
    [],
    () => "company-billing",
    () => "2026-04-01T09:00:00.000Z",
  );

  assert.equal(company.contractName, "Godišnji servis");
  assert.equal(company.contractType, "Hybrid");
  assert.equal(company.contractValidForever, true);
  assert.equal(company.contractValidTo, "");
  assert.equal(company.contractMonthlyPrice, "450 EUR");
  assert.deepEqual(company.contractPriceList, [
    { id: "price-1", name: "Panik rasvjeta", unit: "kom", price: "25 EUR", note: "Po lokaciji" },
  ]);

  const updated = updateCompany(
    company,
    {
      contractValidForever: false,
      contractValidTo: "2027-12-31",
      contractMonthlyPrice: "500 EUR",
      contractPriceList: [
        { id: "price-2", name: "Tipkalo", unit: "kom", price: "15 EUR", note: "" },
      ],
    },
    [company],
    () => "2026-04-01T10:00:00.000Z",
  );

  assert.equal(updated.contractValidForever, false);
  assert.equal(updated.contractValidTo, "2027-12-31");
  assert.equal(updated.contractMonthlyPrice, "500 EUR");
  assert.deepEqual(updated.contractPriceList, [
    { id: "price-2", name: "Tipkalo", unit: "kom", price: "15 EUR", note: "" },
  ]);
});

test("createLocation requires a real company and keeps names unique per company", () => {
  const state = buildState();

  assert.throws(
    () => createLocation(
      {
        companyId: "missing",
        name: "Lokacija X",
      },
      state,
      () => "location-x",
      () => "2026-03-25T08:10:00.000Z",
    ),
    /tvrtka/i,
  );

  assert.throws(
    () => createLocation(
      {
        companyId: "company-1",
        name: "Pogon Jankomir",
      },
      state,
      () => "location-2",
      () => "2026-03-25T08:10:00.000Z",
    ),
    /lokacija/i,
  );
});

test("absence entries default to sensible statuses and support filtering/sorting", () => {
  const annualLeave = createAbsenceEntry(
    {
      organizationId: "org-1",
      userId: "user-1",
      userLabel: "Ana Savanovic",
      type: "annual_leave",
      startDate: "2026-04-06",
      endDate: "2026-04-08",
      note: "Godišnji odmor",
    },
    () => "absence-1",
    () => "2026-04-01T08:00:00.000Z",
  );

  const sickLeave = createAbsenceEntry(
    {
      organizationId: "org-1",
      userId: "user-2",
      userLabel: "Boris Vukorepa",
      type: "sick_leave",
      startDate: "2026-04-02",
      endDate: "2026-04-03",
      note: "Bolovanje",
    },
    () => "absence-2",
    () => "2026-04-01T09:00:00.000Z",
  );

  const updatedAnnualLeave = updateAbsenceEntry(
    annualLeave,
    {
      status: "approved",
      approvedByUserId: "admin-1",
      approvedByLabel: "Admin",
      approvedAt: "2026-04-02T10:00:00.000Z",
    },
    () => "2026-04-02T10:00:00.000Z",
  );
  const approvedSickLeave = updateAbsenceEntry(
    sickLeave,
    {
      status: "approved",
      approvedByUserId: "admin-1",
      approvedByLabel: "Admin",
      approvedAt: "2026-04-02T10:00:00.000Z",
    },
    () => "2026-04-02T10:00:00.000Z",
  );

  assert.equal(annualLeave.status, "pending");
  assert.equal(sickLeave.status, "pending");
  assert.equal(updatedAnnualLeave.status, "approved");
  assert.equal(updatedAnnualLeave.dayCount, 3);

  const filtered = filterAbsenceEntries(
    [updatedAnnualLeave, approvedSickLeave],
    { query: "bolovanje", status: "approved", type: "all", userId: "" },
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "absence-2");

  const sorted = sortAbsenceEntries([updatedAnnualLeave, approvedSickLeave]);
  assert.equal(sorted[0].id, "absence-1");
});

test("people training records normalize certificates, statuses and filters", () => {
  const state = buildState();
  const record = createPersonTrainingRecord(
    {
      organizationId: "org-1",
      companyId: "company-1",
      locationId: "location-1",
      firstName: "Ivan",
      lastName: "Horvat",
      fatherName: "Marko",
      oib: " 123 456 ",
      language: "hrvatski",
      birthDate: "1990-04-29",
      birthCountry: "Hrvatska",
      birthPlace: "Zagreb",
      arrivalDate: "2026-04-28",
      workPlace: "Pogon Jankomir",
      activityStatus: "DA",
      email: "IVAN@ACME.HR",
      jobTitle: "SkladiĹˇtar",
      trainingItems: [
        {
          type: "safe_work",
          issuedOn: "2026-01-15",
          validUntil: "2027-01-15",
          certificateNumber: "ZNR-1",
          workOrderNumber: "RN 26-615",
          details: {
            theoryDate: "2026-01-15",
            jobDescription: "Utovar robe i rad s paletnim viličarom",
            jobTitle: "SkladiÄąË‡tar",
          },
        },
        {
          type: "adr",
          validUntil: "2026-04-10",
          certificateNumber: "ADR-9",
        },
        {
          type: "medical_exam",
          validUntil: "2026-01-01",
        },
      ],
    },
    state,
    () => "training-1",
    () => "2026-04-28T08:00:00.000Z",
  );

  assert.equal(record.companyName, "Acme d.o.o.");
  assert.equal(record.locationName, "Pogon Jankomir");
  assert.equal(record.fullName, "Ivan Horvat");
  assert.equal(record.oib, "123456");
  assert.equal(record.fatherName, "Marko");
  assert.equal(record.language, "hrvatski");
  assert.equal(record.workPlace, "Pogon Jankomir");
  assert.equal(record.activityStatus, "DA");
  assert.equal(record.email, "ivan@acme.hr");
  assert.equal(record.trainingItems.length, 6);
  assert.equal(record.trainingItems.find((item) => item.type === "safe_work").recordNumber, "RN 26-615-ZNR-123456");
  assert.equal(record.trainingItems.find((item) => item.type === "safe_work").details.theoryDate, "2026-01-15");
  assert.equal(record.trainingItems.find((item) => item.type === "safe_work").details.jobDescription, "Utovar robe i rad s paletnim viličarom");
  assert.equal(record.trainingItems.find((item) => item.type === "safe_work").status, "valid");
  assert.equal(record.trainingItems.find((item) => item.type === "adr").status, "expired");
  assert.equal(record.trainingItems.find((item) => item.type === "medical_exam").status, "missing");

  const updated = updatePersonTrainingRecord(
    record,
    {
      trainingItems: record.trainingItems.map((item) => (
        item.type === "adr"
          ? { ...item, validUntil: "2027-04-10" }
          : item
      )),
    },
    state,
    () => "2026-04-28T09:00:00.000Z",
  );
  assert.equal(updated.trainingItems.find((item) => item.type === "adr").status, "valid");

  const renewed = updatePersonTrainingRecord(
    record,
    {
      trainingItems: record.trainingItems.map((item) => (
        item.type === "safe_work"
          ? {
            ...item,
            issuedOn: "2027-01-20",
            passedOn: "2027-01-20",
            validUntil: "2028-01-20",
            recordNumber: "RN 27-100-ZNR-123456",
          }
          : item
      )),
    },
    state,
    () => "2027-01-20T09:00:00.000Z",
  );
  const renewedSafeWork = renewed.trainingItems.find((item) => item.type === "safe_work");
  assert.equal(renewedSafeWork.recordNumber, "RN 27-100-ZNR-123456");
  assert.equal(renewedSafeWork.isActive, true);
  assert.equal(renewedSafeWork.history.length, 1);
  assert.equal(renewedSafeWork.history[0].recordNumber, "RN 26-615-ZNR-123456");
  assert.equal(renewedSafeWork.history[0].isActive, false);
  assert.equal(renewedSafeWork.history[0].archivedAt, "2027-01-20T09:00:00.000Z");

  const filtered = filterPersonTrainingRecords([record, updated], {
    query: "adr-9",
    companyId: "company-1",
    locationId: "all",
    trainingType: "adr",
    status: "expired",
  });
  assert.deepEqual(filtered.map((item) => item.id), ["training-1"]);

  const sorted = sortPersonTrainingRecords([updated, record]);
  assert.equal(sorted[0].fullName, "Ivan Horvat");
});

test("absence balances and monthly work report count regular work vs absence types", () => {
  const balances = [
    {
      id: "balance-1",
      organizationId: "org-1",
      userId: "user-1",
      userLabel: "Ana Savanovic",
      annualLeaveInitialDays: 24,
      sickLeaveInitialDays: 30,
    },
  ];
  const approvedAnnualLeave = createAbsenceEntry(
    {
      organizationId: "org-1",
      userId: "user-1",
      userLabel: "Ana Savanovic",
      type: "annual_leave",
      status: "approved",
      startDate: "2026-04-06",
      endDate: "2026-04-08",
    },
    () => "absence-approved-go",
    () => "2026-04-01T08:00:00.000Z",
  );
  const approvedSickLeave = createAbsenceEntry(
    {
      organizationId: "org-1",
      userId: "user-1",
      userLabel: "Ana Savanovic",
      type: "sick_leave",
      status: "approved",
      startDate: "2026-04-20",
      endDate: "2026-04-21",
    },
    () => "absence-approved-sick",
    () => "2026-04-01T08:00:00.000Z",
  );

  const summaries = buildAbsenceBalanceSummaries(
    balances,
    [approvedAnnualLeave, approvedSickLeave],
  );
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].annualLeaveUsedDays, 3);
  assert.equal(summaries[0].annualLeaveRemainingDays, 21);
  assert.equal(summaries[0].sickLeaveUsedDays, 2);
  assert.equal(summaries[0].sickLeaveRemainingDays, 28);

  const state = buildState();
  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      dueDate: "2026-04-10",
      workOrderNumber: "25-001",
      status: "Otvoreni RN",
      description: "Redovni pregled sustava",
      executors: ["Ana Savanovic"],
    },
    state,
    () => "work-order-1",
    () => "2026-04-01T10:00:00.000Z",
  );

  const report = buildMonthlyWorkStatusReport(
    {
      users: [{
        id: "user-1",
        isActive: true,
        fullName: "Ana Savanovic",
        email: "ana@example.com",
      }],
      absenceEntries: [approvedAnnualLeave, approvedSickLeave],
      absenceBalances: balances,
      workOrders: [workOrder],
    },
    "2026-04",
  );

  assert.equal(report.length, 1);
  assert.equal(report[0].absenceDays, 5);
  assert.equal(report[0].dayBreakdown.annual_leave, 3);
  assert.equal(report[0].dayBreakdown.sick_leave, 2);
  assert.equal(report[0].assignedWorkOrderCount, 1);
});

test("absence balances split carried and current annual leave with June deadline", () => {
  const balances = [
    {
      id: "balance-split-1",
      organizationId: "org-1",
      userId: "user-1",
      userLabel: "Ana Savanovic",
      annualLeaveCarriedDays: 4,
      annualLeaveCurrentDays: 20,
      sickLeaveInitialDays: 30,
    },
  ];
  const springLeave = createAbsenceEntry(
    {
      organizationId: "org-1",
      userId: "user-1",
      userLabel: "Ana Savanovic",
      type: "annual_leave",
      status: "approved",
      startDate: "2026-04-06",
      endDate: "2026-04-08",
    },
    () => "absence-spring-go",
    () => "2026-04-01T08:00:00.000Z",
  );
  const summerLeave = createAbsenceEntry(
    {
      organizationId: "org-1",
      userId: "user-1",
      userLabel: "Ana Savanovic",
      type: "annual_leave",
      status: "approved",
      startDate: "2026-07-06",
      endDate: "2026-07-07",
    },
    () => "absence-summer-go",
    () => "2026-04-01T08:00:00.000Z",
  );

  const beforeDeadline = buildAbsenceBalanceSummaries(balances, [springLeave, summerLeave], {
    asOfDate: "2026-05-31",
  })[0];
  assert.equal(beforeDeadline.annualLeaveInitialDays, 24);
  assert.equal(beforeDeadline.annualLeaveCarriedRemainingDays, 1);
  assert.equal(beforeDeadline.annualLeaveCurrentRemainingDays, 18);
  assert.equal(beforeDeadline.annualLeaveRemainingDays, 19);

  const afterDeadline = buildAbsenceBalanceSummaries(balances, [springLeave, summerLeave], {
    asOfDate: "2026-07-01",
  })[0];
  assert.equal(afterDeadline.annualLeaveExpiredDays, 1);
  assert.equal(afterDeadline.annualLeaveCarriedRemainingDays, 0);
  assert.equal(afterDeadline.annualLeaveRemainingDays, 18);
});

test("legal framework create, update, filter and sort work together", () => {
  const state = buildState();
  const first = createLegalFramework(
    {
      organizationId: "org-1",
      title: "Zakon o zaštiti od požara",
      category: "Zakon",
      status: "active",
      authority: "NN",
      referenceCode: "NN 92/10",
      reviewDate: "2026-04-05",
      tagsText: "vatra, zastita",
      documents: [
        {
          id: "legal-doc-1",
          fileName: "zakon-zastita-od-pozara.pdf",
          fileType: "application/pdf",
          dataUrl: "data:application/pdf;base64,AAAA",
        },
      ],
    },
    state,
    () => "legal-1",
    () => "2026-03-31T09:00:00.000Z",
  );
  const second = createLegalFramework(
    {
      organizationId: "org-1",
      title: "Pravilnik o internim pregledima",
      status: "inactive",
      authority: "Ministarstvo",
      referenceCode: "PR-22",
      reviewDate: "2026-06-10",
    },
    state,
    () => "legal-2",
    () => "2026-03-31T10:00:00.000Z",
  );

  const updatedSecond = updateLegalFramework(
    second,
    {
      status: "active",
      note: "Koristi se za servisne zapisnike.",
    },
    state,
    () => "2026-03-31T11:00:00.000Z",
  );

  const filtered = filterLegalFrameworks([first, updatedSecond], {
    query: "servisne",
    status: "active",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "legal-2");
  assert.equal(first.documents.length, 1);
  assert.equal(first.documents[0].fileName, "zakon-zastita-od-pozara.pdf");

  const filteredByDocument = filterLegalFrameworks([first, updatedSecond], {
    query: "pozara.pdf",
    status: "all",
  });

  assert.equal(filteredByDocument.length, 1);
  assert.equal(filteredByDocument[0].id, "legal-1");

  const sorted = sortLegalFrameworks([updatedSecond, first]);
  assert.equal(sorted[0].id, "legal-1");
});

test("document templates keep nested builder data and support filtering", () => {
  const state = buildState();
  const legalFramework = createLegalFramework(
    {
      organizationId: "org-1",
      title: "HRN EN 50172",
      status: "active",
    },
    state,
    () => "legal-1",
    () => "2026-03-31T09:00:00.000Z",
  );
  state.legalFrameworks = [legalFramework];

  const template = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "Zapisnik panik rasvjete",
      documentType: "Zapisnik",
      status: "draft",
      sampleCompanyId: "company-1",
      sampleLocationId: "location-1",
      selectedLegalFrameworkIds: ["legal-1"],
      customFields: [
        {
          label: "Tvrtka u aplikaciji",
          wordLabel: "Tvrtka",
          key: "tvrtka",
          source: "COMPANY_NAME",
          fieldHeight: 5,
          ai: {
            enabled: true,
            aiDescription: "Prepoznaj naziv narucitelja iz starog zapisnika.",
            aiLookFor: ["naziv tvrtke", "narucitelj"],
            confidenceRequired: "high",
          },
        },
        { label: "Mjesto pregleda", key: "mjesto_pregleda", source: "LOCATION_NAME", defaultValue: "Stubiste A" },
        { label: "Ispitano", key: "ispitano", type: "checkbox" },
        {
          label: "Alarm aktivan",
          key: "alarm_aktivan",
          type: "toggle",
          toggleTrueLabel: "Zadovoljava",
          toggleFalseLabel: "Ne zadovoljava",
          toggleTrueText: "Vrijedi do",
          toggleFalseText: "Obaviti ispitivanje nakon otklona.",
        },
        {
          label: "Potpis ispitivaca",
          wordLabel: "Potpis ispitivaca elektro",
          key: "potpis_ispitivaca",
          type: "inspector_signature",
          signatureArea: "elektro",
          fieldHeight: 6,
          signatureMetaFields: ["oib", "type", "data1", "data2", "data3", "passedOn"],
        },
        {
          label: "Potpis nositelja",
          wordLabel: "Potpis nositelja elektro",
          key: "potpis_nositelja",
          type: "authorization_holder_signature",
          signatureArea: "elektro",
        },
        {
          label: "Ispitivači tipkala",
          wordLabel: "Ispitivači tipkala",
          key: "ispitivaci_tipkala",
          type: "qualified_inspectors",
          signatureArea: "tipkalo",
        },
        {
          label: "Excel mjerenja",
          key: "excel_mjerenja",
          type: "measurement_table",
          columns: ["Pozicija", "Vrijednost"],
          rowCount: 8,
          sheet: {
            columns: [
              {
                id: "measurement-column-1",
                label: "Pozicija",
                placeholder: "Pozicija",
                width: 220,
                validation: {
                  type: "list",
                  sourceMode: "custom",
                  options: ["Panik", "Tipkalo"],
                  allowCustom: false,
                },
                aiMapping: {
                  enabled: true,
                  key: "mjerno_mjesto",
                  label: "Mjerno mjesto",
                  aiDescription: "Prepoznaj naziv mjernog mjesta iz tablice.",
                  confidenceRequired: "medium",
                },
              },
              { id: "measurement-column-2", label: "Vrijednost", placeholder: "Vrijednost", width: 160 },
            ],
            rows: [
              {
                id: "measurement-row-1",
                cells: {
                  "measurement-column-1": "Panik rasvjeta 1",
                  "measurement-column-2": "OK",
                },
              },
              {
                id: "measurement-row-2",
                cells: {
                  "measurement-column-1": "",
                  "measurement-column-2": "",
                },
              },
            ],
            merges: [
              {
                rowId: "measurement-row-1",
                columnId: "measurement-column-1",
                rowSpan: 1,
                colSpan: 2,
              },
            ],
          },
        },
        {
          label: "Ocjena",
          key: "ocjena",
          type: "dropdown",
          dropdownOptions: ["Ispravno", "Neispravno", "Ispravno"],
        },
      ],
      equipmentItems: [
        { name: "Panik rasvjeta", code: "PR-01", quantity: 12, note: "Etaža 1" },
      ],
      sections: [
        { type: "rich_text", title: "Uvod", body: "Pregled sustava {{COMPANY_NAME}}" },
        { type: "measurement_table", title: "Mjerenja", columns: ["Pozicija", "Vrijednost"], rowCount: 8 },
      ],
      referenceDocument: {
        fileName: "zapisnik-reference.html",
        fileType: "text/html",
        dataUrl: "data:text/html;base64,PGgxPlRlc3Q8L2gxPg==",
        builderDocument: [
          {
            id: "page-1",
            type: "page",
            props: { headerEnabled: true },
            layout: { width: 794, height: 1123 },
            styles: {},
            children: [
              {
                id: "grid-1",
                type: "grid",
                props: {
                  rows: 6,
                  columns: 8,
                  merges: [{ row: 1, column: 1, rowSpan: 1, colSpan: 3 }],
                  cells: {
                    "1:1": { content: "{{TVRTKA}}", styles: { backgroundColor: "#e5e7eb" } },
                  },
                },
                styles: {},
                layout: { x: 40, y: 120, width: 700, height: 260 },
                children: [],
              },
            ],
          },
        ],
      },
      createdByUserId: "user-1",
      createdByLabel: "Ana Admin",
    },
    state,
    () => "template-1",
    () => "2026-03-31T12:00:00.000Z",
  );

  assert.equal(template.customFields.length, 9);
  assert.equal(template.customFields[0].source, "COMPANY_NAME");
  assert.equal(template.customFields[0].wordLabel, "Tvrtka");
  assert.equal(template.customFields[0].fieldHeight, 5);
  assert.equal(template.customFields[0].ai.enabled, true);
  assert.equal(template.customFields[0].ai.confidenceRequired, "high");
  assert.deepEqual(template.customFields[0].ai.aiLookFor, ["naziv tvrtke", "narucitelj"]);
  assert.equal(template.customFields[2].type, "checkbox");
  assert.equal(template.customFields[3].type, "toggle");
  assert.equal(template.customFields[3].toggleTrueLabel, "Zadovoljava");
  assert.equal(template.customFields[3].toggleFalseLabel, "Ne zadovoljava");
  assert.equal(template.customFields[3].toggleTrueText, "Vrijedi do");
  assert.equal(template.customFields[3].toggleFalseText, "Obaviti ispitivanje nakon otklona.");
  assert.equal(template.customFields[4].type, "inspector_signature");
  assert.equal(template.customFields[4].signatureArea, "elektro");
  assert.equal(template.customFields[4].fieldHeight, 6);
  assert.deepEqual(template.customFields[4].signatureMetaFields, ["oib", "type", "data1", "data2", "data3", "passedOn"]);
  assert.equal(template.customFields[5].type, "authorization_holder_signature");
  assert.equal(template.customFields[5].signatureArea, "elektro");
  assert.equal(template.customFields[6].type, "qualified_inspectors");
  assert.equal(template.customFields[6].signatureArea, "tipkalo");
  assert.equal(template.customFields[7].type, "measurement_table");
  assert.equal(template.customFields[7].rowCount, 8);
  assert.equal(template.customFields[7].sheet?.columns.length, 2);
  assert.equal(template.customFields[7].sheet?.rows[0]?.cells["measurement-column-1"], "Panik rasvjeta 1");
  assert.equal(template.customFields[7].sheet?.merges[0]?.colSpan, 2);
  assert.equal(template.customFields[7].sheet?.columns[0]?.validation?.type, "list");
  assert.equal(template.customFields[7].sheet?.columns[0]?.validation?.allowCustom, false);
  assert.equal(template.customFields[7].sheet?.columns[0]?.aiMapping?.enabled, true);
  assert.equal(template.customFields[7].sheet?.columns[0]?.aiMapping?.key, "mjerno_mjesto");
  assert.equal(template.customFields[7].sheet?.columns[0]?.aiMapping?.confidenceRequired, "medium");
  assert.equal(template.customFields[8].type, "dropdown");
  assert.deepEqual(template.customFields[8].dropdownOptions, ["Ispravno", "Neispravno"]);
  assert.equal(template.equipmentItems.length, 1);
  assert.equal(template.sections[1].rowCount, 8);
  assert.equal(template.referenceDocument?.fileName, "zapisnik-reference.html");
  assert.equal(template.referenceDocument?.builderDocument?.[0]?.children?.[0]?.props?.merges?.[0]?.colSpan, 3);
  assert.equal(template.referenceDocument?.builderDocument?.[0]?.children?.[0]?.props?.cells?.["1:1"]?.content, "{{TVRTKA}}");

  const updated = updateDocumentTemplate(
    template,
    {
      status: "active",
      description: "Za redovne preglede i generiranje Word izvjestaja.",
    },
    {
      ...state,
      documentTemplates: [template],
    },
    () => "2026-03-31T13:00:00.000Z",
  );

  assert.equal(updated.status, "active");
  assert.equal(updated.referenceDocument?.builderDocument?.[0]?.children?.[0]?.props?.merges?.[0]?.colSpan, 3);

  const filtered = filterDocumentTemplates([updated], {
    query: "Tvrtka u aplikaciji",
    status: "active",
  });
  assert.equal(filtered.length, 1);

  const filteredByWordLabel = filterDocumentTemplates([updated], {
    query: "Tvrtka",
    status: "active",
  });
  assert.equal(filteredByWordLabel.length, 1);

  const sorted = sortDocumentTemplates([updated]);
  assert.equal(sorted[0].id, "template-1");

  const builderOnlyReference = updateDocumentTemplate(
    updated,
    {
      referenceDocument: {
        fileName: "builder-only.html",
        fileType: "text/html",
        builderDocument: template.referenceDocument.builderDocument,
      },
    },
    {
      ...state,
      documentTemplates: [updated],
    },
    () => "2026-03-31T14:00:00.000Z",
  );

  assert.equal(builderOnlyReference.referenceDocument?.dataUrl, "");
  assert.equal(builderOnlyReference.referenceDocument?.builderDocument?.[0]?.children?.[0]?.props?.merges?.[0]?.colSpan, 3);
});

test("document templates persist selected signature meta fields", () => {
  const state = buildState();
  const template = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "Signature meta template",
      customFields: [
        {
          label: "Ispitivanje obavili",
          key: "ISPITIVANJE_OBAVILI",
          type: "qualified_inspectors",
          signatureMetaFields: ["oib", "type", "data1", "classCode", "urbroj", "eBroj", "data3", "passedOn", "unknown"],
        },
      ],
    },
    state,
    () => "template-signature-meta",
    () => "2026-05-22T08:00:00.000Z",
  );

  assert.deepEqual(template.customFields[0].signatureMetaFields, ["oib", "type", "data1", "data2", "data3", "passedOn"]);

  const updated = updateDocumentTemplate(
    template,
    {
      customFields: [
        {
          ...template.customFields[0],
          signatureMetaFields: ["title", "oib"],
        },
      ],
    },
    {
      ...state,
      documentTemplates: [template],
    },
    () => "2026-05-22T08:05:00.000Z",
  );

  assert.deepEqual(updated.customFields[0].signatureMetaFields, ["title", "oib"]);
});

test("document templates keep Word reference documents for template generation", () => {
  const state = buildState();
  const template = createDocumentTemplate(
    {
      organizationId: state.activeOrganizationId,
      title: "Legacy Word zapisnik",
      customFields: [{ label: "Tvrtka", key: "COMPANY_NAME", type: "text" }],
      referenceDocument: {
        fileName: "zapisnik-reference.docx",
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        dataUrl: "data:application/octet-stream;base64,AAA",
      },
      createdByUserId: "user-1",
      createdByLabel: "Ana Admin",
    },
    state,
    () => "template-legacy",
    () => "2026-03-31T12:00:00.000Z",
  );

  assert.equal(template.referenceDocument?.fileName, "zapisnik-reference.docx");
  assert.equal(template.referenceDocument?.builderDocument?.length, 0);

  const updated = updateDocumentTemplate(
    {
      ...template,
      referenceDocument: {
        fileName: "stari-template.docx",
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        dataUrl: "data:application/octet-stream;base64,BBB",
      },
    },
    { title: "Legacy Word zapisnik 2" },
    {
      ...state,
      documentTemplates: [template],
    },
    () => "2026-03-31T13:00:00.000Z",
  );

  assert.equal(updated.referenceDocument?.fileName, "stari-template.docx");
  assert.equal(updated.referenceDocument?.builderDocument?.length, 0);
});

test("document template AI field settings survive custom field only updates", () => {
  const state = buildState();
  const template = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "TZIN1",
      documentType: "Zapisnik",
      status: "active",
      customFields: [
        {
          id: "field-project-docs",
          label: "Projektna dokumentacija",
          key: "projektna_dokumentacija",
          type: "text",
        },
      ],
    },
    state,
    () => "template-ai-1",
    () => "2026-04-28T08:00:00.000Z",
  );

  const updated = updateDocumentTemplate(
    template,
    {
      customFields: [
        {
          ...template.customFields[0],
          ai: {
            enabled: true,
            aiDescription: "Prepoznaj projektnu dokumentaciju iz starog zapisnika.",
            aiLookFor: ["projekt", "dokumentacija"],
            confidenceRequired: "high",
          },
        },
      ],
    },
    {
      ...state,
      documentTemplates: [template],
    },
    () => "2026-04-28T09:00:00.000Z",
  );

  assert.equal(updated.title, "TZIN1");
  assert.equal(updated.customFields[0].id, "field-project-docs");
  assert.equal(updated.customFields[0].ai.enabled, true);
  assert.equal(updated.customFields[0].ai.confidenceRequired, "high");
  assert.deepEqual(updated.customFields[0].ai.aiLookFor, ["projekt", "dokumentacija"]);
});

test("service catalog keeps linked templates and supports filtering and sorting", () => {
  const state = buildState();
  const template = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "Zapisnik radne opreme",
      documentType: "Zapisnik",
      status: "active",
      sampleCompanyId: "company-1",
      sampleLocationId: "location-1",
    },
    state,
    () => "template-1",
    () => "2026-03-31T08:00:00.000Z",
  );
  state.documentTemplates = [template];

  const service = createServiceCatalogItem(
    {
      organizationId: "org-1",
      name: "Ispitivanje radne opreme",
      serviceCode: "IRO-001",
      status: "active",
      linkedTemplateIds: ["template-1"],
      linkedQualificationKeys: ["Radna oprema", "radni_okolis"],
      validityMonths: "24",
      note: "Redovni pregled",
    },
    state,
    () => "service-1",
    () => "2026-03-31T08:05:00.000Z",
  );

  assert.equal(service.linkedTemplateIds.length, 1);
  assert.equal(service.linkedTemplateTitles[0], "Zapisnik radne opreme");
  assert.deepEqual(service.linkedQualificationKeys, ["radna_oprema", "radni_okolis"]);
  assert.equal(service.validityMonths, "24");

  const updated = updateServiceCatalogItem(
    service,
    {
      status: "inactive",
      linkedQualificationKeys: ["panic_rasvjeta"],
      note: "Privremeno ugašena usluga",
    },
    {
      ...state,
      serviceCatalog: [service],
    },
    () => "2026-03-31T09:00:00.000Z",
  );

  assert.equal(updated.status, "inactive");
  assert.equal(updated.note, "Privremeno ugašena usluga");
  assert.deepEqual(updated.linkedQualificationKeys, ["panic_rasvjeta"]);
  assert.equal(updated.validityMonths, "24");

  const filtered = filterServiceCatalogItems([service, updated], {
    query: "privremeno",
    status: "inactive",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "service-1");

  const qualificationFiltered = filterServiceCatalogItems([service, updated], {
    query: "panic_rasvjeta",
    status: "all",
  });
  assert.equal(qualificationFiltered.length, 1);
  assert.equal(qualificationFiltered[0].id, "service-1");

  const sorted = sortServiceCatalogItems([
    { ...service, id: "service-2", serviceCode: "ZNR-200", name: "Zaštita na radu" },
    updated,
  ]);
  assert.equal(sorted[0].serviceCode, "ZNR-200");
});

test("service catalog supports service types and clears incompatible links", () => {
  const state = buildState();
  const template = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "SPR zapisnik",
      documentType: "Zapisnik",
      status: "active",
      sampleCompanyId: "company-1",
      sampleLocationId: "location-1",
    },
    state,
    () => "template-1",
    () => "2026-03-31T08:00:00.000Z",
  );
  const learningTest = createLearningTest(
    {
      organizationId: "org-1",
      title: "Osposobljavanje ZNR",
      status: "active",
    },
    state,
    () => "test-1",
    () => "2026-03-31T08:10:00.000Z",
  );
  state.documentTemplates = [template];
  state.learningTests = [learningTest];

  const inspectionService = createServiceCatalogItem(
    {
      organizationId: "org-1",
      name: "Ispitivanje panik rasvjete",
      serviceCode: "SPR",
      status: "active",
      serviceType: "inspection",
      linkedTemplateIds: ["template-1"],
      linkedLearningTestIds: ["test-1"],
    },
    state,
    () => "service-1",
    () => "2026-03-31T08:20:00.000Z",
  );

  assert.equal(inspectionService.serviceType, "inspection");
  assert.equal(inspectionService.isTraining, false);
  assert.deepEqual(inspectionService.linkedTemplateIds, ["template-1"]);
  assert.deepEqual(inspectionService.linkedLearningTestIds, []);

  const znrService = updateServiceCatalogItem(
    inspectionService,
    {
      serviceType: "znr",
      linkedLearningTestIds: ["test-1"],
    },
    {
      ...state,
      serviceCatalog: [inspectionService],
    },
    () => "2026-03-31T09:00:00.000Z",
  );

  assert.equal(znrService.serviceType, "znr");
  assert.equal(znrService.isTraining, true);
  assert.deepEqual(znrService.linkedTemplateIds, []);
  assert.deepEqual(znrService.linkedLearningTestIds, ["test-1"]);
});

test("measurement sheet normalization keeps validation metadata on editable columns", () => {
  const normalized = normalizeWorkOrderMeasurementSheet({
    columns: [
      {
        id: "col-1",
        label: "Oprema",
        validation: {
          type: "list",
          sourceMode: "custom",
          options: ["A", "B", "C"],
          allowCustom: false,
        },
      },
      {
        id: "col-2",
        label: "Lookup",
        validation: {
          type: "list",
          sourceMode: "column",
          sourceColumnId: "col-1",
          allowCustom: true,
        },
      },
    ],
    rows: [
      {
        id: "row-1",
        cells: {
          "col-1": "A",
          "col-2": "A",
        },
      },
    ],
  });

  assert.equal(normalized.columns[0].validation.type, "list");
  assert.deepEqual(normalized.columns[0].validation.options, ["A", "B", "C"]);
  assert.equal(normalized.columns[0].validation.allowCustom, false);
  assert.equal(normalized.columns[1].validation.sourceMode, "column");
  assert.equal(normalized.columns[1].validation.sourceColumnId, "col-1");
});

test("createWorkOrder pulls snapshot data from selected company and location", () => {
  const state = buildState();

  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      status: "Otvoreni RN",
      priority: "High",
      description: "Redovni pregled zastite",
    },
    state,
    () => "work-order-1",
    "RN-00001",
    () => "2026-03-25T09:00:00.000Z",
  );

  assert.equal(workOrder.companyName, "Acme d.o.o.");
  assert.equal(workOrder.companyOib, "12345678901");
  assert.equal(workOrder.locationName, "Pogon Jankomir");
  assert.equal(workOrder.region, "Zagreb");
  assert.equal(workOrder.contactSlot, 1);
  assert.equal(workOrder.contactName, "Marko Horvat");
  assert.equal(workOrder.contactPhone, "+38591111222");
  assert.equal(workOrder.teamLabel, "");
});

test("createWorkOrder keeps all selected executors and preserves legacy executor slots", () => {
  const state = buildState();

  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Nalog s više izvršitelja",
      executors: ["Ana Kovac", "Marko Horvat", "Iva Novak", "Petra Bencic"],
    },
    state,
    () => "work-order-many-executors",
    "RN-00011",
    () => "2026-03-25T09:15:00.000Z",
  );

  assert.deepEqual(workOrder.executors, ["Ana Kovac", "Marko Horvat", "Iva Novak", "Petra Bencic"]);
  assert.equal(workOrder.executor1, "Ana Kovac");
  assert.equal(workOrder.executor2, "Marko Horvat");
});

test("updateWorkOrder refreshes snapshot fields when location and contact change", () => {
  const state = buildState();
  const baseWorkOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Otvoreni nalog",
    },
    state,
    () => "work-order-1",
    "RN-00001",
    () => "2026-03-25T09:00:00.000Z",
  );

  const secondLocation = createLocation(
    {
      companyId: "company-1",
      name: "Centar Split",
      region: "Dalmacija",
      coordinates: "43.5081, 16.4402",
      contactName1: "Petra Bencic",
      contactPhone1: "+38595555444",
      contactEmail1: "petra@acme.hr",
    },
    {
      companies: state.companies,
      locations: state.locations,
    },
    () => "location-2",
    () => "2026-03-25T09:05:00.000Z",
  );

  const next = updateWorkOrder(
    baseWorkOrder,
    {
      locationId: "location-2",
      status: "Ovjeren RN",
      teamLabel: "Tim Jug",
    },
    {
      ...state,
      locations: [...state.locations, secondLocation],
    },
    () => "2026-03-25T10:00:00.000Z",
  );

  assert.equal(next.locationName, "Centar Split");
  assert.equal(next.region, "Dalmacija");
  assert.equal(next.contactName, "Petra Bencic");
  assert.equal(next.status, "Ovjeren RN");
  assert.equal(next.teamLabel, "Tim Jug");
});

test("updateWorkOrder can replace executor list with more than two executors", () => {
  const state = buildState();
  const baseWorkOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Otvoreni nalog",
      executors: ["Ana Kovac", "Marko Horvat"],
    },
    state,
    () => "work-order-update-executors",
    "RN-00012",
    () => "2026-03-25T09:30:00.000Z",
  );

  const next = updateWorkOrder(
    baseWorkOrder,
    {
      executors: ["Ana Kovac", "Iva Novak", "Petra Bencic"],
    },
    state,
    () => "2026-03-25T10:15:00.000Z",
  );

  assert.deepEqual(next.executors, ["Ana Kovac", "Iva Novak", "Petra Bencic"]);
  assert.equal(next.executor1, "Ana Kovac");
  assert.equal(next.executor2, "Iva Novak");
});

test("work orders keep measurement sheet snapshots for excel-like reports", () => {
  const state = buildState();
  const measurementSheet = {
    columns: [
      { id: "point", label: "Mjerno mjesto", placeholder: "Mjerno mjesto", width: 220 },
      { id: "label", label: "Oznaka", placeholder: "Oznaka", width: 120 },
      { id: "reading1", label: "Mjerenje 1", placeholder: "0,00", width: 120 },
      { id: "average", label: "Prosjek", width: 120, computed: "average", readonly: true },
    ],
    rows: [
      {
        id: "measurement-row-1",
        cells: {
          point: "Tipkalo 1",
          label: "T1",
          reading1: "12,5",
        },
        formats: {
          point: { type: "text" },
          label: { type: "text" },
          reading1: {
            type: "number",
            decimals: 1,
            border: "bottom",
            fontFamily: "georgia",
            fontSize: 18,
            bold: true,
            italic: true,
            underline: false,
            fillColor: "#efe6ff",
          },
        },
      },
    ],
    headerRows: ["measurement-row-1"],
  };

  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "RN s mjerenjima",
      measurementSheet,
    },
    state,
    () => "work-order-measurement-sheet",
    "RN-00013",
    () => "2026-03-25T10:30:00.000Z",
  );

  assert.equal(workOrder.measurementSheet.columns.length, 4);
  assert.equal(workOrder.measurementSheet.rows[0].cells.point, "Tipkalo 1");
  assert.equal(workOrder.measurementSheet.rows[0].formats.reading1.type, "number");
  assert.equal(workOrder.measurementSheet.rows[0].formats.reading1.decimals, 1);
  assert.equal(workOrder.measurementSheet.rows[0].formats.reading1.border.bottom, true);
  assert.equal(workOrder.measurementSheet.rows[0].formats.reading1.fontFamily, "georgia");
  assert.equal(workOrder.measurementSheet.rows[0].formats.reading1.fontSize, 18);
  assert.equal(workOrder.measurementSheet.rows[0].formats.reading1.bold, true);
  assert.equal(workOrder.measurementSheet.rows[0].formats.reading1.italic, true);
  assert.equal(workOrder.measurementSheet.rows[0].formats.reading1.fillColor, "#efe6ff");
  assert.deepEqual(workOrder.measurementSheet.headerRows, ["measurement-row-1"]);

  const updated = updateWorkOrder(
    workOrder,
    {
      measurementSheet: {
        columns: measurementSheet.columns,
        rows: [
          {
            id: "measurement-row-1",
            cells: {
              point: "Tipkalo 1",
              label: "T1",
              reading1: "=10+5",
            },
            formats: {
              reading1: {
                type: "number",
                decimals: 2,
                align: "center",
                bold: true,
                underline: true,
                fillColor: "#f8e4ff",
              },
            },
          },
        ],
        headerRows: ["measurement-row-1"],
      },
    },
    state,
    () => "2026-03-25T10:45:00.000Z",
  );

  assert.equal(updated.measurementSheet.rows[0].cells.reading1, "=10+5");
  assert.equal(updated.measurementSheet.rows[0].formats.reading1.decimals, 2);
  assert.equal(updated.measurementSheet.rows[0].formats.reading1.bold, true);
  assert.equal(updated.measurementSheet.rows[0].formats.reading1.underline, true);
  assert.equal(updated.measurementSheet.rows[0].formats.reading1.fillColor, "#f8e4ff");
  assert.equal(updated.measurementSheet.rows[0].formats.reading1.align, "center");
  assert.deepEqual(updated.measurementSheet.headerRows, ["measurement-row-1"]);
});

test("work orders can store service catalog items with completion state", () => {
  const state = buildState();
  const template = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "Zapisnik panik rasvjete",
      documentType: "Zapisnik",
      status: "active",
      sampleCompanyId: "company-1",
      sampleLocationId: "location-1",
    },
    state,
    () => "template-1",
    () => "2026-03-31T09:00:00.000Z",
  );
  state.documentTemplates = [template];

  const service = createServiceCatalogItem(
    {
      organizationId: "org-1",
      name: "Panik rasvjeta",
      serviceCode: "PR-100",
      status: "active",
      linkedTemplateIds: ["template-1"],
      validityMonths: "36",
    },
    state,
    () => "service-1",
    () => "2026-03-31T09:05:00.000Z",
  );
  state.serviceCatalog = [service];

  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Radovi na panik rasvjeti",
      serviceItems: [
        {
          serviceId: "service-1",
          quantity: "2.5",
          isCompleted: false,
        },
      ],
    },
    state,
    () => "work-order-service-1",
    "RN-00021",
    () => "2026-03-31T09:10:00.000Z",
  );

  assert.equal(getWorkOrderServiceItems(workOrder).length, 1);
  assert.equal(getWorkOrderServiceItems(workOrder)[0].name, "Panik rasvjeta");
  assert.equal(getWorkOrderServiceItems(workOrder)[0].quantity, "2.5");
  assert.equal(getWorkOrderServiceItems(workOrder)[0].validityMonths, "36");
  assert.equal(getWorkOrderServiceSummary(workOrder), "Panik rasvjeta");
  assert.equal(getWorkOrderServiceSummary(null), "");
  assert.equal(getWorkOrderCompletedServiceCount(workOrder), 0);

  const updated = updateWorkOrder(
    workOrder,
    {
      serviceItems: [
        {
          serviceId: "service-1",
          quantity: "3",
          isCompleted: true,
        },
      ],
    },
    {
      ...state,
      workOrders: [workOrder],
    },
    () => "2026-03-31T10:00:00.000Z",
  );

  assert.equal(getWorkOrderCompletedServiceCount(updated), 1);
  assert.equal(getWorkOrderServiceItems(updated)[0].quantity, "3");
  assert.equal(getWorkOrderServiceItems(updated)[0].linkedTemplateTitles[0], "Zapisnik panik rasvjete");
});

test("work orders block mixing different service types on one RN", () => {
  const state = buildState();
  const template = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "SPR zapisnik",
      documentType: "Zapisnik",
      status: "active",
      sampleCompanyId: "company-1",
      sampleLocationId: "location-1",
    },
    state,
    () => "template-1",
    () => "2026-03-31T09:00:00.000Z",
  );
  const learningTest = createLearningTest(
    {
      organizationId: "org-1",
      title: "ZNR test",
      status: "active",
    },
    state,
    () => "test-1",
    () => "2026-03-31T09:05:00.000Z",
  );

  const scopedState = {
    ...state,
    documentTemplates: [template],
    learningTests: [learningTest],
  };

  const inspectionService = createServiceCatalogItem(
    {
      organizationId: "org-1",
      name: "Panik rasvjeta",
      serviceCode: "SPR",
      serviceType: "inspection",
      linkedTemplateIds: ["template-1"],
    },
    scopedState,
    () => "service-1",
    () => "2026-03-31T09:10:00.000Z",
  );
  const znrService = createServiceCatalogItem(
    {
      organizationId: "org-1",
      name: "Osposobljavanje za rad na siguran način",
      serviceCode: "ZNR-001",
      serviceType: "znr",
      linkedLearningTestIds: ["test-1"],
    },
    scopedState,
    () => "service-2",
    () => "2026-03-31T09:15:00.000Z",
  );

  assert.throws(() => createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Mijesani RN",
      serviceItems: [
        { serviceId: "service-1", isCompleted: false },
        { serviceId: "service-2", isCompleted: false },
      ],
    },
    {
      ...scopedState,
      serviceCatalog: [inspectionService, znrService],
    },
    () => "work-order-mixed",
    "RN-99999",
    () => "2026-03-31T09:20:00.000Z",
  ), /različitih vrsta|razlicitih vrsta/i);
});

test("groupWorkOrdersByExecutorSet merges work orders with the same executor combination", () => {
  const items = [
    { id: "1", workOrderNumber: "RN-001", executors: ["Ana Horvat", "Marko Kova", "Iva Novak"], dueDate: "2026-03-29" },
    { id: "2", workOrderNumber: "RN-002", executors: ["Ana Horvat", "Marko Kova", "Iva Novak"], dueDate: "2026-03-29" },
    { id: "3", workOrderNumber: "RN-003", executors: ["Petra Juric"], dueDate: "2026-03-29" },
  ];

  const groups = groupWorkOrdersByExecutorSet(items);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, "Ana Horvat + Marko Kova + Iva Novak");
  assert.equal(groups[0].items.length, 2);
  assert.deepEqual(
    groups[0].items.map((item) => item.workOrderNumber),
    ["RN-001", "RN-002"],
  );
  assert.equal(groups[1].label, "Petra Juric");
});

test("locations support dynamic contacts beyond the legacy three slots", () => {
  const company = createCompany(
    {
      name: "Delta d.o.o.",
      oib: "10987654321",
    },
    [],
    () => "company-delta",
    () => "2026-03-25T08:00:00.000Z",
  );

  const location = createLocation(
    {
      companyId: company.id,
      name: "Lab Zagreb",
      contacts: [
        { name: "Kontakt 1", phone: "111", email: "k1@delta.hr" },
        { name: "Kontakt 2", phone: "222", email: "k2@delta.hr" },
        { name: "Kontakt 3", phone: "333", email: "k3@delta.hr" },
        { name: "Kontakt 4", phone: "444", email: "k4@delta.hr" },
      ],
    },
    { companies: [company], locations: [] },
    () => "location-delta",
    () => "2026-03-25T08:05:00.000Z",
  );

  assert.equal(buildLocationContacts(location).length, 4);
  assert.equal(location.contactName1, "Kontakt 1");
  assert.equal(location.contactName2, "Kontakt 2");
  assert.equal(location.contactName3, "Kontakt 3");

  const updatedLocation = updateLocation(
    location,
    {
      contacts: [
        ...buildLocationContacts(location),
        { name: "Kontakt 5", phone: "555", email: "k5@delta.hr" },
      ],
    },
    { companies: [company], locations: [location] },
    () => "2026-03-25T08:10:00.000Z",
  );

  const updatedContacts = buildLocationContacts(updatedLocation);
  assert.equal(updatedContacts.length, 5);
  assert.equal(updatedContacts[4].slot, 5);

  const workOrder = createWorkOrder(
    {
      companyId: company.id,
      locationId: updatedLocation.id,
      contactSlot: 5,
      description: "Test dinamicnog kontakta",
    },
    { companies: [company], locations: [updatedLocation], workOrders: [] },
    () => "work-order-delta",
    "RN-00077",
    () => "2026-03-25T08:15:00.000Z",
  );

  assert.equal(workOrder.contactSlot, 5);
  assert.equal(workOrder.contactName, "Kontakt 5");
  assert.equal(workOrder.contactPhone, "555");
});

test("support helpers cover numbering, filtering, stats, and location sync", () => {
  const state = buildState();
  const first = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Prvi nalog",
      dueDate: "2026-03-24",
      status: "Otvoreni RN",
    },
    state,
    () => "work-order-1",
    "RN-00001",
    () => "2026-03-25T09:00:00.000Z",
  );
  const second = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Drugi nalog",
      status: "Fakturiran RN",
    },
    state,
    () => "work-order-2",
    "RN-00002",
    () => "2026-03-25T10:00:00.000Z",
  );

  assert.equal(nextWorkOrderNumber([first, second]), "RN-00003");
  assert.equal(filterWorkOrders([first, second], { query: "prvi" }).length, 1);
  assert.deepEqual(getDashboardStats({
    companies: state.companies,
    locations: state.locations,
    workOrders: [first, second],
  }, "2026-03-25"), {
    companies: 1,
    locations: 1,
    activeWorkOrders: 1,
    completedWorkOrders: 1,
    overdueWorkOrders: 1,
  });

  const syncedLocation = syncLocationFieldsFromWorkOrder(state.locations[0], {
    ...first,
    coordinates: "45.1234, 16.0000",
    region: "Sredisnja Hrvatska",
  }, () => "2026-03-25T12:00:00.000Z");

  assert.equal(syncedLocation.coordinates, "45.1234, 16.0000");
  assert.equal(syncedLocation.region, "Sredisnja Hrvatska");
  assert.equal(buildLocationContacts(syncedLocation).length, 2);
});

test("filterWorkOrders supports advanced AND/OR filters for status, dates, tags and executors", () => {
  const state = buildState();
  const first = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Prvi nalog",
      dueDate: "2026-03-24",
      status: "Otvoreni RN",
      executors: ["Ana Kovac", "Petra Bencic"],
      region: "Zagreb",
      tagText: "hitno, servis",
    },
    state,
    () => "work-order-1",
    "RN-00001",
    () => "2026-03-25T09:00:00.000Z",
  );
  const second = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Drugi nalog",
      status: "Fakturiran RN",
      executors: ["Marko Horvat", "Iva Novak", "Petra Bencic"],
      region: "Split",
      tagText: "servis",
    },
    state,
    () => "work-order-2",
    "RN-00002",
    () => "2026-03-25T10:00:00.000Z",
  );
  const third = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Treći nalog",
      status: "Otvoreni RN",
      executors: ["Iva Novak"],
      region: "Zagreb",
      tagText: "kontrola",
    },
    state,
    () => "work-order-3",
    "RN-00003",
    () => "2026-03-25T11:00:00.000Z",
  );

  const filtered = filterWorkOrders([first, second, third], {
    advancedFilters: {
      groups: [
        {
          match: "AND",
          rules: [
            { field: "status", operator: "is", values: ["Otvoreni RN"] },
            { field: "region", operator: "is", values: ["Zagreb"] },
            { field: "dueDate", operator: "is_empty" },
          ],
        },
        {
          join: "OR",
          match: "AND",
          rules: [
            { field: "tag", operator: "is", values: ["servis"] },
            { field: "executor", operator: "is", values: ["Marko Horvat"] },
          ],
        },
      ],
    },
  });

  assert.deepEqual(filtered.map((item) => item.id), ["work-order-2", "work-order-3"]);
});

test("offers generate year-initials numbering and calculate totals", () => {
  const state = buildState();
  const existingOffer = createOffer(
    {
      organizationId: "55",
      companyId: "company-1",
      locationId: "location-1",
      title: "Postojeca ponuda",
      serviceLine: "Servis",
      createdByLabel: "Branimir Test",
      items: [
        { description: "Osnovni pregled", unit: "kom", quantity: 1, unitPrice: 100 },
      ],
    },
    state,
    () => "offer-1",
    {
      offerNumber: "2026-BT-001",
      offerYear: 2026,
      offerSequence: 1,
      offerInitials: "BT",
    },
    () => "2026-03-25T09:00:00.000Z",
  );

  const nextNumber = nextOfferNumber([existingOffer], {
    year: 2026,
    initials: deriveOfferInitials("Branimir Test"),
  });

  const createdOffer = createOffer(
    {
      organizationId: "55",
      companyId: "company-1",
      locationId: "location-1",
      title: "Nova ponuda",
      serviceLine: "Odrzavanje",
      createdByLabel: "Branimir Test",
      taxRate: 25,
      items: [
        { description: "Pregled", unit: "kom", quantity: 2, unitPrice: 50 },
        { description: "Izlazak na teren", unit: "sat", quantity: 1.5, unitPrice: 40 },
      ],
    },
    {
      ...state,
      offers: [existingOffer],
    },
    () => "offer-2",
    nextNumber,
    () => "2026-03-26T09:00:00.000Z",
  );

  assert.equal(createdOffer.offerNumber, "2026-BT-002");
  assert.equal(createdOffer.offerInitials, "BT");
  assert.equal(createdOffer.companyName, "Acme d.o.o.");
  assert.equal(createdOffer.locationName, "Pogon Jankomir");
  assert.equal(createdOffer.subtotal, 160);
  assert.equal(createdOffer.taxTotal, 40);
  assert.equal(createdOffer.total, 200);
  assert.equal(createdOffer.items.length, 2);
});

test("offers update totals and support filtering and sorting", () => {
  const state = buildState();
  const draftOffer = createOffer(
    {
      organizationId: "55",
      companyId: "company-1",
      locationId: "location-1",
      title: "Godisnji servis",
      serviceLine: "Servis",
      status: "draft",
      createdByLabel: "Ana Admin",
      items: [
        { description: "Servis aparata", unit: "kom", quantity: 1, unitPrice: 120 },
      ],
    },
    state,
    () => "offer-draft",
    {
      offerNumber: "2026-AA-001",
      offerYear: 2026,
      offerSequence: 1,
      offerInitials: "AA",
    },
    () => "2026-03-25T09:00:00.000Z",
  );

  const sentOffer = updateOffer(
    draftOffer,
    {
      status: "sent",
      validUntil: "2026-03-30",
      items: [
        { description: "Servis aparata", unit: "kom", quantity: 2, unitPrice: 140 },
      ],
      note: "Poslano klijentu",
    },
    {
      ...state,
      offers: [draftOffer],
    },
    () => "2026-03-26T10:00:00.000Z",
  );

  const acceptedOffer = createOffer(
    {
      organizationId: "55",
      companyId: "company-1",
      title: "Obuka zaposlenika",
      serviceLine: "Obuka",
      status: "accepted",
      createdByLabel: "Ana Admin",
      items: [
        { description: "Obuka", unit: "sat", quantity: 3, unitPrice: 80 },
      ],
    },
    {
      ...state,
      offers: [draftOffer, sentOffer],
    },
    () => "offer-accepted",
    {
      offerNumber: "2026-AA-002",
      offerYear: 2026,
      offerSequence: 2,
      offerInitials: "AA",
    },
    () => "2026-03-27T08:00:00.000Z",
  );

  const filtered = filterOffers([draftOffer, sentOffer, acceptedOffer], {
    query: "klijentu",
    status: "sent",
  });

  assert.equal(sentOffer.subtotal, 280);
  assert.equal(sentOffer.taxTotal, 70);
  assert.equal(sentOffer.total, 350);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].status, "sent");
  assert.equal(filtered[0].note, "Poslano klijentu");
  assert.deepEqual(
    sortOffers([acceptedOffer, sentOffer, draftOffer]).map((item) => item.status),
    ["draft", "sent", "accepted"],
  );
});

test("offers keep included fixed plan services and localized euro amounts", () => {
  const state = buildState();
  const offer = createOffer(
    {
      organizationId: "55",
      companyId: "company-1",
      title: "Pausalni paket",
      serviceLine: "Fixed Plan",
      items: [
        { description: "Pausalni ugovor", unit: "mj", quantity: "2", unitPrice: "1.234,50" },
        { description: "Zapisnik ukljucen u plan", isIncludedService: true, unitPrice: "999" },
      ],
    },
    state,
    () => "offer-fixed",
    {
      offerNumber: "2026-AA-003",
      offerYear: 2026,
      offerSequence: 3,
      offerInitials: "AA",
    },
    () => "2026-03-28T08:00:00.000Z",
  );

  assert.equal(offer.items[0].unitPrice, 1234.5);
  assert.equal(offer.items[0].totalPrice, 2469);
  assert.equal(offer.items[1].isIncludedService, true);
  assert.equal(offer.items[1].unitPrice, 0);
  assert.equal(offer.items[1].totalPrice, 0);
  assert.equal(offer.subtotal, 2469);
});

test("offers support location scope, contact snapshots, discounts and breakdown rows", () => {
  const state = buildState();

  const detailedOffer = createOffer(
    {
      organizationId: "55",
      companyId: "company-1",
      locationScope: "single",
      locationId: "location-1",
      contactSlot: "2",
      title: "Detaljna ponuda",
      serviceLine: "Flat plan",
      offerDate: "2026-03-29",
      showTotalAmount: false,
      discountRate: 10,
      textBlock1: "Zakonska osnova i obuhvat ponude.",
      textBlock2: "Posebni uvjeti za klijenta.",
      items: [
        {
          description: "Panik rasvjeta",
          unit: "kom",
          quantity: 1,
          unitPrice: 100,
          discountRate: 10,
          breakdowns: [
            { priceKind: "report", unitLabel: "zapisnik", recordLabel: "Zapisnik", amount: 10 },
            { priceKind: "measurement_range", unitLabel: "mjerno mjesto do", measurementTo: "20", amount: 18 },
            { label: "do 40 mm", amount: 32 },
            { label: "do 80 mm", amount: 58 },
            { label: "do 120 mm", amount: 72 },
            { label: "do 180 mm", amount: 96 },
          ],
        },
      ],
    },
    state,
    () => "offer-detailed",
    {
      offerNumber: "2026-AA-005",
      offerYear: 2026,
      offerSequence: 5,
      offerInitials: "AA",
    },
    () => "2026-03-29T09:00:00.000Z",
  );

  const allLocationsOffer = createOffer(
    {
      organizationId: "55",
      companyId: "company-1",
      locationScope: "all",
      title: "Ponuda za sve lokacije",
      serviceLine: "One-Time",
      items: [
        { description: "Pregled", unit: "kom", quantity: 1, unitPrice: 50 },
      ],
    },
    {
      ...state,
      offers: [detailedOffer],
    },
    () => "offer-all",
    {
      offerNumber: "2026-AA-006",
      offerYear: 2026,
      offerSequence: 6,
      offerInitials: "AA",
    },
    () => "2026-03-30T09:00:00.000Z",
  );

  assert.equal(detailedOffer.locationScope, "single");
  assert.equal(detailedOffer.contactName, "Iva Novak");
  assert.equal(detailedOffer.offerDate, "2026-03-29");
  assert.equal(detailedOffer.showTotalAmount, false);
  assert.equal(detailedOffer.textBlock1, "Zakonska osnova i obuhvat ponude.");
  assert.equal(detailedOffer.textBlock2, "Posebni uvjeti za klijenta.");
  assert.equal(detailedOffer.items[0].breakdowns.length, 6);
  assert.equal(detailedOffer.items[0].breakdowns[0].priceKind, "report");
  assert.equal(detailedOffer.items[0].breakdowns[0].unitLabel, "zapisnik");
  assert.equal(detailedOffer.items[0].breakdowns[1].priceKind, "measurement_range");
  assert.equal(detailedOffer.items[0].breakdowns[1].measurementTo, "20");
  assert.equal(detailedOffer.items[0].breakdownTotal, 286);
  assert.equal(detailedOffer.items[0].totalPrice, 257.4);
  assert.equal(detailedOffer.subtotal, 257.4);
  assert.equal(detailedOffer.discountTotal, 25.74);
  assert.equal(detailedOffer.taxableSubtotal, 231.66);
  assert.equal(detailedOffer.total, 289.58);
  assert.equal(allLocationsOffer.locationScope, "all");
  assert.equal(allLocationsOffer.locationName, "Sve lokacije");
  assert.equal(allLocationsOffer.contactName, "");
  assert.equal(allLocationsOffer.showTotalAmount, true);
  assert.equal(filterOffers([detailedOffer, allLocationsOffer], { query: "do 180 mm" }).length, 1);
});

test("public procurements keep company context, documents, filtering and updates", () => {
  const state = buildState();

  const openTender = createPublicProcurement(
    {
      organizationId: "55",
      title: "Nabava usluge ispitivanja",
      referenceNumber: "EOJN-2026-11",
      status: "open",
      deadline: "2026-05-30",
      amount: "12500,50",
      companyId: "company-1",
      documentationUrl: "https://example.test/dokumentacija",
      note: "Treba pripremiti troskovnik i potvrde.",
      documents: [
        {
          id: "doc-1",
          fileName: "troskovnik.xlsx",
          fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dataUrl: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,AAA",
        },
      ],
      createdByUserId: "user-1",
      createdByLabel: "Ana Savanovic",
    },
    state,
    () => "public-procurement-1",
    () => "2026-05-19T09:00:00.000Z",
  );

  const submittedTender = createPublicProcurement(
    {
      organizationId: "55",
      title: "Predana ponuda za edukaciju",
      status: "sent",
      deadline: "2026-05-25",
      companyName: "Rucni unos d.o.o.",
    },
    {
      ...state,
      publicProcurements: [openTender],
    },
    () => "public-procurement-2",
    () => "2026-05-19T10:00:00.000Z",
  );

  const updatedTender = updatePublicProcurement(
    openTender,
    {
      status: "accepted",
      note: "Dokumentacija preuzeta, ceka se interna provjera.",
    },
    {
      ...state,
      publicProcurements: [openTender, submittedTender],
    },
    () => "2026-05-19T11:00:00.000Z",
  );

  assert.equal(openTender.companyName, "Acme d.o.o.");
  assert.equal(openTender.companyOib, "12345678901");
  assert.equal(submittedTender.companyName, "Rucni unos d.o.o.");
  assert.equal(openTender.amount, 12500.5);
  assert.equal(openTender.documents.length, 1);
  assert.equal(openTender.documents[0].fileName, "troskovnik.xlsx");
  assert.equal(filterPublicProcurements([openTender, submittedTender], { query: "12500.5" }).length, 1);
  assert.equal(filterPublicProcurements([openTender, submittedTender], { query: "troskovnik" }).length, 1);
  assert.equal(filterPublicProcurements([openTender, submittedTender], { status: "sent" })[0].id, "public-procurement-2");
  assert.equal(sortPublicProcurements([submittedTender, openTender])[0].id, "public-procurement-1");
  assert.equal(updatedTender.status, "accepted");
  assert.equal(updatedTender.note, "Dokumentacija preuzeta, ceka se interna provjera.");
  assert.equal(updatedTender.updatedAt, "2026-05-19T11:00:00.000Z");
});

test("purchase orders generate numbering and keep incoming document metadata", () => {
  const state = buildState();

  const existingPurchaseOrder = createPurchaseOrder(
    {
      organizationId: "55",
      companyId: "company-1",
      locationId: "location-1",
      title: "Zaprimljena narudžbenica",
      serviceLine: "Fixed Fee",
      orderDirection: "incoming",
      externalDocumentNumber: "PO-ACME-001",
      documents: [
        {
          id: "purchase-document-1",
          fileName: "acme-po-001.pdf",
          fileType: "application/pdf",
          dataUrl: "data:application/pdf;base64,AAA",
        },
      ],
      items: [
        { description: "Servis", unit: "kom", quantity: 1, unitPrice: 120 },
      ],
    },
    state,
    () => "purchase-order-1",
    {
      purchaseOrderNumber: "2026-PO-001",
      purchaseOrderYear: 2026,
      purchaseOrderSequence: 1,
    },
    () => "2026-03-25T09:00:00.000Z",
  );

  const nextNumber = nextPurchaseOrderNumber([existingPurchaseOrder], { year: 2026 });

  const createdPurchaseOrder = createPurchaseOrder(
    {
      organizationId: "55",
      companyId: "company-1",
      locationScope: "single",
      locationId: "location-1",
      selectedLocationIds: ["location-1"],
      title: "Izlazna narudžbenica",
      serviceLine: "Offer",
      orderDirection: "outgoing",
      items: [
        { description: "Izrada dokumentacije", unit: "sat", quantity: 2, unitPrice: 75 },
      ],
    },
    {
      ...state,
      purchaseOrders: [existingPurchaseOrder],
    },
    () => "purchase-order-2",
    nextNumber,
    () => "2026-03-26T09:00:00.000Z",
  );

  assert.equal(existingPurchaseOrder.purchaseOrderNumber, "2026-PO-001");
  assert.equal(existingPurchaseOrder.orderDirection, "incoming");
  assert.equal(existingPurchaseOrder.externalDocumentNumber, "PO-ACME-001");
  assert.equal(existingPurchaseOrder.documents.length, 1);
  assert.equal(existingPurchaseOrder.documents[0].fileName, "acme-po-001.pdf");
  assert.equal(createdPurchaseOrder.purchaseOrderNumber, "2026-PO-002");
  assert.equal(createdPurchaseOrder.purchaseOrderSequence, 2);
  assert.equal(createdPurchaseOrder.companyName, "Acme d.o.o.");
  assert.equal(createdPurchaseOrder.locationName, "Pogon Jankomir");
  assert.equal(createdPurchaseOrder.subtotal, 150);
  assert.equal(createdPurchaseOrder.total, 187.5);
});

test("purchase orders support filtering, sorting, updates and location scope", () => {
  const state = buildState();

  const incomingPurchaseOrder = createPurchaseOrder(
    {
      organizationId: "55",
      companyId: "company-1",
      locationScope: "single",
      locationId: "location-1",
      contactSlot: "1",
      title: "Klijentova narudžbenica",
      serviceLine: "Base fee + variable fee",
      status: "received",
      purchaseOrderDate: "2026-04-02",
      orderDirection: "incoming",
      externalDocumentNumber: "KL-7781",
      note: "Zaprimljena od klijenta",
      items: [
        { description: "Pregled centrale", unit: "kom", quantity: 1, unitPrice: 160 },
      ],
      documents: [
        {
          id: "purchase-document-2",
          fileName: "narudzbenica-klijenta.pdf",
          fileType: "application/pdf",
          dataUrl: "data:application/pdf;base64,BBB",
        },
      ],
    },
    state,
    () => "purchase-order-incoming",
    {
      purchaseOrderNumber: "2026-PO-003",
      purchaseOrderYear: 2026,
      purchaseOrderSequence: 3,
    },
    () => "2026-04-02T08:00:00.000Z",
  );

  const outgoingPurchaseOrder = updatePurchaseOrder(
    incomingPurchaseOrder,
    {
      title: "Interna narudžbenica za servis",
      status: "issued",
      orderDirection: "outgoing",
      purchaseOrderDate: "2026-04-04",
      selectedLocationIds: ["location-1"],
      note: "Izdano prema partneru",
      items: [
        {
          description: "Servis po stavkama",
          unit: "kom",
          quantity: 1,
          unitPrice: 0,
          breakdowns: [
            { label: "Kontrola", amount: 40 },
            { label: "Materijal", amount: 60 },
          ],
        },
      ],
    },
    {
      ...state,
      purchaseOrders: [incomingPurchaseOrder],
    },
    () => "2026-04-04T10:00:00.000Z",
  );

  const confirmedPurchaseOrder = createPurchaseOrder(
    {
      organizationId: "55",
      companyId: "company-1",
      locationScope: "all",
      title: "Godišnja narudžbenica",
      serviceLine: "Fixed Fee",
      status: "confirmed",
      purchaseOrderDate: "2026-04-06",
      orderDirection: "outgoing",
      items: [
        { description: "Paket održavanja", unit: "paket", quantity: 1, unitPrice: 300 },
      ],
    },
    {
      ...state,
      purchaseOrders: [incomingPurchaseOrder, outgoingPurchaseOrder],
    },
    () => "purchase-order-confirmed",
    {
      purchaseOrderNumber: "2026-PO-004",
      purchaseOrderYear: 2026,
      purchaseOrderSequence: 4,
    },
    () => "2026-04-06T12:00:00.000Z",
  );

  const filtered = filterPurchaseOrders(
    [incomingPurchaseOrder, outgoingPurchaseOrder, confirmedPurchaseOrder],
    {
      query: "partneru",
      status: "issued",
    },
  );

  assert.equal(outgoingPurchaseOrder.locationScope, "single");
  assert.equal(outgoingPurchaseOrder.contactName, "Marko Horvat");
  assert.equal(outgoingPurchaseOrder.items[0].breakdownTotal, 100);
  assert.equal(outgoingPurchaseOrder.total, 125);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].status, "issued");
  assert.equal(filtered[0].orderDirection, "outgoing");
  assert.deepEqual(
    sortPurchaseOrders([confirmedPurchaseOrder, outgoingPurchaseOrder, incomingPurchaseOrder]).map((item) => item.status),
    ["received", "issued", "confirmed"],
  );
});

test("contract templates keep Word metadata and support filtering and sorting", () => {
  const state = buildState();

  const activeTemplate = createContractTemplate(
    {
      organizationId: "55",
      title: "Servisni ugovor",
      description: "Glavni template za godišnje ugovore.",
      status: "active",
      referenceDocument: {
        id: "contract-template-doc-1",
        fileName: "servisni-ugovor.docx",
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        dataUrl: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,AAA",
        fileSize: 2048,
      },
      createdByLabel: "Admin",
    },
    state,
    () => "contract-template-1",
    () => "2026-04-07T08:00:00.000Z",
  );

  const archivedTemplate = createContractTemplate(
    {
      organizationId: "55",
      title: "Arhivirani ugovor",
      status: "archived",
      description: "Stari format ugovora",
    },
    {
      ...state,
      contractTemplates: [activeTemplate],
    },
    () => "contract-template-2",
    () => "2026-04-06T08:00:00.000Z",
  );

  const filtered = filterContractTemplates([activeTemplate, archivedTemplate], {
    query: "servisni-ugovor",
    status: "active",
  });

  assert.equal(activeTemplate.referenceDocument.fileName, "servisni-ugovor.docx");
  assert.equal(activeTemplate.referenceDocument.fileSize, 2048);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "contract-template-1");
  assert.deepEqual(
    sortContractTemplates([archivedTemplate, activeTemplate]).map((item) => item.id),
    ["contract-template-1", "contract-template-2"],
  );
});

test("contracts generate numbering, link company offers and keep annexes", () => {
  const state = buildState();

  const linkedOffer = createOffer(
    {
      organizationId: "55",
      companyId: "company-1",
      locationId: "location-1",
      title: "Ponuda za ugovor",
      serviceLine: "Fixed Fee",
      items: [
        { description: "Godišnje održavanje", unit: "paket", quantity: 1, unitPrice: 500 },
      ],
    },
    state,
    () => "offer-contract-1",
    {
      offerNumber: "2026-AA-010",
      offerYear: 2026,
      offerSequence: 10,
      offerInitials: "AA",
    },
    () => "2026-04-08T09:00:00.000Z",
  );

  const template = createContractTemplate(
    {
      organizationId: "55",
      title: "Template ugovora",
      status: "active",
    },
    state,
    () => "contract-template-main",
    () => "2026-04-08T09:05:00.000Z",
  );

  const existingContract = createContract(
    {
      organizationId: "55",
      companyId: "company-1",
      templateId: template.id,
      title: "Postojeći ugovor",
      subject: "Održavanje sustava",
    },
    {
      ...state,
      offers: [linkedOffer],
      contractTemplates: [template],
    },
    () => "contract-existing",
    {
      contractNumber: "UG-2026-001",
      contractYear: 2026,
      contractSequence: 1,
    },
    () => "2026-04-08T10:00:00.000Z",
  );

  const nextNumber = nextContractNumber([existingContract], { year: 2026 });

  const createdContract = createContract(
    {
      organizationId: "55",
      companyId: "company-1",
      templateId: template.id,
      title: "Ugovor o održavanju",
      status: "active",
      signedOn: "2026-04-09",
      validFrom: "2026-04-10",
      validTo: "2027-04-09",
      subject: "Preventivno i korektivno održavanje",
      scopeSummary: "Mjesečni pregled i intervencije po potrebi",
      note: "Uključuje prioritetan izlazak",
      linkedOfferIds: [linkedOffer.id],
      annexes: [
        {
          annexNumber: "A-1",
          title: "Proširenje opsega",
          effectiveDate: "2026-06-01",
          note: "Dodatna lokacija",
        },
      ],
    },
    {
      ...state,
      offers: [linkedOffer],
      contracts: [existingContract],
      contractTemplates: [template],
    },
    () => "contract-2",
    nextNumber,
    () => "2026-04-09T08:00:00.000Z",
  );

  const updatedContract = createContract(
    {
      organizationId: "55",
      companyId: "company-1",
      templateId: template.id,
      title: "Neaktivni ugovor",
      status: "expired",
      validTo: "2026-03-01",
    },
    {
      ...state,
      offers: [linkedOffer],
      contracts: [existingContract, createdContract],
      contractTemplates: [template],
    },
    () => "contract-3",
    {
      contractNumber: "UG-2026-003",
      contractYear: 2026,
      contractSequence: 3,
    },
    () => "2026-04-10T08:00:00.000Z",
  );

  const filtered = filterContracts(
    [existingContract, createdContract, updatedContract],
    {
      query: "AA-010",
      status: "active",
      companyId: "company-1",
    },
  );

  assert.equal(createdContract.contractNumber, "UG-2026-002");
  assert.equal(createdContract.companyName, "Acme d.o.o.");
  assert.equal(createdContract.templateTitle, "Template ugovora");
  assert.equal(createdContract.linkedOfferIds.length, 1);
  assert.equal(createdContract.linkedOffers[0].offerNumber, "2026-AA-010");
  assert.equal(createdContract.annexes[0].annexNumber, "A-1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "contract-2");
  assert.deepEqual(
    sortContracts([updatedContract, createdContract, existingContract]).map((item) => item.id),
    ["contract-existing", "contract-2", "contract-3"],
  );
});

test("drawing projects keep references, layers and CAD elements through create and update", () => {
  const state = buildState();

  const created = createDrawingProject(
    {
      organizationId: "55",
      companyId: "company-1",
      locationId: "location-1",
      title: "Plan evakuacije · Jankomir",
      drawingType: "evacuation",
      status: "active",
      scaleLabel: "M 1:100",
      note: "Glavni plan za prizemlje.",
      referenceDocuments: [
        {
          id: "drawing-ref-1",
          fileName: "tlocrt-prizemlje.pdf",
          fileType: "application/pdf",
          fileSize: 4096,
          dataUrl: "data:application/pdf;base64,AAA",
        },
      ],
      activeReferenceDocumentId: "drawing-ref-1",
      layers: [
        {
          id: "layer-walls",
          name: "Zidovi",
          color: "#203a62",
          visible: true,
          locked: false,
          lineWidth: 8,
          lineStyle: "solid",
        },
        {
          id: "layer-dimension",
          name: "Kote",
          color: "#da8a1f",
          visible: true,
          locked: false,
          lineWidth: 2,
          lineStyle: "dashed",
        },
        {
          id: "layer-safety",
          name: "Sigurnosni simboli",
          color: "#d64d50",
          visible: true,
          locked: false,
          lineWidth: 2,
          lineStyle: "solid",
        },
      ],
      elements: [
        {
          id: "wall-1",
          type: "wall",
          layerId: "layer-walls",
          x: 100,
          y: 120,
          x2: 520,
          y2: 120,
          lineWidth: 12,
        },
        {
          id: "door-1",
          type: "door",
          layerId: "layer-safety",
          x: 240,
          y: 120,
          width: 120,
          height: 90,
          rotation: 90,
          label: "Ulazna vrata",
          metadata: {
            openDirection: "right",
          },
        },
        {
          id: "dimension-1",
          type: "dimension",
          layerId: "layer-dimension",
          x: 100,
          y: 180,
          x2: 520,
          y2: 180,
          metadata: {
            autoLabel: true,
          },
        },
        {
          id: "curve-1",
          type: "curve",
          layerId: "layer-safety",
          x: 540,
          y: 180,
          x2: 820,
          y2: 180,
          metadata: {
            curveDirection: 1,
            curveOffset: 96,
          },
        },
      ],
      viewport: {
        zoom: 1.15,
        gridSize: 24,
        canvasWidth: 1800,
        canvasHeight: 1200,
        snapToGrid: true,
        showGrid: true,
        orthoMode: true,
      },
    },
    state,
    () => "drawing-1",
    () => "2026-04-12T08:00:00.000Z",
  );

  const updated = updateDrawingProject(
    created,
    {
      title: "Plan evakuacije · Jankomir A",
      status: "draft",
      note: "Dodana nova vrata i okvir.",
      elements: [
        ...created.elements,
        {
          id: "frame-1",
          type: "frame",
          layerId: "layer-safety",
          x: 40,
          y: 40,
          width: 1480,
          height: 920,
          label: "Plan evakuacije i spasavanja",
          metadata: {
            subtitle: "Objekt A",
          },
        },
        {
          id: "assembly-1",
          type: "assembly_point",
          layerId: "layer-safety",
          x: 920,
          y: 120,
          width: 170,
          height: 72,
          label: "ZBORNO",
        },
        {
          id: "ellipse-1",
          type: "ellipse",
          layerId: "layer-safety",
          x: 1120,
          y: 220,
          width: 160,
          height: 100,
          label: "Zona",
        },
      ],
    },
    {
      ...state,
      drawings: [created],
    },
    () => "2026-04-12T09:00:00.000Z",
  );

  const archived = createDrawingProject(
    {
      organizationId: "55",
      companyId: "company-1",
      locationId: "location-1",
      title: "Arhiva",
      drawingType: "custom",
      status: "archived",
    },
    {
      ...state,
      drawings: [updated],
    },
    () => "drawing-2",
    () => "2026-04-11T08:00:00.000Z",
  );

  const filtered = filterDrawingProjects([updated], {
    query: "objekt a",
    status: "draft",
    companyId: "company-1",
  });

  assert.equal(created.companyName, "Acme d.o.o.");
  assert.equal(created.locationName, "Pogon Jankomir");
  assert.equal(created.referenceDocuments[0].fileName, "tlocrt-prizemlje.pdf");
  assert.equal(created.layers.length, 3);
  assert.equal(created.elements[1].metadata.openDirection, "right");
  assert.equal(created.elements[1].rotation, 90);
  assert.equal(created.elements[2].label, "420 mm");
  assert.equal(created.elements[3].type, "curve");
  assert.equal(created.viewport.orthoMode, true);
  assert.equal(updated.elements.length, 7);
  assert.equal(updated.elements[3].type, "curve");
  assert.equal(updated.elements[4].type, "frame");
  assert.equal(updated.elements[5].type, "assembly_point");
  assert.equal(updated.elements[6].type, "ellipse");
  assert.equal(filtered.length, 1);
  assert.deepEqual(
    sortDrawingProjects([archived, updated]).map((item) => item.id),
    ["drawing-1", "drawing-2"],
  );
});

test("vehicles create reservations, block overlaps and derive availability", () => {
  const state = buildState();
  const vehicle = createVehicle(
    {
      organizationId: "55",
      name: "Servisni kombi 1",
      plateNumber: "ZG 1234 AB",
      make: "Renault",
      model: "Trafic",
      category: "Kombi",
      year: 2022,
      seatCount: 3,
      odometerKm: 142000,
      status: "available",
    },
    state,
    () => "vehicle-1",
    () => "2026-03-29T08:00:00.000Z",
  );

  const reservedVehicle = createVehicleReservation(
    vehicle,
    {
      status: "reserved",
      purpose: "Intervencija Zagreb",
      reservedForUserIds: ["user-1", "user-2"],
      reservedForLabels: ["Ana Admin", "Marko Servis"],
      destination: "Zagreb",
      startAt: "2026-03-30T07:00:00.000Z",
      endAt: "2026-03-30T15:00:00.000Z",
    },
    () => "reservation-1",
    () => "2026-03-29T09:00:00.000Z",
  );

  assert.equal(getVehicleAvailabilityStatus(reservedVehicle, "2026-03-30T08:00:00.000Z"), "reserved");
  assert.equal(getVehicleNextReservation(reservedVehicle, "2026-03-30T06:00:00.000Z")?.id, "reservation-1");
  assert.deepEqual(reservedVehicle.reservations[0].reservedForUserIds, ["user-1", "user-2"]);
  assert.deepEqual(reservedVehicle.reservations[0].reservedForLabels, ["Ana Admin", "Marko Servis"]);

  assert.throws(
    () => createVehicleReservation(
      reservedVehicle,
      {
        status: "reserved",
        purpose: "Druga voznja",
        reservedForLabel: "Marko",
        startAt: "2026-03-30T10:00:00.000Z",
        endAt: "2026-03-30T12:00:00.000Z",
      },
      () => "reservation-2",
      () => "2026-03-29T09:10:00.000Z",
    ),
    /vec rezervirano/i,
  );

  const serviceVehicle = updateVehicle(
    vehicle,
    {
      status: "service",
    },
    {
      ...state,
      vehicles: [vehicle],
    },
    () => "2026-03-29T09:12:00.000Z",
  );

  assert.throws(
    () => createVehicleReservation(
      serviceVehicle,
      {
        purpose: "Nova voznja",
        reservedForLabel: "Marko",
        startAt: "2026-03-31T08:00:00.000Z",
        endAt: "2026-03-31T10:00:00.000Z",
      },
      () => "reservation-service",
      () => "2026-03-29T09:13:00.000Z",
    ),
    /na servisu/i,
  );

  const completedVehicle = updateVehicleReservation(
    reservedVehicle,
    "reservation-1",
    {
      status: "completed",
    },
    () => "2026-03-30T16:00:00.000Z",
  );

  assert.equal(getVehicleAvailabilityStatus(completedVehicle, "2026-03-30T16:05:00.000Z"), "available");
});

test("vehicles filter and sort by availability and search context", () => {
  const state = buildState();
  const availableVehicle = createVehicle(
    {
      organizationId: "55",
      name: "Mali gradski auto",
      plateNumber: "ZG 0001 AA",
      status: "available",
    },
    state,
    () => "vehicle-a",
    () => "2026-03-29T08:00:00.000Z",
  );
  const reservedVehicle = createVehicleReservation(
    createVehicle(
      {
        organizationId: "55",
        name: "Kombi interventni",
        plateNumber: "ZG 0002 BB",
        status: "available",
      },
      state,
      () => "vehicle-b",
      () => "2026-03-29T08:00:00.000Z",
    ),
    {
      purpose: "Split teren",
      reservedForLabel: "Luka Servis",
      startAt: "2026-03-30T06:00:00.000Z",
      endAt: "2026-03-31T18:00:00.000Z",
    },
    () => "reservation-b",
    () => "2026-03-29T08:15:00.000Z",
  );
  const serviceVehicle = createVehicle(
    {
      organizationId: "55",
      name: "Servisna limuzina",
      plateNumber: "ZG 0003 CC",
      status: "service",
    },
    state,
    () => "vehicle-c",
    () => "2026-03-29T08:00:00.000Z",
  );

  const filtered = filterVehicles([availableVehicle, reservedVehicle, serviceVehicle], {
    query: "split",
    status: "reserved",
    nowValue: "2026-03-30T09:00:00.000Z",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "vehicle-b");
  assert.deepEqual(
    sortVehicles([availableVehicle, serviceVehicle, reservedVehicle], "2026-03-30T09:00:00.000Z").map((item) => item.id),
    ["vehicle-b", "vehicle-a", "vehicle-c"],
  );
});

test("vehicles keep vin, documents and activity history", () => {
  const state = buildState();
  const vehicle = createVehicle(
    {
      organizationId: "55",
      name: "Servisni kombi 9",
      plateNumber: "ZG 9090 ZZ",
      vinNumber: "vf1jl000123456789",
      documents: [
        {
          fileName: "Prometna.pdf",
          documentCategory: "prometna",
          dataUrl: "data:application/pdf;base64,AAAA",
        },
      ],
      activityItems: [
        {
          activityType: "service",
          performedOn: "2026-03-20",
          performedBy: "Auto centar Horvat",
          odometerKm: 152000,
          workSummary: "Mali servis i filteri",
        },
        {
          activityType: "technical_inspection",
          performedOn: "2026-03-25",
          performedBy: "CVH Sesvete",
          validUntil: "2027-03-25",
          note: "Prošao bez primjedbi",
        },
      ],
    },
    state,
    () => "vehicle-z",
    () => "2026-03-29T08:00:00.000Z",
  );

  assert.equal(vehicle.vinNumber, "VF1JL000123456789");
  assert.equal(vehicle.documents.length, 1);
  assert.equal(vehicle.documents[0].fileName, "Prometna.pdf");
  assert.equal(vehicle.activityItems.length, 2);
  assert.equal(vehicle.activityItems[0].activityType, "technical_inspection");
  assert.equal(vehicle.activityItems[0].performedBy, "CVH Sesvete");

  const updated = updateVehicle(
    vehicle,
    {
      documents: [
        ...vehicle.documents,
        {
          fileName: "Slika-vozila.jpg",
          documentCategory: "slika",
          dataUrl: "data:image/jpeg;base64,BBBB",
        },
      ],
    },
    {
      ...state,
      vehicles: [vehicle],
    },
    () => "2026-03-29T09:00:00.000Z",
  );

  assert.equal(updated.documents.length, 2);
  assert.equal(filterVehicles([updated], { query: "vf1jl000123456789" }).length, 1);
  assert.equal(filterVehicles([updated], { query: "cvh" }).length, 1);
  assert.equal(filterVehicles([updated], { query: "slika-vozila" }).length, 1);
});

test("dashboard insights summarize workload, priorities and upcoming deadlines", () => {
  const state = buildState();
  const workOrders = [
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Otvoreni RN",
        priority: "Urgent",
        dueDate: "2026-03-27",
        region: "Zagreb",
        executor1: "Ana Anic",
        description: "Urgent pregled",
      },
      state,
      () => "work-order-1",
      "RN-00001",
      () => "2026-03-25T09:00:00.000Z",
    ),
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Otvoreni RN",
        priority: "High",
        dueDate: "2026-04-02",
        region: "Zagreb",
        executor1: "Ana Anic",
        executor2: "Marko Maric",
        description: "Tjedni pregled",
      },
      state,
      () => "work-order-2",
      "RN-00002",
      () => "2026-03-25T10:00:00.000Z",
    ),
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Fakturiran RN",
        priority: "Normal",
        dueDate: "2026-03-26",
        region: "Sjever",
        description: "Zatvoreni nalog",
      },
      state,
      () => "work-order-3",
      "RN-00003",
      () => "2026-03-25T11:00:00.000Z",
    ),
  ];

  const insights = getDashboardInsights({
    companies: state.companies,
    locations: [
      state.locations[0],
      {
        ...state.locations[0],
        id: "location-2",
        name: "Bez koordinata",
        coordinates: "",
      },
    ],
    workOrders,
  }, "2026-03-28");

  assert.equal(insights.activeWorkOrders, 2);
  assert.equal(insights.urgentWorkOrders, 1);
  assert.equal(insights.dueThisWeekWorkOrders, 1);
  assert.equal(insights.missingCoordinatesLocations, 1);
  assert.deepEqual(insights.statusBreakdown.map((item) => item.label), ["Otvoreni RN", "Fakturiran RN"]);
  assert.deepEqual(insights.priorityBreakdown.map((item) => item.label), ["Urgent", "High"]);
  assert.equal(insights.topRegions[0].label, "Zagreb");
  assert.equal(insights.topCompanies[0].label, "Acme d.o.o.");
  assert.equal(insights.executorLoad[0].label, "Ana Anic");
  assert.equal(insights.executorLoad[0].count, 2);
  assert.equal(insights.upcomingWorkOrders[0].workOrderNumber, "RN-00001");
});

test("dashboard widgets normalize settings and keep deterministic ordering", () => {
  const widgetA = createDashboardWidget(
    {
      organizationId: "10",
      userId: "22",
      title: "",
      source: "work_orders",
      visualization: "metric",
      metricKey: "active",
      size: "small",
      limit: 99,
      position: 4,
      filters: { dateWindow: "7d" },
    },
    { dashboardWidgets: [] },
    () => "widget-a",
    () => "2026-03-28T09:00:00.000Z",
  );

  const widgetB = createDashboardWidget(
    {
      organizationId: "10",
      userId: "22",
      title: "Statusi",
      source: "work_orders",
      visualization: "donut",
      metricKey: "status",
      size: "large",
      limit: 5,
      position: 2,
      filters: {
        statusColors: {
          "Otvoreni RN": "#8a8f99",
          "Gotov RN": "not-a-color",
        },
      },
    },
    { dashboardWidgets: [widgetA] },
    () => "widget-b",
    () => "2026-03-28T09:05:00.000Z",
  );

  const updated = updateDashboardWidget(
    widgetA,
    {
      visualization: "bar",
      metricKey: "region",
      size: "full",
      filters: { region: "Zagreb", dateWindow: "overdue" },
    },
    { dashboardWidgets: [widgetA, widgetB] },
    () => "2026-03-28T10:00:00.000Z",
  );

  assert.equal(widgetA.title, "Otvoreni RN");
  assert.equal(widgetA.limit, 99);
  assert.equal(updated.visualization, "bar");
  assert.equal(updated.metricKey, "region");
  assert.equal(updated.size, "full");
  assert.equal(updated.filters.region, "Zagreb");
  assert.equal(updated.filters.dateWindow, "overdue");
  assert.equal(widgetB.filters.statusColors["Otvoreni RN"], "#8a8f99");
  assert.equal(widgetB.filters.statusColors["Gotov RN"], undefined);
  assert.deepEqual(sortDashboardWidgets([widgetA, widgetB]).map((item) => item.id), ["widget-b", "widget-a"]);
});

test("dashboard widget data supports KPI, chart and list outputs with filters", () => {
  const state = buildState();
  const workOrders = [
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Otvoreni RN",
        priority: "Urgent",
        dueDate: "2026-03-29",
        region: "Zagreb",
        executor1: "Ana Anic",
        tagText: "petrol",
        weight: "100,50 EUR",
        description: "Hitni pregled",
      },
      state,
      () => "work-order-1",
      "RN-10001",
      () => "2026-03-28T09:00:00.000Z",
    ),
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Fakturiran RN",
        priority: "Normal",
        dueDate: "2026-03-20",
        region: "Istra",
        executor1: "Marko Maric",
        weight: "250",
        description: "Zatvoreni nalog",
      },
      state,
      () => "work-order-2",
      "RN-10002",
      () => "2026-03-28T08:00:00.000Z",
    ),
  ];

  const metricWidget = createDashboardWidget(
    {
      organizationId: "10",
      userId: "22",
      source: "work_orders",
      visualization: "metric",
      metricKey: "active",
      filters: { companyId: "company-1" },
    },
    { dashboardWidgets: [] },
    () => "metric-widget",
    () => "2026-03-28T09:10:00.000Z",
  );

  const chartWidget = updateDashboardWidget(
    metricWidget,
    {
      visualization: "donut",
      metricKey: "status",
      size: "large",
      filters: {},
    },
    { dashboardWidgets: [metricWidget] },
    () => "2026-03-28T09:11:00.000Z",
  );

  const statusBarWidget = updateDashboardWidget(
    metricWidget,
    {
      visualization: "bar",
      metricKey: "status",
      size: "full",
      limit: 50,
      filters: {},
    },
    { dashboardWidgets: [metricWidget] },
    () => "2026-03-28T09:11:30.000Z",
  );

  const listWidget = updateDashboardWidget(
    metricWidget,
    {
      visualization: "list",
      metricKey: "upcoming_due",
      size: "large",
      limit: 4,
      filters: {},
    },
    { dashboardWidgets: [metricWidget] },
    () => "2026-03-28T09:12:00.000Z",
  );

  const statusGroupWidget = updateDashboardWidget(
    metricWidget,
    {
      visualization: "list",
      metricKey: "status_groups",
      size: "full",
      limit: 50,
      filters: {},
    },
    { dashboardWidgets: [metricWidget] },
    () => "2026-03-28T09:13:00.000Z",
  );

  const executorStatusWidget = updateDashboardWidget(
    metricWidget,
    {
      visualization: "bar",
      metricKey: "executor_status",
      size: "full",
      limit: 10,
      filters: {},
    },
    { dashboardWidgets: [metricWidget] },
    () => "2026-03-28T09:14:00.000Z",
  );

  const invoiceMetricWidget = updateDashboardWidget(
    metricWidget,
    {
      visualization: "metric",
      metricKey: "invoice_total",
      size: "small",
      filters: {},
    },
    { dashboardWidgets: [metricWidget] },
    () => "2026-03-28T09:15:00.000Z",
  );

  const invoiceStatusWidget = updateDashboardWidget(
    metricWidget,
    {
      visualization: "bar",
      metricKey: "invoice_status",
      size: "full",
      limit: 50,
      filters: {},
    },
    { dashboardWidgets: [metricWidget] },
    () => "2026-03-28T09:16:00.000Z",
  );

  const snapshot = {
    ...state,
    workOrders,
    reminders: [],
    todoTasks: [],
    locations: state.locations,
  };

  const metricData = getDashboardWidgetData(snapshot, metricWidget, { userId: "22" }, "2026-03-28");
  const chartData = getDashboardWidgetData(snapshot, chartWidget, { userId: "22" }, "2026-03-28");
  const statusBarData = getDashboardWidgetData(snapshot, statusBarWidget, { userId: "22" }, "2026-03-28");
  const listData = getDashboardWidgetData(snapshot, listWidget, { userId: "22" }, "2026-03-28");
  const statusGroupData = getDashboardWidgetData(snapshot, statusGroupWidget, { userId: "22" }, "2026-03-28");
  const executorStatusData = getDashboardWidgetData(snapshot, executorStatusWidget, { userId: "22" }, "2026-03-28");
  const invoiceMetricData = getDashboardWidgetData(snapshot, invoiceMetricWidget, { userId: "22" }, "2026-03-28");
  const invoiceStatusData = getDashboardWidgetData(snapshot, invoiceStatusWidget, { userId: "22" }, "2026-03-28");

  assert.equal(metricData.kind, "metric");
  assert.equal(metricData.value, 1);
  assert.equal(chartData.kind, "donut");
  assert.equal(chartData.items[0].label, "Otvoreni RN");
  assert.equal(chartData.items[0].count, 1);
  assert.equal(statusBarData.kind, "bar");
  assert.equal(statusBarData.items.length, 5);
  assert.deepEqual(statusBarData.items.map((item) => item.label), ["Otvoreni RN", "Gotov RN", "Ovjeren RN", "Fakturiran RN", "Storno RN"]);
  assert.equal(statusBarData.items.find((item) => item.label === "Gotov RN")?.count, 0);
  assert.equal(statusBarData.items.find((item) => item.label === "Fakturiran RN")?.count, 1);
  assert.equal(listData.kind, "list");
  assert.equal(listData.items[0].title, "RN-10001");
  assert.equal(statusGroupData.kind, "list");
  assert.equal(statusGroupData.items[0].type, "status_count");
  assert.equal(statusGroupData.items[0].title, "Otvoreni RN");
  assert.equal(statusGroupData.items[0].count, 1);
  assert.equal(statusGroupData.items[1].title, "Gotov RN");
  assert.equal(statusGroupData.items[1].count, 0);
  assert.ok(statusGroupData.items.some((item) => item.type === "status_count" && item.title === "Fakturiran RN" && item.count === 1));
  assert.equal(executorStatusData.kind, "bar");
  assert.equal(executorStatusData.items.find((item) => item.label === "Ana Anic")?.segments.find((segment) => segment.label === "Otvoreni RN")?.count, 1);
  assert.equal(executorStatusData.items.find((item) => item.label === "Marko Maric")?.segments.find((segment) => segment.label === "Fakturiran RN")?.count, 1);
  assert.equal(invoiceMetricData.kind, "metric");
  assert.equal(invoiceMetricData.valueType, "currency");
  assert.equal(invoiceMetricData.value, 350.5);
  assert.equal(invoiceStatusData.kind, "bar");
  assert.equal(invoiceStatusData.valueType, "currency");
  assert.equal(invoiceStatusData.items.find((item) => item.label === "Fakturiran RN")?.count, 250);
  assert.equal(invoiceStatusData.items.find((item) => item.label === "Otvoreni RN")?.count, 100.5);
});

test("createReminder can link to a work order and inherit company context", () => {
  const state = buildState();
  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Pregled hidranta",
    },
    state,
    () => "work-order-1",
    "RN-00991",
    () => "2026-03-25T09:00:00.000Z",
  );

  const reminder = createReminder(
    {
      organizationId: "55",
      workOrderId: workOrder.id,
      title: "Nazvati klijenta",
      dueDate: "2026-03-28",
    },
    {
      ...state,
      workOrders: [workOrder],
      reminders: [],
    },
    () => "reminder-1",
    () => "2026-03-26T08:00:00.000Z",
  );

  assert.equal(reminder.organizationId, "55");
  assert.equal(reminder.workOrderId, "work-order-1");
  assert.equal(reminder.workOrderNumber, "RN-00991");
  assert.equal(reminder.companyId, "company-1");
  assert.equal(reminder.locationId, "location-1");
  assert.equal(reminder.companyName, "Acme d.o.o.");
});

test("reminders filter, sort and completion updates behave predictably", () => {
  const state = buildState();
  const reminderActive = createReminder(
    {
      organizationId: "1",
      title: "Kasni reminder",
      dueDate: "2026-03-20",
      status: "active",
      companyId: "company-1",
    },
    {
      ...state,
      reminders: [],
    },
    () => "reminder-1",
    () => "2026-03-25T08:00:00.000Z",
  );
  const reminderSnoozed = createReminder(
    {
      organizationId: "1",
      title: "Kasnije",
      dueDate: "2026-03-30",
      status: "snoozed",
      companyId: "company-1",
    },
    {
      ...state,
      reminders: [reminderActive],
    },
    () => "reminder-2",
    () => "2026-03-25T08:05:00.000Z",
  );

  const doneReminder = updateReminder(
    reminderActive,
    { status: "done" },
    {
      ...state,
      reminders: [reminderActive, reminderSnoozed],
    },
    () => "2026-03-25T09:00:00.000Z",
  );

  assert.equal(doneReminder.status, "done");
  assert.equal(doneReminder.completedAt, "2026-03-25T09:00:00.000Z");

  const filtered = filterReminders([reminderActive, reminderSnoozed, doneReminder], {
    query: "kas",
    status: "active",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "reminder-1");

  const sorted = sortReminders([doneReminder, reminderSnoozed, reminderActive]);
  assert.equal(sorted[0].id, "reminder-1");
  assert.equal(sorted[1].id, "reminder-2");
  assert.equal(sorted[2].status, "done");
});

test("todo tasks support assignment, work-order linking, comments and filtering", () => {
  const state = buildState();
  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Dogovor s klijentom",
    },
    state,
    () => "work-order-1",
    "RN-00155",
    () => "2026-03-25T09:00:00.000Z",
  );

  const todo = createTodoTask(
    {
      organizationId: "7",
      title: "Nazovi klijenta",
      message: "Treba potvrditi termin i poslati odgovor kolegi.",
      assignedToUserId: "22",
      assignedToLabel: "Iva Novak",
      createdByUserId: "11",
      createdByLabel: "Branimir Tramošljika",
      workOrderId: workOrder.id,
      dueDate: "2026-03-29",
      priority: "High",
    },
    {
      ...state,
      workOrders: [workOrder],
      todoTasks: [],
    },
    () => "todo-1",
    () => "2026-03-26T08:00:00.000Z",
  );

  assert.equal(todo.companyId, "company-1");
  assert.equal(todo.locationId, "location-1");
  assert.equal(todo.workOrderNumber, "RN-00155");
  assert.equal(todo.assignedToLabel, "Iva Novak");

  const commented = createTodoTaskComment(
    todo,
    {
      userId: "22",
      authorLabel: "Iva Novak",
      message: "Preuzimam, javim povratnu informaciju danas.",
    },
    () => "comment-1",
    () => "2026-03-26T09:00:00.000Z",
  );

  assert.equal(commented.comments.length, 1);
  assert.equal(commented.commentCount, 1);
  assert.equal(commented.comments[0].message, "Preuzimam, javim povratnu informaciju danas.");

  const progressed = updateTodoTask(
    commented,
    {
      status: "in_progress",
      priority: "Urgent",
    },
    {
      ...state,
      workOrders: [workOrder],
      todoTasks: [commented],
    },
    () => "2026-03-26T10:00:00.000Z",
  );

  assert.equal(progressed.status, "in_progress");
  assert.equal(progressed.priority, "Urgent");

  const filtered = filterTodoTasks([progressed], {
    query: "klijenta",
    status: "in_progress",
    scope: "assigned",
    userId: "22",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "todo-1");

  const sorted = sortTodoTasks([
    {
      ...progressed,
      id: "todo-2",
      title: "Kasnije",
      dueDate: "2026-04-02",
      priority: "Normal",
      updatedAt: "2026-03-26T08:00:00.000Z",
    },
    progressed,
  ]);

  assert.equal(sorted[0].id, "todo-1");
});

test("parseCoordinates extracts numeric latitude and longitude", () => {
  assert.deepEqual(parseCoordinates("45,8123; 15,9777"), {
    latitude: 45.8123,
    longitude: 15.9777,
  });

  assert.equal(parseCoordinates("bez koordinata"), null);
});

test("buildWorkOrderCalendarLanes groups work orders by executor lane and day", () => {
  const lanes = buildWorkOrderCalendarLanes([
    {
      id: "wo-1",
      workOrderNumber: "RN-1",
      dueDate: "2026-03-30",
      executor1: "Ana Horvat",
      executor2: "Marko Ilic",
    },
    {
      id: "wo-2",
      workOrderNumber: "RN-2",
      dueDate: "2026-03-30",
      executor1: "Ana Horvat",
      executor2: "Marko Ilic",
    },
    {
      id: "wo-3",
      workOrderNumber: "RN-3",
      dueDate: "2026-04-01",
      executor1: "",
      executor2: "",
    },
    {
      id: "wo-4",
      workOrderNumber: "RN-4",
      dueDate: "",
      executor1: "Ana Horvat",
      executor2: "",
    },
  ], "2026-03-30");

  assert.deepEqual(lanes.days, [
    "2026-03-30",
    "2026-03-31",
    "2026-04-01",
    "2026-04-02",
    "2026-04-03",
    "2026-04-04",
    "2026-04-05",
  ]);
  assert.equal(lanes.lanes[0].label, "Ana Horvat + Marko Ilic");
  assert.equal(lanes.lanes[0].itemsByDate["2026-03-30"].length, 2);
  assert.equal(lanes.lanes.find((lane) => lane.key === "unassigned").itemsByDate["2026-04-01"].length, 1);
  assert.equal(lanes.unscheduled.length, 1);
});

test("buildWorkOrderCalendarMonthWeeks groups calendar items by day and keeps undated items separate", () => {
  const calendar = buildWorkOrderCalendarMonthWeeks([
    {
      id: "wo-m1",
      workOrderNumber: "RN-10",
      dueDate: "2026-03-03",
      executor1: "Ana Horvat",
      executor2: "Marko Ilic",
    },
    {
      id: "wo-m2",
      workOrderNumber: "RN-11",
      dueDate: "2026-03-03",
      executor1: "Ana Horvat",
      executor2: "Marko Ilic",
    },
    {
      id: "wo-m3",
      workOrderNumber: "RN-12",
      dueDate: "",
      executor1: "Ana Horvat",
      executor2: "",
    },
  ], "2026-03-15");

  assert.equal(calendar.weeks.length >= 4, true);
  assert.equal(calendar.weeks[0].days[0].key, "2026-02-23");

  const targetWeek = calendar.weeks.find((week) => week.days.some((day) => day.key === "2026-03-03"));
  assert.ok(targetWeek);

  const targetDay = targetWeek.days.find((day) => day.key === "2026-03-03");
  assert.equal(targetDay.items.length, 2);
  assert.deepEqual(targetDay.items.map((item) => item.workOrderNumber), ["RN-10", "RN-11"]);
  assert.equal(calendar.unscheduled.length, 1);
  assert.equal(calendar.unscheduled[0].workOrderNumber, "RN-12");
});

test("buildWorkOrderCalendarWeekColumns keeps unassigned work orders out of the main week columns", () => {
  const calendar = buildWorkOrderCalendarWeekColumns([
    {
      id: "wo-w1",
      workOrderNumber: "RN-21",
      dueDate: "2026-03-30",
      executor1: "Ana Horvat",
      executor2: "Marko Ilic",
    },
    {
      id: "wo-w2",
      workOrderNumber: "RN-22",
      dueDate: "2026-03-30",
      executor1: "",
      executor2: "",
    },
    {
      id: "wo-w3",
      workOrderNumber: "RN-23",
      dueDate: "",
      executor1: "",
      executor2: "",
    },
  ], "2026-03-30");

  assert.deepEqual(calendar.days.map((day) => day.key), [
    "2026-03-30",
    "2026-03-31",
    "2026-04-01",
    "2026-04-02",
    "2026-04-03",
    "2026-04-04",
    "2026-04-05",
  ]);
  assert.equal(calendar.days[0].items.length, 1);
  assert.equal(calendar.days[0].items[0].workOrderNumber, "RN-21");
  assert.equal(calendar.unassigned.length, 1);
  assert.equal(calendar.unassigned[0].workOrderNumber, "RN-22");
  assert.equal(calendar.unscheduled.length, 1);
  assert.equal(calendar.unscheduled[0].workOrderNumber, "RN-23");
});

test("buildWorkOrderCalendarTeamWeeks groups work orders by assigned team and keeps undated items on the side", () => {
  const calendar = buildWorkOrderCalendarTeamWeeks([
    {
      id: "wo-1",
      workOrderNumber: "RN-1",
      dueDate: "2026-03-03",
      teamLabel: "Tim Zagreb",
      executor1: "Ana Horvat",
      executor2: "Marko Ilic",
      region: "Zagreb",
    },
    {
      id: "wo-2",
      workOrderNumber: "RN-2",
      dueDate: "2026-03-05",
      teamLabel: "Tim Zagreb",
      executor1: "Ana Horvat",
      executor2: "",
      region: "Zagreb",
    },
    {
      id: "wo-3",
      workOrderNumber: "RN-3",
      dueDate: "2026-03-14",
      teamLabel: "Tim Slavonija",
      executor1: "Iva Novak",
      executor2: "",
      region: "Slavonija",
    },
    {
      id: "wo-4",
      workOrderNumber: "RN-4",
      dueDate: "",
      teamLabel: "Tim Zagreb",
      executor1: "Ana Horvat",
      executor2: "",
      region: "Zagreb",
    },
  ], "2026-03-15");

  assert.equal(calendar.weeks.length >= 4, true);
  assert.equal(calendar.weeks[0].days.length, 7);
  assert.equal(calendar.weeks[0].days[0].key, "2026-02-23");
  assert.equal(calendar.weeks[0].days[6].key, "2026-03-01");

  const zagrebWeek = calendar.weeks.find((week) => week.groups.some((group) => group.label === "Tim Zagreb"));
  assert.ok(zagrebWeek);
  const zagrebGroup = zagrebWeek.groups.find((group) => group.label === "Tim Zagreb");
  assert.equal(zagrebGroup.itemsByDate["2026-03-03"].length, 1);
  assert.equal(zagrebGroup.itemsByDate["2026-03-05"].length, 1);

  assert.equal(calendar.unscheduledGroups.length, 1);
  assert.equal(calendar.unscheduledGroups[0].label, "Tim Zagreb");
  assert.equal(calendar.unscheduledGroups[0].items.length, 1);
});

test("buildWorkOrderCalendarTeamWeeks falls back to executor grouping when team is empty", () => {
  const calendar = buildWorkOrderCalendarTeamWeeks([
    {
      id: "wo-10",
      workOrderNumber: "RN-10",
      dueDate: "2026-03-03",
      teamLabel: "",
      executor1: "Branimir Tramošljika",
      executor2: "Ivan Babić",
    },
    {
      id: "wo-11",
      workOrderNumber: "RN-11",
      dueDate: "2026-03-03",
      teamLabel: "",
      executor1: "Branimir Tramošljika",
      executor2: "Ivan Babić",
    },
    {
      id: "wo-12",
      workOrderNumber: "RN-12",
      dueDate: "",
      teamLabel: "",
      executor1: "Branimir Tramošljika",
      executor2: "Ivan Babić",
    },
  ], "2026-03-15");

  const groupedWeek = calendar.weeks.find((week) => week.groups.some((group) => group.label === "Branimir Tramošljika + Ivan Babić"));
  assert.ok(groupedWeek);

  const executorGroup = groupedWeek.groups.find((group) => group.label === "Branimir Tramošljika + Ivan Babić");
  assert.equal(executorGroup.itemsByDate["2026-03-03"].length, 2);

  assert.equal(calendar.unscheduledGroups.length, 1);
  assert.equal(calendar.unscheduledGroups[0].label, "Branimir Tramošljika + Ivan Babić");
  assert.equal(calendar.unscheduledGroups[0].items.length, 1);
});

test("buildWorkOrderMapMarkers returns only work orders with valid coordinates", () => {
  const map = buildWorkOrderMapMarkers([
    {
      id: "wo-1",
      workOrderNumber: "RN-1",
      companyName: "Acme",
      locationName: "Zagreb",
      region: "Zagreb",
      coordinates: "45.815, 15.982",
    },
    {
      id: "wo-2",
      workOrderNumber: "RN-2",
      companyName: "Acme",
      locationName: "Split",
      region: "Dalmacija",
      coordinates: "",
    },
  ]);

  assert.equal(map.markers.length, 1);
  assert.equal(map.markers[0].workOrderNumber, "RN-1");
  assert.ok(map.markers[0].x >= 0 && map.markers[0].x <= 100);
  assert.ok(map.markers[0].y >= 0 && map.markers[0].y <= 100);
});

test("measurement equipment supports templates, documents, filters and sorting", () => {
  const state = buildState();
  const templateA = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "Zapisnik A",
      documentType: "Zapisnik",
      status: "active",
      sampleCompanyId: "company-1",
      sampleLocationId: "location-1",
    },
    state,
    () => "template-a",
    () => "2026-03-31T08:00:00.000Z",
  );
  const templateB = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "Zapisnik B",
      documentType: "Zapisnik",
      status: "active",
      sampleCompanyId: "company-1",
      sampleLocationId: "location-1",
    },
    state,
    () => "template-b",
    () => "2026-03-31T08:05:00.000Z",
  );
  state.documentTemplates = [templateA, templateB];

  const first = createMeasurementEquipmentItem(
    {
      organizationId: "org-1",
      name: "Fluke 1664",
      equipmentKind: "measurement",
      manufacturer: "Fluke",
      deviceType: "Tester",
      deviceCode: "MET-01",
      inventoryNumber: "INV-001",
      requiresCalibration: true,
      calibrationDate: "2026-03-01",
      calibrationPeriod: "12 mjeseci",
      validUntil: "2026-12-31",
      linkedTemplateIds: ["template-a"],
      documents: [
        {
          fileName: "umjernica.pdf",
          fileType: "application/pdf",
          fileSize: 1024,
          documentCategory: "umjernica",
          description: "Aktivna umjernica",
          dataUrl: "data:application/pdf;base64,AAA",
        },
      ],
    },
    state,
    () => "equipment-1",
    () => "2026-03-31T08:10:00.000Z",
  );

  state.measurementEquipment = [first];

  const second = createMeasurementEquipmentItem(
    {
      organizationId: "org-1",
      name: "Sonel PAT",
      equipmentKind: "testing",
      manufacturer: "Sonel",
      deviceType: "PAT tester",
      deviceCode: "TIP-02",
      inventoryNumber: "INV-002",
      validUntil: "2026-08-01",
      linkedTemplateIds: ["template-b"],
    },
    state,
    () => "equipment-2",
    () => "2026-03-31T08:15:00.000Z",
  );

  const updatedSecond = updateMeasurementEquipmentItem(
    second,
    {
      note: "Koristi se za redovni pregled.",
      deviceCode: "TIP-03",
      linkedTemplateIds: ["template-b"],
      activityItems: [
        {
          id: "activity-1",
          activityType: "pregled",
          performedOn: "2026-03-29",
          performedBy: "Ana",
        },
        {
          id: "activity-2",
          activityType: "umjeravanje",
          performedOn: "2026-04-02",
          performedBy: "Marko",
          calibrationPeriod: "24 mjeseca",
          validUntil: "2028-04-02",
          satisfies: "da",
        },
      ],
      documents: [
        {
          fileName: "karton.jpg",
          fileType: "image/jpeg",
          fileSize: 2048,
          documentCategory: "karton_uredaja",
          description: "Karton uredaja",
          dataUrl: "data:image/jpeg;base64,BBB",
        },
      ],
    },
    {
      ...state,
      measurementEquipment: [first, second],
    },
    () => "2026-03-31T09:00:00.000Z",
  );

  assert.deepEqual(first.linkedTemplateTitles, ["Zapisnik A"]);
  assert.equal(first.documents.length, 1);
  assert.equal(first.documents[0].documentCategory, "umjernica");
  assert.equal(first.deviceCode, "MET-01");
  assert.equal(updatedSecond.deviceCode, "TIP-03");
  assert.equal(updatedSecond.linkedTemplateTitles[0], "Zapisnik B");
  assert.equal(updatedSecond.documents[0].fileName, "karton.jpg");
  assert.equal(updatedSecond.documents[0].documentCategory, "karton_uredaja");
  assert.equal(updatedSecond.activityItems.length, 2);
  assert.equal(updatedSecond.requiresCalibration, true);
  assert.equal(updatedSecond.calibrationDate, "2026-04-02");
  assert.equal(updatedSecond.calibrationPeriod, "24 mjeseca");
  assert.equal(updatedSecond.validUntil, "2028-04-02");
  assert.equal(updatedSecond.activityItems[0].satisfies, "da");

  const filtered = filterMeasurementEquipmentItems([first, updatedSecond], {
    query: "marko",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "equipment-2");

  const sorted = sortMeasurementEquipmentItems([first, updatedSecond]);
  assert.equal(sorted[0].id, "equipment-1");
  assert.equal(sorted[1].id, "equipment-2");
});

test("safety authorizations support template links, filters and sorting", () => {
  const state = buildState();
  const template = createDocumentTemplate(
    {
      organizationId: "org-1",
      title: "Servisni zapisnik",
      documentType: "Servisni zapisnik",
      status: "active",
      sampleCompanyId: "company-1",
      sampleLocationId: "location-1",
    },
    state,
    () => "template-auth",
    () => "2026-03-31T10:00:00.000Z",
  );
  state.documentTemplates = [template];

  const first = createSafetyAuthorization(
    {
      organizationId: "org-1",
      title: "Ovlaštenje za ispitivanje",
      scope: "NN 1/2026",
      issuedOn: "2026-01-15",
      validUntil: "2026-06-01",
      linkedTemplateIds: ["template-auth"],
    },
    state,
    () => "auth-1",
    () => "2026-03-31T10:05:00.000Z",
  );

  const second = createSafetyAuthorization(
    {
      organizationId: "org-1",
      title: "Ovlaštenje za servis",
      scope: "Servis i pregled",
      issuedOn: "2026-02-01",
      validForever: true,
      documents: [
        {
          id: "auth-doc-1",
          fileName: "ovlastenje-servis.pdf",
          fileType: "application/pdf",
          dataUrl: "data:application/pdf;base64,AAAA",
        },
      ],
    },
    state,
    () => "auth-2",
    () => "2026-03-31T10:10:00.000Z",
  );

  const updatedSecond = updateSafetyAuthorization(
    second,
    {
      note: "Vrijedi za internu ekipu.",
      linkedTemplateIds: ["template-auth"],
    },
    state,
    () => "2026-03-31T10:30:00.000Z",
  );

  assert.deepEqual(first.linkedTemplateTitles, ["Servisni zapisnik"]);
  assert.deepEqual(updatedSecond.linkedTemplateTitles, ["Servisni zapisnik"]);
  assert.equal(second.validForever, true);
  assert.equal(second.validUntil, null);
  assert.equal(second.documents[0].fileName, "ovlastenje-servis.pdf");

  const filtered = filterSafetyAuthorizations([first, updatedSecond], {
    query: "ovlastenje-servis.pdf",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "auth-2");

  const sorted = sortSafetyAuthorizations([updatedSecond, first]);
  assert.equal(sorted[0].id, "auth-1");
});
