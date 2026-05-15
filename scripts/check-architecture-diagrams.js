import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REGISTRY_PATH = "docs/architecture/diagrams/diagram-registry.json";
const DIAGRAM_README_PATH = "docs/architecture/diagrams/README.md";
const ROOT_README_PATH = "README.md";
const REGISTRY_REPORT_PATH = "reports/architecture-diagram-registry-report.md";
const RENDER_REPORT_PATH = "reports/architecture-diagram-render-report.md";
const PHASE_STATUS_PATH = "os-roadmap/phase-status.json";
const REQUIRED_DIAGRAMS = [
  "nexus-enterprise-architecture",
  "command-center-flow",
  "project-os-boundary",
  "agent-governance",
  "runtime-self-healing",
  "nexus-roadmap",
];
const PUBLIC_SAFE_FORBIDDEN = [
  "CareLoop",
  "DemoApp",
  "projects/careloop",
  "projects/careloop-ios",
  ".env",
  "sk-",
];
const FULL_ROADMAP_MARKERS = ["P26-P41", "P41.5", "P41.6", "P41.7", "P41.8", "P41.9", "P42", "P43", "P44"];
const sections = {
  registry: true,
  mermaidSources: true,
  renderedSvgs: true,
  readmeLinks: true,
  diagramDocsLinks: true,
  architectureRoadmapSeparation: true,
  toolGatewayWording: true,
  publicSafety: true,
  phaseStatus: true,
  formatting: true,
};
const failures = [];

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
  if (!condition) fail(section, message);
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

function isPrettyJson(relativePath) {
  const source = read(relativePath);
  if (!source.trim()) return false;
  try {
    return `${JSON.stringify(JSON.parse(source), null, 2)}\n` === source;
  } catch {
    return false;
  }
}

function diagramId(diagram) {
  return diagram.id || diagram.diagramId;
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

function validateLocalLinks(relativePath, section) {
  for (const target of collectMarkdownLinks(relativePath)) {
    if (!target) continue;
    const resolved = resolve(dirname(fullPath(relativePath)), target);
    check(existsSync(resolved), section, `Broken local link in ${relativePath}: ${target}`);
  }
}

function lineTooLong(relativePath) {
  return read(relativePath)
    .split("\n")
    .some((line) => line.length > 1000);
}

function sourceContainsManyRoadmapMarkers(source) {
  return FULL_ROADMAP_MARKERS.filter((marker) => source.includes(marker)).length >= 4;
}

console.log("NEXUS Architecture Diagram Check");
console.log("================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const registry = parseJson(REGISTRY_PATH, "registry");
const phaseStatus = parseJson(PHASE_STATUS_PATH, "phaseStatus");
const diagrams = Array.isArray(registry.diagrams) ? registry.diagrams : [];
const byId = new Map(diagrams.map((diagram) => [diagramId(diagram), diagram]));

check(existsSync(fullPath(REGISTRY_PATH)), "registry", `${REGISTRY_PATH} is missing`);
check(isPrettyJson(REGISTRY_PATH), "registry", "Registry must be pretty-printed JSON");
check(registry.registryVersion === "1.0", "registry", "Registry version must be 1.0");
check(registry.phase === "P41.9.2", "registry", "Registry phase must be P41.9.2");
check(diagrams.length >= REQUIRED_DIAGRAMS.length, "registry", "Registry must include required diagrams");

for (const requiredId of REQUIRED_DIAGRAMS) {
  check(byId.has(requiredId), "registry", `Missing required diagram: ${requiredId}`);
}

for (const diagram of diagrams) {
  const id = diagramId(diagram);
  check(Boolean(id), "registry", "Every diagram needs id");
  check(Boolean(diagram.title), "registry", `Diagram ${id} missing title`);
  check(Boolean(diagram.purpose), "registry", `Diagram ${id} missing purpose`);
  check(Boolean(diagram.sourcePath), "mermaidSources", `Diagram ${id} missing sourcePath`);
  check(Boolean(diagram.renderedSvgPath), "renderedSvgs", `Diagram ${id} missing renderedSvgPath`);
  check(diagram.publicSafe === true, "publicSafety", `Diagram ${id} must be publicSafe true`);
  check(diagram.lastUpdatedPhase === "P41.9.2", "registry", `Diagram ${id} lastUpdatedPhase must be P41.9.2`);
  check(["mermaid", "fallback-svg", "manual-svg"].includes(diagram.renderMode), "registry", `Diagram ${id} renderMode invalid`);

  if (diagram.sourcePath) {
    check(existsSync(fullPath(diagram.sourcePath)), "mermaidSources", `Missing Mermaid source: ${diagram.sourcePath}`);
    check(diagram.sourcePath.endsWith(".mmd"), "mermaidSources", `Source must be .mmd: ${diagram.sourcePath}`);
  }

  if (diagram.status === "rendered_svg_available") {
    const svg = read(diagram.renderedSvgPath || "");
    check(existsSync(fullPath(diagram.renderedSvgPath || "")), "renderedSvgs", `Missing SVG: ${diagram.renderedSvgPath}`);
    check(svg.trim().length > 0, "renderedSvgs", `SVG is empty: ${diagram.renderedSvgPath}`);
    check(svg.includes("<svg"), "renderedSvgs", `SVG missing <svg: ${diagram.renderedSvgPath}`);
  }

  const combined = `${diagram.title || ""}\n${diagram.purpose || ""}\n${read(diagram.sourcePath || "")}\n${read(diagram.renderedSvgPath || "")}`;
  for (const forbidden of PUBLIC_SAFE_FORBIDDEN) {
    check(!combined.includes(forbidden), "publicSafety", `Diagram ${id} contains forbidden text: ${forbidden}`);
  }
}

const enterpriseSource = read("docs/architecture/diagrams/sources/nexus-enterprise-architecture.mmd");
const roadmapSource = read("docs/architecture/diagrams/sources/nexus-roadmap.mmd");
check(!sourceContainsManyRoadmapMarkers(enterpriseSource), "architectureRoadmapSeparation", "Enterprise diagram contains full roadmap markers");
check(roadmapSource.includes("Completed Foundation"), "architectureRoadmapSeparation", "Roadmap diagram must be separate and grouped");
check(roadmapSource.includes("Enterprise Readiness"), "architectureRoadmapSeparation", "Roadmap diagram missing Enterprise Readiness group");
check(!enterpriseSource.includes("P26-P77"), "architectureRoadmapSeparation", "Enterprise diagram must not mention full roadmap range");

for (const expected of [
  "Tool Registry",
  "MCP Registry",
  "CLI Adapter",
  "API Adapter",
  "Batch Adapter",
  "Lazy Contract Loader",
  "Search / Get Contract / Execute",
  "Policy + Cost + Audit",
]) {
  check(enterpriseSource.includes(expected), "toolGatewayWording", `Tool Gateway missing ${expected}`);
}
check(!enterpriseSource.includes("many MCP servers"), "toolGatewayWording", "Tool Gateway implies many MCP servers are active");

validateLocalLinks(ROOT_README_PATH, "readmeLinks");
validateLocalLinks(DIAGRAM_README_PATH, "diagramDocsLinks");
for (const diagram of REQUIRED_DIAGRAMS) {
  check(read(ROOT_README_PATH).includes(`${diagram}.svg`), "readmeLinks", `README missing rendered SVG link for ${diagram}`);
  check(read(DIAGRAM_README_PATH).includes(`${diagram}.svg`), "diagramDocsLinks", `Diagram README missing SVG link for ${diagram}`);
  check(read(DIAGRAM_README_PATH).includes(`${diagram}.mmd`), "diagramDocsLinks", `Diagram README missing source link for ${diagram}`);
}
check(!read(ROOT_README_PATH).includes(".png)"), "readmeLinks", "README should not link missing PNG artifacts");
check(!read(DIAGRAM_README_PATH).includes(".png)"), "diagramDocsLinks", "Diagram README should not link missing PNG artifacts");

const phaseEntries = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(Array.isArray(phaseStatus.phases) && phaseStatus.phases.length > 0, "phaseStatus", "Phase status must be populated");
check(["P43.1", "P43.2"].includes(phaseStatus.currentPhase), "phaseStatus", "currentPhase must be P43.1 or P43.2");
check(["P42.7", "P43.1"].includes(phaseStatus.previousPhase), "phaseStatus", "previousPhase must be P42.7 or P43.1");
check(["P43.2", "P43.3"].includes(phaseStatus.nextPhase), "phaseStatus", "nextPhase must be P43.2 or P43.3");
check(phaseEntries.get("P41.9.1")?.status === "complete", "phaseStatus", "P41.9.1 must be complete");
check(phaseEntries.get("P41.9.1")?.commit === "41bb0bd", "phaseStatus", "P41.9.1 commit must be 41bb0bd");
check(phaseEntries.get("P41.9.2")?.status === "complete", "phaseStatus", "P41.9.2 must be complete");
check(phaseEntries.get("P41.9.2")?.branch === "docs/architecture-diagram-rendering", "phaseStatus", "P41.9.2 branch mismatch");
check(phaseEntries.get("P41.9.2")?.commit === "8ec2a4c", "phaseStatus", "P41.9.2 commit must be 8ec2a4c");
check(phaseEntries.get("P42.1")?.branch === "arch/project-registry-schema-policy", "phaseStatus", "P42.1 branch mismatch");
check(phaseEntries.get("P42.1")?.commit === "4c1d11d", "phaseStatus", "P42.1 commit must be 4c1d11d");
check(phaseEntries.get("P42.2")?.status === "complete", "phaseStatus", "P42.2 must be complete");
check(phaseEntries.get("P42.2")?.branch === "arch/project-profile-loader-validator", "phaseStatus", "P42.2 branch mismatch");
check(phaseEntries.get("P42.3")?.status === "complete", "phaseStatus", "P42.3 must be complete");
check(phaseEntries.get("P42.6")?.status === "complete", "phaseStatus", "P42.6 must be complete");
check(phaseEntries.get("P42.7")?.status === "complete", "phaseStatus", "P42.7 must be complete");
check(phaseEntries.get("P42.7")?.commit === "e6a98d2", "phaseStatus", "P42.7 commit must be e6a98d2");
check(phaseEntries.get("P43")?.status === "in_progress", "phaseStatus", "P43 must be in_progress");
check(phaseEntries.get("P43.1")?.status === "complete", "phaseStatus", "P43.1 must be complete");
check(["planned", "complete"].includes(phaseEntries.get("P43.2")?.status), "phaseStatus", "P43.2 must exist");

for (const relativePath of [
  REGISTRY_PATH,
  DIAGRAM_README_PATH,
  ROOT_README_PATH,
  ...diagrams.map((diagram) => diagram.sourcePath).filter(Boolean),
  ...diagrams.map((diagram) => diagram.renderedSvgPath).filter(Boolean),
]) {
  check(!lineTooLong(relativePath), "formatting", `Line over 1000 chars in ${relativePath}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const renderedRows = diagrams
  .map((diagram) => `| ${diagram.title || diagramId(diagram)} | ${diagram.status || "unknown"} | ${diagram.renderMode || "unknown"} | ${diagram.renderedSvgPath || "missing"} |`)
  .join("\n");

const registryReport = `# NEXUS Architecture Diagram Registry Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.9.2 - Architecture Diagram Rendering + README Follow-through

## Summary

- Registry version: ${registry.registryVersion || "unknown"}
- Diagrams registered: ${diagrams.length}
- Rendered SVG artifacts: ${diagrams.filter((diagram) => diagram.status === "rendered_svg_available").length}
- Render modes: ${[...new Set(diagrams.map((diagram) => diagram.renderMode).filter(Boolean))].join(", ") || "unknown"}

## Diagrams

| Diagram | Status | Render mode | Rendered SVG |
| --- | --- | --- | --- |
${renderedRows}

## Checks

- Registry: ${sections.registry ? "PASS" : "FAIL"}
- Mermaid sources: ${sections.mermaidSources ? "PASS" : "FAIL"}
- Rendered SVGs: ${sections.renderedSvgs ? "PASS" : "FAIL"}
- README links: ${sections.readmeLinks ? "PASS" : "FAIL"}
- Diagram docs links: ${sections.diagramDocsLinks ? "PASS" : "FAIL"}
- Architecture/roadmap separation: ${sections.architectureRoadmapSeparation ? "PASS" : "FAIL"}
- Tool gateway wording: ${sections.toolGatewayWording ? "PASS" : "FAIL"}
- Public safety: ${sections.publicSafety ? "PASS" : "FAIL"}
- Phase status: ${sections.phaseStatus ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

const existingRenderReport = read(RENDER_REPORT_PATH).split("\n\n## Validation")[0].trim();
const renderReport = `${existingRenderReport}

## Validation

- Registry checker branch: ${branch}
- Registry checker HEAD: ${head}
- Registry checker result: ${result}
`;

writeFileSync(fullPath(REGISTRY_REPORT_PATH), registryReport, "utf8");
writeFileSync(fullPath(RENDER_REPORT_PATH), `${renderReport}\n`, "utf8");

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
console.log(`Registry: ${sections.registry ? "PASS" : "FAIL"}`);
console.log(`Mermaid sources: ${sections.mermaidSources ? "PASS" : "FAIL"}`);
console.log(`Rendered SVGs: ${sections.renderedSvgs ? "PASS" : "FAIL"}`);
console.log(`README links: ${sections.readmeLinks ? "PASS" : "FAIL"}`);
console.log(`Diagram docs links: ${sections.diagramDocsLinks ? "PASS" : "FAIL"}`);
console.log(`Architecture/roadmap separation: ${sections.architectureRoadmapSeparation ? "PASS" : "FAIL"}`);
console.log(`Tool gateway wording: ${sections.toolGatewayWording ? "PASS" : "FAIL"}`);
console.log(`Public safety: ${sections.publicSafety ? "PASS" : "FAIL"}`);
console.log(`Phase status: ${sections.phaseStatus ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
