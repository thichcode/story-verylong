import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

type StoryCard = {
  id: string;
  title: string;
  summary: string;
  language?: string;
  chapters?: any[];
  tags: string[];
  genres: string[];
  subGenres: string[];
  tone: string;
  toneTags: string[];
  powerStyles: string[];
  pacing: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
};

const STORIES_DIR = path.resolve(process.cwd(), '..', 'stories');

const normalize = (data: any): StoryCard => ({
  id: data.id,
  title: data.title,
  genres: data.genres ?? (data.genre ? [data.genre] : ['Fantasy']),
  subGenres: data.subGenres ?? [],
  tone: data.tone ?? 'epic',
  toneTags: data.toneTags ?? [data.tone ?? 'epic'],
  powerStyles: data.powerStyles ?? [],
  pacing: data.pacing ?? 'medium',
  tags:
    data.tags ??
    Array.from(new Set([...(data.genres || []), ...(data.subGenres || []), data.tone ?? 'epic'])).filter(
      Boolean
    ),
  summary: data.summary ?? data.chapters?.[0]?.sections?.[0] ?? '',
  language: data.language ?? 'English',
  chapters: data.chapters?.length ?? 0,
  updatedAt: data.updated_at ?? data.updatedAt,
  metadata: data.metadata ?? {},
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
