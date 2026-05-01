import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { askNexus } from "../utils/api.js";
import { buildNexusPrompt } from "../utils/nexusPrompt.js";
import {
  EmptyState,
  PriorityPill,
  SectionHeading,
  StatusPill,
  formatRelative,
  formatTimestamp,
} from "../components/StudioPrimitives.jsx";

const STATUS_ORDER = {
  blocked: 0,
  working: 1,
  active: 2,
  idle: 3,
  done: 4,
};

const HOME_TABS = [
  { id: "voice", label: "Voice agent" },
  { id: "automation", label: "Automation" },
  { id: "platform", label: "Platform" },
];

function buildWelcome(studio) {
  const project = studio.activeProject;
  if (!project) {
    return "Portfolio memory is connected, but no active venture is selected. Point me at the next mission and I will map the pressure, blockers, and decision path.";
  }

  return [
    `${project.name} is the active venture.`,
    `Current gate is ${project.gate}, and readiness is ${studio.gateProgress}%.`,
    `${studio.statusCounts.active + studio.statusCounts.working} agents are engaged, ${studio.statusCounts.blocked} are blocked, and ${studio.openActions.length} founder directives remain open.`,
    "Ask me for the shortest path, the real blocker, or the investor story that survives scrutiny.",
  ].join(" ");
}

function liveNarrative(studio) {
  if (studio.statusCounts.blocked > 0) {
    return `${studio.statusCounts.blocked} blocker${studio.statusCounts.blocked === 1 ? "" : "s"} are shaping the tempo right now. Recovery discipline is the story.`;
  }
  if (studio.queueDepth > 0) {
    return `${studio.queueDepth} queue item${studio.queueDepth === 1 ? "" : "s"} are still moving through the system. Execution is live with no visible stall.`;
  }
  return "The operating system is stable. The next shift in posture depends on founder decision quality, not agent recovery.";
}

function ChatMessage({ message }) {
  return (
    <div className={`message${message.role === "user" ? " message--user" : ""}`}>
      <div className="message__meta">{message.role === "user" ? "Founder" : "NEXUS"} · {message.time}</div>
      <div className="message__bubble">{message.content}</div>
    </div>
  );
}

function statusTone(status) {
  if (status === "blocked") return "blocked";
  if (status === "working") return "working";
  if (status === "active") return "active";
  if (status === "done") return "done";
  return "idle";
}

function voiceButtonLabel(voiceSupported, voiceState) {
  if (voiceState === "listening") return "Listening…";
  if (voiceState === "sending") return "Sending…";
  if (!voiceSupported) return "Voice unavailable";
  return "Use voice";
}

export default function CommandCenter({ studio }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceState, setVoiceState] = useState("idle");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [activeTab] = useState("voice");
  const threadRef = useRef(null);
  const recognitionRef = useRef(null);
  const pendingTranscriptRef = useRef("");
  const latestMessagesRef = useRef(messages);
  const sendPromptRef = useRef(null);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (messages.length) return;
    setMessages([
      {
        role: "assistant",
        content: buildWelcome(studio),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [messages.length, studio]);

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, loading]);

  const sortedAgents = useMemo(
    () =>
      [...studio.agentEntries].sort((a, b) => {
        const statusDelta = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
        if (statusDelta !== 0) return statusDelta;
        return (b.progress || 0) - (a.progress || 0) || a.name.localeCompare(b.name);
      }),
    [studio.agentEntries]
  );

  const quickPrompts = useMemo(() => {
    const prompts = [
      studio.activeProject ? `What is the shortest path to move ${studio.activeProject.name} through ${studio.activeProject.gate}?` : null,
      studio.statusCounts.blocked ? "Which blocker should I remove first and why?" : null,
      studio.openActions.length ? "Turn the founder directives into one decisive weekly agenda." : null,
      studio.queueDepth ? "What can realistically ship if I only focus on the live queue?" : null,
      studio.recentCompletions.length ? "What has the system actually proven in the last 24 hours?" : null,
      "Give me the investor story in five lines with no fluff.",
      "Where is the operating system wasting founder attention?",
    ].filter(Boolean);

    return [...new Set(prompts)].slice(0, 4);
  }, [studio]);

  const sendPrompt = useCallback(
    async (raw) => {
      const text = (raw ?? input).trim();
      if (!text || loading) return;

      const userMessage = {
        role: "user",
        content: text,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };

      setInput("");
      setMessages((current) => [...current, userMessage]);
      setLoading(true);

      try {
        const systemPrompt = buildNexusPrompt(studio.portfolio, studio.agentStatus, studio.founderActions);
        const reply = await askNexus([...latestMessagesRef.current, userMessage], systemPrompt);
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: reply,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: `NEXUS console failed to respond.\n\n${error.message}`,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } finally {
        setLoading(false);
        setVoiceState("idle");
      }
    },
    [input, loading, studio]
  );

  useEffect(() => {
    sendPromptRef.current = sendPrompt;
  }, [sendPrompt]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return undefined;
    }

    setVoiceSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      pendingTranscriptRef.current = "";
      setVoiceState("listening");
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      pendingTranscriptRef.current = transcript;
      setInput(transcript);
    };

    recognition.onend = () => {
      const transcript = pendingTranscriptRef.current.trim();
      if (!transcript) {
        setVoiceState("idle");
        return;
      }

      pendingTranscriptRef.current = "";
      setVoiceState("sending");
      sendPromptRef.current?.(transcript);
    };

    recognition.onerror = () => {
      pendingTranscriptRef.current = "";
      setVoiceState("idle");
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    };
  }, []);

  function toggleVoiceCapture() {
    if (!voiceSupported || !recognitionRef.current) return;

    if (voiceState === "listening") {
      recognitionRef.current.stop();
      return;
    }

    try {
      recognitionRef.current.start();
    } catch {
      setVoiceState("idle");
    }
  }

  const missionLabel = studio.activeProject ? `${studio.activeProject.name} operating posture` : "Command posture";
  const missionNote =
    studio.activeProject?.notes ||
    "No active venture selected. Portfolio memory is connected, but mission context is still thin.";

  return (
    <div className="page page--command" data-testid="command-center-page">
      <div className="command-home">
        <div className="command-dock">
          <div className="command-dock__brand">
            <div className="command-dock__mark">N</div>
            <div>
              <div className="command-dock__brand-label">NEXUS command deck</div>
              <div className="command-dock__brand-meta">Live founder-facing control surface</div>
            </div>
          </div>

          <div className="command-dock__nav" aria-label="home modes">
            {HOME_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`command-dock__tab${activeTab === tab.id ? " command-dock__tab--active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="command-dock__actions">
            <button type="button" className="command-dock__action command-dock__action--ghost" onClick={studio.refresh}>
              Sync memory
            </button>
            <button
              type="button"
              className="command-dock__action command-dock__action--primary"
              onClick={toggleVoiceCapture}
              data-testid="voice-toggle"
              disabled={!voiceSupported && voiceState !== "listening"}
            >
              {voiceButtonLabel(voiceSupported, voiceState)}
            </button>
          </div>
        </div>

        <div className="command-reference-grid">
          <aside className="command-status-column command-reference-sidebar">
            <div className="command-agent-shell">
              <div className="command-agent-shell__head">
                <div>
                  <div className="eyebrow">Agent State</div>
                  <h2 className="command-agent-shell__title">Live network</h2>
                  <p className="command-agent-shell__subtitle">Seven visible at once. The rest stay in the rail.</p>
                </div>
                <StatusPill status={studio.statusCounts.blocked ? "blocked" : "active"}>{studio.agentEntries.length} total</StatusPill>
              </div>

              <div className="command-agent-shell__summary">
                <div className="command-agent-stat">
                  <span className="eyebrow">Engaged</span>
                  <strong>{studio.statusCounts.active + studio.statusCounts.working}</strong>
                </div>
                <div className="command-agent-stat">
                  <span className="eyebrow">Blocked</span>
                  <strong className="tone-red">{studio.statusCounts.blocked}</strong>
                </div>
                <div className="command-agent-stat">
                  <span className="eyebrow">Queue</span>
                  <strong>{studio.queueDepth}</strong>
                </div>
                <div className="command-agent-stat">
                  <span className="eyebrow">Recovered</span>
                  <strong className="tone-green">{studio.resolvedFailures.length}</strong>
                </div>
              </div>

              <div className="command-status-list">
                {sortedAgents.map((agent) => (
                  <div key={agent.id} className={`command-status-card command-status-card--${statusTone(agent.status)}`}>
                    <div className="command-status-card__top">
                      <div>
                        <div className="command-status-card__name">{agent.name}</div>
                        <div className="command-status-card__role">{agent.role}</div>
                      </div>
                      <StatusPill status={agent.status}>{agent.status}</StatusPill>
                    </div>
                    <div className="command-status-card__task">{agent.task || "No active assignment."}</div>
                    <div className="command-status-card__meta">
                      <span>{agent.project || "system"}</span>
                      <span>{agent.progress || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="command-reference-main">
            <section className="command-note">
              <div className="command-note__chrome">
                <div className="command-note__window">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="command-note__chiprow">
                  <StatusPill status="active">{studio.activeProject ? studio.activeProject.name : "Portfolio"}</StatusPill>
                  <StatusPill status={studio.statusCounts.blocked ? "blocked" : "done"}>
                    {studio.statusCounts.blocked ? `${studio.statusCounts.blocked} blocked` : "Stable"}
                  </StatusPill>
                  <StatusPill status="working">{voiceSupported ? "Voice online" : "Voice preview"}</StatusPill>
                </div>
              </div>

              <div className="command-note__paper">
                <div className="command-note__label">voice agent</div>
                <h2 className="command-note__title">
                  {studio.activeProject ? `${studio.activeProject.name} → ${studio.activeProject.gate}` : "Point NEXUS at the next mission."}
                </h2>
                <p className="command-note__body">{liveNarrative(studio)}</p>

                <div className="command-note__metrics">
                  <div className="command-note__metric">
                    <span className="eyebrow">readiness</span>
                    <strong>{studio.gateProgress}%</strong>
                  </div>
                  <div className="command-note__metric">
                    <span className="eyebrow">directives</span>
                    <strong>{studio.openActions.length}</strong>
                  </div>
                  <div className="command-note__metric">
                    <span className="eyebrow">sync</span>
                    <strong>{formatRelative(studio.lastUpdated)}</strong>
                  </div>
                </div>

                <div className="command-console__thread command-note__thread" ref={threadRef}>
                  {messages.map((message, index) => (
                    <ChatMessage key={`${message.time}-${index}`} message={message} />
                  ))}
                  {loading && (
                    <div className="message">
                      <div className="message__meta">NEXUS · thinking</div>
                      <div className="message__bubble">Reasoning against current live memory…</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="command-note__composer">
                <div className="command-console__quick-label">Example commands</div>
                <div className="command-console__prompts">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      className="quick-prompt command-prompt-chip"
                      onClick={() => sendPrompt(prompt)}
                      disabled={loading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <textarea
                  className="textarea command-console__input"
                  placeholder="Ask for blockers, investor briefs, sprint risk, release readiness, or founder priorities."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                />

                <div className="command-note__actionrow">
                  <button className="command-dock__action command-dock__action--primary" onClick={() => sendPrompt()} disabled={loading || !input.trim()}>
                    Send to NEXUS
                  </button>
                  <button className="command-dock__action command-dock__action--ghost" onClick={() => setMessages([])} disabled={loading}>
                    Reset thread
                  </button>
                </div>
              </div>
            </section>

            <div className="command-support-grid">
              <section className="command-card">
                <div className="command-card__head">
                  <div>
                    <div className="eyebrow">Mission Signal</div>
                    <h3 className="command-card__title">{missionLabel}</h3>
                  </div>
                  <StatusPill status={studio.statusCounts.blocked ? "blocked" : "done"}>
                    {studio.statusCounts.blocked ? "Recovery pressure" : "Stable posture"}
                  </StatusPill>
                </div>
                <p className="command-card__copy">{missionNote}</p>
                <div className="command-card__metrics">
                  <div className="command-card__metric">
                    <span className="eyebrow">Current gate</span>
                    <strong>{studio.activeProject?.gate || "—"}</strong>
                  </div>
                  <div className="command-card__metric">
                    <span className="eyebrow">Sprint</span>
                    <strong>{studio.sprintPlan ? `${studio.sprintPlan.currentSprint}/${studio.sprintPlan.totalSprints}` : "—"}</strong>
                  </div>
                  <div className="command-card__metric">
                    <span className="eyebrow">Score</span>
                    <strong>{studio.activeProject?.score || 0}/50</strong>
                  </div>
                  <div className="command-card__metric">
                    <span className="eyebrow">Readiness</span>
                    <strong>{studio.gateProgress}%</strong>
                  </div>
                </div>
              </section>

              <section className="command-card">
                <div className="command-card__head">
                  <div>
                    <div className="eyebrow">Founder Queue</div>
                    <h3 className="command-card__title">Immediate directives</h3>
                  </div>
                  <PriorityPill priority="high">{studio.openActions.length} open</PriorityPill>
                </div>

                {studio.openActions.length ? (
                  <div className="data-list">
                    {studio.openActions.slice(0, 4).map((action) => (
                      <div key={action.id} className="data-row">
                        <div className="data-row__top">
                          <div className="data-row__title">{action.text}</div>
                          <PriorityPill priority={action.priority}>{action.priority}</PriorityPill>
                        </div>
                        <div className="data-row__meta mono">{action.id}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No founder directives open" body="This queue is clear." />
                )}
              </section>

              <section className="command-card command-card--span">
                <div className="command-card__head">
                  <div>
                    <div className="eyebrow">Execution Ledger</div>
                    <h3 className="command-card__title">Queue and recovery</h3>
                  </div>
                  <StatusPill status={studio.queueDepth ? "working" : "done"}>{studio.queueDepth} live queue</StatusPill>
                </div>

                <div className="grid-2">
                  <div className="stack">
                    <SectionHeading label="Pending queue" meta={`${studio.pendingQueue.length} items`} />
                    {studio.pendingQueue.length ? (
                      <div className="data-list">
                        {studio.pendingQueue.slice(0, 3).map((item) => (
                          <div key={item.id} className="data-row">
                            <div className="data-row__top">
                              <PriorityPill priority={item.priority}>{item.priority}</PriorityPill>
                              <span className="mono muted">{item.agentId?.toUpperCase()}</span>
                            </div>
                            <div className="data-row__meta" style={{ color: "var(--text-soft)" }}>
                              {item.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState title="Queue is clear" body="No pending operations are waiting for execution." />
                    )}
                  </div>

                  <div className="stack">
                    <SectionHeading label="Recent completions" meta={`${studio.recentCompletions.length} entries`} />
                    {studio.recentCompletions.length ? (
                      <div className="data-list">
                        {studio.recentCompletions.slice(0, 3).map((item) => (
                          <div key={item.id} className="data-row">
                            <div className="data-row__top">
                              <StatusPill status={item.resolvedFromFailure ? "done" : "active"}>
                                {item.resolvedFromFailure ? "Recovered" : "Completed"}
                              </StatusPill>
                              <span className="mono muted">{item.agentId?.toUpperCase()}</span>
                            </div>
                            <div className="data-row__meta" style={{ color: "var(--text-soft)" }}>
                              {item.skill || item.task}
                            </div>
                            <div className="data-row__meta mono">{formatTimestamp(item.finishedAt || item.doneAt)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState title="No completions yet" body="Completed queue items will show up here." />
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
