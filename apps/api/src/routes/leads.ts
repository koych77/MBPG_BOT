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
        "New MBPG lead",
        `Parent: ${lead.parentName}`,
        `Phone: ${lead.phone}`,
        `Child: ${lead.childName}, ${lead.childAge}`,
        `Direction: ${lead.direction}`,
        `Branch: ${lead.branch}`,
        `Telegram ID: ${client.telegramId.toString()}`
      ].join("\n")
    );

    res.status(201).json({ lead });
  } catch (error) {
    next(error);
  }
});
