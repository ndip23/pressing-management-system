# Security checklist (PressMark)

## Never commit

- `.env`, `.env.local`, credentials, API keys, JWT secrets
- `client/build/`, `node_modules/`, `*.map` source maps from production builds
- Seed scripts with real passwords (`server/seedAdmin.js` is gitignored)

Use `server/.env.example` and `client/.env.example` as templates only.

## Production environment

| Variable | Required in production |
|----------|------------------------|
| `JWT_SECRET` | Yes — long random value |
| `MONGO_URI` | Yes |
| `ACCOUNTPE_WEBHOOK_SECRET` | Yes — webhooks rejected if missing |
| `FRONTEND_URL` | Yes — exact origins, comma-separated |
| `NODE_ENV` | Set to `production` |

Optional: `TWILIO_AUTH_TOKEN` + `TWILIO_WEBHOOK_BASE_URL` for validated WhatsApp webhooks.

## Recent hardening (codebase)

- Directory admin tenant routes require authentication
- Removed public `/api/subscriptions/force-verify` plan bypass
- Payment webhooks fail closed without `ACCOUNTPE_WEBHOOK_SECRET` in production
- Twilio webhook signature validation when configured
- Gallery delete scoped to tenant
- Tenant admins cannot create `superadmin` users
- Rate limits on public registration, contact, and directory admin login
- Production client builds disable source maps (`client/.env.production`)

## Deploy

1. Run `npm install` in `server/` (includes `compression`)
2. Run `npm install` in `client/` if using `client/server.js`
3. Build client: `npm run build` in `client/`
4. Do not serve the repo root — only `client/build` via static server or CDN
5. API server does not expose `.env` or `node_modules` (no static file mount on project root)

## If secrets were ever committed

Rotate JWT secret, Cloudinary keys, payment webhooks, and database credentials immediately. Remove files from git history if needed.
