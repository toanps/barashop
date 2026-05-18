# Barashop - Deployment Status

## Project Complete ✅
- Static site built with Vite
- Vietnamese language
- AI-generated placeholder image (realistic single red rose)
- Checkout form with PayPay/COD options
- Telegram bot notifications + email configuration

## Ready Files
- `dist/` - Built static site
- `barashop-deployment.zip` - Ready for direct upload (1.3MB)
- `functions/api/checkout.js` - Cloudflare Pages Function (needs env vars)

## Deployment Options

### Option A: Direct Upload (No Auth Needed)
1. Go to https://dash.cloudflare.com → Pages → Create Project → Direct Upload
2. Project name: `barashop`
3. Upload `barashop-deployment.zip`
4. Result: `https://barashop.pages.dev`

### Option B: GitHub Integration
1. `git push` repo to GitHub
2. Connect Cloudflare Pages to GitHub repo
3. Build: `npm run build` → `dist`

### Option C: Fix API Token Scopes
Current token needs these permissions:
- Account > Cloudflare Pages
- Account > Workers Scripts (for Functions)

Add to `wrangler.toml`:
```toml
account_id = "YOUR_ACCOUNT_ID"
```

Then run: `npx wrangler pages deploy dist`

## Environment Variables Needed (Pages Settings → Variables)
```
BARA_TELEGRAM_BOT_TOKEN = [TOKEN]
BARA_TELEGRAM_CHAT_ID = 459579073
ORDER_TO_EMAIL = thucao@iccjpn.com
RESEND_API_KEY = [optional]
```
