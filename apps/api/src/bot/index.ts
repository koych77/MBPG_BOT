import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import type { Express } from "express";
import { env } from "../env.js";

export const bot = new Bot(env.botToken);
const webhookPath = "/telegram/webhook";

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp("Открыть MBPG", env.webAppUrl);
  await ctx.reply("MBPG открыт. Нажмите кнопку ниже, чтобы выбрать Pool или Gym, посмотреть цены и записаться.", {
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
