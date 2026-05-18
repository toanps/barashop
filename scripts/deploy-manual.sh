#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .dev.vars ]]; then
  set -a
  # shellcheck disable=SC1091
  source .dev.vars
  set +a
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN. Put it in .dev.vars or export it before deploy." >&2
  exit 1
fi

npm run build
npx wrangler pages deploy dist --project-name=barashop --branch=main
