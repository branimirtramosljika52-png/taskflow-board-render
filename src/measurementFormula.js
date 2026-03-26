const CELL_REFERENCE_PATTERN = /^([A-Z]+)(\d+)$/;

class MeasurementFormulaError extends Error {
  constructor(message) {
    super(message);
    this.name = "MeasurementFormulaError";
  }
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

    const referenceMatch = expression.slice(index).match(/^[A-Za-z]+[0-9]+/);

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
      consume("cell");
      return { type: "cell", reference: token.value };
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

function evaluateFormulaAst(node, context) {
  switch (node.type) {
    case "number":
    case "string":
    case "boolean":
      return node.value;
    case "cell":
      return context.resolveCellReference(node.reference);
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
  const normalizedReference = String(reference ?? "").trim().toUpperCase();
  const match = normalizedReference.match(CELL_REFERENCE_PATTERN);

  if (!match) {
    throw new MeasurementFormulaError(`Neispravna referenca: ${reference}`);
  }

  const [, letters, rowText] = match;
  let columnIndex = 0;

  for (const letter of letters) {
    columnIndex = (columnIndex * 26) + (letter.charCodeAt(0) - 64);
  }

  return {
    rowIndex: Number(rowText) - 1,
    columnIndex: columnIndex - 1,
  };
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

    const referenceMatch = text.slice(index).match(/^[A-Za-z]+[0-9]+/);

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

    const referenceMatch = text.slice(index).match(/^[A-Za-z]+[0-9]+/);

    if (referenceMatch) {
      const reference = referenceMatch[0].toUpperCase();
      const { rowIndex, columnIndex } = parseMeasurementCellReference(reference);
      const nextRowIndex = Math.max(0, rowIndex + rowOffset);
      const nextColumnIndex = Math.max(0, columnIndex + columnOffset);
      result += formatMeasurementCellReference(nextRowIndex, nextColumnIndex);
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

  const tokens = tokenizeFormulaExpression(expression);
  const ast = createFormulaParser(tokens);
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
