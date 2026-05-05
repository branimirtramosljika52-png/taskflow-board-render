import assert from "node:assert/strict";
import test from "node:test";

import PizZip from "pizzip";

import {
  buildDashboardCalendarReportPdfBuffer,
  buildDocxFromTemplateBuffer,
} from "../src/documentExport.js";

function buildMinimalDocxBuffer(documentXml = "") {
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
  zip.folder("word").file("document.xml", documentXml);
  zip.folder("word").folder("_rels").file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
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
  assert.match(outputXml, /Digitalni potpis/);
  assert.match(outputXml, /______________________________/);
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
