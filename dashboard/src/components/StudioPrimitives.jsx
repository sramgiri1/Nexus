import { PRIORITY_META, STATUS_META } from "../data/studio.js";

function clsx(...values) {
  return values.filter(Boolean).join(" ");
}

export function Panel({
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
  children,
  className,
  contentClassName,
}) {
  return (
    <section className={clsx("panel", className)}>
      {(eyebrow || title || subtitle || meta || actions) && (
        <header className="panel__header">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h3 className="panel__title">{title}</h3>}
            {subtitle && <p className="panel__subtitle">{subtitle}</p>}
          </div>
          {(meta || actions) && (
            <div className="panel__header-side">
              {meta}
              {actions}
            </div>
          )}
        </header>
      )}
      <div className={clsx("panel__content", contentClassName)}>{children}</div>
    </section>
  );
}

export function MetricTile({ label, value, meta, tone = "blue", className }) {
  return (
    <div className={clsx("metric-tile", `tone-${tone}`, className)}>
      <div className="metric-tile__label">{label}</div>
      <div className="metric-tile__value">{value}</div>
      {meta && <div className="metric-tile__meta">{meta}</div>}
    </div>
  );
}

export function StatusPill({ status, children }) {
  const meta = STATUS_META[status] || STATUS_META.idle;
  return <span className={clsx("pill", `pill--${meta.tone}`)}>{children || meta.label}</span>;
}

export function PriorityPill({ priority, children }) {
  const meta = PRIORITY_META[(priority || "").toLowerCase()] || PRIORITY_META.low;
  return <span className={clsx("pill", `pill--${meta.tone}`)}>{children || meta.label}</span>;
}

export function ProgressBar({ value = 0, max = 100, tone = "blue", label }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <div className="progress-wrap">
      {label && <div className="progress-wrap__label">{label}</div>}
      <div className="progress-bar">
        <div className={clsx("progress-bar__fill", `tone-${tone}`)} style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-wrap__value">{pct}%</div>
    </div>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="empty-state">
      <div className="empty-state__title">{title}</div>
      {body && <div className="empty-state__body">{body}</div>}
    </div>
  );
}

export function SectionHeading({ label, meta }) {
  return (
    <div className="section-heading">
      <span>{label}</span>
      {meta && <span>{meta}</span>}
    </div>
  );
}

export function formatTimestamp(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

export function formatRelative(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 1) return "just now";
  if (Math.abs(diffMin) < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}
