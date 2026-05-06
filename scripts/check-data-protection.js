import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, "reports", "data-protection-report.md");

const requiredFiles = [
  "docs/architecture/DATA_PROTECTION_AND_PII.md",
  "docs/architecture/DATABASE_AGENT_SECURITY.md",
  "policy/data-classification-policy.json",
  "policy/database-access-policy.json",
  "security/pii-patterns.json",
  "hooks/db-safety-hooks.md",
];

const requiredClasses = ["public", "internal", "confidential", "restricted", "secret"];
const requiredNeverAllowedFields = [
  "password",
  "passwordHash",
  "token",
  "refreshToken",
  "accessToken",
  "apiKey",
  "secret",
  "privateKey",
  "dbUrl",
  "connectionString",
  "session",
];
const requiredPatternNames = [
  "email",
  "phone",
  "ssn",
  "credit_card",
  "jwt",
  "api_key",
  "private_key",
  "db_url",
  "password_like_key",
  "refresh_token",
  "access_token",
  "session_token",
  "aws_access_key",
  "openai_key",
  "anthropic_key",
  "github_token",
];
const requiredHooks = [
  "on_db_query_requested",
  "on_db_result_returned",
  "on_llm_context_build",
  "on_batch_queued",
  "on_log_write",
  "on_tool_result_persisted",
];
const docPhrases = [
  { label: "classify", regex: /\bclassify\b/i },
  { label: "redact", regex: /\bredact/i },
  { label: "scan", regex: /\bscan\b/i },
  { label: "approve/block", regex: /approve\/block|approve or block/i },
  { label: "safe views", regex: /safe views?/i },
  { label: "audit", regex: /\baudit\b/i },
  { label: "raw DB rows must not go to LLM", regex: /raw DB rows must not.*LLM/i },
  { label: "raw DB rows must not go to batch", regex: /raw DB rows must not.*batch/i },
  { label: "Obsidian is not runtime memory", regex: /Obsidian is not runtime memory/i },
];
const markdownRoots = [
  "docs/architecture",
  "docs/tooling",
  "hooks",
  "reports",
];

function safeGit(cmd) {
  try {
    return execSync(cmd, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function walkMarkdownFiles(root) {
  const absRoot = path.join(repoRoot, root);
  if (!fs.existsSync(absRoot)) return [];

  const files = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (entry.isFile() && abs.endsWith(".md")) {
        files.push(abs);
      }
    }
  }

  walk(absRoot);
  return files.sort();
}

function rel(absPath) {
  return path.relative(repoRoot, absPath);
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

const checks = {
  requiredFiles: { pass: true, failures: [] },
  dataClasses: { pass: true, failures: [] },
  providerBatchRules: { pass: true, failures: [] },
  dbAccessPolicy: { pass: true, failures: [] },
  piiPatterns: { pass: true, failures: [] },
  hooksDocumented: { pass: true, failures: [] },
  docsContent: { pass: true, failures: [] },
  commandCenterStaticData: { pass: true, failures: [] },
};

const formattingWarnings = [];
const formattingFailures = [];

for (const file of requiredFiles) {
  if (!exists(file)) {
    checks.requiredFiles.pass = false;
    checks.requiredFiles.failures.push(`missing file: ${file}`);
  }
}

let dataPolicy = null;
let dbPolicy = null;
let piiPatterns = null;
let hooksDoc = "";
let docsAggregate = "";

if (checks.requiredFiles.pass) {
  dataPolicy = readJson("policy/data-classification-policy.json");
  dbPolicy = readJson("policy/database-access-policy.json");
  piiPatterns = readJson("security/pii-patterns.json");
  hooksDoc = readText("hooks/db-safety-hooks.md");
  docsAggregate = [
    readText("docs/architecture/DATA_PROTECTION_AND_PII.md"),
    readText("docs/architecture/DATABASE_AGENT_SECURITY.md"),
    readText("docs/architecture/AGENTIC_OS_ARCHITECTURE.md"),
    readText("docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md"),
    readText("docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md"),
  ].join("\n");
}

if (dataPolicy) {
  for (const cls of requiredClasses) {
    if (!dataPolicy.classes || !Object.prototype.hasOwnProperty.call(dataPolicy.classes, cls)) {
      checks.dataClasses.pass = false;
      checks.dataClasses.failures.push(`missing class: ${cls}`);
    }
  }

  const batchBlocked = dataPolicy.batchRules?.blockedClasses || [];
  const openRouterBlocked = dataPolicy.providerRules?.openRouter?.blockedClasses || [];
  const logBlocked = dataPolicy.logRules?.blockedClassesWithoutRedaction || [];
  const evidenceBlocked = dataPolicy.evidenceRules?.blockedClasses || [];

  if (!batchBlocked.includes("restricted")) {
    checks.providerBatchRules.pass = false;
    checks.providerBatchRules.failures.push("restricted not blocked from batch");
  }
  if (!batchBlocked.includes("secret")) {
    checks.providerBatchRules.pass = false;
    checks.providerBatchRules.failures.push("secret not blocked from batch");
  }
  if (!openRouterBlocked.includes("restricted")) {
    checks.providerBatchRules.pass = false;
    checks.providerBatchRules.failures.push("restricted not blocked from OpenRouter");
  }
  if (!openRouterBlocked.includes("secret")) {
    checks.providerBatchRules.pass = false;
    checks.providerBatchRules.failures.push("secret not blocked from OpenRouter");
  }
  if (!batchBlocked.includes("confidential")) {
    checks.providerBatchRules.pass = false;
    checks.providerBatchRules.failures.push("confidential not blocked from batch by default");
  }
  if (!logBlocked.includes("secret") && dataPolicy.logRules?.secretBlocked !== true) {
    checks.providerBatchRules.pass = false;
    checks.providerBatchRules.failures.push("secret not blocked from logs");
  }
  if (!evidenceBlocked.includes("secret")) {
    checks.providerBatchRules.pass = false;
    checks.providerBatchRules.failures.push("secret not blocked from evidence");
  }
}

if (dbPolicy) {
  if (dbPolicy.defaultAccess !== "deny") {
    checks.dbAccessPolicy.pass = false;
    checks.dbAccessPolicy.failures.push("defaultAccess is not deny");
  }
  if (dbPolicy.productionAccessDefault !== "deny") {
    checks.dbAccessPolicy.pass = false;
    checks.dbAccessPolicy.failures.push("productionAccessDefault is not deny");
  }
  if (dbPolicy.auditRequired !== true) {
    checks.dbAccessPolicy.pass = false;
    checks.dbAccessPolicy.failures.push("auditRequired is not true");
  }
  if (!Array.isArray(dbPolicy.allowedTools) || dbPolicy.allowedTools.length === 0) {
    checks.dbAccessPolicy.pass = false;
    checks.dbAccessPolicy.failures.push("allowedTools missing or empty");
  }
  if (!Array.isArray(dbPolicy.approvalRequiredActions) || dbPolicy.approvalRequiredActions.length === 0) {
    checks.dbAccessPolicy.pass = false;
    checks.dbAccessPolicy.failures.push("approvalRequiredActions missing or empty");
  }
  if (!Array.isArray(dbPolicy.neverAllowedFields) || dbPolicy.neverAllowedFields.length === 0) {
    checks.dbAccessPolicy.pass = false;
    checks.dbAccessPolicy.failures.push("neverAllowedFields missing or empty");
  }
  if (!Array.isArray(dbPolicy.safeViews) || dbPolicy.safeViews.length === 0) {
    checks.dbAccessPolicy.pass = false;
    checks.dbAccessPolicy.failures.push("safeViews missing or empty");
  }
  for (const field of requiredNeverAllowedFields) {
    if (!dbPolicy.neverAllowedFields?.includes(field)) {
      checks.dbAccessPolicy.pass = false;
      checks.dbAccessPolicy.failures.push(`neverAllowedFields missing ${field}`);
    }
  }
}

if (piiPatterns) {
  const names = new Set((piiPatterns.patterns || []).map((entry) => entry.name));
  for (const name of requiredPatternNames) {
    if (!names.has(name)) {
      checks.piiPatterns.pass = false;
      checks.piiPatterns.failures.push(`missing pattern: ${name}`);
    }
  }
}

if (hooksDoc) {
  for (const hook of requiredHooks) {
    if (!new RegExp(hook, "i").test(hooksDoc)) {
      checks.hooksDocumented.pass = false;
      checks.hooksDocumented.failures.push(`missing hook doc: ${hook}`);
    }
  }
}

if (docsAggregate) {
  for (const phrase of docPhrases) {
    if (!phrase.regex.test(docsAggregate)) {
      checks.docsContent.pass = false;
      checks.docsContent.failures.push(`missing docs phrase: ${phrase.label}`);
    }
  }
}

for (const root of markdownRoots) {
  for (const file of walkMarkdownFiles(root)) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.length > 500) {
        formattingWarnings.push(`${rel(file)}:${index + 1} (${line.length})`);
      }
      if (line.length > 2000) {
        formattingFailures.push(`${rel(file)}:${index + 1} (${line.length})`);
      }
    });
  }
}

if (formattingFailures.length) {
  checks.docsContent.pass = false;
  checks.docsContent.failures.push(...formattingFailures.map((item) => `extreme long line: ${item}`));
}

const studioPath = "dashboard/src/data/studio.js";
const hookPath = "dashboard/src/hooks/useStudioData.js";
const commandCenterPath = "dashboard/src/pages/CommandCenter.jsx";

for (const file of [studioPath, hookPath, commandCenterPath]) {
  if (!exists(file)) {
    checks.commandCenterStaticData.pass = false;
    checks.commandCenterStaticData.failures.push(`missing dashboard file: ${file}`);
  }
}

if (checks.commandCenterStaticData.pass) {
  const studioText = readText(studioPath);
  const hookText = readText(hookPath);
  const commandCenterText = readText(commandCenterPath);

  if (!/PROTOTYPE_PORTFOLIO/.test(studioText) || !/PROTOTYPE_AGENT_STATUS/.test(studioText)) {
    checks.commandCenterStaticData.pass = false;
    checks.commandCenterStaticData.failures.push("static prototype data exports not found in dashboard/src/data/studio.js");
  }
  if (/readMemory/.test(hookText)) {
    checks.commandCenterStaticData.pass = false;
    checks.commandCenterStaticData.failures.push("useStudioData.js still references readMemory");
  }
  if (!/PROTOTYPE_PORTFOLIO|buildStudioSnapshot/.test(hookText)) {
    checks.commandCenterStaticData.pass = false;
    checks.commandCenterStaticData.failures.push("useStudioData.js does not appear to build from static prototype data");
  }
  if (/fetch\s*\(/.test(commandCenterText) || /askNexus/.test(commandCenterText) || /\/api\//.test(commandCenterText)) {
    checks.commandCenterStaticData.pass = false;
    checks.commandCenterStaticData.failures.push("CommandCenter introduces a live API call");
  }
  if (!/studio/.test(commandCenterText)) {
    checks.commandCenterStaticData.pass = false;
    checks.commandCenterStaticData.failures.push("CommandCenter does not appear to consume the studio hook data");
  }
}

const resultPass = Object.values(checks).every((entry) => entry.pass);
const branch = safeGit("git branch --show-current");
const commit = safeGit("git rev-parse --short HEAD");
const timestamp = new Date().toISOString();

const report = `# NEXUS Data Protection Check

**Timestamp:** ${timestamp}
**Branch:** ${branch}
**Commit:** ${commit}

## Summary

- Required files: ${statusLabel(checks.requiredFiles.pass)}
- Data classes: ${statusLabel(checks.dataClasses.pass)}
- Provider/batch rules: ${statusLabel(checks.providerBatchRules.pass)}
- DB access policy: ${statusLabel(checks.dbAccessPolicy.pass)}
- PII patterns: ${statusLabel(checks.piiPatterns.pass)}
- Hooks documented: ${statusLabel(checks.hooksDocumented.pass)}
- Docs content: ${statusLabel(checks.docsContent.pass)}
- Formatting warnings: ${formattingWarnings.length}
- Command Center static data: ${statusLabel(checks.commandCenterStaticData.pass)}
- Result: ${statusLabel(resultPass)}

## Checks Passed

${Object.entries(checks)
  .filter(([, entry]) => entry.pass)
  .map(([name]) => `- ${name}`)
  .join("\n") || "- none"}

## Checks Failed

${Object.entries(checks)
  .filter(([, entry]) => !entry.pass)
  .map(([name, entry]) => `### ${name}\n${entry.failures.map((failure) => `- ${failure}`).join("\n")}`)
  .join("\n\n") || "- none"}

## Formatting Warnings

${formattingWarnings.map((warning) => `- ${warning}`).join("\n") || "- none"}

## Recommended Next Action

${resultPass
    ? "Implement runtime enforcement later by turning these policies into governor hooks, DB gateway checks, and provider payload guards."
    : "Fix the failing policy/docs/check items before proceeding to runtime enforcement or DB-backed state."}
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

console.log("NEXUS Data Protection Check");
console.log("===========================");
console.log("");
console.log(`Required files: ${statusLabel(checks.requiredFiles.pass)}`);
console.log(`Data classes: ${statusLabel(checks.dataClasses.pass)}`);
console.log(`Provider/batch rules: ${statusLabel(checks.providerBatchRules.pass)}`);
console.log(`DB access policy: ${statusLabel(checks.dbAccessPolicy.pass)}`);
console.log(`PII patterns: ${statusLabel(checks.piiPatterns.pass)}`);
console.log(`Hooks documented: ${statusLabel(checks.hooksDocumented.pass)}`);
console.log(`Docs content: ${statusLabel(checks.docsContent.pass)}`);
console.log(`Formatting warnings: ${formattingWarnings.length}`);
console.log(`Command Center static data: ${statusLabel(checks.commandCenterStaticData.pass)}`);
console.log("");

const flatFailures = Object.entries(checks)
  .flatMap(([name, entry]) => entry.failures.map((failure) => `${name}: ${failure}`));

if (flatFailures.length) {
  console.log("Failures:");
  for (const failure of flatFailures) {
    console.log(`- ${failure}`);
  }
  console.log("");
}

console.log(`Result: ${statusLabel(resultPass)}`);

process.exit(resultPass ? 0 : 1);
