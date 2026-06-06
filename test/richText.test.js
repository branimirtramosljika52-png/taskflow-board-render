import assert from "node:assert/strict";
import test from "node:test";

import {
  isRichTextHtml,
  plainTextToRichTextHtml,
  richTextHtmlToPlainText,
  sanitizeRichTextHtml,
} from "../src/utils/richText.js";

test("rich text sanitizer keeps document formatting and removes unsafe markup", () => {
  const html = sanitizeRichTextHtml(`
    <!--StartFragment-->
    <h2 onclick="alert(1)">Naslov</h2>
    <p style="text-align:center;color:red">Tekst <strong>bold</strong><script>alert(1)</script></p>
    <ul><li>Prva</li><li>Druga</li></ul>
    <table><tr><th colspan="2">A</th></tr><tr><td>B</td><td>C</td></tr></table>
    <!--EndFragment-->
  `);

  assert.match(html, /<h2>Naslov<\/h2>/);
  assert.match(html, /<p style="text-align:center;color:red">Tekst <strong>bold<\/strong><\/p>/);
  assert.match(html, /<ul><li>Prva<\/li><li>Druga<\/li><\/ul>/);
  assert.match(html, /<table><tr><th colspan="2">A<\/th><\/tr><tr><td>B<\/td><td>C<\/td><\/tr><\/table>/);
  assert.doesNotMatch(html, /onclick|script/i);
  assert.doesNotMatch(html, /alert\(1\)/i);
});

test("rich text sanitizer preserves Word-style tables, inline styles, links and images", () => {
  const html = sanitizeRichTextHtml(`
    <!--StartFragment-->
    <p class="MsoNormal" style="margin-left:36pt;text-align:justify;color:#1f2937;font-family:'Aptos',sans-serif;font-size:11pt;mso-list:l0 level1 lfo1">
      <span style="font-weight:bold;background-color:yellow">Procjena</span>
    </p>
    <table style="border-collapse:collapse;width:320pt">
      <tr>
        <td width="160" style="border:1pt solid #000;padding:4pt;background-color:#f8fafc">A</td>
        <td style="border:1pt solid #000;color:rgb(30,64,175)">B</td>
      </tr>
    </table>
    <a href="https://safe-nexus.org" onclick="bad()">Safe Nexus</a>
    <font size="4" face="Calibri" color="#b91c1c">Velicina</font>
    <img src="data:image/png;base64,iVBORw0KGgo=" width="120" alt="Logo" onerror="bad()" />
    <img src="javascript:alert(1)" />
    <!--EndFragment-->
  `);

  assert.match(html, /margin-left:36pt/);
  assert.match(html, /text-align:justify/);
  assert.match(html, /font-family:'Aptos',sans-serif/);
  assert.match(html, /background-color:yellow/);
  assert.match(html, /<table style="border-collapse:collapse;width:320pt">/);
  assert.match(html, /<td style="border:1pt solid #000;padding:4pt;background-color:#f8fafc;width:160px">A<\/td>/);
  assert.match(html, /href="https:\/\/safe-nexus\.org" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /<span style="color:#b91c1c;font-family:Calibri;font-size:14pt">Velicina<\/span>/);
  assert.match(html, /<img src="data:image\/png;base64,iVBORw0KGgo=" alt="Logo" loading="lazy" style="width:120px">/);
  assert.doesNotMatch(html, /MsoNormal|mso-list|onclick|onerror|javascript/i);
});

test("plain text paste becomes paragraphs and lists", () => {
  const html = plainTextToRichTextHtml("Uvod\n- prva stavka\n- druga stavka\n1. korak");

  assert.match(html, /<p>Uvod<\/p>/);
  assert.match(html, /<ul><li>prva stavka<\/li><li>druga stavka<\/li><\/ul>/);
  assert.match(html, /<ol><li>korak<\/li><\/ol>/);
});

test("rich text converts to plain fallback for non-html exports", () => {
  const text = richTextHtmlToPlainText("<h2>Naslov</h2><ul><li>Stavka</li></ul><table><tr><td>A</td><td>B</td></tr></table>");

  assert.match(text, /Naslov/);
  assert.match(text, /- Stavka/);
  assert.match(text, /A \| B/);
  assert.equal(isRichTextHtml("<p>Tekst</p>"), true);
});
