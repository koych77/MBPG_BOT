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

  const keyboard = new InlineKeyboard()
    .webApp("Открыть Mini App", env.webAppUrl)
    .row()
    .url("WhatsApp", "https://wa.me/995591990894")
    .url("Instagram", "https://www.instagram.com/mybabypool");

  const name = from?.first_name ? `, ${from.first_name}` : "";
  const message = isFirstStart
    ? [
        `<b>Здравствуйте${name}! Добро пожаловать в MBPG.</b>`,
        "",
        "MBPG - детский бассейн, гимнастика и спортивные занятия в Батуми.",
        "Мы помогаем детям расти активными, здоровыми и уверенными через воду, движение и заботу.",
        "",
        "<b>Что можно сделать в приложении:</b>",
        "• выбрать направление Pool или Gym;",
        "• посмотреть услуги, цены и адреса;",
        "• записаться на пробное занятие;",
        "• отправить чек об оплате;",
        "• быстро связаться с администратором.",
        "",
        "<b>Нажмите кнопку «Открыть Mini App» ниже.</b>"
      ].join("\n")
    : [
        `<b>С возвращением${name}!</b>`,
        "",
        "Откройте MBPG Mini App, чтобы посмотреть услуги, цены, записаться или отправить чек."
      ].join("\n");

  await ctx.reply(message, {
    parse_mode: "HTML",
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

  await bot.api.setMyName("MBPG");
  await bot.api.setMyShortDescription("Детский бассейн, гимнастика, спорт и массаж в Батуми.");
  await bot.api.setMyDescription(
    [
      "MBPG - детский бассейн и спортивные занятия в Батуми.",
      "",
      "Откройте Mini App, чтобы выбрать Pool или Gym, посмотреть цены и записаться на пробное занятие."
    ].join("\n")
  );
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
