import React from "react";
import { createRoot } from "react-dom/client";

const roots = new WeakMap();
const noop = () => {};

function cx(...items) {
  return items.filter(Boolean).join(" ");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function Field({ label, children, className = "", hint = "" }) {
  return (
    <label className={cx("field", className)}>
      <span>{label}</span>
      {children}
      {hint ? <small className="helper-copy module-copy">{hint}</small> : null}
    </label>
  );
}

function TextField({ label, value, onChange = noop, className = "", type = "text", placeholder = "", required = false, disabled = false }) {
  return (
    <Field label={label} className={className}>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function TextAreaField({ label, value, onChange = noop, className = "", rows = 3, placeholder = "" }) {
  return (
    <Field label={label} className={className}>
      <textarea rows={rows} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function SelectField({ label, value, options = [], onChange = noop, className = "", disabled = false }) {
  return (
    <Field label={label} className={className}>
      <select value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={`${option.value}:${option.label}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  );
}

function ToggleField({ label, checked = false, onChange = noop, className = "" }) {
  return (
    <label className={cx("field operations-toggle-field", className)}>
      <span>{label}</span>
      <span className={cx("operations-switch", checked && "is-on")}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <i aria-hidden="true" />
        <strong>{checked ? "Da" : "Ne"}</strong>
      </span>
    </label>
  );
}

function StatCard({ label, value, tone = "" }) {
  return (
    <article className={cx("organisations-stat-card", tone)}>
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
    </article>
  );
}

function EmptyCard({ children }) {
  return <div className="offers-empty-card operations-empty-card">{children}</div>;
}

function ActionButton({ children, variant = "ghost-button", disabled = false, onClick = noop, type = "button" }) {
  return (
    <button type={type} className={variant} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function MiniButton({ label, icon, disabled = false, onClick = noop, danger = false }) {
  return (
    <button
      type="button"
      className={cx("organisations-icon-button", danger && "is-danger")}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}

function MultiChecklist({ options = [], selectedIds = [], onChange = noop, emptyText = "Nema stavki za odabir." }) {
  const selected = new Set(asArray(selectedIds).map(String));

  if (!options.length) {
    return <p className="helper-copy module-copy">{emptyText}</p>;
  }

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(String(id))) {
      next.delete(String(id));
    } else {
      next.add(String(id));
    }
    onChange([...next]);
  };

  return (
    <div className="service-catalog-template-list operations-checklist">
      {options.map((option) => (
        <label className="service-catalog-template-option" key={option.value}>
          <input type="checkbox" checked={selected.has(String(option.value))} onChange={() => toggle(option.value)} />
          <div className="service-catalog-template-option-copy">
            <strong>{option.label}</strong>
            {option.meta ? <span>{option.meta}</span> : null}
          </div>
        </label>
      ))}
    </div>
  );
}

function DocumentRows({ documents = [], onRemove = noop, onDownload = noop }) {
  if (!documents.length) {
    return <p className="helper-copy module-copy">Jos nema dodanih dokumenata.</p>;
  }

  return (
    <div className="module-attachment-list operations-document-list">
      {documents.map((document) => (
        <article className="module-attachment-row legal-framework-document-row" key={document.id}>
          <div className="module-attachment-copy">
            <strong>{document.fileName || "Dokument"}</strong>
            <span>{document.meta || [document.fileType, document.fileSizeLabel].filter(Boolean).join(" | ")}</span>
            {document.description ? <p className="module-attachment-description">{document.description}</p> : null}
          </div>
          <div className="module-attachment-actions">
            <MiniButton label="Preuzmi" icon="D" onClick={() => onDownload(document.id)} />
            <MiniButton label="Makni" icon="X" danger onClick={() => onRemove(document.id)} />
          </div>
        </article>
      ))}
    </div>
  );
}

function ServiceCatalogModule({
  filters = {},
  statusOptions = [],
  stats = {},
  items = [],
  canManage = false,
  onCreate = noop,
  onFilterChange = noop,
  onOpen = noop,
}) {
  return (
    <div className="operations-react-shell service-catalog-react-shell">
      <section className="panel organisations-hero-panel operations-hero-panel">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Services</p>
            <h3>Katalog usluga i template veza</h3>
            <p className="helper-copy module-copy">Usluge, ZNR osposobljavanja, povezani zapisnici, testovi i rokovi vrijedenja.</p>
          </div>
          {canManage ? <button type="button" className="primary-button" onClick={onCreate}>+ Nova usluga</button> : null}
        </div>
        <div className="organisations-stat-grid">
          <StatCard label="Ukupno" value={stats.total} />
          <StatCard label="Aktivne" value={stats.active} tone="is-success" />
          <StatCard label="Neaktivne" value={stats.inactive} tone="is-warning" />
          <StatCard label="S templateom" value={stats.withTemplate} tone="is-info" />
        </div>
      </section>
      <section className="panel organisations-list-panel service-catalog-list-panel">
        <div className="operations-filter-bar organisations-filter-bar">
          <Field label="Pretraga">
            <input
              type="search"
              value={filters.query || ""}
              placeholder="Ime usluge, sifra, zapisnik, ispit..."
              onChange={(event) => onFilterChange({ query: event.target.value })}
            />
          </Field>
          <SelectField label="Status" value={filters.status || "all"} options={statusOptions} onChange={(status) => onFilterChange({ status })} />
        </div>
        <div className="service-catalog-list operations-card-list">
          {items.length ? items.map((item) => (
            <article
              className={cx("service-catalog-card operations-card", item.statusClass, item.isActive && "is-active")}
              key={item.id}
              role={canManage ? "button" : undefined}
              tabIndex={canManage ? 0 : undefined}
              onClick={() => canManage && onOpen(item.id)}
              onKeyDown={(event) => {
                if (!canManage || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                onOpen(item.id);
              }}
            >
              <div className="service-catalog-card-head">
                <div className="service-catalog-card-copy">
                  <h4>{item.name || "Bez naziva"}</h4>
                  <p className="service-catalog-card-meta">{item.meta}</p>
                </div>
                <div className="service-catalog-card-head-badges">
                  <span className="service-catalog-template-badge">{item.typeLabel}</span>
                  <span className={cx("service-catalog-status-badge", item.statusClass)}>{item.statusLabel}</span>
                </div>
              </div>
              <div className="service-catalog-card-templates">
                {item.badges.length ? item.badges.map((badge) => (
                  <span className={cx("service-catalog-template-badge", badge.muted && "is-muted")} key={badge.label}>{badge.label}</span>
                )) : <span className="service-catalog-template-badge is-muted">Bez veza</span>}
              </div>
              {item.note ? <p className="service-catalog-card-note">{item.note}</p> : null}
              <div className="service-catalog-card-footer">
                <span className="service-catalog-card-updated">{item.updatedLabel}</span>
              </div>
            </article>
          )) : <EmptyCard>Nema usluga za odabrane filtere.</EmptyCard>}
        </div>
      </section>
    </div>
  );
}

function ServiceCatalogEditor({
  title = "Nova usluga",
  draft = {},
  statusOptions = [],
  typeOptions = [],
  templateOptions = [],
  learningTestOptions = [],
  certificateTemplateOptions = [],
  canDelete = false,
  error = "",
  onDraftChange = noop,
  onSave = noop,
  onReset = noop,
  onDelete = noop,
  onClose = noop,
  onUploadCertificate = noop,
  onDownloadCertificate = noop,
  onRemoveCertificate = noop,
  onUseCertificateTemplate = noop,
}) {
  const [localDraft, setLocalDraft] = React.useState(draft);
  const [busy, setBusy] = React.useState(false);
  const [localError, setLocalError] = React.useState("");
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    setLocalDraft(draft);
    setLocalError("");
  }, [draft.versionKey]);

  const patch = (nextPatch) => {
    const next = { ...localDraft, ...nextPatch };
    setLocalDraft(next);
    onDraftChange(next);
  };

  const isTraining = localDraft.serviceType === "znr" || localDraft.isTraining;

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setLocalError("");
    try {
      await onSave(localDraft);
    } catch (saveError) {
      setLocalError(saveError?.message || "Spremanje nije uspjelo.");
    } finally {
      setBusy(false);
    }
  };

  const uploadCertificate = async (event) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const certificate = await onUploadCertificate(file, localDraft);
      patch({ trainingCertificateTemplate: certificate });
    } catch (uploadError) {
      setLocalError(uploadError?.message || "Upload nije uspio.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="operations-editor-react service-catalog-editor-react">
      <div className="organisations-editor-head">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Service editor</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>Zatvori</button>
        </div>
      </div>
      <form className="organisations-editor-body operations-editor-body" onSubmit={save}>
        <section className="service-catalog-template-block operations-editor-section">
          <div className="form-grid service-catalog-form-grid">
            <TextField label="Naziv usluge" value={localDraft.name} required placeholder="Ispitivanje panik rasvjete" onChange={(value) => patch({ name: value })} />
            <TextField label="Sifra" value={localDraft.serviceCode} required placeholder="SPR" onChange={(value) => patch({ serviceCode: value })} />
            <SelectField label="Status" value={localDraft.status || "active"} options={statusOptions} onChange={(value) => patch({ status: value })} />
            <SelectField
              label="Vrsta"
              value={localDraft.serviceType || "inspection"}
              options={typeOptions}
              onChange={(value) => patch({
                serviceType: value,
                isTraining: value === "znr",
                linkedTemplateIds: value === "inspection" ? asArray(localDraft.linkedTemplateIds) : [],
                linkedLearningTestIds: value === "znr" ? asArray(localDraft.linkedLearningTestIds) : [],
              })}
            />
            <TextField label="Vrijedi mjeseci" value={localDraft.validityMonths} placeholder="12, 24, 36..." onChange={(value) => patch({ validityMonths: value })} />
            <ToggleField label="Usluga za ljude / ZNR" checked={isTraining} onChange={(checked) => patch({ serviceType: checked ? "znr" : "inspection", isTraining: checked })} />
            <TextAreaField label="Napomena" value={localDraft.note} className="field-span-full" placeholder="Opseg, posebnosti, interne napomene..." onChange={(value) => patch({ note: value })} />
          </div>
        </section>

        {!isTraining ? (
          <section className="service-catalog-template-block operations-editor-section">
            <div className="section-heading offers-section-heading">
              <div>
                <p className="section-kicker">Templates</p>
                <h3>Zapisnici koji koriste ovu uslugu</h3>
              </div>
            </div>
            <MultiChecklist
              options={templateOptions}
              selectedIds={localDraft.linkedTemplateIds}
              onChange={(linkedTemplateIds) => patch({ linkedTemplateIds })}
              emptyText="Prvo pripremi templatee u Template Developmentu."
            />
          </section>
        ) : (
          <section className="service-catalog-template-block operations-editor-section">
            <div className="section-heading offers-section-heading">
              <div>
                <p className="section-kicker">ZNR</p>
                <h3>Testovi i uvjerenja</h3>
              </div>
            </div>
            <MultiChecklist
              options={learningTestOptions}
              selectedIds={localDraft.linkedLearningTestIds}
              onChange={(linkedLearningTestIds) => patch({ linkedLearningTestIds })}
              emptyText="Prvo dodaj learning testove."
            />
            <div className="operations-certificate-card">
              <div>
                <strong>{localDraft.trainingCertificateTemplate?.fileName || "Predlozak uvjerenja nije povezan"}</strong>
                <p className="helper-copy module-copy">{localDraft.trainingCertificateTemplate?.meta || "Uploadaj Word ili odaberi IS ZNR template."}</p>
              </div>
              <div className="document-template-reference-actions">
                <input ref={fileRef} type="file" hidden accept=".docx,.dotx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.wordprocessingml.template" onChange={uploadCertificate} />
                <ActionButton disabled={busy} onClick={() => fileRef.current?.click()}>Upload Word</ActionButton>
                <ActionButton disabled={!localDraft.trainingCertificateTemplate} onClick={() => onDownloadCertificate(localDraft.trainingCertificateTemplate)}>Preuzmi</ActionButton>
                <ActionButton variant="card-button card-danger" disabled={!localDraft.trainingCertificateTemplate} onClick={() => { onRemoveCertificate(); patch({ trainingCertificateTemplate: null }); }}>Makni</ActionButton>
              </div>
              {certificateTemplateOptions.length ? (
                <SelectField
                  label="IS ZNR template"
                  value={localDraft.trainingCertificateTemplate?.sourceDocumentId || ""}
                  options={[{ value: "", label: "Odaberi template" }, ...certificateTemplateOptions]}
                  onChange={async (value) => {
                    const certificate = await onUseCertificateTemplate(value, localDraft);
                    patch({ trainingCertificateTemplate: certificate });
                  }}
                />
              ) : null}
            </div>
          </section>
        )}

        {localError || error ? <p className="form-error" aria-live="polite">{localError || error}</p> : null}
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={busy}>{busy ? "Spremam..." : "Spremi uslugu"}</button>
          <button type="button" className="ghost-button" disabled={busy} onClick={onReset}>Nova usluga</button>
          {canDelete ? <button type="button" className="card-button card-danger" disabled={busy} onClick={() => onDelete(localDraft.id)}>Obrisi</button> : null}
        </div>
      </form>
    </div>
  );
}

function SafetyAuthorizationModule({
  filters = {},
  stats = {},
  items = [],
  canManage = false,
  onCreate = noop,
  onFilterChange = noop,
  onOpen = noop,
  onDownloadDocument = noop,
}) {
  return (
    <div className="operations-react-shell safety-authorization-react-shell">
      <section className="panel organisations-hero-panel operations-hero-panel">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">People safety authorization</p>
            <h3>Ovlastenja i rjesenja</h3>
            <p className="helper-copy module-copy">Centralna evidencija ovlastenja koja se povezuju s uslugama i kasnije ulaze u zapisnike.</p>
          </div>
          {canManage ? <button type="button" className="primary-button" onClick={onCreate}>+ Novo ovlastenje</button> : null}
        </div>
        <div className="organisations-stat-grid">
          <StatCard label="Ukupno" value={stats.total} />
          <StatCard label="Aktivna" value={stats.active} tone="is-success" />
          <StatCard label="Uskoro isticu" value={stats.expiring} tone="is-warning" />
          <StatCard label="PDF dok." value={stats.documents} tone="is-info" />
        </div>
      </section>
      <section className="panel organisations-list-panel safety-authorization-list-panel">
        <div className="operations-filter-bar organisations-filter-bar is-single">
          <Field label="Pretraga">
            <input
              type="search"
              value={filters.query || ""}
              placeholder="Naziv, opseg, usluga, PDF..."
              onChange={(event) => onFilterChange({ query: event.target.value })}
            />
          </Field>
        </div>
        <div className="safety-authorization-list operations-card-list">
          {items.length ? items.map((item) => (
            <article
              className={cx("safety-authorization-card operations-card", item.isActive && "is-active")}
              key={item.id}
              role={canManage ? "button" : undefined}
              tabIndex={canManage ? 0 : undefined}
              onClick={() => canManage && onOpen(item.id)}
              onKeyDown={(event) => {
                if (!canManage || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                onOpen(item.id);
              }}
            >
              <div className="safety-authorization-card-head">
                <div className="safety-authorization-card-copy">
                  <h4>{item.title || "Bez naziva"}</h4>
                  <p className="safety-authorization-card-meta">{item.scope || "Bez definiranog opsega"}</p>
                </div>
                <div className="safety-authorization-card-chips">
                  {item.dateBadges.map((badge) => <span className={badge.className} key={badge.label}>{badge.label}</span>)}
                </div>
              </div>
              <div className="safety-authorization-card-chips">
                {item.serviceTitles.length ? item.serviceTitles.map((title) => (
                  <span className="service-catalog-template-badge" key={title}>{title}</span>
                )) : <span className="service-catalog-template-badge is-muted">Bez usluga</span>}
              </div>
              <p className="safety-authorization-card-note">{item.note || "Bez dodatne napomene."}</p>
              <div className="safety-authorization-card-footer">
                <div className="safety-authorization-card-chips">
                  <span className={cx("service-catalog-template-badge", !item.documentCount && "is-muted")}>{item.documentCount ? `${item.documentCount} PDF` : "Bez PDF-a"}</span>
                </div>
                <div className="safety-authorization-card-actions" onClick={(event) => event.stopPropagation()}>
                  {item.documents.slice(0, 2).map((document) => (
                    <MiniButton key={document.id} label={`Preuzmi ${document.fileName || "PDF"}`} icon="PDF" onClick={() => onDownloadDocument(item.id, document.id)} />
                  ))}
                </div>
              </div>
            </article>
          )) : <EmptyCard>Nema ovlastenja za odabrane filtere.</EmptyCard>}
        </div>
      </section>
    </div>
  );
}

function SafetyAuthorizationEditor({
  title = "Novo ovlastenje",
  draft = {},
  serviceOptions = [],
  canDelete = false,
  error = "",
  onDraftChange = noop,
  onSave = noop,
  onReset = noop,
  onDelete = noop,
  onClose = noop,
  onUploadDocuments = noop,
  onDownloadDocument = noop,
}) {
  const [localDraft, setLocalDraft] = React.useState(draft);
  const [busy, setBusy] = React.useState(false);
  const [localError, setLocalError] = React.useState("");
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    setLocalDraft(draft);
    setLocalError("");
  }, [draft.versionKey]);

  const patch = (nextPatch) => {
    const next = { ...localDraft, ...nextPatch };
    setLocalDraft(next);
    onDraftChange(next);
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setLocalError("");
    try {
      await onSave(localDraft);
    } catch (saveError) {
      setLocalError(saveError?.message || "Spremanje nije uspjelo.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      const documents = await onUploadDocuments(files, localDraft);
      patch({ documents });
    } catch (uploadError) {
      setLocalError(uploadError?.message || "Upload nije uspio.");
    } finally {
      setBusy(false);
    }
  };

  const removeDocument = (documentId) => {
    patch({ documents: asArray(localDraft.documents).filter((document) => String(document.id) !== String(documentId)) });
  };

  return (
    <div className="operations-editor-react safety-authorization-editor-react">
      <div className="organisations-editor-head">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Authorization editor</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>Zatvori</button>
        </div>
      </div>
      <form className="organisations-editor-body operations-editor-body" onSubmit={save}>
        <section className="service-catalog-template-block operations-editor-section">
          <div className="form-grid safety-authorization-form-grid">
            <TextField label="Ime ovlastenja" value={localDraft.title} required placeholder="Ovlastenje za..." onChange={(value) => patch({ title: value })} />
            <TextField label="Pod ovlastenje / opseg" value={localDraft.scope} placeholder="Sto pokriva ovo ovlastenje" onChange={(value) => patch({ scope: value })} />
            <TextField label="Izdano" type="date" value={localDraft.issuedOn} onChange={(value) => patch({ issuedOn: value })} />
            <TextField label="Vrijedi do" type="date" value={localDraft.validUntil} disabled={localDraft.validForever} onChange={(value) => patch({ validUntil: value })} />
            <ToggleField label="Trajno ovlastenje" checked={Boolean(localDraft.validForever)} onChange={(checked) => patch({ validForever: checked, validUntil: checked ? "" : localDraft.validUntil })} />
            <TextAreaField label="Napomena" value={localDraft.note} className="field-span-full" placeholder="Broj rjesenja, dodatni detalji..." onChange={(value) => patch({ note: value })} />
          </div>
        </section>
        <section className="service-catalog-template-block operations-editor-section">
          <div className="section-heading offers-section-heading">
            <div>
              <p className="section-kicker">Services</p>
              <h3>Usluge u kojima se koristi</h3>
            </div>
          </div>
          <MultiChecklist
            options={serviceOptions}
            selectedIds={localDraft.linkedServiceCatalogIds}
            onChange={(linkedServiceCatalogIds) => patch({ linkedServiceCatalogIds })}
            emptyText="Prvo dodaj usluge u List of Services."
          />
        </section>
        <section className="service-catalog-template-block operations-editor-section">
          <div className="section-heading offers-section-heading">
            <div>
              <p className="section-kicker">Documents</p>
              <h3>PDF ovlastenja i rjesenja</h3>
            </div>
            <div className="document-template-reference-actions">
              <input ref={fileRef} type="file" hidden multiple accept=".pdf,application/pdf" onChange={upload} />
              <ActionButton disabled={busy} onClick={() => fileRef.current?.click()}>Dodaj PDF</ActionButton>
            </div>
          </div>
          <DocumentRows documents={asArray(localDraft.documents)} onRemove={removeDocument} onDownload={onDownloadDocument} />
        </section>
        {localError || error ? <p className="form-error" aria-live="polite">{localError || error}</p> : null}
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={busy}>{busy ? "Spremam..." : "Spremi ovlastenje"}</button>
          <button type="button" className="ghost-button" disabled={busy} onClick={onReset}>Novo ovlastenje</button>
          {canDelete ? <button type="button" className="card-button card-danger" disabled={busy} onClick={() => onDelete(localDraft.id)}>Obrisi</button> : null}
        </div>
      </form>
    </div>
  );
}

function WorkOrderQuickCreate({ options = {}, busy = false, onCreate = noop }) {
  const [draft, setDraft] = React.useState({
    status: options.statusOptions?.[0]?.value || "Otvoreni RN",
    companyId: "",
    locationId: "",
    dueDate: "",
    serviceIds: [],
    executorIds: [],
  });
  const [openMore, setOpenMore] = React.useState(false);
  const selectedCompanyId = draft.companyId || "";
  const locationOptions = asArray(options.locations)
    .filter((location) => !selectedCompanyId || String(location.companyId) === String(selectedCompanyId))
    .map((location) => ({ value: location.id, label: location.label, meta: location.meta }));
  const serviceSelected = new Set(asArray(draft.serviceIds).map(String));
  const executorSelected = new Set(asArray(draft.executorIds).map(String));

  const patch = (nextPatch) => setDraft((current) => ({ ...current, ...nextPatch }));
  const toggleMulti = (key, value) => {
    const source = key === "serviceIds" ? serviceSelected : executorSelected;
    const next = new Set(source);
    if (next.has(String(value))) next.delete(String(value));
    else next.add(String(value));
    patch({ [key]: [...next] });
  };

  const submit = async (event) => {
    event.preventDefault();
    const ok = await onCreate(draft);
    if (ok) {
      setDraft({
        status: draft.status,
        companyId: draft.companyId,
        locationId: "",
        dueDate: "",
        serviceIds: [],
        executorIds: [],
      });
    }
  };

  return (
    <form className="work-order-react-quick-create" onSubmit={submit}>
      <div className="work-order-react-quick-mark">+</div>
      <SelectField label="Status" value={draft.status} options={options.statusOptions} onChange={(status) => patch({ status })} />
      <SelectField
        label="Tvrtka"
        value={draft.companyId}
        options={[{ value: "", label: "Odaberi tvrtku" }, ...asArray(options.companies)]}
        onChange={(companyId) => patch({ companyId, locationId: "" })}
      />
      <SelectField label="Lokacija" value={draft.locationId} options={[{ value: "", label: "Prvo odaberi tvrtku" }, ...locationOptions]} onChange={(locationId) => patch({ locationId })} />
      <TextField label="Rok" value={draft.dueDate} placeholder="dd.mm.yyyy" onChange={(dueDate) => patch({ dueDate })} />
      <button type="button" className="ghost-button" onClick={() => setOpenMore((value) => !value)}>{openMore ? "Manje" : "Usluge / izvrsitelji"}</button>
      <button type="submit" className="primary-button" disabled={busy || !draft.companyId}>{busy ? "Otvaram..." : "Otvori RN"}</button>
      {openMore ? (
        <div className="work-order-react-quick-details">
          <div>
            <strong>Usluge</strong>
            <div className="work-order-react-chip-grid">
              {asArray(options.services).map((service) => (
                <button
                  type="button"
                  key={service.value}
                  className={cx("work-order-react-chip", serviceSelected.has(String(service.value)) && "is-selected")}
                  onClick={() => toggleMulti("serviceIds", service.value)}
                >
                  {service.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <strong>Izvrsitelji</strong>
            <div className="work-order-react-chip-grid">
              {asArray(options.executors).map((executor) => (
                <button
                  type="button"
                  key={executor.value}
                  className={cx("work-order-react-chip", executorSelected.has(String(executor.value)) && "is-selected")}
                  onClick={() => toggleMulti("executorIds", executor.value)}
                >
                  {executor.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function WorkOrdersList({
  stats = {},
  groups = [],
  selectedIds = [],
  statusOptions = [],
  priorityOptions = [],
  quickOptions = {},
  busy = false,
  canCreate = false,
  canManage = false,
  canOpenDocuments = false,
  documentActionLabel = "Zapisnici",
  loadState = "",
  batchMessage = "",
  onCreate = noop,
  onOpen = noop,
  onDelete = noop,
  onStatusChange = noop,
  onPriorityChange = noop,
  onToggleSelect = noop,
  onSelectVisible = noop,
  onOpenDocuments = noop,
  onLoadMore = noop,
  onDownloadPdf = noop,
  onDownloadVerified = noop,
}) {
  const selected = new Set(asArray(selectedIds).map(String));

  return (
    <section className="work-order-react-list">
      <div className="work-order-react-summary">
        <StatCard label="RN ukupno" value={stats.total} />
        <StatCard label="Prikazano" value={stats.visible} tone="is-info" />
        <StatCard label="Odabrano" value={selected.size} tone="is-success" />
        <StatCard label="Kasni" value={stats.overdue} tone="is-warning" />
      </div>
      <div className="work-order-react-actions">
        <label className="work-order-row-select master">
          <input
            type="checkbox"
            checked={stats.visible > 0 && stats.visibleSelected === stats.visible}
            ref={(node) => {
              if (node) node.indeterminate = stats.visibleSelected > 0 && stats.visibleSelected < stats.visible;
            }}
            onChange={(event) => onSelectVisible(event.target.checked)}
          />
          <span>Oznaci prikazane</span>
        </label>
        <button type="button" className="primary-button work-order-batch-launch" disabled={!canOpenDocuments} onClick={onOpenDocuments}>
          {documentActionLabel}
          {selected.size ? <span className="work-order-batch-count">{selected.size}</span> : null}
        </button>
      </div>
      {canCreate ? <WorkOrderQuickCreate options={{ ...quickOptions, statusOptions }} busy={busy} onCreate={onCreate} /> : null}
      {batchMessage ? <p className="work-order-react-batch-message">{batchMessage}</p> : null}
      <div className="work-order-react-groups">
        {groups.length ? groups.map((group) => (
          <section className="work-group work-group-flat work-order-react-group" key={group.status}>
            <div className="work-group-header">
              <div className="work-group-lead">
                <span className="work-group-fold">v</span>
                <span className={cx("work-group-status-badge", group.statusClass)}>{group.label}</span>
                <span className="work-group-count">{group.totalCount}</span>
              </div>
            </div>
            <div className="work-order-react-row-head">
              <span>Osnovno</span>
              <span>Klijent</span>
              <span>Lokacija</span>
              <span>Kontakt / usluge</span>
              <span>Prioritet</span>
              <span>Akcije</span>
            </div>
            <div className="work-group-body">
              {group.items.map((item) => (
                <article className={cx("work-item-card work-order-react-row", selected.has(String(item.id)) && "is-selected")} key={item.id}>
                  <div className="work-item-cell work-item-select-cell">
                    <label className="work-order-row-select">
                      <input type="checkbox" checked={selected.has(String(item.id))} onChange={(event) => onToggleSelect(item.id, event.target.checked)} />
                    </label>
                  </div>
                  <button type="button" className="work-order-react-open" onClick={() => onOpen(item.id)}>
                    <strong>{item.workOrderNumber || "Bez broja"}</strong>
                    <span>{item.openedDateLabel} | {item.dueDateLabel}</span>
                  </button>
                  <div className="work-item-value-stack">
                    <strong>{item.companyName || "Bez tvrtke"}</strong>
                    <span>{item.contractLabel || "Bez ugovora"}</span>
                  </div>
                  <div className="work-item-value-stack">
                    <strong>{item.locationName || "Bez lokacije"}</strong>
                    <span>{item.region || item.coordinates || "Bez regije"}</span>
                  </div>
                  <div className="work-item-value-stack">
                    <strong>{item.contactLabel || "Bez kontakta"}</strong>
                    <span>{item.serviceSummary || "Bez usluge"}</span>
                  </div>
                  <div className="work-order-react-inline-controls">
                    <select value={item.status || ""} disabled={!canManage} onChange={(event) => onStatusChange(item.id, event.target.value)}>
                      {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <select value={item.priority || "Normal"} disabled={!canManage} onChange={(event) => onPriorityChange(item.id, event.target.value)}>
                      {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="work-item-actions-cell">
                    <MiniButton label="Preuzmi RN PDF" icon="PDF" onClick={() => onDownloadPdf(item.id)} />
                    <MiniButton label="Ovjerena verzija" icon="OV" onClick={() => onDownloadVerified(item.id)} />
                    <MiniButton label="Uredi" icon="E" onClick={() => onOpen(item.id)} />
                    {canManage ? <MiniButton label="Obrisi" icon="X" danger onClick={() => onDelete(item.id)} /> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )) : <EmptyCard>Nema RN-ova za trenutni filter.</EmptyCard>}
      </div>
      <div className="work-order-react-load">
        <span>{loadState}</span>
        {stats.visible < stats.filtered ? <button type="button" className="ghost-button" onClick={onLoadMore}>Prikazi jos</button> : null}
      </div>
    </section>
  );
}

function mount(rootElement, element, className = "") {
  if (!rootElement) return false;
  let root = roots.get(rootElement);
  if (!root) {
    root = createRoot(rootElement);
    roots.set(rootElement, root);
  }
  if (className) rootElement.classList.add(className);
  root.render(element);
  return true;
}

function unmount(rootElement, className = "") {
  const root = rootElement ? roots.get(rootElement) : null;
  if (!root) return;
  root.unmount();
  roots.delete(rootElement);
  if (className) rootElement.classList.remove(className);
}

window.SafeNexusReactComponents = {
  ...(window.SafeNexusReactComponents ?? {}),
  renderServiceCatalogModule: (root, props = {}) => mount(root, <ServiceCatalogModule {...props} />, "is-react"),
  unmountServiceCatalogModule: (root) => unmount(root, "is-react"),
  renderServiceCatalogEditor: (root, props = {}) => mount(root, <ServiceCatalogEditor {...props} />, "is-react"),
  unmountServiceCatalogEditor: (root) => unmount(root, "is-react"),
  renderSafetyAuthorizationModule: (root, props = {}) => mount(root, <SafetyAuthorizationModule {...props} />, "is-react"),
  unmountSafetyAuthorizationModule: (root) => unmount(root, "is-react"),
  renderSafetyAuthorizationEditor: (root, props = {}) => mount(root, <SafetyAuthorizationEditor {...props} />, "is-react"),
  unmountSafetyAuthorizationEditor: (root) => unmount(root, "is-react"),
  renderWorkOrdersList: (root, props = {}) => mount(root, <WorkOrdersList {...props} />, "is-react"),
  unmountWorkOrdersList: (root) => unmount(root, "is-react"),
};
