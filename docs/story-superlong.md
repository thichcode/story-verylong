# Story Superlong

## Overview
`story-superlong` is a dedicated experience focused on generating long-form narratives on demand. It includes:
- A **FastAPI backend** that outlines stories, drafts chapters, supports continuation, and exports results.
- A **Next.js frontend** deployed on Vercel that provides a Crucix-inspired UI for authors.
- A **story pipeline script** (`scripts/story_pipeline.py`) that can be run via CRON/CI to seed samples.

## Architecture
1. **Backend (`app/`)**
   - `/api/story`: generate outline + chapters from a brief.
   - `/api/story/continue`: append more chapters with optional tone switch.
   - `/stories`: list generated story IDs, stored in `stories/*.json`.
   - `/api/story/export/{id}` (planned) will stream Markdown + trigger TTS export.
2. **Frontend (`frontend/`)**
   - React/Next.js SPA with form controls for title/genre/tone/chapters, story history list, and render preview.
   - `pages/api/story.ts` proxies requests through `NEXT_PUBLIC_API_URL` + token.
3. **Assets + scripts**
   - `static/` holds legacy static page for local development.
   - `scripts/story_pipeline.py` can seed a story for QA or scheduled runs.
   - `send_stock_report` etc remain in other repo.

## Deployment (Vercel + backend)
1. Deploy backend FastAPI somewhere reachable (e.g., `http://YOUR_HOST:8000`). Ensure:
   - The app listens on `0.0.0.0`, uses token auth (`AUTH_CONFIG.token` or env override).  
   - TLS/reverse proxy added if exposing over the internet.
2. Deploy frontend by pointing Vercel to `story-verylong/frontend/`. Set env vars:
   - `NEXT_PUBLIC_API_URL=https://YOUR_HOST/api`
   - `NEXT_PUBLIC_API_TOKEN=<same token>`
   - (Optional) `NEXT_PUBLIC_BUILD_STAGE=vercel`
3. Vercel runs `npm run build` and serves interactive UI. The mounted API proxy in `pages/api/story.ts` adds the Authorization header so tokens are never leaked client-side.

## Security
- Rotate `AUTH_CONFIG.token` in `story-verylong/app/main.py` or `config.yaml` whenever needed.
- Keep backend behind TLS / firewall and limit access to the Vercel IP ranges if possible.
- Revoke previous tokens by updating env vars on Vercel and restarting the backend.

## Automation / Cron
- `scripts/story_pipeline.py` run via cron to create curated samples (e.g. nightly). Output stored as JSON for auditing.
- Future stages include export-to-markdown/TTS and a small admin view to display story history + actions.

## QA / Release Checklist
- ✅ Story generation form is functional (calls backend, renders chapters).
- ✅ Continue kit appends text and updates metadata.
- ✅ Next.js front-end builds (`npm run build`) before deployment.
- ✅ Vercel env vars configured and pointing to correct backend.
- ✅ Token rotation is documented.

Once deployed, you can route users to the Vercel site, and they will interact with the local FastAPI backend via the secure proxy.