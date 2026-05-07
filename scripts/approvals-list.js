import { listApprovals } from "../local-state/approvalStore.js";

const result = listApprovals();

if (!result.ok) {
  console.error("Failed to list approvals.");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("NEXUS Local Approvals");
  console.log("====================");
  console.log("");

  if (result.approvals.length === 0) {
    console.log("No local approvals found.");
  } else {
    for (const approval of result.approvals) {
      console.log(
        `- ${approval.approvalId} | ${approval.decision} | ${approval.type} | ${approval.projectId} | ${approval.taskId || "no-task"}`
      );
      console.log(`  requestedBy: ${approval.requestedBy || "unknown"}`);
      console.log(`  riskLevel: ${approval.riskLevel || "unknown"}`);
      console.log(`  reason: ${approval.reason || "n/a"}`);
    }
  }
}
