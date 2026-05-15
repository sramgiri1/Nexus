export const SUPPORTED_STACK_TYPES = [
  "backend",
  "web",
  "ios",
  "android",
  "database",
  "infrastructure",
  "docs",
  "tests",
];

export const STACK_PROFILE_LIBRARY = [
  {
    stackId: "node-fastify-prisma-ios",
    label: "Node/Fastify + Prisma + iOS",
    projectType: "saas-mobile",
    components: {
      backend: {
        language: "typescript",
        framework: "fastify",
        packageManager: "npm",
        testTool: "node-test",
        testCommand: "npm test",
      },
      database: {
        type: "postgres-prisma",
        schemaPath: "prisma/schema.prisma",
        defaultAccess: "disabled",
        safeValidationCommands: [],
        requiresApproval: ["migrate", "seed", "reset"],
      },
      ios: {
        language: "swift",
        buildSystem: "xcodegen",
        runner: "xcodebuild",
        enabled: false,
        disabledReason: "Requires iOS/Xcode runner",
      },
    },
    capabilities: ["mission-planning", "task-activation", "agent-workbench", "backend-validation"],
    testSuites: ["backend-validation", "ios-validation-planned"],
    forbiddenActions: ["db-migrate", "db-seed", "db-reset", "provider-dispatch", "worker-runtime"],
    warnings: ["iOS validation requires an explicit local runner."],
  },
  {
    stackId: "nexus-os-platform",
    label: "NEXUS OS Platform",
    projectType: "os-module",
    components: {
      web: {
        language: "javascript",
        framework: "react-vite",
        packageManager: "npm",
        testTool: "playwright",
        testCommand: "cd dashboard && npm run test:pages",
      },
      docs: {
        format: "markdown",
        validation: "docs-coverage",
      },
      tests: {
        testCommand: "npm run check:project-registry-schema",
      },
    },
    capabilities: ["os-roadmap", "docs-coverage", "command-center-validation"],
    testSuites: ["command-center-ux", "docs-coverage", "os-phase-status"],
    forbiddenActions: ["provider-dispatch", "project-mutation"],
    warnings: [],
  },
  {
    stackId: "react-vite-demo",
    label: "React/Vite Demo",
    projectType: "web-app",
    components: {
      web: {
        language: "javascript",
        framework: "react-vite",
        packageManager: "npm",
        testTool: "playwright",
        testCommand: "",
      },
    },
    capabilities: ["demo-mode"],
    testSuites: ["demo-route-smoke"],
    forbiddenActions: ["private-data", "project-mutation"],
    warnings: ["Demo stack must not reference private project roots."],
  },
  {
    stackId: "generic-docs",
    label: "Generic Docs",
    projectType: "library",
    components: {
      docs: {
        format: "markdown",
        validation: "manual-review",
      },
    },
    capabilities: ["docs-review"],
    testSuites: ["docs-coverage-planned"],
    forbiddenActions: ["runtime-execution"],
    warnings: [],
  },
  {
    stackId: "android-gradle-kotlin-placeholder",
    label: "Android Gradle Kotlin Placeholder",
    projectType: "android-app",
    components: {
      android: {
        language: "kotlin",
        buildSystem: "gradle",
        runner: "gradle",
        enabled: false,
        disabledReason: "Requires Android/Gradle runner",
      },
    },
    capabilities: ["android-validation-planned"],
    testSuites: ["android-validation-planned"],
    forbiddenActions: ["runner-execution"],
    warnings: ["Android runtime validation is not enabled yet."],
  },
];

export function getSupportedStackTypes() {
  return [...SUPPORTED_STACK_TYPES];
}

export function getStackProfileById(stackId) {
  return STACK_PROFILE_LIBRARY.find((profile) => profile.stackId === stackId) || null;
}
