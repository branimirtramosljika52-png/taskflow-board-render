import React from "react";
import { createRoot } from "react-dom/client";
import { OzoEquipmentPanel } from "./OzoEquipmentPanel.jsx";

const mountedRoots = new WeakMap();

function readPayload(panel) {
  const payloadElement = panel.querySelector("[data-ozo-equipment-payload]");
  if (!payloadElement) {
    return null;
  }
  try {
    return JSON.parse(payloadElement.textContent || "{}");
  } catch {
    return null;
  }
}

function mountPanel(panel) {
  const rootElement = panel.querySelector("[data-ozo-equipment-root]");
  const payload = readPayload(panel);
  if (!rootElement || !payload) {
    return;
  }
  let root = mountedRoots.get(rootElement);
  if (!root) {
    root = createRoot(rootElement);
    mountedRoots.set(rootElement, root);
  }
  root.render(<OzoEquipmentPanel {...payload} />);
}

function mountAll(scope = document) {
  scope.querySelectorAll?.("[data-ozo-equipment-panel]").forEach((panel) => {
    mountPanel(panel);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => mountAll(), { once: true });
} else {
  mountAll();
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) {
        return;
      }
      if (node.matches("[data-ozo-equipment-panel]")) {
        mountPanel(node);
      }
      mountAll(node);
    });
  });
});

observer.observe(document.documentElement, { childList: true, subtree: true });

window.SafeNexusOzoPanel = {
  mountAll,
};
