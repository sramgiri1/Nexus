import process from "node:process";
import { getNexusMode, isLocalPrivateMode } from "../private-mode/index.js";
import {
  runCareLoopBackendControlledValidation,
  writeCareLoopBackendValidationReports,
} from "../careloop-readiness/careloopControlledValidation.js";

const mode = getNexusMode(process.env);

if (!isLocalPrivateMode(mode)) {
  console.error(
    `NEXUS CareLoop Backend Controlled Validation requires NEXUS_MODE=local-private. Got: ${mode}`
  );
  process.exit(1);
}

console.log("NEXUS CareLoop Backend Controlled Validation");
console.log("===========================================");
console.log("");
console.log(`Mode: ${mode}`);
console.log("Project: private project");
console.log("Command: npm test");
console.log("Agent: AUDITOR");
console.log("Capability: verification.code_quality_gate");
console.log("");
console.log("Safety:");
console.log("- Dependency install: disabled");
console.log("- Mutation: disabled");
console.log("- Provider calls: disabled");
console.log("- Network: disabled");
console.log("- DB/API: disabled");
console.log("");

const result = runCareLoopBackendControlledValidation({ env: process.env });
writeCareLoopBackendValidationReports(result);

const p = result.preflight ?? {};
const e = result.execution ?? {};

console.log("Preflight:");
console.log(`- script exists: ${p.scriptExists ?? "N/A"}`);
console.log(`- dependencies: ${p.dependencyReadiness ?? "N/A"}`);
console.log(`- allowlist: ${result.errors?.some((err) => err.includes("allowlist")) ? "BLOCKED" : "PASS"}`);
console.log("");
console.log("Execution:");
console.log(`- status: ${e.status ?? "N/A"}`);
console.log(`- exit code: ${e.exitCode ?? "N/A"}`);
console.log(`- duration: ${e.durationMs ?? 0}ms`);
console.log(`- mutation detected: ${e.mutationDetected ?? false}`);
console.log("");
console.log("Result:");
console.log(`- report: reports/careloop-backend-validation.md`);
console.log(`- evidence: appended`);
console.log(`- audit: appended`);
console.log(`- runtime event: appended`);
console.log("");

if (result.warnings?.length > 0) {
  console.log("Warnings:");
  for (const w of result.warnings) console.log(`  - ${w}`);
  console.log("");
}

if (!result.ok && result.errors?.length > 0) {
  console.log("Errors:");
  for (const err of result.errors) console.log(`  - ${err}`);
  console.log("");
}

// Exit 0 even on test failure — test failure is a legitimate result, not a script error.
// Only exit 1 on governance/infra failure (blocked or errors before execution).
if (!result.ok && e.status === undefined) {
  process.exit(1);
}
