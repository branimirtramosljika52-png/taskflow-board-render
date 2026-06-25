export function getDocumentTemplateRuntimePdfEngine(templateReferenceKind = "") {
  const kind = String(templateReferenceKind || "").trim().toLowerCase();
  if (kind === "word") {
    return "word";
  }
  if (kind === "html") {
    return "html";
  }
  return "native";
}

export function buildDocumentTemplateRuntimePdfPayloadFromEntry(exportEntry = null) {
  if (!exportEntry) {
    return null;
  }

  const templateEngine = getDocumentTemplateRuntimePdfEngine(exportEntry.templateReferenceKind);
  const usesTemplateDocument = templateEngine === "html" || templateEngine === "word";

  return {
    fileName: exportEntry.pdfFileName,
    fastPdf: usesTemplateDocument ? false : true,
    useTemplatePdf: usesTemplateDocument,
    pdfEngine: templateEngine,
    templateReferenceKind: exportEntry.templateReferenceKind,
    exportKind: exportEntry.exportKind || "",
    forceRenderModel: Boolean(exportEntry.forceRenderModel),
    placeholders: exportEntry.placeholders,
    appendBlocks: exportEntry.appendBlocks ?? [],
    documentRecord: exportEntry.documentRecord,
    renderModel: exportEntry.renderModel,
  };
}

export function buildDocumentTemplateRuntimeDocumentRecordFingerprint(payload = null) {
  if (!payload) {
    return "";
  }

  return JSON.stringify({
    templateId: payload.templateId,
    companyId: payload.companyId,
    locationId: payload.locationId,
    objectId: payload.objectId,
    inspectionDate: payload.inspectionDate,
    issuedDate: payload.issuedDate,
    expirationDate: payload.expirationDate,
    fieldValues: payload.fieldValues ?? {},
    fieldSheets: payload.fieldSheets ?? {},
  });
}
