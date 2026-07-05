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
    return `${serviceCode}${suffix}`;
  }

  const rawTitle = String(entry?.templateTitle || "").trim();
  if (!rawTitle) {
    return "Zapisnik";
  }

  const upperTitle = rawTitle.toUpperCase();
  const knownLabels = ["EIZ", "TZIN", "SZOMV", "SZOM", "SVZ", "VES", "SPR", "ZNR", "TIPKALO", "PANIK"];
  const matchedLabel = knownLabels.find((label) => upperTitle.includes(label));
  const objectSequence = Number.parseInt(entry?.objectSequence, 10);
  const suffix = Number.isFinite(objectSequence) && objectSequence > 0 ? String(objectSequence) : "";
  if (matchedLabel) {
    return `${matchedLabel}${suffix}`;
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
