const authScreen = document.querySelector(".auth-screen");
const authCard = document.querySelector(".auth-minimal-card");
const authLinks = Array.from(document.querySelectorAll('a.auth-switch-link[href]'));
const authStoryQuote = document.querySelector("[data-auth-story-quote]");
const authStoryAuthor = document.querySelector("[data-auth-story-author]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const AUTH_STORY_ROTATE_MS = 10_000;
const AUTH_STORY_SWAP_MS = 240;
const AUTH_STORY_FALLBACK_QUOTE = String(authStoryQuote?.textContent || "").trim();
const AUTH_STORY_FALLBACK_AUTHOR = String(authStoryAuthor?.textContent || "").trim() || "SafeNexus";
let authStoryTimerId = null;
let authStorySignature = "";

if (authScreen && authCard) {
  document.body.classList.add("auth-page");

  if (!prefersReducedMotion) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.body.classList.add("is-auth-ready");
      });
    });

    for (const link of authLinks) {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");

        if (
          !href
          || event.defaultPrevented
          || event.button !== 0
          || event.metaKey
          || event.ctrlKey
          || event.shiftKey
          || event.altKey
        ) {
          return;
        }

        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.origin !== window.location.origin) {
          return;
        }

        event.preventDefault();
        document.body.classList.add("is-auth-leaving");

        window.setTimeout(() => {
          window.location.assign(targetUrl.pathname + targetUrl.search + targetUrl.hash);
        }, 260);
      });
    }
  }
}

function normalizeAuthStory(payload = {}) {
  return {
    quote: String(payload?.quoteText || payload?.heading || "").trim(),
    author: String(payload?.authorName || payload?.authorTitle || "").trim() || "SafeNexus",
  };
}

function setAuthStoryContent({ quote = "", author = "" } = {}) {
  if (authStoryQuote) {
    authStoryQuote.textContent = quote || AUTH_STORY_FALLBACK_QUOTE || "Sign in to your SafeNexus workspace.";
  }
  if (authStoryAuthor) {
    authStoryAuthor.textContent = author || AUTH_STORY_FALLBACK_AUTHOR;
  }
}

function applyAuthStory(story, { animate = true } = {}) {
  const normalized = normalizeAuthStory(story);
  const signature = `${normalized.quote}::${normalized.author}`;
  if (!normalized.quote || signature === authStorySignature) {
    return;
  }

  authStorySignature = signature;
  if (!animate || prefersReducedMotion) {
    setAuthStoryContent(normalized);
    return;
  }

  authStoryQuote?.classList.add("is-story-leaving");
  authStoryAuthor?.classList.add("is-story-leaving");

  window.setTimeout(() => {
    setAuthStoryContent(normalized);
    authStoryQuote?.classList.remove("is-story-leaving");
    authStoryAuthor?.classList.remove("is-story-leaving");
    authStoryQuote?.classList.add("is-story-entering");
    authStoryAuthor?.classList.add("is-story-entering");

    window.setTimeout(() => {
      authStoryQuote?.classList.remove("is-story-entering");
      authStoryAuthor?.classList.remove("is-story-entering");
    }, AUTH_STORY_SWAP_MS);
  }, AUTH_STORY_SWAP_MS);
}

async function fetchAuthStory() {
  const response = await fetch("/api/auth/login-content", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load auth story content.");
  }
  return response.json().catch(() => ({}));
}

function scheduleAuthStoryRotation() {
  if (!authStoryQuote || !authStoryAuthor) {
    return;
  }

  if (authStoryTimerId) {
    window.clearTimeout(authStoryTimerId);
    authStoryTimerId = null;
  }

  authStoryTimerId = window.setTimeout(async () => {
    if (authScreen?.hidden) {
      scheduleAuthStoryRotation();
      return;
    }

    try {
      const payload = await fetchAuthStory();
      applyAuthStory(payload, { animate: true });
    } catch {
      // Keep the current story visible on transient fetch errors.
    } finally {
      scheduleAuthStoryRotation();
    }
  }, AUTH_STORY_ROTATE_MS);
}

if (authStoryQuote && authStoryAuthor) {
  authStorySignature = `${String(authStoryQuote.textContent || "").trim()}::${String(authStoryAuthor.textContent || "").trim()}`;

  void fetchAuthStory()
    .then((payload) => {
      applyAuthStory(payload, { animate: false });
    })
    .catch(() => {
      // Keep the fallback content already present in HTML.
    })
    .finally(() => {
      scheduleAuthStoryRotation();
    });

  window.addEventListener("beforeunload", () => {
    if (authStoryTimerId) {
      window.clearTimeout(authStoryTimerId);
      authStoryTimerId = null;
    }
  }, { once: true });
}
