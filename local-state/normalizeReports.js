import { KNOWN_REPORTS } from "./schema.js";
import { readTextSafe } from "./safeFileReader.js";

function countSectionItems(text, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(
    new RegExp(`## ${escapedHeading}\\s*\\n([\\s\\S]*?)(?:\\n## |$)`, "i")
  );

  if (!match) {
    return 0;
  }

  const body = match[1].trim();
  if (!body || /^- none$/im.test(body)) {
    return 0;
  }

  return body
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("- "))
    .length;
}

export function parseReportStatus(text) {
  const reportText = String(text || "");
  const generatedAtMatch = reportText.match(/^- Generated at:\s*(.+)$/m);
  const validationHeadMatch = reportText.match(/^- Validation HEAD:\s*(.+)$/m);
  const warningCountMatch = reportText.match(/(?:^|\n)-?\s*Warnings:\s*(\d+)/i);
  const failureCountMatch = reportText.match(/(?:^|\n)-?\s*Failures:\s*(\d+)/i);

  let status = "UNKNOWN";
  if (/Result:\s*FAIL\b/m.test(reportText) || /## Result[\s\S]*?\n- FAIL\b/i.test(reportText)) {
    status = "FAIL";
  } else if (
    /Result:\s*PASS\b/m.test(reportText) ||
    /## Result[\s\S]*?\n- PASS\b/i.test(reportText)
  ) {
    status = "PASS";
  }

  const warnings = warningCountMatch
    ? Number(warningCountMatch[1])
    : countSectionItems(reportText, "Warnings");
  const failures = failureCountMatch
    ? Number(failureCountMatch[1])
    : countSectionItems(reportText, "Failures");

  return {
    status,
    validationHead: validationHeadMatch ? validationHeadMatch[1].trim() : "",
    generatedAt: generatedAtMatch ? generatedAtMatch[1].trim() : "",
    warnings: Number.isFinite(warnings) ? warnings : 0,
    failures: Number.isFinite(failures) ? failures : 0,
  };
}

export function readValidationReports() {
  const reports = [];
  const errors = [];
  const warnings = [];

  for (const report of KNOWN_REPORTS) {
    const result = readTextSafe(report.path);
    if (!result.ok) {
      warnings.push(`Optional report unavailable: ${report.path}`);
      continue;
    }

    const parsed = parseReportStatus(result.text);
    reports.push({
      id: report.id,
      name: report.name,
      path: report.path,
      status: parsed.status,
      validationHead: parsed.validationHead,
      generatedAt: parsed.generatedAt,
      warnings: parsed.warnings,
      failures: parsed.failures,
    });
  }

  return { reports, errors, warnings };
}

export function summarizeValidationReports(reportState) {
  const reports = Array.isArray(reportState?.reports) ? reportState.reports : [];

  return reports.reduce(
    (summary, report) => {
      summary.total += 1;
      if (report.status === "PASS") {
        summary.pass += 1;
      } else if (report.status === "FAIL") {
        summary.fail += 1;
      } else {
        summary.unknown += 1;
      }

      summary.warnings += Number(report.warnings || 0);
      summary.failures += Number(report.failures || 0);
      return summary;
    },
    {
      total: 0,
      pass: 0,
      fail: 0,
      unknown: 0,
      warnings: 0,
      failures: 0,
    }
  );
}
