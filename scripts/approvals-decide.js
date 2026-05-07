import { decideApproval } from "../local-state/approvalStore.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseArgs(argv = []) {
  const [action = "", approvalId = "", ...rest] = argv;
  let reason = "";

  for (let index = 0; index < rest.length; index += 1) {
    const current = rest[index];
    if (current === "--reason" || current === "-r") {
      reason = normalizeString(rest[index + 1]);
      index += 1;
    }
  }

  return {
    action: normalizeString(action),
    approvalId: normalizeString(approvalId),
    reason,
  };
}

const { action, approvalId, reason } = parseArgs(process.argv.slice(2));
const decision =
  action === "approve"
    ? "approved"
    : action === "reject"
      ? "rejected"
      : "";

if (!decision || !approvalId || !reason) {
  console.error(
    "Usage: node scripts/approvals-decide.js <approve|reject> <approvalId> --reason \"...\""
  );
  process.exitCode = 1;
} else {
  const result = decideApproval({
    approvalId,
    decision,
    decidedBy: "local-operator",
    reason,
    redacted: true,
  });

  if (!result.ok) {
    console.error("Approval decision failed.");
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log("NEXUS Local Approval Decision");
    console.log("============================");
    console.log("");
    console.log(`Approval: ${result.decisionRecord.approvalId}`);
    console.log(`Decision: ${result.decisionRecord.decision}`);
    console.log(`Task: ${result.decisionRecord.taskId || "n/a"}`);
    console.log(`Evidence: ${result.evidence?.type || "none"}`);
  }
}
