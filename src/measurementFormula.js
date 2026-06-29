const CELL_REFERENCE_PATTERN = /^(\$?)([A-Z]+)(\$?)(\d+)$/;
const CELL_REFERENCE_TOKEN_PATTERN = /^\$?[A-Za-z]+\$?[0-9]+/;
const UNQUOTED_SHEET_REFERENCE_PATTERN = /^([A-Za-z_][A-Za-z0-9_. -]{0,120})!(\$?[A-Za-z]+\$?[0-9]+)/;

class MeasurementFormulaError extends Error {
  constructor(message) {
    super(message);
    this.name = "MeasurementFormulaError";
  }
}

const FORMULA_AST_CACHE_LIMIT = 500;
const formulaAstCache = new Map();

function getCachedFormulaAst(expression = "") {
  const cacheKey = String(expression ?? "");
  if (formulaAstCache.has(cacheKey)) {
    const cached = formulaAstCache.get(cacheKey);
    formulaAstCache.delete(cacheKey);
    formulaAstCache.set(cacheKey, cached);
    return cached;
  }

  const tokens = tokenizeFormulaExpression(cacheKey);
  const ast = createFormulaParser(tokens);
  formulaAstCache.set(cacheKey, ast);
  if (formulaAstCache.size > FORMULA_AST_CACHE_LIMIT) {
    formulaAstCache.delete(formulaAstCache.keys().next().value);
  }
  return ast;
}

function tokenizeFormulaExpression(expression) {
  const tokens = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    const twoCharOperator = expression.slice(index, index + 2);

    if (["<=", ">=", "<>"].includes(twoCharOperator)) {
      tokens.push({ type: "operator", value: twoCharOperator });
      index += 2;
      continue;
    }

    if ("()+-*/=<>".includes(char)) {
      tokens.push({
        type: char === "(" || char === ")" ? "paren" : "operator",
        value: char,
      });
      index += 1;
      continue;
    }

    if (char === ":") {
      tokens.push({ type: "range", value: char });
      index += 1;
      continue;
    }

    if (char === "," || char === ";") {
      tokens.push({ type: "separator", value: char });
      index += 1;
      continue;
    }

    if (char === "\"") {
      let value = "";
      index += 1;

      while (index < expression.length) {
        const current = expression[index];

        if (current === "\"") {
          if (expression[index + 1] === "\"") {
            value += "\"";
            index += 2;
            continue;
          }

          index += 1;
          break;
        }

        value += current;
        index += 1;
      }

      tokens.push({ type: "string", value });
      continue;
    }

    const numberMatch = expression.slice(index).match(/^\d+(?:\.\d+)?|^\.\d+/);

    if (numberMatch) {
      tokens.push({ type: "number", value: Number(numberMatch[0]) });
      index += numberMatch[0].length;
      continue;
    }

    const sheetReferenceMatch = readMeasurementSheetReferenceToken(expression, index);

    if (sheetReferenceMatch) {
      tokens.push({ type: "cell", value: sheetReferenceMatch.value });
      index += sheetReferenceMatch.length;
      continue;
    }

    const referenceMatch = expression.slice(index).match(CELL_REFERENCE_TOKEN_PATTERN);

    if (referenceMatch) {
      tokens.push({ type: "cell", value: referenceMatch[0].toUpperCase() });
      index += referenceMatch[0].length;
      continue;
    }

    const identifierMatch = expression.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);

    if (identifierMatch) {
      tokens.push({ type: "identifier", value: identifierMatch[0].toUpperCase() });
      index += identifierMatch[0].length;
      continue;
    }

    throw new MeasurementFormulaError(`Nepoznat simbol u formuli: ${char}`);
  }

  return tokens;
}

function readMeasurementSheetReferenceToken(expression = "", startIndex = 0) {
  const text = String(expression ?? "");
  const source = text.slice(startIndex);

  if (source.startsWith("'")) {
    let sheetName = "";
    let index = 1;

    while (index < source.length) {
      const current = source[index];

      if (current === "'") {
        if (source[index + 1] === "'") {
          sheetName += "'";
          index += 2;
          continue;
        }

        index += 1;
        break;
      }

      sheetName += current;
      index += 1;
    }

    if (!sheetName || source[index] !== "!") {
      return null;
    }

    const referenceMatch = source.slice(index + 1).match(CELL_REFERENCE_TOKEN_PATTERN);
    if (!referenceMatch) {
      return null;
    }

    return {
      length: index + 1 + referenceMatch[0].length,
      value: createMeasurementFormulaReference(referenceMatch[0], sheetName),
    };
  }

  if (source.startsWith("{{")) {
    const endIndex = source.indexOf("}}");
    if (endIndex > 2 && source[endIndex + 2] === "!") {
      const sheetName = source.slice(0, endIndex + 2);
      const referenceMatch = source.slice(endIndex + 3).match(CELL_REFERENCE_TOKEN_PATTERN);
      if (referenceMatch) {
        return {
          length: endIndex + 3 + referenceMatch[0].length,
          value: createMeasurementFormulaReference(referenceMatch[0], sheetName),
        };
      }
    }
  }

  const unquotedMatch = source.match(UNQUOTED_SHEET_REFERENCE_PATTERN);
  if (!unquotedMatch) {
    return null;
  }

  return {
    length: unquotedMatch[0].length,
    value: createMeasurementFormulaReference(unquotedMatch[2], unquotedMatch[1]),
  };
}

function createMeasurementFormulaReference(reference = "", sheetName = "") {
  const normalizedReference = String(reference ?? "").trim().toUpperCase();
  const normalizedSheetName = String(sheetName ?? "").trim();
  if (!normalizedSheetName) {
    return normalizedReference;
  }

  return {
    reference: normalizedReference,
    sheetName: normalizedSheetName,
  };
}

function getMeasurementFormulaReferenceCell(reference) {
  if (reference && typeof reference === "object" && !Array.isArray(reference)) {
    return String(reference.reference ?? reference.cell ?? "").trim().toUpperCase();
  }

  return String(reference ?? "").trim().toUpperCase();
}

function getMeasurementFormulaReferenceSheet(reference) {
  if (reference && typeof reference === "object" && !Array.isArray(reference)) {
    return String(reference.sheetName ?? reference.sheet ?? "").trim();
  }

  return "";
}

function inheritMeasurementFormulaReferenceSheet(reference, sourceReference) {
  if (getMeasurementFormulaReferenceSheet(reference) || !getMeasurementFormulaReferenceSheet(sourceReference)) {
    return reference;
  }

  return createMeasurementFormulaReference(
    getMeasurementFormulaReferenceCell(reference),
    getMeasurementFormulaReferenceSheet(sourceReference),
  );
}

function formatMeasurementFormulaReferenceForList(reference) {
  const cell = getMeasurementFormulaReferenceCell(reference);
  const sheet = getMeasurementFormulaReferenceSheet(reference);
  return sheet ? `${sheet}!${cell}` : cell;
}

function createFormulaParser(tokens) {
  let position = 0;

  function peek() {
    return tokens[position] ?? null;
  }

  function consume(expectedType, expectedValue = null) {
    const token = peek();

    if (!token || token.type !== expectedType || (expectedValue !== null && token.value !== expectedValue)) {
      throw new MeasurementFormulaError("Neispravna formula.");
    }

    position += 1;
    return token;
  }

  function parseExpression() {
    return parseComparison();
  }

  function parseComparison() {
    let node = parseAddition();

    while (peek()?.type === "operator" && ["=", "<>", ">", "<", ">=", "<="].includes(peek().value)) {
      const operator = consume("operator").value;
      const right = parseAddition();
      node = { type: "binary", operator, left: node, right };
    }

    return node;
  }

  function parseAddition() {
    let node = parseMultiplication();

    while (peek()?.type === "operator" && ["+", "-"].includes(peek().value)) {
      const operator = consume("operator").value;
      const right = parseMultiplication();
      node = { type: "binary", operator, left: node, right };
    }

    return node;
  }

  function parseMultiplication() {
    let node = parseUnary();

    while (peek()?.type === "operator" && ["*", "/"].includes(peek().value)) {
      const operator = consume("operator").value;
      const right = parseUnary();
      node = { type: "binary", operator, left: node, right };
    }

    return node;
  }

  function parseUnary() {
    if (peek()?.type === "operator" && ["+", "-"].includes(peek().value)) {
      const operator = consume("operator").value;
      return { type: "unary", operator, argument: parseUnary() };
    }

    return parsePrimary();
  }

  function parseArguments() {
    const argumentsList = [];

    if (peek()?.type === "paren" && peek().value === ")") {
      return argumentsList;
    }

    while (true) {
      argumentsList.push(parseExpression());

      if (!(peek()?.type === "separator")) {
        break;
      }

      consume("separator");
    }

    return argumentsList;
  }

  function parsePrimary() {
    const token = peek();

    if (!token) {
      throw new MeasurementFormulaError("Nepotpuna formula.");
    }

    if (token.type === "number") {
      consume("number");
      return { type: "number", value: token.value };
    }

    if (token.type === "string") {
      consume("string");
      return { type: "string", value: token.value };
    }

    if (token.type === "cell") {
      const startReference = consume("cell").value;

      if (peek()?.type === "range") {
        consume("range");
        const endReference = inheritMeasurementFormulaReferenceSheet(consume("cell").value, startReference);
        return {
          type: "range",
          startReference,
          endReference,
        };
      }

      return { type: "cell", reference: startReference };
    }

    if (token.type === "identifier") {
      const identifier = consume("identifier").value;

      if (peek()?.type === "paren" && peek().value === "(") {
        consume("paren", "(");
        const args = parseArguments();
        consume("paren", ")");
        return { type: "call", name: identifier, args };
      }

      if (identifier === "TRUE" || identifier === "FALSE") {
        return { type: "boolean", value: identifier === "TRUE" };
      }

      throw new MeasurementFormulaError(`Nepoznata oznaka: ${identifier}`);
    }

    if (token.type === "paren" && token.value === "(") {
      consume("paren", "(");
      const node = parseExpression();
      consume("paren", ")");
      return node;
    }

    throw new MeasurementFormulaError("Neispravna formula.");
  }

  const ast = parseExpression();

  if (position < tokens.length) {
    throw new MeasurementFormulaError("Formula sadrzi visak znakova.");
  }

  return ast;
}

function isNumericValue(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function coerceToNumber(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new MeasurementFormulaError("Brojcana vrijednost nije valjana.");
    }

    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  const normalized = String(value ?? "").trim().replace(",", ".");

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new MeasurementFormulaError("Ocekivana je brojcana vrijednost.");
  }

  return parsed;
}

function normalizeComparableValue(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const numeric = Number(trimmed.replace(",", "."));

    if (trimmed && Number.isFinite(numeric)) {
      return numeric;
    }

    return trimmed.toUpperCase();
  }

  return value;
}

function isTruthyFormulaValue(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return String(value ?? "").trim() !== "";
}

function isMeasurementRangeMatrix(value) {
  return Array.isArray(value) && value.every((row) => Array.isArray(row));
}

function normalizeVLookupComparableValue(value) {
  const normalized = normalizeComparableValue(value);
  if (typeof normalized === "string") {
    return normalized.trim().toUpperCase();
  }
  return normalized;
}

function compareVLookupValues(left, right) {
  const normalizedLeft = normalizeVLookupComparableValue(left);
  const normalizedRight = normalizeVLookupComparableValue(right);

  if (typeof normalizedLeft === "string" && typeof normalizedRight === "string") {
    return normalizedLeft.localeCompare(normalizedRight, "hr");
  }

  if (normalizedLeft === normalizedRight) {
    return 0;
  }

  return normalizedLeft > normalizedRight ? 1 : -1;
}

function evaluateVLookup(node, context) {
  if (node.args.length < 3 || node.args.length > 4) {
    throw new MeasurementFormulaError("VLOOKUP trazi 3 ili 4 argumenta.");
  }

  const lookupValue = evaluateFormulaAst(node.args[0], context);
  const columnIndex = Math.floor(coerceToNumber(evaluateFormulaAst(node.args[2], context)));
  const approximateMatch = node.args.length === 4
    ? isTruthyFormulaValue(evaluateFormulaAst(node.args[3], context))
    : false;

  if (!Number.isFinite(columnIndex) || columnIndex < 1) {
    throw new MeasurementFormulaError("VLOOKUP trazi pozitivan indeks kolone.");
  }

  const normalizedColumnIndex = columnIndex - 1;

  if (
    !approximateMatch
    && node.args[1]?.type === "range"
    && typeof context.resolveVLookup === "function"
  ) {
    const optimizedLookup = context.resolveVLookup(
      node.args[1].startReference,
      node.args[1].endReference,
      lookupValue,
      columnIndex,
    );
    if (optimizedLookup?.handled) {
      return optimizedLookup.value ?? "";
    }
  }

  const matrix = evaluateFormulaAst(node.args[1], context);

  if (!isMeasurementRangeMatrix(matrix) || matrix.length === 0) {
    throw new MeasurementFormulaError("VLOOKUP trazi raspon celija kao drugi argument.");
  }

  if (normalizedColumnIndex >= matrix[0].length) {
    throw new MeasurementFormulaError("VLOOKUP indeks kolone izlazi izvan raspona.");
  }

  let fallbackRow = null;
  for (const row of matrix) {
    const firstValue = row[0];
    const comparison = compareVLookupValues(firstValue, lookupValue);

    if (comparison === 0) {
      return row[normalizedColumnIndex] ?? "";
    }

    if (approximateMatch && comparison <= 0) {
      fallbackRow = row;
    }
  }

  if (approximateMatch && fallbackRow) {
    return fallbackRow[normalizedColumnIndex] ?? "";
  }

  throw new MeasurementFormulaError("VLOOKUP nije pronasao trazenu vrijednost.");
}

function flattenFormulaValue(value) {
  if (isMeasurementRangeMatrix(value)) {
    return value.flatMap((row) => row);
  }

  return [value];
}

function normalizeCountCriteriaComparable(value) {
  const normalized = normalizeComparableValue(value);
  return typeof normalized === "string" ? normalized.trim().toUpperCase() : normalized;
}

function buildCountCriteriaMatcher(criteria) {
  const rawCriteria = String(criteria ?? "").trim();
  const comparisonMatch = rawCriteria.match(/^(<=|>=|<>|=|<|>)(.*)$/);

  if (!comparisonMatch) {
    const target = normalizeCountCriteriaComparable(criteria);
    return (value) => normalizeCountCriteriaComparable(value) === target;
  }

  const [, operator, rawTarget] = comparisonMatch;
  const target = normalizeCountCriteriaComparable(rawTarget);

  return (value) => {
    const candidate = normalizeCountCriteriaComparable(value);

    switch (operator) {
      case "=":
        return candidate === target;
      case "<>":
        return candidate !== target;
      case ">":
        return candidate > target;
      case "<":
        return candidate < target;
      case ">=":
        return candidate >= target;
      case "<=":
        return candidate <= target;
      default:
        return false;
    }
  };
}

function evaluateCountIf(node, context) {
  if (node.args.length !== 2) {
    throw new MeasurementFormulaError("COUNTIF trazi raspon i kriterij.");
  }

  const values = flattenFormulaValue(evaluateFormulaAst(node.args[0], context));
  const matcher = buildCountCriteriaMatcher(evaluateFormulaAst(node.args[1], context));

  return values.reduce((count, value) => count + (matcher(value) ? 1 : 0), 0);
}

function evaluateCountIfs(node, context) {
  if (node.args.length < 2 || node.args.length % 2 !== 0) {
    throw new MeasurementFormulaError("COUNTIFS trazi parove raspon/kriterij.");
  }

  const pairs = [];
  for (let index = 0; index < node.args.length; index += 2) {
    pairs.push({
      values: flattenFormulaValue(evaluateFormulaAst(node.args[index], context)),
      matcher: buildCountCriteriaMatcher(evaluateFormulaAst(node.args[index + 1], context)),
    });
  }

  const length = Math.max(0, Math.min(...pairs.map((pair) => pair.values.length)));
  let count = 0;

  for (let index = 0; index < length; index += 1) {
    if (pairs.every((pair) => pair.matcher(pair.values[index]))) {
      count += 1;
    }
  }

  return count;
}

function collectFormulaNumberArguments(node, context) {
  return node.args
    .flatMap((argument) => flattenFormulaValue(evaluateFormulaAst(argument, context)))
    .filter((value) => String(value ?? "").trim() !== "")
    .map((value) => coerceToNumber(value));
}

function formatFormulaDate(value, includeTime = false) {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = String(value.getFullYear());
  if (!includeTime) {
    return `${day}.${month}.${year}`;
  }
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function evaluateRoundFunction(node, context, mode = "nearest") {
  if (node.args.length < 1 || node.args.length > 2) {
    throw new MeasurementFormulaError(`${node.name} trazi 1 ili 2 argumenta.`);
  }
  const value = coerceToNumber(evaluateFormulaAst(node.args[0], context));
  const digits = node.args.length === 2
    ? Math.floor(coerceToNumber(evaluateFormulaAst(node.args[1], context)))
    : 0;
  const factor = 10 ** digits;
  if (mode === "up") {
    return Math.ceil(value * factor) / factor;
  }
  if (mode === "down") {
    return Math.floor(value * factor) / factor;
  }
  return Math.round(value * factor) / factor;
}

function evaluateTextAfterFunction(node, context) {
  if (node.args.length < 2 || node.args.length > 6) {
    throw new MeasurementFormulaError("TEXTAFTER trazi 2 do 6 argumenata.");
  }

  const text = String(evaluateFormulaAst(node.args[0], context) ?? "");
  const delimiter = String(evaluateFormulaAst(node.args[1], context) ?? "");
  const instanceNumber = node.args.length >= 3
    ? Math.trunc(coerceToNumber(evaluateFormulaAst(node.args[2], context)))
    : 1;
  const matchMode = node.args.length >= 4
    ? Math.trunc(coerceToNumber(evaluateFormulaAst(node.args[3], context)))
    : 0;
  const ifNotFound = node.args.length >= 6
    ? evaluateFormulaAst(node.args[5], context)
    : "";

  if (!delimiter) {
    return text;
  }
  if (!instanceNumber) {
    throw new MeasurementFormulaError("TEXTAFTER instance_num ne smije biti 0.");
  }

  const source = matchMode ? text.toLowerCase() : text;
  const needle = matchMode ? delimiter.toLowerCase() : delimiter;
  let foundIndex = -1;

  if (instanceNumber > 0) {
    let cursor = 0;
    for (let count = 0; count < instanceNumber; count += 1) {
      foundIndex = source.indexOf(needle, cursor);
      if (foundIndex < 0) {
        return ifNotFound;
      }
      cursor = foundIndex + needle.length;
    }
  } else {
    let cursor = source.length;
    for (let count = 0; count < Math.abs(instanceNumber); count += 1) {
      foundIndex = source.lastIndexOf(needle, cursor - 1);
      if (foundIndex < 0) {
        return ifNotFound;
      }
      cursor = foundIndex;
    }
  }

  return text.slice(foundIndex + delimiter.length);
}

function evaluateRowFunction(node, context) {
  if (node.args.length > 1) {
    throw new MeasurementFormulaError("ROW trazi 0 ili 1 argument.");
  }

  if (node.args.length === 0) {
    const currentRowIndex = Number(context.currentRowIndex);
    return Number.isFinite(currentRowIndex) ? currentRowIndex + 1 : 1;
  }

  const argument = node.args[0];

  if (argument.type === "cell") {
    return parseMeasurementCellReference(argument.reference).rowIndex + 1;
  }

  if (argument.type === "range") {
    return parseMeasurementCellReference(argument.startReference).rowIndex + 1;
  }

  const currentRowIndex = Number(context.currentRowIndex);
  return Number.isFinite(currentRowIndex) ? currentRowIndex + 1 : 1;
}

function evaluateRowsFunction(node, context) {
  if (node.args.length !== 1) {
    throw new MeasurementFormulaError("ROWS trazi 1 argument.");
  }

  const argument = node.args[0];

  if (argument.type === "cell") {
    return parseMeasurementCellReference(argument.reference).rowIndex + 1;
  }

  if (argument.type === "range") {
    const start = parseMeasurementCellReference(argument.startReference);
    const end = parseMeasurementCellReference(argument.endReference);
    return Math.abs(end.rowIndex - start.rowIndex) + 1;
  }

  const value = evaluateFormulaAst(argument, context);
  return isMeasurementRangeMatrix(value) ? value.length : 1;
}

function evaluateFormulaAst(node, context) {
  switch (node.type) {
    case "number":
    case "string":
    case "boolean":
      return node.value;
    case "cell":
      return context.resolveCellReference(node.reference);
    case "range":
      if (typeof context.resolveRange !== "function") {
        throw new MeasurementFormulaError("Range reference nije podrzan u ovom kontekstu.");
      }
      return context.resolveRange(node.startReference, node.endReference);
    case "unary": {
      const value = coerceToNumber(evaluateFormulaAst(node.argument, context));
      return node.operator === "-" ? -value : value;
    }
    case "binary": {
      if (["+", "-", "*", "/"].includes(node.operator)) {
        const left = coerceToNumber(evaluateFormulaAst(node.left, context));
        const right = coerceToNumber(evaluateFormulaAst(node.right, context));

        if (node.operator === "+") {
          return left + right;
        }

        if (node.operator === "-") {
          return left - right;
        }

        if (node.operator === "*") {
          return left * right;
        }

        if (right === 0) {
          throw new MeasurementFormulaError("Dijeljenje s nulom nije dozvoljeno.");
        }

        return left / right;
      }

      const left = normalizeComparableValue(evaluateFormulaAst(node.left, context));
      const right = normalizeComparableValue(evaluateFormulaAst(node.right, context));

      if (node.operator === "=") {
        return left === right;
      }

      if (node.operator === "<>") {
        return left !== right;
      }

      if (node.operator === ">") {
        return left > right;
      }

      if (node.operator === "<") {
        return left < right;
      }

      if (node.operator === ">=") {
        return left >= right;
      }

      if (node.operator === "<=") {
        return left <= right;
      }

      throw new MeasurementFormulaError("Nepodrzan operator.");
    }
    case "call": {
      if (node.name === "IF") {
        if (node.args.length !== 3) {
          throw new MeasurementFormulaError("IF trazi 3 argumenta.");
        }

        return isTruthyFormulaValue(evaluateFormulaAst(node.args[0], context))
          ? evaluateFormulaAst(node.args[1], context)
          : evaluateFormulaAst(node.args[2], context);
      }

      if (node.name === "IFERROR") {
        if (node.args.length !== 2) {
          throw new MeasurementFormulaError("IFERROR trazi 2 argumenta.");
        }

        try {
          return evaluateFormulaAst(node.args[0], context);
        } catch {
          return evaluateFormulaAst(node.args[1], context);
        }
      }

      if (node.name === "RANDBETWEEN") {
        if (node.args.length !== 2) {
          throw new MeasurementFormulaError("RANDBETWEEN trazi 2 argumenta.");
        }

        const min = Math.floor(coerceToNumber(evaluateFormulaAst(node.args[0], context)));
        const max = Math.floor(coerceToNumber(evaluateFormulaAst(node.args[1], context)));

        if (max < min) {
          throw new MeasurementFormulaError("RANDBETWEEN trazi da je drugi broj veci ili jednak prvom.");
        }

        const random = context.randomBetween ?? ((start, end) =>
          Math.floor(Math.random() * (end - start + 1)) + start);
        return random(min, max);
      }

      if (["SUM", "AVERAGE", "MIN", "MAX", "COUNT"].includes(node.name)) {
        const values = collectFormulaNumberArguments(node, context);

        if (node.name === "SUM") {
          return values.reduce((total, value) => total + value, 0);
        }

        if (node.name === "COUNT") {
          return values.length;
        }

        if (!values.length) {
          throw new MeasurementFormulaError(`${node.name} trazi barem jednu brojcanu vrijednost.`);
        }

        if (node.name === "AVERAGE") {
          return values.reduce((total, value) => total + value, 0) / values.length;
        }

        if (node.name === "MIN") {
          return Math.min(...values);
        }

        if (node.name === "MAX") {
          return Math.max(...values);
        }
      }

      if (node.name === "COUNTA") {
        return node.args
          .flatMap((argument) => flattenFormulaValue(evaluateFormulaAst(argument, context)))
          .reduce((count, value) => count + (String(value ?? "").trim() ? 1 : 0), 0);
      }

      if (node.name === "AND") {
        return node.args.every((argument) => isTruthyFormulaValue(evaluateFormulaAst(argument, context)));
      }

      if (node.name === "OR") {
        return node.args.some((argument) => isTruthyFormulaValue(evaluateFormulaAst(argument, context)));
      }

      if (node.name === "NOT") {
        if (node.args.length !== 1) {
          throw new MeasurementFormulaError("NOT trazi 1 argument.");
        }
        return !isTruthyFormulaValue(evaluateFormulaAst(node.args[0], context));
      }

      if (node.name === "ROUND") {
        return evaluateRoundFunction(node, context, "nearest");
      }

      if (node.name === "ROUNDUP") {
        return evaluateRoundFunction(node, context, "up");
      }

      if (node.name === "ROUNDDOWN") {
        return evaluateRoundFunction(node, context, "down");
      }

      if (node.name === "TODAY") {
        if (node.args.length !== 0) {
          throw new MeasurementFormulaError("TODAY ne prima argumente.");
        }
        return formatFormulaDate(typeof context.now === "function" ? context.now() : new Date(), false);
      }

      if (node.name === "NOW") {
        if (node.args.length !== 0) {
          throw new MeasurementFormulaError("NOW ne prima argumente.");
        }
        return formatFormulaDate(typeof context.now === "function" ? context.now() : new Date(), true);
      }

      if (node.name === "ISBLANK") {
        if (node.args.length !== 1) {
          throw new MeasurementFormulaError("ISBLANK trazi 1 argument.");
        }
        return String(evaluateFormulaAst(node.args[0], context) ?? "").trim() === "";
      }

      if (node.name === "LEN") {
        if (node.args.length !== 1) {
          throw new MeasurementFormulaError("LEN trazi 1 argument.");
        }
        return String(evaluateFormulaAst(node.args[0], context) ?? "").length;
      }

      if (node.name === "TEXTAFTER") {
        return evaluateTextAfterFunction(node, context);
      }

      if (node.name === "ROWS") {
        return evaluateRowsFunction(node, context);
      }

      if (node.name === "ROW") {
        return evaluateRowFunction(node, context);
      }

      if (node.name === "COUNTIF") {
        return evaluateCountIf(node, context);
      }

      if (node.name === "COUNTIFS") {
        return evaluateCountIfs(node, context);
      }

      if (node.name === "CONCATENATE" || node.name === "CONCAT") {
        return node.args
          .flatMap((argument) => flattenFormulaValue(evaluateFormulaAst(argument, context)))
          .map((value) => String(value ?? ""))
          .join("");
      }

      if (node.name === "VLOOKUP") {
        return evaluateVLookup(node, context);
      }

      throw new MeasurementFormulaError(`Nepodrzana funkcija: ${node.name}`);
    }
    default:
      throw new MeasurementFormulaError("Nepoznat tip formule.");
  }
}

export function isMeasurementFormula(value) {
  return typeof value === "string" && value.trim().startsWith("=");
}

export function parseMeasurementCellReference(reference) {
  const normalizedReference = getMeasurementFormulaReferenceCell(reference);
  const match = normalizedReference.match(CELL_REFERENCE_PATTERN);

  if (!match) {
    throw new MeasurementFormulaError(`Neispravna referenca: ${reference}`);
  }

  const [, , letters, , rowText] = match;
  let columnIndex = 0;

  for (const letter of letters) {
    columnIndex = (columnIndex * 26) + (letter.charCodeAt(0) - 64);
  }

  return {
    rowIndex: Number(rowText) - 1,
    columnIndex: columnIndex - 1,
  };
}

function parseMeasurementFormulaCellReferenceToken(reference) {
  const normalizedReference = getMeasurementFormulaReferenceCell(reference);
  const match = normalizedReference.match(CELL_REFERENCE_PATTERN);

  if (!match) {
    throw new MeasurementFormulaError(`Neispravna referenca: ${reference}`);
  }

  const [, absoluteColumn, , absoluteRow] = match;
  return {
    ...parseMeasurementCellReference(normalizedReference),
    absoluteColumn: Boolean(absoluteColumn),
    absoluteRow: Boolean(absoluteRow),
  };
}

function formatMeasurementFormulaCellReferenceToken(referenceMeta) {
  const columnText = formatMeasurementCellReference(0, referenceMeta.columnIndex).replace(/\d+$/, "");
  const rowText = String(referenceMeta.rowIndex + 1);
  return `${referenceMeta.absoluteColumn ? "$" : ""}${columnText}${referenceMeta.absoluteRow ? "$" : ""}${rowText}`;
}

export function formatMeasurementCellReference(rowIndex, columnIndex) {
  if (rowIndex < 0 || columnIndex < 0) {
    throw new MeasurementFormulaError("Neispravna pozicija za referencu.");
  }

  let columnNumber = columnIndex + 1;
  let letters = "";

  while (columnNumber > 0) {
    const remainder = (columnNumber - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    columnNumber = Math.floor((columnNumber - 1) / 26);
  }

  return `${letters}${rowIndex + 1}`;
}

export function listMeasurementFormulaReferences(formulaText) {
  const text = String(formulaText ?? "");
  const expression = text.trim().replace(/^=/, "");

  try {
    return tokenizeFormulaExpression(expression)
      .filter((token) => token.type === "cell")
      .map((token) => formatMeasurementFormulaReferenceForList(token.value));
  } catch {
    // Fall back to the legacy scanner while the user is typing an incomplete formula.
  }

  const references = [];
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (char === "\"") {
      index += 1;

      while (index < text.length) {
        if (text[index] === "\"") {
          if (text[index + 1] === "\"") {
            index += 2;
            continue;
          }

          index += 1;
          break;
        }

        index += 1;
      }

      continue;
    }

    const sheetReferenceMatch = readMeasurementSheetReferenceToken(text, index);

    if (sheetReferenceMatch) {
      references.push(formatMeasurementFormulaReferenceForList(sheetReferenceMatch.value));
      index += sheetReferenceMatch.length;
      continue;
    }

    const referenceMatch = text.slice(index).match(CELL_REFERENCE_TOKEN_PATTERN);

    if (referenceMatch) {
      references.push(referenceMatch[0].toUpperCase());
      index += referenceMatch[0].length;
      continue;
    }

    index += 1;
  }

  return references;
}

export function shiftMeasurementFormulaReferences(formulaText, rowOffset = 0, columnOffset = 0) {
  const text = String(formulaText ?? "");
  let result = "";
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (char === "\"") {
      result += char;
      index += 1;

      while (index < text.length) {
        result += text[index];

        if (text[index] === "\"") {
          if (text[index + 1] === "\"") {
            result += text[index + 1];
            index += 2;
            continue;
          }

          index += 1;
          break;
        }

        index += 1;
      }

      continue;
    }

    const sheetReferenceMatch = readMeasurementSheetReferenceToken(text, index);

    if (sheetReferenceMatch) {
      result += text.slice(index, index + sheetReferenceMatch.length);
      index += sheetReferenceMatch.length;
      continue;
    }

    const referenceMatch = text.slice(index).match(CELL_REFERENCE_TOKEN_PATTERN);

    if (referenceMatch) {
      const reference = referenceMatch[0].toUpperCase();
      const referenceMeta = parseMeasurementFormulaCellReferenceToken(reference);
      const nextRowIndex = referenceMeta.absoluteRow
        ? referenceMeta.rowIndex
        : Math.max(0, referenceMeta.rowIndex + rowOffset);
      const nextColumnIndex = referenceMeta.absoluteColumn
        ? referenceMeta.columnIndex
        : Math.max(0, referenceMeta.columnIndex + columnOffset);
      result += formatMeasurementFormulaCellReferenceToken({
        ...referenceMeta,
        rowIndex: nextRowIndex,
        columnIndex: nextColumnIndex,
      });
      index += referenceMatch[0].length;
      continue;
    }

    result += char;
    index += 1;
  }

  return result;
}

export function evaluateMeasurementFormula(formulaText, context) {
  const expression = String(formulaText ?? "").trim().replace(/^=/, "");

  if (!expression) {
    return "";
  }

  const ast = getCachedFormulaAst(expression);
  return evaluateFormulaAst(ast, context);
}

export function formatMeasurementFormulaResult(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("hr-HR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  return String(value);
}

export function createMeasurementFormulaError(message) {
  return new MeasurementFormulaError(message);
}
