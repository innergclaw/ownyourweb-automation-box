const assert = require("node:assert/strict");
const test = require("node:test");
const { strToU8, zipSync } = require("fflate");
const { parseDataset, analyzeDataset, numberValue } = require("../src/lib/parser");

test("maps and normalizes a CSV student record", async () => {
  const csv = Buffer.from([
    "Student ID,Student Name,Grade,Subject,Assessment Name,Score,Max Score,Attendance Percent,Current GPA,IEP Status",
    "MC-1001,Ada Example,6,Reading,Amplify Unit 1,18,24,94,2.42,Yes",
  ].join("\n"));

  const parsed = await parseDataset(csv, "students.csv");
  const analysis = analyzeDataset(parsed);
  const record = analysis.records[0];

  assert.equal(analysis.summary.validRows, 1);
  assert.equal(record.student.studentId, "MC-1001");
  assert.equal(record.student.studentName, "Ada Example");
  assert.equal(record.student.hasIep, true);
  assert.equal(record.assessment.percent, 75);
});

function sampleWorkbook() {
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="MAP" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Student Number</t></is></c><c r="B1" t="inlineStr"><is><t>First Name</t></is></c><c r="C1" t="inlineStr"><is><t>Last Name</t></is></c><c r="D1" t="inlineStr"><is><t>MAP Reading RIT</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>MC-2002</t></is></c><c r="B2" t="inlineStr"><is><t>Sam</t></is></c><c r="C2" t="inlineStr"><is><t>Example</t></is></c><c r="D2"><v>218</v></c></row></sheetData></worksheet>`,
  };
  return Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([name, value]) => [name, strToU8(value)]))));
}

test("reads the first worksheet from an XLSX upload", async () => {
  const buffer = sampleWorkbook();

  const analysis = analyzeDataset(await parseDataset(buffer, "map.xlsx"));
  assert.equal(analysis.summary.validRows, 1);
  assert.equal(analysis.records[0].student.studentName, "Sam Example");
  assert.equal(analysis.records[0].assessment.readingRit, 218);
});

test("rejects rows missing required identity fields", async () => {
  const csv = Buffer.from("Student ID,Student Name,Score\n,Missing ID,70\nMC-3,,80");
  const analysis = analyzeDataset(await parseDataset(csv, "invalid.csv"));

  assert.equal(analysis.summary.validRows, 0);
  assert.equal(analysis.summary.invalidRows, 2);
  assert.deepEqual(analysis.records[0].errors, ["Missing student ID"]);
  assert.deepEqual(analysis.records[1].errors, ["Missing student name"]);
});

test("normalizes percent and numeric formatting", () => {
  assert.equal(numberValue("88%"), 88);
  assert.equal(numberValue("$1,250"), 1250);
  assert.equal(numberValue("not scored"), null);
});

test("finds the actual header row below export title rows", async () => {
  const csv = Buffer.from([
    "MAP Student Progress Report",
    "Generated for school use",
    "Local Student ID,Student Name,Grade Level,Term Name,RIT Score",
    "MC-3003,Robin Example,7,Spring 2026,221",
  ].join("\n"));
  const analysis = analyzeDataset(await parseDataset(csv, "map-export.csv"));

  assert.equal(analysis.summary.validRows, 1);
  assert.equal(analysis.records[0].student.studentId, "MC-3003");
  assert.equal(analysis.records[0].assessment.score, 221);
  assert.equal(analysis.records[0].assessment.reportingPeriod, "Spring 2026");
});
