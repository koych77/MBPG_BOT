import { bot } from "./index.js";
import { env } from "../env.js";

export async function notifyAdmins(message: string) {
  await Promise.allSettled(env.adminTelegramIds.map((id) => bot.api.sendMessage(id, message)));
}
