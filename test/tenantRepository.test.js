import assert from "node:assert/strict";
import test from "node:test";

import { MemoryTenantRepository } from "../src/tenantRepository.js";

test("memory tenant repository authenticates default super admin", async () => {
  const repository = new MemoryTenantRepository();
  await repository.init();

  const user = await repository.authenticateUser("admin@local.test", "admin");

  assert.ok(user);
  assert.equal(user.role, "super_admin");
  assert.equal(user.organizationId, "1");
});

test("memory tenant repository scopes snapshot by assigned companies", async () => {
  const repository = new MemoryTenantRepository();
  await repository.init();

  const actor = {
    id: "1",
    role: "super_admin",
    organizationId: "1",
  };

  await repository.createOrganization(actor, { name: "Org B" });
  await repository.assignCompanyToOrganization("1", "company-1");
  await repository.assignCompanyToOrganization("2", "company-2");

  const rawSnapshot = {
    companies: [
      { id: "company-1", name: "Alpha" },
      { id: "company-2", name: "Beta" },
    ],
    locations: [
      { id: "location-1", companyId: "company-1", name: "Zagreb" },
      { id: "location-2", companyId: "company-2", name: "Split" },
    ],
    workOrders: [
      { id: "wo-1", companyId: "company-1", description: "RN 1" },
      { id: "wo-2", companyId: "company-2", description: "RN 2" },
    ],
  };

  const scoped = await repository.getSnapshot(actor, "2", rawSnapshot);

  assert.equal(scoped.activeOrganizationId, "2");
  assert.equal(scoped.companies.length, 1);
  assert.equal(scoped.companies[0].id, "company-2");
  assert.equal(scoped.locations[0].id, "location-2");
  assert.equal(scoped.workOrders[0].id, "wo-2");
});

test("memory tenant repository lets admins create users only inside their organization", async () => {
  const repository = new MemoryTenantRepository();
  await repository.init();

  const superAdmin = await repository.authenticateUser("admin@local.test", "admin");
  const organization = await repository.createOrganization(superAdmin, { name: "Client Org" });
  const admin = await repository.createUser(superAdmin, {
    organizationId: organization.id,
    firstName: "Ana",
    lastName: "Admin",
    email: "ana@example.com",
    password: "secret123",
    role: "admin",
  });

  const createdUser = await repository.createUser(admin, {
    organizationId: organization.id,
    firstName: "Iva",
    lastName: "User",
    email: "iva@example.com",
    password: "secret123",
    role: "user",
  });

  assert.equal(createdUser.organizationId, organization.id);

  await assert.rejects(
    () => repository.createUser(admin, {
      organizationId: "1",
      firstName: "No",
      lastName: "Access",
      email: "blocked@example.com",
      password: "secret123",
      role: "user",
    }),
    /Nemate pravo kreirati ovog korisnika/,
  );
});
