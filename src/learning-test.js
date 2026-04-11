if (typeof document !== "undefined" && typeof window !== "undefined") {
  const titleNode = document.querySelector(".learning-public-title");
  const metaNode = document.querySelector(".learning-public-meta");
  const errorNode = document.querySelector("#learning-public-error");
  const successNode = document.querySelector("#learning-public-success");
  const contentNode = document.querySelector("#learning-public-content");

  const search = new URLSearchParams(window.location.search);
  const accessToken = String(search.get("token") || "").trim();

function setError(message = "") {
  if (errorNode) {
    errorNode.textContent = message;
  }
}

function setSuccess(message = "") {
  if (successNode) {
    successNode.textContent = message;
  }
}

async function fetchJson(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Greška ${response.status}`);
  }

  return payload;
}

function renderOrderedTextAnswer(question, modelAnswers) {
  const wrapper = document.createElement("div");
  wrapper.className = "learning-public-options";
  (question.options || []).forEach((option) => {
    const row = document.createElement("label");
    row.className = "learning-public-option";

    const indexInput = document.createElement("input");
    indexInput.type = "number";
    indexInput.min = "1";
    indexInput.max = String((question.options || []).length || 1);
    indexInput.value = String(modelAnswers[option.id] || "");
    indexInput.placeholder = "#";
    indexInput.style.maxWidth = "64px";
    indexInput.addEventListener("input", () => {
      const value = String(indexInput.value || "").trim();
      if (!value) {
        delete modelAnswers[option.id];
        return;
      }
      modelAnswers[option.id] = value;
    });

    const text = document.createElement("span");
    text.textContent = option.text || "";
    row.append(indexInput, text);
    wrapper.append(row);
  });
  return wrapper;
}

function renderQuestion(question, answersMap) {
  const questionType = String(question.questionType || "single_choice").trim().toLowerCase();
  const questionNode = document.createElement("article");
  questionNode.className = "learning-public-question";

  const heading = document.createElement("h3");
  heading.textContent = question.prompt || "Pitanje";
  questionNode.append(heading);

  if (questionType === "ordered_text") {
    const orderingModel = answersMap[question.id] || {};
    answersMap[question.id] = orderingModel;
    questionNode.append(renderOrderedTextAnswer(question, orderingModel));
    return questionNode;
  }

  const isMultiple = questionType === "multiple_choice";
  const optionsNode = document.createElement("div");
  optionsNode.className = "learning-public-options";
  const selectedValues = new Set(
    Array.isArray(answersMap[question.id])
      ? answersMap[question.id].map((value) => String(value))
      : [],
  );
  if (!isMultiple) {
    const selectedSingle = String(answersMap[question.id] || "");
    selectedValues.clear();
    if (selectedSingle) {
      selectedValues.add(selectedSingle);
    }
  }

  (question.options || []).forEach((option) => {
    const row = document.createElement("label");
    row.className = "learning-public-option";

    const control = document.createElement("input");
    control.type = isMultiple ? "checkbox" : "radio";
    control.name = isMultiple ? `q-${question.id}-${option.id}` : `q-${question.id}`;
    control.value = String(option.id || "");
    control.checked = selectedValues.has(String(option.id || ""));
    control.addEventListener("change", () => {
      if (isMultiple) {
        if (control.checked) {
          selectedValues.add(control.value);
        } else {
          selectedValues.delete(control.value);
        }
        answersMap[question.id] = [...selectedValues];
      } else {
        answersMap[question.id] = control.checked ? control.value : "";
      }
    });

    const text = document.createElement("span");
    text.textContent = option.text || "";
    row.append(control, text);
    optionsNode.append(row);
  });

  questionNode.append(optionsNode);
  return questionNode;
}

function buildSubmissionPayload(test, answersMap) {
  const payload = [];
  (test.questionItems || []).forEach((question) => {
    const questionType = String(question.questionType || "single_choice").trim().toLowerCase();
    const value = answersMap[question.id];
    if (questionType === "multiple_choice") {
      (Array.isArray(value) ? value : []).forEach((optionId) => {
        payload.push({ questionId: question.id, optionId: String(optionId || "") });
      });
      return;
    }
    if (questionType === "ordered_text") {
      const orderingMap = value && typeof value === "object" ? value : {};
      Object.entries(orderingMap).forEach(([optionId, orderIndex]) => {
        payload.push({
          questionId: question.id,
          optionId: String(optionId || ""),
          orderIndex: String(orderIndex || ""),
        });
      });
      return;
    }
    if (value) {
      payload.push({ questionId: question.id, optionId: String(value || "") });
    }
  });
  return payload;
}

function renderTest(accessItem) {
  const test = accessItem?.test ?? {};
  const assignment = accessItem?.assignment ?? {};

  if (titleNode) {
    titleNode.textContent = test.title || "Ispit";
  }
  if (metaNode) {
    metaNode.textContent = `${assignment.userLabel || assignment.email || "Polaznik"} · status: ${assignment.status || "pending"}`;
  }
  if (!contentNode) {
    return;
  }

  contentNode.hidden = false;
  contentNode.replaceChildren();

  const description = document.createElement("p");
  description.className = "learning-public-meta";
  description.textContent = test.description || "Riješi pitanja i pošalji odgovore.";
  contentNode.append(description);

  const answersMap = {};
  const questions = Array.isArray(test.questionItems) ? test.questionItems : [];
  questions.forEach((question) => {
    contentNode.append(renderQuestion(question, answersMap));
  });

  const actions = document.createElement("div");
  actions.className = "learning-public-actions";

  const submitButton = document.createElement("button");
  submitButton.type = "button";
  submitButton.className = "primary-button";
  submitButton.textContent = "Predaj test";
  submitButton.addEventListener("click", async () => {
    setError("");
    setSuccess("");
    submitButton.disabled = true;
    try {
      const result = await fetchJson("/api/public/learning-tests/access/submit", {
        method: "POST",
        body: {
          token: accessToken,
          answers: buildSubmissionPayload(test, answersMap),
        },
      });
      const score = Number(result?.item?.submission?.scorePercent ?? result?.item?.assignment?.scorePercent ?? 0);
      setSuccess(`Test je predan. Rezultat: ${Number.isFinite(score) ? Math.round(score) : 0}%`);
    } catch (error) {
      setError(error?.message || "Predaja testa nije uspjela.");
      submitButton.disabled = false;
      return;
    }
    submitButton.disabled = true;
    submitButton.textContent = "Predano";
  });

  actions.append(submitButton);
  contentNode.append(actions);
}

async function bootstrap() {
  if (!accessToken) {
    setError("Nedostaje token za pristup ispitu.");
    if (titleNode) {
      titleNode.textContent = "Pristup nije valjan";
    }
    return;
  }

  setError("");
  setSuccess("");
  if (titleNode) {
    titleNode.textContent = "Učitavam ispit…";
  }

  try {
    await fetchJson("/api/public/learning-tests/access/start", {
      method: "POST",
      body: { token: accessToken },
    });
    const response = await fetchJson(`/api/public/learning-tests/access?token=${encodeURIComponent(accessToken)}`);
    renderTest(response?.item);
  } catch (error) {
    setError(error?.message || "Ispit nije dostupan.");
    if (titleNode) {
      titleNode.textContent = "Pristup nije valjan";
    }
  }
}

  void bootstrap();
}
