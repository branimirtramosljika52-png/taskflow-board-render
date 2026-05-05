import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_ROLE_PERMISSION_KEYS,
  ROLE_ADMIN,
  ROLE_SUPER_ADMIN,
  ROLE_USER,
  buildLegacyEmail,
  canCreateCompanies,
  canDeleteCompanies,
  canEditCompanies,
  canEditOrganization,
  canManageLoginContent,
  canManageOrganizationUsers,
  canManageOrganizations,
  canManageWorkOrders,
  canViewCompanies,
  hasAppPermission,
  isClientPortalUser,
  normalizeAppRolePermissions,
  normalizeCompanyRolePermissions,
  normalizeRole,
  normalizeUserProfileRole,
  pickLoginContent,
  resolveAppPermissionsForActor,
  resolveCompanyPermissionsForActor,
  resolveEffectiveOrganizationId,
  splitFullName,
} from "../src/accessControl.js";

test("normalizeRole and splitFullName normalize legacy values", () => {
  assert.equal(normalizeRole("superadmin"), ROLE_SUPER_ADMIN);
  assert.equal(normalizeRole("administrator"), ROLE_ADMIN);
  assert.equal(normalizeRole("korisnik"), ROLE_USER);
  assert.deepEqual(splitFullName("Branimir Tramošljika"), {
    firstName: "Branimir",
    lastName: "Tramošljika",
  });
});

test("buildLegacyEmail creates stable fallback emails", () => {
  assert.equal(buildLegacyEmail("BTramoslj", 14), "btramoslj.14@legacy.safety360.local");
});

test("super admin and admin organization permissions are enforced", () => {
  const superAdmin = { role: ROLE_SUPER_ADMIN, organizationId: "1" };
  const admin = { role: ROLE_ADMIN, organizationId: "5", organizationIds: ["5", "8"] };
  const user = { role: ROLE_USER, organizationId: "5", organizationIds: ["5"] };

  assert.equal(canManageOrganizations(superAdmin), true);
  assert.equal(canManageOrganizations(admin), false);
  assert.equal(canEditOrganization(superAdmin, "5"), true);
  assert.equal(canEditOrganization(admin, "5"), false);
  assert.equal(canManageLoginContent(superAdmin), true);
  assert.equal(canManageLoginContent(user), false);

  assert.equal(canManageOrganizationUsers(superAdmin, "99", ROLE_SUPER_ADMIN), true);
  assert.equal(canManageOrganizationUsers(admin, "5", ROLE_USER), true);
  assert.equal(canManageOrganizationUsers(admin, ["5", "8"], ROLE_USER), true);
  assert.equal(canManageOrganizationUsers(admin, "5", ROLE_ADMIN), false);
  assert.equal(canManageOrganizationUsers(admin, "5", ROLE_SUPER_ADMIN), false);
  assert.equal(canManageOrganizationUsers(admin, "8", ROLE_USER), true);
  assert.equal(canManageOrganizationUsers(admin, ["5", "9"], ROLE_USER), false);
  assert.equal(canManageOrganizationUsers(user, "5", ROLE_USER), false);
});

test("resolveEffectiveOrganizationId respects super admin switching and member scoping", () => {
  const organizations = [{ id: 1 }, { id: 5 }, { id: 9 }];
  const superAdmin = { role: ROLE_SUPER_ADMIN, organizationId: "5" };
  const admin = { role: ROLE_ADMIN, organizationId: "9", organizationIds: ["9", "1"] };

  assert.equal(resolveEffectiveOrganizationId(superAdmin, "1", organizations), "1");
  assert.equal(resolveEffectiveOrganizationId(superAdmin, "", organizations), "5");
  assert.equal(resolveEffectiveOrganizationId(admin, "1", organizations), "1");
  assert.equal(resolveEffectiveOrganizationId(admin, "", organizations), "9");
});

test("pickLoginContent returns an active item or a fallback", () => {
  const picked = pickLoginContent([
    { heading: "A", body: "Body A", isActive: false },
    { heading: "B", body: "Body B", isActive: true },
  ]);

  assert.equal(picked.heading, "B");
  assert.equal(pickLoginContent([]).heading.length > 0, true);
});

test("company permissions resolve by profile role while admin and super admin stay fully privileged", () => {
  const rolePermissions = normalizeCompanyRolePermissions([
    {
      profileRole: "manager",
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
  ]);

  const managerUser = { role: ROLE_USER, profileRole: "manager" };
  const juniorUser = { role: ROLE_USER, profileRole: "junior_user" };
  const admin = { role: ROLE_ADMIN, profileRole: "new_user" };
  const superAdmin = { role: ROLE_SUPER_ADMIN, profileRole: "new_user" };

  assert.equal(normalizeUserProfileRole("MANAGER"), "manager");
  assert.deepEqual(resolveCompanyPermissionsForActor(managerUser, rolePermissions), {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
  });
  assert.equal(canViewCompanies(managerUser, rolePermissions), true);
  assert.equal(canCreateCompanies(managerUser, rolePermissions), true);
  assert.equal(canEditCompanies(managerUser, rolePermissions), true);
  assert.equal(canDeleteCompanies(managerUser, rolePermissions), false);

  assert.deepEqual(resolveCompanyPermissionsForActor(juniorUser, rolePermissions), {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  });
  assert.equal(canViewCompanies(juniorUser, rolePermissions), false);

  assert.deepEqual(resolveCompanyPermissionsForActor(admin, rolePermissions), {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  });
  assert.deepEqual(resolveCompanyPermissionsForActor(superAdmin, rolePermissions), {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  });
});

test("client portal users get read-only company access", () => {
  const client = { role: ROLE_USER, profileRole: "client_user" };

  assert.equal(normalizeUserProfileRole("client_user"), "client_user");
  assert.equal(isClientPortalUser(client), true);
  assert.deepEqual(resolveCompanyPermissionsForActor(client, []), {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  });
  assert.equal(canViewCompanies(client, []), true);
  assert.equal(canCreateCompanies(client, []), false);
  assert.equal(canManageWorkOrders(client), false);
});

test("app role permissions keep super admin and admin fully privileged", () => {
  const disabledRolePermissions = normalizeAppRolePermissions([
    {
      profileRole: "manager",
      permissions: Object.fromEntries(APP_ROLE_PERMISSION_KEYS.map((key) => [key, false])),
    },
  ]);
  const superAdmin = { role: ROLE_SUPER_ADMIN, profileRole: "manager" };
  const admin = { role: ROLE_ADMIN, profileRole: "manager" };

  assert.deepEqual(
    Object.values(resolveAppPermissionsForActor(superAdmin, disabledRolePermissions)),
    APP_ROLE_PERMISSION_KEYS.map(() => true),
  );
  assert.deepEqual(
    Object.values(resolveAppPermissionsForActor(admin, disabledRolePermissions)),
    APP_ROLE_PERMISSION_KEYS.map(() => true),
  );
  assert.equal(hasAppPermission(admin, disabledRolePermissions, "settings.manage"), true);
});

test("app role permissions resolve module access by profile role", () => {
  const rolePermissions = normalizeAppRolePermissions([
    {
      profileRole: "manager",
      "people.manage": true,
      "vehicles.reserve": true,
      "vehicles.create": false,
      "settings.manage": false,
    },
  ]);
  const manager = {
    role: ROLE_USER,
    profileRole: "manager",
    organizationId: "5",
    organizationIds: ["5"],
  };
  const junior = { role: ROLE_USER, profileRole: "junior_user" };
  const client = { role: ROLE_USER, profileRole: "client_user" };

  assert.equal(hasAppPermission(manager, rolePermissions, "people.manage"), true);
  assert.equal(hasAppPermission(manager, rolePermissions, "vehicles.reserve"), true);
  assert.equal(hasAppPermission(manager, rolePermissions, "vehicles.create"), false);
  assert.equal(hasAppPermission(manager, rolePermissions, "settings.manage"), false);
  assert.equal(canManageOrganizationUsers(manager, "5", ROLE_USER), false);
  assert.equal(canManageOrganizationUsers({
    ...manager,
    appPermissions: resolveAppPermissionsForActor(manager, rolePermissions),
  }, "5", ROLE_USER), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "measurementEquipment.view"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "measurementEquipment.edit"), false);
  assert.equal(hasAppPermission(junior, rolePermissions, "workOrders.create"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "workOrders.changeStatus"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "workOrders.billing.write"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "offers.view"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "purchaseOrders.create"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "locations.view"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "locations.create"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "locations.edit"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "contracts.view"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "contracts.create"), true);
  assert.equal(hasAppPermission(junior, rolePermissions, "clientPortal.manage"), true);
  assert.equal(hasAppPermission(client, rolePermissions, "serviceCatalog.view"), false);
  assert.equal(hasAppPermission(client, rolePermissions, "offers.view"), false);
  assert.equal(hasAppPermission(client, rolePermissions, "locations.view"), false);
  assert.equal(hasAppPermission(client, rolePermissions, "contracts.view"), false);
  assert.equal(hasAppPermission(client, rolePermissions, "clientPortal.manage"), false);
});

test("company permissions can be scoped per company while create stays general", () => {
  const rolePermissions = normalizeCompanyRolePermissions([
    {
      companyId: "__general__",
      profileRole: "manager",
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    },
    {
      companyId: "company-1",
      profileRole: "manager",
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
  ], ["__general__", "company-1", "company-2"]);

  const managerUser = { role: ROLE_USER, profileRole: "manager" };

  assert.deepEqual(resolveCompanyPermissionsForActor(managerUser, rolePermissions, "company-1"), {
    canView: false,
    canCreate: true,
    canEdit: false,
    canDelete: false,
  });
  assert.deepEqual(resolveCompanyPermissionsForActor(managerUser, rolePermissions, "company-2"), {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
  });
  assert.equal(canEditCompanies(managerUser, rolePermissions, "company-1"), false);
  assert.equal(canEditCompanies(managerUser, rolePermissions, "company-2"), true);
});
