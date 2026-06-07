# Railway setup

Create one PostgreSQL database for MBPG and connect it to the API service only.

## API service variables

Set these variables on the `@mbpg/api` Railway service:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
BOT_TOKEN=replace_with_new_botfather_token
ADMIN_TELEGRAM_IDS=123456789
PROJECT_KEY=mbpg
NODE_ENV=production
BOT_POLLING=false
WEB_APP_URL=https://your-web-service.up.railway.app
API_PUBLIC_URL=https://your-api-service.up.railway.app
```

`DATABASE_URL` must point to the MBPG PostgreSQL service. Do not reuse a database from another bot.

## Web service variables

Set this variable on the `@mbpg/web` Railway service:

```bash
VITE_API_BASE=https://your-api-service.up.railway.app
```

## Important

The bot token previously shared in chat must be revoked in BotFather. Use a fresh token in Railway variables only.
