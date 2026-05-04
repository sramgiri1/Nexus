# Evidence Standard

Evidence is the artifact that backs a gate decision, state transition, or release. Without evidence, transitions are proposals — not commits. The state machine requires evidence before allowing critical transitions. Gates that lack evidence are opinions, not gates.

---

## 0. Core Rule

> **Agent claims are not evidence.**

An agent saying "lint passed" is a claim. The output of `eslint --format json` written to `reports/auditor/careloop-lint-sprint2-2026-05-04.json` is evidence. Evidence is produced by deterministic skills or real external tools — not by LLM reasoning.

---

## 1. Evidence Types

| Type | Produced by | Used for |
| --- | --- | --- |
| `skill_result` | Any `run_skill` call | Gate passes, task completion |
| `test_result` | SENTINEL `qa.tests.execute` | QA gate, release |
| `lint_result` | AUDITOR `code.lint` | Code gate |
| `static_analysis_result` | AUDITOR `code.static_analysis` | Code gate |
| `simulator_result` | SENTINEL `qa.simulator.run` | QA gate |
| `xcresult` | xcodebuild test output | QA gate, release |
| `log_artifact` | `xcrun simctl log stream` | Debugging, QA |
| `screenshot_artifact` | UI test screenshot | QA supplementary |
| `crash_log` | Simulator crash log | Bug report |
| `model_result` | LLM output (non-gate) | Reports, drafts |
| `batch_result` | Reconciled batch output | Reports only — not gates |
| `approval_result` | Founder approval event | Approval gates, waivers |
| `release_contract` | NEXUS `decide.release` skill | Release GO/NO-GO |

---

## 2. What Evidence Is Not

- A chat message from an agent
- A summary written by an LLM without tool backing
- A claim that a skill passed without the skill output
- A batch result used as a gate pass
- A screenshot taken manually outside a test run

---

## 3. Evidence Attachment Rules

**Evidence must be linked to taskId, projectId, and agentId when possible.** This traceability allows NEXUS to audit the full chain from gate to release.

**Large artifacts must be referenced by path, not inlined.** Write the full artifact to `reports/<agent>/`, then reference it in the evidence item as an `artifactPath`.

**Logs must be redacted before writing.** Remove API keys, tokens, user data, and database connection strings from all log artifacts.

**Release evidence must reference all three gates.** A release contract that does not name AUDITOR, SENTINEL, and WARDEN artifact paths is incomplete.

**Batch evidence is valid for reports, not gates.** A reconciled batch result may be included as supplementary evidence in a report but cannot satisfy a gate skill requirement.

**Evidence must not contain secrets.** The secret guard scans file writes, but agents are responsible for not generating secrets in evidence artifacts in the first place.

---

## 4. Evidence Item Shape

Use this shape when attaching evidence to task outputs, handoff contracts, or state transition records:

```json
{
  "type": "skill_result",
  "taskId": "task-abc-123",
  "projectId": "careloop",
  "agentId": "auditor",
  "result": "PASS",
  "summary": "ESLint: 0 errors, 0 warnings across 12 files.",
  "artifactPaths": [
    "reports/auditor/careloop-lint-sprint2-2026-05-04.json"
  ],
  "createdAt": "2026-05-04T10:05:03Z",
  "redacted": true
}
```

Fields:

| Field | Required | Description |
| --- | --- | --- |
| `type` | Yes | Evidence type from the table above |
| `taskId` | Yes | Task that produced this evidence |
| `projectId` | Yes | Project scope |
| `agentId` | Yes | Agent that produced this evidence |
| `result` | Yes | `PASS`, `FAIL`, or `INFO` |
| `summary` | Yes | One-line human-readable description |
| `artifactPaths` | Yes | Paths to full artifact files (may be empty `[]`) |
| `createdAt` | Yes | ISO 8601 timestamp |
| `redacted` | Yes | `true` if any redaction was applied; `false` if no sensitive content existed |

---

## 5. Evidence for Gate Transitions

Each gate requires specific evidence types before the state machine will allow `passed`:

| Gate | Required evidence types |
| --- | --- |
| AUDITOR | `lint_result`, `static_analysis_result`, `skill_result` containing diff review |
| SENTINEL | `test_result`, `simulator_result`, `skill_result` containing security scan |
| WARDEN | `skill_result` containing privacy check, permissions validation |

Evidence must be present in the handoff contract from the verifier to NEXUS. A gate marked PASS without attached evidence will be rejected by the state machine.

---

## 6. Evidence for Release

A release contract going to GO requires:

```json
{
  "evidence": [
    "reports/auditor/careloop-diff-review-sprint2-2026-05-04.md",
    "reports/sentinel/careloop-qa-checklist-sprint2-2026-05-04.md",
    "reports/warden/careloop-compliance-sprint2-2026-05-04.md"
  ]
}
```

At minimum three artifact paths — one from each verifier. The `nexus.decide.release` skill validates this before producing the release contract.

---

## 7. iOS-Specific Evidence

When verifying iOS builds, SENTINEL should include:
- `xcresult` bundle path from `xcodebuild test`
- `simulator_result` from `xcrun simctl boot + install`
- `log_artifact` from `xcrun simctl log stream` (8 seconds minimum)

If the simulator is not available (e.g., CI environment without Xcode), mark the evidence item with `"result": "INFO"` and include the reason. Do not fabricate a PASS.
