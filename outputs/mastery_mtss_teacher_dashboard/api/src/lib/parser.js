const path = require("node:path");
const readXlsxFile = require("read-excel-file/node");
const { parse } = require("csv-parse/sync");
const { detectMapping } = require("./schema");

const SUPPORTED_EXTENSIONS = new Set([".csv", ".cvc", ".xlsx"]);
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

  const candidates = nonEmpty.slice(0, 25).map((values, index) => {
    const mapping = detectMapping(values.map(cleanCell));
    const identityScore = mapping.studentId && (mapping.studentName || (mapping.firstName && mapping.lastName)) ? 6 : 0;
    return { index, score: Object.keys(mapping).length + identityScore };
  });
  const bestCandidate = candidates.reduce((best, candidate) => candidate.score > best.score ? candidate : best, candidates[0]);
  const headerIndex = bestCandidate.score > 0 ? bestCandidate.index : 0;
  const seenHeaders = new Map();
  const headers = nonEmpty[headerIndex].map((value, index) => {
    const base = cleanCell(value) || `Column ${index + 1}`;
    const count = (seenHeaders.get(base) || 0) + 1;
    seenHeaders.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
  const rows = nonEmpty.slice(headerIndex + 1, headerIndex + MAX_ROWS + 1).map((values) => {
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
  const sheets = Array.isArray(workbook[0])
    ? [{ sheet: "Sheet1", data: workbook }]
    : workbook;
  const headers = [];
  const rows = [];
  const sheetSummaries = [];

  for (const worksheet of sheets) {
    const parsed = rowsFromMatrix(worksheet.data || []);
    parsed.headers.forEach((header) => {
      if (!headers.includes(header)) headers.push(header);
    });
    parsed.rows.forEach((row) => rows.push({ ...row, __sourceSheet: worksheet.sheet || "Sheet" }));
    sheetSummaries.push({ sheet: worksheet.sheet || "Sheet", rows: parsed.rows.length, columns: parsed.headers.length });
  }

  return { headers, rows, sheetSummaries };
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
    const error = new Error("Upload a CSV, CVC, or XLSX file.");
    error.statusCode = 400;
    throw error;
  }

  const parsed = extension === ".csv" || extension === ".cvc" ? parseCsv(buffer) : await parseWorkbook(buffer);
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

function normalizedSubject(value) {
  const subject = String(value || "").trim();
  if (/^(e|ela|english|reading)$/i.test(subject)) return "Reading";
  if (/^(m|math|mathematics)$/i.test(subject)) return "Math";
  return subject;
}

function normalizeRecord(row, mapping, index) {
  const firstName = String(valueFor(row, mapping, "firstName") || "").trim();
  const lastName = String(valueFor(row, mapping, "lastName") || "").trim();
  const providedName = String(valueFor(row, mapping, "studentName") || "").trim();
  const studentName = providedName || [firstName, lastName].filter(Boolean).join(" ");
  const studentId = String(valueFor(row, mapping, "studentId") || "").trim();
  const subject = normalizedSubject(valueFor(row, mapping, "subject"));
  const grade = String(valueFor(row, mapping, "grade") || "").trim();
  const testedYear = String(valueFor(row, mapping, "testedYear") || "").trim();
  const scaleScore = numberValue(valueFor(row, mapping, "scaleScore"));
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
      grade,
      drcStudentId: String(valueFor(row, mapping, "drcStudentId") || "").trim(),
      uniqueMatchingId: String(valueFor(row, mapping, "uniqueMatchingId") || "").trim(),
      paSecureId: String(valueFor(row, mapping, "paSecureId") || "").trim(),
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
      subject,
      assessment: String(valueFor(row, mapping, "assessment") || "").trim()
        || (scaleScore !== null ? `PSSA ${subject || "Assessment"} Grade ${grade || "Unknown"}` : ""),
      teacherOfRecord: String(valueFor(row, mapping, "teacherOfRecord") || "").trim(),
      score,
      scoreMax,
      percent: percent === null ? null : Math.round(percent * 100) / 100,
      testDate: String(valueFor(row, mapping, "testDate") || "").trim(),
      reportingPeriod: String(valueFor(row, mapping, "reportingPeriod") || "").trim(),
      readingRit: numberValue(valueFor(row, mapping, "readingRit")),
      mathRit: numberValue(valueFor(row, mapping, "mathRit")),
      growthGoal: numberValue(valueFor(row, mapping, "growthGoal")),
      scaleScore,
      performanceCode: String(valueFor(row, mapping, "performanceCode") || "").trim(),
      performance: String(valueFor(row, mapping, "performance") || "").trim(),
      testedYear,
      totalRawScore: numberValue(valueFor(row, mapping, "totalRawScore")),
      sourceSheet: String(row.__sourceSheet || "").trim(),
    },
    raw: row,
  };
}

function analyzeDataset(parsed) {
  const mapping = detectMapping(parsed.headers);
  const records = parsed.rows.map((row, index) => {
    const rowMapping = detectMapping(Object.keys(row).filter((header) => !header.startsWith("__")));
    return normalizeRecord(row, { ...mapping, ...rowMapping }, index);
  });
  const validRecords = records.filter((record) => record.valid);
  const invalidRecords = records.filter((record) => !record.valid);
  const warnings = [...(parsed.warnings || [])];
  const identities = new Map();
  for (const record of validRecords) {
    const key = record.student.studentId;
    if (!identities.has(key)) identities.set(key, { names: new Set(), matchingIds: new Set() });
    const identity = identities.get(key);
    identity.names.add(record.student.studentName.toLowerCase());
    if (record.student.uniqueMatchingId) identity.matchingIds.add(record.student.uniqueMatchingId);
  }
  const identityConflicts = [...identities.values()].filter((identity) => identity.names.size > 1 || identity.matchingIds.size > 1).length;

  if (!mapping.studentId) warnings.push("Student ID was not matched automatically.");
  if (!mapping.studentName && !(mapping.firstName && mapping.lastName)) {
    warnings.push("Student name was not matched automatically.");
  }
  if (!mapping.score && !mapping.percent && !mapping.readingRit && !mapping.mathRit && !mapping.scaleScore) {
    warnings.push("No assessment score columns were matched automatically.");
  }
  if (identityConflicts) warnings.push(`${identityConflicts} student ID record${identityConflicts === 1 ? " has" : "s have"} conflicting names or matching IDs.`);

  return {
    headers: parsed.headers,
    mapping,
    records,
    summary: {
      totalRows: records.length,
      validRows: validRecords.length,
      invalidRows: invalidRecords.length,
      uniqueStudents: new Set(validRecords.map((record) => record.student.studentId)).size,
      identityConflicts,
      warnings,
      sheets: parsed.sheetSummaries || [],
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
  rowsFromMatrix,
};
