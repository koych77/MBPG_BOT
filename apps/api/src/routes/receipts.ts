import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { env } from "../env.js";
import { requireAdmin, requireTelegramUser } from "./auth.js";
import { upsertClient } from "./clients.js";
import { notifyAdmins } from "../bot/notify.js";
import { sendClientNotification } from "../bot/notifications.js";

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
        "Новый чек MBPG",
        `Файл: ${receipt.fileName}`,
        `Размер: ${Math.round(receipt.size / 1024)} KB`,
        `Receipt ID: ${receipt.id}`,
        `Telegram ID: ${client.telegramId.toString()}`,
        "Откройте админку, чтобы проверить чек:",
        `${env.webAppUrl}/admin`
      ].join("\n")
    );

    await sendClientNotification(
      client,
      [
        "Чек MBPG получен.",
        "",
        `Файл: ${receipt.fileName}`,
        "",
        "Администратор уже получил уведомление и проверит оплату."
      ].join("\n"),
      { type: "receipt_created", title: "Чек получен", relatedModel: "Receipt", relatedId: receipt.id }
    );

    res.status(201).json({
      receipt: { ...receipt, data: undefined },
      message: "Чек получен. Администратор уже получил уведомление и проверит оплату."
    });
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
