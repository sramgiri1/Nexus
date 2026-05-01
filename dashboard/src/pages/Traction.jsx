import { useEffect, useMemo, useState } from "react";
import { DEFAULT_TRACTION } from "../data/studio.js";
import {
  MetricTile,
  Panel,
  ProgressBar,
  StatusPill,
} from "../components/StudioPrimitives.jsx";

const STORAGE_KEY = "nexus-traction-v2";

function loadModel() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TRACTION;
  } catch {
    return DEFAULT_TRACTION;
  }
}

function saveModel(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore local persistence failures
  }
}

function tractionScore(app) {
  const entries = Object.values(app.traction);
  const done = entries.filter((entry) => entry.value >= entry.target).length;
  return Math.round((done / Math.max(1, entries.length)) * 100);
}

function calcProjection(app) {
  const downloads = app.projection.monthly_downloads || [];
  const conversion = (app.projection.conversion_rate || 0) / 100;
  const churn = (app.projection.churn_rate || 0) / 100;
  const price = app.economics.price_mo || 0;
  let paying = 0;

  return downloads.map((monthDownloads, index) => {
    const newPaying = Math.round(monthDownloads * conversion);
    paying = Math.round(paying * (1 - churn) + newPaying);
    return {
      month: index + 1,
      downloads: monthDownloads,
      paying,
      mrr: Math.round(paying * price),
    };
  });
}

function calcEconomics(app) {
  const price = app.economics.price_mo || 0;
  const tenure = app.economics.avg_tenure || 0;
  const cac = app.economics.cac_paid || 0;
  const support = app.economics.support_cost_mo || 0;
  const infra = app.economics.infra_cost_per_user || 0;
  const ltv = Math.round(price * tenure);
  const margin = price ? Math.round(((price - support - infra) / price) * 100) : 0;
  const ratio = cac ? (ltv / cac).toFixed(1) : "∞";
  return { ltv, margin, ratio };
}

function NumberField({ value, onChange, disabled, step = 1 }) {
  return (
    <input
      className="input mono"
      type="number"
      value={value}
      step={step}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

export default function Traction({ studio }) {
  const [model, setModel] = useState(DEFAULT_TRACTION);
  const [editable, setEditable] = useState(false);

  useEffect(() => {
    setModel(loadModel());
  }, []);

  useEffect(() => {
    saveModel(model);
  }, [model]);

  const activeKey = model.activeApp;
  const activeApp = model.apps[activeKey];
  const score = tractionScore(activeApp);
  const projection = calcProjection(activeApp);
  const economics = calcEconomics(activeApp);
  const liveProject = studio.projects.find((project) => project.id === activeKey);

  function patchApp(section, key, value) {
    setModel((current) => ({
      ...current,
      apps: {
        ...current.apps,
        [current.activeApp]: {
          ...current.apps[current.activeApp],
          [section]: {
            ...current.apps[current.activeApp][section],
            [key]: value,
          },
        },
      },
    }));
  }

  function patchTractionMetric(metricKey, field, value) {
    setModel((current) => ({
      ...current,
      apps: {
        ...current.apps,
        [current.activeApp]: {
          ...current.apps[current.activeApp],
          traction: {
            ...current.apps[current.activeApp].traction,
            [metricKey]: {
              ...current.apps[current.activeApp].traction[metricKey],
              [field]: value,
            },
          },
        },
      },
    }));
  }

  const arr = projection[11] ? projection[11].mrr * 12 : 0;

  return (
    <div className="page" data-testid="traction-page">
      <div className="page-head">
        <div className="page-head__body">
          <div className="eyebrow">Investor traction room</div>
          <h2 className="page-head__title">Traction</h2>
          <p className="page-head__summary">
            A live investor module for proof, economics, and ramp assumptions. Portfolio memory shows what is real
            now; this model shows what the business can become.
          </p>
        </div>
        <div className="page-head__meta">
          <StatusPill status={score >= 60 ? "done" : "working"}>{score}% readiness</StatusPill>
          <button className={`button${editable ? " button--primary" : " button--ghost"}`} onClick={() => setEditable((value) => !value)}>
            {editable ? "Editing enabled" : "View mode"}
          </button>
        </div>
      </div>

      <div className="button-row">
        {Object.entries(model.apps).map(([appKey, app]) => (
          <button
            key={appKey}
            className={`button${model.activeApp === appKey ? " button--primary" : ""}`}
            onClick={() => setModel((current) => ({ ...current, activeApp: appKey }))}
          >
            {app.name}
          </button>
        ))}
      </div>

      <div className="metric-grid">
        <MetricTile label="Traction Score" value={`${score}%`} meta={activeApp.interviewsInsight} tone="blue" />
        <MetricTile label="Year 1 ARR" value={`$${arr.toLocaleString()}`} meta="Model-based annualized revenue at month 12" tone="green" />
        <MetricTile label="LTV : CAC" value={`${economics.ratio}:1`} meta={`LTV $${economics.ltv.toLocaleString()} · margin ${economics.margin}%`} tone="amber" />
        <MetricTile label="Price Point" value={`$${activeApp.economics.price_mo}/mo`} meta={`$${activeApp.economics.price_yr}/yr option`} tone="purple" />
      </div>

      <div className="traction-layout">
        <div className="stack">
          <Panel eyebrow="Proof Stack" title={`${activeApp.name} traction proof`} subtitle="The milestones investors will ask you to defend first.">
            <div className="traction-table">
              {Object.entries(activeApp.traction).map(([metricKey, metric]) => (
                <div key={metricKey} className="traction-row">
                  <div>
                    <div className="data-row__title">{metric.label}</div>
                    <div className="data-row__meta">{metric.value >= metric.target ? "Target hit" : "Still in progress"}</div>
                  </div>
                  <NumberField value={metric.value} onChange={(value) => patchTractionMetric(metricKey, "value", value)} disabled={!editable} />
                  <NumberField value={metric.target} onChange={(value) => patchTractionMetric(metricKey, "target", value)} disabled={!editable} />
                  <ProgressBar value={metric.value} max={metric.target} tone={metric.value >= metric.target ? "green" : "blue"} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Revenue Ramp" title="Projection surface" subtitle="Simple enough to edit, serious enough to talk through in a room.">
            <div className="forecast-grid">
              {projection.slice(0, 6).map((month) => (
                <div key={month.month} className="forecast-card">
                  <div className="forecast-card__month">Month {month.month}</div>
                  <div className="forecast-card__mrr tone-green">${month.mrr.toLocaleString()}</div>
                  <div className="data-row__meta">{month.paying.toLocaleString()} paying users · {month.downloads.toLocaleString()} downloads</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Evidence" title="Investor narrative" subtitle="This is the line you should be able to speak without searching for it.">
            <div className="data-row">
              <div className="data-row__title">Core insight</div>
              <div className="data-row__meta" style={{ color: "var(--text-soft)" }}>{activeApp.interviewsInsight}</div>
            </div>
            {liveProject ? (
              <div className="data-row">
                <div className="data-row__title">Live portfolio state</div>
                <div className="data-row__meta">{liveProject.notes}</div>
              </div>
            ) : null}
          </Panel>
        </div>

        <div className="stack">
          <Panel eyebrow="Economics" title="Editable business model" subtitle="These assumptions are editable and persist locally in the browser.">
            <div className="data-list">
              <div className="data-row">
                <div className="data-row__title">Monthly price</div>
                <NumberField value={activeApp.economics.price_mo} onChange={(value) => patchApp("economics", "price_mo", value)} disabled={!editable} step={0.01} />
              </div>
              <div className="data-row">
                <div className="data-row__title">Annual price</div>
                <NumberField value={activeApp.economics.price_yr} onChange={(value) => patchApp("economics", "price_yr", value)} disabled={!editable} step={0.01} />
              </div>
              <div className="data-row">
                <div className="data-row__title">Avg tenure (months)</div>
                <NumberField value={activeApp.economics.avg_tenure} onChange={(value) => patchApp("economics", "avg_tenure", value)} disabled={!editable} />
              </div>
              <div className="data-row">
                <div className="data-row__title">Paid CAC</div>
                <NumberField value={activeApp.economics.cac_paid} onChange={(value) => patchApp("economics", "cac_paid", value)} disabled={!editable} />
              </div>
              <div className="data-row">
                <div className="data-row__title">Support cost / month</div>
                <NumberField value={activeApp.economics.support_cost_mo} onChange={(value) => patchApp("economics", "support_cost_mo", value)} disabled={!editable} step={0.1} />
              </div>
              <div className="data-row">
                <div className="data-row__title">Infra cost / user</div>
                <NumberField value={activeApp.economics.infra_cost_per_user} onChange={(value) => patchApp("economics", "infra_cost_per_user", value)} disabled={!editable} step={0.1} />
              </div>
              <div className="data-row">
                <div className="data-row__title">Conversion rate %</div>
                <NumberField value={activeApp.projection.conversion_rate} onChange={(value) => patchApp("projection", "conversion_rate", value)} disabled={!editable} />
              </div>
              <div className="data-row">
                <div className="data-row__title">Monthly churn %</div>
                <NumberField value={activeApp.projection.churn_rate} onChange={(value) => patchApp("projection", "churn_rate", value)} disabled={!editable} />
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Live Portfolio" title="Current operating truth" subtitle="These values come directly from the live venture memory, not the local investor model.">
            {liveProject ? (
              <div className="data-list">
                <div className="data-row">
                  <div className="data-row__top">
                    <div className="data-row__title">{liveProject.name}</div>
                    <StatusPill status={liveProject.stage === "sprint" ? "active" : "working"}>{liveProject.stage}</StatusPill>
                  </div>
                  <div className="data-row__meta">{liveProject.tagline}</div>
                </div>
                <div className="data-row">
                  <div className="data-row__title">Gate</div>
                  <div className="metric-tile__value tone-blue">{liveProject.gate}</div>
                  <div className="data-row__meta">Portfolio score {liveProject.score}/50</div>
                </div>
                <div className="data-row">
                  <div className="data-row__title">Interviews</div>
                  <div className="metric-tile__value tone-green">
                    {liveProject.interviews}/{liveProject.interviewTarget}
                  </div>
                  <div className="data-row__meta">Waitlist {liveProject.waitlist} · MRR ${liveProject.mrr}</div>
                </div>
              </div>
            ) : (
              <div className="data-row">
                <div className="data-row__meta">No matching live project exists in portfolio memory for this model.</div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
