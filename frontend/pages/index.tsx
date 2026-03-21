import useSWR from 'swr';
import { FormEvent, useMemo, useRef, useState } from 'react';
import styles from '../styles/Home.module.css';

type StoryRequest = {
  title: string;
  genre: string;
  tone: string;
  chapters: number;
  focus?: string;
  language?: string;
};

type StoryChapter = {
  title?: string;
  sections?: string[];
  cliffhanger?: string;
};

type StoryPath = {
  id: string;
  title: string;
  description: string;
  focus: string;
};

type StoryResponse = {
  id: string;
  title: string;
  outline: string[];
  chapters: Array<string | StoryChapter>;
  summary: string;
  cover: string;
  created_at: string;
  genre?: string;
  tone?: string;
  focus?: string | null;
  next_paths?: StoryPath[];
};

type TrendingGenre = {
  genre: string;
  headline: string;
  description: string;
  palette: string;
  momentum: number;
  mood_board: string[];
};

type PathChoice = {
  id: string;
  label: string;
  summary: string;
  focus: string;
  accent: string;
};

const defaultTrending: TrendingGenre[] = [
  {
    genre: 'Fantasy',
    headline: 'Aurora courts and drifting citadels',
    description: 'Arcane democracy, skyships, and noble houses striking secret pacts.',
    palette: 'linear-gradient(145deg, rgba(124,77,255,0.92), rgba(16,185,129,0.88))',
    momentum: 94,
    mood_board: ['Lucent sigils', 'Velvet storms', 'Regal whisper-lines', 'Constellation rites'],
  },
  {
    genre: 'Sci-Fi',
    headline: 'Neon protocol and orbital rebellions',
    description: 'AI councils, solar scavengers, and civil pronouncements from a drifting colony.',
    palette: 'linear-gradient(145deg, rgba(14,165,233,0.95), rgba(251,191,36,0.9))',
    momentum: 88,
    mood_board: ['Chromed alleys', 'Pulse-lit broadcasts', 'Hologram vows', 'Coded meteor rain'],
  },
  {
    genre: 'Thriller',
    headline: 'Rain-soaked files and midnight architect',
    description: 'Surveillance officers, vault heists, and breathless bargains in shadow-drenched cities.',
    palette: 'linear-gradient(145deg, rgba(248,113,113,0.95), rgba(217,119,6,0.92))',
    momentum: 82,
    mood_board: ['Static fog', 'Sapphire scanners', 'Crisp whispers', 'Steel heartbeat'],
  },
  {
    genre: 'Romance',
    headline: 'Rain-burnished rooftops and secret letters',
    description: 'Star-crossed couriers, rewound time loops, and memories traced in ink.',
    palette: 'linear-gradient(145deg, rgba(236,72,153,0.9), rgba(250,204,21,0.88))',
    momentum: 79,
    mood_board: ['Velvet promises', 'Amber rainfall', 'Letter-bound pauses', 'Lace pulse'],
  },
];

const languages = ['English', 'Vietnamese', 'Japanese', 'Spanish', 'French'];

const pathTemplates = [
  {
    label: 'Trace the ember signal',
    summary: 'The ember signal stutters, promising a double-sided reveal.',
    focusTag: 'Trace the ember signal',
    accent: '#fb7185',
  },
  {
    label: 'Protect the relic pulse',
    summary: 'A relic pulse complicates loyalties, drawing rival stations close.',
    focusTag: 'Protect the relic pulse',
    accent: '#22d3ee',
  },
  {
    label: 'Confront the mirrored rival',
    summary: 'A mirrored rival slips through the dossier, daring a desperate wager.',
    focusTag: 'Confront the mirrored rival',
    accent: '#fde047',
  },
];

const textureWords = ['ember', 'silk', 'ozone', 'shadow', 'velvet'];

const normalizeChapter = (chapter: string | StoryChapter): StoryChapter => {
  if (typeof chapter === 'string') {
    return { sections: [chapter], cliffhanger: undefined };
  }
  return {
    title: chapter.title,
    sections: chapter.sections ?? [],
    cliffhanger: chapter.cliffhanger,
  };
};

const expandChapterParagraphs = (chapter: StoryChapter, genre: string, index: number) => {
  const primary = (chapter.sections && chapter.sections.length > 0 ? chapter.sections[0] : chapter.title || '').trim();
  const snippet = primary.split('.').find((part) => part.trim()) ?? primary;
  const texture = textureWords[index % textureWords.length];
  const seeded = chapter.sections && chapter.sections.length > 0 ? chapter.sections : [primary];
  return [
    ...seeded,
    `${snippet}. Beyond that beat, the ${genre.toLowerCase()} ${texture} swells and pulls the crew toward a daring shift.`,
    `Moments later, the ${texture} storm settles into a fragile hush while sparks whisper about the next breach.`,
  ].filter(Boolean);
};

const buildCliffhanger = (chapter: StoryChapter, genre: string) => {
  if (chapter.cliffhanger) {
    return chapter.cliffhanger;
  }
  const base = chapter.sections?.[0] || chapter.title || genre;
  const pieces = base
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
  const anchor = pieces[0] ?? base;
  return `Cliffhanger: ${anchor} — the ${genre.toLowerCase()} tide now tilts toward a fragile duel.`;
};

const buildChapterChoices = (
  chapter: StoryChapter,
  chapterIndex: number,
  genre: string,
  title: string,
  responsePaths?: StoryPath[]
): PathChoice[] => {
  if (responsePaths && responsePaths.length > 0) {
    return responsePaths.map((path, idx) => ({
      id: path.id,
      label: path.title,
      summary: path.description,
      focus: path.focus,
      accent: pathTemplates[idx % pathTemplates.length].accent,
    }));
  }

  const snippet = (chapter.sections?.[0] || chapter.title || title).split(',')[0]?.trim() || title;
  return pathTemplates.map((template, motifIndex) => ({
    id: `${chapterIndex}-${motifIndex}`,
    label: template.label,
    summary: `${template.summary} ${genre} veins thread through ${snippet.toLowerCase()}.`,
    focus: `${template.focusTag} from ${title} chapter ${chapterIndex + 1} to steer ${genre} currents.`,
    accent: template.accent,
  }));
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [form, setForm] = useState<StoryRequest>({
    title: 'The Last Starship',
    genre: 'Fantasy',
    tone: 'epic',
    chapters: 5,
    focus: 'Crew drama and rhythm changes',
    language: 'English',
  });
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [language, setLanguage] = useState('English');
  const readerRef = useRef<HTMLElement | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Record<number, string>>({});
  const [selectedPathFocus, setSelectedPathFocus] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);

  const { data: stories } = useSWR<string[]>('/api/stories', fetcher, { refreshInterval: 60000 });
  const { data: trending } = useSWR<TrendingGenre[]>('/api/trending', fetcher, {
    fallbackData: defaultTrending,
  });

  const trendingList = trending ?? defaultTrending;
  const moodTags = useMemo(() => {
    const tags = trendingList.flatMap((item) => item.mood_board);
    return Array.from(new Set(tags)).slice(0, 12);
  }, [trendingList]);

  const chapterDetails = useMemo(() => {
    if (!story) {
      return [];
    }
    const activeGenre = story.genre ?? form.genre;
    return story.chapters.map((rawChapter, idx) => {
      const chapter = normalizeChapter(rawChapter);
      return {
        title: chapter.title || `Chapter ${idx + 1}` ,
        body: expandChapterParagraphs(chapter, activeGenre, idx),
        cliffhanger: buildCliffhanger(chapter, activeGenre),
        choices: buildChapterChoices(chapter, idx, activeGenre, story.title, story.next_paths),
      };
    });
  }, [story, form.genre]);

  const handleChoiceSelect = (chapterIdx: number, choice: PathChoice) => {
    setSelectedPaths((prev) => ({ ...prev, [chapterIdx]: choice.id }));
    setSelectedPathFocus(choice.focus);
    setForm((prev) => ({ ...prev, focus: choice.focus }));
  };


  const handleReadStory = () => {
    if (!story || !readerRef.current) {
      return;
    }
    readerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedPaths({});
    setSelectedPathFocus(null);
    const focusParts = [form.focus?.trim()].filter(Boolean);
    if (language !== 'English') {
      focusParts.push(`Language: ${language}`);
    }
    const payloadFocus = focusParts.join(' | ') || undefined;
    const res = await fetch('/api/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, focus: payloadFocus, language }),
    });
    const payload: StoryResponse = await res.json();
    setStory(payload);
  };

  const handleContinueStory = async () => {
    if (!story || !selectedPathFocus) {
      return;
    }
    setContinuing(true);
    try {
      const response = await fetch('/api/story/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story.id,
          chapters: 1,
          tone: form.tone,
          focus: selectedPathFocus,
          language,
        }),
      });
      const payload: StoryResponse = await response.json();
      if (!response.ok) {
        console.error('Failed to continue story', payload);
        return;
      }
      setStory(payload);
      setForm((prev) => ({ ...prev, focus: selectedPathFocus }));
    } catch (error) {
      console.error('Failed to continue story', error);
    } finally {
      setContinuing(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <p className={styles.heroBadge}>STORY VERYLONG</p>
          <h1 className={styles.heroTitle}>Forge cinematic sagas in real time</h1>
          <p className={styles.heroCopy}>
            Choose a genre, tone, chapter span, and language. The engine builds the outline, draft chapters, and keeps
            a cinematic history you can expand or export.
          </p>
        </header>

        <section className={styles.trendingSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Trending Genres</p>
              <h2 className={styles.sectionTitle}>Fresh currents stirring the narrative table</h2>
              <p className={styles.sectionDescription}>
                Each pulse here reflects the most requested palettes from the cinematic reader — pick one to let the
                story engine echo its colors.
              </p>
            </div>
          </div>
          <div className={styles.trendingCarousel}>
            {trendingList.map((item) => (
              <article
                key={item.genre}
                className={styles.trendingCard}
                style={{ backgroundImage: item.palette }}
              >
                <div className={styles.trendingCardContent}>
                  <p className={styles.cardGenre}>{item.genre}</p>
                  <h3 className={styles.cardHeadline}>{item.headline}</h3>
                  <p className={styles.cardDescription}>{item.description}</p>
                </div>
                <div className={styles.momentumGroup}>
                  <span className={styles.momentumBadge}>{item.momentum}%</span>
                  <div className={styles.momentumBar}>
                    <span className={styles.momentumFill} style={{ width: `${item.momentum}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.moodSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Mood Board</p>
              <h2 className={styles.sectionTitle}>Textures & pulses for the cinematic reader</h2>
            </div>
            <p className={styles.sectionDescription}>
              Layer the words below into your focus prompt or take them as a visual springboard before summoning the next
              chapter.
            </p>
          </div>
          <div className={styles.moodGrid}>
            {moodTags.map((tag) => (
              <span key={tag} className={styles.moodChip}>
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.controlSection}>
          <form className={styles.storyForm} onSubmit={handleSubmit}>
            <label className={styles.formLabel}>Story Title</label>
            <input
              className={styles.fieldInput}
              name="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <div className={styles.twoColumn}>
              <div>
                <label className={styles.formLabel}>Genre</label>
                <select
                  className={styles.fieldInput}
                  name="genre"
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                >
                  <option>Fantasy</option>
                  <option>Sci-Fi</option>
                  <option>Thriller</option>
                  <option>Romance</option>
                </select>
              </div>
              <div>
                <label className={styles.formLabel}>Tone</label>
                <select
                  className={styles.fieldInput}
                  name="tone"
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                >
                  <option>epic</option>
                  <option>mysterious</option>
                  <option>fast</option>
                </select>
              </div>
            </div>

            <div className={styles.twoColumn}>
              <div>
                <label className={styles.formLabel}>Chapters</label>
                <input
                  className={styles.fieldInput}
                  name="chapters"
                  type="number"
                  value={form.chapters}
                  min={3}
                  max={12}
                  onChange={(e) => setForm({ ...form, chapters: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Language</label>
                <select
                  className={styles.fieldInput}
                  name="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className={styles.formLabel}>Mood / Focus</label>
            <textarea
              className={styles.fieldTextarea}
              name="focus"
              value={form.focus}
              onChange={(e) => setForm({ ...form, focus: e.target.value })}
              rows={3}
            />

            <button type="submit" className={styles.primaryButton}>
              Summon Story
            </button>
            <div className={styles.readStoryRow}>
              <button
                type="button"
                className={styles.readButton}
                onClick={handleReadStory}
                disabled={!story}
              >
                Read Story
              </button>
            </div>
          </form>

          <aside className={styles.archivePanel}>
            <h2>Story Archive</h2>
            <p className={styles.archiveCopy}>Recent legends you scripted automatically.</p>
            <div className={styles.archiveList}>
              {stories?.length ? (
                stories.map((id: string) => (
                  <span key={id} className={styles.archiveItem}>
                    {id}
                  </span>
                ))
              ) : (
                <p className={styles.archiveEmpty}>No stories yet. Generate one to see it listed.</p>
              )}
            </div>
          </aside>
        </section>

        {story && (
          <article ref={readerRef} className={styles.cinematicReader}>
            <header className={styles.readerHeader}>
              <div>
                <p className={styles.readerGenre}>{story.genre || form.genre}</p>
                <h2>{story.title}</h2>
                <p className={styles.readerSummary}>{story.summary}</p>
              </div>
              <span className={styles.readerTimestamp}>{new Date(story.created_at).toLocaleString()}</span>
            </header>
            <div className={styles.focusPanel}>
              <div>
                <p className={styles.focusLabel}>Next Path Focus</p>
                <p className={styles.focusValue}>
                  {selectedPathFocus ?? 'Select a path below to lock the cinematic beat forward.'}
                </p>
              </div>
              <button
                type="button"
                className={styles.continueButton}
                disabled={!selectedPathFocus || continuing}
                onClick={handleContinueStory}
              >
                {continuing ? 'Extending arc…' : 'Continue arc'}
              </button>
            </div>
            <div className={styles.readerOutline}>
              {story.outline.map((line, idx) => (
                <div key={line} className={styles.outlineCard}>
                  <p className={styles.outlineLabel}>Outline {idx + 1}</p>
                  <p className={styles.outlineText}>{line}</p>
                </div>
              ))}
            </div>
            <div className={styles.readerChapters}>
              {chapterDetails.map((chapterDetail, idx) => (
                <section
                  key={`chapter-${idx}`}
                  className={styles.chapterPanel}
                  data-chapter-panel-index={idx}
                >
                  <h3 className={styles.chapterTitle}>{chapterDetail.title || `Chapter ${idx + 1}`}</h3>
                  <div className={styles.chapterBody}>
                    {chapterDetail.body.map((paragraph, paragraphIdx) => (
                      <p key={`${idx}-${paragraphIdx}`} className={styles.chapterParagraph}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div className={styles.cliffhangerRow}>
                    <p className={styles.cliffhangerLabel}>Cliffhanger</p>
                    <p className={styles.chapterCliffhanger}>{chapterDetail.cliffhanger}</p>
                  </div>
                  <div className={styles.choiceGrid}>
                    {chapterDetail.choices.map((choice) => {
                      const isChoiceActive = selectedPaths[idx] === choice.id;
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          data-choice-id={choice.id}
                          aria-pressed={isChoiceActive}
                          className={`${styles.choiceCard} ${isChoiceActive ? styles.choiceCardActive : ''}`}
                          style={
                            isChoiceActive
                              ? { borderColor: choice.accent, boxShadow: `0 0 0 3px ${choice.accent}` }
                              : undefined
                          }
                          onClick={() => handleChoiceSelect(idx, choice)}
                        >
                          <span className={styles.choiceLabel}>{choice.label}</span>
                          <p className={styles.choiceSummary}>{choice.summary}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
