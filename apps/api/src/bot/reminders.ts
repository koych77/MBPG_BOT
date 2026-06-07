import { env } from "../env.js";
import { prisma } from "../prisma.js";
import { bot } from "./index.js";

let processing = false;

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

export function startReminderWorker() {
  void processDueReminders();
  setInterval(() => {
    void processDueReminders();
  }, 60_000);
}
