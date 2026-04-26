// skills/auditor/code.static_analysis.js
// Detect TODOs, large functions, unsafe patterns, and console.log leaks.

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);
const ROOT = process.cwd();

async function grep(pattern, dir, opts = "") {
  try {
    const { stdout } = await execAsync(
      `grep -rn ${opts} "${pattern}" "${dir}" --include="*.js" --include="*.ts" --include="*.swift" 2>/dev/null || true`,
      { timeout: 15000 }
    );
    return stdout.trim().split("\n").filter(Boolean);
  } catch { return []; }
}

export async function execute({ project = "careloop" } = {}) {
  const issues = [];
  const backendDir = path.join(ROOT, "projects", project, "src");
  const iosDir     = path.join(ROOT, "projects", `${project}-ios`);

  // TODOs and FIXMEs
  const todos = await grep("TODO|FIXME|HACK|XXX", backendDir, "-E");
  todos.slice(0, 8).forEach(l => issues.push({ severity: "warning", message: `Unresolved marker: ${l.slice(0, 120)}` }));

  // console.log in backend production code (should use structured logger)
  const consoleLogs = await grep("console\\.log", backendDir);
  consoleLogs.slice(0, 5).forEach(l => issues.push({ severity: "warning", message: `console.log in prod: ${l.slice(0, 120)}` }));

  // Unsafe eval
  const evals = await grep("eval(", backendDir);
  evals.forEach(l => issues.push({ severity: "error", message: `Unsafe eval(): ${l.slice(0, 120)}` }));

  // Hardcoded localhost URLs that would break production
  const localUrls = await grep("localhost:3000", iosDir);
  localUrls.slice(0, 3).forEach(l => issues.push({ severity: "error", message: `Hardcoded localhost in iOS: ${l.slice(0, 120)}` }));

  // iOS force unwraps (risky)
  try {
    const { stdout } = await execAsync(
      `grep -rn "!" "${iosDir}" --include="*.swift" | grep -v "!=" | grep -v "//.*!" | grep -v "test" 2>/dev/null | head -10 || true`,
      { timeout: 10000 }
    );
    const forceUnwraps = stdout.trim().split("\n").filter(Boolean);
    if (forceUnwraps.length > 20) {
      issues.push({ severity: "warning", message: `High force-unwrap count in Swift: ${forceUnwraps.length} occurrences` });
    }
  } catch {}

  const hasErrors = issues.some(i => i.severity === "error");
  const summary = `Static analysis: ${issues.filter(i => i.severity === "error").length} errors, ${issues.filter(i => i.severity === "warning").length} warnings`;

  return { result: hasErrors ? "FAIL" : "PASS", issues, summary };
}
