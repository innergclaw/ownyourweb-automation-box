import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";
const TEMPLATE_URI = "ui://widget/ownyourweb-automation-v1.html";
const WIDGET_HTML = readFileSync(new URL("./public/automation-widget.html", import.meta.url), "utf8");

const defaultSystemInput = {
  businessName: "Studio Nova Creative",
  ownerName: "Nas",
  niche: "brand identity and launch graphics for local founders",
  contactMethod: "Instagram DM or inquiry form",
  positioning:
    "We help service-based creators turn scattered ideas into clean visual systems, launch-ready assets, and repeatable client workflows.",
  offers: [
    {
      type: "Package",
      name: "Brand Starter Kit",
      price: "$350",
      notes: "Logo direction, color palette, typography, and starter social assets.",
    },
    {
      type: "Package",
      name: "Launch Identity System",
      price: "$850",
      notes: "Full brand identity system with launch-ready graphics and organized handoff.",
    },
    {
      type: "Service",
      name: "Client Folder Automation Setup",
      price: "$150",
      notes: "A clean local folder structure and project checklist for repeat client work.",
    },
  ],
  timeline: "5 to 14 business days",
  deliverables:
    "Logo suite, color palette, typography guide, social media templates, launch graphics, client-ready file handoff, and project folder organization.",
  firstStep: "Inquiry review and fit check",
  paymentPolicy: "50% deposit to book, balance due before final files",
  revisionPolicy: "Two revision rounds included",
  folderRoot: "$HOME/Creative Clients",
  workflowStages: "Inquiry, Proposal, Deposit, Discovery, Design, Revision, Approval, Handoff, Follow-up",
};

const offerSchema = z.object({
  type: z.enum(["Service", "Package"]).default("Service"),
  name: z.string().default(""),
  price: z.string().default(""),
  notes: z.string().default(""),
});

const systemInputSchema = {
  businessName: z.string().min(1).default(defaultSystemInput.businessName),
  ownerName: z.string().default(defaultSystemInput.ownerName),
  niche: z.string().default(defaultSystemInput.niche),
  contactMethod: z.string().default(defaultSystemInput.contactMethod),
  positioning: z.string().default(defaultSystemInput.positioning),
  offers: z.array(offerSchema).default(defaultSystemInput.offers),
  timeline: z.string().default(defaultSystemInput.timeline),
  deliverables: z.string().default(defaultSystemInput.deliverables),
  firstStep: z.string().default(defaultSystemInput.firstStep),
  paymentPolicy: z.string().default(defaultSystemInput.paymentPolicy),
  revisionPolicy: z.string().default(defaultSystemInput.revisionPolicy),
  folderRoot: z.string().default(defaultSystemInput.folderRoot),
  workflowStages: z.string().default(defaultSystemInput.workflowStages),
};

const generatedOutputSchema = {
  input: z.object(systemInputSchema),
  websiteCopy: z.string(),
  dashboardCopy: z.string(),
  folderScript: z.string(),
  stateVersion: z.number().int(),
};

let stateVersion = 1;

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeFolderName(value) {
  return (
    value
      .replace(/[^a-z0-9\s-_]/gi, "")
      .trim()
      .replace(/\s+/g, "_") || "Creative_Business"
  );
}

function normalizeInput(input = {}) {
  const merged = {
    ...defaultSystemInput,
    ...input,
    offers: Array.isArray(input.offers) && input.offers.length ? input.offers : defaultSystemInput.offers,
  };

  return {
    ...merged,
    offers: merged.offers
      .map((offer) => ({
        type: offer.type === "Package" ? "Package" : "Service",
        name: String(offer.name ?? "").trim(),
        price: String(offer.price ?? "").trim(),
        notes: String(offer.notes ?? "").trim(),
      }))
      .filter((offer) => offer.name || offer.price || offer.notes),
  };
}

function formatOffer(offer, index) {
  const price = offer.price ? ` - ${offer.price}` : "";
  const notes = offer.notes ? `\n   ${offer.notes}` : "";
  return `${index + 1}. [${offer.type}] ${offer.name || "Untitled offer"}${price}${notes}`;
}

function generateSystem(rawInput) {
  const input = normalizeInput(rawInput);
  const stages = splitList(input.workflowStages);
  const safeBusiness = sanitizeFolderName(input.businessName);
  const folders = [
    "01_Admin",
    "02_Client_Intake",
    "03_Strategy",
    "04_Design_Working_Files",
    "05_Review_Exports",
    "06_Final_Deliverables",
    "07_Invoices_Receipts",
    "08_Testimonial_Follow_Up",
  ];

  const websiteCopy = `${input.businessName}
Curated by SHOPNASGFX under the OWNYOURWEB ecosystem

For ${input.niche}

${input.positioning}

Services and Packages
${input.offers.map(formatOffer).join("\n")}

What clients receive
${input.deliverables}

Project timeline
Most projects are completed within ${input.timeline}, depending on scope, feedback speed, and final approval.

How to start
Step 1: ${input.firstStep}
Step 2: Submit details through ${input.contactMethod}
Step 3: Review the proposal, approve scope, and book the project
Step 4: Complete onboarding so creative work begins with clarity

Policies
Payment: ${input.paymentPolicy}
Revisions: ${input.revisionPolicy}

Client flow
${stages.map((stage, index) => `${index + 1}. ${stage}`).join("\n")}`;

  const dashboardCopy = `Client Dashboard Template
Business: ${input.businessName}
Owner: ${input.ownerName}
Primary niche: ${input.niche}

Client Record
- Client name:
- Business name:
- Email:
- Phone or social handle:
- Selected service/package:
- Project investment:
- Start date:
- Target delivery date:
- Deposit status:
- Final payment status:

Project Stages
${stages.map((stage) => `- [ ] ${stage}`).join("\n")}

Offer Menu
${input.offers
  .map((offer) => `- [ ] ${offer.type}: ${offer.name || "Untitled offer"}${offer.price ? ` (${offer.price})` : ""}`)
  .join("\n")}

Onboarding Checklist
- [ ] Confirm project fit
- [ ] Send proposal
- [ ] Collect deposit
- [ ] Create project folder
- [ ] Collect brand questionnaire
- [ ] Collect inspiration and assets
- [ ] Confirm timeline
- [ ] Schedule review points`;

  const folderScript = `# macOS / Linux folder setup
CLIENT_NAME="New Client"
PROJECT_NAME="${safeBusiness}_Project"
ROOT="${input.folderRoot}"
PROJECT_PATH="$ROOT/$CLIENT_NAME/$PROJECT_NAME"

mkdir -p "$PROJECT_PATH"
${folders.map((folder) => `mkdir -p "$PROJECT_PATH/${folder}"`).join("\n")}

echo "Client project system created at: $PROJECT_PATH"`;

  return {
    input,
    websiteCopy,
    dashboardCopy,
    folderScript,
    stateVersion: stateVersion++,
  };
}

function createAutomationServer() {
  const server = new McpServer({ name: "ownyourweb-automation-box", version: "0.1.0" });

  registerAppResource(server, "ownyourweb-automation-widget", TEMPLATE_URI, {}, async () => ({
    contents: [
      {
        uri: TEMPLATE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: WIDGET_HTML,
        _meta: {
          ui: {
            prefersBorder: true,
            csp: {
              connectDomains: [],
              resourceDomains: [],
            },
          },
          "openai/widgetDescription":
            "Interactive OWNYOURWEB Automation Box for generating creative business website copy, client dashboards, and local folder scripts.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetCSP": {
            connect_domains: [],
            resource_domains: [],
            redirect_domains: [
              "https://www.youtube.com",
              "https://youtube.com",
              "https://github.com",
              "https://ownyourweb.xyz",
            ],
          },
        },
      },
    ],
  }));

  registerAppTool(
    server,
    "generate_creator_system",
    {
      title: "Generate creator system",
      description:
        "Use this when a designer, creative, or service creator wants website copy, a client dashboard, and local folder automation scripts generated from business details and service pricing.",
      inputSchema: systemInputSchema,
      outputSchema: generatedOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        ui: { visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Generating the creator system...",
        "openai/toolInvocation/invoked": "Creator system generated.",
      },
    },
    async (args) => {
      const structuredContent = generateSystem(args);
      return {
        structuredContent,
        content: [
          {
            type: "text",
            text: `Generated an OWNYOURWEB system for ${structuredContent.input.businessName}.`,
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "render_automation_box",
    {
      title: "Render automation box",
      description:
        "Use this when the user wants the interactive OWNYOURWEB Automation Box widget displayed in ChatGPT. It can render with provided business details or demo defaults.",
      inputSchema: systemInputSchema,
      outputSchema: generatedOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        ui: { resourceUri: TEMPLATE_URI },
        "openai/outputTemplate": TEMPLATE_URI,
        "openai/toolInvocation/invoking": "Opening the automation box...",
        "openai/toolInvocation/invoked": "Automation box ready.",
      },
    },
    async (args) => {
      const structuredContent = generateSystem(args);
      return {
        structuredContent,
        content: [
          {
            type: "text",
            text: `Opening the OWNYOURWEB Automation Box for ${structuredContent.input.businessName}.`,
          },
        ],
      };
    },
  );

  return server;
}

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(`OWNYOURWEB MCP server listening. Connect ChatGPT to http://localhost:${PORT}${MCP_PATH}`);
    return;
  }

  const mcpMethods = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && mcpMethods.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createAutomationServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(PORT, () => {
  console.log(`OWNYOURWEB MCP server listening on http://localhost:${PORT}${MCP_PATH}`);
});
