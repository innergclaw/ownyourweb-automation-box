# Mastery MTSS Microsoft Sign-In Setup

The main dashboard now includes a staff sign-in gate. It keeps the local demo usable with fictional records, while a hosted HTTPS deployment redirects staff to Microsoft Entra ID and returns the signed-in identity to the workspace.

## What is already configured

- `index.html` provides the staff sign-in screen, Admin professional and Teacher demo views, hosted Microsoft redirect, session read, and sign out.
- `staticwebapp.config.json` requires the built-in `authenticated` role for every route.
- `.github/workflows/mastery-mtss-azure.yml` deploys this folder from GitHub to Azure Static Web Apps after the Azure deployment token is added to GitHub Actions secrets.
- Unauthenticated hosted users are redirected to `/.auth/login/aad`.
- The page reads the hosted session from `/.auth/me`.
- Sign out uses `/.auth/logout` on the hosted deployment.
- The local and GitHub Pages preview does not request or store passwords.
- Student names and IDs remain fictional or masked in the preview.

## School setup sequence

1. Create an Azure Static Web App in the school-approved Azure subscription.
2. Deploy the contents of this dashboard folder as the app root.
3. Enable Microsoft Entra ID as the authentication provider.
4. Restrict the Entra provider to the Mastery tenant. The preconfigured Azure Static Web Apps Entra provider can allow any Microsoft account unless the tenant restriction is configured.
5. Create security groups such as `MASTERY-MTSS-STAFF` and `MASTERY-MTSS-ADMIN`.
6. Add only approved teachers, instructional staff, and administrators to those groups.
7. Map those groups to application roles using the approved Static Web Apps role-assignment method or a server-side authorization function.
8. Add a server-side authorization check before connecting live student data. Never treat the front-end role selector as a permission boundary.
9. Keep student records in SharePoint or Dataverse; do not place live names, IDs, or scores in HTML or JavaScript.
10. Test sign-in, sign-out, unauthorized access, role separation, and data permissions with test staff accounts.
11. Add the Copilot Studio agent only after the data source and user permissions are approved.

## Important limitation

The current route policy proves that a user is signed in. It does not by itself prove that the user is a Mastery employee, map an Entra security group to a custom application role, or secure a live data API. The school IT team must finish those controls before live student data is added.

## Preview behavior

- Opening the file locally shows a simulated Admin professional or Teacher sign-in transition.
- Hosting it on Azure Static Web Apps activates the Microsoft Entra redirect, session lookup, and sign out.
- GitHub Pages remains a public visual demo only and must contain synthetic data.

## GitHub and Azure connection

1. Create or identify the approved Azure Static Web App and copy its deployment token.
2. In the GitHub repository, add that value as the Actions secret `AZURE_STATIC_WEB_APPS_API_TOKEN`.
3. Merge the dashboard and workflow into `main`, or run the workflow manually from the Actions tab.
4. Configure Microsoft Entra ID and the Mastery tenant on the Azure Static Web App.
5. Give staff the Azure Static Web App URL. That is the protected login URL; the GitHub Pages URL remains a synthetic-data preview.
