# OWNYOURWEB ChatGPT App

ChatGPT Apps SDK scaffold for the OWNYOURWEB Automation Box.

## Shape

- Archetype: `interactive-decoupled`
- Server: `server.js`
- Widget: `public/automation-widget.html`
- MCP endpoint: `http://localhost:8787/mcp`

## Tools

- `render_automation_box`: renders the interactive widget in ChatGPT.
- `generate_creator_system`: generates website copy, client dashboard text, and folder automation scripts from creative business inputs.

## Run locally

```bash
npm install
npm run check
npm start
```

Health check:

```bash
curl http://localhost:8787/
```

## Connect to ChatGPT

Expose the local server over HTTPS:

```bash
ngrok http 8787
```

Then in ChatGPT:

1. Enable Developer Mode in Settings -> Apps & Connectors -> Advanced settings.
2. Create a new app/connector.
3. Paste your tunnel URL with `/mcp`, for example `https://example.ngrok.app/mcp`.
4. Refresh the app after tool or metadata changes.

## Prompt to test

```text
Open the OWNYOURWEB Automation Box and help me build a client onboarding system for my design business.
```
