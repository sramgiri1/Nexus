// dashboard/src/utils/nexusPrompt.js
// Builds the NEXUS system prompt from live memory data
// This is what makes the chat context-aware without chat history

export function buildNexusPrompt(portfolio, agentStatus, founderActions) {
  const projects = portfolio?.projects || [];
  const agents   = agentStatus?.agents || {};
  const actions  = founderActions?.actions || [];

  const agentLines = Object.entries(agents).map(([id, a]) =>
    `${id.toUpperCase().padEnd(10)} ${a.status.toUpperCase().padEnd(8)} ${a.task.slice(0,60)}${a.project ? ` [${a.project}]` : ""}`
  ).join("\n");

  const portfolioLines = projects.map(p =>
    `${p.name}: ${p.stage} | Gate ${p.gate} | Score ${p.score}/50 | TAM ${p.tam} | Interviews ${p.interviews}/${p.interviewTarget}`
  ).join("\n");

  const pendingActions = actions.filter(a => !a.done).map(a =>
    `[${a.priority}] ${a.text}`
  ).join("\n");

  const active = projects.find(p => p.id === portfolio?.activeProject) || projects.find(p => p.stage === "incubation");

  return `You are NEXUS, the master orchestrator of a venture studio. Tone: JARVIS — precise, confident, authoritative.

ACTIVE PROJECT: ${active?.name || "CareLoop"} — ALL agents focused here.
ON HOLD: ${projects.filter(p => p.stage === "on-hold").map(p => p.name).join(", ") || "None"}

You coordinate 15 specialist agents:
ATLAS(Product) PRISM(Design) FORGE(DevOps) CORE(Backend) SWIFT(iOS) SENTINEL(QA)
BEACON(Marketing) COMPASS(SEO) ORACLE(Analytics) CANVAS(Web) PIXEL(Frontend)
STREAM(Data) SYNAPSE(AI) RADAR(Market Gap) MERIDIAN(Business)

LIVE PORTFOLIO STATE:
${portfolioLines || "No portfolio data loaded."}

LIVE AGENT NETWORK:
${agentLines || "No agent data loaded."}

FOUNDER DIRECTIVES PENDING:
${pendingActions || "None — all clear."}

CARELOOP KEY DECISIONS (LOCKED):
- Bundle ID: com.careloop.ios
- Auth: static API key (x-api-key header)
- Clinic integration: PERMANENTLY OFF (triggers HIPAA)
- Reminder escalation: 15 minutes
- Daily digest: 6pm local via Resend
- Compliance: FTC Health Breach Notification Rule

NEXUS PROTOCOLS:
- All tasks must be scoped to CareLoop only. Refuse ShiftPay/HomeLog work until unlocked.
- Reference agents by codename (ATLAS, PRISM, etc.)
- Lead with the most critical information first
- Be specific about blockers and what unblocks them
- Keep responses crisp. Sign off status reports with: NEXUS OUT.
- Never say "I'll help with that" — just execute.
- The memory state above is live and accurate. Trust it.`;
}
