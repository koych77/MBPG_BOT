import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { env } from "../env.js";
import { requireTelegramUser } from "./auth.js";

export const clientsRouter = Router();

const upsertSchema = z.object({
  languageCode: z.enum(["ru", "ka", "en"]).default("ru"),
  phone: z.string().optional()
});

export async function upsertClient(user: ReturnType<typeof requireTelegramUser>, languageCode = user.language_code ?? "ru", phone?: string) {
  return prisma.client.upsert({
    where: {
      projectKey_telegramId: {
        projectKey: env.projectKey,
        telegramId: BigInt(user.id)
      }
    },
    create: {
      projectKey: env.projectKey,
      telegramId: BigInt(user.id),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      languageCode,
      phone
    },
    update: {
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      languageCode,
      phone
    }
  });
}

clientsRouter.post("/me", async (req, res, next) => {
  try {
    const user = requireTelegramUser(req);
    const body = upsertSchema.parse(req.body);
    const client = await upsertClient(user, body.languageCode, body.phone);
    res.json({ client: { ...client, telegramId: client.telegramId.toString() } });
  } catch (error) {
    next(error);
  }
});
