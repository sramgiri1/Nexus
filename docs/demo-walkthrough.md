# NEXUS Demo Walkthrough

## 30-second overview

NEXUS is a governed Agentic OS. The public demo shows how founder intent moves
through contracts, execution, verification gates, evidence, and a final release
decision without requiring API keys, live providers, a database, or private app
code.

## What the demo proves

- NEXUS is more than a prompt-driven agent shell
- execution is contract-driven
- verification gates are evidence-backed
- release stays blocked when evidence is incomplete
- the Command Center can explain the OS visually in a public-safe way

## How to run the zero-key demo

```bash
npm run demo
```

## How to view Command Center

```bash
cd dashboard && npm run build
cd dashboard && npm run test:unit
cd dashboard && npm run test:pages
```

The dashboard is static and uses DemoApp mock data only.

## What each demo artifact represents

- `demo/scenarios/demoapp-sprint.json` — the end-to-end showcase scenario
- `demo/contracts/*.json` — typed contract examples for execution, verification,
  and release
- `demo/reports/*.json` — evidence-backed gate outputs and blocked release
  decision
- `docs/architecture/DEMO_SHOWCASE_MODE.md` — the architecture note for the
  public showcase surface

## How gates work

- `AUDITOR` shows code-quality evidence
- `SENTINEL` represents QA and runtime validation
- `WARDEN` represents compliance and privacy review

The demo keeps release blocked until the required `SENTINEL` macOS and Xcode
evidence exists.

## Why release is evidence-based

NEXUS does not allow a fake GO. A release decision is supported by gate reports
and contract-linked evidence, not by an agent’s optimistic claim that work is
"done."

## What is mocked or static

- dashboard data
- contracts
- reports
- release decision
- scenario flow
- architecture images

## What is not implemented yet

- live provider calls
- runtime dispatch enforcement
- real Xcode execution
- API server
- DB-backed state
- replay mode

## How this maps to future real execution

The demo mirrors the eventual operating flow:

Founder intent
→ contract creation
→ capability-scoped execution
→ verification gates
→ evidence lineage
→ release decision
→ Command Center visibility

Future runtime integration will replace mock inputs with live traces, runtime
artifacts, approvals, and durable state while preserving the same governed OS
story.

## Public safety note

This demo uses `DemoApp` only. It does not include private product ideas,
customer data, secrets, or real provider keys.

## Validation commands

```bash
npm run demo
npm run check:demo-showcase
npm run check:public-safety
cd dashboard && npm run build
cd dashboard && npm run test:unit
cd dashboard && npm run test:pages
```
