import { env } from "../env.js";
import { prisma } from "../prisma.js";
import { bot } from "./index.js";

let processing = false;
let processingBroadcasts = false;

export async function processDueReminders() {
  if (processing) return;
  processing = true;
  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        projectKey: env.projectKey,
        status: "SCHEDULED",
        dueAt: { lte: new Date() }
      },
      include: { client: true },
      orderBy: { dueAt: "asc" },
      take: 25
    });

    for (const reminder of reminders) {
      try {
        await bot.api.sendMessage(reminder.client.telegramId.toString(), reminder.message);
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "SENT", sentAt: new Date(), error: null }
        });
      } catch (error) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "FAILED", error: error instanceof Error ? error.message : "Unknown Telegram error" }
        });
      }
    }
  } finally {
    processing = false;
  }
}

async function findBroadcastRecipients(broadcast: { audience: string; direction: string | null; branch: string | null }) {
  const baseWhere = { projectKey: env.projectKey };
  if (broadcast.audience === "active") {
    return prisma.client.findMany({
      where: { ...baseWhere, enrollments: { some: { status: "ACTIVE" } } },
      orderBy: { updatedAt: "desc" }
    });
  }
  if (broadcast.audience === "low_balance") {
    const clients = await prisma.client.findMany({
      where: { ...baseWhere, enrollments: { some: { status: "ACTIVE" } } },
      include: { enrollments: { where: { status: "ACTIVE" } } },
      orderBy: { updatedAt: "desc" }
    });
    return clients.filter((client) => client.enrollments.some((enrollment) => enrollment.totalLessons - enrollment.usedLessons <= 2));
  }
  if (broadcast.audience === "no_schedule") {
    return prisma.client.findMany({
      where: {
        ...baseWhere,
        enrollments: { some: { status: "ACTIVE" } },
        lessons: { none: { startsAt: { gte: new Date() }, status: "SCHEDULED" } }
      },
      orderBy: { updatedAt: "desc" }
    });
  }
  if (broadcast.audience === "direction" && broadcast.direction) {
    return prisma.client.findMany({
      where: {
        ...baseWhere,
        OR: [
          { leads: { some: { direction: broadcast.direction } } },
          { enrollments: { some: { direction: broadcast.direction } } }
        ]
      },
      orderBy: { updatedAt: "desc" }
    });
  }
  if (broadcast.audience === "branch" && broadcast.branch) {
    return prisma.client.findMany({
      where: {
        ...baseWhere,
        OR: [
          { leads: { some: { branch: broadcast.branch } } },
          { enrollments: { some: { branch: broadcast.branch } } },
          { lessons: { some: { branch: broadcast.branch } } }
        ]
      },
      orderBy: { updatedAt: "desc" }
    });
  }
  return prisma.client.findMany({
    where: baseWhere,
    orderBy: { updatedAt: "desc" }
  });
}

export async function processDueBroadcasts() {
  if (processingBroadcasts) return;
  processingBroadcasts = true;
  try {
    const broadcasts = await prisma.broadcast.findMany({
      where: {
        projectKey: env.projectKey,
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() }
      },
      orderBy: { scheduledAt: "asc" },
      take: 5
    });

    for (const broadcast of broadcasts) {
      await prisma.broadcast.update({ where: { id: broadcast.id }, data: { status: "SENDING" } });
      const clients = await findBroadcastRecipients(broadcast);
      let sentCount = 0;
      let failedCount = 0;
      for (const client of clients) {
        try {
          await bot.api.sendMessage(client.telegramId.toString(), broadcast.message);
          sentCount += 1;
          await prisma.notificationLog.create({
            data: {
              projectKey: env.projectKey,
              clientId: client.id,
              telegramId: client.telegramId,
              audience: "client",
              type: `broadcast_${broadcast.type}`,
              title: broadcast.title,
              message: broadcast.message,
              status: "SENT",
              relatedModel: "Broadcast",
              relatedId: broadcast.id
            }
          });
        } catch (error) {
          failedCount += 1;
          await prisma.notificationLog.create({
            data: {
              projectKey: env.projectKey,
              clientId: client.id,
              telegramId: client.telegramId,
              audience: "client",
              type: `broadcast_${broadcast.type}`,
              title: broadcast.title,
              message: broadcast.message,
              status: "FAILED",
              error: error instanceof Error ? error.message : "Unknown Telegram error",
              relatedModel: "Broadcast",
              relatedId: broadcast.id
            }
          });
        }
      }
      await prisma.broadcast.update({
        where: { id: broadcast.id },
        data: { status: "SENT", sentCount, failedCount, sentAt: new Date() }
      });
    }
  } finally {
    processingBroadcasts = false;
  }
}

export function startReminderWorker() {
  void processDueReminders();
  void processDueBroadcasts();
  setInterval(() => {
    void processDueReminders();
    void processDueBroadcasts();
  }, 60_000);
}
