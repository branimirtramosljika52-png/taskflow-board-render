import React from "react";
import { motion } from "framer-motion";

export function OzoCategorySidebar({
  filters = [],
  counts = {},
  selectedItems = [],
  sourceUrl = "",
  newFormOpen = false,
}) {
  return (
    <aside className="ozo-category-sidebar">
      <div className="ozo-sidebar-head">
        <span>Katalog</span>
        <strong>{counts.all || 0}</strong>
      </div>
      <div className="ozo-category-stack">
        {filters.filter((filter) => filter.value !== "all").map((filter, index) => (
          <motion.div
            className="ozo-category-metric"
            key={filter.value}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.025, duration: 0.2 }}
          >
            <span>{filter.label}</span>
            <strong>{counts[filter.value] || 0}</strong>
          </motion.div>
        ))}
      </div>
      <div className="ozo-selected-box">
        <span>Odabrano</span>
        <strong>{selectedItems.length}</strong>
        <div>
          {selectedItems.length ? selectedItems.slice(0, 6).map((item, index) => (
            <small key={`${item.catalogId || item.id || item.name}-${index}`}>{item.name}</small>
          )) : <small>OZO će se prikazati nakon odabira.</small>}
        </div>
      </div>
      <div className="ozo-sidebar-actions">
        <a href={sourceUrl} target="_blank" rel="noreferrer">Narodne novine 110/2009</a>
        <button type="button" data-risk-ppe-new-toggle>
          {newFormOpen ? "Zatvori unos" : "+ Nova OZO"}
        </button>
      </div>
    </aside>
  );
}
