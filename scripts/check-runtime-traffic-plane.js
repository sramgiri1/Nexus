import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/runtime-traffic-plane-report.md");

const REQUIRED_MODULES = [
  "runtime/trafficPlane.js",
  "runtime/identityContext.js",
  "runtime/policyDecision.js",
  "runtime/evidenceRecord.js",
  "runtime/behaviorBaseline.js",
  "runtime/index.js",
];

const REQUIRED_DOCS = [
  "docs/architecture/RUNTIME_TRAFFIC_PLANE.md",
  "docs/architecture/IDENTITY_PROPAGATION.md",
  "docs/architecture/ACCOUNTABILITY_EVIDENCE_RECORD.md",
  "docs/architecture/BEHAVIOR_BASELINE_MODEL.md",
];

const REQUIRED_POLICIES = [
  "policy/runtime-traffic-policy.json",
  "policy/identity-propagation-policy.json",
  "policy/behavior-baseline-policy.json",
  "policy/accountability-policy.json",
];

const EXPORT_MAP = {
  "runtime/identityContext.js": [
    "buildIdentityContext",
    "validateIdentityContext",
    "createDelegationHop",
  ],
  "runtime/policyDecision.js": [
    "createPolicyDecision",
    "evaluateTrafficRequest",
    "normalizePolicyDecision",
  ],
  "runtime/evidenceRecord.js": [
    "createEvidenceRecord",
    "verifyEvidenceRecord",
    "hashEvidenceRecord",
  ],
  "runtime/behaviorBaseline.js": [
    "classifyBehaviorEvent",
    "updateBehaviorBaseline",
    "compareBehaviorToBaseline",
    "createEmptyBaseline",
  ],
  "runtime/trafficPlane.js": ["evaluateTrafficRequest"],
  "runtime/index.js": [
    "buildIdentityContext",
    "validateIdentityContext",
    "createDelegationHop",
    "createPolicyDecision",
    "evaluateTrafficRequest",
    "normalizePolicyDecision",
    "createEvidenceRecord",
    "verifyEvidenceRecord",
    "hashEvidenceRecord",
    "classifyBehaviorEvent",
    "updateBehaviorBaseline",
    "compareBehaviorToBaseline",
    "createEmptyBaseline",
  ],
};

const PHASE_FILES = [
  ...REQUIRED_MODULES,
  ...REQUIRED_DOCS,
  ...REQUIRED_POLICIES,
  "README.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/SECURITY_BOUNDARY.md",
  "docs/architecture/OBSERVABILITY_MODEL.md",
  "docs/architecture/CAPABILITY_MODEL.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
];

const PUBLIC_SAFETY_SCAN_FILES = [
  ...REQUIRED_MODULES,
  ...REQUIRED_DOCS,
  ...REQUIRED_POLICIES,
  "README.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/SECURITY_BOUNDARY.md",
  "docs/architecture/OBSERVABILITY_MODEL.md",
  "docs/architecture/CAPABILITY_MODEL.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
];

const PRIVATE_PROJECT_PATTERNS = [
  new RegExp(["Care", "Loop"].join("")),
  new RegExp(["care", "loop"].join("")),
  new RegExp(["care", "\\s", "loop"].join("")),
];

const SECRET_PATTERNS = [
  new RegExp(`${["OPENAI", "_", "API", "_", "KEY", "="].join("")}`),
  new RegExp(`${["ANTHROPIC", "_", "API", "_", "KEY", "="].join("")}`),
  new RegExp(`${["DATABASE", "_", "URL", "="].join("")}`),
  new RegExp(
    `-----${["BEGIN", " "].join("")}[A-Z ]+${["PRIVATE", " ", "KEY"].join("")}-----`
  ),
];

const POLICY_NAMES = [
  "runtime-traffic-policy.json",
  "identity-propagation-policy.json",
  "behavior-baseline-policy.json",
  "accountability-policy.json",
];

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function getGitMetadata() {
  const metadata = {
    generatedAt: new Date().toISOString(),
    branch: "unknown",
    head: "unknown",
  };

  try {
    metadata.branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
    metadata.head = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
  } catch {
    // ignore git metadata failures
  }

  return metadata;
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function checkLongLines(relativePath) {
  const lines = readFile(relativePath).split(/\r?\n/);
  return lines
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

function requirePhrase(failures, text, label, pattern) {
  if (!pattern.test(text)) {
    failures.push(`Missing required phrase: ${label}`);
  }
}

function createBaseIdentity(modules) {
  return modules.identityContext.buildIdentityContext({
    originatingUser: {
      userId: "demo-user",
      role: "founder",
      authType: "local",
      scopes: ["demo:run"],
    },
    session: {
      sessionId: "session-demo-1",
      source: "cli",
      startedAt: "2026-05-06T00:00:00.000Z",
    },
    delegationChain: [
      modules.identityContext.createDelegationHop({
        hopId: "hop-1",
        from: "nexus",
        to: "shepherd",
        reason: "plan sample work",
        capabilityId: "orchestration.plan_flow",
        timestamp: "2026-05-06T00:00:01.000Z",
      }),
    ],
    agent: {
      agentId: "shepherd",
      agentVersion: "1.0.0",
      agentGroup: "control",
      agentPlane: "control",
    },
    request: {
      requestId: "request-demo-1",
      taskId: "task-demo-1",
      projectId: "demoapp",
      correlationId: "corr-demo-1",
      idempotencyKey: "idem-demo-1",
    },
  });
}

async function loadModules() {
  const modules = {};

  for (const relativePath of REQUIRED_MODULES) {
    const moduleUrl = pathToFileURL(path.join(ROOT, relativePath)).href;
    modules[path.basename(relativePath, ".js")] = await import(moduleUrl);
  }

  return {
    trafficPlane: modules.trafficPlane,
    identityContext: modules.identityContext,
    policyDecision: modules.policyDecision,
    evidenceRecord: modules.evidenceRecord,
    behaviorBaseline: modules.behaviorBaseline,
    runtimeIndex: modules.index,
  };
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Runtime Traffic Plane Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    `Runtime modules: ${statusLabel(sections.runtimeModules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `Policies: ${statusLabel(sections.policies)}`,
    `Policy validation: ${statusLabel(sections.policyValidation)}`,
    `Functional samples: ${statusLabel(sections.functionalSamples)}`,
    `Integration consistency: ${statusLabel(sections.integrationConsistency)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((failure) => `- ${failure}`) : ["- None"]),
    "",
    `Result: ${statusLabel(failures.length === 0)}`,
    "",
  ];

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

async function main() {
  const metadata = getGitMetadata();
  const failures = [];
  const sections = {
    runtimeModules: true,
    exports: true,
    docs: true,
    policies: true,
    policyValidation: true,
    functionalSamples: true,
    integrationConsistency: true,
    publicSafety: true,
    formattingReadability: true,
  };

  for (const file of REQUIRED_MODULES) {
    if (!exists(file)) {
      sections.runtimeModules = false;
      failures.push(`Missing runtime module: ${file}`);
    }
  }

  for (const file of REQUIRED_DOCS) {
    if (!exists(file)) {
      sections.docs = false;
      failures.push(`Missing runtime traffic plane doc: ${file}`);
    }
  }

  let runtimeTrafficPolicy;
  let identityPolicy;
  let behaviorPolicy;
  let accountabilityPolicy;

  for (const file of REQUIRED_POLICIES) {
    if (!exists(file)) {
      sections.policies = false;
      failures.push(`Missing policy file: ${file}`);
      continue;
    }

    try {
      readJson(file);
    } catch (error) {
      sections.policies = false;
      failures.push(`Policy parse failure for ${file}: ${error.message}`);
    }
  }

  if (sections.policies) {
    runtimeTrafficPolicy = readJson("policy/runtime-traffic-policy.json");
    identityPolicy = readJson("policy/identity-propagation-policy.json");
    behaviorPolicy = readJson("policy/behavior-baseline-policy.json");
    accountabilityPolicy = readJson("policy/accountability-policy.json");
  }

  let modules = null;
  if (sections.runtimeModules) {
    try {
      modules = await loadModules();
    } catch (error) {
      sections.exports = false;
      failures.push(`Module import failure: ${error.message}`);
    }
  }

  if (modules) {
    const moduleLookup = {
      "runtime/identityContext.js": modules.identityContext,
      "runtime/policyDecision.js": modules.policyDecision,
      "runtime/evidenceRecord.js": modules.evidenceRecord,
      "runtime/behaviorBaseline.js": modules.behaviorBaseline,
      "runtime/trafficPlane.js": modules.trafficPlane,
      "runtime/index.js": modules.runtimeIndex,
    };

    for (const [file, exportsNeeded] of Object.entries(EXPORT_MAP)) {
      for (const exportName of exportsNeeded) {
        if (typeof moduleLookup[file][exportName] !== "function") {
          sections.exports = false;
          failures.push(`Missing export ${exportName} in ${file}`);
        }
      }
    }
  }

  if (sections.policyValidation) {
    const trafficOk =
      runtimeTrafficPolicy?.trafficPlaneRequiredForFutureRuntime === true &&
      runtimeTrafficPolicy?.requireIdentityContext === true &&
      runtimeTrafficPolicy?.requireCapabilityId === true &&
      runtimeTrafficPolicy?.requirePolicyDecision === true &&
      runtimeTrafficPolicy?.requireEvidenceRecord === true &&
      runtimeTrafficPolicy?.requireBehaviorEvent === true;
    const identityOk =
      identityPolicy?.originatingUserRequired === true &&
      identityPolicy?.sessionRequired === true &&
      identityPolicy?.delegationChainRequired === true;
    const behaviorOk =
      behaviorPolicy?.trackToolDistribution === true &&
      behaviorPolicy?.trackChainDepth === true &&
      behaviorPolicy?.trackEgressVolume === true &&
      behaviorPolicy?.trackCost === true;
    const accountabilityOk =
      accountabilityPolicy?.evidenceRecordPerCall === true &&
      accountabilityPolicy?.rawPromptStorageAllowed === false &&
      accountabilityPolicy?.rawResponseStorageAllowed === false;

    if (!(trafficOk && identityOk && behaviorOk && accountabilityOk)) {
      sections.policyValidation = false;
      failures.push("Runtime traffic plane policies are missing required enforcement flags.");
    }
  }

  if (sections.docs) {
    const combinedDocs = REQUIRED_DOCS.map(readFile).join("\n\n");
    requirePhrase(failures, combinedDocs, "trace", /traffic plane/i);
    requirePhrase(failures, combinedDocs, "identity propagation", /originating user/i);
    requirePhrase(failures, combinedDocs, "accountability hashes", /hash/i);
    requirePhrase(failures, combinedDocs, "behavior baseline", /chain depth/i);
    if (failures.some((failure) => failure.startsWith("Missing required phrase:"))) {
      sections.docs = false;
    }
  }

  if (modules && sections.functionalSamples) {
    const identity = createBaseIdentity(modules);

    const allowedDecision = modules.policyDecision.evaluateTrafficRequest({
      identityContext: identity,
      capabilityId: "orchestration.plan_flow",
      agentId: "shepherd",
      actionType: "model_call",
      target: "planning",
      runtime: "provider-api",
      provider: "direct_openai",
      dataClassification: "public",
      promptClassification: "public",
      responseExpectedClass: "public",
      riskLevel: "low",
      requiresApproval: false,
      approvalEvidence: [],
      metadata: {},
    });
    if (allowedDecision.result !== "ALLOW") {
      sections.functionalSamples = false;
      failures.push("Sample A failed: expected ALLOW for public direct model call.");
    }

    const missingIdentityDecision = modules.policyDecision.evaluateTrafficRequest({
      identityContext: {},
      capabilityId: "orchestration.plan_flow",
      agentId: "shepherd",
      actionType: "model_call",
      target: "planning",
      runtime: "provider-api",
      provider: "direct_openai",
      dataClassification: "public",
      promptClassification: "public",
      responseExpectedClass: "public",
      riskLevel: "low",
      metadata: {},
    });
    if (missingIdentityDecision.result !== "DENY") {
      sections.functionalSamples = false;
      failures.push("Sample B failed: expected DENY for missing identity.");
    }

    const missingCapabilityDecision = modules.policyDecision.evaluateTrafficRequest({
      identityContext: identity,
      capabilityId: "",
      agentId: "shepherd",
      actionType: "tool_call",
      target: "repo.read",
      runtime: "node-local",
      provider: "none",
      dataClassification: "internal",
      promptClassification: "internal",
      responseExpectedClass: "internal",
      riskLevel: "low",
      metadata: {},
    });
    if (missingCapabilityDecision.result !== "DENY") {
      sections.functionalSamples = false;
      failures.push("Sample C failed: expected DENY for missing capability.");
    }

    const secretDecision = modules.policyDecision.evaluateTrafficRequest({
      identityContext: identity,
      capabilityId: "platform.ai_integration",
      agentId: "synapse",
      actionType: "model_call",
      target: "planning",
      runtime: "provider-api",
      provider: "direct_openai",
      dataClassification: "secret",
      promptClassification: "secret",
      responseExpectedClass: "internal",
      riskLevel: "medium",
      metadata: {},
    });
    if (secretDecision.result !== "DENY") {
      sections.functionalSamples = false;
      failures.push("Sample D failed: expected DENY for secret model traffic.");
    }

    const restrictedOpenRouter = modules.policyDecision.evaluateTrafficRequest({
      identityContext: identity,
      capabilityId: "platform.ai_integration",
      agentId: "synapse",
      actionType: "model_call",
      target: "summary",
      runtime: "provider-api",
      provider: "openrouter",
      dataClassification: "restricted",
      promptClassification: "restricted",
      responseExpectedClass: "restricted",
      riskLevel: "low",
      metadata: {},
    });
    if (restrictedOpenRouter.result !== "DENY") {
      sections.functionalSamples = false;
      failures.push("Sample E failed: expected DENY for restricted OpenRouter traffic.");
    }

    const confidentialBatch = modules.policyDecision.evaluateTrafficRequest({
      identityContext: identity,
      capabilityId: "strategy.market_research",
      agentId: "radar",
      actionType: "batch_call",
      target: "summary",
      runtime: "batch-provider",
      provider: "batch_openai",
      dataClassification: "confidential",
      promptClassification: "confidential",
      responseExpectedClass: "confidential",
      riskLevel: "medium",
      metadata: {},
    });
    if (confidentialBatch.result !== "DENY") {
      sections.functionalSamples = false;
      failures.push("Sample F failed: expected DENY for confidential batch traffic.");
    }

    const deployWithoutApproval = modules.policyDecision.evaluateTrafficRequest({
      identityContext: identity,
      capabilityId: "platform.deploy_plan",
      agentId: "forge",
      actionType: "runtime_call",
      target: "deploy",
      runtime: "human-approval",
      provider: "none",
      dataClassification: "internal",
      promptClassification: "internal",
      responseExpectedClass: "internal",
      riskLevel: "critical",
      metadata: {
        actionCategory: "deploy",
      },
    });
    if (deployWithoutApproval.result !== "REQUIRE_APPROVAL") {
      sections.functionalSamples = false;
      failures.push("Sample G failed: expected REQUIRE_APPROVAL for deploy.");
    }

    const mcpWithoutMetadata = modules.policyDecision.evaluateTrafficRequest({
      identityContext: identity,
      capabilityId: "platform.ai_integration",
      agentId: "synapse",
      actionType: "mcp_call",
      target: "github.lookup",
      runtime: "mcp-server",
      provider: "none",
      dataClassification: "public",
      promptClassification: "public",
      responseExpectedClass: "public",
      riskLevel: "low",
      metadata: {},
    });
    if (!["REQUIRE_APPROVAL", "DENY"].includes(mcpWithoutMetadata.result)) {
      sections.functionalSamples = false;
      failures.push("Sample H failed: expected REQUIRE_APPROVAL or DENY for MCP.");
    }

    const seededBaseline = (() => {
      let baseline = modules.behaviorBaseline.createEmptyBaseline("shepherd");
      for (let index = 0; index < 5; index += 1) {
        baseline = modules.behaviorBaseline.updateBehaviorBaseline(baseline, {
          agentId: "shepherd",
          agentVersion: "1.0.0",
          actionType: "tool_call",
          toolName: "repo.read",
          runtime: "node-local",
          provider: "none",
          argumentShape: { files: ["a"] },
          responseClass: "internal",
          chainDepth: 1,
          egressBytes: 10,
          costUsd: 0,
          result: "PASS",
          timestamp: `2026-05-06T00:00:0${index}.000Z`,
        });
      }
      return baseline;
    })();

    const unseenToolDrift = modules.behaviorBaseline.compareBehaviorToBaseline(
      seededBaseline,
      {
        agentId: "shepherd",
        agentVersion: "1.0.0",
        actionType: "tool_call",
        toolName: "repo.write",
        runtime: "node-local",
        provider: "none",
        argumentShape: { files: ["b"] },
        responseClass: "internal",
        chainDepth: 1,
        egressBytes: 10,
        costUsd: 0,
        result: "PASS",
        timestamp: "2026-05-06T00:01:00.000Z",
      }
    );
    if (unseenToolDrift.status !== "WARNING") {
      sections.functionalSamples = false;
      failures.push("Sample I failed: expected WARNING for unseen tool.");
    }

    const egressSpike = modules.behaviorBaseline.compareBehaviorToBaseline(
      seededBaseline,
      {
        agentId: "shepherd",
        agentVersion: "1.0.0",
        actionType: "tool_call",
        toolName: "repo.read",
        runtime: "node-local",
        provider: "none",
        argumentShape: { files: ["c"] },
        responseClass: "internal",
        chainDepth: 1,
        egressBytes: 100,
        costUsd: 0,
        result: "PASS",
        timestamp: "2026-05-06T00:02:00.000Z",
      }
    );
    if (egressSpike.status !== "ESCALATE") {
      sections.functionalSamples = false;
      failures.push("Sample J failed: expected ESCALATE for egress spike.");
    }

    const evidenceRecord = modules.evidenceRecord.createEvidenceRecord({
      identityContext: identity,
      trafficRequest: {
        capabilityId: "orchestration.plan_flow",
        agentId: "shepherd",
        actionType: "model_call",
        runtime: "provider-api",
        provider: "direct_openai",
        responseExpectedClass: "public",
      },
      policyDecision: allowedDecision,
      inputForHash: { promptRef: "demo-input" },
      outputForHash: { responseRef: "demo-output" },
    });
    const evidenceVerification =
      modules.evidenceRecord.verifyEvidenceRecord(evidenceRecord);
    if (!evidenceVerification.valid) {
      sections.functionalSamples = false;
      failures.push("Sample K failed: evidence record hash did not verify.");
    }
  }

  const integrationFiles = [
    "capabilities/registry.json",
    "policy/security-boundary-policy.json",
    "policy/data-classification-policy.json",
    "docs/architecture/OBSERVABILITY_MODEL.md",
    "docs/architecture/DOMAIN_OWNERSHIP_POLICY.md",
    "scripts/check-demo-showcase.js",
    "scripts/check-public-safety.js",
  ];
  for (const file of integrationFiles) {
    if (!exists(file)) {
      sections.integrationConsistency = false;
      failures.push(`Missing integration dependency: ${file}`);
    }
  }

  for (const file of PUBLIC_SAFETY_SCAN_FILES) {
    if (!exists(file)) continue;
    const text = readFile(file);
    for (const pattern of PRIVATE_PROJECT_PATTERNS) {
      if (pattern.test(text)) {
        sections.publicSafety = false;
        failures.push(`Private project term found in Phase 15 file: ${file}`);
        break;
      }
    }
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        sections.publicSafety = false;
        failures.push(`Secret-like content found in Phase 15 file: ${file}`);
        break;
      }
    }
  }

  for (const file of PHASE_FILES) {
    if (!exists(file)) continue;
    for (const entry of checkLongLines(file)) {
      sections.formattingReadability = false;
      failures.push(`Long line failure: ${entry}`);
    }
  }

  for (const file of REQUIRED_POLICIES) {
    if (exists(file)) {
      try {
        readJson(file);
      } catch (error) {
        sections.formattingReadability = false;
        failures.push(`Policy JSON parse failure: ${file}: ${error.message}`);
      }
    }
  }

  writeReport(metadata, sections, failures);

  console.log("NEXUS Runtime Traffic Plane Check");
  console.log("=================================");
  console.log(`Runtime modules: ${statusLabel(sections.runtimeModules)}`);
  console.log(`Exports: ${statusLabel(sections.exports)}`);
  console.log(`Docs: ${statusLabel(sections.docs)}`);
  console.log(`Policies: ${statusLabel(sections.policies)}`);
  console.log(`Policy validation: ${statusLabel(sections.policyValidation)}`);
  console.log(`Functional samples: ${statusLabel(sections.functionalSamples)}`);
  console.log(
    `Integration consistency: ${statusLabel(sections.integrationConsistency)}`
  );
  console.log(`Public safety: ${statusLabel(sections.publicSafety)}`);
  console.log(
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`
  );
  console.log(`\nResult: ${statusLabel(failures.length === 0)}`);

  process.exit(failures.length === 0 ? 0 : 1);
}

main();
