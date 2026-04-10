import mysql from "mysql2/promise";

import {
  applyDashboardWidgetGridLayout,
  buildLocationContacts,
  createCompany,
  createDashboardWidget,
  createDocumentTemplate,
  createLearningTest,
  createLegalFramework,
  createLocation,
  createMeasurementEquipmentItem,
  createOffer,
  createReminder,
  createSafetyAuthorization,
  createServiceCatalogItem,
  createTodoTask,
  createTodoTaskComment,
  createVehicle,
  createVehicleReservation,
  createWorkOrder,
  deleteVehicleReservation,
  deriveOfferInitials,
  normalizeWorkOrderMeasurementSheet,
  getWorkOrderExecutors,
  getWorkOrderServiceItems,
  nextOfferNumber,
  sortVehicleReservations,
  syncLocationFieldsFromWorkOrder,
  updateCompany,
  updateDashboardWidget,
  updateDocumentTemplate,
  updateLearningTest,
  updateLegalFramework,
  updateLocation,
  updateMeasurementEquipmentItem,
  updateOffer,
  updateReminder,
  updateSafetyAuthorization,
  updateServiceCatalogItem,
  updateTodoTask,
  updateVehicle,
  updateVehicleReservation,
  updateWorkOrder,
} from "./safetyModel.js";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  createPasswordHash,
  hashStoredToken,
  verifyPassword,
} from "./webAuth.js";
import {
  buildObjectStoragePublicUrl,
  deleteObjectFromStorage,
  getObjectStorageConfig,
  uploadDataUrlToObjectStorage,
} from "./objectStorage.js";

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

  return "memory";
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

function parseJsonArray(value, fallback = []) {
  const raw = dbString(value);

  if (!raw) {
    return [...fallback];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}

function cloneJsonValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function cloneLearningTest(test = {}) {
  return {
    ...test,
    handbookDocuments: cloneJsonValue(test.handbookDocuments ?? []),
    videoItems: cloneJsonValue(test.videoItems ?? []),
    questionItems: cloneJsonValue(test.questionItems ?? []),
    assignmentItems: cloneJsonValue(test.assignmentItems ?? []),
    attemptItems: cloneJsonValue(test.attemptItems ?? []),
  };
}

function sanitizeLearningTestAccess(test = {}, assignment = {}) {
  return {
    test: {
      id: String(test.id ?? ""),
      title: String(test.title ?? ""),
      description: String(test.description ?? ""),
      handbookDocuments: cloneJsonValue(test.handbookDocuments ?? []),
      videoItems: cloneJsonValue(test.videoItems ?? []),
      questionItems: (test.questionItems ?? []).map((question) => ({
        ...cloneJsonValue(question),
        options: (question.options ?? []).map((option) => ({
          id: String(option.id ?? ""),
          text: String(option.text ?? ""),
        })),
      })),
    },
    assignment: {
      id: String(assignment.id ?? ""),
      userId: String(assignment.userId ?? ""),
      userLabel: String(assignment.userLabel ?? ""),
      email: String(assignment.email ?? ""),
      status: String(assignment.status ?? "pending"),
      assignedAt: normalizeTimestamp(assignment.assignedAt),
      startedAt: normalizeTimestamp(assignment.startedAt),
      completedAt: normalizeTimestamp(assignment.completedAt),
      scorePercent: Number(assignment.scorePercent ?? 0) || 0,
      accessToken: String(assignment.accessToken ?? ""),
    },
  };
}

function normalizeLearningAnswerSnapshot(answers = []) {
  return (Array.isArray(answers) ? answers : []).map((answer) => ({
    questionId: dbString(answer?.questionId),
    optionId: dbString(answer?.optionId),
  })).filter((answer) => answer.questionId);
}

function scoreLearningTestSubmission(test = {}, answers = []) {
  const answerMap = new Map(
    normalizeLearningAnswerSnapshot(answers)
      .filter((answer) => answer.optionId)
      .map((answer) => [String(answer.questionId), String(answer.optionId)]),
  );
  const questions = Array.isArray(test.questionItems) ? test.questionItems : [];
  const totalQuestions = questions.length;

  if (totalQuestions === 0) {
    return {
      answers: [],
      scorePercent: 0,
    };
  }

  let correctCount = 0;
  const normalizedAnswers = questions.map((question) => {
    const selectedOptionId = answerMap.get(String(question.id || "")) || "";
    const correctOption = (question.options ?? []).find((option) => option.isCorrect);
    const isCorrect = Boolean(correctOption?.id) && String(correctOption.id) === selectedOptionId;
    if (isCorrect) {
      correctCount += 1;
    }
    return {
      questionId: String(question.id ?? ""),
      optionId: selectedOptionId,
      isCorrect,
    };
  });

  return {
    answers: normalizedAnswers,
    scorePercent: Math.round((correctCount / totalQuestions) * 100),
  };
}

function buildLearningAssignmentAccessUrl(accessToken = "") {
  const safeToken = dbString(accessToken);

  if (!safeToken) {
    return "";
  }

  const publicBase = dbString(process.env.PUBLIC_APP_URL) || dbString(process.env.APP_URL) || "";
  if (!publicBase) {
    return `/learning-test.html?token=${encodeURIComponent(safeToken)}`;
  }

  return `${publicBase.replace(/\/$/, "")}/learning-test.html?token=${encodeURIComponent(safeToken)}`;
}

async function prepareStoredLearningTestAssets(test = {}, currentTest = null) {
  const organizationId = dbString(test.organizationId) || dbString(currentTest?.organizationId) || "shared";
  const preparedHandbook = await prepareStoredAttachmentDocuments(test.handbookDocuments, {
    keyPrefix: `learning-tests/${organizationId}/handbook`,
    currentDocuments: currentTest?.handbookDocuments ?? [],
  });
  const staleDocuments = [...(preparedHandbook.staleDocuments ?? [])];
  const currentQuestionMap = new Map(
    (currentTest?.questionItems ?? []).map((question) => [String(question.id ?? ""), question]),
  );
  const preparedQuestions = [];

  for (const question of Array.isArray(test.questionItems) ? test.questionItems : []) {
    const currentQuestion = currentQuestionMap.get(String(question.id ?? "")) ?? null;
    const preparedImage = await prepareStoredAttachmentDocuments(
      question?.imageDocument ? [question.imageDocument] : [],
      {
        keyPrefix: `learning-tests/${organizationId}/question-images`,
        currentDocuments: currentQuestion?.imageDocument ? [currentQuestion.imageDocument] : [],
      },
    );
    staleDocuments.push(...(preparedImage.staleDocuments ?? []));
    preparedQuestions.push({
      ...question,
      imageDocument: preparedImage.nextDocuments[0] ?? null,
    });
  }

  return {
    handbookDocuments: preparedHandbook.nextDocuments ?? [],
    questionItems: preparedQuestions,
    staleDocuments,
  };
}

function normalizeDocumentRecordFieldValues(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : parseJsonObject(value, {});

  return Object.fromEntries(
    Object.entries(source)
      .map(([key, entryValue]) => {
        const normalizedKey = dbString(key);

        if (!normalizedKey || entryValue === undefined) {
          return null;
        }

        if (typeof entryValue === "string") {
          return dbString(entryValue)
            ? [normalizedKey, entryValue]
            : null;
        }

        if (Array.isArray(entryValue)) {
          return entryValue.length > 0
            ? [normalizedKey, cloneJsonValue(entryValue)]
            : null;
        }

        if (entryValue && typeof entryValue === "object") {
          return [normalizedKey, cloneJsonValue(entryValue)];
        }

        if (typeof entryValue === "boolean" || Number.isFinite(entryValue)) {
          return [normalizedKey, entryValue];
        }

        const fallbackValue = dbString(entryValue);
        return fallbackValue ? [normalizedKey, fallbackValue] : null;
      })
      .filter(Boolean),
  );
}

function normalizeDocumentRecordFieldSheets(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : parseJsonObject(value, {});

  return Object.fromEntries(
    Object.entries(source)
      .map(([key, snapshot]) => {
        const normalizedKey = dbString(key);
        const normalizedSnapshot = normalizeWorkOrderMeasurementSheet(snapshot);

        if (!normalizedKey || !normalizedSnapshot) {
          return null;
        }

        return [normalizedKey, normalizedSnapshot];
      })
      .filter(Boolean),
  );
}

function cloneDocumentRecord(record = {}) {
  return {
    ...record,
    fieldValues: normalizeDocumentRecordFieldValues(record.fieldValues),
    fieldSheets: normalizeDocumentRecordFieldSheets(record.fieldSheets),
  };
}

function createDocumentRecordEntry(input = {}, actor = null, createId = () => crypto.randomUUID(), now = () => new Date().toISOString()) {
  const timestamp = normalizeTimestamp(now()) ?? new Date().toISOString();

  return {
    id: dbString(input.id) || createId(),
    organizationId: dbString(input.organizationId),
    templateId: dbString(input.templateId),
    templateTitle: dbString(input.templateTitle),
    documentType: dbString(input.documentType) || "Zapisnik",
    companyId: dbString(input.companyId),
    locationId: dbString(input.locationId),
    inspectionDate: normalizeDateOnly(input.inspectionDate),
    issuedDate: normalizeDateOnly(input.issuedDate),
    fieldValues: normalizeDocumentRecordFieldValues(input.fieldValues),
    fieldSheets: normalizeDocumentRecordFieldSheets(input.fieldSheets),
    createdByUserId: dbString(input.createdByUserId || actor?.id),
    createdByLabel: dbString(input.createdByLabel || actor?.fullName || actor?.username || "Safety360"),
    createdAt: normalizeTimestamp(input.createdAt) ?? timestamp,
    updatedAt: normalizeTimestamp(input.updatedAt) ?? timestamp,
  };
}

function mapDocumentRecordRow(row = {}) {
  return createDocumentRecordEntry({
    id: row.id,
    organizationId: row.organization_id ?? row.organizationId,
    templateId: row.template_id ?? row.templateId,
    templateTitle: row.template_title ?? row.templateTitle,
    documentType: row.document_type ?? row.documentType,
    companyId: row.company_id ?? row.companyId,
    locationId: row.location_id ?? row.locationId,
    inspectionDate: row.inspection_date ?? row.inspectionDate,
    issuedDate: row.issued_date ?? row.issuedDate,
    fieldValues: row.values_json ?? row.fieldValues,
    fieldSheets: row.measurement_sheets_json ?? row.fieldSheets,
    createdByUserId: row.created_by_user_id ?? row.createdByUserId,
    createdByLabel: row.created_by_label ?? row.createdByLabel,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  });
}

function cloneMeasurementSheetPreset(record = {}) {
  return {
    ...record,
    sheet: normalizeWorkOrderMeasurementSheet(record.sheet),
  };
}

function createMeasurementSheetPresetEntry(input = {}, actor = null, createId = () => crypto.randomUUID(), now = () => new Date().toISOString()) {
  const timestamp = normalizeTimestamp(now()) ?? new Date().toISOString();

  return {
    id: dbString(input.id) || createId(),
    organizationId: dbString(input.organizationId),
    templateId: dbString(input.templateId),
    companyId: dbString(input.companyId),
    locationId: dbString(input.locationId),
    fieldKey: dbString(input.fieldKey),
    title: dbString(input.title) || "Excel tablica",
    sheet: normalizeWorkOrderMeasurementSheet(input.sheet),
    createdByUserId: dbString(input.createdByUserId || actor?.id),
    createdByLabel: dbString(input.createdByLabel || actor?.fullName || actor?.username || "Safety360"),
    createdAt: normalizeTimestamp(input.createdAt) ?? timestamp,
    updatedAt: normalizeTimestamp(input.updatedAt) ?? timestamp,
  };
}

function mapMeasurementSheetPresetRow(row = {}) {
  return createMeasurementSheetPresetEntry({
    id: row.id,
    organizationId: row.organization_id ?? row.organizationId,
    templateId: row.template_id ?? row.templateId,
    companyId: row.company_id ?? row.companyId,
    locationId: row.location_id ?? row.locationId,
    fieldKey: row.field_key ?? row.fieldKey,
    title: row.title,
    sheet: row.sheet_json ?? row.sheet,
    createdByUserId: row.created_by_user_id ?? row.createdByUserId,
    createdByLabel: row.created_by_label ?? row.createdByLabel,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  });
}

function isDataUrlLike(value = "") {
  return dbString(value).startsWith("data:");
}

function mapStoredDocumentLocation({
  dataUrl = "",
  storageProvider = "",
  storageBucket = "",
  storageKey = "",
  storageUrl = "",
} = {}) {
  const normalizedStorageUrl = dbString(storageUrl);
  const normalizedStorageKey = dbString(storageKey);
  const normalizedStorageBucket = dbString(storageBucket);
  const normalizedStorageProvider = dbString(storageProvider);
  const normalizedDataUrl = dbString(dataUrl);

  return {
    dataUrl: normalizedStorageUrl || normalizedDataUrl,
    storageProvider: normalizedStorageProvider,
    storageBucket: normalizedStorageBucket,
    storageKey: normalizedStorageKey,
    storageUrl: normalizedStorageUrl || (
      normalizedStorageProvider && normalizedStorageKey
        ? buildObjectStoragePublicUrl(normalizedStorageKey, {
          ...getObjectStorageConfig(),
          bucket: normalizedStorageBucket || getObjectStorageConfig().bucket,
        })
        : ""
    ),
  };
}

async function persistInlineDocumentToObjectStorage({
  keyPrefix = "",
  fileName = "",
  fileType = "",
  dataUrl = "",
} = {}) {
  if (!isDataUrlLike(dataUrl)) {
    return null;
  }

  return uploadDataUrlToObjectStorage({
    keyPrefix,
    fileName,
    fileType,
    dataUrl,
    cacheControl: "public, max-age=31536000, immutable",
  });
}

async function cleanupStoredObjects(items = []) {
  const uniqueKeys = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const key = dbString(item?.storageKey ?? item?.key);

    if (!key || uniqueKeys.has(key)) {
      continue;
    }

    uniqueKeys.add(key);
    await deleteObjectFromStorage(item);
  }
}

async function persistInlineCompanyLogoToObjectStorage({
  companyId = "",
  companyName = "",
  logoDataUrl = "",
} = {}) {
  if (!isDataUrlLike(logoDataUrl)) {
    return null;
  }

  return uploadDataUrlToObjectStorage({
    keyPrefix: `companies/${dbString(companyId) || "pending"}/logo`,
    fileName: dbString(companyName) || "company-logo",
    dataUrl: logoDataUrl,
    cacheControl: "public, max-age=31536000, immutable",
  });
}

async function prepareStoredCompanyLogo({
  currentCompany = {},
  companyId = "",
  companyName = "",
  logoDataUrl = "",
} = {}) {
  const currentStoredLogo = mapStoredDocumentLocation({
    dataUrl: currentCompany.logoDataUrl ?? currentCompany.logo_data_url,
    storageProvider: currentCompany.logoStorageProvider ?? currentCompany.logo_storage_provider,
    storageBucket: currentCompany.logoStorageBucket ?? currentCompany.logo_storage_bucket,
    storageKey: currentCompany.logoStorageKey ?? currentCompany.logo_storage_key,
    storageUrl: currentCompany.logoStorageUrl ?? currentCompany.logo_storage_url,
  });
  const nextLogoDataUrl = dbString(logoDataUrl);

  if (!nextLogoDataUrl) {
    return {
      storedLogo: mapStoredDocumentLocation(),
      previousStoredLogo: currentStoredLogo.storageKey ? currentStoredLogo : null,
    };
  }

  if (!isDataUrlLike(nextLogoDataUrl)) {
    if (nextLogoDataUrl === currentStoredLogo.dataUrl) {
      return {
        storedLogo: currentStoredLogo,
        previousStoredLogo: null,
      };
    }

    return {
      storedLogo: mapStoredDocumentLocation({ dataUrl: nextLogoDataUrl }),
      previousStoredLogo: currentStoredLogo.storageKey ? currentStoredLogo : null,
    };
  }

  const uploaded = await persistInlineCompanyLogoToObjectStorage({
    companyId,
    companyName,
    logoDataUrl: nextLogoDataUrl,
  });

  return {
    storedLogo: mapStoredDocumentLocation({
      dataUrl: uploaded?.storageUrl || nextLogoDataUrl,
      storageProvider: uploaded?.storageProvider,
      storageBucket: uploaded?.storageBucket,
      storageKey: uploaded?.storageKey,
      storageUrl: uploaded?.storageUrl,
    }),
    previousStoredLogo: currentStoredLogo.storageKey ? currentStoredLogo : null,
  };
}

async function migrateInlineCompanyLogosToObjectStorage(pool) {
  if (!getObjectStorageConfig().enabled) {
    return;
  }

  const [rows] = await pool.query(`
    SELECT id, naziv_tvrtke, logo_data_url
    FROM firme
    WHERE logo_data_url IS NOT NULL
      AND logo_data_url LIKE 'data:%'
  `);

  for (const row of rows) {
    const uploaded = await persistInlineCompanyLogoToObjectStorage({
      companyId: row.id,
      companyName: row.naziv_tvrtke,
      logoDataUrl: row.logo_data_url,
    });

    if (!uploaded?.storageUrl) {
      continue;
    }

    await pool.query(
      `
        UPDATE firme
        SET logo_data_url = ?,
            logo_storage_provider = ?,
            logo_storage_bucket = ?,
            logo_storage_key = ?,
            logo_storage_url = ?
        WHERE id = ?
      `,
      [
        uploaded.storageUrl,
        uploaded.storageProvider,
        uploaded.storageBucket,
        uploaded.storageKey,
        uploaded.storageUrl,
        Number(row.id),
      ],
    );
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
  teamLabel: "Tim",
  companyName: "Tvrtka",
  headquarters: "Sjedište",
  companyOib: "OIB",
  locationName: "Lokacija",
  region: "Regija",
  coordinates: "Koordinate",
  contactName: "Kontakt osoba",
  contactPhone: "Kontakt broj",
  contactEmail: "Kontakt email",
  executors: "Izvršitelji",
  serviceItems: "Stavke usluge",
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
  if (fieldKey === "executors") {
    return getWorkOrderExecutors({ executors: value }).join(", ");
  }

  if (fieldKey === "serviceItems") {
    return getWorkOrderServiceItems({ serviceItems: value })
      .map((item) => `${item.isCompleted ? "✓" : "✕"} ${item.name || item.serviceCode}`)
      .join(", ");
  }

  if (fieldKey === "openedDate" || fieldKey === "dueDate" || fieldKey === "invoiceDate") {
    return formatDateOnlyDisplay(value);
  }

  return dbString(value);
}

function areWorkOrderActivityValuesEqual(fieldKey, left, right) {
  if (fieldKey === "executors") {
    const leftValues = getWorkOrderExecutors({ executors: left });
    const rightValues = getWorkOrderExecutors({ executors: right });

    if (leftValues.length !== rightValues.length) {
      return false;
    }

    return leftValues.every((value, index) => value === rightValues[index]);
  }

  if (fieldKey === "serviceItems") {
    const leftItems = getWorkOrderServiceItems({ serviceItems: left });
    const rightItems = getWorkOrderServiceItems({ serviceItems: right });

    if (leftItems.length !== rightItems.length) {
      return false;
    }

    return leftItems.every((item, index) => (
      String(item.serviceId) === String(rightItems[index]?.serviceId)
      && String(item.name) === String(rightItems[index]?.name)
      && String(item.serviceCode) === String(rightItems[index]?.serviceCode)
      && Boolean(item.isCompleted) === Boolean(rightItems[index]?.isCompleted)
    ));
  }

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
        : `${fieldLabel} ažuriran`,
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

function normalizeWorkOrderDocumentSource(value) {
  return value === "activity" ? "activity" : "editor";
}

function inferWorkOrderDocumentExtension(fileName = "", fileType = "") {
  const normalizedName = dbString(fileName);
  const fromName = normalizedName.includes(".")
    ? normalizedName.split(".").pop().toLowerCase()
    : "";

  if (fromName) {
    return fromName.slice(0, 24);
  }

  const normalizedType = dbString(fileType).toLowerCase();
  const fromType = normalizedType.includes("/")
    ? normalizedType.split("/").pop().replace(/[^a-z0-9]+/g, "")
    : normalizedType.replace(/[^a-z0-9]+/g, "");

  return fromType.slice(0, 24);
}

function normalizeWorkOrderDocumentInput(input = {}, defaultSourceType = "editor") {
  const fileName = dbString(input.fileName ?? input.name);
  const dataUrl = dbString(input.dataUrl);

  if (!fileName) {
    throw new Error("Naziv dokumenta je obavezan.");
  }

  if (!dataUrl || !dataUrl.startsWith("data:")) {
    throw new Error("Dokument nije ispravno ucitan.");
  }

  const numericSize = Number(input.fileSize ?? input.size);
  const fileSize = Number.isFinite(numericSize) && numericSize >= 0 ? Math.round(numericSize) : 0;
  const fileType = dbString(input.fileType ?? input.mimeType).slice(0, 160);
  const sourceType = normalizeWorkOrderDocumentSource(input.sourceType ?? defaultSourceType);

  return {
    fileName: fileName.slice(0, 255),
    fileType,
    fileExtension: inferWorkOrderDocumentExtension(fileName, fileType),
    description: dbString(input.description),
    fileSize,
    dataUrl,
    sourceType,
  };
}

function normalizeWorkOrderDocumentPatch(input = {}) {
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(input, "fileName") || Object.prototype.hasOwnProperty.call(input, "name")) {
    const fileName = dbString(input.fileName ?? input.name);

    if (!fileName) {
      throw new Error("Naziv dokumenta je obavezan.");
    }

    patch.fileName = fileName.slice(0, 255);
    patch.fileExtension = inferWorkOrderDocumentExtension(patch.fileName, input.fileType ?? input.mimeType ?? "");
  }

  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    patch.description = dbString(input.description);
  }

  return patch;
}

function buildWorkOrderDocumentActivityEntries(documents = []) {
  return documents.map((document) => ({
    actionType: "attachment_added",
    fieldKey: "document",
    fieldLabel: "Dokument",
    oldValue: "",
    newValue: document.fileName,
    description: `Dodan dokument ${document.fileName}`,
  }));
}

function buildWorkOrderDocumentUpdatedActivityEntries(current, next) {
  const entries = [];

  if (dbString(current.fileName) !== dbString(next.fileName)) {
    entries.push({
      actionType: "attachment_updated",
      fieldKey: "document",
      fieldLabel: "Dokument",
      oldValue: current.fileName,
      newValue: next.fileName,
      description: `Naziv dokumenta ažuriran u ${next.fileName}`,
    });
  }

  if (dbString(current.description) !== dbString(next.description)) {
    entries.push({
      actionType: "attachment_updated",
      fieldKey: "document_description",
      fieldLabel: "Opis dokumenta",
      oldValue: current.description,
      newValue: next.description,
      description: next.description
        ? `Opis dokumenta ažuriran za ${next.fileName}`
        : `Opis dokumenta uklonjen za ${next.fileName}`,
    });
  }

  return entries;
}

function buildWorkOrderDocumentDeletedActivityEntries(document) {
  return [{
    actionType: "attachment_deleted",
    fieldKey: "document",
    fieldLabel: "Dokument",
    oldValue: document.fileName,
    newValue: "",
    description: `Maknut dokument ${document.fileName}`,
  }];
}

async function prepareStoredWorkOrderDocument(normalizedDocument, workOrderId) {
  const uploaded = await persistInlineDocumentToObjectStorage({
    keyPrefix: `work-orders/${dbString(workOrderId)}/${normalizeWorkOrderDocumentSource(normalizedDocument.sourceType)}`,
    fileName: normalizedDocument.fileName,
    fileType: normalizedDocument.fileType,
    dataUrl: normalizedDocument.dataUrl,
  });

  return {
    ...normalizedDocument,
    dataUrl: uploaded?.storageUrl || normalizedDocument.dataUrl,
    storageProvider: uploaded?.storageProvider ?? "",
    storageBucket: uploaded?.storageBucket ?? "",
    storageKey: uploaded?.storageKey ?? "",
    storageUrl: uploaded?.storageUrl ?? "",
    inlineDataUrl: uploaded?.storageUrl ? "" : normalizedDocument.dataUrl,
  };
}

async function prepareStoredReferenceDocument(referenceDocument, {
  organizationId = "",
  currentReferenceDocument = null,
} = {}) {
  if (!referenceDocument) {
    return {
      nextReferenceDocument: null,
      staleReferenceDocument: currentReferenceDocument?.storageKey ? currentReferenceDocument : null,
    };
  }

  const normalizedCurrentUrl = dbString(currentReferenceDocument?.dataUrl);
  const normalizedNextUrl = dbString(referenceDocument.dataUrl);
  const matchesCurrent = currentReferenceDocument
    && dbString(currentReferenceDocument.fileName) === dbString(referenceDocument.fileName)
    && dbString(currentReferenceDocument.fileType) === dbString(referenceDocument.fileType)
    && normalizedCurrentUrl === normalizedNextUrl;

  if (matchesCurrent) {
    return {
      nextReferenceDocument: {
        ...referenceDocument,
        storageProvider: currentReferenceDocument.storageProvider ?? "",
        storageBucket: currentReferenceDocument.storageBucket ?? "",
        storageKey: currentReferenceDocument.storageKey ?? "",
        storageUrl: currentReferenceDocument.storageUrl ?? "",
        inlineDataUrl: currentReferenceDocument.storageKey ? "" : normalizedNextUrl,
      },
      staleReferenceDocument: null,
    };
  }

  const uploaded = await persistInlineDocumentToObjectStorage({
    keyPrefix: `document-templates/${dbString(organizationId) || "shared"}/reference`,
    fileName: referenceDocument.fileName,
    fileType: referenceDocument.fileType,
    dataUrl: normalizedNextUrl,
  });

  return {
    nextReferenceDocument: {
      ...referenceDocument,
      dataUrl: uploaded?.storageUrl || normalizedNextUrl,
      storageProvider: uploaded?.storageProvider ?? "",
      storageBucket: uploaded?.storageBucket ?? "",
      storageKey: uploaded?.storageKey ?? "",
      storageUrl: uploaded?.storageUrl ?? "",
      inlineDataUrl: uploaded?.storageUrl ? "" : normalizedNextUrl,
    },
    staleReferenceDocument: currentReferenceDocument?.storageKey ? currentReferenceDocument : null,
  };
}

function mapStoredAttachmentDocument(document = {}) {
  const storedDocument = mapStoredDocumentLocation({
    dataUrl: document.dataUrl ?? document.url ?? "",
    storageProvider: document.storageProvider ?? "",
    storageBucket: document.storageBucket ?? "",
    storageKey: document.storageKey ?? "",
    storageUrl: document.storageUrl ?? document.url ?? "",
  });

  return {
    id: dbString(document.id),
    fileName: dbString(document.fileName ?? document.name),
    fileType: dbString(document.fileType ?? document.mimeType),
    fileSize: Number(document.fileSize ?? document.size ?? 0) || 0,
    documentCategory: dbString(document.documentCategory ?? document.category),
    description: dbString(document.description),
    dataUrl: storedDocument.dataUrl,
    storageProvider: storedDocument.storageProvider,
    storageBucket: storedDocument.storageBucket,
    storageKey: storedDocument.storageKey,
    storageUrl: storedDocument.storageUrl,
    createdAt: normalizeTimestamp(document.createdAt),
    updatedAt: normalizeTimestamp(document.updatedAt),
  };
}

async function prepareStoredAttachmentDocuments(documents = [], {
  keyPrefix = "",
  currentDocuments = [],
} = {}) {
  const currentById = new Map(
    (currentDocuments ?? [])
      .map((document) => mapStoredAttachmentDocument(document))
      .filter((document) => document.id)
      .map((document) => [String(document.id), document]),
  );
  const nextDocuments = [];
  const retainedIds = new Set();
  const staleDocuments = [];

  for (const rawDocument of Array.isArray(documents) ? documents : []) {
    const document = mapStoredAttachmentDocument(rawDocument);

    if (!document.fileName || !document.dataUrl) {
      continue;
    }

    const currentDocument = document.id ? currentById.get(String(document.id)) : null;
    if (currentDocument?.id) {
      retainedIds.add(String(currentDocument.id));
    }

    const currentUrl = dbString(currentDocument?.dataUrl);
    const nextUrl = dbString(document.dataUrl);
    const matchesCurrent = currentDocument
      && dbString(currentDocument.fileName) === document.fileName
      && dbString(currentDocument.fileType) === document.fileType
      && currentUrl === nextUrl;

    if (matchesCurrent) {
      nextDocuments.push({
        ...document,
        storageProvider: currentDocument.storageProvider ?? "",
        storageBucket: currentDocument.storageBucket ?? "",
        storageKey: currentDocument.storageKey ?? "",
        storageUrl: currentDocument.storageUrl ?? "",
        dataUrl: currentDocument.dataUrl || document.dataUrl,
        createdAt: document.createdAt || currentDocument.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      continue;
    }

    const uploaded = await persistInlineDocumentToObjectStorage({
      keyPrefix,
      fileName: document.fileName,
      fileType: document.fileType,
      dataUrl: document.dataUrl,
    });

    nextDocuments.push({
      ...document,
      dataUrl: uploaded?.storageUrl || document.dataUrl,
      storageProvider: uploaded?.storageProvider ?? document.storageProvider ?? "",
      storageBucket: uploaded?.storageBucket ?? document.storageBucket ?? "",
      storageKey: uploaded?.storageKey ?? document.storageKey ?? "",
      storageUrl: uploaded?.storageUrl ?? document.storageUrl ?? document.dataUrl,
      createdAt: document.createdAt || currentDocument?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (currentDocument?.storageKey) {
      staleDocuments.push(currentDocument);
    }
  }

  for (const currentDocument of currentById.values()) {
    if (!retainedIds.has(String(currentDocument.id)) && currentDocument.storageKey) {
      staleDocuments.push(currentDocument);
    }
  }

  return {
    nextDocuments,
    staleDocuments,
  };
}

function buildLegalFrameworkLinkedTemplateIds(snapshot, legalFrameworkId) {
  return (snapshot.documentTemplates ?? [])
    .filter((template) => (template.selectedLegalFrameworkIds ?? []).some((entryId) => String(entryId) === String(legalFrameworkId)))
    .map((template) => String(template.id))
    .filter(Boolean);
}

function syncLegalFrameworkTemplatesInSnapshot(snapshot, legalFrameworkId, linkedTemplateIds = [], nowValue = new Date().toISOString()) {
  const selectedTemplateIds = new Set((linkedTemplateIds ?? []).map((value) => String(value)).filter(Boolean));

  snapshot.documentTemplates = (snapshot.documentTemplates ?? []).map((template) => {
    const currentIds = Array.isArray(template.selectedLegalFrameworkIds)
      ? template.selectedLegalFrameworkIds.map((value) => String(value)).filter(Boolean)
      : [];
    const hasLegalFramework = currentIds.some((entryId) => String(entryId) === String(legalFrameworkId));
    const shouldHaveLegalFramework = selectedTemplateIds.has(String(template.id));

    if (hasLegalFramework === shouldHaveLegalFramework) {
      return template;
    }

    const nextIds = shouldHaveLegalFramework
      ? [...currentIds, String(legalFrameworkId)]
      : currentIds.filter((entryId) => String(entryId) !== String(legalFrameworkId));

    return {
      ...template,
      selectedLegalFrameworkIds: Array.from(new Set(nextIds)),
      updatedAt: nowValue,
    };
  });
}

async function syncLegalFrameworkTemplatesInDatabase(connection, {
  organizationId = "",
  legalFrameworkId = "",
  linkedTemplateIds = [],
} = {}) {
  const selectedTemplateIds = new Set((linkedTemplateIds ?? []).map((value) => String(value)).filter(Boolean));
  const [rows] = await connection.query(
    `
      SELECT id, selected_legal_framework_ids_json
      FROM web_document_templates
      WHERE organization_id = ?
    `,
    [Number(organizationId)],
  );

  for (const row of rows) {
    const currentIds = parseJsonArray(row.selected_legal_framework_ids_json).map((entry) => dbString(entry)).filter(Boolean);
    const hasLegalFramework = currentIds.some((entryId) => String(entryId) === String(legalFrameworkId));
    const shouldHaveLegalFramework = selectedTemplateIds.has(String(row.id));

    if (hasLegalFramework === shouldHaveLegalFramework) {
      continue;
    }

    const nextIds = shouldHaveLegalFramework
      ? [...currentIds, String(legalFrameworkId)]
      : currentIds.filter((entryId) => String(entryId) !== String(legalFrameworkId));

    await connection.query(
      `
        UPDATE web_document_templates
        SET selected_legal_framework_ids_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [JSON.stringify(Array.from(new Set(nextIds))), Number(row.id)],
    );
  }
}

function mapWorkOrderDocumentRow(row) {
  const storedDocument = mapStoredDocumentLocation({
    dataUrl: row.data_url ?? row.dataUrl ?? "",
    storageProvider: row.storage_provider ?? row.storageProvider ?? "",
    storageBucket: row.storage_bucket ?? row.storageBucket ?? "",
    storageKey: row.storage_key ?? row.storageKey ?? "",
    storageUrl: row.storage_url ?? row.storageUrl ?? "",
  });

  return {
    id: String(row.id),
    workOrderId: String(row.work_order_id ?? row.workOrderId ?? ""),
    actorLabel: row.actor_label ?? row.actorLabel ?? "Safety360",
    actorUserId: row.actor_user_id === null || row.actor_user_id === undefined
      ? ""
      : String(row.actor_user_id),
    sourceType: normalizeWorkOrderDocumentSource(row.source_type ?? row.sourceType),
    fileName: row.file_name ?? row.fileName ?? "",
    fileExtension: row.file_extension ?? row.fileExtension ?? "",
    fileType: row.file_type ?? row.fileType ?? "",
    description: row.file_description ?? row.description ?? "",
    fileSize: Number(row.file_size ?? row.fileSize ?? 0) || 0,
    dataUrl: storedDocument.dataUrl,
    storageProvider: storedDocument.storageProvider,
    storageBucket: storedDocument.storageBucket,
    storageKey: storedDocument.storageKey,
    storageUrl: storedDocument.storageUrl,
    createdAt: normalizeActivityTimestamp(row.created_at ?? row.createdAt),
    updatedAt: normalizeActivityTimestamp(row.updated_at ?? row.updatedAt ?? row.created_at ?? row.createdAt),
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
           logo_data_url, logo_storage_provider, logo_storage_bucket, logo_storage_key, logo_storage_url,
           datum_izmjene, izmjenu_unio
    FROM firme
    ORDER BY naziv_tvrtke ASC
  `);

  const companies = companyRows.map((row) => {
    const storedLogo = mapStoredDocumentLocation({
      dataUrl: row.logo_data_url ?? "",
      storageProvider: row.logo_storage_provider ?? "",
      storageBucket: row.logo_storage_bucket ?? "",
      storageKey: row.logo_storage_key ?? "",
      storageUrl: row.logo_storage_url ?? "",
    });

    return {
      id: String(row.id),
      name: row.naziv_tvrtke,
      logoDataUrl: storedLogo.dataUrl,
      logoStorageProvider: storedLogo.storageProvider,
      logoStorageBucket: storedLogo.storageBucket,
      logoStorageKey: storedLogo.storageKey,
      logoStorageUrl: storedLogo.storageUrl,
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
    };
  });

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
           izvrsitelj_rn2, izvrsitelji_json, tagovi, status_rn, napomena_faktura, godina_rn, redni_broj,
           tim_rn, odjel, koordinate, usluge, opis, regija, datum_fakturiranja, tezina, rn_zavrsio,
           training_admin_name, training_admin_role, training_admin_phone, training_admin_email,
           usluge_json, mjerenja_json
    FROM radni_nalozi
    ORDER BY datum_rn DESC, id DESC
  `);

  const workOrders = workOrderRows.map((row) => {
    const company = companiesByOib.get(row.oib ?? "");
    const location = locationsByKey.get(locationCompositeKey(row.oib ?? "", row.lokacija ?? ""));

    const executors = parseJsonArray(row.izvrsitelji_json)
      .map((value) => dbString(value))
      .filter(Boolean);
    const serviceItems = parseJsonArray(row.usluge_json)
      .map((item) => ({
        serviceId: dbString(item.serviceId ?? item.id),
        name: dbString(item.name),
        serviceCode: dbString(item.serviceCode),
        linkedTemplateIds: parseJsonArray(item.linkedTemplateIds).map((value) => dbString(value)).filter(Boolean),
        linkedTemplateTitles: parseJsonArray(item.linkedTemplateTitles).map((value) => dbString(value)).filter(Boolean),
        isTraining: Boolean(item.isTraining),
        isCompleted: Boolean(item.isCompleted),
      }))
      .filter((item) => item.name || item.serviceCode);

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
      teamLabel: row.tim_rn ?? "",
      executors: executors.length > 0
        ? executors
        : [row.izvrsitelj_rn1 ?? "", row.izvrsitelj_rn2 ?? ""].map((value) => dbString(value)).filter(Boolean),
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
      trainingContext: {
        name: row.training_admin_name ?? "",
        role: row.training_admin_role ?? "",
        phone: row.training_admin_phone ?? "",
        email: row.training_admin_email ?? "",
      },
      measurementSheet: normalizeWorkOrderMeasurementSheet(parseJsonObject(row.mjerenja_json)),
      serviceItems,
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

  const [offerRows] = await connection.query(`
    SELECT id, organization_id, company_id, location_id, location_scope, offer_number, offer_year, offer_sequence,
           offer_initials, title, service_line, status, offer_date, valid_until, note, currency_code,
           tax_rate, discount_rate, subtotal_amount, discount_total_amount, taxable_subtotal_amount,
           show_total_amount,
           tax_total_amount, grand_total_amount, items_json, contact_slot, contact_name, contact_phone,
           contact_email, created_by_user_id, created_by_label, created_at, updated_at
    FROM web_offers
    ORDER BY
      CASE status
        WHEN 'draft' THEN 0
        WHEN 'sent' THEN 1
        WHEN 'accepted' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 9
      END ASC,
      offer_date DESC,
      updated_at DESC,
      id DESC
  `);

  const offers = offerRows.map((row) => {
    const company = companiesById.get(dbString(row.company_id));
    const location = locationsById.get(dbString(row.location_id));
    const rawLocationScope = dbString(row.location_scope).toLowerCase();
    const locationScope = ["all", "single", "none"].includes(rawLocationScope)
      ? (rawLocationScope === "single" && !dbString(row.location_id) ? "none" : rawLocationScope)
      : (dbString(row.location_id) ? "single" : "none");
    const items = parseJsonArray(row.items_json).map((item) => ({
      description: dbString(item.description),
      unit: dbString(item.unit),
      quantity: Number(item.quantity ?? 0) || 0,
      unitPrice: Number(item.unitPrice ?? 0) || 0,
      breakdowns: parseJsonArray(item.breakdowns).map((entry) => ({
        label: dbString(entry.label),
        amount: Number(entry.amount ?? 0) || 0,
      })),
      breakdownTotal: Number(item.breakdownTotal ?? 0) || 0,
      discountRate: Number(item.discountRate ?? 0) || 0,
      discountTotal: Number(item.discountTotal ?? 0) || 0,
      totalPrice: Number(item.totalPrice ?? 0) || 0,
    }));

    return {
      id: String(row.id),
      organizationId: dbString(row.organization_id),
      companyId: dbString(row.company_id),
      companyName: company?.name ?? "",
      companyOib: company?.oib ?? "",
      headquarters: company?.headquarters ?? "",
      locationId: dbString(row.location_id),
      locationScope,
      locationName: locationScope === "all"
        ? "Sve lokacije"
        : locationScope === "none"
          ? "Bez lokacije"
          : (location?.name ?? ""),
      region: location?.region ?? "",
      coordinates: location?.coordinates ?? "",
      contactSlot: dbString(row.contact_slot),
      contactName: row.contact_name ?? "",
      contactPhone: row.contact_phone ?? "",
      contactEmail: row.contact_email ?? "",
      offerNumber: row.offer_number ?? "",
      offerYear: Number(row.offer_year ?? 0) || null,
      offerSequence: Number(row.offer_sequence ?? 0) || null,
      offerInitials: row.offer_initials ?? "",
      title: row.title ?? "",
      serviceLine: row.service_line ?? "",
      status: row.status ?? "draft",
      offerDate: normalizeDateOnly(row.offer_date),
      validUntil: normalizeDateOnly(row.valid_until),
      note: row.note ?? "",
      currency: row.currency_code ?? "EUR",
      taxRate: Number(row.tax_rate ?? 0) || 0,
      discountRate: Number(row.discount_rate ?? 0) || 0,
      subtotal: Number(row.subtotal_amount ?? 0) || 0,
      discountTotal: Number(row.discount_total_amount ?? 0) || 0,
      taxableSubtotal: Number(row.taxable_subtotal_amount ?? 0) || 0,
      showTotalAmount: row.show_total_amount == null ? true : Boolean(Number(row.show_total_amount)),
      taxTotal: Number(row.tax_total_amount ?? 0) || 0,
      total: Number(row.grand_total_amount ?? 0) || 0,
      items,
      createdByUserId: dbString(row.created_by_user_id),
      createdByLabel: row.created_by_label ?? "",
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    };
  });

  const [vehicleRows] = await connection.query(`
    SELECT id, organization_id, name, plate_number, make_name, model_name, category, model_year,
           color, fuel_type, transmission, seat_count, odometer_km, service_due_date,
           registration_expires_on, notes, status, reservations_json, created_at, updated_at
    FROM web_vehicles
    ORDER BY updated_at DESC, id DESC
  `);

  const vehicles = vehicleRows.map((row) => ({
    id: String(row.id),
    organizationId: dbString(row.organization_id),
    name: row.name ?? "",
    plateNumber: row.plate_number ?? "",
    make: row.make_name ?? "",
    model: row.model_name ?? "",
    category: row.category ?? "",
    year: parseNullableInteger(row.model_year),
    color: row.color ?? "",
    fuelType: row.fuel_type ?? "",
    transmission: row.transmission ?? "",
    seatCount: parseNullableInteger(row.seat_count),
    odometerKm: parseNullableInteger(row.odometer_km) ?? 0,
    serviceDueDate: normalizeDateOnly(row.service_due_date),
    registrationExpiresOn: normalizeDateOnly(row.registration_expires_on),
    notes: row.notes ?? "",
    status: row.status ?? "available",
    reservations: sortVehicleReservations(parseJsonArray(row.reservations_json).map((reservation) => ({
      id: dbString(reservation.id),
      vehicleId: dbString(reservation.vehicleId) || String(row.id),
      status: dbString(reservation.status) || "reserved",
      purpose: dbString(reservation.purpose),
      reservedForUserIds: parseJsonArray(reservation.reservedForUserIds).map((value) => dbString(value)).filter(Boolean),
      reservedForLabels: parseJsonArray(reservation.reservedForLabels).map((value) => dbString(value)).filter(Boolean),
      reservedForUserId: dbString(reservation.reservedForUserId),
      reservedForLabel: dbString(reservation.reservedForLabel),
      destination: dbString(reservation.destination),
      startAt: normalizeTimestamp(reservation.startAt),
      endAt: normalizeTimestamp(reservation.endAt),
      note: dbString(reservation.note),
      createdByUserId: dbString(reservation.createdByUserId),
      createdByLabel: dbString(reservation.createdByLabel),
      createdAt: normalizeTimestamp(reservation.createdAt),
      updatedAt: normalizeTimestamp(reservation.updatedAt),
    })).filter((reservation) => reservation.startAt && reservation.endAt)),
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  }));

  const [legalFrameworkRows] = await connection.query(`
    SELECT id, organization_id, title, category, authority_name, reference_code, version_label,
           published_on, effective_from, review_date, status, tags_text, source_url, note,
           created_at, updated_at
    FROM web_legal_frameworks
    ORDER BY
      CASE status
        WHEN 'active' THEN 0
        WHEN 'inactive' THEN 1
        ELSE 9
      END ASC,
      review_date ASC,
      updated_at DESC,
      id DESC
  `);

  const legalFrameworks = legalFrameworkRows.map((row) => ({
    id: String(row.id),
    organizationId: dbString(row.organization_id),
    title: row.title ?? "",
    category: row.category ?? "",
    authority: row.authority_name ?? "",
    referenceCode: row.reference_code ?? "",
    versionLabel: row.version_label ?? "",
    publishedOn: normalizeDateOnly(row.published_on),
    effectiveFrom: normalizeDateOnly(row.effective_from),
    reviewDate: normalizeDateOnly(row.review_date),
    status: row.status ?? "active",
    tagsText: row.tags_text ?? "",
    sourceUrl: row.source_url ?? "",
    note: row.note ?? "",
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  }));

  const [documentTemplateRows] = await connection.query(`
    SELECT id, organization_id, title, document_type, status, description, output_file_name,
           sample_company_id, sample_location_id, selected_legal_framework_ids_json,
           custom_fields_json, equipment_items_json, sections_json,
           reference_document_name, reference_document_type, reference_document_data_url,
           reference_document_storage_provider, reference_document_storage_bucket,
           reference_document_storage_key, reference_document_url,
           created_by_user_id, created_by_label, created_at, updated_at
    FROM web_document_templates
    ORDER BY
      CASE status
        WHEN 'active' THEN 0
        WHEN 'draft' THEN 1
        WHEN 'archived' THEN 2
        ELSE 9
      END ASC,
      updated_at DESC,
      id DESC
  `);

  const documentTemplates = documentTemplateRows.map((row) => ({
    id: String(row.id),
    organizationId: dbString(row.organization_id),
    title: row.title ?? "",
    documentType: row.document_type ?? "Zapisnik",
    status: row.status ?? "draft",
    description: row.description ?? "",
    outputFileName: row.output_file_name ?? "",
    sampleCompanyId: dbString(row.sample_company_id),
    sampleLocationId: dbString(row.sample_location_id),
    selectedLegalFrameworkIds: parseJsonArray(row.selected_legal_framework_ids_json).map((entry) => dbString(entry)).filter(Boolean),
    customFields: parseJsonArray(row.custom_fields_json).map((field) => ({
      id: dbString(field.id),
      key: dbString(field.key),
      label: dbString(field.label),
      wordLabel: dbString(field.wordLabel),
      type: dbString(field.type) || "text",
      layoutWidth: dbString(field.layoutWidth),
      fieldHeight: Number(field.fieldHeight ?? 0) || 0,
      source: dbString(field.source ?? field.bindingSource),
      sourceTable: dbString(field.sourceTable),
      lookupColumn: dbString(field.lookupColumn),
      lookupValueSource: dbString(field.lookupValueSource),
      lookupValue: dbString(field.lookupValue),
      valueColumn: dbString(field.valueColumn),
      previousDocumentMode: dbString(field.previousDocumentMode),
      signatureArea: dbString(field.signatureArea),
      signatureRole: dbString(field.signatureRole),
      signatureMultiple: field.signatureMultiple === undefined ? undefined : Boolean(field.signatureMultiple),
      signatureIncludeScan: field.signatureIncludeScan === undefined ? undefined : Boolean(field.signatureIncludeScan),
      defaultValue: dbString(field.defaultValue),
      helpText: dbString(field.helpText),
      toggleTrueLabel: dbString(field.toggleTrueLabel),
      toggleFalseLabel: dbString(field.toggleFalseLabel),
      columns: parseJsonArray(field.columns).map((entry) => dbString(entry)).filter(Boolean),
      rowCount: Number(field.rowCount ?? 0) || 0,
      sheet: normalizeWorkOrderMeasurementSheet(field.sheet ?? field.measurementSheet),
    })),
    equipmentItems: parseJsonArray(row.equipment_items_json).map((item) => ({
      id: dbString(item.id),
      name: dbString(item.name),
      code: dbString(item.code),
      quantity: Number(item.quantity ?? 0) || 0,
      note: dbString(item.note),
    })),
    sections: parseJsonArray(row.sections_json).map((section) => ({
      id: dbString(section.id),
      type: dbString(section.type) || "rich_text",
      title: dbString(section.title),
      body: dbString(section.body),
      columns: parseJsonArray(section.columns).map((entry) => dbString(entry)).filter(Boolean),
      rowCount: Number(section.rowCount ?? 0) || 0,
      sheet: normalizeWorkOrderMeasurementSheet(section.sheet ?? section.measurementSheet),
    })),
    referenceDocument: (() => {
      const storedReference = mapStoredDocumentLocation({
        dataUrl: row.reference_document_data_url ?? "",
        storageProvider: row.reference_document_storage_provider ?? "",
        storageBucket: row.reference_document_storage_bucket ?? "",
        storageKey: row.reference_document_storage_key ?? "",
        storageUrl: row.reference_document_url ?? "",
      });

      return dbString(row.reference_document_name) && dbString(storedReference.dataUrl)
        ? {
          fileName: row.reference_document_name ?? "",
          fileType: row.reference_document_type ?? "",
          dataUrl: storedReference.dataUrl,
          storageProvider: storedReference.storageProvider,
          storageBucket: storedReference.storageBucket,
          storageKey: storedReference.storageKey,
          storageUrl: storedReference.storageUrl,
          updatedAt: normalizeTimestamp(row.updated_at),
        }
        : null;
    })(),
    createdByUserId: dbString(row.created_by_user_id),
    createdByLabel: row.created_by_label ?? "",
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  }));

  const [learningTestRows] = await connection.query(`
    SELECT id, organization_id, title, status, description,
           handbook_documents_json, video_items_json, question_items_json,
           assignment_items_json, attempt_items_json, created_at, updated_at
    FROM web_learning_tests
    ORDER BY
      CASE status
        WHEN 'active' THEN 0
        WHEN 'draft' THEN 1
        WHEN 'archived' THEN 2
        ELSE 9
      END ASC,
      updated_at DESC,
      id DESC
  `);

  const learningTests = learningTestRows.map((row) => ({
    id: String(row.id),
    organizationId: dbString(row.organization_id),
    title: dbString(row.title),
    status: dbString(row.status) || "draft",
    description: dbString(row.description),
    handbookDocuments: parseJsonArray(row.handbook_documents_json).map((document) => mapStoredAttachmentDocument(document)),
    videoItems: parseJsonArray(row.video_items_json),
    questionItems: parseJsonArray(row.question_items_json).map((question) => ({
      ...question,
      imageDocument: question?.imageDocument ? mapStoredAttachmentDocument(question.imageDocument) : null,
    })),
    assignmentItems: parseJsonArray(row.assignment_items_json),
    attemptItems: parseJsonArray(row.attempt_items_json),
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  }));

  const documentTemplatesById = new Map(
    documentTemplates.map((template) => [String(template.id), template]),
  );

  const [serviceCatalogRows] = await connection.query(`
    SELECT id, organization_id, name, service_code, status, service_type, is_training, linked_template_ids_json, linked_learning_test_ids_json, note, created_at, updated_at
    FROM web_service_catalog
    ORDER BY
      CASE status
        WHEN 'active' THEN 0
        WHEN 'inactive' THEN 1
        ELSE 9
      END ASC,
      service_code ASC,
      name ASC,
      id DESC
  `);

  const serviceCatalog = serviceCatalogRows.map((row) => {
    const templateIds = parseJsonArray(row.linked_template_ids_json).map((value) => dbString(value)).filter(Boolean);
    const linkedTemplateTitles = templateIds
      .map((templateId) => documentTemplatesById.get(String(templateId))?.title ?? "")
      .filter(Boolean);
    const learningTestIds = parseJsonArray(row.linked_learning_test_ids_json).map((value) => dbString(value)).filter(Boolean);
    const linkedLearningTestTitles = learningTestIds
      .map((testId) => learningTests.find((item) => String(item.id) === String(testId))?.title ?? "")
      .filter(Boolean);

    return {
      id: String(row.id),
      organizationId: dbString(row.organization_id),
      name: row.name ?? "",
      serviceCode: row.service_code ?? "",
      status: row.status ?? "active",
      serviceType: dbString(row.service_type) || (row.is_training ? "znr" : "inspection"),
      isTraining: Boolean(row.is_training),
      linkedTemplateIds: templateIds,
      linkedTemplateTitles,
      linkedLearningTestIds: learningTestIds,
      linkedLearningTestTitles,
      note: row.note ?? "",
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    };
  });

  const [measurementEquipmentRows] = await connection.query(`
    SELECT id, organization_id, name, equipment_kind, manufacturer, device_type, device_code, serial_number, inventory_number,
           requires_calibration, calibration_date, calibration_period, valid_until, note,
           linked_template_ids_json, documents_json, created_at, updated_at
    FROM web_measurement_equipment
    ORDER BY
      valid_until ASC,
      updated_at DESC,
      id DESC
  `);

  const measurementEquipment = measurementEquipmentRows.map((row) => {
    const linkedTemplateIds = parseJsonArray(row.linked_template_ids_json).map((value) => dbString(value)).filter(Boolean);
    const linkedTemplateTitles = linkedTemplateIds
      .map((templateId) => documentTemplatesById.get(String(templateId))?.title ?? "")
      .filter(Boolean);

    return {
      id: String(row.id),
      organizationId: dbString(row.organization_id),
      name: row.name ?? "",
      equipmentKind: row.equipment_kind ?? "measurement",
      manufacturer: row.manufacturer ?? "",
      deviceType: row.device_type ?? "",
      deviceCode: row.device_code ?? "",
      serialNumber: row.serial_number ?? "",
      inventoryNumber: row.inventory_number ?? "",
      requiresCalibration: Boolean(Number(row.requires_calibration ?? 0)),
      calibrationDate: normalizeDateOnly(row.calibration_date),
      calibrationPeriod: row.calibration_period ?? "",
      validUntil: normalizeDateOnly(row.valid_until),
      note: row.note ?? "",
      linkedTemplateIds,
      linkedTemplateTitles,
      documents: parseJsonArray(row.documents_json).map((document) => mapStoredAttachmentDocument(document)).filter((document) => document.fileName && document.dataUrl),
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    };
  });

  const [safetyAuthorizationRows] = await connection.query(`
    SELECT id, organization_id, title, authorization_scope, issued_on, valid_until, note,
           linked_template_ids_json, documents_json, created_at, updated_at
    FROM web_safety_authorizations
    ORDER BY
      valid_until ASC,
      updated_at DESC,
      id DESC
  `);

  const safetyAuthorizations = safetyAuthorizationRows.map((row) => {
    const linkedTemplateIds = parseJsonArray(row.linked_template_ids_json).map((value) => dbString(value)).filter(Boolean);
    const linkedTemplateTitles = linkedTemplateIds
      .map((templateId) => documentTemplatesById.get(String(templateId))?.title ?? "")
      .filter(Boolean);

    return {
      id: String(row.id),
      organizationId: dbString(row.organization_id),
      title: row.title ?? "",
      scope: row.authorization_scope ?? "",
      issuedOn: normalizeDateOnly(row.issued_on),
      validUntil: normalizeDateOnly(row.valid_until),
      note: row.note ?? "",
      linkedTemplateIds,
      linkedTemplateTitles,
      documents: parseJsonArray(row.documents_json).map((document) => mapStoredAttachmentDocument(document)).filter((document) => document.fileName && document.dataUrl),
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
    offers,
    vehicles,
    legalFrameworks,
    documentTemplates,
    learningTests,
    serviceCatalog,
    measurementEquipment,
    safetyAuthorizations,
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
    this.objectStorage = {
      ...getObjectStorageConfig(),
      enabled: false,
    };
    this.snapshot = {
      companies: [],
      locations: [],
      workOrders: [],
      reminders: [],
      todoTasks: [],
      offers: [],
      vehicles: [],
      legalFrameworks: [],
      documentTemplates: [],
      documentRecords: [],
      learningTests: [],
      serviceCatalog: [],
      measurementEquipment: [],
      safetyAuthorizations: [],
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
    this.workOrderDocuments = new Map();
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
      offers: this.snapshot.offers.map((item) => ({
        ...item,
        items: (item.items ?? []).map((entry) => ({
          ...entry,
          breakdowns: (entry.breakdowns ?? []).map((detail) => ({ ...detail })),
        })),
      })),
      vehicles: this.snapshot.vehicles.map((item) => ({
        ...item,
        reservations: (item.reservations ?? []).map((reservation) => ({
          ...reservation,
          reservedForUserIds: [...(reservation.reservedForUserIds ?? [])],
          reservedForLabels: [...(reservation.reservedForLabels ?? [])],
        })),
      })),
      legalFrameworks: this.snapshot.legalFrameworks.map((item) => ({ ...item })),
      documentTemplates: this.snapshot.documentTemplates.map((item) => ({
        ...item,
        selectedLegalFrameworkIds: [...(item.selectedLegalFrameworkIds ?? [])],
        customFields: (item.customFields ?? []).map((field) => ({ ...field })),
        equipmentItems: (item.equipmentItems ?? []).map((equipment) => ({ ...equipment })),
        sections: (item.sections ?? []).map((section) => ({
          ...section,
          columns: [...(section.columns ?? [])],
        })),
        referenceDocument: item.referenceDocument
          ? { ...item.referenceDocument }
          : null,
      })),
      learningTests: this.snapshot.learningTests.map((item) => cloneLearningTest(item)),
      serviceCatalog: this.snapshot.serviceCatalog.map((item) => ({
        ...item,
        linkedTemplateIds: [...(item.linkedTemplateIds ?? [])],
        linkedTemplateTitles: [...(item.linkedTemplateTitles ?? [])],
      })),
      measurementEquipment: this.snapshot.measurementEquipment.map((item) => ({
        ...item,
        linkedTemplateIds: [...(item.linkedTemplateIds ?? [])],
        linkedTemplateTitles: [...(item.linkedTemplateTitles ?? [])],
        documents: (item.documents ?? []).map((document) => ({ ...document })),
      })),
      safetyAuthorizations: this.snapshot.safetyAuthorizations.map((item) => ({
        ...item,
        linkedTemplateIds: [...(item.linkedTemplateIds ?? [])],
        linkedTemplateTitles: [...(item.linkedTemplateTitles ?? [])],
        documents: (item.documents ?? []).map((document) => ({ ...document })),
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
    const hasOffers = this.snapshot.offers.some((item) => item.companyId === id);

    if (hasLocations || hasWorkOrders || hasReminders || hasTodoTasks || hasOffers) {
      throw new Error("Tvrtka je vec povezana s lokacijama, ponudama ili radnim nalozima.");
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
    const hasOffers = this.snapshot.offers.some((item) => item.locationId === id);

    if (hasWorkOrders || hasReminders || hasTodoTasks || hasOffers) {
      throw new Error("Lokacija je vec povezana s ponudama ili radnim nalozima.");
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
    this.workOrderDocuments.set(String(workOrder.id), []);
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

  async addWorkOrderDocuments(workOrderId, files, actor = null, options = {}) {
    const workOrder = this.snapshot.workOrders.find((item) => String(item.id) === String(workOrderId));

    if (!workOrder) {
      return [];
    }

    const timestamp = new Date().toISOString();
    const actorId = getActivityActorId(actor);
    const actorLabel = getActivityActorLabel(actor);
    const normalizedFiles = (Array.isArray(files) ? files : []).map((file) => (
      normalizeWorkOrderDocumentInput(file, options.sourceType)
    ));
    const nextDocuments = normalizedFiles.map((file, index) => ({
      id: `${workOrderId}-document-${Date.now()}-${index}`,
      workOrderId: String(workOrderId),
      actorLabel,
      actorUserId: actorId === null ? "" : String(actorId),
      sourceType: file.sourceType,
      fileName: file.fileName,
      fileExtension: file.fileExtension,
      fileType: file.fileType,
      description: file.description,
      fileSize: file.fileSize,
      dataUrl: file.dataUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const existingDocuments = this.workOrderDocuments.get(String(workOrderId)) ?? [];
    this.workOrderDocuments.set(String(workOrderId), [...nextDocuments, ...existingDocuments]);

    const existingEntries = this.workOrderActivity.get(String(workOrderId)) ?? [];
    const activityEntries = buildWorkOrderDocumentActivityEntries(nextDocuments).map((entry, index) => ({
      id: `${workOrderId}-document-activity-${Date.now()}-${index}`,
      workOrderId: String(workOrderId),
      actorLabel,
      actorUserId: actorId === null ? "" : String(actorId),
      actionType: entry.actionType,
      fieldKey: entry.fieldKey,
      fieldLabel: entry.fieldLabel,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      description: entry.description,
      createdAt: timestamp,
    }));
    this.workOrderActivity.set(String(workOrderId), [...activityEntries, ...existingEntries]);

    return nextDocuments;
  }

  async getWorkOrderDocuments(id) {
    return (this.workOrderDocuments.get(String(id)) ?? [])
      .slice()
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  }

  async updateWorkOrderDocument(workOrderId, documentId, patch, actor = null) {
    const currentDocuments = this.workOrderDocuments.get(String(workOrderId)) ?? [];
    const current = currentDocuments.find((item) => String(item.id) === String(documentId));

    if (!current) {
      return null;
    }

    const normalizedPatch = normalizeWorkOrderDocumentPatch(patch);
    const next = {
      ...current,
      fileName: Object.prototype.hasOwnProperty.call(normalizedPatch, "fileName") ? normalizedPatch.fileName : current.fileName,
      fileExtension: Object.prototype.hasOwnProperty.call(normalizedPatch, "fileName")
        ? (normalizedPatch.fileExtension || current.fileExtension)
        : current.fileExtension,
      description: Object.prototype.hasOwnProperty.call(normalizedPatch, "description") ? normalizedPatch.description : current.description,
      updatedAt: new Date().toISOString(),
    };

    this.workOrderDocuments.set(
      String(workOrderId),
      currentDocuments.map((item) => (String(item.id) === String(documentId) ? next : item)),
    );

    const existingEntries = this.workOrderActivity.get(String(workOrderId)) ?? [];
    const actorId = getActivityActorId(actor);
    const actorLabel = getActivityActorLabel(actor);
    const activityEntries = buildWorkOrderDocumentUpdatedActivityEntries(current, next).map((entry, index) => ({
      id: `${workOrderId}-document-update-${Date.now()}-${index}`,
      workOrderId: String(workOrderId),
      actorLabel,
      actorUserId: actorId === null ? "" : String(actorId),
      actionType: entry.actionType,
      fieldKey: entry.fieldKey,
      fieldLabel: entry.fieldLabel,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      description: entry.description,
      createdAt: next.updatedAt,
    }));

    if (activityEntries.length) {
      this.workOrderActivity.set(String(workOrderId), [...activityEntries, ...existingEntries]);
    }

    return next;
  }

  async deleteWorkOrderDocument(workOrderId, documentId, actor = null) {
    const currentDocuments = this.workOrderDocuments.get(String(workOrderId)) ?? [];
    const current = currentDocuments.find((item) => String(item.id) === String(documentId));

    if (!current) {
      return false;
    }

    this.workOrderDocuments.set(
      String(workOrderId),
      currentDocuments.filter((item) => String(item.id) !== String(documentId)),
    );

    const existingEntries = this.workOrderActivity.get(String(workOrderId)) ?? [];
    const actorId = getActivityActorId(actor);
    const actorLabel = getActivityActorLabel(actor);
    const activityEntries = buildWorkOrderDocumentDeletedActivityEntries(current).map((entry, index) => ({
      id: `${workOrderId}-document-delete-${Date.now()}-${index}`,
      workOrderId: String(workOrderId),
      actorLabel,
      actorUserId: actorId === null ? "" : String(actorId),
      actionType: entry.actionType,
      fieldKey: entry.fieldKey,
      fieldLabel: entry.fieldLabel,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      description: entry.description,
      createdAt: new Date().toISOString(),
    }));
    this.workOrderActivity.set(String(workOrderId), [...activityEntries, ...existingEntries]);

    return true;
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
    this.workOrderActivity.delete(String(id));
    this.workOrderDocuments.delete(String(id));
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

  async createOffer(input, actor = null) {
    const timestamp = new Date().toISOString();
    const numberParts = nextOfferNumber(this.snapshot.offers, {
      year: Number(timestamp.slice(0, 4)),
      initials: actor?.fullName || actor?.username || input.createdByLabel || "",
    });
    const offer = createOffer({
      ...input,
      createdByUserId: String(actor?.id ?? input.createdByUserId ?? ""),
      createdByLabel: actor?.fullName || actor?.username || input.createdByLabel || "Safety360",
    }, this.snapshot, () => crypto.randomUUID(), numberParts, () => timestamp);
    this.snapshot.offers = [offer, ...this.snapshot.offers];
    return offer;
  }

  async updateOffer(id, patch, actor = null) {
    const current = this.snapshot.offers.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateOffer(current, {
      ...patch,
      createdByUserId: current.createdByUserId || String(actor?.id ?? ""),
      createdByLabel: current.createdByLabel || actor?.fullName || actor?.username || "Safety360",
    }, this.snapshot, () => new Date().toISOString());
    this.snapshot.offers = this.snapshot.offers.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteOffer(id) {
    const before = this.snapshot.offers.length;
    this.snapshot.offers = this.snapshot.offers.filter((item) => item.id !== id);
    return this.snapshot.offers.length !== before;
  }

  async createVehicle(input) {
    const vehicle = createVehicle(input, this.snapshot, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.vehicles = [vehicle, ...this.snapshot.vehicles];
    return vehicle;
  }

  async updateVehicle(id, patch) {
    const current = this.snapshot.vehicles.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateVehicle(current, patch, this.snapshot, () => new Date().toISOString());
    this.snapshot.vehicles = this.snapshot.vehicles.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteVehicle(id) {
    const before = this.snapshot.vehicles.length;
    this.snapshot.vehicles = this.snapshot.vehicles.filter((item) => item.id !== id);
    return this.snapshot.vehicles.length !== before;
  }

  async createVehicleReservation(vehicleId, input, actor = null) {
    const current = this.snapshot.vehicles.find((item) => item.id === vehicleId);

    if (!current) {
      return null;
    }

    const next = createVehicleReservation(current, {
      ...input,
      createdByUserId: String(actor?.id ?? input.createdByUserId ?? ""),
      createdByLabel: actor?.fullName || actor?.username || input.createdByLabel || "Safety360",
    }, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.vehicles = this.snapshot.vehicles.map((item) => (item.id === vehicleId ? next : item));
    return next;
  }

  async updateVehicleReservation(vehicleId, reservationId, patch, actor = null) {
    const current = this.snapshot.vehicles.find((item) => item.id === vehicleId);

    if (!current) {
      return null;
    }

     const currentReservation = (current.reservations ?? []).find((reservation) => String(reservation.id) === String(reservationId));

    if (!currentReservation) {
      return null;
    }

    const next = updateVehicleReservation(current, reservationId, {
      ...patch,
      createdByUserId: patch.createdByUserId ?? currentReservation.createdByUserId ?? String(actor?.id ?? ""),
      createdByLabel: patch.createdByLabel
        ?? currentReservation.createdByLabel
        ?? (actor?.fullName || actor?.username || "Safety360"),
    }, () => new Date().toISOString());
    this.snapshot.vehicles = this.snapshot.vehicles.map((item) => (item.id === vehicleId ? next : item));
    return next;
  }

  async deleteVehicleReservation(vehicleId, reservationId) {
    const current = this.snapshot.vehicles.find((item) => item.id === vehicleId);

    if (!current) {
      return null;
    }

    const next = deleteVehicleReservation(current, reservationId, () => new Date().toISOString());

    if (!next) {
      return null;
    }

    this.snapshot.vehicles = this.snapshot.vehicles.map((item) => (item.id === vehicleId ? next : item));
    return next;
  }

  async createLegalFramework(input) {
    const timestamp = new Date().toISOString();
    const item = createLegalFramework(input, this.snapshot, () => crypto.randomUUID(), () => timestamp);
    this.snapshot.legalFrameworks = [item, ...this.snapshot.legalFrameworks];
    syncLegalFrameworkTemplatesInSnapshot(this.snapshot, item.id, input.linkedTemplateIds ?? [], timestamp);
    return item;
  }

  async updateLegalFramework(id, patch) {
    const current = this.snapshot.legalFrameworks.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const next = updateLegalFramework(current, patch, this.snapshot, () => timestamp);
    this.snapshot.legalFrameworks = this.snapshot.legalFrameworks.map((item) => (item.id === id ? next : item));
    if (Object.prototype.hasOwnProperty.call(patch, "linkedTemplateIds")) {
      syncLegalFrameworkTemplatesInSnapshot(this.snapshot, id, patch.linkedTemplateIds ?? [], timestamp);
    }
    return next;
  }

  async deleteLegalFramework(id) {
    const before = this.snapshot.legalFrameworks.length;
    this.snapshot.legalFrameworks = this.snapshot.legalFrameworks.filter((item) => item.id !== id);
    this.snapshot.documentTemplates = this.snapshot.documentTemplates.map((item) => ({
      ...item,
      selectedLegalFrameworkIds: (item.selectedLegalFrameworkIds ?? []).filter((entryId) => String(entryId) !== String(id)),
      updatedAt: (item.selectedLegalFrameworkIds ?? []).some((entryId) => String(entryId) === String(id))
        ? new Date().toISOString()
        : item.updatedAt,
    }));
    return this.snapshot.legalFrameworks.length !== before;
  }

  async createServiceCatalogItem(input) {
    const item = createServiceCatalogItem(input, this.snapshot, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.serviceCatalog = [item, ...this.snapshot.serviceCatalog];
    return item;
  }

  async updateServiceCatalogItem(id, patch) {
    const current = this.snapshot.serviceCatalog.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateServiceCatalogItem(current, patch, this.snapshot, () => new Date().toISOString());
    this.snapshot.serviceCatalog = this.snapshot.serviceCatalog.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteServiceCatalogItem(id) {
    const before = this.snapshot.serviceCatalog.length;
    this.snapshot.serviceCatalog = this.snapshot.serviceCatalog.filter((item) => item.id !== id);
    return this.snapshot.serviceCatalog.length !== before;
  }

  async createLearningTestItem(input) {
    const item = createLearningTest(input, this.snapshot, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.learningTests = [item, ...(this.snapshot.learningTests ?? [])];
    return cloneLearningTest(item);
  }

  async updateLearningTestItem(id, patch) {
    const current = (this.snapshot.learningTests ?? []).find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateLearningTest(current, patch, this.snapshot, () => new Date().toISOString());
    this.snapshot.learningTests = (this.snapshot.learningTests ?? []).map((item) => (item.id === id ? next : item));
    return cloneLearningTest(next);
  }

  async deleteLearningTestItem(id) {
    const before = this.snapshot.learningTests.length;
    this.snapshot.learningTests = this.snapshot.learningTests.filter((item) => item.id !== id);
    return this.snapshot.learningTests.length !== before;
  }

  async getLearningAccessByToken(token) {
    const safeToken = dbString(token);

    if (!safeToken) {
      return null;
    }

    for (const test of this.snapshot.learningTests ?? []) {
      const assignment = (test.assignmentItems ?? []).find((item) => String(item.accessToken ?? "") === safeToken);

      if (assignment) {
        return sanitizeLearningTestAccess(test, {
          ...assignment,
          accessUrl: buildLearningAssignmentAccessUrl(assignment.accessToken),
        });
      }
    }

    return null;
  }

  async startLearningTestAccess(token) {
    const safeToken = dbString(token);
    const timestamp = new Date().toISOString();

    let result = null;
    this.snapshot.learningTests = (this.snapshot.learningTests ?? []).map((test) => {
      const assignmentItems = (test.assignmentItems ?? []).map((assignment) => {
        if (String(assignment.accessToken ?? "") !== safeToken) {
          return assignment;
        }

        const nextAssignment = {
          ...assignment,
          status: assignment.status === "completed" ? "completed" : "in_progress",
          startedAt: assignment.startedAt || timestamp,
        };
        result = sanitizeLearningTestAccess(test, {
          ...nextAssignment,
          accessUrl: buildLearningAssignmentAccessUrl(nextAssignment.accessToken),
        });
        return nextAssignment;
      });

      return result
        ? {
          ...test,
          assignmentItems,
          updatedAt: timestamp,
        }
        : test;
    });

    return result;
  }

  async submitLearningTestAccess(token, answers = []) {
    const safeToken = dbString(token);
    const timestamp = new Date().toISOString();
    let result = null;

    this.snapshot.learningTests = (this.snapshot.learningTests ?? []).map((test) => {
      const assignment = (test.assignmentItems ?? []).find((item) => String(item.accessToken ?? "") === safeToken);
      if (!assignment) {
        return test;
      }

      const scoring = scoreLearningTestSubmission(test, answers);
      const attempt = {
        id: crypto.randomUUID(),
        assignmentId: String(assignment.id ?? ""),
        userId: String(assignment.userId ?? ""),
        userLabel: String(assignment.userLabel ?? ""),
        answers: scoring.answers,
        scorePercent: scoring.scorePercent,
        submittedAt: timestamp,
      };

      const assignmentItems = (test.assignmentItems ?? []).map((item) => (
        String(item.id ?? "") === String(assignment.id ?? "")
          ? {
            ...item,
            status: "completed",
            startedAt: item.startedAt || timestamp,
            completedAt: timestamp,
            scorePercent: scoring.scorePercent,
          }
          : item
      ));
      const attemptItems = [...(test.attemptItems ?? []), attempt];
      const updatedTest = {
        ...test,
        assignmentItems,
        attemptItems,
        updatedAt: timestamp,
      };
      const updatedAssignment = assignmentItems.find((item) => String(item.id ?? "") === String(assignment.id ?? ""));
      result = {
        ...sanitizeLearningTestAccess(updatedTest, {
          ...updatedAssignment,
          accessUrl: buildLearningAssignmentAccessUrl(updatedAssignment?.accessToken),
        }),
        submission: {
          scorePercent: scoring.scorePercent,
          submittedAt: timestamp,
        },
      };
      return updatedTest;
    });

    return result;
  }

  async createMeasurementEquipmentItem(input) {
    const item = createMeasurementEquipmentItem(input, this.snapshot, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.measurementEquipment = [item, ...this.snapshot.measurementEquipment];
    return item;
  }

  async updateMeasurementEquipmentItem(id, patch) {
    const current = this.snapshot.measurementEquipment.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateMeasurementEquipmentItem(current, patch, this.snapshot, () => new Date().toISOString());
    this.snapshot.measurementEquipment = this.snapshot.measurementEquipment.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteMeasurementEquipmentItem(id) {
    const before = this.snapshot.measurementEquipment.length;
    this.snapshot.measurementEquipment = this.snapshot.measurementEquipment.filter((item) => item.id !== id);
    return this.snapshot.measurementEquipment.length !== before;
  }

  async createSafetyAuthorization(input) {
    const item = createSafetyAuthorization(input, this.snapshot, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.safetyAuthorizations = [item, ...this.snapshot.safetyAuthorizations];
    return item;
  }

  async updateSafetyAuthorization(id, patch) {
    const current = this.snapshot.safetyAuthorizations.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateSafetyAuthorization(current, patch, this.snapshot, () => new Date().toISOString());
    this.snapshot.safetyAuthorizations = this.snapshot.safetyAuthorizations.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteSafetyAuthorization(id) {
    const before = this.snapshot.safetyAuthorizations.length;
    this.snapshot.safetyAuthorizations = this.snapshot.safetyAuthorizations.filter((item) => item.id !== id);
    return this.snapshot.safetyAuthorizations.length !== before;
  }

  async createDocumentTemplate(input, actor = null) {
    const item = createDocumentTemplate({
      ...input,
      createdByUserId: String(actor?.id ?? input.createdByUserId ?? ""),
      createdByLabel: actor?.fullName || actor?.username || input.createdByLabel || "Safety360",
    }, this.snapshot, () => crypto.randomUUID(), () => new Date().toISOString());
    this.snapshot.documentTemplates = [item, ...this.snapshot.documentTemplates];
    return item;
  }

  async updateDocumentTemplate(id, patch, actor = null) {
    const current = this.snapshot.documentTemplates.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateDocumentTemplate(current, {
      ...patch,
      createdByUserId: current.createdByUserId || String(actor?.id ?? ""),
      createdByLabel: current.createdByLabel || actor?.fullName || actor?.username || "Safety360",
    }, this.snapshot, () => new Date().toISOString());
    this.snapshot.documentTemplates = this.snapshot.documentTemplates.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteDocumentTemplate(id) {
    const before = this.snapshot.documentTemplates.length;
    this.snapshot.documentTemplates = this.snapshot.documentTemplates.filter((item) => item.id !== id);
    this.snapshot.serviceCatalog = this.snapshot.serviceCatalog.map((item) => ({
      ...item,
      linkedTemplateIds: (item.linkedTemplateIds ?? []).filter((entryId) => String(entryId) !== String(id)),
      linkedTemplateTitles: (item.linkedTemplateIds ?? []).some((entryId) => String(entryId) === String(id))
        ? []
        : [...(item.linkedTemplateTitles ?? [])],
      updatedAt: (item.linkedTemplateIds ?? []).some((entryId) => String(entryId) === String(id))
        ? new Date().toISOString()
        : item.updatedAt,
    }));
    this.snapshot.measurementEquipment = this.snapshot.measurementEquipment.map((item) => ({
      ...item,
      linkedTemplateIds: (item.linkedTemplateIds ?? []).filter((entryId) => String(entryId) !== String(id)),
      linkedTemplateTitles: (item.linkedTemplateIds ?? []).some((entryId) => String(entryId) === String(id))
        ? []
        : [...(item.linkedTemplateTitles ?? [])],
      updatedAt: (item.linkedTemplateIds ?? []).some((entryId) => String(entryId) === String(id))
        ? new Date().toISOString()
        : item.updatedAt,
    }));
    this.snapshot.safetyAuthorizations = this.snapshot.safetyAuthorizations.map((item) => ({
      ...item,
      linkedTemplateIds: (item.linkedTemplateIds ?? []).filter((entryId) => String(entryId) !== String(id)),
      linkedTemplateTitles: (item.linkedTemplateIds ?? []).some((entryId) => String(entryId) === String(id))
        ? []
        : [...(item.linkedTemplateTitles ?? [])],
      updatedAt: (item.linkedTemplateIds ?? []).some((entryId) => String(entryId) === String(id))
        ? new Date().toISOString()
        : item.updatedAt,
    }));
    return this.snapshot.documentTemplates.length !== before;
  }

  async listDocumentRecords(filters = {}) {
    const organizationId = dbString(filters.organizationId);
    const templateId = dbString(filters.templateId);
    const companyId = dbString(filters.companyId);
    const locationId = dbString(filters.locationId);
    const limit = Math.max(1, Math.min(50, Number.parseInt(filters.limit, 10) || 12));

    return (this.snapshot.documentRecords ?? [])
      .filter((item) => (
        (!organizationId || String(item.organizationId) === organizationId)
        && (!templateId || String(item.templateId) === templateId)
        && (!companyId || String(item.companyId) === companyId)
        && (!locationId || String(item.locationId) === locationId)
      ))
      .sort((left, right) => {
        const leftSortValue = left.inspectionDate || left.issuedDate || left.createdAt || "";
        const rightSortValue = right.inspectionDate || right.issuedDate || right.createdAt || "";
        return String(rightSortValue).localeCompare(String(leftSortValue))
          || String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
      })
      .slice(0, limit)
      .map((item) => cloneDocumentRecord(item));
  }

  async createDocumentRecord(input, actor = null) {
    const item = createDocumentRecordEntry(
      input,
      actor,
      () => crypto.randomUUID(),
      () => new Date().toISOString(),
    );
    this.snapshot.documentRecords = [item, ...(this.snapshot.documentRecords ?? [])];
    return cloneDocumentRecord(item);
  }

  async listMeasurementSheetPresets(filters = {}) {
    const organizationId = dbString(filters.organizationId);
    const templateId = dbString(filters.templateId);
    const companyId = dbString(filters.companyId);
    const locationId = dbString(filters.locationId);
    const fieldKey = dbString(filters.fieldKey);
    const limit = Math.max(1, Math.min(50, Number.parseInt(filters.limit, 10) || 12));

    return (this.snapshot.measurementSheetPresets ?? [])
      .filter((item) => (
        (!organizationId || String(item.organizationId) === organizationId)
        && (!templateId || String(item.templateId) === templateId)
        && (!companyId || String(item.companyId) === companyId)
        && (!locationId || String(item.locationId) === locationId)
        && (!fieldKey || String(item.fieldKey) === fieldKey)
      ))
      .sort((left, right) => String(right.updatedAt || right.createdAt || "").localeCompare(String(left.updatedAt || left.createdAt || "")))
      .slice(0, limit)
      .map((item) => cloneMeasurementSheetPreset(item));
  }

  async saveMeasurementSheetPreset(input, actor = null) {
    const entry = createMeasurementSheetPresetEntry(
      input,
      actor,
      () => crypto.randomUUID(),
      () => new Date().toISOString(),
    );
    const collection = [...(this.snapshot.measurementSheetPresets ?? [])];
    const index = collection.findIndex((item) => (
      String(item.organizationId) === String(entry.organizationId)
      && String(item.templateId) === String(entry.templateId)
      && String(item.companyId) === String(entry.companyId)
      && String(item.locationId) === String(entry.locationId)
      && String(item.fieldKey) === String(entry.fieldKey)
    ));

    if (index >= 0) {
      const current = collection[index];
      collection[index] = {
        ...current,
        ...entry,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: entry.updatedAt,
      };
    } else {
      collection.unshift(entry);
    }

    this.snapshot.measurementSheetPresets = collection;
    return cloneMeasurementSheetPreset(index >= 0 ? collection[index] : entry);
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
    this.objectStorage = getObjectStorageConfig();
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
      CREATE TABLE IF NOT EXISTS web_work_order_documents (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        work_order_id INT NOT NULL,
        actor_user_id INT NULL,
        actor_label VARCHAR(160) NOT NULL DEFAULT '',
        source_type VARCHAR(24) NOT NULL DEFAULT 'editor',
        file_name VARCHAR(255) NOT NULL,
        file_extension VARCHAR(24) NOT NULL DEFAULT '',
        file_type VARCHAR(160) NOT NULL DEFAULT '',
        file_description TEXT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        data_url LONGTEXT NOT NULL,
        storage_provider VARCHAR(32) NULL,
        storage_bucket VARCHAR(128) NULL,
        storage_key VARCHAR(512) NULL,
        storage_url TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_work_order_documents_work_order (work_order_id),
        INDEX idx_work_order_documents_created (created_at)
      )
    `);
    await ensureColumnExists(this.pool, "web_work_order_documents", "file_description", "TEXT NULL AFTER file_type");
    await ensureColumnExists(this.pool, "web_work_order_documents", "storage_provider", "VARCHAR(32) NULL AFTER data_url");
    await ensureColumnExists(this.pool, "web_work_order_documents", "storage_bucket", "VARCHAR(128) NULL AFTER storage_provider");
    await ensureColumnExists(this.pool, "web_work_order_documents", "storage_key", "VARCHAR(512) NULL AFTER storage_bucket");
    await ensureColumnExists(this.pool, "web_work_order_documents", "storage_url", "TEXT NULL AFTER storage_key");
    await ensureColumnExists(
      this.pool,
      "web_work_order_documents",
      "updated_at",
      "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
    );
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
      CREATE TABLE IF NOT EXISTS web_offers (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        company_id INT NOT NULL,
        location_id INT NULL,
        location_scope VARCHAR(16) NOT NULL DEFAULT 'single',
        offer_number VARCHAR(64) NOT NULL,
        offer_year INT NOT NULL,
        offer_sequence INT NOT NULL,
        offer_initials VARCHAR(16) NOT NULL DEFAULT '',
        title VARCHAR(180) NOT NULL,
        service_line VARCHAR(180) NOT NULL DEFAULT '',
        status VARCHAR(24) NOT NULL DEFAULT 'draft',
        offer_date DATE NULL,
        valid_until DATE NULL,
        note TEXT NOT NULL,
        currency_code VARCHAR(12) NOT NULL DEFAULT 'EUR',
        tax_rate DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
        discount_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        subtotal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        discount_total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        taxable_subtotal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        show_total_amount TINYINT(1) NOT NULL DEFAULT 1,
        tax_total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        grand_total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        items_json LONGTEXT NULL,
        contact_slot VARCHAR(16) NOT NULL DEFAULT '',
        contact_name VARCHAR(160) NOT NULL DEFAULT '',
        contact_phone VARCHAR(80) NOT NULL DEFAULT '',
        contact_email VARCHAR(180) NOT NULL DEFAULT '',
        created_by_user_id INT NULL,
        created_by_label VARCHAR(160) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_web_offers_org_number (organization_id, offer_number),
        INDEX idx_web_offers_org_status (organization_id, status),
        INDEX idx_web_offers_company (company_id),
        INDEX idx_web_offers_location (location_id),
        INDEX idx_web_offers_valid_until (valid_until)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_vehicles (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        name VARCHAR(180) NOT NULL,
        plate_number VARCHAR(32) NOT NULL,
        make_name VARCHAR(120) NOT NULL DEFAULT '',
        model_name VARCHAR(120) NOT NULL DEFAULT '',
        category VARCHAR(120) NOT NULL DEFAULT '',
        model_year INT NULL,
        color VARCHAR(60) NOT NULL DEFAULT '',
        fuel_type VARCHAR(60) NOT NULL DEFAULT '',
        transmission VARCHAR(60) NOT NULL DEFAULT '',
        seat_count INT NULL,
        odometer_km INT NOT NULL DEFAULT 0,
        service_due_date DATE NULL,
        registration_expires_on DATE NULL,
        notes TEXT NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'available',
        reservations_json LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_web_vehicles_org_plate (organization_id, plate_number),
        INDEX idx_web_vehicles_org_status (organization_id, status)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_legal_frameworks (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        title VARCHAR(220) NOT NULL,
        category VARCHAR(120) NOT NULL DEFAULT '',
        authority_name VARCHAR(180) NOT NULL DEFAULT '',
        reference_code VARCHAR(120) NOT NULL DEFAULT '',
        version_label VARCHAR(80) NOT NULL DEFAULT '',
        published_on DATE NULL,
        effective_from DATE NULL,
        review_date DATE NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        tags_text TEXT NULL,
        source_url VARCHAR(255) NOT NULL DEFAULT '',
        note TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_legal_frameworks_org_status (organization_id, status),
        INDEX idx_web_legal_frameworks_review (review_date)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_measurement_equipment (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        name VARCHAR(180) NOT NULL,
        equipment_kind VARCHAR(24) NOT NULL DEFAULT 'measurement',
        manufacturer VARCHAR(160) NOT NULL DEFAULT '',
        device_type VARCHAR(160) NOT NULL DEFAULT '',
        device_code VARCHAR(120) NOT NULL DEFAULT '',
        serial_number VARCHAR(120) NOT NULL DEFAULT '',
        inventory_number VARCHAR(80) NOT NULL DEFAULT '',
        requires_calibration TINYINT(1) NOT NULL DEFAULT 0,
        calibration_date DATE NULL,
        calibration_period VARCHAR(80) NOT NULL DEFAULT '',
        valid_until DATE NULL,
        note TEXT NULL,
        linked_template_ids_json LONGTEXT NULL,
        documents_json LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_measurement_equipment_org_valid (organization_id, valid_until),
        INDEX idx_web_measurement_equipment_inventory (organization_id, inventory_number)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_safety_authorizations (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        title VARCHAR(180) NOT NULL,
        authorization_scope VARCHAR(220) NOT NULL DEFAULT '',
        issued_on DATE NULL,
        valid_until DATE NULL,
        note TEXT NULL,
        linked_template_ids_json LONGTEXT NULL,
        documents_json LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_safety_authorizations_org_valid (organization_id, valid_until)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_document_templates (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        title VARCHAR(180) NOT NULL,
        document_type VARCHAR(120) NOT NULL DEFAULT 'Zapisnik',
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        description TEXT NULL,
        output_file_name VARCHAR(180) NOT NULL DEFAULT '',
        sample_company_id INT NULL,
        sample_location_id INT NULL,
        selected_legal_framework_ids_json LONGTEXT NULL,
        custom_fields_json LONGTEXT NULL,
        equipment_items_json LONGTEXT NULL,
        sections_json LONGTEXT NULL,
        reference_document_name VARCHAR(255) NOT NULL DEFAULT '',
        reference_document_type VARCHAR(160) NOT NULL DEFAULT '',
        reference_document_data_url LONGTEXT NULL,
        reference_document_storage_provider VARCHAR(32) NULL,
        reference_document_storage_bucket VARCHAR(128) NULL,
        reference_document_storage_key VARCHAR(512) NULL,
        reference_document_url TEXT NULL,
        created_by_user_id INT NULL,
        created_by_label VARCHAR(160) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_document_templates_org_status (organization_id, status),
        INDEX idx_web_document_templates_company (sample_company_id),
        INDEX idx_web_document_templates_location (sample_location_id)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_learning_tests (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        title VARCHAR(180) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'draft',
        description TEXT NULL,
        handbook_documents_json LONGTEXT NULL,
        video_items_json LONGTEXT NULL,
        question_items_json LONGTEXT NULL,
        assignment_items_json LONGTEXT NULL,
        attempt_items_json LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_learning_tests_org_status (organization_id, status),
        INDEX idx_web_learning_tests_updated (organization_id, updated_at)
      )
    `);
    await ensureColumnExists(this.pool, "web_measurement_equipment", "device_code", "VARCHAR(120) NOT NULL DEFAULT '' AFTER device_type");
    await ensureColumnExists(this.pool, "web_measurement_equipment", "serial_number", "VARCHAR(120) NOT NULL DEFAULT '' AFTER device_type");
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_document_records (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        template_id BIGINT NOT NULL,
        template_title VARCHAR(180) NOT NULL,
        document_type VARCHAR(120) NOT NULL DEFAULT 'Zapisnik',
        company_id INT NULL,
        location_id INT NULL,
        inspection_date DATE NULL,
        issued_date DATE NULL,
        values_json LONGTEXT NULL,
        measurement_sheets_json LONGTEXT NULL,
        created_by_user_id INT NULL,
        created_by_label VARCHAR(180) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_web_document_records_scope (organization_id, template_id, company_id, location_id),
        INDEX idx_web_document_records_dates (organization_id, inspection_date, issued_date, created_at)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_measurement_sheet_presets (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        template_id BIGINT NOT NULL,
        company_id INT NOT NULL,
        location_id INT NOT NULL,
        field_key VARCHAR(180) NOT NULL,
        title VARCHAR(180) NOT NULL DEFAULT 'Excel tablica',
        sheet_json LONGTEXT NOT NULL,
        created_by_user_id INT NULL,
        created_by_label VARCHAR(180) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_web_measurement_sheet_preset_scope (organization_id, template_id, company_id, location_id, field_key),
        INDEX idx_web_measurement_sheet_preset_lookup (organization_id, template_id, company_id, location_id),
        INDEX idx_web_measurement_sheet_preset_updated (organization_id, updated_at)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_service_catalog (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        name VARCHAR(180) NOT NULL,
        service_code VARCHAR(80) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        service_type VARCHAR(24) NOT NULL DEFAULT 'inspection',
        is_training TINYINT(1) NOT NULL DEFAULT 0,
        linked_template_ids_json LONGTEXT NULL,
        linked_learning_test_ids_json LONGTEXT NULL,
        note TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_web_service_catalog_org_code (organization_id, service_code),
        INDEX idx_web_service_catalog_org_status (organization_id, status)
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
    await ensureColumnExists(this.pool, "radni_nalozi", "izvrsitelji_json", "LONGTEXT NULL AFTER izvrsitelj_rn2");
    await ensureColumnExists(this.pool, "radni_nalozi", "tim_rn", "VARCHAR(160) NOT NULL DEFAULT '' AFTER izvrsitelji_json");
    await ensureColumnExists(this.pool, "radni_nalozi", "usluge_json", "LONGTEXT NULL AFTER usluge");
    await ensureColumnExists(this.pool, "radni_nalozi", "mjerenja_json", "LONGTEXT NULL AFTER usluge_json");
    await ensureColumnExists(this.pool, "radni_nalozi", "training_admin_name", "VARCHAR(160) NOT NULL DEFAULT '' AFTER rn_zavrsio");
    await ensureColumnExists(this.pool, "radni_nalozi", "training_admin_role", "VARCHAR(120) NOT NULL DEFAULT '' AFTER training_admin_name");
    await ensureColumnExists(this.pool, "radni_nalozi", "training_admin_phone", "VARCHAR(80) NOT NULL DEFAULT '' AFTER training_admin_role");
    await ensureColumnExists(this.pool, "radni_nalozi", "training_admin_email", "VARCHAR(180) NOT NULL DEFAULT '' AFTER training_admin_phone");
    await ensureColumnExists(this.pool, "web_service_catalog", "is_training", "TINYINT(1) NOT NULL DEFAULT 0 AFTER status");
    await ensureColumnExists(this.pool, "web_service_catalog", "service_type", "VARCHAR(24) NOT NULL DEFAULT 'inspection' AFTER status");
    await ensureColumnExists(this.pool, "web_service_catalog", "linked_learning_test_ids_json", "LONGTEXT NULL AFTER linked_template_ids_json");
    await this.pool.query(`
      UPDATE web_service_catalog
      SET service_type = CASE
        WHEN is_training = 1 THEN 'znr'
        ELSE 'inspection'
      END
      WHERE service_type IS NULL
        OR service_type = ''
    `);
    await ensureColumnExists(this.pool, "firme", "logo_data_url", "LONGTEXT NULL AFTER kontakt_email");
    await ensureColumnExists(this.pool, "firme", "logo_storage_provider", "VARCHAR(32) NULL AFTER logo_data_url");
    await ensureColumnExists(this.pool, "firme", "logo_storage_bucket", "VARCHAR(128) NULL AFTER logo_storage_provider");
    await ensureColumnExists(this.pool, "firme", "logo_storage_key", "VARCHAR(512) NULL AFTER logo_storage_bucket");
    await ensureColumnExists(this.pool, "firme", "logo_storage_url", "TEXT NULL AFTER logo_storage_key");
    await ensureColumnExists(this.pool, "web_document_templates", "reference_document_storage_provider", "VARCHAR(32) NULL AFTER reference_document_data_url");
    await ensureColumnExists(this.pool, "web_document_templates", "reference_document_storage_bucket", "VARCHAR(128) NULL AFTER reference_document_storage_provider");
    await ensureColumnExists(this.pool, "web_document_templates", "reference_document_storage_key", "VARCHAR(512) NULL AFTER reference_document_storage_bucket");
    await ensureColumnExists(this.pool, "web_document_templates", "reference_document_url", "TEXT NULL AFTER reference_document_storage_key");
    await ensureColumnExists(this.pool, "web_offers", "location_scope", "VARCHAR(16) NOT NULL DEFAULT 'single' AFTER location_id");
    await ensureColumnExists(this.pool, "web_offers", "offer_date", "DATE NULL AFTER status");
    await ensureColumnExists(this.pool, "web_offers", "discount_rate", "DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER tax_rate");
    await ensureColumnExists(this.pool, "web_offers", "discount_total_amount", "DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER subtotal_amount");
    await ensureColumnExists(this.pool, "web_offers", "taxable_subtotal_amount", "DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER discount_total_amount");
    await ensureColumnExists(this.pool, "web_offers", "show_total_amount", "TINYINT(1) NOT NULL DEFAULT 1 AFTER taxable_subtotal_amount");
    await ensureColumnExists(this.pool, "web_offers", "contact_slot", "VARCHAR(16) NOT NULL DEFAULT '' AFTER items_json");
    await ensureColumnExists(this.pool, "web_offers", "contact_name", "VARCHAR(160) NOT NULL DEFAULT '' AFTER contact_slot");
    await ensureColumnExists(this.pool, "web_offers", "contact_phone", "VARCHAR(80) NOT NULL DEFAULT '' AFTER contact_name");
    await ensureColumnExists(this.pool, "web_offers", "contact_email", "VARCHAR(180) NOT NULL DEFAULT '' AFTER contact_phone");
    await this.pool.query(`
      UPDATE web_offers
      SET location_scope = CASE
        WHEN location_id IS NULL THEN 'none'
        ELSE 'single'
      END
      WHERE location_scope IS NULL
        OR location_scope = ''
        OR (location_scope = 'single' AND location_id IS NULL)
    `);
    await ensureColumnExists(this.pool, "web_dashboard_widgets", "grid_column", "INT NOT NULL DEFAULT 1");
    await ensureColumnExists(this.pool, "web_dashboard_widgets", "grid_row", "INT NOT NULL DEFAULT 1");
    await ensureColumnExists(this.pool, "web_dashboard_widgets", "grid_width", "INT NOT NULL DEFAULT 4");
    await ensureColumnExists(this.pool, "web_dashboard_widgets", "grid_height", "INT NOT NULL DEFAULT 3");
    await backfillDashboardWidgetLayouts(this.pool);
    await migrateInlineCompanyLogosToObjectStorage(this.pool);
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
      const preparedLogo = await prepareStoredCompanyLogo({
        companyId: company.oib || company.name || "new-company",
        companyName: company.name,
        logoDataUrl: company.logoDataUrl,
      });

      const [result] = await connection.query(
        `
          INSERT INTO firme
            (naziv_tvrtke, sjediste, oib, predstavnik_korisnika, periodika, vrsta_ugovora,
             broj_ugovora, napomena, aktivno, kontakt_broj, kontakt_email,
             logo_data_url, logo_storage_provider, logo_storage_bucket, logo_storage_key, logo_storage_url,
             datum_izmjene, izmjenu_unio)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
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
          preparedLogo.storedLogo.dataUrl || null,
          preparedLogo.storedLogo.storageProvider || null,
          preparedLogo.storedLogo.storageBucket || null,
          preparedLogo.storedLogo.storageKey || null,
          preparedLogo.storedLogo.storageUrl || null,
          "SelfDash Web",
        ],
      );

      return {
        ...company,
        id: String(result.insertId),
        logoDataUrl: preparedLogo.storedLogo.dataUrl,
        logoStorageProvider: preparedLogo.storedLogo.storageProvider,
        logoStorageBucket: preparedLogo.storedLogo.storageBucket,
        logoStorageKey: preparedLogo.storedLogo.storageKey,
        logoStorageUrl: preparedLogo.storedLogo.storageUrl,
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
      const preparedLogo = await prepareStoredCompanyLogo({
        currentCompany: current,
        companyId: current.id,
        companyName: next.name,
        logoDataUrl: next.logoDataUrl,
      });

      await connection.query(
        `
          UPDATE firme
          SET naziv_tvrtke = ?, sjediste = ?, oib = ?, predstavnik_korisnika = ?, periodika = ?,
              vrsta_ugovora = ?, broj_ugovora = ?, napomena = ?, aktivno = ?, kontakt_broj = ?,
              kontakt_email = ?, logo_data_url = ?, logo_storage_provider = ?, logo_storage_bucket = ?,
              logo_storage_key = ?, logo_storage_url = ?, datum_izmjene = NOW(), izmjenu_unio = ?
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
          preparedLogo.storedLogo.dataUrl || null,
          preparedLogo.storedLogo.storageProvider || null,
          preparedLogo.storedLogo.storageBucket || null,
          preparedLogo.storedLogo.storageKey || null,
          preparedLogo.storedLogo.storageUrl || null,
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
      await cleanupStoredObjects(preparedLogo.previousStoredLogo ? [preparedLogo.previousStoredLogo] : []);
      return {
        ...next,
        logoDataUrl: preparedLogo.storedLogo.dataUrl,
        logoStorageProvider: preparedLogo.storedLogo.storageProvider,
        logoStorageBucket: preparedLogo.storedLogo.storageBucket,
        logoStorageKey: preparedLogo.storedLogo.storageKey,
        logoStorageUrl: preparedLogo.storedLogo.storageUrl,
      };
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
      const [[offerCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM web_offers WHERE company_id = ?",
        [Number(id)],
      );

      if (locationCount.total > 0 || workOrderCount.total > 0 || reminderCount.total > 0 || todoTaskCount.total > 0 || offerCount.total > 0) {
        throw new Error("Tvrtka je vec povezana s lokacijama, ponudama ili radnim nalozima.");
      }

      const [result] = await connection.query("DELETE FROM firme WHERE id = ?", [Number(id)]);
      await cleanupStoredObjects(current.logoStorageKey ? [current] : []);
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
      const [[offerCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM web_offers WHERE location_id = ?",
        [Number(id)],
      );

      if (workOrderCount.total > 0 || reminderCount.total > 0 || todoTaskCount.total > 0 || offerCount.total > 0) {
        await connection.rollback();
        throw new Error("Lokacija je vec povezana s ponudama ili radnim nalozima.");
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
             izvrsitelj_rn2, izvrsitelji_json, tim_rn, tagovi, status_rn, napomena_faktura, godina_rn, redni_broj,
             odjel, koordinate, usluge, usluge_json, mjerenja_json, opis, regija, datum_fakturiranja, tezina, rn_zavrsio,
             training_admin_name, training_admin_role, training_admin_phone, training_admin_email)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          JSON.stringify(draft.executors ?? []),
          draft.teamLabel,
          draft.tagText,
          draft.status,
          draft.invoiceNote,
          year,
          Number(String(brojRn).split("-")[1]),
          draft.department,
          draft.coordinates,
          draft.serviceLine,
          JSON.stringify(draft.serviceItems ?? []),
          draft.measurementSheet ? JSON.stringify(draft.measurementSheet) : null,
          draft.description,
          draft.region,
          draft.invoiceDate,
          parseNullableDecimal(draft.weight),
          draft.completedBy,
          draft.trainingContext?.name ?? "",
          draft.trainingContext?.role ?? "",
          draft.trainingContext?.phone ?? "",
          draft.trainingContext?.email ?? "",
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
              izvrsitelj_rn1 = ?, izvrsitelj_rn2 = ?, izvrsitelji_json = ?, tim_rn = ?, tagovi = ?, status_rn = ?, napomena_faktura = ?,
              odjel = ?, koordinate = ?, usluge = ?, usluge_json = ?, mjerenja_json = ?, opis = ?, regija = ?, datum_fakturiranja = ?,
              tezina = ?, rn_zavrsio = ?, training_admin_name = ?, training_admin_role = ?, training_admin_phone = ?, training_admin_email = ?
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
          JSON.stringify(next.executors ?? []),
          next.teamLabel,
          next.tagText,
          next.status,
          next.invoiceNote,
          next.department,
          next.coordinates,
          next.serviceLine,
          JSON.stringify(next.serviceItems ?? []),
          next.measurementSheet ? JSON.stringify(next.measurementSheet) : null,
          next.description,
          next.region,
          next.invoiceDate,
          parseNullableDecimal(next.weight),
          next.completedBy,
          next.trainingContext?.name ?? "",
          next.trainingContext?.role ?? "",
          next.trainingContext?.phone ?? "",
          next.trainingContext?.email ?? "",
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

  async addWorkOrderDocuments(workOrderId, files, actor = null, options = {}) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const workOrder = snapshot.workOrders.find((item) => String(item.id) === String(workOrderId));

      if (!workOrder) {
        await connection.rollback();
        return [];
      }

      const actorId = getActivityActorId(actor);
      const actorLabel = getActivityActorLabel(actor);
      const createdAt = new Date().toISOString();
      const createdDocuments = [];

      for (const file of Array.isArray(files) ? files : []) {
        const normalized = normalizeWorkOrderDocumentInput(file, options.sourceType);
        const storedDocument = await prepareStoredWorkOrderDocument(normalized, workOrderId);
        const [result] = await connection.query(
          `
            INSERT INTO web_work_order_documents
              (work_order_id, actor_user_id, actor_label, source_type, file_name, file_extension,
               file_type, file_description, file_size, data_url,
               storage_provider, storage_bucket, storage_key, storage_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            Number(workOrderId),
            actorId,
            actorLabel,
            storedDocument.sourceType,
            storedDocument.fileName,
            storedDocument.fileExtension,
            storedDocument.fileType,
            storedDocument.description,
            storedDocument.fileSize,
            storedDocument.inlineDataUrl,
            storedDocument.storageProvider,
            storedDocument.storageBucket,
            storedDocument.storageKey,
            storedDocument.storageUrl,
          ],
        );

        createdDocuments.push({
          id: String(result.insertId),
          workOrderId: String(workOrderId),
          actorLabel,
          actorUserId: actorId === null ? "" : String(actorId),
          sourceType: storedDocument.sourceType,
          fileName: storedDocument.fileName,
          fileExtension: storedDocument.fileExtension,
          fileType: storedDocument.fileType,
          description: storedDocument.description,
          fileSize: storedDocument.fileSize,
          dataUrl: storedDocument.dataUrl,
          storageProvider: storedDocument.storageProvider,
          storageBucket: storedDocument.storageBucket,
          storageKey: storedDocument.storageKey,
          storageUrl: storedDocument.storageUrl,
          createdAt,
          updatedAt: createdAt,
        });
      }

      await insertWorkOrderActivityEntries(
        connection,
        workOrderId,
        actor,
        buildWorkOrderDocumentActivityEntries(createdDocuments),
      );
      await connection.commit();

      return createdDocuments;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getWorkOrderDocuments(id) {
    const connection = await this.pool.getConnection();

    try {
      const [rows] = await connection.query(
        `
          SELECT id, work_order_id, actor_user_id, actor_label, source_type, file_name,
                 file_extension, file_type, file_description, file_size, data_url,
                 storage_provider, storage_bucket, storage_key, storage_url,
                 created_at, updated_at
          FROM web_work_order_documents
          WHERE work_order_id = ?
          ORDER BY created_at DESC, id DESC
          LIMIT 200
        `,
        [Number(id)],
      );

      return rows.map((row) => mapWorkOrderDocumentRow(row));
    } finally {
      connection.release();
    }
  }

  async updateWorkOrderDocument(workOrderId, documentId, patch, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.query(
        `
          SELECT id, work_order_id, actor_user_id, actor_label, source_type, file_name,
                 file_extension, file_type, file_description, file_size, data_url,
                 storage_provider, storage_bucket, storage_key, storage_url,
                 created_at, updated_at
          FROM web_work_order_documents
          WHERE work_order_id = ? AND id = ?
          LIMIT 1
        `,
        [Number(workOrderId), Number(documentId)],
      );
      const current = rows[0] ? mapWorkOrderDocumentRow(rows[0]) : null;

      if (!current) {
        await connection.rollback();
        return null;
      }

      const normalizedPatch = normalizeWorkOrderDocumentPatch(patch);
      const next = {
        ...current,
        fileName: Object.prototype.hasOwnProperty.call(normalizedPatch, "fileName") ? normalizedPatch.fileName : current.fileName,
        fileExtension: Object.prototype.hasOwnProperty.call(normalizedPatch, "fileName")
          ? (normalizedPatch.fileExtension || current.fileExtension)
          : current.fileExtension,
        description: Object.prototype.hasOwnProperty.call(normalizedPatch, "description") ? normalizedPatch.description : current.description,
        updatedAt: new Date().toISOString(),
      };

      await connection.query(
        `
          UPDATE web_work_order_documents
          SET file_name = ?, file_extension = ?, file_description = ?, updated_at = CURRENT_TIMESTAMP
          WHERE work_order_id = ? AND id = ?
        `,
        [
          next.fileName,
          next.fileExtension,
          next.description,
          Number(workOrderId),
          Number(documentId),
        ],
      );

      await insertWorkOrderActivityEntries(
        connection,
        workOrderId,
        actor,
        buildWorkOrderDocumentUpdatedActivityEntries(current, next),
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

  async deleteWorkOrderDocument(workOrderId, documentId, actor = null) {
    const connection = await this.pool.getConnection();
    let removedDocument = null;

    try {
      await connection.beginTransaction();

      const [rows] = await connection.query(
        `
          SELECT id, work_order_id, actor_user_id, actor_label, source_type, file_name,
                 file_extension, file_type, file_description, file_size, data_url,
                 storage_provider, storage_bucket, storage_key, storage_url,
                 created_at, updated_at
          FROM web_work_order_documents
          WHERE work_order_id = ? AND id = ?
          LIMIT 1
        `,
        [Number(workOrderId), Number(documentId)],
      );
      const current = rows[0] ? mapWorkOrderDocumentRow(rows[0]) : null;

      if (!current) {
        await connection.rollback();
        return false;
      }

      removedDocument = current;

      await connection.query(
        "DELETE FROM web_work_order_documents WHERE work_order_id = ? AND id = ?",
        [Number(workOrderId), Number(documentId)],
      );
      await insertWorkOrderActivityEntries(
        connection,
        workOrderId,
        actor,
        buildWorkOrderDocumentDeletedActivityEntries(current),
      );
      await connection.commit();
      await cleanupStoredObjects([removedDocument]);

      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteWorkOrder(id) {
    const connection = await this.pool.getConnection();
    let storedDocuments = [];

    try {
      await connection.beginTransaction();
      const [documentRows] = await connection.query(
        `
          SELECT storage_provider, storage_bucket, storage_key, storage_url
          FROM web_work_order_documents
          WHERE work_order_id = ?
        `,
        [Number(id)],
      );
      storedDocuments = documentRows.map((row) => mapWorkOrderDocumentRow(row));
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
      await connection.query("DELETE FROM web_work_order_activity_logs WHERE work_order_id = ?", [Number(id)]);
      await connection.query("DELETE FROM web_work_order_documents WHERE work_order_id = ?", [Number(id)]);
      const [result] = await connection.query("DELETE FROM radni_nalozi WHERE id = ?", [Number(id)]);
      await connection.commit();
      await cleanupStoredObjects(storedDocuments);
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
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

  async createOffer(input, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const numberParts = nextOfferNumber(snapshot.offers ?? [], {
        year: Number(new Date().toISOString().slice(0, 4)),
        initials: deriveOfferInitials(actor?.fullName || actor?.username || input.createdByLabel || ""),
      });
      const draft = createOffer({
        ...input,
        createdByUserId: String(actor?.id ?? input.createdByUserId ?? ""),
        createdByLabel: actor?.fullName || actor?.username || input.createdByLabel || "Safety360",
      }, snapshot, () => "pending", numberParts, () => new Date().toISOString());

      const [result] = await connection.query(
        `
          INSERT INTO web_offers
            (organization_id, company_id, location_id, location_scope, offer_number, offer_year, offer_sequence,
             offer_initials, title, service_line, status, offer_date, valid_until, note, currency_code,
             tax_rate, discount_rate, subtotal_amount, discount_total_amount, taxable_subtotal_amount,
             show_total_amount, tax_total_amount, grand_total_amount, items_json, contact_slot, contact_name,
             contact_phone, contact_email, created_by_user_id, created_by_label)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          Number(draft.companyId),
          parseNullableInteger(draft.locationId),
          draft.locationScope || "single",
          draft.offerNumber,
          Number(draft.offerYear),
          Number(draft.offerSequence),
          draft.offerInitials,
          draft.title,
          draft.serviceLine,
          draft.status,
          draft.offerDate,
          draft.validUntil,
          draft.note,
          draft.currency,
          parseNullableDecimal(draft.taxRate) ?? 0,
          parseNullableDecimal(draft.discountRate) ?? 0,
          parseNullableDecimal(draft.subtotal) ?? 0,
          parseNullableDecimal(draft.discountTotal) ?? 0,
          parseNullableDecimal(draft.taxableSubtotal) ?? 0,
          draft.showTotalAmount === false ? 0 : 1,
          parseNullableDecimal(draft.taxTotal) ?? 0,
          parseNullableDecimal(draft.total) ?? 0,
          JSON.stringify(draft.items ?? []),
          draft.contactSlot ?? "",
          draft.contactName ?? "",
          draft.contactPhone ?? "",
          draft.contactEmail ?? "",
          parseNullableInteger(draft.createdByUserId),
          draft.createdByLabel,
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

  async updateOffer(id, patch, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.offers.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateOffer(current, {
        ...patch,
        createdByUserId: current.createdByUserId || String(actor?.id ?? ""),
        createdByLabel: current.createdByLabel || actor?.fullName || actor?.username || "Safety360",
      }, snapshot, () => new Date().toISOString());

      await connection.query(
        `
          UPDATE web_offers
          SET company_id = ?, location_id = ?, location_scope = ?, title = ?, service_line = ?, status = ?,
              offer_date = ?, valid_until = ?, note = ?, currency_code = ?, tax_rate = ?, discount_rate = ?,
              subtotal_amount = ?, discount_total_amount = ?, taxable_subtotal_amount = ?, show_total_amount = ?,
              tax_total_amount = ?, grand_total_amount = ?, items_json = ?, contact_slot = ?, contact_name = ?,
              contact_phone = ?, contact_email = ?
          WHERE id = ?
        `,
        [
          Number(next.companyId),
          parseNullableInteger(next.locationId),
          next.locationScope || "single",
          next.title,
          next.serviceLine,
          next.status,
          next.offerDate,
          next.validUntil,
          next.note,
          next.currency,
          parseNullableDecimal(next.taxRate) ?? 0,
          parseNullableDecimal(next.discountRate) ?? 0,
          parseNullableDecimal(next.subtotal) ?? 0,
          parseNullableDecimal(next.discountTotal) ?? 0,
          parseNullableDecimal(next.taxableSubtotal) ?? 0,
          next.showTotalAmount === false ? 0 : 1,
          parseNullableDecimal(next.taxTotal) ?? 0,
          parseNullableDecimal(next.total) ?? 0,
          JSON.stringify(next.items ?? []),
          next.contactSlot ?? "",
          next.contactName ?? "",
          next.contactPhone ?? "",
          next.contactEmail ?? "",
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

  async deleteOffer(id) {
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query("DELETE FROM web_offers WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async createVehicle(input) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createVehicle(input, snapshot, () => "pending-vehicle", () => new Date().toISOString());
      const [result] = await connection.query(
        `
          INSERT INTO web_vehicles
            (organization_id, name, plate_number, make_name, model_name, category, model_year, color, fuel_type,
             transmission, seat_count, odometer_km, service_due_date, registration_expires_on, notes, status,
             reservations_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          draft.name,
          draft.plateNumber,
          draft.make,
          draft.model,
          draft.category,
          parseNullableInteger(draft.year),
          draft.color,
          draft.fuelType,
          draft.transmission,
          parseNullableInteger(draft.seatCount),
          parseNullableInteger(draft.odometerKm) ?? 0,
          draft.serviceDueDate,
          draft.registrationExpiresOn,
          draft.notes,
          draft.status,
          JSON.stringify(draft.reservations ?? []),
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

  async updateVehicle(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.vehicles.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateVehicle(current, patch, snapshot, () => new Date().toISOString());
      await connection.query(
        `
          UPDATE web_vehicles
          SET name = ?, plate_number = ?, make_name = ?, model_name = ?, category = ?, model_year = ?, color = ?,
              fuel_type = ?, transmission = ?, seat_count = ?, odometer_km = ?, service_due_date = ?,
              registration_expires_on = ?, notes = ?, status = ?, reservations_json = ?
          WHERE id = ?
        `,
        [
          next.name,
          next.plateNumber,
          next.make,
          next.model,
          next.category,
          parseNullableInteger(next.year),
          next.color,
          next.fuelType,
          next.transmission,
          parseNullableInteger(next.seatCount),
          parseNullableInteger(next.odometerKm) ?? 0,
          next.serviceDueDate,
          next.registrationExpiresOn,
          next.notes,
          next.status,
          JSON.stringify(next.reservations ?? []),
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

  async deleteVehicle(id) {
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query("DELETE FROM web_vehicles WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async createVehicleReservation(vehicleId, input, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.vehicles.find((item) => item.id === vehicleId);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = createVehicleReservation(current, {
        ...input,
        createdByUserId: String(actor?.id ?? input.createdByUserId ?? ""),
        createdByLabel: actor?.fullName || actor?.username || input.createdByLabel || "Safety360",
      }, () => "pending-reservation", () => new Date().toISOString());

      await connection.query(
        "UPDATE web_vehicles SET reservations_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [JSON.stringify(next.reservations ?? []), next.status, Number(vehicleId)],
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

  async updateVehicleReservation(vehicleId, reservationId, patch, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.vehicles.find((item) => item.id === vehicleId);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const currentReservation = (current.reservations ?? []).find((reservation) => String(reservation.id) === String(reservationId));

      if (!currentReservation) {
        await connection.rollback();
        return null;
      }

      const next = updateVehicleReservation(current, reservationId, {
        ...patch,
        createdByUserId: patch.createdByUserId ?? currentReservation.createdByUserId ?? String(actor?.id ?? ""),
        createdByLabel: patch.createdByLabel
          ?? currentReservation.createdByLabel
          ?? (actor?.fullName || actor?.username || "Safety360"),
      }, () => new Date().toISOString());

      await connection.query(
        "UPDATE web_vehicles SET reservations_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [JSON.stringify(next.reservations ?? []), next.status, Number(vehicleId)],
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

  async deleteVehicleReservation(vehicleId, reservationId) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.vehicles.find((item) => item.id === vehicleId);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = deleteVehicleReservation(current, reservationId, () => new Date().toISOString());

      if (!next) {
        await connection.rollback();
        return null;
      }

      await connection.query(
        "UPDATE web_vehicles SET reservations_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [JSON.stringify(next.reservations ?? []), next.status, Number(vehicleId)],
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

  async createServiceCatalogItem(input) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createServiceCatalogItem(input, snapshot, () => "pending-service-catalog", () => new Date().toISOString());
      const [result] = await connection.query(
        `
          INSERT INTO web_service_catalog
            (organization_id, name, service_code, status, service_type, is_training, linked_template_ids_json, linked_learning_test_ids_json, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          draft.name,
          draft.serviceCode,
          draft.status,
          draft.serviceType || (draft.isTraining ? "znr" : "inspection"),
          draft.isTraining ? 1 : 0,
          JSON.stringify(draft.linkedTemplateIds ?? []),
          JSON.stringify(draft.linkedLearningTestIds ?? []),
          draft.note,
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

  async updateServiceCatalogItem(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.serviceCatalog.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateServiceCatalogItem(current, patch, snapshot, () => new Date().toISOString());

      await connection.query(
        `
          UPDATE web_service_catalog
          SET organization_id = ?, name = ?, service_code = ?, status = ?, service_type = ?, is_training = ?, linked_template_ids_json = ?, linked_learning_test_ids_json = ?, note = ?
          WHERE id = ?
        `,
        [
          Number(next.organizationId),
          next.name,
          next.serviceCode,
          next.status,
          next.serviceType || (next.isTraining ? "znr" : "inspection"),
          next.isTraining ? 1 : 0,
          JSON.stringify(next.linkedTemplateIds ?? []),
          JSON.stringify(next.linkedLearningTestIds ?? []),
          next.note,
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

  async deleteServiceCatalogItem(id) {
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query("DELETE FROM web_service_catalog WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async createMeasurementEquipmentItem(input) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createMeasurementEquipmentItem(input, snapshot, () => "pending-measurement-equipment", () => new Date().toISOString());
      const preparedDocuments = await prepareStoredAttachmentDocuments(draft.documents, {
        keyPrefix: `measurement-equipment/${dbString(draft.organizationId) || "shared"}`,
      });
        const [result] = await connection.query(
        `
          INSERT INTO web_measurement_equipment
            (organization_id, name, equipment_kind, manufacturer, device_type, device_code, serial_number, inventory_number,
             requires_calibration, calibration_date, calibration_period, valid_until, note,
             linked_template_ids_json, documents_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          draft.name,
          draft.equipmentKind,
          draft.manufacturer,
          draft.deviceType,
          draft.deviceCode,
          draft.serialNumber,
          draft.inventoryNumber,
          draft.requiresCalibration ? 1 : 0,
          draft.calibrationDate,
          draft.calibrationPeriod,
          draft.validUntil,
          draft.note,
          JSON.stringify(draft.linkedTemplateIds ?? []),
          JSON.stringify(preparedDocuments.nextDocuments ?? []),
        ],
      );

      await connection.commit();
      return {
        ...draft,
        id: String(result.insertId),
        documents: preparedDocuments.nextDocuments ?? [],
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateMeasurementEquipmentItem(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.measurementEquipment.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateMeasurementEquipmentItem(current, patch, snapshot, () => new Date().toISOString());
      const preparedDocuments = await prepareStoredAttachmentDocuments(next.documents, {
        keyPrefix: `measurement-equipment/${dbString(next.organizationId) || "shared"}`,
        currentDocuments: current.documents,
      });

        await connection.query(
        `
          UPDATE web_measurement_equipment
          SET name = ?, equipment_kind = ?, manufacturer = ?, device_type = ?, device_code = ?, serial_number = ?, inventory_number = ?,
              requires_calibration = ?, calibration_date = ?, calibration_period = ?, valid_until = ?,
              note = ?, linked_template_ids_json = ?, documents_json = ?
          WHERE id = ?
        `,
        [
          next.name,
          next.equipmentKind,
          next.manufacturer,
          next.deviceType,
          next.deviceCode,
          next.serialNumber,
          next.inventoryNumber,
          next.requiresCalibration ? 1 : 0,
          next.calibrationDate,
          next.calibrationPeriod,
          next.validUntil,
          next.note,
          JSON.stringify(next.linkedTemplateIds ?? []),
          JSON.stringify(preparedDocuments.nextDocuments ?? []),
          Number(id),
        ],
      );

      await connection.commit();
      await cleanupStoredObjects(preparedDocuments.staleDocuments ?? []);
      return {
        ...next,
        documents: preparedDocuments.nextDocuments ?? [],
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteMeasurementEquipmentItem(id) {
    const connection = await this.pool.getConnection();
    let currentDocuments = [];

    try {
      await connection.beginTransaction();
      const snapshot = await fetchSnapshotFromConnection(connection);
      currentDocuments = snapshot.measurementEquipment.find((item) => item.id === id)?.documents ?? [];
      const [result] = await connection.query("DELETE FROM web_measurement_equipment WHERE id = ?", [Number(id)]);
      await connection.commit();
      await cleanupStoredObjects(currentDocuments);
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async createSafetyAuthorization(input) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createSafetyAuthorization(input, snapshot, () => "pending-safety-authorization", () => new Date().toISOString());
      const preparedDocuments = await prepareStoredAttachmentDocuments(draft.documents, {
        keyPrefix: `safety-authorizations/${dbString(draft.organizationId) || "shared"}`,
      });
      const [result] = await connection.query(
        `
          INSERT INTO web_safety_authorizations
            (organization_id, title, authorization_scope, issued_on, valid_until, note,
             linked_template_ids_json, documents_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          draft.title,
          draft.scope,
          draft.issuedOn,
          draft.validUntil,
          draft.note,
          JSON.stringify(draft.linkedTemplateIds ?? []),
          JSON.stringify(preparedDocuments.nextDocuments ?? []),
        ],
      );

      await connection.commit();
      return {
        ...draft,
        id: String(result.insertId),
        documents: preparedDocuments.nextDocuments ?? [],
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateSafetyAuthorization(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.safetyAuthorizations.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateSafetyAuthorization(current, patch, snapshot, () => new Date().toISOString());
      const preparedDocuments = await prepareStoredAttachmentDocuments(next.documents, {
        keyPrefix: `safety-authorizations/${dbString(next.organizationId) || "shared"}`,
        currentDocuments: current.documents,
      });

      await connection.query(
        `
          UPDATE web_safety_authorizations
          SET title = ?, authorization_scope = ?, issued_on = ?, valid_until = ?,
              note = ?, linked_template_ids_json = ?, documents_json = ?
          WHERE id = ?
        `,
        [
          next.title,
          next.scope,
          next.issuedOn,
          next.validUntil,
          next.note,
          JSON.stringify(next.linkedTemplateIds ?? []),
          JSON.stringify(preparedDocuments.nextDocuments ?? []),
          Number(id),
        ],
      );

      await connection.commit();
      await cleanupStoredObjects(preparedDocuments.staleDocuments ?? []);
      return {
        ...next,
        documents: preparedDocuments.nextDocuments ?? [],
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteSafetyAuthorization(id) {
    const connection = await this.pool.getConnection();
    let currentDocuments = [];

    try {
      await connection.beginTransaction();
      const snapshot = await fetchSnapshotFromConnection(connection);
      currentDocuments = snapshot.safetyAuthorizations.find((item) => item.id === id)?.documents ?? [];
      const [result] = await connection.query("DELETE FROM web_safety_authorizations WHERE id = ?", [Number(id)]);
      await connection.commit();
      await cleanupStoredObjects(currentDocuments);
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async createLegalFramework(input) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const timestamp = new Date().toISOString();
      const draft = createLegalFramework(input, snapshot, () => "pending-legal-framework", () => timestamp);
      const [result] = await connection.query(
        `
          INSERT INTO web_legal_frameworks
            (organization_id, title, category, authority_name, reference_code, version_label,
             published_on, effective_from, review_date, status, tags_text, source_url, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          draft.title,
          draft.category,
          draft.authority,
          draft.referenceCode,
          draft.versionLabel,
          draft.publishedOn,
          draft.effectiveFrom,
          draft.reviewDate,
          draft.status,
          draft.tagsText,
          draft.sourceUrl,
          draft.note,
        ],
      );

      await syncLegalFrameworkTemplatesInDatabase(connection, {
        organizationId: draft.organizationId,
        legalFrameworkId: String(result.insertId),
        linkedTemplateIds: input.linkedTemplateIds ?? [],
      });

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

  async updateLegalFramework(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.legalFrameworks.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const timestamp = new Date().toISOString();
      const next = updateLegalFramework(current, patch, snapshot, () => timestamp);

      await connection.query(
        `
          UPDATE web_legal_frameworks
          SET title = ?, category = ?, authority_name = ?, reference_code = ?, version_label = ?,
              published_on = ?, effective_from = ?, review_date = ?, status = ?, tags_text = ?,
              source_url = ?, note = ?
          WHERE id = ?
        `,
        [
          next.title,
          next.category,
          next.authority,
          next.referenceCode,
          next.versionLabel,
          next.publishedOn,
          next.effectiveFrom,
          next.reviewDate,
          next.status,
          next.tagsText,
          next.sourceUrl,
          next.note,
          Number(id),
        ],
      );

      if (Object.prototype.hasOwnProperty.call(patch, "linkedTemplateIds")) {
        await syncLegalFrameworkTemplatesInDatabase(connection, {
          organizationId: next.organizationId,
          legalFrameworkId: id,
          linkedTemplateIds: patch.linkedTemplateIds ?? [],
        });
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

  async deleteLegalFramework(id) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [templates] = await connection.query(
        "SELECT id, selected_legal_framework_ids_json FROM web_document_templates WHERE selected_legal_framework_ids_json IS NOT NULL",
      );

      for (const row of templates) {
        const currentIds = parseJsonArray(row.selected_legal_framework_ids_json).map((entry) => dbString(entry));
        const nextIds = currentIds.filter((entryId) => String(entryId) !== String(id));

        if (nextIds.length !== currentIds.length) {
          await connection.query(
            `
              UPDATE web_document_templates
              SET selected_legal_framework_ids_json = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `,
            [JSON.stringify(nextIds), Number(row.id)],
          );
        }
      }

      const [result] = await connection.query("DELETE FROM web_legal_frameworks WHERE id = ?", [Number(id)]);
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async createDocumentTemplate(input, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createDocumentTemplate({
        ...input,
        createdByUserId: String(actor?.id ?? input.createdByUserId ?? ""),
        createdByLabel: actor?.fullName || actor?.username || input.createdByLabel || "Safety360",
      }, snapshot, () => "pending-document-template", () => new Date().toISOString());
      const preparedReference = await prepareStoredReferenceDocument(draft.referenceDocument, {
        organizationId: draft.organizationId,
      });
      const persistedReference = preparedReference.nextReferenceDocument;

      const [result] = await connection.query(
        `
          INSERT INTO web_document_templates
            (organization_id, title, document_type, status, description, output_file_name,
             sample_company_id, sample_location_id, selected_legal_framework_ids_json,
             custom_fields_json, equipment_items_json, sections_json,
             reference_document_name, reference_document_type, reference_document_data_url,
             reference_document_storage_provider, reference_document_storage_bucket,
             reference_document_storage_key, reference_document_url,
             created_by_user_id, created_by_label)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(draft.organizationId),
          draft.title,
          draft.documentType,
          draft.status,
          draft.description,
          draft.outputFileName,
          parseNullableInteger(draft.sampleCompanyId),
          parseNullableInteger(draft.sampleLocationId),
          JSON.stringify(draft.selectedLegalFrameworkIds ?? []),
          JSON.stringify(draft.customFields ?? []),
          JSON.stringify(draft.equipmentItems ?? []),
          JSON.stringify(draft.sections ?? []),
          persistedReference?.fileName ?? "",
          persistedReference?.fileType ?? "",
          persistedReference?.inlineDataUrl ?? null,
          persistedReference?.storageProvider ?? "",
          persistedReference?.storageBucket ?? "",
          persistedReference?.storageKey ?? "",
          persistedReference?.storageUrl ?? null,
          parseNullableInteger(draft.createdByUserId),
          draft.createdByLabel,
        ],
      );

      await connection.commit();
      return {
        ...draft,
        id: String(result.insertId),
        referenceDocument: persistedReference
          ? {
            ...persistedReference,
            updatedAt: persistedReference.updatedAt || draft.updatedAt,
          }
          : null,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateDocumentTemplate(id, patch, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.documentTemplates.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateDocumentTemplate(current, {
        ...patch,
        createdByUserId: current.createdByUserId || String(actor?.id ?? ""),
        createdByLabel: current.createdByLabel || actor?.fullName || actor?.username || "Safety360",
      }, snapshot, () => new Date().toISOString());
      const preparedReference = await prepareStoredReferenceDocument(next.referenceDocument, {
        organizationId: next.organizationId,
        currentReferenceDocument: current.referenceDocument,
      });
      const persistedReference = preparedReference.nextReferenceDocument;

      await connection.query(
        `
          UPDATE web_document_templates
          SET title = ?, document_type = ?, status = ?, description = ?, output_file_name = ?,
              sample_company_id = ?, sample_location_id = ?, selected_legal_framework_ids_json = ?,
              custom_fields_json = ?, equipment_items_json = ?, sections_json = ?,
              reference_document_name = ?, reference_document_type = ?, reference_document_data_url = ?,
              reference_document_storage_provider = ?, reference_document_storage_bucket = ?,
              reference_document_storage_key = ?, reference_document_url = ?
          WHERE id = ?
        `,
        [
          next.title,
          next.documentType,
          next.status,
          next.description,
          next.outputFileName,
          parseNullableInteger(next.sampleCompanyId),
          parseNullableInteger(next.sampleLocationId),
          JSON.stringify(next.selectedLegalFrameworkIds ?? []),
          JSON.stringify(next.customFields ?? []),
          JSON.stringify(next.equipmentItems ?? []),
          JSON.stringify(next.sections ?? []),
          persistedReference?.fileName ?? "",
          persistedReference?.fileType ?? "",
          persistedReference?.inlineDataUrl ?? null,
          persistedReference?.storageProvider ?? "",
          persistedReference?.storageBucket ?? "",
          persistedReference?.storageKey ?? "",
          persistedReference?.storageUrl ?? null,
          Number(id),
        ],
      );

      await connection.commit();
      await cleanupStoredObjects([preparedReference.staleReferenceDocument].filter(Boolean));
      return {
        ...next,
        referenceDocument: persistedReference
          ? {
            ...persistedReference,
            updatedAt: persistedReference.updatedAt || next.updatedAt,
          }
          : null,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteDocumentTemplate(id) {
    const connection = await this.pool.getConnection();
    let currentReferenceDocument = null;

    try {
      await connection.beginTransaction();
      const snapshot = await fetchSnapshotFromConnection(connection);
      currentReferenceDocument = snapshot.documentTemplates.find((item) => item.id === id)?.referenceDocument ?? null;

      const [services] = await connection.query(
        "SELECT id, linked_template_ids_json FROM web_service_catalog WHERE linked_template_ids_json IS NOT NULL",
      );

      for (const row of services) {
        const currentIds = parseJsonArray(row.linked_template_ids_json).map((entry) => dbString(entry));
        const nextIds = currentIds.filter((entryId) => String(entryId) !== String(id));

        if (nextIds.length !== currentIds.length) {
          await connection.query(
            `
              UPDATE web_service_catalog
              SET linked_template_ids_json = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `,
            [JSON.stringify(nextIds), Number(row.id)],
          );
        }
      }

      const [equipmentRows] = await connection.query(
        "SELECT id, linked_template_ids_json FROM web_measurement_equipment WHERE linked_template_ids_json IS NOT NULL",
      );

      for (const row of equipmentRows) {
        const currentIds = parseJsonArray(row.linked_template_ids_json).map((entry) => dbString(entry));
        const nextIds = currentIds.filter((entryId) => String(entryId) !== String(id));

        if (nextIds.length !== currentIds.length) {
          await connection.query(
            `
              UPDATE web_measurement_equipment
              SET linked_template_ids_json = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `,
            [JSON.stringify(nextIds), Number(row.id)],
          );
        }
      }

      const [authorizationRows] = await connection.query(
        "SELECT id, linked_template_ids_json FROM web_safety_authorizations WHERE linked_template_ids_json IS NOT NULL",
      );

      for (const row of authorizationRows) {
        const currentIds = parseJsonArray(row.linked_template_ids_json).map((entry) => dbString(entry));
        const nextIds = currentIds.filter((entryId) => String(entryId) !== String(id));

        if (nextIds.length !== currentIds.length) {
          await connection.query(
            `
              UPDATE web_safety_authorizations
              SET linked_template_ids_json = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `,
            [JSON.stringify(nextIds), Number(row.id)],
          );
        }
      }

      const [result] = await connection.query("DELETE FROM web_document_templates WHERE id = ?", [Number(id)]);
      await connection.commit();
      await cleanupStoredObjects([currentReferenceDocument].filter(Boolean));
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async createLearningTestItem(input) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createLearningTest(input, snapshot, () => "pending-learning-test", () => new Date().toISOString());
      const preparedAssets = await prepareStoredLearningTestAssets(draft, null);
      const storedTest = {
        ...draft,
        handbookDocuments: preparedAssets.handbookDocuments,
        questionItems: preparedAssets.questionItems,
      };

      const [result] = await connection.query(
        `
          INSERT INTO web_learning_tests
            (organization_id, title, status, description, handbook_documents_json, video_items_json,
             question_items_json, assignment_items_json, attempt_items_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(storedTest.organizationId),
          storedTest.title,
          storedTest.status,
          storedTest.description,
          JSON.stringify(storedTest.handbookDocuments ?? []),
          JSON.stringify(storedTest.videoItems ?? []),
          JSON.stringify(storedTest.questionItems ?? []),
          JSON.stringify(storedTest.assignmentItems ?? []),
          JSON.stringify(storedTest.attemptItems ?? []),
        ],
      );

      await connection.commit();
      return {
        ...storedTest,
        id: String(result.insertId),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateLearningTestItem(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.learningTests.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateLearningTest(current, patch, snapshot, () => new Date().toISOString());
      const preparedAssets = await prepareStoredLearningTestAssets(next, current);
      const storedTest = {
        ...next,
        handbookDocuments: preparedAssets.handbookDocuments,
        questionItems: preparedAssets.questionItems,
      };

      await connection.query(
        `
          UPDATE web_learning_tests
          SET organization_id = ?, title = ?, status = ?, description = ?,
              handbook_documents_json = ?, video_items_json = ?, question_items_json = ?,
              assignment_items_json = ?, attempt_items_json = ?
          WHERE id = ?
        `,
        [
          Number(storedTest.organizationId),
          storedTest.title,
          storedTest.status,
          storedTest.description,
          JSON.stringify(storedTest.handbookDocuments ?? []),
          JSON.stringify(storedTest.videoItems ?? []),
          JSON.stringify(storedTest.questionItems ?? []),
          JSON.stringify(storedTest.assignmentItems ?? []),
          JSON.stringify(storedTest.attemptItems ?? []),
          Number(id),
        ],
      );

      await connection.commit();
      await cleanupStoredObjects(preparedAssets.staleDocuments ?? []);
      return storedTest;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteLearningTestItem(id) {
    const connection = await this.pool.getConnection();
    let staleDocuments = [];

    try {
      await connection.beginTransaction();
      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.learningTests.find((item) => item.id === id);
      staleDocuments = [
        ...(current?.handbookDocuments ?? []),
        ...((current?.questionItems ?? []).map((question) => question?.imageDocument).filter(Boolean)),
      ];
      const [result] = await connection.query("DELETE FROM web_learning_tests WHERE id = ?", [Number(id)]);
      await connection.commit();
      await cleanupStoredObjects(staleDocuments);
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getLearningAccessByToken(token) {
    const connection = await this.pool.getConnection();

    try {
      const snapshot = await fetchSnapshotFromConnection(connection);
      const safeToken = dbString(token);
      for (const test of snapshot.learningTests ?? []) {
        const assignment = (test.assignmentItems ?? []).find((item) => String(item.accessToken ?? "") === safeToken);

        if (assignment) {
          return sanitizeLearningTestAccess(test, {
            ...assignment,
            accessUrl: buildLearningAssignmentAccessUrl(assignment.accessToken),
          });
        }
      }
      return null;
    } finally {
      connection.release();
    }
  }

  async startLearningTestAccess(token) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      const snapshot = await fetchSnapshotFromConnection(connection);
      const safeToken = dbString(token);
      const current = snapshot.learningTests.find((test) => (
        (test.assignmentItems ?? []).some((item) => String(item.accessToken ?? "") === safeToken)
      ));

      if (!current) {
        await connection.rollback();
        return null;
      }

      const timestamp = new Date().toISOString();
      const assignmentItems = (current.assignmentItems ?? []).map((assignment) => (
        String(assignment.accessToken ?? "") === safeToken
          ? {
            ...assignment,
            status: assignment.status === "completed" ? "completed" : "in_progress",
            startedAt: assignment.startedAt || timestamp,
          }
          : assignment
      ));
      await connection.query(
        "UPDATE web_learning_tests SET assignment_items_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [JSON.stringify(assignmentItems), Number(current.id)],
      );

      await connection.commit();
      const nextAssignment = assignmentItems.find((assignment) => String(assignment.accessToken ?? "") === safeToken);
      return sanitizeLearningTestAccess({
        ...current,
        assignmentItems,
        updatedAt: timestamp,
      }, {
        ...nextAssignment,
        accessUrl: buildLearningAssignmentAccessUrl(nextAssignment?.accessToken),
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async submitLearningTestAccess(token, answers = []) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      const snapshot = await fetchSnapshotFromConnection(connection);
      const safeToken = dbString(token);
      const current = snapshot.learningTests.find((test) => (
        (test.assignmentItems ?? []).some((item) => String(item.accessToken ?? "") === safeToken)
      ));

      if (!current) {
        await connection.rollback();
        return null;
      }

      const currentAssignment = (current.assignmentItems ?? []).find((assignment) => String(assignment.accessToken ?? "") === safeToken);
      const scoring = scoreLearningTestSubmission(current, answers);
      const timestamp = new Date().toISOString();
      const assignmentItems = (current.assignmentItems ?? []).map((assignment) => (
        String(assignment.accessToken ?? "") === safeToken
          ? {
            ...assignment,
            status: "completed",
            startedAt: assignment.startedAt || timestamp,
            completedAt: timestamp,
            scorePercent: scoring.scorePercent,
          }
          : assignment
      ));
      const attemptItems = [
        ...(current.attemptItems ?? []),
        {
          id: crypto.randomUUID(),
          assignmentId: String(currentAssignment?.id ?? ""),
          userId: String(currentAssignment?.userId ?? ""),
          userLabel: String(currentAssignment?.userLabel ?? ""),
          answers: scoring.answers,
          scorePercent: scoring.scorePercent,
          submittedAt: timestamp,
        },
      ];

      await connection.query(
        `
          UPDATE web_learning_tests
          SET assignment_items_json = ?, attempt_items_json = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [JSON.stringify(assignmentItems), JSON.stringify(attemptItems), Number(current.id)],
      );

      await connection.commit();
      const nextAssignment = assignmentItems.find((assignment) => String(assignment.accessToken ?? "") === safeToken);
      return {
        ...sanitizeLearningTestAccess({
          ...current,
          assignmentItems,
          attemptItems,
          updatedAt: timestamp,
        }, {
          ...nextAssignment,
          accessUrl: buildLearningAssignmentAccessUrl(nextAssignment?.accessToken),
        }),
        submission: {
          scorePercent: scoring.scorePercent,
          submittedAt: timestamp,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async listDocumentRecords(filters = {}) {
    const connection = await this.pool.getConnection();

    try {
      const organizationId = Number(filters.organizationId);
      const templateId = Number(filters.templateId);
      const companyId = Number(filters.companyId);
      const locationId = Number(filters.locationId);
      const limit = Math.max(1, Math.min(50, Number.parseInt(filters.limit, 10) || 12));

      const conditions = [];
      const params = [];

      if (Number.isFinite(organizationId)) {
        conditions.push("organization_id = ?");
        params.push(organizationId);
      }
      if (Number.isFinite(templateId)) {
        conditions.push("template_id = ?");
        params.push(templateId);
      }
      if (Number.isFinite(companyId)) {
        conditions.push("company_id = ?");
        params.push(companyId);
      }
      if (Number.isFinite(locationId)) {
        conditions.push("location_id = ?");
        params.push(locationId);
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const [rows] = await connection.query(
        `
          SELECT id, organization_id, template_id, template_title, document_type,
                 company_id, location_id, inspection_date, issued_date,
                 values_json, measurement_sheets_json,
                 created_by_user_id, created_by_label, created_at, updated_at
          FROM web_document_records
          ${whereClause}
          ORDER BY COALESCE(inspection_date, issued_date, DATE(created_at)) DESC, created_at DESC, id DESC
          LIMIT ?
        `,
        [...params, limit],
      );

      return rows.map((row) => mapDocumentRecordRow(row));
    } finally {
      connection.release();
    }
  }

  async createDocumentRecord(input, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      const entry = createDocumentRecordEntry(input, actor);
      const [result] = await connection.query(
        `
          INSERT INTO web_document_records
            (organization_id, template_id, template_title, document_type,
             company_id, location_id, inspection_date, issued_date,
             values_json, measurement_sheets_json,
             created_by_user_id, created_by_label)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(entry.organizationId),
          Number(entry.templateId),
          entry.templateTitle,
          entry.documentType,
          entry.companyId ? Number(entry.companyId) : null,
          entry.locationId ? Number(entry.locationId) : null,
          entry.inspectionDate || null,
          entry.issuedDate || null,
          JSON.stringify(entry.fieldValues ?? {}),
          JSON.stringify(entry.fieldSheets ?? {}),
          entry.createdByUserId ? Number(entry.createdByUserId) : null,
          entry.createdByLabel,
        ],
      );

      const [rows] = await connection.query(
        `
          SELECT id, organization_id, template_id, template_title, document_type,
                 company_id, location_id, inspection_date, issued_date,
                 values_json, measurement_sheets_json,
                 created_by_user_id, created_by_label, created_at, updated_at
          FROM web_document_records
          WHERE id = ?
          LIMIT 1
        `,
        [Number(result.insertId)],
      );

      return rows[0] ? mapDocumentRecordRow(rows[0]) : entry;
    } finally {
      connection.release();
    }
  }

  async listMeasurementSheetPresets(filters = {}) {
    const connection = await this.pool.getConnection();

    try {
      const organizationId = Number(filters.organizationId);
      const templateId = Number(filters.templateId);
      const companyId = Number(filters.companyId);
      const locationId = Number(filters.locationId);
      const fieldKey = dbString(filters.fieldKey);
      const limit = Math.max(1, Math.min(50, Number.parseInt(filters.limit, 10) || 12));

      const conditions = [];
      const params = [];

      if (Number.isFinite(organizationId)) {
        conditions.push("organization_id = ?");
        params.push(organizationId);
      }
      if (Number.isFinite(templateId)) {
        conditions.push("template_id = ?");
        params.push(templateId);
      }
      if (Number.isFinite(companyId)) {
        conditions.push("company_id = ?");
        params.push(companyId);
      }
      if (Number.isFinite(locationId)) {
        conditions.push("location_id = ?");
        params.push(locationId);
      }
      if (fieldKey) {
        conditions.push("field_key = ?");
        params.push(fieldKey);
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const [rows] = await connection.query(
        `
          SELECT id, organization_id, template_id, company_id, location_id, field_key, title,
                 sheet_json, created_by_user_id, created_by_label, created_at, updated_at
          FROM web_measurement_sheet_presets
          ${whereClause}
          ORDER BY updated_at DESC, id DESC
          LIMIT ?
        `,
        [...params, limit],
      );

      return rows.map((row) => mapMeasurementSheetPresetRow(row));
    } finally {
      connection.release();
    }
  }

  async saveMeasurementSheetPreset(input, actor = null) {
    const connection = await this.pool.getConnection();

    try {
      const entry = createMeasurementSheetPresetEntry(input, actor);
      await connection.query(
        `
          INSERT INTO web_measurement_sheet_presets
            (organization_id, template_id, company_id, location_id, field_key, title,
             sheet_json, created_by_user_id, created_by_label)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            sheet_json = VALUES(sheet_json),
            created_by_user_id = VALUES(created_by_user_id),
            created_by_label = VALUES(created_by_label),
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          Number(entry.organizationId),
          Number(entry.templateId),
          Number(entry.companyId),
          Number(entry.locationId),
          entry.fieldKey,
          entry.title,
          JSON.stringify(entry.sheet),
          entry.createdByUserId ? Number(entry.createdByUserId) : null,
          entry.createdByLabel,
        ],
      );

      const [rows] = await connection.query(
        `
          SELECT id, organization_id, template_id, company_id, location_id, field_key, title,
                 sheet_json, created_by_user_id, created_by_label, created_at, updated_at
          FROM web_measurement_sheet_presets
          WHERE organization_id = ?
            AND template_id = ?
            AND company_id = ?
            AND location_id = ?
            AND field_key = ?
          ORDER BY updated_at DESC, id DESC
          LIMIT 1
        `,
        [
          Number(entry.organizationId),
          Number(entry.templateId),
          Number(entry.companyId),
          Number(entry.locationId),
          entry.fieldKey,
        ],
      );

      return rows[0] ? mapMeasurementSheetPresetRow(rows[0]) : entry;
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
