const { app } = require("@azure/functions");
const { json } = require("../lib/http");
const { getPrincipal, isUploaderAllowed, allowedUploadEmails, allowedUploadDomains } = require("../lib/auth");

app.http("data-health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "data/health",
  handler: async (request) => {
    const storageConfigured = Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const uploadPolicyConfigured = allowedUploadEmails().size > 0 || allowedUploadDomains().size > 0;
    const signedIn = Boolean(getPrincipal(request));
    const accountApproved = isUploaderAllowed(getPrincipal(request));
    return json(200, {
      storageConfigured,
      uploadListConfigured: uploadPolicyConfigured,
      uploadPolicyConfigured,
      signedIn,
      accountApproved,
      canUpload: storageConfigured && uploadPolicyConfigured && accountApproved,
      acceptedFileTypes: [".csv", ".cvc", ".xlsx"],
      maxFileSizeMb: 8,
    });
  },
});
