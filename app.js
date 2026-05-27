const defaultData = {
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

const form = document.querySelector("#generator-form");
const accessForm = document.querySelector("#access-form");
const accessEmail = document.querySelector("#access-email");
const accessStatus = document.querySelector("#access-status");
const tabs = document.querySelectorAll("[data-tab]");
const panels = document.querySelectorAll("[data-panel]");
const offerList = document.querySelector("#offer-list");
const outputs = {
  website: document.querySelector("#website-output"),
  dashboard: document.querySelector("#dashboard-output"),
  script: document.querySelector("#script-output"),
};

const leadCaptureEndpoint =
  window.OWNYOURWEB_LEAD_CAPTURE_ENDPOINT ||
  "https://zkyhhoxcrjkhywblzehr.supabase.co/functions/v1/ownyourweb-lead-capture";

function unlockTool(email) {
  if (email) localStorage.setItem("ownyourwebAccessEmail", email);
  document.body.classList.remove("is-locked");
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function saveAccessLead(email) {
  if (!leadCaptureEndpoint) return;

  const response = await fetch(leadCaptureEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      source: "ownyourweb-automation-box",
      page: window.location.href,
      referrer: document.referrer || "",
      createdAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error("Lead capture request failed");
  }
}

const savedAccessEmail = localStorage.getItem("ownyourwebAccessEmail");
if (savedAccessEmail) unlockTool(savedAccessEmail);

accessForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = accessEmail.value.trim();
  const submitButton = accessForm.querySelector('button[type="submit"]');

  if (!validateEmail(email)) {
    accessStatus.textContent = "Enter a valid email to unlock the tool.";
    accessEmail.focus();
    return;
  }

  submitButton.disabled = true;
  accessStatus.textContent = leadCaptureEndpoint ? "Saving access..." : "Access granted. Opening the Automation Box.";

  try {
    await saveAccessLead(email);
    accessStatus.textContent = "Access granted. Opening the Automation Box.";
    unlockTool(email);
  } catch {
    accessStatus.textContent = "Could not save access. Please try again.";
    submitButton.disabled = false;
  }
});

function formData() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.offers = readOffers();
  return data;
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeFolderName(value) {
  return value
    .replace(/[^a-z0-9\s-_]/gi, "")
    .trim()
    .replace(/\s+/g, "_");
}

function offerTemplate(offer = { type: "Service", name: "", price: "", notes: "" }) {
  const row = document.createElement("div");
  row.className = "offer-row";
  row.innerHTML = `
    <label>
      Type
      <select name="offerType">
        <option value="Service">Service</option>
        <option value="Package">Package</option>
      </select>
    </label>
    <label>
      Name
      <input name="offerName" type="text" placeholder="Logo cleanup" />
    </label>
    <label>
      Price
      <input name="offerPrice" type="text" placeholder="$250" />
    </label>
    <label class="offer-notes">
      Details
      <input name="offerNotes" type="text" placeholder="What is included" />
    </label>
    <button class="remove-offer-button" type="button" aria-label="Remove offer">x</button>
  `;

  row.querySelector('[name="offerType"]').value = offer.type || "Service";
  row.querySelector('[name="offerName"]').value = offer.name || "";
  row.querySelector('[name="offerPrice"]').value = offer.price || "";
  row.querySelector('[name="offerNotes"]').value = offer.notes || "";
  row.querySelector(".remove-offer-button").addEventListener("click", () => {
    if (offerList.children.length > 1) row.remove();
  });

  return row;
}

function renderOffers(offers) {
  offerList.replaceChildren(...offers.map((offer) => offerTemplate(offer)));
}

function readOffers() {
  return Array.from(offerList.querySelectorAll(".offer-row"))
    .map((row) => ({
      type: row.querySelector('[name="offerType"]').value,
      name: row.querySelector('[name="offerName"]').value.trim(),
      price: row.querySelector('[name="offerPrice"]').value.trim(),
      notes: row.querySelector('[name="offerNotes"]').value.trim(),
    }))
    .filter((offer) => offer.name || offer.price || offer.notes);
}

function formatOffer(offer, index) {
  const price = offer.price ? ` - ${offer.price}` : "";
  const notes = offer.notes ? `\n   ${offer.notes}` : "";
  return `${index + 1}. [${offer.type}] ${offer.name || "Untitled offer"}${price}${notes}`;
}

function generateWebsite(data) {
  const offers = data.offers.length ? data.offers : defaultData.offers;
  const stages = splitList(data.workflowStages);

  return `${data.businessName}
Curated by SHOPNASGFX under the OWNYOURWEB ecosystem

For ${data.niche}

${data.positioning}

Services and Packages
${offers.map(formatOffer).join("\n")}

What clients receive
${data.deliverables}

Project timeline
Most projects are completed within ${data.timeline}, depending on scope, feedback speed, and final approval.

How to start
Step 1: ${data.firstStep}
Step 2: Submit your details through ${data.contactMethod}
Step 3: Review the proposal, approve the scope, and book your project
Step 4: Complete onboarding so the creative work can begin with clarity

Policies
Payment: ${data.paymentPolicy}
Revisions: ${data.revisionPolicy}

Client flow
${stages.map((stage, index) => `${index + 1}. ${stage}`).join("\n")}`;
}

function generateDashboard(data) {
  const stages = splitList(data.workflowStages);
  const offers = data.offers.length ? data.offers : defaultData.offers;

  return `Client Dashboard Template
Business: ${data.businessName}
Owner: ${data.ownerName}
Primary niche: ${data.niche}

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
${offers.map((offer) => `- [ ] ${offer.type}: ${offer.name || "Untitled offer"}${offer.price ? ` (${offer.price})` : ""}`).join("\n")}

Onboarding Checklist
- [ ] Confirm project fit
- [ ] Send proposal
- [ ] Collect deposit
- [ ] Create project folder
- [ ] Collect brand questionnaire
- [ ] Collect inspiration and assets
- [ ] Confirm timeline
- [ ] Schedule review points

Handoff Checklist
- [ ] Export final files
- [ ] Organize source files
- [ ] Package client-ready files
- [ ] Send usage notes
- [ ] Collect final balance
- [ ] Ask for testimonial
- [ ] Add follow-up date`;
}

function generateScript(data) {
  const safeBusiness = sanitizeFolderName(data.businessName) || "Creative_Business";
  const root = data.folderRoot || "$HOME/Creative Clients";
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

  return `# macOS / Linux folder setup
CLIENT_NAME="New Client"
PROJECT_NAME="${safeBusiness}_Project"
ROOT="${root}"
PROJECT_PATH="$ROOT/$CLIENT_NAME/$PROJECT_NAME"

mkdir -p "$PROJECT_PATH"
${folders.map((folder) => `mkdir -p "$PROJECT_PATH/${folder}"`).join("\n")}

cat > "$PROJECT_PATH/README.txt" <<'README'
Project created by OWNYOURWEB Automation Box.

Use this folder to keep client communication, creative direction, working files, review exports, and final deliverables organized from day one.
README

echo "Client project system created at: $PROJECT_PATH"


# Windows PowerShell version
$ClientName = "New Client"
$ProjectName = "${safeBusiness}_Project"
$Root = "$HOME\\Creative Clients"
$ProjectPath = Join-Path $Root "$ClientName\\$ProjectName"

New-Item -ItemType Directory -Force -Path $ProjectPath | Out-Null
${folders.map((folder) => `New-Item -ItemType Directory -Force -Path (Join-Path $ProjectPath "${folder}") | Out-Null`).join("\n")}

"Project created by OWNYOURWEB Automation Box." | Set-Content (Join-Path $ProjectPath "README.txt")
Write-Output "Client project system created at: $ProjectPath"`;
}

function renderOutputs(data) {
  outputs.website.textContent = generateWebsite(data);
  outputs.dashboard.textContent = generateDashboard(data);
  outputs.script.textContent = generateScript(data);
  document.querySelector("#result-title").textContent = `${data.businessName} system generated`;
}

function setTab(target) {
  tabs.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === target));
  panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === target));
}

tabs.forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.tab));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderOutputs(formData());
  setTab("output");
});

document.querySelector("#reset-demo").addEventListener("click", () => {
  Object.entries(defaultData).forEach(([key, value]) => {
    if (key === "offers") return;
    const field = form.elements.namedItem(key);
    if (field) field.value = value;
  });
  renderOffers(defaultData.offers);
  renderOutputs(defaultData);
});

document.querySelector("#add-offer").addEventListener("click", () => {
  offerList.append(offerTemplate());
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(`#${button.dataset.copy}`);
    await navigator.clipboard.writeText(target.textContent);
    const original = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = original;
    }, 1400);
  });
});

renderOffers(defaultData.offers);
renderOutputs(defaultData);
