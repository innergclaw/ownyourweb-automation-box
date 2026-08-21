const assert = require("node:assert/strict");
const test = require("node:test");
const { strToU8, unzipSync, zipSync } = require("fflate");
const { parseDataset, analyzeDataset, numberValue, percentageValue, rowsFromMatrix } = require("../src/lib/parser");

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

function sampleMultiSheetWorkbook() {
  const files = unzipSync(sampleWorkbook());
  files["[Content_Types].xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
  files["xl/workbook.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="PSSA Grade 7 ELA" sheetId="1" r:id="rId1"/><sheet name="PSSA Grade 7 Math" sheetId="2" r:id="rId2"/></sheets></workbook>`);
  files["xl/_rels/workbook.xml.rels"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>`);
  files["xl/worksheets/sheet2.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Subject</t></is></c><c r="B1" t="inlineStr"><is><t>Student ID</t></is></c><c r="C1" t="inlineStr"><is><t>First Name</t></is></c><c r="D1" t="inlineStr"><is><t>Last Name</t></is></c><c r="E1" t="inlineStr"><is><t>Teacher on Record</t></is></c><c r="F1" t="inlineStr"><is><t>Grade</t></is></c><c r="G1" t="inlineStr"><is><t>Scale Score</t></is></c><c r="H1" t="inlineStr"><is><t>Performance</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>M</t></is></c><c r="B2" t="inlineStr"><is><t>MC-2002</t></is></c><c r="C2" t="inlineStr"><is><t>Sam</t></is></c><c r="D2" t="inlineStr"><is><t>Example</t></is></c><c r="E2" t="inlineStr"><is><t>Teacher B</t></is></c><c r="F2"><v>7</v></c><c r="G2"><v>1050</v></c><c r="H2" t="inlineStr"><is><t>Pro</t></is></c></row></sheetData></worksheet>`);
  return Buffer.from(zipSync(files));
}

test("reads every worksheet and preserves PSSA subject details", async () => {
  const analysis = analyzeDataset(await parseDataset(sampleMultiSheetWorkbook(), "pssa.xlsx"));

  assert.equal(analysis.summary.validRows, 2);
  assert.equal(analysis.summary.sheets.length, 2);
  assert.equal(analysis.records[1].assessment.subject, "Math");
  assert.equal(analysis.records[1].assessment.teacherOfRecord, "Teacher B");
  assert.equal(analysis.records[1].assessment.scaleScore, 1050);
  assert.equal(analysis.records[1].assessment.performance, "Pro");
  assert.equal(analysis.records[1].assessment.sourceSheet, "PSSA Grade 7 Math");
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

test("flags identity conflicts for the same student ID", async () => {
  const csv = Buffer.from([
    "Student ID,Student Name,Unique Matching ID,Scale Score",
    "MC-9,Student One,MATCH-1,1000",
    "MC-9,Student Two,MATCH-2,1010",
  ].join("\n"));
  const analysis = analyzeDataset(await parseDataset(csv, "conflict.csv"));

  assert.equal(analysis.summary.identityConflicts, 1);
  assert.match(analysis.summary.warnings.join(" "), /conflicting names or matching IDs/);
});

test("recognizes the Lenfest Keystone export fields", () => {
  const parsed = rowsFromMatrix([
    ["Test Name", "ID", "Last Name", "First Name", "Grade", "Admin Scale Score", "Admin Perf. Level", "Best Performance Level Code", "IEP (not gifted)"],
    ["A1", "151411", "EVERETT", "KAHMORA", 9, 1546, "Adv", 4, "N"],
  ]);
  parsed.rows[0].__sourceSheet = "Keystone 2025-26";
  const analysis = analyzeDataset(parsed);
  const [record] = analysis.records;
  assert.equal(record.valid, true);
  assert.equal(record.student.studentId, "151411");
  assert.equal(record.student.studentName, "Kahmora Everett");
  assert.equal(record.assessment.assessment, "Keystone Algebra I");
  assert.equal(record.assessment.subject, "Math");
  assert.equal(record.assessment.scaleScore, 1546);
  assert.equal(record.assessment.testedYear, "2025-26");
});

test("recognizes Fall MAP RIT columns and removes repeated sheet rows", () => {
  const headers = ["Student ID", "Student Name", "Grade", "MAP RIT Math (most recent)", "MAP RIT Read (most recent)"];
  const parsed = {
    headers,
    rows: [
      { "Student ID": "132393", "Student Name": "Young, Shareef", Grade: 8, "MAP RIT Math (most recent)": 210, "MAP RIT Read (most recent)": 213, __sourceSheet: "PSSA & Fall MAP 2025" },
      { "Student ID": "132393", "Student Name": "Young, Shareef", Grade: 8, "MAP RIT Math (most recent)": 210, "MAP RIT Read (most recent)": 213, __sourceSheet: "Focal Students - Tutoring" },
    ],
  };
  const analysis = analyzeDataset(parsed);
  assert.equal(analysis.summary.validRows, 1);
  assert.equal(analysis.records[0].student.studentName, "Shareef Young");
  assert.equal(analysis.records[0].assessment.assessmentType, "MAP");
  assert.equal(analysis.records[0].assessment.mathRit, 210);
  assert.equal(analysis.records[0].assessment.readingRit, 213);
  assert.equal(analysis.records[0].assessment.reportingPeriod, "Fall 2025");
  assert.equal(analysis.records[0].assessment.testedYear, "2025-26");
});

test("normalizes the attendance dashboard fields", () => {
  const parsed = rowsFromMatrix([
    ["Student ID", "Student First Name", "Student Last Name", "Grade", "Has IEP", "Enrolled Days", "Pct Attendance", "Participation"],
    ["145784", "Taniyah", "Mitchell", "08", "Y", 180, 0.9, 0.85],
  ]);
  parsed.rows[0].__sourceFilename = "APSC Dashboard - Student Att.xlsx";
  const analysis = analyzeDataset(parsed);
  const [record] = analysis.records;
  assert.equal(record.valid, true);
  assert.equal(record.student.studentName, "Taniyah Mitchell");
  assert.equal(record.student.grade, "08");
  assert.equal(record.student.campus, "APSC");
  assert.equal(record.student.hasIep, true);
  assert.equal(record.student.attendance, 90);
  assert.equal(record.student.participation, 85);
  assert.equal(record.student.daysPresent, 162);
  assert.equal(record.student.daysAbsent, 18);
  assert.equal(record.assessment.assessment, "");
  assert.equal(percentageValue(0.9333), 93.33);
});

test("recognizes a roster-only student list and SpEd indicator", () => {
  const parsed = rowsFromMatrix([
    ["Student ID", "Last Name", "First Name", "Grade", "SpEd"],
    ["135951", "Abrahim", "Mahmoud", "12", "Yes"],
  ]);
  parsed.rows[0].__sourceFilename = "Student List 2025-26.xlsx";
  const analysis = analyzeDataset(parsed);
  const [record] = analysis.records;

  assert.equal(record.student.studentName, "Mahmoud Abrahim");
  assert.equal(record.student.hasIep, true);
  assert.equal(record.student.rosterYear, "2025-26");
  assert.equal(record.assessment.assessment, "");
  assert.match(analysis.summary.warnings.join(" "), /Master roster detected/);
});
