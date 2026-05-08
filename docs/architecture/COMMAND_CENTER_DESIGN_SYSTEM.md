# Command Center Design System

**Version:** 1.0
**Date:** 2026-05-08
**Branch:** design/command-center-premium-os-shell

---

## Purpose

Define the visual language for the NEXUS Command Center so the surface reads
as a serious enterprise Agentic OS rather than a prototype scaffold.

P33.5-LOCAL is visual/layout only — no runtime behavior, API wiring, or
mutation surface was added.

---

## Design Tokens

All tokens live in the `:root` block in `dashboard/src/styles.css`.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#050d18` | Page background |
| `--bg-2` | `#0b1422` | Panel background |
| `--panel` | `rgba(10,19,33,0.86)` | Panel fill |
| `--panel-border` | `rgba(112,146,208,0.16)` | Default border |
| `--text` | `#edf4ff` | Primary text |
| `--text-soft` | `#b9c8e2` | Secondary text |
| `--text-dim` | `#8193b6` | Muted text |
| `--text-faint` | `#607394` | Disabled/label text |
| `--blue` | `#78b8ff` | Active / information |
| `--green` | `#4ce1bc` | Pass / done / GO |
| `--amber` | `#f4bf75` | Working / pending |
| `--red` | `#ff7f96` | Blocked / NO-GO / fail |
| `--purple` | `#b799ff` | Cost / batch |
| `--teal` | `#74e2dd` | Gradient accent |

---

## Shell Structure

```
studio-app
  nav-rail                    ← Left icon rail (App.jsx)
  studio-shell
    shell-topbar--command-lite ← NEXUS Command Center heading + chips
    shell-main--full
      shell-content
        CommandCenter
          command-prototype
            command-prototype__layout
              command-prototype__sidebar   ← sticky left nav
              command-prototype__content   ← scrollable main area
```

---

## P33.5 Premium Shell Components

### Mode Banner (`.os-mode-banner`)

Pinned at the top of `command-prototype__content`. Shows the current NEXUS
mode (`local-private`) with a pulsing green indicator. Always reads:

```
● MODE  local-private  ·  Read-only snapshot  ·  No live API  ·  No mutations
```

The indicator animates via `@keyframes os-pulse`. The banner is display:flex
so it wraps gracefully on narrow viewports.

### OS Pipeline Strip (`.os-pipeline`)

Horizontal scrollable strip inside the Mission Control hero. Renders each
phase of the OS execution chain with a status node and a connector arrow.

Phases and their statuses:
| Phase | Status |
|---|---|
| Founder Intent | done |
| NEXUS Decision | done |
| SHEPHERD Plan | done |
| Execution | active |
| Verification | working |
| Release GO | blocked |

Status maps to a color: done=green, active=blue, working=amber, blocked=red.

### Sidebar Mode Badge (`.command-prototype__sidebar-mode`)

Compact pill below the sidebar copy. Shows the active mode with a green dot.

### Agent Utilization Bars (`.agent-util-bar`)

3px progress bar at the bottom of every agent card in the Agent Fleet section.
Width is driven by `agent.progress` (0–100). Color maps to `agent.status`.

### Task Stat Row (`.task-stat-row`)

Five chip counters above the task queue table: Running · Blocked · Pending ·
Completed · Release-blocking. Counts are derived from the static `TASK_ROWS`
data constant — no live API.

### GO/NO-GO Panel (`.go-no-go`)

Two-column card pair at the top of the Release Control section. Left card
shows the GO condition (all 3 gates PASS + approval evidence). Right card
shows the current status (NO-GO, SENTINEL pending). Color is always derived
from the structural state: GO=green, NO-GO=red. This replaces narrative text
with a scannable decision surface.

### Cost Provider Breakdown (`.cost-provider-table`)

Provider rows below the batch/cost summary. Each row has the provider name,
routing type (realtime/fallback), dollar amount, and a proportional bar.
Data is from the static `COST_PROVIDERS` constant.

---

## Navigation

`NAV_SECTIONS` in `CommandCenter.jsx` drives the sidebar nav. The "Agents"
entry was renamed to "Agent Fleet" in P33.5.

All section IDs remain unchanged from P32/P33 so existing E2E anchors
continue to work. The new `id="cost"` wrapper was moved from a `strong` tag
to the outer section div.

---

## What was NOT changed

- All runtime behavior from P32 (private validation) and P33 (action bridge)
  is unchanged
- No API, DB, provider calls, or mutations were added
- No `onClick` mutation handlers were introduced
- All existing E2E assertions remain valid; six new assertions were added

---

## CSS file

All P33.5 additions are in `dashboard/src/styles.css` after the
`.command-prototype__check-row` block, under the comment
`P33.5 Premium OS Shell`.

---

## Next phase

Wire the GO/NO-GO panel to the live release contract decision field once the
action execution bridge (post-P33) dispatches a real release verification.
