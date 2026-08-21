function decodePrincipal(value) {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function getPrincipal(request) {
  const principal = decodePrincipal(request.headers.get("x-ms-client-principal"));
  if (principal) return principal;

  if (process.env.LOCAL_DEV_AUTH === "true") {
    return {
      identityProvider: "local",
      userId: "local-development-user",
      userDetails: request.headers.get("x-local-user") || "local@example.org",
      userRoles: ["anonymous", "authenticated"],
    };
  }

  return null;
}

function allowedUploadEmails() {
  return new Set(
    String(process.env.DATA_UPLOAD_ALLOWED_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function allowedUploadDomains() {
  return new Set(
    String(process.env.DATA_UPLOAD_ALLOWED_DOMAINS || "masterycharter.org")
      .split(",")
      .map((value) => value.trim().toLowerCase().replace(/^@/, ""))
      .filter(Boolean),
  );
}

function isUploaderAllowed(principal) {
  if (!principal || !principal.userRoles?.includes("authenticated")) return false;
  const email = String(principal.userDetails || "").trim().toLowerCase();
  const domain = email.includes("@") ? email.split("@").pop() : "";
  return allowedUploadEmails().has(email) || allowedUploadDomains().has(domain);
}

function requireUploader(request) {
  const principal = getPrincipal(request);
  if (!principal || !principal.userRoles?.includes("authenticated")) {
    const error = new Error("Microsoft sign-in is required.");
    error.statusCode = 401;
    throw error;
  }

  const allowedEmails = allowedUploadEmails();
  const allowedDomains = allowedUploadDomains();
  if (!allowedEmails.size && !allowedDomains.size) {
    const error = new Error("Dataset uploads are paused until the staff upload list is configured.");
    error.statusCode = 503;
    throw error;
  }

  const email = String(principal.userDetails || "").toLowerCase();
  if (!isUploaderAllowed(principal)) {
    const error = new Error("Use an approved Mastery staff Microsoft account to upload student datasets.");
    error.statusCode = 403;
    throw error;
  }

  return { ...principal, email };
}

module.exports = { getPrincipal, requireUploader, allowedUploadEmails, allowedUploadDomains, isUploaderAllowed };
