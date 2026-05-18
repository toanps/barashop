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

## Current deploy auth error

If deployment fails with:

```text
Authentication error [code: 10000]
/accounts/d9e4f4cca9a1657024585f8d5d19af37/pages/projects/barashop
```

Set these Cloudflare **Build environment variables/secrets**:

```bash
CLOUDFLARE_ACCOUNT_ID=d9e4f4cca9a1657024585f8d5d19af37
CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN
```

Important: Wrangler needs the variable name exactly `CLOUDFLARE_API_TOKEN`, not `CF_API_TOKEN`.

The API token must have at least:

- Account → Cloudflare Pages → Edit
- Account → Workers Scripts → Edit (for Pages Functions)

Scope it to account `d9e4f4cca9a1657024585f8d5d19af37`.
