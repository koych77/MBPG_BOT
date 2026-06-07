import type { Request } from "express";
import { parseAndValidateInitData, devUserFromHeader, isAdmin } from "../utils/telegram.js";

export function getTelegramUser(req: Request) {
  const initData = req.header("x-telegram-init-data") ?? "";
  return parseAndValidateInitData(initData) ?? devUserFromHeader(req.header("x-dev-telegram-id") ?? undefined);
}

export function requireTelegramUser(req: Request) {
  const user = getTelegramUser(req);
  if (!user) {
    const error = new Error("Telegram authorization is required");
    Object.assign(error, { status: 401 });
    throw error;
  }
  return user;
}

export function requireAdmin(req: Request) {
  const user = requireTelegramUser(req);
  if (!isAdmin(user.id)) {
    const error = new Error("Admin access denied");
    Object.assign(error, { status: 403 });
    throw error;
  }
  return user;
}
