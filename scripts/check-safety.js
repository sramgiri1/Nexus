#!/usr/bin/env node
// scripts/check-safety.js
// Smoke tests for the Nexus Safety Governor.
// Usage: node scripts/check-safety.js

import "dotenv/config";
import { authorizeAction, secretGuard, loopGuard, budgetGuard } from "../safety/governor.js";
import { executeTool } from "../tools/index.js";
import { safeEnqueueTask } from "../safety/safeQueue.js";
import { LOCAL_LIMITS, estimatePromptTokens } from "../orchestrator/runner.js";

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function run() {
  console.log("\n🔒 Nexus Safety Governor — Smoke Tests\n");

  // ── secretGuard ─────────────────────────────────────────────────────────────
  console.log("secretGuard:");
  {
    const fakeKey = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890abcdefgh";
    const r1 = secretGuard.check(fakeKey, "some-file.js");
    assert("blocks Anthropic API key in content", !r1.allowed);

    const r2 = secretGuard.check("const greeting = 'hello world';", "utils.js");
    assert("allows clean content", r2.allowed);

    const r3 = secretGuard.check("AKIA1234567890ABCDEF", "config.js");
    assert("blocks AWS access key", !r3.allowed);

    const r4 = secretGuard.check("# This is a readme", "README.md");
    assert("skips .md files", r4.allowed);
  }

  // ── loopGuard ────────────────────────────────────────────────────────────────
  console.log("\nloopGuard:");
  {
    const r1 = loopGuard.checkEnqueue("core", "core", "task-001");
    assert("blocks self-enqueue", !r1.allowed);

    const r2 = loopGuard.checkEnqueue("nexus", "core", "task-002");
    assert("allows nexus → core", r2.allowed);

    loopGuard.recordDispatch("task-003", "nexus");
    loopGuard.recordDispatch("task-003", "shepherd");
    const r3 = loopGuard.checkEnqueue("core", "nexus", "task-003");
    assert("blocks circular handoff (nexus already in chain)", !r3.allowed);

    const r4 = loopGuard.checkEnqueue("nexus", "swift", "task-003");
    assert("allows nexus → swift (not in chain)", r4.allowed);
  }

  // ── permissionGuard ──────────────────────────────────────────────────────────
  console.log("\npermissionGuard (via authorizeAction):");
  {
    // Engineer cannot enqueue tasks
    const r1 = await authorizeAction({ agentId: "core", actionType: "tool_call", toolName: "enqueue_task", targetAgentId: "swift" });
    assert("ENGINEER (core) cannot enqueue tasks", !r1.allowed);

    // NEXUS can enqueue for anyone
    const r2 = await authorizeAction({ agentId: "nexus", actionType: "tool_call", toolName: "enqueue_task", targetAgentId: "swift" });
    assert("ORCHESTRATOR (nexus) can enqueue for swift", r2.allowed);

    // SHEPHERD can enqueue for core
    const r3 = await authorizeAction({ agentId: "shepherd", actionType: "tool_call", toolName: "enqueue_task", targetAgentId: "core" });
    assert("SHEPHERD can enqueue for core", r3.allowed);

    // Skill ownership: auditor can run its own skills
    const r4 = await authorizeAction({ agentId: "auditor", actionType: "skill_call", skillName: "auditor.code.lint" });
    assert("auditor can run auditor.code.lint", r4.allowed);

    // Skill ownership: core cannot run auditor skill
    const r5 = await authorizeAction({ agentId: "core", actionType: "skill_call", skillName: "auditor.code.lint" });
    assert("core cannot run auditor.code.lint", !r5.allowed);
  }

  // ── fileScopeGuard ───────────────────────────────────────────────────────────
  console.log("\nfileScopeGuard (via authorizeAction):");
  {
    const r1 = await authorizeAction({ agentId: "core", actionType: "tool_call", toolName: "write_file", filePath: "../memory/portfolio.json", content: "{}" });
    assert("blocks path traversal to ../memory/", !r1.allowed);

    const r2 = await authorizeAction({ agentId: "core", actionType: "tool_call", toolName: "write_file", filePath: "careloop/src/index.js", content: "console.log('hi')" });
    assert("allows normal project file write", r2.allowed);
  }

  // ── budgetGuard ──────────────────────────────────────────────────────────────
  console.log("\nbudgetGuard:");
  {
    const cost = budgetGuard.estimateCost("claude-sonnet-4-6", 1000);
    assert("estimateCost returns a positive number", cost > 0, `got ${cost}`);

    const r1 = await authorizeAction({ agentId: "core", actionType: "llm_call", estimatedTokens: 100, estimatedCost: 0.001 });
    assert("allows LLM call within budget", r1.allowed);
  }

  // ── commandGuard ─────────────────────────────────────────────────────────────
  console.log("\ncommandGuard (via authorizeAction):");
  {
    const r1 = await authorizeAction({ agentId: "core", actionType: "command", command: "rm -rf /projects" });
    assert("blocks 'rm -rf'", !r1.allowed);

    const r2 = await authorizeAction({ agentId: "core", actionType: "command", command: "node scripts/status.js" });
    assert("allows 'node scripts/status.js'", r2.allowed);

    const r3 = await authorizeAction({ agentId: "core", actionType: "command", command: "sudo apt-get install stuff" });
    assert("blocks 'sudo'", !r3.allowed);
  }

  // ── write_memory audit-file protection (bypass fix #1) ───────────────────────
  console.log("\nwrite_memory protection:");
  {
    const r1 = await executeTool("write_memory", { file: "safety-events", data: { events: [] } }, { agentId: "atlas" });
    assert("atlas cannot overwrite safety-events via write_memory", !r1.success);

    const r2 = await executeTool("write_memory", { file: "system-usage", data: { daily: {} } }, { agentId: "relay" });
    assert("relay cannot overwrite system-usage via write_memory", !r2.success);

    const r3 = await executeTool("write_memory", { file: "founder-actions", data: { note: "test" } }, { agentId: "nexus" });
    assert("nexus can write to non-protected memory file", r3.success);
  }

  // ── loopGuard: taskId wiring (bypass fix #2) ─────────────────────────────────
  console.log("\nloopGuard with taskId:");
  {
    loopGuard.recordDispatch("task-live-001", "nexus");
    loopGuard.recordDispatch("task-live-001", "shepherd");

    // taskId undefined → check is skipped (old broken state — must now be fixed by passing real taskId)
    const r1 = loopGuard.checkEnqueue("core", "nexus", "task-live-001");
    assert("circular handoff blocked when taskId present", !r1.allowed);

    // taskId absent → check still skips (no taskId = no chain context = allow, caller's responsibility)
    const r2 = loopGuard.checkEnqueue("core", "nexus", undefined);
    assert("allows when taskId is absent (no chain context)", r2.allowed);
  }

  // ── queue size enforcement (bypass fix #3) ───────────────────────────────────
  // Test the governor path directly — no need to actually fill the queue
  console.log("\nqueue size via governor:");
  {
    // Nexus enqueue within budget passes the governor (queue is small in test env)
    const r1 = await authorizeAction({ agentId: "nexus", actionType: "tool_call", toolName: "enqueue_task", targetAgentId: "core" });
    assert("nexus enqueue passes governor when queue is not full", r1.allowed);

    // Engineer enqueue is still blocked before queue check even runs
    const r2 = await authorizeAction({ agentId: "core", actionType: "tool_call", toolName: "enqueue_task", targetAgentId: "swift" });
    assert("engineer enqueue still blocked by permission (not queue size)", !r2.allowed);
  }

  // ── A: verifier write_file path restrictions ─────────────────────────────────
  console.log("\nverifier path restrictions:");
  {
    // AUDITOR blocked from src/
    const r1 = await authorizeAction({ agentId: "auditor", actionType: "tool_call", toolName: "write_file", filePath: "careloop/src/server.js", content: "" });
    assert("AUDITOR cannot write projects/careloop/src/server.js", !r1.allowed);

    // SENTINEL blocked from app/
    const r2 = await authorizeAction({ agentId: "sentinel", actionType: "tool_call", toolName: "write_file", filePath: "careloop-ios/app/MainView.swift", content: "" });
    assert("SENTINEL cannot write projects/careloop-ios/app/MainView.swift", !r2.allowed);

    // WARDEN blocked from safety/
    const r3 = await authorizeAction({ agentId: "warden", actionType: "tool_call", toolName: "write_file", filePath: "safety/governor.js", content: "" });
    assert("WARDEN cannot write safety/governor.js", !r3.allowed);

    // SENTINEL allowed to write a qa/ file
    const r4 = await authorizeAction({ agentId: "sentinel", actionType: "tool_call", toolName: "write_file", filePath: "careloop-ios/qa/checklist.md", content: "# QA" });
    assert("SENTINEL can write projects/careloop-ios/qa/checklist.md", r4.allowed);

    // AUDITOR allowed to write its own report
    const r5 = await authorizeAction({ agentId: "auditor", actionType: "tool_call", toolName: "write_file", filePath: "reports/auditor/lint-report.md", content: "## Lint" });
    assert("AUDITOR can write reports/auditor/lint-report.md", r5.allowed);

    // WARDEN allowed to write a compliance file
    const r6 = await authorizeAction({ agentId: "warden", actionType: "tool_call", toolName: "write_file", filePath: "careloop-ios/compliance/privacy-check.md", content: "ok" });
    assert("WARDEN can write projects/careloop-ios/compliance/privacy-check.md", r6.allowed);

    // SENTINEL blocked from skills/
    const r7 = await authorizeAction({ agentId: "sentinel", actionType: "tool_call", toolName: "write_file", filePath: "skills/index.js", content: "" });
    assert("SENTINEL cannot write skills/index.js", !r7.allowed);
  }

  // ── B: safeEnqueueTask uses governor (queue size + permissions) ───────────────
  console.log("\nsafeEnqueueTask governor path:");
  {
    // 'loop' is in ORCHESTRATOR tier — should pass permission check
    const dummyTask = { id: "test-remediation-001", agentId: "core", task: "test", priority: "normal", status: "pending", createdAt: new Date().toISOString(), dependsOn: [] };
    const r1 = await safeEnqueueTask({ agentId: "core", task: dummyTask, parentTaskId: "task-parent-001", reason: "smoke test" });
    assert("safeEnqueueTask succeeds for valid target (loop→core)", r1.success);

    // Verify it recorded in safety events by checking that the governor ran (no exception)
    assert("safeEnqueueTask returns taskId on success", r1.taskId === dummyTask.id);
  }

  // ── C: local model safety limits ─────────────────────────────────────────────
  console.log("\nlocal model safety limits:");
  {
    assert("LOCAL_LIMITS.maxIter <= 3",           LOCAL_LIMITS.maxIter <= 3, `got ${LOCAL_LIMITS.maxIter}`);
    assert("LOCAL_LIMITS.timeoutMs <= 120000",    LOCAL_LIMITS.timeoutMs <= 120_000, `got ${LOCAL_LIMITS.timeoutMs}`);
    assert("LOCAL_LIMITS.maxPromptTokens <= 8000", LOCAL_LIMITS.maxPromptTokens <= 8000, `got ${LOCAL_LIMITS.maxPromptTokens}`);

    // Token estimator returns sensible values
    const small = estimatePromptTokens([{ content: "hello world" }]);
    assert("estimatePromptTokens returns > 0 for non-empty message", small > 0, `got ${small}`);

    // A 40 000-char message estimates well above 8000 tokens
    const huge = estimatePromptTokens([{ content: "x".repeat(40_000) }]);
    assert("estimatePromptTokens detects oversized prompt (40k chars > 8k tokens)", huge > LOCAL_LIMITS.maxPromptTokens, `got ${huge}`);

    // Array-content messages are also counted
    const arr = estimatePromptTokens([{ content: [{ text: "hello" }, { text: " world" }] }]);
    assert("estimatePromptTokens handles array-content blocks", arr > 0, `got ${arr}`);
  }

  // ── summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(48)}`);
  console.log(`  ${passed + failed} tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(`\n  ✗ ${failed} test(s) FAILED`);
    process.exit(1);
  } else {
    console.log(`\n  ✓ All safety checks passing`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
