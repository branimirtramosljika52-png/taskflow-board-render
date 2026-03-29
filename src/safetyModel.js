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

export const REMINDER_STATUS_OPTIONS = [
  { value: "active", label: "Aktivan" },
  { value: "snoozed", label: "Odgoden" },
  { value: "done", label: "Gotov" },
];

export const TODO_TASK_STATUS_OPTIONS = [
  { value: "open", label: "Novo" },
  { value: "in_progress", label: "U radu" },
  { value: "waiting", label: "Ceka odgovor" },
  { value: "done", label: "Zavrseno" },
];

export const DASHBOARD_WIDGET_SOURCE_OPTIONS = [
  { value: "work_orders", label: "Radni nalozi" },
  { value: "reminders", label: "Reminders" },
  { value: "todo_tasks", label: "ToDo" },
  { value: "locations", label: "Lokacije" },
];

export const DASHBOARD_WIDGET_VISUALIZATION_OPTIONS = [
  { value: "metric", label: "KPI kartica" },
  { value: "donut", label: "Donut graf" },
  { value: "bar", label: "Bar chart" },
  { value: "list", label: "Lista" },
];

export const DASHBOARD_WIDGET_SIZE_OPTIONS = [
  { value: "small", label: "Mala" },
  { value: "medium", label: "Srednja" },
  { value: "large", label: "Velika" },
  { value: "full", label: "Puna sirina" },
];

export const DASHBOARD_GRID_COLUMN_COUNT = 12;

export const DASHBOARD_WIDGET_HEIGHT_OPTIONS = [
  { value: "2", label: "Niska" },
  { value: "3", label: "Standard" },
  { value: "4", label: "Visa" },
  { value: "5", label: "Velika" },
  { value: "6", label: "XL" },
];

export const DASHBOARD_WIDGET_DATE_WINDOW_OPTIONS = [
  { value: "all", label: "Bez ogranicenja" },
  { value: "overdue", label: "Kasni" },
  { value: "7d", label: "Sljedecih 7 dana" },
  { value: "14d", label: "Sljedecih 14 dana" },
  { value: "30d", label: "Sljedecih 30 dana" },
];

export const DASHBOARD_WIDGET_DEFINITIONS = {
  work_orders: {
    label: "Radni nalozi",
    metrics: [
      { value: "total", label: "Svi radni nalozi" },
      { value: "active", label: "Otvoreni RN" },
      { value: "urgent", label: "Urgent RN" },
      { value: "due_7d", label: "Rok 7 dana" },
      { value: "overdue", label: "Istek / kasnjenje" },
      { value: "completed", label: "Zatvoreni RN" },
      { value: "factured", label: "Fakturirani RN" },
    ],
    groupings: [
      { value: "status", label: "Status RN" },
      { value: "priority", label: "Prioritet" },
      { value: "region", label: "Regija" },
      { value: "company", label: "Tvrtka" },
      { value: "executor", label: "Izvrsitelj" },
      { value: "tag", label: "Tag" },
    ],
    lists: [
      { value: "upcoming_due", label: "Sljedeci rokovi" },
      { value: "overdue", label: "RN kojima je istekao rok" },
      { value: "urgent_open", label: "Urgent otvoreni RN" },
      { value: "recent", label: "Nedavno azurirani RN" },
    ],
  },
  reminders: {
    label: "Reminders",
    metrics: [
      { value: "total", label: "Svi reminders" },
      { value: "active", label: "Aktivni reminders" },
      { value: "today", label: "Danasnji reminders" },
      { value: "overdue", label: "Kasneci reminders" },
      { value: "done", label: "Gotovi reminders" },
    ],
    groupings: [
      { value: "status", label: "Status remindera" },
      { value: "company", label: "Tvrtka" },
      { value: "creator", label: "Kreirao" },
    ],
    lists: [
      { value: "due_soon", label: "Reminderi s rokom" },
      { value: "overdue", label: "Reminderi koji kasne" },
      { value: "latest", label: "Zadnje promjene" },
    ],
  },
  todo_tasks: {
    label: "ToDo",
    metrics: [
      { value: "total", label: "Svi zadaci" },
      { value: "assigned_to_me", label: "Dodijeljeno meni" },
      { value: "created_by_me", label: "Ja sam poslao" },
      { value: "overdue", label: "Kasneci zadaci" },
      { value: "done", label: "Zavrseni zadaci" },
    ],
    groupings: [
      { value: "status", label: "Status zadatka" },
      { value: "priority", label: "Prioritet" },
      { value: "assignee", label: "Izvrsitelj" },
      { value: "creator", label: "Posiljatelj" },
    ],
    lists: [
      { value: "assigned_to_me", label: "Moj inbox" },
      { value: "overdue", label: "Kasneci zadaci" },
      { value: "open_items", label: "Otvoreni zadaci" },
      { value: "latest", label: "Nove aktivnosti" },
    ],
  },
  locations: {
    label: "Lokacije",
    metrics: [
      { value: "total", label: "Sve lokacije" },
      { value: "missing_coordinates", label: "Bez koordinata" },
    ],
    groupings: [
      { value: "region", label: "Regija" },
      { value: "company", label: "Tvrtka" },
      { value: "coordinate_state", label: "Stanje koordinata" },
    ],
    lists: [
      { value: "missing_coordinates", label: "Lokacije bez koordinata" },
      { value: "recent", label: "Nedavno azurirane lokacije" },
    ],
  },
};

const WORK_ORDER_STATUS_SET = new Set(WORK_ORDER_STATUS_OPTIONS.map((option) => option.value));
const PRIORITY_SET = new Set(PRIORITY_OPTIONS.map((option) => option.value));
const REMINDER_STATUS_SET = new Set(REMINDER_STATUS_OPTIONS.map((option) => option.value));
const TODO_TASK_STATUS_SET = new Set(TODO_TASK_STATUS_OPTIONS.map((option) => option.value));
const DASHBOARD_WIDGET_SOURCE_SET = new Set(DASHBOARD_WIDGET_SOURCE_OPTIONS.map((option) => option.value));
const DASHBOARD_WIDGET_VISUALIZATION_SET = new Set(DASHBOARD_WIDGET_VISUALIZATION_OPTIONS.map((option) => option.value));
const DASHBOARD_WIDGET_SIZE_SET = new Set(DASHBOARD_WIDGET_SIZE_OPTIONS.map((option) => option.value));
const DASHBOARD_WIDGET_DATE_WINDOW_SET = new Set(DASHBOARD_WIDGET_DATE_WINDOW_OPTIONS.map((option) => option.value));
const DASHBOARD_WIDGET_LAYOUT_PRESETS = {
  small: { width: 3, height: 2 },
  medium: { width: 4, height: 3 },
  large: { width: 6, height: 4 },
  full: { width: DASHBOARD_GRID_COLUMN_COUNT, height: 4 },
};
const DASHBOARD_WIDGET_MIN_WIDTH = 3;
const DASHBOARD_WIDGET_MIN_HEIGHT = 2;
const DASHBOARD_WIDGET_MAX_HEIGHT = 6;
const PRIORITY_RANK = {
  Urgent: 0,
  High: 1,
  Normal: 2,
  "Niski prioritet": 3,
  "Bez prioriteta": 4,
};
const CLOSED_WORK_ORDER_STATUSES = new Set(["Gotov RN", "Ovjeren RN", "Fakturiran RN", "Storno RN"]);
const REMINDER_STATUS_RANK = {
  active: 0,
  snoozed: 1,
  done: 2,
};
const TODO_TASK_STATUS_RANK = {
  open: 0,
  in_progress: 1,
  waiting: 2,
  done: 3,
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

function normalizeReminderStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return REMINDER_STATUS_SET.has(status) ? status : "active";
}

function normalizeTodoTaskStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return TODO_TASK_STATUS_SET.has(status) ? status : "open";
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

function findReminderCompany(state, companyId = "") {
  if (!companyId) {
    return null;
  }

  return (state.companies ?? []).find((item) => item.id === companyId) ?? null;
}

function findReminderLocation(state, locationId = "", companyId = "") {
  if (!locationId) {
    return null;
  }

  return (state.locations ?? []).find((item) => (
    item.id === locationId
    && (!companyId || item.companyId === companyId)
  )) ?? null;
}

function findReminderWorkOrder(state, workOrderId = "") {
  if (!workOrderId) {
    return null;
  }

  return (state.workOrders ?? []).find((item) => item.id === workOrderId) ?? null;
}

function findTodoCompany(state, companyId = "") {
  if (!companyId) {
    return null;
  }

  return (state.companies ?? []).find((item) => item.id === companyId) ?? null;
}

function findTodoLocation(state, locationId = "", companyId = "") {
  if (!locationId) {
    return null;
  }

  return (state.locations ?? []).find((item) => (
    item.id === locationId
    && (!companyId || item.companyId === companyId)
  )) ?? null;
}

function findTodoWorkOrder(state, workOrderId = "") {
  if (!workOrderId) {
    return null;
  }

  return (state.workOrders ?? []).find((item) => item.id === workOrderId) ?? null;
}

function hydrateReminderCore({
  current = null,
  state,
  input,
  timestamp,
}) {
  const requestedWorkOrderId = hasOwn(input, "workOrderId")
    ? normalizeId(input.workOrderId)
    : normalizeId(current?.workOrderId);
  const linkedWorkOrder = findReminderWorkOrder(state, requestedWorkOrderId);

  if (requestedWorkOrderId && !linkedWorkOrder) {
    throw new Error("Povezani radni nalog ne postoji.");
  }

  let companyId = linkedWorkOrder?.companyId ?? (
    hasOwn(input, "companyId") ? normalizeId(input.companyId) : normalizeId(current?.companyId)
  );
  let locationId = linkedWorkOrder?.locationId ?? (
    hasOwn(input, "locationId") ? normalizeId(input.locationId) : normalizeId(current?.locationId)
  );
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");

  const company = findReminderCompany(state, companyId);

  if (companyId && !company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  let location = findReminderLocation(state, locationId, companyId);

  if (locationId && !location) {
    throw new Error("Odabrana lokacija ne pripada tvrtki.");
  }

  if (linkedWorkOrder) {
    companyId = linkedWorkOrder.companyId;
    locationId = linkedWorkOrder.locationId;
    location = findReminderLocation(state, linkedWorkOrder.locationId, linkedWorkOrder.companyId);
  }

  const normalizedStatus = hasOwn(input, "status")
    ? normalizeReminderStatus(input.status)
    : normalizeReminderStatus(current?.status);
  const completedAt = normalizedStatus === "done"
    ? (current?.completedAt ?? timestamp)
    : null;

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: linkedWorkOrder?.companyName ?? company?.name ?? "",
    locationId,
    locationName: linkedWorkOrder?.locationName ?? location?.name ?? "",
    workOrderId: linkedWorkOrder?.id ?? requestedWorkOrderId,
    workOrderNumber: linkedWorkOrder?.workOrderNumber ?? current?.workOrderNumber ?? "",
    title: hasOwn(input, "title") ? requireText(input.title, "Naslov remindera") : current?.title ?? "",
    note: hasOwn(input, "note") ? normalizeText(input.note) : current?.note ?? "",
    dueDate: hasOwn(input, "dueDate")
      ? normalizeOptionalDate(input.dueDate)
      : normalizeOptionalDate(current?.dueDate),
    status: normalizedStatus,
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    completedAt,
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function hydrateTodoTaskCore({
  current = null,
  state,
  input,
  timestamp,
}) {
  const requestedWorkOrderId = hasOwn(input, "workOrderId")
    ? normalizeId(input.workOrderId)
    : normalizeId(current?.workOrderId);
  const linkedWorkOrder = findTodoWorkOrder(state, requestedWorkOrderId);

  if (requestedWorkOrderId && !linkedWorkOrder) {
    throw new Error("Povezani radni nalog ne postoji.");
  }

  let companyId = linkedWorkOrder?.companyId ?? (
    hasOwn(input, "companyId") ? normalizeId(input.companyId) : normalizeId(current?.companyId)
  );
  let locationId = linkedWorkOrder?.locationId ?? (
    hasOwn(input, "locationId") ? normalizeId(input.locationId) : normalizeId(current?.locationId)
  );
  const organizationId = hasOwn(input, "organizationId")
    ? requireText(input.organizationId, "Organizacija")
    : requireText(current?.organizationId, "Organizacija");
  const company = findTodoCompany(state, companyId);

  if (companyId && !company) {
    throw new Error("Odabrana tvrtka ne postoji.");
  }

  let location = findTodoLocation(state, locationId, companyId);

  if (locationId && !location) {
    throw new Error("Odabrana lokacija ne pripada tvrtki.");
  }

  if (linkedWorkOrder) {
    companyId = linkedWorkOrder.companyId;
    locationId = linkedWorkOrder.locationId;
    location = findTodoLocation(state, linkedWorkOrder.locationId, linkedWorkOrder.companyId);
  }

  const normalizedStatus = hasOwn(input, "status")
    ? normalizeTodoTaskStatus(input.status)
    : normalizeTodoTaskStatus(current?.status);
  const dueDate = hasOwn(input, "dueDate")
    ? normalizeOptionalDate(input.dueDate)
    : normalizeOptionalDate(current?.dueDate);

  return {
    id: current?.id ?? "",
    organizationId,
    companyId,
    companyName: linkedWorkOrder?.companyName ?? company?.name ?? "",
    locationId,
    locationName: linkedWorkOrder?.locationName ?? location?.name ?? "",
    workOrderId: linkedWorkOrder?.id ?? requestedWorkOrderId,
    workOrderNumber: linkedWorkOrder?.workOrderNumber ?? current?.workOrderNumber ?? "",
    title: hasOwn(input, "title") ? requireText(input.title, "Naslov zadatka") : current?.title ?? "",
    message: hasOwn(input, "message") ? normalizeText(input.message) : current?.message ?? "",
    status: normalizedStatus,
    priority: hasOwn(input, "priority") ? normalizePriority(input.priority) : normalizePriority(current?.priority),
    dueDate,
    createdByUserId: hasOwn(input, "createdByUserId")
      ? normalizeText(input.createdByUserId)
      : (current?.createdByUserId ?? ""),
    createdByLabel: hasOwn(input, "createdByLabel")
      ? normalizeText(input.createdByLabel)
      : (current?.createdByLabel ?? ""),
    assignedToUserId: hasOwn(input, "assignedToUserId")
      ? normalizeText(input.assignedToUserId)
      : (current?.assignedToUserId ?? ""),
    assignedToLabel: hasOwn(input, "assignedToLabel")
      ? normalizeText(input.assignedToLabel)
      : (current?.assignedToLabel ?? ""),
    completedAt: normalizedStatus === "done"
      ? (current?.completedAt ?? timestamp)
      : null,
    commentCount: current?.commentCount ?? 0,
    comments: Array.isArray(current?.comments) ? current.comments.map((comment) => ({ ...comment })) : [],
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function createTodoTaskCommentCore(input, createId = () => crypto.randomUUID(), now = isoNow) {
  return {
    id: createId(),
    taskId: requireText(input.taskId, "Zadatak"),
    organizationId: requireText(input.organizationId, "Organizacija"),
    userId: normalizeText(input.userId),
    authorLabel: normalizeText(input.authorLabel) || "Safety360",
    message: requireText(input.message, "Poruka"),
    createdAt: now(),
  };
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
    teamLabel: normalizeText(input.teamLabel),
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
    teamLabel: hasOwn(patch, "teamLabel") ? normalizeText(patch.teamLabel) : current.teamLabel,
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

export function createReminder(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const reminder = hydrateReminderCore({
    state,
    input,
    timestamp,
  });

  return {
    ...reminder,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateReminder(current, patch, state, now = isoNow) {
  return hydrateReminderCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function filterReminders(
  reminders,
  { query = "", status = "all" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  return reminders.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.note,
      item.companyName,
      item.locationName,
      item.workOrderNumber,
      item.createdByLabel,
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortReminders(reminders) {
  return [...reminders].sort((left, right) => {
    const leftRank = REMINDER_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = REMINDER_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }

    if (left.dueDate && !right.dueDate) {
      return -1;
    }

    if (!left.dueDate && right.dueDate) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

export function createTodoTask(
  input,
  state,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const timestamp = now();
  const task = hydrateTodoTaskCore({
    state,
    input,
    timestamp,
  });

  return {
    ...task,
    id: createId(),
    comments: [],
    commentCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateTodoTask(current, patch, state, now = isoNow) {
  return hydrateTodoTaskCore({
    current,
    state,
    input: patch,
    timestamp: now(),
  });
}

export function createTodoTaskComment(
  currentTask,
  input,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const comment = createTodoTaskCommentCore({
    ...input,
    taskId: currentTask.id,
    organizationId: currentTask.organizationId,
  }, createId, now);
  const nextComments = [...(currentTask.comments ?? []), comment];

  return {
    ...currentTask,
    comments: nextComments,
    commentCount: nextComments.length,
    updatedAt: comment.createdAt,
  };
}

export function filterTodoTasks(
  tasks,
  { query = "", status = "all", scope = "all", userId = "" } = {},
) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  const normalizedUserId = normalizeText(userId);

  return tasks.filter((item) => {
    if (status !== "all" && item.status !== status) {
      return false;
    }

    if (scope === "assigned" && normalizedUserId && normalizeText(item.assignedToUserId) !== normalizedUserId) {
      return false;
    }

    if (scope === "created" && normalizedUserId && normalizeText(item.createdByUserId) !== normalizedUserId) {
      return false;
    }

    if (scope === "unassigned" && normalizeText(item.assignedToUserId)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.message,
      item.companyName,
      item.locationName,
      item.workOrderNumber,
      item.createdByLabel,
      item.assignedToLabel,
      ...(item.comments ?? []).map((comment) => comment.message),
    ].join(" ").toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortTodoTasks(tasks) {
  return [...tasks].sort((left, right) => {
    const leftDone = left.status === "done";
    const rightDone = right.status === "done";

    if (leftDone !== rightDone) {
      return leftDone ? 1 : -1;
    }

    const leftRank = TODO_TASK_STATUS_RANK[left.status] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = TODO_TASK_STATUS_RANK[right.status] ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftPriorityRank = PRIORITY_RANK[left.priority] ?? Number.MAX_SAFE_INTEGER;
    const rightPriorityRank = PRIORITY_RANK[right.priority] ?? Number.MAX_SAFE_INTEGER;

    if (leftPriorityRank !== rightPriorityRank) {
      return leftPriorityRank - rightPriorityRank;
    }

    if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }

    if (left.dueDate && !right.dueDate) {
      return -1;
    }

    if (!left.dueDate && right.dueDate) {
      return 1;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
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

function formatLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeekDate(value) {
  const normalized = normalizeOptionalDate(value) ?? todayString();
  const date = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return startOfWeekDate(todayString());
  }

  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}

function addDaysToDateKey(value, days) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setDate(date.getDate() + days);
  return formatLocalDateKey(date);
}

export function parseCoordinates(value) {
  const rawValue = normalizeText(value)
    .replace(/[;]/g, ",")
    .replace(/\s+/g, " ");

  if (!rawValue) {
    return null;
  }

  const parts = rawValue.match(/-?\d+(?:[.,]\d+)?/g);

  if (!parts || parts.length < 2) {
    return null;
  }

  const latitude = Number(parts[0].replace(",", "."));
  const longitude = Number(parts[1].replace(",", "."));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

export function getWorkOrderExecutorGroup(workOrder) {
  const executors = [workOrder?.executor1, workOrder?.executor2]
    .map((value) => normalizeText(value))
    .filter(Boolean);

  return {
    key: executors.length ? executors.map((value) => value.toLowerCase()).join("||") : "unassigned",
    label: executors.length ? executors.join(" + ") : "Bez izvrsitelja",
    executors,
  };
}

export function getWorkOrderTeamGroup(workOrder) {
  const label = normalizeText(workOrder?.teamLabel);

  return {
    key: label ? `team:${label.toLowerCase()}` : "team:unassigned",
    label: label || "Bez tima",
    isUnassigned: !label,
  };
}

function sortWorkOrderCalendarGroupEntries(left, right) {
  if (left.isUnassigned && !right.isUnassigned) {
    return 1;
  }

  if (!left.isUnassigned && right.isUnassigned) {
    return -1;
  }

  return left.label.localeCompare(right.label, "hr");
}

function sortWorkOrdersByCalendarKey(items = []) {
  return items
    .slice()
    .sort((left, right) => String(left.workOrderNumber ?? "").localeCompare(String(right.workOrderNumber ?? ""), "hr"));
}

export function buildWorkOrderCalendarTeamWeeks(workOrders = [], anchorDateValue = todayString()) {
  const normalizedAnchor = normalizeOptionalDate(anchorDateValue) ?? todayString();
  const monthStart = `${normalizedAnchor.slice(0, 7)}-01`;
  const monthStartDate = new Date(`${monthStart}T00:00:00`);
  const monthEndDate = new Date(monthStartDate);
  monthEndDate.setMonth(monthEndDate.getMonth() + 1, 0);
  const monthEnd = formatLocalDateKey(monthEndDate);
  const displayStart = formatLocalDateKey(startOfWeekDate(monthStart));
  const displayEnd = addDaysToDateKey(formatLocalDateKey(startOfWeekDate(monthEnd)), 6);
  const displayDaySet = new Set();
  const weeks = [];
  const weekMap = new Map();
  const unscheduledGroupMap = new Map();

  for (let cursor = displayStart; cursor <= displayEnd; cursor = addDaysToDateKey(cursor, 7)) {
    const days = Array.from({ length: 7 }, (_, index) => {
      const key = addDaysToDateKey(cursor, index);
      displayDaySet.add(key);
      return {
        key,
        inMonth: key >= monthStart && key <= monthEnd,
        isToday: key === todayString(),
      };
    });

    const week = {
      key: cursor,
      weekStart: cursor,
      days,
      groups: [],
      totalCount: 0,
    };

    weeks.push(week);
    weekMap.set(cursor, week);
  }

  const ensureWeekGroup = (week, group) => {
    const current = week.groups.find((entry) => entry.key === group.key);

    if (current) {
      return current;
    }

    const created = {
      ...group,
      executors: [],
      regions: [],
      itemsByDate: Object.fromEntries(week.days.map((day) => [day.key, []])),
      totalCount: 0,
    };
    week.groups.push(created);
    return created;
  };

  const ensureUnscheduledGroup = (group) => {
    if (unscheduledGroupMap.has(group.key)) {
      return unscheduledGroupMap.get(group.key);
    }

    const created = {
      ...group,
      executors: [],
      regions: [],
      items: [],
    };
    unscheduledGroupMap.set(group.key, created);
    return created;
  };

  workOrders.forEach((workOrder) => {
    const group = getWorkOrderTeamGroup(workOrder);
    const dueDate = normalizeOptionalDate(workOrder?.dueDate);

    if (!dueDate) {
      const targetGroup = ensureUnscheduledGroup(group);
      targetGroup.items.push(workOrder);

      [workOrder?.executor1, workOrder?.executor2]
        .map((value) => normalizeText(value))
        .filter(Boolean)
        .forEach((executor) => {
          if (!targetGroup.executors.includes(executor)) {
            targetGroup.executors.push(executor);
          }
        });

      if (normalizeText(workOrder?.region) && !targetGroup.regions.includes(normalizeText(workOrder.region))) {
        targetGroup.regions.push(normalizeText(workOrder.region));
      }

      return;
    }

    if (!displayDaySet.has(dueDate)) {
      return;
    }

    const weekKey = formatLocalDateKey(startOfWeekDate(dueDate));
    const week = weekMap.get(weekKey);

    if (!week) {
      return;
    }

    const targetGroup = ensureWeekGroup(week, group);
    targetGroup.itemsByDate[dueDate].push(workOrder);
    targetGroup.totalCount += 1;
    week.totalCount += 1;

    [workOrder?.executor1, workOrder?.executor2]
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .forEach((executor) => {
        if (!targetGroup.executors.includes(executor)) {
          targetGroup.executors.push(executor);
        }
      });

    if (normalizeText(workOrder?.region) && !targetGroup.regions.includes(normalizeText(workOrder.region))) {
      targetGroup.regions.push(normalizeText(workOrder.region));
    }
  });

  const normalizedWeeks = weeks.map((week) => ({
    ...week,
    groups: week.groups
      .sort(sortWorkOrderCalendarGroupEntries)
      .map((group) => ({
        ...group,
        itemsByDate: Object.fromEntries(
          week.days.map((day) => [day.key, sortWorkOrdersByCalendarKey(group.itemsByDate[day.key] ?? [])]),
        ),
      })),
  }));

  const unscheduledGroups = Array.from(unscheduledGroupMap.values())
    .sort(sortWorkOrderCalendarGroupEntries)
    .map((group) => ({
      ...group,
      items: sortWorkOrdersByCalendarKey(group.items),
    }));

  return {
    anchorDate: normalizedAnchor,
    monthStart,
    monthEnd,
    displayStart,
    displayEnd,
    weeks: normalizedWeeks,
    unscheduledGroups,
  };
}

export function buildWorkOrderCalendarLanes(workOrders = [], weekStartValue = todayString(), dayCount = 7) {
  const weekStartDate = startOfWeekDate(weekStartValue);
  const weekStart = formatLocalDateKey(weekStartDate);
  const days = Array.from({ length: dayCount }, (_, index) => addDaysToDateKey(weekStart, index));
  const daySet = new Set(days);
  const laneMap = new Map();
  const unscheduled = [];

  workOrders.forEach((workOrder) => {
    const lane = getWorkOrderExecutorGroup(workOrder);
    const dueDate = normalizeOptionalDate(workOrder?.dueDate);

    if (!dueDate || !daySet.has(dueDate)) {
      if (!dueDate) {
        unscheduled.push(workOrder);
      }
      return;
    }

    if (!laneMap.has(lane.key)) {
      laneMap.set(lane.key, {
        ...lane,
        itemsByDate: Object.fromEntries(days.map((day) => [day, []])),
      });
    }

    laneMap.get(lane.key).itemsByDate[dueDate].push(workOrder);
  });

  const lanes = Array.from(laneMap.values())
    .sort((left, right) => {
      if (left.key === "unassigned" && right.key !== "unassigned") {
        return 1;
      }

      if (right.key === "unassigned" && left.key !== "unassigned") {
        return -1;
      }

      return left.label.localeCompare(right.label, "hr");
    })
    .map((lane) => ({
      ...lane,
      itemsByDate: Object.fromEntries(days.map((day) => [
        day,
        lane.itemsByDate[day].slice().sort((left, right) => String(left.workOrderNumber ?? "").localeCompare(String(right.workOrderNumber ?? ""), "hr")),
      ])),
    }));

  return {
    weekStart,
    days,
    lanes,
    unscheduled: unscheduled
      .slice()
      .sort((left, right) => String(left.workOrderNumber ?? "").localeCompare(String(right.workOrderNumber ?? ""), "hr")),
  };
}

export function buildWorkOrderMapMarkers(workOrders = [], bounds = null) {
  const rawMarkers = workOrders
    .map((workOrder) => {
      const point = parseCoordinates(workOrder?.coordinates);

      if (!point) {
        return null;
      }

      return {
        id: workOrder.id,
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
        companyName: workOrder.companyName,
        locationName: workOrder.locationName,
        region: workOrder.region,
        status: workOrder.status,
        priority: workOrder.priority,
        dueDate: workOrder.dueDate,
        coordinates: workOrder.coordinates,
        latitude: point.latitude,
        longitude: point.longitude,
      };
    })
    .filter(Boolean);

  const fallbackBounds = {
    minLat: 42.0,
    maxLat: 47.2,
    minLon: 13.0,
    maxLon: 19.8,
  };

  const computedBounds = bounds || (() => {
    if (rawMarkers.length === 0) {
      return fallbackBounds;
    }

    const latitudes = rawMarkers.map((item) => item.latitude);
    const longitudes = rawMarkers.map((item) => item.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);
    const latSpan = Math.max(1.2, maxLat - minLat);
    const lonSpan = Math.max(1.6, maxLon - minLon);
    const latPadding = latSpan * 0.18;
    const lonPadding = lonSpan * 0.18;

    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLon: minLon - lonPadding,
      maxLon: maxLon + lonPadding,
    };
  })();

  const latSpan = Math.max(0.0001, computedBounds.maxLat - computedBounds.minLat);
  const lonSpan = Math.max(0.0001, computedBounds.maxLon - computedBounds.minLon);

  return {
    bounds: computedBounds,
    markers: rawMarkers.map((marker) => ({
      ...marker,
      x: ((marker.longitude - computedBounds.minLon) / lonSpan) * 100,
      y: (1 - ((marker.latitude - computedBounds.minLat) / latSpan)) * 100,
    })),
  };
}

export function getDashboardStats(snapshot, today = todayString()) {
  const companies = snapshot.companies ?? [];
  const locations = snapshot.locations ?? [];
  const workOrders = snapshot.workOrders ?? [];

  const overdueWorkOrders = workOrders.filter((item) => item.dueDate && item.dueDate < today && item.status !== "Fakturiran RN").length;
  const activeWorkOrders = workOrders.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status)).length;
  const completedWorkOrders = workOrders.filter((item) => CLOSED_WORK_ORDER_STATUSES.has(item.status)).length;

  return {
    companies: companies.length,
    locations: locations.length,
    activeWorkOrders,
    completedWorkOrders,
    overdueWorkOrders,
  };
}

function dateValueToKey(value) {
  const normalized = normalizeOptionalDate(value);

  if (!normalized) {
    return null;
  }

  const timestamp = Date.parse(`${normalized}T12:00:00Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function countGroupedValues(items, getValue, { fallback = "Bez podatka", limit = Infinity } = {}) {
  const grouped = new Map();

  items.forEach((item) => {
    const rawLabel = getValue(item);
    const label = normalizeText(rawLabel) || fallback;
    grouped.set(label, (grouped.get(label) ?? 0) + 1);
  });

  return [...grouped.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label, "hr");
    })
    .slice(0, limit);
}

function normalizeDashboardWidgetSource(value) {
  const normalized = normalizeText(value).toLowerCase();
  return DASHBOARD_WIDGET_SOURCE_SET.has(normalized) ? normalized : "work_orders";
}

function normalizeDashboardWidgetVisualization(value) {
  const normalized = normalizeText(value).toLowerCase();
  return DASHBOARD_WIDGET_VISUALIZATION_SET.has(normalized) ? normalized : "metric";
}

function normalizeDashboardWidgetSize(value) {
  const normalized = normalizeText(value).toLowerCase();
  return DASHBOARD_WIDGET_SIZE_SET.has(normalized) ? normalized : "medium";
}

function normalizeDashboardWidgetDateWindow(value) {
  const normalized = normalizeText(value).toLowerCase();
  return DASHBOARD_WIDGET_DATE_WINDOW_SET.has(normalized) ? normalized : "all";
}

function getDashboardWidgetLayoutPreset(size) {
  return DASHBOARD_WIDGET_LAYOUT_PRESETS[normalizeDashboardWidgetSize(size)] ?? DASHBOARD_WIDGET_LAYOUT_PRESETS.medium;
}

function normalizeDashboardWidgetGridWidth(value, size = "medium") {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return getDashboardWidgetLayoutPreset(size).width;
  }

  return Math.min(DASHBOARD_GRID_COLUMN_COUNT, Math.max(DASHBOARD_WIDGET_MIN_WIDTH, parsed));
}

function normalizeDashboardWidgetGridHeight(value, size = "medium") {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return getDashboardWidgetLayoutPreset(size).height;
  }

  return Math.min(DASHBOARD_WIDGET_MAX_HEIGHT, Math.max(DASHBOARD_WIDGET_MIN_HEIGHT, parsed));
}

function normalizeDashboardWidgetGridColumn(value, width = DASHBOARD_WIDGET_LAYOUT_PRESETS.medium.width) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(DASHBOARD_GRID_COLUMN_COUNT - width + 1, Math.max(1, parsed));
}

function normalizeDashboardWidgetGridRow(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function getDashboardWidgetSizeFromWidth(width) {
  if (width >= DASHBOARD_GRID_COLUMN_COUNT) {
    return "full";
  }

  if (width >= 6) {
    return "large";
  }

  if (width <= 3) {
    return "small";
  }

  return "medium";
}

function normalizeDashboardWidgetLimit(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return 6;
  }

  return Math.min(12, Math.max(3, parsed));
}

function getDashboardWidgetOptionsFor(source, visualization) {
  const normalizedSource = normalizeDashboardWidgetSource(source);
  const normalizedVisualization = normalizeDashboardWidgetVisualization(visualization);
  const definition = DASHBOARD_WIDGET_DEFINITIONS[normalizedSource] ?? DASHBOARD_WIDGET_DEFINITIONS.work_orders;

  if (normalizedVisualization === "metric") {
    return definition.metrics ?? [];
  }

  if (normalizedVisualization === "list") {
    return definition.lists ?? [];
  }

  return definition.groupings ?? [];
}

function normalizeDashboardWidgetMetricKey(source, visualization, value) {
  const normalizedValue = normalizeText(value);
  const options = getDashboardWidgetOptionsFor(source, visualization);
  const match = options.find((option) => option.value === normalizedValue);
  return match?.value ?? options[0]?.value ?? "";
}

function normalizeDashboardWidgetFilters(input = {}) {
  return {
    companyId: normalizeText(input.companyId),
    status: normalizeText(input.status),
    priority: normalizeText(input.priority),
    region: normalizeText(input.region),
    executor: normalizeText(input.executor),
    assigneeUserId: normalizeText(input.assigneeUserId),
    dateWindow: normalizeDashboardWidgetDateWindow(input.dateWindow),
    tag: normalizeText(input.tag),
  };
}

function getNextDashboardWidgetPosition(widgets = []) {
  return widgets.reduce((maxValue, item) => Math.max(maxValue, Number(item.position ?? 0)), 0) + 1;
}

function normalizeDashboardWidgetPosition(value, widgets = []) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : getNextDashboardWidgetPosition(widgets);
}

function getDashboardWidgetDefaultTitle(source, visualization, metricKey) {
  const definition = DASHBOARD_WIDGET_DEFINITIONS[normalizeDashboardWidgetSource(source)] ?? DASHBOARD_WIDGET_DEFINITIONS.work_orders;
  const option = getDashboardWidgetOptionsFor(source, visualization).find((entry) => entry.value === metricKey);
  return option?.label ?? `${definition.label} kartica`;
}

function getDashboardLayoutOccupancyKey(column, row) {
  return `${column}:${row}`;
}

function canPlaceDashboardWidget(occupiedCells, column, row, width, height) {
  for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
      if (occupiedCells.has(getDashboardLayoutOccupancyKey(column + columnOffset, row + rowOffset))) {
        return false;
      }
    }
  }

  return true;
}

function markDashboardWidgetPlacement(occupiedCells, column, row, width, height) {
  for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
      occupiedCells.add(getDashboardLayoutOccupancyKey(column + columnOffset, row + rowOffset));
    }
  }
}

function findDashboardWidgetPlacement(
  occupiedCells,
  width,
  height,
  preferredColumn = 1,
  preferredRow = 1,
) {
  const startRow = Math.max(1, preferredRow);
  const maxColumn = Math.max(1, DASHBOARD_GRID_COLUMN_COUNT - width + 1);

  for (let row = startRow; row < 1000; row += 1) {
    const startColumn = row === startRow
      ? Math.min(maxColumn, Math.max(1, preferredColumn))
      : 1;

    for (let column = startColumn; column <= maxColumn; column += 1) {
      if (canPlaceDashboardWidget(occupiedCells, column, row, width, height)) {
        return { column, row };
      }
    }
  }

  return { column: 1, row: startRow };
}

export function applyDashboardWidgetGridLayout(widgets = []) {
  const occupiedCells = new Set();
  const nextWidgets = [];

  sortDashboardWidgets(widgets).forEach((widget) => {
    const size = normalizeDashboardWidgetSize(widget.size);
    const gridWidth = normalizeDashboardWidgetGridWidth(widget.gridWidth, size);
    const gridHeight = normalizeDashboardWidgetGridHeight(widget.gridHeight, size);
    const preferredColumn = normalizeDashboardWidgetGridColumn(widget.gridColumn, gridWidth);
    const preferredRow = normalizeDashboardWidgetGridRow(widget.gridRow);
    const placement = canPlaceDashboardWidget(occupiedCells, preferredColumn, preferredRow, gridWidth, gridHeight)
      ? { column: preferredColumn, row: preferredRow }
      : findDashboardWidgetPlacement(occupiedCells, gridWidth, gridHeight, preferredColumn, preferredRow);

    markDashboardWidgetPlacement(occupiedCells, placement.column, placement.row, gridWidth, gridHeight);
    nextWidgets.push({
      ...widget,
      size: getDashboardWidgetSizeFromWidth(gridWidth),
      gridColumn: placement.column,
      gridRow: placement.row,
      gridWidth,
      gridHeight,
    });
  });

  return nextWidgets;
}

export function createDashboardWidget(
  input,
  snapshot,
  createId = () => crypto.randomUUID(),
  now = isoNow,
) {
  const source = normalizeDashboardWidgetSource(input.source);
  const visualization = normalizeDashboardWidgetVisualization(input.visualization);
  const metricKey = normalizeDashboardWidgetMetricKey(source, visualization, input.metricKey);
  const timestamp = now();
  const title = normalizeText(input.title) || getDashboardWidgetDefaultTitle(source, visualization, metricKey);
  const size = normalizeDashboardWidgetSize(input.size);
  const draft = {
    id: createId(),
    organizationId: requireText(input.organizationId, "Organizacija"),
    userId: requireText(input.userId, "Korisnik"),
    title,
    source,
    visualization,
    metricKey,
    size,
    limit: normalizeDashboardWidgetLimit(input.limit),
    position: normalizeDashboardWidgetPosition(input.position, snapshot?.dashboardWidgets ?? []),
    gridWidth: normalizeDashboardWidgetGridWidth(input.gridWidth, size),
    gridHeight: normalizeDashboardWidgetGridHeight(input.gridHeight, size),
    gridColumn: normalizeDashboardWidgetGridColumn(input.gridColumn, normalizeDashboardWidgetGridWidth(input.gridWidth, size)),
    gridRow: normalizeDashboardWidgetGridRow(input.gridRow),
    filters: normalizeDashboardWidgetFilters(input.filters),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const laidOutDraft = applyDashboardWidgetGridLayout([...(snapshot?.dashboardWidgets ?? []), draft])
    .find((widget) => widget.id === draft.id);

  return laidOutDraft ?? draft;
}

export function updateDashboardWidget(current, patch, snapshot, now = isoNow) {
  const source = hasOwn(patch, "source")
    ? normalizeDashboardWidgetSource(patch.source)
    : normalizeDashboardWidgetSource(current.source);
  const visualization = hasOwn(patch, "visualization")
    ? normalizeDashboardWidgetVisualization(patch.visualization)
    : normalizeDashboardWidgetVisualization(current.visualization);
  const metricKey = normalizeDashboardWidgetMetricKey(
    source,
    visualization,
    hasOwn(patch, "metricKey") ? patch.metricKey : current.metricKey,
  );
  const title = hasOwn(patch, "title")
    ? (normalizeText(patch.title) || getDashboardWidgetDefaultTitle(source, visualization, metricKey))
    : (normalizeText(current.title) || getDashboardWidgetDefaultTitle(source, visualization, metricKey));
  const mergedFilters = hasOwn(patch, "filters")
    ? { ...(current.filters ?? {}), ...(patch.filters ?? {}) }
    : (current.filters ?? {});
  const requestedSize = hasOwn(patch, "size")
    ? normalizeDashboardWidgetSize(patch.size)
    : normalizeDashboardWidgetSize(current.size);
  const gridWidth = hasOwn(patch, "gridWidth")
    ? normalizeDashboardWidgetGridWidth(patch.gridWidth, requestedSize)
    : hasOwn(patch, "size")
      ? normalizeDashboardWidgetGridWidth(undefined, requestedSize)
      : normalizeDashboardWidgetGridWidth(current.gridWidth, requestedSize);
  const gridHeight = hasOwn(patch, "gridHeight")
    ? normalizeDashboardWidgetGridHeight(patch.gridHeight, requestedSize)
    : hasOwn(patch, "size")
      ? normalizeDashboardWidgetGridHeight(undefined, requestedSize)
      : normalizeDashboardWidgetGridHeight(current.gridHeight, requestedSize);

  return {
    ...current,
    organizationId: hasOwn(patch, "organizationId")
      ? requireText(patch.organizationId, "Organizacija")
      : requireText(current.organizationId, "Organizacija"),
    userId: hasOwn(patch, "userId")
      ? requireText(patch.userId, "Korisnik")
      : requireText(current.userId, "Korisnik"),
    title,
    source,
    visualization,
    metricKey,
    size: getDashboardWidgetSizeFromWidth(gridWidth),
    limit: hasOwn(patch, "limit") ? normalizeDashboardWidgetLimit(patch.limit) : normalizeDashboardWidgetLimit(current.limit),
    position: hasOwn(patch, "position")
      ? normalizeDashboardWidgetPosition(patch.position, snapshot?.dashboardWidgets ?? [])
      : normalizeDashboardWidgetPosition(current.position, snapshot?.dashboardWidgets ?? []),
    gridWidth,
    gridHeight,
    gridColumn: hasOwn(patch, "gridColumn")
      ? normalizeDashboardWidgetGridColumn(patch.gridColumn, gridWidth)
      : normalizeDashboardWidgetGridColumn(current.gridColumn, gridWidth),
    gridRow: hasOwn(patch, "gridRow")
      ? normalizeDashboardWidgetGridRow(patch.gridRow)
      : normalizeDashboardWidgetGridRow(current.gridRow),
    filters: normalizeDashboardWidgetFilters(mergedFilters),
    updatedAt: now(),
  };
}

export function sortDashboardWidgets(widgets = []) {
  return [...widgets].sort((left, right) => {
    const leftPosition = Number(left.position ?? Number.MAX_SAFE_INTEGER);
    const rightPosition = Number(right.position ?? Number.MAX_SAFE_INTEGER);

    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition;
    }

    return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });
}

function isPastDue(dateValue, todayKey) {
  const dateKey = dateValueToKey(dateValue);
  return dateKey !== null && todayKey !== null && dateKey < todayKey;
}

function isWithinFutureWindow(dateValue, todayKey, days) {
  const dateKey = dateValueToKey(dateValue);

  if (dateKey === null || todayKey === null) {
    return false;
  }

  return dateKey >= todayKey && dateKey <= (todayKey + (days * 24 * 60 * 60 * 1000));
}

function applyDashboardDateWindow(items, getDate, dateWindow, todayKey, isClosed = () => false) {
  if (dateWindow === "all") {
    return items;
  }

  if (dateWindow === "overdue") {
    return items.filter((item) => !isClosed(item) && isPastDue(getDate(item), todayKey));
  }

  const windowDays = Number.parseInt(dateWindow, 10);

  if (!Number.isFinite(windowDays)) {
    return items;
  }

  return items.filter((item) => !isClosed(item) && isWithinFutureWindow(getDate(item), todayKey, windowDays));
}

function splitTags(value) {
  return normalizeText(value)
    .split(",")
    .map((entry) => normalizeText(entry))
    .filter(Boolean);
}

function getDashboardFilteredSourceItems(snapshot, widget, context = {}, today = todayString()) {
  const todayKey = dateValueToKey(today);
  const filters = normalizeDashboardWidgetFilters(widget.filters);

  if (widget.source === "reminders") {
    let items = [...(snapshot.reminders ?? [])];

    if (filters.companyId) {
      items = items.filter((item) => String(item.companyId) === String(filters.companyId));
    }

    if (filters.status && filters.status !== "all") {
      items = items.filter((item) => item.status === filters.status);
    }

    return applyDashboardDateWindow(items, (item) => item.dueDate, filters.dateWindow, todayKey, (item) => item.status === "done");
  }

  if (widget.source === "todo_tasks") {
    let items = [...(snapshot.todoTasks ?? [])];

    if (filters.companyId) {
      items = items.filter((item) => String(item.companyId) === String(filters.companyId));
    }

    if (filters.status && filters.status !== "all") {
      items = items.filter((item) => item.status === filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      items = items.filter((item) => item.priority === filters.priority);
    }

    if (filters.assigneeUserId) {
      items = items.filter((item) => String(item.assignedToUserId) === String(filters.assigneeUserId));
    }

    return applyDashboardDateWindow(items, (item) => item.dueDate, filters.dateWindow, todayKey, (item) => item.status === "done");
  }

  if (widget.source === "locations") {
    let items = [...(snapshot.locations ?? [])];

    if (filters.companyId) {
      items = items.filter((item) => String(item.companyId) === String(filters.companyId));
    }

    if (filters.region) {
      items = items.filter((item) => normalizeText(item.region) === filters.region);
    }

    return items;
  }

  let items = [...(snapshot.workOrders ?? [])];

  if (filters.companyId) {
    items = items.filter((item) => String(item.companyId) === String(filters.companyId));
  }

  if (filters.status && filters.status !== "all") {
    items = items.filter((item) => item.status === filters.status);
  }

  if (filters.priority && filters.priority !== "all") {
    items = items.filter((item) => item.priority === filters.priority);
  }

  if (filters.region) {
    items = items.filter((item) => normalizeText(item.region) === filters.region);
  }

  if (filters.executor) {
    items = items.filter((item) => [item.executor1, item.executor2].some((value) => normalizeText(value) === filters.executor));
  }

  if (filters.tag) {
    const tagLower = filters.tag.toLowerCase();
    items = items.filter((item) => splitTags(item.tagText).some((value) => value.toLowerCase() === tagLower));
  }

  return applyDashboardDateWindow(items, (item) => item.dueDate, filters.dateWindow, todayKey, (item) => CLOSED_WORK_ORDER_STATUSES.has(item.status));
}

function buildDashboardDistributionItems(widget, items) {
  if (widget.source === "reminders") {
    if (widget.metricKey === "status") {
      return REMINDER_STATUS_OPTIONS.map((option) => ({
        label: option.label,
        count: items.filter((item) => item.status === option.value).length,
      })).filter((item) => item.count > 0).slice(0, widget.limit);
    }

    if (widget.metricKey === "company") {
      return countGroupedValues(items, (item) => item.companyName, {
        fallback: "Bez tvrtke",
        limit: widget.limit,
      });
    }

    if (widget.metricKey === "creator") {
      return countGroupedValues(items, (item) => item.createdByLabel, {
        fallback: "Safety360",
        limit: widget.limit,
      });
    }
  }

  if (widget.source === "todo_tasks") {
    if (widget.metricKey === "status") {
      return TODO_TASK_STATUS_OPTIONS.map((option) => ({
        label: option.label,
        count: items.filter((item) => item.status === option.value).length,
      })).filter((item) => item.count > 0).slice(0, widget.limit);
    }

    if (widget.metricKey === "priority") {
      return PRIORITY_OPTIONS.map((option) => ({
        label: option.label,
        count: items.filter((item) => item.priority === option.value).length,
      })).filter((item) => item.count > 0).slice(0, widget.limit);
    }

    if (widget.metricKey === "assignee") {
      return countGroupedValues(items, (item) => item.assignedToLabel, {
        fallback: "Nedodijeljeno",
        limit: widget.limit,
      });
    }

    if (widget.metricKey === "creator") {
      return countGroupedValues(items, (item) => item.createdByLabel, {
        fallback: "Safety360",
        limit: widget.limit,
      });
    }
  }

  if (widget.source === "locations") {
    if (widget.metricKey === "region") {
      return countGroupedValues(items, (item) => item.region, {
        fallback: "Bez regije",
        limit: widget.limit,
      });
    }

    if (widget.metricKey === "company") {
      return countGroupedValues(items, (item) => item.companyName, {
        fallback: "Bez tvrtke",
        limit: widget.limit,
      });
    }

    if (widget.metricKey === "coordinate_state") {
      return countGroupedValues(items, (item) => (normalizeText(item.coordinates) ? "Ima koordinate" : "Bez koordinata"), {
        limit: widget.limit,
      });
    }
  }

  if (widget.metricKey === "status") {
    return WORK_ORDER_STATUS_OPTIONS.map((option) => ({
      label: option.label,
      count: items.filter((item) => item.status === option.value).length,
    })).filter((item) => item.count > 0).slice(0, widget.limit);
  }

  if (widget.metricKey === "priority") {
    return PRIORITY_OPTIONS.map((option) => ({
      label: option.label,
      count: items.filter((item) => item.priority === option.value).length,
    })).filter((item) => item.count > 0).slice(0, widget.limit);
  }

  if (widget.metricKey === "region") {
    return countGroupedValues(items, (item) => item.region, {
      fallback: "Bez regije",
      limit: widget.limit,
    });
  }

  if (widget.metricKey === "company") {
    return countGroupedValues(items, (item) => item.companyName, {
      fallback: "Bez tvrtke",
      limit: widget.limit,
    });
  }

  if (widget.metricKey === "executor") {
    return countGroupedValues(
      items.flatMap((item) => [item.executor1, item.executor2].filter((value) => normalizeText(value))),
      (value) => value,
      {
        fallback: "Bez izvrsitelja",
        limit: widget.limit,
      },
    );
  }

  if (widget.metricKey === "tag") {
    return countGroupedValues(items.flatMap((item) => splitTags(item.tagText)), (value) => value, {
      fallback: "Bez taga",
      limit: widget.limit,
    });
  }

  return [];
}

function buildDashboardMetricValue(widget, items, snapshot, context = {}, today = todayString()) {
  const todayKey = dateValueToKey(today);

  if (widget.source === "reminders") {
    if (widget.metricKey === "active") {
      return items.filter((item) => item.status === "active").length;
    }

    if (widget.metricKey === "today") {
      return items.filter((item) => item.dueDate === today).length;
    }

    if (widget.metricKey === "overdue") {
      return items.filter((item) => item.status !== "done" && isPastDue(item.dueDate, todayKey)).length;
    }

    if (widget.metricKey === "done") {
      return items.filter((item) => item.status === "done").length;
    }

    return items.length;
  }

  if (widget.source === "todo_tasks") {
    if (widget.metricKey === "assigned_to_me") {
      return items.filter((item) => String(item.assignedToUserId) === String(context.userId ?? "")).length;
    }

    if (widget.metricKey === "created_by_me") {
      return items.filter((item) => String(item.createdByUserId) === String(context.userId ?? "")).length;
    }

    if (widget.metricKey === "overdue") {
      return items.filter((item) => item.status !== "done" && isPastDue(item.dueDate, todayKey)).length;
    }

    if (widget.metricKey === "done") {
      return items.filter((item) => item.status === "done").length;
    }

    return items.length;
  }

  if (widget.source === "locations") {
    if (widget.metricKey === "missing_coordinates") {
      return items.filter((item) => !normalizeText(item.coordinates)).length;
    }

    return items.length;
  }

  if (widget.metricKey === "active") {
    return items.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status)).length;
  }

  if (widget.metricKey === "urgent") {
    return items.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && item.priority === "Urgent").length;
  }

  if (widget.metricKey === "due_7d") {
    return items.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && isWithinFutureWindow(item.dueDate, todayKey, 7)).length;
  }

  if (widget.metricKey === "overdue") {
    return items.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && isPastDue(item.dueDate, todayKey)).length;
  }

  if (widget.metricKey === "completed") {
    return items.filter((item) => CLOSED_WORK_ORDER_STATUSES.has(item.status)).length;
  }

  if (widget.metricKey === "factured") {
    return items.filter((item) => item.status === "Fakturiran RN").length;
  }

  return items.length;
}

function mapDashboardListItem(entry, type) {
  if (type === "reminders") {
    return {
      id: entry.id,
      type,
      title: entry.title || "Reminder",
      subtitle: [entry.companyName, entry.locationName, entry.workOrderNumber].filter(Boolean).join(" · ") || "Bez veze",
      meta: entry.dueDate || entry.updatedAt || "",
      status: entry.status,
      workOrderId: entry.workOrderId,
    };
  }

  if (type === "todo_tasks") {
    return {
      id: entry.id,
      type,
      title: entry.title || "ToDo",
      subtitle: [entry.assignedToLabel, entry.workOrderNumber].filter(Boolean).join(" · ") || "Bez izvrsitelja",
      meta: entry.dueDate || entry.updatedAt || "",
      status: entry.status,
      workOrderId: entry.workOrderId,
    };
  }

  if (type === "locations") {
    return {
      id: entry.id,
      type,
      title: entry.name || "Lokacija",
      subtitle: [entry.companyName, entry.region].filter(Boolean).join(" · ") || "Bez detalja",
      meta: normalizeText(entry.coordinates) || "Bez koordinata",
      status: normalizeText(entry.coordinates) ? "Ima koordinate" : "Bez koordinata",
      workOrderId: "",
    };
  }

  return {
    id: entry.id,
    type,
    title: entry.workOrderNumber || "Bez broja RN",
    subtitle: [entry.companyName, entry.locationName].filter(Boolean).join(" · ") || "Bez klijenta",
    meta: entry.dueDate || entry.updatedAt || "",
    status: entry.status,
    workOrderId: entry.id,
  };
}

function buildDashboardListItems(widget, items, context = {}, today = todayString()) {
  const todayKey = dateValueToKey(today);

  if (widget.source === "reminders") {
    let nextItems = [...items];

    if (widget.metricKey === "due_soon") {
      nextItems = nextItems
        .filter((item) => item.status !== "done" && item.dueDate)
        .sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));
    } else if (widget.metricKey === "overdue") {
      nextItems = nextItems
        .filter((item) => item.status !== "done" && isPastDue(item.dueDate, todayKey))
        .sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));
    } else {
      nextItems = nextItems.sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
    }

    return nextItems.slice(0, widget.limit).map((item) => mapDashboardListItem(item, "reminders"));
  }

  if (widget.source === "todo_tasks") {
    let nextItems = [...items];

    if (widget.metricKey === "assigned_to_me") {
      nextItems = nextItems.filter((item) => String(item.assignedToUserId) === String(context.userId ?? ""));
    } else if (widget.metricKey === "overdue") {
      nextItems = nextItems.filter((item) => item.status !== "done" && isPastDue(item.dueDate, todayKey));
    } else if (widget.metricKey === "open_items") {
      nextItems = nextItems.filter((item) => item.status !== "done");
    }

    nextItems = nextItems.sort((left, right) => {
      if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
        return left.dueDate.localeCompare(right.dueDate);
      }

      return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
    });

    return nextItems.slice(0, widget.limit).map((item) => mapDashboardListItem(item, "todo_tasks"));
  }

  if (widget.source === "locations") {
    let nextItems = [...items];

    if (widget.metricKey === "missing_coordinates") {
      nextItems = nextItems.filter((item) => !normalizeText(item.coordinates));
    }

    nextItems = nextItems.sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
    return nextItems.slice(0, widget.limit).map((item) => mapDashboardListItem(item, "locations"));
  }

  let nextItems = [...items];

  if (widget.metricKey === "upcoming_due") {
    nextItems = nextItems
      .filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && item.dueDate)
      .sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));
  } else if (widget.metricKey === "overdue") {
    nextItems = nextItems
      .filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && isPastDue(item.dueDate, todayKey))
      .sort((left, right) => String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? "")));
  } else if (widget.metricKey === "urgent_open") {
    nextItems = nextItems
      .filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status) && item.priority === "Urgent")
      .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
  } else {
    nextItems = nextItems.sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")));
  }

  return nextItems.slice(0, widget.limit).map((item) => mapDashboardListItem(item, "work_orders"));
}

export function getDashboardWidgetData(snapshot, widget, context = {}, today = todayString()) {
  const normalizedSource = normalizeDashboardWidgetSource(widget.source);
  const normalizedVisualization = normalizeDashboardWidgetVisualization(widget.visualization);
  const normalizedMetricKey = normalizeDashboardWidgetMetricKey(normalizedSource, normalizedVisualization, widget.metricKey);
  const normalizedWidget = {
    ...widget,
    source: normalizedSource,
    visualization: normalizedVisualization,
    metricKey: normalizedMetricKey,
    limit: normalizeDashboardWidgetLimit(widget.limit),
    filters: normalizeDashboardWidgetFilters(widget.filters),
  };
  const choice = getDashboardWidgetOptionsFor(normalizedSource, normalizedVisualization)
    .find((entry) => entry.value === normalizedMetricKey);
  const sourceDefinition = DASHBOARD_WIDGET_DEFINITIONS[normalizedSource] ?? DASHBOARD_WIDGET_DEFINITIONS.work_orders;
  const filteredItems = getDashboardFilteredSourceItems(snapshot, normalizedWidget, context, today);

  if (normalizedVisualization === "metric") {
    return {
      kind: "metric",
      title: normalizedWidget.title,
      sourceLabel: sourceDefinition.label,
      optionLabel: choice?.label ?? normalizedWidget.title,
      value: buildDashboardMetricValue(normalizedWidget, filteredItems, snapshot, context, today),
      subtitle: `${filteredItems.length} zapisa nakon filtra`,
    };
  }

  if (normalizedVisualization === "list") {
    return {
      kind: "list",
      title: normalizedWidget.title,
      sourceLabel: sourceDefinition.label,
      optionLabel: choice?.label ?? normalizedWidget.title,
      items: buildDashboardListItems(normalizedWidget, filteredItems, context, today),
      emptyMessage: "Nema stavki za zadane filtre.",
    };
  }

  return {
    kind: normalizedVisualization,
    title: normalizedWidget.title,
    sourceLabel: sourceDefinition.label,
    optionLabel: choice?.label ?? normalizedWidget.title,
    items: buildDashboardDistributionItems(normalizedWidget, filteredItems),
    emptyMessage: "Nema dovoljno podataka za graf.",
  };
}

export function getDashboardInsights(snapshot, today = todayString()) {
  const companies = snapshot.companies ?? [];
  const locations = snapshot.locations ?? [];
  const workOrders = snapshot.workOrders ?? [];
  const todayKey = dateValueToKey(today);
  const nextWeekKey = todayKey === null ? null : todayKey + (7 * 24 * 60 * 60 * 1000);

  const activeWorkOrders = workOrders.filter((item) => !CLOSED_WORK_ORDER_STATUSES.has(item.status));
  const urgentWorkOrders = activeWorkOrders.filter((item) => item.priority === "Urgent");
  const dueThisWeek = activeWorkOrders.filter((item) => {
    const dueDateKey = dateValueToKey(item.dueDate);

    if (dueDateKey === null || todayKey === null || nextWeekKey === null) {
      return false;
    }

    return dueDateKey >= todayKey && dueDateKey <= nextWeekKey;
  });
  const missingCoordinates = locations.filter((item) => !normalizeText(item.coordinates));

  const statusBreakdown = WORK_ORDER_STATUS_OPTIONS.map((option) => ({
    label: option.label,
    count: workOrders.filter((item) => item.status === option.value).length,
  })).filter((item) => item.count > 0);

  const priorityBreakdown = PRIORITY_OPTIONS.map((option) => ({
    label: option.label,
    count: activeWorkOrders.filter((item) => item.priority === option.value).length,
  })).filter((item) => item.count > 0);

  const topRegions = countGroupedValues(activeWorkOrders, (item) => item.region, {
    fallback: "Bez regije",
    limit: 5,
  });
  const topCompanies = countGroupedValues(activeWorkOrders, (item) => item.companyName, {
    fallback: "Bez tvrtke",
    limit: 5,
  });

  const executorLoad = countGroupedValues(
    activeWorkOrders.flatMap((item) => [item.executor1, item.executor2].filter((value) => normalizeText(value))),
    (value) => value,
    {
      fallback: "Bez izvrsitelja",
      limit: 5,
    },
  );

  const upcomingWorkOrders = activeWorkOrders
    .map((item) => ({
      ...item,
      dueDateKey: dateValueToKey(item.dueDate),
    }))
    .filter((item) => item.dueDateKey !== null && todayKey !== null && item.dueDateKey <= (todayKey + (14 * 24 * 60 * 60 * 1000)))
    .sort((left, right) => left.dueDateKey - right.dueDateKey)
    .slice(0, 6)
    .map(({ dueDateKey, ...item }) => item);

  return {
    companies: companies.length,
    locations: locations.length,
    activeWorkOrders: activeWorkOrders.length,
    urgentWorkOrders: urgentWorkOrders.length,
    dueThisWeekWorkOrders: dueThisWeek.length,
    missingCoordinatesLocations: missingCoordinates.length,
    statusBreakdown,
    priorityBreakdown,
    topRegions,
    topCompanies,
    executorLoad,
    upcomingWorkOrders,
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
