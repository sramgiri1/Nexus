// skills/auditor/code.diff_review.js
// Analyze git diff for changed files and flag high-risk changes.

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);
const ROOT = process.cwd();

const HIGH_RISK_PATTERNS = [
  { pattern: /auth/i,       label: "Auth change" },
  { pattern: /schema\.prisma/, label: "Schema migration" },
  { pattern: /middleware/i, label: "Middleware change" },
  { pattern: /\.env/,       label: "Env file change" },
  { pattern: /password|secret|token|key/i, label: "Security-sensitive path" },
];

export async function execute({ base = "HEAD~1", project = "careloop" } = {}) {
  const issues = [];
  const projectDir = path.join(ROOT, "projects", project);

  let changedFiles = [];
  let additions = 0;
  let deletions = 0;

  try {
    // Get changed files
    const { stdout: fileList } = await execAsync(
      `git -C "${ROOT}" diff ${base} --name-only 2>/dev/null || git -C "${ROOT}" diff HEAD --name-only 2>/dev/null || echo ""`,
      { timeout: 15000 }
    );
    changedFiles = fileList.trim().split("\n").filter(Boolean);

    // Get stat summary
    const { stdout: stat } = await execAsync(
      `git -C "${ROOT}" diff ${base} --shortstat 2>/dev/null || echo "no stat"`,
      { timeout: 10000 }
    );
    const addMatch = stat.match(/(\d+) insertion/);
    const delMatch = stat.match(/(\d+) deletion/);
    additions = addMatch ? parseInt(addMatch[1]) : 0;
    deletions = delMatch ? parseInt(delMatch[1]) : 0;
  } catch (e) {
    return { result: "INFO", issues: [], summary: `Git diff unavailable: ${e.message.slice(0, 80)}` };
  }

  // Flag high-risk files
  for (const file of changedFiles) {
    for (const { pattern, label } of HIGH_RISK_PATTERNS) {
      if (pattern.test(file)) {
        issues.push({ severity: "warning", message: `${label}: ${file}` });
        break;
      }
    }
  }

  // Large diff warning
  if (additions + deletions > 500) {
    issues.push({ severity: "warning", message: `Large diff: +${additions} -${deletions} lines across ${changedFiles.length} files` });
  }

  // .env tracked warning
  const envTracked = changedFiles.some(f => f.endsWith(".env") && !f.endsWith(".example"));
  if (envTracked) {
    issues.push({ severity: "error", message: ".env file detected in diff — do not commit secrets" });
  }

  const hasErrors = issues.some(i => i.severity === "error");
  return {
    result: hasErrors ? "FAIL" : "PASS",
    issues,
    summary: `Diff: ${changedFiles.length} files changed, +${additions} -${deletions}. Risk flags: ${issues.length}`,
  };
}
