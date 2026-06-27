(function () {
  var GLOBAL_NAME = "SafeNexusGridline";
  var DEFAULT_STORAGE_KEY = "safenexus-gridline-standalone-v1";
  var DEFAULT_ROWS = 80;
  var DEFAULT_COLUMNS = 14;
  var MIN_ROWS = 1;
  var MAX_ROWS = 1000;
  var MIN_COLUMNS = 1;
  var MAX_COLUMNS = 60;

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
    };
  }

  function modelToRows(model, options) {
    var normalized = normalizeModel(model, options);
    return Array.from({ length: normalized.rowCount }, function (_, rowIndex) {
      return Array.from({ length: normalized.columnCount }, function (_, columnIndex) {
        return normalized.data[cellKey(rowIndex, columnIndex)] || "";
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
    };
  }

  function cloneModel(model) {
    return {
      rowCount: model.rowCount,
      columnCount: model.columnCount,
      data: Object.assign(Object.create(null), model.data),
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
    var clearButton = resolveElement(host, "[data-gridline-action='clear']", "#clear");
    var downloadButton = resolveElement(host, "[data-gridline-action='download']", "#download");
    var rootElement = grid ? grid.closest("[data-gridline-instance]") || host : host;
    var model;
    var active = { row: 0, column: 0 };
    var selectedCell = null;
    var saveTimer = 0;
    var saveDelay = clampInteger(options && options.saveDelayMs, 450, 0, 60000);
    var storageKey = options && Object.prototype.hasOwnProperty.call(options, "storageKey")
      ? options.storageKey
      : (rootElement && rootElement.dataset ? rootElement.dataset.gridlineStorageKey : "") || DEFAULT_STORAGE_KEY;
    var onChange = options && typeof options.onChange === "function" ? options.onChange : null;
    var changeMode = String(options && (options.changeMode || options.emitChangeMode) || "input").toLowerCase();
    var autoGrow = !(options && options.autoGrow === false);
    var pendingExternalChange = false;

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

    function selectCell(row, column, selectOptions) {
      var focus = !selectOptions || selectOptions.focus !== false;
      var input;
      var td;
      active = {
        row: Math.max(0, Math.min(model.rowCount - 1, row)),
        column: Math.max(0, Math.min(model.columnCount - 1, column)),
      };
      if (selectedCell) {
        selectedCell.classList.remove("is-selected");
        selectedCell = null;
      }
      input = getInput(active.row, active.column);
      td = input ? input.parentElement : null;
      if (td) {
        td.classList.add("is-selected");
        selectedCell = td;
      }
      cellRef.textContent = columnLabel(active.column) + (active.row + 1);
      formulaInput.value = getValue(active.row, active.column);
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
        th = document.createElement("th");
        th.textContent = columnLabel(column);
        headRow.appendChild(th);
      }
      thead.appendChild(headRow);
      fragment.appendChild(thead);

      for (row = 0; row < model.rowCount; row += 1) {
        tr = document.createElement("tr");
        rowHead = document.createElement("th");
        rowHead.textContent = String(row + 1);
        tr.appendChild(rowHead);
        for (column = 0; column < model.columnCount; column += 1) {
          td = document.createElement("td");
          td.dataset.row = String(row);
          td.dataset.column = String(column);
          input = document.createElement("input");
          input.className = "cell";
          input.value = getValue(row, column);
          input.autocomplete = "off";
          input.spellcheck = false;
          input.dataset.row = String(row);
          input.dataset.column = String(column);
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
            input.value = value;
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
      }
      scheduleSave();
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

    function clearGrid() {
      if (!confirm("Ocistiti cijelu tablicu?")) {
        return;
      }
      model.data = Object.create(null);
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
    grid.addEventListener("input", handleInput);
    grid.addEventListener("keydown", handleKeydown);
    grid.addEventListener("paste", handlePaste);
    formulaInput.addEventListener("input", handleFormulaInput);
    if (addRowButton) {
      addRowButton.addEventListener("click", function () { addRows(20); });
    }
    if (addColumnButton) {
      addColumnButton.addEventListener("click", function () { addColumns(4); });
    }
    if (clearButton) {
      clearButton.addEventListener("click", clearGrid);
    }
    if (downloadButton) {
      downloadButton.addEventListener("click", downloadJson);
    }

    function destroy() {
      flushPendingChange();
      grid.removeEventListener("focusin", handleFocusIn);
      grid.removeEventListener("input", handleInput);
      grid.removeEventListener("keydown", handleKeydown);
      grid.removeEventListener("paste", handlePaste);
      formulaInput.removeEventListener("input", handleFormulaInput);
      if (rootElement) {
        rootElement.__safeNexusGridlineDestroy = null;
      }
    }

    try {
      render();
      setStatus(storageKey ? "Spremljeno lokalno" : "Spremno", "is-saved");
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
