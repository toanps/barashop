# Barashop Deployment Instructions

## Option 1: Direct Upload (Fastest)

1. Go to https://dash.cloudflare.com/
2. Navigate to **Pages** → **Create a project** → **Direct Upload**
3. Project name: `barashop`
4. Upload the `barashop-deployment.zip` file
5. Click "Deploy site"

## Option 2: GitHub Integration

1. Push this repo to GitHub
2. Connect in Cloudflare Pages dashboard
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`

## Required Environment Variables (in Pages Settings → Variables)

- `BARA_TELEGRAM_BOT_TOKEN` - The Bara Agent bot token
- `BARA_TELEGRAM_CHAT_ID` = `459579073`
- `ORDER_TO_EMAIL` = `thucao@iccjpn.com`
- `RESEND_API_KEY` - (optional, for email delivery)

## Current Status
- Static site built and ready
- Checkout function implemented (requires env vars for full functionality)
- AI-generated placeholder image included
