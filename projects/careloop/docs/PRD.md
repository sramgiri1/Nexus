# CareLoop — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Bundle ID:** com.careloop.ios  
**Compliance:** FTC Health Breach Notification Rule  
**Clinic Integration:** PERMANENTLY OFF ROADMAP

---

## 1. Product Vision

CareLoop eliminates the chaos of coordinating aging parent care across a family. Instead of fragmented group texts, missed tasks, and duplicated effort, CareLoop gives every caregiver in a family a shared, real-time view of what needs to happen and who is doing it.

**One sentence:** Coordinate aging parent care without the group text chaos.

---

## 2. Problem

Adult children caring for an aging parent face a coordination problem, not a care problem:
- Tasks fall through the cracks because no one knows who did what
- Group texts get ignored or lost in noise
- Siblings feel unequal burden without visibility
- No single source of truth for the care recipient's status

---

## 3. User Personas

### Primary — The Coordinator (Admin)
- Adult child (35–55), typically the one who lives closest
- Manages most day-to-day care tasks
- Frustrated by having to chase siblings for updates
- Wants accountability without conflict

### Secondary — The Remote Sibling (Member)
- Lives further away, contributes less but wants to help
- Feels guilty, wants visibility
- Checks in periodically, needs clear tasks with deadlines

### Care Recipient
- Aging parent (65+)
- Not a direct app user — represented in the circle by name

---

## 4. Core Features

### 4.1 Care Circles
- A Care Circle is a group of caregivers coordinating for one recipient
- Each circle has: a name, a recipient name, and a list of members
- Members have roles: **Admin** (full control) or **Member** (task execution)
- Users join a circle via invite ID shared by the Admin

### 4.2 Task Management
- Tasks have: title, notes, due date, priority (Low / Normal / High / Urgent), status, assignee
- Status flow: `PENDING → IN_PROGRESS → DONE` (or `SKIPPED`)
- Any member can create tasks; Admin can assign to any member
- Overdue tasks are highlighted in red

### 4.3 Reminder Escalation
- When a task has a due date, a reminder is created 15 minutes before
- If the task is not marked done within 15 minutes of the reminder, it escalates
- Escalation: push notification to all circle members
- Channel priority: Push → Email

### 4.4 Daily Digest
- Every day at **6pm local time**, each member receives a summary via Resend email
- Digest includes: tasks due today, overdue tasks, tasks completed today, who did what
- Format: clean HTML email, no images

### 4.5 Push Notifications
- Task reminders (15 min before due)
- Escalation alerts (task overdue)
- Task assignment notifications
- Requires APNs (Apple Push Notification service) — gated on Apple Developer account

---

## 5. API Contract

**Base URL (dev):** `http://localhost:3000`  
**Base URL (prod):** TBD — pending deployment  
**Auth:** `x-api-key` header required on all endpoints except `/health`

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users` | Create a user |
| `GET` | `/users/:id` | Get user + circle memberships |
| `PATCH` | `/users/:id/push-token` | Register APNs push token |

**POST /users body:**
```json
{ "email": "string", "name": "string", "phone": "string?" }
```

### Care Circles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/circles` | Create a care circle |
| `GET` | `/circles/:id` | Get circle with members and tasks |
| `POST` | `/circles/:id/members` | Add a member to a circle |

**POST /circles body:**
```json
{ "name": "string", "recipientName": "string" }
```

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/circles/:circleId/tasks` | Create a task |
| `GET` | `/circles/:circleId/tasks` | List tasks (ordered by dueAt) |
| `PATCH` | `/circles/:circleId/tasks/:taskId` | Update task (status, assignee, etc.) |

**POST /circles/:circleId/tasks body:**
```json
{
  "title": "string",
  "notes": "string?",
  "dueAt": "ISO8601?",
  "priority": "LOW | NORMAL | HIGH | URGENT",
  "creatorId": "string",
  "assigneeId": "string?"
}
```

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/circles/:circleId/events` | Activity log for a circle |

---

## 6. Data Model (Summary)

```
User → CircleMember → CareCircle
CareCircle → Task → Reminder
CareCircle → Event
```

Key constraints:
- A user can belong to multiple circles
- A circle has exactly one recipient (by name, not a User record)
- Health data is NOT stored — only task metadata (FTC compliance)
- No clinic integration, no medical records, no diagnosis data

---

## 7. iOS App (SwiftUI, iOS 16+)

### Screens
1. **Onboarding** — name, email, circle ID to join
2. **Task List** — all tasks for active circle, pull-to-refresh, tap to complete
3. **New Task** — title, notes, due date picker, priority selector
4. **Settings** — account info, circle info, circle ID to share, sign out

### Navigation
- Tab bar: Tasks | Settings
- Sheet: New Task (modal)

---

## 8. Success Metrics

| Metric | Target (Day 30) |
|--------|----------------|
| Care circles created | 10 |
| Tasks created per circle per week | 5+ |
| Task completion rate | >70% |
| Daily digest open rate | >40% |
| D7 retention | >50% |
| Reminder escalations triggered | <20% of tasks (low = good coordination) |

---

## 9. Out of Scope (Sprint 1)

- Clinic / EHR integration — **PERMANENTLY OFF** (triggers HIPAA)
- Medication tracking
- In-app payments
- Android
- Web app
- AI features (Sprint 2+)

---

## 10. Open Questions

- [ ] How do new members get the circle ID? (v1: Admin copies and shares manually)
- [ ] Do we support multiple care recipients per circle? (v1: No — one per circle)
- [ ] Digest delivery: Resend template or plain HTML? (Decision: plain HTML)
