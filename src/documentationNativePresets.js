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
  blankRowCount = DEFAULT_ROW_COUNT,
  blankSeed = {},
}) {
  const key = id;
  return {
    id,
    key,
    tokenKey: normalizeCode(id).replace(/[^A-Z0-9]+/g, "_"),
    label,
    summary: summary || label,
    columns,
    rows: rows || blankRows(columns, blankRowCount, blankSeed),
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
  makeColumn("protectionType", "Tip i karakteristika zastitnog uredaja", 165),
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
  makeColumn("conductor", "Vrsta vodica", 104),
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

function rowsFromItems(columns, items, pass = "DA") {
  return items.map((item, index) => makeRow(columns, {
    item,
    pass: Array.isArray(pass) ? (pass[index] || "DA") : pass,
  }, index));
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
    tables: [
      tableSpec({
        id: "szomv-visual",
        label: "Vizualni pregled sustava zastite od munje",
        summary: "Tablica 1. Vizualni pregled sustava zastite od djelovanja munje",
        columns: SZOMV_COLUMNS,
        rows: rowsFromItems(SZOMV_COLUMNS, SZOMV_ITEMS, "DA"),
      }),
    ],
  }),
  EIZ: Object.freeze({
    serviceCode: "EIZ",
    serviceName: "Elektricne instalacije",
    title: "EIZ v1.0.0",
    documentType: "Elektricne instalacije",
    reportTitle: "ISPITIVANJE ELEKTRICNIH INSTALACIJA",
    coverSubtitle: "O ISPITIVANJU ELEKTRICNIH INSTALACIJA",
    measurementTableTitle: "Tablica 1. - vizualni pregled elektricne instalacije",
    resultsText: [
      "Ispitivanje elektricne instalacije obuhvaca vizualni pregled, ispitivanje zastitnog uredaja diferencijalne struje, impedanciju petlje kvara, otpor izolacije i kontinuitet zastitnog vodica.",
      "Rezultati ispitivanja prikazuju se u zasebnim ispitnim listovima EIZ.V, EIZ.ZUDS, EIZ.IPK, EIZ.OI i EIZ.K.",
    ].join("\n\n"),
    notes: [
      "ZUDS - zastitni uredaj diferencijalne struje; Iisk - izmjerena struja prorade; tisk - izmjereno vrijeme prorade.",
      "IPK - impedancija petlje kvara; OI - otpor izolacije; K - kontinuitet zastitnog vodica.",
    ],
    assessmentLabel: "Elektricne instalacije",
    conclusionLead: "Temeljem rezultata mjerenja i ispitivanja te ocjene rezultata mjerenja moze se zakljuciti da ispitivana elektricna instalacija na dan predmetnog ispitivanja",
    validitySentence: "Zapisnik o ispitivanju vrijedi jednu (1) godinu, odnosno najkasnije do",
    signatureAreas: ["elektro"],
    technicalDataFields: EIZ_TECHNICAL_FIELDS,
    tables: [
      tableSpec({
        id: "eiz-visual",
        label: "VIZUALNI PREGLED ELEKTRICNE INSTALACIJE",
        summary: "IL - EIZ.V",
        columns: EIZ_VISUAL_COLUMNS,
        rows: rowsFromItems(EIZ_VISUAL_COLUMNS, EIZ_VISUAL_ITEMS, EIZ_VISUAL_RESULTS),
      }),
      tableSpec({
        id: "eiz-zuds",
        label: "ISPITIVANJE ZASTITNOG UREDAJA DIFERENCIJALNE STRUJE - ZUDS",
        summary: "IL - EIZ.ZUDS",
        columns: EIZ_ZUDS_COLUMNS,
        rows: formulaRows(EIZ_ZUDS_COLUMNS, 8, (rowNumber, index) => ({
          board: "RO BS",
          circuit: index < 4 ? `F100.${index + 4}` : ["F140", "F141", "F133", "F142"][index - 4] || "",
          inCurrent: index === 0 ? "63" : (index < 4 ? "40" : "25"),
          idn: [300, 30, 30, 30, 300, 300, 300, 300][index] || 30,
          iisk: `=IF(E${rowNumber}="","",RANDBETWEEN(70,80)*E${rowNumber}/100)`,
          tisk: `=IF(E${rowNumber}="","",RANDBETWEEN(14,24))`,
          u0: `=IF(E${rowNumber}="","","<50")`,
          pass: `=IF(E${rowNumber}="","","DA")`,
        })),
      }),
      tableSpec({
        id: "eiz-ipk",
        label: "ISPITIVANJE IMPEDANCIJE PETLJE KVARA",
        summary: "IL - EIZ.IPK",
        columns: EIZ_IPK_COLUMNS,
        rows: formulaRows(EIZ_IPK_COLUMNS, 24, (rowNumber) => ({
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
        columns: EIZ_OI_COLUMNS,
        rows: formulaRows(EIZ_OI_COLUMNS, 24, (rowNumber) => ({
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
        label: "ISPITIVANJE KONTINUITETA ZASTITNOG VODICA I VODICA ZA IZJEDNACAVANJE POTENCIJALA",
        summary: "IL - EIZ.K",
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
});

export function getDocumentationNativeReportPreset(serviceCode = "") {
  return DOCUMENTATION_NATIVE_REPORT_PRESETS[normalizeCode(serviceCode)] || DOCUMENTATION_NATIVE_REPORT_PRESETS.SPR;
}

export function createDocumentationMeasurementTablesForService(serviceCode = "") {
  const preset = getDocumentationNativeReportPreset(serviceCode);
  return preset.tables.map((table) => ({
    id: table.id,
    key: table.key,
    tokenKey: table.tokenKey,
    label: table.label,
    helpText: "Gridline tablica popunjava rezultate za odabranu uslugu.",
    summary: table.summary,
    sheet: {
      columns: table.columns.map((column) => ({ ...column })),
      rows: table.rows.map((row, index) => ({
        id: row.id || `measurement-row-${index + 1}`,
        cells: { ...(row.cells || {}) },
        formats: { ...(row.formats || {}) },
      })),
      merges: [],
      headerRows: [],
    },
  }));
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
    resultsText: preset.resultsText,
    eiNote: preset.notes[0] || "",
    eiminNote: preset.notes[1] || "",
    assessmentLabel: preset.assessmentLabel,
    conclusionLead: preset.conclusionLead,
    validitySentence: preset.validitySentence,
    signatureAreas: [...preset.signatureAreas],
    technicalDataFields: (preset.technicalDataFields || []).map((field) => ({ ...field })),
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
    resultsText: preset.resultsText,
    eiNote: preset.notes[0] || "",
    eiminNote: preset.notes[1] || "",
    assessmentLabel: preset.assessmentLabel,
    conclusionLead: preset.conclusionLead,
    validitySentence: preset.validitySentence,
    signatureAreas: [...preset.signatureAreas],
    technicalDataFields: (preset.technicalDataFields || []).map((field) => ({ ...field })),
    measurementTables: createDocumentationMeasurementTablesForService(preset.serviceCode),
  }));
}
