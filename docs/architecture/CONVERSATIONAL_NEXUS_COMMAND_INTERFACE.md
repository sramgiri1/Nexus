# Conversational NEXUS Command Interface

## Purpose

P62 adds a preview-only command interface for simple operator intent. An operator
can ask NEXUS to Plan, Review, QA, Fix, Ship, Guard, Freeze, Explain, or open a
Command Center page without needing to know internal scripts or phase names.

The interface is intentionally route-first. It classifies intent, resolves scope,
detects selected project context, maps the command to a governed preview route,
shows risk and approval posture, and records redacted command timeline entries.
It does not execute workers, tools, providers, database writes, source mutation,
or release/deploy actions.

## Command Intent Model

Command intents are represented by `command-interface/commandIntentSchema.js`.
Each intent includes:

- Command text normalized for local deterministic classification.
- Intent type and action type.
- Scope: `portfolio`, `project`, or `os`.
- Selected project reference when required.
- Risk level.
- Preview status and blocked reason.
- Safety flags proving execution, provider calls, tools, workers, project
  mutation, release execution, and DB writes are disabled.

Supported intent types are:

- `plan_mission`
- `review_plan`
- `run_quality_gate_preview`
- `prepare_fix_preview`
- `prepare_release_preview`
- `guard_scope`
- `freeze_scope`
- `explain_status`
- `open_page`
- `unknown`

If a project-scoped command requires a selected project and none is available,
the command is blocked with: `Select or create a project first.`

## Scope And Project Detection

`command-interface/commandScopeResolver.js` resolves whether a command applies
to portfolio, project, or NEXUS OS scope. The project context packet is redacted
and preview-only. Demo data is not used as a fallback in the full Command
Center; local-private UX should show a selected private project or a no-project
state.

## Operator Command Routing

`command-interface/commandRouter.js` maps intents to governed preview routes.
Routes include:

- Plan Mission: Mission Control planning preview.
- Review Work: Agent Workbench review context.
- Run QA Gate: validation/test center readiness preview.
- Propose Fix: controlled implementation readiness preview.
- Prepare Ship: release control readiness preview.
- Guard Scope: safety boundary preview.
- Freeze Workspace: blocked until runtime lock controls exist.
- Explain Current State: read-only local state summary.

Routing never bypasses governance. Blocked commands show the missing capability
and the next requirement.

## Approval Preview

`command-interface/commandApprovalPreview.js` classifies command routes into:

- `not_required`
- `recommended`
- `required_before_execution`
- `blocked_until_capability_ready`

Approval preview is evidence for future execution governance. It does not grant
authority and it does not execute anything.

## Command Timeline

`command-interface/commandTimeline.js` and `command-interface/commandStore.js`
define redacted preview timeline records under
`local-state/runtime/commands.jsonl`. Records are append-only local runtime
state and include correlation IDs where available. They are safe summaries, not
raw prompt dumps or secrets.

## Command Center UX

The Command Center presents a conversational command preview surface. It shows:

- Scope and selected project context.
- Intent preview.
- Route target and route status.
- Risk level.
- Approval preview.
- Blocked reason and next action.
- Recent timeline entries.

The UX copy is explicit: commands are route-first previews until worker,
provider, and tool execution are enabled by later governed phases.

## Safety Boundaries

P62 does not add:

- Provider dispatch.
- Tool or MCP execution.
- Worker execution.
- DB writes.
- Project source mutation.
- Release or deployment execution.
- New local API or action bridge behavior.

All command-interface modules are deterministic local preview modules.

## Validation

Run:

```bash
npm run check:command-interface
```

The checker validates schema exports, scope packets, route previews, approval
previews, redacted timeline records, Command Center UI copy, OS roadmap status,
and forbidden path boundaries.

## Next Phase

P63 - AI Interaction Snapshot + Granular Recovery Layer.
