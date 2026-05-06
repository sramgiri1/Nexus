export const NAV_ITEMS = [
  { path: "/", label: "Command Center", short: "HOME", icon: "◉" },
  { path: "/constellation", label: "AI Verse", short: "VERSE", icon: "◎" },
  { path: "/skills", label: "Skills", short: "SKILL", icon: "▶" },
  { path: "/traction", label: "Traction", short: "GROW", icon: "◆" },
];

export const TEAM_META = {
  core: { id: "core", name: "Command", color: "#67a8ff", glyph: "◉" },
  strategy: { id: "strategy", name: "Strategy", color: "#6dc4ff", glyph: "△" },
  product: { id: "product", name: "Product", color: "#9f7aea", glyph: "○" },
  platform: { id: "platform", name: "Platform", color: "#f59e0b", glyph: "◇" },
  growth: { id: "growth", name: "Growth", color: "#facc15", glyph: "✦" },
  verification: { id: "verification", name: "Verification", color: "#f87171", glyph: "⬡" },
  observability: { id: "observability", name: "Observability", color: "#34d399", glyph: "◈" },
};

export const AGENT_DIRECTORY = [
  { id: "nexus", name: "NEXUS", role: "CEO / Orchestrator", team: "core" },
  { id: "shepherd", name: "SHEPHERD", role: "Program Manager", team: "strategy" },
  { id: "atlas", name: "ATLAS", role: "Product Lead", team: "strategy" },
  { id: "radar", name: "RADAR", role: "Market Research", team: "strategy" },
  { id: "meridian", name: "MERIDIAN", role: "Business Validation", team: "strategy" },
  { id: "prism", name: "PRISM", role: "Design System", team: "product" },
  { id: "core", name: "CORE", role: "Backend", team: "product" },
  { id: "swift", name: "SWIFT", role: "iOS", team: "product" },
  { id: "pixel", name: "PIXEL", role: "Dashboard UI", team: "product" },
  { id: "canvas", name: "CANVAS", role: "Static Surfaces", team: "product" },
  { id: "forge", name: "FORGE", role: "Infrastructure", team: "platform" },
  { id: "stream", name: "STREAM", role: "Data Pipelines", team: "platform" },
  { id: "synapse", name: "SYNAPSE", role: "AI Layer", team: "platform" },
  { id: "beacon", name: "BEACON", role: "Marketing", team: "growth" },
  { id: "compass", name: "COMPASS", role: "ASO / SEO", team: "growth" },
  { id: "oracle", name: "ORACLE", role: "Analytics", team: "growth" },
  { id: "auditor", name: "AUDITOR", role: "Code Review Gate", team: "verification" },
  { id: "sentinel", name: "SENTINEL", role: "QA Gate", team: "verification" },
  { id: "warden", name: "WARDEN", role: "Compliance Gate", team: "verification" },
  { id: "relay", name: "RELAY", role: "Feedback Intel", team: "observability" },
];

export const STATUS_META = {
  active: { label: "Active", tone: "blue" },
  working: { label: "Working", tone: "amber" },
  blocked: { label: "Blocked", tone: "red" },
  done: { label: "Done", tone: "green" },
  idle: { label: "Idle", tone: "slate" },
};

export const PRIORITY_META = {
  critical: { label: "Critical", tone: "red" },
  high: { label: "High", tone: "amber" },
  medium: { label: "Medium", tone: "blue" },
  low: { label: "Low", tone: "slate" },
};

export const AI_VERSE_LINKS = [
  ["meridian", "nexus", "feeds", "Go / no-go"],
  ["oracle", "nexus", "feeds", "Investor metrics"],
  ["stream", "nexus", "feeds", "Pipeline state"],
  ["relay", "nexus", "feeds", "Escalated blockers"],
  ["atlas", "core", "blocks", "API contracts"],
  ["atlas", "swift", "blocks", "Feature spec"],
  ["prism", "swift", "blocks", "Design system"],
  ["core", "swift", "blocks", "App surface"],
  ["forge", "sentinel", "supports", "QA environment"],
  ["auditor", "sentinel", "blocks", "Code gate"],
  ["sentinel", "shepherd", "blocks", "Sprint sign-off"],
  ["warden", "shepherd", "blocks", "Compliance sign-off"],
  ["nexus", "atlas", "supports", "Orchestrates"],
  ["nexus", "forge", "supports", "Orchestrates"],
];

export const LINK_META = {
  blocks: { label: "Blocks", tone: "red" },
  feeds: { label: "Feeds", tone: "green" },
  supports: { label: "Supports", tone: "blue" },
};

export const SKILL_CATALOG = [
  {
    agent: "auditor",
    title: "Auditor",
    role: "Code Review Gate",
    team: "verification",
    skills: [
      { id: "code.diff_review", label: "Diff Review", desc: "Scan git diff and risk flags." },
      { id: "code.lint", label: "Lint", desc: "Run project lint checks." },
      { id: "code.static_analysis", label: "Static Analysis", desc: "Flag TODOs, eval, localhost, secrets." },
      { id: "code.test_coverage", label: "Coverage", desc: "Count and assess test coverage." },
    ],
  },
  {
    agent: "sentinel",
    title: "Sentinel",
    role: "QA Gate",
    team: "verification",
    skills: [
      { id: "qa.security.scan", label: "Security Scan", desc: "Scan for leaked credentials and unsafe config." },
      { id: "qa.simulator.run", label: "Simulator Boot", desc: "Boot the preferred simulator." },
      { id: "qa.tests.execute", label: "Run Tests", desc: "Execute the DemoApp test suite." },
      { id: "qa.logs.analyze", label: "Log Stream", desc: "Capture simulator logs and failures." },
    ],
  },
  {
    agent: "warden",
    title: "Warden",
    role: "Compliance Gate",
    team: "verification",
    skills: [
      { id: "compliance.privacy.check", label: "Privacy Check", desc: "Check policy coverage and privacy files." },
      { id: "compliance.permissions.validate", label: "Permissions Audit", desc: "Validate plist usage vs APIs." },
      { id: "compliance.appstore.check", label: "App Store Check", desc: "Review metadata and claims." },
    ],
  },
  {
    agent: "nexus",
    title: "Nexus",
    role: "Decision Engine",
    team: "core",
    skills: [
      { id: "read.system_state", label: "System State", desc: "Read full system health snapshot." },
      { id: "decide.release", label: "Release Decision", desc: "Produce GO / NO-GO release call." },
      { id: "decide.priority", label: "Priority Rank", desc: "Rank the next work queue." },
    ],
  },
  {
    agent: "orchestrator",
    title: "Orchestrator",
    role: "Flow Control",
    team: "observability",
    skills: [
      { id: "flow.monitor", label: "Queue Monitor", desc: "Read queue counts and state transitions." },
      { id: "flow.plan", label: "Sprint Plan", desc: "Plan the next sprint phase layout." },
      { id: "flow.aggregate", label: "Phase Aggregate", desc: "Summarize completed phase output." },
    ],
  },
];

export const DEFAULT_TRACTION = {
  activeApp: "demoapp",
  apps: {
    demoapp: {
      name: "DemoApp",
      color: "#61c3ff",
      stage: "showcase",
      traction: {
        interviews: { value: 8, target: 8, label: "Reviewer walkthroughs", unit: "", done: true },
        waitlist: { value: 120, target: 200, label: "Demo signups", unit: "", done: false },
        testers: { value: 14, target: 25, label: "Prototype reviewers", unit: "", done: false },
        wau: { value: 18, target: 25, label: "Weekly active evaluators", unit: "", done: false },
        pmf: { value: 62, target: 70, label: "Proof signal", unit: "%", done: false },
      },
      economics: {
        price_mo: 12.99,
        price_yr: 129,
        free_to_paid: 11,
        avg_tenure: 24,
        cac_paid: 14,
        support_cost_mo: 0.7,
        infra_cost_per_user: 0.3,
      },
      projection: {
        conversion_rate: 11,
        churn_rate: 4,
        monthly_downloads: [0, 50, 140, 280, 420, 620, 850, 1100, 1400, 1700, 2100, 2500],
      },
      interviewsInsight: "Reviewers respond best when they can see contracts, gates, evidence, and approvals in one operator surface.",
    },
  },
};

export const PROTOTYPE_PORTFOLIO = {
  activeProject: "demoapp",
  lastUpdated: "2026-05-06T14:24:00Z",
  sprintPlan: {
    currentSprint: 13,
    totalSprints: 16,
    phase: "Phase 13 · Demo and Showcase Mode",
  },
  projects: [
    {
      id: "demoapp",
      name: "DemoApp",
      tagline: "Public-safe sample app for NEXUS showcase",
      stage: "demo-showcase",
      gate: "release_readiness",
      notes:
        "Founder intent has been translated into a governed showcase chain. Release stays blocked until SENTINEL returns macOS/Xcode evidence and FORGE receives deploy approval.",
      score: 72,
      health: "watch",
      releaseStatus: "blocked_pending_sentinel",
      activeSprint: "Phase 13",
      gates: {
        auditor: "done",
        sentinel: "partial",
        warden: "done",
      },
    },
  ],
};

export const PROTOTYPE_AGENT_STATUS = {
  lastUpdated: "2026-05-06T14:25:00Z",
  agents: {
    nexus: { status: "active", task: "Assess DemoApp release posture", project: "demoapp", progress: 91 },
    shepherd: { status: "working", task: "Reconcile showcase plan and handoffs", project: "demoapp", progress: 83 },
    atlas: { status: "active", task: "Pressure-test public-safe MVP scope", project: "demoapp", progress: 64 },
    radar: { status: "idle", task: "Standing by for showcase research request", project: null, progress: 0 },
    meridian: { status: "idle", task: "Waiting on updated release evidence", project: "demoapp", progress: 22 },
    prism: { status: "done", task: "Command Center visual direction drafted", project: "demoapp", progress: 100 },
    core: { status: "working", task: "Implement sample task API and evidence hooks", project: "demoapp", progress: 72 },
    swift: { status: "active", task: "Build sample iOS task list and offline states", project: "demoapp", progress: 66 },
    pixel: { status: "done", task: "Static Command Center prototype assembled", project: "demoapp", progress: 100 },
    canvas: { status: "active", task: "Prepare public-safe static surfaces", project: "demoapp", progress: 58 },
    forge: { status: "blocked", task: "Await deployment approval for showcase environment", project: "demoapp", progress: 41 },
    stream: { status: "working", task: "Map runtime and evidence telemetry", project: "demoapp", progress: 49 },
    synapse: { status: "idle", task: "Hold provider integration changes until review", project: "demoapp", progress: 18 },
    beacon: { status: "active", task: "Draft DemoApp showcase narrative", project: "demoapp", progress: 63 },
    compass: { status: "idle", task: "ASO/SEO research queued behind showcase path", project: "demoapp", progress: 12 },
    oracle: { status: "working", task: "Define release measurement checkpoints", project: "demoapp", progress: 45 },
    auditor: { status: "done", task: "Code quality gate certified", project: "demoapp", progress: 100 },
    sentinel: { status: "working", task: "Run QA checklist and request macOS Xcode validation", project: "demoapp", progress: 54 },
    warden: { status: "done", task: "Privacy handling reviewed", project: "demoapp", progress: 100 },
    relay: { status: "active", task: "Cluster reviewer feedback", project: "demoapp", progress: 61 },
  },
};

export const PROTOTYPE_FOUNDER_ACTIONS = {
  lastUpdated: "2026-05-06T14:26:00Z",
  actions: [
    {
      id: "ACT-001",
      priority: "critical",
      text: "Approve a governed macOS/Xcode runtime path so SENTINEL can produce simulator evidence.",
      done: false,
    },
    {
      id: "ACT-002",
      priority: "high",
      text: "Decide whether the public showcase should stop at static prototype or include replay mode next.",
      done: false,
    },
    {
      id: "ACT-003",
      priority: "medium",
      text: "Confirm release readiness stays blocked until WARDEN, AUDITOR, and SENTINEL evidence are all linked.",
      done: false,
    },
    {
      id: "ACT-004",
      priority: "low",
      text: "Review BEACON narrative variants after the public repo boundary is stable.",
      done: false,
    },
    {
      id: "ACT-005",
      priority: "medium",
      text: "Archive older internal dashboards once Command Center is the canonical showcase surface.",
      done: true,
    },
  ],
};

export const PROTOTYPE_TASK_QUEUE = {
  lastUpdated: "2026-05-06T14:27:00Z",
  queue: [
    {
      id: "TASK-201",
      agentId: "core",
      projectId: "demoapp",
      task: "Implement sample task API",
      skill: "backend.code_edit",
      status: "running",
      priority: "high",
    },
    {
      id: "TASK-208",
      agentId: "swift",
      projectId: "demoapp",
      task: "Build sample iOS task list",
      skill: "ios.screen_build",
      status: "implementation_done",
      priority: "high",
    },
    {
      id: "TASK-214",
      agentId: "sentinel",
      projectId: "demoapp",
      task: "Run sample QA checklist",
      skill: "sentinel.qa.tests.execute",
      status: "awaiting_verification",
      priority: "critical",
    },
    {
      id: "TASK-221",
      agentId: "forge",
      projectId: "demoapp",
      task: "Prepare showcase environment",
      skill: "deploy.preflight",
      status: "blocked",
      priority: "high",
    },
    {
      id: "TASK-228",
      agentId: "beacon",
      projectId: "demoapp",
      task: "Draft showcase narrative variants",
      skill: "marketing.copy",
      status: "deferred_batch",
      priority: "low",
    },
    {
      id: "TASK-232",
      agentId: "warden",
      projectId: "demoapp",
      task: "Review sample privacy handling",
      skill: "warden.compliance.privacy.check",
      status: "queued",
      priority: "medium",
    },
  ],
  completed: [
    {
      id: "TASK-190",
      agentId: "auditor",
      projectId: "demoapp",
      task: "Diff review release slice",
      status: "completed",
      resolvedFromFailure: false,
      finishedAt: "2026-05-06T13:56:00Z",
    },
    {
      id: "TASK-187",
      agentId: "prism",
      projectId: "demoapp",
      task: "Operator layout spec",
      status: "completed",
      resolvedFromFailure: false,
      finishedAt: "2026-05-06T13:22:00Z",
    },
  ],
  failed: [
    {
      id: "FAIL-041",
      agentId: "forge",
      projectId: "demoapp",
      task: "Promote showcase environment without approval",
      status: "blocked",
      finishedAt: "2026-05-06T14:02:00Z",
      resolvedFromFailure: false,
    },
    {
      id: "FAIL-037",
      agentId: "sentinel",
      projectId: "demoapp",
      task: "iOS simulator validation missing macOS runtime",
      status: "completed",
      finishedAt: "2026-05-06T12:41:00Z",
      resolvedFromFailure: true,
    },
  ],
};
