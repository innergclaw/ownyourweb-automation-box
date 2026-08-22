const assert = require("node:assert/strict");
const test = require("node:test");
const { preserveMasterRosterFields } = require("../src/lib/storage");

test("keeps master roster identity fields when an assessment file is imported", () => {
  const fields = preserveMasterRosterFields(
    { rosterYear: "2025-26" },
    {
      studentName: "Assessment Export Name",
      firstName: "Assessment",
      lastName: "Export",
      grade: "7",
      hasIep: false,
      campus: "Lenfest",
      attendance: 94.5,
    },
  );

  assert.deepEqual(fields, { campus: "Lenfest", attendance: 94.5 });
});

test("allows a new master roster to update its authoritative fields", () => {
  const fields = preserveMasterRosterFields(
    { rosterYear: "2024-25" },
    {
      studentName: "Current Student",
      grade: "10",
      hasIep: true,
      rosterYear: "2025-26",
    },
  );

  assert.equal(fields.studentName, "Current Student");
  assert.equal(fields.grade, "10");
  assert.equal(fields.hasIep, true);
  assert.equal(fields.rosterYear, "2025-26");
});
