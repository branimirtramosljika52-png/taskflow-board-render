import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  coverall: { label: "Odjeća", part: "body" },
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

const WORKERS = [
  { id: "male", label: "Muški radnik", skin: "#d8a271", hair: "#2f2119", jaw: "M 98 82 C 101 104 117 115 140 114 C 162 113 177 101 181 82 C 177 51 158 34 139 34 C 119 34 101 51 98 82 Z" },
  { id: "female", label: "Ženska radnica", skin: "#e4b184", hair: "#4b2c20", jaw: "M 100 83 C 104 106 120 117 140 117 C 160 117 176 106 180 83 C 177 53 158 36 140 36 C 121 36 103 53 100 83 Z" },
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

function GearLayer({ kind }) {
  const layerTransition = { duration: 0.34, ease: "easeOut" };
  const layerProps = {
    initial: { opacity: 0, scale: 0.86, y: 18 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 10 },
    transition: layerTransition,
  };

  switch (kind) {
    case "helmet":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-helmet" {...layerProps}>
          <path d="M94 68 C98 36 116 20 140 20 C164 20 182 36 186 68 L94 68 Z" />
          <rect x="88" y="65" width="104" height="12" rx="6" />
          <path d="M140 22 L140 68" />
          <path d="M115 32 C108 42 104 54 103 68" />
          <path d="M165 32 C172 42 176 54 177 68" />
        </motion.g>
      );
    case "cap":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-cap" {...layerProps}>
          <path d="M101 61 C107 40 123 30 140 30 C158 30 173 41 178 62 C158 70 124 70 101 61 Z" />
          <path d="M146 62 C161 60 181 63 194 72 C176 78 157 76 142 69 Z" />
        </motion.g>
      );
    case "faceShield":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-face-shield" {...layerProps}>
          <path d="M103 67 L177 67 L170 128 C166 145 153 154 140 154 C127 154 114 145 110 128 Z" />
          <rect x="103" y="62" width="74" height="10" rx="5" />
          <path d="M121 79 C134 85 149 85 162 79" />
        </motion.g>
      );
    case "glasses":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-glasses" {...layerProps}>
          <path d="M108 88 C116 82 128 82 135 88 L145 88 C152 82 164 82 172 88" />
          <rect x="106" y="84" width="31" height="20" rx="8" />
          <rect x="143" y="84" width="31" height="20" rx="8" />
        </motion.g>
      );
    case "earmuffs":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-earmuffs" {...layerProps}>
          <path d="M101 83 C103 44 120 28 140 28 C160 28 177 44 179 83" />
          <rect x="88" y="78" width="23" height="42" rx="10" />
          <rect x="169" y="78" width="23" height="42" rx="10" />
        </motion.g>
      );
    case "mask":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-mask" {...layerProps}>
          <path d="M114 111 C124 101 156 101 166 111 L161 136 C152 143 128 143 119 136 Z" />
          <path d="M115 116 L98 106" />
          <path d="M165 116 L182 106" />
          <path d="M125 119 L155 119" />
          <path d="M128 129 L152 129" />
        </motion.g>
      );
    case "respirator":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-respirator" {...layerProps}>
          <path d="M114 108 C126 99 154 99 166 108 L164 136 C153 148 127 148 116 136 Z" />
          <circle cx="105" cy="128" r="14" />
          <circle cx="175" cy="128" r="14" />
          <path d="M124 117 L156 117" />
          <path d="M128 132 L152 132" />
        </motion.g>
      );
    case "vest":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-vest" {...layerProps}>
          <path d="M93 162 L119 148 L134 176 L146 176 L161 148 L187 162 L179 278 L101 278 Z" />
          <path d="M130 176 L117 278" />
          <path d="M150 176 L163 278" />
          <path d="M101 222 L179 222" />
          <path d="M106 250 L174 250" />
        </motion.g>
      );
    case "coverall":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-coverall" {...layerProps}>
          <path d="M92 160 L116 148 L132 178 L148 178 L164 148 L188 160 L180 281 L154 281 L147 386 L133 386 L126 281 L100 281 Z" />
          <path d="M140 178 L140 281" />
          <path d="M104 225 L176 225" />
        </motion.g>
      );
    case "harness":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-harness" {...layerProps}>
          <path d="M111 157 L139 255 L169 157" />
          <path d="M103 218 L177 218" />
          <path d="M111 275 L169 275" />
          <circle cx="140" cy="222" r="8" />
        </motion.g>
      );
    case "gloves":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-gloves" {...layerProps}>
          <path d="M55 259 C68 250 83 255 86 270 C82 284 66 290 54 280 C47 273 48 264 55 259 Z" />
          <path d="M225 259 C212 250 197 255 194 270 C198 284 214 290 226 280 C233 273 232 264 225 259 Z" />
          <path d="M66 255 L77 279" />
          <path d="M214 255 L203 279" />
        </motion.g>
      );
    case "boots":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-boots" {...layerProps}>
          <path d="M92 386 L125 386 L130 411 L82 411 C78 400 83 391 92 386 Z" />
          <path d="M155 386 L188 386 C197 391 202 400 198 411 L150 411 Z" />
          <path d="M88 402 L130 402" />
          <path d="M150 402 L192 402" />
        </motion.g>
      );
    case "kneepads":
      return (
        <motion.g className="ozo-svg-gear ozo-svg-kneepads" {...layerProps}>
          <rect x="99" y="312" width="27" height="35" rx="11" />
          <rect x="154" y="312" width="27" height="35" rx="11" />
        </motion.g>
      );
    default:
      return null;
  }
}

function WorkerFigure({ worker, gearItems }) {
  return (
    <motion.div
      className={`ozo-worker-figure is-${worker.id}`}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
    >
      <svg viewBox="0 0 280 430" role="img" aria-label={worker.label}>
        <defs>
          <linearGradient id={`ozo-uniform-${worker.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18385f" />
            <stop offset="100%" stopColor="#0b1e35" />
          </linearGradient>
          <linearGradient id={`ozo-sleeve-${worker.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f436c" />
            <stop offset="100%" stopColor="#12233c" />
          </linearGradient>
        </defs>
        <ellipse className="ozo-svg-shadow" cx="140" cy="414" rx="82" ry="14" />
        {worker.id === "female" && <path className="ozo-svg-hair-back" d="M92 86 C91 48 111 25 140 25 C169 25 190 48 188 88 C186 128 172 151 140 151 C108 151 94 126 92 86 Z" fill={worker.hair} />}
        <path className="ozo-svg-leg" d="M103 273 L130 273 L126 390 L92 390 Z" />
        <path className="ozo-svg-leg" d="M150 273 L177 273 L188 390 L154 390 Z" />
        <path className="ozo-svg-boot-base" d="M92 386 L125 386 L130 410 L82 410 C78 399 83 391 92 386 Z" />
        <path className="ozo-svg-boot-base" d="M155 386 L188 386 C197 391 202 399 198 410 L150 410 Z" />
        <path className="ozo-svg-arm" d="M93 166 C72 183 62 215 54 259 L80 266 C89 225 98 197 113 179 Z" />
        <path className="ozo-svg-arm" d="M187 166 C208 183 218 215 226 259 L200 266 C191 225 182 197 167 179 Z" />
        <path className="ozo-svg-hand" d="M51 260 C62 252 78 256 82 268 C78 282 62 287 52 278 C45 272 46 264 51 260 Z" fill={worker.skin} />
        <path className="ozo-svg-hand" d="M229 260 C218 252 202 256 198 268 C202 282 218 287 228 278 C235 272 234 264 229 260 Z" fill={worker.skin} />
        <path className="ozo-svg-neck" d="M128 128 L152 128 L155 154 C147 160 133 160 125 154 Z" fill={worker.skin} />
        <path className="ozo-svg-body" d="M92 160 L118 146 L132 174 L148 174 L162 146 L188 160 L180 280 L100 280 Z" />
        <path className="ozo-svg-zip" d="M140 174 L140 280" />
        <path className="ozo-svg-collar" d="M118 147 L140 176 L162 147" />
        {worker.id === "male" && <path className="ozo-svg-hair" d="M98 77 C104 45 120 31 140 31 C164 31 180 49 182 78 C168 63 150 61 132 66 C118 70 107 75 98 77 Z" fill={worker.hair} />}
        <path className="ozo-svg-head" d={worker.jaw} fill={worker.skin} />
        {worker.id === "female" && <path className="ozo-svg-hair" d="M99 80 C103 48 121 34 140 34 C161 34 177 50 181 81 C166 65 154 62 140 66 C126 62 114 66 99 80 Z" fill={worker.hair} />}
        <circle className="ozo-svg-eye" cx="126" cy="88" r="2.5" />
        <circle className="ozo-svg-eye" cx="154" cy="88" r="2.5" />
        <path className="ozo-svg-face-line" d="M133 107 C138 111 145 111 150 107" />
        <AnimatePresence initial={false}>
          {gearItems.map((gear) => <GearLayer key={`${worker.id}-${gear.kind}`} kind={gear.kind} />)}
        </AnimatePresence>
      </svg>
    </motion.div>
  );
}

export function OzoWorkerPreview({
  selectedItems = [],
  selectedBodyParts = [],
}) {
  const gearItems = useMemo(() => buildGearItems(selectedItems, selectedBodyParts), [selectedItems, selectedBodyParts]);
  const activeParts = useMemo(() => Array.from(new Set(gearItems.map((gear) => gear.part || "other"))), [gearItems]);

  return (
    <section className="ozo-worker-panel" aria-label="Animirani prikaz radnika s OZO">
      <div className="ozo-worker-hero">
        <div className="ozo-worker-stage-copy">
          <span>Worker preview</span>
          <strong>Oprema se dodaje po zoni tijela</strong>
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
        <div className="ozo-animated-workers" aria-hidden="false">
          {WORKERS.map((worker) => <WorkerFigure worker={worker} gearItems={gearItems} key={worker.id} />)}
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
