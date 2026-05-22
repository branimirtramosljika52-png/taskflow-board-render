import assert from "node:assert/strict";
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
  buildPdfFromRenderModel,
  collectPdfSignatureFieldSpecsFromEntry,
  convertWordBufferToHtmlTemplate,
  readStoredDocumentBuffer,
} from "../src/documentExport.js";

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
      rows: [{
        service: "Ex - elektricna instalacija",
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
          cells: [{ text: "Otpor" }, { text: "1,2 Ω" }],
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
  assert.match(html, /Ana Ivić/);
  assert.doesNotMatch(html, /Ispitiva/);
  assert.doesNotMatch(html, new RegExp(["Scan", "potpisa"].join("\\s+"), "i"));
  assert.match(html, /safe-nexus-template-signature-image/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /\{\{DOCUMENT_TITLE\}\}/);
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
      rows: [{
        service: "Ex - elektricna instalacija",
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
  assert.match(streams, /1 0 0 1 [0-9.]+ 172 cm[\s\S]*120 0 0 120 0 0 cm/);
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
    ],
    subtotal: 26.43,
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
  assert.match(html, /26,43 EUR/);
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
    ],
  });

  assert.match(html, /Mjesečne naknade/);
  assert.match(html, /Cjenik usluga/);
  assert.match(html, /Mjesečni iznos/);
  assert.match(html, /Usluge po izvršenju/);
  assert.match(html, /Do 10 mjernih mjesta/);
  assert.match(html, /Od 11 do 20 mjernog mjesta/);
  assert.match(html, /Svako iduće mjerno mjesto/);
  assert.match(html, /142,00 EUR/);
  assert.match(html, /24,00 EUR/);
  assert.doesNotMatch(html, /MM 11 - 20/);
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
