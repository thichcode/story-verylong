import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const PACE_OPTIONS = ['slow', 'medium', 'fast'];

type StoryCard = {
  id: string;
  title: string;
  summary: string;
  language?: string;
  chapters?: number;
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
    continuity?: {
      focus?: string;
    };
  };
};

type LlamaStatus = {
  status: string;
  model?: string;
  lastRun?: string;
  durationSeconds?: number;
  fallbackUsed?: boolean;
  message?: string;
  chapters?: number;
};

type LatestChapterInfo = {
  storyId: string;
  storyTitle: string;
  chapterIndex: number;
  summary: string;
  updatedAt?: string;
};

type StatusPayload = {
  llama?: LlamaStatus;
  latestChapter?: LatestChapterInfo;
};

type FavoriteSetup = {
  name: string;
  tags: string[];
  tone: string;
  pace: string;
};

const formatUpdated = (value?: string) => (value ? new Date(value).toLocaleString() : '--');

export default function Home() {
  const [textFilter, setTextFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedPace, setSelectedPace] = useState('');
  const [favoriteSetups, setFavoriteSetups] = useState<FavoriteSetup[]>([]);
  const [setupName, setSetupName] = useState('');
  const [favoriteStories, setFavoriteStories] = useState<string[]>([]);
  const [aiStatus, setAiStatus] = useState('AI is standing by.');
  const [aiLoading, setAiLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const { data: stories = [] } = useSWR<StoryCard[]>('/api/story/list', fetcher, {
    refreshInterval: 60000,
  });

  const { data: statusData } = useSWR<StatusPayload>('/api/system/status', fetcher, {
    refreshInterval: 15000,
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => setScrollY(window.scrollY);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  const llamaStatus = statusData?.llama;
  const latestChapter = statusData?.latestChapter;
  const tickerLines = useMemo(() => {
    const lines: string[] = [];
    if (llamaStatus?.status) lines.push(`LLAMA · ${llamaStatus.status}`);
    if (llamaStatus?.message) lines.push(llamaStatus.message);
    if (latestChapter?.storyTitle) {
      lines.push(`Latest · ${latestChapter.storyTitle} • ch. ${latestChapter.chapterIndex || '--'}`);
    }
    lines.push(`Active sagas · ${stories.length}`);
    return lines.length ? lines : ['Pipeline sparks still aligning…'];
  }, [llamaStatus, latestChapter, stories.length]);

  const trendingStories = useMemo(
    () => stories.slice(0, Math.min(6, stories.length)),
    [stories]
  );

  const spotlightStories = useMemo(
    () => stories.slice(0, Math.min(3, stories.length)),
    [stories]
  );

  const heroProgression = heroStory?.metadata?.progression;
  const heroChapters = heroStory?.chapters ?? 0;
  const heroSummary = heroStory?.summary ?? 'Generate immersive long-form stories and keep the command center humming.';
  const heroRealmStack = `${heroProgression?.startRealm ?? 'Luyện Khí'} → ${heroProgression?.targetRealm ?? 'Nguyên Anh'}`;

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

  const handleAIGenerate = async () => {
    setAiLoading(true);
    setAiStatus('Routing a cinematic request to the LLaMA pipeline…');
    try {
      const res = await fetch('/api/ai/generate', { method: 'POST' });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || payload.detail || 'Unable to reach the backend.');
      }
      setAiStatus(`Queued ${payload.title ?? 'a story'} (${payload.id ?? 'draft'}) — ${payload.chapters?.length ?? payload.chapters ?? '--'} chapters pending.`);
    } catch (error: any) {
      setAiStatus(error?.message ?? 'AI generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>Story VeryLong — Command Gallery</title>
      </Head>

      <section className={styles.heroSection} aria-label="Story command hero">
        <div className={styles.heroBadge}>
          <span>Command Center</span>
          <span>{stories.length} sagas archived</span>
        </div>
        <div className={styles.heroContent}>
          <p className={styles.heroOverline}>Live feed · Motion lighting · Gradient lens</p>
          <h1 className={styles.heroTitle}>Cinematic sagas, orchestrated in minutes.</h1>
          <p className={styles.heroSubtitle}>{heroSummary}</p>
          <div className={styles.heroStats}>
            <div>
              <p className={styles.heroStatLabel}>Progression</p>
              <strong className={styles.heroStatValue}>{heroRealmStack}</strong>
            </div>
            <div>
              <p className={styles.heroStatLabel}>Chapters</p>
              <strong className={styles.heroStatValue}>{heroChapters || '--'}</strong>
            </div>
            <div>
              <p className={styles.heroStatLabel}>Updated</p>
              <strong className={styles.heroStatValue}>{formatUpdated(heroStory?.updatedAt)}</strong>
            </div>
          </div>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleAIGenerate}
              disabled={aiLoading}
            >
              {aiLoading ? 'Tuning LLaMA…' : 'Generate new saga'}
            </button>
            {heroStory && (
              <Link href={`/reader/${heroStory.id}`} passHref>
                <a className={styles.secondaryAction}>Dive into featured story</a>
              </Link>
            )}
          </div>
          <p className={styles.aiStatus}>{aiStatus}</p>
        </div>
        <div className={styles.motionAccent} aria-hidden="true">
          <div className={styles.motionBeam} />
          <div className={styles.motionPulse} />
        </div>
        <div className={styles.heroSpotlight} aria-hidden="true">
          <div className={styles.heroSpotlightBeam} />
          <div className={styles.heroSpotlightGlow} />
        </div>
      </section>

      {trendingStories.length > 0 && (
        <section className={styles.trendingSlider} aria-label="Trending sagas">
          <div className={styles.sliderTrack}>
            {trendingStories.map((story) => (
              <Link key={story.id} href={`/reader/${story.id}`} passHref>
                <a className={styles.sliderCard}>
                  <span className={styles.sliderMood}>{story.tone}</span>
                  <h3>{story.title}</h3>
                  <p>{story.summary}</p>
                  <div className={styles.sliderMeta}>
                    <span>Ch. {story.chapters ?? '--'}</span>
                    <span>{formatUpdated(story.updatedAt)}</span>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.statusSlurry} aria-label="Pipeline status">
        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>LLAMA pipeline</p>
          <h3>{llamaStatus?.status ?? 'Awaiting heartbeat'}</h3>
          <div className={styles.statusMeta}>
            <span>Model: {llamaStatus?.model ?? 'llama.cpp'}</span>
            <span>Last run: {llamaStatus?.lastRun ? formatUpdated(llamaStatus.lastRun) : '--'}</span>
            <span>Duration: {llamaStatus?.durationSeconds ? `${Math.round(llamaStatus.durationSeconds)}s` : '--'}</span>
          </div>
          <p className={styles.statusFoot}>{llamaStatus?.message ?? (llamaStatus ? (llamaStatus.fallbackUsed ? 'Fallback engaged last time.' : 'Pipeline nominal.') : 'Logs still arriving.')}</p>
        </article>
        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>Latest chapter</p>
          <h3>{latestChapter?.storyTitle ?? 'No chapters yet'}</h3>
          <div className={styles.statusMeta}>
            <span>Chapter {latestChapter?.chapterIndex ?? '--'}</span>
            <span>{formatUpdated(latestChapter?.updatedAt)}</span>
          </div>
          <p className={styles.statusFoot}>{latestChapter?.summary ?? 'The katana of this fleet is still sharpening.'}</p>
        </article>
      </section>

      <section className={styles.logTicker} aria-label="Pipeline log ticker">
        <div className={styles.tickerMask}>
          <div className={styles.tickerTrack}>
            {tickerLines.map((line, index) => (
              <span key={`${line}-${index}`} className={styles.tickerItem}>
                {line}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.filtersArea} aria-label="Filtering" >
        <div className={styles.filtersTop}>
          <input
            className={styles.searchInput}
            placeholder="Search stories"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
          />
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
        <div className={styles.filterTagWall}>
          {tagPool.slice(0, 24).map((tag) => (
            <button
              key={tag}
              type="button"
              className={`${styles.filterTag} ${selectedTags.includes(tag) ? styles.filterTagActive : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className={styles.setupRow}>
          {favoriteSetups.length === 0 && <span className={styles.setupHint}>Save combos for instant recall.</span>}
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
          <button type="button" onClick={handleSaveSetup} className={styles.setupAction}>
            Save combo
          </button>
        </div>
      </section>

      {spotlightStories.length > 0 && (
        <section className={styles.spotlightGrid} aria-label="Spotlight stories">
          {spotlightStories.map((story, index) => {
            const depth = Math.min(scrollY / 900 + index * 0.08, 1);
            const style = { '--scroll-depth': depth } as CSSProperties;
            return (
              <article key={story.id} className={styles.spotlightCard} style={style}>
                <div className={styles.spotlightAura} aria-hidden="true" />
                <p className={styles.spotlightTone}>{story.tone}</p>
                <h3>{story.title}</h3>
                <p className={styles.spotlightSummary}>{story.summary}</p>
                <div className={styles.spotlightMeta}>
                  <span>Chapters {story.chapters ?? '--'}</span>
                  <span>{story.pacing} pace</span>
                </div>
                <div className={styles.spotlightActions}>
                  <Link href={`/reader/${story.id}`} passHref>
                    <a className={styles.spotlightLink}>Open field</a>
                  </Link>
                  <span className={styles.spotlightTag}>{story.tags[0] ?? 'untagged'}</span>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className={styles.gallery} aria-label="Story gallery">
        {filteredStories.map((story) => {
          const isFavorite = favoriteStories.includes(story.id);
          return (
            <article key={story.id} className={styles.card} data-story-card>
              <div className={styles.cardHeader}>
                <span className={styles.cardMood}>{story.tone}</span>
                <span className={styles.cardPace}>{story.pacing} pace</span>
                <span className={styles.cardUpdated}>{formatUpdated(story.updatedAt)}</span>
              </div>
              <h3 className={styles.cardTitle}>{story.title}</h3>
              <p className={styles.cardSummary}>{story.summary}</p>
              <div className={styles.moodPreview}>
                {story.toneTags.slice(0, 3).map((tag) => (
                  <span key={tag} className={styles.moodTag}>
                    {tag}
                  </span>
                ))}
                {story.powerStyles[0] && (
                  <span className={styles.moodTag}>{story.powerStyles[0]}</span>
                )}
              </div>
              <div className={styles.cardTags}>
                {story.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className={styles.filterTag}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.cardMeta}>
                  <span>Chapters: {story.chapters ?? '--'}</span>
                  <span>Lang: {story.language ?? 'EN'}</span>
                </div>
                <div className={styles.cardButtons}>
                  <Link href={`/reader/${story.id}`} passHref>
                    <a className={styles.readerButton}>Open Reader</a>
                  </Link>
                  <button
                    className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''}`}
                    type="button"
                    onClick={() => toggleStoryFavorite(story.id)}
                    aria-pressed={isFavorite}
                  >
                    {isFavorite ? '★ Saved' : '☆ Save'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
