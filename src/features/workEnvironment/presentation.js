import {
  getWorkOrderDocumentWorkEquipmentToday,
  normalizeWorkOrderDocumentWorkEquipmentGrade,
  parseWorkOrderDocumentWorkEquipmentDate,
} from "../workOrderDocuments/workEquipmentPresentation.js";
import { getWorkOrderDocumentWorkEnvironmentNumberValue } from "./physicalFactors.js";

export const WORK_ORDER_DOCUMENT_FC_FILTERS = Object.freeze([
  { key: "all", label: "Svi FC" },
  { key: "overdue", label: "Istekli" },
  { key: "upcoming", label: "Uskoro" },
  { key: "no-deadline", label: "Bez roka" },
  { key: "satisfactory", label: "Zadovoljava" },
  { key: "unsatisfactory", label: "Ne zadovoljava" },
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

export function getWorkOrderDocumentPhysicalFactorsDeadline(item = {}) {
  return parseWorkOrderDocumentWorkEquipmentDate(item.deadlineForNextExamination);
}

export function getWorkOrderDocumentPhysicalFactorsGrade(item = {}) {
  return String(item.finalGrade?.label || item.finalGrade || "").trim();
}

export function matchesWorkOrderDocumentPhysicalFactorsFilter(item = {}, filterKey = "all", today = getWorkOrderDocumentWorkEquipmentToday()) {
  const deadline = getWorkOrderDocumentPhysicalFactorsDeadline(item);
  const grade = normalizeWorkOrderDocumentWorkEquipmentGrade(getWorkOrderDocumentPhysicalFactorsGrade(item));
  const isOverdue = Boolean(deadline && deadline < today);
  const upcomingLimit = new Date(today);
  upcomingLimit.setDate(today.getDate() + 30);
  const isUpcoming = Boolean(deadline && deadline >= today && deadline <= upcomingLimit);
  const isUnsatisfactory = grade.includes("ne zadovoljava") || grade.includes("nezadovoljava");
  const isSatisfactory = !isUnsatisfactory && grade.includes("zadovoljava");
  switch (filterKey) {
    case "overdue":
      return isOverdue;
    case "upcoming":
      return isUpcoming;
    case "no-deadline":
      return !deadline;
    case "satisfactory":
      return isSatisfactory;
    case "unsatisfactory":
      return isUnsatisfactory;
    case "all":
    default:
      return true;
  }
}

export function getWorkOrderDocumentPhysicalFactorsFilterCounts(items = [], today = getWorkOrderDocumentWorkEquipmentToday()) {
  return WORK_ORDER_DOCUMENT_FC_FILTERS.reduce((counts, filter) => {
    counts[filter.key] = (Array.isArray(items) ? items : [])
      .filter((item) => matchesWorkOrderDocumentPhysicalFactorsFilter(item, filter.key, today)).length;
    return counts;
  }, {});
}

export function getWorkOrderDocumentWorkEnvironmentDisplayText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (Array.isArray(value)) {
    const labels = value
      .map((item) => getWorkOrderDocumentWorkEnvironmentDisplayText(item, ""))
      .filter(Boolean);
    return labels.join(", ") || fallback;
  }
  if (typeof value === "object") {
    const expert = value.expert && typeof value.expert === "object" ? value.expert : null;
    if (expert) {
      return getWorkOrderDocumentWorkEnvironmentDisplayText(expert, fallback);
    }
    const firstLast = [value.firstName, value.lastName].map((part) => String(part || "").trim()).filter(Boolean).join(" ");
    const direct = String(
      value.label
        || value.name
        || value.title
        || value.description
        || value.customContent
        || value.value
        || value.displayName
        || firstLast
        || value.oib
        || "",
    ).trim();
    return direct || fallback;
  }
  return String(value || "").trim() || fallback;
}

export function normalizeWorkOrderDocumentWorkEnvironmentUniqueLabels(values = [], labelMap = null) {
  const source = Array.isArray(values) ? values : [values];
  return [...new Set(source
    .map((value) => {
      if (labelMap && (typeof value === "number" || /^\d+$/.test(String(value || "").trim()))) {
        return labelMap[Number(value)] || String(value || "").trim();
      }
      return getWorkOrderDocumentWorkEnvironmentDisplayText(value, "");
    })
    .map((value) => String(value || "").trim())
    .filter(Boolean))];
}

export function getWorkOrderDocumentWorkEnvironmentGradeLabel(value = "") {
  const label = getWorkOrderDocumentWorkEnvironmentDisplayText(value, "");
  if (label) {
    const normalized = normalizePresentationSearchText(label);
    if (normalized === "1" || (normalized.includes("zadovoljava") && !normalized.includes("ne zadovoljava"))) {
      return "Zadovoljava";
    }
    if (normalized === "0" || normalized.includes("ne zadovoljava") || normalized.includes("nezadovoljava")) {
      return "Ne zadovoljava";
    }
    return label;
  }
  if (Number(value) === 1) return "Zadovoljava";
  if (Number(value) === 0) return "Ne zadovoljava";
  return "";
}

export function getWorkOrderDocumentWorkEnvironmentRecordId(item = {}) {
  return String(item?.id || item?.isznrId || item?.recordNumber || item?.internalId || "").trim();
}

export function getWorkOrderDocumentWorkEnvironmentPreviewItems(items = [], selectedIds = new Set(), filteredItems = []) {
  const selected = (Array.isArray(items) ? items : []).filter((item) =>
    selectedIds.has(getWorkOrderDocumentWorkEnvironmentRecordId(item)),
  );
  if (selected.length > 0) {
    return selected.slice(0, 4);
  }
  const source = Array.isArray(filteredItems) && filteredItems.length ? filteredItems : items;
  return (Array.isArray(source) ? source : []).slice(0, 4);
}

export function getWorkOrderDocumentWorkEnvironmentMeasurementRows(items = []) {
  return (Array.isArray(items) ? items : []).flatMap((item) => {
    const recordId = getWorkOrderDocumentWorkEnvironmentRecordId(item);
    const recordNumber = String(item?.recordNumber || item?.internalId || "").trim();
    return (Array.isArray(item?.measurements) ? item.measurements : [])
      .map((measurement, index) => ({
        ...measurement,
        recordId,
        recordNumber,
        rowId: String(measurement?.id || `${recordId || "record"}-${index + 1}`),
      }));
  });
}

export function getWorkOrderDocumentWorkEnvironmentSpaceRows(items = [], measurementRows = [], {
  createId = (prefix = "fc-space") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
} = {}) {
  const rows = new Map();
  const upsert = (space = {}, sourceItem = null) => {
    const sourceRecordId = getWorkOrderDocumentWorkEnvironmentRecordId(sourceItem || {});
    const key = String(space?.id || space?.code || space?.name || space?.spaceName || sourceRecordId || "").trim()
      || createId("fc-space");
    const existing = rows.get(key) || {
      id: key,
      code: "",
      name: "",
      description: "",
      processDescription: "",
      equipmentDescription: "",
      grades: new Set(),
      sourceRecords: new Set(),
      measurements: [],
    };
    existing.code = existing.code || String(space?.code || space?.oznaka || "").trim();
    existing.name = existing.name || getWorkOrderDocumentWorkEnvironmentDisplayText(space?.name || space?.spaceName || space?.title, "Prostor");
    existing.description = existing.description || getWorkOrderDocumentWorkEnvironmentDisplayText(space?.description || space?.purposeDescription, "");
    existing.processDescription = existing.processDescription || getWorkOrderDocumentWorkEnvironmentDisplayText(space?.processDescription || space?.workProcess, "");
    existing.equipmentDescription = existing.equipmentDescription || getWorkOrderDocumentWorkEnvironmentDisplayText(space?.equipmentDescription || space?.workEquipment, "");
    normalizeWorkOrderDocumentWorkEnvironmentUniqueLabels(space?.finalGrades || [])
      .forEach((grade) => existing.grades.add(getWorkOrderDocumentWorkEnvironmentGradeLabel(grade) || grade));
    if (sourceRecordId) {
      existing.sourceRecords.add(sourceRecordId);
    }
    rows.set(key, existing);
    return existing;
  };

  (Array.isArray(items) ? items : []).forEach((item) => {
    const spaces = Array.isArray(item?.spaces) ? item.spaces : [];
    spaces.forEach((space) => upsert(space, item));
  });

  (Array.isArray(measurementRows) ? measurementRows : []).forEach((measurement) => {
    const key = String(measurement?.spaceId || measurement?.spaceName || "").trim();
    const row = key && rows.has(key)
      ? rows.get(key)
      : upsert({
        id: key || `${measurement.recordId || "measurement"}-${measurement.spaceName || "space"}`,
        name: measurement.spaceName || "Prostor",
      }, { id: measurement.recordId });
    row.measurements.push(measurement);
  });

  return [...rows.values()].sort((left, right) =>
    String(left.name || left.code || "").localeCompare(String(right.name || right.code || ""), "hr", { numeric: true, sensitivity: "base" }),
  );
}

export function summarizeWorkOrderDocumentWorkEnvironmentValues(values = [], unit = "") {
  const labels = [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean))];
  if (!labels.length) {
    return "";
  }
  const numbers = labels
    .map((value) => getWorkOrderDocumentWorkEnvironmentNumberValue(value))
    .filter((value) => value !== null);
  if (numbers.length === labels.length && numbers.length > 0) {
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const suffix = unit ? ` ${unit}` : "";
    return min === max ? `${String(min).replace(".", ",")}${suffix}` : `${String(min).replace(".", ",")} - ${String(max).replace(".", ",")}${suffix}`;
  }
  return labels.slice(0, 3).join(", ");
}

export function summarizeWorkOrderDocumentWorkEnvironmentMeasurements(measurements = []) {
  const groups = new Map();
  (Array.isArray(measurements) ? measurements : []).forEach((measurement) => {
    const key = String(measurement?.kind || "Mjerenje").trim() || "Mjerenje";
    const group = groups.get(key) || { measured: [], allowed: [], units: new Set() };
    group.measured.push(measurement?.measured);
    group.allowed.push(measurement?.allowed);
    if (measurement?.unit) group.units.add(String(measurement.unit).trim());
    groups.set(key, group);
  });
  return [...groups.entries()]
    .map(([kind, group]) => {
      const unit = [...group.units].find(Boolean) || "";
      const measured = summarizeWorkOrderDocumentWorkEnvironmentValues(group.measured, unit);
      const allowed = summarizeWorkOrderDocumentWorkEnvironmentValues(group.allowed, unit);
      return [kind, measured ? `izmj. ${measured}` : "", allowed ? `dop. ${allowed}` : ""].filter(Boolean).join(": ");
    })
    .filter(Boolean)
    .slice(0, 4)
    .join(" · ");
}
