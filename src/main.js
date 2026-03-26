import {
  PRIORITY_OPTIONS,
  WORK_ORDER_STATUS_OPTIONS,
  buildLocationContacts,
  filterWorkOrders,
  getDashboardStats,
  sortWorkOrders,
} from "./safetyModel.js";

const API_BASE = "/api";
const WORK_ORDER_BATCH_SIZE = 60;
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
};

function readSidebarCollapsedPreference() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

state.sidebarCollapsed = readSidebarCollapsedPreference();

const authScreen = document.querySelector("#auth-screen");
const appShell = document.querySelector("#app-shell");
const appFrame = document.querySelector("#app-frame");
const appSidebar = document.querySelector("#app-sidebar");
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

document.addEventListener("click", (event) => {
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
    loginForm.reset();
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
