import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { storyId } = req.query;
  if (!storyId || typeof storyId !== 'string') {
    return res.status(400).json({ detail: 'Missing story id' });
  }
  const baseDir = path.join(process.cwd(), '..', 'stories');
  const filePath = path.join(baseDir, `${storyId}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const payload = JSON.parse(raw);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(404).json({ detail: 'Not Found' });
  }
}
