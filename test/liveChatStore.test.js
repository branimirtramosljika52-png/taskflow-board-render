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

test("chat bootstrap starts without a default conversation and keeps presence fresh", async () => {
  let nowValue = Date.parse("2026-03-28T08:00:00.000Z");
  const store = await createLiveChatStore({
    now: () => nowValue,
    idFactory: () => "seed",
  });

  const users = createUsers();
  store.setPresence({ organizationId: "org-1", userId: "u-1", status: "online" });
  const snapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[0],
    users,
  });

  assert.equal(snapshot.conversations.length, 0);
  assert.equal(snapshot.activeConversation, null);
  assert.equal(snapshot.presenceByUserId["u-1"], "online");

  nowValue += 120_000;
  store.setPresence({ organizationId: "org-1", userId: "u-2", status: "online" });
  const staleSnapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
  });

  assert.equal(staleSnapshot.presenceByUserId["u-1"], "offline");
  assert.equal(staleSnapshot.presenceByUserId["u-2"], "online");
});

test("direct conversations are reused for the same two participants", async () => {
  const store = await createLiveChatStore({
    now: () => Date.parse("2026-03-28T08:00:00.000Z"),
    idFactory: () => "direct",
  });

  const users = createUsers();
  const firstId = await store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    participantIds: ["u-2"],
  });
  const secondId = await store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    participantIds: ["u-2"],
  });

  assert.equal(firstId, secondId);

  const snapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    activeConversationId: firstId,
  });

  const directConversation = snapshot.conversations.find((conversation) => conversation.id === firstId);
  assert.ok(directConversation);
  assert.equal(directConversation.kind, "direct");
  assert.equal(directConversation.title, "Iva Horvat");
  assert.equal(snapshot.activeConversation?.id, firstId);
  assert.deepEqual(snapshot.activeConversation?.messages ?? [], []);
});

test("group conversations and messages stay scoped to the organization", async () => {
  let nowValue = Date.parse("2026-03-28T08:00:00.000Z");
  const store = await createLiveChatStore({
    now: () => nowValue,
    idFactory: () => "grp",
  });
  const users = createUsers();

  const conversationId = await store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    title: "Teren Zagreb",
    participantIds: ["u-2", "u-3"],
  });

  nowValue += 1_000;
  await store.addMessage({
    organizationId: "org-1",
    conversationId,
    currentUser: users[0],
    body: "Idemo na teren u 14:00.",
  });

  const orgOneSnapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
    activeConversationId: conversationId,
  });
  const groupConversation = orgOneSnapshot.conversations.find((conversation) => conversation.id === conversationId);
  assert.ok(groupConversation);
  assert.equal(groupConversation.unreadCount, 1);
  assert.equal(orgOneSnapshot.activeConversation?.messages.length, 1);
  assert.equal(orgOneSnapshot.activeConversation?.messages[0]?.body, "Idemo na teren u 14:00.");

  const orgTwoSnapshot = await store.getSnapshot({
    organizationId: "org-2",
    currentUser: users[1],
    users,
  });
  assert.equal(orgTwoSnapshot.conversations.length, 0);
  assert.equal(orgTwoSnapshot.activeConversation, null);
});

test("markConversationRead clears unread counts for the selected user", async () => {
  let nowValue = Date.parse("2026-03-28T08:00:00.000Z");
  const store = await createLiveChatStore({
    now: () => nowValue,
    idFactory: () => "read",
  });
  const users = createUsers();

  const conversationId = await store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    participantIds: ["u-2"],
  });

  nowValue += 1_000;
  await store.addMessage({
    organizationId: "org-1",
    conversationId,
    currentUser: users[0],
    body: "Provjeri dokumentaciju prije polaska.",
  });

  let snapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
    activeConversationId: conversationId,
  });
  assert.equal(snapshot.conversations.find((conversation) => conversation.id === conversationId)?.unreadCount, 1);

  nowValue += 1_000;
  await store.markConversationRead({
    organizationId: "org-1",
    conversationId,
    currentUserId: "u-2",
  });

  snapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
    activeConversationId: conversationId,
  });
  assert.equal(snapshot.conversations.find((conversation) => conversation.id === conversationId)?.unreadCount, 0);
});

test("archiving hides old conversations and clearing history hides earlier messages for one user", async () => {
  let nowValue = Date.parse("2026-03-28T08:00:00.000Z");
  const store = await createLiveChatStore({
    now: () => nowValue,
    idFactory: () => "archive",
  });
  const users = createUsers();

  const conversationId = await store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    participantIds: ["u-2"],
  });

  nowValue += 1_000;
  await store.addMessage({
    organizationId: "org-1",
    conversationId,
    currentUser: users[0],
    body: "Prva poruka",
  });

  nowValue += 1_000;
  await store.clearConversationHistory({
    organizationId: "org-1",
    conversationId,
    currentUserId: "u-2",
  });

  let snapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
    activeConversationId: conversationId,
  });
  assert.equal(snapshot.conversations.find((conversation) => conversation.id === conversationId)?.unreadCount, 0);
  assert.deepEqual(snapshot.activeConversation?.messages ?? [], []);

  nowValue += 1_000;
  await store.archiveConversation({
    organizationId: "org-1",
    conversationId,
    currentUserId: "u-2",
    archived: true,
  });

  snapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
    activeConversationId: conversationId,
  });
  assert.equal(snapshot.conversations.length, 0);
  assert.equal(snapshot.activeConversation, null);

  nowValue += 1_000;
  await store.addMessage({
    organizationId: "org-1",
    conversationId,
    currentUser: users[0],
    body: "Nova poruka nakon arhive",
  });

  snapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
    activeConversationId: conversationId,
  });
  assert.equal(snapshot.conversations.length, 1);
  assert.equal(snapshot.activeConversation?.messages.length, 1);
  assert.equal(snapshot.activeConversation?.messages[0]?.body, "Nova poruka nakon arhive");
});

test("deleting a conversation hides old history for one user until a new message arrives", async () => {
  let nowValue = Date.parse("2026-03-28T08:00:00.000Z");
  const store = await createLiveChatStore({
    now: () => nowValue,
    idFactory: () => "delete",
  });
  const users = createUsers();

  const conversationId = await store.createConversation({
    organizationId: "org-1",
    currentUser: users[0],
    users,
    participantIds: ["u-2"],
  });

  nowValue += 1_000;
  await store.addMessage({
    organizationId: "org-1",
    conversationId,
    currentUser: users[0],
    body: "Poruka prije brisanja",
  });

  nowValue += 1_000;
  await store.deleteConversation({
    organizationId: "org-1",
    conversationId,
    currentUserId: "u-2",
  });

  let snapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
    activeConversationId: conversationId,
  });
  assert.equal(snapshot.conversations.length, 0);
  assert.equal(snapshot.activeConversation, null);

  nowValue += 1_000;
  await store.addMessage({
    organizationId: "org-1",
    conversationId,
    currentUser: users[0],
    body: "Nova poruka nakon brisanja",
  });

  snapshot = await store.getSnapshot({
    organizationId: "org-1",
    currentUser: users[1],
    users,
    activeConversationId: conversationId,
  });
  assert.equal(snapshot.conversations.length, 1);
  assert.equal(snapshot.activeConversation?.messages.length, 1);
  assert.equal(snapshot.activeConversation?.messages[0]?.body, "Nova poruka nakon brisanja");
});
