import { execFileSync } from "node:child_process";

function safeGit(args, fallback = "unknown") {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim() || fallback;
  } catch {
    return fallback;
  }
}

export function getGitBranch() {
  return safeGit(["branch", "--show-current"]);
}

export function getGitHead() {
  return safeGit(["rev-parse", "--short", "HEAD"]);
}

export function getGeneratedAt(date = new Date()) {
  return date.toISOString();
}

export function createReportMetadata(options = {}) {
  return {
    generatedAt: options.generatedAt || getGeneratedAt(),
    validationBranch: options.validationBranch || options.branch || getGitBranch(),
    validationHead: options.validationHead || options.head || getGitHead(),
    phase: options.phase,
    note:
      options.note
      || "Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
  };
}

export function formatReportMetadataMarkdown(metadata = createReportMetadata()) {
  const lines = [
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.validationBranch}`,
    `- Validation HEAD: ${metadata.validationHead}`,
    `- Note: ${metadata.note}`,
  ];
  if (metadata.phase) lines.splice(2, 0, `- Phase: ${metadata.phase}`);
  return lines.join("\n");
}
