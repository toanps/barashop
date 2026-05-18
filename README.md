# Barashop

Simple, elegant Vietnamese online rose shop for Japan-only pre-orders.

Project folder: `~/projects/baraweb`
Target domain: `barashop.pages.dev`
Currency: JPY
Checkout notifications: `thucao@iccjpn.com` + Telegram

See `PLAN.md` for scope, decisions needed, and build phases.


## Local development

```bash
npm install
npm run dev
npm run build
```

## Checkout notifications

Cloudflare Pages Function: `functions/api/checkout.js`

Required production secrets/vars:
- `BARA_TELEGRAM_BOT_TOKEN` — Bara Agent bot token
- `BARA_TELEGRAM_CHAT_ID=459579073` — Toan DM destination
- `ORDER_TO_EMAIL=thucao@iccjpn.com`
- `RESEND_API_KEY` — optional but needed for email delivery via Resend
- `ORDER_FROM_EMAIL` — optional sender address

## Deploy

Target: Cloudflare Pages project `barashop`, domain `barashop.pages.dev`.

Wrangler currently needs Cloudflare auth before deployment.
