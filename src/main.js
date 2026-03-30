import {
  DASHBOARD_GRID_COLUMN_COUNT,
  DASHBOARD_WIDGET_HEIGHT_OPTIONS,
  DASHBOARD_WIDGET_DATE_WINDOW_OPTIONS,
  DASHBOARD_WIDGET_DEFINITIONS,
  DASHBOARD_WIDGET_SIZE_OPTIONS,
  DASHBOARD_WIDGET_SOURCE_OPTIONS,
  DASHBOARD_WIDGET_VISUALIZATION_OPTIONS,
  OFFER_STATUS_OPTIONS,
  REMINDER_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  TODO_TASK_STATUS_OPTIONS,
  VEHICLE_RESERVATION_STATUS_OPTIONS,
  VEHICLE_STATUS_OPTIONS,
  WORK_ORDER_STATUS_OPTIONS,
  buildLocationContacts,
  buildWorkOrderCalendarLanes,
  buildWorkOrderCalendarWeekColumns,
  buildWorkOrderCalendarMonthWeeks,
  buildWorkOrderCalendarTeamWeeks,
  buildWorkOrderMapMarkers,
  createDashboardWidget,
  deriveOfferInitials,
  filterOffers,
  filterReminders,
  filterTodoTasks,
  filterVehicles,
  filterWorkOrders,
  applyDashboardWidgetGridLayout,
  getVehicleAvailabilityStatus,
  getVehicleNextReservation,
  nextOfferNumber,
  getDashboardInsights,
  getDashboardWidgetData,
  getDashboardStats,
  groupWorkOrdersByExecutorSet,
  sortOffers,
  sortReminders,
  sortDashboardWidgets,
  sortTodoTasks,
  sortVehicleReservations,
  sortVehicles,
  sortWorkOrders,
  updateDashboardWidget,
} from "./safetyModel.js";
import {
  evaluateMeasurementFormula,
  formatMeasurementCellReference,
  isMeasurementFormula,
  listMeasurementFormulaReferences,
  parseMeasurementCellReference,
  shiftMeasurementFormulaReferences,
} from "./measurementFormula.js";
import {
  formatMeasurementComputedDisplayValue,
  formatMeasurementLiteralDisplayValue,
  getMeasurementBorderPreset,
  normalizeMeasurementCellFormat,
  normalizeMeasurementBorder,
} from "./measurementFormatting.js";

const API_BASE = "/api";
const WORK_ORDER_BATCH_SIZE = 60;
const WORK_ORDER_AUTOSAVE_DELAY_MS = 900;
const CHAT_POLL_INTERVAL_MS = 7_000;
const CHAT_PRESENCE_HEARTBEAT_MS = 20_000;
const OFFER_LOCATION_ALL_VALUE = "__all__";
const OFFER_LOCATION_NONE_VALUE = "__none__";
const DEFAULT_OFFER_NOTE = "Ponuda vrijedi 30 dana, rok placanja 30 dana od slanja racuna.";
const VEHICLE_SCHEDULE_START_HOUR = 6;
const VEHICLE_SCHEDULE_END_HOUR = 22;
const USER_PRESENCE_KEY_PREFIX = "s360-user-presence:";
const USER_PRESENCE_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "away", label: "Away" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
];
const DASHBOARD_CHART_COLORS = [
  "#5b8def",
  "#e35eb7",
  "#2db889",
  "#ffb648",
  "#7f6df2",
  "#f57261",
  "#45c7f0",
  "#b0b8c9",
];
const DASHBOARD_WIDGET_TEMPLATE_CATEGORIES = [
  { value: "featured", label: "Featured", copy: "Najkorisnije kartice za brzi start." },
  { value: "work_orders", label: "Radni nalozi", copy: "Operativa, statusi, rokovi i regije." },
  { value: "reminders", label: "Reminders", copy: "Podsjetnici, rokovi i aktivne stavke." },
  { value: "todo_tasks", label: "ToDo", copy: "Dodijeljeni zadaci, komunikacija i inbox." },
  { value: "locations", label: "Lokacije", copy: "Pokrivenost regija i kvaliteta podataka." },
];
const DASHBOARD_WIDGET_TEMPLATES = [
  { key: "featured-open-rn", category: "featured", source: "work_orders", visualization: "metric", metricKey: "active", title: "Otvoreni RN", description: "Brzi KPI za aktivne radne naloge.", size: "small", gridWidth: 3, gridHeight: 2, limit: 6 },
  { key: "featured-status", category: "featured", source: "work_orders", visualization: "donut", metricKey: "status", title: "Status radnih naloga", description: "Udio RN po statusima na jednom mjestu.", size: "large", gridWidth: 6, gridHeight: 4, limit: 6 },
  { key: "featured-priority", category: "featured", source: "work_orders", visualization: "bar", metricKey: "priority", title: "Prioriteti RN", description: "Pregled prioriteta i opterecenja.", size: "large", gridWidth: 6, gridHeight: 4, limit: 5 },
  { key: "featured-upcoming", category: "featured", source: "work_orders", visualization: "list", metricKey: "upcoming_due", title: "Sljedeci rokovi", description: "RN koje treba pratiti u narednim danima.", size: "large", gridWidth: 6, gridHeight: 4, limit: 6 },
  { key: "wo-total", category: "work_orders", source: "work_orders", visualization: "metric", metricKey: "total", title: "Svi radni nalozi", description: "Ukupan broj RN nakon aktivnih filtara.", size: "small", gridWidth: 3, gridHeight: 2, limit: 6 },
  { key: "wo-overdue", category: "work_orders", source: "work_orders", visualization: "metric", metricKey: "overdue", title: "RN u kasnjenju", description: "Otvoreni RN kojima je rok vec prosao.", size: "small", gridWidth: 3, gridHeight: 2, limit: 6 },
  { key: "wo-region-bar", category: "work_orders", source: "work_orders", visualization: "bar", metricKey: "region", title: "RN po regiji", description: "Bar chart raspodjele po regijama.", size: "full", gridWidth: 12, gridHeight: 4, limit: 6 },
  { key: "wo-executor-donut", category: "work_orders", source: "work_orders", visualization: "donut", metricKey: "executor", title: "Opterecenje izvrsitelja", description: "Tko trenutno nosi najvise RN-a.", size: "large", gridWidth: 6, gridHeight: 4, limit: 6 },
  { key: "reminders-active", category: "reminders", source: "reminders", visualization: "metric", metricKey: "active", title: "Aktivni reminders", description: "Broj otvorenih reminders stavki.", size: "small", gridWidth: 3, gridHeight: 2, limit: 6 },
  { key: "reminders-status", category: "reminders", source: "reminders", visualization: "donut", metricKey: "status", title: "Reminder statusi", description: "Kako su reminders rasporedeni po statusu.", size: "large", gridWidth: 6, gridHeight: 4, limit: 6 },
  { key: "reminders-due", category: "reminders", source: "reminders", visualization: "list", metricKey: "due_soon", title: "Reminder rokovi", description: "Sto uskoro dolazi na red.", size: "large", gridWidth: 6, gridHeight: 4, limit: 6 },
  { key: "todo-assigned", category: "todo_tasks", source: "todo_tasks", visualization: "metric", metricKey: "assigned_to_me", title: "Moji zadaci", description: "Koliko zadataka je dodijeljeno meni.", size: "small", gridWidth: 3, gridHeight: 2, limit: 6 },
  { key: "todo-status", category: "todo_tasks", source: "todo_tasks", visualization: "donut", metricKey: "status", title: "ToDo statusi", description: "Raspodjela timskih zadataka po statusu.", size: "large", gridWidth: 6, gridHeight: 4, limit: 6 },
  { key: "todo-open-items", category: "todo_tasks", source: "todo_tasks", visualization: "list", metricKey: "open_items", title: "Otvoreni ToDo", description: "Aktivna komunikacija i otvoreni taskovi.", size: "large", gridWidth: 6, gridHeight: 4, limit: 6 },
  { key: "locations-missing", category: "locations", source: "locations", visualization: "metric", metricKey: "missing_coordinates", title: "Lokacije bez koordinata", description: "Lokacije koje jos traze doradu podataka.", size: "small", gridWidth: 3, gridHeight: 2, limit: 6 },
  { key: "locations-region", category: "locations", source: "locations", visualization: "bar", metricKey: "region", title: "Lokacije po regiji", description: "Raspored lokacija kroz regije.", size: "large", gridWidth: 6, gridHeight: 4, limit: 6 },
  { key: "locations-list", category: "locations", source: "locations", visualization: "list", metricKey: "recent", title: "Lista lokacija", description: "Brzi pregled lokacija i koordinata.", size: "large", gridWidth: 6, gridHeight: 4, limit: 6 },
];
const DASHBOARD_GRID_GAP_PX = 14;
let dashboardWidgetLayoutInteraction = null;
let workOrderLeafletMap = null;
let workOrderLeafletLayer = null;
let workOrderLeafletClusterLayer = null;
let workOrderLeafletMarkers = new Map();
let workOrderCalendarShellHeightFrame = 0;
const DEFAULT_MEASUREMENT_ROW_COUNT = 72;
const MEASUREMENT_ROW_BATCH_SIZE = 48;
const MIN_VISIBLE_MEASUREMENT_ROWS = 120;
const MEASUREMENT_COMPUTE_DEBOUNCE_MS = 90;
const WORK_ORDER_VIEW_MODES = [
  { value: "list", label: "List" },
  { value: "calendar", label: "Calendar" },
  { value: "maps", label: "Maps" },
];
const DEFAULT_MEASUREMENT_COLUMNS = [
  { id: "point", label: "Mjerno mjesto", placeholder: "Mjerno mjesto", width: 220 },
  { id: "label", label: "Oznaka", placeholder: "Oznaka", width: 120 },
  { id: "unit", label: "Jedinica", placeholder: "Jedinica", width: 120 },
  { id: "min", label: "Min", placeholder: "Min", width: 110 },
  { id: "max", label: "Max", placeholder: "Max", width: 110 },
  { id: "reading1", label: "Mjerenje 1", placeholder: "0,00", width: 120 },
  { id: "reading2", label: "Mjerenje 2", placeholder: "0,00", width: 120 },
  { id: "reading3", label: "Mjerenje 3", placeholder: "0,00", width: 120 },
  { id: "average", label: "Prosjek", placeholder: "", width: 120, computed: "average", readonly: true },
  { id: "note", label: "Napomena", placeholder: "Napomena", width: 240 },
];
const SIDEBAR_COLLAPSED_KEY = "s360-sidebar-collapsed";
const RAIL_HIDDEN_KEY = "s360-rail-hidden";
const ALL_SIDEBAR_GROUPS = [
  "home",
  "organisations",
  "operations",
  "company",
  "locations",
  "documents",
  "learning",
];
const VIEW_TO_SIDEBAR_GROUP = {
  selfdash: "home",
  reminders: "home",
  todo: "home",
  companies: "company",
  locations: "locations",
  management: "organisations",
  module: "home",
};
const VIEW_TO_ALLOWED_SIDEBAR_GROUPS = {
  selfdash: ["home", "operations"],
  reminders: ["home"],
  todo: ["home"],
  companies: ["company"],
  locations: ["locations"],
  management: ["organisations"],
  module: ALL_SIDEBAR_GROUPS,
};
const SIDEBAR_GROUP_DEFAULT_VIEW = {
  home: "selfdash",
  organisations: "management",
  operations: "selfdash",
  company: "companies",
  locations: "locations",
  documents: "module",
  learning: "module",
};
const MODULE_VIEW_DEFINITIONS = {
  reminders: {
    kicker: "Home",
    title: "Reminders",
    description: "Ovjde mozemo pripremiti podsjetnike, follow-upove i operativne termine vezane uz klijente, opremu i naloge.",
    chips: ["Follow-up", "Deadlines", "Alerts"],
  },
  todo: {
    kicker: "Home",
    title: "ToDo",
    description: "Modul je pripremljen za osobne i timske zadatke, s kratkim pregledom sto je hitno i sto jos ceka obradu.",
    chips: ["Personal tasks", "Team tasks", "Today"],
  },
  settings: {
    kicker: "Home",
    title: "Settings",
    description: "Mjesto za korisnicke postavke, preference prikaza i sistemske opcije koje cemo kasnije odvojiti po ulozi.",
    chips: ["Profile", "Preferences", "Workspace"],
  },
  "measurement-equipment": {
    kicker: "Organisations",
    title: "Measurement Equipment",
    description: "Sekcija za popis i pracenje mjerne opreme, certifikata i servisnih rokova unutar organizacije.",
    chips: ["Devices", "Calibration", "Service dates"],
  },
  vehicles: {
    kicker: "Organisations",
    title: "Vehicles",
    description: "Pregled vozila, raspolozivosti i povezanih operativnih podataka za organizaciju.",
    chips: ["Fleet", "Availability", "Assignments"],
  },
  "safety-authorization": {
    kicker: "Organisations",
    title: "Safety Authorization",
    description: "Prostor za ovlasti, autorizacije i evidenciju sigurnosnih prava zaposlenika i suradnika.",
    chips: ["Authorizations", "Validity", "Access levels"],
  },
  offers: {
    kicker: "Operations",
    title: "Offers",
    description: "Modul za ponude mozemo spojiti ovdje, uz klijente, lokacije i stavke usluge iz istog workspacea.",
    chips: ["Drafts", "Sent", "Accepted"],
  },
  periodics: {
    kicker: "Operations",
    title: "Periodics",
    description: "Pregled periodicnih obveza, kontrola i ponavljajucih naloga za organizaciju i klijente.",
    chips: ["Cycles", "Recurring", "Service plans"],
  },
  contract: {
    kicker: "Company",
    title: "Contract",
    description: "Ovdje mozemo kasnije izdvojiti ugovore, broj ugovora, anekse i povezane komercijalne dokumente.",
    chips: ["Contracts", "Renewals", "Annexes"],
  },
  documents: {
    kicker: "Documents",
    title: "Documents",
    description: "Centralni dokumentni sloj za priloge, obrasce i datoteke vezane uz organizaciju, klijenta ili lokaciju.",
    chips: ["Files", "Templates", "Evidence"],
  },
  tests: {
    kicker: "Learning",
    title: "Tests",
    description: "Mjesto za testove, provjere znanja i internu edukaciju zaposlenika po organizacijama.",
    chips: ["Knowledge checks", "Exams", "Progress"],
  },
  "learning-people": {
    kicker: "Learning",
    title: "People",
    description: "Pregled polaznika, statusa edukacija i napretka po zaposlenicima i timovima.",
    chips: ["Learners", "Status", "Certificates"],
  },
};
const SIDEBAR_ITEM_CONFIG = {
  dashboard: { group: "home", view: "selfdash", focus: "top" },
  reminders: { group: "home", view: "reminders" },
  todo: { group: "home", view: "todo" },
  settings: { group: "home", view: "module", module: "settings" },
  "measurement-equipment": { group: "organisations", view: "module", module: "measurement-equipment" },
  vehicles: { group: "organisations", view: "module", module: "vehicles" },
  people: { group: "organisations", view: "management" },
  "safety-authorization": { group: "organisations", view: "module", module: "safety-authorization" },
  rn: { group: "operations", view: "selfdash", focus: "list" },
  offers: { group: "operations", view: "module", module: "offers" },
  periodics: { group: "operations", view: "module", module: "periodics" },
  "list-company": { group: "company", view: "companies", focus: "list" },
  "add-company": { group: "company", view: "companies", focus: "form" },
  contract: { group: "company", view: "module", module: "contract" },
  "list-location": { group: "locations", view: "locations", focus: "list" },
  "add-location": { group: "locations", view: "locations", focus: "form" },
  documents: { group: "documents", view: "module", module: "documents" },
  tests: { group: "learning", view: "module", module: "tests" },
  "learning-people": { group: "learning", view: "module", module: "learning-people" },
};
const SIDEBAR_GROUP_DEFAULT_ITEM = {
  home: "dashboard",
  organisations: "people",
  operations: "rn",
  company: "list-company",
  locations: "list-location",
  documents: "documents",
  learning: "tests",
};
const SIDEBAR_GROUP_LABELS = {
  home: "Home",
  organisations: "Organisations",
  operations: "Operations",
  company: "Company",
  locations: "Locations",
  documents: "Documents",
  learning: "Learning",
};
const SIDEBAR_ITEM_LABELS = {
  dashboard: "Dashboard",
  reminders: "Reminders",
  todo: "ToDo",
  settings: "Settings",
  "measurement-equipment": "Measurement Equipment",
  vehicles: "Vehicles",
  people: "People",
  "safety-authorization": "Safety Authorization",
  rn: "RN",
  offers: "Offers",
  periodics: "Periodics",
  "list-company": "List Company",
  "add-company": "Add New",
  contract: "Contract",
  "list-location": "List Location",
  "add-location": "Add New",
  documents: "Documents",
  tests: "Test",
  "learning-people": "People",
};
const AUTH_RETRY_EXCLUDED_PATHS = new Set([
  "/auth/login",
  "/auth/signup",
  "/auth/logout",
  "/auth/refresh",
  "/auth/session",
  "/health",
]);

const state = {
  storage: "memory",
  organizations: [],
  companies: [],
  locations: [],
  users: [],
  signupRequests: [],
  loginContentItems: [],
  loginContent: null,
  workOrders: [],
  reminders: [],
  todoTasks: [],
  offers: [],
  vehicles: [],
  dashboardWidgets: [],
  activeView: "selfdash",
  user: null,
  activeOrganizationId: "",
  activeTodoTaskId: "",
  activeDashboardWidgetId: "",
  activeVehicleId: "",
  activeVehicleReservationId: "",
  companyEditorOpen: false,
  locationEditorOpen: false,
  vehicleEditorOpen: false,
  vehicleReservationEditorOpen: false,
  vehicleReservationAssigneePickerOpen: false,
  vehicleScheduleDate: new Date().toISOString().slice(0, 10),
  vehicleScheduleSelection: null,
  activeWorkOrderViewMode: "list",
  offerEditorOpen: false,
  workOrderCalendar: {
    weekStart: new Date().toISOString().slice(0, 10),
    displayMode: "week",
    showWeekends: true,
    showUnscheduled: true,
    draggingWorkOrderId: "",
    draggingGroupIds: [],
    dragLaneKey: "",
    expandedGroupKeys: new Set(),
  },
  workOrderMap: {
    selectedWorkOrderId: "",
    popupWorkOrderId: "",
    filters: {
      status: "all",
      priority: "all",
      region: "all",
    },
    markerSignature: "",
  },
  workOrderRenderLimit: WORK_ORDER_BATCH_SIZE,
  expandedWorkOrderIds: new Set(),
  workOrderActivity: {
    workOrderId: "",
    loading: false,
    items: [],
    error: "",
  },
  workOrderEditorOpen: false,
  workOrderAutoSave: {
    timerId: null,
    saving: false,
    dirty: false,
    lastFingerprint: "",
    lastSavedAt: "",
    state: "idle",
  },
  activeSidebarGroup: "home",
  activeSidebarItem: "dashboard",
  activeModuleItem: "documents",
  sidebarCollapsed: false,
  railHidden: false,
  measurementSheet: {
    isOpen: false,
    columns: [],
    rows: [],
    resizing: null,
    activeCell: null,
    editingCell: null,
    editorSource: null,
    formulaReferences: [],
    selectionAnchor: null,
    selectedRange: null,
    selectionDrag: null,
    fillDrag: null,
    fillMenu: null,
    contextMenu: null,
  },
  dashboardBuilder: {
    open: false,
    draftMode: "create",
    draftId: "",
    category: "featured",
    search: "",
    templateKey: "",
    seeding: false,
  },
  chat: {
    open: false,
    tab: "conversations",
    search: "",
    conversations: [],
    users: [],
    presenceByUserId: {},
    activeConversationId: "",
    composerOpen: false,
    composerTitle: "",
    composerParticipantIds: [],
    unreadTotal: 0,
    loaded: false,
    loading: false,
    sending: false,
    error: "",
    lastOrganizationId: "",
  },
};

function readSidebarCollapsedPreference() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function readRailHiddenPreference() {
  try {
    return window.localStorage.getItem(RAIL_HIDDEN_KEY) === "true";
  } catch {
    return false;
  }
}

state.sidebarCollapsed = readSidebarCollapsedPreference();
state.railHidden = readRailHiddenPreference();

let measurementRowCounter = 0;
let measurementColumnCounter = 0;
let measurementComputedRefreshTimerId = 0;
let userPresenceMenuOpen = false;
let chatPollTimerId = null;
let chatLastPresenceSyncAt = 0;
let chatLastPresenceValue = "";

const authScreen = document.querySelector("#auth-screen");
const appShell = document.querySelector("#app-shell");
const appFrame = document.querySelector("#app-frame");
const appSidebar = document.querySelector("#app-sidebar");
const appHomeButton = document.querySelector("#app-home-button");
const appRailToggle = document.querySelector("#app-rail-toggle");
const appRailRestore = document.querySelector("#app-rail-restore");
const loginForm = document.querySelector("#login-form");
const loginEmailInput = document.querySelector("#login-email");
const loginPasswordInput = document.querySelector("#login-password");
const loginSubmitButton = document.querySelector("#login-submit-button");
const loginError = document.querySelector("#login-error");
const userBadge = document.querySelector("#user-badge");
const userMenuPanel = document.querySelector("#user-menu-panel");
const userMenuAvatar = document.querySelector("#user-menu-avatar");
const userMenuName = document.querySelector("#user-menu-name");
const userMenuRole = document.querySelector("#user-menu-role");
const userMenuPresenceCurrent = document.querySelector("#user-menu-presence-current");
const userMenuEmail = document.querySelector("#user-menu-email");
const userMenuOrganizations = document.querySelector("#user-menu-organizations");
const userMenuPresenceButton = document.querySelector("#user-menu-presence-button");
const userMenuPresenceLabel = document.querySelector("#user-menu-presence-label");
const userMenuPresenceMenu = document.querySelector("#user-menu-presence-menu");
const userMenuActiveOrg = document.querySelector("#user-menu-active-org");
const userMenuOrgCount = document.querySelector("#user-menu-org-count");
const userMenuLastLogin = document.querySelector("#user-menu-last-login");
const userMenuAvatarButton = document.querySelector("#user-menu-avatar-button");
const userMenuAvatarFileInput = document.querySelector("#user-menu-avatar-file");
const userMenuError = document.querySelector("#user-menu-error");
const logoutButton = document.querySelector("#logout-button");
const chatDock = document.querySelector("#chat-dock");
const chatLauncher = document.querySelector("#chat-launcher");
const chatLauncherPresence = document.querySelector("#chat-launcher-presence");
const chatLauncherCaption = document.querySelector("#chat-launcher-caption");
const chatLauncherUnread = document.querySelector("#chat-launcher-unread");
const chatPanel = document.querySelector("#chat-panel");
const chatCloseButton = document.querySelector("#chat-close-button");
const chatNewGroupButton = document.querySelector("#chat-new-group-button");
const chatTabButtons = Array.from(document.querySelectorAll("[data-chat-tab]"));
const chatSearchInput = document.querySelector("#chat-search-input");
const chatListCaption = document.querySelector("#chat-list-caption");
const chatConversationsView = document.querySelector("#chat-conversations-view");
const chatPeopleView = document.querySelector("#chat-people-view");
const chatThreadEmpty = document.querySelector("#chat-thread-empty");
const chatThreadView = document.querySelector("#chat-thread-view");
const chatThreadTitle = document.querySelector("#chat-thread-title");
const chatThreadMeta = document.querySelector("#chat-thread-meta");
const chatThreadMessages = document.querySelector("#chat-thread-messages");
const chatMessageForm = document.querySelector("#chat-message-form");
const chatMessageInput = document.querySelector("#chat-message-input");
const chatSendButton = document.querySelector("#chat-send-button");
const chatError = document.querySelector("#chat-error");
const chatComposer = document.querySelector("#chat-composer");
const chatComposerTitleInput = document.querySelector("#chat-composer-title");
const chatComposerUsers = document.querySelector("#chat-composer-users");
const chatComposerCreateButton = document.querySelector("#chat-composer-create");
const chatComposerError = document.querySelector("#chat-composer-error");
const chatComposerCloseButtons = Array.from(document.querySelectorAll("[data-chat-composer-close]"));
const sidebarHomeButton = document.querySelector("#sidebar-home-button");
const sidebarActiveOrganization = document.querySelector("#sidebar-active-organization");
const sidebarCollapseToggle = document.querySelector("#sidebar-collapse-toggle");
const railButtons = Array.from(document.querySelectorAll("[data-sidebar-group]"));
const railOrganisationsButton = document.querySelector("#rail-organisations-button");
const sidebarGroupButtons = Array.from(document.querySelectorAll("[data-group-toggle]"));
const sidebarGroupPanels = Array.from(document.querySelectorAll("[data-sidebar-group-panel]"));
const sidebarOrganisationsGroupPanel = document.querySelector("#sidebar-organisations-group-panel");
const sidebarNavItems = Array.from(document.querySelectorAll("[data-sidebar-item]"));
const organizationContext = document.querySelector("#organization-context");
const organizationSwitcherWrap = document.querySelector("#organization-switcher-wrap");
const organizationSwitcher = document.querySelector("#organization-switcher");
const connectionStatus = document.querySelector("#connection-status");
const syncError = document.querySelector("#sync-error");
const managementTab = document.querySelector("#management-tab");
const managementNavLabel = document.querySelector("#management-nav-label");
const workspaceViews = {
  selfdash: document.querySelector("#selfdash-view"),
  reminders: document.querySelector("#reminders-view"),
  todo: document.querySelector("#todo-view"),
  companies: document.querySelector("#companies-view"),
  locations: document.querySelector("#locations-view"),
  management: document.querySelector("#management-view"),
  module: document.querySelector("#module-view"),
};
const moduleViewKicker = document.querySelector("#module-view-kicker");
const moduleViewTitle = document.querySelector("#module-view-title");
const moduleViewDescription = document.querySelector("#module-view-description");
const moduleViewChips = document.querySelector("#module-view-chips");
const vehiclesModule = document.querySelector("#vehicles-module");
const vehiclesTotalCount = document.querySelector("#vehicles-total-count");
const vehiclesAvailableCount = document.querySelector("#vehicles-available-count");
const vehiclesReservedCount = document.querySelector("#vehicles-reserved-count");
const vehiclesServiceCount = document.querySelector("#vehicles-service-count");
const vehiclesSearchInput = document.querySelector("#vehicles-search");
const vehiclesFilterStatusInput = document.querySelector("#vehicles-filter-status");
const vehiclesHelper = document.querySelector("#vehicles-helper");
const vehiclesList = document.querySelector("#vehicles-list");
const vehiclesEmpty = document.querySelector("#vehicles-empty");
const vehicleSchedulePrevButton = document.querySelector("#vehicle-schedule-prev");
const vehicleScheduleTodayButton = document.querySelector("#vehicle-schedule-today");
const vehicleScheduleNextButton = document.querySelector("#vehicle-schedule-next");
const vehicleScheduleDateInput = document.querySelector("#vehicle-schedule-date");
const vehicleScheduleHelper = document.querySelector("#vehicle-schedule-helper");
const vehicleScheduleGridShell = document.querySelector("#vehicle-schedule-grid-shell");
const vehicleScheduleGrid = document.querySelector("#vehicle-schedule-grid");
const vehicleScheduleEmpty = document.querySelector("#vehicle-schedule-empty");
const vehicleOpenFormButton = document.querySelector("#vehicle-open-form");
const vehicleEditorBackdrop = document.querySelector("#vehicle-editor-backdrop");
const vehicleEditorPanel = document.querySelector("#vehicle-editor-panel");
const vehicleEditorCloseButton = document.querySelector("#vehicle-editor-close");
const vehicleEditorBody = vehicleEditorPanel?.querySelector(".vehicle-modal-body");
const vehicleEditorTitle = document.querySelector("#vehicle-editor-title");
const vehicleAvailabilityPreview = document.querySelector("#vehicle-availability-preview");
const vehicleForm = document.querySelector("#vehicle-form");
const vehicleIdInput = document.querySelector("#vehicle-id");
const vehicleNameInput = document.querySelector("#vehicle-name");
const vehiclePlateNumberInput = document.querySelector("#vehicle-plate-number");
const vehicleStatusInput = document.querySelector("#vehicle-status");
const vehicleCategoryInput = document.querySelector("#vehicle-category");
const vehicleMakeInput = document.querySelector("#vehicle-make");
const vehicleModelInput = document.querySelector("#vehicle-model");
const vehicleYearInput = document.querySelector("#vehicle-year");
const vehicleColorInput = document.querySelector("#vehicle-color");
const vehicleFuelTypeInput = document.querySelector("#vehicle-fuel-type");
const vehicleTransmissionInput = document.querySelector("#vehicle-transmission");
const vehicleSeatCountInput = document.querySelector("#vehicle-seat-count");
const vehicleOdometerKmInput = document.querySelector("#vehicle-odometer-km");
const vehicleServiceDueDateInput = document.querySelector("#vehicle-service-due-date");
const vehicleRegistrationExpiresOnInput = document.querySelector("#vehicle-registration-expires-on");
const vehicleNotesInput = document.querySelector("#vehicle-notes");
const vehicleError = document.querySelector("#vehicle-error");
const vehicleResetButton = document.querySelector("#vehicle-reset");
const vehicleDeleteButton = document.querySelector("#vehicle-delete");
const vehicleReservationsTitle = document.querySelector("#vehicle-reservations-title");
const vehicleOpenReservationButton = document.querySelector("#vehicle-open-reservation");
const vehicleReservationBackdrop = document.querySelector("#vehicle-reservation-backdrop");
const vehicleReservationPanel = document.querySelector("#vehicle-reservation-panel");
const vehicleReservationCloseButton = document.querySelector("#vehicle-reservation-close");
const vehicleReservationBody = vehicleReservationPanel?.querySelector(".vehicle-modal-body");
const vehicleReservationForm = document.querySelector("#vehicle-reservation-form");
const vehicleReservationIdInput = document.querySelector("#vehicle-reservation-id");
const vehicleReservationVehicleIdInput = document.querySelector("#vehicle-reservation-vehicle-id");
const vehicleReservationStatusInput = document.querySelector("#vehicle-reservation-status");
const vehicleReservationAssigneesDropdown = document.querySelector("#vehicle-reservation-assignees-dropdown");
const vehicleReservationAssigneesTrigger = document.querySelector("#vehicle-reservation-assignees-trigger");
const vehicleReservationAssigneesPreview = document.querySelector("#vehicle-reservation-assignees-preview");
const vehicleReservationAssigneesInput = document.querySelector("#vehicle-reservation-assignees");
const vehicleReservationPurposeInput = document.querySelector("#vehicle-reservation-purpose");
const vehicleReservationStartAtInput = document.querySelector("#vehicle-reservation-start-at");
const vehicleReservationEndAtInput = document.querySelector("#vehicle-reservation-end-at");
const vehicleReservationDestinationInput = document.querySelector("#vehicle-reservation-destination");
const vehicleReservationNoteInput = document.querySelector("#vehicle-reservation-note");
const vehicleReservationError = document.querySelector("#vehicle-reservation-error");
const vehicleReservationResetButton = document.querySelector("#vehicle-reservation-reset");
const vehicleReservationsList = document.querySelector("#vehicle-reservations-list");
const vehicleReservationsEmpty = document.querySelector("#vehicle-reservations-empty");
const offersModule = document.querySelector("#offers-module");
const offersTotalCount = document.querySelector("#offers-total-count");
const offersDraftCount = document.querySelector("#offers-draft-count");
const offersSentCount = document.querySelector("#offers-sent-count");
const offersAcceptedCount = document.querySelector("#offers-accepted-count");
const offersSearchInput = document.querySelector("#offers-search");
const offersFilterStatusInput = document.querySelector("#offers-filter-status");
const offersHelper = document.querySelector("#offers-helper");
const offersList = document.querySelector("#offers-list");
const offersEmpty = document.querySelector("#offers-empty");
const offerOpenFormButton = document.querySelector("#offer-open-form");
const offerEditorBackdrop = document.querySelector("#offer-editor-backdrop");
const offerEditorPanel = document.querySelector("#offer-editor-panel");
const offerEditorCloseButton = document.querySelector("#offer-editor-close");
const offerEditorBody = offerEditorPanel?.querySelector(".offers-editor-body");
const offerForm = document.querySelector("#offer-form");
const offerIdInput = document.querySelector("#offer-id");
const offerNumberPreview = document.querySelector("#offer-number-preview");
const offerTotalPreviewBlock = document.querySelector("#offer-total-preview-block");
const offerTotalPreview = document.querySelector("#offer-total-preview");
const offerTitleInput = document.querySelector("#offer-title");
const offerCompanyIdInput = document.querySelector("#offer-company-id");
const offerCompanyPreview = document.querySelector("#offer-company-preview");
const offerCompanyPreviewLogo = document.querySelector("#offer-company-preview-logo");
const offerCompanyPreviewName = document.querySelector("#offer-company-preview-name");
const offerCompanyPreviewMeta = document.querySelector("#offer-company-preview-meta");
const offerLocationIdInput = document.querySelector("#offer-location-id");
const offerContactSlotInput = document.querySelector("#offer-contact-slot");
const offerServiceLineInput = document.querySelector("#offer-service-line");
const offerStatusInput = document.querySelector("#offer-status");
const offerDateInput = document.querySelector("#offer-date");
const offerTaxRateInput = document.querySelector("#offer-tax-rate");
const offerNoteInput = document.querySelector("#offer-note");
const offerAddItemButton = document.querySelector("#offer-add-item");
const offerItems = document.querySelector("#offer-items");
const offerSubtotal = document.querySelector("#offer-subtotal");
const offerDiscountLine = document.querySelector("#offer-discount-line");
const offerDiscountTotal = document.querySelector("#offer-discount-total");
const offerTaxableSubtotalLine = document.querySelector("#offer-taxable-subtotal-line");
const offerTaxableSubtotal = document.querySelector("#offer-taxable-subtotal");
const offerTaxTotal = document.querySelector("#offer-tax-total");
const offerGrandTotalLine = document.querySelector("#offer-grand-total-line");
const offerGrandTotal = document.querySelector("#offer-grand-total");
const offerTotalsCard = document.querySelector(".offers-totals-card");
const offerToggleDiscountButton = document.querySelector("#offer-toggle-discount");
const offerToggleTotalButton = document.querySelector("#offer-toggle-total");
const offerDiscountRateWrap = document.querySelector("#offer-discount-rate-wrap");
const offerDiscountRateInput = document.querySelector("#offer-discount-rate");
const offerError = document.querySelector("#offer-error");
const offerResetButton = document.querySelector("#offer-reset");
const offerDeleteButton = document.querySelector("#offer-delete");

let offerFormItems = [];

const companiesCount = document.querySelector("#companies-count");
const locationsCount = document.querySelector("#locations-count");
const activeWorkOrdersCount = document.querySelector("#active-work-orders-count");
const completedWorkOrdersCount = document.querySelector("#completed-work-orders-count");
const overdueWorkOrdersCount = document.querySelector("#overdue-work-orders-count");
const dashboardOverviewPanel = document.querySelector("#dashboard-overview-panel");
const dashboardWidgetGrid = document.querySelector("#dashboard-widget-grid");
const dashboardWidgetEmpty = document.querySelector("#dashboard-widget-empty");
const dashboardAddWidgetButton = document.querySelector("#dashboard-add-widget");
const dashboardSeedLayoutButton = document.querySelector("#dashboard-seed-layout");
const dashboardBuilderPanel = document.querySelector("#dashboard-builder-panel");
const dashboardBuilderBackdrop = document.querySelector("#dashboard-builder-backdrop");
const dashboardBuilderClose = document.querySelector("#dashboard-builder-close");
const dashboardBuilderTitle = document.querySelector("#dashboard-builder-title");
const dashboardBuilderCopy = document.querySelector("#dashboard-builder-copy");
const dashboardWidgetSearchInput = document.querySelector("#dashboard-widget-search");
const dashboardWidgetCategoryList = document.querySelector("#dashboard-widget-category-list");
const dashboardWidgetTemplateGrid = document.querySelector("#dashboard-widget-template-grid");
const dashboardWidgetForm = document.querySelector("#dashboard-widget-form");
const dashboardWidgetIdInput = document.querySelector("#dashboard-widget-id");
const dashboardWidgetTitleInput = document.querySelector("#dashboard-widget-title");
const dashboardWidgetVisualizationInput = document.querySelector("#dashboard-widget-visualization");
const dashboardWidgetSourceInput = document.querySelector("#dashboard-widget-source");
const dashboardWidgetMetricInput = document.querySelector("#dashboard-widget-metric");
const dashboardWidgetMetricLabel = document.querySelector("#dashboard-widget-metric-label");
const dashboardWidgetSizeInput = document.querySelector("#dashboard-widget-size");
const dashboardWidgetWidthInput = document.querySelector("#dashboard-widget-width");
const dashboardWidgetHeightInput = document.querySelector("#dashboard-widget-height");
const dashboardWidgetLimitInput = document.querySelector("#dashboard-widget-limit");
const dashboardWidgetCompanyFilterInput = document.querySelector("#dashboard-widget-company-filter");
const dashboardWidgetStatusFilterInput = document.querySelector("#dashboard-widget-status-filter");
const dashboardWidgetPriorityFilterInput = document.querySelector("#dashboard-widget-priority-filter");
const dashboardWidgetRegionFilterInput = document.querySelector("#dashboard-widget-region-filter");
const dashboardWidgetExecutorFilterInput = document.querySelector("#dashboard-widget-executor-filter");
const dashboardWidgetAssigneeFilterInput = document.querySelector("#dashboard-widget-assignee-filter");
const dashboardWidgetDateWindowInput = document.querySelector("#dashboard-widget-date-window");
const dashboardWidgetTagFilterInput = document.querySelector("#dashboard-widget-tag-filter");
const dashboardWidgetDeleteButton = document.querySelector("#dashboard-widget-delete");
const dashboardWidgetCancelButton = document.querySelector("#dashboard-widget-cancel");
const dashboardWidgetPreview = document.querySelector("#dashboard-widget-preview");
const dashboardWidgetError = document.querySelector("#dashboard-widget-error");
const dashboardWorkOrdersPanel = document.querySelector("#work-order-list-panel");
const remindersTotalCount = document.querySelector("#reminders-total-count");
const remindersTodayCount = document.querySelector("#reminders-today-count");
const remindersOverdueCount = document.querySelector("#reminders-overdue-count");
const remindersDoneCount = document.querySelector("#reminders-done-count");
const reminderForm = document.querySelector("#reminder-form");
const reminderIdInput = document.querySelector("#reminder-id");
const reminderTitleInput = document.querySelector("#reminder-title");
const reminderDueDateInput = document.querySelector("#reminder-due-date");
const reminderStatusInput = document.querySelector("#reminder-status");
const reminderWorkOrderIdInput = document.querySelector("#reminder-work-order-id");
const reminderCompanyIdInput = document.querySelector("#reminder-company-id");
const reminderNoteInput = document.querySelector("#reminder-note");
const reminderLinkPreview = document.querySelector("#reminder-link-preview");
const reminderResetButton = document.querySelector("#reminder-reset");
const reminderError = document.querySelector("#reminder-error");
const remindersSearchInput = document.querySelector("#reminders-search");
const remindersFilterStatusInput = document.querySelector("#reminders-filter-status");
const remindersBody = document.querySelector("#reminders-body");
const remindersEmpty = document.querySelector("#reminders-empty");
const todoTotalCount = document.querySelector("#todo-total-count");
const todoAssignedCount = document.querySelector("#todo-assigned-count");
const todoCreatedCount = document.querySelector("#todo-created-count");
const todoOverdueCount = document.querySelector("#todo-overdue-count");
const todoForm = document.querySelector("#todo-form");
const todoIdInput = document.querySelector("#todo-id");
const todoTitleInput = document.querySelector("#todo-title");
const todoAssigneeInput = document.querySelector("#todo-assigned-to-user-id");
const todoDueDateInput = document.querySelector("#todo-due-date");
const todoStatusInput = document.querySelector("#todo-status");
const todoPriorityInput = document.querySelector("#todo-priority");
const todoWorkOrderIdInput = document.querySelector("#todo-work-order-id");
const todoMessageInput = document.querySelector("#todo-message");
const todoLinkPreview = document.querySelector("#todo-link-preview");
const todoResetButton = document.querySelector("#todo-reset");
const todoError = document.querySelector("#todo-error");
const todoSearchInput = document.querySelector("#todo-search");
const todoFilterScopeInput = document.querySelector("#todo-filter-scope");
const todoFilterStatusInput = document.querySelector("#todo-filter-status");
const todoBody = document.querySelector("#todo-body");
const todoEmpty = document.querySelector("#todo-empty");
const todoDetailPanel = document.querySelector("#todo-detail-panel");
const todoDetailEmpty = document.querySelector("#todo-detail-empty");
const todoDetailContent = document.querySelector("#todo-detail-content");
const todoDetailTitle = document.querySelector("#todo-detail-title");
const todoDetailMeta = document.querySelector("#todo-detail-meta");
const todoDetailMessage = document.querySelector("#todo-detail-message");
const todoDetailStatus = document.querySelector("#todo-detail-status");
const todoDetailPriority = document.querySelector("#todo-detail-priority");
const todoDetailAssignee = document.querySelector("#todo-detail-assignee");
const todoDetailDueDate = document.querySelector("#todo-detail-due-date");
const todoDetailOpenWorkOrder = document.querySelector("#todo-detail-open-work-order");
const todoDetailEdit = document.querySelector("#todo-detail-edit");
const todoDetailDelete = document.querySelector("#todo-detail-delete");
const todoCommentsBody = document.querySelector("#todo-comments-body");
const todoCommentsEmpty = document.querySelector("#todo-comments-empty");
const todoCommentForm = document.querySelector("#todo-comment-form");
const todoCommentInput = document.querySelector("#todo-comment-message");
const todoCommentError = document.querySelector("#todo-comment-error");

const workOrderEditorPanel = document.querySelector("#work-order-editor-panel");
const workOrderEditorBackdrop = document.querySelector("#work-order-editor-backdrop");
const workOrderEditorCloseButton = document.querySelector("#work-order-editor-close");
const workOrderEditorBody = workOrderEditorPanel?.querySelector(".work-order-editor-body");
const workOrderEditorContext = document.querySelector("#work-order-editor-context");
const workOrderEditorTitle = document.querySelector("#work-order-editor-title");
const workOrderEditorSubtitle = document.querySelector("#work-order-editor-subtitle");
const workOrderEditorMeta = document.querySelector("#work-order-editor-meta");
const workOrderForm = document.querySelector("#work-order-form");
const workOrderError = document.querySelector("#work-order-error");
const workOrderResetButton = document.querySelector("#work-order-reset");
const workOrderOpenFormButton = document.querySelector("#work-order-open-form");
const workOrderOpenReminderButton = document.querySelector("#work-order-open-reminder");
const workOrderOpenTodoButton = document.querySelector("#work-order-open-todo");
const workOrderNumberPreview = document.querySelector("#work-order-number-preview");
const workOrderSaveState = document.querySelector("#work-order-save-state");
const workOrderActivityList = document.querySelector("#work-order-activity-list");
const workOrderActivityEmpty = document.querySelector("#work-order-activity-empty");
const workOrderActivityLoading = document.querySelector("#work-order-activity-loading");
const workOrderActivityError = document.querySelector("#work-order-activity-error");
const workOrderActivityCount = document.querySelector("#work-order-activity-count");

if (dashboardBuilderPanel?.parentElement !== document.body) {
  document.body.append(dashboardBuilderPanel);
}

if (workOrderEditorBackdrop?.parentElement !== document.body) {
  document.body.append(workOrderEditorBackdrop);
}

if (workOrderEditorPanel?.parentElement !== document.body) {
  document.body.append(workOrderEditorPanel);
}

if (offerEditorBackdrop?.parentElement !== document.body) {
  document.body.append(offerEditorBackdrop);
}

if (offerEditorPanel?.parentElement !== document.body) {
  document.body.append(offerEditorPanel);
}

if (vehicleEditorBackdrop?.parentElement !== document.body) {
  document.body.append(vehicleEditorBackdrop);
}

if (vehicleEditorPanel?.parentElement !== document.body) {
  document.body.append(vehicleEditorPanel);
}

if (vehicleReservationBackdrop?.parentElement !== document.body) {
  document.body.append(vehicleReservationBackdrop);
}

if (vehicleReservationPanel?.parentElement !== document.body) {
  document.body.append(vehicleReservationPanel);
}

if (workOrderEditorBackdrop) {
  workOrderEditorBackdrop.hidden = true;
}

if (workOrderEditorPanel) {
  workOrderEditorPanel.hidden = true;
  workOrderEditorPanel.setAttribute("aria-hidden", "true");
}

if (offerEditorBackdrop) {
  offerEditorBackdrop.hidden = true;
}

if (offerEditorPanel) {
  offerEditorPanel.hidden = true;
  offerEditorPanel.setAttribute("aria-hidden", "true");
}

if (vehicleEditorBackdrop) {
  vehicleEditorBackdrop.hidden = true;
}

if (vehicleEditorPanel) {
  vehicleEditorPanel.hidden = true;
  vehicleEditorPanel.setAttribute("aria-hidden", "true");
}

if (vehicleReservationBackdrop) {
  vehicleReservationBackdrop.hidden = true;
}

if (vehicleReservationPanel) {
  vehicleReservationPanel.hidden = true;
  vehicleReservationPanel.setAttribute("aria-hidden", "true");
}

const workOrderIdInput = document.querySelector("#work-order-id");
const workOrderStatusInput = document.querySelector("#work-order-status");
const workOrderPriorityInput = document.querySelector("#work-order-priority");
const workOrderOpenedDateInput = document.querySelector("#work-order-opened-date");
const workOrderDueDateInput = document.querySelector("#work-order-due-date");
const workOrderTeamLabelInput = document.querySelector("#work-order-team-label");
const workOrderTeamSuggestions = document.querySelector("#work-order-team-suggestions");
const workOrderCompanyIdInput = document.querySelector("#work-order-company-id");
const workOrderCompanyPreview = document.querySelector("#work-order-company-preview");
const workOrderCompanyPreviewLogo = document.querySelector("#work-order-company-preview-logo");
const workOrderCompanyPreviewName = document.querySelector("#work-order-company-preview-name");
const workOrderCompanyPreviewMeta = document.querySelector("#work-order-company-preview-meta");
const workOrderHeadquartersInput = document.querySelector("#work-order-headquarters");
const workOrderCompanyOibInput = document.querySelector("#work-order-company-oib");
const workOrderContractTypeInput = document.querySelector("#work-order-contract-type");
const workOrderLocationIdInput = document.querySelector("#work-order-location-id");
const workOrderCoordinatesInput = document.querySelector("#work-order-coordinates");
const workOrderRegionInput = document.querySelector("#work-order-region");
const workOrderContactSlotInput = document.querySelector("#work-order-contact-slot");
const workOrderContactPhoneInput = document.querySelector("#work-order-contact-phone");
const workOrderContactEmailInput = document.querySelector("#work-order-contact-email");
const workOrderExecutor1Input = document.querySelector("#work-order-executor-1");
const workOrderExecutor2Input = document.querySelector("#work-order-executor-2");
const workOrderServiceLineInput = document.querySelector("#work-order-service-line");
const workOrderDepartmentInput = document.querySelector("#work-order-department");
const workOrderLinkReferenceInput = document.querySelector("#work-order-link-reference");
const workOrderWeightInput = document.querySelector("#work-order-weight");
const workOrderCompletedByInput = document.querySelector("#work-order-completed-by");
const workOrderInvoiceDateInput = document.querySelector("#work-order-invoice-date");
const workOrderTagTextInput = document.querySelector("#work-order-tag-text");
const workOrderDescriptionInput = document.querySelector("#work-order-description");
const workOrderInvoiceNoteInput = document.querySelector("#work-order-invoice-note");
const workOrderSearchInput = document.querySelector("#work-order-search");
const workOrderFilterStatusInput = document.querySelector("#work-order-filter-status");
const workOrderFilterCompanyInput = document.querySelector("#work-order-filter-company");
const measurementSheetOpenButton = document.querySelector("#measurement-sheet-open");
const measurementSheetModal = document.querySelector("#measurement-sheet-modal");
const measurementSheetBackdrop = document.querySelector("#measurement-sheet-backdrop");
const measurementSheetCloseButton = document.querySelector("#measurement-sheet-close");
const measurementSheetAddRowButton = document.querySelector("#measurement-sheet-add-row");
const measurementSheetAddColumnButton = document.querySelector("#measurement-sheet-add-column");
const measurementSheetResetButton = document.querySelector("#measurement-sheet-reset");
const measurementCompanyInput = document.querySelector("#measurement-company");
const measurementHeadquartersInput = document.querySelector("#measurement-headquarters");
const measurementLocationInput = document.querySelector("#measurement-location");
const measurementDateInput = document.querySelector("#measurement-date");
const measurementNameBoxInput = document.querySelector("#measurement-name-box");
const measurementFormulaInput = document.querySelector("#measurement-formula-input");
const measurementFormatTypeInput = document.querySelector("#measurement-format-type");
const measurementFormatDecimalsInput = document.querySelector("#measurement-format-decimals");
const measurementFormatBorderInput = document.querySelector("#measurement-format-border");
const measurementSheetPanel = document.querySelector(".measurement-sheet-panel");
const measurementSheetGridWrap = document.querySelector(".measurement-sheet-grid-wrap");
const measurementSheetColgroup = document.querySelector("#measurement-sheet-colgroup");
const measurementSheetHead = document.querySelector("#measurement-sheet-head");
const measurementSheetBody = document.querySelector("#measurement-sheet-body");
const measurementFillMenu = document.querySelector("#measurement-fill-menu");
const measurementFillCopyButton = document.querySelector("#measurement-fill-copy");
const measurementFillSeriesButton = document.querySelector("#measurement-fill-series");
const measurementContextMenu = document.querySelector("#measurement-context-menu");
const measurementContextAddRowAboveButton = document.querySelector("#measurement-context-add-row-above");
const measurementContextAddRowBelowButton = document.querySelector("#measurement-context-add-row-below");
const measurementContextAddColumnLeftButton = document.querySelector("#measurement-context-add-column-left");
const measurementContextAddColumnRightButton = document.querySelector("#measurement-context-add-column-right");
const workOrdersBody = document.querySelector("#work-orders-body");
const workOrdersEmpty = document.querySelector("#work-orders-empty");
const workOrdersTableWrap = document.querySelector("#work-orders-table-wrap");
const workOrdersLoadState = document.querySelector("#work-orders-load-state");
const workOrdersHelper = document.querySelector("#work-orders-helper");
const workspaceViewChips = Array.from(document.querySelectorAll("[data-jump-view]"));
const workOrderModeButtons = Array.from(document.querySelectorAll("[data-work-order-mode]"));
const workOrderListView = document.querySelector("#work-order-list-view");
const workOrderCalendarView = document.querySelector("#work-order-calendar-view");
const workOrderMapView = document.querySelector("#work-order-map-view");
const workOrderCalendarPrevButton = document.querySelector("#work-order-calendar-prev");
const workOrderCalendarTodayButton = document.querySelector("#work-order-calendar-today");
const workOrderCalendarNextButton = document.querySelector("#work-order-calendar-next");
const workOrderCalendarRange = document.querySelector("#work-order-calendar-range");
const workOrderCalendarMeta = document.querySelector("#work-order-calendar-meta");
const workOrderCalendarContent = document.querySelector("#work-order-calendar-content");
const workOrderCalendarGridShell = document.querySelector("#work-order-calendar-grid-shell");
const workOrderCalendarGrid = document.querySelector("#work-order-calendar-grid");
const workOrderCalendarSidepanels = document.querySelector("#work-order-calendar-sidepanels");
const workOrderCalendarUnscheduled = document.querySelector("#work-order-calendar-unscheduled");
const workOrderCalendarUnassigned = document.querySelector("#work-order-calendar-unassigned");
const workOrderCalendarWeekendsInput = document.querySelector("#work-order-calendar-weekends");
const workOrderCalendarUnscheduledToggle = document.querySelector("#work-order-calendar-unscheduled-toggle");
const workOrderCalendarDisplayWeekButton = document.querySelector("#work-order-calendar-display-week");
const workOrderCalendarDisplayMonthButton = document.querySelector("#work-order-calendar-display-month");
const workOrderMapStage = document.querySelector("#work-order-map-stage");
const workOrderMapCanvas = document.querySelector("#work-order-map-canvas");
const workOrderMapSummary = document.querySelector("#work-order-map-summary");
const workOrderMapFilterStatusInput = document.querySelector("#work-order-map-filter-status");
const workOrderMapFilterPriorityInput = document.querySelector("#work-order-map-filter-priority");
const workOrderMapFilterRegionInput = document.querySelector("#work-order-map-filter-region");
const workOrderMapSelectionTitle = document.querySelector("#work-order-map-selection-title");
const workOrderMapSelection = document.querySelector("#work-order-map-selection");
const workOrderMapList = document.querySelector("#work-order-map-list");

const companyForm = document.querySelector("#company-form");
const companyError = document.querySelector("#company-error");
const companyOpenFormButton = document.querySelector("#company-open-form");
const companyEditorBackdrop = document.querySelector("#company-editor-backdrop");
const companyEditorPanel = document.querySelector("#company-editor-panel");
const companyEditorTitle = document.querySelector("#company-editor-title");
const companyEditorStatusPill = document.querySelector("#company-editor-status-pill");
const companyEditorCloseButton = document.querySelector("#company-editor-close");
const companyEditorBody = document.querySelector("#company-editor-body");
const companyResetButton = document.querySelector("#company-reset");
const companyDeleteButton = document.querySelector("#company-delete");
const companyIdInput = document.querySelector("#company-id");
const companyLogoDataUrlInput = document.querySelector("#company-logo-data-url");
const companyLogoFileInput = document.querySelector("#company-logo-file");
const companyLogoPreview = document.querySelector("#company-logo-preview");
const companyLogoButton = document.querySelector("#company-logo-button");
const companyLogoClearButton = document.querySelector("#company-logo-clear");
const companyNameInput = document.querySelector("#company-name");
const companyHeadquartersInput = document.querySelector("#company-headquarters");
const companyOibInput = document.querySelector("#company-oib");
const companyContractTypeInput = document.querySelector("#company-contract-type");
const companyContractNumberInput = document.querySelector("#company-contract-number");
const companyPeriodInput = document.querySelector("#company-period");
const companyIsActiveInput = document.querySelector("#company-is-active");
const companyRepresentativeInput = document.querySelector("#company-representative");
const companyContactPhoneInput = document.querySelector("#company-contact-phone");
const companyContactEmailInput = document.querySelector("#company-contact-email");
const companyNoteInput = document.querySelector("#company-note");
const companiesBody = document.querySelector("#companies-body");
const companiesEmpty = document.querySelector("#companies-empty");
const companiesHelper = document.querySelector("#companies-helper");

const locationForm = document.querySelector("#location-form");
const locationError = document.querySelector("#location-error");
const locationOpenFormButton = document.querySelector("#location-open-form");
const locationEditorBackdrop = document.querySelector("#location-editor-backdrop");
const locationEditorPanel = document.querySelector("#location-editor-panel");
const locationEditorTitle = document.querySelector("#location-editor-title");
const locationEditorCloseButton = document.querySelector("#location-editor-close");
const locationEditorBody = document.querySelector("#location-editor-body");
const locationResetButton = document.querySelector("#location-reset");
const locationIdInput = document.querySelector("#location-id");
const locationCompanyIdInput = document.querySelector("#location-company-id");
const locationCompanyPreview = document.querySelector("#location-company-preview");
const locationCompanyPreviewLogo = document.querySelector("#location-company-preview-logo");
const locationCompanyPreviewName = document.querySelector("#location-company-preview-name");
const locationCompanyPreviewMeta = document.querySelector("#location-company-preview-meta");
const locationNameInput = document.querySelector("#location-name");
const locationRegionInput = document.querySelector("#location-region");
const locationCoordinatesInput = document.querySelector("#location-coordinates");
const locationPeriodInput = document.querySelector("#location-period");
const locationRepresentativeInput = document.querySelector("#location-representative");
const locationIsActiveInput = document.querySelector("#location-is-active");
const locationContactsList = document.querySelector("#location-contacts-list");
const locationAddContactButton = document.querySelector("#location-add-contact");
const locationNoteInput = document.querySelector("#location-note");
const locationsBody = document.querySelector("#locations-body");
const locationsEmpty = document.querySelector("#locations-empty");
const locationsHelper = document.querySelector("#locations-helper");

const organizationForm = document.querySelector("#organization-form");
const organizationError = document.querySelector("#organization-error");
const organizationPanel = document.querySelector("#organization-panel");
const organizationIdInput = document.querySelector("#organization-id");
const organizationNameInput = document.querySelector("#organization-name");
const organizationOibInput = document.querySelector("#organization-oib");
const organizationAddressInput = document.querySelector("#organization-address");
const organizationCityInput = document.querySelector("#organization-city");
const organizationPostalCodeInput = document.querySelector("#organization-postal-code");
const organizationCountryInput = document.querySelector("#organization-country");
const organizationContactEmailInput = document.querySelector("#organization-contact-email");
const organizationContactPhoneInput = document.querySelector("#organization-contact-phone");
const organizationStatusInput = document.querySelector("#organization-status");
const organizationResetButton = document.querySelector("#organization-reset");

const userForm = document.querySelector("#user-form");
const userError = document.querySelector("#user-error");
const userIdInput = document.querySelector("#user-id");
const userAvatarDataUrlInput = document.querySelector("#user-avatar-data-url");
const userFirstNameInput = document.querySelector("#user-first-name");
const userLastNameInput = document.querySelector("#user-last-name");
const userEmailInput = document.querySelector("#user-email");
const userPasswordInput = document.querySelector("#user-password");
const userOrganizationField = document.querySelector("#user-organization-field");
const userRoleField = document.querySelector("#user-role-field");
const userOrganizationMembershipsField = document.querySelector("#user-organization-memberships-field");
const userOrganizationIdInput = document.querySelector("#user-organization-id");
const userOrganizationMemberships = document.querySelector("#user-organization-memberships");
const userAvatarFileInput = document.querySelector("#user-avatar-file");
const userAvatarPreview = document.querySelector("#user-avatar-preview");
const userRoleInput = document.querySelector("#user-role");
const userLegacyUsernameInput = document.querySelector("#user-legacy-username");
const userIsActiveInput = document.querySelector("#user-is-active");
const userResetButton = document.querySelector("#user-reset");
const usersBody = document.querySelector("#users-body");
const managementViewKicker = document.querySelector("#management-view-kicker");
const managementViewTitle = document.querySelector("#management-view-title");
const managementViewDescription = document.querySelector("#management-view-description");
const userPanelKicker = document.querySelector("#user-panel-kicker");
const userPanelTitle = document.querySelector("#user-panel-title");
const userManagementNote = document.querySelector("#user-management-note");

const loginContentPanel = document.querySelector("#login-content-panel");
const loginContentForm = document.querySelector("#login-content-form");
const loginContentError = document.querySelector("#login-content-error");
const loginContentIdInput = document.querySelector("#login-content-id");
const loginContentAccentInput = document.querySelector("#login-content-accent-input");
const loginContentHeadingInput = document.querySelector("#login-content-heading-input");
const loginContentQuoteInput = document.querySelector("#login-content-quote-input");
const loginContentAuthorNameInput = document.querySelector("#login-content-author-name-input");
const loginContentAuthorTitleInput = document.querySelector("#login-content-author-title-input");
const loginContentFeatureTitleInput = document.querySelector("#login-content-feature-title-input");
const loginContentFeatureBodyInput = document.querySelector("#login-content-feature-body-input");
const loginContentIsActiveInput = document.querySelector("#login-content-is-active");
const loginContentResetButton = document.querySelector("#login-content-reset");
const loginContentBody = document.querySelector("#login-content-body");
const signupRequestsPanel = document.querySelector("#signup-requests-panel");
const signupRequestsBody = document.querySelector("#signup-requests-body");
let userMenuOpen = false;
let locationFormContacts = [];
let companyEditorScrollLockY = 0;
let companyEditorScrollLockActive = false;
let currentConnectionTone = "connecting";
let currentConnectionMeta = "ucitavanje podataka...";

function getSidebarGroupLabel(groupName) {
  if (!groupName) {
    return "";
  }

  return SIDEBAR_GROUP_LABELS[groupName]
    || sidebarGroupPanels
      .find((panel) => panel.dataset.sidebarGroupPanel === groupName)
      ?.querySelector(".sidebar-group-label")
      ?.textContent
      ?.trim()
    || groupName;
}

function getSidebarItemLabel(itemName) {
  if (!itemName) {
    return "";
  }

  return SIDEBAR_ITEM_LABELS[itemName]
    || sidebarNavItems
      .find((button) => button.dataset.sidebarItem === itemName)
      ?.querySelector("strong")
      ?.textContent
      ?.trim()
    || itemName;
}

function getWorkOrderBreadcrumbLabel() {
  const activeId = String(workOrderIdInput?.value || "");
  const persistedItem = state.workOrders.find((item) => String(item.id) === activeId) ?? null;
  return persistedItem?.workOrderNumber || workOrderEditorTitle?.textContent?.trim() || "Novi RN";
}

function navigateToBreadcrumb(target) {
  if (!target) {
    return;
  }

  if (state.workOrderEditorOpen && target.kind !== "work-order") {
    closeWorkOrderEditor();
  }

  if (target.kind === "group") {
    activateSidebarGroup(target.group, { navigate: true, expandSidebar: true });
    return;
  }

  if (target.kind === "item") {
    activateSidebarItem(target.item, { expandSidebar: true });
    return;
  }

  if (target.kind === "work-order-view") {
    setActiveWorkOrderViewMode(target.mode);
  }
}

function buildTopbarBreadcrumbs() {
  const groupName = state.activeSidebarGroup || getSidebarGroupForView();
  const itemName = state.activeSidebarItem || SIDEBAR_GROUP_DEFAULT_ITEM[groupName];
  const crumbs = [];

  if (groupName) {
    crumbs.push({
      label: getSidebarGroupLabel(groupName),
      kind: "group",
      group: groupName,
    });
  }

  if (itemName) {
    crumbs.push({
      label: getSidebarItemLabel(itemName),
      kind: "item",
      item: itemName,
    });
  }

  if (state.activeView === "selfdash" && state.activeSidebarItem === "rn") {
    crumbs.push({
      label: getWorkOrderViewModeLabel(),
      kind: "work-order-view",
      mode: state.activeWorkOrderViewMode,
    });
  }

  if (state.activeView === "selfdash" && state.workOrderEditorOpen) {
    crumbs.push({
      label: getWorkOrderBreadcrumbLabel(),
      kind: "work-order",
    });
  }

  return crumbs.filter((item) => item.label);
}

function renderTopbarBreadcrumbs() {
  if (!organizationContext) {
    return;
  }

  const crumbs = buildTopbarBreadcrumbs();
  organizationContext.className = "organization-context";

  if (crumbs.length === 0) {
    organizationContext.replaceChildren();
    return;
  }

  const nodes = [];

  crumbs.forEach((crumb, index) => {
    const isLast = index === crumbs.length - 1;
    const element = document.createElement(isLast ? "span" : "button");
    element.className = isLast ? "organization-context-current" : "organization-context-link";
    element.textContent = crumb.label;

    if (!isLast) {
      element.type = "button";
      element.addEventListener("click", () => {
        navigateToBreadcrumb(crumb);
      });
    } else {
      element.setAttribute("aria-current", "page");
    }

    nodes.push(element);

    if (!isLast) {
      const separator = document.createElement("span");
      separator.className = "organization-context-separator";
      separator.setAttribute("aria-hidden", "true");
      separator.textContent = "/";
      nodes.push(separator);
    }
  });

  organizationContext.replaceChildren(...nodes);
}

function renderConnectionStatus({ tone = "connecting", label = "", meta = "" } = {}) {
  if (!connectionStatus) {
    return;
  }

  currentConnectionTone = tone;
  currentConnectionMeta = meta;
  connectionStatus.className = `connection-status is-${tone}`;

  const indicator = document.createElement("span");
  indicator.className = "connection-status-indicator";
  indicator.setAttribute("aria-hidden", "true");

  const copy = document.createElement("span");
  copy.className = "connection-status-copy";

  const labelNode = document.createElement("strong");
  labelNode.className = "connection-status-label";
  labelNode.textContent = label;

  const metaNode = document.createElement("span");
  metaNode.className = "connection-status-meta";
  metaNode.textContent = meta;

  copy.append(labelNode, metaNode);
  connectionStatus.replaceChildren(indicator, copy);
  renderTopbarBreadcrumbs();
}

function setConnectionStatus() {
  if (state.storage === "mysql") {
    renderConnectionStatus({
      tone: "live",
      label: "Live",
      meta: "MySQL sinkroniziran",
    });
    return;
  }

  renderConnectionStatus({
    tone: "error",
    label: "Offline",
    meta: "backend nije dostupan",
  });
}

function setSyncError(message = "") {
  syncError.hidden = !message;
  syncError.textContent = message;

  if (message) {
    renderConnectionStatus({
      tone: "error",
      label: "Problem",
      meta: message,
    });
    return;
  }

  setConnectionStatus();
}

function setUserMenuError(message = "") {
  if (!userMenuError) {
    return;
  }

  userMenuError.textContent = message;
}

function getUserPresenceStorageKey(userLike = {}) {
  const identifier = String(userLike?.id ?? userLike?.email ?? "").trim();
  return identifier ? `${USER_PRESENCE_KEY_PREFIX}${identifier}` : USER_PRESENCE_KEY_PREFIX;
}

function normalizeUserPresence(value) {
  const match = USER_PRESENCE_OPTIONS.find((option) => option.value === String(value ?? "").trim().toLowerCase());
  return match?.value ?? "online";
}

function readUserPresence(userLike = state.user) {
  try {
    return normalizeUserPresence(window.localStorage.getItem(getUserPresenceStorageKey(userLike)));
  } catch {
    return "online";
  }
}

function writeUserPresence(value, userLike = state.user) {
  try {
    window.localStorage.setItem(getUserPresenceStorageKey(userLike), normalizeUserPresence(value));
  } catch {
    return;
  }
}

function setLoginBusy(isBusy) {
  loginForm?.classList.toggle("is-submitting", isBusy);

  if (loginSubmitButton) {
    loginSubmitButton.disabled = isBusy;
    loginSubmitButton.textContent = isBusy ? "Signing in..." : "Sign in";
  }

  loginEmailInput.disabled = isBusy;
  loginPasswordInput.disabled = isBusy;
}

function applyLoginRedirectState() {
  const params = new URLSearchParams(window.location.search);
  const loginErrorCode = params.get("loginError");

  if (!loginErrorCode || !loginError) {
    return;
  }

  if (loginErrorCode === "invalid") {
    loginError.textContent = "Neispravan email ili lozinka.";
  } else if (loginErrorCode === "server") {
    loginError.textContent = "Prijava trenutno nije uspjela. Pokusaj ponovno.";
  }

  params.delete("loginError");
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

function syncPasswordToggleLabel() {
  return;
}

function getIsSuperAdmin() {
  return state.user?.role === "super_admin";
}

function getIsAdmin() {
  return state.user?.role === "admin";
}

function getCanManageMasterData() {
  return ["super_admin", "admin"].includes(state.user?.role);
}

function canManageRenderedUser(user) {
  if (getIsSuperAdmin()) {
    return true;
  }

  if (getIsAdmin()) {
    return user?.role === "user";
  }

  return false;
}

async function requestTokenRefresh() {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.ok;
}

async function apiRequest(path, options = {}, retryOnAuthFailure = true) {
  const organizationHeader = state.activeOrganizationId
    ? { "X-Organization-Id": state.activeOrganizationId }
    : {};
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...organizationHeader,
      ...(options.headers ?? {}),
    },
    credentials: "same-origin",
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && retryOnAuthFailure && !AUTH_RETRY_EXCLUDED_PATHS.has(path)) {
    const refreshed = await requestTokenRefresh();

    if (refreshed) {
      return apiRequest(path, options, false);
    }
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || "Request failed.");
    error.statusCode = response.status;
    throw error;
  }

  return payload;
}

function applySnapshot(payload) {
  state.storage = payload.storage;
  state.organizations = payload.organizations ?? [];
  state.companies = payload.companies ?? [];
  state.locations = payload.locations ?? [];
  state.users = payload.users ?? [];
  state.signupRequests = payload.signupRequests ?? [];
  state.loginContentItems = payload.loginContentItems ?? [];
  state.workOrders = payload.workOrders ?? [];
  state.reminders = payload.reminders ?? [];
  state.todoTasks = payload.todoTasks ?? [];
  state.offers = payload.offers ?? [];
  state.vehicles = payload.vehicles ?? [];
  state.dashboardWidgets = payload.dashboardWidgets ?? [];
  state.expandedWorkOrderIds = new Set(
    [...state.expandedWorkOrderIds].filter((id) => state.workOrders.some((item) => String(item.id) === String(id))),
  );
  if (!state.workOrders.some((item) => String(item.id) === String(state.workOrderMap.selectedWorkOrderId))) {
    state.workOrderMap.selectedWorkOrderId = "";
  }
  if (!state.todoTasks.some((item) => String(item.id) === String(state.activeTodoTaskId))) {
    state.activeTodoTaskId = state.todoTasks[0]?.id ?? "";
  }
  if (!state.dashboardWidgets.some((item) => String(item.id) === String(state.activeDashboardWidgetId))) {
    state.activeDashboardWidgetId = "";
    if (state.dashboardBuilder.draftMode === "edit") {
      closeDashboardBuilder();
    }
  }
  if (!state.vehicles.some((item) => String(item.id) === String(state.activeVehicleId))) {
    state.activeVehicleId = "";
    state.activeVehicleReservationId = "";
    resetVehicleForm();
    resetVehicleReservationForm();
  } else {
    const activeVehicle = state.vehicles.find((item) => String(item.id) === String(state.activeVehicleId)) ?? null;
    if (!activeVehicle?.reservations?.some((item) => String(item.id) === String(state.activeVehicleReservationId))) {
      state.activeVehicleReservationId = "";
      resetVehicleReservationForm();
    }
  }
  if (offerIdInput?.value && !state.offers.some((item) => String(item.id) === String(offerIdInput.value))) {
    state.offerEditorOpen = false;
    syncOfferEditorModal();
    resetOfferForm();
  }
  if (companyIdInput?.value && !state.companies.some((item) => String(item.id) === String(companyIdInput.value))) {
    state.companyEditorOpen = false;
    syncCompanyEditorModal();
    resetCompanyForm();
  }
  if (locationIdInput?.value && !state.locations.some((item) => String(item.id) === String(locationIdInput.value))) {
    state.locationEditorOpen = false;
    syncLocationEditorModal();
    resetLocationForm();
  }
  state.user = payload.user ?? state.user;
  state.activeOrganizationId = payload.activeOrganizationId ?? state.activeOrganizationId;
  state.workOrderRenderLimit = WORK_ORDER_BATCH_SIZE;
  setConnectionStatus();
  setSyncError("");
  render();
  ensureChatContext();
}

async function refreshSnapshot() {
  const payload = await apiRequest("/bootstrap");
  applySnapshot(payload);
}

async function refreshSession() {
  const payload = await apiRequest("/auth/session");
  state.user = payload.user ?? null;
  renderAuthState();
  return payload.user;
}

async function refreshLoginContent() {
  return null;
}

async function runMutation(callback, errorTarget) {
  try {
    if (errorTarget) {
      errorTarget.textContent = "";
    }

    const payload = await callback();
    applySnapshot(payload);
    return true;
  } catch (error) {
    if (error.statusCode === 401) {
      state.user = null;
      renderAuthState();
      setSyncError("");
      return false;
    }

    if (errorTarget) {
      errorTarget.textContent = error.message;
    } else {
      setSyncError(error.message);
    }

    return false;
  }
}

function createOption(value, label, selectedValue = "", data = {}) {
  const option = document.createElement("option");
  option.value = String(value ?? "");
  option.textContent = label;
  option.selected = String(selectedValue ?? "") === String(value ?? "");

  for (const [key, entryValue] of Object.entries(data)) {
    option.dataset[key] = String(entryValue ?? "");
  }

  return option;
}

function replaceSelectOptions(select, options, selectedValue = "") {
  select.replaceChildren(...options.map((option) => createOption(option.value, option.label, selectedValue, option.data)));

  const hasSelectedValue = options.some((option) => String(option.value) === String(selectedValue));
  if (hasSelectedValue) {
    select.value = String(selectedValue);
  } else if (options[0]) {
    select.value = String(options[0].value);
  } else {
    select.value = "";
  }
}

function getUserInitials(userLike = {}) {
  const firstName = String(userLike.firstName ?? "").trim();
  const lastName = String(userLike.lastName ?? "").trim();
  const fullName = String(userLike.fullName ?? "").trim();
  const seed = [firstName, lastName].filter(Boolean).join(" ") || fullName || String(userLike.email ?? "");
  const parts = seed.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "U";
}

function renderAvatar(target, userLike = {}) {
  if (!target) {
    return;
  }

  target.replaceChildren();
  target.classList.toggle("has-image", Boolean(userLike.avatarDataUrl));

  if (userLike.avatarDataUrl) {
    const image = document.createElement("img");
    image.src = userLike.avatarDataUrl;
    image.alt = userLike.fullName || userLike.email || "User";
    target.append(image);
    return;
  }

  target.textContent = getUserInitials(userLike);
}

function renderCompanyLogo(target, companyLike = {}) {
  renderAvatar(target, {
    fullName: companyLike.name || companyLike.companyName || "Tvrtka",
    avatarDataUrl: companyLike.logoDataUrl || companyLike.companyLogoDataUrl || "",
  });
}

function describeCompanyPreview(companyLike = {}) {
  return [
    companyLike.headquarters || "",
    companyLike.oib ? `OIB ${companyLike.oib}` : "",
  ].filter(Boolean).join(" · ") || "Bez dodatnih podataka";
}

function syncCompanySelectionPreview(
  companyId,
  previewWrap,
  previewLogo,
  previewName,
  previewMeta,
) {
  if (!previewWrap || !previewLogo || !previewName || !previewMeta) {
    return;
  }

  const company = getCompany(companyId);
  previewWrap.hidden = !company;

  if (!company) {
    previewName.textContent = "Tvrtka";
    previewMeta.textContent = "Odaberi tvrtku za detalje.";
    renderCompanyLogo(previewLogo, { name: "Tvrtka" });
    return;
  }

  previewName.textContent = company.name || "Tvrtka";
  previewMeta.textContent = describeCompanyPreview(company);
  renderCompanyLogo(previewLogo, company);
}

function applyPresenceToAvatar(target, presence = "online") {
  if (!target) {
    return;
  }

  target.dataset.presence = normalizeUserPresence(presence);
}

function readAvatarFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(String(reader.result ?? ""));
    });
    reader.addEventListener("error", () => {
      reject(new Error("Ne mogu ucitati sliku."));
    });
    reader.readAsDataURL(file);
  });
}

function normalizeLooseName(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findUserForExecutor(executorName = "") {
  const normalized = normalizeLooseName(executorName);

  if (!normalized) {
    return null;
  }

  return state.users.find((user) => {
    const candidates = [
      user.fullName,
      [user.firstName, user.lastName].filter(Boolean).join(" "),
      user.legacyUsername,
      user.email,
    ].map(normalizeLooseName).filter(Boolean);

    return candidates.includes(normalized);
  }) ?? null;
}

function getExecutorTone(name = "") {
  const palette = [
    { bg: "#e7efff", fg: "#3a63b8" },
    { bg: "#f6e7ff", fg: "#8a47b8" },
    { bg: "#e8f8ef", fg: "#2b7a52" },
    { bg: "#fff0de", fg: "#a15a18" },
    { bg: "#ffe4ea", fg: "#b23f6a" },
    { bg: "#ecebff", fg: "#5446c9" },
  ];
  const normalized = String(name ?? "").trim();
  const hash = [...normalized].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function getSelectedOptionText(select) {
  if (!(select instanceof HTMLSelectElement)) {
    return "";
  }

  return select.options[select.selectedIndex]?.textContent?.trim() ?? "";
}

function getSelectedUserOrganizationIds() {
  if (!userOrganizationMemberships) {
    return [];
  }

  return Array.from(userOrganizationMemberships.querySelectorAll('input[type="checkbox"]:checked'))
    .map((input) => input.value)
    .filter(Boolean);
}

function syncUserPrimaryOrganizationSelection() {
  const selectedOrganizationIds = getSelectedUserOrganizationIds();
  const currentPrimary = userOrganizationIdInput.value;

  if (selectedOrganizationIds.length === 0) {
    userOrganizationIdInput.value = "";
    return;
  }

  if (currentPrimary && selectedOrganizationIds.includes(currentPrimary)) {
    return;
  }

  userOrganizationIdInput.value = selectedOrganizationIds[0];
}

function renderUserOrganizationMemberships(selectedIds = []) {
  if (!userOrganizationMemberships) {
    return;
  }

  const allowMembershipEditing = getIsSuperAdmin();
  const normalizedSelectedIds = Array.from(new Set(
    (selectedIds.length > 0 ? selectedIds : [userOrganizationIdInput.value || state.activeOrganizationId])
      .filter(Boolean),
  ));

  userOrganizationMemberships.replaceChildren(...state.organizations.map((organization) => {
    const label = document.createElement("label");
    label.className = "membership-pill";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = organization.id;
    checkbox.checked = normalizedSelectedIds.includes(organization.id);
    checkbox.disabled = !allowMembershipEditing;
    checkbox.addEventListener("change", () => {
      if (getSelectedUserOrganizationIds().length === 0) {
        checkbox.checked = true;
      }

      syncUserPrimaryOrganizationSelection();
    });

    const caption = document.createElement("span");
    caption.textContent = organization.name;
    label.append(checkbox, caption);
    return label;
  }));

  syncUserPrimaryOrganizationSelection();
}

function setUserMenuOpen(isOpen) {
  userMenuOpen = isOpen && Boolean(state.user);

  if (userMenuPanel) {
    userMenuPanel.hidden = !userMenuOpen;
  }

  userBadge?.setAttribute("aria-expanded", userMenuOpen ? "true" : "false");

  if (!userMenuOpen) {
    setUserPresenceMenuOpen(false);
    setUserMenuError("");
    if (userMenuAvatarFileInput) {
      userMenuAvatarFileInput.value = "";
    }
  }
}

function setUserPresenceMenuOpen(isOpen) {
  userPresenceMenuOpen = Boolean(isOpen && userMenuOpen && state.user);

  if (userMenuPresenceMenu) {
    userMenuPresenceMenu.hidden = !userPresenceMenuOpen;
  }

  if (userMenuPresenceButton) {
    userMenuPresenceButton.setAttribute("aria-expanded", userPresenceMenuOpen ? "true" : "false");
    userMenuPresenceButton.classList.toggle("is-open", userPresenceMenuOpen);
  }
}

function renderUserPresenceOptions(selectedPresence = readUserPresence()) {
  const selectedOption = USER_PRESENCE_OPTIONS.find((option) => option.value === selectedPresence) ?? USER_PRESENCE_OPTIONS[0];

  if (userMenuPresenceButton) {
    userMenuPresenceButton.dataset.presence = selectedOption.value;
  }

  if (userMenuPresenceLabel) {
    userMenuPresenceLabel.textContent = selectedOption.label;
  }

  if (!userMenuPresenceMenu) {
    return;
  }

  userMenuPresenceMenu.replaceChildren(...USER_PRESENCE_OPTIONS.map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "user-presence-option";
    button.dataset.presence = option.value;
    button.classList.toggle("is-active", option.value === selectedPresence);
    button.setAttribute("role", "menuitemradio");
    button.setAttribute("aria-checked", option.value === selectedPresence ? "true" : "false");

    const dot = document.createElement("span");
    dot.className = "user-presence-dot";
    dot.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "user-presence-label";
    label.textContent = option.label;

    button.append(dot, label);
    button.addEventListener("click", () => {
      writeUserPresence(option.value);
      setUserPresenceMenuOpen(false);
      renderAuthState();
      void syncChatState({ silent: true, forcePresence: true });
    });
    return button;
  }));
}

function getChatPresenceValue() {
  return normalizeUserPresence(readUserPresence(state.user));
}

function clearChatPollTimer() {
  if (chatPollTimerId) {
    window.clearTimeout(chatPollTimerId);
    chatPollTimerId = null;
  }
}

function resetChatState() {
  clearChatPollTimer();
  chatLastPresenceSyncAt = 0;
  chatLastPresenceValue = "";
  state.chat.open = false;
  state.chat.tab = "conversations";
  state.chat.search = "";
  state.chat.conversations = [];
  state.chat.users = [];
  state.chat.presenceByUserId = {};
  state.chat.activeConversationId = "";
  state.chat.composerOpen = false;
  state.chat.composerTitle = "";
  state.chat.composerParticipantIds = [];
  state.chat.unreadTotal = 0;
  state.chat.loaded = false;
  state.chat.loading = false;
  state.chat.sending = false;
  state.chat.error = "";
  state.chat.lastOrganizationId = "";
}

function setChatError(message = "") {
  state.chat.error = message;

  if (chatError) {
    chatError.textContent = message;
  }

  if (chatComposerError) {
    chatComposerError.textContent = message;
  }
}

function getChatConversationById(conversationId = state.chat.activeConversationId) {
  return state.chat.conversations.find((conversation) => String(conversation.id) === String(conversationId)) ?? null;
}

function findChatConversationByParticipants(participantIds = []) {
  const signature = Array.from(new Set([state.user?.id, ...participantIds].filter(Boolean).map(String))).sort().join("|");
  return state.chat.conversations.find((conversation) => {
    const conversationSignature = Array.from(new Set((conversation.participantIds ?? []).map(String))).sort().join("|");
    return conversationSignature === signature;
  }) ?? null;
}

function formatChatTimestamp(value) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return "";
  }

  const nowDate = new Date();
  const sameDay = parsedDate.toDateString() === nowDate.toDateString();

  return sameDay
    ? new Intl.DateTimeFormat("hr-HR", { hour: "2-digit", minute: "2-digit" }).format(parsedDate)
    : formatCompactDate(value);
}

function buildChatPresenceLabel(status = "offline") {
  return USER_PRESENCE_OPTIONS.find((option) => option.value === status)?.label ?? "Offline";
}

function createChatAvatar(userLike = {}, presence = "offline", className = "chat-person-avatar") {
  const avatar = document.createElement("span");
  avatar.className = className;
  renderAvatar(avatar, userLike);
  applyPresenceToAvatar(avatar, presence);
  return avatar;
}

function createChatChip(label) {
  const chip = document.createElement("span");
  chip.className = "chat-mini-chip";
  chip.textContent = label;
  return chip;
}

function applyChatSnapshot(payload = {}) {
  state.chat.conversations = payload.conversations ?? [];
  state.chat.users = payload.users ?? [];
  state.chat.presenceByUserId = payload.presenceByUserId ?? {};
  state.chat.loaded = true;
  state.chat.lastOrganizationId = payload.organizationId ?? state.activeOrganizationId;
  state.chat.unreadTotal = state.chat.conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount ?? 0), 0);

  const hasActiveConversation = state.chat.conversations.some((conversation) => String(conversation.id) === String(state.chat.activeConversationId));

  if (!hasActiveConversation) {
    state.chat.activeConversationId = state.chat.conversations[0]?.id ?? "";
  }

  renderChatDock();

  const activeConversation = getChatConversationById();
  if (state.chat.open && activeConversation && Number(activeConversation.unreadCount ?? 0) > 0) {
    void markChatConversationRead(activeConversation.id);
  }
}

function scheduleChatPoll(delay = CHAT_POLL_INTERVAL_MS) {
  clearChatPollTimer();

  if (!state.user || !state.activeOrganizationId) {
    return;
  }

  chatPollTimerId = window.setTimeout(() => {
    void syncChatState({ silent: true });
  }, delay);
}

async function syncChatState({ silent = false, forcePresence = false } = {}) {
  if (!state.user || !state.activeOrganizationId || state.chat.loading) {
    return;
  }

  state.chat.loading = true;

  const presenceValue = getChatPresenceValue();
  const shouldSyncPresence = forcePresence
    || !state.chat.loaded
    || state.chat.lastOrganizationId !== state.activeOrganizationId
    || presenceValue !== chatLastPresenceValue
    || (Date.now() - chatLastPresenceSyncAt) >= CHAT_PRESENCE_HEARTBEAT_MS;

  try {
    const payload = shouldSyncPresence
      ? await apiRequest("/chat/presence", {
        method: "POST",
        body: { status: presenceValue },
      })
      : await apiRequest("/chat/bootstrap");

    if (shouldSyncPresence) {
      chatLastPresenceSyncAt = Date.now();
      chatLastPresenceValue = presenceValue;
    }

    setChatError("");
    applyChatSnapshot(payload);
  } catch (error) {
    if (error.statusCode === 401) {
      resetChatState();
      state.user = null;
      renderAuthState();
      return;
    }

    if (!silent) {
      setChatError(error.message);
      renderChatDock();
    }
  } finally {
    state.chat.loading = false;
    scheduleChatPoll();
  }
}

function ensureChatContext() {
  if (!state.user || !state.activeOrganizationId) {
    resetChatState();
    renderChatDock();
    return;
  }

  if (!state.chat.loaded || state.chat.lastOrganizationId !== state.activeOrganizationId) {
    void syncChatState({ silent: true, forcePresence: true });
    return;
  }

  renderChatDock();
  scheduleChatPoll();
}

async function markChatConversationRead(conversationId = state.chat.activeConversationId) {
  const conversation = getChatConversationById(conversationId);

  if (!conversation || Number(conversation.unreadCount ?? 0) === 0) {
    return;
  }

  try {
    const payload = await apiRequest(`/chat/conversations/${conversation.id}/read`, {
      method: "POST",
      body: {},
    });
    applyChatSnapshot(payload);
  } catch {
    return;
  }
}

function setChatComposerOpen(isOpen) {
  state.chat.composerOpen = Boolean(isOpen);

  if (!state.chat.composerOpen) {
    state.chat.composerTitle = "";
    state.chat.composerParticipantIds = [];
    setChatError("");
  }

  renderChatDock();
}

function setChatOpen(isOpen) {
  state.chat.open = Boolean(isOpen);

  if (!state.chat.open) {
    setChatComposerOpen(false);
  } else if (!state.chat.loaded) {
    void syncChatState({ silent: true, forcePresence: true });
  } else if (state.chat.activeConversationId) {
    void markChatConversationRead(state.chat.activeConversationId);
  }

  renderChatDock();
}

function getFilteredChatConversations() {
  const query = state.chat.search.trim().toLowerCase();

  if (!query) {
    return state.chat.conversations;
  }

  return state.chat.conversations.filter((conversation) => {
    const haystack = [
      conversation.title,
      conversation.lastMessage?.body,
      ...(conversation.participants ?? []).map((participant) => participant.fullName || participant.email),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

function getFilteredChatUsers() {
  const query = state.chat.search.trim().toLowerCase();

  return state.chat.users
    .filter((user) => String(user.id) !== String(state.user?.id))
    .filter((user) => {
      if (!query) {
        return true;
      }

      const haystack = [user.fullName, user.email].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort((left, right) => {
      const leftPresence = state.chat.presenceByUserId[left.id] ?? "offline";
      const rightPresence = state.chat.presenceByUserId[right.id] ?? "offline";
      const leftOnline = leftPresence === "online" ? 1 : 0;
      const rightOnline = rightPresence === "online" ? 1 : 0;

      if (leftOnline !== rightOnline) {
        return rightOnline - leftOnline;
      }

      return String(left.fullName || left.email).localeCompare(String(right.fullName || right.email), "hr");
    });
}

function renderChatConversationList() {
  if (!chatConversationsView) {
    return;
  }

  const conversations = getFilteredChatConversations();

  if (conversations.length === 0) {
    const empty = document.createElement("div");
    empty.className = "chat-empty-inline";
    empty.textContent = state.chat.search ? "Nema razgovora za zadani pojam." : "Jos nema aktivnih razgovora.";
    chatConversationsView.replaceChildren(empty);
    return;
  }

  chatConversationsView.replaceChildren(...conversations.map((conversation) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chat-list-card";
    button.classList.toggle("is-active", String(conversation.id) === String(state.chat.activeConversationId));

    const head = document.createElement("div");
    head.className = "chat-list-card-head";

    const avatarSeed = conversation.participants.find((participant) => String(participant.id) !== String(state.user?.id))
      ?? conversation.participants[0]
      ?? { fullName: conversation.title };
    const avatarPresence = conversation.kind === "direct"
      ? (state.chat.presenceByUserId[avatarSeed.id] ?? "offline")
      : "online";
    const avatar = createChatAvatar(avatarSeed, avatarPresence, "chat-participant-avatar");

    const copy = document.createElement("div");
    copy.className = "chat-list-card-copy";

    const title = document.createElement("strong");
    title.textContent = conversation.title;

    const subtitle = document.createElement("span");
    subtitle.textContent = conversation.lastMessage
      ? `${conversation.lastMessage.authorName} · ${formatChatTimestamp(conversation.lastMessage.createdAt)}`
      : `${conversation.participants.length} sudionika`;

    copy.append(title, subtitle);
    head.append(avatar, copy);

    const preview = document.createElement("p");
    preview.className = "chat-list-card-preview";
    preview.textContent = conversation.lastMessage?.body || "Bez poruka za sada.";

    const meta = document.createElement("div");
    meta.className = "chat-list-card-meta";

    const chips = document.createElement("div");
    chips.className = "chat-list-chip-row";
    chips.append(
      createChatChip(conversation.kind === "direct" ? "1:1" : conversation.kind === "general" ? "General" : "Grupa"),
      createChatChip(`${conversation.participants.length} cl.`),
    );

    meta.append(chips);

    if (conversation.unreadCount > 0) {
      const unread = document.createElement("span");
      unread.className = "chat-unread-badge";
      unread.textContent = String(conversation.unreadCount);
      meta.append(unread);
    }

    button.append(head, preview, meta);
    button.addEventListener("click", () => {
      state.chat.activeConversationId = conversation.id;
      state.chat.open = true;
      renderChatDock();
      void markChatConversationRead(conversation.id);
    });
    return button;
  }));
}

function renderChatPeopleList() {
  if (!chatPeopleView) {
    return;
  }

  const people = getFilteredChatUsers();

  if (people.length === 0) {
    const empty = document.createElement("div");
    empty.className = "chat-empty-inline";
    empty.textContent = state.chat.search ? "Nema kolega za taj pojam." : "Nema dostupnih kolega u organizaciji.";
    chatPeopleView.replaceChildren(empty);
    return;
  }

  chatPeopleView.replaceChildren(...people.map((person) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chat-person-card";

    const head = document.createElement("div");
    head.className = "chat-person-card-head";
    head.append(createChatAvatar(person, state.chat.presenceByUserId[person.id] ?? "offline", "chat-person-avatar"));

    const copy = document.createElement("div");
    copy.className = "chat-person-card-copy";
    const title = document.createElement("strong");
    title.textContent = person.fullName || person.email;
    const subtitle = document.createElement("span");
    subtitle.textContent = `${buildChatPresenceLabel(state.chat.presenceByUserId[person.id] ?? "offline")} · ${person.email || "bez emaila"}`;
    copy.append(title, subtitle);
    head.append(copy);

    const chipRow = document.createElement("div");
    chipRow.className = "chat-list-chip-row";
    chipRow.append(
      createChatChip(person.role === "super_admin" ? "Super admin" : person.role === "admin" ? "Admin" : "User"),
      createChatChip("Direktni chat"),
    );

    button.append(head, chipRow);
    button.addEventListener("click", () => {
      void startDirectChatWithUser(person.id);
    });
    return button;
  }));
}

function renderChatThread() {
  if (!chatThreadEmpty || !chatThreadView || !chatThreadMessages) {
    return;
  }

  const conversation = getChatConversationById();

  chatThreadEmpty.hidden = Boolean(conversation);
  chatThreadView.hidden = !conversation;

  if (!conversation) {
    chatThreadMessages.replaceChildren();
    return;
  }

  if (chatThreadTitle) {
    chatThreadTitle.textContent = conversation.title;
  }

  if (chatThreadMeta) {
    const onlineCount = (conversation.participants ?? [])
      .filter((participant) => (state.chat.presenceByUserId[participant.id] ?? "offline") === "online")
      .length;
    chatThreadMeta.textContent = `${conversation.participants.length} sudionika · ${onlineCount} online`;
  }

  chatThreadMessages.replaceChildren(...(conversation.messages ?? []).map((message) => {
    const row = document.createElement("div");
    row.className = "chat-message-row";
    const isOwn = String(message.authorId) === String(state.user?.id);
    row.classList.toggle("is-own", isOwn);

    if (!isOwn) {
      const author = state.chat.users.find((user) => String(user.id) === String(message.authorId))
        ?? { id: message.authorId, fullName: message.authorName, avatarDataUrl: message.authorAvatarDataUrl };
      row.append(createChatAvatar(author, state.chat.presenceByUserId[message.authorId] ?? "offline", "chat-participant-avatar"));
    }

    const bubble = document.createElement("div");
    bubble.className = "chat-message-bubble";

    const meta = document.createElement("div");
    meta.className = "chat-message-meta";
    const authorName = document.createElement("strong");
    authorName.textContent = isOwn ? "Vi" : (message.authorName || "Kolega");
    const time = document.createElement("span");
    time.textContent = formatChatTimestamp(message.createdAt);
    meta.append(authorName, time);

    const body = document.createElement("p");
    body.className = "chat-message-body";
    body.textContent = message.body;

    bubble.append(meta, body);
    row.append(bubble);
    return row;
  }));

  if (chatMessageInput) {
    chatMessageInput.disabled = state.chat.sending;
  }

  if (chatSendButton) {
    chatSendButton.disabled = state.chat.sending;
  }

  window.requestAnimationFrame(() => {
    chatThreadMessages.scrollTop = chatThreadMessages.scrollHeight;
  });
}

function renderChatComposer() {
  if (!chatComposer) {
    return;
  }

  chatComposer.hidden = !state.chat.composerOpen;

  if (!state.chat.composerOpen) {
    return;
  }

  if (chatComposerTitleInput && chatComposerTitleInput.value !== state.chat.composerTitle) {
    chatComposerTitleInput.value = state.chat.composerTitle;
  }

  if (!chatComposerUsers) {
    return;
  }

  const availableUsers = state.chat.users.filter((user) => String(user.id) !== String(state.user?.id));

  if (availableUsers.length === 0) {
    const empty = document.createElement("div");
    empty.className = "chat-empty-inline";
    empty.textContent = "Trenutno nema drugih korisnika u aktivnoj organizaciji.";
    chatComposerUsers.replaceChildren(empty);
    return;
  }

  chatComposerUsers.replaceChildren(...availableUsers.map((user) => {
    const label = document.createElement("label");
    label.className = "chat-composer-user";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = user.id;
    checkbox.checked = state.chat.composerParticipantIds.includes(user.id);
    checkbox.addEventListener("change", () => {
      const nextIds = new Set(state.chat.composerParticipantIds);
      if (checkbox.checked) {
        nextIds.add(user.id);
      } else {
        nextIds.delete(user.id);
      }
      state.chat.composerParticipantIds = Array.from(nextIds);
    });

    const avatar = createChatAvatar(user, state.chat.presenceByUserId[user.id] ?? "offline", "chat-person-avatar");
    const copy = document.createElement("span");
    copy.className = "chat-composer-user-copy";
    const title = document.createElement("strong");
    title.textContent = user.fullName || user.email;
    const subtitle = document.createElement("span");
    subtitle.textContent = `${buildChatPresenceLabel(state.chat.presenceByUserId[user.id] ?? "offline")} · ${user.email || "bez emaila"}`;
    copy.append(title, subtitle);

    label.append(checkbox, avatar, copy);
    return label;
  }));
}

function renderChatDock() {
  const authenticated = Boolean(state.user);

  if (chatDock) {
    chatDock.hidden = !authenticated;
  }

  if (!authenticated) {
    return;
  }

  const currentPresence = getChatPresenceValue();

  if (chatLauncherPresence) {
    chatLauncherPresence.dataset.presence = currentPresence;
  }

  if (chatLauncherCaption) {
    chatLauncherCaption.textContent = state.chat.unreadTotal > 0
      ? `${state.chat.unreadTotal} novih poruka`
      : "Live team chat";
  }

  if (chatLauncherUnread) {
    chatLauncherUnread.hidden = state.chat.unreadTotal <= 0;
    chatLauncherUnread.textContent = String(state.chat.unreadTotal);
  }

  if (chatLauncher) {
    chatLauncher.setAttribute("aria-expanded", state.chat.open ? "true" : "false");
  }

  if (chatPanel) {
    chatPanel.hidden = !state.chat.open;
  }

  chatTabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.chatTab === state.chat.tab);
  });

  if (chatConversationsView) {
    chatConversationsView.hidden = state.chat.tab !== "conversations";
  }

  if (chatPeopleView) {
    chatPeopleView.hidden = state.chat.tab !== "people";
  }

  if (chatSearchInput && chatSearchInput.value !== state.chat.search) {
    chatSearchInput.value = state.chat.search;
  }

  if (chatListCaption) {
    chatListCaption.textContent = state.chat.tab === "people"
      ? "Pokreni direktni chat ili slozi novu grupu."
      : "Aktivni razgovori i trenutna prisutnost kolega.";
  }

  setChatError(state.chat.error);
  renderChatConversationList();
  renderChatPeopleList();
  renderChatThread();
  renderChatComposer();
}

async function startDirectChatWithUser(userId) {
  try {
    setChatError("");
    const payload = await apiRequest("/chat/conversations", {
      method: "POST",
      body: {
        participantIds: [userId],
      },
    });
    applyChatSnapshot(payload);
    const conversation = findChatConversationByParticipants([userId]);
    state.chat.activeConversationId = conversation?.id ?? state.chat.activeConversationId;
    state.chat.tab = "conversations";
    setChatOpen(true);
    renderChatDock();
    if (state.chat.activeConversationId) {
      await markChatConversationRead(state.chat.activeConversationId);
    }
  } catch (error) {
    setChatError(error.message);
    renderChatDock();
  }
}

async function createChatGroupConversation() {
  try {
    setChatError("");
    const payload = await apiRequest("/chat/conversations", {
      method: "POST",
      body: {
        title: state.chat.composerTitle,
        participantIds: state.chat.composerParticipantIds,
      },
    });
    applyChatSnapshot(payload);
    const participantSignature = Array.from(new Set([state.user?.id, ...state.chat.composerParticipantIds].filter(Boolean).map(String))).sort().join("|");
    const conversation = state.chat.conversations.find((item) => Array.from(new Set((item.participantIds ?? []).map(String))).sort().join("|") === participantSignature)
      ?? state.chat.conversations[0]
      ?? null;
    state.chat.activeConversationId = conversation?.id ?? "";
    state.chat.tab = "conversations";
    setChatComposerOpen(false);
    setChatOpen(true);
    renderChatDock();
  } catch (error) {
    setChatError(error.message);
    renderChatDock();
  }
}

async function sendChatMessage() {
  const conversation = getChatConversationById();
  const messageBody = String(chatMessageInput?.value ?? "").trim();

  if (!conversation || !messageBody) {
    return;
  }

  state.chat.sending = true;
  renderChatDock();

  try {
    const payload = await apiRequest(`/chat/conversations/${conversation.id}/messages`, {
      method: "POST",
      body: { body: messageBody },
    });
    if (chatMessageInput) {
      chatMessageInput.value = "";
    }
    applyChatSnapshot(payload);
  } catch (error) {
    setChatError(error.message);
  } finally {
    state.chat.sending = false;
    renderChatDock();
  }
}

function getSidebarGroupForView(view = state.activeView) {
  return VIEW_TO_SIDEBAR_GROUP[view] ?? "home";
}

function getAllowedSidebarGroupsForView(view = state.activeView) {
  return VIEW_TO_ALLOWED_SIDEBAR_GROUPS[view] ?? [getSidebarGroupForView(view)];
}

function persistSidebarCollapsed() {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(state.sidebarCollapsed));
  } catch {
    return;
  }
}

function persistRailHidden() {
  try {
    window.localStorage.setItem(RAIL_HIDDEN_KEY, String(state.railHidden));
  } catch {
    return;
  }
}

function renderModuleView() {
  const moduleDefinition = MODULE_VIEW_DEFINITIONS[state.activeModuleItem] ?? MODULE_VIEW_DEFINITIONS.documents;
  const isOffersModule = state.activeModuleItem === "offers";
  const isVehiclesModule = state.activeModuleItem === "vehicles";

  if (moduleViewKicker) {
    moduleViewKicker.textContent = moduleDefinition.kicker;
  }

  if (moduleViewTitle) {
    moduleViewTitle.textContent = moduleDefinition.title;
  }

  if (moduleViewDescription) {
    moduleViewDescription.textContent = moduleDefinition.description;
  }

  if (moduleViewChips) {
    moduleViewChips.replaceChildren(...(moduleDefinition.chips ?? []).map((chip) => {
      const chipElement = document.createElement("span");
      chipElement.className = "module-chip";
      chipElement.textContent = chip;
      return chipElement;
    }));
  }

  if (vehiclesModule) {
    vehiclesModule.hidden = !isVehiclesModule;
  }

  if (offersModule) {
    offersModule.hidden = !isOffersModule;
  }

  if (isVehiclesModule) {
    renderVehiclesModule();
  }

  if (isOffersModule) {
    renderOffersModule();
  }
}

function isSidebarGroupAccessible(groupName) {
  if (groupName === "organisations") {
    return !managementTab?.hidden;
  }

  return ALL_SIDEBAR_GROUPS.includes(groupName);
}

function renderSidebarState() {
  let activeGroup = state.activeSidebarGroup || getSidebarGroupForView();

  if (!isSidebarGroupAccessible(activeGroup)) {
    activeGroup = getSidebarGroupForView();

    if (!isSidebarGroupAccessible(activeGroup)) {
      activeGroup = "home";
    }

    state.activeSidebarGroup = activeGroup;
  }

  appFrame?.classList.toggle("is-sidebar-collapsed", state.sidebarCollapsed);
  appFrame?.classList.toggle("is-rail-hidden", state.railHidden);
  appSidebar?.classList.toggle("is-collapsed", state.sidebarCollapsed);

  if (sidebarCollapseToggle) {
    sidebarCollapseToggle.setAttribute("aria-expanded", state.sidebarCollapsed ? "false" : "true");
    sidebarCollapseToggle.setAttribute("aria-label", state.sidebarCollapsed ? "Open sidebar" : "Minimize sidebar");
    sidebarCollapseToggle.innerHTML = `<span aria-hidden="true">${state.sidebarCollapsed ? "&rarr;" : "&larr;"}</span>`;
  }

  railButtons.forEach((button) => {
    const groupName = button.dataset.sidebarGroup;
    const isAccessible = isSidebarGroupAccessible(groupName);
    button.hidden = !isAccessible;
    button.classList.toggle("is-active", isAccessible && groupName === activeGroup);
  });

  sidebarNavItems.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sidebarItem === state.activeSidebarItem);
  });

  if (appRailToggle) {
    appRailToggle.hidden = state.railHidden;
    appRailToggle.setAttribute("aria-label", "Sakrij lijevu traku");
    appRailToggle.innerHTML = `<span aria-hidden="true">&larr;</span>`;
  }

  if (appRailRestore) {
    appRailRestore.hidden = !state.railHidden;
    appRailRestore.setAttribute("aria-label", "Prikazi lijevu traku");
    appRailRestore.innerHTML = `<span aria-hidden="true">&rarr;</span>`;
  }

  sidebarGroupPanels.forEach((panel) => {
    const groupName = panel.dataset.sidebarGroupPanel;
    const isAccessible = isSidebarGroupAccessible(groupName);
    const isActive = isAccessible && groupName === activeGroup;
    panel.hidden = !isActive;
    panel.classList.toggle("is-open", isActive);
    panel.querySelector(".sidebar-group-items")?.toggleAttribute("hidden", state.sidebarCollapsed || !isActive);
    panel.querySelector(".sidebar-group-toggle")?.setAttribute("aria-expanded", isActive && !state.sidebarCollapsed ? "true" : "false");
  });
}

function ensureSidebarExpanded(expandSidebar = false) {
  if (expandSidebar && state.sidebarCollapsed) {
    state.sidebarCollapsed = false;
    persistSidebarCollapsed();
  }
}

function setSidebarCollapsed(nextValue) {
  state.sidebarCollapsed = Boolean(nextValue);
  persistSidebarCollapsed();
  renderSidebarState();
}

function setRailHidden(nextValue) {
  state.railHidden = Boolean(nextValue);
  persistRailHidden();
  renderSidebarState();
}

function focusCompanyArea(target = "list") {
  state.activeView = "companies";
  renderActiveView();

  window.requestAnimationFrame(() => {
    if (target === "form") {
      companyNameInput?.focus({ preventScroll: true });
    }

    workspaceViews.companies?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function focusLocationArea(target = "list") {
  state.activeView = "locations";
  renderActiveView();

  window.requestAnimationFrame(() => {
    if (target === "form") {
      locationNameInput?.focus({ preventScroll: true });
    }

    workspaceViews.locations?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function activateSidebarItem(itemName, options = {}) {
  const {
    expandSidebar = false,
    preserveGroup = false,
  } = options;
  const itemConfig = SIDEBAR_ITEM_CONFIG[itemName];

  if (!itemConfig) {
    return;
  }

  ensureSidebarExpanded(expandSidebar);
  state.activeSidebarItem = itemName;

  if (!preserveGroup && itemConfig.group) {
    state.activeSidebarGroup = itemConfig.group;
  }

  if (itemConfig.view === "module") {
    state.activeModuleItem = itemConfig.module;
    state.activeView = "module";
    renderModuleView();
    renderActiveView();
    return;
  }

  if (itemConfig.view === "reminders") {
    state.activeView = "reminders";
    renderActiveView();
    workspaceViews.reminders?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    return;
  }

  if (itemConfig.view === "todo") {
    state.activeView = "todo";
    renderActiveView();
    workspaceViews.todo?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    return;
  }

  if (itemConfig.view === "management") {
    state.activeView = "management";
    renderActiveView();
    workspaceViews.management?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    return;
  }

  if (itemConfig.view === "companies") {
    focusCompanyArea(itemConfig.focus);
    return;
  }

  if (itemConfig.view === "locations") {
    focusLocationArea(itemConfig.focus);
    return;
  }

  if (itemConfig.view === "selfdash") {
    state.activeView = "selfdash";
    renderActiveView();

    if (itemConfig.focus === "list") {
      workOrdersTableWrap?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    workspaceViews.selfdash?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function activateSidebarGroup(groupName, options = {}) {
  const {
    navigate = false,
    expandSidebar = false,
  } = options;

  state.activeSidebarGroup = groupName;
  ensureSidebarExpanded(expandSidebar);

  if (navigate) {
    const targetItem = SIDEBAR_GROUP_DEFAULT_ITEM[groupName];

    if (targetItem) {
      activateSidebarItem(targetItem, { preserveGroup: true });
      return;
    }

    const targetView = SIDEBAR_GROUP_DEFAULT_VIEW[groupName];

    if (targetView) {
      state.activeView = targetView;
    }
  }

  renderActiveView();
}

function focusSelfDashArea(target = "top") {
  state.activeView = "selfdash";

  if (!["home", "operations"].includes(state.activeSidebarGroup)) {
    state.activeSidebarGroup = target === "top" ? "home" : "operations";
  }

  if (target === "top") {
    state.activeSidebarItem = "dashboard";
  } else if (target === "list") {
    state.activeSidebarItem = "rn";
  }

  renderActiveView();

  if (target === "composer") {
    focusWorkOrderComposer();
    return;
  }

  if (target === "list") {
    workOrdersTableWrap?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    return;
  }

  workspaceViews.selfdash?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const rawValue = String(value).trim();
  const directDate = new Date(rawValue);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const normalizedDateOnly = new Date(`${rawValue.slice(0, 10)}T12:00:00`);

  if (!Number.isNaN(normalizedDateOnly.getTime())) {
    return normalizedDateOnly;
  }

  return null;
}

function formatDate(value) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return "Bez datuma";
  }

  return new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium" }).format(parsedDate);
}

function formatCompactDate(value) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return "Bez datuma";
  }

  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const year = parsedDate.getFullYear();
  return `${day}.${month}.${year}.`;
}

function formatCompactDueDate(value) {
  if (!value) {
    return "Bez roka";
  }

  return formatCompactDate(value);
}

function formatCompactOpenedDate(value) {
  if (!value) {
    return "Bez datuma";
  }

  return formatCompactDate(value);
}

function formatDateTime(value) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return "Bez datuma";
  }

  return new Intl.DateTimeFormat("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function toDateKey(value) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStartOfWeekDateKey(value) {
  const parsedDate = parseDateValue(value) ?? new Date();
  const start = new Date(parsedDate);
  const offset = (start.getDay() + 6) % 7;
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - offset);
  return toDateKey(start);
}

function shiftDateKey(value, days) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return toDateKey(new Date());
  }

  const shifted = new Date(parsedDate);
  shifted.setDate(shifted.getDate() + days);
  return toDateKey(shifted);
}

function shiftMonthDateKey(value, months) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return toDateKey(new Date());
  }

  const shifted = new Date(parsedDate);
  shifted.setDate(1);
  shifted.setMonth(shifted.getMonth() + months);
  return toDateKey(shifted);
}

function getCalendarIsoWeekNumber(value) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return 0;
  }

  const workingDate = new Date(parsedDate);
  const day = (workingDate.getDay() + 6) % 7;
  workingDate.setDate(workingDate.getDate() - day + 3);
  const firstThursday = new Date(workingDate.getFullYear(), 0, 4);
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3);
  return 1 + Math.round((workingDate - firstThursday) / 604800000);
}

function formatCalendarMonthLabel(value = state.workOrderCalendar.weekStart) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return "Kalendar";
  }

  return new Intl.DateTimeFormat("hr-HR", {
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function formatCalendarWeekRangeLabel(startValue, endValue) {
  if (!startValue) {
    return "Kalendar";
  }

  const endDate = endValue || startValue;
  const weekNumber = getCalendarIsoWeekNumber(startValue);
  return `Tjedan ${weekNumber} · ${formatCompactDate(startValue)} - ${formatCompactDate(endDate)}`;
}

function buildWorkOrderCalendarWeekDays(
  weekStart = state.workOrderCalendar.weekStart,
  showWeekends = state.workOrderCalendar.showWeekends,
) {
  const todayKey = toDateKey(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const dateKey = shiftDateKey(weekStart, index);
    const parsedDate = parseDateValue(dateKey);
    return {
      key: dateKey,
      dayIndex: parsedDate.getDay(),
      label: new Intl.DateTimeFormat("hr-HR", {
        weekday: "short",
      }).format(parsedDate),
      dateLabel: formatCompactDate(dateKey),
      compactLabel: new Intl.DateTimeFormat("hr-HR", {
        day: "2-digit",
        month: "2-digit",
      }).format(parsedDate),
      fullLabel: formatCompactDate(dateKey),
      isToday: dateKey === todayKey,
    };
  });

  return showWeekends ? days : days.filter((day) => day.dayIndex !== 0 && day.dayIndex !== 6);
}

function formatCalendarRangeLabel(
  weekStart = state.workOrderCalendar.weekStart,
  showWeekends = state.workOrderCalendar.showWeekends,
) {
  const days = buildWorkOrderCalendarWeekDays(weekStart, showWeekends);
  return formatCalendarWeekRangeLabel(days[0]?.key || weekStart, days[days.length - 1]?.key || weekStart);
}

function getWorkOrderViewModeLabel(mode = state.activeWorkOrderViewMode) {
  return WORK_ORDER_VIEW_MODES.find((item) => item.value === mode)?.label ?? "List";
}

function createWorkOrderEditorMetaIcon(iconName) {
  const icon = document.createElement("span");
  icon.className = `work-order-editor-meta-icon is-${iconName}`;

  const icons = {
    company: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 13.5h11M4 13.5V4.75c0-.41.34-.75.75-.75h3.5c.41 0 .75.34.75.75V13.5M10 13.5V2.75c0-.41.34-.75.75-.75h1.5c.41 0 .75.34.75.75V13.5M6 6.5h1M6 8.75h1M11.25 5.25h.5M11.25 7.5h.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"/></svg>',
    location: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14s4-3.63 4-7.2A4 4 0 1 0 4 6.8C4 10.37 8 14 8 14Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"/><circle cx="8" cy="6.5" r="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    dates: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.75V1.5M12 2.75V1.5M2.75 5.25h10.5M3.75 3.5h8.5a1 1 0 0 1 1 1v7.75a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"/></svg>',
    service: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M3 8h10M3 11.5h6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.4"/></svg>',
    assignees: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.25 6.25a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM10.75 7.25a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM2.75 12.75a2.5 2.5 0 0 1 5 0M8.75 12.75a2 2 0 0 1 4 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"/></svg>',
  };

  icon.innerHTML = icons[iconName] ?? icons.service;
  return icon;
}

function createWorkOrderEditorMetaItem(iconName, label, value, contentNode = null) {
  const item = document.createElement("div");
  item.className = "work-order-editor-meta-item";

  const body = document.createElement("div");
  body.className = "work-order-editor-meta-body";

  const labelNode = document.createElement("span");
  labelNode.className = "work-order-editor-meta-label";
  labelNode.textContent = label;

  body.append(labelNode);

  if (contentNode) {
    body.append(contentNode);
  } else {
    const valueNode = document.createElement("strong");
    valueNode.className = "work-order-editor-meta-value";
    valueNode.textContent = value || "-";
    body.append(valueNode);
  }

  item.append(createWorkOrderEditorMetaIcon(iconName), body);
  return item;
}

function scrollWorkOrderEditorToTop() {
  workOrderEditorBody?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  workOrderActivityList?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function setWorkOrderSaveState(mode, message = "") {
  if (!workOrderSaveState) {
    return;
  }

  const defaultMessages = {
    idle: "Automatsko spremanje je spremno.",
    pending: "Promjene cekaju spremanje...",
    saving: "Spremanje u tijeku...",
    saved: "Sve promjene su spremljene.",
    blocked: "Odaberi tvrtku da se RN spremi.",
    error: "Spremanje nije uspjelo.",
  };

  state.workOrderAutoSave.state = mode;
  workOrderSaveState.dataset.state = mode;
  workOrderSaveState.textContent = message || defaultMessages[mode] || defaultMessages.idle;
}

function clearWorkOrderAutoSaveTimer() {
  if (state.workOrderAutoSave.timerId) {
    window.clearTimeout(state.workOrderAutoSave.timerId);
    state.workOrderAutoSave.timerId = null;
  }
}

function resetWorkOrderAutoSaveState() {
  clearWorkOrderAutoSaveTimer();
  state.workOrderAutoSave = {
    timerId: null,
    saving: false,
    dirty: false,
    lastFingerprint: "",
    lastSavedAt: "",
    state: "idle",
  };
  setWorkOrderSaveState("idle");
}

function getWorkOrderPayloadFingerprint(payload = buildWorkOrderPayload()) {
  return JSON.stringify(payload);
}

function canAutoSaveWorkOrder(payload = buildWorkOrderPayload()) {
  if (workOrderIdInput.value) {
    return true;
  }

  return Boolean(payload.companyId);
}

function findCreatedWorkOrderMatch(previousIds, payload) {
  const created = state.workOrders.find((item) => !previousIds.has(String(item.id)));

  if (created) {
    return created;
  }

  return state.workOrders.find((item) => (
    String(item.companyId || "") === String(payload.companyId || "")
    && String(item.locationId || "") === String(payload.locationId || "")
    && String(item.openedDate || "") === String(payload.openedDate || "")
    && String(item.serviceLine || "") === String(payload.serviceLine || "")
    && String(item.department || "") === String(payload.department || "")
    && String(item.teamLabel || "") === String(payload.teamLabel || "")
    && String(item.executor1 || "") === String(payload.executor1 || "")
    && String(item.executor2 || "") === String(payload.executor2 || "")
  )) ?? null;
}

async function persistWorkOrderAutoSave({ immediate = false } = {}) {
  clearWorkOrderAutoSaveTimer();

  if (!state.workOrderEditorOpen || !state.user) {
    return false;
  }

  if (state.workOrderAutoSave.saving) {
    state.workOrderAutoSave.dirty = true;
    state.workOrderAutoSave.timerId = window.setTimeout(() => {
      void persistWorkOrderAutoSave();
    }, WORK_ORDER_AUTOSAVE_DELAY_MS);
    return false;
  }

  const payload = buildWorkOrderPayload();
  const fingerprint = getWorkOrderPayloadFingerprint(payload);
  const isEditing = Boolean(workOrderIdInput.value);

  if (!canAutoSaveWorkOrder(payload)) {
    state.workOrderAutoSave.dirty = false;
    setWorkOrderSaveState("blocked");
    return false;
  }

  if (isEditing && fingerprint === state.workOrderAutoSave.lastFingerprint && !immediate) {
    setWorkOrderSaveState("saved");
    return true;
  }

  state.workOrderAutoSave.saving = true;
  state.workOrderAutoSave.dirty = false;
  setWorkOrderSaveState("saving");

  const editingId = workOrderIdInput.value;
  const path = isEditing ? `/work-orders/${editingId}` : "/work-orders";
  const method = isEditing ? "PATCH" : "POST";
  const previousIds = new Set(state.workOrders.map((item) => String(item.id)));
  const success = await runMutation(() => apiRequest(path, {
    method,
    body: payload,
  }), workOrderError);

  state.workOrderAutoSave.saving = false;

  if (!success) {
    state.workOrderAutoSave.dirty = true;
    setWorkOrderSaveState("error", workOrderError.textContent || "Spremanje nije uspjelo.");
    return false;
  }

  state.workOrderAutoSave.lastFingerprint = fingerprint;
  state.workOrderAutoSave.lastSavedAt = new Date().toISOString();

  if (isEditing) {
    workOrderNumberPreview.textContent = `Uredujes ${state.workOrders.find((item) => String(item.id) === String(editingId))?.workOrderNumber || editingId}`;
    void loadWorkOrderActivity(editingId);
  } else {
    const created = findCreatedWorkOrderMatch(previousIds, payload);

    if (created) {
      workOrderIdInput.value = created.id;
      workOrderNumberPreview.textContent = `Uredujes ${created.workOrderNumber}`;
      renderWorkOrderEditorSummary();
      void loadWorkOrderActivity(created.id);
    }
  }

  setWorkOrderSaveState("saved");

  if (state.workOrderAutoSave.dirty) {
    queueWorkOrderAutoSave();
  }

  return true;
}

function queueWorkOrderAutoSave() {
  if (!state.workOrderEditorOpen || !state.user) {
    return;
  }

  const payload = buildWorkOrderPayload();

  if (!canAutoSaveWorkOrder(payload)) {
    clearWorkOrderAutoSaveTimer();
    state.workOrderAutoSave.dirty = false;
    setWorkOrderSaveState("blocked");
    return;
  }

  state.workOrderAutoSave.dirty = true;
  setWorkOrderSaveState("pending");
  clearWorkOrderAutoSaveTimer();
  state.workOrderAutoSave.timerId = window.setTimeout(() => {
    void persistWorkOrderAutoSave();
  }, WORK_ORDER_AUTOSAVE_DELAY_MS);
}

function renderWorkOrderEditorSummary() {
  if (!workOrderEditorTitle || !workOrderEditorSubtitle || !workOrderEditorMeta) {
    return;
  }

  const activeId = String(workOrderIdInput.value || "");
  const persistedItem = state.workOrders.find((item) => String(item.id) === activeId) ?? null;
  const workOrderNumber = persistedItem?.workOrderNumber || "";
  const serviceLine = String(workOrderServiceLineInput.value ?? "").trim();
  const department = String(workOrderDepartmentInput.value ?? "").trim();
  const teamLabel = String(workOrderTeamLabelInput.value ?? "").trim();
  const description = String(workOrderDescriptionInput.value ?? "").trim();
  const companyName = "";
  const locationName = "";
  const compactServiceSummary = [department, serviceLine].filter(Boolean).join(" · ");
  const serviceSummary = [department, serviceLine].filter(Boolean).join(" · ");
  const executorValues = [workOrderExecutor1Input.value, workOrderExecutor2Input.value]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  workOrderEditorContext.textContent = activeId ? "Uređivanje radnog naloga" : "Otvaranje novog RN";
  workOrderEditorTitle.textContent = workOrderNumber || "Novi radni nalog";
  workOrderEditorSubtitle.textContent = description
    || [serviceLine, department, companyName, locationName].filter(Boolean).join(" · ")
    || "Odaberi klijenta, lokaciju i unesi detalje radnog naloga.";

  workOrderEditorSubtitle.textContent = description
    || compactServiceSummary
    || "Promjene se spremaju automatski.";

  const statusBadge = createBadge(
    getSelectedOptionText(workOrderStatusInput) || workOrderStatusInput.value || "Otvoreni RN",
    statusBadgeClass(workOrderStatusInput.value || "Otvoreni RN"),
  );
  statusBadge.classList.add("work-order-editor-chip");

  const priorityBadge = createBadge(
    getSelectedOptionText(workOrderPriorityInput) || workOrderPriorityInput.value || "Normal",
    priorityBadgeClass(workOrderPriorityInput.value || "Normal"),
  );
  priorityBadge.classList.add("work-order-editor-chip");

  const chips = document.createElement("div");
  chips.className = "work-order-editor-chip-row";
  chips.append(statusBadge, priorityBadge);

  if (workOrderTagTextInput.value.trim()) {
    const tagChip = document.createElement("span");
    tagChip.className = "work-order-editor-tag-chip";
    tagChip.textContent = workOrderTagTextInput.value.trim();
    chips.append(tagChip);
  }

  if (teamLabel) {
    const teamChip = document.createElement("span");
    teamChip.className = "work-order-editor-tag-chip";
    teamChip.textContent = teamLabel;
    chips.append(teamChip);
  }

  const facts = document.createElement("div");
  facts.className = "work-order-editor-facts";
  facts.append(
    createWorkOrderEditorMetaItem(
      "dates",
      "Datumi",
      `${formatCompactOpenedDate(workOrderOpenedDateInput.value)} · ${formatCompactDueDate(workOrderDueDateInput.value)}`,
    ),
    createWorkOrderEditorMetaItem(
      "service",
      "Usluga",
      [department, serviceLine].filter(Boolean).join(" · ") || "Bez usluge",
    ),
    createWorkOrderEditorMetaItem(
      "service",
      "Tim",
      teamLabel || "Bez tima",
    ),
  );

  const assigneeWrap = document.createElement("div");
  assigneeWrap.className = "work-order-editor-assignees";

  if (executorValues.length > 0) {
    executorValues.forEach((executor) => {
      const badge = document.createElement("span");
      badge.className = "work-order-editor-assignee";
      badge.title = executor;
      const tone = getExecutorTone(executor);
      badge.style.setProperty("--executor-bg", tone.bg);
      badge.style.setProperty("--executor-fg", tone.fg);
      badge.textContent = getUserInitials({ fullName: executor });
      assigneeWrap.append(badge);
    });
  } else {
    const empty = document.createElement("span");
    empty.className = "work-order-editor-assignees-empty";
    empty.textContent = "Bez izvršitelja";
    assigneeWrap.append(empty);
  }

  const assigneeMeta = createWorkOrderEditorMetaItem("assignees", "Izvršitelji", "", assigneeWrap);
  assigneeMeta.classList.add("is-assignee-group");
  facts.append(assigneeMeta);
  workOrderEditorMeta.replaceChildren(chips, facts);
  workOrderStatusInput.dataset.status = slugifyValue(workOrderStatusInput.value || "Otvoreni RN");
  renderTopbarBreadcrumbs();
}

function getCompany(companyId) {
  return state.companies.find((item) => item.id === companyId) ?? null;
}

function getLocation(locationId) {
  return state.locations.find((item) => item.id === locationId) ?? null;
}

function getLocationsForCompany(companyId) {
  return state.locations
    .filter((item) => item.companyId === companyId)
    .sort((left, right) => left.name.localeCompare(right.name, "hr"));
}

function getWorkOrderTeamOptions() {
  return Array.from(new Set(
    state.workOrders
      .map((item) => String(item.teamLabel ?? "").trim())
      .filter(Boolean),
  )).sort((left, right) => left.localeCompare(right, "hr"));
}

function refreshWorkOrderTeamSuggestions() {
  if (!workOrderTeamSuggestions) {
    return;
  }

  workOrderTeamSuggestions.replaceChildren(
    ...getWorkOrderTeamOptions().map((label) => {
      const option = document.createElement("option");
      option.value = label;
      return option;
    }),
  );
}

function buildDefaultMeasurementColumns() {
  return DEFAULT_MEASUREMENT_COLUMNS.map((column) => ({ ...column }));
}

function createMeasurementColumn(partial = {}) {
  measurementColumnCounter += 1;

  return {
    id: partial.id || `measurement-custom-${measurementColumnCounter}`,
    label: partial.label || `Kolona ${measurementColumnCounter}`,
    placeholder: partial.placeholder || "Unos",
    width: partial.width || 160,
    computed: partial.computed || null,
    readonly: Boolean(partial.readonly),
  };
}

function createMeasurementRow(partialCells = {}, partialFormats = {}) {
  measurementRowCounter += 1;

  const cells = {};
  const formats = {};

  state.measurementSheet.columns
    .filter((column) => !column.computed)
    .forEach((column) => {
      cells[column.id] = partialCells[column.id] ?? "";
      formats[column.id] = normalizeMeasurementCellFormat(partialFormats[column.id]);
    });

  return {
    id: `measurement-row-${measurementRowCounter}`,
    cells,
    formats,
  };
}

function buildDefaultMeasurementRows(count = DEFAULT_MEASUREMENT_ROW_COUNT) {
  return Array.from({ length: count }, () => createMeasurementRow());
}

function parseMeasurementNumber(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMeasurementDecimals(value) {
  return normalizeMeasurementCellFormat({ decimals: value }).decimals;
}

function normalizeMeasurementLiteralValue(rawValue) {
  const stringValue = String(rawValue ?? "").trim();

  if (!stringValue) {
    return "";
  }

  if (stringValue.toUpperCase() === "TRUE") {
    return true;
  }

  if (stringValue.toUpperCase() === "FALSE") {
    return false;
  }

  const numericPattern = /^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/;

  if (numericPattern.test(stringValue)) {
    const numericValue = parseMeasurementNumber(stringValue);

    if (numericValue !== null) {
      return numericValue;
    }
  }

  return rawValue ?? "";
}

function getMeasurementAverageValue(row) {
  const values = ["reading1", "reading2", "reading3"]
    .map((key) => parseMeasurementNumber(row.cells?.[key]))
    .filter((value) => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatMeasurementAverage(row) {
  const average = getMeasurementAverageValue(row);

  if (average === null) {
    return "";
  }

  return new Intl.NumberFormat("hr-HR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(average);
}

function formatCurrencyAmount(value, currency = "EUR") {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0) || 0);
}

function roundMoneyAmount(value) {
  return Math.round((Number(value ?? 0) || 0) * 100) / 100;
}

function getSpreadsheetColumnLabel(index) {
  let value = index + 1;
  let label = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }

  return label;
}

function ensureMeasurementSheetStructure() {
  if (state.measurementSheet.columns.length === 0) {
    state.measurementSheet.columns = buildDefaultMeasurementColumns();
  }

  state.measurementSheet.rows.forEach((row) => {
    if (!row.cells || typeof row.cells !== "object") {
      row.cells = {};
    }

    if (!row.formats || typeof row.formats !== "object") {
      row.formats = {};
    }

    state.measurementSheet.columns
      .filter((column) => !column.computed)
      .forEach((column) => {
        if (!(column.id in row.cells)) {
          row.cells[column.id] = "";
        }

        row.formats[column.id] = normalizeMeasurementCellFormat(row.formats[column.id]);
      });
  });

  if (state.measurementSheet.rows.length === 0) {
    state.measurementSheet.rows = buildDefaultMeasurementRows();
  }

  ensureMeasurementMinimumRows(MIN_VISIBLE_MEASUREMENT_ROWS);
}

function getMeasurementColumnIndex(columnId) {
  return state.measurementSheet.columns.findIndex((column) => column.id === columnId);
}

function getMeasurementRowIndex(rowId) {
  return state.measurementSheet.rows.findIndex((row) => row.id === rowId);
}

function createMeasurementSelectionRange(startRowIndex, startColumnIndex, endRowIndex, endColumnIndex) {
  return {
    startRowIndex: Math.min(startRowIndex, endRowIndex),
    endRowIndex: Math.max(startRowIndex, endRowIndex),
    startColumnIndex: Math.min(startColumnIndex, endColumnIndex),
    endColumnIndex: Math.max(startColumnIndex, endColumnIndex),
  };
}

function getMeasurementSelectedRange() {
  if (state.measurementSheet.selectedRange) {
    return state.measurementSheet.selectedRange;
  }

  const activeCell = state.measurementSheet.activeCell;

  if (!activeCell) {
    return null;
  }

  const rowIndex = getMeasurementRowIndex(activeCell.rowId);
  const columnIndex = getMeasurementColumnIndex(activeCell.columnId);

  if (rowIndex < 0 || columnIndex < 0) {
    return null;
  }

  return createMeasurementSelectionRange(rowIndex, columnIndex, rowIndex, columnIndex);
}

function getMeasurementCellElement(rowId, columnId) {
  return measurementSheetBody?.querySelector(
    `td[data-row-id="${CSS.escape(rowId)}"][data-column-id="${CSS.escape(columnId)}"]`,
  ) ?? null;
}

function getMeasurementInputElement(rowId, columnId) {
  return getMeasurementCellElement(rowId, columnId)?.querySelector(".measurement-cell-input") ?? null;
}

function isMeasurementInputElement(element) {
  return element instanceof HTMLInputElement && element.classList.contains("measurement-cell-input");
}

function getMeasurementFormulaInputElement() {
  if (!state.measurementSheet.editingCell) {
    return null;
  }

  if (state.measurementSheet.editorSource === "formula-bar") {
    return measurementFormulaInput;
  }

  return getMeasurementInputElement(
    state.measurementSheet.editingCell.rowId,
    state.measurementSheet.editingCell.columnId,
  );
}

function isMeasurementFormulaEditingActive() {
  const formulaInput = getMeasurementFormulaInputElement();
  return formulaInput instanceof HTMLInputElement && isMeasurementFormula(formulaInput.value);
}

function isMeasurementFormulaBarActive() {
  return document.activeElement === measurementFormulaInput;
}

function getMeasurementCellReference(rowIndex, columnIndex) {
  return formatMeasurementCellReference(rowIndex, columnIndex);
}

function getMeasurementSelectionLabel() {
  const range = getMeasurementSelectedRange();

  if (!range) {
    return "";
  }

  const startReference = getMeasurementCellReference(range.startRowIndex, range.startColumnIndex);
  const endReference = getMeasurementCellReference(range.endRowIndex, range.endColumnIndex);
  return startReference === endReference ? startReference : `${startReference}:${endReference}`;
}

function getMeasurementActiveCellPosition() {
  const activeCell = state.measurementSheet.activeCell;

  if (!activeCell) {
    return null;
  }

  const rowIndex = getMeasurementRowIndex(activeCell.rowId);
  const columnIndex = getMeasurementColumnIndex(activeCell.columnId);

  if (rowIndex < 0 || columnIndex < 0) {
    return null;
  }

  return {
    rowIndex,
    columnIndex,
    row: state.measurementSheet.rows[rowIndex] ?? null,
    column: state.measurementSheet.columns[columnIndex] ?? null,
  };
}

function getMeasurementCellFormat(rowIndex, columnIndex) {
  const row = state.measurementSheet.rows[rowIndex];
  const column = state.measurementSheet.columns[columnIndex];

  if (!row || !column || column.computed) {
    return normalizeMeasurementCellFormat();
  }

  return normalizeMeasurementCellFormat(row.formats?.[column.id]);
}

function buildMeasurementBorderFromPreset(preset, range, rowIndex, columnIndex) {
  if (preset === "outline") {
    return normalizeMeasurementBorder({
      top: rowIndex === range.startRowIndex,
      right: columnIndex === range.endColumnIndex,
      bottom: rowIndex === range.endRowIndex,
      left: columnIndex === range.startColumnIndex,
    });
  }

  return normalizeMeasurementBorder(preset);
}

function getMeasurementBorderShadow(border) {
  const normalized = normalizeMeasurementBorder(border);
  const parts = [];
  const borderColor = "rgba(83, 104, 255, 0.92)";

  if (normalized.top) {
    parts.push(`inset 0 2px 0 0 ${borderColor}`);
  }

  if (normalized.right) {
    parts.push(`inset -2px 0 0 0 ${borderColor}`);
  }

  if (normalized.bottom) {
    parts.push(`inset 0 -2px 0 0 ${borderColor}`);
  }

  if (normalized.left) {
    parts.push(`inset 2px 0 0 0 ${borderColor}`);
  }

  return parts.length > 0 ? parts.join(", ") : "none";
}

function getMeasurementActiveCellFormat() {
  const position = getMeasurementActiveCellPosition();

  if (!position) {
    return normalizeMeasurementCellFormat();
  }

  return getMeasurementCellFormat(position.rowIndex, position.columnIndex);
}

function getMeasurementActiveCellRawValue() {
  const position = getMeasurementActiveCellPosition();

  if (!position?.row || !position?.column || position.column.computed) {
    return "";
  }

  return position.row.cells?.[position.column.id] ?? "";
}

function setMeasurementCellRawValue(rowId, columnId, value) {
  const rowIndex = getMeasurementRowIndex(rowId);
  const columnIndex = getMeasurementColumnIndex(columnId);
  const row = state.measurementSheet.rows[rowIndex];
  const column = state.measurementSheet.columns[columnIndex];

  if (!row?.cells || !column || column.computed) {
    return;
  }

  row.cells[column.id] = value;
}

function applyMeasurementFormatToRange(formatOverrides = {}) {
  const range = getMeasurementSelectedRange();

  if (!range) {
    return;
  }

  for (let rowIndex = range.startRowIndex; rowIndex <= range.endRowIndex; rowIndex += 1) {
    const row = state.measurementSheet.rows[rowIndex];

    if (!row) {
      continue;
    }

    row.formats = row.formats ?? {};

    for (let columnIndex = range.startColumnIndex; columnIndex <= range.endColumnIndex; columnIndex += 1) {
      const column = state.measurementSheet.columns[columnIndex];

      if (!column || column.computed) {
        continue;
      }

      const nextFormat = {
        ...row.formats[column.id],
      };

      if ("type" in formatOverrides) {
        nextFormat.type = formatOverrides.type;
      }

      if ("decimals" in formatOverrides) {
        nextFormat.decimals = formatOverrides.decimals;
      }

      if ("borderPreset" in formatOverrides) {
        nextFormat.border = buildMeasurementBorderFromPreset(
          formatOverrides.borderPreset,
          range,
          rowIndex,
          columnIndex,
        );
      }

      row.formats[column.id] = normalizeMeasurementCellFormat(nextFormat);
    }
  }
}

function applyMeasurementToolbarFormat(overrides = {}) {
  if (!state.measurementSheet.activeCell) {
    return;
  }

  applyMeasurementFormatToRange(overrides);
  refreshMeasurementSheetComputedValues();
  renderMeasurementSelection();
  renderMeasurementActiveCell();
  syncMeasurementToolbar();
}

function getEditableMeasurementColumnIndexes() {
  return state.measurementSheet.columns.reduce((indexes, column, index) => {
    if (!column.computed) {
      indexes.push(index);
    }

    return indexes;
  }, []);
}

function getFirstEditableMeasurementColumnIndex() {
  return getEditableMeasurementColumnIndexes()[0] ?? -1;
}

function getLastEditableMeasurementColumnIndex() {
  const editableIndexes = getEditableMeasurementColumnIndexes();
  return editableIndexes[editableIndexes.length - 1] ?? -1;
}

function focusMeasurementCell(rowId, columnId, options = {}) {
  const {
    selectAll = false,
  } = options;

  const input = getMeasurementInputElement(rowId, columnId);

  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  input.focus({ preventScroll: true });

  if (selectAll) {
    input.select();
  }
}

function syncMeasurementToolbar() {
  if (measurementNameBoxInput) {
    measurementNameBoxInput.value = getMeasurementSelectionLabel();
  }

  if (measurementFormulaInput) {
    const nextValue = getMeasurementActiveCellRawValue();

    if (!isMeasurementFormulaBarActive() || state.measurementSheet.editorSource !== "formula-bar") {
      measurementFormulaInput.value = nextValue;
    }

    measurementFormulaInput.disabled = !state.measurementSheet.activeCell;
  }

  const activeFormat = getMeasurementActiveCellFormat();

  if (measurementFormatTypeInput) {
    measurementFormatTypeInput.value = activeFormat.type;
    measurementFormatTypeInput.disabled = !state.measurementSheet.activeCell;
  }

  if (measurementFormatDecimalsInput) {
    measurementFormatDecimalsInput.value = String(activeFormat.decimals);
    measurementFormatDecimalsInput.disabled = !state.measurementSheet.activeCell || ["general", "text", "integer"].includes(activeFormat.type);
  }

  if (measurementFormatBorderInput) {
    measurementFormatBorderInput.value = getMeasurementBorderPreset(activeFormat.border);
    measurementFormatBorderInput.disabled = !state.measurementSheet.activeCell;
  }
}

function ensureMeasurementRowsThrough(targetRowIndex) {
  while (state.measurementSheet.rows.length <= targetRowIndex) {
    state.measurementSheet.rows.push(createMeasurementRow());
  }
}

function appendMeasurementRows(count = MEASUREMENT_ROW_BATCH_SIZE) {
  const total = Math.max(1, count);

  for (let index = 0; index < total; index += 1) {
    state.measurementSheet.rows.push(createMeasurementRow());
  }
}

function ensureMeasurementMinimumRows(minimumCount = DEFAULT_MEASUREMENT_ROW_COUNT) {
  while (state.measurementSheet.rows.length < minimumCount) {
    appendMeasurementRows();
  }
}

function isMeasurementRowEmpty(row) {
  return state.measurementSheet.columns
    .filter((column) => !column.computed)
    .every((column) => !String(row.cells?.[column.id] ?? "").trim());
}

function appendMeasurementEditableColumn(partial = {}, options = {}) {
  const {
    toEnd = false,
  } = options;

  const column = createMeasurementColumn({
    label: partial.label || `Kolona ${state.measurementSheet.columns.filter((item) => !item.computed).length + 1}`,
    ...partial,
  });

  if (toEnd) {
    state.measurementSheet.columns.push(column);
  } else {
    const insertionIndex = state.measurementSheet.columns.findIndex((item) => item.computed || item.id === "note");

    if (insertionIndex >= 0) {
      state.measurementSheet.columns.splice(insertionIndex, 0, column);
    } else {
      state.measurementSheet.columns.push(column);
    }
  }

  state.measurementSheet.rows.forEach((row) => {
    row.cells[column.id] = row.cells[column.id] ?? "";
    row.formats = row.formats ?? {};
    row.formats[column.id] = normalizeMeasurementCellFormat(row.formats[column.id]);
  });

  return getMeasurementColumnIndex(column.id);
}

function insertMeasurementEditableColumnAt(index, partial = {}) {
  const column = createMeasurementColumn({
    label: partial.label || `Kolona ${state.measurementSheet.columns.filter((item) => !item.computed).length + 1}`,
    ...partial,
  });
  const insertionIndex = Math.max(0, Math.min(index, state.measurementSheet.columns.length));
  state.measurementSheet.columns.splice(insertionIndex, 0, column);

  state.measurementSheet.rows.forEach((row) => {
    row.cells[column.id] = row.cells[column.id] ?? "";
    row.formats = row.formats ?? {};
    row.formats[column.id] = normalizeMeasurementCellFormat(row.formats[column.id]);
  });

  return getMeasurementColumnIndex(column.id);
}

function ensureMeasurementEditableColumnsFrom(startColumnIndex, requiredWidth) {
  let editableIndexes = getEditableMeasurementColumnIndexes();
  const startPosition = editableIndexes.indexOf(startColumnIndex);

  if (startPosition < 0) {
    return [];
  }

  while (editableIndexes.length < startPosition + requiredWidth) {
    appendMeasurementEditableColumn({}, { toEnd: true });
    editableIndexes = getEditableMeasurementColumnIndexes();
  }

  return editableIndexes.slice(startPosition, startPosition + requiredWidth);
}

function getMeasurementCellDisplayValue(rowIndex, columnIndex) {
  const row = state.measurementSheet.rows[rowIndex];
  const column = state.measurementSheet.columns[columnIndex];

  if (!row || !column) {
    return "";
  }

  if (column.computed === "average") {
    return formatMeasurementAverage(row);
  }

  const rawValue = row.cells?.[column.id] ?? "";
  const format = getMeasurementCellFormat(rowIndex, columnIndex);

  if (!isMeasurementFormula(rawValue)) {
    return formatMeasurementLiteralDisplayValue(rawValue, format);
  }

  return getMeasurementCellDisplayText(rowIndex, columnIndex);
}

function isMeasurementEditingCell(rowId, columnId) {
  return state.measurementSheet.editorSource === "cell"
    && state.measurementSheet.editingCell?.rowId === rowId
    && state.measurementSheet.editingCell?.columnId === columnId;
}

function getMeasurementCellComputedValue(rowIndex, columnIndex, stack = new Set()) {
  const row = state.measurementSheet.rows[rowIndex];
  const column = state.measurementSheet.columns[columnIndex];

  if (!row || !column) {
    return "";
  }

  if (column.computed === "average") {
    return getMeasurementAverageValue(row) ?? "";
  }

  const rawValue = row.cells?.[column.id] ?? "";

  if (!isMeasurementFormula(rawValue)) {
    return normalizeMeasurementLiteralValue(rawValue);
  }

  const cellKey = `${rowIndex}:${columnIndex}`;

  if (stack.has(cellKey)) {
    throw new Error("Kruzna referenca u formuli.");
  }

  stack.add(cellKey);

  try {
    return evaluateMeasurementFormula(rawValue, {
      resolveCellReference(reference) {
        const { rowIndex: referenceRowIndex, columnIndex: referenceColumnIndex } =
          parseMeasurementCellReference(reference);

        if (referenceRowIndex < 0
          || referenceColumnIndex < 0
          || referenceRowIndex >= state.measurementSheet.rows.length
          || referenceColumnIndex >= state.measurementSheet.columns.length) {
          throw new Error(`Referenca ${reference} nije valjana.`);
        }

        return getMeasurementCellComputedValue(referenceRowIndex, referenceColumnIndex, stack);
      },
    });
  } finally {
    stack.delete(cellKey);
  }
}

function getMeasurementCellDisplayText(rowIndex, columnIndex) {
  try {
    return formatMeasurementComputedDisplayValue(
      getMeasurementCellComputedValue(rowIndex, columnIndex),
      getMeasurementCellFormat(rowIndex, columnIndex),
    );
  } catch {
    return "#ERROR";
  }
}

function updateMeasurementFormulaReferences(formulaText) {
  if (!isMeasurementFormula(formulaText)) {
    state.measurementSheet.formulaReferences = [];
    return;
  }

  state.measurementSheet.formulaReferences = listMeasurementFormulaReferences(formulaText)
    .map((reference) => {
      try {
        return parseMeasurementCellReference(reference);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function renderMeasurementFormulaReferences() {
  measurementSheetBody
    ?.querySelectorAll(".is-formula-reference-cell")
    .forEach((cell) => cell.classList.remove("is-formula-reference-cell"));

  if (!state.measurementSheet.formulaReferences.length) {
    return;
  }

  state.measurementSheet.formulaReferences.forEach((reference) => {
    const row = state.measurementSheet.rows[reference.rowIndex];
    const column = state.measurementSheet.columns[reference.columnIndex];

    if (!row || !column) {
      return;
    }

    getMeasurementCellElement(row.id, column.id)?.classList.add("is-formula-reference-cell");
  });
}

function syncMeasurementFormulaEditState() {
  if (!state.measurementSheet.editingCell) {
    state.measurementSheet.formulaReferences = [];
    renderMeasurementFormulaReferences();
    syncMeasurementToolbar();
    return;
  }

  const input = getMeasurementFormulaInputElement();

  if (!(input instanceof HTMLInputElement)) {
    state.measurementSheet.formulaReferences = [];
    renderMeasurementFormulaReferences();
    syncMeasurementToolbar();
    return;
  }

  updateMeasurementFormulaReferences(input.value);
  renderMeasurementFormulaReferences();
  syncMeasurementToolbar();
}

function insertMeasurementFormulaReference(reference) {
  const input = getMeasurementFormulaInputElement();

  if (!(input instanceof HTMLInputElement) || !isMeasurementFormula(input.value)) {
    return;
  }

  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const nextValue = `${input.value.slice(0, start)}${reference}${input.value.slice(end)}`;

  input.value = nextValue;
  input.setSelectionRange(start + reference.length, start + reference.length);

  setMeasurementCellRawValue(
    state.measurementSheet.editingCell.rowId,
    state.measurementSheet.editingCell.columnId,
    nextValue,
  );

  syncMeasurementFormulaEditState();
  updateMeasurementEditingCellPreview(
    state.measurementSheet.editingCell.rowId,
    state.measurementSheet.editingCell.columnId,
  );
  scheduleMeasurementSheetComputedRefresh();
  input.focus({ preventScroll: true });
}

function maybeInsertMeasurementFormulaReference(rowId, columnId) {
  if (!isMeasurementFormulaEditingActive()) {
    return false;
  }

  if (state.measurementSheet.editingCell?.rowId === rowId
    && state.measurementSheet.editingCell?.columnId === columnId) {
    return false;
  }

  const rowIndex = getMeasurementRowIndex(rowId);
  const columnIndex = getMeasurementColumnIndex(columnId);

  if (rowIndex < 0 || columnIndex < 0) {
    return false;
  }

  insertMeasurementFormulaReference(getMeasurementCellReference(rowIndex, columnIndex));
  return true;
}

function shiftMeasurementFillValue(value, rowOffset, columnOffset) {
  if (!isMeasurementFormula(value)) {
    return value;
  }

  return shiftMeasurementFormulaReferences(value, rowOffset, columnOffset);
}

function enterMeasurementEditMode(rowId, columnId, options = {}) {
  const {
    selectAll = false,
    selectFormulaBody = false,
  } = options;

  state.measurementSheet.editingCell = { rowId, columnId };
  state.measurementSheet.editorSource = "cell";
  focusMeasurementCell(rowId, columnId, { selectAll });

  const input = getMeasurementFormulaInputElement();

  if (!isMeasurementInputElement(input)) {
    return;
  }

  const rowIndex = getMeasurementRowIndex(rowId);
  const columnIndex = getMeasurementColumnIndex(columnId);

  if (selectFormulaBody && isMeasurementFormula(input.value)) {
    const caretIndex = input.value.length;
    input.setSelectionRange(caretIndex, caretIndex);
  } else if (selectAll) {
    input.select();
  }

  if (rowIndex >= 0 && columnIndex >= 0) {
    updateMeasurementFormulaReferences(input.value);
    renderMeasurementFormulaReferences();
  }

  syncMeasurementToolbar();
}

function startMeasurementTypingInActiveCell(initialValue) {
  const activeCell = state.measurementSheet.activeCell;

  if (!activeCell) {
    return false;
  }

  setMeasurementSelection(activeCell.rowId, activeCell.columnId);
  enterMeasurementEditMode(activeCell.rowId, activeCell.columnId);

  const input = getMeasurementFormulaInputElement();

  if (!isMeasurementInputElement(input)) {
    return false;
  }

  input.value = initialValue;
  input.setSelectionRange(initialValue.length, initialValue.length);
  setMeasurementCellRawValue(activeCell.rowId, activeCell.columnId, initialValue);
  syncMeasurementFormulaEditState();
  updateMeasurementEditingCellPreview(activeCell.rowId, activeCell.columnId);
  scheduleMeasurementSheetComputedRefresh();
  return true;
}

function isMeasurementDirectTypingKey(event) {
  return event.key.length === 1
    && !event.ctrlKey
    && !event.metaKey
    && !event.altKey;
}

function exitMeasurementEditMode() {
  state.measurementSheet.editingCell = null;
  state.measurementSheet.editorSource = null;
  state.measurementSheet.formulaReferences = [];
  renderMeasurementFormulaReferences();
  scheduleMeasurementSheetComputedRefresh({ immediate: true });
  syncMeasurementToolbar();
}

function commitMeasurementEditMode() {
  const input = getMeasurementFormulaInputElement();

  if (input instanceof HTMLInputElement) {
    input.blur();
  }

  if (state.measurementSheet.editingCell) {
    exitMeasurementEditMode();
  }
}

function getMeasurementCellInputDisplayValue(rowIndex, columnIndex) {
  const row = state.measurementSheet.rows[rowIndex];
  const column = state.measurementSheet.columns[columnIndex];

  if (!row || !column) {
    return "";
  }

  const rawValue = row.cells?.[column.id] ?? "";
  const format = getMeasurementCellFormat(rowIndex, columnIndex);

  if (isMeasurementEditingCell(row.id, column.id)) {
    return rawValue;
  }

  if (isMeasurementFormula(rawValue)) {
    return getMeasurementCellDisplayText(rowIndex, columnIndex);
  }

  return formatMeasurementLiteralDisplayValue(rawValue, format);
}

function clearScheduledMeasurementSheetRefresh() {
  if (!measurementComputedRefreshTimerId) {
    return;
  }

  window.clearTimeout(measurementComputedRefreshTimerId);
  measurementComputedRefreshTimerId = 0;
}

function updateMeasurementEditingCellPreview(rowId, columnId) {
  const rowIndex = getMeasurementRowIndex(rowId);
  const columnIndex = getMeasurementColumnIndex(columnId);
  const row = state.measurementSheet.rows[rowIndex];
  const column = state.measurementSheet.columns[columnIndex];
  const cell = getMeasurementCellElement(rowId, columnId);

  if (!row || !column || !(cell instanceof HTMLTableCellElement)) {
    return;
  }

  const rawValue = row.cells?.[column.id] ?? "";
  const hasFormula = isMeasurementFormula(rawValue);
  const input = cell.querySelector(".measurement-cell-input");

  cell.classList.toggle("has-formula-cell", hasFormula);
  if (!hasFormula) {
    cell.classList.remove("has-formula-error");
  }

  if (input instanceof HTMLInputElement) {
    input.title = hasFormula ? rawValue : "";
  }

  const rowElement = measurementSheetBody?.querySelector(`tr[data-row-id="${CSS.escape(rowId)}"]`);
  rowElement?.classList.toggle("is-measurement-empty-row", isMeasurementRowEmpty(row));

  state.measurementSheet.columns.forEach((sheetColumn) => {
    if (sheetColumn.computed !== "average") {
      return;
    }

    const averageCell = getMeasurementCellElement(rowId, sheetColumn.id);

    if (averageCell instanceof HTMLTableCellElement) {
      averageCell.textContent = formatMeasurementAverage(row);
    }
  });
}

function scheduleMeasurementSheetComputedRefresh({ immediate = false } = {}) {
  clearScheduledMeasurementSheetRefresh();

  if (immediate) {
    refreshMeasurementSheetComputedValues();
    return;
  }

  measurementComputedRefreshTimerId = window.setTimeout(() => {
    measurementComputedRefreshTimerId = 0;
    refreshMeasurementSheetComputedValues();
  }, MEASUREMENT_COMPUTE_DEBOUNCE_MS);
}

function refreshMeasurementSheetComputedValues() {
  clearScheduledMeasurementSheetRefresh();

  if (!measurementSheetBody) {
    return;
  }

  state.measurementSheet.rows.forEach((row, rowIndex) => {
    state.measurementSheet.columns.forEach((column, columnIndex) => {
      const cell = getMeasurementCellElement(row.id, column.id);

      if (!(cell instanceof HTMLTableCellElement)) {
        return;
      }

      if (column.computed === "average") {
        cell.style.setProperty("--measurement-border-shadow", "none");
        cell.textContent = formatMeasurementAverage(row);
        return;
      }

      const input = cell.querySelector(".measurement-cell-input");
      const rawValue = row.cells?.[column.id] ?? "";
      const hasFormula = isMeasurementFormula(rawValue);
      let hasError = false;
      const format = getMeasurementCellFormat(rowIndex, columnIndex);

      if (hasFormula) {
        hasError = getMeasurementCellDisplayText(rowIndex, columnIndex) === "#ERROR";
      }

      cell.classList.toggle("has-formula-cell", hasFormula);
      cell.classList.toggle("has-formula-error", hasError);
      cell.style.setProperty("--measurement-border-shadow", getMeasurementBorderShadow(format.border));

      if (input instanceof HTMLInputElement && !isMeasurementEditingCell(row.id, column.id)) {
        input.value = getMeasurementCellInputDisplayValue(rowIndex, columnIndex);
        input.title = hasFormula ? rawValue : "";
      }
    });
  });

  renderMeasurementFormulaReferences();
  syncMeasurementToolbar();
}

function clearMeasurementFillPreview() {
  measurementSheetBody
    ?.querySelectorAll(".is-fill-target")
    .forEach((cell) => cell.classList.remove("is-fill-target"));
}

function clearMeasurementSelectionClasses() {
  measurementSheetBody
    ?.querySelectorAll(".is-selected-cell, .is-fill-origin, .is-selected-row")
    .forEach((cell) => cell.classList.remove("is-selected-cell", "is-fill-origin", "is-selected-row"));

  measurementSheetHead
    ?.querySelectorAll(".is-selected-column")
    .forEach((cell) => cell.classList.remove("is-selected-column"));
}

function renderMeasurementActiveCell() {
  measurementSheetBody
    ?.querySelectorAll(".is-active-cell")
    .forEach((cell) => cell.classList.remove("is-active-cell"));

  const activeCell = state.measurementSheet.activeCell;

  if (!activeCell) {
    return;
  }

  getMeasurementCellElement(activeCell.rowId, activeCell.columnId)?.classList.add("is-active-cell");
}

function renderMeasurementSelection() {
  clearMeasurementSelectionClasses();

  const selectedRange = getMeasurementSelectedRange();

  if (!selectedRange) {
    return;
  }

  for (let rowIndex = selectedRange.startRowIndex; rowIndex <= selectedRange.endRowIndex; rowIndex += 1) {
    const row = state.measurementSheet.rows[rowIndex];

    if (!row) {
      continue;
    }

    measurementSheetBody
      ?.querySelector(`tr[data-row-id="${CSS.escape(row.id)}"] > th`)
      ?.classList.add("is-selected-row");

    for (let columnIndex = selectedRange.startColumnIndex; columnIndex <= selectedRange.endColumnIndex; columnIndex += 1) {
      const column = state.measurementSheet.columns[columnIndex];

      if (!column) {
        continue;
      }

      measurementSheetHead
        ?.querySelector(`th[data-column-id="${CSS.escape(column.id)}"]`)
        ?.classList.add("is-selected-column");
      getMeasurementCellElement(row.id, column.id)?.classList.add("is-selected-cell");
    }
  }

  const fillOriginRow = state.measurementSheet.rows[selectedRange.endRowIndex];
  const fillOriginColumn = state.measurementSheet.columns[selectedRange.endColumnIndex];
  getMeasurementCellElement(fillOriginRow?.id, fillOriginColumn?.id)?.classList.add("is-fill-origin");
}

function setMeasurementSelectionByIndex(rowIndex, columnIndex, options = {}) {
  const {
    extend = false,
    focus = false,
    selectAll = false,
  } = options;

  const row = state.measurementSheet.rows[rowIndex];
  const column = state.measurementSheet.columns[columnIndex];

  if (!row || !column || column.computed) {
    return;
  }

  state.measurementSheet.activeCell = { rowId: row.id, columnId: column.id };

  if (extend && state.measurementSheet.selectionAnchor) {
    state.measurementSheet.selectedRange = createMeasurementSelectionRange(
      state.measurementSheet.selectionAnchor.rowIndex,
      state.measurementSheet.selectionAnchor.columnIndex,
      rowIndex,
      columnIndex,
    );
  } else {
    state.measurementSheet.selectionAnchor = { rowIndex, columnIndex };
    state.measurementSheet.selectedRange = createMeasurementSelectionRange(rowIndex, columnIndex, rowIndex, columnIndex);
  }

  state.measurementSheet.fillMenu = null;
  state.measurementSheet.contextMenu = null;
  clearMeasurementFillPreview();
  renderMeasurementSelection();
  renderMeasurementActiveCell();
  renderMeasurementContextMenu();
  syncMeasurementToolbar();

  if (focus) {
    focusMeasurementCell(row.id, column.id, { selectAll });
  }
}

function getCurrentMeasurementFillPreview() {
  return state.measurementSheet.fillDrag ?? state.measurementSheet.fillMenu?.pendingFill ?? null;
}

function renderMeasurementFillPreview() {
  clearMeasurementFillPreview();

  const fillDrag = getCurrentMeasurementFillPreview();

  if (!fillDrag || fillDrag.endRowIndex <= fillDrag.selectionRange.endRowIndex) {
    return;
  }

  for (let rowIndex = fillDrag.selectionRange.endRowIndex + 1; rowIndex <= fillDrag.endRowIndex; rowIndex += 1) {
    const row = state.measurementSheet.rows[rowIndex];

    if (!row) {
      continue;
    }

    for (let columnIndex = fillDrag.selectionRange.startColumnIndex; columnIndex <= fillDrag.selectionRange.endColumnIndex; columnIndex += 1) {
      const column = state.measurementSheet.columns[columnIndex];

      if (!column) {
        continue;
      }

      getMeasurementCellElement(row.id, column.id)?.classList.add("is-fill-target");
    }
  }
}

function renderMeasurementFillMenu() {
  if (!measurementFillMenu || !measurementSheetPanel) {
    return;
  }

  const fillMenuState = state.measurementSheet.fillMenu;

  if (!fillMenuState) {
    measurementFillMenu.hidden = true;
    measurementFillMenu.style.left = "";
    measurementFillMenu.style.top = "";
    return;
  }

  const panelRect = measurementSheetPanel.getBoundingClientRect();
  const estimatedWidth = 212;
  const estimatedHeight = 52;
  const left = Math.min(
    Math.max(fillMenuState.x - panelRect.left + 12, 12),
    Math.max(12, panelRect.width - estimatedWidth - 12),
  );
  const top = Math.min(
    Math.max(fillMenuState.y - panelRect.top + 12, 12),
    Math.max(12, panelRect.height - estimatedHeight - 12),
  );

  measurementFillMenu.hidden = false;
  measurementFillMenu.style.left = `${left}px`;
  measurementFillMenu.style.top = `${top}px`;
}

function closeMeasurementFillMenu() {
  if (!state.measurementSheet.fillMenu) {
    return;
  }

  state.measurementSheet.fillMenu = null;
  clearMeasurementFillPreview();
  renderMeasurementFillMenu();
  renderMeasurementSelection();
}

function openMeasurementFillMenu(pendingFill, pointerX, pointerY) {
  closeMeasurementContextMenu();
  state.measurementSheet.fillMenu = {
    x: pointerX,
    y: pointerY,
    pendingFill,
  };
  renderMeasurementFillPreview();
  renderMeasurementFillMenu();
}

function renderMeasurementContextMenu() {
  if (!measurementContextMenu || !measurementSheetPanel) {
    return;
  }

  const contextMenuState = state.measurementSheet.contextMenu;

  if (!contextMenuState) {
    measurementContextMenu.hidden = true;
    measurementContextMenu.style.left = "";
    measurementContextMenu.style.top = "";
    return;
  }

  const hasRowActions = Number.isInteger(contextMenuState.rowIndex);
  const hasColumnActions = Number.isInteger(contextMenuState.columnIndex)
    && !state.measurementSheet.columns[contextMenuState.columnIndex]?.computed;

  measurementContextAddRowAboveButton.hidden = !hasRowActions;
  measurementContextAddRowBelowButton.hidden = !hasRowActions;
  measurementContextAddColumnLeftButton.hidden = !hasColumnActions;
  measurementContextAddColumnRightButton.hidden = !hasColumnActions;

  if (!hasRowActions && !hasColumnActions) {
    measurementContextMenu.hidden = true;
    measurementContextMenu.style.left = "";
    measurementContextMenu.style.top = "";
    return;
  }

  const panelRect = measurementSheetPanel.getBoundingClientRect();
  const visibleItems = [
    measurementContextAddRowAboveButton,
    measurementContextAddRowBelowButton,
    measurementContextAddColumnLeftButton,
    measurementContextAddColumnRightButton,
  ].filter((button) => !button.hidden).length;
  const estimatedWidth = 220;
  const estimatedHeight = visibleItems * 42 + 16;
  const left = Math.min(
    Math.max(contextMenuState.x - panelRect.left + 10, 10),
    Math.max(10, panelRect.width - estimatedWidth - 10),
  );
  const top = Math.min(
    Math.max(contextMenuState.y - panelRect.top + 10, 10),
    Math.max(10, panelRect.height - estimatedHeight - 10),
  );

  measurementContextMenu.hidden = false;
  measurementContextMenu.style.left = `${left}px`;
  measurementContextMenu.style.top = `${top}px`;
}

function closeMeasurementContextMenu() {
  if (!state.measurementSheet.contextMenu) {
    return;
  }

  state.measurementSheet.contextMenu = null;
  renderMeasurementContextMenu();
}

function openMeasurementContextMenu({ pointerX, pointerY, rowIndex = null, columnIndex = null }) {
  const hasRowActions = Number.isInteger(rowIndex);
  const hasColumnActions = Number.isInteger(columnIndex)
    && !state.measurementSheet.columns[columnIndex]?.computed;

  if (!hasRowActions && !hasColumnActions) {
    closeMeasurementContextMenu();
    return;
  }

  closeMeasurementFillMenu();
  state.measurementSheet.contextMenu = {
    x: pointerX,
    y: pointerY,
    rowIndex: hasRowActions ? rowIndex : null,
    columnIndex: hasColumnActions ? columnIndex : null,
  };
  renderMeasurementContextMenu();
}

function setMeasurementSelection(rowId, columnId, options = {}) {
  const rowIndex = getMeasurementRowIndex(rowId);
  const columnIndex = getMeasurementColumnIndex(columnId);

  if (rowIndex < 0 || columnIndex < 0) {
    return;
  }

  setMeasurementSelectionByIndex(rowIndex, columnIndex, options);
}

function startMeasurementSelectionDrag(rowId, columnId, pointerId) {
  const rowIndex = getMeasurementRowIndex(rowId);
  const columnIndex = getMeasurementColumnIndex(columnId);

  if (rowIndex < 0 || columnIndex < 0) {
    return;
  }

  const anchor = state.measurementSheet.selectionAnchor ?? { rowIndex, columnIndex };

  state.measurementSheet.selectionDrag = {
    pointerId,
    anchorRowIndex: anchor.rowIndex,
    anchorColumnIndex: anchor.columnIndex,
    rowIndex,
    columnIndex,
    hasMoved: false,
  };

  document.body.classList.add("is-selecting-measurement-cells");
}

function updateMeasurementSelectionDragTarget(pointerX, pointerY) {
  const selectionDrag = state.measurementSheet.selectionDrag;

  if (!selectionDrag) {
    return;
  }

  const pointedCell = document.elementFromPoint(pointerX, pointerY)?.closest?.("td[data-row-id][data-column-id]");

  if (!(pointedCell instanceof HTMLElement)) {
    return;
  }

  const rowIndex = getMeasurementRowIndex(pointedCell.dataset.rowId);
  const columnIndex = getMeasurementColumnIndex(pointedCell.dataset.columnId);

  if (rowIndex < 0 || columnIndex < 0 || state.measurementSheet.columns[columnIndex]?.computed) {
    return;
  }

  if (rowIndex === selectionDrag.rowIndex && columnIndex === selectionDrag.columnIndex) {
    return;
  }

  selectionDrag.rowIndex = rowIndex;
  selectionDrag.columnIndex = columnIndex;
  selectionDrag.hasMoved = true;
  state.measurementSheet.activeCell = {
    rowId: state.measurementSheet.rows[rowIndex]?.id,
    columnId: state.measurementSheet.columns[columnIndex]?.id,
  };
  state.measurementSheet.selectedRange = createMeasurementSelectionRange(
    selectionDrag.anchorRowIndex,
    selectionDrag.anchorColumnIndex,
    rowIndex,
    columnIndex,
  );
  state.measurementSheet.fillMenu = null;
  state.measurementSheet.contextMenu = null;
  clearMeasurementFillPreview();
  renderMeasurementSelection();
  renderMeasurementActiveCell();
  renderMeasurementContextMenu();
}

function stopMeasurementSelectionDrag() {
  const selectionDrag = state.measurementSheet.selectionDrag;

  if (!selectionDrag) {
    return;
  }

  state.measurementSheet.selectionDrag = null;
  document.body.classList.remove("is-selecting-measurement-cells");
}

function selectMeasurementRow(rowIndex) {
  ensureMeasurementSheetStructure();
  const row = state.measurementSheet.rows[rowIndex];
  const firstColumnIndex = getFirstEditableMeasurementColumnIndex();
  const lastColumnIndex = state.measurementSheet.columns.length - 1;

  if (!row || firstColumnIndex < 0 || lastColumnIndex < firstColumnIndex) {
    return;
  }

  state.measurementSheet.activeCell = {
    rowId: row.id,
    columnId: state.measurementSheet.columns[firstColumnIndex].id,
  };
  state.measurementSheet.selectionAnchor = {
    rowIndex,
    columnIndex: firstColumnIndex,
  };
  state.measurementSheet.selectedRange = createMeasurementSelectionRange(
    rowIndex,
    firstColumnIndex,
    rowIndex,
    lastColumnIndex,
  );
  state.measurementSheet.fillMenu = null;
  state.measurementSheet.contextMenu = null;
  renderMeasurementSelection();
  renderMeasurementActiveCell();
  renderMeasurementContextMenu();
  syncMeasurementToolbar();
}

function selectMeasurementColumn(columnIndex) {
  ensureMeasurementSheetStructure();
  const column = state.measurementSheet.columns[columnIndex];

  if (!column || column.computed || state.measurementSheet.rows.length === 0) {
    return;
  }

  state.measurementSheet.activeCell = {
    rowId: state.measurementSheet.rows[0].id,
    columnId: column.id,
  };
  state.measurementSheet.selectionAnchor = {
    rowIndex: 0,
    columnIndex,
  };
  state.measurementSheet.selectedRange = createMeasurementSelectionRange(
    0,
    columnIndex,
    state.measurementSheet.rows.length - 1,
    columnIndex,
  );
  state.measurementSheet.fillMenu = null;
  state.measurementSheet.contextMenu = null;
  renderMeasurementSelection();
  renderMeasurementActiveCell();
  renderMeasurementContextMenu();
  syncMeasurementToolbar();
}

function selectAllMeasurementCells() {
  ensureMeasurementSheetStructure();
  const firstColumnIndex = getFirstEditableMeasurementColumnIndex();
  const lastColumnIndex = state.measurementSheet.columns.length - 1;

  if (state.measurementSheet.rows.length === 0 || firstColumnIndex < 0 || lastColumnIndex < firstColumnIndex) {
    return;
  }

  state.measurementSheet.activeCell = {
    rowId: state.measurementSheet.rows[0].id,
    columnId: state.measurementSheet.columns[firstColumnIndex].id,
  };
  state.measurementSheet.selectionAnchor = {
    rowIndex: 0,
    columnIndex: firstColumnIndex,
  };
  state.measurementSheet.selectedRange = createMeasurementSelectionRange(
    0,
    firstColumnIndex,
    state.measurementSheet.rows.length - 1,
    lastColumnIndex,
  );
  state.measurementSheet.fillMenu = null;
  state.measurementSheet.contextMenu = null;
  renderMeasurementSelection();
  renderMeasurementActiveCell();
  renderMeasurementContextMenu();
  syncMeasurementToolbar();
}

function moveMeasurementSelection(direction, options = {}) {
  ensureMeasurementSheetStructure();
  const editableIndexes = getEditableMeasurementColumnIndexes();

  if (!editableIndexes.length) {
    return;
  }

  if (state.measurementSheet.editingCell) {
    commitMeasurementEditMode();
  }

  const {
    extend = false,
  } = options;

  let rowIndex = state.measurementSheet.activeCell
    ? getMeasurementRowIndex(state.measurementSheet.activeCell.rowId)
    : 0;
  let columnIndex = state.measurementSheet.activeCell
    ? getMeasurementColumnIndex(state.measurementSheet.activeCell.columnId)
    : editableIndexes[0];

  if (rowIndex < 0) {
    rowIndex = 0;
  }

  if (columnIndex < 0 || state.measurementSheet.columns[columnIndex]?.computed) {
    columnIndex = editableIndexes[0];
  }

  let editablePosition = editableIndexes.indexOf(columnIndex);

  if (editablePosition < 0) {
    editablePosition = 0;
    columnIndex = editableIndexes[0];
  }

  let targetRowIndex = rowIndex;
  let targetColumnIndex = columnIndex;

  if (direction === "left") {
    targetColumnIndex = editableIndexes[Math.max(0, editablePosition - 1)] ?? columnIndex;
  }

  if (direction === "right") {
    targetColumnIndex = editableIndexes[Math.min(editableIndexes.length - 1, editablePosition + 1)] ?? columnIndex;
  }

  if (direction === "up") {
    targetRowIndex = Math.max(0, rowIndex - 1);
  }

  if (direction === "down") {
    ensureMeasurementRowsThrough(rowIndex + 1);
    targetRowIndex = Math.min(state.measurementSheet.rows.length - 1, rowIndex + 1);
  }

  if (direction === "tab-next") {
    if (editablePosition >= editableIndexes.length - 1) {
      ensureMeasurementRowsThrough(rowIndex + 1);
      targetRowIndex = Math.min(state.measurementSheet.rows.length - 1, rowIndex + 1);
      targetColumnIndex = editableIndexes[0];
    } else {
      targetColumnIndex = editableIndexes[editablePosition + 1];
    }
  }

  if (direction === "tab-prev") {
    if (editablePosition <= 0) {
      if (rowIndex === 0) {
        targetColumnIndex = editableIndexes[0];
      } else {
        targetRowIndex = rowIndex - 1;
        targetColumnIndex = editableIndexes[editableIndexes.length - 1];
      }
    } else {
      targetColumnIndex = editableIndexes[editablePosition - 1];
    }
  }

  setMeasurementSelectionByIndex(targetRowIndex, targetColumnIndex, {
    extend,
  });
}

function buildMeasurementClipboardText(range) {
  const rows = [];

  for (let rowIndex = range.startRowIndex; rowIndex <= range.endRowIndex; rowIndex += 1) {
    const values = [];

    for (let columnIndex = range.startColumnIndex; columnIndex <= range.endColumnIndex; columnIndex += 1) {
      values.push(getMeasurementCellDisplayValue(rowIndex, columnIndex));
    }

    rows.push(values.join("\t"));
  }

  return rows.join("\n");
}

function parseMeasurementClipboardText(text) {
  return String(text ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .filter((row, index, rows) => row.length > 0 || index < rows.length - 1)
    .map((row) => row.split("\t"));
}

function pasteMeasurementClipboard(text) {
  const matrix = parseMeasurementClipboardText(text);

  if (!matrix.length || matrix.every((row) => row.length === 1 && row[0] === "")) {
    return false;
  }

  ensureMeasurementSheetStructure();
  const editableIndexes = getEditableMeasurementColumnIndexes();

  if (!editableIndexes.length) {
    return false;
  }

  let startRowIndex = state.measurementSheet.activeCell
    ? getMeasurementRowIndex(state.measurementSheet.activeCell.rowId)
    : 0;
  let startColumnIndex = state.measurementSheet.activeCell
    ? getMeasurementColumnIndex(state.measurementSheet.activeCell.columnId)
    : editableIndexes[0];

  if (startRowIndex < 0) {
    startRowIndex = 0;
  }

  if (startColumnIndex < 0 || state.measurementSheet.columns[startColumnIndex]?.computed) {
    startColumnIndex = editableIndexes[0];
  }

  const maxWidth = Math.max(...matrix.map((row) => Math.max(1, row.length)));
  ensureMeasurementRowsThrough(startRowIndex + matrix.length - 1);
  const targetColumnIndexes = ensureMeasurementEditableColumnsFrom(startColumnIndex, maxWidth);

  matrix.forEach((clipboardRow, rowOffset) => {
    const row = state.measurementSheet.rows[startRowIndex + rowOffset];

    targetColumnIndexes.forEach((columnIndex, columnOffset) => {
      const column = state.measurementSheet.columns[columnIndex];

      if (!row?.cells || !column || column.computed) {
        return;
      }

      row.cells[column.id] = clipboardRow[columnOffset] ?? "";
    });
  });

  const endRowIndex = startRowIndex + matrix.length - 1;
  const endColumnIndex = targetColumnIndexes[Math.max(0, maxWidth - 1)] ?? startColumnIndex;
  state.measurementSheet.selectedRange = createMeasurementSelectionRange(
    startRowIndex,
    startColumnIndex,
    endRowIndex,
    endColumnIndex,
  );
  state.measurementSheet.selectionAnchor = {
    rowIndex: startRowIndex,
    columnIndex: startColumnIndex,
  };
  state.measurementSheet.activeCell = {
    rowId: state.measurementSheet.rows[endRowIndex]?.id ?? state.measurementSheet.rows[startRowIndex]?.id,
    columnId: state.measurementSheet.columns[endColumnIndex]?.id ?? state.measurementSheet.columns[startColumnIndex]?.id,
  };
  state.measurementSheet.fillMenu = null;
  renderMeasurementSheet();
  focusMeasurementCell(
    state.measurementSheet.activeCell.rowId,
    state.measurementSheet.activeCell.columnId,
  );
  return true;
}

function clearMeasurementRange(range) {
  if (!range) {
    return;
  }

  for (let rowIndex = range.startRowIndex; rowIndex <= range.endRowIndex; rowIndex += 1) {
    const row = state.measurementSheet.rows[rowIndex];

    if (!row?.cells) {
      continue;
    }

    for (let columnIndex = range.startColumnIndex; columnIndex <= range.endColumnIndex; columnIndex += 1) {
      const column = state.measurementSheet.columns[columnIndex];

      if (!column || column.computed) {
        continue;
      }

      row.cells[column.id] = "";
    }
  }
}

function syncMeasurementSheetHeaderFromWorkOrder() {
  const company = getCompany(workOrderCompanyIdInput.value);
  const location = getLocation(workOrderLocationIdInput.value);

  if (measurementCompanyInput) {
    measurementCompanyInput.value = company?.name || "";
  }

  if (measurementHeadquartersInput) {
    measurementHeadquartersInput.value = workOrderHeadquartersInput.value || company?.headquarters || "";
  }

  if (measurementLocationInput) {
    measurementLocationInput.value = location?.name || "";
  }

  if (measurementDateInput) {
    measurementDateInput.value = workOrderOpenedDateInput.value || new Date().toISOString().slice(0, 10);
  }
}

function renderMeasurementSheet() {
  ensureMeasurementSheetStructure();

  if (!measurementSheetBody || !measurementSheetHead || !measurementSheetColgroup) {
    return;
  }

  const colgroupFragment = document.createDocumentFragment();
  const cornerCol = document.createElement("col");
  cornerCol.style.width = "54px";
  colgroupFragment.append(cornerCol);

  state.measurementSheet.columns.forEach((column) => {
    const col = document.createElement("col");
    col.style.width = `${column.width || 140}px`;
    colgroupFragment.append(col);
  });

  measurementSheetColgroup.replaceChildren(colgroupFragment);

  const headRow = document.createElement("tr");
  const cornerHeader = document.createElement("th");
  cornerHeader.className = "measurement-sheet-corner";
  cornerHeader.textContent = "#";
  cornerHeader.title = "Oznaci cijelu tablicu";
  cornerHeader.addEventListener("click", () => {
    selectAllMeasurementCells();
  });
  cornerHeader.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    closeMeasurementContextMenu();
  });
  headRow.append(cornerHeader);

  state.measurementSheet.columns.forEach((column, index) => {
    const th = document.createElement("th");
    th.dataset.columnId = column.id;

    const head = document.createElement("div");
    head.className = "measurement-column-head";

    const letter = document.createElement("span");
    letter.className = "measurement-column-letter";
    letter.textContent = getSpreadsheetColumnLabel(index);

      const title = document.createElement(column.readonly ? "span" : "input");
      title.className = column.readonly
        ? "measurement-column-title is-readonly"
        : "measurement-column-title";

    if (column.readonly) {
      title.textContent = column.label;
    } else {
      title.type = "text";
      title.value = column.label;
      title.addEventListener("input", (event) => {
        column.label = event.currentTarget.value || "Nova kolona";
      });
    }

    const resizeHandle = document.createElement("button");
    resizeHandle.type = "button";
    resizeHandle.className = "measurement-column-resize";
    resizeHandle.setAttribute("aria-label", `Promijeni sirinu kolone ${column.label}`);
    resizeHandle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      state.measurementSheet.resizing = {
        columnId: column.id,
        startX: event.clientX,
        startWidth: column.width || 140,
      };
      resizeHandle.setPointerCapture?.(event.pointerId);
      document.body.classList.add("is-resizing-measurement-column");
    });

    head.append(letter, title, resizeHandle);
    th.append(head);
    if (!column.computed) {
      th.addEventListener("click", (event) => {
        if (event.target instanceof HTMLElement
          && (event.target.closest(".measurement-column-resize")
            || event.target.closest(".measurement-column-title"))) {
          return;
        }

        selectMeasurementColumn(index);
      });
      th.addEventListener("contextmenu", (event) => {
        if (event.target instanceof HTMLElement
          && (event.target.closest(".measurement-column-resize")
            || event.target.closest(".measurement-column-title"))) {
          return;
        }

        event.preventDefault();
        selectMeasurementColumn(index);
        openMeasurementContextMenu({
          pointerX: event.clientX,
          pointerY: event.clientY,
          columnIndex: index,
        });
      });
    }
    headRow.append(th);
  });

  measurementSheetHead.replaceChildren(headRow);

  const bodyFragment = document.createDocumentFragment();

  state.measurementSheet.rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.dataset.rowId = row.id;
    tr.classList.toggle("is-measurement-empty-row", isMeasurementRowEmpty(row));

    const indexCell = document.createElement("th");
    indexCell.scope = "row";
    indexCell.textContent = String(index + 1);
    indexCell.title = `Oznaci red ${index + 1}`;
    indexCell.addEventListener("click", () => {
      selectMeasurementRow(index);
    });
    indexCell.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      selectMeasurementRow(index);
      openMeasurementContextMenu({
        pointerX: event.clientX,
        pointerY: event.clientY,
        rowIndex: index,
      });
    });
    tr.append(indexCell);

    state.measurementSheet.columns.forEach((column) => {
      const td = document.createElement("td");
      td.dataset.rowId = row.id;
      td.dataset.columnId = column.id;

      if (column.computed === "average") {
        td.className = "measurement-cell-average";
        td.textContent = formatMeasurementAverage(row);
        tr.append(td);
        return;
      }

      const shell = document.createElement("div");
      shell.className = "measurement-cell-shell";

       td.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) {
          return;
        }

        if (event.target instanceof HTMLElement && event.target.closest(".measurement-fill-handle")) {
          return;
        }

        event.preventDefault();
        if (maybeInsertMeasurementFormulaReference(row.id, column.id)) {
          return;
        }

       if (state.measurementSheet.editingCell
          && (state.measurementSheet.editingCell.rowId !== row.id
            || state.measurementSheet.editingCell.columnId !== column.id)) {
          commitMeasurementEditMode();
        }

        closeMeasurementFillMenu();
        closeMeasurementContextMenu();
        setMeasurementSelection(row.id, column.id, {
          extend: event.shiftKey,
        });

        if (event.shiftKey) {
          focusMeasurementCell(row.id, column.id);
          return;
        }

        startMeasurementSelectionDrag(row.id, column.id, event.pointerId);
      });
      td.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        if (!column.computed) {
          setMeasurementSelection(row.id, column.id);
        }

        openMeasurementContextMenu({
          pointerX: event.clientX,
          pointerY: event.clientY,
          rowIndex: index,
          columnIndex: column.computed ? null : getMeasurementColumnIndex(column.id),
        });
      });
      td.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();
        enterMeasurementEditMode(row.id, column.id, {
          selectAll: !isMeasurementFormula(row.cells?.[column.id] ?? ""),
          selectFormulaBody: isMeasurementFormula(row.cells?.[column.id] ?? ""),
        });
      });

      const input = document.createElement("input");
      input.type = "text";
      input.className = "measurement-cell-input";
      input.value = getMeasurementCellInputDisplayValue(index, getMeasurementColumnIndex(column.id));
      input.placeholder = column.placeholder || column.label;
      input.dataset.rowId = row.id;
      input.dataset.columnId = column.id;
      input.addEventListener("focus", () => {
        state.measurementSheet.editingCell = {
          rowId: row.id,
          columnId: column.id,
        };
        state.measurementSheet.editorSource = "cell";
        syncMeasurementFormulaEditState();

        if (state.measurementSheet.activeCell?.rowId === row.id
          && state.measurementSheet.activeCell?.columnId === column.id) {
          return;
        }

        setMeasurementSelection(row.id, column.id);
      });
      input.addEventListener("blur", () => {
        if (isMeasurementEditingCell(row.id, column.id)) {
          exitMeasurementEditMode();
        }
      });
      input.addEventListener("input", (event) => {
        state.measurementSheet.editingCell = {
          rowId: row.id,
          columnId: column.id,
        };
        state.measurementSheet.editorSource = "cell";
        setMeasurementCellRawValue(row.id, column.id, event.currentTarget.value);
        syncMeasurementFormulaEditState();
        updateMeasurementEditingCellPreview(row.id, column.id);
        scheduleMeasurementSheetComputedRefresh();
      });

      const fillHandle = document.createElement("button");
      fillHandle.type = "button";
      fillHandle.className = "measurement-fill-handle";
      fillHandle.setAttribute("aria-label", `Kopiraj vrijednost prema dolje za kolonu ${column.label}`);
      fillHandle.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const currentRange = getMeasurementSelectedRange();

        if (!currentRange
          || index !== currentRange.endRowIndex
          || getMeasurementColumnIndex(column.id) !== currentRange.endColumnIndex) {
          setMeasurementSelection(row.id, column.id);
        }

        closeMeasurementFillMenu();
        const selectionRange = getMeasurementSelectedRange();

        if (!selectionRange) {
          return;
        }

        const snapshotRows = state.measurementSheet.rows
          .slice(selectionRange.startRowIndex, selectionRange.endRowIndex + 1)
          .map((sourceRow) => ({
            cells: { ...sourceRow.cells },
            formats: { ...(sourceRow.formats ?? {}) },
          }));

        state.measurementSheet.fillDrag = {
          selectionRange,
          endRowIndex: selectionRange.endRowIndex,
          snapshotRows,
        };
        document.body.classList.add("is-filling-measurement-cells");
        renderMeasurementFillPreview();
      });

      shell.append(input, fillHandle);
      td.append(shell);
      td.classList.toggle("has-formula-cell", isMeasurementFormula(row.cells?.[column.id] ?? ""));
      tr.append(td);
    });

    bodyFragment.append(tr);
  });

  measurementSheetBody.replaceChildren(bodyFragment);
  refreshMeasurementSheetComputedValues();
  renderMeasurementSelection();
  renderMeasurementActiveCell();
  renderMeasurementFillPreview();
  renderMeasurementFillMenu();
  renderMeasurementContextMenu();
}

function extendMeasurementSheetRowsIfNeeded() {
  if (!measurementSheetGridWrap || !state.measurementSheet.isOpen) {
    return;
  }

  const nearBottom = measurementSheetGridWrap.scrollTop + measurementSheetGridWrap.clientHeight
    >= measurementSheetGridWrap.scrollHeight - 420;

  if (!nearBottom) {
    return;
  }

  const previousScrollTop = measurementSheetGridWrap.scrollTop;
  const previousScrollLeft = measurementSheetGridWrap.scrollLeft;
  appendMeasurementRows();
  renderMeasurementSheet();
  measurementSheetGridWrap.scrollTop = previousScrollTop;
  measurementSheetGridWrap.scrollLeft = previousScrollLeft;
}

function setMeasurementSheetOpen(isOpen) {
  state.measurementSheet.isOpen = Boolean(isOpen);

  if (measurementSheetModal) {
    measurementSheetModal.hidden = !state.measurementSheet.isOpen;
  }

  document.body.classList.toggle("measurement-sheet-open", state.measurementSheet.isOpen);

  if (!state.measurementSheet.isOpen) {
    document.body.classList.remove("is-filling-measurement-cells");
    clearMeasurementFillPreview();
    renderMeasurementFillMenu();
    renderMeasurementContextMenu();
  }
}

function openMeasurementSheet() {
  syncMeasurementSheetHeaderFromWorkOrder();
  renderMeasurementSheet();
  if (!state.measurementSheet.activeCell) {
    const firstColumnIndex = getFirstEditableMeasurementColumnIndex();

    if (firstColumnIndex >= 0 && state.measurementSheet.rows[0]) {
      setMeasurementSelectionByIndex(0, firstColumnIndex);
    }
  }
  setMeasurementSheetOpen(true);
  syncMeasurementToolbar();
}

function closeMeasurementSheet() {
  clearScheduledMeasurementSheetRefresh();
  state.measurementSheet.selectionDrag = null;
  state.measurementSheet.fillMenu = null;
  state.measurementSheet.fillDrag = null;
  state.measurementSheet.contextMenu = null;
  state.measurementSheet.editingCell = null;
  state.measurementSheet.editorSource = null;
  state.measurementSheet.formulaReferences = [];
  document.body.classList.remove("is-selecting-measurement-cells");
  document.body.classList.remove("is-filling-measurement-cells");
  setMeasurementSheetOpen(false);
  syncMeasurementToolbar();
}

function resetMeasurementSheet() {
  clearScheduledMeasurementSheetRefresh();
  state.measurementSheet.columns = buildDefaultMeasurementColumns();
  state.measurementSheet.rows = buildDefaultMeasurementRows();
  state.measurementSheet.resizing = null;
  state.measurementSheet.activeCell = null;
  state.measurementSheet.editingCell = null;
  state.measurementSheet.editorSource = null;
  state.measurementSheet.selectionAnchor = null;
  state.measurementSheet.selectedRange = null;
  state.measurementSheet.selectionDrag = null;
  state.measurementSheet.fillDrag = null;
  state.measurementSheet.fillMenu = null;
  state.measurementSheet.contextMenu = null;
  syncMeasurementSheetHeaderFromWorkOrder();
  renderMeasurementSheet();
  syncMeasurementToolbar();
}

function addMeasurementColumn() {
  ensureMeasurementSheetStructure();
  appendMeasurementEditableColumn();
  renderMeasurementSheet();
}

function insertMeasurementRowAt(index) {
  ensureMeasurementSheetStructure();
  const insertionIndex = Math.max(0, Math.min(index, state.measurementSheet.rows.length));
  const activeColumnIndex = getMeasurementActiveCellPosition()?.columnIndex ?? getFirstEditableMeasurementColumnIndex();
  const scrollTop = measurementSheetGridWrap?.scrollTop ?? 0;
  const scrollLeft = measurementSheetGridWrap?.scrollLeft ?? 0;

  state.measurementSheet.rows.splice(insertionIndex, 0, createMeasurementRow());
  renderMeasurementSheet();

  if (measurementSheetGridWrap) {
    measurementSheetGridWrap.scrollTop = scrollTop;
    measurementSheetGridWrap.scrollLeft = scrollLeft;
  }

  if (activeColumnIndex >= 0 && !state.measurementSheet.columns[activeColumnIndex]?.computed) {
    setMeasurementSelectionByIndex(insertionIndex, activeColumnIndex, { focus: true });
  }

  closeMeasurementContextMenu();
}

function insertMeasurementColumnAt(index) {
  ensureMeasurementSheetStructure();
  const insertionIndex = Math.max(0, Math.min(index, state.measurementSheet.columns.length));
  const activeRowIndex = getMeasurementActiveCellPosition()?.rowIndex ?? 0;
  const scrollTop = measurementSheetGridWrap?.scrollTop ?? 0;
  const scrollLeft = measurementSheetGridWrap?.scrollLeft ?? 0;
  const nextColumnIndex = insertMeasurementEditableColumnAt(insertionIndex);

  renderMeasurementSheet();

  if (measurementSheetGridWrap) {
    measurementSheetGridWrap.scrollTop = scrollTop;
    measurementSheetGridWrap.scrollLeft = scrollLeft;
  }

  if (nextColumnIndex >= 0 && state.measurementSheet.rows[activeRowIndex]) {
    setMeasurementSelectionByIndex(activeRowIndex, nextColumnIndex, { focus: true });
  }

  closeMeasurementContextMenu();
}

function insertMeasurementContextRow(position) {
  const contextMenuState = state.measurementSheet.contextMenu;

  if (!contextMenuState || !Number.isInteger(contextMenuState.rowIndex)) {
    return;
  }

  insertMeasurementRowAt(position === "above" ? contextMenuState.rowIndex : contextMenuState.rowIndex + 1);
}

function insertMeasurementContextColumn(position) {
  const contextMenuState = state.measurementSheet.contextMenu;

  if (!contextMenuState || !Number.isInteger(contextMenuState.columnIndex)) {
    return;
  }

  insertMeasurementColumnAt(position === "left"
    ? contextMenuState.columnIndex
    : contextMenuState.columnIndex + 1);
}

function getEditableMeasurementColumnsInRange(range) {
  return state.measurementSheet.columns
    .slice(range.startColumnIndex, range.endColumnIndex + 1)
    .filter((column) => !column.computed);
}

function formatMeasurementSeriesValue(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Number(value.toFixed(2))).replace(".", ",");
}

function applyMeasurementFill(mode, options = {}) {
  const {
    pendingFill = state.measurementSheet.fillMenu?.pendingFill,
    showMenuAfter = false,
    menuX = 0,
    menuY = 0,
  } = options;

  if (!pendingFill) {
    return;
  }

  const { selectionRange, endRowIndex, snapshotRows } = pendingFill;
  const targetColumns = getEditableMeasurementColumnsInRange(selectionRange);
  const selectionHeight = selectionRange.endRowIndex - selectionRange.startRowIndex + 1;

  targetColumns.forEach((column) => {
    const snapshotValues = snapshotRows.map((row) => row.cells?.[column.id] ?? "");
    const snapshotFormats = snapshotRows.map((row) => normalizeMeasurementCellFormat(row.formats?.[column.id]));
    const numericValues = snapshotValues.map(parseMeasurementNumber);
    const canSeries = mode === "series" && numericValues.every((value) => value !== null);

    if (canSeries) {
      let currentValue = numericValues[numericValues.length - 1];
      const step = numericValues.length >= 2
        ? numericValues[numericValues.length - 1] - numericValues[numericValues.length - 2]
        : 1;

      for (let rowIndex = selectionRange.endRowIndex + 1; rowIndex <= endRowIndex; rowIndex += 1) {
        currentValue += step;
        const row = state.measurementSheet.rows[rowIndex];

        if (row?.cells) {
          row.cells[column.id] = formatMeasurementSeriesValue(currentValue);
          row.formats = row.formats ?? {};
          row.formats[column.id] = { ...snapshotFormats[(rowIndex - (selectionRange.endRowIndex + 1)) % selectionHeight] };
        }
      }

      return;
    }

    for (let rowIndex = selectionRange.endRowIndex + 1; rowIndex <= endRowIndex; rowIndex += 1) {
      const sourceOffset = (rowIndex - (selectionRange.endRowIndex + 1)) % selectionHeight;
      const row = state.measurementSheet.rows[rowIndex];
      const sourceRowIndex = selectionRange.startRowIndex + sourceOffset;

      if (row?.cells) {
        row.cells[column.id] = shiftMeasurementFillValue(
          snapshotValues[sourceOffset] ?? "",
          rowIndex - sourceRowIndex,
          0,
        );
        row.formats = row.formats ?? {};
        row.formats[column.id] = { ...snapshotFormats[sourceOffset] };
      }
    }
  });

  state.measurementSheet.selectedRange = createMeasurementSelectionRange(
    selectionRange.startRowIndex,
    selectionRange.startColumnIndex,
    endRowIndex,
    selectionRange.endColumnIndex,
  );
  state.measurementSheet.activeCell = {
    rowId: state.measurementSheet.rows[endRowIndex]?.id ?? state.measurementSheet.rows[selectionRange.endRowIndex]?.id,
    columnId: state.measurementSheet.columns[selectionRange.endColumnIndex]?.id,
  };
  state.measurementSheet.selectionAnchor = {
    rowIndex: selectionRange.startRowIndex,
    columnIndex: selectionRange.startColumnIndex,
  };
  state.measurementSheet.fillMenu = null;
  renderMeasurementSheet();

  if (showMenuAfter) {
    openMeasurementFillMenu(pendingFill, menuX, menuY);
  }
}

function updateMeasurementColumnWidth(pointerX) {
  const resizeState = state.measurementSheet.resizing;

  if (!resizeState) {
    return;
  }

  const column = state.measurementSheet.columns.find((item) => item.id === resizeState.columnId);

  if (!column) {
    return;
  }

  column.width = Math.max(90, resizeState.startWidth + (pointerX - resizeState.startX));
  renderMeasurementSheet();
}

function stopMeasurementColumnResize() {
  if (!state.measurementSheet.resizing) {
    return;
  }

  state.measurementSheet.resizing = null;
  document.body.classList.remove("is-resizing-measurement-column");
}

function updateMeasurementFillTarget(pointerX, pointerY) {
  const fillDrag = state.measurementSheet.fillDrag;

  if (!fillDrag) {
    return;
  }

  const pointedCell = document.elementFromPoint(pointerX, pointerY)?.closest?.("td[data-row-id][data-column-id]");

  if (!(pointedCell instanceof HTMLElement)) {
    fillDrag.endRowIndex = fillDrag.selectionRange.endRowIndex;
    renderMeasurementFillPreview();
    return;
  }

  const hoveredColumnIndex = getMeasurementColumnIndex(pointedCell.dataset.columnId);

  if (hoveredColumnIndex < fillDrag.selectionRange.startColumnIndex
    || hoveredColumnIndex > fillDrag.selectionRange.endColumnIndex) {
    fillDrag.endRowIndex = fillDrag.selectionRange.endRowIndex;
    renderMeasurementFillPreview();
    return;
  }

  const hoveredRowIndex = getMeasurementRowIndex(pointedCell.dataset.rowId);
  fillDrag.endRowIndex = hoveredRowIndex >= fillDrag.selectionRange.endRowIndex
    ? hoveredRowIndex
    : fillDrag.selectionRange.endRowIndex;
  renderMeasurementFillPreview();
}

function stopMeasurementFillDrag(applyFill = true, pointerX = 0, pointerY = 0) {
  const fillDrag = state.measurementSheet.fillDrag;

  if (!fillDrag) {
    return;
  }

  state.measurementSheet.fillDrag = null;
  document.body.classList.remove("is-filling-measurement-cells");

  if (applyFill && fillDrag.endRowIndex > fillDrag.selectionRange.endRowIndex) {
    applyMeasurementFill("copy", {
      pendingFill: fillDrag,
      showMenuAfter: true,
      menuX: pointerX,
      menuY: pointerY,
    });
    return;
  }

  closeMeasurementFillMenu();
  renderMeasurementFillPreview();
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function createActionButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.addEventListener("click", onClick);
  return button;
}

function createListLine(text, className) {
  const line = document.createElement("div");
  line.className = className;
  line.textContent = text;
  return line;
}

function createMetaPill(text, className = "") {
  const pill = document.createElement("span");
  pill.className = ["list-meta-pill", className].filter(Boolean).join(" ");
  pill.textContent = text;
  return pill;
}

function createStatusPill(text, isActive = true) {
  return createMetaPill(text, isActive ? "is-success" : "is-muted");
}

function createStackCell({
  eyebrow = "",
  title = "",
  subtitle = "",
  tertiary = "",
  meta = [],
  className = "",
} = {}) {
  const cell = document.createElement("td");
  if (className) {
    cell.className = className;
  }

  const stack = document.createElement("div");
  stack.className = "list-cell";

  if (eyebrow) {
    stack.append(createListLine(eyebrow, "list-eyebrow"));
  }

  if (title) {
    stack.append(createListLine(title, "list-primary"));
  }

  if (subtitle) {
    stack.append(createListLine(subtitle, "list-secondary"));
  }

  if (tertiary) {
    stack.append(createListLine(tertiary, "list-tertiary"));
  }

  const metaItems = meta.filter(Boolean);

  if (metaItems.length > 0) {
    const metaRow = document.createElement("div");
    metaRow.className = "list-meta-row";

    for (const item of metaItems) {
      if (typeof Node !== "undefined" && item instanceof Node) {
        metaRow.append(item);
      } else if (typeof item === "string") {
        metaRow.append(createMetaPill(item));
      } else {
        metaRow.append(createMetaPill(item.label, item.className));
      }
    }

    stack.append(metaRow);
  }

  cell.append(stack);
  return cell;
}

function createCompanyIdentityCell(company) {
  const cell = document.createElement("td");
  const stack = document.createElement("div");
  stack.className = "company-list-cell";

  const logo = document.createElement("span");
  logo.className = "company-list-logo";
  renderCompanyLogo(logo, company);

  const copy = document.createElement("div");
  copy.className = "company-list-copy";
  copy.append(
    createListLine(company.name || "Tvrtka", "list-primary"),
    createListLine(company.headquarters || "Bez sjedista", "list-secondary"),
    createListLine(company.oib ? `OIB ${company.oib}` : "Bez OIB-a", "list-tertiary"),
  );

  stack.append(logo, copy);
  cell.append(stack);
  return cell;
}

function createBadgeCell(badge, subtitle = "", tertiary = "") {
  const cell = document.createElement("td");
  const stack = document.createElement("div");
  stack.className = "list-cell list-cell-tight";
  stack.append(badge);

  if (subtitle) {
    stack.append(createListLine(subtitle, "list-secondary"));
  }

  if (tertiary) {
    stack.append(createListLine(tertiary, "list-tertiary"));
  }

  cell.append(stack);
  return cell;
}

function createBadge(text, className = "") {
  const badge = document.createElement("span");
  badge.className = ["badge", className].filter(Boolean).join(" ");
  badge.textContent = text;
  return badge;
}

function joinParts(values, separator = " | ") {
  return values.filter(Boolean).join(separator);
}

function isClosedWorkOrder(status) {
  return ["Gotov RN", "Ovjeren RN", "Fakturiran RN", "Storno RN"].includes(String(status ?? ""));
}

function isOverdueWorkOrder(item) {
  if (!item?.dueDate || isClosedWorkOrder(item.status)) {
    return false;
  }

  return item.dueDate < new Date().toISOString().slice(0, 10);
}

function getOptionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function resetWorkOrderActivityState() {
  state.workOrderActivity = {
    workOrderId: "",
    loading: false,
    items: [],
    error: "",
  };
  renderWorkOrderActivity();
}

function renderWorkOrderActivity() {
  if (!workOrderActivityList || !workOrderActivityEmpty || !workOrderActivityLoading || !workOrderActivityError || !workOrderActivityCount) {
    return;
  }

  const { workOrderId, loading, items, error } = state.workOrderActivity;
  workOrderActivityCount.textContent = String(items.length);
  workOrderActivityLoading.hidden = !loading;
  workOrderActivityError.hidden = !error;
  workOrderActivityError.textContent = error;
  workOrderActivityList.replaceChildren();

  const emptyMessage = !workOrderId
    ? "Otvori radni nalog da vidis promjene i status timeline."
    : "Jos nema zabiljezenih promjena za ovaj RN.";
  workOrderActivityEmpty.textContent = emptyMessage;
  workOrderActivityEmpty.hidden = loading || Boolean(error) || items.length > 0;

  items.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "work-order-activity-item";

    const avatar = document.createElement("span");
    avatar.className = "work-order-activity-avatar";
    avatar.textContent = getUserInitials({ fullName: entry.actorLabel });

    const body = document.createElement("div");
    body.className = "work-order-activity-item-body";

    const top = document.createElement("div");
    top.className = "work-order-activity-item-top";

    const description = document.createElement("strong");
    description.className = "work-order-activity-description";
    description.textContent = entry.description || "Azuriranje radnog naloga";

    const time = document.createElement("span");
    time.className = "work-order-activity-time";
    time.textContent = formatDateTime(entry.createdAt);

    top.append(description, time);

    const meta = document.createElement("div");
    meta.className = "work-order-activity-meta";

    const actor = document.createElement("span");
    actor.className = "work-order-activity-actor";
    actor.textContent = entry.actorLabel || "Safety360";
    meta.append(actor);

    if (entry.fieldLabel) {
      const field = document.createElement("span");
      field.className = "work-order-activity-field";
      field.textContent = entry.fieldLabel;
      meta.append(field);
    }

    if (entry.oldValue || entry.newValue) {
      const diff = document.createElement("div");
      diff.className = "work-order-activity-diff";

      if (entry.oldValue) {
        const previous = document.createElement("span");
        previous.className = "work-order-activity-old";
        previous.textContent = entry.oldValue;
        diff.append(previous);
      }

      const arrow = document.createElement("span");
      arrow.className = "work-order-activity-arrow";
      arrow.textContent = "->";
      diff.append(arrow);

      if (entry.newValue) {
        const next = document.createElement("span");
        next.className = "work-order-activity-new";
        next.textContent = entry.newValue;
        diff.append(next);
      }

      body.append(top, meta, diff);
    } else {
      body.append(top, meta);
    }

    item.append(avatar, body);
    workOrderActivityList.append(item);
  });
}

async function loadWorkOrderActivity(workOrderId) {
  if (!workOrderId) {
    resetWorkOrderActivityState();
    return;
  }

  state.workOrderActivity = {
    workOrderId: String(workOrderId),
    loading: true,
    items: [],
    error: "",
  };
  renderWorkOrderActivity();

  try {
    const payload = await apiRequest(`/work-orders/${workOrderId}/activity`);

    if (state.workOrderActivity.workOrderId !== String(workOrderId)) {
      return;
    }

    state.workOrderActivity = {
      workOrderId: String(workOrderId),
      loading: false,
      items: payload.items ?? [],
      error: "",
    };
  } catch (error) {
    if (state.workOrderActivity.workOrderId !== String(workOrderId)) {
      return;
    }

    state.workOrderActivity = {
      workOrderId: String(workOrderId),
      loading: false,
      items: [],
      error: error.message,
    };
  }

  renderWorkOrderActivity();
}

function syncWorkOrderEditorModal() {
  const isOpen = state.workOrderEditorOpen && state.activeView === "selfdash" && Boolean(state.user);

  workOrderEditorPanel?.classList.toggle("is-modal-open", isOpen);
  document.body.classList.toggle("is-work-order-editor-open", isOpen);

  if (workOrderEditorPanel) {
    workOrderEditorPanel.hidden = !isOpen;
    workOrderEditorPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  if (workOrderEditorBackdrop) {
    workOrderEditorBackdrop.hidden = !isOpen;
  }

  if (workOrderEditorCloseButton) {
    workOrderEditorCloseButton.hidden = !isOpen;
  }

  if (isOpen) {
    requestAnimationFrame(() => {
      scrollWorkOrderEditorToTop();
      workOrderEditorBody?.focus({ preventScroll: true });
      window.setTimeout(() => {
        scrollWorkOrderEditorToTop();
      }, 0);
    });
  }
}

function syncOfferEditorModal() {
  if (state.offerEditorOpen && (
    state.activeView !== "module"
    || state.activeModuleItem !== "offers"
    || !state.user
  )) {
    state.offerEditorOpen = false;
  }

  const isOpen = state.offerEditorOpen;

  offerEditorPanel?.classList.toggle("is-modal-open", isOpen);
  document.body.classList.toggle("is-offer-editor-open", isOpen);

  if (offerEditorPanel) {
    offerEditorPanel.hidden = !isOpen;
    offerEditorPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  if (offerEditorBackdrop) {
    offerEditorBackdrop.hidden = !isOpen;
  }

  if (offerEditorCloseButton) {
    offerEditorCloseButton.hidden = !isOpen;
  }

  if (isOpen) {
    requestAnimationFrame(() => {
      scrollOfferFormToTop();
      offerEditorBody?.focus({ preventScroll: true });
      window.setTimeout(() => {
        scrollOfferFormToTop();
      }, 0);
    });
  }
}

function openOfferEditor() {
  state.offerEditorOpen = true;
  syncOfferEditorModal();
}

function closeOfferEditor({ reset = false } = {}) {
  state.offerEditorOpen = false;
  syncOfferEditorModal();

  if (reset) {
    resetOfferForm();
  }
}

function dismissOfferEditor() {
  closeOfferEditor({ reset: true });
  renderOffersModule();
}

function scrollCompanyEditorToTop() {
  companyEditorBody?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function scrollLocationEditorToTop() {
  locationEditorBody?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function syncCompanyEditorModal() {
  if (state.companyEditorOpen && (state.activeView !== "companies" || !state.user)) {
    state.companyEditorOpen = false;
  }

  const isOpen = state.companyEditorOpen;

  companyEditorPanel?.classList.toggle("is-modal-open", isOpen);
  document.body.classList.toggle("is-company-editor-open", isOpen);

  if (isOpen && !companyEditorScrollLockActive) {
    companyEditorScrollLockY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${companyEditorScrollLockY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    companyEditorScrollLockActive = true;
  } else if (!isOpen && companyEditorScrollLockActive) {
    const scrollLockY = companyEditorScrollLockY;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    companyEditorScrollLockY = 0;
    companyEditorScrollLockActive = false;
    window.scrollTo({ top: scrollLockY, left: 0, behavior: "auto" });
  }

  if (companyEditorPanel) {
    companyEditorPanel.hidden = !isOpen;
    companyEditorPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  if (companyEditorBackdrop) {
    companyEditorBackdrop.hidden = !isOpen;
  }

  if (companyEditorCloseButton) {
    companyEditorCloseButton.hidden = !isOpen;
  }

  if (isOpen) {
    requestAnimationFrame(() => {
      scrollCompanyEditorToTop();
      companyEditorBody?.focus({ preventScroll: true });
      window.setTimeout(() => {
        scrollCompanyEditorToTop();
      }, 0);
    });
  }
}

function syncLocationEditorModal() {
  if (state.locationEditorOpen && (state.activeView !== "locations" || !state.user)) {
    state.locationEditorOpen = false;
  }

  const isOpen = state.locationEditorOpen;

  locationEditorPanel?.classList.toggle("is-modal-open", isOpen);
  document.body.classList.toggle("is-location-editor-open", isOpen);

  if (locationEditorPanel) {
    locationEditorPanel.hidden = !isOpen;
    locationEditorPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  if (locationEditorBackdrop) {
    locationEditorBackdrop.hidden = !isOpen;
  }

  if (locationEditorCloseButton) {
    locationEditorCloseButton.hidden = !isOpen;
  }

  if (isOpen) {
    requestAnimationFrame(() => {
      scrollLocationEditorToTop();
      locationEditorBody?.focus({ preventScroll: true });
      window.setTimeout(() => {
        scrollLocationEditorToTop();
      }, 0);
    });
  }
}

function openCompanyEditor() {
  state.companyEditorOpen = true;
  syncCompanyEditorModal();
}

function closeCompanyEditor({ reset = false } = {}) {
  state.companyEditorOpen = false;
  syncCompanyEditorModal();

  if (reset) {
    resetCompanyForm();
  }
}

function dismissCompanyEditor() {
  closeCompanyEditor({ reset: true });
  renderCompanies();
}

function openLocationEditor() {
  state.locationEditorOpen = true;
  syncLocationEditorModal();
}

function closeLocationEditor({ reset = false } = {}) {
  state.locationEditorOpen = false;
  syncLocationEditorModal();

  if (reset) {
    resetLocationForm();
  }
}

function dismissLocationEditor() {
  closeLocationEditor({ reset: true });
  renderLocations();
}

function scrollVehicleEditorToTop() {
  vehicleEditorBody?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function scrollVehicleReservationToTop() {
  vehicleReservationBody?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function syncVehicleReservationAssigneePicker() {
  if (state.vehicleReservationAssigneePickerOpen && (!state.vehicleReservationEditorOpen || !vehicleReservationAssigneesDropdown)) {
    state.vehicleReservationAssigneePickerOpen = false;
  }

  const isOpen = Boolean(state.vehicleReservationAssigneePickerOpen && vehicleReservationAssigneesDropdown);

  vehicleReservationAssigneesDropdown?.classList.toggle("is-open", isOpen);
  if (vehicleReservationAssigneesTrigger) {
    vehicleReservationAssigneesTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }
  if (vehicleReservationAssigneesInput) {
    vehicleReservationAssigneesInput.hidden = !isOpen;
  }
}

function setVehicleReservationAssigneePickerOpen(isOpen) {
  state.vehicleReservationAssigneePickerOpen = Boolean(isOpen);
  syncVehicleReservationAssigneePicker();
}

function syncVehicleEditorModal() {
  if (state.vehicleEditorOpen && (
    state.activeView !== "module"
    || state.activeModuleItem !== "vehicles"
    || !state.user
  )) {
    state.vehicleEditorOpen = false;
  }

  const isOpen = state.vehicleEditorOpen;

  vehicleEditorPanel?.classList.toggle("is-modal-open", isOpen);
  document.body.classList.toggle("is-vehicle-editor-open", isOpen);

  if (vehicleEditorPanel) {
    vehicleEditorPanel.hidden = !isOpen;
    vehicleEditorPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  if (vehicleEditorBackdrop) {
    vehicleEditorBackdrop.hidden = !isOpen;
  }

  if (vehicleEditorCloseButton) {
    vehicleEditorCloseButton.hidden = !isOpen;
  }

  if (isOpen) {
    requestAnimationFrame(() => {
      scrollVehicleEditorToTop();
      vehicleEditorBody?.focus({ preventScroll: true });
      window.setTimeout(() => {
        scrollVehicleEditorToTop();
      }, 0);
    });
  }
}

function syncVehicleReservationModal() {
  if (state.vehicleReservationEditorOpen && (
    state.activeView !== "module"
    || state.activeModuleItem !== "vehicles"
    || !state.user
  )) {
    state.vehicleReservationEditorOpen = false;
  }

  const isOpen = state.vehicleReservationEditorOpen;

  if (!isOpen) {
    state.vehicleReservationAssigneePickerOpen = false;
  }

  vehicleReservationPanel?.classList.toggle("is-modal-open", isOpen);
  document.body.classList.toggle("is-vehicle-reservation-open", isOpen);

  if (vehicleReservationPanel) {
    vehicleReservationPanel.hidden = !isOpen;
    vehicleReservationPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  if (vehicleReservationBackdrop) {
    vehicleReservationBackdrop.hidden = !isOpen;
  }

  if (vehicleReservationCloseButton) {
    vehicleReservationCloseButton.hidden = !isOpen;
  }

  syncVehicleReservationAssigneePicker();

  if (isOpen) {
    requestAnimationFrame(() => {
      scrollVehicleReservationToTop();
      vehicleReservationBody?.focus({ preventScroll: true });
      window.setTimeout(() => {
        scrollVehicleReservationToTop();
      }, 0);
    });
  }
}

function openVehicleEditor() {
  state.vehicleEditorOpen = true;
  syncVehicleEditorModal();
}

function closeVehicleEditor({ reset = false } = {}) {
  state.vehicleEditorOpen = false;
  syncVehicleEditorModal();

  if (reset) {
    resetVehicleForm({ clearSelection: false });
  }
}

function dismissVehicleEditor() {
  closeVehicleEditor({ reset: true });
  renderVehiclesModule();
}

function openVehicleReservationEditor() {
  state.vehicleReservationEditorOpen = true;
  syncVehicleReservationModal();
}

function closeVehicleReservationEditor({ reset = false } = {}) {
  state.vehicleReservationEditorOpen = false;
  syncVehicleReservationModal();

  if (reset) {
    resetVehicleReservationForm({
      clearSelection: false,
      vehicleId: vehicleReservationVehicleIdInput?.value || state.activeVehicleId || "",
    });
  }
}

function dismissVehicleReservationEditor() {
  closeVehicleReservationEditor({ reset: true });
  renderVehiclesModule();
}

function openWorkOrderEditor() {
  state.workOrderEditorOpen = true;
  renderWorkOrderEditorSummary();
  if (workOrderIdInput.value) {
    state.workOrderAutoSave.lastFingerprint = getWorkOrderPayloadFingerprint();
    setWorkOrderSaveState("saved");
  } else if (canAutoSaveWorkOrder()) {
    setWorkOrderSaveState("idle");
  } else {
    setWorkOrderSaveState("blocked");
  }
  renderTopbarBreadcrumbs();
  syncWorkOrderEditorModal();
}

function closeWorkOrderEditor({ reset = false } = {}) {
  clearWorkOrderAutoSaveTimer();
  state.workOrderEditorOpen = false;
  renderTopbarBreadcrumbs();
  syncWorkOrderEditorModal();

  if (reset) {
    resetWorkOrderForm();
    resetWorkOrderActivityState();
  }
}

function focusWorkOrderComposer(prefill = {}) {
  resetWorkOrderForm();
  resetWorkOrderActivityState();

  if (Object.prototype.hasOwnProperty.call(prefill, "openedDate")) {
    workOrderOpenedDateInput.value = prefill.openedDate || "";
  }

  if (Object.prototype.hasOwnProperty.call(prefill, "dueDate")) {
    workOrderDueDateInput.value = prefill.dueDate || "";
  }

  if (Object.prototype.hasOwnProperty.call(prefill, "teamLabel")) {
    workOrderTeamLabelInput.value = prefill.teamLabel || "";
  }

  if (Array.isArray(prefill.executors)) {
    workOrderExecutor1Input.value = prefill.executors[0] ?? "";
    workOrderExecutor2Input.value = prefill.executors[1] ?? "";
  }

  if (prefill.status) {
    workOrderStatusInput.value = prefill.status;
    workOrderNumberPreview.textContent = `Novi ${prefill.status}`;
  }

  if (prefill.priority) {
    workOrderPriorityInput.value = prefill.priority;
  }

  renderWorkOrderEditorSummary();
  setWorkOrderSaveState("blocked");
  openWorkOrderEditor();
}

function buildWorkOrderGroups(items) {
  return WORK_ORDER_STATUS_OPTIONS.map((option) => ({
    status: option.value,
    label: option.label,
    items: items.filter((item) => item.status === option.value),
  })).filter((group) => group.items.length > 0);
}

function renderLoginContent() {
  return;
}

function renderAuthState() {
  const authenticated = Boolean(state.user);
  authScreen.hidden = authenticated;
  appShell.hidden = !authenticated;
  if (chatDock) {
    chatDock.hidden = !authenticated;
  }
  document.body.classList.toggle("is-auth-mode", !authenticated);

  if (!authenticated) {
    state.workOrderEditorOpen = false;
    syncWorkOrderEditorModal();
    state.offerEditorOpen = false;
    syncOfferEditorModal();
    state.companyEditorOpen = false;
    syncCompanyEditorModal();
    state.locationEditorOpen = false;
    syncLocationEditorModal();
    state.vehicleEditorOpen = false;
    syncVehicleEditorModal();
    state.vehicleReservationEditorOpen = false;
    syncVehicleReservationModal();
    resetCompanyForm();
    resetLocationForm();
    resetOfferForm();
    resetVehicleForm();
    resetChatState();
  }

  if (authenticated) {
    const isSuperAdmin = getIsSuperAdmin();
    const isAdmin = getIsAdmin();
    const organization = state.organizations.find((item) => item.id === state.activeOrganizationId)
      ?? state.organizations[0]
      ?? null;
    const presence = readUserPresence(state.user);
    const presenceLabel = USER_PRESENCE_OPTIONS.find((option) => option.value === presence)?.label ?? "Online";
    const roleLabel = state.user.role === "super_admin"
      ? "Super Admin"
      : state.user.role === "admin"
        ? "Admin"
        : "User";
    const organizationLabel = (state.user.organizations ?? [])
      .map((item) => item.name)
      .filter(Boolean)
      .join(", ");

    userBadge.replaceChildren();
    const badgeAvatar = document.createElement("span");
    badgeAvatar.className = "user-badge-avatar-slot";
    const badgeCopy = document.createElement("span");
    badgeCopy.className = "user-badge-copy";
    const badgeName = document.createElement("strong");
    badgeName.textContent = state.user.fullName;
    const badgeRole = document.createElement("span");
    badgeRole.textContent = `${roleLabel} · ${presenceLabel}`;
    badgeCopy.append(badgeName, badgeRole);
    userBadge.append(badgeAvatar, badgeCopy);
    renderAvatar(badgeAvatar, state.user);
    applyPresenceToAvatar(badgeAvatar, presence);
    badgeRole.textContent = roleLabel;
    userMenuName.textContent = state.user.fullName || state.user.email;
    userMenuRole.textContent = `${roleLabel} · ${presenceLabel}`;
    userMenuEmail.textContent = state.user.email || "";
    userMenuOrganizations.textContent = organizationLabel || (organization ? organization.name : "");
    renderAvatar(userMenuAvatar, state.user);
    applyPresenceToAvatar(userMenuAvatar, presence);
    renderUserPresenceOptions(presence);
    userMenuRole.textContent = roleLabel;
    if (userMenuPresenceCurrent) {
      userMenuPresenceCurrent.textContent = presenceLabel;
      userMenuPresenceCurrent.dataset.presence = presence;
    }
    if (userMenuActiveOrg) {
      userMenuActiveOrg.textContent = organization?.name || "Bez organizacije";
    }
    if (userMenuOrgCount) {
      const organizationCount = state.user.organizations?.length || 1;
      userMenuOrgCount.textContent = organizationCount === 1 ? "1 organizacija" : `${organizationCount} organizacije`;
    }
    if (userMenuLastLogin) {
      userMenuLastLogin.textContent = state.user.lastLoginAt ? formatDateTime(state.user.lastLoginAt) : "Upravo sada";
    }
    setUserMenuError("");
    renderTopbarBreadcrumbs();
    organizationSwitcherWrap.hidden = state.organizations.length <= 1;
    managementTab.hidden = !(isSuperAdmin || isAdmin);

    if (sidebarActiveOrganization) {
      sidebarActiveOrganization.textContent = organization ? organization.name : "Safety360";
    }

    if (managementNavLabel) {
      managementNavLabel.textContent = "People";
    }
    renderChatDock();
  } else {
    userBadge.textContent = "";
    userMenuName.textContent = "";
    userMenuRole.textContent = "";
    if (userMenuPresenceCurrent) {
      userMenuPresenceCurrent.textContent = "";
      delete userMenuPresenceCurrent.dataset.presence;
    }
    userMenuEmail.textContent = "";
    userMenuOrganizations.textContent = "";
    renderAvatar(userMenuAvatar, {});
    applyPresenceToAvatar(userMenuAvatar, "online");
    renderUserPresenceOptions("online");
    if (userMenuActiveOrg) {
      userMenuActiveOrg.textContent = "";
    }
    if (userMenuOrgCount) {
      userMenuOrgCount.textContent = "";
    }
    if (userMenuLastLogin) {
      userMenuLastLogin.textContent = "";
    }
    setUserMenuError("");
    organizationContext.textContent = "";
    organizationSwitcherWrap.hidden = true;
    managementTab.hidden = true;
    if (sidebarActiveOrganization) {
      sidebarActiveOrganization.textContent = "Workspace";
    }
    if (managementNavLabel) {
      managementNavLabel.textContent = "People";
    }
    loginError.textContent = "";
    setLoginBusy(false);
    renderChatDock();
  }

  setUserMenuOpen(false);
}

function slugifyValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fillWorkOrderCompanySnapshot(companyLike) {
  workOrderHeadquartersInput.value = companyLike?.headquarters ?? "";
  workOrderCompanyOibInput.value = companyLike?.companyOib ?? companyLike?.oib ?? "";
  workOrderContractTypeInput.value = companyLike?.contractType ?? "";
  syncCompanySelectionPreview(
    companyLike?.companyId ?? companyLike?.id ?? "",
    workOrderCompanyPreview,
    workOrderCompanyPreviewLogo,
    workOrderCompanyPreviewName,
    workOrderCompanyPreviewMeta,
  );
}

function rebuildWorkOrderCompanyOptions(selectedCompanyId = workOrderCompanyIdInput.value) {
  const options = [
    { value: "", label: "Odaberi tvrtku" },
    ...state.companies
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "hr"))
      .map((company) => ({
        value: company.id,
        label: `${company.name} (${company.oib})`,
      })),
  ];

  replaceSelectOptions(workOrderCompanyIdInput, options, selectedCompanyId);
}

function rebuildLocationCompanyOptions(selectedCompanyId = locationCompanyIdInput.value) {
  const options = [
    { value: "", label: state.companies.length === 0 ? "Prvo unesi tvrtku" : "Odaberi tvrtku" },
    ...state.companies
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "hr"))
      .map((company) => ({
        value: company.id,
        label: `${company.name} (${company.oib})`,
      })),
  ];

  replaceSelectOptions(locationCompanyIdInput, options, selectedCompanyId);
}

function rebuildWorkOrderFilterCompanyOptions(selectedCompanyId = workOrderFilterCompanyInput.value) {
  const options = [
    { value: "all", label: "Sve tvrtke" },
    ...state.companies
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "hr"))
      .map((company) => ({
        value: company.id,
        label: company.name,
      })),
  ];

  replaceSelectOptions(workOrderFilterCompanyInput, options, selectedCompanyId || "all");
}

function rebuildWorkOrderLocationOptions(selectedLocationId = workOrderLocationIdInput.value) {
  const companyId = workOrderCompanyIdInput.value;
  const locations = companyId ? getLocationsForCompany(companyId) : [];
  const options = [
    {
      value: "",
      label: companyId ? "Odaberi lokaciju" : "Prvo odaberi tvrtku",
    },
    ...locations.map((location) => ({
      value: location.id,
      label: location.name,
    })),
  ];

  replaceSelectOptions(workOrderLocationIdInput, options, selectedLocationId);
}

function getSelectedContactName() {
  const selectedOption = workOrderContactSlotInput.selectedOptions[0];

  if (!selectedOption || !selectedOption.dataset.contactName) {
    return "";
  }

  return selectedOption.dataset.contactName;
}

function rebuildWorkOrderContactOptions(selectedSlot = workOrderContactSlotInput.value, snapshotName = "") {
  const location = getLocation(workOrderLocationIdInput.value);
  const contacts = buildLocationContacts(location);

  const options = [];

  if (contacts.length === 0 && snapshotName) {
    options.push({
      value: "",
      label: `${snapshotName} (snapshot)`,
      data: { contactName: snapshotName },
    });
  } else {
    options.push({
      value: "",
      label: contacts.length === 0 ? "Nema kontakata na lokaciji" : "Odaberi kontakt",
      data: { contactName: "" },
    });
  }

  for (const contact of contacts) {
    options.push({
      value: contact.slot,
      label: contact.name || `Kontakt ${contact.slot}`,
      data: { contactName: contact.name || `Kontakt ${contact.slot}` },
    });
  }

  replaceSelectOptions(workOrderContactSlotInput, options, selectedSlot);
}

function applySelectedContactDefaults() {
  const location = getLocation(workOrderLocationIdInput.value);
  const contact = buildLocationContacts(location).find((item) => String(item.slot) === String(workOrderContactSlotInput.value));

  if (!contact) {
    workOrderContactPhoneInput.value = "";
    workOrderContactEmailInput.value = "";
    return;
  }

  workOrderContactPhoneInput.value = contact.phone;
  workOrderContactEmailInput.value = contact.email;
}

function applySelectedLocationDefaults() {
  const location = getLocation(workOrderLocationIdInput.value);

  if (!location) {
    workOrderCoordinatesInput.value = "";
    workOrderRegionInput.value = "";
    rebuildWorkOrderContactOptions("", "");
    workOrderContactPhoneInput.value = "";
    workOrderContactEmailInput.value = "";
    return;
  }

  workOrderCoordinatesInput.value = location.coordinates;
  workOrderRegionInput.value = location.region;

  const contacts = buildLocationContacts(location);
  const defaultSlot = contacts[0]?.slot ?? "";
  rebuildWorkOrderContactOptions(defaultSlot, "");
  applySelectedContactDefaults();
}

function buildWorkOrderPayload() {
  return {
    status: workOrderStatusInput.value,
    priority: workOrderPriorityInput.value,
    openedDate: workOrderOpenedDateInput.value,
    dueDate: workOrderDueDateInput.value,
    teamLabel: workOrderTeamLabelInput.value,
    companyId: workOrderCompanyIdInput.value,
    locationId: workOrderLocationIdInput.value,
    coordinates: workOrderCoordinatesInput.value,
    region: workOrderRegionInput.value,
    contactSlot: workOrderContactSlotInput.value,
    contactName: getSelectedContactName(),
    contactPhone: workOrderContactPhoneInput.value,
    contactEmail: workOrderContactEmailInput.value,
    executor1: workOrderExecutor1Input.value,
    executor2: workOrderExecutor2Input.value,
    serviceLine: workOrderServiceLineInput.value,
    department: workOrderDepartmentInput.value,
    linkReference: workOrderLinkReferenceInput.value,
    weight: workOrderWeightInput.value,
    completedBy: workOrderCompletedByInput.value,
    invoiceDate: workOrderInvoiceDateInput.value,
    tagText: workOrderTagTextInput.value,
    description: workOrderDescriptionInput.value,
    invoiceNote: workOrderInvoiceNoteInput.value,
  };
}

function buildCompanyPayload() {
  return {
    name: companyNameInput.value,
    logoDataUrl: companyLogoDataUrlInput?.value || "",
    headquarters: companyHeadquartersInput.value,
    oib: companyOibInput.value,
    contractType: companyContractTypeInput.value,
    contractNumber: companyContractNumberInput.value,
    period: companyPeriodInput.value,
    isActive: companyIsActiveInput.value,
    representative: companyRepresentativeInput.value,
    contactPhone: companyContactPhoneInput.value,
    contactEmail: companyContactEmailInput.value,
    note: companyNoteInput.value,
  };
}

function syncCompanyEditorChrome() {
  const companyName = companyNameInput?.value?.trim() || "Tvrtka";
  const isActive = companyIsActiveInput?.value !== "false";

  renderCompanyLogo(companyLogoPreview, {
    name: companyName,
    logoDataUrl: companyLogoDataUrlInput?.value || "",
  });

  if (companyEditorStatusPill) {
    companyEditorStatusPill.textContent = isActive ? "Aktivno" : "Neaktivno";
    companyEditorStatusPill.classList.toggle("is-active", isActive);
    companyEditorStatusPill.classList.toggle("is-inactive", !isActive);
  }

  if (companyLogoClearButton) {
    companyLogoClearButton.hidden = !(companyLogoDataUrlInput?.value || "");
  }

  if (companyDeleteButton) {
    companyDeleteButton.hidden = !companyIdInput?.value;
  }
}

function createEmptyLocationContactDraft() {
  return {
    name: "",
    phone: "",
    email: "",
  };
}

function sanitizeLocationContactDrafts(contacts = [], { ensureOne = false } = {}) {
  const drafts = Array.isArray(contacts)
    ? contacts.map((contact) => ({
      name: String(contact?.name ?? "").trim(),
      phone: String(contact?.phone ?? "").trim(),
      email: String(contact?.email ?? "").trim(),
    }))
    : [];

  if (ensureOne && drafts.length === 0) {
    return [createEmptyLocationContactDraft()];
  }

  return drafts;
}

function setLocationFormContacts(contacts = [], { ensureOne = false } = {}) {
  locationFormContacts = sanitizeLocationContactDrafts(contacts, { ensureOne });
  renderLocationContactCards();
}

function updateLocationFormContact(index, key, value) {
  if (!locationFormContacts[index]) {
    return;
  }

  locationFormContacts[index][key] = value;
}

function addLocationFormContact(contact = createEmptyLocationContactDraft()) {
  locationFormContacts = [
    ...locationFormContacts,
    {
      name: String(contact?.name ?? "").trim(),
      phone: String(contact?.phone ?? "").trim(),
      email: String(contact?.email ?? "").trim(),
    },
  ];
  renderLocationContactCards();
}

function removeLocationFormContact(index) {
  locationFormContacts = locationFormContacts.filter((_, contactIndex) => contactIndex !== index);

  if (locationFormContacts.length === 0) {
    locationFormContacts = [createEmptyLocationContactDraft()];
  }

  renderLocationContactCards();
}

function renderLocationContactCards() {
  if (!locationContactsList) {
    return;
  }

  if (locationFormContacts.length === 0) {
    locationContactsList.replaceChildren();
    return;
  }

  locationContactsList.replaceChildren(...locationFormContacts.map((contact, index) => {
    const card = document.createElement("fieldset");
    card.className = "contact-card";

    const header = document.createElement("div");
    header.className = "contact-card-header";

    const heading = document.createElement("div");
    heading.className = "contact-card-heading";

    const title = document.createElement("span");
    title.className = "contact-card-title";
    title.textContent = `Kontakt ${index + 1}`;

    const subtitle = document.createElement("span");
    subtitle.className = "contact-card-index";
    subtitle.textContent = "Ime, broj i email";

    heading.append(title, subtitle);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "contact-card-remove";
    removeButton.textContent = "Ukloni";
    removeButton.disabled = locationFormContacts.length === 1;
    removeButton.addEventListener("click", () => removeLocationFormContact(index));

    header.append(heading, removeButton);

    const createInputField = (labelText, key, type = "text", maxLength = "160") => {
      const label = document.createElement("label");
      label.className = "field";

      const span = document.createElement("span");
      span.textContent = labelText;

      const input = document.createElement("input");
      input.type = type;
      input.maxLength = Number(maxLength);
      input.value = contact[key] ?? "";
      input.addEventListener("input", (event) => {
        updateLocationFormContact(index, key, event.currentTarget.value);
      });

      label.append(span, input);
      return label;
    };

    card.append(
      header,
      createInputField("Ime", "name"),
      createInputField("Broj", "phone", "text", "80"),
      createInputField("Email", "email", "email"),
    );

    return card;
  }));
}

function buildLocationPayload() {
  return {
    companyId: locationCompanyIdInput.value,
    name: locationNameInput.value,
    region: locationRegionInput.value,
    coordinates: locationCoordinatesInput.value,
    period: locationPeriodInput.value,
    representative: locationRepresentativeInput.value,
    isActive: locationIsActiveInput.value,
    contacts: sanitizeLocationContactDrafts(locationFormContacts).filter((contact) => (
      contact.name || contact.phone || contact.email
    )),
    note: locationNoteInput.value,
  };
}

function buildOrganizationPayload() {
  return {
    name: organizationNameInput.value,
    oib: organizationOibInput.value,
    address: organizationAddressInput.value,
    city: organizationCityInput.value,
    postalCode: organizationPostalCodeInput.value,
    country: organizationCountryInput.value,
    contactEmail: organizationContactEmailInput.value,
    contactPhone: organizationContactPhoneInput.value,
    status: organizationStatusInput.value,
  };
}

function buildUserPayload() {
  const selectedOrganizationIds = getIsSuperAdmin()
    ? getSelectedUserOrganizationIds()
    : [state.activeOrganizationId].filter(Boolean);
  const primaryOrganizationId = getIsSuperAdmin()
    ? (userOrganizationIdInput.value || selectedOrganizationIds[0] || state.activeOrganizationId)
    : (state.activeOrganizationId || userOrganizationIdInput.value || selectedOrganizationIds[0]);
  const organizationIds = Array.from(new Set([primaryOrganizationId, ...selectedOrganizationIds].filter(Boolean)));

  return {
    firstName: userFirstNameInput.value,
    lastName: userLastNameInput.value,
    email: userEmailInput.value,
    password: userPasswordInput.value,
    organizationId: primaryOrganizationId,
    organizationIds,
    role: getIsSuperAdmin() ? userRoleInput.value : "user",
    legacyUsername: userLegacyUsernameInput.value,
    isActive: userIsActiveInput.value,
    avatarDataUrl: userAvatarDataUrlInput.value,
  };
}

function buildLoginContentPayload() {
  return {
    accentLabel: loginContentAccentInput.value,
    heading: loginContentHeadingInput.value,
    quoteText: loginContentQuoteInput.value,
    authorName: loginContentAuthorNameInput.value,
    authorTitle: loginContentAuthorTitleInput.value,
    featureTitle: loginContentFeatureTitleInput.value,
    featureBody: loginContentFeatureBodyInput.value,
    isActive: loginContentIsActiveInput.value,
  };
}

function resetWorkOrderForm() {
  resetWorkOrderAutoSaveState();
  workOrderForm.reset();
  workOrderIdInput.value = "";
  workOrderError.textContent = "";
  workOrderNumberPreview.textContent = "Broj RN se generira pri spremanju.";
  workOrderStatusInput.value = "Otvoreni RN";
  workOrderPriorityInput.value = "Normal";
  workOrderOpenedDateInput.value = new Date().toISOString().slice(0, 10);
  workOrderTeamLabelInput.value = "";
  rebuildWorkOrderCompanyOptions("");
  rebuildWorkOrderLocationOptions("");
  rebuildWorkOrderContactOptions("", "");
  fillWorkOrderCompanySnapshot(null);
  workOrderCoordinatesInput.value = "";
  workOrderRegionInput.value = "";
  workOrderContactPhoneInput.value = "";
  workOrderContactEmailInput.value = "";
  renderWorkOrderEditorSummary();
  setWorkOrderSaveState("blocked");
}

function resetCompanyForm() {
  companyForm.reset();
  companyIdInput.value = "";
  if (companyLogoDataUrlInput) {
    companyLogoDataUrlInput.value = "";
  }
  if (companyLogoFileInput) {
    companyLogoFileInput.value = "";
  }
  companyError.textContent = "";
  companyIsActiveInput.value = "true";
  if (companyEditorTitle) {
    companyEditorTitle.textContent = "Nova tvrtka";
  }
  syncCompanyEditorChrome();
}

function resetLocationForm() {
  locationForm.reset();
  locationIdInput.value = "";
  locationError.textContent = "";
  locationIsActiveInput.value = "true";
  rebuildLocationCompanyOptions("");
  setLocationFormContacts([], { ensureOne: true });
  if (locationEditorTitle) {
    locationEditorTitle.textContent = "Nova lokacija";
  }
  syncCompanySelectionPreview(
    "",
    locationCompanyPreview,
    locationCompanyPreviewLogo,
    locationCompanyPreviewName,
    locationCompanyPreviewMeta,
  );
}

function resetOrganizationForm() {
  organizationForm.reset();
  organizationIdInput.value = "";
  organizationError.textContent = "";
  organizationStatusInput.value = "active";
  organizationCountryInput.value = "Hrvatska";
}

function resetUserForm() {
  userForm.reset();
  userIdInput.value = "";
  userAvatarDataUrlInput.value = "";
  userError.textContent = "";
  userIsActiveInput.value = "true";
  userRoleInput.value = getIsSuperAdmin() ? "admin" : "user";
  renderAvatar(userAvatarPreview, {});
  userOrganizationIdInput.value = state.activeOrganizationId || state.organizations[0]?.id || "";
  renderUserOrganizationMemberships([userOrganizationIdInput.value].filter(Boolean));
}

function resetLoginContentForm() {
  loginContentForm.reset();
  loginContentIdInput.value = "";
  loginContentError.textContent = "";
  loginContentIsActiveInput.value = "true";
}

function hydrateCompanyForm(company) {
  state.activeView = "companies";
  renderActiveView();
  companyIdInput.value = company.id;
  if (companyLogoDataUrlInput) {
    companyLogoDataUrlInput.value = company.logoDataUrl || "";
  }
  if (companyLogoFileInput) {
    companyLogoFileInput.value = "";
  }
  companyNameInput.value = company.name;
  companyHeadquartersInput.value = company.headquarters;
  companyOibInput.value = company.oib;
  companyContractTypeInput.value = company.contractType;
  companyContractNumberInput.value = company.contractNumber;
  companyPeriodInput.value = company.period;
  companyIsActiveInput.value = String(company.isActive);
  companyRepresentativeInput.value = company.representative;
  companyContactPhoneInput.value = company.contactPhone;
  companyContactEmailInput.value = company.contactEmail;
  companyNoteInput.value = company.note;
  companyError.textContent = "";
  if (companyEditorTitle) {
    companyEditorTitle.textContent = `Uredi tvrtku · ${company.name}`;
  }
  syncCompanyEditorChrome();
  openCompanyEditor();
}

function hydrateLocationForm(location) {
  state.activeView = "locations";
  renderActiveView();
  locationIdInput.value = location.id;
  rebuildLocationCompanyOptions(location.companyId);
  locationNameInput.value = location.name;
  locationRegionInput.value = location.region;
  locationCoordinatesInput.value = location.coordinates;
  locationPeriodInput.value = location.period;
  locationRepresentativeInput.value = location.representative;
  locationIsActiveInput.value = String(location.isActive);
  setLocationFormContacts(buildLocationContacts(location), { ensureOne: true });
  locationNoteInput.value = location.note;
  locationError.textContent = "";
  if (locationEditorTitle) {
    locationEditorTitle.textContent = `Uredi lokaciju · ${location.name}`;
  }
  syncCompanySelectionPreview(
    location.companyId,
    locationCompanyPreview,
    locationCompanyPreviewLogo,
    locationCompanyPreviewName,
    locationCompanyPreviewMeta,
  );
  openLocationEditor();
}

function hydrateWorkOrderForm(workOrder, options = {}) {
  const { loadActivity = true } = options;
  state.activeView = "selfdash";
  renderActiveView();
  resetWorkOrderAutoSaveState();
  workOrderIdInput.value = workOrder.id;
  workOrderNumberPreview.textContent = `Uredujes ${workOrder.workOrderNumber}`;
  workOrderStatusInput.value = workOrder.status;
  workOrderPriorityInput.value = workOrder.priority;
  workOrderOpenedDateInput.value = workOrder.openedDate ?? "";
  workOrderDueDateInput.value = workOrder.dueDate ?? "";
  workOrderTeamLabelInput.value = workOrder.teamLabel ?? "";
  rebuildWorkOrderCompanyOptions(workOrder.companyId);
  fillWorkOrderCompanySnapshot(workOrder);
  rebuildWorkOrderLocationOptions(workOrder.locationId);
  workOrderCoordinatesInput.value = workOrder.coordinates;
  workOrderRegionInput.value = workOrder.region;
  rebuildWorkOrderContactOptions(workOrder.contactSlot ?? "", workOrder.contactName);
  workOrderContactPhoneInput.value = workOrder.contactPhone;
  workOrderContactEmailInput.value = workOrder.contactEmail;
  workOrderExecutor1Input.value = workOrder.executor1;
  workOrderExecutor2Input.value = workOrder.executor2;
  workOrderServiceLineInput.value = workOrder.serviceLine;
  workOrderDepartmentInput.value = workOrder.department;
  workOrderLinkReferenceInput.value = workOrder.linkReference;
  workOrderWeightInput.value = workOrder.weight;
  workOrderCompletedByInput.value = workOrder.completedBy;
  workOrderInvoiceDateInput.value = workOrder.invoiceDate ?? "";
  workOrderTagTextInput.value = workOrder.tagText;
  workOrderDescriptionInput.value = workOrder.description;
  workOrderInvoiceNoteInput.value = workOrder.invoiceNote;
  workOrderError.textContent = "";
  renderWorkOrderEditorSummary();
  state.workOrderAutoSave.lastFingerprint = getWorkOrderPayloadFingerprint();
  setWorkOrderSaveState("saved");
  openWorkOrderEditor();

  if (loadActivity) {
    void loadWorkOrderActivity(workOrder.id);
  }
}

function populateOrganizationForm(organization) {
  organizationIdInput.value = organization.id;
  organizationNameInput.value = organization.name;
  organizationOibInput.value = organization.oib;
  organizationAddressInput.value = organization.address;
  organizationCityInput.value = organization.city;
  organizationPostalCodeInput.value = organization.postalCode;
  organizationCountryInput.value = organization.country || "Hrvatska";
  organizationContactEmailInput.value = organization.contactEmail;
  organizationContactPhoneInput.value = organization.contactPhone;
  organizationStatusInput.value = organization.status || "active";
  organizationError.textContent = "";
}

function hydrateOrganizationForm(organization) {
  state.activeView = "management";
  renderActiveView();
  populateOrganizationForm(organization);
}

function hydrateUserForm(user) {
  state.activeView = "management";
  renderActiveView();
  userIdInput.value = user.id;
  userAvatarDataUrlInput.value = user.avatarDataUrl || "";
  userFirstNameInput.value = user.firstName;
  userLastNameInput.value = user.lastName;
  userEmailInput.value = user.email;
  userPasswordInput.value = "";
  userOrganizationIdInput.value = user.organizationId || state.activeOrganizationId;
  userRoleInput.value = user.role;
  userLegacyUsernameInput.value = user.legacyUsername || "";
  userIsActiveInput.value = String(user.isActive);
  renderUserOrganizationMemberships(user.organizationIds ?? [user.organizationId]);
  renderAvatar(userAvatarPreview, user);
  userError.textContent = "";
}

function hydrateLoginContentForm(item) {
  state.activeView = "management";
  renderActiveView();
  loginContentIdInput.value = item.id;
  loginContentAccentInput.value = item.accentLabel || "";
  loginContentHeadingInput.value = item.heading || "";
  loginContentQuoteInput.value = item.quoteText || "";
  loginContentAuthorNameInput.value = item.authorName || "";
  loginContentAuthorTitleInput.value = item.authorTitle || "";
  loginContentFeatureTitleInput.value = item.featureTitle || "";
  loginContentFeatureBodyInput.value = item.featureBody || "";
  loginContentIsActiveInput.value = String(item.isActive);
  loginContentError.textContent = "";
}

function statusBadgeClass(status) {
  return `status-${slugifyValue(status)}`;
}

function priorityBadgeClass(priority) {
  return `priority-${slugifyValue(priority)}`;
}

function renderSummary() {
  const stats = getDashboardStats(state);
  if (companiesCount) {
    companiesCount.textContent = String(stats.companies);
  }
  if (locationsCount) {
    locationsCount.textContent = String(stats.locations);
  }
  if (activeWorkOrdersCount) {
    activeWorkOrdersCount.textContent = String(stats.activeWorkOrders);
  }
  if (completedWorkOrdersCount) {
    completedWorkOrdersCount.textContent = String(stats.completedWorkOrders);
  }
  if (overdueWorkOrdersCount) {
    overdueWorkOrdersCount.textContent = String(stats.overdueWorkOrders);
  }
}

function createDashboardEmptyState(message) {
  const empty = document.createElement("p");
  empty.className = "dashboard-empty";
  empty.textContent = message;
  return empty;
}

function renderDashboardBreakdownList(container, items) {
  if (!container) {
    return;
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (items.length === 0 || total === 0) {
    container.replaceChildren(createDashboardEmptyState("Jos nema dovoljno podataka za prikaz."));
    return;
  }

  container.replaceChildren(...items.map((item) => {
    const row = document.createElement("div");
    row.className = "dashboard-breakdown-row";

    const top = document.createElement("div");
    top.className = "dashboard-breakdown-top";

    const label = document.createElement("strong");
    label.textContent = item.label;

    const count = document.createElement("span");
    count.textContent = String(item.count);

    top.append(label, count);

    const bar = document.createElement("div");
    bar.className = "dashboard-breakdown-bar";

    const fill = document.createElement("span");
    fill.style.width = `${Math.max(10, Math.round((item.count / total) * 100))}%`;

    bar.append(fill);
    row.append(top, bar);
    return row;
  }));
}

function renderDashboardExecutorList(container, items) {
  if (!container) {
    return;
  }

  if (items.length === 0) {
    container.replaceChildren(createDashboardEmptyState("Nema rasporedenih izvrsitelja."));
    return;
  }

  container.replaceChildren(...items.map((item) => {
    const row = document.createElement("div");
    row.className = "dashboard-executor-row";

    const avatar = document.createElement("span");
    avatar.className = "dashboard-executor-avatar";
    avatar.textContent = getUserInitials({ fullName: item.label });

    const copy = document.createElement("div");
    copy.className = "dashboard-executor-copy";

    const name = document.createElement("strong");
    name.textContent = item.label;

    const meta = document.createElement("span");
    meta.textContent = `${item.count} aktivnih RN`;

    copy.append(name, meta);
    row.append(avatar, copy);
    return row;
  }));
}

function renderDashboardUpcomingList(container, items) {
  if (!container) {
    return;
  }

  if (items.length === 0) {
    container.replaceChildren(createDashboardEmptyState("Nema hitnih rokova u sljedecih 14 dana."));
    return;
  }

  container.replaceChildren(...items.map((item) => {
    const row = document.createElement("div");
    row.className = "dashboard-upcoming-row";

    const identity = document.createElement("div");
    identity.className = "dashboard-upcoming-identity";

    const number = document.createElement("strong");
    number.textContent = item.workOrderNumber || "Bez broja";

    const meta = document.createElement("span");
    meta.textContent = [item.companyName, item.locationName].filter(Boolean).join(" / ") || "Bez klijenta";

    identity.append(number, meta);

    const status = document.createElement("span");
    status.className = `badge ${statusBadgeClass(item.status)}`;
    status.textContent = item.status;

    const due = document.createElement("span");
    due.className = "dashboard-upcoming-date";
    due.textContent = formatCompactDueDate(item.dueDate);

    row.append(identity, status, due);
    return row;
  }));
}

function renderDashboardInsightsSummary() {
  const insights = getDashboardInsights(state);
  const openWorkOrdersNode = document.querySelector("#dashboard-open-work-orders");
  const urgentWorkOrdersNode = document.querySelector("#dashboard-urgent-work-orders");
  const dueThisWeekNode = document.querySelector("#dashboard-due-this-week");
  const missingCoordinatesNode = document.querySelector("#dashboard-missing-coordinates");
  const statusBreakdownNode = document.querySelector("#dashboard-status-breakdown");
  const priorityBreakdownNode = document.querySelector("#dashboard-priority-breakdown");
  const regionBreakdownNode = document.querySelector("#dashboard-region-breakdown");
  const companyBreakdownNode = document.querySelector("#dashboard-company-breakdown");
  const executorBreakdownNode = document.querySelector("#dashboard-executor-breakdown");
  const upcomingListNode = document.querySelector("#dashboard-upcoming-list");

  if (openWorkOrdersNode) {
    openWorkOrdersNode.textContent = String(insights.activeWorkOrders);
  }

  if (urgentWorkOrdersNode) {
    urgentWorkOrdersNode.textContent = String(insights.urgentWorkOrders);
  }

  if (dueThisWeekNode) {
    dueThisWeekNode.textContent = String(insights.dueThisWeekWorkOrders);
  }

  if (missingCoordinatesNode) {
    missingCoordinatesNode.textContent = String(insights.missingCoordinatesLocations);
  }

  renderDashboardBreakdownList(statusBreakdownNode, insights.statusBreakdown);
  renderDashboardBreakdownList(priorityBreakdownNode, insights.priorityBreakdown);
  renderDashboardBreakdownList(regionBreakdownNode, insights.topRegions);
  renderDashboardBreakdownList(companyBreakdownNode, insights.topCompanies);
  renderDashboardExecutorList(executorBreakdownNode, insights.executorLoad);
  renderDashboardUpcomingList(upcomingListNode, insights.upcomingWorkOrders);
}

function createDashboardBuilderEmptyState(message, actions = []) {
  const empty = document.createElement("div");
  empty.className = "dashboard-empty-state";

  const copy = document.createElement("p");
  copy.className = "dashboard-empty";
  copy.textContent = message;
  empty.append(copy);

  if (actions.length > 0) {
    const row = document.createElement("div");
    row.className = "dashboard-empty-actions";
    row.append(...actions);
    empty.append(row);
  }

  return empty;
}

function getDashboardWidgets() {
  return sortDashboardWidgets(state.dashboardWidgets ?? []);
}

function getDashboardWidgetById(widgetId) {
  return getDashboardWidgets().find((item) => String(item.id) === String(widgetId)) ?? null;
}

function getDashboardMetricOptions(source, visualization) {
  const definition = DASHBOARD_WIDGET_DEFINITIONS[source] ?? DASHBOARD_WIDGET_DEFINITIONS.work_orders;

  if (visualization === "metric") {
    return definition.metrics ?? [];
  }

  if (visualization === "list") {
    return definition.lists ?? [];
  }

  return definition.groupings ?? [];
}

function getDashboardRegionOptions() {
  return [...new Set([
    ...state.workOrders.map((item) => String(item.region ?? "").trim()),
    ...state.locations.map((item) => String(item.region ?? "").trim()),
  ].filter(Boolean))].sort((left, right) => left.localeCompare(right, "hr"));
}

function getDashboardExecutorOptions() {
  return [...new Set(
    state.workOrders.flatMap((item) => [item.executor1, item.executor2].map((entry) => String(entry ?? "").trim()).filter(Boolean)),
  )].sort((left, right) => left.localeCompare(right, "hr"));
}

function getDashboardTagOptions() {
  return [...new Set(
    state.workOrders.flatMap((item) => String(item.tagText ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)),
  )].sort((left, right) => left.localeCompare(right, "hr"));
}

function getDashboardStatusOptions(source) {
  if (source === "reminders") {
    return REMINDER_STATUS_OPTIONS;
  }

  if (source === "todo_tasks") {
    return TODO_TASK_STATUS_OPTIONS;
  }

  if (source === "locations") {
    return [];
  }

  return WORK_ORDER_STATUS_OPTIONS;
}

function getDashboardPriorityOptions(source) {
  return source === "todo_tasks" || source === "work_orders" ? PRIORITY_OPTIONS : [];
}

function getSuggestedDashboardWidgetDrafts() {
  return DASHBOARD_WIDGET_TEMPLATES.slice(0, 8).map((template, index) => ({
    ...createDashboardTemplateDraft(template),
    position: index + 1,
  }));
}

function getDashboardWidgetLayoutPreset(size) {
  switch (size) {
    case "small":
      return { gridWidth: 3, gridHeight: 2 };
    case "large":
      return { gridWidth: 6, gridHeight: 4 };
    case "full":
      return { gridWidth: DASHBOARD_GRID_COLUMN_COUNT, gridHeight: 4 };
    default:
      return { gridWidth: 4, gridHeight: 3 };
  }
}

function getDashboardWidgetSizeFromWidth(width) {
  const normalized = Number.parseInt(String(width ?? ""), 10) || 4;

  if (normalized >= DASHBOARD_GRID_COLUMN_COUNT) {
    return "full";
  }

  if (normalized >= 6) {
    return "large";
  }

  if (normalized <= 3) {
    return "small";
  }

  return "medium";
}

function clampDashboardWidgetWidth(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Math.min(DASHBOARD_GRID_COLUMN_COUNT, Math.max(3, Number.isFinite(parsed) ? parsed : 4));
}

function clampDashboardWidgetHeight(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Math.min(6, Math.max(2, Number.isFinite(parsed) ? parsed : 3));
}

function createDashboardTemplateDraft(template) {
  return {
    ...template,
    filters: { ...(template.filters ?? {}) },
  };
}

function findMatchingDashboardTemplate(widget) {
  return DASHBOARD_WIDGET_TEMPLATES.find((template) => (
    template.source === widget.source
    && template.visualization === widget.visualization
    && template.metricKey === widget.metricKey
  )) ?? null;
}

function getDashboardBuilderVisibleTemplates() {
  const activeCategory = state.dashboardBuilder.category || "featured";
  const query = String(state.dashboardBuilder.search ?? "").trim().toLowerCase();

  return DASHBOARD_WIDGET_TEMPLATES.filter((template) => {
    if (activeCategory !== "featured" && template.category !== activeCategory) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      template.title,
      template.description,
      template.source,
      template.visualization,
      template.metricKey,
    ].some((value) => String(value ?? "").trim().toLowerCase().includes(query));
  });
}

function syncDashboardBuilderSearchInput() {
  if (dashboardWidgetSearchInput && dashboardWidgetSearchInput.value !== state.dashboardBuilder.search) {
    dashboardWidgetSearchInput.value = state.dashboardBuilder.search;
  }
}

function createDashboardCategoryButton(category) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dashboard-category-button";

  if (state.dashboardBuilder.category === category.value) {
    button.classList.add("is-active");
  }

  const title = document.createElement("strong");
  title.textContent = category.label;

  const copy = document.createElement("span");
  copy.textContent = category.copy;

  button.append(title, copy);
  button.addEventListener("click", () => {
    state.dashboardBuilder.category = category.value;
    renderDashboardOverview();
  });
  return button;
}

function renderDashboardWidgetCategoryList() {
  if (!dashboardWidgetCategoryList) {
    return;
  }

  dashboardWidgetCategoryList.replaceChildren(
    ...DASHBOARD_WIDGET_TEMPLATE_CATEGORIES.map((category) => createDashboardCategoryButton(category)),
  );
}

function selectDashboardWidgetTemplate(template) {
  state.dashboardBuilder.templateKey = template.key;
  populateDashboardWidgetForm(createDashboardTemplateDraft(template));
  renderDashboardOverview();
}

function createDashboardTemplateCard(template) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dashboard-template-card";

  if (state.dashboardBuilder.templateKey === template.key) {
    button.classList.add("is-active");
  }

  const top = document.createElement("div");
  top.className = "dashboard-template-card-top";

  const badge = document.createElement("span");
  badge.className = "dashboard-template-card-icon";
  badge.textContent = template.visualization === "metric"
    ? "KPI"
    : template.visualization === "donut"
      ? "Pie"
      : template.visualization === "bar"
        ? "Bar"
        : "List";

  const type = document.createElement("span");
  type.className = "dashboard-template-card-type";
  type.textContent = `${DASHBOARD_WIDGET_DEFINITIONS[template.source]?.label || "Dashboard"} · ${template.title}`;

  top.append(badge, type);

  const title = document.createElement("strong");
  title.className = "dashboard-template-card-title";
  title.textContent = template.title;

  const description = document.createElement("p");
  description.className = "dashboard-template-card-copy";
  description.textContent = template.description;

  const footer = document.createElement("div");
  footer.className = "dashboard-template-card-footer";
  footer.append(
    createDashboardChip(DASHBOARD_WIDGET_SOURCE_OPTIONS.find((option) => option.value === template.source)?.label || template.source, "soft"),
    createDashboardChip(DASHBOARD_WIDGET_SIZE_OPTIONS.find((option) => option.value === template.size)?.label || template.size, "filter"),
  );

  button.append(top, title, description, footer);
  button.addEventListener("click", () => {
    selectDashboardWidgetTemplate(template);
  });
  return button;
}

function renderDashboardWidgetTemplateGrid() {
  if (!dashboardWidgetTemplateGrid) {
    return;
  }

  const templates = getDashboardBuilderVisibleTemplates();

  if (templates.length === 0) {
    dashboardWidgetTemplateGrid.replaceChildren(
      createDashboardBuilderEmptyState("Nema predloska za trenutnu pretragu.", [
        createActionButton("Ocisti pretragu", "ghost-button", () => {
          state.dashboardBuilder.search = "";
          syncDashboardBuilderSearchInput();
          renderDashboardOverview();
        }),
      ]),
    );
    return;
  }

  dashboardWidgetTemplateGrid.replaceChildren(...templates.map((template) => createDashboardTemplateCard(template)));
}

function setDashboardWidgetError(message = "") {
  if (dashboardWidgetError) {
    dashboardWidgetError.textContent = message;
  }
}

function toggleDashboardField(field, isVisible) {
  if (field) {
    field.hidden = !isVisible;
  }
}

function readDashboardWidgetFormPatch() {
  const gridWidth = clampDashboardWidgetWidth(dashboardWidgetWidthInput?.value);
  const gridHeight = clampDashboardWidgetHeight(dashboardWidgetHeightInput?.value);

  return {
    title: dashboardWidgetTitleInput?.value ?? "",
    source: dashboardWidgetSourceInput?.value ?? "work_orders",
    visualization: dashboardWidgetVisualizationInput?.value ?? "metric",
    metricKey: dashboardWidgetMetricInput?.value ?? "",
    size: getDashboardWidgetSizeFromWidth(gridWidth),
    gridWidth,
    gridHeight,
    limit: Number.parseInt(dashboardWidgetLimitInput?.value ?? "6", 10) || 6,
    filters: {
      companyId: dashboardWidgetCompanyFilterInput?.value ?? "",
      status: dashboardWidgetStatusFilterInput?.value ?? "",
      priority: dashboardWidgetPriorityFilterInput?.value ?? "",
      region: dashboardWidgetRegionFilterInput?.value ?? "",
      executor: dashboardWidgetExecutorFilterInput?.value ?? "",
      assigneeUserId: dashboardWidgetAssigneeFilterInput?.value ?? "",
      dateWindow: dashboardWidgetDateWindowInput?.value ?? "all",
      tag: dashboardWidgetTagFilterInput?.value ?? "",
    },
  };
}

function createDashboardWidgetDraftFromForm() {
  const patch = readDashboardWidgetFormPatch();
  const current = getDashboardWidgetById(dashboardWidgetIdInput?.value ?? "");

  if (current) {
    return updateDashboardWidget(current, patch, state, () => new Date().toISOString());
  }

  return createDashboardWidget({
    ...patch,
    organizationId: state.activeOrganizationId,
    userId: state.user?.id,
    position: getDashboardWidgets().length + 1,
  }, state, () => "dashboard-preview", () => new Date().toISOString());
}

function syncDashboardWidgetFormOptions() {
  if (!dashboardWidgetVisualizationInput || !dashboardWidgetSourceInput || !dashboardWidgetMetricInput) {
    return;
  }

  const visualization = dashboardWidgetVisualizationInput.value || "metric";
  const source = dashboardWidgetSourceInput.value || "work_orders";
  const metricOptions = getDashboardMetricOptions(source, visualization);
  const currentMetric = dashboardWidgetMetricInput.value;

  replaceSelectOptions(dashboardWidgetMetricInput, metricOptions.map((option) => ({
    value: option.value,
    label: option.label,
  })), currentMetric || metricOptions[0]?.value || "");

  replaceSelectOptions(dashboardWidgetSizeInput, DASHBOARD_WIDGET_SIZE_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
  })), dashboardWidgetSizeInput?.value ?? "medium");

  replaceSelectOptions(dashboardWidgetWidthInput, Array.from({ length: DASHBOARD_GRID_COLUMN_COUNT - 2 }, (_, index) => {
    const value = String(index + 3);
    return {
      value,
      label: `${value} kolone`,
    };
  }), dashboardWidgetWidthInput?.value ?? "4");

  replaceSelectOptions(dashboardWidgetHeightInput, DASHBOARD_WIDGET_HEIGHT_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
  })), dashboardWidgetHeightInput?.value ?? "3");

  if (dashboardWidgetMetricLabel) {
    dashboardWidgetMetricLabel.textContent = visualization === "metric"
      ? "KPI"
      : visualization === "list"
        ? "Lista"
        : "Grupiraj po";
  }

  replaceSelectOptions(dashboardWidgetCompanyFilterInput, [
    { value: "", label: "Sve tvrtke" },
    ...state.companies.map((item) => ({ value: item.id, label: item.name })),
  ], dashboardWidgetCompanyFilterInput?.value ?? "");

  replaceSelectOptions(dashboardWidgetStatusFilterInput, [
    { value: "", label: "Svi statusi" },
    ...getDashboardStatusOptions(source).map((item) => ({ value: item.value, label: item.label })),
  ], dashboardWidgetStatusFilterInput?.value ?? "");

  replaceSelectOptions(dashboardWidgetPriorityFilterInput, [
    { value: "", label: "Svi prioriteti" },
    ...getDashboardPriorityOptions(source).map((item) => ({ value: item.value, label: item.label })),
  ], dashboardWidgetPriorityFilterInput?.value ?? "");

  replaceSelectOptions(dashboardWidgetRegionFilterInput, [
    { value: "", label: "Sve regije" },
    ...getDashboardRegionOptions().map((entry) => ({ value: entry, label: entry })),
  ], dashboardWidgetRegionFilterInput?.value ?? "");

  replaceSelectOptions(dashboardWidgetExecutorFilterInput, [
    { value: "", label: "Svi izvrsitelji" },
    ...getDashboardExecutorOptions().map((entry) => ({ value: entry, label: entry })),
  ], dashboardWidgetExecutorFilterInput?.value ?? "");

  replaceSelectOptions(dashboardWidgetAssigneeFilterInput, [
    { value: "", label: "Svi korisnici" },
    ...state.users.map((item) => ({ value: item.id, label: item.fullName || item.email || item.username || "User" })),
  ], dashboardWidgetAssigneeFilterInput?.value ?? "");

  replaceSelectOptions(dashboardWidgetDateWindowInput, DASHBOARD_WIDGET_DATE_WINDOW_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
  })), dashboardWidgetDateWindowInput?.value ?? "all");

  replaceSelectOptions(dashboardWidgetTagFilterInput, [
    { value: "", label: "Svi tagovi" },
    ...getDashboardTagOptions().map((entry) => ({ value: entry, label: entry })),
  ], dashboardWidgetTagFilterInput?.value ?? "");

  const companyField = dashboardWidgetCompanyFilterInput?.closest(".field");
  const statusField = dashboardWidgetStatusFilterInput?.closest(".field");
  const priorityField = dashboardWidgetPriorityFilterInput?.closest(".field");
  const regionField = dashboardWidgetRegionFilterInput?.closest(".field");
  const executorField = dashboardWidgetExecutorFilterInput?.closest(".field");
  const assigneeField = dashboardWidgetAssigneeFilterInput?.closest(".field");
  const dateWindowField = dashboardWidgetDateWindowInput?.closest(".field");
  const tagField = dashboardWidgetTagFilterInput?.closest(".field");
  const limitField = dashboardWidgetLimitInput?.closest(".field");

  toggleDashboardField(companyField, source !== "companies");
  toggleDashboardField(statusField, source !== "locations");
  toggleDashboardField(priorityField, source === "work_orders" || source === "todo_tasks");
  toggleDashboardField(regionField, source === "work_orders" || source === "locations");
  toggleDashboardField(executorField, source === "work_orders");
  toggleDashboardField(assigneeField, source === "todo_tasks");
  toggleDashboardField(dateWindowField, source !== "locations");
  toggleDashboardField(tagField, source === "work_orders");
  toggleDashboardField(limitField, visualization !== "metric");

  if (dashboardWidgetLimitInput) {
    dashboardWidgetLimitInput.disabled = visualization === "metric";
  }
}

function populateDashboardWidgetForm(widget = null) {
  if (!dashboardWidgetForm || !dashboardWidgetVisualizationInput || !dashboardWidgetSourceInput) {
    return;
  }

  const defaultLayout = getDashboardWidgetLayoutPreset(widget?.size ?? "medium");
  const draft = widget ?? {
    id: "",
    title: "",
    source: "work_orders",
    visualization: "metric",
    metricKey: "active",
    size: "medium",
    gridWidth: defaultLayout.gridWidth,
    gridHeight: defaultLayout.gridHeight,
    limit: 6,
    filters: {},
  };

  dashboardWidgetIdInput.value = draft.id ?? "";
  dashboardWidgetTitleInput.value = draft.title ?? "";
  replaceSelectOptions(dashboardWidgetVisualizationInput, DASHBOARD_WIDGET_VISUALIZATION_OPTIONS.map((item) => ({ value: item.value, label: item.label })), draft.visualization ?? "metric");
  replaceSelectOptions(dashboardWidgetSourceInput, DASHBOARD_WIDGET_SOURCE_OPTIONS.map((item) => ({ value: item.value, label: item.label })), draft.source ?? "work_orders");
  replaceSelectOptions(dashboardWidgetSizeInput, DASHBOARD_WIDGET_SIZE_OPTIONS.map((item) => ({ value: item.value, label: item.label })), draft.size ?? "medium");
  replaceSelectOptions(dashboardWidgetWidthInput, Array.from({ length: DASHBOARD_GRID_COLUMN_COUNT - 2 }, (_, index) => {
    const value = String(index + 3);
    return { value, label: `${value} kolone` };
  }), String(clampDashboardWidgetWidth(draft.gridWidth ?? defaultLayout.gridWidth)));
  replaceSelectOptions(dashboardWidgetHeightInput, DASHBOARD_WIDGET_HEIGHT_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
  })), String(clampDashboardWidgetHeight(draft.gridHeight ?? defaultLayout.gridHeight)));
  dashboardWidgetLimitInput.value = String(draft.limit ?? 6);
  syncDashboardWidgetFormOptions();
  dashboardWidgetMetricInput.value = draft.metricKey ?? dashboardWidgetMetricInput.value;
  dashboardWidgetCompanyFilterInput.value = draft.filters?.companyId ?? "";
  dashboardWidgetStatusFilterInput.value = draft.filters?.status ?? "";
  dashboardWidgetPriorityFilterInput.value = draft.filters?.priority ?? "";
  dashboardWidgetRegionFilterInput.value = draft.filters?.region ?? "";
  dashboardWidgetExecutorFilterInput.value = draft.filters?.executor ?? "";
  dashboardWidgetAssigneeFilterInput.value = draft.filters?.assigneeUserId ?? "";
  dashboardWidgetDateWindowInput.value = draft.filters?.dateWindow ?? "all";
  dashboardWidgetTagFilterInput.value = draft.filters?.tag ?? "";
}

function openDashboardBuilder(widget = null) {
  state.dashboardBuilder.open = true;
  state.dashboardBuilder.draftMode = widget ? "edit" : "create";
  state.dashboardBuilder.draftId = widget?.id ?? "";
  state.activeDashboardWidgetId = widget?.id ?? "";
  state.dashboardBuilder.category = widget?.source ?? "featured";
  state.dashboardBuilder.search = "";
  state.dashboardBuilder.templateKey = findMatchingDashboardTemplate(widget ?? {})?.key ?? "";
  setDashboardWidgetError("");

  if (dashboardBuilderTitle) {
    dashboardBuilderTitle.textContent = widget ? "Uredi karticu" : "Nova kartica";
  }

  if (dashboardBuilderCopy) {
    dashboardBuilderCopy.textContent = widget
      ? "Promijeni tip kartice, velicinu, filtre i raspored na dashboardu."
      : "Odaberi predlozak kao u ClickUp builderu, a zatim prilagodi filtre i layout.";
  }

  syncDashboardBuilderSearchInput();
  populateDashboardWidgetForm(widget ?? createDashboardTemplateDraft(getDashboardBuilderVisibleTemplates()[0] ?? DASHBOARD_WIDGET_TEMPLATES[0]));
}

function closeDashboardBuilder() {
  state.dashboardBuilder.open = false;
  state.dashboardBuilder.draftMode = "create";
  state.dashboardBuilder.draftId = "";
  state.dashboardBuilder.category = "featured";
  state.dashboardBuilder.search = "";
  state.dashboardBuilder.templateKey = "";
  state.activeDashboardWidgetId = "";
  setDashboardWidgetError("");
  syncDashboardBuilderSearchInput();
}

function createDashboardChip(label, tone = "neutral") {
  const chip = document.createElement("span");
  chip.className = `dashboard-widget-chip is-${tone}`;
  chip.textContent = label;
  return chip;
}

function getDashboardWidgetFilterChips(widget) {
  const filters = widget.filters ?? {};
  const chips = [];

  if (filters.companyId) {
    const company = state.companies.find((item) => String(item.id) === String(filters.companyId));
    chips.push(createDashboardChip(company?.name || "Tvrtka", "filter"));
  }

  if (filters.status) {
    chips.push(createDashboardChip(filters.status, "filter"));
  }

  if (filters.priority) {
    chips.push(createDashboardChip(filters.priority, "filter"));
  }

  if (filters.region) {
    chips.push(createDashboardChip(filters.region, "filter"));
  }

  if (filters.executor) {
    chips.push(createDashboardChip(filters.executor, "filter"));
  }

  if (filters.assigneeUserId) {
    const user = state.users.find((item) => String(item.id) === String(filters.assigneeUserId));
    chips.push(createDashboardChip(user?.fullName || user?.email || "Korisnik", "filter"));
  }

  if (filters.tag) {
    chips.push(createDashboardChip(filters.tag, "tag"));
  }

  if (filters.dateWindow && filters.dateWindow !== "all") {
    const label = DASHBOARD_WIDGET_DATE_WINDOW_OPTIONS.find((item) => item.value === filters.dateWindow)?.label;
    chips.push(createDashboardChip(label || filters.dateWindow, "filter"));
  }

  return chips;
}

function createDashboardDonut(data) {
  const shell = document.createElement("div");
  shell.className = "dashboard-chart-shell";
  const total = data.items.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    shell.append(createDashboardBuilderEmptyState(data.emptyMessage));
    return shell;
  }

  const chartWrap = document.createElement("div");
  chartWrap.className = "dashboard-donut-wrap";

  let offset = 0;
  const segments = data.items.map((item, index) => {
    const value = (item.count / total) * 100;
    const start = offset;
    offset += value;
    return `${DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length]} ${start}% ${offset}%`;
  });

  const donut = document.createElement("div");
  donut.className = "dashboard-donut-chart";
  donut.style.background = `conic-gradient(${segments.join(", ")})`;

  const center = document.createElement("div");
  center.className = "dashboard-donut-center";

  const centerValue = document.createElement("strong");
  centerValue.textContent = String(total);

  const centerLabel = document.createElement("span");
  centerLabel.textContent = "Zapisa";

  center.append(centerValue, centerLabel);
  donut.append(center);
  chartWrap.append(donut);

  const legend = document.createElement("div");
  legend.className = "dashboard-widget-legend";

  data.items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "dashboard-widget-legend-row";

    const copy = document.createElement("div");
    copy.className = "dashboard-widget-legend-copy";

    const dot = document.createElement("span");
    dot.className = "dashboard-widget-legend-dot";
    dot.style.background = DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length];

    const label = document.createElement("strong");
    label.textContent = item.label;

    copy.append(dot, label);

    const value = document.createElement("span");
    value.textContent = String(item.count);

    row.append(copy, value);
    legend.append(row);
  });

  shell.append(chartWrap, legend);
  return shell;
}

function createDashboardBarChart(data) {
  const shell = document.createElement("div");
  shell.className = "dashboard-chart-shell";

  if ((data.items ?? []).length === 0) {
    shell.append(createDashboardBuilderEmptyState(data.emptyMessage));
    return shell;
  }

  const maxValue = Math.max(...data.items.map((item) => item.count), 1);
  const chart = document.createElement("div");
  chart.className = "dashboard-bar-chart";

  data.items.forEach((item, index) => {
    const column = document.createElement("div");
    column.className = "dashboard-bar-column";

    const value = document.createElement("span");
    value.className = "dashboard-bar-value";
    value.textContent = String(item.count);

    const track = document.createElement("div");
    track.className = "dashboard-bar-track";

    const fill = document.createElement("span");
    fill.className = "dashboard-bar-fill";
    fill.style.height = `${Math.max(12, Math.round((item.count / maxValue) * 100))}%`;
    fill.style.background = DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length];

    track.append(fill);

    const label = document.createElement("span");
    label.className = "dashboard-bar-label";
    label.textContent = item.label;
    label.title = item.label;

    column.append(value, track, label);
    chart.append(column);
  });

  shell.append(chart);
  return shell;
}

function createDashboardList(data) {
  const list = document.createElement("div");
  list.className = "dashboard-widget-list";

  if ((data.items ?? []).length === 0) {
    list.append(createDashboardBuilderEmptyState(data.emptyMessage));
    return list;
  }

  data.items.forEach((item) => {
    const row = document.createElement(item.workOrderId ? "button" : "div");
    row.className = "dashboard-widget-list-row";

    if (row instanceof HTMLButtonElement) {
      row.type = "button";
      row.addEventListener("click", () => {
        const linked = state.workOrders.find((entry) => String(entry.id) === String(item.workOrderId));
        if (linked) {
          hydrateWorkOrderForm(linked);
        }
      });
    }

    const copy = document.createElement("div");
    copy.className = "dashboard-widget-list-copy";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const subtitle = document.createElement("span");
    subtitle.textContent = item.subtitle || "Bez detalja";

    copy.append(title, subtitle);

    const meta = document.createElement("div");
    meta.className = "dashboard-widget-list-meta";

    if (item.status) {
      meta.append(createDashboardChip(item.status, "soft"));
    }

    if (item.meta) {
      const date = document.createElement("span");
      date.className = "dashboard-widget-list-date";
      date.textContent = item.meta.includes("T") ? formatDateTime(item.meta) : formatDate(item.meta);
      meta.append(date);
    }

    row.append(copy, meta);
    list.append(row);
  });

  return list;
}

function createDashboardWidgetCard(widget, { preview = false } = {}) {
  const card = document.createElement("article");
  card.className = `dashboard-widget-card size-${widget.size}`;
  if (preview) {
    card.classList.add("is-preview");
  }

  const data = getDashboardWidgetData(state, widget, {
    userId: state.user?.id,
  });

  const head = document.createElement("div");
  head.className = "dashboard-widget-head";

  const copy = document.createElement("div");
  copy.className = "dashboard-widget-head-copy";

  const kicker = document.createElement("span");
  kicker.className = "dashboard-widget-kicker";
  kicker.textContent = `${data.sourceLabel} · ${data.optionLabel}`;

  const title = document.createElement("h3");
  title.textContent = widget.title;

  copy.append(kicker, title);

  const actions = document.createElement("div");
  actions.className = "dashboard-widget-actions";

  if (!preview) {
    const moveUp = createActionButton("↑", "card-button card-button-light dashboard-widget-action", async () => {
      await moveDashboardWidget(widget.id, -1);
    });
    const moveDown = createActionButton("↓", "card-button card-button-light dashboard-widget-action", async () => {
      await moveDashboardWidget(widget.id, 1);
    });
    const edit = createActionButton("Edit", "card-button card-button-light dashboard-widget-action", () => {
      openDashboardBuilder(widget);
      renderDashboardOverview();
    });
    actions.append(moveUp, moveDown, edit);
  } else {
    actions.append(createDashboardChip("Preview", "soft"));
  }

  head.append(copy, actions);

  const body = document.createElement("div");
  body.className = "dashboard-widget-body";

  if (data.kind === "metric") {
    const value = document.createElement("strong");
    value.className = "dashboard-widget-metric-value";
    value.textContent = String(data.value);

    const subtitle = document.createElement("span");
    subtitle.className = "dashboard-widget-metric-subtitle";
    subtitle.textContent = data.subtitle;

    body.append(value, subtitle);
  } else if (data.kind === "donut") {
    body.append(createDashboardDonut(data));
  } else if (data.kind === "bar") {
    body.append(createDashboardBarChart(data));
  } else {
    body.append(createDashboardList(data));
  }

  const footer = document.createElement("div");
  footer.className = "dashboard-widget-footer";
  footer.append(createDashboardChip(
    DASHBOARD_WIDGET_SIZE_OPTIONS.find((item) => item.value === widget.size)?.label || widget.size,
    "soft",
  ));
  footer.append(...getDashboardWidgetFilterChips(widget));

  card.append(head, body, footer);
  return card;
}

function renderDashboardWidgetPreview() {
  if (!dashboardWidgetPreview) {
    return;
  }

  if (!state.dashboardBuilder.open) {
    dashboardWidgetPreview.replaceChildren();
    return;
  }

  try {
    const draft = createDashboardWidgetDraftFromForm();
    dashboardWidgetPreview.replaceChildren(createDashboardWidgetCanvasCard(draft, { preview: true }));
  } catch (error) {
    dashboardWidgetPreview.replaceChildren(createDashboardBuilderEmptyState(error.message));
  }
}

async function moveDashboardWidget(widgetId, direction) {
  const widgets = getDashboardWidgets();
  const index = widgets.findIndex((item) => String(item.id) === String(widgetId));
  const current = widgets[index];
  const target = widgets[index + direction];

  if (!current || !target) {
    return;
  }

  await runMutation(async () => {
    await apiRequest(`/dashboard-widgets/${current.id}`, {
      method: "PATCH",
      body: { position: target.position },
    });

    return apiRequest(`/dashboard-widgets/${target.id}`, {
      method: "PATCH",
      body: { position: current.position },
    });
  }, dashboardWidgetError);
}

function getDashboardGridMetrics() {
  if (!dashboardWidgetGrid) {
    return null;
  }

  const styles = window.getComputedStyle(dashboardWidgetGrid);
  const rect = dashboardWidgetGrid.getBoundingClientRect();
  const columns = Number.parseInt(styles.getPropertyValue("--dashboard-grid-columns"), 10) || DASHBOARD_GRID_COLUMN_COUNT;
  const gap = Number.parseFloat(styles.columnGap || styles.gap || `${DASHBOARD_GRID_GAP_PX}`) || DASHBOARD_GRID_GAP_PX;
  const rowHeight = Number.parseFloat(styles.getPropertyValue("--dashboard-grid-row-height")) || 116;
  const availableWidth = rect.width - (gap * Math.max(0, columns - 1));
  const columnWidth = columns > 0 ? availableWidth / columns : rect.width;

  return {
    columns,
    columnWidth,
    gap,
    rowHeight,
    stepX: columnWidth + gap,
    stepY: rowHeight + gap,
  };
}

function applyDashboardWidgetCardGridStyle(card, {
  gridColumn = 1,
  gridRow = 1,
  gridWidth = 4,
  gridHeight = 3,
} = {}) {
  if (!card) {
    return;
  }

  card.style.gridColumn = `${Math.max(1, Number(gridColumn) || 1)} / span ${clampDashboardWidgetWidth(gridWidth)}`;
  card.style.gridRow = `${Math.max(1, Number(gridRow) || 1)} / span ${clampDashboardWidgetHeight(gridHeight)}`;
}

function clearDashboardWidgetInteraction({ revertLayout = true } = {}) {
  if (!dashboardWidgetLayoutInteraction) {
    return;
  }

  const interaction = dashboardWidgetLayoutInteraction;
  interaction.card.classList.remove("is-dragging", "is-resizing");
  interaction.card.style.removeProperty("transform");
  interaction.card.style.removeProperty("width");
  interaction.card.style.removeProperty("height");
  interaction.card.style.removeProperty("will-change");
  interaction.card.removeAttribute("data-layout-preview");
  interaction.card.releasePointerCapture?.(interaction.pointerId);
  document.body.classList.remove("is-dragging-dashboard-widget");

  if (revertLayout) {
    applyDashboardWidgetCardGridStyle(interaction.card, {
      gridColumn: interaction.startColumn,
      gridRow: interaction.startRow,
      gridWidth: interaction.startWidth,
      gridHeight: interaction.startHeight,
    });
  }

  dashboardWidgetLayoutInteraction = null;
}

function buildDashboardLayoutWidgets(widgetId, patch) {
  return applyDashboardWidgetGridLayout(getDashboardWidgets().map((item) => (
    String(item.id) === String(widgetId)
      ? updateDashboardWidget(item, patch, state, () => new Date().toISOString())
      : item
  )));
}

function getDashboardWidgetLayoutChanges(nextWidgets) {
  return nextWidgets.filter((widget) => {
    const current = getDashboardWidgetById(widget.id);

    if (!current) {
      return false;
    }

    return (
      Number(current.position ?? 0) !== Number(widget.position ?? 0)
      || Number(current.gridColumn ?? 1) !== Number(widget.gridColumn ?? 1)
      || Number(current.gridRow ?? 1) !== Number(widget.gridRow ?? 1)
      || clampDashboardWidgetWidth(current.gridWidth) !== clampDashboardWidgetWidth(widget.gridWidth)
      || clampDashboardWidgetHeight(current.gridHeight) !== clampDashboardWidgetHeight(widget.gridHeight)
      || current.size !== widget.size
    );
  });
}

async function persistDashboardWidgetLayout(nextWidgets, { optimistic = false } = {}) {
  const changedWidgets = getDashboardWidgetLayoutChanges(nextWidgets);

  if (changedWidgets.length === 0) {
    return true;
  }

  const previousWidgets = state.dashboardWidgets;

  if (optimistic) {
    state.dashboardWidgets = nextWidgets;
    renderDashboardOverview();
  }

  const success = await runMutation(async () => {
    let payload = null;

    for (const widget of changedWidgets) {
      payload = await apiRequest(`/dashboard-widgets/${widget.id}`, {
        method: "PATCH",
        body: {
          position: widget.position,
          size: widget.size,
          gridColumn: widget.gridColumn,
          gridRow: widget.gridRow,
          gridWidth: widget.gridWidth,
          gridHeight: widget.gridHeight,
        },
      });
    }

    return payload;
  }, dashboardWidgetError);

  if (!success && optimistic) {
    state.dashboardWidgets = previousWidgets;
    renderDashboardOverview();
    void refreshSnapshot().catch(() => {});
  }

  return success;
}

async function moveDashboardWidgetOnGrid(widgetId, deltaColumn, deltaRow) {
  const current = getDashboardWidgetById(widgetId);

  if (!current) {
    return;
  }

  const nextWidgets = buildDashboardLayoutWidgets(widgetId, {
    gridColumn: Math.max(1, Number(current.gridColumn ?? 1) + deltaColumn),
    gridRow: Math.max(1, Number(current.gridRow ?? 1) + deltaRow),
  });

  await persistDashboardWidgetLayout(nextWidgets);
}

async function resizeDashboardWidgetOnGrid(widgetId, deltaWidth, deltaHeight) {
  const current = getDashboardWidgetById(widgetId);

  if (!current) {
    return;
  }

  const nextWidth = clampDashboardWidgetWidth(Number(current.gridWidth ?? 4) + deltaWidth);
  const nextHeight = clampDashboardWidgetHeight(Number(current.gridHeight ?? 3) + deltaHeight);
  const nextWidgets = buildDashboardLayoutWidgets(widgetId, {
    size: getDashboardWidgetSizeFromWidth(nextWidth),
    gridWidth: nextWidth,
    gridHeight: nextHeight,
  });

  await persistDashboardWidgetLayout(nextWidgets);
}

function beginDashboardWidgetLayoutInteraction(mode, widget, card, event) {
  const metrics = getDashboardGridMetrics();

  if (!metrics || event.button !== 0) {
    return;
  }

  dashboardWidgetLayoutInteraction = {
    mode,
    widgetId: widget.id,
    card,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startColumn: Number(widget.gridColumn ?? 1),
    startRow: Number(widget.gridRow ?? 1),
    startWidth: clampDashboardWidgetWidth(widget.gridWidth),
    startHeight: clampDashboardWidgetHeight(widget.gridHeight),
    previewColumn: Number(widget.gridColumn ?? 1),
    previewRow: Number(widget.gridRow ?? 1),
    previewWidth: clampDashboardWidgetWidth(widget.gridWidth),
    previewHeight: clampDashboardWidgetHeight(widget.gridHeight),
    startPixelWidth: card.getBoundingClientRect().width,
    startPixelHeight: card.getBoundingClientRect().height,
    metrics,
  };

  card.classList.add(mode === "move" ? "is-dragging" : "is-resizing");
  card.style.willChange = mode === "move" ? "transform" : "width, height";
  card.setPointerCapture?.(event.pointerId);
  document.body.classList.add("is-dragging-dashboard-widget");
  event.preventDefault();
  event.stopPropagation();
}

function updateDashboardWidgetLayoutInteraction(event) {
  if (!dashboardWidgetLayoutInteraction) {
    return;
  }

  const interaction = dashboardWidgetLayoutInteraction;
  const deltaX = event.clientX - interaction.startX;
  const deltaY = event.clientY - interaction.startY;
  const deltaColumns = Math.round(deltaX / interaction.metrics.stepX);
  const deltaRows = Math.round(deltaY / interaction.metrics.stepY);

  if (interaction.mode === "move") {
    interaction.previewColumn = Math.max(1, interaction.startColumn + deltaColumns);
    interaction.previewRow = Math.max(1, interaction.startRow + deltaRows);
    interaction.card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    interaction.card.dataset.layoutPreview = `${interaction.previewColumn}:${interaction.previewRow}`;
    return;
  }

  interaction.previewWidth = clampDashboardWidgetWidth(interaction.startWidth + deltaColumns);
  interaction.previewHeight = clampDashboardWidgetHeight(interaction.startHeight + deltaRows);
  interaction.card.style.width = `${Math.max(interaction.metrics.columnWidth, interaction.startPixelWidth + deltaX)}px`;
  interaction.card.style.height = `${Math.max(interaction.metrics.rowHeight, interaction.startPixelHeight + deltaY)}px`;
  interaction.card.dataset.layoutPreview = `${interaction.previewWidth}x${interaction.previewHeight}`;
}

function commitDashboardWidgetLayoutInteraction() {
  if (!dashboardWidgetLayoutInteraction) {
    return;
  }

  const interaction = dashboardWidgetLayoutInteraction;
  const nextWidgets = interaction.mode === "move"
    ? buildDashboardLayoutWidgets(interaction.widgetId, {
      gridColumn: interaction.previewColumn,
      gridRow: interaction.previewRow,
    })
    : buildDashboardLayoutWidgets(interaction.widgetId, {
      size: getDashboardWidgetSizeFromWidth(interaction.previewWidth),
      gridWidth: interaction.previewWidth,
      gridHeight: interaction.previewHeight,
    });
  const hasChanges = getDashboardWidgetLayoutChanges(nextWidgets).length > 0;

  clearDashboardWidgetInteraction({ revertLayout: !hasChanges });

  if (!hasChanges) {
    return;
  }

  void persistDashboardWidgetLayout(nextWidgets, { optimistic: true });
}

function createDashboardWidgetCanvasCard(widget, { preview = false } = {}) {
  const card = document.createElement("article");
  card.className = `dashboard-widget-card size-${widget.size}`;
  applyDashboardWidgetCardGridStyle(card, {
    gridColumn: Number(widget.gridColumn ?? 1),
    gridRow: Number(widget.gridRow ?? 1),
    gridWidth: clampDashboardWidgetWidth(widget.gridWidth),
    gridHeight: clampDashboardWidgetHeight(widget.gridHeight),
  });
  card.dataset.widgetId = widget.id;

  if (preview) {
    card.classList.add("is-preview");
  }

  const data = getDashboardWidgetData(state, widget, {
    userId: state.user?.id,
  });

  const head = document.createElement("div");
  head.className = "dashboard-widget-head";

  const copy = document.createElement("div");
  copy.className = "dashboard-widget-head-copy";

  const kicker = document.createElement("span");
  kicker.className = "dashboard-widget-kicker";
  kicker.textContent = `${data.sourceLabel} · ${data.optionLabel}`;

  const title = document.createElement("h3");
  title.textContent = widget.title;
  copy.append(kicker, title);

  const actions = document.createElement("div");
  actions.className = "dashboard-widget-actions";

  if (!preview) {
    const dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "card-button card-button-light dashboard-widget-action dashboard-widget-drag-handle";
    dragHandle.title = "Povuci za premjestanje";
    dragHandle.textContent = "⋮⋮";
    dragHandle.addEventListener("pointerdown", (event) => {
      beginDashboardWidgetLayoutInteraction("move", widget, card, event);
    });

    const edit = createActionButton("Edit", "card-button card-button-light dashboard-widget-action", () => {
      openDashboardBuilder(widget);
      renderDashboardOverview();
    });

    actions.append(
      createDashboardChip(`${clampDashboardWidgetWidth(widget.gridWidth)} × ${clampDashboardWidgetHeight(widget.gridHeight)}`, "soft"),
      dragHandle,
      edit,
    );
  } else {
    actions.append(createDashboardChip("Preview", "soft"));
  }

  head.append(copy, actions);

  const body = document.createElement("div");
  body.className = "dashboard-widget-body";

  if (data.kind === "metric") {
    const value = document.createElement("strong");
    value.className = "dashboard-widget-metric-value";
    value.textContent = String(data.value);

    const subtitle = document.createElement("span");
    subtitle.className = "dashboard-widget-metric-subtitle";
    subtitle.textContent = data.subtitle;

    body.append(value, subtitle);
  } else if (data.kind === "donut") {
    body.append(createDashboardDonut(data));
  } else if (data.kind === "bar") {
    body.append(createDashboardBarChart(data));
  } else {
    body.append(createDashboardList(data));
  }

  const footer = document.createElement("div");
  footer.className = "dashboard-widget-footer";
  footer.append(createDashboardChip(
    DASHBOARD_WIDGET_SIZE_OPTIONS.find((item) => item.value === widget.size)?.label || widget.size,
    "soft",
  ));
  footer.append(createDashboardChip(`${clampDashboardWidgetWidth(widget.gridWidth)} kol.`, "soft"));
  footer.append(...getDashboardWidgetFilterChips(widget));

  card.append(head, body, footer);

  if (!preview) {
    const resizeHandle = document.createElement("button");
    resizeHandle.type = "button";
    resizeHandle.className = "dashboard-widget-resize-handle";
    resizeHandle.title = "Povuci za promjenu velicine";
    resizeHandle.setAttribute("aria-label", "Promijeni velicinu kartice");
    resizeHandle.addEventListener("pointerdown", (event) => {
      beginDashboardWidgetLayoutInteraction("resize", widget, card, event);
    });
    card.append(resizeHandle);
  }

  return card;
}

async function createSuggestedDashboardLayout() {
  if (state.dashboardBuilder.seeding) {
    return;
  }

  state.dashboardBuilder.seeding = true;
  setDashboardWidgetError("");
  renderDashboardOverview();

  try {
    let payload = null;

    for (const widget of getSuggestedDashboardWidgetDrafts()) {
      payload = await apiRequest("/dashboard-widgets", {
        method: "POST",
        body: widget,
      });
    }

    if (payload) {
      applySnapshot(payload);
    }
  } catch (error) {
    setDashboardWidgetError(error.message);
  } finally {
    state.dashboardBuilder.seeding = false;
    renderDashboardOverview();
  }
}

function renderDashboardWidgetGrid() {
  if (!dashboardWidgetGrid || !dashboardWidgetEmpty) {
    return;
  }

  const widgets = getDashboardWidgets();

  if (widgets.length === 0) {
    dashboardWidgetGrid.replaceChildren();
    dashboardWidgetEmpty.hidden = false;
    dashboardWidgetEmpty.replaceChildren(createDashboardBuilderEmptyState(
      "Dashboard je prazan. Dodaj svoju prvu karticu ili koristi predlozeni raspored.",
      [
        createActionButton("+ Add card", "primary-button", () => {
          openDashboardBuilder();
          renderDashboardOverview();
        }),
        createActionButton("Starter layout", "ghost-button", () => {
          void createSuggestedDashboardLayout();
        }),
      ],
    ));
    return;
  }

  dashboardWidgetEmpty.hidden = true;
  dashboardWidgetGrid.replaceChildren(...widgets.map((widget) => createDashboardWidgetCanvasCard(widget)));
}

function renderDashboardOverview() {
  const shouldShowDashboard = Boolean(
    dashboardOverviewPanel
    && state.user
    && state.activeView === "selfdash"
    && state.activeSidebarItem === "dashboard",
  );

  if (!dashboardOverviewPanel) {
    return;
  }

  dashboardOverviewPanel.hidden = !shouldShowDashboard;

  if (dashboardWorkOrdersPanel) {
    dashboardWorkOrdersPanel.hidden = state.activeView === "selfdash" && state.activeSidebarItem === "dashboard";
  }

  if (!shouldShowDashboard) {
    document.body.classList.remove("is-dashboard-builder-open");
    return;
  }

  renderDashboardInsightsSummary();

  if (dashboardSeedLayoutButton) {
    dashboardSeedLayoutButton.hidden = getDashboardWidgets().length > 0;
    dashboardSeedLayoutButton.disabled = state.dashboardBuilder.seeding;
    dashboardSeedLayoutButton.textContent = state.dashboardBuilder.seeding ? "Slazem..." : "Starter layout";
  }

  if (dashboardAddWidgetButton) {
    dashboardAddWidgetButton.disabled = !state.activeOrganizationId;
  }

  if (dashboardBuilderPanel) {
    dashboardBuilderPanel.hidden = !state.dashboardBuilder.open;
  }

  document.body.classList.toggle("is-dashboard-builder-open", shouldShowDashboard && state.dashboardBuilder.open);

  if (dashboardWidgetDeleteButton) {
    dashboardWidgetDeleteButton.hidden = !(dashboardWidgetIdInput?.value ?? "");
  }

  dashboardOverviewPanel.classList.toggle("has-builder-open", state.dashboardBuilder.open);
  if (state.dashboardBuilder.open) {
    syncDashboardBuilderSearchInput();
    renderDashboardWidgetCategoryList();
    renderDashboardWidgetTemplateGrid();
    syncDashboardWidgetFormOptions();
  }
  renderDashboardWidgetGrid();
  renderDashboardWidgetPreview();
}

function getReminderById(reminderId) {
  return state.reminders.find((item) => String(item.id) === String(reminderId)) ?? null;
}

function getReminderLinkedWorkOrder(reminder) {
  if (!reminder?.workOrderId) {
    return null;
  }

  return state.workOrders.find((item) => String(item.id) === String(reminder.workOrderId)) ?? null;
}

function isReminderOverdue(reminder) {
  return Boolean(
    reminder?.dueDate
    && reminder.status !== "done"
    && reminder.dueDate < new Date().toISOString().slice(0, 10),
  );
}

function getFilteredReminders() {
  return sortReminders(filterReminders(state.reminders, {
    query: remindersSearchInput?.value ?? "",
    status: remindersFilterStatusInput?.value ?? "all",
  }));
}

function rebuildReminderWorkOrderOptions(selectedValue = "") {
  if (!reminderWorkOrderIdInput) {
    return;
  }

  const options = [
    { value: "", label: "Bez vezanog RN" },
    ...sortWorkOrders(state.workOrders).map((item) => ({
      value: item.id,
      label: `${item.workOrderNumber} · ${item.companyName || item.locationName || "RN"}`,
    })),
  ];

  replaceSelectOptions(reminderWorkOrderIdInput, options, selectedValue || "");
}

function rebuildReminderCompanyOptions(selectedValue = "") {
  if (!reminderCompanyIdInput) {
    return;
  }

  const options = [
    { value: "", label: "Opci reminder" },
    ...state.companies
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "hr"))
      .map((company) => ({
        value: company.id,
        label: company.name,
      })),
  ];

  replaceSelectOptions(reminderCompanyIdInput, options, selectedValue || "");
}

function syncReminderContextFromWorkOrder() {
  const linkedWorkOrder = state.workOrders.find((item) => item.id === reminderWorkOrderIdInput?.value);

  if (linkedWorkOrder && reminderCompanyIdInput) {
    reminderCompanyIdInput.value = linkedWorkOrder.companyId || "";
    reminderCompanyIdInput.disabled = true;
  } else if (reminderCompanyIdInput) {
    reminderCompanyIdInput.disabled = false;
  }

  renderReminderLinkPreview();
}

function renderReminderLinkPreview() {
  if (!reminderLinkPreview) {
    return;
  }

  const linkedWorkOrder = state.workOrders.find((item) => item.id === reminderWorkOrderIdInput?.value);
  const company = getCompany(reminderCompanyIdInput?.value || linkedWorkOrder?.companyId || "");
  const parts = [];

  if (linkedWorkOrder?.workOrderNumber) {
    parts.push(`RN ${linkedWorkOrder.workOrderNumber}`);
  }

  if (company?.name) {
    parts.push(company.name);
  }

  if (linkedWorkOrder?.locationName) {
    parts.push(linkedWorkOrder.locationName);
  }

  reminderLinkPreview.hidden = parts.length === 0;
  reminderLinkPreview.textContent = parts.join(" · ");
}

function buildReminderPayload() {
  const linkedWorkOrder = state.workOrders.find((item) => item.id === reminderWorkOrderIdInput.value);

  return {
    title: reminderTitleInput.value,
    dueDate: reminderDueDateInput.value,
    status: reminderStatusInput.value,
    workOrderId: reminderWorkOrderIdInput.value,
    companyId: linkedWorkOrder?.companyId || reminderCompanyIdInput.value,
    locationId: linkedWorkOrder?.locationId || "",
    note: reminderNoteInput.value,
  };
}

function resetReminderForm() {
  reminderForm?.reset();

  if (reminderIdInput) {
    reminderIdInput.value = "";
  }

  if (reminderStatusInput) {
    reminderStatusInput.value = "active";
  }

  if (reminderCompanyIdInput) {
    reminderCompanyIdInput.disabled = false;
  }

  if (reminderError) {
    reminderError.textContent = "";
  }

  renderReminderLinkPreview();
}

function hydrateReminderForm(reminder) {
  state.activeView = "reminders";
  state.activeSidebarGroup = "home";
  state.activeSidebarItem = "reminders";
  renderActiveView();

  reminderIdInput.value = reminder.id;
  reminderTitleInput.value = reminder.title || "";
  reminderDueDateInput.value = reminder.dueDate || "";
  reminderStatusInput.value = reminder.status || "active";
  rebuildReminderWorkOrderOptions(reminder.workOrderId || "");
  rebuildReminderCompanyOptions(reminder.companyId || "");
  reminderCompanyIdInput.value = reminder.companyId || "";
  reminderNoteInput.value = reminder.note || "";
  syncReminderContextFromWorkOrder();
  reminderTitleInput.focus({ preventScroll: true });
}

function openReminderComposerForWorkOrder(workOrder = null) {
  state.activeView = "reminders";
  state.activeSidebarGroup = "home";
  state.activeSidebarItem = "reminders";
  renderActiveView();
  resetReminderForm();

  if (workOrder) {
    reminderTitleInput.value = `Podsjetnik za ${workOrder.workOrderNumber}`;
    reminderDueDateInput.value = workOrder.dueDate || workOrder.openedDate || "";
    rebuildReminderWorkOrderOptions(workOrder.id);
    reminderWorkOrderIdInput.value = workOrder.id;
    rebuildReminderCompanyOptions(workOrder.companyId || "");
    reminderCompanyIdInput.value = workOrder.companyId || "";
  }

  syncReminderContextFromWorkOrder();
  reminderTitleInput.focus({ preventScroll: true });
}

function createReminderStatusBadge(status) {
  const option = REMINDER_STATUS_OPTIONS.find((item) => item.value === status);
  const label = option?.label ?? status ?? "Aktivan";
  const badge = document.createElement("span");
  badge.className = `reminder-status-badge is-${status || "active"}`;
  badge.textContent = label;
  return badge;
}

function renderReminderSummary() {
  const reminders = state.reminders;
  const today = new Date().toISOString().slice(0, 10);

  if (remindersTotalCount) {
    remindersTotalCount.textContent = String(reminders.length);
  }

  if (remindersTodayCount) {
    remindersTodayCount.textContent = String(reminders.filter((item) => item.dueDate === today).length);
  }

  if (remindersOverdueCount) {
    remindersOverdueCount.textContent = String(reminders.filter((item) => isReminderOverdue(item)).length);
  }

  if (remindersDoneCount) {
    remindersDoneCount.textContent = String(reminders.filter((item) => item.status === "done").length);
  }
}

function renderReminders() {
  renderReminderSummary();

  if (!remindersBody) {
    return;
  }

  const reminders = getFilteredReminders();
  remindersBody.replaceChildren(...reminders.map((reminder) => {
    const linkedWorkOrder = getReminderLinkedWorkOrder(reminder);
    const card = document.createElement("article");
    card.className = "reminder-card";

    const top = document.createElement("div");
    top.className = "reminder-card-top";
    const copy = document.createElement("div");
    copy.className = "reminder-card-copy";
    const title = document.createElement("strong");
    title.className = "reminder-card-title";
    title.textContent = reminder.title;
    const subtitle = document.createElement("span");
    subtitle.className = "reminder-card-subtitle";
    subtitle.textContent = [
      reminder.workOrderNumber ? `RN ${reminder.workOrderNumber}` : "",
      reminder.companyName || "",
      reminder.locationName || "",
    ].filter(Boolean).join(" · ") || "Opci reminder";
    copy.append(title, subtitle);

    const meta = document.createElement("div");
    meta.className = "reminder-card-meta";
    meta.append(createReminderStatusBadge(reminder.status));

    const due = document.createElement("span");
    due.className = `reminder-due-pill${isReminderOverdue(reminder) ? " is-overdue" : ""}`;
    due.textContent = reminder.dueDate ? formatCompactDate(reminder.dueDate) : "Bez datuma";
    meta.append(due);

    top.append(copy, meta);

    const note = document.createElement("p");
    note.className = "reminder-card-note";
    note.textContent = reminder.note || "Bez dodatne biljeske.";

    const footer = document.createElement("div");
    footer.className = "reminder-card-footer";

    const footerMeta = document.createElement("div");
    footerMeta.className = "reminder-card-footer-meta";
    footerMeta.textContent = reminder.createdByLabel
      ? `Kreirao ${reminder.createdByLabel}${reminder.createdAt ? ` · ${formatDateTime(reminder.createdAt)}` : ""}`
      : (reminder.createdAt ? formatDateTime(reminder.createdAt) : "");

    const actions = document.createElement("div");
    actions.className = "reminder-card-actions";

    if (linkedWorkOrder) {
      actions.append(createActionButton("Otvori RN", "ghost-button reminder-inline-action", () => {
        hydrateWorkOrderForm(linkedWorkOrder);
      }));
    }

    actions.append(
      createActionButton(reminder.status === "done" ? "Vrati aktivno" : "Oznaci gotovo", "ghost-button reminder-inline-action", () => {
        void runMutation(() => apiRequest(`/reminders/${reminder.id}`, {
          method: "PATCH",
          body: {
            status: reminder.status === "done" ? "active" : "done",
          },
        }), reminderError);
      }),
      createActionButton("Uredi", "ghost-button reminder-inline-action", () => {
        hydrateReminderForm(reminder);
      }),
      createActionButton("Obrisi", "ghost-button reminder-inline-action is-danger", () => {
        if (!window.confirm(`Obrisati reminder "${reminder.title}"?`)) {
          return;
        }

        void runMutation(() => apiRequest(`/reminders/${reminder.id}`, {
          method: "DELETE",
        }), reminderError).then((success) => {
          if (success && reminderIdInput.value === reminder.id) {
            resetReminderForm();
          }
        });
      }),
    );

    footer.append(footerMeta, actions);
    card.append(top, note, footer);
    return card;
  }));

  remindersEmpty.hidden = reminders.length !== 0;
}

function getTodoTaskById(taskId = state.activeTodoTaskId) {
  return state.todoTasks.find((item) => String(item.id) === String(taskId)) ?? null;
}

function getLinkedTodoWorkOrder(task) {
  if (!task?.workOrderId) {
    return null;
  }

  return state.workOrders.find((item) => item.id === task.workOrderId) ?? null;
}

function isTodoTaskOverdue(task) {
  if (!task?.dueDate || task.status === "done") {
    return false;
  }

  return task.dueDate < new Date().toISOString().slice(0, 10);
}

function getTodoAssigneeOptions() {
  return [
    { value: "", label: "Bez izvrsitelja" },
    ...[...state.users]
      .filter((user) => user?.isActive !== false)
      .sort((left, right) => String(left.fullName || left.email).localeCompare(String(right.fullName || right.email)))
      .map((user) => ({
        value: user.id,
        label: user.fullName || user.email || user.username || "User",
      })),
  ];
}

function getFilteredTodoTasks() {
  return sortTodoTasks(filterTodoTasks(state.todoTasks, {
    query: todoSearchInput?.value ?? "",
    status: todoFilterStatusInput?.value ?? "all",
    scope: todoFilterScopeInput?.value ?? "assigned",
    userId: state.user?.id ?? "",
  }));
}

function rebuildTodoAssigneeOptions(selectedValue = "") {
  if (!todoAssigneeInput) {
    return;
  }

  replaceSelectOptions(todoAssigneeInput, getTodoAssigneeOptions(), selectedValue || "");
}

function rebuildTodoDetailAssigneeOptions(selectedValue = "") {
  if (!todoDetailAssignee) {
    return;
  }

  replaceSelectOptions(todoDetailAssignee, getTodoAssigneeOptions(), selectedValue || "");
}

function rebuildTodoWorkOrderOptions(selectedValue = "") {
  if (!todoWorkOrderIdInput) {
    return;
  }

  const options = [
    { value: "", label: "Bez vezanog RN" },
    ...sortWorkOrders(state.workOrders).map((item) => ({
      value: item.id,
      label: `${item.workOrderNumber} · ${item.companyName || item.locationName || "RN"}`,
    })),
  ];

  replaceSelectOptions(todoWorkOrderIdInput, options, selectedValue || "");
}

function renderTodoLinkPreview() {
  if (!todoLinkPreview) {
    return;
  }

  const linkedWorkOrder = state.workOrders.find((item) => item.id === todoWorkOrderIdInput?.value);

  if (!linkedWorkOrder) {
    todoLinkPreview.hidden = true;
    todoLinkPreview.textContent = "";
    return;
  }

  todoLinkPreview.hidden = false;
  todoLinkPreview.textContent = [
    linkedWorkOrder.workOrderNumber,
    linkedWorkOrder.companyName,
    linkedWorkOrder.locationName,
  ].filter(Boolean).join(" · ");
}

function buildTodoTaskPayload() {
  const linkedWorkOrder = state.workOrders.find((item) => item.id === todoWorkOrderIdInput.value) ?? null;

  return {
    title: todoTitleInput.value,
    assignedToUserId: todoAssigneeInput.value,
    dueDate: todoDueDateInput.value,
    status: todoStatusInput.value,
    priority: todoPriorityInput.value,
    workOrderId: todoWorkOrderIdInput.value,
    companyId: linkedWorkOrder?.companyId ?? "",
    locationId: linkedWorkOrder?.locationId ?? "",
    message: todoMessageInput.value,
  };
}

function resetTodoForm() {
  if (!todoForm) {
    return;
  }

  todoIdInput.value = "";
  todoTitleInput.value = "";
  todoDueDateInput.value = "";
  todoStatusInput.value = "open";
  todoPriorityInput.value = "Normal";
  rebuildTodoAssigneeOptions("");
  rebuildTodoWorkOrderOptions("");
  todoWorkOrderIdInput.value = "";
  todoMessageInput.value = "";

  if (todoError) {
    todoError.textContent = "";
  }

  renderTodoLinkPreview();
}

function hydrateTodoTaskForm(task) {
  state.activeView = "todo";
  state.activeSidebarGroup = "home";
  state.activeSidebarItem = "todo";
  state.activeTodoTaskId = task.id;
  renderActiveView();

  todoIdInput.value = task.id;
  todoTitleInput.value = task.title || "";
  todoDueDateInput.value = task.dueDate || "";
  todoStatusInput.value = task.status || "open";
  todoPriorityInput.value = task.priority || "Normal";
  rebuildTodoAssigneeOptions(task.assignedToUserId || "");
  todoAssigneeInput.value = task.assignedToUserId || "";
  rebuildTodoWorkOrderOptions(task.workOrderId || "");
  todoWorkOrderIdInput.value = task.workOrderId || "";
  todoMessageInput.value = task.message || "";
  renderTodoLinkPreview();
  todoTitleInput.focus({ preventScroll: true });
}

function openTodoComposerForWorkOrder(workOrder = null) {
  state.activeView = "todo";
  state.activeSidebarGroup = "home";
  state.activeSidebarItem = "todo";
  renderActiveView();
  resetTodoForm();

  if (workOrder) {
    todoTitleInput.value = `Zadatak za ${workOrder.workOrderNumber}`;
    todoDueDateInput.value = workOrder.dueDate || workOrder.openedDate || "";
    rebuildTodoWorkOrderOptions(workOrder.id);
    todoWorkOrderIdInput.value = workOrder.id;
    todoMessageInput.value = `${workOrder.companyName || "Klijent"} · ${workOrder.locationName || "Lokacija"}`;
  }

  renderTodoLinkPreview();
  todoTitleInput.focus({ preventScroll: true });
}

function createTodoTaskStatusBadge(task) {
  const label = getOptionLabel(TODO_TASK_STATUS_OPTIONS, task.status || "open");
  const badge = document.createElement("span");
  badge.className = `todo-task-status-badge is-${task.status || "open"}`;
  badge.textContent = label;
  return badge;
}

function createTodoTaskPriorityBadge(priority = "Normal") {
  const badge = document.createElement("span");
  badge.className = `todo-task-priority-badge ${priorityBadgeClass(priority)}`;
  badge.textContent = getOptionLabel(PRIORITY_OPTIONS, priority);
  return badge;
}

function selectTodoTask(taskId) {
  state.activeTodoTaskId = String(taskId ?? "");
  renderTodo();
}

function renderTodoSummary() {
  if (!todoTotalCount || !todoAssignedCount || !todoCreatedCount || !todoOverdueCount) {
    return;
  }

  const userId = String(state.user?.id ?? "");
  todoTotalCount.textContent = String(state.todoTasks.length);
  todoAssignedCount.textContent = String(state.todoTasks.filter((item) => String(item.assignedToUserId) === userId && item.status !== "done").length);
  todoCreatedCount.textContent = String(state.todoTasks.filter((item) => String(item.createdByUserId) === userId).length);
  todoOverdueCount.textContent = String(state.todoTasks.filter((item) => isTodoTaskOverdue(item)).length);
}

function renderTodoList() {
  if (!todoBody) {
    return;
  }

  const tasks = getFilteredTodoTasks();

  if (tasks.length > 0 && !tasks.some((item) => String(item.id) === String(state.activeTodoTaskId))) {
    state.activeTodoTaskId = tasks[0].id;
  }

  if (tasks.length === 0) {
    state.activeTodoTaskId = "";
  }

  todoBody.replaceChildren(...tasks.map((task) => {
    const card = document.createElement("article");
    card.className = "todo-task-card";
    card.classList.toggle("is-active", String(task.id) === String(state.activeTodoTaskId));
    card.tabIndex = 0;
    card.addEventListener("click", () => {
      selectTodoTask(task.id);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectTodoTask(task.id);
      }
    });

    const head = document.createElement("div");
    head.className = "todo-task-card-head";
    const copy = document.createElement("div");
    copy.className = "todo-task-card-copy";
    const title = document.createElement("strong");
    title.className = "todo-task-card-title";
    title.textContent = task.title;
    const subtitle = document.createElement("span");
    subtitle.className = "todo-task-card-subtitle";
    subtitle.textContent = [
      task.assignedToLabel ? `Za ${task.assignedToLabel}` : "Bez izvrsitelja",
      task.createdByLabel ? `od ${task.createdByLabel}` : "",
    ].filter(Boolean).join(" · ");
    copy.append(title, subtitle);

    const badges = document.createElement("div");
    badges.className = "todo-task-card-badges";
    badges.append(createTodoTaskStatusBadge(task), createTodoTaskPriorityBadge(task.priority));
    head.append(copy, badges);

    const message = document.createElement("p");
    message.className = "todo-task-card-message";
    message.textContent = task.message || "Bez dodatne poruke.";

    const meta = document.createElement("div");
    meta.className = "todo-task-card-meta";

    if (task.workOrderNumber) {
      meta.append(createMetaPill(`RN ${task.workOrderNumber}`, "is-neutral"));
    }

    if (task.companyName) {
      meta.append(createMetaPill(task.companyName, "is-soft"));
    }

    meta.append(createMetaPill(
      task.dueDate ? formatCompactDate(task.dueDate) : "Bez roka",
      isTodoTaskOverdue(task) ? "is-danger" : "is-soft",
    ));
    meta.append(createMetaPill(`${task.commentCount ?? task.comments?.length ?? 0} komentara`, "is-soft"));

    card.append(head, message, meta);
    return card;
  }));

  if (todoEmpty) {
    todoEmpty.hidden = tasks.length !== 0;
  }
}

function renderTodoDetail() {
  if (!todoDetailPanel || !todoDetailEmpty || !todoDetailContent) {
    return;
  }

  const task = getTodoTaskById();

  todoDetailEmpty.hidden = Boolean(task);
  todoDetailContent.hidden = !task;

  if (!task) {
    if (todoCommentsBody) {
      todoCommentsBody.replaceChildren();
    }

    if (todoCommentsEmpty) {
      todoCommentsEmpty.hidden = false;
    }

    return;
  }

  if (todoDetailTitle) {
    todoDetailTitle.textContent = task.title;
  }

  if (todoDetailMeta) {
    const lines = [
      task.assignedToLabel ? `Za ${task.assignedToLabel}` : "Bez izvrsitelja",
      task.createdByLabel ? `Poslao ${task.createdByLabel}` : "",
      task.createdAt ? formatDateTime(task.createdAt) : "",
    ].filter(Boolean);
    todoDetailMeta.textContent = lines.join(" · ");
  }

  if (todoDetailMessage) {
    todoDetailMessage.textContent = task.message || "Bez dodatne poruke.";
  }

  if (todoDetailStatus) {
    replaceSelectOptions(todoDetailStatus, TODO_TASK_STATUS_OPTIONS, task.status || "open");
    todoDetailStatus.value = task.status || "open";
    todoDetailStatus.dataset.taskId = task.id;
  }

  if (todoDetailPriority) {
    replaceSelectOptions(todoDetailPriority, PRIORITY_OPTIONS, task.priority || "Normal");
    todoDetailPriority.value = task.priority || "Normal";
    todoDetailPriority.dataset.taskId = task.id;
  }

  if (todoDetailAssignee) {
    rebuildTodoDetailAssigneeOptions(task.assignedToUserId || "");
    todoDetailAssignee.value = task.assignedToUserId || "";
    todoDetailAssignee.dataset.taskId = task.id;
  }

  if (todoDetailDueDate) {
    todoDetailDueDate.value = task.dueDate || "";
    todoDetailDueDate.dataset.taskId = task.id;
  }

  if (todoDetailOpenWorkOrder) {
    const linkedWorkOrder = getLinkedTodoWorkOrder(task);
    todoDetailOpenWorkOrder.hidden = !linkedWorkOrder;
    todoDetailOpenWorkOrder.onclick = linkedWorkOrder
      ? (() => {
        hydrateWorkOrderForm(linkedWorkOrder);
      })
      : null;
  }

  if (todoDetailEdit) {
    todoDetailEdit.onclick = () => {
      hydrateTodoTaskForm(task);
    };
  }

  if (todoDetailDelete) {
    todoDetailDelete.onclick = () => {
      if (!window.confirm(`Obrisati zadatak "${task.title}"?`)) {
        return;
      }

      void runMutation(() => apiRequest(`/todo-tasks/${task.id}`, {
        method: "DELETE",
      }), todoCommentError).then((success) => {
        if (success) {
          state.activeTodoTaskId = getFilteredTodoTasks()[0]?.id ?? "";
        }
      });
    };
  }

  if (todoCommentsBody) {
    todoCommentsBody.replaceChildren(...(task.comments ?? []).map((comment) => {
      const article = document.createElement("article");
      article.className = "todo-comment";

      const avatar = document.createElement("span");
      avatar.className = "todo-comment-avatar";
      avatar.textContent = getUserInitials({ fullName: comment.authorLabel });

      const content = document.createElement("div");
      content.className = "todo-comment-content";

      const top = document.createElement("div");
      top.className = "todo-comment-top";
      const author = document.createElement("strong");
      author.textContent = comment.authorLabel || "Safety360";
      const time = document.createElement("span");
      time.textContent = formatDateTime(comment.createdAt);
      top.append(author, time);

      const body = document.createElement("p");
      body.className = "todo-comment-body";
      body.textContent = comment.message;

      content.append(top, body);
      article.append(avatar, content);
      return article;
    }));
  }

  if (todoCommentsEmpty) {
    todoCommentsEmpty.hidden = (task.comments?.length ?? 0) !== 0;
  }
}

function renderTodo() {
  renderTodoSummary();
  renderTodoList();
  renderTodoDetail();
}

function getOfferStatusLabel(status = "draft") {
  return OFFER_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function createOfferStatusBadge(status = "draft") {
  const badge = document.createElement("span");
  badge.className = `offer-status-badge is-${status || "draft"}`;
  badge.textContent = getOfferStatusLabel(status || "draft");
  return badge;
}

function createOfferStatusDropdown(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "work-item-status-dropdown";
  wrapper.dataset.preventRowOpen = "true";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "work-item-status-trigger";
  trigger.dataset.status = slugifyValue(item.status || "draft");
  trigger.textContent = getOfferStatusLabel(item.status || "draft");
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");

  const setPendingState = (isPending) => {
    wrapper.classList.toggle("is-pending", isPending);
    trigger.disabled = isPending;
  };

  const setCurrentStatus = (value) => {
    trigger.dataset.status = slugifyValue(value);
    trigger.textContent = getOfferStatusLabel(value);
  };

  const positionMenuPortal = (menu) => {
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = triggerRect.left;
    let top = triggerRect.bottom + 8;

    if (left + menuRect.width > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - menuRect.width - 12);
    }

    if (top + menuRect.height > viewportHeight - 12) {
      top = Math.max(12, triggerRect.top - menuRect.height - 8);
    }

    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.style.minWidth = `${Math.round(triggerRect.width)}px`;
  };

  const openMenu = () => {
    closeOpenWorkOrderStatusMenus(wrapper);

    if (wrapper._menuPortal) {
      return;
    }

    const menu = document.createElement("div");
    menu.className = "work-item-status-menu work-item-status-menu-portal";
    menu.setAttribute("role", "menu");

    ["pointerdown", "mousedown", "click", "keydown"].forEach((eventName) => {
      menu.addEventListener(eventName, (event) => {
        event.stopPropagation();
      });
    });

    OFFER_STATUS_OPTIONS.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "work-item-status-option";
      optionButton.dataset.status = slugifyValue(option.value);
      optionButton.textContent = option.label;
      optionButton.setAttribute("role", "menuitem");

      optionButton.addEventListener("click", (event) => {
        event.stopPropagation();
        closeOpenWorkOrderStatusMenus();

        if (option.value === (item.status || "draft")) {
          return;
        }

        const previousValue = item.status || "draft";
        setCurrentStatus(option.value);
        setPendingState(true);

        void runMutation(() => apiRequest(`/offers/${item.id}`, {
          method: "PATCH",
          body: { status: option.value },
        })).then((success) => {
          setPendingState(false);

          if (!success) {
            setCurrentStatus(previousValue);
            return;
          }

          const updatedItem = state.offers.find((entry) => String(entry.id) === String(item.id));
          setCurrentStatus(updatedItem?.status || option.value);
        });
      });

      menu.append(optionButton);
    });

    document.body.append(menu);
    wrapper._menuPortal = menu;
    wrapper.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    positionMenuPortal(menu);
    requestAnimationFrame(() => positionMenuPortal(menu));
  };

  ["pointerdown", "mousedown", "click", "keydown"].forEach((eventName) => {
    wrapper.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();

    if (wrapper.classList.contains("is-open")) {
      closeOpenWorkOrderStatusMenus();
      return;
    }

    openMenu();
  });

  wrapper.append(trigger);
  return wrapper;
}

function createEmptyOfferItemDraft(item = {}) {
  return {
    description: String(item?.description ?? ""),
    unit: String(item?.unit ?? ""),
    quantity: String(item?.quantity ?? ""),
    unitPrice: String(item?.unitPrice ?? ""),
    discountRate: String(item?.discountRate ?? ""),
    breakdowns: Array.isArray(item?.breakdowns)
      ? item.breakdowns
        .map((entry) => ({
          label: String(entry?.label ?? ""),
          amount: String(entry?.amount ?? ""),
        }))
      : [],
    showDiscount: Number(item?.discountRate ?? 0) > 0,
    showBreakdowns: Array.isArray(item?.breakdowns) && item.breakdowns.length > 0,
  };
}

function parseOfferMoneyInput(value, fallback = 0) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return fallback;
  }

  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!cleaned || cleaned === "-" || cleaned === "," || cleaned === ".") {
    return fallback;
  }

  const lastCommaIndex = cleaned.lastIndexOf(",");
  const lastDotIndex = cleaned.lastIndexOf(".");
  let normalized = cleaned;

  if (lastCommaIndex !== -1 && lastDotIndex !== -1) {
    const decimalIndex = Math.max(lastCommaIndex, lastDotIndex);
    normalized = cleaned.replace(/[,.]/g, (match, offset) => (offset === decimalIndex ? "." : ""));
  } else if (lastCommaIndex !== -1) {
    normalized = cleaned.replace(/,/g, (match, offset) => (offset === lastCommaIndex ? "." : ""));
  } else if (lastDotIndex !== -1) {
    const dotParts = cleaned.split(".");
    const isLikelyThousandsFormat = dotParts.length === 2
      && dotParts[1].length === 3
      && dotParts.every((part) => /^-?\d+$/.test(part));

    if (isLikelyThousandsFormat) {
      normalized = cleaned.replace(/\./g, "");
    } else {
      normalized = cleaned.replace(/\./g, (match, offset) => (offset === lastDotIndex ? "." : ""));
    }
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function getOfferLineTotal(item = {}) {
  const grossTotal = getOfferLineGrossTotal(item);
  const discountRate = Math.max(0, Math.min(100, parseOfferMoneyInput(item.discountRate, 0)));
  return roundMoneyAmount(Math.max(0, grossTotal - (grossTotal * (discountRate / 100))));
}

function getOfferLineGrossTotal(item = {}) {
  const quantity = Math.max(0, parseOfferMoneyInput(item.quantity, 0));
  const unitPrice = Math.max(0, parseOfferMoneyInput(item.unitPrice, 0));
  return roundMoneyAmount(quantity * unitPrice);
}

function getOfferLineBreakdownTotal(item = {}) {
  return roundMoneyAmount((item.breakdowns ?? []).reduce((sum, entry) => (
    sum + Math.max(0, parseOfferMoneyInput(entry.amount, 0))
  ), 0));
}

function getOfferDraftTotals() {
  const subtotal = roundMoneyAmount(offerFormItems.reduce((sum, item) => sum + getOfferLineTotal(item), 0));
  const discountRate = Math.max(0, Math.min(100, parseOfferMoneyInput(offerDiscountRateInput?.value, 0)));
  const discountTotal = roundMoneyAmount(subtotal * (discountRate / 100));
  const taxableSubtotal = roundMoneyAmount(Math.max(0, subtotal - discountTotal));
  const taxRate = Math.max(0, parseOfferMoneyInput(offerTaxRateInput?.value, 25));
  const taxTotal = roundMoneyAmount(taxableSubtotal * (taxRate / 100));

  return {
    subtotal,
    discountRate,
    discountTotal,
    taxableSubtotal,
    taxRate,
    taxTotal,
    total: roundMoneyAmount(taxableSubtotal + taxTotal),
  };
}

function syncOfferNumberPreview() {
  if (!offerNumberPreview) {
    return;
  }

  const currentOffer = state.offers.find((item) => String(item.id) === String(offerIdInput?.value || ""));

  if (currentOffer?.offerNumber) {
    offerNumberPreview.textContent = currentOffer.offerNumber;
    return;
  }

  const preview = nextOfferNumber(state.offers ?? [], {
    year: Number(new Date().toISOString().slice(0, 4)),
    initials: deriveOfferInitials(state.user?.fullName || state.user?.username || "Safety360") || "SD",
  });
  offerNumberPreview.textContent = preview.offerNumber;
}

function syncOfferTotals() {
  const totals = getOfferDraftTotals();
  const currency = "EUR";
  const totalsVisible = isOfferTotalVisible();

  if (offerSubtotal) {
    offerSubtotal.textContent = formatCurrencyAmount(totals.subtotal, currency);
  }
  if (offerTaxTotal) {
    offerTaxTotal.textContent = formatCurrencyAmount(totals.taxTotal, currency);
  }
  if (offerDiscountTotal) {
    offerDiscountTotal.textContent = formatCurrencyAmount(totals.discountTotal, currency);
  }
  if (offerTaxableSubtotal) {
    offerTaxableSubtotal.textContent = formatCurrencyAmount(totals.taxableSubtotal, currency);
  }
  if (offerGrandTotal) {
    offerGrandTotal.textContent = formatCurrencyAmount(totals.total, currency);
  }
  if (offerTotalPreview) {
    offerTotalPreview.textContent = formatCurrencyAmount(totals.total, currency);
  }
  if (offerDiscountLine) {
    offerDiscountLine.hidden = !totalsVisible || !(isOfferDiscountVisible() && totals.discountRate > 0);
  }
  if (offerTaxableSubtotalLine) {
    offerTaxableSubtotalLine.hidden = !totalsVisible || !(isOfferDiscountVisible() && totals.discountRate > 0);
  }

  offerItems?.querySelectorAll(".offer-item-total").forEach((node) => {
    node.hidden = !totalsVisible;
  });

  offerItems?.querySelectorAll("[data-offer-item-total-index]").forEach((node) => {
    const index = Number(node.getAttribute("data-offer-item-total-index"));
    const item = offerFormItems[index] ?? {};
    node.textContent = formatCurrencyAmount(getOfferLineTotal(item), currency);
  });
}

function scrollOfferFormToTop() {
  offerEditorBody?.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
}

function isOfferDiscountVisible() {
  return Boolean(offerDiscountRateWrap && !offerDiscountRateWrap.hidden);
}

function isOfferTotalVisible() {
  if (offerToggleTotalButton) {
    return offerToggleTotalButton.dataset.visibility !== "hidden";
  }

  return !(offerGrandTotalLine?.hidden ?? false);
}

function syncOfferStatusTheme() {
  if (offerStatusInput) {
    updateWorkOrderStatusSelectTheme(offerStatusInput, offerStatusInput.value || "draft");
  }
}

function setOfferDiscountVisibility(visible, { clearValue = false } = {}) {
  if (offerDiscountRateWrap) {
    offerDiscountRateWrap.hidden = !visible;
  }

  if (offerToggleDiscountButton) {
    const label = visible ? "Makni rabat ponude" : "Dodaj rabat ponude";
    offerToggleDiscountButton.textContent = label;
    offerToggleDiscountButton.setAttribute("aria-label", label);
    offerToggleDiscountButton.title = label;
  }

  if (!visible && clearValue && offerDiscountRateInput) {
    offerDiscountRateInput.value = "";
  }

  syncOfferTotals();
}

function setOfferTotalVisibility(visible) {
  if (offerTotalPreviewBlock) {
    offerTotalPreviewBlock.hidden = !visible;
  }

  offerTotalsCard?.querySelectorAll(".offers-total-line").forEach((node) => {
    node.hidden = !visible;
  });

  offerItems?.querySelectorAll(".offer-item-total").forEach((node) => {
    node.hidden = !visible;
  });

  if (offerToggleTotalButton) {
    const label = visible ? "Makni ukupni iznos" : "Prikazi ukupni iznos";
    offerToggleTotalButton.dataset.visibility = visible ? "visible" : "hidden";
    offerToggleTotalButton.textContent = label;
    offerToggleTotalButton.setAttribute("aria-label", label);
    offerToggleTotalButton.title = label;
  }

  syncOfferTotals();
}

function setOfferFormItems(items = [], { ensureOne = true } = {}) {
  offerFormItems = Array.isArray(items) && items.length > 0
    ? items.map((item) => createEmptyOfferItemDraft(item))
    : (ensureOne ? [createEmptyOfferItemDraft()] : []);
  renderOfferItemRows();
}

function updateOfferFormItem(index, key, value) {
  offerFormItems = offerFormItems.map((item, itemIndex) => (
    itemIndex === index
      ? {
        ...item,
        [key]: value,
      }
      : item
  ));
  syncOfferTotals();
}

function updateOfferFormBreakdown(index, breakdownIndex, key, value) {
  offerFormItems = offerFormItems.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return item;
    }

    const breakdowns = (item.breakdowns ?? []).map((entry, entryIndex) => (
      entryIndex === breakdownIndex
        ? {
          ...entry,
          [key]: value,
        }
        : entry
    ));

    return {
      ...item,
      breakdowns,
      showBreakdowns: breakdowns.length > 0 || item.showBreakdowns,
    };
  });
  syncOfferTotals();
}

function addOfferFormItem(item = createEmptyOfferItemDraft()) {
  offerFormItems = [...offerFormItems, createEmptyOfferItemDraft(item)];
  renderOfferItemRows();
}

function addOfferFormBreakdown(index) {
  offerFormItems = offerFormItems.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return item;
    }

    const nextBreakdowns = [...(item.breakdowns ?? [])];

    nextBreakdowns.push({
      label: "",
      amount: "",
    });

    return {
      ...item,
      breakdowns: nextBreakdowns,
      showBreakdowns: true,
    };
  });
  renderOfferItemRows();
}

function removeOfferFormBreakdown(index, breakdownIndex) {
  offerFormItems = offerFormItems.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return item;
    }

    const nextBreakdowns = (item.breakdowns ?? []).filter((_, entryIndex) => entryIndex !== breakdownIndex);

    return {
      ...item,
      breakdowns: nextBreakdowns,
      showBreakdowns: nextBreakdowns.length > 0,
    };
  });
  renderOfferItemRows();
}

function toggleOfferItemDiscount(index) {
  offerFormItems = offerFormItems.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return item;
    }

    const nextShowDiscount = !item.showDiscount;

    return {
      ...item,
      showDiscount: nextShowDiscount,
      discountRate: nextShowDiscount ? item.discountRate : "",
    };
  });
  renderOfferItemRows();
}

function toggleOfferItemBreakdowns(index) {
  offerFormItems = offerFormItems.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return item;
    }

    if (item.showBreakdowns) {
      return {
        ...item,
        showBreakdowns: false,
        breakdowns: [],
      };
    }

    return {
      ...item,
      showBreakdowns: true,
      breakdowns: item.breakdowns?.length ? item.breakdowns : [{ label: "", amount: "" }],
    };
  });
  renderOfferItemRows();
}

function removeOfferFormItem(index) {
  offerFormItems = offerFormItems.filter((_, itemIndex) => itemIndex !== index);

  if (offerFormItems.length === 0) {
    offerFormItems = [createEmptyOfferItemDraft()];
  }

  renderOfferItemRows();
}

function renderOfferItemRows() {
  if (!offerItems) {
    return;
  }

  if (offerFormItems.length === 0) {
    offerItems.replaceChildren();
    syncOfferTotals();
    return;
  }

  offerItems.replaceChildren(...offerFormItems.map((item, index) => {
    const row = document.createElement("div");
    row.className = "offer-item-row";

    const createInputField = (labelText, key, {
      type = "text",
      placeholder = "",
      inputMode = "",
    } = {}) => {
      const label = document.createElement("label");
      label.className = "field";

      const span = document.createElement("span");
      span.textContent = labelText;

      const input = document.createElement("input");
      input.type = type;
      input.placeholder = placeholder;
      input.value = item[key] ?? "";
      if (inputMode) {
        input.inputMode = inputMode;
      }
      input.addEventListener("input", (event) => {
        updateOfferFormItem(index, key, event.currentTarget.value);
      });

      label.append(span, input);
      return label;
    };

    const head = document.createElement("div");
    head.className = "offer-item-head";

    const title = document.createElement("strong");
    title.className = "offer-item-head-title";
    title.textContent = `Stavka ${index + 1}`;

    const headActions = document.createElement("div");
    headActions.className = "offer-item-head-actions";

    const discountButton = createActionButton(
      item.showDiscount ? "Makni rabat" : "Dodaj rabat",
      "ghost-button offer-item-mini-action is-discount is-icon-only",
      () => {
        toggleOfferItemDiscount(index);
      },
    );

    const breakdownButton = createActionButton(
      item.showBreakdowns ? "Makni razradu" : "Dodaj razradu",
      "ghost-button offer-item-mini-action is-breakdown is-icon-only",
      () => {
        toggleOfferItemBreakdowns(index);
      },
    );

    const total = document.createElement("div");
    total.className = "offer-item-total";
    const totalLabel = document.createElement("span");
    totalLabel.className = "offer-item-total-label";
    totalLabel.textContent = "Ukupno";
    const totalValue = document.createElement("strong");
    totalValue.className = "offer-item-total-value";
    totalValue.setAttribute("data-offer-item-total-index", String(index));
    totalValue.textContent = formatCurrencyAmount(getOfferLineTotal(item), "EUR");
    total.append(totalLabel, totalValue);

    const removeButton = createActionButton("Ukloni", "card-button card-danger offer-item-remove", () => {
      removeOfferFormItem(index);
    });
    headActions.append(discountButton, breakdownButton, removeButton);
    head.append(title, headActions);

    const descriptionField = createInputField("Usluga", "description", { placeholder: "Opis usluge ili stavke" });
    descriptionField.classList.add("offer-item-field", "is-description");

    const unitField = createInputField("Jedinica", "unit", { placeholder: "kom, sat, mj..." });
    unitField.classList.add("offer-item-field", "is-unit");

    const quantityField = createInputField("Količina", "quantity", { placeholder: "1", inputMode: "decimal" });
    quantityField.classList.add("offer-item-field", "is-quantity");

    const priceField = createInputField("Cijena", "unitPrice", { placeholder: "0,00", inputMode: "decimal" });
    priceField.classList.add("offer-item-field", "is-price");

    const metrics = document.createElement("div");
    metrics.className = "offer-item-metrics";
    metrics.append(unitField, quantityField, priceField);

    const optionalFields = document.createElement("div");
    optionalFields.className = "offer-item-optionals";

    if (item.showDiscount) {
      const discountField = createInputField("Rabat %", "discountRate", { placeholder: "0", inputMode: "decimal" });
      discountField.classList.add("offer-item-field", "is-discount");
      optionalFields.append(discountField);
    }

    if (item.showBreakdowns) {
      const breakdownBlock = document.createElement("div");
      breakdownBlock.className = "offer-item-breakdowns";

      const breakdownHead = document.createElement("div");
      breakdownHead.className = "offer-item-breakdowns-head";
      const breakdownTitle = document.createElement("strong");
      breakdownTitle.textContent = "Razrada stavke";
      const breakdownHint = document.createElement("span");
      breakdownHint.className = "inline-help";
      breakdownHint.textContent = `${item.breakdowns?.length ?? 0} redaka, informativno.`;
      const breakdownAddButton = createActionButton(
        "+ Dodaj red",
        "ghost-button offer-item-mini-action is-breakdown",
        () => {
          addOfferFormBreakdown(index);
        },
      );
      breakdownHead.append(breakdownTitle, breakdownHint, breakdownAddButton);

      const breakdownList = document.createElement("div");
      breakdownList.className = "offer-item-breakdown-list";

      (item.breakdowns ?? []).forEach((entry, breakdownIndex) => {
        const breakdownRow = document.createElement("div");
        breakdownRow.className = "offer-item-breakdown-row";

        const labelField = document.createElement("label");
        labelField.className = "field";
        const labelSpan = document.createElement("span");
        labelSpan.textContent = "Opis";
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.placeholder = "npr. do 5 mm";
        labelInput.value = entry.label ?? "";
        labelInput.addEventListener("input", (event) => {
          updateOfferFormBreakdown(index, breakdownIndex, "label", event.currentTarget.value);
        });
        labelField.append(labelSpan, labelInput);

        const amountField = document.createElement("label");
        amountField.className = "field";
        const amountSpan = document.createElement("span");
        amountSpan.textContent = "Iznos";
        const amountInput = document.createElement("input");
        amountInput.type = "text";
        amountInput.inputMode = "decimal";
        amountInput.placeholder = "0,00";
        amountInput.value = entry.amount ?? "";
        amountInput.addEventListener("input", (event) => {
          updateOfferFormBreakdown(index, breakdownIndex, "amount", event.currentTarget.value);
        });
        amountField.append(amountSpan, amountInput);

        const breakdownRemoveButton = createActionButton(
          "Ukloni",
          "card-button card-danger offer-item-breakdown-remove",
          () => {
            removeOfferFormBreakdown(index, breakdownIndex);
          },
        );

        breakdownRow.append(labelField, amountField, breakdownRemoveButton);
        breakdownList.append(breakdownRow);
      });

      breakdownBlock.append(breakdownHead, breakdownList);
      optionalFields.append(breakdownBlock);
    }

    const actions = document.createElement("div");
    actions.className = "offer-item-actions";
    actions.append(total);

    row.append(head, descriptionField, metrics);

    if (optionalFields.childNodes.length > 0) {
      row.append(optionalFields);
    }

    row.append(actions);

    return row;
  }));

  syncOfferTotals();
}

function rebuildOfferCompanyOptions(selectedValue = "") {
  if (!offerCompanyIdInput) {
    return;
  }

  const options = [
    { value: "", label: "Odaberi tvrtku" },
    ...state.companies
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "hr"))
      .map((company) => ({
        value: company.id,
        label: company.name,
      })),
  ];

  replaceSelectOptions(offerCompanyIdInput, options, selectedValue || offerCompanyIdInput.value || "");
}

function getOfferLocationSelectionValue(offerLike = {}) {
  if (offerLike.locationScope === "all") {
    return OFFER_LOCATION_ALL_VALUE;
  }

  if (offerLike.locationScope === "none") {
    return OFFER_LOCATION_NONE_VALUE;
  }

  return offerLike.locationId || OFFER_LOCATION_NONE_VALUE;
}

function rebuildOfferLocationOptions(selectedValue = "") {
  if (!offerLocationIdInput) {
    return;
  }

  const companyId = offerCompanyIdInput?.value || "";
  const options = companyId
    ? [
      { value: OFFER_LOCATION_ALL_VALUE, label: "Sve lokacije" },
      { value: OFFER_LOCATION_NONE_VALUE, label: "Bez lokacije" },
      ...state.locations
        .filter((location) => location.companyId === companyId)
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name, "hr"))
        .map((location) => ({
          value: location.id,
          label: location.name,
        })),
    ]
    : [
      { value: "", label: "Prvo odaberi tvrtku" },
    ];

  replaceSelectOptions(
    offerLocationIdInput,
    options,
    selectedValue || offerLocationIdInput.value || (companyId ? OFFER_LOCATION_ALL_VALUE : ""),
  );
}

function rebuildOfferContactOptions(selectedSlot = "", snapshot = {}) {
  if (!offerContactSlotInput) {
    return;
  }

  const locationId = offerLocationIdInput?.value || "";
  const isSingleLocation = Boolean(locationId && locationId !== OFFER_LOCATION_ALL_VALUE && locationId !== OFFER_LOCATION_NONE_VALUE);

  if (!isSingleLocation) {
    replaceSelectOptions(offerContactSlotInput, [
      {
        value: "",
        label: offerCompanyIdInput?.value
          ? "Kontakt je dostupan samo za pojedinacnu lokaciju"
          : "Prvo odaberi tvrtku",
        data: {
          contactName: "",
          contactPhone: "",
          contactEmail: "",
        },
      },
    ], "");
    offerContactSlotInput.disabled = true;
    return;
  }

  const location = getLocation(locationId);
  const contacts = buildLocationContacts(location);
  const options = [];

  if (contacts.length === 0 && snapshot.contactName) {
    options.push({
      value: snapshot.contactSlot || "",
      label: `${snapshot.contactName} (snapshot)`,
      data: {
        contactName: snapshot.contactName,
        contactPhone: snapshot.contactPhone || "",
        contactEmail: snapshot.contactEmail || "",
      },
    });
  } else {
    options.push({
      value: "",
      label: contacts.length === 0 ? "Nema kontakata na lokaciji" : "Bez kontakta",
      data: {
        contactName: "",
        contactPhone: "",
        contactEmail: "",
      },
    });
  }

  contacts.forEach((contact) => {
    options.push({
      value: String(contact.slot),
      label: contact.name || `Kontakt ${contact.slot}`,
      data: {
        contactName: contact.name || `Kontakt ${contact.slot}`,
        contactPhone: contact.phone || "",
        contactEmail: contact.email || "",
      },
    });
  });

  replaceSelectOptions(offerContactSlotInput, options, selectedSlot);
  offerContactSlotInput.disabled = false;
}

function getSelectedOfferContactSnapshot() {
  const selectedOption = offerContactSlotInput?.selectedOptions?.[0];

  return {
    contactSlot: offerContactSlotInput?.value || "",
    contactName: selectedOption?.dataset.contactName || "",
    contactPhone: selectedOption?.dataset.contactPhone || "",
    contactEmail: selectedOption?.dataset.contactEmail || "",
  };
}

function buildOfferPayload() {
  const locationSelection = offerLocationIdInput.value;
  const locationScope = locationSelection === OFFER_LOCATION_ALL_VALUE
    ? "all"
    : locationSelection === OFFER_LOCATION_NONE_VALUE || !locationSelection
      ? "none"
      : "single";
  const contactSnapshot = locationScope === "single"
    ? getSelectedOfferContactSnapshot()
    : {
      contactSlot: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
    };

  return {
    title: offerTitleInput.value,
    companyId: offerCompanyIdInput.value,
    locationId: locationScope === "single" ? locationSelection : "",
    locationScope,
    contactSlot: contactSnapshot.contactSlot,
    contactName: contactSnapshot.contactName,
    contactPhone: contactSnapshot.contactPhone,
    contactEmail: contactSnapshot.contactEmail,
    serviceLine: offerServiceLineInput.value,
    status: offerStatusInput.value,
    offerDate: offerDateInput.value,
    showTotalAmount: isOfferTotalVisible(),
    taxRate: offerTaxRateInput.value,
    discountRate: isOfferDiscountVisible() ? offerDiscountRateInput?.value || "" : "",
    note: offerNoteInput.value,
    items: offerFormItems.map((item) => ({
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountRate: item.showDiscount ? item.discountRate : "",
      breakdowns: item.showBreakdowns
        ? (item.breakdowns ?? []).map((entry) => ({
          label: entry.label,
          amount: entry.amount,
        }))
        : [],
    })),
  };
}

function resetOfferForm() {
  if (!offerForm) {
    return;
  }

  offerForm.reset();
  offerIdInput.value = "";
  offerError.textContent = "";
  if (offerStatusInput) {
    offerStatusInput.value = "draft";
  }
  syncOfferStatusTheme();
  if (offerDateInput) {
    offerDateInput.value = new Date().toISOString().slice(0, 10);
  }
  if (offerTaxRateInput) {
    offerTaxRateInput.value = "25";
  }
  if (offerNoteInput) {
    offerNoteInput.value = DEFAULT_OFFER_NOTE;
  }
  if (offerDiscountRateInput) {
    offerDiscountRateInput.value = "";
  }
  setOfferDiscountVisibility(false, { clearValue: true });
  setOfferTotalVisibility(true);
  rebuildOfferCompanyOptions("");
  if (offerCompanyIdInput) {
    offerCompanyIdInput.value = "";
  }
  rebuildOfferLocationOptions("");
  rebuildOfferContactOptions("", {});
  syncCompanySelectionPreview(
    "",
    offerCompanyPreview,
    offerCompanyPreviewLogo,
    offerCompanyPreviewName,
    offerCompanyPreviewMeta,
  );
  setOfferFormItems([], { ensureOne: true });
  if (offerDeleteButton) {
    offerDeleteButton.hidden = true;
  }
  syncOfferNumberPreview();
  syncOfferTotals();
}

function hydrateOfferForm(offer) {
  state.activeView = "module";
  state.activeSidebarGroup = "operations";
  state.activeSidebarItem = "offers";
  state.activeModuleItem = "offers";
  renderModuleView();
  renderActiveView();

  offerIdInput.value = offer.id;
  offerTitleInput.value = offer.title || "";
  rebuildOfferCompanyOptions(offer.companyId || "");
  offerCompanyIdInput.value = offer.companyId || "";
  syncCompanySelectionPreview(
    offer.companyId || "",
    offerCompanyPreview,
    offerCompanyPreviewLogo,
    offerCompanyPreviewName,
    offerCompanyPreviewMeta,
  );
  rebuildOfferLocationOptions(getOfferLocationSelectionValue(offer));
  offerLocationIdInput.value = getOfferLocationSelectionValue(offer);
  rebuildOfferContactOptions(offer.contactSlot || "", {
    contactSlot: offer.contactSlot || "",
    contactName: offer.contactName || "",
    contactPhone: offer.contactPhone || "",
    contactEmail: offer.contactEmail || "",
  });
  offerServiceLineInput.value = offer.serviceLine || "";
  offerStatusInput.value = offer.status || "draft";
  syncOfferStatusTheme();
  offerDateInput.value = offer.offerDate || String(offer.createdAt ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  offerTaxRateInput.value = String(offer.taxRate ?? 25);
  offerNoteInput.value = offer.note || DEFAULT_OFFER_NOTE;
  if (offerDiscountRateInput) {
    offerDiscountRateInput.value = offer.discountRate ? String(offer.discountRate) : "";
  }
  setOfferDiscountVisibility(Number(offer.discountRate ?? 0) > 0);
  setOfferTotalVisibility(offer.showTotalAmount !== false);
  setOfferFormItems(offer.items ?? [], { ensureOne: true });
  offerError.textContent = "";
  if (offerDeleteButton) {
    offerDeleteButton.hidden = false;
  }
  syncOfferNumberPreview();
  syncOfferTotals();
  renderOffersModule();
  openOfferEditor();
  requestAnimationFrame(() => {
    offerTitleInput?.focus({ preventScroll: true });
  });
}

function renderOffersModule() {
  if (!offersModule || !offersList || !offersEmpty) {
    return;
  }

  const allOffers = sortOffers(state.offers ?? []);
  const visibleOffers = sortOffers(filterOffers(state.offers ?? [], {
    query: offersSearchInput?.value || "",
    status: offersFilterStatusInput?.value || "all",
  }));

  if (offersTotalCount) {
    offersTotalCount.textContent = String(allOffers.length);
  }
  if (offersDraftCount) {
    offersDraftCount.textContent = String(allOffers.filter((item) => item.status === "draft").length);
  }
  if (offersSentCount) {
    offersSentCount.textContent = String(allOffers.filter((item) => item.status === "sent").length);
  }
  if (offersAcceptedCount) {
    offersAcceptedCount.textContent = String(allOffers.filter((item) => item.status === "accepted").length);
  }
  if (offersHelper) {
    offersHelper.textContent = visibleOffers.length === allOffers.length
      ? `Prikazano ${visibleOffers.length} ponuda.`
      : `Prikazano ${visibleOffers.length} od ${allOffers.length} ponuda.`;
  }

  offersList.replaceChildren(...visibleOffers.map((offer) => {
    const card = document.createElement("article");
    card.className = "offer-list-card";
    card.classList.add(`is-${offer.status || "draft"}`);
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Otvori ponudu ${offer.offerNumber || offer.title || ""}`.trim());
    if (String(offer.id) === String(offerIdInput?.value || "")) {
      card.classList.add("is-active");
    }

    const head = document.createElement("div");
    head.className = "offer-list-card-head";

    const copy = document.createElement("div");
    copy.className = "offer-list-card-copy";
    const number = document.createElement("span");
    number.className = "offer-list-card-number";
    number.textContent = offer.offerNumber || "Bez broja";
    const title = document.createElement("h4");
    title.className = "offer-list-card-title";
    title.textContent = offer.title || "Nova ponuda";
    copy.append(number, title);

    head.append(createOfferStatusDropdown(offer), copy);

    const meta = document.createElement("p");
    meta.className = "offer-list-card-meta";
    meta.textContent = [
      offer.companyName,
      offer.locationName || "Bez lokacije",
      offer.contactName || "",
    ].filter(Boolean).join(" · ");

    const services = document.createElement("p");
    services.className = "offer-list-card-services";
    services.textContent = [
      offer.serviceLine || "Bez vrste usluge",
      offer.offerDate ? `Datum ${formatDate(offer.offerDate)}` : "",
      offer.items?.length ? `${offer.items.length} stavki` : "",
      Number(offer.discountRate ?? 0) > 0 ? `Rabat ${offer.discountRate}%` : "",
    ].filter(Boolean).join(" · ");

    const footer = document.createElement("div");
    footer.className = "offer-list-card-footer";
    const creator = document.createElement("span");
    creator.className = "offer-list-card-number";
    creator.textContent = offer.createdByLabel || "Safety360";
    footer.append(creator);

    if (offer.showTotalAmount !== false) {
      const total = document.createElement("strong");
      total.className = "offer-list-card-total";
      total.textContent = formatCurrencyAmount(offer.total || 0, offer.currency || "EUR");
      footer.append(total);
    }

    card.append(head, meta, services, footer);
    const openOffer = () => {
      hydrateOfferForm(offer);
    };

    card.addEventListener("click", (event) => {
      if (isInteractiveWorkOrderTarget(event.target)) {
        return;
      }

      openOffer();
    });
    card.addEventListener("keydown", (event) => {
      if (isInteractiveWorkOrderTarget(event.target)) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      openOffer();
    });
    return card;
  }));

  offersEmpty.hidden = visibleOffers.length !== 0;
  if (visibleOffers.length === 0) {
    const emptyCard = document.createElement("div");
    emptyCard.className = "offers-empty-card";
    emptyCard.textContent = "Nema ponuda za odabrane filtere. Otvori novu ponudu ili proširi pretragu.";
    offersList.replaceChildren(emptyCard);
  }

  if (offerDeleteButton) {
    offerDeleteButton.hidden = !offerIdInput?.value;
  }
  syncOfferNumberPreview();
  syncOfferTotals();
}

function getVehicleStatusLabel(value) {
  return getOptionLabel(VEHICLE_STATUS_OPTIONS, value || "available");
}

function getVehicleReservationStatusLabel(value) {
  return getOptionLabel(VEHICLE_RESERVATION_STATUS_OPTIONS, value || "reserved");
}

function getVehicleStatusToneClass(value) {
  return `is-${slugifyValue(value || "available")}`;
}

function getActiveVehicle() {
  return state.vehicles.find((item) => String(item.id) === String(state.activeVehicleId)) ?? null;
}

function getVehicleFromReservationEditor() {
  const vehicleId = String(vehicleReservationVehicleIdInput?.value || state.activeVehicleId || "");
  return state.vehicles.find((item) => String(item.id) === vehicleId) ?? null;
}

function toDateTimeLocalInputValue(value) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return "";
  }

  const offsetDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function buildDefaultVehicleReservationWindow() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const end = new Date(now);
  end.setHours(end.getHours() + 2);
  return {
    startAt: toDateTimeLocalInputValue(now.toISOString()),
    endAt: toDateTimeLocalInputValue(end.toISOString()),
  };
}

function getVehicleScheduleHours() {
  return Array.from(
    { length: VEHICLE_SCHEDULE_END_HOUR - VEHICLE_SCHEDULE_START_HOUR },
    (_, index) => VEHICLE_SCHEDULE_START_HOUR + index,
  );
}

function createVehicleReservationExecutorAvatar(label, { compact = false } = {}) {
  const avatar = document.createElement("span");
  avatar.className = compact
    ? "work-order-mini-executor vehicle-reservation-executor-avatar"
    : "work-executor-avatar vehicle-reservation-executor-avatar";
  avatar.title = label;
  const tone = getExecutorTone(label);
  avatar.style.setProperty("--executor-bg", tone.bg);
  avatar.style.setProperty("--executor-fg", tone.fg);

  if (compact) {
    avatar.textContent = getUserInitials({ fullName: label }) || "?";
    return avatar;
  }

  const initials = document.createElement("span");
  initials.className = "work-executor-initials";
  initials.textContent = getUserInitials({ fullName: label }) || "?";
  avatar.append(initials);
  return avatar;
}

function getVehicleReservationSelectedUserIds() {
  if (!vehicleReservationAssigneesInput) {
    return [];
  }

  return Array.from(
    vehicleReservationAssigneesInput.querySelectorAll('input[name="vehicle-reservation-user-id"]:checked'),
  ).map((input) => String(input.value || "")).filter(Boolean);
}

function getVehicleReservationSelectedUsers() {
  const selectedIds = getVehicleReservationSelectedUserIds();
  return selectedIds
    .map((userId) => state.users.find((user) => String(user.id) === String(userId)) ?? null)
    .filter(Boolean);
}

function getVehicleReservationAssigneeLabels(reservation) {
  const labels = Array.isArray(reservation?.reservedForLabels) && reservation.reservedForLabels.length > 0
    ? reservation.reservedForLabels
    : [reservation?.reservedForLabel].filter(Boolean);
  return labels.map((value) => String(value || "").trim()).filter(Boolean);
}

function createVehicleReservationExecutorList(labels = [], { compact = false, emptyLabel = "Bez izvrsitelja" } = {}) {
  const wrap = document.createElement("div");
  wrap.className = compact
    ? "vehicle-reservation-executors is-compact"
    : "vehicle-reservation-executors";

  if (!Array.isArray(labels) || labels.length === 0) {
    const empty = document.createElement("span");
    empty.className = "vehicle-reservation-executors-empty";
    empty.textContent = emptyLabel;
    wrap.append(empty);
    return wrap;
  }

  labels.forEach((label) => {
    wrap.append(createVehicleReservationExecutorAvatar(label, { compact }));
  });
  return wrap;
}

function syncVehicleReservationAssigneePreview() {
  if (!vehicleReservationAssigneesPreview) {
    return;
  }

  const selectedUsers = getVehicleReservationSelectedUsers();
  const labels = selectedUsers.map((user) => user.fullName || user.email || user.username || "User");
  const executors = createVehicleReservationExecutorList(labels, { compact: true });
  const summary = document.createElement("span");
  summary.className = "vehicle-reservation-assignees-summary";
  summary.textContent = labels.length === 0
    ? "Odaberi izvrsitelje"
    : labels.length === 1
      ? labels[0]
      : `${labels.length} izvrsitelja`;

  vehicleReservationAssigneesPreview.replaceChildren(executors, summary);
}

function rebuildVehicleReservationUserOptions(selectedValue = []) {
  if (!vehicleReservationAssigneesInput) {
    return;
  }

  const selectedIds = Array.isArray(selectedValue)
    ? selectedValue.map((value) => String(value || "")).filter(Boolean)
    : [String(selectedValue || "")].filter(Boolean);
  const selectedSet = new Set(selectedIds);
  const users = state.users
    .filter((user) => user.isActive !== false)
    .slice()
    .sort((left, right) => (left.fullName || left.email || "").localeCompare(right.fullName || right.email || "", "hr"));

  if (users.length === 0) {
    const empty = document.createElement("p");
    empty.className = "vehicle-reservation-assignee-empty";
    empty.textContent = "Nema aktivnih korisnika za odabir.";
    vehicleReservationAssigneesInput.replaceChildren(empty);
    syncVehicleReservationAssigneePreview();
    return;
  }

  vehicleReservationAssigneesInput.replaceChildren(...users.map((user) => {
    const option = document.createElement("label");
    option.className = "vehicle-reservation-assignee-option";
    option.classList.toggle("is-selected", selectedSet.has(String(user.id)));

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "vehicle-reservation-user-id";
    checkbox.value = String(user.id);
    checkbox.checked = selectedSet.has(String(user.id));

    const avatar = createVehicleReservationExecutorAvatar(user.fullName || user.email || user.username || "User");

    const copy = document.createElement("span");
    copy.className = "vehicle-reservation-assignee-copy";

    const name = document.createElement("strong");
    name.textContent = user.fullName || user.email || user.username || "User";

    const meta = document.createElement("span");
    meta.textContent = user.email || user.username || "Clan tima";

    copy.append(name, meta);
    option.append(checkbox, avatar, copy);
    return option;
  }));

  syncVehicleReservationAssigneePreview();
  syncVehicleReservationAssigneePicker();
}

function rebuildVehicleReservationVehicleOptions(selectedValue = "") {
  if (!vehicleReservationVehicleIdInput) {
    return;
  }

  const options = [
    { value: "", label: state.vehicles.length > 0 ? "Odaberi vozilo" : "Nema vozila" },
    ...sortVehicles(state.vehicles ?? []).map((vehicle) => ({
      value: vehicle.id,
      label: `${vehicle.plateNumber || "Bez registracije"} · ${vehicle.name || "Vozilo"}`,
    })),
  ];

  replaceSelectOptions(vehicleReservationVehicleIdInput, options, selectedValue);
}

function setVehicleAvailabilityPreview(status) {
  if (!vehicleAvailabilityPreview) {
    return;
  }

  const safeStatus = status || "available";
  vehicleAvailabilityPreview.className = `vehicle-status-badge ${getVehicleStatusToneClass(safeStatus)}`;
  vehicleAvailabilityPreview.textContent = getVehicleStatusLabel(safeStatus);
}

function setVehicleReservationFormDisabled(disabled) {
  if (!vehicleReservationForm) {
    return;
  }

  const isEditing = Boolean(vehicleReservationIdInput?.value);

  Array.from(vehicleReservationForm.elements).forEach((field) => {
    if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLSelectElement) && !(field instanceof HTMLTextAreaElement) && !(field instanceof HTMLButtonElement)) {
      return;
    }

    if (field === vehicleReservationResetButton) {
      field.disabled = false;
      return;
    }

    if (field === vehicleReservationVehicleIdInput) {
      field.disabled = disabled || isEditing;
      return;
    }

    field.disabled = disabled;
  });

  if (vehicleOpenReservationButton) {
    vehicleOpenReservationButton.disabled = disabled;
  }
}

function selectVehicle(vehicleId = "") {
  state.activeVehicleId = String(vehicleId || "");
  state.activeVehicleReservationId = "";
  renderVehiclesModule();
}

function syncVehicleEditorSummary() {
  const activeVehicle = getActiveVehicle();
  const previewStatus = activeVehicle
    ? getVehicleAvailabilityStatus(activeVehicle, new Date().toISOString())
    : (vehicleStatusInput?.value || "available");

  if (vehicleEditorTitle) {
    vehicleEditorTitle.textContent = activeVehicle
      ? `${activeVehicle.name || "Vozilo"} | ${activeVehicle.plateNumber || "bez registracije"}`
      : "Novo vozilo";
  }

  setVehicleAvailabilityPreview(previewStatus);

  if (vehicleDeleteButton) {
    vehicleDeleteButton.hidden = !activeVehicle;
  }

  if (vehicleReservationsTitle) {
    const reservationVehicle = getVehicleFromReservationEditor() ?? activeVehicle;
    vehicleReservationsTitle.textContent = reservationVehicle
      ? `Rezervacija | ${reservationVehicle.name || reservationVehicle.plateNumber || "Vozilo"}`
      : "Rezervacije";
  }

  setVehicleReservationFormDisabled(!getVehicleFromReservationEditor() && state.vehicles.length === 0);
}

function buildVehiclePayload() {
  return {
    name: vehicleNameInput?.value || "",
    plateNumber: vehiclePlateNumberInput?.value || "",
    status: vehicleStatusInput?.value || "available",
    category: vehicleCategoryInput?.value || "",
    make: vehicleMakeInput?.value || "",
    model: vehicleModelInput?.value || "",
    year: vehicleYearInput?.value || "",
    color: vehicleColorInput?.value || "",
    fuelType: vehicleFuelTypeInput?.value || "",
    transmission: vehicleTransmissionInput?.value || "",
    seatCount: vehicleSeatCountInput?.value || "",
    odometerKm: vehicleOdometerKmInput?.value || "",
    serviceDueDate: vehicleServiceDueDateInput?.value || "",
    registrationExpiresOn: vehicleRegistrationExpiresOnInput?.value || "",
    notes: vehicleNotesInput?.value || "",
  };
}

function buildVehicleReservationPayload() {
  const selectedUsers = getVehicleReservationSelectedUsers();
  const reservedForUserIds = selectedUsers.map((user) => String(user.id));
  const reservedForLabels = selectedUsers.map((user) => user.fullName || user.email || user.username || "User");

  return {
    status: vehicleReservationStatusInput?.value || "reserved",
    reservedForUserIds,
    reservedForLabels,
    reservedForUserId: reservedForUserIds[0] || "",
    reservedForLabel: reservedForLabels.join(", "),
    purpose: vehicleReservationPurposeInput?.value || "",
    startAt: vehicleReservationStartAtInput?.value || "",
    endAt: vehicleReservationEndAtInput?.value || "",
    destination: vehicleReservationDestinationInput?.value || "",
    note: vehicleReservationNoteInput?.value || "",
  };
}

function resetVehicleReservationForm({ clearSelection = true, vehicleId = state.activeVehicleId || "" } = {}) {
  if (!vehicleReservationForm) {
    return;
  }

  setVehicleReservationAssigneePickerOpen(false);
  vehicleReservationForm.reset();
  if (vehicleReservationIdInput) {
    vehicleReservationIdInput.value = "";
  }
  if (vehicleReservationError) {
    vehicleReservationError.textContent = "";
  }
  if (vehicleReservationStatusInput) {
    vehicleReservationStatusInput.value = "reserved";
  }
  rebuildVehicleReservationVehicleOptions(vehicleId);

  const windowRange = buildDefaultVehicleReservationWindow();
  if (vehicleReservationStartAtInput) {
    vehicleReservationStartAtInput.value = windowRange.startAt;
  }
  if (vehicleReservationEndAtInput) {
    vehicleReservationEndAtInput.value = windowRange.endAt;
  }

  rebuildVehicleReservationUserOptions([]);

  if (clearSelection) {
    state.activeVehicleReservationId = "";
  }

  if (vehicleId) {
    state.activeVehicleId = String(vehicleId);
  }

  syncVehicleEditorSummary();
}

function resetVehicleForm({ clearSelection = true } = {}) {
  if (!vehicleForm) {
    return;
  }

  vehicleForm.reset();
  if (vehicleIdInput) {
    vehicleIdInput.value = "";
  }
  if (vehicleError) {
    vehicleError.textContent = "";
  }
  if (vehicleStatusInput) {
    vehicleStatusInput.value = "available";
  }

  if (clearSelection) {
    state.activeVehicleId = "";
    state.activeVehicleReservationId = "";
  }

  syncVehicleEditorSummary();
}

function hydrateVehicleReservationForm(vehicle, reservation) {
  state.activeVehicleId = vehicle.id;
  state.activeVehicleReservationId = reservation.id;
  setVehicleReservationAssigneePickerOpen(false);

  if (vehicleReservationIdInput) {
    vehicleReservationIdInput.value = reservation.id || "";
  }
  rebuildVehicleReservationVehicleOptions(vehicle.id);
  if (vehicleReservationStatusInput) {
    vehicleReservationStatusInput.value = reservation.status || "reserved";
  }
  rebuildVehicleReservationUserOptions(reservation.reservedForUserIds ?? reservation.reservedForUserId ?? []);
  if (vehicleReservationPurposeInput) {
    vehicleReservationPurposeInput.value = reservation.purpose || "";
  }
  if (vehicleReservationStartAtInput) {
    vehicleReservationStartAtInput.value = toDateTimeLocalInputValue(reservation.startAt);
  }
  if (vehicleReservationEndAtInput) {
    vehicleReservationEndAtInput.value = toDateTimeLocalInputValue(reservation.endAt);
  }
  if (vehicleReservationDestinationInput) {
    vehicleReservationDestinationInput.value = reservation.destination || "";
  }
  if (vehicleReservationNoteInput) {
    vehicleReservationNoteInput.value = reservation.note || "";
  }
  if (vehicleReservationError) {
    vehicleReservationError.textContent = "";
  }

  syncVehicleEditorSummary();
  renderVehiclesModule();
  openVehicleReservationEditor();
}

function hydrateVehicleForm(vehicle) {
  state.activeView = "module";
  state.activeSidebarGroup = "organisations";
  state.activeSidebarItem = "vehicles";
  state.activeModuleItem = "vehicles";
  state.activeVehicleId = vehicle.id;
  renderModuleView();
  renderActiveView();

  if (vehicleIdInput) {
    vehicleIdInput.value = vehicle.id || "";
  }
  if (vehicleNameInput) {
    vehicleNameInput.value = vehicle.name || "";
  }
  if (vehiclePlateNumberInput) {
    vehiclePlateNumberInput.value = vehicle.plateNumber || "";
  }
  if (vehicleStatusInput) {
    vehicleStatusInput.value = vehicle.status || "available";
  }
  if (vehicleCategoryInput) {
    vehicleCategoryInput.value = vehicle.category || "";
  }
  if (vehicleMakeInput) {
    vehicleMakeInput.value = vehicle.make || "";
  }
  if (vehicleModelInput) {
    vehicleModelInput.value = vehicle.model || "";
  }
  if (vehicleYearInput) {
    vehicleYearInput.value = vehicle.year ? String(vehicle.year) : "";
  }
  if (vehicleColorInput) {
    vehicleColorInput.value = vehicle.color || "";
  }
  if (vehicleFuelTypeInput) {
    vehicleFuelTypeInput.value = vehicle.fuelType || "";
  }
  if (vehicleTransmissionInput) {
    vehicleTransmissionInput.value = vehicle.transmission || "";
  }
  if (vehicleSeatCountInput) {
    vehicleSeatCountInput.value = vehicle.seatCount ? String(vehicle.seatCount) : "";
  }
  if (vehicleOdometerKmInput) {
    vehicleOdometerKmInput.value = vehicle.odometerKm ? String(vehicle.odometerKm) : "";
  }
  if (vehicleServiceDueDateInput) {
    vehicleServiceDueDateInput.value = vehicle.serviceDueDate || "";
  }
  if (vehicleRegistrationExpiresOnInput) {
    vehicleRegistrationExpiresOnInput.value = vehicle.registrationExpiresOn || "";
  }
  if (vehicleNotesInput) {
    vehicleNotesInput.value = vehicle.notes || "";
  }
  if (vehicleError) {
    vehicleError.textContent = "";
  }

  syncVehicleEditorSummary();
  renderVehiclesModule();
  openVehicleEditor();
}

function findCreatedVehicleMatch(previousIds, payload) {
  const created = state.vehicles.find((item) => !previousIds.has(String(item.id)));

  if (created) {
    return created;
  }

  return state.vehicles.find((item) => (
    String(item.name || "") === String(payload.name || "")
    && String(item.plateNumber || "") === String(payload.plateNumber || "").toUpperCase()
  )) ?? null;
}

function findCreatedVehicleReservationMatch(vehicle, previousIds, payload) {
  const created = (vehicle?.reservations ?? []).find((item) => !previousIds.has(String(item.id)));

  if (created) {
    return created;
  }

  return (vehicle?.reservations ?? []).find((item) => (
    String(item.purpose || "") === String(payload.purpose || "")
    && toDateTimeLocalInputValue(item.startAt) === String(payload.startAt || "")
    && toDateTimeLocalInputValue(item.endAt) === String(payload.endAt || "")
  )) ?? null;
}

function openVehicleReservationComposer({ vehicleId = state.activeVehicleId || "", startAt = "", endAt = "" } = {}) {
  resetVehicleReservationForm({ clearSelection: true, vehicleId });
  rebuildVehicleReservationVehicleOptions(vehicleId);

  if (startAt && vehicleReservationStartAtInput) {
    vehicleReservationStartAtInput.value = startAt;
  }

  if (endAt && vehicleReservationEndAtInput) {
    vehicleReservationEndAtInput.value = endAt;
  }

  renderVehiclesModule();
  openVehicleReservationEditor();
}

function createVehicleInlineStatusSelect(vehicle) {
  const select = document.createElement("select");
  select.className = "vehicle-inline-status-select";
  select.setAttribute("aria-label", `Promijeni status za ${vehicle.name || vehicle.plateNumber || "vozilo"}`);
  select.append(...VEHICLE_STATUS_OPTIONS.map((option) => createOption(option.value, option.label, vehicle.status || "available")));
  select.value = vehicle.status || "available";
  select.addEventListener("change", () => {
    void runMutation(() => apiRequest(`/vehicles/${vehicle.id}`, {
      method: "PATCH",
      body: { status: select.value },
    }), vehicleError);
  });
  return select;
}

function createVehicleReservationInlineStatusSelect(vehicle, reservation) {
  const select = document.createElement("select");
  select.className = "vehicle-inline-status-select";
  select.setAttribute("aria-label", `Promijeni status rezervacije ${reservation.purpose || reservation.id}`);
  select.append(...VEHICLE_RESERVATION_STATUS_OPTIONS.map((option) => createOption(option.value, option.label, reservation.status || "reserved")));
  select.value = reservation.status || "reserved";
  select.addEventListener("change", () => {
    void runMutation(() => apiRequest(`/vehicles/${vehicle.id}/reservations/${reservation.id}`, {
      method: "PATCH",
      body: { status: select.value },
    }), vehicleReservationError).then((success) => {
      if (success) {
        renderVehiclesModule();
      }
    });
  });
  return select;
}

function resolveVehicleScheduleSlotWindow(dateKey, hour) {
  const startDate = new Date(`${dateKey}T${String(hour).padStart(2, "0")}:00:00`);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  return {
    startAt: toDateTimeLocalInputValue(startDate.toISOString()),
    endAt: toDateTimeLocalInputValue(endDate.toISOString()),
  };
}

function resolveVehicleScheduleSelectionWindow(dateKey, startHour, endHour) {
  const startDate = new Date(`${dateKey}T${String(startHour).padStart(2, "0")}:00:00`);
  const endDate = new Date(`${dateKey}T${String(endHour + 1).padStart(2, "0")}:00:00`);

  return {
    startAt: toDateTimeLocalInputValue(startDate.toISOString()),
    endAt: toDateTimeLocalInputValue(endDate.toISOString()),
  };
}

function getVehicleScheduleSelectionRange() {
  const selection = state.vehicleScheduleSelection;

  if (!selection) {
    return null;
  }

  return {
    vehicleId: String(selection.vehicleId || ""),
    startHour: Math.min(selection.anchorHour, selection.focusHour),
    endHour: Math.max(selection.anchorHour, selection.focusHour),
  };
}

function syncVehicleScheduleHelperText() {
  if (!vehicleScheduleHelper) {
    return;
  }

  const dateKey = state.vehicleScheduleDate || new Date().toISOString().slice(0, 10);
  const selection = getVehicleScheduleSelectionRange();

  if (!selection) {
    vehicleScheduleHelper.textContent = `Povuci preko praznih sati za novu rezervaciju ili prosirenje postojece za ${formatDate(dateKey)}.`;
    return;
  }

  vehicleScheduleHelper.textContent = `Odabran raspon ${String(selection.startHour).padStart(2, "0")}:00 - ${String(selection.endHour + 1).padStart(2, "0")}:00. Pusti tipku za novu rezervaciju ili prosirenje postojece.`;
}

function syncVehicleScheduleSlotSelection(track, vehicleId) {
  if (!track) {
    return;
  }

  const selection = getVehicleScheduleSelectionRange();
  const isActiveVehicle = selection && String(selection.vehicleId) === String(vehicleId);

  track.querySelectorAll(".vehicle-schedule-slot").forEach((node) => {
    const slotHour = Number(node.dataset.hour || Number.NaN);
    const isSelected = Boolean(
      isActiveVehicle
      && Number.isFinite(slotHour)
      && slotHour >= selection.startHour
      && slotHour <= selection.endHour,
    );
    node.classList.toggle("is-selected", isSelected);
  });
}

function clearVehicleScheduleSelection() {
  state.vehicleScheduleSelection = null;
  vehicleScheduleGrid?.querySelectorAll(".vehicle-schedule-slot.is-selected").forEach((node) => {
    node.classList.remove("is-selected");
  });
  syncVehicleScheduleHelperText();
}

function findVehicleScheduleExtensionTarget(vehicle, selectionWindow) {
  const candidates = (vehicle?.reservations ?? []).filter((reservation) => {
    const reservationStart = toDateTimeLocalInputValue(reservation.startAt);
    const reservationEnd = toDateTimeLocalInputValue(reservation.endAt);
    return reservationEnd === selectionWindow.startAt || reservationStart === selectionWindow.endAt;
  });

  if (candidates.length !== 1) {
    return null;
  }

  const reservation = candidates[0];
  const reservationStart = toDateTimeLocalInputValue(reservation.startAt);
  const reservationEnd = toDateTimeLocalInputValue(reservation.endAt);

  return {
    reservation,
    startAt: reservationStart === selectionWindow.endAt ? selectionWindow.startAt : reservationStart,
    endAt: reservationEnd === selectionWindow.startAt ? selectionWindow.endAt : reservationEnd,
  };
}

async function finalizeVehicleScheduleSelection() {
  const selection = getVehicleScheduleSelectionRange();

  if (!selection) {
    clearVehicleScheduleSelection();
    return;
  }

  const vehicle = state.vehicles.find((item) => String(item.id) === String(selection.vehicleId)) ?? null;
  const dateKey = state.vehicleScheduleDate || new Date().toISOString().slice(0, 10);
  const selectionWindow = resolveVehicleScheduleSelectionWindow(dateKey, selection.startHour, selection.endHour);

  clearVehicleScheduleSelection();

  if (!vehicle) {
    return;
  }

  const extensionTarget = findVehicleScheduleExtensionTarget(vehicle, selectionWindow);
  selectVehicle(vehicle.id);

  if (extensionTarget) {
    const success = await runMutation(() => apiRequest(`/vehicles/${vehicle.id}/reservations/${extensionTarget.reservation.id}`, {
      method: "PATCH",
      body: {
        startAt: extensionTarget.startAt,
        endAt: extensionTarget.endAt,
      },
    }), vehicleReservationError);

    if (success) {
      state.activeVehicleId = vehicle.id;
      state.activeVehicleReservationId = extensionTarget.reservation.id;
      renderVehiclesModule();
    }
    return;
  }

  openVehicleReservationComposer({
    vehicleId: vehicle.id,
    startAt: selectionWindow.startAt,
    endAt: selectionWindow.endAt,
  });
  requestAnimationFrame(() => {
    vehicleReservationPurposeInput?.focus({ preventScroll: true });
  });
}

function resolveVehicleScheduleReservationPlacement(reservation, dateKey) {
  const scheduleStart = new Date(`${dateKey}T${String(VEHICLE_SCHEDULE_START_HOUR).padStart(2, "0")}:00:00`);
  const scheduleEnd = new Date(`${dateKey}T${String(VEHICLE_SCHEDULE_END_HOUR).padStart(2, "0")}:00:00`);
  const reservationStart = parseDateValue(reservation.startAt);
  const reservationEnd = parseDateValue(reservation.endAt);

  if (!reservationStart || !reservationEnd) {
    return null;
  }

  if (reservationEnd <= scheduleStart || reservationStart >= scheduleEnd) {
    return null;
  }

  const visibleStart = reservationStart < scheduleStart ? scheduleStart : reservationStart;
  const visibleEnd = reservationEnd > scheduleEnd ? scheduleEnd : reservationEnd;
  const startOffset = Math.max(0, Math.floor((visibleStart.getTime() - scheduleStart.getTime()) / 3_600_000));
  const endOffset = Math.max(startOffset + 1, Math.ceil((visibleEnd.getTime() - scheduleStart.getTime()) / 3_600_000));

  return {
    columnStart: startOffset + 1,
    columnSpan: Math.max(1, endOffset - startOffset),
  };
}

function renderVehicleSchedule(vehicles, nowValue = new Date().toISOString()) {
  if (!vehicleScheduleGrid || !vehicleScheduleEmpty) {
    return;
  }

  const hours = getVehicleScheduleHours();
  const dateKey = state.vehicleScheduleDate || new Date().toISOString().slice(0, 10);

  if (vehicleScheduleDateInput) {
    vehicleScheduleDateInput.value = dateKey;
  }

  syncVehicleScheduleHelperText();

  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    clearVehicleScheduleSelection();
    vehicleScheduleGrid.replaceChildren();
    vehicleScheduleEmpty.hidden = false;
    return;
  }

  vehicleScheduleEmpty.hidden = true;
  const fragment = document.createDocumentFragment();

  const header = document.createElement("div");
  header.className = "vehicle-schedule-header-row";
  header.style.setProperty("--vehicle-hour-count", String(hours.length));
  const lead = document.createElement("div");
  lead.className = "vehicle-schedule-vehicle-head";
  lead.textContent = "Vozilo";
  header.append(lead);
  hours.forEach((hour) => {
    const hourLabel = document.createElement("div");
    hourLabel.className = "vehicle-schedule-hour-head";
    hourLabel.textContent = `${String(hour).padStart(2, "0")}:00`;
    header.append(hourLabel);
  });
  fragment.append(header);

  vehicles.forEach((vehicle) => {
    const row = document.createElement("div");
    row.className = "vehicle-schedule-row";
    if (String(vehicle.id) === String(state.activeVehicleId)) {
      row.classList.add("is-active");
    }

    const vehicleCell = document.createElement("button");
    vehicleCell.type = "button";
    vehicleCell.className = "vehicle-schedule-vehicle-cell";
    vehicleCell.addEventListener("click", () => {
      selectVehicle(vehicle.id);
    });

    const vehicleName = document.createElement("strong");
    vehicleName.textContent = vehicle.name || "Vozilo";
    const vehicleMeta = document.createElement("span");
    vehicleMeta.textContent = `${vehicle.plateNumber || "Bez registracije"} | ${getVehicleStatusLabel(getVehicleAvailabilityStatus(vehicle, nowValue))}`;
    vehicleCell.append(vehicleName, vehicleMeta);

    const track = document.createElement("div");
    track.className = "vehicle-schedule-track";
    track.style.setProperty("--vehicle-hour-count", String(hours.length));

    hours.forEach((hour) => {
      const slotButton = document.createElement("button");
      slotButton.type = "button";
      slotButton.className = "vehicle-schedule-slot";
      slotButton.dataset.hour = String(hour);
      slotButton.setAttribute("aria-label", `Rezerviraj ${vehicle.name || vehicle.plateNumber || "vozilo"} u ${String(hour).padStart(2, "0")}:00`);
      slotButton.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) {
          return;
        }

        state.vehicleScheduleSelection = {
          vehicleId: vehicle.id,
          anchorHour: hour,
          focusHour: hour,
        };
        syncVehicleScheduleSlotSelection(track, vehicle.id);
        syncVehicleScheduleHelperText();
        event.preventDefault();
      });
      slotButton.addEventListener("pointerenter", (event) => {
        if (!(event.buttons & 1)) {
          return;
        }

        if (!state.vehicleScheduleSelection || String(state.vehicleScheduleSelection.vehicleId) !== String(vehicle.id)) {
          return;
        }

        state.vehicleScheduleSelection.focusHour = hour;
        syncVehicleScheduleSlotSelection(track, vehicle.id);
        syncVehicleScheduleHelperText();
      });
      track.append(slotButton);
    });

    syncVehicleScheduleSlotSelection(track, vehicle.id);

    (vehicle.reservations ?? []).forEach((reservation) => {
      const placement = resolveVehicleScheduleReservationPlacement(reservation, dateKey);

      if (!placement) {
        return;
      }

      const block = document.createElement("button");
      block.type = "button";
      block.className = `vehicle-schedule-reservation ${getVehicleStatusToneClass(reservation.status || "reserved")}`;
      block.style.gridColumn = `${placement.columnStart} / span ${placement.columnSpan}`;
      const title = document.createElement("strong");
      title.textContent = reservation.purpose || "Rezervacija";
      const meta = document.createElement("span");
      meta.textContent = getVehicleReservationStatusLabel(reservation.status);
      block.append(title, meta, createVehicleReservationExecutorList(getVehicleReservationAssigneeLabels(reservation), { compact: true }));
      block.addEventListener("click", () => {
        selectVehicle(vehicle.id);
        hydrateVehicleReservationForm(vehicle, reservation);
      });
      track.append(block);
    });

    row.append(vehicleCell, track);
    fragment.append(row);
  });

  vehicleScheduleGrid.replaceChildren(fragment);
}

function renderVehiclesModule() {
  if (!vehiclesModule || !vehiclesList || !vehiclesEmpty) {
    return;
  }

  const nowValue = new Date().toISOString();
  const allVehicles = sortVehicles(state.vehicles ?? [], nowValue);
  const visibleVehicles = sortVehicles(filterVehicles(state.vehicles ?? [], {
    query: vehiclesSearchInput?.value || "",
    status: vehiclesFilterStatusInput?.value || "all",
    nowValue,
  }), nowValue);

  if (vehiclesTotalCount) {
    vehiclesTotalCount.textContent = String(allVehicles.length);
  }
  if (vehiclesAvailableCount) {
    vehiclesAvailableCount.textContent = String(allVehicles.filter((item) => getVehicleAvailabilityStatus(item, nowValue) === "available").length);
  }
  if (vehiclesReservedCount) {
    vehiclesReservedCount.textContent = String(allVehicles.filter((item) => getVehicleAvailabilityStatus(item, nowValue) === "reserved").length);
  }
  if (vehiclesServiceCount) {
    vehiclesServiceCount.textContent = String(allVehicles.filter((item) => {
      const status = getVehicleAvailabilityStatus(item, nowValue);
      return status === "service" || status === "inactive";
    }).length);
  }
  if (vehiclesHelper) {
    vehiclesHelper.textContent = visibleVehicles.length === allVehicles.length
      ? `Prikazano ${visibleVehicles.length} vozila.`
      : `Prikazano ${visibleVehicles.length} od ${allVehicles.length} vozila.`;
  }

  rebuildVehicleReservationVehicleOptions(vehicleReservationVehicleIdInput?.value || state.activeVehicleId || "");

  vehiclesList.replaceChildren(...visibleVehicles.map((vehicle) => {
    const availabilityStatus = getVehicleAvailabilityStatus(vehicle, nowValue);
    const card = document.createElement("article");
    card.className = `vehicle-list-row ${getVehicleStatusToneClass(availabilityStatus)}`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    if (String(vehicle.id) === String(state.activeVehicleId)) {
      card.classList.add("is-active");
    }

    const head = document.createElement("div");
    head.className = "vehicle-list-row-main";
    const titleWrap = document.createElement("div");
    titleWrap.className = "vehicle-list-row-copy";
    const title = document.createElement("h4");
    title.className = "vehicle-list-row-title";
    title.textContent = vehicle.name || "Vozilo";
    const summary = document.createElement("span");
    summary.className = "vehicle-list-row-meta";
    summary.textContent = [
      vehicle.plateNumber || "Bez registracije",
      vehicle.registrationExpiresOn ? `Registracija do ${formatCompactDate(vehicle.registrationExpiresOn)}` : "Registracija nije unesena",
      [vehicle.make, vehicle.model].filter(Boolean).join(" "),
      vehicle.category,
    ].filter(Boolean).join(" | ");
    titleWrap.append(title, summary);

    const statusBadge = document.createElement("span");
    statusBadge.className = `vehicle-status-badge ${getVehicleStatusToneClass(availabilityStatus)}`;
    statusBadge.textContent = getVehicleStatusLabel(availabilityStatus);
    head.append(statusBadge, titleWrap, createVehicleInlineStatusSelect(vehicle));

    const actions = document.createElement("div");
    actions.className = "vehicle-card-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "ghost-button";
    editButton.textContent = "Uredi";
    editButton.addEventListener("click", (event) => {
      event.stopPropagation();
      hydrateVehicleForm(vehicle);
    });
    const reserveButton = document.createElement("button");
    reserveButton.type = "button";
    reserveButton.className = "ghost-button";
    reserveButton.textContent = "Rezerviraj";
    reserveButton.addEventListener("click", (event) => {
      event.stopPropagation();
      selectVehicle(vehicle.id);
      openVehicleReservationComposer({ vehicleId: vehicle.id });
      requestAnimationFrame(() => {
        vehicleReservationPurposeInput?.focus({ preventScroll: true });
      });
    });
    actions.append(editButton, reserveButton);
    head.append(actions);

    const openVehicle = () => {
      selectVehicle(vehicle.id);
    };

    card.append(head);
    card.addEventListener("click", (event) => {
      if (isInteractiveWorkOrderTarget(event.target)) {
        return;
      }

      openVehicle();
    });
    card.addEventListener("keydown", (event) => {
      if (isInteractiveWorkOrderTarget(event.target)) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      openVehicle();
    });
    return card;
  }));

  vehiclesEmpty.hidden = visibleVehicles.length !== 0;
  if (visibleVehicles.length === 0) {
    const emptyCard = document.createElement("div");
    emptyCard.className = "offers-empty-card";
    emptyCard.textContent = "Nema vozila za odabrane filtere. Dodaj novo vozilo ili prosiri pretragu.";
    vehiclesList.replaceChildren(emptyCard);
  }

  const reservationVehicle = getVehicleFromReservationEditor() ?? getActiveVehicle();
  const reservations = reservationVehicle ? sortVehicleReservations(reservationVehicle.reservations ?? [], nowValue) : [];

  if (vehicleReservationsList) {
    vehicleReservationsList.replaceChildren(...reservations.map((reservation) => {
      const item = document.createElement("article");
      item.className = "vehicle-reservation-item";
      item.classList.add(getVehicleStatusToneClass(reservation.status || "reserved"));
      if (String(reservation.id) === String(state.activeVehicleReservationId)) {
        item.classList.add("is-active");
      }

      const head = document.createElement("div");
      head.className = "vehicle-reservation-item-head";
      const copy = document.createElement("div");
      copy.className = "vehicle-reservation-item-copy";
      const title = document.createElement("strong");
      title.textContent = reservation.purpose || "Rezervacija";
      const meta = document.createElement("span");
      meta.textContent = [
        getVehicleReservationStatusLabel(reservation.status),
        reservation.destination || "",
      ].filter(Boolean).join(" | ");
      copy.append(title, meta);
      head.append(
        copy,
        createVehicleReservationExecutorList(getVehicleReservationAssigneeLabels(reservation), { compact: true }),
        createVehicleReservationInlineStatusSelect(reservationVehicle, reservation),
      );

      const windowLabel = document.createElement("p");
      windowLabel.className = "vehicle-reservation-item-window";
      windowLabel.textContent = `${formatDateTime(reservation.startAt)} - ${formatDateTime(reservation.endAt)}`;

      const actions = document.createElement("div");
      actions.className = "vehicle-card-actions";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "ghost-button";
      editButton.textContent = "Uredi";
      editButton.addEventListener("click", () => {
        hydrateVehicleReservationForm(reservationVehicle, reservation);
      });
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "ghost-button";
      deleteButton.textContent = "Obrisi";
      deleteButton.addEventListener("click", () => {
        if (!window.confirm("Obrisati ovu rezervaciju?")) {
          return;
        }

        void runMutation(() => apiRequest(`/vehicles/${reservationVehicle.id}/reservations/${reservation.id}`, {
          method: "DELETE",
        }), vehicleReservationError).then((success) => {
          if (success) {
            state.activeVehicleReservationId = "";
            resetVehicleReservationForm({ clearSelection: true, vehicleId: reservationVehicle.id });
            renderVehiclesModule();
          }
        });
      });
      actions.append(editButton, deleteButton);

      item.append(head, windowLabel, actions);
      return item;
    }));
  }

  if (vehicleReservationsEmpty) {
    vehicleReservationsEmpty.hidden = Boolean(reservationVehicle && reservations.length > 0);
    vehicleReservationsEmpty.textContent = reservationVehicle
      ? "Ovo vozilo jos nema aktivnih rezervacija."
      : "Odaberi vozilo da pripremis rezervacije i povijest voznje.";
  }

  renderVehicleSchedule(visibleVehicles, nowValue);
  syncVehicleEditorSummary();
}

function renderActiveView() {
  const allowedGroups = getAllowedSidebarGroupsForView(state.activeView);

  if (!allowedGroups.includes(state.activeSidebarGroup)) {
    state.activeSidebarGroup = getSidebarGroupForView(state.activeView);
  }

  for (const [viewName, element] of Object.entries(workspaceViews)) {
    element.hidden = viewName !== state.activeView;
  }

  if (state.activeView !== "selfdash") {
    state.workOrderEditorOpen = false;
  }

  if (state.activeView !== "companies") {
    state.companyEditorOpen = false;
  }

  if (state.activeView !== "locations") {
    state.locationEditorOpen = false;
  }

  renderDashboardOverview();
  renderWorkOrderWorkspace();
  renderSidebarState();
  renderTopbarBreadcrumbs();
  syncWorkOrderEditorModal();
  syncCompanyEditorModal();
  syncLocationEditorModal();
  syncOfferEditorModal();
  syncVehicleEditorModal();
  syncVehicleReservationModal();
}

function renderSharedOptions() {
  const currentWorkOrderCompanyId = workOrderCompanyIdInput.value;
  const currentLocationCompanyId = locationCompanyIdInput.value;
  const currentFilterCompanyId = workOrderFilterCompanyInput.value || "all";
  const currentLocationId = workOrderLocationIdInput.value;
  const currentContactSlot = workOrderContactSlotInput.value;
  const currentSnapshotName = getSelectedContactName();
  const organizationOptions = state.organizations.map((organization) => ({
    value: organization.id,
    label: organization.name,
  }));
  const roleOptions = getIsSuperAdmin()
    ? [
      { value: "user", label: "User" },
      { value: "admin", label: "Admin" },
    ]
    : [
      { value: "user", label: "User" },
    ];

  replaceSelectOptions(workOrderStatusInput, WORK_ORDER_STATUS_OPTIONS, workOrderStatusInput.value || "Otvoreni RN");
  replaceSelectOptions(workOrderPriorityInput, PRIORITY_OPTIONS, workOrderPriorityInput.value || "Normal");
  replaceSelectOptions(reminderStatusInput, REMINDER_STATUS_OPTIONS, reminderStatusInput.value || "active");
  replaceSelectOptions(todoStatusInput, TODO_TASK_STATUS_OPTIONS, todoStatusInput?.value || "open");
  replaceSelectOptions(todoPriorityInput, PRIORITY_OPTIONS, todoPriorityInput?.value || "Normal");
  replaceSelectOptions(workOrderFilterStatusInput, [
    { value: "all", label: "Svi statusi" },
    ...WORK_ORDER_STATUS_OPTIONS,
  ], workOrderFilterStatusInput.value || "all");
  replaceSelectOptions(remindersFilterStatusInput, [
    { value: "all", label: "Svi statusi" },
    ...REMINDER_STATUS_OPTIONS,
  ], remindersFilterStatusInput.value || "all");
  replaceSelectOptions(todoFilterStatusInput, [
    { value: "all", label: "Svi statusi" },
    ...TODO_TASK_STATUS_OPTIONS,
  ], todoFilterStatusInput?.value || "all");
  replaceSelectOptions(todoFilterScopeInput, [
    { value: "all", label: "Sve" },
    { value: "assigned", label: "Dodijeljeno meni" },
    { value: "created", label: "Poslao sam" },
    { value: "unassigned", label: "Bez izvrsitelja" },
  ], todoFilterScopeInput?.value || "assigned");
  if (offerStatusInput) {
    replaceSelectOptions(offerStatusInput, OFFER_STATUS_OPTIONS, offerStatusInput.value || "draft");
    syncOfferStatusTheme();
  }
  if (vehicleStatusInput) {
    replaceSelectOptions(vehicleStatusInput, VEHICLE_STATUS_OPTIONS, vehicleStatusInput.value || "available");
  }
  if (vehicleReservationStatusInput) {
    replaceSelectOptions(vehicleReservationStatusInput, VEHICLE_RESERVATION_STATUS_OPTIONS, vehicleReservationStatusInput.value || "reserved");
  }
  if (vehiclesFilterStatusInput) {
    replaceSelectOptions(vehiclesFilterStatusInput, [
      { value: "all", label: "Sva dostupnost" },
      { value: "available", label: "Dostupno" },
      { value: "reserved", label: "Rezervirano" },
      { value: "service", label: "Servis" },
      { value: "inactive", label: "Van uporabe" },
    ], vehiclesFilterStatusInput.value || "all");
  }
  if (offersFilterStatusInput) {
    replaceSelectOptions(offersFilterStatusInput, [
      { value: "all", label: "Svi statusi" },
      ...OFFER_STATUS_OPTIONS,
    ], offersFilterStatusInput.value || "all");
  }

  rebuildWorkOrderCompanyOptions(currentWorkOrderCompanyId);
  rebuildLocationCompanyOptions(currentLocationCompanyId);
  rebuildWorkOrderFilterCompanyOptions(currentFilterCompanyId);
  rebuildWorkOrderMapFilterOptions();
  rebuildWorkOrderLocationOptions(currentLocationId);
  rebuildWorkOrderContactOptions(currentContactSlot, currentSnapshotName);
  rebuildReminderWorkOrderOptions(reminderWorkOrderIdInput?.value || "");
  rebuildReminderCompanyOptions(reminderCompanyIdInput?.value || "");
  renderReminderLinkPreview();
  rebuildTodoAssigneeOptions(todoAssigneeInput?.value || "");
  rebuildTodoDetailAssigneeOptions(todoDetailAssignee?.value || "");
  rebuildTodoWorkOrderOptions(todoWorkOrderIdInput?.value || "");
  rebuildVehicleReservationUserOptions(getVehicleReservationSelectedUserIds());
  rebuildVehicleReservationVehicleOptions(vehicleReservationVehicleIdInput?.value || state.activeVehicleId || "");
  rebuildOfferCompanyOptions(offerCompanyIdInput?.value || "");
  rebuildOfferLocationOptions(offerLocationIdInput?.value || "");
  rebuildOfferContactOptions(offerContactSlotInput?.value || "", getSelectedOfferContactSnapshot());
  syncCompanySelectionPreview(
    workOrderCompanyIdInput?.value || "",
    workOrderCompanyPreview,
    workOrderCompanyPreviewLogo,
    workOrderCompanyPreviewName,
    workOrderCompanyPreviewMeta,
  );
  syncCompanySelectionPreview(
    locationCompanyIdInput?.value || "",
    locationCompanyPreview,
    locationCompanyPreviewLogo,
    locationCompanyPreviewName,
    locationCompanyPreviewMeta,
  );
  syncCompanySelectionPreview(
    offerCompanyIdInput?.value || "",
    offerCompanyPreview,
    offerCompanyPreviewLogo,
    offerCompanyPreviewName,
    offerCompanyPreviewMeta,
  );
  renderTodoLinkPreview();

  if (vehicleScheduleDateInput) {
    vehicleScheduleDateInput.value = state.vehicleScheduleDate || new Date().toISOString().slice(0, 10);
  }

  if (organizationSwitcher) {
    replaceSelectOptions(organizationSwitcher, organizationOptions, state.activeOrganizationId || state.organizations[0]?.id || "");
  }

  if (userOrganizationIdInput) {
    replaceSelectOptions(
      userOrganizationIdInput,
      getIsSuperAdmin()
        ? organizationOptions
        : organizationOptions.filter((organization) => organization.value === state.activeOrganizationId),
      userOrganizationIdInput.value || state.activeOrganizationId || state.organizations[0]?.id || "",
    );
  }

  replaceSelectOptions(userRoleInput, roleOptions, getIsSuperAdmin() ? (userRoleInput.value || "admin") : "user");
  renderUserOrganizationMemberships(getIsSuperAdmin()
    ? getSelectedUserOrganizationIds()
    : [state.activeOrganizationId || state.organizations[0]?.id].filter(Boolean));

  if (userOrganizationField) {
    userOrganizationField.hidden = !getIsSuperAdmin() || state.organizations.length === 0;
  }

  if (userRoleField) {
    userRoleField.hidden = !getIsSuperAdmin();
  }

  if (userOrganizationMembershipsField) {
    userOrganizationMembershipsField.hidden = !getIsSuperAdmin();
  }

  if (loginContentPanel) {
    loginContentPanel.hidden = !getIsSuperAdmin();
  }

  if (signupRequestsPanel) {
    signupRequestsPanel.hidden = !getIsSuperAdmin();
  }

  renderWorkOrderEditorSummary();
}

function setActiveWorkOrderViewMode(mode, { render = true } = {}) {
  const nextMode = WORK_ORDER_VIEW_MODES.some((item) => item.value === mode) ? mode : "list";

  if (state.activeWorkOrderViewMode === nextMode && render) {
    renderWorkOrderWorkspace();
    renderTopbarBreadcrumbs();
    return;
  }

  state.activeWorkOrderViewMode = nextMode;

  if (render) {
    renderWorkOrderWorkspace();
    renderTopbarBreadcrumbs();
  }
}

function updateWorkOrderModeButtons() {
  workOrderModeButtons.forEach((button) => {
    const isActive = button.dataset.workOrderMode === state.activeWorkOrderViewMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function getFilteredWorkOrders() {
  return sortWorkOrders(filterWorkOrders(state.workOrders, {
    query: workOrderSearchInput.value,
    status: workOrderFilterStatusInput.value,
    companyId: workOrderFilterCompanyInput.value,
  }));
}

function getMapFilteredWorkOrders() {
  return getFilteredWorkOrders().filter((item) => {
    if (state.workOrderMap.filters.status !== "all" && item.status !== state.workOrderMap.filters.status) {
      return false;
    }

    if (state.workOrderMap.filters.priority !== "all" && item.priority !== state.workOrderMap.filters.priority) {
      return false;
    }

    if (state.workOrderMap.filters.region !== "all" && (item.region || "") !== state.workOrderMap.filters.region) {
      return false;
    }

    return true;
  });
}

function rebuildWorkOrderMapFilterOptions() {
  if (!workOrderMapFilterStatusInput || !workOrderMapFilterPriorityInput || !workOrderMapFilterRegionInput) {
    return;
  }

  const regionOptions = Array.from(
    new Set(
      state.workOrders
        .map((item) => String(item.region || "").trim())
        .filter(Boolean),
    ),
  )
    .sort((left, right) => left.localeCompare(right, "hr"))
    .map((region) => ({ value: region, label: region }));

  replaceSelectOptions(
    workOrderMapFilterStatusInput,
    [{ value: "all", label: "Svi statusi" }, ...WORK_ORDER_STATUS_OPTIONS],
    state.workOrderMap.filters.status,
  );
  replaceSelectOptions(
    workOrderMapFilterPriorityInput,
    [{ value: "all", label: "Svi prioriteti" }, ...PRIORITY_OPTIONS],
    state.workOrderMap.filters.priority,
  );
  replaceSelectOptions(
    workOrderMapFilterRegionInput,
    [{ value: "all", label: "Sve regije" }, ...regionOptions],
    state.workOrderMap.filters.region,
  );
}

function resetWorkOrderListWindow() {
  state.workOrderRenderLimit = WORK_ORDER_BATCH_SIZE;

  if (workOrdersTableWrap) {
    workOrdersTableWrap.scrollTop = 0;
  }
}

function loadMoreWorkOrders() {
  const total = getFilteredWorkOrders().length;

  if (state.workOrderRenderLimit >= total) {
    return;
  }

  state.workOrderRenderLimit = Math.min(state.workOrderRenderLimit + WORK_ORDER_BATCH_SIZE, total);
  renderCompactWorkOrdersList();
}

function createWorkOrderMiniExecutor(executor) {
  const tone = getExecutorTone(executor);
  const avatar = document.createElement("span");
  avatar.className = "work-order-mini-executor";
  avatar.title = executor;
  avatar.style.setProperty("--executor-bg", tone.bg);
  avatar.style.setProperty("--executor-fg", tone.fg);
  avatar.textContent = getUserInitials({ fullName: executor }) || "?";
  return avatar;
}

function createWorkOrderCalendarCard(workOrder) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "work-order-calendar-card";
  card.draggable = true;
  card.dataset.workOrderId = workOrder.id;

  const top = document.createElement("div");
  top.className = "work-order-calendar-card-top";

  const number = document.createElement("strong");
  number.className = "work-order-calendar-card-number";
  number.textContent = workOrder.workOrderNumber || "Bez broja";

  const status = createBadge(workOrder.status || "Otvoreni RN", statusBadgeClass(workOrder.status || "Otvoreni RN"));
  status.classList.add("work-order-calendar-card-status");
  top.append(number, status);

  const title = document.createElement("span");
  title.className = "work-order-calendar-card-title";
  title.textContent = workOrder.companyName || workOrder.locationName || "Radni nalog";

  const meta = document.createElement("span");
  meta.className = "work-order-calendar-card-meta";
  meta.textContent = workOrder.locationName || "Bez lokacije";
  const due = document.createElement("span");
  due.className = "work-order-calendar-card-due";
  due.textContent = workOrder.dueDate ? `Rok ${formatCompactDate(workOrder.dueDate)}` : "Bez roka";

  const footer = document.createElement("div");
  footer.className = "work-order-calendar-card-footer";
  footer.append(due);

  const executors = [workOrder.executor1, workOrder.executor2].filter(Boolean);
  if (executors.length > 0) {
    const executorWrap = document.createElement("div");
    executorWrap.className = "work-order-calendar-card-executors";
    executors.forEach((executor) => executorWrap.append(createWorkOrderMiniExecutor(executor)));
    footer.append(executorWrap);
  }

  card.append(top, title, meta, footer);

  if (workOrder.priority) {
    const priority = createBadge(
      getOptionLabel(PRIORITY_OPTIONS, workOrder.priority),
      priorityBadgeClass(workOrder.priority),
    );
    priority.classList.add("work-order-calendar-card-priority");
    card.append(priority);
  }

  card.addEventListener("click", () => {
    hydrateWorkOrderForm(workOrder);
  });

  card.addEventListener("dragstart", (event) => {
    state.workOrderCalendar.draggingWorkOrderId = workOrder.id;
    state.workOrderCalendar.draggingGroupIds = [];
    event.dataTransfer?.setData("text/plain", String(workOrder.id));
    event.dataTransfer?.setData("application/x-work-order-id", String(workOrder.id));
    event.dataTransfer?.setDragImage?.(card, 18, 18);
    window.requestAnimationFrame(() => {
      card.classList.add("is-dragging");
    });
  });

  card.addEventListener("dragend", () => {
    state.workOrderCalendar.draggingWorkOrderId = "";
    state.workOrderCalendar.draggingGroupIds = [];
    card.classList.remove("is-dragging");
    workOrderCalendarGrid?.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
  });

  return card;
}

function getWorkOrderExecutorNameOptions(currentValues = [], { includeEmpty = false } = {}) {
  const labels = Array.from(new Set(
    state.users
      .filter((user) => user?.isActive !== false)
      .map((user) => String(user.fullName || user.email || user.username || "").trim())
      .filter(Boolean),
  )).sort((left, right) => left.localeCompare(right, "hr"));

  const normalizedCurrentValues = (Array.isArray(currentValues) ? currentValues : [currentValues])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  const options = includeEmpty ? [{ value: "", label: "Bez izvrsitelja" }] : [];

  normalizedCurrentValues.forEach((currentValue) => {
    if (!currentValue || labels.includes(currentValue) || options.some((option) => option.value === currentValue)) {
      return;
    }

    options.push({
      value: currentValue,
      label: `${currentValue} (snapshot)`,
    });
  });

  labels.forEach((label) => {
    options.push({ value: label, label });
  });

  return options;
}

function bindWorkOrderInlineSelect(select, onChange) {
  const openPicker = () => {
    select.focus({ preventScroll: true });

    if (typeof select.showPicker === "function") {
      try {
        select.showPicker();
      } catch {
        // Ignore browsers that deny scripted picker opening.
      }
    }
  };

  ["pointerdown", "mousedown", "click", "keydown"].forEach((eventName) => {
    select.addEventListener(eventName, (event) => {
      event.stopPropagation();

      if ((eventName === "pointerdown" || eventName === "mousedown" || eventName === "click")
        && event instanceof MouseEvent
        && event.button === 0) {
        openPicker();
      }
    });
  });

  select.addEventListener("change", onChange);
}

function createWorkOrderCalendarCardControl(labelText, control) {
  const field = document.createElement("label");
  field.className = "work-order-calendar-card-control";
  field.dataset.preventRowOpen = "true";

  const label = document.createElement("span");
  label.className = "work-order-calendar-card-control-label";
  label.textContent = labelText;

  field.append(label, control);
  return field;
}

function getWorkOrderCalendarExecutorValues(workOrder = {}) {
  return [workOrder.executor1, workOrder.executor2]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 2);
}

function matchesWorkOrderExecutorSearch(option, query = "") {
  const normalizedQuery = normalizeLooseName(query);

  if (!normalizedQuery) {
    return true;
  }

  const normalizedLabel = normalizeLooseName(option.label || option.value || "");
  if (!normalizedLabel) {
    return false;
  }

  if (normalizedLabel.includes(normalizedQuery)) {
    return true;
  }

  return normalizedLabel.split(" ").some((token) => token.startsWith(normalizedQuery));
}

function setWorkOrderCalendarExecutorTriggerContent(trigger, values = []) {
  const selectedValues = (Array.isArray(values) ? values : [values])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .slice(0, 2);

  trigger.replaceChildren();
  trigger.title = selectedValues.length > 0 ? selectedValues.join(", ") : "Dodaj izvrsitelje";
  trigger.setAttribute("aria-label", selectedValues.length > 0 ? selectedValues.join(", ") : "Dodaj izvrsitelje");

  if (selectedValues.length > 0) {
    const stack = document.createElement("span");
    stack.className = "work-order-calendar-executor-trigger-stack";
    selectedValues.forEach((value) => {
      const avatar = createWorkOrderMiniExecutor(value);
      avatar.removeAttribute("title");
      stack.append(avatar);
    });
    trigger.append(stack);
    return;
  }

  const empty = document.createElement("span");
  empty.className = "work-order-calendar-executor-trigger-empty";
  empty.textContent = "+";
  trigger.append(empty);
}

function createWorkOrderCalendarExecutorPicker(workOrder) {
  const wrapper = document.createElement("div");
  wrapper.className = "work-order-calendar-executor-picker";
  wrapper.dataset.preventRowOpen = "true";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "work-order-calendar-executor-trigger";
  trigger.dataset.preventRowOpen = "true";
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");

  const getCurrentValues = () => getWorkOrderCalendarExecutorValues(workOrder);
  const setPendingState = (isPending) => {
    wrapper.classList.toggle("is-pending", isPending);
    trigger.disabled = isPending;
  };
  const setCurrentValues = (values) => {
    setWorkOrderCalendarExecutorTriggerContent(trigger, values);
  };

  const positionMenuPortal = (menu) => {
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = triggerRect.left;
    let top = triggerRect.bottom + 8;

    if (left + menuRect.width > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - menuRect.width - 12);
    }

    if (top + menuRect.height > viewportHeight - 12) {
      top = Math.max(12, triggerRect.top - menuRect.height - 8);
    }

    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.style.minWidth = `${Math.max(236, Math.round(triggerRect.width + 108))}px`;
  };

  const closeMenu = () => {
    wrapper.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    if (wrapper._menuPortal) {
      wrapper._menuPortal.remove();
      wrapper._menuPortal = null;
    }
  };

  wrapper._closeMenu = closeMenu;

  const openMenu = () => {
    closeOpenWorkOrderStatusMenus(wrapper);

    if (wrapper._menuPortal) {
      return;
    }

    let draftValues = getCurrentValues();
    let searchQuery = "";

    const menu = document.createElement("div");
    menu.className = "work-item-status-menu work-item-status-menu-portal work-order-calendar-executor-menu-portal";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-label", "Izbor izvrsitelja");

    ["pointerdown", "mousedown", "click", "keydown"].forEach((eventName) => {
      menu.addEventListener(eventName, (event) => {
        event.stopPropagation();
      });
    });

    const searchWrap = document.createElement("div");
    searchWrap.className = "work-order-calendar-executor-search";

    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "work-order-calendar-executor-search-input";
    searchInput.placeholder = "Trazi po imenu ili prezimenu";
    searchInput.autocomplete = "off";
    searchInput.spellcheck = false;
    searchWrap.append(searchInput);

    const selection = document.createElement("div");
    selection.className = "work-order-calendar-executor-selection";

    const helper = document.createElement("p");
    helper.className = "work-order-calendar-executor-helper";

    const optionsList = document.createElement("div");
    optionsList.className = "work-order-calendar-executor-options";

    const footer = document.createElement("div");
    footer.className = "work-order-calendar-executor-footer";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "ghost-button work-order-calendar-executor-clear";
    clearButton.textContent = "Ocisti";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "primary-button work-order-calendar-executor-save";
    saveButton.textContent = "Spremi";

    const selectionsEqual = (leftValues, rightValues) => {
      if (leftValues.length !== rightValues.length) {
        return false;
      }

      return leftValues.every((value, index) => value === rightValues[index]);
    };

    const toggleDraftValue = (value) => {
      const normalizedValue = String(value ?? "").trim();
      if (!normalizedValue) {
        return;
      }

      if (draftValues.includes(normalizedValue)) {
        draftValues = draftValues.filter((entry) => entry !== normalizedValue);
        return;
      }

      if (draftValues.length >= 2) {
        return;
      }

      draftValues = [...draftValues, normalizedValue];
    };

    const renderSelection = () => {
      selection.replaceChildren();

      if (draftValues.length === 0) {
        const empty = document.createElement("span");
        empty.className = "work-order-calendar-executor-selection-empty";
        empty.textContent = "Bez izvrsitelja";
        selection.append(empty);
        return;
      }

      draftValues.forEach((value) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "work-order-calendar-executor-chip";
        chip.title = `Makni ${value}`;

        const avatar = createWorkOrderMiniExecutor(value);
        avatar.removeAttribute("title");

        const label = document.createElement("span");
        label.className = "work-order-calendar-executor-chip-label";
        label.textContent = value;

        const remove = document.createElement("span");
        remove.className = "work-order-calendar-executor-chip-remove";
        remove.setAttribute("aria-hidden", "true");
        remove.textContent = "x";

        chip.append(avatar, label, remove);
        chip.addEventListener("click", (event) => {
          event.stopPropagation();
          draftValues = draftValues.filter((entry) => entry !== value);
          syncMenuState();
        });

        selection.append(chip);
      });
    };

    const renderOptions = () => {
      optionsList.replaceChildren();

      const visibleOptions = getWorkOrderExecutorNameOptions(getCurrentValues())
        .filter((option) => matchesWorkOrderExecutorSearch(option, searchQuery));

      if (visibleOptions.length === 0) {
        const empty = document.createElement("p");
        empty.className = "work-order-calendar-executor-empty";
        empty.textContent = "Nema izvrsitelja za ovaj pojam.";
        optionsList.append(empty);
        return;
      }

      visibleOptions.forEach((option) => {
        const isSelected = draftValues.includes(option.value);
        const optionButton = document.createElement("button");
        optionButton.type = "button";
        optionButton.className = "work-item-status-option work-order-calendar-executor-option";
        optionButton.classList.toggle("is-selected", isSelected);
        optionButton.setAttribute("role", "menuitemcheckbox");
        optionButton.setAttribute("aria-checked", String(isSelected));
        optionButton.disabled = !isSelected && draftValues.length >= 2;

        const avatar = document.createElement("span");
        avatar.className = "work-order-calendar-executor-option-avatar";
        avatar.textContent = getUserInitials({ fullName: option.value }) || "?";

        const label = document.createElement("span");
        label.className = "work-order-calendar-executor-option-label";
        label.textContent = option.label;

        const marker = document.createElement("span");
        marker.className = "work-order-calendar-executor-option-marker";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = isSelected ? "✓" : "+";

        optionButton.append(avatar, label, marker);
        optionButton.addEventListener("click", (event) => {
          event.stopPropagation();
          toggleDraftValue(option.value);
          syncMenuState();
          searchInput.focus({ preventScroll: true });
        });

        optionsList.append(optionButton);
      });
    };

    const syncMenuState = () => {
      renderSelection();
      renderOptions();
      helper.textContent = draftValues.length >= 2
        ? "Odabrana su 2 izvrsitelja. Makni jednog za novi odabir."
        : "Odaberi do 2 izvrsitelja.";
      clearButton.disabled = draftValues.length === 0;
      saveButton.disabled = selectionsEqual(draftValues, getCurrentValues());
      requestAnimationFrame(() => positionMenuPortal(menu));
    };

    clearButton.addEventListener("click", (event) => {
      event.stopPropagation();
      draftValues = [];
      syncMenuState();
      searchInput.focus({ preventScroll: true });
    });

    saveButton.addEventListener("click", (event) => {
      event.stopPropagation();

      const nextValues = [...draftValues];
      if (selectionsEqual(nextValues, getCurrentValues())) {
        closeMenu();
        return;
      }

      setPendingState(true);
      searchInput.disabled = true;
      clearButton.disabled = true;
      saveButton.disabled = true;

      void runMutation(() => apiRequest(`/work-orders/${workOrder.id}`, {
        method: "PATCH",
        body: {
          executor1: nextValues[0] || "",
          executor2: nextValues[1] || "",
        },
      })).then((success) => {
        setPendingState(false);

        if (!success) {
          searchInput.disabled = false;
          syncMenuState();
          return;
        }

        const updatedItem = state.workOrders.find((entry) => String(entry.id) === String(workOrder.id));
        const updatedValues = getWorkOrderCalendarExecutorValues(updatedItem ?? {
          executor1: nextValues[0] || "",
          executor2: nextValues[1] || "",
        });

        setCurrentValues(updatedValues);
        closeMenu();
      });
    });

    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value || "";
      renderOptions();
      requestAnimationFrame(() => positionMenuPortal(menu));
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        trigger.focus({ preventScroll: true });
        return;
      }

      if (event.key !== "Enter") {
        return;
      }

      const visibleOptions = getWorkOrderExecutorNameOptions(getCurrentValues())
        .filter((option) => matchesWorkOrderExecutorSearch(option, searchQuery));

      if (visibleOptions.length !== 1) {
        return;
      }

      event.preventDefault();
      toggleDraftValue(visibleOptions[0].value);
      syncMenuState();
    });

    footer.append(clearButton, saveButton);
    menu.append(searchWrap, selection, helper, optionsList, footer);

    syncMenuState();

    document.body.append(menu);
    wrapper._menuPortal = menu;
    wrapper.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    positionMenuPortal(menu);
    requestAnimationFrame(() => {
      positionMenuPortal(menu);
      searchInput.focus({ preventScroll: true });
      searchInput.select();
    });
  };

  ["pointerdown", "mousedown", "click", "keydown"].forEach((eventName) => {
    wrapper.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (wrapper.classList.contains("is-open")) {
      closeOpenWorkOrderStatusMenus();
      return;
    }
    openMenu();
  });

  setCurrentValues(getCurrentValues());
  wrapper.append(trigger);
  return wrapper;
}

function createWorkOrderCalendarExecutorSelect(workOrder, slotIndex = 1) {
  const select = document.createElement("select");
  select.className = "work-item-status-select work-order-calendar-card-select work-order-calendar-card-executor-select";
  select.dataset.preventRowOpen = "true";
  select.setAttribute("aria-label", slotIndex === 1 ? "Izvrsitelj 1" : "Izvrsitelj 2");
  const currentValue = slotIndex === 1 ? (workOrder.executor1 || "") : (workOrder.executor2 || "");
  replaceSelectOptions(select, getWorkOrderExecutorNameOptions(currentValue, { includeEmpty: true }), currentValue);

  bindWorkOrderInlineSelect(select, () => {
    const previousValue = currentValue;
    const nextValue = select.value;
    const nextExecutor1 = slotIndex === 1 ? nextValue : (workOrder.executor1 || "");
    const nextExecutor2 = slotIndex === 2 ? nextValue : (workOrder.executor2 || "");
    select.disabled = true;

    void runMutation(() => apiRequest(`/work-orders/${workOrder.id}`, {
      method: "PATCH",
      body: {
        executor1: nextExecutor1,
        executor2: nextExecutor2,
      },
    })).then((success) => {
      const updatedItem = state.workOrders.find((entry) => String(entry.id) === String(workOrder.id));
      const refreshedValue = slotIndex === 1 ? (updatedItem?.executor1 || nextValue) : (updatedItem?.executor2 || nextValue);

      if (!success) {
        replaceSelectOptions(select, getWorkOrderExecutorNameOptions(previousValue), previousValue);
      } else if (select.isConnected) {
        replaceSelectOptions(select, getWorkOrderExecutorNameOptions(refreshedValue), refreshedValue);
      }

      if (select.isConnected) {
        select.disabled = false;
      }
    });
  });

  return select;
}

function getWorkOrderCalendarDragPayload(event) {
  const rawGroupIds = event.dataTransfer?.getData("application/x-work-order-group-ids");
  const groupIds = rawGroupIds
    ? rawGroupIds.split(",").map((value) => String(value ?? "").trim()).filter(Boolean)
    : [];

  if (groupIds.length > 0 || state.workOrderCalendar.draggingGroupIds.length > 0) {
    return {
      type: "group",
      ids: groupIds.length > 0 ? groupIds : [...state.workOrderCalendar.draggingGroupIds],
    };
  }

  const workOrderId = event.dataTransfer?.getData("application/x-work-order-id")
    || event.dataTransfer?.getData("text/plain")
    || state.workOrderCalendar.draggingWorkOrderId
    || "";

  if (!workOrderId) {
    return null;
  }

  return {
    type: "item",
    ids: [workOrderId],
  };
}

function hasActiveWorkOrderCalendarDrag() {
  return Boolean(
    state.workOrderCalendar.draggingWorkOrderId
    || (Array.isArray(state.workOrderCalendar.draggingGroupIds) && state.workOrderCalendar.draggingGroupIds.length > 0),
  );
}

function bindWorkOrderCalendarDropTarget(target, onDrop, { stopPropagation = false } = {}) {
  if (!target) {
    return;
  }

  target.addEventListener("dragover", (event) => {
    if (!hasActiveWorkOrderCalendarDrag()) {
      return;
    }

    if (stopPropagation) {
      event.stopPropagation();
    }

    event.preventDefault();
    target.classList.add("is-drop-target");
  });

  target.addEventListener("dragleave", (event) => {
    if (stopPropagation) {
      event.stopPropagation();
    }

    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && target.contains(relatedTarget)) {
      return;
    }

    target.classList.remove("is-drop-target");
  });

  target.addEventListener("drop", (event) => {
    if (stopPropagation) {
      event.stopPropagation();
    }

    event.preventDefault();
    target.classList.remove("is-drop-target");

    const dragPayload = getWorkOrderCalendarDragPayload(event);
    if (!dragPayload) {
      return;
    }

    onDrop(dragPayload, event);
  });
}

function createWorkOrderCalendarAddButton(dateKey) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "work-order-calendar-day-add";
  button.textContent = "+";
  button.title = `Novi RN za ${formatCompactDate(dateKey)}`;
  button.setAttribute("aria-label", `Novi RN za ${formatCompactDate(dateKey)}`);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    focusWorkOrderComposer({ dueDate: dateKey });
  });
  return button;
}

function resolveWorkOrderCalendarLaneConfig(laneTarget = null) {
  const laneConfig = Array.isArray(laneTarget)
    ? { executors: laneTarget, hasExecutors: true, teamLabel: null, hasTeamLabel: false }
    : {
      executors: Array.isArray(laneTarget?.executors) ? laneTarget.executors : [],
      hasExecutors: Array.isArray(laneTarget?.executors),
      teamLabel: typeof laneTarget?.teamLabel === "string" ? laneTarget.teamLabel : null,
      hasTeamLabel: Object.prototype.hasOwnProperty.call(laneTarget ?? {}, "teamLabel"),
    };
  return laneConfig;
}

function buildWorkOrderCalendarDropBody(workOrder, targetDate, laneTarget = null) {
  if (!workOrder) {
    return null;
  }

  const laneConfig = resolveWorkOrderCalendarLaneConfig(laneTarget);
  const nextDate = targetDate || "";
  const nextExecutors = laneConfig.hasExecutors
    ? laneConfig.executors
    : [workOrder.executor1 ?? "", workOrder.executor2 ?? ""];
  const nextExecutor1 = nextExecutors[0] ?? "";
  const nextExecutor2 = nextExecutors[1] ?? "";
  const nextTeamLabel = laneConfig.hasTeamLabel
    ? laneConfig.teamLabel
    : (workOrder.teamLabel ?? "");
  const sameDate = String(workOrder.dueDate ?? "") === String(nextDate ?? "");
  const sameExecutors = String(workOrder.executor1 ?? "") === String(nextExecutor1)
    && String(workOrder.executor2 ?? "") === String(nextExecutor2);
  const sameTeamLabel = String(workOrder.teamLabel ?? "") === String(nextTeamLabel ?? "");

  if (sameDate && (!laneConfig.hasExecutors || sameExecutors) && (!laneConfig.hasTeamLabel || sameTeamLabel)) {
    return null;
  }

  const body = {
    dueDate: nextDate,
  };

  if (laneConfig.hasExecutors) {
    body.executor1 = nextExecutor1;
    body.executor2 = nextExecutor2;
  }

  if (laneConfig.hasTeamLabel) {
    body.teamLabel = nextTeamLabel;
  }

  return body;
}

async function applyWorkOrderCalendarDrop(workOrderId, targetDate, laneTarget = null) {
  const workOrder = state.workOrders.find((item) => String(item.id) === String(workOrderId));
  const body = buildWorkOrderCalendarDropBody(workOrder, targetDate, laneTarget);

  if (!workOrder || !body) {
    return;
  }

  state.workOrderCalendar.draggingWorkOrderId = "";
  state.workOrderCalendar.draggingGroupIds = [];

  await runMutation(() => apiRequest(`/work-orders/${workOrder.id}`, {
    method: "PATCH",
    body,
  }));
}

async function applyWorkOrderCalendarGroupDrop(workOrderIds = [], targetDate, laneTarget = null) {
  const uniqueIds = Array.from(new Set(
    workOrderIds.map((value) => String(value ?? "").trim()).filter(Boolean),
  ));

  if (uniqueIds.length === 0) {
    return;
  }

  const updates = uniqueIds
    .map((workOrderId) => {
      const workOrder = state.workOrders.find((item) => String(item.id) === workOrderId);
      const body = buildWorkOrderCalendarDropBody(workOrder, targetDate, laneTarget);

      if (!workOrder || !body) {
        return null;
      }

      return { workOrderId, body };
    })
    .filter(Boolean);

  state.workOrderCalendar.draggingWorkOrderId = "";
  state.workOrderCalendar.draggingGroupIds = [];

  if (updates.length === 0) {
    return;
  }

  await runMutation(async () => {
    let payload = null;

    for (const update of updates) {
      payload = await apiRequest(`/work-orders/${update.workOrderId}`, {
        method: "PATCH",
        body: update.body,
      });
    }

    return payload;
  });
}

async function applyWorkOrderCalendarDropPayload(dragPayload, targetDate, laneTarget = null) {
  if (!dragPayload || !Array.isArray(dragPayload.ids) || dragPayload.ids.length === 0) {
    return;
  }

  if (dragPayload.type === "group" || dragPayload.ids.length > 1) {
    await applyWorkOrderCalendarGroupDrop(dragPayload.ids, targetDate, laneTarget);
    return;
  }

  await applyWorkOrderCalendarDrop(dragPayload.ids[0], targetDate, laneTarget);
}

function renderWorkOrderCalendarSidePanels({
  unscheduled = [],
  unassigned = [],
  unscheduledMessage = "Povuci karticu na dan kako bi se dodijelila u raspored.",
  unassignedMessage = "Dodijeli izvršitelje pa će se RN pojaviti u rasporedu.",
} = {}) {
  if (workOrderCalendarSidepanels) {
    workOrderCalendarSidepanels.hidden = !state.workOrderCalendar.showUnscheduled || (unscheduled.length === 0 && unassigned.length === 0);
  }

  if (workOrderCalendarUnscheduled) {
    workOrderCalendarUnscheduled.hidden = unscheduled.length === 0 || !state.workOrderCalendar.showUnscheduled;
    workOrderCalendarUnscheduled.replaceChildren();

    if (unscheduled.length > 0 && state.workOrderCalendar.showUnscheduled) {
      const head = document.createElement("div");
      head.className = "work-order-calendar-unscheduled-head";

      const label = document.createElement("strong");
      label.textContent = "Bez datuma";

      const meta = document.createElement("span");
      meta.textContent = unscheduledMessage;
      head.append(label, meta);

      const list = document.createElement("div");
      list.className = "work-order-calendar-unscheduled-list";
      unscheduled.forEach((workOrder) => {
        list.append(createWorkOrderCalendarCard(workOrder));
      });

      workOrderCalendarUnscheduled.append(head, list);
    }
  }

  if (workOrderCalendarUnassigned) {
    workOrderCalendarUnassigned.hidden = unassigned.length === 0 || !state.workOrderCalendar.showUnscheduled;
    workOrderCalendarUnassigned.replaceChildren();

    if (unassigned.length > 0 && state.workOrderCalendar.showUnscheduled) {
      const head = document.createElement("div");
      head.className = "work-order-calendar-unscheduled-head";

      const label = document.createElement("strong");
      label.textContent = "Bez izvršitelja";

      const meta = document.createElement("span");
      meta.textContent = unassignedMessage;
      head.append(label, meta);

      const list = document.createElement("div");
      list.className = "work-order-calendar-unscheduled-list";
      unassigned.forEach((workOrder) => {
        list.append(createWorkOrderCalendarCard(workOrder));
      });

      workOrderCalendarUnassigned.append(head, list);
    }
  }
}

function createWorkOrderCalendarDayCell(day) {
  const cell = document.createElement("div");
  cell.className = "work-order-calendar-month-day";
  cell.classList.toggle("is-today", Boolean(day.isToday));
  cell.classList.toggle("is-outside-month", day.inMonth === false);
  cell.dataset.date = day.key;

  bindWorkOrderCalendarDropTarget(cell, (dragPayload) => {
    void applyWorkOrderCalendarDropPayload(dragPayload, day.key);
  });

  const top = document.createElement("div");
  top.className = "work-order-calendar-month-day-top";

  const topCopy = document.createElement("div");
  topCopy.className = "work-order-calendar-month-day-copy";

  const dayLabel = document.createElement("span");
  dayLabel.className = "work-order-calendar-day-label";
  dayLabel.textContent = new Intl.DateTimeFormat("hr-HR", { weekday: "short" }).format(parseDateValue(day.key));

  const dayDate = document.createElement("strong");
  dayDate.className = "work-order-calendar-day-date";
  dayDate.textContent = formatCompactDate(day.key);

  const dayMeta = document.createElement("span");
  dayMeta.className = "work-order-calendar-day-meta";
  dayMeta.textContent = day.items.length === 0 ? "Bez RN" : `${day.items.length} RN`;

  topCopy.append(dayLabel, dayDate, dayMeta);
  top.append(topCopy, createWorkOrderCalendarAddButton(day.key));

  const body = document.createElement("div");
  body.className = "work-order-calendar-month-day-body";

  if (day.items.length === 0) {
    const placeholder = document.createElement("span");
    placeholder.className = "work-order-calendar-cell-placeholder";
    placeholder.textContent = "Povuci ovdje";
    body.append(placeholder);
  } else {
    body.append(createWorkOrderCalendarExecutorGroup(day.items, { targetDate: day.key }));
  }

  cell.append(top, body);
  return cell;
}

function renderWorkOrderCalendarWeekMode(filtered) {
  const calendar = buildWorkOrderCalendarWeekColumns(filtered, state.workOrderCalendar.weekStart);
  const visibleDays = getVisibleCalendarWeekDays(
    calendar.days.map((day) => ({
      ...day,
      inMonth: true,
      isToday: day.key === toDateKey(new Date()),
    })),
    state.workOrderCalendar.showWeekends,
  );
  const scheduledCount = visibleDays.reduce((sum, day) => sum + day.items.length, 0);
  const firstVisibleDay = visibleDays[0]?.key ?? calendar.weekStart;
  const lastVisibleDay = visibleDays[visibleDays.length - 1]?.key ?? firstVisibleDay;

  if (workOrderCalendarRange) {
    workOrderCalendarRange.textContent = formatCalendarWeekRangeLabel(firstVisibleDay, lastVisibleDay);
  }

  if (workOrderCalendarMeta) {
    workOrderCalendarMeta.textContent = `${formatCalendarMonthLabel(firstVisibleDay)} · ${scheduledCount} raspoređenih · ${calendar.unscheduled.length} bez datuma · ${calendar.unassigned.length} bez izvršitelja`;
  }

  syncWorkOrderCalendarToolbar(calendar.unscheduled.length);
  renderWorkOrderCalendarSidePanels({
    unscheduled: calendar.unscheduled,
    unassigned: calendar.unassigned,
  });

  const fragment = document.createDocumentFragment();
  const weekSection = document.createElement("section");
  weekSection.className = "work-order-calendar-month-week";

  const weekHead = document.createElement("div");
  weekHead.className = "work-order-calendar-month-week-head";

  const weekTitle = document.createElement("strong");
  weekTitle.textContent = `Tjedan ${getCalendarIsoWeekNumber(firstVisibleDay)}`;

  const weekMeta = document.createElement("span");
  weekMeta.textContent = `${formatCalendarMonthLabel(firstVisibleDay)} · ${scheduledCount === 1 ? "1 RN" : `${scheduledCount} RN`}`;

  weekHead.append(weekTitle, weekMeta);

  const weekGrid = document.createElement("div");
  weekGrid.className = "work-order-calendar-month-grid";
  weekGrid.style.gridTemplateColumns = `repeat(${visibleDays.length}, minmax(0, 1fr))`;
  weekGrid.style.minWidth = "0";
  weekGrid.style.width = "100%";
  visibleDays.forEach((day) => {
    weekGrid.append(createWorkOrderCalendarDayCell(day));
  });

  weekSection.append(weekHead, weekGrid);
  fragment.append(weekSection);
  workOrderCalendarGrid.replaceChildren(fragment);
  queueWorkOrderCalendarGridShellHeightSync();
}

function renderWorkOrderCalendarMonthMode(filtered) {
  const calendar = buildWorkOrderCalendarMonthWeeks(filtered, state.workOrderCalendar.weekStart);
  const scheduledCount = calendar.weeks.reduce((sum, week) => sum + week.totalCount, 0);
  const visibleMonthItems = filtered.filter((item) => {
    const dueDate = String(item?.dueDate ?? "").trim();
    return dueDate && dueDate >= calendar.monthStart && dueDate <= calendar.monthEnd;
  });
  const unassignedCount = visibleMonthItems.filter((item) => !item.executor1 && !item.executor2).length;
  const weekNumbers = calendar.weeks.map((week) => getCalendarIsoWeekNumber(week.weekStart)).filter(Boolean);
  const weekNumberLabel = weekNumbers.length > 0
    ? `Tjedni ${weekNumbers[0]}-${weekNumbers[weekNumbers.length - 1]}`
    : "Tjedni";

  if (workOrderCalendarRange) {
    workOrderCalendarRange.textContent = formatCalendarMonthLabel(calendar.anchorDate);
  }

  if (workOrderCalendarMeta) {
    workOrderCalendarMeta.textContent = `${weekNumberLabel} · ${scheduledCount} raspoređenih · ${calendar.unscheduled.length} bez datuma · ${unassignedCount} bez izvršitelja`;
  }

  syncWorkOrderCalendarToolbar(calendar.unscheduled.length);
  renderWorkOrderCalendarSidePanels({
    unscheduled: calendar.unscheduled,
    unassigned: [],
  });

  const fragment = document.createDocumentFragment();

  calendar.weeks.forEach((week) => {
    const visibleDays = getVisibleCalendarWeekDays(week.days, state.workOrderCalendar.showWeekends);
    const weekSection = document.createElement("section");
    weekSection.className = "work-order-calendar-month-week";

    const weekHead = document.createElement("div");
    weekHead.className = "work-order-calendar-month-week-head";

    const weekTitle = document.createElement("strong");
    weekTitle.textContent = `Tjedan ${getCalendarIsoWeekNumber(week.weekStart)}`;

    const weekMeta = document.createElement("span");
    weekMeta.textContent = `${formatCompactDate(visibleDays[0]?.key || week.weekStart)} - ${formatCompactDate(
      visibleDays[visibleDays.length - 1]?.key || week.weekStart,
    )} · ${week.totalCount === 1 ? "1 RN" : `${week.totalCount} RN`}`;

    weekHead.append(weekTitle, weekMeta);

    const weekGrid = document.createElement("div");
    weekGrid.className = "work-order-calendar-month-grid";
    weekGrid.style.gridTemplateColumns = `repeat(${visibleDays.length}, minmax(0, 1fr))`;
    weekGrid.style.minWidth = "0";
    weekGrid.style.width = "100%";

    visibleDays.forEach((day) => {
      weekGrid.append(createWorkOrderCalendarDayCell(day));
    });

    weekSection.append(weekHead, weekGrid);
    fragment.append(weekSection);
  });

  workOrderCalendarGrid.replaceChildren(fragment);
  queueWorkOrderCalendarGridShellHeightSync();
}

function renderWorkOrderCalendarView() {
  if (!workOrderCalendarView || !workOrderCalendarGrid) {
    return;
  }

  bindWorkOrderCalendarGrabScroll();

  const filtered = getFilteredWorkOrders();
  if (state.workOrderCalendar.displayMode === "month") {
    renderWorkOrderCalendarMonthMode(filtered);
    return;
  }

  renderWorkOrderCalendarWeekMode(filtered);
}

function getWorkOrderMapMarkerTone(status) {
  switch (status) {
    case "Ovjeren RN":
      return { fill: "#c89a18", stroke: "#8c6807" };
    case "Gotov RN":
      return { fill: "#bde4c6", stroke: "#5f9f71" };
    case "Fakturiran RN":
      return { fill: "#2e7d55", stroke: "#18462f" };
    case "Storno RN":
      return { fill: "#68707c", stroke: "#3f4550" };
    default:
      return { fill: "#d8dde5", stroke: "#97a1af" };
  }
}

function getWorkOrderCalendarTone(status) {
  const tone = getWorkOrderMapMarkerTone(status);
  return {
    accent: tone.stroke,
    soft: `color-mix(in srgb, ${tone.fill} 28%, #ffffff)`,
    border: `color-mix(in srgb, ${tone.stroke} 18%, #e6eaf3)`,
  };
}

function getWorkOrderMapMarkerSignature(markers = []) {
  return markers
    .map((marker) => `${marker.workOrderId}:${marker.latitude.toFixed(4)}:${marker.longitude.toFixed(4)}`)
    .sort()
    .join("|");
}

function buildWorkOrderMapPopup(marker) {
  return `
    <div class="leaflet-work-order-popup">
      <strong>${marker.workOrderNumber || "Bez broja"}</strong>
      <span>${marker.companyName || "Bez tvrtke"}</span>
      <span>${[marker.locationName, marker.region].filter(Boolean).join(" · ") || "Bez lokacije"}</span>
      <span>${marker.dueDate ? `Rok ${formatCompactDate(marker.dueDate)}` : "Bez roka"}</span>
    </div>
  `;
}

function buildWorkOrderLeafletPopup(marker) {
  const workOrder = state.workOrders.find((item) => String(item.id) === String(marker.workOrderId)) ?? marker;
  const popup = document.createElement("article");
  popup.className = "work-order-map-popup-card";
  const companyName = workOrder.companyName || marker.companyName || "Radni nalog";
  const locationLabel = [workOrder.locationName || marker.locationName, workOrder.region || marker.region]
    .filter(Boolean)
    .join(" · ") || "Bez lokacije";
  const dueLabel = workOrder.dueDate || marker.dueDate
    ? formatCompactDate(workOrder.dueDate || marker.dueDate)
    : "Bez roka";
  const coordinatesLabel = workOrder.coordinates
    || marker.coordinates
    || `${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)}`;

  const top = document.createElement("div");
  top.className = "work-order-map-popup-top";

  const kicker = document.createElement("span");
  kicker.className = "work-order-map-popup-kicker";
  kicker.textContent = companyName;

  const actions = document.createElement("div");
  actions.className = "work-order-map-popup-actions";

  const openWorkOrderButton = document.createElement("button");
  openWorkOrderButton.type = "button";
  openWorkOrderButton.className = "work-order-map-popup-icon-button";
  openWorkOrderButton.title = "Otvori RN";
  openWorkOrderButton.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5h6.5V10M12.5 3.5 7 9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/><path d="M10.5 7.5v4A1 1 0 0 1 9.5 12.5h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/></svg>';
  openWorkOrderButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextWorkOrder = state.workOrders.find((item) => String(item.id) === String(marker.workOrderId));
    if (nextWorkOrder) {
      hydrateWorkOrderForm(nextWorkOrder);
    }
  });

  const openMapsLink = document.createElement("a");
  openMapsLink.className = "work-order-map-popup-icon-button";
  openMapsLink.href = `https://www.google.com/maps?q=${marker.latitude},${marker.longitude}`;
  openMapsLink.target = "_blank";
  openMapsLink.rel = "noreferrer";
  openMapsLink.title = "Otvori u karti";
  openMapsLink.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 13.25V4.1a.6.6 0 0 1 .42-.57l2.96-.98a.6.6 0 0 1 .38 0l2.48.82a.6.6 0 0 0 .38 0l2.45-.82a.6.6 0 0 1 .79.57v9.13a.6.6 0 0 1-.42.57l-2.96.98a.6.6 0 0 1-.38 0l-2.48-.82a.6.6 0 0 0-.38 0l-2.45.82a.6.6 0 0 1-.79-.57Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.2"/><circle cx="10.95" cy="6.15" r="1.2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
  openMapsLink.addEventListener("click", (event) => event.stopPropagation());

  actions.append(openWorkOrderButton, openMapsLink);
  top.append(kicker, actions);

  const title = document.createElement("strong");
  title.className = "work-order-map-popup-title";
  title.textContent = workOrder.workOrderNumber || marker.workOrderNumber || "Bez broja";

  const details = document.createElement("div");
  details.className = "work-order-map-popup-details";
  details.append(
    createWorkOrderMapPopupDetail("Lokacija", locationLabel, true),
    createWorkOrderMapPopupDetail("Rok", dueLabel),
    createWorkOrderMapPopupDetail("Koordinate", coordinatesLabel),
  );

  const meta = document.createElement("div");
  meta.className = "work-order-map-popup-meta";

  const statusWrap = document.createElement("label");
  statusWrap.className = "work-order-map-popup-status";

  const statusLabel = document.createElement("span");
  statusLabel.className = "work-order-map-popup-status-label";
  statusLabel.textContent = "Status";

  const statusSelect = document.createElement("select");
  statusSelect.className = "work-item-status-select work-order-map-popup-status-select";
  statusSelect.dataset.preventRowOpen = "true";

  WORK_ORDER_STATUS_OPTIONS.forEach((option) => {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    statusSelect.append(node);
  });

  statusSelect.value = workOrder.status || marker.status || "Otvoreni RN";
  updateWorkOrderStatusSelectTheme(statusSelect, statusSelect.value);

  ["pointerdown", "mousedown", "click", "keydown"].forEach((eventName) => {
    statusSelect.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });

  statusSelect.addEventListener("change", () => {
    const previousValue = workOrder.status || marker.status || "Otvoreni RN";
    const nextValue = statusSelect.value;
    updateWorkOrderStatusSelectTheme(statusSelect, nextValue);
    statusSelect.disabled = true;
    state.workOrderMap.popupWorkOrderId = workOrder.id || marker.workOrderId;

    void runMutation(() => apiRequest(`/work-orders/${workOrder.id || marker.workOrderId}`, {
      method: "PATCH",
      body: { status: nextValue },
    })).then((success) => {
      statusSelect.disabled = false;
      if (!success) {
        statusSelect.value = previousValue;
        updateWorkOrderStatusSelectTheme(statusSelect, previousValue);
      }
    });
  });

  statusWrap.append(statusLabel, statusSelect);
  meta.append(statusWrap);

  if (workOrder.priority || marker.priority) {
    const priorityWrap = document.createElement("div");
    priorityWrap.className = "work-order-map-popup-status work-order-map-popup-priority";

    const priorityLabel = document.createElement("span");
    priorityLabel.className = "work-order-map-popup-status-label";
    priorityLabel.textContent = "Prioritet";

    const priorityBadge = createBadge(
      getOptionLabel(PRIORITY_OPTIONS, workOrder.priority || marker.priority),
      priorityBadgeClass(workOrder.priority || marker.priority),
    );

    priorityWrap.append(priorityLabel, priorityBadge);
    meta.append(priorityWrap);
  }

  const executors = [workOrder.executor1 || marker.executor1, workOrder.executor2 || marker.executor2].filter(Boolean);
  if (executors.length > 0) {
    const executorWrap = document.createElement("div");
    executorWrap.className = "work-order-map-popup-executors";
    executors.forEach((executor) => executorWrap.append(createWorkOrderMiniExecutor(executor)));
    meta.append(executorWrap);
  }

  popup.append(top, title, details, meta);
  return popup;
}

function createWorkOrderMapPopupDetail(label, value, fullWidth = false) {
  const wrap = document.createElement("div");
  wrap.className = "work-order-map-popup-detail";
  wrap.classList.toggle("is-full", fullWidth);

  const title = document.createElement("span");
  title.className = "work-order-map-popup-detail-label";
  title.textContent = label;

  const copy = document.createElement("strong");
  copy.className = "work-order-map-popup-detail-value";
  copy.textContent = value;

  wrap.append(title, copy);
  return wrap;
}

function createWorkOrderLeafletPinIcon(tone, isSelected = false) {
  return window.L.divIcon({
    className: "work-order-map-pin-icon",
    html: `<span class="work-order-map-pin${isSelected ? " is-selected" : ""}" style="--pin-fill:${tone.fill};--pin-stroke:${tone.stroke};"><span class="work-order-map-pin-core"></span></span>`,
    iconSize: [30, 42],
    iconAnchor: [15, 39],
    popupAnchor: [0, -32],
  });
}

function buildWorkOrderClusterIcon(cluster) {
  const children = cluster.getAllChildMarkers();
  const byStatus = new Map();
  children.forEach((child) => {
    const status = child.options.statusValue || "Otvoreni RN";
    byStatus.set(status, (byStatus.get(status) || 0) + 1);
  });

  const dominantStatus = Array.from(byStatus.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] || "Otvoreni RN";
  const tone = getWorkOrderMapMarkerTone(dominantStatus);
  const count = cluster.getChildCount();

  return window.L.divIcon({
    className: "work-order-map-cluster-icon",
    html: `<span class="work-order-map-cluster" style="--cluster-fill:${tone.fill};--cluster-stroke:${tone.stroke};"><strong>${count}</strong></span>`,
    iconSize: [48, 48],
  });
}

function refreshWorkOrderLeafletMarkerSelection() {
  workOrderLeafletMarkers.forEach((leafletMarker, workOrderId) => {
    const tone = getWorkOrderMapMarkerTone(leafletMarker.options.statusValue);
    const isSelected = String(workOrderId) === String(state.workOrderMap.selectedWorkOrderId);
    leafletMarker.setIcon(createWorkOrderLeafletPinIcon(tone, isSelected));
    leafletMarker.setZIndexOffset(isSelected ? 800 : 0);
  });
}

function ensureWorkOrderLeafletMap() {
  if (!workOrderMapCanvas || !window.L) {
    return null;
  }

  if (!workOrderLeafletMap) {
    workOrderLeafletMap = window.L.map(workOrderMapCanvas, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 6,
      maxZoom: 18,
    });

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(workOrderLeafletMap);

    workOrderLeafletLayer = window.L.markerClusterGroup
      ? window.L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 56,
        iconCreateFunction: buildWorkOrderClusterIcon,
      })
      : window.L.layerGroup();
    workOrderLeafletLayer.addTo(workOrderLeafletMap);
    workOrderLeafletClusterLayer = workOrderLeafletLayer;
    workOrderLeafletMap.setView([45.3, 15.7], 7);
  }

  return workOrderLeafletMap;
}

function syncWorkOrderLeafletMarkers(markers) {
  const map = ensureWorkOrderLeafletMap();

  if (!map || !workOrderLeafletLayer) {
    return;
  }

  const markerSignature = getWorkOrderMapMarkerSignature(markers);
  const shouldReframe = state.workOrderMap.markerSignature !== markerSignature;
  state.workOrderMap.markerSignature = markerSignature;

  workOrderLeafletLayer.clearLayers();
  workOrderLeafletMarkers = new Map();

  markers.forEach((marker) => {
    const tone = getWorkOrderMapMarkerTone(marker.status);
    const isSelected = String(marker.workOrderId) === String(state.workOrderMap.selectedWorkOrderId);
    const leafletMarker = window.L.marker([marker.latitude, marker.longitude], {
      icon: createWorkOrderLeafletPinIcon(tone, isSelected),
      keyboard: true,
      riseOnHover: true,
      zIndexOffset: isSelected ? 800 : 0,
      statusValue: marker.status,
    });

    leafletMarker.bindPopup(buildWorkOrderLeafletPopup(marker), {
      autoPan: false,
      closeButton: false,
      className: "work-order-map-popup-shell",
      minWidth: 300,
      maxWidth: 360,
      offset: [0, -20],
    });
    leafletMarker.on("click", () => {
      state.workOrderMap.selectedWorkOrderId = marker.workOrderId;
      state.workOrderMap.popupWorkOrderId = marker.workOrderId;
      refreshWorkOrderLeafletMarkerSelection();
      window.requestAnimationFrame(() => {
        leafletMarker.openPopup();
      });
    });
    leafletMarker.on("popupclose", () => {
      if (String(state.workOrderMap.popupWorkOrderId) === String(marker.workOrderId)) {
        state.workOrderMap.popupWorkOrderId = "";
      }
    });

    workOrderLeafletLayer.addLayer(leafletMarker);
    workOrderLeafletMarkers.set(String(marker.workOrderId), leafletMarker);
  });

  if (markers.length > 0 && shouldReframe) {
    const bounds = window.L.latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude]));
    map.fitBounds(bounds.pad(0.2), {
      animate: false,
      maxZoom: markers.length === 1 ? 14 : 12,
    });
  } else if (markers.length === 0) {
    map.setView([45.3, 15.7], 7, { animate: false });
  }

  window.requestAnimationFrame(() => {
    map.invalidateSize();
    const popupMarker = workOrderLeafletMarkers.get(String(state.workOrderMap.popupWorkOrderId));
    if (popupMarker) {
      popupMarker.openPopup();
    }
  });
}

function renderWorkOrderMapSelectionCard(selectedMarker) {
  if (!workOrderMapSelection || !workOrderMapSelectionTitle) {
    return;
  }

  workOrderMapSelection.replaceChildren();

  if (!selectedMarker) {
    workOrderMapSelectionTitle.textContent = "Odaberi marker";
    const empty = document.createElement("p");
    empty.className = "work-order-map-selection-empty";
    empty.textContent = "Filtriraj RN i klikni marker na karti za brzi pregled detalja.";
    workOrderMapSelection.append(empty);
    return;
  }

  workOrderMapSelectionTitle.textContent = selectedMarker.workOrderNumber || "Detalji RN";

  const top = document.createElement("div");
  top.className = "work-order-map-selection-top";
  top.append(
    createBadge(selectedMarker.status || "Otvoreni RN", statusBadgeClass(selectedMarker.status || "Otvoreni RN")),
  );

  if (selectedMarker.priority) {
    top.append(
      createBadge(getOptionLabel(PRIORITY_OPTIONS, selectedMarker.priority), priorityBadgeClass(selectedMarker.priority)),
    );
  }

  const title = document.createElement("strong");
  title.className = "work-order-map-selection-company";
  title.textContent = selectedMarker.companyName || "Bez tvrtke";

  const location = document.createElement("p");
  location.className = "work-order-map-selection-location";
  location.textContent = [selectedMarker.locationName, selectedMarker.region].filter(Boolean).join(" · ") || "Bez lokacije";

  const coordinates = document.createElement("p");
  coordinates.className = "work-order-map-selection-coordinates";
  coordinates.textContent = selectedMarker.coordinates || "Bez koordinata";

  const meta = document.createElement("div");
  meta.className = "work-order-map-selection-meta";
  meta.append(
    createWorkOrderMetaStat("Rok", selectedMarker.dueDate ? formatCompactDate(selectedMarker.dueDate) : "Bez roka"),
    createWorkOrderMetaStat("Lat/Lon", `${selectedMarker.latitude.toFixed(4)}, ${selectedMarker.longitude.toFixed(4)}`),
  );

  const actions = document.createElement("div");
  actions.className = "work-order-map-selection-actions";
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "primary-button";
  openButton.textContent = "Otvori RN";
  openButton.addEventListener("click", () => {
    const workOrder = state.workOrders.find((item) => String(item.id) === String(selectedMarker.workOrderId));

    if (workOrder) {
      hydrateWorkOrderForm(workOrder);
    }
  });
  actions.append(openButton);

  workOrderMapSelection.append(top, title, location, coordinates, meta, actions);
}

function createWorkOrderMetaStat(label, value) {
  const wrap = document.createElement("div");
  wrap.className = "work-order-map-selection-stat";
  const statLabel = document.createElement("span");
  statLabel.className = "work-order-map-selection-stat-label";
  statLabel.textContent = label;
  const statValue = document.createElement("strong");
  statValue.className = "work-order-map-selection-stat-value";
  statValue.textContent = value;
  wrap.append(statLabel, statValue);
  return wrap;
}

function renderWorkOrderMapView() {
  if (!workOrderMapView || !workOrderMapStage || !workOrderMapCanvas) {
    return;
  }

  const filtered = getFilteredWorkOrders();
  const map = buildWorkOrderMapMarkers(filtered);
  const markers = map.markers;
  const missingCoordinatesCount = filtered.length - markers.length;

  if (workOrderMapSummary) {
    workOrderMapSummary.textContent = `${markers.length} s koordinatama · ${missingCoordinatesCount} bez koordinata`;
  }

  if (workOrderMapSummary) {
    workOrderMapSummary.textContent = `${markers.length} s koordinatama · ${missingCoordinatesCount} bez`;
  }

  if (workOrderMapSummary) {
    workOrderMapSummary.textContent = `${markers.length} s koordinatama · ${missingCoordinatesCount} bez koordinata`;
  }

  if (workOrderMapSummary) {
    workOrderMapSummary.textContent = `${markers.length} s koordinatama · ${missingCoordinatesCount} bez koordinata`;
  }

  if (workOrderMapSummary) {
    workOrderMapSummary.textContent = `${markers.length} s koordinatama · ${missingCoordinatesCount} bez koordinata`;
  }

  workOrderMapList?.replaceChildren();

  if (markers.length === 0) {
    state.workOrderMap.selectedWorkOrderId = "";
    state.workOrderMap.popupWorkOrderId = "";
    renderWorkOrderMapSelectionCard(null);
    syncWorkOrderLeafletMarkers([]);

    if (workOrderMapList) {
      const empty = document.createElement("p");
      empty.className = "work-order-map-selection-empty";
      empty.textContent = "Za trenutni filter nema RN s koordinatama.";
      workOrderMapList.append(empty);
    }
    return;
  }

  if (!markers.some((item) => String(item.workOrderId) === String(state.workOrderMap.selectedWorkOrderId))) {
    state.workOrderMap.selectedWorkOrderId = markers[0].workOrderId;
  }

  syncWorkOrderLeafletMarkers(markers);

  markers.forEach((marker) => {
    if (workOrderMapList) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "work-order-map-list-item";
      item.classList.toggle("is-selected", String(marker.workOrderId) === String(state.workOrderMap.selectedWorkOrderId));

      const title = document.createElement("strong");
      title.textContent = marker.workOrderNumber || "Bez broja";

      const subtitle = document.createElement("span");
      subtitle.textContent = [marker.companyName, marker.locationName].filter(Boolean).join(" · ") || "Bez detalja";

      const meta = document.createElement("span");
      meta.className = "work-order-map-list-meta";
      meta.textContent = marker.coordinates || "";

      item.append(title, subtitle, meta);
      item.addEventListener("click", () => {
        state.workOrderMap.selectedWorkOrderId = marker.workOrderId;
        renderWorkOrderMapView();
      });
      workOrderMapList.append(item);
    }
  });

  renderWorkOrderMapSelectionCard(
    markers.find((item) => String(item.workOrderId) === String(state.workOrderMap.selectedWorkOrderId)) ?? null,
  );
}

function createWorkOrderCalendarSchedulerCard(workOrder) {
  const card = document.createElement("article");
  card.className = "work-order-calendar-card";
  card.draggable = true;
  card.dataset.workOrderId = workOrder.id;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  const tone = getWorkOrderCalendarTone(workOrder.status || "Otvoreni RN");
  card.style.setProperty("--calendar-card-accent", tone.accent);
  card.style.setProperty("--calendar-card-soft", tone.soft);
  card.style.setProperty("--calendar-card-border", tone.border);

  const top = document.createElement("div");
  top.className = "work-order-calendar-card-top";

  const number = document.createElement("strong");
  number.className = "work-order-calendar-card-number";
  number.textContent = workOrder.workOrderNumber || "Bez broja";

  const status = createWorkOrderStatusDropdown(workOrder, {
    className: "work-order-calendar-card-status-dropdown",
  });
  top.append(number, status);

  const title = document.createElement("span");
  title.className = "work-order-calendar-card-title";
  title.textContent = workOrder.companyName || workOrder.locationName || "Radni nalog";

  const meta = document.createElement("span");
  meta.className = "work-order-calendar-card-meta";
  meta.textContent = [workOrder.locationName, workOrder.region].filter(Boolean).join(" · ") || "Bez lokacije";

  const due = document.createElement("span");
  due.className = "work-order-calendar-card-due";
  due.textContent = workOrder.dueDate ? `Rok ${formatCompactDate(workOrder.dueDate)}` : "Bez roka";

  const footer = document.createElement("div");
  footer.className = "work-order-calendar-card-footer";
  footer.append(due);

  const executorWrap = document.createElement("div");
  executorWrap.className = "work-order-calendar-card-executors";
  executorWrap.dataset.preventRowOpen = "true";
  executorWrap.append(createWorkOrderCalendarExecutorPicker(workOrder));
  footer.append(executorWrap);

  card.append(top, title, meta, footer);

  if (workOrder.priority) {
    const priority = createBadge(
      getOptionLabel(PRIORITY_OPTIONS, workOrder.priority),
      priorityBadgeClass(workOrder.priority),
    );
    priority.classList.add("work-order-calendar-card-priority");
    card.append(priority);
  }

  card.addEventListener("click", (event) => {
    if (isInteractiveWorkOrderTarget(event.target)) {
      return;
    }
    hydrateWorkOrderForm(workOrder);
  });

  card.addEventListener("keydown", (event) => {
    if (isInteractiveWorkOrderTarget(event.target)) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      hydrateWorkOrderForm(workOrder);
    }
  });

  card.addEventListener("dragstart", (event) => {
    state.workOrderCalendar.draggingWorkOrderId = workOrder.id;
    state.workOrderCalendar.draggingGroupIds = [];
    event.dataTransfer?.setData("text/plain", String(workOrder.id));
    event.dataTransfer?.setData("application/x-work-order-id", String(workOrder.id));
    event.dataTransfer?.setDragImage?.(card, 18, 18);
    window.requestAnimationFrame(() => {
      card.classList.add("is-dragging");
    });
  });

  card.addEventListener("dragend", () => {
    state.workOrderCalendar.draggingWorkOrderId = "";
    state.workOrderCalendar.draggingGroupIds = [];
    card.classList.remove("is-dragging");
    workOrderCalendarGrid?.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
  });

  return card;
}

function getVisibleCalendarWeekDays(days = [], showWeekends = state.workOrderCalendar.showWeekends) {
  if (showWeekends) {
    return days;
  }

  return days.filter((day) => {
    const parsedDate = parseDateValue(day.key);

    if (!parsedDate) {
      return true;
    }

    const dayIndex = parsedDate.getDay();
    return dayIndex !== 0 && dayIndex !== 6;
  });
}

function createWorkOrderCalendarGroupLead(group) {
  const lead = document.createElement("div");
  lead.className = "work-order-calendar-team-lead";

  const titleWrap = document.createElement("div");
  titleWrap.className = "work-order-calendar-team-copy";

  const title = document.createElement("strong");
  title.className = "work-order-calendar-team-name";
  title.textContent = group.label;

  const subtitle = document.createElement("span");
  subtitle.className = "work-order-calendar-team-meta";
  subtitle.textContent = group.totalCount === 1 ? "1 RN" : `${group.totalCount} RN`;

  titleWrap.append(title, subtitle);

  const metaWrap = document.createElement("div");
  metaWrap.className = "work-order-calendar-team-side";

  if (group.executors.length > 0) {
    const avatars = document.createElement("div");
    avatars.className = "work-order-calendar-team-executors";
    group.executors.slice(0, 4).forEach((executor) => avatars.append(createWorkOrderMiniExecutor(executor)));
    metaWrap.append(avatars);
  }

  lead.append(titleWrap, metaWrap);
  return lead;
}

function getWorkOrderCalendarRowMetrics(visibleDayCount = 7) {
  const teamMinWidth = visibleDayCount <= 5 ? 136 : visibleDayCount === 6 ? 124 : 112;
  const teamFraction = visibleDayCount <= 5 ? 1.35 : visibleDayCount === 6 ? 1.2 : 1.05;

  return {
    teamMinWidth,
    teamFraction,
  };
}

function applyWorkOrderCalendarRowLayout(row, visibleDayCount = 7) {
  const metrics = getWorkOrderCalendarRowMetrics(visibleDayCount);
  row.style.gridTemplateColumns = `minmax(${metrics.teamMinWidth}px, ${metrics.teamFraction}fr) repeat(${visibleDayCount}, minmax(0, 1fr))`;
  row.style.minWidth = "0";
  row.style.width = "100%";
}

function bindWorkOrderCalendarGroupDrag(handle, workOrderIds = [], groupCard = null) {
  if (!handle || !Array.isArray(workOrderIds) || workOrderIds.length === 0) {
    return;
  }

  const normalizedIds = Array.from(new Set(
    workOrderIds.map((value) => String(value ?? "").trim()).filter(Boolean),
  ));

  if (normalizedIds.length === 0) {
    return;
  }

  handle.draggable = true;
  handle.classList.add("is-draggable");

  handle.addEventListener("dragstart", (event) => {
    state.workOrderCalendar.draggingWorkOrderId = "";
    state.workOrderCalendar.draggingGroupIds = [...normalizedIds];
    event.dataTransfer?.setData("application/x-work-order-group-ids", normalizedIds.join(","));
    event.dataTransfer?.setData("text/plain", normalizedIds[0]);
    event.dataTransfer?.setDragImage?.((groupCard || handle), 18, 18);
    window.requestAnimationFrame(() => {
      groupCard?.classList.add("is-dragging-group");
    });
  });

  handle.addEventListener("dragend", () => {
    state.workOrderCalendar.draggingWorkOrderId = "";
    state.workOrderCalendar.draggingGroupIds = [];
    groupCard?.classList.remove("is-dragging-group");
    workOrderCalendarGrid?.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
  });
}

function createWorkOrderCalendarExecutorGroup(items = [], options = {}) {
  const { targetDate = "" } = options;
  const groups = groupWorkOrdersByExecutorSet(items);

  const wrap = document.createDocumentFragment();

  groups.forEach((executorGroup) => {
    const groupCard = document.createElement("details");
    groupCard.className = "work-order-calendar-cell-group";
    groupCard.dataset.executorGroupKey = executorGroup.key;
    const persistenceKey = targetDate ? `${targetDate}:${executorGroup.key}` : executorGroup.key;
    groupCard.open = state.workOrderCalendar.expandedGroupKeys.has(persistenceKey);
    groupCard.addEventListener("toggle", () => {
      if (groupCard.open) {
        state.workOrderCalendar.expandedGroupKeys.add(persistenceKey);
      } else {
        state.workOrderCalendar.expandedGroupKeys.delete(persistenceKey);
      }
    });

    if (targetDate && executorGroup.executors.length > 0) {
      bindWorkOrderCalendarDropTarget(groupCard, (dragPayload) => {
        void applyWorkOrderCalendarDropPayload(dragPayload, targetDate, {
          executors: executorGroup.executors,
        });
      }, { stopPropagation: true });
    }

    const header = document.createElement("summary");
    header.className = "work-order-calendar-cell-group-summary";
    bindWorkOrderCalendarGroupDrag(
      header,
      executorGroup.items.map((item) => item.id),
      groupCard,
    );

    const lead = document.createElement("div");
    lead.className = "work-order-calendar-cell-group-lead";

    const avatars = document.createElement("div");
    avatars.className = "work-order-calendar-cell-group-avatars";
    if (executorGroup.executors.length > 0) {
      executorGroup.executors.slice(0, 3).forEach((executor) => avatars.append(createWorkOrderMiniExecutor(executor)));
    } else {
      avatars.append(createWorkOrderMiniExecutor("Bez izvršitelja"));
    }

    const copy = document.createElement("div");
    copy.className = "work-order-calendar-cell-group-copy";

    const title = document.createElement("strong");
    title.className = "work-order-calendar-cell-group-title";
    title.textContent = executorGroup.label;

    copy.append(title);

    const uniqueRegions = Array.from(new Set(
      executorGroup.items
        .map((item) => String(item?.region ?? "").trim())
        .filter(Boolean),
    )).sort((left, right) => left.localeCompare(right, "hr"));

    if (uniqueRegions.length > 0) {
      const regions = document.createElement("div");
      regions.className = "work-order-calendar-cell-group-regions";
      uniqueRegions.forEach((region) => {
        const pill = document.createElement("span");
        pill.className = "work-order-calendar-cell-group-region";
        pill.textContent = region;
        pill.title = region;
        regions.append(pill);
      });
      copy.append(regions);
    }

    lead.append(avatars, copy);

    const count = document.createElement("span");
    count.className = "work-order-calendar-cell-group-count";
    count.textContent = String(executorGroup.items.length);

    header.append(lead, count);

    const body = document.createElement("div");
    body.className = "work-order-calendar-cell-group-body";

    const list = document.createElement("div");
    list.className = "work-order-calendar-cell-group-list";
    executorGroup.items.forEach((workOrder) => {
      list.append(createWorkOrderCalendarSchedulerCard(workOrder));
    });

    body.append(list);
    groupCard.append(header, body);
    wrap.append(groupCard);
  });

  return wrap;
}

function createWorkOrderCalendarWeekCell(day, group, items) {
  const cell = document.createElement("div");
  cell.className = "work-order-calendar-week-cell";
  cell.dataset.dateKey = day.key;
  cell.dataset.teamKey = group.key;

  bindWorkOrderCalendarDropTarget(cell, (dragPayload) => {
    void applyWorkOrderCalendarDropPayload(dragPayload, day.key);
  });

  if (items.length === 0) {
    const placeholder = document.createElement("span");
    placeholder.className = "work-order-calendar-cell-placeholder";
    placeholder.textContent = day.inMonth ? "Povuci ovdje" : "";
    cell.append(placeholder);
    return cell;
  }

  cell.append(createWorkOrderCalendarExecutorGroup(items, { targetDate: day.key }));

  return cell;
}

function syncWorkOrderCalendarGridShellHeight() {
  if (!workOrderCalendarGridShell) {
    return;
  }

  if (state.activeWorkOrderViewMode !== "calendar" || workOrderCalendarView?.hidden) {
    workOrderCalendarGridShell.style.removeProperty("--work-order-calendar-shell-height");
    return;
  }

  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    return;
  }

  const shellRect = workOrderCalendarGridShell.getBoundingClientRect();
  const visibleTop = Math.max(shellRect.top, window.innerWidth <= 980 ? 10 : 16);
  const bottomGap = window.innerWidth <= 980 ? 16 : 24;
  const availableHeight = Math.floor(viewportHeight - visibleTop - bottomGap);

  if (!Number.isFinite(availableHeight) || availableHeight <= 120) {
    workOrderCalendarGridShell.style.removeProperty("--work-order-calendar-shell-height");
    return;
  }

  workOrderCalendarGridShell.style.setProperty("--work-order-calendar-shell-height", `${availableHeight}px`);
}

function queueWorkOrderCalendarGridShellHeightSync() {
  if (!workOrderCalendarGridShell) {
    return;
  }

  if (workOrderCalendarShellHeightFrame) {
    window.cancelAnimationFrame(workOrderCalendarShellHeightFrame);
  }

  workOrderCalendarShellHeightFrame = window.requestAnimationFrame(() => {
    workOrderCalendarShellHeightFrame = 0;
    syncWorkOrderCalendarGridShellHeight();
  });
}

function bindWorkOrderCalendarGrabScroll() {
  if (!workOrderCalendarGridShell || workOrderCalendarGridShell.dataset.grabBound === "true") {
    return;
  }

  workOrderCalendarGridShell.dataset.grabBound = "true";
  workOrderCalendarGridShell.addEventListener("wheel", (event) => {
    const hasHorizontalOverflow = workOrderCalendarGridShell.scrollWidth > workOrderCalendarGridShell.clientWidth + 4;

    if (!hasHorizontalOverflow) {
      return;
    }

    const shouldPanHorizontally = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);

    if (!shouldPanHorizontally) {
      return;
    }

    event.preventDefault();
    workOrderCalendarGridShell.scrollLeft += event.deltaX || event.deltaY;
  }, { passive: false });
}

function syncWorkOrderCalendarToolbar(unscheduledCount = 0) {
  if (workOrderCalendarPrevButton) {
    workOrderCalendarPrevButton.setAttribute(
      "aria-label",
      state.workOrderCalendar.displayMode === "month" ? "Prethodni mjesec" : "Prethodni tjedan",
    );
  }

  if (workOrderCalendarNextButton) {
    workOrderCalendarNextButton.setAttribute(
      "aria-label",
      state.workOrderCalendar.displayMode === "month" ? "Sljedeci mjesec" : "Sljedeci tjedan",
    );
  }

  if (workOrderCalendarDisplayWeekButton) {
    const isActive = state.workOrderCalendar.displayMode === "week";
    workOrderCalendarDisplayWeekButton.classList.toggle("is-active", isActive);
    workOrderCalendarDisplayWeekButton.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  if (workOrderCalendarDisplayMonthButton) {
    const isActive = state.workOrderCalendar.displayMode === "month";
    workOrderCalendarDisplayMonthButton.classList.toggle("is-active", isActive);
    workOrderCalendarDisplayMonthButton.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  if (workOrderCalendarWeekendsInput) {
    workOrderCalendarWeekendsInput.classList.toggle("is-active", state.workOrderCalendar.showWeekends);
    workOrderCalendarWeekendsInput.setAttribute("aria-pressed", state.workOrderCalendar.showWeekends ? "true" : "false");
  }

  if (workOrderCalendarUnscheduledToggle) {
    const visible = state.workOrderCalendar.showUnscheduled && unscheduledCount > 0;
    workOrderCalendarUnscheduledToggle.classList.toggle("is-active", visible);
    workOrderCalendarUnscheduledToggle.setAttribute("aria-pressed", visible ? "true" : "false");
    workOrderCalendarUnscheduledToggle.disabled = unscheduledCount === 0;
    workOrderCalendarUnscheduledToggle.textContent = unscheduledCount > 0
      ? `Bez datuma (${unscheduledCount})`
      : "Bez datuma";
  }

  if (workOrderCalendarContent) {
    workOrderCalendarContent.classList.toggle(
      "is-unscheduled-hidden",
      !state.workOrderCalendar.showUnscheduled || unscheduledCount === 0,
    );
  }
}

function createWorkOrderCalendarUnscheduledGroup(group) {
  const section = document.createElement("section");
  section.className = "work-order-calendar-unscheduled-group";

  const header = document.createElement("div");
  header.className = "work-order-calendar-unscheduled-group-head";
  bindWorkOrderCalendarGroupDrag(
    header,
    group.items.map((item) => item.id),
    section,
  );
  header.append(createWorkOrderCalendarGroupLead({
    ...group,
    totalCount: group.items.length,
  }));

  const list = document.createElement("div");
  list.className = "work-order-calendar-unscheduled-list";
  group.items.forEach((workOrder) => {
    list.append(createWorkOrderCalendarSchedulerCard(workOrder));
  });

  section.append(header, list);
  return section;
}

function renderWorkOrderCalendarSchedulerView() {
  if (!workOrderCalendarView || !workOrderCalendarGrid) {
    return;
  }

  bindWorkOrderCalendarGrabScroll();

  const filtered = getFilteredWorkOrders();
  const calendar = buildWorkOrderCalendarTeamWeeks(filtered, state.workOrderCalendar.weekStart);

  if (workOrderCalendarRange) {
    workOrderCalendarRange.textContent = formatCalendarRangeLabel(calendar.anchorDate);
  }

  const unscheduledCount = calendar.unscheduledGroups.reduce((sum, group) => sum + group.items.length, 0);
  syncWorkOrderCalendarToolbar(unscheduledCount);

  if (workOrderCalendarMeta) {
    const scheduledCount = calendar.weeks.reduce((sum, week) => sum + week.totalCount, 0);
    workOrderCalendarMeta.textContent = `${scheduledCount} raspoređenih · ${unscheduledCount} bez datuma`;
  }

  if (workOrderCalendarUnscheduled) {
    workOrderCalendarUnscheduled.hidden = unscheduledCount === 0 || !state.workOrderCalendar.showUnscheduled;
    workOrderCalendarUnscheduled.replaceChildren();

    if (unscheduledCount > 0) {
      const head = document.createElement("div");
      head.className = "work-order-calendar-unscheduled-head";

      const label = document.createElement("strong");
      label.textContent = "Bez datuma";

      const meta = document.createElement("span");
      meta.textContent = "Dodijeli datum pa ce se RN pojaviti u kalendaru.";
      head.append(label, meta);

      const list = document.createElement("div");
      list.className = "work-order-calendar-unscheduled-groups";
      calendar.unscheduledGroups.forEach((group) => {
        list.append(createWorkOrderCalendarUnscheduledGroup(group));
      });

      workOrderCalendarUnscheduled.append(head, list);
    }
  }

  const fragment = document.createDocumentFragment();
  const scheduledCount = calendar.weeks.reduce((sum, week) => sum + week.totalCount, 0);

  if (scheduledCount === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "work-order-calendar-empty";

    const title = document.createElement("strong");
    title.textContent = "Nema raspoređenih RN-a";

    const text = document.createElement("span");
    text.textContent = "Dodijeli datum i tim da bi se radni nalozi pojavili u kalendaru.";

    emptyState.append(title, text);
    fragment.append(emptyState);
    workOrderCalendarGrid.replaceChildren(fragment);
    return;
  }

  calendar.weeks.forEach((week) => {
    const visibleDays = getVisibleCalendarWeekDays(week.days, state.workOrderCalendar.showWeekends);
    const weekBlock = document.createElement("section");
    weekBlock.className = "work-order-calendar-week-block";

    const weekHead = document.createElement("div");
    weekHead.className = "work-order-calendar-week-head";

    const weekCopy = document.createElement("div");
    weekCopy.className = "work-order-calendar-week-copy";

    const weekTitle = document.createElement("strong");
    weekTitle.textContent = `${formatCompactDate(visibleDays[0]?.key ?? week.weekStart)} - ${formatCompactDate(
      visibleDays[visibleDays.length - 1]?.key ?? visibleDays[0]?.key ?? week.weekStart,
    )}`;

    const weekMeta = document.createElement("span");
    weekMeta.textContent = week.totalCount === 1 ? "1 RN" : `${week.totalCount} RN`;

    weekCopy.append(weekTitle, weekMeta);
    weekHead.append(weekCopy);
    weekBlock.append(weekHead);

    const headerRow = document.createElement("div");
    headerRow.className = "work-order-calendar-week-row is-head";
    applyWorkOrderCalendarRowLayout(headerRow, visibleDays.length);

    const teamHead = document.createElement("div");
    teamHead.className = "work-order-calendar-week-team-head";
    teamHead.textContent = "Raspored";
    headerRow.append(teamHead);

    visibleDays.forEach((day) => {
      const dayHead = document.createElement("div");
      dayHead.className = "work-order-calendar-week-day-head";
      dayHead.classList.toggle("is-today", day.isToday);
      dayHead.classList.toggle("is-outside-month", !day.inMonth);

      const label = document.createElement("span");
      label.className = "work-order-calendar-day-label";
      label.textContent = new Intl.DateTimeFormat("hr-HR", { weekday: "short" }).format(parseDateValue(day.key));

      const date = document.createElement("strong");
      date.className = "work-order-calendar-day-date";
      date.textContent = formatCompactDate(day.key);

      dayHead.append(label, date);
      headerRow.append(dayHead);
    });

    weekBlock.append(headerRow);

    if (week.groups.length === 0) {
      const emptyRow = document.createElement("div");
      emptyRow.className = "work-order-calendar-week-row";
      applyWorkOrderCalendarRowLayout(emptyRow, visibleDays.length);

      const emptyLead = document.createElement("div");
      emptyLead.className = "work-order-calendar-team-lead";

      const emptyTitleWrap = document.createElement("div");
      emptyTitleWrap.className = "work-order-calendar-team-copy";

      const emptyTitle = document.createElement("strong");
      emptyTitle.className = "work-order-calendar-team-name";
      emptyTitle.textContent = "Bez rasporeda";

      const emptyMeta = document.createElement("span");
      emptyMeta.className = "work-order-calendar-team-meta";
      emptyMeta.textContent = "Nema RN za ovaj tjedan";

      emptyTitleWrap.append(emptyTitle, emptyMeta);
      emptyLead.append(emptyTitleWrap);
      emptyRow.append(emptyLead);

      visibleDays.forEach((day) => {
        emptyRow.append(createWorkOrderCalendarWeekCell(day, {
          key: "team:unassigned",
          label: "Bez tima",
          isUnassigned: true,
        }, []));
      });

      weekBlock.append(emptyRow);
      fragment.append(weekBlock);
      return;
    }

    week.groups.forEach((group) => {
      const row = document.createElement("div");
      row.className = "work-order-calendar-week-row";
      applyWorkOrderCalendarRowLayout(row, visibleDays.length);

      row.append(createWorkOrderCalendarGroupLead(group));

      visibleDays.forEach((day) => {
        row.append(createWorkOrderCalendarWeekCell(day, group, group.itemsByDate[day.key] ?? []));
      });

      weekBlock.append(row);
    });

    fragment.append(weekBlock);
  });

  workOrderCalendarGrid.replaceChildren(fragment);
}

function renderWorkOrderCroatiaMapView() {
  if (!workOrderMapView || !workOrderMapStage || !workOrderMapCanvas) {
    return;
  }

  const filtered = getMapFilteredWorkOrders();
  const mapData = buildWorkOrderMapMarkers(filtered);
  const markers = mapData.markers;
  const missingCoordinatesCount = filtered.length - markers.length;

  if (workOrderMapSummary) {
    workOrderMapSummary.textContent = `${markers.length} s koordinatama · ${missingCoordinatesCount} bez koordinata`;
  }

  if (markers.length === 0) {
    state.workOrderMap.selectedWorkOrderId = "";
    state.workOrderMap.popupWorkOrderId = "";
    syncWorkOrderLeafletMarkers([]);
    return;
  }

  if (!markers.some((item) => String(item.workOrderId) === String(state.workOrderMap.selectedWorkOrderId))) {
    state.workOrderMap.selectedWorkOrderId = markers[0].workOrderId;
  }

  if (!markers.some((item) => String(item.workOrderId) === String(state.workOrderMap.popupWorkOrderId))) {
    state.workOrderMap.popupWorkOrderId = "";
  }

  syncWorkOrderLeafletMarkers(markers);
}
function renderWorkOrderWorkspace() {
  updateWorkOrderModeButtons();
  refreshWorkOrderTeamSuggestions();

  const filtered = getFilteredWorkOrders();
  const emptyTextByMode = {
    list: "Nema radnih naloga za trenutni filter.",
    calendar: "Nema radnih naloga za prikaz u kalendaru.",
    maps: "Nema radnih naloga za prikaz na karti.",
  };

  if (workOrderListView) {
    workOrderListView.hidden = state.activeWorkOrderViewMode !== "list";
  }

  if (workOrderCalendarView) {
    workOrderCalendarView.hidden = state.activeWorkOrderViewMode !== "calendar";
  }

  if (workOrderMapView) {
    workOrderMapView.hidden = state.activeWorkOrderViewMode !== "maps";
  }

  if (workOrdersEmpty) {
    const shouldShowEmpty = filtered.length === 0 && state.activeWorkOrderViewMode !== "calendar";
    workOrdersEmpty.hidden = !shouldShowEmpty;
    workOrdersEmpty.textContent = emptyTextByMode[state.activeWorkOrderViewMode] || emptyTextByMode.list;
  }

  if (workOrdersLoadState) {
    workOrdersLoadState.hidden = state.activeWorkOrderViewMode !== "list";
  }

  if (state.activeWorkOrderViewMode === "list") {
    renderCompactWorkOrdersList();
  } else if (state.activeWorkOrderViewMode === "calendar") {
    renderWorkOrderCalendarView();
  } else {
    renderWorkOrderCroatiaMapView();
  }

  queueWorkOrderCalendarGridShellHeightSync();
}

function renderWorkOrders() {
  const filtered = getFilteredWorkOrders();
  const visibleItems = filtered.slice(0, state.workOrderRenderLimit);
  const fullGroups = buildWorkOrderGroups(filtered);
  const visibleGroups = buildWorkOrderGroups(visibleItems);

  if (workOrdersHelper) {
    workOrdersHelper.textContent = `${filtered.length} RN u list view prikazu.`;
  }

  workOrdersBody.replaceChildren(...visibleGroups.map((group) => {
    const section = document.createElement("section");
    section.className = "work-group";

    const groupHeader = document.createElement("div");
    groupHeader.className = "work-group-header";

    const headerLead = document.createElement("div");
    headerLead.className = "work-group-lead";

    const foldIcon = document.createElement("span");
    foldIcon.className = "work-group-fold";
    foldIcon.textContent = "▾";

    const statusBadge = createBadge(group.label, statusBadgeClass(group.status));
    statusBadge.classList.add("work-group-status-badge");

    const totalCount = fullGroups.find((entry) => entry.status === group.status)?.items.length ?? group.items.length;
    const count = document.createElement("span");
    count.className = "work-group-count";
    count.textContent = String(totalCount);

    headerLead.append(foldIcon, statusBadge, count);

    const groupActions = document.createElement("button");
    groupActions.type = "button";
    groupActions.className = "work-group-add-inline";
    groupActions.textContent = "+ Add task";
    groupActions.addEventListener("click", () => {
      focusWorkOrderComposer({ status: group.status });
    });

    groupHeader.append(headerLead, groupActions);

    const columns = document.createElement("div");
    columns.className = "work-group-columns";
    ["Name", "Regija", "Lokacija", "Due date", "Priority", "Kontakt", "Actions"].forEach((label) => {
      const cell = document.createElement("div");
      cell.className = "work-group-column";
      cell.textContent = label;
      columns.append(cell);
    });

    const body = document.createElement("div");
    body.className = "work-group-body";

    group.items.forEach((item) => {
      const overdue = isOverdueWorkOrder(item);
      const row = document.createElement("article");
      row.className = "work-item-row";

      const title = document.createElement("div");
      title.className = "work-item-cell work-item-cell-name";
      const titleCheck = document.createElement("span");
      titleCheck.className = "work-item-check";
      titleCheck.textContent = "✓";
      const titleCopy = document.createElement("div");
      titleCopy.className = "work-item-copy";
      const titlePrimary = document.createElement("strong");
      titlePrimary.textContent = `${item.workOrderNumber} ${item.description || item.locationName || item.companyName || "Radni nalog"}`;
      const titleSecondary = document.createElement("span");
      titleSecondary.textContent = joinParts([
        item.department,
        item.serviceLine,
        item.tagText ? `#${item.tagText}` : "",
      ]) || "Bez dodatnog opisa";
      titleCopy.append(titlePrimary, titleSecondary);
      title.append(titleCheck, titleCopy);

      const region = document.createElement("div");
      region.className = "work-item-cell";
      const regionPill = document.createElement("span");
      regionPill.className = "work-field-pill";
      regionPill.textContent = item.region || "Bez regije";
      region.append(regionPill);

      const location = document.createElement("div");
      location.className = "work-item-cell";
      const locationPrimary = document.createElement("strong");
      locationPrimary.textContent = item.locationName || "Bez lokacije";
      const locationSecondary = document.createElement("span");
      locationSecondary.textContent = item.companyName || "Bez tvrtke";
      location.append(locationPrimary, locationSecondary);

      const due = document.createElement("div");
      due.className = "work-item-cell";
      const duePrimary = document.createElement("strong");
      duePrimary.textContent = item.dueDate ? formatDate(item.dueDate) : "Bez roka";
      const dueSecondary = document.createElement("span");
      dueSecondary.textContent = overdue
        ? "Kasni"
        : (item.openedDate ? `Otvoren ${formatDate(item.openedDate)}` : "Bez datuma");
      if (overdue) {
        due.classList.add("is-overdue");
      }
      due.append(duePrimary, dueSecondary);

      const priority = document.createElement("div");
      priority.className = "work-item-cell";
      const priorityBadge = createBadge(getOptionLabel(PRIORITY_OPTIONS, item.priority), priorityBadgeClass(item.priority));
      priorityBadge.classList.add("work-priority-badge");
      priority.append(priorityBadge);

      const contact = document.createElement("div");
      contact.className = "work-item-cell";
      const contactPrimary = document.createElement("strong");
      contactPrimary.textContent = item.contactName || item.contactPhone || "Bez kontakta";
      const contactSecondary = document.createElement("span");
      contactSecondary.textContent = joinParts([item.contactPhone, item.contactEmail]) || "Nema broja ni emaila";
      contact.append(contactPrimary, contactSecondary);

      const actions = document.createElement("div");
      actions.className = "work-item-cell work-item-actions";
      actions.append(
        createActionButton("Uredi", "card-button card-button-light", () => hydrateWorkOrderForm(item)),
      );

      if (state.user?.role !== "user") {
        actions.append(
          createActionButton("Obrisi", "card-button card-button-light card-danger", () => {
            if (!window.confirm(`Obrisati ${item.workOrderNumber}?`)) {
              return;
            }

            void runMutation(() => apiRequest(`/work-orders/${item.id}`, { method: "DELETE" }));
          }),
        );
      }

      row.append(title, region, location, due, priority, contact, actions);
      body.append(row);
    });

    const addRow = document.createElement("button");
    addRow.type = "button";
    addRow.className = "work-group-add-row";
    addRow.textContent = "+ Add task";
    addRow.addEventListener("click", () => {
      focusWorkOrderComposer({ status: group.status });
    });

    section.append(groupHeader, columns, body, addRow);
    return section;
  }));

  workOrdersEmpty.hidden = filtered.length !== 0;

  if (filtered.length === 0) {
    workOrdersLoadState.hidden = true;
    workOrdersLoadState.textContent = "";
    return;
  }

  workOrdersLoadState.hidden = false;
  workOrdersLoadState.textContent = visibleItems.length < filtered.length
    ? `Prikazano ${visibleItems.length} od ${filtered.length} RN. Skrolaj dalje za jos.`
    : `Prikazano svih ${filtered.length} RN.`;
}

function looksLikeWorkOrderLog(text) {
  const normalized = String(text ?? "").trim();
  return /^\[\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}\]\s*-\s*.+?:/u.test(normalized);
}

function getWorkOrderDetailLines(item) {
  const lines = [];
  const normalizedDescription = String(item.description ?? "").trim();

  if (normalizedDescription) {
    lines.push({
      label: looksLikeWorkOrderLog(normalizedDescription) ? "Dnevnik" : "Opis",
      value: normalizedDescription,
      isLog: looksLikeWorkOrderLog(normalizedDescription),
    });
  }

  if (item.linkReference) {
    lines.push({ label: "Poveznica", value: item.linkReference });
  }

  if (item.completedBy) {
    lines.push({ label: "Zavrsio", value: item.completedBy });
  }

  return lines;
}

function updateWorkOrderStatusSelectTheme(select, value) {
  select.dataset.status = slugifyValue(value);
}

function createWorkOrderStatusSelect(item, options = {}) {
  const { className = "" } = options;
  const select = document.createElement("select");
  select.className = ["work-item-status-select", className].filter(Boolean).join(" ");
  select.dataset.preventRowOpen = "true";

  WORK_ORDER_STATUS_OPTIONS.forEach((option) => {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    select.append(node);
  });

  select.value = item.status || "Otvoreni RN";
  updateWorkOrderStatusSelectTheme(select, select.value);

  bindWorkOrderInlineSelect(select, () => {
    const previousValue = item.status || "Otvoreni RN";
    const nextValue = select.value;

    updateWorkOrderStatusSelectTheme(select, nextValue);
    select.disabled = true;

    void runMutation(() => apiRequest(`/work-orders/${item.id}`, {
      method: "PATCH",
      body: { status: nextValue },
    })).then((success) => {
      const updatedItem = state.workOrders.find((entry) => String(entry.id) === String(item.id));

      if (!success) {
        select.value = previousValue;
        updateWorkOrderStatusSelectTheme(select, previousValue);
      } else {
        select.value = updatedItem?.status || nextValue;
        updateWorkOrderStatusSelectTheme(select, select.value);
      }

      if (select.isConnected) {
        select.disabled = false;
      }
    });
  });

  return select;
}

function normalizeWorkOrderClientReference(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "";
  }

  return normalized
    .replace(/^\s*veza(?:\s*rn)?\s*[:\-]?\s*/iu, "")
    .trim();
}

function getWorkOrderClientPills(item) {
  const rawValue = normalizeWorkOrderClientReference(item.linkReference);

  if (!rawValue) {
    return [];
  }

  return Array.from(new Set(
    rawValue
      .split(/[|,;/]+/u)
      .map((entry) => entry.trim())
      .filter(Boolean),
  ));
}

function isInteractiveWorkOrderTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest(
    "select, button, input, textarea, a, [data-prevent-row-open='true']",
  ));
}

function closeOpenWorkOrderStatusMenus(except = null) {
  document.querySelectorAll(".work-item-status-dropdown.is-open, .work-order-calendar-executor-picker.is-open").forEach((node) => {
    if (except && node === except) {
      return;
    }

    if (typeof node._closeMenu === "function") {
      node._closeMenu();
      return;
    }

    node.classList.remove("is-open");
    const trigger = node.querySelector(".work-item-status-trigger, .work-order-calendar-executor-trigger");
    trigger?.setAttribute("aria-expanded", "false");
    if (node._menuPortal) {
      node._menuPortal.remove();
      node._menuPortal = null;
    }
  });
}

function createWorkOrderStatusDropdown(item, options = {}) {
  const { className = "" } = options;
  const wrapper = document.createElement("div");
  wrapper.className = ["work-item-status-dropdown", className].filter(Boolean).join(" ");
  wrapper.dataset.preventRowOpen = "true";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "work-item-status-trigger";
  trigger.dataset.status = slugifyValue(item.status || "Otvoreni RN");
  trigger.textContent = item.status || "Otvoreni RN";
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");

  const setPendingState = (isPending) => {
    wrapper.classList.toggle("is-pending", isPending);
    trigger.disabled = isPending;
  };

  const setCurrentStatus = (value) => {
    trigger.dataset.status = slugifyValue(value);
    trigger.textContent = value;
  };

  const positionMenuPortal = (menu) => {
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = triggerRect.left;
    let top = triggerRect.bottom + 8;

    if (left + menuRect.width > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - menuRect.width - 12);
    }

    if (top + menuRect.height > viewportHeight - 12) {
      top = Math.max(12, triggerRect.top - menuRect.height - 8);
    }

    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.style.minWidth = `${Math.round(triggerRect.width)}px`;
  };

  const openMenu = () => {
    closeOpenWorkOrderStatusMenus(wrapper);

    if (wrapper._menuPortal) {
      return;
    }

    const menu = document.createElement("div");
    menu.className = "work-item-status-menu work-item-status-menu-portal";
    menu.setAttribute("role", "menu");

    ["pointerdown", "mousedown", "click", "keydown"].forEach((eventName) => {
      menu.addEventListener(eventName, (event) => {
        event.stopPropagation();
      });
    });

    WORK_ORDER_STATUS_OPTIONS.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "work-item-status-option";
      optionButton.dataset.status = slugifyValue(option.value);
      optionButton.textContent = option.label;
      optionButton.setAttribute("role", "menuitem");

      optionButton.addEventListener("click", (event) => {
        event.stopPropagation();
        closeOpenWorkOrderStatusMenus();

        if (option.value === (item.status || "Otvoreni RN")) {
          return;
        }

        const previousValue = item.status || "Otvoreni RN";
        setCurrentStatus(option.value);
        setPendingState(true);

        void runMutation(() => apiRequest(`/work-orders/${item.id}`, {
          method: "PATCH",
          body: { status: option.value },
        })).then((success) => {
          setPendingState(false);

          if (!success) {
            setCurrentStatus(previousValue);
            return;
          }

          const updatedItem = state.workOrders.find((entry) => String(entry.id) === String(item.id));
          setCurrentStatus(updatedItem?.status || option.value);
        });
      });

      menu.append(optionButton);
    });

    document.body.append(menu);
    wrapper._menuPortal = menu;
    wrapper.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    positionMenuPortal(menu);
    requestAnimationFrame(() => positionMenuPortal(menu));
  };

  ["pointerdown", "mousedown", "click", "keydown"].forEach((eventName) => {
    wrapper.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (wrapper.classList.contains("is-open")) {
      closeOpenWorkOrderStatusMenus();
      return;
    }
    openMenu();
  });

  wrapper.append(trigger);
  return wrapper;
}

function toggleWorkOrderDetails(workOrderId) {
  const normalizedId = String(workOrderId);

  if (state.expandedWorkOrderIds.has(normalizedId)) {
    state.expandedWorkOrderIds.delete(normalizedId);
  } else {
    state.expandedWorkOrderIds = new Set([normalizedId]);
  }

  renderCompactWorkOrdersList();
}

function renderGroupedWorkOrdersList() {
  const filtered = getFilteredWorkOrders();
  const visibleItems = filtered.slice(0, state.workOrderRenderLimit);
  const fullGroups = buildWorkOrderGroups(filtered);
  const visibleGroups = buildWorkOrderGroups(visibleItems);

  if (workOrdersHelper) {
    workOrdersHelper.textContent = "";
    workOrdersHelper.hidden = true;
  }

  workOrdersBody.replaceChildren(...visibleGroups.map((group) => {
    const section = document.createElement("section");
    section.className = "work-group";

    const groupHeader = document.createElement("div");
    groupHeader.className = "work-group-header";

    const headerLead = document.createElement("div");
    headerLead.className = "work-group-lead";

    const foldIcon = document.createElement("span");
    foldIcon.className = "work-group-fold";
    foldIcon.textContent = "▾";

    const statusBadge = createBadge(group.label, statusBadgeClass(group.status));
    statusBadge.classList.add("work-group-status-badge");

    const totalCount = fullGroups.find((entry) => entry.status === group.status)?.items.length ?? group.items.length;
    const count = document.createElement("span");
    count.className = "work-group-count";
    count.textContent = String(totalCount);

    headerLead.append(foldIcon, statusBadge, count);

    const groupActions = document.createElement("button");
    groupActions.type = "button";
    groupActions.className = "work-group-add-inline";
    groupActions.textContent = "+ Add task";
    groupActions.addEventListener("click", () => {
      focusWorkOrderComposer({ status: group.status });
    });

    groupHeader.append(headerLead, groupActions);

    const columns = document.createElement("div");
    columns.className = "work-group-columns";

    [
      { title: "Osnovno", subtitle: "Broj RN · Status" },
      { title: "Klijent", subtitle: "Tvrtka · Sjedište · OIB" },
      { title: "Lokacija", subtitle: "Objekt · Regija · Koordinate" },
      { title: "Kontakt", subtitle: "Osoba · Email · Broj" },
      { title: "Usluga", subtitle: "Vrsta usluge · Odjel · Opis" },
      { title: "Akcije", subtitle: "Uredi · Obriši" },
    ].forEach((definition) => {
      const cell = document.createElement("div");
      cell.className = "work-group-column";

      const title = document.createElement("strong");
      title.className = "work-group-column-title";
      title.textContent = definition.title;

      const subtitle = document.createElement("span");
      subtitle.className = "work-group-column-subtitle";
      subtitle.textContent = definition.subtitle;

      cell.append(title, subtitle);
      columns.append(cell);
    });

    const body = document.createElement("div");
    body.className = "work-group-body";

    group.items.forEach((item) => {
      const row = document.createElement("article");
      row.className = "work-item-row";

      const createValueStack = (primary, secondary = "", tertiary = "", options = {}) => {
        const {
          badge = null,
          tertiaryClassName = "",
        } = options;
        const stack = document.createElement("div");
        stack.className = "work-item-value-stack";

        const primaryNode = document.createElement("strong");
        primaryNode.className = "work-item-value-primary";
        primaryNode.textContent = primary || "—";
        stack.append(primaryNode);

        if (secondary) {
          const secondaryNode = document.createElement("span");
          secondaryNode.className = "work-item-value-secondary";
          secondaryNode.textContent = secondary;
          stack.append(secondaryNode);
        }

        if (badge) {
          const badgeWrap = document.createElement("div");
          badgeWrap.className = "work-item-detail-badge-wrap";
          badgeWrap.append(badge);
          stack.append(badgeWrap);
        }

        if (tertiary) {
          const tertiaryNode = document.createElement("span");
          tertiaryNode.className = ["work-item-value-tertiary", tertiaryClassName].filter(Boolean).join(" ");
          tertiaryNode.textContent = tertiary;
          stack.append(tertiaryNode);
        }

        return stack;
      };

      const createInlinePills = (...values) => {
        const filteredValues = values.filter(Boolean);

        if (!filteredValues.length) {
          return null;
        }

        const wrap = document.createElement("div");
        wrap.className = "work-item-inline-pills";
        filteredValues.forEach((value) => {
          const pill = document.createElement("span");
          pill.className = "work-item-inline-pill";
          pill.textContent = value;
          wrap.append(pill);
        });
        return wrap;
      };

      const createTagPill = (value) => {
        if (!value) {
          return null;
        }

        const pill = document.createElement("span");
        pill.className = "work-item-tag-pill";
        pill.textContent = value;
        return pill;
      };

      const createPriorityPill = (value) => {
        if (!value) {
          return null;
        }

        const pill = document.createElement("span");
        pill.className = "work-item-priority-pill";
        pill.dataset.priority = slugifyValue(value);

        const icon = document.createElement("span");
        icon.className = "work-item-priority-icon";
        icon.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11M4 3h6.2c.42 0 .67.47.43.81l-1.05 1.46a.75.75 0 0 0 0 .88l1.05 1.46c.24.34-.01.81-.43.81H4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4"/></svg>';

        const text = document.createElement("span");
        text.textContent = value;

        pill.append(icon, text);
        return pill;
      };

      const groupOne = document.createElement("div");
      groupOne.className = "work-item-cell work-item-cell-group";
      const rowStatusBadge = createBadge(item.status || "Bez statusa", statusBadgeClass(item.status));
      rowStatusBadge.classList.add("work-group-status-badge", "work-item-status-badge");
      groupOne.append(createValueStack(item.workOrderNumber || "Bez broja", "", "", { badge: rowStatusBadge }));

      const groupTwo = document.createElement("div");
      groupTwo.className = "work-item-cell work-item-cell-group";
      groupTwo.append(createValueStack(
        item.companyName || "Bez tvrtke",
        item.headquarters || "",
        item.companyOib ? `OIB ${item.companyOib}` : "",
      ));

      const groupThree = document.createElement("div");
      groupThree.className = "work-item-cell work-item-cell-group";
      groupThree.append(createValueStack(
        item.locationName || "Bez lokacije",
        item.coordinates || "",
      ));
      const locationPills = createInlinePills(item.region || "", item.coordinates ? "GPS" : "");
      if (locationPills) {
        groupThree.append(locationPills);
      }

      const groupFour = document.createElement("div");
      groupFour.className = "work-item-cell work-item-cell-group";
      groupFour.append(createValueStack(
        item.contactName || item.contactPhone || "Bez kontakta",
        item.contactEmail || "",
        item.contactPhone && item.contactPhone !== item.contactName ? item.contactPhone : "",
      ));

      const serviceItems = document.createElement("div");
      serviceItems.className = "work-item-cell work-item-cell-group";
      serviceItems.append(createValueStack(
        item.serviceLine || "Bez usluge",
        item.description || "",
        "",
      ));
      const servicePills = createInlinePills(
        item.department || "",
        item.tagText ? `#${item.tagText}` : "",
      );
      if (servicePills) {
        serviceItems.append(servicePills);
      }

      const actions = document.createElement("div");
      actions.className = "work-item-cell work-item-actions";
      actions.append(
        createActionButton("Uredi", "card-button card-button-light", () => hydrateWorkOrderForm(item)),
      );

      if (state.user?.role !== "user") {
        actions.append(
          createActionButton("Obriši", "card-button card-button-light card-danger", () => {
            if (!window.confirm(`Obrisati ${item.workOrderNumber}?`)) {
              return;
            }

            void runMutation(() => apiRequest(`/work-orders/${item.id}`, { method: "DELETE" }));
          }),
        );
      }

      row.append(groupOne, groupTwo, groupThree, groupFour, serviceItems, actions);
      body.append(row);
    });

    const addRow = document.createElement("button");
    addRow.type = "button";
    addRow.className = "work-group-add-row";
    addRow.textContent = "+ Add task";
    addRow.addEventListener("click", () => {
      focusWorkOrderComposer({ status: group.status });
    });

    section.append(groupHeader, columns, body, addRow);
    return section;
  }));

  workOrdersEmpty.hidden = filtered.length !== 0;

  if (filtered.length === 0) {
    workOrdersLoadState.hidden = true;
    workOrdersLoadState.textContent = "";
    return;
  }

  workOrdersLoadState.hidden = false;
  workOrdersLoadState.textContent = visibleItems.length < filtered.length
    ? `Prikazano ${visibleItems.length} od ${filtered.length} RN. Skrolaj dalje za jos.`
    : `Prikazano svih ${filtered.length} RN.`;
}

function renderCompactWorkOrdersList() {
  const filtered = getFilteredWorkOrders();
  const visibleItems = filtered.slice(0, state.workOrderRenderLimit);

  if (workOrdersHelper) {
    workOrdersHelper.textContent = "";
    workOrdersHelper.hidden = true;
  }

  const section = document.createElement("section");
  section.className = "work-group work-group-flat";

  const columns = document.createElement("div");
  columns.className = "work-group-columns";

  ["Osnovno", "Klijent", "Lokacija", "Kontakt", "Usluga", "Izvrsitelji"].forEach((label) => {
    const cell = document.createElement("div");
    cell.className = "work-group-column";

    const title = document.createElement("strong");
    title.className = "work-group-column-title";
    title.textContent = label;

    cell.append(title);
    columns.append(cell);
  });

  const body = document.createElement("div");
  body.className = "work-group-body";

  const getExecutorTone = (name) => {
    const palette = [
      { bg: "#e7efff", fg: "#3a63b8" },
      { bg: "#f6e7ff", fg: "#8a47b8" },
      { bg: "#e8f8ef", fg: "#2b7a52" },
      { bg: "#fff0de", fg: "#a15a18" },
      { bg: "#ffe4ea", fg: "#b23f6a" },
      { bg: "#ecebff", fg: "#5446c9" },
    ];
    const normalized = String(name ?? "").trim();
    const hash = [...normalized].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
  };

  const createExecutorDots = (executors) => {
    const wrap = document.createElement("div");
    wrap.className = "work-executor-list";

    executors.forEach((executor) => {
      const avatar = document.createElement("span");
      avatar.className = "work-executor-avatar";
      avatar.title = executor;
      const tone = getExecutorTone(executor);
      avatar.style.setProperty("--executor-bg", tone.bg);
      avatar.style.setProperty("--executor-fg", tone.fg);
      const initials = document.createElement("span");
      initials.className = "work-executor-initials";
      initials.textContent = getUserInitials({ fullName: executor }) || "?";
      avatar.append(initials);

      wrap.append(avatar);
    });

    if (executors.length === 0) {
      const empty = document.createElement("span");
      empty.className = "work-executor-empty";
      empty.textContent = "—";
      wrap.append(empty);
    }

    return wrap;
  };

  visibleItems.forEach((item) => {
      const rowCard = document.createElement("section");
      rowCard.className = "work-item-card";

      const row = document.createElement("article");
      row.className = "work-item-row";

      const createBasicField = (label, value, options = {}) => {
        const {
          valueClassName = "",
          fieldClassName = "",
        } = options;
        const field = document.createElement("div");
        field.className = ["work-item-basic-field", fieldClassName].filter(Boolean).join(" ");

        const labelNode = document.createElement("span");
        labelNode.className = "work-item-basic-label";
        labelNode.textContent = label;

        const valueNode = document.createElement("strong");
        valueNode.className = ["work-item-basic-value", valueClassName].filter(Boolean).join(" ");
        valueNode.textContent = value || "-";

        field.append(labelNode, valueNode);
        return field;
      };

      const createMetaIcon = (iconName) => {
        const icon = document.createElement("span");
        icon.className = `work-item-meta-icon is-${iconName}`;

        if (iconName === "opened") {
          icon.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.75V1.5M12 2.75V1.5M2.75 5.25h10.5M3.75 3.5h8.5a1 1 0 0 1 1 1v7.75a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/></svg>';
        } else {
          icon.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.25v4l2.5 1.5M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/></svg>';
        }

        return icon;
      };

      const createIconMetaLine = (iconName, value, options = {}) => {
        const { valueClassName = "" } = options;
        const line = document.createElement("div");
        line.className = "work-item-meta-line";

        const text = document.createElement("span");
        text.className = ["work-item-meta-value", valueClassName].filter(Boolean).join(" ");
        text.textContent = value || "-";

        line.append(createMetaIcon(iconName), text);
        return line;
      };

      const createValueStack = (primary, secondary = "", tertiary = "", options = {}) => {
        const { tertiaryClassName = "" } = options;
        const stack = document.createElement("div");
        stack.className = "work-item-value-stack";

        const primaryNode = document.createElement("strong");
        primaryNode.className = "work-item-value-primary";
        primaryNode.textContent = primary || "-";
        stack.append(primaryNode);

        if (secondary) {
          const secondaryNode = document.createElement("span");
          secondaryNode.className = "work-item-value-secondary";
          secondaryNode.textContent = secondary;
          stack.append(secondaryNode);
        }

        if (tertiary) {
          const tertiaryNode = document.createElement("span");
          tertiaryNode.className = ["work-item-value-tertiary", tertiaryClassName].filter(Boolean).join(" ");
          tertiaryNode.textContent = tertiary;
          stack.append(tertiaryNode);
        }

        return stack;
      };

      const createInlinePills = (...values) => {
        const filteredValues = values.filter(Boolean);

        if (!filteredValues.length) {
          return null;
        }

        const wrap = document.createElement("div");
        wrap.className = "work-item-inline-pills";
        filteredValues.forEach((value) => {
          const pill = document.createElement("span");
          pill.className = "work-item-inline-pill";
          pill.textContent = value;
          wrap.append(pill);
        });
        return wrap;
      };

      const createTagPill = (value) => {
        if (!value) {
          return null;
        }

        const pill = document.createElement("span");
        pill.className = "work-item-tag-pill";
        pill.textContent = value;
        return pill;
      };

      const createPriorityPill = (value) => {
        if (!value) {
          return null;
        }

        const pill = document.createElement("span");
        pill.className = "work-item-priority-pill";
        pill.dataset.priority = slugifyValue(value);

        const icon = document.createElement("span");
        icon.className = "work-item-priority-icon";
        icon.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11M4 3h6.2c.42 0 .67.47.43.81l-1.05 1.46a.75.75 0 0 0 0 .88l1.05 1.46c.24.34-.01.81-.43.81H4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4"/></svg>';

        const text = document.createElement("span");
        text.textContent = value;

        pill.append(icon, text);
        return pill;
      };

      const executorValues = [item.executor1, item.executor2].filter(Boolean);
      rowCard.classList.add("is-clickable");
      row.addEventListener("click", (event) => {
        if (isInteractiveWorkOrderTarget(event.target)) {
          return;
        }
        hydrateWorkOrderForm(item);
      });

      const basicCell = document.createElement("div");
      basicCell.className = "work-item-cell work-item-cell-group";

      const basicsStack = document.createElement("div");
      basicsStack.className = "work-item-basic-stack";

      const numberField = document.createElement("div");
      numberField.className = "work-item-number-line";
      numberField.dataset.preventRowOpen = "true";
      numberField.addEventListener("click", (event) => {
        event.stopPropagation();
        hydrateWorkOrderForm(item);
      });
      const numberValue = document.createElement("strong");
      numberValue.className = "work-item-basic-value is-work-order-number";
      numberValue.textContent = item.workOrderNumber || "Bez broja";
      numberField.append(numberValue);
      basicsStack.append(numberField);

      const statusRow = document.createElement("div");
      statusRow.className = "work-item-basic-field work-item-status-row";
      statusRow.dataset.preventRowOpen = "true";

      ["pointerdown", "mousedown", "click", "keydown"].forEach((eventName) => {
        statusRow.addEventListener(eventName, (event) => {
          event.stopPropagation();
        });
      });

      statusRow.append(createWorkOrderStatusDropdown(item));
      basicsStack.append(statusRow);

      basicsStack.append(
        createIconMetaLine("opened", formatCompactOpenedDate(item.openedDate), {
          valueClassName: "is-subtle-date",
        }),
        createIconMetaLine("due", formatCompactDueDate(item.dueDate), {
          valueClassName: ["is-subtle-date", isOverdueWorkOrder(item) ? "is-overdue" : ""].join(" "),
        }),
      );

      basicCell.append(basicsStack);

      const clientCell = document.createElement("div");
      clientCell.className = "work-item-cell work-item-cell-group";
      clientCell.append(createValueStack(
        item.companyName || "Bez tvrtke",
        item.headquarters || "",
        item.companyOib ? `OIB ${item.companyOib}` : "",
      ));
      const clientPills = createInlinePills(...getWorkOrderClientPills(item));
      if (clientPills) {
        clientPills.classList.add("work-item-inline-pills-compact");
        clientCell.append(clientPills);
      }

      const locationCell = document.createElement("div");
      locationCell.className = "work-item-cell work-item-cell-group";
      locationCell.append(createValueStack(
        item.locationName || "Bez lokacije",
        item.region || "",
        item.coordinates || "",
      ));

      const locationMeta = document.createElement("div");
      locationMeta.className = "work-item-location-meta";
      const tagPill = createTagPill(item.tagText || "");
      const priorityPill = createPriorityPill(
        item.priority ? getOptionLabel(PRIORITY_OPTIONS, item.priority) : "",
      );
      if (tagPill) {
        locationMeta.append(tagPill);
      }
      if (priorityPill) {
        locationMeta.append(priorityPill);
      }
      if (locationMeta.childElementCount) {
        locationCell.append(locationMeta);
      }

      const contactCell = document.createElement("div");
      contactCell.className = "work-item-cell work-item-cell-group";
      contactCell.append(createValueStack(
        item.contactName || item.contactPhone || "Bez kontakta",
        item.contactEmail || "",
        item.contactPhone && item.contactPhone !== item.contactName ? item.contactPhone : "",
      ));

      const serviceCell = document.createElement("div");
      serviceCell.className = "work-item-cell work-item-cell-group";
      const serviceDescription = looksLikeWorkOrderLog(item.description) ? "" : item.description;
      if (item.department) {
        const departmentPill = document.createElement("span");
        departmentPill.className = "work-item-department-pill";
        departmentPill.textContent = item.department;
        serviceCell.append(departmentPill);
      }

      const serviceLine = document.createElement("div");
      serviceLine.className = "work-item-service-line";
      serviceLine.textContent = item.serviceLine || "Bez usluge";
      serviceCell.append(serviceLine);

      if (serviceDescription) {
        const serviceNote = document.createElement("div");
        serviceNote.className = "work-item-service-note";
        serviceNote.textContent = serviceDescription;
        serviceCell.append(serviceNote);
      }

      const executorsCell = document.createElement("div");
      executorsCell.className = "work-item-cell work-item-cell-group work-item-executors-cell";
      executorsCell.append(createExecutorDots(executorValues));

      row.append(basicCell, clientCell, locationCell, contactCell, serviceCell, executorsCell);
      rowCard.append(row);
      body.append(rowCard);
  });

  section.append(columns, body);
  workOrdersBody.replaceChildren(section);

  workOrdersEmpty.hidden = filtered.length !== 0;

  if (filtered.length === 0) {
    workOrdersLoadState.hidden = true;
    workOrdersLoadState.textContent = "";
    return;
  }

  workOrdersLoadState.hidden = false;
  workOrdersLoadState.textContent = visibleItems.length < filtered.length
    ? `Prikazano ${visibleItems.length} od ${filtered.length} RN. Skrolaj dalje za jos.`
    : `Prikazano svih ${filtered.length} RN.`;
}

function renderCompanies() {
  const sortedCompanies = state.companies
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "hr"));
  const canManageMasterData = getCanManageMasterData();

  if (companyOpenFormButton) {
    companyOpenFormButton.hidden = !canManageMasterData;
  }

  if (companiesHelper) {
    companiesHelper.textContent = canManageMasterData
      ? `${sortedCompanies.length} tvrtki. Klikni bilo gdje na red za otvaranje i uredjivanje.`
      : `${sortedCompanies.length} tvrtki uredeno kao list view.`;
  }

  companiesBody.replaceChildren(...sortedCompanies.map((company) => {
    const row = document.createElement("tr");
    row.className = "list-row company-list-row";
    if (canManageMasterData) {
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `Uredi tvrtku ${company.name}`);
      row.addEventListener("click", () => {
        hydrateCompanyForm(company);
      });
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          hydrateCompanyForm(company);
        }
      });
    }

    const contact = [company.contactPhone, company.contactEmail].filter(Boolean).join(" / ") || "Bez kontakta";

    row.append(
      createCompanyIdentityCell(company),
      createStackCell({
        title: company.representative || "Bez predstavnika",
        subtitle: contact,
        tertiary: company.contactPhone || company.contactEmail ? "Kontakt podaci" : "Nema kontakta",
      }),
      createStackCell({
        title: company.contractType || "Bez ugovora",
        subtitle: company.contractNumber || "Bez broja ugovora",
        tertiary: company.period ? `Periodika: ${company.period}` : "",
      }),
      createStackCell({
        title: company.isActive ? "Aktivna tvrtka" : "Neaktivna tvrtka",
        subtitle: company.note ? "Ima internu napomenu" : "Bez dodatne napomene",
        meta: [
          createStatusPill(company.isActive ? "Aktivno" : "Neaktivno", company.isActive),
          company.note ? "Napomena" : "",
        ],
      }),
    );

    return row;
  }));

  companiesEmpty.hidden = sortedCompanies.length !== 0;
}

function renderLocations() {
  const sortedLocations = state.locations
    .slice()
    .sort((left, right) => {
      const leftCompany = getCompany(left.companyId)?.name ?? "";
      const rightCompany = getCompany(right.companyId)?.name ?? "";
      const companyCompare = leftCompany.localeCompare(rightCompany, "hr");

      if (companyCompare !== 0) {
        return companyCompare;
      }

      return left.name.localeCompare(right.name, "hr");
    });
  const canManageMasterData = getCanManageMasterData();

  if (locationOpenFormButton) {
    locationOpenFormButton.hidden = !canManageMasterData;
    locationOpenFormButton.disabled = state.companies.length === 0;
  }

  if (locationsHelper) {
    locationsHelper.textContent = `${sortedLocations.length} lokacija u urednom list prikazu.`;
  }

  locationsBody.replaceChildren(...sortedLocations.map((location) => {
    const row = document.createElement("tr");
    row.className = "list-row";
    const companyName = getCompany(location.companyId)?.name ?? "Nepoznata tvrtka";
    const contactSummary = buildLocationContacts(location)
      .map((item) => item.name || item.phone || item.email)
      .filter(Boolean)
      .join(", ") || "Bez kontakata";
    const actionsCell = document.createElement("td");
    actionsCell.className = "table-actions";
    if (canManageMasterData) {
      actionsCell.append(
        createActionButton("Uredi", "card-button", () => hydrateLocationForm(location)),
        createActionButton("Obrisi", "card-button card-danger", () => {
          if (!window.confirm(`Obrisati lokaciju ${location.name}?`)) {
            return;
          }

          void runMutation(() => apiRequest(`/locations/${location.id}`, { method: "DELETE" }));
        }),
      );
    }

    row.append(
      createStackCell({
        eyebrow: companyName,
        title: location.name,
        subtitle: location.representative || "Bez predstavnika",
        meta: location.period ? [`Periodika: ${location.period}`] : [],
      }),
      createStackCell({
        title: location.region || "Bez regije",
        subtitle: location.coordinates || "Bez koordinata",
        tertiary: location.note ? "Ima internu napomenu" : "",
      }),
      createStackCell({
        title: contactSummary,
        subtitle: buildLocationContacts(location).length > 0 ? `${buildLocationContacts(location).length} kontakta` : "Nema kontakata",
      }),
      createStackCell({
        title: location.isActive ? "Aktivna lokacija" : "Neaktivna lokacija",
        subtitle: companyName,
        meta: [createStatusPill(location.isActive ? "Aktivno" : "Neaktivno", location.isActive)],
      }),
      actionsCell,
    );

    return row;
  }));

  locationsEmpty.hidden = sortedLocations.length !== 0;
}

function renderUsers() {
  usersBody.replaceChildren(...state.users.map((user) => {
    const row = document.createElement("tr");
    row.className = "list-row";
    const actionsCell = document.createElement("td");
    actionsCell.className = "table-actions";

    if (canManageRenderedUser(user)) {
      actionsCell.append(
        createActionButton("Uredi", "card-button", () => hydrateUserForm(user)),
      );
    }

    row.append(
      createStackCell({
        title: user.fullName || user.email,
        subtitle: user.legacyUsername ? `Legacy: ${user.legacyUsername}` : "Web account",
        tertiary: (user.organizations ?? []).map((organization) => organization.name).join(", "),
      }),
      createStackCell({
        title: user.email,
        subtitle: user.lastLoginAt ? `Zadnja prijava ${formatDate(user.lastLoginAt)}` : "Jos bez prijave",
      }),
      createStackCell({
        title: user.role === "admin" ? "Admin" : user.role === "super_admin" ? "Super Admin" : "User",
        subtitle: user.isActive ? "Active" : "Inactive",
      }),
      createStackCell({
        title: user.organizationName || "Bez organizacije",
        subtitle: user.organizations?.length > 1 ? `${user.organizations.length} organizations` : "Single organization",
      }),
      createStackCell({
        title: user.isActive ? "Active" : "Inactive",
      }),
      actionsCell,
    );

    return row;
  }));
}

function renderLoginContentItems() {
  loginContentBody.replaceChildren(...state.loginContentItems.map((item) => {
    const row = document.createElement("tr");
    row.className = "list-row";
    const actionsCell = document.createElement("td");
    actionsCell.className = "table-actions";
    actionsCell.append(
      createActionButton("Uredi", "card-button", () => hydrateLoginContentForm(item)),
      createActionButton("Obrisi", "card-button card-danger", () => {
        if (!window.confirm("Obrisati ovu login pricu?")) {
          return;
        }

        void runMutation(() => apiRequest(`/login-content/${item.id}`, { method: "DELETE" }), loginContentError);
      }),
    );

    row.append(
      createStackCell({
        title: item.heading,
        subtitle: item.quoteText,
        meta: item.accentLabel ? [item.accentLabel] : [],
      }),
      createStackCell({
        title: item.authorName || "Bez autora",
        subtitle: item.authorTitle || "",
      }),
      createStackCell({
        title: item.isActive ? "Active" : "Inactive",
      }),
      actionsCell,
    );

    return row;
  }));
}

function renderSignupRequests() {
  if (!signupRequestsBody) {
    return;
  }

  signupRequestsBody.replaceChildren(...state.signupRequests.map((request) => {
    const row = document.createElement("tr");
    row.className = "list-row";

    const actionsCell = document.createElement("td");
    actionsCell.className = "table-actions";

    if (request.status === "pending") {
      const organizationSelect = document.createElement("select");
      organizationSelect.className = "signup-inline-select";
      organizationSelect.append(
        createOption("__new__", `Create new: ${request.organizationName}`, "__new__"),
        ...state.organizations.map((organization) => createOption(organization.id, organization.name)),
      );

      const roleSelect = document.createElement("select");
      roleSelect.className = "signup-inline-select";
      roleSelect.append(
        createOption("admin", "Admin", "admin"),
        createOption("user", "User", "admin"),
      );

      const inlineControls = document.createElement("div");
      inlineControls.className = "signup-approval-controls";
      inlineControls.append(organizationSelect, roleSelect);

      actionsCell.append(
        inlineControls,
        createActionButton("Approve", "card-button", () => {
          void runMutation(() => apiRequest(`/signup-requests/${request.id}/approve`, {
            method: "POST",
            body: {
              organizationId: organizationSelect.value === "__new__" ? "" : organizationSelect.value,
              role: roleSelect.value,
            },
          }), syncError);
        }),
        createActionButton("Reject", "card-button card-danger", () => {
          if (!window.confirm(`Reject signup request for ${request.email}?`)) {
            return;
          }

          void runMutation(() => apiRequest(`/signup-requests/${request.id}/reject`, {
            method: "POST",
            body: {},
          }), syncError);
        }),
      );
    }

    row.append(
      createStackCell({
        title: request.fullName || request.email,
        subtitle: request.email,
        tertiary: request.phone || "",
      }),
      createStackCell({
        title: request.organizationName,
        subtitle: request.organizationOib ? `OIB ${request.organizationOib}` : "Bez OIB-a",
        tertiary: request.note || "",
      }),
      createStackCell({
        title: request.status,
        subtitle: request.emailStatus ? `Email: ${request.emailStatus}` : "Bez email loga",
      }),
      createStackCell({
        title: request.requestedAt ? formatDate(request.requestedAt.slice(0, 10)) : "Bez datuma",
        subtitle: request.processedAt ? `Processed ${formatDate(request.processedAt.slice(0, 10))}` : "Pending review",
      }),
      actionsCell,
    );

    return row;
  }));
}

function renderManagement() {
  const currentOrganization = state.organizations.find((item) => item.id === state.activeOrganizationId)
    ?? state.organizations[0]
    ?? null;

  if (organizationPanel) {
    organizationPanel.hidden = !getIsSuperAdmin();
  }

  if (getIsSuperAdmin()) {
    if (managementViewKicker) {
      managementViewKicker.textContent = "Platform control";
    }
    if (managementViewTitle) {
      managementViewTitle.textContent = "Organizations & admins";
    }
    if (managementViewDescription) {
      managementViewDescription.textContent = "Ti jedini kreiras organizacije, dodjeljujes admina i po potrebi pregledavas signup zahtjeve prije odobravanja pristupa.";
    }
    if (userPanelKicker) {
      userPanelKicker.textContent = "Admin assignment";
    }
    if (userPanelTitle) {
      userPanelTitle.textContent = "Admins & users";
    }
    if (userManagementNote) {
      userManagementNote.textContent = "Odaberi organizaciju i rolu. Admin ovdje dobiva pristup svojoj organizaciji, a user ostaje operativni korisnik.";
    }
  } else if (getIsAdmin()) {
    if (managementViewKicker) {
      managementViewKicker.textContent = "Organization admin";
    }
    if (managementViewTitle) {
      managementViewTitle.textContent = "Team access";
    }
    if (managementViewDescription) {
      managementViewDescription.textContent = currentOrganization
        ? `Upravljaj korisnicima za organizaciju ${currentOrganization.name}. Organizacije i admine postavlja samo super admin.`
        : "Upravljaj korisnicima svoje organizacije. Organizacije i admine postavlja samo super admin.";
    }
    if (userPanelKicker) {
      userPanelKicker.textContent = "Organization team";
    }
    if (userPanelTitle) {
      userPanelTitle.textContent = "Users";
    }
    if (userManagementNote) {
      userManagementNote.textContent = currentOrganization
        ? `Novi korisnici automatski pripadaju organizaciji ${currentOrganization.name}.`
        : "Novi korisnici automatski pripadaju tvojoj aktivnoj organizaciji.";
    }
  }

  renderUsers();
  renderSignupRequests();
  renderLoginContentItems();
}

function render() {
  renderAuthState();
  renderLoginContent();
  renderSummary();
  renderSharedOptions();
  renderReminders();
  renderTodo();
  renderCompanies();
  renderLocations();
  renderManagement();
  renderModuleView();
  renderActiveView();
  renderChatDock();
}

sidebarNavItems.forEach((button) => {
  button.addEventListener("click", () => {
    const itemName = button.dataset.sidebarItem;

    if (!itemName) {
      return;
    }

    activateSidebarItem(itemName, {
      expandSidebar: state.sidebarCollapsed,
    });
  });
});

railButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const groupName = button.dataset.sidebarGroup;

    if (!groupName) {
      return;
    }

    const shouldNavigate = state.activeSidebarGroup !== groupName;
    activateSidebarGroup(groupName, {
      navigate: shouldNavigate,
      expandSidebar: state.sidebarCollapsed,
    });
  });
});

sidebarGroupButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const groupName = button.dataset.groupToggle;

    if (!groupName) {
      return;
    }

    activateSidebarGroup(groupName, {
      navigate: state.activeSidebarGroup !== groupName,
      expandSidebar: state.sidebarCollapsed,
    });
  });
});

appHomeButton?.addEventListener("click", () => {
  activateSidebarItem("dashboard", {
    expandSidebar: state.sidebarCollapsed,
  });
});

sidebarHomeButton?.addEventListener("click", () => {
  activateSidebarItem("dashboard", {
    expandSidebar: state.sidebarCollapsed,
  });
});

sidebarCollapseToggle?.addEventListener("click", () => {
  setSidebarCollapsed(!state.sidebarCollapsed);
});

appRailToggle?.addEventListener("click", () => {
  setRailHidden(true);
});

appRailRestore?.addEventListener("click", () => {
  setRailHidden(false);
});

chatLauncher?.addEventListener("click", () => {
  setChatOpen(!state.chat.open);
});

chatCloseButton?.addEventListener("click", () => {
  setChatOpen(false);
});

chatNewGroupButton?.addEventListener("click", () => {
  setChatComposerOpen(true);
});

chatTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.chat.tab = button.dataset.chatTab || "conversations";
    renderChatDock();
  });
});

chatSearchInput?.addEventListener("input", () => {
  state.chat.search = chatSearchInput.value.trim();
  renderChatDock();
});

chatMessageForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void sendChatMessage();
});

chatMessageInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void sendChatMessage();
  }
});

chatComposerTitleInput?.addEventListener("input", () => {
  state.chat.composerTitle = chatComposerTitleInput.value.trim();
});

chatComposerCreateButton?.addEventListener("click", () => {
  void createChatGroupConversation();
});

chatComposerCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setChatComposerOpen(false);
  });
});

workOrderCompanyIdInput.addEventListener("change", () => {
  const company = getCompany(workOrderCompanyIdInput.value);
  fillWorkOrderCompanySnapshot(company);
  rebuildWorkOrderLocationOptions("");
  applySelectedLocationDefaults();
  renderWorkOrderEditorSummary();
});

workOrderLocationIdInput.addEventListener("change", () => {
  applySelectedLocationDefaults();
  renderWorkOrderEditorSummary();
});

workOrderContactSlotInput.addEventListener("change", () => {
  applySelectedContactDefaults();
  renderWorkOrderEditorSummary();
});

workOrderForm.addEventListener("input", () => {
  renderWorkOrderEditorSummary();
  queueWorkOrderAutoSave();
});

workOrderForm.addEventListener("change", () => {
  renderWorkOrderEditorSummary();
  void persistWorkOrderAutoSave({ immediate: true });
});

workOrdersTableWrap.addEventListener("scroll", () => {
  if (state.activeWorkOrderViewMode !== "list") {
    return;
  }

  const nearBottom = workOrdersTableWrap.scrollTop + workOrdersTableWrap.clientHeight >= workOrdersTableWrap.scrollHeight - 120;

  if (nearBottom) {
    loadMoreWorkOrders();
  }
});

workOrderSearchInput.addEventListener("input", () => {
  resetWorkOrderListWindow();
  renderWorkOrderWorkspace();
});
workOrderFilterStatusInput.addEventListener("change", () => {
  resetWorkOrderListWindow();
  renderWorkOrderWorkspace();
});
workOrderFilterCompanyInput.addEventListener("change", () => {
  resetWorkOrderListWindow();
  renderWorkOrderWorkspace();
});
workOrderMapFilterStatusInput?.addEventListener("change", () => {
  state.workOrderMap.filters.status = workOrderMapFilterStatusInput.value || "all";
  renderWorkOrderWorkspace();
});
workOrderMapFilterPriorityInput?.addEventListener("change", () => {
  state.workOrderMap.filters.priority = workOrderMapFilterPriorityInput.value || "all";
  renderWorkOrderWorkspace();
});
workOrderMapFilterRegionInput?.addEventListener("change", () => {
  state.workOrderMap.filters.region = workOrderMapFilterRegionInput.value || "all";
  renderWorkOrderWorkspace();
});

reminderWorkOrderIdInput?.addEventListener("change", () => {
  syncReminderContextFromWorkOrder();
});

reminderCompanyIdInput?.addEventListener("change", () => {
  renderReminderLinkPreview();
});

reminderForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const isEditing = Boolean(reminderIdInput.value);
  const path = isEditing ? `/reminders/${reminderIdInput.value}` : "/reminders";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: buildReminderPayload(),
  }), reminderError).then((success) => {
    if (success) {
      resetReminderForm();
    }
  });
});

reminderResetButton?.addEventListener("click", resetReminderForm);
remindersSearchInput?.addEventListener("input", renderReminders);
remindersFilterStatusInput?.addEventListener("change", renderReminders);
todoWorkOrderIdInput?.addEventListener("change", renderTodoLinkPreview);
todoForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const isEditing = Boolean(todoIdInput.value);
  const path = isEditing ? `/todo-tasks/${todoIdInput.value}` : "/todo-tasks";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: buildTodoTaskPayload(),
  }), todoError).then((success) => {
    if (success) {
      if (!isEditing) {
        resetTodoForm();
      }
    }
  });
});
todoResetButton?.addEventListener("click", resetTodoForm);
todoSearchInput?.addEventListener("input", renderTodo);
todoFilterScopeInput?.addEventListener("change", renderTodo);
todoFilterStatusInput?.addEventListener("change", renderTodo);
todoDetailStatus?.addEventListener("change", () => {
  const taskId = todoDetailStatus.dataset.taskId;

  if (!taskId) {
    return;
  }

  void runMutation(() => apiRequest(`/todo-tasks/${taskId}`, {
    method: "PATCH",
    body: {
      status: todoDetailStatus.value,
    },
  }), todoCommentError);
});
todoDetailPriority?.addEventListener("change", () => {
  const taskId = todoDetailPriority.dataset.taskId;

  if (!taskId) {
    return;
  }

  void runMutation(() => apiRequest(`/todo-tasks/${taskId}`, {
    method: "PATCH",
    body: {
      priority: todoDetailPriority.value,
    },
  }), todoCommentError);
});
todoDetailAssignee?.addEventListener("change", () => {
  const taskId = todoDetailAssignee.dataset.taskId;

  if (!taskId) {
    return;
  }

  void runMutation(() => apiRequest(`/todo-tasks/${taskId}`, {
    method: "PATCH",
    body: {
      assignedToUserId: todoDetailAssignee.value,
    },
  }), todoCommentError);
});
todoDetailDueDate?.addEventListener("change", () => {
  const taskId = todoDetailDueDate.dataset.taskId;

  if (!taskId) {
    return;
  }

  void runMutation(() => apiRequest(`/todo-tasks/${taskId}`, {
    method: "PATCH",
    body: {
      dueDate: todoDetailDueDate.value,
    },
  }), todoCommentError);
});
todoCommentForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const task = getTodoTaskById();

  if (!task) {
    return;
  }

  void runMutation(() => apiRequest(`/todo-tasks/${task.id}/comments`, {
    method: "POST",
    body: {
      message: todoCommentInput.value,
    },
  }), todoCommentError).then((success) => {
    if (success && todoCommentInput) {
      todoCommentInput.value = "";
    }
  });
});

workOrderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void persistWorkOrderAutoSave({ immediate: true });
});

workOrderResetButton.addEventListener("click", resetWorkOrderForm);
workOrderEditorCloseButton?.addEventListener("click", () => {
  closeWorkOrderEditor({ reset: true });
});
workOrderEditorBackdrop?.addEventListener("click", () => {
  closeWorkOrderEditor({ reset: true });
});
workOrderOpenFormButton?.addEventListener("click", () => {
  focusWorkOrderComposer();
});
workOrderOpenReminderButton?.addEventListener("click", () => {
  const linkedWorkOrder = state.workOrders.find((item) => item.id === workOrderIdInput.value) ?? null;
  openReminderComposerForWorkOrder(linkedWorkOrder);

  if (!linkedWorkOrder && reminderCompanyIdInput && workOrderCompanyIdInput.value) {
    rebuildReminderCompanyOptions(workOrderCompanyIdInput.value);
    reminderCompanyIdInput.value = workOrderCompanyIdInput.value;
    renderReminderLinkPreview();
  }
});
workOrderOpenTodoButton?.addEventListener("click", () => {
  const linkedWorkOrder = state.workOrders.find((item) => item.id === workOrderIdInput.value) ?? null;
  openTodoComposerForWorkOrder(linkedWorkOrder);
});
measurementSheetOpenButton?.addEventListener("click", () => {
  openMeasurementSheet();
});
measurementSheetCloseButton?.addEventListener("click", closeMeasurementSheet);
measurementSheetBackdrop?.addEventListener("click", closeMeasurementSheet);
measurementSheetAddRowButton?.addEventListener("click", () => {
  state.measurementSheet.rows.push(createMeasurementRow());
  renderMeasurementSheet();
});
measurementSheetAddColumnButton?.addEventListener("click", addMeasurementColumn);
measurementSheetResetButton?.addEventListener("click", resetMeasurementSheet);
measurementContextAddRowAboveButton?.addEventListener("click", () => {
  insertMeasurementContextRow("above");
});
measurementContextAddRowBelowButton?.addEventListener("click", () => {
  insertMeasurementContextRow("below");
});
measurementContextAddColumnLeftButton?.addEventListener("click", () => {
  insertMeasurementContextColumn("left");
});
measurementContextAddColumnRightButton?.addEventListener("click", () => {
  insertMeasurementContextColumn("right");
});
measurementFormulaInput?.addEventListener("focus", () => {
  if (!state.measurementSheet.activeCell) {
    measurementFormulaInput.blur();
    return;
  }

  state.measurementSheet.editingCell = {
    rowId: state.measurementSheet.activeCell.rowId,
    columnId: state.measurementSheet.activeCell.columnId,
  };
  state.measurementSheet.editorSource = "formula-bar";
  syncMeasurementFormulaEditState();
});
measurementFormulaInput?.addEventListener("input", (event) => {
  if (!state.measurementSheet.activeCell) {
    return;
  }

  state.measurementSheet.editingCell = {
    rowId: state.measurementSheet.activeCell.rowId,
    columnId: state.measurementSheet.activeCell.columnId,
  };
  state.measurementSheet.editorSource = "formula-bar";
  setMeasurementCellRawValue(
    state.measurementSheet.activeCell.rowId,
    state.measurementSheet.activeCell.columnId,
    event.currentTarget.value,
  );
  syncMeasurementFormulaEditState();
  updateMeasurementEditingCellPreview(
    state.measurementSheet.activeCell.rowId,
    state.measurementSheet.activeCell.columnId,
  );
  scheduleMeasurementSheetComputedRefresh();
});
measurementFormulaInput?.addEventListener("blur", () => {
  if (state.measurementSheet.editorSource === "formula-bar") {
    exitMeasurementEditMode();
  }
});
measurementFormatTypeInput?.addEventListener("change", () => {
  const nextType = measurementFormatTypeInput.value;

  if (measurementFormatDecimalsInput) {
    measurementFormatDecimalsInput.disabled = ["general", "text", "integer"].includes(nextType);
  }

  applyMeasurementToolbarFormat({
    type: nextType,
    decimals: normalizeMeasurementDecimals(measurementFormatDecimalsInput?.value),
  });
});
measurementFormatDecimalsInput?.addEventListener("input", () => {
  measurementFormatDecimalsInput.value = String(normalizeMeasurementDecimals(measurementFormatDecimalsInput.value));
  applyMeasurementToolbarFormat({
    decimals: normalizeMeasurementDecimals(measurementFormatDecimalsInput.value),
  });
});
measurementFormatDecimalsInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  commitMeasurementEditMode();
});
measurementFormatBorderInput?.addEventListener("change", () => {
  applyMeasurementToolbarFormat({
    borderPreset: measurementFormatBorderInput.value,
  });
});
measurementFillCopyButton?.addEventListener("click", () => {
  applyMeasurementFill("copy");
});
measurementFillSeriesButton?.addEventListener("click", () => {
  applyMeasurementFill("series");
});
measurementSheetGridWrap?.addEventListener("scroll", () => {
  extendMeasurementSheetRowsIfNeeded();
});

workspaceViewChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const targetView = chip.dataset.jumpView;

    if (!targetView) {
      return;
    }

    state.activeView = targetView;
    renderActiveView();
  });
});

workOrderModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextMode = button.dataset.workOrderMode;

    if (!nextMode) {
      return;
    }

    setActiveWorkOrderViewMode(nextMode);
  });
});

workOrderCalendarPrevButton?.addEventListener("click", () => {
  state.workOrderCalendar.weekStart = state.workOrderCalendar.displayMode === "month"
    ? shiftMonthDateKey(state.workOrderCalendar.weekStart, -1)
    : shiftDateKey(state.workOrderCalendar.weekStart, -7);
  renderWorkOrderWorkspace();
});

workOrderCalendarTodayButton?.addEventListener("click", () => {
  state.workOrderCalendar.weekStart = new Date().toISOString().slice(0, 10);
  renderWorkOrderWorkspace();
});

workOrderCalendarNextButton?.addEventListener("click", () => {
  state.workOrderCalendar.weekStart = state.workOrderCalendar.displayMode === "month"
    ? shiftMonthDateKey(state.workOrderCalendar.weekStart, 1)
    : shiftDateKey(state.workOrderCalendar.weekStart, 7);
  renderWorkOrderWorkspace();
});

workOrderCalendarDisplayWeekButton?.addEventListener("click", () => {
  if (state.workOrderCalendar.displayMode === "week") {
    return;
  }

  state.workOrderCalendar.displayMode = "week";
  renderWorkOrderWorkspace();
});

workOrderCalendarDisplayMonthButton?.addEventListener("click", () => {
  if (state.workOrderCalendar.displayMode === "month") {
    return;
  }

  state.workOrderCalendar.displayMode = "month";
  renderWorkOrderWorkspace();
});

workOrderCalendarWeekendsInput?.addEventListener("click", () => {
  state.workOrderCalendar.showWeekends = !state.workOrderCalendar.showWeekends;
  renderWorkOrderWorkspace();
});

workOrderCalendarUnscheduledToggle?.addEventListener("click", () => {
  if (workOrderCalendarUnscheduledToggle.disabled) {
    return;
  }

  state.workOrderCalendar.showUnscheduled = !state.workOrderCalendar.showUnscheduled;
  renderWorkOrderWorkspace();
});

document.addEventListener("pointerup", () => {
  if (!state.vehicleScheduleSelection) {
    return;
  }

  void finalizeVehicleScheduleSelection();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !state.vehicleScheduleSelection) {
    return;
  }

  clearVehicleScheduleSelection();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !state.vehicleReservationAssigneePickerOpen) {
    return;
  }

  event.preventDefault();
  setVehicleReservationAssigneePickerOpen(false);
});

vehicleOpenFormButton?.addEventListener("click", () => {
  resetVehicleForm();
  renderVehiclesModule();
  openVehicleEditor();
  requestAnimationFrame(() => {
    vehicleNameInput?.focus({ preventScroll: true });
  });
});

vehiclesSearchInput?.addEventListener("input", () => {
  renderVehiclesModule();
});

vehiclesFilterStatusInput?.addEventListener("change", () => {
  renderVehiclesModule();
});

vehicleStatusInput?.addEventListener("change", () => {
  syncVehicleEditorSummary();
});

vehicleResetButton?.addEventListener("click", () => {
  resetVehicleForm();
  renderVehiclesModule();
  openVehicleEditor();
  requestAnimationFrame(() => {
    vehicleNameInput?.focus({ preventScroll: true });
  });
});

vehicleEditorCloseButton?.addEventListener("click", () => {
  dismissVehicleEditor();
});

vehicleEditorBackdrop?.addEventListener("click", () => {
  dismissVehicleEditor();
});

vehicleDeleteButton?.addEventListener("click", () => {
  const vehicleId = vehicleIdInput?.value || "";

  if (!vehicleId) {
    return;
  }

  if (!window.confirm("Obrisati ovo vozilo?")) {
    return;
  }

  void runMutation(() => apiRequest(`/vehicles/${vehicleId}`, {
    method: "DELETE",
  }), vehicleError).then((success) => {
    if (success) {
      state.activeVehicleReservationId = "";
      state.activeVehicleId = "";
      closeVehicleEditor({ reset: true });
      renderVehiclesModule();
    }
  });
});

vehicleForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = buildVehiclePayload();
  const previousIds = new Set(state.vehicles.map((item) => String(item.id)));
  const isEditing = Boolean(vehicleIdInput?.value);
  const path = isEditing ? `/vehicles/${vehicleIdInput.value}` : "/vehicles";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: payload,
  }), vehicleError).then((success) => {
    if (!success) {
      return;
    }

    const targetVehicle = isEditing
      ? state.vehicles.find((item) => String(item.id) === String(vehicleIdInput.value))
      : findCreatedVehicleMatch(previousIds, payload);

    if (targetVehicle) {
      state.activeVehicleId = targetVehicle.id;
      state.activeVehicleReservationId = "";
      closeVehicleEditor({ reset: true });
      renderVehiclesModule();
    } else {
      closeVehicleEditor({ reset: true });
      renderVehiclesModule();
    }
  });
});

vehicleOpenReservationButton?.addEventListener("click", () => {
  const reservationVehicleId = state.activeVehicleId || state.vehicles[0]?.id || "";
  openVehicleReservationComposer({ vehicleId: reservationVehicleId });
  requestAnimationFrame(() => {
    vehicleReservationPurposeInput?.focus({ preventScroll: true });
  });
});

vehicleReservationResetButton?.addEventListener("click", () => {
  resetVehicleReservationForm({
    clearSelection: true,
    vehicleId: vehicleReservationVehicleIdInput?.value || state.activeVehicleId || state.vehicles[0]?.id || "",
  });
  renderVehiclesModule();
  openVehicleReservationEditor();
});

vehicleReservationCloseButton?.addEventListener("click", () => {
  dismissVehicleReservationEditor();
});

vehicleReservationBackdrop?.addEventListener("click", () => {
  dismissVehicleReservationEditor();
});

vehicleReservationVehicleIdInput?.addEventListener("change", () => {
  state.activeVehicleId = vehicleReservationVehicleIdInput.value || "";
  state.activeVehicleReservationId = "";
  renderVehiclesModule();
});

vehicleReservationAssigneesInput?.addEventListener("change", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
    return;
  }

  const option = target.closest(".vehicle-reservation-assignee-option");
  option?.classList.toggle("is-selected", target.checked);
  syncVehicleReservationAssigneePreview();
});

vehicleReservationAssigneesTrigger?.addEventListener("click", () => {
  setVehicleReservationAssigneePickerOpen(!state.vehicleReservationAssigneePickerOpen);
});

vehicleSchedulePrevButton?.addEventListener("click", () => {
  state.vehicleScheduleDate = shiftDateKey(
    state.vehicleScheduleDate || new Date().toISOString().slice(0, 10),
    -1,
  );
  renderVehiclesModule();
});

vehicleScheduleTodayButton?.addEventListener("click", () => {
  state.vehicleScheduleDate = new Date().toISOString().slice(0, 10);
  renderVehiclesModule();
});

vehicleScheduleNextButton?.addEventListener("click", () => {
  state.vehicleScheduleDate = shiftDateKey(
    state.vehicleScheduleDate || new Date().toISOString().slice(0, 10),
    1,
  );
  renderVehiclesModule();
});

vehicleScheduleDateInput?.addEventListener("change", () => {
  state.vehicleScheduleDate = vehicleScheduleDateInput.value || new Date().toISOString().slice(0, 10);
  renderVehiclesModule();
});

vehicleReservationForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const activeVehicle = getVehicleFromReservationEditor();

  if (!activeVehicle) {
    if (vehicleReservationError) {
      vehicleReservationError.textContent = "Odaberi vozilo prije rezervacije.";
    }
    return;
  }

  const payload = buildVehicleReservationPayload();
  const previousIds = new Set((activeVehicle.reservations ?? []).map((item) => String(item.id)));
  const isEditing = Boolean(vehicleReservationIdInput?.value);
  const path = isEditing
    ? `/vehicles/${activeVehicle.id}/reservations/${vehicleReservationIdInput.value}`
    : `/vehicles/${activeVehicle.id}/reservations`;
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: payload,
  }), vehicleReservationError).then((success) => {
    if (!success) {
      return;
    }

    const refreshedVehicle = state.vehicles.find((item) => String(item.id) === String(activeVehicle.id)) ?? null;

    if (!refreshedVehicle) {
      resetVehicleForm();
      renderVehiclesModule();
      return;
    }

    const targetReservation = isEditing
      ? (refreshedVehicle.reservations ?? []).find((item) => String(item.id) === String(vehicleReservationIdInput.value))
      : findCreatedVehicleReservationMatch(refreshedVehicle, previousIds, payload);

    state.activeVehicleId = refreshedVehicle.id;
    state.activeVehicleReservationId = targetReservation?.id || "";
    closeVehicleReservationEditor({ reset: true });
    renderVehiclesModule();
  });
});

offerOpenFormButton?.addEventListener("click", () => {
  resetOfferForm();
  renderOffersModule();
  openOfferEditor();
  requestAnimationFrame(() => {
    offerTitleInput?.focus({ preventScroll: true });
  });
});

offersSearchInput?.addEventListener("input", () => {
  renderOffersModule();
});

offersFilterStatusInput?.addEventListener("change", () => {
  renderOffersModule();
});

offerCompanyIdInput?.addEventListener("change", () => {
  syncCompanySelectionPreview(
    offerCompanyIdInput.value,
    offerCompanyPreview,
    offerCompanyPreviewLogo,
    offerCompanyPreviewName,
    offerCompanyPreviewMeta,
  );
  rebuildOfferLocationOptions(OFFER_LOCATION_ALL_VALUE);
  rebuildOfferContactOptions("", {});
});

offerLocationIdInput?.addEventListener("change", () => {
  rebuildOfferContactOptions("", {});
});

offerStatusInput?.addEventListener("change", () => {
  syncOfferStatusTheme();
});

offerTaxRateInput?.addEventListener("input", () => {
  syncOfferTotals();
});

offerDiscountRateInput?.addEventListener("input", () => {
  syncOfferTotals();
});

offerToggleDiscountButton?.addEventListener("click", () => {
  setOfferDiscountVisibility(!isOfferDiscountVisible(), { clearValue: isOfferDiscountVisible() });
});

offerToggleTotalButton?.addEventListener("click", () => {
  setOfferTotalVisibility(!isOfferTotalVisible());
});

offerAddItemButton?.addEventListener("click", () => {
  addOfferFormItem();
  const lastDescriptionInput = offerItems?.querySelector(".offer-item-row:last-child input");
  if (lastDescriptionInput instanceof HTMLElement) {
    lastDescriptionInput.focus({ preventScroll: true });
  }
});

offerResetButton?.addEventListener("click", () => {
  resetOfferForm();
  renderOffersModule();
  openOfferEditor();
  requestAnimationFrame(() => {
    offerTitleInput?.focus({ preventScroll: true });
  });
});

offerDeleteButton?.addEventListener("click", () => {
  const offerId = offerIdInput?.value || "";

  if (!offerId) {
    return;
  }

  if (!window.confirm("Obrisati ovu ponudu?")) {
    return;
  }

  void runMutation(() => apiRequest(`/offers/${offerId}`, {
    method: "DELETE",
  }), offerError).then((success) => {
    if (success) {
      closeOfferEditor({ reset: true });
      renderOffersModule();
    }
  });
});

offerForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const isEditing = Boolean(offerIdInput.value);
  const path = isEditing ? `/offers/${offerIdInput.value}` : "/offers";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: buildOfferPayload(),
  }), offerError).then((success) => {
    if (success) {
      closeOfferEditor({ reset: true });
      renderOffersModule();
    }
  });
});

offerEditorCloseButton?.addEventListener("click", () => {
  dismissOfferEditor();
});

offerEditorBackdrop?.addEventListener("click", () => {
  dismissOfferEditor();
});

companyLogoButton?.addEventListener("click", () => {
  companyLogoFileInput?.click();
});

companyLogoClearButton?.addEventListener("click", () => {
  if (companyLogoDataUrlInput) {
    companyLogoDataUrlInput.value = "";
  }
  if (companyLogoFileInput) {
    companyLogoFileInput.value = "";
  }
  syncCompanyEditorChrome();
});

companyLogoFileInput?.addEventListener("change", () => {
  const file = companyLogoFileInput.files?.[0];

  if (!file) {
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    companyError.textContent = "Logo mora biti manji od 2 MB.";
    companyLogoFileInput.value = "";
    return;
  }

  void readAvatarFileAsDataUrl(file).then((logoDataUrl) => {
    if (companyLogoDataUrlInput) {
      companyLogoDataUrlInput.value = logoDataUrl;
    }
    companyError.textContent = "";
    syncCompanyEditorChrome();
  }).catch((error) => {
    companyError.textContent = error.message;
  }).finally(() => {
    if (companyLogoFileInput) {
      companyLogoFileInput.value = "";
    }
  });
});

companyNameInput?.addEventListener("input", () => {
  syncCompanyEditorChrome();
});

companyIsActiveInput?.addEventListener("change", () => {
  syncCompanyEditorChrome();
});

companyOpenFormButton?.addEventListener("click", () => {
  resetCompanyForm();
  openCompanyEditor();
  requestAnimationFrame(() => {
    companyNameInput?.focus({ preventScroll: true });
  });
});

companyEditorCloseButton?.addEventListener("click", () => {
  dismissCompanyEditor();
});

companyEditorBackdrop?.addEventListener("click", () => {
  dismissCompanyEditor();
});

companyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const isEditing = Boolean(companyIdInput.value);
  const path = isEditing ? `/companies/${companyIdInput.value}` : "/companies";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: buildCompanyPayload(),
  }), companyError).then((success) => {
    if (success) {
      closeCompanyEditor({ reset: true });
    }
  });
});

companyResetButton.addEventListener("click", () => {
  resetCompanyForm();
  openCompanyEditor();
  requestAnimationFrame(() => {
    companyNameInput?.focus({ preventScroll: true });
  });
});

companyDeleteButton?.addEventListener("click", () => {
  const companyId = companyIdInput?.value || "";

  if (!companyId) {
    return;
  }

  if (!window.confirm(`Obrisati tvrtku ${companyNameInput?.value || ""}?`)) {
    return;
  }

  void runMutation(() => apiRequest(`/companies/${companyId}`, {
    method: "DELETE",
  }), companyError).then((success) => {
    if (success) {
      closeCompanyEditor({ reset: true });
    }
  });
});

locationOpenFormButton?.addEventListener("click", () => {
  if (state.companies.length === 0) {
    return;
  }

  resetLocationForm();
  openLocationEditor();
  requestAnimationFrame(() => {
    locationNameInput?.focus({ preventScroll: true });
  });
});

locationEditorCloseButton?.addEventListener("click", () => {
  dismissLocationEditor();
});

locationEditorBackdrop?.addEventListener("click", () => {
  dismissLocationEditor();
});

locationCompanyIdInput?.addEventListener("change", () => {
  syncCompanySelectionPreview(
    locationCompanyIdInput.value,
    locationCompanyPreview,
    locationCompanyPreviewLogo,
    locationCompanyPreviewName,
    locationCompanyPreviewMeta,
  );
});

locationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const isEditing = Boolean(locationIdInput.value);
  const path = isEditing ? `/locations/${locationIdInput.value}` : "/locations";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: buildLocationPayload(),
  }), locationError).then((success) => {
    if (success) {
      closeLocationEditor({ reset: true });
    }
  });
});

locationAddContactButton?.addEventListener("click", () => {
  addLocationFormContact();
});

locationResetButton.addEventListener("click", () => {
  resetLocationForm();
  openLocationEditor();
  requestAnimationFrame(() => {
    locationNameInput?.focus({ preventScroll: true });
  });
});

userBadge?.addEventListener("click", (event) => {
  event.stopPropagation();
  setUserMenuOpen(!userMenuOpen);
});

userMenuPresenceButton?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (!userMenuOpen) {
    return;
  }

  setUserPresenceMenuOpen(!userPresenceMenuOpen);
});

document.addEventListener("keydown", (event) => {
  if (!state.measurementSheet.isOpen) {
    return;
  }

  if (event.key === "Escape") {
    if (state.measurementSheet.contextMenu) {
      closeMeasurementContextMenu();
      return;
    }

    if (state.measurementSheet.fillMenu) {
      closeMeasurementFillMenu();
      return;
    }

    closeMeasurementSheet();
    return;
  }

  const activeElement = document.activeElement;
  const isMeasurementGridActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-sheet-grid"));
  const isMeasurementMetaActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-sheet-meta"));
  const isMeasurementToolbarActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-sheet-toolbar"));
  const isMeasurementContextMenuActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-context-menu"));
  const isMeasurementInputFocused = isMeasurementInputElement(activeElement);
  const isMeasurementFormulaBarFocused = activeElement === measurementFormulaInput;
  const isMeasurementEditorFocused = isMeasurementInputFocused || isMeasurementFormulaBarFocused;
  const activeEditorValue = isMeasurementFormulaBarFocused
    ? measurementFormulaInput?.value ?? ""
    : (isMeasurementInputFocused ? activeElement.value : "");
  const isFormulaEditing = isMeasurementEditorFocused && isMeasurementFormula(activeEditorValue);

  if ((!isMeasurementGridActive && !state.measurementSheet.activeCell) || isMeasurementMetaActive) {
    return;
  }

  if (isMeasurementToolbarActive && !isMeasurementFormulaBarFocused) {
    return;
  }

  if (isMeasurementContextMenuActive) {
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
    if (isMeasurementEditorFocused) {
      return;
    }

    event.preventDefault();
    selectAllMeasurementCells();
    return;
  }

  if (event.key === "Delete") {
    if (isMeasurementEditorFocused && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      return;
    }

    const range = getMeasurementSelectedRange();

    if (!range) {
      return;
    }

    event.preventDefault();
    clearMeasurementRange(range);
    renderMeasurementSheet();
    return;
  }

  if (!isMeasurementEditorFocused && isMeasurementDirectTypingKey(event)) {
    const activeCell = state.measurementSheet.activeCell;

    if (activeCell) {
      event.preventDefault();
      startMeasurementTypingInActiveCell(event.key);
      return;
    }
  }

  if (!isMeasurementEditorFocused && (event.key === "F2" || event.key === "Enter")) {
    const activeCell = state.measurementSheet.activeCell;

    if (activeCell) {
      event.preventDefault();
      enterMeasurementEditMode(activeCell.rowId, activeCell.columnId, {
        selectFormulaBody: true,
      });
      return;
    }
  }

  if (isMeasurementFormulaBarFocused && !event.ctrlKey && !event.metaKey) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Backspace", "Delete"].includes(event.key)) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      commitMeasurementEditMode();
      return;
    }
  }

  if (isMeasurementInputFocused && !event.ctrlKey && !event.metaKey) {
    if (isFormulaEditing && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Backspace", "Delete"].includes(event.key)) {
      return;
    }

    const caretStart = activeElement.selectionStart ?? 0;
    const caretEnd = activeElement.selectionEnd ?? 0;
    const valueLength = activeElement.value.length;

    if (event.key === "ArrowLeft" && !(caretStart === 0 && caretEnd === 0)) {
      return;
    }

    if (event.key === "ArrowRight" && !(caretStart === valueLength && caretEnd === valueLength)) {
      return;
    }

    if (["Home", "End", "Backspace"].includes(event.key)) {
      return;
    }
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveMeasurementSelection("left", { extend: event.shiftKey });
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveMeasurementSelection("right", { extend: event.shiftKey });
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveMeasurementSelection("up", { extend: event.shiftKey });
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveMeasurementSelection("down", { extend: event.shiftKey });
  }

  if (event.key === "Enter") {
    event.preventDefault();
    moveMeasurementSelection(event.shiftKey ? "up" : "down", { extend: event.shiftKey });
  }

  if (event.key === "Tab") {
    event.preventDefault();
    moveMeasurementSelection(event.shiftKey ? "tab-prev" : "tab-next");
  }
});

document.addEventListener("pointermove", (event) => {
  updateDashboardWidgetLayoutInteraction(event);

  if (state.measurementSheet.resizing) {
    updateMeasurementColumnWidth(event.clientX);
  }

  if (state.measurementSheet.fillDrag) {
    updateMeasurementFillTarget(event.clientX, event.clientY);
  }

  if (state.measurementSheet.selectionDrag) {
    updateMeasurementSelectionDragTarget(event.clientX, event.clientY);
  }
});

document.addEventListener("pointerup", (event) => {
  commitDashboardWidgetLayoutInteraction();
  stopMeasurementColumnResize();
  stopMeasurementFillDrag(true, event.clientX, event.clientY);
  stopMeasurementSelectionDrag();
});

document.addEventListener("pointercancel", (event) => {
  clearDashboardWidgetInteraction();
  stopMeasurementColumnResize();
  stopMeasurementFillDrag(false, event.clientX, event.clientY);
  stopMeasurementSelectionDrag();
});

document.addEventListener("copy", (event) => {
  if (!state.measurementSheet.isOpen || !event.clipboardData) {
    return;
  }

  const activeElement = document.activeElement;
  const isMeasurementGridActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-sheet-grid"));
  const isMeasurementMetaActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-sheet-meta"));
  const isMeasurementToolbarActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-sheet-toolbar"));
  const isMeasurementInputFocused = isMeasurementInputElement(activeElement);
  const isMeasurementFormulaBarFocused = activeElement === measurementFormulaInput;
  const range = getMeasurementSelectedRange();

  if ((!isMeasurementGridActive && !state.measurementSheet.activeCell) || isMeasurementMetaActive || !range) {
    return;
  }

  if (isMeasurementToolbarActive && !isMeasurementFormulaBarFocused) {
    return;
  }

  if ((isMeasurementInputFocused || isMeasurementFormulaBarFocused)
    && typeof activeElement.selectionStart === "number"
    && typeof activeElement.selectionEnd === "number"
    && activeElement.selectionStart !== activeElement.selectionEnd) {
    return;
  }

  event.preventDefault();
  event.clipboardData.setData("text/plain", buildMeasurementClipboardText(range));
});

document.addEventListener("paste", (event) => {
  if (!state.measurementSheet.isOpen || !event.clipboardData) {
    return;
  }

  const activeElement = document.activeElement;
  const isMeasurementGridActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-sheet-grid"));
  const isMeasurementMetaActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-sheet-meta"));
  const isMeasurementToolbarActive = activeElement instanceof HTMLElement
    && Boolean(activeElement.closest(".measurement-sheet-toolbar"));
  const isMeasurementInputFocused = isMeasurementInputElement(activeElement);
  const isMeasurementFormulaBarFocused = activeElement === measurementFormulaInput;

  if ((!isMeasurementGridActive && !state.measurementSheet.activeCell) || isMeasurementMetaActive) {
    return;
  }

  if (isMeasurementToolbarActive && !isMeasurementFormulaBarFocused) {
    return;
  }

  const text = event.clipboardData.getData("text/plain");

  if (!text) {
    return;
  }

  if ((isMeasurementInputFocused || isMeasurementFormulaBarFocused) && !/[\t\n\r]/.test(text)) {
    return;
  }

  event.preventDefault();
  pasteMeasurementClipboard(text);
});

document.addEventListener("click", (event) => {
  if (event.target instanceof Node) {
    const clickedStatusMenu = event.target instanceof HTMLElement
      && (
        event.target.closest(".work-item-status-dropdown")
        || event.target.closest(".work-item-status-menu-portal")
        || event.target.closest(".work-order-calendar-executor-picker")
        || event.target.closest(".work-order-calendar-executor-menu-portal")
      );

    if (!clickedStatusMenu) {
      closeOpenWorkOrderStatusMenus();
    }
  }

  if (
    state.vehicleReservationAssigneePickerOpen
    && event.target instanceof Node
    && !vehicleReservationAssigneesDropdown?.contains(event.target)
  ) {
    setVehicleReservationAssigneePickerOpen(false);
  }

  if (state.measurementSheet.fillMenu && event.target instanceof Node) {
    const clickedFillMenu = measurementFillMenu?.contains(event.target);
    const clickedFillHandle = event.target instanceof HTMLElement && event.target.closest(".measurement-fill-handle");

    if (!clickedFillMenu && !clickedFillHandle) {
      closeMeasurementFillMenu();
    }
  }

  if (state.measurementSheet.contextMenu && event.target instanceof Node) {
    const clickedContextMenu = measurementContextMenu?.contains(event.target);

    if (!clickedContextMenu) {
      closeMeasurementContextMenu();
    }
  }

  if (!userMenuOpen) {
    return;
  }

  if (event.target instanceof Node && userMenuPanel?.contains(event.target)) {
    if (userPresenceMenuOpen) {
      const clickedPresenceControl = userMenuPresenceButton?.contains(event.target)
        || userMenuPresenceMenu?.contains(event.target);

      if (!clickedPresenceControl) {
        setUserPresenceMenuOpen(false);
      }
    }

    return;
  }

  if (event.target instanceof Node && userBadge?.contains(event.target)) {
    return;
  }

  setUserMenuOpen(false);
});

window.addEventListener("resize", () => {
  closeOpenWorkOrderStatusMenus();
  if (state.vehicleReservationAssigneePickerOpen) {
    setVehicleReservationAssigneePickerOpen(false);
  }
});

document.addEventListener("scroll", (event) => {
  const target = event.target;
  if (
    target instanceof HTMLElement
    && (
      target.closest(".work-order-calendar-executor-menu-portal")
      || target.closest(".work-item-status-menu-portal")
      || target.closest(".vehicle-reservation-assignees-dropdown")
    )
  ) {
    return;
  }

  closeOpenWorkOrderStatusMenus();
  if (state.vehicleReservationAssigneePickerOpen) {
    setVehicleReservationAssigneePickerOpen(false);
  }
}, true);

window.addEventListener("resize", () => {
  queueWorkOrderCalendarGridShellHeightSync();
});

window.visualViewport?.addEventListener("resize", () => {
  queueWorkOrderCalendarGridShellHeightSync();
});

document.addEventListener("scroll", () => {
  if (state.activeWorkOrderViewMode !== "calendar") {
    return;
  }

  queueWorkOrderCalendarGridShellHeightSync();
}, true);

userOrganizationIdInput?.addEventListener("change", () => {
  const primaryOrganizationId = userOrganizationIdInput.value;

  if (!primaryOrganizationId || !userOrganizationMemberships) {
    return;
  }

  const matchingCheckbox = userOrganizationMemberships.querySelector(`input[value="${CSS.escape(primaryOrganizationId)}"]`);

  if (matchingCheckbox instanceof HTMLInputElement) {
    matchingCheckbox.checked = true;
  }
});

userAvatarFileInput?.addEventListener("change", () => {
  const file = userAvatarFileInput.files?.[0];

  if (!file) {
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    userError.textContent = "Avatar image must be smaller than 2 MB.";
    userAvatarFileInput.value = "";
    return;
  }

  void readAvatarFileAsDataUrl(file).then((avatarDataUrl) => {
    userAvatarDataUrlInput.value = avatarDataUrl;
    renderAvatar(userAvatarPreview, {
      firstName: userFirstNameInput.value,
      lastName: userLastNameInput.value,
      email: userEmailInput.value,
      avatarDataUrl: userAvatarDataUrlInput.value,
    });
    userError.textContent = "";
  }).catch(() => {
    userError.textContent = "Ne mogu ucitati sliku.";
  });
});

userMenuAvatarButton?.addEventListener("click", () => {
  userMenuAvatarFileInput?.click();
});

userMenuAvatarFileInput?.addEventListener("change", () => {
  const file = userMenuAvatarFileInput.files?.[0];

  if (!file || !state.user?.id) {
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    setUserMenuError("Avatar image must be smaller than 2 MB.");
    userMenuAvatarFileInput.value = "";
    return;
  }

  setUserMenuError("");
  userMenuAvatarButton.disabled = true;
  userMenuAvatarButton.textContent = "Spremanje...";

  void readAvatarFileAsDataUrl(file)
    .then((avatarDataUrl) => runMutation(() => apiRequest("/auth/profile/avatar", {
      method: "PATCH",
      body: {
        avatarDataUrl,
      },
    }), userMenuError))
    .then(() => {
      userMenuAvatarFileInput.value = "";
    })
    .catch(() => {
      setUserMenuError("Ne mogu ucitati sliku.");
    })
    .finally(() => {
      userMenuAvatarButton.disabled = false;
      userMenuAvatarButton.textContent = "Promijeni profilnu sliku";
    });
});

loginForm.addEventListener("submit", () => {
  loginError.textContent = "";
  loginForm.classList.add("is-submitting");
});

logoutButton.addEventListener("click", () => {
  void apiRequest("/auth/logout", {
    method: "POST",
  }).finally(() => {
    resetChatState();
    state.user = null;
    state.organizations = [];
    state.workOrders = [];
    state.reminders = [];
    state.todoTasks = [];
    state.offers = [];
    state.dashboardWidgets = [];
    state.companies = [];
    state.locations = [];
    state.users = [];
    state.signupRequests = [];
    state.loginContentItems = [];
    state.activeTodoTaskId = "";
    state.activeDashboardWidgetId = "";
    closeDashboardBuilder();
    state.measurementSheet.columns = [];
    state.measurementSheet.rows = [];
    state.measurementSheet.resizing = null;
    state.measurementSheet.activeCell = null;
    state.measurementSheet.editingCell = null;
    state.measurementSheet.editorSource = null;
    state.measurementSheet.formulaReferences = [];
    state.measurementSheet.selectionAnchor = null;
    state.measurementSheet.selectedRange = null;
    state.measurementSheet.selectionDrag = null;
    state.measurementSheet.fillDrag = null;
    state.measurementSheet.fillMenu = null;
    state.measurementSheet.contextMenu = null;
    loginForm.reset();
    closeMeasurementSheet();
    resetOfferForm();
    renderAuthState();
    void refreshLoginContent();
  });
});

organizationSwitcher?.addEventListener("change", () => {
  state.activeOrganizationId = organizationSwitcher.value;
  state.chat.loaded = false;
  state.chat.lastOrganizationId = "";
  state.chat.activeConversationId = "";
  renderChatDock();
  const selectedOrganization = state.organizations.find((item) => item.id === state.activeOrganizationId);

  if (selectedOrganization && getIsSuperAdmin()) {
    populateOrganizationForm(selectedOrganization);
  }

  void refreshSnapshot();
});

organizationForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const isEditing = Boolean(organizationIdInput.value);
  const path = isEditing ? `/organizations/${organizationIdInput.value}` : "/organizations";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: buildOrganizationPayload(),
  }), organizationError).then((success) => {
    if (success && !isEditing) {
      resetOrganizationForm();
    }
  });
});

organizationResetButton?.addEventListener("click", () => {
  resetOrganizationForm();
});

userForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const isEditing = Boolean(userIdInput.value);
  const path = isEditing ? `/users/${userIdInput.value}` : "/users";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: buildUserPayload(),
  }), userError).then((success) => {
    if (success) {
      resetUserForm();
    }
  });
});

userResetButton?.addEventListener("click", resetUserForm);

loginContentForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const isEditing = Boolean(loginContentIdInput.value);
  const path = isEditing ? `/login-content/${loginContentIdInput.value}` : "/login-content";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: buildLoginContentPayload(),
  }), loginContentError).then((success) => {
    if (success) {
      resetLoginContentForm();
    }
  });
});

loginContentResetButton?.addEventListener("click", resetLoginContentForm);

dashboardAddWidgetButton?.addEventListener("click", () => {
  openDashboardBuilder();
  renderDashboardOverview();
});

dashboardSeedLayoutButton?.addEventListener("click", () => {
  void createSuggestedDashboardLayout();
});

dashboardBuilderClose?.addEventListener("click", () => {
  closeDashboardBuilder();
  renderDashboardOverview();
});

dashboardBuilderBackdrop?.addEventListener("click", () => {
  closeDashboardBuilder();
  renderDashboardOverview();
});

dashboardWidgetCancelButton?.addEventListener("click", () => {
  closeDashboardBuilder();
  renderDashboardOverview();
});

dashboardWidgetDeleteButton?.addEventListener("click", () => {
  if (!dashboardWidgetIdInput?.value) {
    return;
  }

  void runMutation(() => apiRequest(`/dashboard-widgets/${dashboardWidgetIdInput.value}`, {
    method: "DELETE",
  }), dashboardWidgetError).then((success) => {
    if (success) {
      closeDashboardBuilder();
      renderDashboardOverview();
    }
  });
});

dashboardWidgetForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const isEditing = Boolean(dashboardWidgetIdInput.value);
  const path = isEditing ? `/dashboard-widgets/${dashboardWidgetIdInput.value}` : "/dashboard-widgets";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: readDashboardWidgetFormPatch(),
  }), dashboardWidgetError).then((success) => {
    if (success) {
      closeDashboardBuilder();
      renderDashboardOverview();
    }
  });
});

dashboardWidgetSearchInput?.addEventListener("input", () => {
  state.dashboardBuilder.search = dashboardWidgetSearchInput.value.trim();
  renderDashboardOverview();
});

[
  dashboardWidgetTitleInput,
  dashboardWidgetMetricInput,
  dashboardWidgetSizeInput,
  dashboardWidgetWidthInput,
  dashboardWidgetHeightInput,
  dashboardWidgetLimitInput,
  dashboardWidgetCompanyFilterInput,
  dashboardWidgetStatusFilterInput,
  dashboardWidgetPriorityFilterInput,
  dashboardWidgetRegionFilterInput,
  dashboardWidgetExecutorFilterInput,
  dashboardWidgetAssigneeFilterInput,
  dashboardWidgetDateWindowInput,
  dashboardWidgetTagFilterInput,
].forEach((input) => {
  input?.addEventListener("input", () => {
    renderDashboardWidgetPreview();
  });
  input?.addEventListener("change", () => {
    renderDashboardWidgetPreview();
  });
});

[dashboardWidgetVisualizationInput, dashboardWidgetSourceInput].forEach((input) => {
  input?.addEventListener("change", () => {
    syncDashboardWidgetFormOptions();
    renderDashboardWidgetPreview();
  });
});

dashboardWidgetSizeInput?.addEventListener("change", () => {
  const preset = getDashboardWidgetLayoutPreset(dashboardWidgetSizeInput.value);

  if (dashboardWidgetWidthInput) {
    dashboardWidgetWidthInput.value = String(preset.gridWidth);
  }

  if (dashboardWidgetHeightInput) {
    dashboardWidgetHeightInput.value = String(preset.gridHeight);
  }

  renderDashboardWidgetPreview();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.locationEditorOpen) {
    dismissLocationEditor();
    return;
  }

  if (event.key === "Escape" && state.companyEditorOpen) {
    dismissCompanyEditor();
    return;
  }

  if (event.key === "Escape" && state.vehicleReservationEditorOpen) {
    dismissVehicleReservationEditor();
    return;
  }

  if (event.key === "Escape" && state.vehicleEditorOpen) {
    dismissVehicleEditor();
    return;
  }

  if (event.key === "Escape" && state.offerEditorOpen) {
    dismissOfferEditor();
    return;
  }

  if (event.key === "Escape" && state.chat.composerOpen) {
    setChatComposerOpen(false);
  }

  if (event.key === "Escape" && state.chat.open && !state.chat.composerOpen && !state.workOrderEditorOpen) {
    setChatOpen(false);
  }

  if (event.key === "Escape" && state.dashboardBuilder.open) {
    closeDashboardBuilder();
    renderDashboardOverview();
  }
});

setConnectionStatus();
resetWorkOrderForm();
resetWorkOrderActivityState();
resetMeasurementSheet();
resetReminderForm();
resetTodoForm();
resetVehicleForm();
resetOfferForm();
resetCompanyForm();
resetLocationForm();
resetOrganizationForm();
resetUserForm();
resetLoginContentForm();
renderActiveView();
renderAuthState();
applyLoginRedirectState();
syncPasswordToggleLabel();

refreshLoginContent().catch(() => {
  renderLoginContent();
});

refreshSession()
  .then((user) => {
    if (user) {
      return refreshSnapshot();
    }

    return null;
  })
  .catch((error) => {
    setSyncError(error.message);
    connectionStatus.textContent = "Backend nije dostupan";
    connectionStatus.classList.add("is-memory");
  });



