import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

type StoryCard = {
  id: string;
  title: string;
  genre: string;
  tone: string;
  summary: string;
  language?: string;
  chapters?: number;
};

const STORIES_DIR = path.resolve(process.cwd(), 'stories');

const normalize = (data: any): StoryCard => ({
  id: data.id,
  title: data.title,
  genre: data.genre ?? 'Fantasy',
  tone: data.tone ?? 'epic',
  summary: data.summary ?? data.chapters?.[0]?.sections?.[0] ?? '',
  language: data.language ?? 'English',
  chapters: data.chapters?.length ?? 0,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const files = await fs.readdir(STORIES_DIR).catch(() => []);
    const cards: StoryCard[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(STORIES_DIR, file), 'utf-8');
        const data = JSON.parse(raw);
        cards.push(normalize(data));
      } catch (error) {
        continue;
      }
    }
    return res.status(200).json(cards);
  } catch (error) {
    const fallback: StoryCard[] = [];
    return res.status(200).json(fallback);
  }
}
