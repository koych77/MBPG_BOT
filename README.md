# MBPG Telegram Mini App

Telegram Mini App for My Baby Pool and My Gymnastics Gym in Batumi.

## Stack

- React Mini App with Russian, Georgian, and English UI.
- Node.js API with grammY Telegram bot.
- PostgreSQL and Prisma.
- Admin panel at `/admin`, guarded by Telegram ID.

## Local setup

1. Copy `.env.example` to `.env`.
2. Put a fresh BotFather token into `BOT_TOKEN`.
3. Add admin Telegram IDs to `ADMIN_TELEGRAM_IDS`.
4. Set `DATABASE_URL`.
5. Run:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

The Mini App runs on `http://localhost:5173`; the API runs on `http://localhost:8080`.

## Security notes

The old bot token shared in chat must be revoked in BotFather. Never commit real tokens to git.
