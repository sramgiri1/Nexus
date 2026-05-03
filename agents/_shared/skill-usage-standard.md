# Skill Usage Standard

Skills are deterministic execution units — Node.js + shell functions that produce real output from real tools. They are the ground truth of the Nexus verification system.

---

## 1. What Skills Are

A skill is:
- A real executable function registered in `skills/index.js`.
- Invoked via the `run_skill` tool: `{ agent, skill, input }`.
- Always returns `{ result: "PASS" | "FAIL" | "INFO", issues: [], summary: "" }`.
- Not subject to LLM interpretation — the result is what the tool reports.

A skill is not:
- An LLM's assessment of whether something looks correct.
- A checklist the agent self-evaluates.
- Optional when a relevant skill exists.

---

## 2. When Skills Are Mandatory

Use a skill — not LLM judgment — whenever checking:

| Domain | Mandatory Skill |
|---|---|
| Code lint/style | `auditor.code.lint` |
| Static analysis (TODOs, evals, localhost refs) | `auditor.code.static_analysis` |
| Test coverage count | `auditor.code.test_coverage` |
| Diff review / high-risk file detection | `auditor.code.diff_review` |
| iOS simulator install | `sentinel.qa.simulator.run` |
| Test suite execution | `sentinel.qa.tests.execute` |
| Runtime log analysis | `sentinel.qa.logs.analyze` |
| Secret detection in source | `sentinel.qa.security.scan` |
| Privacy policy completeness | `warden.compliance.privacy.check` |
| Info.plist permission keys | `warden.compliance.permissions.validate` |
| App Store copy limits/forbidden claims | `warden.compliance.appstore.check` |
| Queue/system state | `nexus.read.system_state` |
| Sprint phase planning | `orchestrator.flow.plan` |
| Release go/no-go | `nexus.decide.release` |
| Task priority ranking | `nexus.decide.priority` |

---

## 3. Verification Agents — Skills First

AUDITOR, SENTINEL, and WARDEN must call skills before producing any gate result. The gate output is the aggregated skill result — never a subjective assessment.

**AUDITOR gate sequence:**
```
run_skill auditor code.diff_review   → must PASS
run_skill auditor code.lint          → must PASS
run_skill auditor code.static_analysis → must PASS
run_skill auditor code.test_coverage → must PASS (or INFO with explanation)
```

**SENTINEL gate sequence:**
```
run_skill sentinel qa.security.scan  → must PASS
run_skill sentinel qa.simulator.run  → must PASS
run_skill sentinel qa.tests.execute  → must PASS
```

**WARDEN gate sequence:**
```
run_skill warden compliance.privacy.check       → must PASS
run_skill warden compliance.permissions.validate → must PASS
```

A gate is only signed off when all its required skills return PASS. A partial PASS is a FAIL.

---

## 4. Build Agents — Skills by Request Only

EXECUTE agents (CORE, SWIFT, PIXEL, CANVAS, FORGE, STREAM, SYNAPSE) may call informational skills to validate their own work before handoff:
- `auditor.code.lint` — self-lint before handoff
- `auditor.code.static_analysis` — catch obvious issues early

Build agents must not:
- Run SENTINEL or WARDEN skills (those are gated to their owners).
- Interpret a skill FAIL as passing because they disagree.
- Suppress a skill FAIL from the handoff output.

---

## 5. Proposing a New Skill

If no skill exists for a check that should be deterministic, propose one. Do not use LLM judgment as a substitute — mark the task INFO/blocked and file the proposal.

**Skill Proposal Format:**

```json
{
  "proposal": "new_skill",
  "skillName": "<agent>.<category>.<name>",
  "ownerAgent": "<agent>",
  "trigger": "what condition causes this skill to be needed",
  "inputContract": {
    "projectId": "string",
    "additionalField": "type and description"
  },
  "outputContract": {
    "result": "PASS | FAIL | INFO",
    "issues": "[{ severity, file, line, message }]",
    "summary": "string"
  },
  "backing": "shell command or Node.js function that would implement this",
  "safetyRisk": "none | low | medium | high",
  "safetyNotes": "explain any risk if safetyRisk > none"
}
```

Post the proposal to `reports/nexus/skill-proposals.json` and enqueue a task for NEXUS to review.

---

## 6. Skill Output Contract

Every skill — existing and proposed — must return this exact shape:

```json
{
  "result": "PASS",
  "issues": [],
  "summary": "All lint checks passed — 0 errors, 0 warnings."
}
```

```json
{
  "result": "FAIL",
  "issues": [
    { "severity": "error", "file": "src/auth.js", "line": 42, "message": "no-unused-vars: 'token' defined but never used" }
  ],
  "summary": "1 error in src/auth.js. Fix before gate can pass."
}
```

```json
{
  "result": "INFO",
  "issues": [],
  "summary": "Test coverage: 14 test files, 62 test functions. No threshold set — manual review recommended."
}
```

Agents must not alter skill output before including it in task results or handoffs.
