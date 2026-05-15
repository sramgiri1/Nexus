function slugify(value = "new-project") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "new-project";
}

function defaultStackProfile(projectType) {
  if (projectType === "saas-mobile") return "node-fastify-prisma-ios";
  if (projectType === "web-app" || projectType === "saas-web") return "react-vite-demo";
  if (projectType === "android-app") return "android-gradle-kotlin-placeholder";
  return "generic-docs";
}

export function generateProjectId(name) {
  return slugify(name);
}

export function generateProjectProfile(input = {}) {
  const label = input.name || input.label || "New Project";
  const projectId = input.projectId || generateProjectId(label);
  const projectType = input.type || input.projectType || "web-app";
  const root = `projects/${projectId}`;

  return {
    profileVersion: "1.0",
    projectId,
    projectLabel: label,
    label,
    visibility: "local-private",
    projectType,
    root,
    scope: "project",
    stackProfileId: defaultStackProfile(projectType),
    stacks: {},
    databases: {},
    testSuites: [],
    agents: {},
    workflows: [
      { id: "plan", label: "Plan Mission" },
      { id: "validate", label: "Run QA Gate" },
    ],
    allowedRoots: [root],
    allowedPaths: [root],
    forbiddenPatterns: [".env", "*.pem", "*.key", "*.p12", "secrets/**"],
    forbiddenPaths: [".env", "*.pem", "*.key", "*.p12", "secrets/**"],
    costPolicy: { enabled: false },
    releaseGates: [],
    docs: [],
    adapterRuntimeEnabled: false,
    projectSelectorEnabled: false,
    projectMutationAllowed: false,
    providerCallsAllowed: false,
    dbAccessAllowed: false,
    metadata: {
      generatedBy: "nexus:init-project",
      dryRunOnly: true,
    },
  };
}
