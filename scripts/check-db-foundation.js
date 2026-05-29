/**
 * check-db-foundation.js
 * Validates P41-LOCAL DB Foundation and Durable State.
 * Run: npm run check:db-foundation
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const ROOT = process.cwd();
let pass = 0;
let fail = 0;
const failures = [];

function check(section, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${section}`);
    pass++;
  } else {
    console.log(`  ✗ ${section}${detail ? ` — ${detail}` : ""}`);
    fail++;
    failures.push(`${section}${detail ? `: ${detail}` : ""}`);
  }
}

function readFile(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

function fileExists(relPath) {
  return existsSync(join(ROOT, relPath));
}

const METADATA = {
  generatedAt: new Date().toISOString(),
  phase: "P41-LOCAL",
};

console.log("\nNEXUS DB Foundation Check\n=========================\n");

// ─── 1. Required files ────────────────────────────────────────────────────────
console.log("Required files:");
const REQUIRED_FILES = [
  "db/schema.json",
  "db/schema.sql",
  "db/dbConfig.js",
  "db/dbHealth.js",
  "db/dbRepository.js",
  "db/dbImportPlan.js",
  "db/dbSnapshotMapper.js",
  "db/index.js",
  "policy/db-foundation-policy.json",
  "local-api/routes/db.js",
  "scripts/check-db-foundation.js",
  "scripts/db-foundation-status.js",
];
for (const f of REQUIRED_FILES) {
  check(f, fileExists(f));
}

// ─── 2. Schema JSON ───────────────────────────────────────────────────────────
console.log("\nSchema JSON:");
{
  const content = readFile("db/schema.json");
  check("schema.json exists", content !== null);
  if (content) {
    const s = JSON.parse(content);
    check("phase: P41-LOCAL", s.phase === "P41-LOCAL");
    check("dbWritesEnabled: false", s.dbWritesEnabled === false);
    check("fileFallbackRequired: true", s.fileFallbackRequired === true);
    check("at least 18 entities defined", Array.isArray(s.entities) && s.entities.length >= 18);
    const entityNames = s.entities.map(e => e.name);
    const REQUIRED_ENTITIES = ["projects", "missions", "mission_tasks", "runtime_tasks", "actions",
      "agents", "capabilities", "contracts", "evidence", "audit_events", "runtime_events",
      "approvals", "incidents", "roadmap_phases", "workflow_templates", "implementation_records",
      "review_records", "validation_results"];
    for (const name of REQUIRED_ENTITIES) {
      check(`entity: ${name}`, entityNames.includes(name));
    }
    const allHaveKeys = s.entities.every(e => e.primaryKey && e.fields && e.fileFallbackSource);
    check("All entities have primaryKey, fields, fileFallbackSource", allHaveKeys);
  }
}

// ─── 3. Schema SQL ────────────────────────────────────────────────────────────
console.log("\nSchema SQL:");
{
  const content = readFile("db/schema.sql");
  check("schema.sql exists", content !== null);
  if (content) {
    check("CREATE TABLE projects", content.includes("CREATE TABLE IF NOT EXISTS projects"));
    check("CREATE TABLE evidence", content.includes("CREATE TABLE IF NOT EXISTS evidence"));
    check("CREATE TABLE audit_events", content.includes("CREATE TABLE IF NOT EXISTS audit_events"));
    check("CREATE TABLE runtime_tasks", content.includes("CREATE TABLE IF NOT EXISTS runtime_tasks"));
    check("Has indexes", content.includes("CREATE INDEX IF NOT EXISTS"));
    check("No real DB connection", !content.includes("CONNECT") && !content.includes("\\connect"));
    check("Portable schema artifact remains local-only", !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=/i.test(content));
  }
}

// ─── 4. DB modules exports ────────────────────────────────────────────────────
console.log("\nDB module exports:");
{
  const config = readFile("db/dbConfig.js");
  check("loadDbConfig exported", config?.includes("export function loadDbConfig"));
  check("validateDbConfig exported", config?.includes("export function validateDbConfig"));
  check("getDbMode exported", config?.includes("export function getDbMode"));

  const health = readFile("db/dbHealth.js");
  check("getDbHealth exported", health?.includes("export function getDbHealth"));
  check("getDbReadiness exported", health?.includes("export function getDbReadiness"));
  check("summarizeDbStatus exported", health?.includes("export function summarizeDbStatus"));

  const repo = readFile("db/dbRepository.js");
  check("createDbRepository exported", repo?.includes("export function createDbRepository"));
  check("readEvidence exported", repo?.includes("export function readEvidence"));
  check("writeNotSupportedYet exported", repo?.includes("export function writeNotSupportedYet"));

  const importPlan = readFile("db/dbImportPlan.js");
  check("buildDbImportPlan exported", importPlan?.includes("export function buildDbImportPlan"));
  check("validateDbImportPlan exported", importPlan?.includes("export function validateDbImportPlan"));
  check("summarizeImportReadiness exported", importPlan?.includes("export function summarizeImportReadiness"));

  const mapper = readFile("db/dbSnapshotMapper.js");
  check("mapLocalStateToDbEntities exported", mapper?.includes("export function mapLocalStateToDbEntities"));
  check("createDbSeedPreview exported", mapper?.includes("export function createDbSeedPreview"));
  check("validateDbSeedPreview exported", mapper?.includes("export function validateDbSeedPreview"));
  check("writeDbFoundationStatus exported", mapper?.includes("export function writeDbFoundationStatus"));

  const idx = readFile("db/index.js");
  check("db/index.js re-exports loadDbConfig", idx?.includes("loadDbConfig"));
  check("db/index.js re-exports getDbHealth", idx?.includes("getDbHealth"));
  check("db/index.js re-exports createDbRepository", idx?.includes("createDbRepository"));
  check("db/index.js re-exports buildDbImportPlan", idx?.includes("buildDbImportPlan"));
  check("db/index.js re-exports createDbSeedPreview", idx?.includes("createDbSeedPreview"));
}

// ─── 5. Policy ────────────────────────────────────────────────────────────────
console.log("\nPolicy:");
{
  const content = readFile("policy/db-foundation-policy.json");
  check("File exists", content !== null);
  if (content) {
    const p = JSON.parse(content);
    check("phase: P41-LOCAL", p.phase === "P41-LOCAL");
    check("dbWritesEnabled: false", p.dbWritesEnabled === false);
    check("productionDbAllowed: false", p.productionDbAllowed === false);
    check("externalDbAllowed: false", p.externalDbAllowed === false);
    check("fileFallbackRequired: true", p.fileFallbackRequired === true);
    check("schemaArtifactsAllowed: true", p.schemaArtifactsAllowed === true);
    check("dryRunMappingAllowed: true", p.dryRunMappingAllowed === true);
    check("nextPhase: P42-LOCAL", p.nextPhase === "P42-LOCAL");
  }
}

// ─── 6. Local API /db route ───────────────────────────────────────────────────
console.log("\nLocal API /db route:");
{
  const content = readFile("local-api/routes/db.js");
  check("File exists", content !== null);
  if (content) {
    check("handleDb exported", content.includes("export function handleDb"));
    check("imports getDbHealth", content.includes("getDbHealth"));
    check("imports buildDbImportPlan", content.includes("buildDbImportPlan"));
    check("No DB connections", !content.includes("pg.") && !content.includes("prisma"));
    check("No execSync", !content.includes("execSync") && !content.includes("child_process"));
  }
  const server = readFile("local-api/server.js");
  check("server.js imports db route", server?.includes("routes/db.js"));
  check("server.js has GET /db route", server?.includes('url === "/db"'));
}

// ─── 7. Live server test for /db endpoint ─────────────────────────────────────
console.log("\nLive /db endpoint:");
const TEST_PORT = 4398;
let server;
let serverStarted = false;
try {
  const { startLocalApiServer, stopLocalApiServer } = await import("../local-api/server.js");
  server = await startLocalApiServer({ mode: "local-private", port: TEST_PORT });
  serverStarted = true;

  const base = `http://127.0.0.1:${TEST_PORT}`;
  const r = await fetch(`${base}/db`);
  const d = await r.json();
  check("GET /db returns ok", d.ok === true);
  check("GET /db has generatedAt", typeof d.generatedAt === "string");
  check("GET /db dbBacked: false", d.data?.dbBacked === false);
  check("GET /db entityCount >= 18", d.data?.entityCount >= 18);
  check("GET /db has entities array", Array.isArray(d.data?.entities));
  check("GET /db dbWritesEnabled: false", d.data?.dbWritesEnabled === false);
  check("GET /db fileFallbackRequired: true", d.data?.fileFallbackRequired === true);
  check("GET /db importPlan present", typeof d.data?.importPlan === "object");

  await stopLocalApiServer(server);
  serverStarted = false;
} catch (err) {
  check("Server /db test", false, err.message.slice(0, 80));
  if (serverStarted && server) { try { server.close(); } catch {} }
}

// ─── 8. Dashboard API client ──────────────────────────────────────────────────
console.log("\nDashboard API client:");
{
  const content = readFile("dashboard/src/api/localApiClient.js");
  check("getDbStatus exported", content?.includes("export async function getDbStatus"));
  check("getDbStatus fetches /db", content?.includes('"/db"'));
}

// ─── 9. Dashboard UI ──────────────────────────────────────────────────────────
console.log("\nDashboard UI:");
{
  const content = readFile("dashboard/src/pages/CommandCenterV2.jsx");
  check("DurableStatePage component defined", content?.includes("function DurableStatePage"));
  check("database route wired", content?.includes('currentPage === "database"'));
  check("Durable State nav item", content?.includes('"Durable State"'));
  check("P41 badge on nav item", content?.includes('"P41"'));
  check("P40 COMPLETE in OS Roadmap", content?.includes("P40") && content?.includes("COMPLETE"));
  check("P41 IN_PROGRESS in OS Roadmap", content?.includes("P41") && content?.includes("IN_PROGRESS"));
  check("DB Foundation Boundary in Safety Center", content?.includes("DB Foundation Boundary"));
  check("Durable State page owns persistence posture after compact top bar", content?.includes("function DurableStatePage") && content?.includes("Durable State Summary"));
  check("/db in Live API endpoints", content?.includes('"/db"'));
  check("getDbStatus imported", content?.includes("getDbStatus"));
}

// ─── 10. View model ───────────────────────────────────────────────────────────
console.log("\nView model:");
{
  const content = readFile("dashboard/src/data/commandCenterViewModel.js");
  check("dbFoundation field present", content?.includes("dbFoundation:"));
  check("dbWritesEnabled: false in vm", content?.includes("dbWritesEnabled: false"));
  check("entityCount present in vm", content?.includes("entityCount:"));
  check("phase: P41-LOCAL in vm", content?.includes('"P41-LOCAL"'));
}

// ─── 11. CSS ──────────────────────────────────────────────────────────────────
console.log("\nCSS:");
{
  const content = readFile("dashboard/src/styles-command-center-v2.css");
  check(".ccv2-persistence-badge defined", content?.includes(".ccv2-persistence-badge"));
}

// ─── 12. Package scripts ──────────────────────────────────────────────────────
console.log("\nPackage scripts:");
{
  const pkg = JSON.parse(readFile("package.json") || "{}");
  check("check:db-foundation script", !!pkg.scripts?.["check:db-foundation"]);
  check("db:status script", !!pkg.scripts?.["db:status"]);
}

// ─── 13. Roadmap doc ─────────────────────────────────────────────────────────
console.log("\nRoadmap doc:");
{
  const content = readFile("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
  check("P41 in roadmap doc", content?.includes("P41"));
  check("DB Foundation in roadmap doc", content?.includes("DB Foundation") || content?.includes("Durable State"));
}

// ─── Write report ─────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from "node:fs";
const reportLines = [
  "# NEXUS DB Foundation Check",
  "",
  "## Metadata",
  "",
  `- Generated at: ${METADATA.generatedAt}`,
  `- Phase: ${METADATA.phase}`,
  "",
  `## Result: ${fail === 0 ? "PASS" : "FAIL"}`,
  "",
  `Passed: ${pass}`,
  `Failed: ${fail}`,
  "",
];
if (failures.length) {
  reportLines.push("## Failed checks");
  reportLines.push("");
  failures.forEach(f => reportLines.push(`- ${f}`));
}
try {
  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(join(ROOT, "reports/db-foundation-report.md"), reportLines.join("\n") + "\n");
} catch {}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(56)}`);
console.log(`P41-LOCAL check: ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\nFailed checks:");
  failures.forEach(f => console.log(`  ✗ ${f}`));
  process.exit(1);
} else {
  console.log("All checks passed ✓");
}
