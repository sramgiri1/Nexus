# NEXUS Mission Composer Architecture

## Purpose

The Mission Composer is the governed entry point for starting a new private-project mission from the Command Center. It transforms a founder-stated goal into a structured, auditable mission contract and task plan without executing any code, making provider calls, or touching the live project.

## Command Center as OS Input Surface

The Command Center provides a read-only mission composer UI. The founder describes what they want to build. The UI displays the mission text and the generated plan, but all buttons are disabled — no mutation happens from the browser. The actual composer runs via CLI.

## User Flow

1. Founder opens the Command Center and sees the Mission Composer section.
2. Founder describes the mission (read-only display in this phase).
3. Founder runs `npm run mission:compose` from the CLI.
4. The composer generates:
   - A mission contract (contracts/missions/)
   - An initial task plan (contracts/missions/)
   - A local task record (local-state/runtime/tasks.json)
   - Evidence, audit, and runtime event records
   - Human-readable reports (reports/)
5. The Command Center surfaces the generated plan in read-only mode.
6. The next governed action is to create a project brief.

## Local Governance

All mission composer actions are governed by policy/mission-composer-policy.json.

- No provider calls
- No network access
- No DB access
- No project mutation
- No build or test execution
- Local task records allowed
- Evidence, audit, and runtime events allowed

Mode required: `local-private` or `test`.

Owner agent: nexus. Planner agent: shepherd.

## No Provider/Network/DB

The mission composer is fully offline. No API endpoints are called. No database is touched. All output is written to local files under `contracts/missions/` and `reports/`.

The CLI script enforces the mode boundary. Running with `NEXUS_MODE=demo` exits with an error.

## Public Safety

- No private project names appear in any generated artifacts.
- All records are redacted at the field level.
- The Command Center UI contains no fetch, XMLHttpRequest, WebSocket, or exec calls.
- Evidence and audit records are append-only under local-state/runtime.

## Next Phase

The next phase after Mission Composer is to generate a governed project brief from the mission contract. This brief feeds the SHEPHERD planning flow and creates the first executable task assignments for AUDITOR, PRISM, SENTINEL, WARDEN, and CORE.
