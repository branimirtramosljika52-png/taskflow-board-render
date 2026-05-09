import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";
import JSZip from "jszip";
import * as XLSX from "xlsx";

import {
  canCreateCompanies,
  canDeleteCompanies,
  canEditCompanies,
  canDeleteWorkOrders,
  canManageMasterData,
  canManageWorkOrders,
  hasAppPermission,
  isClientPortalUser,
} from "./src/accessControl.js";
import {
  buildAppCapabilitiesPdfBuffer,
  buildDashboardCalendarReportPdfBuffer,
  buildOfferHtmlPdfBuffer,
  buildOfferHtmlTemplate,
  buildOfferPdfBuffer,
  buildPurchaseOrderPdfBuffer,
  buildWorkOrderPdfBuffer,
  buildPdfFromHtmlTemplateBatchEntries,
  buildPdfFromHtmlTemplateBuffer,
  buildPdfFromRenderModel,
  buildPdfFromTemplateBuffer,
  buildDocxFromTemplateBuffer,
  convertHtmlToPdfBuffer,
  convertDocxBuffersToPdfBuffers,
  convertWordBufferToHtmlTemplate,
  isHtmlTemplateFile,
  isWordTemplateFile,
  mergePdfBuffers,
  readStoredDocumentBuffer,
  sanitizeGeneratedDocumentFileName,
} from "./src/documentExport.js";
import { createLiveChatStore } from "./src/liveChatStore.js";
import { sendMail } from "./src/mailer.js";
import { createSafetyRepository } from "./src/safetyRepository.js";
import { createTenantRepository } from "./src/tenantRepository.js";
import {
  clearAuthCookies,
  createAccessToken,
  createAuthCookies,
  createRefreshToken,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  parseCookies,
  resolveJwtSecret,
  verifyToken,
} from "./src/webAuth.js";
import {
  PERSON_TRAINING_TYPE_OPTIONS,
  WORK_ORDER_STATUS_OPTIONS,
  doesAbsenceTypeRequireApproval,
} from "./src/safetyModel.js";

const port = Number(process.env.PORT || 3000);
const rootDir = resolve(process.cwd());
const distDir = resolve(rootDir, "dist");
const staticRoot = existsSync(resolve(distDir, "index.html")) ? distDir : rootDir;
const requestUserSymbol = Symbol("requestUser");
const responseRequestSymbol = Symbol("responseRequest");
const jwtSecret = resolveJwtSecret();
const publicAppUrl = String(process.env.PUBLIC_APP_URL || process.env.APP_URL || "").trim().replace(/\/+$/, "");
const canonicalAppOrigin = (() => {
  if (!publicAppUrl) {
    return "";
  }

  try {
    return new URL(publicAppUrl).origin;
  } catch {
    console.warn(`Invalid PUBLIC_APP_URL/APP_URL value "${publicAppUrl}", canonical redirect disabled.`);
    return "";
  }
})();
const canonicalAppHost = canonicalAppOrigin ? new URL(canonicalAppOrigin).host.toLowerCase() : "";
const GENERATED_WORK_ORDER_PDF_CATEGORY = "Radni nalog PDF";
const GENERATED_DOCUMENT_TEMPLATE_PDF_CATEGORY = "Zapisnik PDF";
const GENERATED_PEOPLE_TRAINING_CERTIFICATE_CATEGORY = "Automatsko uvjerenje";
const GENERATED_PEOPLE_TRAINING_CERTIFICATE_SOURCE = "people-training-certificate";
const OPENAI_DEFAULT_API_BASE_URL = "https://api.openai.com/v1";
const OPENAI_RESPONSES_PATH = "/responses";
const OPENAI_DEFAULT_MODEL_BY_TIER = Object.freeze({
  fast: "gpt-4.1-nano",
  standard: "gpt-4.1-mini",
  strong: "gpt-5.1-mini",
  max: "gpt-5.1",
});
const OPENAI_MODEL_TIERS = Object.freeze([
  { value: "fast", label: "Brzi", strength: "Slabiji / jeftiniji", env: "OPENAI_MODEL_FAST" },
  { value: "standard", label: "Standard", strength: "Uravnotežen", env: "OPENAI_MODEL" },
  { value: "strong", label: "Jaki", strength: "Precizniji", env: "OPENAI_MODEL_STRONG" },
  { value: "max", label: "Najjači", strength: "Najsporiji / najskuplji", env: "OPENAI_MODEL_MAX" },
]);
const OPENAI_MAX_INLINE_FILE_COUNT = 5;
const OPENAI_MAX_TEXT_FILE_CHARS = 60000;
const OPENAI_MAX_CONTEXT_JSON_CHARS = 80000;
const OPENWEATHER_DEFAULT_API_BASE_URL = "https://api.openweathermap.org/data/2.5";
const OPENWEATHER_DEFAULT_GEO_BASE_URL = "https://api.openweathermap.org/geo/1.0";
const OPENWEATHER_MAX_CITIES = 8;
const OPENWEATHER_CITY_SEARCH_LIMIT = 8;
const OPENWEATHER_TIMEOUT_MS = 9000;
const OPENWEATHER_STRONG_WIND_MS = 13.9;
const OPENWEATHER_DANGEROUS_WIND_MS = 20.8;
const DOCUMENT_TEMPLATE_WORD_HTML_MAX_BYTES = Math.max(
  1024 * 1024,
  Number(process.env.DOCUMENT_TEMPLATE_WORD_HTML_MAX_BYTES || 28 * 1024 * 1024) || 28 * 1024 * 1024,
);
const securityContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval' https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://unpkg.com",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob: data: https:",
  "upgrade-insecure-requests",
].join("; ");

function normalizeEnvBoolean(value, fallback = false) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function getOpenAiRuntimeConfig() {
  const apiBaseUrl = String(process.env.OPENAI_API_BASE_URL || OPENAI_DEFAULT_API_BASE_URL).trim().replace(/\/+$/, "");
  const dryRun = normalizeEnvBoolean(process.env.OPENAI_DRY_RUN, true);
  const liveCallsEnabled = normalizeEnvBoolean(process.env.OPENAI_ENABLE_LIVE_CALLS, false) && !dryRun;

  return {
    provider: "openai",
    keyConfigured: Boolean(String(process.env.OPENAI_API_KEY || "").trim()),
    dryRun,
    liveCallsEnabled,
    apiBaseUrl,
    endpoint: `${apiBaseUrl}${OPENAI_RESPONSES_PATH}`,
    model: String(process.env.OPENAI_MODEL || "").trim(),
  };
}

function normalizeOpenAiModelTier(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return OPENAI_MODEL_TIERS.some((option) => option.value === normalized) ? normalized : "standard";
}

function getOpenAiModelTierOption(value = "") {
  const normalized = normalizeOpenAiModelTier(value);
  return OPENAI_MODEL_TIERS.find((option) => option.value === normalized) || OPENAI_MODEL_TIERS[1];
}

function getOpenAiModelForTier(tier = "standard", config = getOpenAiRuntimeConfig()) {
  const option = getOpenAiModelTierOption(tier);
  return String(process.env[option.env] || config.model || OPENAI_DEFAULT_MODEL_BY_TIER[option.value] || "").trim();
}

function buildOpenAiModelTierPayload(config = getOpenAiRuntimeConfig()) {
  return OPENAI_MODEL_TIERS.map((option) => ({
    value: option.value,
    label: option.label,
    strength: option.strength,
    modelConfigured: Boolean(getOpenAiModelForTier(option.value, config)),
  }));
}

function buildOpenAiStatusPayload() {
  const config = getOpenAiRuntimeConfig();
  return {
    ok: true,
    provider: config.provider,
    keyConfigured: config.keyConfigured,
    dryRun: config.dryRun,
    liveCallsEnabled: config.liveCallsEnabled,
    endpointReady: config.keyConfigured && (config.dryRun || config.liveCallsEnabled),
    model: config.model || OPENAI_DEFAULT_MODEL_BY_TIER.standard,
    modelTiers: buildOpenAiModelTierPayload(config),
    endpoint: config.endpoint,
    tokenSpend: config.liveCallsEnabled ? "enabled" : "disabled",
  };
}

function getOpenWeatherRuntimeConfig() {
  const apiBaseUrl = String(process.env.OPENWEATHER_API_BASE_URL || OPENWEATHER_DEFAULT_API_BASE_URL)
    .trim()
    .replace(/\/+$/, "");
  const geoBaseUrl = String(process.env.OPENWEATHER_GEO_BASE_URL || OPENWEATHER_DEFAULT_GEO_BASE_URL)
    .trim()
    .replace(/\/+$/, "");
  const apiKey = String(process.env.OPENWEATHER_API_KEY || "").trim();
  return {
    apiBaseUrl,
    geoBaseUrl,
    apiKey,
    keyConfigured: Boolean(apiKey),
  };
}

function normalizeOpenWeatherCityName(value = "") {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function parseOpenWeatherGeoCityToken(value = "") {
  const normalized = normalizeOpenWeatherCityName(value);
  const match = normalized.match(/^geo:([-+]?\d+(?:\.\d+)?),([-+]?\d+(?:\.\d+)?)(?::(.+))?$/i);
  if (!match) {
    return null;
  }
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  return {
    lat,
    lon,
    label: normalizeOpenWeatherCityName(match[3] || ""),
    query: normalized,
  };
}

function getOpenWeatherRequestedCities(url) {
  const repeatedCities = url.searchParams.getAll("city");
  const packedCities = String(url.searchParams.get("cities") || "")
    .split("|")
    .map((item) => item.trim());
  const seen = new Set();
  return [...repeatedCities, ...packedCities]
    .map(normalizeOpenWeatherCityName)
    .filter((city) => {
      const key = city.toLowerCase();
      if (!city || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, OPENWEATHER_MAX_CITIES);
}

function titleCaseOpenWeatherDescription(value = "") {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function getOpenWeatherCondition(weather = {}) {
  const weatherId = Number(weather.id);
  const main = String(weather.main || "").trim().toLowerCase();
  if (weatherId >= 200 && weatherId < 300) return "thunderstorm";
  if (weatherId >= 300 && weatherId < 400) return "drizzle";
  if (weatherId >= 500 && weatherId < 600) return "rain";
  if (weatherId >= 600 && weatherId < 700) return "snow";
  if (weatherId >= 700 && weatherId < 800) return main || "mist";
  if (weatherId === 800 || main === "clear") return "clear";
  if (weatherId > 800 || main === "clouds") return "clouds";
  return main || "clear";
}

function buildOpenWeatherUrl(path, params = {}) {
  const config = getOpenWeatherRuntimeConfig();
  const url = new URL(`${config.apiBaseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set("appid", config.apiKey);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "hr");
  return url;
}

function buildOpenWeatherGeoUrl(path, params = {}) {
  const config = getOpenWeatherRuntimeConfig();
  const url = new URL(`${config.geoBaseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set("appid", config.apiKey);
  return url;
}

async function fetchOpenWeatherJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENWEATHER_TIMEOUT_MS);
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
      const error = new Error(payload?.message || "OpenWeather poziv nije uspio.");
      error.statusCode = result.status === 401 ? 503 : result.status || 502;
      throw error;
    }

    return payload || {};
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("OpenWeather se nije javio na vrijeme.");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildOpenWeatherCityLabel(city = {}) {
  return [city.name, city.state, city.country]
    .map((part) => normalizeOpenWeatherCityName(part))
    .filter(Boolean)
    .join(", ");
}

function mapOpenWeatherCitySuggestion(city = {}) {
  const lat = Number(city.lat ?? 0);
  const lon = Number(city.lon ?? 0);
  const label = buildOpenWeatherCityLabel(city);
  return {
    name: normalizeOpenWeatherCityName(city.local_names?.hr || city.name || label || "Grad"),
    state: normalizeOpenWeatherCityName(city.state || ""),
    country: normalizeOpenWeatherCityName(city.country || ""),
    label,
    query: Number.isFinite(lat) && Number.isFinite(lon)
      ? `geo:${lat},${lon}:${label}`
      : [city.name, city.country].filter(Boolean).join(","),
    lat,
    lon,
  };
}

async function buildOpenWeatherCitySuggestions(query = "") {
  const config = getOpenWeatherRuntimeConfig();
  if (!config.keyConfigured) {
    const error = new Error("OpenWeather API ključ nije postavljen na serveru.");
    error.statusCode = 503;
    throw error;
  }

  const normalizedQuery = normalizeOpenWeatherCityName(query);
  if (normalizedQuery.length < 2) {
    return {
      ok: true,
      provider: "openweather",
      cities: [],
    };
  }

  const payload = await fetchOpenWeatherJson(buildOpenWeatherGeoUrl("/direct", {
    q: normalizedQuery,
    limit: OPENWEATHER_CITY_SEARCH_LIMIT,
  }));
  const seen = new Set();
  const cities = (Array.isArray(payload) ? payload : [])
    .map(mapOpenWeatherCitySuggestion)
    .filter((city) => {
      const key = `${city.name}|${city.state}|${city.country}|${city.lat}|${city.lon}`.toLowerCase();
      if (!city.name || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, OPENWEATHER_CITY_SEARCH_LIMIT);

  return {
    ok: true,
    provider: "openweather",
    generatedAt: new Date().toISOString(),
    cities,
  };
}

function mapOpenWeatherCurrent(payload = {}) {
  const weather = Array.isArray(payload.weather) ? payload.weather[0] || {} : {};
  return {
    condition: getOpenWeatherCondition(weather),
    description: titleCaseOpenWeatherDescription(weather.description || weather.main || ""),
    temp: Number(payload.main?.temp ?? 0),
    feelsLike: Number(payload.main?.feels_like ?? payload.main?.temp ?? 0),
    humidity: Number(payload.main?.humidity ?? 0),
    pressure: Number(payload.main?.pressure ?? 0),
    windSpeed: Number(payload.wind?.speed ?? 0),
    windGust: Number(payload.wind?.gust ?? 0),
    windDeg: Number(payload.wind?.deg ?? 0),
    observedAt: payload.dt ? new Date(Number(payload.dt) * 1000).toISOString() : new Date().toISOString(),
    weatherId: Number(weather.id ?? 0),
  };
}

function mapOpenWeatherForecastItem(item = {}) {
  const weather = Array.isArray(item.weather) ? item.weather[0] || {} : {};
  return {
    time: item.dt ? new Date(Number(item.dt) * 1000).toISOString() : "",
    condition: getOpenWeatherCondition(weather),
    description: titleCaseOpenWeatherDescription(weather.description || weather.main || ""),
    temp: Number(item.main?.temp ?? 0),
    feelsLike: Number(item.main?.feels_like ?? item.main?.temp ?? 0),
    humidity: Number(item.main?.humidity ?? 0),
    windSpeed: Number(item.wind?.speed ?? 0),
    windGust: Number(item.wind?.gust ?? 0),
    rainMm: Number(item.rain?.["3h"] ?? item.rain?.["1h"] ?? 0),
    snowMm: Number(item.snow?.["3h"] ?? item.snow?.["1h"] ?? 0),
    weatherId: Number(weather.id ?? 0),
  };
}

function getOpenWeatherForecastItems(payload = {}) {
  const list = Array.isArray(payload.list) ? payload.list : [];
  return list
    .slice(0, 16)
    .map(mapOpenWeatherForecastItem)
    .filter((item) => item.time)
    .slice(0, 8);
}

function buildOpenWeatherAlerts(current = {}, forecast = []) {
  const alerts = [];
  const nextDayForecast = forecast.filter((item) => {
    if (!item.time) {
      return false;
    }
    return new Date(item.time).getTime() - Date.now() <= 24 * 60 * 60 * 1000;
  });
  const maxWind = Math.max(
    Number(current.windSpeed || 0),
    Number(current.windGust || 0),
    ...nextDayForecast.flatMap((item) => [Number(item.windSpeed || 0), Number(item.windGust || 0)]),
  );
  const hasStorm = current.condition === "thunderstorm"
    || nextDayForecast.some((item) => item.condition === "thunderstorm");

  if (maxWind >= OPENWEATHER_DANGEROUS_WIND_MS) {
    alerts.push({
      type: "wind",
      level: "danger",
      title: "Opasan vjetar",
      message: `U prognozi se pojavljuju udari do ${Math.round(maxWind * 3.6)} km/h.`,
    });
  } else if (maxWind >= OPENWEATHER_STRONG_WIND_MS) {
    alerts.push({
      type: "wind",
      level: "warning",
      title: "Jak vjetar",
      message: `Očekuje se vjetar do ${Math.round(maxWind * 3.6)} km/h.`,
    });
  }

  if (hasStorm) {
    alerts.push({
      type: "storm",
      level: "danger",
      title: "Moguća oluja",
      message: "OpenWeather najavljuje grmljavinu u iduća 24 sata.",
    });
  }

  return alerts.slice(0, 4);
}

function buildOpenWeatherSummary(current = {}, alerts = []) {
  if (alerts.some((alert) => alert.type === "storm")) {
    return "Prati razvoj vremena zbog moguće grmljavine i naglih promjena.";
  }
  if (alerts.some((alert) => alert.type === "wind")) {
    return "Vrijeme je dobro pratiti zbog pojačanog vjetra.";
  }
  if (current.condition === "rain" || current.condition === "drizzle") {
    return "Kiša je u fokusu, uz provjeru vjetra i vidljivosti prije izlaska na teren.";
  }
  if (current.condition === "snow") {
    return "Snijeg i niže temperature mogu utjecati na izlazak na teren.";
  }
  if (["mist", "fog", "haze"].includes(current.condition)) {
    return "Smanjena vidljivost može utjecati na put i rad na lokaciji.";
  }
  return "Trenutni uvjeti su stabilni za brzi pregled prije odlaska na teren.";
}

async function fetchOpenWeatherCity(city) {
  const geoCity = parseOpenWeatherGeoCityToken(city);
  const lookupParams = geoCity
    ? { lat: geoCity.lat, lon: geoCity.lon }
    : { q: city };
  const currentPayload = await fetchOpenWeatherJson(buildOpenWeatherUrl("/weather", lookupParams));
  const forecastPayload = await fetchOpenWeatherJson(buildOpenWeatherUrl("/forecast", lookupParams));
  const current = mapOpenWeatherCurrent(currentPayload);
  const forecast = getOpenWeatherForecastItems(forecastPayload);
  const alerts = buildOpenWeatherAlerts(current, forecast);

  return {
    query: city,
    name: currentPayload.name || geoCity?.label || city,
    country: currentPayload.sys?.country || forecastPayload.city?.country || "",
    lat: Number(currentPayload.coord?.lat ?? forecastPayload.city?.coord?.lat ?? 0),
    lon: Number(currentPayload.coord?.lon ?? forecastPayload.city?.coord?.lon ?? 0),
    timezone: Number(currentPayload.timezone ?? forecastPayload.city?.timezone ?? 0),
    current,
    forecast,
    alerts,
    summary: buildOpenWeatherSummary(current, alerts),
  };
}

async function buildOpenWeatherPayload(cities = []) {
  const config = getOpenWeatherRuntimeConfig();
  if (!config.keyConfigured) {
    const error = new Error("OpenWeather API ključ nije postavljen na serveru.");
    error.statusCode = 503;
    throw error;
  }

  const normalizedCities = cities.slice(0, OPENWEATHER_MAX_CITIES);
  if (normalizedCities.length === 0) {
    const error = new Error("Odaberi barem jedan grad.");
    error.statusCode = 400;
    throw error;
  }

  const settled = await Promise.allSettled(normalizedCities.map((city) => fetchOpenWeatherCity(city)));
  const successfulCities = [];
  const errors = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successfulCities.push(result.value);
      return;
    }
    errors.push({
      city: normalizedCities[index],
      message: result.reason?.message || "Vrijeme nije dostupno.",
    });
  });

  if (successfulCities.length === 0) {
    const error = new Error(errors[0]?.message || "Vrijeme trenutno nije dostupno.");
    error.statusCode = Number(settled.find((item) => item.status === "rejected")?.reason?.statusCode || 502);
    throw error;
  }

  return {
    ok: true,
    provider: "openweather",
    generatedAt: new Date().toISOString(),
    maxCities: OPENWEATHER_MAX_CITIES,
    cities: successfulCities,
    errors,
  };
}

function buildOpenAiDryRunPlan(body = {}, user = null) {
  const config = getOpenAiRuntimeConfig();
  const files = Array.isArray(body.files) ? body.files : [];
  const fields = Array.isArray(body.fields) ? body.fields : [];
  const columns = Array.isArray(body.columns) ? body.columns : [];
  const modelTier = normalizeOpenAiModelTier(body.modelTier || body.modelPreference?.tier);
  const modelTierOption = getOpenAiModelTierOption(modelTier);
  const selectedModel = String(body.model || body.modelPreference?.model || getOpenAiModelForTier(modelTier, config)).trim();

  return {
    ok: true,
    dryRun: true,
    tokenSpend: "disabled",
    provider: config.provider,
    endpoint: config.endpoint,
    model: selectedModel,
    modelTier,
    modelLabel: modelTierOption.label,
    modelStrength: modelTierOption.strength,
    keyConfigured: config.keyConfigured,
    liveCallsEnabled: config.liveCallsEnabled,
    preparedAt: new Date().toISOString(),
    actorId: String(user?.id || ""),
    organizationId: String(body.organizationId || ""),
    summary: {
      files: files.length,
      fields: fields.length,
      excelColumns: columns.length,
      templateId: String(body.templateId || ""),
      workOrderId: String(body.workOrderId || ""),
      purpose: String(body.purpose || "document-field-prefill").slice(0, 120),
    },
    nextStep: "Dry-run je spreman. Stvarni OpenAI poziv ostaje isključen dok se eksplicitno ne uključi live mode.",
  };
}

function sanitizeOpenAiFileForPrompt(file = {}) {
  return {
    id: String(file.id || file.name || "").slice(0, 120),
    name: String(file.name || "datoteka").slice(0, 240),
    type: String(file.type || "application/octet-stream").slice(0, 120),
    size: Number(file.size || 0),
    inlineReady: Boolean(file.contentDataUrl),
  };
}

function truncateOpenAiText(value = "", maxLength = OPENAI_MAX_CONTEXT_JSON_CHARS) {
  const text = String(value || "");
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}\n\n[skraceno za AI kontekst]`;
}

function getOpenAiDataUrlMeta(dataUrl = "") {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) {
    return null;
  }
  return {
    mimeType: String(match[1] || "application/octet-stream").trim(),
    isBase64: Boolean(match[2]),
    payload: String(match[3] || ""),
  };
}

function readOpenAiTextFileContent(file = {}) {
  const meta = getOpenAiDataUrlMeta(file.contentDataUrl);
  if (!meta) {
    return "";
  }
  const mimeType = String(file.type || meta.mimeType || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const isTextLike = mimeType.startsWith("text/")
    || mimeType.includes("json")
    || mimeType.includes("xml")
    || mimeType.includes("csv")
    || name.endsWith(".txt")
    || name.endsWith(".csv")
    || name.endsWith(".json")
    || name.endsWith(".xml");
  if (!isTextLike) {
    return "";
  }

  try {
    const decoded = meta.isBase64
      ? Buffer.from(meta.payload, "base64").toString("utf8")
      : decodeURIComponent(meta.payload);
    return truncateOpenAiText(decoded, OPENAI_MAX_TEXT_FILE_CHARS);
  } catch {
    return "";
  }
}

function buildOpenAiLiveContextPayload(body = {}, user = null, selectedModel = "") {
  const files = Array.isArray(body.files) ? body.files : [];
  const fields = Array.isArray(body.fields) ? body.fields : [];
  const columns = Array.isArray(body.columns) ? body.columns : [];
  return {
    language: "hr-HR",
    instruction: "Vrati iskljucivo JSON koji aplikacija moze parsirati. Ne izmisljaj vrijednosti ako nisu vidljive u izvoru. Za Excel tablice koristi tocne fieldId i columnId vrijednosti iz measurementColumns. measurementColumns sadrzi samo kolone koje AI smije popuniti.",
    purpose: String(body.purpose || "document-template-runtime-ai-prefill").slice(0, 120),
    organizationId: String(body.organizationId || ""),
    templateId: String(body.templateId || ""),
    workOrderId: String(body.workOrderId || ""),
    workOrderNumber: String(body.workOrderNumber || ""),
    actorId: user?.id || null,
    model: selectedModel,
    files: files.map(sanitizeOpenAiFileForPrompt),
    fields: fields.map((field) => ({
      id: String(field?.id || ""),
      key: String(field?.key || ""),
      label: String(field?.label || ""),
      type: String(field?.type || "text"),
      required: Boolean(field?.required),
      ai: field?.ai ?? {},
    })),
    measurementColumns: columns.map((column) => ({
      fieldId: String(column?.fieldId || ""),
      fieldKey: String(column?.fieldKey || ""),
      fieldLabel: String(column?.fieldLabel || ""),
      fieldDescription: String(column?.fieldDescription || ""),
      columnId: String(column?.columnId || ""),
      columnIndex: Number.isFinite(Number(column?.columnIndex)) ? Number(column.columnIndex) : 0,
      columnLetter: String(column?.columnLetter || ""),
      key: String(column?.key || ""),
      label: String(column?.label || ""),
      type: String(column?.type || "text"),
      required: Boolean(column?.required),
      placeholder: String(column?.placeholder || ""),
      helpText: String(column?.helpText || ""),
      aiMapping: column?.aiMapping ?? {},
    })),
    expectedJsonShape: {
      fieldSuggestions: [
        {
          fieldId: "id polja iz fields",
          fieldKey: "key polja",
          value: "predlozena vrijednost",
          confidence: "high | medium | low",
          reason: "kratko objasnjenje",
          sourceFile: "ime datoteke",
        },
      ],
      measurementSuggestions: [
        {
          fieldId: "tocan fieldId Excel tablice iz measurementColumns",
          fieldLabel: "naziv tablice",
          rows: [
            {
              values: {
                "tocan columnId ili key iz measurementColumns": "vrijednost za tu AI kolonu",
              },
              orderedValues: ["alternativa: vrijednosti istim redoslijedom kao AI kolone iz measurementColumns za taj fieldId"],
              confidence: "high | medium | low",
              sourceFile: "ime datoteke",
            },
          ],
        },
      ],
      warnings: ["sto korisnik treba provjeriti"],
      summary: "kratak sazetak rezultata",
    },
  };
}

function buildOpenAiResponseInputContent(body = {}, user = null, selectedModel = "") {
  const contextPayload = buildOpenAiLiveContextPayload(body, user, selectedModel);
  const content = [
    {
      type: "input_text",
      text: truncateOpenAiText(JSON.stringify(contextPayload, null, 2)),
    },
  ];

  const files = (Array.isArray(body.files) ? body.files : [])
    .filter((file) => file?.contentDataUrl)
    .slice(0, OPENAI_MAX_INLINE_FILE_COUNT);

  files.forEach((file) => {
    const mimeType = String(file.type || "").toLowerCase();
    const textContent = readOpenAiTextFileContent(file);
    if (textContent) {
      content.push({
        type: "input_text",
        text: `Sadrzaj datoteke ${String(file.name || "datoteka")}:\n${textContent}`,
      });
      return;
    }

    if (mimeType.startsWith("image/")) {
      content.push({
        type: "input_image",
        image_url: file.contentDataUrl,
      });
      return;
    }

    if (mimeType === "application/pdf" || String(file.name || "").toLowerCase().endsWith(".pdf")) {
      content.push({
        type: "input_file",
        filename: String(file.name || "zapisnik.pdf").slice(0, 240),
        file_data: file.contentDataUrl,
      });
    }
  });

  return content;
}

function extractOpenAiResponseText(payload = {}) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = [];
  (Array.isArray(payload.output) ? payload.output : []).forEach((outputItem) => {
    (Array.isArray(outputItem?.content) ? outputItem.content : []).forEach((contentItem) => {
      const text = typeof contentItem?.text === "string"
        ? contentItem.text
        : (typeof contentItem?.content === "string" ? contentItem.content : "");
      if (text.trim()) {
        parts.push(text.trim());
      }
    });
  });
  return parts.join("\n\n").trim();
}

function parseOpenAiJsonObject(text = "") {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}

function buildOpenAiSafeErrorMessage(error) {
  const message = String(error?.message || "OpenAI poziv nije uspio.").replace(/sk-[A-Za-z0-9_\-]+/g, "[redacted]");
  return message.slice(0, 600);
}

async function buildOpenAiLivePlan(body = {}, user = null) {
  const config = getOpenAiRuntimeConfig();
  if (!config.keyConfigured) {
    const error = new Error("OpenAI API ključ nije postavljen na serveru.");
    error.statusCode = 503;
    throw error;
  }
  if (!config.liveCallsEnabled) {
    const error = new Error("OpenAI live pozivi nisu uključeni.");
    error.statusCode = 409;
    throw error;
  }

  const modelTier = normalizeOpenAiModelTier(body.modelTier || body.modelPreference?.tier);
  const modelTierOption = getOpenAiModelTierOption(modelTier);
  const selectedModel = String(body.model || body.modelPreference?.model || getOpenAiModelForTier(modelTier, config)).trim();
  if (!selectedModel) {
    const error = new Error("OpenAI model nije konfiguriran.");
    error.statusCode = 503;
    throw error;
  }

  const requestBody = {
    model: selectedModel,
    instructions: [
      "Ti si AI asistent za SafeNexus zapisnike.",
      "Analiziras stare zapisnike, PDF-ove, slike i tekst te predlazes vrijednosti za web polja i Excel tablice.",
      "Odgovori samo validnim JSON objektom. Ako nisi siguran, confidence mora biti low i vrijednost ne smije biti izmisljena.",
      "Za Excel tablice measurementSuggestions.fieldId mora biti tocno jedan fieldId iz measurementColumns, a kljucevi u rows[].values moraju biti tocni columnId ili key iz measurementColumns. Popunjavaj samo kolone navedene u measurementColumns; sve druge kolone, formule i rucni unos ignoriraj. Nemoj vracati genericki kljuc columnKey.",
      "Za hrvatske poslovne dokumente koristi hrvatski jezik i zadrzi strucne nazive.",
    ].join(" "),
    input: [
      {
        role: "user",
        content: buildOpenAiResponseInputContent(body, user, selectedModel),
      },
    ],
    max_output_tokens: 1800,
  };

  const openAiResponse = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await openAiResponse.text();
  let payload = null;
  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch {
    payload = { output_text: responseText };
  }

  if (!openAiResponse.ok) {
    const errorMessage = payload?.error?.message || payload?.message || responseText || "OpenAI poziv nije uspio.";
    const error = new Error(buildOpenAiSafeErrorMessage({ message: errorMessage }));
    error.statusCode = openAiResponse.status || 502;
    throw error;
  }

  const outputText = extractOpenAiResponseText(payload);
  const result = parseOpenAiJsonObject(outputText);
  const fields = Array.isArray(body.fields) ? body.fields : [];
  const columns = Array.isArray(body.columns) ? body.columns : [];
  const files = Array.isArray(body.files) ? body.files : [];

  return {
    ok: true,
    dryRun: false,
    tokenSpend: "enabled",
    provider: config.provider,
    endpoint: config.endpoint,
    model: selectedModel,
    modelTier,
    modelLabel: modelTierOption.label,
    modelStrength: modelTierOption.strength,
    preparedAt: new Date().toISOString(),
    actorId: user?.id ?? null,
    organizationId: String(body.organizationId || ""),
    summary: {
      files: files.length,
      inlineFilesSent: files.filter((file) => file?.contentDataUrl).length,
      fields: fields.length,
      columns: columns.length,
      workOrderId: String(body.workOrderId || ""),
      purpose: String(body.purpose || "document-field-prefill").slice(0, 120),
    },
    result,
    outputText,
    usage: payload?.usage ?? null,
    nextStep: result
      ? "OpenAI je vratio JSON prijedloge. Provjeri ih prije finalnog exporta."
      : "OpenAI je odgovorio, ali JSON nije automatski parsiran. Provjeri outputText.",
  };
}

function canUseOpenAiIntegration(user) {
  return canManageMasterData(user) || canManageWorkOrders(user);
}

function canManagePeopleTrainingRecords(user) {
  return canManageMasterData(user) || isClientPortalUser(user);
}

async function canUseScopedAppPermission(user, request, permissionKey = "") {
  if (canManageMasterData(user)) {
    return true;
  }

  const { scopedSnapshot } = await getScopedState(user, request);
  return canUseScopedSnapshotAppPermission(user, scopedSnapshot, permissionKey);
}

function canUseScopedSnapshotAppPermission(user, scopedSnapshot, permissionKey = "") {
  return canManageMasterData(user)
    || Boolean(scopedSnapshot?.appPermissions?.[permissionKey])
    || hasAppPermission(user, scopedSnapshot?.appRolePermissions ?? [], permissionKey);
}

function canUseAnyScopedSnapshotAppPermission(user, scopedSnapshot, permissionKeys = []) {
  return (Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys])
    .filter(Boolean)
    .some((permissionKey) => canUseScopedSnapshotAppPermission(user, scopedSnapshot, permissionKey));
}

async function canUseAnyScopedAppPermission(user, request, permissionKeys = []) {
  if (canManageMasterData(user)) {
    return true;
  }

  const { scopedSnapshot } = await getScopedState(user, request);
  return canUseAnyScopedSnapshotAppPermission(user, scopedSnapshot, permissionKeys);
}

function getMissingScopedSnapshotAppPermissions(user, scopedSnapshot, permissionKeys = []) {
  return Array.from(new Set(Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys]))
    .filter(Boolean)
    .filter((permissionKey) => !canUseScopedSnapshotAppPermission(user, scopedSnapshot, permissionKey));
}

function normalizeWorkOrderStatusForPermission(value = "") {
  return dbString(value) || "Otvoreni RN";
}

function getWorkOrderStatusPermissionKeys(currentStatus = "", nextStatus = "") {
  const current = normalizeWorkOrderStatusForPermission(currentStatus);
  const next = normalizeWorkOrderStatusForPermission(nextStatus);

  if (current === next) {
    return [];
  }

  const permissionKeys = [];
  if (current === "Storno RN" && next !== "Storno RN") {
    permissionKeys.push("workOrders.restoreCancelled");
  }
  if (next === "Storno RN") {
    permissionKeys.push("workOrders.cancel");
  }
  if (next === "Fakturiran RN") {
    permissionKeys.push("workOrders.markInvoiced");
  }
  if (permissionKeys.length === 0) {
    permissionKeys.push("workOrders.changeStatus");
  }

  return Array.from(new Set(permissionKeys));
}

function bodyHasOwnField(body = {}, fieldName = "") {
  return Object.prototype.hasOwnProperty.call(body, fieldName);
}

function workOrderFieldChanged(currentWorkOrder = {}, body = {}, fieldName = "") {
  return bodyHasOwnField(body, fieldName)
    && dbString(body[fieldName]) !== dbString(currentWorkOrder?.[fieldName]);
}

function getWorkOrderBillingPermissionKeys(currentWorkOrder = {}, body = {}) {
  return ["invoiceDate", "invoiceNote", "weight"].some((fieldName) => workOrderFieldChanged(currentWorkOrder, body, fieldName))
    ? ["workOrders.billing.write"]
    : [];
}

async function getActorWithScopedAppPermissions(user, request) {
  const { scopedSnapshot } = await getScopedState(user, request);
  return {
    ...user,
    appPermissions: {
      ...(scopedSnapshot.appPermissions ?? {}),
    },
  };
}

function sleep(durationMs) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, durationMs);
  });
}

async function createRepositoryWithRetry() {
  const attempts = process.env.DATABASE_URL ? 6 : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const [domainRepository, tenantRepository] = await Promise.all([
        createSafetyRepository(),
        createTenantRepository(),
      ]);

      return {
        domainRepository,
        tenantRepository,
      };
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      console.warn(`Repository init failed (attempt ${attempt}/${attempts}). Retrying in 2s...`);
      await sleep(2_000);
    }
  }

  throw lastError;
}

const { domainRepository, tenantRepository } = await createRepositoryWithRetry();
const liveChatStore = await createLiveChatStore({ secret: jwtSecret });

const contentTypes = {
  ".ico": "image/x-icon",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};
const NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
});
const STATIC_IMMUTABLE_HEADERS = Object.freeze({
  "Cache-Control": "public, max-age=31536000, immutable",
});
const STATIC_ASSET_HEADERS = Object.freeze({
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
});
const SNAPSHOT_CACHE_TTL_MS = 2_500;
const COMPRESSIBLE_STATIC_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".svg", ".webmanifest"]);
const staticFileCache = new Map();
let cachedRawSnapshotEntry = null;
const scopedSnapshotCache = new Map();

function appendVaryHeader(response, value) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) {
    return;
  }

  const current = String(response.getHeader("Vary") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!current.includes(normalizedValue)) {
    response.setHeader("Vary", [...current, normalizedValue].join(", "));
  }
}

function isCompressibleContentType(contentType = "") {
  const normalized = String(contentType ?? "").toLowerCase();
  return normalized.startsWith("text/")
    || normalized.includes("json")
    || normalized.includes("javascript")
    || normalized.includes("xml")
    || normalized.includes("svg")
    || normalized.includes("manifest");
}

function acceptsEncoding(request, encoding = "") {
  const normalizedEncoding = String(encoding ?? "").trim().toLowerCase();
  if (!request || !normalizedEncoding) {
    return false;
  }

  return String(request.headers["accept-encoding"] ?? "")
    .toLowerCase()
    .split(",")
    .map((entry) => entry.trim())
    .some((entry) => entry === normalizedEncoding || entry.startsWith(`${normalizedEncoding};`));
}

function buildWeakEtag(buffer, suffix = "") {
  const normalizedBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer ?? "");
  const digest = createHash("sha1").update(normalizedBuffer).digest("base64url").slice(0, 16);
  return `W/"${normalizedBuffer.length.toString(16)}-${digest}${suffix}"`;
}

function writeBufferResponse(response, statusCode, body, {
  contentType = "application/octet-stream",
  contentEncoding = "",
  fileName = "",
  etag = "",
  headers = {},
} = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body ?? ""), "utf8");
  response.statusCode = statusCode;
  response.setHeader("Content-Type", contentType);
  response.setHeader("Content-Length", String(payload.length));

  if (etag) {
    response.setHeader("ETag", etag);
  }

  if (fileName) {
    response.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/"/g, "")}"`);
  }

  if (contentEncoding) {
    response.setHeader("Content-Encoding", contentEncoding);
    appendVaryHeader(response, "Accept-Encoding");
  }

  Object.entries(headers).forEach(([headerName, headerValue]) => {
    if (headerValue !== undefined && headerValue !== null && headerValue !== "") {
      response.setHeader(headerName, headerValue);
    }
  });

  response.end(payload);
}

function sendJson(response, statusCode, payload) {
  const request = response[responseRequestSymbol];
  const jsonBuffer = Buffer.from(JSON.stringify(payload), "utf8");
  let body = jsonBuffer;
  let contentEncoding = "";

  if (request && jsonBuffer.length >= 1536 && acceptsEncoding(request, "gzip")) {
    try {
      const compressed = gzipSync(jsonBuffer, { level: 6 });
      if (compressed.length + 128 < jsonBuffer.length) {
        body = compressed;
        contentEncoding = "gzip";
      }
    } catch {
      body = jsonBuffer;
      contentEncoding = "";
    }
  }

  writeBufferResponse(response, statusCode, body, {
    contentType: "application/json; charset=utf-8",
    contentEncoding,
  });
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

function sendBinary(response, statusCode, body, {
  contentType = "application/octet-stream",
  fileName = "",
} = {}) {
  writeBufferResponse(response, statusCode, body, {
    contentType,
    fileName,
  });
}

const MEASUREMENT_EQUIPMENT_CARD_TEMPLATE_CATEGORY = "karton_template";
const MEASUREMENT_EQUIPMENT_DOCUMENT_CATEGORY_LABELS = Object.freeze({
  racun: "Racun",
  umjernica: "Umjernica",
  karton_uredaja: "Karton uredaja",
  slika_uredaja: "Slika uredaja",
  servisni_zapis: "Servisni zapis",
  upute: "Upute / dokumentacija",
  ostalo: "Ostalo",
});

function normalizeMeasurementEquipmentDocumentCategoryValue(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function getMeasurementEquipmentDocumentCategoryLabel(value = "") {
  const normalized = normalizeMeasurementEquipmentDocumentCategoryValue(value);
  return MEASUREMENT_EQUIPMENT_DOCUMENT_CATEGORY_LABELS[normalized] || normalized || "Dokument";
}

function normalizeDateOnlyValue(value = "") {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match?.[1]) {
    return match[1];
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) {
    return "";
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function isMeasurementEquipmentCalibrationValid(item = {}, todayIso = new Date().toISOString().slice(0, 10)) {
  if (!item?.requiresCalibration) {
    return false;
  }
  const validUntil = normalizeDateOnlyValue(item.validUntil);
  if (!validUntil) {
    return false;
  }
  return validUntil >= todayIso;
}

function getMeasurementEquipmentCalibrationStatusLabel(item = {}, todayIso = new Date().toISOString().slice(0, 10)) {
  if (!item?.requiresCalibration) {
    return "Ne treba";
  }
  const validUntil = normalizeDateOnlyValue(item.validUntil);
  if (!validUntil) {
    return "Bez roka";
  }
  return validUntil >= todayIso ? "Vazeca" : "Istekla";
}

function parseDateSortValue(value = "") {
  const normalized = normalizeDateOnlyValue(value);
  if (!normalized) {
    return 0;
  }
  const parsed = Date.parse(`${normalized}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortMeasurementEquipmentActivityEntries(entries = []) {
  return [...(Array.isArray(entries) ? entries : [])].sort((left, right) => {
    const rightScore = parseDateSortValue(right?.performedOn || right?.updatedAt || right?.createdAt);
    const leftScore = parseDateSortValue(left?.performedOn || left?.updatedAt || left?.createdAt);
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }
    return String(right?.id || "").localeCompare(String(left?.id || ""));
  });
}

function buildMeasurementEquipmentLatestActivitySummary(item = {}, activityType = "") {
  const normalizedType = normalizeInputValue(activityType).toLowerCase();
  const latest = sortMeasurementEquipmentActivityEntries(item.activityItems ?? [])
    .find((entry) => normalizeInputValue(entry?.activityType).toLowerCase() === normalizedType);
  if (!latest) {
    return "";
  }

  const parts = [];
  if (latest.performedOn) {
    parts.push(normalizeDateOnlyValue(latest.performedOn));
  }
  if (normalizedType === "umjeravanje") {
    if (latest.validUntil) {
      parts.push(`vrijedi do ${normalizeDateOnlyValue(latest.validUntil)}`);
    }
    if (latest.satisfies) {
      parts.push(`zadovoljava ${normalizeInputValue(latest.satisfies).toUpperCase()}`);
    }
  } else {
    if (latest.performedBy) {
      parts.push(normalizeInputValue(latest.performedBy));
    }
    if (latest.note) {
      parts.push(normalizeInputValue(latest.note));
    }
  }
  return parts.filter(Boolean).join(" · ");
}

function escapeCsvCell(value = "") {
  const normalized = value === null || value === undefined
    ? ""
    : String(value).replace(/\r?\n/g, " ").trim();
  return `"${normalized.replace(/"/g, "\"\"")}"`;
}

function buildCsvBuffer(rows = []) {
  const lines = (Array.isArray(rows) ? rows : []).map((row) => (
    (Array.isArray(row) ? row : [row]).map((entry) => escapeCsvCell(entry)).join(";")
  ));
  return Buffer.from(`\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

function sanitizeExcelSheetName(value = "", fallback = "Popis") {
  const cleaned = String(value ?? "")
    .replace(/[\\/*?:[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const safe = cleaned || fallback;
  return safe.slice(0, 31);
}

function buildMeasurementEquipmentListXlsxBuffer(rows = [], sheetName = "Mjerna oprema") {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  const worksheet = XLSX.utils.aoa_to_sheet(normalizedRows);
  const maxColumns = normalizedRows.reduce((max, row) => (
    Math.max(max, Array.isArray(row) ? row.length : 1)
  ), 0);

  if (maxColumns > 0) {
    worksheet["!cols"] = Array.from({ length: maxColumns }, (_, columnIndex) => {
      const longest = normalizedRows.reduce((width, row) => {
        const value = Array.isArray(row) ? row[columnIndex] : row;
        return Math.max(width, String(value ?? "").length);
      }, 10);
      return { wch: Math.min(Math.max(longest + 2, 12), 56) };
    });

    if (normalizedRows.length > 1) {
      worksheet["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: normalizedRows.length - 1, c: maxColumns - 1 },
        }),
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeExcelSheetName(sheetName, "Popis"));
  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });
}

const LEARNING_QUESTION_IMPORT_OPTION_KEYS = ["A", "B", "C", "D"];
const LEARNING_QUESTION_IMPORT_COLUMNS = [
  "Grupa",
  "Šifra pitanja",
  "Vrsta pitanja",
  "Pitanje",
  "Slika URL",
  "Odgovor A",
  "Odgovor B",
  "Odgovor C",
  "Odgovor D",
  "Točan odgovor",
  "Točni odgovori",
  "Redoslijed A",
  "Redoslijed B",
  "Redoslijed C",
  "Redoslijed D",
];

function buildLearningQuestionImportTemplateXlsxBuffer() {
  const rows = [
    LEARNING_QUESTION_IMPORT_COLUMNS,
    [
      "Osnove",
      "P1",
      "single_choice",
      "Koja oznaka znači obaveznu uporabu zaštitne kacige?",
      "https://safe-nexus.org/primjer-kaciga.png",
      "Plavi krug s kacigom",
      "Crveni trokut",
      "Zelena strelica",
      "Žuti pravokutnik",
      "A",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Osnove",
      "P2",
      "multiple_choice",
      "Koje radnje treba napraviti prije rada na visini?",
      "",
      "Provjeriti opremu",
      "Osigurati prostor ispod rada",
      "Raditi bez zaštite ako je posao kratak",
      "Koristiti propisanu osobnu zaštitnu opremu",
      "",
      "A,B,D",
      "",
      "",
      "",
      "",
    ],
    [
      "Postupak",
      "P3",
      "ordered_text",
      "Poredaj postupak prijave ozljede na radu.",
      "",
      "Osigurati mjesto događaja",
      "Obavijestiti odgovornu osobu",
      "Zabilježiti podatke i svjedoke",
      "Pokrenuti propisanu evidenciju",
      "",
      "",
      "1",
      "2",
      "3",
      "4",
    ],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = LEARNING_QUESTION_IMPORT_COLUMNS.map((column) => ({
    wch: Math.min(Math.max(String(column).length + 6, 16), 44),
  }));
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rows.length - 1, c: LEARNING_QUESTION_IMPORT_COLUMNS.length - 1 },
    }),
  };

  const instructions = [
    ["Polje", "Kako se koristi"],
    ["Vrsta pitanja", "Upiši single_choice, multiple_choice ili ordered_text. Prihvaća i opise poput jedan odgovor, višestruki odgovor ili redoslijed."],
    ["Slika URL", "Opcionalno. Upisuje se javni https URL slike; slika se ne umeće u Excel."],
    ["Točan odgovor", "Za single_choice upiši A, B, C ili D."],
    ["Točni odgovori", "Za multiple_choice upiši više slova odvojeno zarezom, npr. A,C,D."],
    ["Redoslijed A-D", "Za ordered_text upiši broj ispred svakog odgovora, npr. 1, 2, 3, 4."],
  ];
  const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsWorksheet["!cols"] = [{ wch: 22 }, { wch: 92 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pitanja");
  XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, "Upute");
  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });
}

function normalizeLearningQuestionImportType(value = "") {
  const raw = normalizeInputValue(value);
  const key = normalizeLookupKey(raw);
  if (["multiplechoice", "multiple", "visestruki", "visestrukiodgovor", "viseodgovora", "vise", "multi"].includes(key)) {
    return "multiple_choice";
  }
  if (["orderedtext", "ordered", "redoslijed", "poredak", "pisanjebrojeva", "sortiranje", "redanje"].includes(key)) {
    return "ordered_text";
  }
  if (key.includes("multiple") || key.includes("visestruk") || key.includes("viseodgov")) {
    return "multiple_choice";
  }
  if (key.includes("ordered") || key.includes("redoslijed") || key.includes("poredak") || key.includes("redanje")) {
    return "ordered_text";
  }
  return "single_choice";
}

function normalizeLearningQuestionImportCorrectKeys(value = "", fallback = "A") {
  const source = Array.isArray(value) ? value.join(",") : String(value ?? "");
  const upperSource = source.toUpperCase();
  const explicitKeys = upperSource.match(/\b[A-D]\b/gu) ?? [];
  const keys = Array.from(new Set(
    (explicitKeys.length > 0 ? explicitKeys : (upperSource.replace(/[^A-D]/gu, "").match(/[A-D]/gu) ?? []))
      .map((entry) => entry.trim()),
  ));
  return keys.length > 0 ? keys : [fallback];
}

function normalizeLearningQuestionImportOrder(value, fallback = null) {
  const numeric = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.max(1, Math.round(numeric));
}

function inferLearningQuestionImageTypeFromUrl(url = "") {
  const pathname = (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return String(url || "");
    }
  })().toLowerCase();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  if (pathname.endsWith(".bmp")) return "image/bmp";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  return "image/*";
}

function buildLearningQuestionImageDocumentFromUrl(url = "", rowIndex = 0) {
  const safeUrl = normalizeInputValue(url);
  if (!/^https?:\/\//i.test(safeUrl) && !/^data:image\//i.test(safeUrl)) {
    return null;
  }

  const fallbackName = `slika-pitanja-${rowIndex + 1}.jpg`;
  let fileName = fallbackName;
  try {
    const parsed = new URL(safeUrl);
    const segment = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "");
    if (segment) {
      fileName = segment;
    }
  } catch {
    fileName = fallbackName;
  }

  return {
    id: randomUUID(),
    fileName,
    fileType: inferLearningQuestionImageTypeFromUrl(safeUrl),
    fileSize: 0,
    documentCategory: "Slika pitanja",
    dataUrl: safeUrl,
    storageUrl: safeUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildLearningQuestionImportItem(row = {}, rowIndex = 0) {
  const questionType = normalizeLearningQuestionImportType(getImportRowValue(row, ["vrsta pitanja", "tip pitanja", "question type", "type"]));
  const prompt = normalizeInputValue(getImportRowValue(row, ["pitanje", "tekst pitanja", "question", "prompt"]));
  const groupLabel = normalizeInputValue(getImportRowValue(row, ["grupa", "grupa pitanja", "kategorija"])) || "Pitanja";
  const code = normalizeInputValue(getImportRowValue(row, ["šifra pitanja", "sifra pitanja", "oznaka", "kod", "code"])) || `P${rowIndex + 1}`;
  const imageUrl = normalizeInputValue(getImportRowValue(row, ["slika url", "url slike", "image url", "slika"]));
  const correctSingle = normalizeLearningQuestionImportCorrectKeys(
    getImportRowValue(row, ["točan odgovor", "tocan odgovor", "correct answer", "correct"]),
    "A",
  )[0] || "A";
  const correctMultiple = normalizeLearningQuestionImportCorrectKeys(
    getImportRowValue(row, ["točni odgovori", "tocni odgovori", "correct answers", "multi correct"]),
    correctSingle,
  );

  const options = LEARNING_QUESTION_IMPORT_OPTION_KEYS.map((letter, optionIndex) => {
    const text = normalizeInputValue(getImportRowValue(row, [`odgovor ${letter}`, `answer ${letter}`, letter]));
    const orderIndex = questionType === "ordered_text"
      ? normalizeLearningQuestionImportOrder(
        getImportRowValue(row, [`redoslijed ${letter}`, `red ${letter}`, `order ${letter}`]),
        optionIndex + 1,
      )
      : null;
    return {
      id: randomUUID(),
      text,
      isCorrect: questionType === "multiple_choice"
        ? correctMultiple.includes(letter)
        : (questionType === "single_choice" ? correctSingle === letter : false),
      orderIndex,
    };
  }).filter((option) => option.text);

  if (!prompt || options.length === 0) {
    return null;
  }

  return {
    id: randomUUID(),
    code,
    groupLabel,
    prompt,
    explanation: normalizeInputValue(getImportRowValue(row, ["objašnjenje", "objasnjenje", "explanation"])),
    questionType,
    correctOptionKeys: questionType === "ordered_text" ? [] : (questionType === "multiple_choice" ? correctMultiple : [correctSingle]),
    imageDocument: buildLearningQuestionImageDocumentFromUrl(imageUrl, rowIndex),
    options,
  };
}

function buildLearningQuestionImportItems(body = {}) {
  const buffer = readDataUrlBuffer(body?.dataUrl);
  if (!buffer.length) {
    throw new Error("Excel datoteka s pitanjima nije učitana.");
  }

  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });
  const sheetName = (workbook.SheetNames ?? []).find((name) => normalizeLookupKey(name).includes("pitanj"))
    || workbook.SheetNames?.[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;
  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  })
    .map((row, index) => buildLearningQuestionImportItem(row, index))
    .filter(Boolean);
}

function buildPeopleTrainingImportTemplateXlsxBuffer(scopedSnapshot = {}) {
  const typeOptions = getPersonTrainingImportTypeOptions(scopedSnapshot).slice(0, 12);
  const baseColumns = [
    "Tvrtka",
    "Lokacija",
    "Ime",
    "Prezime",
    "Ime oca",
    "Ime i prezime",
    "OIB osobe",
    "Jezik",
    "Datum rođenja",
    "Država rođenja",
    "Mjesto rođenja",
    "Datum dolaska",
    "Mjesto rada",
    "Aktivnost",
    "Email",
    "Mobitel",
  ];
  const detailColumns = [
    "Broj RN",
    "Sifra usluge",
    "Broj zapisnika",
    "Naziv radnog mjesta",
    "Opis poslova i aktivnosti",
    "Mjesto provodenja osposobljavanja radnika - teorijsko",
    "Datum teorijski dio",
    "Nacin provodenja teorijskog dijela",
    "Ime i prezime Poslodavca/Ovlastenika poslodavca",
    "OIB Poslodavca/Ovlastenika poslodavca",
    "Ostale osobe ukljucene u osposobljavanje - ime i prezime",
    "Ostale osobe ukljucene u osposobljavanje - OIB",
    "Mjesto provodenja osposobljavanja radnika - prakticno",
    "Razdoblje pracenja sigurnog nacina rada - od",
    "Razdoblje pracenja sigurnog nacina rada - do",
    "PGP datum polaganja",
    "SPZTP datum polaganja",
    "SPZTP vrijedi do",
    "ADR datum polaganja",
    "ADR vrijedi do",
  ];
  const trainingColumns = typeOptions.flatMap((option) => {
    const label = option.serviceCode ? `${option.serviceCode} ${option.label}` : option.label;
    return [
      `${label} - datum`,
      `${label} - vrijedi do`,
      `${label} - vrijedi trajno`,
      `${label} - broj uvjerenja`,
      `${label} - ustanova`,
    ];
  });
  const columns = [...baseColumns, ...detailColumns, ...trainingColumns, "Napomena"];
  const firstCompany = (scopedSnapshot.companies ?? [])[0] ?? {};
  const firstLocation = (scopedSnapshot.locations ?? []).find((location) => String(location.companyId) === String(firstCompany.id)) ?? {};
  const sampleRow = columns.map((column) => {
    const key = normalizeLookupKey(column);
    if (key === "tvrtka") return firstCompany.name || "Primjer d.o.o.";
    if (key === "lokacija") return firstLocation.name || "Zagreb - sjedište";
    if (key === "ime") return "Ana";
    if (key === "prezime") return "Savanović";
    if (key === "imeoca") return "Ivan";
    if (key === "imeiprezime") return "";
    if (key === "oibosobe") return "12345678910";
    if (key === "jezik") return "hrvatski";
    if (key === "datumrodenja") return "29.04.1990";
    if (key === "drzavarodenja") return "Hrvatska";
    if (key === "mjestorodenja") return "Zagreb";
    if (key === "datumdolaska") return "29.04.2026";
    if (key === "mjestorada") return firstLocation.name || "Zagreb - sjedište";
    if (key === "aktivnost") return "DA";
    if (key === "email") return "ana@example.hr";
    if (key === "mobitel") return "+385 91 000 0000";
    if (key === "brojrn") return "RN-26-001";
    if (key.includes("sifrausluge")) return typeOptions[0]?.serviceCode || typeOptions[0]?.shortLabel || "ZNR";
    if (key.includes("brojzapisnika")) return "RN-26-001-ZNR-12345678910";
    if (key.includes("nazivradnogmjesta")) return "Voditelj prodaje";
    if (key.includes("opisposlova")) return "Opis poslova i aktivnosti radnika.";
    if (key.includes("teorijsko")) return firstLocation.name || "Zagreb - sjediste";
    if (key.includes("datumteorijski")) return "29.04.2026";
    if (key.includes("nacinprovodenja")) return "Uzivo";
    if (key.includes("poslodavcaovlastenika") && key.includes("imeiprezime")) return firstCompany.representative || "Ovlastenik poslodavca";
    if (key.includes("poslodavcaovlastenika") && key.includes("oib")) return firstCompany.representativeOib || "";
    if (key.includes("ostaleosobe") && key.includes("imeiprezime")) return "";
    if (key.includes("ostaleosobe") && key.includes("oib")) return "";
    if (key.includes("prakticno")) return firstLocation.name || "Zagreb - sjediste";
    if (key.includes("razdobljepracenja") && key.includes("od")) return "29.04.2026";
    if (key.includes("razdobljepracenja") && key.includes("do")) return "29.05.2026";
    if (key.includes("pgpdatum")) return "29.04.2026";
    if (key.includes("spztpdatum")) return "29.04.2026";
    if (key.includes("spztpvrijedido")) return "29.04.2030";
    if (key.includes("adrdatum")) return "29.04.2026";
    if (key.includes("adrvrijedido")) return "29.04.2030";
    if (key.includes("datum")) return "29.04.2026";
    if (key.includes("vrijedido")) return "29.04.2030";
    if (key.includes("vrijeditrajno")) return "NE";
    if (key.includes("brojuvjerenja")) return "";
    if (key.includes("ustanova")) return "SafeNexus";
    if (key === "napomena") return "Primjer retka za import";
    return "";
  });
  const worksheet = XLSX.utils.aoa_to_sheet([columns, sampleRow]);
  worksheet["!cols"] = columns.map((column) => ({ wch: Math.min(Math.max(String(column).length + 4, 16), 34) }));
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 1, c: columns.length - 1 } }),
  };
  const detailsColumns = [
    "OIB osobe",
    "Ime i prezime",
    "Broj RN",
    "Šifra usluge",
    "Broj zapisnika",
    "Naziv radnog mjesta",
    "Opis poslova i aktivnosti",
    "Mjesto provođenja teorijsko",
    "Datum teorijski dio",
    "Način provođenja teorijskog dijela",
    "Ime i prezime Poslodavca/Ovlaštenika",
    "OIB Poslodavca/Ovlaštenika",
    "Ostale osobe - ime i prezime",
    "Ostale osobe - OIB",
    "Mjesto provođenja praktično",
    "Razdoblje praćenja od",
    "Razdoblje praćenja do",
    "PGP datum polaganja",
    "SPZTP datum polaganja",
    "SPZTP vrijedi do",
    "ADR datum polaganja",
    "ADR vrijedi do",
    "Napomena",
  ];
  const detailsSampleRow = detailsColumns.map((column) => {
    const key = normalizeLookupKey(column);
    if (key === "oibosobe") return "12345678910";
    if (key === "imeiprezime") return "Ana Savanović";
    if (key === "brojrn") return "RN-26-001";
    if (key.includes("sifrausluge")) return typeOptions[0]?.serviceCode || typeOptions[0]?.shortLabel || "ZNR";
    if (key.includes("brojzapisnika")) return "RN-26-001-ZNR-12345678910";
    if (key.includes("nazivradnogmjesta")) return "Voditelj prodaje";
    if (key.includes("opisposlova")) return "Opis poslova i aktivnosti radnika.";
    if (key.includes("teorijsko")) return firstLocation.name || "Zagreb - sjedište";
    if (key.includes("datumteorijski")) return "29.04.2026";
    if (key.includes("nacinprovodenja")) return "Uživo";
    if (key.includes("poslodavcaovlastenika") && key.includes("imeiprezime")) return firstCompany.representative || "Ovlaštenik poslodavca";
    if (key.includes("poslodavcaovlastenika") && key.includes("oib")) return firstCompany.representativeOib || "";
    if (key.includes("ostaleosobe") && key.includes("imeiprezime")) return "";
    if (key.includes("ostaleosobe") && key.includes("oib")) return "";
    if (key.includes("prakticno")) return firstLocation.name || "Zagreb - sjedište";
    if (key.includes("razdobljepracenjaod")) return "29.04.2026";
    if (key.includes("razdobljepracenjado")) return "29.05.2026";
    if (key.includes("pgpdatum")) return "29.04.2026";
    if (key.includes("spztpdatum")) return "29.04.2026";
    if (key.includes("spztpvrijedido")) return "29.04.2030";
    if (key.includes("adrdatum")) return "29.04.2026";
    if (key.includes("adrvrijedido")) return "29.04.2030";
    if (key === "napomena") return "Detalji osposobljavanja po osobi.";
    return "";
  });
  const detailsWorksheet = XLSX.utils.aoa_to_sheet([detailsColumns, detailsSampleRow]);
  detailsWorksheet["!cols"] = detailsColumns.map((column) => ({ wch: Math.min(Math.max(String(column).length + 4, 18), 46) }));
  detailsWorksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 1, c: detailsColumns.length - 1 } }),
  };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Osposobljavanja");
  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });
}

function sanitizeZipPathSegment(value = "", fallback = "stavka") {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized.slice(0, 120) : fallback;
}

function buildUniqueZipPath(filePath = "", usedPaths = new Set()) {
  if (!usedPaths.has(filePath)) {
    usedPaths.add(filePath);
    return filePath;
  }
  const extension = extname(filePath);
  const base = extension ? filePath.slice(0, -extension.length) : filePath;
  let counter = 2;
  let candidate = `${base} (${counter})${extension}`;
  while (usedPaths.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${extension}`;
  }
  usedPaths.add(candidate);
  return candidate;
}

function sortMeasurementEquipmentDocumentsByUpdatedAt(documents = []) {
  return [...(Array.isArray(documents) ? documents : [])].sort((left, right) => {
    const rightScore = parseDateSortValue(right?.updatedAt || right?.createdAt);
    const leftScore = parseDateSortValue(left?.updatedAt || left?.createdAt);
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }
    return String(right?.id || "").localeCompare(String(left?.id || ""));
  });
}

function collectMeasurementEquipmentDocumentsForZip(
  item = {},
  selectedCategories = new Set(),
  {
    onlyValidCalibrationCertificates = false,
    todayIso = new Date().toISOString().slice(0, 10),
  } = {},
) {
  const docs = (Array.isArray(item.documents) ? item.documents : [])
    .map((document) => ({
      ...document,
      normalizedCategory: normalizeMeasurementEquipmentDocumentCategoryValue(document?.documentCategory),
    }))
    .filter((document) => {
      if (!document?.fileName) {
        return false;
      }
      if (!document.normalizedCategory || document.normalizedCategory === MEASUREMENT_EQUIPMENT_CARD_TEMPLATE_CATEGORY) {
        return false;
      }
      return selectedCategories.size === 0 || selectedCategories.has(document.normalizedCategory);
    });

  if (docs.length === 0) {
    return [];
  }

  const byCategory = new Map();
  docs.forEach((document) => {
    if (!byCategory.has(document.normalizedCategory)) {
      byCategory.set(document.normalizedCategory, []);
    }
    byCategory.get(document.normalizedCategory).push(document);
  });

  const orderedCategories = selectedCategories.size > 0
    ? [...selectedCategories]
    : [...byCategory.keys()];
  const results = [];

  orderedCategories.forEach((category) => {
    const categoryDocuments = sortMeasurementEquipmentDocumentsByUpdatedAt(byCategory.get(category) ?? []);
    if (categoryDocuments.length === 0) {
      return;
    }
    if (category === "umjernica" && onlyValidCalibrationCertificates) {
      if (!isMeasurementEquipmentCalibrationValid(item, todayIso)) {
        return;
      }
      results.push(categoryDocuments[0]);
      return;
    }
    results.push(...categoryDocuments);
  });

  return results;
}

async function generatePdfBufferForTemplate(template = {}, {
  placeholders = {},
  fileName = "",
} = {}) {
  if (!template.referenceDocument) {
    throw new Error("Template još nema učitan HTML ili Word predložak.");
  }

  const referenceDocument = await readStoredDocumentBuffer(template.referenceDocument);
  if (isHtmlTemplateFile(template.referenceDocument)) {
    return await buildPdfFromHtmlTemplateBuffer(referenceDocument.buffer, placeholders, {
      fileName: fileName || template.outputFileName || template.title || "zapisnik.html",
      title: template.title || template.documentType || "Zapisnik",
    });
  }

  if (isWordTemplateFile(template.referenceDocument)) {
    const sourceFileName = String(
      fileName || template.outputFileName || template.title || template.referenceDocument.fileName || "zapisnik",
    ).replace(/\.(html?|docx?|dotx|pdf)$/i, "");
    const docxFileName = sanitizeGeneratedDocumentFileName(
      sourceFileName,
      { fallback: "zapisnik", extension: "docx" },
    );
    return await buildPdfFromTemplateBuffer(referenceDocument.buffer, placeholders, {
      fileName: docxFileName,
    });
  }

  throw new Error("Za Template Development učitaj .html/.htm ili .docx/.dotx predložak.");
}

function hasTemplateRenderPdfModel(value = null) {
  return Boolean(
    value
    && typeof value === "object"
    && !Array.isArray(value)
    && (
      Array.isArray(value.blocks)
      || String(value.title || value.documentType || value.workOrderNumber || "").trim()
    ),
  );
}

function shouldUseFastTemplateRenderPdf(body = {}) {
  if (!hasTemplateRenderPdfModel(body?.renderModel)) {
    return false;
  }

  const engine = String(body?.pdfEngine || "").trim().toLowerCase();
  return body?.fastPdf !== false
    && body?.useTemplatePdf !== true
    && engine !== "template"
    && engine !== "word"
    && engine !== "html";
}

async function generatePdfBuffersForTemplateEntries(entries = [], scopedSnapshot = {}) {
  const documentTemplates = scopedSnapshot.documentTemplates ?? [];
  const referenceDocumentCache = new Map();
  const pdfBuffers = [];

  for (const [entryIndex, entry] of (Array.isArray(entries) ? entries : []).entries()) {
    const template = assertInScope(
      documentTemplates,
      entry?.templateId,
      "Template nije pronaden.",
    );

    if (!template.referenceDocument) {
      if (hasTemplateRenderPdfModel(entry?.renderModel)) {
        pdfBuffers[entryIndex] = await buildPdfFromRenderModel(entry.renderModel);
        continue;
      }
      throw new Error("Template još nema učitan HTML ili Word predložak.");
    }

    const cacheKey = String(template.id || entry?.templateId || entryIndex);
    let referenceDocument = referenceDocumentCache.get(cacheKey);
    if (!referenceDocument) {
      referenceDocument = await readStoredDocumentBuffer(template.referenceDocument);
      referenceDocumentCache.set(cacheKey, referenceDocument);
    }

    if (isHtmlTemplateFile(template.referenceDocument)) {
      pdfBuffers[entryIndex] = await buildPdfFromHtmlTemplateBuffer(referenceDocument.buffer, entry?.placeholders ?? {}, {
        fileName: entry?.fileName || template.outputFileName || template.title || "zapisnik.html",
        title: template.title || template.documentType || "Zapisnik",
      });
      continue;
    }

    if (isWordTemplateFile(template.referenceDocument)) {
      const sourceFileName = String(
        entry?.fileName || template.outputFileName || template.title || template.referenceDocument.fileName || "zapisnik",
      ).replace(/\.(html?|docx?|dotx|pdf)$/i, "");
      const docxFileName = sanitizeGeneratedDocumentFileName(
        sourceFileName,
        { fallback: "zapisnik", extension: "docx" },
      );
      pdfBuffers[entryIndex] = await buildPdfFromTemplateBuffer(referenceDocument.buffer, entry?.placeholders ?? {}, {
        fileName: docxFileName,
      });
      continue;
    }

    throw new Error("Za Template Development učitaj .html/.htm ili .docx/.dotx predložak.");
  }

  return pdfBuffers.filter(Boolean);
}

async function mapWithConcurrency(items = [], limit = 2, worker = async () => null) {
  const sourceItems = Array.isArray(items) ? items : [];
  const workerLimit = Math.max(1, Math.min(Number(limit) || 1, sourceItems.length || 1));
  const results = new Array(sourceItems.length);
  let cursor = 0;

  await Promise.all(Array.from({ length: workerLimit }, async () => {
    while (cursor < sourceItems.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await worker(sourceItems[currentIndex], currentIndex);
    }
  }));

  return results;
}

function ensureUniquePdfZipFileName(fileName = "", usedNames = new Set()) {
  const safeFileName = sanitizeGeneratedDocumentFileName(
    fileName || "zapisnik",
    { fallback: "zapisnik", extension: "pdf" },
  );
  const lowerName = safeFileName.toLowerCase();
  if (!usedNames.has(lowerName)) {
    usedNames.add(lowerName);
    return safeFileName;
  }

  const baseName = safeFileName.replace(/\.pdf$/i, "");
  let suffix = 2;
  while (usedNames.has(`${baseName}-${suffix}.pdf`.toLowerCase())) {
    suffix += 1;
  }
  const uniqueName = `${baseName}-${suffix}.pdf`;
  usedNames.add(uniqueName.toLowerCase());
  return uniqueName;
}

async function generatePdfFileEntriesForTemplateEntries(entries = [], scopedSnapshot = {}) {
  const documentTemplates = scopedSnapshot.documentTemplates ?? [];
  const referenceDocumentCache = new Map();
  const usedNames = new Set();
  const concurrency = Math.max(
    1,
    Math.min(3, Number(process.env.DOCUMENT_TEMPLATE_PDF_ZIP_CONCURRENCY) || 2),
  );

  const pdfFiles = await mapWithConcurrency(entries, concurrency, async (entry, entryIndex) => {
    const template = assertInScope(
      documentTemplates,
      entry?.templateId,
      "Template nije pronaden.",
    );
    const fileName = ensureUniquePdfZipFileName(
      entry?.fileName || template.outputFileName || template.title || `zapisnik-${entryIndex + 1}`,
      usedNames,
    );

    if (!template.referenceDocument) {
      if (hasTemplateRenderPdfModel(entry?.renderModel)) {
        return {
          entry,
          template,
          fileName,
          buffer: await buildPdfFromRenderModel(entry.renderModel),
        };
      }
      throw new Error("Template jos nema ucitan HTML ili Word predlozak.");
    }

    const cacheKey = String(template.id || entry?.templateId || entryIndex);
    let referenceDocumentPromise = referenceDocumentCache.get(cacheKey);
    if (!referenceDocumentPromise) {
      referenceDocumentPromise = readStoredDocumentBuffer(template.referenceDocument);
      referenceDocumentCache.set(cacheKey, referenceDocumentPromise);
    }
    const referenceDocument = await referenceDocumentPromise;

    if (isHtmlTemplateFile(template.referenceDocument)) {
      return {
        entry,
        template,
        fileName,
        buffer: await buildPdfFromHtmlTemplateBuffer(referenceDocument.buffer, entry?.placeholders ?? {}, {
          fileName: entry?.fileName || template.outputFileName || template.title || `zapisnik-${entryIndex + 1}.html`,
          title: template.title || template.documentType || "Zapisnik",
        }),
      };
    }

    if (isWordTemplateFile(template.referenceDocument)) {
      const sourceFileName = String(
        entry?.fileName || template.outputFileName || template.title || template.referenceDocument.fileName || "zapisnik",
      ).replace(/\.(html?|docx?|dotx|pdf)$/i, "");
      const docxFileName = sanitizeGeneratedDocumentFileName(
        sourceFileName,
        { fallback: "zapisnik", extension: "docx" },
      );
      return {
        entry,
        template,
        fileName,
        buffer: await buildPdfFromTemplateBuffer(referenceDocument.buffer, entry?.placeholders ?? {}, {
          fileName: docxFileName,
        }),
      };
    }

    throw new Error("Za Template Development ucitaj .html/.htm ili .docx/.dotx predlozak.");
  });

  return pdfFiles.filter((entry) => entry?.buffer);
}

async function generateCombinedHtmlPdfForTemplateEntries(entries = [], scopedSnapshot = {}) {
  const documentTemplates = scopedSnapshot.documentTemplates ?? [];
  const referenceDocumentCache = new Map();
  const htmlEntries = [];

  for (const [entryIndex, entry] of (Array.isArray(entries) ? entries : []).entries()) {
    const template = assertInScope(
      documentTemplates,
      entry?.templateId,
      "Template nije pronaÄ‘en.",
    );

    if (!template.referenceDocument || !isHtmlTemplateFile(template.referenceDocument)) {
      return null;
    }

    const cacheKey = String(template.id || entry?.templateId || entryIndex);
    let referenceDocument = referenceDocumentCache.get(cacheKey);
    if (!referenceDocument) {
      referenceDocument = await readStoredDocumentBuffer(template.referenceDocument);
      referenceDocumentCache.set(cacheKey, referenceDocument);
    }

    htmlEntries.push({
      templateBuffer: referenceDocument.buffer,
      placeholders: entry?.placeholders ?? {},
      fileName: entry?.fileName || template.outputFileName || template.title || `zapisnik-${entryIndex + 1}.html`,
      title: template.title || template.documentType || "Zapisnik",
    });
  }

  if (htmlEntries.length === 0) {
    return null;
  }

  return await buildPdfFromHtmlTemplateBatchEntries(htmlEntries, {
    fileName: "zapisnici-batch.html",
    title: "Zapisnici",
  });
}

function formatOfferDocumentDate(value = "") {
  const normalized = String(value ?? "").trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}.${match[2]}.${match[1]}`;
  }

  const localizedMatch = normalized.match(/^(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{4})\.?$/);
  if (!localizedMatch) {
    return normalized;
  }

  return [
    localizedMatch[1].padStart(2, "0"),
    localizedMatch[2].padStart(2, "0"),
    localizedMatch[3],
  ].join(".");
}

function formatOfferTemplateMoney(value = 0, currency = "EUR") {
  const numeric = Number(value ?? 0) || 0;
  const currencyCode = String(currency || "EUR").trim().toUpperCase() || "EUR";

  try {
    const formattedAmount = new Intl.NumberFormat("hr-HR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
    return `${formattedAmount} ${currencyCode}`;
  } catch {
    return `${numeric.toFixed(2)} ${currencyCode}`;
  }
}

function normalizeCommercialOfferPlanType(value = "") {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, " ");
  if (["fixed plan", "fixed fee", "flat plan"].includes(normalized)) {
    return "Fixed Plan";
  }
  if (["hybrid plan", "base fee variable fee", "base fee plus variable fee", "monthly per services"].includes(normalized)) {
    return "Hybrid Plan";
  }
  if (["one time", "one time service", "one-time", "one-time service"].includes(normalized)) {
    return "One-Time Service";
  }
  if (["per employee", "per employee plan"].includes(normalized)) {
    return "Per Employee Plan";
  }
  return "";
}

function hasCommercialBreakdownRows(item = {}) {
  return Array.isArray(item?.breakdowns) && item.breakdowns.some((entry) => (
    String(entry?.recordLabel || entry?.label || entry?.unitLabel || "").trim()
      || String(entry?.measurementFrom || "").trim()
      || String(entry?.measurementTo || "").trim()
      || Number(entry?.amount || 0) > 0
  ));
}

function buildCommercialTableCell(text = "", format = {}) {
  return {
    text: String(text ?? ""),
    format: {
      fontFamily: "arial",
      fontSize: 9,
      bold: false,
      border: { top: true, right: true, bottom: true, left: true },
      ...format,
    },
  };
}

function getCommercialQuantityText(item = {}) {
  const quantity = String(item?.quantity ?? "").trim();
  const unit = String(item?.unit || "").trim();
  if (!quantity && !unit) {
    return "";
  }
  return [quantity || "1", unit].filter(Boolean).join(" ");
}

function getCommercialMoneyText(value = 0, currency = "EUR", { showZero = false } = {}) {
  const numeric = Number(value ?? 0) || 0;
  if (!showZero && numeric === 0) {
    return "";
  }
  return formatOfferTemplateMoney(numeric, currency);
}

function getCommercialBreakdownRangeText(entry = {}) {
  const priceKind = String(entry?.priceKind || "").trim();
  const measurementFrom = String(entry?.measurementFrom || "").trim();
  const measurementTo = String(entry?.measurementTo || "").trim();
  if (priceKind === "measurement") {
    return measurementTo ? `do ${measurementTo}` : "";
  }
  if (priceKind === "measurement_range") {
    return [measurementFrom, measurementTo].filter(Boolean).join(" - ");
  }
  return "";
}

function getCommercialBreakdownDocumentLabel(entry = {}) {
  const priceKind = String(entry?.priceKind || "").trim();
  const label = formatCommercialBreakdownLabel(entry);
  const measurementFrom = String(entry?.measurementFrom || "").trim();
  const measurementTo = String(entry?.measurementTo || "").trim();

  if (priceKind === "measurement" && measurementTo) {
    return `Do ${measurementTo} mjernih mjesta`;
  }
  if (priceKind === "measurement_range") {
    const range = [measurementFrom, measurementTo].filter(Boolean).join(" - ");
    return range ? `Od ${range} mjernog mjesta` : label;
  }
  if (priceKind === "next_measurement") {
    return "Svako iduće mjerno mjesto";
  }
  return label;
}

function buildCommercialItemAmountText(item = {}, currency = "EUR") {
  const total = Number(item?.totalPrice ?? 0) || 0;
  if (total > 0) {
    return getCommercialMoneyText(total, currency);
  }
  const quantity = Number(item?.quantity ?? 0) || 0;
  const unitPrice = Number(item?.unitPrice ?? 0) || 0;
  if (quantity > 0 && unitPrice > 0) {
    return getCommercialMoneyText(quantity * unitPrice, currency);
  }
  return getCommercialMoneyText(unitPrice, currency);
}

function getCommercialOfferMonthlyItems(items = [], offerType = "") {
  const planType = normalizeCommercialOfferPlanType(offerType);
  const safeItems = Array.isArray(items) ? items : [];
  if (planType === "Hybrid Plan") {
    return safeItems.filter((item) => !hasCommercialBreakdownRows(item));
  }
  if (planType === "Fixed Plan") {
    return safeItems;
  }
  return [];
}

function getCommercialOfferServicePricingItems(items = [], offerType = "") {
  const planType = normalizeCommercialOfferPlanType(offerType);
  const safeItems = Array.isArray(items) ? items : [];
  if (planType === "Fixed Plan") {
    return [];
  }
  if (planType === "Hybrid Plan") {
    return safeItems.filter((item) => hasCommercialBreakdownRows(item));
  }
  return safeItems;
}

function buildCommercialItemsTablePlaceholder(items = [], currency = "EUR", {
  fallbackTitle = "Stavke",
  offerType = "",
  showTotalAmount = true,
  section = "all",
  includeHeader = true,
  emptyMessage = "Nema dodanih stavki.",
} = {}) {
  const allItems = Array.isArray(items) ? items : [];
  const planType = normalizeCommercialOfferPlanType(offerType);
  const isFixedPlan = planType === "Fixed Plan";
  const isHybridPlan = planType === "Hybrid Plan";
  const safeItems = section === "monthly"
    ? getCommercialOfferMonthlyItems(allItems, offerType)
    : section === "services"
      ? getCommercialOfferServicePricingItems(allItems, offerType)
      : allItems;
  const columns = [
    { id: "description", label: fallbackTitle, width: 520 },
    { id: "amount", label: "Iznos", width: 120 },
  ];
  const merges = [];
  const rows = [];
  if (includeHeader) {
    rows.push({
      id: "header",
      header: true,
      cells: columns.map((column) => buildCommercialTableCell(column.label, {
        bold: true,
        fillColor: "#F3F4F6",
        align: column.id === "amount" ? "right" : "left",
      })),
    });
  }

  const pushRow = (id, description = "", amount = "", format = {}) => {
    rows.push({
      id,
      cells: [
        buildCommercialTableCell(description, { align: "left", ...format }),
        buildCommercialTableCell(amount, { align: "right", ...format }),
      ],
    });
  };

  const pushMergedRow = (id, description = "", format = {}) => {
    rows.push({
      id,
      cells: [
        buildCommercialTableCell(description, { align: "left", ...format }),
        buildCommercialTableCell("", { align: "right", ...format }),
      ],
    });
    merges.push({ rowId: id, columnId: "description", colSpan: 2 });
  };

  const pushBreakdownRows = (item, itemIndex) => {
    const breakdowns = Array.isArray(item?.breakdowns) ? item.breakdowns : [];
    breakdowns
      .filter((entry) => (
        String(entry?.recordLabel || entry?.label || entry?.unitLabel || "").trim()
          || String(entry?.measurementFrom || "").trim()
          || String(entry?.measurementTo || "").trim()
          || Number(entry?.amount || 0) > 0
      ))
      .forEach((entry, breakdownIndex) => {
        pushRow(
          `item-${itemIndex + 1}-breakdown-${breakdownIndex + 1}`,
          `- ${getCommercialBreakdownDocumentLabel(entry)}`,
          getCommercialMoneyText(entry?.amount, currency),
        );
      });
  };

  if (safeItems.length === 0) {
    pushRow("empty", emptyMessage, "");
  } else if (section === "monthly") {
    safeItems.forEach((item, index) => {
      pushRow(
        `monthly-fee-${index + 1}`,
        item?.description || "Mjesečna naknada",
        buildCommercialItemAmountText(item, currency),
      );
    });
  } else if (section === "services") {
    safeItems.forEach((item, index) => {
      const hasBreakdowns = hasCommercialBreakdownRows(item);
      if (hasBreakdowns) {
        pushMergedRow(`service-item-${index + 1}`, item?.description || "Usluga", { fillColor: "#FFFFFF" });
        pushBreakdownRows(item, index);
      } else {
        pushRow(
          `service-item-${index + 1}`,
          item?.description || "Usluga",
          !showTotalAmount ? "" : buildCommercialItemAmountText(item, currency),
        );
      }
    });
  } else if (isFixedPlan) {
    safeItems.forEach((item, index) => {
      pushRow(
        `fixed-item-${index + 1}`,
        item?.description || "Stavka",
        buildCommercialItemAmountText(item, currency),
      );
    });

    if (showTotalAmount && safeItems.length > 0) {
      const fixedTotal = safeItems.reduce((sum, item) => sum + (Number(item?.totalPrice ?? 0) || ((Number(item?.quantity ?? 0) || 0) * (Number(item?.unitPrice ?? 0) || 0))), 0);
      pushRow("fixed-total", "Ukupno", getCommercialMoneyText(fixedTotal, currency, { showZero: true }), { fillColor: "#F8FAFC" });
    }
  } else if (isHybridPlan) {
    const feeItems = getCommercialOfferMonthlyItems(safeItems, offerType);
    const serviceItems = getCommercialOfferServicePricingItems(safeItems, offerType);

    if (feeItems.length > 0) {
      pushMergedRow("monthly-fees-section", "Mjesečne naknade", { fillColor: "#F8FAFC" });
      feeItems.forEach((item, index) => {
        pushRow(
          `monthly-fee-${index + 1}`,
          item?.description || "Mjesečna naknada",
          buildCommercialItemAmountText(item, currency),
        );
      });
    }

    if (serviceItems.length > 0) {
      pushMergedRow("service-pricing-section", "Cjenik usluga", { fillColor: "#F8FAFC" });
      serviceItems.forEach((item, index) => {
        pushMergedRow(`service-item-${index + 1}`, item?.description || "Usluga", { fillColor: "#FFFFFF" });
        pushBreakdownRows(item, index);
      });
    }
  } else {
    safeItems.forEach((item, index) => {
      const hasBreakdowns = hasCommercialBreakdownRows(item);
      if (hasBreakdowns) {
        pushMergedRow(`item-${index + 1}`, item?.description || "Usluga", { fillColor: "#F8FAFC" });
      } else {
        pushRow(
          `item-${index + 1}`,
          item?.description || "Stavka",
          !showTotalAmount ? "" : buildCommercialItemAmountText(item, currency),
        );
      }
      if (hasBreakdowns) {
        pushBreakdownRows(item, index);
      }
    });
  }

  return {
    __docxBlockType: "table",
    columns,
    rows,
    headerRows: includeHeader ? ["header"] : [],
    merges,
  };
}

function formatCommercialBreakdownLabel(entry = {}) {
  const defaultLabels = new Map([
    ["report", "Zapisnik"],
    ["measurement", "DO mjernih mjesta"],
    ["measurement_range", "OD do mjernih mjesta"],
    ["next_measurement", "Svako iduce mj. mjesto"],
  ]);
  const priceKind = String(entry?.priceKind || "").trim();
  const recordLabel = String(entry?.unitLabel || entry?.recordLabel || entry?.label || defaultLabels.get(priceKind) || "Stavka").trim() || "Stavka";
  return recordLabel;
}

function getOfferStatusLabel(value = "") {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "sent") {
    return "Poslano";
  }
  if (normalized === "accepted") {
    return "Prihvaceno";
  }
  if (normalized === "rejected") {
    return "Odbijeno";
  }
  return "Skica";
}

function getPurchaseOrderStatusLabel(value = "") {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "received") {
    return "Zaprimljena";
  }
  if (normalized === "issued") {
    return "Poslana";
  }
  if (normalized === "confirmed") {
    return "Potvrdena";
  }
  if (normalized === "closed") {
    return "Zatvorena";
  }
  return "Skica";
}

function normalizeWorkOrderTemplateValue(value = "") {
  return String(value ?? "").trim();
}

function getWorkOrderTemplateExecutors(workOrder = {}) {
  const source = Array.isArray(workOrder.executors)
    ? workOrder.executors
    : [workOrder.executor1, workOrder.executor2];

  return source
    .map((entry) => {
      if (entry && typeof entry === "object") {
        return normalizeWorkOrderTemplateValue(entry.label || entry.name || entry.value || entry.fullName);
      }

      return normalizeWorkOrderTemplateValue(entry);
    })
    .filter(Boolean);
}

function buildWorkOrderTemplatePlaceholderPayload(workOrder = {}) {
  const normalizedWorkOrder = workOrder && typeof workOrder === "object" ? workOrder : {};
  const executors = getWorkOrderTemplateExecutors(normalizedWorkOrder);
  const serviceItems = Array.isArray(normalizedWorkOrder.serviceItems)
    ? normalizedWorkOrder.serviceItems
    : [];
  const services = serviceItems.length > 0
    ? serviceItems
      .map((item, index) => {
        const label = item && typeof item === "object"
          ? normalizeWorkOrderTemplateValue(item.name || item.serviceCode || item.title)
          : normalizeWorkOrderTemplateValue(item);
        return label ? `${index + 1}. ${label}` : "";
      })
      .filter(Boolean)
      .join("\n")
    : normalizeWorkOrderTemplateValue(normalizedWorkOrder.serviceLine);
  const payload = {
    RN_BROJ: normalizeWorkOrderTemplateValue(normalizedWorkOrder.workOrderNumber) || "Dodijeljen nakon spremanja",
    RN_STATUS: normalizeWorkOrderTemplateValue(normalizedWorkOrder.status),
    RN_PRIORITET: normalizeWorkOrderTemplateValue(normalizedWorkOrder.priority),
    RN_DATUM_OTVARANJA: normalizedWorkOrder.openedDate ? formatOfferDocumentDate(normalizedWorkOrder.openedDate) : "",
    RN_ROK_ZAVRSETKA: normalizedWorkOrder.dueDate ? formatOfferDocumentDate(normalizedWorkOrder.dueDate) : "",
    VEZA_RN: normalizeWorkOrderTemplateValue(normalizedWorkOrder.linkReference),
    TVRTKA_NAZIV: normalizeWorkOrderTemplateValue(normalizedWorkOrder.companyName),
    TVRTKA_SJEDISTE: normalizeWorkOrderTemplateValue(normalizedWorkOrder.headquarters),
    TVRTKA_OIB: normalizeWorkOrderTemplateValue(normalizedWorkOrder.companyOib),
    LOKACIJA_NAZIV: normalizeWorkOrderTemplateValue(normalizedWorkOrder.locationName),
    LOKACIJA_REGIJA: normalizeWorkOrderTemplateValue(normalizedWorkOrder.region),
    KONTAKT_OSOBA: normalizeWorkOrderTemplateValue(normalizedWorkOrder.contactName),
    KONTAKT_TELEFON: normalizeWorkOrderTemplateValue(normalizedWorkOrder.contactPhone),
    KONTAKT_EMAIL: normalizeWorkOrderTemplateValue(normalizedWorkOrder.contactEmail),
    IZVRSITELJI: executors.map((name, index) => `${index + 1}. ${name}`).join("\n"),
    USLUGE: services,
    NAPOMENA: normalizeWorkOrderTemplateValue(normalizedWorkOrder.description),
    ODJEL: normalizeWorkOrderTemplateValue(normalizedWorkOrder.department || normalizedWorkOrder.serviceLine),
    KOORDINATE: normalizeWorkOrderTemplateValue(normalizedWorkOrder.coordinates),
  };

  for (let index = 0; index < 10; index += 1) {
    const position = index + 1;
    const executorName = executors[index] || "";
    const ordinal = executorName ? `${position}.` : "";
    payload[`IZVRSITELJ_${position}_BROJ`] = ordinal;
    payload[`IZVRSITELJ_${position}_REDNI_BROJ`] = ordinal;
    payload[`IZVRSITELJ_${position}_IME`] = executorName;
    payload[`IZVRSITELJ_${position}`] = executorName ? `${position}. ${executorName}` : "";
  }

  return payload;
}

function getWorkOrderPdfExportFileName(workOrder = {}) {
  return sanitizeGeneratedDocumentFileName(
    workOrder.workOrderNumber || workOrder.companyName || "radni-nalog",
    { fallback: "radni-nalog", extension: "pdf" },
  );
}

async function buildWorkOrderPdfExportPayload(workOrder = {}, scopedSnapshot = {}, templateId = "") {
  const normalizedTemplateId = String(templateId || "").trim();
  const fileName = getWorkOrderPdfExportFileName(workOrder);

  if (normalizedTemplateId) {
    const template = assertInScope(
      scopedSnapshot.documentTemplates ?? [],
      normalizedTemplateId,
      "RN template nije pronaden.",
    );

    if (!template.referenceDocument || (!isHtmlTemplateFile(template.referenceDocument) && !isWordTemplateFile(template.referenceDocument))) {
      throw new Error("RN template mora imati .html/.htm ili .docx/.dotx predlozak.");
    }

    const referenceExtension = isWordTemplateFile(template.referenceDocument) ? "docx" : "html";

    const pdfBuffer = await generatePdfBufferForTemplate(template, {
      placeholders: buildWorkOrderTemplatePlaceholderPayload(workOrder),
      fileName: sanitizeGeneratedDocumentFileName(
        workOrder.workOrderNumber || workOrder.companyName || "radni-nalog",
        { fallback: "radni-nalog", extension: referenceExtension },
      ),
    });
    return { pdfBuffer, fileName };
  }

  const pdfBuffer = await buildWorkOrderPdfBuffer(workOrder);
  return { pdfBuffer, fileName };
}

function buildGeneratedWorkOrderPdfDocumentPayload(workOrder = {}, pdfBuffer = Buffer.alloc(0), fileName = "") {
  const safeFileName = fileName || getWorkOrderPdfExportFileName(workOrder);
  const safeBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer ?? []);

  return {
    fileName: safeFileName,
    fileType: "application/pdf",
    fileSize: safeBuffer.length,
    documentCategory: GENERATED_WORK_ORDER_PDF_CATEGORY,
    description: `Automatski spremljen PDF za RN ${workOrder.workOrderNumber || "bez broja"}.`,
    sourceType: "pdf",
    dataUrl: `data:application/pdf;base64,${safeBuffer.toString("base64")}`,
  };
}

function findGeneratedWorkOrderPdfDocument(documents = []) {
  return (Array.isArray(documents) ? documents : []).find((document) => (
    String(document.sourceType || "").toLowerCase() === "pdf"
    && String(document.documentCategory || "") === GENERATED_WORK_ORDER_PDF_CATEGORY
  )) ?? null;
}

async function saveGeneratedWorkOrderPdfDocument(workOrderId, workOrder = {}, scopedSnapshot = {}, user = null, templateId = "") {
  const { pdfBuffer, fileName } = await buildWorkOrderPdfExportPayload(workOrder, scopedSnapshot, templateId);
  const filePayload = buildGeneratedWorkOrderPdfDocumentPayload(workOrder, pdfBuffer, fileName);

  if (typeof domainRepository.upsertWorkOrderGeneratedPdfDocument === "function") {
    return await domainRepository.upsertWorkOrderGeneratedPdfDocument(workOrderId, filePayload, user);
  }

  const items = await domainRepository.addWorkOrderDocuments(
    workOrderId,
    [filePayload],
    user,
    { sourceType: "pdf" },
  );
  return items[0] ?? null;
}

function buildGeneratedDocumentTemplatePdfDocumentPayload({
  workOrder = {},
  template = {},
  pdfBuffer = Buffer.alloc(0),
  fileName = "",
} = {}) {
  const safeFileName = sanitizeGeneratedDocumentFileName(
    fileName || template.outputFileName || template.title || workOrder.workOrderNumber || "zapisnik",
    { fallback: "zapisnik", extension: "pdf" },
  );
  const safeBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer ?? []);
  const templateTitle = String(template.title || template.documentType || "Zapisnik").trim() || "Zapisnik";
  const workOrderNumber = String(workOrder.workOrderNumber || "bez broja").trim() || "bez broja";

  return {
    fileName: safeFileName,
    fileType: "application/pdf",
    fileSize: safeBuffer.length,
    documentCategory: GENERATED_DOCUMENT_TEMPLATE_PDF_CATEGORY,
    description: `Automatski spremljen zapisnik "${templateTitle}" za RN ${workOrderNumber}.`,
    sourceType: "pdf",
    dataUrl: `data:application/pdf;base64,${safeBuffer.toString("base64")}`,
  };
}

function stripStoredDocumentPayloadForResponse(document = null) {
  if (!document || typeof document !== "object") {
    return document;
  }
  const { dataUrl, ...rest } = document;
  return rest;
}

async function saveGeneratedDocumentTemplatePdfDocuments(entries = [], scopedSnapshot = {}, user = null) {
  const workOrders = scopedSnapshot.workOrders ?? [];
  const pdfFiles = await generatePdfFileEntriesForTemplateEntries(entries, scopedSnapshot);
  const savedItems = [];

  for (const pdfFile of pdfFiles) {
    const workOrderId = String(pdfFile?.entry?.workOrderId || "").trim();
    const workOrder = assertInScope(workOrders, workOrderId, "Radni nalog nije pronaden.");
    const filePayload = buildGeneratedDocumentTemplatePdfDocumentPayload({
      workOrder,
      template: pdfFile.template,
      pdfBuffer: pdfFile.buffer,
      fileName: pdfFile.fileName,
    });
    const item = typeof domainRepository.upsertWorkOrderGeneratedPdfDocument === "function"
      ? await domainRepository.upsertWorkOrderGeneratedPdfDocument(workOrderId, filePayload, user)
      : (await domainRepository.addWorkOrderDocuments(
        workOrderId,
        [filePayload],
        user,
        { sourceType: "pdf" },
      ))[0] ?? null;

    savedItems.push({
      workOrderId,
      workOrderNumber: String(workOrder.workOrderNumber || "").trim(),
      companyId: String(workOrder.companyId || "").trim(),
      companyName: String(workOrder.companyName || "").trim(),
      locationName: String(workOrder.locationName || "").trim(),
      templateId: String(pdfFile?.entry?.templateId || pdfFile?.template?.id || "").trim(),
      templateTitle: String(pdfFile?.template?.title || pdfFile?.template?.documentType || "Zapisnik").trim(),
      fileName: filePayload.fileName,
      item: stripStoredDocumentPayloadForResponse(item),
    });
  }

  return savedItems.filter((entry) => entry?.item);
}

function buildOfferTemplatePlaceholderPayload(offer = {}) {
  const normalizedOffer = offer && typeof offer === "object" ? offer : {};
  const currency = String(normalizedOffer.currency || "EUR").trim() || "EUR";
  const items = Array.isArray(normalizedOffer.items) ? normalizedOffer.items : [];
  const planType = normalizeCommercialOfferPlanType(normalizedOffer.serviceLine || "");
  const suppressItemTotals = planType === "Hybrid Plan"
    || items.some((item) => hasCommercialBreakdownRows(item));
  const itemsSummary = items
    .map((item, index) => `${index + 1}. ${item.description || "Stavka"}${item.unit ? ` · ${item.quantity || 0} ${item.unit}` : ""}${Number(item.totalPrice || 0) > 0 ? ` · ${formatOfferTemplateMoney(item.totalPrice || 0, currency)}` : ""}`)
    .join("\n");
  const itemsTableText = items
    .map((item, index) => {
      const breakdownText = Array.isArray(item.breakdowns) && item.breakdowns.length > 0
        ? `\n${item.breakdowns.map((entry) => `   - ${formatCommercialBreakdownLabel(entry)}: ${formatOfferTemplateMoney(entry.amount || 0, currency)}`).join("\n")}`
        : "";
      const amountText = suppressItemTotals
        ? formatOfferTemplateMoney(item.unitPrice || 0, currency)
        : formatOfferTemplateMoney(item.totalPrice || 0, currency);
      return `${index + 1}. ${item.description || "Stavka"} | ${item.quantity || 0} ${item.unit || ""} | ${amountText}${breakdownText}`;
    })
    .join("\n");
  const itemsTable = buildCommercialItemsTablePlaceholder(items, currency, {
    fallbackTitle: "Opis stavke",
    offerType: normalizedOffer.serviceLine || "",
    showTotalAmount: normalizedOffer.showTotalAmount !== false,
  });
  const monthlyItems = getCommercialOfferMonthlyItems(items, normalizedOffer.serviceLine || "");
  const servicePricingItems = getCommercialOfferServicePricingItems(items, normalizedOffer.serviceLine || "");
  const monthlyFeesTable = monthlyItems.length > 0
    ? buildCommercialItemsTablePlaceholder(items, currency, {
      fallbackTitle: "Mjesečne naknade",
      offerType: normalizedOffer.serviceLine || "",
      showTotalAmount: normalizedOffer.showTotalAmount !== false,
      section: "monthly",
      includeHeader: false,
      emptyMessage: "",
    })
    : "";
  const servicePricingTable = servicePricingItems.length > 0
    ? buildCommercialItemsTablePlaceholder(items, currency, {
      fallbackTitle: "Cjenik usluga",
      offerType: normalizedOffer.serviceLine || "",
      showTotalAmount: normalizedOffer.showTotalAmount !== false,
      section: "services",
      includeHeader: false,
      emptyMessage: "",
    })
    : "";
  const preparedBy = String(normalizedOffer.preparedByLabel || normalizedOffer.preparedBy || normalizedOffer.createdByLabel || "").trim();
  const offerItemsSummary = items
    .map((item, index) => {
      const summaryParts = [
        `${index + 1}. ${item.description || "Stavka"}`,
        getCommercialQuantityText(item),
      ].filter(Boolean);
      if (!suppressItemTotals && Number(item.totalPrice || 0) > 0) {
        summaryParts.push(formatOfferTemplateMoney(item.totalPrice || 0, currency));
      }
      return summaryParts.join(" | ");
    })
    .join("\n");

  return {
    OFFER_NUMBER: normalizedOffer.offerNumber || "Dodijeljen nakon spremanja",
    OFFER_TITLE: normalizedOffer.title || "",
    OFFER_STATUS: getOfferStatusLabel(normalizedOffer.status || "draft"),
    OFFER_DATE: normalizedOffer.offerDate ? formatOfferDocumentDate(normalizedOffer.offerDate) : "",
    VALID_UNTIL: normalizedOffer.validUntil ? formatOfferDocumentDate(normalizedOffer.validUntil) : "",
    COMPANY_NAME: normalizedOffer.companyName || "",
    COMPANY_OIB: normalizedOffer.companyOib || "",
    COMPANY_HEADQUARTERS: normalizedOffer.headquarters || "",
    LOCATION_SUMMARY: normalizedOffer.locationName || "Bez lokacije",
    LOCATION_LIST: Array.isArray(normalizedOffer.selectedLocationNames) && normalizedOffer.selectedLocationNames.length > 0
      ? normalizedOffer.selectedLocationNames.join("\n")
      : "Bez lokacije",
    CONTACT_NAME: normalizedOffer.contactName || "",
    CONTACT_PHONE: normalizedOffer.contactPhone || "",
    CONTACT_EMAIL: normalizedOffer.contactEmail || "",
    OFFER_PREPARED_BY: preparedBy,
    PREPARED_BY: preparedBy,
    CREATED_BY: preparedBy,
    SERVICE_LINE: normalizedOffer.serviceLine || "",
    OFFER_TYPE: normalizedOffer.serviceLine || "",
    OFFER_TEXT_1: normalizedOffer.textBlock1 || "",
    OFFER_TEXT_2: normalizedOffer.textBlock2 || "",
    ITEMS_TABLE: itemsTable,
    MONTHLY_FEES_TABLE: monthlyFeesTable,
    SERVICE_PRICING_TABLE: servicePricingTable,
    ITEMS_TABLE_TEXT: itemsTableText,
    ITEMS_SUMMARY: offerItemsSummary || itemsSummary,
    NOTE: normalizedOffer.note || "",
    SUBTOTAL: formatOfferTemplateMoney(normalizedOffer.subtotal || 0, currency),
    DISCOUNT_RATE: Number(normalizedOffer.discountRate || 0) > 0 ? `${normalizedOffer.discountRate}%` : "",
    DISCOUNT_TOTAL: formatOfferTemplateMoney(normalizedOffer.discountTotal || 0, currency),
    TAX_RATE: `${normalizedOffer.taxRate || 0}%`,
    TAX_TOTAL: formatOfferTemplateMoney(normalizedOffer.taxTotal || 0, currency),
    TOTAL: formatOfferTemplateMoney(normalizedOffer.total || 0, currency),
  };
}

function buildPurchaseOrderTemplatePlaceholderPayload(purchaseOrder = {}) {
  const normalizedPurchaseOrder = purchaseOrder && typeof purchaseOrder === "object" ? purchaseOrder : {};
  const currency = String(normalizedPurchaseOrder.currency || "EUR").trim() || "EUR";
  const items = Array.isArray(normalizedPurchaseOrder.items) ? normalizedPurchaseOrder.items : [];
  const itemsSummary = items
    .map((item, index) => `${index + 1}. ${item.description || "Stavka"}${item.unit ? ` · ${item.quantity || 0} ${item.unit}` : ""}${Number(item.totalPrice || 0) > 0 ? ` · ${formatOfferTemplateMoney(item.totalPrice || 0, currency)}` : ""}`)
    .join("\n");
  const itemsTableText = items
    .map((item, index) => {
      const breakdownText = Array.isArray(item.breakdowns) && item.breakdowns.length > 0
        ? `\n${item.breakdowns.map((entry) => `   - ${formatCommercialBreakdownLabel(entry)}: ${formatOfferTemplateMoney(entry.amount || 0, currency)}`).join("\n")}`
        : "";
      return `${index + 1}. ${item.description || "Stavka"} | ${item.quantity || 0} ${item.unit || ""} | ${formatOfferTemplateMoney(item.totalPrice || 0, currency)}${breakdownText}`;
    })
    .join("\n");
  const itemsTable = buildCommercialItemsTablePlaceholder(items, currency, { fallbackTitle: "Opis narudzbe" });

  return {
    PURCHASE_ORDER_NUMBER: normalizedPurchaseOrder.purchaseOrderNumber || "Dodijeljen nakon spremanja",
    PURCHASE_ORDER_TITLE: normalizedPurchaseOrder.title || "",
    PURCHASE_ORDER_STATUS: getPurchaseOrderStatusLabel(normalizedPurchaseOrder.status || "draft"),
    PURCHASE_ORDER_DATE: normalizedPurchaseOrder.purchaseOrderDate ? formatOfferDocumentDate(normalizedPurchaseOrder.purchaseOrderDate) : "",
    VALID_UNTIL: normalizedPurchaseOrder.validUntil ? formatOfferDocumentDate(normalizedPurchaseOrder.validUntil) : "",
    ORDER_DIRECTION: normalizedPurchaseOrder.orderDirection === "outgoing" ? "Izlazna" : "Ulazna",
    EXTERNAL_DOCUMENT_NUMBER: normalizedPurchaseOrder.externalDocumentNumber || "",
    COMPANY_NAME: normalizedPurchaseOrder.companyName || "",
    COMPANY_OIB: normalizedPurchaseOrder.companyOib || "",
    COMPANY_HEADQUARTERS: normalizedPurchaseOrder.headquarters || "",
    LOCATION_SUMMARY: normalizedPurchaseOrder.locationName || "Bez lokacije",
    LOCATION_LIST: Array.isArray(normalizedPurchaseOrder.selectedLocationNames) && normalizedPurchaseOrder.selectedLocationNames.length > 0
      ? normalizedPurchaseOrder.selectedLocationNames.join("\n")
      : "Bez lokacije",
    CONTACT_NAME: normalizedPurchaseOrder.contactName || "",
    CONTACT_PHONE: normalizedPurchaseOrder.contactPhone || "",
    CONTACT_EMAIL: normalizedPurchaseOrder.contactEmail || "",
    SERVICE_LINE: normalizedPurchaseOrder.serviceLine || "",
    ITEMS_TABLE: itemsTable,
    ITEMS_TABLE_TEXT: itemsTableText,
    ITEMS_SUMMARY: itemsSummary,
    NOTE: normalizedPurchaseOrder.note || "",
    SUBTOTAL: formatOfferTemplateMoney(normalizedPurchaseOrder.subtotal || 0, currency),
    DISCOUNT_RATE: Number(normalizedPurchaseOrder.discountRate || 0) > 0 ? `${normalizedPurchaseOrder.discountRate}%` : "",
    DISCOUNT_TOTAL: formatOfferTemplateMoney(normalizedPurchaseOrder.discountTotal || 0, currency),
    TAX_RATE: `${normalizedPurchaseOrder.taxRate || 0}%`,
    TAX_TOTAL: formatOfferTemplateMoney(normalizedPurchaseOrder.taxTotal || 0, currency),
    TOTAL: formatOfferTemplateMoney(normalizedPurchaseOrder.total || 0, currency),
  };
}

function getContractStatusLabel(value = "") {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "pending_signature") {
    return "Na potpisu";
  }
  if (normalized === "active") {
    return "Aktivan";
  }
  if (normalized === "expired") {
    return "Istekao";
  }
  if (normalized === "terminated") {
    return "Raskinut";
  }
  return "Skica";
}

function buildContractTemplatePlaceholderPayload(contract = {}) {
  const normalizedContract = contract && typeof contract === "object" ? contract : {};
  const linkedOffers = Array.isArray(normalizedContract.linkedOffers) ? normalizedContract.linkedOffers : [];
  const annexes = Array.isArray(normalizedContract.annexes) ? normalizedContract.annexes : [];

  const offerList = linkedOffers.length > 0
    ? linkedOffers.map((offer, index) => [
      `${index + 1}. ${offer.offerNumber || "Ponuda"}`,
      offer.title || "",
      offer.offerDate ? formatOfferDocumentDate(offer.offerDate) : "",
    ].filter(Boolean).join(" | ")).join("\n")
    : "Nema povezanih ponuda";
  const annexList = annexes.length > 0
    ? annexes.map((annex, index) => [
      `${index + 1}. ${annex.annexNumber || `Aneks ${index + 1}`}`,
      annex.title || "",
      annex.effectiveDate ? formatOfferDocumentDate(annex.effectiveDate) : "",
      annex.note || "",
    ].filter(Boolean).join(" | ")).join("\n")
    : "Bez anexa";

  return {
    CONTRACT_NUMBER: normalizedContract.contractNumber || "Dodijeljen nakon spremanja",
    CONTRACT_TITLE: normalizedContract.title || "",
    CONTRACT_STATUS: getContractStatusLabel(normalizedContract.status || "draft"),
    TEMPLATE_NAME: normalizedContract.templateTitle || "",
    SIGNED_ON: normalizedContract.signedOn ? formatOfferDocumentDate(normalizedContract.signedOn) : "",
    VALID_FROM: normalizedContract.validFrom ? formatOfferDocumentDate(normalizedContract.validFrom) : "",
    VALID_TO: normalizedContract.validTo ? formatOfferDocumentDate(normalizedContract.validTo) : "",
    COMPANY_NAME: normalizedContract.companyName || "",
    COMPANY_OIB: normalizedContract.companyOib || "",
    COMPANY_HEADQUARTERS: normalizedContract.headquarters || "",
    COMPANY_REPRESENTATIVE: normalizedContract.representative || "",
    COMPANY_PHONE: normalizedContract.contactPhone || "",
    COMPANY_EMAIL: normalizedContract.contactEmail || "",
    SUBJECT: normalizedContract.subject || "",
    SCOPE_SUMMARY: normalizedContract.scopeSummary || "",
    NOTE: normalizedContract.note || "",
    OFFER_LIST: offerList,
    ANNEX_LIST: annexList,
  };
}

function escapeEmailHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const WORK_ORDER_STATUS_EMAIL_LABELS = new Map(
  WORK_ORDER_STATUS_OPTIONS.map((option) => [String(option.value), option.label]),
);

function buildProfileReportRows(user = {}) {
  return [
    ["Ime i prezime", user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || ""],
    ["Email", user.email || ""],
    ["Kontakt broj", user.phone || ""],
    ["OIB", user.oib || ""],
    ["Obrazovanje", user.education || ""],
    ["Radno mjesto", user.title || ""],
    ["Adresa", user.address || ""],
    ["Organizacija", user.organizationName || ""],
  ].filter(([, value]) => String(value ?? "").trim());
}

function buildOwnProfileReportEmail(user = {}, scopedSnapshot = {}) {
  const workOrders = Array.isArray(scopedSnapshot.workOrders) ? scopedSnapshot.workOrders : [];
  const reminders = Array.isArray(scopedSnapshot.reminders) ? scopedSnapshot.reminders : [];
  const todoTasks = Array.isArray(scopedSnapshot.todoTasks) ? scopedSnapshot.todoTasks : [];
  const statusCounts = workOrders.reduce((counts, workOrder) => {
    const status = String(workOrder?.status || "unknown");
    counts.set(status, (counts.get(status) ?? 0) + 1);
    return counts;
  }, new Map());
  const statusLines = Array.from(statusCounts.entries())
    .sort((left, right) => String(left[0]).localeCompare(String(right[0]), "hr"))
    .map(([status, count]) => `${WORK_ORDER_STATUS_EMAIL_LABELS.get(status) || status}: ${count}`);
  const activeReminders = reminders.filter((item) => !["done", "completed", "closed"].includes(String(item?.status || "").toLowerCase())).length;
  const openTodo = todoTasks.filter((item) => !["done", "completed", "closed"].includes(String(item?.status || "").toLowerCase())).length;
  const profileRows = buildProfileReportRows(user);
  const generatedAt = new Date().toLocaleString("hr-HR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Zagreb",
  });
  const titleName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "korisnik";
  const summaryRows = [
    ["Radni nalozi", String(workOrders.length)],
    ["Aktivni reminders", String(activeReminders)],
    ["Otvoreni ToDo", String(openTodo)],
    ["Generirano", generatedAt],
  ];
  const profileText = profileRows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const summaryText = summaryRows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const statusText = statusLines.length ? `\n\nStatusi RN:\n${statusLines.join("\n")}` : "";
  const renderHtmlRows = (rows) => rows.map(([label, value]) => `
    <tr>
      <td style="padding:7px 10px;color:#64748b;border-bottom:1px solid #e2e8f0;">${escapeEmailHtml(label)}</td>
      <td style="padding:7px 10px;color:#0f172a;border-bottom:1px solid #e2e8f0;font-weight:600;">${escapeEmailHtml(value)}</td>
    </tr>
  `).join("");

  return {
    subject: `SafeNexus dnevni izvjestaj - ${titleName}`,
    text: `SafeNexus dnevni izvjestaj\n\nU privitku je PDF pregled Dashboarda i kalendara.\n\nProfil\n${profileText || "Nema dodatnih profilnih podataka."}\n\nSazetak\n${summaryText}${statusText}\n\nSafeNexus`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.55;color:#0f172a;">
        <h2 style="margin:0 0 12px;">SafeNexus dnevni izvjestaj</h2>
        <p style="margin:0 0 16px;color:#475569;">U privitku je PDF pregled Dashboarda i kalendara.</p>
        <h3 style="margin:16px 0 8px;">Profil</h3>
        <table style="width:100%;border-collapse:collapse;">${renderHtmlRows(profileRows)}</table>
        <h3 style="margin:18px 0 8px;">Sazetak</h3>
        <table style="width:100%;border-collapse:collapse;">${renderHtmlRows(summaryRows)}</table>
        ${statusLines.length ? `<h3 style="margin:18px 0 8px;">Statusi RN</h3><div>${statusLines.map((line) => `<div>${escapeEmailHtml(line)}</div>`).join("")}</div>` : ""}
        <div style="margin-top:18px;color:#64748b;">SafeNexus</div>
      </div>
    `,
  };
}

function buildProfileReportPdfFileName(user = {}, todayKey = "") {
  const baseName = [
    "dashboard-kalendar",
    user.fullName || [user.firstName, user.lastName].filter(Boolean).join("-") || user.email || "izvjestaj",
    todayKey,
  ].filter(Boolean).join("-");

  return sanitizeGeneratedDocumentFileName(baseName, {
    fallback: "dashboard-kalendar-izvjestaj",
    extension: "pdf",
  });
}

async function sendDashboardCalendarProfileReport(reportUser = {}, scopedSnapshot = {}, {
  generatedAt = new Date().toISOString(),
  todayKey = "",
} = {}) {
  const organizationName = scopedSnapshot.currentOrganization?.name || reportUser.organizationName || "";
  const reportEmail = buildOwnProfileReportEmail(reportUser, scopedSnapshot);
  const fileName = buildProfileReportPdfFileName(reportUser, todayKey);
  const pdfBuffer = await buildDashboardCalendarReportPdfBuffer({
    user: reportUser,
    organizationName,
    scopedSnapshot,
    generatedAt,
    todayKey,
  });

  const result = await sendMail({
    to: reportUser.email,
    subject: reportEmail.subject,
    text: reportEmail.text,
    html: reportEmail.html,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    ...result,
    fileName,
  };
}

function buildOfferExportBaseName(offer = {}) {
  return offer.offerNumber || offer.title || offer.companyName || "ponuda";
}

async function readOfferHtmlTemplateReference(referenceDocument = null) {
  if (!referenceDocument || !isHtmlTemplateFile(referenceDocument)) {
    return {
      templateHtml: "",
      templateFileName: "",
    };
  }

  const storedDocument = await readStoredDocumentBuffer(referenceDocument);
  return {
    templateHtml: storedDocument.buffer.toString("utf8"),
    templateFileName: referenceDocument.fileName || referenceDocument.name || "",
  };
}

async function buildOfferPdfExportPayload(offer = {}, organizationId = "", options = {}) {
  const baseName = buildOfferExportBaseName(offer);
  const fileName = sanitizeGeneratedDocumentFileName(baseName, {
    fallback: "ponuda",
    extension: "pdf",
  });

  const pdfEngine = String(options?.pdfEngine || options?.engine || "").trim().toLowerCase();
  const useWordTemplate = ["word", "docx", "template", "libreoffice"].includes(pdfEngine);
  const useHtmlTemplate = ["html", "html-pdf", "chromium"].includes(pdfEngine);

  if (!useWordTemplate && !useHtmlTemplate) {
    const pdfBuffer = await buildOfferPdfBuffer(offer, { currency: offer.currency || "EUR" });
    return { pdfBuffer, fileName };
  }

  const offerTemplateSettings = await domainRepository.getOfferTemplateSettings(organizationId).catch(() => null);
  const offerTemplateDocument = offerTemplateSettings?.referenceDocument ?? null;

  if (useWordTemplate && offerTemplateDocument) {
    if (!isWordTemplateFile(offerTemplateDocument)) {
      throw new Error("Uploadani template ponude mora biti .docx ili .dotx Word predložak.");
    }

    try {
      const referenceDocument = await readStoredDocumentBuffer(offerTemplateDocument);
      const pdfBuffer = await buildPdfFromTemplateBuffer(
        referenceDocument.buffer,
        buildOfferTemplatePlaceholderPayload(offer),
        {
          fileName: sanitizeGeneratedDocumentFileName(baseName, {
            fallback: "ponuda",
            extension: "docx",
          }),
        },
      );
      return { pdfBuffer, fileName };
    } catch (error) {
      console.error("Offer template PDF export failed.", error);
      throw new Error(`Ne mogu generirati PDF iz uploadanog templatea ponude: ${error?.message || "nepoznata greška"}`);
    }
  }

  if (useHtmlTemplate) {
    const { templateHtml } = await readOfferHtmlTemplateReference(offerTemplateDocument).catch((error) => {
      console.warn("Offer HTML template reference could not be read; using bundled HTML template.", error);
      return {
        templateHtml: "",
        templateFileName: "",
      };
    });

    try {
      const pdfBuffer = await buildOfferHtmlPdfBuffer(offer, {
        currency: offer.currency || "EUR",
        templateHtml,
      });
      return { pdfBuffer, fileName };
    } catch (error) {
      console.warn("Offer HTML PDF export failed, falling back to native PDF.", error);
    }
  }

  const pdfBuffer = await buildOfferPdfBuffer(offer, { currency: offer.currency || "EUR" });
  return { pdfBuffer, fileName };
}

async function buildOfferHtmlPreviewPayload(offer = {}, organizationId = "") {
  const offerTemplateSettings = await domainRepository.getOfferTemplateSettings(organizationId).catch(() => null);
  const offerTemplateDocument = offerTemplateSettings?.referenceDocument ?? null;
  const baseName = buildOfferExportBaseName(offer);
  const templateReference = await readOfferHtmlTemplateReference(offerTemplateDocument).catch((error) => {
    console.warn("Offer HTML template preview reference could not be read; using bundled HTML template.", error);
    return {
      templateHtml: "",
      templateFileName: "",
      warning: error?.message || "HTML template se ne može pročitati.",
    };
  });

  return {
    html: buildOfferHtmlTemplate(offer, {
      currency: offer.currency || "EUR",
      templateHtml: templateReference.templateHtml,
    }),
    messages: templateReference.warning
      ? [{
        type: "warning",
        message: templateReference.warning,
      }]
      : [],
    fileName: sanitizeGeneratedDocumentFileName(baseName, {
      fallback: "ponuda",
      extension: "html",
    }),
    templateFileName: templateReference.templateFileName || "offer-v1.0.0.html",
    templateEngine: "html",
  };
}

function buildPurchaseOrderExportBaseName(purchaseOrder = {}) {
  return purchaseOrder.purchaseOrderNumber || purchaseOrder.title || purchaseOrder.companyName || "narudzbenica";
}

async function buildPurchaseOrderPdfExportPayload(purchaseOrder = {}, organizationId = "") {
  const purchaseOrderTemplateSettings = await domainRepository.getPurchaseOrderTemplateSettings(organizationId).catch(() => null);
  const baseName = buildPurchaseOrderExportBaseName(purchaseOrder);
  const fileName = sanitizeGeneratedDocumentFileName(baseName, {
    fallback: "narudzbenica",
    extension: "pdf",
  });

  if (purchaseOrderTemplateSettings?.referenceDocument && isWordTemplateFile(purchaseOrderTemplateSettings.referenceDocument)) {
    try {
      const referenceDocument = await readStoredDocumentBuffer(purchaseOrderTemplateSettings.referenceDocument);
      const pdfBuffer = await buildPdfFromTemplateBuffer(
        referenceDocument.buffer,
        buildPurchaseOrderTemplatePlaceholderPayload(purchaseOrder),
        {
          fileName: sanitizeGeneratedDocumentFileName(baseName, {
            fallback: "narudzbenica",
            extension: "docx",
          }),
        },
      );
      return { pdfBuffer, fileName };
    } catch (error) {
      console.warn("Purchase order template PDF export failed, falling back to generated PDF.", error);
    }
  }

  const pdfBuffer = await buildPurchaseOrderPdfBuffer(purchaseOrder, { currency: purchaseOrder.currency || "EUR" });
  return { pdfBuffer, fileName };
}

function buildContractExportBaseName(contract = {}) {
  return contract.contractNumber || contract.title || contract.companyName || "ugovor";
}

async function getContractTemplateDocument(contract = {}, organizationId = "") {
  const templateId = String(contract.templateId || "").trim();
  if (!templateId) {
    throw new Error("Odaberi template ugovora prije izvoza.");
  }

  const snapshot = await domainRepository.getSnapshot();
  const template = (snapshot.contractTemplates ?? []).find((item) => (
    String(item.organizationId) === String(organizationId)
    && String(item.id) === templateId
  ));

  if (!template?.referenceDocument || !isWordTemplateFile(template.referenceDocument)) {
    throw new Error("Template ugovora nema valjani Word dokument.");
  }

  return {
    template,
    referenceDocument: await readStoredDocumentBuffer(template.referenceDocument),
  };
}

async function buildContractWordExportPayload(contract = {}, organizationId = "") {
  const baseName = buildContractExportBaseName(contract);
  const { referenceDocument } = await getContractTemplateDocument(contract, organizationId);
  const fileName = sanitizeGeneratedDocumentFileName(baseName, {
    fallback: "ugovor",
    extension: "docx",
  });
  const docxBuffer = await buildDocxFromTemplateBuffer(
    referenceDocument.buffer,
    buildContractTemplatePlaceholderPayload(contract),
    { fileName },
  );
  return { docxBuffer, fileName };
}

async function buildContractPdfExportPayload(contract = {}, organizationId = "") {
  const baseName = buildContractExportBaseName(contract);
  const { referenceDocument } = await getContractTemplateDocument(contract, organizationId);
  const fileName = sanitizeGeneratedDocumentFileName(baseName, {
    fallback: "ugovor",
    extension: "pdf",
  });
  const pdfBuffer = await buildPdfFromTemplateBuffer(
    referenceDocument.buffer,
    buildContractTemplatePlaceholderPayload(contract),
    {
      fileName: sanitizeGeneratedDocumentFileName(baseName, {
        fallback: "ugovor",
        extension: "docx",
      }),
    },
  );
  return { pdfBuffer, fileName };
}

function shouldUseSecureCookies(request) {
  const forwardedProto = String(request.headers["x-forwarded-proto"] ?? "").toLowerCase();
  const host = String(request.headers.host ?? "");
  return forwardedProto === "https" || (!host.startsWith("localhost") && !host.startsWith("127.0.0.1"));
}

function getClientIp(request) {
  const forwardedFor = String(request.headers["x-forwarded-for"] ?? "");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return String(request.socket.remoteAddress ?? "");
}

function appendResponseCookies(response, cookies) {
  const nextCookies = Array.isArray(cookies) ? cookies.filter(Boolean) : [cookies].filter(Boolean);

  if (nextCookies.length === 0) {
    return;
  }

  const currentHeader = response.getHeader("Set-Cookie");
  const currentCookies = Array.isArray(currentHeader)
    ? currentHeader
    : currentHeader
      ? [currentHeader]
      : [];

  response.setHeader("Set-Cookie", [...currentCookies, ...nextCookies]);
}

function buildUserFromTokenPayload(payload) {
  if (!payload?.sub) {
    return null;
  }

  return {
    id: String(payload.sub),
    username: String(payload.username ?? ""),
    email: String(payload.email ?? ""),
    fullName: String(payload.fullName ?? payload.username ?? ""),
    role: String(payload.role ?? "user"),
    organizationId: payload.organizationId ? String(payload.organizationId) : "",
    organizationName: String(payload.organizationName ?? ""),
  };
}

async function hydrateRequestUser(userLike) {
  if (!userLike?.id || typeof tenantRepository.getUserById !== "function") {
    return userLike ?? null;
  }

  return await tenantRepository.getUserById(userLike.id);
}

async function clearRequestAuth(request, response) {
  const cookies = parseCookies(request.headers.cookie ?? "");
  const refreshToken = getRefreshTokenFromCookies(cookies);

  if (refreshToken) {
    await tenantRepository.deleteRefreshToken(refreshToken);
  }

  appendResponseCookies(response, clearAuthCookies({
    secure: shouldUseSecureCookies(request),
    domain: resolveAuthCookieDomain(request),
  }));
  request[requestUserSymbol] = null;
}

async function tryRefreshAuth(request, response, cookies) {
  const refreshToken = getRefreshTokenFromCookies(cookies);

  if (!refreshToken) {
    return null;
  }

  const refreshVerification = verifyToken(refreshToken, jwtSecret, { expectedType: "refresh" });

  if (!refreshVerification.ok) {
    await clearRequestAuth(request, response);
    return null;
  }

  const provisionalUser = buildUserFromTokenPayload(refreshVerification.payload);

  if (!provisionalUser) {
    await clearRequestAuth(request, response);
    return null;
  }

  const nextAccessToken = createAccessToken(provisionalUser, jwtSecret);
  const nextRefreshToken = createRefreshToken(provisionalUser, jwtSecret);
  const rotated = await tenantRepository.rotateRefreshToken(refreshToken, nextRefreshToken, {
    expectedUserId: provisionalUser.id,
    ipAddress: getClientIp(request),
    userAgent: request.headers["user-agent"] ?? "",
  });

  if (!rotated?.user) {
    await clearRequestAuth(request, response);
    return null;
  }

  appendResponseCookies(response, createAuthCookies({
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    secure: shouldUseSecureCookies(request),
    domain: resolveAuthCookieDomain(request),
  }));

  return hydrateRequestUser(rotated.user);
}

async function getRequestUser(request, response) {
  if (Object.prototype.hasOwnProperty.call(request, requestUserSymbol)) {
    return request[requestUserSymbol];
  }

  const cookies = parseCookies(request.headers.cookie ?? "");
  const accessToken = getAccessTokenFromCookies(cookies);
  const accessVerification = verifyToken(accessToken, jwtSecret, { expectedType: "access" });

  if (accessVerification.ok) {
    const user = await hydrateRequestUser(buildUserFromTokenPayload(accessVerification.payload));
    request[requestUserSymbol] = user;
    return user;
  }

  const refreshedUser = await tryRefreshAuth(request, response, cookies);
  request[requestUserSymbol] = refreshedUser;
  return refreshedUser;
}

function isPasswordChangeRequiredRequestAllowed(url, request) {
  return request.method === "POST" && (
    url.pathname === "/api/auth/change-password"
    || url.pathname === "/api/auth/logout"
  );
}

async function readRequestBodyText(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return "";
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody(request) {
  const body = await readRequestBodyText(request);

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

async function readFormBody(request) {
  const body = await readRequestBodyText(request);

  if (!body) {
    return {};
  }

  const parsed = new URLSearchParams(body);
  const values = {};

  for (const [key, value] of parsed.entries()) {
    values[key] = value;
  }

  return values;
}

function redirect(response, location, statusCode = 303) {
  response.statusCode = statusCode;
  response.setHeader("Location", location);
  response.end();
}

function getForwardedProto(request) {
  return String(request.headers["x-forwarded-proto"] ?? "").split(",")[0].trim().toLowerCase();
}

function getRequestProtocol(request) {
  const forwardedProto = getForwardedProto(request);

  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  return shouldUseSecureCookies(request) ? "https" : "http";
}

function getRequestHost(request) {
  return String(request.headers.host ?? "").split(",")[0].trim().toLowerCase();
}

function getHostNameOnly(host = "") {
  const normalized = String(host ?? "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("[")) {
    const bracketIndex = normalized.indexOf("]");
    return bracketIndex === -1 ? normalized : normalized.slice(0, bracketIndex + 1);
  }

  return normalized.split(":")[0];
}

function resolveAuthCookieDomain(request) {
  if (!canonicalAppHost) {
    return "";
  }

  const canonicalHostName = getHostNameOnly(canonicalAppHost);
  const requestHostName = getHostNameOnly(getRequestHost(request));

  if (!canonicalHostName || !requestHostName) {
    return "";
  }

  if (isLocalDevelopmentHost(canonicalHostName) || isLocalDevelopmentHost(requestHostName)) {
    return "";
  }

  if (requestHostName === canonicalHostName || requestHostName.endsWith(`.${canonicalHostName}`)) {
    return canonicalHostName;
  }

  return "";
}

function isLocalDevelopmentHost(host = "") {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
}

function setSecurityHeaders(response, request) {
  response.setHeader("Content-Security-Policy", securityContentSecurityPolicy);
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Permissions-Policy", [
    "accelerometer=()",
    "autoplay=()",
    "camera=()",
    "display-capture=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
    "screen-wake-lock=()",
  ].join(", "));
  response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  response.setHeader("Origin-Agent-Cluster", "?1");

  if (getRequestProtocol(request) === "https") {
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function getCanonicalRedirectTarget(request, url) {
  if (!canonicalAppOrigin) {
    return "";
  }

  if (url.pathname === "/api/health") {
    return "";
  }

  const host = getRequestHost(request);
  if (!host || isLocalDevelopmentHost(host)) {
    return "";
  }

  const requestOrigin = `${getRequestProtocol(request)}://${host}`;
  if (requestOrigin === canonicalAppOrigin && host === canonicalAppHost) {
    return "";
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return "";
  }

  return new URL(`${url.pathname}${url.search}`, canonicalAppOrigin).toString();
}

function getRequestedOrganizationId(request) {
  return String(request.headers["x-organization-id"] ?? "").trim();
}

function isSnapshotCacheableRequest(request) {
  return request?.method === "GET";
}

function invalidateSnapshotCaches() {
  cachedRawSnapshotEntry = null;
  scopedSnapshotCache.clear();
}

function getScopedSnapshotCacheKey(user, requestedOrganizationId = "") {
  return [
    String(user?.id ?? "anonymous"),
    String(requestedOrganizationId ?? ""),
  ].join("::");
}

async function getRawSnapshot(request) {
  const cacheable = isSnapshotCacheableRequest(request);
  const now = Date.now();

  if (cacheable && cachedRawSnapshotEntry?.expiresAt > now) {
    return cachedRawSnapshotEntry.snapshot;
  }

  const rawSnapshot = await domainRepository.getSnapshot();

  if (cacheable) {
    cachedRawSnapshotEntry = {
      expiresAt: now + SNAPSHOT_CACHE_TTL_MS,
      snapshot: rawSnapshot,
    };
  }

  return rawSnapshot;
}

async function getScopedState(user, request) {
  const requestedOrganizationId = getRequestedOrganizationId(request);
  const cacheable = isSnapshotCacheableRequest(request);
  const cacheKey = getScopedSnapshotCacheKey(user, requestedOrganizationId);
  const now = Date.now();

  if (cacheable) {
    const cachedEntry = scopedSnapshotCache.get(cacheKey);
    if (cachedEntry?.expiresAt > now) {
      return {
        requestedOrganizationId,
        rawSnapshot: cachedEntry.rawSnapshot,
        scopedSnapshot: cachedEntry.scopedSnapshot,
      };
    }
  }

  const rawSnapshot = await getRawSnapshot(request);
  const scopedSnapshot = await tenantRepository.getSnapshot(user, requestedOrganizationId, rawSnapshot);

  if (cacheable) {
    scopedSnapshotCache.set(cacheKey, {
      expiresAt: now + SNAPSHOT_CACHE_TTL_MS,
      rawSnapshot,
      scopedSnapshot,
    });
  }

  return {
    requestedOrganizationId,
    rawSnapshot,
    scopedSnapshot,
  };
}

const REPORT_SCHEDULE_TIME_ZONE = "Europe/Zagreb";
const REPORT_SCHEDULE_POLL_MS = 60_000;
const REPORT_SCHEDULE_GRACE_MINUTES = 10;
let scheduledProfileReportsTimer = null;
let scheduledProfileReportsRunning = false;

function getScheduledReportClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORT_SCHEDULE_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now).reduce((accumulator, part) => {
    accumulator[part.type] = part.value;
    return accumulator;
  }, {});
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;

  return {
    dateKey,
    weekday: parts.weekday,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function parseReportScheduleMinutes(time = "07:00") {
  const match = String(time ?? "").trim().match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return 7 * 60;
  }

  return (Number(match[1]) * 60) + Number(match[2]);
}

function shouldSendScheduledProfileReport(user = {}, clock = getScheduledReportClock()) {
  if (!user.reportEmailEnabled || !user.email) {
    return false;
  }

  if (!["Mon", "Tue", "Wed", "Thu", "Fri"].includes(clock.weekday)) {
    return false;
  }

  if (String(user.reportEmailLastSentOn || "") === clock.dateKey) {
    return false;
  }

  const currentMinutes = (clock.hour * 60) + clock.minute;
  const scheduledMinutes = parseReportScheduleMinutes(user.reportEmailTime);
  return currentMinutes >= scheduledMinutes
    && currentMinutes < scheduledMinutes + REPORT_SCHEDULE_GRACE_MINUTES;
}

async function runScheduledProfileReports() {
  if (scheduledProfileReportsRunning || typeof tenantRepository.listUsersWithReportSchedule !== "function") {
    return;
  }

  const clock = getScheduledReportClock();
  if (!["Mon", "Tue", "Wed", "Thu", "Fri"].includes(clock.weekday)) {
    return;
  }

  scheduledProfileReportsRunning = true;
  try {
    const users = await tenantRepository.listUsersWithReportSchedule();
    const dueUsers = users.filter((reportUser) => shouldSendScheduledProfileReport(reportUser, clock));

    if (dueUsers.length === 0) {
      return;
    }

    const rawSnapshot = await domainRepository.getSnapshot();

    for (const reportUser of dueUsers) {
      try {
        const scopedSnapshot = await tenantRepository.getSnapshot(reportUser, reportUser.organizationId, rawSnapshot);
        const result = await sendDashboardCalendarProfileReport(reportUser, scopedSnapshot, {
          generatedAt: new Date().toISOString(),
          todayKey: clock.dateKey,
        });

        if (!result.ok) {
          console.warn("Scheduled dashboard report email failed.", {
            userId: reportUser.id,
            email: reportUser.email,
            error: result.error,
          });
          continue;
        }

        await tenantRepository.markProfileReportSent(reportUser.id, clock.dateKey);
      } catch (error) {
        console.warn("Scheduled dashboard report job failed for user.", {
          userId: reportUser.id,
          email: reportUser.email,
          error: error?.message || error,
        });
      }
    }
  } finally {
    scheduledProfileReportsRunning = false;
  }
}

function startScheduledProfileReports() {
  if (scheduledProfileReportsTimer) {
    return;
  }

  scheduledProfileReportsTimer = setInterval(() => {
    void runScheduledProfileReports();
  }, REPORT_SCHEDULE_POLL_MS);
  scheduledProfileReportsTimer.unref?.();

  setTimeout(() => {
    void runScheduledProfileReports();
  }, 5_000).unref?.();
}

function assertInScope(collection, id, message) {
  const item = collection.find((entry) => String(entry.id) === String(id));

  if (!item) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }

  return item;
}

function assertCompanyPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.companyId) {
    return;
  }

  assertInScope(scopedSnapshot.companies, body.companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
}

function assertLocationPayloadInScope(scopedSnapshot, body = {}) {
  const locationIds = [
    body.locationId,
    ...(Array.isArray(body.selectedLocationIds) ? body.selectedLocationIds : []),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  locationIds.forEach((locationId) => {
    assertInScope(scopedSnapshot.locations, locationId, "Lokacija nije dostupna za odabranu organizaciju.");
  });
}

function normalizeRequestIdList(values = []) {
  const entries = Array.isArray(values) ? values : [values];
  return Array.from(new Set(
    entries
      .map((value) => String(value ?? "").trim())
      .filter(Boolean),
  ));
}

function normalizeRequestBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "no", "ne"].includes(normalized)) {
    return false;
  }
  if (["true", "1", "yes", "da"].includes(normalized)) {
    return true;
  }
  return Boolean(value);
}

function isClientPortalUserPayload(body = {}) {
  const profileRole = String(body.profileRole ?? body.profile_role ?? "").trim().toLowerCase();
  return profileRole === "client_user"
    || Object.prototype.hasOwnProperty.call(body, "clientCompanyIds")
    || Object.prototype.hasOwnProperty.call(body, "client_company_ids_json")
    || Object.prototype.hasOwnProperty.call(body, "clientLocationIds")
    || Object.prototype.hasOwnProperty.call(body, "client_location_ids_json")
    || Object.prototype.hasOwnProperty.call(body, "clientAccessAllLocations")
    || Object.prototype.hasOwnProperty.call(body, "client_access_all_locations");
}

function assertClientPortalUserPayloadInScope(scopedSnapshot, body = {}) {
  const companyIds = normalizeRequestIdList(body.clientCompanyIds ?? body.client_company_ids_json);
  if (companyIds.length === 0) {
    const error = new Error("Odaberi tvrtku za klijentski portal.");
    error.statusCode = 400;
    throw error;
  }

  companyIds.forEach((companyId) => {
    assertInScope(scopedSnapshot.companies ?? [], companyId, "Tvrtka nije dostupna za klijentski portal.");
  });

  const accessAllLocations = normalizeRequestBoolean(
    body.clientAccessAllLocations ?? body.client_access_all_locations,
    true,
  );
  if (accessAllLocations) {
    return;
  }

  const locationIds = normalizeRequestIdList(body.clientLocationIds ?? body.client_location_ids_json);
  if (locationIds.length === 0) {
    const error = new Error("Odaberi barem jednu lokaciju za klijentski portal.");
    error.statusCode = 400;
    throw error;
  }

  const companyIdSet = new Set(companyIds.map((companyId) => String(companyId)));
  locationIds.forEach((locationId) => {
    const location = assertInScope(scopedSnapshot.locations ?? [], locationId, "Lokacija nije dostupna za klijentski portal.");
    if (!companyIdSet.has(String(location.companyId))) {
      const error = new Error("Lokacija ne pripada odabranoj tvrtki.");
      error.statusCode = 400;
      throw error;
    }
  });
}

function withClientPortalUserManagementPermission(actor = {}) {
  return {
    ...actor,
    appPermissions: {
      ...(actor.appPermissions ?? {}),
      "people.manage": true,
    },
  };
}

function assertLocationObjectPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.objectId) {
    return null;
  }

  const locationObject = assertInScope(
    scopedSnapshot.locationObjects ?? [],
    body.objectId,
    "Objekt nije dostupan za odabranu lokaciju.",
  );
  if (body.companyId && String(locationObject.companyId) !== String(body.companyId)) {
    const error = new Error("Objekt ne pripada odabranoj tvrtki.");
    error.statusCode = 400;
    throw error;
  }
  if (body.locationId && String(locationObject.locationId) !== String(body.locationId)) {
    const error = new Error("Objekt ne pripada odabranoj lokaciji.");
    error.statusCode = 400;
    throw error;
  }

  return locationObject;
}

function assertSampleCompanyPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.sampleCompanyId) {
    return;
  }

  assertInScope(scopedSnapshot.companies, body.sampleCompanyId, "Tvrtka nije dostupna za odabrani template.");
}

function assertSampleLocationPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.sampleLocationId) {
    return;
  }

  assertInScope(scopedSnapshot.locations, body.sampleLocationId, "Lokacija nije dostupna za odabrani template.");
}

function assertLegalFrameworkIdsPayloadInScope(scopedSnapshot, body = {}) {
  if (!Array.isArray(body.selectedLegalFrameworkIds)) {
    return;
  }

  body.selectedLegalFrameworkIds.forEach((id) => {
    if (!String(id ?? "").trim()) {
      return;
    }

    assertInScope(scopedSnapshot.legalFrameworks ?? [], id, "Propis nije dostupan za odabranu organizaciju.");
  });
}

function assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body = {}, fieldName = "linkedTemplateIds") {
  if (!Array.isArray(body[fieldName])) {
    return;
  }

  body[fieldName].forEach((id) => {
    if (!String(id ?? "").trim()) {
      return;
    }

    assertInScope(scopedSnapshot.documentTemplates ?? [], id, "Template nije dostupan za odabranu organizaciju.");
  });
}

function assertContractTemplatePayloadInScope(scopedSnapshot, body = {}) {
  if (!body.templateId) {
    return;
  }

  assertInScope(scopedSnapshot.contractTemplates ?? [], body.templateId, "Template ugovora nije dostupan za odabranu organizaciju.");
}

function assertOfferIdsPayloadInScope(scopedSnapshot, body = {}, fieldName = "linkedOfferIds") {
  if (!Array.isArray(body[fieldName])) {
    return;
  }

  body[fieldName].forEach((id) => {
    if (!String(id ?? "").trim()) {
      return;
    }

    assertInScope(scopedSnapshot.offers ?? [], id, "Ponuda nije dostupna za odabranu organizaciju.");
  });
}

function assertServiceCatalogIdsPayloadInScope(scopedSnapshot, body = {}) {
  if (!Array.isArray(body.serviceItems)) {
    return;
  }

  body.serviceItems.forEach((item) => {
    const serviceId = String(item?.serviceId ?? item?.id ?? "").trim();
    if (!serviceId) {
      return;
    }

    assertInScope(scopedSnapshot.serviceCatalog ?? [], serviceId, "Usluga nije dostupna za odabranu organizaciju.");
  });
}

function assertWorkOrderPayloadInScope(scopedSnapshot, body = {}) {
  if (!body.workOrderId) {
    return;
  }

  assertInScope(scopedSnapshot.workOrders, body.workOrderId, "Radni nalog nije dostupan za odabranu organizaciju.");
}

function normalizeInputValue(value) {
  return String(value ?? "").trim();
}

async function convertWordTemplateReferenceToHtml(referenceDocument = {}) {
  if (!referenceDocument || typeof referenceDocument !== "object") {
    throw new Error("Priloži Word dokument za konverziju.");
  }
  if (!isWordTemplateFile(referenceDocument)) {
    throw new Error("Word predložak mora biti .docx ili .dotx datoteka.");
  }

  const storedDocument = await readStoredDocumentBuffer(referenceDocument);
  if (!Buffer.isBuffer(storedDocument.buffer) || storedDocument.buffer.length === 0) {
    throw new Error("Word dokument je prazan ili nije dostupan.");
  }
  if (storedDocument.buffer.length > DOCUMENT_TEMPLATE_WORD_HTML_MAX_BYTES) {
    throw new Error(`Word dokument je prevelik za konverziju (${Math.round(DOCUMENT_TEMPLATE_WORD_HTML_MAX_BYTES / 1024 / 1024)} MB max).`);
  }

  return await convertWordBufferToHtmlTemplate(storedDocument.buffer, {
    fileName: referenceDocument.fileName || referenceDocument.name || "word-template.docx",
  });
}

function normalizeLookupKey(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä‘/g, "d")
    .replace(/[^a-z0-9]+/g, "");
}

function readDataUrlBuffer(dataUrl = "") {
  const meta = getOpenAiDataUrlMeta(dataUrl);
  if (!meta) {
    return Buffer.alloc(0);
  }

  return meta.isBase64
    ? Buffer.from(meta.payload, "base64")
    : Buffer.from(decodeURIComponent(meta.payload), "utf8");
}

function normalizePersonTrainingImportDate(value = "") {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const raw = normalizeInputValue(value);
  if (!raw) {
    return "";
  }

  const croatianMatch = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (croatianMatch) {
    const [, day, month, year] = croatianMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return normalizeDateOnlyValue(raw);
}

function getImportRowValue(row = {}, hints = []) {
  const entries = Object.entries(row ?? {});
  const normalizedHints = hints.map((hint) => normalizeLookupKey(hint)).filter(Boolean);
  const exactMatch = entries.find(([key]) => normalizedHints.includes(normalizeLookupKey(key)));

  if (exactMatch) {
    return exactMatch[1];
  }

  const partialMatch = entries.find(([key]) => {
    const normalizedKey = normalizeLookupKey(key);
    return normalizedHints.some((hint) => normalizedKey.includes(hint) || hint.includes(normalizedKey));
  });

  return partialMatch?.[1] ?? "";
}

const PERSON_TRAINING_IMPORT_KEY_HINTS = Object.freeze({
  safe_work: ["znr", "radnasiguran", "radnasigurannacin", "siguranrad"],
  fire_initial: ["pozar", "pocetnogasenje", "gasenjepozara", "ppz"],
  flammable_storage: ["zapaljiv", "skladistenje", "tekucina", "plin"],
  adr: ["adr"],
  medical_exam: ["lijecnicki", "liječnički", "medicinski", "pregled"],
  professional_training: ["strucno", "stručno", "certifikat", "osposobljavanje"],
});

function getPersonTrainingImportTypeOptions(scopedSnapshot = {}) {
  const serviceOptions = (scopedSnapshot.serviceCatalog ?? [])
    .filter((service) => String(service.serviceType || "").toLowerCase() === "znr" || service.isTraining)
    .map((service) => ({
      value: String(service.serviceCode || service.id || service.name || "").trim().toLowerCase(),
      label: service.name || service.serviceCode || "Osposobljavanje",
      shortLabel: service.serviceCode || "",
      serviceId: String(service.id || ""),
      serviceName: service.name || "",
      serviceCode: service.serviceCode || "",
    }))
    .filter((option) => option.value);

  const byValue = new Map();
  [...PERSON_TRAINING_TYPE_OPTIONS, ...serviceOptions].forEach((option) => {
    const key = String(option.value || "").trim().toLowerCase();
    if (key && !byValue.has(key)) {
      byValue.set(key, option);
    }
  });
  return Array.from(byValue.values());
}

function buildTrainingItemsFromImportRow(row = {}, typeOptions = PERSON_TRAINING_TYPE_OPTIONS) {
  const normalizedEntries = Object.entries(row ?? {}).map(([key, value]) => ({
    key,
    lookupKey: normalizeLookupKey(key),
    value: normalizeInputValue(value),
  }));

  return typeOptions.map((typeOption) => {
    const typeHints = PERSON_TRAINING_IMPORT_KEY_HINTS[typeOption.value] ?? [
      typeOption.value,
      typeOption.label,
      typeOption.shortLabel,
      typeOption.serviceCode,
      typeOption.serviceName,
    ];
    const normalizedHints = typeHints.map((hint) => normalizeLookupKey(hint));
    const relatedEntries = normalizedEntries.filter((entry) => (
      normalizedHints.some((hint) => entry.lookupKey.includes(hint))
    ));
    const item = {
      type: typeOption.value,
      label: typeOption.label,
      shortLabel: typeOption.shortLabel,
      serviceId: typeOption.serviceId || "",
      serviceName: typeOption.serviceName || "",
      serviceCode: typeOption.serviceCode || "",
      issuedOn: "",
      validUntil: "",
      validForever: false,
      certificateNumber: "",
      provider: "",
      note: "",
    };

    relatedEntries.forEach((entry) => {
      if (!entry.value) {
        return;
      }
      const dateValue = normalizePersonTrainingImportDate(entry.value);
      if (/(trajno|bezisteka|forever|permanent)/.test(entry.lookupKey)) {
        item.validForever = /^(1|true|da|yes|trajno|bez isteka)$/i.test(entry.value);
        if (item.validForever) {
          item.validUntil = "";
        }
        return;
      }
      if (/(vrijed|vaz|valid|rok|istek|do$|until|expires)/.test(entry.lookupKey)) {
        item.validUntil = dateValue || item.validUntil;
        return;
      }
      if (/(datum|izdan|poloz|od$|issued|date)/.test(entry.lookupKey)) {
        item.issuedOn = dateValue || item.issuedOn;
        return;
      }
      if (/(broj|potvrd|uvjeren|cert|number)/.test(entry.lookupKey)) {
        item.certificateNumber = entry.value;
        return;
      }
      if (/(ustanova|provider|organizator|predavac|doctor|ordinacija)/.test(entry.lookupKey)) {
        item.provider = entry.value;
        return;
      }
      if (dateValue && !item.validUntil) {
        item.validUntil = dateValue;
        return;
      }
      if (!item.note) {
        item.note = entry.value;
      }
    });

    return item;
  });
}

function readPeopleTrainingImportDetailRows(workbook = {}) {
  const detailSheetName = (workbook.SheetNames ?? []).find((name) => normalizeLookupKey(name).includes("detalj"));
  if (!detailSheetName) {
    return [];
  }
  return XLSX.utils.sheet_to_json(workbook.Sheets[detailSheetName], {
    defval: "",
    raw: false,
  });
}

function buildPeopleTrainingImportDetailFromRow(row = {}) {
  return {
    oib: normalizeInputValue(getImportRowValue(row, ["oib osobe", "oib"])),
    fullName: normalizeInputValue(getImportRowValue(row, ["ime i prezime", "osoba"])),
    workOrderNumber: normalizeInputValue(getImportRowValue(row, ["broj rn", "rn", "radni nalog"])),
    serviceCode: normalizeInputValue(getImportRowValue(row, ["sifra usluge", "šifra usluge", "Ĺˇifra usluge", "usluga"])),
    recordNumber: normalizeInputValue(getImportRowValue(row, ["broj zapisnika", "broj potvrde", "broj uvjerenja"])),
    jobTitle: normalizeInputValue(getImportRowValue(row, ["naziv radnog mjesta", "radno mjesto"])),
    jobDescription: normalizeInputValue(getImportRowValue(row, ["opis poslova i aktivnosti", "opis poslova", "aktivnosti"])),
    theoryPlace: normalizeInputValue(getImportRowValue(row, [
      "mjesto provodenja osposobljavanja radnika teorijsko",
      "mjesto provođenja osposobljavanja radnika teorijsko",
      "mjesto provoÄ‘enja teorijsko",
      "mjesto provodenja teorijsko",
      "teorijsko",
    ])),
    theoryDate: normalizePersonTrainingImportDate(getImportRowValue(row, ["datum teorijski dio", "datum teorije", "teorijski datum"])),
    theoryMethod: normalizeInputValue(getImportRowValue(row, [
      "nacin provodenja teorijskog dijela",
      "način provođenja teorijskog dijela",
      "naÄŤin provoÄ‘enja teorijskog dijela",
      "nacin teorije",
    ])),
    employerRepresentativeName: normalizeInputValue(getImportRowValue(row, [
      "ime i prezime poslodavca ovlastenika poslodavca",
      "ime i prezime poslodavca ovlaštenika poslodavca",
      "ime i prezime poslodavca",
      "ovlaĹˇtenika",
      "ovlastenika",
    ])),
    employerRepresentativeOib: normalizeInputValue(getImportRowValue(row, [
      "oib poslodavca ovlastenika poslodavca",
      "oib poslodavca ovlaštenika poslodavca",
      "oib poslodavca",
      "oib ovlaĹˇtenika",
      "oib ovlastenika",
    ])),
    additionalPersonName: normalizeInputValue(getImportRowValue(row, [
      "ostale osobe ukljucene u osposobljavanje ime i prezime",
      "ostale osobe uključene u osposobljavanje ime i prezime",
      "ostale osobe - ime i prezime",
      "ostale osobe ime",
    ])),
    additionalPersonOib: normalizeInputValue(getImportRowValue(row, [
      "ostale osobe ukljucene u osposobljavanje oib",
      "ostale osobe uključene u osposobljavanje oib",
      "ostale osobe - oib",
      "ostale osobe oib",
    ])),
    practicalPlace: normalizeInputValue(getImportRowValue(row, [
      "mjesto provodenja osposobljavanja radnika prakticno",
      "mjesto provođenja osposobljavanja radnika praktično",
      "mjesto provoÄ‘enja praktiÄŤno",
      "mjesto provodenja prakticno",
      "prakticno",
    ])),
    safeWorkPeriodFrom: normalizePersonTrainingImportDate(getImportRowValue(row, [
      "razdoblje pracenja sigurnog nacina rada od",
      "razdoblje praćenja sigurnog načina rada od",
      "razdoblje praÄ‡enja od",
      "razdoblje pracenja od",
    ])),
    safeWorkPeriodTo: normalizePersonTrainingImportDate(getImportRowValue(row, [
      "razdoblje pracenja sigurnog nacina rada do",
      "razdoblje praćenja sigurnog načina rada do",
      "razdoblje praÄ‡enja do",
      "razdoblje pracenja do",
    ])),
    firePassedOn: normalizePersonTrainingImportDate(getImportRowValue(row, ["pgp datum polaganja", "poĹľar datum polaganja", "pozar datum polaganja"])),
    flammablePassedOn: normalizePersonTrainingImportDate(getImportRowValue(row, ["spztp datum polaganja", "zapaljive datum polaganja"])),
    flammableValidUntil: normalizePersonTrainingImportDate(getImportRowValue(row, ["spztp vrijedi do", "zapaljive vrijedi do"])),
    adrPassedOn: normalizePersonTrainingImportDate(getImportRowValue(row, ["adr datum polaganja"])),
    adrValidUntil: normalizePersonTrainingImportDate(getImportRowValue(row, ["adr vrijedi do"])),
    note: normalizeInputValue(getImportRowValue(row, ["napomena osposobljavanja", "napomena", "note"])),
  };
}

function buildPeopleTrainingImportDetailIndex(rows = []) {
  const index = new Map();
  const add = (key, detail) => {
    const normalizedKey = normalizeLookupKey(key);
    if (!normalizedKey) {
      return;
    }
    if (!index.has(normalizedKey)) {
      index.set(normalizedKey, []);
    }
    index.get(normalizedKey).push(detail);
  };

  rows.forEach((row) => {
    const detail = buildPeopleTrainingImportDetailFromRow(row);
    add(detail.oib, detail);
    add(detail.fullName, detail);
  });

  return index;

  rows.forEach((row) => {
    const detail = {
      oib: normalizeInputValue(getImportRowValue(row, ["oib osobe", "oib"])),
      fullName: normalizeInputValue(getImportRowValue(row, ["ime i prezime", "osoba"])),
      workOrderNumber: normalizeInputValue(getImportRowValue(row, ["broj rn", "rn", "radni nalog"])),
      serviceCode: normalizeInputValue(getImportRowValue(row, ["šifra usluge", "sifra usluge", "usluga"])),
      recordNumber: normalizeInputValue(getImportRowValue(row, ["broj zapisnika", "broj potvrde", "broj uvjerenja"])),
      jobTitle: normalizeInputValue(getImportRowValue(row, ["naziv radnog mjesta", "radno mjesto"])),
      jobDescription: normalizeInputValue(getImportRowValue(row, ["opis poslova i aktivnosti", "opis poslova", "aktivnosti"])),
      theoryPlace: normalizeInputValue(getImportRowValue(row, ["mjesto provođenja teorijsko", "mjesto provodenja teorijsko", "teorijsko"])),
      theoryDate: normalizePersonTrainingImportDate(getImportRowValue(row, ["datum teorijski dio", "datum teorije", "teorijski datum"])),
      theoryMethod: normalizeInputValue(getImportRowValue(row, ["način provođenja teorijskog dijela", "nacin provodenja teorijskog dijela", "nacin teorije"])),
      employerRepresentativeName: normalizeInputValue(getImportRowValue(row, ["ime i prezime poslodavca", "ovlaštenika", "ovlastenika"])),
      employerRepresentativeOib: normalizeInputValue(getImportRowValue(row, ["oib poslodavca", "oib ovlaštenika", "oib ovlastenika"])),
      additionalPersonName: normalizeInputValue(getImportRowValue(row, ["ostale osobe - ime i prezime", "ostale osobe ime"])),
      additionalPersonOib: normalizeInputValue(getImportRowValue(row, ["ostale osobe - oib", "ostale osobe oib"])),
      practicalPlace: normalizeInputValue(getImportRowValue(row, ["mjesto provođenja praktično", "mjesto provodenja prakticno", "prakticno"])),
      safeWorkPeriodFrom: normalizePersonTrainingImportDate(getImportRowValue(row, ["razdoblje praćenja od", "razdoblje pracenja od"])),
      safeWorkPeriodTo: normalizePersonTrainingImportDate(getImportRowValue(row, ["razdoblje praćenja do", "razdoblje pracenja do"])),
      firePassedOn: normalizePersonTrainingImportDate(getImportRowValue(row, ["pgp datum polaganja", "požar datum polaganja", "pozar datum polaganja"])),
      flammablePassedOn: normalizePersonTrainingImportDate(getImportRowValue(row, ["spztp datum polaganja", "zapaljive datum polaganja"])),
      flammableValidUntil: normalizePersonTrainingImportDate(getImportRowValue(row, ["spztp vrijedi do", "zapaljive vrijedi do"])),
      adrPassedOn: normalizePersonTrainingImportDate(getImportRowValue(row, ["adr datum polaganja"])),
      adrValidUntil: normalizePersonTrainingImportDate(getImportRowValue(row, ["adr vrijedi do"])),
      note: normalizeInputValue(getImportRowValue(row, ["napomena", "note"])),
    };
    add(detail.oib, detail);
    add(detail.fullName, detail);
  });

  return index;
}

function findPeopleTrainingImportItem(trainingItems = [], detail = {}, fallbackHints = []) {
  const detailHints = [
    detail.serviceCode,
    ...fallbackHints,
  ].map((value) => normalizeLookupKey(value)).filter(Boolean);
  return trainingItems.find((item) => {
    const itemCandidates = [
      item.serviceCode,
      item.shortLabel,
      item.serviceName,
      item.label,
      item.type,
    ].map((value) => normalizeLookupKey(value)).filter(Boolean);
    return detailHints.some((hint) => itemCandidates.some((candidate) => candidate === hint || candidate.includes(hint) || hint.includes(candidate)));
  }) ?? null;
}

function applyPeopleTrainingImportDetails(record = {}, details = []) {
  if (!details.length) {
    return record;
  }
  const trainingItems = Array.isArray(record.trainingItems) ? record.trainingItems.map((item) => ({ ...item })) : [];
  let jobTitle = record.jobTitle;
  let note = record.note;

  details.forEach((detail) => {
    const safeWorkItem = findPeopleTrainingImportItem(
      trainingItems,
      detail,
      detail.serviceCode ? [] : ["znr", "zos", "safe work", "rad na siguran"],
    );
    if (safeWorkItem) {
      safeWorkItem.workOrderNumber = detail.workOrderNumber || safeWorkItem.workOrderNumber || "";
      safeWorkItem.recordNumber = detail.recordNumber || safeWorkItem.recordNumber || "";
      safeWorkItem.certificateNumber = detail.recordNumber || safeWorkItem.certificateNumber || "";
      safeWorkItem.issuedOn = detail.theoryDate || safeWorkItem.issuedOn || safeWorkItem.passedOn || "";
      safeWorkItem.passedOn = safeWorkItem.passedOn || detail.theoryDate || "";
      safeWorkItem.note = detail.note || safeWorkItem.note || "";
      safeWorkItem.details = {
        ...(safeWorkItem.details ?? {}),
        jobTitle: detail.jobTitle || safeWorkItem.details?.jobTitle || "",
        jobDescription: detail.jobDescription || safeWorkItem.details?.jobDescription || "",
        theoryPlace: detail.theoryPlace || safeWorkItem.details?.theoryPlace || "",
        theoryDate: detail.theoryDate || safeWorkItem.details?.theoryDate || "",
        theoryMethod: detail.theoryMethod || safeWorkItem.details?.theoryMethod || "",
        employerRepresentativeName: detail.employerRepresentativeName || safeWorkItem.details?.employerRepresentativeName || "",
        employerRepresentativeOib: detail.employerRepresentativeOib || safeWorkItem.details?.employerRepresentativeOib || "",
        additionalPersonName: detail.additionalPersonName || safeWorkItem.details?.additionalPersonName || "",
        additionalPersonOib: detail.additionalPersonOib || safeWorkItem.details?.additionalPersonOib || "",
        practicalPlace: detail.practicalPlace || safeWorkItem.details?.practicalPlace || "",
        safeWorkPeriodFrom: detail.safeWorkPeriodFrom || safeWorkItem.details?.safeWorkPeriodFrom || "",
        safeWorkPeriodTo: detail.safeWorkPeriodTo || safeWorkItem.details?.safeWorkPeriodTo || "",
      };
    }

    const categoryDetail = { ...detail, serviceCode: "" };
    [
      { item: findPeopleTrainingImportItem(trainingItems, categoryDetail, ["pgp", "pozar", "fire"]), passedOn: detail.firePassedOn },
      { item: findPeopleTrainingImportItem(trainingItems, categoryDetail, ["spztp", "zapaljiv", "flammable"]), passedOn: detail.flammablePassedOn, validUntil: detail.flammableValidUntil },
      { item: findPeopleTrainingImportItem(trainingItems, categoryDetail, ["adr"]), passedOn: detail.adrPassedOn, validUntil: detail.adrValidUntil },
    ].forEach(({ item, passedOn, validUntil }) => {
      if (!item || !passedOn) {
        return;
      }
      item.passedOn = passedOn;
      item.issuedOn = item.issuedOn || passedOn;
      item.validUntil = validUntil || item.validUntil || "";
      item.workOrderNumber = detail.workOrderNumber || item.workOrderNumber || "";
      item.note = detail.note || item.note || "";
    });

    jobTitle = jobTitle || detail.jobTitle;
    note = note || detail.note;
  });

  return {
    ...record,
    jobTitle,
    note,
    trainingItems,
  };
}

function buildPeopleTrainingImportRecords(body = {}, scopedSnapshot = {}) {
  const fileDataUrl = normalizeInputValue(body.dataUrl || body.fileDataUrl || body.contentDataUrl);
  const buffer = readDataUrlBuffer(fileDataUrl);
  if (buffer.length === 0) {
    throw new Error("Excel datoteka za import nije učitana.");
  }

  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });
  const detailIndex = buildPeopleTrainingImportDetailIndex(readPeopleTrainingImportDetailRows(workbook));
  const selectedCompanyId = normalizeInputValue(body.companyId);
  const selectedLocationId = normalizeInputValue(body.locationId);
  const trainingTypeOptions = getPersonTrainingImportTypeOptions(scopedSnapshot);
  const companiesByName = new Map(
    (scopedSnapshot.companies ?? []).flatMap((company) => [
      [normalizeLookupKey(company.name), company],
      [normalizeLookupKey(company.oib), company],
    ]).filter(([key]) => key),
  );
  const locationsByCompanyAndName = new Map(
    (scopedSnapshot.locations ?? []).map((location) => [
      `${String(location.companyId)}:${normalizeLookupKey(location.name)}`,
      location,
    ]),
  );

  return rows.map((row) => {
    const companyHint = getImportRowValue(row, ["tvrtka", "firma", "company", "klijent", "oib tvrtke"]);
    const company = selectedCompanyId
      ? (scopedSnapshot.companies ?? []).find((item) => String(item.id) === String(selectedCompanyId))
      : companiesByName.get(normalizeLookupKey(companyHint));
    if (!company) {
      return null;
    }

    const locationHint = getImportRowValue(row, ["lokacija", "mjesto rada", "objekt", "location"]);
    const location = selectedLocationId
      ? (scopedSnapshot.locations ?? []).find((item) => String(item.id) === String(selectedLocationId))
      : locationsByCompanyAndName.get(`${String(company.id)}:${normalizeLookupKey(locationHint)}`);
    const fullName = normalizeInputValue(getImportRowValue(row, ["ime i prezime", "imeprezime", "osoba", "djelatnik", "radnik"]));
    const firstName = normalizeInputValue(getImportRowValue(row, ["ime", "firstname", "first name"]));
    const lastName = normalizeInputValue(getImportRowValue(row, ["prezime", "lastname", "last name"]));
    const resolvedFullName = fullName || [firstName, lastName].filter(Boolean).join(" ");

    if (!resolvedFullName) {
      return null;
    }

    const record = {
      organizationId: scopedSnapshot.activeOrganizationId,
      companyId: String(company.id),
      locationId: location ? String(location.id) : "",
      firstName: firstName || resolvedFullName.split(/\s+/).slice(0, -1).join(" "),
      lastName: lastName || resolvedFullName.split(/\s+/).slice(-1).join(" "),
      fullName: resolvedFullName,
      oib: normalizeInputValue(getImportRowValue(row, ["oib", "oib osobe", "osobni identifikacijski broj"])),
      fatherName: normalizeInputValue(getImportRowValue(row, ["ime oca", "imeoca", "otac"])),
      language: normalizeInputValue(getImportRowValue(row, ["jezik", "language"])),
      birthDate: normalizePersonTrainingImportDate(getImportRowValue(row, ["datum rođenja", "datum rodenja", "datumrodjenja", "birth date"])),
      birthCountry: normalizeInputValue(getImportRowValue(row, ["država rođenja", "drzava rodenja", "country of birth"])),
      birthPlace: normalizeInputValue(getImportRowValue(row, ["mjesto rođenja", "mjesto rodenja", "place of birth"])),
      arrivalDate: normalizePersonTrainingImportDate(getImportRowValue(row, ["datum dolaska", "arrival date"])),
      workPlace: normalizeInputValue(getImportRowValue(row, ["mjesto rada", "mjestorada", "work place"])),
      activityStatus: normalizeInputValue(getImportRowValue(row, ["aktivnost", "aktivan", "activity"])) || "DA",
      email: normalizeInputValue(getImportRowValue(row, ["email", "e-mail", "mail"])),
      phone: normalizeInputValue(getImportRowValue(row, ["telefon", "mobitel", "phone", "mob"])),
      jobTitle: normalizeInputValue(getImportRowValue(row, ["radno mjesto", "zanimanje", "posao", "job title"])),
      trainingItems: buildTrainingItemsFromImportRow(row, trainingTypeOptions),
      note: normalizeInputValue(getImportRowValue(row, ["napomena", "note"])),
    };
    const inlineDetail = buildPeopleTrainingImportDetailFromRow(row);
    const detailRows = [
      inlineDetail,
      ...Array.from(new Set([
        ...(detailIndex.get(normalizeLookupKey(record.oib)) ?? []),
        ...(detailIndex.get(normalizeLookupKey(record.fullName)) ?? []),
      ])),
    ].filter((detail) => detail && [
      "workOrderNumber",
      "serviceCode",
      "recordNumber",
      "jobTitle",
      "jobDescription",
      "theoryPlace",
      "theoryDate",
      "theoryMethod",
      "employerRepresentativeName",
      "employerRepresentativeOib",
      "additionalPersonName",
      "additionalPersonOib",
      "practicalPlace",
      "safeWorkPeriodFrom",
      "safeWorkPeriodTo",
      "firePassedOn",
      "flammablePassedOn",
      "flammableValidUntil",
      "adrPassedOn",
      "adrValidUntil",
    ].some((field) => normalizeInputValue(detail[field])));
    return applyPeopleTrainingImportDetails(record, detailRows);
  }).filter(Boolean);
}

const PEOPLE_TRAINING_IMPORT_ACTION_LABELS = Object.freeze({
  create: "Novi zaposlenik",
  update: "Promjena podataka",
  departure: "Odlazak",
  skipped: "Preskočeno",
  unchanged: "Bez promjene",
});

const PEOPLE_TRAINING_IMPORT_MODE_LABELS = Object.freeze({
  new: "Import za nove zaposlenike",
  departures: "Import za odlaske",
  changes: "Import za promjene",
});

const PEOPLE_TRAINING_IMPORT_COMPARE_FIELDS = Object.freeze([
  { field: "companyId", label: "Tvrtka" },
  { field: "locationId", label: "Lokacija" },
  { field: "firstName", label: "Ime" },
  { field: "lastName", label: "Prezime" },
  { field: "fatherName", label: "Ime oca" },
  { field: "oib", label: "OIB" },
  { field: "language", label: "Jezik" },
  { field: "birthDate", label: "Datum rođenja" },
  { field: "birthCountry", label: "Država rođenja" },
  { field: "birthPlace", label: "Mjesto rođenja" },
  { field: "arrivalDate", label: "Datum dolaska" },
  { field: "workPlace", label: "Mjesto rada" },
  { field: "activityStatus", label: "Aktivnost" },
  { field: "email", label: "Email" },
  { field: "phone", label: "Mobitel" },
  { field: "jobTitle", label: "Radno mjesto" },
  { field: "note", label: "Napomena" },
]);

function normalizePeopleTrainingImportMode(value = "") {
  const normalized = normalizeInputValue(value).toLowerCase();
  if (["departures", "departure", "leavers", "leaver", "odlasci", "odlazak", "inactive", "out"].includes(normalized)) {
    return "departures";
  }
  if (["changes", "change", "updates", "update", "promjene", "promjena"].includes(normalized)) {
    return "changes";
  }
  return "new";
}

function normalizePeopleTrainingImportRowDecision(value = "") {
  const normalized = normalizeInputValue(value).toLowerCase();
  if (["create", "insert", "add", "new", "unos", "unesi", "dodaj", "import"].includes(normalized)) {
    return "create";
  }
  if (["skip", "skipped", "preskoci", "preskoči", "preskoceno", "preskočeno"].includes(normalized)) {
    return "skipped";
  }
  return "";
}

function getPeopleTrainingImportRowDecision(rowDecisions = {}, rowIndex = 0) {
  if (!rowDecisions || typeof rowDecisions !== "object") {
    return "";
  }

  if (Array.isArray(rowDecisions)) {
    return normalizePeopleTrainingImportRowDecision(rowDecisions[rowIndex] ?? rowDecisions[rowIndex + 1]);
  }

  return normalizePeopleTrainingImportRowDecision(
    rowDecisions[String(rowIndex + 1)]
    ?? rowDecisions[String(rowIndex)]
    ?? rowDecisions[rowIndex + 1]
    ?? rowDecisions[rowIndex],
  );
}

function resolvePeopleTrainingImportCompanyName(record = {}, scopedSnapshot = {}) {
  const company = (scopedSnapshot.companies ?? []).find((item) => String(item.id) === String(record.companyId));
  return normalizeInputValue(record.companyName || company?.name);
}

function resolvePeopleTrainingImportLocationName(record = {}, scopedSnapshot = {}) {
  const location = (scopedSnapshot.locations ?? []).find((item) => String(item.id) === String(record.locationId));
  return normalizeInputValue(record.locationName || location?.name);
}

function summarizePeopleTrainingImportTrainingItem(item = {}) {
  const label = normalizeInputValue(item.shortLabel || item.serviceCode || item.label || item.serviceName || item.type);
  const details = [
    item.issuedOn ? `izdano ${item.issuedOn}` : "",
    item.validUntil ? `vrijedi do ${item.validUntil}` : "",
    item.validForever ? "trajno" : "",
    item.certificateNumber ? `broj ${item.certificateNumber}` : "",
    item.provider ? `ustanova ${item.provider}` : "",
    item.workOrderNumber ? `RN ${item.workOrderNumber}` : "",
  ].filter(Boolean);
  const extraDetails = Object.entries(item.details ?? {})
    .filter(([, value]) => normalizeInputValue(value))
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${normalizeInputValue(value)}`);
  if (!label && details.length === 0 && extraDetails.length === 0) {
    return "";
  }
  return [label, [...details, ...extraDetails].join(", ")].filter(Boolean).join(" - ");
}

function summarizePeopleTrainingImportTrainingItems(items = []) {
  return (items ?? [])
    .map((item) => summarizePeopleTrainingImportTrainingItem(item))
    .filter(Boolean)
    .join("; ");
}

function normalizePeopleTrainingImportComparableValue(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => normalizePeopleTrainingImportComparableValue(item)));
  }
  if (value && typeof value === "object") {
    return JSON.stringify(Object.keys(value).sort().reduce((accumulator, key) => {
      accumulator[key] = normalizePeopleTrainingImportComparableValue(value[key]);
      return accumulator;
    }, {}));
  }
  return normalizeInputValue(value);
}

function getPeopleTrainingImportFieldDisplayValue(record = {}, field = "", scopedSnapshot = {}) {
  if (field === "companyId") {
    return resolvePeopleTrainingImportCompanyName(record, scopedSnapshot) || normalizeInputValue(record.companyId);
  }
  if (field === "locationId") {
    return resolvePeopleTrainingImportLocationName(record, scopedSnapshot) || "Sve lokacije";
  }
  return normalizePeopleTrainingImportComparableValue(record[field]);
}

function buildPeopleTrainingImportFieldChanges(current = {}, next = {}, scopedSnapshot = {}) {
  const changes = PEOPLE_TRAINING_IMPORT_COMPARE_FIELDS
    .map(({ field, label }) => {
      const before = getPeopleTrainingImportFieldDisplayValue(current, field, scopedSnapshot);
      const after = getPeopleTrainingImportFieldDisplayValue(next, field, scopedSnapshot);
      return before === after ? null : {
        field,
        label,
        before: before || "prazno",
        after: after || "prazno",
      };
    })
    .filter(Boolean);

  const beforeTraining = summarizePeopleTrainingImportTrainingItems(current.trainingItems ?? []);
  const afterTraining = summarizePeopleTrainingImportTrainingItems(next.trainingItems ?? []);
  if (beforeTraining !== afterTraining) {
    changes.push({
      field: "trainingItems",
      label: "Osposobljavanja",
      before: beforeTraining || "prazno",
      after: afterTraining || "prazno",
    });
  }

  return changes;
}

function findPeopleTrainingImportExistingRecord(records = [], record = {}) {
  const normalizedOib = normalizeLookupKey(record.oib);
  const normalizedName = normalizeLookupKey(record.fullName);
  return records.find((item) => (
    String(item.companyId) === String(record.companyId)
    && (
      (normalizedOib && normalizeLookupKey(item.oib) === normalizedOib)
      || (!normalizedOib && normalizedName && normalizeLookupKey(item.fullName) === normalizedName)
    )
  )) ?? null;
}

function buildPeopleTrainingImportRowPreview(row = {}, scopedSnapshot = {}, index = 0) {
  const personName = normalizeInputValue(row.nextRecord?.fullName || row.record?.fullName || row.currentRecord?.fullName);
  const oib = normalizeInputValue(row.nextRecord?.oib || row.record?.oib || row.currentRecord?.oib);
  const companyName = resolvePeopleTrainingImportCompanyName(row.nextRecord || row.record || row.currentRecord || {}, scopedSnapshot)
    || resolvePeopleTrainingImportCompanyName(row.currentRecord || {}, scopedSnapshot);
  const locationName = resolvePeopleTrainingImportLocationName(row.nextRecord || row.record || row.currentRecord || {}, scopedSnapshot)
    || resolvePeopleTrainingImportLocationName(row.currentRecord || {}, scopedSnapshot)
    || "Sve lokacije";
  const actionLabel = PEOPLE_TRAINING_IMPORT_ACTION_LABELS[row.action] || row.action;
  return {
    index: index + 1,
    action: row.action,
    actionLabel,
    tone: row.tone,
    canApply: Boolean(row.canApply),
    personName: personName || "Bez imena",
    oib,
    companyName,
    locationName,
    message: row.message || "",
    changes: row.changes ?? [],
    decisionKind: row.decisionKind || "",
    decisionValue: row.decisionValue || "",
    decisionOptions: row.decisionOptions ?? [],
  };
}

function summarizePeopleTrainingImportPlan(rows = [], mode = "new") {
  const totals = {
    total: rows.length,
    create: 0,
    update: 0,
    departure: 0,
    skipped: 0,
    unchanged: 0,
    applicable: 0,
  };

  rows.forEach((row) => {
    if (row.action === "create") totals.create += 1;
    if (row.action === "update") totals.update += 1;
    if (row.action === "departure") totals.departure += 1;
    if (row.action === "skipped") totals.skipped += 1;
    if (row.action === "unchanged") totals.unchanged += 1;
    if (row.canApply) totals.applicable += 1;
  });

  return {
    mode,
    modeLabel: PEOPLE_TRAINING_IMPORT_MODE_LABELS[mode] || PEOPLE_TRAINING_IMPORT_MODE_LABELS.new,
    totals,
  };
}

function buildPeopleTrainingImportPlan(records = [], scopedSnapshot = {}, modeInput = "new", rowDecisions = {}) {
  const mode = normalizePeopleTrainingImportMode(modeInput);
  const currentRecords = [...(scopedSnapshot.peopleTrainingRecords ?? [])];
  const rows = records.map((record, rowIndex) => {
    const existing = findPeopleTrainingImportExistingRecord(currentRecords, record);
    const rowDecision = getPeopleTrainingImportRowDecision(rowDecisions, rowIndex);

    if (mode === "new") {
      if (existing) {
        const changes = buildPeopleTrainingImportFieldChanges(existing, record, scopedSnapshot);
        if (changes.length > 0) {
          return {
            action: "update",
            tone: "info",
            canApply: true,
            record,
            currentRecord: existing,
            existingId: existing.id,
            nextRecord: record,
            message: "Osoba već postoji u evidenciji, ali Excel donosi promjene koje se mogu ažurirati.",
            changes,
          };
        }
        return {
          action: "unchanged",
          tone: "muted",
          canApply: false,
          record,
          currentRecord: existing,
          nextRecord: record,
          message: "Osoba već postoji u evidenciji i Excel ne donosi promjenu.",
          changes,
        };
      }
      return {
        action: "create",
        tone: "success",
        canApply: true,
        record,
        nextRecord: record,
        message: "Dodaje se nova osoba u evidenciju. Nema usporedbe jer osoba još ne postoji.",
        changes: [],
      };
    }

    if (!existing) {
      if (mode === "changes") {
        const createFromChangeImport = rowDecision === "create";
        return {
          action: createFromChangeImport ? "create" : "skipped",
          tone: createFromChangeImport ? "success" : "warning",
          canApply: createFromChangeImport,
          record,
          nextRecord: record,
          decisionKind: "missing-in-changes",
          decisionValue: createFromChangeImport ? "create" : "skipped",
          decisionOptions: [
            { value: "skipped", label: "Preskoči" },
            { value: "create", label: "Unesi" },
          ],
          message: createFromChangeImport
            ? "Osoba nije pronađena u evidenciji, ali označena je za unos kao novi zaposlenik."
            : "Osoba nije pronađena u evidenciji. U importu promjena ostaje preskočena dok ne odabereš Unesi.",
          changes: [],
        };
      }
      return {
        action: "skipped",
        tone: "warning",
        canApply: false,
        record,
        message: mode === "departures"
          ? "Osoba nije pronađena u evidenciji, pa se odlazak ne može označiti."
          : "Osoba nije pronađena u evidenciji, pa se promjena ne može primijeniti.",
        changes: [],
      };
    }

    if (mode === "departures") {
      const nextRecord = {
        activityStatus: "NE",
        note: record.note || existing.note || "",
      };
      const changes = buildPeopleTrainingImportFieldChanges(existing, {
        ...existing,
        ...nextRecord,
      }, scopedSnapshot);
      if (changes.length === 0) {
        return {
          action: "unchanged",
          tone: "muted",
          canApply: false,
          record,
          currentRecord: existing,
          nextRecord,
          message: "Osoba je već označena kao neaktivna/odlazak.",
          changes,
        };
      }
      return {
        action: "departure",
        tone: "danger",
        canApply: true,
        record,
        currentRecord: existing,
        existingId: existing.id,
        nextRecord,
        message: "Označava se odlazak i osoba postaje neaktivna.",
        changes,
      };
    }

    const changes = buildPeopleTrainingImportFieldChanges(existing, record, scopedSnapshot);
    if (changes.length === 0) {
      return {
        action: "unchanged",
        tone: "muted",
        canApply: false,
        record,
        currentRecord: existing,
        nextRecord: record,
        message: "Excel ne donosi promjenu u odnosu na postojeću evidenciju.",
        changes,
      };
    }
    return {
      action: "update",
      tone: "info",
      canApply: true,
      record,
      currentRecord: existing,
      existingId: existing.id,
      nextRecord: record,
      message: "Ažuriraju se podaci osobe iz Excel tablice.",
      changes,
    };
  });

  return {
    ...summarizePeopleTrainingImportPlan(rows, mode),
    rows,
  };
}

function serializePeopleTrainingImportPlan(plan = {}, scopedSnapshot = {}) {
  const rows = (plan.rows ?? []).map((row, index) => buildPeopleTrainingImportRowPreview(row, scopedSnapshot, index));
  return {
    mode: plan.mode || "new",
    modeLabel: plan.modeLabel || PEOPLE_TRAINING_IMPORT_MODE_LABELS.new,
    totals: plan.totals ?? summarizePeopleTrainingImportPlan(rows, plan.mode).totals,
    rows,
  };
}

function findPeopleTrainingServiceForItem(item = {}, scopedSnapshot = {}) {
  const services = scopedSnapshot.serviceCatalog ?? [];
  const serviceId = normalizeInputValue(item.serviceId || item.serviceCatalogId);
  if (serviceId) {
    const match = services.find((service) => String(service.id) === String(serviceId));
    if (match) {
      return match;
    }
  }

  const candidates = [
    item.serviceCode,
    item.serviceName,
    item.label,
    item.type,
  ].map((value) => normalizeLookupKey(value)).filter(Boolean);
  return services.find((service) => {
    if (!(String(service.serviceType || "").toLowerCase() === "znr" || service.isTraining)) {
      return false;
    }
    const serviceKeys = [
      service.serviceCode,
      service.name,
      service.id,
    ].map((value) => normalizeLookupKey(value)).filter(Boolean);
    return candidates.some((candidate) => serviceKeys.includes(candidate));
  }) ?? null;
}

function findPeopleTrainingCompanyTemplateAssignment(record = {}, item = {}, service = {}, scopedSnapshot = {}) {
  const company = findPeopleTrainingTemplateCompany(record, scopedSnapshot) ?? {};
  const assignments = Array.isArray(company.templateAssignments) ? company.templateAssignments : [];
  if (!assignments.length) {
    return null;
  }

  const serviceCandidates = [
    item.serviceId,
    item.serviceCatalogId,
    service.id,
    item.serviceCode,
    service.serviceCode,
    item.shortLabel,
    item.serviceName,
    service.name,
    item.label,
  ].map((value) => normalizeLookupKey(value)).filter(Boolean);

  return assignments.find((assignment) => {
    if (String(assignment?.kind || "") === "is_znr") {
      return serviceCandidates.includes("isznr");
    }
    const assignmentCandidates = [
      assignment?.serviceId,
      assignment?.serviceCode,
      assignment?.serviceName,
    ].map((value) => normalizeLookupKey(value)).filter(Boolean);
    return assignmentCandidates.some((candidate) => serviceCandidates.includes(candidate));
  }) ?? null;
}

function resolvePeopleTrainingCertificateTemplate(record = {}, item = {}, service = {}, scopedSnapshot = {}) {
  const assignment = findPeopleTrainingCompanyTemplateAssignment(record, item, service, scopedSnapshot);
  const assignedTemplate = assignment?.templateId
    ? (scopedSnapshot.documentTemplates ?? []).find((template) => String(template.id) === String(assignment.templateId))
    : null;
  const assignedDocument = assignedTemplate?.referenceDocument;
  if (assignedDocument && isWordTemplateFile(assignedDocument)) {
    return assignedDocument;
  }

  return service?.trainingCertificateTemplate;
}

function formatPeopleTrainingTemplateDate(value = "") {
  return value ? formatOfferDocumentDate(value) : "";
}

function findPeopleTrainingTemplateCompany(record = {}, scopedSnapshot = {}) {
  return (scopedSnapshot.companies ?? []).find((company) => String(company.id) === String(record.companyId))
    ?? null;
}

function findPeopleTrainingTemplateLocation(record = {}, scopedSnapshot = {}) {
  return (scopedSnapshot.locations ?? []).find((location) => String(location.id) === String(record.locationId))
    ?? null;
}

function getPeopleTrainingTemplateItemDate(item = {}) {
  return item.passedOn || item.issuedOn || "";
}

function hasPeopleTrainingTemplateEvidence(item = {}) {
  return Boolean(item?.recordNumber || item?.certificateNumber || item?.issuedOn || item?.passedOn || item?.validUntil);
}

function findPeopleTrainingTemplateItem(record = {}, hints = []) {
  const normalizedHints = hints.map((hint) => normalizeLookupKey(hint)).filter(Boolean);
  if (normalizedHints.length === 0) {
    return null;
  }

  return (record.trainingItems ?? []).find((trainingItem) => {
    const candidates = [
      trainingItem.type,
      trainingItem.label,
      trainingItem.shortLabel,
      trainingItem.serviceCode,
      trainingItem.serviceName,
    ].map((value) => normalizeLookupKey(value)).filter(Boolean);
    return candidates.some((candidate) => normalizedHints.some((hint) => candidate.includes(hint) || hint.includes(candidate)));
  }) ?? null;
}

function buildPeopleTrainingZnrTemplatePlaceholders(record = {}, item = {}, service = {}, scopedSnapshot = {}) {
  const company = findPeopleTrainingTemplateCompany(record, scopedSnapshot) ?? {};
  const location = findPeopleTrainingTemplateLocation(record, scopedSnapshot) ?? {};
  const companyName = record.companyName || company.name || "";
  const companyOib = record.companyOib || company.oib || "";
  const locationName = record.locationName || location.name || "";
  const companyResponsibleName = company.representative || location.representative || "";
  const companyResponsibleOib = company.representativeOib || "";
  const itemDetails = item.details && typeof item.details === "object" ? item.details : {};
  const itemDate = itemDetails.theoryDate || getPeopleTrainingTemplateItemDate(item);
  const itemValidUntil = itemDetails.safeWorkPeriodTo || (item.validForever ? "" : (item.validUntil || ""));
  const itemRecordNumber = item.recordNumber || item.certificateNumber || "";
  const serviceName = item.label || service.name || item.serviceName || "";
  const serviceCode = item.serviceCode || service.serviceCode || item.shortLabel || "";
  const provider = item.provider || "";
  const workPlace = record.workPlace || locationName || company.headquarters || "";
  const adrItem = findPeopleTrainingTemplateItem(record, ["adr"]);
  const pgpItem = findPeopleTrainingTemplateItem(record, ["fire_initial", "pozar", "pocetno gasenje", "ppz", "pgp"]);
  const spztpItem = findPeopleTrainingTemplateItem(record, ["flammable_storage", "zapaljiv", "skladistenje", "spztp"]);

  const fillTrainingSet = (prefix, trainingItem = {}) => {
    const passedOn = getPeopleTrainingTemplateItemDate(trainingItem);
    return {
      [`BrojPotvrde${prefix}`]: trainingItem.recordNumber || trainingItem.certificateNumber || "",
      [`DatumPolaganja${prefix}`]: formatPeopleTrainingTemplateDate(passedOn),
      [`VrijediDo${prefix}`]: trainingItem.validForever ? "" : formatPeopleTrainingTemplateDate(trainingItem.validUntil),
      [`${prefix}Check`]: hasPeopleTrainingTemplateEvidence(trainingItem) ? "X" : "",
    };
  };

  return {
    Tvrtka: companyName,
    Sjediste: company.headquarters || "",
    OIBTvrtka: companyOib,
    OdgovornaOsobaTvrtka: companyResponsibleName,
    OIBOdgovornaOsoba: companyResponsibleOib,
    OsobniBroj: record.employeeNumber || record.personalNumber || "",
    ImePrezime: record.fullName || [record.firstName, record.lastName].filter(Boolean).join(" "),
    ImeOca: record.fatherName || "",
    OIB: record.oib || "",
    Jezik: record.language || "",
    DatumRodenja: formatPeopleTrainingTemplateDate(record.birthDate),
    "DržavaRodenja": record.birthCountry || "",
    DrzavaRodenja: record.birthCountry || "",
    MjestoRodenja: record.birthPlace || "",
    DatumDolaska: formatPeopleTrainingTemplateDate(record.arrivalDate),
    Mjestorada: workPlace,
    MjestoRadaNew: workPlace,
    DodatnoMjesto: location.note || location.region || "",
    Aktivnost: record.activityStatus || serviceName || serviceCode,
    BrojZapisnikaZNR: itemRecordNumber,
    NazivRadnogMjesta: itemDetails.jobTitle || record.jobTitle || "",
    OpisPoslova: itemDetails.jobDescription || record.jobDescription || record.note || "",
    VrstaIspita: serviceName || serviceCode,
    MjestoOsposobljavanjaTeorija: itemDetails.theoryPlace || workPlace,
    DatumTeorija: formatPeopleTrainingTemplateDate(itemDate),
    NacinProvodenjaTeorija: itemDetails.theoryMethod || item.examMode || item.learningTestTitle || item.provider || "",
    ImePrezimeOvlastenik: itemDetails.employerRepresentativeName || provider,
    OIBOvlastenik: itemDetails.employerRepresentativeOib || "",
    OstaloImePrezime: itemDetails.additionalPersonName || "",
    OstaloOIB: itemDetails.additionalPersonOib || "",
    MjestoProvodenjaPrakicno: itemDetails.practicalPlace || workPlace,
    RazdobljeZNROd: formatPeopleTrainingTemplateDate(itemDetails.safeWorkPeriodFrom || itemDate),
    RazdobljeZNRDo: formatPeopleTrainingTemplateDate(itemValidUntil),
    OdgovornaZNRImePrezime: itemDetails.employerRepresentativeName || provider || companyResponsibleName,
    OdgovornaZNROIB: itemDetails.employerRepresentativeOib || "",
    OdgovornaZNRKlasa: "",
    OdgovornaZNRUrbroj: "",
    OdgovornaZNREbroj: "",
    AktivnostOvlastenik: serviceName || serviceCode,
    BrojOdlukeOVL: "",
    DatumOdlukeOVL: "",
    RokOdlukeOVL: "",
    BrojZapisnikaOVL: itemRecordNumber,
    DatumProvodenjaOVL: formatPeopleTrainingTemplateDate(itemDate),
    RokOVL: formatPeopleTrainingTemplateDate(itemValidUntil),
    MjestoOVL: workPlace,
    OdgovornaOVLImePrezime: provider || companyResponsibleName,
    OdgovornaOVLOIB: "",
    OdgovornaOVLKlasa: "",
    OdgovornaOVLUrbroj: "",
    OdgovornaOVLEbroj: "",
    AktivnostEv: serviceName || serviceCode,
    BrojOdlukeEv: "",
    DatumOdlukeEv: "",
    RokOdlukeEv: "",
    BrojZapisnikaEv: itemRecordNumber,
    DatumZapisnikaEv: formatPeopleTrainingTemplateDate(itemDate),
    RokZapisnikaEv: formatPeopleTrainingTemplateDate(itemValidUntil),
    OdgovornaEvImePrezime: provider || companyResponsibleName,
    OdgovornaEvOIB: "",
    OdgovornaEvKlasa: "",
    OdgovornaEvEbroj: "",
    AktivnostPP: pgpItem?.label || "",
    DatumPP: formatPeopleTrainingTemplateDate(getPeopleTrainingTemplateItemDate(pgpItem ?? {})),
    BrojZapisnikaPGP: pgpItem?.recordNumber || pgpItem?.certificateNumber || "",
    DatumPolaganjaPGP: formatPeopleTrainingTemplateDate(getPeopleTrainingTemplateItemDate(pgpItem ?? {})),
    PGPCheck: hasPeopleTrainingTemplateEvidence(pgpItem ?? {}) ? "X" : "",
    OdgovornaPGPImePrezime: pgpItem?.provider || provider || companyResponsibleName,
    OdgovornaPGPOIB: "",
    OdgovornaPGPKlasa: "",
    ...fillTrainingSet("ADR", adrItem ?? {}),
    OdgovornaADRImePrezime: adrItem?.provider || provider || companyResponsibleName,
    OdgovornaADROIB: "",
    OdgovornaADRKlasa: "",
    ...fillTrainingSet("SPZTP", spztpItem ?? {}),
    OdgovornaSPZTPImePrezime: spztpItem?.provider || provider || companyResponsibleName,
    OdgovornaSPZTPOIB: "",
    OdgovornaSPZTPKlasa: "",
  };
}

function getPeopleTrainingCertificatePlaceholderPayload(record = {}, item = {}, service = {}, scopedSnapshot = {}) {
  const passedOrIssued = item.passedOn || item.issuedOn || "";
  const sourceText = item.workOrderNumber
    ? `RN ${item.workOrderNumber}`
    : (item.learningTestTitle || item.provider || item.examMode || "");
  return {
    ...buildPeopleTrainingZnrTemplatePlaceholders(record, item, service, scopedSnapshot),
    IME: record.firstName || "",
    PREZIME: record.lastName || "",
    IME_PREZIME: record.fullName || [record.firstName, record.lastName].filter(Boolean).join(" "),
    OIB: record.oib || "",
    RADNO_MJESTO: record.jobTitle || "",
    EMAIL: record.email || "",
    MOBITEL: record.phone || "",
    TVRTKA: record.companyName || "",
    TVRTKA_OIB: record.companyOib || "",
    KLIJENT: record.companyName || "",
    LOKACIJA: record.locationName || "Sve lokacije",
    USLUGA: item.label || service.name || item.serviceName || "",
    SIFRA_USLUGE: item.serviceCode || service.serviceCode || item.shortLabel || "",
    IZVOR_POLAGANJA: sourceText,
    POTVRDA_BROJ: item.recordNumber || item.certificateNumber || "",
    DATUM_POLAGANJA: passedOrIssued ? formatOfferDocumentDate(passedOrIssued) : "",
    DATUM_IZDAVANJA: item.issuedOn ? formatOfferDocumentDate(item.issuedOn) : (passedOrIssued ? formatOfferDocumentDate(passedOrIssued) : ""),
    VRIJEDI_DO: item.validForever ? "" : (item.validUntil ? formatOfferDocumentDate(item.validUntil) : ""),
    VRIJEDI_TRAJNO: item.validForever ? "Vrijedi trajno" : "",
    RN_BROJ: item.workOrderNumber || "",
    ONLINE_IZVOR: item.learningTestTitle || item.provider || "",
    USTANOVA: item.provider || "",
    STATUS_UVJERENJA: item.certificateStatus || "",
    NAPOMENA: item.note || record.note || "",
  };
}

function getPeopleTrainingGeneratedDocumentKey(item = {}, service = {}) {
  return normalizeInputValue(
    item.serviceId
    || service.id
    || item.type
    || item.serviceCode
    || service.serviceCode
    || item.shortLabel
    || service.name,
  ).toLowerCase();
}

function getPeopleTrainingGeneratedDocumentFingerprint(record = {}, item = {}, service = {}) {
  return [
    getPeopleTrainingGeneratedDocumentKey(item, service),
    item.recordNumber || "",
    item.certificateNumber || "",
    item.workOrderNumber || "",
    item.issuedOn || "",
    item.passedOn || "",
    item.validUntil || "",
    item.validForever ? "forever" : "",
    record.oib || "",
  ].map((value) => normalizeInputValue(value)).join("|");
}

function isPeopleTrainingGeneratedDocument(attachment = {}) {
  return String(attachment.sourceType || "") === GENERATED_PEOPLE_TRAINING_CERTIFICATE_SOURCE
    || String(attachment.documentCategory || "").trim() === GENERATED_PEOPLE_TRAINING_CERTIFICATE_CATEGORY;
}

function isPeopleTrainingGeneratedDocumentActive(attachment = {}) {
  return isPeopleTrainingGeneratedDocument(attachment)
    && attachment.activeDocument !== false
    && attachment.isActive !== false
    && String(attachment.documentStatus || "").toLowerCase() !== "archived";
}

function peopleTrainingGeneratedDocumentMatchesItem(attachment = {}, item = {}, service = {}) {
  if (!isPeopleTrainingGeneratedDocument(attachment)) {
    return false;
  }

  const key = getPeopleTrainingGeneratedDocumentKey(item, service);
  if (key && String(attachment.generatedDocumentKey || "").toLowerCase() === key) {
    return true;
  }

  const lookupParts = [
    item.type,
    item.serviceId,
    service.id,
    item.serviceCode,
    service.serviceCode,
    item.shortLabel,
  ].map((value) => normalizeInputValue(value).toLowerCase()).filter(Boolean);
  if (lookupParts.length === 0) {
    return false;
  }

  const haystack = [
    attachment.id,
    attachment.trainingItemType,
    attachment.trainingServiceId,
    attachment.trainingServiceCode,
    attachment.fileName,
    attachment.description,
  ].map((value) => normalizeInputValue(value).toLowerCase()).join(" ");
  return lookupParts.some((part) => haystack.includes(part));
}

function getActivePeopleTrainingGeneratedDocument(record = {}, item = {}, service = {}) {
  return (record.attachments ?? []).find((attachment) => (
    isPeopleTrainingGeneratedDocumentActive(attachment)
    && peopleTrainingGeneratedDocumentMatchesItem(attachment, item, service)
  )) ?? null;
}

function shouldGeneratePeopleTrainingCertificate(record = {}, item = {}, service = {}, { force = false } = {}) {
  if (force) {
    return true;
  }

  const activeDocument = getActivePeopleTrainingGeneratedDocument(record, item, service);
  if (!activeDocument) {
    return true;
  }

  return String(activeDocument.documentFingerprint || "") !== getPeopleTrainingGeneratedDocumentFingerprint(record, item, service);
}

async function generatePeopleTrainingCertificateAttachments(record = {}, scopedSnapshot = {}, options = {}) {
  const requestedTrainingType = normalizeInputValue(options.trainingType).toLowerCase();
  const requestedServiceId = normalizeInputValue(options.serviceId);
  const force = options.force === true;
  let nextAttachments = Array.isArray(record.attachments) ? [...record.attachments] : [];
  const nextTrainingItems = (record.trainingItems ?? []).map((item) => ({ ...item }));
  let changed = false;
  const generatedDocuments = [];

  for (const item of nextTrainingItems) {
    if (
      requestedTrainingType
      && String(item.type || "").toLowerCase() !== requestedTrainingType
      && String(item.shortLabel || "").toLowerCase() !== requestedTrainingType
      && String(item.serviceCode || "").toLowerCase() !== requestedTrainingType
    ) {
      continue;
    }
    if (requestedServiceId && String(item.serviceId || "") !== requestedServiceId) {
      continue;
    }

    const hasEvidence = Boolean(
      item.certificateNumber
      || item.recordNumber
      || item.workOrderNumber
      || item.issuedOn
      || item.passedOn
      || item.validUntil
      || Object.values(item.details ?? {}).some((value) => normalizeInputValue(value)),
    );
    if (!hasEvidence && !force) {
      continue;
    }

    const service = findPeopleTrainingServiceForItem(item, scopedSnapshot) ?? {};
    const template = resolvePeopleTrainingCertificateTemplate(record, item, service, scopedSnapshot);
    if (!template || !isWordTemplateFile(template)) {
      continue;
    }

    if (!shouldGeneratePeopleTrainingCertificate(record, item, service, { force })) {
      continue;
    }

    try {
      const referenceDocument = await readStoredDocumentBuffer(template);
      const generatedDocumentKey = getPeopleTrainingGeneratedDocumentKey(item, service);
      const documentFingerprint = getPeopleTrainingGeneratedDocumentFingerprint(record, item, service);
      const baseName = sanitizeGeneratedDocumentFileName(
        [
          "uvjerenje",
          record.fullName || "osoba",
          item.serviceCode || service.serviceCode || item.shortLabel || "osposobljavanje",
        ].filter(Boolean).join("-"),
        { fallback: "uvjerenje", extension: "docx" },
      );
      const pdfBuffer = await buildPdfFromTemplateBuffer(
        referenceDocument.buffer,
        getPeopleTrainingCertificatePlaceholderPayload(record, item, service, scopedSnapshot),
        { fileName: baseName },
      );
      const nowIso = new Date().toISOString();
      nextAttachments = nextAttachments.map((attachment) => {
        if (!peopleTrainingGeneratedDocumentMatchesItem(attachment, item, service) || !isPeopleTrainingGeneratedDocumentActive(attachment)) {
          return attachment;
        }

        return {
          ...attachment,
          activeDocument: false,
          isActive: false,
          documentStatus: "archived",
          supersededAt: nowIso,
          updatedAt: nowIso,
        };
      });

      const documentId = `certificate-${generatedDocumentKey || item.type || service.id || randomUUID()}-${randomUUID()}`;
      nextAttachments.push({
        id: documentId,
        fileName: sanitizeGeneratedDocumentFileName(baseName, { fallback: "uvjerenje", extension: "pdf" }),
        fileType: "application/pdf",
        fileSize: pdfBuffer.length,
        documentCategory: GENERATED_PEOPLE_TRAINING_CERTIFICATE_CATEGORY,
        sourceType: GENERATED_PEOPLE_TRAINING_CERTIFICATE_SOURCE,
        activeDocument: true,
        isActive: true,
        documentStatus: "active",
        generatedDocumentKey,
        documentFingerprint,
        trainingItemType: item.type || "",
        trainingServiceId: item.serviceId || service.id || "",
        trainingServiceCode: item.serviceCode || service.serviceCode || item.shortLabel || "",
        trainingRecordNumber: item.recordNumber || "",
        trainingCertificateNumber: item.certificateNumber || "",
        trainingWorkOrderNumber: item.workOrderNumber || "",
        trainingIssuedOn: item.issuedOn || "",
        trainingPassedOn: item.passedOn || "",
        trainingValidUntil: item.validForever ? "" : (item.validUntil || ""),
        description: `Automatski PDF za ${item.label || service.name || "osposobljavanje"}.`,
        dataUrl: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      item.certificateDocumentId = documentId;
      item.certificateStatus = "ready";
      generatedDocuments.push({ id: documentId, type: item.type || "", serviceId: item.serviceId || "", fileName: baseName });
      changed = true;
    } catch (error) {
      console.warn(`People training certificate PDF failed for record ${record.id}: ${error?.message || error}`);
    }
  }

  return changed ? { attachments: nextAttachments, trainingItems: nextTrainingItems, generatedDocuments } : null;
}

async function persistPeopleTrainingCertificates(record = {}, scopedSnapshot = {}, options = {}) {
  const generated = await generatePeopleTrainingCertificateAttachments(record, scopedSnapshot, options);
  if (!generated || !record.id) {
    return record;
  }
  if (options.summary && typeof options.summary === "object") {
    options.summary.generatedDocuments = generated.generatedDocuments ?? [];
    options.summary.generatedCount = generated.generatedDocuments?.length ?? 0;
  }
  return await domainRepository.updatePersonTrainingRecord(record.id, {
    attachments: generated.attachments,
    trainingItems: generated.trainingItems,
  }) ?? record;
}

function getScopedUserDisplayLabel(userLike = {}) {
  return String(
    userLike.fullName
    || [userLike.firstName, userLike.lastName].filter(Boolean).join(" ")
    || userLike.email
    || userLike.username
    || "User",
  ).trim() || "User";
}

function canManageAbsenceEntry(user, entry = {}) {
  if (canManageMasterData(user)) {
    return true;
  }

  const actorId = String(user?.id ?? "");
  return Boolean(actorId) && (
    String(entry.userId ?? "") === actorId
    || String(entry.requestedByUserId ?? "") === actorId
  );
}

function resolveAssignedUserPayload(scopedSnapshot, body = {}) {
  if (!Object.prototype.hasOwnProperty.call(body, "assignedToUserId")) {
    return {};
  }

  const assignedToUserId = String(body.assignedToUserId ?? "").trim();

  if (!assignedToUserId) {
    return {
      assignedToUserId: "",
      assignedToLabel: "",
    };
  }

  const assignedUser = assertInScope(
    scopedSnapshot.users,
    assignedToUserId,
    "Odabrani kolega nije dostupan za aktivnu organizaciju.",
  );

  return {
    assignedToUserId: String(assignedUser.id),
    assignedToLabel: assignedUser.fullName || assignedUser.email || assignedUser.username || "User",
  };
}

function resolveTodoInvitedUsersPayload(scopedSnapshot, body = {}) {
  const hasInvitedUserIds = Object.prototype.hasOwnProperty.call(body, "invitedUserIds");

  if (!hasInvitedUserIds) {
    return {};
  }

  const requestedIds = Array.isArray(body.invitedUserIds)
    ? body.invitedUserIds
    : [body.invitedUserIds];
  const invitedUserIds = Array.from(new Set(
    requestedIds.map((value) => normalizeInputValue(value)).filter(Boolean),
  ));

  if (invitedUserIds.length === 0) {
    return {
      invitedUserIds: [],
      invitedUserLabels: [],
    };
  }

  const invitedUsers = invitedUserIds.map((userId) => assertInScope(
    scopedSnapshot.users,
    userId,
    "Pozvani kolega nije dostupan za aktivnu organizaciju.",
  ));

  return {
    invitedUserIds: invitedUsers.map((user) => String(user.id)),
    invitedUserLabels: invitedUsers.map((user) => user.fullName || user.email || user.username || "User"),
  };
}

function resolveVehicleReservationUserPayload(scopedSnapshot, body = {}) {
  const hasUserIds = Object.prototype.hasOwnProperty.call(body, "reservedForUserIds");
  const hasLabels = Object.prototype.hasOwnProperty.call(body, "reservedForLabels");
  const hasUserId = Object.prototype.hasOwnProperty.call(body, "reservedForUserId");
  const hasLabel = Object.prototype.hasOwnProperty.call(body, "reservedForLabel");

  if (!hasUserIds && !hasLabels && !hasUserId && !hasLabel) {
    return {};
  }

  if (hasUserIds || hasLabels) {
    const requestedUserIds = Array.isArray(body.reservedForUserIds)
      ? body.reservedForUserIds.map((value) => normalizeInputValue(value)).filter(Boolean)
      : [normalizeInputValue(body.reservedForUserId)].filter(Boolean);
    const uniqueUserIds = Array.from(new Set(requestedUserIds));

    if (uniqueUserIds.length === 0) {
      return {
        reservedForUserIds: [],
        reservedForLabels: hasLabels && Array.isArray(body.reservedForLabels)
          ? body.reservedForLabels.map((value) => normalizeInputValue(value)).filter(Boolean)
          : [],
        reservedForUserId: "",
        reservedForLabel: "",
      };
    }

    const resolvedUsers = uniqueUserIds.map((userId) => assertInScope(
      scopedSnapshot.users,
      userId,
      "Odabrani kolega nije dostupan za aktivnu organizaciju.",
    ));
    const reservedForLabels = resolvedUsers.map((user) => user.fullName || user.email || user.username || "User");

    return {
      reservedForUserIds: resolvedUsers.map((user) => String(user.id)),
      reservedForLabels,
      reservedForUserId: String(resolvedUsers[0]?.id ?? ""),
      reservedForLabel: reservedForLabels.join(", "),
    };
  }

  const reservedForUserId = normalizeInputValue(body.reservedForUserId);

  if (!reservedForUserId) {
    return {
      reservedForUserIds: [],
      reservedForLabels: [],
      reservedForUserId: "",
      reservedForLabel: hasLabel ? normalizeInputValue(body.reservedForLabel) : "",
    };
  }

  const reservedUser = assertInScope(
    scopedSnapshot.users,
    reservedForUserId,
    "Odabrani kolega nije dostupan za aktivnu organizaciju.",
  );

  return {
    reservedForUserIds: [String(reservedUser.id)],
    reservedForLabels: [reservedUser.fullName || reservedUser.email || reservedUser.username || "User"],
    reservedForUserId: String(reservedUser.id),
    reservedForLabel: reservedUser.fullName || reservedUser.email || reservedUser.username || "User",
  };
}

async function writeSnapshot(response, user, request, statusCode = 200) {
  if (!isSnapshotCacheableRequest(request)) {
    invalidateSnapshotCaches();
  }

  const { scopedSnapshot } = await getScopedState(user, request);
  sendJson(response, statusCode, {
    storage: domainRepository.kind,
    user,
    ...scopedSnapshot,
  });
}

function buildChatUsers(users = []) {
  return (users ?? []).map((entry) => ({
    id: String(entry.id ?? ""),
    fullName: String(entry.fullName ?? [entry.firstName, entry.lastName].filter(Boolean).join(" ")),
    email: String(entry.email ?? ""),
    avatarDataUrl: String(entry.avatarDataUrl ?? ""),
    role: String(entry.role ?? "user"),
    isActive: entry.isActive !== false,
  })).filter((entry) => entry.id);
}

async function getScopedChatContext(user, request) {
  const { scopedSnapshot } = await getScopedState(user, request);
  return {
    organizationId: String(scopedSnapshot.activeOrganizationId ?? ""),
    users: buildChatUsers(scopedSnapshot.users),
  };
}

function resolveChatActiveConversationId(url, explicitValue = "") {
  return normalizeInputValue(
    explicitValue || url.searchParams.get("activeConversationId") || "",
  );
}

async function writeChatSnapshot(response, user, request, url, statusCode = 200, activeConversationId = "") {
  const { organizationId, users } = await getScopedChatContext(user, request);
  sendJson(response, statusCode, await liveChatStore.getSnapshot({
    organizationId,
    currentUser: user,
    users,
    activeConversationId: resolveChatActiveConversationId(url, activeConversationId),
  }));
}

async function handleEntityMutation(response, user, request, handler, statusCode = 200) {
  await handler();
  await writeSnapshot(response, user, request, statusCode);
}

async function handleApiRequest(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        storage: domainRepository.kind,
        objectStorage: {
          enabled: Boolean(domainRepository.objectStorage?.enabled),
          provider: domainRepository.objectStorage?.provider ?? "",
          bucket: domainRepository.objectStorage?.bucket ?? "",
          region: domainRepository.objectStorage?.region ?? "",
        },
      });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/login-content") {
      const content = await tenantRepository.getPublicLoginScreen();
      sendJson(response, 200, content);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/session") {
      const user = await getRequestUser(request, response);
      sendJson(response, 200, {
        authenticated: Boolean(user),
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readJsonBody(request);
      const user = await tenantRepository.authenticateUser(body.email ?? body.username, body.password);

      if (!user) {
        sendError(response, 401, "Neispravan email ili lozinka.");
        return true;
      }

      const accessToken = createAccessToken(user, jwtSecret);
      const refreshToken = createRefreshToken(user, jwtSecret);

      await tenantRepository.storeRefreshToken(user, refreshToken, {
        ipAddress: getClientIp(request),
        userAgent: request.headers["user-agent"] ?? "",
      });

      appendResponseCookies(response, createAuthCookies({
        accessToken,
        refreshToken,
        secure: shouldUseSecureCookies(request),
        domain: resolveAuthCookieDomain(request),
      }));

      sendJson(response, 200, {
        authenticated: true,
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/forgot-password") {
      const body = await readJsonBody(request);
      const result = await tenantRepository.requestPasswordReset(body.email);
      sendJson(response, 200, {
        ok: true,
        delivered: Boolean(result?.delivered),
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/signup") {
      const body = await readJsonBody(request);
      const result = await tenantRepository.submitSignupRequest(body);
      sendJson(response, 201, result);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/refresh") {
      const user = await getRequestUser(request, response);

      if (!user) {
        sendError(response, 401, "Prijava je istekla.");
        return true;
      }

      sendJson(response, 200, {
        authenticated: true,
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      const cookies = parseCookies(request.headers.cookie ?? "");
      const token = getRefreshTokenFromCookies(cookies);

      if (token) {
        await tenantRepository.deleteRefreshToken(token);
      }

      appendResponseCookies(response, clearAuthCookies({
        secure: shouldUseSecureCookies(request),
        domain: resolveAuthCookieDomain(request),
      }));
      request[requestUserSymbol] = null;
      sendJson(response, 200, { ok: true });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/public/learning-tests/access") {
      const token = String(url.searchParams.get("token") ?? "").trim();
      if (!token) {
        sendError(response, 400, "Token je obavezan.");
        return true;
      }
      const item = await domainRepository.getLearningAccessByToken(token);
      if (!item) {
        sendError(response, 404, "Pristup testu nije pronađen.");
        return true;
      }
      sendJson(response, 200, { item });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/public/learning-tests/access/start") {
      const body = await readJsonBody(request);
      const token = String(body?.token ?? "").trim();
      if (!token) {
        sendError(response, 400, "Token je obavezan.");
        return true;
      }
      const item = await domainRepository.startLearningTestAccess(token);
      if (!item) {
        sendError(response, 404, "Pristup testu nije pronađen.");
        return true;
      }
      sendJson(response, 200, { item });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/public/learning-tests/access/submit") {
      const body = await readJsonBody(request);
      const token = String(body?.token ?? "").trim();
      if (!token) {
        sendError(response, 400, "Token je obavezan.");
        return true;
      }
      const item = await domainRepository.submitLearningTestAccess(token, body?.answers ?? []);
      if (!item) {
        sendError(response, 404, "Pristup testu nije pronađen.");
        return true;
      }
      sendJson(response, 200, { item });
      return true;
    }

    const user = await getRequestUser(request, response);

    if (!user) {
      sendError(response, 401, "Prijava je potrebna.");
      return true;
    }

    if (user.mustChangePassword && !isPasswordChangeRequiredRequestAllowed(url, request)) {
      sendJson(response, 403, {
        error: "Potrebno je odmah promijeniti privremenu lozinku.",
        requiresPasswordChange: true,
        user,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/change-password") {
      const body = await readJsonBody(request);
      const updatedUser = await tenantRepository.changeOwnPassword(
        user,
        body.newPassword ?? body.password,
      );

      if (!updatedUser) {
        sendError(response, 404, "Korisnik nije pronaÄ‘en.");
        return true;
      }

      appendResponseCookies(response, clearAuthCookies({
        secure: shouldUseSecureCookies(request),
        domain: resolveAuthCookieDomain(request),
      }));
      request[requestUserSymbol] = null;
      sendJson(response, 200, {
        ok: true,
        authenticated: false,
        requiresRelogin: true,
        email: updatedUser.email || user.email || "",
      });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/weather/cities") {
      try {
        sendJson(response, 200, await buildOpenWeatherCitySuggestions(url.searchParams.get("q") || ""));
      } catch (error) {
        sendError(response, Number(error?.statusCode || 502), error?.message || "Pretraga gradova trenutno nije dostupna.");
      }
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/weather") {
      try {
        sendJson(response, 200, await buildOpenWeatherPayload(getOpenWeatherRequestedCities(url)));
      } catch (error) {
        sendError(response, Number(error?.statusCode || 502), error?.message || "Vrijeme trenutno nije dostupno.");
      }
      return true;
    }

    if (request.method === "PATCH" && url.pathname === "/api/auth/profile") {
      const body = await readJsonBody(request);
      const updatedUser = await tenantRepository.updateOwnProfile(user, body);

      if (!updatedUser) {
        sendError(response, 404, "Korisnik nije pronađen.");
        return true;
      }

      request[requestUserSymbol] = updatedUser;
      await writeSnapshot(response, updatedUser, request);
      return true;
    }

    if (request.method === "PATCH" && url.pathname === "/api/auth/profile/report-schedule") {
      const body = await readJsonBody(request);
      const updatedUser = await tenantRepository.updateOwnReportSchedule(user, body);

      if (!updatedUser) {
        sendError(response, 404, "Korisnik nije pronađen.");
        return true;
      }

      request[requestUserSymbol] = updatedUser;
      await writeSnapshot(response, updatedUser, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/profile/report-email") {
      const reportUser = await tenantRepository.getUserById(user.id) ?? user;

      if (!reportUser?.email) {
        sendError(response, 400, "Profil nema email za slanje izvještaja.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(reportUser, request);
      const result = await sendDashboardCalendarProfileReport(reportUser, scopedSnapshot, {
        generatedAt: new Date().toISOString(),
      });

      if (!result.ok) {
        sendError(response, 400, result.error || "Slanje izvještaja nije uspjelo.");
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        message: `PDF izvještaj je poslan na ${reportUser.email}.`,
        fileName: result.fileName,
      });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/ai/openai/status") {
      if (!canUseOpenAiIntegration(user)) {
        sendError(response, 403, "Nemate pravo koristiti AI integraciju.");
        return true;
      }

      sendJson(response, 200, buildOpenAiStatusPayload());
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/ai/openai/prepare") {
      if (!canUseOpenAiIntegration(user)) {
        sendError(response, 403, "Nemate pravo koristiti AI integraciju.");
        return true;
      }

      const body = await readJsonBody(request);
      const config = getOpenAiRuntimeConfig();
      const wantsLiveCall = body?.dryRun === false;
      if (!wantsLiveCall || config.dryRun || !config.liveCallsEnabled) {
        sendJson(response, 200, buildOpenAiDryRunPlan(body, user));
        return true;
      }

      try {
        sendJson(response, 200, await buildOpenAiLivePlan(body, user));
      } catch (error) {
        sendError(response, Number(error?.statusCode || 502), buildOpenAiSafeErrorMessage(error));
      }
      return true;
    }

    if (request.method === "PATCH" && url.pathname === "/api/auth/profile/avatar") {
      const body = await readJsonBody(request);
      const updatedUser = await tenantRepository.updateOwnAvatar(user, body.avatarDataUrl);

      if (!updatedUser) {
        sendError(response, 404, "Korisnik nije pronađen.");
        return true;
      }

      request[requestUserSymbol] = updatedUser;
      await writeSnapshot(response, updatedUser, request);
      return true;
    }

    const organizationMatch = url.pathname.match(/^\/api\/organizations\/([^/]+)$/);
    const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
    const userPasswordResetMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/password-reset$/);
    const loginContentMatch = url.pathname.match(/^\/api\/login-content\/([^/]+)$/);
    const signupRequestActionMatch = url.pathname.match(/^\/api\/signup-requests\/([^/]+)\/(approve|reject)$/);
    const companyMatch = url.pathname.match(/^\/api\/companies\/([^/]+)$/);
    const locationMatch = url.pathname.match(/^\/api\/locations\/([^/]+)$/);
    const dashboardWidgetMatch = url.pathname.match(/^\/api\/dashboard-widgets\/([^/]+)$/);
    const reminderMatch = url.pathname.match(/^\/api\/reminders\/([^/]+)$/);
    const offerMatch = url.pathname.match(/^\/api\/offers\/([^/]+)$/);
    const offerHtmlDraftPreviewMatch = url.pathname === "/api/offers/preview-html-draft";
    const offerHtmlPreviewMatch = url.pathname.match(/^\/api\/offers\/([^/]+)\/preview-html$/);
    const offerPdfDraftExportMatch = url.pathname === "/api/offers/export-pdf-draft";
    const offerPdfExportMatch = url.pathname.match(/^\/api\/offers\/([^/]+)\/export-pdf$/);
    const offerEmailMatch = url.pathname.match(/^\/api\/offers\/([^/]+)\/email$/);
    const purchaseOrderMatch = url.pathname.match(/^\/api\/purchase-orders\/([^/]+)$/);
    const purchaseOrderPdfDraftExportMatch = url.pathname === "/api/purchase-orders/export-pdf-draft";
    const purchaseOrderPdfExportMatch = url.pathname.match(/^\/api\/purchase-orders\/([^/]+)\/export-pdf$/);
    const purchaseOrderEmailMatch = url.pathname.match(/^\/api\/purchase-orders\/([^/]+)\/email$/);
    const riskAssessmentMatch = url.pathname.match(/^\/api\/risk-assessments\/([^/]+)$/);
    const contractTemplateMatch = url.pathname.match(/^\/api\/contract-templates\/([^/]+)$/);
    const contractMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)$/);
    const appCapabilitiesPdfExportMatch = url.pathname === "/api/app-capabilities/export-pdf";
    const drawingProjectMatch = url.pathname.match(/^\/api\/drawings\/([^/]+)$/);
    const drawingReferenceContentMatch = url.pathname.match(/^\/api\/drawings\/([^/]+)\/references\/([^/]+)\/content$/);
    const contractWordExportMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)\/export-word$/);
    const contractPdfExportMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)\/export-pdf$/);
    const legalFrameworkMatch = url.pathname.match(/^\/api\/legal-frameworks\/([^/]+)$/);
    const learningTestMatch = url.pathname.match(/^\/api\/learning-tests\/([^/]+)$/);
    const learningTestAssignmentEmailMatch = url.pathname.match(/^\/api\/learning-tests\/([^/]+)\/assignments\/([^/]+)\/email$/);
    const serviceCatalogMatch = url.pathname.match(/^\/api\/service-catalog\/([^/]+)$/);
    const measurementEquipmentMatch = url.pathname.match(/^\/api\/measurement-equipment\/([^/]+)$/);
    const safetyAuthorizationMatch = url.pathname.match(/^\/api\/safety-authorizations\/([^/]+)$/);
    const absenceEntryMatch = url.pathname.match(/^\/api\/absence-entries\/([^/]+)$/);
    const peopleTrainingRecordMatch = url.pathname.match(/^\/api\/people-training-records\/([^/]+)$/);
    const peopleTrainingGenerateDocumentsMatch = url.pathname.match(/^\/api\/people-training-records\/([^/]+)\/generate-documents$/);
    const measurementEquipmentExcelExportMatch = url.pathname === "/api/measurement-equipment/export-list-excel";
    const measurementEquipmentZipExportMatch = url.pathname === "/api/measurement-equipment/export-files-zip";
    const measurementEquipmentWordExportMatch = url.pathname === "/api/measurement-equipment/export-word";
    const measurementEquipmentPdfExportMatch = url.pathname === "/api/measurement-equipment/export-pdf";
    const documentTemplateMatch = url.pathname.match(/^\/api\/document-templates\/([^/]+)$/);
    const documentTemplatePdfExportMatch = url.pathname.match(/^\/api\/document-templates\/([^/]+)\/export-pdf$/);
    const documentTemplateBatchPdfExportMatch = url.pathname === "/api/document-templates/export-pdf-batch";
    const documentTemplatePdfFilesExportMatch = url.pathname === "/api/document-templates/export-pdf-files";
    const documentTemplatePdfDocumentsExportMatch = url.pathname === "/api/document-templates/export-pdf-documents";
    const documentTemplateWordHtmlConvertMatch = url.pathname === "/api/document-templates/convert-word-html";
    const documentTemplateHtmlPreviewPdfExportMatch = url.pathname === "/api/document-templates/export-html-preview-pdf";
    const vehicleReservationsCollectionMatch = url.pathname.match(/^\/api\/vehicles\/([^/]+)\/reservations$/);
    const vehicleReservationMatch = url.pathname.match(/^\/api\/vehicles\/([^/]+)\/reservations\/([^/]+)$/);
    const vehicleMatch = url.pathname.match(/^\/api\/vehicles\/([^/]+)$/);
    const todoTaskCommentMatch = url.pathname.match(/^\/api\/todo-tasks\/([^/]+)\/comments$/);
    const todoTaskMatch = url.pathname.match(/^\/api\/todo-tasks\/([^/]+)$/);
    const chatConversationMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)$/);
    const chatConversationMessageMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)\/messages$/);
    const chatConversationReadMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)\/read$/);
    const chatConversationArchiveMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)\/archive$/);
    const chatConversationClearHistoryMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)\/clear-history$/);
    const workOrderPdfExportMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/export-pdf$/);
    const workOrderPdfSaveMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/save-pdf$/);
    const workOrderPdfDownloadMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/pdf$/);
    const workOrderActivityMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/activity$/);
    const workOrderDocumentsMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/documents$/);
    const workOrderDocumentDownloadMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/documents\/([^/]+)\/download$/);
    const workOrderDocumentMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)\/documents\/([^/]+)$/);
    const workOrderMatch = url.pathname.match(/^\/api\/work-orders\/([^/]+)$/);

    if (request.method === "GET" && url.pathname === "/api/chat/bootstrap") {
      await writeChatSnapshot(response, user, request, url);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/chat/presence") {
      const body = await readJsonBody(request);
      const { organizationId } = await getScopedChatContext(user, request);
      liveChatStore.setPresence({
        organizationId,
        userId: user.id,
        status: body.status,
      });
      await writeChatSnapshot(response, user, request, url, 200, body.activeConversationId);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/chat/conversations") {
      const body = await readJsonBody(request);
      const { organizationId, users } = await getScopedChatContext(user, request);
      const conversationId = await liveChatStore.createConversation({
        organizationId,
        currentUser: user,
        users,
        title: body.title,
        participantIds: body.participantIds,
      });
      await writeChatSnapshot(response, user, request, url, 201, conversationId);
      return true;
    }

    if (chatConversationMatch && request.method === "DELETE") {
      const { organizationId } = await getScopedChatContext(user, request);
      await liveChatStore.deleteConversation({
        organizationId,
        conversationId: chatConversationMatch[1],
        currentUserId: user.id,
      });
      await writeChatSnapshot(response, user, request, url, 200, "");
      return true;
    }

    if (chatConversationMessageMatch && request.method === "POST") {
      const body = await readJsonBody(request);
      const { organizationId } = await getScopedChatContext(user, request);
      await liveChatStore.addMessage({
        organizationId,
        conversationId: chatConversationMessageMatch[1],
        currentUser: user,
        body: body.body,
      });
      await writeChatSnapshot(response, user, request, url, 201, chatConversationMessageMatch[1]);
      return true;
    }

    if (chatConversationReadMatch && request.method === "POST") {
      const { organizationId } = await getScopedChatContext(user, request);
      const body = await readJsonBody(request);
      await liveChatStore.markConversationRead({
        organizationId,
        conversationId: chatConversationReadMatch[1],
        currentUserId: user.id,
      });
      await writeChatSnapshot(
        response,
        user,
        request,
        url,
        200,
        body.activeConversationId || chatConversationReadMatch[1],
      );
      return true;
    }

    if (chatConversationArchiveMatch && request.method === "POST") {
      const { organizationId } = await getScopedChatContext(user, request);
      const body = await readJsonBody(request);
      await liveChatStore.archiveConversation({
        organizationId,
        conversationId: chatConversationArchiveMatch[1],
        currentUserId: user.id,
        archived: body.archived !== false,
      });
      await writeChatSnapshot(response, user, request, url, 200, body.activeConversationId || "");
      return true;
    }

    if (chatConversationClearHistoryMatch && request.method === "POST") {
      const { organizationId } = await getScopedChatContext(user, request);
      await liveChatStore.clearConversationHistory({
        organizationId,
        conversationId: chatConversationClearHistoryMatch[1],
        currentUserId: user.id,
      });
      await writeChatSnapshot(response, user, request, url, 200, chatConversationClearHistoryMatch[1]);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/organizations") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, user, request, () => tenantRepository.createOrganization(user, body), 201);
      return true;
    }

    if (organizationMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await tenantRepository.updateOrganization(user, organizationMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Organizacija nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/users") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const scopedActor = {
        ...user,
        appPermissions: {
          ...(scopedSnapshot.appPermissions ?? {}),
        },
      };
      const isClientPortalPayload = isClientPortalUserPayload(body);
      let mutationActor = scopedActor;
      let mutationBody = body;
      if (isClientPortalPayload) {
        if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "clientPortal.manage")) {
          sendError(response, 403, "Nemate pravo upravljati klijentskim portalom.");
          return true;
        }
        assertClientPortalUserPayloadInScope(scopedSnapshot, body);
        mutationActor = withClientPortalUserManagementPermission(scopedActor);
        mutationBody = {
          ...body,
          role: "user",
          profileRole: "client_user",
        };
      }
      await tenantRepository.createUser(mutationActor, mutationBody);
      await writeSnapshot(response, scopedActor, request, 201);
      return true;
    }

    if (userMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const scopedActor = {
        ...user,
        appPermissions: {
          ...(scopedSnapshot.appPermissions ?? {}),
        },
      };
      const targetUser = assertInScope(scopedSnapshot.users ?? [], userMatch[1], "Korisnik nije pronađen.");
      const isClientPortalPayload = isClientPortalUserPayload(body) || isClientPortalUser(targetUser);
      let mutationActor = scopedActor;
      let mutationBody = body;
      if (isClientPortalPayload) {
        if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "clientPortal.manage")) {
          sendError(response, 403, "Nemate pravo upravljati klijentskim portalom.");
          return true;
        }
        assertClientPortalUserPayloadInScope(scopedSnapshot, {
          ...targetUser,
          ...body,
        });
        mutationActor = withClientPortalUserManagementPermission(scopedActor);
        mutationBody = {
          ...body,
          role: "user",
          profileRole: "client_user",
        };
      }
      const updated = await tenantRepository.updateUser(mutationActor, userMatch[1], mutationBody);

      if (!updated) {
        sendError(response, 404, "Korisnik nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/login-content") {
      const body = await readJsonBody(request);
      await handleEntityMutation(response, user, request, () => tenantRepository.createLoginContent(user, body), 201);
      return true;
    }

    if (loginContentMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const updated = await tenantRepository.updateLoginContent(user, loginContentMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Login sadržaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (loginContentMatch && request.method === "DELETE") {
      const deleted = await tenantRepository.deleteLoginContent(user, loginContentMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Login sadržaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (signupRequestActionMatch && request.method === "POST") {
      const body = await readJsonBody(request);
      const [, signupRequestId, action] = signupRequestActionMatch;

      if (action === "approve") {
        await handleEntityMutation(
          response,
          user,
          request,
          () => tenantRepository.approveSignupRequest(user, signupRequestId, body),
        );
        return true;
      }

      if (action === "reject") {
        await handleEntityMutation(
          response,
          user,
          request,
          () => tenantRepository.rejectSignupRequest(user, signupRequestId, body),
        );
        return true;
      }
    }

    if (request.method === "POST" && url.pathname === "/api/companies") {
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canCreateCompanies(user, scopedSnapshot.companyRolePermissions)) {
        sendError(response, 403, "Nemate pravo upravljati tvrtkama.");
        return true;
      }

      const body = await readJsonBody(request);
      const company = await domainRepository.createCompany(body);
      await tenantRepository.assignCompanyToOrganization(scopedSnapshot.activeOrganizationId, company.id);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/locations") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "locations.create")) {
        sendError(response, 403, "Nemate pravo dodavati lokacije.");
        return true;
      }
      assertCompanyPayloadInScope(scopedSnapshot, body);
      await domainRepository.createLocation(body);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/location-objects") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo dodavati objekte lokacije.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const location = assertInScope(
        scopedSnapshot.locations ?? [],
        body.locationId,
        "Lokacija nije dostupna za odabranu organizaciju.",
      );
      if (body.companyId && String(location.companyId) !== String(body.companyId)) {
        sendError(response, 400, "Lokacija ne pripada odabranoj tvrtki.");
        return true;
      }

      await domainRepository.createLocationObject({
        ...body,
        companyId: body.companyId || location.companyId,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/work-orders") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "workOrders.create")) {
        sendError(response, 403, "Nemate pravo otvarati radne naloge.");
        return true;
      }
      const missingStatusPermissions = getMissingScopedSnapshotAppPermissions(
        user,
        scopedSnapshot,
        getWorkOrderStatusPermissionKeys("Otvoreni RN", body.status),
      );
      if (missingStatusPermissions.length > 0) {
        sendError(response, 403, "Nemate pravo postaviti taj status radnog naloga.");
        return true;
      }
      const missingBillingPermissions = getMissingScopedSnapshotAppPermissions(
        user,
        scopedSnapshot,
        getWorkOrderBillingPermissionKeys({}, body),
      );
      if (missingBillingPermissions.length > 0) {
        sendError(response, 403, "Nemate pravo upisivati podatke za fakturiranje.");
        return true;
      }
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertServiceCatalogIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createWorkOrder({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/reminders") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati reminderima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      await domainRepository.createReminder({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/todo-tasks") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ToDo zadacima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      const assignedPayload = resolveAssignedUserPayload(scopedSnapshot, body);
      const invitedPayload = resolveTodoInvitedUsersPayload(scopedSnapshot, body);
      await domainRepository.createTodoTask({
        ...body,
        ...assignedPayload,
        ...invitedPayload,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/offers/template-settings") {
      if (!(await canUseAnyScopedAppPermission(user, request, ["offers.view", "offers.create", "offers.edit"]))) {
        sendError(response, 403, "Nemate pravo pregledavati ponude.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const entry = await domainRepository.getOfferTemplateSettings(scopedSnapshot.activeOrganizationId).catch(() => null);
      sendJson(response, 200, {
        item: entry?.referenceDocument ?? null,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/offers/template-settings") {
      if (!(await canUseScopedAppPermission(user, request, "offers.edit"))) {
        sendError(response, 403, "Nemate pravo uredivati ponude.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const entry = await domainRepository.upsertOfferTemplateSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        referenceDocument: body?.referenceDocument ?? null,
      });
      sendJson(response, 200, {
        item: entry?.referenceDocument ?? null,
      });
      return true;
    }

    if (request.method === "DELETE" && url.pathname === "/api/offers/template-settings") {
      if (!(await canUseScopedAppPermission(user, request, "offers.edit"))) {
        sendError(response, 403, "Nemate pravo uredivati ponude.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.deleteOfferTemplateSettings(scopedSnapshot.activeOrganizationId);
      sendJson(response, 200, { ok: true });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/purchase-orders/template-settings") {
      if (!(await canUseAnyScopedAppPermission(user, request, ["purchaseOrders.view", "purchaseOrders.create", "purchaseOrders.edit"]))) {
        sendError(response, 403, "Nemate pravo pregledavati narudzbenice.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const entry = await domainRepository.getPurchaseOrderTemplateSettings(scopedSnapshot.activeOrganizationId).catch(() => null);
      sendJson(response, 200, {
        item: entry?.referenceDocument ?? null,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/purchase-orders/template-settings") {
      if (!(await canUseScopedAppPermission(user, request, "purchaseOrders.edit"))) {
        sendError(response, 403, "Nemate pravo uredivati narudzbenice.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const entry = await domainRepository.upsertPurchaseOrderTemplateSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        referenceDocument: body?.referenceDocument ?? null,
      });
      sendJson(response, 200, {
        item: entry?.referenceDocument ?? null,
      });
      return true;
    }

    if (request.method === "DELETE" && url.pathname === "/api/purchase-orders/template-settings") {
      if (!(await canUseScopedAppPermission(user, request, "purchaseOrders.edit"))) {
        sendError(response, 403, "Nemate pravo uredivati narudzbenice.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.deletePurchaseOrderTemplateSettings(scopedSnapshot.activeOrganizationId);
      sendJson(response, 200, { ok: true });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/offers") {
      if (!(await canUseScopedAppPermission(user, request, "offers.create"))) {
        sendError(response, 403, "Nemate pravo izradivati ponude.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      await domainRepository.createOffer({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/vehicles") {
      if (!(await canUseScopedAppPermission(user, request, "vehicles.create"))) {
        sendError(response, 403, "Nemate pravo upravljati vozilima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.createVehicle({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/legal-frameworks") {
      if (!(await canUseScopedAppPermission(user, request, "legalFramework.edit"))) {
        sendError(response, 403, "Nemate pravo upravljati propisima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body, "linkedTemplateIds");
      await domainRepository.createLegalFramework({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/purchase-orders") {
      if (!(await canUseScopedAppPermission(user, request, "purchaseOrders.create"))) {
        sendError(response, 403, "Nemate pravo izradivati narudzbenice.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      await domainRepository.createPurchaseOrder({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/risk-assessments") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati procjenama rizika.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      await domainRepository.createRiskAssessment({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/contract-templates") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "contracts.create")) {
        sendError(response, 403, "Nemate pravo upravljati templateima ugovora.");
        return true;
      }
      await domainRepository.createContractTemplate({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/contracts") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "contracts.create")) {
        sendError(response, 403, "Nemate pravo dodavati ugovore.");
        return true;
      }
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertContractTemplatePayloadInScope(scopedSnapshot, body);
      assertOfferIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createContract({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/drawings") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati crtezima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      await domainRepository.createDrawingProject({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (drawingReferenceContentMatch && request.method === "GET") {
      const { scopedSnapshot } = await getScopedState(user, request);
      const drawing = assertInScope(scopedSnapshot.drawings ?? [], drawingReferenceContentMatch[1], "Crtez nije pronaden.");
      const reference = (drawing.referenceDocuments ?? []).find((item) => String(item?.id) === String(drawingReferenceContentMatch[2]));

      if (!reference) {
        sendError(response, 404, "CAD podloga nije pronadena.");
        return true;
      }

      const stored = await readStoredDocumentBuffer(reference);
      sendBinary(response, 200, stored.buffer, {
        contentType: stored.mimeType || reference.fileType || "application/octet-stream",
        fileName: reference.fileName || "drawing-reference.bin",
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/learning-tests") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati eLearning testovima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.createLearningTestItem({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/learning-tests/questions/import-template") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati eLearning testovima.");
        return true;
      }

      const todayIso = new Date().toISOString().slice(0, 10);
      sendBinary(response, 200, buildLearningQuestionImportTemplateXlsxBuffer(), {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: sanitizeGeneratedDocumentFileName(`pitanja-import-primjer-${todayIso}`, {
          fallback: "pitanja-import-primjer",
          extension: "xlsx",
        }),
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/learning-tests/questions/import") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati eLearning testovima.");
        return true;
      }

      const body = await readJsonBody(request);
      const questionItems = buildLearningQuestionImportItems(body);
      if (questionItems.length === 0) {
        sendError(response, 400, "U Excelu nema prepoznatih pitanja za import.");
        return true;
      }

      sendJson(response, 200, {
        questionItems,
        importedCount: questionItems.length,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/measurement-equipment") {
      if (!(await canUseScopedAppPermission(user, request, "measurementEquipment.create"))) {
        sendError(response, 403, "Nemate pravo upravljati mjernom opremom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createMeasurementEquipmentItem({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/service-catalog") {
      if (!(await canUseScopedAppPermission(user, request, "serviceCatalog.create"))) {
        sendError(response, 403, "Nemate pravo upravljati uslugama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createServiceCatalogItem({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/safety-authorizations") {
      if (!(await canUseScopedAppPermission(user, request, "safetyAuthorizations.manage"))) {
        sendError(response, 403, "Nemate pravo upravljati ovlaštenjima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createSafetyAuthorization({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/people-training-records/import-template") {
      if (!canManagePeopleTrainingRecords(user) && !(await canUseScopedAppPermission(user, request, "people.manage"))) {
        sendError(response, 403, "Nemate pravo upravljati osposobljavanjima.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const todayIso = new Date().toISOString().slice(0, 10);
      sendBinary(response, 200, buildPeopleTrainingImportTemplateXlsxBuffer(scopedSnapshot), {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: sanitizeGeneratedDocumentFileName(`osposobljavanja-import-primjer-${todayIso}`, {
          fallback: "osposobljavanja-import-primjer",
          extension: "xlsx",
        }),
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/people-training-records/import") {
      if (!canManagePeopleTrainingRecords(user) && !(await canUseScopedAppPermission(user, request, "people.manage"))) {
        sendError(response, 403, "Nemate pravo upravljati osposobljavanjima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);

      const records = buildPeopleTrainingImportRecords(body, scopedSnapshot);
      if (records.length === 0) {
        sendError(response, 400, "U Excelu nema prepoznatih osoba za import.");
        return true;
      }

      const importMode = normalizePeopleTrainingImportMode(body.importMode || body.mode);
      const importPlan = buildPeopleTrainingImportPlan(records, scopedSnapshot, importMode, body.rowDecisions);
      const previewPayload = serializePeopleTrainingImportPlan(importPlan, scopedSnapshot);
      if (body.previewOnly || body.dryRun || body.preview === true) {
        sendJson(response, 200, {
          ok: true,
          preview: previewPayload,
        });
        return true;
      }

      if ((importPlan.totals?.applicable ?? 0) === 0) {
        sendError(response, 400, "Nema promjena za potvrdu u odabranoj vrsti importa.");
        return true;
      }

      let createdCount = 0;
      let updatedCount = 0;
      let departureCount = 0;
      let skippedCount = 0;

      for (const row of importPlan.rows ?? []) {
        if (!row.canApply) {
          skippedCount += 1;
          continue;
        }

        if (row.action === "create") {
          const created = await domainRepository.createPersonTrainingRecord(row.nextRecord || row.record);
          await persistPeopleTrainingCertificates(created, scopedSnapshot);
          createdCount += 1;
          continue;
        }

        if ((row.action === "update" || row.action === "departure") && row.existingId) {
          const updated = await domainRepository.updatePersonTrainingRecord(row.existingId, row.nextRecord || row.record);
          if (updated) {
            await persistPeopleTrainingCertificates(updated, scopedSnapshot);
            updatedCount += 1;
            if (row.action === "departure") {
              departureCount += 1;
            }
          }
          continue;
        }

        skippedCount += 1;
      }

      response.setHeader("X-People-Training-Import", JSON.stringify({
        mode: importMode,
        created: createdCount,
        updated: updatedCount,
        departures: departureCount,
        skipped: skippedCount,
      }));
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/people-training-records") {
      if (!canManagePeopleTrainingRecords(user) && !(await canUseScopedAppPermission(user, request, "people.manage"))) {
        sendError(response, 403, "Nemate pravo upravljati osposobljavanjima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const created = await domainRepository.createPersonTrainingRecord({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });
      await persistPeopleTrainingCertificates(created, scopedSnapshot);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (peopleTrainingGenerateDocumentsMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "people.manage"))) {
        sendError(response, 403, "Nemate pravo generirati dokumente osposobljavanja.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const record = assertInScope(
        scopedSnapshot.peopleTrainingRecords ?? [],
        peopleTrainingGenerateDocumentsMatch[1],
        "Evidencija osposobljavanja nije pronađena.",
      );
      const summary = { generatedCount: 0, generatedDocuments: [] };
      await persistPeopleTrainingCertificates(record, scopedSnapshot, {
        trainingType: body.trainingType ?? body.type,
        serviceId: body.serviceId ?? body.serviceCatalogId,
        force: body.force !== false,
        summary,
      });

      if (!summary.generatedCount) {
        sendError(response, 400, "Nema povezanog Word predloška ili podataka za generiranje PDF-a.");
        return true;
      }

      response.setHeader("X-People-Training-Generated", JSON.stringify(summary));
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/absence-entries") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo evidentirati odsutnosti.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const isAdmin = canManageMasterData(user) || Boolean(scopedSnapshot.appPermissions?.["people.manage"]);
      const requestedUserId = normalizeInputValue(body.userId) || String(user.id);

      if (!isAdmin && requestedUserId !== String(user.id)) {
        sendError(response, 403, "Možete unositi odsutnost samo za sebe.");
        return true;
      }

      const targetUser = assertInScope(
        scopedSnapshot.users ?? [],
        requestedUserId,
        "Odabrani korisnik nije dostupan za aktivnu organizaciju.",
      );
      const normalizedType = normalizeInputValue(body.type).toLowerCase();
      const finalStatus = isAdmin
        ? normalizeInputValue(body.status).toLowerCase()
        : (doesAbsenceTypeRequireApproval(normalizedType) ? "pending" : "approved");
      const actorLabel = getScopedUserDisplayLabel(user);

      await domainRepository.createAbsenceEntry({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: String(targetUser.id),
        userLabel: getScopedUserDisplayLabel(targetUser),
        status: finalStatus,
        requestedByUserId: String(user.id),
        requestedByLabel: actorLabel,
        approvedByUserId: finalStatus === "approved" ? String(user.id) : "",
        approvedByLabel: finalStatus === "approved" ? actorLabel : "",
        approvedAt: finalStatus === "approved" ? new Date().toISOString() : null,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/absence-balances") {
      if (!(await canUseScopedAppPermission(user, request, "people.manage"))) {
        sendError(response, 403, "Nemate pravo uređivati saldo odsutnosti.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const targetUser = assertInScope(
        scopedSnapshot.users ?? [],
        body.userId,
        "Odabrani korisnik nije dostupan za aktivnu organizaciju.",
      );

      await domainRepository.upsertAbsenceBalance({
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: String(targetUser.id),
        userLabel: getScopedUserDisplayLabel(targetUser),
        annualLeaveInitialDays: body?.annualLeaveInitialDays,
        sickLeaveInitialDays: body?.sickLeaveInitialDays,
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (userPasswordResetMatch && request.method === "POST") {
      const { scopedSnapshot } = await getScopedState(user, request);
      const scopedActor = {
        ...user,
        appPermissions: {
          ...(scopedSnapshot.appPermissions ?? {}),
        },
      };
      const targetUser = assertInScope(scopedSnapshot.users ?? [], userPasswordResetMatch[1], "Korisnik nije pronađen.");
      let mutationActor = scopedActor;
      if (isClientPortalUser(targetUser)) {
        if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "clientPortal.manage")) {
          sendError(response, 403, "Nemate pravo upravljati klijentskim portalom.");
          return true;
        }
        mutationActor = withClientPortalUserManagementPermission(scopedActor);
      }
      const updated = await tenantRepository.sendUserPasswordReset(mutationActor, userPasswordResetMatch[1]);

      if (!updated) {
        sendError(response, 404, "Korisnik nije pronaÄ‘en.");
        return true;
      }

      await writeSnapshot(response, scopedActor, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/measurement-equipment/card-template") {
      if (!(await canUseScopedAppPermission(user, request, "measurementEquipment.edit"))) {
        sendError(response, 403, "Nemate pravo spremati karton template.");
        return true;
      }

      const body = await readJsonBody(request);
      const templateDocument = body?.templateDocument && typeof body.templateDocument === "object"
        ? body.templateDocument
        : null;

      if (!templateDocument) {
        sendError(response, 400, "Priloži .docx/.dotx karton template.");
        return true;
      }

      if (!isWordTemplateFile(templateDocument)) {
        sendError(response, 400, "Karton template mora biti .docx ili .dotx datoteka.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertMeasurementEquipmentCardTemplate({
        organizationId: scopedSnapshot.activeOrganizationId,
        templateDocument,
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/measurement-equipment/notification-settings") {
      if (!(await canUseScopedAppPermission(user, request, "settings.manage"))) {
        sendError(response, 403, "Nemate pravo spremati postavke notifikacija.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertMeasurementEquipmentNotificationSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        notificationSettings: {
          leadDaysBeforeExpiry: body?.leadDaysBeforeExpiry,
          repeatEveryDays: body?.repeatEveryDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/vehicles/notification-settings") {
      if (!(await canUseScopedAppPermission(user, request, "settings.manage"))) {
        sendError(response, 403, "Nemate pravo spremati postavke notifikacija vozila.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertVehicleNotificationSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        notificationSettings: {
          registrationLeadDaysBeforeExpiry: body?.registrationLeadDaysBeforeExpiry,
          registrationRepeatEveryDays: body?.registrationRepeatEveryDays,
          tireLeadDaysBeforeDue: body?.tireLeadDaysBeforeDue,
          tireRepeatEveryDays: body?.tireRepeatEveryDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/safety-authorizations/notification-settings") {
      if (!(await canUseScopedAppPermission(user, request, "settings.manage"))) {
        sendError(response, 403, "Nemate pravo spremati postavke notifikacija ovlastenja.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertSafetyAuthorizationNotificationSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        notificationSettings: {
          leadDaysBeforeExpiry: body?.leadDaysBeforeExpiry,
          repeatEveryDays: body?.repeatEveryDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/absence/notification-settings") {
      if (!(await canUseScopedAppPermission(user, request, "settings.manage"))) {
        sendError(response, 403, "Nemate pravo spremati postavke notifikacija odsutnosti.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertAbsenceNotificationSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        notificationSettings: {
          leadDaysBeforeStart: body?.leadDaysBeforeStart,
          repeatEveryDays: body?.repeatEveryDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/periodics/visual-settings") {
      if (!(await canUseScopedAppPermission(user, request, "settings.manage"))) {
        sendError(response, 403, "Nemate pravo spremati postavke periodike.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertPeriodicsVisualSettings({
        organizationId: scopedSnapshot.activeOrganizationId,
        visualSettings: {
          criticalDays: body?.criticalDays,
          warningDays: body?.warningDays,
        },
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/app-capabilities") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati mogućnosti aplikacije.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.upsertAppCapabilities({
        organizationId: scopedSnapshot.activeOrganizationId,
        modules: body?.modules,
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/company-role-permissions") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati role permissions.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!scopedSnapshot.activeOrganizationId) {
        sendError(response, 400, "Aktivna organizacija je obavezna.");
        return true;
      }

      await domainRepository.upsertCompanyRolePermissions({
        organizationId: scopedSnapshot.activeOrganizationId,
        rolePermissions: body?.rolePermissions,
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/app-role-permissions") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo spremati role permissions.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!scopedSnapshot.activeOrganizationId) {
        sendError(response, 400, "Aktivna organizacija je obavezna.");
        return true;
      }

      await domainRepository.upsertAppRolePermissions({
        organizationId: scopedSnapshot.activeOrganizationId,
        rolePermissions: body?.rolePermissions,
      });
      await writeSnapshot(response, user, request);
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/document-records") {
      if (!canManageWorkOrders(user) && !isClientPortalUser(user)) {
        sendError(response, 403, "Nemate pravo pregledavati zapisnike.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const templateId = String(url.searchParams.get("templateId") ?? "").trim();
      const companyId = String(url.searchParams.get("companyId") ?? "").trim();
      const locationId = String(url.searchParams.get("locationId") ?? "").trim();
      const objectId = String(url.searchParams.get("objectId") ?? "").trim();
      const limit = String(url.searchParams.get("limit") ?? "200").trim();

      if (templateId) {
        assertInScope(scopedSnapshot.documentTemplates ?? [], templateId, "Template nije dostupan za odabranu organizaciju.");
      }
      if (companyId) {
        assertInScope(scopedSnapshot.companies ?? [], companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      }
      if (locationId) {
        assertInScope(scopedSnapshot.locations ?? [], locationId, "Lokacija nije dostupna za odabranu organizaciju.");
      }
      if (objectId) {
        assertLocationObjectPayloadInScope(scopedSnapshot, { companyId, locationId, objectId });
      }

      const visibleCompanyIds = new Set((scopedSnapshot.companies ?? []).map((item) => String(item.id)));
      const visibleLocationIds = new Set((scopedSnapshot.locations ?? []).map((item) => String(item.id)));
      const visibleObjectIds = new Set((scopedSnapshot.locationObjects ?? []).map((item) => String(item.id)));
      const items = (await domainRepository.listDocumentRecords({
        organizationId: scopedSnapshot.activeOrganizationId,
        templateId,
        companyId,
        locationId,
        objectId,
        limit,
      })).filter((item) => {
        const itemCompanyId = String(item.companyId || "");
        const itemLocationId = String(item.locationId || "");
        const itemObjectId = String(item.objectId || "");
        return (!itemCompanyId || visibleCompanyIds.has(itemCompanyId))
          && (!itemLocationId || visibleLocationIds.has(itemLocationId))
          && (!itemObjectId || visibleObjectIds.has(itemObjectId));
      });

      sendJson(response, 200, { items });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/document-records") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo spremati zapisnike.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], body.templateId, "Template nije dostupan za odabranu organizaciju.");
      assertInScope(scopedSnapshot.companies ?? [], body.companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      assertInScope(scopedSnapshot.locations ?? [], body.locationId, "Lokacija nije dostupna za odabranu organizaciju.");
      const locationObject = assertLocationObjectPayloadInScope(scopedSnapshot, body);

      const item = await domainRepository.createDocumentRecord({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        objectName: body.objectName || locationObject?.name || "",
      }, user);

      sendJson(response, 201, { item });
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/measurement-sheet-presets") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo pregledavati Excel presete.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const templateId = String(url.searchParams.get("templateId") ?? "").trim();
      const companyId = String(url.searchParams.get("companyId") ?? "").trim();
      const locationId = String(url.searchParams.get("locationId") ?? "").trim();
      const fieldKey = String(url.searchParams.get("fieldKey") ?? "").trim();
      const limit = String(url.searchParams.get("limit") ?? "12").trim();

      if (templateId) {
        assertInScope(scopedSnapshot.documentTemplates ?? [], templateId, "Template nije dostupan za odabranu organizaciju.");
      }
      if (companyId) {
        assertInScope(scopedSnapshot.companies ?? [], companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      }
      if (locationId) {
        assertInScope(scopedSnapshot.locations ?? [], locationId, "Lokacija nije dostupna za odabranu organizaciju.");
      }

      const items = await domainRepository.listMeasurementSheetPresets({
        organizationId: scopedSnapshot.activeOrganizationId,
        templateId,
        companyId,
        locationId,
        fieldKey,
        limit,
      });

      sendJson(response, 200, { items });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/measurement-sheet-presets") {
      if (!(await canUseScopedAppPermission(user, request, "documentTemplates.create"))) {
        sendError(response, 403, "Nemate pravo spremati Excel presete.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], body.templateId, "Template nije dostupan za odabranu organizaciju.");
      assertInScope(scopedSnapshot.companies ?? [], body.companyId, "Tvrtka nije dostupna za odabranu organizaciju.");
      assertInScope(scopedSnapshot.locations ?? [], body.locationId, "Lokacija nije dostupna za odabranu organizaciju.");

      const item = await domainRepository.saveMeasurementSheetPreset({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      sendJson(response, 201, { item });
      return true;
    }

    if (documentTemplateWordHtmlConvertMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "documentTemplates.create"))) {
        sendError(response, 403, "Nemate pravo pretvarati Word predloške.");
        return true;
      }

      const body = await readJsonBody(request);
      const referenceDocument = body?.referenceDocument && typeof body.referenceDocument === "object"
        ? body.referenceDocument
        : body;

      try {
        const result = await convertWordTemplateReferenceToHtml(referenceDocument);
        const baseName = sanitizeGeneratedDocumentFileName(
          referenceDocument.fileName || referenceDocument.name || "word-template",
          { fallback: "word-template", extension: "html" },
        ).replace(/\.(docx|dotx|html?)$/i, "");
        const fileName = sanitizeGeneratedDocumentFileName(
          `${baseName}.html`,
          { fallback: "word-template", extension: "html" },
        );
        sendJson(response, 200, {
          html: result.html,
          fileName,
          sourceFileName: normalizeInputValue(referenceDocument.fileName || referenceDocument.name),
          engine: result.engine || "word-html",
          messages: result.messages,
        });
      } catch (error) {
        console.error("Word -> HTML conversion failed.", error);
        sendError(response, 400, error?.message || "Ne mogu pretvoriti Word predložak u HTML.");
      }
      return true;
    }

    if (documentTemplateHtmlPreviewPdfExportMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "documentTemplates.create"))) {
        sendError(response, 403, "Nemate pravo izvoziti HTML predlozak u PDF.");
        return true;
      }

      const body = await readJsonBody(request);
      const html = String(body?.html || "").trim();
      if (!html) {
        sendError(response, 400, "HTML predlozak je prazan.");
        return true;
      }

      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || body.title || "safenexus-template",
        { fallback: "safenexus-template", extension: "pdf" },
      );
      const pdfBuffer = await convertHtmlToPdfBuffer(html, {
        fileName: fileName.replace(/\.pdf$/i, ".html"),
        title: body.title || "SafeNexus template",
      });

      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/document-templates") {
      if (!(await canUseScopedAppPermission(user, request, "documentTemplates.create"))) {
        sendError(response, 403, "Nemate pravo upravljati templateima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertSampleCompanyPayloadInScope(scopedSnapshot, body);
      assertSampleLocationPayloadInScope(scopedSnapshot, body);
      assertLegalFrameworkIdsPayloadInScope(scopedSnapshot, body);
      await domainRepository.createDocumentTemplate({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (measurementEquipmentExcelExportMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "measurementEquipment.view"))) {
        sendError(response, 403, "Nemate pravo izvoziti popis mjerne opreme.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const items = [...(scopedSnapshot.measurementEquipment ?? [])].sort((left, right) => {
        const byName = String(left?.name || "").localeCompare(String(right?.name || ""), "hr", { sensitivity: "base" });
        if (byName !== 0) {
          return byName;
        }
        const byInventory = String(left?.inventoryNumber || "").localeCompare(String(right?.inventoryNumber || ""), "hr", { sensitivity: "base" });
        if (byInventory !== 0) {
          return byInventory;
        }
        return String(left?.id || "").localeCompare(String(right?.id || ""));
      });
      const todayIso = new Date().toISOString().slice(0, 10);
      const rows = [[
        "Naziv opreme",
        "Proizvodac",
        "Tip/model",
        "Oznaka uredaja",
        "Serijski broj",
        "Inv broj",
        "Umjerava se",
        "Datum umjeravanja",
        "Vrijedi do",
        "Status umjernice",
        "Koristi se u zapisnicima",
        "Mjernu opremu unio",
        "Odobrio",
        "Datum unosa",
        "Zadnje umjeravanje",
        "Zadnji pregled",
        "Zadnji servis",
        "Broj datoteka",
      ]];

      items.forEach((item) => {
        rows.push([
          normalizeInputValue(item?.name),
          normalizeInputValue(item?.manufacturer),
          normalizeInputValue(item?.deviceType),
          normalizeInputValue(item?.deviceCode),
          normalizeInputValue(item?.serialNumber),
          normalizeInputValue(item?.inventoryNumber),
          item?.requiresCalibration ? "DA" : "NE",
          normalizeDateOnlyValue(item?.calibrationDate),
          normalizeDateOnlyValue(item?.validUntil),
          getMeasurementEquipmentCalibrationStatusLabel(item, todayIso),
          (Array.isArray(item?.linkedTemplateTitles) ? item.linkedTemplateTitles : []).join(", "),
          normalizeInputValue(item?.enteredBy),
          normalizeInputValue(item?.approvedBy),
          normalizeDateOnlyValue(item?.entryDate),
          buildMeasurementEquipmentLatestActivitySummary(item, "umjeravanje"),
          buildMeasurementEquipmentLatestActivitySummary(item, "pregled"),
          buildMeasurementEquipmentLatestActivitySummary(item, "servis"),
          String((Array.isArray(item?.documents) ? item.documents : []).length),
        ]);
      });

      const fileName = sanitizeGeneratedDocumentFileName(
        `mjerna-oprema-popis-${todayIso}`,
        { fallback: "mjerna-oprema-popis", extension: "xlsx" },
      );
      sendBinary(response, 200, buildMeasurementEquipmentListXlsxBuffer(rows), {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName,
      });
      return true;
    }

    if (measurementEquipmentZipExportMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "measurementEquipment.view"))) {
        sendError(response, 403, "Nemate pravo izvoziti datoteke mjerne opreme.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const allItems = Array.isArray(scopedSnapshot.measurementEquipment)
        ? scopedSnapshot.measurementEquipment
        : [];
      const requestedIdsRaw = Array.isArray(body?.equipmentIds)
        ? body.equipmentIds
        : Array.isArray(body?.deviceIds)
          ? body.deviceIds
          : [];
      const requestedIdSet = new Set(requestedIdsRaw.map((value) => normalizeInputValue(value)).filter(Boolean));
      const selectedItems = requestedIdSet.size > 0
        ? allItems.filter((item) => requestedIdSet.has(String(item?.id ?? "")))
        : [...allItems];
      if (selectedItems.length === 0) {
        sendError(response, 400, "Nema odabranih uređaja za ZIP izvoz.");
        return true;
      }

      const requestedCategoriesRaw = Array.isArray(body?.documentCategories)
        ? body.documentCategories
        : Array.isArray(body?.categories)
          ? body.categories
          : [];
      const selectedCategories = new Set(
        requestedCategoriesRaw
          .map((value) => normalizeMeasurementEquipmentDocumentCategoryValue(value))
          .filter((value) => value && value !== MEASUREMENT_EQUIPMENT_CARD_TEMPLATE_CATEGORY),
      );
      if (selectedCategories.size === 0) {
        selectedItems.forEach((item) => {
          (Array.isArray(item?.documents) ? item.documents : []).forEach((document) => {
            const normalized = normalizeMeasurementEquipmentDocumentCategoryValue(document?.documentCategory);
            if (normalized && normalized !== MEASUREMENT_EQUIPMENT_CARD_TEMPLATE_CATEGORY) {
              selectedCategories.add(normalized);
            }
          });
        });
      }
      if (selectedCategories.size === 0) {
        sendError(response, 400, "Za odabrane uređaje nema datoteka za ZIP izvoz.");
        return true;
      }

      const onlyValidCalibrationCertificates = Boolean(body?.onlyValidCalibrationCertificates);
      const todayIso = new Date().toISOString().slice(0, 10);
      const zip = new JSZip();
      const usedPaths = new Set();
      const manifestRows = [[
        "Uredaj ID",
        "Naziv uredaja",
        "Inv broj",
        "Kategorija",
        "Datoteka",
        "Status umjernice",
      ]];
      const skippedDocuments = [];
      let addedCount = 0;

      for (const item of selectedItems) {
        const selectedDocuments = collectMeasurementEquipmentDocumentsForZip(
          item,
          selectedCategories,
          {
            onlyValidCalibrationCertificates,
            todayIso,
          },
        );
        if (selectedDocuments.length === 0) {
          continue;
        }

        const deviceFolder = sanitizeZipPathSegment(
          [
            item?.inventoryNumber ? `INV-${item.inventoryNumber}` : "",
            item?.name || "",
            item?.id ? `ID-${item.id}` : "",
          ].filter(Boolean).join(" - "),
          `uredaj-${item?.id || "bez-id"}`,
        );

        for (const document of selectedDocuments) {
          const normalizedCategory = normalizeMeasurementEquipmentDocumentCategoryValue(document?.documentCategory);
          const categoryFolder = sanitizeZipPathSegment(
            getMeasurementEquipmentDocumentCategoryLabel(normalizedCategory),
            "Dokumenti",
          );
          const fileName = sanitizeZipPathSegment(
            normalizeInputValue(document?.fileName),
            `dokument-${addedCount + skippedDocuments.length + 1}`,
          );
          const candidatePath = `${deviceFolder}/${categoryFolder}/${fileName}`;

          try {
            const storedDocument = await readStoredDocumentBuffer(document);
            const zipPath = buildUniqueZipPath(candidatePath, usedPaths);
            zip.file(zipPath, storedDocument.buffer);
            addedCount += 1;
            manifestRows.push([
              String(item?.id ?? ""),
              normalizeInputValue(item?.name),
              normalizeInputValue(item?.inventoryNumber),
              getMeasurementEquipmentDocumentCategoryLabel(normalizedCategory),
              normalizeInputValue(document?.fileName),
              getMeasurementEquipmentCalibrationStatusLabel(item, todayIso),
            ]);
          } catch (error) {
            skippedDocuments.push(
              [
                `Uredaj #${item?.id || "?"}`,
                normalizeInputValue(item?.name) || "Bez naziva",
                normalizeInputValue(document?.fileName) || "Datoteka",
                normalizeInputValue(error?.message) || "Neuspjelo citanje dokumenta",
              ].filter(Boolean).join(" | "),
            );
          }
        }
      }

      if (addedCount === 0) {
        sendError(response, 400, "Nijedna datoteka nije dostupna za ZIP izvoz (provjeri odabir i vazecu umjernicu).");
        return true;
      }

      if (skippedDocuments.length > 0) {
        zip.file("_neuspjeli_dokumenti.txt", skippedDocuments.join("\n"));
      }
      zip.file("_manifest.csv", buildCsvBuffer(manifestRows));

      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      const fileName = sanitizeGeneratedDocumentFileName(
        `mjerna-oprema-dokumenti-${todayIso}`,
        { fallback: "mjerna-oprema-dokumenti", extension: "zip" },
      );

      sendBinary(response, 200, zipBuffer, {
        contentType: "application/zip",
        fileName,
      });
      return true;
    }

    if (measurementEquipmentWordExportMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "measurementEquipment.view"))) {
        sendError(response, 403, "Nemate pravo generirati karton uređaja.");
        return true;
      }

      const body = await readJsonBody(request);
      const templateDocument = body?.templateDocument && typeof body.templateDocument === "object"
        ? body.templateDocument
        : null;

      if (!templateDocument) {
        sendError(response, 400, "Prvo učitaj karton template (.docx/.dotx).");
        return true;
      }

      if (!isWordTemplateFile(templateDocument)) {
        sendError(response, 400, "Karton template mora biti .docx ili .dotx datoteka.");
        return true;
      }

      const placeholders = body?.placeholders && typeof body.placeholders === "object" && !Array.isArray(body.placeholders)
        ? body.placeholders
        : {};
      const referenceDocument = await readStoredDocumentBuffer(templateDocument);
      const generatedWord = await buildDocxFromTemplateBuffer(referenceDocument.buffer, placeholders);
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || templateDocument.fileName || "karton-uredaja",
        { fallback: "karton-uredaja", extension: "docx" },
      );

      sendBinary(response, 200, generatedWord, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName,
      });
      return true;
    }

    if (measurementEquipmentPdfExportMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "measurementEquipment.view"))) {
        sendError(response, 403, "Nemate pravo generirati karton uređaja.");
        return true;
      }

      const body = await readJsonBody(request);
      const templateDocument = body?.templateDocument && typeof body.templateDocument === "object"
        ? body.templateDocument
        : null;

      if (!templateDocument) {
        sendError(response, 400, "Prvo učitaj karton template (.docx/.dotx).");
        return true;
      }

      if (!isWordTemplateFile(templateDocument)) {
        sendError(response, 400, "Karton template mora biti .docx ili .dotx datoteka.");
        return true;
      }

      const placeholders = body?.placeholders && typeof body.placeholders === "object" && !Array.isArray(body.placeholders)
        ? body.placeholders
        : {};
      const referenceDocument = await readStoredDocumentBuffer(templateDocument);
      const pdfWordName = sanitizeGeneratedDocumentFileName(
        body.fileName || templateDocument.fileName || "karton-uredaja",
        { fallback: "karton-uredaja", extension: "docx" },
      );
      const pdfBuffer = await buildPdfFromTemplateBuffer(referenceDocument.buffer, placeholders, {
        fileName: pdfWordName,
      });
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || templateDocument.fileName || "karton-uredaja",
        { fallback: "karton-uredaja", extension: "pdf" },
      );

      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (documentTemplatePdfExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF zapisnik.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const template = assertInScope(
        scopedSnapshot.documentTemplates ?? [],
        documentTemplatePdfExportMatch[1],
        "Template nije pronađen.",
      );

      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || template.outputFileName || template.title || "zapisnik",
        { fallback: "zapisnik", extension: "pdf" },
      );
      const hasStoredTemplateReference = Boolean(
        template.referenceDocument
        && (isHtmlTemplateFile(template.referenceDocument) || isWordTemplateFile(template.referenceDocument)),
      );
      const pdfBuffer = shouldUseFastTemplateRenderPdf(body) && !hasStoredTemplateReference
        ? await buildPdfFromRenderModel(body.renderModel)
        : await generatePdfBufferForTemplate(template, {
          placeholders: body.placeholders ?? {},
          fileName: body.fileName || template.outputFileName || template.title || "zapisnik.html",
        });

      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (documentTemplatePdfFilesExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF zapisnike.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const entries = Array.isArray(body.entries) ? body.entries : [];

      if (entries.length === 0) {
        sendError(response, 400, "PDF paket nema nijedan zapisnik za obradu.");
        return true;
      }

      const pdfFiles = await generatePdfFileEntriesForTemplateEntries(entries, scopedSnapshot);
      if (pdfFiles.length === 0) {
        sendError(response, 400, "PDF paket nema nijedan generirani zapisnik.");
        return true;
      }

      const zip = new JSZip();
      pdfFiles.forEach((entry) => {
        zip.file(entry.fileName, entry.buffer);
      });
      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || "zapisnici-pdf",
        { fallback: "zapisnici-pdf", extension: "zip" },
      );

      sendBinary(response, 200, zipBuffer, {
        contentType: "application/zip",
        fileName,
      });
      return true;
    }

    if (documentTemplatePdfDocumentsExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo spremati PDF zapisnike.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const entries = Array.isArray(body.entries) ? body.entries : [];

      if (entries.length === 0) {
        sendError(response, 400, "Nema nijednog zapisnika za spremanje u Documents.");
        return true;
      }

      const items = await saveGeneratedDocumentTemplatePdfDocuments(entries, scopedSnapshot, user);
      if (items.length === 0) {
        sendError(response, 400, "Nijedan zapisnik nije spremljen u Documents.");
        return true;
      }

      sendJson(response, 200, {
        items,
        generatedCount: items.length,
      });
      return true;
    }

    if (documentTemplateBatchPdfExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo generirati batch PDF zapisnike.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const entries = Array.isArray(body.entries) ? body.entries : [];

      if (entries.length === 0) {
        sendError(response, 400, "Batch PDF nema nijedan zapisnik za obradu.");
        return true;
      }

      const documentTemplateById = new Map((scopedSnapshot.documentTemplates ?? []).map((template) => [
        String(template.id),
        template,
      ]));
      const entriesUseStoredTemplateReference = entries.some((entry) => {
        const template = documentTemplateById.get(String(entry?.templateId || ""));
        return Boolean(
          template?.referenceDocument
          && (isHtmlTemplateFile(template.referenceDocument) || isWordTemplateFile(template.referenceDocument)),
        );
      });
      const canUseFastPdf = body?.fastPdf !== false
        && body?.useTemplatePdf !== true
        && !["template", "word", "html"].includes(String(body?.pdfEngine || "").trim().toLowerCase())
        && !entriesUseStoredTemplateReference
        && entries.every((entry) => hasTemplateRenderPdfModel(entry?.renderModel));
      let mergedPdf = null;
      if (canUseFastPdf) {
        const pdfBuffers = await Promise.all(entries.map((entry) => buildPdfFromRenderModel(entry.renderModel)));
        mergedPdf = await mergePdfBuffers(pdfBuffers);
      } else {
        try {
          mergedPdf = await generateCombinedHtmlPdfForTemplateEntries(entries, scopedSnapshot);
        } catch (combinedHtmlPdfError) {
          console.warn("Brzi batch HTML PDF nije uspio, koristim pojedinacni fallback.", combinedHtmlPdfError);
          mergedPdf = null;
        }
        if (!mergedPdf) {
          const pdfBuffers = await generatePdfBuffersForTemplateEntries(entries, scopedSnapshot);
          mergedPdf = await mergePdfBuffers(pdfBuffers);
        }
      }
      const fileName = sanitizeGeneratedDocumentFileName(
        body.fileName || "zapisnici-batch",
        { fallback: "zapisnici-batch", extension: "pdf" },
      );

      sendBinary(response, 200, mergedPdf, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (appCapabilitiesPdfExportMatch && request.method === "POST") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const organizationName = (scopedSnapshot.organizations ?? []).find((entry) => (
        String(entry.id) === String(scopedSnapshot.activeOrganizationId || "")
      ))?.name || "SafeNexus";
      const pdfBuffer = await buildAppCapabilitiesPdfBuffer({
        organizationName,
        modules: Array.isArray(body?.modules) ? body.modules : scopedSnapshot.appCapabilities ?? [],
        generatedAt: new Date().toISOString(),
      });
      const fileName = sanitizeGeneratedDocumentFileName(
        `${organizationName}-product-board`,
        { fallback: "safe-nexus-product-board", extension: "pdf" },
      );

      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (vehicleReservationsCollectionMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "vehicles.reserve"))) {
        sendError(response, 403, "Nemate pravo rezervirati vozila.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const vehicle = assertInScope(scopedSnapshot.vehicles, vehicleReservationsCollectionMatch[1], "Vozilo nije pronađeno.");
      const reservationUserPayload = resolveVehicleReservationUserPayload(scopedSnapshot, body);
      await domainRepository.createVehicleReservation(vehicle.id, {
        ...body,
        ...reservationUserPayload,
      }, user);
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/dashboard-widgets") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      await domainRepository.createDashboardWidget({
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: user.id,
      });
      await writeSnapshot(response, user, request, 201);
      return true;
    }

    if (companyMatch && request.method === "PATCH") {
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canEditCompanies(user, scopedSnapshot.companyRolePermissions)) {
        sendError(response, 403, "Nemate pravo upravljati tvrtkama.");
        return true;
      }

      const body = await readJsonBody(request);
      assertInScope(scopedSnapshot.companies, companyMatch[1], "Tvrtka nije pronađena.");
      const updated = await domainRepository.updateCompany(companyMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Tvrtka nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (companyMatch && request.method === "DELETE") {
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canDeleteCompanies(user, scopedSnapshot.companyRolePermissions)) {
        sendError(response, 403, "Nemate pravo upravljati tvrtkama.");
        return true;
      }

      assertInScope(scopedSnapshot.companies, companyMatch[1], "Tvrtka nije pronađena.");
      const deleted = await domainRepository.deleteCompany(companyMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Tvrtka nije pronađena.");
        return true;
      }

      await tenantRepository.removeCompanyAssignment(companyMatch[1]);
      await writeSnapshot(response, user, request);
      return true;
    }

    if (locationMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "locations.edit")) {
        sendError(response, 403, "Nemate pravo urediti lokaciju.");
        return true;
      }
      assertInScope(scopedSnapshot.locations, locationMatch[1], "Lokacija nije pronađena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateLocation(locationMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Lokacija nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (locationMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati lokacijama.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.locations, locationMatch[1], "Lokacija nije pronađena.");
      const deleted = await domainRepository.deleteLocation(locationMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Lokacija nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (peopleTrainingRecordMatch && request.method === "PATCH") {
      if (!canManagePeopleTrainingRecords(user) && !(await canUseScopedAppPermission(user, request, "people.manage"))) {
        sendError(response, 403, "Nemate pravo upravljati osposobljavanjima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.peopleTrainingRecords ?? [], peopleTrainingRecordMatch[1], "Evidencija osposobljavanja nije pronađena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updatePersonTrainingRecord(peopleTrainingRecordMatch[1], body);

      if (!updated) {
        sendError(response, 404, "Evidencija osposobljavanja nije pronađena.");
        return true;
      }

      if (body.skipCertificateGeneration !== true) {
        await persistPeopleTrainingCertificates(updated, scopedSnapshot);
      }
      await writeSnapshot(response, user, request);
      return true;
    }

    if (peopleTrainingRecordMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "people.manage"))) {
        sendError(response, 403, "Nemate pravo upravljati osposobljavanjima.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.peopleTrainingRecords ?? [], peopleTrainingRecordMatch[1], "Evidencija osposobljavanja nije pronađena.");
      const deleted = await domainRepository.deletePersonTrainingRecord(peopleTrainingRecordMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Evidencija osposobljavanja nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (workOrderActivityMatch && request.method === "GET") {
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderActivityMatch[1], "Radni nalog nije pronađen.");
      const items = await domainRepository.getWorkOrderActivity(workOrderActivityMatch[1]);
      sendJson(response, 200, { items });
      return true;
    }

    if (workOrderActivityMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo komentirati radne naloge.");
        return true;
      }

      const body = await readJsonBody(request);
      const message = String(body?.message ?? "").trim();

      if (!message) {
        sendError(response, 400, "Komentar ne moze biti prazan.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderActivityMatch[1], "Radni nalog nije pronaden.");
      const mentionUserId = String(body?.mentionUserId ?? "").trim();
      const mentionUser = mentionUserId
        ? (scopedSnapshot.users ?? []).find((entry) => String(entry.id) === mentionUserId)
        : null;
      const items = await domainRepository.addWorkOrderActivityComment(
        workOrderActivityMatch[1],
        {
          message,
          mentionLabel: mentionUser?.fullName || mentionUser?.username || "",
        },
        user,
      );
      sendJson(response, 201, { items });
      return true;
    }

    if (workOrderPdfExportMatch && request.method === "POST") {
      if (!canManageWorkOrders(user) && !isClientPortalUser(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF radnog naloga.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const workOrder = assertInScope(scopedSnapshot.workOrders, workOrderPdfExportMatch[1], "Radni nalog nije pronaden.");
      const templateId = String(body?.templateId ?? "").trim();
      const { pdfBuffer, fileName } = await buildWorkOrderPdfExportPayload(workOrder, scopedSnapshot, templateId);
      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (workOrderPdfSaveMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo spremati PDF radnog naloga.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const workOrder = assertInScope(scopedSnapshot.workOrders, workOrderPdfSaveMatch[1], "Radni nalog nije pronaden.");
      const templateId = String(body?.templateId ?? "").trim();
      const item = await saveGeneratedWorkOrderPdfDocument(workOrderPdfSaveMatch[1], workOrder, scopedSnapshot, user, templateId);
      sendJson(response, 200, { item });
      return true;
    }

    if (workOrderPdfDownloadMatch && request.method === "POST") {
      if (!canManageWorkOrders(user) && !isClientPortalUser(user)) {
        sendError(response, 403, "Nemate pravo preuzeti PDF radnog naloga.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const workOrder = assertInScope(scopedSnapshot.workOrders, workOrderPdfDownloadMatch[1], "Radni nalog nije pronaden.");
      const templateId = String(body?.templateId ?? "").trim();
      const documents = await domainRepository.getWorkOrderDocuments(workOrderPdfDownloadMatch[1]);
      let document = findGeneratedWorkOrderPdfDocument(documents);

      if (!document && canManageWorkOrders(user)) {
        document = await saveGeneratedWorkOrderPdfDocument(workOrderPdfDownloadMatch[1], workOrder, scopedSnapshot, user, templateId);
      }

      if (!document) {
        sendError(response, 404, "PDF radnog naloga jos nije spremljen.");
        return true;
      }

      try {
        const stored = await readStoredDocumentBuffer(document);
        sendBinary(response, 200, stored.buffer, {
          contentType: stored.mimeType || document.fileType || "application/pdf",
          fileName: document.fileName || getWorkOrderPdfExportFileName(workOrder),
        });
      } catch {
        if (!canManageWorkOrders(user)) {
          sendError(response, 404, "Spremljeni PDF radnog naloga nije dostupan.");
          return true;
        }

        document = await saveGeneratedWorkOrderPdfDocument(workOrderPdfDownloadMatch[1], workOrder, scopedSnapshot, user, templateId);
        const stored = await readStoredDocumentBuffer(document);
        sendBinary(response, 200, stored.buffer, {
          contentType: stored.mimeType || document.fileType || "application/pdf",
          fileName: document.fileName || getWorkOrderPdfExportFileName(workOrder),
        });
      }
      return true;
    }

    if (workOrderDocumentsMatch && request.method === "GET") {
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentsMatch[1], "Radni nalog nije pronađen.");
      const items = await domainRepository.getWorkOrderDocuments(workOrderDocumentsMatch[1]);
      sendJson(response, 200, { items });
      return true;
    }

    if (workOrderDocumentsMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo dodavati dokumente na radne naloge.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentsMatch[1], "Radni nalog nije pronađen.");
      const items = await domainRepository.addWorkOrderDocuments(
        workOrderDocumentsMatch[1],
        body.files ?? [],
        user,
        { sourceType: body.sourceType ?? body.source },
      );
      sendJson(response, 201, { items });
      return true;
    }

    if (workOrderDocumentDownloadMatch && request.method === "GET") {
      const { scopedSnapshot } = await getScopedState(user, request);
      const workOrder = assertInScope(scopedSnapshot.workOrders, workOrderDocumentDownloadMatch[1], "Radni nalog nije pronađen.");
      const documents = await domainRepository.getWorkOrderDocuments(workOrderDocumentDownloadMatch[1]);
      const document = documents.find((item) => String(item.id) === String(workOrderDocumentDownloadMatch[2]));

      if (!document) {
        sendError(response, 404, "Dokument nije pronađen.");
        return true;
      }

      const stored = await readStoredDocumentBuffer(document);
      sendBinary(response, 200, stored.buffer, {
        contentType: stored.mimeType || document.fileType || "application/octet-stream",
        fileName: document.fileName || getWorkOrderPdfExportFileName(workOrder),
      });
      return true;
    }

    if (workOrderDocumentMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo uredjivati dokumente na radnim nalozima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentMatch[1], "Radni nalog nije pronađen.");
      const item = await domainRepository.updateWorkOrderDocument(
        workOrderDocumentMatch[1],
        workOrderDocumentMatch[2],
        body,
        user,
      );

      if (!item) {
        sendError(response, 404, "Dokument nije pronađen.");
        return true;
      }

      sendJson(response, 200, { item });
      return true;
    }

    if (workOrderDocumentMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati dokumente na radnim nalozima.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderDocumentMatch[1], "Radni nalog nije pronađen.");
      const deleted = await domainRepository.deleteWorkOrderDocument(
        workOrderDocumentMatch[1],
        workOrderDocumentMatch[2],
        user,
      );

      if (!deleted) {
        sendError(response, 404, "Dokument nije pronađen.");
        return true;
      }

      sendJson(response, 200, { ok: true });
      return true;
    }

    if (workOrderMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati radnim nalozima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const currentWorkOrder = assertInScope(scopedSnapshot.workOrders, workOrderMatch[1], "Radni nalog nije pronađen.");
      const requestedStatus = bodyHasOwnField(body, "status")
        ? normalizeWorkOrderStatusForPermission(body.status)
        : normalizeWorkOrderStatusForPermission(currentWorkOrder.status);
      const missingPermissions = getMissingScopedSnapshotAppPermissions(user, scopedSnapshot, [
        ...getWorkOrderStatusPermissionKeys(currentWorkOrder.status, requestedStatus),
        ...getWorkOrderBillingPermissionKeys(currentWorkOrder, body),
      ]);
      if (missingPermissions.length > 0) {
        sendError(response, 403, "Nemate ovlastenje za trazenu promjenu radnog naloga.");
        return true;
      }
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertServiceCatalogIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateWorkOrder(workOrderMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Radni nalog nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (reminderMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati reminderima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.reminders, reminderMatch[1], "Reminder nije pronađen.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateReminder(reminderMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Reminder nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (todoTaskMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati ToDo zadacima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.todoTasks, todoTaskMatch[1], "ToDo zadatak nije pronađen.");
      const currentTodoTask = scopedSnapshot.todoTasks.find((item) => String(item.id) === String(todoTaskMatch[1])) ?? null;
      const hasRequestedStatus = Object.prototype.hasOwnProperty.call(body, "status");
      const requestedStatus = String(body.status ?? "").trim().toLowerCase();
      const currentStatus = String(currentTodoTask?.status ?? "").trim().toLowerCase();
      const createdByUserId = String(currentTodoTask?.createdByUserId ?? "").trim();
      const currentUserId = String(user?.id ?? "").trim();
      if (
        hasRequestedStatus
        && requestedStatus
        && requestedStatus !== currentStatus
        && createdByUserId
        && createdByUserId !== currentUserId
      ) {
        sendError(response, 403, "Status teme može mijenjati samo osoba koja je otvorila temu.");
        return true;
      }
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      assertWorkOrderPayloadInScope(scopedSnapshot, body);
      const assignedPayload = resolveAssignedUserPayload(scopedSnapshot, body);
      const invitedPayload = resolveTodoInvitedUsersPayload(scopedSnapshot, body);
      const updated = await domainRepository.updateTodoTask(todoTaskMatch[1], {
        ...body,
        ...assignedPayload,
        ...invitedPayload,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "ToDo zadatak nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (offerMatch && request.method === "PATCH") {
      if (!(await canUseScopedAppPermission(user, request, "offers.edit"))) {
        sendError(response, 403, "Nemate pravo uredivati ponude.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.offers, offerMatch[1], "Ponuda nije pronađena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateOffer(offerMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Ponuda nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (purchaseOrderMatch && request.method === "PATCH") {
      if (!(await canUseScopedAppPermission(user, request, "purchaseOrders.edit"))) {
        sendError(response, 403, "Nemate pravo uredivati narudzbenice.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.purchaseOrders, purchaseOrderMatch[1], "Narudzbenica nije pronađena.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updatePurchaseOrder(purchaseOrderMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Narudzbenica nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (riskAssessmentMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user) && !isClientPortalUser(user)) {
        sendError(response, 403, "Nemate pravo upravljati procjenama rizika.");
        return true;
      }

      const rawBody = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const currentRiskAssessment = assertInScope(scopedSnapshot.riskAssessments ?? [], riskAssessmentMatch[1], "Procjena rizika nije pronađena.");
      const body = !canManageWorkOrders(user) && isClientPortalUser(user)
        ? { clientNote: String(rawBody?.clientNote ?? currentRiskAssessment.clientNote ?? "").trim() }
        : rawBody;
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateRiskAssessment(riskAssessmentMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Procjena rizika nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (contractTemplateMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "contracts.create")) {
        sendError(response, 403, "Nemate pravo upravljati templateima ugovora.");
        return true;
      }
      assertInScope(scopedSnapshot.contractTemplates ?? [], contractTemplateMatch[1], "Template ugovora nije pronađen.");
      const updated = await domainRepository.updateContractTemplate(contractTemplateMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Template ugovora nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (contractTemplateMatch && request.method === "DELETE") {
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "contracts.create")) {
        sendError(response, 403, "Nemate pravo upravljati templateima ugovora.");
        return true;
      }

      assertInScope(scopedSnapshot.contractTemplates ?? [], contractTemplateMatch[1], "Template ugovora nije pronađen.");
      await domainRepository.deleteContractTemplate(contractTemplateMatch[1]);
      await writeSnapshot(response, user, request);
      return true;
    }

    if (contractMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "contracts.create")) {
        sendError(response, 403, "Nemate pravo upravljati ugovorima.");
        return true;
      }
      assertInScope(scopedSnapshot.contracts ?? [], contractMatch[1], "Ugovor nije pronađen.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertContractTemplatePayloadInScope(scopedSnapshot, body);
      assertOfferIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateContract(contractMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Ugovor nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (contractMatch && request.method === "DELETE") {
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseScopedSnapshotAppPermission(user, scopedSnapshot, "contracts.create")) {
        sendError(response, 403, "Nemate pravo upravljati ugovorima.");
        return true;
      }

      assertInScope(scopedSnapshot.contracts ?? [], contractMatch[1], "Ugovor nije pronađen.");
      await domainRepository.deleteContract(contractMatch[1]);
      await writeSnapshot(response, user, request);
      return true;
    }

    if (drawingProjectMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati crtezima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.drawings ?? [], drawingProjectMatch[1], "Crtez nije pronaden.");
      assertCompanyPayloadInScope(scopedSnapshot, body);
      assertLocationPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateDrawingProject(drawingProjectMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Crtez nije pronaden.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (drawingProjectMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo upravljati crtezima.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.drawings ?? [], drawingProjectMatch[1], "Crtez nije pronaden.");
      await domainRepository.deleteDrawingProject(drawingProjectMatch[1]);
      await writeSnapshot(response, user, request);
      return true;
    }

    if (offerHtmlDraftPreviewMatch && request.method === "POST") {
      if (!(await canUseAnyScopedAppPermission(user, request, ["offers.create", "offers.edit"]))) {
        sendError(response, 403, "Nemate pravo pregledavati ponude.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const draftOffer = {
        ...(body?.document ?? {}),
        organizationId: scopedSnapshot.activeOrganizationId,
      };
      const preview = await buildOfferHtmlPreviewPayload(draftOffer, scopedSnapshot.activeOrganizationId);
      sendJson(response, 200, { item: preview });
      return true;
    }

    if (offerHtmlPreviewMatch && request.method === "POST") {
      if (!(await canUseAnyScopedAppPermission(user, request, ["offers.view", "offers.edit"])) && !isClientPortalUser(user)) {
        sendError(response, 403, "Nemate pravo pregledavati ponude.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const offer = assertInScope(scopedSnapshot.offers, offerHtmlPreviewMatch[1], "Ponuda nije pronađena.");
      const preview = await buildOfferHtmlPreviewPayload(offer, scopedSnapshot.activeOrganizationId);
      sendJson(response, 200, { item: preview });
      return true;
    }

    if (offerPdfDraftExportMatch && request.method === "POST") {
      if (!(await canUseAnyScopedAppPermission(user, request, ["offers.create", "offers.edit"]))) {
        sendError(response, 403, "Nemate pravo generirati PDF ponude.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const draftOffer = {
        ...(body?.document ?? {}),
        organizationId: scopedSnapshot.activeOrganizationId,
      };
      const { pdfBuffer, fileName } = await buildOfferPdfExportPayload(draftOffer, scopedSnapshot.activeOrganizationId, {
        pdfEngine: body?.pdfEngine,
      });
      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (offerPdfExportMatch && request.method === "POST") {
      if (!(await canUseAnyScopedAppPermission(user, request, ["offers.view", "offers.edit"])) && !isClientPortalUser(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF ponude.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const offer = assertInScope(scopedSnapshot.offers, offerPdfExportMatch[1], "Ponuda nije pronađena.");
      const { pdfBuffer, fileName } = await buildOfferPdfExportPayload(offer, scopedSnapshot.activeOrganizationId, {
        pdfEngine: body?.pdfEngine,
      });
      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (purchaseOrderPdfDraftExportMatch && request.method === "POST") {
      if (!(await canUseAnyScopedAppPermission(user, request, ["purchaseOrders.create", "purchaseOrders.edit"]))) {
        sendError(response, 403, "Nemate pravo generirati PDF narudzbenice.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const draftPurchaseOrder = {
        ...(body?.document ?? {}),
        organizationId: scopedSnapshot.activeOrganizationId,
      };
      const { pdfBuffer, fileName } = await buildPurchaseOrderPdfExportPayload(draftPurchaseOrder, scopedSnapshot.activeOrganizationId);
      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (purchaseOrderPdfExportMatch && request.method === "POST") {
      if (!(await canUseAnyScopedAppPermission(user, request, ["purchaseOrders.view", "purchaseOrders.edit"])) && !isClientPortalUser(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF narudzbenice.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const purchaseOrder = assertInScope(scopedSnapshot.purchaseOrders, purchaseOrderPdfExportMatch[1], "Narudzbenica nije pronađena.");
      const { pdfBuffer, fileName } = await buildPurchaseOrderPdfExportPayload(purchaseOrder, scopedSnapshot.activeOrganizationId);
      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (contractWordExportMatch && request.method === "POST") {
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseAnyScopedSnapshotAppPermission(user, scopedSnapshot, ["contracts.view", "contracts.create"])) {
        sendError(response, 403, "Nemate pravo generirati Word ugovora.");
        return true;
      }
      const contract = assertInScope(scopedSnapshot.contracts ?? [], contractWordExportMatch[1], "Ugovor nije pronađen.");
      const { docxBuffer, fileName } = await buildContractWordExportPayload(contract, scopedSnapshot.activeOrganizationId);
      sendBinary(response, 200, docxBuffer, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName,
      });
      return true;
    }

    if (contractPdfExportMatch && request.method === "POST") {
      const { scopedSnapshot } = await getScopedState(user, request);
      if (!canUseAnyScopedSnapshotAppPermission(user, scopedSnapshot, ["contracts.view", "contracts.create"]) && !isClientPortalUser(user)) {
        sendError(response, 403, "Nemate pravo generirati PDF ugovora.");
        return true;
      }
      const contract = assertInScope(scopedSnapshot.contracts ?? [], contractPdfExportMatch[1], "Ugovor nije pronađen.");
      const { pdfBuffer, fileName } = await buildContractPdfExportPayload(contract, scopedSnapshot.activeOrganizationId);
      sendBinary(response, 200, pdfBuffer, {
        contentType: "application/pdf",
        fileName,
      });
      return true;
    }

    if (offerEmailMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "offers.edit"))) {
        sendError(response, 403, "Nemate pravo slati ponude emailom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const offer = assertInScope(scopedSnapshot.offers, offerEmailMatch[1], "Ponuda nije pronađena.");
      const to = String(body?.to ?? "").trim();
      const cc = String(body?.cc ?? "").trim();

      if (!to) {
        sendError(response, 400, "Email primatelja je obavezan.");
        return true;
      }

      const { pdfBuffer, fileName } = await buildOfferPdfExportPayload(offer, scopedSnapshot.activeOrganizationId);
      const subject = String(body?.subject ?? "").trim() || `${offer.offerNumber || "Ponuda"} · ${offer.title || offer.companyName || "SafeNexus"}`;
      const message = String(body?.message ?? "").trim();
      const htmlMessage = message
        ? message.split(/\r?\n/).map((line) => `<div>${escapeEmailHtml(line)}</div>`).join("")
        : "<div>U privitku saljemo trazenu ponudu.</div>";
      const result = await sendMail({
        to,
        cc: cc || undefined,
        subject,
        text: message || `U privitku saljemo ponudu ${offer.offerNumber || ""}.`,
        html: `
          <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;">
            ${htmlMessage}
            <div style="margin-top:16px;color:#64748b;">SafeNexus · ${escapeEmailHtml(offer.companyName || "")}</div>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      if (!result.ok) {
        sendError(response, 400, result.error || "Slanje emaila nije uspjelo.");
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        message: `Ponuda je poslana na ${to}.`,
      });
      return true;
    }

    if (purchaseOrderEmailMatch && request.method === "POST") {
      if (!(await canUseScopedAppPermission(user, request, "purchaseOrders.edit"))) {
        sendError(response, 403, "Nemate pravo slati narudzbenice emailom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const purchaseOrder = assertInScope(scopedSnapshot.purchaseOrders, purchaseOrderEmailMatch[1], "Narudzbenica nije pronađena.");
      const to = String(body?.to ?? "").trim();
      const cc = String(body?.cc ?? "").trim();

      if (!to) {
        sendError(response, 400, "Email primatelja je obavezan.");
        return true;
      }

      const { pdfBuffer, fileName } = await buildPurchaseOrderPdfExportPayload(purchaseOrder, scopedSnapshot.activeOrganizationId);
      const subject = String(body?.subject ?? "").trim() || `${purchaseOrder.purchaseOrderNumber || "Narudzbenica"} · ${purchaseOrder.title || purchaseOrder.companyName || "SafeNexus"}`;
      const message = String(body?.message ?? "").trim();
      const htmlMessage = message
        ? message.split(/\r?\n/).map((line) => `<div>${escapeEmailHtml(line)}</div>`).join("")
        : "<div>U privitku saljemo trazenu narudzbenicu.</div>";
      const result = await sendMail({
        to,
        cc: cc || undefined,
        subject,
        text: message || `U privitku saljemo narudzbenicu ${purchaseOrder.purchaseOrderNumber || ""}.`,
        html: `
          <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;">
            ${htmlMessage}
            <div style="margin-top:16px;color:#64748b;">SafeNexus · ${escapeEmailHtml(purchaseOrder.companyName || "")}</div>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      if (!result.ok) {
        sendError(response, 400, result.error || "Slanje emaila nije uspjelo.");
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        message: `Narudzbenica je poslana na ${to}.`,
      });
      return true;
    }

    if (vehicleMatch && request.method === "PATCH") {
      if (!(await canUseScopedAppPermission(user, request, "vehicles.create"))) {
        sendError(response, 403, "Nemate pravo upravljati vozilima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.vehicles, vehicleMatch[1], "Vozilo nije pronađeno.");
      const updated = await domainRepository.updateVehicle(vehicleMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Vozilo nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (legalFrameworkMatch && request.method === "PATCH") {
      if (!(await canUseScopedAppPermission(user, request, "legalFramework.edit"))) {
        sendError(response, 403, "Nemate pravo upravljati propisima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.legalFrameworks ?? [], legalFrameworkMatch[1], "Propis nije pronađen.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body, "linkedTemplateIds");
      const updated = await domainRepository.updateLegalFramework(legalFrameworkMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Propis nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (learningTestMatch && request.method === "PATCH") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo upravljati eLearning testovima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.learningTests ?? [], learningTestMatch[1], "Test nije pronađen.");
      const updated = await domainRepository.updateLearningTestItem(learningTestMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Test nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (learningTestAssignmentEmailMatch && request.method === "POST") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo slati pristupe za eLearning testove.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const test = assertInScope(scopedSnapshot.learningTests ?? [], learningTestAssignmentEmailMatch[1], "Test nije pronađen.");
      const assignment = (test.assignmentItems ?? []).find((item) => String(item.id) === String(learningTestAssignmentEmailMatch[2])) ?? null;
      if (!assignment) {
        sendError(response, 404, "Pristup ispitu nije pronađen.");
        return true;
      }

      const to = String(body?.to || assignment.externalEmail || assignment.email || "").trim();
      if (!to) {
        sendError(response, 400, "Osoba nema email za slanje pristupa.");
        return true;
      }

      const forwardedProto = String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim();
      const requestHost = String(request.headers.host || "").trim();
      const requestBaseUrl = requestHost ? `${forwardedProto || "https"}://${requestHost}` : "";
      const accessBaseUrl = publicAppUrl || requestBaseUrl;
      const accessUrl = `${accessBaseUrl.replace(/\/$/, "")}/learning-test.html?token=${encodeURIComponent(String(assignment.accessToken || ""))}`;
      const serviceName = String(body?.serviceName || assignment.serviceName || "").trim();
      const serviceCode = String(body?.serviceCode || "").trim();
      const workOrderNumber = String(body?.workOrderNumber || assignment.workOrderNumber || "").trim();
      const subject = String(body?.subject || "").trim()
        || `Online ispit: ${test.title || serviceName || "osposobljavanje"}`;
      const assigneeName = assignment.externalFullName || assignment.userLabel || "Poštovani";
      const intro = [
        serviceCode || serviceName ? `Dodijeljen vam je online ispit za ${[serviceCode, serviceName].filter(Boolean).join(" - ")}.` : "Dodijeljen vam je online ispit.",
        workOrderNumber ? `Radni nalog: ${workOrderNumber}.` : "",
      ].filter(Boolean).join(" ");

      const result = await sendMail({
        to,
        subject,
        text: `${assigneeName},\n\n${intro}\n\nPristup ispitu: ${accessUrl}\n\nSafeNexus`,
        html: `
          <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;">
            <div>${escapeEmailHtml(assigneeName)},</div>
            <div style="margin-top:12px;">${escapeEmailHtml(intro)}</div>
            <div style="margin-top:18px;">
              <a href="${escapeEmailHtml(accessUrl)}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;">Otvori online ispit</a>
            </div>
            <div style="margin-top:14px;color:#64748b;word-break:break-all;">${escapeEmailHtml(accessUrl)}</div>
            <div style="margin-top:18px;color:#64748b;">SafeNexus</div>
          </div>
        `,
      });

      if (!result.ok) {
        sendError(response, 400, result.error || "Slanje emaila nije uspjelo.");
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        message: `Pristup ispitu je poslan na ${to}.`,
      });
      return true;
    }

    if (measurementEquipmentMatch && request.method === "PATCH") {
      if (!(await canUseScopedAppPermission(user, request, "measurementEquipment.edit"))) {
        sendError(response, 403, "Nemate pravo upravljati mjernom opremom.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.measurementEquipment ?? [], measurementEquipmentMatch[1], "Uređaj nije pronađen.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateMeasurementEquipmentItem(measurementEquipmentMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Uređaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (serviceCatalogMatch && request.method === "PATCH") {
      if (!(await canUseScopedAppPermission(user, request, "serviceCatalog.create"))) {
        sendError(response, 403, "Nemate pravo upravljati uslugama.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.serviceCatalog ?? [], serviceCatalogMatch[1], "Usluga nije pronađena.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateServiceCatalogItem(serviceCatalogMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Usluga nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (safetyAuthorizationMatch && request.method === "PATCH") {
      if (!(await canUseScopedAppPermission(user, request, "safetyAuthorizations.manage"))) {
        sendError(response, 403, "Nemate pravo upravljati ovlaštenjima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.safetyAuthorizations ?? [], safetyAuthorizationMatch[1], "Ovlaštenje nije pronađeno.");
      assertDocumentTemplateIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateSafetyAuthorization(safetyAuthorizationMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      });

      if (!updated) {
        sendError(response, 404, "Ovlaštenje nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (absenceEntryMatch && request.method === "PATCH") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo uređivati odsutnosti.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const current = assertInScope(scopedSnapshot.absenceEntries ?? [], absenceEntryMatch[1], "Odsutnost nije pronađena.");

      if (!canManageAbsenceEntry(user, current) && !scopedSnapshot.appPermissions?.["people.manage"]) {
        sendError(response, 403, "Nemate pravo uređivati ovu odsutnost.");
        return true;
      }

      const isAdmin = canManageMasterData(user) || Boolean(scopedSnapshot.appPermissions?.["people.manage"]);
      const requestedUserId = isAdmin
        ? (normalizeInputValue(body.userId) || String(current.userId))
        : String(current.userId);
      const targetUser = assertInScope(
        scopedSnapshot.users ?? [],
        requestedUserId,
        "Odabrani korisnik nije dostupan za aktivnu organizaciju.",
      );
      const normalizedType = normalizeInputValue(body.type || current.type).toLowerCase();
      const requestedStatus = isAdmin
        ? (normalizeInputValue(body.status).toLowerCase() || String(current.status || "").toLowerCase())
        : (doesAbsenceTypeRequireApproval(normalizedType) ? String(current.status || "pending").toLowerCase() : "approved");
      const actorLabel = getScopedUserDisplayLabel(user);
      const approvedMeta = requestedStatus === "approved"
        ? {
          approvedByUserId: String(user.id),
          approvedByLabel: actorLabel,
          approvedAt: new Date().toISOString(),
        }
        : (requestedStatus === "pending"
          ? {
            approvedByUserId: "",
            approvedByLabel: "",
            approvedAt: null,
          }
          : {
            approvedByUserId: isAdmin ? String(user.id) : String(current.approvedByUserId ?? ""),
            approvedByLabel: isAdmin ? actorLabel : String(current.approvedByLabel ?? ""),
            approvedAt: isAdmin ? new Date().toISOString() : current.approvedAt,
          });

      const updated = await domainRepository.updateAbsenceEntry(absenceEntryMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: String(targetUser.id),
        userLabel: getScopedUserDisplayLabel(targetUser),
        status: requestedStatus,
        requestedByUserId: String(current.requestedByUserId || user.id),
        requestedByLabel: current.requestedByLabel || actorLabel,
        ...approvedMeta,
      });

      if (!updated) {
        sendError(response, 404, "Odsutnost nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (documentTemplateMatch && request.method === "PATCH") {
      if (!(await canUseScopedAppPermission(user, request, "documentTemplates.create"))) {
        sendError(response, 403, "Nemate pravo upravljati templateima.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], documentTemplateMatch[1], "Template nije pronađen.");
      assertSampleCompanyPayloadInScope(scopedSnapshot, body);
      assertSampleLocationPayloadInScope(scopedSnapshot, body);
      assertLegalFrameworkIdsPayloadInScope(scopedSnapshot, body);
      const updated = await domainRepository.updateDocumentTemplate(documentTemplateMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
      }, user);

      if (!updated) {
        sendError(response, 404, "Template nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleReservationMatch && request.method === "PATCH") {
      if (!(await canUseScopedAppPermission(user, request, "vehicles.reserve"))) {
        sendError(response, 403, "Nemate pravo upravljati rezervacijama vozila.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      const vehicle = assertInScope(scopedSnapshot.vehicles, vehicleReservationMatch[1], "Vozilo nije pronađeno.");
      assertInScope(vehicle.reservations ?? [], vehicleReservationMatch[2], "Rezervacija vozila nije pronađena.");
      const reservationUserPayload = resolveVehicleReservationUserPayload(scopedSnapshot, body);
      const updated = await domainRepository.updateVehicleReservation(vehicle.id, vehicleReservationMatch[2], {
        ...body,
        ...reservationUserPayload,
      }, user);

      if (!updated) {
        sendError(response, 404, "Rezervacija vozila nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (dashboardWidgetMatch && request.method === "PATCH") {
      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.dashboardWidgets, dashboardWidgetMatch[1], "Dashboard kartica nije pronađena.");
      const updated = await domainRepository.updateDashboardWidget(dashboardWidgetMatch[1], {
        ...body,
        organizationId: scopedSnapshot.activeOrganizationId,
        userId: user.id,
      });

      if (!updated) {
        sendError(response, 404, "Dashboard kartica nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (workOrderMatch && request.method === "DELETE") {
      if (!canDeleteWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati radne naloge.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.workOrders, workOrderMatch[1], "Radni nalog nije pronađen.");
      const deleted = await domainRepository.deleteWorkOrder(workOrderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Radni nalog nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (reminderMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati remindere.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.reminders, reminderMatch[1], "Reminder nije pronađen.");
      const deleted = await domainRepository.deleteReminder(reminderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Reminder nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (todoTaskCommentMatch && request.method === "POST") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo komunicirati kroz ToDo.");
        return true;
      }

      const body = await readJsonBody(request);
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.todoTasks, todoTaskCommentMatch[1], "ToDo zadatak nije pronađen.");
      const updated = await domainRepository.addTodoTaskComment(todoTaskCommentMatch[1], body, user);

      if (!updated) {
        sendError(response, 404, "ToDo zadatak nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (todoTaskMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati ToDo zadatke.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.todoTasks, todoTaskMatch[1], "ToDo zadatak nije pronađen.");
      const deleted = await domainRepository.deleteTodoTask(todoTaskMatch[1]);

      if (!deleted) {
        sendError(response, 404, "ToDo zadatak nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (offerMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "offers.edit"))) {
        sendError(response, 403, "Nemate pravo brisati ponude.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.offers, offerMatch[1], "Ponuda nije pronađena.");
      const deleted = await domainRepository.deleteOffer(offerMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Ponuda nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (purchaseOrderMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "purchaseOrders.edit"))) {
        sendError(response, 403, "Nemate pravo brisati narudzbenice.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.purchaseOrders, purchaseOrderMatch[1], "Narudzbenica nije pronađena.");
      const deleted = await domainRepository.deletePurchaseOrder(purchaseOrderMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Narudzbenica nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (riskAssessmentMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati procjene rizika.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.riskAssessments ?? [], riskAssessmentMatch[1], "Procjena rizika nije pronađena.");
      const deleted = await domainRepository.deleteRiskAssessment(riskAssessmentMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Procjena rizika nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "vehicles.create"))) {
        sendError(response, 403, "Nemate pravo brisati vozila.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.vehicles, vehicleMatch[1], "Vozilo nije pronađeno.");
      const deleted = await domainRepository.deleteVehicle(vehicleMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Vozilo nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (legalFrameworkMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "legalFramework.edit"))) {
        sendError(response, 403, "Nemate pravo brisati propise.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.legalFrameworks ?? [], legalFrameworkMatch[1], "Propis nije pronađen.");
      const deleted = await domainRepository.deleteLegalFramework(legalFrameworkMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Propis nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (learningTestMatch && request.method === "DELETE") {
      if (!canManageMasterData(user)) {
        sendError(response, 403, "Nemate pravo brisati eLearning testove.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.learningTests ?? [], learningTestMatch[1], "Test nije pronađen.");
      const deleted = await domainRepository.deleteLearningTestItem(learningTestMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Test nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (measurementEquipmentMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "measurementEquipment.edit"))) {
        sendError(response, 403, "Nemate pravo brisati mjernu opremu.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.measurementEquipment ?? [], measurementEquipmentMatch[1], "Uređaj nije pronađen.");
      const deleted = await domainRepository.deleteMeasurementEquipmentItem(measurementEquipmentMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Uređaj nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (serviceCatalogMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "serviceCatalog.create"))) {
        sendError(response, 403, "Nemate pravo brisati usluge.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.serviceCatalog ?? [], serviceCatalogMatch[1], "Usluga nije pronađena.");
      const deleted = await domainRepository.deleteServiceCatalogItem(serviceCatalogMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Usluga nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (safetyAuthorizationMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "safetyAuthorizations.manage"))) {
        sendError(response, 403, "Nemate pravo brisati ovlaštenja.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.safetyAuthorizations ?? [], safetyAuthorizationMatch[1], "Ovlaštenje nije pronađeno.");
      const deleted = await domainRepository.deleteSafetyAuthorization(safetyAuthorizationMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Ovlaštenje nije pronađeno.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (absenceEntryMatch && request.method === "DELETE") {
      if (!canManageWorkOrders(user)) {
        sendError(response, 403, "Nemate pravo brisati odsutnosti.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const current = assertInScope(scopedSnapshot.absenceEntries ?? [], absenceEntryMatch[1], "Odsutnost nije pronađena.");
      const canDeleteOwnPending = String(current.userId ?? "") === String(user.id ?? "")
        && String(current.status ?? "").toLowerCase() === "pending";

      if (!canManageMasterData(user) && !scopedSnapshot.appPermissions?.["people.manage"] && !canDeleteOwnPending) {
        sendError(response, 403, "Nemate pravo brisati ovu odsutnost.");
        return true;
      }

      const deleted = await domainRepository.deleteAbsenceEntry(absenceEntryMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Odsutnost nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (documentTemplateMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "documentTemplates.create"))) {
        sendError(response, 403, "Nemate pravo brisati templatee.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.documentTemplates ?? [], documentTemplateMatch[1], "Template nije pronađen.");
      const deleted = await domainRepository.deleteDocumentTemplate(documentTemplateMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Template nije pronađen.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (vehicleReservationMatch && request.method === "DELETE") {
      if (!(await canUseScopedAppPermission(user, request, "vehicles.reserve"))) {
        sendError(response, 403, "Nemate pravo brisati rezervacije vozila.");
        return true;
      }

      const { scopedSnapshot } = await getScopedState(user, request);
      const vehicle = assertInScope(scopedSnapshot.vehicles, vehicleReservationMatch[1], "Vozilo nije pronađeno.");
      assertInScope(vehicle.reservations ?? [], vehicleReservationMatch[2], "Rezervacija vozila nije pronađena.");
      const deleted = await domainRepository.deleteVehicleReservation(vehicle.id, vehicleReservationMatch[2]);

      if (!deleted) {
        sendError(response, 404, "Rezervacija vozila nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }

    if (dashboardWidgetMatch && request.method === "DELETE") {
      const { scopedSnapshot } = await getScopedState(user, request);
      assertInScope(scopedSnapshot.dashboardWidgets, dashboardWidgetMatch[1], "Dashboard kartica nije pronađena.");
      const deleted = await domainRepository.deleteDashboardWidget(dashboardWidgetMatch[1]);

      if (!deleted) {
        sendError(response, 404, "Dashboard kartica nije pronađena.");
        return true;
      }

      await writeSnapshot(response, user, request);
      return true;
    }
  } catch (error) {
    sendError(response, error.statusCode ?? 400, error.message || "Request failed.");
    return true;
  }

  return false;
}

async function readOptionalFile(filePath) {
  try {
    return await readFile(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function getStaticCacheHeaders(url, pathname, extension) {
  if (pathname === "/index.html" || extension === ".html") {
    return NO_STORE_HEADERS;
  }

  if (url.searchParams.has("v") || pathname.startsWith("/assets/vendor/")) {
    return STATIC_IMMUTABLE_HEADERS;
  }

  if (pathname.startsWith("/assets/")) {
    return STATIC_ASSET_HEADERS;
  }

  return NO_STORE_HEADERS;
}

async function getStaticFileRecord(filePath, extension) {
  const cacheKey = `${filePath}:${extension}`;
  if (staticFileCache.has(cacheKey)) {
    return staticFileCache.get(cacheKey);
  }

  const shouldLoadCompressedVariants = staticRoot === distDir && COMPRESSIBLE_STATIC_EXTENSIONS.has(extension);
  const [body, brotliBody, gzipBody] = await Promise.all([
    readFile(filePath),
    shouldLoadCompressedVariants ? readOptionalFile(`${filePath}.br`) : Promise.resolve(null),
    shouldLoadCompressedVariants ? readOptionalFile(`${filePath}.gz`) : Promise.resolve(null),
  ]);

  const record = {
    body,
    contentType: contentTypes[extension] ?? "application/octet-stream",
    etag: buildWeakEtag(body),
    brotliBody,
    brotliEtag: brotliBody ? buildWeakEtag(brotliBody, "-br") : "",
    gzipBody,
    gzipEtag: gzipBody ? buildWeakEtag(gzipBody, "-gz") : "",
  };

  staticFileCache.set(cacheKey, record);
  return record;
}

function resolveStaticFileVariant(request, record) {
  if (record.brotliBody && acceptsEncoding(request, "br")) {
    return {
      body: record.brotliBody,
      contentEncoding: "br",
      etag: record.brotliEtag,
    };
  }

  if (record.gzipBody && acceptsEncoding(request, "gzip")) {
    return {
      body: record.gzipBody,
      contentEncoding: "gzip",
      etag: record.gzipEtag,
    };
  }

  return {
    body: record.body,
    contentEncoding: "",
    etag: record.etag,
  };
}

function requestMatchesEtag(request, etag = "") {
  if (!etag) {
    return false;
  }

  const requestedValue = String(request?.headers?.["if-none-match"] ?? "")
    .split(",")
    .map((entry) => entry.trim());

  return requestedValue.includes("*") || requestedValue.includes(etag);
}

function sendStaticFile(request, response, record, headers = {}) {
  const variant = resolveStaticFileVariant(request, record);

  if (requestMatchesEtag(request, variant.etag)) {
    response.statusCode = 304;
    response.setHeader("ETag", variant.etag);
    Object.entries(headers).forEach(([headerName, headerValue]) => {
      if (headerValue !== undefined && headerValue !== null && headerValue !== "") {
        response.setHeader(headerName, headerValue);
      }
    });
    if (variant.contentEncoding) {
      appendVaryHeader(response, "Accept-Encoding");
    }
    response.end();
    return;
  }

  writeBufferResponse(response, 200, variant.body, {
    contentType: record.contentType,
    contentEncoding: variant.contentEncoding,
    etag: variant.etag,
    headers,
  });
}

async function handleStaticRequest(request, response, url) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = resolve(staticRoot, `.${pathname}`);
  const isSafePath = filePath === staticRoot || filePath.startsWith(`${staticRoot}${sep}`);

  if (!isSafePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    const extension = extname(filePath);
    const record = await getStaticFileRecord(filePath, extension);
    sendStaticFile(request, response, record, getStaticCacheHeaders(url, pathname, extension));
  } catch (error) {
    if (pathname !== "/index.html" && !extname(pathname)) {
      const indexFilePath = resolve(staticRoot, "index.html");
      const indexRecord = await getStaticFileRecord(indexFilePath, ".html");
      sendStaticFile(request, response, indexRecord, NO_STORE_HEADERS);
      return;
    }

    response.writeHead(error.code === "ENOENT" ? 404 : 500, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(error.code === "ENOENT" ? "Not found" : "Server error");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  response[responseRequestSymbol] = request;
  setSecurityHeaders(response, request);

  const canonicalRedirectTarget = getCanonicalRedirectTarget(request, url);
  if (canonicalRedirectTarget) {
    redirect(response, canonicalRedirectTarget, 308);
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/login-form") {
    try {
      const body = await readFormBody(request);
      const user = await tenantRepository.authenticateUser(body.email ?? body.username, body.password);

      if (!user) {
        redirect(response, "/?loginError=invalid");
        return;
      }

      const accessToken = createAccessToken(user, jwtSecret);
      const refreshToken = createRefreshToken(user, jwtSecret);

      await tenantRepository.storeRefreshToken(user, refreshToken, {
        ipAddress: getClientIp(request),
        userAgent: request.headers["user-agent"] ?? "",
      });

      appendResponseCookies(response, createAuthCookies({
        accessToken,
        refreshToken,
        secure: shouldUseSecureCookies(request),
        domain: resolveAuthCookieDomain(request),
      }));

      redirect(response, "/");
      return;
    } catch (error) {
      console.error("Form login failed.", error);
      redirect(response, "/?loginError=server");
      return;
    }
  }

  if (url.pathname.startsWith("/api/")) {
    const handled = await handleApiRequest(request, response, url);

    if (!handled) {
      sendError(response, 404, "Endpoint not found.");
    }

    return;
  }

  await handleStaticRequest(request, response, url);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}, shutting down...`);
  if (scheduledProfileReportsTimer) {
    clearInterval(scheduledProfileReportsTimer);
    scheduledProfileReportsTimer = null;
  }

  server.close(async () => {
    try {
      await Promise.all([
        domainRepository.close?.(),
        tenantRepository.close?.(),
      ]);
      process.exit(0);
    } catch (error) {
      console.error("Failed to close repository cleanly.", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

startScheduledProfileReports();

server.listen(port, () => {
  console.log(`SelfDash workspace live at http://localhost:${port} (${domainRepository.kind})`);
});
