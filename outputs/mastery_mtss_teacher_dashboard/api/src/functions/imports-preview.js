const crypto = require("node:crypto");
const { app } = require("@azure/functions");
const { requireUploader } = require("../lib/auth");
const { json, errorResponse } = require("../lib/http");
const { parseDataset, analyzeDataset } = require("../lib/parser");
const { stageImport } = require("../lib/storage");

const MAX_FILE_BYTES = 8 * 1024 * 1024;

app.http("imports-preview", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "imports/preview",
  handler: async (request, context) => {
    try {
      const uploader = requireUploader(request);
      const form = await request.formData();
      const file = form.get("dataset");
      if (!file || typeof file.arrayBuffer !== "function") {
        const error = new Error("Choose a CSV or XLSX dataset to upload.");
        error.statusCode = 400;
        throw error;
      }
      if (file.size > MAX_FILE_BYTES) {
        const error = new Error("The dataset is larger than the 8 MB upload limit.");
        error.statusCode = 413;
        throw error;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseDataset(buffer, file.name);
      const analysis = analyzeDataset(parsed);
      const importId = crypto.randomUUID();
      await stageImport({ importId, filename: file.name, buffer, analysis, uploader });

      return json(200, {
        importId,
        filename: file.name,
        headers: analysis.headers,
        mapping: analysis.mapping,
        summary: analysis.summary,
        previewRows: analysis.records.slice(0, 10).map(({ raw, ...record }) => record),
      });
    } catch (error) {
      return errorResponse(error, context);
    }
  },
});
