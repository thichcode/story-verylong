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
Next.js 15.5.14 is required so the latest security patches for server actions and image handling are in place. When deploying, run `npm run build` (or `npm run start` for production) which syncs `stories/` via `scripts/copy_stories.js` before compiling. The build may warn about multiple lockfiles; that can be ignored as long as you are running from `frontend/`.
Set environment variables for deployment:
- `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`)
- `NEXT_PUBLIC_API_TOKEN` (same as `STORY_API_TOKEN`)
- `STORY_API_TOKEN` (backend must match)

## Story generation pipeline
Use `scripts/story_pipeline.py` to generate a sample story and save it under `stories/`.
- Prompts now append a short summary of the two most recent chapters and reiterate the story language (default `Tiếng Việt`) so llama.cpp stays on a coherent arc instead of reusing the same beats.

### Cultivation metadata & prompt builder
- The generator consumes `cultivation_standard_v1.json` to keep realm progressions, tags, and arc templates consistent.
- `/api/system/cultivation` exposes the same configuration so the UI or prompt helpers can reuse it.
- Run `scripts/prompt_builder.py` to preview the system prompt that glues styles, tags, progression, and feature knobs together.

### Local LLaMA pipeline
- Set `LLAMA_CMD` so it includes the placeholder `<<PROMPT>>`; the environment string is inserted verbatim into the llama.cpp CLI (e.g. `LLAMA_CMD="./llama.cpp/main -m ./models/ggml-...-q5_0.bin -p \"<<PROMPT>>\" --n_predict 512"`).
- Optionally tune `LLAMA_TIMEOUT` (default `90`) and `LLAMA_MODEL_NAME` (default `llama.cpp`). The generator will default to a codex-style fallback when the local model fails.
- Run `python scripts/story_pipeline.py generate --title "Storm of Jade" --chapters 6 --tone mysterious` to create a story; use `scripts/story_pipeline.py continue --story-id story-123 --chapters 1` to append chapters.
- Each run stores a `generation` record (prompt, chapter count, duration, fallback flag) inside the saved JSON and appends a human-readable entry to `logs/pipeline.log`.

### Auto chapter refresh
- `scripts/auto_chapters.py` walks every stored story and appends a single continuation chapter (up to 24 chapters total).
- Each continuation mirrors the story's pace, focus, tone tags, and feature layers while respecting the cultivation progression rules.
- Schedule this script via cron if you want the gallery to stay alive even when no mock user is pressing "continue". The script now reads `STORY_API_TOKEN` and `STORY_API_URL` from the environment to stay in sync with deployed tokens.

### Scheduling auto chapters
- Run `STORY_API_TOKEN=... STORY_API_URL=http://localhost:8000/api/story/continue ./scripts/setup_auto_chapters_cron.sh` to install a `*/15 * * * *` entry that calls `scripts/auto_chapters.py`, logs to `logs/auto_chapters.log`, and keeps the cron job idempotent.
- The installer rejects missing tokens, refreshes any existing entry that targets the script, and prints the active cron line so you can verify with `crontab -l`.
- Because the cron entry keeps your llama pipeline local, it will use whatever backend endpoint and token you configure in the environment before installation.

### Gallery & Favorites
- The Next.js gallery supports multi-tag filtering, tone/pace selectors, and saved combo presets so readers can pair cultivation, system, and comedy tags.
- Favorites persist in localStorage: the UI remembers your saved tag combos and lets you star any story card for quick reference.

## Token rotation
- Use `scripts/rotate_token.sh` locally or trigger the GitHub Action below.
- GitHub Action `Rotate Story Token` (workflow `rotate-token.yml`) connects to your server via SSH and runs the rotation script.
- Required secrets: `SERVER_USER`, `SERVER_HOST`, `SERVER_SSH_KEY`.

## Configuration
Copy `.env` and customize tokens/URLs before running services.

Add the following variables to wire up the local pipeline and auto-runner:
- `LLAMA_CMD` – command string with `<<PROMPT>>` to insert the chapter prompt (e.g. `LLAMA_CMD="./llama.cpp/main -m ./models/ggml-gpt4all-j.bin -p \"<<PROMPT>>\" --n_predict 512"`).
- `LLAMA_PROMPT_PLACEHOLDER` – override the placeholder token if you prefer something other than `<<PROMPT>>`.
- `LLAMA_TIMEOUT` – time in seconds to wait for the local llama invocation (default `90`).
- `LLAMA_MODEL_NAME` – human-readable tag for logging (default `llama.cpp`).
- `STORY_API_URL` – base URL for `scripts/auto_chapters.py` (defaults to `http://127.0.0.1:8000/api/story/continue`).

## Deployment & E2E smoke tests
1. Ensure environment variables are set (`STORY_API_TOKEN`, `STORY_API_URL`, `LLAMA_CMD`/`LLAMA_*`, `NEXT_PUBLIC_API_TOKEN`, and `NEXT_PUBLIC_API_URL`).
2. Start the backend (`STORY_API_TOKEN=... LLAMA_CMD="" uvicorn app.main:APP --port 8000`) and confirm `http://127.0.0.1:8000/docs` responds.
3. Run `npm run build` inside `frontend/` (it copies stories, compiles Next.js 15.5.14, and emits the new hero/reader bundles).
4. Trigger `./scripts/auto_chapters.py` once to verify cron logic talks to `/api/story/continue` with the same token and that `stories/*.json` gain a new chapter.
5. (Optional) Visit `/reader/<storyId>` after pointing `NEXT_PUBLIC_API_URL` at your backend to see the spotlight reader, log ticker, and CTA triggered by `/api/ai/generate`.

> For a printable checklist version, see `DEPLOYMENT.md`.

## Automatic gallery sync
- The workflow `sync-stories.yml` rebuilds the frontend whenever files inside `stories/` change: it runs `scripts/copy_stories.js`, builds Next.js 15.5.14, and commits the synced JSON to `frontend/data/stories` so the gallery always mirrors the backend state.
- You can also run `scripts/deploy_gallery.sh` locally to copy, build, and verify the cinematic home without waiting for CI.

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


## Telegram model manager command
- Create a Telegram bot (get bot token + chat id) and set `TELEGRAM_MODEL_MANAGER_TOKEN` and `TELEGRAM_MODEL_MANAGER_CHAT` in the environment (or systemd unit) that runs the skill script.
- Run `skills/telegram-model-manager/scripts/telegram_model_manager.py` to listen for `/model_manager start|stop <model-id>` commands from that chat and proxy them to `scripts/model_manager.sh`.
- Make sure the bot user has permission to post in the channel. The script replies with the output of the called command so you can see success or failure in Telegram.
- Example: `/model_manager start qwen3.5-4b` starts the local model via the same CLI as before.
## Auto chapter runner
- Run `scripts/auto_chapters.py` to append a chapter to every story every 15 minutes (setup via cron/task scheduler).
- Requires backend running at http://127.0.0.1:8000 with valid STORY_API_TOKEN.
