# Railway setup

Use one Railway app service for MBPG. The API service also serves the built Telegram Mini App from `apps/web/dist`, so a separate web service is not required.

## API service variables

Set these variables on the `@mbpg/api` Railway service:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
BOT_TOKEN=replace_with_new_botfather_token
ADMIN_TELEGRAM_IDS=123456789
PROJECT_KEY=mbpg
NODE_ENV=production
BOT_POLLING=false
WEB_APP_URL=https://your-api-service.up.railway.app
API_PUBLIC_URL=https://your-api-service.up.railway.app
```

`DATABASE_URL` must point to the MBPG PostgreSQL service. Do not reuse a database from another bot.

## Important

The bot token previously shared in chat must be revoked in BotFather. Use a fresh token in Railway variables only.
