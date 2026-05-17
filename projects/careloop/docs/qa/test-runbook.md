# CareLoop Test Runbook

Date: 2026-05-17

Use `scripts/careloop-test-runner.sh` from the repo root. The runner groups existing backend, iOS unit, and iOS UI tests so agents can run the smallest useful suite instead of always running the full regression.

## Gates

| When | Suite | Command |
| --- | --- | --- |
| Every code change before commit | Smoke | `scripts/careloop-test-runner.sh smoke` |
| Backend-only change | Backend focused suite | `scripts/careloop-test-runner.sh backend:<area>` |
| iOS view/model-only change | iOS focused suite | `scripts/careloop-test-runner.sh ios:<area>` |
| End of phase | Full regression | `scripts/careloop-test-runner.sh full` |
| Release candidate | Full regression plus manual/device matrix | `scripts/careloop-test-runner.sh full` and `testability-matrix.md` |

## Backend Suites

| Suite | Purpose |
| --- | --- |
| `backend` | Runs all backend tests. |
| `backend:domain` | Pure domain rules: receiver activation, task visibility, premium limits. |
| `backend:auth` | Signup, login, logout, OAuth, forgot password, token/session behavior. |
| `backend:circles` | Create circle, invite, accept/decline/expire invites, member/receiver management, delete. |
| `backend:tasks` | Task create/edit/complete, recurrence, comments, activity, insights. |
| `backend:reminders` | Reminder creation, snooze, escalation, push/email/digest delivery simulation. |
| `backend:security` | Scope isolation, cross-user mutation protection, blocked unauthorized flows. |
| `backend:payments` | Premium entitlement sync, free limits, premium-gated capabilities. |
| `backend:scale` | 50-user simulation and multi-circle/multi-role isolation. |

## iOS Suites

| Suite | Purpose |
| --- | --- |
| `ios` | Runs the full Xcode suite. |
| `ios:unit` | Runs iOS unit/model tests only. |
| `ios:ui` | Runs all iOS UI tests only. |
| `ios:onboarding` | Onboarding, auth validation, keychain, circle directory. |
| `ios:personas` | Organizer, caregiver, care receiver dashboards and role switching. |
| `ios:tasks` | Task board, personal task board, recurrence model, completion flow. |
| `ios:reminders` | Reminder scheduling model, push deep-link state, snooze UI. |
| `ios:payments` | Paywall, StoreKit metadata, premium disclosure, premium locks. |

## Current Critical Journey Coverage

| Journey | Automated suites |
| --- | --- |
| Sign in / create account contract | `backend:auth`, `ios:onboarding` |
| Group list -> create/join -> group hub | `backend:circles`, `ios:onboarding`, `ios:personas` |
| Invite member / invite care receiver | `backend:circles`, `ios:personas` |
| Create recurring task -> complete -> next occurrence | `backend:tasks`, focused iOS UI tests for premium recurring creation and next occurrence |
| Reminder -> snooze -> escalation -> deep link | `backend:reminders`, `ios:reminders` |
| 50 dummy users / real-user simulation | `backend:scale` |
| One user across multiple circles in different roles | `backend:scale`, `ios:personas` |
| Delete circle/member/receiver scenarios | `backend:circles`; UI delete coverage remains in `testability-matrix.md` backlog |

## Notes

- Override simulator destination with `CARELOOP_XCODE_DESTINATION`, for example `CARELOOP_XCODE_DESTINATION="platform=iOS Simulator,name=iPhone 17 Pro"`.
- Physical-device only coverage still includes APNs delivery, real universal links, Sign in with Apple entitlement validation, and StoreKit sandbox purchase/restore.
- New phases must update this runbook and `testability-matrix.md` when adding or moving coverage.
