import React from "react";
import { createRoot } from "react-dom/client";

const rootByElement = new WeakMap();

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

function StatusPill({ tone = "neutral", children }) {
  return (
    <span className={joinClassNames("ro-react-pill", tone && `is-${tone}`)}>
      <span aria-hidden="true" />
      {children}
    </span>
  );
}

function EquipmentHeader({ column, onToggleItem }) {
  return (
    <button
      type="button"
      className={joinClassNames(
        "ro-react-equipment",
        column.selected && "is-selected",
        column.tone && `is-${column.tone}`,
      )}
      onClick={() => onToggleItem?.(column.id)}
      disabled={!column.id}
    >
      <span className="ro-react-equipment-visual" aria-hidden="true">
        {column.initials || "RO"}
      </span>
      <span className="ro-react-equipment-copy">
        <strong>{column.title || "Radna oprema"}</strong>
        <small>{column.subtitle || "Bez dodatnih podataka"}</small>
        {column.meta ? <em>{column.meta}</em> : null}
      </span>
      <StatusPill tone={column.tone || "neutral"}>
        {column.status || (column.selected ? "Odabrano" : "RO")}
      </StatusPill>
    </button>
  );
}

function SummaryCell({ cell, onToggleItem }) {
  return (
    <button
      type="button"
      className={joinClassNames(
        "ro-react-summary-cell",
        cell.selected && "is-selected",
        cell.tone && `is-${cell.tone}`,
      )}
      onClick={() => onToggleItem?.(cell.itemId)}
      disabled={!cell.itemId}
    >
      <strong>{cell.value || "-"}</strong>
      <span>{cell.detail || ""}</span>
    </button>
  );
}

function DetailValue({ value }) {
  return (
    <div className={joinClassNames("ro-react-detail-value", value?.tone && `is-${value.tone}`)}>
      <strong>{value?.value || "-"}</strong>
      {value?.detail ? <small>{value.detail}</small> : null}
    </div>
  );
}

function SectionBlock({
  section,
  columnCount,
  onToggleSection,
  onToggleDetailRows,
  onToggleItem,
}) {
  return (
    <>
      <button
        type="button"
        className={joinClassNames("ro-react-section", !section.expanded && "is-collapsed")}
        onClick={() => onToggleSection?.(section.key)}
        aria-expanded={section.expanded ? "true" : "false"}
      >
        <span className="ro-react-section-icon" aria-hidden="true">
          {section.icon || "RO"}
        </span>
        <span>
          <strong>{section.title}</strong>
          <small>{section.subtitle}</small>
        </span>
        <em>{section.expanded ? "Otvoreno" : "Otvori"}</em>
      </button>

      {section.summaryCells.map((cell, index) => (
        <SummaryCell
          key={`${section.key}-${cell.itemId || index}`}
          cell={cell}
          onToggleItem={onToggleItem}
        />
      ))}

      {section.expanded && section.detailRows?.length ? (
        <div
          className={joinClassNames("ro-react-detail", `is-${section.key}`)}
          style={{ "--ro-react-columns": columnCount }}
        >
          <div className="ro-react-detail-row is-head">
            <strong>{section.detailHeader || "Polje"}</strong>
            {section.columnTitles.map((title, index) => (
              <span key={`${section.key}-head-${index}`}>{title}</span>
            ))}
          </div>

          {section.detailRows.map((row) => (
            <div className="ro-react-detail-row" key={`${section.key}-${row.id}`}>
              <span className="ro-react-detail-label">{row.label}</span>
              {row.values.map((value, index) => (
                <DetailValue key={`${section.key}-${row.id}-${index}`} value={value} />
              ))}
            </div>
          ))}

          {section.hasMore || section.showAll ? (
            <div className="ro-react-detail-more">
              <button type="button" className="ghost-button" onClick={() => onToggleDetailRows?.(section.key)}>
                {section.showAll ? "Prikazi manje" : `Prikazi sve ${section.totalDetailRows} stavki`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function WorkEquipmentRoPanel({
  model,
  onToggleItem,
  onToggleSection,
  onToggleDetailRows,
  onPreviousPage,
  onNextPage,
}) {
  const columnCount = Math.max(1, model?.columns?.length || 0);

  if (!model?.columns?.length) {
    return (
      <section className="ro-react-panel is-empty">
        <div className="ro-react-empty">
          <strong>Nema radne opreme za prikaz</strong>
          <span>Promijeni filter ili dodaj opremu kroz slike/PDF.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="ro-react-panel">
      <div className="ro-react-toolbar">
        <div>
          <strong>Radna oprema po kolonama</strong>
          <span>{model.from} - {model.to} od {model.total} opreme</span>
        </div>
        <div className="ro-react-nav">
          <button type="button" className="ghost-button" disabled={!model.canPrevious} onClick={onPreviousPage} aria-label="Prethodna oprema">
            &lt;
          </button>
          <button type="button" className="ghost-button" disabled={!model.canNext} onClick={onNextPage} aria-label="Sljedeca oprema">
            &gt;
          </button>
        </div>
      </div>

      <div className="ro-react-grid" style={{ "--ro-react-columns": columnCount }}>
        <div className="ro-react-section is-header">
          <span className="ro-react-section-icon" aria-hidden="true">RO</span>
          <span>
            <strong>Sekcija</strong>
            <small>RadnaOprema struktura</small>
          </span>
        </div>

        {model.columns.map((column) => (
          <EquipmentHeader key={column.id || column.index} column={column} onToggleItem={onToggleItem} />
        ))}

        {model.sections.map((section) => (
          <SectionBlock
            key={section.key}
            section={section}
            columnCount={columnCount}
            onToggleItem={onToggleItem}
            onToggleSection={onToggleSection}
            onToggleDetailRows={onToggleDetailRows}
          />
        ))}
      </div>
    </section>
  );
}

export function mountWorkEquipmentRoPanel(element, props) {
  if (!element) {
    return () => {};
  }
  let root = rootByElement.get(element);
  if (!root) {
    root = createRoot(element);
    rootByElement.set(element, root);
  }
  root.render(<WorkEquipmentRoPanel {...props} />);
  return () => {
    const current = rootByElement.get(element);
    if (current) {
      current.unmount();
      rootByElement.delete(element);
    }
  };
}

if (typeof window !== "undefined") {
  window.SafeNexusWorkEquipmentRoPanel = {
    mount: mountWorkEquipmentRoPanel,
  };
}
