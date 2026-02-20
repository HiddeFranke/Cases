# Claude Code – Projectinstructies

## Frontend verificatie met MCP tools

Gebruik **altijd** de beschikbare MCP tools om de frontend visueel te verifiëren, zonder dat dit expliciet gevraagd hoeft te worden. Zet deze tools proactief in wanneer je dat zinvol acht, bijvoorbeeld na het maken van UI-wijzigingen, het oplossen van bugs, of het toevoegen van nieuwe features.

### Workflow

1. **Open een browservenster** via `mcp__chrome-devtools__new_page` of `mcp__playwright__browser_navigate`.
2. **Navigeer naar de lokale dev-server** (standaard `http://localhost:3000` voor dit Next.js project).
3. **Bestuur de browser** via de Playwright MCP tools (`mcp__playwright__*`) voor interacties zoals klikken, formulieren invullen, scrollen, etc.
4. **Inspeceer en debug** via de Chrome DevTools MCP tools (`mcp__chrome-devtools__*`) voor console-errors, netwerkrequests en accessibility snapshots.
5. **Maak screenshots** met `mcp__playwright__browser_take_screenshot` of `mcp__chrome-devtools__take_screenshot` om de visuele staat vast te leggen.

### Wanneer in te zetten

- Na elke wijziging aan UI-componenten, styling of layout.
- Na het oplossen van een frontend-bug.
- Bij het toevoegen van nieuwe pagina's of routes.
- Wanneer je wil controleren of data correct wordt weergegeven.
- Wanneer je twijfelt of iets visueel klopt.

### Dev-server

Het project draait in de `rental-dashboard/` map als een **Next.js** applicatie:

```bash
cd rental-dashboard && npm run dev
```

Standaard beschikbaar op: `http://localhost:3000`

### Voorkeur tools

| Doel | Tool |
|---|---|
| Pagina openen / navigeren | `mcp__playwright__browser_navigate` |
| Klikken / typen / interacties | `mcp__playwright__browser_click`, `mcp__playwright__browser_type` |
| Screenshot maken | `mcp__playwright__browser_take_screenshot` |
| Accessibility snapshot | `mcp__playwright__browser_snapshot` |
| Console-errors bekijken | `mcp__chrome-devtools__list_console_messages` |
| Netwerkrequests inspecteren | `mcp__chrome-devtools__list_network_requests` |
| JavaScript uitvoeren | `mcp__chrome-devtools__evaluate_script` |
