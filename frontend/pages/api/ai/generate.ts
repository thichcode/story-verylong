import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.STORY_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_TOKEN = process.env.STORY_API_TOKEN || process.env.NEXT_PUBLIC_API_TOKEN;

const DEFAULT_PAYLOAD = {
  title: 'Signal in the Ember Citadel',
  genres: ['Fantasy', 'Sci-Fi'],
  subGenres: ['Neon Court', 'Arcane Engineering'],
  tone: 'mysterious',
  toneTags: ['mystic radio', 'directive pulse'],
  powerStyles: ['systemic intrigue'],
  focus: 'tracking a rogue gateway signal through sky-forged courts',
  chapters: 4,
  language: 'English',
  progression: {
    startRealm: 'Luyện Thể',
    targetRealm: 'Nguyên Anh',
    pace: 'fast',
  },
  features: {
    systemMode: true,
    romanceLevel: 2,
    comedyLevel: 1,
    darknessLevel: 3,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  if (!BACKEND_URL || !API_TOKEN) {
    return res.status(500).json({ error: 'Missing STORY_API_TOKEN or STORY_API_URL configuration.' });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/story`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(DEFAULT_PAYLOAD),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ error: payload.detail || payload.error || 'Generation failed' });
    }
    return res.status(200).json(payload);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? 'Backend unreachable.' });
  }
}
