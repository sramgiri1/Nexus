import process from "node:process";
import { getNexusMode, isLocalPrivateMode } from "../private-mode/index.js";
import {
  runCareLoopCommandClassification,
  writeCareLoopCommandClassificationReports,
} from "../careloop-readiness/careloopCommandClassification.js";

const mode = getNexusMode(process.env);

if (!isLocalPrivateMode(mode)) {
  console.error(
    `NEXUS CareLoop Backend Command Classification requires NEXUS_MODE=local-private. Got: ${mode}`
  );
  process.exit(1);
}

console.log("NEXUS CareLoop Backend Command Classification");
console.log("============================================");
console.log("");
console.log(`Mode: ${mode}`);
console.log("Project: private project");
console.log("Task: Classify backend validation commands for controlled execution");
console.log("Agent: AUDITOR");
console.log("Capability: verification.code_quality_gate");
console.log("");
console.log("Safety:");
console.log("- Command execution: disabled");
console.log("- Mutation: disabled");
console.log("- Build/test: disabled");
console.log("- Provider calls: disabled");
console.log("- Network: disabled");
console.log("- DB/API: disabled");
console.log("");

const result = runCareLoopCommandClassification({ env: process.env });

if (!result.ok) {
  console.error("Classification failed:");
  for (const err of result.errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

writeCareLoopCommandClassificationReports(result);

console.log("Summary:");
console.log(`- Total commands: ${result.summary.total}`);
console.log(`- Safe to inspect: ${result.summary.safeToInspect}`);
console.log(`- Safe to run later: ${result.summary.safeToRunLater}`);
console.log(`- Requires approval: ${result.summary.requiresApproval}`);
console.log(`- Requires DB: ${result.summary.requiresDb}`);
console.log(`- Blocked for now: ${result.summary.blockedForNow}`);
console.log("");
console.log("Recommended first execution:");
console.log(`  Command: ${result.recommendation.command}`);
console.log(`  Phase: ${result.recommendation.phase}`);
console.log(`  Reason: ${result.recommendation.reason}`);
console.log("");

if (result.warnings.length > 0) {
  console.log("Warnings:");
  for (const w of result.warnings) {
    console.log(`  - ${w}`);
  }
  console.log("");
}

console.log("Reports written:");
console.log("  reports/careloop-command-classification.md");
console.log("  reports/careloop-command-classification.json");
console.log("  contracts/careloop/backend-command-classification-contract.json");
