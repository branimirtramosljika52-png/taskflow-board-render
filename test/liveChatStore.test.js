import assert from "node:assert/strict";
import test from "node:test";

import { createLiveChatStore } from "../src/liveChatStore.js";

function createUsers() {
  return [
    {
      id: "u-1",
      fullName: "Branimir Tramošljika",
      email: "bran@safety360.local",
      isActive: true,
    },
    {
      id: "u-2",
      fullName: "Iva Horvat",
      email: "iva@safety360.local",
      isActive: true,
    },
    {
      id: "u-3",
      fullName: "Marko Babić",
      email: "marko@safety360.local",
      isActive: true,
    },
  ];
}

test("chat bootstrap seeds a general conversation for the active organization", () => {
  let nowValue = Date.parse("2026-03-28T08:00:00.000Z");
  const store = createLiveChatStore({
    now: () => nowValue,
    idFactory: () => "seed",
  });

  const users = createUsers();
  store.setPresence({ organizationId: "org-1", userId: "u-1", status: "online" });
  const snapshot = store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[0],
    users,
  });

  assert.equal(snapshot.conversations.length, 1);
  assert.equal(snapshot.conversations[0].kind, "general");
  assert.equal(snapshot.conversations[0].title, "General");
  assert.equal(snapshot.presenceByUserId["u-1"], "online");

  nowValue += 120_000;
  store.setPresence({ organizationId: "org-1", userId: "u-2", status: "online" });
  const staleSnapshot = store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
  });

  assert.equal(staleSnapshot.presenceByUserId["u-1"], "offline");
  assert.equal(staleSnapshot.presenceByUserId["u-2"], "online");
});

test("direct conversations are reused for the same two participants", () => {
  const store = createLiveChatStore({
    now: () => Date.parse("2026-03-28T08:00:00.000Z"),
    idFactory: () => "direct",
  });

  const users = createUsers();
  const firstId = store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    participantIds: ["u-2"],
  });
  const secondId = store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    participantIds: ["u-2"],
  });

  assert.equal(firstId, secondId);

  const snapshot = store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[0],
    users,
  });

  const directConversation = snapshot.conversations.find((conversation) => conversation.id === firstId);
  assert.ok(directConversation);
  assert.equal(directConversation.kind, "direct");
  assert.equal(directConversation.title, "Iva Horvat");
});

test("group conversations and messages stay scoped to the organization", () => {
  let nowValue = Date.parse("2026-03-28T08:00:00.000Z");
  const store = createLiveChatStore({
    now: () => nowValue,
    idFactory: () => "grp",
  });
  const users = createUsers();

  const conversationId = store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    title: "Teren Zagreb",
    participantIds: ["u-2", "u-3"],
  });

  nowValue += 1_000;
  store.addMessage({
    organizationId: "org-1",
    conversationId,
    currentUser: users[0],
    body: "Idemo na teren u 14:00.",
  });

  const orgOneSnapshot = store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
  });
  const groupConversation = orgOneSnapshot.conversations.find((conversation) => conversation.id === conversationId);
  assert.ok(groupConversation);
  assert.equal(groupConversation.messages.length, 1);
  assert.equal(groupConversation.unreadCount, 1);

  const orgTwoSnapshot = store.getSnapshot({
    organizationId: "org-2",
    currentUser: users[1],
    users,
  });
  assert.equal(orgTwoSnapshot.conversations.length, 1);
  assert.equal(orgTwoSnapshot.conversations[0].kind, "general");
});

test("markConversationRead clears unread counts for the selected user", () => {
  let nowValue = Date.parse("2026-03-28T08:00:00.000Z");
  const store = createLiveChatStore({
    now: () => nowValue,
    idFactory: () => "read",
  });
  const users = createUsers();

  const conversationId = store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    participantIds: ["u-2"],
  });

  nowValue += 1_000;
  store.addMessage({
    organizationId: "org-1",
    conversationId,
    currentUser: users[0],
    body: "Provjeri dokumentaciju prije polaska.",
  });

  let snapshot = store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
  });
  assert.equal(snapshot.conversations.find((conversation) => conversation.id === conversationId)?.unreadCount, 1);

  nowValue += 1_000;
  store.markConversationRead({
    organizationId: "org-1",
    conversationId,
    currentUserId: "u-2",
  });

  snapshot = store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
  });
  assert.equal(snapshot.conversations.find((conversation) => conversation.id === conversationId)?.unreadCount, 0);
});
