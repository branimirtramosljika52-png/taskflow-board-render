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
  assert.match(html, /<p style="text-align:center">Tekst <strong>bold<\/strong><\/p>/);
  assert.match(html, /<ul><li>Prva<\/li><li>Druga<\/li><\/ul>/);
  assert.match(html, /<table><tr><th colspan="2">A<\/th><\/tr><tr><td>B<\/td><td>C<\/td><\/tr><\/table>/);
  assert.doesNotMatch(html, /onclick|script|color:red/i);
  assert.doesNotMatch(html, /alert\(1\)/i);
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
