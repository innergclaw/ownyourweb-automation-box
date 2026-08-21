# Mastery MTSS Dashboard

Microsoft-authenticated staff workspace for Mastery Charter's MTSS review and student progress workflow.

## Current operational scope

- Microsoft Entra sign-in through Azure Static Web Apps
- Approved-staff CSV and XLSX uploads, limited to 8 MB and 10,000 rows
- Automatic matching for student identity, grade, assessment, MAP RIT, growth goal, attendance, GPA, credits, MTSS, IEP, Firefly, and intervention fields
- Validation and a ten-row preview before staff confirm an import
- Private raw-file staging, normalized student and assessment records, import history, and audit events
- Live student queue, search, grade/reporting-period filters, assessment summaries, MTSS counts, GPA/credit profiles, and data-completeness indicators from authorized imports
- Rules-based staff assistant workflows that use the currently loaded records without calling an AI model

Azure AI search and lesson generation remain off until their protected server-side service, spending controls, and school-approved policies are connected.

## Required Azure settings

Set these application settings on the Azure Static Web App. Never commit their values.

| Setting | Purpose |
| --- | --- |
| `AZURE_CLIENT_ID` | Microsoft Entra application client ID |
| `AZURE_CLIENT_SECRET` | Microsoft Entra application credential |
| `AZURE_STORAGE_CONNECTION_STRING` | Private Blob and Table storage used by the import API |
| `DATA_UPLOAD_ALLOWED_EMAILS` | Comma-separated Microsoft email addresses approved to use the data API |

The deployment workflow publishes the static dashboard and the managed Azure Functions API. The API runtime is Node 22.

## Dataset format

Start with [`sample-data/mastery_mtss_upload_template.csv`](sample-data/mastery_mtss_upload_template.csv). Each row requires a student ID and either a full student name or first and last name. Assessment fields are optional, but the uploader warns when no score field is detected.

The import API stores:

- Raw source files in the private `mtss-imports` Blob container
- Import metadata in `MtssImports`
- Current student records in `MtssStudents`
- Assessment records in `MtssAssessments`
- Staff actions in `MtssAudit`

## Local verification

Run the API tests from the `api` folder:

```sh
npm install
npm test
npm audit --omit=dev
```

Local authenticated API testing also requires Azurite or an approved development storage account, plus `LOCAL_DEV_AUTH=true` and a matching `DATA_UPLOAD_ALLOWED_EMAILS` value.

## Student privacy boundary

Do not upload real student data until Mastery approves the hosting environment, staff access list, retention policy, incident process, and data-sharing terms. Microsoft sign-in alone is not a FERPA compliance determination. The API independently checks the uploader's email before preview, commit, history, or student access.
