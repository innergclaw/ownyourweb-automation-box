const { app } = require('@azure/functions');
const { requireUploader } = require('../lib/auth');
const { json, errorResponse } = require('../lib/http');
const { editStudent } = require('../lib/storage');

app.http('students-edit', {
  methods: ['GET', 'POST', 'PATCH'], authLevel: 'anonymous', route: 'student-record',
  handler: async (request, context) => {
    try {
      const actor = requireUploader(request);
      const input = request.method === 'GET' ? { studentId: request.query.get('id') } : await request.json();
      return json(200, await editStudent(request.method, input, actor));
    } catch (error) {
      if ([409, 412].includes(error.statusCode)) error.message = 'This ID already exists or the record changed. Reload the student and try again.';
      return errorResponse(error, context);
    }
  },
});
