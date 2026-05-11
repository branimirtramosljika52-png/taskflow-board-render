import React, { useRef } from "react";
import { createRoot } from "react-dom/client";

const roots = new WeakMap();
const noop = () => {};

function cx(...items) {
  return items.filter(Boolean).join(" ");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mount(rootElement, element) {
  if (!rootElement) {
    return false;
  }
  let root = roots.get(rootElement);
  if (!root) {
    root = createRoot(rootElement);
    roots.set(rootElement, root);
  }
  root.render(element);
  return true;
}

function unmount(rootElement) {
  const root = rootElement ? roots.get(rootElement) : null;
  if (!root) {
    return false;
  }
  root.unmount();
  roots.delete(rootElement);
  return true;
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

function TextField({ label, value, onChange = noop, placeholder = "", className = "", required = false, disabled = false, type = "text" }) {
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

function TextAreaField({ label, value, onChange = noop, placeholder = "", rows = 4, className = "", disabled = false }) {
  return (
    <Field label={label} className={className}>
      <textarea
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
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

function ToggleField({ label, checked = false, onChange = noop, disabled = false }) {
  return (
    <label className="field core-toggle-field">
      <span>{label}</span>
      <span className={cx("operations-switch", checked && "is-on")}>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
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

function Badge({ children, tone = "" }) {
  return <span className={cx("core-badge", tone)}>{children}</span>;
}

function EmptyCard({ children }) {
  return <div className="offers-empty-card core-empty-card">{children}</div>;
}

function IconButton({ label, icon, onClick = noop, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      className={cx("organisations-icon-button", danger && "is-danger")}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}

function CategoryButton({ category, active = false, onSelect = noop }) {
  return (
    <button
      type="button"
      className={cx("core-category-card", category.toneClass, active && "is-active")}
      aria-current={active ? "page" : "false"}
      onClick={() => onSelect(category.id)}
    >
      <span className="core-category-icon" aria-hidden="true">{category.icon || "F"}</span>
      <strong>{category.label}</strong>
      <small>{category.documentCount ?? category.count ?? 0} dok.</small>
    </button>
  );
}

function DocumentsModule({
  model = {},
  loading = false,
  error = "",
  lastRefreshLabel = "",
  expandedFolderIds = [],
  onRefresh = noop,
  onSearch = noop,
  onKindChange = noop,
  onSelectCategory = noop,
  onToggleFolder = noop,
  onToggleAll = noop,
  onPreview = noop,
  onDownload = noop,
  onOpenSource = noop,
}) {
  const expanded = new Set(expandedFolderIds.map(String));
  const categories = [
    { id: "all", label: "Sve", documentCount: model.totals?.files ?? 0, toneClass: "is-all", icon: "#" },
    ...asArray(model.categories),
  ];
  const folders = asArray(model.visibleFolders);
  const allExpanded = folders.length > 0 && folders.every((folder) => expanded.has(String(folder.id)));

  return (
    <section className="core-shell documents-react-shell">
      <div className="core-hero-panel">
        <div>
          <p className="section-kicker">Documents</p>
          <h3>Centralni dokumenti</h3>
          <p className="helper-copy module-copy">{loading ? "Osvjezavam dokumente..." : lastRefreshLabel || "Dokumenti su spremni."}</p>
        </div>
        <div className="core-hero-actions">
          <button type="button" className="ghost-button" onClick={onToggleAll} disabled={!folders.length}>
            {allExpanded ? "Zatvori foldere" : "Otvori foldere"}
          </button>
          <button type="button" className="primary-button" onClick={onRefresh} disabled={loading}>
            {loading ? "Osvjezavam..." : "Osvjezi"}
          </button>
        </div>
      </div>

      <div className="operations-stat-grid core-stat-grid">
        <StatCard label="Kategorije" value={model.totals?.categories ?? 0} />
        <StatCard label="Folderi" value={model.totals?.folders ?? 0} />
        <StatCard label="Dokumenti" value={model.totals?.files ?? 0} tone="is-blue" />
        <StatCard label="PDF" value={model.totals?.pdfs ?? 0} tone="is-green" />
      </div>

      <div className="core-documents-layout">
        <aside className="core-side-panel">
          <p className="section-kicker">Mape</p>
          <h3>Kategorije</h3>
          <div className="core-category-list">
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                active={String(model.selectedCategory || "all") === String(category.id)}
                onSelect={onSelectCategory}
              />
            ))}
          </div>
        </aside>

        <section className="core-main-panel">
          <div className="core-filter-bar">
            <TextField label="Pretraga" value={model.query} placeholder="Dokument, folder, tvrtka, RN..." onChange={onSearch} />
            <SelectField
              label="Vrsta"
              value={model.fileKind || "all"}
              onChange={onKindChange}
              options={[
                { value: "all", label: "Sve" },
                { value: "pdf", label: "PDF" },
                { value: "word", label: "Word" },
                { value: "image", label: "Slike" },
                { value: "record", label: "Zapisnici" },
                { value: "other", label: "Ostalo" },
              ]}
            />
          </div>

          {error ? <EmptyCard>{error}</EmptyCard> : null}
          {!error && !folders.length ? <EmptyCard>{loading ? "Ucitavanje dokumenata..." : "Nema dokumenata za trenutni prikaz."}</EmptyCard> : null}

          <div className="core-folder-list">
            {folders.map((folder) => {
              const isExpanded = expanded.has(String(folder.id));
              return (
                <article key={folder.id} className={cx("core-folder-card", isExpanded && "is-expanded")}>
                  <button type="button" className="core-folder-head" onClick={() => onToggleFolder(folder.id)} aria-expanded={isExpanded}>
                    <span className="core-folder-mark">{isExpanded ? "v" : ">"}</span>
                    <span className="core-folder-icon" aria-hidden="true">F</span>
                    <span className="core-folder-copy">
                      <strong>{folder.label || "Folder"}</strong>
                      <small>{folder.subtitle || folder.categoryDefinition?.label || "Dokumenti"}</small>
                    </span>
                    <Badge tone="is-muted">{folder.visibleDocumentCount ?? 0} dok.</Badge>
                    <span className="core-folder-date">{folder.visibleLatestLabel || ""}</span>
                  </button>
                  {isExpanded ? (
                    <div className="core-file-list">
                      {asArray(folder.visibleDocuments).map((entry) => (
                        <article key={`${folder.id}:${entry.id || entry.label}`} className={cx("core-file-row", entry.signed && "is-signed")}>
                          <div className="core-file-copy">
                            <strong>{entry.label || entry.fileName || "Dokument"}</strong>
                            <span>{entry.description || "Dokument iz SafeNexus evidencije"}</span>
                            <small>{asArray(entry.metaParts).join(" | ")}</small>
                          </div>
                          <Badge tone={entry.signed ? "is-green" : "is-muted"}>{entry.signed ? "Potpisano" : entry.fileKindLabel || "Dok."}</Badge>
                          <span className="core-file-date">{entry.updatedLabel || ""}</span>
                          <div className="core-row-actions">
                            {entry.canPreview ? <IconButton label="Pregled" icon="Q" onClick={() => onPreview(entry)} /> : null}
                            {entry.canDownload ? <IconButton label="Preuzmi" icon="D" onClick={() => onDownload(entry)} /> : null}
                            {entry.sourceTarget ? <IconButton label="Izvor" icon="E" onClick={() => onOpenSource(entry.sourceTarget)} /> : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}

function SignaturesModule({
  loading = false,
  error = "",
  stats = {},
  entries = [],
  bridgeStatus = {},
  onRefresh = noop,
  onQueueLocalSigner = noop,
  onPairSigner = noop,
  onPreview = noop,
  onDownload = noop,
  onOpenSource = noop,
}) {
  return (
    <section className="core-shell signatures-react-shell">
      <div className="core-hero-panel is-signature">
        <div>
          <p className="section-kicker">Operations</p>
          <h3>Signatures</h3>
          <p className="helper-copy module-copy">Potpisni red za zapisnike, lokalni FINA/eOI bridge i status potpisanih dokumenata.</p>
        </div>
        <div className="core-hero-actions">
          <button type="button" className="ghost-button" onClick={onPairSigner}>Povezi signer</button>
          <button type="button" className="primary-button" onClick={onQueueLocalSigner} disabled={loading || !stats.pending}>
            Posalji u red
          </button>
          <button type="button" className="ghost-button" onClick={onRefresh} disabled={loading}>Osvjezi</button>
        </div>
      </div>

      <div className="operations-stat-grid core-stat-grid">
        <StatCard label="Ceka potpis" value={stats.pending ?? 0} tone={stats.pending ? "is-orange" : ""} />
        <StatCard label="Potpisano" value={stats.signed ?? 0} tone="is-green" />
        <StatCard label="Bez PDF-a" value={stats.missing ?? 0} tone={stats.missing ? "is-red" : ""} />
        <StatCard label="Ukupno" value={stats.total ?? 0} />
      </div>

      <section className="core-signer-card">
        <div>
          <p className="section-kicker">Certificirani potpis</p>
          <h3>SafeNexus Signer bridge</h3>
          <p>{bridgeStatus.message || "Lokalni signer moze preuzeti red, traziti PIN jednom i vratiti potpisane dokumente u Documents."}</p>
        </div>
        <Badge tone={bridgeStatus.tone ? `is-${bridgeStatus.tone}` : "is-muted"}>{bridgeStatus.tone || "ready"}</Badge>
      </section>

      {error ? <EmptyCard>{error}</EmptyCard> : null}
      {!error && !entries.length ? <EmptyCard>{loading ? "Ucitavam potpisni red..." : "Nema zapisnika u potpisnom redu."}</EmptyCard> : null}

      <div className="core-signature-list">
        {entries.map((item) => (
          <article key={item.id} className={cx("core-signature-row", item.signed ? "is-signed" : item.missing ? "is-missing" : "is-pending")}>
            <Badge tone={item.signed ? "is-green" : item.missing ? "is-red" : "is-orange"}>
              {item.statusLabel}
            </Badge>
            <div className="core-signature-copy">
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
              <small>{item.description}</small>
            </div>
            <div className="core-row-actions">
              {item.canPreview ? <IconButton label="Pregled" icon="Q" onClick={() => onPreview(item.entry)} /> : null}
              {item.canDownload ? <IconButton label="Preuzmi" icon="D" onClick={() => onDownload(item.entry)} /> : null}
              {item.sourceTarget ? <IconButton label="Izvor" icon="E" onClick={() => onOpenSource(item.sourceTarget)} /> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LegalFrameworkModule({
  filters = {},
  rows = [],
  stats = {},
  statusOptions = [],
  canEdit = false,
  onCreate = noop,
  onOpen = noop,
  onSearch = noop,
  onStatus = noop,
  onDownloadDocument = noop,
}) {
  return (
    <section className="core-shell legal-react-shell">
      <div className="core-hero-panel">
        <div>
          <p className="section-kicker">Registar</p>
          <h3>Zakoni, pravilnici i norme</h3>
          <p className="helper-copy module-copy">Premium pregled propisa, PDF dokumenata i veza na usluge koje ih koriste.</p>
        </div>
        {canEdit ? <button type="button" className="primary-button" onClick={onCreate}>+ Novi propis</button> : null}
      </div>

      <div className="operations-stat-grid core-stat-grid">
        <StatCard label="Ukupno" value={stats.total ?? 0} />
        <StatCard label="Aktivno" value={stats.active ?? 0} tone="is-green" />
        <StatCard label="S PDF-om" value={stats.withDocuments ?? 0} tone="is-blue" />
        <StatCard label="Povezano" value={stats.withServices ?? 0} />
      </div>

      <div className="core-filter-bar">
        <TextField label="Pretraga" value={filters.query || ""} placeholder="Naziv, usluga, dokument, napomena..." onChange={onSearch} />
        <SelectField label="Status" value={filters.status || "all"} options={statusOptions} onChange={onStatus} />
      </div>

      {!rows.length ? <EmptyCard>Nema propisa za odabrane filtere.</EmptyCard> : null}
      <div className="core-card-grid">
        {rows.map((item) => (
          <article
            key={item.id}
            className={cx("core-registry-card", item.statusClass, item.isActive && "is-active")}
            role={canEdit ? "button" : undefined}
            tabIndex={canEdit ? 0 : undefined}
            onClick={() => canEdit && onOpen(item.id)}
            onKeyDown={(event) => {
              if (!canEdit || (event.key !== "Enter" && event.key !== " ")) {
                return;
              }
              event.preventDefault();
              onOpen(item.id);
            }}
          >
            <div className="core-registry-head">
              <Badge tone={item.statusTone}>{item.statusLabel}</Badge>
              <span>{item.documentCountLabel}</span>
            </div>
            <h4>{item.title}</h4>
            <p>{item.note}</p>
            <div className="core-chip-row">
              {asArray(item.serviceBadges).map((badge) => <Badge key={badge.label} tone={badge.muted ? "is-muted" : ""}>{badge.label}</Badge>)}
            </div>
            <div className="core-row-actions">
              {asArray(item.documents).slice(0, 3).map((document) => (
                <IconButton
                  key={document.id || document.fileName}
                  label={`Preuzmi ${document.fileName || "PDF"}`}
                  icon="D"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDownloadDocument(document);
                  }}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LegalFrameworkEditor({
  draft = {},
  statusOptions = [],
  serviceOptions = [],
  canEdit = false,
  onChange = noop,
  onClose = noop,
  onSave = noop,
  onDelete = noop,
  onReset = noop,
  onUploadDocuments = noop,
  onDownloadDocument = noop,
  onRemoveDocument = noop,
}) {
  const fileInputRef = useRef(null);
  const selectedServices = new Set(asArray(draft.linkedServiceCatalogIds).map(String));

  const patch = (updates) => onChange({ ...draft, ...updates });
  const toggleService = (id) => {
    const next = new Set(selectedServices);
    if (next.has(String(id))) {
      next.delete(String(id));
    } else {
      next.add(String(id));
    }
    patch({ linkedServiceCatalogIds: Array.from(next) });
  };

  return (
    <section className="operations-editor-react core-editor-react">
      <div className="operations-editor-head">
        <div>
          <p className="section-kicker">Legal framework</p>
          <h3>{draft.id ? `Uredi propis | ${draft.title || "Bez naziva"}` : "Novi propis"}</h3>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>Zatvori</button>
      </div>

      <div className="operations-editor-grid">
        <TextField label="Naziv propisa" value={draft.title} required disabled={!canEdit} placeholder="Zakon o zastiti na radu..." className="field-span-full" onChange={(title) => patch({ title })} />
        <SelectField label="Status" value={draft.status || "active"} disabled={!canEdit} options={statusOptions} onChange={(status) => patch({ status })} />
        <TextField label="Kategorija" value={draft.category} disabled={!canEdit} placeholder="Zakon, pravilnik, norma..." onChange={(category) => patch({ category })} />
        <TextField label="Nadležno tijelo" value={draft.authority} disabled={!canEdit} placeholder="NN, Ministarstvo..." onChange={(authority) => patch({ authority })} />
        <TextField label="Oznaka / verzija" value={draft.referenceCode} disabled={!canEdit} placeholder="NN 71/14..." onChange={(referenceCode) => patch({ referenceCode })} />
        <TextField label="Pregled do" value={draft.reviewDate} disabled={!canEdit} type="date" onChange={(reviewDate) => patch({ reviewDate })} />
        <TextField label="Izvor URL" value={draft.sourceUrl} disabled={!canEdit} placeholder="https://..." onChange={(sourceUrl) => patch({ sourceUrl })} />
        <TextAreaField label="Napomena" value={draft.note} disabled={!canEdit} className="field-span-full" placeholder="Sažetak obveze, gdje se koristi, interne napomene..." onChange={(note) => patch({ note })} />
      </div>

      <section className="operations-editor-block">
        <div className="operations-editor-block-head">
          <div>
            <p className="section-kicker">Documents</p>
            <h3>PDF propisi i pravilnici</h3>
          </div>
          <div className="core-hero-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              hidden
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                onUploadDocuments(files);
                event.target.value = "";
              }}
            />
            <button type="button" className="ghost-button" disabled={!canEdit} onClick={() => fileInputRef.current?.click()}>Dodaj PDF</button>
          </div>
        </div>
        <div className="core-attachment-list">
          {!asArray(draft.documents).length ? <EmptyCard>Jos nema dodanih PDF dokumenata.</EmptyCard> : null}
          {asArray(draft.documents).map((document) => (
            <article key={document.id || document.fileName} className="core-attachment-row">
              <div>
                <strong>{document.fileName || "PDF dokument"}</strong>
                <span>{document.meta || document.fileSizeLabel || "PDF"}</span>
              </div>
              <div className="core-row-actions">
                <IconButton label="Preuzmi PDF" icon="D" onClick={() => onDownloadDocument(document)} />
                <IconButton label="Makni PDF" icon="X" danger disabled={!canEdit} onClick={() => onRemoveDocument(document.id)} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="operations-editor-block">
        <div className="operations-editor-block-head">
          <div>
            <p className="section-kicker">List Of Services</p>
            <h3>Koristi se u uslugama</h3>
          </div>
          <Badge tone="is-muted">{selectedServices.size} odabrano</Badge>
        </div>
        {!serviceOptions.length ? <p className="helper-copy module-copy">Prvo dodaj usluge u List Of Services pa ih ovdje povezi s propisom.</p> : null}
        <div className="operations-checklist-grid">
          {serviceOptions.map((option) => (
            <label key={option.value} className={cx("operations-check-option", selectedServices.has(String(option.value)) && "is-selected")}>
              <input type="checkbox" checked={selectedServices.has(String(option.value))} disabled={!canEdit} onChange={() => toggleService(option.value)} />
              <span>
                <strong>{option.label}</strong>
                <small>{option.meta}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="operations-editor-actions">
        <button type="button" className="primary-button" disabled={!canEdit} onClick={() => onSave(draft)}>Spremi propis</button>
        <button type="button" className="ghost-button" disabled={!canEdit} onClick={onReset}>Novi propis</button>
        {draft.id ? <button type="button" className="card-button card-danger" disabled={!canEdit} onClick={() => onDelete(draft.id)}>Obrisi</button> : null}
      </div>
    </section>
  );
}

window.SafeNexusReactComponents = {
  ...(window.SafeNexusReactComponents ?? {}),
  renderDocumentsModule(rootElement, props) {
    return mount(rootElement, <DocumentsModule {...props} />);
  },
  unmountDocumentsModule(rootElement) {
    return unmount(rootElement);
  },
  renderSignaturesModule(rootElement, props) {
    return mount(rootElement, <SignaturesModule {...props} />);
  },
  unmountSignaturesModule(rootElement) {
    return unmount(rootElement);
  },
  renderLegalFrameworkModule(rootElement, props) {
    return mount(rootElement, <LegalFrameworkModule {...props} />);
  },
  unmountLegalFrameworkModule(rootElement) {
    return unmount(rootElement);
  },
  renderLegalFrameworkEditor(rootElement, props) {
    return mount(rootElement, <LegalFrameworkEditor {...props} />);
  },
  unmountLegalFrameworkEditor(rootElement) {
    return unmount(rootElement);
  },
};
