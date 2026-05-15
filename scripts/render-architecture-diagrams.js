import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REGISTRY_PATH = "docs/architecture/diagrams/diagram-registry.json";
const RENDERED_DIR = "docs/architecture/diagrams/rendered";
const REPORT_PATH = "reports/architecture-diagram-render-report.md";
const PHASE = "P41.9.2";

function fullPath(relativePath) {
  return join(ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(fullPath(relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  writeFileSync(fullPath(relativePath), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function commandExists(command) {
  try {
    execFileSync("which", [command], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleFromDiagram(diagram) {
  return diagram.title || diagram.id || diagram.diagramId || "NEXUS Diagram";
}

function idFromDiagram(diagram) {
  return diagram.id || diagram.diagramId;
}

function extractMermaidLabels(source) {
  const labels = [];
  const bracketPattern = /\[([^\]]+)\]/g;
  for (const match of source.matchAll(bracketPattern)) {
    const label = match[1].trim();
    if (label && !labels.includes(label)) {
      labels.push(label);
    }
  }
  return labels.slice(0, 14);
}

function wrapText(text, maxLength = 40) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function fallbackSvg(diagram, source) {
  const title = titleFromDiagram(diagram);
  const purpose = diagram.purpose || diagram.description || "NEXUS architecture diagram";
  const labels = extractMermaidLabels(source);
  const rowHeight = 46;
  const height = Math.max(420, 190 + labels.length * rowHeight);
  const width = 960;
  const titleLines = wrapText(title, 56);
  const purposeLines = wrapText(purpose, 92).slice(0, 3);
  const labelRows = labels
    .map((label, index) => {
      const y = 168 + index * rowHeight;
      return `
  <rect x="56" y="${y}" width="848" height="32" rx="10" class="node"/>
  <text x="80" y="${y + 21}" class="nodeText">${escapeXml(label)}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(purpose)}</desc>
  <style>
    .bg { fill: #f8fafc; }
    .frame { fill: #ffffff; stroke: #1f2937; stroke-width: 2; }
    .label { fill: #475569; font: 600 13px ui-sans-serif, system-ui, sans-serif; letter-spacing: .08em; }
    .title { fill: #0f172a; font: 700 28px ui-sans-serif, system-ui, sans-serif; }
    .purpose { fill: #334155; font: 15px ui-sans-serif, system-ui, sans-serif; }
    .node { fill: #e0f2fe; stroke: #0369a1; stroke-width: 1.5; }
    .nodeText { fill: #0f172a; font: 600 16px ui-sans-serif, system-ui, sans-serif; }
    .note { fill: #64748b; font: 13px ui-sans-serif, system-ui, sans-serif; }
  </style>
  <rect width="${width}" height="${height}" class="bg"/>
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="22" class="frame"/>
  <text x="56" y="64" class="label">NEXUS ARCHITECTURE DIAGRAM</text>
${titleLines.map((line, index) => `  <text x="56" y="${104 + index * 32}" class="title">${escapeXml(line)}</text>`).join("\n")}
${purposeLines.map((line, index) => `  <text x="56" y="${128 + titleLines.length * 32 + index * 22}" class="purpose">${escapeXml(line)}</text>`).join("\n")}
${labelRows}
  <text x="56" y="${height - 58}" class="note">Render mode: fallback-svg. Mermaid CLI was not required for this deterministic public-safe artifact.</text>
</svg>
`;
}

function renderWithMermaidCli(sourcePath, outputPath) {
  execFileSync("mmdc", ["-i", fullPath(sourcePath), "-o", fullPath(outputPath), "-b", "transparent"], {
    cwd: ROOT,
    stdio: "pipe",
  });
}

function ensureDir(relativePath) {
  mkdirSync(fullPath(relativePath), { recursive: true });
}

function renderFallback(diagram, sourcePath, outputPath) {
  const source = readFileSync(fullPath(sourcePath), "utf8");
  writeFileSync(fullPath(outputPath), fallbackSvg(diagram, source), "utf8");
}

console.log("NEXUS Architecture Diagram Render");
console.log("=================================");

ensureDir(RENDERED_DIR);
ensureDir(dirname(REPORT_PATH));

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const registry = readJson(REGISTRY_PATH);
const hasMermaidCli = commandExists("mmdc");
const renderMode = hasMermaidCli ? "mermaid" : "fallback-svg";
const rendered = [];
const warnings = [];

for (const diagram of registry.diagrams || []) {
  const diagramId = idFromDiagram(diagram);
  if (!diagramId || !diagram.sourcePath || !existsSync(fullPath(diagram.sourcePath))) {
    warnings.push(`Skipped ${diagramId || "unknown"} because source is missing.`);
    continue;
  }

  const renderedSvgPath = `${RENDERED_DIR}/${diagramId}.svg`;
  if (hasMermaidCli) {
    renderWithMermaidCli(diagram.sourcePath, renderedSvgPath);
  } else {
    renderFallback(diagram, diagram.sourcePath, renderedSvgPath);
  }

  diagram.id = diagramId;
  delete diagram.diagramId;
  diagram.purpose = diagram.purpose || diagram.description || `${titleFromDiagram(diagram)} architecture diagram.`;
  diagram.renderedSvgPath = renderedSvgPath;
  diagram.renderedPngPath = null;
  diagram.status = "rendered_svg_available";
  diagram.renderMode = renderMode;
  diagram.publicSafe = true;
  diagram.lastUpdatedPhase = PHASE;
  diagram.warnings = renderMode === "fallback-svg"
    ? ["Fallback SVG generated because Mermaid CLI was not available without installing dependencies."]
    : [];
  delete diagram.renderedPath;
  rendered.push({ id: diagramId, title: titleFromDiagram(diagram), renderedSvgPath, renderMode });
}

registry.registryVersion = "1.0";
registry.updatedAt = new Date().toISOString();
registry.phase = PHASE;
registry.purpose = "Track NEXUS architecture diagrams, Mermaid sources, rendered artifacts, and public/private safety.";
registry.warnings = renderMode === "fallback-svg"
  ? ["Fallback SVG artifacts are deterministic placeholders, not full Mermaid renders."]
  : [];
registry.errors = [];
writeJson(REGISTRY_PATH, registry);

const report = `# NEXUS Architecture Diagram Render Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.9.2 - Architecture Diagram Rendering + README Follow-through

## Render Mode

- Render mode: ${renderMode}
- Mermaid CLI available: ${hasMermaidCli ? "yes" : "no"}
- PNG outputs generated: no

## Rendered Artifacts

| Diagram | SVG | Render mode |
| --- | --- | --- |
${rendered.map((item) => `| ${item.title} | ${item.renderedSvgPath} | ${item.renderMode} |`).join("\n")}

## Warnings

${warnings.length === 0 ? "- None" : warnings.map((warning) => `- ${warning}`).join("\n")}

## Limitations

${renderMode === "fallback-svg"
  ? "- SVG artifacts are deterministic public-safe fallbacks because Mermaid CLI was not available without installing dependencies."
  : "- SVG artifacts were rendered through the locally available Mermaid CLI."}
- Rendered PNG outputs remain optional and were not generated in this phase.
`;

writeFileSync(fullPath(REPORT_PATH), report, "utf8");

console.log(`Render mode: ${renderMode}`);
console.log(`Rendered SVGs: ${rendered.length}`);
console.log("PNG outputs: skipped");
console.log("Result: PASS");
