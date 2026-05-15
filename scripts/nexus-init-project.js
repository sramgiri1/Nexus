import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  createProjectOnboardingDryRun,
  validateProjectOnboardingRequest,
} from "../project-registry/index.js";

const ROOT = process.cwd();
const PLAN_PATH = join(ROOT, "reports", "project-onboarding-plan.json");
const REPORT_PATH = join(ROOT, "reports", "project-onboarding-report.md");

function parseArgs(argv) {
  const args = { dryRun: true, name: "", type: "web-app" };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--name") args.name = argv[index + 1] || "";
    if (token === "--type") args.type = argv[index + 1] || "web-app";
    if (token === "--dry-run") args.dryRun = true;
    if (token === "--write") args.write = true;
  }
  return args;
}

function writeReports(result) {
  writeFileSync(PLAN_PATH, JSON.stringify(result.plan, null, 2), "utf8");
  const report = `# NEXUS Project Onboarding Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${process.env.GIT_BRANCH || "local"}
- Validation HEAD: ${process.env.GIT_HEAD || "local"}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Summary

- Dry run: ${result.plan.dryRun ? "yes" : "no"}
- Proposed project: ${result.plan.proposedProjectLabel}
- Proposed project ID: ${result.plan.proposedProjectId}
- Proposed root: ${result.plan.proposedProjectRoot}
- Proposed stack profile: ${result.plan.proposedStackProfile}
- Project file writes allowed: no

## Missing Info

${result.plan.missingInfo.map((item) => `- ${item}`).join("\n")}

## Next Steps

${result.plan.nextSteps.map((item) => `- ${item}`).join("\n")}
`;
  writeFileSync(REPORT_PATH, report, "utf8");
}

const args = parseArgs(process.argv.slice(2));
const validation = validateProjectOnboardingRequest(args);
if (!validation.valid) {
  console.error(`NEXUS init-project dry run failed: ${validation.errors.join("; ")}`);
  process.exit(1);
}

const result = createProjectOnboardingDryRun(args);
writeReports(result);

console.log("NEXUS Project Onboarding Dry Run");
console.log("================================");
console.log(`Project: ${result.plan.proposedProjectLabel}`);
console.log(`Project ID: ${result.plan.proposedProjectId}`);
console.log(`Root: ${result.plan.proposedProjectRoot}`);
console.log(`Stack profile: ${result.plan.proposedStackProfile}`);
console.log("Project file writes: disabled");
