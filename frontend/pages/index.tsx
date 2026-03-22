import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
  metadata?: {
    progression?: {
      startRealm?: string;
      targetRealm?: string;
    };
  };
};

type FavoriteSetup = {
  name: string;
  tags: string[];
  tone: string;
  pace: string;
};

const PACE_OPTIONS = ['slow', 'medium', 'fast'];

export default function Home() {
  const [textFilter, setTextFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedPace, setSelectedPace] = useState('');
  const [favoriteSetups, setFavoriteSetups] = useState<FavoriteSetup[]>([]);
  const [setupName, setSetupName] = useState('');
  const [favoriteStories, setFavoriteStories] = useState<string[]>([]);

  const { data: stories = [] } = useSWR<StoryCard[]>('/api/story/list', fetcher, {
    refreshInterval: 60000,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedSetups = window.localStorage.getItem('story-verylong-setups');
    if (storedSetups) {
      setFavoriteSetups(JSON.parse(storedSetups));
    }
    const storedStories = window.localStorage.getItem('story-verylong-story-favorites');
    if (storedStories) {
      setFavoriteStories(JSON.parse(storedStories));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('story-verylong-setups', JSON.stringify(favoriteSetups));
  }, [favoriteSetups]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('story-verylong-story-favorites', JSON.stringify(favoriteStories));
  }, [favoriteStories]);

  const tagPool = useMemo(() => {
    const set = new Set<string>();
    stories.forEach((story) => {
      story.tags.forEach((tag) => set.add(tag));
    });
    return Array.from(set).sort();
  }, [stories]);

  const toneOptions = useMemo(() => {
    const list = new Set<string>();
    stories.forEach((story) => list.add(story.tone));
    return Array.from(list);
  }, [stories]);

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchesText = textFilter
        ? story.title.toLowerCase().includes(textFilter.toLowerCase()) || story.summary.toLowerCase().includes(textFilter.toLowerCase())
        : true;
      const matchesTags = selectedTags.length ? selectedTags.every((tag) => story.tags.includes(tag)) : true;
      const matchesTone = selectedTone ? story.tone === selectedTone : true;
      const matchesPace = selectedPace ? story.pacing === selectedPace : true;
      return matchesText && matchesTags && matchesTone && matchesPace;
    });
  }, [stories, selectedTags, selectedTone, selectedPace, textFilter]);

  const heroStory = filteredStories[0] ?? stories[0];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleSaveSetup = () => {
    const name = setupName.trim();
    if (!name || selectedTags.length === 0) return;
    const normalizedTone = selectedTone || 'epic';
    const normalizedPace = selectedPace || 'medium';
    const newSetup: FavoriteSetup = {
      name,
      tags: selectedTags,
      tone: normalizedTone,
      pace: normalizedPace,
    };
    setFavoriteSetups((prev) => {
      const exists = prev.find((setup) => setup.name === name);
      if (exists) {
        return prev.map((setup) => (setup.name === name ? newSetup : setup));
      }
      return [...prev, newSetup];
    });
    setSetupName('');
  };

  const applySetup = (setup: FavoriteSetup) => {
    setSelectedTags(setup.tags);
    setSelectedTone(setup.tone);
    setSelectedPace(setup.pace);
  };

  const toggleStoryFavorite = (storyId: string) => {
    setFavoriteStories((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  const formatUpdated = (value?: string) => {
    if (!value) return '--';
    return new Date(value).toLocaleString();
  };

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
          <div className={styles.heroDetails}>
            <span>
              {heroStory?.metadata?.progression?.startRealm ?? 'Luyện Khí'} → {heroStory?.metadata?.progression?.targetRealm ?? 'Nguyên Anh'}
            </span>
            <span>Pace: {heroStory?.pacing ?? 'medium'}</span>
            <span>Updated: {formatUpdated(heroStory?.updatedAt)}</span>
          </div>
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
        <div className={styles.filterColumns}>
          <div>
            <p className={styles.filterLabel}>Tags</p>
            <div className={styles.tagGrid}>
              {tagPool.slice(0, 24).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tagButton} ${selectedTags.includes(tag) ? styles.tagButtonActive : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.selectorRow}>
            <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)}>
              <option value="">Any tone</option>
              {toneOptions.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
            <select value={selectedPace} onChange={(e) => setSelectedPace(e.target.value)}>
              <option value="">Any pace</option>
              {PACE_OPTIONS.map((pace) => (
                <option key={pace} value={pace}>
                  {pace}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.setupRow}>
          {favoriteSetups.length === 0 && <span className={styles.setupHint}>Save combos for quick reuse</span>}
          {favoriteSetups.map((setup) => (
            <button
              key={setup.name}
              type="button"
              className={styles.setupButton}
              onClick={() => applySetup(setup)}
            >
              {setup.name}
            </button>
          ))}
        </div>
        <div className={styles.setupForm}>
          <input
            placeholder="Setup name"
            value={setupName}
            onChange={(e) => setSetupName(e.target.value)}
          />
          <button type="button" onClick={handleSaveSetup}>
            Save Setup
          </button>
        </div>
      </div>
      <div className={styles.gallery}>
        {filteredStories.map((story) => {
          const isFavorite = favoriteStories.includes(story.id);
          return (
            <div key={story.id} className={styles.card} data-story-card>
              <div>
                <div className={styles.tags}>
                  {story.tags.slice(0, 6).map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <h3>{story.title}</h3>
                <p>{story.summary}</p>
              </div>
              <div className={styles.toolbar}>
                <div className={styles.logMeta}>
                  <span>Chapters: {story.chapters?.length ?? '--'}</span>
                  <span>Lang: {story.language ?? 'EN'}</span>
                  <span>Progression: {story.metadata?.progression?.startRealm ?? '--'}</span>
                </div>
                <div className={styles.buttons}>
                  <Link href={`/reader/${story.id}`} passHref>
                    <button className={styles.reader}>Open Reader</button>
                  </Link>
                  <button
                    className={`${styles.continue} ${isFavorite ? styles.favoriteActive : ''}`}
                    type="button"
                    onClick={() => toggleStoryFavorite(story.id)}
                    aria-pressed={isFavorite}
                  >
                    {isFavorite ? '★ Favorited' : '☆ Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
