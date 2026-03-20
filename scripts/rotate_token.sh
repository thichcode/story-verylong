#!/usr/bin/env bash
set -euo pipefail
TOKEN=$(openssl rand -hex 16)
ENV_FILE=/root/.openclaw/workspace/story-verylong/.env
SERVICE_FILE=/etc/systemd/system/story-superlong.service
sed -i "s/^STORY_API_TOKEN=.*/STORY_API_TOKEN=${TOKEN}/" "$ENV_FILE"
sed -i "s/^NEXT_PUBLIC_API_TOKEN=.*/NEXT_PUBLIC_API_TOKEN=${TOKEN}/" "$ENV_FILE"
sed -i "s/^Environment=STORY_API_TOKEN=.*/Environment=STORY_API_TOKEN=${TOKEN}/" "$SERVICE_FILE"
systemctl daemon-reload
systemctl restart story-superlong.service
echo "New token: ${TOKEN}"