export function classifyApprovalRequirement(route = {}) {
  if (route.routeStatus === "blocked") return "blocked_until_capability_ready";
  if (route.riskLevel === "high") return "required_before_execution";
  if (route.riskLevel === "medium") return "recommended";
  return "not_required";
}

export function buildApprovalPreview(route = {}) {
  const state = classifyApprovalRequirement(route);
  return {
    required: state === "required_before_execution",
    state,
    reason:
      state === "blocked_until_capability_ready"
        ? route.blockedReason || "Required capability is not enabled yet."
        : state === "required_before_execution"
          ? "High-risk commands require operator approval before any future execution."
          : state === "recommended"
            ? "Operator review is recommended before future execution."
            : "Approval is not required for read-only preview.",
    approvers: state === "not_required" ? [] : ["NEXUS_OPERATOR"],
    evidenceRequired: state === "required_before_execution" ? ["route preview", "risk summary", "operator approval"] : [],
    previewOnly: true,
  };
}

export function validateApprovalPreview(preview = {}) {
  const errors = [];
  if (typeof preview.required !== "boolean") errors.push("required must be boolean");
  if (!["not_required", "recommended", "required_before_execution", "blocked_until_capability_ready"].includes(preview.state)) {
    errors.push("state is invalid");
  }
  if (!preview.reason) errors.push("reason is required");
  if (!Array.isArray(preview.approvers)) errors.push("approvers must be an array");
  if (!Array.isArray(preview.evidenceRequired)) errors.push("evidenceRequired must be an array");
  if (preview.previewOnly !== true) errors.push("previewOnly must be true");
  return { valid: errors.length === 0, errors };
}
