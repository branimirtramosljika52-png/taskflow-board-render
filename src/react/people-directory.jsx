import React from "react";
import { createRoot } from "react-dom/client";

const mountedRoots = new WeakMap();
const mountedTabRoots = new WeakMap();

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

window.SafeNexusReactComponents = {
  ...(window.SafeNexusReactComponents ?? {}),
  renderPeopleDirectory,
  unmountPeopleDirectory,
  renderPeopleWorkspaceTabs,
  unmountPeopleWorkspaceTabs,
};
