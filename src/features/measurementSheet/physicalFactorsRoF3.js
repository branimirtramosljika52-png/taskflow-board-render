import {
  formatMeasurementCellReference,
  parseMeasurementCellReference,
} from "../../measurementFormula.js";

const PHYSICAL_FACTORS_RO_F3_DATA_ROW_COUNT = 120;
export const PHYSICAL_FACTORS_RO_F3_MIN_INLINE_DATA_ROW_COUNT = 36;
export const PHYSICAL_FACTORS_RO_F3_MAX_INLINE_DATA_ROW_COUNT = 80;

const PHYSICAL_FACTORS_RO_F3_HEADERS = {
  A: "Prostor/    Prostorija*",
  B: "ID prostor",
  C: "Redni broj",
  D: "Mjerno mjesto*",
  E: "Opis MM",
  F: "Izmjereno opće osvjetljenje [lx]*",
  G: "Izmjereno s dopunskim osvjetljenjem [lx]",
  H: "Propisano osvjetljenje [lx]*",
  I: "DA/NE",
  J: "json",
  K: "Prostor/    Prostorija*",
  L: "ID prostor",
  M: "Redni broj",
  N: "Mjerno mjesto*",
  O: "Opis MM",
  P: "Ekvivalentna razina buke [dB]*",
  Q: "Dopuštena razina ekvivalentne buke [dB]*",
  R: "Vršna buka [dB]",
  S: "Vrijeme izloženosti buci [h]",
  T: "Dnevna izloženost [dB]",
  U: "Proizvoljno polje 1 - naziv",
  V: "Proizvoljno polje 1 - vrijednost",
  W: "Proizvoljno polje 2 - naziv",
  X: "Proizvoljno polje 2 - vrijednost",
  Y: "DA/NE",
  Z: "json",
  AA: "Prostor/    Prostorija*",
  AB: "ID prostor",
  AC: "Redni broj",
  AD: "Mjerno mjesto*",
  AE: "Opis MM",
  AF: "Izmjerena temperatura zraka [°C]*",
  AG: "Dopuštena temperatura zraka [°C]*",
  AH: "Izmjerena brzina strujanja zraka [m/s]*",
  AI: "Dopuštena brzina strujanja zraka [m/s]*",
  AJ: "Izmjerena relativna vlažnost zraka [%]*",
  AK: "Preporučena relativna vlažnost zraka [%]*",
  AL: "DA/NE",
  AM: "json",
  AN: "Podaci o izvoru vibracija",
  AO: "Djelovanje vibracija na",
  AQ: "Pozicija tijela",
  AW: "Naziv",
  AX: "Izmjerene vrijednosti A(8)",
  AY: "Proizvoljno polje 1 - naziv",
  AZ: "Proizvoljno polje 1 - vrijednost",
  BA: "Proizvoljno polje 2 - naziv",
  BB: "Proizvoljno polje 2 - vrijednost",
  BC: "DA/NE",
  BD: "json",
  BE: "status",
};

const PHYSICAL_FACTORS_RO_F3_SUBHEADERS = {
  AO: "Sustav Šaka-Ruka",
  AP: "Cijelo tijelo",
  AQ: "Sjedeća pozicija - Leđa",
  AR: "Sjedeća pozicija - Gornja površina sjedenja",
  AS: "Sjedeća pozicija - Stopala",
  AT: "Stojeća pozicija",
  AU: "Ležeća pozicija - Leđa",
  AV: "Ležeća pozicija - Glava",
};

function getPhysicalFactorsRoF3ColumnLetter(index) {
  return formatMeasurementCellReference(0, index).replace(/\d+$/, "");
}

export function buildPhysicalFactorsRoF3Format({
  fillColor = "",
  bold = false,
  align = "auto",
  verticalAlign = "middle",
  border = "none",
  type = "general",
  decimals = 2,
} = {}) {
  return {
    type,
    decimals,
    align,
    verticalAlign,
    fontFamily: "default",
    fontSize: 12,
    bold,
    italic: false,
    underline: false,
    fillColor,
    border,
    conditional: {
      filled: false,
      fillColor: "",
      border: "none",
      bold: false,
      italic: false,
      underline: false,
    },
  };
}

function getPhysicalFactorsRoF3ColumnFill(letter = "") {
  const index = parseMeasurementCellReference(`${letter}1`).columnIndex;
  if (index <= parseMeasurementCellReference("J1").columnIndex) {
    return "#eef5ff";
  }
  if (index <= parseMeasurementCellReference("Z1").columnIndex) {
    return "#fff3e6";
  }
  if (index <= parseMeasurementCellReference("AM1").columnIndex) {
    return "#eefbf4";
  }
  return "#f5f0ff";
}

function buildPhysicalFactorsRoF3Columns() {
  const daNeValidation = {
    type: "list",
    sourceMode: "custom",
    options: ["Da", "Ne"],
    allowCustom: false,
  };
  const daNeUpperValidation = {
    type: "list",
    sourceMode: "custom",
    options: ["DA", "NE"],
    allowCustom: false,
  };
  const statusValidation = {
    type: "list",
    sourceMode: "custom",
    options: ["novo", "učitano", "poslano", "greška"],
    allowCustom: true,
  };
  const narrowColumns = new Set(["C", "I", "M", "Y", "AC", "AL", "BC", "BE"]);
  const jsonColumns = new Set(["J", "Z", "AM", "BD"]);
  const numericColumns = new Set(["C", "F", "G", "H", "M", "P", "Q", "R", "S", "T", "AC", "AF", "AH", "AJ", "AW", "AX"]);
  const daNeColumns = new Set(["I", "Y", "AL", "BC"]);
  const daNeUpperColumns = new Set(["A", "K", "AA", "AN", "AO", "AP", "AQ", "AR", "AS", "AT", "AU", "AV"]);

  return Array.from({ length: 57 }, (_, index) => {
    const letter = getPhysicalFactorsRoF3ColumnLetter(index);
    return {
      id: `ro-f3-${letter.toLowerCase()}`,
      label: letter,
      placeholder: PHYSICAL_FACTORS_RO_F3_HEADERS[letter] || "",
      width: jsonColumns.has(letter)
        ? 72
        : narrowColumns.has(letter)
          ? 88
          : letter.length > 1
            ? 146
            : 156,
      computed: null,
      readonly: false,
      validation: daNeColumns.has(letter)
        ? daNeValidation
        : daNeUpperColumns.has(letter)
          ? daNeUpperValidation
          : letter === "BE"
            ? statusValidation
            : { type: "none", sourceMode: "column", sourceColumnId: "", options: [], allowCustom: true },
      aiMapping: {
        enabled: false,
        key: "",
        label: PHYSICAL_FACTORS_RO_F3_HEADERS[letter] || letter,
        description: "",
        type: numericColumns.has(letter) ? "number" : "text",
        required: false,
        placeholder: "",
        helpText: "",
        aiDescription: "",
        aiLookFor: [],
        aiAvoid: "",
        synonyms: [],
        allowedValues: [],
        commonValues: [],
        examples: [],
        avoid: "",
        format: numericColumns.has(letter) ? "number" : "text",
        unit: "",
        defaultValue: "",
        fallbackValue: "",
        confidenceRequired: "medium",
        sourceTracking: true,
        validationRules: "",
        displayOrder: index + 1,
        group: "RO-F.3",
      },
    };
  });
}

function setPhysicalFactorsRoF3Cell(row, columnsByLetter, letter, value, format = null) {
  const columnId = columnsByLetter.get(letter);
  if (!columnId) {
    return;
  }

  row.cells[columnId] = value;
  if (format) {
    row.formats[columnId] = format;
  }
}

function createPhysicalFactorsRoF3Row(rowNumber, columns, valuesByLetter = {}, formatsByLetter = {}) {
  const columnsByLetter = new Map(columns.map((column) => [String(column.label || "").trim(), column.id]));
  const row = {
    id: `ro-f3-row-${rowNumber}`,
    cells: {},
    formats: {},
  };

  columns.forEach((column) => {
    row.cells[column.id] = "";
    row.formats[column.id] = buildPhysicalFactorsRoF3Format();
  });

  Object.entries(valuesByLetter).forEach(([letter, value]) => {
    setPhysicalFactorsRoF3Cell(row, columnsByLetter, letter, value, formatsByLetter[letter] || null);
  });

  Object.entries(formatsByLetter).forEach(([letter, format]) => {
    const columnId = columnsByLetter.get(letter);
    if (columnId) {
      row.formats[columnId] = format;
    }
  });

  return row;
}

function buildPhysicalFactorsRoF3DataFormulas(rowNumber) {
  const row = rowNumber;
  return {
    B: `=IFERROR(IF(A${row}="";"";VLOOKUP(A${row};'RO-F.2'!B:M;6;FALSE));"")`,
    C: `=IF(A${row}="";"";ROW()-3)`,
    D: `=IF(A${row}="";"";CONCATENATE(C${row};" ";E${row}))`,
    F: `=IFERROR(IF(A${row}="";"";RANDBETWEEN(VLOOKUP(A${row};'RO-F.2'!B:X;22;FALSE);VLOOKUP(A${row};'RO-F.2'!B:X;23;FALSE)));"")`,
    H: `=IFERROR(IF(VLOOKUP(AA${row};'RO-F.2'!B:AI;21;FALSE)="";"";VLOOKUP(AA${row};'RO-F.2'!B:AI;21;FALSE));"")`,
    I: `=IF(A${row}="";"";IF((F${row}+G${row})>=H${row};"Da";"Ne"))`,
    K: `=IF(A${row}="";"";A${row})`,
    L: `=IFERROR(VLOOKUP('RO-F.3'!K${row};'RO-F.2'!B:G;6;FALSE);"")`,
    M: `=IF(C${row}="";"";C${row})`,
    N: `=CONCATENATE(M${row};" ";O${row})`,
    O: `=IF(E${row}="";"";E${row})`,
    P: `=IFERROR(IF(K${row}="";"";RANDBETWEEN(VLOOKUP(K${row};'RO-F.2'!B:AI;25;FALSE)*10;VLOOKUP(K${row};'RO-F.2'!B:AI;26;FALSE)*10)/10);"")`,
    Q: `=IFERROR(IF(VLOOKUP(AA${row};'RO-F.2'!B:AI;24;FALSE)="";"";VLOOKUP(AA${row};'RO-F.2'!B:AI;24;FALSE));"")`,
    Y: `=IF(K${row}="";"";IF(P${row}<=Q${row};"Da";"Ne"))`,
    AA: `=IF(A${row}="";"";A${row})`,
    AB: `=IFERROR(VLOOKUP(AA${row};'RO-F.2'!B:G;6;FALSE);"")`,
    AC: `=IF(C${row}="";"";C${row})`,
    AD: `=CONCATENATE(AC${row};" ";AE${row})`,
    AE: `=IF(E${row}="";"";E${row})`,
    AF: `=IFERROR(IF(AA${row}="";"";RANDBETWEEN(VLOOKUP(AA${row};'RO-F.2'!B:AA;13;FALSE)*10;VLOOKUP(AA${row};'RO-F.2'!B:AA;14;FALSE)*10)/10);"")`,
    AG: `=IFERROR(IF(VLOOKUP(AA${row};'RO-F.2'!B:AI;12;FALSE)="";"";VLOOKUP(AA${row};'RO-F.2'!B:AI;12;FALSE));"")`,
    AH: `=IFERROR(IF(AA${row}="";"";RANDBETWEEN(VLOOKUP(AA${row};'RO-F.2'!B:AA;19;FALSE)*100;VLOOKUP(AA${row};'RO-F.2'!B:AA;20;FALSE)*100)/100);"")`,
    AI: `=IFERROR(IF(VLOOKUP(AA${row};'RO-F.2'!B:AI;18;FALSE)="";"";VLOOKUP(AA${row};'RO-F.2'!B:AI;18;FALSE));"")`,
    AJ: `=IFERROR(IF(AA${row}="";"";RANDBETWEEN(VLOOKUP(AA${row};'RO-F.2'!B:AA;16;FALSE)*10;VLOOKUP(AA${row};'RO-F.2'!B:AA;17;FALSE)*10)/10);"")`,
    AK: `=IFERROR(IF(VLOOKUP(AA${row};'RO-F.2'!B:AI;15;FALSE)="";"";VLOOKUP(AA${row};'RO-F.2'!B:AI;15;FALSE));"")`,
    AL: `=IF(AA${row}="";"";"Da")`,
  };
}

export function buildPhysicalFactorsRoF3DataRow(rowNumber, columns) {
  const formulaCells = buildPhysicalFactorsRoF3DataFormulas(rowNumber);
  return createPhysicalFactorsRoF3Row(rowNumber, columns, formulaCells, {
    I: buildPhysicalFactorsRoF3Format({ align: "center", border: "all" }),
    Y: buildPhysicalFactorsRoF3Format({ align: "center", border: "all" }),
    AL: buildPhysicalFactorsRoF3Format({ align: "center", border: "all" }),
    BC: buildPhysicalFactorsRoF3Format({ align: "center", border: "all" }),
  });
}

function normalizePhysicalFactorsRoF3DataRowCount(value = PHYSICAL_FACTORS_RO_F3_DATA_ROW_COUNT) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return PHYSICAL_FACTORS_RO_F3_DATA_ROW_COUNT;
  }
  return Math.max(1, Math.min(PHYSICAL_FACTORS_RO_F3_DATA_ROW_COUNT, Math.round(parsed)));
}

export function buildPhysicalFactorsRoF3SheetTemplate({ dataRowCount = PHYSICAL_FACTORS_RO_F3_DATA_ROW_COUNT } = {}) {
  const columns = buildPhysicalFactorsRoF3Columns();
  const titleFormat = buildPhysicalFactorsRoF3Format({
    fillColor: "#dbeafe",
    bold: true,
    align: "center",
    border: "all",
  });
  const statusFormat = buildPhysicalFactorsRoF3Format({
    fillColor: "#f1f5f9",
    bold: true,
    align: "center",
    border: "all",
  });
  const rows = [];

  rows.push(createPhysicalFactorsRoF3Row(1, columns, {
    A: `=IFERROR(IF('RO-F.1'!E3="";"NE";'RO-F.1'!E3);"NE")`,
    B: "Mjerenje razine osvjetljenosti",
    K: `=IFERROR(IF('RO-F.1'!E4="";"NE";'RO-F.1'!E4);"NE")`,
    L: "Mjerenje razine buke",
    AA: `=IFERROR(IF('RO-F.1'!E2="";"NE";'RO-F.1'!E2);"NE")`,
    AB: "Mjerenje mikroklimatskih uvjeta",
    AN: `=IFERROR(IF('RO-F.1'!E5="";"NE";'RO-F.1'!E5);"NE")`,
    AO: "Mjerenje vibracija",
  }, {
    A: statusFormat,
    B: titleFormat,
    K: statusFormat,
    L: titleFormat,
    AA: statusFormat,
    AB: titleFormat,
    AN: statusFormat,
    AO: titleFormat,
  }));

  rows.push(createPhysicalFactorsRoF3Row(2, columns, PHYSICAL_FACTORS_RO_F3_HEADERS, Object.fromEntries(
    columns.map((column) => [
      column.label,
      buildPhysicalFactorsRoF3Format({
        fillColor: getPhysicalFactorsRoF3ColumnFill(column.label),
        bold: true,
        align: "center",
        border: "all",
      }),
    ]),
  )));

  rows.push(createPhysicalFactorsRoF3Row(3, columns, PHYSICAL_FACTORS_RO_F3_SUBHEADERS, Object.fromEntries(
    columns.map((column) => [
      column.label,
      buildPhysicalFactorsRoF3Format({
        fillColor: getPhysicalFactorsRoF3ColumnFill(column.label),
        bold: Boolean(PHYSICAL_FACTORS_RO_F3_SUBHEADERS[column.label]),
        align: "center",
        border: "all",
      }),
    ]),
  )));

  const normalizedDataRowCount = normalizePhysicalFactorsRoF3DataRowCount(dataRowCount);
  for (let rowNumber = 4; rowNumber < normalizedDataRowCount + 4; rowNumber += 1) {
    rows.push(buildPhysicalFactorsRoF3DataRow(rowNumber, columns));
  }

  const idByLetter = new Map(columns.map((column) => [column.label, column.id]));
  const merge = (rowNumber, letter, rowSpan = 1, colSpan = 1) => ({
    rowId: `ro-f3-row-${rowNumber}`,
    columnId: idByLetter.get(letter),
    rowSpan,
    colSpan,
  });
  const subheaderLetters = new Set(Object.keys(PHYSICAL_FACTORS_RO_F3_SUBHEADERS));
  const row2StandaloneMerges = columns
    .map((column) => column.label)
    .filter((letter) => !subheaderLetters.has(letter))
    .map((letter) => merge(2, letter, 2, 1));

  return {
    columns,
    rows,
    headerRows: ["ro-f3-row-1", "ro-f3-row-2", "ro-f3-row-3"],
    merges: [
      merge(1, "B", 1, 9),
      merge(1, "L", 1, 15),
      merge(1, "AB", 1, 12),
      merge(1, "AO", 1, 15),
      merge(2, "AO", 1, 2),
      merge(2, "AQ", 1, 6),
      ...row2StandaloneMerges,
    ].filter((item) => item.columnId),
  };
}
