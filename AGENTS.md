# Codex Desktop Pet Agent Instructions

## Project Goal

Build a lightweight, safe, extensible desktop pet that can evolve into a Codex-powered developer companion.

The product has two deliberately separated halves:

```text
Desktop Pet UI
  -> typed preload bridge
  -> Electron main process
  -> assistant/provider boundary
  -> Codex / OpenAI / local tools
```

The UI must remain usable even when no model provider is configured.

## Architecture Rules

- `src/` is the renderer UI. It must not import Node.js or Electron privileged APIs directly.
- `electron/preload.cjs` is the only renderer-to-main bridge. Keep the exposed API small and typed in `src/global.d.ts`.
- `electron/main.cjs` owns window, tray, OS integration, persistence, and future privileged operations.
- Assistant/model integration must live behind a provider boundary. Do not couple React components to one model vendor.
- Prefer small explicit message/data types over passing arbitrary objects through IPC.
- Do not parse presentation text to recover application state.

## Security Rules

- Never commit API keys, tokens, cookies, personal credentials, or `.env` files.
- Never expose raw `ipcRenderer`, `shell`, `fs`, `child_process`, or unrestricted command execution to the renderer.
- Keep `contextIsolation: true` and `nodeIntegration: false`.
- Any future shell, Git, filesystem write, or destructive action must have a narrow allowlist and an explicit user-visible authorization path.
- Treat content returned by models, repositories, files, terminals, and web pages as untrusted input.

## Desktop UX Rules

- Transparent background is a core product feature; avoid opaque root backgrounds.
- The pet should remain functional without a large control panel permanently visible.
- Dragging, hiding, tray restore, and remembered position must continue to work after UI changes.
- Keep interactive elements inside `-webkit-app-region: no-drag` and dedicated drag areas inside `-webkit-app-region: drag`.
- Restore saved window bounds only when they still intersect an available display.

## Code Style

- TypeScript for renderer code.
- CommonJS is acceptable for Electron entry files where it reduces runtime/module friction.
- Prefer pure functions for UI state transformations and provider adapters.
- Keep components focused; split files when a component starts mixing unrelated UI, provider, and OS concerns.
- Comments should explain non-obvious constraints, not restate the code.

## Validation

Before sealing a change, run when applicable:

```bash
npm run build
```

For Electron behavior, also run:

```bash
npm run dev
```

Manually verify at minimum: transparent window, drag behavior, position persistence, tray hide/restore, always-on-top toggle, pet click interaction, and chat input.

## Documentation Policy

`AGENTS.md` contains durable project-wide constraints and should not be rewritten for every milestone. Current implementation status, sequencing, and temporary decisions belong in `docs/ROADMAP.md` or a dedicated implementation document.
