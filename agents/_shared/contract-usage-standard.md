# Contract Usage Standard

Contracts are the interface between agents. No work moves without a typed contract. Agents are responsible for reading, validating, and honoring the contract they receive, and for producing well-formed contracts when delegating work.

---

## 0. Core Rule

> **No contract, no work.**

If a task arrives without a contract, or with a contract missing required fields, the agent must block and request SHEPHERD or NEXUS to create a valid one. The agent must not improvise missing fields.

---

## 1. Contract Types

| Type | Purpose | When it appears |
| --- | --- | --- |
| **Task Contract** | What a single agent is asked to do | Every task in the queue |
| **Handoff Contract** | Delegation from one agent to another | Cross-agent work delegation |
| **Skill Result** | Output of a deterministic skill execution | After every skill invocation |
| **Verification Contract** | Gate specification and pass criteria | AUDITOR → SENTINEL → WARDEN gates |
| **Release Contract** | GO / NO-GO decision with gate evidence | NEXUS release decision |
| **State Transition** | Proposed state change for state machine validation | Any status update |

Schema files live in `contracts/schemas/`. Validators live in `contracts/validators/`.

---

## 2. Task Contract — What to Read

Every agent must read these fields from its task contract before starting work:

| Field | What to do with it |
| --- | --- |
| `projectId` | Scope all file operations to this project |
| `sourceAgent` | Understand who dispatched this task and why |
| `targetAgent` | Confirm you are the intended recipient — reject if not |
| `taskType` | Determine the execution mode (realtime, batch-eligible, skill-only) |
| `objective` | The single thing you must accomplish |
| `allowedFiles` | The only paths you may write to |
| `forbiddenFiles` | Paths you must not touch under any circumstance |
| `acceptanceCriteria` | The verifiable conditions that define done |
| `requiredSkills` | Skills that must be called to satisfy this task |
| `riskLevel` | Determines whether founder approval is required |
| `blocking` | Whether downstream work is gated on this task |
| `dependsOn` | Tasks that must be complete before this task can run |

---

## 3. Blocking Rules

**Block if `allowedFiles` is empty and the task requires file writes.**

An implementation task without `allowedFiles` has no safe execution scope. Request a corrected contract.

**Block if `acceptanceCriteria` is missing or empty.**

A task without acceptance criteria has no definition of done. The agent cannot verify its own output against undefined criteria.

**Block if `requiredSkills` is missing for a verification task.**

Verification work without required skills listed is prompt-based verification — not allowed. A gate backed by LLM opinion is not a gate.

**Block if `targetAgent` is not this agent.**

A task routed to the wrong agent must be returned, not executed. Forward it to NEXUS for re-routing.

---

## 4. Invalid Contract Output

When a task contract is missing or invalid, return this output:

```json
{
  "status": "BLOCKED",
  "reason": "invalid_or_missing_contract",
  "missingFields": ["acceptanceCriteria", "allowedFiles"],
  "requestedOwner": "shepherd"
}
```

Log the block with `log_event` (level: warn, event: `contract_rejected`) and do not start the work.

---

## 5. Handoff Contract — What to Produce

When delegating to another agent, produce a complete handoff contract. The `contractType` field must match the type of work:

| `contractType` | When to use |
| --- | --- |
| `implementation` | Delegating a build or coding task to an EXECUTE agent |
| `verification` | Delegating gate execution to AUDITOR, SENTINEL, or WARDEN |
| `design` | Delegating design work to PRISM |
| `compliance` | Delegating compliance work to WARDEN |
| `report` | Delegating a report or analysis (may be batch-eligible) |
| `remediation` | Delegating a fix based on a gate failure |
| `release` | Delegating release decision work to NEXUS |

Required handoff fields: `contractType`, `sourceAgent`, `targetAgent`, `projectId`, `objective`, `evidence`, `allowedFiles`, `forbiddenFiles`, `requiredSkills`, `doneCriteria`, `riskLevel`, `blocking`, `parentTaskId`.

A handoff without all required fields will be rejected by the `on_handoff_created` hook.

---

## 6. Verification Contract — What to Produce

Verifier agents (AUDITOR, SENTINEL, WARDEN) must produce a verification contract after completing their gate. The contract is not a summary — it is a typed artifact that the state machine uses to authorize the gate pass.

Required fields: `gate`, `projectId`, `skillsRequired`, `evidenceRequired`, `passCriteria`, `failCriteria`, `blocking`.

The `gate` field must match the verifier: `AUDITOR`, `SENTINEL`, or `WARDEN`.

---

## 7. Release Contract — What NEXUS Produces

When making a GO / NO-GO decision, NEXUS must produce a release contract that references all three gate results.

For a `GO` decision, the release contract must satisfy semantic validation:
- `auditorResult` must be `PASS`
- `sentinelResult` must be `PASS`
- `wardenResult` must be `PASS` or `NOT_REQUIRED`
- `openCriticalSafetyEvents` must be `0`
- `unreconciledBlockingBatchTasks` must be `0`
- `failedBlockingGates` must be `0`
- `evidence` must be non-empty

A release contract that fails validation must not be used to authorize a GO transition.

---

## 8. State Transition Contract — What Not to Assume

A state-transition contract that is schema-valid is not necessarily allowed by the state machine. Schema validation checks shape. The state machine checks meaning.

Example: a contract with `from: running, to: completed, requestedBy: core` is schema-valid but state-machine-blocked — workers cannot self-certify completion.

Always validate transitions against the state machine before acting on them. See [state-machine-standard.md](./state-machine-standard.md).
