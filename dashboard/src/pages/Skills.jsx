import { useMemo, useState } from "react";
import { SKILL_CATALOG } from "../data/studio.js";
import {
  EmptyState,
  MetricTile,
  Panel,
  SectionHeading,
  StatusPill,
  formatTimestamp,
} from "../components/StudioPrimitives.jsx";

function defaultInputForSkill(skillId) {
  if (skillId.startsWith("qa.") || skillId.startsWith("compliance.")) {
    return { project: "careloop" };
  }
  return {};
}

async function callSkill(agent, skill, input = {}) {
  const response = await fetch("/api/skill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, skill, input }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.summary || `Skill API failed with ${response.status}`);
  }
  return data;
}

function ResultSummary({ result }) {
  if (!result) return null;

  return (
    <div className="result-box">
      <div className="button-row" style={{ marginBottom: 8 }}>
        <StatusPill status={result.result === "FAIL" ? "blocked" : result.result === "WARN" ? "working" : "done"}>
          {result.result}
        </StatusPill>
      </div>
      <div style={{ color: "var(--text-soft)" }}>{result.summary}</div>
      {result.issues?.length ? (
        <div className="stack" style={{ marginTop: 10 }}>
          {result.issues.slice(0, 4).map((issue, index) => (
            <div key={`${issue.message}-${index}`} className="data-row">
              <div className="data-row__meta" style={{ color: issue.severity === "error" ? "var(--red)" : "var(--amber)" }}>
                {issue.message}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {result.data ? <pre style={{ marginTop: 10 }}>{JSON.stringify(result.data, null, 2)}</pre> : null}
    </div>
  );
}

export default function Skills({ studio }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState({});
  const [history, setHistory] = useState([]);

  const sessionMetrics = useMemo(() => {
    const entries = history.slice(0, 20);
    const passCount = entries.filter((entry) => entry.result === "PASS").length;
    const failCount = entries.filter((entry) => entry.result === "FAIL").length;
    return {
      total: entries.length,
      passCount,
      failCount,
    };
  }, [history]);

  async function runSkill(agentId, skillId) {
    const key = `${agentId}:${skillId}`;
    setRunning((current) => ({ ...current, [key]: true }));
    try {
      const result = await callSkill(agentId, skillId, defaultInputForSkill(skillId));
      setResults((current) => ({ ...current, [key]: result }));
      setHistory((current) => [
        {
          id: `${key}:${Date.now()}`,
          key,
          agentId,
          skillId,
          result: result.result,
          summary: result.summary,
          at: new Date().toISOString(),
        },
        ...current,
      ]);
    } catch (error) {
      const failure = {
        result: "FAIL",
        summary: error.message,
        issues: [{ severity: "error", message: error.message }],
        data: null,
      };
      setResults((current) => ({ ...current, [key]: failure }));
      setHistory((current) => [
        {
          id: `${key}:${Date.now()}`,
          key,
          agentId,
          skillId,
          result: "FAIL",
          summary: error.message,
          at: new Date().toISOString(),
        },
        ...current,
      ]);
    } finally {
      setRunning((current) => ({ ...current, [key]: false }));
    }
  }

  async function runBundle(bundle) {
    for (const item of bundle) {
      // eslint-disable-next-line no-await-in-loop
      await runSkill(item.agent, item.skill);
    }
  }

  const activeProject = studio.activeProject?.name || "CareLoop";

  return (
    <div className="page" data-testid="skills-page">
      <div className="page-head">
        <div className="page-head__body">
          <div className="eyebrow">Execution console</div>
          <h2 className="page-head__title">Skills</h2>
          <p className="page-head__summary">
            This is the live operator surface for running gate skills, diagnostics, and control actions against the
            same memory-backed system investors see everywhere else.
          </p>
        </div>
        <div className="page-head__meta">
          <StatusPill status="active">{SKILL_CATALOG.length} skill groups</StatusPill>
          <StatusPill status={sessionMetrics.failCount ? "blocked" : "done"}>
            {sessionMetrics.failCount ? `${sessionMetrics.failCount} failing this session` : "Session healthy"}
          </StatusPill>
        </div>
      </div>

      <div className="metric-grid">
        <MetricTile label="Skill Library" value={SKILL_CATALOG.reduce((sum, group) => sum + group.skills.length, 0)} meta="Callable from dashboard or CLI" tone="blue" />
        <MetricTile label="Session Passes" value={sessionMetrics.passCount} meta={`${sessionMetrics.total} total executions tracked`} tone="green" />
        <MetricTile label="Session Fails" value={sessionMetrics.failCount} meta="Non-passing runs stay visible in the ledger" tone={sessionMetrics.failCount ? "red" : "amber"} />
        <MetricTile label="Target Project" value={activeProject} meta="Compliance and QA skills default to CareLoop inputs" tone="purple" />
      </div>

      <div className="skills-layout">
        <div className="stack">
          <Panel
            eyebrow="Gate Bundles"
            title="Operator presets"
            subtitle="Run the important parts of the system the way a release manager would: as linked decision bundles."
          >
            <div className="button-row">
              <button
                className="button button--primary"
                onClick={() =>
                  runBundle([
                    { agent: "auditor", skill: "code.diff_review" },
                    { agent: "sentinel", skill: "qa.tests.execute" },
                    { agent: "warden", skill: "compliance.privacy.check" },
                  ])
                }
              >
                Release readiness stack
              </button>
              <button
                className="button"
                onClick={() =>
                  runBundle([
                    { agent: "sentinel", skill: "qa.simulator.run" },
                    { agent: "sentinel", skill: "qa.tests.execute" },
                    { agent: "sentinel", skill: "qa.logs.analyze" },
                  ])
                }
              >
                QA gate
              </button>
              <button className="button button--ghost" onClick={() => runSkill("nexus", "read.system_state")}>
                Read system state
              </button>
            </div>
          </Panel>

          <Panel eyebrow="Skill Matrix" title="Agent skillbooks" subtitle="Every skill remains individually callable, with the latest result stored beside it.">
            <div className="skills-grid">
              {SKILL_CATALOG.map((group) => (
                <div key={group.agent} className="team-card">
                  <div className="team-card__head">
                    <div>
                      <div className="eyebrow">{group.team}</div>
                      <div className="team-card__name">{group.title}</div>
                      <div className="muted" style={{ marginTop: 4 }}>{group.role}</div>
                    </div>
                    <StatusPill status={studio.agentEntries.find((agent) => agent.id === group.agent)?.status || "idle"} />
                  </div>
                  <div className="skills-grid">
                    {group.skills.map((skill) => {
                      const key = `${group.agent}:${skill.id}`;
                      return (
                        <div key={skill.id} className="skill-card">
                          <div className="skill-card__top">
                            <div>
                              <div className="skill-card__title">{skill.label}</div>
                              <div className="skill-card__desc">{skill.desc}</div>
                            </div>
                            <button
                              className={`button${running[key] ? "" : " button--primary"}`}
                              onClick={() => runSkill(group.agent, skill.id)}
                              disabled={running[key]}
                            >
                              {running[key] ? "Running…" : "Run"}
                            </button>
                          </div>
                          <ResultSummary result={results[key]} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="stack">
          <Panel eyebrow="Session Ledger" title="Recent runs" subtitle="Results from this browser session, ordered most recent first.">
            {history.length ? (
              <div className="ledger-list">
                {history.slice(0, 12).map((entry) => (
                  <div key={entry.id} className="ledger-item">
                    <div className="data-row__top">
                      <div className="data-row__title">
                        {entry.agentId.toUpperCase()} · {entry.skillId}
                      </div>
                      <StatusPill status={entry.result === "FAIL" ? "blocked" : "done"}>{entry.result}</StatusPill>
                    </div>
                    <div className="data-row__meta" style={{ marginTop: 8 }}>{entry.summary}</div>
                    <div className="data-row__meta mono" style={{ marginTop: 8 }}>{formatTimestamp(entry.at)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No skill runs yet" body="Trigger a bundle or an individual skill to start the session ledger." />
            )}
          </Panel>

          <Panel eyebrow="CLI Bridge" title="Equivalent commands" subtitle="The dashboard and terminal operate on the same underlying skills.">
            <div className="data-list">
              {SKILL_CATALOG.flatMap((group) =>
                group.skills.slice(0, 2).map((skill) => (
                  <div key={`${group.agent}-${skill.id}`} className="data-row">
                    <div className="data-row__title mono">npm run skill {group.agent} {skill.id}</div>
                    <div className="data-row__meta">{skill.label}</div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
