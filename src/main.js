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
  authMode: "login",
  user: null,
  activeOrganizationId: "",
  workOrderRenderLimit: WORK_ORDER_BATCH_SIZE,
};

const authScreen = document.querySelector("#auth-screen");
const appShell = document.querySelector("#app-shell");
const authLoginView = document.querySelector("#auth-login-view");
const authSignupView = document.querySelector("#auth-signup-view");
const openSignupButton = document.querySelector("#open-signup-button");
const backToLoginButton = document.querySelector("#back-to-login-button");
const loginForm = document.querySelector("#login-form");
const loginEmailInput = document.querySelector("#login-email");
const loginPasswordInput = document.querySelector("#login-password");
const loginSubmitButton = document.querySelector("#login-submit-button");
const loginError = document.querySelector("#login-error");
const signupForm = document.querySelector("#signup-form");
const signupOrganizationNameInput = document.querySelector("#signup-organization-name");
const signupFullNameInput = document.querySelector("#signup-full-name");
const signupEmailInput = document.querySelector("#signup-email");
const signupPasswordInput = document.querySelector("#signup-password");
const signupSubmitButton = document.querySelector("#signup-submit-button");
const signupFeedback = document.querySelector("#signup-feedback");
const loginContentAccent = document.querySelector("#login-content-accent");
const loginContentHeading = document.querySelector("#login-content-heading");
const loginContentQuote = document.querySelector("#login-content-quote");
const userBadge = document.querySelector("#user-badge");
const logoutButton = document.querySelector("#logout-button");
const organizationContext = document.querySelector("#organization-context");
const organizationSwitcherWrap = document.querySelector("#organization-switcher-wrap");
const organizationSwitcher = document.querySelector("#organization-switcher");
const connectionStatus = document.querySelector("#connection-status");
const syncError = document.querySelector("#sync-error");
const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const managementTab = document.querySelector("#management-tab");
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
const userFirstNameInput = document.querySelector("#user-first-name");
const userLastNameInput = document.querySelector("#user-last-name");
const userEmailInput = document.querySelector("#user-email");
const userPasswordInput = document.querySelector("#user-password");
const userOrganizationField = document.querySelector("#user-organization-field");
const userOrganizationIdInput = document.querySelector("#user-organization-id");
const userRoleInput = document.querySelector("#user-role");
const userLegacyUsernameInput = document.querySelector("#user-legacy-username");
const userIsActiveInput = document.querySelector("#user-is-active");
const userResetButton = document.querySelector("#user-reset");
const usersBody = document.querySelector("#users-body");

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

function setSignupBusy(isBusy) {
  if (signupSubmitButton) {
    signupSubmitButton.disabled = isBusy;
    signupSubmitButton.textContent = isBusy ? "Sending..." : "Send request";
  }

  [
    signupOrganizationNameInput,
    signupFullNameInput,
    signupEmailInput,
    signupPasswordInput,
  ].forEach((input) => {
    if (input) {
      input.disabled = isBusy;
    }
  });
}

function syncPasswordToggleLabel() {
  return;
}

function getIsSuperAdmin() {
  return state.user?.role === "super_admin";
}

function getCanManageMasterData() {
  return ["super_admin", "admin"].includes(state.user?.role);
}

function setAuthMode(mode) {
  state.authMode = mode === "signup" ? "signup" : "login";

  if (authLoginView) {
    authLoginView.hidden = state.authMode !== "login";
  }

  if (authSignupView) {
    authSignupView.hidden = state.authMode !== "signup";
  }

  if (state.authMode === "login") {
    signupFeedback.textContent = "";
    signupFeedback.classList.remove("is-error");
  } else {
    loginError.textContent = "";
  }
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
  const organizationHeader = state.activeOrganizationId && state.user?.role === "super_admin"
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
  const payload = await apiRequest("/auth/login-content", {}, false);
  state.loginContent = payload;
  renderLoginContent();
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

function formatDate(value) {
  if (!value) {
    return "Bez datuma";
  }

  return new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`));
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

function joinParts(values, separator = " • ") {
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

function renderLoginContent() {
  const content = state.loginContent ?? {};
  if (loginContentAccent) {
    loginContentAccent.textContent = content.accentLabel || "Secure access";
  }

  if (loginContentHeading) {
    loginContentHeading.textContent = content.heading || "Welcome back";
  }

  if (loginContentQuote) {
    loginContentQuote.textContent = content.quoteText || "Sign in with your email to continue into your organization workspace.";
  }
}

function renderAuthState() {
  const authenticated = Boolean(state.user);
  authScreen.hidden = authenticated;
  appShell.hidden = !authenticated;
  document.body.classList.toggle("is-auth-mode", !authenticated);

  if (authenticated) {
    const organization = state.organizations.find((item) => item.id === state.activeOrganizationId)
      ?? state.organizations[0]
      ?? null;
    const roleLabel = state.user.role === "super_admin"
      ? "Super Admin"
      : state.user.role === "admin"
        ? "Admin"
        : "User";

    userBadge.textContent = `${state.user.fullName} (${roleLabel})`;
    organizationContext.textContent = organization ? organization.name : "";
    organizationSwitcherWrap.hidden = !getIsSuperAdmin();
    managementTab.hidden = !(state.user.role === "super_admin" || state.user.role === "admin");
  } else {
    userBadge.textContent = "";
    organizationContext.textContent = "";
    organizationSwitcherWrap.hidden = true;
    managementTab.hidden = true;
    loginError.textContent = "";
    signupFeedback.textContent = "";
    setLoginBusy(false);
    setSignupBusy(false);
    setAuthMode(state.authMode);
  }
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
  return {
    firstName: userFirstNameInput.value,
    lastName: userLastNameInput.value,
    email: userEmailInput.value,
    password: userPasswordInput.value,
    organizationId: userOrganizationIdInput.value || state.activeOrganizationId,
    role: userRoleInput.value,
    legacyUsername: userLegacyUsernameInput.value,
    isActive: userIsActiveInput.value,
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

function buildSignupPayload() {
  const fullName = String(signupFullNameInput?.value ?? "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts.shift() ?? "";
  const lastName = nameParts.join(" ");

  return {
    organizationName: signupOrganizationNameInput.value,
    firstName,
    lastName,
    email: signupEmailInput.value,
    password: signupPasswordInput.value,
    phone: "",
    note: "",
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
  userError.textContent = "";
  userIsActiveInput.value = "true";
  userRoleInput.value = state.user?.role === "super_admin" ? "user" : "user";
}

function resetLoginContentForm() {
  loginContentForm.reset();
  loginContentIdInput.value = "";
  loginContentError.textContent = "";
  loginContentIsActiveInput.value = "true";
}

function resetSignupForm() {
  signupForm?.reset();
  signupFeedback.textContent = "";
  signupFeedback.classList.remove("is-error");
  setSignupBusy(false);
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

function hydrateOrganizationForm(organization) {
  state.activeView = "management";
  renderActiveView();
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

function hydrateUserForm(user) {
  state.activeView = "management";
  renderActiveView();
  userIdInput.value = user.id;
  userFirstNameInput.value = user.firstName;
  userLastNameInput.value = user.lastName;
  userEmailInput.value = user.email;
  userPasswordInput.value = "";
  userOrganizationIdInput.value = user.organizationId || state.activeOrganizationId;
  userRoleInput.value = user.role;
  userLegacyUsernameInput.value = user.legacyUsername || "";
  userIsActiveInput.value = String(user.isActive);
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
  for (const [viewName, element] of Object.entries(workspaceViews)) {
    element.hidden = viewName !== state.activeView;
  }

  for (const button of tabButtons) {
    button.classList.toggle("is-active", button.dataset.view === state.activeView);
  }
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
  const roleOptions = [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
    ...(getIsSuperAdmin() ? [{ value: "super_admin", label: "Super Admin" }] : []),
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
      organizationOptions,
      userOrganizationIdInput.value || state.activeOrganizationId || state.organizations[0]?.id || "",
    );
  }

  replaceSelectOptions(userRoleInput, roleOptions, userRoleInput.value || "user");

  if (userOrganizationField) {
    userOrganizationField.hidden = !getIsSuperAdmin();
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

  if (workOrdersHelper) {
    workOrdersHelper.textContent = `${filtered.length} RN u list view prikazu.`;
  }

  workOrdersBody.replaceChildren(...visibleItems.map((item) => {
    const row = document.createElement("tr");
    row.className = "list-row";

    const statusBadge = createBadge(
      WORK_ORDER_STATUS_OPTIONS.find((option) => option.value === item.status)?.label ?? item.status,
      statusBadgeClass(item.status),
    );
    const priorityBadge = createBadge(
      PRIORITY_OPTIONS.find((option) => option.value === item.priority)?.label ?? item.priority,
      priorityBadgeClass(item.priority),
    );
    const overdue = isOverdueWorkOrder(item);

    const actionsCell = document.createElement("td");
    actionsCell.className = "table-actions";
    actionsCell.append(createActionButton("Uredi", "card-button", () => hydrateWorkOrderForm(item)));

    if (state.user?.role !== "user") {
      actionsCell.append(createActionButton("Obrisi", "card-button card-danger", () => {
        if (!window.confirm(`Obrisati ${item.workOrderNumber}?`)) {
          return;
        }

        void runMutation(() => apiRequest(`/work-orders/${item.id}`, { method: "DELETE" }));
      }));
    }

    const taskTitle = item.description || item.locationName || item.companyName || "Radni nalog";
    const taskSubtitle = joinParts([
      item.department,
      item.serviceLine,
      item.linkReference ? `Veza ${item.linkReference}` : "",
    ]);
    const dueTitle = item.dueDate ? formatDate(item.dueDate) : "Bez roka";
    const dueSubtitle = overdue
      ? "Kasni"
      : item.openedDate
        ? `Otvoren ${formatDate(item.openedDate)}`
        : "Bez datuma otvaranja";
    const dueTertiary = item.invoiceDate ? `Faktura ${formatDate(item.invoiceDate)}` : "";
    const contactSubtitle = joinParts([item.contactPhone, item.contactEmail]);

    row.append(
      createStackCell({
        eyebrow: item.workOrderNumber,
        title: taskTitle,
        subtitle: taskSubtitle || "Bez dodatnog opisa",
        meta: [
          item.executor1 ? `Izvrsitelj: ${item.executor1}` : "",
          item.tagText ? `Tagovi: ${item.tagText}` : "",
        ],
      }),
      createBadgeCell(
        statusBadge,
        item.openedDate ? `Otvoren ${formatDate(item.openedDate)}` : "Bez datuma otvaranja",
        item.completedBy ? `Zavrsio: ${item.completedBy}` : "",
      ),
      createStackCell({
        title: dueTitle,
        subtitle: dueSubtitle,
        tertiary: dueTertiary,
        meta: overdue ? [{ label: "Overdue", className: "is-danger" }] : [],
      }),
      createStackCell({
        title: item.companyName,
        subtitle: item.headquarters || "Bez sjedista",
        tertiary: item.companyOib ? `OIB: ${item.companyOib}` : "",
        meta: item.contractType ? [item.contractType] : [],
      }),
      createStackCell({
        title: item.locationName || "Bez lokacije",
        subtitle: item.region || "Bez regije",
        tertiary: item.coordinates || "",
      }),
      createStackCell({
        title: item.contactName || item.contactPhone || "Bez kontakta",
        subtitle: contactSubtitle || "Nema broja ni emaila",
        tertiary: item.executor2 ? `Izvrsitelj 2: ${item.executor2}` : "",
      }),
      createBadgeCell(
        priorityBadge,
        item.weight ? `Tezina: ${item.weight}` : "Bez tezine",
        item.serviceLine || "",
      ),
      actionsCell,
    );

    return row;
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
    actionsCell.append(
      createActionButton("Uredi", "card-button", () => hydrateUserForm(user)),
    );

    row.append(
      createStackCell({
        title: user.fullName || user.email,
        subtitle: user.legacyUsername ? `Legacy: ${user.legacyUsername}` : "Web account",
      }),
      createStackCell({
        title: user.email,
        subtitle: user.lastLoginAt ? `Zadnja prijava ${formatDate(user.lastLoginAt)}` : "Jos bez prijave",
      }),
      createStackCell({
        title: user.role,
        subtitle: user.isActive ? "Active" : "Inactive",
      }),
      createStackCell({
        title: user.organizationName || "Bez organizacije",
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
      actionsCell.append(
        createActionButton("Approve", "card-button", () => {
          void runMutation(() => apiRequest(`/signup-requests/${request.id}/approve`, {
            method: "POST",
            body: {},
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
        subtitle: request.note || "Bez napomene",
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

  if (!organizationIdInput.value && currentOrganization && state.user?.role === "admin") {
    hydrateOrganizationForm(currentOrganization);
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
    state.activeView = button.dataset.view;
    renderActiveView();
  });
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

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginError.textContent = "";
  signupFeedback.textContent = "";
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

backToLoginButton?.addEventListener("click", () => {
  setAuthMode("login");
});

openSignupButton?.addEventListener("click", () => {
  setAuthMode("signup");
});

signupForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  loginError.textContent = "";
  signupFeedback.textContent = "";
  signupFeedback.classList.remove("is-error");
  setSignupBusy(true);

  void apiRequest("/auth/signup", {
    method: "POST",
    body: buildSignupPayload(),
  }, false).then((payload) => {
    signupFeedback.classList.remove("is-error");
    signupFeedback.textContent = payload.message || "Zahtjev je zaprimljen.";
    signupForm.reset();
    setAuthMode("login");
  }).catch((error) => {
    signupFeedback.classList.add("is-error");
    signupFeedback.textContent = error.message;
  }).finally(() => {
    setSignupBusy(false);
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
    resetSignupForm();
    renderAuthState();
    void refreshLoginContent();
  });
});

organizationSwitcher?.addEventListener("change", () => {
  state.activeOrganizationId = organizationSwitcher.value;
  const selectedOrganization = state.organizations.find((item) => item.id === state.activeOrganizationId);

  if (selectedOrganization && getIsSuperAdmin()) {
    hydrateOrganizationForm(selectedOrganization);
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
  const currentOrganization = state.organizations.find((item) => item.id === state.activeOrganizationId);

  if (currentOrganization && state.user?.role === "admin") {
    hydrateOrganizationForm(currentOrganization);
  }
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
resetSignupForm();
renderActiveView();
setAuthMode(state.authMode);
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
