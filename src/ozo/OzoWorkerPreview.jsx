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
  {
    id: "male",
    label: "Muški radnik",
    skin: "#d8a271",
    skinLight: "#efc39a",
    skinDark: "#b9794b",
    hair: "#2f2119",
    jaw: "M 96 82 C 99 108 116 123 140 123 C 164 123 181 108 184 82 C 181 50 162 31 140 31 C 118 31 99 50 96 82 Z",
  },
  {
    id: "female",
    label: "Ženska radnica",
    skin: "#e4b184",
    skinLight: "#f3caa5",
    skinDark: "#be8258",
    hair: "#4b2c20",
    jaw: "M 99 83 C 103 109 120 124 140 124 C 160 124 177 109 181 83 C 178 52 159 34 140 34 C 121 34 102 52 99 83 Z",
  },
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
  const skinGradient = `url(#ozo-skin-${worker.id})`;
  const uniformGradient = `url(#ozo-uniform-${worker.id})`;
  const sleeveGradient = `url(#ozo-sleeve-${worker.id})`;
  const pantsGradient = `url(#ozo-pants-${worker.id})`;
  const bootGradient = `url(#ozo-boot-${worker.id})`;

  return (
    <motion.div
      className={`ozo-worker-figure is-${worker.id}`}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
    >
      <svg className={`ozo-worker-svg is-${worker.id}`} viewBox="0 0 280 430" role="img" aria-label={worker.label}>
        <defs>
          <linearGradient id={`ozo-skin-${worker.id}`} x1="0.25" y1="0.08" x2="0.78" y2="0.95">
            <stop offset="0%" stopColor={worker.skinLight} />
            <stop offset="54%" stopColor={worker.skin} />
            <stop offset="100%" stopColor={worker.skinDark} />
          </linearGradient>
          <linearGradient id={`ozo-uniform-${worker.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#244d7a" />
            <stop offset="48%" stopColor="#15365c" />
            <stop offset="100%" stopColor="#0b1e35" />
          </linearGradient>
          <linearGradient id={`ozo-sleeve-${worker.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#285783" />
            <stop offset="46%" stopColor="#1a3b62" />
            <stop offset="100%" stopColor="#12233c" />
          </linearGradient>
          <linearGradient id={`ozo-pants-${worker.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#163a63" />
            <stop offset="52%" stopColor="#102a48" />
            <stop offset="100%" stopColor="#07182b" />
          </linearGradient>
          <linearGradient id={`ozo-boot-${worker.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a5525" />
            <stop offset="58%" stopColor="#5b351b" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
        </defs>
        <ellipse className="ozo-svg-shadow" cx="140" cy="414" rx="82" ry="14" />
        {worker.id === "female" && <path className="ozo-svg-hair-back" d="M91 83 C89 47 111 22 140 22 C170 22 192 48 190 86 C188 127 172 154 140 157 C108 154 93 126 91 83 Z" fill={worker.hair} />}
        <path className="ozo-svg-leg" fill={pantsGradient} d="M99 273 C107 269 121 269 131 274 L126 390 L91 390 C91 345 93 306 99 273 Z" />
        <path className="ozo-svg-leg" fill={pantsGradient} d="M149 274 C159 269 173 269 181 273 C187 306 189 345 189 390 L154 390 Z" />
        <path className="ozo-svg-leg-highlight" d="M113 286 C111 318 109 351 108 382" />
        <path className="ozo-svg-leg-highlight" d="M167 286 C169 318 171 351 172 382" />
        <rect className="ozo-svg-knee" x="98" y="318" width="29" height="34" rx="9" />
        <rect className="ozo-svg-knee" x="153" y="318" width="29" height="34" rx="9" />
        <path className="ozo-svg-cargo" d="M91 296 L124 292 L125 316 L92 320 Z" />
        <path className="ozo-svg-cargo" d="M156 292 L189 296 L188 320 L155 316 Z" />
        <path className="ozo-svg-boot-base" fill={bootGradient} d="M91 384 L125 384 L131 410 L80 410 C77 398 82 390 91 384 Z" />
        <path className="ozo-svg-boot-base" fill={bootGradient} d="M155 384 L189 384 C198 390 203 398 200 410 L149 410 Z" />
        <path className="ozo-svg-sole" d="M80 408 L132 408" />
        <path className="ozo-svg-sole" d="M148 408 L200 408" />
        <path className="ozo-svg-boot-detail" d="M94 393 C103 397 115 397 124 393" />
        <path className="ozo-svg-boot-detail" d="M156 393 C165 397 177 397 186 393" />
        <path className="ozo-svg-arm" fill={sleeveGradient} d="M92 162 C72 180 61 214 52 258 C58 265 70 269 82 266 C90 226 99 198 114 178 Z" />
        <path className="ozo-svg-arm" fill={sleeveGradient} d="M188 162 C208 180 219 214 228 258 C222 265 210 269 198 266 C190 226 181 198 166 178 Z" />
        <path className="ozo-svg-arm-highlight" d="M78 183 C69 205 63 229 59 255" />
        <path className="ozo-svg-arm-highlight" d="M202 183 C211 205 217 229 221 255" />
        <path className="ozo-svg-hand" fill={skinGradient} d="M50 258 C63 249 80 254 84 268 C80 283 63 289 52 279 C45 273 44 264 50 258 Z" />
        <path className="ozo-svg-hand" fill={skinGradient} d="M230 258 C217 249 200 254 196 268 C200 283 217 289 228 279 C235 273 236 264 230 258 Z" />
        <path className="ozo-svg-neck" fill={skinGradient} d="M127 126 L153 126 L157 153 C149 161 131 161 123 153 Z" />
        <path className="ozo-svg-body" fill={uniformGradient} d="M90 159 L118 145 L132 174 L148 174 L162 145 L190 159 L181 281 L99 281 Z" />
        <path className="ozo-svg-jacket-yoke" d="M98 167 C116 158 126 156 140 158 C154 156 164 158 182 167 L176 189 C156 181 124 181 104 189 Z" />
        <path className="ozo-svg-jacket-panel is-left" d="M101 191 L134 181 L133 279 L100 279 Z" />
        <path className="ozo-svg-jacket-panel is-right" d="M146 181 L179 191 L180 279 L147 279 Z" />
        <rect className="ozo-svg-pocket" x="107" y="196" width="25" height="27" rx="5" />
        <rect className="ozo-svg-pocket" x="148" y="196" width="25" height="27" rx="5" />
        <path className="ozo-svg-pocket-flap" d="M109 201 L130 201" />
        <path className="ozo-svg-pocket-flap" d="M150 201 L171 201" />
        <path className="ozo-svg-zip" d="M140 176 L140 280" />
        <path className="ozo-svg-collar" d="M118 146 L140 176 L162 146" />
        <path className="ozo-svg-seam" d="M105 236 L134 236" />
        <path className="ozo-svg-seam" d="M146 236 L175 236" />
        <ellipse className="ozo-svg-ear" cx="97" cy="87" rx="8" ry="13" fill={skinGradient} />
        <ellipse className="ozo-svg-ear" cx="183" cy="87" rx="8" ry="13" fill={skinGradient} />
        {worker.id === "male" && <path className="ozo-svg-hair" d="M97 78 C101 43 120 27 141 27 C166 27 182 48 184 79 C169 62 151 59 132 65 C117 70 106 75 97 78 Z" fill={worker.hair} />}
        <path className="ozo-svg-head" d={worker.jaw} fill={skinGradient} />
        {worker.id === "female" && <path className="ozo-svg-hair" d="M98 79 C102 48 121 32 140 32 C162 32 178 50 182 82 C166 65 154 61 140 65 C126 61 114 65 98 79 Z" fill={worker.hair} />}
        <path className="ozo-svg-face-shadow" d="M160 53 C172 65 175 93 167 108 C161 119 149 124 138 122 C153 113 161 97 160 53 Z" />
        {worker.id === "male" && <path className="ozo-svg-beard" d="M105 96 C115 118 130 126 145 124 C162 122 174 112 179 94 C171 115 154 118 140 117 C124 118 112 113 105 96 Z" />}
        <path className="ozo-svg-brow" d="M116 80 C123 76 130 77 135 80" />
        <path className="ozo-svg-brow" d="M146 80 C153 76 160 77 166 80" />
        <circle className="ozo-svg-eye" cx="126" cy="89" r="3" />
        <circle className="ozo-svg-eye" cx="154" cy="89" r="3" />
        <path className="ozo-svg-nose" d="M140 92 C137 101 136 106 142 108" />
        <path className="ozo-svg-cheek" d="M115 101 C121 104 127 104 132 101" />
        <path className="ozo-svg-cheek" d="M148 101 C154 104 161 104 166 101" />
        <path className="ozo-svg-face-line" d="M130 113 C137 118 146 118 153 113" />
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
