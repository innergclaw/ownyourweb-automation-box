const { app } = require("@azure/functions");
const { requireUploader } = require("../lib/auth");
const { json, errorResponse } = require("../lib/http");
const { listImports } = require("../lib/storage");

app.http("imports-list", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "imports",
  handler: async (request, context) => {
    try {
      requireUploader(request);
      return json(200, { imports: await listImports() });
    } catch (error) {
      return errorResponse(error, context);
    }
  },
});
