import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLocationContacts,
  createCompany,
  createLocation,
  createWorkOrder,
  filterWorkOrders,
  getDashboardStats,
  nextWorkOrderNumber,
  syncLocationFieldsFromWorkOrder,
  updateWorkOrder,
} from "../src/safetyModel.js";

function buildState() {
  const company = createCompany(
    {
      name: "Acme d.o.o.",
      headquarters: "Zagreb",
      oib: "12345678901",
      contractType: "Pausal",
      representative: "Ana Kovac",
    },
    [],
    () => "company-1",
    () => "2026-03-25T08:00:00.000Z",
  );

  const location = createLocation(
    {
      companyId: company.id,
      name: "Pogon Jankomir",
      region: "Zagreb",
      coordinates: "45.8000, 15.9000",
      contactName1: "Marko Horvat",
      contactPhone1: "+38591111222",
      contactEmail1: "marko@acme.hr",
      contactName2: "Iva Novak",
      contactPhone2: "+38598888777",
      contactEmail2: "iva@acme.hr",
    },
    { companies: [company], locations: [] },
    () => "location-1",
    () => "2026-03-25T08:05:00.000Z",
  );

  return {
    companies: [company],
    locations: [location],
    workOrders: [],
  };
}

test("createCompany blocks duplicate OIB values", () => {
  const existing = [
    createCompany(
      {
        name: "Acme d.o.o.",
        oib: "12345678901",
      },
      [],
      () => "company-1",
      () => "2026-03-25T08:00:00.000Z",
    ),
  ];

  assert.throws(
    () => createCompany(
      {
        name: "Beta d.o.o.",
        oib: "12345678901",
      },
      existing,
      () => "company-2",
      () => "2026-03-25T08:10:00.000Z",
    ),
    /OIB/,
  );
});

test("createLocation requires a real company and keeps names unique per company", () => {
  const state = buildState();

  assert.throws(
    () => createLocation(
      {
        companyId: "missing",
        name: "Lokacija X",
      },
      state,
      () => "location-x",
      () => "2026-03-25T08:10:00.000Z",
    ),
    /tvrtka/i,
  );

  assert.throws(
    () => createLocation(
      {
        companyId: "company-1",
        name: "Pogon Jankomir",
      },
      state,
      () => "location-2",
      () => "2026-03-25T08:10:00.000Z",
    ),
    /lokacija/i,
  );
});

test("createWorkOrder pulls snapshot data from selected company and location", () => {
  const state = buildState();

  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      status: "Otvoreni RN",
      priority: "High",
      description: "Redovni pregled zastite",
    },
    state,
    () => "work-order-1",
    "RN-00001",
    () => "2026-03-25T09:00:00.000Z",
  );

  assert.equal(workOrder.companyName, "Acme d.o.o.");
  assert.equal(workOrder.companyOib, "12345678901");
  assert.equal(workOrder.locationName, "Pogon Jankomir");
  assert.equal(workOrder.region, "Zagreb");
  assert.equal(workOrder.contactSlot, 1);
  assert.equal(workOrder.contactName, "Marko Horvat");
  assert.equal(workOrder.contactPhone, "+38591111222");
});

test("updateWorkOrder refreshes snapshot fields when location and contact change", () => {
  const state = buildState();
  const baseWorkOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Otvoreni nalog",
    },
    state,
    () => "work-order-1",
    "RN-00001",
    () => "2026-03-25T09:00:00.000Z",
  );

  const secondLocation = createLocation(
    {
      companyId: "company-1",
      name: "Centar Split",
      region: "Dalmacija",
      coordinates: "43.5081, 16.4402",
      contactName1: "Petra Bencic",
      contactPhone1: "+38595555444",
      contactEmail1: "petra@acme.hr",
    },
    {
      companies: state.companies,
      locations: state.locations,
    },
    () => "location-2",
    () => "2026-03-25T09:05:00.000Z",
  );

  const next = updateWorkOrder(
    baseWorkOrder,
    {
      locationId: "location-2",
      status: "Ovjeren RN",
    },
    {
      ...state,
      locations: [...state.locations, secondLocation],
    },
    () => "2026-03-25T10:00:00.000Z",
  );

  assert.equal(next.locationName, "Centar Split");
  assert.equal(next.region, "Dalmacija");
  assert.equal(next.contactName, "Petra Bencic");
  assert.equal(next.status, "Ovjeren RN");
});

test("support helpers cover numbering, filtering, stats, and location sync", () => {
  const state = buildState();
  const first = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Prvi nalog",
      dueDate: "2026-03-24",
      status: "Otvoreni RN",
    },
    state,
    () => "work-order-1",
    "RN-00001",
    () => "2026-03-25T09:00:00.000Z",
  );
  const second = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Drugi nalog",
      status: "Fakturiran RN",
    },
    state,
    () => "work-order-2",
    "RN-00002",
    () => "2026-03-25T10:00:00.000Z",
  );

  assert.equal(nextWorkOrderNumber([first, second]), "RN-00003");
  assert.equal(filterWorkOrders([first, second], { query: "prvi" }).length, 1);
  assert.deepEqual(getDashboardStats({
    companies: state.companies,
    locations: state.locations,
    workOrders: [first, second],
  }, "2026-03-25"), {
    companies: 1,
    locations: 1,
    activeWorkOrders: 1,
    completedWorkOrders: 1,
    overdueWorkOrders: 1,
  });

  const syncedLocation = syncLocationFieldsFromWorkOrder(state.locations[0], {
    ...first,
    coordinates: "45.1234, 16.0000",
    region: "Sredisnja Hrvatska",
  }, () => "2026-03-25T12:00:00.000Z");

  assert.equal(syncedLocation.coordinates, "45.1234, 16.0000");
  assert.equal(syncedLocation.region, "Sredisnja Hrvatska");
  assert.equal(buildLocationContacts(syncedLocation).length, 2);
});
