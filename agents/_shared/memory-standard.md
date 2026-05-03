# Memory Standard

All agent state lives in files. Agents must read files before acting and write results to files after acting. Conversation history is not reliable state — it is ephemeral context.

---

## 1. Source of Truth Map

| File / Path | Owner | What It Contains |
|---|---|---|
| `memory/portfolio.json` | NEXUS | All projects, gates, scores, stages |
| `memory/agent-status.json` | loop.js + all agents | Live agent states (status, task, progress, lastRun) |
| `memory/task-queue.json` | loop.js | Pending / running / completed / failed tasks |
| `memory/founder-actions.json` | NEXUS | Open founder directives and decisions |
| `memory/traction.json` | BEACON / ORACLE | Metrics, downloads, engagement data |
| `memory/economics.json` | NEXUS / ORACLE | Revenue, cost, MRR targets |
| `memory/safety-events.json` | Safety system (read-only for agents) | All governor blocks and approvals |
| `memory/system-usage.json` | Budget guard (read-only for agents) | Token and cost usage by day/agent |
| `memory/batch-queue.json` | loop.js / batch scripts | Async batch task lifecycle |
| `memory/conversations/<agentId>.log` | Each agent | Activity log (append-only) |
| `reports/<agent>/` | Each agent | Generated reports, analyses, checklists |
| `projects/<project>/` | EXECUTE agents | Source code, assets, docs, tests |

---

## 2. Read Protocol

**Always read relevant memory before acting.**

Minimum reads at task start:

| Agent type | Must read |
|---|---|
| All agents | `memory/agent-status.json` — check for in-progress work on this task |
| NEXUS | `portfolio.json`, `task-queue.json`, `founder-actions.json` |
| EXECUTE agents | `portfolio.json` (project stage and gate status) |
| VERIFIER agents | `portfolio.json` (gate status), `task-queue.json` (what triggered this gate) |
| STRATEGY agents | `portfolio.json`, `founder-actions.json` |
| GROWTH agents | `traction.json`, `economics.json` |
| RELAY | `traction.json`, `founder-actions.json` |

Do not answer a question about project state from memory alone — read the file.

---

## 3. Write Protocol

**Write results to the appropriate file after every meaningful action.**

| Output type | Write to |
|---|---|
| Agent status change | `memory/agent-status.json` via `update_agent_status` tool |
| Project gate update | `memory/portfolio.json` via `update_gate` tool |
| Project field update | `memory/portfolio.json` via `update_project` tool |
| New task | `memory/task-queue.json` via `enqueue_task` tool |
| Traction/economics update | `memory/traction.json` or `memory/economics.json` via `write_memory` tool |
| Activity log entry | `memory/conversations/<agentId>.log` via `log_event` tool |
| QA checklist | `reports/sentinel/<project>-qa-checklist.md` via `write_file` tool |
| Compliance report | `reports/warden/<project>-compliance-report.md` via `write_file` tool |
| Market analysis | `reports/<agent>/<project>-<topic>.md` via `write_file` tool |
| Code / assets | `projects/<project>/...` via `write_file` tool |

---

## 4. Memory Write Rules

**Structured JSON only** for all `memory/*.json` writes. Never write:
- Free-form text into a JSON field that expects a typed value.
- Arrays into fields that expect objects (and vice versa).
- Null values into required fields.

**No secrets.** Memory files must never contain:
- API keys, tokens, JWTs, passwords, database connection strings.
- Personal identifying information beyond what the project legitimately requires.

**No huge raw logs.** If a tool output is more than ~2KB:
- Summarize it and write the summary to `memory/`.
- Write the full output to `reports/<agent>/`.

**Append, don't replace, for logs.** `memory/conversations/<agentId>.log` is append-only. Never truncate or overwrite it.

---

## 5. Protected Files

These files must never be written to directly by agents:

| File | Why |
|---|---|
| `memory/safety-events.json` | Owned by the safety logger — append-only audit trail |
| `memory/system-usage.json` | Owned by the budget guard — tamper would corrupt cost tracking |

Attempting to write these via `write_memory` is blocked by `executeTool`. Attempting to write them via `write_file` is blocked by the file scope guard.

---

## 6. Report File Conventions

Long-form outputs go in `reports/`. Naming convention:

```
reports/<agent>/<project>-<descriptor>-<YYYY-MM-DD>.md
```

Examples:
```
reports/sentinel/careloop-qa-checklist-2026-05-03.md
reports/warden/careloop-compliance-report-2026-05-03.md
reports/beacon/careloop-aso-copy-2026-05-03.md
reports/auditor/careloop-diff-review-sprint2-2026-05-03.md
reports/nexus/skill-proposals.json
```

Reports are written once per task run. They are never overwritten by a subsequent run — a new dated file is created. Archival is the founder's responsibility.

---

## 7. Agent Status Lifecycle

Every agent must update its status at these points:

| Event | Status | Fields to set |
|---|---|---|
| Task picked up | `active` | `task`, `project`, `progress: 0` |
| Meaningful progress | `working` | `progress: 10–90` |
| Blocked on dependency | `blocked` | `task` (include what it is blocked on) |
| Task complete | `idle` | `progress: 100`, clear `task` |
| Gate pass | `done` | `progress: 100` |

Use `update_agent_status` tool — not `write_memory` — to set agent status.
