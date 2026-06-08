import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { env } from "../env.js";
import { requireTelegramUser } from "./auth.js";
import { upsertClient } from "./clients.js";
import { notifyAdmins } from "../bot/notify.js";

export const leadsRouter = Router();

const leadSchema = z.object({
  languageCode: z.enum(["ru", "ka", "en"]).default("ru"),
  parentName: z.string().min(2),
  phone: z.string().min(5),
  childName: z.string().min(1),
  childAge: z.string().min(1),
  direction: z.enum(["pool", "gym", "massage"]),
  serviceSlug: z.string().optional(),
  branch: z.string().min(2),
  preferredTime: z.string().optional(),
  comment: z.string().optional()
});

function directionLabel(direction: string) {
  if (direction === "pool") return "Pool";
  if (direction === "gym") return "Gym";
  if (direction === "massage") return "Massage";
  return direction;
}

leadsRouter.post("/", async (req, res, next) => {
  try {
    const user = requireTelegramUser(req);
    const body = leadSchema.parse(req.body);
    const client = await upsertClient(user, body.languageCode, body.phone);
    const lead = await prisma.lead.create({
      data: {
        projectKey: env.projectKey,
        clientId: client.id,
        parentName: body.parentName,
        phone: body.phone,
        childName: body.childName,
        childAge: body.childAge,
        direction: body.direction,
        serviceSlug: body.serviceSlug,
        branch: body.branch,
        preferredTime: body.preferredTime,
        comment: body.comment
      }
    });

    await notifyAdmins(
      [
        "Новая заявка MBPG",
        `Родитель: ${lead.parentName}`,
        `Телефон: ${lead.phone}`,
        `Ребенок: ${lead.childName}, ${lead.childAge}`,
        `Направление: ${directionLabel(lead.direction)}`,
        `Филиал: ${lead.branch}`,
        lead.preferredTime ? `Удобное время: ${lead.preferredTime}` : undefined,
        lead.comment ? `Комментарий: ${lead.comment}` : undefined,
        `Telegram ID: ${client.telegramId.toString()}`,
        `${env.webAppUrl}/admin`
      ].filter(Boolean).join("\n")
    );

    await import("../bot/index.js").then(({ bot }) =>
      bot.api.sendMessage(
        client.telegramId.toString(),
        [
          "Ваша заявка MBPG принята.",
          "",
          `Направление: ${directionLabel(lead.direction)}`,
          `Филиал: ${lead.branch}`,
          "",
          "Администратор получил уведомление и свяжется с вами, чтобы подтвердить удобное время занятия."
        ].join("\n")
      )
    ).catch(() => undefined);

    res.status(201).json({
      lead,
      message: "Заявка принята. Администратор уже получил уведомление и скоро свяжется с вами."
    });
  } catch (error) {
    next(error);
  }
});
