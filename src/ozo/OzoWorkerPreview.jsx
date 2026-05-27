import React, { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createOzoWorkerScene } from "./ozoWorkerScene.js";

const PART_LABELS = {
  head: "Glava",
  eyes: "Oči i lice",
  hearing: "Sluh",
  respiratory: "Disanje",
  body: "Tijelo",
  hands: "Ruke",
  feet: "Noge",
  fall: "Pad s visine",
  other: "Ostalo",
};

const GEAR_DEFINITIONS = {
  helmet: { label: "Kaciga", part: "head" },
  cap: { label: "Zaštitna kapa", part: "head" },
  faceShield: { label: "Vizir", part: "eyes" },
  glasses: { label: "Naočale", part: "eyes" },
  earmuffs: { label: "Antifoni", part: "hearing" },
  mask: { label: "Maska", part: "respiratory" },
  respirator: { label: "Respirator", part: "respiratory" },
  vest: { label: "Prsluk", part: "body" },
  coverall: { label: "Radna odjeća", part: "body" },
  harness: { label: "Pojas", part: "fall" },
  gloves: { label: "Rukavice", part: "hands" },
  boots: { label: "Obuća", part: "feet" },
  kneepads: { label: "Dodatna zaštita", part: "other" },
};

const GEAR_ORDER = [
  "coverall",
  "vest",
  "harness",
  "boots",
  "kneepads",
  "gloves",
  "earmuffs",
  "helmet",
  "cap",
  "faceShield",
  "glasses",
  "mask",
  "respirator",
];

const EXCLUSIVE_GEAR = [
  ["helmet", "cap"],
  ["faceShield", "glasses"],
  ["respirator", "mask"],
];

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[đĐ]/g, "d")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getFallbackGear(part = "other") {
  if (part === "head") return "helmet";
  if (part === "eyes") return "glasses";
  if (part === "hearing") return "earmuffs";
  if (part === "respiratory") return "mask";
  if (part === "body") return "vest";
  if (part === "hands") return "gloves";
  if (part === "feet") return "boots";
  if (part === "fall") return "harness";
  return "kneepads";
}

function getGearKind(item = {}) {
  const part = item.bodyPart || "other";
  const text = normalizeText([
    item.name,
    item.category,
    item.norm,
    item.standardCode,
    item.description,
  ].join(" "));

  if (text.includes("vizir") || text.includes("stitnik lica") || text.includes("stitnik za lice") || text.includes("face shield")) {
    return "faceShield";
  }

  if (text.includes("respirator") || text.includes("aparat") || text.includes("boca") || text.includes("izolacij")) {
    return "respirator";
  }

  if (text.includes("maska") || text.includes("polumaska")) {
    return "mask";
  }

  if (part === "head") {
    if (text.includes("kapa") || text.includes("kapuljaca") || text.includes("hood")) return "cap";
    return "helmet";
  }

  if (part === "eyes") return "glasses";
  if (part === "hearing") return "earmuffs";
  if (part === "respiratory") return text.includes("aparat") || text.includes("boca") || text.includes("scba") ? "respirator" : "mask";
  if (part === "hands") return "gloves";
  if (part === "feet") return "boots";
  if (part === "fall") return "harness";

  if (part === "body") {
    if (text.includes("prsluk") || text.includes("reflektir")) {
      return "vest";
    }
    if (text.includes("odijelo") || text.includes("kombinezon") || text.includes("odjeca") || text.includes("pregaca") || text.includes("hlace")) {
      return "coverall";
    }
    return "vest";
  }

  return "kneepads";
}

function buildGearItems(selectedItems, selectedBodyParts) {
  const byKind = new Map();

  selectedItems.forEach((item) => {
    const kind = getGearKind(item);
    if (!byKind.has(kind)) {
      byKind.set(kind, {
        kind,
        label: GEAR_DEFINITIONS[kind]?.label || item.name || "OZO",
        part: item.bodyPart || GEAR_DEFINITIONS[kind]?.part || "other",
      });
    }
  });

  if (!byKind.size) {
    selectedBodyParts.forEach((part) => {
      const kind = getFallbackGear(part);
      byKind.set(kind, {
        kind,
        label: GEAR_DEFINITIONS[kind]?.label || PART_LABELS[part] || "OZO",
        part,
      });
    });
  }

  EXCLUSIVE_GEAR.forEach(([primary, secondary]) => {
    if (byKind.has(primary) && byKind.has(secondary)) {
      byKind.delete(secondary);
    }
  });

  return GEAR_ORDER.filter((kind) => byKind.has(kind)).map((kind) => byKind.get(kind));
}

export function OzoWorkerPreview({
  selectedItems = [],
  selectedBodyParts = [],
}) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const gearItems = useMemo(() => buildGearItems(selectedItems, selectedBodyParts), [selectedItems, selectedBodyParts]);
  const gearKinds = useMemo(() => gearItems.map((gear) => gear.kind), [gearItems]);
  const gearSignature = gearKinds.join("|") || "empty";
  const activeParts = useMemo(() => Array.from(new Set(gearItems.map((gear) => gear.part || "other"))), [gearItems]);

  useEffect(() => {
    if (!canvasRef.current || !stageRef.current) return undefined;
    const scene = createOzoWorkerScene({
      canvas: canvasRef.current,
      stage: stageRef.current,
      gearKinds,
    });
    return () => scene.dispose();
  }, [gearSignature]);

  return (
    <section className="ozo-worker-panel" aria-label="Realistični 3D prikaz radnika s OZO">
      <div className="ozo-worker-hero is-three">
        <div className="ozo-worker-stage-copy">
          <span>3D worker preview</span>
          <strong>Oprema sjeda direktno na 3D model</strong>
        </div>
        <div className="ozo-stage-tags" aria-label="Aktivne zone zaštite">
          <AnimatePresence initial={false}>
            {gearItems.length ? gearItems.map((gear) => (
              <motion.span
                key={gear.kind}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {gear.label}
              </motion.span>
            )) : <span key="empty">Bez odabrane OZO</span>}
          </AnimatePresence>
        </div>
        <div
          className="ozo-worker-canvas-wrap"
          data-ozo-gear-signature={gearSignature}
          ref={stageRef}
        >
          <canvas
            aria-label="Muški i ženski 3D industrijski radnik s modularnom osobnom zaštitnom opremom"
            className="ozo-worker-canvas"
            data-ozo-worker-canvas
            ref={canvasRef}
          />
          <div className="ozo-worker-depth-grid" aria-hidden="true" />
          <div className="ozo-worker-floor-glow" aria-hidden="true" />
          <div className="ozo-gear-markers" aria-hidden="true">
            {gearKinds.flatMap((kind) => ["male", "female"].map((worker) => (
              <span data-ozo-gear-kind={kind} data-ozo-worker={worker} key={`${worker}-${kind}`} />
            )))}
          </div>
        </div>
      </div>
      <div className="ozo-worker-summary">
        <div>
          <span>OZO status</span>
          <strong>{selectedItems.length ? `${selectedItems.length} odabrano` : "Bez OZO"}</strong>
        </div>
        <div>
          <span>Zone zaštite</span>
          <strong>{activeParts.length ? activeParts.map((part) => PART_LABELS[part] || PART_LABELS.other).join(", ") : "Nije odabrano"}</strong>
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
