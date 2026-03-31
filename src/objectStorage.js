import crypto from "node:crypto";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function clean(value = "") {
  return String(value ?? "").trim();
}

function trimSlashes(value = "") {
  return clean(value).replace(/^\/+|\/+$/g, "");
}

function trimTrailingSlashes(value = "") {
  return clean(value).replace(/\/+$/g, "");
}

function sanitizeObjectSegment(value = "", fallback = "file") {
  const normalized = clean(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");

  return normalized || fallback;
}

function normalizeObjectPrefix(value = "") {
  return trimSlashes(value)
    .split("/")
    .map((segment) => sanitizeObjectSegment(segment, "part"))
    .filter(Boolean)
    .join("/");
}

function parseDataUrl(dataUrl = "") {
  const raw = clean(dataUrl);
  const match = raw.match(/^data:([^;,]+)?(;base64)?,([\s\S]+)$/i);

  if (!match) {
    throw new Error("Datoteka nije u ispravnom formatu za upload.");
  }

  const mimeType = clean(match[1]) || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? "";

  return {
    mimeType,
    buffer: isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8"),
  };
}

function inferDefaultEndpoint(region = "") {
  const normalizedRegion = clean(region);
  return normalizedRegion ? `https://${normalizedRegion}.digitaloceanspaces.com` : "";
}

function inferDefaultPublicBaseUrl(bucket = "", region = "") {
  const normalizedBucket = clean(bucket);
  const normalizedRegion = clean(region);
  return normalizedBucket && normalizedRegion
    ? `https://${normalizedBucket}.${normalizedRegion}.cdn.digitaloceanspaces.com`
    : "";
}

export function getObjectStorageConfig() {
  const bucket = clean(process.env.SPACES_BUCKET);
  const region = clean(process.env.SPACES_REGION) || "fra1";
  const endpoint = trimTrailingSlashes(process.env.SPACES_ENDPOINT) || inferDefaultEndpoint(region);
  const publicBaseUrl = trimTrailingSlashes(process.env.SPACES_PUBLIC_URL_BASE)
    || inferDefaultPublicBaseUrl(bucket, region);
  const accessKeyId = clean(process.env.SPACES_ACCESS_KEY);
  const secretAccessKey = clean(process.env.SPACES_SECRET_KEY);

  return {
    provider: "digitalocean-spaces",
    bucket,
    region,
    endpoint,
    publicBaseUrl,
    accessKeyId,
    secretAccessKey,
    enabled: Boolean(bucket && endpoint && accessKeyId && secretAccessKey),
  };
}

let cachedClientKey = "";
let cachedClient = null;

function getObjectStorageClient() {
  const config = getObjectStorageConfig();

  if (!config.enabled) {
    return null;
  }

  const nextCacheKey = JSON.stringify({
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  if (cachedClient && cachedClientKey === nextCacheKey) {
    return cachedClient;
  }

  cachedClientKey = nextCacheKey;
  cachedClient = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: false,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedClient;
}

export function buildObjectStoragePublicUrl(storageKey = "", config = getObjectStorageConfig()) {
  const key = trimSlashes(storageKey);
  const baseUrl = trimTrailingSlashes(config.publicBaseUrl);

  if (!baseUrl || !key) {
    return "";
  }

  return `${baseUrl}/${key}`;
}

export async function uploadDataUrlToObjectStorage({
  keyPrefix = "",
  fileName = "",
  fileType = "",
  dataUrl = "",
  cacheControl = "public, max-age=31536000, immutable",
} = {}) {
  const config = getObjectStorageConfig();
  const client = getObjectStorageClient();

  if (!client || !config.enabled) {
    return null;
  }

  const rawDataUrl = clean(dataUrl);

  if (!rawDataUrl.startsWith("data:")) {
    return null;
  }

  const { mimeType, buffer } = parseDataUrl(rawDataUrl);
  const safeFileName = sanitizeObjectSegment(fileName || "file");
  const normalizedPrefix = normalizeObjectPrefix(keyPrefix);
  const key = `${normalizedPrefix ? `${normalizedPrefix}/` : ""}${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ACL: "public-read",
    ContentType: clean(fileType) || mimeType || "application/octet-stream",
    CacheControl: cacheControl,
  }));

  return {
    storageProvider: config.provider,
    storageBucket: config.bucket,
    storageRegion: config.region,
    storageKey: key,
    storageUrl: buildObjectStoragePublicUrl(key, config),
  };
}

export async function deleteObjectFromStorage(storage = {}) {
  const config = getObjectStorageConfig();
  const client = getObjectStorageClient();
  const key = trimSlashes(storage.storageKey ?? storage.key);

  if (!client || !config.enabled || !key) {
    return false;
  }

  try {
    await client.send(new DeleteObjectCommand({
      Bucket: clean(storage.storageBucket ?? storage.bucket) || config.bucket,
      Key: key,
    }));
    return true;
  } catch {
    return false;
  }
}
