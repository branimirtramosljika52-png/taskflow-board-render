function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const CHAT_EMOJI_SHORTCUTS = Object.freeze([
  {
    emoji: "🙂",
    label: "Smiješak",
    shortcuts: [":)", ":-)"],
  },
  {
    emoji: "🙁",
    label: "Tuga",
    shortcuts: [":(", ":-("],
  },
  {
    emoji: "😕",
    label: "Nesigurno",
    shortcuts: [":/", ":-/"],
  },
  {
    emoji: "😉",
    label: "Namig",
    shortcuts: [";)", ";-)"],
  },
  {
    emoji: "😄",
    label: "Oduševljenje",
    shortcuts: [":D", ":-D", ":d", ":-d"],
  },
  {
    emoji: "😛",
    label: "Zaigrano",
    shortcuts: [":P", ":-P", ":p", ":-p"],
  },
  {
    emoji: "😐",
    label: "Ravno",
    shortcuts: [":|", ":-|"],
  },
  {
    emoji: "😮",
    label: "Iznenađenje",
    shortcuts: [":O", ":-O", ":o", ":-o"],
  },
  {
    emoji: "🥲",
    label: "Dirnuto",
    shortcuts: [":')", ":'-)"],
  },
  {
    emoji: "❤️",
    label: "Srce",
    shortcuts: ["<3"],
  },
  {
    emoji: "👍",
    label: "Like",
    shortcuts: [":thumbs:", "(y)"],
  },
  {
    emoji: "🔥",
    label: "Top",
    shortcuts: [":fire:"],
  },
]);

const CHAT_SHORTCUT_REPLACERS = CHAT_EMOJI_SHORTCUTS.flatMap((entry) => {
  return entry.shortcuts.map((shortcut) => ({
    emoji: entry.emoji,
    pattern: new RegExp(
      `(^|[^\\p{L}\\p{N}])${escapeRegex(shortcut)}(?=$|[^\\p{L}\\p{N}])`,
      "gu",
    ),
  }));
});

export function replaceEmojiShortcuts(value = "") {
  let nextValue = String(value ?? "");

  for (const replacer of CHAT_SHORTCUT_REPLACERS) {
    nextValue = nextValue.replace(replacer.pattern, (match, prefix = "") => `${prefix}${replacer.emoji}`);
  }

  return nextValue;
}

export function normalizeChatMessageBody(value = "") {
  return replaceEmojiShortcuts(
    String(value ?? "")
      .replace(/\r\n?/g, "\n")
      .trim(),
  );
}

export function normalizeChatPreviewText(value = "", maxLength = 120) {
  const compact = String(value ?? "").replace(/\s+/g, " ").trim();

  if (!compact) {
    return "";
  }

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
