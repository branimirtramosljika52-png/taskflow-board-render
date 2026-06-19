if (typeof document !== "undefined" && typeof window !== "undefined") {
  const titleNode = document.querySelector(".learning-public-title");
  const metaNode = document.querySelector(".learning-public-meta");
  const errorNode = document.querySelector("#learning-public-error");
  const successNode = document.querySelector("#learning-public-success");
  const contentNode = document.querySelector("#learning-public-content");

  const search = new URLSearchParams(window.location.search);
  const accessToken = String(search.get("token") || "").trim();

  function cleanText(value = "") {
    return String(value || "").trim();
  }

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

  function formatDate(value = "") {
    const text = cleanText(value);
    if (!text) {
      return "";
    }
    const dateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return `${dateMatch[3]}.${dateMatch[2]}.${dateMatch[1]}.`;
    }
    return text;
  }

  function getStatusLabel(status = "") {
    const normalized = cleanText(status).toLowerCase();
    if (normalized === "completed") {
      return "Predano";
    }
    if (normalized === "in_progress") {
      return "U tijeku";
    }
    return "Čeka početak";
  }

  function getAssignmentName(assignment = {}) {
    return cleanText(assignment.externalFullName)
      || cleanText(assignment.userLabel)
      || cleanText(assignment.email)
      || cleanText(assignment.externalEmail)
      || "Polaznik";
  }

  function getAssignmentEmail(assignment = {}) {
    return cleanText(assignment.externalEmail) || cleanText(assignment.email);
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

  function createSteps(activeStep = "data") {
    const wrapper = document.createElement("div");
    wrapper.className = "learning-public-steps";
    [
      ["data", "1. Podaci"],
      ["materials", "2. Literatura"],
      ["questions", "3. Test"],
    ].forEach(([key, label]) => {
      const step = document.createElement("div");
      step.className = `learning-public-step${key === activeStep ? " is-active" : ""}`;
      step.textContent = label;
      wrapper.append(step);
    });
    return wrapper;
  }

  function createSectionHead(kicker, title, meta = "") {
    const head = document.createElement("div");
    head.className = "learning-public-section-head";
    const copy = document.createElement("div");
    const kickerNode = document.createElement("span");
    kickerNode.className = "learning-public-kicker";
    kickerNode.textContent = kicker;
    const titleNode = document.createElement("h2");
    titleNode.textContent = title;
    copy.append(kickerNode, titleNode);
    head.append(copy);
    if (meta) {
      const metaNode = document.createElement("p");
      metaNode.className = "learning-public-meta";
      metaNode.textContent = meta;
      head.append(metaNode);
    }
    return head;
  }

  function createInfoField(label, value, fallback = "Nije upisano") {
    const field = document.createElement("div");
    field.className = "learning-public-field";
    const labelNode = document.createElement("span");
    labelNode.textContent = label;
    const valueNode = document.createElement("strong");
    valueNode.textContent = cleanText(value) || fallback;
    field.append(labelNode, valueNode);
    return field;
  }

  function createTextNote(text = "", fallback = "") {
    const note = document.createElement("div");
    note.className = "learning-public-note";
    note.textContent = cleanText(text) || fallback;
    return note;
  }

  function getDocumentUrl(documentItem = {}) {
    return cleanText(documentItem.storageUrl) || cleanText(documentItem.dataUrl);
  }

  function isImageDocument(documentItem = {}) {
    const type = cleanText(documentItem.fileType).toLowerCase();
    const name = cleanText(documentItem.fileName).toLowerCase();
    const url = getDocumentUrl(documentItem).toLowerCase();
    return type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)($|\?)/i.test(name || url);
  }

  function getDocumentIcon(documentItem = {}) {
    const type = cleanText(documentItem.fileType).toLowerCase();
    const name = cleanText(documentItem.fileName).toLowerCase();
    if (type.includes("pdf") || name.endsWith(".pdf")) {
      return "PDF";
    }
    if (isImageDocument(documentItem)) {
      return "IMG";
    }
    return "DOC";
  }

  function renderMaterialCard(documentItem = {}, index = 0) {
    const card = document.createElement("article");
    card.className = "learning-public-material";

    const icon = document.createElement("div");
    icon.className = "learning-public-material-icon";
    icon.textContent = getDocumentIcon(documentItem);

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = cleanText(documentItem.fileName) || `Materijal ${index + 1}`;
    const meta = document.createElement("span");
    meta.className = "learning-public-meta";
    meta.textContent = [
      cleanText(documentItem.description),
      cleanText(documentItem.fileType),
    ].filter(Boolean).join(" - ") || "Priručnik / literatura za pripremu.";
    copy.append(title, meta);

    const url = getDocumentUrl(documentItem);
    if (url) {
      const link = document.createElement("a");
      link.className = "secondary-button";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Otvori";
      card.append(icon, copy, link);

      if (isImageDocument(documentItem)) {
        const image = document.createElement("img");
        image.className = "learning-public-material-preview";
        image.src = url;
        image.alt = title.textContent;
        card.append(image);
      }
    } else {
      const unavailable = document.createElement("span");
      unavailable.className = "learning-public-meta";
      unavailable.textContent = "Nema javnog linka";
      card.append(icon, copy, unavailable);
    }

    return card;
  }

  function renderVideoCard(videoItem = {}, index = 0) {
    const card = document.createElement("article");
    card.className = "learning-public-material";
    const icon = document.createElement("div");
    icon.className = "learning-public-material-icon";
    icon.textContent = "VID";
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = cleanText(videoItem.title) || `Video ${index + 1}`;
    const meta = document.createElement("span");
    meta.className = "learning-public-meta";
    meta.textContent = cleanText(videoItem.description) || cleanText(videoItem.url) || "Video materijal.";
    copy.append(title, meta);
    const url = cleanText(videoItem.url);
    if (url) {
      const link = document.createElement("a");
      link.className = "secondary-button";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Otvori";
      card.append(icon, copy, link);
    } else {
      card.append(icon, copy);
    }
    return card;
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

  function renderQuestionImage(questionNode, question = {}) {
    const documentItem = question.imageDocument || null;
    const url = documentItem ? getDocumentUrl(documentItem) : "";
    if (!url || !isImageDocument(documentItem)) {
      return;
    }
    const image = document.createElement("img");
    image.className = "learning-public-material-preview";
    image.src = url;
    image.alt = question.prompt || "Slika pitanja";
    questionNode.append(image);
  }

  function renderQuestion(question, answersMap) {
    const questionType = String(question.questionType || "single_choice").trim().toLowerCase();
    const questionNode = document.createElement("article");
    questionNode.className = "learning-public-question";

    const heading = document.createElement("h3");
    heading.textContent = question.prompt || "Pitanje";
    questionNode.append(heading);
    renderQuestionImage(questionNode, question);

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
      metaNode.textContent = `${getAssignmentName(assignment)} - ${getStatusLabel(assignment.status)}`;
    }
    if (!contentNode) {
      return;
    }

    contentNode.hidden = false;
    const answersMap = {};
    const questions = Array.isArray(test.questionItems) ? test.questionItems : [];
    const materials = Array.isArray(test.handbookDocuments) ? test.handbookDocuments : [];
    const videos = Array.isArray(test.videoItems) ? test.videoItems : [];

    const renderDataStep = () => {
      contentNode.replaceChildren(createSteps("data"));
      contentNode.append(createSectionHead(
        "Početak",
        "Provjeri podatke prije ispita",
        "Ako nešto nije točno, javi osobi koja ti je poslala link prije rješavanja testa.",
      ));

      const personGrid = document.createElement("div");
      personGrid.className = "learning-public-grid";
      personGrid.append(
        createInfoField("Polaznik", getAssignmentName(assignment)),
        createInfoField("OIB", assignment.externalOib),
        createInfoField("Email", getAssignmentEmail(assignment)),
        createInfoField("Tvrtka", assignment.externalCompany),
        createInfoField("Radni nalog", assignment.workOrderNumber),
        createInfoField("Usluga", assignment.serviceName),
        createInfoField("Status", getStatusLabel(assignment.status)),
        createInfoField("Dodijeljeno", formatDate(assignment.assignedAt)),
      );
      contentNode.append(personGrid);

      contentNode.append(createSectionHead(
        "Ispit",
        cleanText(test.title) || "Opći podaci o ispitu",
        `${questions.length} pitanja - ${materials.length + videos.length} materijala`,
      ));
      contentNode.append(createTextNote(test.description, "Riješi pitanja i pošalji odgovore."));

      const examGrid = document.createElement("div");
      examGrid.className = "learning-public-grid";
      examGrid.append(
        createInfoField("Namjena ispita", test.intendedFor),
        createInfoField("Pravila dodjele", test.recommendationRules),
        createInfoField("Stručnjak / predavač", assignment.safetySpecialistLabel),
        createInfoField("Dodijelio", assignment.assignedByLabel),
      );
      contentNode.append(examGrid);

      const confirmLabel = document.createElement("label");
      confirmLabel.className = "learning-public-check";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const checkText = document.createElement("span");
      checkText.textContent = "Potvrđujem da su prikazani podaci točni i da ću test rješavati samostalno.";
      confirmLabel.append(checkbox, checkText);
      contentNode.append(confirmLabel);

      const actions = document.createElement("div");
      actions.className = "learning-public-actions";
      const nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.className = "primary-button";
      nextButton.disabled = true;
      nextButton.textContent = "Potvrdi i otvori literaturu";
      checkbox.addEventListener("change", () => {
        nextButton.disabled = !checkbox.checked;
      });
      nextButton.addEventListener("click", renderMaterialsStep);
      actions.append(nextButton);
      contentNode.append(actions);

      if (String(assignment.status || "").toLowerCase() === "completed") {
        const score = Number(assignment.scorePercent ?? 0);
        setSuccess(`Test je već predan. Rezultat: ${Number.isFinite(score) ? Math.round(score) : 0}%`);
      }
    };

    const renderMaterialsStep = () => {
      contentNode.replaceChildren(createSteps("materials"));
      contentNode.append(createSectionHead(
        "Priprema",
        "Literatura i priručnik",
        "Pregledaj materijale prije rješavanja pitanja.",
      ));

      const wrapper = document.createElement("div");
      wrapper.className = "learning-public-materials";
      materials.forEach((item, index) => wrapper.append(renderMaterialCard(item, index)));
      videos.forEach((item, index) => wrapper.append(renderVideoCard(item, index)));

      if (!materials.length && !videos.length) {
        const empty = document.createElement("div");
        empty.className = "learning-public-empty";
        empty.textContent = "Za ovaj ispit nije dodana posebna literatura. Možeš nastaviti na pitanja.";
        wrapper.append(empty);
      }
      contentNode.append(wrapper);

      const actions = document.createElement("div");
      actions.className = "learning-public-actions is-split";
      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "secondary-button";
      backButton.textContent = "Natrag na podatke";
      backButton.addEventListener("click", renderDataStep);
      const nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.className = "primary-button";
      nextButton.textContent = "Kreni na pitanja";
      nextButton.addEventListener("click", renderQuestionsStep);
      actions.append(backButton, nextButton);
      contentNode.append(actions);
    };

    const renderQuestionsStep = () => {
      contentNode.replaceChildren(createSteps("questions"));
      contentNode.append(createSectionHead(
        "Test",
        cleanText(test.title) || "Pitanja",
        `${questions.length} pitanja`,
      ));

      if (questions.length === 0) {
        const empty = document.createElement("div");
        empty.className = "learning-public-empty";
        empty.textContent = "Ovaj test još nema dodana pitanja.";
        contentNode.append(empty);
        return;
      }

      questions.forEach((question) => {
        contentNode.append(renderQuestion(question, answersMap));
      });

      const actions = document.createElement("div");
      actions.className = "learning-public-actions is-split";
      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "secondary-button";
      backButton.textContent = "Natrag na literaturu";
      backButton.addEventListener("click", renderMaterialsStep);

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

      actions.append(backButton, submitButton);
      contentNode.append(actions);
    };

    renderDataStep();
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
      titleNode.textContent = "Učitavam ispit...";
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
