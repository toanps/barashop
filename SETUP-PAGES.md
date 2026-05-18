# Barashop Cloudflare Deploy Settings

Use Cloudflare's connected-repo build flow.

## Required Cloudflare settings

- Git repo: `toanps/barashop`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Deploy command: `npm run deploy`

`npm run deploy` runs:

```bash
wrangler pages deploy dist --project-name=barashop
```

Do **not** use `npx wrangler deploy`; that is for Workers and causes:

```text
Missing entry-point to Worker script or to assets directory
```

## Required environment variables / secrets

Set these in Cloudflare build environment:

```bash
BARA_TELEGRAM_BOT_TOKEN=***
BARA_TELEGRAM_CHAT_ID=459579073
ORDER_TO_EMAIL=thucao@iccjpn.com
```

If Cloudflare asks for deployment auth, also set:

```bash
CLOUDFLARE_API_TOKEN=***
CLOUDFLARE_ACCOUNT_ID=***
```

The current token may still need Cloudflare Pages edit permission if deploy auth fails.
