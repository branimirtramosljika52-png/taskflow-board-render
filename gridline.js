(function () {
  var STORAGE_KEY = "safenexus-gridline-standalone-v1";
  var INITIAL_ROWS = 80;
  var INITIAL_COLUMNS = 14;

  function start() {
    var grid = document.querySelector("#grid");
    var status = document.querySelector("#status");
    var formulaInput = document.querySelector("#formula-input");
    var cellRef = document.querySelector("#cell-ref");
    var addRowButton = document.querySelector("#add-row");
    var clearButton = document.querySelector("#clear");
    var downloadButton = document.querySelector("#download");

    if (!grid || !status || !formulaInput || !cellRef) {
      return;
    }

    var rowCount = INITIAL_ROWS;
    var columnCount = INITIAL_COLUMNS;
    var data = Object.create(null);
    var active = { row: 0, column: 0 };
    var saveTimer = 0;

    function clearNode(node) {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
    }

    function getClosestCellInput(target) {
      if (!target || typeof target.closest !== "function") {
        return null;
      }
      return target.closest("input.cell");
    }

    function setStatus(text, className) {
      status.textContent = text;
      status.className = ("status " + (className || "")).trim();
    }

    function showGridError(error) {
      clearNode(grid);
      var tbody = document.createElement("tbody");
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      var box = document.createElement("div");
      td.colSpan = 2;
      box.className = "grid-error";
      box.textContent = "Grid se nije mogao nacrtati na ovom browseru: " + (error && error.message ? error.message : "nepoznata greska");
      td.appendChild(box);
      tr.appendChild(td);
      tbody.appendChild(tr);
      grid.appendChild(tbody);
      setStatus("Greska prikaza", "is-saving");
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

    function key(row, column) {
      return row + ":" + column;
    }

    function getValue(row, column) {
      return data[key(row, column)] || "";
    }

    function setValue(row, column, value) {
      var id = key(row, column);
      var next = String(value || "");
      if (next) {
        data[id] = next;
      } else {
        delete data[id];
      }
    }

    function scheduleSave() {
      setStatus("Lokalna izmjena", "is-saving");
      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }
      saveTimer = window.setTimeout(function () {
        saveTimer = 0;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ rowCount: rowCount, columnCount: columnCount, data: data }));
        setStatus("Spremljeno lokalno", "is-saved");
      }, 450);
    }

    function load() {
      var saved;
      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved && typeof saved === "object") {
          rowCount = Math.max(INITIAL_ROWS, Number(saved.rowCount) || INITIAL_ROWS);
          columnCount = Math.max(INITIAL_COLUMNS, Number(saved.columnCount) || INITIAL_COLUMNS);
          data = saved.data && typeof saved.data === "object" ? Object.assign(Object.create(null), saved.data) : Object.create(null);
        }
      } catch (error) {
        data = Object.create(null);
      }
    }

    function getInput(row, column) {
      return grid.querySelector('input[data-row="' + row + '"][data-column="' + column + '"]');
    }

    function selectCell(row, column, options) {
      var focus = !options || options.focus !== false;
      var input;
      var td;
      active = {
        row: Math.max(0, Math.min(rowCount - 1, row)),
        column: Math.max(0, Math.min(columnCount - 1, column)),
      };
      Array.prototype.forEach.call(grid.querySelectorAll("td.is-selected"), function (cell) {
        cell.classList.remove("is-selected");
      });
      input = getInput(active.row, active.column);
      td = input ? input.parentElement : null;
      if (td) {
        td.classList.add("is-selected");
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
      for (column = 0; column < columnCount; column += 1) {
        th = document.createElement("th");
        th.textContent = columnLabel(column);
        headRow.appendChild(th);
      }
      thead.appendChild(headRow);
      fragment.appendChild(thead);

      for (row = 0; row < rowCount; row += 1) {
        tr = document.createElement("tr");
        rowHead = document.createElement("th");
        rowHead.textContent = String(row + 1);
        tr.appendChild(rowHead);
        for (column = 0; column < columnCount; column += 1) {
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
      grid.appendChild(fragment);
      selectCell(active.row, active.column, { focus: false });
    }

    function handlePaste(event) {
      var text = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
      var rows;
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
          if (row >= rowCount || column >= columnCount) {
            return;
          }
          setValue(row, column, value);
          input = getInput(row, column);
          if (input) {
            input.value = value;
          }
        });
      });
      formulaInput.value = getValue(active.row, active.column);
      scheduleSave();
    }

    grid.addEventListener("focusin", function (event) {
      var input = getClosestCellInput(event.target);
      if (!input) {
        return;
      }
      selectCell(Number(input.dataset.row), Number(input.dataset.column), { focus: false });
    });

    grid.addEventListener("input", function (event) {
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
    });

    grid.addEventListener("keydown", function (event) {
      var input = getClosestCellInput(event.target);
      var row;
      var column;
      function move(nextRow, nextColumn) {
        event.preventDefault();
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
    });

    grid.addEventListener("paste", handlePaste);

    formulaInput.addEventListener("input", function () {
      var input;
      setValue(active.row, active.column, formulaInput.value);
      input = getInput(active.row, active.column);
      if (input) {
        input.value = formulaInput.value;
      }
      scheduleSave();
    });

    if (addRowButton) {
      addRowButton.addEventListener("click", function () {
        rowCount += 20;
        render();
        scheduleSave();
      });
    }

    if (clearButton) {
      clearButton.addEventListener("click", function () {
        if (!confirm("Ocistiti cijelu tablicu?")) {
          return;
        }
        data = Object.create(null);
        active = { row: 0, column: 0 };
        render();
        scheduleSave();
      });
    }

    if (downloadButton) {
      downloadButton.addEventListener("click", function () {
        var blob = new Blob([JSON.stringify({ rowCount: rowCount, columnCount: columnCount, data: data }, null, 2)], {
          type: "application/json",
        });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "safenexus-gridline.json";
        link.click();
        URL.revokeObjectURL(url);
      });
    }

    load();
    try {
      render();
    } catch (error) {
      showGridError(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
