# CareLoop

> Coordinate aging parent care without the group text chaos.

Stack: Node.js 20, Fastify 4, Prisma 5, PostgreSQL (Supabase), Resend, APNs, iOS 16+ SwiftUI

Status: Phase 2 premium hardening — receiver-scoped monetization implementation in progress
Agents: ATLAS, PRISM, CORE, SWIFT, BEACON, CANVAS

⚠️  COMPLIANCE: FTC Health Breach Notification Rule applies.
    Clinic integration PERMANENTLY OFF ROADMAP (triggers HIPAA).
    AES-256 encryption required in Supabase before adding real data.
    Read docs/incident-response.md before sprint begins.

## Current Implementation

- CareLoop uses a Node.js/Fastify backend with Prisma models for users, circles, members, care receivers, receiver access, tasks, reminders, events, and receiver-scoped premium entitlements.
- The iOS app is SwiftUI on iOS 16+, with StoreKit 2 for App Store subscriptions and server-side entitlement sync.
- Premium is purchased per care receiver. It does not unlock the whole circle or caregiver seats globally.
- Free care circles support one active care receiver and one caregiver for that receiver.
- Premium care receivers unlock recurring routines, insights, unlimited caregivers, and advanced coordination for that receiver only.
- Expired or revoked Premium keeps existing care data visible and blocks only new premium-only actions.

## Focused Validation

Use the root runner from `/Users/sucheth/Downloads/nexus`:

```bash
scripts/careloop-test-runner.sh smoke
scripts/careloop-test-runner.sh backend:circles
scripts/careloop-test-runner.sh backend:payments
scripts/careloop-test-runner.sh ios:personas
scripts/careloop-test-runner.sh ios:payments
scripts/careloop-test-runner.sh docs:demo
```

The premium phase contract check is:

```bash
npm run check:careloop-premium-phase-plan
```

The demo/StoreKit readiness contract check is:

```bash
npm run check:careloop-demo-readiness
```

## Room Demo

The single-command demo launcher is available from the repo root:

```bash
npm run careloop:demo
```

It seeds four showcase circles and opens simulator sessions for organizer, caregiver, and care receiver personas:

- Aging parent support: premium yearly receiver plus proxy-active second receiver.
- Post-surgery recovery: free receiver with pending caregiver upgrade requests.
- Postpartum/newborn support: premium yearly receiver with recurring routines.
- Memory care/home safety: expired monthly Premium state with existing history still visible.

If the simulator app has not been built or installed yet, run once with:

```bash
CARELOOP_DEMO_FORCE_BUILD=1 CARELOOP_DEMO_FORCE_INSTALL=1 npm run careloop:demo
```

## Persona Demo Recordings

Generate end-to-end simulator videos for realistic app usage with:

```bash
npm run careloop:record-personas
```

The command seeds realistic reserved-domain users and care scenarios, starts/reuses the local API, runs Xcode UI journeys, and writes MP4 files under the printed `outputDir`. Current recordings cover:

- Anita Ramgiri, organizer for Ramgiri Family Care.
- Arjun Shah, caregiver for Shah New Parent Support.
- Elena Morris, care receiver for Morris Recovery Plan.
- Emma Wilson, caregiver for Wilson Memory Care.

## StoreKit Local Config

Local StoreKit products live at:

```text
projects/careloop-ios/CareLoop/Configuration/CareLoop.storekit
```

The product IDs must stay aligned with `SubscriptionManager` and App Store Connect:

- `com.careloop.ios.premium.monthly`
- `com.careloop.ios.premium.yearly`

Local fallback prices are centralized in `SubscriptionManager` and must match `CareLoop.storekit`:

- Monthly: `$4.99`
- Yearly: `$49.99`

External setup still required before production billing validation:

- App Store Connect subscription group and product creation using the exact IDs above.
- Xcode scheme StoreKit Configuration set to `CareLoop.storekit` for local purchase simulation.
- Sandbox tester accounts for physical-device/TestFlight purchase and restore validation.

Server-side App Store transaction verification is ready behind `APP_STORE_SERVER_API_ENABLED=true`. Required production/sandbox environment variables:

- `APP_STORE_SERVER_ENVIRONMENT`: `sandbox` or `production`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY`
- `APP_STORE_BUNDLE_ID`

When verification is disabled, local/demo entitlement sync keeps using product and transaction identity validation only. When enabled but misconfigured, entitlement sync fails closed instead of granting Premium.
