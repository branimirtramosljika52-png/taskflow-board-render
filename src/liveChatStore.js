const PRESENCE_OPTIONS = new Set(["online", "away", "busy", "offline"]);
const STALE_PRESENCE_MS = 90_000;
const GENERAL_CONVERSATION_ID_PREFIX = "general:";

function normalizeId(value) {
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

function createGeneralConversation(organizationId, participantIds, timestamp) {
  return {
    id: `${GENERAL_CONVERSATION_ID_PREFIX}${organizationId}`,
    kind: "general",
    title: "General",
    participantIds,
    createdAt: timestamp,
    updatedAt: timestamp,
    messageIds: [],
    createdByUserId: "",
    directKey: "",
  };
}

function createConversationRecord({ id, kind, title, participantIds, createdByUserId, timestamp, directKey = "" }) {
  return {
    id,
    kind,
    title,
    participantIds,
    createdAt: timestamp,
    updatedAt: timestamp,
    messageIds: [],
    createdByUserId,
    directKey,
  };
}

function buildConversationTitle(conversation, currentUserId, usersById) {
  if (conversation.kind === "general") {
    return "General";
  }

  if (conversation.kind === "direct") {
    const otherParticipant = conversation.participantIds
      .filter((participantId) => participantId !== currentUserId)
      .map((participantId) => usersById.get(participantId))
      .find(Boolean);
    return otherParticipant?.fullName || otherParticipant?.email || "Direct chat";
  }

  if (conversation.title) {
    return conversation.title;
  }

  const participants = conversation.participantIds
    .filter((participantId) => participantId !== currentUserId)
    .map((participantId) => usersById.get(participantId))
    .filter(Boolean)
    .slice(0, 3)
    .map((participant) => participant.fullName || participant.email)
    .filter(Boolean);

  return participants.join(", ") || "Group chat";
}

function buildConversationParticipants(conversation, usersById) {
  return conversation.participantIds
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

function countUnreadMessages(messageIds, messages, readMarker, currentUserId) {
  let count = 0;

  for (const messageId of messageIds) {
    const message = messages.get(messageId);

    if (!message || message.authorId === currentUserId) {
      continue;
    }

    if (readMarker && message.createdAt <= readMarker) {
      continue;
    }

    count += 1;
  }

  return count;
}

function mapMessages(messageIds, messages, usersById) {
  return messageIds
    .map((messageId) => messages.get(messageId))
    .filter(Boolean)
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
    });
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

export function createLiveChatStore({
  now = () => Date.now(),
  idFactory = () => Math.random().toString(36).slice(2, 10),
} = {}) {
  const organizations = new Map();

  function getTimestamp() {
    return new Date(now()).toISOString();
  }

  function getOrganizationState(organizationId) {
    const normalizedOrganizationId = normalizeId(organizationId);

    if (!normalizedOrganizationId) {
      throw new Error("Organizacija je obavezna za chat.");
    }

    if (!organizations.has(normalizedOrganizationId)) {
      organizations.set(normalizedOrganizationId, {
        conversations: new Map(),
        messages: new Map(),
        reads: new Map(),
        presences: new Map(),
        conversationCounter: 0,
        messageCounter: 0,
      });
    }

    return organizations.get(normalizedOrganizationId);
  }

  function ensureGeneralConversation(organizationState, organizationId, userIds = []) {
    const generalId = `${GENERAL_CONVERSATION_ID_PREFIX}${organizationId}`;
    const timestamp = getTimestamp();
    const participantIds = dedupeIds(userIds);
    const existing = organizationState.conversations.get(generalId);

    if (!existing) {
      organizationState.conversations.set(
        generalId,
        createGeneralConversation(organizationId, participantIds, timestamp),
      );
      return;
    }

    existing.participantIds = dedupeIds([...existing.participantIds, ...participantIds]);
  }

  function touchPresence({ organizationId, userId, status = "online" }) {
    const organizationState = getOrganizationState(organizationId);
    const normalizedUserId = normalizeId(userId);

    if (!normalizedUserId) {
      throw new Error("Korisnik je obavezan za presence.");
    }

    organizationState.presences.set(normalizedUserId, {
      status: normalizePresenceStatus(status),
      updatedAtMs: now(),
      updatedAt: getTimestamp(),
    });
  }

  function ensureConversationForMembers({ organizationId, currentUserId, users = [] }) {
    const organizationState = getOrganizationState(organizationId);
    const activeUserIds = Array.from(ensureActiveUserMap(users).keys());
    ensureGeneralConversation(organizationState, organizationId, activeUserIds);

    const availableConversations = Array.from(organizationState.conversations.values());
    return availableConversations.filter((conversation) => conversation.participantIds.includes(currentUserId));
  }

  function getConversationSnapshot({ organizationId, currentUser, users = [] }) {
    const normalizedOrganizationId = normalizeId(organizationId);
    const normalizedCurrentUser = normalizeUserSummary(currentUser);
    const currentUserId = normalizedCurrentUser.id;
    const usersById = ensureActiveUserMap(users);
    const organizationState = getOrganizationState(normalizedOrganizationId);
    const conversations = ensureConversationForMembers({
      organizationId: normalizedOrganizationId,
      currentUserId,
      users,
    });
    const presenceByUserId = {};
    const timeValue = now();

    for (const user of usersById.values()) {
      presenceByUserId[user.id] = resolveEffectivePresence(
        organizationState.presences.get(user.id),
        timeValue,
      );
    }

    const conversationSnapshots = conversations
      .map((conversation) => {
        const readMarker = organizationState.reads.get(`${conversation.id}:${currentUserId}`) ?? "";
        const lastMessageId = conversation.messageIds[conversation.messageIds.length - 1] ?? "";
        const lastMessage = lastMessageId ? organizationState.messages.get(lastMessageId) : null;

        return {
          id: conversation.id,
          kind: conversation.kind,
          title: buildConversationTitle(conversation, currentUserId, usersById),
          participantIds: conversation.participantIds,
          participants: buildConversationParticipants(conversation, usersById),
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          unreadCount: countUnreadMessages(
            conversation.messageIds,
            organizationState.messages,
            readMarker,
            currentUserId,
          ),
          lastMessage: lastMessage
            ? {
              id: lastMessage.id,
              body: lastMessage.body,
              createdAt: lastMessage.createdAt,
              authorId: lastMessage.authorId,
              authorName: usersById.get(lastMessage.authorId)?.fullName || lastMessage.authorLabel || "User",
            }
            : null,
          messages: mapMessages(conversation.messageIds, organizationState.messages, usersById),
        };
      })
      .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));

    return {
      organizationId: normalizedOrganizationId,
      currentUserId,
      selfPresence: presenceByUserId[currentUserId] || "online",
      presenceByUserId,
      conversations: conversationSnapshots,
      users: Array.from(usersById.values()),
      serverTime: getTimestamp(),
    };
  }

  function createConversation({ organizationId, currentUser, users = [], title = "", participantIds = [] }) {
    const organizationState = getOrganizationState(organizationId);
    const normalizedCurrentUser = normalizeUserSummary(currentUser);
    const usersById = ensureActiveUserMap(users);
    const nextParticipantIds = dedupeIds([normalizedCurrentUser.id, ...participantIds]).filter((participantId) => usersById.has(participantId));

    if (nextParticipantIds.length < 2) {
      throw new Error("Odaberi barem jednog kolegu za razgovor.");
    }

    const timestamp = getTimestamp();
    const isDirect = nextParticipantIds.length === 2 && !normalizeId(title);
    const directKey = isDirect ? buildDirectConversationKey(nextParticipantIds) : "";

    if (isDirect) {
      const existingDirect = Array.from(organizationState.conversations.values()).find((conversation) => conversation.directKey === directKey);
      if (existingDirect) {
        organizationState.reads.set(`${existingDirect.id}:${normalizedCurrentUser.id}`, timestamp);
        return existingDirect.id;
      }
    }

    organizationState.conversationCounter += 1;
    const conversationId = `chat-${idFactory()}-${organizationState.conversationCounter}`;
    const conversation = createConversationRecord({
      id: conversationId,
      kind: isDirect ? "direct" : "group",
      title: normalizeId(title),
      participantIds: nextParticipantIds,
      createdByUserId: normalizedCurrentUser.id,
      timestamp,
      directKey,
    });
    organizationState.conversations.set(conversationId, conversation);
    organizationState.reads.set(`${conversationId}:${normalizedCurrentUser.id}`, timestamp);
    return conversationId;
  }

  function getConversationOrThrow(organizationState, conversationId, currentUserId) {
    const normalizedConversationId = normalizeId(conversationId);
    const conversation = organizationState.conversations.get(normalizedConversationId);

    if (!conversation || !conversation.participantIds.includes(currentUserId)) {
      throw new Error("Razgovor nije dostupan.");
    }

    return conversation;
  }

  function addMessage({ organizationId, conversationId, currentUser, body }) {
    const organizationState = getOrganizationState(organizationId);
    const normalizedCurrentUser = normalizeUserSummary(currentUser);
    const conversation = getConversationOrThrow(organizationState, conversationId, normalizedCurrentUser.id);
    const messageBody = normalizeId(body);

    if (!messageBody) {
      throw new Error("Poruka ne smije biti prazna.");
    }

    organizationState.messageCounter += 1;
    const timestamp = getTimestamp();
    const messageId = `msg-${idFactory()}-${organizationState.messageCounter}`;
    const message = {
      id: messageId,
      conversationId: conversation.id,
      body: messageBody,
      createdAt: timestamp,
      authorId: normalizedCurrentUser.id,
      authorLabel: normalizedCurrentUser.fullName || normalizedCurrentUser.email || "User",
    };

    organizationState.messages.set(messageId, message);
    conversation.messageIds.push(messageId);
    conversation.updatedAt = timestamp;
    organizationState.reads.set(`${conversation.id}:${normalizedCurrentUser.id}`, timestamp);
    return messageId;
  }

  function markConversationRead({ organizationId, conversationId, currentUserId }) {
    const organizationState = getOrganizationState(organizationId);
    const conversation = getConversationOrThrow(organizationState, conversationId, normalizeId(currentUserId));
    organizationState.reads.set(`${conversation.id}:${normalizeId(currentUserId)}`, getTimestamp());
  }

  return {
    getSnapshot({ organizationId, currentUser, users = [] }) {
      return getConversationSnapshot({
        organizationId,
        currentUser: normalizeUserSummary(currentUser),
        users,
      });
    },
    setPresence({ organizationId, userId, status }) {
      touchPresence({ organizationId, userId, status });
    },
    createConversation({ organizationId, currentUser, users = [], title = "", participantIds = [] }) {
      return createConversation({
        organizationId,
        currentUser,
        users,
        title,
        participantIds,
      });
    },
    addMessage({ organizationId, conversationId, currentUser, body }) {
      return addMessage({ organizationId, conversationId, currentUser, body });
    },
    markConversationRead({ organizationId, conversationId, currentUserId }) {
      markConversationRead({ organizationId, conversationId, currentUserId });
    },
  };
}
