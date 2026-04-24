import mysql from "mysql2/promise";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import {
  normalizeChatMessageBody,
  normalizeChatPreviewText,
} from "./chatMessageFormat.js";

const PRESENCE_OPTIONS = new Set(["online", "away", "busy", "offline"]);
const STALE_PRESENCE_MS = 90_000;
const CHAT_CONVERSATIONS_TABLE = "safenexus_chat_conversations";
const CHAT_MESSAGES_TABLE = "safenexus_chat_messages";
const CHAT_READS_TABLE = "safenexus_chat_reads";
const CHAT_USER_STATE_TABLE = "safenexus_chat_user_state";

function normalizeId(value) {
  return String(value ?? "").trim();
}

function normalizeSecret(value = "") {
  return String(value ?? "").trim();
}

function normalizePresenceStatus(value) {
  const normalized = normalizeId(value).toLowerCase();
  return PRESENCE_OPTIONS.has(normalized) ? normalized : "online";
}

function normalizeUserSummary(user = {}) {
  return {
    id: normalizeId(user.id),
    fullName: normalizeId(user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ")),
    email: normalizeId(user.email),
    avatarDataUrl: normalizeId(user.avatarDataUrl),
    role: normalizeId(user.role || "user"),
    isActive: user.isActive !== false,
  };
}

function ensureActiveUserMap(users = []) {
  const entries = users
    .map(normalizeUserSummary)
    .filter((user) => user.id && user.isActive !== false);
  return new Map(entries.map((user) => [user.id, user]));
}

function dedupeIds(values = []) {
  return Array.from(new Set(values.map(normalizeId).filter(Boolean)));
}

function buildDirectConversationKey(participantIds = []) {
  return dedupeIds(participantIds).sort().join("|");
}

function resolveEffectivePresence(entry, nowValue) {
  if (!entry) {
    return "offline";
  }

  if (nowValue - entry.updatedAtMs > STALE_PRESENCE_MS) {
    return "offline";
  }

  return normalizePresenceStatus(entry.status);
}

function deriveEncryptionKey(secret = "") {
  return createHash("sha256")
    .update(normalizeSecret(secret) || "local-safenexus-chat-secret", "utf8")
    .digest();
}

function encryptText(value = "", encryptionKey) {
  const normalized = String(value ?? "");
  if (!normalized) {
    return "";
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(normalized, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

function decryptText(value = "", encryptionKey) {
  const normalized = String(value ?? "");
  if (!normalized) {
    return "";
  }

  if (!normalized.startsWith("v1:")) {
    return normalized;
  }

  const [, ivEncoded, authTagEncoded, ciphertextEncoded] = normalized.split(":");
  if (!ivEncoded || !authTagEncoded || !ciphertextEncoded) {
    return "";
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey,
      Buffer.from(ivEncoded, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authTagEncoded, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    return "";
  }
}

function normalizeTimestamp(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function parseTimestampMs(value) {
  if (!value) {
    return 0;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function isTimestampAfter(leftValue, rightValue) {
  const leftMs = parseTimestampMs(leftValue);
  const rightMs = parseTimestampMs(rightValue);

  if (!leftMs) {
    return false;
  }

  if (!rightMs) {
    return true;
  }

  return leftMs > rightMs;
}

function buildConversationUserStateKey(conversationId, userId) {
  return `${normalizeId(conversationId)}:${normalizeId(userId)}`;
}

function normalizeConversationUserState(userState = {}) {
  return {
    archivedAt: normalizeTimestamp(userState.archivedAt ?? userState.archived_at),
    clearedAt: normalizeTimestamp(userState.clearedAt ?? userState.cleared_at),
  };
}

function shouldIncludeConversationForUser(conversation = {}, userState = {}) {
  const normalizedState = normalizeConversationUserState(userState);

  if (!normalizedState.archivedAt) {
    return true;
  }

  return isTimestampAfter(
    conversation.lastMessage?.createdAt
      || conversation.updatedAt
      || conversation.createdAt
      || conversation.last_message_at
      || conversation.updated_at
      || conversation.created_at,
    normalizedState.archivedAt,
  );
}

function buildConversationParticipants(conversation, usersById) {
  return (conversation.participantIds ?? [])
    .map((participantId) => usersById.get(participantId))
    .filter(Boolean)
    .map((participant) => ({
      id: participant.id,
      fullName: participant.fullName,
      email: participant.email,
      avatarDataUrl: participant.avatarDataUrl,
      role: participant.role,
    }));
}

function buildConversationTitle(conversation, currentUserId, usersById) {
  if (conversation.kind === "direct") {
    const otherParticipant = (conversation.participantIds ?? [])
      .filter((participantId) => participantId !== currentUserId)
      .map((participantId) => usersById.get(participantId))
      .find(Boolean);
    return otherParticipant?.fullName || otherParticipant?.email || "Direct chat";
  }

  if (conversation.title) {
    return conversation.title;
  }

  const participants = (conversation.participantIds ?? [])
    .filter((participantId) => participantId !== currentUserId)
    .map((participantId) => usersById.get(participantId))
    .filter(Boolean)
    .slice(0, 3)
    .map((participant) => participant.fullName || participant.email)
    .filter(Boolean);

  return participants.join(", ") || "Group chat";
}

function mapLastMessageSnapshot({
  conversation,
  lastMessageId = "",
  lastMessageBody = "",
  lastMessageAt = "",
  lastMessageAuthorId = "",
  usersById,
}) {
  if (!lastMessageId || !lastMessageBody) {
    return null;
  }

  return {
    id: lastMessageId,
    body: lastMessageBody,
    createdAt: lastMessageAt,
    authorId: lastMessageAuthorId,
    authorName: usersById.get(lastMessageAuthorId)?.fullName
      || usersById.get(lastMessageAuthorId)?.email
      || (conversation.kind === "direct" ? conversation.title : "User"),
  };
}

function buildPresenceSnapshot({
  organizationId,
  usersById,
  nowValue,
  presenceByOrganization,
}) {
  const presenceByUserId = {};
  const organizationPresence = presenceByOrganization.get(normalizeId(organizationId)) ?? new Map();

  for (const user of usersById.values()) {
    presenceByUserId[user.id] = resolveEffectivePresence(
      organizationPresence.get(user.id),
      nowValue,
    );
  }

  return presenceByUserId;
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
  const connectionString = normalizeSecret(process.env.DATABASE_URL);

  if (!connectionString) {
    return "memory";
  }

  if (connectionString.startsWith("mysql://")) {
    return "mysql";
  }

  return "memory";
}

function parseParticipantIds(value) {
  if (Array.isArray(value)) {
    return dedupeIds(value);
  }

  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return [];
  }

  try {
    return dedupeIds(JSON.parse(normalized));
  } catch {
    return [];
  }
}

class MemoryLiveChatStore {
  constructor({ now, idFactory, encryptionKey, presenceByOrganization }) {
    this.kind = "memory";
    this.now = now;
    this.idFactory = idFactory;
    this.encryptionKey = encryptionKey;
    this.presenceByOrganization = presenceByOrganization;
    this.organizations = new Map();
  }

  async init() {}

  async close() {}

  getTimestamp() {
    return new Date(this.now()).toISOString();
  }

  getOrganizationState(organizationId) {
    const normalizedOrganizationId = normalizeId(organizationId);
    if (!normalizedOrganizationId) {
      throw new Error("Organizacija je obavezna za chat.");
    }

    if (!this.organizations.has(normalizedOrganizationId)) {
      this.organizations.set(normalizedOrganizationId, {
        conversations: new Map(),
        messages: new Map(),
        reads: new Map(),
        userState: new Map(),
        conversationCounter: 0,
        messageCounter: 0,
      });
    }

    return this.organizations.get(normalizedOrganizationId);
  }

  getAccessibleConversations(organizationId, currentUserId) {
    const organizationState = this.getOrganizationState(organizationId);
    return Array.from(organizationState.conversations.values())
      .filter((conversation) => conversation.participantIds.includes(currentUserId))
      .filter((conversation) => shouldIncludeConversationForUser(
        conversation,
        this.getConversationUserState(organizationState, conversation.id, currentUserId),
      ))
      .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  }

  getConversationUserState(organizationState, conversationId, userId) {
    return normalizeConversationUserState(
      organizationState.userState.get(buildConversationUserStateKey(conversationId, userId)),
    );
  }

  setConversationUserState(organizationState, conversationId, userId, patch = {}) {
    const key = buildConversationUserStateKey(conversationId, userId);
    const currentState = this.getConversationUserState(organizationState, conversationId, userId);
    const nextState = {
      archivedAt: Object.prototype.hasOwnProperty.call(patch, "archivedAt")
        ? normalizeTimestamp(patch.archivedAt)
        : currentState.archivedAt,
      clearedAt: Object.prototype.hasOwnProperty.call(patch, "clearedAt")
        ? normalizeTimestamp(patch.clearedAt)
        : currentState.clearedAt,
    };

    if (!nextState.archivedAt && !nextState.clearedAt) {
      organizationState.userState.delete(key);
      return normalizeConversationUserState();
    }

    organizationState.userState.set(key, nextState);
    return nextState;
  }

  getConversationOrThrow(organizationState, conversationId, currentUserId) {
    const normalizedConversationId = normalizeId(conversationId);
    const conversation = organizationState.conversations.get(normalizedConversationId);

    if (!conversation || !conversation.participantIds.includes(currentUserId)) {
      throw new Error("Razgovor nije dostupan.");
    }

    return conversation;
  }

  mapConversationSummary(conversation, organizationState, usersById, currentUserId) {
    const readMarker = organizationState.reads.get(`${conversation.id}:${currentUserId}`) ?? "";
    const userState = this.getConversationUserState(organizationState, conversation.id, currentUserId);
    const visibleMessages = conversation.messageIds
      .map((messageId) => organizationState.messages.get(messageId))
      .filter(Boolean)
      .filter((message) => !userState.clearedAt || isTimestampAfter(message.createdAt, userState.clearedAt));
    const lastMessage = visibleMessages[visibleMessages.length - 1] ?? null;
    const title = buildConversationTitle(conversation, currentUserId, usersById);
    let unreadCount = 0;

    for (const message of visibleMessages) {
      if (message.authorId === currentUserId) {
        continue;
      }

      if (readMarker && message.createdAt <= readMarker) {
        continue;
      }

      unreadCount += 1;
    }

    return {
      id: conversation.id,
      kind: conversation.kind,
      title,
      participantIds: [...conversation.participantIds],
      participants: buildConversationParticipants(conversation, usersById),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      unreadCount,
      lastMessage: lastMessage
        ? {
          id: lastMessage.id,
          body: lastMessage.body,
          createdAt: lastMessage.createdAt,
          authorId: lastMessage.authorId,
          authorName: usersById.get(lastMessage.authorId)?.fullName
            || usersById.get(lastMessage.authorId)?.email
            || lastMessage.authorLabel
            || "User",
        }
        : null,
    };
  }

  mapConversationDetail(conversation, organizationState, usersById, currentUserId) {
    const summary = this.mapConversationSummary(conversation, organizationState, usersById, currentUserId);
    const userState = this.getConversationUserState(organizationState, conversation.id, currentUserId);
    return {
      ...summary,
      messages: conversation.messageIds
        .map((messageId) => organizationState.messages.get(messageId))
        .filter(Boolean)
        .filter((message) => !userState.clearedAt || isTimestampAfter(message.createdAt, userState.clearedAt))
        .map((message) => {
          const author = usersById.get(message.authorId);
          return {
            id: message.id,
            body: message.body,
            createdAt: message.createdAt,
            authorId: message.authorId,
            authorName: author?.fullName || author?.email || message.authorLabel || "User",
            authorEmail: author?.email || "",
            authorAvatarDataUrl: author?.avatarDataUrl || "",
          };
        }),
    };
  }

  async getSnapshot({ organizationId, currentUser, users = [], activeConversationId = "" }) {
    const normalizedOrganizationId = normalizeId(organizationId);
    const normalizedCurrentUser = normalizeUserSummary(currentUser);
    const currentUserId = normalizedCurrentUser.id;
    const usersById = ensureActiveUserMap(users);
    const organizationState = this.getOrganizationState(normalizedOrganizationId);
    const presenceByUserId = buildPresenceSnapshot({
      organizationId: normalizedOrganizationId,
      usersById,
      nowValue: this.now(),
      presenceByOrganization: this.presenceByOrganization,
    });
    const conversations = this.getAccessibleConversations(normalizedOrganizationId, currentUserId);
    const conversationSnapshots = conversations.map((conversation) => this.mapConversationSummary(
      conversation,
      organizationState,
      usersById,
      currentUserId,
    ));
    const activeConversation = conversations.find(
      (conversation) => conversation.id === normalizeId(activeConversationId),
    );

    return {
      organizationId: normalizedOrganizationId,
      currentUserId,
      selfPresence: presenceByUserId[currentUserId] || "online",
      presenceByUserId,
      conversations: conversationSnapshots,
      activeConversation: activeConversation
        ? this.mapConversationDetail(activeConversation, organizationState, usersById, currentUserId)
        : null,
      users: Array.from(usersById.values()),
      serverTime: this.getTimestamp(),
    };
  }

  async createConversation({ organizationId, currentUser, users = [], title = "", participantIds = [] }) {
    const organizationState = this.getOrganizationState(organizationId);
    const normalizedCurrentUser = normalizeUserSummary(currentUser);
    const usersById = ensureActiveUserMap(users);
    const nextParticipantIds = dedupeIds([normalizedCurrentUser.id, ...participantIds])
      .filter((participantId) => usersById.has(participantId));

    if (nextParticipantIds.length < 2) {
      throw new Error("Odaberi barem jednog kolegu za razgovor.");
    }

    const timestamp = this.getTimestamp();
    const normalizedTitle = normalizeId(title);
    const isDirect = nextParticipantIds.length === 2 && !normalizedTitle;
    const directKey = isDirect ? buildDirectConversationKey(nextParticipantIds) : "";

    if (isDirect) {
      const existingDirect = Array.from(organizationState.conversations.values())
        .find((conversation) => conversation.directKey === directKey);
      if (existingDirect) {
        organizationState.reads.set(`${existingDirect.id}:${normalizedCurrentUser.id}`, timestamp);
        this.setConversationUserState(organizationState, existingDirect.id, normalizedCurrentUser.id, {
          archivedAt: "",
        });
        return existingDirect.id;
      }
    }

    organizationState.conversationCounter += 1;
    const conversationId = `chat-${this.idFactory()}-${organizationState.conversationCounter}`;
    organizationState.conversations.set(conversationId, {
      id: conversationId,
      kind: isDirect ? "direct" : "group",
      title: normalizedTitle,
      titleCiphertext: encryptText(normalizedTitle, this.encryptionKey),
      participantIds: nextParticipantIds,
      createdAt: timestamp,
      updatedAt: timestamp,
      messageIds: [],
      createdByUserId: normalizedCurrentUser.id,
      directKey,
    });
    organizationState.reads.set(`${conversationId}:${normalizedCurrentUser.id}`, timestamp);
    return conversationId;
  }

  async addMessage({ organizationId, conversationId, currentUser, body }) {
    const organizationState = this.getOrganizationState(organizationId);
    const normalizedCurrentUser = normalizeUserSummary(currentUser);
    const conversation = this.getConversationOrThrow(
      organizationState,
      conversationId,
      normalizedCurrentUser.id,
    );
    const messageBody = normalizeChatMessageBody(body);

    if (!messageBody) {
      throw new Error("Poruka ne smije biti prazna.");
    }

    organizationState.messageCounter += 1;
    const timestamp = this.getTimestamp();
    const messageId = `msg-${this.idFactory()}-${organizationState.messageCounter}`;

    organizationState.messages.set(messageId, {
      id: messageId,
      conversationId: conversation.id,
      body: messageBody,
      bodyCiphertext: encryptText(messageBody, this.encryptionKey),
      createdAt: timestamp,
      authorId: normalizedCurrentUser.id,
      authorLabel: normalizedCurrentUser.fullName || normalizedCurrentUser.email || "User",
    });

    conversation.messageIds.push(messageId);
    conversation.updatedAt = timestamp;
    organizationState.reads.set(`${conversation.id}:${normalizedCurrentUser.id}`, timestamp);
    this.setConversationUserState(organizationState, conversation.id, normalizedCurrentUser.id, {
      archivedAt: "",
    });
    return messageId;
  }

  async markConversationRead({ organizationId, conversationId, currentUserId }) {
    const organizationState = this.getOrganizationState(organizationId);
    const conversation = this.getConversationOrThrow(
      organizationState,
      conversationId,
      normalizeId(currentUserId),
    );
    organizationState.reads.set(`${conversation.id}:${normalizeId(currentUserId)}`, this.getTimestamp());
  }

  async archiveConversation({ organizationId, conversationId, currentUserId, archived = true }) {
    const organizationState = this.getOrganizationState(organizationId);
    const normalizedCurrentUserId = normalizeId(currentUserId);
    const conversation = this.getConversationOrThrow(
      organizationState,
      conversationId,
      normalizedCurrentUserId,
    );
    this.setConversationUserState(organizationState, conversation.id, normalizedCurrentUserId, {
      archivedAt: archived ? this.getTimestamp() : "",
    });
  }

  async clearConversationHistory({ organizationId, conversationId, currentUserId }) {
    const organizationState = this.getOrganizationState(organizationId);
    const normalizedCurrentUserId = normalizeId(currentUserId);
    const conversation = this.getConversationOrThrow(
      organizationState,
      conversationId,
      normalizedCurrentUserId,
    );
    const timestamp = this.getTimestamp();
    this.setConversationUserState(organizationState, conversation.id, normalizedCurrentUserId, {
      clearedAt: timestamp,
      archivedAt: "",
    });
    organizationState.reads.set(`${conversation.id}:${normalizedCurrentUserId}`, timestamp);
  }
}

class MySqlLiveChatStore {
  constructor({ now, idFactory, encryptionKey, presenceByOrganization, connectionString }) {
    this.kind = "mysql";
    this.now = now;
    this.idFactory = idFactory;
    this.encryptionKey = encryptionKey;
    this.presenceByOrganization = presenceByOrganization;
    this.pool = mysql.createPool(parseMySqlConnectionString(connectionString));
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${CHAT_CONVERSATIONS_TABLE} (
        id VARCHAR(96) PRIMARY KEY,
        organization_id VARCHAR(96) NOT NULL,
        kind VARCHAR(24) NOT NULL,
        direct_key VARCHAR(255) NULL,
        title_ciphertext MEDIUMTEXT NULL,
        participant_ids_json JSON NOT NULL,
        created_by_user_id VARCHAR(96) NOT NULL,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        last_message_id VARCHAR(96) NULL,
        last_message_author_id VARCHAR(96) NULL,
        last_message_preview_ciphertext MEDIUMTEXT NULL,
        last_message_at DATETIME(3) NULL,
        message_count INT NOT NULL DEFAULT 0,
        UNIQUE KEY uniq_${CHAT_CONVERSATIONS_TABLE}_direct (organization_id, direct_key),
        INDEX idx_${CHAT_CONVERSATIONS_TABLE}_org_updated (organization_id, updated_at),
        INDEX idx_${CHAT_CONVERSATIONS_TABLE}_org_kind (organization_id, kind)
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${CHAT_MESSAGES_TABLE} (
        id VARCHAR(96) PRIMARY KEY,
        organization_id VARCHAR(96) NOT NULL,
        conversation_id VARCHAR(96) NOT NULL,
        author_id VARCHAR(96) NOT NULL,
        body_ciphertext LONGTEXT NOT NULL,
        created_at DATETIME(3) NOT NULL,
        INDEX idx_${CHAT_MESSAGES_TABLE}_conversation_created (conversation_id, created_at),
        INDEX idx_${CHAT_MESSAGES_TABLE}_org_conversation (organization_id, conversation_id)
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${CHAT_READS_TABLE} (
        conversation_id VARCHAR(96) NOT NULL,
        user_id VARCHAR(96) NOT NULL,
        read_at DATETIME(3) NOT NULL,
        PRIMARY KEY (conversation_id, user_id),
        INDEX idx_${CHAT_READS_TABLE}_user (user_id),
        INDEX idx_${CHAT_READS_TABLE}_read_at (read_at)
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${CHAT_USER_STATE_TABLE} (
        conversation_id VARCHAR(96) NOT NULL,
        user_id VARCHAR(96) NOT NULL,
        archived_at DATETIME(3) NULL,
        cleared_at DATETIME(3) NULL,
        PRIMARY KEY (conversation_id, user_id),
        INDEX idx_${CHAT_USER_STATE_TABLE}_user (user_id),
        INDEX idx_${CHAT_USER_STATE_TABLE}_archived (archived_at)
      )
    `);
  }

  async close() {
    await this.pool.end();
  }

  getTimestamp() {
    return new Date(this.now()).toISOString();
  }

  createRecordId(prefix) {
    return `${prefix}-${this.idFactory()}-${Math.floor(this.now()).toString(36)}`;
  }

  async listConversationRowsForUser(organizationId, currentUserId) {
    const [rows] = await this.pool.query(
      `
        SELECT
          c.id,
          c.kind,
          c.direct_key,
          c.title_ciphertext,
          c.participant_ids_json,
          c.created_by_user_id,
          c.created_at,
          c.updated_at,
          c.last_message_id,
          c.last_message_author_id,
          c.last_message_preview_ciphertext,
          c.last_message_at,
          c.message_count,
          s.archived_at,
          s.cleared_at
        FROM ${CHAT_CONVERSATIONS_TABLE} c
        LEFT JOIN ${CHAT_USER_STATE_TABLE} s
          ON s.conversation_id = c.id
         AND s.user_id = ?
        WHERE c.organization_id = ?
          AND JSON_CONTAINS(c.participant_ids_json, JSON_QUOTE(?))
          AND (
            s.archived_at IS NULL
            OR COALESCE(c.last_message_at, c.updated_at, c.created_at) > s.archived_at
          )
        ORDER BY c.updated_at DESC, c.id DESC
      `,
      [currentUserId, organizationId, currentUserId],
    );

    return rows;
  }

  async getConversationRowForUser(organizationId, conversationId, currentUserId) {
    const [rows] = await this.pool.query(
      `
        SELECT
          c.id,
          c.kind,
          c.direct_key,
          c.title_ciphertext,
          c.participant_ids_json,
          c.created_by_user_id,
          c.created_at,
          c.updated_at,
          c.last_message_id,
          c.last_message_author_id,
          c.last_message_preview_ciphertext,
          c.last_message_at,
          c.message_count,
          s.archived_at,
          s.cleared_at
        FROM ${CHAT_CONVERSATIONS_TABLE} c
        LEFT JOIN ${CHAT_USER_STATE_TABLE} s
          ON s.conversation_id = c.id
         AND s.user_id = ?
        WHERE c.organization_id = ?
          AND c.id = ?
          AND JSON_CONTAINS(c.participant_ids_json, JSON_QUOTE(?))
        LIMIT 1
      `,
      [currentUserId, organizationId, normalizeId(conversationId), currentUserId],
    );

    return rows[0] ?? null;
  }

  buildConversationData(row, usersById, currentUserId) {
    const participantIds = parseParticipantIds(row.participant_ids_json);
    const title = decryptText(row.title_ciphertext, this.encryptionKey);
    const clearedAt = normalizeTimestamp(row.cleared_at);
    const lastMessageAt = normalizeTimestamp(row.last_message_at);
    const canShowLastMessage = !clearedAt || isTimestampAfter(lastMessageAt, clearedAt);
    const conversation = {
      id: normalizeId(row.id),
      kind: normalizeId(row.kind || "group"),
      title,
      participantIds,
      createdByUserId: normalizeId(row.created_by_user_id),
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
      archivedAt: normalizeTimestamp(row.archived_at),
      clearedAt,
    };

    return {
      ...conversation,
      participants: buildConversationParticipants(conversation, usersById),
      resolvedTitle: buildConversationTitle(conversation, currentUserId, usersById),
      lastMessage: mapLastMessageSnapshot({
        conversation,
        lastMessageId: canShowLastMessage ? normalizeId(row.last_message_id) : "",
        lastMessageBody: canShowLastMessage ? decryptText(row.last_message_preview_ciphertext, this.encryptionKey) : "",
        lastMessageAt,
        lastMessageAuthorId: canShowLastMessage ? normalizeId(row.last_message_author_id) : "",
        usersById,
      }),
    };
  }

  async getUnreadCounts(conversationIds = [], currentUserId = "") {
    if (conversationIds.length === 0) {
      return new Map();
    }

    const placeholders = conversationIds.map(() => "?").join(", ");
    const [rows] = await this.pool.query(
      `
        SELECT m.conversation_id AS conversationId, COUNT(*) AS unreadCount
        FROM ${CHAT_MESSAGES_TABLE} m
        LEFT JOIN ${CHAT_READS_TABLE} r
          ON r.conversation_id = m.conversation_id
         AND r.user_id = ?
        LEFT JOIN ${CHAT_USER_STATE_TABLE} s
          ON s.conversation_id = m.conversation_id
         AND s.user_id = ?
        WHERE m.conversation_id IN (${placeholders})
          AND m.author_id <> ?
          AND (r.read_at IS NULL OR m.created_at > r.read_at)
          AND (s.cleared_at IS NULL OR m.created_at > s.cleared_at)
        GROUP BY m.conversation_id
      `,
      [currentUserId, currentUserId, ...conversationIds, currentUserId],
    );

    return new Map(rows.map((row) => [String(row.conversationId), Number(row.unreadCount ?? 0)]));
  }

  async upsertReadMarker(conversationId, userId, timestamp) {
    await this.pool.query(
      `
        INSERT INTO ${CHAT_READS_TABLE} (conversation_id, user_id, read_at)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE read_at = VALUES(read_at)
      `,
      [conversationId, userId, new Date(timestamp)],
    );
  }

  async setConversationUserState(conversationId, userId, patch = {}) {
    const normalizedConversationId = normalizeId(conversationId);
    const normalizedUserId = normalizeId(userId);
    const [rows] = await this.pool.query(
      `
        SELECT archived_at, cleared_at
        FROM ${CHAT_USER_STATE_TABLE}
        WHERE conversation_id = ?
          AND user_id = ?
        LIMIT 1
      `,
      [normalizedConversationId, normalizedUserId],
    );

    const currentState = normalizeConversationUserState(rows[0] ?? {});
    const nextState = {
      archivedAt: Object.prototype.hasOwnProperty.call(patch, "archivedAt")
        ? normalizeTimestamp(patch.archivedAt)
        : currentState.archivedAt,
      clearedAt: Object.prototype.hasOwnProperty.call(patch, "clearedAt")
        ? normalizeTimestamp(patch.clearedAt)
        : currentState.clearedAt,
    };

    if (!nextState.archivedAt && !nextState.clearedAt) {
      await this.pool.query(
        `
          DELETE FROM ${CHAT_USER_STATE_TABLE}
          WHERE conversation_id = ?
            AND user_id = ?
        `,
        [normalizedConversationId, normalizedUserId],
      );
      return normalizeConversationUserState();
    }

    await this.pool.query(
      `
        INSERT INTO ${CHAT_USER_STATE_TABLE} (conversation_id, user_id, archived_at, cleared_at)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          archived_at = VALUES(archived_at),
          cleared_at = VALUES(cleared_at)
      `,
      [
        normalizedConversationId,
        normalizedUserId,
        nextState.archivedAt ? new Date(nextState.archivedAt) : null,
        nextState.clearedAt ? new Date(nextState.clearedAt) : null,
      ],
    );

    return nextState;
  }

  async getConversationDetail({ organizationId, conversationId, currentUserId, usersById }) {
    const row = await this.getConversationRowForUser(organizationId, conversationId, currentUserId);

    if (!row) {
      return null;
    }

    const unreadCounts = await this.getUnreadCounts([normalizeId(conversationId)], currentUserId);
    const summary = this.buildConversationData(row, usersById, currentUserId);
    const [messageRows] = await this.pool.query(
      `
        SELECT id, author_id, body_ciphertext, created_at
        FROM ${CHAT_MESSAGES_TABLE}
        WHERE organization_id = ?
          AND conversation_id = ?
        ORDER BY created_at ASC, id ASC
      `,
      [organizationId, normalizeId(conversationId)],
    );
    const clearedAt = normalizeTimestamp(row.cleared_at);

    return {
      id: summary.id,
      kind: summary.kind,
      title: summary.resolvedTitle,
      participantIds: summary.participantIds,
      participants: summary.participants,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      unreadCount: unreadCounts.get(summary.id) ?? 0,
      lastMessage: summary.lastMessage,
      messages: messageRows
        .map((message) => {
          const authorId = normalizeId(message.author_id);
          const author = usersById.get(authorId);
          return {
            id: normalizeId(message.id),
            body: decryptText(message.body_ciphertext, this.encryptionKey),
            createdAt: normalizeTimestamp(message.created_at),
            authorId,
            authorName: author?.fullName || author?.email || "User",
            authorEmail: author?.email || "",
            authorAvatarDataUrl: author?.avatarDataUrl || "",
          };
        })
        .filter((message) => !clearedAt || isTimestampAfter(message.createdAt, clearedAt)),
    };
  }

  async getSnapshot({ organizationId, currentUser, users = [], activeConversationId = "" }) {
    const normalizedOrganizationId = normalizeId(organizationId);
    const normalizedCurrentUser = normalizeUserSummary(currentUser);
    const currentUserId = normalizedCurrentUser.id;
    const usersById = ensureActiveUserMap(users);
    const presenceByUserId = buildPresenceSnapshot({
      organizationId: normalizedOrganizationId,
      usersById,
      nowValue: this.now(),
      presenceByOrganization: this.presenceByOrganization,
    });
    const rows = await this.listConversationRowsForUser(normalizedOrganizationId, currentUserId);
    const conversationIds = rows.map((row) => normalizeId(row.id));
    const unreadCounts = await this.getUnreadCounts(conversationIds, currentUserId);
    const conversations = rows.map((row) => {
      const data = this.buildConversationData(row, usersById, currentUserId);
      return {
        id: data.id,
        kind: data.kind,
        title: data.resolvedTitle,
        participantIds: data.participantIds,
        participants: data.participants,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        unreadCount: unreadCounts.get(data.id) ?? 0,
        lastMessage: data.lastMessage,
      };
    });
    const activeConversation = normalizeId(activeConversationId)
      ? await this.getConversationDetail({
        organizationId: normalizedOrganizationId,
        conversationId: activeConversationId,
        currentUserId,
        usersById,
      })
      : null;

    return {
      organizationId: normalizedOrganizationId,
      currentUserId,
      selfPresence: presenceByUserId[currentUserId] || "online",
      presenceByUserId,
      conversations,
      activeConversation,
      users: Array.from(usersById.values()),
      serverTime: this.getTimestamp(),
    };
  }

  async createConversation({ organizationId, currentUser, users = [], title = "", participantIds = [] }) {
    const normalizedOrganizationId = normalizeId(organizationId);
    const normalizedCurrentUser = normalizeUserSummary(currentUser);
    const usersById = ensureActiveUserMap(users);
    const nextParticipantIds = dedupeIds([normalizedCurrentUser.id, ...participantIds])
      .filter((participantId) => usersById.has(participantId));

    if (nextParticipantIds.length < 2) {
      throw new Error("Odaberi barem jednog kolegu za razgovor.");
    }

    const normalizedTitle = normalizeId(title);
    const isDirect = nextParticipantIds.length === 2 && !normalizedTitle;
    const directKey = isDirect ? buildDirectConversationKey(nextParticipantIds) : null;
    const timestamp = this.getTimestamp();

    if (isDirect) {
      const [existingRows] = await this.pool.query(
        `
          SELECT id
          FROM ${CHAT_CONVERSATIONS_TABLE}
          WHERE organization_id = ?
            AND direct_key = ?
          LIMIT 1
        `,
        [normalizedOrganizationId, directKey],
      );

      if (existingRows[0]?.id) {
        await this.upsertReadMarker(normalizeId(existingRows[0].id), normalizedCurrentUser.id, timestamp);
        await this.setConversationUserState(normalizeId(existingRows[0].id), normalizedCurrentUser.id, {
          archivedAt: "",
        });
        return normalizeId(existingRows[0].id);
      }
    }

    const conversationId = this.createRecordId("chat");
    await this.pool.query(
      `
        INSERT INTO ${CHAT_CONVERSATIONS_TABLE}
          (
            id,
            organization_id,
            kind,
            direct_key,
            title_ciphertext,
            participant_ids_json,
            created_by_user_id,
            created_at,
            updated_at,
            last_message_id,
            last_message_author_id,
            last_message_preview_ciphertext,
            last_message_at,
            message_count
          )
        VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, NULL, NULL, NULL, NULL, 0)
      `,
      [
        conversationId,
        normalizedOrganizationId,
        isDirect ? "direct" : "group",
        directKey,
        encryptText(normalizedTitle, this.encryptionKey),
        JSON.stringify(nextParticipantIds),
        normalizedCurrentUser.id,
        new Date(timestamp),
        new Date(timestamp),
      ],
    );

    await this.upsertReadMarker(conversationId, normalizedCurrentUser.id, timestamp);
    return conversationId;
  }

  async addMessage({ organizationId, conversationId, currentUser, body }) {
    const normalizedOrganizationId = normalizeId(organizationId);
    const normalizedCurrentUser = normalizeUserSummary(currentUser);
    const conversationRow = await this.getConversationRowForUser(
      normalizedOrganizationId,
      conversationId,
      normalizedCurrentUser.id,
    );

    if (!conversationRow) {
      throw new Error("Razgovor nije dostupan.");
    }

    const messageBody = normalizeChatMessageBody(body);
    if (!messageBody) {
      throw new Error("Poruka ne smije biti prazna.");
    }

    const timestamp = this.getTimestamp();
    const messageId = this.createRecordId("msg");
    const previewText = normalizeChatPreviewText(messageBody, 160);

    await this.pool.query(
      `
        INSERT INTO ${CHAT_MESSAGES_TABLE}
          (id, organization_id, conversation_id, author_id, body_ciphertext, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        messageId,
        normalizedOrganizationId,
        normalizeId(conversationId),
        normalizedCurrentUser.id,
        encryptText(messageBody, this.encryptionKey),
        new Date(timestamp),
      ],
    );

    await this.pool.query(
      `
        UPDATE ${CHAT_CONVERSATIONS_TABLE}
        SET updated_at = ?,
            last_message_id = ?,
            last_message_author_id = ?,
            last_message_preview_ciphertext = ?,
            last_message_at = ?,
            message_count = message_count + 1
        WHERE id = ?
          AND organization_id = ?
      `,
      [
        new Date(timestamp),
        messageId,
        normalizedCurrentUser.id,
        encryptText(previewText, this.encryptionKey),
        new Date(timestamp),
        normalizeId(conversationId),
        normalizedOrganizationId,
      ],
    );

    await this.upsertReadMarker(normalizeId(conversationId), normalizedCurrentUser.id, timestamp);
    await this.setConversationUserState(normalizeId(conversationId), normalizedCurrentUser.id, {
      archivedAt: "",
    });
    return messageId;
  }

  async markConversationRead({ organizationId, conversationId, currentUserId }) {
    const normalizedOrganizationId = normalizeId(organizationId);
    const normalizedCurrentUserId = normalizeId(currentUserId);
    const conversationRow = await this.getConversationRowForUser(
      normalizedOrganizationId,
      conversationId,
      normalizedCurrentUserId,
    );

    if (!conversationRow) {
      throw new Error("Razgovor nije dostupan.");
    }

    await this.upsertReadMarker(normalizeId(conversationId), normalizedCurrentUserId, this.getTimestamp());
  }

  async archiveConversation({ organizationId, conversationId, currentUserId, archived = true }) {
    const normalizedOrganizationId = normalizeId(organizationId);
    const normalizedCurrentUserId = normalizeId(currentUserId);
    const conversationRow = await this.getConversationRowForUser(
      normalizedOrganizationId,
      conversationId,
      normalizedCurrentUserId,
    );

    if (!conversationRow) {
      throw new Error("Razgovor nije dostupan.");
    }

    await this.setConversationUserState(normalizeId(conversationId), normalizedCurrentUserId, {
      archivedAt: archived ? this.getTimestamp() : "",
    });
  }

  async clearConversationHistory({ organizationId, conversationId, currentUserId }) {
    const normalizedOrganizationId = normalizeId(organizationId);
    const normalizedCurrentUserId = normalizeId(currentUserId);
    const conversationRow = await this.getConversationRowForUser(
      normalizedOrganizationId,
      conversationId,
      normalizedCurrentUserId,
    );

    if (!conversationRow) {
      throw new Error("Razgovor nije dostupan.");
    }

    const timestamp = this.getTimestamp();
    await this.setConversationUserState(normalizeId(conversationId), normalizedCurrentUserId, {
      archivedAt: "",
      clearedAt: timestamp,
    });
    await this.upsertReadMarker(normalizeId(conversationId), normalizedCurrentUserId, timestamp);
  }
}

export async function createLiveChatStore({
  now = () => Date.now(),
  idFactory = () => Math.random().toString(36).slice(2, 10),
  secret = "",
} = {}) {
  const presenceByOrganization = new Map();
  const encryptionKey = deriveEncryptionKey(secret);
  const kind = getDatabaseKind();
  const store = kind === "mysql"
    ? new MySqlLiveChatStore({
      now,
      idFactory,
      encryptionKey,
      presenceByOrganization,
      connectionString: process.env.DATABASE_URL,
    })
    : new MemoryLiveChatStore({
      now,
      idFactory,
      encryptionKey,
      presenceByOrganization,
    });

  await store.init();

  function setPresence({ organizationId, userId, status }) {
    const normalizedOrganizationId = normalizeId(organizationId);
    const normalizedUserId = normalizeId(userId);

    if (!normalizedOrganizationId) {
      throw new Error("Organizacija je obavezna za chat.");
    }

    if (!normalizedUserId) {
      throw new Error("Korisnik je obavezan za presence.");
    }

    if (!presenceByOrganization.has(normalizedOrganizationId)) {
      presenceByOrganization.set(normalizedOrganizationId, new Map());
    }

    presenceByOrganization.get(normalizedOrganizationId).set(normalizedUserId, {
      status: normalizePresenceStatus(status),
      updatedAtMs: now(),
      updatedAt: new Date(now()).toISOString(),
    });
  }

  return {
    kind: store.kind,
    async close() {
      await store.close();
    },
    async getSnapshot({ organizationId, currentUser, users = [], activeConversationId = "" }) {
      return store.getSnapshot({
        organizationId,
        currentUser: normalizeUserSummary(currentUser),
        users,
        activeConversationId,
      });
    },
    async createConversation({ organizationId, currentUser, users = [], title = "", participantIds = [] }) {
      return store.createConversation({
        organizationId,
        currentUser,
        users,
        title,
        participantIds,
      });
    },
    async addMessage({ organizationId, conversationId, currentUser, body }) {
      return store.addMessage({
        organizationId,
        conversationId,
        currentUser,
        body,
      });
    },
    async markConversationRead({ organizationId, conversationId, currentUserId }) {
      return store.markConversationRead({
        organizationId,
        conversationId,
        currentUserId,
      });
    },
    async archiveConversation({ organizationId, conversationId, currentUserId, archived = true }) {
      return store.archiveConversation({
        organizationId,
        conversationId,
        currentUserId,
        archived,
      });
    },
    async clearConversationHistory({ organizationId, conversationId, currentUserId }) {
      return store.clearConversationHistory({
        organizationId,
        conversationId,
        currentUserId,
      });
    },
    setPresence({ organizationId, userId, status }) {
      setPresence({ organizationId, userId, status });
    },
  };
}
