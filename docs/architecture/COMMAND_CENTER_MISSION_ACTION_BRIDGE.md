# Command Center Mission Action Bridge

## Purpose

Wire the Generate Plan button in the Command Center UI to the mission composer via a governed local HTTP bridge. No direct file writes from the browser.

## Flow

```
UI (Generate Plan button)
  → fetch POST http://127.0.0.1:3748/actions/mission/compose
  → mission-action-server.js (node:http, localhost only)
  → missionActionBridge.js (createMissionActionRequest → runMissionActionRequest)
  → action-bridge/actionStore.js (appendAction → local-state/runtime/actions.jsonl)
  → mission-composer/missionComposer.js (runMissionComposer)
  → contracts/missions/ (contract + task plan files)
  → local-state/runtime/ (evidence, audit, events)
  → structured response → UI state update
```

## Why Browser Cannot Write Files Directly

Browsers have no filesystem access by design. The governance boundary requires all writes to be guarded by `assertWritePathAllowed`, `assertNoSecretLikeContent`, and `assertNoPrivateProjectReference`. These run server-side only.

## Local-Only Constraint

- Server binds to `127.0.0.1:3748` — never `0.0.0.0`
- CORS allows `http://localhost:5173` only
- `NEXUS_MODE=local-private` required

## Disabled States

- Bridge offline: Generate Plan button is disabled, offline status shown
- Empty missionText: Generate Plan button disabled

## Future

- Start Governed Run: implementation task bridge (not yet wired)
- Create Project Brief: backend validation action (not yet wired)
- Real-time action status polling via `/actions/:actionId`
