// skills/index.js
// Registry for all agent skills. Each skill is a real executable function.
// Skills return { result: "PASS"|"FAIL"|"INFO", issues: [], summary: "" }
//
// Usage:
//   import { executeSkill } from "./skills/index.js";
//   const out = await executeSkill("auditor", "code.lint", { project: "careloop" });
//
//   CLI: npm run skill <agent> <skill> [--input '{"key":"val"}']

import { authorizeAction } from "../safety/governor.js";

const ROOT = process.cwd();

const SKILL_MAP = {
  // ── AUDITOR ────────────────────────────────────────────────────────────────
  "auditor.code.lint":              () => import("./auditor/code.lint.js"),
  "auditor.code.static_analysis":   () => import("./auditor/code.static_analysis.js"),
  "auditor.code.test_coverage":     () => import("./auditor/code.test_coverage.js"),
  "auditor.code.diff_review":       () => import("./auditor/code.diff_review.js"),

  // ── SENTINEL ───────────────────────────────────────────────────────────────
  "sentinel.qa.simulator.run":      () => import("./sentinel/qa.simulator.run.js"),
  "sentinel.qa.tests.execute":      () => import("./sentinel/qa.tests.execute.js"),
  "sentinel.qa.logs.analyze":       () => import("./sentinel/qa.logs.analyze.js"),
  "sentinel.qa.security.scan":      () => import("./sentinel/qa.security.scan.js"),

  // ── WARDEN ─────────────────────────────────────────────────────────────────
  "warden.compliance.privacy.check":         () => import("./warden/compliance.privacy.check.js"),
  "warden.compliance.permissions.validate":  () => import("./warden/compliance.permissions.validate.js"),
  "warden.compliance.appstore.check":        () => import("./warden/compliance.appstore.check.js"),

  // ── NEXUS ──────────────────────────────────────────────────────────────────
  "nexus.decide.priority":          () => import("./nexus/decide.priority.js"),
  "nexus.decide.release":           () => import("./nexus/decide.release.js"),
  "nexus.read.system_state":        () => import("./nexus/read.system_state.js"),

  // ── ORCHESTRATOR ───────────────────────────────────────────────────────────
  "orchestrator.flow.plan":         () => import("./orchestrator/flow.plan.js"),
  "orchestrator.flow.dispatch":     () => import("./orchestrator/flow.dispatch.js"),
  "orchestrator.flow.monitor":      () => import("./orchestrator/flow.monitor.js"),
  "orchestrator.flow.aggregate":    () => import("./orchestrator/flow.aggregate.js"),
};

export function listSkills() {
  return Object.keys(SKILL_MAP).map(key => {
    const [agent, ...parts] = key.split(".");
    return { key, agent, skill: parts.join(".") };
  });
}

export async function executeSkill(agent, skill, input = {}) {
  const key = `${agent}.${skill}`;

  // Governor: verify agent owns this skill (only enforced when called from a tool context)
  const check = await authorizeAction({ agentId: agent, actionType: "skill_call", skillName: key });
  if (!check.allowed) {
    return { result: "FAIL", issues: [{ severity: "error", message: check.reason }], summary: `[SAFETY] ${check.reason}` };
  }

  const loader = SKILL_MAP[key];
  if (!loader) {
    return { result: "FAIL", issues: [{ severity: "error", message: `Unknown skill: ${key}` }], summary: `Skill not found: ${key}` };
  }
  try {
    const mod = await loader();
    return await mod.execute(input);
  } catch (e) {
    return { result: "FAIL", issues: [{ severity: "error", message: e.message }], summary: `Skill crashed: ${e.message}` };
  }
}
