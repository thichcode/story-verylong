
## Token rotation
- Set the token via `STORY_API_TOKEN` on the FastAPI host.
- Mirror that value as `NEXT_PUBLIC_API_TOKEN` on Vercel.
- Update both before you redeploy; the frontend proxy already injects the header.
