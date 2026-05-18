# Barashop Cloudflare Pages Setup

## Dashboard Setup (Easiest)

1. Go to https://dash.cloudflare.com → Pages → **Create a project**
2. **Connect to Git** → Select `toanps/barashop`
3. **Build settings**:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: (leave empty or `/`)
4. **Environment Variables** (add after creation):
   ```
   CF_API_TOKEN = cfut_5HYdeK4O... (the token)
   ORDER_TO_EMAIL = thucao@iccjpn.com
   BARA_TELEGRAM_CHAT_ID = 459579073
   BARA_TELEGRAM_BOT_TOKEN = *** bot token ***
   ```
5. Click **Save and Deploy**

## GitHub Actions Alternative (if you have proper PAT)

If you want GitHub Actions to auto-deploy:
1. Create GitHub Personal Access Token with `workflow` scope
2. Run: `git push` after adding the `/.github` folder
3. Add secrets in GitHub repo → Settings → Secrets:
   - `CF_API_TOKEN` = cfut_5HYdeK4O...
   - `CF_ACCOUNT_NAME` = your cloudflare account name
