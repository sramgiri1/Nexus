#!/usr/bin/env node
// scripts/sprint.js
// Enqueue all tasks for a sprint in the correct dependency order.
// Tasks within the same phase run in parallel. Each phase waits for the previous.
//
// Usage:
//   node scripts/sprint.js 2            # enqueue Sprint 2
//   node scripts/sprint.js 2 --dry-run  # print the task graph without enqueueing

import "dotenv/config";
import fs   from "fs/promises";
import path from "path";

const ROOT       = process.cwd();
const QUEUE_FILE = path.join(ROOT, "memory", "task-queue.json");

const [,, sprintArg, flag] = process.argv;
const DRY_RUN = flag === "--dry-run";
const sprint  = parseInt(sprintArg);

if (!sprint || sprint < 1 || sprint > 3) {
  console.error("Usage: node scripts/sprint.js <1|2|3> [--dry-run]");
  process.exit(1);
}

// ─── Gate phase helpers ───────────────────────────────────────────────────────
// Skill tasks bypass Claude — the loop executes them directly.
const AUDITOR_GATE = (sprintN) => ({
  label: `Phase — AUDITOR code review gate`,
  tasks: [
    { agentId: "auditor", type: "skill", skill: "code.diff_review",   priority: "critical", input: { project: "careloop" }, task: "code.diff_review" },
    { agentId: "auditor", type: "skill", skill: "code.lint",           priority: "critical", input: { project: "careloop" }, task: "code.lint" },
    { agentId: "auditor", type: "skill", skill: "code.static_analysis",priority: "high",     input: { project: "careloop" }, task: "code.static_analysis" },
    { agentId: "auditor", type: "skill", skill: "code.test_coverage",  priority: "high",     input: { project: "careloop" }, task: "code.test_coverage" },
  ],
});

const SENTINEL_QA_GATE = () => ({
  label: `Phase — SENTINEL automated QA gate`,
  tasks: [
    { agentId: "sentinel", type: "skill", skill: "qa.security.scan",   priority: "critical", input: { project: "careloop" }, task: "qa.security.scan" },
    { agentId: "sentinel", type: "skill", skill: "qa.simulator.run",   priority: "high",     input: { device: "iPhone 16" }, task: "qa.simulator.run" },
    { agentId: "sentinel", type: "skill", skill: "qa.tests.execute",   priority: "high",     input: { scheme: "CareLoop", destination: "iPhone 16" }, task: "qa.tests.execute" },
  ],
});

const WARDEN_GATE = () => ({
  label: `Phase — WARDEN compliance gate`,
  tasks: [
    { agentId: "warden", type: "skill", skill: "compliance.privacy.check",        priority: "high", input: { project: "careloop" }, task: "compliance.privacy.check" },
    { agentId: "warden", type: "skill", skill: "compliance.permissions.validate", priority: "high", input: { project: "careloop" }, task: "compliance.permissions.validate" },
  ],
});

// ─── Sprint Definitions ───────────────────────────────────────────────────────
// Each sprint is an array of phases.
// Tasks within a phase run in parallel.
// Phase N+1 tasks have dependsOn set to all task IDs from phase N.

const SPRINTS = {

  // ── Sprint 1 ─────────────────────────────────────────────────────────────
  // Sprint 1 is mostly complete. Use this to run any remaining tasks or re-run
  // if something needs to be regenerated from scratch.
  1: {
    description: "Core Coordination Complete",
    project: "careloop",
    phases: [
      {
        label: "Product scope",
        tasks: [
          {
            agentId:  "atlas",
            priority: "critical",
            task: "Read projects/careloop/docs/PRD.md and sprint-plan.md. Confirm Sprint 1 scope is locked and all API contracts match what is implemented in projects/careloop/src/routes/. Write a one-page Sprint 1 scope confirmation to projects/careloop/docs/sprint1-scope-confirmed.md listing: what is built, what matches the PRD, and any gaps.",
          },
        ],
      },
      {
        label: "QA and sign-off",
        tasks: [
          {
            agentId:  "sentinel",
            priority: "high",
            task: "Read projects/careloop/docs/sprint-plan.md Sprint 1 exit criteria. Read the existing API routes in projects/careloop/src/routes/. Write the complete Sprint 1 QA checklist to projects/careloop/docs/qa/checklist-sprint1.md covering: onboarding (create + join circle), task CRUD, role boundaries (member vs admin), session restore, HTTP error codes. Include curl commands for every API-level test.",
          },
        ],
      },
    ],
  },

  // ── Sprint 2 ─────────────────────────────────────────────────────────────
  2: {
    description: "Reminders, Digests, Push",
    project: "careloop",
    phases: [
      {
        label: "Phase 1 — Scope review",
        tasks: [
          {
            agentId:  "atlas",
            priority: "critical",
            task: "Read projects/careloop/docs/sprint-plan.md Sprint 2 section and PRD.md. Confirm the Sprint 2 API contracts: (1) PATCH /users/:id/push-token already exists in users.js — verify; (2) no new public endpoints needed for scheduler (backend-only); (3) DigestLog.messageId migration needed. Write Sprint 2 contracts and open questions to projects/careloop/docs/sprint2-contracts.md. Be concise.",
          },
          {
            agentId:  "forge",
            priority: "high",
            task: "Read projects/careloop/.env.example. Write a Sprint 2 infrastructure runbook to projects/careloop/docs/sprint2-infra.md covering: (1) step-by-step APNs Auth Key setup in Apple Developer portal, (2) exact Railway env vars to add: APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY, RESEND_API_KEY, DAILY_DIGEST_HOUR=18, REMINDER_ESCALATION_MINUTES=15, (3) how to verify Resend key is working, (4) Railway deploy checklist for Sprint 2.",
          },
        ],
      },
      {
        label: "Phase 2 — Backend + iOS in parallel",
        tasks: [
          {
            agentId:  "core",
            priority: "critical",
            task: `Build Sprint 2 CareLoop backend. First read these files: projects/careloop/src/index.js, src/routes/users.js, src/routes/tasks.js, prisma/schema.prisma.

Implement ALL of the following:

1. SCHEDULER — create src/scheduler/index.js using node-cron:
   - Reminder loop (runs every minute): find all Reminders with status=PENDING and scheduledAt <= now. For each: call sendPush(userId, taskId, 'reminder'). Update Reminder.status=SENT, sentAt=now. Log REMINDER_SENT event.
   - Escalation loop (runs every minute): find Reminders with status=SENT, sentAt <= (now - 15min), and task.status != DONE. For each: call sendPush(userId, taskId, 'escalation'). Update Reminder.status=ESCALATED, escalatedAt=now. Log REMINDER_ESCALATED event.
   - Digest loop (runs every minute): for each User with a timezone, check if local hour == DAILY_DIGEST_HOUR (default 18). Use DigestLog to ensure one send per user per YYYY-MM-DD. Build HTML digest (due today, overdue, completed today). Send via Resend. Write DigestLog row. Log DIGEST_SENT event.

2. APNS SENDER — create src/lib/push.js:
   - sendPush(userId, taskId, type) function: look up user.pushToken from DB. If no token, log and return (email fallback is manual for Sprint 2). Use node-apn or https module to send to APNs sandbox/production endpoint. Payload: { aps: { alert: { title, body } }, taskId }.
   - Use env vars APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY.

3. SCHEMA — add messageId String? to DigestLog in prisma/schema.prisma.

4. Wire scheduler into src/index.js — import and start after server starts.

Write all files. Install node-apn if needed (add to package.json dependencies).`,
          },
          {
            agentId:  "swift",
            priority: "critical",
            task: `Build Sprint 2 CareLoop iOS push notification features. First read: projects/careloop-ios/CareLoop/App/CareLoopApp.swift, App/AppState.swift, Network/Endpoints.swift.

Implement ALL of the following:

1. PERMISSION REQUEST — create Views/Notifications/NotificationPermissionView.swift:
   - A sheet that explains why notifications are useful ("Get reminded before tasks are due")
   - Single CTA "Turn on reminders"
   - On tap: call UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
   - Show this sheet from CirclesView the first time a task with a dueAt is created (use @AppStorage("askedForPush") to ensure shown only once)

2. DEVICE TOKEN REGISTRATION — in CareLoopApp.swift:
   - Call UIApplication.shared.registerForRemoteNotifications() after permission is granted
   - Add AppDelegate with application(_:didRegisterForRemoteNotificationsWithDeviceToken:)
   - Convert token Data to hex string
   - Call APIClient.shared.updatePushToken(userId: user.id, pushToken: tokenString)

3. ENDPOINTS — add to Network/Endpoints.swift:
   func updatePushToken(userId: String, pushToken: String) async throws -> CareUser

4. FOREGROUND NOTIFICATIONS — add UNUserNotificationCenterDelegate in AppDelegate:
   - userNotificationCenter(_:willPresent:) → return [.banner, .sound]

5. DEEP LINK — handle notification tap in AppDelegate:
   - userNotificationCenter(_:didReceive:) → extract taskId from userInfo
   - Set a @Published var pendingTaskId: String? on AppState
   - CirclesView observes this and navigates to the task

Write all new and modified files to projects/careloop-ios/CareLoop/.`,
          },
        ],
      },
      AUDITOR_GATE(2),
      SENTINEL_QA_GATE(),
      WARDEN_GATE(),
      {
        label: "Phase 3 — QA checklist",
        tasks: [
          {
            agentId:  "sentinel",
            priority: "high",
            task: "Read projects/careloop/docs/sprint-plan.md Sprint 2 exit criteria. Write the complete Sprint 2 QA checklist to projects/careloop/docs/qa/checklist-sprint2.md. Cover: (1) reminder creation — task with dueAt creates Reminder at dueAt-15m; (2) reminder send — Reminder.status=SENT, sentAt populated at correct time; (3) escalation — task still PENDING at sentAt+15m triggers ESCALATED; (4) done-before-escalation — completing task before sentAt+15m suppresses escalation; (5) digest send — DigestLog row created, one per user per YYYY-MM-DD; (6) digest idempotency — second attempt same local day does not send; (7) no push token — fallback logged, no crash; (8) push token registration — PATCH /users/:id/push-token returns updated user; (9) foreground push — banner shown when app is open; (10) push tap deep link — navigates to correct task. Include curl commands for all backend-level tests.",
          },
        ],
      },
    ],
  },

  // ── Sprint 3 ─────────────────────────────────────────────────────────────
  3: {
    description: "Public Launch Hardening",
    project: "careloop",
    phases: [
      {
        label: "Phase 1 — Auth contracts + compliance",
        tasks: [
          {
            agentId:  "atlas",
            priority: "critical",
            task: "Read projects/careloop/docs/sprint-plan.md Sprint 3 section and tech-stack.md. Define Sprint 3 API contract changes: (1) auth header changes from x-api-key to Authorization: Bearer <jwt>, (2) new invite endpoints POST /circles/:id/invites and POST /invites/redeem, (3) membership enforcement on GET endpoints, (4) GET /users/:id becomes self-only. Write to projects/careloop/docs/sprint3-contracts.md.",
          },
          {
            agentId:  "warden",
            priority: "critical",
            task: "Read projects/careloop/docs/privacy.html and sprint-plan.md Sprint 3 section. Write the incident response plan to projects/careloop/docs/incident-response.md. Cover: detection, containment (rotate API keys, revoke tokens), assessment (scope, PHR-identifiable?), notification (FTC Health Breach Rule — 60 days, FTC notification, 500+ users = state media), recovery, post-mortem. Also review privacy.html for completeness — add data retention and third-party service sections if missing.",
          },
        ],
      },
      {
        label: "Phase 2 — Auth implementation",
        tasks: [
          {
            agentId:  "core",
            priority: "critical",
            task: "Read projects/careloop/src/plugins/auth.js, src/index.js, prisma/schema.prisma, docs/sprint3-contracts.md. Implement Sprint 3 auth: (1) update src/plugins/auth.js to validate Supabase JWT bearer tokens using the Supabase JWT secret (env var SUPABASE_JWT_SECRET) — keep x-api-key support behind a flag for gradual migration; (2) add User.authUserId String? @unique to schema.prisma and create migration; (3) add POST /circles/:id/invites (admin-only, creates a signed invite token with circleId + expiry); (4) add POST /invites/redeem (authenticated, validates token, creates CircleMember); (5) enforce membership check on GET /circles/:id, GET /circles/:circleId/tasks, GET /circles/:circleId/events. Write all files.",
          },
          {
            agentId:  "forge",
            priority: "high",
            task: "Read projects/careloop/docs/sprint3-contracts.md. Write Sprint 3 infrastructure runbook to projects/careloop/docs/sprint3-infra.md covering: (1) Supabase careloop-prod project setup and Auth configuration, (2) SUPABASE_JWT_SECRET env var in Railway, (3) authUserId migration deploy steps for production, (4) Apple Developer account — App ID, provisioning profiles, TestFlight setup, (5) App Store Connect app creation checklist, (6) production environment separation audit.",
          },
        ],
      },
      {
        label: "Phase 3 — iOS auth + marketing",
        tasks: [
          {
            agentId:  "swift",
            priority: "critical",
            task: "Read projects/careloop-ios/CareLoop/App/AppState.swift, Network/APIClient.swift, Network/Endpoints.swift, Views/Onboarding/OnboardingView.swift. Implement Sprint 3 iOS auth: (1) create Views/Auth/SignInView.swift — email input, send magic link CTA, confirmation state (check your email); (2) update CareLoopApp.swift to show SignInView for unauthenticated users (no stored session); (3) update APIClient to send Authorization: Bearer <jwt> header instead of x-api-key once Supabase session exists; (4) create Views/Invites/InviteRedemptionView.swift — shown when app opens from an invite deep link, shows circle name, Join CTA; (5) add member management to MemberListView — admin swipe actions for Promote, Demote, Remove with confirmation. Write all files.",
          },
          {
            agentId:  "beacon",
            priority: "normal",
            task: "Read projects/careloop/docs/PRD.md and agents/beacon.md. Write complete App Store metadata to projects/careloop/docs/marketing/app-store.md: app name (max 30 chars), subtitle (max 30 chars), promotional text (max 170 chars), full description (max 4000 chars), six screenshot headlines with subtext. Follow the brand voice guidelines in beacon.md — warm, direct, no medical language. Do not claim HIPAA compliance.",
          },
        ],
      },
      AUDITOR_GATE(3),
      SENTINEL_QA_GATE(),
      WARDEN_GATE(),
      {
        label: "Phase 4 — QA checklist + App Store compliance",
        tasks: [
          {
            agentId:  "sentinel",
            priority: "critical",
            task: "Read projects/careloop/docs/sprint-plan.md Sprint 3 exit criteria. Write Sprint 3 QA checklist to projects/careloop/docs/qa/checklist-sprint3.md covering: (1) unauthenticated requests fail (401); (2) non-member reads fail (403) on all GET endpoints; (3) invite creation (admin-only, returns token); (4) invite redemption works once only (second redeem = 409); (5) removed member loses access immediately; (6) JWT auth end-to-end from iOS sign-in to task completion; (7) production smoke test checklist (sign-in → join circle via invite → create task → receive reminder → complete task); (8) full regression on simulator and physical device. Also write the release readiness checklist to projects/careloop/docs/release-checklist.md.",
          },
        ],
      },
      {
        label: "Phase 5 — App Store metadata gate",
        tasks: [
          { agentId: "warden", type: "skill", skill: "compliance.appstore.check", priority: "critical", input: { project: "careloop" }, task: "compliance.appstore.check" },
        ],
      },
    ],
  },
};

// ─── Enqueueing logic ─────────────────────────────────────────────────────────

async function main() {
  const def = SPRINTS[sprint];
  if (!def) {
    console.error(`No sprint definition found for sprint ${sprint}`);
    process.exit(1);
  }

  console.log(`\n📋 Sprint ${sprint} — ${def.description}`);
  console.log(`   Project: ${def.project}`);
  console.log(`   Phases: ${def.phases.length}`);

  // Build all tasks with IDs upfront so we can wire dependsOn
  const phases = def.phases.map((phase, i) => ({
    ...phase,
    tasks: phase.tasks.map(t => ({
      id:        `sprint${sprint}-${t.agentId}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      agentId:   t.agentId,
      task:      t.task || `${t.agentId}.${t.skill}`,  // skill tasks use skill name as task label
      ...(t.type  ? { type:  t.type  } : {}),
      ...(t.skill ? { skill: t.skill } : {}),
      ...(t.input ? { input: t.input } : {}),
      projectId: def.project,
      priority:  t.priority || "normal",
      context:   {},
      createdAt: new Date().toISOString(),
      status:    "pending",
      dependsOn: [],
      sprint:    sprint,
      phase:     i + 1,
    }))
  }));

  // Wire dependsOn: each task depends on all tasks from all previous phases
  for (let i = 1; i < phases.length; i++) {
    const prevIds = phases.slice(0, i).flatMap(p => p.tasks.map(t => t.id));
    for (const task of phases[i].tasks) {
      task.dependsOn = prevIds;
    }
  }

  // Print the plan
  console.log();
  for (const phase of phases) {
    console.log(`  Phase ${phase.tasks[0].phase} — ${phase.label}`);
    for (const t of phase.tasks) {
      const typeTag = t.type === "skill" ? ` [SKILL:${t.skill}]` : "";
      const preview = t.type === "skill" ? t.skill : t.task.slice(0, 60);
      console.log(`    [${t.priority.toUpperCase()}] ${t.agentId.toUpperCase()}${typeTag} — ${preview}`);
      if (t.dependsOn.length) console.log(`      depends on: ${t.dependsOn.length} task(s) from previous phase`);
    }
    console.log();
  }

  if (DRY_RUN) {
    console.log("  Dry run — nothing enqueued. Remove --dry-run to proceed.\n");
    return;
  }

  // Enqueue all tasks
  const allTasks = phases.flatMap(p => p.tasks);
  const queue    = JSON.parse(await fs.readFile(QUEUE_FILE, "utf8"));

  // Priority sort order
  const order = { critical: 0, high: 1, normal: 2, low: 3 };

  for (const t of allTasks) {
    queue.queue.push(t);
  }

  queue.queue.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));
  queue.lastUpdated = new Date().toISOString();
  await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2));

  console.log(`  ✓ Enqueued ${allTasks.length} tasks across ${phases.length} phases`);
  console.log(`  ✓ Start the loop:  npm run orchestrator`);
  console.log(`  ✓ Watch status:    npm run status`);
  console.log();
}

main().catch(e => { console.error(e.message); process.exit(1); });
