const DEFAULT_ROW_COUNT = 6;

function normalizeCode(value = "") {
  return String(value || "").trim().toUpperCase();
}

function slugify(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function makeColumn(id, label, width = 120, placeholder = "") {
  return {
    id,
    label,
    placeholder,
    width,
    computed: "",
    readonly: false,
  };
}

function makeAiConfig({
  key = "",
  label = "",
  description = "",
  type = "text",
  unit = "",
  aiDescription = "",
  aiLookFor = [],
  aiAvoid = "",
  allowedValues = [],
  commonValues = [],
  examples = [],
  format = "",
  defaultValue = "",
  fallbackValue = "",
  validationRules = "",
  group = "",
  required = false,
  confidenceRequired = "medium",
  displayOrder = 0,
} = {}) {
  return {
    key,
    label,
    description,
    type,
    required,
    placeholder: "",
    helpText: description,
    enabled: true,
    aiDescription,
    aiLookFor,
    aiAvoid: aiAvoid || "Ne izmisljaj podatke. Ako vrijednost nije jasno vidljiva u starom zapisniku, projektu, slici ili jednopolnoj shemi, vrati fallback ili prazno.",
    allowedValues,
    commonValues,
    examples,
    format,
    unit,
    defaultValue,
    fallbackValue,
    confidenceRequired,
    sourceTracking: true,
    validationRules,
    displayOrder,
    group,
  };
}

function makeColumnAi(options = {}) {
  return makeAiConfig({
    group: "Rezultati ispitivanja",
    ...options,
  });
}

function makeTechnicalAi(options = {}) {
  const defaultValue = String(options.defaultValue ?? "");
  return makeAiConfig({
    type: "text",
    description: "Tehnicki podatak sustava koji NexAI moze prepisati iz starog zapisnika, projekta ili jednopolne sheme.",
    defaultValue,
    validationRules: "Ako podatak nije jasno naveden, koristi postojecu predlosku vrijednost ili ostavi korisniku za provjeru.",
    confidenceRequired: "medium",
    group: "Tehnicki podaci",
    ...options,
    fallbackValue: options.fallbackValue ?? defaultValue,
  });
}

function makeProjectDocumentationAi(options = {}) {
  return makeAiConfig({
    type: "text",
    group: "Tehnicka dokumentacija",
    description: "Popis koristene tehnicke dokumentacije koji se u zapisniku prikazuje kao bullet lista.",
    aiDescription: "Pronadji i prepisi koristenu tehnicku dokumentaciju za EIZ iz naziva uploadanih projekata, starih zapisnika, jednopolnih shema, slika elektroormara ili popisa priloga. Vrati kratku bullet listu, jednu stavku po retku.",
    aiLookFor: [
      "tehnicka dokumentacija",
      "projekt",
      "glavni projekt",
      "izvedbeni projekt",
      "elektro projekt",
      "jednopolna shema",
      "shema razdjelnika",
      "razvodni ormar",
      "prethodni zapisnik",
      "stari zapisnik",
      "koristena dokumentacija",
    ],
    aiAvoid: "Ne izmisljaj dokumentaciju. Ne prepisuj opcenite zakone i pravilnike u ovo polje. Ako iz izvora vidis samo naziv datoteke, predlozi naziv datoteke kao stavku za korisnicku provjeru.",
    fallbackValue: "",
    validationRules: "Svaku stavku vrati u posebnom retku, idealno s prefiksom '- '. Ako nema jasne dokumentacije, ostavi prazno.",
    confidenceRequired: "medium",
    sourceTracking: true,
    ...options,
  });
}

function makeRow(columns = [], values = {}, index = 0) {
  return {
    id: `measurement-row-${index + 1}`,
    cells: Object.fromEntries(columns.map((column) => [column.id, String(values[column.id] ?? "")])),
    formats: {},
  };
}

function blankRows(columns = [], count = DEFAULT_ROW_COUNT, seed = {}) {
  return Array.from({ length: count }, (_, index) => makeRow(columns, {
    number: String(index + 1),
    pass: seed.pass ?? "DA",
    ...seed,
  }, index));
}

function formulaRows(columns = [], count = DEFAULT_ROW_COUNT, buildValues = () => ({})) {
  return Array.from({ length: count }, (_, index) => {
    const rowNumber = index + 1;
    return makeRow(columns, {
      number: String(rowNumber),
      pass: "DA",
      ...buildValues(rowNumber, index),
    }, index);
  });
}

function tableSpec({
  id,
  label,
  summary,
  columns,
  rows = null,
  headerRows = [],
  merges = [],
  blankRowCount = DEFAULT_ROW_COUNT,
  blankSeed = {},
  enabledByDefault = true,
  enabledFieldId = "",
  assessmentLabel = "",
  chapterTitle = "",
  pageOrientation = "portrait",
  sourceSheet = "",
  formulaOnly = false,
  includeInReport = true,
}) {
  const key = id;
  return {
    id,
    key,
    tokenKey: normalizeCode(id).replace(/[^A-Z0-9]+/g, "_"),
    label,
    summary: summary || label,
    enabledByDefault,
    enabledFieldId: enabledFieldId || `use-${id}`,
    assessmentLabel,
    chapterTitle,
    pageOrientation: pageOrientation === "landscape" ? "landscape" : "portrait",
    sourceSheet,
    formulaOnly: formulaOnly === true,
    includeInReport: includeInReport !== false,
    columns,
    rows: rows || blankRows(columns, blankRowCount, blankSeed),
    headerRows,
    merges,
  };
}

function technicalField(id, label, defaultValue = "") {
  const key = id;
  return {
    id,
    key,
    tokenKey: normalizeCode(id).replace(/[^A-Z0-9]+/g, "_"),
    label,
    defaultValue,
    helpText: "Tehnički podatak iz predloška zapisnika.",
  };
}

const SPR_COLUMNS = [
  makeColumn("number", "R. br.", 70),
  makeColumn("place", "Mjesto ispitivanja", 240),
  makeColumn("lampCount", "Broj lampi", 92),
  makeColumn("ei", "Ei", 84, "lux"),
  makeColumn("eimin", "Eimin", 84, "lux"),
  makeColumn("pass", "ZADOVOLJAVA", 120, "DA/NE"),
];

const TZIN_COLUMNS = [
  makeColumn("number", "R. br.", 70),
  makeColumn("place", "Mjesto ispitivanja", 260),
  makeColumn("buttonCount", "Broj tipkala", 105),
  makeColumn("buttonType", "Tip tipkala", 150),
  makeColumn("pass", "ZADOVOLJAVA", 120, "DA/NE"),
];

const SZOM_COLUMNS = [
  makeColumn("number", "R.br.", 58),
  makeColumn("place", "Mjerno mjesto", 190),
  makeColumn("riz", "Riz", 72),
  makeColumn("rdop", "Rdop", 72),
  makeColumn("hiddenJoint", "Skriveni spojevi", 132),
  makeColumn("riz2", "Riz2", 68),
  makeColumn("rdop2", "Rdop2", 74),
  makeColumn("metalMassBonding", "Elektricna povezanost metalnih masa", 170),
  makeColumn("riz3", "Riz3", 68),
  makeColumn("rdop3", "Rdop3", 74),
  makeColumn("pass", "ZADOVOLJAVA", 118, "DA/NE"),
];

const SZOMV_COLUMNS = [
  makeColumn("item", "Stavka pregleda", 320),
  makeColumn("selected", "Odabir / stanje", 120),
  makeColumn("remark", "Napomena", 210),
  makeColumn("pass", "ZADOVOLJAVA", 120, "DA/NE"),
];

const EIZ_VISUAL_COLUMNS = [
  makeColumn("item", "Predmet pregleda", 420),
  makeColumn("pass", "ZADOVOLJAVA", 130, "DA/NE/NP"),
];

const EIZ_ZUDS_COLUMNS = [
  makeColumn("number", "R.br.", 54),
  makeColumn("board", "Razdjelnik", 90),
  makeColumn("circuit", "Strujni krug", 110),
  makeColumn("inCurrent", "In [A]", 76),
  makeColumn("separator", "/", 32),
  makeColumn("idn", "IΔn [mA]", 86),
  makeColumn("iisk", "Iisk [mA]", 84),
  makeColumn("tisk", "tisk [ms]", 84),
  makeColumn("u0", "U0 [V]", 76),
  makeColumn("pass", "Iisk < IΔn / tisk < tdoz", 150, "DA/NE"),
];

const EIZ_IPK_COLUMNS = [
  makeColumn("number", "R.br.", 54),
  makeColumn("place", "Mjerno mjesto", 150),
  makeColumn("circuit", "Oznaka strujnog kruga", 104),
  makeColumn("protectionType", "Tip i karakteristika zaštitnog uređaja", 165),
  makeColumn("idnIa", "IΔn / Ia [A]", 84),
  makeColumn("td", "td [s]", 64),
  makeColumn("zLpe", "Z(L-PE) [Ω]", 88),
  makeColumn("izem", "Izem [A]", 78),
  makeColumn("zLn", "Z(L-N) [Ω]", 88),
  makeColumn("zLl", "Z(L-L) [Ω]", 88),
  makeColumn("u0", "Uo [V]", 72),
  makeColumn("pass", "ZADOVOLJAVA", 112, "DA/NE"),
];

const EIZ_OI_COLUMNS = [
  makeColumn("number", "R.br.", 54),
  makeColumn("circuit", "Oznaka strujnog kruga", 145),
  makeColumn("conductor", "Vrsta vodiča", 104),
  makeColumn("l123", "Riso L1-L2-L3 [MΩ]", 112),
  makeColumn("l123n", "Riso L1-L2-L3-N [MΩ]", 132),
  makeColumn("l123pe", "Riso L1-L2-L3-PE [MΩ]", 142),
  makeColumn("npe", "Riso N-PE [MΩ]", 112),
  makeColumn("rd", "Doz. otpor izolacije Rd [MΩ]", 142),
  makeColumn("pass", "Riso > Rd", 92, "DA/NE"),
];

const EIZ_K_COLUMNS = [
  makeColumn("number", "R.br.", 54),
  makeColumn("place1", "Mjerno mjesto 1", 170),
  makeColumn("place2", "Mjerno mjesto 2", 170),
  makeColumn("testCurrent", "Ispitna struja [A]", 104),
  makeColumn("measuredResistance", "Izmjereni otpor [Ω]", 118),
  makeColumn("allowedResistance", "Doz. otpor [Ω]", 104),
  makeColumn("pass", "Zadovoljava", 96, "DA/NE"),
  makeColumn("note", "Napomena", 110),
];

const VES_COLUMNS = [
  makeColumn("assemblyPoint", "Zborno mjesto", 210),
  makeColumn("personCount", "Broj osoba", 110),
  makeColumn("evacuationTime", "Vrijeme napustanja objekta [sek]", 190),
  makeColumn("note", "Napomena", 220),
];

const EMM_COLUMNS = [
  makeColumn("number", "R.br.", 58),
  makeColumn("testPoint1", "Ispitno mjesto 1", 190),
  makeColumn("testPoint2", "Ispitno mjesto 2", 190),
  makeColumn("testCurrent", "Iisp [A]", 96),
  makeColumn("measuredResistance", "Rizm [ohm]", 110),
  makeColumn("expectedResistance", "R [ohm]", 96),
  makeColumn("pass", "Rizm ~ R", 110, "DA/NE"),
];

const VENTILATION_COLUMNS = [
  makeColumn("space", "Prostor", 180),
  makeColumn("effectiveVolume", "Efektivni volumen", 120),
  makeColumn("openingType", "Vrsta otvora", 120),
  makeColumn("openingArea", "Povrsina otvora", 120),
  makeColumn("airSpeed", "Brzina strujanja", 120),
  makeColumn("flow", "Protok", 100),
  makeColumn("volumeFlow", "Volumni protok", 120),
  makeColumn("requiredFlow", "Potrebni protok", 120),
  makeColumn("airChanges", "Broj izmjena", 110),
  makeColumn("requiredAirChanges", "Trazeni broj izmjena", 140),
  makeColumn("pressure", "Podtlak/Nadtlak", 130),
  makeColumn("pass", "Zadovoljava", 110, "DA/NE"),
];

const EXEI_IPK_COLUMNS = [
  makeColumn("circuit", "Oznaka strujnog kruga / el. uredjaja", 180),
  makeColumn("protectionDevice", "Zastitni uredjaj", 130),
  makeColumn("protectionType", "Tip i karakteristika", 135),
  makeColumn("ia", "Ia", 70),
  makeColumn("td", "td [s]", 70),
  makeColumn("zLpe", "Z(L-PE) [ohm]", 105),
  makeColumn("izem", "Izem [A]", 86),
  makeColumn("zLn", "Z(L-N) [ohm]", 105),
  makeColumn("ik1min", "Ik1min [A]", 92),
  makeColumn("zLl", "Z(L-L) [ohm]", 105),
  makeColumn("ik2min", "Ik2min [A]", 92),
  makeColumn("u0", "U0", 68),
  makeColumn("ikCheck", "Ikmin >= 3/2xIa", 125, "DA/NE"),
  makeColumn("pass", "Zadovoljava", 110, "DA/NE"),
];

const EXEI_PE_COLUMNS = [
  makeColumn("number", "R.br.", 58),
  makeColumn("section", "S [mm2]", 82),
  makeColumn("testPoint1", "Ispitno mjesto 1", 160),
  makeColumn("testPoint2", "Ispitno mjesto 2", 160),
  makeColumn("testCurrent", "Iisp [A]", 90),
  makeColumn("measuredResistance", "Rizm [ohm]", 110),
  makeColumn("expectedResistance", "Rocek [ohm]", 110),
  makeColumn("pass", "Rizm ~ Rocek", 120, "DA/NE"),
];

const EXEI_EQUIPMENT_COLUMNS = [
  makeColumn("device", "Mjerni uredjaj / tv. broj agregata", 170),
  makeColumn("manufacturerType", "Proizvodjac / tip", 150),
  makeColumn("motorSerial", "Tvornicki broj motora", 135),
  makeColumn("protectionCertificate", "Vrsta zastite / certifikat", 165),
  makeColumn("inCurrent", "In", 70),
  makeColumn("iL1", "I L1", 70),
  makeColumn("iL2", "I L2", 70),
  makeColumn("iL3", "I L3", 70),
  makeColumn("r1", "R1", 70),
  makeColumn("r2", "R2", 70),
  makeColumn("r3", "R3", 70),
  makeColumn("risoPe1", "Riso PE-1", 90),
  makeColumn("risoPe2", "Riso PE-2", 90),
  makeColumn("risoPe3", "Riso PE-3", 90),
  makeColumn("pass", "Ocjena", 92, "DA/NE"),
];

const EXEI_BIMETAL_COLUMNS = [
  makeColumn("number", "R.br.", 58),
  makeColumn("circuit", "Broj strujnog kruga", 130),
  makeColumn("protectionType", "Tip i radno podrucje zastitnog uredjaja", 190),
  makeColumn("inCurrent", "In", 70),
  makeColumn("ip", "Ip", 70),
  makeColumn("iaIn", "IA/In", 70),
  makeColumn("te", "tE", 70),
  makeColumn("iis", "Iis [A]", 80),
  makeColumn("tisk", "tisk", 80),
  makeColumn("pass", "Zadovoljava", 110, "DA/NE"),
];

const EXSE_COLUMNS = [
  makeColumn("number", "R.br.", 58),
  makeColumn("place", "Mjerno mjesto", 190),
  makeColumn("earthResistance", "Otpor uzemljenja [ohm]", 140),
  makeColumn("pipeResistance", "Otpor cijevi [kohm]", 125),
  makeColumn("electrostaticField", "Elektrostaticko polje [kV/m]", 165),
  makeColumn("allowedResistance", "Dozvoljeni otpor", 125),
  makeColumn("pass", "Ocjena ispravnosti", 135, "DA/NE"),
  makeColumn("note", "Napomena", 170),
];

const TEXT_REVIEW_COLUMNS = [
  makeColumn("item", "Stavka", 220),
  makeColumn("description", "Opis / nalaz", 360),
  makeColumn("pass", "Zadovoljava", 115, "DA/NE/NP"),
  makeColumn("note", "Napomena", 220),
];

const HYDRANT_REVIEW_COLUMNS = [
  makeColumn("number", "Redni broj", 76),
  makeColumn("location", "Mjesto ugradnje", 190),
  makeColumn("hydrantNumber", "Br. hidr.", 86),
  makeColumn("marked", "Oznacenost", 110, "DA/NE"),
  makeColumn("equipment", "Oprema", 110, "DA/NE"),
  makeColumn("available", "Dostupnost", 110, "DA/NE"),
  makeColumn("functional", "Funkcionalnost", 125, "DA/NE"),
];

const HYDRANT_MEASUREMENT_COLUMNS = [
  makeColumn("network", "Hidrantska mreza", 160),
  makeColumn("openNozzles", "Otvoreno mlaznica", 130),
  makeColumn("staticPressure", "pstat [bar]", 100),
  makeColumn("dynamicPressure", "pdin [bar]", 100),
  makeColumn("nozzleDiameter", "Promjer mlaznice [mm]", 145),
  makeColumn("nozzleFlow", "Qm [l/min]", 110),
  makeColumn("totalFlow", "Quk [l/min]", 110),
  makeColumn("requiredFlow", "Potreban protok [l/min]", 145),
  makeColumn("pass", "Zadovoljava", 110, "DA/NE"),
];

const PPV_COLUMNS = [
  makeColumn("number", "Broj", 70),
  makeColumn("doorType", "Tip PP vrata", 150),
  makeColumn("serialNumber", "Tv. br.", 110),
  makeColumn("location", "Mjesto ugradnje", 220),
  makeColumn("pass", "Zadovoljava", 115, "DA/NE"),
];

const PPZ_COLUMNS = [
  makeColumn("number", "Broj", 70),
  makeColumn("mark", "Oznaka", 110),
  makeColumn("dimensions", "Dimenzije", 120),
  makeColumn("serialNumber", "Serijski broj", 130),
  makeColumn("location", "Mjesto ugradnje", 180),
  makeColumn("driveType", "Tip/pogon", 120),
  makeColumn("functional", "Funkcionalnost", 125, "DA/NE"),
  makeColumn("alarmLink", "Veza sa sustavom dojave", 155, "DA/NE"),
  makeColumn("pass", "Zadovoljava", 115, "DA/NE"),
  makeColumn("note", "Napomena", 160),
];

const GAS_VOLUME_COLUMNS = [
  makeColumn("dimension", "Dim", 90),
  makeColumn("length", "L", 80),
  makeColumn("factor", "k", 80),
  makeColumn("volume", "Vol.", 90),
  makeColumn("installationVolume", "Volumen instalacije [l]", 160),
];

const GAS_PRESSURE_COLUMNS = [
  makeColumn("reading", "Ocitanje", 100),
  makeColumn("time", "Vrijeme [hh:mm]", 130),
  makeColumn("testPressure", "Ispitni tlak [mbar]", 150),
  makeColumn("note", "Napomena", 180),
];

const WORK_EQUIPMENT_COLUMNS = [
  makeColumn("number", "Redni broj", 78),
  makeColumn("category", "Kategorija", 150),
  makeColumn("item", "Stavka", 260),
  makeColumn("finding", "Nalaz/opis", 260),
  makeColumn("pass", "Zakljucak", 110, "DA/NE/NP"),
  makeColumn("note", "Napomena", 170),
  makeColumn("aiInstruction", "AI uputa", 220),
  makeColumn("locked", "Zakljucano", 92, "DA/NE"),
];

const STROJEVI_RESULT_COLUMNS = [
  makeColumn("item", "STAVKA*", 420),
  makeColumn("pass", "ZADOVOLJAVA DA/NE", 150, "DA/NE"),
];

const ROF_COLUMNS = [
  makeColumn("space", "Prostor/prostorija", 170),
  makeColumn("measurementPlace", "Mjerno mjesto", 150),
  makeColumn("lightingMeasured", "Izmjereno osvjetljenje [lx]", 150),
  makeColumn("lightingRequired", "Propisano osvjetljenje [lx]", 150),
  makeColumn("noiseMeasured", "Buka [dB]", 95),
  makeColumn("noiseAllowed", "Dopustena buka [dB]", 130),
  makeColumn("temperatureMeasured", "Temperatura [C]", 115),
  makeColumn("temperatureAllowed", "Dopustena temperatura [C]", 155),
  makeColumn("airSpeedMeasured", "Brzina strujanja [m/s]", 150),
  makeColumn("humidityMeasured", "Relativna vlaznost [%]", 150),
  makeColumn("pass", "DA/NE", 90, "DA/NE"),
];

const ROK_COLUMNS = [
  makeColumn("space", "Prostor/prostorija", 170),
  makeColumn("measurementPlace", "Mjerno mjesto", 150),
  makeColumn("measurementDescription", "Opis MM", 170),
  makeColumn("hazard", "Stetnost", 140),
  makeColumn("unit", "Mjerna jedinica", 120),
  makeColumn("measured", "Izmjereno", 110),
  makeColumn("calculated8h", "Izracunato u odnosu na 8 sati", 170),
  makeColumn("gvi", "GVI", 90),
  makeColumn("kgvi", "KGVI", 90),
  makeColumn("note", "Napomena", 170),
  makeColumn("pass", "DA/NE", 90, "DA/NE"),
];

const EIZ_VISUAL_ITEMS = [
  "Metoda zaštite od električnog udara",
  "Prisutnost protupožarnih pregrada i ostalih mjera opreza protiv širenja vatre te zaštite od toplinskih učinaka",
  "Odabir vodiča prema strujnom opterećenju",
  "Odabir, podešavanje, selektivnost i postavljanje zaštitnih i nadzornih uređaja",
  "Odabir, prisutnost i ispravan smještaj prenaponskih zaštitnih uređaja",
  "Prisutnost i ispravan smještaj odgovarajućih izolacijskih i sklopnih uređaja",
  "Odabir opreme i zaštitnih mjera prikladnih za vanjske utjecaje i mehaničku otpornost",
  "Prepoznavanje neutralnog i zaštitnog vodiča",
  "Raspoloživost shema, obavijesti upozorenja i ostalih sličnih informacija",
  "Identifikacija krugova, prekostrujnih zaštitnih uređaja, sklopnih uređaja, stezaljki",
  "Prikladnost spajanja vodiča",
  "Odabir i postavljanje vodiča uzemljenja, zaštitnih vodiča i njihovih spojeva",
  "Dostupnost opreme za lakše rukovanje, identifikaciju i održavanje",
  "Mjere protiv elektromagnetskih smetnji",
  "Povezanost izloženih vodljivih dijelova na zaštitni vodič",
  "Izbor i postavljanje sustava ožičenja",
  "Ispitivanje polariteta",
  "Provjera redoslijeda faza",
  "Funkcionalno ispitivanje",
  "Provjera pada napona",
  "Provjera ispitnog tipkala RCD sklopki",
];

const EIZ_VISUAL_RESULTS = [
  "DA",
  "NP",
  "DA",
  "DA",
  "DA",
  "DA",
  "DA",
  "DA",
  "DA",
  "DA",
  "DA",
  "DA",
  "NP",
  "NP",
  "DA",
  "DA",
  "DA",
  "NP",
  "DA",
  "DA",
  "DA",
];

const EIZ_VISUAL_CHECKLIST = Object.freeze({
  id: "eiz-visual",
  key: "eiz-visual",
  tokenKey: "EIZ_VISUAL",
  label: "VIZUALNI PREGLED ELEKTRIČNE INSTALACIJE",
  summary: "IL - EIZ.V",
  enabledFieldId: "use-eiz-visual",
  enabledByDefault: true,
  assessmentLabel: "Zaštita od izravnog (direktnog) dodira dijelova pod naponom",
  options: ["DA", "NE", "NP"].map((value) => ({ value, label: value })),
  items: EIZ_VISUAL_ITEMS.map((label, index) => ({
    id: `eiz-visual-${index + 1}`,
    key: `eiz-visual-${index + 1}`,
    tokenKey: `EIZ_VISUAL_${index + 1}`,
    label,
    defaultValue: EIZ_VISUAL_RESULTS[index] || "DA",
  })),
});

const EIZ_MEASUREMENT_ASSESSMENTS = Object.freeze([
  { id: "eiz-visual", label: "Zaštita od izravnog (direktnog) dodira dijelova pod naponom", enabledFieldId: "use-eiz-visual" },
  { id: "eiz-ipk", label: "Zaštita od indirektnog dodira", enabledFieldId: "use-eiz-ipk" },
  { id: "eiz-oi", label: "Otpor izolacije vodova", enabledFieldId: "use-eiz-oi" },
  { id: "eiz-k-bonding", label: "Povezanost metalnih masa", enabledFieldId: "use-eiz-k" },
  { id: "eiz-k-continuity", label: "Kontinuitet zaštitnog vodiča", enabledFieldId: "use-eiz-k" },
  { id: "eiz-zuds", label: "Ispitivanje ZUDS nazivnom i rastućom strujom kvara", enabledFieldId: "use-eiz-zuds" },
]);

const SZOMV_ITEMS = [
  "Vrsta hvataljki - mreza vodica",
  "Vrsta hvataljki - stapne hvataljke",
  "Vrsta hvataljki - odvojeni vanjski sustav",
  "Stanje vodica hvataljki",
  "Stanje spojeva hvataljki",
  "Stanje vodica odvoda",
  "Stanje mjernih spojeva",
  "Dogradnje/preinake koje zahtijevaju prosirenje vanjskog sustava",
  "Stanje odvodnika struje munje i prenapona",
  "Stanje spojeva opskrbnih vodova sa sustavom uzemljenja i izjednacivanja potencijala",
  "Stanje vodica za izjednacavanje potencijala unutar gradevine",
  "Stanje spojeva na sabirnicama za izjednacenje potencijala",
  "Dogradnje/preinake koje zahtijevaju prosirenje unutarnjeg sustava",
];

const SZOM_TECHNICAL_FIELDS = [
  technicalField("inspectionArea", "Prostor pregleda", "Prostor benzinske postaje sa pratećim sadržajem"),
  technicalField("weatherConditions", "Vremenski uvjeti", "Vedro"),
  technicalField("soilResistance", "Otpor tla [Ωm]", "-"),
  technicalField("soilMoisture", "Vlažnost tla", "Suho"),
  technicalField("protectionSystemClass", "Vrsta sustava zaštite", "II"),
  technicalField("airTermination", "Hvataljke", "Aluminijska žica"),
  technicalField("downConductors", "Odvodi", "Pocinčana traka Fe/Zn, Aluminijska žica"),
  technicalField("earthing", "Uzemljenje", "Pocinčana traka Fe/Zn"),
];

const SZOMV_TECHNICAL_FIELDS = [
  technicalField("inspectionArea", "Prostor pregleda", "Prostor benzinske postaje sa pratećim sadržajem"),
  technicalField("weatherConditions", "Vremenski uvjeti", "Vedro"),
  technicalField("soilMoisture", "Vlažnost tla", "Suho"),
  technicalField("protectionSystemClass", "Vrsta sustava zaštite", "II"),
  technicalField("airTermination", "Hvataljke", "Aluminijska žica"),
  technicalField("downConductors", "Odvodi", "Pocinčana traka Fe/Zn, Aluminijska žica"),
  technicalField("earthing", "Uzemljenje", "Pocinčana traka Fe/Zn"),
];

const EIZ_TECHNICAL_FIELDS = [
  technicalField("networkSystem", "Sustav mreže", "TN-S sa ZUDS"),
  technicalField("voltageFrequency", "Napon/frekvencija", "230/400 V; 50 Hz"),
  technicalField("protectionType", "Vrsta zaštite", "Zaštitni uređaj diferencijalne struje - ZUDS"),
  technicalField("protectiveDevices", "Zaštitni uređaji", "Automatski osigurači, ZUDS"),
];

const EX_TECHNICAL_FIELDS = [
  technicalField("zone", "Ex zona", ""),
  technicalField("equipmentGroup", "Grupa opreme", ""),
  technicalField("protectionMark", "Oznaka protueksplozijske zastite", ""),
  technicalField("documentation", "Projektna / Ex dokumentacija", ""),
];

const EXEI_TECHNICAL_FIELDS = [
  technicalField("inspectionArea", "Prostor ispitivanja", "Benzinska postaja sa pratecim sadrzajem"),
  technicalField("earthingSystem", "Sustav uzemljenja", "TN C/S"),
  technicalField("earthingType", "Vrsta uzemljivaca", "FeZn traka"),
  technicalField("weatherConditions", "Vrijeme", ""),
  technicalField("soilCondition", "Stanje tla", ""),
  technicalField("explosiveAtmosphereArea", "Podrucje s eksplozivnom atmosferom", "Benzinska postaja"),
  technicalField("exDocumentation", "Ex dokumentacija", "Ex nalaz, popis opreme u Ex izvedbi"),
];

const EXEI_PROJECT_DOCUMENTATION = [
  "Zapisnik od prethodnog ispitivanja",
  "Jednopolne elektrosheme razdjelnika",
  "Tehnicki katalog motora",
  "Ex nalaz",
  "Popis opreme u Ex izvedbi",
].join("\n");

const EXEI_RESULTS_TEXT = [
  "Ispitivanje instalacija u podrucjima s eksplozivnom atmosferom obuhvaca mjerenje impedancije petlje kvara, mjerenje otpora izolacije vodova, provjeru zastitnih uredaja diferencijalne struje, mjerenje kontinuiteta zastitnog i dodatnog vanjskog PE vodica elektricnih uredaja, mjerenje kontinuiteta PE vodica i neelektricnih uredaja i metalnih masa, ispitivanje zastite od preopterecenja, mjerenje struje praznog hoda elektromotora, mjerenje otpora namota elektromotora i mjerenje otpora izolacije elektromotora.",
  "Rezultati se vode u zasebnim ExEi ispitnim listovima prema CISTA predlosku i koriste se za zajednicku ocjenu rezultata ispitivanja.",
].join("\n\n");

const EXEI_MEASUREMENT_ASSESSMENTS = Object.freeze([
  { id: "exei-assessment-ipk", key: "exei-assessment-ipk", label: "Impedancija petlje kvara", enabledFieldId: "use-exei-cista-ipk", defaultValue: "ZADOVOLJAVA" },
  { id: "exei-assessment-oi", key: "exei-assessment-oi", label: "Otpor izolacije vodova", enabledFieldId: "use-exei-cista-oi", defaultValue: "ZADOVOLJAVA" },
  { id: "exei-assessment-zuds", key: "exei-assessment-zuds", label: "Zastitni uredaji diferencijalne struje", enabledFieldId: "use-exei-cista-zuds", defaultValue: "ZADOVOLJAVA" },
  { id: "exei-assessment-pe-ipk", key: "exei-assessment-pe-ipk", label: "Kontinuitet dodatnog vanjskog PE vodica - IPK", enabledFieldId: "use-exei-cista-pe-ipk", defaultValue: "ZADOVOLJAVA" },
  { id: "exei-assessment-pe-direct", key: "exei-assessment-pe-direct", label: "Kontinuitet PE vodica i metalnih masa - izravno mjerenje", enabledFieldId: "use-exei-cista-pe-direct", defaultValue: "ZADOVOLJAVA" },
  { id: "exei-assessment-motors", key: "exei-assessment-motors", label: "Otpor izolacije, namoti i struja praznog hoda elektromotora", enabledFieldId: "use-exei-cista-motors", defaultValue: "ZADOVOLJAVA" },
  { id: "exei-assessment-overload-e", key: "exei-assessment-overload-e", label: "Zastita od preopterecenja motora Ex e", enabledFieldId: "use-exei-cista-overload-e", defaultValue: "ZADOVOLJAVA" },
  { id: "exei-assessment-overload-d", key: "exei-assessment-overload-d", label: "Zastita od preopterecenja motora Ex d", enabledFieldId: "use-exei-cista-overload-d", defaultValue: "ZADOVOLJAVA" },
]);

const EXSE_TECHNICAL_FIELDS = [
  technicalField("weatherConditions", "Vremenski uvjeti", ""),
  technicalField("soilCondition", "Stanje tla", ""),
  technicalField("temperature", "Temperatura [C]", ""),
  technicalField("relativeHumidity", "Relativna vlaznost [RH]", ""),
  technicalField("protectionMeasure", "Zastitna mjera", "Uzemljenje"),
  technicalField("earthing", "Uzemljenje", "FeZn traka"),
];

const EXSE_PROJECT_DOCUMENTATION = "Zapisnik od prethodnog ispitivanja";

const EXSE_RESULTS_TEXT = [
  "Ispitivanje uzemljenja i statickog elektriciteta u Ex prostoru obuhvaca mjerenje otpora uzemljenja, mjerenje otpora savitljivih cijevi na istakalistima i provjeru elektrostatskog polja.",
  "Rezultati se vode u zasebnim ExSe ispitnim listovima prema CISTA predlosku i koriste se za zajednicku ocjenu rezultata ispitivanja.",
].join("\n\n");

const EXSE_MEASUREMENT_ASSESSMENTS = Object.freeze([
  { id: "exse-assessment-earthing", key: "exse-assessment-earthing", label: "Otpor uzemljenja", enabledFieldId: "use-exse-cista-earthing", defaultValue: "ZADOVOLJAVA" },
  { id: "exse-assessment-hoses", key: "exse-assessment-hoses", label: "Otpor savitljivih cijevi na istakalistima", enabledFieldId: "use-exse-cista-static", defaultValue: "ZADOVOLJAVA" },
  { id: "exse-assessment-static", key: "exse-assessment-static", label: "Staticki elektricitet", enabledFieldId: "use-exse-cista-static", defaultValue: "ZADOVOLJAVA" },
]);

const EXSE_EARTHING_ROWS = [
  ["1", "mjerni uredaj za istakanje 1/2", "", "-", "0", "10", "DA", "-"],
  ["2", "mjerni uredaj za istakanje 3/4", "", "-", "0", "10", "DA", "-"],
  ["3", "mjerni uredaj za istakanje 5/6", "", "-", "0", "10", "DA", "-"],
  ["4", "mjerni uredaj za istakanje 7/8", "", "-", "0", "10", "DA", "-"],
  ["5", "okno spremnika S1", "", "-", "0", "10", "DA", "-"],
  ["6", "okno spremnika S2", "", "-", "0", "10", "DA", "-"],
  ["7", "okno spremnika S3", "", "-", "0", "10", "DA", "-"],
  ["8", "okno spremnika S4", "", "-", "0", "10", "DA", "-"],
  ["9", "odzracnik", "", "-", "0", "10", "DA", "-"],
  ["10", "sklopka za uzemljenje autocisterne", "", "-", "0", "10", "DA", "-"],
  ["11", "sklopka za uzemljenje autocisterne UNP", "", "-", "0", "10", "DA", "-"],
  ["12", "Sigurnosni ventili UNP", "", "-", "0", "10", "DA", "-"],
  ["13", "crpka UNP-a", "", "-", "0", "10", "DA", "-"],
  ["14", "spremnik UNP-a", "", "-", "0", "10", "DA", "-"],
  ["15", "okno za utakanje", "", "-", "0", "10", "DA", "-"],
  ["16", "kavezi za plinske boce", "", "-", "0", "10", "DA", "-"],
  ["17", "spremnik pijeska", "", "-", "0", "10", "DA", "-"],
];

const EXSE_STATIC_ROWS = [
  ["1", "Agregat 1/2 - istakacka cijev ES 95 BS MAXPOWER (1)", "-", "", "0", "1", "DA", "-"],
  ["2", "Agregat 1/2 - istakacka cijev ED BS MAXPOWER (1)", "-", "", "0", "1", "DA", "-"],
  ["3", "Agregat 1/2 - istakacka cijev ED BS (1)", "-", "", "0", "1", "DA", "-"],
  ["4", "Agregat 1/2 - istakacka cijev ES 95 BS MAXPOWER (2)", "-", "", "0", "1", "DA", "-"],
  ["5", "Agregat 1/2 - istakacka cijev ED BS MAXPOWER (2)", "-", "", "0", "1", "DA", "-"],
  ["6", "Agregat 1/2 - istakacka cijev ED BS (2)", "-", "", "0", "1", "DA", "-"],
  ["7", "Agregat 3/4 - istakacka cijev ES 95 BS MAXPOWER (3)", "-", "", "0", "1", "DA", "-"],
  ["8", "Agregat 3/4 - istakacka cijev ED BS MAXPOWER (3)", "-", "", "0", "1", "DA", "-"],
  ["9", "Agregat 3/4 - istakacka cijev LPG (3)", "-", "", "0", "1", "DA", "-"],
  ["10", "Agregat 3/4 - istakacka cijev ES 95 BS MAXPOWER (4)", "-", "", "0", "1", "DA", "-"],
  ["11", "Agregat 3/4 - istakacka cijev ED BS MAXPOWER (4)", "-", "", "0", "1", "DA", "-"],
  ["12", "Agregat 3/4 - istakacka cijev LPG (4)", "-", "", "0", "1", "DA", "-"],
  ["13", "Agregat 5/6 - istakacka cijev ES 95 BS (5)", "-", "", "0", "1", "DA", "-"],
  ["14", "Agregat 5/6 - istakacka cijev ES 100 BS MAXPOWER (5)", "-", "", "0", "1", "DA", "-"],
  ["15", "Agregat 5/6 - istakacka cijev ED BS MAXPOWER (5)", "-", "", "0", "1", "DA", "-"],
  ["16", "Agregat 5/6 - istakacka cijev ED BS (5)", "-", "", "0", "1", "DA", "-"],
  ["17", "Agregat 5/6 - istakacka cijev ES 95 BS (6)", "-", "", "0", "1", "DA", "-"],
  ["18", "Agregat 5/6 - istakacka cijev ES 100 BS MAXPOWER (6)", "-", "", "0", "1", "DA", "-"],
  ["19", "Agregat 5/6 - istakacka cijev ED BS MAXPOWER (6)", "-", "", "0", "1", "DA", "-"],
  ["20", "Agregat 5/6 - istakacka cijev ED BS (6)", "-", "", "0", "1", "DA", "-"],
  ["21", "Agregat 7/8 - istakacka cijev ES 95 BS (7)", "-", "", "0", "1", "DA", "-"],
  ["22", "Agregat 7/8 - istakacka cijev ES 100 BS MAXPOWER (7)", "-", "", "0", "1", "DA", "-"],
  ["23", "Agregat 7/8 - istakacka cijev ED BS MAXPOWER (7)", "-", "", "0", "1", "DA", "-"],
  ["24", "Agregat 7/8 - istakacka cijev ED BS (7)", "-", "", "0", "1", "DA", "-"],
  ["25", "Agregat 7/8 - istakacka cijev ES 95 BS (8)", "-", "", "0", "1", "DA", "-"],
  ["26", "Agregat 7/8 - istakacka cijev ES 100 BS MAXPOWER (8)", "-", "", "0", "1", "DA", "-"],
  ["27", "Agregat 7/8 - istakacka cijev ED BS MAXPOWER (8)", "-", "", "0", "1", "DA", "-"],
  ["28", "Agregat 7/8 - istakacka cijev ED BS (8)", "-", "", "0", "1", "DA", "-"],
];

const SZOM_CISTA_PLACES = [
  "Odvod BP",
  "Odvod BP",
  "Odvod BP",
  "Odvod BP",
  "Agregat",
  "Agregat",
  "Agregat",
  "Agregat",
  "Spremnik gorivo",
  "Odzracnici",
  "Spremnik plina",
  "Rasvjetni stup",
  "Skladiste boce UNP",
  "Rasvjetni stup",
  "Rasvjetni stup",
  "Rasvjetni stup",
  "Rasvjetni stup",
  "Rasvjetni stup",
  "Rasvjetni stup",
  "Sklopka AC",
  "Sklopka AC",
  "Rasvjetni stup",
  "",
  "",
];

const EXEI_EXPODACI_COLUMNS = [
  "Nazivna struja",
  "Karakteristika",
  "Razmak 1",
  "Motor/Tip",
  "Nazivna struja",
  "Struja praznog hoda MIN",
  "Struja praznog hoda MAX",
  "Otpor MIN",
  "Otpor MAX",
  "Razmak 2",
  "Bimetal e",
  "1,2xIp [A]",
  "1,5xIp [A] - min",
  "1,5xIp [A] - max",
  "3xIp [A] - min",
  "3xIp [A] - max",
  "IA/InxIp [A] - min",
  "IA/InxIp [A] - max",
  "Razmak 3",
  "Bimetal d",
  "1,2xIp [A]",
  "1,5xIp [A] - min",
  "1,5xIp [A] - max",
  "7xIp [A] - min",
  "7xIp [A] - max",
];

const EXEI_EXPODACI_PROTECTION_ROWS = [
  ["AUT B2A", "10"],
  ["AUT C10A", "100"],
  ["AUT B20A", "100"],
  ["ZM16-PKZ2", "130"],
  ["GV2ME14", "140"],
  ["SCHRACK BE5-10", "140"],
  ["AUT C16A", "160"],
  ["Schneider Electric GV2ME16", "170"],
  ["AUT B6A", "30"],
  ["AUT C4A", "40"],
  ["MP4/2", "42"],
  ["0,5 A", "5"],
  ["AUT C0,5A", "5"],
  ["AUT B10A", "50"],
  ["AUT C6A", "60"],
  ["AUT B16A", "80"],
];

const EXEI_EXPODACI_MOTOR_ROWS = [
  ["ATB / 132S/4B-11\n// 400V/10,1A/5,0kW/50Hz //", "10.1", "7,14", "7,36", "2,12", "2,22"],
  ["ATB / EAY 112M/4K-11T\n// 3,6 KW; 50 Hz; 7,7 A; 380-420 V //", "7.7", "6,34", "6,44", "4,05", "4,24"],
  ["ATB LOHER / EAY 71/2B-7\n// 380-420 V; 1,11 A; 0,37 KW; 50 Hz; 2915 o/min //", "1.11", "0,68", "0,71", "27,74", "27,94"],
  ["ATB LOHER / EAY 80/4C-11\n// 380/420 V; 1,88 A; 0,75 KW; 50 Hz; 1425 o/min //", "1.88", "1,29", "1,35", "21,39", "21,58"],
  ["BARTEC VARNOST / 4 KTC 112M-4\n// 400/690V; 8,2/4,7 A; 4 kW; 1430 o/min; 50 Hz //", "8.2", "5,66", "5,85", "3,47", "3,66"],
  ["BARTEC VARNOST / 4KTC 112 M-2\n// 400/690 V; 50 Hz; 7,8/6,5 A; 4 kW; cos fi 0,98 //", "7.8", "5,66", "5,75", "3,66", "3,85"],
  ["BARTECVARNOST / 4KTC 100LB-4\n// 3 kW; 6,4 A; 400 V; 50 Hz, 1500 o/min, cos fi = 0,84 //", "6.4", "5,66", "5,80", "2,02", "2,22"],
  ["ELNOR MOTORS / BAV 370 TR55AR-R\n// 0,74 kW/380-400V/50Hz/1,7A/1430 min-1 //", "1.7", "1,51", "1,58", "7,51", "7,71"],
  ["ELNOR MOTORS / BAV 370TR AR-R\n// 1,1 kW; 2,6 A; 380-420 V; 50 HZ; cos fi = 0,80 //", "2.6", "2,15", "2,26", "6,17", "6,36"],
  ["ELNOR MOTORS / BAXTR AR-R\n// 0,74 kW; 1,7 A; 380 - 420 V; 50 Hz //", "1.7", "1,37", "1,43", "12,62", "12,72"],
  ["ELPROM / 12080B4\n// 400 V; 2,1 A; 0,75 kW; S1; 50 Hz; 1410 min-1; IA/IN=3,9; tE=25s //", "2.1", "1,67", "1,76", "21,29", "21,48"],
  ["EUROMOTORI / ASA 112M-4\n// 8,6 A, 400 V; 50 Hz //", "6.6", "6,34", "6,54", "19,46", "19,65"],
];

const EXEI_EXPODACI_EXE_ROWS = [
  ["Benedict & Jager; 2,7-4,0 A", "<120'", "188,00", "206,00", "19,00", "25,00", "5,00", "8,00"],
  ["Benedikt & Jager", "<120'", "200,00", "220,00", "16,00", "20,00", "5,00", "6,00"],
  ["Benedikt & Jager 0,6-0,9A", "<120'", "188,00", "224,00", "20,00", "29,00", "5,00", "11,00"],
  ["Benedikt & Jager; 2,7-6A", "<120'", "180,00", "200,00", "22,00", "29,00", "6,00", "10,00"],
  ["Condor C-MS 2,5; 1,6-2,5A", "<120'", "175,00", "205,00", "25,00", "32,00", "6,00", "12,00"],
  ["Condor MSZ; 1,8-2,4A", "<120'", "177,00", "207,00", "20,00", "25,00", "6,00", "12,00"],
  ["Eaton ZE 1,0A; 0,6-1,0A", "-", "165,00", "180,00", "20,00", "25,00", "7,00", "9,00"],
  ["Eaton ZE 2,4A; 1,6-2,4A", "<120'", "165,00", "180,00", "20,00", "30,00", "15,00", "20,00"],
  ["MOELLER ZE 2,555841", "<120'", "8,80", "10,00", "8,80", "10,00", "10,00", "12,00"],
  ["Moeller ZE, 1,6-2,4A", "<120'", "230,00", "250,00", "20,00", "30,00", "10,00", "13,00"],
  ["Moeller ZE; 2,4-4A", "<120'", "200,00", "209,00", "18,00", "25,00", "8,00", "13,00"],
  ["Moeller ZM-16 (10-16 A)", "25'18''", "180,00", "210,00", "20,00", "26,00", "6,00", "9,00"],
];

const EXEI_EXPODACI_EXD_ROWS = [
  ["Schneider Electric LRD 10, 4-6A", "20'26''", "180,00", "210,00", "6,00", "10,00"],
  ["SCHRACK 20-25", "<120'", "80,00", "90,00", "150,00", "190,00"],
  ["SCHRACK BE5-10 A; 6,3-10 A", "<120'", "112,00", "133,00", "6,00", "9,00"],
];

function makeExeiExPodaciRows() {
  const rowCount = Math.max(
    EXEI_EXPODACI_PROTECTION_ROWS.length,
    EXEI_EXPODACI_MOTOR_ROWS.length,
    EXEI_EXPODACI_EXE_ROWS.length,
    EXEI_EXPODACI_EXD_ROWS.length,
    24,
  );
  return Array.from({ length: rowCount }, (_, index) => {
    const row = Array.from({ length: EXEI_EXPODACI_COLUMNS.length }, () => "");
    (EXEI_EXPODACI_PROTECTION_ROWS[index] || []).forEach((value, offset) => { row[offset] = value; });
    (EXEI_EXPODACI_MOTOR_ROWS[index] || []).forEach((value, offset) => { row[offset + 3] = value; });
    (EXEI_EXPODACI_EXE_ROWS[index] || []).forEach((value, offset) => { row[offset + 10] = value; });
    (EXEI_EXPODACI_EXD_ROWS[index] || []).forEach((value, offset) => { row[offset + 19] = value; });
    return row;
  });
}

function makeExseEarthingCistaRow(rowNumber, index) {
  const place = EXSE_EARTHING_ROWS[index]?.[1] || "";
  return {
    c1: `=IF(B${rowNumber}="","",ROW(A${rowNumber}))`,
    c2: place,
    c3: `=IF(B${rowNumber}="","",RANDBETWEEN(30,60)/100)`,
    c4: `=IF(B${rowNumber}="","","-")`,
    c5: `=IF(B${rowNumber}="","",0)`,
    c6: `=IF(B${rowNumber}="","",10)`,
    c7: `=IF(B${rowNumber}="","","DA")`,
    c8: `=IF(B${rowNumber}="","","-")`,
  };
}

function makeExseStaticCistaRow(rowNumber, index) {
  const place = EXSE_STATIC_ROWS[index]?.[1] || "";
  return {
    c1: `=IF(B${rowNumber}="","",ROW(A${rowNumber}))`,
    c2: place,
    c3: `=IF(B${rowNumber}="","","-")`,
    c4: `=IF(B${rowNumber}="","",RANDBETWEEN(1,6))`,
    c5: `=IF(B${rowNumber}="","",0)`,
    c6: `=IF(B${rowNumber}="","",1)`,
    c7: `=IF(B${rowNumber}="","","DA")`,
    c8: `=IF(B${rowNumber}="","","-")`,
  };
}

const EXOV_FUNCTION_DESCRIPTION = "Pri punjenju spremnika goriva iz autocisterni utvrduje se da ugradeni odzracni ventili pravilno djeluju - otvaraju se i zatvaraju pri povecanju ili smanjenju nadtlaka u spremnicima.";
const EXOV_PROJECT_DOCUMENTATION = "Zapisnik od prethodnog ispitivanja";
const EXOV_RESULTS_TEXT = [
  "Funkcionalno ispitivanje odzracnih ventila provodi se vizualnim pregledom pri punjenju spremnika goriva iz autocisterni.",
  EXOV_FUNCTION_DESCRIPTION,
].join("\n\n");

const EXOV_CHECKLIST = makeChecklistFromItems({
  id: "exov-function",
  label: "Funkcionalno ispitivanje odzracnih ventila",
  summary: "Vizualni pregled i funkcionalnost odzracnih ventila prema CISTA ExOv predlosku",
  items: [
    "Mjerna metoda - vizualni pregled",
    "Odzracni ventili se otvaraju pri povecanju nadtlaka u spremnicima",
    "Odzracni ventili se zatvaraju pri smanjenju nadtlaka u spremnicima",
    "Funkcionalnost odzracnih ventila",
  ],
  options: ["DA", "NE"],
  defaultValue: "DA",
  assessmentLabel: "Funkcionalnost odzracnih ventila",
});

const FIRE_SYSTEM_TECHNICAL_FIELDS = [
  technicalField("protectedArea", "Predmet zastite / opis prostora", ""),
  technicalField("centralUnit", "Centrala / upravljacki uredjaj", ""),
  technicalField("detectors", "Detektori / elementi sustava", ""),
  technicalField("linkedSystems", "Sustavi u sprezi", ""),
  technicalField("elementCount", "Ukupan broj elemenata", ""),
];

const SVZ_TECHNICAL_FIELDS = [
  technicalField("protectedArea", "Predmet zastite / opis prostora", "Poslovni prostor - benzinska postaja sa pratecim sadrzajem."),
  technicalField("centralManufacturer", "Centralni uredjaj - proizvodjac", "INIM"),
  technicalField("centralType", "Centralni uredjaj - tip", "Smartline 020-4"),
  technicalField("centralPowerSupply", "Napajanje centrale", "Glavno napajanje 230 V / 50 Hz; rezervno napajanje dvije akumulatorske baterije 12 V / 7 Ah."),
  technicalField("automaticDetectorType", "Automatski detektori pozara", "Opticki automatski detektori pozara, proizvodjac INIM, tip S-ID100."),
  technicalField("manualCallPointType", "Rucni javljaci pozara", "Rucni javljaci proizvodjac PIT-ALARM, tip PIT92 vd i IP67 PIT-98-65vd."),
  technicalField("alarmSirens", "Alarmne sirene", "Unutarnje alarmne sirene, tip s-smarty/gfr i S-Ivy R."),
  technicalField("linkedSystems", "Sustavi u sprezi", "Otvaranje kliznih vrata, otvaranje vrata pod kontrolom pristupa, gasenje ventilacije."),
  technicalField("maintenanceBook", "Knjiga odrzavanja", "Korisnik posjeduje knjigu odrzavanja sustava."),
];

const SVZ_RESULTS_TEXT = [
  "Vizualnim pregledom utvrdjuje se da je sustav izveden sukladno navedenoj projektnoj dokumentaciji.",
  "Obavlja se simulacija aktiviranja sustava automatskim i rucnim javljacima pozara.",
  "Aktiviranjem detektora provjerava se prikaz mjesta pozara, zvucna signalizacija na centralnom uredjaju i aktiviranje sirena.",
  "Centrala za dojavu pozara mora biti smjestena u suhoj, pogonski pristupacnoj i osvijetljenoj prostoriji.",
  "Rucni javljaci na evakuacijskim putevima i izlazima moraju biti dostupni i ispravno oznaceni.",
  "Provjerava se rezervno napajanje, svjetlosna i zvucna signalizacija alarma, registracija greske i povrat sustava u normalno pogonsko stanje.",
  "Provjeravaju se sustavi koji rade u sprezi sa sustavom dojave pozara.",
].join("\n\n");

const SVZ_REVIEW_ITEMS = [
  "Sustav je izveden sukladno projektnoj dokumentaciji",
  "Obavljena je simulacija automatskim javljacima pozara",
  "Obavljena je simulacija rucnim javljacima pozara",
  "Na centrali se prikazuje mjesto pozara",
  "Zvucna signalizacija na centrali i sirenama je ispravna",
  "Centrala je smjestena u suhoj, pristupacnoj i osvijetljenoj prostoriji",
  "Rucni javljaci su postavljeni na evakuacijskim putevima i izlazima",
  "Automatski javljaci imaju ispravnu svjetlosnu signalizaciju stanja",
  "Alarmna sirena proradila je istovremeno s aktiviranjem detektora",
  "Rezervno napajanje zadovoljava kapacitetom i ukljucuje se bez zastoja",
  "Provjerena je registracija greske i pogonsko stanje centrale",
  "Sustavi u sprezi ispravno funkcioniraju",
  "Sustav je nakon ispitivanja vracen u normalno pogonsko stanje",
  "Korisnik posjeduje knjigu odrzavanja sustava",
];

const SVZ_SYSTEM_ELEMENTS = [
  "Centralni uredjaj",
  "Automatski detektori pozara",
  "Rucni javljaci pozara",
  "Alarmne sirene",
  "Rezervno napajanje",
  "Sustavi u sprezi",
];

const GAS_TECHNICAL_FIELDS = [
  technicalField("meterManufacturer", "Proizvodjac plinomjera", ""),
  technicalField("meterType", "Tip i velicina plinomjera", ""),
  technicalField("meterSerial", "Tvornicki broj", ""),
  technicalField("meterYear", "Godina proizvodnje", ""),
  technicalField("meterState", "Stanje plinomjera [m3]", ""),
  technicalField("pressureClass", "Tlacni razred instalacije", ""),
  technicalField("gasAppliance", "Plinsko trosilo", ""),
  technicalField("applianceRoom", "Prostor plinskog trosila", ""),
];

const WORK_EQUIPMENT_TECHNICAL_FIELDS = [
  technicalField("equipmentName", "Naziv radne opreme", ""),
  technicalField("manufacturer", "Proizvodjac", ""),
  technicalField("model", "Tip/model", ""),
  technicalField("serialNumber", "Serijski broj", ""),
  technicalField("inventoryNumber", "Inventarni broj", ""),
  technicalField("purpose", "Namjena radne opreme", ""),
  technicalField("position", "Pozicija radne opreme", ""),
  technicalField("documentation", "Dokumentacija", ""),
];

const STROJEVI_TECHNICAL_FIELDS = [
  technicalField("equipmentSample", "Uzorak", ""),
  technicalField("equipmentName", "Naziv strojeva/uredaja", ""),
  technicalField("manufacturer", "Proizvodjac", ""),
  technicalField("model", "Tip", ""),
  technicalField("serialNumber", "Serijski broj", ""),
  technicalField("inventoryNumber", "Inv.br.", ""),
  technicalField("documentation", "Dokumentacija", "Tehnicka dokumentacija, Upute za rad na siguran nacin"),
  technicalField("technicalData", "Tehnicki podaci", ""),
  technicalField("workingSubstancesAndRawMaterials", "Sirovine/radne tvari", ""),
  technicalField("workspacePosition", "Polozaj opreme", ""),
  technicalField("purposeDescription", "Namjena opreme", ""),
  technicalField("parts", "Dijelovi (ukoliko postoje)", ""),
  technicalField("visualState", "Vizualno stanje radne opreme", ""),
];

const WORK_ENVIRONMENT_TECHNICAL_FIELDS = [
  technicalField("location", "Lokacija IS ZNR", ""),
  technicalField("outsideTemperature", "Vanjska temperatura", ""),
  technicalField("relativeHumidity", "Relativna vlaznost", ""),
  technicalField("airSpeed", "Brzina strujanja", ""),
  technicalField("weatherConditions", "Vrijeme / vanjski uvjeti", ""),
  technicalField("measurementEquipment", "Mjerna oprema", ""),
];

const EVACUATION_PLAN_FIELDS = [
  technicalField("object", "Objekt", ""),
  technicalField("systems", "Sustavi koji postoje na lokaciji", ""),
  technicalField("evacuationDirections", "Evakuacijski smjerovi", ""),
  technicalField("assemblyPoint", "Zborno mjesto", ""),
  technicalField("responsiblePersons", "Osobe zaduzene za evakuaciju", ""),
];

const NEGATIVE_FINDING_FIELDS = [
  technicalField("inspectionPlace", "Mjesto ispitivanja", ""),
  technicalField("inspectionName", "Naziv ispitivanja", ""),
  technicalField("nonConformity", "Nesukladnost", ""),
  technicalField("correctiveAction", "Sto treba otkloniti", ""),
  technicalField("externalTicket", "Napomena / SAP Fiori prijava", ""),
];

const SZOMV_DETAILED_ITEMS = [
  "Hvataljke - vrsta hvataljki",
  "Hvataljke - stanje vodica",
  "Hvataljke - stanje spojeva",
  "Odvodi - stanje vodica odvoda",
  "Odvodi - mehanicka ostecenja",
  "Odvodi - spoj na uzemljenje",
  "Mjerni spojevi - stanje",
  "Mjerni spojevi - dostupnost",
  "Mjerni spojevi - oznake",
  "Uzemljenje - vidljivi spojevi",
  "Uzemljenje - korozija",
  "Uzemljenje - ostecenja",
  "Prenaponska zastita - ostecen ili proradio",
  "Prenaponska zastita - osigurac proradio",
  "Izjednacenje potencijala - stanje spojeva",
  "Izjednacenje potencijala - dostupnost",
];

const SZOMV_STATUS_OPTIONS = [
  { value: "Zadovoljava", label: "Zadovoljava" },
  { value: "Ne zadovoljava", label: "Ne zadovoljava" },
  { value: "Nije primjenjivo", label: "Nije primjenjivo" },
];

const SZOMV_YES_NO_OPTIONS = [
  { value: "Ne", label: "Ne" },
  { value: "Da", label: "Da" },
];

const SZOMV_CATCHER_OPTIONS = [
  { value: "Mreza vodica", label: "Mreza vodica" },
  { value: "Stapne hvataljke", label: "Stapne hvataljke" },
  { value: "Odvojeni vanjski sustav", label: "Odvojeni vanjski sustav" },
  { value: "Ostalo", label: "Ostalo" },
];

const SZOMV_CHECKLISTS = Object.freeze([
  Object.freeze({
    id: "szomv-vanjski-sustav",
    key: "szomv-vanjski-sustav",
    tokenKey: "SZOMV_VANJSKI_SUSTAV",
    label: "Stanje vanjskog sustava zastite od munje",
    summary: "Hvataljke, odvodi, mjerni spojevi i dogradnje vanjskog sustava.",
    enabledFieldId: "use-szomv-vanjski-sustav",
    enabledByDefault: true,
    assessmentLabel: "Stanje vanjskog sustava zastite od munje",
    options: SZOMV_STATUS_OPTIONS,
    items: [
      {
        id: "szomv-vrsta-hvataljki",
        key: "szomv-vrsta-hvataljki",
        tokenKey: "SZOMV_VRSTA_HVATALJKI",
        label: "Vrsta hvataljki",
        defaultValue: "Mreza vodica",
        options: SZOMV_CATCHER_OPTIONS,
      },
      {
        id: "szomv-stanje-vodica-hvataljki",
        key: "szomv-stanje-vodica-hvataljki",
        tokenKey: "SZOMV_STANJE_VODICA_HVATALJKI",
        label: "Stanje vodica hvataljki",
        defaultValue: "Zadovoljava",
      },
      {
        id: "szomv-stanje-spojeva-hvataljki",
        key: "szomv-stanje-spojeva-hvataljki",
        tokenKey: "SZOMV_STANJE_SPOJEVA_HVATALJKI",
        label: "Stanje spojeva hvataljki",
        defaultValue: "Zadovoljava",
      },
      {
        id: "szomv-stanje-vodica-odvoda",
        key: "szomv-stanje-vodica-odvoda",
        tokenKey: "SZOMV_STANJE_VODICA_ODVODA",
        label: "Stanje vodica odvoda",
        defaultValue: "Zadovoljava",
      },
      {
        id: "szomv-stanje-mjernih-spojeva",
        key: "szomv-stanje-mjernih-spojeva",
        tokenKey: "SZOMV_STANJE_MJERNIH_SPOJEVA",
        label: "Stanje mjernih spojeva",
        defaultValue: "Zadovoljava",
      },
      {
        id: "szomv-vanjske-dogradnje",
        key: "szomv-vanjske-dogradnje",
        tokenKey: "SZOMV_VANJSKE_DOGRADNJE",
        label: "Ima li dogradnji ili preinaka koje zahtijevaju prosirenje vanjskog sustava",
        defaultValue: "Ne",
        options: SZOMV_YES_NO_OPTIONS,
      },
    ],
  }),
  Object.freeze({
    id: "szomv-unutarnji-sustav",
    key: "szomv-unutarnji-sustav",
    tokenKey: "SZOMV_UNUTARNJI_SUSTAV",
    label: "Stanje unutarnjeg sustava zastite od munje",
    summary: "Prenaponska zastita, opskrbni vodovi i izjednacavanje potencijala.",
    enabledFieldId: "use-szomv-unutarnji-sustav",
    enabledByDefault: true,
    assessmentLabel: "Stanje unutarnjeg sustava zastite od munje",
    options: SZOMV_STATUS_OPTIONS,
    items: [
      {
        id: "szomv-odvodnici-elektroenergetski-vod",
        key: "szomv-odvodnici-elektroenergetski-vod",
        tokenKey: "SZOMV_ODVODNICI_ELEKTROENERGETSKI_VOD",
        label: "Stanje odvodnika struje munje i prenapona na elektroenergetskom kabelu ili nadzemnom vodu",
        defaultValue: "Zadovoljava",
      },
      {
        id: "szomv-elektro-vod-ostecen-proradio",
        key: "szomv-elektro-vod-ostecen-proradio",
        tokenKey: "SZOMV_ELEKTRO_VOD_OSTECEN_PRORADIO",
        label: "Elektroenergetski vod - ostecen ili proradio",
        defaultValue: "Ne",
        options: SZOMV_YES_NO_OPTIONS,
      },
      {
        id: "szomv-elektro-vod-osigurac-proradio",
        key: "szomv-elektro-vod-osigurac-proradio",
        tokenKey: "SZOMV_ELEKTRO_VOD_OSIGURAC_PRORADIO",
        label: "Elektroenergetski vod - osigurac proradio",
        defaultValue: "Ne",
        options: SZOMV_YES_NO_OPTIONS,
      },
      {
        id: "szomv-odvodnici-telekomunikacijski-vod",
        key: "szomv-odvodnici-telekomunikacijski-vod",
        tokenKey: "SZOMV_ODVODNICI_TELEKOMUNIKACIJSKI_VOD",
        label: "Stanje odvodnika na telekomunikacijskom kabelu ili nadzemnom vodu",
        defaultValue: "Zadovoljava",
      },
      {
        id: "szomv-telekom-vod-ostecen-proradio",
        key: "szomv-telekom-vod-ostecen-proradio",
        tokenKey: "SZOMV_TELEKOM_VOD_OSTECEN_PRORADIO",
        label: "Telekomunikacijski vod - ostecen ili proradio",
        defaultValue: "Ne",
        options: SZOMV_YES_NO_OPTIONS,
      },
      {
        id: "szomv-telekom-vod-osigurac-proradio",
        key: "szomv-telekom-vod-osigurac-proradio",
        tokenKey: "SZOMV_TELEKOM_VOD_OSIGURAC_PRORADIO",
        label: "Telekomunikacijski vod - osigurac proradio",
        defaultValue: "Ne",
        options: SZOMV_YES_NO_OPTIONS,
      },
      {
        id: "szomv-spojevi-opskrbnih-vodova",
        key: "szomv-spojevi-opskrbnih-vodova",
        tokenKey: "SZOMV_SPOJEVI_OPSKRBNIH_VODOVA",
        label: "Stanje spojeva opskrbnih vodova sa sustavom uzemljenja i izjednacivanja potencijala",
        defaultValue: "Zadovoljava",
      },
      {
        id: "szomv-vodici-izjednacavanje-potencijala",
        key: "szomv-vodici-izjednacavanje-potencijala",
        tokenKey: "SZOMV_VODICI_IZJEDNACAVANJE_POTENCIJALA",
        label: "Stanje vodica za izjednacavanje potencijala unutar gradjevine",
        defaultValue: "Zadovoljava",
      },
      {
        id: "szomv-sabirnice-izjednacenje-potencijala",
        key: "szomv-sabirnice-izjednacenje-potencijala",
        tokenKey: "SZOMV_SABIRNICE_IZJEDNACENJE_POTENCIJALA",
        label: "Stanje spojeva na sabirnicama za izjednacenje potencijala",
        defaultValue: "Zadovoljava",
      },
      {
        id: "szomv-unutarnje-dogradnje",
        key: "szomv-unutarnje-dogradnje",
        tokenKey: "SZOMV_UNUTARNJE_DOGRADNJE",
        label: "Ima li dogradnji ili preinaka koje zahtijevaju prosirenje unutarnjeg sustava",
        defaultValue: "Ne",
        options: SZOMV_YES_NO_OPTIONS,
      },
    ],
  }),
  Object.freeze({
    id: "szomv-ocjena",
    key: "szomv-ocjena",
    tokenKey: "SZOMV_OCJENA",
    label: "Ocjena rezultata vizualnog pregleda",
    summary: "Stavke ocjene iz SZOMV zapisnika.",
    enabledFieldId: "use-szomv-ocjena",
    enabledByDefault: true,
    assessmentLabel: "Ocjena rezultata vizualnog pregleda",
    options: SZOMV_STATUS_OPTIONS,
    items: [
      "Stanje hvataljki i odvoda",
      "Stanje uzemljivaca",
      "Stanje prikljucka metalnih masa",
      "Stanje mjernih spojeva",
      "Stanje mehanicke zastite vodica",
      "Stanje u skladu s projektnom dokumentacijom",
      "Stanje opskrbnih vodova sa sustavom uzemljenja i izjednacivanja potencijala",
      "Stanje spojeva na sabirnicama za izjednacenje potencijala",
    ].map((label, index) => ({
      id: `szomv-ocjena-${index + 1}`,
      key: `szomv-ocjena-${index + 1}`,
      tokenKey: `SZOMV_OCJENA_${index + 1}`,
      label,
      defaultValue: "Zadovoljava",
    })),
  }),
]);

const FIRE_REVIEW_ITEMS = [
  "Projektna dokumentacija i izvedeno stanje",
  "Vizualni pregled sustava",
  "Funkcionalno ispitivanje sustava",
  "Sustavi u sprezi",
  "Signalizacija i alarmiranje",
  "Mjerna i ispitna oprema",
];

const GAS_ASSESSMENT_ITEMS = [
  "Vizualni pregled cjelokupne plinske instalacije",
  "Provjera nepropusnosti spojeva oko glavnog zapora",
  "Provjera nepropusnosti razvodnog cjevovoda",
  "Provjera nepropusnosti spojeva oko plinomjera",
  "Provjera nepropusnosti oko regulatora",
  "Provjera nepropusnosti oko manometara",
  "Provjera cjevovoda za plinska trosila",
  "Provjera sigurnosnih, zastitnih i regulacijskih uredjaja",
];

const WORK_EQUIPMENT_ITEMS = [
  "Zastita od pokretnih dijelova - pogonski mehanizam",
  "Nacin postavljanja / osiguranje stabilnosti",
  "Promjene nastale uporabom",
  "Ostvarivanje gibanja i djelovanja stroja i uredjaja",
  "Djelovanje signalnih uredjaja",
  "Djelovanje uredjaja za upravljanje",
  "Djelovanje uredjaja za ukljucivanje i iskljucivanje",
  "Zastita od povrata napona",
  "Zastita od pokretnih dijelova - prijenosnici snage i gibanja",
  "Zastita od pokretnih dijelova - radni elementi",
  "Otpor izolacije",
];

const STROJEVI_DEFAULT_ITEMS = [
  "Zastita od pokretnih dijelova - pogonski mehanizam",
  "Nacin postavljanja / osiguranje stabilnosti",
  "Promjene nastale uporabom",
  "Ostvarivanje gibanja i djelovanja stroja i uredaja prema oznakama vrsta i smjerova kretanja",
  "Djelovanje signalnih uredaja",
  "Djelovanje uredaja za upravljanje",
  "Djelovanje uredaja za ukljucivanje i iskljucivanje",
  "Zastita od povrata napona",
  "Zastita od pokretnih dijelova - prijenosnici snage i gibanja",
  "Zastita od pokretnih dijelova - radni elementi",
  "Otpor izolacije [Ohm]",
  "Zastita od izravnog dodira dijelova pod naponom",
  "Nacin prikljucka na elektricnu mrezu, nazivni napon",
  "Vrsta kabela, presjek vodica, stanje izolacije",
  "Smjestaj i osiguranje slobodnog prostora za kretanje i rad",
];

const YES_NO_VALUES = ["DA", "NE"];
const YES_NO_NP_VALUES = ["DA", "NE", "NP"];
const EIZ_RCD_DEVICE_ALIASES = [
  "FID",
  "FI",
  "FID sklopka",
  "ZUDS",
  "ZIDA",
  "RCD",
  "RCCB",
  "RCBO",
  "KZS",
  "diferencijalna sklopka",
  "zastitna diferencijalna sklopka",
  "kombinirana sklopka",
  "kombinacijska sklopka",
  "kombinirani zastitni uredaj",
  "kombinacijski zastitni uredaj",
];
const EIZ_RCD_RATING_ALIASES = [
  "40/30",
  "40A/30mA",
  "40 A / 30 mA",
  "25/30",
  "63/300",
  "I delta n",
  "IΔn",
  "Idn",
  "0,03 A",
  "0.03 A",
  "30 mA",
  "300 mA",
];

function makeDocumentationResultAiContext(subject = "predmetni zapisnik", terms = []) {
  const baseTerms = Array.from(new Set([subject, ...terms].filter(Boolean)));
  return Object.freeze({
    subject,
    resultLookFor: [...baseTerms, "zadovoljava", "ne zadovoljava", "ocjena", "DA", "NE"],
    defectsLookFor: [...baseTerms, "nedostaci", "neispravno", "ne zadovoljava", "primjedba", "otkloniti"],
    recommendationsLookFor: [...baseTerms, "preporuke", "napomena", "potrebno", "predlaze se", "sanacija"],
    aiAvoid: `Ne koristi podatke iz drugih vrsta zapisnika. Za ${subject} koristi samo podatke koji su jasno vezani uz istu uslugu, lokaciju ili objekt.`,
  });
}

const DOCUMENTATION_RESULT_AI_CONTEXT_BY_SERVICE = Object.freeze({
  SPR: Object.freeze({
    subject: "sigurnosnu i protupanicnu rasvjetu",
    resultLookFor: ["SPR", "sigurnosna rasvjeta", "panik rasvjeta", "Ei", "Eimin", "zadovoljava", "ne zadovoljava"],
    defectsLookFor: ["nedostaci", "neispravna svjetiljka", "ne zadovoljava", "Ei", "Eimin", "rasvjeta"],
    recommendationsLookFor: ["preporuke", "napomena", "servis rasvjete", "zamjena svjetiljke", "provjera autonomije"],
    aiAvoid: "Ne prepisuj podatke iz drugih vrsta zapisnika. Za SPR koristi samo rasvjetu, lux vrijednosti i ocjenu sigurnosne/protupanicne rasvjete.",
  }),
  TZIN: Object.freeze({
    subject: "tipkala za isklop elektricne energije u slucaju nuzde",
    resultLookFor: ["TZIN", "tipkalo", "isklop elektricne energije", "slucaj nuzde", "funkcionalnost", "zadovoljava", "DA", "NE"],
    defectsLookFor: ["nedostaci", "tipkalo ne radi", "neispravno tipkalo", "ne zadovoljava", "isklop nije ostvaren", "primjedba"],
    recommendationsLookFor: ["preporuke", "napomena", "zamjena tipkala", "oznacavanje tipkala", "provjera isklopa"],
    aiAvoid: "Ne koristi tekstove o panik rasvjeti, lux vrijednostima, uzemljenju ili EIZ mjerenjima za TZIN. Ako izvor nema TZIN tablicu, ostavi korisniku za provjeru.",
  }),
  SZOM: Object.freeze({
    subject: "sustav zastite od djelovanja munje",
    resultLookFor: ["SZOM", "sustav zastite od munje", "Riz", "Rdop", "skriveni spojevi", "metalne mase", "zadovoljava"],
    defectsLookFor: ["nedostaci", "ne zadovoljava", "povecani otpor", "prekid spoja", "neispravan odvod", "uzemljenje"],
    recommendationsLookFor: ["preporuke", "napomena", "sanacija uzemljenja", "popravak spoja", "pregled odvoda"],
    aiAvoid: "Ne koristi SPR, TZIN ili EIZ zakljucke za SZOM. Zakljucak temelji na SZOM mjernim vrijednostima i vizualnim navodima.",
  }),
  SZOMV: Object.freeze({
    subject: "vizualni pregled sustava zastite od djelovanja munje",
    resultLookFor: ["SZOMV", "vizualni pregled", "hvataljke", "odvodi", "mjerni spojevi", "uzemljenje", "zadovoljava"],
    defectsLookFor: ["nedostaci", "neuredno", "ostecenje", "korozija", "prekid", "ne zadovoljava"],
    recommendationsLookFor: ["preporuke", "napomena", "sanacija", "popravak", "vizualni pregled"],
    aiAvoid: "Ne izvlaci mjerne vrijednosti iz SZOM tablice kao vizualni nedostatak ako u SZOMV dijelu nema takve primjedbe.",
  }),
  EIZ: Object.freeze({
    subject: "elektricnu instalaciju",
    resultLookFor: ["EIZ", "elektricne instalacije", "EIZ.V", "EIZ.ZUDS", "EIZ.IPK", "EIZ.OI", "EIZ.K", ...EIZ_RCD_DEVICE_ALIASES, "zadovoljava"],
    defectsLookFor: ["nedostaci", "ne zadovoljava", ...EIZ_RCD_DEVICE_ALIASES, "impedancija", "otpor izolacije", "kontinuitet", "vizualni pregled"],
    recommendationsLookFor: ["preporuke", "napomena", "sanacija instalacije", "provjera FID", "provjera RCD", "otkloniti nedostatke"],
    aiAvoid: "Ne koristi SZOM, TZIN ili SPR tekstove za EIZ. Kod jednopolne sheme popuni samo ono sto je jasno povezano s krugovima i zastitnim uredajima.",
  }),
  VES: Object.freeze({
    subject: "vjezbu evakuacije i spasavanja",
    resultLookFor: ["VES", "vjezba evakuacije", "spasavanje", "zborno mjesto", "vrijeme evakuacije", "zadovoljava"],
    defectsLookFor: ["nedostaci", "ne zadovoljava", "evakuacija", "problem", "primjedba"],
    recommendationsLookFor: ["preporuke", "napomena", "ponoviti vjezbu", "zborno mjesto", "plan evakuacije"],
    aiAvoid: "Ne koristi mjerenja elektrike, munje, rasvjete ili tipkala za VES zapisnik.",
  }),
  EMM: makeDocumentationResultAiContext("povezanost metalnih masa", ["EMM", "metalne mase", "kontinuitet", "Rizm"]),
  VS: makeDocumentationResultAiContext("sustav ventilacije", ["VS", "ventilacija", "protok", "broj izmjena"]),
  PPCAFFE: makeDocumentationResultAiContext("ventilaciju caffe bara", ["PPCAFFE", "ventilacija", "caffe"]),
  PZP: makeDocumentationResultAiContext("ventilaciju prostora za pusace", ["PZP", "ventilacija", "pusaci"]),
  EXEI: makeDocumentationResultAiContext("elektricne instalacije u Ex prostoru", ["EXEI", "ExEi", "Ex", "impedancija", "ZUDS", "otpor izolacije"]),
  EXSE: makeDocumentationResultAiContext("uzemljenje i staticki elektricitet u Ex prostoru", ["EXSE", "ExSe", "uzemljenje", "staticki elektricitet"]),
  EXOV: makeDocumentationResultAiContext("odzracne ventile", ["EXOV", "ExOv", "odzracni ventili", "funkcionalno ispitivanje"]),
  SVZ: Object.freeze({
    subject: "stabilni sustav za dojavu pozara",
    resultLookFor: ["SVZ", "dojava pozara", "centrala", "detektori", "rucni javljaci", "sirene", "rezervno napajanje", "sustavi u sprezi", "zadovoljava"],
    defectsLookFor: ["nedostaci", "neispravno", "greska centrale", "neispravan javljac", "sirena ne radi", "rezervno napajanje", "ne zadovoljava"],
    recommendationsLookFor: ["preporuke", "napomena", "servis sustava dojave", "zamjena javljaca", "provjera centrale", "odrzavanje"],
    aiAvoid: "Ne koristi hidrantsku mrezu, sprinkler, plinodojavu, SPR rasvjetu ili EIZ mjerenja za SVZ. Za SVZ koristi samo tekstove i nalaze koji se odnose na sustav za dojavu pozara.",
  }),
  SP: makeDocumentationResultAiContext("sustav detekcije zapaljivih plinova", ["SP", "detekcija plina", "plinodetekcija"]),
  HM: makeDocumentationResultAiContext("hidrantsku mrezu", ["HM", "hidrantska mreza", "hidrant", "tlak", "protok"]),
  HMU: makeDocumentationResultAiContext("unutarnju hidrantsku mrezu", ["HMU", "unutarnja hidrantska mreza", "hidrant"]),
  HMV: makeDocumentationResultAiContext("vanjsku hidrantsku mrezu", ["HMV", "vanjska hidrantska mreza", "hidrant"]),
  HMUV: makeDocumentationResultAiContext("unutarnju i vanjsku hidrantsku mrezu", ["HMUV", "hidrantska mreza", "hidrant"]),
  SGP: makeDocumentationResultAiContext("sustav za gasenje pozara plinom", ["SGP", "gasenje plinom", "pozar"]),
  SS: makeDocumentationResultAiContext("sprinkler sustav", ["SS", "sprinkler", "pozar"]),
  PJENA: makeDocumentationResultAiContext("sustav za gasenje pozara pjenom", ["PJENA", "gasenje pjenom", "pozar"]),
  SO: makeDocumentationResultAiContext("sustav za odvodjenje dima i topline", ["SO", "odvodjenje dima", "dim", "toplina"]),
  PZ: makeDocumentationResultAiContext("vatrootporne zavjese", ["PZ", "vatrootporne zavjese"]),
  PPV: makeDocumentationResultAiContext("protupozarna vrata", ["PPV", "protupozarna vrata"]),
  PPZ: makeDocumentationResultAiContext("protupozarne zaklopke", ["PPZ", "protupozarne zaklopke"]),
  DS: makeDocumentationResultAiContext("drencher sustav", ["DS", "drencher", "hladjenje spremnika", "voda"]),
  PLINSKAKOTLOVNICA: makeDocumentationResultAiContext("plinsku kotlovnicu", ["plinska kotlovnica", "kotlovnica", "plin"]),
  NPI: makeDocumentationResultAiContext("plinsku instalaciju", ["NPI", "plinska instalacija", "nepropusnost", "tlacna proba"]),
  UNP: makeDocumentationResultAiContext("UNP instalaciju", ["UNP", "nepropusnost", "tlacna proba"]),
  ROF: makeDocumentationResultAiContext("fizikalne cimbenike radnog okolisa", ["ROF", "RO-F", "fizikalni cimbenici", "osvjetljenje", "buka", "mikroklima"]),
  ROK: makeDocumentationResultAiContext("kemijske cimbenike radnog okolisa", ["ROK", "RO-K", "kemijski cimbenici", "GVI", "KGVI"]),
  STROJEVI: makeDocumentationResultAiContext("nadzor opreme", ["STROJEVI", "nadzor opreme", "stroj", "oprema"]),
  NO: makeDocumentationResultAiContext("nadzor opreme", ["NO", "nadzor opreme", "stroj", "oprema"]),
  RADNAOPREMA: makeDocumentationResultAiContext("radnu opremu", ["radna oprema", "stroj", "zastita"]),
  PE: makeDocumentationResultAiContext("plan evakuacije", ["PE", "plan evakuacije", "evakuacijski smjer", "zborno mjesto"]),
  NNZD: makeDocumentationResultAiContext("negativni nalaz", ["NNZD", "nesukladnost", "negativni nalaz"]),
  NNZDPETROL: makeDocumentationResultAiContext("Petrol negativni nalaz", ["NNZDPETROL", "Petrol", "nesukladnost", "SAP Fiori"]),
  EOTP: makeDocumentationResultAiContext("evidenciju tehnickih podataka", ["EOTP", "tehnicki podaci", "evidencija"]),
});

const DOCUMENTATION_TECHNICAL_AI_BY_SERVICE = Object.freeze({
  SZOM: Object.freeze({
    inspectionArea: makeTechnicalAi({
      key: "technical-inspectionArea",
      label: "Prostor pregleda",
      defaultValue: "Prostor benzinske postaje sa pratecim sadrzajem",
      aiDescription: "Pronadji prostor ili objekt pregleda sustava zastite od djelovanja munje. Najcesce stoji u opisu objekta, tehnickim podacima ili prvom dijelu starog zapisnika.",
      aiLookFor: ["prostor pregleda", "objekt pregleda", "prostor benzinske postaje", "tehnicki podaci"],
      examples: ["Prostor benzinske postaje sa pratecim sadrzajem"],
    }),
    weatherConditions: makeTechnicalAi({
      key: "technical-weatherConditions",
      label: "Vremenski uvjeti",
      defaultValue: "Vedro",
      aiDescription: "Pronadji vremenske uvjete navedene uz mjerenje sustava zastite od munje.",
      aiLookFor: ["vremenski uvjeti", "vrijeme", "uvjeti mjerenja"],
      examples: ["Vedro", "Oblacno", "Suho vrijeme"],
    }),
    soilResistance: makeTechnicalAi({
      key: "technical-soilResistance",
      label: "Otpor tla [ohm m]",
      defaultValue: "-",
      aiDescription: "Pronadji podatak o otporu tla ili specificnom otporu tla ako postoji u starom zapisniku.",
      aiLookFor: ["otpor tla", "specificni otpor tla", "rho", "ohm m"],
      examples: ["-", "120 ohm m"],
    }),
    soilMoisture: makeTechnicalAi({
      key: "technical-soilMoisture",
      label: "Vlaznost tla",
      defaultValue: "Suho",
      aiDescription: "Pronadji vlaznost ili stanje tla kod pregleda sustava zastite od munje.",
      aiLookFor: ["vlaznost tla", "stanje tla", "suho", "vlazno"],
      examples: ["Suho", "Vlazno"],
    }),
    protectionSystemClass: makeTechnicalAi({
      key: "technical-protectionSystemClass",
      label: "Vrsta sustava zastite",
      defaultValue: "II",
      aiDescription: "Pronadji klasu ili vrstu sustava zastite od munje.",
      aiLookFor: ["LPS klasa", "razina zastite", "vrsta sustava zastite", "klasa zastite"],
      examples: ["II", "III", "LPS II"],
    }),
    airTermination: makeTechnicalAi({
      key: "technical-airTermination",
      label: "Hvataljke",
      defaultValue: "Aluminijska zica",
      aiDescription: "Pronadji opis hvataljki sustava zastite od munje.",
      aiLookFor: ["hvataljke", "mreza vodica", "stapne hvataljke", "aluminijska zica"],
      examples: ["Aluminijska zica", "Mreza vodica"],
    }),
    downConductors: makeTechnicalAi({
      key: "technical-downConductors",
      label: "Odvodi",
      defaultValue: "Pocincana traka Fe/Zn, Aluminijska zica",
      aiDescription: "Pronadji opis odvoda sustava zastite od munje.",
      aiLookFor: ["odvodi", "vodici odvoda", "Fe/Zn", "aluminijska zica"],
      examples: ["Pocincana traka Fe/Zn", "Pocincana traka Fe/Zn, Aluminijska zica"],
    }),
    earthing: makeTechnicalAi({
      key: "technical-earthing",
      label: "Uzemljenje",
      defaultValue: "Pocincana traka Fe/Zn",
      aiDescription: "Pronadji opis uzemljenja sustava zastite od munje.",
      aiLookFor: ["uzemljenje", "uzemljivac", "temeljni uzemljivac", "Fe/Zn"],
      examples: ["Pocincana traka Fe/Zn", "Temeljni uzemljivac"],
    }),
  }),
  SZOMV: Object.freeze({
    inspectionArea: makeTechnicalAi({
      key: "technical-inspectionArea",
      label: "Prostor pregleda",
      defaultValue: "Prostor benzinske postaje sa pratecim sadrzajem",
      aiDescription: "Pronadji prostor ili objekt vizualnog pregleda sustava zastite od djelovanja munje.",
      aiLookFor: ["prostor pregleda", "objekt pregleda", "vizualni pregled", "tehnicki podaci"],
      examples: ["Prostor benzinske postaje sa pratecim sadrzajem"],
    }),
    weatherConditions: makeTechnicalAi({
      key: "technical-weatherConditions",
      label: "Vremenski uvjeti",
      defaultValue: "Vedro",
      aiDescription: "Pronadji vremenske uvjete navedene uz vizualni pregled.",
      aiLookFor: ["vremenski uvjeti", "vrijeme", "uvjeti pregleda"],
      examples: ["Vedro", "Oblacno"],
    }),
    soilMoisture: makeTechnicalAi({
      key: "technical-soilMoisture",
      label: "Vlaznost tla",
      defaultValue: "Suho",
      aiDescription: "Pronadji stanje tla ako je navedeno u vizualnom pregledu.",
      aiLookFor: ["vlaznost tla", "stanje tla", "suho", "vlazno"],
      examples: ["Suho", "Vlazno"],
    }),
    protectionSystemClass: makeTechnicalAi({
      key: "technical-protectionSystemClass",
      label: "Vrsta sustava zastite",
      defaultValue: "II",
      aiDescription: "Pronadji klasu ili vrstu sustava zastite od munje.",
      aiLookFor: ["LPS klasa", "razina zastite", "vrsta sustava zastite", "klasa zastite"],
      examples: ["II", "III", "LPS II"],
    }),
    airTermination: makeTechnicalAi({
      key: "technical-airTermination",
      label: "Hvataljke",
      defaultValue: "Aluminijska zica",
      aiDescription: "Pronadji opis hvataljki u tehnickim podacima ili vizualnom opisu.",
      aiLookFor: ["hvataljke", "mreza vodica", "stapne hvataljke"],
      examples: ["Aluminijska zica", "Mreza vodica"],
    }),
    downConductors: makeTechnicalAi({
      key: "technical-downConductors",
      label: "Odvodi",
      defaultValue: "Pocincana traka Fe/Zn, Aluminijska zica",
      aiDescription: "Pronadji opis odvoda sustava zastite od munje.",
      aiLookFor: ["odvodi", "vodici odvoda", "Fe/Zn"],
      examples: ["Pocincana traka Fe/Zn, Aluminijska zica"],
    }),
    earthing: makeTechnicalAi({
      key: "technical-earthing",
      label: "Uzemljenje",
      defaultValue: "Pocincana traka Fe/Zn",
      aiDescription: "Pronadji opis uzemljenja iz starog zapisnika ili projekta.",
      aiLookFor: ["uzemljenje", "uzemljivac", "temeljni uzemljivac"],
      examples: ["Pocincana traka Fe/Zn"],
    }),
  }),
  SVZ: Object.freeze({
    protectedArea: makeTechnicalAi({
      key: "technical-protectedArea",
      label: "Predmet zastite / opis prostora",
      defaultValue: "Poslovni prostor - benzinska postaja sa pratecim sadrzajem.",
      aiDescription: "Pronadji opis prostora ili predmeta zastite sustava za dojavu pozara. Trazi tekstove poput poslovni prostor, benzinska postaja, prodajni prostor, ured, skladiste, sanitarni prostori i slicno.",
      aiLookFor: ["predmet zastite", "opis prostora", "poslovni prostor", "benzinska postaja", "sustav za dojavu pozara"],
      examples: ["Poslovni prostor - benzinska postaja sa pratecim sadrzajem."],
    }),
    centralManufacturer: makeTechnicalAi({
      key: "technical-centralManufacturer",
      label: "Centralni uredjaj - proizvodjac",
      defaultValue: "INIM",
      aiDescription: "Pronadji proizvodjaca centralnog uredjaja sustava za dojavu pozara.",
      aiLookFor: ["centralni uredjaj", "vatrodojavna centrala", "centrala", "proizvodjac"],
      examples: ["INIM", "Schrack Seconet", "Bosch", "Esser"],
    }),
    centralType: makeTechnicalAi({
      key: "technical-centralType",
      label: "Centralni uredjaj - tip",
      defaultValue: "Smartline 020-4",
      aiDescription: "Pronadji tip/model centrale i eventualni serijski broj ako je naveden uz centralni uredjaj.",
      aiLookFor: ["tip centrale", "model centrale", "Smartline", "centralni uredjaj", "serijski broj"],
      examples: ["Smartline 020-4", "Smartline 020-4; 1909020056"],
    }),
    centralPowerSupply: makeTechnicalAi({
      key: "technical-centralPowerSupply",
      label: "Napajanje centrale",
      defaultValue: "Glavno napajanje 230 V / 50 Hz; rezervno napajanje dvije akumulatorske baterije 12 V / 7 Ah.",
      aiDescription: "Pronadji podatke o glavnom i rezervnom napajanju vatrodojavne centrale, ukljucujuci napon, frekvenciju i akumulatorske baterije.",
      aiLookFor: ["glavno napajanje", "rezervno napajanje", "akumulatorske baterije", "12 V", "7 Ah", "230 V", "50 Hz"],
      examples: ["Glavno napajanje 230 V / 50 Hz; rezervno napajanje dvije akumulatorske baterije 12 V / 7 Ah."],
    }),
    automaticDetectorType: makeTechnicalAi({
      key: "technical-automaticDetectorType",
      label: "Automatski detektori pozara",
      defaultValue: "Opticki automatski detektori pozara, proizvodjac INIM, tip S-ID100.",
      aiDescription: "Pronadji vrstu, proizvodjaca i tip automatskih detektora pozara.",
      aiLookFor: ["automatski detektor", "opticki detektor", "detektor pozara", "S-ID100", "proizvodjac"],
      examples: ["Opticki automatski detektori pozara, proizvodjac INIM, tip S-ID100."],
    }),
    manualCallPointType: makeTechnicalAi({
      key: "technical-manualCallPointType",
      label: "Rucni javljaci pozara",
      defaultValue: "Rucni javljaci proizvodjac PIT-ALARM, tip PIT92 vd i IP67 PIT-98-65vd.",
      aiDescription: "Pronadji proizvodjaca, tip i smjestaj rucnih javljaca pozara.",
      aiLookFor: ["rucni javljaci", "rucni dojavljivaci", "PIT-ALARM", "PIT92", "IP67", "izlazni putevi"],
      examples: ["Rucni javljaci proizvodjac PIT-ALARM, tip PIT92 vd i IP67 PIT-98-65vd."],
    }),
    alarmSirens: makeTechnicalAi({
      key: "technical-alarmSirens",
      label: "Alarmne sirene",
      defaultValue: "Unutarnje alarmne sirene, tip s-smarty/gfr i S-Ivy R.",
      aiDescription: "Pronadji tip i opis alarmnih sirena te podatke o zvucnoj signalizaciji.",
      aiLookFor: ["alarmne sirene", "unutarnja alarmna sirena", "zvucna signalizacija", "s-smarty", "S-Ivy"],
      examples: ["Unutarnje alarmne sirene, tip s-smarty/gfr i S-Ivy R."],
    }),
    linkedSystems: makeTechnicalAi({
      key: "technical-linkedSystems",
      label: "Sustavi u sprezi",
      defaultValue: "Otvaranje kliznih vrata, otvaranje vrata pod kontrolom pristupa, gasenje ventilacije.",
      aiDescription: "Pronadji sustave koji rade u sprezi sa sustavom dojave pozara, npr. vrata, kontrola pristupa, ventilacija, lift, odimljavanje ili drugi povezani sustavi.",
      aiLookFor: ["sustavi u sprezi", "klizna vrata", "kontrola pristupa", "gasenje ventilacije", "odimljavanje", "lift"],
      examples: ["Otvaranje kliznih vrata, otvaranje vrata pod kontrolom pristupa, gasenje ventilacije."],
    }),
    maintenanceBook: makeTechnicalAi({
      key: "technical-maintenanceBook",
      label: "Knjiga odrzavanja",
      defaultValue: "Korisnik posjeduje knjigu odrzavanja sustava.",
      aiDescription: "Pronadji navod o knjizi odrzavanja sustava za dojavu pozara.",
      aiLookFor: ["knjiga odrzavanja", "odrzavanje sustava", "korisnik posjeduje knjigu"],
      examples: ["Korisnik posjeduje knjigu odrzavanja sustava."],
    }),
  }),
  EIZ: Object.freeze({
    networkSystem: makeTechnicalAi({
      key: "technical-networkSystem",
      label: "Sustav mreže",
      defaultValue: "TN-S sa ZUDS",
      aiDescription: "Ukoliko se upload napravi jednopolne sheme, projekta, slike elektroormara ili prethodnog EIZ zapisnika, pronađi sustav mreže. Traži oznake TN-S, TN-C, TN-C/S, TN-C-S, TT ili IT te dodatke poput ZUDS/FID/RCD.",
      aiLookFor: ["sustav mreže", "sustav mreze", "TN-S", "TN-C", "TN-C/S", "TN-C-S", "TT", "IT", "jednopolna shema", "projekt", "elektroormar", "prethodni zapisnik", ...EIZ_RCD_DEVICE_ALIASES],
      examples: ["TN-S sa ZUDS", "TN-C/S", "TN-C-S", "TT sa ZUDS", "IT"],
      validationRules: "Vrati samo kratak naziv sustava mreže i eventualni dodatak zaštite. Ako nije jasno vidljivo, ostavi postojeću vrijednost korisniku za provjeru.",
    }),
    voltageFrequency: makeTechnicalAi({
      key: "technical-voltageFrequency",
      label: "Napon/frekvencija",
      defaultValue: "230/400 V; 50 Hz",
      aiDescription: "Ukoliko se upload napravi jednopolne sheme, projekta, slike elektroormara ili prethodnog EIZ zapisnika, pronađi nazivni napon i frekvenciju, npr. 230/400 V; 50 Hz ili slične kombinacije.",
      aiLookFor: ["napon", "frekvencija", "230/400", "400/230", "230 V", "400 V", "50 Hz", "jednopolna shema", "projekt", "natpisna pločica", "elektroormar"],
      examples: ["230/400 V; 50 Hz", "400/230 V; 50 Hz", "230 V; 50 Hz"],
      validationRules: "Vrati napon i frekvenciju u jednom kratkom retku. Ne izmišljaj frekvenciju ako nije navedena.",
    }),
    protectionType: makeTechnicalAi({
      key: "technical-protectionType",
      label: "Vrsta zaštite",
      defaultValue: "Zaštitni uređaj diferencijalne struje - ZUDS",
      aiDescription: "Ukoliko se upload napravi jednopolne sheme, projekta, slike elektroormara ili prethodnog EIZ zapisnika, pronađi vrstu zaštite. Posebno traži osigurače, automatske ili rastalne osigurače, FID, ZUDS, FI, RCD, RCCB, RCBO, KZS i kombinacijske sklopke.",
      aiLookFor: ["vrsta zaštite", "vrsta zastite", "zaštita od električnog udara", "zastita od elektricnog udara", "automatski isklop napajanja", "osigurač", "osigurac", "automatski osigurač", "rastalni osigurač", ...EIZ_RCD_DEVICE_ALIASES, ...EIZ_RCD_RATING_ALIASES],
      examples: ["Zaštitni uređaj diferencijalne struje - ZUDS", "FID sklopka", "ZUDS", "Kombinacijska sklopka 40/30", "Automatski isklop napajanja"],
      validationRules: "Vrati opis mjere zaštite, ne popis svih elemenata ako je prikladnije za polje Zaštitni uređaji. Ako nije sigurno, ostavi postojeću vrijednost.",
    }),
    protectiveDevices: makeTechnicalAi({
      key: "technical-protectiveDevices",
      label: "Zaštitni uređaji",
      defaultValue: "Automatski osigurači, ZUDS",
      aiDescription: "Ukoliko se upload napravi jednopolne sheme, projekta, slike elektroormara ili prethodnog EIZ zapisnika, pronađi zaštitne uređaje instalacije. Traži automatske osigurače, rastalne osigurače, FID, ZUDS, RCD, kombinacijske sklopke 40/30, prenaponsku zaštitu i slične uređaje.",
      aiLookFor: ["zaštitni uređaji", "zastitni uredaji", "automatski osigurači", "automatski osiguraci", "rastalni osigurači", "rastalni osiguraci", "osigurači", "osiguraci", "jednopolna shema", "razvodni ormar", "elektroormar", ...EIZ_RCD_DEVICE_ALIASES, ...EIZ_RCD_RATING_ALIASES],
      examples: ["Automatski osigurači, ZUDS", "Automatski osigurači, FID sklopke", "Rastalni osigurači, ZUDS", "Kombinacijske sklopke 40/30"],
      validationRules: "Vrati kratak skupni opis uređaja. Ako vidiš više FID/ZUDS uređaja, ne moraš nabrajati svaki krug nego sažmi vrstu uređaja.",
    }),
  }),
});

const DOCUMENTATION_COLUMN_AI_BY_TABLE = Object.freeze({
  "spr-results": Object.freeze({
    place: makeColumnAi({
      key: "place",
      label: "Mjesto ispitivanja",
      aiDescription: "Prepiši mjerna mjesta sigurnosne ili protupanicne rasvjete iz stare SPR tablice.",
      aiLookFor: ["mjesto ispitivanja", "mjerno mjesto", "sigurnosna rasvjeta", "panik rasvjeta", "evakuacijski put"],
      examples: ["Izlaz", "Prodajni prostor", "Ulaz"],
      required: true,
    }),
    lampCount: makeColumnAi({
      key: "lampCount",
      label: "Broj lampi",
      type: "number",
      aiDescription: "Prepiši broj lampi za isto mjerno mjesto. Ako broj nije jasno naveden, predlozi 1.",
      aiLookFor: ["broj lampi", "broj svjetiljki", "kom", "rasvjetno tijelo"],
      examples: ["1", "2"],
      fallbackValue: "1",
    }),
    ei: makeColumnAi({
      key: "ei",
      label: "Ei",
      type: "text",
      unit: "lux",
      aiDescription: "Prepiši izmjereno osvjetljenje Ei za sigurnosnu rasvjetu. Vrijednost moze biti broj ili izraz poput >2.",
      aiLookFor: ["Ei", "izmjereno osvjetljenje", "lux"],
      examples: [">2", "3,5", "2.8"],
      validationRules: "Zadrzi decimalni zapis i znak > ako postoji. Ne pretvaraj jedinice.",
    }),
    eimin: makeColumnAi({
      key: "eimin",
      label: "Eimin",
      type: "text",
      unit: "lux",
      aiDescription: "Prepiši zahtijevano minimalno osvjetljenje Eimin. Ako nije vidljivo, predlozi 1.",
      aiLookFor: ["Eimin", "minimalno osvjetljenje", "zahtijevano osvjetljenje", "lux"],
      examples: ["1", "0,5"],
      fallbackValue: "1",
    }),
    pass: makeColumnAi({
      key: "pass",
      label: "ZADOVOLJAVA",
      type: "enum",
      aiDescription: "Prepiši DA/NE za ocjenu retka. Ako ocjena nije navedena, zakljuci samo kada su Ei i Eimin jasno usporedivi.",
      aiLookFor: ["zadovoljava", "ocjena", "DA", "NE"],
      allowedValues: YES_NO_VALUES,
      commonValues: ["DA"],
      fallbackValue: "DA",
      validationRules: "Ne stavljaj DA ako je u retku jasno navedeno da ne zadovoljava.",
    }),
  }),
  "tzin-buttons": Object.freeze({
    place: makeColumnAi({
      key: "place",
      label: "Mjesto ispitivanja",
      aiDescription: "Prepiši mjesta tipkala za isklop elektricne energije u slucaju nuzde iz stare TZIN tablice.",
      aiLookFor: ["mjesto ispitivanja", "mjesto tipkala", "tipkalo", "isklop u slucaju nuzde"],
      examples: ["Rasvjetni stup", "Ulaz", "RO"],
      aiAvoid: "Ne uzimaj mjerna mjesta iz SPR, SZOM ili EIZ tablica. Za TZIN redak koristi samo mjesta tipkala za isklop u slucaju nuzde.",
      required: true,
    }),
    buttonCount: makeColumnAi({
      key: "buttonCount",
      label: "Broj tipkala",
      type: "number",
      aiDescription: "Prepiši broj tipkala na toj lokaciji. Ako nije vidljivo, predlozi 1.",
      aiLookFor: ["broj tipkala", "kom", "tipkala"],
      examples: ["1", "2"],
      fallbackValue: "1",
      validationRules: "Vrati cijeli broj. Ako se u starom zapisniku vidi samo jedan redak bez broja, predlozi 1.",
    }),
    buttonType: makeColumnAi({
      key: "buttonType",
      label: "Tip tipkala",
      aiDescription: "Prepiši tip tipkala ako postoji. Ako stari zapisnik ima crticu, prepiši crticu.",
      aiLookFor: ["tip tipkala", "tip", "model", "oznaka"],
      examples: ["-", "gljiva", "tipkalo u kutiji"],
      fallbackValue: "-",
      validationRules: "Ako je u starom TZIN zapisniku upisana crtica, zadrzi crticu. Ne izmisljaj model tipkala.",
    }),
    pass: makeColumnAi({
      key: "pass",
      label: "ZADOVOLJAVA",
      type: "enum",
      aiDescription: "Prepiši DA/NE za funkcionalnost tipkala.",
      aiLookFor: ["zadovoljava", "funkcionalnost", "ispravno", "DA", "NE"],
      aiAvoid: "Ne zakljucuj iz SPR lux vrijednosti ili EIZ mjerenja. TZIN ocjena vrijedi samo za funkcionalnost tipkala za isklop.",
      allowedValues: YES_NO_VALUES,
      commonValues: ["DA"],
      fallbackValue: "DA",
      validationRules: "Vrati DA ili NE. Ako stari TZIN redak ima NE ili opis neispravnosti, vrati NE.",
    }),
  }),
  "szom-measurements": Object.freeze({
    place: makeColumnAi({
      key: "place",
      label: "Mjerno mjesto",
      aiDescription: "Prepiši mjerna mjesta iz SZOM tablice, npr. odvodi, spremnici, rasvjetni stupovi, metalni poklopci ili drugi dijelovi sustava.",
      aiLookFor: ["mjerno mjesto", "odvod", "spremnik", "rasvjetni stup", "metalni poklopac", "uzemljenje"],
      examples: ["Odvod BP", "Rasvjetni stup", "Metalni poklopac"],
      required: true,
    }),
    riz: makeColumnAi({
      key: "riz",
      label: "Riz",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši izmjereni otpor rasprostiranja uzemljivaca Riz za isti redak.",
      aiLookFor: ["Riz", "otpor rasprostiranja", "uzemljivac"],
      examples: ["2,03", "2.97"],
      validationRules: "Zadrzi decimalni separator iz izvora. Ne racunaj novu vrijednost.",
    }),
    rdop: makeColumnAi({
      key: "rdop",
      label: "Rdop",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši dopusteni otpor Rdop za Riz.",
      aiLookFor: ["Rdop", "dopusteni otpor", "<10"],
      examples: ["<10"],
      fallbackValue: "<10",
    }),
    hiddenJoint: makeColumnAi({
      key: "hiddenJoint",
      label: "Skriveni spojevi",
      aiDescription: "Prepiši opis ili mjerno mjesto skrivenih spojeva ako je u retku naveden.",
      aiLookFor: ["skriveni spojevi", "spoj", "mjerni spoj"],
      examples: ["", "Spoj odvoda", "Kontrolni spoj"],
    }),
    riz2: makeColumnAi({
      key: "riz2",
      label: "Riz2",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši izmjereni elektricni otpor skrivenih spojeva Riz2 ako postoji.",
      aiLookFor: ["Riz2", "skriveni spojevi", "otpor spoja"],
      examples: ["0,42", "0.85"],
    }),
    rdop2: makeColumnAi({
      key: "rdop2",
      label: "Rdop2",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši dopusteni otpor Rdop2 za skrivene spojeve.",
      aiLookFor: ["Rdop2", "dopusteni otpor", "<1"],
      examples: ["<1"],
      fallbackValue: "<1",
    }),
    metalMassBonding: makeColumnAi({
      key: "metalMassBonding",
      label: "Elektricna povezanost metalnih masa",
      aiDescription: "Prepiši opis ili mjerno mjesto elektricne povezanosti metalnih masa ako postoji.",
      aiLookFor: ["elektricna povezanost metalnih masa", "metalne mase", "izjednacavanje potencijala"],
      examples: ["Metalni poklopac", "Odzracnik", "Spremnik"],
    }),
    riz3: makeColumnAi({
      key: "riz3",
      label: "Riz3",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši izmjereni otpor elektricne povezanosti metalnih masa Riz3 ako postoji.",
      aiLookFor: ["Riz3", "metalne mase", "elektricna povezanost"],
      examples: ["0,74", "1,25"],
    }),
    rdop3: makeColumnAi({
      key: "rdop3",
      label: "Rdop3",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši dopusteni otpor Rdop3 za povezivanje metalnih masa.",
      aiLookFor: ["Rdop3", "dopusteni otpor", "<2"],
      examples: ["<2"],
      fallbackValue: "<2",
    }),
    pass: makeColumnAi({
      key: "pass",
      label: "ZADOVOLJAVA",
      type: "enum",
      aiDescription: "Prepiši DA/NE za redak SZOM mjerenja. Ako nema ocjene, ne zakljucuj protivno izmjerenim vrijednostima.",
      aiLookFor: ["zadovoljava", "ocjena", "DA", "NE"],
      allowedValues: YES_NO_VALUES,
      commonValues: ["DA"],
      fallbackValue: "DA",
    }),
  }),
  "szomv-visual": Object.freeze({
    item: makeColumnAi({
      key: "item",
      label: "Stavka pregleda",
      aiDescription: "Koristi checklist stavku za poravnanje retka sa starim SZOMV zapisnikom. Prepiši samo ako stari zapisnik ima dodatnu ili drugacije imenovanu stavku.",
      aiLookFor: ["stavka pregleda", "vizualni pregled", "hvataljke", "odvodi", "uzemljenje"],
      examples: ["Stanje vodica odvoda", "Stanje mjernih spojeva"],
      confidenceRequired: "low",
    }),
    selected: makeColumnAi({
      key: "selected",
      label: "Odabir / stanje",
      type: "text",
      aiDescription: "Prepiši stanje za checklist stavku: uredno, neuredno, nije primjenjivo, DA/NE ili slican tekst iz starog vizualnog pregleda.",
      aiLookFor: ["odabir", "stanje", "uredno", "neuredno", "nije primjenjivo", "DA", "NE"],
      commonValues: ["uredno", "DA", "NP"],
    }),
    remark: makeColumnAi({
      key: "remark",
      label: "Napomena",
      aiDescription: "Prepiši napomenu uz stavku vizualnog pregleda samo ako postoji.",
      aiLookFor: ["napomena", "primjedba", "opis stanja"],
      fallbackValue: "",
    }),
    pass: makeColumnAi({
      key: "pass",
      label: "ZADOVOLJAVA",
      type: "enum",
      aiDescription: "Prepiši DA/NE za stavku vizualnog pregleda.",
      aiLookFor: ["zadovoljava", "ocjena", "DA", "NE"],
      allowedValues: YES_NO_VALUES,
      commonValues: ["DA"],
      fallbackValue: "DA",
    }),
  }),
  "eiz-visual": Object.freeze({
    item: makeColumnAi({
      key: "item",
      label: "Predmet pregleda",
      aiDescription: "Koristi predmet vizualnog pregleda za poravnanje retka sa starim EIZ.V zapisnikom. Ako stari zapisnik ima istu ili slicnu checklist stavku, povezi ju s ovim retkom.",
      aiLookFor: ["vizualni pregled", "predmet pregleda", "checklista", "EIZ.V", "elektricna instalacija"],
      examples: ["Metoda zastite od elektricnog udara", "Raspolozivost shema", "Funkcionalno ispitivanje"],
      confidenceRequired: "low",
    }),
    pass: makeColumnAi({
      key: "pass",
      label: "ZADOVOLJAVA",
      type: "enum",
      aiDescription: "Prepiši ocjenu DA/NE/NP za odgovarajucu checklist stavku vizualnog pregleda elektricne instalacije.",
      aiLookFor: ["EIZ.V", "vizualni pregled", "zadovoljava", "DA", "NE", "NP"],
      allowedValues: YES_NO_NP_VALUES,
      commonValues: ["DA", "NP"],
      fallbackValue: "DA",
      validationRules: "Ako stari zapisnik za stavku ima NP, vrati NP. Ako ima negativnu primjedbu, vrati NE.",
    }),
  }),
  "eiz-zuds": Object.freeze({
    board: makeColumnAi({
      key: "board",
      label: "Razdjelnik",
      aiDescription: "Prepiši oznaku razdjelnika iz EIZ.ZUDS tablice ili jednopolne sheme.",
      aiLookFor: ["razdjelnik", "RO", "GRO", "ormar", "EIZ.ZUDS", "jednopolna shema"],
      examples: ["RO BS", "GRO", "RO-1"],
      required: true,
    }),
    circuit: makeColumnAi({
      key: "circuit",
      label: "Strujni krug",
      aiDescription: "Prepiši oznaku strujnog kruga ili osiguraca za ZUDS/RCD ispitivanje.",
      aiLookFor: ["strujni krug", "oznaka kruga", "F100", "QF", ...EIZ_RCD_DEVICE_ALIASES],
      examples: ["F100.4", "F140", "QF1", "FID1"],
      required: true,
    }),
    inCurrent: makeColumnAi({
      key: "inCurrent",
      label: "In [A]",
      type: "text",
      unit: "A",
      aiDescription: "Prepiši nazivnu struju zastitnog uredaja za ZUDS/RCD redak.",
      aiLookFor: ["In", "nazivna struja", "A", ...EIZ_RCD_DEVICE_ALIASES, ...EIZ_RCD_RATING_ALIASES],
      examples: ["25", "40", "63"],
      validationRules: "Ako je uredaj zapisan kao 40/30, 40A/30mA ili slicno, u ovu kolonu upisi nazivnu struju u amperima: 40.",
    }),
    idn: makeColumnAi({
      key: "idn",
      label: "I delta n [mA]",
      type: "text",
      unit: "mA",
      aiDescription: "Prepiši nazivnu diferencijalnu struju I delta n za RCD/ZUDS.",
      aiLookFor: ["IΔn", "Idn", "I delta n", "diferencijalna struja", "mA"],
      examples: ["30", "300"],
      validationRules: "Zadrzi vrijednost u mA ako je navedena. Ne pretvaraj ako nisi siguran.",
      ...{
        aiLookFor: ["IÎ”n", "IΔn", "Idn", "I delta n", "diferencijalna struja", "mA", ...EIZ_RCD_DEVICE_ALIASES, ...EIZ_RCD_RATING_ALIASES],
        validationRules: "Zadrzi vrijednost u mA ako je navedena. Ako je uredaj zapisan kao 40/30, 40A/30mA ili slicno, u ovu kolonu upisi 30. Ne pretvaraj ako nisi siguran.",
      },
    }),
    iisk: makeColumnAi({
      key: "iisk",
      label: "Iisk [mA]",
      type: "text",
      unit: "mA",
      aiDescription: "Prepiši izmjerenu struju prorade Iisk iz ZUDS/RCD ispitivanja.",
      aiLookFor: ["Iisk", "struja prorade", "mA", "RCD test", ...EIZ_RCD_DEVICE_ALIASES],
      examples: ["23", "78", "210"],
    }),
    tisk: makeColumnAi({
      key: "tisk",
      label: "tisk [ms]",
      type: "text",
      unit: "ms",
      aiDescription: "Prepiši izmjereno vrijeme prorade tisk u milisekundama.",
      aiLookFor: ["tisk", "vrijeme prorade", "ms", "RCD test", ...EIZ_RCD_DEVICE_ALIASES],
      examples: ["18", "24", "156"],
    }),
    u0: makeColumnAi({
      key: "u0",
      label: "U0 [V]",
      type: "text",
      unit: "V",
      aiDescription: "Prepiši dodirni napon ili U0 vrijednost/granicu za ZUDS ispitivanje ako postoji.",
      aiLookFor: ["U0", "Uo", "dodirni napon", "V", "<50"],
      examples: ["<50", "230"],
      fallbackValue: "<50",
    }),
    pass: makeColumnAi({
      key: "pass",
      label: "Iisk < I delta n / tisk < tdoz",
      type: "enum",
      aiDescription: "Prepiši DA/NE iz ZUDS tablice. Ako nije izricito navedeno, predlozi samo ako su Iisk i tisk jasno u dopustenim granicama.",
      aiLookFor: ["zadovoljava", "Iisk < IΔn", "tisk", "DA", "NE"],
      allowedValues: YES_NO_VALUES,
      commonValues: ["DA"],
      fallbackValue: "DA",
    }),
  }),
  "eiz-ipk": Object.freeze({
    place: makeColumnAi({
      key: "place",
      label: "Mjerno mjesto",
      aiDescription: "Prepiši mjerno mjesto impedancije petlje kvara iz EIZ.IPK tablice ili iz jednopolne sheme ako je jasno povezano s krugom.",
      aiLookFor: ["EIZ.IPK", "impedancija petlje kvara", "mjerno mjesto", "uticnica", "razdjelnik"],
      examples: ["Uticnica 230 V", "Rasvjeta", "RO BS"],
      required: true,
    }),
    circuit: makeColumnAi({
      key: "circuit",
      label: "Oznaka strujnog kruga",
      aiDescription: "Prepiši oznaku strujnog kruga za mjerno mjesto impedancije petlje kvara.",
      aiLookFor: ["oznaka strujnog kruga", "strujni krug", "F", "QF", "jednopolna shema"],
      examples: ["F1", "F100.4", "-"],
    }),
    protectionType: makeColumnAi({
      key: "protectionType",
      label: "Tip i karakteristika zastitnog uredaja",
      aiDescription: "Prepiši tip i karakteristiku zastitnog uredaja za redak IPK: osigurac, automatski osigurac, RCD/ZUDS ili vrijednost iz sheme.",
      aiLookFor: ["tip zastitnog uredaja", "karakteristika", "B16", "C16", ...EIZ_RCD_DEVICE_ALIASES, ...EIZ_RCD_RATING_ALIASES, "osigurac"],
      examples: ["RCD 40/0,03", "FID 40/30", "Kombinacijska sklopka 40A/30mA", "B16", "C16"],
    }),
    idnIa: makeColumnAi({
      key: "idnIa",
      label: "I delta n / Ia [A]",
      type: "text",
      unit: "A",
      aiDescription: "Prepiši vrijednost I delta n ili Ia za IPK iz starog zapisnika ili sheme.",
      aiLookFor: ["IΔn", "Idn", "Ia", "A", "IPK"],
      examples: ["0.03", "0,3", "80"],
      ...{
        aiLookFor: ["IÎ”n", "IΔn", "Idn", "Ia", "A", "IPK", ...EIZ_RCD_DEVICE_ALIASES, ...EIZ_RCD_RATING_ALIASES],
        examples: ["0.03", "0,3", "80", "30 mA"],
        validationRules: "Ako se iz sheme vidi FID/ZUDS 40/30, I delta n je 0.03 A odnosno 30 mA; za IPK zadrzi format koji odgovara tablici.",
      },
    }),
    td: makeColumnAi({
      key: "td",
      label: "td [s]",
      type: "text",
      unit: "s",
      aiDescription: "Prepiši dopusteno vrijeme isklopa td.",
      aiLookFor: ["td", "dopusteno vrijeme", "s", "0.4"],
      examples: ["0.4", "0,4", "5"],
      fallbackValue: "0.4",
    }),
    zLpe: makeColumnAi({
      key: "zLpe",
      label: "Z(L-PE) [ohm]",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši izmjerenu impedanciju petlje kvara Z(L-PE).",
      aiLookFor: ["Z(L-PE)", "Z L-PE", "petlja kvara", "impedancija", "ohm"],
      examples: ["1,42", "0.88"],
    }),
    izem: makeColumnAi({
      key: "izem",
      label: "Izem [A]",
      type: "text",
      unit: "A",
      aiDescription: "Prepiši izracunatu ili izmjerenu struju zemljospoja Izem ako postoji.",
      aiLookFor: ["Izem", "struja zemljospoja", "A"],
      examples: ["158", "235,5"],
    }),
    zLn: makeColumnAi({
      key: "zLn",
      label: "Z(L-N) [ohm]",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši impedanciju Z(L-N) ako postoji.",
      aiLookFor: ["Z(L-N)", "Z L-N", "ohm"],
      examples: ["0,55", "0.63"],
    }),
    zLl: makeColumnAi({
      key: "zLl",
      label: "Z(L-L) [ohm]",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši impedanciju Z(L-L) ako postoji. Ako stari zapisnik ima crticu, prepiši crticu.",
      aiLookFor: ["Z(L-L)", "Z L-L", "ohm"],
      examples: ["-", "0,44"],
      fallbackValue: "-",
    }),
    u0: makeColumnAi({
      key: "u0",
      label: "Uo [V]",
      type: "text",
      unit: "V",
      aiDescription: "Prepiši Uo ili dodirni napon za IPK redak ako postoji.",
      aiLookFor: ["Uo", "U0", "dodirni napon", "V"],
      examples: ["50", "230"],
    }),
    pass: makeColumnAi({
      key: "pass",
      label: "ZADOVOLJAVA",
      type: "enum",
      aiDescription: "Prepiši DA/NE za IPK redak. Ako postoji formula u predlosku, AI smije predloziti, ali ne smije tvrditi DA kad stari zapisnik ima NE.",
      aiLookFor: ["zadovoljava", "ocjena", "DA", "NE"],
      allowedValues: YES_NO_VALUES,
      commonValues: ["DA"],
      fallbackValue: "DA",
    }),
  }),
  "eiz-oi": Object.freeze({
    circuit: makeColumnAi({
      key: "circuit",
      label: "Oznaka strujnog kruga",
      aiDescription: "Prepiši oznaku strujnog kruga iz EIZ.OI tablice ili jednopolne sheme.",
      aiLookFor: ["EIZ.OI", "otpor izolacije", "strujni krug", "oznaka kruga", "jednopolna shema"],
      examples: ["F1", "Strujni krug 1", "RO BS"],
      required: true,
    }),
    conductor: makeColumnAi({
      key: "conductor",
      label: "Vrsta vodica",
      aiDescription: "Prepiši vrstu vodica ako je navedena u OI tablici ili shemi.",
      aiLookFor: ["vrsta vodica", "vodic", "kabel", "Cu", "Al"],
      examples: ["Cu", "PP-Y", "NYM"],
    }),
    l123: makeColumnAi({
      key: "l123",
      label: "Riso L1-L2-L3 [Mohm]",
      type: "text",
      unit: "Mohm",
      aiDescription: "Prepiši izmjereni otpor izolacije izmedju faza L1-L2-L3.",
      aiLookFor: ["Riso L1-L2-L3", "L1-L2-L3", "MOhm", "Mohm"],
      examples: [">30", "200", "50"],
    }),
    l123n: makeColumnAi({
      key: "l123n",
      label: "Riso L1-L2-L3-N [Mohm]",
      type: "text",
      unit: "Mohm",
      aiDescription: "Prepiši izmjereni otpor izolacije L1-L2-L3-N.",
      aiLookFor: ["Riso L1-L2-L3-N", "L1-L2-L3-N", "MOhm", "Mohm"],
      examples: [">30", "200"],
    }),
    l123pe: makeColumnAi({
      key: "l123pe",
      label: "Riso L1-L2-L3-PE [Mohm]",
      type: "text",
      unit: "Mohm",
      aiDescription: "Prepiši izmjereni otpor izolacije L1-L2-L3-PE.",
      aiLookFor: ["Riso L1-L2-L3-PE", "L1-L2-L3-PE", "PE", "MOhm"],
      examples: [">30", "200"],
    }),
    npe: makeColumnAi({
      key: "npe",
      label: "Riso N-PE [Mohm]",
      type: "text",
      unit: "Mohm",
      aiDescription: "Prepiši izmjereni otpor izolacije N-PE.",
      aiLookFor: ["Riso N-PE", "N-PE", "MOhm", "Mohm"],
      examples: [">30", "200"],
    }),
    rd: makeColumnAi({
      key: "rd",
      label: "Doz. otpor izolacije Rd [Mohm]",
      type: "text",
      unit: "Mohm",
      aiDescription: "Prepiši dopusteni otpor izolacije Rd.",
      aiLookFor: ["Rd", "doz. otpor izolacije", "dopusteni otpor", "MOhm"],
      examples: [">1", "1"],
      fallbackValue: ">1",
    }),
    pass: makeColumnAi({
      key: "pass",
      label: "Riso > Rd",
      type: "enum",
      aiDescription: "Prepiši DA/NE za otpor izolacije ili zakljuci samo ako su Riso i Rd jasno usporedivi.",
      aiLookFor: ["Riso > Rd", "zadovoljava", "DA", "NE"],
      allowedValues: YES_NO_VALUES,
      commonValues: ["DA"],
      fallbackValue: "DA",
    }),
  }),
  "eiz-k": Object.freeze({
    place1: makeColumnAi({
      key: "place1",
      label: "Mjerno mjesto 1",
      aiDescription: "Prepiši prvo mjerno mjesto za kontinuitet zastitnog vodica ili vodica za izjednacavanje potencijala.",
      aiLookFor: ["EIZ.K", "kontinuitet", "PE sabirnica", "mjerno mjesto 1", "zastitni vodic"],
      examples: ["PE sabirnica GRO", "PE sabirnica RO"],
      required: true,
    }),
    place2: makeColumnAi({
      key: "place2",
      label: "Mjerno mjesto 2",
      aiDescription: "Prepiši drugo mjerno mjesto/par za kontinuitet zastitnog vodica.",
      aiLookFor: ["mjerno mjesto 2", "uzemljivac", "metalna masa", "vodovodna instalacija", "agregat"],
      examples: ["Uzemljivac objekta", "Agregati za istakanje goriva", "Vodovodna instalacija"],
      required: true,
    }),
    testCurrent: makeColumnAi({
      key: "testCurrent",
      label: "Ispitna struja [A]",
      type: "text",
      unit: "A",
      aiDescription: "Prepiši ispitnu struju za kontinuitet ako je navedena.",
      aiLookFor: ["ispitna struja", "A", "kontinuitet"],
      examples: ["0,2", "0.2"],
      fallbackValue: "0,2",
    }),
    measuredResistance: makeColumnAi({
      key: "measuredResistance",
      label: "Izmjereni otpor [ohm]",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši izmjereni otpor kontinuiteta.",
      aiLookFor: ["izmjereni otpor", "kontinuitet", "ohm", "<1"],
      examples: ["<1", "0,12"],
    }),
    allowedResistance: makeColumnAi({
      key: "allowedResistance",
      label: "Doz. otpor [ohm]",
      type: "text",
      unit: "ohm",
      aiDescription: "Prepiši dopusteni otpor kontinuiteta.",
      aiLookFor: ["doz. otpor", "dopusteni otpor", "ohm"],
      examples: ["<1"],
      fallbackValue: "<1",
    }),
    pass: makeColumnAi({
      key: "pass",
      label: "Zadovoljava",
      type: "enum",
      aiDescription: "Prepiši DA/NE za kontinuitet zastitnog vodica.",
      aiLookFor: ["zadovoljava", "kontinuitet", "DA", "NE"],
      allowedValues: YES_NO_VALUES,
      commonValues: ["DA"],
      fallbackValue: "DA",
    }),
    note: makeColumnAi({
      key: "note",
      label: "Napomena",
      aiDescription: "Prepiši napomenu uz mjerenje kontinuiteta samo ako postoji. Ako je u starom zapisniku crtica, prepiši crticu.",
      aiLookFor: ["napomena", "primjedba", "kontinuitet"],
      examples: ["-", "Provjeriti spoj"],
      fallbackValue: "-",
    }),
  }),
  "ves-exercise": Object.freeze({
    assemblyPoint: makeColumnAi({
      key: "assemblyPoint",
      label: "Zborno mjesto",
      aiDescription: "Prepiši zborno mjesto iz starog zapisnika vjezbe evakuacije.",
      aiLookFor: ["zborno mjesto", "evakuacija", "spasavanje"],
      examples: ["Zborno mjesto ispred objekta"],
    }),
    personCount: makeColumnAi({
      key: "personCount",
      label: "Broj osoba",
      type: "number",
      aiDescription: "Prepiši broj osoba koje su sudjelovale u vjezbi.",
      aiLookFor: ["broj osoba", "sudionici", "evakuirano"],
      examples: ["12", "25"],
    }),
    evacuationTime: makeColumnAi({
      key: "evacuationTime",
      label: "Vrijeme napustanja objekta [sek]",
      type: "text",
      unit: "sek",
      aiDescription: "Prepiši vrijeme napustanja objekta u sekundama ili onako kako je navedeno.",
      aiLookFor: ["vrijeme napustanja", "vrijeme evakuacije", "sek"],
      examples: ["120", "2 min"],
    }),
    note: makeColumnAi({
      key: "note",
      label: "Napomena",
      aiDescription: "Prepiši napomenu o tijeku vjezbe ako postoji.",
      aiLookFor: ["napomena", "tijek vjezbe", "primjedba"],
    }),
  }),
});

const DOCUMENTATION_FORMULA_RESULT_COLUMN_IDS_BY_TABLE = Object.freeze({
  "eiz-zuds": new Set(["iisk", "tisk", "u0", "pass"]),
  "eiz-ipk": new Set(["td", "zLpe", "izem", "zLn", "zLl", "u0", "pass"]),
  "eiz-oi": new Set(["l123", "l123n", "l123pe", "npe", "rd", "pass"]),
  "eiz-k": new Set(["testCurrent", "measuredResistance", "allowedResistance", "pass", "note"]),
});

function isDocumentationFormulaResultAiColumn(tableId = "", columnId = "") {
  const blockedColumns = DOCUMENTATION_FORMULA_RESULT_COLUMN_IDS_BY_TABLE[String(tableId || "")];
  return Boolean(blockedColumns?.has(String(columnId || "")));
}

function getDocumentationColumnAiMapping(tableId = "", columnId = "") {
  if (isDocumentationFormulaResultAiColumn(tableId, columnId)) {
    return null;
  }
  const normalizedTableId = String(tableId || "") === "spr-cista-results" ? "spr-results" : tableId;
  return DOCUMENTATION_COLUMN_AI_BY_TABLE[normalizedTableId]?.[columnId] || null;
}

function getGenericDocumentationColumnAiMapping(tableId = "", column = {}) {
  const columnId = String(column?.id || "").trim();
  const label = String(column?.label || columnId || "").trim();
  if (!columnId || !label || ["number", "separator"].includes(columnId)) {
    return null;
  }
  const normalizedLabel = label.toLowerCase();
  const isDecisionColumn = normalizedLabel.includes("zadovoljava")
    || normalizedLabel.includes("da/ne")
    || normalizedLabel.includes("ocjena")
    || normalizedLabel.includes("ispravnost")
    || normalizedLabel.includes("funkcionalnost")
    || normalizedLabel.includes("zakljucak");
  return makeColumnAi({
    key: columnId,
    label,
    type: isDecisionColumn ? "enum" : "text",
    aiDescription: `Prepiši ili predloži vrijednost za kolonu "${label}" u tablici ${tableId}. Koristi prethodni zapisnik iste usluge, stariji zapisnik ili uploadani izvor; ako podatak nije jasan, ostavi postojeću vrijednost ili prazno.`,
    aiLookFor: [label, columnId],
    allowedValues: isDecisionColumn ? YES_NO_NP_VALUES : [],
    commonValues: isDecisionColumn ? ["DA", "ZADOVOLJAVA"] : [],
    fallbackValue: isDecisionColumn ? "DA" : "",
    validationRules: isDecisionColumn
      ? "Vrati DA, NE ili NP samo ako je to jasno iz izvora ili mjernih vrijednosti."
      : "Ne izmišljaj podatke i ne miješaj tablice drugih usluga.",
    confidenceRequired: "medium",
  });
}

function withDocumentationColumnAiMapping(tableId = "", column = {}) {
  const aiMapping = getDocumentationColumnAiMapping(tableId, column?.id);
  const genericAiMapping = aiMapping || getGenericDocumentationColumnAiMapping(tableId, column);
  return genericAiMapping ? { ...column, aiMapping: { ...genericAiMapping } } : { ...column };
}

function withDocumentationTechnicalFieldAi(serviceCode = "", field = {}) {
  const normalizedService = normalizeCode(serviceCode);
  const ai = DOCUMENTATION_TECHNICAL_AI_BY_SERVICE[normalizedService]?.[field?.id]
    || DOCUMENTATION_TECHNICAL_AI_BY_SERVICE[normalizedService]?.[field?.key]
    || null;
  if (ai) {
    return { ...field, ai: { ...ai } };
  }
  const label = String(field?.label || field?.id || field?.key || "Tehnicki podatak").trim();
  return {
    ...field,
    ai: makeTechnicalAi({
      key: `technical-${field?.id || field?.key || slugify(label)}`,
      label,
      defaultValue: field?.defaultValue || "",
      aiDescription: `Pronadji podatak "${label}" za uslugu ${normalizedService}. Prvo koristi prethodni zapisnik iste usluge i iste lokacije/objekta, zatim stariji prethodni zapisnik, a tek onda template vrijednost.`,
      aiLookFor: [label, normalizedService],
      fallbackValue: field?.defaultValue || "",
    }),
  };
}

function getSpreadsheetColumnLabel(index = 0) {
  let value = Number(index) + 1;
  let label = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label || "A";
}

function rowsFromItems(columns, items, pass = "DA") {
  return items.map((item, index) => makeRow(columns, {
    item,
    pass: Array.isArray(pass) ? (pass[index] || "DA") : pass,
  }, index));
}

function makeAssessmentEntries(serviceCode = "", labels = []) {
  const code = slugify(serviceCode || "service");
  return labels.map((label, index) => ({
    id: `${code}-assessment-${index + 1}`,
    label,
    enabledFieldId: "",
  }));
}

function getCistaColumnWidth(label = "", index = 0, count = 1) {
  const text = String(label || "");
  const base = Math.max(74, Math.min(260, (text.length * 7) + 28));
  if (index === 0 && /^(r\.?\s*br|redni|broj)$/i.test(text.trim())) {
    return 66;
  }
  if (count >= 10) {
    return Math.max(70, Math.min(base, 148));
  }
  if (count >= 7) {
    return Math.max(82, Math.min(base, 190));
  }
  return base;
}

function makeCistaColumns(labels = []) {
  const safeLabels = labels.map((label) => String(label || "").trim()).filter(Boolean);
  return safeLabels.map((label, index) => makeColumn(
    `c${index + 1}`,
    label,
    getCistaColumnWidth(label, index, safeLabels.length),
    "",
  ));
}

function isCistaDecisionColumn(label = "") {
  const normalized = String(label || "").toLowerCase();
  return normalized.includes("da/ne")
    || normalized.includes("zadovoljava")
    || normalized.includes("ocjena")
    || normalized.includes("ispravnost")
    || normalized.includes("funkcionalnost")
    || normalized.includes("zaključak")
    || normalized.includes("zakljucak");
}

function makeCistaSeedRows(columns = [], count = DEFAULT_ROW_COUNT) {
  const shouldNumberFirstColumn = columns[0] && /^(r\.?\s*br|redni|broj)/i.test(columns[0].label || "");
  return Array.from({ length: count }, (_, index) => {
    const values = {};
    columns.forEach((column, columnIndex) => {
      if (columnIndex === 0 && shouldNumberFirstColumn) {
        values[column.id] = String(index + 1);
      } else if (isCistaDecisionColumn(column.label)) {
        values[column.id] = "DA";
      }
    });
    return makeRow(columns, values, index);
  });
}

function makeCistaRows(columns = [], rows = []) {
  return rows.map((row, index) => {
    if (typeof row === "string") {
      const values = {
        [columns[0]?.id || "c1"]: row,
      };
      columns.forEach((column, columnIndex) => {
        if (columnIndex > 0 && isCistaDecisionColumn(column.label)) {
          values[column.id] = "DA";
        }
      });
      return makeRow(columns, values, index);
    }
    const cells = Array.isArray(row) ? row : [];
    return makeRow(columns, Object.fromEntries(columns.map((column, columnIndex) => [
      column.id,
      cells[columnIndex] ?? "",
    ])), index);
  });
}

function makeCistaFormulaRows(columns = [], count = DEFAULT_ROW_COUNT, buildValues = () => ({})) {
  return Array.from({ length: count }, (_, index) => {
    const rowNumber = index + 1;
    return makeRow(columns, {
      [columns[0]?.id || "c1"]: String(rowNumber),
      ...buildValues(rowNumber, index),
    }, index);
  });
}

function cistaTableSpec({
  id,
  label,
  summary = "",
  columns = [],
  rows = null,
  rowCount = DEFAULT_ROW_COUNT,
  pageOrientation = "",
  assessmentLabel = "",
  chapterTitle = "",
  sourceSheet = "",
  formulaOnly = false,
  includeInReport = true,
  rowBuilder = null,
} = {}) {
  const cistaColumns = makeCistaColumns(columns);
  return tableSpec({
    id,
    label,
    summary: summary || label,
    columns: cistaColumns,
    rows: Array.isArray(rows)
      ? makeCistaRows(cistaColumns, rows)
      : (typeof rowBuilder === "function"
        ? makeCistaFormulaRows(cistaColumns, rowCount, rowBuilder)
        : makeCistaSeedRows(cistaColumns, rowCount)),
    assessmentLabel,
    chapterTitle,
    pageOrientation: pageOrientation || (cistaColumns.length >= 8 ? "landscape" : "portrait"),
    sourceSheet,
    formulaOnly,
    includeInReport,
  });
}

const CISTA_NATIVE_TABLE_BLUEPRINTS = Object.freeze({
  SPR: [
    {
      id: "spr-results",
      label: "Mjerna mjesta sigurnosne protupanicne rasvjete",
      summary: "Tablica 1. - mjerna mjesta sigurnosne protupanicne rasvjete",
      sourceSheet: "SPR1.2",
      columns: ["R. br.", "Mjesto ispitivanja", "Broj lampi", "Ei [lux]", "Eimin [lux]", "ZADOVOLJAVA DA/NE"],
      rows: [
        ["1", "Prodajni prostor", "5", ">2", "1", "DA"],
        ["2", "Prostor za pusace", "1", ">2", "1", "DA"],
        ["3", "Sanitarni prostor M", "1", ">2", "1", "DA"],
        ["4", "Sanitarni prostor Z", "1", ">2", "1", "DA"],
        ["5", "Predprostor WC", "1", ">2", "1", "DA"],
        ["6", "Hodnik", "2", ">2", "1", "DA"],
      ],
    },
  ],
  TZIN: [
    {
      id: "tzin-cista-buttons",
      label: "Mjerna mjesta tipkala za isklop",
      summary: "Tablica 1. - mjerna mjesta tipkala za iskljucenje elektricne energije u slucaju nuzde",
      sourceSheet: "TZIN1.2",
      columns: ["R. br.", "Mjesto ispitivanja", "Broj tipkala", "Tip tipkala", "ZADOVOLJAVA DA/NE"],
      rows: [
        ["1", "Rasvjetni stup UNP", "1", "-", "DA"],
        ["2", "Rasvjetni stup ulaz", "1", "-", "DA"],
        ["3", "Ulaz za zaposlenike", "1", "-", "DA"],
        ["4", "Rasvjetni stup izlaz", "1", "-", "DA"],
      ],
    },
  ],
  VES: [
    {
      id: "ves-cista-exercise",
      label: "Podaci o vjezbi evakuacije",
      summary: "Zborno mjesto, broj osoba, vrijeme napustanja objekta i opis tijeka vjezbe",
      sourceSheet: "VES1.1",
      columns: ["Zborno mjesto", "Broj osoba", "Vrijeme napustanja objekta [sek]", "Opis tijeka vjezbe", "Napomena"],
      rows: [["", "", "", "Prakticna vjezba evakuacije provedena je prema planu evakuacije i spasavanja.", ""]],
    },
  ],
  SZOM: [
    {
      id: "szom-cista-measurements",
      label: "Mjerenje sustava zastite od djelovanja munje",
      summary: "Tablica 1. - rezultati mjerenja sustava zastite od djelovanja munje",
      sourceSheet: "SZOM1.2",
      columns: ["R.br.", "Mjerno mjesto", "Riz", "Rdop", "Skriveni spojevi", "Riz2", "Rdop2", "Elektricna povezanost metalnih masa", "Riz3", "Rdop3", "ZADOVOLJAVA"],
      rowCount: 24,
      rowBuilder: (rowNumber, index) => ({
        c2: SZOM_CISTA_PLACES[index] || "",
        c3: `=IF(B${rowNumber}="","",RANDBETWEEN(200,380)/100)`,
        c4: "<10",
        c6: `=IF(E${rowNumber}="","",RANDBETWEEN(40,85)/100)`,
        c7: `=IF(E${rowNumber}="","","<1")`,
        c9: `=IF(H${rowNumber}="","",RANDBETWEEN(40,135)/100)`,
        c10: `=IF(H${rowNumber}="","","<2")`,
        c11: "DA",
      }),
      pageOrientation: "landscape",
    },
  ],
  EMM: [
    {
      id: "emm-cista-metal-bonding",
      label: "Mjerenje kontinuiteta PE vodica i metalnih masa",
      summary: "IL - EMM",
      sourceSheet: "EMM1.2",
      columns: ["R.br.", "Ispitno mjesto 1", "Ispitno mjesto 2", "Iisp [A]", "Rizm [ohm]", "R [ohm]", "Rizm ~ R DA/NE"],
      rowCount: 12,
      pageOrientation: "landscape",
    },
  ],
  VS: [
    {
      id: "vs-cista-ventilation",
      label: "Ventilacija prostora",
      summary: "Tablica 1. - rezultati ispitivanja ventilacije",
      sourceSheet: "VS1.2",
      columns: ["Prostor", "Efektivni volumen", "Vrsta otvora", "Povrsina otvora", "Brzina strujanja", "Protok", "Volumni protok", "Potrebni protok", "Broj izmjena", "Trazeni broj izmjena", "Podtlak / Nadtlak", "Zadovoljava"],
      rowCount: 8,
      pageOrientation: "landscape",
    },
  ],
  PPCAFFE: [
    {
      id: "ppcaffe-cista-criteria",
      label: "Uvjeti prostora za pusace - caffe bar",
      summary: "Checklist uvjeta prostora za pusace",
      sourceSheet: "PPCAFFE1.1",
      columns: ["Stavka", "ZADOVOLJAVA DA/NE"],
      rows: [
        ["Ventilacijski sustav omogucuje dovoljan broj izmjena zraka na sat", "DA"],
        ["Opremljenost prostora sredstvima promidzbe spoznaje o stetnosti uporabe duhanskih proizvoda", "DA"],
        ["Ukupna povrsina objekta ne prelazi 50,00 m2", "DA"],
      ],
    },
    {
      id: "ppcaffe-cista-ventilation",
      label: "Ventilacija caffe bara",
      summary: "Tablica 1. - ventilacija caffe bara",
      sourceSheet: "PPCAFFE1.2",
      columns: ["Prostor", "Efektivni volumen", "Vrsta otvora", "Povrsina otvora", "Brzina strujanja", "Protok", "Volumni protok", "Potrebni protok", "Broj izmjena", "Trazeni broj izmjena", "Podtlak / Nadtlak", "Zadovoljava"],
      rowCount: 8,
      pageOrientation: "landscape",
    },
  ],
  PZP: [
    {
      id: "pzp-cista-criteria",
      label: "Uvjeti prostora za pusace",
      summary: "Checklist prostora za pusace",
      sourceSheet: "PZP1.1",
      columns: ["Stavka", "ZADOVOLJAVA DA/NE"],
      rows: [
        ["Povrsina prostora nije manja od 10 m2", "DA"],
        ["Moguc protok zraka oneciscenog duhanskim dimom u drugi prostor", "DA"],
        ["Prostor ne zauzima vise od 20% ukupne povrsine javnog prostora", "DA"],
        ["Osiguran podtlak od najmanje 5 Pa i uredaj za mjerenje podtlaka", "DA"],
        ["Osigurana dodatna kolicina zraka od 30 l/s po osobi", "DA"],
      ],
    },
    {
      id: "pzp-cista-ventilation",
      label: "Ventilacija prostora za pusace",
      summary: "Tablica 1. - ventilacija prostora za pusace",
      sourceSheet: "PZP1.2",
      columns: ["Prostor", "Efektivni volumen", "Vrsta otvora", "Povrsina otvora", "Brzina strujanja", "Protok", "Volumni protok", "Potrebni protok", "Broj izmjena", "Trazeni broj izmjena", "Podtlak / Nadtlak", "Zadovoljava"],
      rowCount: 8,
      pageOrientation: "landscape",
    },
  ],
  EXEI: [
    {
      id: "exei-cista-ipk",
      label: "Mjerenje impedancije petlje kvara",
      summary: "ZOI-10-07",
      sourceSheet: "ExEi1.2",
      columns: ["Oznaka strujnog kruga / el. uredaja", "1x/3x", "Tip i karakteristika", "Ia osigurac [A]", "Ia magnetski [A]", "td [s]", "Z(L-PE) [ohm]", "Izem [A]", "Z(L-N) [ohm]", "Ik1min [A]", "Z(L-L) [ohm]", "Ik2min [A]", "U0 [V]", "Ikmin >= 3/2xIa", "Zadovoljava DA/NE"],
      rowCount: 12,
      rowBuilder: (rowNumber) => ({
        c5: `=IFERROR(VLOOKUP(C${rowNumber},ExPodaci!A1:B24,2,FALSE),"")`,
        c6: `=IF(A${rowNumber}="","",0.1)`,
        c7: `=IF(A${rowNumber}="","",IF(B${rowNumber}="3x",RANDBETWEEN(75,85)*K${rowNumber}/100,RANDBETWEEN(75,85)*I${rowNumber}/100))`,
        c8: `=IF(A${rowNumber}="","",(RANDBETWEEN(224.25,235.75))/G${rowNumber})`,
        c9: `=IF(A${rowNumber}="","",IF(B${rowNumber}="3x","-",RANDBETWEEN(95,105)/100))`,
        c10: `=IF(A${rowNumber}="","",IFERROR((RANDBETWEEN(224.25,235.75))/I${rowNumber},"-"))`,
        c11: `=IF(A${rowNumber}="","",IF(B${rowNumber}="3x",RANDBETWEEN(115,125)/100,"-"))`,
        c12: `=IF(A${rowNumber}="","",IFERROR(RANDBETWEEN(390,410)/K${rowNumber},"-"))`,
        c13: `=IF(A${rowNumber}="","",IF(B${rowNumber}="3x",CONCATENATE(RANDBETWEEN(406,408),"/",RANDBETWEEN(236,238)),RANDBETWEEN(236,238)))`,
        c14: `=IF(A${rowNumber}="","",IF(B${rowNumber}="3x",IF(AND(H${rowNumber}>=E${rowNumber}*1.5,L${rowNumber}>=E${rowNumber}*1.5),"DA","NE"),IF(AND(H${rowNumber}>=E${rowNumber}*1.5,J${rowNumber}>=E${rowNumber}*1.5),"DA","NE")))`,
        c15: `=N${rowNumber}`,
      }),
      pageOrientation: "landscape",
    },
    {
      id: "exei-cista-oi",
      label: "Mjerenje otpora izolacije vodova",
      summary: "ZOI-10-03",
      sourceSheet: "ExEi1.3",
      columns: ["R.br.", "Oznaka strujnog kruga", "Riso L1-L2-L3 [Mohm]", "Riso L1-L2-L3-N [Mohm]", "Riso L1-L2-L3-PE [Mohm]", "Riso N-PE [Mohm]", "Min. doz. otpor izolacije Rd [Mohm]", "Riso > Rd DA/NE"],
      rowCount: 10,
      rowBuilder: (rowNumber) => ({
        c1: `=IF(B${rowNumber}="","",ROW(B${rowNumber}))`,
        c2: `=IF(ExEi1.2!A${rowNumber}="","",ExEi1.2!A${rowNumber})`,
        c3: `=IF(B${rowNumber}="","",IF(ExEi1.2!B${rowNumber}="3x",">100","-"))`,
        c4: `=IF(B${rowNumber}="","",IF(ExEi1.2!B${rowNumber}="3x","-",">100"))`,
        c5: `=IF(B${rowNumber}="","",">100")`,
        c6: `=IF(B${rowNumber}="","",IF(ExEi1.2!B${rowNumber}="3x","-",">100"))`,
        c7: `=IF(B${rowNumber}="","",1)`,
        c8: `=IF(B${rowNumber}="","","DA")`,
      }),
      pageOrientation: "landscape",
    },
    {
      id: "exei-cista-zuds",
      label: "Provjera zastitnih uredaja diferencijalne struje",
      summary: "ZOI-10-08",
      sourceSheet: "ExEi1.4",
      columns: ["Redni broj", "Razmak 1", "Razdjelnik", "Razmak 2", "Razmak 3", "Strujni krug", "Razmak 4", "In [A]", "/", "I Delta n [mA]", "Iisk [mA]", "Razmak 5", "tisk [ms]", "Razmak 6", "U0 [V]", "Razmak 7", "Iisk < I Delta n / tisk < tdoz DA/NE"],
      rowCount: 8,
      rowBuilder: (rowNumber) => ({
        c1: `=IF(H${rowNumber}="","",ROW(H${rowNumber}))`,
        c9: `=IF(H${rowNumber}="","","/")`,
        c11: `=IF(J${rowNumber}="","",RANDBETWEEN(72,82)*J${rowNumber}/100)`,
        c13: `=IF(J${rowNumber}="","",RANDBETWEEN(14,24))`,
        c15: `=IF(J${rowNumber}="","",RANDBETWEEN(236,238))`,
        c17: `=IF(J${rowNumber}="","","DA")`,
      }),
      pageOrientation: "landscape",
    },
    {
      id: "exei-cista-pe-ipk",
      label: "Kontinuitet dodatnog vanjskog PE vodica - IPK",
      summary: "ZOI-10-06",
      sourceSheet: "ExEi1.5",
      columns: ["Red. broj", "Razmak 1", "Mjerno mjesto / oznaka", "SPE / SPEd", "Z(L-PE)", "Z(L-PE1)", "Razmak 2", "Razmak 3", "Z(L-PE2)", "Razmak 4", "Razmak 5", "Z(L-PE1) ~ Z(L-PE)", "Razmak 6", "Z(L-PE2) ~ Z(L-PE)", "Razmak 7", "Ocjena DA/NE"],
      rowCount: 8,
      rowBuilder: (rowNumber) => ({
        c1: `=IF(C${rowNumber}="","",ROW(C${rowNumber}))`,
        c3: `=IF(ExEi1.2!A${rowNumber}="","",ExEi1.2!A${rowNumber})`,
        c4: `=IF(C${rowNumber}="","","2,5/>4")`,
        c5: `=IF(ExEi1.2!G${rowNumber}="","",ExEi1.2!G${rowNumber})`,
        c6: `=IF(C${rowNumber}="","",RANDBETWEEN(102,106)*E${rowNumber}/100)`,
        c9: `=IF(C${rowNumber}="","",RANDBETWEEN(98,102)*F${rowNumber}/100)`,
        c12: `=IF(C${rowNumber}="","","DA")`,
        c14: `=IF(C${rowNumber}="","","DA")`,
        c16: `=IF(C${rowNumber}="","","DA")`,
      }),
      pageOrientation: "landscape",
    },
    {
      id: "exei-cista-pe-direct",
      label: "Kontinuitet PE vodica i metalnih masa - izravno mjerenje",
      summary: "ZOI-10-05",
      sourceSheet: "ExEi1.6",
      columns: ["Redni broj", "S [mm2]", "Razmak 1", "Razmak 2", "Razmak 3", "Ispitno mjesto 1", "Ispitno mjesto 2", "Iisp [A]", "Razmak 4", "Razmak 5", "Rizm [ohm]", "Razmak 6", "Razmak 7", "Rocek [ohm]", "Razmak 8", "Rizm ~ Rocek DA/NE"],
      rowCount: 10,
      rowBuilder: (rowNumber) => ({
        c1: `=IF(F${rowNumber}="","",ROW(F${rowNumber}))`,
        c2: `=IF(F${rowNumber}="","",">4")`,
        c8: `=IF(F${rowNumber}="","",0.2)`,
        c11: `=IF(F${rowNumber}="","","<1")`,
        c14: `=IF(F${rowNumber}="","","<1")`,
        c16: `=IF(F${rowNumber}="","","DA")`,
      }),
      pageOrientation: "landscape",
    },
    {
      id: "exei-cista-motors",
      label: "Mjerenje elektromotora",
      summary: "ZOI-10-14",
      sourceSheet: "ExEi1.7",
      columns: ["Mjerni uredaj / tvornicki broj agregata", "Proizvodac / tip", "Tvornicki broj motora", "Vrsta zastite / certifikat", "In [A]", "I L1", "I L2", "I L3", "R1", "R2", "R3", "Riso PE-1", "Riso PE-2", "Riso PE-3", "Ocjena DA/NE"],
      rowCount: 6,
      rowBuilder: (rowNumber) => ({
        c5: `=IFERROR(VLOOKUP(B${rowNumber},ExPodaci!D1:I24,2,FALSE),"")`,
        c6: `=IFERROR(RANDBETWEEN(VLOOKUP(B${rowNumber},ExPodaci!D1:I24,3,FALSE)*100,VLOOKUP(B${rowNumber},ExPodaci!D1:I24,4,FALSE)*100)/100,"")`,
        c7: `=IFERROR(RANDBETWEEN(VLOOKUP(B${rowNumber},ExPodaci!D1:I24,3,FALSE)*100,VLOOKUP(B${rowNumber},ExPodaci!D1:I24,4,FALSE)*100)/100,"")`,
        c8: `=IFERROR(RANDBETWEEN(VLOOKUP(B${rowNumber},ExPodaci!D1:I24,3,FALSE)*100,VLOOKUP(B${rowNumber},ExPodaci!D1:I24,4,FALSE)*100)/100,"")`,
        c9: `=IFERROR(RANDBETWEEN(VLOOKUP(B${rowNumber},ExPodaci!D1:I24,5,FALSE)*10,VLOOKUP(B${rowNumber},ExPodaci!D1:I24,6,FALSE)*10)/10,"")`,
        c10: `=IFERROR(RANDBETWEEN(VLOOKUP(B${rowNumber},ExPodaci!D1:I24,5,FALSE)*10,VLOOKUP(B${rowNumber},ExPodaci!D1:I24,6,FALSE)*10)/10,"")`,
        c11: `=IFERROR(RANDBETWEEN(VLOOKUP(B${rowNumber},ExPodaci!D1:I24,5,FALSE)*10,VLOOKUP(B${rowNumber},ExPodaci!D1:I24,6,FALSE)*10)/10,"")`,
        c12: `=IF(B${rowNumber}="","",">50")`,
        c13: `=IF(B${rowNumber}="","",">50")`,
        c14: `=IF(B${rowNumber}="","",">50")`,
        c15: `=IF(B${rowNumber}="","","DA")`,
      }),
      pageOrientation: "landscape",
    },
    {
      id: "exei-cista-overload-e",
      label: "Zastita od preopterecenja motora Ex e",
      summary: "ZOI-10-10",
      sourceSheet: "ExEi1.8",
      columns: ["R.br.", "Broj strujnog kruga", "Razmak 1", "Razmak 2", "Tip i radno podrucje zastitnog uredaja", "Razmak 3", "Razmak 4", "Razmak 5", "Razmak 6", "In [A]", "Ip [A]", "IA/In", "tE [s]", "Iis 1,2xIp [A]", "Razmak 7", "Iis 1,5xIp [A]", "Razmak 8", "Iis 3xIp [A]", "Razmak 9", "IA/InxIp [A]", "tisk < tdoz / tisk < tE DA/NE"],
      rowCount: 6,
      rowBuilder: (rowNumber) => ({
        c1: `=IF(B${rowNumber}="","",ROW(B${rowNumber}))`,
        c14: `=IF(E${rowNumber}="","",IFERROR(VLOOKUP(E${rowNumber},ExPodaci!K1:R24,2,FALSE),""))`,
        c16: `=IFERROR(IF(E${rowNumber}="","",RANDBETWEEN(VLOOKUP(E${rowNumber},ExPodaci!K1:R24,3,FALSE),VLOOKUP(E${rowNumber},ExPodaci!K1:R24,4,FALSE))),"")`,
        c18: `=IFERROR(IF(E${rowNumber}="","",RANDBETWEEN(VLOOKUP(E${rowNumber},ExPodaci!K1:R24,5,FALSE),VLOOKUP(E${rowNumber},ExPodaci!K1:R24,6,FALSE))),"")`,
        c20: `=IFERROR(IF(E${rowNumber}="","",RANDBETWEEN(VLOOKUP(E${rowNumber},ExPodaci!K1:R24,7,FALSE),VLOOKUP(E${rowNumber},ExPodaci!K1:R24,8,FALSE))),"")`,
        c21: `=IF(E${rowNumber}="","","DA")`,
      }),
      pageOrientation: "landscape",
    },
    {
      id: "exei-cista-overload-d",
      label: "Zastita od preopterecenja motora Ex d",
      summary: "ZOI-10-10",
      sourceSheet: "ExEi1.9",
      columns: ["R.br.", "Broj strujnog kruga", "Razmak 1", "Razmak 2", "Tip i radno podrucje zastitnog uredaja", "Razmak 3", "Razmak 4", "Razmak 5", "Razmak 6", "In [A]", "Ip [A]", "Iis 1,2xIp [A]", "Razmak 7", "Iis 1,5xIp [A]", "Razmak 8", "Iis 7xIp [A]", "Razmak 9", "tisk < tdoz / tisk < tE DA/NE"],
      rowCount: 6,
      rowBuilder: (rowNumber) => ({
        c1: `=IF(B${rowNumber}="","",ROW(B${rowNumber}))`,
        c12: `=IFERROR(VLOOKUP(E${rowNumber},ExPodaci!T1:Y24,2,FALSE),"")`,
        c14: `=IFERROR(IF(E${rowNumber}="","",RANDBETWEEN(VLOOKUP(E${rowNumber},ExPodaci!T1:Y24,3,FALSE),VLOOKUP(E${rowNumber},ExPodaci!T1:Y24,4,FALSE))),"")`,
        c16: `=IFERROR(IF(E${rowNumber}="","",RANDBETWEEN(VLOOKUP(E${rowNumber},ExPodaci!T1:Y24,5,FALSE),VLOOKUP(E${rowNumber},ExPodaci!T1:Y24,6,FALSE))),"")`,
        c18: `=IF(E${rowNumber}="","","DA")`,
      }),
      pageOrientation: "landscape",
    },
    {
      id: "exei-cista-expodaci",
      label: "ExPodaci - sifrarnici za ExEi formule",
      summary: "Referentne liste iz VBA gumba: zastitni uredaji, Ex motori, Ex-e i Ex-d bimetali",
      sourceSheet: "ExPodaci",
      columns: EXEI_EXPODACI_COLUMNS,
      rows: makeExeiExPodaciRows(),
      includeInReport: false,
      pageOrientation: "landscape",
    },
  ],
  EXSE: [
    {
      id: "exse-cista-earthing",
      label: "Mjerenje otpora uzemljenja",
      summary: "ZOI-10-06 - otpor uzemljenja",
      sourceSheet: "ExSe1.2",
      columns: ["R.br.", "Mjerno mjesto", "Otpor uzemljenja [ohm]", "Otpor cijevi [kohm]", "Elektrostaticko polje [kV/m]", "Dozvoljeni otpor [ohm]", "Ocjena ispravnosti DA/NE", "Napomena"],
      rowCount: EXSE_EARTHING_ROWS.length,
      rowBuilder: makeExseEarthingCistaRow,
      pageOrientation: "landscape",
    },
    {
      id: "exse-cista-static",
      label: "Mjerenje otpora savitljivih cijevi i statickog elektriciteta",
      summary: "ZOI-10-06 - savitljive cijevi i staticki elektricitet",
      sourceSheet: "ExSe1.3",
      columns: ["R.br.", "Mjerno mjesto", "Otpor uzemljenja [ohm]", "Otpor cijevi [kohm]", "Elektrostaticko polje [kV/m]", "Dozvoljeni otpor [Mohm]", "Ocjena ispravnosti DA/NE", "Napomena"],
      rowCount: EXSE_STATIC_ROWS.length,
      rowBuilder: makeExseStaticCistaRow,
      pageOrientation: "landscape",
    },
  ],
  EXOV: [],
  HM: [
    {
      id: "hm-cista-layout",
      label: "Raspored hidrantske mreze",
      summary: "Pregled hidranata i opreme prema CISTA HMU/HMV predloscima",
      sourceSheet: "HMU1.1 / HMV1.1",
      columns: ["Redni broj", "Mjesto ugradnje", "Br. hidr.", "Oznacenost", "Oprema", "Dostupnost", "Funkcionalnost"],
      rowCount: 6,
    },
    {
      id: "hm-cista-measurements",
      label: "Proracun hidrantske mreze",
      summary: "Mjerenje tlaka i protoka hidrantske mreze",
      sourceSheet: "HMU1.1 / HMV1.1",
      columns: ["Hidrantska mreza", "Otvoreno mlaznica", "Staticki tlak pstat [bar]", "Dinamicki tlak pdin [bar]", "Promjer mlaznice [mm]", "Protok po mlaznici Qm [l/min]", "Ukupni protok Quk [l/min]", "Potreban protok [l/min]", "ZADOVOLJAVA"],
      rowCount: 4,
      pageOrientation: "landscape",
    },
  ],
  ROF: [
    {
      id: "rof-cista-measurements",
      label: "Fizikalni cimbenici radnog okolisa",
      summary: "Mjerenja osvijetljenosti, buke i mikroklime",
      sourceSheet: "RO-F.3",
      columns: ["Prostor / prostorija", "Mjerno mjesto", "Izmjereno opce osvjetljenje [lx]", "Propisano osvjetljenje [lx]", "Ekvivalentna razina buke [dB]", "Dopustena razina buke [dB]", "Izmjerena temperatura zraka [C]", "Dopustena temperatura zraka [C]", "Izmjerena brzina strujanja zraka [m/s]", "Dopustena brzina strujanja zraka [m/s]", "Izmjerena relativna vlaznost [%]", "Preporucena relativna vlaznost [%]", "DA/NE"],
      rowCount: 10,
      pageOrientation: "landscape",
    },
  ],
  ROK: [
    {
      id: "rok-cista-measurements",
      label: "Kemijski cimbenici radnog okolisa",
      summary: "Mjerenja kemijskih stetnosti radnog okolisa",
      sourceSheet: "RO-K.3",
      columns: ["Prostor / prostorija", "Mjerno mjesto", "Opis MM", "Stetnost", "Mjerna jedinica", "Izmjereno", "Izracunato u odnosu na 8 sati", "GVI", "KGVI", "Napomena", "DA/NE"],
      rowCount: 10,
      pageOrientation: "landscape",
    },
  ],
  HMU: [
    {
      id: "hmu-cista-layout",
      label: "Raspored unutarnje hidrantske mreze",
      summary: "Pregled hidrantskih ormara i opreme",
      sourceSheet: "HMU1.1",
      columns: ["Redni broj", "Mjesto ugradnje", "Br. hidr.", "Oznacenost", "Oprema", "Dostupnost", "Funkcionalnost"],
      rowCount: 4,
    },
    {
      id: "hmu-cista-measurements",
      label: "Proracun unutarnje hidrantske mreze",
      summary: "Mjerenje tlaka i protoka unutarnje hidrantske mreze",
      sourceSheet: "HMU1.1",
      columns: ["Hidrantska mreza", "Otvoreno mlaznica", "Staticki tlak pstat [bar]", "Dinamicki tlak pdin [bar]", "Promjer mlaznice [mm]", "Protok po mlaznici Qm [l/min]", "Ukupni protok Quk [l/min]"],
      rowCount: 3,
      pageOrientation: "landscape",
    },
  ],
  HMV: [
    {
      id: "hmv-cista-layout",
      label: "Raspored vanjske hidrantske mreze",
      summary: "Pregled vanjskih hidranata i opreme",
      sourceSheet: "HMV1.1",
      columns: ["Redni broj", "Mjesto ugradnje", "Br. hidr.", "Oznacenost", "Oprema", "Dostupnost", "Funkcionalnost"],
      rowCount: 4,
    },
    {
      id: "hmv-cista-measurements",
      label: "Proracun vanjske hidrantske mreze",
      summary: "Mjerenje tlaka i protoka vanjske hidrantske mreze",
      sourceSheet: "HMV1.1",
      columns: ["Hidrantska mreza", "Otvoreno mlaznica", "Staticki tlak pstat [bar]", "Dinamicki tlak pdin [bar]", "Promjer mlaznice [mm]", "Protok po mlaznici Qm [l/min]", "Ukupni protok Quk [l/min]"],
      rowCount: 3,
      pageOrientation: "landscape",
    },
  ],
  HMUV: [
    {
      id: "hmuv-cista-inside-layout",
      label: "Raspored unutarnje hidrantske mreze",
      summary: "Pregled unutarnjih hidranata",
      sourceSheet: "HMUV1.1",
      columns: ["Redni broj", "Mjesto ugradnje", "Br. hidr.", "Oznacenost", "Oprema", "Dostupnost", "Funkcionalnost"],
      rowCount: 4,
    },
    {
      id: "hmuv-cista-inside-measurements",
      label: "Proracun unutarnje hidrantske mreze",
      summary: "Mjerenje unutarnje hidrantske mreze",
      sourceSheet: "HMUV1.1",
      columns: ["Hidrantska mreza", "Otvoreno mlaznica", "Staticki tlak pstat [bar]", "Dinamicki tlak pdin [bar]", "Promjer mlaznice [mm]", "Protok po mlaznici Qm [l/min]", "Ukupni protok Quk [l/min]"],
      rowCount: 3,
      pageOrientation: "landscape",
    },
    {
      id: "hmuv-cista-outside-layout",
      label: "Raspored vanjske hidrantske mreze",
      summary: "Pregled vanjskih hidranata",
      sourceSheet: "HMUV1.1",
      columns: ["Redni broj", "Mjesto ugradnje", "Br. hidr.", "Oznacenost", "Oprema", "Dostupnost", "Funkcionalnost"],
      rowCount: 4,
    },
    {
      id: "hmuv-cista-outside-measurements",
      label: "Proracun vanjske hidrantske mreze",
      summary: "Mjerenje vanjske hidrantske mreze",
      sourceSheet: "HMUV1.1",
      columns: ["Hidrantska mreza", "Otvoreno mlaznica", "Staticki tlak pstat [bar]", "Dinamicki tlak pdin [bar]", "Promjer mlaznice [mm]", "Protok po mlaznici Qm [l/min]", "Ukupni protok Quk [l/min]"],
      rowCount: 3,
      pageOrientation: "landscape",
    },
  ],
  PPV: [
    {
      id: "ppv-cista-doors",
      label: "Protupozarna vrata",
      summary: "Popis protupozarnih vrata",
      sourceSheet: "PPV1.1",
      columns: ["Broj", "Tip PP vrata", "Tv. br.", "Mjesto ugradnje", "ZADOVOLJAVA"],
      rowCount: 8,
    },
  ],
  PPZ: [
    {
      id: "ppz-cista-dampers",
      label: "Protupozarne zaklopke",
      summary: "Popis protupozarnih zaklopki",
      sourceSheet: "PPZ1.1",
      columns: ["Broj", "Oznaka", "Dimenzije", "Serijski broj", "ZADOVOLJAVA"],
      rowCount: 12,
    },
  ],
  DS: [
    {
      id: "ds-cista-measurements",
      label: "Sustav za gasenje i hladenje vodom",
      summary: "Tlakovi i protoci drencher/deluge sustava",
      sourceSheet: "DS1.1",
      columns: ["Sustav za gasenje i hladenje vodom", "Otvoreno mlaznica", "Staticki tlak pstat [bar]", "Dinamicki tlak pdin [bar]", "Promjer mlaznice [mm]", "Protok po mlaznici Qm [l/min]", "Ukupni protok Quk [l/min]", "Potreban protok [l/min]", "ZADOVOLJAVA"],
      rowCount: 5,
      pageOrientation: "landscape",
    },
  ],
  STROJEVI: [
    {
      id: "strojevi-cista-checklist",
      label: "Rezultati ispitivanja strojeva/uredaja",
      summary: "STROJEVI.1 proizvoljne ispitne stavke",
      sourceSheet: "STROJEVI.2",
      columns: ["STAVKA*", "ZADOVOLJAVA DA/NE"],
      rows: STROJEVI_DEFAULT_ITEMS.map((item) => [item, "DA"]),
    },
  ],
  RADNAOPREMA: [
    {
      id: "radnaoprema-cista-checklist",
      label: "Stavke pregleda radne opreme",
      summary: "Strojarski i sigurnosni dio iz CISTA predloska",
      sourceSheet: "RadnaOprema",
      columns: ["STAVKA", "ZADOVOLJAVA DA/NE", "Napomena"],
      rows: WORK_EQUIPMENT_ITEMS.map((item) => [item, "DA", ""]),
    },
  ],
  PLINSKAKOTLOVNICA: [
    {
      id: "plinskakotlovnica-cista-review",
      label: "Pregled plinske kotlovnice",
      summary: "Strojarski dio, tehnicke mjere zastite i plinska instalacija",
      sourceSheet: "PlinskaKotlovnica.1",
      columns: ["Stavka", "ZADOVOLJAVA DA/NE", "Napomena"],
      rows: [
        ["Kotlovnica - gradevinski objekt", "DA", ""],
        ["Tehnicke mjere zastite", "DA", ""],
        ["Plinska instalacija", "DA", ""],
        ["Kotlovsko postrojenje", "DA", ""],
        ["Uredaji za ukljucivanje i iskljucivanje, upravljanje", "DA", ""],
        ["Signalni i mjerni uredaji", "DA", ""],
        ["Ventilacija prostora kotlovnice", "DA", ""],
      ],
    },
  ],
  NPI: [
    {
      id: "npi-cista-volume",
      label: "Volumen instalacije",
      summary: "Tablica volumena plinske instalacije",
      sourceSheet: "NPI1.1",
      columns: ["Dim 1", "L 1", "k 1", "Vol. 1", "Dim 2", "L 2", "k 2", "Vol. 2", "Volumen instalacije [l]"],
      rowCount: 6,
      pageOrientation: "landscape",
    },
    {
      id: "npi-cista-pressure",
      label: "Tlacna proba",
      summary: "Ocitanja tlaka plinske instalacije",
      sourceSheet: "NPI1.1",
      columns: ["Vrijeme 1 [hh:mm]", "Vrijeme 2 [hh:mm]", "Vrijeme 3 [hh:mm]", "Ispitni tlak [mbar]", "Napomena"],
      rowCount: 3,
    },
  ],
  UNP: [
    {
      id: "unp-cista-volume",
      label: "Volumen instalacije",
      summary: "Tablica volumena UNP instalacije",
      sourceSheet: "UNP1.1",
      columns: ["Dim 1", "L 1", "k 1", "Vol. 1", "Dim 2", "L 2", "k 2", "Vol. 2", "Volumen instalacije [l]"],
      rowCount: 6,
      pageOrientation: "landscape",
    },
    {
      id: "unp-cista-pressure",
      label: "Tlacna proba",
      summary: "Ocitanja tlaka UNP instalacije",
      sourceSheet: "UNP1.1",
      columns: ["Vrijeme 1 [hh:mm]", "Vrijeme 2 [hh:mm]", "Vrijeme 3 [hh:mm]", "Ispitni tlak [mbar]", "Napomena"],
      rowCount: 3,
    },
  ],
  PE: [
    {
      id: "pe-cista-location-data",
      label: "Osnovni podaci o lokaciji",
      summary: "Tablica 3.1 - osnovni podaci o lokaciji i zaposlenim osobama",
      sourceSheet: "PE1.1",
      columns: ["Podatak", "Vrijednost", "Napomena"],
      rows: [
        ["Naziv tvrtke", "", ""],
        ["Djelatnost po NKD2007", "", ""],
        ["Lokacija", "", ""],
        ["Opis objekta", "", ""],
        ["Ukupni broj zaposlenih", "", ""],
        ["Najveci ukupni broj osoba na lokaciji", "", ""],
      ],
    },
    {
      id: "pe-cista-installations",
      label: "Instalacije i zastitni sustavi na objektu",
      summary: "Pregled instalacija i sustava zastite od pozara iz plana evakuacije",
      sourceSheet: "PE1.1",
      columns: ["Stavka", "Prisutan DA/NE", "Napomena"],
      rows: [
        ["Elektricne instalacije", "DA", ""],
        ["Plinske instalacije", "DA", ""],
        ["Voda", "DA", ""],
        ["Ventilacijski sustav", "DA", ""],
        ["Sustav za zastitu od djelovanja munje", "DA", ""],
        ["El. instalacije u Ex izvedbi", "DA", ""],
        ["Aparati za pocetno gasenje pozara", "DA", ""],
        ["Sigurnosna protupanicna rasvjeta", "DA", ""],
        ["Tipkalo za iskljucenje el. energije", "DA", ""],
        ["Unutarnja hidrantska mreza", "DA", ""],
        ["Vanjska hidrantska mreza", "DA", ""],
        ["Sprinkler sustav", "DA", ""],
        ["Sustav odimljavanja", "DA", ""],
        ["Protupozarne zaklopke", "DA", ""],
        ["Protupozarna vrata", "DA", ""],
        ["Drencher sustav", "DA", ""],
        ["Sustav plinodojave", "DA", ""],
        ["Sustav gasenja plinom", "DA", ""],
        ["Sustav vatrootpornih zavjesa", "DA", ""],
      ],
    },
    {
      id: "pe-cista-events",
      label: "Dogadjaji koji mogu ugroziti radnike",
      summary: "Opasni dogadjaji iz plana evakuacije",
      sourceSheet: "PE1.1",
      columns: ["Dogadjaj", "Opis / opasnosti", "Postupak / napomena"],
      rows: [
        ["Pozar", "", ""],
        ["Potres vece snage", "", ""],
        ["Teroristicki cin", "", ""],
        ["Drugi iznenadni dogadjaji", "", ""],
      ],
    },
  ],
  NNZD: [
    {
      id: "nnzd-cista-findings",
      label: "Utvrdjene nesukladnosti",
      summary: "Negativni nalaz tehnickih ispitivanja",
      sourceSheet: "NNZD1.1",
      columns: ["Naziv ispitivanja", "Nesukladnost", "Mjera / napomena"],
      rowCount: 8,
    },
  ],
  NNZDPETROL: [
    {
      id: "nnzdpetrol-cista-findings",
      label: "Nesukladnosti na benzinskoj postaji",
      summary: "Pregled nesukladnosti po podrucjima Petrol obrasca",
      sourceSheet: "NNZDPETROL1.1",
      columns: ["Podrucje", "Status / nalaz", "Vrsta instalacije", "Preporuka / napomena"],
      rows: [
        ["Radna oprema", "", "", ""],
        ["Elektricne instalacije", "", "", ""],
        ["Sigurnosna panik rasvjeta", "", "", ""],
        ["Sustav za zastitu od djelovanja munje", "", "", ""],
        ["Tipkalo za isklop napona u slucaju nuzde", "", "", ""],
        ["Sustav ventilacije", "", "", ""],
        ["Radni okolis", "", "", ""],
        ["Sustav za dojavu pozara", "", "", ""],
        ["Hidrantska mreza", "", "", ""],
        ["Ex ispitivanja", "", "", ""],
        ["Nepropusnost plinske instalacije", "", "", ""],
        ["Vizualno stanje", "", "", ""],
      ],
    },
  ],
  EOTP: [
    {
      id: "eotp-cista-marking",
      label: "Odabrani nacin oznacavanja",
      summary: "Elaborat o oznacavanju transportnih putova",
      sourceSheet: "EOTP1.1",
      columns: ["Stavka", "Odabrano rjesenje", "Napomena"],
      rows: [
        ["Transportni putovi", "Obiljeziti linijom postojane zute boje.", ""],
        ["Pjesacke staze", "Obiljeziti linijom postojane svijetlo-plave boje.", ""],
        ["Prostor za uskladistenje / slaganje", "Oznaciti prema namjeni prostora.", ""],
        ["Primjer oznacavanja", "Nacrt se nalazi u prilogu dokumenta.", ""],
      ],
    },
    {
      id: "eotp-cista-documentation",
      label: "Koristena dokumentacija i strucno misljenje",
      summary: "Projektni zadatak, metodologija i strucno misljenje",
      sourceSheet: "EOTP1.1",
      columns: ["Poglavlje", "Tekst", "Napomena"],
      rows: [
        ["Koristena tehnicko-projektna dokumentacija", "Tlocrt radnog prostora", ""],
        ["Projektni zadatak", "", ""],
        ["Metodologija", "", ""],
        ["Strucno misljenje", "", ""],
      ],
    },
  ],
  SVZ: [],
  SP: [
    {
      id: "sp-cista-assessment",
      label: "Sustav za detekciju zapaljivih plinova",
      summary: "Ocjena sustava detekcije plina",
      sourceSheet: "SP1.1",
      columns: ["Stavka", "ZADOVOLJAVA DA/NE", "Napomena"],
      rows: [
        ["Sustav za detekciju zapaljivih plinova", "DA", ""],
        ["Centralni uredaj", "DA", ""],
        ["Detektori plina", "DA", ""],
        ["Alarmne sirene", "DA", ""],
      ],
    },
  ],
  SGP: [
    {
      id: "sgp-cista-assessment",
      label: "Stabilni sustav za gasenje pozara plinom",
      summary: "Ocjena sustava za gasenje plinom",
      sourceSheet: "SGP1.1",
      columns: ["Stavka", "ZADOVOLJAVA DA/NE", "Napomena"],
      rows: [["Stabilni sustav za gasenje pozara plinom", "DA", ""]],
    },
  ],
  SS: [
    {
      id: "ss-cista-assessment",
      label: "Sprinkler sustav",
      summary: "Ocjena sprinkler sustava",
      sourceSheet: "SS1.1",
      columns: ["Stavka", "ZADOVOLJAVA DA/NE", "Napomena"],
      rows: [
        ["Pregled izvedenog stanja prema projektnoj dokumentaciji", "DA", ""],
        ["Sprinkler sustav", "DA", ""],
      ],
    },
  ],
  PJENA: [
    {
      id: "pjena-cista-assessment",
      label: "Sustav za gasenje pozara pjenom",
      summary: "Ocjena sustava za gasenje pjenom",
      sourceSheet: "PJENA1.1",
      columns: ["Stavka", "ZADOVOLJAVA DA/NE", "Napomena"],
      rows: [
        ["Pregled izvedenog stanja prema projektnoj dokumentaciji", "DA", ""],
        ["Sustav za gasenje pozara pjenom", "DA", ""],
      ],
    },
  ],
  SO: [
    {
      id: "so-cista-assessment",
      label: "Sustav za odvodjenje dima i topline",
      summary: "Ocjena sustava za odvodjenje dima i topline",
      sourceSheet: "SO1.1",
      columns: ["Stavka", "ZADOVOLJAVA DA/NE", "Napomena"],
      rows: [
        ["Pregled izvedenog stanja prema projektnoj dokumentaciji", "DA", ""],
        ["Svi dijelovi sustava ispravno funkcioniraju", "DA", ""],
      ],
    },
  ],
  PZ: [
    {
      id: "pz-cista-assessment",
      label: "Sustav vatrootpornih zavjesa",
      summary: "Ocjena vatrootpornih zavjesa",
      sourceSheet: "PZ1.1",
      columns: ["Stavka", "ZADOVOLJAVA DA/NE", "Napomena"],
      rows: [
        ["Pregled izvedenog stanja prema projektnoj dokumentaciji", "DA", ""],
        ["Veza sustava vatrootpornih zavjesa sa sustavom za dojavu pozara", "DA", ""],
        ["Svi dijelovi sustava ispravno funkcioniraju", "DA", ""],
      ],
    },
  ],
});

function getCistaNativeTableSpecsForService(serviceCode = "") {
  const blueprints = CISTA_NATIVE_TABLE_BLUEPRINTS[normalizeCode(serviceCode)];
  return Array.isArray(blueprints) && blueprints.length
    ? blueprints.map((blueprint) => cistaTableSpec(blueprint))
    : null;
}

function normalizeDocumentationOptions(options = []) {
  return (Array.isArray(options) ? options : [])
    .map((option) => {
      if (typeof option === "string") {
        return { value: option, label: option };
      }
      return {
        value: option?.value || option?.label || "",
        label: option?.label || option?.value || "",
      };
    })
    .filter((option) => option.value || option.label);
}

function makeChecklistFromItems({
  id,
  label,
  summary = "",
  items = [],
  options = YES_NO_NP_VALUES,
  defaultValue = "DA",
  assessmentLabel = "",
} = {}) {
  return Object.freeze({
    id,
    key: id,
    tokenKey: normalizeCode(id).replace(/[^A-Z0-9]+/g, "_"),
    label,
    summary: summary || label,
    enabledFieldId: `use-${id}`,
    enabledByDefault: true,
    assessmentLabel,
    options: normalizeDocumentationOptions(options),
    items: items.map((item, index) => ({
      id: `${id}-${index + 1}`,
      key: `${id}-${index + 1}`,
      tokenKey: `${normalizeCode(id).replace(/[^A-Z0-9]+/g, "_")}_${index + 1}`,
      label: item,
      defaultValue,
    })),
  });
}

function createNativeReportPreset({
  serviceCode,
  serviceName,
  title = "",
  documentType = "",
  reportTitle = "",
  coverSubtitle = "",
  measurementTableTitle = "",
  systemDescription = "",
  resultsText = "",
  notes = [],
  assessmentLabel = "",
  conclusionLead = "",
  validitySentence = "Ponovno ispitivanje potrebno je obaviti do",
  signatureAreas = ["elektro"],
  technicalDataFields = [],
  checklists = [],
  measurementAssessments = [],
  tables = [],
  projectDocumentation = "",
} = {}) {
  const cleanCode = normalizeCode(serviceCode);
  return Object.freeze({
    serviceCode: cleanCode,
    serviceName,
    title: title || `${cleanCode} v1.0.0`,
    documentType: documentType || serviceName,
    reportTitle,
    coverSubtitle,
    measurementTableTitle,
    systemDescription: systemDescription || makeSimpleSystemDescription(serviceName),
    resultsText,
    notes,
    assessmentLabel,
    conclusionLead,
    validitySentence,
    signatureAreas,
    technicalDataFields,
    projectDocumentation,
    checklists,
    measurementAssessments,
    tables,
  });
}

function makeSimpleResultText(subject = "predmetni sustav", detail = "") {
  return [
    `Pregledom i ispitivanjem utvrdjuje se stanje za ${subject}.`,
    detail || "Rezultati pregleda i ispitivanja prikazuju se u pripadajucim tablicama i ocjenama zapisnika.",
  ].join("\n\n");
}

function makeSimpleSystemDescription(subject = "predmetni sustav") {
  return [
    `<p>Predmetni sustav za ${subject} opisan je prema dostupnoj tehničkoj dokumentaciji, izvedenom stanju i obuhvatu ispitivanja.</p>`,
    "<ul><li>osnovni dijelovi sustava</li><li>lokacija i obuhvat pregleda</li><li>bitne napomene za ispitivanje</li></ul>",
  ].join("");
}

export const DOCUMENTATION_NATIVE_REPORT_PRESETS = Object.freeze({
  SPR: Object.freeze({
    serviceCode: "SPR",
    serviceName: "Sigurnosna panik rasvjeta",
    title: "SPR v1.0.0",
    documentType: "Sigurnosna panik rasvjeta",
    reportTitle: "ISPITIVANJE SIGURNOSNE PROTUPANICNE RASVJETE",
    coverSubtitle: "O ISPITIVANJU PROTUPANICNE (SIGURNOSNE) RASVJETE",
    measurementTableTitle: "Tablica 1. - mjerna mjesta sigurnosne protupanicne rasvjete",
    resultsText: [
      "Sigurnosna rasvjeta se ispituje simuliranjem nestanka elektricne energije i provjerom ukljucenja rasvjetnih tijela.",
      "Pregledom i ispitivanjem panik i sigurnosne rasvjete utvrduju se mjerna mjesta, broj lampi, izmjereno osvjetljenje i zadovoljenje propisanih vrijednosti.",
    ].join("\n\n"),
    notes: [
      "Ei - izmjereno osvjetljenje sigurnosne rasvjete duz evakuacijskih puteva i kod izlaza iz prostorija [lux].",
      "Eimin - zahtijevano minimalno osvjetljenje sigurnosne rasvjete [lux].",
    ],
    projectDocumentation: "Zapisnik od prethodnog ispitivanja od strane Abeceda zastite d.o.o.",
    assessmentLabel: "Funkcionalnost sigurnosne protupanicne rasvjete",
    conclusionLead: "Temeljem rezultata mjerenja i ispitivanja te ocjene rezultata mjerenja moze se zakljuciti da ispitivana panik (sigurnosna) rasvjeta na dan predmetnog ispitivanja",
    validitySentence: "Zapisnik o ispitivanju vrijedi jednu (1) godinu, odnosno najkasnije do",
    signatureAreas: ["elektro"],
    tables: [
      tableSpec({
        id: "spr-results",
        label: "Mjerna mjesta sigurnosne rasvjete",
        summary: "Tablica 1. - mjerna mjesta sigurnosne protupanicne rasvjete",
        columns: SPR_COLUMNS,
        blankRowCount: 12,
        blankSeed: { lampCount: "1", ei: ">2", eimin: "1", pass: "DA" },
      }),
    ],
  }),
  TZIN: Object.freeze({
    serviceCode: "TZIN",
    serviceName: "Tipkalo za isklop elektricne instalacije",
    title: "TZIN v1.0.0",
    documentType: "Tipkalo za isklop elektricne instalacije",
    reportTitle: "ISPITIVANJE TIPKALA ZA ISKLOP ELEKTRICNE ENERGIJE U SLUCAJU NUZDE",
    coverSubtitle: "O ISPITIVANJU TIPKALA ZA ISKLOP ELEKTRICNE INSTALACIJE U SLUCAJU HITNOSTI",
    measurementTableTitle: "Tablica 1. - mjerna mjesta tipkala za iskljucenje elektricne energije u slucaju nuzde",
    resultsText: [
      "Pregledom i ispitivanjem utvrduju se broj i pozicija tipkala za isklop elektricne energije u slucaju nuzde.",
      "Aktiviranjem tipkala za direktno i daljinsko iskljucenje elektricne energije u slucaju hitnosti provjerava se ispravan rad.",
      "Prikaz ispitivanih tipkala dan je u Tablici 1.",
    ].join("\n\n"),
    notes: [],
    assessmentLabel: "Tipkala za iskljucenje elektricne energije u slucaju hitnosti",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da ispitivana tipkala za iskljucenje elektricne energije u slucaju hitnosti na dan predmetnog ispitivanja",
    validitySentence: "Zapisnik o ispitivanju vrijedi jednu (1) godinu, odnosno najkasnije do",
    signatureAreas: ["tipkalo", "elektro"],
    tables: [
      tableSpec({
        id: "tzin-buttons",
        label: "Mjerna mjesta tipkala za isklop",
        summary: "Tablica 1. - mjerna mjesta tipkala za iskljucenje elektricne energije u slucaju nuzde",
        columns: TZIN_COLUMNS,
        blankRowCount: 3,
        blankSeed: { buttonCount: "1", buttonType: "-", pass: "DA" },
      }),
    ],
  }),
  SZOM: Object.freeze({
    serviceCode: "SZOM",
    serviceName: "Sustav za zastitu od djelovanja munje",
    title: "SZOM v1.0.0",
    documentType: "Sustav za zastitu od djelovanja munje",
    reportTitle: "ISPITIVANJE SUSTAVA ZA ZASTITU OD DJELOVANJA MUNJE NA GRADEVINAMA",
    coverSubtitle: "O PREGLEDU SUSTAVA ZA ZASTITU OD DJELOVANJA MUNJE NA GRADEVINAMA",
    measurementTableTitle: "Tablica 1. - rezultati mjerenja sustava zastite od djelovanja munje",
    resultsText: [
      "Mjerenjem se provjerava otpor rasprostiranja uzemljivaca, skriveni spojevi i elektricna povezanost metalnih masa.",
      "Rezultati mjerenja sustava zastite od djelovanja munje dani su u Tablici 1.",
    ].join("\n\n"),
    notes: [
      "Riz - mjerenje otpora rasprostiranja uzemljivaca; Rdop - dopusteni otpor rasprostiranja uzemljivaca.",
      "Riz2/Rdop2 - elektricni otpor skrivenih spojeva; Riz3/Rdop3 - elektricna povezanost metalnih masa.",
    ],
    assessmentLabel: "Sustav zastite od djelovanja munje",
    conclusionLead: "Temeljem rezultata pregleda i mjerenja moze se zakljuciti da ispitivani sustav zastite od djelovanja munje na dan predmetnog ispitivanja",
    validitySentence: "Ponovno ispitivanje potrebno je obaviti do",
    signatureAreas: ["elektro"],
    technicalDataFields: SZOM_TECHNICAL_FIELDS,
    tables: [
      tableSpec({
        id: "szom-measurements",
        label: "Mjerenje sustava zastite od munje",
        summary: "Tablica 1. - rezultati mjerenja sustava zastite od djelovanja munje",
        columns: SZOM_COLUMNS,
        rows: formulaRows(SZOM_COLUMNS, 24, (rowNumber, index) => ({
          place: [
            "Odvod BP",
            "Odvod BP",
            "Odvod BP",
            "Odvod BP",
            "Agregat",
            "Agregat",
            "Agregat",
            "Agregat",
            "Spremnik gorivo",
            "Odzračnici",
            "Spremnik plina",
            "Rasvjetni stup",
            "Skladište boce UNP",
            "Rasvjetni stup",
            "Rasvjetni stup",
            "Rasvjetni stup",
            "Rasvjetni stup",
            "Rasvjetni stup",
            "Rasvjetni stup",
            "Sklopka AC",
            "Sklopka AC",
            "Rasvjetni stup",
            "",
            "",
          ][index] || "",
          riz: `=IF(B${rowNumber}="","",RANDBETWEEN(200,380)/100)`,
          rdop: "<10",
          riz2: `=IF(E${rowNumber}="","",RANDBETWEEN(40,85)/100)`,
          rdop2: `=IF(E${rowNumber}="","","<1")`,
          riz3: `=IF(H${rowNumber}="","",RANDBETWEEN(40,135)/100)`,
          rdop3: `=IF(H${rowNumber}="","","<2")`,
          pass: "DA",
        })),
      }),
    ],
  }),
  SZOMV: Object.freeze({
    serviceCode: "SZOMV",
    serviceName: "Vizualni pregled sustava za zastitu od djelovanja munje",
    title: "SZOMV v1.0.0",
    documentType: "Vizualni pregled sustava za zastitu od djelovanja munje",
    reportTitle: "VIZUALNI PREGLED SUSTAVA ZA ZASTITU OD DJELOVANJA MUNJE",
    coverSubtitle: "O VIZUALNOM PREGLEDU SUSTAVA ZA ZASTITU OD DJELOVANJA MUNJE NA GRADEVINAMA",
    measurementTableTitle: "Tablica 1. - vizualni pregled sustava zastite od djelovanja munje",
    resultsText: [
      "Vizualnim pregledom provjerava se stanje vanjskog i unutarnjeg sustava zastite od munje.",
      "Pregled obuhvaca hvataljke, odvode, mjerne spojeve, uzemljenje, prenaponsku zastitu i izjednacavanje potencijala.",
    ].join("\n\n"),
    notes: [],
    assessmentLabel: "Vizualno stanje sustava zastite od djelovanja munje",
    conclusionLead: "Temeljem rezultata pregleda moze se zakljuciti da predmetni sustav zastite od djelovanja munje na dan predmetnog pregleda",
    validitySentence: "Ponovno ispitivanje potrebno je obaviti do",
    signatureAreas: ["elektro"],
    technicalDataFields: SZOMV_TECHNICAL_FIELDS,
    checklists: SZOMV_CHECKLISTS,
    tables: [],
  }),
  EIZ: Object.freeze({
    serviceCode: "EIZ",
    serviceName: "Električne instalacije",
    title: "EIZ v1.0.0",
    documentType: "Električne instalacije",
    reportTitle: "ISPITIVANJE ELEKTRIČNIH INSTALACIJA",
    coverSubtitle: "O ISPITIVANJU ELEKTRIČNIH INSTALACIJA",
    measurementTableTitle: "Tablica 1. - vizualni pregled električne instalacije",
    resultsText: [
      "Ispitivanje električne instalacije obuhvaća vizualni pregled, ispitivanje zaštitnog uređaja diferencijalne struje, impedanciju petlje kvara, otpor izolacije i kontinuitet zaštitnog vodiča.",
      "Rezultati ispitivanja prikazuju se u zasebnim ispitnim listovima EIZ.V, EIZ.ZUDS, EIZ.IPK, EIZ.OI i EIZ.K.",
    ].join("\n\n"),
    notes: [
      "ZUDS - zaštitni uređaj diferencijalne struje; Iisk - izmjerena struja prorade; tisk - izmjereno vrijeme prorade.",
      "IPK - impedancija petlje kvara; OI - otpor izolacije; K - kontinuitet zaštitnog vodiča.",
    ],
    assessmentLabel: "Električne instalacije",
    conclusionLead: "Temeljem rezultata mjerenja i ispitivanja te ocjene rezultata mjerenja može se zaključiti da ispitivana električna instalacija na dan predmetnog ispitivanja",
    validitySentence: "Zapisnik o ispitivanju vrijedi jednu (1) godinu, odnosno najkasnije do",
    signatureAreas: ["elektro"],
    technicalDataFields: EIZ_TECHNICAL_FIELDS,
    projectDocumentation: "",
    checklists: [EIZ_VISUAL_CHECKLIST],
    measurementAssessments: EIZ_MEASUREMENT_ASSESSMENTS,
    tables: [
      tableSpec({
        id: "eiz-zuds",
        label: "ISPITIVANJE ZAŠTITNOG UREĐAJA DIFERENCIJALNE STRUJE - ZUDS",
        summary: "IL - EIZ.ZUDS",
        sourceSheet: "EIZ1.3",
        chapterTitle: "Mjerenja zaštitnog uređaja diferencijalne struje",
        assessmentLabel: "Ispitivanje ZUDS nazivnom i rastućom strujom kvara",
        columns: EIZ_ZUDS_COLUMNS,
        rows: formulaRows(EIZ_ZUDS_COLUMNS, 10, (rowNumber, index) => ({
          board: "RO BS",
          circuit: ["F100.4", "F100.5", "F100.6", "F100.8", "F140", "F141", "F133", "F142", "F340", "F340.1"][index] || "",
          inCurrent: index === 0 ? "63" : (index < 4 ? "40" : "25"),
          separator: "/",
          idn: [300, 30, 30, 30, 300, 300, 300, 300, 30, 30][index] || 30,
          iisk: `=IF(F${rowNumber}="","",RANDBETWEEN(70,80)*F${rowNumber}/100)`,
          tisk: `=IF(F${rowNumber}="","",RANDBETWEEN(14,24))`,
          u0: `=IF(F${rowNumber}="","","<50")`,
          pass: `=IF(F${rowNumber}="","","DA")`,
        })),
      }),
      tableSpec({
        id: "eiz-ipk",
        label: "ISPITIVANJE IMPEDANCIJE PETLJE KVARA",
        summary: "IL - EIZ.IPK",
        sourceSheet: "EIZ1.4",
        chapterTitle: "Impedancija petlje kvara",
        assessmentLabel: "Zaštita od indirektnog dodira",
        pageOrientation: "landscape",
        columns: EIZ_IPK_COLUMNS,
        rows: formulaRows(EIZ_IPK_COLUMNS, 36, (rowNumber) => ({
          place: "Utičnica 230 V",
          circuit: "-",
          protectionType: "RCD 40/0,03",
          idnIa: rowNumber === 1 ? "0.03" : "0.3",
          td: "0.4",
          zLpe: `=IF(B${rowNumber}="","",RANDBETWEEN(140,165)/100)`,
          izem: `=IF(G${rowNumber}="","",RANDBETWEEN(224.25,235.75)/G${rowNumber})`,
          zLn: `=IF(B${rowNumber}="","",RANDBETWEEN(40,65)/100)`,
          zLl: "-",
          u0: `=IF(G${rowNumber}="","",G${rowNumber}*E${rowNumber})`,
          pass: "DA",
        })),
      }),
      tableSpec({
        id: "eiz-oi",
        label: "ISPITIVANJE OTPORA IZOLACIJE",
        summary: "IL - EIZ.OI",
        sourceSheet: "EIZ1.5",
        chapterTitle: "Otpor izolacije",
        assessmentLabel: "Otpor izolacije vodova",
        columns: EIZ_OI_COLUMNS,
        rows: formulaRows(EIZ_OI_COLUMNS, 60, (rowNumber) => ({
          circuit: `Strujni krug ${rowNumber}`,
          l123n: ">30",
          l123pe: ">30",
          npe: ">30",
          rd: ">1",
          pass: "DA",
        })),
      }),
      tableSpec({
        id: "eiz-k",
        label: "ISPITIVANJE KONTINUITETA ZAŠTITNOG VODIČA I VODIČA ZA IZJEDNAČAVANJE POTENCIJALA",
        summary: "IL - EIZ.K",
        sourceSheet: "EIZ1.6",
        chapterTitle: "Kontinuitet zaštitnog vodiča",
        assessmentLabel: "Kontinuitet zaštitnog vodiča",
        columns: EIZ_K_COLUMNS,
        rows: formulaRows(EIZ_K_COLUMNS, 6, (rowNumber, index) => ({
          place1: "PE sabirnica GRO",
          place2: [
            "Uzemljivač objekta",
            "Agregati za istakanje goriva",
            "Sklopka za uzemljenje",
            "Vodovodna instalacija",
            "",
            "",
          ][index] || "",
          testCurrent: `=IF(C${rowNumber}="","","0,2")`,
          measuredResistance: `=IF(C${rowNumber}="","","<1")`,
          allowedResistance: `=IF(C${rowNumber}="","","<1")`,
          pass: `=IF(C${rowNumber}="","","DA")`,
          note: `=IF(C${rowNumber}="","","-")`,
        })),
      }),
    ],
  }),
  VES: Object.freeze({
    serviceCode: "VES",
    serviceName: "Vjezba evakuacije i spasavanja",
    title: "VES v1.0.0",
    documentType: "Vjezba evakuacije i spasavanja",
    reportTitle: "IZVRSENJE VJEZBE EVAKUACIJE I SPASAVANJA",
    coverSubtitle: "O IZVRSENJU VJEZBE EVAKUACIJE I SPASAVANJA",
    measurementTableTitle: "Podaci o vjezbi evakuacije i spasavanja",
    resultsText: [
      "Prakticna vjezba evakuacije provodi se prema planu evakuacije i spasavanja za slucaj izvanrednog dogadaja.",
      "U zapisniku se evidentira tijek vjezbe, zborno mjesto, broj osoba i vrijeme napustanja objekta.",
    ].join("\n\n"),
    notes: [],
    assessmentLabel: "Vjezba evakuacije i spasavanja",
    conclusionLead: "Temeljem provedenog opisa tijeka vjezbe moze se zakljuciti da provedena vjezba evakuacije i spasavanja",
    validitySentence: "Vjezbu evakuacije potrebno je ponoviti najkasnije do",
    signatureAreas: ["elektro"],
    tables: [
      tableSpec({
        id: "ves-exercise",
        label: "Podaci o vjezbi evakuacije",
        summary: "Zborno mjesto, broj osoba i vrijeme napustanja objekta",
        columns: VES_COLUMNS,
        blankRowCount: 1,
        blankSeed: {},
      }),
    ],
  }),
  EMM: createNativeReportPreset({
    serviceCode: "EMM",
    serviceName: "Povezanost metalnih masa",
    reportTitle: "ISPITIVANJE POVEZANOSTI METALNIH MASA",
    coverSubtitle: "O ISPITIVANJU POVEZANOSTI METALNIH MASA",
    measurementTableTitle: "Tablica 1. - rezultati ispitivanja povezanosti metalnih masa",
    resultsText: makeSimpleResultText("povezanost metalnih masa", "Mjerenjem se provjerava kontinuitet i otpor povezivanja izmedju metalnih masa i zastitnog vodiča."),
    notes: ["Iisp - ispitna struja; Rizm - izmjereni otpor; R - dozvoljeni / ocekivani otpor."],
    assessmentLabel: "Povezanost metalnih masa",
    conclusionLead: "Temeljem rezultata mjerenja moze se zakljuciti da ispitivana povezanost metalnih masa na dan predmetnog ispitivanja",
    signatureAreas: ["elektro"],
    measurementAssessments: makeAssessmentEntries("EMM", ["Povezanost metalnih masa"]),
    tables: [
      tableSpec({
        id: "emm-metal-bonding",
        label: "Povezanost metalnih masa",
        summary: "Tablica 1. - povezanost metalnih masa",
        columns: EMM_COLUMNS,
        blankRowCount: 12,
        blankSeed: { testCurrent: "0,2", measuredResistance: "<1", expectedResistance: "<1", pass: "DA" },
      }),
    ],
  }),
  VS: createNativeReportPreset({
    serviceCode: "VS",
    serviceName: "Sustav ventilacije",
    reportTitle: "ISPITIVANJE SUSTAVA VENTILACIJE",
    coverSubtitle: "O ISPITIVANJU SUSTAVA VENTILACIJE",
    measurementTableTitle: "Tablica 1. - rezultati ispitivanja ventilacije",
    resultsText: makeSimpleResultText("sustav ventilacije", "Ispitivanje obuhvaca protok zraka, broj izmjena zraka, otvore, podtlak/nadtlak i usporedbu sa trazenim vrijednostima."),
    assessmentLabel: "Sustav ventilacije",
    conclusionLead: "Temeljem rezultata mjerenja moze se zakljuciti da ispitivani sustav ventilacije na dan predmetnog ispitivanja",
    signatureAreas: ["znr"],
    measurementAssessments: makeAssessmentEntries("VS", ["Sustav ventilacije"]),
    tables: [
      tableSpec({
        id: "vs-ventilation",
        label: "Ventilacija prostora",
        summary: "Tablica 1. - ispitivanje ventilacije",
        columns: VENTILATION_COLUMNS,
        blankRowCount: 8,
        blankSeed: { pass: "DA" },
        pageOrientation: "landscape",
      }),
    ],
  }),
  PPCAFFE: createNativeReportPreset({
    serviceCode: "PPCAFFE",
    serviceName: "Ventilacija caffe bara",
    reportTitle: "ISPITIVANJE VENTILACIJE CAFFE BARA",
    coverSubtitle: "O ISPITIVANJU VENTILACIJE CAFFE BARA",
    measurementTableTitle: "Tablica 1. - rezultati ispitivanja ventilacije caffe bara",
    resultsText: makeSimpleResultText("ventilaciju caffe bara", "Ispitivanje obuhvaca izmjerene protoke, broj izmjena zraka i usporedbu s trazenim vrijednostima prostora."),
    assessmentLabel: "Ventilacija caffe bara",
    conclusionLead: "Temeljem rezultata mjerenja moze se zakljuciti da ispitivana ventilacija caffe bara na dan predmetnog ispitivanja",
    signatureAreas: ["znr"],
    measurementAssessments: makeAssessmentEntries("PPCAFFE", ["Ventilacija caffe bara"]),
    tables: [
      tableSpec({
        id: "ppcaffe-ventilation",
        label: "Ventilacija caffe bara",
        summary: "Tablica 1. - ventilacija caffe bara",
        columns: VENTILATION_COLUMNS,
        blankRowCount: 8,
        blankSeed: { pass: "DA" },
        pageOrientation: "landscape",
      }),
    ],
  }),
  PZP: createNativeReportPreset({
    serviceCode: "PZP",
    serviceName: "Ventilacija prostora za pusace",
    reportTitle: "ISPITIVANJE VENTILACIJE PROSTORA ZA PUSACE",
    coverSubtitle: "O ISPITIVANJU VENTILACIJE PROSTORA ZA PUSACE",
    measurementTableTitle: "Tablica 1. - rezultati ispitivanja ventilacije prostora za pusace",
    resultsText: makeSimpleResultText("ventilaciju prostora za pusace", "Ispitivanje obuhvaca protok, broj izmjena zraka, tlakove i usporedbu s trazenim vrijednostima."),
    assessmentLabel: "Ventilacija prostora za pusace",
    conclusionLead: "Temeljem rezultata mjerenja moze se zakljuciti da ispitivana ventilacija prostora za pusace na dan predmetnog ispitivanja",
    signatureAreas: ["znr"],
    measurementAssessments: makeAssessmentEntries("PZP", ["Ventilacija prostora za pusace"]),
    tables: [
      tableSpec({
        id: "pzp-ventilation",
        label: "Ventilacija prostora za pusace",
        summary: "Tablica 1. - ventilacija prostora za pusace",
        columns: VENTILATION_COLUMNS,
        blankRowCount: 8,
        blankSeed: { pass: "DA" },
        pageOrientation: "landscape",
      }),
    ],
  }),
  EXEI: createNativeReportPreset({
    serviceCode: "EXEI",
    serviceName: "Elektricne instalacije u Ex prostoru",
    reportTitle: "ISPITIVANJE INSTALACIJA U PODRUCJIMA S EKSPLOZIVNOM ATMOSFEROM",
    coverSubtitle: "O ISPITIVANJU INSTALACIJA U PODRUCJIMA S EKSPLOZIVNOM ATMOSFEROM",
    measurementTableTitle: "ExEi ispitni listovi",
    resultsText: EXEI_RESULTS_TEXT,
    notes: ["ExEi koristi vise Gridline tablica jer CISTA sadrzi osam ispitnih listova i zavrsnu ocjenu."],
    assessmentLabel: "Mjerenje u prostorima ugrozenim eksplozivnom atmosferom",
    conclusionLead: "Temeljem rezultata mjerenja i ispitivanja te ocjene rezultata mjerenja moze se zakljuciti da ispitivane instalacije u prostorima ugrozenim eksplozivnom atmosferom na dan predmetnog ispitivanja",
    signatureAreas: ["elektro", "ex"],
    technicalDataFields: EXEI_TECHNICAL_FIELDS,
    projectDocumentation: EXEI_PROJECT_DOCUMENTATION,
    measurementAssessments: EXEI_MEASUREMENT_ASSESSMENTS,
    tables: [
      tableSpec({ id: "exei-ipk", label: "Impedancija petlje kvara Ex", summary: "IL - ExEi.IPK", columns: EXEI_IPK_COLUMNS, blankRowCount: 12, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
      tableSpec({ id: "exei-oi", label: "Otpor izolacije Ex", summary: "IL - ExEi.OI", columns: EIZ_OI_COLUMNS, blankRowCount: 12, blankSeed: { rd: ">1", pass: "DA" }, pageOrientation: "landscape" }),
      tableSpec({ id: "exei-zuds", label: "ZUDS Ex", summary: "IL - ExEi.ZUDS", columns: EIZ_ZUDS_COLUMNS, blankRowCount: 8, blankSeed: { separator: "/", pass: "DA" }, pageOrientation: "landscape" }),
      tableSpec({ id: "exei-pe", label: "Kontinuitet dodatnog PE vodica", summary: "IL - ExEi.PE", columns: EXEI_PE_COLUMNS, blankRowCount: 8, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
      tableSpec({ id: "exei-equipment", label: "Ex motori i oprema", summary: "IL - ExEi.oprema", columns: EXEI_EQUIPMENT_COLUMNS, blankRowCount: 8, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
      tableSpec({ id: "exei-bimetal", label: "Bimetal e i d", summary: "IL - ExEi.bimetal", columns: EXEI_BIMETAL_COLUMNS, blankRowCount: 8, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
    ],
  }),
  EXSE: createNativeReportPreset({
    serviceCode: "EXSE",
    serviceName: "Uzemljenje i staticki elektricitet u Ex prostoru",
    reportTitle: "ISPITIVANJE UZEMLJENJA I STATICKE ELEKTRICNOSTI U EX PROSTORU",
    coverSubtitle: "O ISPITIVANJU UZEMLJENJA I STATICKE ELEKTRICNOSTI",
    measurementTableTitle: "ExSe ispitni listovi",
    resultsText: EXSE_RESULTS_TEXT,
    projectDocumentation: EXSE_PROJECT_DOCUMENTATION,
    notes: ["Uvjet ispravnosti: otpor uzemljenja < 10 ohm; otpor savitljivih cijevi < 1 Mohm."],
    assessmentLabel: "Uzemljenje i staticki elektricitet",
    conclusionLead: "Temeljem rezultata mjerenja moze se zakljuciti da ispitivano uzemljenje i mjere zastite od statickog elektriciteta na dan predmetnog ispitivanja",
    signatureAreas: ["elektro", "ex"],
    technicalDataFields: EXSE_TECHNICAL_FIELDS,
    measurementAssessments: EXSE_MEASUREMENT_ASSESSMENTS,
    tables: [
      tableSpec({ id: "exse-results", label: "Uzemljenje i staticki elektricitet", summary: "Tablica 1. - ExSe rezultati", columns: EXSE_COLUMNS, blankRowCount: 12, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
    ],
  }),
  EXOV: createNativeReportPreset({
    serviceCode: "EXOV",
    serviceName: "Funkcionalno ispitivanje odzracnih ventila",
    reportTitle: "FUNKCIONALNO ISPITIVANJE ODZRACNIH VENTILA",
    coverSubtitle: "O FUNKCIONALNOM ISPITIVANJU ODZRACNIH VENTILA",
    measurementTableTitle: "Pregled funkcionalnog ispitivanja odzracnih ventila",
    resultsText: EXOV_RESULTS_TEXT,
    projectDocumentation: EXOV_PROJECT_DOCUMENTATION,
    assessmentLabel: "Odzracni ventili",
    conclusionLead: "Temeljem provedenog funkcionalnog ispitivanja moze se zakljuciti da odzracni ventili na dan predmetnog ispitivanja",
    signatureAreas: ["ex", "elektro"],
    technicalDataFields: [
      technicalField("fuelTanks", "Goriva / spremnici", ""),
      technicalField("method", "Mjerna metoda", "Vizualni pregled"),
      technicalField("functionalDescription", "Opis funkcionalnog ispitivanja", EXOV_FUNCTION_DESCRIPTION),
    ],
    checklists: [EXOV_CHECKLIST],
    measurementAssessments: [
      { id: "exov-assessment-function", key: "exov-assessment-function", label: "Funkcionalnost odzracnih ventila", enabledFieldId: "use-exov-function", defaultValue: "ZADOVOLJAVA" },
    ],
    tables: [],
  }),
  SVZ: createNativeReportPreset({
    serviceCode: "SVZ",
    serviceName: "Stabilni sustav za dojavu pozara",
    reportTitle: "ISPITIVANJE SUSTAVA ZA DOJAVU POZARA",
    coverSubtitle: "O ISPITIVANJU SUSTAVA ZA DOJAVU POZARA",
    measurementTableTitle: "Pregled sustava za dojavu pozara",
    resultsText: SVZ_RESULTS_TEXT,
    projectDocumentation: [
      "Projekt izvedenog stanja sustava tehnicke zastite.",
      "- Izjave o sukladnosti.",
      "- Upute instalatera.",
      "- Upute za rukovanje i odrzavanje.",
      "- Zapisnik od prethodnog ispitivanja.",
    ].join("\n"),
    assessmentLabel: "Stabilni sustav za dojavu pozara",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da stabilni sustav za dojavu pozara na dan predmetnog ispitivanja",
    validitySentence: "Ponovno ispitivanje sukladno vazecem Pravilniku o provjeri ispravnosti stabilnih sustava zastite od pozara mora biti provedeno do",
    signatureAreas: ["pozar"],
    technicalDataFields: SVZ_TECHNICAL_FIELDS,
    checklists: [
      makeChecklistFromItems({
        id: "svz-review",
        label: "Pregled i funkcionalno ispitivanje sustava za dojavu pozara",
        summary: "Vizualni pregled, simulacija javljaca, centrala, sirene, rezervno napajanje i sustavi u sprezi.",
        items: SVZ_REVIEW_ITEMS,
        assessmentLabel: "Stabilni sustav za dojavu pozara",
      }),
      makeChecklistFromItems({
        id: "svz-elements",
        label: "Oprema sustava za dojavu pozara",
        summary: "Centralni uredjaj, detektori, rucni javljaci, sirene, napajanje i sustavi u sprezi.",
        items: SVZ_SYSTEM_ELEMENTS,
        assessmentLabel: "Oprema sustava za dojavu pozara",
      }),
    ],
    measurementAssessments: makeAssessmentEntries("SVZ", [
      "Pregled izvedenog stanja prema dokumentaciji",
      "Funkcionalno ispitivanje sustava",
      "Stabilni sustav za dojavu pozara",
    ]),
    tables: [],
  }),
  SP: createNativeReportPreset({
    serviceCode: "SP",
    serviceName: "Sustav detekcije zapaljivih plinova",
    reportTitle: "ISPITIVANJE SUSTAVA DETEKCIJE ZAPALJIVIH PLINOVA",
    coverSubtitle: "O ISPITIVANJU SUSTAVA DETEKCIJE ZAPALJIVIH PLINOVA",
    measurementTableTitle: "Pregled sustava detekcije plina",
    resultsText: makeSimpleResultText("sustav detekcije zapaljivih plinova"),
    assessmentLabel: "Sustav detekcije zapaljivih plinova",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da sustav detekcije zapaljivih plinova na dan predmetnog ispitivanja",
    signatureAreas: ["pozar", "plin"],
    technicalDataFields: FIRE_SYSTEM_TECHNICAL_FIELDS,
    checklists: [makeChecklistFromItems({ id: "sp-review", label: "Pregled sustava detekcije plina", items: FIRE_REVIEW_ITEMS, assessmentLabel: "Sustav detekcije plina" })],
    measurementAssessments: makeAssessmentEntries("SP", ["Sustav detekcije zapaljivih plinova"]),
    tables: [
      tableSpec({ id: "sp-elements", label: "Elementi sustava detekcije plina", summary: "Centralni uredjaj, detektori i elementi sustava", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, ["Centralni uredjaj", "Detektori plina", "Sustavi u sprezi", "Funkcionalno ispitivanje"], "DA") }),
    ],
  }),
  HM: createNativeReportPreset({
    serviceCode: "HM",
    serviceName: "Hidrantska mreza",
    reportTitle: "ISPITIVANJE HIDRANTSKE MREZE",
    coverSubtitle: "O ISPITIVANJU HIDRANTSKE MREZE",
    measurementTableTitle: "Tablica 1. - pregled i mjerenje hidrantske mreze",
    resultsText: makeSimpleResultText("hidrantsku mrezu", "Pregled obuhvaca oznacenost, opremu, dostupnost i funkcionalnost hidranata te mjerenje tlakova i protoka."),
    assessmentLabel: "Hidrantska mreza",
    conclusionLead: "Temeljem rezultata pregleda i mjerenja moze se zakljuciti da hidrantska mreza na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    measurementAssessments: makeAssessmentEntries("HM", ["Pregled hidranata", "Mjerenje protoka i tlaka"]),
    tables: [
      tableSpec({ id: "hm-review", label: "Pregled hidranata", summary: "Tablica 1. - pregled hidranata", columns: HYDRANT_REVIEW_COLUMNS, blankRowCount: 8, blankSeed: { marked: "DA", equipment: "DA", available: "DA", functional: "DA" } }),
      tableSpec({ id: "hm-measurements", label: "Mjerenje hidrantske mreze", summary: "Tablica 2. - mjerenje protoka i tlaka", columns: HYDRANT_MEASUREMENT_COLUMNS, blankRowCount: 4, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
    ],
  }),
  HMU: createNativeReportPreset({
    serviceCode: "HMU",
    serviceName: "Unutarnja hidrantska mreza",
    reportTitle: "ISPITIVANJE UNUTARNJE HIDRANTSKE MREZE",
    coverSubtitle: "O ISPITIVANJU UNUTARNJE HIDRANTSKE MREZE",
    measurementTableTitle: "Tablica 1. - unutarnja hidrantska mreza",
    resultsText: makeSimpleResultText("unutarnju hidrantsku mrezu"),
    assessmentLabel: "Unutarnja hidrantska mreza",
    conclusionLead: "Temeljem rezultata pregleda i mjerenja moze se zakljuciti da unutarnja hidrantska mreza na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    measurementAssessments: makeAssessmentEntries("HMU", ["Pregled unutarnjih hidranata", "Mjerenje protoka i tlaka"]),
    tables: [
      tableSpec({ id: "hmu-review", label: "Pregled unutarnjih hidranata", summary: "Tablica 1. - pregled unutarnjih hidranata", columns: HYDRANT_REVIEW_COLUMNS, blankRowCount: 8, blankSeed: { marked: "DA", equipment: "DA", available: "DA", functional: "DA" } }),
      tableSpec({ id: "hmu-measurements", label: "Mjerenje unutarnje hidrantske mreze", summary: "Tablica 2. - mjerenje protoka i tlaka", columns: HYDRANT_MEASUREMENT_COLUMNS, blankRowCount: 4, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
    ],
  }),
  HMV: createNativeReportPreset({
    serviceCode: "HMV",
    serviceName: "Vanjska hidrantska mreza",
    reportTitle: "ISPITIVANJE VANJSKE HIDRANTSKE MREZE",
    coverSubtitle: "O ISPITIVANJU VANJSKE HIDRANTSKE MREZE",
    measurementTableTitle: "Tablica 1. - vanjska hidrantska mreza",
    resultsText: makeSimpleResultText("vanjsku hidrantsku mrezu"),
    assessmentLabel: "Vanjska hidrantska mreza",
    conclusionLead: "Temeljem rezultata pregleda i mjerenja moze se zakljuciti da vanjska hidrantska mreza na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    measurementAssessments: makeAssessmentEntries("HMV", ["Pregled vanjskih hidranata", "Mjerenje protoka i tlaka"]),
    tables: [
      tableSpec({ id: "hmv-review", label: "Pregled vanjskih hidranata", summary: "Tablica 1. - pregled vanjskih hidranata", columns: HYDRANT_REVIEW_COLUMNS, blankRowCount: 8, blankSeed: { marked: "DA", equipment: "DA", available: "DA", functional: "DA" } }),
      tableSpec({ id: "hmv-measurements", label: "Mjerenje vanjske hidrantske mreze", summary: "Tablica 2. - mjerenje protoka i tlaka", columns: HYDRANT_MEASUREMENT_COLUMNS, blankRowCount: 4, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
    ],
  }),
  HMUV: createNativeReportPreset({
    serviceCode: "HMUV",
    serviceName: "Unutarnja i vanjska hidrantska mreza",
    reportTitle: "ISPITIVANJE UNUTARNJE I VANJSKE HIDRANTSKE MREZE",
    coverSubtitle: "O ISPITIVANJU HIDRANTSKE MREZE",
    measurementTableTitle: "Tablica 1. - unutarnja i vanjska hidrantska mreza",
    resultsText: makeSimpleResultText("unutarnju i vanjsku hidrantsku mrezu"),
    assessmentLabel: "Unutarnja i vanjska hidrantska mreza",
    conclusionLead: "Temeljem rezultata pregleda i mjerenja moze se zakljuciti da unutarnja i vanjska hidrantska mreza na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    measurementAssessments: makeAssessmentEntries("HMUV", ["Pregled hidranata", "Mjerenje protoka i tlaka"]),
    tables: [
      tableSpec({ id: "hmuv-review", label: "Pregled hidranata", summary: "Tablica 1. - pregled hidranata", columns: HYDRANT_REVIEW_COLUMNS, blankRowCount: 10, blankSeed: { marked: "DA", equipment: "DA", available: "DA", functional: "DA" } }),
      tableSpec({ id: "hmuv-measurements", label: "Mjerenje hidrantske mreze", summary: "Tablica 2. - mjerenje protoka i tlaka", columns: HYDRANT_MEASUREMENT_COLUMNS, blankRowCount: 6, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
    ],
  }),
  SGP: createNativeReportPreset({
    serviceCode: "SGP",
    serviceName: "Sustav za gasenje pozara plinom",
    reportTitle: "ISPITIVANJE SUSTAVA ZA GASENJE POZARA PLINOM",
    coverSubtitle: "O ISPITIVANJU SUSTAVA ZA GASENJE POZARA PLINOM",
    measurementTableTitle: "Pregled sustava za gasenje pozara plinom",
    resultsText: makeSimpleResultText("sustav za gasenje pozara plinom"),
    assessmentLabel: "Sustav za gasenje pozara plinom",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da sustav za gasenje pozara plinom na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    technicalDataFields: FIRE_SYSTEM_TECHNICAL_FIELDS,
    checklists: [makeChecklistFromItems({ id: "sgp-review", label: "Pregled sustava za gasenje plinom", items: FIRE_REVIEW_ITEMS })],
    measurementAssessments: makeAssessmentEntries("SGP", ["Pregled izvedenog stanja prema dokumentaciji", "Funkcionalnost sustava"]),
    tables: [tableSpec({ id: "sgp-review-table", label: "Pregled sustava za gasenje plinom", summary: "Pregled i funkcionalno ispitivanje", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, FIRE_REVIEW_ITEMS, "DA") })],
  }),
  SS: createNativeReportPreset({
    serviceCode: "SS",
    serviceName: "Sprinkler sustav",
    reportTitle: "ISPITIVANJE SPRINKLER SUSTAVA",
    coverSubtitle: "O ISPITIVANJU SPRINKLER SUSTAVA",
    measurementTableTitle: "Pregled sprinkler sustava",
    resultsText: makeSimpleResultText("sprinkler sustav"),
    assessmentLabel: "Sprinkler sustav",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da sprinkler sustav na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    technicalDataFields: FIRE_SYSTEM_TECHNICAL_FIELDS,
    checklists: [makeChecklistFromItems({ id: "ss-review", label: "Pregled sprinkler sustava", items: FIRE_REVIEW_ITEMS })],
    measurementAssessments: makeAssessmentEntries("SS", ["Pregled izvedenog stanja", "Funkcionalnost sprinkler sustava"]),
    tables: [tableSpec({ id: "ss-review-table", label: "Pregled sprinkler sustava", summary: "Pregled i funkcionalno ispitivanje", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, FIRE_REVIEW_ITEMS, "DA") })],
  }),
  PJENA: createNativeReportPreset({
    serviceCode: "PJENA",
    serviceName: "Sustav za gasenje pozara pjenom",
    reportTitle: "ISPITIVANJE SUSTAVA ZA GASENJE POZARA PJENOM",
    coverSubtitle: "O ISPITIVANJU SUSTAVA ZA GASENJE POZARA PJENOM",
    measurementTableTitle: "Pregled sustava za gasenje pjenom",
    resultsText: makeSimpleResultText("sustav za gasenje pozara pjenom"),
    assessmentLabel: "Sustav za gasenje pozara pjenom",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da sustav za gasenje pozara pjenom na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    technicalDataFields: FIRE_SYSTEM_TECHNICAL_FIELDS,
    checklists: [makeChecklistFromItems({ id: "pjena-review", label: "Pregled sustava za gasenje pjenom", items: FIRE_REVIEW_ITEMS })],
    measurementAssessments: makeAssessmentEntries("PJENA", ["Pregled izvedenog stanja", "Funkcionalnost sustava za gasenje pjenom"]),
    tables: [tableSpec({ id: "pjena-review-table", label: "Pregled sustava za gasenje pjenom", summary: "Pregled i funkcionalno ispitivanje", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, FIRE_REVIEW_ITEMS, "DA") })],
  }),
  SO: createNativeReportPreset({
    serviceCode: "SO",
    serviceName: "Sustav za odvodjenje dima i topline",
    reportTitle: "ISPITIVANJE SUSTAVA ZA ODVODJENJE DIMA I TOPLINE",
    coverSubtitle: "O ISPITIVANJU SUSTAVA ZA ODVODJENJE DIMA I TOPLINE",
    measurementTableTitle: "Pregled sustava za odvodjenje dima i topline",
    resultsText: makeSimpleResultText("sustav za odvodjenje dima i topline"),
    assessmentLabel: "Sustav za odvodjenje dima i topline",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da sustav za odvodjenje dima i topline na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    technicalDataFields: FIRE_SYSTEM_TECHNICAL_FIELDS,
    checklists: [makeChecklistFromItems({ id: "so-review", label: "Pregled sustava za odvodjenje dima i topline", items: FIRE_REVIEW_ITEMS })],
    measurementAssessments: makeAssessmentEntries("SO", ["Pregled izvedenog stanja", "Funkcionalnost sustava"]),
    tables: [tableSpec({ id: "so-review-table", label: "Pregled sustava za odvodjenje dima i topline", summary: "Pregled i funkcionalno ispitivanje", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, FIRE_REVIEW_ITEMS, "DA") })],
  }),
  PZ: createNativeReportPreset({
    serviceCode: "PZ",
    serviceName: "Vatrootporne zavjese",
    reportTitle: "ISPITIVANJE VATROOTPORNIH ZAVJESA",
    coverSubtitle: "O ISPITIVANJU VATROOTPORNIH ZAVJESA",
    measurementTableTitle: "Pregled vatrootpornih zavjesa",
    resultsText: makeSimpleResultText("vatrootporne zavjese"),
    assessmentLabel: "Vatrootporne zavjese",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da vatrootporne zavjese na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    technicalDataFields: FIRE_SYSTEM_TECHNICAL_FIELDS,
    checklists: [makeChecklistFromItems({ id: "pz-review", label: "Pregled vatrootpornih zavjesa", items: FIRE_REVIEW_ITEMS })],
    measurementAssessments: makeAssessmentEntries("PZ", ["Pregled izvedenog stanja", "Funkcionalnost sustava"]),
    tables: [tableSpec({ id: "pz-review-table", label: "Pregled vatrootpornih zavjesa", summary: "Pregled i funkcionalno ispitivanje", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, FIRE_REVIEW_ITEMS, "DA") })],
  }),
  PPV: createNativeReportPreset({
    serviceCode: "PPV",
    serviceName: "Protupozarna vrata",
    reportTitle: "ISPITIVANJE PROTUPOZARNIH VRATA",
    coverSubtitle: "O ISPITIVANJU PROTUPOZARNIH VRATA",
    measurementTableTitle: "Tablica 1. - pregled protupozarnih vrata",
    resultsText: makeSimpleResultText("protupozarna vrata"),
    assessmentLabel: "Protupozarna vrata",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da protupozarna vrata na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    measurementAssessments: makeAssessmentEntries("PPV", ["Pregled izvedenog stanja prema dokumentaciji", "Funkcionalnost vrata", "Veza sa sustavom za dojavu pozara"]),
    tables: [tableSpec({ id: "ppv-doors", label: "Protupozarna vrata", summary: "Tablica 1. - protupozarna vrata", columns: PPV_COLUMNS, blankRowCount: 8, blankSeed: { pass: "DA" } })],
  }),
  PPZ: createNativeReportPreset({
    serviceCode: "PPZ",
    serviceName: "Protupozarne zaklopke",
    reportTitle: "ISPITIVANJE PROTUPOZARNIH ZAKLOPKI",
    coverSubtitle: "O ISPITIVANJU PROTUPOZARNIH ZAKLOPKI",
    measurementTableTitle: "Tablica 1. - pregled protupozarnih zaklopki",
    resultsText: makeSimpleResultText("protupozarne zaklopke"),
    assessmentLabel: "Protupozarne zaklopke",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da protupozarne zaklopke na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    measurementAssessments: makeAssessmentEntries("PPZ", ["Pregled izvedenog stanja", "Funkcionalnost zaklopki", "Veza sa sustavom dojave"]),
    tables: [tableSpec({ id: "ppz-dampers", label: "Protupozarne zaklopke", summary: "Tablica 1. - protupozarne zaklopke", columns: PPZ_COLUMNS, blankRowCount: 8, blankSeed: { functional: "DA", alarmLink: "DA", pass: "DA" }, pageOrientation: "landscape" })],
  }),
  DS: createNativeReportPreset({
    serviceCode: "DS",
    serviceName: "Drencher sustav za hladjenje spremnika vodom",
    reportTitle: "ISPITIVANJE DRENCHER SUSTAVA ZA HLADJENJE SPREMNIKA VODOM",
    coverSubtitle: "O ISPITIVANJU DRENCHER SUSTAVA",
    measurementTableTitle: "Tablica 1. - drencher sustav",
    resultsText: makeSimpleResultText("drencher sustav za hladjenje spremnika vodom"),
    assessmentLabel: "Drencher sustav",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da drencher sustav na dan predmetnog ispitivanja",
    signatureAreas: ["pozar"],
    measurementAssessments: makeAssessmentEntries("DS", ["Pregled izvedenog stanja prema dokumentaciji", "Funkcionalnost drencher sustava"]),
    tables: [tableSpec({ id: "ds-measurements", label: "Drencher sustav", summary: "Tablica 1. - tlakovi i protoci drencher sustava", columns: HYDRANT_MEASUREMENT_COLUMNS, blankRowCount: 4, blankSeed: { pass: "DA" }, pageOrientation: "landscape" })],
  }),
  PLINSKAKOTLOVNICA: createNativeReportPreset({
    serviceCode: "PLINSKAKOTLOVNICA",
    serviceName: "Plinska kotlovnica",
    reportTitle: "PREGLED PLINSKE KOTLOVNICE",
    coverSubtitle: "O PREGLEDU PLINSKE KOTLOVNICE",
    measurementTableTitle: "Checklist plinske kotlovnice",
    resultsText: makeSimpleResultText("plinsku kotlovnicu"),
    assessmentLabel: "Plinska kotlovnica",
    conclusionLead: "Temeljem rezultata pregleda moze se zakljuciti da plinska kotlovnica na dan predmetnog pregleda",
    signatureAreas: ["plin"],
    technicalDataFields: GAS_TECHNICAL_FIELDS,
    checklists: [makeChecklistFromItems({ id: "plinska-kotlovnica-review", label: "Pregled plinske kotlovnice", items: ["Kotlovnica - gradjevinski objekt", "Tehnicke mjere zastite", "Plinska instalacija", "Kotlovsko postrojenje", "Uredjaji za upravljanje", "Radni i sigurnosni elementi", "Signalni i mjerni uredjaji", "Ventilacija prostora", "Oprema za pocetno gasenje pozara", "Elektricna instalacija kotlovnice"] })],
    measurementAssessments: makeAssessmentEntries("PLINSKAKOTLOVNICA", ["Plinska kotlovnica"]),
    tables: [tableSpec({ id: "plinskakotlovnica-review", label: "Pregled plinske kotlovnice", summary: "Checklist plinske kotlovnice", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, ["Gradjevinski objekt", "Tehnicke mjere zastite", "Plinska instalacija", "Ventilacija", "Elektricna instalacija"], "DA") })],
  }),
  NPI: createNativeReportPreset({
    serviceCode: "NPI",
    serviceName: "Nepropusnost i ispravnost plinske instalacije",
    reportTitle: "ISPITIVANJE NEPROPUSNOSTI I ISPRAVNOSTI PLINSKE INSTALACIJE",
    coverSubtitle: "O ISPITIVANJU PLINSKE INSTALACIJE",
    measurementTableTitle: "Tablice ispitivanja plinske instalacije",
    resultsText: makeSimpleResultText("plinsku instalaciju", "Ispitivanje ukljucuje podatke plinomjera, volumen instalacije, tlacnu probu, trosila i ocjene plinske instalacije."),
    assessmentLabel: "Plinska instalacija",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da plinska instalacija na dan predmetnog ispitivanja",
    signatureAreas: ["plin"],
    technicalDataFields: GAS_TECHNICAL_FIELDS,
    checklists: [makeChecklistFromItems({ id: "npi-assessment", label: "Ocjena plinske instalacije", items: GAS_ASSESSMENT_ITEMS })],
    measurementAssessments: makeAssessmentEntries("NPI", GAS_ASSESSMENT_ITEMS),
    tables: [
      tableSpec({ id: "npi-volume", label: "Volumen instalacije", summary: "Tablica volumena instalacije", columns: GAS_VOLUME_COLUMNS, blankRowCount: 5 }),
      tableSpec({ id: "npi-pressure", label: "Tlacna proba", summary: "Tablica tlacne probe", columns: GAS_PRESSURE_COLUMNS, blankRowCount: 5 }),
    ],
  }),
  UNP: createNativeReportPreset({
    serviceCode: "UNP",
    serviceName: "Nepropusnost i ispravnost UNP instalacije",
    reportTitle: "ISPITIVANJE NEPROPUSNOSTI I ISPRAVNOSTI UNP INSTALACIJE",
    coverSubtitle: "O ISPITIVANJU UNP INSTALACIJE",
    measurementTableTitle: "Tablice ispitivanja UNP instalacije",
    resultsText: makeSimpleResultText("UNP instalaciju", "Ispitivanje koristi isti model kao NPI uz oznaku UNP instalacije."),
    assessmentLabel: "UNP instalacija",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da UNP instalacija na dan predmetnog ispitivanja",
    signatureAreas: ["plin"],
    technicalDataFields: GAS_TECHNICAL_FIELDS,
    checklists: [makeChecklistFromItems({ id: "unp-assessment", label: "Ocjena UNP instalacije", items: GAS_ASSESSMENT_ITEMS })],
    measurementAssessments: makeAssessmentEntries("UNP", GAS_ASSESSMENT_ITEMS),
    tables: [
      tableSpec({ id: "unp-volume", label: "Volumen instalacije", summary: "Tablica volumena UNP instalacije", columns: GAS_VOLUME_COLUMNS, blankRowCount: 5 }),
      tableSpec({ id: "unp-pressure", label: "Tlacna proba", summary: "Tablica tlacne probe UNP instalacije", columns: GAS_PRESSURE_COLUMNS, blankRowCount: 5 }),
    ],
  }),
  ROF: createNativeReportPreset({
    serviceCode: "ROF",
    serviceName: "Radni okolis - fizikalni cimbenici",
    reportTitle: "ISPITIVANJE FIZIKALNIH CIMBENIKA RADNOG OKOLISA",
    coverSubtitle: "O ISPITIVANJU RADNOG OKOLISA - FIZIKALNI CIMBENICI",
    measurementTableTitle: "Tablica 1. - mjerenja fizikalnih cimbenika",
    resultsText: makeSimpleResultText("fizikalne cimbenike radnog okolisa", "Ispitivanje obuhvaca osvijetljenost, buku, temperaturu, brzinu strujanja zraka i relativnu vlaznost."),
    assessmentLabel: "Fizikalni cimbenici radnog okolisa",
    conclusionLead: "Temeljem rezultata mjerenja moze se zakljuciti da fizikalni cimbenici radnog okolisa na dan predmetnog ispitivanja",
    signatureAreas: ["znr"],
    technicalDataFields: WORK_ENVIRONMENT_TECHNICAL_FIELDS,
    measurementAssessments: makeAssessmentEntries("ROF", ["Osvijetljenost", "Buka", "Mikroklima"]),
    tables: [
      tableSpec({ id: "rof-measurements", label: "Fizikalni cimbenici", summary: "Tablica 1. - mjerenja fizikalnih cimbenika", columns: ROF_COLUMNS, blankRowCount: 8, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
    ],
  }),
  ROK: createNativeReportPreset({
    serviceCode: "ROK",
    serviceName: "Radni okolis - kemijski cimbenici",
    reportTitle: "ISPITIVANJE KEMIJSKIH CIMBENIKA RADNOG OKOLISA",
    coverSubtitle: "O ISPITIVANJU RADNOG OKOLISA - KEMIJSKI CIMBENICI",
    measurementTableTitle: "Tablica 1. - mjerenja kemijskih cimbenika",
    resultsText: makeSimpleResultText("kemijske cimbenike radnog okolisa", "Ispitivanje obuhvaca stetnosti, izmjerene vrijednosti, izracun u odnosu na 8 sati i usporedbu s GVI/KGVI."),
    assessmentLabel: "Kemijski cimbenici radnog okolisa",
    conclusionLead: "Temeljem rezultata mjerenja moze se zakljuciti da kemijski cimbenici radnog okolisa na dan predmetnog ispitivanja",
    signatureAreas: ["znr"],
    technicalDataFields: WORK_ENVIRONMENT_TECHNICAL_FIELDS,
    measurementAssessments: makeAssessmentEntries("ROK", ["Kemijske stetnosti", "GVI/KGVI"]),
    tables: [
      tableSpec({ id: "rok-measurements", label: "Kemijski cimbenici", summary: "Tablica 1. - mjerenja kemijskih cimbenika", columns: ROK_COLUMNS, blankRowCount: 8, blankSeed: { pass: "DA" }, pageOrientation: "landscape" }),
    ],
  }),
  STROJEVI: createNativeReportPreset({
    serviceCode: "STROJEVI",
    serviceName: "Nadzor opreme",
    reportTitle: "ZAPISNIK O NADZORU OPREME",
    coverSubtitle: "O NADZORU OPREME",
    measurementTableTitle: "Rezultati ispitivanja",
    resultsText: makeSimpleResultText("strojeve i uredaje", "Model je pripremljen prema STROJEVI.1 unosu i STROJEVI.2 izlaznom predlosku. Ispitne stavke su proizvoljne po stroju/uredaju."),
    assessmentLabel: "Nadzor opreme",
    conclusionLead: "Temeljem rezultata pregleda moze se zakljuciti da oprema na dan predmetnog nadzora",
    signatureAreas: ["strojevi", "radna_oprema", "znr"],
    technicalDataFields: STROJEVI_TECHNICAL_FIELDS,
    measurementAssessments: makeAssessmentEntries("STROJEVI", ["Nadzor opreme"]),
    tables: [
      tableSpec({
        id: "strojevi-results",
        label: "Rezultati ispitivanja",
        summary: "STROJEVI.1 - proizvoljne ispitne stavke",
        columns: STROJEVI_RESULT_COLUMNS,
        rows: STROJEVI_DEFAULT_ITEMS.map((item, index) => makeRow(STROJEVI_RESULT_COLUMNS, {
          item,
          pass: "DA",
        }, index)),
        pageOrientation: "portrait",
      }),
    ],
  }),
  NO: createNativeReportPreset({
    serviceCode: "NO",
    serviceName: "Nadzor opreme",
    reportTitle: "ZAPISNIK O NADZORU OPREME",
    coverSubtitle: "O NADZORU OPREME",
    measurementTableTitle: "Checklist nadzora opreme",
    resultsText: makeSimpleResultText("opremu", "Model je pripremljen za lokalni zapisnik po opremi i checklist stavke prema vrsti stroja/opreme."),
    assessmentLabel: "Nadzor opreme",
    conclusionLead: "Temeljem rezultata pregleda moze se zakljuciti da oprema na dan predmetnog nadzora",
    signatureAreas: ["strojevi", "radna_oprema", "znr"],
    technicalDataFields: WORK_EQUIPMENT_TECHNICAL_FIELDS,
    measurementAssessments: makeAssessmentEntries("NO", ["Nadzor opreme"]),
    tables: [
      tableSpec({
        id: "no-checklist",
        label: "Checklist nadzora opreme",
        summary: "Stavke pregleda opreme",
        columns: WORK_EQUIPMENT_COLUMNS,
        rows: WORK_EQUIPMENT_ITEMS.map((item, index) => makeRow(WORK_EQUIPMENT_COLUMNS, {
          number: String(index + 1),
          category: "Nadzor opreme",
          item,
          pass: "DA",
          locked: "NE",
        }, index)),
        pageOrientation: "landscape",
      }),
    ],
  }),
  RADNAOPREMA: createNativeReportPreset({
    serviceCode: "RADNAOPREMA",
    serviceName: "Radna oprema",
    reportTitle: "ZAPISNIK O ISPITIVANJU RADNE OPREME",
    coverSubtitle: "O ISPITIVANJU RADNE OPREME",
    measurementTableTitle: "Checklist radne opreme",
    resultsText: makeSimpleResultText("radnu opremu"),
    assessmentLabel: "Radna oprema",
    conclusionLead: "Temeljem rezultata pregleda i ispitivanja moze se zakljuciti da radna oprema na dan predmetnog ispitivanja",
    signatureAreas: ["strojevi", "znr"],
    technicalDataFields: WORK_EQUIPMENT_TECHNICAL_FIELDS,
    measurementAssessments: makeAssessmentEntries("RADNAOPREMA", ["Radna oprema"]),
    tables: [
      tableSpec({
        id: "radnaoprema-checklist",
        label: "Checklist radne opreme",
        summary: "Stavke pregleda radne opreme",
        columns: WORK_EQUIPMENT_COLUMNS,
        rows: WORK_EQUIPMENT_ITEMS.map((item, index) => makeRow(WORK_EQUIPMENT_COLUMNS, {
          number: String(index + 1),
          category: "Radna oprema",
          item,
          pass: "DA",
          locked: "NE",
        }, index)),
        pageOrientation: "landscape",
      }),
    ],
  }),
  PE: createNativeReportPreset({
    serviceCode: "PE",
    serviceName: "Plan evakuacije",
    reportTitle: "PLAN EVAKUACIJE I SPASAVANJA",
    coverSubtitle: "PLAN EVAKUACIJE",
    measurementTableTitle: "Elementi plana evakuacije",
    resultsText: makeSimpleResultText("plan evakuacije", "Plan sadrzi osnovne podatke objekta, evakuacijske smjerove, zborno mjesto, osobe zaduzene za evakuaciju i priloge/skice."),
    assessmentLabel: "Plan evakuacije",
    conclusionLead: "Temeljem izradjenog plana moze se zakljuciti da plan evakuacije",
    validitySentence: "Plan evakuacije potrebno je pregledati do",
    signatureAreas: ["znr"],
    technicalDataFields: EVACUATION_PLAN_FIELDS,
    tables: [
      tableSpec({ id: "pe-plan", label: "Elementi plana evakuacije", summary: "Osnovni elementi plana evakuacije", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, ["Objekt", "Evakuacijski smjerovi", "Zborno mjesto", "Osobe zaduzene za evakuaciju", "Prilozi/skice"], "DA") }),
    ],
  }),
  NNZD: createNativeReportPreset({
    serviceCode: "NNZD",
    serviceName: "Negativni nalaz tehnickih ispitivanja",
    reportTitle: "NEGATIVNI NALAZ TEHNICKIH ISPITIVANJA",
    coverSubtitle: "NEGATIVNI NALAZ",
    measurementTableTitle: "Pregled nesukladnosti",
    resultsText: makeSimpleResultText("negativni nalaz", "U zapisnik se upisuju nesukladnosti, sto treba otkloniti i napomene za prijavu."),
    assessmentLabel: "Negativni nalaz",
    conclusionLead: "Temeljem provedenog pregleda utvrdjuje se da predmetni nalaz",
    signatureAreas: ["znr"],
    technicalDataFields: NEGATIVE_FINDING_FIELDS,
    tables: [
      tableSpec({ id: "nnzd-findings", label: "Pregled nesukladnosti", summary: "Nesukladnosti i mjere za otklanjanje", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, ["Nesukladnost", "Sto treba otkloniti", "Napomena"], "NE") }),
    ],
  }),
  NNZDPETROL: createNativeReportPreset({
    serviceCode: "NNZDPETROL",
    serviceName: "Petrol negativni nalaz",
    reportTitle: "NEGATIVNI NALAZ - PETROL",
    coverSubtitle: "PETROL NEGATIVNI NALAZ",
    measurementTableTitle: "Pregled nesukladnosti",
    resultsText: makeSimpleResultText("Petrol negativni nalaz", "Model ukljucuje nesukladnost, mjere otklanjanja i SAP Fiori / internu prijavu."),
    assessmentLabel: "Petrol negativni nalaz",
    conclusionLead: "Temeljem provedenog pregleda utvrdjuje se da predmetni nalaz",
    signatureAreas: ["znr"],
    technicalDataFields: NEGATIVE_FINDING_FIELDS,
    tables: [
      tableSpec({ id: "nnzdpetrol-findings", label: "Pregled nesukladnosti Petrol", summary: "Nesukladnosti i mjere za otklanjanje", columns: TEXT_REVIEW_COLUMNS, rows: rowsFromItems(TEXT_REVIEW_COLUMNS, ["Nesukladnost", "Sto treba otkloniti", "SAP Fiori / napomena"], "NE") }),
    ],
  }),
  EOTP: createNativeReportPreset({
    serviceCode: "EOTP",
    serviceName: "Evidencija ostalih tehnickih podataka",
    reportTitle: "EVIDENCIJA OSTALIH TEHNICKIH PODATAKA",
    coverSubtitle: "EVIDENCIJA TEHNICKIH PODATAKA",
    measurementTableTitle: "Tehnicki podaci",
    resultsText: makeSimpleResultText("ostale tehnicke podatke"),
    assessmentLabel: "Tehnicki podaci",
    conclusionLead: "Temeljem pregleda tehnickih podataka moze se zakljuciti da evidencija",
    signatureAreas: ["znr"],
    tables: [
      tableSpec({ id: "eotp-data", label: "Tehnicki podaci", summary: "Pregled tehnickih podataka", columns: TEXT_REVIEW_COLUMNS, blankRowCount: 6, blankSeed: { pass: "DA" } }),
    ],
  }),
});

export function getDocumentationNativeReportPreset(serviceCode = "") {
  return DOCUMENTATION_NATIVE_REPORT_PRESETS[normalizeCode(serviceCode)] || DOCUMENTATION_NATIVE_REPORT_PRESETS.SPR;
}

export function createDocumentationMeasurementTablesForService(serviceCode = "") {
  const preset = getDocumentationNativeReportPreset(serviceCode);
  const nativeTables = getCistaNativeTableSpecsForService(preset.serviceCode) || preset.tables;
  return nativeTables.map((table) => ({
    id: table.id,
    key: table.key,
    tokenKey: table.tokenKey,
    label: table.label,
    helpText: "Gridline tablica popunjava rezultate za odabranu uslugu.",
    summary: table.summary,
    enabledByDefault: table.enabledByDefault !== false,
    enabledFieldId: table.enabledFieldId || `use-${table.id}`,
    assessmentLabel: table.assessmentLabel || "",
    chapterTitle: table.chapterTitle || "",
    pageOrientation: table.pageOrientation === "landscape" ? "landscape" : "portrait",
    sourceSheet: table.sourceSheet || "",
    formulaOnly: table.formulaOnly === true,
    includeInReport: table.includeInReport !== false,
    sheet: {
      columns: table.columns.map((column) => withDocumentationColumnAiMapping(table.id, column)),
      rows: table.rows.map((row, index) => ({
        id: row.id || `measurement-row-${index + 1}`,
        cells: { ...(row.cells || {}) },
        formats: { ...(row.formats || {}) },
      })),
      merges: Array.isArray(table.merges) ? table.merges.map((merge) => ({ ...merge })) : [],
      headerRows: Array.isArray(table.headerRows) ? [...table.headerRows] : [],
    },
  }));
}

export function createDocumentationChecklistsForService(serviceCode = "") {
  const preset = getDocumentationNativeReportPreset(serviceCode);
  return (preset.checklists || []).map((checklist) => ({
    id: checklist.id,
    key: checklist.key || checklist.id,
    tokenKey: checklist.tokenKey || normalizeCode(checklist.id).replace(/[^A-Z0-9]+/g, "_"),
    label: checklist.label,
    summary: checklist.summary || checklist.label,
    enabledByDefault: checklist.enabledByDefault !== false,
    enabledFieldId: checklist.enabledFieldId || `use-${checklist.id}`,
    assessmentLabel: checklist.assessmentLabel || "",
    options: normalizeDocumentationOptions(checklist.options || YES_NO_NP_VALUES),
    items: (checklist.items || []).map((item, index) => ({
      id: item.id || `${checklist.id}-${index + 1}`,
      key: item.key || item.id || `${checklist.id}-${index + 1}`,
      tokenKey: item.tokenKey || normalizeCode(item.id || `${checklist.id}-${index + 1}`).replace(/[^A-Z0-9]+/g, "_"),
      label: item.label || `Stavka ${index + 1}`,
      defaultValue: item.defaultValue || "DA",
      options: Array.isArray(item.options) && item.options.length ? normalizeDocumentationOptions(item.options) : null,
    })),
  }));
}

export function createDocumentationMeasurementAssessmentsForService(serviceCode = "") {
  const preset = getDocumentationNativeReportPreset(serviceCode);
  return (preset.measurementAssessments || []).map((entry, index) => ({
    id: entry.id || `assessment-${index + 1}`,
    key: entry.key || entry.id || `assessment-${index + 1}`,
    label: entry.label || `Ocjena ${index + 1}`,
    enabledFieldId: entry.enabledFieldId || "",
    defaultValue: entry.defaultValue || "ZADOVOLJAVA",
  }));
}

export function createDocumentationNativeAiFieldsForService(serviceCode = "") {
  const preset = getDocumentationNativeReportPreset(serviceCode);
  const resultContext = DOCUMENTATION_RESULT_AI_CONTEXT_BY_SERVICE[preset.serviceCode]
    || DOCUMENTATION_RESULT_AI_CONTEXT_BY_SERVICE.SPR;
  const technicalFields = (preset.technicalDataFields || [])
    .map((field) => withDocumentationTechnicalFieldAi(preset.serviceCode, field))
    .filter((field) => field?.ai);
  const resultFields = [
    {
      id: "resultStatus",
      key: "resultStatus",
      label: "Zadovoljava",
      type: "boolean",
      fieldType: "toggle",
      required: true,
      ai: makeAiConfig({
        key: "resultStatus",
        label: "Zadovoljava",
        type: "boolean",
        group: "Zakljucak",
        aiDescription: `Predlozi ukupnu zakljucnu ocjenu za ${resultContext.subject} temeljem starog zapisnika, projekta, slike ili popunjenih Gridline tablica. Vrati true za zadovoljava i false za ne zadovoljava.`,
        aiLookFor: resultContext.resultLookFor,
        aiAvoid: `${resultContext.aiAvoid} Ne vracaj false ako nema jasnog nedostatka ili negativne ocjene. Ako nije sigurno, vrati true i dodaj upozorenje.`,
        allowedValues: ["true", "false"],
        commonValues: ["true"],
        fallbackValue: "true",
        validationRules: "false koristi samo kada stari zapisnik ili rezultati jasno pokazuju neispravnost.",
        confidenceRequired: "high",
      }),
    },
    {
      id: "defects",
      key: "defects",
      label: "Nedostaci",
      type: "text",
      fieldType: "textarea",
      required: false,
      ai: makeAiConfig({
        key: "defects",
        label: "Nedostaci",
        type: "text",
        group: "Zakljucak",
        aiDescription: "Prepiši ili sazetkom predlozi nedostatke iz starog zapisnika, projekta ili fotografija. Ako nema nedostataka, vrati prazno.",
        aiLookFor: ["nedostaci", "ne zadovoljava", "neispravno", "primjedbe", "otkloniti"],
        aiAvoid: "Ne izmisljaj nedostatke. Ako dokument ne navodi nedostatke, ostavi prazno.",
        ...{
          aiDescription: `Prepisi ili sazetkom predlozi nedostatke za ${resultContext.subject} iz starog zapisnika, projekta ili fotografija. Ako nema nedostataka, vrati prazno.`,
          aiLookFor: resultContext.defectsLookFor,
          aiAvoid: `${resultContext.aiAvoid} Ne izmisljaj nedostatke. Ako dokument ne navodi nedostatke, ostavi prazno.`,
        },
        fallbackValue: "",
        confidenceRequired: "high",
      }),
    },
    {
      id: "recommendations",
      key: "recommendations",
      label: "Preporuke",
      type: "text",
      fieldType: "textarea",
      required: false,
      ai: makeAiConfig({
        key: "recommendations",
        label: "Preporuke",
        type: "text",
        group: "Zakljucak",
        aiDescription: "Predlozi preporuke ili napomene za korisnika samo ako se mogu temeljiti na starom zapisniku, projektu, slici ili rezultatima mjerenja.",
        aiLookFor: ["preporuke", "napomena", "primjedba", "potrebno", "predlaze se"],
        aiAvoid: "Ne dodaj opcenite preporuke koje nisu povezane s ucitanim izvorima.",
        ...{
          aiDescription: `Predlozi preporuke ili napomene za ${resultContext.subject} samo ako se mogu temeljiti na starom zapisniku, projektu, slici ili rezultatima mjerenja.`,
          aiLookFor: resultContext.recommendationsLookFor,
          aiAvoid: `${resultContext.aiAvoid} Ne dodaj opcenite preporuke koje nisu povezane s ucitanim izvorima.`,
        },
        fallbackValue: "",
        confidenceRequired: "medium",
      }),
    },
  ];
  const projectDocumentationFields = preset.serviceCode === "EIZ" || String(preset.projectDocumentation || "").trim()
    ? [{
        id: "KORISTENA_DOKUMENTACIJA",
        key: "KORISTENA_DOKUMENTACIJA",
        label: "Tehnička dokumentacija",
        type: "text",
        fieldType: "textarea",
        required: false,
        ai: makeProjectDocumentationAi({
          key: "KORISTENA_DOKUMENTACIJA",
          label: "Tehnička dokumentacija",
          defaultValue: preset.projectDocumentation || "",
        }),
      }]
    : [];
  return [
    ...technicalFields.map((field) => ({
      id: `technical-${field.id || field.key}`,
      key: `technical-${field.id || field.key}`,
      label: field.label || "Tehnicki podatak",
      type: "text",
      fieldType: "text",
      required: false,
      ai: { ...field.ai },
    })),
    ...projectDocumentationFields,
    ...resultFields,
  ];
}

export function createDocumentationNativeAiMeasurementColumnsForService(serviceCode = "") {
  const preset = getDocumentationNativeReportPreset(serviceCode);
  return preset.tables.flatMap((table) => (
    table.columns
      .map((column, columnIndex) => {
        const aiMapping = getDocumentationColumnAiMapping(table.id, column.id)
          || getGenericDocumentationColumnAiMapping(table.id, column);
        if (!aiMapping) {
          return null;
        }
        return {
          fieldId: table.id,
          fieldKey: table.key,
          fieldLabel: table.label,
          fieldDescription: table.summary,
          columnId: column.id,
          columnIndex,
          columnLetter: getSpreadsheetColumnLabel(columnIndex),
          key: aiMapping.key || column.id,
          label: aiMapping.label || column.label || column.id,
          type: aiMapping.type || "text",
          required: Boolean(aiMapping.required),
          placeholder: column.placeholder || aiMapping.placeholder || "",
          helpText: aiMapping.helpText || aiMapping.description || aiMapping.aiDescription || "",
          aiMapping: { ...aiMapping },
        };
      })
      .filter(Boolean)
  ));
}

export function createDocumentationGridlineRowsForService(serviceCode = "") {
  const table = getDocumentationNativeReportPreset(serviceCode).tables[0];
  const columns = table.columns;
  const header = columns.map((column) => column.label);
  const units = columns.map((column) => column.placeholder || "");
  const rows = table.rows.map((row) => columns.map((column) => row.cells?.[column.id] || ""));
  return [header, units, ...rows];
}

export function createDocumentationReportModelDefaults(serviceCode = "") {
  const preset = getDocumentationNativeReportPreset(serviceCode);
  return {
    serviceCode: preset.serviceCode,
    serviceName: preset.serviceName,
    title: preset.title,
    documentType: preset.documentType,
    reportTitle: preset.reportTitle,
    coverSubtitle: preset.coverSubtitle,
    measurementTableTitle: preset.measurementTableTitle,
    systemDescription: preset.systemDescription || "",
    resultsText: preset.resultsText,
    eiNote: preset.notes[0] || "",
    eiminNote: preset.notes[1] || "",
    assessmentLabel: preset.assessmentLabel,
    conclusionLead: preset.conclusionLead,
    validitySentence: preset.validitySentence,
    projectDocumentation: preset.projectDocumentation || "",
    signatureAreas: [...preset.signatureAreas],
    technicalDataFields: (preset.technicalDataFields || []).map((field) => withDocumentationTechnicalFieldAi(preset.serviceCode, field)),
    checklists: createDocumentationChecklistsForService(preset.serviceCode),
    measurementAssessments: createDocumentationMeasurementAssessmentsForService(preset.serviceCode),
    measurementTables: createDocumentationMeasurementTablesForService(preset.serviceCode),
  };
}

export function getDocumentationNativeTemplateSeedPresets() {
  return Object.values(DOCUMENTATION_NATIVE_REPORT_PRESETS).map((preset) => ({
    id: `${slugify(preset.serviceCode)}-v1-0-0`,
    name: preset.title,
    title: preset.title,
    documentType: preset.documentType,
    serviceCode: preset.serviceCode,
    serviceName: preset.serviceName,
    reportTitle: preset.reportTitle,
    coverSubtitle: preset.coverSubtitle,
    measurementTableTitle: preset.measurementTableTitle,
    systemDescription: preset.systemDescription || "",
    resultsText: preset.resultsText,
    eiNote: preset.notes[0] || "",
    eiminNote: preset.notes[1] || "",
    assessmentLabel: preset.assessmentLabel,
    conclusionLead: preset.conclusionLead,
    validitySentence: preset.validitySentence,
    projectDocumentation: preset.projectDocumentation || "",
    signatureAreas: [...preset.signatureAreas],
    technicalDataFields: (preset.technicalDataFields || []).map((field) => withDocumentationTechnicalFieldAi(preset.serviceCode, field)),
    checklists: createDocumentationChecklistsForService(preset.serviceCode),
    measurementAssessments: createDocumentationMeasurementAssessmentsForService(preset.serviceCode),
    measurementTables: createDocumentationMeasurementTablesForService(preset.serviceCode),
  }));
}
