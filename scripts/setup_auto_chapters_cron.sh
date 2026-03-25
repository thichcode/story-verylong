#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$BASE_DIR/logs"
LOG_FILE="$LOG_DIR/auto_chapters.log"
PYTHON_CMD="${PYTHON_CMD:-$(command -v python3)}"
SCRIPT_PATH="$BASE_DIR/scripts/auto_chapters.py"

if [[ ! -x "$PYTHON_CMD" ]]; then
  echo "Python interpreter not found: $PYTHON_CMD" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"

STORY_API_TOKEN="${STORY_API_TOKEN:-}"
STORY_API_URL="${STORY_API_URL:-http://127.0.0.1:8000/api/story/continue}"

if [[ -z "$STORY_API_TOKEN" ]]; then
  echo "STORY_API_TOKEN is required before setting up the cron job." >&2
  exit 1
fi

CRON_COMMAND="cd $BASE_DIR && STORY_API_TOKEN=$(printf '%q' "$STORY_API_TOKEN") STORY_API_URL=$(printf '%q' "$STORY_API_URL") $PYTHON_CMD $SCRIPT_PATH >> $LOG_FILE 2>&1"
CRON_LINE="*/15 * * * * $CRON_COMMAND"

existing_cron="$(crontab -l 2>/dev/null || true)"
if echo "$existing_cron" | grep -F -q "$SCRIPT_PATH"; then
  echo "Existing cron entry detected. Refreshing entry..."
  filtered_cron=$(printf '%s
' "$existing_cron" | grep -F -v "$SCRIPT_PATH" )
else
  filtered_cron="$existing_cron"
fi

{
  printf '%s
' "$filtered_cron"
  printf '%s
' "$CRON_LINE"
} | crontab -

echo "Cron scheduled: $CRON_LINE"

echo "Log output will append to $LOG_FILE"