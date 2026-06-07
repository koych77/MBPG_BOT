import crypto from "node:crypto";
import { env } from "../env.js";

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export function parseAndValidateInitData(initData: string): TelegramUser | null {
  if (!initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(env.botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(hash))) {
    return null;
  }

  const userRaw = params.get("user");
  if (!userRaw) return null;

  try {
    return JSON.parse(userRaw) as TelegramUser;
  } catch {
    return null;
  }
}

export function isAdmin(telegramId: number | bigint | string) {
  return env.adminTelegramIds.includes(String(telegramId));
}

export function devUserFromHeader(value?: string): TelegramUser | null {
  if (env.nodeEnv !== "development" || !value) return null;
  const id = Number(value);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    first_name: "Dev",
    username: "local_admin",
    language_code: "ru"
  };
}
