const authScreen = document.querySelector(".auth-screen");
const authCard = document.querySelector(".auth-minimal-card");
const authLinks = Array.from(document.querySelectorAll('a.auth-switch-link[href]'));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
