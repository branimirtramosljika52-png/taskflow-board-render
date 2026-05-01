import assert from "node:assert/strict";
import test from "node:test";

import PizZip from "pizzip";

import { buildDocxFromTemplateBuffer } from "../src/documentExport.js";

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
