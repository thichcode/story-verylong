import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import clsx from 'clsx';
import styles from '../../styles/Reader.module.css';

const widthOptions = ['narrow','medium','wide'];
const themeOptions = ['midnight','dark','sepia','light'];

type Chapter = { title: string; sections: string[]; cliffhanger?: string };

type NextPath = {
  id: string;
  title: string;
  description: string;
  focus: string;
};

type StoryPayload = {
  id: string;
  title: string;
  language?: string;
  chapters: Chapter[] | string[];
  next_paths?: NextPath[];
  tags?: string[];
  pacing?: string;
  metadata?: {
    progression?: {
      pace?: string;
    };
    continuity?: {
      focus?: string;
    };
  };
};

const ReaderPage = () => {
  const router = useRouter();
  const { storyId } = router.query;
  const readerRef = useRef<HTMLElement | null>(null);
  const [story, setStory] = useState<StoryPayload | null>(null);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widthMode, setWidthMode] = useState<'narrow'|'medium'|'wide'>('medium');
  const [theme, setTheme] = useState<'midnight'|'dark'|'sepia'|'light'>('midnight');
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    if (!storyId) return;
    const fetchStory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/story/read/${storyId}`);
        if (!res.ok) throw new Error('Story not found');
        const data = await res.json();
        setStory(data);
        setChapterIdx(0);
        setTimeout(() => readerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [storyId]);

  const chapters = useMemo(() => {
    if (!story) return [] as Chapter[];
    if (!story?.chapters?.length) return [] as Chapter[];
    return story.chapters.map((item) =>
      typeof item === 'string'
        ? { title: 'Chapter', sections: [item] }
        : { title: item.title, sections: item.sections, cliffhanger: item.cliffhanger }
    );
  }, [story]);

  const currentChapter = chapters[chapterIdx] ?? chapters[0];
  const progressPercent = chapters.length ? Math.round(((chapterIdx + 1) / chapters.length) * 100) : 0;
  const nextPaths = story?.next_paths ?? [];
  const spotlightFocus = story?.metadata?.continuity?.focus ?? story?.tags?.[0] ?? story?.title ?? 'spotlight';
  const pacingLabel = story?.metadata?.progression?.pace ?? story?.pacing ?? 'medium';

  const handleNext = () => {
    setChapterIdx((prev) => Math.min(prev + 1, chapters.length - 1));
  };
  const handlePrev = () => {
    setChapterIdx((prev) => Math.max(prev - 1, 0));
  };

  const handleReadNow = () => {
    readerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!story) return;
    const state = { chapterIdx, scroll: window.scrollY };
    const key = `reader-progress-${story.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      setChapterIdx(parsed.chapterIdx ?? 0);
      window.scrollTo(0, parsed.scroll ?? 0);
    }
    const save = () => localStorage.setItem(key, JSON.stringify(state));
    const handler = () => save();
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, [chapterIdx, story]);

  return (
    <div className={styles.readerPage} data-theme={theme}>
      <Head>
        <title>{story ? `${story.title} — Reader` : 'Reader'}</title>
      </Head>
      <header className={styles.readerHeader}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>Back to Library</button>
        <div>
          <p className={styles.storyTitle}>{story?.title ?? 'Loading story…'}</p>
          <p className={styles.chapterTitle}>Chapter {chapterIdx + 1}</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.languageBadge}>{story?.language ?? 'English'}</span>
          <button className={styles.iconBtn} aria-label="Bookmark">★</button>
          <button className={styles.iconBtn} aria-label="Share">↗</button>
        </div>
      </header>
      <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progressPercent}%` }} /></div>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <span>Theme</span>
          {themeOptions.map((opt) => (
            <button key={opt} className={clsx(styles.toolbarButton, theme === opt && styles.active)} onClick={() => setTheme(opt as any)}>
              {opt}
            </button>
          ))}
        </div>
        <div className={styles.toolbarGroup}>
          <label>Font</label>
          <input type="range" min={16} max={24} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
        </div>
        <div className={styles.toolbarGroup}>
          <span>Width</span>
          {widthOptions.map((opt) => (
            <button key={opt} className={clsx(styles.toolbarButton, widthMode === opt && styles.active)} onClick={() => setWidthMode(opt as any)}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      {loading && <p className={styles.status}>Loading chapter…</p>}
      {error && <p className={styles.error}>{error}</p>}
      <main ref={readerRef} className={styles.readerBody} style={{ maxWidth: widthMode === 'wide' ? '960px' : widthMode === 'narrow' ? '640px' : '800px' }}>
        {currentChapter?.sections?.map((section, idx) => (
          <article key={idx} style={{ fontSize: `${fontSize}px` }}>
            <p>{section}</p>
          </article>
        ))}
        {currentChapter?.cliffhanger && <p className={styles.cliffhanger}>{currentChapter.cliffhanger}</p>}
        <div className={styles.continuation}>
          <p>Next chapter ready?</p>
          <button onClick={handleNext} disabled={chapterIdx >= chapters.length - 1}>Continue</button>
        </div>
      </main>
      <section className={styles.readerSpotlight}>
        <div className={styles.spotlightHeadline}>
          <span>Spotlight feed</span>
          <span className={styles.spotlightBadge}>{pacingLabel.toUpperCase()} pace</span>
        </div>
        <p className={styles.spotlightLead}>
          Focus threads through {spotlightFocus}. Chapters glow with a cinematic drift while the pipeline queues the next arcs.
        </p>
        <div className={styles.spotlightGrid}>
          {nextPaths.length ? (
            nextPaths.slice(0, 3).map((path) => (
              <article key={path.id} className={styles.spotlightCard}>
                <h4 className={styles.spotlightTitle}>{path.title}</h4>
                <p className={styles.spotlightDescription}>{path.description}</p>
                <span className={styles.spotlightMeta}>{path.focus}</span>
              </article>
            ))
          ) : (
            <p className={styles.spotlightMuted}>Auto-chapters will generate the next spotlight arc soon.</p>
          )}
        </div>
      </section>
      <nav className={styles.chapterNav}>
        <button onClick={handlePrev} disabled={!chapterIdx}>Prev</button>
        <span>Chapter {chapterIdx + 1} / {chapters.length || '--'}</span>
        <button onClick={handleNext} disabled={chapterIdx >= chapters.length - 1}>Next</button>
        <button className={styles.readAction} onClick={handleReadNow}>Read Story</button>
      </nav>
    </div>
  );
};

export default ReaderPage;
