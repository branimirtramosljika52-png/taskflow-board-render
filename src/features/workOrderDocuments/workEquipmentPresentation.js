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
  { key: "basic", title: "Osnovni podaci", subtitle: "Temeljni podaci" },
  { key: "equipment", title: "Podaci o radnoj opremi", subtitle: "Tehnicki podaci i specifikacije" },
  { key: "inspection", title: "Podaci o ispitivanju", subtitle: "Datumi, ocjene i rokovi" },
  { key: "obligationRegulations", title: "Propisi obavezni", subtitle: "Obveza ispitivanja" },
  { key: "requirementRegulations", title: "Propisi zahtjevi", subtitle: "Zahtjevi provjere" },
  { key: "mechanical", title: "Strojarski dio", subtitle: "Mehanicki pregledi i stanje" },
  { key: "electrical", title: "Elektro dio", subtitle: "Elektricni pregledi i stanje" },
  { key: "risks", title: "Opasnosti / stetnosti / napori", subtitle: "Identificirani rizici i napori" },
  { key: "attachments", title: "Prilozi", subtitle: "Dokumenti i fotografije" },
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
