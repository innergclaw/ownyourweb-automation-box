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
    { studentId: "DEMO-2", studentName: "Jordan Sample", grade: "7", mtssTier: "Tier 1", gpa: null, attendance: null },
  ], []);
  assert.equal(result.reading, null);
  assert.equal(result.gpa, null);
  assert.equal(result.missingAssessmentCount, 4);
  assert.match(result.next, /Add 4 interim/);
});

test("keeps missing high-school credit data blank instead of reporting zero", () => {
  const [result] = buildDashboardStudents([
    { studentId: "DEMO-CREDITS", studentName: "Credit Sample", grade: "10", creditsEarned: null },
  ], []);

  assert.equal(result.creditsEarned, null);
  assert.equal(result.creditsExpected, 12);
});

test("limits dashboard records to grades 7 through 12", () => {
  const results = buildDashboardStudents([
    { studentId: "GRADE-6", studentName: "Grade Six Sample", grade: "6" },
    { studentId: "GRADE-7", studentName: "Grade Seven Sample", grade: "7" },
    { studentId: "GRADE-12", studentName: "Grade Twelve Sample", grade: "12" },
    { studentId: "GRADE-13", studentName: "Grade Thirteen Sample", grade: "13" },
  ], []);

  assert.deepEqual(results.map((student) => student.gradeShort), ["7", "12"]);
});

test("surfaces PSSA scale score, performance, teacher, and matching identifiers", () => {
  const [result] = buildDashboardStudents([{
    studentId: "DEMO-3", studentName: "Taylor Sample", grade: "7",
    drcStudentId: "DRC-3", uniqueMatchingId: "MATCH-3", paSecureId: "PA-3",
  }], [{
    studentId: "DEMO-3", subject: "Reading", assessment: "PSSA Reading Grade 7",
    testedYear: "2026", scaleScore: 1048, performanceCode: "3", performance: "Pro",
    teacherOfRecord: "Teacher Sample", totalRawScore: 39, createdAt: "2026-08-21",
  }]);

  assert.equal(result.readingScaleScore, 1048);
  assert.equal(result.readingPerformance, "Proficient");
  assert.equal(result.readingTeacher, "Teacher Sample");
  assert.equal(result.readingPerformanceCode, 3);
  assert.equal(result.uniqueMatchingId, "MATCH-3");
  assert.match(result.readingText, /PSSA 1048 \(Proficient\)/);
});

test("keeps PSSA, Fall MAP, and Keystone evidence separated", () => {
  const [result] = buildDashboardStudents(
    [{ studentId: "DEMO-4", studentName: "Jordan Example", grade: "9" }],
    [
      { studentId: "DEMO-4", subject: "Reading", assessment: "PSSA Reading Grade 8", assessmentType: "PSSA", scaleScore: 1048, performance: "Pro", testedYear: "2025" },
      { studentId: "DEMO-4", subject: "MAP", assessment: "Fall MAP Reading + Math", assessmentType: "MAP", readingRit: 218, mathRit: 221, testedYear: "2025-26" },
      { studentId: "DEMO-4", subject: "Math", assessment: "Keystone Algebra I", assessmentType: "Keystone", scaleScore: 1502, performance: "Bas", testedYear: "2025-26" },
    ],
  );
  assert.equal(result.readingScaleScore, 1048);
  assert.equal(result.mathScaleScore, null);
  assert.equal(result.mapReadingRit, 218);
  assert.equal(result.mapMathRit, 221);
  assert.match(result.keystoneText, /Algebra I: 1502 \(Basic\)/);
  assert.deepEqual(result.assessmentTypes, ["Keystone", "MAP", "PSSA"]);
});

test("surfaces attendance evidence and prioritizes low attendance", () => {
  const [result] = buildDashboardStudents(
    [{ studentId: "DEMO-5", studentName: "Taylor Example", grade: "10", attendance: 88.5, enrolledDays: 180, daysPresent: 159.3, daysAbsent: 20.7, participation: 84 }],
    [],
  );
  assert.equal(result.attendance, 88.5);
  assert.equal(result.enrolledDays, 180);
  assert.equal(result.daysAbsent, 20.7);
  assert.equal(result.participation, 84);
  assert.equal(result.status, "Review");
  assert.equal(result.next, "Review attendance plan this week");
});
