import nodemailer from "nodemailer";

function getTrimmedEnv(name) {
  return String(process.env[name] ?? "").trim();
}

function getSmtpConfig() {
  const host = getTrimmedEnv("SMTP_HOST");
  const port = Number(getTrimmedEnv("SMTP_PORT") || 587);
  const user = getTrimmedEnv("SMTP_USER");
  const pass = getTrimmedEnv("SMTP_PASS");
  const secure = getTrimmedEnv("SMTP_SECURE").toLowerCase() === "true" || port === 465;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  };
}

let cachedTransport = null;
let cachedConfigKey = "";

function getTransport() {
  const config = getSmtpConfig();

  if (!config) {
    return null;
  }

  const configKey = JSON.stringify(config);

  if (!cachedTransport || cachedConfigKey !== configKey) {
    cachedTransport = nodemailer.createTransport(config);
    cachedConfigKey = configKey;
  }

  return cachedTransport;
}

export function isMailerConfigured() {
  return Boolean(getTransport());
}

export async function sendMail(message) {
  const transport = getTransport();

  if (!transport) {
    return {
      ok: false,
      skipped: true,
      error: "SMTP nije konfiguriran.",
    };
  }

  const fromAddress = getTrimmedEnv("SMTP_FROM") || getTrimmedEnv("SMTP_USER");

  if (!fromAddress) {
    return {
      ok: false,
      skipped: true,
      error: "SMTP_FROM nije konfiguriran.",
    };
  }

  try {
    const info = await transport.sendMail({
      from: fromAddress,
      ...message,
    });

    return {
      ok: true,
      skipped: false,
      messageId: info.messageId ?? "",
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error: error.message || "Slanje emaila nije uspjelo.",
    };
  }
}

export function resolveSignupNotifyRecipients(fallbackRecipients = []) {
  const explicit = getTrimmedEnv("SIGNUP_NOTIFY_TO");

  if (explicit) {
    return explicit
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }

  return Array.from(new Set(
    fallbackRecipients
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean),
  ));
}
