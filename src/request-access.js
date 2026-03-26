const form = document.querySelector("#request-access-form");
const organizationNameInput = document.querySelector("#request-organization-name");
const fullNameInput = document.querySelector("#request-full-name");
const emailInput = document.querySelector("#request-email");
const passwordInput = document.querySelector("#request-password");
const submitButton = document.querySelector("#request-submit-button");
const feedback = document.querySelector("#request-feedback");

function setBusy(isBusy) {
  if (submitButton) {
    submitButton.disabled = isBusy;
    submitButton.textContent = isBusy ? "Sending..." : "Send request";
  }

  [organizationNameInput, fullNameInput, emailInput, passwordInput].forEach((input) => {
    if (input) {
      input.disabled = isBusy;
    }
  });
}

function buildPayload() {
  const fullName = String(fullNameInput?.value ?? "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts.shift() ?? "";
  const lastName = nameParts.join(" ");

  return {
    organizationName: String(organizationNameInput?.value ?? "").trim(),
    firstName,
    lastName,
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

form?.addEventListener("submit", submitRequest);
