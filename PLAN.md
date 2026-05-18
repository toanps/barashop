# Barashop — Simple Elegant Rose Pre-order Shop

## Goal
Build a minimal Vietnamese online shop for roses in Japan: elegant storefront, mostly pre-order inventory, checkout that notifies email + Telegram, and easy admin updates through an OpenClaw agent.

## MVP scope
1. Public website
   - Home / hero section
   - Rose catalog
   - Product detail pages
   - Checkout flow for pre-orders
   - Japan-only delivery notes
   - Vietnamese-first copy

2. Product model
   - Rose name
   - Color
   - Price
   - Photos
   - Availability: `preorder`, `limited_stock`, `sold_out`
   - Stock quantity optional; default `0` for preorder
   - Lead time text, e.g. `Pre-order: 3-7 days`
   - Featured flag

3. Admin workflow
   - OpenClaw Bara agent can:
     - Add a new rose listing
     - Update price/photos/description
     - Update stock/availability
     - Mark featured products
     - Export catalog backup
   - Prefer file/database updates first; no complex dashboard until needed.

4. Deployment
   - Use Cloudflare Pages free domain: `barashop.pages.dev` if available.
   - Static-first site for simplicity and low maintenance.

## Recommended technical plan
- Framework: Astro static site for simplest MVP.
- Styling: Tailwind CSS, soft rose palette, lots of whitespace.
- Data: `data/roses.json` for MVP.
- Checkout: Cloudflare Pages Function sends order details to `thucao@iccjpn.com` and Telegram.
- Hosting: Cloudflare Pages.
- Domain: Cloudflare-managed free domain/subdomain if available.

## Proposed repo structure
```text
~/projects/barashop/  # project folder; store/domain brand is Barashop
  README.md
  PLAN.md
  agent.md
  data/roses.json
  src/
    pages/
    components/
    styles/
  scripts/
    add-rose.js
    update-stock.js
```

## OpenClaw agent plan
Agent id: `bara`
Agent name: `Bara Agent`
Workspace: `~/.openclaw/workspace-bara`
Project repo: `~/projects/barashop`

Responsibilities:
- Maintain rose catalog data.
- Validate product fields before publishing.
- Keep site simple/elegant; avoid overengineering.
- Deploy/update Cloudflare Pages only after confirmation if it changes public site.
- Never change prices/publish promotions without Toan confirmation.

## Decisions needed from Toan
1. Telegram bot token for the new `bara` OpenClaw agent.
2. Checkout Telegram alerts: send through Bara Agent bot to Toan DM (`459579073`). ✅
3. Email sending method for `thucao@iccjpn.com`: pending provider/API key. Current implementation supports Resend via `RESEND_API_KEY`.
4. Payment method: PayPay or COD. ✅
5. AI-generated placeholder product photos approved if realistic, single flower only, matching color/shape. ✅
6. Cloudflare auth: not found in `~/.credentials`; Wrangler currently says not authenticated. Need Cloudflare login/token before deploy.

## Build phases
### Phase 1 — Project skeleton
- Initialize static site.
- Add Vietnamese elegant landing page and catalog using sample roses. ✅
- Add local scripts to add/update roses. Pending

### Phase 2 — Cloudflare deployment
- Connect repo to Cloudflare Pages.
- Publish to `barashop.pages.dev` if available.
- Add checkout backend: email `thucao@iccjpn.com` + Telegram notification. Implemented with Cloudflare Pages Function; env secrets still needed.

### Phase 3 — OpenClaw manager agent
- Create `~/.openclaw/workspace-bara`.
- Add agent via `scripts/add-agent.sh bara "Bara Agent" ~/.openclaw/workspace-bara <telegram-bot-token>`.
- Give it project-specific instructions and safe deployment rules.
- Restart gateway after config validation.

### Phase 4 — Real catalog
- Generate elegant rose product photos using 9router vision/free-model workflow, then add real photos when available.
- Add real rose varieties/prices.
- Configure stock/pre-order copy.
- Test full customer flow.
