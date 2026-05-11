import React from "react";
import { createRoot } from "react-dom/client";

const mountedRoots = new WeakMap();
const mountedTabRoots = new WeakMap();
const mountedAbsenceRoots = new WeakMap();
const mountedAbsenceReportRoots = new WeakMap();

const PEOPLE_TABS = [
  {
    value: "users",
    id: "people-tab-users",
    className: "is-users",
    label: "Korisnici",
    copy: "Role, pristupi i dokumenti",
    controls: "people-users-panel",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    value: "annual-leave",
    id: "people-tab-annual-leave",
    className: "is-annual-leave",
    label: "GO i dopusti",
    copy: "Zahtjevi, saldo i odobrenja",
    controls: "absence-module",
    icon: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="4" />
        <path d="M3 10h18" />
        <path d="m9 16 2 2 4-5" />
      </>
    ),
  },
  {
    value: "sick-leave",
    id: "people-tab-sick-leave",
    className: "is-sick-leave",
    label: "Bolovanja",
    copy: "Medicinski izostanci i dokumenti",
    controls: "absence-module",
    icon: (
      <>
        <path d="M11 2h2" />
        <path d="M12 2v7" />
        <path d="M7 9h10l4 10a2 2 0 0 1-1.86 3H4.86A2 2 0 0 1 3 19Z" />
        <path d="M8 14h8" />
        <path d="M12 10v8" />
      </>
    ),
  },
  {
    value: "absence-report",
    id: "people-tab-absence-report",
    className: "is-absence-report",
    label: "Mjesečni report",
    copy: "Rad, odsutnosti i CSV izvoz",
    controls: "absence-report-module",
    icon: (
      <>
        <path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <path d="M14 3v5h5" />
        <path d="M8 14h8" />
        <path d="M8 17h5" />
      </>
    ),
  },
];

function PeopleAvatar({ row }) {
  const hasImage = Boolean(row.avatarDataUrl);

  return (
    <span className={`people-list-avatar${hasImage ? " has-image" : ""}`}>
      {hasImage ? (
        <img src={row.avatarDataUrl} alt={row.name || row.email || "User"} />
      ) : row.initials}
    </span>
  );
}

function ListLine({ children, className }) {
  if (!children) {
    return null;
  }

  return <span className={className}>{children}</span>;
}

function StackCell({ title, subtitle }) {
  return (
    <td>
      <div className="list-cell">
        <ListLine className="list-primary">{title}</ListLine>
        <ListLine className="list-secondary">{subtitle}</ListLine>
      </div>
    </td>
  );
}

function StatusCell({ isActive }) {
  const statusLabel = isActive ? "Aktivno" : "Neaktivno";
  const statusClassName = isActive ? "is-success" : "is-muted";

  return (
    <td>
      <div className="list-cell list-cell-tight">
        <span className={`list-meta-pill ${statusClassName}`}>{statusLabel}</span>
      </div>
    </td>
  );
}

function PeopleRow({ row, onEditUser }) {
  const handleOpen = (event) => {
    if (!row.canEdit || event.target.closest("button, a, input, select, textarea")) {
      return;
    }

    onEditUser(row.id);
  };

  const handleKeyDown = (event) => {
    if (!row.canEdit || event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onEditUser(row.id);
    }
  };

  return (
    <tr
      className={`list-row react-people-row${row.canEdit ? " is-clickable" : ""}`}
      tabIndex={row.canEdit ? 0 : undefined}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <td>
        <div className="people-list-cell">
          <PeopleAvatar row={row} />
          <div className="people-list-copy">
            <ListLine className="list-primary">{row.name}</ListLine>
            <ListLine className="list-secondary">{row.email || "Bez emaila"}</ListLine>
            <ListLine className="list-tertiary">{row.oib ? `OIB ${row.oib}` : "OIB nije upisan"}</ListLine>
          </div>
        </div>
      </td>
      <StackCell title={row.organizationSummary} />
      <StackCell title={row.roleTitle} subtitle={row.roleSubtitle} />
      <StatusCell isActive={row.isActive} />
    </tr>
  );
}

function PeopleDirectory({ rows = [], onEditUser = () => {} }) {
  if (!rows.length) {
    return (
      <tr className="list-row react-people-row is-empty">
        <td colSpan={4}>
          <div className="react-people-empty">Nema korisnika za prikaz.</div>
        </td>
      </tr>
    );
  }

  return rows.map((row) => (
    <PeopleRow key={row.id} row={row} onEditUser={onEditUser} />
  ));
}

function PeopleWorkspaceTabs({
  activeTab = "users",
  stats = {},
  onSelectTab = () => {},
}) {
  return PEOPLE_TABS.map((tab) => {
    const isActive = tab.value === activeTab;
    const stat = stats[tab.value] ?? {};

    return (
      <button
        key={tab.value}
        id={tab.id}
        type="button"
        className={`tab-button people-workspace-tab ${tab.className}${isActive ? " is-active" : ""}`}
        data-people-workspace-tab={tab.value}
        role="tab"
        aria-controls={tab.controls}
        aria-selected={isActive ? "true" : "false"}
        tabIndex={isActive ? 0 : -1}
        onClick={() => onSelectTab(tab.value)}
      >
        <span className="people-workspace-tab-icon" aria-hidden="true">
          <svg className="icon-svg" viewBox="0 0 24 24">{tab.icon}</svg>
        </span>
        <span className="people-workspace-tab-content">
          <span className="people-workspace-tab-title-row">
            <strong>{tab.label}</strong>
            {stat.value ? <span className="people-workspace-tab-stat">{stat.value}</span> : null}
          </span>
          <span className="people-workspace-tab-copy">{stat.copy || tab.copy}</span>
        </span>
      </button>
    );
  });
}

function Badge({ label, className = "service-catalog-template-badge" }) {
  if (!label) {
    return null;
  }

  return <span className={className}>{label}</span>;
}

function AbsenceSummaryCard({ label, value }) {
  return (
    <article className="absence-summary-card react-absence-summary-card">
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
    </article>
  );
}

function AbsencePersonCard({
  person,
  canManage = false,
  mode = "request",
  onOpenUser = () => {},
  onSaveBalance = () => {},
}) {
  const [draftValue, setDraftValue] = React.useState(String(person.balanceValue ?? 0));

  React.useEffect(() => {
    setDraftValue(String(person.balanceValue ?? 0));
  }, [person.id, person.balanceValue]);

  const saveDraft = () => {
    if (!canManage || String(draftValue) === String(person.balanceValue ?? 0)) {
      return;
    }
    onSaveBalance(person.id, person.fieldKey, draftValue);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
      saveDraft();
    }
  };

  return (
    <article className="absence-person-card react-absence-person-card">
      <div className="absence-person-identity">
        <span className="people-list-avatar absence-person-avatar">{person.initials}</span>
        <div className="absence-person-copy">
          <strong>{person.name}</strong>
          <span>{person.meta}</span>
        </div>
      </div>

      <div className="absence-person-stats">
        {person.stats.map((stat) => (
          <span className="absence-person-stat" key={`${person.id}-${stat.label}`}>
            <small>{stat.label}</small>
            <strong>{Number(stat.value || 0)}</strong>
          </span>
        ))}
      </div>

      <div className="absence-person-controls">
        <label className="field absence-person-days-field">
          <span>{mode === "medical" ? "Dani bolovanja" : "Godišnji dani"}</span>
          <input
            type="number"
            min="0"
            max="365"
            inputMode="numeric"
            value={draftValue}
            disabled={!canManage}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={saveDraft}
            onKeyDown={handleKeyDown}
          />
        </label>
        <button
          type="button"
          className="ghost-button absence-person-action"
          onClick={() => onOpenUser(person.id)}
        >
          {mode === "medical" ? "+ Bolovanje" : "+ GO"}
        </button>
      </div>
    </article>
  );
}

function AbsenceEntryCard({
  entry,
  onOpenEntry = () => {},
  onApprove = () => {},
  onReject = () => {},
  onDownloadDocument = () => {},
}) {
  const handleOpen = (event) => {
    if (!entry.canOpen || event.target.closest("button, a, input, select, textarea")) {
      return;
    }
    onOpenEntry(entry.id);
  };

  const handleKeyDown = (event) => {
    if (!entry.canOpen || event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenEntry(entry.id);
    }
  };

  return (
    <article
      className={`safety-authorization-card absence-card react-absence-card${entry.isActive ? " is-active" : ""}`}
      role={entry.canOpen ? "button" : undefined}
      tabIndex={entry.canOpen ? 0 : undefined}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <div className="safety-authorization-card-head">
        <div className="safety-authorization-card-copy">
          <h4>{entry.userLabel || "Korisnik"}</h4>
          <p className="safety-authorization-card-meta">{entry.dateLabel}</p>
        </div>
        <div className="safety-authorization-card-chips">
          <Badge label={entry.typeLabel} className="measurement-equipment-chip" />
          <Badge label={entry.statusLabel} className={entry.statusClassName} />
        </div>
      </div>

      <p className="safety-authorization-card-note">{entry.note || "Bez dodatne napomene."}</p>

      <div className="safety-authorization-card-footer">
        <div className="safety-authorization-card-chips">
          <Badge label={entry.requestedLabel} />
          {entry.approvedLabel ? <Badge label={entry.approvedLabel} /> : null}
          <Badge
            label={entry.documentCount > 0 ? `${entry.documentCount} dok.` : "Bez dokumenata"}
            className={`service-catalog-template-badge${entry.documentCount > 0 ? "" : " is-muted"}`}
          />
        </div>

        {entry.canApproveReject ? (
          <div className="absence-card-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onApprove(entry.id);
              }}
            >
              Odobri
            </button>
            <button
              type="button"
              className="ghost-button card-danger"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onReject(entry.id);
              }}
            >
              Odbij
            </button>
          </div>
        ) : null}

        {entry.documents?.length ? (
          <div className="safety-authorization-card-actions">
            {entry.documents.map((documentItem) => (
              <button
                key={documentItem.id}
                type="button"
                className="icon-action-button safety-authorization-card-download-button"
                title={`Preuzmi ${documentItem.fileName || "dokument"}`}
                aria-label={`Preuzmi ${documentItem.fileName || "dokument"}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDownloadDocument(entry.id, documentItem.id);
                }}
              >
                ↓
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function AbsenceModule({
  mode = "request",
  config = {},
  filters = {},
  summary = {},
  helperText = "",
  peopleTitle = "",
  peopleCopy = "",
  peopleFeedback = "",
  people = [],
  userOptions = [],
  statusOptions = [],
  typeOptions = [],
  entries = [],
  emptyText = "",
  canManage = false,
  onFilterChange = () => {},
  onOpenCreate = () => {},
  onOpenBalances = () => {},
  onOpenUser = () => {},
  onSaveBalance = () => {},
  onOpenEntry = () => {},
  onApprove = () => {},
  onReject = () => {},
  onDownloadDocument = () => {},
}) {
  const isMedical = mode === "medical";

  return (
    <div className={`react-absence-module ${isMedical ? "is-medical" : "is-request"}`}>
      <section className="panel absence-summary-panel react-absence-panel">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">{config.kicker}</p>
            <h3>{config.title}</h3>
          </div>
          <div className="vehicles-panel-head-actions">
            {canManage ? (
              <button type="button" className="ghost-button" onClick={onOpenBalances}>Saldo dana</button>
            ) : null}
            <button type="button" className="primary-button" onClick={onOpenCreate}>{config.createLabel}</button>
          </div>
        </div>
        <p className="helper-copy module-copy">{config.copy}</p>
        <div className="absence-summary-grid">
          <AbsenceSummaryCard label="Ukupno" value={summary.total} />
          <AbsenceSummaryCard label="Na čekanju" value={summary.pending} />
          <AbsenceSummaryCard label="Odobreno" value={summary.approved} />
          <AbsenceSummaryCard label="Saldo" value={summary.balance} />
        </div>
      </section>

      <section className="panel absence-people-panel react-absence-panel">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">People</p>
            <h3>{peopleTitle}</h3>
          </div>
          {peopleFeedback ? <p className="form-error absence-people-feedback">{peopleFeedback}</p> : null}
        </div>
        <p className="helper-copy module-copy">{peopleCopy}</p>
        <div className="absence-people-list">
          {people.length ? people.map((person) => (
            <AbsencePersonCard
              key={person.id}
              person={person}
              canManage={canManage}
              mode={mode}
              onOpenUser={onOpenUser}
              onSaveBalance={onSaveBalance}
            />
          )) : <div className="offers-empty-card">Nema aktivnih korisnika za prikaz salda.</div>}
        </div>
      </section>

      <section className="panel absence-list-panel react-absence-panel">
        <div className="absence-toolbar">
          <label className="field">
            <span>Pretraga</span>
            <input
              type="search"
              value={filters.query || ""}
              placeholder="Korisnik, vrsta odsutnosti, napomena..."
              onChange={(event) => onFilterChange({ query: event.target.value.trim() })}
            />
          </label>
          <label className="field">
            <span>Korisnik</span>
            <select
              value={filters.userId || "all"}
              onChange={(event) => onFilterChange({ userId: event.target.value || "all" })}
            >
              {userOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={filters.status || "all"}
              onChange={(event) => onFilterChange({ status: event.target.value || "all" })}
            >
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Vrsta</span>
            <select
              value={filters.type || "all"}
              onChange={(event) => onFilterChange({ type: event.target.value || "all" })}
            >
              {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        <p className="helper-copy module-copy">{helperText}</p>
        <div className="safety-authorization-list absence-list">
          {entries.length ? entries.map((entry) => (
            <AbsenceEntryCard
              key={entry.id}
              entry={entry}
              onOpenEntry={onOpenEntry}
              onApprove={onApprove}
              onReject={onReject}
              onDownloadDocument={onDownloadDocument}
            />
          )) : <div className="offers-empty-card">{emptyText}</div>}
        </div>
      </section>
    </div>
  );
}

function AbsenceReportModule({
  month = "",
  userId = "all",
  userOptions = [],
  exportLabel = "CSV sve",
  summaryText = "",
  rows = [],
  onMonthChange = () => {},
  onPrev = () => {},
  onToday = () => {},
  onNext = () => {},
  onUserChange = () => {},
  onExport = () => {},
  onExportRow = () => {},
}) {
  return (
    <div className="react-absence-report-module">
      <section className="panel absence-report-toolbar-panel react-absence-panel">
        <div className="section-heading offers-section-heading">
          <div>
            <p className="section-kicker">Report</p>
            <h3>Mjesečni pregled rada i odsutnosti</h3>
          </div>
          <div className="vehicle-schedule-toolbar">
            <button type="button" className="ghost-button calendar-nav-button" aria-label="Prethodni mjesec" onClick={onPrev}>←</button>
            <button type="button" className="ghost-button" onClick={onToday}>Tekući mjesec</button>
            <input
              type="month"
              className="vehicle-schedule-date-input"
              value={month}
              onChange={(event) => onMonthChange(event.target.value)}
            />
            <button type="button" className="ghost-button calendar-nav-button" aria-label="Sljedeći mjesec" onClick={onNext}>→</button>
            <label className="field absence-report-user-field">
              <span>Korisnik</span>
              <select value={userId || "all"} onChange={(event) => onUserChange(event.target.value || "all")}>
                {userOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <button type="button" className="primary-button" id="react-absence-report-export" onClick={onExport}>
              {exportLabel}
            </button>
          </div>
        </div>
        <p className="helper-copy module-copy">{summaryText}</p>
      </section>

      <section className="panel absence-report-list-panel react-absence-panel">
        <div className="absence-report-list">
          {rows.length ? rows.map((row) => (
            <article className="absence-report-card react-absence-report-card" key={row.userId}>
              <div className="absence-report-card-head">
                <div className="absence-report-card-copy">
                  <strong>{row.userLabel}</strong>
                  <span>{row.meta}</span>
                </div>
                <div className="absence-report-card-actions">
                  <button
                    type="button"
                    className="ghost-button absence-report-card-download"
                    title={`Preuzmi mjesečni report za ${row.userLabel}`}
                    onClick={() => onExportRow(row.userId)}
                  >
                    CSV
                  </button>
                </div>
              </div>
              <div className="absence-report-card-stats">
                {row.stats.map((stat) => (
                  <div className="absence-report-card-stat" key={`${row.userId}-${stat.label}`}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
              <div className="absence-report-card-breakdown">
                {row.breakdown.map((item) => (
                  <Badge key={`${row.userId}-${item.label}`} label={item.label} className={item.className} />
                ))}
              </div>
            </article>
          )) : <div className="offers-empty-card">Nema podataka za odabrani mjesec i filtere.</div>}
        </div>
      </section>
    </div>
  );
}

function renderPeopleDirectory(container, props = {}) {
  if (!container) {
    return false;
  }

  let root = mountedRoots.get(container);
  if (!root) {
    root = createRoot(container);
    mountedRoots.set(container, root);
  }

  root.render(<PeopleDirectory {...props} />);
  return true;
}

function unmountPeopleDirectory(container) {
  const root = container ? mountedRoots.get(container) : null;
  if (!root) {
    return;
  }

  root.unmount();
  mountedRoots.delete(container);
}

function renderPeopleWorkspaceTabs(container, props = {}) {
  if (!container) {
    return false;
  }

  let root = mountedTabRoots.get(container);
  if (!root) {
    root = createRoot(container);
    mountedTabRoots.set(container, root);
  }

  container.classList.add("is-react");
  root.render(<PeopleWorkspaceTabs {...props} />);
  return true;
}

function unmountPeopleWorkspaceTabs(container) {
  const root = container ? mountedTabRoots.get(container) : null;
  if (!root) {
    return;
  }

  root.unmount();
  mountedTabRoots.delete(container);
  container.classList.remove("is-react");
}

function renderAbsenceModule(container, props = {}) {
  if (!container) {
    return false;
  }

  let root = mountedAbsenceRoots.get(container);
  if (!root) {
    root = createRoot(container);
    mountedAbsenceRoots.set(container, root);
  }

  container.classList.add("is-react");
  root.render(<AbsenceModule {...props} />);
  return true;
}

function unmountAbsenceModule(container) {
  const root = container ? mountedAbsenceRoots.get(container) : null;
  if (!root) {
    return;
  }

  root.unmount();
  mountedAbsenceRoots.delete(container);
  container.classList.remove("is-react");
}

function renderAbsenceReportModule(container, props = {}) {
  if (!container) {
    return false;
  }

  let root = mountedAbsenceReportRoots.get(container);
  if (!root) {
    root = createRoot(container);
    mountedAbsenceReportRoots.set(container, root);
  }

  container.classList.add("is-react");
  root.render(<AbsenceReportModule {...props} />);
  return true;
}

function unmountAbsenceReportModule(container) {
  const root = container ? mountedAbsenceReportRoots.get(container) : null;
  if (!root) {
    return;
  }

  root.unmount();
  mountedAbsenceReportRoots.delete(container);
  container.classList.remove("is-react");
}

window.SafeNexusReactComponents = {
  ...(window.SafeNexusReactComponents ?? {}),
  renderPeopleDirectory,
  unmountPeopleDirectory,
  renderPeopleWorkspaceTabs,
  unmountPeopleWorkspaceTabs,
  renderAbsenceModule,
  unmountAbsenceModule,
  renderAbsenceReportModule,
  unmountAbsenceReportModule,
};
