import type { NextApiRequest, NextApiResponse } from 'next';

const API_URL = process.env.STORY_API_URL || 'http://127.0.0.1:8000';
const TOKEN = process.env.STORY_API_TOKEN || 'omni-token';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = await fetch(`${API_URL}${req.url?.replace('/api', '')}`, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
  });
  const data = await response.text();
  res.status(response.status).send(data);
}
