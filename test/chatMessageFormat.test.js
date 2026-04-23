import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeChatMessageBody,
  normalizeChatPreviewText,
  replaceEmojiShortcuts,
} from "../src/chatMessageFormat.js";

test("replaceEmojiShortcuts converts common text emoticons", () => {
  assert.equal(
    replaceEmojiShortcuts("Pozdrav :) Kako si :/ Danas je super :D"),
    "Pozdrav 🙂 Kako si 😕 Danas je super 😄",
  );
  assert.equal(
    replaceEmojiShortcuts("Bas steta :( ali ide dalje <3"),
    "Bas steta 🙁 ali ide dalje ❤️",
  );
});

test("normalizeChatMessageBody trims and normalizes line breaks", () => {
  assert.equal(
    normalizeChatMessageBody("  Bok :) \r\nVidimo se sutra :P  "),
    "Bok 🙂 \nVidimo se sutra 😛",
  );
});

test("normalizeChatPreviewText compacts whitespace and truncates long copy", () => {
  const preview = normalizeChatPreviewText("  Prva   poruka   za   pregled  ", 18);
  assert.equal(preview, "Prva poruka za...");
});
