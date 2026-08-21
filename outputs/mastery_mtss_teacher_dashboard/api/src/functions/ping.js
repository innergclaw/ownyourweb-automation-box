const { app } = require("@azure/functions");
const { json } = require("../lib/http");

app.http("data-ping", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "ping",
  handler: async () => json(200, { ok: true, service: "mastery-mtss-data-api" }),
});
