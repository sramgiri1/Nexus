import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createTestProposal, listTestProposalPreview, summarizeTestProposal, validateTestProposal } from "../quality-intelligence/index.js";

const ROOT=process.cwd(); const REPORT_PATH=join(ROOT,"reports/test-proposal-workflow-report.md");
const sections={modules:true,proposal:true,policy:true,osPhaseStatus:true,noForbiddenChanges:true,reportWritten:true};
const failures=[]; const fail=(s,m)=>{sections[s]=false;failures.push(m);}; const check=(c,s,m)=>{if(!c)fail(s,m);};
const read=p=>{const f=join(ROOT,p);return existsSync(f)?readFileSync(f,"utf8"):"";};
const parseJson=(p,s)=>{try{return JSON.parse(read(p));}catch(e){fail(s,`${p} did not parse: ${e.message}`);return{};}};
const git=args=>execFileSync("git",args,{cwd:ROOT,encoding:"utf8"}).trim();
const changedFiles=()=>git(["status","--short"]).split("\n").map(l=>l.trim().slice(3)).filter(Boolean);
console.log("NEXUS Test Proposal Workflow Check"); console.log("==================================");
const branch=git(["branch","--show-current"]); const head=git(["rev-parse","--short","HEAD"]);
const pkg=parseJson("package.json","modules"); const policy=parseJson("policy/quality-intelligence-policy.json","policy"); const phaseStatus=parseJson("os-roadmap/phase-status.json","osPhaseStatus");
const proposal=createTestProposal({gapId:"gap-prd-ios-validation",linkedRequirement:"prd-ios-validation",ownerAgent:"SWIFT",riskLevel:"high"});
const validation=validateTestProposal(proposal); const summary=summarizeTestProposal(proposal); const proposals=listTestProposalPreview({projectId:"private-project-01"});
check(existsSync(join(ROOT,"quality-intelligence/testProposalWorkflow.js")),"modules","Missing testProposalWorkflow.js");
check(pkg.scripts?.["check:test-proposal-workflow"]==="node scripts/check-test-proposal-workflow.js","modules","Missing package script");
check(validation.valid,"proposal",`Proposal invalid: ${validation.errors.join("; ")}`);
check(summary.executionEnabled===false,"proposal","Proposal must not enable execution");
check(summary.mutationAllowed===false,"proposal","Proposal must not allow mutation");
check(proposals.length>=1,"proposal","Expected proposal previews");
check(policy.testFileCreationAllowed===false,"policy","Policy must disable test file creation");
check(policy.projectMutationAllowed===false,"policy","Policy must disable project mutation");
check(policy.proposalOnly===true,"policy","Policy must be proposal-only");
const statusById=new Map((phaseStatus.phases||[]).map(e=>[e.phaseId,e]));
check(statusById.get("P56.4")?.status==="complete","osPhaseStatus","P56.4 must be complete");
check(["in_progress","complete"].includes(statusById.get("P56.5")?.status),"osPhaseStatus","P56.5 must be tracked");
for(const file of changedFiles()){check(!file.startsWith("projects/careloop/"),"noForbiddenChanges",`Forbidden project change: ${file}`);check(!file.startsWith("projects/careloop-ios/"),"noForbiddenChanges",`Forbidden iOS project change: ${file}`);}
let result=Object.values(sections).every(Boolean)?"PASS":"FAIL";
const report=`# Test Proposal Workflow Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P56.5 - Test Proposal Workflow

## Summary

- Proposal ID: ${summary.proposalId}
- Risk: ${summary.riskLevel}
- Execution enabled: ${summary.executionEnabled}
- Mutation allowed: ${summary.mutationAllowed}
- Approval required: ${summary.approvalRequired}

## Checks

- Modules: ${sections.modules?"PASS":"FAIL"}
- Proposal: ${sections.proposal?"PASS":"FAIL"}
- Policy: ${sections.policy?"PASS":"FAIL"}
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
for(const [label,section] of [["Modules","modules"],["Proposal","proposal"],["Policy","policy"],["OS phase status","osPhaseStatus"],["No forbidden changes","noForbiddenChanges"],["Report written","reportWritten"]]) console.log(`${label}: ${sections[section]?"PASS":"FAIL"}`);
console.log(`Result: ${result}`); if(result!=="PASS") process.exitCode=1;
