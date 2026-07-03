export const WORK_ORDER_DOCUMENT_WORK_EQUIPMENT_FILTERS = Object.freeze([
  { key: "all", label: "Sva oprema" },
  { key: "overdue", label: "Istekla" },
  { key: "upcoming", label: "Uskoro" },
  { key: "no-deadline", label: "Bez roka" },
  { key: "satisfactory", label: "Zadovoljava" },
  { key: "unsatisfactory", label: "Ne zadovoljava" },
]);

export const WORK_ORDER_DOCUMENT_WORK_EQUIPMENT_SCOPES = Object.freeze([
  { key: "employer", label: "Sva oprema poslodavca" },
  { key: "locations", label: "Oprema po lokacijama" },
]);

export const WORK_ORDER_DOCUMENT_RO_MATRIX_SECTIONS = Object.freeze([
  { key: "basic", title: "Osnovni podaci", subtitle: "Broj, tvrtka, lokacija" },
  { key: "equipment", title: "Podaci o radnoj opremi", subtitle: "Naziv, tip, serijski i namjena" },
  { key: "inspection", title: "Podaci o ispitivanju", subtitle: "Datumi, ispitivači i zaključak" },
  { key: "obligationRegulations", title: "Propisi - obveza", subtitle: "Obveza ispitivanja" },
  { key: "requirementRegulations", title: "Propisi - zahtjevi", subtitle: "Prema čemu je provjereno" },
  { key: "mechanical", title: "Strojarski dio", subtitle: "Provjere iz RadnaOprema sheeta" },
  { key: "electrical", title: "Elektro dio", subtitle: "Električne provjere" },
  { key: "risks", title: "Opasnosti / štetnosti / napori", subtitle: "Identificirani rizici" },
  { key: "attachments", title: "Fotografije i dokumentacija", subtitle: "Prilozi zapisniku" },
]);

export const WORK_ORDER_DOCUMENT_RO_FORM_FIELD_GROUPS = Object.freeze({
  basic: Object.freeze([
    { key: "workOrderNumber", label: "Broj radnog naloga" },
    { key: "internalId", label: "Broj internog dokumenta" },
    { key: "company", label: "Tvrtka / naručitelj" },
    { key: "companyOib", label: "Tvrtka - OIB" },
    { key: "testingLocation", label: "Mjesto ispitivanja" },
    { key: "location", label: "Lokacija - IS ZNR" },
    { key: "roRecordId", label: "Id radne opreme" },
    { key: "recordNumber", label: "Generirani broj zapisnika" },
  ]),
  equipment: Object.freeze([
    { key: "template", label: "Template" },
    { key: "name", label: "Naziv radne opreme" },
    { key: "manufacturer", label: "Proizvođač" },
    { key: "model", label: "Tip" },
    { key: "serialNumber", label: "Serijski broj" },
    { key: "inventoryNumber", label: "Inventarni broj" },
    { key: "note", label: "Dodatni podaci" },
    { key: "technicalData", label: "Tehnički podaci" },
    { key: "purposeDescription", label: "Namjena radne opreme" },
    { key: "workspacePosition", label: "Pozicija radne opreme" },
    { key: "workingSubstancesAndRawMaterials", label: "Radne tvari i sirovine" },
  ]),
  inspection: Object.freeze([
    { key: "startDate", label: "Datum početka ispitivanja" },
    { key: "endDate", label: "Datum završetka ispitivanja" },
    { key: "deadline", label: "Vrijedi do" },
    { key: "grade", label: "Zadovoljava DA/NE" },
    { key: "deadlineNote", label: "Napomena za iduće ispitivanje" },
    { key: "deficiencies", label: "Utvrđeni nedostatci" },
    { key: "measuresToEliminateDeficiencies", label: "Mjere za otklanjanje" },
    { key: "experts", label: "Ispitivači" },
    { key: "signedBy", label: "Nositelji ovlaštenja" },
    { key: "instruments", label: "Mjerna oprema" },
    { key: "useAndMaintenance", label: "Upute proizvođača za uporabu i održavanje" },
    { key: "methodsProceduresAndNorms", label: "Metode, postupci i norme" },
  ]),
});

export const WORK_ORDER_DOCUMENT_RO_OBLIGATION_REGULATION_ITEMS = Object.freeze([
  {
    iri: "/api/v3/ro_obligation_registers/1",
    label: "Zakon o zaštiti na radu (Narodne novine br. 71/14, 118/14, 94/18 i 96/18)",
  },
  {
    iri: "/api/v3/ro_obligation_registers/2",
    label: "Pravilnik o pregledu i ispitivanju radne opreme (Narodne novine br.16/16 i 120/22)",
  },
]);

export const WORK_ORDER_DOCUMENT_RO_REQUIREMENT_REGULATION_ITEMS = Object.freeze([
  { iri: "/api/v3/ro_health_requirement_registers/1", label: "Zakon o normizaciji (Narodne novine br. 80/13)" },
  { iri: "/api/v3/ro_health_requirement_registers/11", label: "Zakon o zaštiti na radu (Narodne novine br. 71/14, 118/14, 94/18 i 96/18)" },
  { iri: "/api/v3/ro_health_requirement_registers/2", label: "Pravilnik o pregledu i ispitivanju radne opreme (Narodne novine br.16/16 i 120/22)" },
  { iri: "/api/v3/ro_health_requirement_registers/3", label: "Pravilnik o sigurnosti strojeva (Narodne Novine br. 28/11)" },
  { iri: "/api/v3/ro_health_requirement_registers/4", label: "Pravilnik o zaštiti na radu za mjesta rada (Narodne novine br. 105/20)" },
  { iri: "/api/v3/ro_health_requirement_registers/5", label: "Pravilnik o tehničkim normativima za dizalice (Sl. List br 65/91)" },
  { iri: "/api/v3/ro_health_requirement_registers/6", label: "Pravilnik o sigurnosnim znakovima (Narodne novine br. 91/15)" },
  { iri: "/api/v3/ro_health_requirement_registers/7", label: "Pravilnik o zaštiti na radu pri utovaru i istovaru tereta (Narodne novine br. 49/86)" },
  { iri: "/api/v3/ro_health_requirement_registers/8", label: "Popis Hrvatskih normi u području sigurnosti strojeva (Narodne novine br. 122/14)" },
  { iri: "/api/v3/ro_health_requirement_registers/9", label: "Popis Hrvatskih normi za tlačne posude (Narodne novine br. 27/13)" },
  { iri: "/api/v3/ro_health_requirement_registers/10", label: "Popis Hrvatskih normi za plinske uređaje (Narodne Novine br. 141/09)" },
  { iri: "/api/v3/ro_health_requirement_registers/13", label: "Pravilnik o sigurnosti i zdravlju pri radu s električnom energijom (Narodne novine br. 88/12)" },
  { iri: "/api/v3/ro_health_requirement_registers/12", label: "Pravilnik o zaštiti na radu pri uporabi radne opreme (Narodne novine br. 18/17)" },
  { iri: "/api/v3/ro_health_requirement_registers/15", label: "Pravilnik o zaštiti radnika od izloženosti vibracija na radu (Narodne novine, br. 148/23)" },
  { iri: "/api/v3/ro_health_requirement_registers/16", label: "Pravilnik o zaštiti radnika o izloženosti buci na radu (Narodne novine, br. 148/23)" },
]);

export const WORK_ORDER_DOCUMENT_RO_MECHANICAL_ITEMS = Object.freeze([
  { iri: "/api/v3/ro_mechanical_engineering_registers/1", label: "Smještaj i osiguranje slobodnog prostora za neometan pristup, kretanje, rad i održavanje" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/2", label: "Način postavljanja - osiguranje stabilnosti" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/3", label: "Zaštita od pokretnih dijelova" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/4", label: "Zaštita od pokretnih dijelova - prijenosnici snage i gibanja" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/5", label: "Zaštita od pokretnih dijelova - radni elementi" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/6", label: "Zaštita od padajućih ili izbačenih predmeta" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/7", label: "Djelovanje uređaja za uključivanje i isključivanje" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/8", label: "Djelovanje uređaja za isključivanje u slučaju opasnosti" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/9", label: "Upravljačko mjesto" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/10", label: "Djelovanje uređaja za upravljanje" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/11", label: "Ostvarivanje gibanja i djelovanja prema oznakama i smjerovima" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/12", label: "Raspoloživost i ispravnost zaštitnih naprava i uređaja" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/13", label: "Raspoloživost i ispravnost mjernih/kontrolnih uređaja" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/14", label: "Zaštita od neočekivanog pokretanja" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/15", label: "Zaštita od neovlaštenog korištenja" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/16", label: "Zaštita od zatvaranja u opasni prostor" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/17", label: "Opremljenost, označavanje i ispravnost upravljačkih i signalnih elemenata" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/18", label: "Opremljenost znakovima sigurnosti" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/19", label: "Zaštita od propadanja, lomova, deformacija pri statičkom i dinamičkom opterećenju" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/20", label: "Zaštita od vrućih/hladnih dijelova" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/21", label: "Primjena mjera za zaštitu od požara i eksplozije" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/22", label: "Zaštita od opasnih tvari - plinova, tekućina, para, aerosola, prašine" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/23", label: "Sigurnosni elementi tlačne opreme" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/24", label: "Zaštita od buke" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/25", label: "Zaštita od vibracija" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/26", label: "Primjena specifičnih propisa ovisno o primjeni" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/27", label: "Način priključka na odgovarajuće instalacije" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/28", label: "Promjene nastale korištenjem" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/29", label: "Opremljenost odgovarajućim uputama" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/30", label: "Raspoloživost tehničke dokumentacije" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/31", label: "Radno opterećenje na karakterističnim pozicijama radnih elemenata" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/32", label: "Raspoloživost osobne zaštitne opreme" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/33", label: "Odvođenje produkata izgaranja je odgovarajuće" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/34", label: "Mehanizam hidrauličkog sustava osigurava besprijekoran rad" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/35", label: "Probno statičko ispitivanje provedeno je s poznatim pokusnim teretom" },
  { iri: "/api/v3/ro_mechanical_engineering_registers/36", label: "Probno dinamičko ispitivanje provedeno je s poznatim pokusnim teretom" },
]);

export const WORK_ORDER_DOCUMENT_RO_ELECTRICAL_ITEMS = Object.freeze([
  { iri: "/api/v3/ro_electrical_registers/1", label: "Način priključka na električnu mrežu, nazivni napon" },
  { iri: "/api/v3/ro_electrical_registers/2", label: "Vrsta kabela, presjek vodiča, stanje izolacije" },
  { iri: "/api/v3/ro_electrical_registers/3", label: "Ispravnost priključnih naprava" },
  { iri: "/api/v3/ro_electrical_registers/4", label: "Zaštita od izravnog dodira dijelova pod naponom" },
  { iri: "/api/v3/ro_electrical_registers/5", label: "Dopuštena impedancija petlje kvara - Zsdop (Ω)" },
  { iri: "/api/v3/ro_electrical_registers/6", label: "Dopušteno vrijeme isključenja - ti (s)" },
  { iri: "/api/v3/ro_electrical_registers/7", label: "Nominalna struja nadstrujnog zaštitnog elementa - In (A)" },
  { iri: "/api/v3/ro_electrical_registers/8", label: "Izmjerena impedancija petlje kvara - Zs (Ω)" },
  { iri: "/api/v3/ro_electrical_registers/9", label: "Nominalna struja RCD - In (A)" },
  { iri: "/api/v3/ro_electrical_registers/10", label: "Nominalna diferencijalna struja RCD - Idn (A)" },
  { iri: "/api/v3/ro_electrical_registers/11", label: "Dopušteni neizravni napon dodira - Uidop (V)" },
  { iri: "/api/v3/ro_electrical_registers/12", label: "Izmjereni napon dodira uz Idn - Ui (V)" },
  { iri: "/api/v3/ro_electrical_registers/13", label: "Vrijeme isključenja RCD - ti (ms)" },
  { iri: "/api/v3/ro_electrical_registers/14", label: "Izjednačenje potencijala dohvatljivih vodljivih dijelova - Rgv (Ω)" },
  { iri: "/api/v3/ro_electrical_registers/15", label: "Zaštita sigurnosno malim naponom" },
  { iri: "/api/v3/ro_electrical_registers/16", label: "Oprema klase II (dvostruka izolacija)" },
  { iri: "/api/v3/ro_electrical_registers/17", label: "Zaštita od kratkog spoja i preopterećenja" },
  { iri: "/api/v3/ro_electrical_registers/18", label: "Otpor izolacije (MΩ)" },
  { iri: "/api/v3/ro_electrical_registers/19", label: "Zaštita od nekontroliranog uključenja" },
  { iri: "/api/v3/ro_electrical_registers/20", label: "Zaštita od povrata napona" },
  { iri: "/api/v3/ro_electrical_registers/21", label: "Zaštita od statičkog elektriciteta" },
  { iri: "/api/v3/ro_electrical_registers/22", label: "Zaštita od djelovanja munja (Ω)" },
  { iri: "/api/v3/ro_electrical_registers/23", label: "Zaštita od neionizirajućeg zračenja" },
  { iri: "/api/v3/ro_electrical_registers/24", label: "Zaštita od ionizirajućeg zračenja" },
  { iri: "/api/v3/ro_electrical_registers/25", label: "Primjena posebnih propisa i normi" },
  { iri: "/api/v3/ro_electrical_registers/26", label: "Izmjerena diferencijalna struja RCD - Id (A)" },
]);

export const WORK_ORDER_DOCUMENT_RO_RISK_ITEMS = Object.freeze([
  { iri: "/api/v3/hazard_registers/1", bucket: "hazardRegisterIris", label: "Mehaničke opasnosti" },
  { iri: "/api/v3/hazard_registers/2", bucket: "hazardRegisterIris", label: "Opasnosti od padova" },
  { iri: "/api/v3/hazard_registers/3", bucket: "hazardRegisterIris", label: "Električna struja" },
  { iri: "/api/v3/hazard_registers/4", bucket: "hazardRegisterIris", label: "Požar i eksplozija" },
  { iri: "/api/v3/hazard_registers/5", bucket: "hazardRegisterIris", label: "Termičke opasnosti" },
  { iri: "/api/v3/harmfulness_registers/1", bucket: "harmfulnessRegisterIris", label: "Kemijske štetnosti" },
  { iri: "/api/v3/harmfulness_registers/2", bucket: "harmfulnessRegisterIris", label: "Biološke štetnosti" },
  { iri: "/api/v3/harmfulness_registers/3", bucket: "harmfulnessRegisterIris", label: "Fizikalne štetnosti" },
  { iri: "/api/v3/strain_registers/1", bucket: "strainRegisterIris", label: "Statodinamički napori" },
  { iri: "/api/v3/strain_registers/2", bucket: "strainRegisterIris", label: "Psihofiziološki napori" },
  { iri: "/api/v3/strain_registers/3", bucket: "strainRegisterIris", label: "Napori vida" },
  { iri: "/api/v3/strain_registers/4", bucket: "strainRegisterIris", label: "Napori govora" },
]);

function normalizePresentationSearchText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseWorkOrderDocumentWorkEquipmentDate(value = "") {
  const normalized = String(value || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }
  const parsed = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getWorkOrderDocumentWorkEquipmentToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getWorkOrderDocumentWorkEquipmentDeadline(item = {}) {
  return parseWorkOrderDocumentWorkEquipmentDate(item.deadlineForNextExamination);
}

export function getWorkOrderDocumentWorkEquipmentGrade(item = {}) {
  return String(item.finalGrade?.label || item.finalGrade || "").trim();
}

export function normalizeWorkOrderDocumentWorkEquipmentGrade(value = "") {
  return normalizePresentationSearchText(value).trim();
}

export function getWorkOrderDocumentWorkEquipmentFilterKind(item = {}, today = getWorkOrderDocumentWorkEquipmentToday()) {
  const deadline = getWorkOrderDocumentWorkEquipmentDeadline(item);
  const grade = normalizeWorkOrderDocumentWorkEquipmentGrade(getWorkOrderDocumentWorkEquipmentGrade(item));
  const isOverdue = Boolean(deadline && deadline < today);
  const upcomingLimit = new Date(today);
  upcomingLimit.setDate(today.getDate() + 30);
  const isUpcoming = Boolean(deadline && deadline >= today && deadline <= upcomingLimit);
  const isUnsatisfactory = grade.includes("ne zadovoljava") || grade.includes("nezadovoljava");
  const isSatisfactory = !isUnsatisfactory && grade.includes("zadovoljava");
  return {
    deadline,
    isOverdue,
    isUpcoming,
    isUnsatisfactory,
    isSatisfactory,
  };
}

export function matchesWorkOrderDocumentWorkEquipmentFilter(item = {}, filterKey = "all", today = getWorkOrderDocumentWorkEquipmentToday()) {
  const kind = getWorkOrderDocumentWorkEquipmentFilterKind(item, today);
  switch (filterKey) {
    case "overdue":
      return kind.isOverdue;
    case "upcoming":
      return kind.isUpcoming;
    case "no-deadline":
      return !kind.deadline;
    case "satisfactory":
      return kind.isSatisfactory;
    case "unsatisfactory":
      return kind.isUnsatisfactory;
    case "all":
    default:
      return true;
  }
}

export function getWorkOrderDocumentWorkEquipmentFilterCounts(items = [], today = getWorkOrderDocumentWorkEquipmentToday()) {
  return WORK_ORDER_DOCUMENT_WORK_EQUIPMENT_FILTERS.reduce((counts, filter) => {
    counts[filter.key] = (Array.isArray(items) ? items : []).filter((item) =>
      matchesWorkOrderDocumentWorkEquipmentFilter(item, filter.key, today),
    ).length;
    return counts;
  }, {});
}

export function normalizeWorkOrderDocumentRoAssessmentSourceItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const source = item && typeof item === "object" ? item : { label: item };
      return {
        registerIri: String(source.registerIri || source.iri || source["@id"] || source.register || "").trim(),
        label: String(source.label || source.name || source.title || source.description || "").trim(),
        customContent: String(source.customContent || source.content || source.text || "").trim(),
        measuredValue: String(source.measuredValue || source.value || source.result || "").trim(),
        meetsConditions: Number(source.meetsConditions) === 0 || String(source.meetsConditions).toLowerCase() === "false" ? 0 : 1,
      };
    })
    .filter((item) => item.registerIri || item.label || item.customContent || item.measuredValue);
}

export function getWorkOrderDocumentRoAssessmentItems(item = {}, bucketKey = "mechanical") {
  const equipment = item.equipment || {};
  const meta = item.meta || {};
  const keys = bucketKey === "electrical"
    ? ["electricalItems", "roElectricals", "electricals", "electricalChecks"]
    : ["mechanicalItems", "roMechanicalEngineerings", "mechanicalEngineerings", "mechanicalChecks"];
  const sources = [
    ...keys.flatMap((key) => (Array.isArray(item[key]) ? item[key] : [])),
    ...keys.flatMap((key) => (Array.isArray(equipment[key]) ? equipment[key] : [])),
    ...keys.flatMap((key) => (Array.isArray(meta[key]) ? meta[key] : [])),
  ];
  return normalizeWorkOrderDocumentRoAssessmentSourceItems(sources);
}

export function getWorkOrderDocumentRoEquipmentValue(item = {}, key = "", {
  fallback = "-",
  formatDate = (value) => String(value || "").trim(),
  getLocationLabel = () => "",
  getGrade = getWorkOrderDocumentWorkEquipmentGrade,
} = {}) {
  const equipment = item.equipment || {};
  const value = (() => {
    switch (key) {
      case "name":
        return equipment.name || item.equipmentType || item.name || item.recordNumber;
      case "manufacturer":
        return equipment.manufacturer || item.manufacturer;
      case "model":
        return equipment.model || item.model || item.type;
      case "serialNumber":
        return equipment.serialNumber || item.serialNumber;
      case "inventoryNumber":
        return equipment.inventoryNumber || item.inventoryNumber;
      case "location":
        return getLocationLabel(item);
      case "object":
        return item.objectName || item.locationObjectName || item.workplaceName || item.meta?.objectName || item.meta?.workplaceName;
      case "startDate":
        return formatDate(item.startDate || item.inspectionDate);
      case "deadline":
        return formatDate(item.deadlineForNextExamination);
      case "grade":
        return getGrade(item);
      default:
        return "";
    }
  })();
  return String(value || "").trim() || fallback;
}

export function buildWorkOrderDocumentRoMatrixRows(item = {}, {
  today = getWorkOrderDocumentWorkEquipmentToday(),
  formatDate = (value) => String(value || "").trim(),
  getFilterKind = getWorkOrderDocumentWorkEquipmentFilterKind,
  getAssessmentItems = getWorkOrderDocumentRoAssessmentItems,
  summarizeAssessmentItems = () => "",
  getGrade = getWorkOrderDocumentWorkEquipmentGrade,
} = {}) {
  const equipment = item.equipment || {};
  const grade = getGrade(item);
  const kind = getFilterKind(item, today);
  const basics = [
    item.recordNumber,
    item.location,
    item.startDate,
    item.endDate,
    item.deadlineForNextExamination,
    grade,
  ].filter(Boolean).length;
  const equipmentData = [
    equipment.name,
    equipment.manufacturer,
    equipment.model,
    equipment.serialNumber,
    equipment.inventoryNumber,
    equipment.note,
    item.equipmentsTechnicalData,
    item.equipmentsPurposeDescription,
    item.equipmentsWorkspacePosition,
    item.workingSubstancesAndRawMaterials,
    item.useAndMaintenance,
  ].filter(Boolean).length;
  const obligationRegulations = (Array.isArray(item.roObligationRegister) ? item.roObligationRegister : [])
    .filter(Boolean).length;
  const requirementRegulations = [
    ...(Array.isArray(item.roHealthRequirementRegister) ? item.roHealthRequirementRegister : []),
    item.roHealthRequirementOther,
  ].filter(Boolean).length;
  const mechanicalItems = getAssessmentItems(item, "mechanical");
  const electricalItems = getAssessmentItems(item, "electrical");
  const mechanicalFallbackCount = [
    item.equipmentsTechnicalData,
    item.methodsProceduresAndNorms,
    item.deficiencies,
    item.measuresToEliminateDeficiencies,
  ].filter(Boolean).length;
  const electricalFallbackCount = [
    item.methodsProceduresAndNorms,
    item.useAndMaintenance,
  ].filter(Boolean).length;
  const mechanical = mechanicalItems.length || mechanicalFallbackCount;
  const electrical = electricalItems.length || electricalFallbackCount;
  const risks = [
    item.deficiencies,
    item.measuresToEliminateDeficiencies,
    ...(Array.isArray(item.hazardRegisterIris) ? item.hazardRegisterIris : []),
    ...(Array.isArray(item.harmfulnessRegisterIris) ? item.harmfulnessRegisterIris : []),
    ...(Array.isArray(item.strainRegisterIris) ? item.strainRegisterIris : []),
  ].filter(Boolean).length;
  const attachments = Number(item.attachmentCount || item.attachmentsCount || 0) || 0;
  return [
    {
      key: "basic",
      value: `${Math.min(basics, 6)} / 6`,
      detail: "popunjeno",
      ok: basics >= 5,
    },
    {
      key: "equipment",
      value: `${Math.min(equipmentData, 11)} / 11`,
      detail: "podaci",
      ok: equipmentData >= 6,
    },
    {
      key: "inspection",
      value: item.endDate ? formatDate(item.endDate) : "Nije ispitano",
      detail: item.deadlineForNextExamination ? `Vrijedi do: ${formatDate(item.deadlineForNextExamination)}` : "Vrijedi do: -",
      ok: Boolean(item.endDate && !kind.isOverdue),
      warning: kind.isUpcoming,
      alert: kind.isOverdue,
    },
    {
      key: "obligationRegulations",
      value: `${obligationRegulations || 0}`,
      detail: obligationRegulations ? "obveza potvrdena" : "bez obveze",
      ok: obligationRegulations > 0,
    },
    {
      key: "requirementRegulations",
      value: `${requirementRegulations || 0}`,
      detail: requirementRegulations ? "zahtjevi potvrdeni" : "bez zahtjeva",
      ok: requirementRegulations > 0,
    },
    {
      key: "mechanical",
      value: mechanicalItems.length ? `${mechanicalItems.length} stavki` : (mechanical ? "Zadovoljava" : "Provjeri"),
      detail: summarizeAssessmentItems(mechanicalItems, "mechanical", mechanical ? "opisni podaci" : "bez stavki"),
      ok: mechanical > 0 && !normalizeWorkOrderDocumentWorkEquipmentGrade(grade).includes("ne zadovoljava"),
      warning: mechanical === 0,
    },
    {
      key: "electrical",
      value: electricalItems.length ? `${electricalItems.length} stavki` : (electrical ? "Zadovoljava" : "Nije posebno"),
      detail: summarizeAssessmentItems(electricalItems, "electrical", electrical ? "opisni podaci" : "bez stavki"),
      ok: electrical > 0,
    },
    {
      key: "risks",
      value: risks ? `${risks} identificirano` : "0 identificirano",
      detail: item.deficiencies ? "ima nedostataka" : "bez istaknutih nedostataka",
      ok: risks === 0,
      warning: risks > 0,
    },
    {
      key: "attachments",
      value: `${attachments} priloga`,
      detail: item.sourceLabel || "IS ZNR",
      ok: attachments > 0,
    },
  ];
}
