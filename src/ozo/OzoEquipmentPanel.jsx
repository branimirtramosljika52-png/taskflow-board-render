import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OzoCategorySidebar } from "./OzoCategorySidebar.jsx";
import { OzoEquipmentCard } from "./OzoEquipmentCard.jsx";
import { OzoFilterChips } from "./OzoFilterChips.jsx";
import { OzoWorkerPreview } from "./OzoWorkerPreview.jsx";

const normalizeSearch = (value = "") => String(value || "")
  .normalize("NFD")
  .replace(/[\u0111\u0110]/g, "d")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

export function OzoEquipmentPanel({
  jobIndex = 0,
  catalog = [],
  filters = [],
  counts = {},
  selectedIds = [],
  selectedItems = [],
  selectedBodyParts = [],
  activeFilter: initialFilter = "all",
  searchValue = "",
  newDraft = {},
  newFormOpen = false,
  sourceUrl = "",
  workerImageUrl = "/assets/ozo/ozo-worker-duo-v1.png",
  imageFallbacks = {},
  iconFallbacks = {},
}) {
  const [activeFilter, setActiveFilter] = useState(initialFilter || "all");
  const [search, setSearch] = useState(searchValue || "");
  const [draft, setDraft] = useState({
    name: newDraft.name || "",
    norm: newDraft.norm || "",
    category: newDraft.category || "",
    bodyPart: newDraft.bodyPart || "other",
    standardCode: newDraft.standardCode || "",
    imageUrl: newDraft.imageUrl || "",
    description: newDraft.description || "",
  });
  const selectedSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);
  const normalizedSearch = normalizeSearch(search);
  const visibleCatalog = useMemo(() => catalog.filter((item) => {
    const matchesFilter = activeFilter === "all" || item.bodyPart === activeFilter;
    const text = item.searchText || normalizeSearch([
      item.name,
      item.category,
      item.norm,
      item.standardCode,
      item.description,
      item.sourceRef,
    ].join(" "));
    return matchesFilter && (!normalizedSearch || text.includes(normalizedSearch));
  }), [activeFilter, catalog, normalizedSearch]);

  const handleDraftChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <section className="ozo-module bg-slate-50 text-gray-900" data-risk-ppe-panel={jobIndex}>
      <header className="ozo-module-header">
        <div>
          <span>Osobna zaštitna oprema</span>
          <h3>Profesionalni OZO odabir za radno mjesto</h3>
        </div>
        <div className="ozo-module-stats">
          <strong>{selectedItems.length}</strong>
          <span>odabrano</span>
        </div>
      </header>

      <OzoFilterChips
        filters={filters}
        counts={counts}
        activeFilter={activeFilter}
        search={search}
        onFilterChange={setActiveFilter}
        onSearchChange={setSearch}
      />

      <AnimatePresence initial={false}>
        {newFormOpen && (
          <motion.div
            className="ozo-new-form"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.24 }}
          >
            <label><span>Naziv</span><input data-risk-ppe-new-field="name" value={draft.name} onChange={(event) => handleDraftChange("name", event.target.value)} placeholder="npr. Štitnik za koljena" /></label>
            <label><span>Norma</span><input data-risk-ppe-new-field="norm" value={draft.norm} onChange={(event) => handleDraftChange("norm", event.target.value)} placeholder="npr. HRN EN 14404" /></label>
            <label><span>Kategorija</span><input data-risk-ppe-new-field="category" value={draft.category} onChange={(event) => handleDraftChange("category", event.target.value)} placeholder="npr. Zaštita nogu" /></label>
            <label>
              <span>Dio tijela</span>
              <select data-risk-ppe-new-field="bodyPart" value={draft.bodyPart} onChange={(event) => handleDraftChange("bodyPart", event.target.value)}>
                {filters.filter((filter) => filter.value !== "all").map((filter) => (
                  <option value={filter.value} key={filter.value}>{filter.label}</option>
                ))}
              </select>
            </label>
            <label><span>EN norma</span><input data-risk-ppe-new-field="standardCode" value={draft.standardCode} onChange={(event) => handleDraftChange("standardCode", event.target.value)} placeholder="npr. EN 14404" /></label>
            <label><span>URL slike</span><input data-risk-ppe-new-field="imageUrl" value={draft.imageUrl} onChange={(event) => handleDraftChange("imageUrl", event.target.value)} placeholder="https://..." /></label>
            <label className="is-wide"><span>Opis primjene</span><textarea data-risk-ppe-new-field="description" rows="2" value={draft.description} onChange={(event) => handleDraftChange("description", event.target.value)} /></label>
            <div className="ozo-new-actions">
              <span>Nova stavka se sprema u bazu i odmah dodaje na radno mjesto.</span>
              <button type="button" data-risk-ppe-new-save>Spremi OZO</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ozo-layout">
        <OzoWorkerPreview
          workerImageUrl={workerImageUrl}
          selectedItems={selectedItems}
          selectedBodyParts={selectedBodyParts}
        />
        <OzoCategorySidebar
          filters={filters}
          counts={counts}
          selectedItems={selectedItems}
          sourceUrl={sourceUrl}
          newFormOpen={newFormOpen}
        />
        <section className="ozo-equipment-panel">
          <div className="ozo-list-head">
            <div>
              <span data-risk-ppe-match-count>{visibleCatalog.length}</span>
              <small>prikazanih stavki</small>
            </div>
            <strong>OZO katalog</strong>
          </div>
          <div className="ozo-card-grid">
            <AnimatePresence mode="popLayout">
              {visibleCatalog.map((item, index) => (
                <OzoEquipmentCard
                  key={item.id}
                  item={item}
                  index={index}
                  isSelected={selectedSet.has(String(item.id))}
                  iconUrl={item.iconUrl || iconFallbacks[item.bodyPart] || iconFallbacks.other}
                  imageUrl={item.imageUrl || imageFallbacks[item.bodyPart] || imageFallbacks.other}
                />
              ))}
            </AnimatePresence>
          </div>
          <p className="inline-help risk-assessment-ppe-empty" hidden={visibleCatalog.length > 0}>Nema OZO stavki za odabrani filter ili pretragu.</p>
        </section>
      </div>

      <section className="ozo-selected-editor">
        {selectedItems.length ? selectedItems.map((ppe, ppeIndex) => (
          <div className="ozo-selected-row" key={`${ppe.catalogId || ppe.id || ppe.name}-${ppeIndex}`}>
            <label><span>Naziv</span><input data-risk-ppe-index={ppeIndex} data-risk-ppe-field="name" defaultValue={ppe.name || ""} /></label>
            <label><span>Kategorija</span><input data-risk-ppe-index={ppeIndex} data-risk-ppe-field="category" defaultValue={ppe.category || ""} /></label>
            <label><span>Dio tijela</span><input data-risk-ppe-index={ppeIndex} data-risk-ppe-field="bodyPart" defaultValue={ppe.bodyPart || ""} /></label>
            <label><span>Norma</span><input data-risk-ppe-index={ppeIndex} data-risk-ppe-field="norm" defaultValue={ppe.norm || ""} /></label>
            <label className="is-wide"><span>Opis primjene</span><textarea data-risk-ppe-index={ppeIndex} data-risk-ppe-field="description" rows="2" defaultValue={ppe.description || ""} /></label>
            <label><span>Za koje opasnosti</span><input data-risk-ppe-index={ppeIndex} data-risk-ppe-field="hazardLinks" defaultValue={ppe.hazardLinks || ""} /></label>
            <label className="ozo-checkline"><input type="checkbox" data-risk-ppe-index={ppeIndex} data-risk-ppe-field="required" defaultChecked={ppe.required !== false} /><span>Obvezna</span></label>
            <label><span>Napomena</span><input data-risk-ppe-index={ppeIndex} data-risk-ppe-field="note" defaultValue={ppe.note || ""} /></label>
          </div>
        )) : (
          <p className="inline-help">Odabrana oprema prikazat će se ovdje i na worker previewu.</p>
        )}
      </section>
    </section>
  );
}
