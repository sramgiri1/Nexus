# Demo and Showcase Mode

## Purpose

Demo mode lets someone understand NEXUS without:

- API keys
- provider calls
- private app code
- private project ideas
- real user data
- live DB
- live runtime execution

## Demo Principles

- zero-key
- public-safe
- deterministic
- evidence-first
- read-only by default
- no private project data
- no provider calls
- no secrets
- no external services
- shows OS flow, not just UI

## Demo Story

Founder intent
→ NEXUS decision
→ SHEPHERD plan
→ CORE and SWIFT sample work
→ AUDITOR, SENTINEL, and WARDEN gates
→ evidence
→ release decision
→ Command Center showcase

The public demo uses `DemoApp` only. The goal is to explain how the operating
system behaves, how evidence is produced, and why release is blocked when the
required gate proof is incomplete.

## Demo Modes

### 1. CLI zero-key demo

- `npm run demo`
- prints scenario summary
- prints agents involved
- prints gates and evidence
- prints GO or NO-GO demo decision
- points to dashboard and docs

### 2. Dashboard showcase

- static Command Center
- DemoApp mock data
- evidence timeline
- gate status
- release control
- no backend calls

### 3. Read-only investor mode

- no mutation
- no secrets
- no private data
- explains NEXUS OS visually

### 4. Replay mode later

- replay traces and evidence from the demo scenario
- not implemented yet

## Demo Surfaces

- `scripts/demo.js`
- `docs/demo-walkthrough.md`
- `demo/scenarios/demoapp-sprint.json`
- `demo/contracts/*.json`
- `demo/reports/*.json`
- static Command Center dashboard

## What the Demo Proves

- NEXUS uses contracts instead of vague handoffs
- agents do not self-certify release readiness
- verification gates require evidence
- release decisions stay blocked when proof is incomplete
- the operator surface can be explained without live APIs or provider calls
- public repo material can stay separated from private product work

## Public Safety Boundary

Demo and showcase mode must stay public-safe:

- use `DemoApp`
- use sample APIs, sample iOS screens, and sample gate reports
- do not use private product ideas
- do not use real customer names
- do not use real personal data
- do not use secrets or keys
- do not rely on private repos or local memory state

See `docs/PUBLIC_REPO_BOUNDARY.md` and `docs/PRIVATE_PROJECT_BOUNDARY.md`.

## Relationship to the Command Center

The Command Center remains static in this phase. Demo mode makes the static UI
easier to narrate by pairing it with:

- a deterministic scenario
- typed demo contracts
- gate reports
- a blocked release decision
- public-safe walkthrough docs

## Future Replay Mode

Future replay mode may render trace and evidence lineage on top of the same
DemoApp scenario so investors or reviewers can step through the operating
system without mutating anything.

## Non-goals

- no live provider calls
- no real API server
- no DB
- no runtime dispatch
- no actual Xcode execution
- no real app build
- no runtime enforcement changes

This phase defines demo/showcase surfaces only.
