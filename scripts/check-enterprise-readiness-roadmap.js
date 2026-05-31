import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/enterprise-readiness-roadmap-report.md";
const DOC_PATH = "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|approval gate|dry run|preview|readiness gate|contract)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const phaseStatus = readJson("os-roadmap/phase-status.json");
const phaseIndex = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
const doc = readText(DOC_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readmeEnterpriseSlice = readme.match(/- P133-P145 enterprise readiness roadmap:[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const platformEnterpriseSlice = platformRoadmap.match(/## P133-P145 Enterprise Readiness Roadmap[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const checkerSource = readText("scripts/check-enterprise-readiness-roadmap.js");
const changed = changedFiles();
const p1331StartedState =
  phaseStatus.currentPhase === "P133.1"
  && phaseStatus.previousPhase === "P132.7"
  && phaseStatus.nextPhase === "P133.2"
  && phaseIndex.currentPhase === "P133.1"
  && phaseIndex.previousPhase === "P132.7"
  && phaseIndex.nextPhase === "P133.2"
  && phaseStatus.current?.phaseId === "P133.1"
  && phaseStatus.previous?.phaseId === "P132.7"
  && phaseStatus.next?.phaseId === "P133.2"
  && phaseIndex.current?.phaseId === "P133.1"
  && phaseIndex.previous?.phaseId === "P132.7"
  && phaseIndex.next?.phaseId === "P133.2";
const p1332CompleteState =
  phaseStatus.currentPhase === "P133.2"
  && phaseStatus.previousPhase === "P133.1"
  && phaseStatus.nextPhase === "P133.3"
  && phaseIndex.currentPhase === "P133.2"
  && phaseIndex.previousPhase === "P133.1"
  && phaseIndex.nextPhase === "P133.3"
  && phaseStatus.current?.phaseId === "P133.2"
  && phaseStatus.previous?.phaseId === "P133.1"
  && phaseStatus.next?.phaseId === "P133.3"
  && phaseIndex.current?.phaseId === "P133.2"
  && phaseIndex.previous?.phaseId === "P133.1"
  && phaseIndex.next?.phaseId === "P133.3";
const p1333CompleteState =
  phaseStatus.currentPhase === "P133.3"
  && phaseStatus.previousPhase === "P133.2"
  && phaseStatus.nextPhase === "P133.4"
  && phaseIndex.currentPhase === "P133.3"
  && phaseIndex.previousPhase === "P133.2"
  && phaseIndex.nextPhase === "P133.4"
  && phaseStatus.current?.phaseId === "P133.3"
  && phaseStatus.previous?.phaseId === "P133.2"
  && phaseStatus.next?.phaseId === "P133.4"
  && phaseIndex.current?.phaseId === "P133.3"
  && phaseIndex.previous?.phaseId === "P133.2"
  && phaseIndex.next?.phaseId === "P133.4";
const p1334CompleteState =
  phaseStatus.currentPhase === "P133.4"
  && phaseStatus.previousPhase === "P133.3"
  && phaseStatus.nextPhase === "P133.5"
  && phaseIndex.currentPhase === "P133.4"
  && phaseIndex.previousPhase === "P133.3"
  && phaseIndex.nextPhase === "P133.5"
  && phaseStatus.current?.phaseId === "P133.4"
  && phaseStatus.previous?.phaseId === "P133.3"
  && phaseStatus.next?.phaseId === "P133.5"
  && phaseIndex.current?.phaseId === "P133.4"
  && phaseIndex.previous?.phaseId === "P133.3"
  && phaseIndex.next?.phaseId === "P133.5";
const p1335CompleteState =
  phaseStatus.currentPhase === "P133.5"
  && phaseStatus.previousPhase === "P133.4"
  && phaseStatus.nextPhase === "P133.6"
  && phaseIndex.currentPhase === "P133.5"
  && phaseIndex.previousPhase === "P133.4"
  && phaseIndex.nextPhase === "P133.6"
  && phaseStatus.current?.phaseId === "P133.5"
  && phaseStatus.previous?.phaseId === "P133.4"
  && phaseStatus.next?.phaseId === "P133.6"
  && phaseIndex.current?.phaseId === "P133.5"
  && phaseIndex.previous?.phaseId === "P133.4"
  && phaseIndex.next?.phaseId === "P133.6";
const p1336CompleteState =
  phaseStatus.currentPhase === "P133.6"
  && phaseStatus.previousPhase === "P133.5"
  && phaseStatus.nextPhase === "P133.7"
  && phaseIndex.currentPhase === "P133.6"
  && phaseIndex.previousPhase === "P133.5"
  && phaseIndex.nextPhase === "P133.7"
  && phaseStatus.current?.phaseId === "P133.6"
  && phaseStatus.previous?.phaseId === "P133.5"
  && phaseStatus.next?.phaseId === "P133.7"
  && phaseIndex.current?.phaseId === "P133.6"
  && phaseIndex.previous?.phaseId === "P133.5"
  && phaseIndex.next?.phaseId === "P133.7";
const p1337FinalState =
  phaseStatus.currentPhase === "P133.7"
  && phaseStatus.previousPhase === "P133.6"
  && phaseStatus.nextPhase === "P134"
  && phaseIndex.currentPhase === "P133.7"
  && phaseIndex.previousPhase === "P133.6"
  && phaseIndex.nextPhase === "P134"
  && phaseStatus.current?.phaseId === "P133.7"
  && phaseStatus.previous?.phaseId === "P133.6"
  && phaseStatus.next?.phaseId === "P134"
  && phaseIndex.current?.phaseId === "P133.7"
  && phaseIndex.previous?.phaseId === "P133.6"
  && phaseIndex.next?.phaseId === "P134"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6", "P133.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P134")?.status === "planned"
  && indexById.get("P134")?.status === "planned";
const p133ActiveState = p1331StartedState || p1332CompleteState || p1333CompleteState || p1334CompleteState || p1335CompleteState || p1336CompleteState || p1337FinalState;
const p1341StartedState =
  phaseStatus.currentPhase === "P134.1"
  && phaseStatus.previousPhase === "P133.7"
  && phaseStatus.nextPhase === "P134.2"
  && phaseIndex.currentPhase === "P134.1"
  && phaseIndex.previousPhase === "P133.7"
  && phaseIndex.nextPhase === "P134.2"
  && phaseStatus.current?.phaseId === "P134.1"
  && phaseStatus.previous?.phaseId === "P133.7"
  && phaseStatus.next?.phaseId === "P134.2"
  && phaseIndex.current?.phaseId === "P134.1"
  && phaseIndex.previous?.phaseId === "P133.7"
  && phaseIndex.next?.phaseId === "P134.2"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && indexById.get("P134")?.status === "in_progress"
  && statusById.get("P134.1")?.status === "complete"
  && indexById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "planned"
  && indexById.get("P134.2")?.status === "planned";
const p1342CurrentState =
  phaseStatus.currentPhase === "P134.2"
  && phaseStatus.previousPhase === "P134.1"
  && phaseStatus.nextPhase === "P134.3"
  && phaseIndex.currentPhase === "P134.2"
  && phaseIndex.previousPhase === "P134.1"
  && phaseIndex.nextPhase === "P134.3"
  && phaseStatus.current?.phaseId === "P134.2"
  && phaseStatus.previous?.phaseId === "P134.1"
  && phaseStatus.next?.phaseId === "P134.3"
  && phaseIndex.current?.phaseId === "P134.2"
  && phaseIndex.previous?.phaseId === "P134.1"
  && phaseIndex.next?.phaseId === "P134.3"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && indexById.get("P134")?.status === "in_progress"
  && statusById.get("P134.1")?.status === "complete"
  && indexById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "complete"
  && indexById.get("P134.2")?.status === "complete"
  && statusById.get("P134.3")?.status === "planned"
  && indexById.get("P134.3")?.status === "planned";
const p1343CurrentState =
  phaseStatus.currentPhase === "P134.3"
  && phaseStatus.previousPhase === "P134.2"
  && phaseStatus.nextPhase === "P134.4"
  && phaseIndex.currentPhase === "P134.3"
  && phaseIndex.previousPhase === "P134.2"
  && phaseIndex.nextPhase === "P134.4"
  && phaseStatus.current?.phaseId === "P134.3"
  && phaseStatus.previous?.phaseId === "P134.2"
  && phaseStatus.next?.phaseId === "P134.4"
  && phaseIndex.current?.phaseId === "P134.3"
  && phaseIndex.previous?.phaseId === "P134.2"
  && phaseIndex.next?.phaseId === "P134.4"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && indexById.get("P134")?.status === "in_progress"
  && statusById.get("P134.1")?.status === "complete"
  && indexById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "complete"
  && indexById.get("P134.2")?.status === "complete"
  && statusById.get("P134.3")?.status === "complete"
  && indexById.get("P134.3")?.status === "complete"
  && statusById.get("P134.4")?.status === "planned"
  && indexById.get("P134.4")?.status === "planned";
const p1344CurrentState =
  phaseStatus.currentPhase === "P134.4"
  && phaseStatus.previousPhase === "P134.3"
  && phaseStatus.nextPhase === "P134.5"
  && phaseIndex.currentPhase === "P134.4"
  && phaseIndex.previousPhase === "P134.3"
  && phaseIndex.nextPhase === "P134.5"
  && phaseStatus.current?.phaseId === "P134.4"
  && phaseStatus.previous?.phaseId === "P134.3"
  && phaseStatus.next?.phaseId === "P134.5"
  && phaseIndex.current?.phaseId === "P134.4"
  && phaseIndex.previous?.phaseId === "P134.3"
  && phaseIndex.next?.phaseId === "P134.5"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && indexById.get("P134")?.status === "in_progress"
  && statusById.get("P134.1")?.status === "complete"
  && indexById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "complete"
  && indexById.get("P134.2")?.status === "complete"
  && statusById.get("P134.3")?.status === "complete"
  && indexById.get("P134.3")?.status === "complete"
  && statusById.get("P134.4")?.status === "complete"
  && indexById.get("P134.4")?.status === "complete"
  && statusById.get("P134.5")?.status === "planned"
  && indexById.get("P134.5")?.status === "planned";
const p1345CurrentState =
  phaseStatus.currentPhase === "P134.5"
  && phaseStatus.previousPhase === "P134.4"
  && phaseStatus.nextPhase === "P134.6"
  && phaseIndex.currentPhase === "P134.5"
  && phaseIndex.previousPhase === "P134.4"
  && phaseIndex.nextPhase === "P134.6"
  && phaseStatus.current?.phaseId === "P134.5"
  && phaseStatus.previous?.phaseId === "P134.4"
  && phaseStatus.next?.phaseId === "P134.6"
  && phaseIndex.current?.phaseId === "P134.5"
  && phaseIndex.previous?.phaseId === "P134.4"
  && phaseIndex.next?.phaseId === "P134.6"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && indexById.get("P134")?.status === "in_progress"
  && ["P134.1", "P134.2", "P134.3", "P134.4", "P134.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P134.6")?.status === "planned"
  && indexById.get("P134.6")?.status === "planned";
const p1346CurrentState =
  phaseStatus.currentPhase === "P134.6"
  && phaseStatus.previousPhase === "P134.5"
  && phaseStatus.nextPhase === "P134.7"
  && phaseIndex.currentPhase === "P134.6"
  && phaseIndex.previousPhase === "P134.5"
  && phaseIndex.nextPhase === "P134.7"
  && phaseStatus.current?.phaseId === "P134.6"
  && phaseStatus.previous?.phaseId === "P134.5"
  && phaseStatus.next?.phaseId === "P134.7"
  && phaseIndex.current?.phaseId === "P134.6"
  && phaseIndex.previous?.phaseId === "P134.5"
  && phaseIndex.next?.phaseId === "P134.7"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && indexById.get("P134")?.status === "in_progress"
  && ["P134.1", "P134.2", "P134.3", "P134.4", "P134.5", "P134.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P134.7")?.status === "planned"
  && indexById.get("P134.7")?.status === "planned";
const p1347FinalState =
  phaseStatus.currentPhase === "P134.7"
  && phaseStatus.previousPhase === "P134.6"
  && phaseStatus.nextPhase === "P135"
  && phaseIndex.currentPhase === "P134.7"
  && phaseIndex.previousPhase === "P134.6"
  && phaseIndex.nextPhase === "P135"
  && phaseStatus.current?.phaseId === "P134.7"
  && phaseStatus.previous?.phaseId === "P134.6"
  && phaseStatus.next?.phaseId === "P135"
  && phaseIndex.current?.phaseId === "P134.7"
  && phaseIndex.previous?.phaseId === "P134.6"
  && phaseIndex.next?.phaseId === "P135"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && ["P134.1", "P134.2", "P134.3", "P134.4", "P134.5", "P134.6", "P134.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P135")?.status === "planned"
  && indexById.get("P135")?.status === "planned";
const p134ActiveState = p1341StartedState || p1342CurrentState || p1343CurrentState || p1344CurrentState || p1345CurrentState || p1346CurrentState || p1347FinalState;
const p1351StartedState =
  phaseStatus.currentPhase === "P135.1"
  && phaseStatus.previousPhase === "P134.7"
  && phaseStatus.nextPhase === "P135.2"
  && phaseIndex.currentPhase === "P135.1"
  && phaseIndex.previousPhase === "P134.7"
  && phaseIndex.nextPhase === "P135.2"
  && phaseStatus.current?.phaseId === "P135.1"
  && phaseStatus.previous?.phaseId === "P134.7"
  && phaseStatus.next?.phaseId === "P135.2"
  && phaseIndex.current?.phaseId === "P135.1"
  && phaseIndex.previous?.phaseId === "P134.7"
  && phaseIndex.next?.phaseId === "P135.2"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P134.7")?.status === "complete"
  && indexById.get("P134.7")?.status === "complete"
  && statusById.get("P135")?.status === "in_progress"
  && indexById.get("P135")?.status === "in_progress"
  && statusById.get("P135.1")?.status === "complete"
  && indexById.get("P135.1")?.status === "complete"
  && statusById.get("P135.2")?.status === "planned"
  && indexById.get("P135.2")?.status === "planned";
const p1352CurrentState =
  phaseStatus.currentPhase === "P135.2"
  && phaseStatus.previousPhase === "P135.1"
  && phaseStatus.nextPhase === "P135.3"
  && phaseIndex.currentPhase === "P135.2"
  && phaseIndex.previousPhase === "P135.1"
  && phaseIndex.nextPhase === "P135.3"
  && phaseStatus.current?.phaseId === "P135.2"
  && phaseStatus.previous?.phaseId === "P135.1"
  && phaseStatus.next?.phaseId === "P135.3"
  && phaseIndex.current?.phaseId === "P135.2"
  && phaseIndex.previous?.phaseId === "P135.1"
  && phaseIndex.next?.phaseId === "P135.3"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "in_progress"
  && indexById.get("P135")?.status === "in_progress"
  && statusById.get("P135.1")?.status === "complete"
  && indexById.get("P135.1")?.status === "complete"
  && statusById.get("P135.2")?.status === "complete"
  && indexById.get("P135.2")?.status === "complete"
  && statusById.get("P135.3")?.status === "planned"
  && indexById.get("P135.3")?.status === "planned";
const p1353CurrentState =
  phaseStatus.currentPhase === "P135.3"
  && phaseStatus.previousPhase === "P135.2"
  && phaseStatus.nextPhase === "P135.4"
  && phaseIndex.currentPhase === "P135.3"
  && phaseIndex.previousPhase === "P135.2"
  && phaseIndex.nextPhase === "P135.4"
  && phaseStatus.current?.phaseId === "P135.3"
  && phaseStatus.previous?.phaseId === "P135.2"
  && phaseStatus.next?.phaseId === "P135.4"
  && phaseIndex.current?.phaseId === "P135.3"
  && phaseIndex.previous?.phaseId === "P135.2"
  && phaseIndex.next?.phaseId === "P135.4"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "in_progress"
  && indexById.get("P135")?.status === "in_progress"
  && ["P135.1", "P135.2", "P135.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P135.4")?.status === "planned"
  && indexById.get("P135.4")?.status === "planned";
const p1354CurrentState =
  phaseStatus.currentPhase === "P135.4"
  && phaseStatus.previousPhase === "P135.3"
  && phaseStatus.nextPhase === "P135.5"
  && phaseIndex.currentPhase === "P135.4"
  && phaseIndex.previousPhase === "P135.3"
  && phaseIndex.nextPhase === "P135.5"
  && phaseStatus.current?.phaseId === "P135.4"
  && phaseStatus.previous?.phaseId === "P135.3"
  && phaseStatus.next?.phaseId === "P135.5"
  && phaseIndex.current?.phaseId === "P135.4"
  && phaseIndex.previous?.phaseId === "P135.3"
  && phaseIndex.next?.phaseId === "P135.5"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "in_progress"
  && indexById.get("P135")?.status === "in_progress"
  && ["P135.1", "P135.2", "P135.3", "P135.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P135.5")?.status === "planned"
  && indexById.get("P135.5")?.status === "planned";
const p1355CurrentState =
  phaseStatus.currentPhase === "P135.5"
  && phaseStatus.previousPhase === "P135.4"
  && phaseStatus.nextPhase === "P135.6"
  && phaseIndex.currentPhase === "P135.5"
  && phaseIndex.previousPhase === "P135.4"
  && phaseIndex.nextPhase === "P135.6"
  && phaseStatus.current?.phaseId === "P135.5"
  && phaseStatus.previous?.phaseId === "P135.4"
  && phaseStatus.next?.phaseId === "P135.6"
  && phaseIndex.current?.phaseId === "P135.5"
  && phaseIndex.previous?.phaseId === "P135.4"
  && phaseIndex.next?.phaseId === "P135.6"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "in_progress"
  && indexById.get("P135")?.status === "in_progress"
  && ["P135.1", "P135.2", "P135.3", "P135.4", "P135.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P135.6")?.status === "planned"
  && indexById.get("P135.6")?.status === "planned";
const p1356CurrentState =
  phaseStatus.currentPhase === "P135.6"
  && phaseStatus.previousPhase === "P135.5"
  && phaseStatus.nextPhase === "P135.7"
  && phaseIndex.currentPhase === "P135.6"
  && phaseIndex.previousPhase === "P135.5"
  && phaseIndex.nextPhase === "P135.7"
  && phaseStatus.current?.phaseId === "P135.6"
  && phaseStatus.previous?.phaseId === "P135.5"
  && phaseStatus.next?.phaseId === "P135.7"
  && phaseIndex.current?.phaseId === "P135.6"
  && phaseIndex.previous?.phaseId === "P135.5"
  && phaseIndex.next?.phaseId === "P135.7"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "in_progress"
  && indexById.get("P135")?.status === "in_progress"
  && ["P135.1", "P135.2", "P135.3", "P135.4", "P135.5", "P135.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P135.7")?.status === "planned"
  && indexById.get("P135.7")?.status === "planned";
const p1357FinalState =
  phaseStatus.currentPhase === "P135.7"
  && phaseStatus.previousPhase === "P135.6"
  && phaseStatus.nextPhase === "P136"
  && phaseIndex.currentPhase === "P135.7"
  && phaseIndex.previousPhase === "P135.6"
  && phaseIndex.nextPhase === "P136"
  && phaseStatus.current?.phaseId === "P135.7"
  && phaseStatus.previous?.phaseId === "P135.6"
  && phaseStatus.next?.phaseId === "P136"
  && phaseIndex.current?.phaseId === "P135.7"
  && phaseIndex.previous?.phaseId === "P135.6"
  && phaseIndex.next?.phaseId === "P136"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "complete"
  && indexById.get("P135")?.status === "complete"
  && ["P135.1", "P135.2", "P135.3", "P135.4", "P135.5", "P135.6", "P135.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P136")?.status === "planned"
  && indexById.get("P136")?.status === "planned";
const p1361StartedState =
  phaseStatus.currentPhase === "P136.1"
  && phaseStatus.previousPhase === "P135.7"
  && phaseStatus.nextPhase === "P136.2"
  && phaseIndex.currentPhase === "P136.1"
  && phaseIndex.previousPhase === "P135.7"
  && phaseIndex.nextPhase === "P136.2"
  && phaseStatus.current?.phaseId === "P136.1"
  && phaseStatus.previous?.phaseId === "P135.7"
  && phaseStatus.next?.phaseId === "P136.2"
  && phaseIndex.current?.phaseId === "P136.1"
  && phaseIndex.previous?.phaseId === "P135.7"
  && phaseIndex.next?.phaseId === "P136.2"
  && statusById.get("P135")?.status === "complete"
  && indexById.get("P135")?.status === "complete"
  && ["P135.1", "P135.2", "P135.3", "P135.4", "P135.5", "P135.6", "P135.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P136")?.status === "in_progress"
  && indexById.get("P136")?.status === "in_progress"
  && statusById.get("P136.1")?.status === "complete"
  && indexById.get("P136.1")?.status === "complete"
  && statusById.get("P136.2")?.status === "planned"
  && indexById.get("P136.2")?.status === "planned";
const p1362CurrentState =
  phaseStatus.currentPhase === "P136.2"
  && phaseStatus.previousPhase === "P136.1"
  && phaseStatus.nextPhase === "P136.3"
  && phaseIndex.currentPhase === "P136.2"
  && phaseIndex.previousPhase === "P136.1"
  && phaseIndex.nextPhase === "P136.3"
  && phaseStatus.current?.phaseId === "P136.2"
  && phaseStatus.previous?.phaseId === "P136.1"
  && phaseStatus.next?.phaseId === "P136.3"
  && phaseIndex.current?.phaseId === "P136.2"
  && phaseIndex.previous?.phaseId === "P136.1"
  && phaseIndex.next?.phaseId === "P136.3"
  && statusById.get("P135")?.status === "complete"
  && indexById.get("P135")?.status === "complete"
  && statusById.get("P136")?.status === "in_progress"
  && indexById.get("P136")?.status === "in_progress"
  && statusById.get("P136.1")?.status === "complete"
  && indexById.get("P136.1")?.status === "complete"
  && statusById.get("P136.2")?.status === "complete"
  && indexById.get("P136.2")?.status === "complete"
  && statusById.get("P136.3")?.status === "planned"
  && indexById.get("P136.3")?.status === "planned";
const p1363CurrentState =
  phaseStatus.currentPhase === "P136.3"
  && phaseStatus.previousPhase === "P136.2"
  && phaseStatus.nextPhase === "P136.4"
  && phaseIndex.currentPhase === "P136.3"
  && phaseIndex.previousPhase === "P136.2"
  && phaseIndex.nextPhase === "P136.4"
  && phaseStatus.current?.phaseId === "P136.3"
  && phaseStatus.previous?.phaseId === "P136.2"
  && phaseStatus.next?.phaseId === "P136.4"
  && phaseIndex.current?.phaseId === "P136.3"
  && phaseIndex.previous?.phaseId === "P136.2"
  && phaseIndex.next?.phaseId === "P136.4"
  && statusById.get("P135")?.status === "complete"
  && indexById.get("P135")?.status === "complete"
  && statusById.get("P136")?.status === "in_progress"
  && indexById.get("P136")?.status === "in_progress"
  && statusById.get("P136.1")?.status === "complete"
  && indexById.get("P136.1")?.status === "complete"
  && statusById.get("P136.2")?.status === "complete"
  && indexById.get("P136.2")?.status === "complete"
  && statusById.get("P136.3")?.status === "complete"
  && indexById.get("P136.3")?.status === "complete"
  && statusById.get("P136.4")?.status === "planned"
  && indexById.get("P136.4")?.status === "planned";
const p1364CurrentState =
  phaseStatus.currentPhase === "P136.4"
  && phaseStatus.previousPhase === "P136.3"
  && phaseStatus.nextPhase === "P136.5"
  && phaseIndex.currentPhase === "P136.4"
  && phaseIndex.previousPhase === "P136.3"
  && phaseIndex.nextPhase === "P136.5"
  && phaseStatus.current?.phaseId === "P136.4"
  && phaseStatus.previous?.phaseId === "P136.3"
  && phaseStatus.next?.phaseId === "P136.5"
  && phaseIndex.current?.phaseId === "P136.4"
  && phaseIndex.previous?.phaseId === "P136.3"
  && phaseIndex.next?.phaseId === "P136.5"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "complete"
  && indexById.get("P135")?.status === "complete"
  && statusById.get("P136")?.status === "in_progress"
  && indexById.get("P136")?.status === "in_progress"
  && statusById.get("P136.1")?.status === "complete"
  && indexById.get("P136.1")?.status === "complete"
  && statusById.get("P136.2")?.status === "complete"
  && indexById.get("P136.2")?.status === "complete"
  && statusById.get("P136.3")?.status === "complete"
  && indexById.get("P136.3")?.status === "complete"
  && statusById.get("P136.4")?.status === "complete"
  && indexById.get("P136.4")?.status === "complete"
  && statusById.get("P136.5")?.status === "planned"
  && indexById.get("P136.5")?.status === "planned";
const p1365CurrentState =
  phaseStatus.currentPhase === "P136.5"
  && phaseStatus.previousPhase === "P136.4"
  && phaseStatus.nextPhase === "P136.6"
  && phaseIndex.currentPhase === "P136.5"
  && phaseIndex.previousPhase === "P136.4"
  && phaseIndex.nextPhase === "P136.6"
  && phaseStatus.current?.phaseId === "P136.5"
  && phaseStatus.previous?.phaseId === "P136.4"
  && phaseStatus.next?.phaseId === "P136.6"
  && phaseIndex.current?.phaseId === "P136.5"
  && phaseIndex.previous?.phaseId === "P136.4"
  && phaseIndex.next?.phaseId === "P136.6"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "complete"
  && indexById.get("P135")?.status === "complete"
  && statusById.get("P136")?.status === "in_progress"
  && indexById.get("P136")?.status === "in_progress"
  && ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P136.6")?.status === "planned"
  && indexById.get("P136.6")?.status === "planned";
const p1366CurrentState =
  phaseStatus.currentPhase === "P136.6"
  && phaseStatus.previousPhase === "P136.5"
  && phaseStatus.nextPhase === "P136.7"
  && phaseIndex.currentPhase === "P136.6"
  && phaseIndex.previousPhase === "P136.5"
  && phaseIndex.nextPhase === "P136.7"
  && phaseStatus.current?.phaseId === "P136.6"
  && phaseStatus.previous?.phaseId === "P136.5"
  && phaseStatus.next?.phaseId === "P136.7"
  && phaseIndex.current?.phaseId === "P136.6"
  && phaseIndex.previous?.phaseId === "P136.5"
  && phaseIndex.next?.phaseId === "P136.7"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "complete"
  && indexById.get("P135")?.status === "complete"
  && statusById.get("P136")?.status === "in_progress"
  && indexById.get("P136")?.status === "in_progress"
  && ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5", "P136.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P136.7")?.status === "planned"
  && indexById.get("P136.7")?.status === "planned";
const p1367FinalState =
  phaseStatus.currentPhase === "P136.7"
  && phaseStatus.previousPhase === "P136.6"
  && phaseStatus.nextPhase === "P137"
  && phaseIndex.currentPhase === "P136.7"
  && phaseIndex.previousPhase === "P136.6"
  && phaseIndex.nextPhase === "P137"
  && phaseStatus.current?.phaseId === "P136.7"
  && phaseStatus.previous?.phaseId === "P136.6"
  && phaseStatus.next?.phaseId === "P137"
  && phaseIndex.current?.phaseId === "P136.7"
  && phaseIndex.previous?.phaseId === "P136.6"
  && phaseIndex.next?.phaseId === "P137"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "complete"
  && indexById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "complete"
  && indexById.get("P135")?.status === "complete"
  && statusById.get("P136")?.status === "complete"
  && indexById.get("P136")?.status === "complete"
  && ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5", "P136.6", "P136.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P137")?.status === "planned"
  && indexById.get("P137")?.status === "planned";
const p1371StartedState =
  phaseStatus.currentPhase === "P137.1"
  && phaseStatus.previousPhase === "P136.7"
  && phaseStatus.nextPhase === "P137.2"
  && phaseIndex.currentPhase === "P137.1"
  && phaseIndex.previousPhase === "P136.7"
  && phaseIndex.nextPhase === "P137.2"
  && phaseStatus.current?.phaseId === "P137.1"
  && phaseStatus.previous?.phaseId === "P136.7"
  && phaseStatus.next?.phaseId === "P137.2"
  && phaseIndex.current?.phaseId === "P137.1"
  && phaseIndex.previous?.phaseId === "P136.7"
  && phaseIndex.next?.phaseId === "P137.2"
  && statusById.get("P136")?.status === "complete"
  && indexById.get("P136")?.status === "complete"
  && statusById.get("P136.7")?.status === "complete"
  && indexById.get("P136.7")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && indexById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && indexById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "planned"
  && indexById.get("P137.2")?.status === "planned";
const p1372CurrentState =
  phaseStatus.currentPhase === "P137.2"
  && phaseStatus.previousPhase === "P137.1"
  && phaseStatus.nextPhase === "P137.3"
  && phaseIndex.currentPhase === "P137.2"
  && phaseIndex.previousPhase === "P137.1"
  && phaseIndex.nextPhase === "P137.3"
  && phaseStatus.current?.phaseId === "P137.2"
  && phaseStatus.previous?.phaseId === "P137.1"
  && phaseStatus.next?.phaseId === "P137.3"
  && phaseIndex.current?.phaseId === "P137.2"
  && phaseIndex.previous?.phaseId === "P137.1"
  && phaseIndex.next?.phaseId === "P137.3"
  && statusById.get("P136")?.status === "complete"
  && indexById.get("P136")?.status === "complete"
  && statusById.get("P136.7")?.status === "complete"
  && indexById.get("P136.7")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && indexById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && indexById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "complete"
  && indexById.get("P137.2")?.status === "complete"
  && statusById.get("P137.3")?.status === "planned"
  && indexById.get("P137.3")?.status === "planned";
const p1373CurrentState =
  phaseStatus.currentPhase === "P137.3"
  && phaseStatus.previousPhase === "P137.2"
  && phaseStatus.nextPhase === "P137.4"
  && phaseIndex.currentPhase === "P137.3"
  && phaseIndex.previousPhase === "P137.2"
  && phaseIndex.nextPhase === "P137.4"
  && phaseStatus.current?.phaseId === "P137.3"
  && phaseStatus.previous?.phaseId === "P137.2"
  && phaseStatus.next?.phaseId === "P137.4"
  && phaseIndex.current?.phaseId === "P137.3"
  && phaseIndex.previous?.phaseId === "P137.2"
  && phaseIndex.next?.phaseId === "P137.4"
  && statusById.get("P136")?.status === "complete"
  && indexById.get("P136")?.status === "complete"
  && statusById.get("P136.7")?.status === "complete"
  && indexById.get("P136.7")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && indexById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && indexById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "complete"
  && indexById.get("P137.2")?.status === "complete"
  && statusById.get("P137.3")?.status === "complete"
  && indexById.get("P137.3")?.status === "complete"
  && statusById.get("P137.4")?.status === "planned"
  && indexById.get("P137.4")?.status === "planned";
const p1374CurrentState =
  phaseStatus.currentPhase === "P137.4"
  && phaseStatus.previousPhase === "P137.3"
  && phaseStatus.nextPhase === "P137.5"
  && phaseIndex.currentPhase === "P137.4"
  && phaseIndex.previousPhase === "P137.3"
  && phaseIndex.nextPhase === "P137.5"
  && phaseStatus.current?.phaseId === "P137.4"
  && phaseStatus.previous?.phaseId === "P137.3"
  && phaseStatus.next?.phaseId === "P137.5"
  && phaseIndex.current?.phaseId === "P137.4"
  && phaseIndex.previous?.phaseId === "P137.3"
  && phaseIndex.next?.phaseId === "P137.5"
  && statusById.get("P136")?.status === "complete"
  && indexById.get("P136")?.status === "complete"
  && statusById.get("P136.7")?.status === "complete"
  && indexById.get("P136.7")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && indexById.get("P137")?.status === "in_progress"
  && ["P137.1", "P137.2", "P137.3", "P137.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P137.5")?.status === "planned"
  && indexById.get("P137.5")?.status === "planned";
const p1375CurrentState =
  phaseStatus.currentPhase === "P137.5"
  && phaseStatus.previousPhase === "P137.4"
  && phaseStatus.nextPhase === "P137.6"
  && phaseIndex.currentPhase === "P137.5"
  && phaseIndex.previousPhase === "P137.4"
  && phaseIndex.nextPhase === "P137.6"
  && phaseStatus.current?.phaseId === "P137.5"
  && phaseStatus.previous?.phaseId === "P137.4"
  && phaseStatus.next?.phaseId === "P137.6"
  && phaseIndex.current?.phaseId === "P137.5"
  && phaseIndex.previous?.phaseId === "P137.4"
  && phaseIndex.next?.phaseId === "P137.6"
  && statusById.get("P136")?.status === "complete"
  && indexById.get("P136")?.status === "complete"
  && statusById.get("P136.7")?.status === "complete"
  && indexById.get("P136.7")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && indexById.get("P137")?.status === "in_progress"
  && ["P137.1", "P137.2", "P137.3", "P137.4", "P137.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P137.6")?.status === "planned"
  && indexById.get("P137.6")?.status === "planned";
const p1376CurrentState =
  phaseStatus.currentPhase === "P137.6"
  && phaseStatus.previousPhase === "P137.5"
  && phaseStatus.nextPhase === "P137.7"
  && phaseIndex.currentPhase === "P137.6"
  && phaseIndex.previousPhase === "P137.5"
  && phaseIndex.nextPhase === "P137.7"
  && phaseStatus.current?.phaseId === "P137.6"
  && phaseStatus.previous?.phaseId === "P137.5"
  && phaseStatus.next?.phaseId === "P137.7"
  && phaseIndex.current?.phaseId === "P137.6"
  && phaseIndex.previous?.phaseId === "P137.5"
  && phaseIndex.next?.phaseId === "P137.7"
  && statusById.get("P136")?.status === "complete"
  && indexById.get("P136")?.status === "complete"
  && statusById.get("P136.7")?.status === "complete"
  && indexById.get("P136.7")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && indexById.get("P137")?.status === "in_progress"
  && ["P137.1", "P137.2", "P137.3", "P137.4", "P137.5", "P137.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P137.7")?.status === "planned"
  && indexById.get("P137.7")?.status === "planned";
const p1377FinalState =
  phaseStatus.currentPhase === "P137.7"
  && phaseStatus.previousPhase === "P137.6"
  && phaseStatus.nextPhase === "P138"
  && phaseIndex.currentPhase === "P137.7"
  && phaseIndex.previousPhase === "P137.6"
  && phaseIndex.nextPhase === "P138"
  && phaseStatus.current?.phaseId === "P137.7"
  && phaseStatus.previous?.phaseId === "P137.6"
  && phaseStatus.next?.phaseId === "P138"
  && phaseIndex.current?.phaseId === "P137.7"
  && phaseIndex.previous?.phaseId === "P137.6"
  && phaseIndex.next?.phaseId === "P138"
  && statusById.get("P136")?.status === "complete"
  && indexById.get("P136")?.status === "complete"
  && statusById.get("P136.7")?.status === "complete"
  && indexById.get("P136.7")?.status === "complete"
  && statusById.get("P137")?.status === "complete"
  && indexById.get("P137")?.status === "complete"
  && ["P137.1", "P137.2", "P137.3", "P137.4", "P137.5", "P137.6", "P137.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P138")?.status === "planned"
  && indexById.get("P138")?.status === "planned";
const p135ActiveState = p1351StartedState || p1352CurrentState || p1353CurrentState || p1354CurrentState || p1355CurrentState || p1356CurrentState || p1357FinalState;
const p136ActiveState = p1361StartedState || p1362CurrentState || p1363CurrentState || p1364CurrentState || p1365CurrentState || p1366CurrentState || p1367FinalState;
const p137ActiveState = p1371StartedState || p1372CurrentState || p1373CurrentState || p1374CurrentState || p1375CurrentState || p1376CurrentState || p1377FinalState;
const p1381StartedState =
  phaseStatus.currentPhase === "P138.1"
  && phaseStatus.previousPhase === "P137.7"
  && phaseStatus.nextPhase === "P138.2"
  && phaseIndex.currentPhase === "P138.1"
  && phaseIndex.previousPhase === "P137.7"
  && phaseIndex.nextPhase === "P138.2"
  && phaseStatus.current?.phaseId === "P138.1"
  && phaseStatus.previous?.phaseId === "P137.7"
  && phaseStatus.next?.phaseId === "P138.2"
  && phaseIndex.current?.phaseId === "P138.1"
  && phaseIndex.previous?.phaseId === "P137.7"
  && phaseIndex.next?.phaseId === "P138.2"
  && statusById.get("P137")?.status === "complete"
  && indexById.get("P137")?.status === "complete"
  && statusById.get("P137.7")?.status === "complete"
  && indexById.get("P137.7")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && indexById.get("P138")?.status === "in_progress"
  && statusById.get("P138.1")?.status === "complete"
  && indexById.get("P138.1")?.status === "complete"
  && statusById.get("P138.2")?.status === "planned"
  && indexById.get("P138.2")?.status === "planned";
const p1382CurrentState =
  phaseStatus.currentPhase === "P138.2"
  && phaseStatus.previousPhase === "P138.1"
  && phaseStatus.nextPhase === "P138.3"
  && phaseIndex.currentPhase === "P138.2"
  && phaseIndex.previousPhase === "P138.1"
  && phaseIndex.nextPhase === "P138.3"
  && phaseStatus.current?.phaseId === "P138.2"
  && phaseStatus.previous?.phaseId === "P138.1"
  && phaseStatus.next?.phaseId === "P138.3"
  && phaseIndex.current?.phaseId === "P138.2"
  && phaseIndex.previous?.phaseId === "P138.1"
  && phaseIndex.next?.phaseId === "P138.3"
  && statusById.get("P137")?.status === "complete"
  && indexById.get("P137")?.status === "complete"
  && statusById.get("P137.7")?.status === "complete"
  && indexById.get("P137.7")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && indexById.get("P138")?.status === "in_progress"
  && statusById.get("P138.1")?.status === "complete"
  && indexById.get("P138.1")?.status === "complete"
  && statusById.get("P138.2")?.status === "complete"
  && indexById.get("P138.2")?.status === "complete"
  && statusById.get("P138.3")?.status === "planned"
  && indexById.get("P138.3")?.status === "planned";
const p1383CurrentState =
  phaseStatus.currentPhase === "P138.3"
  && phaseStatus.previousPhase === "P138.2"
  && phaseStatus.nextPhase === "P138.4"
  && phaseIndex.currentPhase === "P138.3"
  && phaseIndex.previousPhase === "P138.2"
  && phaseIndex.nextPhase === "P138.4"
  && phaseStatus.current?.phaseId === "P138.3"
  && phaseStatus.previous?.phaseId === "P138.2"
  && phaseStatus.next?.phaseId === "P138.4"
  && phaseIndex.current?.phaseId === "P138.3"
  && phaseIndex.previous?.phaseId === "P138.2"
  && phaseIndex.next?.phaseId === "P138.4"
  && statusById.get("P137")?.status === "complete"
  && indexById.get("P137")?.status === "complete"
  && statusById.get("P137.7")?.status === "complete"
  && indexById.get("P137.7")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && indexById.get("P138")?.status === "in_progress"
  && statusById.get("P138.1")?.status === "complete"
  && indexById.get("P138.1")?.status === "complete"
  && statusById.get("P138.2")?.status === "complete"
  && indexById.get("P138.2")?.status === "complete"
  && statusById.get("P138.3")?.status === "complete"
  && indexById.get("P138.3")?.status === "complete"
  && statusById.get("P138.4")?.status === "planned"
  && indexById.get("P138.4")?.status === "planned";
const p1384CurrentState =
  phaseStatus.currentPhase === "P138.4"
  && phaseStatus.previousPhase === "P138.3"
  && phaseStatus.nextPhase === "P138.5"
  && phaseIndex.currentPhase === "P138.4"
  && phaseIndex.previousPhase === "P138.3"
  && phaseIndex.nextPhase === "P138.5"
  && phaseStatus.current?.phaseId === "P138.4"
  && phaseStatus.previous?.phaseId === "P138.3"
  && phaseStatus.next?.phaseId === "P138.5"
  && phaseIndex.current?.phaseId === "P138.4"
  && phaseIndex.previous?.phaseId === "P138.3"
  && phaseIndex.next?.phaseId === "P138.5"
  && statusById.get("P137")?.status === "complete"
  && indexById.get("P137")?.status === "complete"
  && statusById.get("P137.7")?.status === "complete"
  && indexById.get("P137.7")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && indexById.get("P138")?.status === "in_progress"
  && ["P138.1", "P138.2", "P138.3", "P138.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P138.5")?.status === "planned"
  && indexById.get("P138.5")?.status === "planned";
const p1385CurrentState =
  phaseStatus.currentPhase === "P138.5"
  && phaseStatus.previousPhase === "P138.4"
  && phaseStatus.nextPhase === "P138.6"
  && phaseIndex.currentPhase === "P138.5"
  && phaseIndex.previousPhase === "P138.4"
  && phaseIndex.nextPhase === "P138.6"
  && phaseStatus.current?.phaseId === "P138.5"
  && phaseStatus.previous?.phaseId === "P138.4"
  && phaseStatus.next?.phaseId === "P138.6"
  && phaseIndex.current?.phaseId === "P138.5"
  && phaseIndex.previous?.phaseId === "P138.4"
  && phaseIndex.next?.phaseId === "P138.6"
  && statusById.get("P137")?.status === "complete"
  && indexById.get("P137")?.status === "complete"
  && statusById.get("P137.7")?.status === "complete"
  && indexById.get("P137.7")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && indexById.get("P138")?.status === "in_progress"
  && ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P138.6")?.status === "planned"
  && indexById.get("P138.6")?.status === "planned";
const p1386CurrentState =
  phaseStatus.currentPhase === "P138.6"
  && phaseStatus.previousPhase === "P138.5"
  && phaseStatus.nextPhase === "P138.7"
  && phaseIndex.currentPhase === "P138.6"
  && phaseIndex.previousPhase === "P138.5"
  && phaseIndex.nextPhase === "P138.7"
  && phaseStatus.current?.phaseId === "P138.6"
  && phaseStatus.previous?.phaseId === "P138.5"
  && phaseStatus.next?.phaseId === "P138.7"
  && phaseIndex.current?.phaseId === "P138.6"
  && phaseIndex.previous?.phaseId === "P138.5"
  && phaseIndex.next?.phaseId === "P138.7"
  && statusById.get("P137")?.status === "complete"
  && indexById.get("P137")?.status === "complete"
  && statusById.get("P137.7")?.status === "complete"
  && indexById.get("P137.7")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && indexById.get("P138")?.status === "in_progress"
  && ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P138.7")?.status === "planned"
  && indexById.get("P138.7")?.status === "planned";
const p1387FinalState =
  phaseStatus.currentPhase === "P138.7"
  && phaseStatus.previousPhase === "P138.6"
  && phaseStatus.nextPhase === "P139"
  && phaseIndex.currentPhase === "P138.7"
  && phaseIndex.previousPhase === "P138.6"
  && phaseIndex.nextPhase === "P139"
  && phaseStatus.current?.phaseId === "P138.7"
  && phaseStatus.previous?.phaseId === "P138.6"
  && phaseStatus.next?.phaseId === "P139"
  && phaseIndex.current?.phaseId === "P138.7"
  && phaseIndex.previous?.phaseId === "P138.6"
  && phaseIndex.next?.phaseId === "P139"
  && statusById.get("P137")?.status === "complete"
  && indexById.get("P137")?.status === "complete"
  && statusById.get("P137.7")?.status === "complete"
  && indexById.get("P137.7")?.status === "complete"
  && statusById.get("P138")?.status === "complete"
  && indexById.get("P138")?.status === "complete"
  && ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6", "P138.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P139")?.status === "planned"
  && indexById.get("P139")?.status === "planned";
const p1391StartedState =
  phaseStatus.currentPhase === "P139.1"
  && phaseStatus.previousPhase === "P138.7"
  && phaseStatus.nextPhase === "P139.2"
  && phaseIndex.currentPhase === "P139.1"
  && phaseIndex.previousPhase === "P138.7"
  && phaseIndex.nextPhase === "P139.2"
  && phaseStatus.current?.phaseId === "P139.1"
  && phaseStatus.previous?.phaseId === "P138.7"
  && phaseStatus.next?.phaseId === "P139.2"
  && phaseIndex.current?.phaseId === "P139.1"
  && phaseIndex.previous?.phaseId === "P138.7"
  && phaseIndex.next?.phaseId === "P139.2"
  && statusById.get("P138")?.status === "complete"
  && indexById.get("P138")?.status === "complete"
  && statusById.get("P138.7")?.status === "complete"
  && indexById.get("P138.7")?.status === "complete"
  && statusById.get("P139")?.status === "in_progress"
  && indexById.get("P139")?.status === "in_progress"
  && statusById.get("P139.1")?.status === "complete"
  && indexById.get("P139.1")?.status === "complete"
  && statusById.get("P139.2")?.status === "planned"
  && indexById.get("P139.2")?.status === "planned";
const p1392CurrentState =
  phaseStatus.currentPhase === "P139.2"
  && phaseStatus.previousPhase === "P139.1"
  && phaseStatus.nextPhase === "P139.3"
  && phaseIndex.currentPhase === "P139.2"
  && phaseIndex.previousPhase === "P139.1"
  && phaseIndex.nextPhase === "P139.3"
  && phaseStatus.current?.phaseId === "P139.2"
  && phaseStatus.previous?.phaseId === "P139.1"
  && phaseStatus.next?.phaseId === "P139.3"
  && phaseIndex.current?.phaseId === "P139.2"
  && phaseIndex.previous?.phaseId === "P139.1"
  && phaseIndex.next?.phaseId === "P139.3"
  && statusById.get("P138")?.status === "complete"
  && indexById.get("P138")?.status === "complete"
  && statusById.get("P138.7")?.status === "complete"
  && indexById.get("P138.7")?.status === "complete"
  && statusById.get("P139")?.status === "in_progress"
  && indexById.get("P139")?.status === "in_progress"
  && statusById.get("P139.1")?.status === "complete"
  && indexById.get("P139.1")?.status === "complete"
  && statusById.get("P139.2")?.status === "complete"
  && indexById.get("P139.2")?.status === "complete"
  && statusById.get("P139.3")?.status === "planned"
  && indexById.get("P139.3")?.status === "planned";
const p1393CurrentState =
  phaseStatus.currentPhase === "P139.3"
  && phaseStatus.previousPhase === "P139.2"
  && phaseStatus.nextPhase === "P139.4"
  && phaseIndex.currentPhase === "P139.3"
  && phaseIndex.previousPhase === "P139.2"
  && phaseIndex.nextPhase === "P139.4"
  && phaseStatus.current?.phaseId === "P139.3"
  && phaseStatus.previous?.phaseId === "P139.2"
  && phaseStatus.next?.phaseId === "P139.4"
  && phaseIndex.current?.phaseId === "P139.3"
  && phaseIndex.previous?.phaseId === "P139.2"
  && phaseIndex.next?.phaseId === "P139.4"
  && statusById.get("P138")?.status === "complete"
  && indexById.get("P138")?.status === "complete"
  && statusById.get("P139")?.status === "in_progress"
  && indexById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P139.4")?.status === "planned"
  && indexById.get("P139.4")?.status === "planned";
const p1394CurrentState =
  phaseStatus.currentPhase === "P139.4"
  && phaseStatus.previousPhase === "P139.3"
  && phaseStatus.nextPhase === "P139.5"
  && phaseIndex.currentPhase === "P139.4"
  && phaseIndex.previousPhase === "P139.3"
  && phaseIndex.nextPhase === "P139.5"
  && phaseStatus.current?.phaseId === "P139.4"
  && phaseStatus.previous?.phaseId === "P139.3"
  && phaseStatus.next?.phaseId === "P139.5"
  && phaseIndex.current?.phaseId === "P139.4"
  && phaseIndex.previous?.phaseId === "P139.3"
  && phaseIndex.next?.phaseId === "P139.5"
  && statusById.get("P138")?.status === "complete"
  && indexById.get("P138")?.status === "complete"
  && statusById.get("P139")?.status === "in_progress"
  && indexById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P139.5")?.status === "planned"
  && indexById.get("P139.5")?.status === "planned";
const p1395CurrentState =
  phaseStatus.currentPhase === "P139.5"
  && phaseStatus.previousPhase === "P139.4"
  && phaseStatus.nextPhase === "P139.6"
  && phaseIndex.currentPhase === "P139.5"
  && phaseIndex.previousPhase === "P139.4"
  && phaseIndex.nextPhase === "P139.6"
  && phaseStatus.current?.phaseId === "P139.5"
  && phaseStatus.previous?.phaseId === "P139.4"
  && phaseStatus.next?.phaseId === "P139.6"
  && phaseIndex.current?.phaseId === "P139.5"
  && phaseIndex.previous?.phaseId === "P139.4"
  && phaseIndex.next?.phaseId === "P139.6"
  && statusById.get("P138")?.status === "complete"
  && indexById.get("P138")?.status === "complete"
  && statusById.get("P139")?.status === "in_progress"
  && indexById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P139.6")?.status === "planned"
  && indexById.get("P139.6")?.status === "planned";
const p1396CurrentState =
  phaseStatus.currentPhase === "P139.6"
  && phaseStatus.previousPhase === "P139.5"
  && phaseStatus.nextPhase === "P139.7"
  && phaseIndex.currentPhase === "P139.6"
  && phaseIndex.previousPhase === "P139.5"
  && phaseIndex.nextPhase === "P139.7"
  && phaseStatus.current?.phaseId === "P139.6"
  && phaseStatus.previous?.phaseId === "P139.5"
  && phaseStatus.next?.phaseId === "P139.7"
  && phaseIndex.current?.phaseId === "P139.6"
  && phaseIndex.previous?.phaseId === "P139.5"
  && phaseIndex.next?.phaseId === "P139.7"
  && statusById.get("P138")?.status === "complete"
  && indexById.get("P138")?.status === "complete"
  && statusById.get("P139")?.status === "in_progress"
  && indexById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5", "P139.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P139.7")?.status === "planned"
  && indexById.get("P139.7")?.status === "planned";
const p1397FinalState =
  phaseStatus.currentPhase === "P139.7"
  && phaseStatus.previousPhase === "P139.6"
  && phaseStatus.nextPhase === "P140"
  && phaseIndex.currentPhase === "P139.7"
  && phaseIndex.previousPhase === "P139.6"
  && phaseIndex.nextPhase === "P140"
  && phaseStatus.current?.phaseId === "P139.7"
  && phaseStatus.previous?.phaseId === "P139.6"
  && phaseStatus.next?.phaseId === "P140"
  && phaseIndex.current?.phaseId === "P139.7"
  && phaseIndex.previous?.phaseId === "P139.6"
  && phaseIndex.next?.phaseId === "P140"
  && statusById.get("P138")?.status === "complete"
  && indexById.get("P138")?.status === "complete"
  && statusById.get("P139")?.status === "complete"
  && indexById.get("P139")?.status === "complete"
  && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5", "P139.6", "P139.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P140")?.status === "planned"
  && indexById.get("P140")?.status === "planned";
const p1401StartedState =
  phaseStatus.currentPhase === "P140.1"
  && phaseStatus.previousPhase === "P139.7"
  && phaseStatus.nextPhase === "P140.2"
  && phaseIndex.currentPhase === "P140.1"
  && phaseIndex.previousPhase === "P139.7"
  && phaseIndex.nextPhase === "P140.2"
  && phaseStatus.current?.phaseId === "P140.1"
  && phaseStatus.previous?.phaseId === "P139.7"
  && phaseStatus.next?.phaseId === "P140.2"
  && phaseIndex.current?.phaseId === "P140.1"
  && phaseIndex.previous?.phaseId === "P139.7"
  && phaseIndex.next?.phaseId === "P140.2"
  && statusById.get("P139")?.status === "complete"
  && indexById.get("P139")?.status === "complete"
  && statusById.get("P139.7")?.status === "complete"
  && indexById.get("P139.7")?.status === "complete"
  && statusById.get("P140")?.status === "in_progress"
  && indexById.get("P140")?.status === "in_progress"
  && statusById.get("P140.1")?.status === "complete"
  && indexById.get("P140.1")?.status === "complete"
  && statusById.get("P140.2")?.status === "planned"
  && indexById.get("P140.2")?.status === "planned";
const p1402CurrentState =
  phaseStatus.currentPhase === "P140.2"
  && phaseStatus.previousPhase === "P140.1"
  && phaseStatus.nextPhase === "P140.3"
  && phaseIndex.currentPhase === "P140.2"
  && phaseIndex.previousPhase === "P140.1"
  && phaseIndex.nextPhase === "P140.3"
  && phaseStatus.current?.phaseId === "P140.2"
  && phaseStatus.previous?.phaseId === "P140.1"
  && phaseStatus.next?.phaseId === "P140.3"
  && phaseIndex.current?.phaseId === "P140.2"
  && phaseIndex.previous?.phaseId === "P140.1"
  && phaseIndex.next?.phaseId === "P140.3"
  && statusById.get("P139")?.status === "complete"
  && indexById.get("P139")?.status === "complete"
  && statusById.get("P140")?.status === "in_progress"
  && indexById.get("P140")?.status === "in_progress"
  && statusById.get("P140.1")?.status === "complete"
  && indexById.get("P140.1")?.status === "complete"
  && statusById.get("P140.2")?.status === "complete"
  && indexById.get("P140.2")?.status === "complete"
  && statusById.get("P140.3")?.status === "planned"
  && indexById.get("P140.3")?.status === "planned";
const p1403CurrentState =
  phaseStatus.currentPhase === "P140.3"
  && phaseStatus.previousPhase === "P140.2"
  && phaseStatus.nextPhase === "P140.4"
  && phaseIndex.currentPhase === "P140.3"
  && phaseIndex.previousPhase === "P140.2"
  && phaseIndex.nextPhase === "P140.4"
  && phaseStatus.current?.phaseId === "P140.3"
  && phaseStatus.previous?.phaseId === "P140.2"
  && phaseStatus.next?.phaseId === "P140.4"
  && phaseIndex.current?.phaseId === "P140.3"
  && phaseIndex.previous?.phaseId === "P140.2"
  && phaseIndex.next?.phaseId === "P140.4"
  && statusById.get("P139")?.status === "complete"
  && indexById.get("P139")?.status === "complete"
  && statusById.get("P140")?.status === "in_progress"
  && indexById.get("P140")?.status === "in_progress"
  && statusById.get("P140.1")?.status === "complete"
  && indexById.get("P140.1")?.status === "complete"
  && statusById.get("P140.2")?.status === "complete"
  && indexById.get("P140.2")?.status === "complete"
  && statusById.get("P140.3")?.status === "complete"
  && indexById.get("P140.3")?.status === "complete"
  && statusById.get("P140.4")?.status === "planned"
  && indexById.get("P140.4")?.status === "planned";
const p1404CurrentState =
  phaseStatus.currentPhase === "P140.4"
  && phaseStatus.previousPhase === "P140.3"
  && phaseStatus.nextPhase === "P140.5"
  && phaseIndex.currentPhase === "P140.4"
  && phaseIndex.previousPhase === "P140.3"
  && phaseIndex.nextPhase === "P140.5"
  && phaseStatus.current?.phaseId === "P140.4"
  && phaseStatus.previous?.phaseId === "P140.3"
  && phaseStatus.next?.phaseId === "P140.5"
  && phaseIndex.current?.phaseId === "P140.4"
  && phaseIndex.previous?.phaseId === "P140.3"
  && phaseIndex.next?.phaseId === "P140.5"
  && statusById.get("P139")?.status === "complete"
  && indexById.get("P139")?.status === "complete"
  && statusById.get("P140")?.status === "in_progress"
  && indexById.get("P140")?.status === "in_progress"
  && statusById.get("P140.1")?.status === "complete"
  && indexById.get("P140.1")?.status === "complete"
  && statusById.get("P140.2")?.status === "complete"
  && indexById.get("P140.2")?.status === "complete"
  && statusById.get("P140.3")?.status === "complete"
  && indexById.get("P140.3")?.status === "complete"
  && statusById.get("P140.4")?.status === "complete"
  && indexById.get("P140.4")?.status === "complete"
  && statusById.get("P140.5")?.status === "planned"
  && indexById.get("P140.5")?.status === "planned";
const p1405CurrentState =
  phaseStatus.currentPhase === "P140.5"
  && phaseStatus.previousPhase === "P140.4"
  && phaseStatus.nextPhase === "P140.6"
  && phaseIndex.currentPhase === "P140.5"
  && phaseIndex.previousPhase === "P140.4"
  && phaseIndex.nextPhase === "P140.6"
  && phaseStatus.current?.phaseId === "P140.5"
  && phaseStatus.previous?.phaseId === "P140.4"
  && phaseStatus.next?.phaseId === "P140.6"
  && phaseIndex.current?.phaseId === "P140.5"
  && phaseIndex.previous?.phaseId === "P140.4"
  && phaseIndex.next?.phaseId === "P140.6"
  && statusById.get("P139")?.status === "complete"
  && indexById.get("P139")?.status === "complete"
  && statusById.get("P140")?.status === "in_progress"
  && indexById.get("P140")?.status === "in_progress"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P140.6")?.status === "planned"
  && indexById.get("P140.6")?.status === "planned";
const p1406CurrentState =
  phaseStatus.currentPhase === "P140.6"
  && phaseStatus.previousPhase === "P140.5"
  && phaseStatus.nextPhase === "P140.7"
  && phaseIndex.currentPhase === "P140.6"
  && phaseIndex.previousPhase === "P140.5"
  && phaseIndex.nextPhase === "P140.7"
  && phaseStatus.current?.phaseId === "P140.6"
  && phaseStatus.previous?.phaseId === "P140.5"
  && phaseStatus.next?.phaseId === "P140.7"
  && phaseIndex.current?.phaseId === "P140.6"
  && phaseIndex.previous?.phaseId === "P140.5"
  && phaseIndex.next?.phaseId === "P140.7"
  && statusById.get("P139")?.status === "complete"
  && indexById.get("P139")?.status === "complete"
  && statusById.get("P140")?.status === "in_progress"
  && indexById.get("P140")?.status === "in_progress"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P140.7")?.status === "planned"
  && indexById.get("P140.7")?.status === "planned";
const p1407FinalState =
  phaseStatus.currentPhase === "P140.7"
  && phaseStatus.previousPhase === "P140.6"
  && phaseStatus.nextPhase === "P141"
  && phaseIndex.currentPhase === "P140.7"
  && phaseIndex.previousPhase === "P140.6"
  && phaseIndex.nextPhase === "P141"
  && phaseStatus.current?.phaseId === "P140.7"
  && phaseStatus.previous?.phaseId === "P140.6"
  && phaseStatus.next?.phaseId === "P141"
  && phaseIndex.current?.phaseId === "P140.7"
  && phaseIndex.previous?.phaseId === "P140.6"
  && phaseIndex.next?.phaseId === "P141"
  && statusById.get("P139")?.status === "complete"
  && indexById.get("P139")?.status === "complete"
  && statusById.get("P140")?.status === "complete"
  && indexById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "planned"
  && indexById.get("P141")?.status === "planned";
const p1411StartedState =
  phaseStatus.currentPhase === "P141.1"
  && phaseStatus.previousPhase === "P140.7"
  && phaseStatus.nextPhase === "P141.2"
  && phaseIndex.currentPhase === "P141.1"
  && phaseIndex.previousPhase === "P140.7"
  && phaseIndex.nextPhase === "P141.2"
  && phaseStatus.current?.phaseId === "P141.1"
  && phaseStatus.previous?.phaseId === "P140.7"
  && phaseStatus.next?.phaseId === "P141.2"
  && phaseIndex.current?.phaseId === "P141.1"
  && phaseIndex.previous?.phaseId === "P140.7"
  && phaseIndex.next?.phaseId === "P141.2"
  && statusById.get("P140")?.status === "complete"
  && indexById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && indexById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && indexById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "planned"
  && indexById.get("P141.2")?.status === "planned";
const p1412CurrentState =
  phaseStatus.currentPhase === "P141.2"
  && phaseStatus.previousPhase === "P141.1"
  && phaseStatus.nextPhase === "P141.3"
  && phaseIndex.currentPhase === "P141.2"
  && phaseIndex.previousPhase === "P141.1"
  && phaseIndex.nextPhase === "P141.3"
  && phaseStatus.current?.phaseId === "P141.2"
  && phaseStatus.previous?.phaseId === "P141.1"
  && phaseStatus.next?.phaseId === "P141.3"
  && phaseIndex.current?.phaseId === "P141.2"
  && phaseIndex.previous?.phaseId === "P141.1"
  && phaseIndex.next?.phaseId === "P141.3"
  && statusById.get("P140")?.status === "complete"
  && indexById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && indexById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && indexById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "complete"
  && indexById.get("P141.2")?.status === "complete"
  && statusById.get("P141.3")?.status === "planned"
  && indexById.get("P141.3")?.status === "planned";
const p1413CurrentState =
  phaseStatus.currentPhase === "P141.3"
  && phaseStatus.previousPhase === "P141.2"
  && phaseStatus.nextPhase === "P141.4"
  && phaseIndex.currentPhase === "P141.3"
  && phaseIndex.previousPhase === "P141.2"
  && phaseIndex.nextPhase === "P141.4"
  && phaseStatus.current?.phaseId === "P141.3"
  && phaseStatus.previous?.phaseId === "P141.2"
  && phaseStatus.next?.phaseId === "P141.4"
  && phaseIndex.current?.phaseId === "P141.3"
  && phaseIndex.previous?.phaseId === "P141.2"
  && phaseIndex.next?.phaseId === "P141.4"
  && statusById.get("P140")?.status === "complete"
  && indexById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && indexById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && indexById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "complete"
  && indexById.get("P141.2")?.status === "complete"
  && statusById.get("P141.3")?.status === "complete"
  && indexById.get("P141.3")?.status === "complete"
  && statusById.get("P141.4")?.status === "planned"
  && indexById.get("P141.4")?.status === "planned";
const p1414CurrentState =
  phaseStatus.currentPhase === "P141.4"
  && phaseStatus.previousPhase === "P141.3"
  && phaseStatus.nextPhase === "P141.5"
  && phaseIndex.currentPhase === "P141.4"
  && phaseIndex.previousPhase === "P141.3"
  && phaseIndex.nextPhase === "P141.5"
  && phaseStatus.current?.phaseId === "P141.4"
  && phaseStatus.previous?.phaseId === "P141.3"
  && phaseStatus.next?.phaseId === "P141.5"
  && phaseIndex.current?.phaseId === "P141.4"
  && phaseIndex.previous?.phaseId === "P141.3"
  && phaseIndex.next?.phaseId === "P141.5"
  && statusById.get("P140")?.status === "complete"
  && indexById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && indexById.get("P141")?.status === "in_progress"
  && ["P141.1", "P141.2", "P141.3", "P141.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141.5")?.status === "planned"
  && indexById.get("P141.5")?.status === "planned";
const p1415CurrentState =
  phaseStatus.currentPhase === "P141.5"
  && phaseStatus.previousPhase === "P141.4"
  && phaseStatus.nextPhase === "P141.6"
  && phaseIndex.currentPhase === "P141.5"
  && phaseIndex.previousPhase === "P141.4"
  && phaseIndex.nextPhase === "P141.6"
  && phaseStatus.current?.phaseId === "P141.5"
  && phaseStatus.previous?.phaseId === "P141.4"
  && phaseStatus.next?.phaseId === "P141.6"
  && phaseIndex.current?.phaseId === "P141.5"
  && phaseIndex.previous?.phaseId === "P141.4"
  && phaseIndex.next?.phaseId === "P141.6"
  && statusById.get("P140")?.status === "complete"
  && indexById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && indexById.get("P141")?.status === "in_progress"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141.6")?.status === "planned"
  && indexById.get("P141.6")?.status === "planned";
const p1416CurrentState =
  phaseStatus.currentPhase === "P141.6"
  && phaseStatus.previousPhase === "P141.5"
  && phaseStatus.nextPhase === "P141.7"
  && phaseIndex.currentPhase === "P141.6"
  && phaseIndex.previousPhase === "P141.5"
  && phaseIndex.nextPhase === "P141.7"
  && phaseStatus.current?.phaseId === "P141.6"
  && phaseStatus.previous?.phaseId === "P141.5"
  && phaseStatus.next?.phaseId === "P141.7"
  && phaseIndex.current?.phaseId === "P141.6"
  && phaseIndex.previous?.phaseId === "P141.5"
  && phaseIndex.next?.phaseId === "P141.7"
  && statusById.get("P140")?.status === "complete"
  && indexById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && indexById.get("P141")?.status === "in_progress"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141.7")?.status === "planned"
  && indexById.get("P141.7")?.status === "planned";
const p1417FinalState =
  phaseStatus.currentPhase === "P141.7"
  && phaseStatus.previousPhase === "P141.6"
  && phaseStatus.nextPhase === "P142"
  && phaseIndex.currentPhase === "P141.7"
  && phaseIndex.previousPhase === "P141.6"
  && phaseIndex.nextPhase === "P142"
  && phaseStatus.current?.phaseId === "P141.7"
  && phaseStatus.previous?.phaseId === "P141.6"
  && phaseStatus.next?.phaseId === "P142"
  && phaseIndex.current?.phaseId === "P141.7"
  && phaseIndex.previous?.phaseId === "P141.6"
  && phaseIndex.next?.phaseId === "P142"
  && statusById.get("P140")?.status === "complete"
  && indexById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "complete"
  && indexById.get("P141")?.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "planned"
  && indexById.get("P142")?.status === "planned";
const p1421StartedState =
  phaseStatus.currentPhase === "P142.1"
  && phaseStatus.previousPhase === "P141.7"
  && phaseStatus.nextPhase === "P142.2"
  && phaseIndex.currentPhase === "P142.1"
  && phaseIndex.previousPhase === "P141.7"
  && phaseIndex.nextPhase === "P142.2"
  && phaseStatus.current?.phaseId === "P142.1"
  && phaseStatus.previous?.phaseId === "P141.7"
  && phaseStatus.next?.phaseId === "P142.2"
  && phaseIndex.current?.phaseId === "P142.1"
  && phaseIndex.previous?.phaseId === "P141.7"
  && phaseIndex.next?.phaseId === "P142.2"
  && statusById.get("P141")?.status === "complete"
  && indexById.get("P141")?.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "in_progress"
  && indexById.get("P142")?.status === "in_progress"
  && statusById.get("P142.1")?.status === "complete"
  && indexById.get("P142.1")?.status === "complete"
  && statusById.get("P142.2")?.status === "planned"
  && indexById.get("P142.2")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && indexById.get("P143")?.status === "planned";
const p1422CurrentState =
  phaseStatus.currentPhase === "P142.2"
  && phaseStatus.previousPhase === "P142.1"
  && phaseStatus.nextPhase === "P142.3"
  && phaseIndex.currentPhase === "P142.2"
  && phaseIndex.previousPhase === "P142.1"
  && phaseIndex.nextPhase === "P142.3"
  && phaseStatus.current?.phaseId === "P142.2"
  && phaseStatus.previous?.phaseId === "P142.1"
  && phaseStatus.next?.phaseId === "P142.3"
  && phaseIndex.current?.phaseId === "P142.2"
  && phaseIndex.previous?.phaseId === "P142.1"
  && phaseIndex.next?.phaseId === "P142.3"
  && statusById.get("P141")?.status === "complete"
  && indexById.get("P141")?.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "in_progress"
  && indexById.get("P142")?.status === "in_progress"
  && statusById.get("P142.1")?.status === "complete"
  && indexById.get("P142.1")?.status === "complete"
  && statusById.get("P142.2")?.status === "complete"
  && indexById.get("P142.2")?.status === "complete"
  && statusById.get("P142.3")?.status === "planned"
  && indexById.get("P142.3")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && indexById.get("P143")?.status === "planned";
const p1423CurrentState =
  phaseStatus.currentPhase === "P142.3"
  && phaseStatus.previousPhase === "P142.2"
  && phaseStatus.nextPhase === "P142.4"
  && phaseIndex.currentPhase === "P142.3"
  && phaseIndex.previousPhase === "P142.2"
  && phaseIndex.nextPhase === "P142.4"
  && phaseStatus.current?.phaseId === "P142.3"
  && phaseStatus.previous?.phaseId === "P142.2"
  && phaseStatus.next?.phaseId === "P142.4"
  && phaseIndex.current?.phaseId === "P142.3"
  && phaseIndex.previous?.phaseId === "P142.2"
  && phaseIndex.next?.phaseId === "P142.4"
  && statusById.get("P141")?.status === "complete"
  && indexById.get("P141")?.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "in_progress"
  && indexById.get("P142")?.status === "in_progress"
  && statusById.get("P142.1")?.status === "complete"
  && indexById.get("P142.1")?.status === "complete"
  && statusById.get("P142.2")?.status === "complete"
  && indexById.get("P142.2")?.status === "complete"
  && statusById.get("P142.3")?.status === "complete"
  && indexById.get("P142.3")?.status === "complete"
  && statusById.get("P142.4")?.status === "planned"
  && indexById.get("P142.4")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && indexById.get("P143")?.status === "planned";
const p1424CurrentState =
  phaseStatus.currentPhase === "P142.4"
  && phaseStatus.previousPhase === "P142.3"
  && phaseStatus.nextPhase === "P142.5"
  && phaseIndex.currentPhase === "P142.4"
  && phaseIndex.previousPhase === "P142.3"
  && phaseIndex.nextPhase === "P142.5"
  && phaseStatus.current?.phaseId === "P142.4"
  && phaseStatus.previous?.phaseId === "P142.3"
  && phaseStatus.next?.phaseId === "P142.5"
  && phaseIndex.current?.phaseId === "P142.4"
  && phaseIndex.previous?.phaseId === "P142.3"
  && phaseIndex.next?.phaseId === "P142.5"
  && statusById.get("P141")?.status === "complete"
  && indexById.get("P141")?.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "in_progress"
  && indexById.get("P142")?.status === "in_progress"
  && ["P142.1", "P142.2", "P142.3", "P142.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142.5")?.status === "planned"
  && indexById.get("P142.5")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && indexById.get("P143")?.status === "planned";
const p1425CurrentState =
  phaseStatus.currentPhase === "P142.5"
  && phaseStatus.previousPhase === "P142.4"
  && phaseStatus.nextPhase === "P142.6"
  && phaseIndex.currentPhase === "P142.5"
  && phaseIndex.previousPhase === "P142.4"
  && phaseIndex.nextPhase === "P142.6"
  && phaseStatus.current?.phaseId === "P142.5"
  && phaseStatus.previous?.phaseId === "P142.4"
  && phaseStatus.next?.phaseId === "P142.6"
  && phaseIndex.current?.phaseId === "P142.5"
  && phaseIndex.previous?.phaseId === "P142.4"
  && phaseIndex.next?.phaseId === "P142.6"
  && statusById.get("P141")?.status === "complete"
  && indexById.get("P141")?.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "in_progress"
  && indexById.get("P142")?.status === "in_progress"
  && ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142.6")?.status === "planned"
  && indexById.get("P142.6")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && indexById.get("P143")?.status === "planned";
const p1426CurrentState =
  phaseStatus.currentPhase === "P142.6"
  && phaseStatus.previousPhase === "P142.5"
  && phaseStatus.nextPhase === "P142.7"
  && phaseIndex.currentPhase === "P142.6"
  && phaseIndex.previousPhase === "P142.5"
  && phaseIndex.nextPhase === "P142.7"
  && phaseStatus.current?.phaseId === "P142.6"
  && phaseStatus.previous?.phaseId === "P142.5"
  && phaseStatus.next?.phaseId === "P142.7"
  && phaseIndex.current?.phaseId === "P142.6"
  && phaseIndex.previous?.phaseId === "P142.5"
  && phaseIndex.next?.phaseId === "P142.7"
  && statusById.get("P141")?.status === "complete"
  && indexById.get("P141")?.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "in_progress"
  && indexById.get("P142")?.status === "in_progress"
  && ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5", "P142.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142.7")?.status === "planned"
  && indexById.get("P142.7")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && indexById.get("P143")?.status === "planned";
const p1427FinalState =
  phaseStatus.currentPhase === "P142.7"
  && phaseStatus.previousPhase === "P142.6"
  && phaseStatus.nextPhase === "P143"
  && phaseIndex.currentPhase === "P142.7"
  && phaseIndex.previousPhase === "P142.6"
  && phaseIndex.nextPhase === "P143"
  && phaseStatus.current?.phaseId === "P142.7"
  && phaseStatus.previous?.phaseId === "P142.6"
  && phaseStatus.next?.phaseId === "P143"
  && phaseIndex.current?.phaseId === "P142.7"
  && phaseIndex.previous?.phaseId === "P142.6"
  && phaseIndex.next?.phaseId === "P143"
  && statusById.get("P141")?.status === "complete"
  && indexById.get("P141")?.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "complete"
  && indexById.get("P142")?.status === "complete"
  && ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5", "P142.6", "P142.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P143")?.status === "planned"
  && indexById.get("P143")?.status === "planned";
const p1431StartedState =
  phaseStatus.currentPhase === "P143.1"
  && phaseStatus.previousPhase === "P142.7"
  && phaseStatus.nextPhase === "P143.2"
  && phaseIndex.currentPhase === "P143.1"
  && phaseIndex.previousPhase === "P142.7"
  && phaseIndex.nextPhase === "P143.2"
  && phaseStatus.current?.phaseId === "P143.1"
  && phaseStatus.previous?.phaseId === "P142.7"
  && phaseStatus.next?.phaseId === "P143.2"
  && phaseIndex.current?.phaseId === "P143.1"
  && phaseIndex.previous?.phaseId === "P142.7"
  && phaseIndex.next?.phaseId === "P143.2"
  && statusById.get("P142")?.status === "complete"
  && indexById.get("P142")?.status === "complete"
  && statusById.get("P142.7")?.status === "complete"
  && indexById.get("P142.7")?.status === "complete"
  && statusById.get("P143")?.status === "in_progress"
  && indexById.get("P143")?.status === "in_progress"
  && statusById.get("P143.1")?.status === "complete"
  && indexById.get("P143.1")?.status === "complete"
  && statusById.get("P143.2")?.status === "planned"
  && indexById.get("P143.2")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && indexById.get("P144")?.status === "planned";
const p1432CurrentState =
  phaseStatus.currentPhase === "P143.2"
  && phaseStatus.previousPhase === "P143.1"
  && phaseStatus.nextPhase === "P143.3"
  && phaseIndex.currentPhase === "P143.2"
  && phaseIndex.previousPhase === "P143.1"
  && phaseIndex.nextPhase === "P143.3"
  && phaseStatus.current?.phaseId === "P143.2"
  && phaseStatus.previous?.phaseId === "P143.1"
  && phaseStatus.next?.phaseId === "P143.3"
  && phaseIndex.current?.phaseId === "P143.2"
  && phaseIndex.previous?.phaseId === "P143.1"
  && phaseIndex.next?.phaseId === "P143.3"
  && statusById.get("P142")?.status === "complete"
  && indexById.get("P142")?.status === "complete"
  && statusById.get("P143")?.status === "in_progress"
  && indexById.get("P143")?.status === "in_progress"
  && statusById.get("P143.1")?.status === "complete"
  && indexById.get("P143.1")?.status === "complete"
  && statusById.get("P143.2")?.status === "complete"
  && indexById.get("P143.2")?.status === "complete"
  && statusById.get("P143.3")?.status === "planned"
  && indexById.get("P143.3")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && indexById.get("P144")?.status === "planned";
const p1433CurrentState =
  phaseStatus.currentPhase === "P143.3"
  && phaseStatus.previousPhase === "P143.2"
  && phaseStatus.nextPhase === "P143.4"
  && phaseIndex.currentPhase === "P143.3"
  && phaseIndex.previousPhase === "P143.2"
  && phaseIndex.nextPhase === "P143.4"
  && phaseStatus.current?.phaseId === "P143.3"
  && phaseStatus.previous?.phaseId === "P143.2"
  && phaseStatus.next?.phaseId === "P143.4"
  && phaseIndex.current?.phaseId === "P143.3"
  && phaseIndex.previous?.phaseId === "P143.2"
  && phaseIndex.next?.phaseId === "P143.4"
  && statusById.get("P142")?.status === "complete"
  && indexById.get("P142")?.status === "complete"
  && statusById.get("P143")?.status === "in_progress"
  && indexById.get("P143")?.status === "in_progress"
  && ["P143.1", "P143.2", "P143.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P143.4")?.status === "planned"
  && indexById.get("P143.4")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && indexById.get("P144")?.status === "planned";
const p1434CurrentState =
  phaseStatus.currentPhase === "P143.4"
  && phaseStatus.previousPhase === "P143.3"
  && phaseStatus.nextPhase === "P143.5"
  && phaseIndex.currentPhase === "P143.4"
  && phaseIndex.previousPhase === "P143.3"
  && phaseIndex.nextPhase === "P143.5"
  && phaseStatus.current?.phaseId === "P143.4"
  && phaseStatus.previous?.phaseId === "P143.3"
  && phaseStatus.next?.phaseId === "P143.5"
  && phaseIndex.current?.phaseId === "P143.4"
  && phaseIndex.previous?.phaseId === "P143.3"
  && phaseIndex.next?.phaseId === "P143.5"
  && statusById.get("P142")?.status === "complete"
  && indexById.get("P142")?.status === "complete"
  && statusById.get("P143")?.status === "in_progress"
  && indexById.get("P143")?.status === "in_progress"
  && ["P143.1", "P143.2", "P143.3", "P143.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P143.5")?.status === "planned"
  && indexById.get("P143.5")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && indexById.get("P144")?.status === "planned";
const p1435CurrentState =
  phaseStatus.currentPhase === "P143.5"
  && phaseStatus.previousPhase === "P143.4"
  && phaseStatus.nextPhase === "P143.6"
  && phaseIndex.currentPhase === "P143.5"
  && phaseIndex.previousPhase === "P143.4"
  && phaseIndex.nextPhase === "P143.6"
  && phaseStatus.current?.phaseId === "P143.5"
  && phaseStatus.previous?.phaseId === "P143.4"
  && phaseStatus.next?.phaseId === "P143.6"
  && phaseIndex.current?.phaseId === "P143.5"
  && phaseIndex.previous?.phaseId === "P143.4"
  && phaseIndex.next?.phaseId === "P143.6"
  && statusById.get("P142")?.status === "complete"
  && indexById.get("P142")?.status === "complete"
  && statusById.get("P143")?.status === "in_progress"
  && indexById.get("P143")?.status === "in_progress"
  && ["P143.1", "P143.2", "P143.3", "P143.4", "P143.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P143.6")?.status === "planned"
  && indexById.get("P143.6")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && indexById.get("P144")?.status === "planned";

const p138ActiveState = p1381StartedState || p1382CurrentState || p1383CurrentState || p1384CurrentState || p1385CurrentState || p1386CurrentState || p1387FinalState;
const p139ActiveState = p1391StartedState || p1392CurrentState || p1393CurrentState || p1394CurrentState || p1395CurrentState || p1396CurrentState || p1397FinalState;
const p140ActiveState = p1401StartedState || p1402CurrentState || p1403CurrentState || p1404CurrentState || p1405CurrentState || p1406CurrentState || p1407FinalState;
const p141ActiveState = p1411StartedState || p1412CurrentState || p1413CurrentState || p1414CurrentState || p1415CurrentState || p1416CurrentState || p1417FinalState;
const p142ActiveState = p1421StartedState || p1422CurrentState || p1423CurrentState || p1424CurrentState || p1425CurrentState || p1426CurrentState || p1427FinalState;
const p143ActiveState = p1431StartedState || p1432CurrentState || p1433CurrentState || p1434CurrentState || p1435CurrentState;
const enterpriseActiveState = p133ActiveState || p134ActiveState || p135ActiveState || p136ActiveState || p137ActiveState || p138ActiveState || p139ActiveState || p140ActiveState || p141ActiveState || p142ActiveState || p143ActiveState;
const currentP133CheckCommand = p1337FinalState
  ? "npm run check:p1337-founder-idea-to-prd-final-validation"
  : p1336CompleteState
  ? "npm run check:p1336-founder-idea-to-prd-docs-roadmap"
  : p1335CompleteState
  ? "npm run check:p1335-founder-idea-to-prd-tests-checkers"
  : p1334CompleteState
    ? "npm run check:p1334-command-center-idea-to-prd-ux"
    : p1333CompleteState
      ? "npm run check:p1333-founder-idea-to-prd-preview"
      : p1332CompleteState
        ? "npm run check:p1332-founder-idea-to-prd-model"
        : "npm run check:p1331-founder-idea-to-prd-productization";

const currentP134CheckCommand = p1347FinalState
  ? "npm run check:p1347-durable-db-crud-runtime-final-validation"
  : p1346CurrentState
  ? "npm run check:p1346-durable-db-crud-runtime-docs-roadmap"
  : p1345CurrentState
  ? "npm run check:p1345-durable-db-crud-runtime-tests-checkers"
  : p1344CurrentState
  ? "npm run check:p1344-durable-db-crud-runtime-command-center-ux"
  : p1343CurrentState
  ? "npm run check:p1343-durable-db-crud-runtime-write-plan-preview"
  : p1342CurrentState
  ? "npm run check:p1342-durable-db-crud-runtime-schema-model"
  : p1341StartedState
  ? "npm run check:p1341-durable-db-crud-runtime"
  : "";
const currentP135CheckCommand = p1357FinalState
  ? "npm run check:p1357-identity-tenant-roles-permissions-final-validation"
  : p1356CurrentState
  ? "npm run check:p1356-identity-tenant-roles-permissions-docs-roadmap"
  : p1355CurrentState
  ? "npm run check:p1355-identity-tenant-roles-permissions-tests-checkers"
  : p1354CurrentState
  ? "npm run check:p1354-auth-governance-command-center-ux"
  : p1353CurrentState
  ? "npm run check:p1353-permission-preview"
  : p1352CurrentState
    ? "npm run check:p1352-auth-tenant-model"
    : p1351StartedState
    ? "npm run check:p1351-identity-tenant-roles-permissions"
    : "";
const currentP136CheckCommand = p1367FinalState
  ? "npm run check:p1367-secrets-providers-tool-governance-final-validation"
  : p1366CurrentState
  ? "npm run check:p1366-secrets-providers-tool-governance-docs-roadmap"
  : p1365CurrentState
  ? "npm run check:p1365-secrets-providers-tool-governance-tests-checkers"
  : p1364CurrentState
  ? "npm run check:p1364-provider-governance-command-center-ux"
  : p1363CurrentState
  ? "npm run check:p1363-provider-dry-run"
  : p1362CurrentState
  ? "npm run check:p1362-secret-provider-model"
  : p1361StartedState
  ? "npm run check:p1361-secrets-providers-tool-governance"
  : "";
const currentP137CheckCommand = p1371StartedState
  ? "npm run check:p1371-agent-work-order-runtime"
  : p1372CurrentState
  ? "npm run check:p1372-agent-work-order-runtime"
  : p1373CurrentState
  ? "npm run check:p1373-agent-work-order-runtime"
  : p1374CurrentState
  ? "npm run check:p1374-agent-work-order-runtime"
  : p1375CurrentState
  ? "npm run check:p1375-agent-work-order-runtime"
  : p1376CurrentState
  ? "npm run check:p1376-agent-work-order-runtime"
  : p1377FinalState
  ? "npm run check:p1377-agent-work-order-runtime"
  : "";
const currentP138CheckCommand = p1381StartedState
  ? "npm run check:p1381-project-workspace-mutation-build-pipeline"
  : p1382CurrentState
  ? "npm run check:p1382-project-workspace-mutation-build-pipeline"
  : p1383CurrentState
  ? "npm run check:p1383-project-workspace-mutation-build-pipeline"
  : p1384CurrentState
  ? "npm run check:p1384-project-workspace-mutation-build-pipeline"
  : p1385CurrentState
  ? "npm run check:p1385-project-workspace-mutation-build-pipeline"
  : p1386CurrentState
  ? "npm run check:p1386-project-workspace-mutation-build-pipeline"
  : p1387FinalState
  ? "npm run check:p1387-project-workspace-mutation-build-pipeline"
  : "";
const currentP139CheckCommand = p1391StartedState
  ? "npm run check:p1391-evidence-audit-observability-cost-ledger"
  : p1392CurrentState
  ? "npm run check:p1392-evidence-audit-observability-cost-ledger"
  : p1393CurrentState
  ? "npm run check:p1393-evidence-audit-observability-cost-ledger"
  : p1394CurrentState
  ? "npm run check:p1394-evidence-audit-observability-cost-ledger"
  : p1395CurrentState
  ? "npm run check:p1395-evidence-audit-observability-cost-ledger"
  : p1396CurrentState
  ? "npm run check:p1396-evidence-audit-observability-cost-ledger"
  : p1397FinalState
  ? "npm run check:p1397-evidence-audit-observability-cost-ledger"
  : "";
const currentP140CheckCommand = p1401StartedState
  ? "npm run check:p1401-backup-recovery-dr-retention"
  : p1402CurrentState
  ? "npm run check:p1402-backup-recovery-dr-retention"
  : p1403CurrentState
  ? "npm run check:p1403-backup-recovery-dr-restore-preview"
  : p1404CurrentState
  ? "npm run check:p1404-backup-recovery-dr-command-center-ux"
  : p1405CurrentState
  ? "npm run check:p1405-backup-recovery-dr-tests-checkers"
  : p1406CurrentState
  ? "npm run check:p1406-backup-recovery-dr-docs-roadmap"
  : p1407FinalState
  ? "npm run check:p1407-backup-recovery-dr-final-validation"
  : "";
const currentP141CheckCommand = p1417FinalState
  ? "npm run check:p1417-security-privacy-compliance-controls-final-validation"
  : p1416CurrentState
  ? "npm run check:p1416-security-privacy-compliance-controls-docs-roadmap"
  : p1415CurrentState
  ? "npm run check:p1415-security-privacy-compliance-controls"
  : p1414CurrentState
  ? "npm run check:p1414-security-privacy-compliance-controls"
  : p1413CurrentState
  ? "npm run check:p1413-security-privacy-compliance-controls"
  : p1412CurrentState
  ? "npm run check:p1412-security-privacy-compliance-controls"
  : p1411StartedState
  ? "npm run check:p1411-security-privacy-compliance-controls"
  : "";
const currentP142CheckCommand = p1427FinalState
  ? "npm run check:p1427-admin-operations-runtime-settings-final-validation"
  : p1426CurrentState
  ? "npm run check:p1426-admin-operations-runtime-settings-docs-roadmap"
  : p1425CurrentState
  ? "npm run check:p1425-admin-operations-runtime-settings"
  : p1424CurrentState
  ? "npm run check:p1424-admin-operations-runtime-settings"
  : p1423CurrentState
  ? "npm run check:p1423-admin-operations-runtime-settings"
  : p1422CurrentState
  ? "npm run check:p1422-admin-operations-runtime-settings"
  : p1421StartedState
  ? "npm run check:p1421-admin-operations-runtime-settings"
  : "";
const currentP143CheckCommand = p1435CurrentState
  ? "npm run check:p1435-release-deploy-export-package-pipeline"
  : p1434CurrentState
  ? "npm run check:p1434-release-deploy-export-package-pipeline"
  : p1433CurrentState
  ? "npm run check:p1433-release-deploy-export-package-pipeline"
  : p1432CurrentState
  ? "npm run check:p1432-release-deploy-export-package-pipeline"
  : p1431StartedState
  ? "npm run check:p1431-release-deploy-export-package-pipeline"
  : "";

const enterprisePhases = [
  ["P133", "Founder Idea-to-PRD Productization"],
  ["P134", "Durable DB and CRUD Runtime"],
  ["P135", "Identity, Tenant, Roles, and Permissions"],
  ["P136", "Secrets, Providers, and Tool Governance"],
  ["P137", "Agent Work Order Runtime"],
  ["P138", "Project Workspace Mutation and Build Pipeline"],
  ["P139", "Evidence, Audit, Observability, and Cost Ledger"],
  ["P140", "Backup, Recovery, DR, and Retention"],
  ["P141", "Security, Privacy, and Compliance Controls"],
  ["P142", "Admin Operations and Runtime Settings"],
  ["P143", "Release, Deploy, Export, and Package Pipeline"],
  ["P144", "Billing, Metering, and Customer Operations"],
  ["P145", "Enterprise Certification and GA Readiness"],
];
const allowedFiles = new Set([
  "contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json",
  "contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json",
  "contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json",
  "contracts/os-roadmap/p136-secrets-providers-tool-governance-contracts.json",
  "contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json",
  "contracts/os-roadmap/p138-project-workspace-mutation-build-pipeline-contracts.json",
  "contracts/os-roadmap/p139-evidence-audit-observability-cost-ledger-contracts.json",
  "contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json",
  "contracts/os-roadmap/p141-security-privacy-compliance-controls-contracts.json",
  "contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json",
  "contracts/os-roadmap/p143-release-deploy-export-package-pipeline-contracts.json",
  "shared/releaseDeployExportPackageModel.js",
  "shared/releaseDeployExportPackagePreview.js",
  "dashboard/src/data/releaseDeployExportPackageUx.js",
  "dashboard/src/data/releaseReadiness.js",
  "dashboard/src/data/deployMonitoringReadiness.js",
  "dashboard/src/data/projectShippingReadiness.js",
  "shared/securityPrivacyComplianceControlModel.js",
  "shared/securityPrivacyCompliancePreview.js",
  "dashboard/src/data/complianceReadiness.js",
	  "auth-governance/p135-2-auth-tenant-model.js",
	  "auth-governance/p135-3-permission-preview.js",
	  "shared/providerGovernanceModel.js",
	  "shared/providerGovernanceDryRun.js",
  "dashboard/src/data/providerGovernanceReadiness.js",
  "dashboard/src/data/authGovernanceReadiness.js",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/src/data/commandCenterRoutes.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  "docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md",
  "docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md",
  "docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md",
  "docs/architecture/P136_SECRETS_PROVIDERS_TOOL_GOVERNANCE_PLAN.md",
  "docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md",
  "docs/architecture/P138_PROJECT_WORKSPACE_MUTATION_BUILD_PIPELINE_PLAN.md",
  "docs/architecture/P139_EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PLAN.md",
  "docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md",
  "docs/architecture/P141_SECURITY_PRIVACY_COMPLIANCE_CONTROLS_PLAN.md",
  "docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md",
  "docs/architecture/P143_RELEASE_DEPLOY_EXPORT_PACKAGE_PIPELINE_PLAN.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  DOC_PATH,
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "README.md",
  "package.json",
  "scripts/check-p1331-founder-idea-to-prd-productization.js",
  "scripts/check-p1332-founder-idea-to-prd-model.js",
  "scripts/check-p1333-founder-idea-to-prd-preview.js",
  "scripts/check-p1334-command-center-idea-to-prd-ux.js",
  "scripts/check-p1335-founder-idea-to-prd-tests-checkers.js",
  "scripts/check-p1336-founder-idea-to-prd-docs-roadmap.js",
  "scripts/check-p1337-founder-idea-to-prd-final-validation.js",
  "scripts/check-p1341-durable-db-crud-runtime.js",
  "scripts/check-p1342-durable-db-crud-runtime-schema-model.js",
  "scripts/check-p1343-durable-db-crud-runtime-write-plan-preview.js",
  "scripts/check-p1344-durable-db-crud-runtime-command-center-ux.js",
  "scripts/check-p1345-durable-db-crud-runtime-tests-checkers.js",
  "scripts/check-p1346-durable-db-crud-runtime-docs-roadmap.js",
  "scripts/check-p1347-durable-db-crud-runtime-final-validation.js",
  "scripts/check-p1351-identity-tenant-roles-permissions.js",
  "scripts/check-p1352-auth-tenant-model.js",
  "scripts/check-p1353-permission-preview.js",
  "scripts/check-p1354-auth-governance-command-center-ux.js",
  "scripts/check-p1355-identity-tenant-roles-permissions-tests-checkers.js",
  "scripts/check-p1356-identity-tenant-roles-permissions-docs-roadmap.js",
  "scripts/check-p1357-identity-tenant-roles-permissions-final-validation.js",
	  "scripts/check-p1361-secrets-providers-tool-governance.js",
	  "scripts/check-p1362-secret-provider-model.js",
	  "scripts/check-p1363-provider-dry-run.js",
  "scripts/check-p1364-provider-governance-command-center-ux.js",
  "scripts/check-p1365-secrets-providers-tool-governance-tests-checkers.js",
  "scripts/check-p1366-secrets-providers-tool-governance-docs-roadmap.js",
  "scripts/check-p1367-secrets-providers-tool-governance-final-validation.js",
  "scripts/check-p1371-agent-work-order-runtime.js",
  "scripts/check-p1372-agent-work-order-runtime.js",
  "scripts/check-p1373-agent-work-order-runtime.js",
  "scripts/check-p1374-agent-work-order-runtime.js",
  "scripts/check-p1375-agent-work-order-runtime.js",
  "scripts/check-p1376-agent-work-order-runtime.js",
  "scripts/check-p1377-agent-work-order-runtime.js",
  "scripts/check-p1381-project-workspace-mutation-build-pipeline.js",
  "scripts/check-p1382-project-workspace-mutation-build-pipeline.js",
  "scripts/check-p1383-project-workspace-mutation-build-pipeline.js",
  "scripts/check-p1384-project-workspace-mutation-build-pipeline.js",
  "scripts/check-p1385-project-workspace-mutation-build-pipeline.js",
  "scripts/check-p1386-project-workspace-mutation-build-pipeline.js",
  "scripts/check-p1387-project-workspace-mutation-build-pipeline.js",
  "scripts/check-p1391-evidence-audit-observability-cost-ledger.js",
  "scripts/check-p1392-evidence-audit-observability-cost-ledger.js",
  "scripts/check-p1393-evidence-audit-observability-cost-ledger.js",
  "scripts/check-p1394-evidence-audit-observability-cost-ledger.js",
  "scripts/check-p1395-evidence-audit-observability-cost-ledger.js",
  "scripts/check-p1396-evidence-audit-observability-cost-ledger.js",
  "scripts/check-p1397-evidence-audit-observability-cost-ledger.js",
  "scripts/check-p1401-backup-recovery-dr-retention.js",
  "scripts/check-p1402-backup-recovery-dr-retention.js",
  "scripts/check-p1403-backup-recovery-dr-restore-preview.js",
  "scripts/check-p1404-backup-recovery-dr-command-center-ux.js",
  "scripts/check-p1405-backup-recovery-dr-tests-checkers.js",
  "scripts/check-p1406-backup-recovery-dr-docs-roadmap.js",
  "scripts/check-p1407-backup-recovery-dr-final-validation.js",
  "scripts/check-p1411-security-privacy-compliance-controls.js",
  "scripts/check-p1412-security-privacy-compliance-controls.js",
  "scripts/check-p1413-security-privacy-compliance-controls.js",
  "scripts/check-p1414-security-privacy-compliance-controls.js",
  "scripts/check-p1415-security-privacy-compliance-controls.js",
  "scripts/check-p1416-security-privacy-compliance-controls-docs-roadmap.js",
  "scripts/check-p1417-security-privacy-compliance-controls-final-validation.js",
  "scripts/check-p1421-admin-operations-runtime-settings.js",
  "scripts/check-p1422-admin-operations-runtime-settings.js",
  "scripts/check-p1423-admin-operations-runtime-settings.js",
  "scripts/check-p1424-admin-operations-runtime-settings.js",
  "scripts/check-p1425-admin-operations-runtime-settings.js",
  "scripts/check-p1426-admin-operations-runtime-settings-docs-roadmap.js",
  "scripts/check-p1427-admin-operations-runtime-settings-final-validation.js",
  "scripts/check-p1431-release-deploy-export-package-pipeline.js",
  "scripts/check-p1432-release-deploy-export-package-pipeline.js",
  "scripts/check-p1433-release-deploy-export-package-pipeline.js",
  "scripts/check-p1434-release-deploy-export-package-pipeline.js",
  "scripts/check-p1435-release-deploy-export-package-pipeline.js",
  "shared/adminOperationsRuntimeSettingsDryRun.js",
  "shared/projectPatchBuildPreview.js",
		  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  "scripts/check-p1327-founder-runtime-store-live-admission-execution.js",
  "scripts/check-p904-command-center-prd-lane-ux.js",
  "scripts/check-p905-founder-prd-lane-validation.js",
  "scripts/check-p907-founder-prd-final.js",
  "live-ready/founderIdeaToPrdModel.js",
  "live-ready/founderIdeaToPrdPreview.js",
  "shared/durableDbCrudRuntimeSchemaModel.js",
  "shared/durableDbCrudRuntimeWritePlanPreview.js",
  "shared/agentWorkOrderRuntimeModel.js",
  "shared/projectWorkspaceMutationModel.js",
  "shared/evidenceAuditObservabilityCostLedgerModel.js",
  "shared/evidenceAuditObservabilityCostLedgerPreview.js",
  "shared/evidenceAuditObservabilityCostLedgerUxProjection.js",
  "shared/backupRecoveryDrRetentionModel.js",
  "shared/backupRecoveryDrRestorePreview.js",
  "shared/adminOperationsRuntimeSettingsModel.js",
  "dashboard/src/data/adminOperationsRuntimeSettingsReadiness.js",
  "dashboard/src/data/backupDrReadiness.js",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/src/data/evidenceAuditObservabilityCostLedgerUx.js",
  "dashboard/src/data/dbRuntimeReadiness.js",
  "dashboard/src/data/businessBuild.js",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  "reports/p1331-founder-idea-to-prd-productization-report.md",
  "reports/p1332-founder-idea-to-prd-model-report.md",
  "reports/p1333-founder-idea-to-prd-preview-report.md",
  "reports/p1334-command-center-idea-to-prd-ux-report.md",
  "reports/p1335-founder-idea-to-prd-tests-checkers-report.md",
  "reports/p1336-founder-idea-to-prd-docs-roadmap-report.md",
  "reports/p1337-founder-idea-to-prd-final-validation-report.md",
  "reports/p1341-durable-db-crud-runtime-report.md",
  "reports/p1342-durable-db-crud-runtime-schema-model-report.md",
  "reports/p1343-durable-db-crud-runtime-write-plan-preview-report.md",
  "reports/p1344-durable-db-crud-runtime-command-center-ux-report.md",
  "reports/p1345-durable-db-crud-runtime-tests-checkers-report.md",
  "reports/p1346-durable-db-crud-runtime-docs-roadmap-report.md",
  "reports/p1347-durable-db-crud-runtime-final-validation-report.md",
  "reports/p1351-identity-tenant-roles-permissions-report.md",
  "reports/p1352-auth-tenant-model-report.md",
  "reports/p1353-permission-preview-report.md",
  "reports/p1354-auth-governance-command-center-ux-report.md",
  "reports/p1355-identity-tenant-roles-permissions-tests-checkers-report.md",
  "reports/p1356-identity-tenant-roles-permissions-docs-roadmap-report.md",
  "reports/p1357-identity-tenant-roles-permissions-final-validation-report.md",
	  "reports/p1361-secrets-providers-tool-governance-report.md",
	  "reports/p1362-secret-provider-model-report.md",
	  "reports/p1363-provider-dry-run-report.md",
  "reports/p1364-provider-governance-command-center-ux-report.md",
  "reports/p1365-secrets-providers-tool-governance-tests-checkers-report.md",
  "reports/p1366-secrets-providers-tool-governance-docs-roadmap-report.md",
  "reports/p1367-secrets-providers-tool-governance-final-validation-report.md",
  "reports/p1371-agent-work-order-runtime-report.md",
  "reports/p1372-agent-work-order-runtime-report.md",
  "reports/p1373-agent-work-order-runtime-report.md",
  "reports/p1374-agent-work-order-runtime-report.md",
  "reports/p1375-agent-work-order-runtime-report.md",
  "reports/p1376-agent-work-order-runtime-report.md",
  "reports/p1377-agent-work-order-runtime-report.md",
  "reports/p1381-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1382-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1383-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1384-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1385-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1386-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1387-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1391-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1392-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1393-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1394-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1395-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1396-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1397-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1401-backup-recovery-dr-retention-report.md",
  "reports/p1402-backup-recovery-dr-retention-report.md",
  "reports/p1403-backup-recovery-dr-restore-preview-report.md",
  "reports/p1404-backup-recovery-dr-command-center-ux-report.md",
  "reports/p1405-backup-recovery-dr-tests-checkers-report.md",
  "reports/p1406-backup-recovery-dr-docs-roadmap-report.md",
  "reports/p1407-backup-recovery-dr-final-validation-report.md",
  "reports/p1411-security-privacy-compliance-controls-report.md",
  "reports/p1412-security-privacy-compliance-controls-report.md",
  "reports/p1413-security-privacy-compliance-controls-report.md",
  "reports/p1414-security-privacy-compliance-controls-report.md",
  "reports/p1415-security-privacy-compliance-controls-report.md",
  "reports/p1416-security-privacy-compliance-controls-docs-roadmap-report.md",
  "reports/p1417-security-privacy-compliance-controls-final-validation-report.md",
  "reports/p1421-admin-operations-runtime-settings-report.md",
  "reports/p1422-admin-operations-runtime-settings-report.md",
  "reports/p1423-admin-operations-runtime-settings-report.md",
  "reports/p1424-admin-operations-runtime-settings-report.md",
  "reports/p1425-admin-operations-runtime-settings-report.md",
  "reports/p1426-admin-operations-runtime-settings-docs-roadmap-report.md",
  "reports/p1427-admin-operations-runtime-settings-final-validation-report.md",
  "reports/p1431-release-deploy-export-package-pipeline-report.md",
  "reports/p1432-release-deploy-export-package-pipeline-report.md",
  "reports/p1433-release-deploy-export-package-pipeline-report.md",
  "reports/p1434-release-deploy-export-package-pipeline-report.md",
  "reports/p1435-release-deploy-export-package-pipeline-report.md",
  "reports/p1327-founder-runtime-store-live-admission-execution-report.md",
  REPORT_PATH,
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
]);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];
const allowedDashboardFiles = new Set([
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/src/data/businessBuild.js",
  "dashboard/src/data/dbRuntimeReadiness.js",
  "dashboard/src/data/authGovernanceReadiness.js",
  "dashboard/src/data/providerGovernanceReadiness.js",
  "dashboard/src/data/complianceReadiness.js",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/src/data/commandCenterRoutes.js",
  "dashboard/tests/routes.spec.js",
]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:enterprise-readiness-roadmap"]));
addCheck("P133/P134/P135 checkers registered when active", (!p133ActiveState || (Boolean(packageJson.scripts?.["check:p1331-founder-idea-to-prd-productization"]) && (!p1332CompleteState || Boolean(packageJson.scripts?.["check:p1332-founder-idea-to-prd-model"])) && (!p1333CompleteState || Boolean(packageJson.scripts?.["check:p1333-founder-idea-to-prd-preview"])) && (!p1334CompleteState || Boolean(packageJson.scripts?.["check:p1334-command-center-idea-to-prd-ux"])) && (!p1335CompleteState || Boolean(packageJson.scripts?.["check:p1335-founder-idea-to-prd-tests-checkers"])) && (!p1336CompleteState || Boolean(packageJson.scripts?.["check:p1336-founder-idea-to-prd-docs-roadmap"])) && (!p1337FinalState || Boolean(packageJson.scripts?.["check:p1337-founder-idea-to-prd-final-validation"])))) && (!p134ActiveState || (Boolean(packageJson.scripts?.["check:p1341-durable-db-crud-runtime"]) && (!p1342CurrentState || Boolean(packageJson.scripts?.["check:p1342-durable-db-crud-runtime-schema-model"])) && (!p1343CurrentState || Boolean(packageJson.scripts?.["check:p1343-durable-db-crud-runtime-write-plan-preview"])) && (!p1344CurrentState || Boolean(packageJson.scripts?.["check:p1344-durable-db-crud-runtime-command-center-ux"])) && (!p1345CurrentState || Boolean(packageJson.scripts?.["check:p1345-durable-db-crud-runtime-tests-checkers"])) && (!p1346CurrentState || Boolean(packageJson.scripts?.["check:p1346-durable-db-crud-runtime-docs-roadmap"])) && (!p1347FinalState || Boolean(packageJson.scripts?.["check:p1347-durable-db-crud-runtime-final-validation"])))) && (!p135ActiveState || (Boolean(packageJson.scripts?.["check:p1351-identity-tenant-roles-permissions"]) && (!p1352CurrentState || Boolean(packageJson.scripts?.["check:p1352-auth-tenant-model"])) && (!(p1353CurrentState || p1354CurrentState || p1355CurrentState || p1356CurrentState || p1357FinalState) || Boolean(packageJson.scripts?.["check:p1353-permission-preview"])) && (!(p1354CurrentState || p1355CurrentState || p1356CurrentState || p1357FinalState) || Boolean(packageJson.scripts?.["check:p1354-auth-governance-command-center-ux"])) && (!(p1355CurrentState || p1356CurrentState || p1357FinalState) || Boolean(packageJson.scripts?.["check:p1355-identity-tenant-roles-permissions-tests-checkers"])) && (!(p1356CurrentState || p1357FinalState) || Boolean(packageJson.scripts?.["check:p1356-identity-tenant-roles-permissions-docs-roadmap"])) && (!p1357FinalState || Boolean(packageJson.scripts?.["check:p1357-identity-tenant-roles-permissions-final-validation"])))));
addCheck("P136 checker registered when active", !p136ActiveState || (Boolean(packageJson.scripts?.["check:p1361-secrets-providers-tool-governance"]) && (!(p1362CurrentState || p1363CurrentState || p1364CurrentState || p1365CurrentState || p1366CurrentState || p1367FinalState) || Boolean(packageJson.scripts?.["check:p1362-secret-provider-model"])) && (!(p1363CurrentState || p1364CurrentState || p1365CurrentState || p1366CurrentState || p1367FinalState) || Boolean(packageJson.scripts?.["check:p1363-provider-dry-run"])) && (!(p1364CurrentState || p1365CurrentState || p1366CurrentState || p1367FinalState) || Boolean(packageJson.scripts?.["check:p1364-provider-governance-command-center-ux"])) && (!(p1365CurrentState || p1366CurrentState || p1367FinalState) || Boolean(packageJson.scripts?.["check:p1365-secrets-providers-tool-governance-tests-checkers"])) && (!(p1366CurrentState || p1367FinalState) || Boolean(packageJson.scripts?.["check:p1366-secrets-providers-tool-governance-docs-roadmap"])) && (!p1367FinalState || Boolean(packageJson.scripts?.["check:p1367-secrets-providers-tool-governance-final-validation"]))));
addCheck("P137 checker registered when active", !p137ActiveState || (p1371StartedState && Boolean(packageJson.scripts?.["check:p1371-agent-work-order-runtime"])) || (p1372CurrentState && Boolean(packageJson.scripts?.["check:p1372-agent-work-order-runtime"])) || (p1373CurrentState && Boolean(packageJson.scripts?.["check:p1373-agent-work-order-runtime"])) || (p1374CurrentState && Boolean(packageJson.scripts?.["check:p1374-agent-work-order-runtime"])) || (p1375CurrentState && Boolean(packageJson.scripts?.["check:p1375-agent-work-order-runtime"])) || (p1376CurrentState && Boolean(packageJson.scripts?.["check:p1376-agent-work-order-runtime"])) || (p1377FinalState && Boolean(packageJson.scripts?.["check:p1377-agent-work-order-runtime"])));
addCheck("P138 checker registered when active", !p138ActiveState || (p1381StartedState && Boolean(packageJson.scripts?.["check:p1381-project-workspace-mutation-build-pipeline"])) || (p1382CurrentState && Boolean(packageJson.scripts?.["check:p1382-project-workspace-mutation-build-pipeline"])) || (p1383CurrentState && Boolean(packageJson.scripts?.["check:p1383-project-workspace-mutation-build-pipeline"])) || (p1384CurrentState && Boolean(packageJson.scripts?.["check:p1384-project-workspace-mutation-build-pipeline"])) || (p1385CurrentState && Boolean(packageJson.scripts?.["check:p1385-project-workspace-mutation-build-pipeline"])) || (p1386CurrentState && Boolean(packageJson.scripts?.["check:p1386-project-workspace-mutation-build-pipeline"])) || (p1387FinalState && Boolean(packageJson.scripts?.["check:p1387-project-workspace-mutation-build-pipeline"])));
addCheck("P139 checker registered when active", !p139ActiveState || (p1391StartedState && Boolean(packageJson.scripts?.["check:p1391-evidence-audit-observability-cost-ledger"])) || (p1392CurrentState && Boolean(packageJson.scripts?.["check:p1392-evidence-audit-observability-cost-ledger"])) || (p1393CurrentState && Boolean(packageJson.scripts?.["check:p1393-evidence-audit-observability-cost-ledger"])) || (p1394CurrentState && Boolean(packageJson.scripts?.["check:p1394-evidence-audit-observability-cost-ledger"])) || (p1395CurrentState && Boolean(packageJson.scripts?.["check:p1395-evidence-audit-observability-cost-ledger"])) || (p1396CurrentState && Boolean(packageJson.scripts?.["check:p1396-evidence-audit-observability-cost-ledger"])) || (p1397FinalState && Boolean(packageJson.scripts?.["check:p1397-evidence-audit-observability-cost-ledger"])));
addCheck("P140 checker registered when active", !p140ActiveState || (p1401StartedState && Boolean(packageJson.scripts?.["check:p1401-backup-recovery-dr-retention"])) || (p1402CurrentState && Boolean(packageJson.scripts?.["check:p1402-backup-recovery-dr-retention"])) || (p1403CurrentState && Boolean(packageJson.scripts?.["check:p1403-backup-recovery-dr-restore-preview"])) || (p1404CurrentState && Boolean(packageJson.scripts?.["check:p1404-backup-recovery-dr-command-center-ux"])) || (p1405CurrentState && Boolean(packageJson.scripts?.["check:p1405-backup-recovery-dr-tests-checkers"])) || (p1406CurrentState && Boolean(packageJson.scripts?.["check:p1406-backup-recovery-dr-docs-roadmap"])) || (p1407FinalState && Boolean(packageJson.scripts?.["check:p1407-backup-recovery-dr-final-validation"])));
addCheck("P141 checker registered when active", !p141ActiveState || (p1411StartedState && Boolean(packageJson.scripts?.["check:p1411-security-privacy-compliance-controls"])) || (p1412CurrentState && Boolean(packageJson.scripts?.["check:p1412-security-privacy-compliance-controls"])) || (p1413CurrentState && Boolean(packageJson.scripts?.["check:p1413-security-privacy-compliance-controls"])) || (p1414CurrentState && Boolean(packageJson.scripts?.["check:p1414-security-privacy-compliance-controls"])) || (p1415CurrentState && Boolean(packageJson.scripts?.["check:p1415-security-privacy-compliance-controls"])) || (p1416CurrentState && Boolean(packageJson.scripts?.["check:p1416-security-privacy-compliance-controls-docs-roadmap"])) || (p1417FinalState && Boolean(packageJson.scripts?.["check:p1417-security-privacy-compliance-controls-final-validation"])));
addCheck("P142 checker registered when active", !p142ActiveState || (p1421StartedState && Boolean(packageJson.scripts?.["check:p1421-admin-operations-runtime-settings"])) || (p1422CurrentState && Boolean(packageJson.scripts?.["check:p1422-admin-operations-runtime-settings"])) || (p1423CurrentState && Boolean(packageJson.scripts?.["check:p1423-admin-operations-runtime-settings"])) || (p1424CurrentState && Boolean(packageJson.scripts?.["check:p1424-admin-operations-runtime-settings"])) || (p1425CurrentState && Boolean(packageJson.scripts?.["check:p1425-admin-operations-runtime-settings"])) || (p1426CurrentState && Boolean(packageJson.scripts?.["check:p1426-admin-operations-runtime-settings-docs-roadmap"])) || (p1427FinalState && Boolean(packageJson.scripts?.["check:p1427-admin-operations-runtime-settings-final-validation"])));
addCheck("P143 checker registered when active", !p143ActiveState
  || (p1431StartedState && Boolean(packageJson.scripts?.["check:p1431-release-deploy-export-package-pipeline"]))
  || (p1432CurrentState && Boolean(packageJson.scripts?.["check:p1432-release-deploy-export-package-pipeline"]))
  || (p1433CurrentState && Boolean(packageJson.scripts?.["check:p1433-release-deploy-export-package-pipeline"]))
  || (p1434CurrentState && Boolean(packageJson.scripts?.["check:p1434-release-deploy-export-package-pipeline"]))
  || (p1435CurrentState && Boolean(packageJson.scripts?.["check:p1435-release-deploy-export-package-pipeline"])));
addCheck("current enterprise handoff", enterpriseActiveState || (phaseStatus.currentPhase === "P132.7" && phaseStatus.previousPhase === "P132.6" && phaseStatus.nextPhase === "P133" && phaseIndex.currentPhase === "P132.7" && phaseIndex.previousPhase === "P132.6" && phaseIndex.nextPhase === "P133"), `${phaseStatus.currentPhase}/${phaseStatus.previousPhase}/${phaseStatus.nextPhase}`);
addCheck("P132.7 hands off to P133", statusById.get("P132.7")?.nextPhase === "P133" && indexById.get("P132.7")?.nextPhase === "P133");
addCheck("enterprise parent phases exist", enterprisePhases.every(([phaseId, title]) => statusById.get(phaseId)?.title === title && indexById.get(phaseId)?.title === title));
addCheck("enterprise parent phases are planned-only", enterprisePhases.every(([phaseId]) => {
  const status = statusById.get(phaseId);
  const index = indexById.get(phaseId);
  if (phaseId === "P133" && (p134ActiveState || p135ActiveState || p136ActiveState || p137ActiveState || p138ActiveState || p139ActiveState || p140ActiveState || p141ActiveState || p142ActiveState || p143ActiveState)) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1337-founder-idea-to-prd-final-validation")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1337-founder-idea-to-prd-final-validation");
  }
  if (phaseId === "P133" && p133ActiveState) {
    return ["in_progress", "complete"].includes(status?.status)
      && ["in_progress", "complete"].includes(index?.status)
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP133CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP133CheckCommand);
  }
  if (phaseId === "P134" && (p135ActiveState || p136ActiveState || p137ActiveState || p138ActiveState || p139ActiveState || p140ActiveState || p141ActiveState || p142ActiveState || p143ActiveState)) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1347-durable-db-crud-runtime-final-validation")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1347-durable-db-crud-runtime-final-validation");
  }
  if (phaseId === "P134" && p134ActiveState) {
    return status?.status === (p1347FinalState ? "complete" : "in_progress")
      && index?.status === (p1347FinalState ? "complete" : "in_progress")
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP134CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP134CheckCommand);
  }
  if (phaseId === "P135" && p135ActiveState) {
    return status?.status === (p1357FinalState ? "complete" : "in_progress")
      && index?.status === (p1357FinalState ? "complete" : "in_progress")
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP135CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP135CheckCommand);
  }
  if (phaseId === "P135" && (p136ActiveState || p137ActiveState || p138ActiveState || p139ActiveState || p140ActiveState || p141ActiveState || p142ActiveState || p143ActiveState)) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1357-identity-tenant-roles-permissions-final-validation")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1357-identity-tenant-roles-permissions-final-validation");
  }
  if (phaseId === "P136" && p136ActiveState) {
    return status?.status === (p1367FinalState ? "complete" : "in_progress")
      && index?.status === (p1367FinalState ? "complete" : "in_progress")
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP136CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP136CheckCommand);
  }
  if (phaseId === "P136" && (p137ActiveState || p138ActiveState || p139ActiveState || p140ActiveState || p141ActiveState || p142ActiveState || p143ActiveState)) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1367-secrets-providers-tool-governance-final-validation")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1367-secrets-providers-tool-governance-final-validation");
  }
  if (phaseId === "P137" && p137ActiveState) {
    return status?.status === (p1377FinalState ? "complete" : "in_progress")
      && index?.status === (p1377FinalState ? "complete" : "in_progress")
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP137CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP137CheckCommand);
  }
  if (phaseId === "P137" && (p138ActiveState || p139ActiveState || p140ActiveState || p141ActiveState || p142ActiveState || p143ActiveState)) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1377-agent-work-order-runtime")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1377-agent-work-order-runtime");
  }
  if (phaseId === "P138" && p138ActiveState) {
    return status?.status === (p1387FinalState ? "complete" : "in_progress")
      && index?.status === (p1387FinalState ? "complete" : "in_progress")
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP138CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP138CheckCommand);
  }
  if (phaseId === "P138" && (p139ActiveState || p140ActiveState || p141ActiveState || p142ActiveState || p143ActiveState)) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1387-project-workspace-mutation-build-pipeline")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1387-project-workspace-mutation-build-pipeline");
  }
  if (phaseId === "P139" && p139ActiveState) {
    return status?.status === (p1397FinalState ? "complete" : "in_progress")
      && index?.status === (p1397FinalState ? "complete" : "in_progress")
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP139CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP139CheckCommand);
  }
  if (phaseId === "P139" && (p140ActiveState || p141ActiveState || p142ActiveState || p143ActiveState)) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1397-evidence-audit-observability-cost-ledger")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1397-evidence-audit-observability-cost-ledger");
  }
  if (phaseId === "P140" && p140ActiveState) {
    return (p1407FinalState ? status?.status === "complete" : status?.status === "in_progress")
      && (p1407FinalState ? index?.status === "complete" : index?.status === "in_progress")
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP140CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP140CheckCommand);
  }
  if (phaseId === "P140" && (p141ActiveState || p142ActiveState || p143ActiveState)) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1407-backup-recovery-dr-final-validation")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1407-backup-recovery-dr-final-validation");
  }
  if (phaseId === "P141" && p141ActiveState) {
    return status?.status === (p1417FinalState ? "complete" : "in_progress")
      && index?.status === (p1417FinalState ? "complete" : "in_progress")
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP141CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP141CheckCommand);
  }
  if (phaseId === "P141" && (p142ActiveState || p143ActiveState)) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1417-security-privacy-compliance-controls-final-validation")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1417-security-privacy-compliance-controls-final-validation");
  }
  if (phaseId === "P142" && p142ActiveState) {
    return status?.status === (p1427FinalState ? "complete" : "in_progress")
      && index?.status === (p1427FinalState ? "complete" : "in_progress")
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP142CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP142CheckCommand);
  }
  if (phaseId === "P142" && p143ActiveState) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1427-admin-operations-runtime-settings-final-validation")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1427-admin-operations-runtime-settings-final-validation");
  }
  if (phaseId === "P143" && p143ActiveState) {
    return status?.status === "in_progress"
      && index?.status === "in_progress"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP143CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP143CheckCommand);
  }
  return status?.status === "planned"
    && index?.status === "planned"
    && status.commit === ""
    && index.commit === ""
    && Array.isArray(status.checksRun)
    && status.checksRun.length === 0
    && Array.isArray(index.checksRun)
    && index.checksRun.length === 0;
}));
addCheck("enterprise phases are sequential", enterprisePhases.every(([phaseId], index) => {
  const expectedPrevious = index === 0 ? "P132.7" : enterprisePhases[index - 1][0];
  const expectedNext = index === enterprisePhases.length - 1 ? "" : enterprisePhases[index + 1][0];
  return statusById.get(phaseId)?.previousPhase === expectedPrevious
    && indexById.get(phaseId)?.previousPhase === expectedPrevious
    && statusById.get(phaseId)?.nextPhase === expectedNext
    && indexById.get(phaseId)?.nextPhase === expectedNext;
}));
addCheck("enterprise phases are Command Center visible", enterprisePhases.every(([phaseId]) => statusById.get(phaseId)?.commandCenterVisible === true && indexById.get(phaseId)?.commandCenterVisible === true));
addCheck("roadmap entries include details and limitations", enterprisePhases.every(([phaseId]) => {
  const status = statusById.get(phaseId);
  const index = indexById.get(phaseId);
  return Boolean(status?.detail)
    && Boolean(status?.summary)
    && Array.isArray(status?.knownLimitations)
    && status.knownLimitations.join(" ").toLowerCase().includes("planned-only")
    && Array.isArray(index?.knownLimitations)
    && index.knownLimitations.join(" ").toLowerCase().includes("planned-only");
}));
addCheck("roadmap entries include subphase details", enterprisePhases.every(([phaseId]) => {
  const statusSubphases = statusById.get(phaseId)?.subphases || [];
  const indexSubphases = indexById.get(phaseId)?.subphases || [];
  return statusSubphases.length === 7 && indexSubphases.length === 7 && statusSubphases.every((entry) => entry.phaseId?.startsWith(`${phaseId}.`));
}));
const expectedCompleteP133Subphases = p1337FinalState
  ? ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6", "P133.7"]
  : p1336CompleteState
  ? ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6"]
  : p1335CompleteState
    ? ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5"]
    : p1334CompleteState
      ? ["P133.1", "P133.2", "P133.3", "P133.4"]
      : p1333CompleteState
        ? ["P133.1", "P133.2", "P133.3"]
        : p1332CompleteState
          ? ["P133.1", "P133.2"]
          : p1331StartedState
            ? ["P133.1"]
            : [];
const expectedNextP133Subphase = p1337FinalState
  ? "P134"
  : p1336CompleteState
  ? "P133.7"
  : p1335CompleteState
    ? "P133.6"
    : p1334CompleteState
      ? "P133.5"
      : p1333CompleteState
        ? "P133.4"
        : p1332CompleteState
          ? "P133.3"
          : p1331StartedState
            ? "P133.2"
            : "";
const p133ActiveSubphaseRecordsPresent = !p133ActiveState || (
  expectedCompleteP133Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && (!expectedNextP133Subphase || (statusById.get(expectedNextP133Subphase)?.status === "planned" && indexById.get(expectedNextP133Subphase)?.status === "planned"))
);
const p134ActiveSubphaseRecordsPresent = !p134ActiveState || (
  statusById.get("P134.1")?.status === "complete"
  && indexById.get("P134.1")?.status === "complete"
  && (
    (p1341StartedState && statusById.get("P134.2")?.status === "planned" && indexById.get("P134.2")?.status === "planned")
    || (p1342CurrentState && statusById.get("P134.2")?.status === "complete" && indexById.get("P134.2")?.status === "complete" && statusById.get("P134.3")?.status === "planned" && indexById.get("P134.3")?.status === "planned")
    || (p1343CurrentState && statusById.get("P134.2")?.status === "complete" && indexById.get("P134.2")?.status === "complete" && statusById.get("P134.3")?.status === "complete" && indexById.get("P134.3")?.status === "complete" && statusById.get("P134.4")?.status === "planned" && indexById.get("P134.4")?.status === "planned")
    || (p1344CurrentState && ["P134.2", "P134.3", "P134.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P134.5")?.status === "planned" && indexById.get("P134.5")?.status === "planned")
    || (p1345CurrentState && ["P134.2", "P134.3", "P134.4", "P134.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P134.6")?.status === "planned" && indexById.get("P134.6")?.status === "planned")
    || (p1346CurrentState && ["P134.2", "P134.3", "P134.4", "P134.5", "P134.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P134.7")?.status === "planned" && indexById.get("P134.7")?.status === "planned")
    || (p1347FinalState && ["P134.2", "P134.3", "P134.4", "P134.5", "P134.6", "P134.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P135")?.status === "planned" && indexById.get("P135")?.status === "planned")
  )
);
const p135ActiveSubphaseRecordsPresent = !p135ActiveState || (
  statusById.get("P135.1")?.status === "complete"
  && indexById.get("P135.1")?.status === "complete"
  && (
    (p1351StartedState && statusById.get("P135.2")?.status === "planned" && indexById.get("P135.2")?.status === "planned")
    || (p1352CurrentState && statusById.get("P135.2")?.status === "complete" && indexById.get("P135.2")?.status === "complete" && statusById.get("P135.3")?.status === "planned" && indexById.get("P135.3")?.status === "planned")
    || (p1353CurrentState && ["P135.2", "P135.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P135.4")?.status === "planned" && indexById.get("P135.4")?.status === "planned")
    || (p1354CurrentState && ["P135.2", "P135.3", "P135.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P135.5")?.status === "planned" && indexById.get("P135.5")?.status === "planned")
    || (p1355CurrentState && ["P135.2", "P135.3", "P135.4", "P135.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P135.6")?.status === "planned" && indexById.get("P135.6")?.status === "planned")
    || (p1356CurrentState && ["P135.2", "P135.3", "P135.4", "P135.5", "P135.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P135.7")?.status === "planned" && indexById.get("P135.7")?.status === "planned")
    || (p1357FinalState && ["P135.2", "P135.3", "P135.4", "P135.5", "P135.6", "P135.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P136")?.status === "planned" && indexById.get("P136")?.status === "planned")
  )
);
const p136ActiveSubphaseRecordsPresent = !p136ActiveState || (
  statusById.get("P136.1")?.status === "complete"
  && indexById.get("P136.1")?.status === "complete"
  && (
	    (p1361StartedState && statusById.get("P136.2")?.status === "planned" && indexById.get("P136.2")?.status === "planned")
	    || (p1362CurrentState && statusById.get("P136.2")?.status === "complete" && indexById.get("P136.2")?.status === "complete" && statusById.get("P136.3")?.status === "planned" && indexById.get("P136.3")?.status === "planned")
	    || (p1363CurrentState && ["P136.2", "P136.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P136.4")?.status === "planned" && indexById.get("P136.4")?.status === "planned")
	    || (p1364CurrentState && ["P136.2", "P136.3", "P136.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P136.5")?.status === "planned" && indexById.get("P136.5")?.status === "planned")
	    || (p1365CurrentState && ["P136.2", "P136.3", "P136.4", "P136.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P136.6")?.status === "planned" && indexById.get("P136.6")?.status === "planned")
	    || (p1366CurrentState && ["P136.2", "P136.3", "P136.4", "P136.5", "P136.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P136.7")?.status === "planned" && indexById.get("P136.7")?.status === "planned")
	    || (p1367FinalState && ["P136.2", "P136.3", "P136.4", "P136.5", "P136.6", "P136.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P137")?.status === "planned" && indexById.get("P137")?.status === "planned")
	  )
	);
const p137ActiveSubphaseRecordsPresent = !p137ActiveState || (
  statusById.get("P137.1")?.status === "complete"
  && indexById.get("P137.1")?.status === "complete"
  && (
    (p1371StartedState && statusById.get("P137.2")?.status === "planned" && indexById.get("P137.2")?.status === "planned")
    || (p1372CurrentState && statusById.get("P137.2")?.status === "complete" && indexById.get("P137.2")?.status === "complete" && statusById.get("P137.3")?.status === "planned" && indexById.get("P137.3")?.status === "planned")
    || (p1373CurrentState && ["P137.2", "P137.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P137.4")?.status === "planned" && indexById.get("P137.4")?.status === "planned")
    || (p1374CurrentState && ["P137.2", "P137.3", "P137.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P137.5")?.status === "planned" && indexById.get("P137.5")?.status === "planned")
    || (p1375CurrentState && ["P137.2", "P137.3", "P137.4", "P137.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P137.6")?.status === "planned" && indexById.get("P137.6")?.status === "planned")
    || (p1376CurrentState && ["P137.2", "P137.3", "P137.4", "P137.5", "P137.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P137.7")?.status === "planned" && indexById.get("P137.7")?.status === "planned")
    || (p1377FinalState && ["P137.2", "P137.3", "P137.4", "P137.5", "P137.6", "P137.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P138")?.status === "planned" && indexById.get("P138")?.status === "planned")
  )
);
const p138ActiveSubphaseRecordsPresent = !p138ActiveState || (
  statusById.get("P138.1")?.status === "complete"
  && indexById.get("P138.1")?.status === "complete"
  && (
    p1381StartedState
    && statusById.get("P138.2")?.status === "planned"
    && indexById.get("P138.2")?.status === "planned"
    || (p1382CurrentState && statusById.get("P138.2")?.status === "complete" && indexById.get("P138.2")?.status === "complete" && statusById.get("P138.3")?.status === "planned" && indexById.get("P138.3")?.status === "planned")
    || (p1383CurrentState && ["P138.2", "P138.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P138.4")?.status === "planned" && indexById.get("P138.4")?.status === "planned")
    || (p1384CurrentState && ["P138.2", "P138.3", "P138.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P138.5")?.status === "planned" && indexById.get("P138.5")?.status === "planned")
    || (p1385CurrentState && ["P138.2", "P138.3", "P138.4", "P138.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P138.6")?.status === "planned" && indexById.get("P138.6")?.status === "planned")
    || (p1386CurrentState && ["P138.2", "P138.3", "P138.4", "P138.5", "P138.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P138.7")?.status === "planned" && indexById.get("P138.7")?.status === "planned")
    || (p1387FinalState && ["P138.2", "P138.3", "P138.4", "P138.5", "P138.6", "P138.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P139")?.status === "planned" && indexById.get("P139")?.status === "planned")
  )
);
const p139ActiveSubphaseRecordsPresent = !p139ActiveState || (
  statusById.get("P139.1")?.status === "complete"
  && indexById.get("P139.1")?.status === "complete"
  && (
    (p1391StartedState && statusById.get("P139.2")?.status === "planned" && indexById.get("P139.2")?.status === "planned")
    || (p1392CurrentState && statusById.get("P139.2")?.status === "complete" && indexById.get("P139.2")?.status === "complete" && statusById.get("P139.3")?.status === "planned" && indexById.get("P139.3")?.status === "planned")
    || (p1393CurrentState && ["P139.2", "P139.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P139.4")?.status === "planned" && indexById.get("P139.4")?.status === "planned")
    || (p1394CurrentState && ["P139.2", "P139.3", "P139.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P139.5")?.status === "planned" && indexById.get("P139.5")?.status === "planned")
    || (p1395CurrentState && ["P139.2", "P139.3", "P139.4", "P139.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P139.6")?.status === "planned" && indexById.get("P139.6")?.status === "planned")
    || (p1396CurrentState && ["P139.2", "P139.3", "P139.4", "P139.5", "P139.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P139.7")?.status === "planned" && indexById.get("P139.7")?.status === "planned")
    || (p1397FinalState && ["P139.2", "P139.3", "P139.4", "P139.5", "P139.6", "P139.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P140")?.status === "planned" && indexById.get("P140")?.status === "planned")
  )
);
const p140ActiveSubphaseRecordsPresent = !p140ActiveState || (
  statusById.get("P140.1")?.status === "complete"
  && indexById.get("P140.1")?.status === "complete"
  && (
    (p1401StartedState && statusById.get("P140.2")?.status === "planned" && indexById.get("P140.2")?.status === "planned")
    || (p1402CurrentState && statusById.get("P140.2")?.status === "complete" && indexById.get("P140.2")?.status === "complete" && statusById.get("P140.3")?.status === "planned" && indexById.get("P140.3")?.status === "planned")
    || (p1403CurrentState && statusById.get("P140.2")?.status === "complete" && indexById.get("P140.2")?.status === "complete" && statusById.get("P140.3")?.status === "complete" && indexById.get("P140.3")?.status === "complete" && statusById.get("P140.4")?.status === "planned" && indexById.get("P140.4")?.status === "planned")
    || (p1404CurrentState && ["P140.2", "P140.3", "P140.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P140.5")?.status === "planned" && indexById.get("P140.5")?.status === "planned")
    || (p1405CurrentState && ["P140.2", "P140.3", "P140.4", "P140.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P140.6")?.status === "planned" && indexById.get("P140.6")?.status === "planned")
    || (p1406CurrentState && ["P140.2", "P140.3", "P140.4", "P140.5", "P140.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P140.7")?.status === "planned" && indexById.get("P140.7")?.status === "planned")
    || (p1407FinalState && ["P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P141")?.status === "planned" && indexById.get("P141")?.status === "planned")
  )
);
const p141ActiveSubphaseRecordsPresent = !p141ActiveState || (
  statusById.get("P141.1")?.status === "complete"
  && indexById.get("P141.1")?.status === "complete"
  && (
    (p1411StartedState && statusById.get("P141.2")?.status === "planned" && indexById.get("P141.2")?.status === "planned")
    || (p1412CurrentState && statusById.get("P141.2")?.status === "complete" && indexById.get("P141.2")?.status === "complete" && statusById.get("P141.3")?.status === "planned" && indexById.get("P141.3")?.status === "planned")
    || (p1413CurrentState && ["P141.2", "P141.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P141.4")?.status === "planned" && indexById.get("P141.4")?.status === "planned")
    || (p1414CurrentState && ["P141.2", "P141.3", "P141.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P141.5")?.status === "planned" && indexById.get("P141.5")?.status === "planned")
    || (p1415CurrentState && ["P141.2", "P141.3", "P141.4", "P141.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P141.6")?.status === "planned" && indexById.get("P141.6")?.status === "planned")
    || (p1416CurrentState && ["P141.2", "P141.3", "P141.4", "P141.5", "P141.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P141.7")?.status === "planned" && indexById.get("P141.7")?.status === "planned")
    || (p1417FinalState && ["P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P142")?.status === "planned" && indexById.get("P142")?.status === "planned")
  )
);
const p142ActiveSubphaseRecordsPresent = !p142ActiveState || (
  statusById.get("P142.1")?.status === "complete"
  && indexById.get("P142.1")?.status === "complete"
  && (
    (
      p1421StartedState
      && statusById.get("P142.2")?.status === "planned"
      && indexById.get("P142.2")?.status === "planned"
      && statusById.get("P143")?.status === "planned"
      && indexById.get("P143")?.status === "planned"
    )
    || (
      p1422CurrentState
      && statusById.get("P142.2")?.status === "complete"
      && indexById.get("P142.2")?.status === "complete"
      && statusById.get("P142.3")?.status === "planned"
      && indexById.get("P142.3")?.status === "planned"
      && statusById.get("P143")?.status === "planned"
      && indexById.get("P143")?.status === "planned"
    )
    || (
      p1423CurrentState
      && statusById.get("P142.2")?.status === "complete"
      && indexById.get("P142.2")?.status === "complete"
      && statusById.get("P142.3")?.status === "complete"
      && indexById.get("P142.3")?.status === "complete"
      && statusById.get("P142.4")?.status === "planned"
      && indexById.get("P142.4")?.status === "planned"
      && statusById.get("P143")?.status === "planned"
      && indexById.get("P143")?.status === "planned"
    )
    || (
      p1424CurrentState
      && ["P142.2", "P142.3", "P142.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
      && statusById.get("P142.5")?.status === "planned"
      && indexById.get("P142.5")?.status === "planned"
      && statusById.get("P143")?.status === "planned"
      && indexById.get("P143")?.status === "planned"
    )
    || (
      p1425CurrentState
      && ["P142.2", "P142.3", "P142.4", "P142.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
      && statusById.get("P142.6")?.status === "planned"
      && indexById.get("P142.6")?.status === "planned"
      && statusById.get("P143")?.status === "planned"
      && indexById.get("P143")?.status === "planned"
    )
    || (
      p1426CurrentState
      && ["P142.2", "P142.3", "P142.4", "P142.5", "P142.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
      && statusById.get("P142.7")?.status === "planned"
      && indexById.get("P142.7")?.status === "planned"
      && statusById.get("P143")?.status === "planned"
      && indexById.get("P143")?.status === "planned"
    )
    || (
      p1427FinalState
      && ["P142.2", "P142.3", "P142.4", "P142.5", "P142.6", "P142.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
      && statusById.get("P143")?.status === "planned"
      && indexById.get("P143")?.status === "planned"
    )
  )
);
const p143ActiveSubphaseRecordsPresent = !p143ActiveState || (
  statusById.get("P143.1")?.status === "complete"
  && indexById.get("P143.1")?.status === "complete"
  && (
    (p1431StartedState && statusById.get("P143.2")?.status === "planned" && indexById.get("P143.2")?.status === "planned")
    || (p1432CurrentState && statusById.get("P143.2")?.status === "complete" && indexById.get("P143.2")?.status === "complete" && statusById.get("P143.3")?.status === "planned" && indexById.get("P143.3")?.status === "planned")
    || (p1433CurrentState && ["P143.2", "P143.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P143.4")?.status === "planned" && indexById.get("P143.4")?.status === "planned")
    || (p1434CurrentState && ["P143.2", "P143.3", "P143.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P143.5")?.status === "planned" && indexById.get("P143.5")?.status === "planned")
    || (p1435CurrentState && ["P143.2", "P143.3", "P143.4", "P143.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete") && statusById.get("P143.6")?.status === "planned" && indexById.get("P143.6")?.status === "planned")
  )
  && statusById.get("P144")?.status === "planned"
  && indexById.get("P144")?.status === "planned"
);
addCheck("P133/P134/P135/P136/P137/P138/P139/P140/P141/P142/P143 active subphase records are present", p133ActiveSubphaseRecordsPresent && p134ActiveSubphaseRecordsPresent && p135ActiveSubphaseRecordsPresent && p136ActiveSubphaseRecordsPresent && p137ActiveSubphaseRecordsPresent && p138ActiveSubphaseRecordsPresent && p139ActiveSubphaseRecordsPresent && p140ActiveSubphaseRecordsPresent && p141ActiveSubphaseRecordsPresent && p142ActiveSubphaseRecordsPresent && p143ActiveSubphaseRecordsPresent);
addCheck("enterprise roadmap doc covers all phases", enterprisePhases.every(([phaseId, title]) => doc.includes(`| ${phaseId} | ${title} |`)));
addCheck("enterprise roadmap doc records required subphase contract", [
  "Narrow scope",
  "Allowed files",
  "forbidden files",
  "Command Center UX requirements",
  "Playwright coverage",
  "Checker updates",
  "Validation commands",
  "Final safety checks",
  "Git add, commit, and push commands",
  "Final response checklist",
].every((text) => doc.toLowerCase().includes(text.toLowerCase())));
addCheck("README records enterprise roadmap", readmeEnterpriseSlice.includes("P133-P145 enterprise readiness roadmap"));
addCheck("platform roadmap records enterprise roadmap", platformEnterpriseSlice.includes("P133-P145 Enterprise Readiness Roadmap"));
addCheck("changed files stay in enterprise roadmap scope", changed.every((file) => allowedFiles.has(file)), changed.join(", "));
addCheck("forbidden paths unchanged", changed.every((file) => allowedDashboardFiles.has(file) || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("checker reuses report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
const enterpriseDocsBundle = `${doc}\n${readmeEnterpriseSlice}\n${platformEnterpriseSlice}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(enterpriseDocsBundle));
addCheck("docs avoid fake runnable actions", !/persist now|save now|write now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(enterpriseDocsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(enterpriseDocsBundle, /DB writes are enabled|CRUD is live|agent dispatch is enabled|project mutation is enabled|provider spend is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(enterpriseDocsBundle, /raw JSON|raw logs|raw policy dump/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Tracks P133-P145 enterprise-readiness roadmap phases after P132.",
        "- Allows P133-P142 to close through P142.7 final validation and P143 to advance through P143.5 aggregate shipping tests/checkers while later P143/P144/P145 work remains planned-only.",
        "- Does not enable DB/runtime writes, live CRUD, provider/model calls, agent dispatch, project mutation, patch application, build/test execution, rollback execution, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Enterprise Phases", body: enterprisePhases.map(([phaseId, title]) => `- ${phaseId}: ${title}`).join("\n") },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:enterprise-readiness-roadmap",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P133.1-P133.7, P134.1-P134.7, P135.1-P135.7, P136.1-P136.7, P137.1-P137.7, P138.1-P138.7, P139.1-P139.7, P140.1-P140.7, P141.1-P141.7, P142.1-P142.7, P143.1, P143.2, P143.3, P143.4, and P143.5 may be complete. P143.6-P145 remain planned-only. Current enterprise work does not enable secret values, full registry loading into model context, login, sessions, permission enforcement, backup creation, restore execution, failover, overwrite, delete, prune, credential handling, raw data exposure, compliance certification, legal attestation, audit export, raw log export, compliance package creation, admin setting mutation, feature toggles, maintenance execution, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, patch application, build/test execution, rollback execution, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "Enterprise Readiness Roadmap Report", phase: "P133-P145" },
);

printCheckReport("Enterprise Readiness Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
