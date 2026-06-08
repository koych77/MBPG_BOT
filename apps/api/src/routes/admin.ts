import { Router } from "express";
import type { Prisma } from "@prisma/client";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { env } from "../env.js";
import { requireAdmin } from "./auth.js";
import { bot } from "../bot/index.js";
import { sendAdminNotification, sendClientNotification } from "../bot/notifications.js";

export const adminRouter = Router();
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
    const [clients, leads, receipts, reminders, broadcasts, enrollments, lessons, coaches, posts, notifications, recentClients, recentLeads, recentReceipts, recentReminders, recentBroadcasts, recentEnrollments, recentLessons, recentCoaches, recentPosts, recentNotifications] = await Promise.all([
      prisma.client.count({ where: { projectKey: env.projectKey } }),
      prisma.lead.count({ where: { projectKey: env.projectKey } }),
      prisma.receipt.count({ where: { projectKey: env.projectKey } }),
      prisma.reminder.count({ where: { projectKey: env.projectKey, status: "SCHEDULED" } }),
      prisma.broadcast.count({ where: { projectKey: env.projectKey } }),
      prisma.enrollment.count({ where: { projectKey: env.projectKey } }),
      prisma.lesson.count({ where: { projectKey: env.projectKey } }),
      prisma.coach.count({ where: { projectKey: env.projectKey } }),
      prisma.contentPost.count({ where: { projectKey: env.projectKey } }),
      prisma.notificationLog.count({ where: { projectKey: env.projectKey } }),
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
      }),
      prisma.coach.findMany({
        where: { projectKey: env.projectKey },
        orderBy: { updatedAt: "desc" },
        take: 40
      }),
      prisma.contentPost.findMany({
        where: { projectKey: env.projectKey },
        orderBy: { updatedAt: "desc" },
        take: 40
      }),
      prisma.notificationLog.findMany({
        where: { projectKey: env.projectKey },
        include: { client: true },
        orderBy: { createdAt: "desc" },
        take: 60
      })
    ]);

    res.json({
      stats: { clients, leads, receipts, reminders, broadcasts, enrollments, lessons, coaches, posts, notifications },
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
      })),
      recentCoaches: recentCoaches.map((coach) => ({ ...coach, photoData: undefined, hasPhoto: Boolean(coach.photoData) })),
      recentPosts: recentPosts.map((post) => ({ ...post, imageData: undefined, hasImage: Boolean(post.imageData) })),
      recentNotifications: recentNotifications.map((notification) => ({
        ...notification,
        telegramId: notification.telegramId?.toString(),
        client: notification.client ? { ...notification.client, telegramId: notification.client.telegramId.toString() } : null
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
      where: { id: String(req.params.id) },
      data: { status: body.status },
      include: { client: true }
    });
    if (body.status === "BOOKED") {
      await sendClientNotification(
        lead.client,
        [
          "Ваша запись MBPG подтверждена.",
          "",
          `Ребенок: ${lead.childName}`,
          `Филиал: ${lead.branch}`,
          lead.preferredTime ? `Время: ${lead.preferredTime}` : undefined
        ].filter(Boolean).join("\n"),
        { type: "lead_booked", title: "Запись подтверждена", relatedModel: "Lead", relatedId: lead.id }
      );
    }
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
      where: { id: String(req.params.id) },
      data: { status: body.status, adminNote: body.adminNote },
      include: { client: true }
    });
    if (body.status === "APPROVED" || body.status === "REJECTED") {
      await sendClientNotification(
        receipt.client,
        body.status === "APPROVED"
          ? "Оплата MBPG подтверждена. Чек принят администратором."
          : "Чек MBPG отклонен. Пожалуйста, свяжитесь с администратором или отправьте корректный чек.",
        { type: body.status === "APPROVED" ? "receipt_approved" : "receipt_rejected", title: "Статус чека", relatedModel: "Receipt", relatedId: receipt.id }
      );
    }
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
      where: { id: String(req.params.id) },
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
      },
      include: { client: true, enrollment: true }
    });
    await sendClientNotification(
      lesson.client,
      [
        "Вам назначено занятие MBPG.",
        "",
        `Занятие: ${lesson.title}`,
        `Дата и время: ${lesson.startsAt.toLocaleString("ru-RU")}`,
        lesson.branch ? `Филиал: ${lesson.branch}` : undefined
      ].filter(Boolean).join("\n"),
      { type: "lesson_scheduled", title: "Занятие назначено", relatedModel: "Lesson", relatedId: lesson.id }
    );
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
    const previous = await prisma.lesson.findUnique({ where: { id: String(req.params.id) } });
    const lesson = await prisma.lesson.update({
      where: { id: String(req.params.id) },
      data: { status: body.status },
      include: { client: true, enrollment: true }
    });

    if (lesson.enrollmentId && previous?.status !== "ATTENDED" && body.status === "ATTENDED") {
      const enrollment = await prisma.enrollment.update({
        where: { id: lesson.enrollmentId },
        data: { usedLessons: { increment: 1 } }
      });
      const remainingLessons = Math.max(enrollment.totalLessons - enrollment.usedLessons, 0);
      await sendClientNotification(
        lesson.client,
        [
          "Посещение MBPG отмечено.",
          "",
          `Занятие: ${lesson.title}`,
          enrollment.totalLessons > 0 ? `Осталось занятий: ${remainingLessons}` : undefined
        ].filter(Boolean).join("\n"),
        { type: "lesson_attended", title: "Посещение отмечено", relatedModel: "Lesson", relatedId: lesson.id }
      );
      if (remainingLessons === 2 || remainingLessons === 0) {
        await sendClientNotification(
          lesson.client,
          remainingLessons === 2
            ? "У вас осталось 2 занятия в абонементе MBPG. Рекомендуем заранее продлить абонемент."
            : "Ваш абонемент MBPG закончился. Свяжитесь с администратором для продления.",
          { type: remainingLessons === 2 ? "subscription_low" : "subscription_empty", title: "Абонемент", relatedModel: "Enrollment", relatedId: enrollment.id }
        );
        await sendAdminNotification(
          [
            remainingLessons === 2 ? "У клиента осталось 2 занятия." : "У клиента закончился абонемент.",
            `TG ${lesson.client.telegramId.toString()}`,
            `Абонемент: ${enrollment.title}`,
            `Занятие: ${lesson.title}`
          ].join("\n"),
          { type: remainingLessons === 2 ? "admin_subscription_low" : "admin_subscription_empty", title: "Абонемент клиента", relatedModel: "Enrollment", relatedId: enrollment.id }
        );
      }
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

const coachSchema = z.object({
  name: z.string().min(2),
  direction: z.enum(["pool", "gym", "massage"]),
  branch: z.string().optional(),
  serviceSlugs: z.string().optional(),
  bio: z.string().optional(),
  experience: z.string().optional(),
  isActive: z.coerce.boolean().default(true)
});

adminRouter.post("/coaches", imageUpload.single("photo"), async (req, res, next) => {
  try {
    const body = coachSchema.parse(req.body);
    const photoBytes = req.file ? new Uint8Array(req.file.buffer) : undefined;
    const coach = await prisma.coach.create({
      data: {
        projectKey: env.projectKey,
        name: body.name,
        direction: body.direction,
        branch: body.branch,
        serviceSlugs: body.serviceSlugs ? body.serviceSlugs.split(",").map((item) => item.trim()).filter(Boolean) : [],
        bio: body.bio,
        experience: body.experience,
        isActive: body.isActive,
        photoFileName: req.file?.originalname,
        photoMimeType: req.file?.mimetype,
        photoSize: req.file?.size,
        photoData: photoBytes
      }
    });
    res.status(201).json({ coach: { ...coach, photoData: undefined } });
  } catch (error) {
    next(error);
  }
});

const coachUpdateSchema = coachSchema.partial();

adminRouter.patch("/coaches/:id", imageUpload.single("photo"), async (req, res, next) => {
  try {
    const body = coachUpdateSchema.parse(req.body);
    const photoBytes = req.file ? new Uint8Array(req.file.buffer) : undefined;
    const coach = await prisma.coach.update({
      where: { id: String(req.params.id) },
      data: {
        ...body,
        serviceSlugs: body.serviceSlugs ? body.serviceSlugs.split(",").map((item) => item.trim()).filter(Boolean) : undefined,
        photoFileName: req.file?.originalname,
        photoMimeType: req.file?.mimetype,
        photoSize: req.file?.size,
        photoData: photoBytes
      }
    });
    res.json({ coach: { ...coach, photoData: undefined } });
  } catch (error) {
    next(error);
  }
});

const postSchema = z.object({
  type: z.enum(["news", "promo"]),
  languageCode: z.enum(["ru", "ka", "en"]).default("ru"),
  title: z.string().min(2),
  body: z.string().min(3),
  direction: z.enum(["all", "pool", "gym", "massage"]).default("all"),
  serviceSlugs: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isPublished: z.coerce.boolean().default(false)
});

adminRouter.post("/posts", imageUpload.single("image"), async (req, res, next) => {
  try {
    const body = postSchema.parse(req.body);
    const imageBytes = req.file ? new Uint8Array(req.file.buffer) : undefined;
    const post = await prisma.contentPost.create({
      data: {
        projectKey: env.projectKey,
        type: body.type,
        languageCode: body.languageCode,
        title: body.title,
        body: body.body,
        direction: body.direction === "all" ? undefined : body.direction,
        serviceSlugs: body.serviceSlugs ? body.serviceSlugs.split(",").map((item) => item.trim()).filter(Boolean) : [],
        ctaLabel: body.ctaLabel,
        ctaUrl: body.ctaUrl,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
        isPublished: body.isPublished,
        imageFileName: req.file?.originalname,
        imageMimeType: req.file?.mimetype,
        imageSize: req.file?.size,
        imageData: imageBytes
      }
    });
    res.status(201).json({ post: { ...post, imageData: undefined } });
  } catch (error) {
    next(error);
  }
});

const postUpdateSchema = postSchema.partial();

adminRouter.patch("/posts/:id", imageUpload.single("image"), async (req, res, next) => {
  try {
    const body = postUpdateSchema.parse(req.body);
    const imageBytes = req.file ? new Uint8Array(req.file.buffer) : undefined;
    const post = await prisma.contentPost.update({
      where: { id: String(req.params.id) },
      data: {
        ...body,
        direction: body.direction === "all" ? null : body.direction,
        serviceSlugs: body.serviceSlugs ? body.serviceSlugs.split(",").map((item) => item.trim()).filter(Boolean) : undefined,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
        imageFileName: req.file?.originalname,
        imageMimeType: req.file?.mimetype,
        imageSize: req.file?.size,
        imageData: imageBytes
      }
    });
    res.json({ post: { ...post, imageData: undefined } });
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
