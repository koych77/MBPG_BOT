import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { env } from "../env.js";
import { requireAdmin, requireTelegramUser } from "./auth.js";
import { upsertClient } from "./clients.js";
import { notifyAdmins } from "../bot/notify.js";

export const receiptsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const receiptBodySchema = z.object({
  languageCode: z.enum(["ru", "ka", "en"]).default("ru"),
  leadId: z.string().optional()
});

receiptsRouter.post("/", upload.single("receipt"), async (req, res, next) => {
  try {
    const user = requireTelegramUser(req);
    const body = receiptBodySchema.parse(req.body);
    if (!req.file) {
      res.status(400).json({ error: "Receipt file is required" });
      return;
    }

    const client = await upsertClient(user, body.languageCode);
    const fileBytes = new Uint8Array(req.file.buffer.length);
    fileBytes.set(req.file.buffer);
    const receipt = await prisma.receipt.create({
      data: {
        projectKey: env.projectKey,
        clientId: client.id,
        leadId: body.leadId,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: fileBytes
      }
    });

    await notifyAdmins(
      [
        "New MBPG receipt",
        `Receipt ID: ${receipt.id}`,
        `File: ${receipt.fileName}`,
        `Telegram ID: ${client.telegramId.toString()}`,
        "Open /admin to approve or reject."
      ].join("\n")
    );

    res.status(201).json({ receipt: { ...receipt, data: undefined } });
  } catch (error) {
    next(error);
  }
});

receiptsRouter.get("/:id/file", async (req, res, next) => {
  try {
    requireAdmin(req);
    const receipt = await prisma.receipt.findFirst({
      where: { id: req.params.id, projectKey: env.projectKey }
    });
    if (!receipt) {
      res.status(404).json({ error: "Receipt not found" });
      return;
    }
    res.setHeader("Content-Type", receipt.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${receipt.fileName}"`);
    res.send(Buffer.from(receipt.data));
  } catch (error) {
    next(error);
  }
});
