import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import type { Express } from "express";
import { env } from "../env.js";
import { prisma } from "../prisma.js";

export const bot = new Bot(env.botToken);
const webhookPath = "/telegram/webhook";

bot.command("start", async (ctx) => {
  const from = ctx.from;
  let isFirstStart = false;
  if (from) {
    const existingClient = await prisma.client.findUnique({
      where: {
        projectKey_telegramId: {
          projectKey: env.projectKey,
          telegramId: BigInt(from.id)
        }
      }
    });
    isFirstStart = !existingClient?.welcomeSentAt;
    await prisma.client.upsert({
      where: {
        projectKey_telegramId: {
          projectKey: env.projectKey,
          telegramId: BigInt(from.id)
        }
      },
      create: {
        projectKey: env.projectKey,
        telegramId: BigInt(from.id),
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
        languageCode: from.language_code ?? "ru",
        lastSeenAt: new Date(),
        welcomeSentAt: new Date()
      },
      update: {
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
        languageCode: from.language_code ?? existingClient?.languageCode ?? "ru",
        lastSeenAt: new Date(),
        welcomeSentAt: existingClient?.welcomeSentAt ?? new Date()
      }
    });
  }

  const keyboard = new InlineKeyboard().webApp("Открыть MBPG", env.webAppUrl);
  const message = isFirstStart
    ? "Здравствуйте! Это MBPG в Батуми: детский бассейн, спортивные занятия и массаж. Нажмите кнопку ниже, чтобы выбрать направление, посмотреть цены и записаться на пробное занятие."
    : "С возвращением в MBPG. Нажмите кнопку ниже, чтобы открыть Mini App, посмотреть услуги, цены или записаться.";
  await ctx.reply(message, {
    reply_markup: keyboard
  });
});

bot.command("admin", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp("Открыть админку", `${env.webAppUrl}/admin`);
  await ctx.reply("Админка MBPG", { reply_markup: keyboard });
});

export function attachBot(app: Express) {
  app.use(webhookPath, webhookCallback(bot, "express"));
}

export async function startBot() {
  if (env.botPolling) {
    await bot.api.deleteWebhook();
    await bot.start();
    return;
  }

  const webhookUrl = `${env.apiPublicUrl}${webhookPath}`;
  await bot.api.setMyCommands([
    { command: "start", description: "Открыть MBPG Mini App" },
    { command: "admin", description: "Открыть админку" }
  ]);
  await bot.api.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "MBPG",
      web_app: { url: env.webAppUrl }
    }
  });
  await bot.api.setWebhook(webhookUrl, {
    allowed_updates: ["message", "callback_query"]
  });
  console.log(`Telegram webhook configured: ${webhookUrl}`);
}
