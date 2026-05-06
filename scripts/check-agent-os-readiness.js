import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const agentsDir = path.join(repoRoot, 'agents');
const reportPath = path.join(repoRoot, 'reports', 'agent-os-readiness-report.md');

const roster = [
  { id: 'nexus', group: 'control' },
  { id: 'shepherd', group: 'control' },
  { id: 'auditor', group: 'verification' },
  { id: 'sentinel', group: 'verification' },
  { id: 'warden', group: 'verification' },
  { id: 'atlas', group: 'product-build' },
  { id: 'prism', group: 'product-build' },
  { id: 'core', group: 'product-build' },
  { id: 'swift', group: 'product-build' },
  { id: 'pixel', group: 'product-build' },
  { id: 'canvas', group: 'product-build' },
  { id: 'forge', group: 'platform' },
  { id: 'stream', group: 'platform' },
  { id: 'synapse', group: 'platform' },
  { id: 'radar', group: 'growth-observe' },
  { id: 'meridian', group: 'growth-observe' },
  { id: 'relay', group: 'growth-observe' },
  { id: 'beacon', group: 'growth-observe' },
  { id: 'compass', group: 'growth-observe' },
  { id: 'oracle', group: 'growth-observe' },
];

const sharedRefs = [
  'agents/_shared/agent-operating-standard.md',
  'agents/_shared/contract-usage-standard.md',
  'agents/_shared/state-machine-standard.md',
  'agents/_shared/model-routing-standard.md',
  'agents/_shared/batch-usage-standard.md',
  'agents/_shared/skill-usage-standard.md',
  'agents/_shared/evidence-standard.md',
  'agents/_shared/handoff-standard.md',
  'agents/_shared/agent-etiquette.md',
];

const requiredSections = [
  'Shared Standards',
  'Identity',
  'Mission',
  'Authority',
  'Inputs',
  'Contract Behavior',
  'State Machine Behavior',
  'Model / Cost / Batch Policy',
  'Skills',
  'Evidence',
  'Handoff Rules',
  'Forbidden Actions',
  'Output Contract',
  'Done Criteria',
  'Escalation Rules',
];

const globalConcepts = [
  { name: 'contract', test: (raw) => /\bcontract(s)?\b/i.test(raw) },
  { name: 'state machine', test: (raw) => /state[- ]machine/i.test(raw) },
  { name: 'model', test: (raw) => /\bmodel\b/i.test(raw) || /modelPolicyObserved/i.test(raw) },
  { name: 'batch', test: (raw) => /\bbatch\b/i.test(raw) },
  { name: 'skill', test: (raw) => /\bskill(s)?\b/i.test(raw) },
  { name: 'evidence', test: (raw) => /\bevidence\b/i.test(raw) },
  { name: 'handoff', test: (raw) => /\bhandoff(s)?\b/i.test(raw) },
  { name: 'forbidden', test: (raw) => /\bforbidden\b/i.test(raw) },
  { name: 'riskLevel', test: (raw) => /riskLevel/i.test(raw) },
  { name: 'modelPolicyObserved', test: (raw) => /modelPolicyObserved/i.test(raw) },
];

const unsafePhrases = [
  'i can bypass',
  'ignore the governor',
  'skip verification',
  'mark completed without evidence',
  'release go without evidence',
  'send secrets to',
  'batch gates',
];

const negators = ['must not', 'do not', 'never', 'forbid', 'forbidden', 'must never', 'no '];

const failures = new Map();
const categoryFailures = {
  sharedStandards: [],
  requiredSections: [],
  globalChecks: [],
  groupSpecific: [],
};

function safeGit(cmd) {
  try {
    return execSync(cmd, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unknown';
  }
}

function addFailure(agent, category, reason) {
  if (!failures.has(agent)) failures.set(agent, []);
  failures.get(agent).push(reason);
  categoryFailures[category].push(`${agent}: ${reason}`);
}

function hasRequiredSection(raw, section) {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^##\\s*${escaped}\\b.*$`, 'im').test(raw);
}

function lineMentions(raw, pattern) {
  return raw.split('\n').some((line) => pattern.test(line));
}

function rawHas(raw, regex) {
  return regex.test(raw);
}

function lineOrNearby(raw, regex, nearbyRegex) {
  if (regex.test(raw)) return true;
  if (!nearbyRegex) return false;
  return nearbyRegex.test(raw);
}

function hasUnsafePhrase(raw, phrase) {
  const lower = raw.toLowerCase();
  let index = lower.indexOf(phrase);
  while (index !== -1) {
    const context = lower.slice(Math.max(0, index - 80), index);
    const safe = negators.some((negator) => context.includes(negator));
    if (!safe) return true;
    index = lower.indexOf(phrase, index + phrase.length);
  }
  return false;
}

function requirePattern(agent, raw, category, reason, regex) {
  if (!regex.test(raw)) addFailure(agent, category, reason);
}

function requireAny(agent, raw, category, reason, regexes) {
  if (!regexes.some((regex) => regex.test(raw))) addFailure(agent, category, reason);
}

function runGroupChecks(agent, group, raw) {
  if (group === 'control') {
    if (agent === 'nexus') {
      requirePattern(agent, raw, 'groupSpecific', 'missing release GO reference', /release GO|release_go/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing release contract reference', /release contract|release-contract/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing AUDITOR reference', /\bAUDITOR\b/);
      requirePattern(agent, raw, 'groupSpecific', 'missing SENTINEL reference', /\bSENTINEL\b/);
      requirePattern(agent, raw, 'groupSpecific', 'missing WARDEN reference', /\bWARDEN\b/);
      requirePattern(agent, raw, 'groupSpecific', 'missing realtime-only policy', /realtime[- ]only/i);
      requireAny(agent, raw, 'groupSpecific', 'missing no release GO without evidence rule', [
        /must not.*release_go.*evidence/i,
        /must not.*release GO.*evidence/i,
        /release contract evidence/i,
      ]);
      requireAny(agent, raw, 'groupSpecific', 'missing no code implementation rule', [
        /does not implement code/i,
        /must not implement code/i,
        /do not implement code/i,
      ]);
    }
    if (agent === 'shepherd') {
      requirePattern(agent, raw, 'groupSpecific', 'missing taskContracts', /taskContracts/);
      requirePattern(agent, raw, 'groupSpecific', 'missing handoffContracts', /handoffContracts/);
      requirePattern(agent, raw, 'groupSpecific', 'missing dependsOn', /dependsOn/);
      requirePattern(agent, raw, 'groupSpecific', 'missing verificationGates', /verificationGates/);
      requirePattern(agent, raw, 'groupSpecific', 'missing realtime-only policy', /realtime[- ]only/i);
      requireAny(agent, raw, 'groupSpecific', 'missing no code implementation rule', [
        /does not implement code/i,
        /must not implement code/i,
        /do not implement code/i,
        /Does not own:[\s\S]{0,200}Implementation[\s\S]{0,200}Code edits/i,
      ]);
      requireAny(agent, raw, 'groupSpecific', 'missing does not pass gates rule', [
        /does not pass gates/i,
        /must not pass gates/i,
        /Does not certify work, pass gates/i,
      ]);
    }
  }

  if (group === 'verification') {
    requirePattern(agent, raw, 'groupSpecific', 'missing skill-first language', /skill[- ]first/i);
    requirePattern(agent, raw, 'groupSpecific', 'missing awaiting_verification', /awaiting_verification/i);
    requirePattern(agent, raw, 'groupSpecific', 'missing verification_failed', /verification_failed/i);
    requirePattern(agent, raw, 'groupSpecific', 'missing completed state reference', /\bcompleted\b/i);
    requirePattern(agent, raw, 'groupSpecific', 'missing PASS|FAIL|INFO contract', /PASS\|FAIL\|INFO/);
    requireAny(agent, raw, 'groupSpecific', 'missing source-code modification prohibition', [
      /must not modify source code/i,
      /must not modify production source code/i,
      /do not modify production source code/i,
      /forbids source-code modification/i,
    ]);
    requireAny(agent, raw, 'groupSpecific', 'missing release decision prohibition', [
      /must not.*release GO/i,
      /forbids release decisions/i,
      /Does not own:[\s\S]{0,200}Release GO or NO-GO/i,
    ]);
    requireAny(agent, raw, 'groupSpecific', 'missing no batch for blocking gate decisions rule', [
      /must not use batch for blocking gate/i,
      /must not use batch for blocking compliance\/privacy gate decisions/i,
      /must not use batch for blocking compliance or privacy gate decisions/i,
      /must not use batch for blocking gate pass or fail/i,
    ]);

    if (agent === 'auditor') {
      ['auditor.code.lint', 'auditor.code.static_analysis', 'auditor.code.test_coverage', 'auditor.code.diff_review'].forEach((skill) => {
        requirePattern(agent, raw, 'groupSpecific', `missing ${skill}`, new RegExp(skill.replace(/\./g, '\\.')));
      });
    }
    if (agent === 'sentinel') {
      ['sentinel.qa.simulator.run', 'sentinel.qa.tests.execute', 'sentinel.qa.logs.analyze', 'sentinel.qa.security.scan'].forEach((skill) => {
        requirePattern(agent, raw, 'groupSpecific', `missing ${skill}`, new RegExp(skill.replace(/\./g, '\\.')));
      });
      requirePattern(agent, raw, 'groupSpecific', 'missing macOS/Xcode runtime requirement', /macOS\/Xcode|macos-xcode/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing xcodebuild or simulator reference', /xcodebuild|simulator/i);
    }
    if (agent === 'warden') {
      ['warden.compliance.privacy.check', 'warden.compliance.permissions.validate', 'warden.compliance.appstore.check'].forEach((skill) => {
        requirePattern(agent, raw, 'groupSpecific', `missing ${skill}`, new RegExp(skill.replace(/\./g, '\\.')));
      });
      requirePattern(agent, raw, 'groupSpecific', 'missing personal data reference', /personal data/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing restricted reference', /\brestricted\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing LLM context reference', /LLM context/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing batch reference', /\bbatch\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing OpenRouter reference', /OpenRouter/i);
    }
  }

  if (group === 'product-build') {
    if (['core', 'swift', 'pixel', 'canvas'].includes(agent)) {
      requirePattern(agent, raw, 'groupSpecific', 'missing implementation_done', /implementation_done/);
      requireAny(agent, raw, 'groupSpecific', 'missing no completed transition rule', [
        /must not request:\s*[\s\S]{0,120}completed/i,
        /must not self-complete/i,
        /not completed/i,
      ]);
      requirePattern(agent, raw, 'groupSpecific', 'missing verificationRequests', /verificationRequests/);
      requirePattern(agent, raw, 'groupSpecific', 'missing changedFiles', /changedFiles/);
    }

    if (agent === 'core') {
      requirePattern(agent, raw, 'groupSpecific', 'missing DB reference', /\bDB\b|database/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing personal data reference', /personal data/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing migration reference', /migration/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing WARDEN reference', /\bWARDEN\b/);
    }
    if (agent === 'swift') {
      requirePattern(agent, raw, 'groupSpecific', 'missing macOS/Xcode runtime requirement', /macOS\/Xcode|macos-xcode/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing xcodebuild or simulator reference', /xcodebuild|simulator/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing runtimeNeeds', /runtimeNeeds/);
    }
    if (agent === 'pixel') {
      requirePattern(agent, raw, 'groupSpecific', 'missing dashboard or web frontend reference', /dashboard|web frontend/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing accessibility or state handling reference', /accessibility|state handling/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing PRISM reference', /\bPRISM\b/);
    }
    if (agent === 'canvas') {
      requirePattern(agent, raw, 'groupSpecific', 'missing privacy reference', /privacy/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing WARDEN reference', /\bWARDEN\b/);
      requirePattern(agent, raw, 'groupSpecific', 'missing static or landing reference', /static|landing/i);
    }
    if (agent === 'atlas') {
      requirePattern(agent, raw, 'groupSpecific', 'missing PRD reference', /\bPRD\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing API contract reference', /API contract/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing acceptanceCriteria', /acceptanceCriteria/);
      requirePattern(agent, raw, 'groupSpecific', 'missing handoffContracts', /handoffContracts/);
    }
    if (agent === 'prism') {
      requirePattern(agent, raw, 'groupSpecific', 'missing design system reference', /design system/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing screen spec reference', /screen spec/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing UX flow reference', /UX flow/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing accessibility reference', /accessibility/i);
    }
  }

  if (group === 'platform') {
    requirePattern(agent, raw, 'groupSpecific', 'missing implementation_done', /implementation_done/);
    requirePattern(agent, raw, 'groupSpecific', 'missing awaiting_approval', /awaiting_approval/);
    requireAny(agent, raw, 'groupSpecific', 'missing approvalRequired or approval required', [
      /approvalRequired/,
      /approval required/i,
    ]);
    requireAny(agent, raw, 'groupSpecific', 'missing release decision prohibition', [
      /must not.*release GO/i,
      /forbids release decisions/i,
      /Release GO or NO-GO/i,
    ]);

    if (agent === 'forge') {
      requirePattern(agent, raw, 'groupSpecific', 'missing deploy reference', /\bdeploy\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing secrets reference', /\bsecrets\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing CI/CD reference', /CI\/CD/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing rollback reference', /rollback/i);
    }
    if (agent === 'stream') {
      requirePattern(agent, raw, 'groupSpecific', 'missing data classification reference', /data classification/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing personal data reference', /personal data/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing production data reference', /production data/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing WARDEN reference', /\bWARDEN\b/);
    }
    if (agent === 'synapse') {
      requirePattern(agent, raw, 'groupSpecific', 'missing provider reference', /\bprovider\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing model reference', /\bmodel\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing MCP reference', /\bMCP\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing OpenRouter reference', /OpenRouter/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing restricted reference', /\brestricted\b/i);
    }
  }

  if (group === 'growth-observe') {
    requireAny(agent, raw, 'groupSpecific', 'missing data classification reference', [
      /dataClassification/,
      /data classification/i,
    ]);
    requirePattern(agent, raw, 'groupSpecific', 'missing deferred_batch', /deferred_batch/);
    requirePattern(agent, raw, 'groupSpecific', 'missing batch limitations reference', /\bbatch\b/i);
    requireAny(agent, raw, 'groupSpecific', 'missing release decision prohibition', [
      /must not.*release GO/i,
      /forbids release decisions/i,
      /Release GO or NO-GO/i,
    ]);
    requireAny(agent, raw, 'groupSpecific', 'missing gate-passing prohibition', [
      /must not pass gates/i,
      /forbids gate passing/i,
      /Verification gates/i,
      /gate pass or fail/i,
    ]);
    requireAny(agent, raw, 'groupSpecific', 'missing fabrication prohibition', [
      /must not fabricate/i,
      /Do not fabricate/i,
      /fabricate/i,
    ]);

    if (agent === 'radar') {
      requirePattern(agent, raw, 'groupSpecific', 'missing market reference', /market/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing competitor reference', /competitor/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing source boundaries reference', /source boundaries/i);
      requireAny(agent, raw, 'groupSpecific', 'missing TAM or threat reference', [/TAM/i, /threat/i]);
    }
    if (agent === 'meridian') {
      requirePattern(agent, raw, 'groupSpecific', 'missing pricing reference', /pricing/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing revenue reference', /revenue/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing assumptions reference', /assumptions/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing investor reference', /investor/i);
    }
    if (agent === 'relay') {
      requirePattern(agent, raw, 'groupSpecific', 'missing feedback reference', /feedback/i);
      requireAny(agent, raw, 'groupSpecific', 'missing bug clustering or clusters reference', [/bug clustering/i, /\bclusters\b/i]);
      requirePattern(agent, raw, 'groupSpecific', 'missing redaction reference', /redaction|redacted/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing WARDEN reference', /\bWARDEN\b/);
    }
    if (agent === 'beacon') {
      requirePattern(agent, raw, 'groupSpecific', 'missing marketing reference', /marketing/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing App Store reference', /App Store/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing claims reference', /claims?/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing WARDEN reference', /\bWARDEN\b/);
    }
    if (agent === 'compass') {
      requirePattern(agent, raw, 'groupSpecific', 'missing ASO reference', /\bASO\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing SEO reference', /\bSEO\b/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing keywords reference', /keywords?/i);
      requireAny(agent, raw, 'groupSpecific', 'missing App Store metadata or metadata reference', [/App Store metadata/i, /\bmetadata\b/i]);
    }
    if (agent === 'oracle') {
      requirePattern(agent, raw, 'groupSpecific', 'missing analytics reference', /analytics/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing event schema reference', /event schema/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing metrics reference', /metrics/i);
      requirePattern(agent, raw, 'groupSpecific', 'missing privacy review reference', /privacy review/i);
    }
  }
}

for (const { id, group } of roster) {
  const filePath = path.join(agentsDir, `${id}.md`);
  if (!fs.existsSync(filePath)) {
    addFailure(id, 'sharedStandards', 'missing agent file');
    addFailure(id, 'requiredSections', 'missing agent file');
    addFailure(id, 'globalChecks', 'missing agent file');
    addFailure(id, 'groupSpecific', 'missing agent file');
    continue;
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  for (const ref of sharedRefs) {
    if (!raw.includes(ref)) {
      addFailure(id, 'sharedStandards', `missing shared standards reference: ${ref}`);
    }
  }

  for (const section of requiredSections) {
    if (!hasRequiredSection(raw, section)) {
      addFailure(id, 'requiredSections', `missing required section: ${section}`);
    }
  }

  for (const concept of globalConcepts) {
    if (!concept.test(raw)) {
      addFailure(id, 'globalChecks', `missing global concept: ${concept.name}`);
    }
  }

  for (const phrase of unsafePhrases) {
    if (hasUnsafePhrase(raw, phrase)) {
      addFailure(id, 'globalChecks', `contains unsafe phrase without nearby negation: "${phrase}"`);
    }
  }

  runGroupChecks(id, group, raw);
}

const overallPass =
  categoryFailures.sharedStandards.length === 0 &&
  categoryFailures.requiredSections.length === 0 &&
  categoryFailures.globalChecks.length === 0 &&
  categoryFailures.groupSpecific.length === 0;

const branch = safeGit('git branch --show-current');
const commit = safeGit('git rev-parse --short HEAD');
const timestamp = new Date().toISOString();

const passFail = (ok) => (ok ? 'PASS' : 'FAIL');

const consoleLines = [
  'NEXUS Agent OS Readiness Check',
  '================================',
  '',
  `Agents checked: ${roster.length}`,
  `Shared standards: ${passFail(categoryFailures.sharedStandards.length === 0)}`,
  `Required sections: ${passFail(categoryFailures.requiredSections.length === 0)}`,
  `Global checks: ${passFail(categoryFailures.globalChecks.length === 0)}`,
  `Group-specific checks: ${passFail(categoryFailures.groupSpecific.length === 0)}`,
  '',
  'Failures:',
];

if (failures.size === 0) {
  consoleLines.push('- none');
} else {
  for (const [agent, reasons] of failures) {
    for (const reason of reasons) {
      consoleLines.push(`- ${agent}: ${reason}`);
    }
  }
}

consoleLines.push('', `Result: ${passFail(overallPass)}`);
console.log(consoleLines.join('\n'));

const reportLines = [
  '# Agent OS Readiness Report',
  '',
  `- Timestamp: ${timestamp}`,
  `- Branch: ${branch}`,
  `- Commit: ${commit}`,
  `- Agents checked: ${roster.length}`,
  '',
  '## Agents Checked',
  '',
  ...roster.map(({ id, group }) => `- \`${id}\` (${group})`),
  '',
  '## Checks Passed',
  '',
  `- Shared standards: ${passFail(categoryFailures.sharedStandards.length === 0)}`,
  `- Required sections: ${passFail(categoryFailures.requiredSections.length === 0)}`,
  `- Global checks: ${passFail(categoryFailures.globalChecks.length === 0)}`,
  `- Group-specific checks: ${passFail(categoryFailures.groupSpecific.length === 0)}`,
  '',
  '## Checks Failed',
  '',
];

if (failures.size === 0) {
  reportLines.push('- none');
} else {
  for (const [agent, reasons] of failures) {
    reportLines.push(`### ${agent}`);
    reportLines.push('');
    for (const reason of reasons) {
      reportLines.push(`- ${reason}`);
    }
    reportLines.push('');
  }
}

reportLines.push('## Recommended Next Action', '');
reportLines.push(
  overallPass
    ? '- PASS: keep this checker in CI/manual validation flow to catch future prompt drift.'
    : '- FAIL: fix only the minimal readiness mismatches in the listed agent files, then rerun `npm run check:agent-os-readiness` until the report passes.'
);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${reportLines.join('\n')}\n`);

process.exit(overallPass ? 0 : 1);
