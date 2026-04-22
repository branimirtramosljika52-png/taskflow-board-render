const form = document.querySelector("#request-access-form");
const organizationNameInput = document.querySelector("#request-organization-name");
const firstNameInput = document.querySelector("#request-first-name");
const lastNameInput = document.querySelector("#request-last-name");
const organizationOibInput = document.querySelector("#request-organization-oib");
const emailInput = document.querySelector("#request-email");
const passwordInput = document.querySelector("#request-password");
const passwordRepeatInput = document.querySelector("#request-password-repeat");
const submitButton = document.querySelector("#request-submit-button");
const feedback = document.querySelector("#request-feedback");
const PASSWORD_POLICY_MESSAGE = "Password must be at least 8 characters long, include 1 uppercase letter and at least 2 numbers.";

function normalizeOib(value) {
  return String(value ?? "").replace(/\s+/g, "").trim();
}

function setBusy(isBusy) {
  if (submitButton) {
    submitButton.disabled = isBusy;
    submitButton.textContent = isBusy ? "Sending..." : "Send request";
  }

  [
    organizationNameInput,
    firstNameInput,
    lastNameInput,
    organizationOibInput,
    emailInput,
    passwordInput,
    passwordRepeatInput,
  ].forEach((input) => {
    if (input) {
      input.disabled = isBusy;
    }
  });
}

function validateOrganizationOib() {
  const value = normalizeOib(organizationOibInput?.value ?? "");
  const isValid = !value || /^\d{11}$/.test(value);

  if (organizationOibInput) {
    organizationOibInput.value = value;
    organizationOibInput.setCustomValidity(isValid ? "" : "Organization OIB must be empty or contain exactly 11 digits.");
  }

  return isValid;
}

function validatePasswordMatch() {
  const password = String(passwordInput?.value ?? "");
  const repeatedPassword = String(passwordRepeatInput?.value ?? "");
  const isValid = password && repeatedPassword && password === repeatedPassword;

  if (passwordRepeatInput) {
    passwordRepeatInput.setCustomValidity(isValid ? "" : "Passwords do not match.");
  }

  return isValid;
}

function validatePasswordPolicy() {
  const password = String(passwordInput?.value ?? "");
  const digitMatches = password.match(/\d/g) ?? [];
  const isValid = password.length >= 8
    && /[A-Z]/.test(password)
    && digitMatches.length >= 2;

  if (passwordInput) {
    passwordInput.setCustomValidity(isValid ? "" : PASSWORD_POLICY_MESSAGE);
  }

  return isValid;
}

function buildPayload() {
  return {
    organizationName: String(organizationNameInput?.value ?? "").trim(),
    organizationOib: normalizeOib(organizationOibInput?.value ?? ""),
    firstName: String(firstNameInput?.value ?? "").trim(),
    lastName: String(lastNameInput?.value ?? "").trim(),
    email: String(emailInput?.value ?? "").trim(),
    password: String(passwordInput?.value ?? ""),
    phone: "",
    note: "",
  };
}

async function submitRequest(event) {
  event.preventDefault();
  feedback.textContent = "";
  feedback.classList.remove("is-error");

  if (!validateOrganizationOib()) {
    feedback.classList.add("is-error");
    feedback.textContent = "Organization OIB must be empty or contain exactly 11 digits.";
    organizationOibInput?.reportValidity();
    organizationOibInput?.focus();
    return;
  }

  if (!validatePasswordMatch()) {
    feedback.classList.add("is-error");
    feedback.textContent = "Passwords do not match.";
    passwordRepeatInput?.reportValidity();
    passwordRepeatInput?.focus();
    return;
  }

  if (!validatePasswordPolicy()) {
    feedback.classList.add("is-error");
    feedback.textContent = PASSWORD_POLICY_MESSAGE;
    passwordInput?.reportValidity();
    passwordInput?.focus();
    return;
  }

  setBusy(true);

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(buildPayload()),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Unable to send access request.");
    }

    feedback.textContent = payload.message || "Your request has been sent.";
    form.reset();
    organizationNameInput?.focus();
  } catch (error) {
    feedback.classList.add("is-error");
    feedback.textContent = error.message;
  } finally {
    setBusy(false);
  }
}

organizationOibInput?.addEventListener("input", validateOrganizationOib);
passwordInput?.addEventListener("input", validatePasswordMatch);
passwordInput?.addEventListener("input", validatePasswordPolicy);
passwordRepeatInput?.addEventListener("input", validatePasswordMatch);
form?.addEventListener("submit", submitRequest);
