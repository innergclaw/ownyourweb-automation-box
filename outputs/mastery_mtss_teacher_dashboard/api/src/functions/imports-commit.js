const { app } = require("@azure/functions");
const { requireUploader } = require("../lib/auth");
const { json, errorResponse } = require("../lib/http");
const { parseDataset, analyzeDataset } = require("../lib/parser");
const { getImport, downloadPendingImport, commitRecords } = require("../lib/storage");

app.http("imports-commit", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "imports/{importId}/commit",
  handler: async (request, context) => {
    try {
      const uploader = requireUploader(request);
      const importId = request.params.importId;
      const entity = await getImport(importId);
      if (entity.status === "committed") {
        return json(200, {
          importId,
          alreadyCommitted: true,
          studentsSaved: entity.studentsSaved || 0,
          assessmentsSaved: entity.assessmentsSaved || 0,
          invalidRows: entity.invalidRows || 0,
        });
      }
      if (entity.uploadedBy.toLowerCase() !== uploader.email) {
        const error = new Error("Only the staff member who previewed this file can confirm its import.");
        error.statusCode = 403;
        throw error;
      }

      const buffer = await downloadPendingImport(entity);
      const parsed = await parseDataset(buffer, entity.filename);
      const analysis = analyzeDataset(parsed);
      if (!analysis.summary.validRows) {
        const error = new Error("No valid student rows are available to import.");
        error.statusCode = 400;
        throw error;
      }

      const result = await commitRecords({ entity, analysis, uploader });
      return json(200, { importId, ...result });
    } catch (error) {
      return errorResponse(error, context);
    }
  },
});
