const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateStudent, saveStudent } = require('../src/lib/student-editor');
const input = { studentId:'00123', firstName:'Test', lastName:'Student', grade:'8', campus:'Lenfest', mtssTier:'2', intervention:'' };
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
