import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { env } from "../env.js";
import { requireAdmin } from "./auth.js";

export const adminRouter = Router();

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
    const [clients, leads, receipts, recentLeads, recentReceipts] = await Promise.all([
      prisma.client.count({ where: { projectKey: env.projectKey } }),
      prisma.lead.count({ where: { projectKey: env.projectKey } }),
      prisma.receipt.count({ where: { projectKey: env.projectKey } }),
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
      })
    ]);

    res.json({
      stats: { clients, leads, receipts },
      recentLeads: recentLeads.map((lead) => ({
        ...lead,
        client: { ...lead.client, telegramId: lead.client.telegramId.toString() }
      })),
      recentReceipts: recentReceipts.map((receipt) => ({
        ...receipt,
        data: undefined,
        client: { ...receipt.client, telegramId: receipt.client.telegramId.toString() }
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
