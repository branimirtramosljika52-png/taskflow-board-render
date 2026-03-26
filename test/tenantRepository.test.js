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

test("memory tenant repository stores and approves signup requests", async () => {
  const repository = new MemoryTenantRepository();
  await repository.init();

  const superAdmin = await repository.authenticateUser("admin@local.test", "admin");
  const response = await repository.submitSignupRequest({
    organizationName: "Nova Organizacija",
    organizationOib: "12345678901",
    firstName: "Luka",
    lastName: "Test",
    email: "luka@example.com",
    password: "tajna123",
    phone: "+385 91 000 0000",
  });

  assert.equal(response.ok, true);
  assert.equal(response.request.status, "pending");
  assert.equal(response.request.organizationOib, "12345678901");

  const snapshotBeforeApproval = await repository.getSnapshot(superAdmin, "1", {
    companies: [],
    locations: [],
    workOrders: [],
  });
  assert.equal(snapshotBeforeApproval.signupRequests.length, 1);

  await repository.approveSignupRequest(superAdmin, response.request.id);

  const approvedUser = await repository.authenticateUser("luka@example.com", "tajna123");
  assert.ok(approvedUser);
  assert.equal(approvedUser.role, "admin");
  assert.equal(approvedUser.organizationName, "Nova Organizacija");
  const createdOrganization = repository.organizations.find((item) => item.id === approvedUser.organizationId);
  assert.equal(createdOrganization?.oib, "12345678901");
});

test("memory tenant repository blocks duplicate pending signup requests by email", async () => {
  const repository = new MemoryTenantRepository();
  await repository.init();

  await repository.submitSignupRequest({
    organizationName: "Org 1",
    organizationOib: "12345678901",
    firstName: "Ana",
    lastName: "Admin",
    email: "ana@example.com",
    password: "tajna123",
  });

  await assert.rejects(
    () => repository.submitSignupRequest({
      organizationName: "Org 2",
      organizationOib: "10987654321",
      firstName: "Ana",
      lastName: "Admin",
      email: "ana@example.com",
      password: "tajna123",
    }),
    /vec poslan/,
  );
});

test("memory tenant repository requires valid organization oib for signup requests", async () => {
  const repository = new MemoryTenantRepository();
  await repository.init();

  await assert.rejects(
    () => repository.submitSignupRequest({
      organizationName: "Org 1",
      organizationOib: "123",
      firstName: "Ana",
      lastName: "Admin",
      email: "ana-oib@example.com",
      password: "tajna123",
    }),
    /OIB organizacije/,
  );
});
