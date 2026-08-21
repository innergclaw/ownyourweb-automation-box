const path = require("node:path");
const readXlsxFile = require("read-excel-file/node");
const { parse } = require("csv-parse/sync");
const { detectMapping } = require("./schema");

const SUPPORTED_EXTENSIONS = new Set([".csv", ".xlsx"]);
const MAX_ROWS = 10000;

function cleanCell(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && value.text) return String(value.text).trim();
  if (typeof value === "object" && value.result !== undefined) return cleanCell(value.result);
  return typeof value === "string" ? value.trim() : value;
}

function rowsFromMatrix(matrix) {
  const nonEmpty = matrix.filter((row) => row.some((value) => cleanCell(value) !== ""));
  if (!nonEmpty.length) return { headers: [], rows: [] };

  const headers = nonEmpty[0].map((value, index) => cleanCell(value) || `Column ${index + 1}`);
  const rows = nonEmpty.slice(1, MAX_ROWS + 1).map((values) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cleanCell(values[index]);
    });
    return row;
  });

  return { headers, rows };
}

async function parseWorkbook(buffer) {
  const workbook = await readXlsxFile(buffer);
  const matrix = Array.isArray(workbook[0]) ? workbook : workbook[0]?.data || [];
  return rowsFromMatrix(matrix);
}

function parseCsv(buffer) {
  const matrix = parse(buffer, {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: true,
  });
  return rowsFromMatrix(matrix);
}

async function parseDataset(buffer, filename) {
  const extension = path.extname(filename || "").toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    const error = new Error("Upload a CSV or XLSX file.");
    error.statusCode = 400;
    throw error;
  }

  const parsed = extension === ".csv" ? parseCsv(buffer) : await parseWorkbook(buffer);
  if (!parsed.headers.length || !parsed.rows.length) {
    const error = new Error("The uploaded file does not contain a header row and student records.");
    error.statusCode = 400;
    throw error;
  }
  if (parsed.rows.length >= MAX_ROWS) {
    parsed.warnings = [`Only the first ${MAX_ROWS.toLocaleString()} rows will be imported.`];
  }
  return parsed;
}

function numberValue(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(String(value).replace(/[%,$]/g, "").trim());
  return Number.isFinite(numeric) ? numeric : null;
}

function booleanValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["yes", "y", "true", "1", "iep"].includes(normalized)) return true;
  if (["no", "n", "false", "0", "none"].includes(normalized)) return false;
  return null;
}

function valueFor(row, mapping, field) {
  const header = mapping[field];
  return header ? row[header] : "";
}

function normalizeRecord(row, mapping, index) {
  const firstName = String(valueFor(row, mapping, "firstName") || "").trim();
  const lastName = String(valueFor(row, mapping, "lastName") || "").trim();
  const providedName = String(valueFor(row, mapping, "studentName") || "").trim();
  const studentName = providedName || [firstName, lastName].filter(Boolean).join(" ");
  const studentId = String(valueFor(row, mapping, "studentId") || "").trim();
  const score = numberValue(valueFor(row, mapping, "score"));
  const scoreMax = numberValue(valueFor(row, mapping, "scoreMax"));
  let percent = numberValue(valueFor(row, mapping, "percent"));
  if (percent !== null && percent > 0 && percent <= 1) percent *= 100;
  if (percent === null && score !== null && scoreMax) percent = (score / scoreMax) * 100;

  const errors = [];
  if (!studentId) errors.push("Missing student ID");
  if (!studentName) errors.push("Missing student name");

  return {
    rowNumber: index + 2,
    valid: errors.length === 0,
    errors,
    student: {
      studentId,
      studentName,
      firstName,
      lastName,
      grade: String(valueFor(row, mapping, "grade") || "").trim(),
      attendance: numberValue(valueFor(row, mapping, "attendance")),
      gpa: numberValue(valueFor(row, mapping, "gpa")),
      creditsEarned: numberValue(valueFor(row, mapping, "creditsEarned")),
      creditsRequired: numberValue(valueFor(row, mapping, "creditsRequired")),
      mtssTier: String(valueFor(row, mapping, "mtssTier") || "").trim(),
      hasIep: booleanValue(valueFor(row, mapping, "iep")),
      firefly: String(valueFor(row, mapping, "firefly") || "").trim(),
      intervention: String(valueFor(row, mapping, "intervention") || "").trim(),
    },
    assessment: {
      subject: String(valueFor(row, mapping, "subject") || "").trim(),
      assessment: String(valueFor(row, mapping, "assessment") || "").trim(),
      score,
      scoreMax,
      percent: percent === null ? null : Math.round(percent * 100) / 100,
      testDate: String(valueFor(row, mapping, "testDate") || "").trim(),
      reportingPeriod: String(valueFor(row, mapping, "reportingPeriod") || "").trim(),
      readingRit: numberValue(valueFor(row, mapping, "readingRit")),
      mathRit: numberValue(valueFor(row, mapping, "mathRit")),
      growthGoal: numberValue(valueFor(row, mapping, "growthGoal")),
    },
    raw: row,
  };
}

function analyzeDataset(parsed) {
  const mapping = detectMapping(parsed.headers);
  const records = parsed.rows.map((row, index) => normalizeRecord(row, mapping, index));
  const validRecords = records.filter((record) => record.valid);
  const invalidRecords = records.filter((record) => !record.valid);
  const warnings = [...(parsed.warnings || [])];

  if (!mapping.studentId) warnings.push("Student ID was not matched automatically.");
  if (!mapping.studentName && !(mapping.firstName && mapping.lastName)) {
    warnings.push("Student name was not matched automatically.");
  }
  if (!mapping.score && !mapping.percent && !mapping.readingRit && !mapping.mathRit) {
    warnings.push("No assessment score columns were matched automatically.");
  }

  return {
    headers: parsed.headers,
    mapping,
    records,
    summary: {
      totalRows: records.length,
      validRows: validRecords.length,
      invalidRows: invalidRecords.length,
      uniqueStudents: new Set(validRecords.map((record) => record.student.studentId)).size,
      warnings,
    },
  };
}

module.exports = {
  MAX_ROWS,
  SUPPORTED_EXTENSIONS,
  parseDataset,
  analyzeDataset,
  normalizeRecord,
  numberValue,
};
