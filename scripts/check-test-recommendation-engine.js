import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { explainRecommendation, recommendTestsForChange, scoreTestRecommendation, summarizeTestRecommendations } from "../quality-intelligence/index.js";

const ROOT=process.cwd(); const REPORT_PATH=join(ROOT,"reports/test-recommendation-report.md");
const sections={modules:true,recommendations:true,scoring:true,osPhaseStatus:true,noForbiddenChanges:true,reportWritten:true};
const failures=[]; const fail=(s,m)=>{sections[s]=false;failures.push(m);}; const check=(c,s,m)=>{if(!c)fail(s,m);};
const read=p=>{const f=join(ROOT,p);return existsSync(f)?readFileSync(f,"utf8"):"";};
const parseJson=(p,s)=>{try{return JSON.parse(read(p));}catch(e){fail(s,`${p} did not parse: ${e.message}`);return{};}};
const git=args=>execFileSync("git",args,{cwd:ROOT,encoding:"utf8"}).trim();
const changedFiles=()=>git(["status","--short"]).split("\n").map(l=>l.trim().slice(3)).filter(Boolean);
console.log("NEXUS Test Recommendation Engine Check"); console.log("======================================");
const branch=git(["branch","--show-current"]); const head=git(["rev-parse","--short","HEAD"]);
const pkg=parseJson("package.json","modules"); const phaseStatus=parseJson("os-roadmap/phase-status.json","osPhaseStatus");
const recommendations=recommendTestsForChange({changedFiles:["dashboard/src/pages/CommandCenterV2.jsx","test-suite/projectTestSuites.js"],coverageGaps:[{domain:"Command Center UI"}]});
const summary=summarizeTestRecommendations(recommendations);
check(existsSync(join(ROOT,"quality-intelligence/testRecommendationEngine.js")),"modules","Missing testRecommendationEngine.js");
check(pkg.scripts?.["check:test-recommendation-engine"]==="node scripts/check-test-recommendation-engine.js","modules","Missing package script");
check(recommendations.length>=1,"recommendations","Expected recommendations from changed files");
check(recommendations.every(r=>r.executionEnabled===false),"recommendations","Recommendations must not enable execution");
check(recommendations.every(r=>r.disabledReason.includes("Preview-only")),"recommendations","Recommendations need disabled reason");
check(explainRecommendation(recommendations[0]).includes("Execution is preview-only"),"recommendations","Explanation must state preview-only");
check(scoreTestRecommendation({riskLevel:"high"})>scoreTestRecommendation({riskLevel:"low"}),"scoring","Risk scoring must rank high above low");
check(summary.executionEnabled===false,"scoring","Summary must show execution disabled");
const statusById=new Map((phaseStatus.phases||[]).map(e=>[e.phaseId,e]));
check(statusById.get("P56.3")?.status==="complete","osPhaseStatus","P56.3 must be complete");
check(["in_progress","complete"].includes(statusById.get("P56.4")?.status),"osPhaseStatus","P56.4 must be tracked");
for(const file of changedFiles()){check(!file.startsWith("projects/careloop/"),"noForbiddenChanges",`Forbidden project change: ${file}`);check(!file.startsWith("projects/careloop-ios/"),"noForbiddenChanges",`Forbidden iOS project change: ${file}`);}
let result=Object.values(sections).every(Boolean)?"PASS":"FAIL";
const report=`# Test Recommendation Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P56.4 - Risk-Based Test Recommendation

## Summary

- Recommendations: ${summary.recommendationCount}
- High risk: ${summary.highRiskCount}
- Preview-only recommendations: ${summary.previewOnlyCount}
- Execution enabled: ${summary.executionEnabled}

## Checks

- Modules: ${sections.modules?"PASS":"FAIL"}
- Recommendations: ${sections.recommendations?"PASS":"FAIL"}
- Scoring: ${sections.scoring?"PASS":"FAIL"}
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
for(const [label,section] of [["Modules","modules"],["Recommendations","recommendations"],["Scoring","scoring"],["OS phase status","osPhaseStatus"],["No forbidden changes","noForbiddenChanges"],["Report written","reportWritten"]]) console.log(`${label}: ${sections[section]?"PASS":"FAIL"}`);
console.log(`Result: ${result}`); if(result!=="PASS") process.exitCode=1;
