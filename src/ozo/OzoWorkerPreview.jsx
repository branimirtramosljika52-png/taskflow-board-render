import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ASSET_VERSION = "20260528-ozo-ai-v2";

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

const WORKER_VARIANTS = [
  { id: "base", label: "Bez dodatne OZO", file: "base.png", gear: [] },
  { id: "helmet", label: "Kacige", file: "helmet.png", gear: ["helmet"] },
  { id: "earmuffs", label: "Antifoni", file: "earmuffs.png", gear: ["earmuffs"] },
  { id: "glasses", label: "Naočale", file: "glasses.png", gear: ["glasses"] },
  { id: "face-shield", label: "Viziri", file: "face-shield.png", gear: ["faceShield"] },
  { id: "respirator", label: "Respiratori", file: "respirator.png", gear: ["respirator"] },
  { id: "vest", label: "Reflektirajući prsluci", file: "vest.png", gear: ["vest"] },
  { id: "gloves", label: "Rukavice", file: "gloves.png", gear: ["gloves"] },
  { id: "helmet-vest", label: "Kacige i prsluci", file: "helmet-vest.png", gear: ["helmet", "vest"] },
  { id: "helmet-earmuffs", label: "Kacige i antifoni", file: "helmet-earmuffs.png", gear: ["helmet", "earmuffs"] },
  { id: "helmet-face-shield", label: "Kacige i viziri", file: "helmet-face-shield.png", gear: ["helmet", "faceShield"] },
  { id: "helmet-respirator", label: "Kacige i respiratori", file: "helmet-respirator.png", gear: ["helmet", "respirator"] },
  { id: "helmet-glasses", label: "Kacige i naočale", file: "helmet-glasses.png", gear: ["helmet", "glasses"] },
  { id: "helmet-glasses-vest", label: "Kacige, naočale i prsluci", file: "helmet-glasses-vest.png", gear: ["helmet", "glasses", "vest"] },
  { id: "helmet-glasses-vest-gloves", label: "Kacige, naočale, prsluci i rukavice", file: "helmet-glasses-vest-gloves.png", gear: ["helmet", "glasses", "vest", "gloves"] },
  { id: "helmet-glasses-earmuffs-vest-gloves", label: "Kacige, naočale, antifoni, prsluci i rukavice", file: "helmet-glasses-earmuffs-vest-gloves.png", gear: ["helmet", "glasses", "earmuffs", "vest", "gloves"] },
  { id: "vest-earmuffs", label: "Prsluci i antifoni", file: "vest-earmuffs.png", gear: ["vest", "earmuffs"] },
  { id: "vest-gloves", label: "Prsluci i rukavice", file: "vest-gloves.png", gear: ["vest", "gloves"] },
  { id: "helmet-face-shield-respirator", label: "Kacige, viziri i respiratori", file: "helmet-face-shield-respirator.png", gear: ["helmet", "faceShield", "respirator"] },
  { id: "full", label: "Kompletna OZO", file: "full.png", gear: ["helmet", "glasses", "earmuffs", "respirator", "vest", "gloves"] },
].map((variant) => ({
  ...variant,
  src: `/assets/ozo/worker-ai/${variant.file}?v=${ASSET_VERSION}`,
  gearSet: new Set(variant.gear),
}));

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0111\u0110]/g, "d")
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
    item.id,
    item.catalogId,
    item.name,
    item.category,
    item.norm,
    item.standardCode,
    item.description,
  ].join(" "));

  if (text.includes("earmuff") || text.includes("antifon") || text.includes("cepici") || text.includes("usne skoljke") || text.includes("stitnici sluha") || text.includes("zastita sluha") || text.includes("en 352")) {
    return "earmuffs";
  }

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

function normalizeVariantGear(kind) {
  if (kind === "cap") return "helmet";
  if (kind === "mask") return "respirator";
  if (kind === "coverall") return "vest";
  if (kind === "harness" || kind === "kneepads" || kind === "boots") return null;
  return kind;
}

function chooseWorkerVariant(gearKinds = []) {
  const wanted = new Set(gearKinds.map(normalizeVariantGear).filter(Boolean));
  if (!wanted.size) return WORKER_VARIANTS[0];

  let bestVariant = WORKER_VARIANTS[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  WORKER_VARIANTS.forEach((variant) => {
    let overlap = 0;
    let missing = 0;
    let extras = 0;

    wanted.forEach((kind) => {
      if (variant.gearSet.has(kind)) overlap += 1;
      else missing += 1;
    });

    variant.gearSet.forEach((kind) => {
      if (!wanted.has(kind)) extras += 1;
    });

    const exactBonus = missing === 0 && extras === 0 ? 24 : 0;
    const fullBonus = wanted.size >= 5 && variant.id === "full" ? 12 : 0;
    const score = overlap * 14 - missing * 9 - extras * 4 + exactBonus + fullBonus;

    if (score > bestScore) {
      bestScore = score;
      bestVariant = variant;
    }
  });

  return bestVariant;
}

export function OzoWorkerPreview({
  selectedItems = [],
  selectedBodyParts = [],
}) {
  const gearItems = useMemo(() => buildGearItems(selectedItems, selectedBodyParts), [selectedItems, selectedBodyParts]);
  const gearKinds = useMemo(() => gearItems.map((gear) => gear.kind), [gearItems]);
  const activeParts = useMemo(() => Array.from(new Set(gearItems.map((gear) => gear.part || "other"))), [gearItems]);
  const workerVariant = useMemo(() => chooseWorkerVariant(gearKinds), [gearKinds]);

  return (
    <section className="ozo-worker-panel" aria-label="Realisticni prikaz radnika s OZO">
      <div className="ozo-worker-hero is-ai">
        <div className="ozo-worker-stage-copy">
          <span>AI realistic worker preview</span>
          <strong>Realni radnici i oprema prema odabiru</strong>
        </div>
        <div className="ozo-stage-tags" aria-label="Aktivne zone zaštite">
          <AnimatePresence initial={false}>
            {gearItems.length ? gearItems.slice(0, 6).map((gear) => (
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
          className="ozo-worker-image-wrap"
          data-ozo-worker-variant={workerVariant.id}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={workerVariant.id}
              className="ozo-ai-worker-image"
              src={workerVariant.src}
              alt="Muški i ženski industrijski radnik s odabranom osobnom zaštitnom opremom"
              initial={{ opacity: 0, scale: 1.018, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.992, y: -8 }}
              transition={{ duration: 0.34, ease: "easeOut" }}
              loading="eager"
            />
          </AnimatePresence>
          <div className="ozo-worker-image-sheen" aria-hidden="true" />
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
          <span>AI render</span>
          <strong>{workerVariant.label}</strong>
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
