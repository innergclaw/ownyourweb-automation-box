const { app } = require("@azure/functions");
const { requireUploader } = require("../lib/auth");
const { json, errorResponse } = require("../lib/http");
const { listDashboardStudents } = require("../lib/storage");

app.http("students-list", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "students",
  handler: async (request, context) => {
    try {
      requireUploader(request);
      const requestedLimit = Number(request.query.get("limit"));
      const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;
      const students = await listDashboardStudents(limit);
      return json(200, { students, count: students.length });
    } catch (error) {
      return errorResponse(error, context);
    }
  },
});
