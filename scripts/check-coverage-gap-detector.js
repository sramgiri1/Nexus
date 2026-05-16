import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildProjectTestSuites } from "../test-suite/projectTestSuites.js";
import { buildOsTestSuites } from "../test-suite/osTestSuites.js";
import { buildGapRecommendations, buildPrdTestMap, classifyCoverageGap, detectCoverageGaps, summarizeCoverageGaps } from "../quality-intelligence/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/coverage-gap-report.md");
const sections = { modules: true, gaps: true, recommendations: true, osPhaseStatus: true, noForbiddenChanges: true, reportWritten: true };
const failures = [];
function fail(section, message){ sections[section]=false; failures.push(message); }
function check(condition, section, message){ if(!condition) fail(section,message); }
function read(relativePath){ const full=join(ROOT,relativePath); return existsSync(full)?readFileSync(full,"utf8"):""; }
function parseJson(relativePath, section){ try{return JSON.parse(read(relativePath));}catch(error){fail(section,`${relativePath} did not parse: ${error.message}`);return{};} }
function git(args){ return execFileSync("git",args,{cwd:ROOT,encoding:"utf8"}).trim(); }
function changedFiles(){ return git(["status","--short"]).split("\n").map(line=>line.trim().slice(3)).filter(Boolean); }

console.log("NEXUS Coverage Gap Detector Check");
console.log("=================================");

const branch=git(["branch","--show-current"]);
const head=git(["rev-parse","--short","HEAD"]);
const pkg=parseJson("package.json","modules");
const phaseStatus=parseJson("os-roadmap/phase-status.json","osPhaseStatus");
const registry=[...buildProjectTestSuites({projectId:"careloop"}),...buildOsTestSuites({})];
const map=buildPrdTestMap({ projectId:"careloop", requirements:[{requirementId:"prd-new-mobile-offline",requirementLabel:"iOS offline sync",scope:"project",source:"preview requirement",keywords:["offline-sync-not-registered"]}] });
const gaps=detectCoverageGaps(map,registry);
const summary=summarizeCoverageGaps(gaps);
const recommendations=buildGapRecommendations(gaps);

check(existsSync(join(ROOT,"quality-intelligence/coverageGapDetector.js")),"modules","Missing coverageGapDetector.js");
check(pkg.scripts?.["check:coverage-gap-detector"]==="node scripts/check-coverage-gap-detector.js","modules","Missing package script");
check(gaps.length>=1,"gaps","Expected at least one preview gap");
check(["critical","high","medium","low","informational"].includes(classifyCoverageGap(gaps[0])),"gaps","Gap severity must classify");
check(summary.executionEnabled===false,"gaps","Gap detector must not enable execution");
check(summary.testGenerationEnabled===false,"gaps","Gap detector must not enable test generation");
check(recommendations.every(item=>item.executionEnabled===false),"recommendations","Recommendations must be execution disabled");
check(recommendations.every(item=>item.disabledReason.includes("Preview-only")),"recommendations","Recommendations need disabled reason");
const statusById=new Map((phaseStatus.phases||[]).map(entry=>[entry.phaseId,entry]));
check(statusById.get("P56.1")?.status==="complete","osPhaseStatus","P56.1 must be complete");
check(["in_progress","complete"].includes(statusById.get("P56.2")?.status),"osPhaseStatus","P56.2 must be tracked");
for(const file of changedFiles()){
  check(!file.startsWith("projects/careloop/"),"noForbiddenChanges",`Forbidden project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"),"noForbiddenChanges",`Forbidden iOS project change: ${file}`);
  check(!file.startsWith("providers/"),"noForbiddenChanges",`Forbidden provider change: ${file}`);
}

let result=Object.values(sections).every(Boolean)?"PASS":"FAIL";
const report=`# Coverage Gap Detector Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P56.2 - Coverage Gap Detector

## Summary

- Gaps found: ${summary.totalGaps}
- High severity: ${summary.severityCounts.high}
- Medium severity: ${summary.severityCounts.medium}
- Test generation enabled: ${summary.testGenerationEnabled}
- Execution enabled: ${summary.executionEnabled}

## Checks

- Modules: ${sections.modules?"PASS":"FAIL"}
- Gaps: ${sections.gaps?"PASS":"FAIL"}
- Recommendations: ${sections.recommendations?"PASS":"FAIL"}
- OS phase status: ${sections.osPhaseStatus?"PASS":"FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges?"PASS":"FAIL"}
- Report written: ${sections.reportWritten?"PASS":"FAIL"}

## Failures

${failures.length?failures.map(f=>`- ${f}`).join("\n"):"- None"}

## Result

${result}
`;
try{writeFileSync(REPORT_PATH,report,"utf8");}catch(error){fail("reportWritten",error.message);}
result=Object.values(sections).every(Boolean)?"PASS":"FAIL";
for(const [label,section] of [["Modules","modules"],["Gaps","gaps"],["Recommendations","recommendations"],["OS phase status","osPhaseStatus"],["No forbidden changes","noForbiddenChanges"],["Report written","reportWritten"]]) console.log(`${label}: ${sections[section]?"PASS":"FAIL"}`);
console.log(`Result: ${result}`);
if(result!=="PASS") process.exitCode=1;
