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

## Configuration
Copy `.env` and customize tokens/URLs before running services.
