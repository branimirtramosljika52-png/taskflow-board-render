import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import test from "node:test";
import { inflateSync } from "node:zlib";

import PizZip from "pizzip";
import { PDFDocument, PDFName, StandardFonts } from "pdf-lib";

import {
  addPdfDocumentStampToBuffer,
  addPdfSignatureFieldsToBuffer,
  buildDashboardCalendarReportPdfBuffer,
  buildDocxFromTemplateBuffer,
  buildHtmlFromTemplateBuffer,
  buildOfferHtmlTemplate,
  buildOfferPdfBuffer,
  buildPdfFromHtmlTemplateBuffer,
  buildPdfFromRenderModel,
  buildRiskAssessmentNativePdfBuffer,
  buildVehicleEvidencePdfBuffer,
  collectPdfSignatureFieldSpecsFromEntry,
  convertWordBufferToHtmlTemplate,
  readStoredDocumentBuffer,
} from "../src/documentExport.js";

function hasLocalChromiumForHtmlPdf() {
  return [
    process.env.CHROMIUM_PATH,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean).some((candidate) => existsSync(candidate));
}

function canLaunchLocalChromiumForHtmlPdf() {
  return [
    process.env.CHROMIUM_PATH,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean).some((candidate) => {
    if (!existsSync(candidate) && /[\\/:]/.test(candidate)) {
      return false;
    }
    const result = spawnSync(candidate, ["--version"], {
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
    });
    return result.status === 0;
  });
}

function buildMinimalDocxBuffer(documentXml = "", {
  relationshipsXml = "",
  numberingXml = "",
  wordFiles = {},
} = {}) {
  const zip = new PizZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    </Types>`);
  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    </Relationships>`);
  const wordFolder = zip.folder("word");
  wordFolder.file("document.xml", documentXml);
  wordFolder.folder("_rels").file("document.xml.rels", relationshipsXml || `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);
  if (numberingXml) {
    wordFolder.file("numbering.xml", numberingXml);
  }
  Object.entries(wordFiles || {}).forEach(([path, content]) => {
    wordFolder.file(path.replace(/^word\//, ""), content);
  });
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

function inflatePdfContentStreams(pdfBuffer = Buffer.alloc(0)) {
  const content = pdfBuffer.toString("latin1");
  return [...content.matchAll(/stream\r?\n([\s\S]*?)endstream/g)]
    .map((match) => Buffer.from(match[1].replace(/\r?\n$/, ""), "latin1"))
    .flatMap((stream) => {
      try {
        return [inflateSync(stream).toString("latin1")];
      } catch {
        return [];
      }
    });
}

async function extractPdfText(pdfBuffer = Buffer.alloc(0)) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    disableFontFace: true,
    useSystemFonts: true,
  }).promise;
  const pages = [];
  for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex += 1) {
    const page = await document.getPage(pageIndex);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n");
}

test("docx export removes an empty optional media placeholder with its standalone page break", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>Uvod</w:t></w:r></w:p>
        <w:p><w:r><w:br w:type="page"/></w:r></w:p>
        <w:p><w:r><w:t>{{SKICA}}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Nastavak</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    SKICA: { __docxBlockType: "optional_empty" },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{SKICA}}"), false);
  assert.equal(outputXml.includes("__TASKFLOW_DOCX_BLOCK"), false);
  assert.equal(/<w:br\b[^>]*w:type=["']page["'][^>]*\/?>/i.test(outputXml), false);
  assert.match(outputXml, /Uvod/);
  assert.match(outputXml, /Nastavak/);
});

test("docx export appends a filled handover protocol at the end", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>Glavni zapisnik</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {}, {
    appendBlocks: [{
      __docxBlockType: "handover_protocol",
      workOrderNumber: "26-638",
      customerName: "PETROL d.o.o.",
      customerAddress: "Savska Opatovina 36, Zagreb",
      customerOib: "75550985023",
      executorName: "ADRIA GRUPA d.o.o.",
      executorAddress: "Heinzelova 53a, Zagreb",
      executorOib: "06637660960",
      location: "PM Zagreb",
      contractType: "Pausal",
      issuedDate: "2026-04-21",
      issuedPlace: "Zagrebu",
      rows: [{
        service: "Ex - elektricna instalacija",
        objectName: "Benzinska postaja",
        documentNumber: "26-638-ExEi",
        quantity: "4",
        note: "Ukupno mjerenja: 28",
      }],
    }],
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.match(outputXml, /Glavni zapisnik/);
  assert.match(outputXml, /PRIMOPREDAJNI ZAPISNIK/);
  assert.match(outputXml, /26-638/);
  assert.match(outputXml, /Ex - elektricna instalacija/);
  assert.match(outputXml, /Benzinska postaja/);
  assert.match(outputXml, /U Zagrebu, 21\.04\.2026\./);
  assert.match(outputXml, /Ukupno mjerenja: 28/);
  assert.match(outputXml, /<w:br w:type="page"\/>/);
  assert.ok(outputXml.indexOf("PRIMOPREDAJNI ZAPISNIK") < outputXml.indexOf("<w:sectPr"));
});

test("docx export does not duplicate handover protocol placeholders", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>{{PRIMOPREDAJNI_ZAPISNIK}}</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);
  const handoverProtocol = {
    __docxBlockType: "handover_protocol",
    workOrderNumber: "26-638",
    customerName: "PETROL d.o.o.",
    executorName: "ADRIA GRUPA d.o.o.",
    rows: [{ service: "Pregled", documentNumber: "26-638-Z", quantity: "1" }],
  };

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    PRIMOPREDAJNI_ZAPISNIK: handoverProtocol,
  }, {
    appendBlocks: [handoverProtocol],
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal((outputXml.match(/PRIMOPREDAJNI ZAPISNIK/g) || []).length, 1);
});

test("docx export renders a ready-made specification table placeholder", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>{{SPECIFIKACIJA}}</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    SPECIFIKACIJA: {
      __docxBlockType: "handover_specification",
      rows: [{
        service: "Ispitivanje panik rasvjete",
        objectName: "Prodajni prostor",
        documentNumber: "26-638-SPR",
        quantity: "16",
        note: "Bez napomene",
      }],
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.match(outputXml, /PRILOG: Popis obavljenih usluga/);
  assert.match(outputXml, /Ispitivanje panik rasvjete/);
  assert.match(outputXml, /Prodajni prostor/);
  assert.match(outputXml, /26-638-SPR/);
  assert.match(outputXml, /Broj mjernih mjesta/);
});

test("docx export renders a multi-block table section placeholder", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>{{RISK_JOBS}}</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    RISK_JOBS: {
      __docxBlockType: "blocks",
      blocks: [
        { type: "heading", text: "Analiza radnih mjesta", level: 2 },
        { type: "paragraph", text: "Automatski izradene tablice procjene." },
        { type: "heading", text: "Opasnosti, stetnosti, napori i mjere", level: 4, pageBreakBefore: true },
        {
          __docxBlockType: "table",
          pageOrientation: "landscape",
          keepRowsTogether: true,
          columns: [
            { id: "job", label: "Posao", width: 220 },
            { id: "risk", label: "Rizik", width: 120 },
          ],
          rows: [
            { id: "title", header: true, cells: [{ text: "Ponavljajuci naslov tablice", format: { align: "left", fillColor: "#FFFFFF", borderStyle: "none" } }, { text: "", format: { fillColor: "#FFFFFF", borderStyle: "none" } }] },
            { id: "head", header: true, cells: [{ text: "Posao" }, { text: "Rizik" }] },
            {
              id: "row-1",
              cells: [
                { text: "Laboratorij", format: { verticalAlign: "center" } },
                {
                  text: "Srednji rizik",
                  format: {
                    align: "center",
                    bold: true,
                    verticalAlign: "center",
                    card: { fillColor: "#FEF3C7", borderColor: "#94A3B8" },
                  },
                },
              ],
            },
          ],
          merges: [
            { rowId: "title", columnId: "job", colSpan: 2 },
          ],
        },
        { type: "paragraph", text: "Nakon tablice opet portrait sadrzaj." },
      ],
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{RISK_JOBS}}"), false);
  assert.equal(outputXml.includes("__TASKFLOW_DOCX_BLOCK"), false);
  assert.match(outputXml, /Analiza radnih mjesta/);
  assert.match(outputXml, /Automatski izradene tablice procjene\./);
  assert.match(outputXml, /Opasnosti, stetnosti, napori i mjere/);
  assert.match(outputXml, /Ponavljajuci naslov tablice/);
  assert.match(outputXml, /Laboratorij/);
  assert.match(outputXml, /Srednji rizik/);
  assert.match(outputXml, /Nakon tablice opet portrait sadrzaj\./);
  assert.match(outputXml, /w:orient="landscape"/);
  assert.match(outputXml, /w:fill="FEF3C7"/);
  assert.match(outputXml, /w:color="94A3B8"/);
  assert.match(outputXml, /<w:vAlign w:val="center"\/>/);
  assert.match(outputXml, /<w:cantSplit\/>/);
  assert.ok((outputXml.match(/<w:tblHeader\/>/g) || []).length >= 2);
  assert.match(outputXml, /<w:gridSpan w:val="2"\/>/);
  assert.equal((outputXml.match(/w:orient="landscape"/g) || []).length, 1);
  assert.equal((outputXml.match(/<w:tbl>/g) || []).length, 2);
  assert.match(outputXml, /<w:type w:val="nextPage"\/>/);

  const fallbackHtml = (await convertWordBufferToHtmlTemplate(outputBuffer, {
    fileName: "procjena-rizika.docx",
    allowLibreOfficeFallback: false,
  })).html;
  assert.match(fallbackHtml, /Srednji rizik/);
  assert.match(fallbackHtml, /background-color:#FEF3C7/);
  assert.match(fallbackHtml, /vertical-align:middle/);
  assert.match(fallbackHtml, /border-top:0\.5pt solid #94A3B8/);
  assert.match(fallbackHtml, /@page sn-word-landscape/);
  assert.match(fallbackHtml, /data-word-orientation="landscape"/);
  assert.ok((fallbackHtml.match(/<table/g) || []).length >= 2);

  const headingIndex = outputXml.indexOf("Opasnosti, stetnosti, napori i mjere");
  const repeatedTitleIndex = outputXml.indexOf("Ponavljajuci naslov tablice");
  const tableTextIndex = outputXml.indexOf("Laboratorij");
  const landscapeIndex = outputXml.indexOf('w:orient="landscape"');
  const previousPortraitSectionIndex = outputXml.indexOf('<w:pgSz w:w="11906" w:h="16838"', headingIndex);
  assert.ok(previousPortraitSectionIndex > -1);
  assert.ok(headingIndex < previousPortraitSectionIndex);
  assert.ok(previousPortraitSectionIndex < repeatedTitleIndex);
  assert.ok(repeatedTitleIndex < tableTextIndex);
  assert.ok(tableTextIndex < landscapeIndex);
});

test("docx export renders a risk assessment contents placeholder", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>{{RISK_CONTENTS}}</w:t></w:r></w:p>
        <w:p><w:r><w:t>{{RISK_JOBS}}</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`, {
    wordFiles: {
      "settings.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:updateFields w:val="false"/>
        </w:settings>`,
    },
  });

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    RISK_CONTENTS: {
      __docxBlockType: "toc",
      title: "Sadrzaj",
      entries: [
        { title: "Osnovni podaci", level: 1 },
        { title: "Analiza radnih mjesta", level: 1 },
      ],
    },
    RISK_JOBS: {
      __docxBlockType: "blocks",
      blocks: [
        { type: "heading", text: "Analiza radnih mjesta", level: 2 },
        { type: "paragraph", text: "Automatski generirani odjeljak." },
      ],
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{RISK_CONTENTS}}"), false);
  assert.equal(outputXml.includes("{{RISK_JOBS}}"), false);
  assert.match(outputXml, /Sadrzaj/);
  assert.match(outputXml, /Osnovni podaci/);
  assert.match(outputXml, /Analiza radnih mjesta/);
  assert.match(outputXml, /TOC \\o &quot;1-2&quot; \\h \\z \\u/);
  assert.match(outputXml, /<w:fldChar w:fldCharType="begin"\/>/);
  assert.match(outputXml, /<w:fldChar w:fldCharType="end"\/>/);
  assert.match(outputXml, /<w:outlineLvl w:val="1"\/>/);
  assert.match(outputXml, /<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"\/><w:b\/><w:sz w:val="28"\/><w:szCs w:val="28"\/><\/w:rPr><w:t xml:space="preserve">Analiza radnih mjesta<\/w:t>/);
  assert.match(new PizZip(outputBuffer).file("word/settings.xml").asText(), /<w:updateFields w:val="true"\/>/);
});

test("docx export skips generated page break when template already has one before placeholder", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>Uvod</w:t></w:r></w:p>
        <w:p><w:r><w:br w:type="page"/></w:r></w:p>
        <w:p><w:r><w:t>{{RISK_JOBS}}</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    RISK_JOBS: {
      __docxBlockType: "blocks",
      __riskPageBreakBefore: true,
      blocks: [
        { type: "heading", text: "Analiza radnih mjesta", level: 2 },
        { type: "paragraph", text: "Nastavak bez duple prazne stranice." },
      ],
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{RISK_JOBS}}"), false);
  assert.match(outputXml, /Uvod/);
  assert.match(outputXml, /Analiza radnih mjesta/);
  assert.equal((outputXml.match(/<w:br\b[^>]*w:type=["']page["'][^>]*\/?>/g) || []).length, 1);
  assert.equal((outputXml.match(/<w:pageBreakBefore\/>/g) || []).length, 0);
});

test("docx export carries template header and footer references into generated landscape sections", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <w:body>
        <w:p><w:r><w:t>{{RISK_TABLE}}</w:t></w:r></w:p>
        <w:sectPr>
          <w:headerReference w:type="default" r:id="rIdHeader"/>
          <w:footerReference w:type="default" r:id="rIdFooter"/>
          <w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
        </w:sectPr>
      </w:body>
    </w:document>`, {
    relationshipsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
        <Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
      </Relationships>`,
    wordFiles: {
      "header1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:hdr>`,
      "footer1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Stranica </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`,
    },
  });

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    RISK_TABLE: {
      __docxBlockType: "table",
      pageOrientation: "landscape",
      columns: [
        { id: "item", label: "Stavka", width: 400 },
        { id: "risk", label: "Rizik", width: 180 },
      ],
      rows: [
        { id: "head", header: true, cells: [{ text: "Stavka" }, { text: "Rizik" }] },
        { id: "row-1", cells: [{ text: "Kemijska stetnost" }, { text: "Srednji rizik" }] },
      ],
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{RISK_TABLE}}"), false);
  assert.equal((outputXml.match(/<w:headerReference\b/g) || []).length, 3);
  assert.equal((outputXml.match(/<w:footerReference\b/g) || []).length, 3);
  assert.equal((outputXml.match(/r:id="rIdFooter"/g) || []).length, 3);
  assert.equal((outputXml.match(/w:orient="landscape"/g) || []).length, 1);
});

test("docx export preserves template landscape section around risk placeholder", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>Portrait dio</w:t></w:r></w:p>
        <w:p><w:pPr><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:pPr></w:p>
        <w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr><w:tblGrid><w:gridCol w:w="12000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="12000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>{{RISK_JOBS}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
        <w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    RISK_JOBS: {
      __docxBlockType: "blocks",
      blocks: [
        { type: "heading", text: "Opasnosti, stetnosti, napori i mjere", level: 4, pageBreakBefore: true },
        {
          __docxBlockType: "table",
          pageOrientation: "landscape",
          keepRowsTogether: true,
          columns: [
            { id: "risk", label: "Identifikacija opasnosti", width: 260 },
            { id: "probability", label: "Vjerojatnost", width: 120 },
            { id: "matrix", label: "Matrica procjene rizika", width: 140 },
          ],
          rows: [
            { id: "head", header: true, cells: [{ text: "Identifikacija opasnosti" }, { text: "Vjerojatnost" }, { text: "Matrica procjene rizika" }] },
            { id: "row-1", cells: [{ text: "Strojevi i oprema" }, { text: "Srednja vjerojatnost" }, { text: "Veliki rizik" }] },
          ],
        },
      ],
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{RISK_JOBS}}"), false);
  assert.match(outputXml, /Portrait dio/);
  assert.match(outputXml, /Opasnosti, stetnosti, napori i mjere/);
  assert.match(outputXml, /Strojevi i oprema/);
  assert.match(outputXml, /Veliki rizik/);
  assert.doesNotMatch(outputXml, /Veliki rizik \(3\)/);
  assert.match(outputXml, /<w:pageBreakBefore\/>/);
  assert.match(outputXml, /<w:keepNext\/>/);
  assert.match(outputXml, /<w:cantSplit\/>/);
  assert.equal((outputXml.match(/<w:sectPr\b/g) || []).length, 2);
  assert.equal((outputXml.match(/w:orient="landscape"/g) || []).length, 1);
  assert.ok(outputXml.indexOf("Opasnosti, stetnosti, napori i mjere") > outputXml.indexOf('<w:pgSz w:w="11906" w:h="16838"'));
  assert.ok(outputXml.indexOf("Strojevi i oprema") < outputXml.indexOf('<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"'));

  const fallbackHtml = (await convertWordBufferToHtmlTemplate(outputBuffer, {
    fileName: "procjena-rizika-template-section.docx",
    allowLibreOfficeFallback: false,
  })).html;
  assert.match(fallbackHtml, /data-word-orientation="landscape"/);
  assert.match(fallbackHtml, /Strojevi i oprema/);
});

test("docx export honors risk section page break metadata", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>{{RISK_INTRO}}</w:t></w:r></w:p>
        <w:p><w:r><w:t>{{RISK_GENERAL}}</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    RISK_INTRO: {
      __docxBlockType: "rich_text",
      html: "<p>Prvi dio</p>",
    },
    RISK_GENERAL: {
      __docxBlockType: "rich_text",
      __riskPageBreakBefore: true,
      html: "<p>Drugi dio</p>",
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  const pageBreakIndex = outputXml.indexOf('<w:br w:type="page"/>');
  const secondSectionIndex = outputXml.indexOf("Drugi dio");
  assert.ok(pageBreakIndex > -1);
  assert.ok(pageBreakIndex < secondSectionIndex);
});

test("risk assessment Word HTML PDF keeps mixed page orientations", {
  skip: canLaunchLocalChromiumForHtmlPdf() ? false : "Chromium nije dostupan za lokalni HTML PDF test.",
}, async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>Portrait prije</w:t></w:r></w:p>
        <w:p><w:r><w:t>{{RISK_JOBS}}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Portrait poslije</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);
  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    RISK_JOBS: {
      __docxBlockType: "blocks",
      blocks: [
        { type: "heading", text: "Opasnosti, stetnosti, napori i mjere", level: 4 },
        {
          __docxBlockType: "table",
          pageOrientation: "landscape",
          columns: [
            { id: "risk", label: "Identifikacija opasnosti", width: 260 },
            { id: "probability", label: "Vjerojatnost", width: 120 },
            { id: "consequence", label: "Posljedice", width: 120 },
            { id: "matrix", label: "Matrica procjene rizika", width: 140 },
          ],
          rows: [
            { id: "head", header: true, cells: [{ text: "Identifikacija opasnosti" }, { text: "Vjerojatnost" }, { text: "Posljedice" }, { text: "Matrica procjene rizika" }] },
            { id: "row-1", cells: [{ text: "Strojevi i oprema" }, { text: "Srednja vjerojatnost" }, { text: "Velika posljedica" }, { text: "Veliki rizik (3)" }] },
          ],
        },
      ],
    },
  });
  const converted = await convertWordBufferToHtmlTemplate(outputBuffer, {
    fileName: "procjena-rizika.docx",
    allowLibreOfficeFallback: false,
  });
  const pdfBuffer = await buildPdfFromHtmlTemplateBuffer(Buffer.from(converted.html || "", "utf8"), {}, {
    fileName: "procjena-rizika.html",
    title: "Procjena rizika",
  });
  const pdf = await PDFDocument.load(pdfBuffer);
  const sizes = pdf.getPages().map((page) => {
    const { width, height } = page.getSize();
    return `${Math.round(width)}x${Math.round(height)}`;
  });

  assert.deepEqual(sizes, ["595x842", "842x595", "595x842"]);
});

test("risk assessment native PDF keeps landscape tables isolated", async () => {
  const pdfBuffer = await buildRiskAssessmentNativePdfBuffer({
    RISK_TITLE: "Procjena rizika - test",
    RISK_COMPANY: "Test d.o.o.",
    RISK_JOBS: {
      __docxBlockType: "blocks",
      blocks: [
        { type: "heading", text: "Analiza radnih mjesta", level: 2 },
        {
          __docxBlockType: "table",
          pageOrientation: "landscape",
          columns: [
            { id: "hazard", label: "Identifikacija opasnosti", width: 300 },
            { id: "probability", label: "Vjerojatnost", width: 120 },
            { id: "risk", label: "Matrica procjene rizika", width: 140 },
          ],
          rows: [
            {
              id: "head",
              header: true,
              cells: [{ text: "Identifikacija opasnosti" }, { text: "Vjerojatnost" }, { text: "Matrica procjene rizika" }],
            },
            {
              id: "row-1",
              cells: [
                { text: "Strojevi i oprema" },
                { text: "Srednja vjerojatnost", format: { align: "center" } },
                {
                  text: "Veliki rizik (3)",
                  format: { align: "center", bold: true, card: { fillColor: "#FEE2E2", borderColor: "#94A3B8" } },
                },
              ],
            },
          ],
        },
        { type: "paragraph", text: "Nakon tablice opet portrait sadržaj." },
      ],
    },
  });

  const pdf = await PDFDocument.load(pdfBuffer);
  const sizes = pdf.getPages().map((page) => {
    const { width, height } = page.getSize();
    return `${Math.round(width)}x${Math.round(height)}`;
  });
  assert.deepEqual(sizes, ["595x842", "842x595", "595x842"]);
});

test("docx export renders signature group placeholders as visible signature blocks", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>{{POTPISI}}</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    POTPISI: {
      __docxBlockType: "signature_group",
      items: [
        {
          role: "Ispitivac",
          name: "Ana Savanovic",
          metaLines: ["Klasa 1"],
          signatureMode: "digital",
        },
      ],
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{POTPISI}}"), false);
  assert.equal(outputXml.includes("__TASKFLOW_DOCX_BLOCK"), false);
  assert.match(outputXml, /Ana Savanovic/);
  assert.doesNotMatch(outputXml, new RegExp(["Scan", "potpisa"].join("\\s+"), "i"));
  assert.match(outputXml, /______________________________/);
  assert.equal((outputXml.match(/<w:gridCol w:w="4680"\/>/g) || []).length, 1);
  assert.equal((outputXml.match(/<w:tc>/g) || []).length, 1);
});

test("docx export embeds scan signature images in signature group placeholders", async () => {
  const signaturePngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGOSHzRgQAAAABJRU5ErkJggg==";
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>{{POTPISI}}</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    POTPISI: {
      __docxBlockType: "signature_group",
      items: [
        {
          role: "Ispitivac",
          name: "Ana Savanovic",
          signatureMode: "scan",
          signatureImageUrl: signaturePngDataUrl,
          signerOib: "12345678901",
        },
      ],
    },
  });
  const outputZip = new PizZip(outputBuffer);
  const outputXml = outputZip.file("word/document.xml").asText();
  const relsXml = outputZip.file("word/_rels/document.xml.rels").asText();

  assert.equal(outputXml.includes("{{POTPISI}}"), false);
  assert.match(outputXml, /<w:drawing>/);
  assert.match(outputXml, /r:embed="rId\d+"/);
  const extentMatch = outputXml.match(/<wp:extent cx="(\d+)" cy="(\d+)"\/>/);
  assert.ok(extentMatch);
  assert.equal(extentMatch[1], extentMatch[2]);
  assert.equal((outputXml.match(/<w:gridCol w:w="4680"\/>/g) || []).length, 1);
  assert.equal((outputXml.match(/<w:tc>/g) || []).length, 1);
  assert.match(relsXml, /relationships\/image/);
  assert.ok(outputZip.file("word/media/safenexus-signature-1.png"));
});

test("docx export keeps a single scan signature inside a narrow template cell", async () => {
  const signaturePngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGOSHzRgQAAAABJRU5ErkJggg==";
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:tbl>
          <w:tblPr><w:tblW w:w="5103" w:type="dxa"/></w:tblPr>
          <w:tblGrid><w:gridCol w:w="5103"/></w:tblGrid>
          <w:tr>
            <w:tc>
              <w:tcPr><w:tcW w:w="5103" w:type="dxa"/></w:tcPr>
              <w:p><w:r><w:t>{{POTPISI}}</w:t></w:r></w:p>
            </w:tc>
          </w:tr>
        </w:tbl>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    POTPISI: {
      __docxBlockType: "signature_group",
      items: [
        {
          role: "Nositelj ovlastenja",
          name: "Ana Savanovic",
          signatureMode: "scan",
          signatureImageUrl: signaturePngDataUrl,
        },
      ],
    },
  });
  const outputZip = new PizZip(outputBuffer);
  const outputXml = outputZip.file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{POTPISI}}"), false);
  assert.match(outputXml, /Ana Savanovic/);
  assert.match(outputXml, /<w:drawing>/);
  assert.equal(outputXml.includes('<w:gridCol w:w="4680"/>'), false);
  assert.equal((outputXml.match(/<w:tbl>/g) || []).length, 1);
  assert.ok(outputZip.file("word/media/safenexus-signature-1.png"));
});

test("docx export keeps digital signature placeholders compact inside template cells", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:tbl>
          <w:tblPr><w:tblW w:w="10773" w:type="dxa"/></w:tblPr>
          <w:tblGrid><w:gridCol w:w="5670"/><w:gridCol w:w="5103"/></w:tblGrid>
          <w:tr>
            <w:tc><w:tcPr><w:tcW w:w="5670" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Zapisnik pregledao i ocjenio:</w:t></w:r></w:p></w:tc>
            <w:tc><w:tcPr><w:tcW w:w="5103" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>{{POTPISI}}</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    POTPISI: {
      __docxBlockType: "signature_group",
      items: [
        {
          role: "Odgovorna osoba SPR",
          name: "Ana Savanovic",
          metaLines: ["OIB 35649316156"],
          signatureMode: "digital",
        },
      ],
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{POTPISI}}"), false);
  assert.doesNotMatch(outputXml, /Odgovorna osoba SPR/);
  assert.match(outputXml, /Ana Savanovic/);
  assert.match(outputXml, /OIB 35649316156/);
  assert.equal((outputXml.match(/<w:tbl>/g) || []).length, 1);
  assert.doesNotMatch(outputXml, /<w:spacing w:before="120"/);
  assert.doesNotMatch(outputXml, /<w:spacing w:before="80"/);
  assert.equal(outputXml.includes('<w:gridCol w:w="4680"/>'), false);
});

test("docx export renders digital signature signer names even when OIB is missing", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:tbl>
          <w:tblPr><w:tblW w:w="10773" w:type="dxa"/></w:tblPr>
          <w:tblGrid><w:gridCol w:w="5670"/><w:gridCol w:w="5103"/></w:tblGrid>
          <w:tr>
            <w:tc><w:tcPr><w:tcW w:w="5670" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Zapisnik pregledao i ocjenio:</w:t></w:r></w:p></w:tc>
            <w:tc><w:tcPr><w:tcW w:w="5103" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>{{POTPISI}}</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);
  const signatureGroup = {
    __docxBlockType: "signature_group",
    items: [
      {
        role: "Ispitivač",
        name: "Ana Savanovic",
        signatureMode: "digital",
      },
    ],
  };

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    POTPISI: signatureGroup,
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();
  const signatureSpecs = collectPdfSignatureFieldSpecsFromEntry({
    templateReferenceKind: "word",
    placeholders: {
      POTPISI: signatureGroup,
    },
  });

  assert.equal(outputXml.includes("{{POTPISI}}"), false);
  assert.match(outputXml, /Ana Savanovic/);
  assert.equal(signatureSpecs.length, 0);
});

test("docx export creates digital signature field metadata when signer OIB is present", async () => {
  const signatureGroup = {
    __docxBlockType: "signature_group",
    items: [
      {
        role: "Ispitivač",
        name: "Ana Savanovic",
        signatureMode: "digital",
        signerOib: "12345678910",
        signatureFieldOib: "12345678910",
        signatureFieldRole: "ZNR",
        preferredField: "SIGN_ZNR_12345678910",
      },
    ],
  };

  const signatureSpecs = collectPdfSignatureFieldSpecsFromEntry({
    templateReferenceKind: "word",
    placeholders: {
      POTPISI: signatureGroup,
    },
  });

  assert.equal(signatureSpecs.length, 1);
  assert.equal(signatureSpecs[0].fieldName, "SIGN_ZNR_12345678910");
  assert.equal(signatureSpecs[0].signatureFieldOib, "12345678910");
});

test("docx export preserves existing floating Word image anchors while inserting blocks", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml">
      <w:body>
        <w:p><w:r><w:t>{{POTPISI}}</w:t></w:r></w:p>
        <w:p>
          <w:r>
            <w:drawing>
              <wp:anchor>
                <wp:positionH relativeFrom="page"><wp:posOffset>914400</wp:posOffset></wp:positionH>
                <wp:positionV relativeFrom="paragraph"><wp:posOffset>50800</wp:posOffset></wp:positionV>
                <wp:extent cx="47625" cy="1270000"/>
                <a:graphic><a:graphicData><a:pic/></a:graphicData></a:graphic>
              </wp:anchor>
            </w:drawing>
            <w:pict>
              <v:shape style="position:absolute;margin-left:72pt;margin-top:4pt;width:3.75pt;height:100pt;mso-position-horizontal-relative:page;mso-position-vertical-relative:paragraph" fillcolor="#006fc0"/>
            </w:pict>
          </w:r>
        </w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
      </w:body>
    </w:document>`);

  const outputBuffer = await buildDocxFromTemplateBuffer(templateBuffer, {
    POTPISI: {
      __docxBlockType: "signature_group",
      items: [
        {
          name: "Ana Savanovic",
          metaLines: ["35649316156"],
          signatureMode: "digital",
        },
      ],
    },
  });
  const outputXml = new PizZip(outputBuffer).file("word/document.xml").asText();

  assert.equal(outputXml.includes("{{POTPISI}}"), false);
  assert.match(outputXml, /Ana Savanovic/);
  assert.match(outputXml, /<wp:positionV relativeFrom="paragraph"><wp:posOffset>50800<\/wp:posOffset><\/wp:positionV>/);
  assert.match(outputXml, /mso-position-vertical-relative:paragraph/);
});

test("HTML template export renders escaped placeholders and special table blocks", () => {
  const html = buildHtmlFromTemplateBuffer(Buffer.from(`
    <main>
      <h1>{{DOCUMENT_TITLE}}</h1>
      <p>{{NAPOMENA}}</p>
      {{TABLICA}}
      {{POTPISI}}
    </main>
  `, "utf8"), {
    DOCUMENT_TITLE: "Zapisnik <script>alert(1)</script>",
    NAPOMENA: "Prvi red\nDrugi red & znak",
    TABLICA: {
      __docxBlockType: "table",
      columns: [
        { id: "c1", label: "Naziv", width: 160 },
        { id: "c2", label: "Vrijednost", width: 120 },
      ],
      rows: [
        {
          id: "h1",
          header: true,
          cells: [{ text: "Parametar" }, { text: "Rezultat" }],
        },
        {
          id: "r1",
          cells: [
            { text: "Otpor" },
            {
              text: "Srednji rizik",
              format: {
                align: "center",
                bold: true,
                card: { fillColor: "#FEF3C7", borderColor: "#94A3B8" },
              },
            },
          ],
        },
      ],
    },
    POTPISI: {
      __docxBlockType: "signature_group",
      items: [{
        role: "Ispitivač",
        name: "Ana Ivić",
        signatureMode: "scan",
        signatureImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGOSHzRgQAAAABJRU5ErkJggg==",
      }],
    },
  }, {
    title: "HTML zapisnik",
  });

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /safe-nexus-template-table/);
  assert.match(html, /Zapisnik &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Prvi red<br>Drugi red &amp; znak/);
  assert.match(html, /<span style="[^"]*background:#FEF3C7[^"]*">Srednji rizik<\/span>/);
  assert.match(html, /Ana Ivić/);
  assert.doesNotMatch(html, /Ispitiva/);
  assert.doesNotMatch(html, new RegExp(["Scan", "potpisa"].join("\\s+"), "i"));
  assert.match(html, /safe-nexus-template-signature-image/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /\{\{DOCUMENT_TITLE\}\}/);
});

test("HTML template export keeps rich text inside system description rows", () => {
  const html = buildHtmlFromTemplateBuffer(Buffer.from(`
    <main>
      {{OPIS_SUSTAVA}}
    </main>
  `, "utf8"), {
    OPIS_SUSTAVA: {
      __docxBlockType: "system_description",
      blocks: [{
        title: "Rezultati ispitivanja",
        rows: [{
          subtitle: "Opis",
          description: '<h2>Glavni nalaz</h2><ul><li>Prva stavka</li><li>Druga stavka</li></ul><script>alert("x")</script>',
          lineCount: 3,
        }],
      }],
    },
  }, {
    title: "Rich opis sustava",
  });

  assert.match(html, /safe-nexus-template-system-block/);
  assert.match(html, /Rezultati ispitivanja/);
  assert.match(html, /safe-nexus-template-system-rich-text/);
  assert.match(html, /<h2>Glavni nalaz<\/h2>/);
  assert.match(html, /<ul><li>Prva stavka<\/li><li>Druga stavka<\/li><\/ul>/);
  assert.doesNotMatch(html, /<script/);
});

test("HTML template export appends a handover protocol block", () => {
  const html = buildHtmlFromTemplateBuffer(Buffer.from(`
    <main>
      <h1>Zapisnik</h1>
    </main>
  `, "utf8"), {}, {
    title: "Zapisnik",
    appendBlocks: [{
      __docxBlockType: "handover_protocol",
      workOrderNumber: "26-638",
      customerName: "PETROL d.o.o.",
      customerAddress: "Savska Opatovina 36, Zagreb",
      customerOib: "75550985023",
      executorName: "ADRIA GRUPA d.o.o.",
      executorAddress: "Heinzelova 53a, Zagreb",
      executorOib: "06637660960",
      location: "PM Zagreb",
      contractType: "Pausal",
      issuedDate: "2026-04-21",
      issuedPlace: "Zagrebu",
      rows: [{
        service: "Ex - elektricna instalacija",
        objectName: "Benzinska postaja",
        documentNumber: "26-638-ExEi",
        quantity: "4",
        note: "Ukupno mjerenja: 28",
      }],
    }],
  });

  assert.match(html, /safe-nexus-template-handover/);
  assert.match(html, /PRIMOPREDAJNI ZAPISNIK/);
  assert.match(html, /26-638/);
  assert.match(html, /PETROL d\.o\.o\./);
  assert.match(html, /Ex - elektricna instalacija/);
  assert.match(html, /Benzinska postaja/);
  assert.match(html, /U Zagrebu, 21\.04\.2026\./);
  assert.match(html, /Ukupno mjerenja: 28/);
  assert.ok(html.indexOf("Zapisnik") < html.indexOf("PRIMOPREDAJNI ZAPISNIK"));
});

test("HTML template export does not duplicate handover protocol placeholders", () => {
  const handoverProtocol = {
    __docxBlockType: "handover_protocol",
    workOrderNumber: "26-638",
    customerName: "PETROL d.o.o.",
    executorName: "ADRIA GRUPA d.o.o.",
    rows: [{ service: "Pregled", documentNumber: "26-638-Z", quantity: "1" }],
  };
  const html = buildHtmlFromTemplateBuffer(Buffer.from(`
    <main>
      {{PRIMOPREDAJNI_ZAPISNIK}}
    </main>
  `, "utf8"), {
    PRIMOPREDAJNI_ZAPISNIK: handoverProtocol,
  }, {
    title: "Zapisnik",
    appendBlocks: [handoverProtocol],
  });

  assert.equal((html.match(/PRIMOPREDAJNI ZAPISNIK/g) || []).length, 1);
});

test("HTML template export renders a ready-made specification table placeholder", () => {
  const html = buildHtmlFromTemplateBuffer(Buffer.from(`
    <main>
      {{SPECIFIKACIJA}}
    </main>
  `, "utf8"), {
    SPECIFIKACIJA: {
      __docxBlockType: "handover_specification",
      rows: [{
        service: "Ispitivanje panik rasvjete",
        objectName: "Prodajni prostor",
        documentNumber: "26-638-SPR",
        quantity: "16",
        note: "Bez napomene",
      }],
    },
  }, {
    title: "Specifikacija",
  });

  assert.match(html, /PRILOG: Popis obavljenih usluga/);
  assert.match(html, /Ispitivanje panik rasvjete/);
  assert.match(html, /Prodajni prostor/);
  assert.match(html, /26-638-SPR/);
  assert.match(html, /Broj mjernih mjesta/);
});

test("HTML template export normalizes Croatian mojibake and UTF-8 metadata", () => {
  const html = buildHtmlFromTemplateBuffer(Buffer.from(`
    <html>
      <head><meta charset="windows-1250"></head>
      <body>
        <h1>ZAPISNIK</h1>
        <p>O ISPITIVANJU SIGURNOSNE PROTUPANI\u00c4\u0152NE RASVJETE</p>
        <p>{{ISPITIVAC}}</p>
      </body>
    </html>
  `, "utf8"), {
    ISPITIVAC: "Ispitiva\u00c4\u0164: Ana Ivi\u00c4\u2021",
  }, {
    title: "Zapisnik",
  });

  assert.match(html, /<meta charset="utf-8">/i);
  assert.match(html, /PROTUPANIČNE RASVJETE/);
  assert.match(html, /Ispitivač: Ana Ivić/);
  assert.doesNotMatch(html, /PROTUPANI\u00c4\u0152NE/);
  assert.doesNotMatch(html, /Ivi\u00c4\u2021/);
});

test("stored document reader accepts HTML data URLs with charset metadata", async () => {
  const source = "<h1>Čć Žž Šš</h1>";
  const dataUrl = `data:text/html;charset=utf-8;base64,${Buffer.from(source, "utf8").toString("base64")}`;
  const result = await readStoredDocumentBuffer({ dataUrl });

  assert.equal(result.mimeType, "text/html");
  assert.equal(result.buffer.toString("utf8"), source);
});

test("builder HTML download normalizes Croatian text and metadata", async () => {
  global.window = {
    btoa: (value) => Buffer.from(value, "binary").toString("base64"),
    atob: (value) => Buffer.from(value, "base64").toString("binary"),
  };
  const { buildBuilderHtmlFromDocument, parseBuilderDocumentFromHtml } = await import("../src/core/export.js");
  const document = [{
    id: "page-1",
    type: "page",
    props: {},
    styles: {},
    layout: { width: 794, height: 1123 },
    children: [{
      id: "heading-1",
      type: "heading",
      props: { content: "O ISPITIVANJU SIGURNOSNE PROTUPANI\u00c4\u0152NE RASVJETE" },
      styles: {},
      layout: { x: 72, y: 100, width: 620, height: 42, rotation: 0 },
      children: [],
    }],
  }];

  const html = buildBuilderHtmlFromDocument(document, { title: "Zapisnik" });
  const parsed = parseBuilderDocumentFromHtml(html);

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<meta charset="utf-8">/i);
  assert.match(html, /PROTUPANIČNE RASVJETE/);
  assert.doesNotMatch(html, /PROTUPANI\u00c4\u0152NE/);
  assert.equal(parsed?.document?.[0]?.children?.[0]?.props?.content, "O ISPITIVANJU SIGURNOSNE PROTUPANIČNE RASVJETE");
});

test("Word to HTML conversion preserves OOXML colors, alignment and tokens", async () => {
  const templateBuffer = buildMinimalDocxBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <w:body>
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr>
          <w:r>
            <w:rPr><w:b/><w:color w:val="C00000"/><w:sz w:val="28"/></w:rPr>
            <w:t>{{TVRTKA}}</w:t>
          </w:r>
        </w:p>
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders><w:top w:val="single" w:sz="12" w:color="222222"/></w:tblBorders>
          </w:tblPr>
          <w:tr>
            <w:tc>
              <w:tcPr><w:shd w:fill="D9EAD3"/><w:vAlign w:val="center"/></w:tcPr>
              <w:p><w:r><w:t>Ćelija boje</w:t></w:r></w:p>
            </w:tc>
          </w:tr>
          <w:tr>
            <w:tc>
              <w:tcPr><w:vAlign w:val="center"/></w:tcPr>
              <w:p><w:pPr><w:shd w:fill="BEBEBE"/></w:pPr></w:p>
            </w:tc>
          </w:tr>
        </w:tbl>
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="0" w:type="auto"/>
            <w:tblInd w:w="300" w:type="dxa"/>
            <w:tblLayout w:type="fixed"/>
            <w:tblCellMar>
              <w:top w:w="40" w:type="dxa"/>
              <w:right w:w="80" w:type="dxa"/>
              <w:bottom w:w="60" w:type="dxa"/>
              <w:left w:w="100" w:type="dxa"/>
            </w:tblCellMar>
            <w:tblBorders>
              <w:top w:val="nil"/>
              <w:left w:val="nil"/>
              <w:bottom w:val="nil"/>
              <w:right w:val="nil"/>
              <w:insideH w:val="nil"/>
              <w:insideV w:val="nil"/>
            </w:tblBorders>
          </w:tblPr>
          <w:tblGrid>
            <w:gridCol w:w="1200"/>
            <w:gridCol w:w="2400"/>
          </w:tblGrid>
          <w:tr>
            <w:trPr><w:trHeight w:val="400" w:hRule="exact"/><w:cantSplit/></w:trPr>
            <w:tc>
              <w:tcPr><w:tcW w:w="1200" w:type="dxa"/></w:tcPr>
              <w:p><w:r><w:t>Layout lijevo</w:t></w:r></w:p>
            </w:tc>
            <w:tc>
              <w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>
              <w:p><w:r><w:t>Layout desno</w:t></w:r></w:p>
            </w:tc>
          </w:tr>
        </w:tbl>
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="0" w:type="auto"/>
            <w:tblLayout w:type="fixed"/>
          </w:tblPr>
          <w:tr>
            <w:tc>
              <w:tcPr><w:tcW w:w="800" w:type="dxa"/></w:tcPr>
              <w:p><w:r><w:t>Fallback stupac 1</w:t></w:r></w:p>
            </w:tc>
            <w:tc>
              <w:tcPr><w:tcW w:w="1600" w:type="dxa"/></w:tcPr>
              <w:p><w:r><w:t>Fallback stupac 2</w:t></w:r></w:p>
            </w:tc>
          </w:tr>
        </w:tbl>
        <w:p>
          <w:r>
            <w:drawing>
              <wp:anchor>
                <wp:positionH relativeFrom="page"><wp:posOffset>914400</wp:posOffset></wp:positionH>
                <wp:positionV relativeFrom="paragraph"><wp:posOffset>50800</wp:posOffset></wp:positionV>
                <wp:extent cx="47625" cy="1270000"/>
                <a:graphic><a:graphicData><wps:wsp><wps:spPr><a:solidFill><a:srgbClr val="006FC0"/></a:solidFill></wps:spPr></wps:wsp></a:graphicData></a:graphic>
              </wp:anchor>
            </w:drawing>
            <w:pict>
              <v:shape style="position:absolute;margin-left:72pt;margin-top:4pt;width:3.75pt;height:100pt;mso-position-horizontal-relative:page;mso-position-vertical-relative:paragraph" fillcolor="#006fc0"/>
            </w:pict>
          </w:r>
        </w:p>
        <w:p>
          <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="42"/></w:numPr></w:pPr>
          <w:r><w:t>Prva stavka</w:t></w:r>
        </w:p>
        <w:p>
          <w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="42"/></w:numPr></w:pPr>
          <w:r><w:t>Druga stavka</w:t></w:r>
        </w:p>
        <w:p>
          <w:pPr><w:pageBreakBefore/></w:pPr>
          <w:r><w:t>Nova stranica</w:t></w:r>
        </w:p>
        <w:sectPr>
          <w:headerReference w:type="default" r:id="rIdHeader"/>
          <w:footerReference w:type="default" r:id="rIdFooter"/>
          <w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/>
        </w:sectPr>
      </w:body>
    </w:document>`, {
    relationshipsXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
        <Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
      </Relationships>`,
    numberingXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="7">
          <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
        </w:abstractNum>
        <w:num w:numId="42"><w:abstractNumId w:val="7"/></w:num>
      </w:numbering>`,
    wordFiles: {
      "header1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:p><w:r><w:t>SafeNexus Header</w:t></w:r></w:p>
        </w:hdr>`,
      "footer1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:p>
            <w:r><w:t>SPR-</w:t></w:r>
            <w:r><w:fldChar w:fldCharType="begin"/></w:r>
            <w:r><w:instrText xml:space="preserve"> PAGE \\* MERGEFORMAT </w:instrText></w:r>
            <w:r><w:fldChar w:fldCharType="separate"/></w:r>
            <w:r><w:t>3</w:t></w:r>
            <w:r><w:fldChar w:fldCharType="end"/></w:r>
            <w:r><w:t>/</w:t></w:r>
            <w:r><w:fldChar w:fldCharType="begin"/></w:r>
            <w:r><w:instrText xml:space="preserve"> NUMPAGES \\* MERGEFORMAT </w:instrText></w:r>
            <w:r><w:fldChar w:fldCharType="separate"/></w:r>
            <w:r><w:t>5</w:t></w:r>
            <w:r><w:fldChar w:fldCharType="end"/></w:r>
          </w:p>
        </w:ftr>`,
    },
  });
  const previousWarn = console.warn;
  console.warn = () => {};

  try {
    const result = await convertWordBufferToHtmlTemplate(templateBuffer, {
      fileName: "styled-template.docx",
    });

    assert.match(result.html, /<!doctype html>/i);
    assert.match(result.html, /<meta charset="utf-8">/i);
    assert.match(result.html, /\{\{TVRTKA\}\}/);
    assert.match(result.html, /color:#C00000/);
    assert.match(result.html, /background-color:#D9EAD3/);
    assert.match(result.html, /text-align:center/);
    assert.match(result.html, /Ćelija boje/);
    assert.match(result.html, /sn-word-pages/);
    assert.match(result.html, /sn-word-page/);
    assert.match(result.html, /@page \{ size:/);
    assert.match(result.html, /SafeNexus Header/);
    assert.equal((result.html.match(/<section class="sn-word-page"/g) || []).length, 2);
    assert.match(result.html, /data-page-index="2"[\s\S]*Nova stranica/);
    assert.match(result.html, /SPR-[\s\S]*data-sn-word-field="PAGE">\{\{PAGE\}\}<\/span>\/<span[\s\S]*data-sn-word-field="NUMPAGES">\{\{NUMPAGES\}\}<\/span>/);
    assert.doesNotMatch(result.html, /data-sn-word-field="PAGE">1<\/span>/);
    assert.doesNotMatch(result.html, /data-sn-word-field="NUMPAGES">1<\/span>/);
    assert.doesNotMatch(result.html, /SPR-3\/5/);
    if (result.engine === "ooxml") {
      assert.match(result.html, /sn-word-page-footer has-generated-page-fields/);
      assert.match(result.html, /--sn-word-page-header-top:/);
      assert.match(result.html, /--sn-word-page-footer-bottom:/);
      assert.match(result.html, /margin-top: calc\(var\(--sn-word-page-header-top\) - var\(--sn-word-page-margin-top\)\)/);
      assert.match(result.html, /\.sn-word-page-header[\s\S]*text-align: center;/);
      assert.match(result.html, /margin-bottom: calc\(var\(--sn-word-page-footer-bottom\) - var\(--sn-word-page-margin-bottom\)\)/);
      assert.match(result.html, /\.sn-word-page-number:empty::before[\s\S]*content: "\{\{PAGE\}\}"/);
      assert.match(result.html, /\.sn-word-page-count:empty::before[\s\S]*content: "\{\{NUMPAGES\}\}"/);
      assert.doesNotMatch(result.html, /sn-word-page-footer\.has-generated-page-fields\s*\{\s*visibility:\s*hidden/i);
      assert.match(result.html, /sn-word-list-marker">1\.<\/span>[\s\S]*Prva stavka/);
      assert.match(result.html, /sn-word-list-marker">2\.<\/span>[\s\S]*Druga stavka/);
      assert.doesNotMatch(result.html, /background-color:#BEBEBE[^>]*>&nbsp;<\/p>/);
      assert.match(result.html, /data-word-grid="60pt 120pt"/);
      assert.match(result.html, /data-word-grid-source="tblGrid"/);
      assert.match(result.html, /data-word-grid-width="180pt"/);
      assert.match(result.html, /data-word-grid="40pt 80pt" data-word-grid-source="tcW" data-word-grid-width="120pt"/);
      assert.match(result.html, /<colgroup><col style="width:60pt"><col style="width:120pt"><\/colgroup>/);
      assert.match(result.html, /style="[^"]*width:180pt[^"]*margin-left:15pt[^"]*table-layout:fixed/);
      assert.match(result.html, /<tr style="height:20pt;break-inside:avoid;page-break-inside:avoid">/);
      assert.match(result.html, /padding-top:2pt[^"]*padding-right:4pt[^"]*padding-bottom:3pt[^"]*padding-left:5pt/);
      assert.match(result.html, /\.sn-word-ooxml-table[\s\S]*border: none;[\s\S]*padding: 0;/);
      assert.equal((result.html.match(/\bsn-word-shape\b/g) || []).length, 1);
      assert.match(result.html, /left:36pt;top:4pt;width:3\.75pt;height:100pt;background-color:#006FC0/);
    }
  } finally {
    console.warn = previousWarn;
  }
});

test("dashboard calendar report export returns a PDF buffer", async () => {
  const outputBuffer = await buildDashboardCalendarReportPdfBuffer({
    user: {
      firstName: "Ana",
      lastName: "Ivic",
      email: "ana@example.com",
      organizationName: "Test Org",
    },
    organizationName: "Test Org",
    todayKey: "2026-05-05",
    scopedSnapshot: {
      currentOrganization: { name: "Test Org" },
      companies: [{ id: "company-1", name: "Alpha" }],
      locations: [{ id: "location-1", companyId: "company-1", name: "Zagreb" }],
      workOrders: [
        {
          id: "wo-1",
          workOrderNumber: "26-001",
          status: "Otvoreni RN",
          priority: "Urgent",
          dueDate: "2026-05-06",
          companyName: "Alpha",
          locationName: "Zagreb",
          executors: ["Ana Ivic"],
        },
      ],
      reminders: [{ id: "rem-1", title: "Provjera", status: "active", dueDate: "2026-05-07" }],
      todoTasks: [{ id: "todo-1", title: "Nazovi klijenta", status: "open", dueDate: "2026-05-08" }],
    },
  });

  assert.equal(outputBuffer.subarray(0, 4).toString("utf8"), "%PDF");
  assert.ok(outputBuffer.length > 1000);
});

test("render model export returns a direct PDF buffer", async () => {
  const outputBuffer = await buildPdfFromRenderModel({
    title: "Zapisnik pregleda",
    documentType: "Zapisnik",
    workOrderNumber: "RN-1/2026",
    company: {
      name: "Alpha d.o.o.",
      oib: "12345678901",
      headquarters: "Zagreb",
    },
    location: {
      name: "Pogon 1",
      region: "Zagreb",
    },
    blocks: [
      {
        title: "Osnovni podaci",
        items: [
          { type: "field", title: "Status", value: "Ispravno" },
          { type: "text", title: "Napomena", body: "Nema uocenih nedostataka." },
        ],
      },
    ],
  });

  assert.equal(outputBuffer.subarray(0, 4).toString("utf8"), "%PDF");
  assert.ok(outputBuffer.length > 1000);
});

test("render model ordinary signature keeps PDF without signature fields", async () => {
  const outputBuffer = await buildPdfFromRenderModel({
    title: "Zapisnik obicni potpis",
    documentType: "Zapisnik",
    blocks: [
      {
        title: "Potpisi",
        items: [
          {
            type: "signature_group",
            title: "Potpis",
            items: [
              {
                role: "Ispitivac",
                name: "Ana Ivic",
                signatureMode: "scan",
                signerOib: "91977516569",
                signatureFieldRole: "ZNR",
              },
            ],
          },
        ],
      },
    ],
  });

  const pdfDoc = await PDFDocument.load(outputBuffer);
  assert.equal(pdfDoc.getForm().getFields().length, 0);
});

test("render model digital signature adds SIGN_ROLE_OIB signature field", async () => {
  const outputBuffer = await buildPdfFromRenderModel({
    title: "Zapisnik digitalni potpis",
    documentType: "Zapisnik",
    blocks: [
      {
        title: "Potpisi",
        items: [
          {
            type: "signature_group",
            title: "Potpis",
            items: [
              {
                role: "Ispitiva\u010d",
                name: "Ana Ivi\u0107",
                signatureMode: "digital",
                signerOib: "91977516569",
                signatureFieldRole: "ZNR",
              },
            ],
          },
        ],
      },
    ],
  });

  const pdfDoc = await PDFDocument.load(outputBuffer);
  const fields = pdfDoc.getForm().getFields();
  assert.deepEqual(fields.map((field) => field.getName()), ["SIGN_ZNR_91977516569"]);
});

test("PDF document stamp is drawn on every M.P. anchor", async () => {
  const sourceDoc = await PDFDocument.create();
  const font = await sourceDoc.embedFont(StandardFonts.Helvetica);
  const firstPage = sourceDoc.addPage([595.303937007874, 841.889763779528]);
  firstPage.drawText("M.P.", { x: 292, y: 292, size: 11, font });
  const secondPage = sourceDoc.addPage([595.303937007874, 841.889763779528]);
  secondPage.drawText("M.P.", { x: 292, y: 292, size: 11, font });
  const inputBuffer = Buffer.from(await sourceDoc.save({ useObjectStreams: false }));

  const outputBuffer = await addPdfDocumentStampToBuffer(inputBuffer, {
    imageDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    width: 120,
  });

  const streams = inflatePdfContentStreams(outputBuffer).join("\n");
  const imageDraws = streams.match(/\/Image-[^\s]+\s+Do/g) || [];
  assert.equal(imageDraws.length, 2);
  assert.match(streams, /1 0 0 1 [0-9.]+ 237\.5 cm[\s\S]*120 0 0 120 0 0 cm/);
});

test("PDF signature field is anchored below the last matching signer OIB", async () => {
  const sourceDoc = await PDFDocument.create();
  const font = await sourceDoc.embedFont(StandardFonts.Helvetica);
  const firstPage = sourceDoc.addPage([595.303937007874, 841.889763779528]);
  firstPage.drawText("OIB 35649316156", { x: 416.4, y: 691.989, size: 9, font });
  const signaturePage = sourceDoc.addPage([595.303937007874, 841.889763779528]);
  signaturePage.drawText("Ana Savanovic", { x: 412, y: 745.589, size: 11, font });
  signaturePage.drawText("OIB 35649316156", { x: 416.4, y: 732.589, size: 9, font });
  signaturePage.drawText("______________________________", { x: 382.2, y: 701, size: 10, font });

  const outputBuffer = await addPdfSignatureFieldsToBuffer(
    Buffer.from(await sourceDoc.save({ useObjectStreams: false })),
    [{
      signatureMode: "digital",
      signatureFieldRole: "ZNR",
      signatureFieldOib: "35649316156",
      fieldName: "SIGN_ZNR_35649316156",
      name: "Ana Savanovic",
      drawPlaceholder: true,
    }],
  );

  const pdfDoc = await PDFDocument.load(outputBuffer);
  const field = pdfDoc.getForm().getField("SIGN_ZNR_35649316156");
  const rect = field.acroField.getWidgets()[0].getRectangle();
  assert.ok(rect.y > 660, `expected field to use the later OIB anchor, got y=${rect.y}`);
  assert.ok(rect.y < 690, `expected field below the signer OIB, got y=${rect.y}`);
  assert.ok(rect.x > 360 && rect.x < 390, `expected field aligned with signer block, got x=${rect.x}`);
  assert.equal(Math.round(rect.width), 164);
  assert.equal(Math.round(rect.height), 32);
});

test("PDF signature field can be anchored below a handover verifier label", async () => {
  const sourceDoc = await PDFDocument.create();
  const font = await sourceDoc.embedFont(StandardFonts.Helvetica);
  const page = sourceDoc.addPage([595.303937007874, 841.889763779528]);
  page.drawText("OIB 35649316156", { x: 410, y: 700, size: 9, font });
  page.drawText("Ovjerio izvrsitelj:", { x: 232, y: 302, size: 11, font });

  const outputBuffer = await addPdfSignatureFieldsToBuffer(
    Buffer.from(await sourceDoc.save({ useObjectStreams: false })),
    [{
      signatureMode: "digital",
      signatureFieldRole: "IZVRSITELJ",
      signatureFieldOib: "35649316156",
      fieldName: "SIGN_IZVRSITELJ_35649316156",
      name: "Ana Savanovic",
      anchorText: "Ovjerio izvr\u0161itelj",
      positioning: {
        anchor: "bottom",
        offsetY: -10,
        width: 180,
        height: 52,
      },
    }],
  );

  const pdfDoc = await PDFDocument.load(outputBuffer);
  const field = pdfDoc.getForm().getField("SIGN_IZVRSITELJ_35649316156");
  const rect = field.acroField.getWidgets()[0].getRectangle();
  assert.ok(rect.y > 230 && rect.y < 250, `expected field below verifier label, got y=${rect.y}`);
  assert.ok(rect.y < 300, `expected field to avoid the OIB anchor, got y=${rect.y}`);
  assert.equal(Math.round(rect.width), 180);
  assert.equal(Math.round(rect.height), 52);
});

test("PDF signature fields for the same OIB use separate role anchors", async () => {
  const sourceDoc = await PDFDocument.create();
  const font = await sourceDoc.embedFont(StandardFonts.Helvetica);
  const inspectorPage = sourceDoc.addPage([595.303937007874, 841.889763779528]);
  inspectorPage.drawText("Ispitivac SPR", { x: 428.4, y: 719.289, size: 9, font });
  inspectorPage.drawText("Ana Savanovic", { x: 412, y: 704.889, size: 11, font });
  inspectorPage.drawText("OIB 35649316156", { x: 416.4, y: 691.989, size: 9, font });
  const responsiblePage = sourceDoc.addPage([595.303937007874, 841.889763779528]);
  responsiblePage.drawText("Ana Savanovic", { x: 412, y: 745.589, size: 11, font });
  responsiblePage.drawText("OIB 35649316156", { x: 416.4, y: 732.589, size: 9, font });

  const outputBuffer = await addPdfSignatureFieldsToBuffer(
    Buffer.from(await sourceDoc.save({ useObjectStreams: false })),
    [
      {
        signatureMode: "digital",
        signatureFieldRole: "ZNR",
        signatureFieldOib: "35649316156",
        fieldName: "SIGN_ZNR_35649316156",
        name: "Ana Savanovic",
        roleLabel: "Ispitivac SPR",
      },
      {
        signatureMode: "digital",
        signatureFieldRole: "ZNR",
        signatureFieldOib: "35649316156",
        fieldName: "SIGN_ZNR_35649316156_2",
        name: "Ana Savanovic",
        roleLabel: "Odgovorna osoba SPR",
      },
    ],
  );

  const pdfDoc = await PDFDocument.load(outputBuffer);
  const pages = pdfDoc.getPages();
  const getFieldPageIndex = (fieldName) => {
    const widget = pdfDoc.getForm().getField(fieldName).acroField.getWidgets()[0];
    return pages.findIndex((page) => page.ref === widget.P());
  };

  assert.equal(getFieldPageIndex("SIGN_ZNR_35649316156"), 0);
  assert.equal(getFieldPageIndex("SIGN_ZNR_35649316156_2"), 1);
});

test("PDF signature role positioning settings override anchor offsets and size", async () => {
  const sourceDoc = await PDFDocument.create();
  const font = await sourceDoc.embedFont(StandardFonts.Helvetica);
  const page = sourceDoc.addPage([595.303937007874, 841.889763779528]);
  page.drawText("OIB 12345678901", { x: 400, y: 700, size: 9, font });

  const outputBuffer = await addPdfSignatureFieldsToBuffer(
    Buffer.from(await sourceDoc.save({ useObjectStreams: false })),
    [{
      signatureMode: "digital",
      signatureFieldRole: "ODGOVORNA_OSOBA",
      signatureFieldOib: "12345678901",
      fieldName: "SIGN_ODGOVORNA_OSOBA_12345678901",
      name: "Marko Markovic",
      drawPlaceholder: true,
    }],
    {
      rolePositioning: {
        ODGOVORNA_OSOBA: {
          anchor: "bottom",
          offsetX: 10,
          offsetY: -8,
          width: 160,
          height: 50,
          alignment: "left",
        },
      },
    },
  );

  const pdfDoc = await PDFDocument.load(outputBuffer);
  const field = pdfDoc.getForm().getField("SIGN_ODGOVORNA_OSOBA_12345678901");
  const rect = field.acroField.getWidgets()[0].getRectangle();
  assert.equal(Math.round(rect.width), 160);
  assert.equal(Math.round(rect.height), 50);
  assert.ok(rect.y > 640 && rect.y < 645, `expected configured offset below OIB, got y=${rect.y}`);
  assert.ok(rect.x > 364 && rect.x < 374, `expected configured horizontal offset, got x=${rect.x}`);
});

test("PDF signature appearance treats string false as borderless transparent placeholder", async () => {
  const sourceDoc = await PDFDocument.create();
  const font = await sourceDoc.embedFont(StandardFonts.Helvetica);
  const page = sourceDoc.addPage([300, 200]);
  page.drawText("OIB 12345678901", { x: 50, y: 100, size: 9, font });

  const outputBuffer = await addPdfSignatureFieldsToBuffer(
    Buffer.from(await sourceDoc.save({ useObjectStreams: false })),
    [{
      signatureMode: "digital",
      signatureFieldRole: "ZNR",
      signatureFieldOib: "12345678901",
      fieldName: "SIGN_ZNR_12345678901",
      name: "Ana Ivic",
      drawPlaceholder: true,
    }],
    {
      appearance: {
        showLogo: "false",
        border: "false",
        transparentBackground: "true",
      },
    },
  );

  const pdfDoc = await PDFDocument.load(outputBuffer);
  const widget = pdfDoc.getForm().getField("SIGN_ZNR_12345678901").acroField.getWidgets()[0];
  assert.deepEqual(widget.dict.get(PDFName.of("Border"))?.asArray().map((item) => item.asNumber()), [0, 0, 0]);
  assert.equal(widget.dict.get(PDFName.of("BS"))?.lookup(PDFName.of("W"))?.asNumber(), 0);
  assert.doesNotMatch(inflatePdfContentStreams(outputBuffer).join("\n"), /0\.68 0\.72 0\.78 RG|1 1 1 rg/);
});

test("signature field metadata collector returns preferred field for digital entries", () => {
  const fields = collectPdfSignatureFieldSpecsFromEntry({
    placeholders: {
      POTPIS: {
        __docxBlockType: "signature_group",
        items: [
          {
            role: "Ispitivac",
            name: "Ana Ivic",
            signatureMode: "digital",
            signerOib: "91977516569",
            signatureFieldRole: "ZNR",
          },
        ],
      },
    },
  });

  assert.equal(fields.length, 1);
  assert.equal(fields[0].fieldName, "SIGN_ZNR_91977516569");
});

test("signature field metadata collector keeps repeated signer fields unique", () => {
  const repeatedSigner = {
    role: "Ispitivac",
    name: "Ana Savanovic",
    signatureMode: "digital",
    signerOib: "35649316156",
    signerOrganization: "Adria grupa d.o.o.",
    signatureFieldRole: "ZNR",
  };
  const fields = collectPdfSignatureFieldSpecsFromEntry({
    templateReferenceKind: "word",
    placeholders: {
      POTPISI: {
        __docxBlockType: "signature_group",
        items: [repeatedSigner, repeatedSigner],
      },
    },
    renderModel: {
      blocks: [
        {
          type: "signature_group",
          items: [repeatedSigner],
        },
      ],
    },
  });

  assert.equal(fields.length, 2);
  assert.deepEqual(fields.map((field) => field.fieldName), [
    "SIGN_ZNR_35649316156",
    "SIGN_ZNR_35649316156_2",
  ]);
  assert.equal(fields[0].signerOrganization, "Adria grupa d.o.o.");
  assert.equal(fields[1].signerOrganization, "Adria grupa d.o.o.");
});

test("offer HTML template renders escaped commercial data", () => {
  const html = buildOfferHtmlTemplate({
    title: "Ponuda <script>alert(1)</script>",
    offerNumber: "26-AG-001",
    offerDate: "2026-05-06",
    companyName: "Alpha & Beta d.o.o.",
    companyOib: "12345678901",
    headquarters: "Zagreb",
    serviceLine: "Fixed Plan",
    items: [
      {
        description: "Mjerenje <b>opreme</b>",
        unit: "kom",
        quantity: 2,
        unitPrice: 13.215,
        totalPrice: 26.43,
      },
      {
        description: "ADR osposobljavanje",
        serviceCode: "ADR-001",
        isIncludedService: true,
      },
    ],
    subtotal: 26.43,
    taxRate: 25,
    taxTotal: 6.61,
    total: 33.04,
  });

  assert.match(html, /safe-offer-html-template/);
  assert.match(html, /PONUDA/);
  assert.match(html, /Poštovani/);
  assert.match(html, /26-AG-001/);
  assert.match(html, /06\.05\.2026/);
  assert.match(html, /Alpha &amp; Beta/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /\{\{OFFER_NUMBER\}\}/);
  assert.match(html, /offer-html-fixed-plan-table/);
  assert.match(html, /offer-html-included-services-table/);
  assert.match(html, /Fiksne stavke ponude/);
  assert.match(html, /Uključene usluge/);
  assert.match(html, /ADR osposobljavanje/);
  assert.match(html, /26,43 EUR/);
  assert.match(html, /PDV \(25%\)/);
  assert.match(html, /6,61 EUR/);
  assert.match(html, /Ukupno s PDV-om/);
  assert.match(html, /33,04 EUR/);
});

test("hybrid offer HTML separates monthly fees from service pricing", () => {
  const html = buildOfferHtmlTemplate({
    title: "Hybrid ponuda",
    offerNumber: "26-AG-HYB",
    offerDate: "2026-05-06",
    companyName: "Alpha d.o.o.",
    companyOib: "12345678901",
    headquarters: "Zagreb",
    locationName: "Pogon 1",
    serviceLine: "Hybrid Plan",
    showTotalAmount: false,
    items: [
      {
        description: "Mjesečni iznos",
        unit: "mj",
        quantity: 1,
        unitPrice: 142,
        totalPrice: 142,
      },
      {
        description: "Usluge po izvršenju",
        unit: "usluga",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        breakdowns: [
          { priceKind: "record", recordLabel: "Zapisnik", amount: 0 },
          { priceKind: "measurement", measurementTo: "10", amount: "0" },
          { priceKind: "measurement_range", measurementFrom: "11", measurementTo: "20", amount: 0 },
          { priceKind: "next_measurement", amount: 24 },
        ],
      },
      {
        description: "Jednostavna intervencija",
        unit: "usluga",
        quantity: 1,
        unitPrice: 55,
        totalPrice: 55,
      },
    ],
  });

  assert.match(html, /Mjesečne naknade/);
  assert.match(html, /offer-html-hybrid-monthly-table/);
  assert.match(html, /offer-html-service-pricing-table/);
  assert.match(html, /1 mjese/);
  assert.match(html, /2 po usluzi/);
  assert.match(html, /Cjenik usluga/);
  assert.match(html, /Mjesečni iznos/);
  assert.match(html, /Usluge po izvršenju/);
  assert.match(html, /Jednostavna intervencija/);
  assert.match(html, /Do 10 mjernih mjesta/);
  assert.match(html, /Od 11 do 20 mjernog mjesta/);
  assert.match(html, /Svako iduće mjerno mjesto/);
  assert.match(html, /142,00 EUR/);
  assert.match(html, /55,00 EUR/);
  assert.match(html, /24,00 EUR/);
  assert.doesNotMatch(html, /MM 11 - 20/);
});

test("one-time offer HTML uses financial table with tax footer", () => {
  const html = buildOfferHtmlTemplate({
    title: "One-time ponuda",
    offerNumber: "26-AG-ONE",
    offerDate: "2026-05-06",
    companyName: "Alpha d.o.o.",
    companyOib: "12345678901",
    headquarters: "Zagreb",
    locationName: "Pogon 1",
    serviceLine: "One-Time Service",
    items: [
      {
        description: "Jednokratno ispitivanje",
        unit: "kom",
        quantity: 3,
        unitPrice: 0,
        totalPrice: 120,
        breakdowns: [
          { priceKind: "measurement", measurementTo: "3", amount: 120 },
        ],
      },
    ],
    subtotal: 120,
    taxableSubtotal: 120,
    taxRate: 25,
    taxTotal: 30,
    total: 150,
  });

  assert.match(html, /Jednokratno ispitivanje/);
  assert.match(html, /offer-html-one-time-table/);
  assert.match(html, /Razrada/);
  assert.match(html, /Do 3 mjernih mjesta/);
  assert.match(html, /offer-html-plan-summary/);
  assert.match(html, /Međuzbroj/);
  assert.match(html, /PDV \(25%\)/);
  assert.match(html, /Ukupno s PDV-om/);
  assert.match(html, /150,00 EUR/);
});

test("per employee offer HTML uses employee pricing table with tax footer", () => {
  const html = buildOfferHtmlTemplate({
    title: "Per employee ponuda",
    offerNumber: "26-AG-EMP",
    offerDate: "2026-05-06",
    companyName: "Alpha d.o.o.",
    companyOib: "12345678901",
    headquarters: "Zagreb",
    locationName: "Pogon 1",
    serviceLine: "Per Employee Plan",
    items: [
      {
        description: "Naknada po zaposleniku",
        unit: "zaposlenik",
        quantity: 12,
        unitPrice: 8,
        totalPrice: 96,
      },
    ],
    subtotal: 96,
    taxableSubtotal: 96,
    taxRate: 25,
    taxTotal: 24,
    total: 120,
  });

  assert.match(html, /Per employee plan/);
  assert.match(html, /Cijena po zaposleniku/);
  assert.match(html, /offer-html-per-employee-table/);
  assert.match(html, /Naknada po zaposleniku/);
  assert.match(html, /zaposlenik/);
  assert.match(html, /96,00 EUR/);
  assert.match(html, /PDV \(25%\)/);
  assert.match(html, /120,00 EUR/);
});

test("offer export returns a direct PDF buffer", async () => {
  const outputBuffer = await buildOfferPdfBuffer({
    title: "Ponuda mjerenja",
    offerNumber: "26-AG-001",
    offerDate: "2026-05-06",
    companyName: "Alpha d.o.o.",
    companyOib: "12345678901",
    headquarters: "Zagreb",
    serviceLine: "Fixed Plan",
    items: [
      {
        description: "Mjerenje opreme",
        unit: "kom",
        quantity: 2,
        unitPrice: 13.215,
        totalPrice: 26.43,
      },
    ],
    subtotal: 26.43,
    taxTotal: 6.61,
    total: 33.04,
  });

  assert.equal(outputBuffer.subarray(0, 4).toString("utf8"), "%PDF");
  assert.ok(outputBuffer.length > 1000);
});

test("vehicle evidence PDF merges departure and return into one trip row", async () => {
  const outputBuffer = await buildVehicleEvidencePdfBuffer({
    plateNumber: "ZG1454HS",
    make: "Ford",
    model: "Transit",
    activityItems: [
      {
        activityType: "vehicle_trip",
        reservationId: "trip-1",
        departureAt: "2026-06-22T08:15:00.000Z",
        destination: "Petrol Ogulin - Otok ostarski 8a",
        performedBy: "Branimir Tramosljika",
        startKm: "210144",
        linkedWorkOrderNumber: "26-652",
      },
      {
        activityType: "vehicle_trip",
        reservationId: "trip-1",
        tripStatus: "completed",
        returnAt: "2026-06-22T16:45:00.000Z",
        performedBy: "Branimir Tramosljika",
        endKm: "211122",
        returnCondition: "Povrat: uredno",
        signatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
        linkedWorkOrderNumber: "26-652",
      },
    ],
  });

  assert.equal(outputBuffer.subarray(0, 4).toString("utf8"), "%PDF");
  const text = (await extractPdfText(outputBuffer)).replace(/\s+/g, " ");
  assert.match(text, /Petrol Ogulin - Otok ostarski 8a/);
  assert.match(text, /26-652/);
  assert.match(text, /210144/);
  assert.match(text, /211122/);
  assert.match(text, /Povrat: uredno/);
  assert.match(text, /Potpisano/);
  assert.equal((text.match(/26-652/g) || []).length, 1);
});

test("vehicle evidence PDF includes My Trip return details, documents and signature", async () => {
  const outputBuffer = await buildVehicleEvidencePdfBuffer({
    plateNumber: "ZG8661JS",
    make: "OPEL",
    model: "COMBO",
    activityItems: [
      {
        activityType: "vehicle_trip",
        tripStatus: "completed",
        departureAt: "2026-06-23T19:15:00.000Z",
        returnAt: "2026-06-24T08:20:00.000Z",
        destination: "Dalmacija",
        driverLabels: ["Branimir Tramosljika"],
        startKm: "62388",
        returnOdometerKm: "62620",
        vehicleCondition: "Uredno",
        documents: [
          { fileName: "racun-cestarina.pdf" },
        ],
        signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        signatureLabel: "Branimir Tramosljika",
      },
    ],
  });

  assert.equal(outputBuffer.subarray(0, 4).toString("utf8"), "%PDF");
  const text = (await extractPdfText(outputBuffer)).replace(/\s+/g, " ");
  assert.match(text, /Dalmacija/);
  assert.match(text, /62388/);
  assert.match(text, /62620/);
  assert.match(text, /Uredno/);
  assert.match(text, /racun-\s*cestarina\.pdf/);
  assert.match(text, /Potpisano/);
});

test("vehicle evidence PDF keeps checkout location and RN when return has only closing data", async () => {
  const outputBuffer = await buildVehicleEvidencePdfBuffer({
    plateNumber: "ZG1454HS",
    make: "Ford",
    model: "Transit",
    activityItems: [
      {
        activityType: "vehicle_trip",
        reservationId: "trip-2",
        departureAt: "2026-06-22T08:15:00.000Z",
        destination: "Petrol Ogulin - Otok ostarski 8a",
        performedBy: "Branimir Tramosljika",
        startKm: "210144",
        linkedWorkOrderNumber: "26-652",
      },
      {
        activityType: "vehicle_trip",
        reservationId: "trip-2",
        tripStatus: "completed",
        createdAt: "2026-06-22T16:45:00.000Z",
        performedBy: "Branimir Tramosljika",
        odometerKm: "211122",
        returnCondition: "Povrat: uredno",
      },
    ],
  });

  assert.equal(outputBuffer.subarray(0, 4).toString("utf8"), "%PDF");
  const text = (await extractPdfText(outputBuffer)).replace(/\s+/g, " ");
  assert.match(text, /Petrol Ogulin - Otok ostarski 8a/);
  assert.match(text, /26-652/);
  assert.match(text, /210144/);
  assert.match(text, /211122/);
  assert.match(text, /Povrat: uredno/);
  assert.equal((text.match(/Petrol Ogulin - Otok ostarski 8a/g) || []).length, 1);
  assert.equal((text.match(/26-652/g) || []).length, 1);
});

test("vehicle evidence PDF does not infer return data from unrelated old rows", async () => {
  const outputBuffer = await buildVehicleEvidencePdfBuffer({
    plateNumber: "ZG1454HS",
    make: "Ford",
    model: "Transit",
    activityItems: [
      {
        activityType: "vehicle_trip",
        departureAt: "2026-06-23T06:26:00.000Z",
        destination: "Vodovodna 17, Rijeka",
        performedBy: "Branimir Tramosljika",
        startKm: "22412",
        linkedWorkOrderNumber: "26-652",
      },
      {
        activityType: "vehicle_trip",
        departureAt: "2026-06-23T08:43:00.000Z",
        performedBy: "Branimir Tramosljika",
        startKm: "22480",
      },
    ],
  });

  assert.equal(outputBuffer.subarray(0, 4).toString("utf8"), "%PDF");
  const text = (await extractPdfText(outputBuffer)).replace(/\s+/g, " ");
  assert.match(text, /Vodovodna 17, Rijeka/);
  assert.match(text, /26-652/);
  assert.match(text, /22412/);
  assert.match(text, /22480/);
  assert.equal((text.match(/Branimir Tramosljika/g) || []).length, 2);
});

test("vehicle evidence PDF reads My Trip location and linked work order objects", async () => {
  const outputBuffer = await buildVehicleEvidencePdfBuffer({
    plateNumber: "ZG1454HS",
    make: "Ford",
    model: "Transit",
    activityItems: [
      {
        activityType: "vehicle_trip",
        tripStatus: "completed",
        departureAt: "2026-06-23T06:30:00.000Z",
        returnAt: "2026-06-23T14:10:00.000Z",
        locationName: "PM OGULIN; Otok ostarski 8a, 47300 Ogulin",
        driverLabels: ["Branimir Tramosljika"],
        startKm: "22222",
        endKm: "22444",
        linkedWorkOrders: [
          { id: "wo-652", workOrderNumber: "26-652" },
        ],
        returnCondition: "Uredno",
      },
    ],
  });

  assert.equal(outputBuffer.subarray(0, 4).toString("utf8"), "%PDF");
  const text = (await extractPdfText(outputBuffer)).replace(/\s+/g, " ");
  assert.match(text, /PM OGULIN; Otok ostarski 8a, 47300 Ogulin/);
  assert.match(text, /26-652/);
  assert.match(text, /22222/);
  assert.match(text, /22444/);
  assert.equal((text.match(/26-652/g) || []).length, 1);
});

test("vehicle evidence PDF ignores legacy vehicle usage rows", async () => {
  const outputBuffer = await buildVehicleEvidencePdfBuffer({
    plateNumber: "ZG1454HS",
    activityItems: [
      {
        activityType: "usage",
        workSummary: "Preuzimanje vozila",
        departureAt: "2026-06-22T08:15:00.000Z",
        destination: "Stari unos",
        odometerKm: "210144",
      },
      {
        workSummary: "Putovanje vozila",
        departureAt: "2026-06-22T09:00:00.000Z",
        destination: "Stari MyTrip tekst bez tipa",
        startKm: "210222",
      },
      {
        activityType: "vehicle_trip",
        workSummary: "Putovanje vozila",
        departureAt: "2026-06-23T08:00:00.000Z",
        returnAt: "2026-06-23T16:00:00.000Z",
        destination: "Novi My Trip",
        driverLabels: ["Branimir Tramosljika"],
        startKm: "211000",
        endKm: "211250",
      },
    ],
  });

  assert.equal(outputBuffer.subarray(0, 4).toString("utf8"), "%PDF");
  const text = (await extractPdfText(outputBuffer)).replace(/\s+/g, " ");
  assert.match(text, /Novi My Trip/);
  assert.match(text, /211000/);
  assert.match(text, /211250/);
  assert.equal(text.includes("Stari unos"), false);
  assert.equal(text.includes("Stari MyTrip tekst bez tipa"), false);
  assert.equal(text.includes("210144"), false);
  assert.equal(text.includes("210222"), false);
});
