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

function requireUploader(request) {
  const principal = getPrincipal(request);
  if (!principal || !principal.userRoles?.includes("authenticated")) {
    const error = new Error("Microsoft sign-in is required.");
    error.statusCode = 401;
    throw error;
  }

  const allowed = allowedUploadEmails();
  if (!allowed.size) {
    const error = new Error("Dataset uploads are paused until the staff upload list is configured.");
    error.statusCode = 503;
    throw error;
  }

  const email = String(principal.userDetails || "").toLowerCase();
  if (!allowed.has(email)) {
    const error = new Error("Your Microsoft account is not approved to upload student datasets.");
    error.statusCode = 403;
    throw error;
  }

  return { ...principal, email };
}

module.exports = { getPrincipal, requireUploader, allowedUploadEmails };
