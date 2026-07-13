import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";

import {
  createDocumentationMeasurementTablesForService,
  createDocumentationReportModelDefaults,
  getDocumentationNativeTemplateSeedPresets,
} from "./documentationNativePresets.js";
import {
  buildDocumentationNativeHtml,
  generateDocumentationSprPdfBlob,
} from "./documentationSprPdf.js";

async function withPdfFontFetch(callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const source = String(url || "");
    if (source === "/assets/fonts/DejaVuSans.ttf" || source.endsWith("/assets/fonts/DejaVuSans.ttf")) {
      return new Response(
        await readFile(new URL("../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf", import.meta.url)),
        { status: 200 },
      );
    }
    if (source === "/assets/fonts/DejaVuSans-Bold.ttf" || source.endsWith("/assets/fonts/DejaVuSans-Bold.ttf")) {
      return new Response(
        await readFile(new URL("../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf", import.meta.url)),
        { status: 200 },
      );
    }
    return originalFetch(url, options);
  };
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function getPageImageCount(pdfDoc, pageIndex = 0) {
  const resources = pdfDoc.getPage(pageIndex).node.Resources();
  const xObjects = resources?.lookup(PDFName.of("XObject"), PDFDict);
  return xObjects?.keys?.().length || 0;
}

function getFirstPageImageCount(pdfDoc) {
  return getPageImageCount(pdfDoc, 0);
}

async function extractPdfText(bytes) {
  const loadingTask = getDocument({
    data: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
    disableWorker: true,
  });
  const pdf = await loadingTask.promise;
  try {
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str || "").join("\n"));
    }
    return pages.join("\n");
  } finally {
    await pdf.destroy();
  }
}

test("native documentation HTML renders every XLSM-backed report preset", () => {
  const presets = getDocumentationNativeTemplateSeedPresets();

  for (const preset of presets) {
    const model = {
      ...createDocumentationReportModelDefaults(preset.serviceCode),
      companyName: "Petrol d.o.o.",
      companyAddress: "Primjer adrese 1, Zagreb",
      companyOib: "00000000000",
      workOrderNumber: "26-672",
      recordNumber: `26-672-${preset.serviceCode}`,
      inspectionPlace: "PM Zagreb Lucko",
      inspectionObject: "Test objekt",
      inspectionDate: "2026-07-05",
      issueDate: "2026-07-05",
      validUntil: "2027-07-05",
      responsiblePerson: "Test Ispitivac",
      signatureMode: "digital",
    };
    const html = buildDocumentationNativeHtml({ model, rows: [] });
    const gridTableCount = (html.match(/class="sn-ex-grid/g) || []).length;
    const excelGridTableCount = (html.match(/class="ex-grid/g) || []).length;

    assert.match(html, /<!doctype html>/i, preset.serviceCode);
    assert.match(html, /signature-box/, preset.serviceCode);
    assert.doesNotMatch(html, /Cannot read properties|undefined \(reading 'columns'\)/, preset.serviceCode);

    if (preset.serviceCode === "EXEI") {
      assert.match(html, /Z A P I S N I K/, "ExEi uses Excel-like cover");
      assert.match(html, /ISPITNI IZVJEŠTAJ/, "ExEi renders measurement report pages");
      assert.match(html, /ex-page landscape measurement/, "ExEi keeps landscape measurement sheets");
      assert.match(html, /ex-page portrait measurement/, "ExEi keeps portrait measurement sheets");
      assert.match(html, /Značenje oznaka/, "ExEi renders sheet legends from the Excel export");
      assert.equal(excelGridTableCount > 0, true, "ExEi renders Excel-like gridline tables");
    }

    if (preset.serviceCode === "EXSE") {
      assert.match(html, /STATIČKOG ELEKTRICITETA/, "ExSe uses the Excel-like report title");
      assert.equal(excelGridTableCount > 0, true, "ExSe renders Excel-like gridline tables");
    }

    if (preset.serviceCode === "EXOV") {
      assert.equal(gridTableCount, 0, "ExOv does not use gridline measurement tables");
      assert.equal(excelGridTableCount, 0, "ExOv does not use Excel-like gridline measurement tables");
    }
  }

  assert.equal(presets.length > 0, true);
});

test("generic ExEi native documentation HTML keeps Excel sheet legends", () => {
  const model = {
    ...createDocumentationReportModelDefaults("EXEI"),
    companyName: "Petrol d.o.o.",
    workOrderNumber: "26-672",
    recordNumber: "26-672-EXEI",
    inspectionPlace: "PM Zagreb Lucko",
    inspectionObject: "Test objekt",
    inspectionDate: "2026-07-05",
    issueDate: "2026-07-05",
    responsiblePerson: "Test Ispitivac",
  };
  const html = buildDocumentationNativeHtml({ model, rows: [] });

  assert.match(html, /ex-legend-block/, "generic ExEi tables render Excel legend blocks");
  assert.match(html, /ex-sheet-conclusion/, "generic ExEi tables render Excel sheet conclusions");
});

test("SPR native documentation HTML keeps the uploaded document header", () => {
  const model = {
    ...createDocumentationReportModelDefaults("SPR"),
    providerName: "Adria Grupa d.o.o.",
    providerAddress: "Heinzelova 53a, Zagreb",
    providerOib: "12345678901",
    companyName: "Petrol d.o.o.",
    workOrderNumber: "26-672",
    recordNumber: "26-672-SPR",
    inspectionPlace: "PM Zagreb Lucko",
    inspectionObject: "Test objekt",
    inspectionDate: "2026-07-05",
    issueDate: "2026-07-05",
    responsiblePerson: "Test Ispitivac",
    headerImageDataUrl: "data:image/png;base64,aGVhZGVy",
    headerImageName: "spr-header.png",
  };
  const html = buildDocumentationNativeHtml({ model, rows: [] });

  assert.match(html, /doc-header is-uploaded/, "SPR renders the uploaded header block");
  assert.match(html, /data:image\/png;base64,aGVhZGVy/, "SPR keeps uploaded header image data");
  assert.doesNotMatch(html, /<div class="brand">SafeNexus<\/div>/, "uploaded SPR header does not fall back to SafeNexus text");
});

test("SPR native documentation export restores SRR Gridline table when a linked template carries a foreign table", () => {
  const [srrTable] = createDocumentationMeasurementTablesForService("SRR");
  const [hydrantTable] = createDocumentationMeasurementTablesForService("HM");
  const columnId = (needle) => srrTable.sheet.columns.find((column) => (
    String(column.label || "").toLowerCase().includes(needle)
  ))?.id || "";
  const placeColumnId = columnId("mjesto");
  const lampColumnId = columnId("panel");
  const measuredColumnId = columnId("izmjerena");
  const requiredColumnId = columnId("potrebna");
  const passColumnId = columnId("zadovoljava");
  const editedSrrSheet = {
    ...srrTable.sheet,
    rows: srrTable.sheet.rows.map((row, index) => (
      index === 0
        ? {
          ...row,
          cells: {
            ...row.cells,
            [placeColumnId]: "Test evakuacijski izlaz",
            [lampColumnId]: "2",
            [measuredColumnId]: ">2",
            [requiredColumnId]: "1",
            [passColumnId]: "DA",
          },
        }
        : row
    )),
  };
  const html = buildDocumentationNativeHtml({
    model: {
      ...createDocumentationReportModelDefaults("SRR"),
      serviceCode: "SRR",
      recordNumber: "26-672-SRR",
      workOrderNumber: "26-672",
      companyName: "Petrol d.o.o.",
      inspectionPlace: "PM Zagreb Lucko",
      inspectionObject: "Test objekt",
      inspectionDate: "2026-07-05",
      issueDate: "2026-07-05",
      responsiblePerson: "Test Ispitivac",
      measurementTables: [{
        ...hydrantTable,
        enabled: false,
        sheet: editedSrrSheet,
      }],
    },
    rows: [],
  });

  assert.match(html, /Mjerna mjesta sigurnosne/, "SRR export uses the SRR Gridline table label");
  assert.match(html, /Izmjerena razina osvjetljenja \[lux\]/, "SRR export keeps lux measurement columns");
  assert.match(html, /Test evakuacijski izlaz/, "SRR export keeps the edited Gridline row");
  assert.doesNotMatch(html, /Mjerenje hidrantske mreze/, "foreign HM table label is not exported for SRR");
});

test("VES native documentation uses evacuation rows without measurement equipment or VS tables", async () => {
  const vesTables = createDocumentationMeasurementTablesForService("VES");
  const [vsTable] = createDocumentationMeasurementTablesForService("VS");
  const model = {
    ...createDocumentationReportModelDefaults("VES"),
    serviceCode: "VES",
    recordNumber: "26-672-VES",
    workOrderNumber: "26-672",
    companyName: "Petrol d.o.o.",
    companyAddress: "Primjer adrese 1, Zagreb",
    companyOib: "00000000000",
    inspectionPlace: "PM Zagreb Lucko",
    inspectionObject: "Test objekt",
    inspectionType: "Periodično ispitivanje",
    inspectionDate: "2026-07-05",
    issueDate: "2026-07-05",
    responsiblePerson: "Test Ispitivac",
    equipment: "Eurotest 61557",
    projectDocumentation: "Ovaj tekst ne smije biti u VES zapisu.",
    resultsText: "Ovaj tekst rezultata ne smije biti u VES zapisu.",
    measurementTables: [vsTable],
    vesExerciseRows: [
      {
        assemblyPoint: "Zborno mjesto dvoriste",
        personCount: "18",
        evacuationTime: "2,35 min",
        note: "Bez zastoja",
      },
    ],
    vesSignatureRows: [
      {
        name: "Ivo Ivic",
        signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP8z8BQDwAFgwJ/lrW2qAAAAABJRU5ErkJggg==",
      },
    ],
    conclusionSentence: "Vjezba evakuacije i spasavanja provedena je uredno.",
  };
  const html = buildDocumentationNativeHtml({ model, rows: [] });

  assert.equal(vesTables.length, 0, "VES preset has no Gridline measurement tables");
  assert.match(html, /Zborna mjesta/, "VES renders evacuation row section");
  assert.match(html, /Zborno mjesto dvoriste/, "VES renders assembly point");
  assert.match(html, /2,35 min/, "VES renders evacuation time");
  assert.match(html, /Zakljucna recenica/, "VES renders free conclusion sentence");
  assert.match(html, /Prilog - Potpisna lista/, "VES renders signature list as appendix");
  assert.match(html, /Ivo Ivic/, "VES renders signature participant");
  assert.equal((html.match(/class="sn-ex-grid/g) || []).length, 0, "VES does not render Gridline measurement tables");
  assert.doesNotMatch(html, /Mjerna i ispitna oprema/, "VES does not render measurement equipment");
  assert.doesNotMatch(html, /Koristena dokumentacija/, "VES does not render technical documentation");
  assert.doesNotMatch(html, /Rezultati ispitivanja/, "VES does not render testing results chapter");
  assert.doesNotMatch(html, /Ventilacija prostora|Sustav ventilacije/, "VES does not export a VS measurement table");

  await withPdfFontFetch(async () => {
    const result = await generateDocumentationSprPdfBlob({ model, rows: [] });
    const text = await extractPdfText(result.bytes);

    assert.match(text, /ZBORNA MJESTA/, "VES PDF renders assembly point section");
    assert.match(text, /Zborno mjesto\s+dvoriste/, "VES PDF renders assembly point value");
    assert.match(text, /2,35 min/, "VES PDF renders evacuation time");
    assert.match(text, /ZAKLJUCNA RECENICA/, "VES PDF renders conclusion sentence section");
    assert.match(text, /PRILOG - POTPISNA LISTA/, "VES PDF renders signature list as appendix");
    assert.match(text, /Ivo Ivic/, "VES PDF renders signature participant");
    assert.doesNotMatch(text, /MJERNA I ISPITNA OPREMA/, "VES PDF omits measurement equipment");
    assert.doesNotMatch(text, /KORI[ŠS]TENA TEHNI/, "VES PDF omits technical documentation");
    assert.doesNotMatch(text, /Ventilacija prostora|Sustav ventilacije/, "VES PDF omits VS table");
  });
});

test("SPR vector PDF export keeps the SRR Gridline table when cached data carries a foreign table", async () => {
  const [srrTable] = createDocumentationMeasurementTablesForService("SRR");
  const [hydrantTable] = createDocumentationMeasurementTablesForService("HM");
  const columnId = (needle) => srrTable.sheet.columns.find((column) => (
    String(column.label || "").toLowerCase().includes(needle)
  ))?.id || "";
  const placeColumnId = columnId("mjesto");
  const lampColumnId = columnId("panel");
  const measuredColumnId = columnId("izmjerena");
  const requiredColumnId = columnId("potrebna");
  const passColumnId = columnId("zadovoljava");
  const editedSrrSheet = {
    ...srrTable.sheet,
    rows: srrTable.sheet.rows.map((row, index) => (
      index === 0
        ? {
          ...row,
          cells: {
            ...row.cells,
            [placeColumnId]: "Test evakuacijski izlaz",
            [lampColumnId]: "2",
            [measuredColumnId]: ">2",
            [requiredColumnId]: "1",
            [passColumnId]: "DA",
          },
        }
        : row
    )),
  };

  await withPdfFontFetch(async () => {
    const result = await generateDocumentationSprPdfBlob({
      model: {
        ...createDocumentationReportModelDefaults("SPR"),
        serviceCode: "SPR",
        recordNumber: "26-672-SPR",
        workOrderNumber: "26-672",
        companyName: "Petrol d.o.o.",
        inspectionPlace: "PM Zagreb Lucko",
        inspectionObject: "Test objekt",
        inspectionType: "Hidrantska mreza",
        inspectionDate: "2026-07-05",
        issueDate: "2026-07-05",
        responsiblePerson: "Test Ispitivac",
        measurementTables: [{
          ...hydrantTable,
          enabled: false,
          sheet: editedSrrSheet,
        }],
      },
      rows: [],
    });
    const text = await extractPdfText(result.bytes);

    assert.match(text, /Mjerna mjesta sigurnosne/, "SPR PDF exports the SRR Gridline table label");
    assert.match(text, /Izmjerena razina osvjetljenja/, "SPR PDF keeps lux measurement columns");
    assert.match(text, /Test evakuacijski\s+izlaz/, "SPR PDF keeps the edited Gridline row");
    assert.doesNotMatch(text, /Mjerenje hidrantske mreze/, "SPR PDF does not export the foreign HM table label");
  });
});

test("SPR native PDF draws an uploaded WebP header on the first page", async () => {
  await withPdfFontFetch(async () => {
    const webpHeader = await sharp({
      create: {
        width: 480,
        height: 88,
        channels: 3,
        background: "#0f72ba",
      },
    }).webp().toBuffer();
    const result = await generateDocumentationSprPdfBlob({
      model: {
        ...createDocumentationReportModelDefaults("SPR"),
        providerName: "Adria Grupa d.o.o.",
        providerAddress: "Heinzelova 53a, Zagreb",
        providerOib: "12345678901",
        companyName: "Petrol d.o.o.",
        companyAddress: "Savska Opatovina 36, Zagreb",
        companyOib: "75550985023",
        workOrderNumber: "26-672",
        recordNumber: "26-672-SPR",
        inspectionPlace: "PM Zagreb Lucko",
        inspectionObject: "Test objekt",
        inspectionDate: "2026-07-05",
        issueDate: "2026-07-05",
        responsiblePerson: "Test Ispitivac",
        headerImageDataUrl: `data:image/webp;base64,${webpHeader.toString("base64")}`,
        headerImageName: "spr-header.webp",
      },
      rows: [],
    });
    const pdfDoc = await PDFDocument.load(result.bytes);

    assert.equal(getFirstPageImageCount(pdfDoc) > 0, true, "first page keeps uploaded header as a PDF image");
  });
});

test("SPR native PDF can resolve the uploaded header from document settings", async () => {
  await withPdfFontFetch(async () => {
    const webpHeader = await sharp({
      create: {
        width: 520,
        height: 92,
        channels: 3,
        background: "#134e8a",
      },
    }).webp().toBuffer();
    const result = await generateDocumentationSprPdfBlob({
      model: {
        ...createDocumentationReportModelDefaults("SPR"),
        providerName: "Adria Grupa d.o.o.",
        providerAddress: "Heinzelova 53a, Zagreb",
        providerOib: "12345678901",
        companyName: "Petrol d.o.o.",
        companyAddress: "Savska Opatovina 36, Zagreb",
        companyOib: "75550985023",
        workOrderNumber: "26-672",
        recordNumber: "26-672-SPR",
        inspectionPlace: "PM Zagreb Lucko",
        inspectionObject: "Test objekt",
        inspectionDate: "2026-07-05",
        issueDate: "2026-07-05",
        responsiblePerson: "Test Ispitivac",
        documentStampSettings: {
          documentationHeader: {
            dataUrl: `data:image/webp;base64,${webpHeader.toString("base64")}`,
            name: "global-header.webp",
          },
        },
      },
      rows: [],
    });
    const pdfDoc = await PDFDocument.load(result.bytes);

    assert.equal(pdfDoc.getPageCount() > 1, true, "test PDF has continuation pages");
    assert.equal(getPageImageCount(pdfDoc, 0) > 0, true, "cover page uses the uploaded global header");
    assert.equal(getPageImageCount(pdfDoc, 1), 0, "continuation page keeps the simple report header");
  });
});
