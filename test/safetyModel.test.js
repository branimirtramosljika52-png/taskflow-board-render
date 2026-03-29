import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWorkOrderCalendarLanes,
  buildWorkOrderCalendarTeamWeeks,
  buildWorkOrderMapMarkers,
  buildLocationContacts,
  createCompany,
  createDashboardWidget,
  createLocation,
  createReminder,
  createTodoTask,
  createTodoTaskComment,
  createWorkOrder,
  filterReminders,
  filterTodoTasks,
  filterWorkOrders,
  getDashboardWidgetData,
  getDashboardInsights,
  getDashboardStats,
  groupWorkOrdersByExecutorSet,
  nextWorkOrderNumber,
  parseCoordinates,
  sortReminders,
  sortDashboardWidgets,
  sortTodoTasks,
  syncLocationFieldsFromWorkOrder,
  updateDashboardWidget,
  updateLocation,
  updateReminder,
  updateTodoTask,
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
  assert.equal(workOrder.teamLabel, "");
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
      teamLabel: "Tim Jug",
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
  assert.equal(next.teamLabel, "Tim Jug");
});

test("groupWorkOrdersByExecutorSet merges work orders with the same executor combination", () => {
  const items = [
    { id: "1", workOrderNumber: "RN-001", executor1: "Ana Horvat", executor2: "Marko Kova", dueDate: "2026-03-29" },
    { id: "2", workOrderNumber: "RN-002", executor1: "Ana Horvat", executor2: "Marko Kova", dueDate: "2026-03-29" },
    { id: "3", workOrderNumber: "RN-003", executor1: "Petra Juric", executor2: "", dueDate: "2026-03-29" },
  ];

  const groups = groupWorkOrdersByExecutorSet(items);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, "Ana Horvat + Marko Kova");
  assert.equal(groups[0].items.length, 2);
  assert.deepEqual(
    groups[0].items.map((item) => item.workOrderNumber),
    ["RN-001", "RN-002"],
  );
  assert.equal(groups[1].label, "Petra Juric");
});

test("locations support dynamic contacts beyond the legacy three slots", () => {
  const company = createCompany(
    {
      name: "Delta d.o.o.",
      oib: "10987654321",
    },
    [],
    () => "company-delta",
    () => "2026-03-25T08:00:00.000Z",
  );

  const location = createLocation(
    {
      companyId: company.id,
      name: "Lab Zagreb",
      contacts: [
        { name: "Kontakt 1", phone: "111", email: "k1@delta.hr" },
        { name: "Kontakt 2", phone: "222", email: "k2@delta.hr" },
        { name: "Kontakt 3", phone: "333", email: "k3@delta.hr" },
        { name: "Kontakt 4", phone: "444", email: "k4@delta.hr" },
      ],
    },
    { companies: [company], locations: [] },
    () => "location-delta",
    () => "2026-03-25T08:05:00.000Z",
  );

  assert.equal(buildLocationContacts(location).length, 4);
  assert.equal(location.contactName1, "Kontakt 1");
  assert.equal(location.contactName2, "Kontakt 2");
  assert.equal(location.contactName3, "Kontakt 3");

  const updatedLocation = updateLocation(
    location,
    {
      contacts: [
        ...buildLocationContacts(location),
        { name: "Kontakt 5", phone: "555", email: "k5@delta.hr" },
      ],
    },
    { companies: [company], locations: [location] },
    () => "2026-03-25T08:10:00.000Z",
  );

  const updatedContacts = buildLocationContacts(updatedLocation);
  assert.equal(updatedContacts.length, 5);
  assert.equal(updatedContacts[4].slot, 5);

  const workOrder = createWorkOrder(
    {
      companyId: company.id,
      locationId: updatedLocation.id,
      contactSlot: 5,
      description: "Test dinamicnog kontakta",
    },
    { companies: [company], locations: [updatedLocation], workOrders: [] },
    () => "work-order-delta",
    "RN-00077",
    () => "2026-03-25T08:15:00.000Z",
  );

  assert.equal(workOrder.contactSlot, 5);
  assert.equal(workOrder.contactName, "Kontakt 5");
  assert.equal(workOrder.contactPhone, "555");
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

test("dashboard insights summarize workload, priorities and upcoming deadlines", () => {
  const state = buildState();
  const workOrders = [
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Otvoreni RN",
        priority: "Urgent",
        dueDate: "2026-03-27",
        region: "Zagreb",
        executor1: "Ana Anic",
        description: "Urgent pregled",
      },
      state,
      () => "work-order-1",
      "RN-00001",
      () => "2026-03-25T09:00:00.000Z",
    ),
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Otvoreni RN",
        priority: "High",
        dueDate: "2026-04-02",
        region: "Zagreb",
        executor1: "Ana Anic",
        executor2: "Marko Maric",
        description: "Tjedni pregled",
      },
      state,
      () => "work-order-2",
      "RN-00002",
      () => "2026-03-25T10:00:00.000Z",
    ),
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Fakturiran RN",
        priority: "Normal",
        dueDate: "2026-03-26",
        region: "Sjever",
        description: "Zatvoreni nalog",
      },
      state,
      () => "work-order-3",
      "RN-00003",
      () => "2026-03-25T11:00:00.000Z",
    ),
  ];

  const insights = getDashboardInsights({
    companies: state.companies,
    locations: [
      state.locations[0],
      {
        ...state.locations[0],
        id: "location-2",
        name: "Bez koordinata",
        coordinates: "",
      },
    ],
    workOrders,
  }, "2026-03-28");

  assert.equal(insights.activeWorkOrders, 2);
  assert.equal(insights.urgentWorkOrders, 1);
  assert.equal(insights.dueThisWeekWorkOrders, 1);
  assert.equal(insights.missingCoordinatesLocations, 1);
  assert.deepEqual(insights.statusBreakdown.map((item) => item.label), ["Otvoreni RN", "Fakturiran RN"]);
  assert.deepEqual(insights.priorityBreakdown.map((item) => item.label), ["Urgent", "High"]);
  assert.equal(insights.topRegions[0].label, "Zagreb");
  assert.equal(insights.topCompanies[0].label, "Acme d.o.o.");
  assert.equal(insights.executorLoad[0].label, "Ana Anic");
  assert.equal(insights.executorLoad[0].count, 2);
  assert.equal(insights.upcomingWorkOrders[0].workOrderNumber, "RN-00001");
});

test("dashboard widgets normalize settings and keep deterministic ordering", () => {
  const widgetA = createDashboardWidget(
    {
      organizationId: "10",
      userId: "22",
      title: "",
      source: "work_orders",
      visualization: "metric",
      metricKey: "active",
      size: "small",
      limit: 99,
      position: 4,
      filters: { dateWindow: "7d" },
    },
    { dashboardWidgets: [] },
    () => "widget-a",
    () => "2026-03-28T09:00:00.000Z",
  );

  const widgetB = createDashboardWidget(
    {
      organizationId: "10",
      userId: "22",
      title: "Statusi",
      source: "work_orders",
      visualization: "donut",
      metricKey: "status",
      size: "large",
      limit: 5,
      position: 2,
      filters: {},
    },
    { dashboardWidgets: [widgetA] },
    () => "widget-b",
    () => "2026-03-28T09:05:00.000Z",
  );

  const updated = updateDashboardWidget(
    widgetA,
    {
      visualization: "bar",
      metricKey: "region",
      size: "full",
      filters: { region: "Zagreb", dateWindow: "overdue" },
    },
    { dashboardWidgets: [widgetA, widgetB] },
    () => "2026-03-28T10:00:00.000Z",
  );

  assert.equal(widgetA.title, "Otvoreni RN");
  assert.equal(widgetA.limit, 12);
  assert.equal(updated.visualization, "bar");
  assert.equal(updated.metricKey, "region");
  assert.equal(updated.size, "full");
  assert.equal(updated.filters.region, "Zagreb");
  assert.equal(updated.filters.dateWindow, "overdue");
  assert.deepEqual(sortDashboardWidgets([widgetA, widgetB]).map((item) => item.id), ["widget-b", "widget-a"]);
});

test("dashboard widget data supports KPI, chart and list outputs with filters", () => {
  const state = buildState();
  const workOrders = [
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Otvoreni RN",
        priority: "Urgent",
        dueDate: "2026-03-29",
        region: "Zagreb",
        executor1: "Ana Anic",
        tagText: "petrol",
        description: "Hitni pregled",
      },
      state,
      () => "work-order-1",
      "RN-10001",
      () => "2026-03-28T09:00:00.000Z",
    ),
    createWorkOrder(
      {
        companyId: "company-1",
        locationId: "location-1",
        status: "Fakturiran RN",
        priority: "Normal",
        dueDate: "2026-03-20",
        region: "Istra",
        executor1: "Marko Maric",
        description: "Zatvoreni nalog",
      },
      state,
      () => "work-order-2",
      "RN-10002",
      () => "2026-03-28T08:00:00.000Z",
    ),
  ];

  const metricWidget = createDashboardWidget(
    {
      organizationId: "10",
      userId: "22",
      source: "work_orders",
      visualization: "metric",
      metricKey: "active",
      filters: { companyId: "company-1" },
    },
    { dashboardWidgets: [] },
    () => "metric-widget",
    () => "2026-03-28T09:10:00.000Z",
  );

  const chartWidget = updateDashboardWidget(
    metricWidget,
    {
      visualization: "donut",
      metricKey: "status",
      size: "large",
      filters: {},
    },
    { dashboardWidgets: [metricWidget] },
    () => "2026-03-28T09:11:00.000Z",
  );

  const listWidget = updateDashboardWidget(
    metricWidget,
    {
      visualization: "list",
      metricKey: "upcoming_due",
      size: "large",
      limit: 4,
      filters: {},
    },
    { dashboardWidgets: [metricWidget] },
    () => "2026-03-28T09:12:00.000Z",
  );

  const snapshot = {
    ...state,
    workOrders,
    reminders: [],
    todoTasks: [],
    locations: state.locations,
  };

  const metricData = getDashboardWidgetData(snapshot, metricWidget, { userId: "22" }, "2026-03-28");
  const chartData = getDashboardWidgetData(snapshot, chartWidget, { userId: "22" }, "2026-03-28");
  const listData = getDashboardWidgetData(snapshot, listWidget, { userId: "22" }, "2026-03-28");

  assert.equal(metricData.kind, "metric");
  assert.equal(metricData.value, 1);
  assert.equal(chartData.kind, "donut");
  assert.equal(chartData.items[0].label, "Otvoreni RN");
  assert.equal(chartData.items[0].count, 1);
  assert.equal(listData.kind, "list");
  assert.equal(listData.items[0].title, "RN-10001");
});

test("createReminder can link to a work order and inherit company context", () => {
  const state = buildState();
  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Pregled hidranta",
    },
    state,
    () => "work-order-1",
    "RN-00991",
    () => "2026-03-25T09:00:00.000Z",
  );

  const reminder = createReminder(
    {
      organizationId: "55",
      workOrderId: workOrder.id,
      title: "Nazvati klijenta",
      dueDate: "2026-03-28",
    },
    {
      ...state,
      workOrders: [workOrder],
      reminders: [],
    },
    () => "reminder-1",
    () => "2026-03-26T08:00:00.000Z",
  );

  assert.equal(reminder.organizationId, "55");
  assert.equal(reminder.workOrderId, "work-order-1");
  assert.equal(reminder.workOrderNumber, "RN-00991");
  assert.equal(reminder.companyId, "company-1");
  assert.equal(reminder.locationId, "location-1");
  assert.equal(reminder.companyName, "Acme d.o.o.");
});

test("reminders filter, sort and completion updates behave predictably", () => {
  const state = buildState();
  const reminderActive = createReminder(
    {
      organizationId: "1",
      title: "Kasni reminder",
      dueDate: "2026-03-20",
      status: "active",
      companyId: "company-1",
    },
    {
      ...state,
      reminders: [],
    },
    () => "reminder-1",
    () => "2026-03-25T08:00:00.000Z",
  );
  const reminderSnoozed = createReminder(
    {
      organizationId: "1",
      title: "Kasnije",
      dueDate: "2026-03-30",
      status: "snoozed",
      companyId: "company-1",
    },
    {
      ...state,
      reminders: [reminderActive],
    },
    () => "reminder-2",
    () => "2026-03-25T08:05:00.000Z",
  );

  const doneReminder = updateReminder(
    reminderActive,
    { status: "done" },
    {
      ...state,
      reminders: [reminderActive, reminderSnoozed],
    },
    () => "2026-03-25T09:00:00.000Z",
  );

  assert.equal(doneReminder.status, "done");
  assert.equal(doneReminder.completedAt, "2026-03-25T09:00:00.000Z");

  const filtered = filterReminders([reminderActive, reminderSnoozed, doneReminder], {
    query: "kas",
    status: "active",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "reminder-1");

  const sorted = sortReminders([doneReminder, reminderSnoozed, reminderActive]);
  assert.equal(sorted[0].id, "reminder-1");
  assert.equal(sorted[1].id, "reminder-2");
  assert.equal(sorted[2].status, "done");
});

test("todo tasks support assignment, work-order linking, comments and filtering", () => {
  const state = buildState();
  const workOrder = createWorkOrder(
    {
      companyId: "company-1",
      locationId: "location-1",
      description: "Dogovor s klijentom",
    },
    state,
    () => "work-order-1",
    "RN-00155",
    () => "2026-03-25T09:00:00.000Z",
  );

  const todo = createTodoTask(
    {
      organizationId: "7",
      title: "Nazovi klijenta",
      message: "Treba potvrditi termin i poslati odgovor kolegi.",
      assignedToUserId: "22",
      assignedToLabel: "Iva Novak",
      createdByUserId: "11",
      createdByLabel: "Branimir Tramošljika",
      workOrderId: workOrder.id,
      dueDate: "2026-03-29",
      priority: "High",
    },
    {
      ...state,
      workOrders: [workOrder],
      todoTasks: [],
    },
    () => "todo-1",
    () => "2026-03-26T08:00:00.000Z",
  );

  assert.equal(todo.companyId, "company-1");
  assert.equal(todo.locationId, "location-1");
  assert.equal(todo.workOrderNumber, "RN-00155");
  assert.equal(todo.assignedToLabel, "Iva Novak");

  const commented = createTodoTaskComment(
    todo,
    {
      userId: "22",
      authorLabel: "Iva Novak",
      message: "Preuzimam, javim povratnu informaciju danas.",
    },
    () => "comment-1",
    () => "2026-03-26T09:00:00.000Z",
  );

  assert.equal(commented.comments.length, 1);
  assert.equal(commented.commentCount, 1);
  assert.equal(commented.comments[0].message, "Preuzimam, javim povratnu informaciju danas.");

  const progressed = updateTodoTask(
    commented,
    {
      status: "in_progress",
      priority: "Urgent",
    },
    {
      ...state,
      workOrders: [workOrder],
      todoTasks: [commented],
    },
    () => "2026-03-26T10:00:00.000Z",
  );

  assert.equal(progressed.status, "in_progress");
  assert.equal(progressed.priority, "Urgent");

  const filtered = filterTodoTasks([progressed], {
    query: "klijenta",
    status: "in_progress",
    scope: "assigned",
    userId: "22",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "todo-1");

  const sorted = sortTodoTasks([
    {
      ...progressed,
      id: "todo-2",
      title: "Kasnije",
      dueDate: "2026-04-02",
      priority: "Normal",
      updatedAt: "2026-03-26T08:00:00.000Z",
    },
    progressed,
  ]);

  assert.equal(sorted[0].id, "todo-1");
});

test("parseCoordinates extracts numeric latitude and longitude", () => {
  assert.deepEqual(parseCoordinates("45,8123; 15,9777"), {
    latitude: 45.8123,
    longitude: 15.9777,
  });

  assert.equal(parseCoordinates("bez koordinata"), null);
});

test("buildWorkOrderCalendarLanes groups work orders by executor lane and day", () => {
  const lanes = buildWorkOrderCalendarLanes([
    {
      id: "wo-1",
      workOrderNumber: "RN-1",
      dueDate: "2026-03-30",
      executor1: "Ana Horvat",
      executor2: "Marko Ilic",
    },
    {
      id: "wo-2",
      workOrderNumber: "RN-2",
      dueDate: "2026-03-30",
      executor1: "Ana Horvat",
      executor2: "Marko Ilic",
    },
    {
      id: "wo-3",
      workOrderNumber: "RN-3",
      dueDate: "2026-04-01",
      executor1: "",
      executor2: "",
    },
    {
      id: "wo-4",
      workOrderNumber: "RN-4",
      dueDate: "",
      executor1: "Ana Horvat",
      executor2: "",
    },
  ], "2026-03-30");

  assert.deepEqual(lanes.days, [
    "2026-03-30",
    "2026-03-31",
    "2026-04-01",
    "2026-04-02",
    "2026-04-03",
    "2026-04-04",
    "2026-04-05",
  ]);
  assert.equal(lanes.lanes[0].label, "Ana Horvat + Marko Ilic");
  assert.equal(lanes.lanes[0].itemsByDate["2026-03-30"].length, 2);
  assert.equal(lanes.lanes.find((lane) => lane.key === "unassigned").itemsByDate["2026-04-01"].length, 1);
  assert.equal(lanes.unscheduled.length, 1);
});

test("buildWorkOrderCalendarTeamWeeks groups work orders by assigned team and keeps undated items on the side", () => {
  const calendar = buildWorkOrderCalendarTeamWeeks([
    {
      id: "wo-1",
      workOrderNumber: "RN-1",
      dueDate: "2026-03-03",
      teamLabel: "Tim Zagreb",
      executor1: "Ana Horvat",
      executor2: "Marko Ilic",
      region: "Zagreb",
    },
    {
      id: "wo-2",
      workOrderNumber: "RN-2",
      dueDate: "2026-03-05",
      teamLabel: "Tim Zagreb",
      executor1: "Ana Horvat",
      executor2: "",
      region: "Zagreb",
    },
    {
      id: "wo-3",
      workOrderNumber: "RN-3",
      dueDate: "2026-03-14",
      teamLabel: "Tim Slavonija",
      executor1: "Iva Novak",
      executor2: "",
      region: "Slavonija",
    },
    {
      id: "wo-4",
      workOrderNumber: "RN-4",
      dueDate: "",
      teamLabel: "Tim Zagreb",
      executor1: "Ana Horvat",
      executor2: "",
      region: "Zagreb",
    },
  ], "2026-03-15");

  assert.equal(calendar.weeks.length >= 4, true);
  assert.equal(calendar.weeks[0].days.length, 7);
  assert.equal(calendar.weeks[0].days[0].key, "2026-02-23");
  assert.equal(calendar.weeks[0].days[6].key, "2026-03-01");

  const zagrebWeek = calendar.weeks.find((week) => week.groups.some((group) => group.label === "Tim Zagreb"));
  assert.ok(zagrebWeek);
  const zagrebGroup = zagrebWeek.groups.find((group) => group.label === "Tim Zagreb");
  assert.equal(zagrebGroup.itemsByDate["2026-03-03"].length, 1);
  assert.equal(zagrebGroup.itemsByDate["2026-03-05"].length, 1);

  assert.equal(calendar.unscheduledGroups.length, 1);
  assert.equal(calendar.unscheduledGroups[0].label, "Tim Zagreb");
  assert.equal(calendar.unscheduledGroups[0].items.length, 1);
});

test("buildWorkOrderMapMarkers returns only work orders with valid coordinates", () => {
  const map = buildWorkOrderMapMarkers([
    {
      id: "wo-1",
      workOrderNumber: "RN-1",
      companyName: "Acme",
      locationName: "Zagreb",
      region: "Zagreb",
      coordinates: "45.815, 15.982",
    },
    {
      id: "wo-2",
      workOrderNumber: "RN-2",
      companyName: "Acme",
      locationName: "Split",
      region: "Dalmacija",
      coordinates: "",
    },
  ]);

  assert.equal(map.markers.length, 1);
  assert.equal(map.markers[0].workOrderNumber, "RN-1");
  assert.ok(map.markers[0].x >= 0 && map.markers[0].x <= 100);
  assert.ok(map.markers[0].y >= 0 && map.markers[0].y <= 100);
});
