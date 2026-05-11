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

function SelectField({ label, value, options = [], onChange = noop, className = "", disabled = false }) {
  return (
    <Field label={label} className={className}>
      <select value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={`${option.value}:${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function TextField({ label, value, onChange = noop, className = "", type = "text", placeholder = "", required = false }) {
  return (
    <Field label={label} className={className}>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function TextAreaField({ label, value, onChange = noop, className = "", rows = 3, placeholder = "" }) {
  return (
    <Field label={label} className={className}>
      <textarea
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function EmptyCard({ children }) {
  return <div className="offers-empty-card organisations-react-empty">{children}</div>;
}

function ActionButton({ children, variant = "ghost-button", disabled = false, onClick = noop, title = "" }) {
  return (
    <button type="button" className={variant} disabled={disabled} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

function SmallIconButton({ label, icon, disabled = false, onClick = noop, danger = false }) {
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

function StatCard({ label, value, tone = "" }) {
  return (
    <article className={cx("organisations-stat-card", tone)}>
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
    </article>
  );
}

function DocumentList({ documents = [], categories = [], onUpdate = noop, onRemove = noop, onDownload = noop }) {
  if (!documents.length) {
    return <p className="helper-copy module-copy">Još nema dodanih datoteka.</p>;
  }

  return (
    <div className="module-attachment-list organisations-document-list">
      {documents.map((document) => (
        <article className="module-attachment-row organisations-document-row" key={document.id}>
          <div className="module-attachment-copy">
            <strong>{document.fileName || "Dokument"}</strong>
            <span>{document.meta || [document.fileType, document.fileSizeLabel].filter(Boolean).join(" | ")}</span>
            <div className="module-attachment-fields">
              {categories.length ? (
                <label className="module-attachment-field">
                  <span className="module-attachment-field-label">Vrsta</span>
                  <select
                    className="module-attachment-category-select"
                    value={document.documentCategory || ""}
                    disabled={Boolean(document.documentCategoryLocked)}
                    onChange={(event) => onUpdate(document.id, { documentCategory: event.target.value })}
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="module-attachment-field">
                <span className="module-attachment-field-label">Opis</span>
                <input
                  value={document.description || ""}
                  placeholder="Kratki opis datoteke"
                  onChange={(event) => onUpdate(document.id, { description: event.target.value })}
                />
              </label>
            </div>
          </div>
          <div className="module-attachment-actions">
            <SmallIconButton label="Preuzmi" icon="D" onClick={() => onDownload(document.id)} />
            <SmallIconButton label="Makni" icon="X" danger onClick={() => onRemove(document.id)} />
          </div>
        </article>
      ))}
    </div>
  );
}

function ServiceChecklist({ options = [], selectedIds = [], onChange = noop }) {
  const selected = new Set(selectedIds.map(String));

  if (!options.length) {
    return <p className="helper-copy module-copy">Prvo dodaj usluge u katalog, pa ih ovdje poveži.</p>;
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
    <div className="service-catalog-template-list organisations-service-checklist">
      {options.map((option) => (
        <label className="service-catalog-template-option" key={option.value}>
          <input
            type="checkbox"
            checked={selected.has(String(option.value))}
            onChange={() => toggle(option.value)}
          />
          <div className="service-catalog-template-option-copy">
            <strong>{option.label}</strong>
            {option.meta ? <span>{option.meta}</span> : null}
          </div>
        </label>
      ))}
    </div>
  );
}

function MeasurementSpecsEditor({ rows = [], onChange = noop }) {
  const items = rows.length ? rows : [{ id: "spec-new", measurementRange: "", measurementUncertainty: "", note: "" }];

  const update = (id, patch) => {
    const next = items.map((row) => (String(row.id) === String(id) ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => {
    onChange([
      ...items,
      { id: `spec-${Date.now()}`, measurementRange: "", measurementUncertainty: "", note: "" },
    ]);
  };

  const removeRow = (id) => {
    onChange(items.filter((row) => String(row.id) !== String(id)));
  };

  return (
    <div className="organisations-inline-editor">
      {items.map((row, index) => (
        <article className="organisations-inline-row" key={row.id}>
          <TextField label="Mjerna veličina / raspon" value={row.measurementRange || row.range || ""} onChange={(value) => update(row.id, { measurementRange: value })} />
          <TextField label="Nesigurnost" value={row.measurementUncertainty || row.uncertainty || ""} onChange={(value) => update(row.id, { measurementUncertainty: value })} />
          <TextField label="Opaska" value={row.note || ""} onChange={(value) => update(row.id, { note: value })} />
          <SmallIconButton label="Makni red" icon="X" danger disabled={items.length === 1 && index === 0} onClick={() => removeRow(row.id)} />
        </article>
      ))}
      <ActionButton onClick={addRow}>+ Dodaj mjerni red</ActionButton>
    </div>
  );
}

function MeasurementActivityEditor({ rows = [], typeOptions = [], onChange = noop }) {
  const update = (id, patch) => {
    onChange(rows.map((row) => (String(row.id) === String(id) ? { ...row, ...patch, completed: false, isEditing: true } : row)));
  };

  const addRow = () => {
    onChange([
      {
        id: `activity-${Date.now()}`,
        activityType: typeOptions[0]?.value || "pregled",
        performedOn: new Date().toISOString().slice(0, 10),
        performedBy: "",
        validUntil: "",
        satisfies: "",
        note: "",
        completed: false,
        isEditing: true,
      },
      ...rows,
    ]);
  };

  const removeRow = (id) => onChange(rows.filter((row) => String(row.id) !== String(id)));

  return (
    <div className="organisations-inline-editor">
      <div className="organisations-inline-head">
        <strong>Evidencija aktivnosti</strong>
        <ActionButton onClick={addRow}>+ Dodaj aktivnost</ActionButton>
      </div>
      {rows.length ? rows.map((row) => (
        <article className="organisations-inline-row is-activity" key={row.id}>
          <SelectField label="Aktivnost" value={row.activityType || ""} options={typeOptions} onChange={(value) => update(row.id, { activityType: value })} />
          <TextField label="Datum" type="date" value={row.performedOn || ""} onChange={(value) => update(row.id, { performedOn: value })} />
          <TextField label="Izvršio" value={row.performedBy || ""} onChange={(value) => update(row.id, { performedBy: value })} />
          <TextField label="Vrijedi do" type="date" value={row.validUntil || ""} onChange={(value) => update(row.id, { validUntil: value })} />
          <SelectField
            label="Zadovoljava"
            value={row.satisfies || ""}
            options={[
              { value: "", label: "Odaberi" },
              { value: "da", label: "DA" },
              { value: "ne", label: "NE" },
            ]}
            onChange={(value) => update(row.id, { satisfies: value })}
          />
          <TextField label="Napomena" value={row.note || ""} onChange={(value) => update(row.id, { note: value })} />
          <SmallIconButton label="Makni aktivnost" icon="X" danger onClick={() => removeRow(row.id)} />
        </article>
      )) : <p className="helper-copy module-copy">Dodaj pregled, umjeravanje ili servis.</p>}
    </div>
  );
}

function VehicleActivityEditor({ rows = [], typeOptions = [], onChange = noop }) {
  const update = (id, patch) => {
    onChange(rows.map((row) => (String(row.id) === String(id) ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    onChange([
      {
        id: `vehicle-activity-${Date.now()}`,
        activityType: typeOptions[0]?.value || "service",
        performedOn: new Date().toISOString().slice(0, 10),
        performedBy: "",
        odometerKm: "",
        validUntil: "",
        workSummary: "",
        note: "",
      },
      ...rows,
    ]);
  };

  const removeRow = (id) => onChange(rows.filter((row) => String(row.id) !== String(id)));

  return (
    <div className="organisations-inline-editor">
      <div className="organisations-inline-head">
        <strong>Servisna i tehnička evidencija</strong>
        <ActionButton onClick={addRow}>+ Dodaj aktivnost</ActionButton>
      </div>
      {rows.length ? rows.map((row) => (
        <article className="organisations-inline-row is-vehicle-activity" key={row.id}>
          <SelectField label="Aktivnost" value={row.activityType || ""} options={typeOptions} onChange={(value) => update(row.id, { activityType: value })} />
          <TextField label="Datum" type="date" value={row.performedOn || ""} onChange={(value) => update(row.id, { performedOn: value })} />
          <TextField label="Izvršio" value={row.performedBy || ""} onChange={(value) => update(row.id, { performedBy: value })} />
          <TextField label="Km" value={row.odometerKm || ""} onChange={(value) => update(row.id, { odometerKm: value })} />
          <TextField label="Vrijedi do" type="date" value={row.validUntil || ""} onChange={(value) => update(row.id, { validUntil: value })} />
          <TextField label="Radovi" value={row.workSummary || ""} onChange={(value) => update(row.id, { workSummary: value })} />
          <TextField label="Napomena" value={row.note || ""} onChange={(value) => update(row.id, { note: value })} />
          <SmallIconButton label="Makni aktivnost" icon="X" danger onClick={() => removeRow(row.id)} />
        </article>
      )) : <p className="helper-copy module-copy">Dodaj servis, registraciju, gume ili drugu aktivnost.</p>}
    </div>
  );
}

function MeasurementEquipmentModule({
  filters = {},
  sortOptions = [],
  stats = {},
  items = [],
  canCreate = false,
  canEdit = false,
  hasCardTemplate = false,
  cardTemplateMeta = "",
  onCreate = noop,
  onFilterChange = noop,
  onOpen = noop,
  onExportExcel = noop,
  onExportZip = noop,
  onUploadTemplate = noop,
  onExportPlaceholders = noop,
  onExportWord = noop,
  onExportPdf = noop,
  onExportItem = noop,
}) {
  return (
    <div className="organisations-react-shell measurement-react-shell">
      <section className="panel organisations-hero-panel measurement-equipment-toolbar-panel">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Equipment</p>
            <h3>Mjerna i ispitna oprema</h3>
            <p className="helper-copy module-copy">Karton opreme, rokovi umjeravanja, dokumenti i povezanost s uslugama.</p>
          </div>
          {canCreate ? <button type="button" className="primary-button" onClick={onCreate}>+ Nova oprema</button> : null}
        </div>
        <div className="organisations-stat-grid">
          <StatCard label="Ukupno" value={stats.total} />
          <StatCard label="Umjerava se" value={stats.calibration} tone="is-info" />
          <StatCard label="Uskoro ističe" value={stats.expiring} tone="is-warning" />
          <StatCard label="S datotekama" value={stats.files} tone="is-success" />
        </div>
        <div className="organisations-template-strip">
          <div>
            <span className={cx("document-template-status-badge", hasCardTemplate ? "is-active" : "is-archived")}>
              {hasCardTemplate ? "Karton povezan" : "Nema kartona"}
            </span>
            <strong>Globalni template kartona opreme</strong>
            <p>{cardTemplateMeta || "Učitaj .docx/.dotx karton template pa koristi brzi izvoz."}</p>
          </div>
          <div className="organisations-template-actions">
            <SmallIconButton label="Upload templatea" icon="U" disabled={!canEdit} onClick={onUploadTemplate} />
            <SmallIconButton label="Preuzmi placeholdere" icon="PH" disabled={!canEdit} onClick={onExportPlaceholders} />
            <SmallIconButton label="Preuzmi Word" icon="W" disabled={!hasCardTemplate} onClick={onExportWord} />
            <SmallIconButton label="Preuzmi PDF" icon="P" disabled={!hasCardTemplate} onClick={onExportPdf} />
            <SmallIconButton label="Excel popis" icon="XLS" onClick={onExportExcel} />
            <SmallIconButton label="ZIP datoteke" icon="ZIP" onClick={onExportZip} />
          </div>
        </div>
      </section>

      <section className="panel measurement-equipment-list-panel organisations-list-panel">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Register</p>
            <h3>Popis opreme</h3>
          </div>
        </div>
        <div className="measurement-equipment-filters organisations-filter-bar">
          <Field label="Pretraga">
            <input
              type="search"
              value={filters.query || ""}
              placeholder="Ime, proizvođač, tip, serijski broj, inv. broj..."
              onChange={(event) => onFilterChange({ query: event.target.value })}
            />
          </Field>
          <SelectField label="Sortiraj" value={filters.sort || "due-asc"} options={sortOptions} onChange={(sort) => onFilterChange({ sort })} />
        </div>
        <div className="measurement-equipment-list organisations-card-list">
          {items.length ? items.map((item) => (
            <article
              className={cx("measurement-equipment-card measurement-equipment-card--emphasized organisations-card", item.kindClass, item.isActive && "is-active")}
              key={item.id}
              role={canEdit ? "button" : undefined}
              tabIndex={canEdit ? 0 : undefined}
              onClick={() => canEdit && onOpen(item.id)}
              onKeyDown={(event) => {
                if (!canEdit || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                onOpen(item.id);
              }}
            >
              <div className="measurement-equipment-card-head">
                <div className="measurement-equipment-card-copy">
                  <h4>{item.name || "Bez naziva"}</h4>
                  <p className="measurement-equipment-card-meta">{item.meta || "Bez dodatnih podataka"}</p>
                </div>
                <div className="measurement-equipment-card-badges">
                  <span className={item.calibrationBadgeClass}>{item.calibrationBadgeLabel}</span>
                  {canEdit ? (
                    <div className="measurement-equipment-card-actions" onClick={(event) => event.stopPropagation()}>
                      <SmallIconButton label="Word karton" icon="W" disabled={!hasCardTemplate} onClick={() => onExportItem(item.id, "word")} />
                      <SmallIconButton label="PDF karton" icon="P" disabled={!hasCardTemplate} onClick={() => onExportItem(item.id, "pdf")} />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="measurement-equipment-card-groups">
                <section className="measurement-equipment-card-group">
                  <p className="measurement-equipment-card-group-label">Umjernica</p>
                  <div className="measurement-equipment-card-chips">
                    <span className={item.dueClass}>{item.dueLabel}</span>
                  </div>
                </section>
                <section className="measurement-equipment-card-group">
                  <p className="measurement-equipment-card-group-label">Koristi se u uslugama</p>
                  <div className="measurement-equipment-card-chips">
                    {item.serviceTitles?.length ? item.serviceTitles.slice(0, 4).map((title) => (
                      <span className="service-catalog-template-badge" key={title}>{title}</span>
                    )) : <span className="service-catalog-template-badge is-muted">Bez usluga</span>}
                  </div>
                </section>
              </div>
            </article>
          )) : <EmptyCard>Nema opreme za odabrane filtere.</EmptyCard>}
        </div>
      </section>
    </div>
  );
}

function MeasurementEquipmentEditor({
  title = "Nova oprema",
  draft = {},
  kindOptions = [],
  deviceCodeOptions = [],
  serviceOptions = [],
  activityTypeOptions = [],
  documentCategories = [],
  canDelete = false,
  canSave = true,
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
    setLocalError("");
    try {
      const documents = await onUploadDocuments(files, localDraft);
      patch({ documents });
    } catch (uploadError) {
      setLocalError(uploadError?.message || "Upload nije uspio.");
    } finally {
      setBusy(false);
    }
  };

  const updateDocument = (documentId, documentPatch) => {
    patch({
      documents: asArray(localDraft.documents).map((document) => (
        String(document.id) === String(documentId) ? { ...document, ...documentPatch } : document
      )),
    });
  };

  const removeDocument = (documentId) => {
    patch({
      documents: asArray(localDraft.documents).filter((document) => String(document.id) !== String(documentId)),
    });
  };

  return (
    <div className="organisations-editor-react measurement-editor-react">
      <div className="offers-editor-fixed-head organisations-editor-head">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Measurement equipment</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>Zatvori</button>
        </div>
      </div>
      <form className="measurement-equipment-editor-body organisations-editor-body" onSubmit={save}>
        <div className="measurement-equipment-editor-layout organisations-editor-layout">
          <div className="organisations-editor-main">
            <section className="service-catalog-template-block organisations-editor-section">
              <div className="section-heading offers-section-heading">
                <div>
                  <p className="section-kicker">Osnovno</p>
                  <h3>Identifikacija uređaja</h3>
                </div>
              </div>
              <div className="form-grid measurement-equipment-form-grid">
                <TextField label="Ime opreme" value={localDraft.name} required className="field-span-full" placeholder="Mjerni instrument, uređaj..." onChange={(name) => patch({ name })} />
                <SelectField label="Vrsta" value={localDraft.equipmentKind || "combined"} options={kindOptions} onChange={(equipmentKind) => patch({ equipmentKind })} />
                <TextField label="Proizvođač" value={localDraft.manufacturer} placeholder="Fluke, Sonel..." onChange={(manufacturer) => patch({ manufacturer })} />
                <TextField label="Tip / model" value={localDraft.deviceType} placeholder="Model, tip, serija..." onChange={(deviceType) => patch({ deviceType })} />
                <SelectField label="Oznaka uređaja" value={localDraft.deviceCode || ""} options={deviceCodeOptions} onChange={(deviceCode) => patch({ deviceCode })} />
                <TextField label="Serijski broj" value={localDraft.serialNumber} onChange={(serialNumber) => patch({ serialNumber })} />
                <TextField label="Inv. broj" value={localDraft.inventoryNumber} onChange={(inventoryNumber) => patch({ inventoryNumber })} />
                <TextField label="Mjernu opremu unio" value={localDraft.enteredBy} onChange={(enteredBy) => patch({ enteredBy })} />
                <TextField label="Odobrio" value={localDraft.approvedBy} onChange={(approvedBy) => patch({ approvedBy })} />
                <TextField label="Datum unosa" type="date" value={localDraft.entryDate} onChange={(entryDate) => patch({ entryDate })} />
              </div>
            </section>

            <section className="service-catalog-template-block organisations-editor-section">
              <div className="section-heading offers-section-heading">
                <div>
                  <p className="section-kicker">Umjeravanje</p>
                  <h3>Rokovi i status umjernice</h3>
                </div>
              </div>
              <div className="form-grid measurement-equipment-form-grid">
                <SelectField
                  label="Umjerava se"
                  value={localDraft.requiresCalibration ? "true" : "false"}
                  options={[{ value: "true", label: "Da" }, { value: "false", label: "Ne" }]}
                  onChange={(value) => patch({ requiresCalibration: value === "true" })}
                />
                {localDraft.requiresCalibration ? (
                  <>
                    <TextField label="Datum umjeravanja" type="date" value={localDraft.calibrationDate} onChange={(calibrationDate) => patch({ calibrationDate })} />
                    <TextField label="Periodika" value={localDraft.calibrationPeriod} placeholder="12 mjeseci" onChange={(calibrationPeriod) => patch({ calibrationPeriod })} />
                    <TextField label="Vrijedi do" type="date" value={localDraft.validUntil} onChange={(validUntil) => patch({ validUntil })} />
                  </>
                ) : null}
              </div>
            </section>

            <section className="service-catalog-template-block organisations-editor-section">
              <div className="section-heading offers-section-heading">
                <div>
                  <p className="section-kicker">Mjerenje</p>
                  <h3>Mjerne veličine / raspon / opaska</h3>
                </div>
              </div>
              <MeasurementSpecsEditor rows={asArray(localDraft.measurementSpecs)} onChange={(measurementSpecs) => patch({ measurementSpecs })} />
            </section>

            <section className="service-catalog-template-block organisations-editor-section">
              <div className="section-heading offers-section-heading">
                <div>
                  <p className="section-kicker">List Of Services</p>
                  <h3>Koristi se u uslugama</h3>
                </div>
              </div>
              <ServiceChecklist options={serviceOptions} selectedIds={localDraft.linkedServiceCatalogIds || []} onChange={(linkedServiceCatalogIds) => patch({ linkedServiceCatalogIds })} />
            </section>

            <section className="service-catalog-template-block organisations-editor-section">
              <MeasurementActivityEditor
                rows={asArray(localDraft.activityItems)}
                typeOptions={activityTypeOptions}
                onChange={(activityItems) => patch({ activityItems })}
              />
            </section>

            <section className="service-catalog-template-block organisations-editor-section">
              <div className="section-heading offers-section-heading">
                <div>
                  <p className="section-kicker">Documents</p>
                  <h3>Datoteke uređaja</h3>
                </div>
                <div className="document-template-reference-actions">
                  <input ref={fileRef} type="file" multiple hidden onChange={upload} />
                  <button type="button" className="ghost-button" disabled={busy} onClick={() => fileRef.current?.click()}>
                    Dodaj datoteke
                  </button>
                </div>
              </div>
              <DocumentList
                documents={asArray(localDraft.documents)}
                categories={documentCategories}
                onUpdate={updateDocument}
                onRemove={removeDocument}
                onDownload={onDownloadDocument}
              />
            </section>

            <TextAreaField label="Napomena" value={localDraft.note} rows={4} className="field-span-full" placeholder="Interna napomena, stanje uređaja, lokacija, posebnosti..." onChange={(note) => patch({ note })} />

            {(localError || error) ? <p className="form-error" aria-live="polite">{localError || error}</p> : null}

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={!canSave || busy}>{busy ? "Spremam..." : "Spremi opremu"}</button>
              <button type="button" className="ghost-button" disabled={busy} onClick={onReset}>Nova oprema</button>
              {canDelete ? <button type="button" className="card-button card-danger" disabled={busy} onClick={() => onDelete(localDraft.id)}>Obriši</button> : null}
            </div>
          </div>

          <aside className="measurement-equipment-side-activity-panel organisations-side-panel">
            <div className="measurement-equipment-side-activity-head">
              <div>
                <p className="section-kicker">Activity</p>
                <h3>Povijest opreme</h3>
              </div>
              <span className="work-order-activity-count">{asArray(localDraft.activityItems).length}</span>
            </div>
            <p className="helper-copy module-copy">Sažeti pregled aktivnosti ostaje uz editor, bez gubljenja konteksta.</p>
            <div className="work-order-activity-list">
              {asArray(localDraft.activityItems).length ? asArray(localDraft.activityItems).slice(0, 8).map((item) => (
                <article className="work-order-activity-item" key={item.id}>
                  <strong>{item.activityType || "Aktivnost"}</strong>
                  <span>{[item.performedOn, item.performedBy, item.validUntil ? `vrijedi do ${item.validUntil}` : ""].filter(Boolean).join(" · ")}</span>
                </article>
              )) : <p className="work-order-activity-empty">Nema aktivnosti za prikaz.</p>}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

function VehiclesModule({
  filters = {},
  statusFilterOptions = [],
  statusOptions = [],
  stats = {},
  items = [],
  scheduleDate = "",
  canCreate = false,
  canReserve = false,
  canManage = false,
  onCreate = noop,
  onReserve = noop,
  onFilterChange = noop,
  onScheduleDateChange = noop,
  onOpen = noop,
  onStatusChange = noop,
}) {
  return (
    <div className="organisations-react-shell vehicles-react-shell">
      <section className="panel organisations-hero-panel vehicles-list-panel">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Fleet</p>
            <h3>Automobili i rezervacije</h3>
            <p className="helper-copy module-copy">Vozila, statusi, dokumenti, servisni rokovi i rezervacije na jednom mjestu.</p>
          </div>
          <div className="vehicles-panel-head-actions">
            {canReserve ? <button type="button" className="ghost-button" onClick={() => onReserve("")}>+ Rezervacija</button> : null}
            {canCreate ? <button type="button" className="primary-button" onClick={onCreate}>+ Novo vozilo</button> : null}
          </div>
        </div>
        <div className="organisations-stat-grid">
          <StatCard label="Ukupno" value={stats.total} />
          <StatCard label="Dostupno" value={stats.available} tone="is-success" />
          <StatCard label="Rezervirano" value={stats.reserved} tone="is-info" />
          <StatCard label="Servis" value={stats.service} tone="is-warning" />
        </div>
        <div className="vehicles-inline-toolbar organisations-filter-bar">
          <Field label="Pretraga">
            <input
              type="search"
              value={filters.query || ""}
              placeholder="Naziv, registracija, šasija, marka, vozač..."
              onChange={(event) => onFilterChange({ query: event.target.value })}
            />
          </Field>
          <SelectField label="Dostupnost" value={filters.status || "all"} options={statusFilterOptions} onChange={(status) => onFilterChange({ status })} />
        </div>
      </section>

      <section className="panel organisations-list-panel vehicle-schedule-panel">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Raspored</p>
            <h3>Satni raspored vozila</h3>
          </div>
          <div className="vehicle-schedule-toolbar">
            <ActionButton onClick={() => onScheduleDateChange("prev")}>Prethodni</ActionButton>
            <ActionButton onClick={() => onScheduleDateChange("today")}>Danas</ActionButton>
            <input className="vehicle-schedule-date-input" type="date" value={scheduleDate} onChange={(event) => onScheduleDateChange(event.target.value)} />
            <ActionButton onClick={() => onScheduleDateChange("next")}>Sljedeći</ActionButton>
          </div>
        </div>
        <div className="vehicles-list vehicles-list-full organisations-card-list">
          {items.length ? items.map((vehicle) => (
            <article
              className={cx("vehicle-list-row organisations-card", vehicle.toneClass, vehicle.isActive && "is-active")}
              key={vehicle.id}
              role={canManage ? "button" : undefined}
              tabIndex={canManage ? 0 : undefined}
              onClick={() => canManage && onOpen(vehicle.id)}
              onKeyDown={(event) => {
                if (!canManage || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                onOpen(vehicle.id);
              }}
            >
              <div className="vehicle-list-row-main">
                <span className={cx("vehicle-status-badge", vehicle.toneClass)}>{vehicle.availabilityLabel}</span>
                <div className="vehicle-list-row-copy">
                  <h4 className="vehicle-list-row-title">{vehicle.name || "Vozilo"}</h4>
                  <span className="vehicle-list-row-meta">{vehicle.meta}</span>
                  <p className="vehicle-list-row-detail">{vehicle.detail}</p>
                  <div className="vehicle-reservation-chip-row">
                    {vehicle.reservationChips?.length ? vehicle.reservationChips.map((chip) => (
                      <button type="button" key={chip.id} className={cx("vehicle-reservation-mini-chip", chip.toneClass)} onClick={(event) => { event.stopPropagation(); onReserve(vehicle.id, chip.id); }}>
                        <strong>{chip.title}</strong>
                        <span>{chip.window}</span>
                      </button>
                    )) : <span className="service-catalog-template-badge is-muted">Bez rezervacija</span>}
                  </div>
                </div>
                {canManage ? (
                  <select
                    className="vehicle-inline-status-select"
                    value={vehicle.editableStatus}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      event.stopPropagation();
                      onStatusChange(vehicle.id, event.target.value);
                    }}
                  >
                    {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : null}
                <div className="vehicle-card-actions" onClick={(event) => event.stopPropagation()}>
                  {canReserve ? (
                    <button type="button" className="ghost-button" disabled={vehicle.isServiceOnly} onClick={() => onReserve(vehicle.id)}>
                      {vehicle.isServiceOnly ? "Servis" : "Rezerviraj"}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          )) : <EmptyCard>Nema vozila za odabrane filtere.</EmptyCard>}
        </div>
      </section>
    </div>
  );
}

function VehicleEditor({
  title = "Novo vozilo",
  draft = {},
  statusOptions = [],
  activityTypeOptions = [],
  documentCategories = [],
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

  const updateDocument = (documentId, documentPatch) => {
    patch({
      documents: asArray(localDraft.documents).map((document) => (
        String(document.id) === String(documentId) ? { ...document, ...documentPatch } : document
      )),
    });
  };

  const removeDocument = (documentId) => patch({
    documents: asArray(localDraft.documents).filter((document) => String(document.id) !== String(documentId)),
  });

  return (
    <div className="organisations-editor-react vehicle-editor-react">
      <div className="vehicles-editor-fixed-head organisations-editor-head">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Vehicle editor</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>Zatvori</button>
        </div>
      </div>
      <form className="vehicle-modal-body organisations-editor-body" onSubmit={save}>
        <section className="service-catalog-template-block organisations-editor-section">
          <div className="form-grid vehicles-form-grid">
            <TextField label="Naziv vozila" value={localDraft.name} required placeholder="Servisni kombi 1" onChange={(name) => patch({ name })} />
            <TextField label="Registracija" value={localDraft.plateNumber} required placeholder="ZG 1234 AB" onChange={(plateNumber) => patch({ plateNumber })} />
            <TextField label="Broj šasije" value={localDraft.vinNumber} placeholder="VF1JL000123456789" onChange={(vinNumber) => patch({ vinNumber })} />
            <SelectField label="Status" value={localDraft.status || "available"} options={statusOptions} onChange={(status) => patch({ status })} />
            <TextField label="Kategorija" value={localDraft.category} placeholder="Kombi, auto, pickup..." onChange={(category) => patch({ category })} />
            <TextField label="Marka" value={localDraft.make} placeholder="Renault" onChange={(make) => patch({ make })} />
            <TextField label="Model" value={localDraft.model} placeholder="Trafic" onChange={(model) => patch({ model })} />
            <TextField label="Godina" value={localDraft.year} placeholder="2022" onChange={(year) => patch({ year })} />
            <TextField label="Boja" value={localDraft.color} placeholder="Bijela" onChange={(color) => patch({ color })} />
            <TextField label="Gorivo" value={localDraft.fuelType} placeholder="Dizel, benzin, EV..." onChange={(fuelType) => patch({ fuelType })} />
            <TextField label="Mjenjač" value={localDraft.transmission} placeholder="Manualni, automatik" onChange={(transmission) => patch({ transmission })} />
            <TextField label="Broj sjedala" value={localDraft.seatCount} placeholder="3" onChange={(seatCount) => patch({ seatCount })} />
            <TextField label="Kilometraža" value={localDraft.odometerKm} placeholder="142000" onChange={(odometerKm) => patch({ odometerKm })} />
            <TextField label="Servis do" type="date" value={localDraft.serviceDueDate} onChange={(serviceDueDate) => patch({ serviceDueDate })} />
            <TextField label="Registracija do" type="date" value={localDraft.registrationExpiresOn} onChange={(registrationExpiresOn) => patch({ registrationExpiresOn })} />
          </div>
        </section>

        <section className="service-catalog-template-block organisations-editor-section">
          <VehicleActivityEditor
            rows={asArray(localDraft.activityItems)}
            typeOptions={activityTypeOptions}
            onChange={(activityItems) => patch({ activityItems })}
          />
        </section>

        <section className="service-catalog-template-block organisations-editor-section">
          <div className="section-heading offers-section-heading">
            <div>
              <p className="section-kicker">Documents</p>
              <h3>Dokumenti vozila</h3>
            </div>
            <div className="document-template-reference-actions">
              <input ref={fileRef} type="file" multiple hidden onChange={upload} />
              <button type="button" className="ghost-button" disabled={busy} onClick={() => fileRef.current?.click()}>
                Dodaj datoteke
              </button>
            </div>
          </div>
          <DocumentList
            documents={asArray(localDraft.documents)}
            categories={documentCategories}
            onUpdate={updateDocument}
            onRemove={removeDocument}
            onDownload={onDownloadDocument}
          />
        </section>

        <TextAreaField label="Napomena" value={localDraft.notes} rows={3} className="field-span-full" placeholder="Oprema, zaduženja, stanje vozila..." onChange={(notes) => patch({ notes })} />

        {(localError || error) ? <p className="form-error" aria-live="polite">{localError || error}</p> : null}

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={busy}>{busy ? "Spremam..." : "Spremi vozilo"}</button>
          <button type="button" className="ghost-button" disabled={busy} onClick={onReset}>Novo vozilo</button>
          {canDelete ? <button type="button" className="card-button card-danger" disabled={busy} onClick={() => onDelete(localDraft.id)}>Obriši</button> : null}
        </div>
      </form>
    </div>
  );
}

function VehicleReservationEditor({
  title = "Rezervacija vozila",
  draft = {},
  vehicleOptions = [],
  statusOptions = [],
  userOptions = [],
  reservations = [],
  error = "",
  onDraftChange = noop,
  onSave = noop,
  onReset = noop,
  onClose = noop,
  onEditReservation = noop,
  onDeleteReservation = noop,
}) {
  const [localDraft, setLocalDraft] = React.useState(draft);
  const [busy, setBusy] = React.useState(false);
  const [localError, setLocalError] = React.useState("");

  React.useEffect(() => {
    setLocalDraft(draft);
    setLocalError("");
  }, [draft.versionKey]);

  const patch = (nextPatch) => {
    const next = { ...localDraft, ...nextPatch };
    setLocalDraft(next);
    onDraftChange(next);
  };

  const toggleUser = (userId) => {
    const selected = new Set(asArray(localDraft.reservedForUserIds).map(String));
    if (selected.has(String(userId))) selected.delete(String(userId));
    else selected.add(String(userId));
    patch({ reservedForUserIds: [...selected] });
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

  const selectedUsers = new Set(asArray(localDraft.reservedForUserIds).map(String));

  return (
    <div className="organisations-editor-react vehicle-reservation-react">
      <div className="vehicles-editor-fixed-head organisations-editor-head">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Reservations</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>Zatvori</button>
        </div>
      </div>
      <div className="vehicle-modal-body organisations-editor-body">
        <form className="entity-form vehicles-reservation-form" onSubmit={save}>
          <div className="form-grid vehicles-form-grid">
            <SelectField label="Vozilo" value={localDraft.vehicleId || ""} options={vehicleOptions} disabled={Boolean(localDraft.id)} onChange={(vehicleId) => patch({ vehicleId })} />
            <SelectField label="Status" value={localDraft.status || "reserved"} options={statusOptions} onChange={(status) => patch({ status })} />
            <Field label="Izvršitelji" className="field-span-full">
              <div className="organisations-user-check-grid">
                {userOptions.map((user) => (
                  <label className="service-catalog-template-option" key={user.value}>
                    <input type="checkbox" checked={selectedUsers.has(String(user.value))} onChange={() => toggleUser(user.value)} />
                    <div className="service-catalog-template-option-copy">
                      <strong>{user.label}</strong>
                      {user.meta ? <span>{user.meta}</span> : null}
                    </div>
                  </label>
                ))}
              </div>
            </Field>
            <TextField label="Svrha" value={localDraft.purpose} required className="field-span-full" placeholder="Intervencija, teren, obilazak..." onChange={(purpose) => patch({ purpose })} />
            <TextField label="Polazak" type="datetime-local" value={localDraft.startAt} onChange={(startAt) => patch({ startAt })} />
            <TextField label="Povratak" type="datetime-local" value={localDraft.endAt} onChange={(endAt) => patch({ endAt })} />
            <TextField label="Destinacija" value={localDraft.destination} className="field-span-full" placeholder="Grad, lokacija ili ruta" onChange={(destination) => patch({ destination })} />
          </div>
          <TextAreaField label="Napomena" value={localDraft.note} rows={2} className="field-span-full" placeholder="Ključevi, oprema, dodatne upute..." onChange={(note) => patch({ note })} />
          {(localError || error) ? <p className="form-error" aria-live="polite">{localError || error}</p> : null}
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={busy}>{busy ? "Spremam..." : "Spremi rezervaciju"}</button>
            <button type="button" className="ghost-button" disabled={busy} onClick={onReset}>Nova rezervacija</button>
          </div>
        </form>

        <section className="vehicles-reservations-panel organisations-editor-section">
          <div className="section-heading offers-section-heading">
            <div>
              <p className="section-kicker">Pregled</p>
              <h3>Rezervacije odabranog vozila</h3>
            </div>
          </div>
          <div className="vehicle-reservations-list">
            {reservations.length ? reservations.map((reservation) => (
              <article className={cx("vehicle-reservation-item", reservation.toneClass, reservation.isActive && "is-active")} key={reservation.id}>
                <div className="vehicle-reservation-item-head">
                  <div className="vehicle-reservation-item-copy">
                    <strong>{reservation.purpose || "Rezervacija"}</strong>
                    <span>{reservation.meta}</span>
                  </div>
                  <span className={cx("vehicle-status-badge", reservation.toneClass)}>{reservation.statusLabel}</span>
                </div>
                <p className="vehicle-reservation-item-window">{reservation.window}</p>
                <div className="vehicle-card-actions">
                  <ActionButton onClick={() => onEditReservation(reservation.id)}>Uredi</ActionButton>
                  <ActionButton variant="ghost-button card-danger" onClick={() => onDeleteReservation(reservation.id)}>Obriši</ActionButton>
                </div>
              </article>
            )) : <p className="helper-copy module-copy">Odaberi vozilo za pregled rezervacija.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function mount(container, component, className) {
  if (!container) return false;
  let root = roots.get(container);
  if (!root) {
    root = createRoot(container);
    roots.set(container, root);
  }
  if (className) container.classList.add(className);
  root.render(component);
  return true;
}

function unmount(container, className) {
  const root = container ? roots.get(container) : null;
  if (!root) return;
  root.unmount();
  roots.delete(container);
  if (className) container.classList.remove(className);
}

window.SafeNexusReactComponents = {
  ...(window.SafeNexusReactComponents ?? {}),
  renderMeasurementEquipmentModule: (container, props = {}) => mount(container, <MeasurementEquipmentModule {...props} />, "is-react"),
  unmountMeasurementEquipmentModule: (container) => unmount(container, "is-react"),
  renderMeasurementEquipmentEditor: (container, props = {}) => mount(container, <MeasurementEquipmentEditor {...props} />, "is-react"),
  unmountMeasurementEquipmentEditor: (container) => unmount(container, "is-react"),
  renderVehiclesModule: (container, props = {}) => mount(container, <VehiclesModule {...props} />, "is-react"),
  unmountVehiclesModule: (container) => unmount(container, "is-react"),
  renderVehicleEditor: (container, props = {}) => mount(container, <VehicleEditor {...props} />, "is-react"),
  unmountVehicleEditor: (container) => unmount(container, "is-react"),
  renderVehicleReservationEditor: (container, props = {}) => mount(container, <VehicleReservationEditor {...props} />, "is-react"),
  unmountVehicleReservationEditor: (container) => unmount(container, "is-react"),
};
