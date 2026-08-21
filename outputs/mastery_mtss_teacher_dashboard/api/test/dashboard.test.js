const test = require("node:test");
const assert = require("node:assert/strict");
const { buildDashboardStudents, dedupeAssessments } = require("../src/lib/dashboard");

test("builds a live dashboard record from student and assessment data", () => {
  const students = [{
    studentId: "DEMO-1", studentName: "Avery Sample", grade: "9", attendance: 88,
    gpa: 1.9, creditsEarned: 5, creditsRequired: 24, mtssTier: "Tier 3",
    hasIep: true, firefly: "Intensive", intervention: "Daily support",
  }];
  const assessments = [
    { studentId: "DEMO-1", subject: "Reading", assessment: "Unit 1", testDate: "2026-09-01", percent: 55, readingRit: 210, growthGoal: 7 },
    { studentId: "DEMO-1", subject: "Reading", assessment: "Unit 2", testDate: "2026-10-01", percent: 62, readingRit: 210, growthGoal: 7 },
    { studentId: "DEMO-1", subject: "Math", assessment: "Unit 1", testDate: "2026-09-01", percent: 58, mathRit: 214, growthGoal: 7 },
    { studentId: "DEMO-1", subject: "Math", assessment: "Unit 2", testDate: "2026-10-01", percent: 64, mathRit: 214, growthGoal: 7 },
  ];

  const [result] = buildDashboardStudents(students, assessments);
  assert.equal(result.reading, 62);
  assert.equal(result.math, 64);
  assert.equal(result.status, "Review");
  assert.equal(result.assessmentCount, 4);
  assert.equal(result.missingAssessmentCount, 0);
  assert.match(result.trend, /Reading \+7/);
  assert.match(result.readingText, /RIT 210/);
  assert.equal(result.creditsExpected, 6);
});

test("deduplicates repeated imports of the same assessment", () => {
  const records = [
    { studentId: "DEMO-1", subject: "Math", assessment: "Unit 1", testDate: "2026-09-01", percent: 72, createdAt: "2026-09-03" },
    { studentId: "DEMO-1", subject: "Math", assessment: "Unit 1", testDate: "2026-09-01", percent: 60, createdAt: "2026-09-02" },
  ];
  const result = dedupeAssessments(records);
  assert.equal(result.length, 1);
  assert.equal(result[0].percent, 72);
});

test("handles students whose optional academic fields are missing", () => {
  const [result] = buildDashboardStudents([
    { studentId: "DEMO-2", studentName: "Jordan Sample", grade: "4", mtssTier: "Tier 1", gpa: null, attendance: null },
  ], []);
  assert.equal(result.reading, null);
  assert.equal(result.gpa, null);
  assert.equal(result.missingAssessmentCount, 4);
  assert.match(result.next, /Add 4 interim/);
});
