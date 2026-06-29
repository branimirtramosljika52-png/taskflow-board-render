(function () {
  var GLOBAL_NAME = "SafeNexusGridline";
  var DEFAULT_STORAGE_KEY = "safenexus-gridline-standalone-v1";
  var DEFAULT_ROWS = 80;
  var DEFAULT_COLUMNS = 14;
  var MIN_ROWS = 1;
  var MAX_ROWS = 1000;
  var MIN_COLUMNS = 1;
  var MAX_COLUMNS = 60;
  var MIN_COLUMN_WIDTH = 72;
  var MAX_COLUMN_WIDTH = 320;
  var DEFAULT_COLUMN_WIDTH = 132;
  var MIN_ROW_HEIGHT = 28;
  var MAX_ROW_HEIGHT = 96;
  var DEFAULT_ROW_HEIGHT = 36;

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

  var formulaTools = window.SafeNexusMeasurementFormula || null;
  var formulaToolsPromise = null;

  function loadFormulaTools() {
    if (formulaTools) {
      return Promise.resolve(formulaTools);
    }
    if (!formulaToolsPromise) {
      formulaToolsPromise = import("/src/measurementFormula.js")
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
              return "";
            }
            if (parsed.rowIndex >= model.rowCount || parsed.columnIndex >= model.columnCount) {
              return "";
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
      var backgroundColor = String(entry.backgroundColor || "").trim();
      var textAlign = String(entry.textAlign || entry.align || "").trim().toLowerCase();
      var nextEntry = {};
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
      if (/^#[0-9a-f]{6}$/i.test(backgroundColor)) {
        nextEntry.backgroundColor = backgroundColor;
      }
      if (["left", "center", "right"].indexOf(textAlign) >= 0) {
        nextEntry.textAlign = textAlign;
      }
      if (Object.keys(nextEntry).length) {
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

  function makeCellStyle(backgroundColor, textAlign) {
    var style = {};
    if (/^#[0-9a-f]{6}$/i.test(String(backgroundColor || "").trim())) {
      style.backgroundColor = String(backgroundColor).trim();
    }
    if (["left", "center", "right"].indexOf(String(textAlign || "").trim().toLowerCase()) >= 0) {
      style.textAlign = String(textAlign).trim().toLowerCase();
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
      rowCount: rowCount,
      columnCount: columnCount,
      data: data,
      merges: [],
      columnWidths: Object.create(null),
      rowHeights: Object.create(null),
      cellStyles: Object.create(null),
      headerRows: Array.isArray(options && options.headerRows) ? normalizeHeaderRows(options.headerRows, rowCount) : [],
      aiColumns: Object.create(null),
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
      rowCount: rowCount,
      columnCount: columnCount,
      data: data,
      merges: merges,
      columnWidths: columnWidths,
      rowHeights: rowHeights,
      cellStyles: cellStyles,
      headerRows: headerRows,
      aiColumns: aiColumns,
    };
  }

  function cloneModel(model) {
    return {
      rowCount: model.rowCount,
      columnCount: model.columnCount,
      data: Object.assign(Object.create(null), model.data),
      merges: normalizeMerges(model.merges, model.rowCount, model.columnCount),
      columnWidths: normalizeNumberMap(model.columnWidths, model.columnCount, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH),
      rowHeights: normalizeNumberMap(model.rowHeights, model.rowCount, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT),
      cellStyles: normalizeCellStyles(model.cellStyles, model.rowCount, model.columnCount),
      headerRows: normalizeHeaderRows(model.headerRows, model.rowCount),
      aiColumns: cloneAiColumns(model.aiColumns, model.columnCount),
    };
  }

  function getClosestCellInput(target) {
    if (!target || typeof target.closest !== "function") {
      return null;
    }
    return target.closest("input.cell");
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
    var downloadButton = resolveElement(host, "[data-gridline-action='download']", "#download");
    var quickFillButton = resolveElement(host, "[data-gridline-action='quick-fill']", "#quick-fill");
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
    var selectionDrag = null;
    var selection = { startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 };
    var quickFillPanel = null;
    var contextMenu = null;
    var aiPanel = null;
    var columnAiPanel = null;
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

    if (rootElement && rootElement.__safeNexusGridlineDestroy) {
      rootElement.__safeNexusGridlineDestroy();
    }

    model = options && options.model
      ? normalizeModel(options.model, options)
      : (readStoredModel(storageKey, options) || createDefaultModel(options));

    function setStatus(text, className) {
      var nextClassName = ("status " + (className || "")).trim();
      if (status.textContent === text && status.className === nextClassName) {
        return;
      }
      status.textContent = text;
      status.className = nextClassName;
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
      return getModelCellDisplayValue(model, row, column, options);
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

    function isInputEditing(input) {
      return input && document.activeElement === input;
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
      input.classList.toggle("is-formula", isFormulaText(rawValue));
      input.classList.toggle("is-formula-error", isFormulaText(rawValue) && displayValue === "#ERROR");
      input.title = isFormulaText(rawValue) && displayValue === "#ERROR"
        ? "Formula se ne moze izracunati."
        : "";
    }

    function refreshComputedCells() {
      computedRefreshFrame = 0;
      Array.prototype.forEach.call(grid.querySelectorAll("input.cell"), function (input) {
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
      return grid.querySelector('input[data-row="' + row + '"][data-column="' + column + '"]');
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

    function handleSelectionPointerMove(event) {
      var td;
      if (!selectionDrag) {
        return;
      }
      td = getCellFromPoint(event.clientX, event.clientY);
      if (!td) {
        return;
      }
      selectCell(Number(td.dataset.row), Number(td.dataset.column), {
        focus: false,
        extend: true,
      });
    }

    function handleSelectionPointerUp() {
      document.removeEventListener("pointermove", handleSelectionPointerMove);
      document.removeEventListener("pointerup", handleSelectionPointerUp);
      selectionDrag = null;
    }

    function markFillPreview(targetRow, targetColumn) {
      var source;
      var start;
      var end;
      var index;
      var td;
      clearFillPreview();
      if (!fillDrag) {
        return;
      }
      source = fillDrag.source;
      if (targetRow !== source.row) {
        start = Math.min(source.row, targetRow);
        end = Math.max(source.row, targetRow);
        for (index = start; index <= end; index += 1) {
          if (index === source.row) {
            continue;
          }
          td = grid.querySelector('td[data-row="' + index + '"][data-column="' + source.column + '"]');
          if (td) {
            td.classList.add("is-fill-preview");
          }
        }
        return;
      }
      if (targetColumn !== source.column) {
        start = Math.min(source.column, targetColumn);
        end = Math.max(source.column, targetColumn);
        for (index = start; index <= end; index += 1) {
          if (index === source.column) {
            continue;
          }
          td = grid.querySelector('td[data-row="' + source.row + '"][data-column="' + index + '"]');
          if (td) {
            td.classList.add("is-fill-preview");
          }
        }
      }
    }

    function applyFillRange(targetRow, targetColumn) {
      var source;
      var sourceValue;
      var start;
      var end;
      var index;
      var rowOffset;
      var columnOffset;
      var changedSize = false;
      if (!fillDrag) {
        return;
      }
      source = fillDrag.source;
      sourceValue = getValue(source.row, source.column);
      if (targetRow !== source.row) {
        start = Math.min(source.row, targetRow);
        end = Math.max(source.row, targetRow);
        if (ensureSize(end, source.column)) {
          changedSize = true;
        }
        for (index = start; index <= end; index += 1) {
          if (index === source.row) {
            continue;
          }
          rowOffset = index - source.row;
          setValue(index, source.column, shiftFormulaValue(sourceValue, rowOffset, 0));
        }
      } else if (targetColumn !== source.column) {
        start = Math.min(source.column, targetColumn);
        end = Math.max(source.column, targetColumn);
        if (ensureSize(source.row, end)) {
          changedSize = true;
        }
        for (index = start; index <= end; index += 1) {
          if (index === source.column) {
            continue;
          }
          columnOffset = index - source.column;
          setValue(source.row, index, shiftFormulaValue(sourceValue, 0, columnOffset));
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

    function handleFillPointerMove(event) {
      var td;
      var targetRow;
      var targetColumn;
      if (!fillDrag) {
        return;
      }
      td = getCellFromPoint(event.clientX, event.clientY);
      if (!td) {
        return;
      }
      targetRow = Number(td.dataset.row);
      targetColumn = Number(td.dataset.column);
      if (Math.abs(targetRow - fillDrag.source.row) >= Math.abs(targetColumn - fillDrag.source.column)) {
        targetColumn = fillDrag.source.column;
      } else {
        targetRow = fillDrag.source.row;
      }
      fillDrag.target = { row: targetRow, column: targetColumn };
      markFillPreview(targetRow, targetColumn);
    }

    function handleFillPointerUp() {
      var target = fillDrag && fillDrag.target;
      document.removeEventListener("pointermove", handleFillPointerMove);
      document.removeEventListener("pointerup", handleFillPointerUp);
      clearFillPreview();
      if (target) {
        applyFillRange(target.row, target.column);
      }
      fillDrag = null;
    }

    function handleFillPointerDown(event) {
      var handle = event.target && event.target.closest ? event.target.closest(".gridline-fill-handle") : null;
      if (!handle) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      fillDrag = {
        source: { row: active.row, column: active.column },
        target: null,
      };
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

    function handleGridPointerDown(event) {
      var resizer = event.target && event.target.closest
        ? event.target.closest("[data-gridline-column-resizer]")
        : null;
      var input;
      var cell;
      if (resizer && grid.contains(resizer)) {
        event.preventDefault();
        event.stopPropagation();
        columnResize = {
          column: clampInteger(resizer.dataset.gridlineColumnResizer, active.column, 0, model.columnCount - 1),
          startX: event.clientX,
          startWidth: getColumnWidth(clampInteger(resizer.dataset.gridlineColumnResizer, active.column, 0, model.columnCount - 1)),
        };
        document.addEventListener("pointermove", handleColumnResizeMove);
        document.addEventListener("pointerup", handleColumnResizeUp);
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
        };
        selectCell(selectionDrag.startRow, selectionDrag.startColumn, { focus: false });
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
      var endRow;
      if (!handle) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      fillDrag = {
        source: { row: active.row, column: active.column },
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
      if (extend) {
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
      cellRef.textContent = columnLabel(active.column) + (active.row + 1);
      formulaInput.value = getValue(active.row, active.column);
      Array.prototype.forEach.call(grid.querySelectorAll("td.is-range-selected"), function (node) {
        node.classList.remove("is-range-selected");
      });
      Array.prototype.forEach.call(grid.querySelectorAll("td[data-row][data-column]"), function (node) {
        if (isCellInSelection(Number(node.dataset.row), Number(node.dataset.column))) {
          node.classList.add("is-range-selected");
        }
      });
      if (input) {
        syncInputDisplay(input, focus || isInputEditing(input));
      }
      if (focus && input) {
        input.focus();
        input.select();
      }
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
        th.textContent = columnLabel(column);
        th.dataset.column = String(column);
        th.style.width = getColumnWidth(column) + "px";
        th.style.minWidth = getColumnWidth(column) + "px";
        th.classList.toggle("has-ai-column", Boolean(columnAi && columnAi.enabled !== false));
        th.title = columnAi
          ? "Desni klik: NexAI postavke kolone"
          : "Povuci rub za promjenu širine. Desni klik: NexAI postavke kolone";
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
        rowHead = document.createElement("th");
        rowHead.textContent = String(row + 1);
        rowHead.style.height = getRowHeight(row) + "px";
        rowHead.classList.toggle("is-header-row", isHeaderRow(row));
        if (isHeaderRow(row)) {
          rowHead.title = "Naslovni red koji se ponavlja u PDF-u";
        }
        tr.appendChild(rowHead);
        for (column = 0; column < model.columnCount; column += 1) {
          var merge = getCoveringMerge(row, column);
          var cellStyle = getCellStyle(row, column);
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
          if (cellStyle && cellStyle.backgroundColor) {
            td.style.backgroundColor = cellStyle.backgroundColor;
          }
          if (cellStyle && cellStyle.textAlign) {
            td.style.textAlign = cellStyle.textAlign;
          }
          if (isCellInSelection(row, column)) {
            td.classList.add("is-range-selected");
          }
          input = document.createElement("input");
          input.className = merge ? "cell is-merged-input" : "cell";
          input.autocomplete = "off";
          input.spellcheck = false;
          input.dataset.row = String(row);
          input.dataset.column = String(column);
          if (cellStyle && cellStyle.backgroundColor) {
            input.style.backgroundColor = cellStyle.backgroundColor;
          }
          if (cellStyle && cellStyle.textAlign) {
            input.style.textAlign = cellStyle.textAlign;
          }
          syncInputDisplay(input, false);
          td.appendChild(input);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      fragment.appendChild(tbody);
      clearNode(grid);
      selectedCell = null;
      grid.appendChild(fragment);
      selectCell(active.row, active.column, { focus: false });
    }

    function handlePaste(event) {
      var text = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
      var rows;
      var changedSize = false;
      if (text.indexOf("\t") === -1 && text.indexOf("\n") === -1) {
        return;
      }
      event.preventDefault();
      rows = text.replace(/\r/g, "").split("\n").filter(function (row) {
        return row.length > 0;
      });
      rows.forEach(function (line, rowOffset) {
        line.split("\t").forEach(function (value, columnOffset) {
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
      if (changedSize) {
        render();
      }
      formulaInput.value = getValue(active.row, active.column);
      scheduleSave();
    }

    function handleFocusIn(event) {
      var input = getClosestCellInput(event.target);
      if (!input) {
        return;
      }
      selectCell(Number(input.dataset.row), Number(input.dataset.column), { focus: false });
    }

    function handleFocusOut(event) {
      var input = getClosestCellInput(event.target);
      if (!input) {
        return;
      }
      window.setTimeout(function () {
        if (!isInputEditing(input)) {
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
      row = Number(input.dataset.row);
      column = Number(input.dataset.column);
      setValue(row, column, input.value);
      if (row === active.row && column === active.column) {
        formulaInput.value = input.value;
      }
      scheduleSave();
    }

    function handleKeydown(event) {
      var input = getClosestCellInput(event.target);
      var row;
      var column;
      function move(nextRow, nextColumn) {
        event.preventDefault();
        if (ensureSize(nextRow, nextColumn)) {
          render();
        }
        selectCell(nextRow, nextColumn);
      }
      if (!input) {
        return;
      }
      row = Number(input.dataset.row);
      column = Number(input.dataset.column);
      if (event.key === "Enter") {
        move(row + (event.shiftKey ? -1 : 1), column);
      } else if (event.key === "Tab") {
        move(row, column + (event.shiftKey ? -1 : 1));
      } else if (event.key === "ArrowDown" && input.selectionStart === input.value.length) {
        move(row + 1, column);
      } else if (event.key === "ArrowUp" && input.selectionStart === 0) {
        move(row - 1, column);
      }
    }

    function handleFormulaInput() {
      var input;
      setValue(active.row, active.column, formulaInput.value);
      input = getInput(active.row, active.column);
      if (input) {
        input.value = formulaInput.value;
        input.dataset.rawValue = formulaInput.value;
        input.classList.toggle("is-formula", isFormulaText(formulaInput.value));
      }
      scheduleSave();
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

    function showAiContextMenu(event, row, column) {
      if (!enableAiContextMenu) {
        return;
      }
      event.preventDefault();
      selectCell(row, column, { focus: false });
      hideContextMenu();
      contextMenu = document.createElement("div");
      contextMenu.className = "gridline-context-menu";
      contextMenu.style.left = event.clientX + "px";
      contextMenu.style.top = event.clientY + "px";
      contextMenu.append(
        createContextMenuButton("NexAI popuni celiju", "cell"),
        createContextMenuButton("NexAI popuni red", "row"),
        createContextMenuButton("NexAI popuni tablicu", "table")
      );
      document.body.appendChild(contextMenu);
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
      var input = getClosestCellInput(event.target);
      if (columnHeader && grid.contains(columnHeader)) {
        showColumnAiSettingsPanel(event, Number(columnHeader.dataset.column));
        return;
      }
      if (!input) {
        return;
      }
      showAiContextMenu(event, Number(input.dataset.row), Number(input.dataset.column));
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

    function addRows(count) {
      model.rowCount = clampInteger(model.rowCount + count, model.rowCount, MIN_ROWS, MAX_ROWS);
      render();
      scheduleSave();
    }

    function addColumns(count) {
      model.columnCount = clampInteger(model.columnCount + count, model.columnCount, MIN_COLUMNS, MAX_COLUMNS);
      render();
      scheduleSave();
    }

    function resizeActiveColumn(delta) {
      var column = Math.max(0, Math.min(model.columnCount - 1, active.column));
      var nextWidth = clampInteger(getColumnWidth(column) + delta, DEFAULT_COLUMN_WIDTH, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
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
      getSelectedCells().forEach(function (cell) {
        var key = cellKey(cell.row, cell.column);
        var existing = model.cellStyles[key] || {};
        var nextStyle = makeCellStyle(existing.backgroundColor || "", normalizedAlign);
        if (Object.keys(nextStyle).length) {
          model.cellStyles[key] = nextStyle;
        } else {
          delete model.cellStyles[key];
        }
      });
      render();
      scheduleSave();
    }

    function setActiveCellBackground(color) {
      var normalizedColor = String(color || "").trim();
      var cells = getSelectedCells();
      if (!model.cellStyles) {
        model.cellStyles = Object.create(null);
      }
      cells.forEach(function (cell) {
        var key = cellKey(cell.row, cell.column);
        var existing = model.cellStyles[key] || {};
        var nextStyle = makeCellStyle(normalizedColor, existing.textAlign || "");
        if (Object.keys(nextStyle).length) {
          model.cellStyles[key] = nextStyle;
        } else {
          delete model.cellStyles[key];
        }
      });
      render();
      scheduleSave();
    }

    function clearGrid() {
      if (!confirm("Ocistiti cijelu tablicu?")) {
        return;
      }
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
    grid.addEventListener("pointerdown", handleGridPointerDown);
    grid.addEventListener("dblclick", handleFillDoubleClick);
    if (enableAiContextMenu || enableColumnAiSettings) {
      grid.addEventListener("contextmenu", handleGridContextMenu);
    }
    formulaInput.addEventListener("input", handleFormulaInput);
    if (addRowButton) {
      addRowButton.addEventListener("click", function () { addRows(20); });
    }
    if (addColumnButton) {
      addColumnButton.addEventListener("click", function () { addColumns(4); });
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
    if (quickFillButton) {
      quickFillButton.addEventListener("click", handleQuickFillButtonClick);
    }
    document.addEventListener("click", hideContextMenu);

    function destroy() {
      flushPendingChange();
      if (computedRefreshFrame) {
        window.cancelAnimationFrame(computedRefreshFrame);
        computedRefreshFrame = 0;
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
      document.removeEventListener("pointermove", handleSelectionPointerMove);
      document.removeEventListener("pointerup", handleSelectionPointerUp);
      document.removeEventListener("pointermove", handleFillPointerMove);
      document.removeEventListener("pointerup", handleFillPointerUp);
      document.removeEventListener("pointermove", handleColumnResizeMove);
      document.removeEventListener("pointerup", handleColumnResizeUp);
      selectionDrag = null;
      fillDrag = null;
      columnResize = null;
      closeColumnAiPanel();
      grid.removeEventListener("focusin", handleFocusIn);
      grid.removeEventListener("focusout", handleFocusOut);
      grid.removeEventListener("input", handleInput);
      grid.removeEventListener("keydown", handleKeydown);
      grid.removeEventListener("paste", handlePaste);
      grid.removeEventListener("pointerdown", handleGridPointerDown);
      grid.removeEventListener("dblclick", handleFillDoubleClick);
      grid.removeEventListener("contextmenu", handleGridContextMenu);
      formulaInput.removeEventListener("input", handleFormulaInput);
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
