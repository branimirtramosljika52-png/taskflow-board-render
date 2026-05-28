const PUBCHEM_DEFAULT_PUG_BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUBCHEM_DEFAULT_PUG_VIEW_BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view";
const PUBCHEM_TIMEOUT_MS = 12000;
const PUBCHEM_MAX_RESULTS = 10;
const PUBCHEM_MAX_SYNONYMS = 30;
const PUBCHEM_CAS_PATTERN = /^\d{2,7}-\d{2}-\d$/;
const PUBCHEM_PROPERTY_FIELDS = Object.freeze([
  "Title",
  "MolecularFormula",
  "MolecularWeight",
  "IUPACName",
  "CanonicalSMILES",
  "IsomericSMILES",
  "InChI",
  "InChIKey",
  "XLogP",
  "TPSA",
  "Complexity",
  "Charge",
  "HBondDonorCount",
  "HBondAcceptorCount",
  "RotatableBondCount",
  "ExactMass",
  "MonoisotopicMass",
]);

function createPubChemError(message, statusCode = 502) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizePubChemText(value = "") {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizePubChemBaseUrl(value, fallback) {
  return String(value || fallback).trim().replace(/\/+$/, "");
}

function uniqueStrings(values = [], limit = Number.POSITIVE_INFINITY) {
  const seen = new Set();
  const items = [];
  values.forEach((value) => {
    const text = normalizePubChemText(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) {
      return;
    }
    seen.add(key);
    items.push(text);
  });
  return items.slice(0, limit);
}

function valueToNullableNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizePubChemLookupQuery(value = "") {
  const query = normalizePubChemText(value).slice(0, 180);
  if (query.length < 2) {
    throw createPubChemError("Upisi barem dva znaka za PubChem pretragu.", 400);
  }
  return query;
}

export function normalizePubChemCid(value = "") {
  const cid = Number(String(value ?? "").trim());
  if (!Number.isInteger(cid) || cid <= 0) {
    throw createPubChemError("PubChem CID nije ispravan.", 400);
  }
  return cid;
}

export function buildPubChemPugUrl(path, params = {}, baseUrl = PUBCHEM_DEFAULT_PUG_BASE_URL) {
  const cleanPath = String(path || "").startsWith("/") ? String(path || "") : `/${path || ""}`;
  const url = new URL(`${normalizePubChemBaseUrl(baseUrl, PUBCHEM_DEFAULT_PUG_BASE_URL)}${cleanPath}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

export function buildPubChemPugViewUrl(path, params = {}, baseUrl = PUBCHEM_DEFAULT_PUG_VIEW_BASE_URL) {
  const cleanPath = String(path || "").startsWith("/") ? String(path || "") : `/${path || ""}`;
  const url = new URL(`${normalizePubChemBaseUrl(baseUrl, PUBCHEM_DEFAULT_PUG_VIEW_BASE_URL)}${cleanPath}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

function getPubChemFaultMessage(payload = null, fallback = "PubChem poziv nije uspio.") {
  const fault = payload?.Fault || payload?.fault || null;
  const detail = Array.isArray(fault?.Details) ? fault.Details.find(Boolean) : "";
  return normalizePubChemText(
    detail
      || fault?.Message
      || payload?.message
      || payload?.error
      || fallback,
  );
}

export async function fetchPubChemJson(url, options = {}) {
  const timeoutMs = Number(options.timeoutMs || PUBCHEM_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    const responseText = await result.text();
    let payload = null;
    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = null;
      }
    }

    if (!result.ok) {
      if (options.allow404 && result.status === 404) {
        return null;
      }
      const message = getPubChemFaultMessage(payload, "PubChem trenutno nije dostupan.");
      throw createPubChemError(message, result.status === 404 ? 404 : result.status || 502);
    }

    return payload || {};
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createPubChemError("PubChem se nije javio na vrijeme.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function isValidCasNumber(value = "") {
  const cas = normalizePubChemText(value);
  if (!PUBCHEM_CAS_PATTERN.test(cas)) {
    return false;
  }
  const [first, second, checksum] = cas.split("-");
  const digits = `${first}${second}`.split("").reverse().map((digit) => Number(digit));
  const sum = digits.reduce((total, digit, index) => total + digit * (index + 1), 0);
  return sum % 10 === Number(checksum);
}

export function extractPubChemCidList(payload = {}) {
  return (Array.isArray(payload?.IdentifierList?.CID) ? payload.IdentifierList.CID : [])
    .map((cid) => Number(cid))
    .filter((cid) => Number.isInteger(cid) && cid > 0);
}

export function mapPubChemPropertyEntry(entry = {}) {
  const cid = normalizePubChemCid(entry.CID);
  return {
    cid,
    title: normalizePubChemText(entry.Title || ""),
    molecularFormula: normalizePubChemText(entry.MolecularFormula || ""),
    molecularWeight: normalizePubChemText(entry.MolecularWeight || ""),
    iupacName: normalizePubChemText(entry.IUPACName || ""),
    canonicalSmiles: normalizePubChemText(entry.CanonicalSMILES || ""),
    isomericSmiles: normalizePubChemText(entry.IsomericSMILES || ""),
    inchi: normalizePubChemText(entry.InChI || ""),
    inchiKey: normalizePubChemText(entry.InChIKey || ""),
    xLogP: valueToNullableNumber(entry.XLogP),
    tpsa: valueToNullableNumber(entry.TPSA),
    complexity: valueToNullableNumber(entry.Complexity),
    charge: valueToNullableNumber(entry.Charge),
    hydrogenBondDonorCount: valueToNullableNumber(entry.HBondDonorCount),
    hydrogenBondAcceptorCount: valueToNullableNumber(entry.HBondAcceptorCount),
    rotatableBondCount: valueToNullableNumber(entry.RotatableBondCount),
    exactMass: normalizePubChemText(entry.ExactMass || ""),
    monoisotopicMass: normalizePubChemText(entry.MonoisotopicMass || ""),
  };
}

export function mapPubChemSynonymsByCid(payload = {}) {
  const rows = Array.isArray(payload?.InformationList?.Information)
    ? payload.InformationList.Information
    : [];
  const map = new Map();
  rows.forEach((row) => {
    const cid = Number(row?.CID);
    if (!Number.isInteger(cid) || cid <= 0) {
      return;
    }
    const synonyms = uniqueStrings(Array.isArray(row.Synonym) ? row.Synonym : [], PUBCHEM_MAX_SYNONYMS);
    map.set(cid, synonyms);
  });
  return map;
}

function collectPubChemValueStrings(value, output = [], depth = 0) {
  if (depth > 12 || value === null || value === undefined) {
    return output;
  }

  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectPubChemValueStrings(item, output, depth + 1));
    return output;
  }

  if (typeof value !== "object") {
    return output;
  }

  if (typeof value.String === "string") {
    output.push(value.String);
  }
  if (typeof value.Number === "number" || typeof value.Number === "string") {
    output.push(String(value.Number));
  }
  if (Array.isArray(value.Strings)) {
    value.Strings.forEach((item) => collectPubChemValueStrings(item, output, depth + 1));
  }
  if (Array.isArray(value.StringWithMarkup)) {
    value.StringWithMarkup.forEach((item) => collectPubChemValueStrings(item, output, depth + 1));
  }
  if (value.Table) {
    collectPubChemValueStrings(value.Table, output, depth + 1);
  }
  if (Array.isArray(value.Row)) {
    value.Row.forEach((row) => collectPubChemValueStrings(row, output, depth + 1));
  }
  if (Array.isArray(value.Cell)) {
    value.Cell.forEach((cell) => collectPubChemValueStrings(cell, output, depth + 1));
  }
  if (value.Value) {
    collectPubChemValueStrings(value.Value, output, depth + 1);
  }

  return output;
}

function extractPubChemSectionTexts(section = {}) {
  const information = Array.isArray(section?.Information) ? section.Information : [];
  return uniqueStrings(information.flatMap((item) => collectPubChemValueStrings(item?.Value, [])), 160);
}

export function flattenPubChemSections(recordOrSection = {}) {
  const rootSections = Array.isArray(recordOrSection?.Record?.Section)
    ? recordOrSection.Record.Section
    : Array.isArray(recordOrSection?.Section)
      ? recordOrSection.Section
      : [];
  const sections = [];

  function walk(section = {}, path = []) {
    const heading = normalizePubChemText(section.TOCHeading || section.Name || "");
    const nextPath = heading ? [...path, heading] : path;
    const texts = extractPubChemSectionTexts(section);
    if (heading || texts.length > 0) {
      sections.push({
        heading,
        path: nextPath.join(" / "),
        texts,
      });
    }
    (Array.isArray(section.Section) ? section.Section : []).forEach((child) => walk(child, nextPath));
  }

  rootSections.forEach((section) => walk(section, []));
  return sections;
}

function splitPubChemSafetyTexts(texts = []) {
  return uniqueStrings(texts.flatMap((text) => normalizePubChemText(text)
    .split(/\n+|(?:\s{2,})|(?=\b[HP]\d{3}[A-Z]?:)/g)
    .map((part) => part.trim())), 240);
}

function looksLikeHazardStatement(text = "") {
  return /\bH\d{3}[A-Z]?\b/i.test(text)
    || /\b(fatal|toxic|harmful|flammable|explosive|corrosive|irritation|irritating|causes|may cause|suspected|aquatic life)\b/i.test(text);
}

function looksLikePrecautionaryStatement(text = "") {
  return /\bP\d{3}[A-Z]?\b/i.test(text)
    || /\b(keep away|wear|avoid|wash|store|dispose|if exposed|if inhaled|if swallowed|if on skin|call a poison)\b/i.test(text);
}

function extractPubChemSignalWords(texts = []) {
  const words = [];
  texts.forEach((text) => {
    const matches = normalizePubChemText(text).match(/\b(Danger|Warning)\b/gi) || [];
    matches.forEach((match) => words.push(match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()));
  });
  return uniqueStrings(words, 4);
}

function extractPubChemPictograms(texts = []) {
  const pictograms = [];
  const pattern = /\b(GHS0?[1-9]|Exploding Bomb|Flame Over Circle|Flame|Skull and Crossbones|Corrosion|Gas Cylinder|Health Hazard|Exclamation Mark|Environment)\b/gi;
  texts.forEach((text) => {
    const matches = normalizePubChemText(text).match(pattern) || [];
    matches.forEach((match) => pictograms.push(match));
  });
  return uniqueStrings(pictograms, 12);
}

export function extractPubChemSafetySummary(payload = {}) {
  const sections = flattenPubChemSections(payload);
  const relevant = sections.filter((section) => {
    const key = `${section.path} ${section.heading}`.toLowerCase();
    return /(ghs|hazard|safety|precautionary|pictogram|signal|classification)/.test(key);
  });
  const sourceSections = relevant.length ? relevant : sections;
  const textParts = splitPubChemSafetyTexts(sourceSections.flatMap((section) => section.texts));
  const hazardStatements = uniqueStrings(textParts.filter(looksLikeHazardStatement), 40);
  const precautionaryStatements = uniqueStrings(textParts.filter(looksLikePrecautionaryStatement), 40);

  return {
    available: sourceSections.some((section) => section.texts.length > 0),
    signalWords: extractPubChemSignalWords(textParts),
    pictograms: extractPubChemPictograms(textParts),
    hazardStatements,
    precautionaryStatements,
    sections: sourceSections
      .filter((section) => section.texts.length > 0)
      .slice(0, 12)
      .map((section) => ({
        heading: section.heading,
        path: section.path,
        texts: section.texts.slice(0, 24),
      })),
  };
}

async function resolvePubChemCidsByName(query, options = {}) {
  const fetchJson = options.fetchJson || fetchPubChemJson;
  const pugBaseUrl = options.pugBaseUrl || PUBCHEM_DEFAULT_PUG_BASE_URL;
  const encodedQuery = encodeURIComponent(query);
  const exactPayload = await fetchJson(
    buildPubChemPugUrl(`/compound/name/${encodedQuery}/cids/JSON`, {}, pugBaseUrl),
    { allow404: true },
  );
  let cids = extractPubChemCidList(exactPayload || {});
  if (cids.length > 0) {
    return cids;
  }

  const wordPayload = await fetchJson(
    buildPubChemPugUrl(`/compound/name/${encodedQuery}/cids/JSON`, { name_type: "word" }, pugBaseUrl),
    { allow404: true },
  );
  cids = extractPubChemCidList(wordPayload || {});
  if (cids.length === 0) {
    throw createPubChemError("PubChem nije pronasao tvar za upit.", 404);
  }
  return cids;
}

async function fetchPubChemProperties(cids = [], options = {}) {
  const fetchJson = options.fetchJson || fetchPubChemJson;
  const pugBaseUrl = options.pugBaseUrl || PUBCHEM_DEFAULT_PUG_BASE_URL;
  const payload = await fetchJson(buildPubChemPugUrl(
    `/compound/cid/${cids.join(",")}/property/${PUBCHEM_PROPERTY_FIELDS.join(",")}/JSON`,
    {},
    pugBaseUrl,
  ));
  return (Array.isArray(payload?.PropertyTable?.Properties) ? payload.PropertyTable.Properties : [])
    .map(mapPubChemPropertyEntry);
}

async function fetchPubChemSynonyms(cids = [], options = {}) {
  const fetchJson = options.fetchJson || fetchPubChemJson;
  const pugBaseUrl = options.pugBaseUrl || PUBCHEM_DEFAULT_PUG_BASE_URL;
  const payload = await fetchJson(
    buildPubChemPugUrl(`/compound/cid/${cids.join(",")}/synonyms/JSON`, {}, pugBaseUrl),
    { allow404: true },
  );
  return mapPubChemSynonymsByCid(payload || {});
}

async function fetchPubChemSafety(cid, options = {}) {
  const fetchJson = options.fetchJson || fetchPubChemJson;
  const pugViewBaseUrl = options.pugViewBaseUrl || PUBCHEM_DEFAULT_PUG_VIEW_BASE_URL;
  const payload = await fetchJson(
    buildPubChemPugViewUrl(`/data/compound/${cid}/JSON`, {
      heading: "GHS Classification",
      response_type: "display",
    }, pugViewBaseUrl),
    { allow404: true },
  );
  return payload ? extractPubChemSafetySummary(payload) : {
    available: false,
    signalWords: [],
    pictograms: [],
    hazardStatements: [],
    precautionaryStatements: [],
    sections: [],
  };
}

function buildCompoundRecords(properties = [], synonymsByCid = new Map(), safetyByCid = new Map()) {
  return properties.map((propertiesEntry) => {
    const synonyms = synonymsByCid.get(propertiesEntry.cid) || [];
    const casNumbers = synonyms.filter(isValidCasNumber).slice(0, 8);
    const title = propertiesEntry.title || synonyms[0] || propertiesEntry.iupacName || `CID ${propertiesEntry.cid}`;
    return {
      ...propertiesEntry,
      title,
      name: title,
      casNumbers,
      synonyms,
      pubChemUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${propertiesEntry.cid}`,
      structureImageUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${propertiesEntry.cid}/PNG?record_type=2d&image_size=300x300`,
      safety: safetyByCid.get(propertiesEntry.cid) || null,
    };
  });
}

export async function buildPubChemCompoundPayload(cid, options = {}) {
  const normalizedCid = normalizePubChemCid(cid);
  const includeSafety = Boolean(options.includeSafety);
  const properties = await fetchPubChemProperties([normalizedCid], options);
  if (properties.length === 0) {
    throw createPubChemError("PubChem nije vratio svojstva za zadani CID.", 404);
  }
  const synonymsByCid = await fetchPubChemSynonyms([normalizedCid], options);
  const safetyByCid = new Map();
  if (includeSafety) {
    safetyByCid.set(normalizedCid, await fetchPubChemSafety(normalizedCid, options));
  }

  const compounds = buildCompoundRecords(properties, synonymsByCid, safetyByCid);
  return {
    ok: true,
    provider: "pubchem",
    source: "PubChem PUG-REST",
    sourceUrl: PUBCHEM_DEFAULT_PUG_BASE_URL,
    generatedAt: new Date().toISOString(),
    query: String(normalizedCid),
    compounds,
    compound: compounds[0] || null,
  };
}

export async function buildPubChemLookupPayload(query, options = {}) {
  const normalizedQuery = normalizePubChemLookupQuery(query);
  const maxResults = Math.max(1, Math.min(Number(options.maxResults || PUBCHEM_MAX_RESULTS), PUBCHEM_MAX_RESULTS));
  const includeSafety = Boolean(options.includeSafety);
  const cids = (await resolvePubChemCidsByName(normalizedQuery, options)).slice(0, maxResults);
  const properties = await fetchPubChemProperties(cids, options);
  const synonymsByCid = await fetchPubChemSynonyms(cids, options);
  const safetyByCid = new Map();
  if (includeSafety && cids[0]) {
    safetyByCid.set(cids[0], await fetchPubChemSafety(cids[0], options));
  }
  const compounds = buildCompoundRecords(properties, synonymsByCid, safetyByCid);

  return {
    ok: true,
    provider: "pubchem",
    source: "PubChem PUG-REST",
    sourceUrl: PUBCHEM_DEFAULT_PUG_BASE_URL,
    generatedAt: new Date().toISOString(),
    query: normalizedQuery,
    count: compounds.length,
    compounds,
    compound: compounds[0] || null,
  };
}
