const GITHUB_EVENT_CATALOG = [
  {
    eventType: "pull_request.opened",
    displayName: "Pull Request Opened",
    mappedAction: "review",
    purpose: "Preview a work review when a pull request opens.",
  },
  {
    eventType: "pull_request.synchronize",
    displayName: "Pull Request Updated",
    mappedAction: "qa",
    purpose: "Preview validation after a pull request changes.",
  },
  {
    eventType: "pull_request.review_requested",
    displayName: "Review Requested",
    mappedAction: "review",
    purpose: "Preview auditor review routing.",
  },
  {
    eventType: "pull_request_review.submitted",
    displayName: "Pull Request Review Submitted",
    mappedAction: "retro",
    purpose: "Preview review evidence summarization.",
  },
  {
    eventType: "issue_comment.created",
    displayName: "Issue Comment Created",
    mappedAction: "explain",
    purpose: "Preview a state explanation for a repository comment.",
  },
  {
    eventType: "check_suite.completed",
    displayName: "Check Suite Completed",
    mappedAction: "qa",
    purpose: "Preview validation gate analysis.",
  },
  {
    eventType: "workflow_run.failed",
    displayName: "Workflow Run Failed",
    mappedAction: "fix",
    purpose: "Preview fix proposal routing for failed workflow evidence.",
  },
];

export function getGitHubTriggerCatalog() {
  return GITHUB_EVENT_CATALOG.map((event) => ({ ...event }));
}

export function mapGitHubEventToNexusAction(event = {}) {
  const catalogEntry = GITHUB_EVENT_CATALOG.find((entry) => entry.eventType === event.eventType);
  return {
    eventType: event.eventType,
    requestedAction: catalogEntry?.mappedAction || "explain",
    routeTarget: catalogEntry?.mappedAction === "fix"
      ? "/command-center/implementation"
      : catalogEntry?.mappedAction === "qa"
        ? "/command-center/gates"
        : catalogEntry?.mappedAction === "review"
          ? "/command-center/workbench"
          : "/command-center",
    mapped: Boolean(catalogEntry),
    disabledReason: "GitHub Events - Preview only. No credentials configured and webhook execution is disabled.",
  };
}

export function createGitHubEventPreview(input = {}) {
  const event = {
    eventType: input.eventType || "pull_request.opened",
    repo: input.repo || "private/repository",
    projectId: input.projectId || "private-project-01",
    scope: input.scope || "PROJECT_CHANGE",
    deliveryId: input.deliveryId || "github-preview-delivery",
    actor: input.actor || "redacted-github-actor",
  };
  const mappedAction = mapGitHubEventToNexusAction(event);
  return {
    previewVersion: "1.0",
    phase: "P53.4",
    sourceSystem: "github_preview",
    ...event,
    ...mappedAction,
    dedupeKey: `github:${event.repo}:${event.eventType}:${event.deliveryId}`,
    dryRunOnly: true,
    executionAllowed: false,
    githubApiCallsAllowed: false,
    externalNetworkCallsAllowed: false,
    webhookServerAllowed: false,
    credentialUseAllowed: false,
    prMutationAllowed: false,
    projectMutationAllowed: false,
    status: "preview_only",
  };
}

export function validateGitHubEventPreview(preview = {}) {
  const errors = [];
  if (!GITHUB_EVENT_CATALOG.some((entry) => entry.eventType === preview.eventType)) errors.push("Unsupported GitHub event type");
  if (!preview.repo) errors.push("GitHub preview requires repo metadata");
  if (!preview.projectId) errors.push("GitHub preview requires project metadata");
  if (!preview.scope) errors.push("GitHub preview requires scope metadata");
  if (!preview.dedupeKey) errors.push("GitHub preview requires dedupe key");
  if (preview.dryRunOnly !== true) errors.push("GitHub preview must be dry-run only");
  if (preview.executionAllowed !== false) errors.push("GitHub preview execution must be disabled");
  if (preview.githubApiCallsAllowed !== false) errors.push("GitHub API calls must be disabled");
  if (preview.externalNetworkCallsAllowed !== false) errors.push("External network calls must be disabled");
  if (preview.webhookServerAllowed !== false) errors.push("Webhook server must be disabled");
  if (preview.credentialUseAllowed !== false) errors.push("Credential use must be disabled");
  if (preview.prMutationAllowed !== false) errors.push("PR mutation must be disabled");
  if (preview.projectMutationAllowed !== false) errors.push("Project mutation must be disabled");
  return { valid: errors.length === 0, errors };
}
