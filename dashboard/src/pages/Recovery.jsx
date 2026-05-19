import { useMemo, useState } from "react";
import { RecoverySnapshotDetail } from "../components/recovery/RecoverySnapshotDetail.jsx";
import { RecoverySnapshotList } from "../components/recovery/RecoverySnapshotList.jsx";
import { buildRecoveryPreviewViewModel } from "../utils/recoveryPreview.js";

export default function Recovery() {
  const viewModel = useMemo(() => buildRecoveryPreviewViewModel(), []);
  const [selectedKey, setSelectedKey] = useState(viewModel.selectedSnapshot?.listKey || "");
  const selectedSnapshot = viewModel.snapshots.find((snapshot) => snapshot.listKey === selectedKey) || viewModel.selectedSnapshot;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={viewModel.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{viewModel.pageTitle}</div>
          <div className="ccv2-page-head__sub">
            Inspection-only AI interaction snapshots with redacted recovery posture and disabled recovery actions.
          </div>
        </div>

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row">
            <span className="ccv2-page-summary-label">Current state</span>
            <span className="ccv2-page-summary-value">{viewModel.currentState}</span>
          </div>
          <div className="ccv2-page-summary-row">
            <span className="ccv2-page-summary-label">Next action</span>
            <span className="ccv2-page-summary-value">{viewModel.nextAction}</span>
          </div>
          <div className="ccv2-page-summary-row">
            <span className="ccv2-page-summary-label">Owner</span>
            <span className="ccv2-page-summary-value">{viewModel.ownerAgent} · {viewModel.ownerCapability}</span>
          </div>
          <div className="ccv2-page-summary-row">
            <span className="ccv2-page-summary-label">Project context</span>
            <span className="ccv2-page-summary-value">No project selected</span>
          </div>
          <div className="ccv2-page-summary-row">
            <span className="ccv2-page-summary-label">Evidence</span>
            <span className="ccv2-page-summary-value">{viewModel.evidenceLocation}</span>
          </div>
          <div className="ccv2-page-summary-row">
            <span className="ccv2-page-summary-label">Cost impact</span>
            <span className="ccv2-page-summary-value">{viewModel.costImpact}</span>
          </div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>
          {viewModel.blockers.join(" ")}
        </div>

        <div className="ccv2-grid ccv2-grid--2" style={{ marginTop: 16 }}>
          {viewModel.selfHealingReadiness.map((card) => (
            <article className="ccv2-card" key={card.title}>
              <div className="ccv2-section-heading">{card.title}</div>
              <div className="ccv2-chip-row">
                <span className="ccv2-pill ccv2-pill--preview">{card.stateLabel}</span>
                <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
              </div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Failure class</span><span className="ccv2-page-summary-value">{card.failureClass}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{card.currentState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Proposed recovery</span><span className="ccv2-page-summary-value">{card.proposedRecovery}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{card.disabledReason}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{card.ownerCapability}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{card.evidenceLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{card.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{card.costImpact}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{card.nextAction}</span></div>
              </div>
              <div className="ccv2-info-banner" style={{ marginTop: 12 }}>{card.blocker}</div>
            </article>
          ))}
        </div>

        {viewModel.snapshots.length === 0 ? (
          <div className="ccv2-empty-state" style={{ marginTop: 16 }}>
            <div className="ccv2-section-heading">{viewModel.emptyState.title}</div>
            <div style={{ marginTop: 8 }}>{viewModel.emptyState.body}</div>
          </div>
        ) : (
          <>
            <RecoverySnapshotList
              snapshots={viewModel.snapshots}
              selectedKey={selectedSnapshot?.listKey}
              onSelectSnapshot={setSelectedKey}
            />
            <RecoverySnapshotDetail
              snapshot={selectedSnapshot}
              disabledActions={viewModel.disabledActions}
            />
          </>
        )}
      </div>
    </div>
  );
}
