# Deployment & Automation Checklist

Use this checklist whenever you deploy Story VeryLong locally or to production.

## 1. Set environment variables
- `STORY_API_TOKEN`: shared secret used by both FastAPI and Next.js (`NEXT_PUBLIC_API_TOKEN`).
- `STORY_API_URL`: backend endpoint for auto chapters (default `http://127.0.0.1:8000/api/story/continue`).
- `LLAMA_CMD`: a CLI string containing `<<PROMPT>>` that launches your llama.cpp binary with the prompt injected (e.g. `"./llama.cpp/main -m ./models/ggml-gpt4all-j.bin -p \"<<PROMPT>>\" --n_predict 512"`).
- `LLAMA_TIMEOUT`, `LLAMA_MODEL_NAME`, `LLAMA_PROMPT_PLACEHOLDER`, `NEXT_PUBLIC_API_URL`: set to match your deployment topology.

## 2. Start the backend
```bash
cd story-verylong
STORY_API_TOKEN=... LLAMA_CMD="" uvicorn app.main:APP --port 8000
```
- Check `http://127.0.0.1:8000/api/system/status` and `/api/story/list` respond with JSON.
- Watch `logs/pipeline.log` for collar entries whenever the generator runs.

## 3. Build/get the frontend ready
```bash
cd story-verylong/frontend
npm install
npm run build
```
- This copies `stories/` before compiling (via `scripts/copy_stories.js`).
- Next.js 15.5.14 is required for all security fixes noted in the project issue tracker.
- The build output will describe the new hero, trending slider, and reader assets.

## 4. Validate automation
```bash
STORY_API_TOKEN=... STORY_API_URL=http://127.0.0.1:8000/api/story/continue ./scripts/auto_chapters.py
```
- Every story gets a new chapter appended (capped at 24). Check `stories/*.json` to see updated `generation` metadata and new `chapters`/`next_paths`.
- Cron install script `./scripts/setup_auto_chapters_cron.sh` can be used to schedule this every 15 minutes.

## 5. Optional UI smoke test
- Run the frontend with `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 npm run dev` and visit `/`.
- Click the animated CTA (`Generate Story`) to hit `/api/ai/generate`.
- Visit `/reader/<story-id>` to confirm the spotlight grid, gradient toolbar, and pipeline ticker render correctly.

## 6. Post-deploy notes
- Monitor `logs/auto_chapters.log` for cron output and `logs/pipeline.log` for generation events.
- If you rotate the story token, rerun the cron installer (it echoes the `*/15 * * * *` command).
- Keep `next` at 15.5.14 to benefit from all patched vulnerabilities.
