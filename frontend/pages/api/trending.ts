import type { NextApiRequest, NextApiResponse } from 'next';

const API_URL = process.env.STORY_API_URL || 'http://127.0.0.1:8000';
const TOKEN = process.env.STORY_API_TOKEN || 'omni-token';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const response = await fetch(`${API_URL}/api/trending`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });
  const data = await response.text();
  res.status(response.status).send(data);
}
