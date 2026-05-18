# Barashop

Simple, elegant Vietnamese online rose shop for Japan-only pre-orders.

Project folder: `~/projects/barashop`
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

## Local catalog CLI + CRM

Barashop is static-first: the website reads `data/roses.json`. The local CLI uses `data/barashop.sqlite` as a private CRM/catalog workspace, then exports back to `data/roses.json` before build/deploy. The SQLite file is ignored by git because it may contain customer/order data.

```bash
npm run bara -- init
npm run bara -- list
npm run bara -- search sakura
npm run bara -- add --id hong-moi --name "Hồng mới" --color "Đỏ" --price 5000 --image /images/hong-moi.png
npm run bara -- update hong-moi --description "Mô tả tiếng Việt."
npm run bara -- status hong-moi instock 3
npm run bara -- status hong-moi preorder
npm run bara -- status hong-moi out_of_order
npm run bara -- stock hong-moi 5
npm run bara -- delete hong-moi
npm run bara -- export
npm run build
```

Daily-use statuses: `instock`, `preorder`, `out_of_order`. Export maps these to static-site compatible values (`limited_stock`, `preorder`, `sold_out`).

For full CLI details, see `BARASHOP_CLI.md`.

Safety notes:
- Ask Toan before price changes or deleting products.
- Build after catalog edits: `npm run build`.
- Do not claim public deployment unless Cloudflare Pages deploy is verified.

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
