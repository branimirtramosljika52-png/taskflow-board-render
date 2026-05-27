import React from "react";
import { motion } from "framer-motion";

export function OzoEquipmentCard({
  item,
  iconUrl,
  imageUrl,
  isSelected = false,
  index = 0,
}) {
  const meta = [item.category, item.norm].filter(Boolean).join(" · ");

  return (
    <motion.label
      className={`ozo-equipment-card group bg-white${isSelected ? " is-selected" : ""}`}
      data-risk-ppe-option-card
      data-risk-ppe-option-body-part={item.bodyPart || "other"}
      data-risk-ppe-option-search={item.searchText || ""}
      title={[item.name, item.norm, item.category].filter(Boolean).join(" · ")}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ delay: Math.min(index, 18) * 0.025, duration: 0.28, ease: "easeOut" }}
      whileHover={{ y: -4 }}
    >
      <input
        type="checkbox"
        data-risk-ppe-toggle={item.id}
        defaultChecked={isSelected}
        aria-label={isSelected ? `Ukloni ${item.name}` : `Odaberi ${item.name}`}
      />
      <span className="ozo-card-media">
        <img src={imageUrl} alt="" loading="lazy" />
        <span className="ozo-card-icon" aria-hidden="true">
          <img src={iconUrl} alt="" loading="lazy" />
        </span>
      </span>
      <span className="ozo-card-copy">
        <span className="ozo-card-kicker">{item.category || "OZO"}</span>
        <strong>{item.name}</strong>
        <small>{meta || "Norma nije upisana"}</small>
        <em>{item.description || "Primjena se definira prema procjeni rizika i radnom mjestu."}</em>
      </span>
      <span className="ozo-card-footer">
        <span className="ozo-status is-ready">Aktivno</span>
        <span className="ozo-select-pill">{isSelected ? "Odabrano" : "Odaberi"}</span>
      </span>
    </motion.label>
  );
}
