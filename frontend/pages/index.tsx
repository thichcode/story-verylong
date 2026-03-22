import useSWR from 'swr';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type StoryCard = {
  id: string;
  title: string;
  genre: string;
  tone: string;
  summary: string;
  chapters: any[];
  language?: string;
};

export default function Home() {
  const [textFilter, setTextFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const { data: stories = [] } = useSWR<StoryCard[]>('/api/story/list', fetcher, { refreshInterval: 60000 });

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchesGenre = genreFilter ? story.genre.toLowerCase().includes(genreFilter.toLowerCase()) : true;
      const matchesText = textFilter
        ? story.title.toLowerCase().includes(textFilter.toLowerCase()) || story.summary.toLowerCase().includes(textFilter.toLowerCase())
        : true;
      return matchesGenre && matchesText;
    });
  }, [stories, genreFilter, textFilter]);

  const heroStory = filteredStories[0] ?? stories[0];

  return (
    <div>
      <Head>
        <title>Story VeryLong — Gallery</title>
      </Head>
      <div className={styles.hero} role="region" aria-label="Featured story">
        <div className={styles.heroContent}>
          <p>Story VeryLong</p>
          <h1>{heroStory?.title ?? 'Forge cinematic sagas'}</h1>
          <p>{heroStory?.summary ?? 'Generate immersive long-form stories with AI.'}</p>
          {heroStory && (
            <Link href={`/reader/${heroStory.id}`} passHref>
              <button>Enter Reader</button>
            </Link>
          )}
        </div>
      </div>
      <div className={styles.filters}>
        <input
          placeholder="Search stories"
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
        />
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          <option value="">All genres</option>
          {[...new Set(stories.map((s) => s.genre))].map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
        <input placeholder="Language" value={heroStory?.language ?? ''} readOnly />
      </div>
      <div className={styles.gallery}>
        {filteredStories.map((story) => (
          <div key={story.id} className={styles.card}>
            <div>
              <div className={styles.tags}>
                <span className={styles.tag}>{story.genre}</span>
                <span className={styles.tag}>{story.tone}</span>
              </div>
              <h3>{story.title}</h3>
              <p>{story.summary}</p>
            </div>
            <div className={styles.toolbar}>
              <div className={styles.logMeta}>
                <span>Chapters: {story.chapters?.length ?? '--'}</span>
                <span>Lang: {story.language ?? 'EN'}</span>
              </div>
              <div className={styles.buttons}>
                <Link href={`/reader/${story.id}`} passHref>
                  <button className={styles.reader}>Open Reader</button>
                </Link>
                <button className={styles.continue}>Track progress</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
