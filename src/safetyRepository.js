import mysql from "mysql2/promise";

import {
  applyDashboardWidgetGridLayout,
  buildLocationContacts,
  createCompany,
  createDashboardWidget,
  createLocation,
  createReminder,
  createTodoTask,
  createTodoTaskComment,
  createWorkOrder,
  syncLocationFieldsFromWorkOrder,
  updateCompany,
  updateDashboardWidget,
  updateLocation,
  updateReminder,
  updateTodoTask,
  updateWorkOrder,
} from "./safetyModel.js";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  createPasswordHash,
  hashStoredToken,
  verifyPassword,
} from "./webAuth.js";

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeDateOnly(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function parseMySqlConnectionString(connectionString) {
  const url = new URL(connectionString);
  const rawSslMode = url.searchParams.get("ssl-mode") ?? url.searchParams.get("sslmode") ?? "";
  const sslMode = rawSslMode.toLowerCase();
  const shouldUseSsl = sslMode !== "disable";

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4",
    timezone: "Z",
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  };
}

function getDatabaseKind() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    return "memory";
  }

  if (connectionString.startsWith("mysql://")) {
  return "mysql";
}

async function ensureColumnExists(pool, tableName, columnName, definition) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);

  if (rows.length === 0) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function backfillDashboardWidgetLayouts(pool) {
  const [rows] = await pool.query(`
    SELECT id, organization_id, user_id, size_key, sort_order, grid_column, grid_row, grid_width, grid_height
    FROM web_dashboard_widgets
    ORDER BY organization_id ASC, user_id ASC, sort_order ASC, id ASC
  `);

  if (rows.length === 0) {
    return;
  }

  const groupedRows = new Map();
  rows.forEach((row) => {
    const key = `${dbString(row.organization_id)}:${dbString(row.user_id)}`;
    const current = groupedRows.get(key) ?? [];
    current.push(row);
    groupedRows.set(key, current);
  });

  for (const group of groupedRows.values()) {
    const needsBackfill = group.some((row) => !row.grid_column || !row.grid_row || !row.grid_width || !row.grid_height)
      || (group.length > 1 && group.every((row) => Number(row.grid_column ?? 1) === 1 && Number(row.grid_row ?? 1) === 1));

    if (!needsBackfill) {
      continue;
    }

    const laidOut = applyDashboardWidgetGridLayout(group.map((row) => ({
      id: String(row.id),
      size: row.size_key ?? "medium",
      position: Number(row.sort_order ?? 0),
      gridColumn: Number(row.grid_column ?? 1),
      gridRow: Number(row.grid_row ?? 1),
      gridWidth: Number(row.grid_width ?? 0),
      gridHeight: Number(row.grid_height ?? 0),
    })));

    for (const widget of laidOut) {
      await pool.query(
        `
          UPDATE web_dashboard_widgets
          SET grid_column = ?, grid_row = ?, grid_width = ?, grid_height = ?
          WHERE id = ?
        `,
        [
          Number(widget.gridColumn),
          Number(widget.gridRow),
          Number(widget.gridWidth),
          Number(widget.gridHeight),
          Number(widget.id),
        ],
      );
    }
  }
}

  return "memory";
}

function normalizeActiveValue(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "" || raw === "aktivno" || raw === "da" || raw === "true" || raw === "1";
}

function activeLabel(value) {
  return value ? "Aktivno" : "Neaktivno";
}

function dbString(value) {
  return String(value ?? "").trim();
}

function parseNullableDecimal(value) {
  const raw = dbString(value).replace(",", ".");

  if (!raw) {
    return null;
  }

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseNullableInteger(value) {
  const raw = dbString(value);

  if (!raw) {
    return null;
  }

  const numeric = Number(raw);
  return Number.isInteger(numeric) ? numeric : null;
}

function parseJsonObject(value, fallback = {}) {
  const raw = dbString(value);

  if (!raw) {
    return { ...fallback };
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function locationCompositeKey(oib, name) {
  return `${dbString(oib)}::${dbString(name).toLowerCase()}`;
}

function extractLegacyLocationContactsFromRow(row) {
  const contacts = [];

  for (const slot of [1, 2, 3]) {
    const suffix = slot === 1 ? "" : String(slot);
    const contact = {
      slot,
      name: dbString(row[`kontakt_osoba${suffix}`]),
      phone: dbString(row[`kontakt_broj${suffix}`]),
      email: dbString(row[`kontakt_email${suffix}`]),
    };

    if (contact.name || contact.phone || contact.email) {
      contacts.push(contact);
    }
  }

  return contacts;
}

function groupLocationContactsByLocationId(rows = []) {
  const grouped = new Map();

  for (const row of rows) {
    const locationId = String(row.location_id ?? "");

    if (!locationId) {
      continue;
    }

    const list = grouped.get(locationId) ?? [];
    const contact = {
      slot: Number(row.sort_order) || (list.length + 1),
      name: dbString(row.contact_name),
      phone: dbString(row.contact_phone),
      email: dbString(row.contact_email),
    };

    if (contact.name || contact.phone || contact.email) {
      list.push(contact);
      grouped.set(locationId, list);
    }
  }

  return grouped;
}

async function replaceLocationContacts(connection, locationId, contacts = []) {
  await connection.query(
    "DELETE FROM web_location_contacts WHERE location_id = ?",
    [Number(locationId)],
  );

  const normalizedContacts = buildLocationContacts({ contacts });

  for (const [index, contact] of normalizedContacts.entries()) {
    await connection.query(
      `
        INSERT INTO web_location_contacts
          (location_id, sort_order, contact_name, contact_phone, contact_email)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        Number(locationId),
        index + 1,
        dbString(contact.name),
        dbString(contact.phone),
        dbString(contact.email),
      ],
    );
  }
}

const WORK_ORDER_ACTIVITY_FIELD_LABELS = {
  status: "Status RN",
  priority: "Prioritet",
  openedDate: "Datum otvaranja",
  dueDate: "Rok zavrsetka",
  companyName: "Tvrtka",
  headquarters: "Sjediste",
  companyOib: "OIB",
  locationName: "Lokacija",
  region: "Regija",
  coordinates: "Koordinate",
  contactName: "Kontakt osoba",
  contactPhone: "Kontakt broj",
  contactEmail: "Kontakt email",
  executor1: "Izvrsitelj 1",
  executor2: "Izvrsitelj 2",
  serviceLine: "Usluga",
  department: "Odjel",
  linkReference: "Veza RN",
  weight: "Tezinski faktor",
  completedBy: "Nalog zavrsio",
  invoiceDate: "Datum fakture",
  tagText: "Tagovi",
  description: "Opis",
  invoiceNote: "Napomena",
};

function formatDateOnlyDisplay(value) {
  const normalized = normalizeDateOnly(value);

  if (!normalized) {
    return "";
  }

  const [year, month, day] = normalized.split("-");
  return `${day}.${month}.${year}.`;
}

function formatWorkOrderActivityValue(fieldKey, value) {
  if (fieldKey === "openedDate" || fieldKey === "dueDate" || fieldKey === "invoiceDate") {
    return formatDateOnlyDisplay(value);
  }

  return dbString(value);
}

function areWorkOrderActivityValuesEqual(fieldKey, left, right) {
  if (fieldKey === "openedDate" || fieldKey === "dueDate" || fieldKey === "invoiceDate") {
    return normalizeDateOnly(left) === normalizeDateOnly(right);
  }

  return dbString(left) === dbString(right);
}

function getActivityActorLabel(actor = {}) {
  return dbString(actor.fullName || actor.name || actor.email || actor.username) || "Safety360";
}

function getActivityActorId(actor = {}) {
  const numeric = Number(actor.id);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildWorkOrderCreatedActivityEntries(workOrder) {
  return [
    {
      actionType: "created",
      fieldKey: "",
      fieldLabel: "",
      oldValue: "",
      newValue: workOrder.workOrderNumber || "",
      description: `Kreiran RN ${workOrder.workOrderNumber || ""}`.trim(),
    },
  ];
}

function buildWorkOrderUpdatedActivityEntries(current, next) {
  return Object.entries(WORK_ORDER_ACTIVITY_FIELD_LABELS).flatMap(([fieldKey, fieldLabel]) => {
    if (areWorkOrderActivityValuesEqual(fieldKey, current[fieldKey], next[fieldKey])) {
      return [];
    }

    const oldValue = formatWorkOrderActivityValue(fieldKey, current[fieldKey]);
    const newValue = formatWorkOrderActivityValue(fieldKey, next[fieldKey]);

    return [{
      actionType: fieldKey === "status" ? "status_change" : "updated",
      fieldKey,
      fieldLabel,
      oldValue,
      newValue,
      description: fieldKey === "status"
        ? `Status promijenjen iz "${oldValue || "-"}" u "${newValue || "-"}"`
        : `${fieldLabel} azuriran`,
    }];
  });
}

function normalizeActivityTimestamp(value) {
  return normalizeTimestamp(value) ?? new Date().toISOString();
}

function mapWorkOrderActivityRow(row) {
  return {
    id: String(row.id),
    workOrderId: String(row.work_order_id ?? row.workOrderId ?? ""),
    actorLabel: row.actor_label ?? row.actorLabel ?? "Safety360",
    actorUserId: row.actor_user_id === null || row.actor_user_id === undefined
      ? ""
      : String(row.actor_user_id),
    actionType: row.action_type ?? row.actionType ?? "updated",
    fieldKey: row.field_key ?? row.fieldKey ?? "",
    fieldLabel: row.field_label ?? row.fieldLabel ?? "",
    oldValue: row.old_value ?? row.oldValue ?? "",
    newValue: row.new_value ?? row.newValue ?? "",
    description: row.description ?? "",
    createdAt: normalizeActivityTimestamp(row.created_at ?? row.createdAt),
  };
}

async function insertWorkOrderActivityEntries(connection, workOrderId, actor, entries = []) {
  if (!entries.length) {
    return;
  }

  for (const entry of entries) {
    await connection.query(
      `
        INSERT INTO web_work_order_activity_logs
          (work_order_id, actor_user_id, actor_label, action_type, field_key, field_label,
           old_value, new_value, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(workOrderId),
        getActivityActorId(actor),
        getActivityActorLabel(actor),
        dbString(entry.actionType) || "updated",
        dbString(entry.fieldKey),
        dbString(entry.fieldLabel),
        dbString(entry.oldValue),
        dbString(entry.newValue),
        dbString(entry.description),
      ],
    );
  }
}

function sanitizeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    username: row.korisnicko_ime,
    fullName: row.ime_prezime ?? row.korisnicko_ime,
    role: row.razina_prava ?? "korisnik",
  };
}

async function fetchSnapshotFromConnection(connection) {
  const [companyRows] = await connection.query(`
    SELECT id, naziv_tvrtke, sjediste, oib, vrsta_ugovora, broj_ugovora, periodika,
           aktivno, predstavnik_korisnika, kontakt_broj, kontakt_email, napomena,
           datum_izmjene, izmjenu_unio
    FROM firme
    ORDER BY naziv_tvrtke ASC
  `);

  const companies = companyRows.map((row) => ({
    id: String(row.id),
    name: row.naziv_tvrtke,
    headquarters: row.sjediste ?? "",
    oib: row.oib ?? "",
    contractType: row.vrsta_ugovora ?? "",
    contractNumber: row.broj_ugovora ?? "",
    period: row.periodika ?? "",
    isActive: normalizeActiveValue(row.aktivno),
    representative: row.predstavnik_korisnika ?? "",
    contactPhone: row.kontakt_broj ?? "",
    contactEmail: row.kontakt_email ?? "",
    note: row.napomena ?? "",
    createdAt: normalizeTimestamp(row.datum_izmjene),
    updatedAt: normalizeTimestamp(row.datum_izmjene),
    updatedBy: row.izmjenu_unio ?? "",
  }));

  const companiesByOib = new Map(companies.map((company) => [company.oib, company]));

  const [locationRows] = await connection.query(`
    SELECT id, firma_oib, lokacija, kontakt_osoba, kontakt_osoba2, kontakt_osoba3,
           kontakt_broj, kontakt_broj2, kontakt_broj3,
           kontakt_email, kontakt_email2, kontakt_email3,
           koordinate, regija, aktivno, vrijeme_promjene, korisnik,
           naziv_tvrtke, sjediste, periodika, predstavnik_korisnika, napomena
    FROM lokacije
    ORDER BY naziv_tvrtke ASC, lokacija ASC
  `);
  const [locationContactRows] = await connection.query(`
    SELECT id, location_id, sort_order, contact_name, contact_phone, contact_email
    FROM web_location_contacts
    ORDER BY location_id ASC, sort_order ASC, id ASC
  `);
  const locationContactsById = groupLocationContactsByLocationId(locationContactRows);

  const locations = locationRows.map((row) => {
    const company = companiesByOib.get(row.firma_oib ?? "");
    const contacts = locationContactsById.get(String(row.id)) ?? extractLegacyLocationContactsFromRow(row);

    return {
      id: String(row.id),
      companyId: company?.id ?? `oib:${row.firma_oib ?? ""}`,
      name: row.lokacija ?? "",
      isActive: normalizeActiveValue(row.aktivno),
      period: row.periodika ?? "",
      representative: row.predstavnik_korisnika ?? "",
      coordinates: row.koordinate ?? "",
      region: row.regija ?? "",
      note: row.napomena ?? "",
      contacts,
      contactName1: contacts[0]?.name ?? "",
      contactPhone1: contacts[0]?.phone ?? "",
      contactEmail1: contacts[0]?.email ?? "",
      contactName2: contacts[1]?.name ?? "",
      contactPhone2: contacts[1]?.phone ?? "",
      contactEmail2: contacts[1]?.email ?? "",
      contactName3: contacts[2]?.name ?? "",
      contactPhone3: contacts[2]?.phone ?? "",
      contactEmail3: contacts[2]?.email ?? "",
      createdAt: normalizeTimestamp(row.vrijeme_promjene),
      updatedAt: normalizeTimestamp(row.vrijeme_promjene),
      companyOib: row.firma_oib ?? "",
      companyName: row.naziv_tvrtke ?? company?.name ?? "",
      headquarters: row.sjediste ?? company?.headquarters ?? "",
    };
  });

  const locationsByKey = new Map(
    locations.map((location) => [
      locationCompositeKey(location.companyOib, location.name),
      location,
    ]),
  );

  const [workOrderRows] = await connection.query(`
    SELECT id, broj_rn, datum_rn, ime_tvrtke, sjediste, oib, veza_rn, lokacija, prioritet,
           kontakt_osoba, kontakt_broj, kontakt_email, rok_zavrsetka, izvrsitelj_rn1,
           izvrsitelj_rn2, tagovi, status_rn, napomena_faktura, godina_rn, redni_broj,
           odjel, koordinate, usluge, opis, regija, datum_fakturiranja, tezina, rn_zavrsio
    FROM radni_nalozi
    ORDER BY datum_rn DESC, id DESC
  `);

  const workOrders = workOrderRows.map((row) => {
    const company = companiesByOib.get(row.oib ?? "");
    const location = locationsByKey.get(locationCompositeKey(row.oib ?? "", row.lokacija ?? ""));

    return {
      id: String(row.id),
      workOrderNumber: row.broj_rn,
      status: row.status_rn ?? "Otvoreni RN",
      openedDate: normalizeDateOnly(row.datum_rn),
      dueDate: normalizeDateOnly(row.rok_zavrsetka),
      invoiceNote: row.napomena_faktura ?? "",
      invoiceDate: normalizeDateOnly(row.datum_fakturiranja),
      weight: row.tezina === null || row.tezina === undefined ? "" : String(row.tezina),
      completedBy: row.rn_zavrsio ?? "",
      description: row.opis ?? "",
      companyId: company?.id ?? `oib:${row.oib ?? ""}`,
      companyName: row.ime_tvrtke ?? company?.name ?? "",
      companyOib: row.oib ?? "",
      headquarters: row.sjediste ?? company?.headquarters ?? "",
      contractType: company?.contractType ?? "",
      locationId: location?.id ?? "",
      locationName: row.lokacija ?? "",
      linkReference: row.veza_rn ?? "",
      executor1: row.izvrsitelj_rn1 ?? "",
      executor2: row.izvrsitelj_rn2 ?? "",
      priority: row.prioritet ?? "Normal",
      tagText: row.tagovi ?? "",
      coordinates: row.koordinate ?? location?.coordinates ?? "",
      region: row.regija ?? location?.region ?? "",
      contactSlot: null,
      contactName: row.kontakt_osoba ?? "",
      contactPhone: row.kontakt_broj ?? "",
      contactEmail: row.kontakt_email ?? "",
      serviceLine: row.usluge ?? "",
      department: row.odjel ?? "",
      createdAt: normalizeTimestamp(row.datum_rn),
      updatedAt: normalizeTimestamp(row.datum_fakturiranja ?? row.datum_rn),
      year: row.godina_rn ?? null,
      ordinalNumber: row.redni_broj ?? null,
    };
  });

  const companiesById = new Map(companies.map((company) => [String(company.id), company]));
  const locationsById = new Map(locations.map((location) => [String(location.id), location]));
  const workOrdersById = new Map(workOrders.map((workOrder) => [String(workOrder.id), workOrder]));

  const [reminderRows] = await connection.query(`
    SELECT id, organization_id, company_id, location_id, work_order_id, title, note, due_date,
           status, created_by_user_id, created_by_label, completed_at, created_at, updated_at
    FROM web_reminders
    ORDER BY
      CASE status
        WHEN 'active' THEN 0
        WHEN 'snoozed' THEN 1
        WHEN 'done' THEN 2
        ELSE 9
      END ASC,
      due_date ASC,
      updated_at DESC,
      id DESC
  `);

  const reminders = reminderRows.map((row) => {
    const linkedWorkOrder = workOrdersById.get(String(row.work_order_id ?? ""));
    const company = companiesById.get(String(linkedWorkOrder?.companyId ?? row.company_id ?? ""));
    const location = locationsById.get(String(linkedWorkOrder?.locationId ?? row.location_id ?? ""));

    return {
      id: String(row.id),
      organizationId: dbString(row.organization_id),
      companyId: linkedWorkOrder?.companyId ?? dbString(row.company_id),
      companyName: linkedWorkOrder?.companyName ?? company?.name ?? "",
      locationId: linkedWorkOrder?.locationId ?? dbString(row.location_id),
      locationName: linkedWorkOrder?.locationName ?? location?.name ?? "",
      workOrderId: linkedWorkOrder?.id ?? dbString(row.work_order_id),
      workOrderNumber: linkedWorkOrder?.workOrderNumber ?? "",
      title: row.title ?? "",
      note: row.note ?? "",
      dueDate: normalizeDateOnly(row.due_date),
      status: row.status ?? "active",
      createdByUserId: dbString(row.created_by_user_id),
      createdByLabel: row.created_by_label ?? "",
      completedAt: normalizeTimestamp(row.completed_at),
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    };
  });

  const [todoTaskRows] = await connection.query(`
    SELECT id, organization_id, company_id, location_id, work_order_id, title, message, status,
           priority, due_date, created_by_user_id, created_by_label, assigned_to_user_id,
           assigned_to_label, completed_at, created_at, updated_at
    FROM web_team_tasks
    ORDER BY
      CASE status
        WHEN 'open' THEN 0
        WHEN 'in_progress' THEN 1
        WHEN 'waiting' THEN 2
        WHEN 'done' THEN 3
        ELSE 9
      END ASC,
      due_date ASC,
      updated_at DESC,
      id DESC
  `);

  const [todoCommentRows] = await connection.query(`
    SELECT id, task_id, organization_id, user_id, author_label, message, created_at
    FROM web_team_task_comments
    ORDER BY created_at ASC, id ASC
  `);

  const todoCommentsByTaskId = new Map();

  todoCommentRows.forEach((row) => {
    const taskId = dbString(row.task_id);
    const entry = {
      id: String(row.id),
      taskId,
      organizationId: dbString(row.organization_id),
      userId: dbString(row.user_id),
      authorLabel: row.author_label ?? "",
      message: row.message ?? "",
      createdAt: normalizeTimestamp(row.created_at),
    };

    if (!todoCommentsByTaskId.has(taskId)) {
      todoCommentsByTaskId.set(taskId, []);
    }

    todoCommentsByTaskId.get(taskId).push(entry);
  });

  const todoTasks = todoTaskRows.map((row) => {
    const linkedWorkOrder = workOrdersById.get(String(row.work_order_id ?? ""));
    const company = companiesById.get(String(linkedWorkOrder?.companyId ?? row.company_id ?? ""));
    const location = locationsById.get(String(linkedWorkOrder?.locationId ?? row.location_id ?? ""));
    const comments = (todoCommentsByTaskId.get(String(row.id)) ?? []).map((comment) => ({ ...comment }));

    return {
      id: String(row.id),
      organizationId: dbString(row.organization_id),
      companyId: linkedWorkOrder?.companyId ?? dbString(row.company_id),
      companyName: linkedWorkOrder?.companyName ?? company?.name ?? "",
      locationId: linkedWorkOrder?.locationId ?? dbString(row.location_id),
      locationName: linkedWorkOrder?.locationName ?? location?.name ?? "",
      workOrderId: linkedWorkOrder?.id ?? dbString(row.work_order_id),
      workOrderNumber: linkedWorkOrder?.workOrderNumber ?? "",
      title: row.title ?? "",
      message: row.message ?? "",
      status: row.status ?? "open",
      priority: row.priority ?? "Normal",
      dueDate: normalizeDateOnly(row.due_date),
      createdByUserId: dbString(row.created_by_user_id),
      createdByLabel: row.created_by_label ?? "",
      assignedToUserId: dbString(row.assigned_to_user_id),
      assignedToLabel: row.assigned_to_label ?? "",
      completedAt: normalizeTimestamp(row.completed_at),
      commentCount: comments.length,
      comments,
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    };
  });

  const [dashboardWidgetRows] = await connection.query(`
    SELECT id, organization_id, user_id, title, widget_type, source_type, metric_key,
           size_key, limit_count, sort_order, grid_column, grid_row, grid_width, grid_height,
           filters_json, created_at, updated_at
    FROM web_dashboard_widgets
    ORDER BY organization_id ASC, user_id ASC, sort_order ASC, id ASC
  `);

  const dashboardWidgets = applyDashboardWidgetGridLayout(dashboardWidgetRows.map((row) => ({
    id: String(row.id),
    organizationId: dbString(row.organization_id),
    userId: dbString(row.user_id),
    title: row.title ?? "",
    visualization: row.widget_type ?? "metric",
    source: row.source_type ?? "work_orders",
    metricKey: row.metric_key ?? "",
    size: row.size_key ?? "medium",
    limit: Number(row.limit_count ?? 6),
    position: Number(row.sort_order ?? 0),
    gridColumn: Number(row.grid_column ?? 1),
    gridRow: Number(row.grid_row ?? 1),
    gridWidth: Number(row.grid_width ?? 0),
    gridHeight: Number(row.grid_height ?? 0),
    filters: parseJsonObject(row.filters_json),
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  })));

  return {
    companies,
    locations,
    workOrders,
    reminders,
    todoTasks,
    dashboardWidgets,
  };
}

async function syncLocationFromWorkOrder(connection, snapshot, workOrder) {
  if (!workOrder.locationId) {
    return;
  }

  const currentLocation = snapshot.locations.find((item) => item.id === workOrder.locationId);

  if (!currentLocation) {
    return;
  }

  const nextLocation = syncLocationFieldsFromWorkOrder(currentLocation, workOrder);

  if (
    nextLocation.coordinates === currentLocation.coordinates
    && nextLocation.region === currentLocation.region
  ) {
    return;
  }

  await connection.query(
    `
      UPDATE lokacije
      SET koordinate = ?, regija = ?, vrijeme_promjene = NOW(), korisnik = ?
      WHERE id = ?
    `,
    [
      nextLocation.coordinates,
      nextLocation.region,
      "SelfDash Web",
      Number(nextLocation.id),
    ],
  );
}

async function allocateWorkOrderNumber(connection, year) {
  const [[existing]] = await connection.query(
    "SELECT zadnji_broj FROM rn_brojevi WHERE godina_rn = ? FOR UPDATE",
    [year],
  );

  let nextNumber = 1;

  if (existing) {
    nextNumber = Number(existing.zadnji_broj || 0) + 1;

    await connection.query(
      "UPDATE rn_brojevi SET zadnji_broj = ? WHERE godina_rn = ?",
      [nextNumber, year],
    );
  } else {
    await connection.query(
      "INSERT INTO rn_brojevi (godina_rn, zadnji_broj) VALUES (?, ?)",
      [year, nextNumber],
    );
  }

  return `${String(year).slice(-2)}-${nextNumber}`;
}

export class InMemorySafetyRepository {
  constructor() {
    this.kind = "memory";
    this.snapshot = {
      companies: [],
      locations: [],
      workOrders: [],
      reminders: [],
      todoTasks: [],
      dashboardWidgets: [],
    };
    this.refreshTokens = new Map();
    this.users = [
      {
        id: "1",
        korisnicko_ime: "admin",
        lozinka_hash: "",
        ime_prezime: "Local Admin",
        razina_prava: "admin",
      },
    ];
    this.workOrderActivity = new Map();
  }

  async init() {
    this.users[0].lozinka_hash = await createPasswordHash("admin");
  }

  async close() {}

  async authenticateUser(username, password) {
    const userRow = this.users.find((item) => item.korisnicko_ime.toLowerCase() === dbString(username).toLowerCase());

    if (!userRow) {
      return null;
    }

    const verification = await verifyPassword(password, userRow.lozinka_hash);

    if (!verification.ok) {
      return null;
    }

    if (verification.needsUpgrade) {
      userRow.lozinka_hash = await createPasswordHash(password);
    }

    return sanitizeUser(userRow);
  }

  async storeRefreshToken(user, token, metadata = {}) {
    const expiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS)).toISOString();
    this.refreshTokens.set(hashStoredToken(token), {
      userId: user.id,
      expiresAt,
    });

    return {
      user,
      expiresAt,
    };
  }

  async rotateRefreshToken(currentToken, nextToken, metadata = {}) {
    const session = this.refreshTokens.get(hashStoredToken(currentToken));

    if (!session || Date.parse(session.expiresAt) <= Date.now()) {
      return null;
    }

    const userRow = this.users.find((item) => item.id === session.userId);

    if (!userRow || (metadata.expectedUserId && String(userRow.id) !== String(metadata.expectedUserId))) {
      return null;
    }

    this.refreshTokens.delete(hashStoredToken(currentToken));

    const expiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS)).toISOString();
    this.refreshTokens.set(hashStoredToken(nextToken), {
      userId: userRow.id,
      expiresAt,
    });

    return {
      user: sanitizeUser(userRow),
      expiresAt,
    };
  }

  async deleteRefreshToken(token) {
    return this.refreshTokens.delete(hashStoredToken(token));
  }

  async getSnapshot() {
    return {
      companies: [...this.snapshot.companies],
      locations: [...this.snapshot.locations],
      workOrders: [...this.snapshot.workOrders],
      reminders: [...this.snapshot.reminders],
      todoTasks: this.snapshot.todoTasks.map((item) => ({
        ...item,
        comments: (item.comments ?? []).map((comment) => ({ ...comment })),
      })),
      dashboardWidgets: [...this.snapshot.dashboardWidgets].map((item) => ({
        ...item,
        filters: { ...(item.filters ?? {}) },
      })),
    };
  }

  async createCompany(input) {
    const company = createCompany(input, this.snapshot.companies);
    this.snapshot.companies = [...this.snapshot.companies, company];
    return company;
  }

  async updateCompany(id, patch) {
    const current = this.snapshot.companies.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateCompany(current, patch, this.snapshot.companies);
    this.snapshot.companies = this.snapshot.companies.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteCompany(id) {
    const current = this.snapshot.companies.find((item) => item.id === id);

    if (!current) {
      return false;
    }

    const hasLocations = this.snapshot.locations.some((item) => item.companyId === id);
    const hasWorkOrders = this.snapshot.workOrders.some((item) => item.companyId === id);
    const hasReminders = this.snapshot.reminders.some((item) => item.companyId === id);
    const hasTodoTasks = this.snapshot.todoTasks.some((item) => item.companyId === id);

    if (hasLocations || hasWorkOrders || hasReminders || hasTodoTasks) {
      throw new Error("Tvrtka je vec povezana s lokacijama ili radnim nalozima.");
    }

    this.snapshot.companies = this.snapshot.companies.filter((item) => item.id !== id);
    return true;
  }

  async createLocation(input) {
    const location = createLocation(input, this.snapshot);
    this.snapshot.locations = [...this.snapshot.locations, location];
    return location;
  }

  async updateLocation(id, patch) {
    const current = this.snapshot.locations.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateLocation(current, patch, this.snapshot);
    this.snapshot.locations = this.snapshot.locations.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteLocation(id) {
    const current = this.snapshot.locations.find((item) => item.id === id);

    if (!current) {
      return false;
    }

      const hasWorkOrders = this.snapshot.workOrders.some((item) => item.locationId === id);
      const hasReminders = this.snapshot.reminders.some((item) => item.locationId === id);
      const hasTodoTasks = this.snapshot.todoTasks.some((item) => item.locationId === id);

      if (hasWorkOrders || hasReminders || hasTodoTasks) {
        throw new Error("Lokacija je vec povezana s radnim nalozima.");
      }

    this.snapshot.locations = this.snapshot.locations.filter((item) => item.id !== id);
    return true;
  }

  async createWorkOrder(input, actor = null) {
    const now = new Date();
    const generatedNumber = `${String(now.getFullYear()).slice(-2)}-${this.snapshot.workOrders.length + 1}`;
    const workOrder = createWorkOrder(input, this.snapshot, () => crypto.randomUUID(), generatedNumber);
    this.snapshot.workOrders = [workOrder, ...this.snapshot.workOrders];
    this.workOrderActivity.set(String(workOrder.id), [
      ...buildWorkOrderCreatedActivityEntries(workOrder).map((entry, index) => ({
        id: `${workOrder.id}-created-${index}`,
        workOrderId: String(workOrder.id),
        actorLabel: getActivityActorLabel(actor),
        actorUserId: getActivityActorId(actor) === null ? "" : String(getActivityActorId(actor)),
        actionType: entry.actionType,
        fieldKey: entry.fieldKey,
        fieldLabel: entry.fieldLabel,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        description: entry.description,
        createdAt: new Date().toISOString(),
      })),
    ]);
    return workOrder;
  }

  async updateWorkOrder(id, patch, actor = null) {
    const current = this.snapshot.workOrders.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateWorkOrder(current, patch, this.snapshot);
    this.snapshot.workOrders = this.snapshot.workOrders.map((item) => (item.id === id ? next : item));
    const existingEntries = this.workOrderActivity.get(String(id)) ?? [];
    const nextEntries = buildWorkOrderUpdatedActivityEntries(current, next).map((entry, index) => ({
      id: `${id}-updated-${Date.now()}-${index}`,
      workOrderId: String(id),
      actorLabel: getActivityActorLabel(actor),
      actorUserId: getActivityActorId(actor) === null ? "" : String(getActivityActorId(actor)),
      actionType: entry.actionType,
      fieldKey: entry.fieldKey,
      fieldLabel: entry.fieldLabel,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      description: entry.description,
      createdAt: new Date().toISOString(),
    }));
    this.workOrderActivity.set(String(id), [...nextEntries, ...existingEntries]);
    return next;
  }

  async getWorkOrderActivity(id) {
    return (this.workOrderActivity.get(String(id)) ?? [])
      .slice()
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  }

  async deleteWorkOrder(id) {
    const before = this.snapshot.workOrders.length;
    this.snapshot.workOrders = this.snapshot.workOrders.filter((item) => item.id !== id);
    this.snapshot.reminders = this.snapshot.reminders.map((item) => (
      item.workOrderId === id
        ? {
          ...item,
          workOrderId: "",
          workOrderNumber: "",
          locationId: "",
          locationName: "",
          updatedAt: new Date().toISOString(),
        }
        : item
    ));
    this.snapshot.todoTasks = this.snapshot.todoTasks.map((item) => (
      item.workOrderId === id
        ? {
          ...item,
          workOrderId: "",
          workOrderNumber: "",
          updatedAt: new Date().toISOString(),
        }
        : item
    ));
    return this.snapshot.workOrders.length !== before;
  }

  async createReminder(input, actor = null) {
    const reminder = createReminder({
      ...input,
      createdByUserId: String(actor?.id ?? ""),
      createdByLabel: actor?.fullName || actor?.username || "Safety360",
    }, this.snapshot, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.reminders = [reminder, ...this.snapshot.reminders];
    return reminder;
  }

  async updateReminder(id, patch, actor = null) {
    const current = this.snapshot.reminders.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateReminder(current, {
      ...patch,
      createdByUserId: current.createdByUserId || String(actor?.id ?? ""),
      createdByLabel: current.createdByLabel || actor?.fullName || actor?.username || "Safety360",
    }, this.snapshot, () => new Date().toISOString());
    this.snapshot.reminders = this.snapshot.reminders.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteReminder(id) {
    const before = this.snapshot.reminders.length;
    this.snapshot.reminders = this.snapshot.reminders.filter((item) => item.id !== id);
    return this.snapshot.reminders.length !== before;
  }

  async createTodoTask(input, actor = null) {
    const task = createTodoTask({
      ...input,
      createdByUserId: String(actor?.id ?? input.createdByUserId ?? ""),
      createdByLabel: actor?.fullName || actor?.username || input.createdByLabel || "Safety360",
    }, this.snapshot, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.todoTasks = [task, ...this.snapshot.todoTasks];
    return task;
  }

  async updateTodoTask(id, patch, actor = null) {
    const current = this.snapshot.todoTasks.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateTodoTask(current, {
      ...patch,
      createdByUserId: current.createdByUserId || String(actor?.id ?? ""),
      createdByLabel: current.createdByLabel || actor?.fullName || actor?.username || "Safety360",
    }, this.snapshot, () => new Date().toISOString());
    this.snapshot.todoTasks = this.snapshot.todoTasks.map((item) => (item.id === id ? next : item));
    return next;
  }

  async addTodoTaskComment(id, input, actor = null) {
    const current = this.snapshot.todoTasks.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = createTodoTaskComment(current, {
      ...input,
      userId: String(actor?.id ?? input.userId ?? ""),
      authorLabel: actor?.fullName || actor?.username || input.authorLabel || "Safety360",
    }, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.todoTasks = this.snapshot.todoTasks.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteTodoTask(id) {
    const before = this.snapshot.todoTasks.length;
    this.snapshot.todoTasks = this.snapshot.todoTasks.filter((item) => item.id !== id);
    return this.snapshot.todoTasks.length !== before;
  }

  async createDashboardWidget(input) {
    const widget = createDashboardWidget(input, this.snapshot, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.dashboardWidgets = [...this.snapshot.dashboardWidgets, widget];
    return widget;
  }

  async updateDashboardWidget(id, patch) {
    const current = this.snapshot.dashboardWidgets.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateDashboardWidget(current, patch, this.snapshot, () => new Date().toISOString());
    this.snapshot.dashboardWidgets = this.snapshot.dashboardWidgets.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteDashboardWidget(id) {
    const before = this.snapshot.dashboardWidgets.length;
    this.snapshot.dashboardWidgets = this.snapshot.dashboardWidgets.filter((item) => item.id !== id);
    return this.snapshot.dashboardWidgets.length !== before;
  }
}

export class MySqlSafetyRepository {
  constructor(connectionString) {
    this.kind = "mysql";
    this.pool = mysql.createPool(parseMySqlConnectionString(connectionString));
  }

  async init() {
    await this.pool.query("SELECT 1");
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_refresh_tokens (
        token_hash CHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_agent VARCHAR(255) NOT NULL DEFAULT '',
        ip_address VARCHAR(64) NOT NULL DEFAULT '',
        INDEX idx_web_refresh_tokens_user_id (user_id),
        INDEX idx_web_refresh_tokens_expires_at (expires_at)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_work_order_activity_logs (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        work_order_id INT NOT NULL,
        actor_user_id INT NULL,
        actor_label VARCHAR(160) NOT NULL DEFAULT '',
        action_type VARCHAR(32) NOT NULL DEFAULT 'updated',
        field_key VARCHAR(64) NOT NULL DEFAULT '',
        field_label VARCHAR(120) NOT NULL DEFAULT '',
        old_value TEXT NULL,
        new_value TEXT NULL,
        description TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_work_order_activity_logs_work_order (work_order_id),
        INDEX idx_work_order_activity_logs_created (created_at)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_location_contacts (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        location_id INT NOT NULL,
        sort_order INT NOT NULL DEFAULT 1,
        contact_name VARCHAR(160) NOT NULL DEFAULT '',
        contact_phone VARCHAR(80) NOT NULL DEFAULT '',
        contact_email VARCHAR(160) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_location_contacts_location_id (location_id),
        INDEX idx_web_location_contacts_location_sort (location_id, sort_order)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_reminders (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        company_id INT NULL,
        location_id INT NULL,
        work_order_id INT NULL,
        title VARCHAR(180) NOT NULL,
        note TEXT NOT NULL,
        due_date DATE NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        created_by_user_id INT NULL,
        created_by_label VARCHAR(160) NOT NULL DEFAULT '',
        completed_at DATETIME NULL DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_reminders_organization (organization_id),
        INDEX idx_web_reminders_company (company_id),
        INDEX idx_web_reminders_location (location_id),
        INDEX idx_web_reminders_work_order (work_order_id),
        INDEX idx_web_reminders_due_status (status, due_date)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_team_tasks (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        company_id INT NULL,
        location_id INT NULL,
        work_order_id INT NULL,
        title VARCHAR(180) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'open',
        priority VARCHAR(40) NOT NULL DEFAULT 'Normal',
        due_date DATE NULL,
        created_by_user_id INT NULL,
        created_by_label VARCHAR(160) NOT NULL DEFAULT '',
        assigned_to_user_id INT NULL,
        assigned_to_label VARCHAR(160) NOT NULL DEFAULT '',
        completed_at DATETIME NULL DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_team_tasks_organization (organization_id),
        INDEX idx_web_team_tasks_company (company_id),
        INDEX idx_web_team_tasks_location (location_id),
        INDEX idx_web_team_tasks_work_order (work_order_id),
        INDEX idx_web_team_tasks_status_due (status, due_date),
        INDEX idx_web_team_tasks_assigned (assigned_to_user_id)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_team_task_comments (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        task_id BIGINT NOT NULL,
        organization_id INT NOT NULL,
        user_id INT NULL,
        author_label VARCHAR(160) NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_web_team_task_comments_task (task_id),
        INDEX idx_web_team_task_comments_org (organization_id),
        INDEX idx_web_team_task_comments_created (created_at)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_dashboard_widgets (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(180) NOT NULL,
        widget_type VARCHAR(24) NOT NULL DEFAULT 'metric',
        source_type VARCHAR(24) NOT NULL DEFAULT 'work_orders',
        metric_key VARCHAR(64) NOT NULL DEFAULT '',
        size_key VARCHAR(16) NOT NULL DEFAULT 'medium',
        limit_count INT NOT NULL DEFAULT 6,
        sort_order INT NOT NULL DEFAULT 1,
        grid_column INT NOT NULL DEFAULT 1,
        grid_row INT NOT NULL DEFAULT 1,
        grid_width INT NOT NULL DEFAULT 4,
        grid_height INT NOT NULL DEFAULT 3,
        filters_json LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_dashboard_widgets_org_user (organization_id, user_id),
        INDEX idx_web_dashboard_widgets_order (organization_id, user_id, sort_order)
      )
    `);
    await ensureColumnExists(this.pool, "web_dashboard_widgets", "grid_column", "INT NOT NULL DEFAULT 1");
    await ensureColumnExists(this.pool, "web_dashboard_widgets", "grid_row", "INT NOT NULL DEFAULT 1");
    await ensureColumnExists(this.pool, "web_dashboard_widgets", "grid_width", "INT NOT NULL DEFAULT 4");
    await ensureColumnExists(this.pool, "web_dashboard_widgets", "grid_height", "INT NOT NULL DEFAULT 3");
    await backfillDashboardWidgetLayouts(this.pool);
  }

  async close() {
    await this.pool.end();
  }

  async authenticateUser(username, password) {
    const connection = await this.pool.getConnection();

    try {
      const [rows] = await connection.query(
        `
          SELECT id, korisnicko_ime, lozinka_hash, ime_prezime, razina_prava
          FROM korisnici
          WHERE LOWER(korisnicko_ime) = LOWER(?)
          LIMIT 1
        `,
        [dbString(username)],
      );

      const userRow = rows[0];

      if (!userRow) {
        return null;
      }

      const verification = await verifyPassword(password, userRow.lozinka_hash);

      if (!verification.ok) {
        return null;
      }

      if (verification.needsUpgrade) {
        const nextHash = await createPasswordHash(password);

        await connection.query(
          "UPDATE korisnici SET lozinka_hash = ? WHERE id = ?",
          [nextHash, Number(userRow.id)],
        );
      }

      return sanitizeUser(userRow);
    } finally {
      connection.release();
    }
  }

  async storeRefreshToken(user, token, metadata = {}) {
    const connection = await this.pool.getConnection();

    try {
      const tokenHash = hashStoredToken(token);
      const expiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS));

      await connection.query("DELETE FROM web_refresh_tokens WHERE expires_at <= UTC_TIMESTAMP()");
      await connection.query(
        `
          INSERT INTO web_refresh_tokens (token_hash, user_id, expires_at, user_agent, ip_address)
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          tokenHash,
          Number(user.id),
          expiresAt,
          dbString(metadata.userAgent).slice(0, 255),
          dbString(metadata.ipAddress).slice(0, 64),
        ],
      );

      return {
        user,
        expiresAt: expiresAt.toISOString(),
      };
    } finally {
      connection.release();
    }
  }

  async rotateRefreshToken(currentToken, nextToken, metadata = {}) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const currentTokenHash = hashStoredToken(currentToken);
      const [rows] = await connection.query(
        `
          SELECT k.id, k.korisnicko_ime, k.ime_prezime, k.razina_prava
          FROM web_refresh_tokens s
          INNER JOIN korisnici k ON k.id = s.user_id
          WHERE s.token_hash = ?
            AND s.expires_at > UTC_TIMESTAMP()
          LIMIT 1
        `,
        [currentTokenHash],
      );

      if (!rows[0]) {
        await connection.rollback();
        return null;
      }

      if (metadata.expectedUserId && String(rows[0].id) !== String(metadata.expectedUserId)) {
        await connection.rollback();
        return null;
      }

      const nextExpiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS));

      await connection.query(
        `
          UPDATE web_refresh_tokens
          SET token_hash = ?, expires_at = ?, last_seen_at = CURRENT_TIMESTAMP, user_agent = ?, ip_address = ?
          WHERE token_hash = ?
        `,
        [
          hashStoredToken(nextToken),
          nextExpiresAt,
          dbString(metadata.userAgent).slice(0, 255),
          dbString(metadata.ipAddress).slice(0, 64),
          currentTokenHash,
        ],
      );

      await connection.commit();

      return {
        user: sanitizeUser(rows[0]),
        expiresAt: nextExpiresAt.toISOString(),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteRefreshToken(token) {
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query(
        "DELETE FROM web_refresh_tokens WHERE token_hash = ?",
        [hashStoredToken(token)],
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async getSnapshot() {
    const connection = await this.pool.getConnection();

    try {
      return await fetchSnapshotFromConnection(connection);
    } finally {
      connection.release();
    }
  }

  async createCompany(input) {
    const connection = await this.pool.getConnection();

    try {
      const snapshot = await fetchSnapshotFromConnection(connection);
      const company = createCompany(input, snapshot.companies);

      const [result] = await connection.query(
        `
          INSERT INTO firme
            (naziv_tvrtke, sjediste, oib, predstavnik_korisnika, periodika, vrsta_ugovora,
             broj_ugovora, napomena, aktivno, kontakt_broj, kontakt_email, datum_izmjene, izmjenu_unio)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `,
        [
          company.name,
          company.headquarters,
          company.oib,
          company.representative,
          company.period,
          company.contractType,
          company.contractNumber,
          company.note,
          activeLabel(company.isActive),
          company.contactPhone,
          company.contactEmail,
          "SelfDash Web",
        ],
      );

      return {
        ...company,
        id: String(result.insertId),
      };
    } finally {
      connection.release();
    }
  }

  async updateCompany(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.companies.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateCompany(current, patch, snapshot.companies);

      await connection.query(
        `
          UPDATE firme
          SET naziv_tvrtke = ?, sjediste = ?, oib = ?, predstavnik_korisnika = ?, periodika = ?,
              vrsta_ugovora = ?, broj_ugovora = ?, napomena = ?, aktivno = ?, kontakt_broj = ?,
              kontakt_email = ?, datum_izmjene = NOW(), izmjenu_unio = ?
          WHERE id = ?
        `,
        [
          next.name,
          next.headquarters,
          next.oib,
          next.representative,
          next.period,
          next.contractType,
          next.contractNumber,
          next.note,
          activeLabel(next.isActive),
          next.contactPhone,
          next.contactEmail,
          "SelfDash Web",
          Number(id),
        ],
      );

      if (current.oib !== next.oib || current.name !== next.name || current.headquarters !== next.headquarters || current.representative !== next.representative || current.period !== next.period) {
        await connection.query(
          `
            UPDATE lokacije
            SET firma_oib = ?, naziv_tvrtke = ?, sjediste = ?, periodika = ?, predstavnik_korisnika = ?,
                vrijeme_promjene = NOW(), korisnik = ?
            WHERE firma_oib = ?
          `,
          [
            next.oib,
            next.name,
            next.headquarters,
            next.period,
            next.representative,
            "SelfDash Web",
            current.oib,
          ],
        );

        await connection.query(
          `
            UPDATE radni_nalozi
            SET ime_tvrtke = ?, sjediste = ?, oib = ?
            WHERE oib = ?
          `,
          [
            next.name,
            next.headquarters,
            next.oib,
            current.oib,
          ],
        );
      }

      await connection.commit();
      return next;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteCompany(id) {
    const connection = await this.pool.getConnection();

    try {
      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.companies.find((item) => item.id === id);

      if (!current) {
        return false;
      }

      const [[locationCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM lokacije WHERE firma_oib = ?",
        [current.oib],
      );
      const [[workOrderCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM radni_nalozi WHERE oib = ?",
        [current.oib],
      );
      const [[reminderCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM web_reminders WHERE company_id = ?",
        [Number(id)],
      );
      const [[todoTaskCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM web_team_tasks WHERE company_id = ?",
        [Number(id)],
      );

      if (locationCount.total > 0 || workOrderCount.total > 0 || reminderCount.total > 0 || todoTaskCount.total > 0) {
        throw new Error("Tvrtka je vec povezana s lokacijama ili radnim nalozima.");
      }

      const [result] = await connection.query("DELETE FROM firme WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async createLocation(input) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const location = createLocation(input, snapshot);
      const company = snapshot.companies.find((item) => item.id === location.companyId);

      const [result] = await connection.query(
        `
          INSERT INTO lokacije
            (firma_oib, lokacija, kontakt_osoba, kontakt_osoba2, kontakt_osoba3,
             kontakt_broj, kontakt_broj2, kontakt_broj3, kontakt_email, kontakt_email2,
             kontakt_email3, koordinate, regija, aktivno, korisnik, naziv_tvrtke, sjediste,
             periodika, predstavnik_korisnika, napomena)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          company.oib,
          location.name,
          location.contactName1,
          location.contactName2,
          location.contactName3,
          location.contactPhone1,
          location.contactPhone2,
          location.contactPhone3,
          location.contactEmail1,
          location.contactEmail2,
          location.contactEmail3,
          location.coordinates,
          location.region,
          activeLabel(location.isActive),
          "SelfDash Web",
          company.name,
          company.headquarters,
          location.period,
          location.representative,
            location.note,
        ],
      );

      await replaceLocationContacts(connection, result.insertId, location.contacts);
      await connection.commit();

      return {
        ...location,
        id: String(result.insertId),
        companyOib: company.oib,
        companyName: company.name,
        headquarters: company.headquarters,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateLocation(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.locations.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateLocation(current, patch, snapshot);
      const company = snapshot.companies.find((item) => item.id === next.companyId);

      await connection.query(
        `
          UPDATE lokacije
          SET firma_oib = ?, lokacija = ?, kontakt_osoba = ?, kontakt_osoba2 = ?, kontakt_osoba3 = ?,
              kontakt_broj = ?, kontakt_broj2 = ?, kontakt_broj3 = ?, kontakt_email = ?, kontakt_email2 = ?,
              kontakt_email3 = ?, koordinate = ?, regija = ?, aktivno = ?, korisnik = ?, naziv_tvrtke = ?,
              sjediste = ?, periodika = ?, predstavnik_korisnika = ?, napomena = ?
          WHERE id = ?
        `,
        [
          company.oib,
          next.name,
          next.contactName1,
          next.contactName2,
          next.contactName3,
          next.contactPhone1,
          next.contactPhone2,
          next.contactPhone3,
          next.contactEmail1,
          next.contactEmail2,
          next.contactEmail3,
          next.coordinates,
          next.region,
          activeLabel(next.isActive),
          "SelfDash Web",
          company.name,
          company.headquarters,
          next.period,
          next.representative,
          next.note,
          Number(id),
        ],
      );

      await replaceLocationContacts(connection, id, next.contacts);

      await connection.query(
        `
          UPDATE radni_nalozi
          SET lokacija = ?, koordinate = ?, regija = ?
          WHERE oib = ? AND lokacija = ?
        `,
        [
          next.name,
          next.coordinates,
          next.region,
          current.companyOib,
          current.name,
        ],
      );

      await connection.commit();
      return {
        ...next,
        companyOib: company.oib,
        companyName: company.name,
        headquarters: company.headquarters,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteLocation(id) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.locations.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return false;
      }

      const [[workOrderCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM radni_nalozi WHERE oib = ? AND lokacija = ?",
        [current.companyOib, current.name],
      );
      const [[reminderCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM web_reminders WHERE location_id = ?",
        [Number(id)],
      );
      const [[todoTaskCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM web_team_tasks WHERE location_id = ?",
        [Number(id)],
      );

      if (workOrderCount.total > 0 || reminderCount.total > 0 || todoTaskCount.total > 0) {
        await connection.rollback();
        throw new Error("Lokacija je vec povezana s radnim nalozima.");
      }

      await connection.query("DELETE FROM web_location_contacts WHERE location_id = ?", [Number(id)]);
      const [result] = await connection.query("DELETE FROM lokacije WHERE id = ?", [Number(id)]);
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async createWorkOrder(input, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createWorkOrder(input, snapshot, () => "pending", null);
      const year = Number((draft.openedDate ?? new Date().toISOString().slice(0, 10)).slice(0, 4));
      const brojRn = await allocateWorkOrderNumber(connection, year);

      const [result] = await connection.query(
        `
          INSERT INTO radni_nalozi
            (broj_rn, datum_rn, ime_tvrtke, sjediste, oib, veza_rn, lokacija, prioritet,
             kontakt_osoba, kontakt_broj, kontakt_email, rok_zavrsetka, izvrsitelj_rn1,
             izvrsitelj_rn2, tagovi, status_rn, napomena_faktura, godina_rn, redni_broj,
             odjel, koordinate, usluge, opis, regija, datum_fakturiranja, tezina, rn_zavrsio)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          brojRn,
          draft.openedDate,
          draft.companyName,
          draft.headquarters,
          draft.companyOib,
          draft.linkReference,
          draft.locationName,
          draft.priority,
          draft.contactName,
          draft.contactPhone,
          draft.contactEmail,
          draft.dueDate,
          draft.executor1,
          draft.executor2,
          draft.tagText,
          draft.status,
          draft.invoiceNote,
          year,
          Number(String(brojRn).split("-")[1]),
          draft.department,
          draft.coordinates,
          draft.serviceLine,
          draft.description,
          draft.region,
          draft.invoiceDate,
          parseNullableDecimal(draft.weight),
          draft.completedBy,
        ],
      );

      const workOrder = {
        ...draft,
        id: String(result.insertId),
        workOrderNumber: brojRn,
        year,
        ordinalNumber: Number(String(brojRn).split("-")[1]),
      };

      await syncLocationFromWorkOrder(connection, snapshot, workOrder);
      await insertWorkOrderActivityEntries(
        connection,
        result.insertId,
        actor,
        buildWorkOrderCreatedActivityEntries(workOrder),
      );
      await connection.commit();

      return workOrder;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateWorkOrder(id, patch, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.workOrders.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateWorkOrder(current, patch, snapshot);
      const activityEntries = buildWorkOrderUpdatedActivityEntries(current, next);

      await connection.query(
        `
          UPDATE radni_nalozi
          SET datum_rn = ?, ime_tvrtke = ?, sjediste = ?, oib = ?, veza_rn = ?, lokacija = ?,
              prioritet = ?, kontakt_osoba = ?, kontakt_broj = ?, kontakt_email = ?, rok_zavrsetka = ?,
              izvrsitelj_rn1 = ?, izvrsitelj_rn2 = ?, tagovi = ?, status_rn = ?, napomena_faktura = ?,
              odjel = ?, koordinate = ?, usluge = ?, opis = ?, regija = ?, datum_fakturiranja = ?,
              tezina = ?, rn_zavrsio = ?
          WHERE id = ?
        `,
        [
          next.openedDate,
          next.companyName,
          next.headquarters,
          next.companyOib,
          next.linkReference,
          next.locationName,
          next.priority,
          next.contactName,
          next.contactPhone,
          next.contactEmail,
          next.dueDate,
          next.executor1,
          next.executor2,
          next.tagText,
          next.status,
          next.invoiceNote,
          next.department,
          next.coordinates,
          next.serviceLine,
          next.description,
          next.region,
          next.invoiceDate,
          parseNullableDecimal(next.weight),
          next.completedBy,
          Number(id),
        ],
      );

      await syncLocationFromWorkOrder(connection, snapshot, next);
      await insertWorkOrderActivityEntries(connection, id, actor, activityEntries);
      await connection.commit();

      return next;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteWorkOrder(id) {
    const connection = await this.pool.getConnection();

    try {
      await connection.query(
        `
          UPDATE web_reminders
          SET work_order_id = NULL, location_id = NULL
          WHERE work_order_id = ?
        `,
        [Number(id)],
      );
      await connection.query(
        `
          UPDATE web_team_tasks
          SET work_order_id = NULL
          WHERE work_order_id = ?
        `,
        [Number(id)],
      );
      const [result] = await connection.query("DELETE FROM radni_nalozi WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async createReminder(input, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createReminder({
        ...input,
        createdByUserId: String(actor?.id ?? ""),
        createdByLabel: actor?.fullName || actor?.username || "Safety360",
      }, snapshot, () => "pending", () => new Date().toISOString());

      const [result] = await connection.query(
        `
          INSERT INTO web_reminders
            (organization_id, company_id, location_id, work_order_id, title, note, due_date,
             status, created_by_user_id, created_by_label, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          parseNullableInteger(draft.companyId),
          parseNullableInteger(draft.locationId),
          parseNullableInteger(draft.workOrderId),
          draft.title,
          draft.note,
          draft.dueDate,
          draft.status,
          parseNullableInteger(draft.createdByUserId),
          draft.createdByLabel,
          draft.completedAt ? new Date(draft.completedAt) : null,
        ],
      );

      await connection.commit();
      return {
        ...draft,
        id: String(result.insertId),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateReminder(id, patch, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.reminders.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateReminder(current, {
        ...patch,
        createdByUserId: current.createdByUserId || String(actor?.id ?? ""),
        createdByLabel: current.createdByLabel || actor?.fullName || actor?.username || "Safety360",
      }, snapshot, () => new Date().toISOString());

      await connection.query(
        `
          UPDATE web_reminders
          SET company_id = ?, location_id = ?, work_order_id = ?, title = ?, note = ?, due_date = ?,
              status = ?, completed_at = ?
          WHERE id = ?
        `,
        [
          parseNullableInteger(next.companyId),
          parseNullableInteger(next.locationId),
          parseNullableInteger(next.workOrderId),
          next.title,
          next.note,
          next.dueDate,
          next.status,
          next.completedAt ? new Date(next.completedAt) : null,
          Number(id),
        ],
      );

      await connection.commit();
      return next;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteReminder(id) {
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query("DELETE FROM web_reminders WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async createTodoTask(input, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createTodoTask({
        ...input,
        createdByUserId: String(actor?.id ?? input.createdByUserId ?? ""),
        createdByLabel: actor?.fullName || actor?.username || input.createdByLabel || "Safety360",
      }, snapshot, () => "pending", () => new Date().toISOString());

      const [result] = await connection.query(
        `
          INSERT INTO web_team_tasks
            (organization_id, company_id, location_id, work_order_id, title, message, status, priority,
             due_date, created_by_user_id, created_by_label, assigned_to_user_id, assigned_to_label, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          parseNullableInteger(draft.companyId),
          parseNullableInteger(draft.locationId),
          parseNullableInteger(draft.workOrderId),
          draft.title,
          draft.message,
          draft.status,
          draft.priority,
          draft.dueDate,
          parseNullableInteger(draft.createdByUserId),
          draft.createdByLabel,
          parseNullableInteger(draft.assignedToUserId),
          draft.assignedToLabel,
          draft.completedAt ? new Date(draft.completedAt) : null,
        ],
      );

      await connection.commit();
      return {
        ...draft,
        id: String(result.insertId),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateTodoTask(id, patch, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.todoTasks.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateTodoTask(current, {
        ...patch,
        createdByUserId: current.createdByUserId || String(actor?.id ?? ""),
        createdByLabel: current.createdByLabel || actor?.fullName || actor?.username || "Safety360",
      }, snapshot, () => new Date().toISOString());

      await connection.query(
        `
          UPDATE web_team_tasks
          SET company_id = ?, location_id = ?, work_order_id = ?, title = ?, message = ?, status = ?,
              priority = ?, due_date = ?, assigned_to_user_id = ?, assigned_to_label = ?, completed_at = ?
          WHERE id = ?
        `,
        [
          parseNullableInteger(next.companyId),
          parseNullableInteger(next.locationId),
          parseNullableInteger(next.workOrderId),
          next.title,
          next.message,
          next.status,
          next.priority,
          next.dueDate,
          parseNullableInteger(next.assignedToUserId),
          next.assignedToLabel,
          next.completedAt ? new Date(next.completedAt) : null,
          Number(id),
        ],
      );

      await connection.commit();
      return next;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async addTodoTaskComment(id, input, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.todoTasks.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = createTodoTaskComment(current, {
        ...input,
        userId: String(actor?.id ?? input.userId ?? ""),
        authorLabel: actor?.fullName || actor?.username || input.authorLabel || "Safety360",
      }, () => "pending-comment", () => new Date().toISOString());
      const latestComment = next.comments[next.comments.length - 1];

      await connection.query(
        `
          INSERT INTO web_team_task_comments
            (task_id, organization_id, user_id, author_label, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          Number(id),
          Number(current.organizationId),
          parseNullableInteger(latestComment.userId),
          latestComment.authorLabel,
          latestComment.message,
          latestComment.createdAt ? new Date(latestComment.createdAt) : new Date(),
        ],
      );

      await connection.query(
        `
          UPDATE web_team_tasks
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [Number(id)],
      );

      await connection.commit();
      return next;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteTodoTask(id) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM web_team_task_comments WHERE task_id = ?", [Number(id)]);
      const [result] = await connection.query("DELETE FROM web_team_tasks WHERE id = ?", [Number(id)]);
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async createDashboardWidget(input) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createDashboardWidget(input, snapshot, () => "pending-widget", () => new Date().toISOString());
      const [result] = await connection.query(
        `
          INSERT INTO web_dashboard_widgets
            (organization_id, user_id, title, widget_type, source_type, metric_key,
             size_key, limit_count, sort_order, grid_column, grid_row, grid_width, grid_height, filters_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          Number(draft.userId),
          draft.title,
          draft.visualization,
          draft.source,
          draft.metricKey,
          draft.size,
          Number(draft.limit),
          Number(draft.position),
          Number(draft.gridColumn),
          Number(draft.gridRow),
          Number(draft.gridWidth),
          Number(draft.gridHeight),
          JSON.stringify(draft.filters ?? {}),
        ],
      );

      await connection.commit();
      return {
        ...draft,
        id: String(result.insertId),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateDashboardWidget(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.dashboardWidgets.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateDashboardWidget(current, patch, snapshot, () => new Date().toISOString());

      await connection.query(
        `
          UPDATE web_dashboard_widgets
          SET title = ?, widget_type = ?, source_type = ?, metric_key = ?, size_key = ?,
              limit_count = ?, sort_order = ?, grid_column = ?, grid_row = ?, grid_width = ?, grid_height = ?,
              filters_json = ?
          WHERE id = ?
        `,
        [
          next.title,
          next.visualization,
          next.source,
          next.metricKey,
          next.size,
          Number(next.limit),
          Number(next.position),
          Number(next.gridColumn),
          Number(next.gridRow),
          Number(next.gridWidth),
          Number(next.gridHeight),
          JSON.stringify(next.filters ?? {}),
          Number(id),
        ],
      );

      await connection.commit();
      return next;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteDashboardWidget(id) {
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query("DELETE FROM web_dashboard_widgets WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async getWorkOrderActivity(id) {
    const connection = await this.pool.getConnection();

    try {
      const [rows] = await connection.query(
        `
          SELECT id, work_order_id, actor_user_id, actor_label, action_type, field_key,
                 field_label, old_value, new_value, description, created_at
          FROM web_work_order_activity_logs
          WHERE work_order_id = ?
          ORDER BY created_at DESC, id DESC
          LIMIT 200
        `,
        [Number(id)],
      );

      return rows.map((row) => mapWorkOrderActivityRow(row));
    } finally {
      connection.release();
    }
  }
}

export async function createSafetyRepository() {
  const kind = getDatabaseKind();

  if (kind === "mysql") {
    const repository = new MySqlSafetyRepository(process.env.DATABASE_URL);
    await repository.init();
    return repository;
  }

  const repository = new InMemorySafetyRepository();
  await repository.init();
  return repository;
}
