export const WORK_ORDER_DOCUMENT_FC_TYPE_LABELS = Object.freeze({
  1: "Mikroklimatski uvjeti",
  2: "Osvijetljenost",
  3: "Buka",
  4: "Vibracije",
});

export const WORK_ORDER_DOCUMENT_FC_HARMFULNESS_LABELS = Object.freeze({
  1: "Buka",
  2: "Vibracije",
  3: "Promjenjivi tlak",
  4: "Nepovoljni klimatski i mikroklimatski uvjeti",
  5: "Ionizirajuće zračenje",
  6: "Neionizirajuće zračenje",
  7: "Nedovoljna osvijetljenost / blještanje",
});

export const WORK_ORDER_DOCUMENT_FC_DEFAULT_OBLIGATION_REGISTERS = Object.freeze([
  "Zakon o zaštiti na radu",
  "Pravilnik o ispitivanju radnog okoliša",
]);

export const WORK_ORDER_DOCUMENT_FC_DEFAULT_HEALTH_REQUIREMENTS = Object.freeze([
  "Mikroklimatski uvjeti",
  "Osvijetljenost",
  "Buka",
  "Vibracije",
]);

export const WORK_ORDER_DOCUMENT_KC_DEFAULT_HEALTH_REQUIREMENTS = Object.freeze([
  "Kemijske štetnosti",
  "Granične vrijednosti izloženosti",
  "Biološke granične vrijednosti",
]);

export const WORK_ORDER_DOCUMENT_FC_SPACE_TEMPLATES = Object.freeze([
  {
    key: "office",
    label: "Ured / administracija",
    name: "Uredski prostor",
    description: "Administrativni rad, rad za računalom i komunikacija sa strankama.",
    processDescription: "Redoviti uredski proces rada.",
    equipmentDescription: "Računala, monitori, pisači i uredska oprema.",
    rangeDescription: "Mikroklima, osvijetljenost i buka prema mjernim mjestima.",
    allowedTemperature: "20-25",
    temperatureMin: "22,0",
    temperatureMax: "24,0",
    humidityRecommended: "40-60",
    humidityMin: "50,0",
    humidityMax: "55,0",
    airflowAllowed: "0,20",
    airflowMin: "0,10",
    airflowMax: "0,18",
    lightingRequired: "500",
    lightingMin: "650",
    lightingMax: "850",
    noiseAllowed: "60",
    noiseMin: "45",
    noiseMax: "55",
  },
  {
    key: "production",
    label: "Proizvodni prostor",
    name: "Proizvodni prostor",
    description: "Prostor za proizvodne aktivnosti i rad uz radnu opremu.",
    processDescription: "Proizvodni proces prema zatečenom stanju i opisu poslodavca.",
    equipmentDescription: "Radna oprema, strojevi, instalacije i izvori fizikalnih čimbenika.",
    rangeDescription: "Buka, osvijetljenost, mikroklima i vibracije po potrebi.",
    allowedTemperature: "18-26",
    temperatureMin: "20,0",
    temperatureMax: "25,0",
    humidityRecommended: "40-60",
    humidityMin: "45,0",
    humidityMax: "60,0",
    airflowAllowed: "0,30",
    airflowMin: "0,10",
    airflowMax: "0,28",
    lightingRequired: "300",
    lightingMin: "350",
    lightingMax: "700",
    noiseAllowed: "85",
    noiseMin: "65",
    noiseMax: "82",
  },
  {
    key: "warehouse",
    label: "Skladište",
    name: "Skladišni prostor",
    description: "Skladištenje materijala, manipulacija robom i unutarnji transport.",
    processDescription: "Zaprimanje, skladištenje i izdavanje robe.",
    equipmentDescription: "Regali, transportna sredstva, viličari i pomoćna oprema.",
    rangeDescription: "Osvijetljenost, buka i mikroklimatski uvjeti.",
    allowedTemperature: "16-26",
    temperatureMin: "18,0",
    temperatureMax: "24,0",
    humidityRecommended: "40-60",
    humidityMin: "45,0",
    humidityMax: "60,0",
    airflowAllowed: "0,30",
    airflowMin: "0,08",
    airflowMax: "0,25",
    lightingRequired: "200",
    lightingMin: "250",
    lightingMax: "500",
    noiseAllowed: "65",
    noiseMin: "48",
    noiseMax: "62",
  },
  {
    key: "workshop",
    label: "Radionica",
    name: "Radionica",
    description: "Servisni, montažni ili radionički poslovi.",
    processDescription: "Radionički proces prema zatečenim aktivnostima.",
    equipmentDescription: "Alati, strojevi, električna i ručna radna oprema.",
    rangeDescription: "Buka, vibracije, osvijetljenost i mikroklima.",
    allowedTemperature: "18-26",
    temperatureMin: "19,0",
    temperatureMax: "24,0",
    humidityRecommended: "40-60",
    humidityMin: "45,0",
    humidityMax: "58,0",
    airflowAllowed: "0,30",
    airflowMin: "0,10",
    airflowMax: "0,25",
    lightingRequired: "500",
    lightingMin: "550",
    lightingMax: "850",
    noiseAllowed: "85",
    noiseMin: "68",
    noiseMax: "82",
  },
]);

export const WORK_ORDER_DOCUMENT_KC_SPACE_TEMPLATES = Object.freeze([
  {
    key: "laboratory",
    label: "Laboratorij",
    name: "Laboratorijski prostor",
    description: "Rad s kemikalijama, uzorcima i laboratorijskom opremom.",
    processDescription: "Laboratorijski proces prema zatečenim postupcima.",
    equipmentDescription: "Digestori, laboratorijska oprema, kemikalije i mjerni instrumenti.",
    rangeDescription: "Kemijske štetnosti prema mjernim mjestima i GVI/BGV vrijednostima.",
  },
  {
    key: "chemical-storage",
    label: "Skladište kemikalija",
    name: "Skladište kemikalija",
    description: "Skladištenje kemijskih tvari i pripravaka.",
    processDescription: "Zaprimanje, skladištenje i izdavanje kemikalija.",
    equipmentDescription: "Spremnici, ambalaža, ventilacija i zaštitna oprema.",
    rangeDescription: "Kemijske štetnosti prema izvorima izloženosti.",
  },
]);

const WORK_ORDER_DOCUMENT_FC_SPACE_AI_PROFILES = Object.freeze([
  {
    key: "office",
    match: /(ured|administr|sastanak|računal|racunal|blagajn|pult|recepc|prodajni ured)/i,
    templateKey: "office",
    name: "Ured",
    description: "Uredski prostor namijenjen je za administrativne, organizacijske i stručne poslove, rad za računalom, komunikaciju i obradu dokumentacije.",
    processDescription: "U prostoru se odvijaju uredski poslovi, komunikacija s korisnicima, obrada podataka, izrada i pohrana dokumentacije te rad na računalu.",
    equipmentDescription: "Radna oprema obuhvaća uredske stolove i stolice, računala, monitore, pisače, telefonsku i mrežnu opremu te uredski pribor.",
  },
  {
    key: "sales",
    match: /(prodaj|trgov|dućan|ducan|maloprod|blagajn|caffe|kafi|benzinsk|postaj)/i,
    templateKey: "office",
    name: "Prodajni prostor",
    description: "Prodajni prostor namijenjen je za maloprodaju, komunikaciju s kupcima, izlaganje robe i naplatu usluga ili proizvoda.",
    processDescription: "U prostoru se obavljaju poslovi prodaje, naplate, slaganja robe, održavanja urednosti i povremene kontrole zaliha.",
    equipmentDescription: "Radna oprema obuhvaća blagajne, POS uređaje, prodajne police, rashladne vitrine, aparate za pripremu napitaka i pomoćnu opremu.",
    lightingRequired: "500",
    noiseAllowed: "65",
  },
  {
    key: "warehouse",
    match: /(skladi|spremi|magacin|arhiv|lager|odlag)/i,
    templateKey: "warehouse",
    name: "Skladišni prostor",
    description: "Skladišni prostor namijenjen je za zaprimanje, čuvanje, sortiranje i izdavanje robe, materijala ili dokumentacije.",
    processDescription: "U prostoru se odvijaju poslovi zaprimanja, skladištenja, komisioniranja, izdavanja robe i održavanja urednosti prostora.",
    equipmentDescription: "Radna oprema obuhvaća police, regale, palete, transportna sredstva, viličare ili ručna kolica te pomoćnu skladišnu opremu.",
    lightingRequired: "200",
    noiseAllowed: "65",
  },
  {
    key: "technical",
    match: /(tehnič|tehnic|kotlov|strojarn|server|ventil|kompres|agregat|elektro|instalacij)/i,
    templateKey: "workshop",
    name: "Tehnička prostorija",
    description: "Tehnička prostorija namijenjena je smještaju instalacija, uređaja i sustava koji osiguravaju rad objekta te se koristi povremeno za nadzor i održavanje.",
    processDescription: "U prostoru se obavljaju povremeni pregledi, kontrole, podešavanja, čišćenje i servisiranje tehničkih uređaja i instalacija.",
    equipmentDescription: "Radna oprema obuhvaća elektro ormare, ventilacijske, rashladne ili grijne uređaje, kompresore, instalacije i servisnu opremu.",
    lightingRequired: "200",
    noiseAllowed: "80",
  },
  {
    key: "production",
    match: /(proizvod|linij|hala|pog[oô]n|radionic|montaž|montaz|pakir|obrada)/i,
    templateKey: "production",
    name: "Proizvodni prostor",
    description: "Proizvodni prostor namijenjen je za obavljanje proizvodnih, montažnih ili pomoćnih tehnoloških procesa uz korištenje radne opreme.",
    processDescription: "U prostoru se odvijaju proizvodni i pomoćni procesi prema zatečenom stanju, organizaciji rada i opisu poslodavca.",
    equipmentDescription: "Radna oprema obuhvaća strojeve, linije, alate, instalacije, transportna sredstva i izvore fizikalnih čimbenika.",
  },
]);

export const WORK_ORDER_DOCUMENT_FC_MEASUREMENT_PRESETS = Object.freeze([
  { kind: "Mikroklimatski uvjeti", measuringPlace: "Radno mjesto", measured: "", allowed: "", unit: "°C / % / m/s" },
  { kind: "Osvijetljenost", measuringPlace: "Radna površina", measured: "", allowed: "", unit: "lx" },
  { kind: "Buka", measuringPlace: "Radno mjesto", measured: "", allowed: "85", unit: "dB" },
  { kind: "Vibracije", measuringPlace: "Radna oprema", measured: "", allowed: "", unit: "m/s2" },
]);

export const WORK_ORDER_DOCUMENT_KC_MEASUREMENT_PRESETS = Object.freeze([
  { kind: "Kemijske štetnosti", measuringPlace: "Zona disanja", measured: "", allowed: "", unit: "mg/m3" },
  { kind: "Uzorkovanje zraka", measuringPlace: "Mjerno mjesto", measured: "", allowed: "", unit: "mg/m3" },
]);

function defaultCreateClientSideId(prefix = "id") {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${random}`;
}

export function createWorkOrderDocumentWorkEnvironmentDefaultSpaceRows(workOrder = {}, { isChemical = false } = {}) {
  return [
    {
      id: "default-space-1",
      code: "P-1",
      name: workOrder.locationName || "Radni prostor",
      description: "Opis prostora i namjene unosi se iz FC/KC pripreme ili prethodnog zapisnika.",
      processDescription: "Redoviti radni proces",
      equipmentDescription: isChemical ? "Kemijske tvari i izvori izloženosti" : "Radna oprema i izvori fizikalnih čimbenika",
      allowedTemperature: isChemical ? "" : "20-25",
      temperatureMin: isChemical ? "" : "22,0",
      temperatureMax: isChemical ? "" : "24,0",
      humidityRecommended: isChemical ? "" : "40-60",
      humidityMin: isChemical ? "" : "50,0",
      humidityMax: isChemical ? "" : "55,0",
      airflowAllowed: isChemical ? "" : "0,20",
      airflowMin: isChemical ? "" : "0,10",
      airflowMax: isChemical ? "" : "0,18",
      lightingRequired: isChemical ? "" : "500",
      lightingMin: isChemical ? "" : "650",
      lightingMax: isChemical ? "" : "850",
      noiseAllowed: isChemical ? "" : "65",
      noiseMin: isChemical ? "" : "45",
      noiseMax: isChemical ? "" : "60",
      grades: new Set(["U pripremi"]),
      sourceRecords: new Set(),
      measurements: [],
      isPlaceholder: true,
    },
  ];
}

export function createWorkOrderDocumentWorkEnvironmentDefaultMeasurementRows({ isChemical = false } = {}) {
  const source = isChemical
    ? [
      ["Kemijske štetnosti", "GVI/BGV", "mg/m3"],
      ["Uzorkovanje zraka", "Rezultat analize", "mg/m3"],
    ]
    : [
      ["Mikroklimatski uvjeti", "Temperatura / vlaga / strujanje", "°C / % / m/s"],
      ["Osvijetljenost", "Minimalna i izmjerena osvijetljenost", "lx"],
      ["Buka", "Dnevna/tjedna izloženost i vršna buka", "dB"],
      ["Vibracije", "Šaka-ruka / cijelo tijelo", "m/s2"],
    ];
  return source.map(([kind, measuringPlace, unit], index) => ({
    rowId: `default-measurement-${index + 1}`,
    kind,
    spaceName: "P-1",
    measuringPlace,
    measured: "unos",
    allowed: "granica",
    unit,
    finalGrade: "U pripremi",
    recordNumber: "Novi zapisnik",
    isPlaceholder: true,
  }));
}

export function normalizeWorkOrderDocumentWorkEnvironmentDraftSpace(space = {}, index = 0, workOrder = {}, { isChemical = false } = {}) {
  const fallbackName = workOrder.locationName || (isChemical ? "Kemijski prostor" : "Radni prostor");
  const value = (...keys) => {
    for (const key of keys) {
      const candidate = space?.[key];
      if (candidate !== null && candidate !== undefined && String(candidate).trim()) {
        return String(candidate).trim();
      }
    }
    return "";
  };
  return {
    id: String(space.id || space.rowId || `space-${index + 1}`).trim() || `space-${index + 1}`,
    code: String(space.code || space.oznaka || `P-${index + 1}`).trim(),
    name: String(space.name || space.spaceName || fallbackName).trim(),
    description: String(space.description || space.purposeDescription || "").trim(),
    processDescription: String(space.processDescription || space.workProcess || "").trim(),
    equipmentDescription: String(space.equipmentDescription || space.workEquipment || "").trim(),
    rangeDescription: String(space.rangeDescription || space.ranges || "").trim(),
    allowedTemperature: value("allowedTemperature", "permittedTemperature", "temperatureAllowed", "dopTemp"),
    temperatureMin: value("temperatureMin", "tempMin", "temperatureMinimum"),
    temperatureMax: value("temperatureMax", "tempMax", "temperatureMaximum"),
    humidityRecommended: value("humidityRecommended", "recommendedHumidity", "relativeHumidityRecommended"),
    humidityMin: value("humidityMin", "relativeHumidityMin", "humidityMinimum"),
    humidityMax: value("humidityMax", "relativeHumidityMax", "humidityMaximum"),
    airflowAllowed: value("airflowAllowed", "airSpeedAllowed", "allowedAirflow"),
    airflowMin: value("airflowMin", "airSpeedMin", "airflowMinimum"),
    airflowMax: value("airflowMax", "airSpeedMax", "airflowMaximum"),
    lightingRequired: value("lightingRequired", "requiredLighting", "illuminationRequired"),
    lightingMin: value("lightingMin", "illuminationMin", "lightingMinimum"),
    lightingMax: value("lightingMax", "illuminationMax", "lightingMaximum"),
    noiseAllowed: value("noiseAllowed", "allowedNoise", "noiseLimit"),
    noiseMin: value("noiseMin", "noiseMinimum"),
    noiseMax: value("noiseMax", "noiseMaximum"),
  };
}

export function normalizeWorkOrderDocumentWorkEnvironmentDraftMeasurement(measurement = {}, index = 0, { isChemical = false } = {}) {
  const presets = isChemical ? WORK_ORDER_DOCUMENT_KC_MEASUREMENT_PRESETS : WORK_ORDER_DOCUMENT_FC_MEASUREMENT_PRESETS;
  const preset = presets[index % presets.length] || {};
  const value = (...keys) => {
    for (const key of keys) {
      const candidate = measurement?.[key];
      if (candidate !== null && candidate !== undefined && String(candidate).trim()) {
        return String(candidate).trim();
      }
    }
    return "";
  };
  return {
    id: String(measurement.id || measurement.rowId || `measurement-${index + 1}`).trim() || `measurement-${index + 1}`,
    kind: String(measurement.kind || preset.kind || "Mjerenje").trim(),
    spaceCode: String(measurement.spaceCode || measurement.spaceName || "P-1").trim(),
    rowNumber: String(measurement.rowNumber || measurement.orderNumber || index + 1).trim(),
    measuringPlace: String(measurement.measuringPlace || preset.measuringPlace || "").trim(),
    placeDescription: String(measurement.placeDescription || measurement.measuringPlaceDescription || "").trim(),
    measured: String(measurement.measured ?? preset.measured ?? "").trim(),
    allowed: String(measurement.allowed ?? preset.allowed ?? "").trim(),
    unit: String(measurement.unit || preset.unit || "").trim(),
    finalGrade: String(measurement.finalGrade || "U pripremi").trim(),
    formula: String(measurement.formula || "").trim(),
    note: String(measurement.note || "").trim(),
    illuminationMeasured: value("illuminationMeasured", "measuredLighting", "measuredIllumination"),
    illuminationAllowed: value("illuminationAllowed", "lightingRequired", "requiredLighting"),
    illuminationGeneral: value("illuminationGeneral", "generalIllumination"),
    illuminationSupplementary: value("illuminationSupplementary", "supplementaryIllumination"),
    illuminationStatus: value("illuminationStatus", "lightingStatus") || "Da",
    noiseEquivalent: value("noiseEquivalent", "equivalentNoise", "measuredNoise"),
    noiseAllowed: value("noiseAllowed", "allowedNoise"),
    noisePeak: value("noisePeak", "peakNoise"),
    noiseDaily: value("noiseDaily", "dailyNoise"),
    noiseStatus: value("noiseStatus", "noiseResultStatus") || "Da",
    temperatureMeasured: value("temperatureMeasured", "airTemperature", "measuredTemperature"),
    temperatureAllowed: value("temperatureAllowed", "allowedTemperature"),
    airflowMeasured: value("airflowMeasured", "airSpeedMeasured", "measuredAirflow"),
    airflowAllowed: value("airflowAllowed", "allowedAirflow"),
    humidityMeasured: value("humidityMeasured", "relativeHumidityMeasured", "measuredHumidity"),
    humidityAllowed: value("humidityAllowed", "humidityRecommended", "relativeHumidityRecommended"),
    passStatus: value("passStatus", "resultStatus") || "Da",
  };
}

export function getWorkOrderDocumentFcSpaceTemplateByKey(key = "") {
  const normalizedKey = String(key || "").trim();
  return WORK_ORDER_DOCUMENT_FC_SPACE_TEMPLATES.find((template) => template.key === normalizedKey)
    || WORK_ORDER_DOCUMENT_FC_SPACE_TEMPLATES[0]
    || {};
}

export function buildWorkOrderDocumentFcSpaceSuggestion(spaceName = "", current = {}) {
  const name = String(spaceName || current?.name || "").trim();
  const profile = WORK_ORDER_DOCUMENT_FC_SPACE_AI_PROFILES.find((item) => item.match.test(name))
    || WORK_ORDER_DOCUMENT_FC_SPACE_AI_PROFILES[0];
  const template = getWorkOrderDocumentFcSpaceTemplateByKey(profile.templateKey);
  return normalizeWorkOrderDocumentWorkEnvironmentDraftSpace({
    ...template,
    ...profile,
    ...current,
    name: name || profile.name || template.name,
    code: current.code || "",
    description: profile.description || template.description,
    processDescription: profile.processDescription || template.processDescription,
    equipmentDescription: profile.equipmentDescription || template.equipmentDescription,
    rangeDescription: profile.rangeDescription || template.rangeDescription,
    allowedTemperature: profile.allowedTemperature || template.allowedTemperature,
    temperatureMin: profile.temperatureMin || template.temperatureMin,
    temperatureMax: profile.temperatureMax || template.temperatureMax,
    humidityRecommended: profile.humidityRecommended || template.humidityRecommended,
    humidityMin: profile.humidityMin || template.humidityMin,
    humidityMax: profile.humidityMax || template.humidityMax,
    airflowAllowed: profile.airflowAllowed || template.airflowAllowed,
    airflowMin: profile.airflowMin || template.airflowMin,
    airflowMax: profile.airflowMax || template.airflowMax,
    lightingRequired: profile.lightingRequired || template.lightingRequired,
    lightingMin: profile.lightingMin || template.lightingMin,
    lightingMax: profile.lightingMax || template.lightingMax,
    noiseAllowed: profile.noiseAllowed || template.noiseAllowed,
    noiseMin: profile.noiseMin || template.noiseMin,
    noiseMax: profile.noiseMax || template.noiseMax,
  }, 0, {}, { isChemical: false });
}

export function createWorkOrderDocumentFcSpaceDraft(index = 0, source = {}, { createId = defaultCreateClientSideId } = {}) {
  const suggested = buildWorkOrderDocumentFcSpaceSuggestion(source.name || source.spaceName || "", source);
  return normalizeWorkOrderDocumentWorkEnvironmentDraftSpace({
    ...suggested,
    ...source,
    id: source.id || suggested.id || createId("fc-space"),
    code: source.code || suggested.code || `P-${index + 1}`,
  }, index, {}, { isChemical: false });
}

export function getWorkOrderDocumentWorkEnvironmentNumberValue(value = "") {
  const normalized = String(value ?? "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseFloat(normalized[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatWorkOrderDocumentFcMeasurementNumber(value, decimals = 1) {
  const number = getWorkOrderDocumentWorkEnvironmentNumberValue(value);
  if (number === null) {
    return "";
  }
  return number.toLocaleString("hr-HR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function getWorkOrderDocumentFcRangeValue(space = {}, minKey = "", maxKey = "") {
  const min = getWorkOrderDocumentWorkEnvironmentNumberValue(space[minKey]);
  const max = getWorkOrderDocumentWorkEnvironmentNumberValue(space[maxKey]);
  if (min === null && max === null) {
    return "";
  }
  if (min !== null && max !== null) {
    return `${formatWorkOrderDocumentFcMeasurementNumber(min)}-${formatWorkOrderDocumentFcMeasurementNumber(max)}`;
  }
  return formatWorkOrderDocumentFcMeasurementNumber(min ?? max);
}

export function getWorkOrderDocumentFcRandomInRange(space = {}, minKey = "", maxKey = "", fallback = "", decimals = 1) {
  const min = getWorkOrderDocumentWorkEnvironmentNumberValue(space[minKey]);
  const max = getWorkOrderDocumentWorkEnvironmentNumberValue(space[maxKey]);
  if (min !== null && max !== null) {
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return formatWorkOrderDocumentFcMeasurementNumber(low + Math.random() * (high - low), decimals);
  }
  const fallbackNumber = getWorkOrderDocumentWorkEnvironmentNumberValue(fallback);
  return fallbackNumber === null ? "" : formatWorkOrderDocumentFcMeasurementNumber(fallbackNumber, decimals);
}

export function createWorkOrderDocumentFcMeasurementRowFromSpace(space = {}, index = 0, seed = {}, { createId = defaultCreateClientSideId } = {}) {
  const normalizedSpace = normalizeWorkOrderDocumentWorkEnvironmentDraftSpace(space, index, {}, { isChemical: false });
  const rowNumber = String(seed.rowNumber || index + 1);
  return normalizeWorkOrderDocumentWorkEnvironmentDraftMeasurement({
    ...seed,
    id: seed.id || createId("fc-measurement"),
    kind: "Rezultati FC",
    spaceCode: normalizedSpace.code || `P-${index + 1}`,
    rowNumber,
    measuringPlace: seed.measuringPlace || `${rowNumber} ${normalizedSpace.name || "Mjerno mjesto"}`,
    placeDescription: seed.placeDescription || normalizedSpace.name || "",
    illuminationAllowed: normalizedSpace.lightingRequired || seed.illuminationAllowed || "",
    noiseAllowed: normalizedSpace.noiseAllowed || seed.noiseAllowed || "",
    temperatureAllowed: normalizedSpace.allowedTemperature || getWorkOrderDocumentFcRangeValue(normalizedSpace, "temperatureMin", "temperatureMax") || seed.temperatureAllowed || "",
    airflowAllowed: normalizedSpace.airflowAllowed || seed.airflowAllowed || "",
    humidityAllowed: normalizedSpace.humidityRecommended || getWorkOrderDocumentFcRangeValue(normalizedSpace, "humidityMin", "humidityMax") || seed.humidityAllowed || "",
    illuminationStatus: seed.illuminationStatus || "Da",
    noiseStatus: seed.noiseStatus || "Da",
    passStatus: seed.passStatus || "Da",
  }, index, { isChemical: false });
}

export function randomizeWorkOrderDocumentFcMeasurementRow(measurement = {}, spaces = []) {
  const space = (Array.isArray(spaces) ? spaces : []).find((item) =>
    String(item.code || item.name || "") === String(measurement.spaceCode || measurement.spaceName || ""))
    || spaces[0]
    || {};
  return {
    ...measurement,
    illuminationMeasured: getWorkOrderDocumentFcRandomInRange(space, "lightingMin", "lightingMax", measurement.illuminationAllowed, 0),
    noiseEquivalent: getWorkOrderDocumentFcRandomInRange(space, "noiseMin", "noiseMax", measurement.noiseAllowed, 1),
    temperatureMeasured: getWorkOrderDocumentFcRandomInRange(space, "temperatureMin", "temperatureMax", measurement.temperatureAllowed, 1),
    airflowMeasured: getWorkOrderDocumentFcRandomInRange(space, "airflowMin", "airflowMax", measurement.airflowAllowed, 2),
    humidityMeasured: getWorkOrderDocumentFcRandomInRange(space, "humidityMin", "humidityMax", measurement.humidityAllowed, 1),
    illuminationStatus: "Da",
    noiseStatus: "Da",
    passStatus: "Da",
  };
}

export function syncWorkOrderDocumentFcMeasurementsWithSpaces(measurements = [], spaces = [], { createId = defaultCreateClientSideId } = {}) {
  const normalizedSpaces = (Array.isArray(spaces) ? spaces : []).filter((space) => space && !space.isPlaceholder);
  const meaningfulMeasurements = (Array.isArray(measurements) ? measurements : []).filter((measurement) => !measurement.isPlaceholder);
  const bySpace = new Set(meaningfulMeasurements.map((measurement) => String(measurement.spaceCode || "").trim()).filter(Boolean));
  const additions = normalizedSpaces
    .filter((space) => space.code && !bySpace.has(String(space.code).trim()))
    .map((space, index) => createWorkOrderDocumentFcMeasurementRowFromSpace(
      space,
      meaningfulMeasurements.length + index,
      {},
      { createId },
    ));
  return [...meaningfulMeasurements, ...additions];
}
