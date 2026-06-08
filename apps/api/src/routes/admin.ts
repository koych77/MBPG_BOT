import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { env } from "../env.js";
import { requireAdmin } from "./auth.js";
import { bot } from "../bot/index.js";

export const adminRouter = Router();

type LeadWithClient = Prisma.LeadGetPayload<{ include: { client: true } }>;
type ReceiptWithClientAndLead = Prisma.ReceiptGetPayload<{ include: { client: true; lead: true } }>;
type EnrollmentWithClient = Prisma.EnrollmentGetPayload<{ include: { client: true; lead: true } }>;
type LessonWithClient = Prisma.LessonGetPayload<{ include: { client: true; enrollment: true } }>;

adminRouter.use((req, _res, next) => {
  try {
    requireAdmin(req);
    next();
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/overview", async (_req, res, next) => {
  try {
    const [clients, leads, receipts, reminders, broadcasts, enrollments, lessons, recentClients, recentLeads, recentReceipts, recentReminders, recentBroadcasts, recentEnrollments, recentLessons] = await Promise.all([
      prisma.client.count({ where: { projectKey: env.projectKey } }),
      prisma.lead.count({ where: { projectKey: env.projectKey } }),
      prisma.receipt.count({ where: { projectKey: env.projectKey } }),
      prisma.reminder.count({ where: { projectKey: env.projectKey, status: "SCHEDULED" } }),
      prisma.broadcast.count({ where: { projectKey: env.projectKey } }),
      prisma.enrollment.count({ where: { projectKey: env.projectKey } }),
      prisma.lesson.count({ where: { projectKey: env.projectKey } }),
      prisma.client.findMany({
        where: { projectKey: env.projectKey },
        include: {
          leads: { orderBy: { createdAt: "desc" }, take: 3 },
          enrollments: { orderBy: { updatedAt: "desc" }, take: 3 }
        },
        orderBy: { updatedAt: "desc" },
        take: 100
      }),
      prisma.lead.findMany({
        where: { projectKey: env.projectKey },
        include: { client: true },
        orderBy: { createdAt: "desc" },
        take: 25
      }),
      prisma.receipt.findMany({
        where: { projectKey: env.projectKey },
        include: { client: true, lead: true },
        orderBy: { createdAt: "desc" },
        take: 25
      }),
      prisma.reminder.findMany({
        where: { projectKey: env.projectKey },
        include: { client: true, lead: true },
        orderBy: { dueAt: "asc" },
        take: 40
      }),
      prisma.broadcast.findMany({
        where: { projectKey: env.projectKey },
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      prisma.enrollment.findMany({
        where: { projectKey: env.projectKey },
        include: { client: true, lead: true },
        orderBy: { updatedAt: "desc" },
        take: 30
      }),
      prisma.lesson.findMany({
        where: { projectKey: env.projectKey },
        include: { client: true, enrollment: true },
        orderBy: { startsAt: "asc" },
        take: 40
      })
    ]);

    res.json({
      stats: { clients, leads, receipts, reminders, broadcasts, enrollments, lessons },
      recentClients: recentClients.map((client) => ({
        ...client,
        telegramId: client.telegramId.toString()
      })),
      recentLeads: recentLeads.map((lead: LeadWithClient) => ({
        ...lead,
        client: { ...lead.client, telegramId: lead.client.telegramId.toString() }
      })),
      recentReceipts: recentReceipts.map((receipt: ReceiptWithClientAndLead) => ({
        ...receipt,
        data: undefined,
        client: { ...receipt.client, telegramId: receipt.client.telegramId.toString() }
      })),
      recentReminders: recentReminders.map((reminder) => ({
        ...reminder,
        client: { ...reminder.client, telegramId: reminder.client.telegramId.toString() }
      })),
      recentBroadcasts,
      recentEnrollments: recentEnrollments.map((enrollment: EnrollmentWithClient) => ({
        ...enrollment,
        remainingLessons: Math.max(enrollment.totalLessons - enrollment.usedLessons, 0),
        client: { ...enrollment.client, telegramId: enrollment.client.telegramId.toString() }
      })),
      recentLessons: recentLessons.map((lesson: LessonWithClient) => ({
        ...lesson,
        client: { ...lesson.client, telegramId: lesson.client.telegramId.toString() }
      }))
    });
  } catch (error) {
    next(error);
  }
});

const leadStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "BOOKED", "PAID", "LOST", "ARCHIVED"])
});

adminRouter.patch("/leads/:id/status", async (req, res, next) => {
  try {
    const body = leadStatusSchema.parse(req.body);
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: { status: body.status }
    });
    res.json({ lead });
  } catch (error) {
    next(error);
  }
});

const receiptStatusSchema = z.object({
  status: z.enum(["NEW", "APPROVED", "REJECTED"]),
  adminNote: z.string().optional()
});

adminRouter.patch("/receipts/:id/status", async (req, res, next) => {
  try {
    const body = receiptStatusSchema.parse(req.body);
    const receipt = await prisma.receipt.update({
      where: { id: req.params.id },
      data: { status: body.status, adminNote: body.adminNote }
    });
    res.json({ receipt: { ...receipt, data: undefined } });
  } catch (error) {
    next(error);
  }
});

const reminderSchema = z.object({
  clientId: z.string().min(1),
  leadId: z.string().optional(),
  type: z.enum(["lesson", "payment", "promo", "news", "custom"]).default("custom"),
  message: z.string().min(3),
  dueAt: z.string().datetime()
});

adminRouter.post("/reminders", async (req, res, next) => {
  try {
    const body = reminderSchema.parse(req.body);
    const reminder = await prisma.reminder.create({
      data: {
        projectKey: env.projectKey,
        clientId: body.clientId,
        leadId: body.leadId,
        type: body.type,
        message: body.message,
        dueAt: new Date(body.dueAt)
      }
    });
    res.status(201).json({ reminder });
  } catch (error) {
    next(error);
  }
});

const enrollmentSchema = z.object({
  clientId: z.string().min(1),
  leadId: z.string().optional(),
  title: z.string().min(2),
  direction: z.string().optional(),
  branch: z.string().optional(),
  totalLessons: z.number().int().min(0).default(0),
  usedLessons: z.number().int().min(0).default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

adminRouter.post("/enrollments", async (req, res, next) => {
  try {
    const body = enrollmentSchema.parse(req.body);
    const enrollment = await prisma.enrollment.create({
      data: {
        projectKey: env.projectKey,
        clientId: body.clientId,
        leadId: body.leadId,
        title: body.title,
        direction: body.direction,
        branch: body.branch,
        totalLessons: body.totalLessons,
        usedLessons: body.usedLessons,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined
      }
    });
    res.status(201).json({ enrollment });
  } catch (error) {
    next(error);
  }
});

const enrollmentStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELED"]).optional(),
  totalLessons: z.number().int().min(0).optional(),
  usedLessons: z.number().int().min(0).optional()
});

adminRouter.patch("/enrollments/:id", async (req, res, next) => {
  try {
    const body = enrollmentStatusSchema.parse(req.body);
    const enrollment = await prisma.enrollment.update({
      where: { id: req.params.id },
      data: body
    });
    res.json({ enrollment });
  } catch (error) {
    next(error);
  }
});

const lessonSchema = z.object({
  clientId: z.string().min(1),
  enrollmentId: z.string().optional(),
  leadId: z.string().optional(),
  title: z.string().min(2),
  branch: z.string().optional(),
  startsAt: z.string().datetime(),
  note: z.string().optional()
});

adminRouter.post("/lessons", async (req, res, next) => {
  try {
    const body = lessonSchema.parse(req.body);
    const lesson = await prisma.lesson.create({
      data: {
        projectKey: env.projectKey,
        clientId: body.clientId,
        enrollmentId: body.enrollmentId,
        leadId: body.leadId,
        title: body.title,
        branch: body.branch,
        startsAt: new Date(body.startsAt),
        note: body.note
      }
    });
    res.status(201).json({ lesson });
  } catch (error) {
    next(error);
  }
});

const lessonStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "ATTENDED", "MISSED", "CANCELED"])
});

adminRouter.patch("/lessons/:id/status", async (req, res, next) => {
  try {
    const body = lessonStatusSchema.parse(req.body);
    const previous = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { status: body.status }
    });

    if (lesson.enrollmentId && previous?.status !== "ATTENDED" && body.status === "ATTENDED") {
      await prisma.enrollment.update({
        where: { id: lesson.enrollmentId },
        data: { usedLessons: { increment: 1 } }
      });
    }

    if (lesson.enrollmentId && previous?.status === "ATTENDED" && body.status !== "ATTENDED") {
      const enrollment = await prisma.enrollment.findUnique({ where: { id: lesson.enrollmentId } });
      await prisma.enrollment.update({
        where: { id: lesson.enrollmentId },
        data: { usedLessons: Math.max((enrollment?.usedLessons ?? 0) - 1, 0) }
      });
    }

    res.json({ lesson });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/reminders/:id/cancel", async (req, res, next) => {
  try {
    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { status: "CANCELED" }
    });
    res.json({ reminder });
  } catch (error) {
    next(error);
  }
});

const broadcastSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(3),
  audience: z.enum(["all"]).default("all")
});

adminRouter.post("/broadcasts", async (req, res, next) => {
  try {
    const body = broadcastSchema.parse(req.body);
    const clients = await prisma.client.findMany({
      where: { projectKey: env.projectKey },
      orderBy: { updatedAt: "desc" }
    });

    let sentCount = 0;
    let failedCount = 0;
    for (const client of clients) {
      try {
        await bot.api.sendMessage(client.telegramId.toString(), body.message);
        sentCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    const broadcast = await prisma.broadcast.create({
      data: {
        projectKey: env.projectKey,
        title: body.title,
        message: body.message,
        audience: body.audience,
        sentCount,
        failedCount,
        sentAt: new Date()
      }
    });

    res.status(201).json({ broadcast });
  } catch (error) {
    next(error);
  }
});
