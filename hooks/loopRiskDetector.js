export const LOOP_RISK_LEVELS = ["low", "medium", "high", "critical"];
export const LOOP_RISK_DECISIONS = {
  PASS: "PASS",
  WARN: "WARN",
  BLOCK: "BLOCK",
};

function finding(findingId, severity, message, mitigation) {
  return { findingId, severity, message, mitigation };
}

export function detectHookLoopRisks(hook, registry = []) {
  const findings = [];
  const relatedHooks = registry.filter((candidate) => candidate.hookId !== hook?.hookId);

  if (!hook || typeof hook !== "object") {
    return {
      hookId: "unknown",
      loopRiskScore: 100,
      riskLevel: "critical",
      decision: LOOP_RISK_DECISIONS.BLOCK,
      findings: [finding("missing-hook", "critical", "Missing hook definition.", "Fail closed.")],
      requiredMitigations: ["Fail closed."],
    };
  }

  if (hook.triggerSource === hook.hookId) {
    findings.push(finding("self-trigger", "critical", "Hook appears to trigger itself.", "Block enablement."));
  }

  const twoHookCycle = relatedHooks.find((candidate) => (
    candidate.triggerSource === hook.hookId && hook.triggerSource === candidate.hookId
  ));
  if (twoHookCycle) {
    findings.push(finding("two-hook-cycle", "critical", `Potential cycle with ${twoHookCycle.hookId}.`, "Require explicit loop break."));
  }

  if (hook.triggerType?.includes("validation") && hook.allowedActions?.includes("repair")) {
    findings.push(finding("repair-loop", "high", "Validation repair loop could repeat without bound.", "Require retry cap and approval."));
  }

  if ((hook.cooldownSeconds || 0) === 0) {
    findings.push(finding("missing-cooldown", "high", "Hook has no cooldown.", "Set a cooldown before enablement."));
  }

  if ((hook.maxRetries || 0) === 0) {
    findings.push(finding("retry-disabled", "low", "Retries are disabled.", "No action needed for disabled P51 hooks."));
  }

  if (!hook.killSwitchId) {
    findings.push(finding("missing-kill-switch", "critical", "Hook has no kill switch.", "Define hook kill switch."));
  }

  if (hook.failClosed !== true) {
    findings.push(finding("not-fail-closed", "critical", "Hook does not fail closed.", "Require failClosed true."));
  }

  if (hook.scope === "portfolio" && (hook.requiredApprovals || []).length === 0) {
    findings.push(finding("broad-scope-no-approval", "high", "Portfolio hook has no approval.", "Require human approval."));
  }

  const score = findings.reduce((total, item) => {
    if (item.severity === "critical") return total + 50;
    if (item.severity === "high") return total + 25;
    if (item.severity === "medium") return total + 10;
    return total + 2;
  }, 0);

  let riskLevel = "low";
  if (score >= 50) riskLevel = "critical";
  else if (score >= 25) riskLevel = "high";
  else if (score >= 10) riskLevel = "medium";

  const decision = ["critical", "high"].includes(riskLevel)
    ? LOOP_RISK_DECISIONS.BLOCK
    : findings.length
      ? LOOP_RISK_DECISIONS.WARN
      : LOOP_RISK_DECISIONS.PASS;

  return {
    hookId: hook.hookId,
    loopRiskScore: score,
    riskLevel,
    decision,
    findings,
    requiredMitigations: findings.map((item) => item.mitigation),
  };
}

export function detectRegistryLoopRisks(registry = []) {
  return registry.map((hook) => detectHookLoopRisks(hook, registry));
}

export function summarizeLoopRisks(results = []) {
  return {
    hookCount: results.length,
    blockedCount: results.filter((result) => result.decision === LOOP_RISK_DECISIONS.BLOCK).length,
    warningCount: results.filter((result) => result.decision === LOOP_RISK_DECISIONS.WARN).length,
    passCount: results.filter((result) => result.decision === LOOP_RISK_DECISIONS.PASS).length,
    highestRiskLevel: results.some((result) => result.riskLevel === "critical")
      ? "critical"
      : results.some((result) => result.riskLevel === "high")
        ? "high"
        : results.some((result) => result.riskLevel === "medium")
          ? "medium"
          : "low",
  };
}

export function validateLoopRiskResult(result) {
  const errors = [];

  if (!result?.hookId) errors.push("hookId is required");
  if (!Number.isFinite(result?.loopRiskScore)) errors.push("loopRiskScore must be numeric");
  if (!LOOP_RISK_LEVELS.includes(result?.riskLevel)) errors.push(`Invalid riskLevel: ${result?.riskLevel}`);
  if (!Object.values(LOOP_RISK_DECISIONS).includes(result?.decision)) {
    errors.push(`Invalid decision: ${result?.decision}`);
  }
  if (!Array.isArray(result?.findings)) errors.push("findings must be an array");
  if (!Array.isArray(result?.requiredMitigations)) errors.push("requiredMitigations must be an array");
  if (["high", "critical"].includes(result?.riskLevel) && result?.decision !== LOOP_RISK_DECISIONS.BLOCK) {
    errors.push("High and critical risks must block enablement");
  }

  return { valid: errors.length === 0, errors };
}
