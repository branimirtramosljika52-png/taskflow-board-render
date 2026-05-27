import React from "react";
import { motion } from "framer-motion";

export function OzoEquipmentCard({
  item,
  iconUrl,
  isSelected = false,
  index = 0,
}) {
  const norm = item.norm || item.standardCode || "Norma nije upisana";
  const category = item.category || "OZO";

  return (
    <motion.label
      className={`ozo-equipment-card is-compact bg-white${isSelected ? " is-selected" : ""}`}
      data-risk-ppe-option-card
      data-risk-ppe-option-body-part={item.bodyPart || "other"}
      data-risk-ppe-option-search={item.searchText || ""}
      title={[item.name, norm, category].filter(Boolean).join(" - ")}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ delay: Math.min(index, 24) * 0.012, duration: 0.22, ease: "easeOut" }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
    >
      <input
        type="checkbox"
        data-risk-ppe-toggle={item.id}
        defaultChecked={isSelected}
        aria-label={isSelected ? `Ukloni ${item.name}` : `Odaberi ${item.name}`}
      />
      <span className="ozo-card-icon" aria-hidden="true">
        <img src={iconUrl} alt="" loading="lazy" />
      </span>
      <span className="ozo-card-copy">
        <span className="ozo-card-kicker">{category}</span>
        <strong>{item.name}</strong>
        <small>{norm}</small>
      </span>
      <span className="ozo-select-pill" aria-hidden="true">
        {isSelected ? "Odabrano" : "Odaberi"}
      </span>
    </motion.label>
  );
}
