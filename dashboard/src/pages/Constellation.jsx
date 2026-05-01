import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../components/StudioPrimitives.jsx";
import {
  TEAM_LAYOUT,
  STAGE_WIDTH,
  STAGE_HEIGHT,
  SUN_CENTER,
  getAgentAbsolutePosition,
  getTeamRing,
  linePath,
  orbitNodeColor,
  sunConnector,
  teamConnector,
  toStagePercent,
} from "./constellationLayout.js";

const AGENT_COPY = {
  nexus: "I keep the whole studio pointed at the highest-value move. I route pressure, decisions, and timing so the founder is never looking at noise first.",
  shepherd: "I keep the sprint honest. I translate ambition into gates, owners, and finish lines that the rest of the system can actually execute.",
  atlas: "I turn raw ideas into product shape. I make sure the feature, flow, and contract are coherent before engineering burns cycles.",
  radar: "I look for the real market gap, not the story we want to tell ourselves. I tell you where demand is sharp and where it is still fuzzy.",
  meridian: "I pressure-test whether the business should move at all. I am the one who says go, no-go, or not yet.",
  prism: "I keep the product visually and structurally consistent. I make sure the system feels intentional instead of stitched together.",
  core: "I build the backend spine. I care about data shape, API behavior, and whether the product can survive real use.",
  swift: "I turn the product into a real iPhone app people can operate quickly. I care about flow, stability, and native feel.",
  pixel: "I shape the dashboard surface that outsiders and operators actually see. I focus on clarity, hierarchy, and polish.",
  canvas: "I produce the static artifacts the product still needs to ship cleanly. I handle the pages, policy surfaces, and support content.",
  forge: "I own the infrastructure path. I make sure deploy, secrets, runtime, and environment shape do not become the hidden blocker.",
  stream: "I organize the data pipes and telemetry. I tell the rest of the system what is really moving and what only looks busy.",
  synapse: "I am the AI layer when the product needs structured intelligence. I connect model capabilities to actual product behavior.",
  beacon: "I shape the outward narrative. I turn product value into language people can notice, remember, and act on.",
  compass: "I work on discoverability. I make sure the right people can actually find the product once it deserves to be found.",
  oracle: "I keep the metrics honest. I tell you what the business is doing, not what the team hopes it is doing.",
  auditor: "I review the build with a skeptical eye before it moves forward. I am here to stop preventable quality debt from slipping through.",
  sentinel: "I run the QA gate. I am the one who proves whether the experience actually works in motion, not just in theory.",
  warden: "I watch the compliance edge. I make sure growth never outruns the rules that can break the company later.",
  relay: "I bring real feedback back into the operating loop. I surface the pain, pattern, and blocker that the team needs to hear next.",
};

const TEAM_COPY = {
  strategy: "We decide what the studio should build, why it matters, and whether the move is worth founder attention right now.",
  product: "We turn thesis into interfaces, backend behavior, and product surfaces people can actually use.",
  platform: "We keep the technical operating system alive. This plane handles runtime, data flow, and AI capability.",
  verification: "We hold the gate. Code, QA, and compliance prove the work here before it moves forward.",
  growth: "We package the product for the market. This plane owns traction, narrative, and discovery.",
  observability: "We make the system visible to itself. This plane brings back the feedback and signal the founder needs next.",
};

const VOICE_LIBRARY = {
  male: [
    "google uk english male",
    "daniel",
    "alex",
    "fred",
    "microsoft david",
    "microsoft guy",
    "thomas",
    "oliver",
    "aaron",
    "male",
  ],
  female: [
    "samantha",
    "victoria",
    "zira",
    "google us english",
    "karen",
    "fiona",
    "ava",
    "serena",
    "female",
  ],
};

const VOICE_PROFILES = {
  nexus: { gender: "male", rate: 0.92, pitch: 0.86 },
  strategy: { gender: "male", rate: 0.94, pitch: 0.9 },
  product: { gender: "female", rate: 0.97, pitch: 1.02 },
  platform: { gender: "male", rate: 0.9, pitch: 0.88 },
  verification: { gender: "female", rate: 0.95, pitch: 0.98 },
  growth: { gender: "female", rate: 0.98, pitch: 1.04 },
  observability: { gender: "male", rate: 0.93, pitch: 0.9 },
  shepherd: { gender: "male", rate: 0.93, pitch: 0.88 },
  atlas: { gender: "female", rate: 0.97, pitch: 1.02 },
  radar: { gender: "female", rate: 0.98, pitch: 1.04 },
  meridian: { gender: "male", rate: 0.91, pitch: 0.88 },
  prism: { gender: "female", rate: 0.99, pitch: 1.05 },
  core: { gender: "male", rate: 0.91, pitch: 0.87 },
  swift: { gender: "female", rate: 0.98, pitch: 1.03 },
  pixel: { gender: "female", rate: 1, pitch: 1.05 },
  canvas: { gender: "female", rate: 0.97, pitch: 1.02 },
  forge: { gender: "male", rate: 0.9, pitch: 0.86 },
  stream: { gender: "male", rate: 0.92, pitch: 0.88 },
  synapse: { gender: "female", rate: 0.96, pitch: 1.01 },
  beacon: { gender: "female", rate: 1, pitch: 1.03 },
  compass: { gender: "male", rate: 0.94, pitch: 0.9 },
  oracle: { gender: "male", rate: 0.91, pitch: 0.87 },
  auditor: { gender: "male", rate: 0.9, pitch: 0.86 },
  sentinel: { gender: "female", rate: 0.95, pitch: 0.99 },
  warden: { gender: "male", rate: 0.9, pitch: 0.86 },
  relay: { gender: "female", rate: 0.98, pitch: 1.01 },
};

function pickJarvisVoice(voices, profile) {
  if (!Array.isArray(voices) || !voices.length) return null;

  const englishVoices = voices.filter((voice) => (voice.lang || "").toLowerCase().startsWith("en"));
  const candidates = englishVoices.length ? englishVoices : voices;
  const voiceHints = VOICE_LIBRARY[profile?.gender] || VOICE_LIBRARY.male;

  for (const hint of voiceHints) {
    const match = candidates.find((voice) => (voice.name || "").toLowerCase().includes(hint));
    if (match) return match;
  }

  return candidates[0] || voices[0] || null;
}

function getVoiceProfile(selected, selectedTeam, selectedAgent) {
  if (!selected) return null;
  if (selectedAgent) return VOICE_PROFILES[selectedAgent.id] || VOICE_PROFILES[selectedAgent.team] || VOICE_PROFILES.nexus;
  if (selectedTeam) return VOICE_PROFILES[selectedTeam.id] || VOICE_PROFILES.nexus;
  return VOICE_PROFILES[selected] || VOICE_PROFILES.nexus;
}

export default function Constellation({ studio }) {
  const [selected, setSelected] = useState(null);
  const lastSpokenKeyRef = useRef(null);

  const teamIds = Object.keys(TEAM_LAYOUT);
  const teamGroups = studio.teamGroups.filter((team) => teamIds.includes(team.id));

  const agentById = useMemo(
    () => Object.fromEntries(studio.agentEntries.map((agent) => [agent.id, agent])),
    [studio.agentEntries]
  );

  const selectedAgent = selected && selected !== "nexus" ? agentById[selected] || null : null;
  const selectedTeam = selected && !selectedAgent && selected !== "nexus"
    ? teamGroups.find((team) => team.id === selected) || null
    : null;

  const infoCard = useMemo(() => {
    if (selected === "nexus") {
      return {
        title: "NEXUS",
        kicker: "Command Sun",
        body: AGENT_COPY.nexus,
      };
    }

    if (selectedAgent) {
      return {
        title: selectedAgent.name,
        kicker: selectedAgent.role,
        body:
          AGENT_COPY[selectedAgent.id] ||
          `${selectedAgent.role}. I handle this part of the system so the founder stays focused on leverage instead of noise.`,
      };
    }

    if (selectedTeam) {
      return {
        title: selectedTeam.name,
        kicker: "Team plane",
        body: TEAM_COPY[selectedTeam.id] || "This plane owns a distinct slice of studio execution.",
      };
    }

    return null;
  }, [selected, selectedAgent, selectedTeam]);

  const speechKey = selected && infoCard?.body ? `${selected}:${infoCard.body}` : null;
  const voiceProfile = useMemo(
    () => getVoiceProfile(selected, selectedTeam, selectedAgent),
    [selected, selectedAgent, selectedTeam]
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const synth = window.speechSynthesis;
    const Utterance = window.SpeechSynthesisUtterance;

    if (!synth || !Utterance) return undefined;

    if (!speechKey) {
      lastSpokenKeyRef.current = null;
      synth.cancel();
      return undefined;
    }

    if (lastSpokenKeyRef.current === speechKey) return undefined;

    lastSpokenKeyRef.current = speechKey;
    synth.cancel();

    const utterance = new Utterance(infoCard.body);
    utterance.rate = voiceProfile?.rate ?? 0.94;
    utterance.pitch = voiceProfile?.pitch ?? 0.9;
    utterance.voice = pickJarvisVoice(synth.getVoices?.() || [], voiceProfile) || null;

    synth.speak(utterance);

    return () => {
      if (lastSpokenKeyRef.current !== speechKey) {
        synth.cancel();
      }
    };
  }, [infoCard?.body, speechKey, voiceProfile]);

  if (!studio.agentEntries.length) {
    return (
      <EmptyState
        title="AI Verse unavailable"
        body="Agent memory is empty, so there is nothing to render yet."
      />
    );
  }

  return (
    <div className="verse-page" data-testid="constellation-page" onClick={() => setSelected(null)}>
      <div className="orbit-stage orbit-stage--center orbit-stage--hud">
        <svg className="orbit-grid" viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <radialGradient id="orbitCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(68, 209, 255, 0.22)" />
              <stop offset="60%" stopColor="rgba(68, 209, 255, 0.06)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </radialGradient>
          </defs>
          <circle cx={SUN_CENTER.x} cy={SUN_CENTER.y} r="308" fill="none" stroke="rgba(103,168,255,0.09)" strokeDasharray="6 24" />
          <circle cx={SUN_CENTER.x} cy={SUN_CENTER.y} r="226" fill="none" stroke="rgba(103,168,255,0.13)" strokeDasharray="10 22" />
          <circle cx={SUN_CENTER.x} cy={SUN_CENTER.y} r="138" fill="none" stroke="rgba(103,168,255,0.08)" strokeDasharray="5 16" />
          <circle cx={SUN_CENTER.x} cy={SUN_CENTER.y} r="86" fill="url(#orbitCoreGlow)" />
          <path d={`M 120 ${SUN_CENTER.y} H ${STAGE_WIDTH - 120}`} stroke="rgba(103,168,255,0.06)" />
          <path d={`M ${SUN_CENTER.x} 90 V ${STAGE_HEIGHT - 90}`} stroke="rgba(103,168,255,0.05)" />

          {teamGroups.map((team) => {
            const layout = TEAM_LAYOUT[team.id];
            return (
              <path
                key={`spoke-${team.id}`}
                d={linePath(sunConnector(layout), teamConnector(layout))}
                fill="none"
                stroke={team.color}
                strokeOpacity="0.74"
                strokeWidth="2.4"
              />
            );
          })}
        </svg>

        <button
          type="button"
          className={`orbit-node orbit-node--sun${selected === "nexus" ? " orbit-node--selected" : ""}`}
          style={toStagePercent(SUN_CENTER.x, SUN_CENTER.y)}
          onClick={(event) => {
            event.stopPropagation();
            setSelected("nexus");
          }}
        >
          <div className="orbit-node__eyebrow">Command sun</div>
          <div className="orbit-node__title orbit-node__title--sun">NEXUS</div>
          <div className="orbit-node__subtitle">Studio orchestrator</div>
        </button>

        {teamGroups.map((team) => {
          const layout = TEAM_LAYOUT[team.id];
          const ring = getTeamRing(team.agents.length);
          return (
            <div key={team.id}>
              <div
                className="orbit-team-ring"
                style={{
                  ...toStagePercent(layout.x, layout.y),
                  width: `${ring.width}px`,
                  height: `${ring.height}px`,
                  borderColor: `${team.color}24`,
                }}
              />
              <button
                type="button"
                className={`orbit-node orbit-node--team${selected === team.id ? " orbit-node--selected" : ""}`}
                style={{
                  ...toStagePercent(layout.x, layout.y),
                  borderColor: `${team.color}55`,
                  boxShadow: `0 0 28px ${team.color}12`,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected(team.id);
                }}
              >
                <div className="orbit-node__eyebrow">{team.glyph} plane</div>
                <div className="orbit-node__title" style={{ color: team.color }}>
                  {team.name}
                </div>
                <div className="orbit-node__subtitle">{team.agents.length} agents</div>
              </button>

              {team.agents.map((agent, index) => {
                const position = getAgentAbsolutePosition(layout, team.agents.length, index);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    className={`orbit-node orbit-node--agent${selected === agent.id ? " orbit-node--selected" : ""}`}
                    style={{
                      ...toStagePercent(position.x, position.y),
                      borderColor: `${orbitNodeColor(agent.status)}40`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelected(agent.id);
                    }}
                  >
                    <span
                      className="orbit-node__status-dot"
                      style={{ background: orbitNodeColor(agent.status) }}
                      aria-hidden="true"
                    />
                    <div className="orbit-node__title">{agent.name}</div>
                  </button>
                );
              })}
            </div>
          );
        })}

      </div>

      {infoCard && (
        <div className="orbit-popup-dock" onClick={(event) => event.stopPropagation()}>
          <div className="orbit-popup" data-testid="orbit-popup">
            <div className="orbit-popup__top">
              <div>
                <div className="orbit-popup__kicker">{infoCard.kicker}</div>
                <h3 className="orbit-popup__title">{infoCard.title}</h3>
              </div>
              <button
                type="button"
                className="orbit-popup__close"
                aria-label="Close popup"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected(null);
                }}
              >
                ×
              </button>
            </div>
            <p className="orbit-popup__body">{infoCard.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
