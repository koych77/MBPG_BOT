import "dotenv/config";

const required = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  projectKey: process.env.PROJECT_KEY ?? "mbpg",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 8080),
  webAppUrl: process.env.WEB_APP_URL ?? "http://localhost:5173",
  apiPublicUrl: process.env.API_PUBLIC_URL ?? "http://localhost:8080",
  botToken: required("BOT_TOKEN"),
  botPolling: process.env.BOT_POLLING === "true",
  adminTelegramIds: (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
};
