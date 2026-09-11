function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function validateStudent(input) {
  const result = {};
  for (const key of ['studentId', 'firstName', 'lastName', 'grade', 'campus', 'mtssTier', 'intervention']) {
    if (typeof input[key] !== 'string') fail(`Invalid ${key}.`);
    result[key] = input[key].trim();
    if (result[key].length > (key === 'intervention' ? 2000 : 150)) fail(`${key} is too long.`);
  }
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(result.studentId)) fail('Enter a valid student ID.');
  if (!result.firstName || !result.lastName) fail('First and last names are required.');
  if (!/^(7|8|9|10|11|12)$/.test(result.grade)) fail('Grade must be 7 through 12.');
  if (!['', '1', '2', '3', 'Tier 1', 'Tier 2', 'Tier 3'].includes(result.mtssTier)) fail('Choose a valid MTSS tier.');
  if (/^[123]$/.test(result.mtssTier)) result.mtssTier = `Tier ${result.mtssTier}`;
  result.studentName = `${result.firstName} ${result.lastName}`;
  for (const key of ['focusCause', 'focusEvidence', 'focusSupport', 'focusOwner', 'focusReviewDate', 'focusProgress']) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== 'string' || input[key].length > 2000) fail(`Invalid ${key}.`);
    result[key] = input[key].trim();
  }
  if (result.focusReviewDate && (!/^\d{4}-\d{2}-\d{2}$/.test(result.focusReviewDate) || !Number.isFinite(Date.parse(result.focusReviewDate)) || new Date(result.focusReviewDate).toISOString().slice(0,10) !== result.focusReviewDate)) fail('Enter a valid review date.');
  return result;
}

async function saveStudent({ table, schoolId, key, input, actor, existing, rosterYear }) {
  const fields = validateStudent(input);
  if (existing && fields.studentId !== existing.studentId) fail('Student IDs cannot be changed.', 409);
  const entity = { partitionKey: schoolId, rowKey: key, ...fields,
    updatedAt: new Date().toISOString(), updatedBy: actor };
  if (['focusCause','focusEvidence','focusSupport','focusOwner','focusReviewDate','focusProgress'].some(key => fields[key])) {
    entity.focusUpdatedAt = entity.updatedAt;
    entity.focusUpdatedBy = actor;
    if (!existing?.focusStartedAt) {
      entity.focusStartedAt = entity.updatedAt;
      if (existing?.attendance !== undefined && existing?.attendance !== null) entity.focusBaselineAttendance = existing.attendance;
    }
  }
  if (existing) {
    if (!input.etag || input.etag === '*') fail('Reload this student before saving.', 409);
    await table.updateEntity(entity, 'Merge', { etag: input.etag });
  } else {
    entity.rosterYear = rosterYear;
    await table.createEntity(entity);
  }
  return entity;
}
module.exports = { validateStudent, saveStudent, fail };
