import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");

const files = {
  plan: "projects/careloop/docs/PREMIUM_PHASE_PLAN.md",
  prd: "projects/careloop/docs/PRD.md",
  status: "projects/careloop/docs/NEXUS_PROJECT_STATUS.md",
  roadmap: "project-roadmap/careloop-roadmap.json",
  phaseStatus: "project-roadmap/careloop-phase-status.json",
  projectProfile: "projects/careloop/nexus.project.json",
  testSuites: "test-suite/projectTestSuites.js",
};

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const requiredPlanPhrases = [
  "Premium is purchased per care receiver",
  "free Care Circle supports exactly one active care receiver",
  "Ask organizer to upgrade",
  "auto-dismiss after 7 days",
  "once per receiver lifetime",
  "Phase P8: Demo And StoreKit Hardening",
];

const requiredPrdPhrases = [
  "Adding a second care receiver triggers an upgrade choice sheet",
  "Caregiver upgrade requests appear only in Care Receiver Management",
  "Each caregiver can request premium once per receiver lifetime",
  "Existing data remains visible after premium expiry",
];

const failures = [];

for (const [label, relativePath] of Object.entries(files)) {
  if (!fs.existsSync(path.join(ROOT, relativePath))) {
    failures.push(`${label} file is missing: ${relativePath}`);
  }
}

if (failures.length === 0) {
  const plan = read(files.plan);
  const prd = read(files.prd);
  const status = read(files.status);
  const roadmap = readJson(files.roadmap);
  const phaseStatus = readJson(files.phaseStatus);
  const projectProfile = readJson(files.projectProfile);
  const testSuites = read(files.testSuites);

  for (const phrase of requiredPlanPhrases) {
    if (!plan.includes(phrase)) failures.push(`premium plan missing phrase: ${phrase}`);
  }

  for (const phrase of requiredPrdPhrases) {
    if (!prd.includes(phrase)) failures.push(`PRD missing phrase: ${phrase}`);
  }

  if (!status.includes("CARELOOP-P3-PREMIUM")) {
    failures.push("NEXUS project status must reference CARELOOP-P3-PREMIUM");
  }

  if (phaseStatus.activePhase !== "CARELOOP-P3-PREMIUM") {
    failures.push("careloop-phase-status activePhase must be CARELOOP-P3-PREMIUM");
  }

  if (phaseStatus.status !== "in_progress") {
    failures.push("careloop-phase-status status must be in_progress");
  }

  const premiumPhase = (roadmap.phases || []).find((phase) => phase.phaseId === "CARELOOP-P3-PREMIUM");
  if (!premiumPhase) {
    failures.push("careloop-roadmap missing CARELOOP-P3-PREMIUM");
  } else if (premiumPhase.status !== "in_progress") {
    failures.push("CARELOOP-P3-PREMIUM roadmap status must be in_progress");
  }

  if (projectProfile.metadata?.phaseId !== "CARELOOP-P3-PREMIUM") {
    failures.push("nexus.project.json metadata.phaseId must be CARELOOP-P3-PREMIUM");
  }

  if (!testSuites.includes("premium-plan")) {
    failures.push("project test suites must include premium-plan");
  }
}

if (failures.length > 0) {
  console.error("CareLoop premium phase plan check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("CareLoop premium phase plan check passed.");
