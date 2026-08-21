const { app } = require("@azure/functions");
const { getPrincipal, allowedUploadEmails } = require("../lib/auth");
const { json } = require("../lib/http");

app.http("data-health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "data/health",
  handler: async (request) => {
    const principal = getPrincipal(request);
    const email = String(principal?.userDetails || "").toLowerCase();
    const allowed = allowedUploadEmails();
    return json(200, {
      authenticated: Boolean(principal?.userRoles?.includes("authenticated")),
      storageConfigured: Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING),
      uploadListConfigured: allowed.size > 0,
      canUpload: Boolean(email && allowed.has(email) && process.env.AZURE_STORAGE_CONNECTION_STRING),
      acceptedFileTypes: [".csv", ".xlsx"],
      maxFileSizeMb: 8,
    });
  },
});
