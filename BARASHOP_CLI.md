# Barashop local CLI + CRM

Barashop stays static-first: the website still reads `data/roses.json`. The local CRM/catalog database is `data/barashop.sqlite`, ignored by git. Use the CLI to edit data locally, then export back to `data/roses.json` before build/deploy.

## Setup

```bash
npm install
npm run bara -- init
```

`init` creates the SQLite CRM database and imports the current `data/roses.json` catalog if the DB is empty.

## Catalog commands

Statuses for daily use:

- `instock` — available locally in Japan
- `preorder` — order first, lead time needed
- `out_of_order` — unavailable

The static JSON keeps the old site-compatible values:

- `instock` exports as `limited_stock`
- `preorder` exports as `preorder`
- `out_of_order` exports as `sold_out`

```bash
# List and search
npm run bara -- list
npm run bara -- list --status preorder
npm run bara -- search sakura

# Add item with a real/manual photo
npm run bara -- add \
  --id hong-moi-test \
  --name "Hồng mới Test" \
  --color "Đỏ" \
  --price 5000 \
  --image /images/hong-moi-test.png

# Add item with static local generated copy and an AI placeholder SVG
npm run bara -- add \
  --id hong-moi-ai \
  --name "Hồng mới AI" \
  --color "Đỏ nhung" \
  --price 5000 \
  --auto-description \
  --auto-photo

# Generate fields for an existing item, without changing price/status/stock/deletion
npm run bara -- generate hong-moi-test --description
npm run bara -- generate hong-moi-test --photo
npm run bara -- generate hong-moi-test --description --photo --overwrite

# Update item fields
npm run bara -- update hong-moi-test --price 5500 --description "Mô tả tiếng Việt."

# Change status / stock
npm run bara -- status hong-moi-test instock 3
npm run bara -- status hong-moi-test preorder
npm run bara -- status hong-moi-test out_of_order
npm run bara -- stock hong-moi-test 5

# Delete item
npm run bara -- delete hong-moi-test

# Manual sync if needed
npm run bara -- import   # data/roses.json -> SQLite
npm run bara -- export   # SQLite -> data/roses.json
```

Most catalog write commands automatically export `data/roses.json` so the static site stays updated.

## Generated descriptions and placeholder photos

The generator is static-first and local: it uses the rose name/color/style text to create Vietnamese copy and a deterministic SVG in `public/images/`. It does not call external image APIs, does not need secrets, and does not change price, stock, status, or delete anything.

Generated SVGs are AI placeholders, not real product photos. The SVG metadata and visible text include `AI placeholder`; keep them as temporary catalog placeholders until Toan replaces them with verified real photos. If an existing item already has a description or image, `generate` refuses to overwrite it unless `--overwrite` is provided.

## CRM commands

```bash
# Customers
npm run bara -- customers
npm run bara -- customer:add --name "Nguyen A" --contact "090-0000-0000" --email a@example.com --address "Tokyo"
npm run bara -- customer:update 1 --notes "Thích hoa đỏ, nhận cuối tuần"

# Orders
npm run bara -- orders
npm run bara -- order:add \
  --name "Nguyen A" \
  --contact "090-0000-0000" \
  --items hong-do-naomi:2,hong-phan-sakura:1 \
  --payment PayPay \
  --address "Tokyo"
```

Orders store item snapshots, totals in JPY, payment method, status, address, and notes in the local SQLite DB.

## Verify before publishing

```bash
npm run bara -- export
npm run build
```

Do not commit `data/barashop.sqlite`; it is local CRM data and may contain customer/order information.
