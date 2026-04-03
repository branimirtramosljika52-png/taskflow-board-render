import mysql from "mysql2/promise";

import {
  ROLE_ADMIN,
  ROLE_SUPER_ADMIN,
  ROLE_USER,
  buildLegacyEmail,
  canEditOrganization,
  canManageLoginContent,
  canManageOrganizations,
  canManageOrganizationUsers,
  normalizeRole,
  pickLoginContent,
  resolveEffectiveOrganizationId,
  splitFullName,
  toBooleanFlag,
} from "./accessControl.js";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  createPasswordHash,
  hashStoredToken,
  verifyPassword,
} from "./webAuth.js";
import { resolveSignupNotifyRecipients, sendMail } from "./mailer.js";
import {
  buildObjectStoragePublicUrl,
  deleteObjectFromStorage,
  getObjectStorageConfig,
  uploadDataUrlToObjectStorage,
} from "./objectStorage.js";

const DEFAULT_ORGANIZATION_NAME = "Default Organization";
const SIGNUP_STATUS_PENDING = "pending";
const SIGNUP_STATUS_APPROVED = "approved";
const SIGNUP_STATUS_REJECTED = "rejected";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function dbString(value) {
  return String(value ?? "").trim();
}

function normalizeOib(value) {
  return dbString(value).replace(/\s+/g, "");
}

function normalizeOrganizationIds(values = []) {
  const entries = Array.isArray(values)
    ? values
    : String(values ?? "")
      .split(",");

  return Array.from(new Set(
    entries
      .map((value) => dbString(value))
      .filter(Boolean),
  ));
}

function mergePrimaryOrganization(primaryOrganizationId, organizationIds = []) {
  const primaryId = dbString(primaryOrganizationId);
  const ids = normalizeOrganizationIds(organizationIds);

  if (!primaryId) {
    return ids;
  }

  return [primaryId, ...ids.filter((id) => id !== primaryId)];
}

function serializeOrganizationIds(primaryOrganizationId, organizationIds = []) {
  return mergePrimaryOrganization(primaryOrganizationId, organizationIds).join(",");
}

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isDataUrlLike(value = "") {
  return dbString(value).startsWith("data:");
}

function mapStoredAssetLocation({
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
  const storageConfig = getObjectStorageConfig();

  return {
    dataUrl: normalizedStorageUrl || normalizedDataUrl,
    storageProvider: normalizedStorageProvider,
    storageBucket: normalizedStorageBucket,
    storageKey: normalizedStorageKey,
    storageUrl: normalizedStorageUrl || (
      normalizedStorageProvider && normalizedStorageKey
        ? buildObjectStoragePublicUrl(normalizedStorageKey, {
          ...storageConfig,
          bucket: normalizedStorageBucket || storageConfig.bucket,
        })
        : ""
    ),
  };
}

function mapUserAvatarStorage(row = {}) {
  return mapStoredAssetLocation({
    dataUrl: row.avatar_data_url ?? row.avatarDataUrl,
    storageProvider: row.avatar_storage_provider ?? row.avatarStorageProvider,
    storageBucket: row.avatar_storage_bucket ?? row.avatarStorageBucket,
    storageKey: row.avatar_storage_key ?? row.avatarStorageKey,
    storageUrl: row.avatar_storage_url ?? row.avatarStorageUrl,
  });
}

function parseJsonObject(value, fallback = {}) {
  if (!value) {
    return { ...fallback };
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return { ...fallback, ...value };
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { ...fallback, ...parsed }
      : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapStoredAttachmentDocument(document = {}) {
  const storedDocument = mapStoredAssetLocation({
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
    createdAt: normalizeTimestamp(document.createdAt) ?? new Date().toISOString(),
    updatedAt: normalizeTimestamp(document.updatedAt ?? document.createdAt) ?? new Date().toISOString(),
  };
}

function mapUserElectricalQualification(row = {}) {
  const rawQualification = parseJsonObject(
    row.electrical_qualification_json ?? row.electricalQualification,
    {},
  );
  const storedSignature = mapStoredAssetLocation({
    dataUrl: rawQualification.signatureDataUrl,
    storageProvider: rawQualification.signatureStorageProvider,
    storageBucket: rawQualification.signatureStorageBucket,
    storageKey: rawQualification.signatureStorageKey,
    storageUrl: rawQualification.signatureStorageUrl,
  });

  const mapQualificationArea = (rawArea = {}, discipline = "elektro") => ({
    discipline: dbString(discipline || "elektro").toLowerCase() || "elektro",
    canInspect: toBooleanFlag(rawArea.canInspect, false),
    canAuthorize: toBooleanFlag(rawArea.canAuthorize, false),
    classCode: dbString(rawArea.classCode),
    urbroj: dbString(rawArea.urbroj),
    eBroj: dbString(rawArea.eBroj),
    signatureDataUrl: storedSignature.dataUrl,
    signatureStorageProvider: storedSignature.storageProvider,
    signatureStorageBucket: storedSignature.storageBucket,
    signatureStorageKey: storedSignature.storageKey,
    signatureStorageUrl: storedSignature.storageUrl,
    documents: [],
  });

  const mappedAdditionalAreas = Object.fromEntries(
    Object.entries(parseJsonObject(rawQualification.additionalAreas, {}))
      .map(([key, value]) => {
        const normalizedKey = dbString(key).toLowerCase();
        if (!normalizedKey || normalizedKey === "elektro") {
          return null;
        }

        return [normalizedKey, mapQualificationArea(parseJsonObject(value, {}), normalizedKey)];
      })
      .filter(Boolean),
  );

  return {
    ...mapQualificationArea(rawQualification, rawQualification.discipline || "elektro"),
    documents: parseJsonArray(rawQualification.documents)
      .map((document) => mapStoredAttachmentDocument(document))
      .filter((document) => document.fileName && document.dataUrl),
    additionalAreas: mappedAdditionalAreas,
  };
}

function mapUserDocuments(row = {}) {
  const hasDedicatedDocuments = (
    (row.user_documents_json !== undefined && row.user_documents_json !== null && String(row.user_documents_json).trim() !== "")
    || (row.userDocuments !== undefined && row.userDocuments !== null)
  );
  const mappedDocuments = parseJsonArray(
    row.user_documents_json ?? row.userDocuments,
  )
    .map((document) => mapStoredAttachmentDocument(document))
    .filter((document) => document.fileName && document.dataUrl);

  if (mappedDocuments.length > 0 || hasDedicatedDocuments) {
    return mappedDocuments;
  }

  return mapUserElectricalQualification(row).documents;
}

async function persistInlineAvatarToObjectStorage({
  userId = "",
  fullName = "",
  avatarDataUrl = "",
} = {}) {
  if (!isDataUrlLike(avatarDataUrl)) {
    return null;
  }

  return uploadDataUrlToObjectStorage({
    keyPrefix: `users/${dbString(userId) || "pending"}/avatar`,
    fileName: dbString(fullName) || "avatar",
    dataUrl: avatarDataUrl,
    cacheControl: "public, max-age=31536000, immutable",
  });
}

async function persistInlineUserElectricalDocumentToObjectStorage({
  userId = "",
  fallbackKey = "",
  fileName = "",
  fileType = "",
  dataUrl = "",
} = {}) {
  if (!isDataUrlLike(dataUrl)) {
    return null;
  }

  return uploadDataUrlToObjectStorage({
    keyPrefix: `users/${dbString(userId) || dbString(fallbackKey) || "pending"}/electrical`,
    fileName: dbString(fileName) || "elektro-dokument",
    fileType: dbString(fileType),
    dataUrl,
  });
}

async function persistInlineUserDocumentToObjectStorage({
  userId = "",
  fallbackKey = "",
  fileName = "",
  fileType = "",
  dataUrl = "",
} = {}) {
  if (!isDataUrlLike(dataUrl)) {
    return null;
  }

  return uploadDataUrlToObjectStorage({
    keyPrefix: `users/${dbString(userId) || dbString(fallbackKey) || "pending"}/documents`,
    fileName: dbString(fileName) || "user-dokument",
    fileType: dbString(fileType),
    dataUrl,
  });
}

async function cleanupStoredAssets(items = []) {
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

async function prepareStoredUserElectricalDocuments(documents = [], {
  userId = "",
  fallbackKey = "",
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

    const uploaded = await persistInlineUserElectricalDocumentToObjectStorage({
      userId,
      fallbackKey,
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

async function prepareStoredUserDocuments(documents = [], {
  userId = "",
  fallbackKey = "",
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

    const uploaded = await persistInlineUserDocumentToObjectStorage({
      userId,
      fallbackKey,
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

function mapUserElectricalSignatureStorage(qualification = {}) {
  return mapStoredAssetLocation({
    dataUrl: qualification?.signatureDataUrl,
    storageProvider: qualification?.signatureStorageProvider,
    storageBucket: qualification?.signatureStorageBucket,
    storageKey: qualification?.signatureStorageKey,
    storageUrl: qualification?.signatureStorageUrl,
  });
}

async function prepareStoredUserElectricalSignature({
  currentQualification = {},
  userId = "",
  fallbackKey = "",
  signatureDataUrl = "",
} = {}) {
  const currentStoredSignature = mapUserElectricalSignatureStorage(currentQualification);
  const nextSignatureDataUrl = dbString(signatureDataUrl);

  if (!nextSignatureDataUrl) {
    return {
      storedSignature: mapStoredAssetLocation(),
      previousStoredSignature: currentStoredSignature.storageKey ? currentStoredSignature : null,
    };
  }

  if (!isDataUrlLike(nextSignatureDataUrl)) {
    if (nextSignatureDataUrl === currentStoredSignature.dataUrl) {
      return {
        storedSignature: currentStoredSignature,
        previousStoredSignature: null,
      };
    }

    return {
      storedSignature: mapStoredAssetLocation({ dataUrl: nextSignatureDataUrl }),
      previousStoredSignature: currentStoredSignature.storageKey ? currentStoredSignature : null,
    };
  }

  const uploaded = await uploadDataUrlToObjectStorage({
    keyPrefix: `users/${dbString(userId) || dbString(fallbackKey) || "pending"}/electrical-signature`,
    fileName: "panik-rasvjeta-potpis",
    fileType: "image/png",
    dataUrl: nextSignatureDataUrl,
    cacheControl: "public, max-age=31536000, immutable",
  });

  return {
    storedSignature: mapStoredAssetLocation({
      dataUrl: uploaded?.storageUrl || nextSignatureDataUrl,
      storageProvider: uploaded?.storageProvider ?? "",
      storageBucket: uploaded?.storageBucket ?? "",
      storageKey: uploaded?.storageKey ?? "",
      storageUrl: uploaded?.storageUrl ?? "",
    }),
    previousStoredSignature: currentStoredSignature.storageKey ? currentStoredSignature : null,
  };
}

function normalizeUserElectricalQualification(input = {}, fallback = {}) {
  const source = {
    discipline: "elektro",
    canInspect: false,
    canAuthorize: false,
    classCode: "",
    urbroj: "",
    eBroj: "",
    signatureDataUrl: "",
    signatureStorageProvider: "",
    signatureStorageBucket: "",
    signatureStorageKey: "",
    signatureStorageUrl: "",
    documents: [],
    ...parseJsonObject(fallback, {}),
    ...(input && typeof input === "object" ? input : {}),
  };
  const storedSignature = mapStoredAssetLocation({
    dataUrl: source.signatureDataUrl,
    storageProvider: source.signatureStorageProvider,
    storageBucket: source.signatureStorageBucket,
    storageKey: source.signatureStorageKey,
    storageUrl: source.signatureStorageUrl,
  });

  return {
    discipline: dbString(source.discipline || "elektro").toLowerCase() || "elektro",
    canInspect: toBooleanFlag(source.canInspect, false),
    canAuthorize: toBooleanFlag(source.canAuthorize, false),
    classCode: dbString(source.classCode),
    urbroj: dbString(source.urbroj),
    eBroj: dbString(source.eBroj),
    signatureDataUrl: storedSignature.dataUrl,
    signatureStorageProvider: storedSignature.storageProvider,
    signatureStorageBucket: storedSignature.storageBucket,
    signatureStorageKey: storedSignature.storageKey,
    signatureStorageUrl: storedSignature.storageUrl,
    documents: (Array.isArray(source.documents) ? source.documents : [])
      .map((document) => mapStoredAttachmentDocument(document))
      .filter((document) => document.fileName && document.dataUrl),
    additionalAreas: Object.fromEntries(
      Object.entries(parseJsonObject(source.additionalAreas, {}))
        .map(([key, value]) => {
          const normalizedKey = dbString(key).toLowerCase();
          if (!normalizedKey || normalizedKey === "elektro") {
            return null;
          }

          const rawArea = parseJsonObject(value, {});
          return [normalizedKey, {
            discipline: normalizedKey,
            canInspect: toBooleanFlag(rawArea.canInspect, false),
            canAuthorize: toBooleanFlag(rawArea.canAuthorize, false),
            classCode: dbString(rawArea.classCode),
            urbroj: dbString(rawArea.urbroj),
            eBroj: dbString(rawArea.eBroj),
            signatureDataUrl: storedSignature.dataUrl,
            signatureStorageProvider: storedSignature.storageProvider,
            signatureStorageBucket: storedSignature.storageBucket,
            signatureStorageKey: storedSignature.storageKey,
            signatureStorageUrl: storedSignature.storageUrl,
            documents: [],
          }];
        })
        .filter(Boolean),
    ),
  };
}

function normalizeUserDocuments(input = [], fallback = []) {
  const source = Array.isArray(input)
    ? input
    : parseJsonArray(input, Array.isArray(fallback) ? fallback : parseJsonArray(fallback));

  return source
    .map((document) => mapStoredAttachmentDocument(document))
    .filter((document) => document.fileName && document.dataUrl);
}

async function prepareStoredUserAvatar({
  currentUser = {},
  userId = "",
  fullName = "",
  avatarDataUrl = "",
} = {}) {
  const currentStoredAvatar = mapUserAvatarStorage(currentUser);
  const nextAvatarDataUrl = dbString(avatarDataUrl);

  if (!nextAvatarDataUrl) {
    return {
      storedAvatar: mapStoredAssetLocation(),
      previousStoredAvatar: currentStoredAvatar.storageKey ? currentStoredAvatar : null,
    };
  }

  if (!isDataUrlLike(nextAvatarDataUrl)) {
    if (nextAvatarDataUrl === currentStoredAvatar.dataUrl) {
      return {
        storedAvatar: currentStoredAvatar,
        previousStoredAvatar: null,
      };
    }

    return {
      storedAvatar: mapStoredAssetLocation({ dataUrl: nextAvatarDataUrl }),
      previousStoredAvatar: currentStoredAvatar.storageKey ? currentStoredAvatar : null,
    };
  }

  const uploaded = await persistInlineAvatarToObjectStorage({
    userId,
    fullName,
    avatarDataUrl: nextAvatarDataUrl,
  });

  return {
    storedAvatar: mapStoredAssetLocation({
      dataUrl: uploaded?.storageUrl || nextAvatarDataUrl,
      storageProvider: uploaded?.storageProvider,
      storageBucket: uploaded?.storageBucket,
      storageKey: uploaded?.storageKey,
      storageUrl: uploaded?.storageUrl,
    }),
    previousStoredAvatar: currentStoredAvatar.storageKey ? currentStoredAvatar : null,
  };
}

async function migrateInlineAvatarsToObjectStorage(connection) {
  if (!getObjectStorageConfig().enabled) {
    return;
  }

  const [rows] = await connection.query(`
    SELECT id, first_name, last_name, avatar_data_url
    FROM app_users
    WHERE avatar_data_url IS NOT NULL
      AND avatar_data_url LIKE 'data:%'
  `);

  for (const row of rows) {
    const uploaded = await persistInlineAvatarToObjectStorage({
      userId: row.id,
      fullName: [row.first_name ?? "", row.last_name ?? ""].filter(Boolean).join(" "),
      avatarDataUrl: row.avatar_data_url,
    });

    if (!uploaded?.storageUrl) {
      continue;
    }

    await connection.query(
      `
        UPDATE app_users
        SET avatar_data_url = ?,
            avatar_storage_provider = ?,
            avatar_storage_bucket = ?,
            avatar_storage_key = ?,
            avatar_storage_url = ?,
            updated_at = CURRENT_TIMESTAMP
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
    connectionLimit: 6,
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

function sanitizeOrganization(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    name: row.name,
    oib: row.oib ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    postalCode: row.postal_code ?? "",
    country: row.country ?? "",
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_phone ?? "",
    status: row.status ?? "active",
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  };
}

function sanitizeUser(row) {
  if (!row) {
    return null;
  }

  const firstName = row.first_name ?? "";
  const lastName = row.last_name ?? "";
  const primaryOrganizationId = row.organization_id ? String(row.organization_id) : "";
  const organizationIds = mergePrimaryOrganization(primaryOrganizationId, row.organization_ids_csv);
  const storedAvatar = mapUserAvatarStorage(row);
  const electricalQualification = mapUserElectricalQualification(row);
  const userDocuments = mapUserDocuments(row);

  return {
    id: String(row.id),
    username: row.legacy_username ?? row.korisnicko_ime ?? row.email ?? "",
    email: row.email ?? buildLegacyEmail(row.korisnicko_ime ?? row.legacy_username ?? "", row.id),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || row.ime_prezime || row.korisnicko_ime || row.email || "User",
    organizationId: primaryOrganizationId || organizationIds[0] || "",
    organizationName: row.organization_name ?? "",
    organizationIds,
    organizations: Array.isArray(row.organizations) ? row.organizations : [],
    role: normalizeRole(row.role ?? row.razina_prava ?? ROLE_USER),
    isActive: row.is_active === undefined ? true : Boolean(Number(row.is_active)),
    legacyUsername: row.legacy_username ?? row.korisnicko_ime ?? "",
    avatarDataUrl: storedAvatar.dataUrl,
    avatarStorageProvider: storedAvatar.storageProvider,
    avatarStorageBucket: storedAvatar.storageBucket,
    avatarStorageKey: storedAvatar.storageKey,
    avatarStorageUrl: storedAvatar.storageUrl,
    documents: userDocuments,
    electricalQualification,
    lastLoginAt: normalizeTimestamp(row.last_login_at),
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  };
}

function sanitizeLoginContent(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    heading: row.heading ?? "",
    quoteText: row.quote_text ?? "",
    authorName: row.author_name ?? "",
    authorTitle: row.author_title ?? "",
    featureTitle: row.feature_title ?? "",
    featureBody: row.feature_body ?? "",
    accentLabel: row.accent_label ?? "",
    isActive: row.is_active === undefined ? true : Boolean(Number(row.is_active)),
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  };
}

function sanitizeSignupRequest(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    organizationName: row.organization_name ?? "",
    organizationOib: row.organization_oib ?? "",
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    fullName: [row.first_name ?? "", row.last_name ?? ""].filter(Boolean).join(" ").trim(),
    email: row.email ?? "",
    phone: row.phone ?? "",
    note: row.note ?? "",
    status: row.status ?? SIGNUP_STATUS_PENDING,
    organizationId: row.organization_id ? String(row.organization_id) : "",
    userId: row.user_id ? String(row.user_id) : "",
    processedNote: row.processed_note ?? "",
    emailStatus: row.email_status ?? "",
    emailError: row.email_error ?? "",
    requestedAt: normalizeTimestamp(row.requested_at ?? row.created_at),
    processedAt: normalizeTimestamp(row.processed_at),
  };
}

function normalizeOrganizationInput(input = {}) {
  return {
    name: dbString(input.name),
    oib: dbString(input.oib),
    address: dbString(input.address),
    city: dbString(input.city),
    postalCode: dbString(input.postalCode),
    country: dbString(input.country) || "Hrvatska",
    contactEmail: dbString(input.contactEmail),
    contactPhone: dbString(input.contactPhone),
    status: dbString(input.status).toLowerCase() === "inactive" ? "inactive" : "active",
  };
}

function normalizeUserInput(input = {}) {
  const organizationIds = normalizeOrganizationIds(input.organizationIds);
  const primaryOrganizationId = dbString(input.organizationId) || organizationIds[0] || "";
  const electricalQualification = normalizeUserElectricalQualification(
    input.electricalQualification,
    input.electricalQualification ?? input.electrical_qualification_json ?? {},
  );
  const documents = normalizeUserDocuments(
    input.documents,
    input.documents ?? input.user_documents_json ?? input.userDocuments ?? [],
  );

  return {
    firstName: dbString(input.firstName),
    lastName: dbString(input.lastName),
    email: dbString(input.email).toLowerCase(),
    password: dbString(input.password),
    role: normalizeRole(input.role),
    isActive: toBooleanFlag(input.isActive, true),
    organizationId: primaryOrganizationId,
    organizationIds: mergePrimaryOrganization(primaryOrganizationId, organizationIds),
    legacyUsername: dbString(input.legacyUsername),
    avatarDataUrl: dbString(input.avatarDataUrl),
    documents,
    electricalQualification,
  };
}

function normalizeLoginContentInput(input = {}) {
  return {
    heading: dbString(input.heading),
    quoteText: dbString(input.quoteText),
    authorName: dbString(input.authorName),
    authorTitle: dbString(input.authorTitle),
    featureTitle: dbString(input.featureTitle),
    featureBody: dbString(input.featureBody),
    accentLabel: dbString(input.accentLabel),
    isActive: toBooleanFlag(input.isActive, true),
  };
}

function normalizeSignupRequestInput(input = {}) {
  return {
    organizationName: dbString(input.organizationName),
    organizationOib: normalizeOib(input.organizationOib),
    firstName: dbString(input.firstName),
    lastName: dbString(input.lastName),
    email: dbString(input.email).toLowerCase(),
    password: dbString(input.password),
    phone: dbString(input.phone),
    note: dbString(input.note),
  };
}

function assertText(value, message) {
  if (!dbString(value)) {
    throw createHttpError(400, message);
  }
}

function assertOrganizationOib(value) {
  if (!/^\d{11}$/.test(normalizeOib(value))) {
    throw createHttpError(400, "OIB organizacije mora imati 11 znamenki.");
  }
}

function rethrowDatabaseError(error, fallbackMessage) {
  if (error?.statusCode) {
    throw error;
  }

  if (error?.code === "ER_DUP_ENTRY") {
    throw createHttpError(400, fallbackMessage);
  }

  throw error;
}

async function ensureColumn(connection, tableName, columnName, columnDefinition) {
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName],
  );

  if (rows.length === 0) {
    await connection.query(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
    );
  }
}

async function ensureSchema(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      oib VARCHAR(32) NOT NULL DEFAULT '',
      address VARCHAR(255) NOT NULL DEFAULT '',
      city VARCHAR(120) NOT NULL DEFAULT '',
      postal_code VARCHAR(32) NOT NULL DEFAULT '',
      country VARCHAR(120) NOT NULL DEFAULT 'Hrvatska',
      contact_email VARCHAR(255) NOT NULL DEFAULT '',
      contact_phone VARCHAR(64) NOT NULL DEFAULT '',
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_organizations_name (name)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      organization_id INT NULL,
      organization_ids_csv TEXT NULL,
      first_name VARCHAR(120) NOT NULL DEFAULT '',
      last_name VARCHAR(160) NOT NULL DEFAULT '',
      avatar_data_url LONGTEXT NULL,
      avatar_storage_provider VARCHAR(32) NULL,
      avatar_storage_bucket VARCHAR(128) NULL,
      avatar_storage_key VARCHAR(512) NULL,
      avatar_storage_url TEXT NULL,
      electrical_qualification_json LONGTEXT NULL,
      user_documents_json LONGTEXT NULL,
      email VARCHAR(255) NOT NULL,
      legacy_username VARCHAR(100) NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('super_admin', 'admin', 'user') NOT NULL DEFAULT 'user',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      last_login_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_app_users_email (email),
      UNIQUE KEY uniq_app_users_legacy_username (legacy_username),
      KEY idx_app_users_org (organization_id),
      KEY idx_app_users_role (role)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS organization_companies (
      organization_id INT NOT NULL,
      company_id INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (organization_id, company_id),
      UNIQUE KEY uniq_organization_companies_company (company_id),
      KEY idx_organization_companies_org (organization_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS login_content_items (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      heading VARCHAR(255) NOT NULL,
      quote_text TEXT NOT NULL,
      author_name VARCHAR(255) NOT NULL DEFAULT '',
      author_title VARCHAR(255) NOT NULL DEFAULT '',
      feature_title VARCHAR(255) NOT NULL DEFAULT '',
      feature_body TEXT NULL,
      accent_label VARCHAR(100) NOT NULL DEFAULT '',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_by_user_id INT NULL,
      updated_by_user_id INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_login_content_items_active (is_active)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS app_refresh_tokens (
      token_hash CHAR(64) PRIMARY KEY,
      user_id INT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_agent VARCHAR(255) NOT NULL DEFAULT '',
      ip_address VARCHAR(64) NOT NULL DEFAULT '',
      KEY idx_app_refresh_tokens_user_id (user_id),
      KEY idx_app_refresh_tokens_expires_at (expires_at)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS signup_requests (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      organization_name VARCHAR(255) NOT NULL,
      organization_oib VARCHAR(32) NOT NULL DEFAULT '',
      first_name VARCHAR(120) NOT NULL,
      last_name VARCHAR(160) NOT NULL DEFAULT '',
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL DEFAULT '',
      note TEXT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      organization_id INT NULL,
      user_id INT NULL,
      processed_note TEXT NULL,
      email_status VARCHAR(40) NOT NULL DEFAULT '',
      email_error TEXT NULL,
      requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME NULL,
      processed_by_user_id INT NULL,
      KEY idx_signup_requests_email (email),
      KEY idx_signup_requests_status (status),
      KEY idx_signup_requests_requested_at (requested_at)
    )
  `);

  await ensureColumn(
    connection,
    "app_users",
    "organization_ids_csv",
    "TEXT NULL AFTER organization_id",
  );

  await ensureColumn(
    connection,
    "app_users",
    "avatar_data_url",
    "LONGTEXT NULL AFTER last_name",
  );
  await ensureColumn(
    connection,
    "app_users",
    "avatar_storage_provider",
    "VARCHAR(32) NULL AFTER avatar_data_url",
  );
  await ensureColumn(
    connection,
    "app_users",
    "avatar_storage_bucket",
    "VARCHAR(128) NULL AFTER avatar_storage_provider",
  );
  await ensureColumn(
    connection,
    "app_users",
    "avatar_storage_key",
    "VARCHAR(512) NULL AFTER avatar_storage_bucket",
  );
  await ensureColumn(
    connection,
    "app_users",
    "avatar_storage_url",
    "TEXT NULL AFTER avatar_storage_key",
  );
  await ensureColumn(
    connection,
    "app_users",
    "electrical_qualification_json",
    "LONGTEXT NULL AFTER avatar_storage_url",
  );
  await ensureColumn(
    connection,
    "app_users",
    "user_documents_json",
    "LONGTEXT NULL AFTER electrical_qualification_json",
  );

  await ensureColumn(
    connection,
    "signup_requests",
    "organization_oib",
    "VARCHAR(32) NOT NULL DEFAULT '' AFTER organization_name",
  );

  await connection.query(`
    UPDATE app_users
    SET organization_ids_csv = CAST(organization_id AS CHAR)
    WHERE organization_id IS NOT NULL
      AND (organization_ids_csv IS NULL OR organization_ids_csv = '')
  `);
}

async function fetchOrganizations(connection, accessibleIds = null) {
  const ids = (accessibleIds ?? []).map((value) => Number(value)).filter(Number.isFinite);
  const hasFilter = Array.isArray(accessibleIds) && ids.length > 0;

  if (Array.isArray(accessibleIds) && ids.length === 0) {
    return [];
  }

  const [rows] = hasFilter
    ? await connection.query(
      `
        SELECT id, name, oib, address, city, postal_code, country, contact_email, contact_phone, status, created_at, updated_at
        FROM organizations
        WHERE id IN (?)
        ORDER BY name ASC
      `,
      [ids],
    )
    : await connection.query(`
        SELECT id, name, oib, address, city, postal_code, country, contact_email, contact_phone, status, created_at, updated_at
        FROM organizations
        ORDER BY name ASC
      `);

  return rows.map(sanitizeOrganization);
}

async function fetchUsers(connection, actor, effectiveOrganizationId, accessibleOrganizations = []) {
  const actorRole = normalizeRole(actor?.role);
  const activeOrganizationId = dbString(effectiveOrganizationId);
  const accessibleOrganizationIds = new Set(accessibleOrganizations.map((organization) => String(organization.id)));
  const [rows] = await connection.query(`
    SELECT u.id, u.organization_id, u.organization_ids_csv, u.first_name, u.last_name, u.avatar_data_url,
           u.avatar_storage_provider, u.avatar_storage_bucket, u.avatar_storage_key, u.avatar_storage_url,
           u.electrical_qualification_json, u.user_documents_json,
           u.email, u.legacy_username, u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at,
           o.name AS organization_name
    FROM app_users u
    LEFT JOIN organizations o ON o.id = u.organization_id
    ORDER BY o.name ASC, u.first_name ASC, u.last_name ASC, u.email ASC
  `);

  let users = rows.map(sanitizeUser);

  if (actorRole === ROLE_USER) {
    users = users.filter((user) => user.id === String(actor?.id));
  } else if (actorRole === ROLE_ADMIN) {
    users = users.filter((user) => (
      user.role !== ROLE_SUPER_ADMIN
      && user.organizationIds.includes(activeOrganizationId)
      && user.organizationIds.every((organizationId) => accessibleOrganizationIds.has(organizationId))
    ));
  } else if (activeOrganizationId) {
    users = users.filter((user) => (
      user.role === ROLE_SUPER_ADMIN || user.organizationIds.includes(activeOrganizationId)
    ));
  }

  return decorateUsersWithOrganizations(users, accessibleOrganizations);
}

async function fetchLoginContentItems(connection) {
  const [rows] = await connection.query(`
    SELECT id, heading, quote_text, author_name, author_title, feature_title, feature_body, accent_label, is_active, created_at, updated_at
    FROM login_content_items
    ORDER BY updated_at DESC, id DESC
  `);

  return rows.map(sanitizeLoginContent);
}

async function fetchSignupRequests(connection) {
  const [rows] = await connection.query(`
    SELECT id, organization_name, organization_oib, first_name, last_name, email, phone, note, status,
           organization_id, user_id, processed_note, email_status, email_error,
           requested_at, processed_at
    FROM signup_requests
    ORDER BY requested_at DESC, id DESC
  `);

  return rows.map(sanitizeSignupRequest);
}

async function fetchCompanyAssignments(connection) {
  const [rows] = await connection.query(`
    SELECT organization_id, company_id
    FROM organization_companies
  `);

  return rows.map((row) => ({
    organizationId: String(row.organization_id),
    companyId: String(row.company_id),
  }));
}

function buildScopedSnapshot(rawSnapshot, organizationId, assignments = [], actor = null) {
  const allowedCompanyIds = new Set(
    assignments
      .filter((assignment) => String(assignment.organizationId) === String(organizationId))
      .map((assignment) => String(assignment.companyId)),
  );

  return {
    companies: (rawSnapshot.companies ?? []).filter((item) => allowedCompanyIds.has(String(item.id))),
    locations: (rawSnapshot.locations ?? []).filter((item) => allowedCompanyIds.has(String(item.companyId))),
    workOrders: (rawSnapshot.workOrders ?? []).filter((item) => allowedCompanyIds.has(String(item.companyId))),
    reminders: (rawSnapshot.reminders ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
      || (item.companyId && allowedCompanyIds.has(String(item.companyId)))
    )),
    todoTasks: (rawSnapshot.todoTasks ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
      || (item.companyId && allowedCompanyIds.has(String(item.companyId)))
    )).map((item) => ({
      ...item,
      comments: (item.comments ?? []).map((comment) => ({ ...comment })),
    })),
    offers: (rawSnapshot.offers ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
      || (item.companyId && allowedCompanyIds.has(String(item.companyId)))
    )).map((item) => ({
      ...item,
      items: (item.items ?? []).map((entry) => ({ ...entry })),
    })),
    vehicles: (rawSnapshot.vehicles ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
    )).map((item) => ({
      ...item,
      reservations: (item.reservations ?? []).map((reservation) => ({
        ...reservation,
        reservedForUserIds: [...(reservation.reservedForUserIds ?? [])],
        reservedForLabels: [...(reservation.reservedForLabels ?? [])],
      })),
    })),
    legalFrameworks: (rawSnapshot.legalFrameworks ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
    )).map((item) => ({ ...item })),
    documentTemplates: (rawSnapshot.documentTemplates ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
    )).map((item) => ({
      ...item,
      selectedLegalFrameworkIds: [...(item.selectedLegalFrameworkIds ?? [])],
      customFields: (item.customFields ?? []).map((field) => ({ ...field })),
      equipmentItems: (item.equipmentItems ?? []).map((equipment) => ({ ...equipment })),
      sections: (item.sections ?? []).map((section) => ({
        ...section,
        columns: [...(section.columns ?? [])],
      })),
      referenceDocument: item.referenceDocument ? { ...item.referenceDocument } : null,
    })),
    serviceCatalog: (rawSnapshot.serviceCatalog ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
    )).map((item) => ({
      ...item,
      linkedTemplateIds: [...(item.linkedTemplateIds ?? [])],
      linkedTemplateTitles: [...(item.linkedTemplateTitles ?? [])],
    })),
    measurementEquipment: (rawSnapshot.measurementEquipment ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
    )).map((item) => ({
      ...item,
      linkedTemplateIds: [...(item.linkedTemplateIds ?? [])],
      linkedTemplateTitles: [...(item.linkedTemplateTitles ?? [])],
      documents: (item.documents ?? []).map((document) => ({ ...document })),
    })),
    safetyAuthorizations: (rawSnapshot.safetyAuthorizations ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
    )).map((item) => ({
      ...item,
      linkedTemplateIds: [...(item.linkedTemplateIds ?? [])],
      linkedTemplateTitles: [...(item.linkedTemplateTitles ?? [])],
      documents: (item.documents ?? []).map((document) => ({ ...document })),
    })),
    dashboardWidgets: (rawSnapshot.dashboardWidgets ?? []).filter((item) => (
      String(item.organizationId) === String(organizationId)
      && String(item.userId) === String(actor?.id ?? "")
    )).map((item) => ({
      ...item,
      filters: { ...(item.filters ?? {}) },
    })),
  };
}

function decorateUsersWithOrganizations(users = [], organizations = []) {
  const organizationsById = new Map(
    organizations.map((organization) => [String(organization.id), organization]),
  );

  return users.map((user) => {
    const organizationIds = mergePrimaryOrganization(user.organizationId, user.organizationIds);
    const resolvedOrganizations = organizationIds
      .map((organizationId) => {
        const organization = organizationsById.get(String(organizationId));

        if (!organization) {
          return null;
        }

        return {
          id: String(organization.id),
          name: organization.name,
        };
      })
      .filter(Boolean);
    const primaryOrganization = resolvedOrganizations.find((organization) => organization.id === user.organizationId)
      ?? resolvedOrganizations[0]
      ?? null;

    return {
      ...user,
      organizationId: primaryOrganization?.id ?? user.organizationId,
      organizationName: primaryOrganization?.name ?? user.organizationName ?? "",
      organizationIds,
      organizations: resolvedOrganizations,
    };
  });
}

async function fetchSuperAdminEmails(connection) {
  const [rows] = await connection.query(`
    SELECT email
    FROM app_users
    WHERE role = 'super_admin'
      AND is_active = 1
      AND COALESCE(email, '') <> ''
    ORDER BY id ASC
  `);

  return rows.map((row) => dbString(row.email).toLowerCase()).filter(Boolean);
}

async function updateSignupEmailStatus(connection, requestId, emailStatus, emailError = "") {
  await connection.query(
    `
      UPDATE signup_requests
      SET email_status = ?, email_error = ?
      WHERE id = ?
    `,
    [dbString(emailStatus), dbString(emailError), Number(requestId)],
  );
}

async function notifySignupSubmitted(connection, request) {
  const recipients = resolveSignupNotifyRecipients(await fetchSuperAdminEmails(connection));
  const fullName = [request.firstName, request.lastName].filter(Boolean).join(" ").trim() || request.email;
  const outgoing = [];

  if (recipients.length > 0) {
    outgoing.push(sendMail({
      to: recipients.join(", "),
      subject: `New signup request: ${request.organizationName}`,
      text: [
        "New signup request received.",
        `Organization: ${request.organizationName}`,
        request.organizationOib ? `Organization OIB: ${request.organizationOib}` : "",
        `Name: ${fullName}`,
        `Email: ${request.email}`,
        request.phone ? `Phone: ${request.phone}` : "",
        request.note ? `Note: ${request.note}` : "",
      ].filter(Boolean).join("\n"),
    }));
  }

  outgoing.push(sendMail({
    to: request.email,
    subject: "Safety360 signup request received",
    text: [
      `Hello ${request.firstName || fullName},`,
      "",
      "We received your signup request for Safety360.",
      "An administrator will review it and contact you shortly.",
      "",
      `Organization: ${request.organizationName}`,
      request.organizationOib ? `Organization OIB: ${request.organizationOib}` : "",
    ].filter(Boolean).join("\n"),
  }));

  const results = await Promise.all(outgoing);
  const firstFailure = results.find((item) => !item.ok && !item.skipped);
  const anySent = results.some((item) => item.ok);

  await updateSignupEmailStatus(
    connection,
    request.id,
    anySent ? "sent" : "skipped",
    firstFailure?.error ?? "",
  );
}

async function notifySignupDecision(connection, request, decision) {
  const subject = decision === SIGNUP_STATUS_APPROVED
    ? "Safety360 account approved"
    : "Safety360 signup request update";
  const text = decision === SIGNUP_STATUS_APPROVED
    ? [
      `Hello ${request.firstName || request.email},`,
      "",
      "Your Safety360 signup request has been approved.",
      "You can now sign in with your email address and password.",
      "",
      `Organization: ${request.organizationName}`,
    ].join("\n")
    : [
      `Hello ${request.firstName || request.email},`,
      "",
      "Your Safety360 signup request has been reviewed.",
      "Please contact the administrator for more details.",
      request.processedNote ? "" : null,
      request.processedNote ? `Note: ${request.processedNote}` : null,
    ].filter((value) => value !== null).join("\n");

  const result = await sendMail({
    to: request.email,
    subject,
    text,
  });

  await updateSignupEmailStatus(
    connection,
    request.id,
    result.ok ? "sent" : (result.skipped ? "skipped" : "error"),
    result.ok ? "" : result.error ?? "",
  );
}

async function seedDefaultData(connection) {
  const [[organizationCount]] = await connection.query("SELECT COUNT(*) AS total FROM organizations");

  if (Number(organizationCount.total) === 0) {
    await connection.query(
      `
        INSERT INTO organizations
          (name, oib, address, city, postal_code, country, contact_email, contact_phone, status)
        VALUES (?, '', '', '', '', 'Hrvatska', '', '', 'active')
      `,
      [DEFAULT_ORGANIZATION_NAME],
    );
  }

  const [[defaultOrganization]] = await connection.query(
    "SELECT id FROM organizations ORDER BY id ASC LIMIT 1",
  );
  const defaultOrganizationId = String(defaultOrganization?.id ?? "");
  const [[userCount]] = await connection.query("SELECT COUNT(*) AS total FROM app_users");

  if (Number(userCount.total) === 0) {
    const [legacyUsers] = await connection.query(`
      SELECT id, korisnicko_ime, lozinka_hash, ime_prezime, razina_prava
      FROM korisnici
      ORDER BY
        CASE WHEN razina_prava = 'admin' THEN 0 ELSE 1 END ASC,
        id ASC
    `);

    for (const [index, row] of legacyUsers.entries()) {
      const fullName = dbString(row.ime_prezime) || row.korisnicko_ime;
      const parts = splitFullName(fullName);
      const role = dbString(row.razina_prava).toLowerCase() === "admin"
        ? (index === 0 ? ROLE_SUPER_ADMIN : ROLE_ADMIN)
        : ROLE_USER;

      await connection.query(
        `
          INSERT INTO app_users
            (organization_id, organization_ids_csv, first_name, last_name, email, legacy_username, password_hash, role, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [
          Number(defaultOrganizationId),
          serializeOrganizationIds(defaultOrganizationId),
          parts.firstName,
          parts.lastName,
          buildLegacyEmail(row.korisnicko_ime, row.id),
          row.korisnicko_ime,
          row.lozinka_hash,
          role,
        ],
      );
    }
  }

  const [[superAdminCount]] = await connection.query(
    "SELECT COUNT(*) AS total FROM app_users WHERE role = 'super_admin'",
  );

  if (Number(superAdminCount.total) === 0) {
    const [[firstUser]] = await connection.query(
      "SELECT id FROM app_users ORDER BY id ASC LIMIT 1",
    );

    if (firstUser?.id) {
      await connection.query(
        "UPDATE app_users SET role = 'super_admin' WHERE id = ?",
        [Number(firstUser.id)],
      );
    }
  }

  const [[mappingCount]] = await connection.query("SELECT COUNT(*) AS total FROM organization_companies");

  if (Number(mappingCount.total) === 0 && defaultOrganizationId) {
    await connection.query(
      `
        INSERT INTO organization_companies (organization_id, company_id)
        SELECT ?, f.id
        FROM firme f
      `,
      [Number(defaultOrganizationId)],
    );
  }

  const [[loginContentCount]] = await connection.query("SELECT COUNT(*) AS total FROM login_content_items");

  if (Number(loginContentCount.total) === 0) {
    const seedItems = [
      {
        heading: "What's your clients' status today?",
        quoteText: "The whole team now sees the same client, the same location history and the same work order status without copy-paste chaos.",
        authorName: "Operations Lead",
        authorTitle: "Tenant workspace",
        featureTitle: "One source of truth for every organization",
        featureBody: "Super admins separate tenants cleanly while each admin keeps full control over their own client base.",
        accentLabel: "Live operations",
      },
      {
        heading: "A workspace built for service teams.",
        quoteText: "Admins manage their organization, users stay focused on execution, and every client portfolio stays neatly separated.",
        authorName: "Safety360",
        authorTitle: "Platform flow",
        featureTitle: "Multi-tenant by design",
        featureBody: "Organizations, companies, locations and work orders stay scoped correctly on every request.",
        accentLabel: "Secure tenancy",
      },
      {
        heading: "Keep every location and work order connected.",
        quoteText: "From the first request to the final invoice note, the workflow finally feels organized and predictable.",
        authorName: "Field Team",
        authorTitle: "Daily operations",
        featureTitle: "Clear structure across teams",
        featureBody: "Company masters, locations and RN lists stay aligned for every organization inside one platform.",
        accentLabel: "Structured flow",
      },
    ];

    for (const item of seedItems) {
      await connection.query(
        `
          INSERT INTO login_content_items
            (heading, quote_text, author_name, author_title, feature_title, feature_body, accent_label, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [
          item.heading,
          item.quoteText,
          item.authorName,
          item.authorTitle,
          item.featureTitle,
          item.featureBody,
          item.accentLabel,
        ],
      );
    }
  }
}

export class MemoryTenantRepository {
  constructor() {
    this.kind = "memory";
    this.organizations = [
      sanitizeOrganization({
        id: 1,
        name: DEFAULT_ORGANIZATION_NAME,
        country: "Hrvatska",
        status: "active",
      }),
    ];
    this.users = [];
    this.loginContentItems = [
      sanitizeLoginContent({
        id: 1,
        heading: "What's your clients' status today?",
        quote_text: "Organize companies, locations and work orders in one clean workspace.",
        author_name: "Safety360",
        author_title: "Local demo",
        feature_title: "Tenant-ready structure",
        feature_body: "Super admins manage organizations, admins manage their own team.",
        accent_label: "Demo mode",
        is_active: 1,
      }),
    ];
    this.companyAssignments = new Map();
    this.refreshTokens = new Map();
    this.signupRequests = [];
  }

  async init() {
    this.users = [
      {
        id: "1",
        organizationId: "1",
        organizationName: DEFAULT_ORGANIZATION_NAME,
        organizationIds: ["1"],
        organizations: [{ id: "1", name: DEFAULT_ORGANIZATION_NAME }],
        firstName: "Local",
        lastName: "Super Admin",
        fullName: "Local Super Admin",
        email: "admin@local.test",
        username: "admin",
        legacyUsername: "admin",
        role: ROLE_SUPER_ADMIN,
        isActive: true,
        avatarDataUrl: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
        passwordHash: await createPasswordHash("admin"),
      },
    ];
  }

  async close() {}

  async getPublicLoginScreen() {
    return pickLoginContent(this.loginContentItems);
  }

  async getUserById(userId) {
    const user = this.users.find((item) => item.id === String(userId));
    return user ? decorateUsersWithOrganizations([{ ...user }], this.organizations)[0] ?? null : null;
  }

  async authenticateUser(identifier, password) {
    const needle = dbString(identifier).toLowerCase();
    const user = this.users.find((item) => (
      item.email.toLowerCase() === needle
      || item.legacyUsername.toLowerCase() === needle
      || item.username.toLowerCase() === needle
    ));

    if (!user || !user.isActive) {
      return null;
    }

    const verification = await verifyPassword(password, user.passwordHash);

    if (!verification.ok) {
      return null;
    }

    if (verification.needsUpgrade) {
      user.passwordHash = await createPasswordHash(password);
    }

    user.lastLoginAt = new Date().toISOString();
    return this.getUserById(user.id);
  }

  async storeRefreshToken(user, token, metadata = {}) {
    const expiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS)).toISOString();
    this.refreshTokens.set(hashStoredToken(token), {
      userId: String(user.id),
      expiresAt,
    });

    return { user, expiresAt };
  }

  async rotateRefreshToken(currentToken, nextToken, metadata = {}) {
    const record = this.refreshTokens.get(hashStoredToken(currentToken));

    if (!record || Date.parse(record.expiresAt) <= Date.now()) {
      return null;
    }

    if (metadata.expectedUserId && String(metadata.expectedUserId) !== String(record.userId)) {
      return null;
    }

    const user = this.users.find((item) => item.id === record.userId);

    if (!user || !user.isActive) {
      return null;
    }

    this.refreshTokens.delete(hashStoredToken(currentToken));
    const expiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS)).toISOString();
    this.refreshTokens.set(hashStoredToken(nextToken), {
      userId: String(user.id),
      expiresAt,
    });

    return {
      user: await this.getUserById(user.id),
      expiresAt,
    };
  }

  async deleteRefreshToken(token) {
    return this.refreshTokens.delete(hashStoredToken(token));
  }

  async getSnapshot(actor, requestedOrganizationId, rawSnapshot = {
    companies: [],
    locations: [],
    workOrders: [],
    reminders: [],
    todoTasks: [],
    offers: [],
    vehicles: [],
    legalFrameworks: [],
    documentTemplates: [],
    serviceCatalog: [],
    measurementEquipment: [],
    safetyAuthorizations: [],
    dashboardWidgets: [],
  }) {
    const activeOrganizationId = resolveEffectiveOrganizationId(actor, requestedOrganizationId, this.organizations);
    const scopedSnapshot = buildScopedSnapshot(
      rawSnapshot,
      activeOrganizationId,
      Array.from(this.companyAssignments.entries()).map(([companyId, organizationId]) => ({
        companyId,
        organizationId,
      })),
      actor,
    );

    return {
      organizations: this.organizations.filter((organization) => (
        normalizeRole(actor?.role) === ROLE_SUPER_ADMIN
        || mergePrimaryOrganization(actor?.organizationId, actor?.organizationIds).includes(String(organization.id))
      )).map((item) => ({ ...item })),
      activeOrganizationId,
      currentOrganization: this.organizations.find((item) => item.id === activeOrganizationId) ?? null,
      users: decorateUsersWithOrganizations(
        normalizeRole(actor?.role) === ROLE_SUPER_ADMIN
          ? this.users.filter((item) => item.role === ROLE_SUPER_ADMIN || item.organizationIds.includes(String(activeOrganizationId)))
          : this.users.filter((item) => (
            item.role !== ROLE_SUPER_ADMIN
            && item.organizationIds.includes(String(activeOrganizationId))
            && item.organizationIds.every((organizationId) => mergePrimaryOrganization(actor?.organizationId, actor?.organizationIds).includes(organizationId))
          )),
        this.organizations.filter((organization) => (
          normalizeRole(actor?.role) === ROLE_SUPER_ADMIN
          || mergePrimaryOrganization(actor?.organizationId, actor?.organizationIds).includes(String(organization.id))
        )),
      ).map((item) => ({ ...item })),
      loginContentItems: canManageLoginContent(actor) ? this.loginContentItems.map((item) => ({ ...item })) : [],
      signupRequests: normalizeRole(actor?.role) === ROLE_SUPER_ADMIN
        ? this.signupRequests.map((item) => ({ ...item }))
        : [],
      ...scopedSnapshot,
    };
  }

  async createOrganization(actor, input) {
    if (!canManageOrganizations(actor)) {
      throw createHttpError(403, "Nemate pravo kreirati organizacije.");
    }

    const normalized = normalizeOrganizationInput(input);
    assertText(normalized.name, "Naziv organizacije je obavezan.");
    const next = {
      id: String(this.organizations.length + 1),
      ...normalized,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.organizations.push(next);
    return next;
  }

  async updateOrganization(actor, organizationId, patch) {
    if (!canEditOrganization(actor, organizationId)) {
      throw createHttpError(403, "Nemate pravo mijenjati ovu organizaciju.");
    }

    const current = this.organizations.find((item) => item.id === String(organizationId));

    if (!current) {
      return null;
    }

    Object.assign(current, normalizeOrganizationInput({ ...current, ...patch }), {
      updatedAt: new Date().toISOString(),
    });
    return { ...current };
  }

  async createUser(actor, input) {
    const normalized = normalizeUserInput(input);
    const targetOrganizationIds = normalized.organizationIds;
    const targetOrganizationId = normalized.organizationId || actor?.organizationId;

    if (!canManageOrganizationUsers(actor, targetOrganizationIds, normalized.role)) {
      throw createHttpError(403, "Nemate pravo kreirati ovog korisnika.");
    }

    assertText(normalized.email, "Email je obavezan.");
    assertText(normalized.password, "Lozinka je obavezna.");

    const organizations = this.organizations.filter((item) => targetOrganizationIds.includes(String(item.id)));

    if (organizations.length !== targetOrganizationIds.length || !targetOrganizationId) {
      throw createHttpError(400, "Odabrana organizacija ne postoji.");
    }

    const nextId = String(this.users.length + 1);
    const next = {
      id: nextId,
      organizationId: String(targetOrganizationId),
      organizationName: organizations.find((organization) => organization.id === String(targetOrganizationId))?.name ?? "",
      organizationIds: targetOrganizationIds,
      organizations: organizations.map((organization) => ({ id: organization.id, name: organization.name })),
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      fullName: [normalized.firstName, normalized.lastName].filter(Boolean).join(" "),
      email: normalized.email,
      username: normalized.legacyUsername || normalized.email,
      legacyUsername: normalized.legacyUsername || normalized.email,
      role: normalized.role,
      isActive: normalized.isActive,
      avatarDataUrl: normalized.avatarDataUrl,
      documents: normalizeUserDocuments(normalized.documents),
      electricalQualification: normalizeUserElectricalQualification(normalized.electricalQualification),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      passwordHash: await createPasswordHash(normalized.password),
    };
    this.users.push(next);
    return this.getUserById(nextId);
  }

  async updateUser(actor, userId, patch) {
    const current = this.users.find((item) => item.id === String(userId));

    if (!current) {
      return null;
    }

    const normalized = normalizeUserInput({ ...current, ...patch });
    const targetOrganizationIds = normalized.organizationIds;
    const targetOrganizationId = normalized.organizationId || current.organizationId;

    if (!canManageOrganizationUsers(actor, targetOrganizationIds, normalized.role)) {
      throw createHttpError(403, "Nemate pravo mijenjati ovog korisnika.");
    }

    const organizations = this.organizations.filter((item) => targetOrganizationIds.includes(String(item.id)));
    if (organizations.length !== targetOrganizationIds.length || !targetOrganizationId) {
      throw createHttpError(400, "Odabrana organizacija ne postoji.");
    }

    const organization = organizations.find((item) => item.id === String(targetOrganizationId));
    current.organizationId = String(targetOrganizationId);
    current.organizationName = organization?.name ?? "";
    current.organizationIds = targetOrganizationIds;
    current.organizations = organizations.map((item) => ({ id: item.id, name: item.name }));
    current.firstName = normalized.firstName;
    current.lastName = normalized.lastName;
    current.fullName = [normalized.firstName, normalized.lastName].filter(Boolean).join(" ");
    current.email = normalized.email;
    current.legacyUsername = normalized.legacyUsername || current.legacyUsername;
    current.username = current.legacyUsername || current.email;
    current.role = normalized.role;
    current.isActive = normalized.isActive;
    current.avatarDataUrl = normalized.avatarDataUrl || current.avatarDataUrl;
    current.documents = normalizeUserDocuments(normalized.documents, current.documents);
    current.electricalQualification = normalizeUserElectricalQualification(
      normalized.electricalQualification,
      current.electricalQualification,
    );
    current.updatedAt = new Date().toISOString();

    if (normalized.password) {
      current.passwordHash = await createPasswordHash(normalized.password);
    }

    return this.getUserById(current.id);
  }

  async updateOwnAvatar(actor, avatarDataUrl) {
    const current = this.users.find((item) => item.id === String(actor?.id));

    if (!current) {
      return null;
    }

    current.avatarDataUrl = dbString(avatarDataUrl);
    current.updatedAt = new Date().toISOString();
    return this.getUserById(current.id);
  }

  async createLoginContent(actor, input) {
    if (!canManageLoginContent(actor)) {
      throw createHttpError(403, "Nemate pravo upravljati login sadrzajem.");
    }

    const normalized = normalizeLoginContentInput(input);
    assertText(normalized.heading, "Naslov je obavezan.");
    assertText(normalized.quoteText, "Quote tekst je obavezan.");
    const next = {
      id: String(this.loginContentItems.length + 1),
      ...normalized,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.loginContentItems.unshift(next);
    return { ...next };
  }

  async updateLoginContent(actor, id, patch) {
    if (!canManageLoginContent(actor)) {
      throw createHttpError(403, "Nemate pravo upravljati login sadrzajem.");
    }

    const current = this.loginContentItems.find((item) => item.id === String(id));

    if (!current) {
      return null;
    }

    Object.assign(current, normalizeLoginContentInput({ ...current, ...patch }), {
      updatedAt: new Date().toISOString(),
    });
    return { ...current };
  }

  async deleteLoginContent(actor, id) {
    if (!canManageLoginContent(actor)) {
      throw createHttpError(403, "Nemate pravo upravljati login sadrzajem.");
    }

    const before = this.loginContentItems.length;
    this.loginContentItems = this.loginContentItems.filter((item) => item.id !== String(id));
    return this.loginContentItems.length !== before;
  }

  async submitSignupRequest(input) {
    const normalized = normalizeSignupRequestInput(input);
    assertText(normalized.organizationName, "Naziv organizacije je obavezan.");
    assertOrganizationOib(normalized.organizationOib);
    assertText(normalized.firstName, "Ime je obavezno.");
    assertText(normalized.lastName, "Prezime je obavezno.");
    assertText(normalized.email, "Email je obavezan.");
    assertText(normalized.password, "Lozinka je obavezna.");

    if (this.users.some((item) => item.email.toLowerCase() === normalized.email)) {
      throw createHttpError(400, "Korisnik s tim emailom vec postoji.");
    }

    if (this.signupRequests.some((item) => item.email.toLowerCase() === normalized.email && item.status === SIGNUP_STATUS_PENDING)) {
      throw createHttpError(400, "Zahtjev s tim emailom je vec poslan.");
    }

    const next = {
      id: String(this.signupRequests.length + 1),
      organizationName: normalized.organizationName,
      organizationOib: normalized.organizationOib,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      fullName: [normalized.firstName, normalized.lastName].filter(Boolean).join(" ").trim(),
      email: normalized.email,
      phone: normalized.phone,
      note: normalized.note,
      status: SIGNUP_STATUS_PENDING,
      organizationId: "",
      userId: "",
      processedNote: "",
      emailStatus: "skipped",
      emailError: "",
      requestedAt: new Date().toISOString(),
      processedAt: null,
      passwordHash: await createPasswordHash(normalized.password),
    };

    this.signupRequests.unshift(next);
    return {
      ok: true,
      request: { ...next, passwordHash: undefined },
      message: "Zahtjev za pristup je zaprimljen.",
    };
  }

  async approveSignupRequest(actor, requestId, input = {}) {
    if (normalizeRole(actor?.role) !== ROLE_SUPER_ADMIN) {
      throw createHttpError(403, "Nemate pravo odobravati signup zahtjeve.");
    }

    const request = this.signupRequests.find((item) => item.id === String(requestId));

    if (!request) {
      return null;
    }

    if (request.status !== SIGNUP_STATUS_PENDING) {
      throw createHttpError(400, "Zahtjev vise nije pending.");
    }

    const approvedRole = normalizeRole(input.role || ROLE_ADMIN);
    const useExistingOrganization = dbString(input.organizationId);
    let organization = this.organizations.find((item) => item.id === useExistingOrganization) ?? null;

    if (!organization) {
      organization = {
        id: String(this.organizations.length + 1),
        ...normalizeOrganizationInput({
          name: request.organizationName,
          oib: request.organizationOib,
          contactEmail: request.email,
          contactPhone: request.phone,
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.organizations.push(organization);
    }

    const user = {
      id: String(this.users.length + 1),
      organizationId: organization.id,
      organizationName: organization.name,
      organizationIds: [organization.id],
      organizations: [{ id: organization.id, name: organization.name }],
      firstName: request.firstName,
      lastName: request.lastName,
      fullName: request.fullName || [request.firstName, request.lastName].filter(Boolean).join(" ").trim(),
      email: request.email,
      username: request.email,
      legacyUsername: "",
      role: approvedRole === ROLE_SUPER_ADMIN ? ROLE_ADMIN : approvedRole,
      isActive: true,
      avatarDataUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      passwordHash: request.passwordHash,
    };
    this.users.push(user);

    request.status = SIGNUP_STATUS_APPROVED;
    request.organizationId = organization.id;
    request.userId = user.id;
    request.processedAt = new Date().toISOString();
    request.processedNote = dbString(input.processedNote);
    request.emailStatus = "skipped";
    request.emailError = "";

    return { ...request, passwordHash: undefined };
  }

  async rejectSignupRequest(actor, requestId, input = {}) {
    if (normalizeRole(actor?.role) !== ROLE_SUPER_ADMIN) {
      throw createHttpError(403, "Nemate pravo odbijati signup zahtjeve.");
    }

    const request = this.signupRequests.find((item) => item.id === String(requestId));

    if (!request) {
      return null;
    }

    if (request.status !== SIGNUP_STATUS_PENDING) {
      throw createHttpError(400, "Zahtjev vise nije pending.");
    }

    request.status = SIGNUP_STATUS_REJECTED;
    request.processedAt = new Date().toISOString();
    request.processedNote = dbString(input.processedNote);
    request.emailStatus = "skipped";
    request.emailError = "";
    return { ...request, passwordHash: undefined };
  }

  async assignCompanyToOrganization(organizationId, companyId) {
    this.companyAssignments.set(String(companyId), String(organizationId));
  }

  async removeCompanyAssignment(companyId) {
    this.companyAssignments.delete(String(companyId));
  }
}

export class MySqlTenantRepository {
  constructor(connectionString) {
    this.kind = "mysql";
    this.objectStorage = getObjectStorageConfig();
    this.pool = mysql.createPool(parseMySqlConnectionString(connectionString));
  }

  async init() {
    const connection = await this.pool.getConnection();

    try {
      await connection.query("SELECT 1");
      await ensureSchema(connection);
      await seedDefaultData(connection);
      await migrateInlineAvatarsToObjectStorage(connection);
    } finally {
      connection.release();
    }
  }

  async close() {
    await this.pool.end();
  }

  async getAccessibleOrganizations(connection, actor) {
    if (normalizeRole(actor?.role) === ROLE_SUPER_ADMIN) {
      return fetchOrganizations(connection);
    }

    const organizationIds = mergePrimaryOrganization(actor?.organizationId, actor?.organizationIds);

    if (organizationIds.length === 0) {
      return [];
    }

    return fetchOrganizations(connection, organizationIds);
  }

  async getContext(connection, actor, requestedOrganizationId) {
    const organizations = await this.getAccessibleOrganizations(connection, actor);
    const activeOrganizationId = resolveEffectiveOrganizationId(actor, requestedOrganizationId, organizations);
    const currentOrganization = organizations.find((item) => item.id === activeOrganizationId) ?? null;

    if (!currentOrganization && normalizeRole(actor?.role) !== ROLE_SUPER_ADMIN) {
      throw createHttpError(403, "Nemate pristup odabranoj organizaciji.");
    }

    return {
      organizations,
      activeOrganizationId,
      currentOrganization,
    };
  }

  async getPublicLoginScreen() {
    const connection = await this.pool.getConnection();

    try {
      const items = await fetchLoginContentItems(connection);
      return pickLoginContent(items);
    } finally {
      connection.release();
    }
  }

  async getUserById(userId) {
    const connection = await this.pool.getConnection();

    try {
      const [rows] = await connection.query(
        `
          SELECT u.id, u.organization_id, u.organization_ids_csv, u.first_name, u.last_name, u.avatar_data_url,
                 u.avatar_storage_provider, u.avatar_storage_bucket, u.avatar_storage_key, u.avatar_storage_url,
                 u.electrical_qualification_json, u.user_documents_json,
                 u.email, u.legacy_username, u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at,
                 o.name AS organization_name
          FROM app_users u
          LEFT JOIN organizations o ON o.id = u.organization_id
          WHERE u.id = ?
          LIMIT 1
        `,
        [Number(userId)],
      );

      if (!rows[0]) {
        return null;
      }

      const user = sanitizeUser(rows[0]);
      const organizations = await fetchOrganizations(connection, user.organizationIds);
      return decorateUsersWithOrganizations([user], organizations)[0] ?? null;
    } finally {
      connection.release();
    }
  }

  async authenticateUser(identifier, password) {
    const connection = await this.pool.getConnection();

    try {
      const needle = dbString(identifier).toLowerCase();
      const [rows] = await connection.query(
        `
          SELECT u.id, u.organization_id, u.organization_ids_csv, u.first_name, u.last_name, u.avatar_data_url,
                 u.avatar_storage_provider, u.avatar_storage_bucket, u.avatar_storage_key, u.avatar_storage_url,
                 u.electrical_qualification_json, u.user_documents_json,
                 u.email, u.legacy_username,
                 u.password_hash, u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at,
                 o.name AS organization_name, o.status AS organization_status
          FROM app_users u
          LEFT JOIN organizations o ON o.id = u.organization_id
          WHERE LOWER(u.email) = ? OR LOWER(COALESCE(u.legacy_username, '')) = ?
          LIMIT 1
        `,
        [needle, needle],
      );

      const userRow = rows[0];

      if (!userRow || !Boolean(Number(userRow.is_active))) {
        return null;
      }

      if (userRow.organization_status && userRow.organization_status !== "active" && normalizeRole(userRow.role) !== ROLE_SUPER_ADMIN) {
        return null;
      }

      const verification = await verifyPassword(password, userRow.password_hash);

      if (!verification.ok) {
        return null;
      }

      if (verification.needsUpgrade) {
        const nextHash = await createPasswordHash(password);
        await connection.query(
          "UPDATE app_users SET password_hash = ? WHERE id = ?",
          [nextHash, Number(userRow.id)],
        );
      }

      await connection.query(
        "UPDATE app_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",
        [Number(userRow.id)],
      );

      return this.getUserById(userRow.id);
    } finally {
      connection.release();
    }
  }

  async storeRefreshToken(user, token, metadata = {}) {
    const connection = await this.pool.getConnection();

    try {
      const tokenHash = hashStoredToken(token);
      const expiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS));

      await connection.query("DELETE FROM app_refresh_tokens WHERE expires_at <= UTC_TIMESTAMP()");
      await connection.query(
        `
          INSERT INTO app_refresh_tokens (token_hash, user_id, expires_at, user_agent, ip_address)
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

      const [rows] = await connection.query(
        `
          SELECT u.id, u.organization_id, u.organization_ids_csv, u.first_name, u.last_name, u.avatar_data_url,
                 u.avatar_storage_provider, u.avatar_storage_bucket, u.avatar_storage_key, u.avatar_storage_url,
                 u.electrical_qualification_json, u.user_documents_json,
                 u.email, u.legacy_username,
                 u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at,
                 o.name AS organization_name
          FROM app_refresh_tokens rt
          INNER JOIN app_users u ON u.id = rt.user_id
          LEFT JOIN organizations o ON o.id = u.organization_id
          WHERE rt.token_hash = ?
            AND rt.expires_at > UTC_TIMESTAMP()
          LIMIT 1
        `,
        [hashStoredToken(currentToken)],
      );

      const userRow = rows[0];

      if (!userRow || !Boolean(Number(userRow.is_active))) {
        await connection.rollback();
        return null;
      }

      if (metadata.expectedUserId && String(userRow.id) !== String(metadata.expectedUserId)) {
        await connection.rollback();
        return null;
      }

      const nextExpiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS));
      await connection.query(
        `
          UPDATE app_refresh_tokens
          SET token_hash = ?, expires_at = ?, last_seen_at = CURRENT_TIMESTAMP, user_agent = ?, ip_address = ?
          WHERE token_hash = ?
        `,
        [
          hashStoredToken(nextToken),
          nextExpiresAt,
          dbString(metadata.userAgent).slice(0, 255),
          dbString(metadata.ipAddress).slice(0, 64),
          hashStoredToken(currentToken),
        ],
      );

      await connection.commit();

      return {
        user: await this.getUserById(userRow.id),
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
        "DELETE FROM app_refresh_tokens WHERE token_hash = ?",
        [hashStoredToken(token)],
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async getSnapshot(actor, requestedOrganizationId, rawSnapshot = {
    companies: [],
    locations: [],
    workOrders: [],
    reminders: [],
    todoTasks: [],
    offers: [],
    vehicles: [],
    legalFrameworks: [],
    documentTemplates: [],
    serviceCatalog: [],
    measurementEquipment: [],
    safetyAuthorizations: [],
    dashboardWidgets: [],
  }) {
    const connection = await this.pool.getConnection();

    try {
      const context = await this.getContext(connection, actor, requestedOrganizationId);
      const assignments = await fetchCompanyAssignments(connection);
      const scopedSnapshot = context.activeOrganizationId
        ? buildScopedSnapshot(rawSnapshot, context.activeOrganizationId, assignments, actor)
        : {
          companies: [],
          locations: [],
        workOrders: [],
        reminders: [],
        todoTasks: [],
        offers: [],
        vehicles: [],
        legalFrameworks: [],
        documentTemplates: [],
        serviceCatalog: [],
        measurementEquipment: [],
        safetyAuthorizations: [],
        dashboardWidgets: [],
      };

      return {
        ...context,
        users: await fetchUsers(connection, actor, context.activeOrganizationId, context.organizations),
        loginContentItems: canManageLoginContent(actor) ? await fetchLoginContentItems(connection) : [],
        signupRequests: normalizeRole(actor?.role) === ROLE_SUPER_ADMIN ? await fetchSignupRequests(connection) : [],
        ...scopedSnapshot,
      };
    } finally {
      connection.release();
    }
  }

  async createOrganization(actor, input) {
    if (!canManageOrganizations(actor)) {
      throw createHttpError(403, "Nemate pravo kreirati organizacije.");
    }

    const normalized = normalizeOrganizationInput(input);
    assertText(normalized.name, "Naziv organizacije je obavezan.");
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query(
        `
          INSERT INTO organizations
            (name, oib, address, city, postal_code, country, contact_email, contact_phone, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          normalized.name,
          normalized.oib,
          normalized.address,
          normalized.city,
          normalized.postalCode,
          normalized.country,
          normalized.contactEmail,
          normalized.contactPhone,
          normalized.status,
        ],
      );
      const [rows] = await connection.query(
        "SELECT * FROM organizations WHERE id = ? LIMIT 1",
        [Number(result.insertId)],
      );
      return sanitizeOrganization(rows[0]);
    } catch (error) {
      rethrowDatabaseError(error, "Organizacija s tim nazivom vec postoji.");
    } finally {
      connection.release();
    }
  }

  async updateOrganization(actor, organizationId, patch) {
    if (!canEditOrganization(actor, organizationId)) {
      throw createHttpError(403, "Nemate pravo mijenjati ovu organizaciju.");
    }

    const connection = await this.pool.getConnection();

    try {
      const [rows] = await connection.query(
        "SELECT * FROM organizations WHERE id = ? LIMIT 1",
        [Number(organizationId)],
      );

      if (!rows[0]) {
        return null;
      }

      const normalized = normalizeOrganizationInput({
        ...sanitizeOrganization(rows[0]),
        ...patch,
      });
      assertText(normalized.name, "Naziv organizacije je obavezan.");

      await connection.query(
        `
          UPDATE organizations
          SET name = ?, oib = ?, address = ?, city = ?, postal_code = ?, country = ?,
              contact_email = ?, contact_phone = ?, status = ?
          WHERE id = ?
        `,
        [
          normalized.name,
          normalized.oib,
          normalized.address,
          normalized.city,
          normalized.postalCode,
          normalized.country,
          normalized.contactEmail,
          normalized.contactPhone,
          normalized.status,
          Number(organizationId),
        ],
      );

      const [nextRows] = await connection.query(
        "SELECT * FROM organizations WHERE id = ? LIMIT 1",
        [Number(organizationId)],
      );
      return sanitizeOrganization(nextRows[0]);
    } catch (error) {
      rethrowDatabaseError(error, "Organizacija s tim nazivom vec postoji.");
    } finally {
      connection.release();
    }
  }

  async createUser(actor, input) {
    const normalized = normalizeUserInput(input);
    const targetOrganizationId = normalized.organizationId || actor?.organizationId;
    let preparedAvatar = null;
    let preparedUserDocuments = {
      nextDocuments: [],
      staleDocuments: [],
    };
    let preparedUserElectricalSignature = {
      storedSignature: mapStoredAssetLocation(),
      previousStoredSignature: null,
    };

    if (!canManageOrganizationUsers(actor, normalized.organizationIds, normalized.role)) {
      throw createHttpError(403, "Nemate pravo kreirati ovog korisnika.");
    }

    assertText(normalized.email, "Email je obavezan.");
    assertText(normalized.password, "Lozinka je obavezna.");
    const connection = await this.pool.getConnection();

    try {
      const organizations = await fetchOrganizations(connection, normalized.organizationIds);

      if (organizations.length !== normalized.organizationIds.length || !targetOrganizationId) {
        throw createHttpError(400, "Odabrana organizacija ne postoji.");
      }

      const passwordHash = await createPasswordHash(normalized.password);
      preparedAvatar = await prepareStoredUserAvatar({
        userId: normalized.email || normalized.legacyUsername || "new-user",
        fullName: [normalized.firstName, normalized.lastName].filter(Boolean).join(" "),
        avatarDataUrl: normalized.avatarDataUrl,
      });
      preparedUserDocuments = await prepareStoredUserDocuments(
        normalized.documents,
        {
          fallbackKey: normalized.email || normalized.legacyUsername || "new-user",
        },
      );
      preparedUserElectricalSignature = await prepareStoredUserElectricalSignature({
        fallbackKey: normalized.email || normalized.legacyUsername || "new-user",
        signatureDataUrl: normalized.electricalQualification?.signatureDataUrl,
      });
      const electricalQualification = {
        ...normalized.electricalQualification,
        documents: [],
        signatureDataUrl: preparedUserElectricalSignature.storedSignature.dataUrl || "",
        signatureStorageProvider: preparedUserElectricalSignature.storedSignature.storageProvider || "",
        signatureStorageBucket: preparedUserElectricalSignature.storedSignature.storageBucket || "",
        signatureStorageKey: preparedUserElectricalSignature.storedSignature.storageKey || "",
        signatureStorageUrl: preparedUserElectricalSignature.storedSignature.storageUrl || "",
      };

      const [result] = await connection.query(
        `
          INSERT INTO app_users
            (organization_id, organization_ids_csv, first_name, last_name, avatar_data_url,
             avatar_storage_provider, avatar_storage_bucket, avatar_storage_key, avatar_storage_url,
             electrical_qualification_json, user_documents_json, email, legacy_username, password_hash, role, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(targetOrganizationId),
          serializeOrganizationIds(targetOrganizationId, normalized.organizationIds),
          normalized.firstName,
          normalized.lastName,
          preparedAvatar.storedAvatar.dataUrl || null,
          preparedAvatar.storedAvatar.storageProvider || null,
          preparedAvatar.storedAvatar.storageBucket || null,
          preparedAvatar.storedAvatar.storageKey || null,
          preparedAvatar.storedAvatar.storageUrl || null,
          JSON.stringify(electricalQualification),
          JSON.stringify(preparedUserDocuments.nextDocuments),
          normalized.email,
          normalized.legacyUsername || null,
          passwordHash,
          normalized.role,
          normalized.isActive ? 1 : 0,
        ],
      );

      return this.getUserById(result.insertId);
    } catch (error) {
      await cleanupStoredAssets(preparedAvatar?.storedAvatar?.storageKey ? [preparedAvatar.storedAvatar] : []);
      await cleanupStoredAssets(preparedUserDocuments?.nextDocuments ?? []);
      await cleanupStoredAssets(
        preparedUserElectricalSignature?.storedSignature?.storageKey
        && preparedUserElectricalSignature?.storedSignature?.storageKey !== preparedUserElectricalSignature?.previousStoredSignature?.storageKey
          ? [preparedUserElectricalSignature.storedSignature]
          : [],
      );
      rethrowDatabaseError(error, "Korisnik s tim emailom ili korisnickim imenom vec postoji.");
    } finally {
      connection.release();
    }
  }

  async updateUser(actor, userId, patch) {
    const connection = await this.pool.getConnection();
    let preparedAvatar = null;
    let preparedUserDocuments = {
      nextDocuments: [],
      staleDocuments: [],
    };
    let preparedUserElectricalSignature = {
      storedSignature: mapStoredAssetLocation(),
      previousStoredSignature: null,
    };

    try {
      const [rows] = await connection.query(
        `
          SELECT u.*, o.name AS organization_name
          FROM app_users u
          LEFT JOIN organizations o ON o.id = u.organization_id
          WHERE u.id = ?
          LIMIT 1
        `,
        [Number(userId)],
      );

      const current = rows[0];

      if (!current) {
        return null;
      }

      const normalized = normalizeUserInput({
        ...sanitizeUser(current),
        ...patch,
      });
      const targetOrganizationId = normalized.organizationId || current.organization_id;

      if (!canManageOrganizationUsers(actor, normalized.organizationIds, normalized.role)) {
        throw createHttpError(403, "Nemate pravo mijenjati ovog korisnika.");
      }

      const organizations = await fetchOrganizations(connection, normalized.organizationIds);

      if (organizations.length !== normalized.organizationIds.length || !targetOrganizationId) {
        throw createHttpError(400, "Odabrana organizacija ne postoji.");
      }

      preparedAvatar = await prepareStoredUserAvatar({
        currentUser: current,
        userId: current.id,
        fullName: [normalized.firstName, normalized.lastName].filter(Boolean).join(" "),
        avatarDataUrl: normalized.avatarDataUrl,
      });
      const currentUserDocuments = mapUserDocuments(current);
      preparedUserDocuments = await prepareStoredUserDocuments(
        normalized.documents,
        {
          userId: current.id,
          fallbackKey: normalized.email || normalized.legacyUsername || current.id,
          currentDocuments: currentUserDocuments,
        },
      );
      preparedUserElectricalSignature = await prepareStoredUserElectricalSignature({
        currentQualification: mapUserElectricalQualification(current),
        userId: current.id,
        fallbackKey: normalized.email || normalized.legacyUsername || current.id,
        signatureDataUrl: normalized.electricalQualification?.signatureDataUrl,
      });
      const electricalQualification = {
        ...normalized.electricalQualification,
        documents: [],
        signatureDataUrl: preparedUserElectricalSignature.storedSignature.dataUrl || "",
        signatureStorageProvider: preparedUserElectricalSignature.storedSignature.storageProvider || "",
        signatureStorageBucket: preparedUserElectricalSignature.storedSignature.storageBucket || "",
        signatureStorageKey: preparedUserElectricalSignature.storedSignature.storageKey || "",
        signatureStorageUrl: preparedUserElectricalSignature.storedSignature.storageUrl || "",
      };

      const updateFields = [
        "organization_id = ?",
        "organization_ids_csv = ?",
        "first_name = ?",
        "last_name = ?",
        "avatar_data_url = ?",
        "avatar_storage_provider = ?",
        "avatar_storage_bucket = ?",
        "avatar_storage_key = ?",
        "avatar_storage_url = ?",
        "electrical_qualification_json = ?",
        "user_documents_json = ?",
        "email = ?",
        "legacy_username = ?",
        "role = ?",
        "is_active = ?",
      ];
      const params = [
        Number(targetOrganizationId),
        serializeOrganizationIds(targetOrganizationId, normalized.organizationIds),
        normalized.firstName,
        normalized.lastName,
        preparedAvatar.storedAvatar.dataUrl || null,
        preparedAvatar.storedAvatar.storageProvider || null,
        preparedAvatar.storedAvatar.storageBucket || null,
        preparedAvatar.storedAvatar.storageKey || null,
        preparedAvatar.storedAvatar.storageUrl || null,
        JSON.stringify(electricalQualification),
        JSON.stringify(preparedUserDocuments.nextDocuments),
        normalized.email,
        normalized.legacyUsername || null,
        normalized.role,
        normalized.isActive ? 1 : 0,
      ];

      if (normalized.password) {
        updateFields.push("password_hash = ?");
        params.push(await createPasswordHash(normalized.password));
      }

      params.push(Number(userId));
      await connection.query(`UPDATE app_users SET ${updateFields.join(", ")} WHERE id = ?`, params);
      await cleanupStoredAssets(preparedAvatar.previousStoredAvatar ? [preparedAvatar.previousStoredAvatar] : []);
      await cleanupStoredAssets(preparedUserDocuments.staleDocuments);
      await cleanupStoredAssets(
        preparedUserElectricalSignature.previousStoredSignature
          ? [preparedUserElectricalSignature.previousStoredSignature]
          : [],
      );

      return this.getUserById(userId);
    } catch (error) {
      await cleanupStoredAssets(preparedAvatar?.storedAvatar?.storageKey ? [preparedAvatar.storedAvatar] : []);
      await cleanupStoredAssets(preparedUserDocuments?.nextDocuments ?? []);
      await cleanupStoredAssets(
        preparedUserElectricalSignature?.storedSignature?.storageKey
        && preparedUserElectricalSignature?.storedSignature?.storageKey !== preparedUserElectricalSignature?.previousStoredSignature?.storageKey
          ? [preparedUserElectricalSignature.storedSignature]
          : [],
      );
      rethrowDatabaseError(error, "Korisnik s tim emailom ili korisnickim imenom vec postoji.");
    } finally {
      connection.release();
    }
  }

  async updateOwnAvatar(actor, avatarDataUrl) {
    const connection = await this.pool.getConnection();

    try {
      const [rows] = await connection.query(
        `
          SELECT id, first_name, last_name, avatar_data_url,
                 avatar_storage_provider, avatar_storage_bucket, avatar_storage_key, avatar_storage_url
          FROM app_users
          WHERE id = ?
          LIMIT 1
        `,
        [Number(actor?.id)],
      );
      const current = rows[0];

      if (!current) {
        return null;
      }

      const preparedAvatar = await prepareStoredUserAvatar({
        currentUser: current,
        userId: current.id,
        fullName: [current.first_name ?? "", current.last_name ?? ""].filter(Boolean).join(" "),
        avatarDataUrl,
      });

      const [result] = await connection.query(
        `
          UPDATE app_users
          SET avatar_data_url = ?,
              avatar_storage_provider = ?,
              avatar_storage_bucket = ?,
              avatar_storage_key = ?,
              avatar_storage_url = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [
          preparedAvatar.storedAvatar.dataUrl || null,
          preparedAvatar.storedAvatar.storageProvider || null,
          preparedAvatar.storedAvatar.storageBucket || null,
          preparedAvatar.storedAvatar.storageKey || null,
          preparedAvatar.storedAvatar.storageUrl || null,
          Number(actor?.id),
        ],
      );

      if (result.affectedRows === 0) {
        return null;
      }

      await cleanupStoredAssets(preparedAvatar.previousStoredAvatar ? [preparedAvatar.previousStoredAvatar] : []);
      return this.getUserById(actor.id);
    } finally {
      connection.release();
    }
  }

  async createLoginContent(actor, input) {
    if (!canManageLoginContent(actor)) {
      throw createHttpError(403, "Nemate pravo upravljati login sadrzajem.");
    }

    const normalized = normalizeLoginContentInput(input);
    assertText(normalized.heading, "Naslov je obavezan.");
    assertText(normalized.quoteText, "Quote tekst je obavezan.");
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query(
        `
          INSERT INTO login_content_items
            (heading, quote_text, author_name, author_title, feature_title, feature_body, accent_label, is_active, created_by_user_id, updated_by_user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          normalized.heading,
          normalized.quoteText,
          normalized.authorName,
          normalized.authorTitle,
          normalized.featureTitle,
          normalized.featureBody,
          normalized.accentLabel,
          normalized.isActive ? 1 : 0,
          Number(actor.id),
          Number(actor.id),
        ],
      );

      const [rows] = await connection.query(
        "SELECT * FROM login_content_items WHERE id = ? LIMIT 1",
        [Number(result.insertId)],
      );
      return sanitizeLoginContent(rows[0]);
    } finally {
      connection.release();
    }
  }

  async updateLoginContent(actor, id, patch) {
    if (!canManageLoginContent(actor)) {
      throw createHttpError(403, "Nemate pravo upravljati login sadrzajem.");
    }

    const connection = await this.pool.getConnection();

    try {
      const [rows] = await connection.query(
        "SELECT * FROM login_content_items WHERE id = ? LIMIT 1",
        [Number(id)],
      );

      if (!rows[0]) {
        return null;
      }

      const normalized = normalizeLoginContentInput({
        ...sanitizeLoginContent(rows[0]),
        ...patch,
      });

      await connection.query(
        `
          UPDATE login_content_items
          SET heading = ?, quote_text = ?, author_name = ?, author_title = ?, feature_title = ?,
              feature_body = ?, accent_label = ?, is_active = ?, updated_by_user_id = ?
          WHERE id = ?
        `,
        [
          normalized.heading,
          normalized.quoteText,
          normalized.authorName,
          normalized.authorTitle,
          normalized.featureTitle,
          normalized.featureBody,
          normalized.accentLabel,
          normalized.isActive ? 1 : 0,
          Number(actor.id),
          Number(id),
        ],
      );

      const [nextRows] = await connection.query(
        "SELECT * FROM login_content_items WHERE id = ? LIMIT 1",
        [Number(id)],
      );
      return sanitizeLoginContent(nextRows[0]);
    } finally {
      connection.release();
    }
  }

  async deleteLoginContent(actor, id) {
    if (!canManageLoginContent(actor)) {
      throw createHttpError(403, "Nemate pravo upravljati login sadrzajem.");
    }

    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query(
        "DELETE FROM login_content_items WHERE id = ?",
        [Number(id)],
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async submitSignupRequest(input) {
    const normalized = normalizeSignupRequestInput(input);
    assertText(normalized.organizationName, "Naziv organizacije je obavezan.");
    assertOrganizationOib(normalized.organizationOib);
    assertText(normalized.firstName, "Ime je obavezno.");
    assertText(normalized.lastName, "Prezime je obavezno.");
    assertText(normalized.email, "Email je obavezan.");
    assertText(normalized.password, "Lozinka je obavezna.");
    const connection = await this.pool.getConnection();

    try {
      const [[existingUser]] = await connection.query(
        "SELECT id FROM app_users WHERE LOWER(email) = ? LIMIT 1",
        [normalized.email],
      );

      if (existingUser?.id) {
        throw createHttpError(400, "Korisnik s tim emailom vec postoji.");
      }

      const [[existingRequest]] = await connection.query(
        "SELECT id FROM signup_requests WHERE LOWER(email) = ? AND status = 'pending' LIMIT 1",
        [normalized.email],
      );

      if (existingRequest?.id) {
        throw createHttpError(400, "Zahtjev s tim emailom je vec poslan.");
      }

      const passwordHash = await createPasswordHash(normalized.password);
      const [result] = await connection.query(
        `
          INSERT INTO signup_requests
            (organization_name, organization_oib, first_name, last_name, email, phone, note, password_hash, status, email_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', '')
        `,
        [
          normalized.organizationName,
          normalized.organizationOib,
          normalized.firstName,
          normalized.lastName,
          normalized.email,
          normalized.phone,
          normalized.note,
          passwordHash,
        ],
      );

      const [[requestRow]] = await connection.query(
        `
          SELECT id, organization_name, organization_oib, first_name, last_name, email, phone, note, status,
                 organization_id, user_id, processed_note, email_status, email_error,
                 requested_at, processed_at
          FROM signup_requests
          WHERE id = ?
          LIMIT 1
        `,
        [Number(result.insertId)],
      );

      const request = sanitizeSignupRequest(requestRow);
      await notifySignupSubmitted(connection, request);

      return {
        ok: true,
        request,
        message: "Zahtjev za pristup je zaprimljen. Administrator ce dobiti obavijest emailom.",
      };
    } catch (error) {
      rethrowDatabaseError(error, "Signup zahtjev s tim emailom vec postoji.");
    } finally {
      connection.release();
    }
  }

  async approveSignupRequest(actor, requestId, input = {}) {
    if (normalizeRole(actor?.role) !== ROLE_SUPER_ADMIN) {
      throw createHttpError(403, "Nemate pravo odobravati signup zahtjeve.");
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [[current]] = await connection.query(
        "SELECT * FROM signup_requests WHERE id = ? LIMIT 1 FOR UPDATE",
        [Number(requestId)],
      );

      if (!current) {
        await connection.rollback();
        return null;
      }

      const request = sanitizeSignupRequest(current);

      if (request.status !== SIGNUP_STATUS_PENDING) {
        throw createHttpError(400, "Zahtjev vise nije pending.");
      }

      const [[existingUser]] = await connection.query(
        "SELECT id FROM app_users WHERE LOWER(email) = ? LIMIT 1",
        [request.email.toLowerCase()],
      );

      if (existingUser?.id) {
        throw createHttpError(400, "Korisnik s tim emailom vec postoji.");
      }

      const approvedRole = normalizeRole(input.role || ROLE_ADMIN);
      const selectedOrganizationId = dbString(input.organizationId);
      let organizationId = selectedOrganizationId;

      if (organizationId) {
        const [existingOrganizations] = await connection.query(
          "SELECT id FROM organizations WHERE id = ? LIMIT 1",
          [Number(organizationId)],
        );

        if (!existingOrganizations[0]) {
          throw createHttpError(400, "Odabrana organizacija ne postoji.");
        }
      } else {
        const [organizationResult] = await connection.query(
          `
            INSERT INTO organizations
              (name, oib, contact_email, contact_phone, status)
            VALUES (?, ?, ?, ?, 'active')
          `,
          [request.organizationName, request.organizationOib, request.email, request.phone],
        );
        organizationId = String(organizationResult.insertId);
      }

      const [userResult] = await connection.query(
        `
          INSERT INTO app_users
            (organization_id, organization_ids_csv, first_name, last_name, avatar_data_url, email, password_hash, role, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [
          Number(organizationId),
          serializeOrganizationIds(organizationId),
          request.firstName,
          request.lastName,
          null,
          request.email,
          current.password_hash,
          approvedRole === ROLE_SUPER_ADMIN ? ROLE_ADMIN : approvedRole,
        ],
      );

      await connection.query(
        `
          UPDATE signup_requests
          SET status = 'approved',
              organization_id = ?,
              user_id = ?,
              processed_note = ?,
              processed_at = CURRENT_TIMESTAMP,
              processed_by_user_id = ?
          WHERE id = ?
        `,
        [
          Number(organizationId),
          Number(userResult.insertId),
          dbString(input.processedNote),
          Number(actor.id),
          Number(requestId),
        ],
      );

      await connection.commit();

      const [[nextRow]] = await connection.query(
        `
          SELECT id, organization_name, organization_oib, first_name, last_name, email, phone, note, status,
                 organization_id, user_id, processed_note, email_status, email_error,
                 requested_at, processed_at
          FROM signup_requests
          WHERE id = ?
          LIMIT 1
        `,
        [Number(requestId)],
      );

      const nextRequest = sanitizeSignupRequest(nextRow);
      await notifySignupDecision(connection, nextRequest, SIGNUP_STATUS_APPROVED);
      return nextRequest;
    } catch (error) {
      await connection.rollback();
      rethrowDatabaseError(error, "Signup zahtjev nije moguce odobriti.");
    } finally {
      connection.release();
    }
  }

  async rejectSignupRequest(actor, requestId, input = {}) {
    if (normalizeRole(actor?.role) !== ROLE_SUPER_ADMIN) {
      throw createHttpError(403, "Nemate pravo odbijati signup zahtjeve.");
    }

    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query(
        `
          UPDATE signup_requests
          SET status = 'rejected',
              processed_note = ?,
              processed_at = CURRENT_TIMESTAMP,
              processed_by_user_id = ?
          WHERE id = ?
            AND status = 'pending'
        `,
        [dbString(input.processedNote), Number(actor.id), Number(requestId)],
      );

      if (result.affectedRows === 0) {
        const [[existing]] = await connection.query(
          "SELECT id FROM signup_requests WHERE id = ? LIMIT 1",
          [Number(requestId)],
        );

        if (!existing?.id) {
          return null;
        }

        throw createHttpError(400, "Zahtjev vise nije pending.");
      }

      const [[nextRow]] = await connection.query(
        `
          SELECT id, organization_name, organization_oib, first_name, last_name, email, phone, note, status,
                 organization_id, user_id, processed_note, email_status, email_error,
                 requested_at, processed_at
          FROM signup_requests
          WHERE id = ?
          LIMIT 1
        `,
        [Number(requestId)],
      );

      const nextRequest = sanitizeSignupRequest(nextRow);
      await notifySignupDecision(connection, nextRequest, SIGNUP_STATUS_REJECTED);
      return nextRequest;
    } finally {
      connection.release();
    }
  }

  async assignCompanyToOrganization(organizationId, companyId) {
    const connection = await this.pool.getConnection();

    try {
      await connection.query(
        `
          INSERT INTO organization_companies (organization_id, company_id)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE organization_id = VALUES(organization_id)
        `,
        [Number(organizationId), Number(companyId)],
      );
    } finally {
      connection.release();
    }
  }

  async removeCompanyAssignment(companyId) {
    const connection = await this.pool.getConnection();

    try {
      await connection.query(
        "DELETE FROM organization_companies WHERE company_id = ?",
        [Number(companyId)],
      );
    } finally {
      connection.release();
    }
  }
}

export async function createTenantRepository() {
  const kind = getDatabaseKind();

  if (kind === "mysql") {
    const repository = new MySqlTenantRepository(process.env.DATABASE_URL);
    await repository.init();
    return repository;
  }

  const repository = new MemoryTenantRepository();
  await repository.init();
  return repository;
}
