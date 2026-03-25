import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

const STORIES_DIR = path.resolve(process.cwd(), '..', 'stories');
const LOG_FILE = path.resolve(process.cwd(), '..', 'logs', 'pipeline.log');

type PipelineEntry = {
  story_id: string;
  action: string;
  model: string;
  chapters: number;
  fallback: boolean;
  duration: number;
  prompt: string;
  timestamp: string;
};

type StoryRecord = {
  id?: string;
  title?: string;
  updated_at?: string;
  updatedAt?: string;
  chapters?: any[];
};

type LatestChapterInfo = {
  storyId: string;
  storyTitle: string;
  chapterIndex: number;
  summary: string;
  updatedAt?: string;
};

type StatusPayload = {
  llama?: {
    status: string;
    model?: string;
    lastRun?: string;
    durationSeconds?: number;
    fallbackUsed?: boolean;
    message?: string;
    chapters?: number;
  };
  latestChapter?: LatestChapterInfo;
};

const readPipelineEntry = async (): Promise<PipelineEntry | null> => {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8');
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) {
      return null;
    }
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      try {
        const entry = JSON.parse(lines[i]) as PipelineEntry;
        if (entry && entry.timestamp) {
          return entry;
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

const readStories = async (): Promise<StoryRecord[]> => {
  try {
    const files = await fs.readdir(STORIES_DIR);
    const records: StoryRecord[] = [];
    await Promise.all(
      files.map(async (file) => {
        if (!file.endsWith('.json')) return;
        try {
          const raw = await fs.readFile(path.join(STORIES_DIR, file), 'utf-8');
          const story = JSON.parse(raw);
          records.push(story);
        } catch (error) {
          // ignore corrupt files
        }
      })
    );
    return records;
  } catch (error) {
    return [];
  }
};

const pickLatestChapter = (stories: StoryRecord[]): LatestChapterInfo | null => {
  if (!stories.length) return null;
  const normalized = stories
    .map((story) => ({
      ...story,
      updatedAt: story.updated_at || story.updatedAt,
    }))
    .sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  const top = normalized[0];
  if (!top) return null;
  const chapters = Array.isArray(top.chapters) ? top.chapters : [];
  const last = chapters.length ? chapters[chapters.length - 1] : null;
  const summary = last?.cliffhanger || last?.sections?.[0] || '';
  return {
    storyId: top.id ?? 'unknown',
    storyTitle: top.title ?? 'Untitled',
    chapterIndex: chapters.length,
    summary: summary || 'Awaiting the next passage.',
    updatedAt: top.updatedAt,
  };
};

const buildPipelineStatus = (entry: PipelineEntry | null) => {
  if (!entry) {
    return undefined;
  }
  const lastRunTime = entry.timestamp;
  const deltaMs = lastRunTime ? Date.now() - new Date(lastRunTime).getTime() : Infinity;
  const status = deltaMs < 5 * 60 * 1000 ? 'Nominal' : 'Idle';
  return {
    status,
    model: entry.model,
    lastRun: lastRunTime,
    durationSeconds: entry.duration,
    fallbackUsed: entry.fallback,
    chapters: entry.chapters,
    message: entry.fallback ? 'Fallback was activated in the last run.' : 'Pipeline answered with a clean run.',
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<StatusPayload>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const [entry, stories] = await Promise.all([readPipelineEntry(), readStories()]);
  const pipeline = buildPipelineStatus(entry);
  const latestChapter = pickLatestChapter(stories);
  res.status(200).json({
    llama: pipeline,
    latestChapter: latestChapter ?? undefined,
  });
}
