# Bara Agent — Barashop Project Notes

You manage `~/projects/barashop`, the Barashop rose pre-order shop.

Context:
- Store name: Barashop
- Language: Vietnamese first
- Currency: JPY
- Delivery: Japan only
- Domain target: `barashop.pages.dev`
- Checkout notifications: email `thucao@iccjpn.com` + Telegram
- Roses are mostly pre-order; default stock should be zero unless confirmed.

Principles:
- Keep it simple; static-first beats complex services.
- Public-facing changes require verification before reporting done.
- Ask Toan before changing prices, publishing promotions, enabling payment collection, or deploying public changes.
- Prefer catalog data updates via structured JSON/scripts.
- Generate product photos only when requested/approved; avoid misleading claims that AI images are real photos.

Primary workflows:
- Add rose listing
- Update stock / availability
- Update Vietnamese copy/photos
- Prepare deployment to Cloudflare Pages
- Maintain checkout notification flow

Catalog tooling:
- Preferred CLI/CRM: `npm run bara -- ...` from repo root, implemented in `scripts/barashop-cli.js`; full docs in `BARASHOP_CLI.md`.
- The site remains static-first and reads `data/roses.json`; the CLI uses private local SQLite `data/barashop.sqlite` and exports back to JSON.
- Common commands:
  - `npm run bara -- init`
  - `npm run bara -- list`
  - `npm run bara -- search <keyword>`
  - `npm run bara -- add --id <id> --name "..." --color "..." --price 5000 --image /images/<id>.png`
  - `npm run bara -- update <id> --description "..."`
  - `npm run bara -- status <id> instock|preorder|out_of_order [stock]`
  - `npm run bara -- stock <id> <N>`
  - `npm run bara -- delete <id>` — ask Toan first.
  - `npm run bara -- export`
- CRM commands also exist for local customers/orders: `customers`, `customer:add`, `customer:update`, `orders`, `order:add`.
- Do not commit `data/barashop.sqlite`; it may contain customer/order information and is ignored by git.
- Legacy helpers still exist: `scripts/add-rose.js`, `scripts/update-stock.js`, `scripts/deploy-manual.sh`.
- After catalog edits, run `npm run bara -- export` then `npm run build`; only deploy/report public changes after verification.

Current handoff (2026-05-18):
- Toan assigned Bara Agent to own Barashop web work going forward.
- Latest pushed commit on `main`: `7afa0ca` (`chore: rename local project path to barashop`). Recent prior commits: `4f40e92` (`feat: add local Barashop CRM CLI`), `40d3d6a` (`Update rose product photos and pricing`), `a27c678` (`Update collection intro copy`), `2eac037` (`Fix Cloudflare Pages wrangler config`), `6571758`, `c4e04de`, `bbd186c`.
- Recent UI update changed the collection heading to `Một bông hồng đẹp nhất cho cưới`, description to `Hãy chọn mẫu yêu thích, thêm vào giỏ hoa của bạn.`, preorder display to `Preorder`, and cart status to show total cart count.
- Catalog state as of handoff: 16 rose items, all `price: 5000`, `currency: JPY`, AI placeholder photos in `/public/images` and `/dist/images`.
- Cloudflare Pages config fix: removed unsupported `[build]` block from `wrangler.toml`; Pages accepts `pages_build_output_dir = "dist"`.
- Verification: `npm run bara -- init`, `npm run bara -- list`, `npm run bara -- search naomi`, and `npm run build` passed after the CLI/catalog work; `https://barashop.pages.dev` returned HTTP 200 during main-agent check.
- Deployment: manual deploy uses `scripts/deploy-manual.sh` and requires `CLOUDFLARE_API_TOKEN` from `.dev.vars` or environment. GitHub-connected Cloudflare Pages may auto-deploy from `main`.
