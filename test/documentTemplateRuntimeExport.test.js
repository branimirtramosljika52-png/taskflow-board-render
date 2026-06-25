import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDocumentTemplateRuntimeDocumentRecordFingerprint,
  buildDocumentTemplateRuntimePdfPayloadFromEntry,
  getDocumentTemplateRuntimePdfEngine,
} from "../src/features/documentTemplates/runtimeExport.js";

test("runtime PDF payload preserves digital and scan signature groups", () => {
  const signatureItems = [
    {
      label: "Ispitivac",
      name: "Ana Savanovic",
      signatureMode: "digital",
      signerOib: "35649316156",
    },
    {
      label: "Odgovorna osoba",
      name: "Branimir Tramosljika",
      signatureMode: "scan",
      signatureImageUrl: "data:image/png;base64,scan",
    },
  ];
  const renderModel = {
    title: "SPR",
    blocks: [{
      title: "Potpisi",
      items: [{
        type: "signature_group",
        title: "Potpisi zapisnika",
        items: signatureItems,
      }],
    }],
  };
  const placeholders = {
    SIGNATURES: {
      __docxBlockType: "signature_group",
      title: "Potpisi zapisnika",
      items: signatureItems,
    },
  };

  const payload = buildDocumentTemplateRuntimePdfPayloadFromEntry({
    pdfFileName: "spr.pdf",
    templateReferenceKind: "word",
    placeholders,
    renderModel,
  });

  assert.equal(payload.fastPdf, false);
  assert.equal(payload.useTemplatePdf, true);
  assert.equal(payload.pdfEngine, "word");
  assert.equal(payload.placeholders, placeholders);
  assert.equal(payload.renderModel, renderModel);
  assert.equal(payload.renderModel.blocks[0].items[0].items[0].signatureMode, "digital");
  assert.equal(payload.renderModel.blocks[0].items[0].items[1].signatureMode, "scan");
  assert.equal(payload.placeholders.SIGNATURES.items[1].signatureImageUrl, "data:image/png;base64,scan");
});

test("runtime PDF payload keeps native export fast and append blocks stable", () => {
  const appendBlocks = [{ type: "handover_protocol", rows: [] }];
  const payload = buildDocumentTemplateRuntimePdfPayloadFromEntry({
    pdfFileName: "native.pdf",
    templateReferenceKind: "",
    appendBlocks,
    forceRenderModel: true,
    exportKind: "handover",
  });

  assert.equal(payload.fastPdf, true);
  assert.equal(payload.useTemplatePdf, false);
  assert.equal(payload.pdfEngine, "native");
  assert.equal(payload.exportKind, "handover");
  assert.equal(payload.forceRenderModel, true);
  assert.equal(payload.appendBlocks, appendBlocks);
});

test("runtime PDF engine supports word, html and native fallbacks", () => {
  assert.equal(getDocumentTemplateRuntimePdfEngine("word"), "word");
  assert.equal(getDocumentTemplateRuntimePdfEngine("html"), "html");
  assert.equal(getDocumentTemplateRuntimePdfEngine("docx"), "native");
});

test("document record fingerprint ignores transient fields but tracks saved values", () => {
  const base = {
    templateId: "t1",
    companyId: "c1",
    locationId: "l1",
    objectId: "o1",
    inspectionDate: "2026-06-25",
    issuedDate: "2026-06-25",
    expirationDate: "2027-06-25",
    fieldValues: { status: "OK" },
    fieldSheets: { sheet1: { rows: 2 } },
    transientUiState: "ignored",
  };
  const sameSavedValues = {
    ...base,
    transientUiState: "changed",
  };
  const changedSavedValues = {
    ...base,
    fieldValues: { status: "NOK" },
  };

  assert.equal(
    buildDocumentTemplateRuntimeDocumentRecordFingerprint(base),
    buildDocumentTemplateRuntimeDocumentRecordFingerprint(sameSavedValues),
  );
  assert.notEqual(
    buildDocumentTemplateRuntimeDocumentRecordFingerprint(base),
    buildDocumentTemplateRuntimeDocumentRecordFingerprint(changedSavedValues),
  );
});
