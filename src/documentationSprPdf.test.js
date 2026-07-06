import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
import sharp from "sharp";

import {
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

function getFirstPageImageCount(pdfDoc) {
  const resources = pdfDoc.getPage(0).node.Resources();
  const xObjects = resources?.lookup(PDFName.of("XObject"), PDFDict);
  return xObjects?.keys?.().length || 0;
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
