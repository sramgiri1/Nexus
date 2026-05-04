# Model Routing Standard

Model selection, provider routing, and batch eligibility are governed by configuration files — not by agent judgment. Agents do not choose their own model or provider. They operate within what the routing policy assigns to their agent ID and task type.

---

## 0. Core Rule

> **Agents do not choose arbitrary models.**

The model and provider for each agent come from `config/model-map.json`. Fallback behavior comes from `config/fallback-policy.json`. Batch eligibility comes from `config/batch-policy.json`. Agents observe these policies — they do not override them.

---

## 1. Provider Roles

| Provider | Use case |
| --- | --- |
| `direct_anthropic` | Deep reasoning, compliance, strategy, official Anthropic batch |
| `direct_openai` | Critical coding, realtime execution, official OpenAI batch |
| `openrouter` | Low-cost realtime fallback, experimentation, cost-sensitive non-blocking tasks |
| `ollama` | Zero-cost local draft fallback only — never authoritative |

---

## 2. Task Type → Execution Mode

| Task type | Execution mode | Notes |
| --- | --- | --- |
| `implementation` | Realtime | Code agents are never batch-eligible |
| `verification_gate` | Realtime (skill-based) | Skills run without Claude; gate logic is deterministic |
| `release_decision` | Realtime | Requires valid release contract; must not be batched |
| `deploy` | Realtime | Infrastructure changes require immediate feedback |
| `security_blocker` | Realtime | Never batch — blocks on unsafe content |
| `auto_heal` | Realtime | Must respond immediately |
| `marketing_copy` | Batch-eligible | BEACON, COMPASS |
| `aso_copy` | Batch-eligible | COMPASS |
| `market_analysis` | Batch-eligible | RADAR |
| `qa_documentation` | Batch-eligible | SENTINEL post-gate |
| `analytics_spec` | Batch-eligible | ORACLE |
| `report` | Batch-eligible | RELAY, MERIDIAN, non-blocking only |

---

## 3. Fallback Rules

Fallback is attempted once if the primary provider returns:
- `missing_api_key`
- `rate_limit`
- `provider_unavailable`
- `timeout`

**Never fall back on:**
- `budget_exceeded` — stop and surface to founder
- `safety_blocked` — do not retry
- `secret_detected` — do not retry
- `permission_denied` — do not retry

**Never use Ollama as fallback for:**
- Release decisions
- Security blockers
- Gate verification
- Deploy tasks
- Any `riskLevel: critical` task

---

## 4. OpenRouter Usage Rules

OpenRouter is permitted only where `config/openrouter-policy.json` allows it:
- Non-blocking tasks only
- `data_collection: deny` must be set in the request
- Never for: `release_decision`, `security_blocker`, `deploy`, `verification_gate`, `auto_heal`

OpenRouter does not support official batch API. OpenRouter chat batch is disabled.

---

## 5. Model Awareness in Output

When applicable, agents should include model policy observance in their output metadata:

```json
{
  "modelPolicyObserved": true,
  "executionMode": "realtime",
  "batchEligible": false
}
```

This is informational — it allows NEXUS and SHEPHERD to audit whether agents operated within their routing policy.

Execution mode values:
- `realtime` — synchronous, blocking, immediate
- `batch` — deferred to batch-queue.json
- `skill` — no Claude; deterministic tool execution only

---

## 6. Budget Awareness

The budget guard enforces daily and monthly token/cost limits per agent (see `guardrails/budget.json`). When a budget limit is hit:
1. The governor blocks the LLM call.
2. The agent receives a `budget_exceeded` block event.
3. The agent must return a BLOCKED output — not retry.
4. NEXUS surfaces the limit to the founder via `memory/founder-actions.json`.

Agents must not attempt to route around budget limits by switching providers.

---

## 7. Skills Bypass Routing Entirely

Deterministic skills (`run_skill` tool) do not use Claude. They shell out to ESLint, SwiftLint, xcodebuild, xcrun, or grep. They have no model, no provider, no cost (beyond local compute), and no batch eligibility. Skills always run realtime.

Gate verification should default to skills. LLM reasoning is used only for tasks that require judgment skills cannot provide.
