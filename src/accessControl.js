export const ROLE_SUPER_ADMIN = "super_admin";
export const ROLE_ADMIN = "admin";
export const ROLE_USER = "user";

const ROLE_PRIORITY = {
  [ROLE_USER]: 1,
  [ROLE_ADMIN]: 2,
  [ROLE_SUPER_ADMIN]: 3,
};

const FALLBACK_LOGIN_CONTENT = {
  heading: "What's your team saying?",
  quoteText: "Bring clients, locations and work orders into one secure workspace your whole organization can trust.",
  authorName: "Safety360",
  authorTitle: "Multi-tenant operations workspace",
  featureTitle: "One platform for every client portfolio",
  featureBody: "Super admins manage tenants, organization admins manage their teams, and users stay focused on day-to-day execution.",
  accentLabel: "Trusted workflow",
};

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeOrganizationIds(values = []) {
  const entries = Array.isArray(values) ? values : [values];
  return Array.from(new Set(
    entries
      .map((value) => normalizeText(value))
      .filter(Boolean),
  ));
}

function getActorOrganizationIds(actor) {
  return normalizeOrganizationIds([
    actor?.organizationId,
    ...(Array.isArray(actor?.organizationIds) ? actor.organizationIds : []),
  ]);
}

function hasOrganizationAccess(actor, organizationId) {
  return getActorOrganizationIds(actor).includes(normalizeText(organizationId));
}

export function normalizeRole(value) {
  const raw = normalizeText(value).toLowerCase();

  if (raw === ROLE_SUPER_ADMIN || raw === "superadmin") {
    return ROLE_SUPER_ADMIN;
  }

  if (raw === ROLE_ADMIN || raw === "administrator") {
    return ROLE_ADMIN;
  }

  return ROLE_USER;
}

export function roleLabel(role) {
  const normalized = normalizeRole(role);

  if (normalized === ROLE_SUPER_ADMIN) {
    return "Super Admin";
  }

  if (normalized === ROLE_ADMIN) {
    return "Admin";
  }

  return "User";
}

export function buildLegacyEmail(username, id = "") {
  const normalized = normalizeText(username)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "")
    .toLowerCase();

  const localPart = normalized || `user${id || "local"}`;
  return `${localPart}${id ? `.${id}` : ""}@legacy.safety360.local`;
}

export function splitFullName(fullName) {
  const normalized = normalizeText(fullName);

  if (!normalized) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const parts = normalized.split(/\s+/);
  const firstName = parts.shift() ?? "";

  return {
    firstName,
    lastName: parts.join(" "),
  };
}

export function canManageOrganizations(actor) {
  return normalizeRole(actor?.role) === ROLE_SUPER_ADMIN;
}

export function canEditOrganization(actor, organizationId) {
  const actorRole = normalizeRole(actor?.role);

  if (actorRole === ROLE_SUPER_ADMIN) {
    return true;
  }

  if (actorRole !== ROLE_ADMIN) {
    return false;
  }

  return hasOrganizationAccess(actor, organizationId);
}

export function canManageLoginContent(actor) {
  return normalizeRole(actor?.role) === ROLE_SUPER_ADMIN;
}

export function canManageOrganizationUsers(actor, organizationId, targetRole = ROLE_USER) {
  const actorRole = normalizeRole(actor?.role);
  const targetNormalizedRole = normalizeRole(targetRole);
  const targetOrganizationIds = normalizeOrganizationIds(organizationId);

  if (actorRole === ROLE_SUPER_ADMIN) {
    return true;
  }

  if (actorRole !== ROLE_ADMIN) {
    return false;
  }

  if (targetOrganizationIds.length === 0) {
    return false;
  }

  if (!targetOrganizationIds.every((id) => hasOrganizationAccess(actor, id))) {
    return false;
  }

  return ROLE_PRIORITY[targetNormalizedRole] < ROLE_PRIORITY[ROLE_SUPER_ADMIN];
}

export function resolveEffectiveOrganizationId(actor, requestedOrganizationId, organizations = []) {
  const actorRole = normalizeRole(actor?.role);
  const availableIds = organizations.map((organization) => String(organization.id));
  const requested = normalizeText(requestedOrganizationId);
  const actorOrganizationIds = getActorOrganizationIds(actor)
    .filter((organizationId) => availableIds.includes(organizationId));

  if (actorRole !== ROLE_SUPER_ADMIN) {
    if (requested && actorOrganizationIds.includes(requested)) {
      return requested;
    }

    return actorOrganizationIds[0] ?? "";
  }

  if (requested && availableIds.includes(requested)) {
    return requested;
  }

  const actorOrganizationId = actorOrganizationIds[0] ?? "";

  if (actorOrganizationId && availableIds.includes(actorOrganizationId)) {
    return actorOrganizationId;
  }

  return availableIds[0] ?? "";
}

export function canManageMasterData(actor) {
  const actorRole = normalizeRole(actor?.role);
  return actorRole === ROLE_SUPER_ADMIN || actorRole === ROLE_ADMIN;
}

export function canManageWorkOrders(actor) {
  return [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_USER].includes(normalizeRole(actor?.role));
}

export function canDeleteWorkOrders(actor) {
  return canManageMasterData(actor);
}

export function pickLoginContent(items) {
  const activeItems = (items ?? []).filter((item) => item && item.isActive !== false);

  if (activeItems.length === 0) {
    return { ...FALLBACK_LOGIN_CONTENT };
  }

  const index = Math.floor(Math.random() * activeItems.length);
  return activeItems[index];
}

export function toBooleanFlag(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeText(value).toLowerCase();

  if (["false", "0", "ne", "inactive", "disabled"].includes(normalized)) {
    return false;
  }

  if (["true", "1", "da", "active", "enabled"].includes(normalized)) {
    return true;
  }

  return fallback;
}
