const FIELD_DEFINITIONS = {
  studentId: ["student id", "student_id", "studentid", "id number", "student number", "local id", "local student id", "student identifier", "sis id", "sas id", "sasid"],
  studentName: ["student name", "student_name", "name", "full name", "student"],
  firstName: ["first name", "first_name", "firstname", "given name"],
  lastName: ["last name", "last_name", "lastname", "surname", "family name"],
  grade: ["grade", "grade level", "grade_level", "current grade"],
  subject: ["subject", "content area", "content_area", "course subject"],
  assessment: ["assessment", "assessment name", "test", "test name", "measure", "test event", "assessment title"],
  score: ["score", "raw score", "raw_score", "points earned", "result", "rit score", "scale score", "scaled score", "overall score"],
  scoreMax: ["max score", "maximum score", "points possible", "total points", "score max"],
  percent: ["percent", "percentage", "percent score", "score percent", "proficiency percent"],
  testDate: ["test date", "assessment date", "date", "test_date", "completion date", "test start date"],
  reportingPeriod: ["reporting period", "term", "term name", "quarter", "marking period", "period"],
  readingRit: ["reading rit", "map reading rit", "reading rit score", "reading_rit"],
  mathRit: ["math rit", "map math rit", "math rit score", "math_rit"],
  growthGoal: ["growth goal", "rit growth goal", "projected growth", "growth_goal"],
  attendance: ["attendance", "attendance percent", "attendance rate", "attendance_pct"],
  gpa: ["gpa", "current gpa", "cumulative gpa"],
  creditsEarned: ["credits earned", "earned credits", "credits_earned"],
  creditsRequired: ["credits required", "required credits", "credits_required"],
  mtssTier: ["mtss tier", "tier", "intervention tier", "mtss_tier"],
  iep: ["iep", "iep status", "has iep", "special education"],
  firefly: ["firefly", "firefly status", "firefly screening"],
  intervention: ["intervention", "intervention details", "current intervention", "support"],
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");
}

function detectMapping(headers) {
  const normalized = headers.map((header) => ({ original: header, normalized: normalizeHeader(header) }));
  const mapping = {};

  for (const [field, aliases] of Object.entries(FIELD_DEFINITIONS)) {
    const aliasSet = new Set(aliases.map(normalizeHeader));
    const match = normalized.find((header) => aliasSet.has(header.normalized));
    if (match) mapping[field] = match.original;
  }

  return mapping;
}

module.exports = { FIELD_DEFINITIONS, normalizeHeader, detectMapping };
