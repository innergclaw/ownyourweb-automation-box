const { app } = require("@azure/functions");
const { json } = require("../lib/http");

app.http("data-health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "data/health",
  handler: async () => {
    const storageConfigured = Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const uploadListConfigured = Boolean(String(process.env.DATA_UPLOAD_ALLOWED_EMAILS || "").trim());
    return json(200, {
      storageConfigured,
      uploadListConfigured,
      canUpload: storageConfigured && uploadListConfigured,
      acceptedFileTypes: [".csv", ".xlsx"],
      maxFileSizeMb: 8,
    });
  },
});
