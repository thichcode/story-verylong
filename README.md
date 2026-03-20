# Story VeryLong

A flagship site that builds long-form stories on demand. The UI is inspired by Crucix-style command centers and calls a local FastAPI pipeline that outlines and drafts each chapter sequentially.

## Quickstart
```bash
pip install -r requirements.txt
uvicorn app.main:APP --reload --port 8000
```

## API
- `POST /api/story` – send `{title, genre, tone, chapters, focus}` and receive outline + chapters.
- `GET /stories` – list generated story IDs.

## Assets
- `static/index.html` – landing page with form + output. Deploy anywhere (Vercel-friendly) and proxy to backend.
- `scripts/story_pipeline.py` – sample CLI runner builtin to produce one story for testing.

## Deploy
You can serve the backend locally and point a Vercel/Netlify static frontend to the API URL.
