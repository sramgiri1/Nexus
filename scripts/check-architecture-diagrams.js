import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REGISTRY_PATH = "docs/architecture/diagrams/diagram-registry.json";
const DIAGRAM_README_PATH = "docs/architecture/diagrams/README.md";
const REPORT_PATH = "reports/architecture-diagram-registry-report.md";
const PHASE_STATUS_PATH = "os-roadmap/phase-status.json";
const REQUIRED_DIAGRAMS = [
  "nexus-enterprise-architecture",
  "command-center-flow",
  "project-os-boundary",
  "agent-governance",
  "runtime-self-healing",
  "nexus-roadmap",
];
const REQUIRED_ENTRY_FIELDS = ["diagramId", "title", "status", "sourcePath", "renderedPath", "publicSafe"];
const RENDERED_MISSING_ALLOWED = new Set(["planned", "source_available"]);
const PUBLIC_SAFE_FORBIDDEN = ["CareLoop", "DemoApp", "projects/careloop", "projects/careloop-ios", ".env"];

const sections = {
  registry: true,
  requiredDiagrams: true,
  mermaidSources: true,
  renderedPathPolicy: true,
  publicSafety: true,
  readmeLinks: true,
  phaseStatus: true,
  report: true,
  formatting: true,
};

const failures = [];
const warnings = [];

function fullPath(relativePath) {
  return join(ROOT, relativePath);
}

function read(relativePath) {
  const path = fullPath(relativePath);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function fail(section, message) {
  sections[section] = false;
  failures.push(message);
}

function check(condition, section, message) {
  if (!condition) {
    fail(section, message);
  }
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function parseJson(relativePath, section) {
  const source = read(relativePath);
  if (!source.trim()) {
    fail(section, `${relativePath} is missing or empty`);
    return {};
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    fail(section, `${relativePath} did not parse: ${error.message}`);
    return {};
  }
}

function collectMarkdownLinks(relativePath) {
  const source = read(relativePath);
  const links = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of source.matchAll(regex)) {
    const target = match[1];
    if (!target || target.startsWith("#") || target.startsWith("http://") || target.startsWith("https://")) {
      continue;
    }
    links.push(target.split("#")[0]);
  }

  return links;
}

function validateLocalLinks(relativePath) {
  for (const target of collectMarkdownLinks(relativePath)) {
    if (!target) continue;
    const resolved = resolve(dirname(fullPath(relativePath)), target);
    check(existsSync(resolved), "readmeLinks", `Broken local link in ${relativePath}: ${target}`);
  }
}

function lineTooLong(relativePath) {
  return read(relativePath)
    .split("\n")
    .some((line) => line.length > 1000);
}

console.log("NEXUS Architecture Diagram Registry Check");
console.log("=========================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const registry = parseJson(REGISTRY_PATH, "registry");
const diagramReadme = read(DIAGRAM_README_PATH);
const phaseStatus = parseJson(PHASE_STATUS_PATH, "phaseStatus");

check(existsSync(fullPath(REGISTRY_PATH)), "registry", `${REGISTRY_PATH} is missing`);
check(registry.registryVersion === "1.0", "registry", "Registry version must be 1.0");
check(registry.phase === "P41.9.1", "registry", "Registry phase must be P41.9.1");
check(Array.isArray(registry.diagrams), "registry", "Registry must include diagrams array");
check(existsSync(fullPath(DIAGRAM_README_PATH)), "readmeLinks", `${DIAGRAM_README_PATH} is missing`);

const diagrams = Array.isArray(registry.diagrams) ? registry.diagrams : [];
const diagramsById = new Map(diagrams.map((diagram) => [diagram.diagramId, diagram]));

for (const requiredId of REQUIRED_DIAGRAMS) {
  check(diagramsById.has(requiredId), "requiredDiagrams", `Missing required diagram: ${requiredId}`);
}

for (const diagram of diagrams) {
  for (const field of REQUIRED_ENTRY_FIELDS) {
    check(Object.hasOwn(diagram, field), "registry", `Diagram ${diagram.diagramId || "unknown"} missing ${field}`);
  }

  check(
    typeof diagram.publicSafe === "boolean",
    "registry",
    `Diagram ${diagram.diagramId || "unknown"} publicSafe must be boolean`,
  );

  if (diagram.sourcePath) {
    check(existsSync(fullPath(diagram.sourcePath)), "mermaidSources", `Missing source: ${diagram.sourcePath}`);
    check(diagram.sourcePath.endsWith(".mmd"), "mermaidSources", `Source must be Mermaid .mmd: ${diagram.sourcePath}`);
  }

  if (diagram.renderedPath) {
    const renderedExists = existsSync(fullPath(diagram.renderedPath));
    const missingAllowed = RENDERED_MISSING_ALLOWED.has(diagram.status);
    check(
      renderedExists || missingAllowed,
      "renderedPathPolicy",
      `Rendered path missing for non-planned diagram ${diagram.diagramId}: ${diagram.renderedPath}`,
    );
  }

  if (diagram.publicSafe) {
    const source = read(diagram.sourcePath || "");
    const combined = `${diagram.title || ""}\n${diagram.description || ""}\n${source}`;
    for (const forbidden of PUBLIC_SAFE_FORBIDDEN) {
      check(
        !combined.includes(forbidden),
        "publicSafety",
        `Public-safe diagram ${diagram.diagramId} contains forbidden text: ${forbidden}`,
      );
    }
  }
}

const enterpriseSource = read("docs/architecture/diagrams/sources/nexus-enterprise-architecture.mmd");
check(
  !enterpriseSource.includes("P41.9") && !enterpriseSource.includes("P42") && !enterpriseSource.includes("P78"),
  "publicSafety",
  "Enterprise architecture diagram must not include the full roadmap",
);
check(
  read("docs/architecture/diagrams/sources/nexus-roadmap.mmd").includes("P41.9"),
  "requiredDiagrams",
  "Roadmap diagram should contain grouped roadmap phases",
);

for (const expected of ["diagram-registry.json", "sources/", "source_available", "rendered image planned"]) {
  check(diagramReadme.includes(expected), "readmeLinks", `Diagram README missing: ${expected}`);
}
validateLocalLinks(DIAGRAM_README_PATH);

const phaseEntries = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(Array.isArray(phaseStatus.phases) && phaseStatus.phases.length > 0, "phaseStatus", "Phase status is empty");
check(phaseStatus.currentPhase === "P41.9.1", "phaseStatus", "currentPhase must be P41.9.1");
check(phaseStatus.previousPhase === "P41.8.6", "phaseStatus", "previousPhase must be P41.8.6");
check(phaseStatus.nextPhase === "P41.9.2", "phaseStatus", "nextPhase must be P41.9.2");
check(phaseEntries.get("P41.8.6")?.status === "complete", "phaseStatus", "P41.8.6 must be complete");
check(phaseEntries.get("P41.8.6")?.commit === "867d899", "phaseStatus", "P41.8.6 commit must be 867d899");
check(phaseEntries.get("P41.8")?.status === "complete", "phaseStatus", "P41.8 parent must be complete");
check(phaseEntries.get("P41.9")?.status === "in_progress", "phaseStatus", "P41.9 parent must be in_progress");
check(phaseEntries.has("P41.9.1"), "phaseStatus", "P41.9.1 must exist");
check(phaseEntries.has("P41.9.2"), "phaseStatus", "P41.9.2 must exist");

for (const relativePath of [
  REGISTRY_PATH,
  DIAGRAM_README_PATH,
  ...diagrams.map((diagram) => diagram.sourcePath).filter(Boolean),
]) {
  check(!lineTooLong(relativePath), "formatting", `Line over 1000 chars in ${relativePath}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

const report = `# NEXUS Architecture Diagram Registry Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.9.1 - Architecture Diagram Registry Foundation

## Summary

- Registry version: ${registry.registryVersion || "unknown"}
- Diagrams registered: ${diagrams.length}
- Required diagrams present: ${sections.requiredDiagrams ? "PASS" : "FAIL"}
- Rendered artifact policy: ${sections.renderedPathPolicy ? "PASS" : "FAIL"}
- Public-safe source validation: ${sections.publicSafety ? "PASS" : "FAIL"}

## Diagrams

| Diagram | Status | Source | Rendered artifact |
| --- | --- | --- | --- |
${diagrams
  .map((diagram) => {
    const source = diagram.sourcePath && existsSync(fullPath(diagram.sourcePath)) ? "present" : "missing";
    const rendered = diagram.renderedPath && existsSync(fullPath(diagram.renderedPath)) ? "present" : "planned";
    return `| ${diagram.title || diagram.diagramId} | ${diagram.status || "unknown"} | ${source} | ${rendered} |`;
  })
  .join("\n")}

## Checks

- Registry: ${sections.registry ? "PASS" : "FAIL"}
- Required diagrams: ${sections.requiredDiagrams ? "PASS" : "FAIL"}
- Mermaid sources: ${sections.mermaidSources ? "PASS" : "FAIL"}
- Rendered-path policy: ${sections.renderedPathPolicy ? "PASS" : "FAIL"}
- Public safety: ${sections.publicSafety ? "PASS" : "FAIL"}
- README links: ${sections.readmeLinks ? "PASS" : "FAIL"}
- Phase status: ${sections.phaseStatus ? "PASS" : "FAIL"}
- Report: ${sections.report ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}

## Warnings

${warnings.length === 0 ? "- None" : warnings.map((warning) => `- ${warning}`).join("\n")}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

try {
  writeFileSync(fullPath(REPORT_PATH), report, "utf8");
} catch (error) {
  fail("report", `Could not write ${REPORT_PATH}: ${error.message}`);
}

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Registry: ${sections.registry ? "PASS" : "FAIL"}`);
console.log(`Required diagrams: ${sections.requiredDiagrams ? "PASS" : "FAIL"}`);
console.log(`Mermaid sources: ${sections.mermaidSources ? "PASS" : "FAIL"}`);
console.log(`Rendered-path policy: ${sections.renderedPathPolicy ? "PASS" : "FAIL"}`);
console.log(`Public safety: ${sections.publicSafety ? "PASS" : "FAIL"}`);
console.log(`README links: ${sections.readmeLinks ? "PASS" : "FAIL"}`);
console.log(`Phase status: ${sections.phaseStatus ? "PASS" : "FAIL"}`);
console.log(`Report: ${sections.report ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
