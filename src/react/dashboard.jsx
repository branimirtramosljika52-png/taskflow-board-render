import React from "react";
import { createRoot } from "react-dom/client";

const roots = new WeakMap();
const noop = () => {};
const chartColors = ["#2563eb", "#ec4899", "#059669", "#f59e0b", "#7c3aed", "#ef4444", "#0891b2", "#64748b"];

function cx(...items) {
  return items.filter(Boolean).join(" ");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value = "") {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const normalized = raw.includes("T") ? raw : `${raw}T12:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  return date.toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getCardStyle(widget) {
  return {
    gridColumn: `${Math.max(1, Number(widget.gridColumn || 1))} / span ${Math.max(3, Number(widget.gridWidth || 4))}`,
    gridRow: `${Math.max(1, Number(widget.gridRow || 1))} / span ${Math.max(2, Number(widget.gridHeight || 3))}`,
  };
}

function StatTile({ label, value, meta, tone = "" }) {
  return (
    <article className={cx("dashboard-react-stat", tone)}>
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
      {meta ? <small>{meta}</small> : null}
    </article>
  );
}

function EmptyState({ onAdd = noop, onSeed = noop, seeding = false, canCreate = true }) {
  return (
    <section className="dashboard-react-empty">
      <div>
        <p className="section-kicker">Dashboard</p>
        <h3>Prva kartica ceka svoje mjesto.</h3>
        <p className="helper-copy">Dodaj KPI, bar chart ili listu, ili ucitaj starter layout za brzi operativni pregled.</p>
      </div>
      <div className="dashboard-react-empty-actions">
        <button type="button" className="primary-button" disabled={!canCreate} onClick={onAdd}>+ Add card</button>
        <button type="button" className="ghost-button" disabled={seeding} onClick={onSeed}>
          {seeding ? "Slazem..." : "Starter layout"}
        </button>
      </div>
    </section>
  );
}

function Chip({ label, tone = "soft" }) {
  return <span className={cx("dashboard-widget-chip", `is-${tone}`)}>{label}</span>;
}

function MetricBody({ data }) {
  return (
    <div className="dashboard-react-metric">
      <strong>{data.value ?? 0}</strong>
      <span>{data.subtitle || "Zapisa nakon filtra"}</span>
    </div>
  );
}

function DonutBody({ data }) {
  const items = asArray(data.items);
  const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);
  if (!total) {
    return <div className="dashboard-react-no-data">{data.emptyMessage || "Nema podataka za prikaz."}</div>;
  }
  let offset = 0;
  const background = items.map((item, index) => {
    const value = (Number(item.count || 0) / total) * 100;
    const start = offset;
    offset += value;
    return `${chartColors[index % chartColors.length]} ${start}% ${offset}%`;
  }).join(", ");

  return (
    <div className="dashboard-react-donut-shell">
      <div className="dashboard-donut-chart dashboard-react-donut" style={{ background: `conic-gradient(${background})` }}>
        <span className="dashboard-donut-center">
          <strong>{total}</strong>
          <span>Zapisa</span>
        </span>
      </div>
      <div className="dashboard-widget-legend dashboard-react-legend">
        {items.map((item, index) => (
          <div className="dashboard-widget-legend-row" key={`${item.label}:${index}`}>
            <span className="dashboard-widget-legend-copy">
              <i className="dashboard-widget-legend-dot" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
              <strong>{item.label}</strong>
            </span>
            <span>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarBody({ data }) {
  const items = asArray(data.items);
  const maxValue = Math.max(...items.map((item) => Number(item.count || 0)), 1);
  if (!items.length) {
    return <div className="dashboard-react-no-data">{data.emptyMessage || "Nema podataka za prikaz."}</div>;
  }
  return (
    <div className="dashboard-react-bar-chart">
      {items.map((item, index) => {
        const count = Number(item.count || 0);
        const height = count > 0 ? `${Math.max(12, Math.round((count / maxValue) * 100))}%` : "0%";
        return (
          <div className="dashboard-react-bar-column" key={`${item.label}:${index}`}>
            <span className="dashboard-bar-value">{count}</span>
            <div className="dashboard-react-bar-track">
              <span style={{ height, backgroundColor: chartColors[index % chartColors.length] }} />
            </div>
            <span className="dashboard-bar-label" title={item.label}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ListBody({ data, onOpenWorkOrder = noop }) {
  const items = asArray(data.items);
  if (!items.length) {
    return <div className="dashboard-react-no-data">{data.emptyMessage || "Nema stavki za zadane filtre."}</div>;
  }
  return (
    <div className="dashboard-widget-list dashboard-react-list">
      {items.map((item, index) => {
        if (item.type === "status_count") {
          return (
            <div className="dashboard-widget-status-count" key={`${item.title}:${index}`}>
              <span className="dashboard-widget-list-copy">
                <strong>{item.title || "Status"}</strong>
                <span>{item.meta || "0% od ukupno"}</span>
              </span>
              <span className="dashboard-widget-status-value">
                <strong>{item.count ?? 0}</strong>
                <span>RN</span>
              </span>
            </div>
          );
        }
        if (item.type === "group") {
          const visibleCount = Number(item.visibleCount ?? item.count ?? 0);
          const totalCount = Number(item.count ?? visibleCount);
          return (
            <div className="dashboard-widget-list-group" key={`${item.title}:${index}`}>
              <strong>{item.title || "Status"}</strong>
              <span>{visibleCount === totalCount ? `${totalCount} RN` : `${visibleCount} od ${totalCount} RN`}</span>
            </div>
          );
        }
        const Tag = item.workOrderId ? "button" : "div";
        return (
          <Tag
            type={item.workOrderId ? "button" : undefined}
            className="dashboard-widget-list-row"
            key={`${item.title}:${index}`}
            onClick={item.workOrderId ? () => onOpenWorkOrder(item.workOrderId) : undefined}
          >
            <span className="dashboard-widget-list-copy">
              <strong>{item.title || "Bez naziva"}</strong>
              <span>{item.subtitle || "Bez detalja"}</span>
            </span>
            <span className="dashboard-widget-list-meta">
              {item.status ? <Chip label={item.status} tone="soft" /> : null}
              {item.meta ? <span className="dashboard-widget-list-date">{formatDate(item.meta)}</span> : null}
            </span>
          </Tag>
        );
      })}
    </div>
  );
}

function WidgetBody({ widget, onOpenWorkOrder = noop }) {
  const data = widget.data || {};
  if (data.kind === "metric") {
    return <MetricBody data={data} />;
  }
  if (data.kind === "donut") {
    return <DonutBody data={data} />;
  }
  if (data.kind === "bar") {
    return <BarBody data={data} />;
  }
  return <ListBody data={data} onOpenWorkOrder={onOpenWorkOrder} />;
}

function WidgetCard({ widget, onEdit = noop, onMove = noop, onResize = noop, onOpenWorkOrder = noop }) {
  const width = Math.max(3, Number(widget.gridWidth || 4));
  const height = Math.max(2, Number(widget.gridHeight || 3));
  return (
    <article className={cx("dashboard-widget-card", "dashboard-react-widget-card", `size-${widget.size || "medium"}`)} style={getCardStyle(widget)}>
      <div className="dashboard-widget-head">
        <div className="dashboard-widget-head-copy">
          <span className="dashboard-widget-kicker">{widget.data?.sourceLabel || "Dashboard"} - {widget.data?.optionLabel || "Pregled"}</span>
          <h3>{widget.title || widget.data?.title || "Dashboard kartica"}</h3>
        </div>
        <div className="dashboard-widget-actions">
          <Chip label={`${width} x ${height}`} tone="soft" />
          <button type="button" className="card-button card-button-light dashboard-widget-action" aria-label="Pomakni lijevo" onClick={() => onMove(widget.id, -1, 0)}>L</button>
          <button type="button" className="card-button card-button-light dashboard-widget-action" aria-label="Pomakni gore" onClick={() => onMove(widget.id, 0, -1)}>G</button>
          <button type="button" className="card-button card-button-light dashboard-widget-action" onClick={() => onEdit(widget.id)}>Edit</button>
        </div>
      </div>
      <div className="dashboard-widget-body">
        <WidgetBody widget={widget} onOpenWorkOrder={onOpenWorkOrder} />
      </div>
      <div className="dashboard-widget-footer">
        <Chip label={widget.sizeLabel || widget.size || "Widget"} tone="soft" />
        {asArray(widget.chips).map((chip, index) => <Chip key={`${chip.label}:${index}`} label={chip.label} tone={chip.tone || "filter"} />)}
      </div>
      <div className="dashboard-react-resize-controls" aria-label="Velicina kartice">
        <button type="button" aria-label="Smanji sirinu" onClick={() => onResize(widget.id, -1, 0)}>-W</button>
        <button type="button" aria-label="Povecaj sirinu" onClick={() => onResize(widget.id, 1, 0)}>+W</button>
        <button type="button" aria-label="Smanji visinu" onClick={() => onResize(widget.id, 0, -1)}>-H</button>
        <button type="button" aria-label="Povecaj visinu" onClick={() => onResize(widget.id, 0, 1)}>+H</button>
      </div>
    </article>
  );
}

function DashboardOverview({
  model = {},
  onAdd = noop,
  onSeed = noop,
  onEdit = noop,
  onMove = noop,
  onResize = noop,
  onOpenWorkOrder = noop,
}) {
  const stats = model.stats || {};
  const widgets = asArray(model.widgets);
  const statusItems = asArray(stats.statusBreakdown).slice(0, 5);
  const statusTotal = statusItems.reduce((sum, item) => sum + Number(item.count || 0), 0);
  return (
    <section className="dashboard-react-shell">
      <div className="dashboard-react-hero">
        <div className="dashboard-react-hero-copy">
          <p className="section-kicker">Home</p>
          <h2>Dashboard</h2>
          <p className="helper-copy">
            Operativni pregled RN-ova, rokova, lokacija i zadataka. Kartice mozes slagati po statusima,
            regijama, izvrsiteljima i prioritetima.
          </p>
          <div className="dashboard-react-hero-actions">
            <button type="button" className="primary-button" disabled={!model.canCreate} onClick={onAdd}>+ Add card</button>
            <button type="button" className="ghost-button" disabled={model.seeding || widgets.length > 0} onClick={onSeed}>
              {model.seeding ? "Slazem..." : "Starter layout"}
            </button>
          </div>
        </div>
        <div className="dashboard-react-status-panel" aria-label="Statusi radnih naloga">
          <span className="dashboard-react-status-title">Status RN</span>
          {statusItems.length ? statusItems.map((item, index) => {
            const percent = statusTotal > 0 ? Math.max(4, Math.round((Number(item.count || 0) / statusTotal) * 100)) : 0;
            return (
              <div className="dashboard-react-status-row" key={`${item.label}:${index}`}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
                <i style={{ "--dash-color": chartColors[index % chartColors.length], "--dash-width": `${percent}%` }} />
              </div>
            );
          }) : <p className="helper-copy">Nema statusa za prikaz.</p>}
        </div>
      </div>

      <div className="dashboard-react-stat-grid">
        <StatTile label="Aktivni RN" value={stats.activeWorkOrders} meta={`${stats.completedWorkOrders ?? 0} zatvorenih`} tone="is-blue" />
        <StatTile label="Hitno" value={stats.urgentWorkOrders} meta="Urgent prioritet" tone="is-pink" />
        <StatTile label="Rok 7 dana" value={stats.dueThisWeekWorkOrders} meta="Sljedeci rokovi" tone="is-amber" />
        <StatTile label="Lokacije" value={stats.locations} meta={`${stats.missingCoordinatesLocations ?? 0} bez koordinata`} tone="is-green" />
      </div>

      {widgets.length ? (
        <div className="dashboard-react-grid">
          {widgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onEdit={onEdit}
              onMove={onMove}
              onResize={onResize}
              onOpenWorkOrder={onOpenWorkOrder}
            />
          ))}
        </div>
      ) : (
        <EmptyState onAdd={onAdd} onSeed={onSeed} seeding={model.seeding} canCreate={model.canCreate} />
      )}
    </section>
  );
}

function renderDashboardOverview(rootElement, props = {}) {
  if (!rootElement) {
    return false;
  }
  let root = roots.get(rootElement);
  if (!root) {
    root = createRoot(rootElement);
    roots.set(rootElement, root);
  }
  rootElement.classList.add("is-react");
  root.render(<DashboardOverview {...props} />);
  return true;
}

function unmountDashboardOverview(rootElement) {
  const root = rootElement ? roots.get(rootElement) : null;
  if (!root) {
    return;
  }
  root.unmount();
  roots.delete(rootElement);
  rootElement.classList.remove("is-react");
}

window.SafeNexusReactComponents = {
  ...(window.SafeNexusReactComponents ?? {}),
  renderDashboardOverview,
  unmountDashboardOverview,
};
