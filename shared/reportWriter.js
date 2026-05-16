import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createReportMetadata, formatReportMetadataMarkdown } from "./reportMetadata.js";

export function ensureReportDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function buildCheckTable(checks = []) {
  const rows = ["| Check | Status | Details |", "| --- | --- | --- |"];
  for (const check of checks) {
    rows.push(`| ${check.name} | ${check.status} | ${check.details || ""} |`);
  }
  return rows.join("\n");
}

export function buildWarningsSection(warnings = []) {
  return ["## Warnings", "", warnings.length ? warnings.map((warning) => `- ${warning}`).join("\n") : "- None"].join("\n");
}

export function buildLimitationsSection(limitations = []) {
  return ["## Limitations", "", limitations.length ? limitations.map((item) => `- ${item}`).join("\n") : "- None"].join("\n");
}

export function writeMarkdownReport(filePath, sections = [], options = {}) {
  ensureReportDir(filePath);
  const metadata = createReportMetadata(options.metadata || options);
  const title = options.title || "NEXUS Report";
  const body = [
    `# ${title}`,
    "",
    formatReportMetadataMarkdown(metadata),
    "",
    ...sections.map((section) => {
      if (typeof section === "string") return section;
      return [`## ${section.title}`, "", section.body || ""].join("\n");
    }),
    "",
  ].join("\n");
  writeFileSync(filePath, body, "utf8");
  return body;
}
