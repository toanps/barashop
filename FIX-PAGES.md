# Fix Barashop Cloudflare Pages Deployment

## Problem
The deployment failed because Cloudflare Pages tried to run `npx wrangler deploy` after build.
Pages auto-deploys - we don't need a deploy command.

## Solution

### Option 1: Dashboard Fix (Recommended)
1. Go to https://dash.cloudflare.com → Pages → barashop project
2. Click **Settings** → **Build & Deploy**
3. **Remove the Deploy command** (leave empty)
4. Keep only:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Click **Save**
6. Trigger redeploy: **Deployments** → **Retry** or push new commit

### Option 2: Check if Project Exists
If `barashop` project doesn't appear in Pages:
1. Go to Pages → **Create a project**
2. Select **Connect to Git**
3. Choose `toanps/barashop`
4. Settings:
   - Project name: `barashop`
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. **Deploy command: LEAVE EMPTY**
6. Click **Save and Deploy**

## Current Repo Status
- https://github.com/toanps/barashop
- Build: ✅ works
- Deploy: ❌ deploy command needs removal
