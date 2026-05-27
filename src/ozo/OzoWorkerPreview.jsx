import React from "react";
import { AnimatePresence, motion } from "framer-motion";

const ATTACH_POINTS = {
  head: { label: "Glava", style: { left: "43%", top: "18%" } },
  eyes: { label: "Oči i lice", style: { left: "58%", top: "24%" } },
  hearing: { label: "Sluh", style: { left: "30%", top: "26%" } },
  respiratory: { label: "Disanje", style: { left: "61%", top: "33%" } },
  body: { label: "Tijelo", style: { left: "48%", top: "45%" } },
  hands: { label: "Ruke", style: { left: "68%", top: "52%" } },
  feet: { label: "Noge", style: { left: "51%", top: "82%" } },
  fall: { label: "Pad s visine", style: { left: "33%", top: "50%" } },
  other: { label: "Ostalo", style: { left: "50%", top: "62%" } },
};

function getBodyPartLabel(part = "other") {
  return ATTACH_POINTS[part]?.label || ATTACH_POINTS.other.label;
}

export function OzoWorkerPreview({
  workerImageUrl,
  selectedItems = [],
  selectedBodyParts = [],
}) {
  const animationKey = selectedItems.map((item) => item.catalogId || item.id || item.name).join("|") || "empty";
  const activeParts = Array.from(new Set(selectedBodyParts.length
    ? selectedBodyParts
    : selectedItems.map((item) => item.bodyPart || "other")));

  return (
    <section className="ozo-worker-panel" aria-label="3D prikaz radnika s OZO">
      <div className="ozo-worker-hero">
        <motion.img
          key={animationKey}
          src={workerImageUrl}
          alt="Realistični 3D prikaz muškog i ženskog industrijskog radnika s OZO"
          initial={{ opacity: 0.92, scale: 1.025, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
        <div className="ozo-worker-gradient" aria-hidden="true" />
        <AnimatePresence>
          {activeParts.map((part) => {
            const point = ATTACH_POINTS[part] || ATTACH_POINTS.other;
            return (
              <motion.span
                className={`ozo-attach-point is-${part}`}
                key={part}
                style={point.style}
                initial={{ opacity: 0, scale: 0.72, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.82, y: 8 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
              >
                <b />
                <small>{point.label}</small>
              </motion.span>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="ozo-worker-summary">
        <div>
          <span>OZO status</span>
          <strong>{selectedItems.length ? `${selectedItems.length} odabrano` : "Bez OZO"}</strong>
        </div>
        <div>
          <span>Zone zaštite</span>
          <strong>{activeParts.length ? activeParts.map(getBodyPartLabel).join(", ") : "Nije odabrano"}</strong>
        </div>
      </div>
      <div className="ozo-worker-selected-strip">
        <AnimatePresence initial={false}>
          {selectedItems.slice(0, 5).map((item, index) => (
            <motion.span
              key={`${item.catalogId || item.id || item.name}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              {item.name}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
