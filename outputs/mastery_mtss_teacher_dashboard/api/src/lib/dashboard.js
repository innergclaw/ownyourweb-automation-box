function numeric(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function gradeNumber(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function assessmentTime(record) {
  const value = record.testDate || record.createdAt || "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function recordUpdatedTime(record) {
  const timestamp = Date.parse(record.createdAt || record.testDate || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function latestValue(records, field) {
  return [...records]
    .sort((a, b) => assessmentTime(b) - assessmentTime(a))
    .find((record) => numeric(record[field]) !== null)?.[field] ?? null;
}

function subjectSummary(records, subject) {
  const subjectRecords = records
    .filter((record) => String(record.subject || "").toLowerCase() === subject.toLowerCase())
    .sort((a, b) => assessmentTime(a) - assessmentTime(b));
  const scored = subjectRecords.filter((record) => numeric(record.percent) !== null);
  const first = scored.length ? numeric(scored[0].percent) : null;
  const latest = scored.length ? numeric(scored[scored.length - 1].percent) : null;
  const latestRecord = subjectRecords[subjectRecords.length - 1] || {};
  return {
    count: subjectRecords.length,
    first,
    latest,
    change: first !== null && latest !== null ? Math.round((latest - first) * 10) / 10 : null,
    scaleScore: numeric(latestRecord.scaleScore),
    performanceCode: numeric(latestRecord.performanceCode),
    performance: String(latestRecord.performance || "").trim(),
    teacherOfRecord: String(latestRecord.teacherOfRecord || "").trim(),
    testedYear: String(latestRecord.testedYear || "").trim(),
    totalRawScore: numeric(latestRecord.totalRawScore),
  };
}

function dedupeAssessments(records) {
  const unique = new Map();
  for (const record of records) {
    const key = [record.studentId, record.subject, record.assessment, record.testedYear, record.testDate, record.reportingPeriod]
      .map((value) => String(value || "").trim().toLowerCase())
      .join("|");
    const current = unique.get(key);
    if (!current || recordUpdatedTime(record) >= recordUpdatedTime(current)) unique.set(key, record);
  }
  return [...unique.values()];
}

function statusFor(student, reading, math) {
  const tier = String(student.mtssTier || "").toLowerCase();
  const firefly = String(student.firefly || "").toLowerCase();
  const attendance = numeric(student.attendance);
  const gpa = numeric(student.gpa);
  const scores = [reading.latest, math.latest].filter((value) => value !== null);
  const lowestScore = scores.length ? Math.min(...scores) : null;
  const performanceCodes = [reading.performanceCode, math.performanceCode].filter((value) => value !== null);
  const lowestPerformance = performanceCodes.length ? Math.min(...performanceCodes) : null;

  if (tier.includes("3") || firefly.includes("intensive") || (attendance !== null && attendance < 90)
    || (gpa !== null && gpa < 2) || (lowestScore !== null && lowestScore < 60) || lowestPerformance === 1) return "Review";
  if (tier.includes("2") || firefly.includes("watch") || (attendance !== null && attendance < 93)
    || (lowestScore !== null && lowestScore < 70) || lowestPerformance === 2) return "Watch";
  return "On Track";
}

function scoreText(summary, rit, goal) {
  const parts = [];
  if (summary.scaleScore !== null) parts.push(`PSSA ${summary.scaleScore}${summary.performance ? ` (${summary.performance})` : ""}`);
  if (numeric(rit) !== null) parts.push(`RIT ${numeric(rit)}`);
  if (numeric(goal) !== null) parts.push(`+${numeric(goal)} goal`);
  if (summary.latest !== null) parts.push(`latest ${summary.latest}%`);
  return parts.length ? parts.join(" | ") : "No imported score";
}

function trendText(reading, math) {
  const fragments = [];
  if (reading.change !== null) fragments.push(`Reading ${reading.change >= 0 ? "+" : ""}${reading.change} points`);
  if (math.change !== null) fragments.push(`Math ${math.change >= 0 ? "+" : ""}${math.change} points`);
  return fragments.length ? `${fragments.join("; ")} across imported interim checks` : "More assessment points are needed for a trend";
}

function expectedCredits(grade, required) {
  if (grade === null || grade < 9) return 4;
  const totalRequired = numeric(required) ?? 24;
  return Math.min(totalRequired, (grade - 8) * 6);
}

function buildDashboardStudents(students, assessments) {
  const deduped = dedupeAssessments(assessments);
  const byStudent = new Map();
  for (const record of deduped) {
    if (!byStudent.has(record.studentId)) byStudent.set(record.studentId, []);
    byStudent.get(record.studentId).push(record);
  }

  return students.map((student) => {
    const records = byStudent.get(student.studentId) || [];
    const reading = subjectSummary(records, "Reading");
    const math = subjectSummary(records, "Math");
    const grade = gradeNumber(student.grade);
    const assessmentCount = records.length;
    const reportingPeriods = [...new Set(records.map((record) => String(record.reportingPeriod || "").trim()).filter(Boolean))].sort();
    const missingAssessmentCount = Math.max(0, 4 - assessmentCount);
    const creditsExpected = expectedCredits(grade, student.creditsRequired);
    const creditsEarned = numeric(student.creditsEarned) ?? (grade !== null && grade < 9 ? assessmentCount : 0);
    const creditGap = creditsExpected - creditsEarned;
    let status = statusFor(student, reading, math);
    if (grade !== null && grade >= 9 && creditGap >= 2) status = "Review";
    else if (grade !== null && grade >= 9 && creditGap > 0 && status === "On Track") status = "Watch";
    const readingRit = latestValue(records, "readingRit");
    const mathRit = latestValue(records, "mathRit");
    const growthGoal = latestValue(records, "growthGoal");
    const gpa = numeric(student.gpa);
    const gpaStatus = gpa === null ? status : gpa < 2 ? "Review" : gpa < 2.75 ? "Watch" : "On Track";
    const iep = student.hasIep === true ? "IEP on file" : student.hasIep === false ? "No IEP" : "IEP status not imported";
    const firefly = student.firefly ? `Firefly ${String(student.firefly).toLowerCase()}` : "Firefly not imported";
    const next = missingAssessmentCount
      ? `Add ${missingAssessmentCount} interim data point${missingAssessmentCount === 1 ? "" : "s"}`
      : status === "Review"
        ? "Review intervention outcome this week"
        : status === "Watch"
          ? "Review progress at the next biweekly meeting"
          : "Maintain the current monitoring cycle";

    return {
      id: student.studentId,
      name: student.studentName,
      grade: grade === null ? String(student.grade || "Grade not imported") : `Grade ${grade}`,
      gradeShort: grade === null ? "" : String(grade),
      tier: student.mtssTier || "Tier not assigned",
      reading: reading.latest,
      math: math.latest,
      attendance: numeric(student.attendance),
      status,
      owner: status === "Review" ? "MTSS Case Team" : status === "Watch" ? "Grade Team" : "Instructional Team",
      readingText: scoreText(reading, readingRit, growthGoal),
      mathText: scoreText(math, mathRit, growthGoal),
      readingScaleScore: reading.scaleScore,
      mathScaleScore: math.scaleScore,
      readingPerformance: reading.performance,
      mathPerformance: math.performance,
      readingPerformanceCode: reading.performanceCode,
      mathPerformanceCode: math.performanceCode,
      readingTeacher: reading.teacherOfRecord || "Not listed",
      mathTeacher: math.teacherOfRecord || "Not listed",
      readingTestedYear: reading.testedYear,
      mathTestedYear: math.testedYear,
      readingRawScore: reading.totalRawScore,
      mathRawScore: math.totalRawScore,
      drcStudentId: student.drcStudentId || "",
      uniqueMatchingId: student.uniqueMatchingId || "",
      paSecureId: student.paSecureId || "",
      gpa,
      passingGpa: 2,
      targetGpa: 2.75,
      creditsEarned,
      creditsExpected,
      creditLabel: grade !== null && grade >= 9 ? "credits earned" : "assessment checkpoints",
      gpaStatus,
      trend: trendText(reading, math),
      intervention: student.intervention || "No intervention details imported",
      iep: `${iep}, ${firefly}`,
      next,
      assessmentCount,
      readingAssessmentCount: reading.count,
      mathAssessmentCount: math.count,
      missingAssessmentCount,
      reportingPeriods,
      updatedAt: student.updatedAt || null,
    };
  });
}

module.exports = { buildDashboardStudents, dedupeAssessments, subjectSummary };
