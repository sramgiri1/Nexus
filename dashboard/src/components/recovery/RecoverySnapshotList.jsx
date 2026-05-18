export function RecoverySnapshotList({ snapshots = [], selectedKey, onSelectSnapshot }) {
  if (snapshots.length === 0) {
    return (
      <div className="ccv2-empty-state">
        No recovery snapshots are available.
      </div>
    );
  }

  return (
    <div className="ccv2-card-grid">
      {snapshots.map((snapshot) => {
        const selected = snapshot.listKey === selectedKey;
        return (
          <button
            key={snapshot.listKey}
            type="button"
            className="ccv2-card"
            onClick={() => onSelectSnapshot?.(snapshot.listKey)}
            style={{
              textAlign: "left",
              borderColor: selected ? "var(--v2-accent)" : "var(--v2-border)",
              cursor: "pointer",
            }}
          >
            <div className="ccv2-card-kicker">{snapshot.scope}</div>
            <div className="ccv2-card-title">{snapshot.title}</div>
            <div className="ccv2-card-meta">{snapshot.timestampLabel}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <span className="ccv2-pill ccv2-pill--disabled">{snapshot.redaction}</span>
              <span className="ccv2-pill">{snapshot.retention}</span>
              <span className="ccv2-pill">{snapshot.recoveryPosture}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
