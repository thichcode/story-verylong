#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$BASE_DIR"
node scripts/copy_stories.js

cd "$BASE_DIR/frontend"
npm install
npm run build
