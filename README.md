# OWNYOURWEB Automation Box

OWNYOURWEB Automation Box is a simple URL-based business systems generator for graphic designers, creatives, and service-based creators who want to become AI-native in how they run client work.

The tool is curated and powered by SHOPNASGFX under the OWNYOURWEB ecosystem. Its mission is to help creatives stop operating manually and start building smarter digital infrastructure around their business.

## Who It Is For

This tool is for creative service providers who sell design, branding, websites, graphics, content, consulting, or done-for-you creative services.

It helps someone in their first year of business by giving them structure before bad habits stack up. Instead of guessing how to present services, onboard clients, organize files, or track project stages, they can generate a clean starting system from one guided intake.

It also helps someone who has been in business for years by turning repeat manual work into a reusable operating system. If they already have clients, services, and a process, the tool helps package that knowledge into clearer offers, better onboarding, cleaner folders, and more professional client management.

## What It Does

Visitors enter an email to unlock the tool in their browser. The public GitHub Pages version is static and local-first.

After access, users fill out details about their business:

- Business name and owner name
- Creative niche and positioning
- Contact method
- Services and packages with pricing
- Deliverables and timeline
- First client step
- Payment and revision policy
- Local folder location
- Workflow stages

The app generates:

- Website copy for the creator's services, packages, policies, and onboarding process
- A client dashboard template with project tracking and onboarding checklists
- macOS/Linux and Windows PowerShell folder automation scripts

## Why It Helps

Creative businesses often lose time because every new client starts from scratch. Files get scattered, pricing lives in notes, onboarding is inconsistent, and project stages are tracked manually.

OWNYOURWEB Automation Box gives creators a repeatable business foundation:

- Clearer service presentation
- Faster client onboarding
- Better project organization
- Cleaner folder structure
- More professional client experience
- Less repetitive setup work
- More time for creative execution

## Current Build

This is a static URL website with a local-first generator.

Core files:

- `index.html` - landing page, email gate, and generator markup
- `styles.css` - OWNYOURWEB Mono System visual theme
- `app.js` - email access, offer builder, and output generation
- `ios-simulator.html` - browser-based iPhone simulator concept
- `OwnYourWebApp/` - SwiftUI iOS app prototype
- `chatgpt-app/` - experimental ChatGPT Apps SDK scaffold

## Tool Access

Use the live GitHub Pages URL to access the tool:

```text
https://innergclaw.github.io/ownyourweb-automation-box/
```

## Local Preview

Run a simple local server:

```bash
python3 -m http.server 4174
```

Open:

```text
http://localhost:4174/
```

## Brand Theme

The current visual system is `OWNYOURWEB Mono System`:

- Primary ink: `#111827`
- Deep accent: `#020617`
- White: `#ffffff`
- Soft gray: `#d1d5db`
- Muted text: `#6b7280`
- Line gray: `#9ca3af`
- Light border: `#e5e7eb`
- Input surface: `#f6f8fa`

The vibe is minimal, structured, AI-native, and professional for creative operators.
