# Story VeryLong

A flagship site that builds long-form stories on demand. The UI is inspired by Crucix-style command centers and calls a local FastAPI pipeline that outlines and drafts each chapter sequentially.

## Quickstart Backend
```bash
pip install -r requirements.txt
STORY_API_TOKEN=replace-with-secret uvicorn app.main:APP --reload --port 8000
```

## Frontend (Next.js for Vercel)
```bash
cd frontend
npm install
npm run dev
```
Set environment variables for deployment:
- `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`)
- `NEXT_PUBLIC_API_TOKEN` (same as `STORY_API_TOKEN`)
- `STORY_API_TOKEN` (backend must match)

## Story generation pipeline
Use `scripts/story_pipeline.py` to generate a sample story and save it under `stories/`.

### Cultivation metadata & prompt builder
- The generator consumes `cultivation_standard_v1.json` to keep realm progressions, tags, and arc templates consistent.
- `/api/system/cultivation` exposes the same configuration so the UI or prompt helpers can reuse it.
- Run `scripts/prompt_builder.py` to preview the system prompt that glues styles, tags, progression, and feature knobs together.

### Auto chapter refresh
- `scripts/auto_chapters.py` walks every stored story and appends a single continuation chapter (up to 24 chapters total).
- Each continuation mirrors the story's pace, focus, tone tags, and feature layers while respecting the cultivation progression rules.
- Schedule this script via cron if you want the gallery to stay alive even when no mock user is pressing "continue".

### Gallery & Favorites
- The Next.js gallery supports multi-tag filtering, tone/pace selectors, and saved combo presets so readers can pair cultivation, system, and comedy tags.
- Favorites persist in localStorage: the UI remembers your saved tag combos and lets you star any story card for quick reference.

## Token rotation
- Use `scripts/rotate_token.sh` locally or trigger the GitHub Action below.
- GitHub Action `Rotate Story Token` (workflow `rotate-token.yml`) connects to your server via SSH and runs the rotation script.
- Required secrets: `SERVER_USER`, `SERVER_HOST`, `SERVER_SSH_KEY`.

## Configuration
Copy `.env` and customize tokens/URLs before running services.

## Security
- fail2ban watches /var/log/story-superlong/auth.log and bans IPs after 3 unauthorized token attempts within 10 minutes (bantime=1h).
- Reverse proxy (TLS/rate-limit) advised before hitting /api/story.

## Command Tracking
- Use `scripts/track_command.sh <command>` to log a command run (build/test/etc.).
- The tracker writes to `logs/commands.json` and is fronted by `docs/command-tracker.html`.
- Open the HTML via a static server (e.g., `npx http-server docs`) to watch live updates.

## Crypto Watchlist Ideas
- Call `scripts/crypto_thien_thoi.py` to compute Thiên thời/Địa lợi/Nhân hòa signal and write `crypto/signals/latest.json`.
- Sources in `docs/crypto-sources.md` feed `scripts/crypto_thien_thoi.py` for macro news.
- Feed the resulting signal into your watchlist cron (`scripts/crypto_watchlist_cron.sh` or similar) for alerts.

## Auto chapter runner
- Run `scripts/auto_chapters.py` to append a chapter to every story every 15 minutes (setup via cron/task scheduler).
- Requires backend running at http://127.0.0.1:8000 with valid STORY_API_TOKEN.
