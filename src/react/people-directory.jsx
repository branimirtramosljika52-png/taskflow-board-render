import React from "react";
import { createRoot } from "react-dom/client";

const mountedRoots = new WeakMap();

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

window.SafeNexusReactComponents = {
  ...(window.SafeNexusReactComponents ?? {}),
  renderPeopleDirectory,
  unmountPeopleDirectory,
};
