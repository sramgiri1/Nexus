import cron from "node-cron";
import { logEvent } from "../lib/roles.js";
import { sendDailyDigest, sendReminderNotifications } from "../lib/push.js";

const DIGEST_HOUR = parseInt(process.env.DAILY_DIGEST_HOUR || "18", 10);
const ESCALATION_MINUTES = parseInt(process.env.REMINDER_ESCALATION_MINUTES || "15", 10);

function userLocalParts(date, timezone) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

async function processPendingReminders(db) {
  const reminders = await db.reminder.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: new Date() },
    },
    include: {
      task: {
        include: {
          circle: true,
        },
      },
    },
  });

  for (const reminder of reminders) {
    const targetUserId = reminder.task.assigneeId || reminder.task.creatorId;
    const deliveries = await sendReminderNotifications({
      db,
      task: reminder.task,
      type: "reminder",
      userIds: [targetUserId],
    });
    const failed = deliveries.some((delivery) => !delivery.delivered && !delivery.simulated);
    const status = failed ? "FAILED" : "SENT";
    await db.reminder.update({
      where: { id: reminder.id },
      data: {
        status,
        sentAt: new Date(),
      },
    });
    await logEvent(db, {
      type: "REMINDER_SENT",
      circleId: reminder.task.circleId,
      actorId: reminder.task.creatorId,
      payload: { taskId: reminder.taskId, status, deliveries },
    });
  }
}

async function processEscalations(db) {
  const cutoff = new Date(Date.now() - ESCALATION_MINUTES * 60 * 1000);
  const reminders = await db.reminder.findMany({
    where: {
      status: "SENT",
      sentAt: { lte: cutoff },
      task: { status: { not: "DONE" } },
    },
    include: {
      task: {
        include: {
          circle: {
            include: {
              members: true,
            },
          },
        },
      },
    },
  });

  for (const reminder of reminders) {
    const userIds = reminder.task.circle.members.map((member) => member.userId);
    const deliveries = await sendReminderNotifications({
      db,
      task: reminder.task,
      type: "escalation",
      userIds,
    });
    const failed = deliveries.some((delivery) => !delivery.delivered && !delivery.simulated);
    const status = failed ? "FAILED" : "ESCALATED";
    await db.reminder.update({
      where: { id: reminder.id },
      data: {
        status,
        escalatedAt: new Date(),
      },
    });
    await logEvent(db, {
      type: "REMINDER_ESCALATED",
      circleId: reminder.task.circleId,
      actorId: reminder.task.creatorId,
      payload: { taskId: reminder.taskId, status, deliveries },
    });
  }
}

async function processDigests(db) {
  const users = await db.user.findMany({
    where: {
      timezone: { not: null },
    },
  });

  for (const user of users) {
    const timezone = user.timezone;
    if (!timezone) continue;
    const now = userLocalParts(new Date(), timezone);
    if (now.hour !== DIGEST_HOUR) continue;

    const existing = await db.digestLog.findUnique({
      where: { userId_date: { userId: user.id, date: now.date } },
    });
    if (existing) continue;

    const memberships = await db.circleMember.findMany({
      where: { userId: user.id },
      include: { circle: true },
    });
    const circleIds = memberships.map((membership) => membership.circleId);
    if (circleIds.length === 0) continue;

    const [dueToday, overdue, completedToday] = await Promise.all([
      db.task.findMany({
        where: {
          circleId: { in: circleIds },
          dueAt: { not: null },
          status: { not: "DONE" },
        },
        orderBy: { dueAt: "asc" },
      }),
      db.task.findMany({
        where: {
          circleId: { in: circleIds },
          dueAt: { not: null, lt: new Date() },
          status: { not: "DONE" },
        },
        orderBy: { dueAt: "asc" },
      }),
      db.task.findMany({
        where: {
          circleId: { in: circleIds },
          status: "DONE",
          updatedAt: { gte: new Date(`${now.date}T00:00:00Z`) },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const digestResult = await sendDailyDigest({
      user,
      digestDate: now.date,
      dueToday,
      overdue,
      completedToday,
    });

    if (!digestResult.delivered && !digestResult.simulated) continue;

    await db.digestLog.create({
      data: {
        userId: user.id,
        date: now.date,
        messageId: digestResult.messageId ?? null,
      },
    });

    if (memberships[0]?.circleId) {
      await logEvent(db, {
        type: "DIGEST_SENT",
        circleId: memberships[0].circleId,
        actorId: user.id,
        payload: { date: now.date, messageId: digestResult.messageId ?? null, simulated: Boolean(digestResult.simulated) },
      });
    }
  }
}

export function startScheduler(db, logger = console) {
  if (process.env.DISABLE_SCHEDULER === "true") {
    logger.info?.("CareLoop scheduler disabled via DISABLE_SCHEDULER=true");
    return { stop() {} };
  }

  const jobs = [
    cron.schedule("* * * * *", async () => {
      try {
        await processPendingReminders(db);
      } catch (error) {
        logger.error?.({ error }, "processPendingReminders failed");
      }
    }),
    cron.schedule("* * * * *", async () => {
      try {
        await processEscalations(db);
      } catch (error) {
        logger.error?.({ error }, "processEscalations failed");
      }
    }),
    cron.schedule("* * * * *", async () => {
      try {
        await processDigests(db);
      } catch (error) {
        logger.error?.({ error }, "processDigests failed");
      }
    }),
  ];

  logger.info?.("CareLoop scheduler started");
  return {
    stop() {
      jobs.forEach((job) => job.stop());
    },
  };
}
