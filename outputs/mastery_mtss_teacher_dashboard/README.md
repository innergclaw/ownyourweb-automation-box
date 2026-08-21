# Mastery MTSS Dashboard

Microsoft-authenticated staff workspace for Mastery Charter's MTSS review and student progress workflow.

## Current operational scope

- Microsoft Entra sign-in through Azure Static Web Apps
- Approved-staff CSV, CVC, and XLSX uploads, limited to 8 MB and 10,000 rows
- Automatic matching for student identity, grade, assessment, MAP RIT, growth goal, attendance, GPA, credits, MTSS, IEP, Firefly, and intervention fields
- Multi-sheet PSSA parsing with Student ID matching, name and Unique Matching ID verification, and subject-specific teacher records
- Preservation of every original source column alongside normalized dashboard fields
- Validation and a ten-row preview; clean files sync automatically while conflicts pause for review
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
| `DATA_UPLOAD_ALLOWED_DOMAINS` | Comma-separated staff email domains. Defaults to `masterycharter.org` for this deployment |

The deployment workflow publishes the static dashboard and the managed Azure Functions API. The API runtime is Node 22.

## Dataset format

Start with [`sample-data/mastery_mtss_upload_template.csv`](sample-data/mastery_mtss_upload_template.csv). Each row requires a student ID and either a full student name or first and last name. Assessment fields are optional, but the uploader warns when no score field is detected.

PSSA workbooks can contain separate ELA and Math worksheets. The importer reads every sheet, normalizes `E` to Reading and `M` to Math, and keeps scale score, performance, tested year, teacher of record, DRC Student ID, Unique Matching ID, PAsecureID, raw scores, reporting categories, anchors, strength profiles, accommodations, and all other source columns with the assessment record.

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
