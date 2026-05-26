export const ROLE_SUPER_ADMIN = "super_admin";
export const ROLE_ADMIN = "admin";
export const ROLE_USER = "user";
export const USER_PROFILE_ROLE_VALUES = Object.freeze([
  "client_user",
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
export const COMPANY_PERMISSION_SCOPE_GENERAL = "__general__";

export const APP_ROLE_PERMISSION_DEFINITIONS = Object.freeze([
  Object.freeze({ key: "settings.manage", label: "Promjene podataka u Settings" }),
  Object.freeze({ key: "measurementEquipment.view", label: "Prikaz mjerne opreme" }),
  Object.freeze({ key: "measurementEquipment.create", label: "Dodavanje mjerne opreme" }),
  Object.freeze({ key: "measurementEquipment.edit", label: "Uredivanje mjerne opreme" }),
  Object.freeze({ key: "vehicles.reserve", label: "Rezerviranje automobila" }),
  Object.freeze({ key: "vehicles.create", label: "Dodavanje automobila" }),
  Object.freeze({ key: "vehicles.view", label: "Prikaz automobila" }),
  Object.freeze({ key: "legalFramework.view", label: "Prikaz zakonske regulative" }),
  Object.freeze({ key: "legalFramework.edit", label: "Uredivanje regulative" }),
  Object.freeze({ key: "serviceCatalog.view", label: "Prikaz usluga" }),
  Object.freeze({ key: "serviceCatalog.create", label: "Dodavanje novih usluga" }),
  Object.freeze({ key: "documentTemplates.create", label: "Izrada Template" }),
  Object.freeze({ key: "people.manage", label: "Uredivanje ljudskih resursa" }),
  Object.freeze({ key: "safetyAuthorizations.manage", label: "Uredivanje ovlastenja" }),
  Object.freeze({ key: "jobs.view", label: "Prikaz Jobs kataloga" }),
  Object.freeze({ key: "jobs.manage", label: "Dodavanje i uredivanje Jobs poslova" }),
  Object.freeze({ key: "jobs.nexai.use", label: "Korištenje NexAI prijedloga u Jobs" }),
  Object.freeze({ key: "jobs.nexai.manage", label: "Uredivanje Jobs NexAI uputa" }),
  Object.freeze({ key: "workOrders.create", label: "Otvaranje radnih naloga" }),
  Object.freeze({ key: "workOrders.changeStatus", label: "Promjena statusa radnih naloga" }),
  Object.freeze({ key: "workOrders.cancel", label: "Storno radnih naloga" }),
  Object.freeze({ key: "workOrders.restoreCancelled", label: "Vracanje radnih naloga iz storna" }),
  Object.freeze({ key: "workOrders.markInvoiced", label: "Promjena statusa u Fakturiran" }),
  Object.freeze({ key: "workOrders.billing.write", label: "Upisivanje u fakturiranje" }),
  Object.freeze({ key: "offers.create", label: "Izrada ponuda" }),
  Object.freeze({ key: "offers.view", label: "Pregled ponuda" }),
  Object.freeze({ key: "offers.edit", label: "Uredivanje ponuda" }),
  Object.freeze({ key: "purchaseOrders.create", label: "Izrada narudzbenica" }),
  Object.freeze({ key: "purchaseOrders.view", label: "Pregled narudzbenica" }),
  Object.freeze({ key: "purchaseOrders.edit", label: "Uredivanje narudzbenice" }),
  Object.freeze({ key: "locations.view", label: "Pregled lokacije" }),
  Object.freeze({ key: "locations.create", label: "Dodavanje nove lokacije" }),
  Object.freeze({ key: "locations.edit", label: "Uredivanje lokacije" }),
  Object.freeze({ key: "contracts.create", label: "Dodavanje ugovora" }),
  Object.freeze({ key: "contracts.view", label: "Pregled ugovora" }),
  Object.freeze({ key: "clientPortal.manage", label: "Klijentski portal" }),
]);
export const APP_ROLE_PERMISSION_KEYS = Object.freeze(APP_ROLE_PERMISSION_DEFINITIONS.map((entry) => entry.key));
const APP_PERMISSION_KEYS_SET = new Set(APP_ROLE_PERMISSION_KEYS);
const APP_PERMISSIONS_NONE = Object.freeze(Object.fromEntries(
  APP_ROLE_PERMISSION_KEYS.map((key) => [key, false]),
));
const APP_PERMISSIONS_FULL = Object.freeze(Object.fromEntries(
  APP_ROLE_PERMISSION_KEYS.map((key) => [key, true]),
));
const APP_PROFILE_DEFAULT_VIEW_PERMISSION_KEYS = Object.freeze([
  "measurementEquipment.view",
  "vehicles.view",
  "legalFramework.view",
  "serviceCatalog.view",
  "jobs.view",
]);
const APP_PROFILE_DEFAULT_OPERATION_PERMISSION_KEYS = Object.freeze([
  "jobs.manage",
  "jobs.nexai.use",
  "workOrders.create",
  "workOrders.changeStatus",
  "workOrders.cancel",
  "workOrders.restoreCancelled",
  "workOrders.markInvoiced",
  "workOrders.billing.write",
  "offers.create",
  "offers.view",
  "offers.edit",
  "purchaseOrders.create",
  "purchaseOrders.view",
  "purchaseOrders.edit",
  "locations.view",
  "locations.create",
  "locations.edit",
  "contracts.create",
  "contracts.view",
  "clientPortal.manage",
]);

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

export function isClientPortalUser(actor) {
  return normalizeUserProfileRole(actor?.profileRole ?? actor?.profile_role, "") === "client_user";
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

  if (targetNormalizedRole !== ROLE_USER) {
    return false;
  }

  if (targetOrganizationIds.length === 0) {
    return false;
  }

  if (actorRole !== ROLE_ADMIN) {
    const canManagePeople = actorRole === ROLE_USER
      && Boolean(actor?.appPermissions?.["people.manage"]);
    if (!canManagePeople) {
      return false;
    }
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

function normalizeAppPermissionKey(value = "") {
  const normalized = normalizeText(value);
  return APP_PERMISSION_KEYS_SET.has(normalized) ? normalized : "";
}

function getDefaultAppPermissionFlagsForProfileRole(profileRole = "new_user") {
  const normalizedProfileRole = normalizeUserProfileRole(profileRole);

  if (normalizedProfileRole === "admin") {
    return { ...APP_PERMISSIONS_FULL };
  }

  if (normalizedProfileRole === "client_user") {
    return { ...APP_PERMISSIONS_NONE };
  }

  return {
    ...APP_PERMISSIONS_NONE,
    ...Object.fromEntries(APP_PROFILE_DEFAULT_VIEW_PERMISSION_KEYS.map((key) => [key, true])),
    ...Object.fromEntries(APP_PROFILE_DEFAULT_OPERATION_PERMISSION_KEYS.map((key) => [key, true])),
  };
}

function normalizeAppPermissionFlags(value = {}, fallbackFlags = APP_PERMISSIONS_NONE) {
  const source = value && typeof value === "object"
    ? value
    : {};
  const nestedPermissions = source.permissions && typeof source.permissions === "object"
    ? source.permissions
    : {};

  return Object.fromEntries(APP_ROLE_PERMISSION_KEYS.map((key) => [
    key,
    toBooleanFlag(
      nestedPermissions[key] ?? source[key],
      Boolean(fallbackFlags[key]),
    ),
  ]));
}

export function normalizeAppRolePermissionEntry(entry = {}, fallbackProfileRole = "new_user") {
  const source = entry && typeof entry === "object"
    ? entry
    : {};
  const profileRole = normalizeUserProfileRole(
    source.profileRole ?? source.profile_role ?? source.role,
    fallbackProfileRole,
  );

  return {
    profileRole,
    isExplicit: source.isExplicit !== false,
    ...normalizeAppPermissionFlags(
      source,
      getDefaultAppPermissionFlagsForProfileRole(profileRole),
    ),
  };
}

export function normalizeAppRolePermissions(entries = []) {
  const list = Array.isArray(entries) ? entries : [];
  const byRole = new Map();

  USER_PROFILE_ROLE_VALUES.forEach((profileRole) => {
    byRole.set(profileRole, {
      profileRole,
      isExplicit: false,
      ...getDefaultAppPermissionFlagsForProfileRole(profileRole),
    });
  });

  list.forEach((entry) => {
    const normalized = normalizeAppRolePermissionEntry(entry);
    byRole.set(normalized.profileRole, normalized);
  });

  return USER_PROFILE_ROLE_VALUES.map((profileRole) => ({
    ...(byRole.get(profileRole) ?? {
      profileRole,
      isExplicit: false,
      ...getDefaultAppPermissionFlagsForProfileRole(profileRole),
    }),
  }));
}

export function resolveAppPermissionsForActor(actor, rolePermissions = []) {
  const actorRole = normalizeRole(actor?.role);

  if (actorRole === ROLE_SUPER_ADMIN || actorRole === ROLE_ADMIN) {
    return { ...APP_PERMISSIONS_FULL };
  }

  if (isClientPortalUser(actor)) {
    return { ...APP_PERMISSIONS_NONE };
  }

  const profileRole = normalizeUserProfileRole(actor?.profileRole ?? actor?.profile_role, "new_user");
  const normalizedPermissions = normalizeAppRolePermissions(rolePermissions);
  const entry = normalizedPermissions.find((item) => item.profileRole === profileRole)
    ?? {
      profileRole,
      ...getDefaultAppPermissionFlagsForProfileRole(profileRole),
    };

  return Object.fromEntries(APP_ROLE_PERMISSION_KEYS.map((key) => [key, Boolean(entry[key])]));
}

export function hasAppPermission(actor, rolePermissions = [], permissionKey = "") {
  const normalizedPermissionKey = normalizeAppPermissionKey(permissionKey);
  if (!normalizedPermissionKey) {
    return false;
  }

  return Boolean(resolveAppPermissionsForActor(actor, rolePermissions)[normalizedPermissionKey]);
}

function normalizeCompanyPermissionFlags(value = {}, options = {}) {
  const source = value && typeof value === "object"
    ? value
    : {};
  const separateCreateFromView = options && typeof options === "object"
    ? options.separateCreateFromView === true
    : false;
  const canViewRaw = toBooleanFlag(source.canView ?? source.view, false);
  const canCreateRaw = toBooleanFlag(source.canCreate ?? source.create, false);
  const canEditRaw = toBooleanFlag(source.canEdit ?? source.edit, false);
  const canDeleteRaw = toBooleanFlag(source.canDelete ?? source.delete, false);
  const canView = canViewRaw || canEditRaw || canDeleteRaw || (!separateCreateFromView && canCreateRaw);
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

export function normalizeCompanyPermissionScopeId(value, fallback = COMPANY_PERMISSION_SCOPE_GENERAL) {
  const normalized = normalizeText(value);
  if (normalized) {
    return normalized;
  }

  const fallbackValue = normalizeText(fallback);
  return fallbackValue || COMPANY_PERMISSION_SCOPE_GENERAL;
}

function createCompanyPermissionEntryKey(companyId = "", profileRole = "new_user") {
  return `${normalizeCompanyPermissionScopeId(companyId)}::${normalizeUserProfileRole(profileRole)}`;
}

export function normalizeCompanyRolePermissionEntry(
  entry = {},
  fallbackProfileRole = "new_user",
  fallbackCompanyId = COMPANY_PERMISSION_SCOPE_GENERAL,
) {
  const source = entry && typeof entry === "object"
    ? entry
    : {};
  const companyId = normalizeCompanyPermissionScopeId(
    source.companyId ?? source.company_id ?? source.scopeId ?? source.scope_id,
    fallbackCompanyId,
  );

  return {
    companyId,
    profileRole: normalizeUserProfileRole(
      source.profileRole ?? source.profile_role ?? source.role,
      fallbackProfileRole,
    ),
    isExplicit: source.isExplicit !== false,
    ...normalizeCompanyPermissionFlags(source, {
      separateCreateFromView: companyId === COMPANY_PERMISSION_SCOPE_GENERAL,
    }),
  };
}

export function normalizeCompanyRolePermissions(entries = [], scopeIds = []) {
  const list = Array.isArray(entries) ? entries : [];
  const requestedScopeIds = Array.isArray(scopeIds) ? scopeIds : [scopeIds];
  const normalizedScopeIds = Array.from(new Set([
    COMPANY_PERMISSION_SCOPE_GENERAL,
    ...requestedScopeIds.map((scopeId) => normalizeCompanyPermissionScopeId(scopeId)).filter(Boolean),
    ...list.map((entry) => normalizeCompanyPermissionScopeId(entry?.companyId ?? entry?.company_id)).filter(Boolean),
  ]));
  const byScopeAndRole = new Map();

  normalizedScopeIds.forEach((companyId) => {
    USER_PROFILE_ROLE_VALUES.forEach((profileRole) => {
      byScopeAndRole.set(
        createCompanyPermissionEntryKey(companyId, profileRole),
        {
          companyId,
          profileRole,
          isExplicit: false,
          ...COMPANY_PERMISSIONS_NONE,
        },
      );
    });
  });

  list.forEach((entry) => {
    const normalized = normalizeCompanyRolePermissionEntry(entry);
    byScopeAndRole.set(
      createCompanyPermissionEntryKey(normalized.companyId, normalized.profileRole),
      normalized,
    );
  });

  return normalizedScopeIds.flatMap((companyId) => USER_PROFILE_ROLE_VALUES.map((profileRole) => ({
    ...(byScopeAndRole.get(createCompanyPermissionEntryKey(companyId, profileRole))
      ?? {
        companyId,
        profileRole,
        isExplicit: false,
        ...COMPANY_PERMISSIONS_NONE,
      }),
  })));
}

export function resolveCompanyPermissionsForActor(
  actor,
  rolePermissions = [],
  companyId = COMPANY_PERMISSION_SCOPE_GENERAL,
) {
  const actorRole = normalizeRole(actor?.role);

  if (actorRole === ROLE_SUPER_ADMIN || actorRole === ROLE_ADMIN) {
    return { ...COMPANY_PERMISSIONS_FULL };
  }

  if (isClientPortalUser(actor)) {
    return {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };
  }

  const profileRole = normalizeUserProfileRole(actor?.profileRole ?? actor?.profile_role, "new_user");
  const normalizedCompanyId = normalizeCompanyPermissionScopeId(companyId);
  const normalizedInputPermissions = (Array.isArray(rolePermissions) ? rolePermissions : [])
    .map((entry) => normalizeCompanyRolePermissionEntry(entry));
  const normalizedPermissions = normalizeCompanyRolePermissions(rolePermissions, [
    COMPANY_PERMISSION_SCOPE_GENERAL,
    normalizedCompanyId,
  ]);
  const generalEntry = normalizedPermissions.find((entry) => (
    entry.companyId === COMPANY_PERMISSION_SCOPE_GENERAL
    && entry.profileRole === profileRole
  )) ?? {
    companyId: COMPANY_PERMISSION_SCOPE_GENERAL,
    profileRole,
    ...COMPANY_PERMISSIONS_NONE,
  };
  const explicitScopedEntry = normalizedInputPermissions
    .find((entry) => (
      entry.isExplicit !== false
      && entry.companyId === normalizedCompanyId
      && entry.profileRole === profileRole
    ));
  const explicitGeneralEntry = normalizedInputPermissions
    .find((entry) => (
      entry.isExplicit !== false
      && entry.companyId === COMPANY_PERMISSION_SCOPE_GENERAL
      && entry.profileRole === profileRole
    ));
  const aggregatedGeneralEntry = normalizedInputPermissions
    .filter((entry) => (
      entry.isExplicit !== false
      && entry.profileRole === profileRole
    ))
    .reduce((aggregate, entry) => ({
      ...aggregate,
      canView: Boolean(aggregate.canView || entry.canView),
      canCreate: Boolean(aggregate.canCreate || entry.canCreate),
      canEdit: Boolean(aggregate.canEdit || entry.canEdit),
      canDelete: Boolean(aggregate.canDelete || entry.canDelete),
    }), {
      companyId: COMPANY_PERMISSION_SCOPE_GENERAL,
      profileRole,
      ...COMPANY_PERMISSIONS_NONE,
    });
  const effectiveGeneralEntry = {
    companyId: COMPANY_PERMISSION_SCOPE_GENERAL,
    profileRole,
    canView: Boolean(
      (explicitGeneralEntry?.canView ?? false)
      || aggregatedGeneralEntry.canView
      || generalEntry.canView
    ),
    canCreate: Boolean(
      (explicitGeneralEntry?.canCreate ?? false)
      || aggregatedGeneralEntry.canCreate
      || generalEntry.canCreate
    ),
    canEdit: Boolean(
      (explicitGeneralEntry?.canEdit ?? false)
      || aggregatedGeneralEntry.canEdit
      || generalEntry.canEdit
    ),
    canDelete: Boolean(
      (explicitGeneralEntry?.canDelete ?? false)
      || aggregatedGeneralEntry.canDelete
      || generalEntry.canDelete
    ),
  };
  const effectiveScopedEntry = normalizedCompanyId === COMPANY_PERMISSION_SCOPE_GENERAL
    ? effectiveGeneralEntry
    : explicitScopedEntry ?? effectiveGeneralEntry;

  return {
    canView: Boolean(effectiveScopedEntry.canView),
    canCreate: Boolean(effectiveGeneralEntry.canCreate),
    canEdit: Boolean(effectiveScopedEntry.canEdit),
    canDelete: Boolean(effectiveScopedEntry.canDelete),
  };
}

export function canViewCompanies(actor, rolePermissions = [], companyId = COMPANY_PERMISSION_SCOPE_GENERAL) {
  return resolveCompanyPermissionsForActor(actor, rolePermissions, companyId).canView;
}

export function canCreateCompanies(actor, rolePermissions = [], companyId = COMPANY_PERMISSION_SCOPE_GENERAL) {
  return resolveCompanyPermissionsForActor(actor, rolePermissions, companyId).canCreate;
}

export function canEditCompanies(actor, rolePermissions = [], companyId = COMPANY_PERMISSION_SCOPE_GENERAL) {
  return resolveCompanyPermissionsForActor(actor, rolePermissions, companyId).canEdit;
}

export function canDeleteCompanies(actor, rolePermissions = [], companyId = COMPANY_PERMISSION_SCOPE_GENERAL) {
  return resolveCompanyPermissionsForActor(actor, rolePermissions, companyId).canDelete;
}

export function canManageWorkOrders(actor) {
  return !isClientPortalUser(actor) && [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_USER].includes(normalizeRole(actor?.role));
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
