export const WORK_ORDER_STATUS_OPTIONS = [
  { value: "Otvoreni RN", label: "Otvoreni RN" },
  { value: "Gotov RN", label: "Gotov RN" },
  { value: "Ovjeren RN", label: "Ovjeren RN" },
  { value: "Fakturiran RN", label: "Fakturiran RN" },
  { value: "Storno RN", label: "Storno RN" },
];

export const PRIORITY_OPTIONS = [
  { value: "Urgent", label: "Urgent" },
  { value: "High", label: "High" },
  { value: "Normal", label: "Normal" },
  { value: "Niski prioritet", label: "Niski prioritet" },
  { value: "Bez prioriteta", label: "Bez prioriteta" },
];

const WORK_ORDER_STATUS_SET = new Set(WORK_ORDER_STATUS_OPTIONS.map((option) => option.value));
const PRIORITY_SET = new Set(PRIORITY_OPTIONS.map((option) => option.value));
const PRIORITY_RANK = {
  Urgent: 0,
  High: 1,
  Normal: 2,
  "Niski prioritet": 3,
  "Bez prioriteta": 4,
};

function isoNow() {
  return new Date().toISOString();
}

function todayString() {
  return isoNow().slice(0, 10);
}

function hasOwn(input, key) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function requireText(value, label) {
  const text = normalizeText(value);

  if (!text) {
    throw new Error(`${label} je obavezan.`);
  }

  return text;
}

function normalizeOptionalDate(value) {
  if (!value) {
    return null;
  }

  const raw = normalizeText(value);

  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const raw = normalizeText(value).toLowerCase();

  if (!raw) {
    return fallback;
  }

  if (["1", "true", "da", "yes", "aktivno"].includes(raw)) {
    return true;
  }

  if (["0", "false", "ne", "no", "neaktivno"].includes(raw)) {
    return false;
  }

  return fallback;
}

function normalizePriority(value) {
  const priority = normalizeText(value);
  return PRIORITY_SET.has(priority) ? priority : "Normal";
}

function normalizeWorkOrderStatus(value) {
  const status = normalizeText(value);
  return WORK_ORDER_STATUS_SET.has(status) ? status : "Otvoreni RN";
}

function normalizeOib(value) {
  const oib = normalizeText(value).replace(/\s+/g, "");

  if (!/^\d{11}$/.test(oib)) {
    throw new Error("OIB mora imati tocno 11 znamenki.");
  }

  return oib;
}

function normalizeId(value) {
  return normalizeText(value);
}

function parseContactSlot(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const slot = Number(value);

  if (!Number.isInteger(slot) || slot < 1) {
    return null;
  }

  return slot;
}

function uniqueByCaseInsensitive(items, value, getValue, currentId = "") {
  const needle = normalizeText(value).toLowerCase();

  if (!needle) {
    return false;
  }

  return items.some((item) => {
    if (item.id === currentId) {
      return false;
    }

    return normalizeText(getValue(item)).toLowerCase() === needle;
  });
}

function mergeContactFields(base, patch = {}) {
  const next = { ...base };

  for (const slot of [1, 2, 3]) {
    const nameKey = `contactName${slot}`;
    const phoneKey = `contactPhone${slot}`;
    const emailKey = `contactEmail${slot}`;

    if (hasOwn(patch, nameKey)) {
      next[nameKey] = normalizeText(patch[nameKey]);
    }

    if (hasOwn(patch, phoneKey)) {
      next[phoneKey] = normalizeText(patch[phoneKey]);
    }

    if (hasOwn(patch, emailKey)) {
      next[emailKey] = normalizeText(patch[emailKey]);
    }
  }

  return next;
}

function normalizeLocationContacts(contacts = []) {
  if (!Array.isArray(contacts)) {
    return [];
  }

  return contacts
    .map((contact, index) => ({
      slot: parseContactSlot(contact?.slot) ?? (index + 1),
      name: normalizeText(contact?.name),
      phone: normalizeText(contact?.phone),
      email: normalizeText(contact?.email),
    }))
    .filter((contact) => contact.name || contact.phone || contact.email)
    .map((contact, index) => ({
      ...contact,
      slot: index + 1,
    }));
}

function extractLegacyLocationContacts(location) {
  const contacts = [];

  for (const slot of [1, 2, 3]) {
    const contact = {
      slot,
      name: normalizeText(location[`contactName${slot}`]),
      phone: normalizeText(location[`contactPhone${slot}`]),
      email: normalizeText(location[`contactEmail${slot}`]),
    };

    if (contact.name || contact.phone || contact.email) {
      contacts.push(contact);
    }
  }

  return contacts;
}

function applyLocationContacts(target, contacts = []) {
  const normalizedContacts = normalizeLocationContacts(contacts);
  target.contacts = normalizedContacts;

  for (const slot of [1, 2, 3]) {
    const contact = normalizedContacts[slot - 1];
    target[`contactName${slot}`] = contact?.name ?? "";
    target[`contactPhone${slot}`] = contact?.phone ?? "";
    target[`contactEmail${slot}`] = contact?.email ?? "";
  }

  return target;
}

function hasLegacyContactFields(input = {}) {
  return [1, 2, 3].some((slot) => (
    hasOwn(input, `contactName${slot}`)
    || hasOwn(input, `contactPhone${slot}`)
    || hasOwn(input, `contactEmail${slot}`)
  ));
}

function resolvePatchedLocationContacts(current, patch = {}) {
  if (hasOwn(patch, "contacts")) {
    return patch.contacts;
  }

  if (!hasLegacyContactFields(patch)) {
    return buildLocationContacts(current);
  }

  const mergedLegacyContacts = extractLegacyLocationContacts(mergeContactFields(current, patch));
  const extraContacts = buildLocationContacts(current)
    .slice(3)
    .map((contact) => ({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    }));

  return [...mergedLegacyContacts, ...extraContacts];
}

export function buildLocationContacts(location) {
  if (!location) {
    return [];
  }

  if (Array.isArray(location.contacts)) {
    return normalizeLocationContacts(location.contacts);
  }

  return extractLegacyLocationContacts(location);
}

function selectLocationContact(location, preferredSlot) {
  const contacts = buildLocationContacts(location);

  if (contacts.length === 0) {
    return {
      slot: null,
      name: "",
      phone: "",
      email: "",
    };
  }

  const parsedPreferredSlot = parseContactSlot(preferredSlot);
  return contacts.find((contact) => contact.slot === parsedPreferredSlot) ?? contacts[0];
}

export function createCompany(input, existingCompanies = [], createId = () => crypto.randomUUID(), now = isoNow) {
  const timestamp = now();
  const company = {
    id: createId(),
    name: requireText(input.name, "Naziv tvrtke"),
    headquarters: normalizeText(input.headquarters),
    oib: normalizeOib(input.oib),
    contractType: normalizeText(input.contractType),
    contractNumber: normalizeText(input.contractNumber),
    period: normalizeText(input.period),
    isActive: normalizeBoolean(input.isActive, true),
    representative: normalizeText(input.representative),
    contactPhone: normalizeText(input.contactPhone),
    contactEmail: normalizeText(input.contactEmail),
    note: normalizeText(input.note),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (uniqueByCaseInsensitive(existingCompanies, company.oib, (item) => item.oib)) {
    throw new Error("Tvrtka s tim OIB-om vec postoji.");
  }

  return company;
}

export function updateCompany(current, patch, existingCompanies = [], now = isoNow) {
  const next = {
    ...current,
    name: hasOwn(patch, "name") ? requireText(patch.name, "Naziv tvrtke") : current.name,
    headquarters: hasOwn(patch, "headquarters") ? normalizeText(patch.headquarters) : current.headquarters,
    oib: hasOwn(patch, "oib") ? normalizeOib(patch.oib) : current.oib,
    contractType: hasOwn(patch, "contractType") ? normalizeText(patch.contractType) : current.contractType,
    contractNumber: hasOwn(patch, "contractNumber") ? normalizeText(patch.contractNumber) : current.contractNumber,
    period: hasOwn(patch, "period") ? normalizeText(patch.period) : current.period,
    isActive: hasOwn(patch, "isActive") ? normalizeBoolean(patch.isActive, current.isActive) : current.isActive,
    representative: hasOwn(patch, "representative") ? normalizeText(patch.representative) : current.representative,
    contactPhone: hasOwn(patch, "contactPhone") ? normalizeText(patch.contactPhone) : current.contactPhone,
    contactEmail: hasOwn(patch, "contactEmail") ? normalizeText(patch.contactEmail) : current.contactEmail,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    updatedAt: now(),
  };

  if (uniqueByCaseInsensitive(existingCompanies, next.oib, (item) => item.oib, current.id)) {
    throw new Error("Tvrtka s tim OIB-om vec postoji.");
  }

  return next;
}

export function createLocation(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const companyId = requireText(input.companyId, "Tvrtka");
  const company = state.companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const timestamp = now();
  const location = {
    id: createId(),
    companyId,
    name: requireText(input.name, "Naziv lokacije"),
    isActive: normalizeBoolean(input.isActive, true),
    period: normalizeText(input.period),
    representative: normalizeText(input.representative),
    coordinates: normalizeText(input.coordinates),
    region: normalizeText(input.region),
    note: normalizeText(input.note),
    ...mergeContactFields({
      contactName1: "",
      contactPhone1: "",
      contactEmail1: "",
      contactName2: "",
      contactPhone2: "",
      contactEmail2: "",
      contactName3: "",
      contactPhone3: "",
      contactEmail3: "",
    }, input),
    contacts: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  applyLocationContacts(
    location,
    hasOwn(input, "contacts") ? input.contacts : extractLegacyLocationContacts(input),
  );

  const duplicate = state.locations.some((item) => {
    if (item.companyId !== location.companyId) {
      return false;
    }

    return normalizeText(item.name).toLowerCase() === normalizeText(location.name).toLowerCase();
  });

  if (duplicate) {
    throw new Error("Ta lokacija za odabranu tvrtku vec postoji.");
  }

  return location;
}

export function updateLocation(current, patch, state, now = isoNow) {
  const companyId = hasOwn(patch, "companyId") ? requireText(patch.companyId, "Tvrtka") : current.companyId;
  const company = state.companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const next = {
    ...current,
    companyId,
    name: hasOwn(patch, "name") ? requireText(patch.name, "Naziv lokacije") : current.name,
    isActive: hasOwn(patch, "isActive") ? normalizeBoolean(patch.isActive, current.isActive) : current.isActive,
    period: hasOwn(patch, "period") ? normalizeText(patch.period) : current.period,
    representative: hasOwn(patch, "representative") ? normalizeText(patch.representative) : current.representative,
    coordinates: hasOwn(patch, "coordinates") ? normalizeText(patch.coordinates) : current.coordinates,
    region: hasOwn(patch, "region") ? normalizeText(patch.region) : current.region,
    note: hasOwn(patch, "note") ? normalizeText(patch.note) : current.note,
    updatedAt: now(),
  };

  applyLocationContacts(next, resolvePatchedLocationContacts(current, patch));

  const duplicate = state.locations.some((item) => {
    if (item.id === current.id || item.companyId !== next.companyId) {
      return false;
    }

    return normalizeText(item.name).toLowerCase() === normalizeText(next.name).toLowerCase();
  });

  if (duplicate) {
    throw new Error("Ta lokacija za odabranu tvrtku vec postoji.");
  }

  return next;
}

function resolveCompanySnapshot(company) {
  return company
    ? {
      companyId: company.id,
      companyName: company.name,
      companyOib: company.oib,
      headquarters: company.headquarters,
      contractType: company.contractType,
    }
    : {
      companyId: "",
      companyName: "",
      companyOib: "",
      headquarters: "",
      contractType: "",
    };
}

function resolveLocationSnapshot(location) {
  return location
    ? {
      locationId: location.id,
      locationName: location.name,
      coordinates: location.coordinates,
      region: location.region,
    }
    : {
      locationId: "",
      locationName: "",
      coordinates: "",
      region: "",
    };
}

function hydrateWorkOrderCore(base, company, location) {
  return {
    ...base,
    ...resolveCompanySnapshot(company),
    ...resolveLocationSnapshot(location),
  };
}

export function createWorkOrder(
  input,
  state,
  createId = () => crypto.randomUUID(),
  workOrderNumber = null,
  now = isoNow,
) {
  const companyId = requireText(input.companyId, "Tvrtka");
  const company = state.companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const requestedLocationId = normalizeId(input.locationId);
  const location = requestedLocationId
    ? state.locations.find((item) => item.id === requestedLocationId && item.companyId === companyId)
    : null;

  if (requestedLocationId && !location) {
    throw new Error("Lokacija ne pripada odabranoj tvrtki.");
  }

  const selectedContact = selectLocationContact(location, input.contactSlot);
  const timestamp = now();

  return hydrateWorkOrderCore({
    id: createId(),
    workOrderNumber,
    status: normalizeWorkOrderStatus(input.status),
    openedDate: normalizeOptionalDate(input.openedDate) ?? timestamp.slice(0, 10),
    dueDate: normalizeOptionalDate(input.dueDate),
    invoiceNote: normalizeText(input.invoiceNote),
    invoiceDate: normalizeOptionalDate(input.invoiceDate),
    weight: normalizeText(input.weight),
    completedBy: normalizeText(input.completedBy),
    description: requireText(input.description, "Opis radnog naloga"),
    linkReference: normalizeText(input.linkReference),
    executor1: normalizeText(input.executor1),
    executor2: normalizeText(input.executor2),
    priority: normalizePriority(input.priority),
    tagText: normalizeText(input.tagText),
    contactSlot: selectedContact.slot,
    contactName: normalizeText(input.contactName) || selectedContact.name,
    contactPhone: normalizeText(input.contactPhone) || selectedContact.phone,
    contactEmail: normalizeText(input.contactEmail) || selectedContact.email,
    serviceLine: normalizeText(input.serviceLine),
    department: normalizeText(input.department),
    createdAt: timestamp,
    updatedAt: timestamp,
  }, company, location);
}

export function updateWorkOrder(current, patch, state, now = isoNow) {
  const companyId = hasOwn(patch, "companyId") ? requireText(patch.companyId, "Tvrtka") : current.companyId;
  const company = state.companies.find((item) => item.id === companyId);

  if (!company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  const locationWasExplicitlyChanged = hasOwn(patch, "locationId");
  let locationId = locationWasExplicitlyChanged ? normalizeId(patch.locationId) : current.locationId;

  if (locationId) {
    const belongsToCompany = state.locations.some((item) => item.id === locationId && item.companyId === companyId);

    if (!belongsToCompany) {
      if (locationWasExplicitlyChanged) {
        throw new Error("Lokacija ne pripada odabranoj tvrtki.");
      }

      locationId = "";
    }
  }

  const location = locationId
    ? state.locations.find((item) => item.id === locationId && item.companyId === companyId)
    : null;

  const companyChanged = companyId !== current.companyId;
  const locationChanged = locationId !== current.locationId || companyChanged;
  const selectedContact = (locationChanged || hasOwn(patch, "contactSlot"))
    ? selectLocationContact(location, hasOwn(patch, "contactSlot") ? patch.contactSlot : current.contactSlot)
    : null;

  const next = hydrateWorkOrderCore({
    ...current,
    status: hasOwn(patch, "status") ? normalizeWorkOrderStatus(patch.status) : current.status,
    openedDate: hasOwn(patch, "openedDate") ? (normalizeOptionalDate(patch.openedDate) ?? current.openedDate) : current.openedDate,
    dueDate: hasOwn(patch, "dueDate") ? normalizeOptionalDate(patch.dueDate) : current.dueDate,
    invoiceNote: hasOwn(patch, "invoiceNote") ? normalizeText(patch.invoiceNote) : current.invoiceNote,
    invoiceDate: hasOwn(patch, "invoiceDate") ? normalizeOptionalDate(patch.invoiceDate) : current.invoiceDate,
    weight: hasOwn(patch, "weight") ? normalizeText(patch.weight) : current.weight,
    completedBy: hasOwn(patch, "completedBy") ? normalizeText(patch.completedBy) : current.completedBy,
    description: hasOwn(patch, "description") ? requireText(patch.description, "Opis radnog naloga") : current.description,
    linkReference: hasOwn(patch, "linkReference") ? normalizeText(patch.linkReference) : current.linkReference,
    executor1: hasOwn(patch, "executor1") ? normalizeText(patch.executor1) : current.executor1,
    executor2: hasOwn(patch, "executor2") ? normalizeText(patch.executor2) : current.executor2,
    priority: hasOwn(patch, "priority") ? normalizePriority(patch.priority) : current.priority,
    tagText: hasOwn(patch, "tagText") ? normalizeText(patch.tagText) : current.tagText,
    coordinates: hasOwn(patch, "coordinates")
      ? normalizeText(patch.coordinates)
      : locationChanged
        ? (location?.coordinates ?? "")
        : current.coordinates,
    region: hasOwn(patch, "region")
      ? normalizeText(patch.region)
      : locationChanged
        ? (location?.region ?? "")
        : current.region,
    contactSlot: selectedContact ? selectedContact.slot : current.contactSlot,
    contactName: hasOwn(patch, "contactName")
      ? normalizeText(patch.contactName)
      : selectedContact
        ? selectedContact.name
        : current.contactName,
    contactPhone: hasOwn(patch, "contactPhone")
      ? normalizeText(patch.contactPhone)
      : selectedContact
        ? selectedContact.phone
        : current.contactPhone,
    contactEmail: hasOwn(patch, "contactEmail")
      ? normalizeText(patch.contactEmail)
      : selectedContact
        ? selectedContact.email
        : current.contactEmail,
    serviceLine: hasOwn(patch, "serviceLine") ? normalizeText(patch.serviceLine) : current.serviceLine,
    department: hasOwn(patch, "department") ? normalizeText(patch.department) : current.department,
    updatedAt: now(),
  }, company, location);

  return next;
}

export function nextWorkOrderNumber(workOrders) {
  const maxNumber = workOrders.reduce((maxValue, workOrder) => {
    const match = String(workOrder.workOrderNumber ?? "").match(/(\d+)$/);
    const numericPart = match ? Number(match[1]) : 0;
    return Math.max(maxValue, numericPart);
  }, 0);

  return `RN-${String(maxNumber + 1).padStart(5, "0")}`;
}

export function filterWorkOrders(
  workOrders,
  { query = "", status = "all", companyId = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return workOrders.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (companyId !== "all" && item.companyId !== companyId) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.workOrderNumber,
      item.companyName,
      item.locationName,
      item.companyOib,
      item.region,
      item.status,
      item.department,
      item.description,
      item.executor1,
      item.executor2,
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortWorkOrders(workOrders) {
  return [...workOrders].sort((left, right) => {
    if (left.openedDate && right.openedDate && left.openedDate !== right.openedDate) {
      return right.openedDate.localeCompare(left.openedDate);
    }

    const leftRank = PRIORITY_RANK[left.priority] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = PRIORITY_RANK[right.priority] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return String(right.workOrderNumber).localeCompare(String(left.workOrderNumber), "hr");
  });
}

export function getDashboardStats(snapshot, today = todayString()) {
  const companies = snapshot.companies ?? [];
  const locations = snapshot.locations ?? [];
  const workOrders = snapshot.workOrders ?? [];

  const overdueWorkOrders = workOrders.filter((item) => item.dueDate && item.dueDate < today && item.status !== "Fakturiran RN").length;
  const activeWorkOrders = workOrders.filter((item) => !["Gotov RN", "Ovjeren RN", "Fakturiran RN", "Storno RN"].includes(item.status)).length;
  const completedWorkOrders = workOrders.filter((item) => ["Gotov RN", "Ovjeren RN", "Fakturiran RN", "Storno RN"].includes(item.status)).length;

  return {
    companies: companies.length,
    locations: locations.length,
    activeWorkOrders,
    completedWorkOrders,
    overdueWorkOrders,
  };
}

export function syncLocationFieldsFromWorkOrder(location, workOrder, now = isoNow) {
  if (!location || !workOrder || location.id !== workOrder.locationId) {
    return location;
  }

  return {
    ...location,
    coordinates: normalizeText(workOrder.coordinates),
    region: normalizeText(workOrder.region),
    updatedAt: now(),
  };
}
