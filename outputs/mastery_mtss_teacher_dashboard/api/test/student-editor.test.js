const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateStudent, saveStudent } = require('../src/lib/student-editor');
const input = { studentId:'00123', firstName:'Test', lastName:'Student', grade:'8', campus:'Lenfest', mtssTier:'2', intervention:'' };
test('reflection fields validate dates and capture an attendance baseline once', async () => {
  assert.throws(() => validateStudent({...input,focusReviewDate:'2026-02-30'}));
  assert.throws(() => validateStudent({...input,focusReviewDate:'2026-99-99'}));
  let saved;
  const table = {updateEntity:async e => {saved=e;}};
  await saveStudent({table,input:{...input,etag:'v1',focusCause:'Hypothesis',focusReviewDate:'2026-10-01'},existing:{...input,attendance:87},actor:'staff'});
  assert.equal(saved.focusBaselineAttendance,87);
  assert.equal(saved.focusUpdatedBy,'staff');
  await saveStudent({table,input:{...input,etag:'v2',focusProgress:'Reviewed'},existing:{...input,attendance:91,focusStartedAt:'2026-09-01'},actor:'staff'});
  assert.equal(saved.focusBaselineAttendance,undefined);
});
test('validates required fields and limits grades', () => {
  assert.equal(validateStudent(input).studentId, '00123');
  for (const patch of [{grade:'6'}, {firstName:''}, {mtssTier:'4'}, {studentId:'../x'}]) assert.throws(() => validateStudent({...input,...patch}));
});
test('create uses atomic insert and propagates duplicate errors', async () => {
  const table = { createEntity: async entity => { assert.equal(entity.rosterYear,'2025-26'); throw Object.assign(new Error('duplicate'),{statusCode:409}); } };
  await assert.rejects(saveStudent({table, schoolId:'school', key:'key', input, actor:'staff', rosterYear:'2025-26'}), {statusCode:409});
});
test('edit merges only whitelisted fields and uses version protection', async () => {
  const table = { updateEntity: async (entity, mode, options) => {
    assert.equal(mode,'Merge'); assert.equal(options.etag,'version1');
    assert.equal(entity.attendance,undefined); assert.equal(entity.readingScaleScore,undefined);
    assert.equal(entity.studentId,'00123');
  } };
  await saveStudent({table,schoolId:'school',key:'key',input:{...input,etag:'version1',attendance:0},actor:'staff',existing:input});
  await assert.rejects(saveStudent({table,input,existing:input}),{statusCode:409});
  await assert.rejects(saveStudent({table,input:{...input,studentId:'999'},existing:input}),{statusCode:409});
});
