export const ROLE_SUPER_ADMIN = "super_admin";
export const ROLE_ADMIN = "admin";
export const ROLE_USER = "user";
export const USER_PROFILE_ROLE_VALUES = Object.freeze([
  "new_user",
  "junior_user",
  "senior_user",
  "leand_user",
  "manager",
  "admin",
]);

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

const COMPANY_PERMISSIONS_NONE = Object.freeze({
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
});

const COMPANY_PERMISSIONS_FULL = Object.freeze({
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
});

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

export function normalizeUserProfileRole(value, fallback = "new_user") {
  const normalized = normalizeText(value).toLowerCase();
  if (USER_PROFILE_ROLE_VALUES.includes(normalized)) {
    return normalized;
  }

  const fallbackNormalized = normalizeText(fallback).toLowerCase();
  return USER_PROFILE_ROLE_VALUES.includes(fallbackNormalized) ? fallbackNormalized : "new_user";
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
  return normalizeRole(actor?.role) === ROLE_SUPER_ADMIN;
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

  if (targetNormalizedRole !== ROLE_USER) {
    return false;
  }

  if (targetOrganizationIds.length === 0) {
    return false;
  }

  if (!targetOrganizationIds.every((id) => hasOrganizationAccess(actor, id))) {
    return false;
  }
  return true;
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

function normalizeCompanyPermissionFlags(value = {}) {
  const source = value && typeof value === "object"
    ? value
    : {};
  const canViewRaw = toBooleanFlag(source.canView ?? source.view, false);
  const canCreateRaw = toBooleanFlag(source.canCreate ?? source.create, false);
  const canEditRaw = toBooleanFlag(source.canEdit ?? source.edit, false);
  const canDeleteRaw = toBooleanFlag(source.canDelete ?? source.delete, false);
  const canView = canViewRaw || canCreateRaw || canEditRaw || canDeleteRaw;
  const canCreate = canCreateRaw;
  const canEdit = canEditRaw || canDeleteRaw;
  const canDelete = canDeleteRaw;

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
}

export function normalizeCompanyRolePermissionEntry(entry = {}, fallbackProfileRole = "new_user") {
  const source = entry && typeof entry === "object"
    ? entry
    : {};

  return {
    profileRole: normalizeUserProfileRole(
      source.profileRole ?? source.profile_role ?? source.role,
      fallbackProfileRole,
    ),
    ...normalizeCompanyPermissionFlags(source),
  };
}

export function normalizeCompanyRolePermissions(entries = []) {
  const list = Array.isArray(entries) ? entries : [];
  const byRole = new Map(
    USER_PROFILE_ROLE_VALUES.map((profileRole) => [profileRole, { profileRole, ...COMPANY_PERMISSIONS_NONE }]),
  );

  list.forEach((entry) => {
    const normalized = normalizeCompanyRolePermissionEntry(entry);
    byRole.set(normalized.profileRole, normalized);
  });

  return USER_PROFILE_ROLE_VALUES.map((profileRole) => ({
    ...(byRole.get(profileRole) ?? { profileRole, ...COMPANY_PERMISSIONS_NONE }),
  }));
}

export function resolveCompanyPermissionsForActor(actor, rolePermissions = []) {
  const actorRole = normalizeRole(actor?.role);

  if (actorRole === ROLE_SUPER_ADMIN || actorRole === ROLE_ADMIN) {
    return { ...COMPANY_PERMISSIONS_FULL };
  }

  const profileRole = normalizeUserProfileRole(actor?.profileRole ?? actor?.profile_role, "new_user");
  const normalizedPermissions = normalizeCompanyRolePermissions(rolePermissions);
  const roleEntry = normalizedPermissions.find((entry) => entry.profileRole === profileRole)
    ?? { profileRole, ...COMPANY_PERMISSIONS_NONE };

  return {
    canView: Boolean(roleEntry.canView),
    canCreate: Boolean(roleEntry.canCreate),
    canEdit: Boolean(roleEntry.canEdit),
    canDelete: Boolean(roleEntry.canDelete),
  };
}

export function canViewCompanies(actor, rolePermissions = []) {
  return resolveCompanyPermissionsForActor(actor, rolePermissions).canView;
}

export function canCreateCompanies(actor, rolePermissions = []) {
  return resolveCompanyPermissionsForActor(actor, rolePermissions).canCreate;
}

export function canEditCompanies(actor, rolePermissions = []) {
  return resolveCompanyPermissionsForActor(actor, rolePermissions).canEdit;
}

export function canDeleteCompanies(actor, rolePermissions = []) {
  return resolveCompanyPermissionsForActor(actor, rolePermissions).canDelete;
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
