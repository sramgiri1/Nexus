import process from "node:process";
import {
  runCareLoopGovernedValidationPlanning,
  writeCareLoopValidationPlanReports,
} from "../careloop-readiness/index.js";
import { getNexusMode, isLocalPrivateMode } from "../private-mode/index.js";

function getMode() {
  const mode = getNexusMode({ NEXUS_MODE: process.env.NEXUS_MODE });
  if (isLocalPrivateMode(mode) || mode === "test") {
    return mode;
  }
  return "local-private";
}

function printConsole(result) {
  const contract = result.contract ?? {};
  const plan = result.plan ?? {};
  const taskRecord = result.taskRecord ?? {};
  const nextTask = plan.recommendedNextTask ?? {};

  const evidenceStatus = result.evidenceIds.length > 0 ? "appended" : "not appended";
  const auditStatus = result.auditIds.length > 0 ? "appended" : "not appended";
  const runtimeStatus = "appended";
  const taskStatus = taskRecord.taskId ? `created (final state: ${taskRecord.finalState})` : "not created";

  const lines = [
    "NEXUS CareLoop Governed Validation Task",
    "======================================",
    "",
    `Mode: ${result.mode}`,
    "Project: CareLoop",
    `Task: ${contract.title ?? "Create CareLoop backend validation plan through NEXUS"}`,
    `Agent: ${contract.targetAgent ?? "shepherd"}`,
    `Capability: ${contract.capabilityId ?? "orchestration.plan_flow"}`,
    "",
    "Safety:",
    "- Mutation: disabled",
    "- Build/test: disabled",
    "- Provider calls: disabled",
    "- Network: disabled",
    "- DB/API: disabled",
    "",
    "Result:",
    `- Task contract: ${contract.taskId ? "created" : "not created"}`,
    `- Validation plan: ${plan.planVersion ? "created" : "not created"}`,
    `- Local task record: ${taskStatus}`,
    `- Evidence: ${evidenceStatus}`,
    `- Audit: ${auditStatus}`,
    `- Runtime event: ${runtimeStatus}`,
    "",
    "Recommended next task:",
    nextTask.title ?? "(none)",
  ];

  if (result.warnings.length > 0) {
    lines.push("", "Warnings:", ...result.warnings.map((w) => `- ${w}`));
  }

  process.stdout.write(`${lines.join("\n")}\n`);
}

async function main() {
  const mode = getMode();
  const result = runCareLoopGovernedValidationPlanning({ mode, actor: "system" });
  writeCareLoopValidationPlanReports(result);
  printConsole(result);
  process.exit(result.ok || result.warnings.length > 0 ? 0 : 1);
}

main();
