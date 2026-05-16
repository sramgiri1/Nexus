import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildFlakyTestRecords, classifyFlakySignal, recommendFlakyTestActions, summarizeFlakyTests } from "../quality-intelligence/index.js";

const ROOT=process.cwd();
const REPORT_PATH=join(ROOT,"reports/flaky-test-tracker-report.md");
const sections={modules:true,records:true,recommendations:true,osPhaseStatus:true,noForbiddenChanges:true,reportWritten:true};
const failures=[];
function fail(s,m){sections[s]=false;failures.push(m);} function check(c,s,m){if(!c)fail(s,m);}
function read(p){const f=join(ROOT,p);return existsSync(f)?readFileSync(f,"utf8"):"";}
function parseJson(p,s){try{return JSON.parse(read(p));}catch(e){fail(s,`${p} did not parse: ${e.message}`);return{};}}
function git(args){return execFileSync("git",args,{cwd:ROOT,encoding:"utf8"}).trim();}
function changedFiles(){return git(["status","--short"]).split("\n").map(l=>l.trim().slice(3)).filter(Boolean);}
console.log("NEXUS Flaky Test Tracker Check"); console.log("===============================");
const branch=git(["branch","--show-current"]); const head=git(["rev-parse","--short","HEAD"]);
const pkg=parseJson("package.json","modules"); const phaseStatus=parseJson("os-roadmap/phase-status.json","osPhaseStatus");
const noSignalRecords=buildFlakyTestRecords([]);
const mixedRecords=buildFlakyTestRecords([{resultId:"r1",suiteId:"suite-a",status:"pass",projectId:"private-project-01"},{resultId:"r2",suiteId:"suite-a",status:"fail",projectId:"private-project-01"}]);
const summary=summarizeFlakyTests([...noSignalRecords,...mixedRecords]);
const actions=recommendFlakyTestActions(mixedRecords);
check(existsSync(join(ROOT,"quality-intelligence/flakyTestTracker.js")),"modules","Missing flakyTestTracker.js");
check(pkg.scripts?.["check:flaky-test-tracker"]==="node scripts/check-flaky-test-tracker.js","modules","Missing package script");
check(classifyFlakySignal({})==="no_signal","records","Empty signal must be no_signal");
check(noSignalRecords[0].status==="no_signal","records","No evidence must produce no_signal");
check(mixedRecords[0].status==="suspected","records","Mixed pass/fail evidence must be suspected");
check(summary.executionEnabled===false,"records","Flaky tracker must not enable execution");
check(summary.inferredWithoutEvidence===false,"records","Flaky tracker must not infer without evidence");
check(actions.every(a=>a.executionEnabled===false && a.disabledReason.includes("Preview-only")),"recommendations","Actions must be disabled");
const statusById=new Map((phaseStatus.phases||[]).map(e=>[e.phaseId,e]));
check(statusById.get("P56.2")?.status==="complete","osPhaseStatus","P56.2 must be complete");
check(["in_progress","complete"].includes(statusById.get("P56.3")?.status),"osPhaseStatus","P56.3 must be tracked");
for(const file of changedFiles()){check(!file.startsWith("projects/careloop/"),"noForbiddenChanges",`Forbidden project change: ${file}`);check(!file.startsWith("projects/careloop-ios/"),"noForbiddenChanges",`Forbidden iOS project change: ${file}`);}
let result=Object.values(sections).every(Boolean)?"PASS":"FAIL";
const report=`# Flaky Test Tracker Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P56.3 - Flaky Test Tracker

## Summary

- Records: ${summary.recordCount}
- No signal: ${summary.statusCounts.no_signal}
- Suspected: ${summary.statusCounts.suspected}
- Execution enabled: ${summary.executionEnabled}

## Checks

- Modules: ${sections.modules?"PASS":"FAIL"}
- Records: ${sections.records?"PASS":"FAIL"}
- Recommendations: ${sections.recommendations?"PASS":"FAIL"}
- OS phase status: ${sections.osPhaseStatus?"PASS":"FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges?"PASS":"FAIL"}
- Report written: ${sections.reportWritten?"PASS":"FAIL"}

## Failures

${failures.length?failures.map(f=>`- ${f}`).join("\n"):"- None"}

## Result

${result}
`;
try{writeFileSync(REPORT_PATH,report,"utf8");}catch(e){fail("reportWritten",e.message);}
result=Object.values(sections).every(Boolean)?"PASS":"FAIL";
for(const [label,section] of [["Modules","modules"],["Records","records"],["Recommendations","recommendations"],["OS phase status","osPhaseStatus"],["No forbidden changes","noForbiddenChanges"],["Report written","reportWritten"]]) console.log(`${label}: ${sections[section]?"PASS":"FAIL"}`);
console.log(`Result: ${result}`); if(result!=="PASS") process.exitCode=1;
