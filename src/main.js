import {
  PRIORITY_OPTIONS,
  WORK_ORDER_STATUS_OPTIONS,
  buildLocationContacts,
  filterWorkOrders,
  getDashboardStats,
  sortWorkOrders,
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
  normalizeMeasurementCellFormat,
} from "./measurementFormatting.js";

const API_BASE = "/api";
const WORK_ORDER_BATCH_SIZE = 60;
const DEFAULT_MEASUREMENT_ROW_COUNT = 12;
const MEASUREMENT_ROW_BATCH_SIZE = 24;
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
const VIEW_TO_SIDEBAR_GROUP = {
  selfdash: "home",
  companies: "companies",
  locations: "companies",
  management: "admin",
};
const VIEW_TO_ALLOWED_SIDEBAR_GROUPS = {
  selfdash: ["home", "tasks"],
  companies: ["companies"],
  locations: ["companies"],
  management: ["admin"],
};
const SIDEBAR_GROUP_DEFAULT_VIEW = {
  home: "selfdash",
  tasks: "selfdash",
  companies: "companies",
  admin: "management",
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
  activeView: "selfdash",
  user: null,
  activeOrganizationId: "",
  workOrderRenderLimit: WORK_ORDER_BATCH_SIZE,
  activeSidebarGroup: "home",
  sidebarCollapsed: false,
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
  },
};

function readSidebarCollapsedPreference() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

state.sidebarCollapsed = readSidebarCollapsedPreference();

let measurementRowCounter = 0;
let measurementColumnCounter = 0;

const authScreen = document.querySelector("#auth-screen");
const appShell = document.querySelector("#app-shell");
const appFrame = document.querySelector("#app-frame");
const appSidebar = document.querySelector("#app-sidebar");
const appHomeButton = document.querySelector("#app-home-button");
const loginForm = document.querySelector("#login-form");
const loginEmailInput = document.querySelector("#login-email");
const loginPasswordInput = document.querySelector("#login-password");
const loginSubmitButton = document.querySelector("#login-submit-button");
const loginError = document.querySelector("#login-error");
const userBadge = document.querySelector("#user-badge");
const userMenuPanel = document.querySelector("#user-menu-panel");
const userMenuAvatar = document.querySelector("#user-menu-avatar");
const userMenuName = document.querySelector("#user-menu-name");
const userMenuEmail = document.querySelector("#user-menu-email");
const userMenuOrganizations = document.querySelector("#user-menu-organizations");
const logoutButton = document.querySelector("#logout-button");
const sidebarHomeButton = document.querySelector("#sidebar-home-button");
const sidebarActiveOrganization = document.querySelector("#sidebar-active-organization");
const sidebarCollapseToggle = document.querySelector("#sidebar-collapse-toggle");
const railButtons = Array.from(document.querySelectorAll("[data-sidebar-group]"));
const railAdminButton = document.querySelector("#rail-admin-button");
const sidebarGroupButtons = Array.from(document.querySelectorAll("[data-group-toggle]"));
const sidebarGroupPanels = Array.from(document.querySelectorAll("[data-sidebar-group-panel]"));
const sidebarAdminGroupPanel = document.querySelector("#sidebar-admin-group-panel");
const sidebarSelfDashActions = Array.from(document.querySelectorAll("[data-selfdash-focus]"));
const organizationContext = document.querySelector("#organization-context");
const organizationSwitcherWrap = document.querySelector("#organization-switcher-wrap");
const organizationSwitcher = document.querySelector("#organization-switcher");
const connectionStatus = document.querySelector("#connection-status");
const syncError = document.querySelector("#sync-error");
const tabButtons = Array.from(document.querySelectorAll(".tab-button[data-view]"));
const managementTab = document.querySelector("#management-tab");
const managementNavLabel = document.querySelector("#management-nav-label");
const workspaceViews = {
  selfdash: document.querySelector("#selfdash-view"),
  companies: document.querySelector("#companies-view"),
  locations: document.querySelector("#locations-view"),
  management: document.querySelector("#management-view"),
};

const companiesCount = document.querySelector("#companies-count");
const locationsCount = document.querySelector("#locations-count");
const activeWorkOrdersCount = document.querySelector("#active-work-orders-count");
const completedWorkOrdersCount = document.querySelector("#completed-work-orders-count");
const overdueWorkOrdersCount = document.querySelector("#overdue-work-orders-count");

const workOrderForm = document.querySelector("#work-order-form");
const workOrderError = document.querySelector("#work-order-error");
const workOrderResetButton = document.querySelector("#work-order-reset");
const workOrderOpenFormButton = document.querySelector("#work-order-open-form");
const workOrderNumberPreview = document.querySelector("#work-order-number-preview");
const workOrderIdInput = document.querySelector("#work-order-id");
const workOrderStatusInput = document.querySelector("#work-order-status");
const workOrderPriorityInput = document.querySelector("#work-order-priority");
const workOrderOpenedDateInput = document.querySelector("#work-order-opened-date");
const workOrderDueDateInput = document.querySelector("#work-order-due-date");
const workOrderCompanyIdInput = document.querySelector("#work-order-company-id");
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
const measurementFormatApplyButton = document.querySelector("#measurement-format-apply");
const measurementSheetPanel = document.querySelector(".measurement-sheet-panel");
const measurementSheetGridWrap = document.querySelector(".measurement-sheet-grid-wrap");
const measurementSheetColgroup = document.querySelector("#measurement-sheet-colgroup");
const measurementSheetHead = document.querySelector("#measurement-sheet-head");
const measurementSheetBody = document.querySelector("#measurement-sheet-body");
const measurementFillMenu = document.querySelector("#measurement-fill-menu");
const measurementFillCopyButton = document.querySelector("#measurement-fill-copy");
const measurementFillSeriesButton = document.querySelector("#measurement-fill-series");
const workOrdersBody = document.querySelector("#work-orders-body");
const workOrdersEmpty = document.querySelector("#work-orders-empty");
const workOrdersTableWrap = document.querySelector("#work-orders-table-wrap");
const workOrdersLoadState = document.querySelector("#work-orders-load-state");
const workOrdersHelper = document.querySelector("#work-orders-helper");
const workspaceViewChips = Array.from(document.querySelectorAll("[data-jump-view]"));

const companyForm = document.querySelector("#company-form");
const companyError = document.querySelector("#company-error");
const companyResetButton = document.querySelector("#company-reset");
const companyIdInput = document.querySelector("#company-id");
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
const locationResetButton = document.querySelector("#location-reset");
const locationIdInput = document.querySelector("#location-id");
const locationCompanyIdInput = document.querySelector("#location-company-id");
const locationNameInput = document.querySelector("#location-name");
const locationRegionInput = document.querySelector("#location-region");
const locationCoordinatesInput = document.querySelector("#location-coordinates");
const locationPeriodInput = document.querySelector("#location-period");
const locationRepresentativeInput = document.querySelector("#location-representative");
const locationIsActiveInput = document.querySelector("#location-is-active");
const locationContactName1Input = document.querySelector("#location-contact-name-1");
const locationContactPhone1Input = document.querySelector("#location-contact-phone-1");
const locationContactEmail1Input = document.querySelector("#location-contact-email-1");
const locationContactName2Input = document.querySelector("#location-contact-name-2");
const locationContactPhone2Input = document.querySelector("#location-contact-phone-2");
const locationContactEmail2Input = document.querySelector("#location-contact-email-2");
const locationContactName3Input = document.querySelector("#location-contact-name-3");
const locationContactPhone3Input = document.querySelector("#location-contact-phone-3");
const locationContactEmail3Input = document.querySelector("#location-contact-email-3");
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

function setConnectionStatus() {
  if (state.storage === "mysql") {
    connectionStatus.textContent = "Spojeno na MySQL backend";
    connectionStatus.classList.remove("is-memory");
    return;
  }

  connectionStatus.textContent = "Koristi se privremeni in-memory backend dok DATABASE_URL nije konfiguriran";
  connectionStatus.classList.add("is-memory");
}

function setSyncError(message = "") {
  syncError.hidden = !message;
  syncError.textContent = message;
}

function setLoginBusy(isBusy) {
  if (loginSubmitButton) {
    loginSubmitButton.disabled = isBusy;
    loginSubmitButton.textContent = isBusy ? "Signing in..." : "Sign in";
  }

  loginEmailInput.disabled = isBusy;
  loginPasswordInput.disabled = isBusy;
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
  state.user = payload.user ?? state.user;
  state.activeOrganizationId = payload.activeOrganizationId ?? state.activeOrganizationId;
  state.workOrderRenderLimit = WORK_ORDER_BATCH_SIZE;
  setConnectionStatus();
  setSyncError("");
  render();
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

function renderSidebarState() {
  const activeGroup = state.activeSidebarGroup || getSidebarGroupForView();

  appFrame?.classList.toggle("is-sidebar-collapsed", state.sidebarCollapsed);
  appSidebar?.classList.toggle("is-collapsed", state.sidebarCollapsed);

  if (sidebarCollapseToggle) {
    sidebarCollapseToggle.setAttribute("aria-expanded", state.sidebarCollapsed ? "false" : "true");
    sidebarCollapseToggle.setAttribute("aria-label", state.sidebarCollapsed ? "Open sidebar" : "Minimize sidebar");
    sidebarCollapseToggle.innerHTML = `<span aria-hidden="true">${state.sidebarCollapsed ? "&rarr;" : "&larr;"}</span>`;
  }

  railButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sidebarGroup === activeGroup);
  });

  sidebarGroupPanels.forEach((panel) => {
    const groupName = panel.dataset.sidebarGroupPanel;
    const isActive = groupName === activeGroup;
    panel.classList.toggle("is-open", isActive);
    panel.querySelector(".sidebar-group-items")?.toggleAttribute("hidden", state.sidebarCollapsed || !isActive);
    panel.querySelector(".sidebar-group-toggle")?.setAttribute("aria-expanded", isActive && !state.sidebarCollapsed ? "true" : "false");
  });
}

function setSidebarCollapsed(nextValue) {
  state.sidebarCollapsed = Boolean(nextValue);
  persistSidebarCollapsed();
  renderSidebarState();
}

function activateSidebarGroup(groupName, options = {}) {
  const {
    navigate = false,
    expandSidebar = false,
  } = options;

  state.activeSidebarGroup = groupName;

  if (expandSidebar && state.sidebarCollapsed) {
    state.sidebarCollapsed = false;
    persistSidebarCollapsed();
  }

  if (navigate) {
    const targetView = SIDEBAR_GROUP_DEFAULT_VIEW[groupName];

    if (targetView) {
      state.activeView = targetView;
    }
  }

  renderActiveView();
}

function focusSelfDashArea(target = "top") {
  state.activeView = "selfdash";

  if (!["home", "tasks"].includes(state.activeSidebarGroup)) {
    state.activeSidebarGroup = target === "top" ? "home" : "tasks";
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

function formatDate(value) {
  if (!value) {
    return "Bez datuma";
  }

  const rawValue = String(value).trim();
  const directDate = new Date(rawValue);

  if (!Number.isNaN(directDate.getTime())) {
    return new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium" }).format(directDate);
  }

  const normalizedDateOnly = new Date(`${rawValue.slice(0, 10)}T12:00:00`);

  if (!Number.isNaN(normalizedDateOnly.getTime())) {
    return new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium" }).format(normalizedDateOnly);
  }

  return "Bez datuma";
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

  ensureMeasurementMinimumRows(48);
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

      row.formats[column.id] = normalizeMeasurementCellFormat({
        ...row.formats[column.id],
        ...formatOverrides,
      });
    }
  }
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

  if (measurementFormatApplyButton) {
    measurementFormatApplyButton.disabled = !state.measurementSheet.activeCell;
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
  refreshMeasurementSheetComputedValues();
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

function exitMeasurementEditMode() {
  state.measurementSheet.editingCell = null;
  state.measurementSheet.editorSource = null;
  state.measurementSheet.formulaReferences = [];
  renderMeasurementFormulaReferences();
  refreshMeasurementSheetComputedValues();
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

function refreshMeasurementSheetComputedValues() {
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
        cell.textContent = formatMeasurementAverage(row);
        return;
      }

      const input = cell.querySelector(".measurement-cell-input");
      const rawValue = row.cells?.[column.id] ?? "";
      const hasFormula = isMeasurementFormula(rawValue);
      let hasError = false;

      if (hasFormula) {
        hasError = getMeasurementCellDisplayText(rowIndex, columnIndex) === "#ERROR";
      }

      cell.classList.toggle("has-formula-cell", hasFormula);
      cell.classList.toggle("has-formula-error", hasError);

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
  clearMeasurementFillPreview();
  renderMeasurementSelection();
  renderMeasurementActiveCell();
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
  state.measurementSheet.fillMenu = {
    x: pointerX,
    y: pointerY,
    pendingFill,
  };
  renderMeasurementFillPreview();
  renderMeasurementFillMenu();
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
  clearMeasurementFillPreview();
  renderMeasurementSelection();
  renderMeasurementActiveCell();
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
  renderMeasurementSelection();
  renderMeasurementActiveCell();
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
  renderMeasurementSelection();
  renderMeasurementActiveCell();
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
  renderMeasurementSelection();
  renderMeasurementActiveCell();
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
        setMeasurementSelection(row.id, column.id, {
          extend: event.shiftKey,
        });

        if (event.shiftKey) {
          focusMeasurementCell(row.id, column.id);
          return;
        }

        startMeasurementSelectionDrag(row.id, column.id, event.pointerId);
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
        refreshMeasurementSheetComputedValues();
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
}

function extendMeasurementSheetRowsIfNeeded() {
  if (!measurementSheetGridWrap || !state.measurementSheet.isOpen) {
    return;
  }

  const nearBottom = measurementSheetGridWrap.scrollTop + measurementSheetGridWrap.clientHeight
    >= measurementSheetGridWrap.scrollHeight - 220;

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
  state.measurementSheet.selectionDrag = null;
  state.measurementSheet.fillMenu = null;
  state.measurementSheet.fillDrag = null;
  state.measurementSheet.editingCell = null;
  state.measurementSheet.editorSource = null;
  state.measurementSheet.formulaReferences = [];
  document.body.classList.remove("is-selecting-measurement-cells");
  document.body.classList.remove("is-filling-measurement-cells");
  setMeasurementSheetOpen(false);
  syncMeasurementToolbar();
}

function resetMeasurementSheet() {
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
  syncMeasurementSheetHeaderFromWorkOrder();
  renderMeasurementSheet();
  syncMeasurementToolbar();
}

function addMeasurementColumn() {
  ensureMeasurementSheetStructure();
  appendMeasurementEditableColumn();
  renderMeasurementSheet();
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

function focusWorkOrderComposer(prefill = {}) {
  resetWorkOrderForm();

  if (prefill.status) {
    workOrderStatusInput.value = prefill.status;
    workOrderNumberPreview.textContent = `Novi ${prefill.status}`;
  }

  if (prefill.priority) {
    workOrderPriorityInput.value = prefill.priority;
  }

  workOrderForm.closest(".panel")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
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
  document.body.classList.toggle("is-auth-mode", !authenticated);

  if (authenticated) {
    const isSuperAdmin = getIsSuperAdmin();
    const isAdmin = getIsAdmin();
    const organization = state.organizations.find((item) => item.id === state.activeOrganizationId)
      ?? state.organizations[0]
      ?? null;
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
    badgeRole.textContent = roleLabel;
    badgeCopy.append(badgeName, badgeRole);
    userBadge.append(badgeAvatar, badgeCopy);
    renderAvatar(badgeAvatar, state.user);
    userMenuName.textContent = state.user.fullName || state.user.email;
    userMenuEmail.textContent = state.user.email || "";
    userMenuOrganizations.textContent = organizationLabel || (organization ? organization.name : "");
    renderAvatar(userMenuAvatar, state.user);
    organizationContext.textContent = isSuperAdmin
      ? `Super admin | ${organization ? organization.name : "Bez aktivne organizacije"}`
      : (organization ? organization.name : "");
    organizationSwitcherWrap.hidden = state.organizations.length <= 1;
    managementTab.hidden = !(isSuperAdmin || isAdmin);
    if (sidebarAdminGroupPanel) {
      sidebarAdminGroupPanel.hidden = managementTab.hidden;
    }
    if (railAdminButton) {
      railAdminButton.hidden = managementTab.hidden;
    }

    if (sidebarActiveOrganization) {
      sidebarActiveOrganization.textContent = organization ? organization.name : "Safety360";
    }

    if (managementNavLabel) {
      managementNavLabel.textContent = isSuperAdmin ? "Administration" : "Team";
    }
  } else {
    userBadge.textContent = "";
    userMenuName.textContent = "";
    userMenuEmail.textContent = "";
    userMenuOrganizations.textContent = "";
    renderAvatar(userMenuAvatar, {});
    organizationContext.textContent = "";
    organizationSwitcherWrap.hidden = true;
    managementTab.hidden = true;
    if (sidebarAdminGroupPanel) {
      sidebarAdminGroupPanel.hidden = true;
    }
    if (railAdminButton) {
      railAdminButton.hidden = true;
    }
    if (sidebarActiveOrganization) {
      sidebarActiveOrganization.textContent = "Workspace";
    }
    if (managementNavLabel) {
      managementNavLabel.textContent = "Administration";
    }
    loginError.textContent = "";
    setLoginBusy(false);
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

function buildLocationPayload() {
  return {
    companyId: locationCompanyIdInput.value,
    name: locationNameInput.value,
    region: locationRegionInput.value,
    coordinates: locationCoordinatesInput.value,
    period: locationPeriodInput.value,
    representative: locationRepresentativeInput.value,
    isActive: locationIsActiveInput.value,
    contactName1: locationContactName1Input.value,
    contactPhone1: locationContactPhone1Input.value,
    contactEmail1: locationContactEmail1Input.value,
    contactName2: locationContactName2Input.value,
    contactPhone2: locationContactPhone2Input.value,
    contactEmail2: locationContactEmail2Input.value,
    contactName3: locationContactName3Input.value,
    contactPhone3: locationContactPhone3Input.value,
    contactEmail3: locationContactEmail3Input.value,
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
  workOrderForm.reset();
  workOrderIdInput.value = "";
  workOrderError.textContent = "";
  workOrderNumberPreview.textContent = "Broj RN se generira pri spremanju.";
  workOrderStatusInput.value = "Otvoreni RN";
  workOrderPriorityInput.value = "Normal";
  workOrderOpenedDateInput.value = new Date().toISOString().slice(0, 10);
  rebuildWorkOrderCompanyOptions("");
  rebuildWorkOrderLocationOptions("");
  rebuildWorkOrderContactOptions("", "");
  fillWorkOrderCompanySnapshot(null);
  workOrderCoordinatesInput.value = "";
  workOrderRegionInput.value = "";
  workOrderContactPhoneInput.value = "";
  workOrderContactEmailInput.value = "";
}

function resetCompanyForm() {
  companyForm.reset();
  companyIdInput.value = "";
  companyError.textContent = "";
  companyIsActiveInput.value = "true";
}

function resetLocationForm() {
  locationForm.reset();
  locationIdInput.value = "";
  locationError.textContent = "";
  locationIsActiveInput.value = "true";
  rebuildLocationCompanyOptions("");
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
  locationContactName1Input.value = location.contactName1;
  locationContactPhone1Input.value = location.contactPhone1;
  locationContactEmail1Input.value = location.contactEmail1;
  locationContactName2Input.value = location.contactName2;
  locationContactPhone2Input.value = location.contactPhone2;
  locationContactEmail2Input.value = location.contactEmail2;
  locationContactName3Input.value = location.contactName3;
  locationContactPhone3Input.value = location.contactPhone3;
  locationContactEmail3Input.value = location.contactEmail3;
  locationNoteInput.value = location.note;
  locationError.textContent = "";
}

function hydrateWorkOrderForm(workOrder) {
  state.activeView = "selfdash";
  renderActiveView();
  workOrderIdInput.value = workOrder.id;
  workOrderNumberPreview.textContent = `Uredujes ${workOrder.workOrderNumber}`;
  workOrderStatusInput.value = workOrder.status;
  workOrderPriorityInput.value = workOrder.priority;
  workOrderOpenedDateInput.value = workOrder.openedDate ?? "";
  workOrderDueDateInput.value = workOrder.dueDate ?? "";
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
  companiesCount.textContent = String(stats.companies);
  locationsCount.textContent = String(stats.locations);
  activeWorkOrdersCount.textContent = String(stats.activeWorkOrders);
  completedWorkOrdersCount.textContent = String(stats.completedWorkOrders);
  overdueWorkOrdersCount.textContent = String(stats.overdueWorkOrders);
}

function renderActiveView() {
  const allowedGroups = getAllowedSidebarGroupsForView(state.activeView);

  if (!allowedGroups.includes(state.activeSidebarGroup)) {
    state.activeSidebarGroup = getSidebarGroupForView(state.activeView);
  }

  for (const [viewName, element] of Object.entries(workspaceViews)) {
    element.hidden = viewName !== state.activeView;
  }

  for (const button of tabButtons) {
    button.classList.toggle("is-active", button.dataset.view === state.activeView);
  }

  renderSidebarState();
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
  replaceSelectOptions(workOrderFilterStatusInput, [
    { value: "all", label: "Svi statusi" },
    ...WORK_ORDER_STATUS_OPTIONS,
  ], workOrderFilterStatusInput.value || "all");

  rebuildWorkOrderCompanyOptions(currentWorkOrderCompanyId);
  rebuildLocationCompanyOptions(currentLocationCompanyId);
  rebuildWorkOrderFilterCompanyOptions(currentFilterCompanyId);
  rebuildWorkOrderLocationOptions(currentLocationId);
  rebuildWorkOrderContactOptions(currentContactSlot, currentSnapshotName);

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
}

function getFilteredWorkOrders() {
  return sortWorkOrders(filterWorkOrders(state.workOrders, {
    query: workOrderSearchInput.value,
    status: workOrderFilterStatusInput.value,
    companyId: workOrderFilterCompanyInput.value,
  }));
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
  renderWorkOrders();
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

function renderCompanies() {
  const sortedCompanies = state.companies
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, "hr"));

  if (companiesHelper) {
    companiesHelper.textContent = `${sortedCompanies.length} tvrtki uredeno kao list view.`;
  }

  companiesBody.replaceChildren(...sortedCompanies.map((company) => {
    const row = document.createElement("tr");
    row.className = "list-row";
    const contact = [company.contactPhone, company.contactEmail].filter(Boolean).join(" / ") || "Bez kontakta";
    const actionsCell = document.createElement("td");
    actionsCell.className = "table-actions";
    if (getCanManageMasterData()) {
      actionsCell.append(
        createActionButton("Uredi", "card-button", () => hydrateCompanyForm(company)),
        createActionButton("Obrisi", "card-button card-danger", () => {
          if (!window.confirm(`Obrisati tvrtku ${company.name}?`)) {
            return;
          }

          void runMutation(() => apiRequest(`/companies/${company.id}`, { method: "DELETE" }));
        }),
      );
    }

    row.append(
      createStackCell({
        eyebrow: company.id,
        title: company.name,
        subtitle: company.headquarters || "Bez sjedista",
        meta: company.note ? ["Napomena"] : [],
      }),
      createStackCell({
        title: company.oib || "Bez OIB-a",
        subtitle: company.representative || "Bez predstavnika",
        tertiary: company.period ? `Periodika: ${company.period}` : "",
      }),
      createStackCell({
        title: company.contractType || "Bez ugovora",
        subtitle: company.contractNumber || "Bez broja ugovora",
        tertiary: company.period ? `Periodika: ${company.period}` : "",
      }),
      createStackCell({
        title: contact,
        subtitle: company.contactPhone || company.contactEmail ? "Kontakt podaci" : "Nema kontakta",
      }),
      createStackCell({
        title: company.isActive ? "Aktivna tvrtka" : "Neaktivna tvrtka",
        subtitle: company.representative || "Bez predstavnika",
        meta: [createStatusPill(company.isActive ? "Aktivno" : "Neaktivno", company.isActive)],
      }),
      actionsCell,
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
    if (getCanManageMasterData()) {
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
  renderWorkOrders();
  renderCompanies();
  renderLocations();
  renderManagement();
  renderActiveView();
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const parentGroup = button.closest("[data-sidebar-group-panel]")?.dataset.sidebarGroupPanel;

    if (parentGroup) {
      state.activeSidebarGroup = parentGroup;
    }

    state.activeView = button.dataset.view;
    renderActiveView();
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

sidebarSelfDashActions.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.selfdashFocus || "top";
    const parentGroup = button.closest("[data-sidebar-group-panel]")?.dataset.sidebarGroupPanel;

    if (parentGroup) {
      state.activeSidebarGroup = parentGroup;
    }

    focusSelfDashArea(target);
  });
});

appHomeButton?.addEventListener("click", () => {
  state.activeSidebarGroup = "home";
  focusSelfDashArea("top");
});

sidebarHomeButton?.addEventListener("click", () => {
  state.activeSidebarGroup = "home";
  focusSelfDashArea("top");
});

sidebarCollapseToggle?.addEventListener("click", () => {
  setSidebarCollapsed(!state.sidebarCollapsed);
});

workOrderCompanyIdInput.addEventListener("change", () => {
  const company = getCompany(workOrderCompanyIdInput.value);
  fillWorkOrderCompanySnapshot(company);
  rebuildWorkOrderLocationOptions("");
  applySelectedLocationDefaults();
});

workOrderLocationIdInput.addEventListener("change", () => {
  applySelectedLocationDefaults();
});

workOrderContactSlotInput.addEventListener("change", () => {
  applySelectedContactDefaults();
});

workOrdersTableWrap.addEventListener("scroll", () => {
  const nearBottom = workOrdersTableWrap.scrollTop + workOrdersTableWrap.clientHeight >= workOrdersTableWrap.scrollHeight - 120;

  if (nearBottom) {
    loadMoreWorkOrders();
  }
});

workOrderSearchInput.addEventListener("input", () => {
  resetWorkOrderListWindow();
  renderWorkOrders();
});
workOrderFilterStatusInput.addEventListener("change", () => {
  resetWorkOrderListWindow();
  renderWorkOrders();
});
workOrderFilterCompanyInput.addEventListener("change", () => {
  resetWorkOrderListWindow();
  renderWorkOrders();
});

workOrderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const isEditing = Boolean(workOrderIdInput.value);
  const path = isEditing ? `/work-orders/${workOrderIdInput.value}` : "/work-orders";
  const method = isEditing ? "PATCH" : "POST";

  void runMutation(() => apiRequest(path, {
    method,
    body: buildWorkOrderPayload(),
  }), workOrderError).then((success) => {
    if (success) {
      resetWorkOrderForm();
    }
  });
});

workOrderResetButton.addEventListener("click", resetWorkOrderForm);
workOrderOpenFormButton?.addEventListener("click", () => {
  focusWorkOrderComposer();
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
  refreshMeasurementSheetComputedValues();
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
});
measurementFormatDecimalsInput?.addEventListener("input", () => {
  measurementFormatDecimalsInput.value = String(normalizeMeasurementDecimals(measurementFormatDecimalsInput.value));
});
measurementFormatDecimalsInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  measurementFormatApplyButton?.click();
});
measurementFormatApplyButton?.addEventListener("click", () => {
  if (!state.measurementSheet.activeCell) {
    return;
  }

  applyMeasurementFormatToRange({
    type: measurementFormatTypeInput?.value,
    decimals: normalizeMeasurementDecimals(measurementFormatDecimalsInput?.value),
  });
  refreshMeasurementSheetComputedValues();
  renderMeasurementSelection();
  renderMeasurementActiveCell();
  syncMeasurementToolbar();
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
      resetCompanyForm();
    }
  });
});

companyResetButton.addEventListener("click", resetCompanyForm);

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
      resetLocationForm();
    }
  });
});

locationResetButton.addEventListener("click", resetLocationForm);

userBadge?.addEventListener("click", (event) => {
  event.stopPropagation();
  setUserMenuOpen(!userMenuOpen);
});

document.addEventListener("keydown", (event) => {
  if (!state.measurementSheet.isOpen) {
    return;
  }

  if (event.key === "Escape") {
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
  stopMeasurementColumnResize();
  stopMeasurementFillDrag(true, event.clientX, event.clientY);
  stopMeasurementSelectionDrag();
});

document.addEventListener("pointercancel", (event) => {
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
  if (state.measurementSheet.fillMenu && event.target instanceof Node) {
    const clickedFillMenu = measurementFillMenu?.contains(event.target);
    const clickedFillHandle = event.target instanceof HTMLElement && event.target.closest(".measurement-fill-handle");

    if (!clickedFillMenu && !clickedFillHandle) {
      closeMeasurementFillMenu();
    }
  }

  if (!userMenuOpen) {
    return;
  }

  if (event.target instanceof Node && userMenuPanel?.contains(event.target)) {
    return;
  }

  if (event.target instanceof Node && userBadge?.contains(event.target)) {
    return;
  }

  setUserMenuOpen(false);
});

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

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    userAvatarDataUrlInput.value = String(reader.result ?? "");
    renderAvatar(userAvatarPreview, {
      firstName: userFirstNameInput.value,
      lastName: userLastNameInput.value,
      email: userEmailInput.value,
      avatarDataUrl: userAvatarDataUrlInput.value,
    });
    userError.textContent = "";
  });
  reader.readAsDataURL(file);
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginError.textContent = "";
  setLoginBusy(true);

  void apiRequest("/auth/login", {
    method: "POST",
    body: {
      email: loginEmailInput.value,
      password: loginPasswordInput.value,
    },
  }).then((payload) => {
    state.user = payload.user;
    loginForm.reset();
    renderAuthState();
    return refreshSnapshot();
  }).catch((error) => {
    loginError.textContent = error.message;
  }).finally(() => {
    setLoginBusy(false);
  });
});

logoutButton.addEventListener("click", () => {
  void apiRequest("/auth/logout", {
    method: "POST",
  }).finally(() => {
    state.user = null;
    state.organizations = [];
    state.workOrders = [];
    state.companies = [];
    state.locations = [];
    state.users = [];
    state.signupRequests = [];
    state.loginContentItems = [];
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
    loginForm.reset();
    closeMeasurementSheet();
    renderAuthState();
    void refreshLoginContent();
  });
});

organizationSwitcher?.addEventListener("change", () => {
  state.activeOrganizationId = organizationSwitcher.value;
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

setConnectionStatus();
resetWorkOrderForm();
resetMeasurementSheet();
resetCompanyForm();
resetLocationForm();
resetOrganizationForm();
resetUserForm();
resetLoginContentForm();
renderActiveView();
renderAuthState();
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
