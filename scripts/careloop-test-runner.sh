#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/projects/careloop"
IOS_DIR="$ROOT_DIR/projects/careloop-ios"
DESTINATION="${CARELOOP_XCODE_DESTINATION:-platform=iOS Simulator,name=iPhone 17 Pro}"
XCODE_PROJECT="$IOS_DIR/CareLoop.xcodeproj"
XCODE_SCHEME="CareLoop"
DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
export DEVELOPER_DIR

usage() {
  cat <<'USAGE'
Usage:
  scripts/careloop-test-runner.sh <suite>

Suites:
  list                  Show suite names.
  smoke                 Fast pre-commit gate: backend domain + key iOS UI journeys.
  full                  Full backend + full Xcode regression.

  backend               All backend tests.
  backend:domain        Backend domain policy tests only.
  backend:auth          Signup, login, OAuth, forgot-password, session tests.
  backend:circles       Circle, invite, member, receiver lifecycle tests.
  backend:tasks         Task creation, recurrence, completion, comments, activity tests.
  backend:reminders     Reminder scheduling, snooze, escalation, delivery tests.
  backend:security      Authz/scope isolation and cross-user mutation tests.
  backend:payments      Premium entitlement and receiver paywall backend tests.
  backend:scale         50-user and multi-circle/multi-role simulations.
  docs:premium          Premium PRD/phase-plan contract check.

  ios                   Full Xcode suite.
  ios:unit              iOS unit/model tests only.
  ios:ui                All iOS UI tests only.
  ios:onboarding        Onboarding, auth contract, circle directory UI/unit tests.
  ios:personas          Organizer, caregiver, receiver home/persona UI tests.
  ios:tasks             Task board, completion, recurrence model, deep-link tests.
  ios:reminders         Reminder, snooze, escalation, push deep-link tests.
  ios:payments          StoreKit/paywall unit and UI tests.

Environment:
  CARELOOP_XCODE_DESTINATION overrides the simulator destination.
USAGE
}

run_backend_all() {
  (cd "$BACKEND_DIR" && npm test)
}

run_backend_pattern() {
  local pattern="$1"
  (cd "$BACKEND_DIR" && node --test --test-name-pattern "$pattern" test/*.test.js)
}

run_xcode() {
  xcodebuild test \
    -project "$XCODE_PROJECT" \
    -scheme "$XCODE_SCHEME" \
    -destination "$DESTINATION" \
    "$@"
}

run_ios_only() {
  local only_testing=("$@")
  local args=()
  for test_id in "${only_testing[@]}"; do
    args+=("-only-testing:$test_id")
  done
  run_xcode "${args[@]}"
}

suite="${1:-}"

case "$suite" in
  list|"")
    usage
    ;;
  smoke)
    run_backend_pattern "draft and invited receivers|accepted and proxy-active receivers|caregivers see their own tasks|active unexpired entitlement|free receivers keep a single caregiver"
    run_ios_only \
      "CareLoopUITests/CareLoopUITests/test_launchesIntoOnboardingWhenSessionIsReset" \
      "CareLoopUITests/CareLoopUITests/test_circleDirectoryShowsSeparateCreateAndJoinActions" \
      "CareLoopUITests/CareLoopUITests/test_receiverHomeShowsNextDueTaskExperience" \
      "CareLoopUITests/CareLoopUITests/test_taskDetailCanSnoozeReminder"
    ;;
  full)
    run_backend_all
    run_xcode
    ;;
  backend)
    run_backend_all
    ;;
  backend:domain)
    (cd "$BACKEND_DIR" && node --test test/domain-foundation.test.js)
    ;;
  backend:auth)
    run_backend_pattern "auth|signup|login|logout|OAuth|forgot password|reset password|pending invitations"
    ;;
  backend:circles)
    run_backend_pattern "circle|invite|invitation|member|recipient|care receiver|proxy-activate|delete"
    ;;
  backend:tasks)
    run_backend_pattern "task|recurring|recurrence|complete|completion|comment|activity|insight"
    ;;
  backend:reminders)
    run_backend_pattern "Reminder|reminder|snooze|snoozed|escalat|delivery|push reminder|digest"
    ;;
  backend:security)
    run_backend_pattern "rejects|blocks|prevents|requires|hidden|scope|non-members|cross-user|foreign circle|caregivers need"
    ;;
  backend:payments)
    run_backend_pattern "premium|entitlement|App Store|transaction|free caregiver|recurring tasks for free"
    ;;
  backend:scale)
    run_backend_pattern "50 users|multi-user|multiple circles|different roles|isolates one account"
    ;;
  docs:premium)
    (cd "$ROOT_DIR" && npm run check:careloop-premium-phase-plan)
    ;;
  ios)
    run_xcode
    ;;
  ios:unit)
    run_ios_only "CareLoopTests"
    ;;
  ios:ui)
    run_ios_only "CareLoopUITests"
    ;;
  ios:onboarding)
    run_ios_only \
      "CareLoopTests/OnboardingValidationTests" \
      "CareLoopTests/KeychainStoreTests" \
      "CareLoopTests/CircleListHeroTests" \
      "CareLoopUITests/CareLoopUITests/test_launchesIntoOnboardingWhenSessionIsReset" \
      "CareLoopUITests/CareLoopUITests/test_circleDirectoryShowsSeparateCreateAndJoinActions"
    ;;
  ios:personas)
    run_ios_only \
      "CareLoopTests/AppStateRoleTests" \
      "CareLoopTests/AppStateCircleTests" \
      "CareLoopTests/CircleHomePolicyTests" \
      "CareLoopUITests/CareLoopUITests/test_organizerHomeShowsReceiverCardsAndQuickActions" \
      "CareLoopUITests/CareLoopUITests/test_caregiverHomeShowsScopedDashboard" \
      "CareLoopUITests/CareLoopUITests/test_receiverHomeShowsNextDueTaskExperience" \
      "CareLoopUITests/CareLoopUITests/test_receiverCanCompleteNextTaskFromHome"
    ;;
  ios:tasks)
    run_ios_only \
      "CareLoopTests/TaskRecurrenceTests" \
      "CareLoopTests/TaskWorkflowPolicyTests" \
      "CareLoopTests/CareTaskTests" \
      "CareLoopUITests/CareLoopUITests/test_organizerPendingTaskDeepLinkOpensTaskBoard" \
      "CareLoopUITests/CareLoopUITests/test_receiverPendingTaskDeepLinkOpensPersonalBoard" \
      "CareLoopUITests/CareLoopUITests/test_receiverCanCompleteNextTaskFromHome"
    ;;
  ios:reminders)
    run_ios_only \
      "CareLoopTests/ReminderSchedulingTests" \
      "CareLoopTests/AppStatePushTests" \
      "CareLoopTests/PushTokenEndpointTests" \
      "CareLoopUITests/CareLoopUITests/test_taskDetailCanSnoozeReminder" \
      "CareLoopUITests/CareLoopUITests/test_pendingTaskDeepLinkWaitsForOwningCircle"
    ;;
  ios:payments)
    run_ios_only \
      "CareLoopTests/SubscriptionManagerInitialStateTests" \
      "CareLoopTests/SubscriptionManagerProductIdTests" \
      "CareLoopTests/SubscriptionManagerAccessorTests" \
      "CareLoopTests/PaywallDisclosureTextTests" \
      "CareLoopTests/CareRecipientPremiumTests" \
      "CareLoopUITests/CareLoopUITests/test_organizerCanOpenReceiverPremiumPaywall" \
      "CareLoopUITests/CareLoopUITests/test_insightsLockFreeReceiverBehindPremiumUpgrade"
    ;;
  *)
    echo "Unknown suite: $suite" >&2
    echo >&2
    usage >&2
    exit 64
    ;;
esac
