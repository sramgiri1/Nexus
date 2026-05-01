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
      { id: "qa.tests.execute", label: "Run Tests", desc: "Execute CareLoop test suite." },
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
  activeApp: "careloop",
  apps: {
    shiftpay: {
      name: "ShiftPay",
      color: "#61c3ff",
      stage: "on-hold",
      traction: {
        interviews: { value: 5, target: 5, label: "User interviews", unit: "", done: true },
        waitlist: { value: 0, target: 200, label: "Waitlist", unit: "", done: false },
        testers: { value: 0, target: 25, label: "TestFlight testers", unit: "", done: false },
        wau: { value: 0, target: 10, label: "Weekly active users", unit: "", done: false },
        pmf: { value: 60, target: 60, label: "PMF signal", unit: "%", done: false },
      },
      economics: {
        price_mo: 4.99,
        price_yr: 49,
        free_to_paid: 8,
        avg_tenure: 18,
        cac_paid: 8,
        support_cost_mo: 0.5,
        infra_cost_per_user: 0.2,
      },
      projection: {
        conversion_rate: 8,
        churn_rate: 5,
        monthly_downloads: [0, 0, 200, 600, 1000, 1400, 1800, 2200, 2600, 3000, 3400, 3800],
      },
      interviewsInsight: "Shift workers want instant take-home clarity before accepting extra shifts.",
    },
    careloop: {
      name: "CareLoop",
      color: "#34d399",
      stage: "sprint",
      traction: {
        interviews: { value: 5, target: 5, label: "User interviews", unit: "", done: true },
        waitlist: { value: 0, target: 200, label: "Waitlist", unit: "", done: false },
        testers: { value: 0, target: 25, label: "TestFlight testers", unit: "", done: false },
        wau: { value: 0, target: 10, label: "Weekly active users", unit: "", done: false },
        pmf: { value: 60, target: 60, label: "PMF signal", unit: "%", done: false },
      },
      economics: {
        price_mo: 9.99,
        price_yr: 99,
        free_to_paid: 10,
        avg_tenure: 30,
        cac_paid: 12,
        support_cost_mo: 0.8,
        infra_cost_per_user: 0.3,
      },
      projection: {
        conversion_rate: 10,
        churn_rate: 3,
        monthly_downloads: [0, 0, 0, 150, 400, 700, 1000, 1300, 1600, 2000, 2400, 2800],
      },
      interviewsInsight: "Families want a shared operational system, not another noisy group text.",
    },
  },
};
