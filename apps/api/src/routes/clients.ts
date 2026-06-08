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
      phone,
      lastSeenAt: new Date()
    },
    update: {
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      languageCode,
      phone,
      lastSeenAt: new Date()
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

clientsRouter.get("/me/dashboard", async (req, res, next) => {
  try {
    const user = requireTelegramUser(req);
    const client = await prisma.client.findUnique({
      where: {
        projectKey_telegramId: {
          projectKey: env.projectKey,
          telegramId: BigInt(user.id)
        }
      },
      include: {
        leads: {
          include: { services: true },
          orderBy: { createdAt: "desc" },
          take: 20
        },
        receipts: {
          orderBy: { createdAt: "desc" },
          take: 20
        },
        enrollments: {
          include: {
            lessons: {
              orderBy: { startsAt: "asc" },
              take: 10
            }
          },
          orderBy: { updatedAt: "desc" },
          take: 20
        },
        lessons: {
          where: { startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          orderBy: { startsAt: "asc" },
          take: 20
        }
      }
    });

    if (!client) {
      res.json({
        client: null,
        hasCabinet: false,
        leads: [],
        receipts: [],
        enrollments: [],
        upcomingLessons: []
      });
      return;
    }

    const leads = client.leads.map((lead) => ({
      ...lead,
      services: lead.services.length > 0
        ? lead.services
        : lead.serviceSlug
          ? [{ id: lead.id, leadId: lead.id, serviceSlug: lead.serviceSlug, title: null, direction: lead.direction, createdAt: lead.createdAt }]
          : []
    }));

    res.json({
      client: { ...client, telegramId: client.telegramId.toString(), receipts: undefined, leads: undefined, enrollments: undefined, lessons: undefined },
      hasCabinet: leads.length > 0 || client.receipts.length > 0 || client.enrollments.length > 0 || client.lessons.length > 0,
      leads,
      receipts: client.receipts.map((receipt) => ({ ...receipt, data: undefined })),
      enrollments: client.enrollments.map((enrollment) => ({
        ...enrollment,
        remainingLessons: Math.max(enrollment.totalLessons - enrollment.usedLessons, 0)
      })),
      upcomingLessons: client.lessons
    });
  } catch (error) {
    next(error);
  }
});
