import type { NextApiRequest, NextApiResponse } from 'next';

const API_URL = process.env.STORY_API_URL || 'http://127.0.0.1:8000';
const TOKEN = process.env.STORY_API_TOKEN || 'omni-token';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const response = await fetch(`${API_URL}/api/story/continue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(req.body),
  });
  const data = await response.text();
  res.status(response.status).send(data);
}
