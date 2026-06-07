import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import type { Express } from "express";
import { env } from "../env.js";

export const bot = new Bot(env.botToken);

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp("Open MBPG", env.webAppUrl);
  await ctx.reply("Welcome to MBPG. Open the Mini App to choose Pool or Gym, see prices, and book a trial lesson.", {
    reply_markup: keyboard
  });
});

bot.command("admin", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp("Open admin", `${env.webAppUrl}/admin`);
  await ctx.reply("Admin panel", { reply_markup: keyboard });
});

export function attachBot(app: Express) {
  app.use("/telegram/webhook", webhookCallback(bot, "express"));
}

export async function startBot() {
  if (env.botPolling) {
    await bot.start();
  }
}
