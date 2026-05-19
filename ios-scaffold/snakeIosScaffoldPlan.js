import { createPassResult } from "../shared/resultEnvelope.js";
import { buildLocalProjectCreationAdmission } from "../live-ready/localProjectCreationAdmission.js";

export const P83_SNAKE_IOS_SCAFFOLD_PHASE = "P83.2";

export const SNAKE_IOS_SCAFFOLD_FILES = Object.freeze([
  "README.md",
  "Package.swift",
  "Sources/SnakeIOSApp/SnakeIOSApp.swift",
  "Sources/SnakeIOSApp/GameScene.swift",
  "Sources/SnakeIOSApp/GameState.swift",
  "Sources/SnakeIOSApp/SnakeTypes.swift",
  "Sources/SnakeIOSApp/Theme.swift",
  "Tests/SnakeIOSAppTests/GameStateTests.swift",
]);

const RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
]);

function falseRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function buildFilePlan(root) {
  return SNAKE_IOS_SCAFFOLD_FILES.map((relativePath) => ({
    relativePath,
    targetPath: `${root}/${relativePath}`,
    writeAllowedInPhase: "P83.3",
    status: "planned",
  }));
}

export function buildSnakeIosScaffoldPlan(input = {}) {
  const admission = input.admission || buildLocalProjectCreationAdmission({
    projectName: "Snake iOS",
    projectType: "ios-game",
    approval: {
      operatorApproval: true,
      newWorkspaceRoot: true,
      scopeBoundary: true,
      rollbackPlan: true,
      validationCommands: true,
      activityEvidence: true,
      costEvidence: true,
      redactionCheck: true,
    },
  });
  const root = admission.data?.targetRoot || "generated-projects/snake-ios";
  const admitted = admission.data?.projectCreationAllowed === true && root === "generated-projects/snake-ios";

  return createPassResult({
    phase: P83_SNAKE_IOS_SCAFFOLD_PHASE,
    mode: "live",
    source: "ios-scaffold/snakeIosScaffoldPlan.js",
    summary: admitted
      ? "Snake iOS scaffold plan is ready for approved local file creation."
      : "Snake iOS scaffold plan is blocked until local project creation admission is ready.",
    data: {
      currentState: admitted ? "snake_ios_scaffold_plan_ready" : "snake_ios_scaffold_plan_blocked",
      readinessLabel: admitted ? "Ready" : "Needs setup",
      targetRoot: root,
      appName: "Snake iOS",
      platform: "iOS",
      stack: ["Swift", "SwiftUI", "SpriteKit", "Swift Package Manager"],
      filePlan: buildFilePlan(root),
      acceptanceCriteria: [
        "Game state supports grid movement, growth, collision, scoring, pause, and restart.",
        "SpriteKit scene renders snake, food, score, and game-over state.",
        "SwiftUI app shell embeds the game scene and preserves safe-area layout.",
        "Unit tests cover movement, food collection, wall collision, self collision, and restart.",
      ],
      validationCommands: [
        "swift test",
        "swift build",
      ],
      ownerCapability: "FORGE.implementationPlanning",
      nextAction: admitted
        ? "Run P83.3 approved local file creation for generated-projects/snake-ios."
        : "Complete P83.1 local project creation admission first.",
      blockers: admitted ? [] : ["P83.1 local project creation admission is not ready."],
      disabledReason: "P83.2 is a scaffold plan only. It does not write app files, run tools, start workers, call providers, write DB state, deploy, release, package, or spend.",
      evidenceRefs: ["reports/p832-snake-ios-scaffold-plan-report.md", "reports/p831-local-project-creation-admission-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, external network calls, deploy, package creation, or provider spend.",
      projectCreationAllowed: false,
      newWorkspaceFileWritesAllowed: false,
      existingProjectMutationAllowed: false,
      ...falseRuntimeFlags(),
    },
    evidence: ["reports/p832-snake-ios-scaffold-plan-report.md"],
    warnings: ["P83.2 does not create files. P83.3 must enforce the admitted root and file plan before writing."],
  });
}

export function validateSnakeIosScaffoldPlan(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P83_SNAKE_IOS_SCAFFOLD_PHASE) errors.push("phase must be P83.2");
  if (data.targetRoot !== "generated-projects/snake-ios") errors.push("targetRoot must be generated-projects/snake-ios");
  if (!Array.isArray(data.filePlan) || data.filePlan.length !== SNAKE_IOS_SCAFFOLD_FILES.length) errors.push("filePlan must cover every scaffold file");
  for (const file of data.filePlan || []) {
    if (!file.targetPath?.startsWith("generated-projects/snake-ios/")) errors.push(`${file.relativePath} targetPath must stay inside admitted root`);
    if (file.writeAllowedInPhase !== "P83.3") errors.push(`${file.relativePath} must be writeable only in P83.3`);
  }
  for (const flag of ["projectCreationAllowed", "newWorkspaceFileWritesAllowed", "existingProjectMutationAllowed", ...RUNTIME_FLAGS]) {
    if (data[flag] !== false) errors.push(`${flag} must remain false in P83.2`);
  }
  if (!data.disabledReason || /write now|deploy now|call provider now|spend now/i.test(data.disabledReason)) errors.push("disabledReason must not imply runnable actions");
  return { valid: errors.length === 0, errors };
}
