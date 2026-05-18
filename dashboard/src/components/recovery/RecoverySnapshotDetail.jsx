function DetailRow({ label, value }) {
  return (
    <div className="ccv2-page-summary-row">
      <span className="ccv2-page-summary-label">{label}</span>
      <span className="ccv2-page-summary-value">{value}</span>
    </div>
  );
}

export function RecoverySnapshotDetail({ snapshot, disabledActions = [] }) {
  if (!snapshot) {
    return (
      <div className="ccv2-card">
        <div className="ccv2-empty-state">Select a redacted recovery snapshot to inspect details.</div>
      </div>
    );
  }

  return (
    <div className="ccv2-card">
      <div className="ccv2-section-heading">Snapshot Detail</div>
      <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
        <DetailRow label="Current state" value={snapshot.recoveryPosture} />
        <DetailRow label="Next action" value={snapshot.nextAction} />
        <DetailRow label="Owner" value={`${snapshot.ownerAgent} · ${snapshot.ownerCapability}`} />
        <DetailRow label="Evidence" value={snapshot.evidenceLocation} />
        <DetailRow label="Activity" value={snapshot.activityLocation} />
        <DetailRow label="Cost impact" value={snapshot.costImpact} />
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="ccv2-section-heading">Blockers</div>
        <div className="ccv2-list" style={{ marginTop: 10 }}>
          {snapshot.blockers.map((blocker) => (
            <div key={blocker} className="ccv2-list-row">
              <span className="ccv2-pill ccv2-pill--disabled">Blocked</span>
              <span>{blocker}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="ccv2-section-heading">Disabled Action Preview</div>
        <div className="ccv2-card-grid" style={{ marginTop: 10 }}>
          {disabledActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="ccv2-card"
              aria-label={`Disabled action: ${action.label}`}
              disabled
              style={{ textAlign: "left", opacity: 0.72, cursor: "not-allowed" }}
            >
              <span className="ccv2-list-row__title">{action.label}</span>
              <span className="ccv2-list-row__meta" style={{ display: "block", marginTop: 8 }}>{action.reason}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
