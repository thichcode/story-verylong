# Frontend Cinematic Makeover

## Hero & Command Deck
- Rebuilt the hero into a glassy command deck layered with parallax spotlight gradients, neon glow beams, and a responsive motion accent. The CTA now flickers with a luminous animation and still targets `/api/ai/generate`, letting the UI queue cinematic sagas right from the hero.
- Live stats (progression, chapters, update time) sit over a blurred, glass-like card while glowing gradients reinforce the cinematic mood.

## Trending slider & pipeline ticker
- Added a horizontally scrolling `Trending sagas` slider so the freshest stories drift like film strips, complete with neon titles, chapter counts, and hover glows.
- Introduced a `Pipeline log ticker` that cycles through LLAMA status, latest chapter, and active saga counts atop a glass-etched rail.

## Spotlight & gallery
- Spotlight cards highlight top sagas with scroll-reactive glow layers, hover-activated lifts, and neon CTA pills that respond to movement.
- The gallery retains the mood board layout but now benefits from darker glass panels, stronger neon hover halos, and lighting highlights to feel more like a cinematic gallery wall.
- Filters, tags, and setup controls lean into glassmorphism (soft borders, blur, gradient shadows) for a cohesive command-center aesthetic.

## Reader experience
- The reader page now embraces gradient light beams, glassmorphic main panels, and backdrop-filter treatments so the content feels clipped inside a holo-safe room.
- Sticky header/toolbars sport blurred glass, ionic borders, and responsive stacking for smaller screens while the chapter nav and Read/Continue buttons glow with neon motion states.
- A new "Spotlight feed" sits below the chapter with pacing badges, focus highlights, and glow cards for upcoming `next_paths`, giving the reader a cinematic preview of the AI-generated arc queue.

Ship this branch with `npm run build`/`npm run start` after ensuring `/api/system/status` and `/api/ai/generate` remain wired to the backend tokens so the CTA, slider, and ticker stay lit.
