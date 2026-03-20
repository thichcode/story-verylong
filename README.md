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
- `NEXT_PUBLIC_URL` (optional alias for the API URL)
- `NEXT_PUBLIC_API_TOKEN` (same as `STORY_API_TOKEN`)
- `STORY_API_TOKEN` (backend must match)

## Story generation pipeline
Use `scripts/story_pipeline.py` to generate a sample story and save it under `stories/`.

## Token rotation
- Use `scripts/rotate_token.sh` locally or trigger the GitHub Action below.
- GitHub Action `Rotate Story Token` (workflow `rotate-token.yml`) connects to your server via SSH and runs the rotation script.
- Required secrets: `SERVER_USER`, `SERVER_HOST`, `SERVER_SSH_KEY`.

## Configuration
Copy `.env` and customize tokens/URLs before running services.

Backend will read `STORY_API_TOKEN` or its alias `NEXT_PUBLIC_API_TOKEN`, and `STORY_API_URL` or `NEXT_PUBLIC_URL` so your Vercel env names stay compatible.

## Security
- fail2ban watches /var/log/story-superlong/auth.log and bans IPs after 3 unauthorized token attempts within 10 minutes (bantime=1h).
- Reverse proxy (TLS/rate-limit) advised before hitting /api/story.
