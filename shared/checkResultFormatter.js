const VALID_STATUSES = new Set(["PASS", "FAIL", "WARN", "SKIP", "BLOCKED"]);

export function normalizeCheckStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PASSED") return "PASS";
  if (normalized === "FAILED") return "FAIL";
  if (normalized === "SKIPPED") return "SKIP";
  return VALID_STATUSES.has(normalized) ? normalized : "FAIL";
}

export function formatCheckLine(name, status, details = "") {
  const normalized = normalizeCheckStatus(status);
  return `${name}: ${normalized}${details ? ` - ${details}` : ""}`;
}

export function countPassFail(checks = []) {
  return checks.reduce(
    (acc, check) => {
      const status = normalizeCheckStatus(check.status);
      acc.total += 1;
      if (status === "PASS") acc.pass += 1;
      if (status === "FAIL") acc.fail += 1;
      if (status === "WARN") acc.warn += 1;
      if (status === "SKIP") acc.skip += 1;
      if (status === "BLOCKED") acc.blocked += 1;
      return acc;
    },
    { total: 0, pass: 0, fail: 0, warn: 0, skip: 0, blocked: 0 },
  );
}

export function formatCheckSummary(checks = []) {
  const counts = countPassFail(checks);
  return `PASS ${counts.pass}/${counts.total}; FAIL ${counts.fail}; WARN ${counts.warn}; SKIP ${counts.skip}; BLOCKED ${counts.blocked}`;
}

export function printCheckReport(title, checks = [], result = "PASS") {
  console.log(title);
  console.log("=".repeat(title.length));
  for (const check of checks) {
    console.log(formatCheckLine(check.name, check.status, check.details));
  }
  console.log(`Result: ${normalizeCheckStatus(result)}`);
}
