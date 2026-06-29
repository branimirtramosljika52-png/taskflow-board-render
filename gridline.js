(function () {
  var GLOBAL_NAME = "SafeNexusGridline";
  var DEFAULT_STORAGE_KEY = "safenexus-gridline-standalone-v1";
  var DEFAULT_ROWS = 80;
  var DEFAULT_COLUMNS = 14;
  var MIN_ROWS = 1;
  var MAX_ROWS = 1000;
  var MIN_COLUMNS = 1;
  var MAX_COLUMNS = 60;
  var MIN_COLUMN_WIDTH = 22;
  var MAX_COLUMN_WIDTH = 320;
  var DEFAULT_COLUMN_WIDTH = 132;
  var MIN_ROW_HEIGHT = 12;
  var MAX_ROW_HEIGHT = 96;
  var DEFAULT_ROW_HEIGHT = 36;
  var UNDO_LIMIT = 80;
  var REFERENCE_COLORS = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2"];
  var DATA_TYPES = ["general", "text", "number", "integer", "percent"];
  var MIN_DECIMALS = 0;
  var MAX_DECIMALS = 6;
  var TOOLBAR_GROUP_LABELS = ["Datoteka", "Uredi", "Format", "Raspored", "Podaci"];
  var GRIDLINE_TOOLBAR_ICONS = {
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v6h7V4"/><path d="M8 20v-6h8v6"/>',
    export: '<path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><path d="M5 20h14"/>',
    undo: '<path d="M9 7H5v4"/><path d="M5 11c2.5-4 9.5-5 13 0 2.2 3.2.6 7-3.5 8"/>',
    redo: '<path d="M15 7h4v4"/><path d="M19 11c-2.5-4-9.5-5-13 0-2.2 3.2-.6 7 3.5 8"/>',
    copy: '<rect x="8" y="8" width="11" height="11" rx="1.8"/><rect x="5" y="5" width="11" height="11" rx="1.8"/>',
    cut: '<path d="m4 5 16 14"/><path d="m20 5-6.5 6.5"/><circle cx="6" cy="16" r="2"/><circle cx="6" cy="8" r="2"/>',
    paste: '<path d="M9 5h6l1 2h2v13H6V7h2z"/><path d="M9 5h6"/><path d="M9 11h6M9 15h5"/>',
    textColor: '<path d="M5 19h14"/><path d="m8 15 4-10 4 10"/><path d="M9.2 12h5.6"/>',
    border: '<rect x="5" y="5" width="14" height="14"/><path d="M12 5v14M5 12h14"/>',
    alignLeft: '<path d="M5 7h14M5 12h10M5 17h14"/>',
    alignCenter: '<path d="M5 7h14M7 12h10M5 17h14"/>',
    alignRight: '<path d="M5 7h14M9 12h10M5 17h14"/>',
    merge: '<rect x="4" y="6" width="16" height="12"/><path d="M8 6v12M16 6v12"/><path d="m10 12 2-2 2 2M10 12l2 2 2-2"/>',
    unmerge: '<rect x="4" y="6" width="16" height="12"/><path d="M8 6v12M16 6v12"/><path d="m7 12 3-2M7 12l3 2M17 12l-3-2M17 12l-3 2"/>',
    header: '<path d="M5 6h14v12H5z"/><path d="M5 10h14"/><path d="M9 6v12"/>',
    freezeRow: '<path d="M5 6h14v12H5z"/><path d="M5 10h14"/><path d="m12 14 3 3 3-3"/>',
    freezeColumn: '<path d="M5 6h14v12H5z"/><path d="M10 6v12"/><path d="m14 12 3-3 3 3"/>',
    addRow: '<path d="M5 6h14v12H5z"/><path d="M5 11h14"/><path d="M12 13v4M10 15h4"/>',
    deleteRow: '<path d="M5 6h14v12H5z"/><path d="M5 11h14"/><path d="M10 15h4"/>',
    addColumn: '<path d="M5 6h14v12H5z"/><path d="M10 6v12"/><path d="M14 12h4M16 10v4"/>',
    deleteColumn: '<path d="M5 6h14v12H5z"/><path d="M10 6v12"/><path d="M14 12h4"/>',
    sortAsc: '<path d="M8 17V7"/><path d="m5 10 3-3 3 3"/><path d="M14 8h5M14 12h4M14 16h3"/>',
    sortDesc: '<path d="M8 7v10"/><path d="m5 14 3 3 3-3"/><path d="M14 8h3M14 12h4M14 16h5"/>',
    filter: '<path d="M5 6h14l-5 6v5l-4 2v-7z"/>',
    find: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>',
    clearFormatting: '<path d="M5 17h7"/><path d="m7 15 5-10 5 10"/><path d="M9 11h6"/><path d="m15 19 4-4M19 19l-4-4"/>',
    tools: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    hideTable: '<path d="M4 6h16v12H4z"/><path d="M4 10h16M9 6v12"/><path d="m7 15 10-10"/>',
    fullscreen: '<path d="M8 4H4v4M16 4h4v4M8 20H4v-4M20 16v4h-4"/>',
    autoBorderFilled: '<path d="M5 5h14v14H5z"/><path d="M5 10h14M5 15h14M10 5v14M15 5v14"/><path d="m7 7 2 2 4-4"/>',
  };

  function clampInteger(value, fallback, min, max) {
    var numeric = Math.round(Number(value));
    if (!Number.isFinite(numeric)) {
      numeric = fallback;
    }
    return Math.max(min, Math.min(max, numeric));
  }

  function clearNode(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function columnLabel(index) {
    var label = "";
    var current = index + 1;
    var mod;
    while (current > 0) {
      mod = (current - 1) % 26;
      label = String.fromCharCode(65 + mod) + label;
      current = Math.floor((current - mod) / 26);
    }
    return label;
  }

  function cellKey(row, column) {
    return row + ":" + column;
  }

  function isValidHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "").trim());
  }

  function normalizeDataType(value) {
    var normalized = String(value || "").trim().toLowerCase();
    if (normalized === "auto") {
      normalized = "general";
    }
    if (normalized === "int") {
      normalized = "integer";
    }
    return DATA_TYPES.indexOf(normalized) >= 0 ? normalized : "general";
  }

  function normalizeDecimalCount(value) {
    if (value == null || String(value).trim() === "") {
      return null;
    }
    return clampInteger(value, 2, MIN_DECIMALS, MAX_DECIMALS);
  }

  function normalizeStyleEntry(entry) {
    var source = entry && typeof entry === "object" ? entry : {};
    var style = {};
    var backgroundColor = String(source.backgroundColor || "").trim();
    var color = String(source.color || source.textColor || "").trim();
    var textAlign = String(source.textAlign || source.align || "").trim().toLowerCase();
    var border = String(source.border || source.borderStyle || "").trim().toLowerCase();
    var dataType = normalizeDataType(source.type || source.dataType || source.valueType);
    var decimals = normalizeDecimalCount(source.decimals);
    if (isValidHexColor(backgroundColor)) {
      style.backgroundColor = backgroundColor;
    }
    if (isValidHexColor(color)) {
      style.color = color;
    }
    if (["left", "center", "right"].indexOf(textAlign) >= 0) {
      style.textAlign = textAlign;
    }
    if (source.fontWeight === "bold" || source.bold === true) {
      style.fontWeight = "bold";
    }
    if (source.fontStyle === "italic" || source.italic === true) {
      style.fontStyle = "italic";
    }
    if (String(source.textDecoration || "").indexOf("underline") >= 0 || source.underline === true) {
      style.textDecoration = "underline";
    }
    if (["all", "outer", "bottom"].indexOf(border) >= 0) {
      style.border = border;
    }
    if (dataType !== "general") {
      style.type = dataType;
    }
    if (decimals != null) {
      style.decimals = decimals;
    }
    if (source.required === true) {
      style.required = true;
    }
    if (String(source.allowedValues || source.validationValues || "").trim()) {
      style.allowedValues = String(source.allowedValues || source.validationValues).trim();
    }
    return style;
  }

  function hasObjectKeys(value) {
    return Boolean(value && typeof value === "object" && Object.keys(value).length);
  }

  function formatNumberForStatus(value) {
    var rounded = Math.round(Number(value) * 1000) / 1000;
    if (!Number.isFinite(rounded)) {
      return "";
    }
    return String(rounded).replace(".", ",");
  }

  function parseFormattedNumber(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    var text = String(value == null ? "" : value)
      .trim()
      .replace(/\s+/g, "")
      .replace("%", "");
    if (!text) {
      return null;
    }
    if (text.indexOf(",") >= 0 && text.indexOf(".") < 0) {
      text = text.replace(",", ".");
    }
    if (!/^-?\d+(?:\.\d+)?$/.test(text)) {
      return null;
    }
    var numeric = Number(text);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function formatNumberWithDecimals(value, decimals) {
    var numeric = parseFormattedNumber(value);
    var safeDecimals = clampInteger(decimals, 2, MIN_DECIMALS, MAX_DECIMALS);
    if (numeric == null) {
      return String(value == null ? "" : value);
    }
    return numeric.toFixed(safeDecimals);
  }

  function formatValueForCellStyle(value, style) {
    var text = String(value == null ? "" : value);
    var normalizedStyle = normalizeStyleEntry(style);
    var type = normalizeDataType(normalizedStyle.type);
    var decimals = normalizedStyle.decimals;
    var numeric;
    if (!text || /^#(?:ERROR|DIV\/0!|REF!)$/i.test(text)) {
      return text;
    }
    if (type === "text") {
      return text;
    }
    if (type === "integer") {
      numeric = parseFormattedNumber(text);
      return numeric == null ? text : formatNumberWithDecimals(Math.round(numeric), 0);
    }
    if (type === "percent") {
      numeric = parseFormattedNumber(text);
      return numeric == null
        ? text
        : formatNumberWithDecimals(numeric * (text.indexOf("%") >= 0 ? 1 : 100), decimals == null ? 2 : decimals) + "%";
    }
    if (type === "number" || decimals != null) {
      return formatNumberWithDecimals(text, decimals == null ? 2 : decimals);
    }
    return text;
  }

  function toolbarIconMarkup(name) {
    var content = GRIDLINE_TOOLBAR_ICONS[name];
    if (!content) {
      return "";
    }
    return '<svg class="gridline-toolbar-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + content + "</svg>";
  }

  function toolbarLetterMarkup(letter, className) {
    return '<span class="gridline-toolbar-letter ' + (className || "") + '" aria-hidden="true">' + letter + "</span>";
  }

  function toolbarIconNameForButton(button) {
    var action = button && button.dataset ? button.dataset.gridlineAction : "";
    if (action === "align") {
      return "align" + (button.dataset.gridlineAlign || "left").replace(/^./, function (letter) {
        return letter.toUpperCase();
      });
    }
    if (action === "text-color") {
      return "textColor";
    }
    if (action === "toggle-header-row") {
      return "header";
    }
    if (action === "freeze-row") {
      return "freezeRow";
    }
    if (action === "freeze-column") {
      return "freezeColumn";
    }
    if (action === "add-row") {
      return "addRow";
    }
    if (action === "delete-row") {
      return "deleteRow";
    }
    if (action === "add-column") {
      return "addColumn";
    }
    if (action === "delete-column") {
      return "deleteColumn";
    }
    if (action === "sort-asc") {
      return "sortAsc";
    }
    if (action === "sort-desc") {
      return "sortDesc";
    }
    if (action === "clear-formatting") {
      return "clearFormatting";
    }
    if (action === "toggle-tools") {
      return "tools";
    }
    if (action === "toggle-table") {
      return "hideTable";
    }
    if (action === "fullscreen") {
      return "fullscreen";
    }
    if (action === "auto-border-filled") {
      return "autoBorderFilled";
    }
    return action;
  }

  function decorateToolbarButtonIcons(root) {
    if (!root || typeof root.querySelectorAll !== "function") {
      return;
    }
    Array.prototype.forEach.call(root.querySelectorAll(".gridline-icon-button[data-gridline-action]"), function (button) {
      var action = button.dataset.gridlineAction || "";
      var iconName;
      var icon;
      if (action === "bold") {
        button.innerHTML = toolbarLetterMarkup("B", "is-bold");
      } else if (action === "italic") {
        button.innerHTML = toolbarLetterMarkup("I", "is-italic");
      } else if (action === "underline") {
        button.innerHTML = toolbarLetterMarkup("U", "is-underline");
      } else {
        iconName = toolbarIconNameForButton(button);
        icon = toolbarIconMarkup(iconName);
        if (icon) {
          button.innerHTML = icon;
        }
      }
    });
  }

  function groupToolbarActions(root) {
    var actions = root && typeof root.querySelector === "function"
      ? root.querySelector(".documentation-gridline-actions")
      : null;
    var fragment;
    var group = null;
    var groupIndex = 0;
    if (!actions || actions.dataset.gridlineGrouped === "true") {
      return;
    }
    fragment = document.createDocumentFragment();
    function flushGroup() {
      if (group && group.childElementCount) {
        var label = document.createElement("span");
        label.className = "gridline-toolbar-group-title";
        label.textContent = TOOLBAR_GROUP_LABELS[groupIndex] || "Alati";
        label.setAttribute("aria-hidden", "true");
        group.appendChild(label);
        fragment.appendChild(group);
      }
      group = null;
    }
    function isToolbarUtilityAction(child) {
      var action = child && child.dataset ? child.dataset.gridlineAction : "";
      return ["toggle-tools", "toggle-table", "fullscreen", "auto-border-filled"].indexOf(action) >= 0;
    }
    Array.prototype.slice.call(actions.children).forEach(function (child) {
      var isSeparator = child.classList && child.classList.contains("gridline-toolbar-separator");
      var isStatus = child.dataset && child.dataset.gridlineRole;
      var isUtility = isToolbarUtilityAction(child);
      if (isSeparator) {
        flushGroup();
        groupIndex += 1;
        child.remove();
        return;
      }
      if (isStatus) {
        flushGroup();
        fragment.appendChild(child);
        return;
      }
      if (isUtility) {
        flushGroup();
        child.classList.add("gridline-toolbar-utility");
        fragment.appendChild(child);
        return;
      }
      if (!group) {
        group = document.createElement("span");
        group.className = "gridline-toolbar-group";
        group.setAttribute("aria-label", TOOLBAR_GROUP_LABELS[groupIndex] || "Alati");
      }
      group.appendChild(child);
    });
    flushGroup();
    clearNode(actions);
    actions.appendChild(fragment);
    actions.dataset.gridlineGrouped = "true";
  }

  var formulaTools = window.SafeNexusMeasurementFormula || null;
  var formulaToolsPromise = null;

  function loadFormulaTools() {
    if (formulaTools) {
      return Promise.resolve(formulaTools);
    }
    if (!formulaToolsPromise) {
      formulaToolsPromise = import("/src/measurementFormula.js?v=20260629-eiz-template-gridline-v1")
        .then(function (module) {
          formulaTools = module || null;
          window.SafeNexusMeasurementFormula = formulaTools;
          window.dispatchEvent(new CustomEvent("SafeNexusMeasurementFormulaReady"));
          return formulaTools;
        })
        .catch(function () {
          formulaTools = null;
          return null;
        });
    }
    return formulaToolsPromise;
  }

  function normalizeFormulaText(value) {
    return String(value == null ? "" : value)
      .replace(/RAND\s*BETWEEN/gi, "RANDBETWEEN")
      .replace(/RANDBE+TWI+N/gi, "RANDBETWEEN")
      .replace(/RANDBE+TWEEN/gi, "RANDBETWEEN");
  }

  function isFormulaText(value) {
    if (formulaTools && typeof formulaTools.isMeasurementFormula === "function") {
      return formulaTools.isMeasurementFormula(value);
    }
    return typeof value === "string" && value.trim().charAt(0) === "=";
  }

  function parseCellReferenceText(reference) {
    var text = String(reference && typeof reference === "object" ? reference.reference : reference || "")
      .replace(/^.*!/, "")
      .replace(/\$/g, "")
      .toUpperCase()
      .trim();
    var match = /^([A-Z]+)(\d+)$/.exec(text);
    var columnIndex = 0;
    var index;
    if (!match) {
      return null;
    }
    for (index = 0; index < match[1].length; index += 1) {
      columnIndex = (columnIndex * 26) + (match[1].charCodeAt(index) - 64);
    }
    return {
      rowIndex: Number(match[2]) - 1,
      columnIndex: columnIndex - 1,
    };
  }

  function formatFormulaResult(value) {
    if (formulaTools && typeof formulaTools.formatMeasurementFormulaResult === "function") {
      return formulaTools.formatMeasurementFormulaResult(value);
    }
    if (value == null || value === "") {
      return "";
    }
    return String(value);
  }

  function getRawModelValue(model, row, column) {
    return model && model.data ? model.data[cellKey(row, column)] || "" : "";
  }

  function createFormulaContext(model, options) {
    var cache = Object.create(null);
    var resolving = Object.create(null);
    var randomBetween = options && typeof options.randomBetween === "function"
      ? options.randomBetween
      : function (start, end) {
        var min = Math.ceil(Number(start));
        var max = Math.floor(Number(end));
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };

    function evaluateCell(row, column) {
      var key = cellKey(row, column);
      var rawValue = getRawModelValue(model, row, column);
      var result;
      if (!isFormulaText(rawValue) || !formulaTools || typeof formulaTools.evaluateMeasurementFormula !== "function") {
        return rawValue;
      }
      if (Object.prototype.hasOwnProperty.call(cache, key)) {
        return cache[key];
      }
      if (resolving[key]) {
        throw new Error("Kruzna formula.");
      }
      resolving[key] = true;
      try {
        result = formulaTools.evaluateMeasurementFormula(normalizeFormulaText(rawValue), {
          currentRowIndex: row,
          currentColumnIndex: column,
          randomBetween: randomBetween,
          resolveCellReference: function (reference) {
            var parsed = formulaTools && typeof formulaTools.parseMeasurementCellReference === "function"
              ? formulaTools.parseMeasurementCellReference(reference)
              : parseCellReferenceText(reference);
            if (!parsed || parsed.rowIndex < 0 || parsed.columnIndex < 0) {
              throw new Error("REF");
            }
            if (parsed.rowIndex >= model.rowCount || parsed.columnIndex >= model.columnCount) {
              throw new Error("REF");
            }
            return evaluateCell(parsed.rowIndex, parsed.columnIndex);
          },
          resolveRange: function (startReference, endReference) {
            var start = formulaTools && typeof formulaTools.parseMeasurementCellReference === "function"
              ? formulaTools.parseMeasurementCellReference(startReference)
              : parseCellReferenceText(startReference);
            var end = formulaTools && typeof formulaTools.parseMeasurementCellReference === "function"
              ? formulaTools.parseMeasurementCellReference(endReference)
              : parseCellReferenceText(endReference);
            var top;
            var bottom;
            var left;
            var right;
            var rows = [];
            var rowIndex;
            var columnIndex;
            if (!start || !end) {
              return rows;
            }
            top = Math.max(0, Math.min(start.rowIndex, end.rowIndex));
            bottom = Math.min(model.rowCount - 1, Math.max(start.rowIndex, end.rowIndex));
            left = Math.max(0, Math.min(start.columnIndex, end.columnIndex));
            right = Math.min(model.columnCount - 1, Math.max(start.columnIndex, end.columnIndex));
            for (rowIndex = top; rowIndex <= bottom; rowIndex += 1) {
              rows.push([]);
              for (columnIndex = left; columnIndex <= right; columnIndex += 1) {
                rows[rows.length - 1].push(evaluateCell(rowIndex, columnIndex));
              }
            }
            return rows;
          },
        });
      } finally {
        delete resolving[key];
      }
      cache[key] = result;
      return result;
    }

    return {
      evaluateCell: evaluateCell,
    };
  }

  function getModelCellDisplayValue(model, row, column, options) {
    var rawValue = getRawModelValue(model, row, column);
    if (!isFormulaText(rawValue)) {
      return rawValue;
    }
    if (!formulaTools || typeof formulaTools.evaluateMeasurementFormula !== "function") {
      return rawValue;
    }
    try {
      return formatFormulaResult(createFormulaContext(model, options).evaluateCell(row, column));
    } catch (error) {
      var message = String(error && error.message || "");
      if (/nul|zero|div/i.test(message)) {
        return "#DIV/0!";
      }
      if (/ref/i.test(message)) {
        return "#REF!";
      }
      return "#ERROR";
    }
  }

  function shiftFormulaValue(value, rowOffset, columnOffset) {
    var text = normalizeFormulaText(value);
    if (!isFormulaText(text)) {
      return text;
    }
    if (formulaTools && typeof formulaTools.shiftMeasurementFormulaReferences === "function") {
      try {
        return formulaTools.shiftMeasurementFormulaReferences(text, rowOffset, columnOffset);
      } catch (error) {
        return text;
      }
    }
    return text.replace(/(^|[^A-Z0-9_])(\$?)([A-Z]+)(\$?)(\d+)/gi, function (match, prefix, absoluteColumn, letters, absoluteRow, rowText) {
      var parsed = parseCellReferenceText(letters + rowText);
      var nextRow = absoluteRow ? parsed.rowIndex : Math.max(0, parsed.rowIndex + rowOffset);
      var nextColumn = absoluteColumn ? parsed.columnIndex : Math.max(0, parsed.columnIndex + columnOffset);
      return prefix + (absoluteColumn || "") + columnLabel(nextColumn) + (absoluteRow || "") + String(nextRow + 1);
    });
  }

  function normalizeDataMap(value) {
    var source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    var data = Object.create(null);
    Object.keys(source).forEach(function (key) {
      var match = /^(\d+):(\d+)$/.exec(key);
      var nextValue;
      if (!match) {
        return;
      }
      nextValue = String(source[key] == null ? "" : source[key]);
      if (nextValue) {
        data[Number(match[1]) + ":" + Number(match[2])] = nextValue;
      }
    });
    return data;
  }

  function normalizeMerges(value, rowCount, columnCount) {
    var source = Array.isArray(value) ? value : [];
    return source.map(function (entry) {
      var row = clampInteger(entry && entry.row, 0, 0, rowCount - 1);
      var column = clampInteger(entry && entry.column, 0, 0, columnCount - 1);
      var rowSpan = clampInteger(entry && (entry.rowSpan || entry.rowspan), 1, 1, rowCount - row);
      var columnSpan = clampInteger(entry && (entry.columnSpan || entry.colSpan || entry.colspan), 1, 1, columnCount - column);
      return {
        row: row,
        column: column,
        rowSpan: rowSpan,
        columnSpan: columnSpan,
      };
    }).filter(function (entry) {
      return entry.rowSpan > 1 || entry.columnSpan > 1;
    });
  }

  function normalizeNumberMap(value, maxIndex, minValue, maxValue) {
    var source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    var normalized = Object.create(null);
    Object.keys(source).forEach(function (key) {
      var index = Number(key);
      var numericValue = Number(source[key]);
      if (!Number.isInteger(index) || index < 0 || index >= maxIndex || !Number.isFinite(numericValue)) {
        return;
      }
      normalized[String(index)] = Math.max(minValue, Math.min(maxValue, Math.round(numericValue)));
    });
    return normalized;
  }

  function normalizeCellStyles(value, rowCount, columnCount) {
    var source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    var normalized = Object.create(null);
    Object.keys(source).forEach(function (key) {
      var parts = key.split(":");
      var row = Number(parts[0]);
      var column = Number(parts[1]);
      var entry = source[key] && typeof source[key] === "object" ? source[key] : {};
      var nextEntry = normalizeStyleEntry(entry);
      if (
        !Number.isInteger(row)
        || !Number.isInteger(column)
        || row < 0
        || column < 0
        || row >= rowCount
        || column >= columnCount
      ) {
        return;
      }
      if (hasObjectKeys(nextEntry)) {
        normalized[cellKey(row, column)] = nextEntry;
      }
    });
    return normalized;
  }

  function normalizeHeaderRows(value, rowCount) {
    var source = Array.isArray(value) ? value : [];
    var seen = Object.create(null);
    return source.map(function (entry) {
      return clampInteger(entry, 0, 0, Math.max(0, rowCount - 1));
    }).filter(function (row) {
      if (seen[String(row)]) {
        return false;
      }
      seen[String(row)] = true;
      return true;
    }).sort(function (left, right) {
      return left - right;
    });
  }

  function normalizeAiColumns(value, columnCount) {
    var source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    var normalized = Object.create(null);
    Object.keys(source).forEach(function (key) {
      var column = Number(key);
      var entry = source[key] && typeof source[key] === "object" ? source[key] : {};
      if (!Number.isInteger(column) || column < 0 || column >= columnCount) {
        return;
      }
      normalized[String(column)] = {
        enabled: entry.enabled !== false,
        label: String(entry.label || "").trim(),
        description: String(entry.description || entry.aiDescription || "").trim(),
        lookFor: String(entry.lookFor || entry.aiLookFor || "").trim(),
        avoid: String(entry.avoid || entry.aiAvoid || "").trim(),
        allowedValues: String(entry.allowedValues || "").trim(),
        examples: String(entry.examples || "").trim(),
        required: Boolean(entry.required),
      };
    });
    return normalized;
  }

  function cloneAiColumns(value, columnCount) {
    var normalized = normalizeAiColumns(value, columnCount);
    var clone = Object.create(null);
    Object.keys(normalized).forEach(function (key) {
      clone[key] = Object.assign({}, normalized[key]);
    });
    return clone;
  }

  function cloneFileMeta(value) {
    return (Array.isArray(value) ? value : []).map(function (file) {
      return {
        id: String(file && (file.id || file.name) || ""),
        name: String(file && file.name || ""),
        type: String(file && file.type || ""),
        size: Number(file && file.size || 0),
        lastModified: Number(file && file.lastModified || 0),
        inlineReady: Boolean(file && (file.inlineReady || file.contentDataUrl)),
        contentDataUrl: file && file.contentDataUrl ? String(file.contentDataUrl) : "",
      };
    }).filter(function (file) {
      return file.name || file.id;
    });
  }

  function normalizeSelectionRange(range, rowCount, columnCount) {
    var source = range && typeof range === "object" ? range : {};
    return {
      startRow: clampInteger(source.startRow, 0, 0, Math.max(0, rowCount - 1)),
      startColumn: clampInteger(source.startColumn, 0, 0, Math.max(0, columnCount - 1)),
      endRow: clampInteger(source.endRow, 0, 0, Math.max(0, rowCount - 1)),
      endColumn: clampInteger(source.endColumn, 0, 0, Math.max(0, columnCount - 1)),
    };
  }

  function getRangeBounds(range) {
    return {
      top: Math.min(range.startRow, range.endRow),
      bottom: Math.max(range.startRow, range.endRow),
      left: Math.min(range.startColumn, range.endColumn),
      right: Math.max(range.startColumn, range.endColumn),
    };
  }

  function rangesOverlap(left, right) {
    return !(
      left.right < right.left
      || right.right < left.left
      || left.bottom < right.top
      || right.bottom < left.top
    );
  }

  function makeCellStyle(backgroundColor, textAlign, existing) {
    var style = normalizeStyleEntry(existing);
    if (isValidHexColor(String(backgroundColor || "").trim())) {
      style.backgroundColor = String(backgroundColor).trim();
    } else {
      delete style.backgroundColor;
    }
    if (["left", "center", "right"].indexOf(String(textAlign || "").trim().toLowerCase()) >= 0) {
      style.textAlign = String(textAlign).trim().toLowerCase();
    } else if (textAlign !== undefined) {
      delete style.textAlign;
    }
    return style;
  }

  function createDefaultModel(options) {
    var rowCount = clampInteger(
      options && (options.rowCount || options.defaultRows),
      DEFAULT_ROWS,
      MIN_ROWS,
      MAX_ROWS
    );
    var columnCount = clampInteger(
      options && (options.columnCount || options.defaultColumns),
      DEFAULT_COLUMNS,
      MIN_COLUMNS,
      MAX_COLUMNS
    );
    return {
      title: String(options && options.title || "").trim(),
      subtitle: String(options && options.subtitle || "").trim(),
      rowCount: rowCount,
      columnCount: columnCount,
      data: Object.create(null),
      merges: [],
      columnWidths: Object.create(null),
      rowHeights: Object.create(null),
      cellStyles: Object.create(null),
      headerRows: [],
      aiColumns: Object.create(null),
    };
  }

  function rowsToModel(rows, options) {
    var source = Array.isArray(rows) ? rows : [];
    var rowCount = clampInteger(
      options && options.rowCount,
      Math.max(source.length, options && options.defaultRows ? options.defaultRows : 5),
      MIN_ROWS,
      MAX_ROWS
    );
    var columnCount = clampInteger(
      options && options.columnCount,
      Math.max(
        source.reduce(function (max, row) {
          return Math.max(max, Array.isArray(row) ? row.length : 0);
        }, 0),
        options && options.defaultColumns ? options.defaultColumns : 3
      ),
      MIN_COLUMNS,
      MAX_COLUMNS
    );
    var data = Object.create(null);

    source.slice(0, rowCount).forEach(function (row, rowIndex) {
      if (!Array.isArray(row)) {
        return;
      }
      row.slice(0, columnCount).forEach(function (value, columnIndex) {
        var text = String(value == null ? "" : value);
        if (text) {
          data[cellKey(rowIndex, columnIndex)] = text;
        }
      });
    });

    return {
      title: String(options && options.title || "").trim(),
      subtitle: String(options && options.subtitle || "").trim(),
      rowCount: rowCount,
      columnCount: columnCount,
      data: data,
      merges: [],
      columnWidths: Object.create(null),
      rowHeights: Object.create(null),
      cellStyles: Object.create(null),
      headerRows: Array.isArray(options && options.headerRows) ? normalizeHeaderRows(options.headerRows, rowCount) : [],
      aiColumns: Object.create(null),
      autoBorderFilled: false,
    };
  }

  function modelToRows(model, options) {
    var normalized = normalizeModel(model, options);
    var formulaContext = options && options.raw ? null : createFormulaContext(normalized, options);
    return Array.from({ length: normalized.rowCount }, function (_, rowIndex) {
      return Array.from({ length: normalized.columnCount }, function (_, columnIndex) {
        var rawValue = normalized.data[cellKey(rowIndex, columnIndex)] || "";
        if (options && options.raw) {
          return rawValue;
        }
        if (!isFormulaText(rawValue) || !formulaTools || typeof formulaTools.evaluateMeasurementFormula !== "function") {
          return rawValue;
        }
        try {
          return formatFormulaResult(formulaContext.evaluateCell(rowIndex, columnIndex));
        } catch (error) {
          return "#ERROR";
        }
      }).map(function (value, columnIndex) {
        if (options && options.raw) {
          return value;
        }
        return formatValueForCellStyle(value, normalized.cellStyles[cellKey(rowIndex, columnIndex)]);
      });
    });
  }

  function normalizeModel(value, options) {
    var source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    var fallbackRows = options && options.defaultRows ? options.defaultRows : DEFAULT_ROWS;
    var fallbackColumns = options && options.defaultColumns ? options.defaultColumns : DEFAULT_COLUMNS;
    var rowCount = clampInteger(source.rowCount, fallbackRows, MIN_ROWS, MAX_ROWS);
    var columnCount = clampInteger(source.columnCount, fallbackColumns, MIN_COLUMNS, MAX_COLUMNS);
    var data = normalizeDataMap(source.data);
    var merges = normalizeMerges(source.merges, rowCount, columnCount);
    var columnWidths = normalizeNumberMap(source.columnWidths, columnCount, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
    var rowHeights = normalizeNumberMap(source.rowHeights, rowCount, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
    var cellStyles = normalizeCellStyles(source.cellStyles, rowCount, columnCount);
    var headerRows = normalizeHeaderRows(source.headerRows, rowCount);
    var aiColumns = normalizeAiColumns(source.aiColumns, columnCount);

    Object.keys(data).forEach(function (key) {
      var parts = key.split(":");
      var row = Number(parts[0]);
      var column = Number(parts[1]);
      if (row >= rowCount || column >= columnCount) {
        delete data[key];
      }
    });

    return {
      title: String(source.title || options && options.title || "").trim(),
      subtitle: String(source.subtitle || options && options.subtitle || "").trim(),
      rowCount: rowCount,
      columnCount: columnCount,
      data: data,
      merges: merges,
      columnWidths: columnWidths,
      rowHeights: rowHeights,
      cellStyles: cellStyles,
      headerRows: headerRows,
      aiColumns: aiColumns,
      autoBorderFilled: Boolean(source.autoBorderFilled),
    };
  }

  function cloneModel(model) {
    return {
      title: String(model.title || "").trim(),
      subtitle: String(model.subtitle || "").trim(),
      rowCount: model.rowCount,
      columnCount: model.columnCount,
      data: Object.assign(Object.create(null), model.data),
      merges: normalizeMerges(model.merges, model.rowCount, model.columnCount),
      columnWidths: normalizeNumberMap(model.columnWidths, model.columnCount, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH),
      rowHeights: normalizeNumberMap(model.rowHeights, model.rowCount, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT),
      cellStyles: normalizeCellStyles(model.cellStyles, model.rowCount, model.columnCount),
      headerRows: normalizeHeaderRows(model.headerRows, model.rowCount),
      aiColumns: cloneAiColumns(model.aiColumns, model.columnCount),
      autoBorderFilled: Boolean(model.autoBorderFilled),
    };
  }

  function getClosestCellInput(target) {
    if (!target || typeof target.closest !== "function") {
      return null;
    }
    return target.closest(".cell[data-row][data-column]");
  }

  function resolveElement(root, selector, fallbackSelector) {
    if (!root || typeof root.querySelector !== "function") {
      return null;
    }
    return root.querySelector(selector) || (fallbackSelector ? root.querySelector(fallbackSelector) : null);
  }

  function readStoredModel(storageKey, options) {
    if (!storageKey || !window.localStorage) {
      return null;
    }
    try {
      return normalizeModel(JSON.parse(window.localStorage.getItem(storageKey) || "null"), options);
    } catch (error) {
      return null;
    }
  }

  function writeStoredModel(storageKey, model) {
    if (!storageKey || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(cloneModel(model)));
  }

  function mount(root, options) {
    var host = root && root.nodeType === 9 ? root : root || document;
    var grid = resolveElement(host, "[data-gridline-role='grid']", "#grid");
    var status = resolveElement(host, "[data-gridline-role='status']", "#status");
    var formulaInput = resolveElement(host, "[data-gridline-role='formula']", "#formula-input");
    var cellRef = resolveElement(host, "[data-gridline-role='cell-ref']", "#cell-ref");
    var addRowButton = resolveElement(host, "[data-gridline-action='add-row']", "#add-row");
    var addColumnButton = resolveElement(host, "[data-gridline-action='add-column']", "#add-column");
    var widenColumnButton = resolveElement(host, "[data-gridline-action='widen-column']");
    var narrowColumnButton = resolveElement(host, "[data-gridline-action='narrow-column']");
    var tallerRowButton = resolveElement(host, "[data-gridline-action='taller-row']");
    var shorterRowButton = resolveElement(host, "[data-gridline-action='shorter-row']");
    var mergeButton = resolveElement(host, "[data-gridline-action='merge']");
    var unmergeButton = resolveElement(host, "[data-gridline-action='unmerge']");
    var headerRowButton = resolveElement(host, "[data-gridline-action='toggle-header-row']");
    var alignButtons = host && typeof host.querySelectorAll === "function"
      ? Array.prototype.slice.call(host.querySelectorAll("[data-gridline-action='align']"))
      : [];
    var backgroundColorButtons = host && typeof host.querySelectorAll === "function"
      ? Array.prototype.slice.call(host.querySelectorAll("[data-gridline-action='background-color']"))
      : [];
    var clearButton = resolveElement(host, "[data-gridline-action='clear']", "#clear");
    var saveButton = resolveElement(host, "[data-gridline-action='save']");
    var downloadButton = resolveElement(host, "[data-gridline-action='download']", "#download");
    var exportButton = resolveElement(host, "[data-gridline-action='export']");
    var quickFillButton = resolveElement(host, "[data-gridline-action='quick-fill']", "#quick-fill");
    var undoButton = resolveElement(host, "[data-gridline-action='undo']");
    var redoButton = resolveElement(host, "[data-gridline-action='redo']");
    var copyButton = resolveElement(host, "[data-gridline-action='copy']");
    var cutButton = resolveElement(host, "[data-gridline-action='cut']");
    var pasteButton = resolveElement(host, "[data-gridline-action='paste']");
    var boldButton = resolveElement(host, "[data-gridline-action='bold']");
    var italicButton = resolveElement(host, "[data-gridline-action='italic']");
    var underlineButton = resolveElement(host, "[data-gridline-action='underline']");
    var textColorButtons = host && typeof host.querySelectorAll === "function"
      ? Array.prototype.slice.call(host.querySelectorAll("[data-gridline-action='text-color']"))
      : [];
    var borderButton = resolveElement(host, "[data-gridline-action='border']");
    var autoBorderFilledButton = resolveElement(host, "[data-gridline-action='auto-border-filled']");
    var clearFormattingButton = resolveElement(host, "[data-gridline-action='clear-formatting']");
    var deleteRowButton = resolveElement(host, "[data-gridline-action='delete-row']");
    var deleteColumnButton = resolveElement(host, "[data-gridline-action='delete-column']");
    var sortAscButton = resolveElement(host, "[data-gridline-action='sort-asc']");
    var sortDescButton = resolveElement(host, "[data-gridline-action='sort-desc']");
    var filterButton = resolveElement(host, "[data-gridline-action='filter']");
    var findButton = resolveElement(host, "[data-gridline-action='find']");
    var freezeRowButton = resolveElement(host, "[data-gridline-action='freeze-row']");
    var freezeColumnButton = resolveElement(host, "[data-gridline-action='freeze-column']");
    var zoomSelect = resolveElement(host, "[data-gridline-action='zoom']");
    var toolsToggleButton = resolveElement(host, "[data-gridline-action='toggle-tools']");
    var tableToggleButton = resolveElement(host, "[data-gridline-action='toggle-table']");
    var fullscreenButton = resolveElement(host, "[data-gridline-action='fullscreen']");
    var dataTypeSelect = resolveElement(host, "[data-gridline-action='data-type']");
    var decimalsSelect = resolveElement(host, "[data-gridline-action='decimals']");
    var statusBar = resolveElement(host, "[data-gridline-role='summary']");
    var titleInput = resolveElement(host, "[data-gridline-role='title']");
    var subtitleInput = resolveElement(host, "[data-gridline-role='subtitle']");
    var rootElement = grid ? grid.closest("[data-gridline-instance]") || host : host;
    var model;
    var active = { row: 0, column: 0 };
    var selectedCell = null;
    var saveTimer = 0;
    var computedRefreshFrame = 0;
    var saveDelay = clampInteger(options && options.saveDelayMs, 450, 0, 60000);
    var storageKey = options && Object.prototype.hasOwnProperty.call(options, "storageKey")
      ? options.storageKey
      : (rootElement && rootElement.dataset ? rootElement.dataset.gridlineStorageKey : "") || DEFAULT_STORAGE_KEY;
    var onChange = options && typeof options.onChange === "function" ? options.onChange : null;
    var onFormulaReady = options && typeof options.onFormulaReady === "function" ? options.onFormulaReady : null;
    var onAiPrefill = options && typeof options.onAiPrefill === "function" ? options.onAiPrefill : null;
    var changeMode = String(options && (options.changeMode || options.emitChangeMode) || "input").toLowerCase();
    var autoGrow = !(options && options.autoGrow === false);
    var enableQuickFill = Boolean(quickFillButton || options && options.enableQuickFill);
    var enableAiContextMenu = Boolean(options && options.enableAiContextMenu);
    var enableColumnAiSettings = options && Object.prototype.hasOwnProperty.call(options, "enableColumnAiSettings")
      ? Boolean(options.enableColumnAiSettings)
      : true;
    var disableAiUpload = Boolean(options && options.disableAiUpload);
    var pendingExternalChange = false;
    var fillDrag = null;
    var columnResize = null;
    var rowResize = null;
    var selectionDrag = null;
    var editingCell = null;
    var selection = { startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 };
    var undoStack = [];
    var redoStack = [];
    var isRestoringHistory = false;
    var editingSnapshot = null;
    var columnFilters = Object.create(null);
    var filterPanel = null;
    var validationPanel = null;
    var referenceHighlights = [];
    var formulaHighlight = null;
    var freezeFirstRow = true;
    var freezeFirstColumn = true;
    var zoomLevel = 1;
    var zoomMode = "manual";
    var zoomResizeFrame = 0;
    var quickFillPanel = null;
    var contextMenu = null;
    var aiPanel = null;
    var columnAiPanel = null;
    var toolsCollapsed = !(rootElement && rootElement.dataset && rootElement.dataset.gridlineToolsDefault === "open");
    var tableHidden = Boolean(rootElement && rootElement.dataset && rootElement.dataset.gridlineTableHidden === "true");
    var fallbackFullscreen = false;
    var aiState = {
      mode: "table",
      files: cloneFileMeta(options && options.aiFiles),
      previewRows: [],
      status: "idle",
      message: "",
    };

    if (!grid || !status || !formulaInput || !cellRef) {
      return null;
    }

    groupToolbarActions(rootElement);
    decorateToolbarButtonIcons(rootElement);

    if (rootElement && rootElement.__safeNexusGridlineDestroy) {
      rootElement.__safeNexusGridlineDestroy();
    }

    model = options && options.model
      ? normalizeModel(options.model, options)
      : (readStoredModel(storageKey, options) || createDefaultModel(options));
    syncTitleControlsFromModel();
    ensureFormulaHighlightLayer();

    if (grid && !grid.hasAttribute("tabindex")) {
      grid.tabIndex = 0;
    }

    if (!statusBar && rootElement) {
      var statusBarTarget = rootElement.nodeType === 9 ? rootElement.body : rootElement;
      statusBar = document.createElement("div");
      statusBar.className = "gridline-statusbar";
      statusBar.dataset.gridlineRole = "summary";
      statusBar.textContent = "Spremno";
      if (statusBarTarget && statusBarTarget.appendChild) {
        statusBarTarget.appendChild(statusBar);
      }
    }

    readZoomControl();
    if (rootElement && rootElement.classList) {
      rootElement.classList.add("is-gridline-freeze-row", "is-gridline-freeze-column");
      rootElement.classList.toggle("is-gridline-tools-collapsed", toolsCollapsed);
      rootElement.classList.toggle("is-gridline-table-hidden", tableHidden);
    }
    syncGridlineViewButtons();

    function setStatus(text, className) {
      var nextClassName = ("status " + (className || "")).trim();
      if (status.textContent === text && status.className === nextClassName) {
        return;
      }
      status.textContent = text;
      status.className = nextClassName;
      updateStatusSummary();
    }

    function showGridError(error) {
      var tbody = document.createElement("tbody");
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      var box = document.createElement("div");
      clearNode(grid);
      td.colSpan = 2;
      box.className = "grid-error";
      box.textContent = "Grid se nije mogao nacrtati na ovom browseru: " + (error && error.message ? error.message : "nepoznata greska");
      td.appendChild(box);
      tr.appendChild(td);
      tbody.appendChild(tr);
      grid.appendChild(tbody);
      setStatus("Greska prikaza", "is-saving");
    }

    function getValue(row, column) {
      return model.data[cellKey(row, column)] || "";
    }

    function getDisplayValue(row, column) {
      return formatValueForCellStyle(
        getModelCellDisplayValue(model, row, column, options),
        getCellStyle(row, column)
      );
    }

    function getColumnWidth(column) {
      return clampInteger(model.columnWidths && model.columnWidths[String(column)], DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
    }

    function getColumnSpanWidth(column, columnSpan) {
      var width = 0;
      var index;
      for (index = 0; index < Math.max(1, columnSpan || 1); index += 1) {
        width += getColumnWidth(column + index);
      }
      return width;
    }

    function getRowHeight(row) {
      return clampInteger(model.rowHeights && model.rowHeights[String(row)], DEFAULT_ROW_HEIGHT, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
    }

    function getCellStyle(row, column) {
      return model.cellStyles && model.cellStyles[cellKey(row, column)] || null;
    }

    function normalizeSemanticCellText(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    }

    function getCellSemanticStatus(row, column) {
      var header = normalizeSemanticCellText([
        getValue(0, column),
        getValue(1, column),
        columnLabel(column),
      ].join(" "));
      var value = normalizeSemanticCellText(getValue(row, column));
      if (row <= 1 || !value || !/(zadovol|ocjena|status|rezultat|pass)/.test(header)) {
        return "";
      }
      if (/^(ne|no|fail|nije)(\b|\s|-)/.test(value) || value.indexOf("ne zadovol") >= 0) {
        return "negative";
      }
      if (/^(da|ok|yes|pass)$/.test(value) || value.indexOf("zadovol") >= 0) {
        return "positive";
      }
      return "";
    }

    function syncTitleControlsFromModel() {
      if (titleInput) {
        if (!String(model.title || "").trim() && String(titleInput.value || "").trim()) {
          model.title = String(titleInput.value || "").trim();
        } else if (String(model.title || "").trim()) {
          titleInput.value = String(model.title || "");
        }
      }
      if (subtitleInput) {
        if (!String(model.subtitle || "").trim() && String(subtitleInput.value || "").trim()) {
          model.subtitle = String(subtitleInput.value || "").trim();
        } else if (String(model.subtitle || "").trim()) {
          subtitleInput.value = String(model.subtitle || "");
        }
      }
    }

    function handleGridlineTitleInput() {
      if (titleInput) {
        model.title = String(titleInput.value || "").trim();
      }
      if (subtitleInput) {
        model.subtitle = String(subtitleInput.value || "").trim();
      }
      scheduleSave();
    }

    function getGridScrollElement() {
      return grid && typeof grid.closest === "function"
        ? grid.closest(".documentation-gridline-scroll")
        : null;
    }

    function getUnscaledGridWidth() {
      var width = 52;
      var column;
      for (column = 0; column < model.columnCount; column += 1) {
        width += getColumnWidth(column);
      }
      return width;
    }

    function readZoomControl() {
      var rawValue = zoomSelect ? String(zoomSelect.value || "100") : "100";
      if (rawValue === "fit") {
        zoomMode = "fit";
      } else {
        zoomMode = "manual";
        zoomLevel = Number(rawValue || 100) / 100;
        if (!Number.isFinite(zoomLevel) || zoomLevel <= 0) {
          zoomLevel = 1;
        }
      }
      applyZoom();
    }

    function applyZoom() {
      var scrollElement;
      var viewportWidth;
      var gridWidth;
      if (!rootElement || !rootElement.style) {
        return;
      }
      if (zoomMode === "fit") {
        scrollElement = getGridScrollElement();
        viewportWidth = scrollElement ? Math.max(0, scrollElement.clientWidth - 8) : 0;
        gridWidth = getUnscaledGridWidth();
        zoomLevel = viewportWidth && gridWidth
          ? Math.max(0.42, Math.min(1.4, viewportWidth / gridWidth))
          : 1;
      }
      rootElement.style.setProperty("--gridline-zoom", String(Math.round(zoomLevel * 1000) / 1000));
      if (zoomSelect) {
        zoomSelect.title = zoomMode === "fit"
          ? "Zoom: prilagodeno sirini (" + Math.round(zoomLevel * 100) + "%)"
          : "Zoom";
      }
    }

    function scheduleZoomFit() {
      if (zoomMode !== "fit") {
        return;
      }
      if (zoomResizeFrame) {
        window.cancelAnimationFrame(zoomResizeFrame);
      }
      zoomResizeFrame = window.requestAnimationFrame(function () {
        zoomResizeFrame = 0;
        applyZoom();
      });
    }

    function handleWindowResize() {
      scheduleZoomFit();
    }

    function isGridlineFullscreen() {
      return Boolean((document.fullscreenElement && document.fullscreenElement === rootElement) || fallbackFullscreen);
    }

    function syncGridlineViewButtons() {
      if (toolsToggleButton) {
        toolsToggleButton.setAttribute("aria-pressed", toolsCollapsed ? "false" : "true");
        toolsToggleButton.title = toolsCollapsed ? "Prikazi alate" : "Sakrij alate";
      }
      if (tableToggleButton) {
        tableToggleButton.setAttribute("aria-pressed", tableHidden ? "true" : "false");
        tableToggleButton.title = tableHidden ? "Prikazi tablicu" : "Sakrij tablicu";
      }
      if (fullscreenButton) {
        fullscreenButton.setAttribute("aria-pressed", isGridlineFullscreen() ? "true" : "false");
        fullscreenButton.title = isGridlineFullscreen() ? "Izadi iz full screena" : "Full screen tablica";
      }
      if (autoBorderFilledButton) {
        autoBorderFilledButton.setAttribute("aria-pressed", model && model.autoBorderFilled ? "true" : "false");
        autoBorderFilledButton.title = model && model.autoBorderFilled
          ? "Iskljuci automatske obrube popunjenih celija"
          : "Automatski obrubi popunjene celije";
      }
    }

    function toggleGridlineTools() {
      toolsCollapsed = !toolsCollapsed;
      if (rootElement && rootElement.classList) {
        rootElement.classList.toggle("is-gridline-tools-collapsed", toolsCollapsed);
      }
      syncGridlineViewButtons();
    }

    function toggleGridlineTable() {
      tableHidden = !tableHidden;
      if (rootElement && rootElement.classList) {
        rootElement.classList.toggle("is-gridline-table-hidden", tableHidden);
      }
      syncGridlineViewButtons();
      scheduleZoomFit();
    }

    function syncFullscreenState() {
      if (document.fullscreenElement && document.fullscreenElement !== rootElement) {
        fallbackFullscreen = false;
      }
      if (rootElement && rootElement.classList) {
        rootElement.classList.toggle("is-gridline-fullscreen", isGridlineFullscreen());
      }
      syncGridlineViewButtons();
      scheduleZoomFit();
    }

    function toggleGridlineFullscreen() {
      if (!rootElement) {
        return;
      }
      if (isGridlineFullscreen()) {
        fallbackFullscreen = false;
        if (document.fullscreenElement === rootElement && document.exitFullscreen) {
          document.exitFullscreen().catch(function () {});
        }
        syncFullscreenState();
        return;
      }
      if (rootElement.requestFullscreen) {
        rootElement.requestFullscreen().then(function () {
          fallbackFullscreen = false;
          syncFullscreenState();
        }).catch(function () {
          fallbackFullscreen = true;
          syncFullscreenState();
        });
      } else {
        fallbackFullscreen = true;
        syncFullscreenState();
      }
    }

    function toggleAutoBorderFilled() {
      recordUndo();
      model.autoBorderFilled = !model.autoBorderFilled;
      render();
      scheduleSave();
      syncGridlineViewButtons();
    }

    function applyCellStyleToElement(td, input, style) {
      var normalized = normalizeStyleEntry(style);
      [td, input].forEach(function (element) {
        if (!element) {
          return;
        }
        element.style.backgroundColor = normalized.backgroundColor || "";
        element.style.color = normalized.color || "";
        element.style.textAlign = normalized.textAlign || "";
        element.style.fontWeight = normalized.fontWeight || "";
        element.style.fontStyle = normalized.fontStyle || "";
        element.style.textDecoration = normalized.textDecoration || "";
      });
      if (td) {
        td.classList.toggle("is-required-cell", Boolean(normalized.required));
        td.classList.toggle("has-cell-border", Boolean(normalized.border));
        td.dataset.gridlineBorder = normalized.border || "";
      }
    }

    function parseAllowedValues(value) {
      return String(value || "")
        .split(/[\n;,|]+/)
        .map(function (entry) { return entry.trim(); })
        .filter(Boolean);
    }

    function getAllowedValues(row, column) {
      var style = getCellStyle(row, column) || {};
      var direct = parseAllowedValues(style.allowedValues || style.validationValues);
      var columnAi = model.aiColumns && model.aiColumns[String(column)];
      var aiValues = parseAllowedValues(columnAi && columnAi.allowedValues);
      return direct.length ? direct : aiValues;
    }

    function isValueAllowed(row, column, value) {
      var allowed = getAllowedValues(row, column);
      if (!allowed.length || !String(value || "").trim()) {
        return true;
      }
      return allowed.some(function (entry) {
        return entry.toLowerCase() === String(value || "").trim().toLowerCase();
      });
    }

    function isInputEditing(input) {
      return Boolean(
        input
        && editingCell
        && Number(input.dataset.row) === editingCell.row
        && Number(input.dataset.column) === editingCell.column
      );
    }

    function syncInputDisplay(input, forceRaw) {
      var row;
      var column;
      var rawValue;
      var displayValue;
      if (!input) {
        return;
      }
      row = Number(input.dataset.row);
      column = Number(input.dataset.column);
      rawValue = getValue(row, column);
      displayValue = forceRaw || isInputEditing(input)
        ? rawValue
        : getDisplayValue(row, column);
      input.value = displayValue;
      input.dataset.rawValue = rawValue;
      input.readOnly = !isInputEditing(input);
      input.tabIndex = isInputEditing(input) ? 0 : -1;
      input.classList.toggle("is-formula", isFormulaText(rawValue));
      input.classList.toggle("is-editing", isInputEditing(input));
      input.classList.toggle("is-formula-error", isFormulaText(rawValue) && displayValue === "#ERROR");
      input.classList.toggle("is-invalid-value", !isValueAllowed(row, column, rawValue));
      input.title = isFormulaText(rawValue) && displayValue === "#ERROR"
        ? "Formula se ne moze izracunati."
        : !isValueAllowed(row, column, rawValue)
          ? "Vrijednost nije na listi dopustenih vrijednosti."
        : "";
    }

    function refreshComputedCells() {
      computedRefreshFrame = 0;
      Array.prototype.forEach.call(grid.querySelectorAll(".cell[data-row][data-column]"), function (input) {
        syncInputDisplay(input, false);
      });
    }

    function queueComputedRefresh() {
      if (computedRefreshFrame) {
        return;
      }
      computedRefreshFrame = window.requestAnimationFrame(refreshComputedCells);
    }

    function setValue(row, column, value) {
      var key = cellKey(row, column);
      var next = String(value == null ? "" : value);
      if (next) {
        model.data[key] = next;
      } else {
        delete model.data[key];
      }
    }

    function getInput(row, column) {
      return grid.querySelector('.cell[data-row="' + row + '"][data-column="' + column + '"]');
    }

    function getCoveringMerge(row, column) {
      var index;
      var merge;
      for (index = 0; index < (model.merges || []).length; index += 1) {
        merge = model.merges[index];
        if (
          row >= merge.row
          && row < merge.row + merge.rowSpan
          && column >= merge.column
          && column < merge.column + merge.columnSpan
        ) {
          return merge;
        }
      }
      return null;
    }

    function getMergeStart(row, column) {
      var merge = getCoveringMerge(row, column);
      if (!merge) {
        return { row: row, column: column };
      }
      return { row: merge.row, column: merge.column };
    }

    function isCoveredByMerge(row, column) {
      var merge = getCoveringMerge(row, column);
      return Boolean(merge && (merge.row !== row || merge.column !== column));
    }

    function getSelectionBounds() {
      return getRangeBounds(normalizeSelectionRange(selection, model.rowCount, model.columnCount));
    }

    function isCellInSelection(row, column) {
      var bounds = getSelectionBounds();
      return row >= bounds.top && row <= bounds.bottom && column >= bounds.left && column <= bounds.right;
    }

    function isHeaderRow(row) {
      return normalizeHeaderRows(model.headerRows, model.rowCount).indexOf(row) >= 0;
    }

    function getSelectedCells() {
      var bounds = getSelectionBounds();
      var cells = [];
      var row;
      var column;
      for (row = bounds.top; row <= bounds.bottom; row += 1) {
        for (column = bounds.left; column <= bounds.right; column += 1) {
          cells.push({ row: row, column: column });
        }
      }
      return cells;
    }

    function formatSelectionLabel() {
      var bounds = getSelectionBounds();
      var start = columnLabel(bounds.left) + (bounds.top + 1);
      var end = columnLabel(bounds.right) + (bounds.bottom + 1);
      return start === end ? start : start + ":" + end;
    }

    function updateStatusSummary() {
      var cells;
      var count;
      var bounds;
      if (!statusBar) {
        return;
      }
      bounds = getSelectionBounds();
      cells = getSelectedCells();
      count = cells.length;
      statusBar.innerHTML = "";
      statusBar.appendChild(document.createTextNode("Spremno"));
      if (count > 1) {
        var rangeChip = document.createElement("span");
        rangeChip.textContent = formatSelectionLabel();
        statusBar.appendChild(rangeChip);
      }
      if (count > 1) {
        var countChip = document.createElement("span");
        countChip.textContent = count + " ćelija";
        statusBar.appendChild(countChip);
      }
      if (bounds.top === bounds.bottom && bounds.left === 0 && bounds.right === model.columnCount - 1) {
        var rowChip = document.createElement("span");
        rowChip.textContent = "Red " + (bounds.top + 1);
        statusBar.appendChild(rowChip);
      } else if (bounds.left === bounds.right && bounds.top === 0 && bounds.bottom === model.rowCount - 1) {
        var columnChip = document.createElement("span");
        columnChip.textContent = "Stupac " + columnLabel(bounds.left);
        statusBar.appendChild(columnChip);
      }
    }

    function parseReferenceBounds(reference) {
      var text = String(reference && typeof reference === "object" ? reference.reference : reference || "")
        .replace(/^.*!/, "")
        .replace(/\$/g, "")
        .toUpperCase()
        .trim();
      var parts = text.split(":");
      var start = parseCellReferenceText(parts[0]);
      var end = parseCellReferenceText(parts[1] || parts[0]);
      if (!start || !end) {
        return null;
      }
      return {
        top: Math.max(0, Math.min(start.rowIndex, end.rowIndex)),
        bottom: Math.min(model.rowCount - 1, Math.max(start.rowIndex, end.rowIndex)),
        left: Math.max(0, Math.min(start.columnIndex, end.columnIndex)),
        right: Math.min(model.columnCount - 1, Math.max(start.columnIndex, end.columnIndex)),
      };
    }

    function listFormulaReferenceBounds(value) {
      var raw = String(value || "");
      var refs = [];
      if (!isFormulaText(raw)) {
        return refs;
      }
      if (formulaTools && typeof formulaTools.listMeasurementFormulaReferences === "function") {
        try {
          refs = formulaTools.listMeasurementFormulaReferences(raw).map(function (entry) {
            if (entry && entry.startReference && entry.endReference) {
              return entry.startReference + ":" + entry.endReference;
            }
            return entry && (entry.reference || entry);
          });
        } catch (error) {
          refs = [];
        }
      }
      if (!refs.length) {
        raw.replace(/\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?/g, function (match) {
          refs.push(match);
          return match;
        });
      }
      return refs.map(parseReferenceBounds).filter(Boolean);
    }

    function ensureFormulaHighlightLayer() {
      var parent;
      var wrapper;
      if (!formulaInput || formulaHighlight) {
        return;
      }
      parent = formulaInput.parentElement;
      if (parent && parent.classList && parent.classList.contains("gridline-formula-input-wrap")) {
        formulaHighlight = parent.querySelector(".gridline-formula-highlight");
        formulaInput.classList.add("has-formula-highlight");
        return;
      }
      if (!parent || !parent.insertBefore) {
        return;
      }
      wrapper = document.createElement("div");
      wrapper.className = "gridline-formula-input-wrap";
      formulaHighlight = document.createElement("div");
      formulaHighlight.className = "gridline-formula-highlight";
      formulaHighlight.setAttribute("aria-hidden", "true");
      parent.insertBefore(wrapper, formulaInput);
      wrapper.appendChild(formulaHighlight);
      wrapper.appendChild(formulaInput);
      formulaInput.classList.add("has-formula-highlight");
    }

    function syncFormulaHighlightScroll() {
      if (formulaHighlight && formulaInput) {
        formulaHighlight.style.transform = "translateX(" + (-formulaInput.scrollLeft) + "px)";
      }
    }

    function renderFormulaHighlight() {
      var value;
      var regex;
      var cursor = 0;
      var referenceIndex = 0;
      var match;
      var token;
      if (!formulaHighlight || !formulaInput) {
        return;
      }
      value = String(formulaInput.value || "");
      clearNode(formulaHighlight);
      formulaInput.classList.toggle("is-colored-formula", isFormulaText(value));
      if (!isFormulaText(value)) {
        syncFormulaHighlightScroll();
        return;
      }
      regex = /\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?/g;
      while ((match = regex.exec(value))) {
        if (match.index > cursor) {
          formulaHighlight.appendChild(document.createTextNode(value.slice(cursor, match.index)));
        }
        token = document.createElement("span");
        token.className = "gridline-formula-token";
        token.style.setProperty("--gridline-reference-color", REFERENCE_COLORS[referenceIndex % REFERENCE_COLORS.length]);
        token.textContent = match[0];
        formulaHighlight.appendChild(token);
        cursor = match.index + match[0].length;
        referenceIndex += 1;
      }
      if (cursor < value.length) {
        formulaHighlight.appendChild(document.createTextNode(value.slice(cursor)));
      }
      syncFormulaHighlightScroll();
    }

    function updateReferenceHighlights() {
      referenceHighlights = listFormulaReferenceBounds(formulaInput && formulaInput.value);
      if (rootElement && rootElement.classList) {
        rootElement.classList.toggle("is-gridline-formula-mode", isFormulaText(formulaInput && formulaInput.value));
      }
      renderFormulaHighlight();
      Array.prototype.forEach.call(grid.querySelectorAll("td[data-row][data-column]"), function (node) {
        var row = Number(node.dataset.row);
        var column = Number(node.dataset.column);
        var highlightIndex = referenceHighlights.findIndex(function (bounds) {
          return row >= bounds.top && row <= bounds.bottom && column >= bounds.left && column <= bounds.right;
        });
        if (highlightIndex >= 0) {
          node.classList.add("is-formula-reference");
          node.style.setProperty("--gridline-reference-color", REFERENCE_COLORS[highlightIndex % REFERENCE_COLORS.length]);
        } else {
          node.classList.remove("is-formula-reference");
          node.style.removeProperty("--gridline-reference-color");
        }
      });
    }

    function updateHistoryButtons() {
      if (undoButton) {
        undoButton.disabled = !undoStack.length;
      }
      if (redoButton) {
        redoButton.disabled = !redoStack.length;
      }
    }

    function recordUndo() {
      if (isRestoringHistory) {
        return;
      }
      undoStack.push(cloneModel(model));
      if (undoStack.length > UNDO_LIMIT) {
        undoStack.shift();
      }
      redoStack = [];
      updateHistoryButtons();
    }

    function restoreHistorySnapshot(snapshot) {
      if (!snapshot) {
        return;
      }
      isRestoringHistory = true;
      model = normalizeModel(snapshot, options);
      active.row = Math.min(active.row, model.rowCount - 1);
      active.column = Math.min(active.column, model.columnCount - 1);
      selection = normalizeSelectionRange(selection, model.rowCount, model.columnCount);
      render();
      scheduleSave();
      isRestoringHistory = false;
      updateHistoryButtons();
    }

    function undo() {
      var snapshot = undoStack.pop();
      if (!snapshot) {
        return;
      }
      redoStack.push(cloneModel(model));
      restoreHistorySnapshot(snapshot);
    }

    function redo() {
      var snapshot = redoStack.pop();
      if (!snapshot) {
        return;
      }
      undoStack.push(cloneModel(model));
      restoreHistorySnapshot(snapshot);
    }

    function emitChange() {
      if (onChange) {
        onChange(cloneModel(model));
      }
    }

    function flushPendingChange() {
      if (saveTimer) {
        window.clearTimeout(saveTimer);
        saveTimer = 0;
      }
      writeStoredModel(storageKey, model);
      if (pendingExternalChange) {
        pendingExternalChange = false;
        emitChange();
      }
      setStatus(storageKey ? "Spremljeno lokalno" : "Spremno", "is-saved");
    }

    function scheduleSave() {
      setStatus(storageKey ? "Lokalna izmjena" : "Izmjena", "is-saving");
      pendingExternalChange = true;
      queueComputedRefresh();
      if (changeMode !== "debounced") {
        pendingExternalChange = false;
        emitChange();
      }
      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }
      saveTimer = window.setTimeout(function () {
        flushPendingChange();
      }, saveDelay);
    }

    function ensureSize(row, column) {
      var nextRowCount = model.rowCount;
      var nextColumnCount = model.columnCount;
      if (!autoGrow) {
        return false;
      }
      if (row >= nextRowCount) {
        nextRowCount = clampInteger(row + 1, nextRowCount, MIN_ROWS, MAX_ROWS);
      }
      if (column >= nextColumnCount) {
        nextColumnCount = clampInteger(column + 1, nextColumnCount, MIN_COLUMNS, MAX_COLUMNS);
      }
      if (nextRowCount === model.rowCount && nextColumnCount === model.columnCount) {
        return false;
      }
      model.rowCount = nextRowCount;
      model.columnCount = nextColumnCount;
      return true;
    }

    function attachFillHandle(td) {
      var handle;
      if (!td) {
        return;
      }
      Array.prototype.forEach.call(td.querySelectorAll(".gridline-fill-handle"), function (node) {
        node.remove();
      });
      handle = document.createElement("button");
      handle.type = "button";
      handle.className = "gridline-fill-handle";
      handle.title = "Povuci za Excel fill. Dvoklik kopira prema dolje.";
      handle.setAttribute("aria-label", "Excel fill");
      td.appendChild(handle);
    }

    function clearFillPreview() {
      Array.prototype.forEach.call(grid.querySelectorAll("td.is-fill-preview"), function (td) {
        td.classList.remove("is-fill-preview");
      });
    }

    function getCellFromPoint(clientX, clientY) {
      var element = document.elementFromPoint(clientX, clientY);
      var td = element && typeof element.closest === "function"
        ? element.closest("td[data-row][data-column]")
        : null;
      return td && grid.contains(td) ? td : null;
    }

    function getColumnHeaderFromPoint(clientX, clientY) {
      var element = document.elementFromPoint(clientX, clientY);
      var th = element && typeof element.closest === "function"
        ? element.closest("thead th[data-column]")
        : null;
      return th && grid.contains(th) ? th : null;
    }

    function autoScrollGridNearPointer(clientX, clientY) {
      var scrollElement = getGridScrollElement();
      var rect;
      var edge = 42;
      var speed = 22;
      if (!scrollElement || typeof scrollElement.getBoundingClientRect !== "function") {
        return;
      }
      rect = scrollElement.getBoundingClientRect();
      if (clientY > rect.bottom - edge) {
        scrollElement.scrollTop += speed;
      } else if (clientY < rect.top + edge) {
        scrollElement.scrollTop -= speed;
      }
      if (clientX > rect.right - edge) {
        scrollElement.scrollLeft += speed;
      } else if (clientX < rect.left + edge) {
        scrollElement.scrollLeft -= speed;
      }
    }

    function getCellFromEventTarget(target) {
      var td = target && typeof target.closest === "function"
        ? target.closest("td[data-row][data-column]")
        : null;
      return td && grid.contains(td) ? td : null;
    }

    function updateSelectionDragRange(row, column) {
      if (!selectionDrag) {
        return;
      }
      selection = {
        startRow: selectionDrag.startRow,
        startColumn: selectionDrag.startColumn,
        endRow: row,
        endColumn: column,
      };
      selectCell(row, column, {
        focus: false,
        preserveSelection: true,
      });
    }

    function updateColumnHeaderDragRange(column) {
      if (!selectionDrag) {
        return;
      }
      selection = {
        startRow: 0,
        startColumn: selectionDrag.startColumn,
        endRow: model.rowCount - 1,
        endColumn: column,
      };
      selectCell(active.row, column, {
        focus: false,
        preserveSelection: true,
      });
    }

    function finishSelectionDrag() {
      if (selectionDrag && selectionDrag.captureElement && typeof selectionDrag.captureElement.releasePointerCapture === "function") {
        try {
          selectionDrag.captureElement.releasePointerCapture(selectionDrag.pointerId);
        } catch (error) {
          // Pointer capture can already be released by the browser.
        }
      }
      document.removeEventListener("mousemove", handleSelectionMouseMove);
      document.removeEventListener("pointermove", handleSelectionPointerMove);
      document.removeEventListener("pointerup", handleSelectionPointerUp);
      document.body.classList.remove("is-selecting-gridline-cells");
      selectionDrag = null;
    }

    function handleSelectionPointerMove(event) {
      var td;
      if (!selectionDrag) {
        return;
      }
      event.preventDefault();
      autoScrollGridNearPointer(event.clientX, event.clientY);
      if (selectionDrag.mode === "column-header") {
        var th = getColumnHeaderFromPoint(event.clientX, event.clientY);
        if (th) {
          updateColumnHeaderDragRange(Number(th.dataset.column));
        }
        return;
      }
      td = getCellFromPoint(event.clientX, event.clientY);
      if (!td) {
        return;
      }
      updateSelectionDragRange(Number(td.dataset.row), Number(td.dataset.column));
    }

    function handleSelectionMouseMove(event) {
      var td;
      if (!selectionDrag || selectionDrag.mode !== "mouse") {
        return;
      }
      event.preventDefault();
      autoScrollGridNearPointer(event.clientX, event.clientY);
      td = getCellFromPoint(event.clientX, event.clientY);
      if (!td) {
        return;
      }
      updateSelectionDragRange(Number(td.dataset.row), Number(td.dataset.column));
    }

    function handleSelectionPointerUp(event) {
      finishSelectionDrag();
    }

    function handleGridMouseDown(event) {
      var cell;
      var handle = event.target && event.target.closest ? event.target.closest(".gridline-fill-handle") : null;
      var targetInput;
      var editingInput;
      var row;
      var column;
      if (event.button !== 0) {
        return;
      }
      if (selectionDrag && selectionDrag.mode === "pointer") {
        event.preventDefault();
        return;
      }
      if (handle && grid.contains(handle)) {
        event.preventDefault();
        event.stopPropagation();
        startFillDrag("mouse");
        return;
      }
      if (event.target && event.target.closest && (
        event.target.closest("[data-gridline-validation-row][data-gridline-validation-column]")
        || event.target.closest("[data-gridline-filter-column]")
        || event.target.closest("[data-gridline-column-resizer]")
        || event.target.closest("[data-gridline-row-resizer]")
      )) {
        return;
      }
      cell = getCellFromEventTarget(event.target);
      if (!cell) {
        return;
      }
      targetInput = getClosestCellInput(event.target);
      if (targetInput && isInputEditing(targetInput)) {
        return;
      }
      if (getFormulaInsertTarget()) {
        event.preventDefault();
        closeValidationPanel();
        closeFilterPanel();
        hideContextMenu();
        row = Number(cell.dataset.row);
        column = Number(cell.dataset.column);
        insertFormulaReference(formatCellReference(row, column));
        return;
      }
      if (editingCell) {
        editingInput = getInput(editingCell.row, editingCell.column);
        if (editingInput) {
          finishCellEdit(editingInput);
        }
      }
      event.preventDefault();
      closeValidationPanel();
      closeFilterPanel();
      hideContextMenu();
      row = Number(cell.dataset.row);
      column = Number(cell.dataset.column);
      if (event.shiftKey) {
        selectCell(row, column, {
          focus: false,
          extend: true,
        });
        return;
      }
      selectionDrag = {
        startRow: row,
        startColumn: column,
        pointerId: null,
        captureElement: null,
        mode: "mouse",
      };
      selectCell(row, column, { focus: false });
      grid.focus({ preventScroll: true });
      document.body.classList.add("is-selecting-gridline-cells");
      document.addEventListener("mousemove", handleSelectionMouseMove);
    }

    function handleGridMouseOver(event) {
      var cell;
      if (fillDrag && fillDrag.mode === "mouse") {
        cell = getCellFromEventTarget(event.target);
        if (!cell) {
          return;
        }
        event.preventDefault();
        updateFillDragTarget(Number(cell.dataset.row), Number(cell.dataset.column));
        return;
      }
      if (!selectionDrag || selectionDrag.mode !== "mouse") {
        return;
      }
      cell = getCellFromEventTarget(event.target);
      if (!cell) {
        return;
      }
      event.preventDefault();
      updateSelectionDragRange(Number(cell.dataset.row), Number(cell.dataset.column));
    }

    function handleDocumentMouseUp() {
      if (fillDrag && fillDrag.mode === "mouse") {
        finishFillDrag();
        return;
      }
      if (!selectionDrag || selectionDrag.mode !== "mouse") {
        return;
      }
      finishSelectionDrag();
    }

    function markFillPreview(targetRow, targetColumn) {
      var source;
      var bounds;
      var start;
      var end;
      var row;
      var index;
      var td;
      clearFillPreview();
      if (!fillDrag) {
        return;
      }
      source = fillDrag.source;
      bounds = fillDrag.sourceBounds || {
        top: source.row,
        bottom: source.row,
        left: source.column,
        right: source.column,
      };
      if (targetRow < bounds.top || targetRow > bounds.bottom) {
        start = targetRow < bounds.top ? targetRow : bounds.bottom + 1;
        end = targetRow < bounds.top ? bounds.top - 1 : targetRow;
        for (row = start; row <= end; row += 1) {
          for (index = bounds.left; index <= bounds.right; index += 1) {
            td = grid.querySelector('td[data-row="' + row + '"][data-column="' + index + '"]');
            if (td) {
              td.classList.add("is-fill-preview");
            }
          }
        }
        return;
      }
      if (targetColumn < bounds.left || targetColumn > bounds.right) {
        start = targetColumn < bounds.left ? targetColumn : bounds.right + 1;
        end = targetColumn < bounds.left ? bounds.left - 1 : targetColumn;
        for (index = start; index <= end; index += 1) {
          for (row = bounds.top; row <= bounds.bottom; row += 1) {
            td = grid.querySelector('td[data-row="' + row + '"][data-column="' + index + '"]');
            if (td) {
              td.classList.add("is-fill-preview");
            }
          }
        }
      }
    }

    function getFillSourceBounds() {
      var bounds = getSelectionBounds();
      if (isCellInSelection(active.row, active.column)) {
        return bounds;
      }
      return {
        top: active.row,
        bottom: active.row,
        left: active.column,
        right: active.column,
      };
    }

    function applyFillRange(targetRow, targetColumn) {
      var source;
      var sourceBounds;
      var sourceRowCount;
      var sourceColumnCount;
      var sourceValue;
      var start;
      var end;
      var index;
      var row;
      var column;
      var sourceRow;
      var sourceColumn;
      var rowOffset;
      var columnOffset;
      var changedSize = false;
      var isBlockFill = false;
      function getSeriesFillValue(rowOffset, columnOffset) {
        var numericSource = Number(String(sourceValue || "").trim().replace(",", "."));
        var previousValue;
        var numericPrevious;
        var step;
        if (isFormulaText(sourceValue)) {
          return shiftFormulaValue(sourceValue, rowOffset, columnOffset);
        }
        if (!Number.isFinite(numericSource)) {
          return sourceValue;
        }
        if (rowOffset) {
          previousValue = getValue(source.row - Math.sign(rowOffset), source.column);
        } else if (columnOffset) {
          previousValue = getValue(source.row, source.column - Math.sign(columnOffset));
        }
        numericPrevious = Number(String(previousValue || "").trim().replace(",", "."));
        if (!Number.isFinite(numericPrevious)) {
          return sourceValue;
        }
        step = numericSource - numericPrevious;
        return String(numericSource + (rowOffset || columnOffset) * step);
      }
      function getBlockFillValue(row, column, sourceRow, sourceColumn) {
        var value = getValue(sourceRow, sourceColumn);
        if (isFormulaText(value)) {
          return shiftFormulaValue(value, row - sourceRow, column - sourceColumn);
        }
        return value;
      }
      if (!fillDrag) {
        return;
      }
      source = fillDrag.source;
      sourceBounds = fillDrag.sourceBounds || {
        top: source.row,
        bottom: source.row,
        left: source.column,
        right: source.column,
      };
      sourceRowCount = Math.max(1, sourceBounds.bottom - sourceBounds.top + 1);
      sourceColumnCount = Math.max(1, sourceBounds.right - sourceBounds.left + 1);
      isBlockFill = sourceRowCount > 1 || sourceColumnCount > 1;
      sourceValue = getValue(source.row, source.column);
      recordUndo();
      if (targetRow < sourceBounds.top || targetRow > sourceBounds.bottom) {
        start = targetRow < sourceBounds.top ? targetRow : sourceBounds.bottom + 1;
        end = targetRow < sourceBounds.top ? sourceBounds.top - 1 : targetRow;
        if (ensureSize(Math.max(end, sourceBounds.bottom), sourceBounds.right)) {
          changedSize = true;
        }
        for (row = start; row <= end; row += 1) {
          sourceRow = targetRow < sourceBounds.top
            ? sourceBounds.bottom - ((sourceBounds.top - 1 - row) % sourceRowCount)
            : sourceBounds.top + ((row - sourceBounds.bottom - 1) % sourceRowCount);
          for (column = sourceBounds.left; column <= sourceBounds.right; column += 1) {
            if (isBlockFill) {
              setValue(row, column, getBlockFillValue(row, column, sourceRow, column));
            } else {
              rowOffset = row - source.row;
              setValue(row, column, getSeriesFillValue(rowOffset, 0));
            }
          }
        }
      } else if (targetColumn < sourceBounds.left || targetColumn > sourceBounds.right) {
        start = targetColumn < sourceBounds.left ? targetColumn : sourceBounds.right + 1;
        end = targetColumn < sourceBounds.left ? sourceBounds.left - 1 : targetColumn;
        if (ensureSize(sourceBounds.bottom, Math.max(end, sourceBounds.right))) {
          changedSize = true;
        }
        for (index = start; index <= end; index += 1) {
          sourceColumn = targetColumn < sourceBounds.left
            ? sourceBounds.right - ((sourceBounds.left - 1 - index) % sourceColumnCount)
            : sourceBounds.left + ((index - sourceBounds.right - 1) % sourceColumnCount);
          for (row = sourceBounds.top; row <= sourceBounds.bottom; row += 1) {
            if (isBlockFill) {
              setValue(row, index, getBlockFillValue(row, index, row, sourceColumn));
            } else {
              columnOffset = index - source.column;
              setValue(row, index, getSeriesFillValue(0, columnOffset));
            }
          }
        }
      }
      if (changedSize) {
        render();
      } else {
        refreshComputedCells();
      }
      scheduleSave();
    }

    function getLastNonEmptyRowInColumn(column, startRow) {
      var row;
      var last = startRow;
      for (row = startRow + 1; row < model.rowCount; row += 1) {
        if (String(getValue(row, column)).trim()) {
          last = row;
        } else if (last > startRow) {
          break;
        }
      }
      return last;
    }

    function getDoubleClickFillEndRow(source) {
      var leftEnd = source.column > 0 ? getLastNonEmptyRowInColumn(source.column - 1, source.row) : source.row;
      var rightEnd = source.column + 1 < model.columnCount ? getLastNonEmptyRowInColumn(source.column + 1, source.row) : source.row;
      var anyEnd = source.row;
      var row;
      for (row = source.row + 1; row < model.rowCount; row += 1) {
        if (Array.from({ length: model.columnCount }, function (_, column) {
          return column === source.column ? "" : getValue(row, column);
        }).some(function (value) { return String(value).trim(); })) {
          anyEnd = row;
        }
      }
      return Math.max(leftEnd, rightEnd, anyEnd);
    }

    function updateFillDragTarget(targetRow, targetColumn) {
      var bounds;
      if (!fillDrag) {
        return;
      }
      bounds = fillDrag.sourceBounds || {
        top: fillDrag.source.row,
        bottom: fillDrag.source.row,
        left: fillDrag.source.column,
        right: fillDrag.source.column,
      };
      if (Math.abs(targetRow - fillDrag.source.row) >= Math.abs(targetColumn - fillDrag.source.column)) {
        targetColumn = targetColumn < bounds.left || targetColumn > bounds.right
          ? fillDrag.source.column
          : Math.max(bounds.left, Math.min(bounds.right, targetColumn));
      } else {
        targetRow = targetRow < bounds.top || targetRow > bounds.bottom
          ? fillDrag.source.row
          : Math.max(bounds.top, Math.min(bounds.bottom, targetRow));
      }
      fillDrag.target = { row: targetRow, column: targetColumn };
      markFillPreview(targetRow, targetColumn);
    }

    function startFillDrag(mode) {
      flushPendingChange();
      fillDrag = {
        source: { row: active.row, column: active.column },
        sourceBounds: getFillSourceBounds(),
        target: null,
        mode: mode || "pointer",
      };
      document.body.classList.add("is-filling-gridline-cells");
      if (fillDrag.mode === "mouse") {
        document.addEventListener("mousemove", handleFillMouseMove);
      }
    }

    function finishFillDrag() {
      var target = fillDrag && fillDrag.target;
      document.removeEventListener("mousemove", handleFillMouseMove);
      document.removeEventListener("pointermove", handleFillPointerMove);
      document.removeEventListener("pointerup", handleFillPointerUp);
      clearFillPreview();
      if (target) {
        applyFillRange(target.row, target.column);
      }
      document.body.classList.remove("is-filling-gridline-cells");
      fillDrag = null;
    }

    function handleFillPointerMove(event) {
      var td;
      if (!fillDrag) {
        return;
      }
      event.preventDefault();
      autoScrollGridNearPointer(event.clientX, event.clientY);
      td = getCellFromPoint(event.clientX, event.clientY);
      if (!td) {
        return;
      }
      updateFillDragTarget(Number(td.dataset.row), Number(td.dataset.column));
    }

    function handleFillMouseMove(event) {
      var td;
      if (!fillDrag || fillDrag.mode !== "mouse") {
        return;
      }
      event.preventDefault();
      autoScrollGridNearPointer(event.clientX, event.clientY);
      td = getCellFromPoint(event.clientX, event.clientY);
      if (!td) {
        return;
      }
      updateFillDragTarget(Number(td.dataset.row), Number(td.dataset.column));
    }

    function handleFillPointerUp() {
      finishFillDrag();
    }

    function handleFillPointerDown(event) {
      var handle = event.target && event.target.closest ? event.target.closest(".gridline-fill-handle") : null;
      if (!handle) {
        return;
      }
      if (event.pointerType === "mouse") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      startFillDrag("pointer");
      document.addEventListener("pointermove", handleFillPointerMove);
      document.addEventListener("pointerup", handleFillPointerUp, { once: true });
    }

    function handleColumnResizeMove(event) {
      var nextWidth;
      if (!columnResize) {
        return;
      }
      event.preventDefault();
      nextWidth = clampInteger(
        columnResize.startWidth + (event.clientX - columnResize.startX),
        columnResize.startWidth,
        MIN_COLUMN_WIDTH,
        MAX_COLUMN_WIDTH
      );
      if (!model.columnWidths) {
        model.columnWidths = Object.create(null);
      }
      model.columnWidths[String(columnResize.column)] = nextWidth;
      render();
      selectCell(active.row, active.column, { focus: false });
    }

    function handleColumnResizeUp() {
      if (!columnResize) {
        return;
      }
      document.removeEventListener("pointermove", handleColumnResizeMove);
      document.removeEventListener("pointerup", handleColumnResizeUp);
      columnResize = null;
      scheduleSave();
    }

    function handleRowResizeMove(event) {
      var nextHeight;
      if (!rowResize) {
        return;
      }
      event.preventDefault();
      nextHeight = clampInteger(
        rowResize.startHeight + (event.clientY - rowResize.startY),
        rowResize.startHeight,
        MIN_ROW_HEIGHT,
        MAX_ROW_HEIGHT
      );
      if (!model.rowHeights) {
        model.rowHeights = Object.create(null);
      }
      model.rowHeights[String(rowResize.row)] = nextHeight;
      render();
      selectCell(active.row, active.column, { focus: false });
    }

    function handleRowResizeUp() {
      if (!rowResize) {
        return;
      }
      document.removeEventListener("pointermove", handleRowResizeMove);
      document.removeEventListener("pointerup", handleRowResizeUp);
      rowResize = null;
      scheduleSave();
    }

    function closeValidationPanel() {
      if (validationPanel) {
        validationPanel.remove();
        validationPanel = null;
      }
    }

    function closeFilterPanel() {
      if (filterPanel) {
        filterPanel.remove();
        filterPanel = null;
      }
    }

    function showValidationDropdown(event, row, column) {
      var values = getAllowedValues(row, column);
      var search;
      var list;
      var rect;
      if (!values.length || !rootElement) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      closeValidationPanel();
      validationPanel = document.createElement("section");
      validationPanel.className = "gridline-popover gridline-validation-panel";
      validationPanel.setAttribute("role", "listbox");
      rect = event.target.getBoundingClientRect();
      validationPanel.style.left = Math.min(rect.left, window.innerWidth - 300) + "px";
      validationPanel.style.top = Math.min(rect.bottom + 4, window.innerHeight - 320) + "px";
      search = document.createElement("input");
      search.type = "search";
      search.placeholder = "Trazi vrijednost...";
      search.className = "gridline-dropdown-search";
      list = document.createElement("div");
      list.className = "gridline-dropdown-list";
      function renderValues(filterText) {
        clearNode(list);
        values.filter(function (value) {
          return !filterText || value.toLowerCase().indexOf(filterText.toLowerCase()) >= 0;
        }).forEach(function (value) {
          var button = document.createElement("button");
          button.type = "button";
          button.textContent = value;
          button.addEventListener("click", function () {
            recordUndo();
            setValue(row, column, value);
            closeValidationPanel();
            render();
            selectCell(row, column, { focus: false });
            scheduleSave();
          });
          list.appendChild(button);
        });
      }
      search.addEventListener("input", function () {
        renderValues(search.value);
      });
      search.addEventListener("keydown", function (keyboardEvent) {
        var firstButton;
        if (keyboardEvent.key === "Escape") {
          keyboardEvent.preventDefault();
          closeValidationPanel();
          return;
        }
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === "ArrowDown") {
          keyboardEvent.preventDefault();
          firstButton = list.querySelector("button");
          if (firstButton) {
            firstButton.focus();
          }
        }
      });
      validationPanel.append(search, list);
      document.body.appendChild(validationPanel);
      renderValues("");
      search.focus();
    }

    function getUniqueColumnValues(column) {
      var seen = Object.create(null);
      var values = [];
      var row;
      for (row = 0; row < model.rowCount; row += 1) {
        var value = String(getDisplayValue(row, column) || "");
        if (!seen[value]) {
          seen[value] = true;
          values.push(value);
        }
      }
      return values.sort(function (left, right) {
        return left.localeCompare(right, "hr", { numeric: true, sensitivity: "base" });
      });
    }

    function showFilterPanel(event, column) {
      var values = getUniqueColumnValues(column);
      var current = columnFilters[String(column)] || values.slice();
      var search;
      var list;
      var actions;
      var rect;
      event.preventDefault();
      event.stopPropagation();
      closeFilterPanel();
      filterPanel = document.createElement("section");
      filterPanel.className = "gridline-popover gridline-filter-panel";
      rect = event.target.getBoundingClientRect();
      filterPanel.style.left = Math.min(rect.left, window.innerWidth - 340) + "px";
      filterPanel.style.top = Math.min(rect.bottom + 4, window.innerHeight - 420) + "px";
      search = document.createElement("input");
      search.type = "search";
      search.placeholder = "Filter...";
      search.className = "gridline-dropdown-search";
      list = document.createElement("div");
      list.className = "gridline-filter-values";
      function renderFilterValues(filterText) {
        clearNode(list);
        values.filter(function (value) {
          return !filterText || value.toLowerCase().indexOf(filterText.toLowerCase()) >= 0;
        }).forEach(function (value) {
          var label = document.createElement("label");
          var checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = current.indexOf(value) >= 0;
          checkbox.addEventListener("change", function () {
            if (checkbox.checked && current.indexOf(value) < 0) {
              current.push(value);
            } else if (!checkbox.checked) {
              current = current.filter(function (entry) { return entry !== value; });
            }
          });
          label.append(checkbox, document.createTextNode(value || "(prazno)"));
          list.appendChild(label);
        });
      }
      actions = createPopoverActions([
        (function () {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "ghost-button";
          button.textContent = "A-Z";
          button.addEventListener("click", function () {
            closeFilterPanel();
            sortByColumn(column, "asc");
          });
          return button;
        }()),
        (function () {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "ghost-button";
          button.textContent = "Z-A";
          button.addEventListener("click", function () {
            closeFilterPanel();
            sortByColumn(column, "desc");
          });
          return button;
        }()),
        (function () {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "ghost-button";
          button.textContent = "Ocisti";
          button.addEventListener("click", function () {
            delete columnFilters[String(column)];
            closeFilterPanel();
            render();
          });
          return button;
        }()),
        (function () {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "primary-button";
          button.textContent = "Primijeni";
          button.addEventListener("click", function () {
            columnFilters[String(column)] = current.slice();
            closeFilterPanel();
            render();
          });
          return button;
        }()),
      ]);
      search.addEventListener("input", function () {
        renderFilterValues(search.value);
      });
      filterPanel.append(
        createPopoverHeader("Filter " + columnLabel(column), "Odaberi vrijednosti ili sortiraj kolonu."),
        search,
        list,
        actions
      );
      document.body.appendChild(filterPanel);
      renderFilterValues("");
      search.focus();
    }

    function formatCellReference(row, column) {
      return columnLabel(column) + String(row + 1);
    }

    function getFormulaInsertTarget() {
      var editingInput = editingCell ? getInput(editingCell.row, editingCell.column) : null;
      if (editingInput && document.activeElement === editingInput && isFormulaText(editingInput.value)) {
        return editingInput;
      }
      if (document.activeElement === formulaInput && isFormulaText(formulaInput.value)) {
        return formulaInput;
      }
      return null;
    }

    function syncFormulaTargetValue(target) {
      var row;
      var column;
      if (target === formulaInput) {
        handleFormulaInput();
        return;
      }
      if (!target || !target.dataset) {
        return;
      }
      if (target.dataset.gridlineUndoRecorded !== "true") {
        recordUndo();
        target.dataset.gridlineUndoRecorded = "true";
      }
      row = Number(target.dataset.row);
      column = Number(target.dataset.column);
      setValue(row, column, target.value);
      target.dataset.rawValue = target.value;
      target.classList.toggle("is-formula", isFormulaText(target.value));
      if (row === active.row && column === active.column) {
        formulaInput.value = target.value;
      }
      updateReferenceHighlights();
      scheduleSave();
    }

    function insertFormulaReference(referenceText) {
      var target = getFormulaInsertTarget() || formulaInput;
      var start = target.selectionStart == null ? target.value.length : target.selectionStart;
      var end = target.selectionEnd == null ? target.value.length : target.selectionEnd;
      var value = target.value || "=";
      if (!value.trim().startsWith("=")) {
        value = "=";
        start = 1;
        end = 1;
      }
      target.value = value.slice(0, start) + referenceText + value.slice(end);
      target.focus();
      if (typeof target.setSelectionRange === "function") {
        target.setSelectionRange(start + referenceText.length, start + referenceText.length);
      }
      syncFormulaTargetValue(target);
    }

    function handleGridPointerDown(event) {
      var resizer = event.target && event.target.closest
        ? event.target.closest("[data-gridline-column-resizer]")
        : null;
      var rowResizer = event.target && event.target.closest
        ? event.target.closest("[data-gridline-row-resizer]")
        : null;
      var columnHeader = event.target && event.target.closest
        ? event.target.closest("thead th[data-column]")
        : null;
      var rowHeader = event.target && event.target.closest
        ? event.target.closest("tbody th[data-row-header]")
        : null;
      var filterTrigger = event.target && event.target.closest
        ? event.target.closest("[data-gridline-filter-column]")
        : null;
      var validationTrigger = event.target && event.target.closest
        ? event.target.closest("[data-gridline-validation-row][data-gridline-validation-column]")
        : null;
      var input;
      var cell;
      if (filterTrigger && grid.contains(filterTrigger)) {
        showFilterPanel(event, clampInteger(filterTrigger.dataset.gridlineFilterColumn, active.column, 0, model.columnCount - 1));
        return;
      }
      if (validationTrigger && grid.contains(validationTrigger)) {
        showValidationDropdown(
          event,
          clampInteger(validationTrigger.dataset.gridlineValidationRow, active.row, 0, model.rowCount - 1),
          clampInteger(validationTrigger.dataset.gridlineValidationColumn, active.column, 0, model.columnCount - 1)
        );
        return;
      }
      if (resizer && grid.contains(resizer)) {
        event.preventDefault();
        event.stopPropagation();
        recordUndo();
        columnResize = {
          column: clampInteger(resizer.dataset.gridlineColumnResizer, active.column, 0, model.columnCount - 1),
          startX: event.clientX,
          startWidth: getColumnWidth(clampInteger(resizer.dataset.gridlineColumnResizer, active.column, 0, model.columnCount - 1)),
        };
        document.addEventListener("pointermove", handleColumnResizeMove);
        document.addEventListener("pointerup", handleColumnResizeUp);
        return;
      }
      if (rowResizer && grid.contains(rowResizer)) {
        event.preventDefault();
        event.stopPropagation();
        recordUndo();
        rowResize = {
          row: clampInteger(rowResizer.dataset.gridlineRowResizer, active.row, 0, model.rowCount - 1),
          startY: event.clientY,
          startHeight: getRowHeight(clampInteger(rowResizer.dataset.gridlineRowResizer, active.row, 0, model.rowCount - 1)),
        };
        document.addEventListener("pointermove", handleRowResizeMove);
        document.addEventListener("pointerup", handleRowResizeUp);
        return;
      }
      if (columnHeader && grid.contains(columnHeader) && event.button === 0) {
        var headerColumn = Number(columnHeader.dataset.column);
        event.preventDefault();
        selectionDrag = {
          startRow: 0,
          startColumn: headerColumn,
          pointerId: event.pointerId,
          captureElement: columnHeader,
          mode: "column-header",
        };
        updateColumnHeaderDragRange(headerColumn);
        grid.focus({ preventScroll: true });
        if (typeof columnHeader.setPointerCapture === "function") {
          try {
            columnHeader.setPointerCapture(event.pointerId);
          } catch (error) {
            selectionDrag.captureElement = null;
          }
        }
        document.body.classList.add("is-selecting-gridline-cells");
        document.addEventListener("pointermove", handleSelectionPointerMove);
        document.addEventListener("pointerup", handleSelectionPointerUp, { once: true });
        return;
      }
      if (rowHeader && grid.contains(rowHeader) && event.button === 0) {
        var headerRow = Number(rowHeader.dataset.rowHeader);
        event.preventDefault();
        selection = {
          startRow: headerRow,
          startColumn: 0,
          endRow: headerRow,
          endColumn: model.columnCount - 1,
        };
        selectCell(headerRow, active.column, { focus: false, preserveSelection: true });
        grid.focus({ preventScroll: true });
        return;
      }
      handleFillPointerDown(event);
      if (fillDrag) {
        return;
      }
      if (event.button && event.button !== 0) {
        return;
      }
      cell = event.target && event.target.closest
        ? event.target.closest("td[data-row][data-column]")
        : null;
      if (cell && grid.contains(cell)) {
        var pointerTargetInput = getClosestCellInput(event.target);
        var pointerEditingInput;
        if (pointerTargetInput && isInputEditing(pointerTargetInput)) {
          return;
        }
        if (getFormulaInsertTarget()) {
          event.preventDefault();
          closeValidationPanel();
          closeFilterPanel();
          hideContextMenu();
          insertFormulaReference(formatCellReference(Number(cell.dataset.row), Number(cell.dataset.column)));
          return;
        }
        if (editingCell) {
          pointerEditingInput = getInput(editingCell.row, editingCell.column);
          if (pointerEditingInput) {
            finishCellEdit(pointerEditingInput);
          }
        }
        event.preventDefault();
        closeValidationPanel();
        closeFilterPanel();
        hideContextMenu();
        if (event.shiftKey) {
          selectCell(Number(cell.dataset.row), Number(cell.dataset.column), {
            focus: false,
            extend: true,
          });
          return;
        }
        selectionDrag = {
          startRow: Number(cell.dataset.row),
          startColumn: Number(cell.dataset.column),
          pointerId: event.pointerId,
          captureElement: cell,
          mode: "pointer",
        };
        selectCell(selectionDrag.startRow, selectionDrag.startColumn, { focus: false });
        grid.focus({ preventScroll: true });
        if (typeof cell.setPointerCapture === "function") {
          try {
            cell.setPointerCapture(event.pointerId);
          } catch (error) {
            selectionDrag.captureElement = null;
          }
        }
        document.body.classList.add("is-selecting-gridline-cells");
        document.addEventListener("pointermove", handleSelectionPointerMove);
        document.addEventListener("pointerup", handleSelectionPointerUp, { once: true });
        return;
      }
      input = getClosestCellInput(event.target);
      if (input && event.shiftKey) {
        selectCell(Number(input.dataset.row), Number(input.dataset.column), {
          focus: false,
          extend: true,
        });
      }
    }

    function handleFillDoubleClick(event) {
      var handle = event.target && event.target.closest ? event.target.closest(".gridline-fill-handle") : null;
      var cell;
      var input;
      var endRow;
      if (!handle) {
        cell = event.target && event.target.closest ? event.target.closest("td[data-row][data-column]") : null;
        if (cell && grid.contains(cell)) {
          event.preventDefault();
          beginCellEdit(Number(cell.dataset.row), Number(cell.dataset.column), null, false);
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      flushPendingChange();
      fillDrag = {
        source: { row: active.row, column: active.column },
        sourceBounds: getFillSourceBounds(),
        target: null,
      };
      endRow = getDoubleClickFillEndRow(fillDrag.source);
      if (endRow > fillDrag.source.row) {
        applyFillRange(endRow, fillDrag.source.column);
      }
      fillDrag = null;
    }

    function selectCell(row, column, selectOptions) {
      var focus = !selectOptions || selectOptions.focus !== false;
      var extend = Boolean(selectOptions && selectOptions.extend);
      var preserveSelection = Boolean(selectOptions && selectOptions.preserveSelection);
      var input;
      var td;
      var start = getMergeStart(
        Math.max(0, Math.min(model.rowCount - 1, row)),
        Math.max(0, Math.min(model.columnCount - 1, column))
      );
      active = {
        row: start.row,
        column: start.column,
      };
      if (preserveSelection) {
        selection = normalizeSelectionRange(selection, model.rowCount, model.columnCount);
      } else if (extend) {
        selection = {
          startRow: selection.startRow,
          startColumn: selection.startColumn,
          endRow: active.row,
          endColumn: active.column,
        };
      } else {
        selection = {
          startRow: active.row,
          startColumn: active.column,
          endRow: active.row,
          endColumn: active.column,
        };
      }
      if (selectedCell) {
        selectedCell.classList.remove("is-selected");
        Array.prototype.forEach.call(selectedCell.querySelectorAll(".gridline-fill-handle"), function (node) {
          node.remove();
        });
        selectedCell = null;
      }
      input = getInput(active.row, active.column);
      td = input ? input.parentElement : null;
      if (td) {
        td.classList.add("is-selected");
        selectedCell = td;
        attachFillHandle(td);
      }
      cellRef.textContent = formatSelectionLabel();
      formulaInput.value = getValue(active.row, active.column);
      syncToolbarState();
      Array.prototype.forEach.call(grid.querySelectorAll("td.is-range-selected"), function (node) {
        node.classList.remove("is-range-selected");
      });
      Array.prototype.forEach.call(grid.querySelectorAll("th.is-range-selected-header"), function (node) {
        node.classList.remove("is-range-selected-header");
      });
      Array.prototype.forEach.call(grid.querySelectorAll("td[data-row][data-column]"), function (node) {
        if (isCellInSelection(Number(node.dataset.row), Number(node.dataset.column))) {
          node.classList.add("is-range-selected");
        }
      });
      (function markSelectionHeaders() {
        var bounds = getSelectionBounds();
        var columnIndex;
        var rowIndex;
        for (columnIndex = bounds.left; columnIndex <= bounds.right; columnIndex += 1) {
          var columnHead = grid.querySelector('thead th[data-column="' + columnIndex + '"]');
          if (columnHead) {
            columnHead.classList.add("is-range-selected-header");
          }
        }
        for (rowIndex = bounds.top; rowIndex <= bounds.bottom; rowIndex += 1) {
          var rowHead = grid.querySelector('tbody th[data-row-header="' + rowIndex + '"]');
          if (rowHead) {
            rowHead.classList.add("is-range-selected-header");
          }
        }
      })();
      if (input) {
        syncInputDisplay(input, focus || isInputEditing(input));
      }
      if (focus && input && isInputEditing(input)) {
        input.focus();
        input.select();
        editingSnapshot = {
          row: active.row,
          column: active.column,
          value: getValue(active.row, active.column),
        };
      } else if (focus && grid && typeof grid.focus === "function") {
        grid.focus({ preventScroll: true });
      }
      updateStatusSummary();
      updateReferenceHighlights();
    }

    function isRowFilteredOut(row) {
      var filterColumns = Object.keys(columnFilters || {});
      if (!filterColumns.length) {
        return false;
      }
      return filterColumns.some(function (columnKey) {
        var allowed = columnFilters[columnKey];
        if (!allowed || !allowed.length) {
          return false;
        }
        return allowed.indexOf(String(getDisplayValue(row, Number(columnKey)) || "")) < 0;
      });
    }

    function render() {
      var fragment = document.createDocumentFragment();
      var thead = document.createElement("thead");
      var headRow = document.createElement("tr");
      var corner = document.createElement("th");
      var tbody = document.createElement("tbody");
      var row;
      var column;
      var th;
      var tr;
      var rowHead;
      var td;
      var input;

      corner.className = "corner";
      headRow.appendChild(corner);
      for (column = 0; column < model.columnCount; column += 1) {
        var columnAi = model.aiColumns && model.aiColumns[String(column)];
        var resizer = document.createElement("button");
        th = document.createElement("th");
        th.dataset.column = String(column);
        th.dataset.gridlineColumnHeader = String(column);
        th.style.width = getColumnWidth(column) + "px";
        th.style.minWidth = getColumnWidth(column) + "px";
        th.classList.toggle("has-ai-column", Boolean(enableColumnAiSettings && columnAi && columnAi.enabled !== false));
        th.classList.toggle("is-filtered", Boolean(columnFilters[String(column)]));
        th.title = enableColumnAiSettings
          ? (columnAi ? "Desni klik: NexAI postavke kolone" : "Povuci rub za promjenu sirine. Desni klik: NexAI postavke kolone")
          : "Povuci rub za promjenu sirine.";
        th.appendChild(document.createTextNode(columnLabel(column)));
        resizer.type = "button";
        resizer.className = "gridline-column-resizer";
        resizer.dataset.gridlineColumnResizer = String(column);
        resizer.setAttribute("aria-label", "Promijeni širinu kolone " + columnLabel(column));
        th.appendChild(resizer);
        headRow.appendChild(th);
      }
      thead.appendChild(headRow);
      fragment.appendChild(thead);

      for (row = 0; row < model.rowCount; row += 1) {
        tr = document.createElement("tr");
        tr.style.height = getRowHeight(row) + "px";
        tr.hidden = isRowFilteredOut(row);
        rowHead = document.createElement("th");
        rowHead.dataset.rowHeader = String(row);
        rowHead.style.height = getRowHeight(row) + "px";
        rowHead.classList.toggle("is-header-row", isHeaderRow(row));
        if (isHeaderRow(row)) {
          rowHead.title = "Naslovni red koji se ponavlja u PDF-u";
        }
        rowHead.appendChild(document.createTextNode(String(row + 1)));
        var rowResizer = document.createElement("button");
        rowResizer.type = "button";
        rowResizer.className = "gridline-row-resizer";
        rowResizer.dataset.gridlineRowResizer = String(row);
        rowResizer.setAttribute("aria-label", "Promijeni visinu reda " + (row + 1));
        rowHead.appendChild(rowResizer);
        tr.appendChild(rowHead);
        for (column = 0; column < model.columnCount; column += 1) {
          var merge = getCoveringMerge(row, column);
          var cellStyle = getCellStyle(row, column);
          var semanticStatus = getCellSemanticStatus(row, column);
          if (isCoveredByMerge(row, column)) {
            continue;
          }
          td = document.createElement("td");
          td.dataset.row = String(row);
          td.dataset.column = String(column);
          td.style.width = getColumnSpanWidth(column, merge ? merge.columnSpan : 1) + "px";
          td.style.minWidth = td.style.width;
          td.style.height = getRowHeight(row) + "px";
          if (merge) {
            td.colSpan = merge.columnSpan;
            td.rowSpan = merge.rowSpan;
            td.classList.add("is-merged-cell");
          }
          if (model.autoBorderFilled && String(getValue(row, column)).trim()) {
            cellStyle = Object.assign({}, cellStyle || {}, { border: (cellStyle && cellStyle.border) || "all" });
            td.classList.add("is-auto-border-filled");
          }
          if (semanticStatus) {
            td.classList.add("is-gridline-" + semanticStatus + "-result");
          }
          if (isCellInSelection(row, column)) {
            td.classList.add("is-range-selected");
          }
          input = document.createElement("textarea");
          input.className = merge ? "cell is-merged-input" : "cell";
          input.rows = 1;
          input.autocomplete = "off";
          input.spellcheck = false;
          input.dataset.row = String(row);
          input.dataset.column = String(column);
          applyCellStyleToElement(td, input, cellStyle);
          syncInputDisplay(input, false);
          td.appendChild(input);
          if (getAllowedValues(row, column).length) {
            var dropdownButton = document.createElement("button");
            dropdownButton.type = "button";
            dropdownButton.className = "gridline-validation-button";
            dropdownButton.dataset.gridlineValidationRow = String(row);
            dropdownButton.dataset.gridlineValidationColumn = String(column);
            dropdownButton.setAttribute("aria-label", "Odaberi vrijednost");
            dropdownButton.textContent = "⌄";
            td.appendChild(dropdownButton);
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      fragment.appendChild(tbody);
      clearNode(grid);
      selectedCell = null;
      grid.appendChild(fragment);
      selectCell(active.row, active.column, { focus: false });
      applyZoom();
    }

    function serializeSelection() {
      var bounds = getSelectionBounds();
      var rows = [];
      var row;
      var column;
      for (row = bounds.top; row <= bounds.bottom; row += 1) {
        var values = [];
        for (column = bounds.left; column <= bounds.right; column += 1) {
          values.push(getValue(row, column));
        }
        rows.push(values.join("\t"));
      }
      return rows.join("\n");
    }

    function writeClipboardText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(function () {});
      }
      return Promise.resolve();
    }

    function clearSelectionValues() {
      getSelectedCells().forEach(function (cell) {
        setValue(cell.row, cell.column, "");
      });
      render();
      syncToolbarState();
      scheduleSave();
    }

    function copySelection(cut) {
      var text = serializeSelection();
      if (!text && text !== "") {
        return;
      }
      writeClipboardText(text);
      if (cut) {
        recordUndo();
        clearSelectionValues();
        setStatus("Izrezano", "is-saving");
      } else {
        setStatus("Kopirano", "is-saved");
      }
    }

    function applyClipboardMatrix(matrix) {
      var rows = (Array.isArray(matrix) ? matrix : [])
        .map(function (row) {
          return (Array.isArray(row) ? row : [row]).map(function (value) {
            return String(value == null ? "" : value);
          });
        })
        .filter(function (row) { return row.length > 0; });
      var changedSize = false;
      var lastRow;
      var lastColumn;
      if (!rows.length) {
        return false;
      }
      recordUndo();
      rows.forEach(function (rowValues, rowOffset) {
        rowValues.forEach(function (value, columnOffset) {
          var row = active.row + rowOffset;
          var column = active.column + columnOffset;
          var input;
          if (row >= model.rowCount || column >= model.columnCount) {
            changedSize = ensureSize(row, column) || changedSize;
          }
          if (row >= model.rowCount || column >= model.columnCount) {
            return;
          }
          setValue(row, column, value);
          input = getInput(row, column);
          if (input) {
            syncInputDisplay(input, row === active.row && column === active.column);
          }
        });
      });
      lastRow = Math.min(model.rowCount - 1, active.row + rows.length - 1);
      lastColumn = Math.min(model.columnCount - 1, active.column + rows.reduce(function (max, row) {
        return Math.max(max, row.length);
      }, 1) - 1);
      if (changedSize) {
        render();
      }
      selection = {
        startRow: active.row,
        startColumn: active.column,
        endRow: lastRow,
        endColumn: lastColumn,
      };
      selectCell(active.row, active.column, { focus: false, preserveSelection: true });
      formulaInput.value = getValue(active.row, active.column);
      scheduleSave();
      return true;
    }

    function parseClipboardHtmlTable(html) {
      var source = String(html || "");
      var parser;
      var doc;
      var table;
      var matrix = [];
      if (!source || source.toLowerCase().indexOf("<table") === -1 || typeof DOMParser === "undefined") {
        return null;
      }
      try {
        parser = new DOMParser();
        doc = parser.parseFromString(source, "text/html");
        table = doc.querySelector("table");
      } catch (error) {
        table = null;
      }
      if (!table) {
        return null;
      }
      Array.prototype.forEach.call(table.rows, function (tr, rowIndex) {
        var columnIndex = 0;
        matrix[rowIndex] = matrix[rowIndex] || [];
        Array.prototype.forEach.call(tr.cells, function (cell) {
          var rowSpan = clampInteger(cell.getAttribute("rowspan"), 1, 1, 200);
          var columnSpan = clampInteger(cell.getAttribute("colspan"), 1, 1, 200);
          var text = String(cell.textContent || "")
            .replace(/\r/g, "")
            .replace(/\u00a0/g, " ")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n[ \t]+/g, "\n")
            .trim();
          var rowOffset;
          var columnOffset;
          while (matrix[rowIndex][columnIndex] !== undefined) {
            columnIndex += 1;
          }
          for (rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
            matrix[rowIndex + rowOffset] = matrix[rowIndex + rowOffset] || [];
            for (columnOffset = 0; columnOffset < columnSpan; columnOffset += 1) {
              matrix[rowIndex + rowOffset][columnIndex + columnOffset] = rowOffset === 0 && columnOffset === 0 ? text : "";
            }
          }
          columnIndex += columnSpan;
        });
      });
      return matrix.map(function (row) {
        var last = row.length - 1;
        while (last > 0 && String(row[last] || "") === "") {
          last -= 1;
        }
        return row.slice(0, last + 1).map(function (value) { return value || ""; });
      }).filter(function (row) {
        return row.some(function (value) { return String(value || "").trim(); });
      });
    }

    function applyClipboardText(text) {
      var sourceText = String(text == null ? "" : text).replace(/\r/g, "");
      if (sourceText.indexOf("\t") === -1 && sourceText.indexOf("\n") === -1) {
        return applyClipboardMatrix([[sourceText]]);
      }
      return applyClipboardMatrix(sourceText.split("\n").filter(function (row) {
        return row.length > 0;
      }).map(function (line) {
        return line.split("\t");
      }));
    }

    function handlePaste(event) {
      var html = event.clipboardData ? event.clipboardData.getData("text/html") : "";
      var text = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
      var matrix = parseClipboardHtmlTable(html);
      if (!matrix && !text && text !== "") {
        return;
      }
      event.preventDefault();
      if (matrix && matrix.length) {
        applyClipboardMatrix(matrix);
      } else {
        applyClipboardText(text);
      }
    }

    function handleCopy(event) {
      event.preventDefault();
      event.clipboardData.setData("text/plain", serializeSelection());
      setStatus("Kopirano", "is-saved");
    }

    function handleCut(event) {
      event.preventDefault();
      event.clipboardData.setData("text/plain", serializeSelection());
      recordUndo();
      clearSelectionValues();
      setStatus("Izrezano", "is-saving");
    }

    function handleFocusIn(event) {
      var input = getClosestCellInput(event.target);
      if (!input) {
        return;
      }
      if (selectionDrag) {
        if (!isInputEditing(input)) {
          window.setTimeout(function () {
            if (!isInputEditing(input) && document.activeElement === input) {
              grid.focus({ preventScroll: true });
            }
          }, 0);
        }
        return;
      }
      selectCell(Number(input.dataset.row), Number(input.dataset.column), { focus: false });
      if (!isInputEditing(input)) {
        window.setTimeout(function () {
          if (!isInputEditing(input) && document.activeElement === input) {
            grid.focus({ preventScroll: true });
          }
        }, 0);
      }
    }

    function handleFocusOut(event) {
      var input = getClosestCellInput(event.target);
      if (!input) {
        return;
      }
      window.setTimeout(function () {
        if (isInputEditing(input) && document.activeElement !== input) {
          finishCellEdit(input);
          return;
        }
        if (!isInputEditing(input)) {
          input.dataset.gridlineUndoRecorded = "";
          syncInputDisplay(input, false);
        }
      }, 0);
    }

    function handleInput(event) {
      var input = getClosestCellInput(event.target);
      var row;
      var column;
      if (!input) {
        return;
      }
      if (!isInputEditing(input)) {
        event.preventDefault();
        syncInputDisplay(input, false);
        return;
      }
      if (input.dataset.gridlineUndoRecorded !== "true") {
        recordUndo();
        input.dataset.gridlineUndoRecorded = "true";
      }
      row = Number(input.dataset.row);
      column = Number(input.dataset.column);
      setValue(row, column, input.value);
      if (row === active.row && column === active.column) {
        formulaInput.value = input.value;
      }
      updateReferenceHighlights();
      scheduleSave();
    }

    function insertTextIntoCellEditor(input, text) {
      var start;
      var end;
      var row;
      var column;
      if (!input || !isInputEditing(input)) {
        return;
      }
      if (input.dataset.gridlineUndoRecorded !== "true") {
        recordUndo();
        input.dataset.gridlineUndoRecorded = "true";
      }
      start = input.selectionStart == null ? input.value.length : input.selectionStart;
      end = input.selectionEnd == null ? input.value.length : input.selectionEnd;
      input.value = input.value.slice(0, start) + text + input.value.slice(end);
      if (typeof input.setSelectionRange === "function") {
        input.setSelectionRange(start + text.length, start + text.length);
      }
      row = Number(input.dataset.row);
      column = Number(input.dataset.column);
      setValue(row, column, input.value);
      input.dataset.rawValue = input.value;
      if (row === active.row && column === active.column) {
        formulaInput.value = input.value;
      }
      updateReferenceHighlights();
      scheduleSave();
    }

    function isPrintableKey(event) {
      return event.key
        && event.key.length === 1
        && !event.ctrlKey
        && !event.metaKey
        && !event.altKey;
    }

    function finishCellEdit(input) {
      var row;
      var column;
      if (!input || !isInputEditing(input)) {
        return;
      }
      row = Number(input.dataset.row);
      column = Number(input.dataset.column);
      setValue(row, column, input.value);
      input.dataset.gridlineUndoRecorded = "";
      editingCell = null;
      editingSnapshot = null;
      syncInputDisplay(input, false);
      if (row === active.row && column === active.column) {
        formulaInput.value = getValue(row, column);
      }
      updateReferenceHighlights();
      scheduleSave();
    }

    function beginCellEdit(row, column, initialValue, replace) {
      var input = getInput(row, column);
      if (!input) {
        return;
      }
      selectCell(row, column, { focus: false });
      editingCell = { row: row, column: column };
      syncInputDisplay(input, true);
      input.readOnly = false;
      input.tabIndex = 0;
      input.focus();
      editingSnapshot = {
        row: row,
        column: column,
        value: getValue(row, column),
      };
      input.dataset.gridlineUndoRecorded = "true";
      recordUndo();
      if (replace) {
        input.value = String(initialValue || "");
        setValue(row, column, input.value);
        input.dataset.rawValue = input.value;
        formulaInput.value = input.value;
      } else {
        input.value = getValue(row, column);
      }
      input.setSelectionRange(input.value.length, input.value.length);
      updateReferenceHighlights();
      if (replace) {
        scheduleSave();
      }
    }

    function moveSelection(rowOffset, columnOffset, extend) {
      var nextRow = Math.max(0, active.row + rowOffset);
      var nextColumn = Math.max(0, active.column + columnOffset);
      if (ensureSize(nextRow, nextColumn)) {
        render();
      }
      selectCell(nextRow, nextColumn, {
        focus: false,
        extend: extend,
      });
      grid.focus({ preventScroll: true });
    }

    function handleKeyboardClipboard(event) {
      var key = String(event.key || "").toLowerCase();
      if (!(event.ctrlKey || event.metaKey)) {
        return false;
      }
      if (event.target === formulaInput && ["c", "v", "x"].indexOf(key) >= 0) {
        return false;
      }
      if (key === "c") {
        event.preventDefault();
        copySelection(false);
        return true;
      }
      if (key === "x") {
        event.preventDefault();
        copySelection(true);
        return true;
      }
      if (key === "v") {
        if (navigator.clipboard && navigator.clipboard.readText) {
          event.preventDefault();
          navigator.clipboard.readText().then(applyClipboardText).catch(function () {
            setStatus("Zalijepi nije dostupan u ovom browseru", "is-saving");
          });
          return true;
        }
        return false;
      }
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return true;
      }
      if (key === "y") {
        event.preventDefault();
        redo();
        return true;
      }
      return false;
    }

    function handleKeydown(event) {
      var input = getClosestCellInput(event.target);
      var inputIsEditing = input && isInputEditing(input);
      var row;
      var column;
      function move(nextRow, nextColumn) {
        event.preventDefault();
        if (ensureSize(nextRow, nextColumn)) {
          render();
        }
        selectCell(nextRow, nextColumn);
      }
      if (handleKeyboardClipboard(event)) {
        return;
      }
      row = input ? Number(input.dataset.row) : active.row;
      column = input ? Number(input.dataset.column) : active.column;
      if (event.key === "Enter") {
        if (inputIsEditing && event.altKey) {
          event.preventDefault();
          insertTextIntoCellEditor(input, "\n");
          return;
        }
        if (inputIsEditing) {
          finishCellEdit(input);
        }
        move(row + (event.shiftKey ? -1 : 1), column);
      } else if (event.key === "Tab") {
        if (inputIsEditing) {
          finishCellEdit(input);
        }
        move(row, column + (event.shiftKey ? -1 : 1));
      } else if (event.key === "Escape") {
        event.preventDefault();
        if (editingSnapshot && inputIsEditing) {
          setValue(editingSnapshot.row, editingSnapshot.column, editingSnapshot.value);
          input.dataset.gridlineUndoRecorded = "";
          editingCell = null;
          syncInputDisplay(input, false);
          formulaInput.value = editingSnapshot.value;
        }
        editingSnapshot = null;
        grid.focus({ preventScroll: true });
      } else if (event.key === "F2") {
        event.preventDefault();
        beginCellEdit(row, column, null, false);
      } else if (event.key === "ArrowDown" && (!inputIsEditing || event.shiftKey || input.selectionStart === input.value.length)) {
        event.preventDefault();
        moveSelection(1, 0, event.shiftKey);
      } else if (event.key === "ArrowUp" && (!inputIsEditing || event.shiftKey || input.selectionStart === 0)) {
        event.preventDefault();
        moveSelection(-1, 0, event.shiftKey);
      } else if (event.key === "ArrowRight" && (!inputIsEditing || event.shiftKey || input.selectionStart === input.value.length)) {
        event.preventDefault();
        moveSelection(0, 1, event.shiftKey);
      } else if (event.key === "ArrowLeft" && (!inputIsEditing || event.shiftKey || input.selectionStart === 0)) {
        event.preventDefault();
        moveSelection(0, -1, event.shiftKey);
      } else if (!inputIsEditing && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        clearSelectedContent();
      } else if (!inputIsEditing && isPrintableKey(event)) {
        event.preventDefault();
        beginCellEdit(active.row, active.column, event.key, true);
      }
    }

    function handleFormulaInput() {
      var input;
      if (!formulaInput.dataset.gridlineUndoRecorded) {
        recordUndo();
        formulaInput.dataset.gridlineUndoRecorded = "true";
      }
      setValue(active.row, active.column, formulaInput.value);
      input = getInput(active.row, active.column);
      if (input) {
        input.value = formulaInput.value;
        input.dataset.rawValue = formulaInput.value;
        input.classList.toggle("is-formula", isFormulaText(formulaInput.value));
      }
      updateReferenceHighlights();
      scheduleSave();
    }

    function handleFormulaKeydown(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        formulaInput.blur();
        grid.focus({ preventScroll: true });
      } else if (event.key === "Escape") {
        event.preventDefault();
        formulaInput.value = getValue(active.row, active.column);
        formulaInput.dataset.gridlineUndoRecorded = "";
        updateReferenceHighlights();
        grid.focus({ preventScroll: true });
      }
    }

    function handleFormulaBlur() {
      formulaInput.dataset.gridlineUndoRecorded = "";
      updateReferenceHighlights();
    }

    function handleFormulaFocus() {
      updateReferenceHighlights();
    }

    function getLastMeaningfulRowIndex() {
      var row;
      var column;
      var last = -1;
      for (row = 0; row < model.rowCount; row += 1) {
        for (column = 0; column < model.columnCount; column += 1) {
          if (String(getValue(row, column)).trim()) {
            last = row;
            break;
          }
        }
      }
      return last;
    }

    function getQuickFillDefaultStartRow() {
      return Math.max(1, getLastMeaningfulRowIndex() + 2);
    }

    function getNextSequenceNumber(startRow) {
      var row;
      var maxNumber = 0;
      for (row = 0; row < Math.max(0, startRow); row += 1) {
        maxNumber = Math.max(maxNumber, Number.parseInt(String(getValue(row, 0) || "").replace(/\D+/g, ""), 10) || 0);
      }
      return maxNumber + 1;
    }

    function splitQuickFillLine(line) {
      var text = String(line || "").trim();
      if (!text) {
        return [];
      }
      if (text.indexOf("\t") >= 0) {
        return text.split("\t").map(function (part) { return part.trim(); });
      }
      if (text.indexOf(";") >= 0) {
        return text.split(";").map(function (part) { return part.trim(); });
      }
      if (text.indexOf(",") >= 0) {
        return text.split(",").map(function (part) { return part.trim(); });
      }
      return [text];
    }

    function normalizeQuickFillHeader(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    }

    function getQuickFillDefaultColumnMode(columnIndex) {
      var header = normalizeQuickFillHeader(getValue(0, columnIndex) || getValue(1, columnIndex) || columnLabel(columnIndex));
      if (columnIndex === 0 || /(^|\s)(r|red)\.?\s*br|redni/.test(header)) {
        return "sequence";
      }
      if (/mjesto|lokacija|pozicija/.test(header)) {
        return "place";
      }
      if (/etaza|kat/.test(header)) {
        return "floor";
      }
      if (/prostor|prostorija/.test(header)) {
        return "room";
      }
      if (/broj|kom|kolic|lamp/.test(header)) {
        return "quantity";
      }
      if (/eimin|min/.test(header)) {
        return "custom";
      }
      if (/\bei\b|izmjeren/.test(header)) {
        return "custom";
      }
      if (/zadovolj|ocjena|status/.test(header)) {
        return "custom";
      }
      return "empty";
    }

    function getQuickFillDefaultColumnValue(columnIndex) {
      var header = normalizeQuickFillHeader(getValue(0, columnIndex) || getValue(1, columnIndex) || columnLabel(columnIndex));
      if (/eimin|min/.test(header)) {
        return "1";
      }
      if (/\bei\b|izmjeren/.test(header)) {
        return ">2";
      }
      if (/zadovolj|ocjena|status/.test(header)) {
        return "DA";
      }
      return "";
    }

    function normalizeQuickFillColumnSettings(settings) {
      var source = Array.isArray(settings) && settings.length
        ? settings
        : Array.from({ length: model.columnCount }, function (_, columnIndex) {
          return {
            columnIndex: columnIndex,
            mode: getQuickFillDefaultColumnMode(columnIndex),
            value: getQuickFillDefaultColumnValue(columnIndex),
          };
        });
      return source.map(function (setting, columnIndex) {
        return {
          columnIndex: clampInteger(setting && setting.columnIndex, columnIndex, 0, model.columnCount - 1),
          mode: String(setting && setting.mode || "empty"),
          value: String(setting && setting.value || ""),
        };
      });
    }

    function getQuickFillHeaderRow(label) {
      var row = Array.from({ length: model.columnCount }, function () { return ""; });
      if (model.columnCount > 0) {
        row[0] = label;
      }
      return {
        values: row,
        mergeAcross: true,
      };
    }

    function getQuickFillColumnText(setting, context) {
      var mode = String(setting && setting.mode || "empty");
      var value = String(setting && setting.value || "");
      if (mode === "sequence") {
        return String(context.sequence);
      }
      if (mode === "place") {
        return context.place;
      }
      if (mode === "floor") {
        return context.floor;
      }
      if (mode === "room") {
        return context.room;
      }
      if (mode === "item") {
        return context.itemName;
      }
      if (mode === "quantity") {
        return context.quantity;
      }
      if (mode === "custom") {
        return value;
      }
      if (mode === "formula") {
        return shiftFormulaValue(value, context.index, 0);
      }
      return "";
    }

    function buildQuickFillRows(floor, room, itemsText, startRowIndex, columnSettings, rowCountOverride) {
      var lines = String(itemsText || "")
        .split(/\r?\n/)
        .map(function (line) { return line.trim(); })
        .filter(Boolean);
      var settings = normalizeQuickFillColumnSettings(columnSettings);
      var rows = [];
      var firstDataRowIndex;
      var sequence;
      if (!lines.length) {
        lines = Array.from(
          { length: clampInteger(rowCountOverride, 1, 1, 200) },
          function (_, index) {
            var base = room || floor || "Mjerno mjesto";
            return rowCountOverride > 1 ? base + " " + (index + 1) : base;
          }
        );
      }
      if (String(floor || "").trim()) {
        rows.push(getQuickFillHeaderRow("Etaza: " + String(floor).trim()));
      }
      if (String(room || "").trim()) {
        rows.push(getQuickFillHeaderRow("Prostorija: " + String(room).trim()));
      }
      firstDataRowIndex = startRowIndex + rows.length;
      sequence = getNextSequenceNumber(firstDataRowIndex);
      lines.forEach(function (line, index) {
        var parts = splitQuickFillLine(line);
        var itemName = parts[0] || room || floor || "Mjerno mjesto";
        var place = [floor, room, itemName].map(function (part) { return String(part || "").trim(); }).filter(Boolean).join(" - ");
        var row = Array.from({ length: model.columnCount }, function () { return ""; });
        var context = {
          index: index,
          sequence: sequence + index,
          floor: String(floor || "").trim(),
          room: String(room || "").trim(),
          itemName: itemName,
          place: place || itemName,
          quantity: parts[1] || "1",
          parts: parts,
        };
        settings.forEach(function (setting) {
          if (setting.columnIndex < model.columnCount) {
            row[setting.columnIndex] = getQuickFillColumnText(setting, context);
          }
        });
        rows.push(row);
      });
      return rows;
    }

    function insertMatrixRows(startRowIndex, rows) {
      var rowCount = Array.isArray(rows) ? rows.length : 0;
      var nextData = Object.create(null);
      var nextMerges = [];
      var nextRowHeights = Object.create(null);
      var nextCellStyles = Object.create(null);
      var previousRowCount = model.rowCount;
      if (!rowCount) {
        return;
      }
      recordUndo();
      ensureSize(startRowIndex + rowCount - 1, model.columnCount - 1);
      Object.keys(model.data).forEach(function (key) {
        var parts = key.split(":");
        var row = Number(parts[0]);
        var column = Number(parts[1]);
        var nextRow = row >= startRowIndex ? row + rowCount : row;
        nextData[cellKey(nextRow, column)] = model.data[key];
      });
      Object.keys(model.rowHeights || {}).forEach(function (key) {
        var row = Number(key);
        var nextRow = row >= startRowIndex ? row + rowCount : row;
        nextRowHeights[String(nextRow)] = model.rowHeights[key];
      });
      Object.keys(model.cellStyles || {}).forEach(function (key) {
        var parts = key.split(":");
        var row = Number(parts[0]);
        var column = Number(parts[1]);
        var nextRow = row >= startRowIndex ? row + rowCount : row;
        nextCellStyles[cellKey(nextRow, column)] = model.cellStyles[key];
      });
      (model.merges || []).forEach(function (merge) {
        nextMerges.push({
          row: merge.row >= startRowIndex ? merge.row + rowCount : merge.row,
          column: merge.column,
          rowSpan: merge.rowSpan,
          columnSpan: merge.columnSpan,
        });
      });
      model.rowCount = clampInteger(
        Math.max(previousRowCount + rowCount, startRowIndex + rowCount),
        previousRowCount + rowCount,
        MIN_ROWS,
        MAX_ROWS
      );
      rows.forEach(function (rowEntry, rowOffset) {
        var rowValues = Array.isArray(rowEntry) ? rowEntry : Array.isArray(rowEntry && rowEntry.values) ? rowEntry.values : [];
        rowValues.slice(0, model.columnCount).forEach(function (value, columnIndex) {
          var text = String(value == null ? "" : value);
          if (text) {
            nextData[cellKey(startRowIndex + rowOffset, columnIndex)] = text;
          }
        });
        if (rowEntry && !Array.isArray(rowEntry) && rowEntry.mergeAcross && model.columnCount > 1) {
          nextMerges.push({
            row: startRowIndex + rowOffset,
            column: 0,
            rowSpan: 1,
            columnSpan: model.columnCount,
          });
        }
      });
      model.data = nextData;
      model.merges = normalizeMerges(nextMerges, model.rowCount, model.columnCount);
      model.rowHeights = normalizeNumberMap(nextRowHeights, model.rowCount, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
      model.cellStyles = normalizeCellStyles(nextCellStyles, model.rowCount, model.columnCount);
      render();
      selectCell(startRowIndex + rowCount - 1, Math.min(1, model.columnCount - 1), { focus: false });
      scheduleSave();
    }

    function createPopoverHeader(titleText, copyText) {
      var header = document.createElement("div");
      var title = document.createElement("strong");
      var copy = document.createElement("span");
      header.className = "gridline-popover-head";
      title.textContent = titleText;
      copy.textContent = copyText || "";
      header.append(title, copy);
      return header;
    }

    function createPopoverActions(buttons) {
      var actions = document.createElement("div");
      actions.className = "gridline-popover-actions";
      (buttons || []).forEach(function (button) {
        actions.appendChild(button);
      });
      return actions;
    }

    function createLabeledControl(labelText, control) {
      var label = document.createElement("label");
      var span = document.createElement("span");
      label.className = "gridline-popover-field";
      span.textContent = labelText;
      label.appendChild(span);
      label.appendChild(control);
      return label;
    }

    function createQuickFillColumnModeSelect(mode) {
      var select = document.createElement("select");
      [
        ["sequence", "Redni broj"],
        ["place", "Mjesto (etaža + prostorija)"],
        ["floor", "Etaža"],
        ["room", "Prostorija"],
        ["item", "Stavka"],
        ["quantity", "Količina"],
        ["custom", "Stalna vrijednost"],
        ["formula", "Formula"],
        ["empty", "Prazno"],
      ].forEach(function (optionData) {
        var option = document.createElement("option");
        option.value = optionData[0];
        option.textContent = optionData[1];
        select.appendChild(option);
      });
      select.value = mode || "empty";
      select.dataset.gridlineQuickColumnMode = "true";
      return select;
    }

    function renderQuickFillColumnMap(container) {
      if (!container) {
        return;
      }
      clearNode(container);
      Array.from({ length: model.columnCount }, function (_, columnIndex) {
        var row = document.createElement("div");
        var label = document.createElement("strong");
        var select = createQuickFillColumnModeSelect(getQuickFillDefaultColumnMode(columnIndex));
        var input = document.createElement("input");
        row.className = "gridline-quick-column-row";
        row.dataset.gridlineQuickColumn = String(columnIndex);
        label.textContent = columnLabel(columnIndex) + " · " + (getValue(0, columnIndex) || getValue(1, columnIndex) || "Kolona");
        input.type = "text";
        input.autocomplete = "off";
        input.placeholder = "Vrijednost ili formula";
        input.value = getQuickFillDefaultColumnValue(columnIndex);
        input.dataset.gridlineQuickColumnValue = "true";
        row.append(label, select, input);
        container.appendChild(row);
      });
    }

    function collectQuickFillColumnSettings(panel) {
      return Array.prototype.map.call(
        panel ? panel.querySelectorAll("[data-gridline-quick-column]") : [],
        function (row, fallbackIndex) {
          var mode = row.querySelector("[data-gridline-quick-column-mode]");
          var value = row.querySelector("[data-gridline-quick-column-value]");
          return {
            columnIndex: clampInteger(row.dataset.gridlineQuickColumn, fallbackIndex, 0, model.columnCount - 1),
            mode: mode ? mode.value : "empty",
            value: value ? value.value : "",
          };
        }
      );
    }

    function ensureQuickFillPanel() {
      var startInput;
      var floorInput;
      var roomInput;
      var countInput;
      var columnMap;
      var closeButton;
      var insertButton;
      if (quickFillPanel || !rootElement) {
        return quickFillPanel;
      }
      quickFillPanel = document.createElement("section");
      quickFillPanel.className = "gridline-popover gridline-quick-fill-panel";
      quickFillPanel.hidden = true;
      quickFillPanel.setAttribute("role", "dialog");
      quickFillPanel.setAttribute("aria-label", "Brzi generator redova");

      startInput = document.createElement("input");
      startInput.type = "number";
      startInput.min = "1";
      startInput.max = String(MAX_ROWS);
      startInput.step = "1";
      startInput.dataset.gridlineQuickStart = "true";

      floorInput = document.createElement("input");
      floorInput.type = "text";
      floorInput.autocomplete = "off";
      floorInput.placeholder = "npr. Prizemlje";
      floorInput.dataset.gridlineQuickFloor = "true";

      roomInput = document.createElement("input");
      roomInput.type = "text";
      roomInput.autocomplete = "off";
      roomInput.placeholder = "npr. Hodnik, ured 12";
      roomInput.dataset.gridlineQuickRoom = "true";

      countInput = document.createElement("input");
      countInput.type = "number";
      countInput.min = "1";
      countInput.max = "200";
      countInput.step = "1";
      countInput.value = "1";
      countInput.dataset.gridlineQuickCount = "true";

      columnMap = document.createElement("div");
      columnMap.className = "gridline-quick-columns";
      columnMap.dataset.gridlineQuickColumns = "true";
      renderQuickFillColumnMap(columnMap);

      closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "ghost-button";
      closeButton.textContent = "Zatvori";
      closeButton.dataset.gridlineQuickClose = "true";

      insertButton = document.createElement("button");
      insertButton.type = "button";
      insertButton.className = "primary-button";
      insertButton.textContent = "Umetni redove";
      insertButton.dataset.gridlineQuickInsert = "true";

      quickFillPanel.append(
        createPopoverHeader("Brzi generator redova", "Etaza i prostorija se umeću kao spojeni redovi, a kolone definiraš ispod."),
        createLabeledControl("Pocetni red", startInput),
        createLabeledControl("Etaza", floorInput),
        createLabeledControl("Prostorija", roomInput),
        createLabeledControl("Broj redova", countInput),
        createLabeledControl("Punjenje kolona", columnMap),
        createPopoverActions([closeButton, insertButton])
      );
      quickFillPanel.addEventListener("click", handleQuickFillPanelClick);
      rootElement.appendChild(quickFillPanel);
      return quickFillPanel;
    }

    function openQuickFillPanel() {
      var panel = ensureQuickFillPanel();
      var startInput;
      var columnMap;
      if (!panel) {
        return;
      }
      startInput = panel.querySelector("[data-gridline-quick-start]");
      columnMap = panel.querySelector("[data-gridline-quick-columns]");
      if (startInput) {
        startInput.value = String(getQuickFillDefaultStartRow());
      }
      renderQuickFillColumnMap(columnMap);
      panel.hidden = false;
    }

    function closeQuickFillPanel() {
      if (quickFillPanel) {
        quickFillPanel.hidden = true;
      }
    }

    function applyQuickFillPanel() {
      var panel = ensureQuickFillPanel();
      var startInput = panel && panel.querySelector("[data-gridline-quick-start]");
      var floorInput = panel && panel.querySelector("[data-gridline-quick-floor]");
      var roomInput = panel && panel.querySelector("[data-gridline-quick-room]");
      var countInput = panel && panel.querySelector("[data-gridline-quick-count]");
      var columnSettings = collectQuickFillColumnSettings(panel);
      var startRow = clampInteger(startInput && startInput.value, getQuickFillDefaultStartRow(), 1, MAX_ROWS) - 1;
      var rowCount = clampInteger(countInput && countInput.value, 1, 1, 200);
      var rows = buildQuickFillRows(
        floorInput ? floorInput.value : "",
        roomInput ? roomInput.value : "",
        "",
        startRow,
        columnSettings,
        rowCount
      );
      insertMatrixRows(startRow, rows);
      closeQuickFillPanel();
    }

    function handleQuickFillPanelClick(event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.closest("[data-gridline-quick-close]")) {
        closeQuickFillPanel();
      } else if (target.closest("[data-gridline-quick-insert]")) {
        applyQuickFillPanel();
      }
    }

    function handleQuickFillButtonClick() {
      if (quickFillPanel && !quickFillPanel.hidden) {
        closeQuickFillPanel();
      } else {
        openQuickFillPanel();
      }
    }

    function canInlineAiFile(file) {
      var type = String(file && file.type || "").toLowerCase();
      var name = String(file && file.name || "").toLowerCase();
      var size = Number(file && file.size || 0);
      if (!file || !name || size <= 0 || size > 8 * 1024 * 1024) {
        return false;
      }
      return type === "application/pdf"
        || type.indexOf("image/") === 0
        || type.indexOf("text/") === 0
        || type.indexOf("json") >= 0
        || type.indexOf("xml") >= 0
        || [".txt", ".csv", ".json", ".xml", ".md"].some(function (extension) {
          return name.endsWith(extension);
        });
    }

    function readAiFileAsDataUrl(file) {
      return new Promise(function (resolveRead) {
        var reader;
        if (!canInlineAiFile(file)) {
          resolveRead("");
          return;
        }
        reader = new FileReader();
        reader.addEventListener("load", function () {
          resolveRead(typeof reader.result === "string" ? reader.result : "");
        }, { once: true });
        reader.addEventListener("error", function () {
          resolveRead("");
        }, { once: true });
        reader.readAsDataURL(file);
      });
    }

    function createAiFileMeta(file) {
      return readAiFileAsDataUrl(file).then(function (contentDataUrl) {
        return {
          id: [file.name || "datoteka", file.size || 0, file.lastModified || 0].join("::"),
          name: file.name || "datoteka",
          type: file.type || "",
          size: Number(file.size || 0),
          lastModified: Number(file.lastModified || 0),
          inlineReady: Boolean(contentDataUrl),
          contentDataUrl: contentDataUrl,
        };
      });
    }

    function getAiPayloadFiles(files) {
      var inlineCount = 0;
      return (Array.isArray(files) ? files : []).map(function (file) {
        var base = {
          id: String(file.id || file.name || ""),
          name: String(file.name || ""),
          type: String(file.type || ""),
          size: Number(file.size || 0),
          lastModified: Number(file.lastModified || 0),
          inlineReady: Boolean(file.inlineReady || file.contentDataUrl),
        };
        if (file.contentDataUrl && inlineCount < 5) {
          inlineCount += 1;
          base.contentDataUrl = String(file.contentDataUrl);
        }
        return base;
      });
    }

    function getAiColumns() {
      return Array.from({ length: model.columnCount }, function (_, columnIndex) {
        var header = String(getValue(0, columnIndex) || "").trim();
        var letter = columnLabel(columnIndex);
        var config = model.aiColumns && model.aiColumns[String(columnIndex)] || {};
        var label = String(config.label || header || letter).trim();
        var description = String(config.description || "").trim();
        var lookFor = String(config.lookFor || "").trim();
        var avoid = String(config.avoid || "").trim();
        return {
          fieldId: "gridline",
          fieldKey: "documentation_gridline",
          fieldLabel: options && options.aiFieldLabel || "Gridline",
          columnId: "col_" + columnIndex,
          columnIndex: columnIndex,
          columnLetter: letter,
          key: "col_" + columnIndex,
          label: label,
          type: "text",
          required: Boolean(config.required),
          placeholder: label,
          helpText: description || "Popuni samo ako je vrijednost vidljiva u projektu ili starom zapisniku.",
          allowedValues: String(config.allowedValues || "").trim(),
          examples: String(config.examples || "").trim(),
          aiMapping: {
            enabled: config.enabled !== false,
            key: "col_" + columnIndex,
            label: label,
            description: description,
            lookFor: lookFor,
            avoid: avoid,
            sourceTracking: true,
          },
        };
      });
    }

    function parseAiTextRows(text) {
      return String(text || "")
        .split(/\r?\n/)
        .map(function (line) { return splitQuickFillLine(line); })
        .filter(function (row) {
          return row.some(function (cell) { return String(cell || "").trim(); });
        })
        .map(function (row) {
          return Array.from({ length: model.columnCount }, function (_, columnIndex) {
            return String(row[columnIndex] || "").trim();
          });
        });
    }

    function parseAiResultObject(payload) {
      var text;
      var match;
      if (payload && payload.result && typeof payload.result === "object") {
        return payload.result;
      }
      if (payload && typeof payload === "object" && (payload.measurementSuggestions || payload.rows || payload.tableRows)) {
        return payload;
      }
      text = String(payload && (payload.outputText || payload.output_text) || "").trim();
      if (!text) {
        return payload && typeof payload === "object" ? payload : {};
      }
      try {
        return JSON.parse(text);
      } catch (error) {
        match = text.match(/\{[\s\S]*\}/);
        if (!match) {
          return {};
        }
        try {
          return JSON.parse(match[0]);
        } catch (innerError) {
          return {};
        }
      }
    }

    function getAiSuggestionRows(result) {
      var suggestions = []
        .concat(Array.isArray(result && result.measurementSuggestions) ? result.measurementSuggestions : [])
        .concat(Array.isArray(result && result.measurement_suggestions) ? result.measurement_suggestions : [])
        .concat(Array.isArray(result && result.excelSuggestions) ? result.excelSuggestions : [])
        .concat(Array.isArray(result && result.excel_suggestions) ? result.excel_suggestions : []);
      var suggestionIndex;
      for (suggestionIndex = 0; suggestionIndex < suggestions.length; suggestionIndex += 1) {
        if (Array.isArray(suggestions[suggestionIndex].rows)) {
          return suggestions[suggestionIndex].rows;
        }
        if (Array.isArray(suggestions[suggestionIndex].tableRows)) {
          return suggestions[suggestionIndex].tableRows;
        }
      }
      return Array.isArray(result && result.rows) ? result.rows
        : Array.isArray(result && result.tableRows) ? result.tableRows
          : Array.isArray(result && result.table_rows) ? result.table_rows
            : Array.isArray(result && result.items) ? result.items
              : [];
    }

    function getAiSuggestionCell(row, column, index) {
      var values = row && typeof row === "object" ? row.values || row.cells || row.data : null;
      var ordered = row && (row.orderedValues || row.ordered_values || row.valuesArray);
      var keys = [
        column.columnId,
        column.key,
        column.columnLetter,
        column.label,
        String(index),
      ];
      var keyIndex;
      if (Array.isArray(row)) {
        return row[index] == null ? "" : String(row[index]);
      }
      if (Array.isArray(ordered)) {
        return ordered[index] == null ? "" : String(ordered[index]);
      }
      if (values && typeof values === "object") {
        for (keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
          if (Object.prototype.hasOwnProperty.call(values, keys[keyIndex])) {
            return values[keys[keyIndex]] == null ? "" : String(values[keys[keyIndex]]);
          }
        }
      }
      return "";
    }

    function buildAiRowsFromPayload(payload) {
      var result = parseAiResultObject(payload);
      var columns = getAiColumns();
      return getAiSuggestionRows(result).slice(0, 200).map(function (row) {
        return columns.map(function (column, index) {
          return getAiSuggestionCell(row, column, index);
        });
      }).filter(function (row) {
        return row.some(function (cell) { return String(cell || "").trim(); });
      });
    }

    function renderAiPanel() {
      var panel = aiPanel;
      var status;
      var fileList;
      var preview;
      var applyButton;
      var runButton;
      if (!panel) {
        return;
      }
      status = panel.querySelector("[data-gridline-ai-status]");
      fileList = panel.querySelector("[data-gridline-ai-files]");
      preview = panel.querySelector("[data-gridline-ai-preview]");
      applyButton = panel.querySelector("[data-gridline-ai-apply]");
      runButton = panel.querySelector("[data-gridline-ai-run]");
      if (status) {
        status.textContent = aiState.message || "Spremno";
        status.className = "gridline-ai-status " + (aiState.status || "idle");
      }
      if (fileList) {
        fileList.replaceChildren();
        if (!aiState.files.length) {
          var empty = document.createElement("span");
          empty.textContent = disableAiUpload
            ? "Nema početnih NexAI izvora za ovaj zapisnik."
            : "Nema dodanih datoteka.";
          fileList.appendChild(empty);
        } else {
          aiState.files.forEach(function (file) {
            var chip = document.createElement("button");
            chip.type = "button";
            chip.className = "gridline-ai-file-chip";
            chip.dataset.gridlineAiRemoveFile = file.id || file.name || "";
            chip.textContent = (file.inlineReady ? "OK " : "") + (file.name || "datoteka");
            fileList.appendChild(chip);
          });
        }
      }
      if (preview) {
        preview.replaceChildren();
        if (!aiState.previewRows.length) {
          var note = document.createElement("p");
          note.textContent = "Preview ce se prikazati prije upisa.";
          preview.appendChild(note);
        } else {
          var table = document.createElement("table");
          var tbody = document.createElement("tbody");
          aiState.previewRows.slice(0, 8).forEach(function (row) {
            var tr = document.createElement("tr");
            row.slice(0, Math.min(model.columnCount, 8)).forEach(function (cell) {
              var td = document.createElement("td");
              td.textContent = String(cell || "");
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          preview.appendChild(table);
        }
      }
      if (applyButton) {
        applyButton.disabled = aiState.status === "loading" || !aiState.previewRows.length;
      }
      if (runButton) {
        runButton.disabled = aiState.status === "loading";
        runButton.textContent = aiState.status === "loading" ? "Pripremam..." : "Predlozi";
      }
    }

    function ensureAiPanel() {
      var textInput;
      var modelSelect;
      var startInput;
      var fileInput;
      var addFilesButton;
      var runButton;
      var applyButton;
      var closeButton;
      var clearButton;
      if (aiPanel || !rootElement) {
        return aiPanel;
      }
      aiPanel = document.createElement("section");
      aiPanel.className = "gridline-popover gridline-ai-panel";
      aiPanel.hidden = true;
      aiPanel.setAttribute("role", "dialog");
      aiPanel.setAttribute("aria-label", "NexAI Gridline unos");

      textInput = document.createElement("textarea");
      textInput.rows = 5;
      textInput.placeholder = "Zalijepi tekst, CSV ili dodatnu uputu za AI...";
      textInput.dataset.gridlineAiText = "true";

      modelSelect = document.createElement("select");
      modelSelect.dataset.gridlineAiModel = "true";
      [
        ["fast", "Brzi"],
        ["standard", "Standard"],
        ["strong", "Jaki"],
        ["max", "Najjaci"],
      ].forEach(function (entry) {
        var optionNode = document.createElement("option");
        optionNode.value = entry[0];
        optionNode.textContent = entry[1];
        modelSelect.appendChild(optionNode);
      });
      modelSelect.value = "standard";

      startInput = document.createElement("input");
      startInput.type = "number";
      startInput.min = "1";
      startInput.max = String(MAX_ROWS);
      startInput.step = "1";
      startInput.dataset.gridlineAiStart = "true";

      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.multiple = true;
      fileInput.accept = ".pdf,.doc,.docx,.txt,.csv,.json,.xml,.jpg,.jpeg,.png,.webp,application/pdf,text/*,image/*";
      fileInput.hidden = true;
      fileInput.dataset.gridlineAiFilesInput = "true";

      addFilesButton = document.createElement("button");
      addFilesButton.type = "button";
      addFilesButton.className = "ghost-button";
      addFilesButton.dataset.gridlineAiAddFiles = "true";
      addFilesButton.textContent = "Dodaj projekt/zapisnik";
      if (disableAiUpload) {
        addFilesButton.hidden = true;
      }

      runButton = document.createElement("button");
      runButton.type = "button";
      runButton.className = "primary-button";
      runButton.dataset.gridlineAiRun = "true";
      runButton.textContent = "Predlozi";

      applyButton = document.createElement("button");
      applyButton.type = "button";
      applyButton.className = "ghost-button";
      applyButton.dataset.gridlineAiApply = "true";
      applyButton.textContent = "Upisi preview";
      applyButton.disabled = true;

      closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "ghost-button";
      closeButton.dataset.gridlineAiClose = "true";
      closeButton.textContent = "Zatvori";

      clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "ghost-button";
      clearButton.dataset.gridlineAiClear = "true";
      clearButton.textContent = "Ocisti";

      aiPanel.append(
        createPopoverHeader(
          "NexAI za Gridline",
          disableAiUpload
            ? "Koriste se NexAI izvori uploadani na početku izrade."
            : "Desni klik određuje punim li ćeliju, red ili tablicu."
        ),
        createLabeledControl("Uputa / zalijepljeni tekst", textInput),
        createLabeledControl("Model", modelSelect),
        createLabeledControl("Pocetni red", startInput),
        disableAiUpload ? document.createTextNode("") : fileInput,
        createPopoverActions([addFilesButton, runButton, applyButton, clearButton, closeButton])
      );
      var status = document.createElement("div");
      status.className = "gridline-ai-status idle";
      status.dataset.gridlineAiStatus = "true";
      status.textContent = "Spremno";
      var files = document.createElement("div");
      files.className = "gridline-ai-files";
      files.dataset.gridlineAiFiles = "true";
      var preview = document.createElement("div");
      preview.className = "gridline-ai-preview";
      preview.dataset.gridlineAiPreview = "true";
      aiPanel.append(status, files, preview);
      aiPanel.addEventListener("click", handleAiPanelClick);
      if (!disableAiUpload) {
        fileInput.addEventListener("change", handleAiPanelFileChange);
      }
      rootElement.appendChild(aiPanel);
      renderAiPanel();
      return aiPanel;
    }

    function openAiPanel(mode) {
      var panel = ensureAiPanel();
      var startInput;
      if (!panel) {
        return;
      }
      aiState.mode = mode || "table";
      aiState.status = "idle";
      aiState.message = mode === "cell"
        ? "NexAI ce predloziti vrijednost za aktivnu celiju."
        : mode === "row"
          ? "NexAI ce predloziti vrijednosti za aktivni red."
          : "NexAI ce predloziti redove za tablicu.";
      startInput = panel.querySelector("[data-gridline-ai-start]");
      if (startInput) {
        startInput.value = String(active.row + 1);
      }
      panel.hidden = false;
      renderAiPanel();
    }

    function closeAiPanel() {
      if (aiPanel) {
        aiPanel.hidden = true;
      }
    }

    function addAiFiles(files) {
      var incoming = Array.from(files || []);
      if (!incoming.length) {
        return Promise.resolve();
      }
      aiState.status = "loading";
      aiState.message = "Ucitavam datoteke...";
      renderAiPanel();
      return Promise.all(incoming.map(createAiFileMeta)).then(function (metas) {
        var map = new Map(aiState.files.map(function (file) {
          return [String(file.id || file.name), file];
        }));
        metas.forEach(function (file) {
          if (file.name) {
            map.set(String(file.id || file.name), file);
          }
        });
        aiState.files = Array.from(map.values()).slice(0, 12);
        aiState.status = "idle";
        aiState.message = aiState.files.length + " datoteka spremno.";
        renderAiPanel();
      });
    }

    function buildAiRequestBody() {
      var panel = ensureAiPanel();
      var textInput = panel && panel.querySelector("[data-gridline-ai-text]");
      var modelInput = panel && panel.querySelector("[data-gridline-ai-model]");
      var pastedText = textInput ? textInput.value.trim() : "";
      var columns = getAiColumns();
      return {
        purpose: "documentation-gridline-ai-prefill",
        organizationId: options && options.organizationId || "",
        templateId: options && options.templateId || "",
        workOrderId: options && options.workOrderId || "",
        workOrderNumber: options && options.workOrderNumber || "",
        files: getAiPayloadFiles(aiState.files),
        columns: columns,
        context: {
          mode: aiState.mode,
          activeCell: {
            rowIndex: active.row,
            columnIndex: active.column,
            reference: columnLabel(active.column) + String(active.row + 1),
          },
          pastedText: pastedText,
          sheet: {
            rowCount: model.rowCount,
            columnCount: model.columnCount,
            headers: columns.map(function (column) { return column.label; }),
            rows: modelToRows(model, { raw: true }).slice(0, 80),
          },
        },
        expectedJsonShape: {
          measurementSuggestions: [
            {
              fieldId: "gridline",
              rows: [
                {
                  values: columns.reduce(function (acc, column) {
                    acc[column.columnId] = "vrijednost za " + column.label;
                    return acc;
                  }, {}),
                  confidence: "high | medium | low",
                  reason: "kratko objasnjenje",
                  sourceFile: "ime datoteke",
                },
              ],
            },
          ],
          warnings: ["sto treba rucno provjeriti"],
          summary: "kratak sazetak",
        },
        modelTier: modelInput ? modelInput.value : "standard",
        dryRun: false,
      };
    }

    function defaultAiPrefillRequest(body) {
      return fetch("/api/ai/openai/prepare", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error(text || "NexAI poziv nije uspio.");
          });
        }
        return response.json().catch(function () { return {}; });
      });
    }

    function runAiPanel() {
      var panel = ensureAiPanel();
      var textInput = panel && panel.querySelector("[data-gridline-ai-text]");
      var localRows = parseAiTextRows(textInput ? textInput.value : "");
      var body;
      if (!localRows.length && !aiState.files.length) {
        aiState.status = "error";
        aiState.message = "Dodaj datoteku ili zalijepi tekst.";
        renderAiPanel();
        return;
      }
      aiState.status = "loading";
      aiState.message = "Pripremam NexAI prijedlog...";
      aiState.previewRows = [];
      renderAiPanel();
      body = buildAiRequestBody();
      (onAiPrefill ? onAiPrefill(body, { mode: aiState.mode, active: active, model: cloneModel(model) }) : defaultAiPrefillRequest(body))
        .then(function (payload) {
          var aiRows = payload && !payload.dryRun ? buildAiRowsFromPayload(payload) : [];
          aiState.previewRows = aiRows.length ? aiRows : localRows;
          aiState.status = aiState.previewRows.length ? "success" : "error";
          aiState.message = aiState.previewRows.length
            ? aiState.previewRows.length + " redaka spremno za preview."
            : "NexAI nije vratio redove. Provjeri uputu ili datoteke.";
          renderAiPanel();
        })
        .catch(function (error) {
          aiState.previewRows = localRows;
          aiState.status = localRows.length ? "success" : "error";
          aiState.message = localRows.length
            ? "AI nije dostupan, koristim lokalni parser teksta."
            : (error && error.message ? error.message : "NexAI nije dostupan.");
          renderAiPanel();
        });
    }

    function applyAiPreview() {
      var panel = ensureAiPanel();
      var startInput = panel && panel.querySelector("[data-gridline-ai-start]");
      var rows = aiState.previewRows;
      var startRow = clampInteger(startInput && startInput.value, active.row + 1, 1, MAX_ROWS) - 1;
      var columnIndex;
      if (!rows.length) {
        return;
      }
      if (aiState.mode === "cell") {
        var value = rows[0][active.column] || rows[0].find(function (cell) { return String(cell || "").trim(); }) || "";
        setValue(active.row, active.column, value);
        render();
        selectCell(active.row, active.column, { focus: false });
        scheduleSave();
      } else if (aiState.mode === "row") {
        ensureSize(active.row, model.columnCount - 1);
        for (columnIndex = 0; columnIndex < model.columnCount; columnIndex += 1) {
          if (String(rows[0][columnIndex] || "").trim()) {
            setValue(active.row, columnIndex, rows[0][columnIndex]);
          }
        }
        refreshComputedCells();
        scheduleSave();
      } else {
        insertMatrixRows(startRow, rows);
      }
      aiState.previewRows = [];
      aiState.status = "success";
      aiState.message = "Preview je upisan u Gridline.";
      renderAiPanel();
    }

    function hideContextMenu() {
      if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
      }
    }

    function createContextMenuButton(label, mode) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", function () {
        hideContextMenu();
        openAiPanel(mode);
      });
      return button;
    }

    function createContextActionButton(label, handler) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", function () {
        hideContextMenu();
        handler();
      });
      return button;
    }

    function showAiContextMenu(event, row, column) {
      void event;
      void row;
      void column;
    }

    function closeColumnAiPanel() {
      if (columnAiPanel) {
        columnAiPanel.remove();
        columnAiPanel = null;
      }
    }

    function createColumnAiTextInput(name, labelText, value, multiline) {
      var control = multiline ? document.createElement("textarea") : document.createElement("input");
      if (!multiline) {
        control.type = "text";
      } else {
        control.rows = 3;
      }
      control.value = String(value || "");
      control.dataset.gridlineColumnAiField = name;
      return createLabeledControl(labelText, control);
    }

    function showColumnAiSettingsPanel(event, column) {
      var normalizedColumn = clampInteger(column, active.column, 0, model.columnCount - 1);
      var current = model.aiColumns && model.aiColumns[String(normalizedColumn)] || {};
      var header = String(getValue(0, normalizedColumn) || columnLabel(normalizedColumn)).trim();
      var enabledLabel;
      var enabledInput;
      var requiredLabel;
      var requiredInput;
      var saveButton;
      var removeButton;
      var closeButton;
      if (!enableColumnAiSettings || !rootElement) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      hideContextMenu();
      closeColumnAiPanel();
      columnAiPanel = document.createElement("section");
      columnAiPanel.className = "gridline-popover gridline-column-ai-panel";
      columnAiPanel.style.left = Math.min(event.clientX, window.innerWidth - 420) + "px";
      columnAiPanel.style.top = Math.min(event.clientY, window.innerHeight - 520) + "px";
      columnAiPanel.dataset.gridlineColumnAiPanel = String(normalizedColumn);
      columnAiPanel.setAttribute("role", "dialog");
      columnAiPanel.setAttribute("aria-label", "NexAI postavke kolone");

      enabledInput = document.createElement("input");
      enabledInput.type = "checkbox";
      enabledInput.checked = current.enabled !== false;
      enabledInput.dataset.gridlineColumnAiEnabled = "true";
      enabledLabel = document.createElement("label");
      enabledLabel.className = "gridline-popover-check";
      enabledLabel.append(enabledInput, document.createTextNode(" NexAI smije popuniti ovu kolonu"));

      requiredInput = document.createElement("input");
      requiredInput.type = "checkbox";
      requiredInput.checked = Boolean(current.required);
      requiredInput.dataset.gridlineColumnAiRequired = "true";
      requiredLabel = document.createElement("label");
      requiredLabel.className = "gridline-popover-check";
      requiredLabel.append(requiredInput, document.createTextNode(" Kolona je obavezna"));

      saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "primary-button";
      saveButton.textContent = "Spremi postavke";
      saveButton.dataset.gridlineColumnAiSave = "true";

      removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "ghost-button";
      removeButton.textContent = "Makni AI";
      removeButton.dataset.gridlineColumnAiRemove = "true";

      closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "ghost-button";
      closeButton.textContent = "Zatvori";
      closeButton.dataset.gridlineColumnAiClose = "true";

      columnAiPanel.append(
        createPopoverHeader(
          "NexAI kolona " + columnLabel(normalizedColumn),
          "Ovdje se definira kako AI smije puniti ovu kolonu. Datoteke se uploadiraju na početku izrade."
        ),
        enabledLabel,
        createColumnAiTextInput("label", "Naziv kolone za AI", current.label || header, false),
        createColumnAiTextInput("description", "Opis polja", current.description || "", true),
        createColumnAiTextInput("lookFor", "NexAI neka traži", current.lookFor || "", true),
        createColumnAiTextInput("avoid", "NexAI ne smije", current.avoid || "", true),
        createColumnAiTextInput("allowedValues", "Dozvoljene vrijednosti", current.allowedValues || "", false),
        createColumnAiTextInput("examples", "Primjeri", current.examples || "", false),
        requiredLabel,
        createPopoverActions([removeButton, closeButton, saveButton])
      );
      columnAiPanel.addEventListener("click", handleColumnAiPanelClick);
      rootElement.appendChild(columnAiPanel);
    }

    function readColumnAiPanelValue(fieldName) {
      var control = columnAiPanel && columnAiPanel.querySelector('[data-gridline-column-ai-field="' + fieldName + '"]');
      return control ? String(control.value || "").trim() : "";
    }

    function handleColumnAiPanelClick(event) {
      var target = event.target;
      var column;
      if (!(target instanceof HTMLElement) || !columnAiPanel) {
        return;
      }
      if (target.closest("[data-gridline-column-ai-close]")) {
        closeColumnAiPanel();
        return;
      }
      column = clampInteger(columnAiPanel.dataset.gridlineColumnAiPanel, active.column, 0, model.columnCount - 1);
      if (target.closest("[data-gridline-column-ai-remove]")) {
        if (model.aiColumns) {
          delete model.aiColumns[String(column)];
        }
        closeColumnAiPanel();
        render();
        scheduleSave();
        return;
      }
      if (target.closest("[data-gridline-column-ai-save]")) {
        var enabledInput = columnAiPanel.querySelector("[data-gridline-column-ai-enabled]");
        var requiredInput = columnAiPanel.querySelector("[data-gridline-column-ai-required]");
        if (!model.aiColumns) {
          model.aiColumns = Object.create(null);
        }
        model.aiColumns[String(column)] = normalizeAiColumns({
          [String(column)]: {
            enabled: enabledInput ? enabledInput.checked : true,
            label: readColumnAiPanelValue("label"),
            description: readColumnAiPanelValue("description"),
            lookFor: readColumnAiPanelValue("lookFor"),
            avoid: readColumnAiPanelValue("avoid"),
            allowedValues: readColumnAiPanelValue("allowedValues"),
            examples: readColumnAiPanelValue("examples"),
            required: requiredInput ? requiredInput.checked : false,
          },
        }, model.columnCount)[String(column)];
        closeColumnAiPanel();
        render();
        scheduleSave();
      }
    }

    function handleGridContextMenu(event) {
      var columnHeader = event.target && event.target.closest
        ? event.target.closest("thead th[data-column]")
        : null;
      var rowHeader = event.target && event.target.closest
        ? event.target.closest("tbody th[data-row-header]")
        : null;
      var input = getClosestCellInput(event.target);
      var bounds;
      var actions;
      event.preventDefault();
      hideContextMenu();
      contextMenu = document.createElement("div");
      contextMenu.className = "gridline-context-menu";
      contextMenu.style.left = event.clientX + "px";
      contextMenu.style.top = event.clientY + "px";
      if (columnHeader && grid.contains(columnHeader)) {
        var columnIndex = Number(columnHeader.dataset.column);
        selection = {
          startRow: 0,
          startColumn: columnIndex,
          endRow: model.rowCount - 1,
          endColumn: columnIndex,
        };
        selectCell(active.row, columnIndex, { focus: false, preserveSelection: true });
        actions = [
          createContextActionButton("Kopiraj", function () { copySelection(false); }),
          createContextActionButton("Zalijepi", function () {
            if (navigator.clipboard && navigator.clipboard.readText) {
              navigator.clipboard.readText().then(applyClipboardText);
            }
          }),
          createContextActionButton("Umetni stupac lijevo", function () { insertColumns(columnIndex, 1); }),
          createContextActionButton("Umetni stupac desno", function () { insertColumns(columnIndex + 1, 1); }),
          createContextActionButton("Obrisi stupac", function () { deleteColumnsInRange(columnIndex, columnIndex); }),
          createContextActionButton("Sort A-Z", function () { sortByColumn(columnIndex, "asc"); }),
          createContextActionButton("Sort Z-A", function () { sortByColumn(columnIndex, "desc"); })
        ];
        if (enableAiContextMenu) {
          actions.push(createContextActionButton("NexAI popuni kolonu", function () { openAiPanel("table"); }));
        }
        if (enableColumnAiSettings) {
          actions.push(createContextActionButton("NexAI postavke kolone", function () { showColumnAiSettingsPanel(event, columnIndex); }));
        }
        contextMenu.append.apply(contextMenu, actions);
        document.body.appendChild(contextMenu);
        return;
      }
      if (rowHeader && grid.contains(rowHeader)) {
        var rowIndex = Number(rowHeader.dataset.rowHeader);
        selection = {
          startRow: rowIndex,
          startColumn: 0,
          endRow: rowIndex,
          endColumn: model.columnCount - 1,
        };
        selectCell(rowIndex, active.column, { focus: false, preserveSelection: true });
        actions = [
          createContextActionButton("Kopiraj", function () { copySelection(false); }),
          createContextActionButton("Izrezi", function () { copySelection(true); }),
          createContextActionButton("Umetni red iznad", function () { insertMatrixRows(rowIndex, [Array.from({ length: model.columnCount }, function () { return ""; })]); }),
          createContextActionButton("Umetni red ispod", function () { insertMatrixRows(rowIndex + 1, [Array.from({ length: model.columnCount }, function () { return ""; })]); }),
          createContextActionButton("Obrisi red", function () { deleteRowsInRange(rowIndex, rowIndex); }),
          createContextActionButton("Ocisti sadrzaj", clearSelectedContent),
          createContextActionButton("Ocisti formatiranje", clearSelectedFormatting)
        ];
        if (enableAiContextMenu) {
          actions.push(createContextActionButton("NexAI popuni red", function () { openAiPanel("row"); }));
        }
        contextMenu.append.apply(contextMenu, actions);
        document.body.appendChild(contextMenu);
        return;
      }
      if (!input) {
        return;
      }
      if (!isCellInSelection(Number(input.dataset.row), Number(input.dataset.column))) {
        selectCell(Number(input.dataset.row), Number(input.dataset.column), { focus: false });
      }
      bounds = getSelectionBounds();
      actions = [
        createContextActionButton("Kopiraj", function () { copySelection(false); }),
        createContextActionButton("Zalijepi", function () {
          if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(applyClipboardText);
          }
        }),
        createContextActionButton("Izrezi", function () { copySelection(true); }),
        createContextActionButton("Umetni red iznad", function () { insertMatrixRows(bounds.top, [Array.from({ length: model.columnCount }, function () { return ""; })]); }),
        createContextActionButton("Umetni red ispod", function () { insertMatrixRows(bounds.bottom + 1, [Array.from({ length: model.columnCount }, function () { return ""; })]); }),
        createContextActionButton("Obrisi red", function () { deleteRowsInRange(bounds.top, bounds.bottom); }),
        createContextActionButton("Umetni stupac lijevo", function () { insertColumns(bounds.left, 1); }),
        createContextActionButton("Umetni stupac desno", function () { insertColumns(bounds.right + 1, 1); }),
        createContextActionButton("Obrisi stupac", function () { deleteColumnsInRange(bounds.left, bounds.right); }),
        createContextActionButton("Ocisti sadrzaj", clearSelectedContent),
        createContextActionButton("Ocisti formatiranje", clearSelectedFormatting)
      ];
      if (enableAiContextMenu) {
        actions.push(
          createContextActionButton("NexAI popuni celiju", function () { openAiPanel("cell"); }),
          createContextActionButton("NexAI popuni red", function () { openAiPanel("row"); }),
          createContextActionButton("NexAI popuni tablicu", function () { openAiPanel("table"); })
        );
      }
      contextMenu.append.apply(contextMenu, actions);
      document.body.appendChild(contextMenu);
    }

    function handleAiPanelClick(event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.closest("[data-gridline-ai-add-files]")) {
        var fileInput = aiPanel && aiPanel.querySelector("[data-gridline-ai-files-input]");
        if (fileInput) {
          fileInput.click();
        }
      } else if (target.closest("[data-gridline-ai-run]")) {
        runAiPanel();
      } else if (target.closest("[data-gridline-ai-apply]")) {
        applyAiPreview();
      } else if (target.closest("[data-gridline-ai-clear]")) {
        aiState.files = [];
        aiState.previewRows = [];
        aiState.status = "idle";
        aiState.message = "Ocisceno.";
        renderAiPanel();
      } else if (target.closest("[data-gridline-ai-close]")) {
        closeAiPanel();
      } else {
        var removeButton = target.closest("[data-gridline-ai-remove-file]");
        if (removeButton) {
          var fileId = removeButton.dataset.gridlineAiRemoveFile || "";
          aiState.files = aiState.files.filter(function (file) {
            return String(file.id || file.name) !== fileId;
          });
          renderAiPanel();
        }
      }
    }

    function handleAiPanelFileChange(event) {
      addAiFiles(event.target && event.target.files).then(function () {
        if (event.target) {
          event.target.value = "";
        }
      });
    }

    function insertColumns(startColumnIndex, count) {
      var columnCount = clampInteger(count, 1, 1, 20);
      var insertAt = clampInteger(startColumnIndex, active.column + 1, 0, model.columnCount);
      var nextData = Object.create(null);
      var nextWidths = Object.create(null);
      var nextStyles = Object.create(null);
      var nextAiColumns = Object.create(null);
      var nextMerges = [];
      var nextColumnCount = clampInteger(model.columnCount + columnCount, model.columnCount, MIN_COLUMNS, MAX_COLUMNS);
      recordUndo();
      Object.keys(model.data || {}).forEach(function (key) {
        var parts = key.split(":");
        var row = Number(parts[0]);
        var column = Number(parts[1]);
        var nextColumn = column >= insertAt ? column + columnCount : column;
        if (nextColumn < nextColumnCount) {
          nextData[cellKey(row, nextColumn)] = model.data[key];
        }
      });
      Object.keys(model.columnWidths || {}).forEach(function (key) {
        var column = Number(key);
        var nextColumn = column >= insertAt ? column + columnCount : column;
        if (nextColumn < nextColumnCount) {
          nextWidths[String(nextColumn)] = model.columnWidths[key];
        }
      });
      Object.keys(model.cellStyles || {}).forEach(function (key) {
        var parts = key.split(":");
        var row = Number(parts[0]);
        var column = Number(parts[1]);
        var nextColumn = column >= insertAt ? column + columnCount : column;
        if (nextColumn < nextColumnCount) {
          nextStyles[cellKey(row, nextColumn)] = model.cellStyles[key];
        }
      });
      Object.keys(model.aiColumns || {}).forEach(function (key) {
        var column = Number(key);
        var nextColumn = column >= insertAt ? column + columnCount : column;
        if (nextColumn < nextColumnCount) {
          nextAiColumns[String(nextColumn)] = model.aiColumns[key];
        }
      });
      (model.merges || []).forEach(function (merge) {
        if (merge.column >= insertAt) {
          nextMerges.push(Object.assign({}, merge, { column: merge.column + columnCount }));
        } else {
          nextMerges.push(Object.assign({}, merge));
        }
      });
      model.columnCount = nextColumnCount;
      model.data = nextData;
      model.columnWidths = normalizeNumberMap(nextWidths, model.columnCount, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
      model.cellStyles = normalizeCellStyles(nextStyles, model.rowCount, model.columnCount);
      model.aiColumns = cloneAiColumns(nextAiColumns, model.columnCount);
      model.merges = normalizeMerges(nextMerges, model.rowCount, model.columnCount);
      render();
      selectCell(active.row, Math.min(insertAt, model.columnCount - 1), { focus: false });
      scheduleSave();
    }

    function deleteRowsInRange(startRow, endRow) {
      var boundsTop = clampInteger(startRow, active.row, 0, model.rowCount - 1);
      var boundsBottom = clampInteger(endRow, boundsTop, 0, model.rowCount - 1);
      var count = boundsBottom - boundsTop + 1;
      var nextData = Object.create(null);
      var nextHeights = Object.create(null);
      var nextStyles = Object.create(null);
      var nextMerges = [];
      if (model.rowCount <= 1) {
        return;
      }
      recordUndo();
      Object.keys(model.data || {}).forEach(function (key) {
        var parts = key.split(":");
        var row = Number(parts[0]);
        var column = Number(parts[1]);
        if (row >= boundsTop && row <= boundsBottom) {
          return;
        }
        nextData[cellKey(row > boundsBottom ? row - count : row, column)] = model.data[key];
      });
      Object.keys(model.rowHeights || {}).forEach(function (key) {
        var row = Number(key);
        if (row >= boundsTop && row <= boundsBottom) {
          return;
        }
        nextHeights[String(row > boundsBottom ? row - count : row)] = model.rowHeights[key];
      });
      Object.keys(model.cellStyles || {}).forEach(function (key) {
        var parts = key.split(":");
        var row = Number(parts[0]);
        var column = Number(parts[1]);
        if (row >= boundsTop && row <= boundsBottom) {
          return;
        }
        nextStyles[cellKey(row > boundsBottom ? row - count : row, column)] = model.cellStyles[key];
      });
      (model.merges || []).forEach(function (merge) {
        var mergeBottom = merge.row + merge.rowSpan - 1;
        if (!(mergeBottom < boundsTop || merge.row > boundsBottom)) {
          return;
        }
        nextMerges.push(Object.assign({}, merge, {
          row: merge.row > boundsBottom ? merge.row - count : merge.row,
        }));
      });
      model.rowCount = Math.max(MIN_ROWS, model.rowCount - count);
      model.data = nextData;
      model.rowHeights = normalizeNumberMap(nextHeights, model.rowCount, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
      model.cellStyles = normalizeCellStyles(nextStyles, model.rowCount, model.columnCount);
      model.merges = normalizeMerges(nextMerges, model.rowCount, model.columnCount);
      model.headerRows = normalizeHeaderRows((model.headerRows || []).map(function (row) {
        return row > boundsBottom ? row - count : row;
      }).filter(function (row) {
        return row < boundsTop || row > boundsBottom;
      }), model.rowCount);
      render();
      selectCell(Math.min(boundsTop, model.rowCount - 1), active.column, { focus: false });
      scheduleSave();
    }

    function deleteColumnsInRange(startColumn, endColumn) {
      var left = clampInteger(startColumn, active.column, 0, model.columnCount - 1);
      var right = clampInteger(endColumn, left, 0, model.columnCount - 1);
      var count = right - left + 1;
      var nextData = Object.create(null);
      var nextWidths = Object.create(null);
      var nextStyles = Object.create(null);
      var nextAiColumns = Object.create(null);
      var nextMerges = [];
      if (model.columnCount <= 1) {
        return;
      }
      recordUndo();
      Object.keys(model.data || {}).forEach(function (key) {
        var parts = key.split(":");
        var row = Number(parts[0]);
        var column = Number(parts[1]);
        if (column >= left && column <= right) {
          return;
        }
        nextData[cellKey(row, column > right ? column - count : column)] = model.data[key];
      });
      Object.keys(model.columnWidths || {}).forEach(function (key) {
        var column = Number(key);
        if (column >= left && column <= right) {
          return;
        }
        nextWidths[String(column > right ? column - count : column)] = model.columnWidths[key];
      });
      Object.keys(model.cellStyles || {}).forEach(function (key) {
        var parts = key.split(":");
        var row = Number(parts[0]);
        var column = Number(parts[1]);
        if (column >= left && column <= right) {
          return;
        }
        nextStyles[cellKey(row, column > right ? column - count : column)] = model.cellStyles[key];
      });
      Object.keys(model.aiColumns || {}).forEach(function (key) {
        var column = Number(key);
        if (column >= left && column <= right) {
          return;
        }
        nextAiColumns[String(column > right ? column - count : column)] = model.aiColumns[key];
      });
      (model.merges || []).forEach(function (merge) {
        var mergeRight = merge.column + merge.columnSpan - 1;
        if (!(mergeRight < left || merge.column > right)) {
          return;
        }
        nextMerges.push(Object.assign({}, merge, {
          column: merge.column > right ? merge.column - count : merge.column,
        }));
      });
      model.columnCount = Math.max(MIN_COLUMNS, model.columnCount - count);
      model.data = nextData;
      model.columnWidths = normalizeNumberMap(nextWidths, model.columnCount, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
      model.cellStyles = normalizeCellStyles(nextStyles, model.rowCount, model.columnCount);
      model.aiColumns = cloneAiColumns(nextAiColumns, model.columnCount);
      model.merges = normalizeMerges(nextMerges, model.rowCount, model.columnCount);
      render();
      selectCell(active.row, Math.min(left, model.columnCount - 1), { focus: false });
      scheduleSave();
    }

    function sortByColumn(column, direction) {
      var startRow = (model.headerRows || []).length ? Math.max.apply(null, model.headerRows) + 1 : 1;
      var rows = [];
      var nextData = Object.create(null);
      var row;
      var col;
      if (startRow >= model.rowCount) {
        return;
      }
      recordUndo();
      for (row = 0; row < startRow; row += 1) {
        for (col = 0; col < model.columnCount; col += 1) {
          if (getValue(row, col)) {
            nextData[cellKey(row, col)] = getValue(row, col);
          }
        }
      }
      for (row = startRow; row < model.rowCount; row += 1) {
        rows.push({
          originalRow: row,
          values: Array.from({ length: model.columnCount }, function (_, colIndex) {
            return getValue(row, colIndex);
          }),
        });
      }
      rows.sort(function (leftRow, rightRow) {
        var leftValue = String(leftRow.values[column] || "");
        var rightValue = String(rightRow.values[column] || "");
        var result = leftValue.localeCompare(rightValue, "hr", { numeric: true, sensitivity: "base" });
        return direction === "desc" ? -result : result;
      });
      rows.forEach(function (rowEntry, rowOffset) {
        rowEntry.values.forEach(function (value, colIndex) {
          if (String(value || "")) {
            nextData[cellKey(startRow + rowOffset, colIndex)] = value;
          }
        });
      });
      model.data = nextData;
      render();
      scheduleSave();
    }

    function addRows(count) {
      recordUndo();
      model.rowCount = clampInteger(model.rowCount + count, model.rowCount, MIN_ROWS, MAX_ROWS);
      render();
      scheduleSave();
    }

    function addColumns(count) {
      recordUndo();
      model.columnCount = clampInteger(model.columnCount + count, model.columnCount, MIN_COLUMNS, MAX_COLUMNS);
      render();
      scheduleSave();
    }

    function resizeActiveColumn(delta) {
      var column = Math.max(0, Math.min(model.columnCount - 1, active.column));
      var nextWidth = clampInteger(getColumnWidth(column) + delta, DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
      recordUndo();
      if (!model.columnWidths) {
        model.columnWidths = Object.create(null);
      }
      model.columnWidths[String(column)] = nextWidth;
      render();
      scheduleSave();
    }

    function resizeActiveRow(delta) {
      var row = Math.max(0, Math.min(model.rowCount - 1, active.row));
      var nextHeight = clampInteger(getRowHeight(row) + delta, DEFAULT_ROW_HEIGHT, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
      recordUndo();
      if (!model.rowHeights) {
        model.rowHeights = Object.create(null);
      }
      model.rowHeights[String(row)] = nextHeight;
      render();
      scheduleSave();
    }

    function mergeSelection() {
      var bounds = getSelectionBounds();
      var range = {
        top: bounds.top,
        bottom: bounds.bottom,
        left: bounds.left,
        right: bounds.right,
      };
      var row;
      var column;
      if (range.top === range.bottom && range.left === range.right) {
        return;
      }
      recordUndo();
      model.merges = normalizeMerges(model.merges, model.rowCount, model.columnCount).filter(function (merge) {
        return !rangesOverlap(range, {
          top: merge.row,
          bottom: merge.row + merge.rowSpan - 1,
          left: merge.column,
          right: merge.column + merge.columnSpan - 1,
        });
      });
      for (row = range.top; row <= range.bottom; row += 1) {
        for (column = range.left; column <= range.right; column += 1) {
          if (row !== range.top || column !== range.left) {
            delete model.data[cellKey(row, column)];
          }
        }
      }
      model.merges.push({
        row: range.top,
        column: range.left,
        rowSpan: range.bottom - range.top + 1,
        columnSpan: range.right - range.left + 1,
      });
      model.merges = normalizeMerges(model.merges, model.rowCount, model.columnCount);
      active = { row: range.top, column: range.left };
      selection = { startRow: range.top, startColumn: range.left, endRow: range.bottom, endColumn: range.right };
      render();
      scheduleSave();
    }

    function unmergeActive() {
      var merge = getCoveringMerge(active.row, active.column);
      if (!merge) {
        return;
      }
      recordUndo();
      model.merges = normalizeMerges(model.merges, model.rowCount, model.columnCount).filter(function (entry) {
        return !(
          entry.row === merge.row
          && entry.column === merge.column
          && entry.rowSpan === merge.rowSpan
          && entry.columnSpan === merge.columnSpan
        );
      });
      active = { row: merge.row, column: merge.column };
      selection = {
        startRow: merge.row,
        startColumn: merge.column,
        endRow: merge.row + merge.rowSpan - 1,
        endColumn: merge.column + merge.columnSpan - 1,
      };
      render();
      scheduleSave();
    }

    function toggleHeaderRow() {
      var rows = normalizeHeaderRows(model.headerRows, model.rowCount);
      var index = rows.indexOf(active.row);
      if (index >= 0) {
        rows.splice(index, 1);
      } else {
        rows.push(active.row);
      }
      recordUndo();
      model.headerRows = normalizeHeaderRows(rows, model.rowCount);
      render();
      scheduleSave();
    }

    function setSelectedCellsAlign(align) {
      var normalizedAlign = String(align || "").trim().toLowerCase();
      if (["left", "center", "right"].indexOf(normalizedAlign) < 0) {
        return;
      }
      if (!model.cellStyles) {
        model.cellStyles = Object.create(null);
      }
      recordUndo();
      getSelectedCells().forEach(function (cell) {
        var key = cellKey(cell.row, cell.column);
        var existing = model.cellStyles[key] || {};
        var nextStyle = makeCellStyle(existing.backgroundColor || "", normalizedAlign, existing);
        if (hasObjectKeys(nextStyle)) {
          model.cellStyles[key] = nextStyle;
        } else {
          delete model.cellStyles[key];
        }
      });
      render();
      syncToolbarState();
      scheduleSave();
    }

    function setActiveCellBackground(color) {
      var normalizedColor = String(color || "").trim();
      var cells = getSelectedCells();
      if (!model.cellStyles) {
        model.cellStyles = Object.create(null);
      }
      recordUndo();
      cells.forEach(function (cell) {
        var key = cellKey(cell.row, cell.column);
        var existing = model.cellStyles[key] || {};
        var nextStyle = makeCellStyle(normalizedColor, existing.textAlign || "", existing);
        if (hasObjectKeys(nextStyle)) {
          model.cellStyles[key] = nextStyle;
        } else {
          delete model.cellStyles[key];
        }
      });
      render();
      scheduleSave();
    }

    function updateSelectedCellStyles(mutator) {
      if (!model.cellStyles) {
        model.cellStyles = Object.create(null);
      }
      recordUndo();
      getSelectedCells().forEach(function (cell) {
        var key = cellKey(cell.row, cell.column);
        var nextStyle = normalizeStyleEntry(mutator(Object.assign({}, model.cellStyles[key] || {})) || {});
        if (hasObjectKeys(nextStyle)) {
          model.cellStyles[key] = nextStyle;
        } else {
          delete model.cellStyles[key];
        }
      });
      render();
      syncToolbarState();
      scheduleSave();
    }

    function toggleSelectedCellStyle(propertyName, enabledValue) {
      updateSelectedCellStyles(function (style) {
        if (style[propertyName] === enabledValue) {
          delete style[propertyName];
        } else {
          style[propertyName] = enabledValue;
        }
        return style;
      });
    }

    function setSelectedTextColor(color) {
      var normalizedColor = String(color || "").trim();
      updateSelectedCellStyles(function (style) {
        if (isValidHexColor(normalizedColor)) {
          style.color = normalizedColor;
        } else {
          delete style.color;
        }
        return style;
      });
    }

    function toggleSelectedBorder() {
      updateSelectedCellStyles(function (style) {
        if (style.border === "all") {
          delete style.border;
        } else {
          style.border = "all";
        }
        return style;
      });
    }

    function clearSelectedFormatting() {
      recordUndo();
      if (model.cellStyles) {
        getSelectedCells().forEach(function (cell) {
          delete model.cellStyles[cellKey(cell.row, cell.column)];
        });
      }
      render();
      syncToolbarState();
      scheduleSave();
    }

    function syncToolbarState() {
      var style = normalizeStyleEntry(getCellStyle(active.row, active.column) || {});
      if (dataTypeSelect) {
        dataTypeSelect.value = style.type || "general";
      }
      if (decimalsSelect) {
        decimalsSelect.value = style.decimals == null ? "" : String(style.decimals);
      }
    }

    function setSelectedDataType(type) {
      var normalizedType = normalizeDataType(type);
      updateSelectedCellStyles(function (style) {
        if (normalizedType === "general") {
          delete style.type;
          delete style.dataType;
        } else {
          style.type = normalizedType;
        }
        return style;
      });
    }

    function setSelectedDecimals(value) {
      var decimals = normalizeDecimalCount(value);
      updateSelectedCellStyles(function (style) {
        if (decimals == null) {
          delete style.decimals;
        } else {
          style.decimals = decimals;
        }
        return style;
      });
    }

    function clearSelectedContent() {
      recordUndo();
      getSelectedCells().forEach(function (cell) {
        setValue(cell.row, cell.column, "");
      });
      render();
      scheduleSave();
    }

    function clearGrid() {
      if (!confirm("Ocistiti cijelu tablicu?")) {
        return;
      }
      recordUndo();
      model.data = Object.create(null);
      model.merges = [];
      model.columnWidths = Object.create(null);
      model.rowHeights = Object.create(null);
      model.cellStyles = Object.create(null);
      active = { row: 0, column: 0 };
      render();
      scheduleSave();
    }

    function downloadJson() {
      var blob = new Blob([JSON.stringify(cloneModel(model), null, 2)], {
        type: "application/json",
      });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "safenexus-gridline.json";
      link.click();
      URL.revokeObjectURL(url);
    }

    grid.addEventListener("focusin", handleFocusIn);
    grid.addEventListener("focusout", handleFocusOut);
    grid.addEventListener("input", handleInput);
    grid.addEventListener("keydown", handleKeydown);
    grid.addEventListener("paste", handlePaste);
    grid.addEventListener("copy", handleCopy);
    grid.addEventListener("cut", handleCut);
    grid.addEventListener("pointerdown", handleGridPointerDown);
    grid.addEventListener("mousedown", handleGridMouseDown);
    grid.addEventListener("mouseover", handleGridMouseOver);
    grid.addEventListener("dblclick", handleFillDoubleClick);
    if (enableAiContextMenu || enableColumnAiSettings) {
      grid.addEventListener("contextmenu", handleGridContextMenu);
    }
    formulaInput.addEventListener("input", handleFormulaInput);
    formulaInput.addEventListener("keydown", handleFormulaKeydown);
    formulaInput.addEventListener("blur", handleFormulaBlur);
    formulaInput.addEventListener("focus", handleFormulaFocus);
    if (addRowButton) {
      addRowButton.addEventListener("click", function () { addRows(1); });
    }
    if (addColumnButton) {
      addColumnButton.addEventListener("click", function () { insertColumns(active.column + 1, 1); });
    }
    if (widenColumnButton) {
      widenColumnButton.addEventListener("click", function () { resizeActiveColumn(18); });
    }
    if (narrowColumnButton) {
      narrowColumnButton.addEventListener("click", function () { resizeActiveColumn(-18); });
    }
    if (tallerRowButton) {
      tallerRowButton.addEventListener("click", function () { resizeActiveRow(8); });
    }
    if (shorterRowButton) {
      shorterRowButton.addEventListener("click", function () { resizeActiveRow(-8); });
    }
    if (mergeButton) {
      mergeButton.addEventListener("click", mergeSelection);
    }
    if (unmergeButton) {
      unmergeButton.addEventListener("click", unmergeActive);
    }
    if (headerRowButton) {
      headerRowButton.addEventListener("click", toggleHeaderRow);
    }
    alignButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setSelectedCellsAlign(button.dataset.gridlineAlign || "");
      });
    });
    backgroundColorButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveCellBackground(button.dataset.gridlineColor || "");
      });
    });
    if (clearButton) {
      clearButton.addEventListener("click", clearGrid);
    }
    if (downloadButton) {
      downloadButton.addEventListener("click", downloadJson);
    }
    if (saveButton) {
      saveButton.addEventListener("click", flushPendingChange);
    }
    if (exportButton) {
      exportButton.addEventListener("click", downloadJson);
    }
    if (quickFillButton) {
      quickFillButton.addEventListener("click", handleQuickFillButtonClick);
    }
    if (undoButton) {
      undoButton.addEventListener("click", undo);
    }
    if (redoButton) {
      redoButton.addEventListener("click", redo);
    }
    if (copyButton) {
      copyButton.addEventListener("click", function () { copySelection(false); });
    }
    if (cutButton) {
      cutButton.addEventListener("click", function () { copySelection(true); });
    }
    if (pasteButton) {
      pasteButton.addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(applyClipboardText).catch(function () {
            setStatus("Zalijepi nije dostupan", "is-saving");
          });
        }
      });
    }
    if (boldButton) {
      boldButton.addEventListener("click", function () { toggleSelectedCellStyle("fontWeight", "bold"); });
    }
    if (italicButton) {
      italicButton.addEventListener("click", function () { toggleSelectedCellStyle("fontStyle", "italic"); });
    }
    if (underlineButton) {
      underlineButton.addEventListener("click", function () { toggleSelectedCellStyle("textDecoration", "underline"); });
    }
    textColorButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setSelectedTextColor(button.dataset.gridlineColor || button.dataset.gridlineTextColor || "");
      });
    });
    if (borderButton) {
      borderButton.addEventListener("click", toggleSelectedBorder);
    }
    if (autoBorderFilledButton) {
      autoBorderFilledButton.addEventListener("click", toggleAutoBorderFilled);
    }
    if (clearFormattingButton) {
      clearFormattingButton.addEventListener("click", clearSelectedFormatting);
    }
    if (deleteRowButton) {
      deleteRowButton.addEventListener("click", function () {
        var bounds = getSelectionBounds();
        deleteRowsInRange(bounds.top, bounds.bottom);
      });
    }
    if (deleteColumnButton) {
      deleteColumnButton.addEventListener("click", function () {
        var bounds = getSelectionBounds();
        deleteColumnsInRange(bounds.left, bounds.right);
      });
    }
    if (sortAscButton) {
      sortAscButton.addEventListener("click", function () { sortByColumn(active.column, "asc"); });
    }
    if (sortDescButton) {
      sortDescButton.addEventListener("click", function () { sortByColumn(active.column, "desc"); });
    }
    if (filterButton) {
      filterButton.addEventListener("click", function (event) { showFilterPanel(event, active.column); });
    }
    if (findButton) {
      findButton.addEventListener("click", function () {
        var query = window.prompt("Pronadi u tablici");
        var row;
        var column;
        if (!query) {
          return;
        }
        for (row = 0; row < model.rowCount; row += 1) {
          for (column = 0; column < model.columnCount; column += 1) {
            if (String(getValue(row, column)).toLowerCase().indexOf(String(query).toLowerCase()) >= 0) {
              selectCell(row, column, { focus: false });
              return;
            }
          }
        }
        setStatus("Nema rezultata", "is-saving");
      });
    }
    if (freezeRowButton) {
      freezeRowButton.addEventListener("click", function () {
        freezeFirstRow = !freezeFirstRow;
        rootElement.classList.toggle("is-gridline-freeze-row", freezeFirstRow);
      });
    }
    if (freezeColumnButton) {
      freezeColumnButton.addEventListener("click", function () {
        freezeFirstColumn = !freezeFirstColumn;
        rootElement.classList.toggle("is-gridline-freeze-column", freezeFirstColumn);
      });
    }
    if (dataTypeSelect) {
      dataTypeSelect.addEventListener("change", function () {
        setSelectedDataType(dataTypeSelect.value);
      });
    }
    if (decimalsSelect) {
      decimalsSelect.addEventListener("change", function () {
        setSelectedDecimals(decimalsSelect.value);
      });
    }
    if (zoomSelect) {
      zoomSelect.addEventListener("change", readZoomControl);
    }
    if (toolsToggleButton) {
      toolsToggleButton.addEventListener("click", toggleGridlineTools);
    }
    if (tableToggleButton) {
      tableToggleButton.addEventListener("click", toggleGridlineTable);
    }
    if (fullscreenButton) {
      fullscreenButton.addEventListener("click", toggleGridlineFullscreen);
    }
    if (titleInput) {
      titleInput.addEventListener("input", handleGridlineTitleInput);
    }
    if (subtitleInput) {
      subtitleInput.addEventListener("input", handleGridlineTitleInput);
    }
    formulaInput.addEventListener("scroll", syncFormulaHighlightScroll);
    window.addEventListener("resize", handleWindowResize);
    document.addEventListener("fullscreenchange", syncFullscreenState);
    applyZoom();
    document.addEventListener("click", hideContextMenu);
    document.addEventListener("click", closeValidationPanel);
    document.addEventListener("click", closeFilterPanel);
    document.addEventListener("mouseup", handleDocumentMouseUp);
    updateHistoryButtons();

    function destroy() {
      flushPendingChange();
      if (computedRefreshFrame) {
        window.cancelAnimationFrame(computedRefreshFrame);
        computedRefreshFrame = 0;
      }
      if (zoomResizeFrame) {
        window.cancelAnimationFrame(zoomResizeFrame);
        zoomResizeFrame = 0;
      }
      hideContextMenu();
      if (quickFillPanel) {
        quickFillPanel.remove();
        quickFillPanel = null;
      }
      if (aiPanel) {
        aiPanel.remove();
        aiPanel = null;
      }
      document.removeEventListener("mousemove", handleSelectionMouseMove);
      document.removeEventListener("pointermove", handleSelectionPointerMove);
      document.removeEventListener("pointerup", handleSelectionPointerUp);
      document.removeEventListener("mousemove", handleFillMouseMove);
      document.removeEventListener("pointermove", handleFillPointerMove);
      document.removeEventListener("pointerup", handleFillPointerUp);
      document.removeEventListener("pointermove", handleColumnResizeMove);
      document.removeEventListener("pointerup", handleColumnResizeUp);
      document.removeEventListener("pointermove", handleRowResizeMove);
      document.removeEventListener("pointerup", handleRowResizeUp);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
      document.body.classList.remove("is-selecting-gridline-cells");
      document.body.classList.remove("is-filling-gridline-cells");
      selectionDrag = null;
      fillDrag = null;
      columnResize = null;
      rowResize = null;
      closeColumnAiPanel();
      closeValidationPanel();
      closeFilterPanel();
      grid.removeEventListener("focusin", handleFocusIn);
      grid.removeEventListener("focusout", handleFocusOut);
      grid.removeEventListener("input", handleInput);
      grid.removeEventListener("keydown", handleKeydown);
      grid.removeEventListener("paste", handlePaste);
      grid.removeEventListener("copy", handleCopy);
      grid.removeEventListener("cut", handleCut);
      grid.removeEventListener("pointerdown", handleGridPointerDown);
      grid.removeEventListener("mousedown", handleGridMouseDown);
      grid.removeEventListener("mouseover", handleGridMouseOver);
      grid.removeEventListener("dblclick", handleFillDoubleClick);
      grid.removeEventListener("contextmenu", handleGridContextMenu);
      formulaInput.removeEventListener("input", handleFormulaInput);
      formulaInput.removeEventListener("keydown", handleFormulaKeydown);
      formulaInput.removeEventListener("blur", handleFormulaBlur);
      formulaInput.removeEventListener("focus", handleFormulaFocus);
      formulaInput.removeEventListener("scroll", syncFormulaHighlightScroll);
      window.removeEventListener("resize", handleWindowResize);
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      if (zoomSelect) {
        zoomSelect.removeEventListener("change", readZoomControl);
      }
      if (titleInput) {
        titleInput.removeEventListener("input", handleGridlineTitleInput);
      }
      if (subtitleInput) {
        subtitleInput.removeEventListener("input", handleGridlineTitleInput);
      }
      if (quickFillButton) {
        quickFillButton.removeEventListener("click", handleQuickFillButtonClick);
      }
      document.removeEventListener("click", hideContextMenu);
      if (rootElement) {
        rootElement.__safeNexusGridlineDestroy = null;
      }
    }

    try {
      render();
      setStatus(storageKey ? "Spremljeno lokalno" : "Spremno", "is-saved");
      loadFormulaTools().then(function (tools) {
        if (!tools) {
          return;
        }
        refreshComputedCells();
        if (onFormulaReady) {
          onFormulaReady();
        }
      });
    } catch (error) {
      showGridError(error);
    }

    if (rootElement) {
      rootElement.__safeNexusGridlineDestroy = destroy;
    }

    return {
      destroy: destroy,
      flush: flushPendingChange,
      getModel: function () { return cloneModel(model); },
      setModel: function (nextModel) {
        model = normalizeModel(nextModel, options);
        syncTitleControlsFromModel();
        render();
        emitChange();
      },
      setAiFiles: function (files) {
        aiState.files = cloneFileMeta(files);
        renderAiPanel();
      },
      addRows: addRows,
      addColumns: addColumns,
    };
  }

  function autoStart() {
    var standaloneGrid = document.querySelector("#grid");
    if (standaloneGrid) {
      mount(document, {
        defaultRows: DEFAULT_ROWS,
        defaultColumns: DEFAULT_COLUMNS,
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-gridline-auto='true']"), function (root) {
      mount(root, {
        storageKey: root.dataset.gridlineStorageKey || "",
      });
    });
  }

  window[GLOBAL_NAME] = {
    mount: mount,
    normalizeModel: normalizeModel,
    createDefaultModel: createDefaultModel,
    rowsToModel: rowsToModel,
    modelToRows: modelToRows,
    columnLabel: columnLabel,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoStart);
  } else {
    autoStart();
  }
})();
