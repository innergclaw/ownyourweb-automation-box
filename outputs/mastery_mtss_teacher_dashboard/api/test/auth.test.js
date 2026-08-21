const assert = require("node:assert/strict");
const test = require("node:test");
const { isUploaderAllowed, requireUploader } = require("../src/lib/auth");

function principal(email) {
  return {
    identityProvider: "aad",
    userId: `user-${email}`,
    userDetails: email,
    userRoles: ["anonymous", "authenticated"],
  };
}

function requestFor(email) {
  const encoded = Buffer.from(JSON.stringify(principal(email))).toString("base64");
  return { headers: new Headers({ "x-ms-client-principal": encoded }) };
}

test("approves authenticated Mastery staff accounts by domain", () => {
  assert.equal(isUploaderAllowed(principal("teacher@masterycharter.org")), true);
  assert.equal(requireUploader(requestFor("teacher@masterycharter.org")).email, "teacher@masterycharter.org");
});

test("rejects authenticated accounts outside the approved staff domain", () => {
  assert.equal(isUploaderAllowed(principal("teacher@example.org")), false);
  assert.throws(() => requireUploader(requestFor("teacher@example.org")), /approved Mastery staff/);
});
