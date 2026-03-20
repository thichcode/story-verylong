import useSWR from 'swr';
import { useState } from 'react';

type StoryRequest = {
  title: string;
  genre: string;
  tone: string;
  chapters: number;
  focus?: string;
};

type StoryResponse = {
  id: string;
  title: string;
  outline: string[];
  chapters: string[];
  summary: string;
  cover: string;
  created_at: string;
};

const genreShowcase = [
  {
    name: 'Fantasy',
    description: 'Knightly courts, floating citadels, rival mages wage delicate wars.',
    palette: 'linear-gradient(140deg, rgba(135,94,255,0.8), rgba(6,182,212,0.7))',
    mood: 'Chivalric mystery',
  },
  {
    name: 'Sci-Fi',
    description: 'Quantum politics, solar expeditions, and cities driven by AI legends.',
    palette: 'linear-gradient(140deg, rgba(16,185,129,0.9), rgba(14,165,233,0.8))',
    mood: 'Futuristic intrigue',
  },
  {
    name: 'Thriller',
    description: 'Night streets, double agents, and puzzles of trust that crack under pressure.',
    palette: 'linear-gradient(140deg, rgba(248,113,113,0.9), rgba(217,119,6,0.9))',
    mood: 'High-voltage suspense',
  },
  {
    name: 'Romance',
    description: 'Fleeting glances on rain-slicked rooftops and letters folded with longing.',
    palette: 'linear-gradient(140deg, rgba(236,72,153,0.9), rgba(250,204,21,0.85))',
    mood: 'Velvet warmth',
  },
];

const languages = ['English', 'Vietnamese', 'Japanese', 'Spanish', 'French'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [form, setForm] = useState<StoryRequest>({
    title: 'The Last Starship',
    genre: 'Fantasy',
    tone: 'epic',
    chapters: 5,
    focus: 'Crew drama and rhythm changes',
  });
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [language, setLanguage] = useState('English');

  const { data: stories } = useSWR('/api/stories', fetcher, { refreshInterval: 60000 });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const focusParts = [form.focus?.trim()].filter(Boolean);
    if (language !== 'English') {
      focusParts.push(`Language: ${language}`);
    }
    const payloadFocus = focusParts.join(' | ') || undefined;
    const res = await fetch('/api/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, focus: payloadFocus }),
    });
    const payload: StoryResponse = await res.json();
    setStory(payload);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#01030a', color: '#f8fafc' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 60px' }}>
        <header style={{ marginBottom: 32 }}>
          <p style={{ letterSpacing: '0.4em', color: '#a5b4fc', fontSize: 12 }}>STORY VERYLONG</p>
          <h1 style={{ fontSize: 48, margin: '12px 0' }}>Forge cinematic sagas in real time</h1>
          <p style={{ fontSize: 18, color: '#cbd5f5', maxWidth: 700 }}>
            Choose a genre, tone, chapter span, and language. The engine builds the outline, draft chapters, and keeps a
            cinematic history you can expand or export.
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {genreShowcase.map((item) => (
            <div
              key={item.name}
              style={{
                background: item.palette,
                padding: 20,
                borderRadius: 20,
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div>
                <p style={{ fontSize: 14, opacity: 0.8 }}>{item.mood}</p>
                <h3 style={{ margin: '8px 0', fontSize: 22 }}>{item.name}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.5 }}>{item.description}</p>
              </div>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Select &amp; build</span>
            </div>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'rgba(15,23,42,0.9)',
              borderRadius: 24,
              padding: 24,
              display: 'grid',
              gap: 16,
              boxShadow: '0 15px 40px rgba(0,0,0,0.35)',
            }}
          >
            <label style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Story Title</label>
            <input
              name="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ borderRadius: 12, border: '1px solid rgba(148,163,184,0.3)', padding: '10px 12px', background: '#020617', color: '#f8fafc' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Genre</label>
                <select
                  name="genre"
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  style={{ width: '100%', borderRadius: 12, padding: '10px 12px', background: '#020617', color: '#f8fafc', border: '1px solid rgba(148,163,184,0.3)' }}
                >
                  <option>Fantasy</option>
                  <option>Sci-Fi</option>
                  <option>Thriller</option>
                  <option>Romance</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Tone</label>
                <select
                  name="tone"
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                  style={{ width: '100%', borderRadius: 12, padding: '10px 12px', background: '#020617', color: '#f8fafc', border: '1px solid rgba(148,163,184,0.3)' }}
                >
                  <option>epic</option>
                  <option>mysterious</option>
                  <option>fast</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Chapters</label>
                <input
                  name="chapters"
                  type="number"
                  value={form.chapters}
                  min={3}
                  max={12}
                  onChange={(e) => setForm({ ...form, chapters: Number(e.target.value) })}
                  style={{ width: '100%', borderRadius: 12, padding: '10px 12px', background: '#020617', color: '#f8fafc', border: '1px solid rgba(148,163,184,0.3)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ width: '100%', borderRadius: 12, padding: '10px 12px', background: '#020617', color: '#f8fafc', border: '1px solid rgba(148,163,184,0.3)' }}
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Mood / Focus</label>
            <textarea
              name="focus"
              value={form.focus}
              onChange={(e) => setForm({ ...form, focus: e.target.value })}
              rows={3}
              style={{ borderRadius: 12, border: '1px solid rgba(148,163,184,0.3)', padding: '10px 12px', background: '#020617', color: '#f8fafc' }}
            />

            <button
              type="submit"
              style={{
                marginTop: 12,
                background: 'linear-gradient(120deg, #22d3ee, #818cf8)',
                border: 'none',
                borderRadius: 14,
                padding: '14px 0',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                color: '#020617',
                boxShadow: '0 15px 25px rgba(2,6,23,0.3)',
              }}
            >
              Summon Story
            </button>
          </form>

          <div
            style={{
              background: '#0f172a',
              borderRadius: 24,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              border: '1px solid rgba(148,163,184,0.15)',
            }}
          >
            <h2 style={{ margin: 0 }}>Story Archive</h2>
            <p style={{ marginTop: 0, color: '#94a3b8' }}>Recent legends you scripted automatically.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stories?.length ? (
                stories.map((id: string) => (
                  <span key={id} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(148,163,184,0.08)' }}>
                    {id}
                  </span>
                ))
              ) : (
                <p style={{ color: '#64748b' }}>No stories yet. Generate one to see it listed.</p>
              )}
            </div>
          </div>
        </section>

        {story && (
          <article
            style={{
              background: 'rgba(15,23,42,0.95)',
              borderRadius: 32,
              padding: 32,
              boxShadow: '0 20px 60px rgba(2,6,23,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a5b4fc' }}>
                  {story.genre || form.genre}
                </p>
                <h2 style={{ margin: '8px 0', fontSize: 36 }}>{story.title}</h2>
                <p style={{ color: '#cbd5f5', maxWidth: 600 }}>{story.summary}</p>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(story.created_at).toLocaleString()}</span>
            </div>
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
              {story.outline.map((line, idx) => (
                <div
                  key={line}
                  style={{
                    borderRadius: 18,
                    padding: 18,
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    boxShadow: '0 8px 18px rgba(2,6,23,0.3)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#94a3b8' }}>
                    Outline {idx + 1}
                  </p>
                  <p style={{ marginTop: 6 }}>{line}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32, display: 'grid', gap: 24 }}>
              {story.chapters.map((chapter, idx) => (
                <section key={idx} style={{ borderRadius: 16, padding: 18, background: 'rgba(2,6,23,0.8)' }}>
                  <h3 style={{ color: '#60a5fa', marginTop: 0 }}>Chapter {idx + 1}</h3>
                  <p style={{ marginBottom: 0 }}>{chapter}</p>
                </section>
              ))}
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
