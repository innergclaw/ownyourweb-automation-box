const crypto = require("node:crypto");
const path = require("node:path");
const { BlobServiceClient } = require("@azure/storage-blob");
const { TableClient, TableServiceClient } = require("@azure/data-tables");
const { buildDashboardStudents } = require("./dashboard");

const SCHOOL_ID = "mastery-charter";
const CONTAINER_NAME = "mtss-imports";
const TABLES = {
  imports: "MtssImports",
  students: "MtssStudents",
  assessments: "MtssAssessments",
  audit: "MtssAudit",
};

let clients;
let initialized;

function storageConnectionString() {
  const value = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!value) {
    const error = new Error("Secure dataset storage is not configured.");
    error.statusCode = 503;
    throw error;
  }
  return value;
}

function getClients() {
  if (clients) return clients;
  const connectionString = storageConnectionString();
  const blobService = BlobServiceClient.fromConnectionString(connectionString);
  clients = {
    container: blobService.getContainerClient(CONTAINER_NAME),
    tableService: TableServiceClient.fromConnectionString(connectionString),
    imports: TableClient.fromConnectionString(connectionString, TABLES.imports),
    students: TableClient.fromConnectionString(connectionString, TABLES.students),
    assessments: TableClient.fromConnectionString(connectionString, TABLES.assessments),
    audit: TableClient.fromConnectionString(connectionString, TABLES.audit),
  };
  return clients;
}

async function ensureStorage() {
  if (!initialized) {
    initialized = (async () => {
      const current = getClients();
      await current.container.createIfNotExists();
      await Promise.all(Object.values(TABLES).map((name) => current.tableService.createTable(name).catch((error) => {
        if (error.statusCode !== 409) throw error;
      })));
    })();
  }
  return initialized;
}

function safeKey(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 40);
}

function safeFilename(filename) {
  const extension = path.extname(filename).toLowerCase();
  const stem = path.basename(filename, extension).replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80) || "dataset";
  return `${stem}${extension}`;
}

async function stageImport({ importId, filename, buffer, analysis, uploader }) {
  await ensureStorage();
  const current = getClients();
  const blobName = `pending/${SCHOOL_ID}/${importId}/${safeFilename(filename)}`;
  const blob = current.container.getBlockBlobClient(blobName);
  await blob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: "application/octet-stream" },
    metadata: { importid: importId, schoolid: SCHOOL_ID },
  });

  await current.imports.createEntity({
    partitionKey: SCHOOL_ID,
    rowKey: importId,
    status: "pending",
    filename: safeFilename(filename),
    blobName,
    uploadedBy: uploader.email,
    uploaderId: uploader.userId,
    uploadedAt: new Date().toISOString(),
    headersJson: JSON.stringify(analysis.headers),
    mappingJson: JSON.stringify(analysis.mapping),
    summaryJson: JSON.stringify(analysis.summary),
  });

  await writeAudit({
    importId,
    actor: uploader.email,
    action: "dataset_previewed",
    detail: `${analysis.summary.totalRows} rows analyzed from ${safeFilename(filename)}`,
  });

  return { importId, blobName };
}

async function getImport(importId) {
  await ensureStorage();
  try {
    return await getClients().imports.getEntity(SCHOOL_ID, importId);
  } catch (error) {
    if (error.statusCode === 404) {
      const notFound = new Error("Import was not found.");
      notFound.statusCode = 404;
      throw notFound;
    }
    throw error;
  }
}

async function downloadPendingImport(entity) {
  const response = await getClients().container.getBlobClient(entity.blobName).download();
  const chunks = [];
  for await (const chunk of response.readableStreamBody) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function writeAudit({ importId = "none", actor, action, detail }) {
  await ensureStorage();
  const timestamp = new Date().toISOString();
  await getClients().audit.createEntity({
    partitionKey: SCHOOL_ID,
    rowKey: `${timestamp}-${crypto.randomUUID()}`,
    importId,
    actor,
    action,
    detail,
    timestamp,
  });
}

async function commitRecords({ entity, analysis, uploader }) {
  const current = getClients();
  let studentsSaved = 0;
  let assessmentsSaved = 0;
  const uniqueStudentIds = new Set();
  const now = new Date().toISOString();

  for (const record of analysis.records.filter((item) => item.valid)) {
    const studentKey = safeKey(record.student.studentId);
    uniqueStudentIds.add(record.student.studentId);
    await current.students.upsertEntity({
      partitionKey: SCHOOL_ID,
      rowKey: studentKey,
      ...record.student,
      lastImportId: entity.rowKey,
      updatedAt: now,
      updatedBy: uploader.email,
    }, "Merge");
    studentsSaved += 1;

    const hasAssessment = Object.entries(record.assessment).some(([key, value]) => !["reportingPeriod", "sourceSheet"].includes(key) && value !== "" && value !== null);
    if (hasAssessment) {
      const sourceData = Object.fromEntries(Object.entries(record.raw).filter(([key]) => !key.startsWith("__")));
      await current.assessments.upsertEntity({
        partitionKey: `${SCHOOL_ID}-${studentKey}`,
        rowKey: `${entity.rowKey}-${String(record.rowNumber).padStart(6, "0")}`,
        studentId: record.student.studentId,
        studentName: record.student.studentName,
        ...record.assessment,
        sourceDataJson: JSON.stringify(sourceData),
        sourceImportId: entity.rowKey,
        createdAt: now,
      }, "Replace");
      assessmentsSaved += 1;
    }
  }

  await current.imports.updateEntity({
    partitionKey: SCHOOL_ID,
    rowKey: entity.rowKey,
    status: "committed",
    committedAt: now,
    committedBy: uploader.email,
    studentsSaved,
    uniqueStudentsSaved: uniqueStudentIds.size,
    assessmentsSaved,
    invalidRows: analysis.summary.invalidRows,
  }, "Merge");

  await writeAudit({
    importId: entity.rowKey,
    actor: uploader.email,
    action: "dataset_committed",
    detail: `${studentsSaved} valid rows and ${assessmentsSaved} assessment records stored`,
  });

  return { studentsSaved, uniqueStudentsSaved: uniqueStudentIds.size, assessmentsSaved, invalidRows: analysis.summary.invalidRows };
}

async function listImports(limit = 20) {
  await ensureStorage();
  const results = [];
  const entities = getClients().imports.listEntities({
    queryOptions: { filter: `PartitionKey eq '${SCHOOL_ID}'` },
  });
  for await (const entity of entities) {
    results.push({
      importId: entity.rowKey,
      filename: entity.filename,
      status: entity.status,
      uploadedBy: entity.uploadedBy,
      uploadedAt: entity.uploadedAt,
      committedAt: entity.committedAt || null,
      summary: entity.summaryJson ? JSON.parse(entity.summaryJson) : null,
      studentsSaved: entity.studentsSaved || 0,
      assessmentsSaved: entity.assessmentsSaved || 0,
    });
  }
  return results.sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt))).slice(0, limit);
}

async function listStudents(limit = 100) {
  await ensureStorage();
  const results = [];
  const entities = getClients().students.listEntities({
    queryOptions: { filter: `PartitionKey eq '${SCHOOL_ID}'`, select: [
      "studentId", "studentName", "firstName", "lastName", "drcStudentId", "uniqueMatchingId", "paSecureId", "grade", "attendance", "gpa", "creditsEarned",
      "creditsRequired", "mtssTier", "hasIep", "firefly", "intervention", "updatedAt",
    ] },
  });
  for await (const entity of entities) {
    results.push({
      studentId: entity.studentId,
      studentName: entity.studentName,
      firstName: entity.firstName || "",
      lastName: entity.lastName || "",
      drcStudentId: entity.drcStudentId || "",
      uniqueMatchingId: entity.uniqueMatchingId || "",
      paSecureId: entity.paSecureId || "",
      grade: entity.grade || "",
      attendance: entity.attendance ?? null,
      gpa: entity.gpa ?? null,
      creditsEarned: entity.creditsEarned ?? null,
      creditsRequired: entity.creditsRequired ?? null,
      mtssTier: entity.mtssTier || "",
      hasIep: entity.hasIep ?? null,
      firefly: entity.firefly || "",
      intervention: entity.intervention || "",
      updatedAt: entity.updatedAt,
    });
    if (results.length >= limit) break;
  }
  return results.sort((a, b) => a.studentName.localeCompare(b.studentName));
}

async function listDashboardStudents(limit = 500) {
  const students = await listStudents(limit);
  const studentIds = new Set(students.map((student) => student.studentId));
  const assessments = [];
  const entities = getClients().assessments.listEntities({
    queryOptions: { select: [
      "studentId", "subject", "assessment", "score", "scoreMax", "percent", "testDate",
      "reportingPeriod", "readingRit", "mathRit", "growthGoal", "scaleScore", "performanceCode",
      "performance", "testedYear", "totalRawScore", "teacherOfRecord", "sourceSheet", "createdAt",
    ] },
  });
  for await (const entity of entities) {
    if (studentIds.has(entity.studentId)) assessments.push(entity);
    if (assessments.length >= limit * 20) break;
  }
  return buildDashboardStudents(students, assessments);
}

module.exports = {
  SCHOOL_ID,
  storageConnectionString,
  ensureStorage,
  stageImport,
  getImport,
  downloadPendingImport,
  commitRecords,
  listImports,
  listStudents,
  listDashboardStudents,
};
