import type { Client } from "@prisma/client";
import { bot } from "./index.js";
import { env } from "../env.js";
import { prisma } from "../prisma.js";

type NotificationMeta = {
  type: string;
  title?: string;
  relatedModel?: string;
  relatedId?: string;
};

async function logNotification(params: {
  clientId?: string;
  telegramId?: bigint;
  audience: string;
  message: string;
  status: "SENT" | "FAILED";
  error?: string;
} & NotificationMeta) {
  await prisma.notificationLog.create({
    data: {
      projectKey: env.projectKey,
      clientId: params.clientId,
      telegramId: params.telegramId,
      audience: params.audience,
      type: params.type,
      title: params.title,
      message: params.message,
      status: params.status,
      error: params.error,
      relatedModel: params.relatedModel,
      relatedId: params.relatedId
    }
  });
}

export async function sendClientNotification(client: Pick<Client, "id" | "telegramId">, message: string, meta: NotificationMeta) {
  try {
    await bot.api.sendMessage(client.telegramId.toString(), message);
    await logNotification({
      clientId: client.id,
      telegramId: client.telegramId,
      audience: "client",
      message,
      status: "SENT",
      ...meta
    });
    return true;
  } catch (error) {
    await logNotification({
      clientId: client.id,
      telegramId: client.telegramId,
      audience: "client",
      message,
      status: "FAILED",
      error: error instanceof Error ? error.message : String(error),
      ...meta
    });
    return false;
  }
}

export async function sendAdminNotification(message: string, meta: NotificationMeta) {
  const results = await Promise.allSettled(
    env.adminTelegramIds.map(async (id) => {
      try {
        await bot.api.sendMessage(id, message);
        await logNotification({
          telegramId: BigInt(id),
          audience: "admin",
          message,
          status: "SENT",
          ...meta
        });
      } catch (error) {
        await logNotification({
          telegramId: BigInt(id),
          audience: "admin",
          message,
          status: "FAILED",
          error: error instanceof Error ? error.message : String(error),
          ...meta
        });
      }
    })
  );
  return results;
}
