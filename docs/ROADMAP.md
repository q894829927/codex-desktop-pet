# Codex Desktop Pet Roadmap

This document tracks active implementation sequencing. Durable project-wide constraints stay in `AGENTS.md`.

## V0.1 — Desktop Pet Shell

Status: implemented in repository source.

Scope:

- Electron + React + TypeScript + Vite skeleton
- Transparent frameless always-on-top window
- Q-version pet asset
- Drag handle and persisted position
- Safe fallback when saved position is off-screen
- Tray show / hide / quit
- Idle / focus / rest presentation states
- Click speech bubble
- Settings shell
- Packaged-app launch-at-login hook
- Chat panel with local placeholder provider

Acceptance checks:

- `npm run build` succeeds
- `npm run dev` opens a transparent window
- dragging then restarting restores the window location
- tray hide / restore works
- always-on-top can be toggled
- clicking the pet changes speech text
- chat input produces a local placeholder reply

## V0.2 — Real Codex Provider

Goals:

- introduce a main-process provider interface
- configure credentials without exposing them to the renderer
- stream assistant output over narrow IPC events
- define cancellation and timeout behavior
- add explicit error / offline states

Non-goal: arbitrary shell execution.

## V0.3 — Developer Context

Goals:

- user-selected project folder
- read-only Git status / diff context first
- explicit permission boundary for file writes
- commit-message assistance
- compact context indicator in the pet UI

## V0.4 — Pet Animation

Goals:

- transparent multi-frame / sprite animation pipeline
- idle variants
- thinking / success / error / rest reactions
- animation state driven by assistant lifecycle rather than hard-coded text parsing

## V0.5 — Distribution

Goals:

- Windows installer
- reliable launch-at-login
- signed build strategy
- auto-update design
- release CI
