import { validateRepoRegistry } from "./repoSchema.js";

const REPO_REGISTRY = {
  registryVersion: "1.0",
  source: "nexus-repo-workspace",
  phase: "P44.1",
  generatedFrom: "static-local-metadata",
  gitActionsEnabled: false,
  branchCreationAllowed: false,
  commitAllowed: false,
  prCreationAllowed: false,
  repos: [
    {
      repoId: "nexus-os",
      projectId: "nexus-os",
      label: "NEXUS OS",
      root: ".",
      repoType: "os",
      visibility: "local-private",
      status: "active",
      ownerTeam: "platform",
      ownerAgent: "NEXUS",
      allowedScopes: ["NEXUS_OS_CHANGE", "CROSS_CUTTING_REVIEW_REQUIRED"],
      protectedPaths: [
        "agents/",
        "command-execution/",
        "db/",
        "local-api/",
        "orchestrator/",
        "policy/",
        "providers/",
        "scope-boundary/",
        "state-machine/",
      ],
      forbiddenPaths: ["projects/careloop/", "projects/careloop-ios/"],
      defaultBranch: "main",
      currentBranch: "arch/multi-repo-git-pr-lifecycle",
      packageBoundary: "os",
      packageBoundaryNotes: "NEXUS OS control-plane repository. Project source trees are not part of OS packaging.",
      writesAllowed: false,
      privateSourceDetailedScanningAllowed: false,
    },
    {
      repoId: "private-project-backend",
      projectId: "private-project-01",
      label: "Private Project Backend",
      root: "projects/careloop",
      repoType: "backend",
      visibility: "local-private",
      status: "active",
      ownerTeam: "project",
      ownerAgent: "CORE",
      allowedScopes: ["PROJECT_CHANGE", "PROJECT_PACKAGE_DRY_RUN"],
      protectedPaths: [],
      forbiddenPaths: [
        "agents/",
        "command-execution/",
        "local-api/",
        "orchestrator/",
        "policy/",
        "providers/",
        "scope-boundary/",
        "state-machine/",
      ],
      defaultBranch: "main",
      currentBranch: "not-inspected",
      packageBoundary: "project",
      packageBoundaryNotes: "Metadata-only private project reference. Source contents are not inspected by the registry.",
      writesAllowed: false,
      privateSourceDetailedScanningAllowed: false,
    },
    {
      repoId: "private-project-ios",
      projectId: "private-project-01",
      label: "Private Project iOS",
      root: "projects/careloop-ios",
      repoType: "mobile-ios",
      visibility: "local-private",
      status: "active",
      ownerTeam: "project",
      ownerAgent: "SWIFT",
      allowedScopes: ["PROJECT_CHANGE", "PROJECT_PACKAGE_DRY_RUN"],
      protectedPaths: [],
      forbiddenPaths: [
        "agents/",
        "command-execution/",
        "local-api/",
        "orchestrator/",
        "policy/",
        "providers/",
        "scope-boundary/",
        "state-machine/",
      ],
      defaultBranch: "main",
      currentBranch: "not-inspected",
      packageBoundary: "project",
      packageBoundaryNotes: "Metadata-only private iOS project reference. Xcode commands are not executed.",
      writesAllowed: false,
      privateSourceDetailedScanningAllowed: false,
    },
    {
      repoId: "demo-project",
      projectId: "demoapp",
      label: "Demo Project",
      root: "demo",
      repoType: "frontend",
      visibility: "demo",
      status: "planned",
      ownerTeam: "demo",
      ownerAgent: "PRISM",
      allowedScopes: ["DEMO_CHANGE"],
      protectedPaths: [],
      forbiddenPaths: ["projects/careloop/", "projects/careloop-ios/"],
      defaultBranch: "main",
      currentBranch: "not-inspected",
      packageBoundary: "demo",
      packageBoundaryNotes: "Demo-only project metadata. DemoApp must not appear in local-private primary UX.",
      writesAllowed: false,
      privateSourceDetailedScanningAllowed: false,
    },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getRepoRegistry() {
  return clone(REPO_REGISTRY);
}

export function getRepoById(repoId) {
  return getRepoRegistry().repos.find((repo) => repo.repoId === repoId) || null;
}

export function listReposForProject(projectId) {
  return getRepoRegistry().repos.filter((repo) => repo.projectId === projectId);
}

export function summarizeRepoRegistry(registry = getRepoRegistry()) {
  const repos = Array.isArray(registry.repos) ? registry.repos : [];
  const byType = repos.reduce((acc, repo) => {
    acc[repo.repoType] = (acc[repo.repoType] || 0) + 1;
    return acc;
  }, {});
  const byVisibility = repos.reduce((acc, repo) => {
    acc[repo.visibility] = (acc[repo.visibility] || 0) + 1;
    return acc;
  }, {});

  return {
    registryVersion: registry.registryVersion,
    repoCount: repos.length,
    activeRepos: repos.filter((repo) => repo.status === "active").length,
    plannedRepos: repos.filter((repo) => repo.status === "planned").length,
    osRepos: repos.filter((repo) => repo.packageBoundary === "os").length,
    projectRepos: repos.filter((repo) => repo.packageBoundary === "project").length,
    demoRepos: repos.filter((repo) => repo.visibility === "demo").length,
    gitActionsEnabled: registry.gitActionsEnabled === true,
    branchCreationAllowed: registry.branchCreationAllowed === true,
    commitAllowed: registry.commitAllowed === true,
    prCreationAllowed: registry.prCreationAllowed === true,
    byType,
    byVisibility,
  };
}

export function validateRepoRegistryModel(registry = getRepoRegistry()) {
  return validateRepoRegistry(registry);
}
