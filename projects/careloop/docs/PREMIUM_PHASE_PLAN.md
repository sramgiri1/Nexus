# CareLoop Premium Phase Plan

**Status:** Active implementation contract for receiver-scoped premium implementation.
**Branch:** `codex/careloop-premium-phases`
**Updated:** 2026-05-17

This plan turns the locked PRD decisions into small implementation phases. Each phase must update automated tests, focused suite metadata, demo data when relevant, Nexus project status, and git before the next phase begins.

## Locked Premium Decisions

- Premium is purchased per care receiver, not per Care Circle and not per caregiver seat.
- A free Care Circle supports exactly one active care receiver.
- Adding a second care receiver triggers an upgrade choice sheet before the add form opens.
- If the organizer declines that upgrade prompt, return to the previous screen with no draft receiver.
- Care Organizers see receiver plan state on the circle dashboard and in Care Receiver Management.
- Compact receiver cards use an icon-only visual premium/free indicator with full accessibility labels.
- Care Receivers see only their own premium/free badge and no billing controls.
- Caregivers may view premium value and pricing context but cannot purchase.
- Caregivers can send an in-app `Ask organizer to upgrade` request.
- Caregiver upgrade requests appear only in Care Receiver Management.
- Upgrade requests are informational only; purchase remains a deliberate organizer action.
- Multiple caregiver requests collapse into one row per receiver with count and latest requester.
- Upgrade requests auto-dismiss after 7 days.
- Each caregiver can request premium once per receiver lifetime.
- Expired or failed premium keeps existing data visible and blocks only new premium actions.

## Phase P1: Premium Decisions And Contracts

**Status:** Complete.

**Goal:** Make premium scope and implementation phases explicit for agents, tests, and Command Center before behavior changes.

**Deliverables**

- Update PRD monetization and roadmap sections with the locked receiver-scoped decisions.
- Add this Nexus-readable implementation plan.
- Update CareLoop project status and roadmap metadata so Command Center shows the premium phase.
- Add a docs validation check for the premium plan and PRD decisions.
- Add premium-plan test suite metadata so Nexus can recommend the right checks.

**Tests**

- `npm run check:careloop-premium-phase-plan`
- `node scripts/check-project-test-suites.js`
- `node scripts/check-test-selection-preview.js`
- `git diff --check`

## Phase P2: Receiver Plan Visibility

**Status:** Complete.

**Goal:** Make plan state obvious without turning billing into dashboard clutter.

**Deliverables**

- Added icon-only premium/free status to dashboard receiver cards with accessibility labels.
- Added plan status and upgrade action to Care Receiver Management.
- Kept Care Receiver persona limited to badge-only visibility.
- Kept Caregiver persona without billing controls.
- Dashboard receiver summaries now include inactive/invited receivers so plan state is visible before activation.

**Tests**

- `scripts/careloop-test-runner.sh ios:personas`
- `scripts/careloop-test-runner.sh ios:payments`

## Phase P3: Add Second Receiver Gate

**Status:** Complete.

**Goal:** Enforce the free-tier receiver limit at the first honest decision point.

**Deliverables**

- Backend blocks a second free receiver unless the caller provides the premium add-receiver intent.
- iOS shows a choice sheet when `Add Care Receiver` is tapped after the free receiver already exists.
- Declining the prompt keeps the user in Care Receiver Management with no draft receiver.
- Choosing upgrade opens the receiver add form with receiver-scoped premium intent.

**Tests**

- `scripts/careloop-test-runner.sh backend:circles`
- `scripts/careloop-test-runner.sh ios:personas`

## Phase P4: Caregiver Upgrade Request

**Status:** Next.

**Goal:** Let caregivers signal premium need without giving them billing authority.

**Deliverables**

- Add backend model/API for caregiver premium requests.
- Enforce one request per caregiver per receiver lifetime.
- Auto-expire visible request summaries after 7 days.
- Add caregiver locked-feature state with `Ask organizer to upgrade` and `View plans`.
- Ensure caregivers never see a purchase CTA.

**Tests**

- Backend tests for request create, duplicate block, collapsed summary, and expiry.
- UI tests for caregiver request CTA, sent state, and no purchase CTA.

## Phase P5: Organizer Request Visibility

**Goal:** Surface upgrade demand where organizers manage receiver access and plans.

**Deliverables**

- Show collapsed upgrade request rows in Care Receiver Management.
- One row per receiver, with request count and latest requester.
- Request rows are informational and do not purchase directly.

**Tests**

- Backend test for request summary shape.
- UI test for organizer seeing request count.
- UI test proving tapping request does not purchase.

## Phase P6: Purchase Success And Management UX

**Goal:** Make payment completion trustworthy and receiver-specific.

**Deliverables**

- Add success screen after purchase with receiver-only scope, unlocked features, and renewal/trial details.
- Add `Continue` and `Manage plan` actions.
- Add receiver-specific premium management screen.
- Improve restore, expired, billing failure, retry, and downgrade states.

**Tests**

- UI tests for paywall to success to continue.
- UI tests for manage plan.
- Unit tests for expired and billing-failed rendering.

## Phase P7: Premium Enforcement Sweep

**Goal:** Make all premium gates consistent and server-backed.

**Deliverables**

- Enforce premium for additional care receivers, unlimited caregivers, recurring tasks, and premium insights.
- Preserve visibility of existing data after expiry.
- Block only new premium actions when entitlement is absent or expired.

**Tests**

- Backend entitlement tests for every gated operation.
- UI locked-state regression tests.
- Downgrade regression test proving existing data remains visible.

## Phase P8: Demo And StoreKit Hardening

**Goal:** Make the investor/demo path and sandbox billing path representative.

**Deliverables**

- Update the single-command demo seed with free, premium, expired, and request-pending receivers.
- Update the room launcher profile set to include premium management moments.
- Add StoreKit configuration and simulator purchase tests where possible.
- Document remaining App Store Connect, sandbox tester, and physical-device requirements.

**Tests**

- `npm run careloop:demo`
- StoreKit simulator tests where local config is available.
- Physical-device checklist for App Store sandbox purchase/restore.

## Phase Completion Rule

Every phase must end with:

- focused automated tests passing
- relevant smoke suite passing
- PRD/status/demo docs updated
- commit and push to the active branch
