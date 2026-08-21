# Mastery MTSS Dashboard

Secure admin/staff dashboard prototype for Mastery Charter's MTSS workflow.

## Included

- `index.html` - MTSS dashboard prototype with fictional demo records and Microsoft Entra staff sign-in gate
- `security-preview.html` - Microsoft Entra sign-in and protected workspace preview
- `staticwebapp.config.json` - Azure Static Web Apps authenticated-route configuration
- `microsoft_entra_setup.md` - deployment and security setup notes
- `.github/workflows/mastery-mtss-azure.yml` - GitHub-to-Azure deployment workflow

## Data and security boundary

This repository contains prototype UI only. It must not contain live student names,
student IDs, assessment scores, IEP information, passwords, tokens, or other
confidential school data.

Live records belong in the approved Mastery SharePoint site or Dataverse environment.
The production application must enforce Microsoft Entra authentication, approved
security-group membership, and data-source permissions before displaying live records.

## Hosting boundary

GitHub Pages can publish the visual prototype, but it cannot enforce the protected
`/.auth` routes used by this dashboard. The live staff workspace should run on Azure
Static Web Apps, with this repository acting as the source and deployment trigger.
The workflow requires a GitHub secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`.

## Local preview

Open `index.html` or `security-preview.html` in a browser for the fictional-data demo.
The local sign-in behavior is simulated. The hosted sign-in button redirects to
Microsoft Entra ID only after the site is deployed to Azure Static Web Apps or another
approved authenticated hosting environment.

## Intended next step

Use this repository as the visual and interaction reference while building the secure
Power Apps Canvas app connected to the private Mastery SharePoint lists.
