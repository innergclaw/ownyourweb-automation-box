const simDefaultOffers = [
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
];

const simPanels = document.querySelectorAll("[data-screen]");
const simTabButtons = document.querySelectorAll("[data-target]");
const simOfferList = document.querySelector("#sim-offers");
const simOutputs = {
  website: document.querySelector("#sim-website"),
  dashboard: document.querySelector("#sim-dashboard"),
  script: document.querySelector("#sim-script"),
};

function simSplitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function simFieldValue(name) {
  return document.querySelector(`[name="${name}"]`).value.trim();
}

function setSimScreen(target) {
  simPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.screen === target));
  simTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.target === target));
  if (target === "outputs") renderSimOutputs();
}

function simOfferTemplate(offer = { type: "Service", name: "", price: "", notes: "" }) {
  const row = document.createElement("article");
  row.className = "sim-offer";
  row.innerHTML = `
    <div class="offer-inline">
      <label>Type
        <select name="simOfferType">
          <option value="Service">Service</option>
          <option value="Package">Package</option>
        </select>
      </label>
      <label>Price
        <input name="simOfferPrice" placeholder="$250" />
      </label>
    </div>
    <label>Name
      <input name="simOfferName" placeholder="AI workflow audit" />
    </label>
    <label>Details
      <textarea name="simOfferNotes" placeholder="What is included"></textarea>
    </label>
    <button class="remove-sim-offer" type="button">Remove offer</button>
  `;

  row.querySelector('[name="simOfferType"]').value = offer.type || "Service";
  row.querySelector('[name="simOfferName"]').value = offer.name || "";
  row.querySelector('[name="simOfferPrice"]').value = offer.price || "";
  row.querySelector('[name="simOfferNotes"]').value = offer.notes || "";
  row.querySelector(".remove-sim-offer").addEventListener("click", () => {
    if (simOfferList.children.length > 1) {
      row.remove();
      renderSimOutputs();
    }
  });

  row.addEventListener("input", renderSimOutputs);
  row.addEventListener("change", renderSimOutputs);
  return row;
}

function renderSimOffers(offers) {
  simOfferList.replaceChildren(...offers.map((offer) => simOfferTemplate(offer)));
}

function readSimOffers() {
  return Array.from(simOfferList.querySelectorAll(".sim-offer"))
    .map((row) => ({
      type: row.querySelector('[name="simOfferType"]').value,
      name: row.querySelector('[name="simOfferName"]').value.trim(),
      price: row.querySelector('[name="simOfferPrice"]').value.trim(),
      notes: row.querySelector('[name="simOfferNotes"]').value.trim(),
    }))
    .filter((offer) => offer.name || offer.price || offer.notes);
}

function formatSimOffer(offer, index) {
  const price = offer.price ? ` - ${offer.price}` : "";
  const notes = offer.notes ? `\n   ${offer.notes}` : "";
  return `${index + 1}. [${offer.type}] ${offer.name || "Untitled offer"}${price}${notes}`;
}

function simData() {
  return {
    businessName: simFieldValue("businessName"),
    ownerName: simFieldValue("ownerName"),
    niche: simFieldValue("niche"),
    contactMethod: simFieldValue("contactMethod"),
    positioning: simFieldValue("positioning"),
    timeline: simFieldValue("timeline"),
    deliverables: simFieldValue("deliverables"),
    firstStep: simFieldValue("firstStep"),
    paymentPolicy: simFieldValue("paymentPolicy"),
    revisionPolicy: simFieldValue("revisionPolicy"),
    folderRoot: simFieldValue("folderRoot"),
    workflowStages: simFieldValue("workflowStages"),
    offers: readSimOffers(),
  };
}

function generateSimWebsite(data) {
  const offers = data.offers.length ? data.offers : simDefaultOffers;
  const stages = simSplitList(data.workflowStages);
  return `${data.businessName}
Curated by SHOPNASGFX under the OWNYOURWEB ecosystem

For ${data.niche}

${data.positioning}

Services and Packages
${offers.map(formatSimOffer).join("\n")}

What clients receive
${data.deliverables}

Project timeline
Most projects are completed within ${data.timeline}, depending on scope, feedback speed, and final approval.

How to start
Step 1: ${data.firstStep}
Step 2: Submit details through ${data.contactMethod}
Step 3: Review the proposal, approve scope, and book the project
Step 4: Complete onboarding so creative work begins with clarity

Policies
Payment: ${data.paymentPolicy}
Revisions: ${data.revisionPolicy}

Client flow
${stages.map((stage, index) => `${index + 1}. ${stage}`).join("\n")}`;
}

function generateSimDashboard(data) {
  const stages = simSplitList(data.workflowStages);
  const offers = data.offers.length ? data.offers : simDefaultOffers;
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
- [ ] Schedule review points`;
}

function generateSimScript(data) {
  const safeBusiness =
    data.businessName
      .replace(/[^a-z0-9\s-_]/gi, "")
      .trim()
      .replace(/\s+/g, "_") || "Creative_Business";
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
ROOT="${data.folderRoot}"
PROJECT_PATH="$ROOT/$CLIENT_NAME/$PROJECT_NAME"

mkdir -p "$PROJECT_PATH"
${folders.map((folder) => `mkdir -p "$PROJECT_PATH/${folder}"`).join("\n")}

echo "Client project system created at: $PROJECT_PATH"`;
}

function renderSimOutputs() {
  const data = simData();
  simOutputs.website.textContent = generateSimWebsite(data);
  simOutputs.dashboard.textContent = generateSimDashboard(data);
  simOutputs.script.textContent = generateSimScript(data);
}

function updateSimTime() {
  const now = new Date();
  document.querySelector("#sim-time").textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

simTabButtons.forEach((button) => {
  button.addEventListener("click", () => setSimScreen(button.dataset.target));
});

document.querySelector("#sim-add-offer").addEventListener("click", () => {
  simOfferList.append(simOfferTemplate());
  renderSimOutputs();
});

document.querySelector("#sim-generate").addEventListener("click", renderSimOutputs);
document.querySelectorAll("input, textarea").forEach((field) => field.addEventListener("input", renderSimOutputs));
document.querySelectorAll("[data-copy-output]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(`#${button.dataset.copyOutput}`);
    const original = button.textContent;
    const text = target.textContent;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = text;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.append(fallback);
      fallback.select();
      document.execCommand("copy");
      fallback.remove();
    }

    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = original;
    }, 1300);
  });
});

renderSimOffers(simDefaultOffers);
renderSimOutputs();
updateSimTime();
setInterval(updateSimTime, 30000);
