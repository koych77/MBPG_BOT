import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { attachBot, startBot } from "./bot/index.js";
import { startReminderWorker } from "./bot/reminders.js";
import { clientsRouter } from "./routes/clients.js";
import { leadsRouter } from "./routes/leads.js";
import { receiptsRouter } from "./routes/receipts.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, "../../web/dist");

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, projectKey: env.projectKey });
});

app.use("/api/clients", clientsRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/receipts", receiptsRouter);
app.use("/api/admin", adminRouter);

attachBot(app);

app.use(express.static(webDist));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(webDist, "index.html"));
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(status || 500).json({ error: message });
});

app.listen(env.port, async () => {
  console.log(`MBPG API listening on ${env.port}`);
  await startBot();
  startReminderWorker();
});
