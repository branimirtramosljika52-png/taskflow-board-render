export function normalizeWorkOrderDocumentWorkEquipmentText(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DOCUMENTATION_NATIVE_TAB_ORDER = Object.freeze([
  "RO",
  "NO",
  "EIZ",
  "EMM",
  "SPR",
  "SZOM",
  "SZOMV",
  "TZIN",
  "VS",
  "FC",
  "KC",
  "SVZ",
  "HM",
  "SGP",
  "PPV",
  "PPZ",
  "SO",
  "PJENA",
  "EXEI",
  "EXSE",
  "EXOV",
  "NPI",
  "UNP",
  "NNZD",
]);

const DOCUMENTATION_NATIVE_TAB_ORDER_INDEX = new Map(
  DOCUMENTATION_NATIVE_TAB_ORDER.map((code, index) => [code, index]),
);

const DOCUMENTATION_NATIVE_TIMELINE_LABELS = Object.freeze([
  ...DOCUMENTATION_NATIVE_TAB_ORDER,
  "PLINSKAKOTLOVNICA",
  "NNZDPETROL",
  "RADNAOPREMA",
  "STROJEVI",
  "PPCAFFE",
  "VES",
  "HMUV",
  "HMU",
  "HMV",
  "SS",
  "PZP",
  "PZ",
  "DS",
  "ROF",
  "ROK",
  "PE",
  "EOTP",
  "ZNR",
  "TIPKALO",
  "PANIK",
]);

function normalizeNativeServiceCodeToken(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "");
}

export function normalizeDocumentTemplateRuntimeServiceCode(value = "") {
  const token = normalizeNativeServiceCodeToken(value);
  if (!token) {
    return "";
  }
  if (["RADNAOPREMA", "RADNEOPREME"].includes(token)) {
    return "RO";
  }
  if (["STROJEVI"].includes(token)) {
    return "NO";
  }
  if (["ROF", "FIZIKALNICIMBENICI", "FIZIKALNIHCIMBENIKA"].includes(token)) {
    return "FC";
  }
  if (["ROK", "KEMIJSKICIMBENICI", "KEMIJSKIHCIMBENIKA"].includes(token)) {
    return "KC";
  }
  if (["NNZDPETROL"].includes(token)) {
    return "NNZD";
  }
  if (["HMU", "HMV", "HMUV"].includes(token)) {
    return "HM";
  }
  if (["VES"].includes(token)) {
    return "VS";
  }
  if (["TIPKALO"].includes(token)) {
    return "TZIN";
  }
  if (["PANIK"].includes(token)) {
    return "SPR";
  }
  if (isWorkOrderDocumentPhysicalFactorsText(value)) {
    return "FC";
  }
  if (isWorkOrderDocumentChemicalFactorsText(value)) {
    return "KC";
  }
  if (isWorkOrderDocumentWorkEquipmentText(value)) {
    return "RO";
  }
  return token;
}

export function getDocumentTemplateRuntimeServiceCodeOrder(value = "") {
  const normalized = normalizeDocumentTemplateRuntimeServiceCode(value);
  return DOCUMENTATION_NATIVE_TAB_ORDER_INDEX.has(normalized)
    ? DOCUMENTATION_NATIVE_TAB_ORDER_INDEX.get(normalized)
    : Number.MAX_SAFE_INTEGER;
}

export function compareDocumentTemplateRuntimeServiceCodes(left = "", right = "") {
  const leftCode = normalizeDocumentTemplateRuntimeServiceCode(left);
  const rightCode = normalizeDocumentTemplateRuntimeServiceCode(right);
  const orderDelta = getDocumentTemplateRuntimeServiceCodeOrder(leftCode) - getDocumentTemplateRuntimeServiceCodeOrder(rightCode);
  if (orderDelta !== 0) {
    return orderDelta;
  }
  return String(leftCode || left).localeCompare(String(rightCode || right), "hr", { numeric: true, sensitivity: "base" });
}

function titleContainsNativeTimelineLabel(upperTitle = "", compactTitle = "", label = "") {
  const token = normalizeNativeServiceCodeToken(label);
  if (!token) {
    return false;
  }
  if (token.length <= 2) {
    return new RegExp(`(^|[^A-Z0-9])${token}([^A-Z0-9]|$)`).test(upperTitle);
  }
  return compactTitle.includes(token);
}

export function isWorkOrderDocumentWorkEquipmentText(value = "") {
  const normalized = normalizeWorkOrderDocumentWorkEquipmentText(value);
  const compact = normalized.replace(/\s+/g, "");
  if (
    /^ro\s+[fk]\b/.test(normalized)
    || normalized === "rof"
    || normalized.startsWith("rof ")
    || normalized === "rok"
    || normalized.startsWith("rok ")
  ) {
    return false;
  }
  return normalized.includes("radna oprema")
    || normalized.includes("radne opreme")
    || compact.includes("radnaoprema")
    || compact.includes("radneopreme")
    || normalized.includes("oprema za rad")
    || normalized.includes("opreme za rad")
    || normalized === "ro"
    || normalized.startsWith("ro ")
    || /^ro\d+\b/.test(normalized);
}

function getNativeServiceTextValues(source = {}) {
  if (!source || typeof source !== "object") {
    return [];
  }
  return [
    source?.name,
    source?.serviceName,
    source?.title,
    source?.label,
    source?.shortLabel,
    source?.serviceCode,
    source?.code,
    source?.shortCode,
    source?.serviceLine,
    source?.displayService,
    source?.serviceSummary,
    source?.serviceGroup,
    source?.group,
    source?.groupName,
    source?.category,
    source?.type,
    source?.kind,
    source?.templateTitle,
    source?.templateName,
    source?.documentTitle,
    source?.description,
    ...(Array.isArray(source?.linkedTemplateTitles) ? source.linkedTemplateTitles : []),
    ...(Array.isArray(source?.templateTitles) ? source.templateTitles : []),
  ];
}

function getWorkOrderNativeServiceCandidates(workOrder = {}, serviceItems = []) {
  const candidates = [];
  if (workOrder && typeof workOrder === "object") {
    candidates.push(workOrder);
    [
      workOrder?.service,
      workOrder?.primaryService,
      workOrder?.selectedService,
      workOrder?.template,
      ...(Array.isArray(workOrder?.serviceItems) ? workOrder.serviceItems : []),
      ...(Array.isArray(workOrder?.services) ? workOrder.services : []),
      ...(Array.isArray(workOrder?.selectedServices) ? workOrder.selectedServices : []),
      ...(Array.isArray(workOrder?.serviceCatalogItems) ? workOrder.serviceCatalogItems : []),
      ...(Array.isArray(workOrder?.linkedTemplates) ? workOrder.linkedTemplates : []),
      ...(Array.isArray(workOrder?.documentTemplates) ? workOrder.documentTemplates : []),
    ].forEach((candidate) => {
      if (candidate && typeof candidate === "object") {
        candidates.push(candidate);
      }
    });
  }
  if (Array.isArray(serviceItems)) {
    serviceItems.forEach((candidate) => {
      if (candidate && typeof candidate === "object") {
        candidates.push(candidate);
      }
    });
  }
  return candidates;
}

export function isWorkOrderDocumentWorkEquipmentService(service = {}) {
  return getNativeServiceTextValues(service).some((value) => isWorkOrderDocumentWorkEquipmentText(value));
}

export function isWorkOrderDocumentPhysicalFactorsText(value = "") {
  const normalized = normalizeWorkOrderDocumentWorkEquipmentText(value);
  if (!normalized || isWorkOrderDocumentWorkEquipmentText(value) || isWorkOrderDocumentChemicalFactorsText(value)) {
    return false;
  }
  return normalized === "fc"
    || normalized.startsWith("fc ")
    || normalized === "rof"
    || normalized.startsWith("rof ")
    || /^ro\s+f\b/.test(normalized)
    || normalized.includes("fizikalni cimbenici")
    || normalized.includes("fizikalnih cimbenika")
    || normalized.includes("radni okolis fizikal")
    || normalized.includes("radnog okolisa fizikal");
}

export function isWorkOrderDocumentPhysicalFactorsService(service = {}) {
  return getNativeServiceTextValues(service).some((value) => isWorkOrderDocumentPhysicalFactorsText(value));
}

export function isWorkOrderDocumentChemicalFactorsText(value = "") {
  const normalized = normalizeWorkOrderDocumentWorkEquipmentText(value);
  if (!normalized || isWorkOrderDocumentWorkEquipmentText(value)) {
    return false;
  }
  return normalized === "kc"
    || normalized.startsWith("kc ")
    || /^ro\s+k\b/.test(normalized)
    || normalized.includes("kemijski cimbenici")
    || normalized.includes("kemijskih cimbenika")
    || normalized.includes("radni okolis kemij")
    || normalized.includes("radnog okolisa kemij");
}

export function isWorkOrderDocumentChemicalFactorsService(service = {}) {
  return getNativeServiceTextValues(service).some((value) => isWorkOrderDocumentChemicalFactorsText(value));
}

export function isWorkOrderDocumentIsznrNativeService(service = {}) {
  return isWorkOrderDocumentWorkEquipmentService(service)
    || isWorkOrderDocumentPhysicalFactorsService(service)
    || isWorkOrderDocumentChemicalFactorsService(service);
}

export function shouldShowWorkOrderDocumentIsznrWorkEquipmentSection(workOrder = {}, serviceItems = []) {
  return getWorkOrderNativeServiceCandidates(workOrder, serviceItems)
    .some((candidate) => isWorkOrderDocumentWorkEquipmentService(candidate));
}

export function shouldShowWorkOrderDocumentPhysicalFactorsSection(workOrder = {}, serviceItems = []) {
  return getWorkOrderNativeServiceCandidates(workOrder, serviceItems)
    .some((candidate) => isWorkOrderDocumentPhysicalFactorsService(candidate));
}

export function shouldShowWorkOrderDocumentChemicalFactorsSection(workOrder = {}, serviceItems = []) {
  return getWorkOrderNativeServiceCandidates(workOrder, serviceItems)
    .some((candidate) => isWorkOrderDocumentChemicalFactorsService(candidate));
}

export function normalizeDocumentTemplateRuntimeNativeServiceKind(value = "") {
  const normalized = String(value || "").trim();
  if (["workEquipment", "physicalFactors", "chemicalFactors"].includes(normalized)) {
    return normalized;
  }
  const compact = normalized.toLowerCase();
  if (["ro", "work-equipment", "workequipment", "radna-oprema"].includes(compact)) {
    return "workEquipment";
  }
  if (["fc", "physical", "physical-factors", "physicalfactors"].includes(compact)) {
    return "physicalFactors";
  }
  if (["kc", "chemical", "chemical-factors", "chemicalfactors"].includes(compact)) {
    return "chemicalFactors";
  }
  return "";
}

export function getDocumentTemplateRuntimeNativeServiceKind(service = {}) {
  if (isWorkOrderDocumentWorkEquipmentService(service)) {
    return "workEquipment";
  }
  if (isWorkOrderDocumentPhysicalFactorsService(service)) {
    return "physicalFactors";
  }
  if (isWorkOrderDocumentChemicalFactorsService(service)) {
    return "chemicalFactors";
  }
  return "";
}

export function getDocumentTemplateRuntimeNativeServiceShortLabel(nativeKind = "") {
  const normalizedKind = normalizeDocumentTemplateRuntimeNativeServiceKind(nativeKind);
  if (normalizedKind === "workEquipment") {
    return "RO";
  }
  if (normalizedKind === "physicalFactors") {
    return "FC";
  }
  if (normalizedKind === "chemicalFactors") {
    return "KC";
  }
  return "IS ZNR";
}

export function getDocumentTemplateRuntimeNativeServiceTitle(nativeKind = "") {
  const normalizedKind = normalizeDocumentTemplateRuntimeNativeServiceKind(nativeKind);
  if (normalizedKind === "workEquipment") {
    return "Radna oprema";
  }
  if (normalizedKind === "physicalFactors") {
    return "Fizikalni čimbenici";
  }
  if (normalizedKind === "chemicalFactors") {
    return "Kemijski čimbenici";
  }
  return "IS ZNR usluga";
}

export function getDocumentTemplateRuntimeServiceBadgeLabel(service = {}) {
  if (isWorkOrderDocumentChemicalFactorsService(service)) {
    return "KC";
  }
  if (isWorkOrderDocumentPhysicalFactorsService(service)) {
    return "FC";
  }
  if (isWorkOrderDocumentWorkEquipmentService(service)) {
    return "RO";
  }

  const rawLabel = String(
    service.serviceCode
      || service.shortLabel
      || service.code
      || service.name
      || service.serviceName
      || "",
  ).trim();
  if (!rawLabel) {
    return "N/A";
  }

  const compact = rawLabel
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .split(/[·|,;/]+/)
    .map((part) => part.trim())
    .find(Boolean)
    || rawLabel;
  const words = compact.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const initials = words
      .map((word) => word.replace(/[^A-Za-z0-9ČĆŽŠĐčćžšđ]/g, "").charAt(0))
      .join("")
      .toUpperCase();
    if (initials.length >= 2 && initials.length <= 5) {
      return initials;
    }
  }

  return compact.length > 5 ? compact.slice(0, 5).toUpperCase() : compact.toUpperCase();
}

export function getDocumentTemplateRuntimeTimelineLabel(entry = {}) {
  const serviceCode = String(entry?.serviceCode || "").trim().toUpperCase();
  if (serviceCode) {
    const objectSequence = Number.parseInt(entry?.objectSequence, 10);
    const suffix = Number.isFinite(objectSequence) && objectSequence > 0 ? String(objectSequence) : "";
    return `${normalizeDocumentTemplateRuntimeServiceCode(serviceCode) || serviceCode}${suffix}`;
  }

  const rawTitle = String(entry?.templateTitle || "").trim();
  if (!rawTitle) {
    return "Zapisnik";
  }

  const upperTitle = rawTitle.toUpperCase();
  const compactTitle = normalizeNativeServiceCodeToken(rawTitle);
  const matchedLabel = [...DOCUMENTATION_NATIVE_TIMELINE_LABELS]
    .sort((left, right) => normalizeNativeServiceCodeToken(right).length - normalizeNativeServiceCodeToken(left).length)
    .find((label) => titleContainsNativeTimelineLabel(upperTitle, compactTitle, label));
  const objectSequence = Number.parseInt(entry?.objectSequence, 10);
  const suffix = Number.isFinite(objectSequence) && objectSequence > 0 ? String(objectSequence) : "";
  if (matchedLabel) {
    return `${normalizeDocumentTemplateRuntimeServiceCode(matchedLabel) || matchedLabel}${suffix}`;
  }

  const sanitized = upperTitle
    .replace(/[^A-Z0-9_\s-]+/g, " ")
    .split(/[\s_-]+/)
    .map((part) => part.replace(/\d+/g, "").trim())
    .find(Boolean);
  const baseLabel = sanitized || rawTitle;
  return `${baseLabel}${suffix}`;
}

export function groupDocumentTemplateRuntimeDockEntries(entries = []) {
  const groups = [];
  const groupsByWorkOrderId = new Map();

  (Array.isArray(entries) ? entries : []).forEach((entry, index) => {
    const workOrderId = String(entry?.workOrderId || `group-${index}`);
    let group = groupsByWorkOrderId.get(workOrderId);
    if (!group) {
      group = {
        workOrderId,
        workOrderNumber: String(entry?.workOrderNumber || "").trim() || "bez broja",
        items: [],
      };
      groupsByWorkOrderId.set(workOrderId, group);
      groups.push(group);
    }

    group.items.push({
      ...entry,
      dockIndex: index,
      timelineLabel: getDocumentTemplateRuntimeTimelineLabel(entry),
    });
  });

  return groups;
}

export function getDocumentTemplateRuntimeNativeServiceBadges(serviceItems = []) {
  const nativeServices = [];
  const seen = new Set();
  (Array.isArray(serviceItems) ? serviceItems : []).forEach((service) => {
    if (!isWorkOrderDocumentIsznrNativeService(service)) {
      return;
    }
    const label = getDocumentTemplateRuntimeServiceBadgeLabel(service);
    if (!label || seen.has(label)) {
      return;
    }
    seen.add(label);
    nativeServices.push(service);
  });
  return nativeServices;
}
