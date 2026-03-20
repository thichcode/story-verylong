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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [form, setForm] = useState<StoryRequest>({
    title: 'The Last Starship',
    genre: 'Fantasy',
    tone: 'epic',
    chapters: 5,
    focus: 'crew drama',
  });
  const [story, setStory] = useState<StoryResponse | null>(null);

  const { data: stories } = useSWR('/api/stories', fetcher, { refreshInterval: 60000 });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const payload: StoryResponse = await res.json();
    setStory(payload);
  };

  return (
    <main style={{ padding: 20, background: '#01030a', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', color: '#f8fafc' }}>
        <header>
          <h1>Story VeryLong</h1>
          <p>Create epics that stretch across chapters.</p>
        </header>
        <section style={{ display: 'flex', gap: 24, marginTop: 20 }}>
          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <label>Genre</label>
            <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}>
              <option>Fantasy</option>
              <option>Sci-Fi</option>
              <option>Thriller</option>
              <option>Romance</option>
            </select>
            <label>Tone</label>
            <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
              <option>epic</option>
              <option>mysterious</option>
              <option>fast</option>
            </select>
            <label>Chapters</label>
            <input type="number" value={form.chapters} min={3} max={12} onChange={(e) => setForm({ ...form, chapters: Number(e.target.value) })} />
            <label>Focus (optional)</label>
            <textarea value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} />
            <button type="submit" style={{ padding: 12, borderRadius: 12, border: 'none', background: '#38bdf8', color: '#020617' }}>
              Generate
            </button>
          </form>
          <div style={{ flex: 1, background: 'rgba(15,23,42,.8)', padding: 16, borderRadius: 16 }}>
            <h2>Story history</h2>
            <ul>
              {stories?.map((id: string) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
        </section>
        {story && (
          <article style={{ marginTop: 24, background: 'rgba(15,23,42,.9)', padding: 18, borderRadius: 16 }}>
            <h2>{story.title}</h2>
            <p>{story.summary}</p>
            {story.chapters.map((chapter, idx) => (
              <section key={idx} style={{ marginTop: 12 }}>
                <h3>Chapter {idx + 1}</h3>
                <p>{chapter}</p>
              </section>
            ))}
          </article>
        )}
      </div>
    </main>
  );
}
