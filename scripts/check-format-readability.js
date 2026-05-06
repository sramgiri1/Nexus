import fs from "fs";
import path from "path";
import { execSync, spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, "reports", "format-readability-report.md");

const markdownFiles = [
  ...listTopLevelFiles("docs/architecture", ".md"),
  ...listTopLevelFiles("docs/tooling", ".md"),
  ...listTopLevelFiles("hooks", ".md"),
  ...listTopLevelFiles("reports", ".md"),
  "README.md",
  "AGENTS.md",
  ...listSkillFiles(),
];

const javascriptFiles = [
  "scripts/check-agent-os-readiness.js",
  "scripts/check-agent-context.js",
  "scripts/check-data-protection.js",
  "scripts/check-format-readability.js",
  "scripts/check-security-boundary.js",
  "orchestrator/agentContext.js",
  "dashboard/src/data/studio.js",
  "dashboard/src/hooks/useStudioData.js",
  "dashboard/src/pages/CommandCenter.jsx",
  "dashboard/tests/routes.spec.js",
];

const jsonFiles = [
  "policy/data-classification-policy.json",
  "policy/database-access-policy.json",
  "policy/security-boundary-policy.json",
  "policy/network-policy.json",
  "policy/secret-boundary-policy.json",
  "policy/mcp-security-policy.json",
  "policy/approval-policy.json",
  "security/pii-patterns.json",
];

const filesChecked = [...new Set([...markdownFiles, ...javascriptFiles, ...jsonFiles])].filter(exists);

const warnings = [];
const failures = [];
const longestLines = [];

function listTopLevelFiles(dir, ext) {
  const absDir = path.join(repoRoot, dir);
  if (!fs.existsSync(absDir)) return [];

  return fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(ext))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function listSkillFiles() {
  const absDir = path.join(repoRoot, ".codex", "skills");
  if (!fs.existsSync(absDir)) return [];

  return fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(".codex", "skills", entry.name, "SKILL.md"))
    .filter(exists)
    .sort();
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
}

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

function isRegexJsonLine(relPath, line) {
  return relPath.endsWith(".json") && /"regex"\s*:\s*"/.test(line);
}

function recordLineLengths(relPath, text) {
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const length = line.length;
    const label = `${relPath}:${index + 1}:${length}`;

    longestLines.push({
      file: relPath,
      line: index + 1,
      length,
      preview: line.slice(0, 160),
    });

    if (length > 300) {
      warnings.push(label);
    }

    if (length > 1000 && !isRegexJsonLine(relPath, line)) {
      failures.push(`${label} exceeds 1000 characters`);
    }
  });
}

function checkJsonFile(relPath) {
  const text = readText(relPath);
  recordLineLengths(relPath, text);

  try {
    JSON.parse(text);
  } catch (error) {
    failures.push(`${relPath} failed JSON parse: ${error.message}`);
  }
}

function checkJsSyntax(relPath) {
  if (relPath.endsWith(".jsx")) {
    const text = readText(relPath);
    recordLineLengths(relPath, text);

    if (!hasBalancedDelimiters(text)) {
      failures.push(`${relPath} appears to have unbalanced delimiters`);
    }
    return;
  }

  const text = readText(relPath);
  recordLineLengths(relPath, text);

  const result = spawnSync(process.execPath, ["--check", relPath], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "syntax check failed").trim();
    failures.push(`${relPath} failed syntax check: ${detail}`);
  }
}

function hasBalancedDelimiters(text) {
  const stack = [];
  const pairs = {
    ")": "(",
    "]": "[",
    "}": "{",
  };
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (const char of text) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (!inDouble && !inTemplate && char === "'") {
      inSingle = !inSingle;
      continue;
    }

    if (!inSingle && !inTemplate && char === "\"") {
      inDouble = !inDouble;
      continue;
    }

    if (!inSingle && !inDouble && char === "`") {
      inTemplate = !inTemplate;
      continue;
    }

    if (inSingle || inDouble || inTemplate) continue;

    if (char === "(" || char === "[" || char === "{") {
      stack.push(char);
      continue;
    }

    if (char === ")" || char === "]" || char === "}") {
      if (stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }

  return !inSingle && !inDouble && !inTemplate && stack.length === 0;
}

for (const relPath of markdownFiles.filter(exists)) {
  recordLineLengths(relPath, readText(relPath));
}

for (const relPath of javascriptFiles.filter(exists)) {
  checkJsSyntax(relPath);
}

for (const relPath of jsonFiles.filter(exists)) {
  checkJsonFile(relPath);
}

longestLines.sort((a, b) => b.length - a.length || a.file.localeCompare(b.file) || a.line - b.line);

const topLongest = longestLines.slice(0, 20);
const branch = safeGit("git branch --show-current");
const commit = safeGit("git rev-parse --short HEAD");
const timestamp = new Date().toISOString();
const passed = failures.length === 0;

const report = `# Format Readability Report

## Metadata

- Generated at: ${timestamp}
- Validation branch: ${branch}
- Validation HEAD: ${commit}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Summary

- Files checked: ${filesChecked.length}

## Warnings

${warnings.length ? warnings.map((item) => `- ${item}`).join("\n") : "- none"}

## Failures

${failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- none"}

## Top Longest Lines

${topLongest.length
    ? topLongest
        .map(
          (item) =>
            `- ${item.file}:${item.line} (${item.length}) — ${item.preview.trimEnd().replace(/\|/g, "\\|")}`
        )
        .join("\n")
    : "- none"}

## Result

- ${passed ? "PASS" : "FAIL"}
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

console.log("NEXUS Format Readability Check");
console.log("==============================");
console.log("");
console.log(`Files checked: ${filesChecked.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);
console.log("");

if (warnings.length) {
  console.log("Warnings:");
  for (const item of warnings.slice(0, 20)) {
    console.log(`- ${item}`);
  }
  console.log("");
}

if (failures.length) {
  console.log("Failures:");
  for (const item of failures) {
    console.log(`- ${item}`);
  }
  console.log("");
}

console.log("Top longest lines:");
for (const item of topLongest) {
  console.log(`- ${item.file}:${item.line} (${item.length})`);
}
console.log("");
console.log(`Result: ${passed ? "PASS" : "FAIL"}`);

process.exit(passed ? 0 : 1);
