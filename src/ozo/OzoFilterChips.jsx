import React from "react";
import { motion } from "framer-motion";

export function OzoFilterChips({
  filters = [],
  counts = {},
  activeFilter = "all",
  search = "",
  onFilterChange,
  onSearchChange,
}) {
  return (
    <div className="ozo-filter-bar">
      <label className="ozo-search">
        <span>Pretraga OZO</span>
        <input
          data-risk-ppe-search
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Kaciga, rukavice, HRN EN 397..."
        />
      </label>
      <div className="ozo-filter-chips" aria-label="OZO kategorije">
        {filters.map((filter, index) => {
          const isActive = activeFilter === filter.value;
          return (
            <motion.button
              type="button"
              className={isActive ? "is-active" : ""}
              data-risk-ppe-filter={filter.value}
              key={filter.value}
              onClick={() => onFilterChange?.(filter.value)}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025, duration: 0.2 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{filter.label}</span>
              <small>{counts[filter.value] || 0}</small>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
